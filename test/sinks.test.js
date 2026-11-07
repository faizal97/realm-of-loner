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

test('a death takes 10% durability from worn gear, not rings or cloaks; a broken piece gives no stats (#502)', () => {
  const { P } = character(60, 'warrior', 'human');
  const slot = Object.keys(P.equip).find((s) => G.hasDur(P.equip[s], s) && Object.keys(P.equip[s].stats || {}).length);
  const ring = Object.keys(P.equip).find((s) => s === 'finger' || s === 'back');
  G.wear();
  assert.strictEqual(G.durOf(P.equip[slot]), 90);
  if (ring) assert.strictEqual(G.durOf(P.equip[ring]), 100, 'rings and cloaks never wear');
  const before = G.stats();
  P.equip[slot].dur = 0;
  const after = G.stats(), it = P.equip[slot];
  for (const k in it.stats) assert.ok(after[k] < before[k], `broken ${it.name} loses its ${k}`);
});

test('nothing wears before level 10 (#502)', () => {
  const { P } = character(5, 'mage', 'human');
  G.wear();
  for (const s in P.equip) assert.strictEqual(G.durOf(P.equip[s]), 100);
});

test('repairs cost gold by item level and quality, restore every piece, and a kit costs 25% more and only in a run (#502)', () => {
  const { S, P } = character(60, 'warrior', 'human');
  const it = { slot: 'chest', lvl: 60, q: 4, dur: 0 }, blue = Object.assign({}, it, { q: 3 }), low = Object.assign({}, it, { lvl: 30 });
  assert.ok(G.repairCost(it) > G.repairCost(blue) && G.repairCost(blue) > G.repairCost(low), 'purple > blue > lower level');
  assert.strictEqual(G.repairCost(Object.assign({}, it, { dur: 100 })), 0);
  G.wear(); G.wear();
  const cost = G.repairAllCost(); assert.ok(cost > 0);
  assert.strictEqual(G.repairAll(true), false, 'no kit outside a run');
  const m0 = P.money; assert.strictEqual(G.repairAll(false), true);
  assert.strictEqual(m0 - P.money, cost);
  for (const s in P.equip) assert.strictEqual(G.durOf(P.equip[s]), 100);
  G.wear(); S.run = { phase: 'rest' };
  assert.strictEqual(G.repairAllCost(true), Math.round(G.repairAllCost() * 1.25));
  const m1 = P.money, kc = G.repairAllCost(true); assert.strictEqual(G.repairAll(true), true); assert.strictEqual(m1 - P.money, kc);
  S.run = null;
});
