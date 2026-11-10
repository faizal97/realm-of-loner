// #549: Sort merged before splitting old stacks over 20, so part stacks were left and a second press changed the order;
// an old 45 with one free slot stayed at 45. Now it splits first (as far as the room goes), then merges.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

const ore = Object.keys(D.ITEMS).find((k) => D.ITEMS[k].slot === 'mat' && !G.isQuestItem(k));
const sortOf = (arr, free) => {
  const { P } = character(30); P.bagsEq = []; P.bags = arr.map((n) => ({ item: G.copyItem(ore), n }));
  if (free != null) while (P.bags.length < G.bagCap() - free) P.bags.push({ item: G.genGear('legs', 30, 2), n: 1 });
  G.sortBags(); const once = P.bags.filter((b) => b.item.id === ore).map((b) => b.n);
  assert.strictEqual(G.sortBags(), false, 'a second Sort changes nothing');
  return once;
};

test('one Sort merges fully', () => {
  assert.deepStrictEqual(sortOf([15, 30, 10]), [20, 20, 15]);
  assert.deepStrictEqual(sortOf([30, 5]), [20, 15]);
});

test('an old 45 splits as far as the room goes', () => {
  assert.deepStrictEqual(sortOf([45]), [20, 20, 5]);
  assert.deepStrictEqual(sortOf([45], 0), [45], 'no room: nothing to split into');
  assert.deepStrictEqual(sortOf([45], 1), [25, 20], 'one free slot: one piece of 20 comes off');
});
