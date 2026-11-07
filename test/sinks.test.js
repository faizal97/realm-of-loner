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

test('Reforge costs 20 x 1.5^n per item, rerolls the effect or stats at the same budget, and Revert brings it back (#503)', () => {
  const { P } = character(60, 'warrior', 'human');
  const id = Object.keys(D.ITEMS).find((k) => { const i = D.ITEMS[k]; return i.effect && i.lvl >= 57 && i.q >= 3 && D.effectCost(i.effect) > 0; });
  G.addItem(G.copyItem(id), 1); const bag = P.bags.length - 1, where = { bag };
  const a = G.account(); a.marks = 1000; G.saveAccount(a);
  const it0 = JSON.parse(JSON.stringify(P.bags[bag].item)), sum = (st) => Object.values(st).reduce((x, y) => x + y, 0);
  assert.strictEqual(G.reforgeCost(it0), 20);
  const r = G.reforge(where, 'stats');
  assert.ok(r && r.cost === 20 && G.account().marks === 980);
  assert.strictEqual(sum(r.next.stats), sum(it0.stats), 'stats: same total');
  assert.notDeepStrictEqual(Object.keys(r.next.stats).sort(), Object.keys(it0.stats).sort(), 'stats: a new pair');
  assert.strictEqual(G.reforgeCost(P.bags[bag].item), 30);
  assert.strictEqual(G.reforgeRevert(), true);
  assert.deepStrictEqual(P.bags[bag].item.stats, it0.stats, 'Revert: the old stats');
  assert.strictEqual(G.reforgeCost(P.bags[bag].item), 30, 'a revert keeps the count: the Marks were spent');
  const e = G.reforge(where, 'effect'); G.reforgeKeep();
  assert.notStrictEqual(e.next.effect, it0.effect);
  const want = Math.round(sum(it0.stats) * (1 - D.effectCost(e.next.effect)) / (1 - D.effectCost(it0.effect)));
  assert.ok(Math.abs(sum(e.next.stats) - want) <= Object.keys(it0.stats).length, `effect: stats re-priced by the effects' costs (${sum(e.next.stats)} vs ${want})`);
  assert.strictEqual(e.cost, 30); assert.strictEqual(G.reforgeCost(P.bags[bag].item), 45);
});

test('Reforge needs a level-57+ blue or purple, an effect to reroll one, and enough Marks (#503)', () => {
  const { P } = character(60, 'warrior', 'human');
  assert.strictEqual(G.canReforge({ slot: 'chest', q: 2, lvl: 60, stats: { str: 5 } }, 'stats'), false, 'not a green');
  assert.strictEqual(G.canReforge({ slot: 'chest', q: 3, lvl: 40, stats: { str: 5 } }, 'stats'), false, 'not below 57');
  assert.strictEqual(G.canReforge({ slot: 'chest', q: 3, lvl: 60, stats: { str: 5 } }, 'effect'), false, 'no effect to reroll');
  assert.strictEqual(G.canReforge({ slot: 'chest', q: 4, lvl: 60, stats: { str: 5 } }, 'stats'), true);
  G.addItem({ id: 'rf_test', name: 'Test Plate', slot: 'chest', q: 4, lvl: 60, stats: { str: 9, sta: 9 }, sell: 1 }, 1);
  const a = G.account(); a.marks = 5; G.saveAccount(a);
  assert.strictEqual(G.reforge({ bag: P.bags.length - 1 }, 'stats'), null);
  assert.strictEqual(G.account().marks, 5);
});
