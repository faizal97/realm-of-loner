// Taking a stack out of the bank with full bags (#163): the guard let it through when any stack of the item was in the
// bags, even a full one (20), then removed it from the bank before the add failed, so the stack was deleted. Now a full
// stack doesn't count as room, and the bank keeps the item unless it reached the bags.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

const ore = () => Object.keys(D.ITEMS).find((k) => G.stackable(D.ITEMS[k]) && !G.isQuestItem(k) && /ore/i.test(D.ITEMS[k].name));
function fullBagsWith(n) {
  const { P } = character(20, 'warrior', 'human');
  const k = ore(); P.bags = [{ item: G.copyItem(k), n }];
  while (!G.bagsFull()) P.bags.push({ item: G.genGear('legs', 20, 1), n: 1 });
  P.bank = [{ item: G.copyItem(k), n: 7 }];
  return { P, k };
}

test('full bags and a full stack of 20: the ore stays in the bank', () => {
  const { P, k } = fullBagsWith(20);
  const before = G.countItem(k) + P.bank.reduce((a, b) => a + (b.item.id === k ? b.n : 0), 0);
  G.bankWithdraw(0);
  assert.strictEqual(P.bank.length, 1, 'still in the bank');
  assert.strictEqual(P.bank[0].n, 7);
  const after = G.countItem(k) + P.bank.reduce((a, b) => a + (b.item.id === k ? b.n : 0), 0);
  assert.strictEqual(after, before, 'no ore lost');
});

test('full bags and a stack with room: the ore joins it', () => {
  const { P, k } = fullBagsWith(5);
  G.bankWithdraw(0);
  assert.strictEqual(P.bank.length, 0, 'out of the bank');
  assert.strictEqual(G.countItem(k), 12);
});
