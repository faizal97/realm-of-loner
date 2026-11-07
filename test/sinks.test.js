// Currency sinks at level 60 (#181, #500; docs/plans/2026-11-07-currency-sinks-design.md): what level-60 play pays in
// Mentor Marks and gold, and what spends them.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character, now, setNow } = require('./world');

test('a raid pays full Marks on its first clear of the week, then the dungeon rate; a new week pays full again (#501)', () => {
  character(60, 'warrior', 'human');
  const a0 = G.account().marks;
  assert.strictEqual(G.payClearMarks('molten_core'), 15);
  assert.strictEqual(G.payClearMarks('molten_core'), 5);
  assert.strictEqual(G.payClearMarks('molten_core'), 5);
  assert.strictEqual(G.payClearMarks('onyxias_lair'), 15, 'each raid has its own first clear');
  assert.strictEqual(G.payClearMarks('stratholme'), 5, 'a dungeon always pays 5');
  assert.strictEqual(G.account().marks - a0, 45);
  const t0 = now(); setNow(t0 + 7 * 86400000);
  assert.strictEqual(G.payClearMarks('molten_core'), 15, 'a new week pays the first clear again');
  setNow(t0);
});
