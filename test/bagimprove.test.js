// Bag and bank improvements on beta.3: Store materials (both banks), Sort bank, upgrades first in Sort, crafting from
// the bank (and a refund that puts bank materials back in the bank), and buying back the last 12 sales.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character, advance } = require('./world');
const AB = require('../src/acctbank.js');

const mats = Object.keys(D.ITEMS).filter((k) => D.ITEMS[k].slot === 'mat' && G.stackable(D.ITEMS[k]) && !G.isQuestItem(k) && G.abankTakes(D.ITEMS[k]));
const gear = () => G.genGear('legs', 30, 2);
const sum = (l, id) => (l || []).filter((b) => b.item.id === id).reduce((a, b) => a + b.n, 0);
const gearRecipe = () => Object.keys(D.RECIPES).find((k) => { const r = D.RECIPES[k]; return r.prof !== 'cooking' && D.GEAR_SLOTS.includes(D.ITEMS[r.makes].slot) && r.n === 1; });

test('Store materials moves trade goods onto their bank stacks and leaves gear', () => {
  const { P } = character(30); const [a, b] = mats;
  P.bank = [{ item: G.copyItem(a), n: 15 }];
  P.bags = [{ item: G.copyItem(a), n: 8 }, { item: G.copyItem(b), n: 3 }, { item: gear(), n: 1 }];
  const r = G.bankStoreMats();
  assert.deepStrictEqual(r, { moved: 2, left: 0 });
  assert.strictEqual(P.bags.length, 1); assert.strictEqual(sum(P.bank, a), 23); assert.strictEqual(sum(P.bank, b), 3);
  assert.ok(P.bank.every((x) => x.n <= 20));
});

test('Store materials stops at a full bank and keeps the rest in the bags', () => {
  const { P } = character(30); const [a] = mats;
  P.bank = []; while (P.bank.length < G.bankSlots()) P.bank.push({ item: gear(), n: 1 });
  P.bags = [{ item: G.copyItem(a), n: 5 }];
  assert.deepStrictEqual(G.bankStoreMats(), { moved: 0, left: 1 }); assert.strictEqual(sum(P.bags, a), 5);
});

test('Store materials into the account bank, in one write', () => {
  const { P } = character(30); const a0 = G.account(); delete a0.bank; G.saveAccount(a0);
  const [a, b] = mats; P.bags = [{ item: G.copyItem(a), n: 7 }, { item: G.copyItem(b), n: 2 }, { item: gear(), n: 1 }];
  const r = G.abankStoreMats();
  assert.strictEqual(r.moved, 2); assert.strictEqual(P.bags.length, 1);
  const v = AB.view(G.abank()); assert.strictEqual(v.find((g) => g.item.id === a).n, 7); assert.strictEqual(v.find((g) => g.item.id === b).n, 2);
});

test('Sort bank merges stacks', () => {
  const { P } = character(30); const [a] = mats;
  P.bank = [{ item: gear(), n: 1 }, { item: G.copyItem(a), n: 6 }, { item: G.copyItem(a), n: 9 }];
  assert.strictEqual(G.sortBank(), true); assert.strictEqual(P.bank.length, 2); assert.strictEqual(sum(P.bank, a), 15);
});

test('Sort puts an upgrade ahead of other gear', () => {
  const { P } = character(30);
  const up = Object.assign(gear(), { name: 'Zz Upgrade' }), plain = Object.assign(gear(), { name: 'Aa Plain' });
  const real = G.isUpgrade; G.isUpgrade = (it) => it === up;
  try { P.bags = [{ item: plain, n: 1 }, { item: up, n: 1 }]; G.sortBags(); } finally { G.isUpgrade = real; }
  assert.strictEqual(P.bags[0].item, up);
});

test('crafting uses materials in the bank, bags first', () => {
  const { P } = character(30); const rid = gearRecipe(), r = D.RECIPES[rid];
  G.profs()[r.prof] = { skill: 300, max: 300, known: [rid] };
  P.bags = []; P.bank = []; for (const m in r.mats) P.bank.push({ item: G.copyItem(m), n: r.mats[m] });
  assert.strictEqual(G.craftable(rid), 1);
  assert.strictEqual(G.craft(rid, 1), true);
  for (let i = 0; i < 5 && P.casting; i++) advance(1.6);
  assert.ok(P.bags.some((b) => b.item.name === D.ITEMS[r.makes].name), 'made');
  for (const m in r.mats) assert.strictEqual(sum(P.bank, m), 0);
});

test('a craft that cannot fit its result puts bank materials back in the bank', () => {
  const { P } = character(30); const rid = gearRecipe(), r = D.RECIPES[rid];
  G.profs()[r.prof] = { skill: 300, max: 300, known: [rid] };
  P.bags = []; P.bank = []; for (const m in r.mats) P.bank.push({ item: G.copyItem(m), n: r.mats[m] });
  P.bags.push({ item: gear(), n: 1 }); G.craft(rid, 1); // started with room
  while (P.bags.length < G.bagCap()) P.bags.push({ item: gear(), n: 1 }); // then the bags fill
  for (let i = 0; i < 5 && P.casting; i++) advance(1.6);
  for (const m in r.mats) assert.strictEqual(sum(P.bank, m), r.mats[m], 'back in the bank');
});

test('the last 12 sales can be bought back for what they sold for', () => {
  const { P } = character(30); P.buyback = [];
  for (let i = 0; i < 14; i++) { P.bags = [{ item: gear(), n: 1 }]; G.sell(0); }
  assert.strictEqual(P.buyback.length, 12);
  const x = P.buyback[0], money = P.money;
  assert.strictEqual(G.buyBack(0), true);
  assert.strictEqual(P.money, money - x.price); assert.strictEqual(P.bags[0].item, x.item); assert.strictEqual(P.buyback.length, 11);
});

test('buyback refuses with full bags or too little money, and takes nothing', () => {
  const { P } = character(30); P.buyback = []; P.bags = [{ item: gear(), n: 1 }]; G.sell(0);
  while (P.bags.length < G.bagCap()) P.bags.push({ item: gear(), n: 1 });
  const money = P.money;
  assert.strictEqual(G.buyBack(0), false); assert.strictEqual(P.money, money); assert.strictEqual(P.buyback.length, 1);
  P.bags = []; P.money = 0;
  assert.strictEqual(G.buyBack(0), false); assert.strictEqual(P.buyback.length, 1);
});
