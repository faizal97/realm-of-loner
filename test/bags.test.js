// The Bags tab's free-slot badge (#90): nothing with 4 or more free, the count at 3 or fewer, "Full" at none; read from the
// bags' real capacity, so an equipped bag moves the threshold with no change.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

const fillTo = (P, free) => { P.bags.length = 0; while (G.bagCap() - P.bags.length > free) P.bags.push({ item: G.copyItem('linen_cloth'), n: 1 }); };

test('4 free: no badge', () => { const { P } = character(16, 'mage', 'orc'); fillTo(P, 4); assert.strictEqual(G.bagFree(), 4); assert.strictEqual(G.bagBadge(), null); });
test('3 free: the count, not full', () => { const { P } = character(16, 'mage', 'orc'); fillTo(P, 3); assert.deepStrictEqual(G.bagBadge(), { full: false, text: '3', n: 3 }); });
test('1 free: the count', () => { const { P } = character(16, 'mage', 'orc'); fillTo(P, 1); assert.deepStrictEqual(G.bagBadge(), { full: false, text: '1', n: 1 }); });
test('0 free: Full, the same moment the vendors say "Inventory is full"', () => {
  const { P } = character(16, 'mage', 'orc'); fillTo(P, 0);
  assert.deepStrictEqual(G.bagBadge(), { full: true, text: 'Full', n: 0 });
  assert.ok(G.bagsFull(), 'G.bagsFull agrees');
});
test('an equipped bag raises the capacity, and the badge follows it', () => {
  const { P } = character(16, 'mage', 'orc'); fillTo(P, 0); const cap = G.bagCap();
  const bag = Object.values(D.ITEMS).find((x) => x.bag >= 4);
  P.bagsEq = (P.bagsEq || []).concat([G.copyItem(bag.id)]);
  assert.strictEqual(G.bagCap(), cap + bag.bag);
  assert.strictEqual(G.bagFree(), bag.bag);
  assert.strictEqual(G.bagBadge() === null, bag.bag > G.BAG_WARN, `${bag.bag} free after equipping ${bag.name}`);
});
