// #87 (a player's report on v10.10.1-beta.3): taking an heirloom threw "Cannot read properties of undefined (reading
// 'bagsFull')" (a G.G.bagsFull typo, there since v2.6.0). With room it lands in the bags; with full bags it says so and
// costs nothing, not even Marks for one bought for the first time.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

const id = Object.keys(D.HEIRLOOMS)[0], cost = D.HEIRLOOMS[id].cost;
const marks = () => G.account().marks;
const fillBags = (P) => { while (!G.bagsFull()) P.bags.push({ item: G.copyItem('linen_cloth'), n: 1 }); };

test('taking an heirloom with room puts it in the bags', () => {
  const { P } = character(16, 'mage', 'orc');
  const before = marks();
  assert.doesNotThrow(() => G.buyHeirloom(id));
  assert.ok(P.bags.some((b) => b.item.heirloom && b.item.id === id), 'the heirloom is in the bags');
  assert.ok(marks() <= before, 'Marks were not added');
});

test('with full bags: no throw, no Marks taken, nothing added', () => {
  const { P } = character(16, 'mage', 'orc');
  const a = G.account(); a.heirlooms = a.heirlooms.filter((x) => x !== id); a.marks = cost + 10; G.saveAccount(a);
  fillBags(P); const n = P.bags.length, before = marks();
  assert.doesNotThrow(() => G.buyHeirloom(id));
  assert.strictEqual(P.bags.length, n, 'nothing was added');
  assert.strictEqual(marks(), before, 'no Marks were taken');
  assert.ok(!G.account().heirlooms.includes(id), 'not marked as bought');
});

test('a copy of one already bought, with full bags: no throw', () => {
  const { P } = character(16, 'mage', 'orc');
  const a = G.account(); if (!a.heirlooms.includes(id)) a.heirlooms.push(id); G.saveAccount(a);
  fillBags(P);
  assert.doesNotThrow(() => G.buyHeirloom(id));
});
