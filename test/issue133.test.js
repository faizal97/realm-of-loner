// Sort bags (#133): equipment, consumables, trade goods, quest items, then junk last; inside each, highest quality, then
// highest level; stacks of the same item merge (up to 20). Nothing is gained or lost.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

const first = (slot, f) => Object.keys(D.ITEMS).find((k) => D.ITEMS[k].slot === slot && (!f || f(D.ITEMS[k])));

test('a mixed bag sorts by type, quality and level, junk last, with stacks merged', () => {
  const { P } = character(30, 'warrior', 'human');
  const mat = first('mat'), food = first('food'), pot = first('potion'), junk = first('junk'), rec = first('recipe'), bag = first('bag');
  const g = (q, lvl) => { const it = G.genGear('chest', lvl, q, { atype: 'mail' }); it.name = `chest q${q} l${lvl}`; return it; };
  P.bags = [
    { item: G.copyItem(junk), n: 3 },
    { item: G.copyItem(mat), n: 15 },
    { item: g(2, 10), n: 1 },
    { item: G.copyItem(food), n: 4 },
    { item: G.copyItem(mat), n: 10 },
    { item: G.copyItem(rec), n: 1 },
    { item: g(3, 5), n: 1 },
    { item: G.copyItem(pot), n: 2 },
    { item: g(2, 20), n: 1 },
    { item: G.copyItem(bag), n: 1 },
  ];
  const before = {}; for (const b of P.bags) before[b.item.id] = (before[b.item.id] || 0) + b.n;
  const moved = G.sortBags();
  assert.ok(moved, 'the order changed');
  const order = P.bags.map((b) => b.item.slot);
  assert.deepStrictEqual(order.slice(0, 4).map((s) => s === 'chest' || s === 'bag'), [true, true, true, true], 'equipment first');
  assert.deepStrictEqual(P.bags.filter((b) => b.item.slot === 'chest').map((b) => b.item.name), ['chest q3 l5', 'chest q2 l20', 'chest q2 l10'], 'quality, then level');
  assert.deepStrictEqual(order.slice(4, 6).sort(), ['food', 'potion'], 'consumables');
  assert.deepStrictEqual(order.slice(6, 9).sort(), ['mat', 'mat', 'recipe'], 'then trade goods');
  assert.strictEqual(order[9], 'junk', 'junk last');
  assert.deepStrictEqual(P.bags.filter((b) => b.item.id === mat).map((b) => b.n), [20, 5], 'stacks merge up to 20');
  const after = {}; for (const b of P.bags) after[b.item.id] = (after[b.item.id] || 0) + b.n;
  assert.deepStrictEqual(after, before, 'nothing gained or lost');
  assert.strictEqual(G.sortBags(), false, 'sorting a sorted bag changes nothing');
});

test('a grey item of any type sorts with the junk', () => {
  const { P } = character(10, 'warrior', 'human');
  const grey = G.genGear('legs', 8, 0, { atype: 'mail' }), food = first('food');
  P.bags = [{ item: grey, n: 1 }, { item: G.copyItem(food), n: 1 }];
  G.sortBags();
  assert.deepStrictEqual(P.bags.map((b) => b.item.slot), ['food', 'legs']);
});
