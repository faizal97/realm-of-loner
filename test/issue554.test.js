// #554: a lone stack over 20 (an old save) can be sorted: Sort splits it into stacks of 20 when there's room.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, character } = require('./world');

test('one stack of 45 with room sorts into 20, 20, 5', () => {
  const { P } = character(10);
  P.bags = [{ item: G.copyItem('linen_cloth'), n: 45 }];
  assert.ok(G.sortBags(), 'sorting changes something');
  assert.deepStrictEqual(P.bags.map((b) => b.n), [20, 20, 5]);
});
