// Bags, bank and account-bank edge cases found by a test pass on beta.3: each one lost or stuck items.
// A refused save moved nothing on one side only; a chat swap paid with bags that filled after the button was drawn;
// an old stack over 20 went into the bank whole; an old save's quest item stayed stuck in the bank; Sort kept a 30 stack.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character, store } = require('./world');
const AB = require('../src/acctbank.js');

const ore = Object.keys(D.ITEMS).find((k) => D.ITEMS[k].slot === 'mat' && !G.isQuestItem(k));
const pid = Object.keys(D.ITEMS).find((k) => D.ITEMS[k].slot === 'potion' && G.stackable(D.ITEMS[k]) && G.abankTakes(D.ITEMS[k]));
const gear = () => G.genGear('legs', 30, 2);
const sum = (l, id) => l.filter((b) => b.item.id === id).reduce((a, b) => a + b.n, 0);
const bankN = (id) => AB.view(G.abank()).filter((g) => g.item.id === id).reduce((s, g) => s + g.n, 0);
const fresh = () => { const a = G.account(); delete a.bank; a.marks = 2000; G.saveAccount(a); };
const refuse = (re, fn) => { const real = store.setItem; store.setItem = (k, v) => { if (re.test(k)) throw new Error('QuotaExceededError'); return real(k, v); }; try { return fn(); } finally { store.setItem = real; } };

test('account deposit: storage refuses the account write, the item stays in the bags', () => {
  const { P } = character(30); fresh(); P.bags = [{ item: G.copyItem(pid), n: 4 }]; G.save();
  const r = refuse(/^azsolo\.account$/, () => G.abankDeposit(0));
  assert.strictEqual(r, false); assert.strictEqual(sum(P.bags, pid), 4); assert.strictEqual(bankN(pid), 0);
});

test('account withdraw: storage refuses the character write, the item stays in the account bank', () => {
  const { P } = character(30); fresh(); P.bags = []; G.save();
  { const a = G.account(); a.bank = AB.empty(); AB.deposit(a.bank, G.copyItem(pid), 4, true); G.saveAccount(a); }
  const r = refuse(/^azsolo\.char\./, () => G.abankWithdraw(pid));
  assert.strictEqual(r, false); assert.strictEqual(sum(P.bags, pid), 0); assert.strictEqual(bankN(pid), 4);
});

test('a chat swap tapped after the bags filled keeps the payment', () => {
  const { S, P } = character(30);
  P.bags = [{ item: G.copyItem(ore), n: 20 }, { item: G.copyItem(ore), n: 20 }]; const it = gear();
  const acts = globalThis.SOC.actions({ ch: 'whisper', act: { state: 'open', kind: 'swap', bot: S.bots[0].id, item: ore, n: 5, itemData: it } });
  assert.ok(!acts[0].disabled);
  while (P.bags.length < G.bagCap()) P.bags.push({ item: gear(), n: 1 }); // loot arrives while the whisper is open
  assert.strictEqual(acts[0].fn(), 'Your bags are full.');
  assert.strictEqual(sum(P.bags, ore), 40);
});

test('an old stack of 45 goes into the bank as stacks of 20, or not at all', () => {
  const { P } = character(30); P.bags = [{ item: G.copyItem(ore), n: 45 }]; P.bank = [];
  for (let i = 0; i < G.bankSlots() - 1; i++) P.bank.push({ item: gear(), n: 1 });
  G.bankDeposit(0); // one free slot: three stacks don't fit
  assert.strictEqual(sum(P.bags, ore), 45); assert.ok(P.bank.length <= G.bankSlots());
  P.bank = []; G.bankDeposit(0);
  assert.deepStrictEqual(P.bank.filter((b) => b.item.id === ore).map((b) => b.n).sort((a, b) => b - a), [20, 20, 5]);
});

test("an old save's quest item comes out of the bank even with full bags", () => {
  const { P } = character(30); const q = Object.keys(D.ITEMS).find((k) => G.isQuestItem(k));
  P.bags = []; for (let i = 0; i < G.bagCap(); i++) P.bags.push({ item: gear(), n: 1 });
  P.bank = [{ item: G.copyItem(q), n: 3 }];
  G.bankWithdraw(0);
  assert.strictEqual(P.bank.length, 0); assert.strictEqual((P.qitems || {})[q], 3);
});

test('Sort splits an old stack over 20', () => {
  const { P } = character(30); P.bags = [{ item: G.copyItem(ore), n: 5 }, { item: G.copyItem(ore), n: 45 }];
  G.sortBags();
  assert.ok(P.bags.every((b) => b.n <= 20)); assert.strictEqual(sum(P.bags, ore), 50);
});
