// #551: gear condition where it matters. G.gearCondition gives the lowest durability among worn pieces that wear, the
// broken count and the full repair cost, which the death recap, the Hero badge and the queue read.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, character } = require('./world');

test('lowest durability, broken pieces and the repair cost of what is worn', () => {
  const { P } = character(40);
  const slots = Object.keys(P.equip).filter((s) => G.hasDur(P.equip[s], s));
  assert.ok(slots.length >= 2, 'wearing pieces that wear');
  for (const s of slots) P.equip[s].dur = 100;
  assert.deepStrictEqual(G.gearCondition(), { low: 100, broken: 0, cost: 0 });
  P.equip[slots[0]].dur = 40; P.equip[slots[1]].dur = 0;
  const c = G.gearCondition();
  assert.strictEqual(c.low, 0); assert.strictEqual(c.broken, 1);
  assert.strictEqual(c.cost, G.repairAllCost(false)); assert.ok(c.cost > 0);
});
