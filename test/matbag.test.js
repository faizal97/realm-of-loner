// Materials bags (beta.3): a bag whose slots take only trade goods. One bag list, two limits: trade goods may use any
// slot, everything else only the backpack and normal bags. Every way in (loot, stacks, swaps, the bank) and every bag
// change (equip, swap, take off) keeps each item in a slot it may use.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

const ore = Object.keys(D.ITEMS).find((k) => G.isMatItem(D.ITEMS[k]) && G.stackable(D.ITEMS[k]));
const ore2 = Object.keys(D.ITEMS).filter((k) => G.isMatItem(D.ITEMS[k]) && G.stackable(D.ITEMS[k]))[1];
const gear = () => G.genGear('legs', 30, 2);
const withSatchel = () => { const { P } = character(30); P.bagsEq = [G.copyItem('gatherers_satchel')]; P.bags = []; return P; };
const fillGear = (P, n) => { for (let i = 0; i < n; i++) P.bags.push({ item: gear(), n: 1 }); };
const fillMats = (P, n) => { for (let i = 0; i < n; i++) P.bags.push({ item: G.copyItem(ore), n: 20 }); };

test('a Satchel adds 12 slots for trade goods only', () => {
  const P = withSatchel();
  assert.strictEqual(G.bagCap(), 28); assert.strictEqual(G.gearCap(), 16);
  fillGear(P, 16);
  assert.strictEqual(G.bagsFull(gear()), true, 'gear: full at 16');
  assert.strictEqual(G.addItem(gear(), 1), false);
  assert.strictEqual(G.bagFree(D.ITEMS[ore]), 12, 'trade goods: 12 more');
  assert.strictEqual(G.addItem(G.copyItem(ore), 20), true);
});

test('trade goods fill the materials slots first, then overflow into normal ones', () => {
  const P = withSatchel(); fillMats(P, 14); // 12 in the Satchel, 2 in the backpack
  assert.strictEqual(G.bagFree(gear()), 14);
  fillGear(P, 14);
  assert.strictEqual(G.bagFree(gear()), 0); assert.strictEqual(G.bagFree(D.ITEMS[ore]), 0);
});

test('slotsShort counts gear against normal slots', () => {
  const P = withSatchel(); fillGear(P, 15);
  assert.strictEqual(G.slotsShort([[gear(), 1]]), 0);
  assert.strictEqual(G.slotsShort([[gear(), 1], [gear(), 1]]), 1);
  assert.strictEqual(G.slotsShort([[G.copyItem(ore2), 40]]), 0, 'trade goods still fit');
});

test('taking off a Satchel full of trade goods is refused; with room it works', () => {
  const P = withSatchel(); fillMats(P, 12); fillGear(P, 4);
  G.unequipBag(0); assert.strictEqual(P.bagsEq.length, 1, 'refused: the ore has nowhere to go');
  P.bags = P.bags.slice(10); // 2 ore stacks + 4 gear + the Satchel itself = 7 of 16
  G.unequipBag(0); assert.strictEqual(P.bagsEq.length, 0);
});

test('a bag that would leave gear with no slot cannot be swapped for a materials bag', () => {
  const { P } = character(30); P.bags = [];
  P.bagsEq = ['linen_bag', 'linen_bag', 'linen_bag', 'linen_bag'].map(G.copyItem); // 16 + 24 = 40, all normal
  fillGear(P, 38); P.bags.push({ item: G.copyItem('foragers_haversack'), n: 1 });
  G.useItem ? G.useItem(P.bags.length - 1) : G.use(P.bags.length - 1);
  assert.ok(!P.bagsEq.some((b) => b.matBag), 'refused: 39 items, only 34 normal slots after the swap');
});

test('a chat swap pays in trade goods only when the gear has a normal slot', () => {
  const P = withSatchel(), S = G.S;
  fillGear(P, 15); fillMats(P, 12); P.bags.push({ item: G.copyItem(ore), n: 5 }); // 13 ore stacks: one overflows into the backpack
  const it = gear(), m = { ch: 'whisper', act: { state: 'open', kind: 'swap', bot: S.bots[0].id, item: ore, n: 5, itemData: it } };
  const acts = globalThis.SOC.actions(m);
  assert.strictEqual(G.bagFree(it), 0);
  // the 5 ore (the last stack) leave; 12 ore stacks fit the Satchel, so a backpack slot opens for the gear
  assert.ok(!acts[0].disabled); assert.notStrictEqual(acts[0].fn(), 'Your bags are full.');
  assert.ok(P.bags.some((b) => b.item === it || b.item.name === it.name));
});

test('the materials bags are made by Tailoring and sometimes on the auction house', () => {
  assert.ok(Object.values(D.RECIPES).some((r) => r.makes === 'gatherers_satchel' && r.prof === 'tailoring'));
  assert.ok(Object.values(D.RECIPES).some((r) => r.makes === 'foragers_haversack' && r.prof === 'tailoring'));
  character(50); const seen = new Set();
  for (let i = 0; i < 40; i++) { G.S.ah = null; G.ahListings().forEach((l) => seen.add(l.item.id)); }
  assert.ok(seen.has('foragers_haversack'));
  assert.ok(G.ahValue(D.ITEMS.gatherers_satchel) < G.ahValue(D.ITEMS.foragers_haversack));
});
