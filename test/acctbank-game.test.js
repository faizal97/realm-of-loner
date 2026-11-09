// The account bank in the game (#286): what goes in (the auction-house rule), its slots and Mark tabs, items moving
// between two characters, and the write order that turns a crash between two saves into a copy, never a loss.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character, store } = require('./world');

const potionId = () => Object.keys(D.ITEMS).find((k) => D.ITEMS[k].slot === 'potion' && G.stackable(D.ITEMS[k]) && G.abankTakes(D.ITEMS[k]));
const eventId = () => Object.keys(D.ITEMS).find((k) => D.ITEMS[k].event && G.stackable(D.ITEMS[k]));
const fresh = () => { const a = G.account(); delete a.bank; a.marks = 2000; G.saveAccount(a); };
const toasts = []; G.on && G.on('toast', (t) => toasts.push(t));
const bankTotal = (key) => G.abank() && require('../src/acctbank.js').view(G.abank()).filter((g) => g.key === key || g.item.id === key).reduce((s, g) => s + g.n, 0);
const bagTotal = (P, id) => P.bags.filter((b) => b.item.id === id).reduce((s, b) => s + b.n, 0);

test('only what the auction house takes goes in: potions and gear yes; heirlooms and festival items no', () => {
  const { P } = character(30); fresh();
  const pid = potionId(), eid = eventId();
  P.bags = [{ item: G.copyItem(pid), n: 5 }, { item: G.genGear('legs', 30, 2), n: 1 }, { item: G.makeHeirloom('heirloom_blade', 30), n: 1 }, { item: G.copyItem(eid), n: 2 }];
  assert.ok(G.abankDeposit(3) === false && P.bags.length === 4, 'a festival item stays in the bags');
  assert.ok(G.abankDeposit(2) === false && P.bags.length === 4, 'an heirloom stays in the bags');
  assert.ok(G.abankDeposit(1) && G.abankDeposit(0), 'gear and potions go in');
  assert.strictEqual(P.bags.length, 2);
  assert.strictEqual(bankTotal(pid), 5);
});

test('12 slots free, then tabs of 12 for 200, 400 and 800 Marks', () => {
  const { P } = character(30); fresh();
  P.bags = []; for (let i = 0; i < 13; i++) P.bags.push({ item: G.genGear('legs', 30, 2), n: 1 });
  for (let i = 0; i < 12; i++) assert.ok(G.abankDeposit(0), 'slot ' + (i + 1));
  assert.strictEqual(G.abankDeposit(0), false, 'the 13th is refused while the bank has 12 slots');
  assert.ok(G.abankBuyTab()); assert.strictEqual(G.account().marks, 1800); assert.strictEqual(G.abankSlots(), 24);
  assert.ok(G.abankDeposit(0), 'with a tab it fits');
  assert.ok(G.abankBuyTab()); assert.strictEqual(G.account().marks, 1400);
  assert.ok(G.abankBuyTab()); assert.strictEqual(G.account().marks, 600); assert.strictEqual(G.abankSlots(), 48);
  assert.strictEqual(G.abankBuyTab(), false, 'there are only three tabs');
  const a = G.account(); a.marks = 100; G.saveAccount(a); delete a.bank;
});

test('not enough Marks buys no tab and spends nothing', () => {
  character(30); const a = G.account(); delete a.bank; a.marks = 150; G.saveAccount(a);
  assert.strictEqual(G.abankBuyTab(), false);
  assert.strictEqual(G.account().marks, 150);
  assert.strictEqual(G.abankSlots(), 12);
});

test('a stack put in by one character comes out for another, as far as the bags have room', () => {
  const pid = potionId();
  const one = character(30); fresh();
  one.P.bags = [{ item: G.copyItem(pid), n: 20 }, { item: G.copyItem(pid), n: 15 }];
  assert.ok(G.abankDeposit(0) && G.abankDeposit(0));
  assert.strictEqual(bankTotal(pid), 35);
  const two = character(12, 'priest');
  two.P.bags = []; while (two.P.bags.length < G.bagCap() - 1) two.P.bags.push({ item: G.genGear('legs', 12, 1), n: 1 });
  assert.ok(G.abankWithdraw(pid));
  assert.strictEqual(bagTotal(two.P, pid), 20, 'one free slot takes one stack of 20');
  assert.strictEqual(bankTotal(pid), 15, 'the rest stays in the account bank');
  assert.ok(!G.abankWithdraw(pid), 'full bags take nothing');
  assert.strictEqual(bankTotal(pid), 15);
});

test('a piece of gear keeps its stats and its level requirement', () => {
  const one = character(50); fresh();
  const sword = G.genGear('weapon', 50, 3); one.P.bags = [{ item: sword, n: 1 }];
  const want = JSON.stringify(sword);
  assert.ok(G.abankDeposit(0));
  const two = character(15, 'warrior'); two.P.bags = [];
  const key = require('../src/acctbank.js').view(G.abank())[0].key;
  assert.ok(G.abankWithdraw(key));
  assert.strictEqual(JSON.stringify(two.P.bags[0].item), want);
  assert.strictEqual(G.equip(0), `Requires level ${sword.lvl}.`, 'a level-15 alt cannot wear it yet');
});

test('each move writes the receiving side first', () => {
  const { P } = character(30); fresh();
  const pid = potionId(); P.bags = [{ item: G.copyItem(pid), n: 3 }];
  const keys = []; const set = store.setItem; store.setItem = (k, v) => { keys.push(k); return set(k, v); };
  try {
    G.abankDeposit(0);
    const firstChar = keys.findIndex((k) => k.startsWith('azsolo.char.'));
    assert.ok(keys.indexOf('azsolo.account') > -1 && keys.indexOf('azsolo.account') < firstChar, 'deposit: the account bank, then the character');
    keys.length = 0;
    G.abankWithdraw(pid);
    const acc = keys.indexOf('azsolo.account'), ch = keys.findIndex((k) => k.startsWith('azsolo.char.'));
    assert.ok(ch > -1 && ch < acc, 'withdraw: the character, then the account bank');
  } finally { store.setItem = set; }
});

test('a crash between the two writes of a deposit leaves a copy, not a loss', () => {
  const { S, P } = character(30); fresh();
  const pid = potionId(); P.bags = [{ item: G.copyItem(pid), n: 4 }]; G.save();
  const save = G.save; G.save = () => { throw new Error('killed'); };
  try { assert.throws(() => G.abankDeposit(0)); } finally { G.save = save; }
  const saved = JSON.parse(store.getItem('azsolo.char.' + S.id));
  assert.strictEqual(saved.player.bags.filter((b) => b.item.id === pid).reduce((s, b) => s + b.n, 0), 4, 'the saved character still has them');
  assert.strictEqual(bankTotal(pid), 4, 'and so does the account bank');
});
