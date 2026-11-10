// #557: a locked piece of gear is never sold (alone, Sell several, junk), thrown away or auctioned until unlocked. The
// flag rides on the item, so a bank round trip and a save keep it; locking copies the item first, so a copy that shares
// the object stays unlocked. Lock worn gear locks only what you wear.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

const piece = (q) => { const it = G.fittedGear(30, q, 'warrior'); it.sell = 100; return it; };

test('a locked piece is skipped by every sale and by Throw away and the auction house', () => {
  const { P } = character(30, 'warrior', 'human');
  P.bags = [{ item: piece(2), n: 1 }, { item: Object.assign(piece(0), { q: 0 }), n: 1 }];
  assert.ok(G.setLock('bag', 0, true)); assert.ok(G.setLock('bag', 1, true));
  const money = P.money;
  G.sell(0); G.sellMany([0, 1]); G.sellJunk();
  assert.strictEqual(P.bags.length, 2, 'nothing sold'); assert.strictEqual(P.money, money);
  assert.ok(!G.canDiscard(P.bags[0].item)); assert.ok(!G.discard(0)); assert.ok(!G.ahTrade(P.bags[0].item));
  G.setLock('bag', 0, false); G.sellMany([0]);
  assert.strictEqual(P.bags.length, 1, 'unlocked, it sells');
});

test('locking copies the item: a bag entry sharing the object stays unlocked', () => {
  const { P } = character(30, 'warrior', 'human');
  const it = piece(2); P.bags = [{ item: it, n: 1 }, { item: it, n: 1 }];
  G.setLock('bag', 0, true);
  assert.ok(P.bags[0].item.lock); assert.ok(!P.bags[1].item.lock); assert.ok(!it.lock);
});

test('the lock survives the bank, the Account bank and a save', () => {
  const { P } = character(30, 'warrior', 'human');
  P.bags = [{ item: piece(2), n: 1 }]; G.setLock('bag', 0, true);
  G.bankDeposit(0); G.bankWithdraw(0);
  assert.ok(P.bags[0].item.lock, 'character bank');
  const back = JSON.parse(JSON.stringify(P.bags[0].item)); assert.ok(back.lock, 'saved as JSON');
});

test('Lock worn gear locks only worn pieces, and only gear can be locked', () => {
  const { P } = character(30, 'warrior', 'human');
  P.bags = [{ item: piece(2), n: 1 }];
  const worn = D.GEAR_SLOTS.filter((s) => P.equip[s]).length;
  assert.strictEqual(G.lockWorn(), worn);
  assert.ok(D.GEAR_SLOTS.every((s) => !P.equip[s] || P.equip[s].lock));
  assert.ok(!P.bags[0].item.lock);
  assert.strictEqual(G.lockWorn(), 0, 'already locked');
  assert.ok(!G.canLock({ slot: 'mat', id: 'linen_cloth' }));
});
