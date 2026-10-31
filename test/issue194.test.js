// Heirlooms a little under quest gear (#194): at every level an heirloom's stat points, weapon damage and cloak armour
// are 90% of a fitted green's (D.gearBudget and the green damage curve), so a quest green is an upgrade and a blue a clear one.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

const dps = (it) => (it.dmg[0] + it.dmg[1]) / 2 / it.speed;
const greenDps = (L, staff) => (1.6 + L * 0.45) * 1.1 * (staff ? 1.35 : 1);

test('every heirloom sits at 90% of a green at levels 1 to 60', () => {
  character(10, 'warrior', 'human');
  for (const id in D.HEIRLOOMS) for (const L of [1, 5, 10, 20, 30, 40, 50, 59, 60]) {
    const it = G.makeHeirloom(id, L), pts = G.itemPoints(it), g = D.gearBudget(L, 2);
    assert.ok(Math.abs(pts - 0.9 * g) <= 1.5, `${id} L${L}: ${pts} points, green ${g}`);
    if (it.dmg && L >= 5) { const r = dps(it) / greenDps(L, it.wtype === 'staff'); assert.ok(r > 0.8 && r < 1, `${id} L${L}: damage ${r.toFixed(2)} of a green`); }
  }
});

test('at level 60 the heirloom hammer is below a green and below Emberfall', () => {
  character(60, 'warrior', 'human');
  const h = G.makeHeirloom('heirloom_hammer', 60), e = D.ITEMS.ragnaros_hammer;
  assert.ok(G.itemPoints(h) < D.gearBudget(60, 2), 'under a green');
  assert.ok(G.itemPoints(h) < G.itemPoints(e) && dps(h) < dps(e), 'under the raid mace');
});

test('the cloak\'s armour is 90% of a green cloak\'s', () => {
  character(30, 'warrior', 'human');
  const c = G.makeHeirloom('heirloom_cloak', 30), green = Math.round((D.SLOT_ARMOR.back || 3) * 0.3 * 32 * 0.9 * 1.1);
  assert.ok(Math.abs(c.armor - 0.9 * green) <= 1, `${c.armor} vs ${green}`);
});

test('the tooltip line says it grows with you and is a little weaker than quest gear', () => {
  assert.strictEqual(G.makeHeirloom('heirloom_ring', 20).source, 'Grows with you. A little weaker than quest gear. +5% experience.');
});
