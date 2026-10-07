// Levelling gear (#141): below 60 a generated blue is about 20% over a green and greens and blues roll +-10%; a fixed
// blue is never weaker than a random blue; from level 30 a dungeon's final boss (2%) and a levelling rare (5%) can drop
// a purple that fits the class. Level-60 gear is unchanged.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character, advance } = require('./world');

const sum = (it) => Object.values(it.stats || {}).reduce((a, v) => a + v, 0);
const many = (n, slot, L, q) => Array.from({ length: n }, () => sum(G.genGear(slot, L, q, { atype: 'mail' })));
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;

test('below 60: a blue is about 20% over a green, and both roll about +-10% around their budget', () => {
  character(40);
  for (const L of [20, 40]) {
    const g = many(400, 'chest', L, 2), b = many(400, 'chest', L, 3);
    const ratio = mean(b) / mean(g);
    assert.ok(ratio > 1.15 && ratio < 1.25, `L${L}: blue/green ${ratio.toFixed(2)}`);
    for (const [arr, q] of [[g, 2], [b, 3]]) {
      const base = D.gearBudget(L, q);
      assert.ok(Math.min(...arr) >= Math.round(base * 0.9) - 1 && Math.max(...arr) <= Math.round(base * 1.1) + 1, `L${L} q${q}: ${Math.min(...arr)}-${Math.max(...arr)} around ${base.toFixed(1)}`);
      assert.ok(Math.max(...arr) - Math.min(...arr) >= 2, `L${L} q${q}: a real spread`);
    }
  }
});

test('level 60 generated gear is exactly as before (no roll, the v10.4 budgets)', () => {
  character(60);
  assert.deepStrictEqual([...new Set(many(60, 'chest', 60, 2))], [Math.round(60 * 0.55 + 1)]);
  assert.deepStrictEqual([...new Set(many(60, 'chest', 60, 3))], [Math.round(60 * 0.55 + 2)]);
  assert.deepStrictEqual([...new Set(many(60, 'chest', 60, 4))], [Math.round(60 * 0.64 + 2)]);
});

test('no fixed blue below 60 is weaker than a random blue of its level', () => {
  const low = Object.entries(D.ITEMS).filter(([, it]) => it.q === 3 && it.lvl < 60 && sum(it) > 0 && sum(it) < Math.round(D.gearBudget(it.lvl, 3)));
  assert.deepStrictEqual(low.map(([id]) => id), []);
});

test('purples before 60: none below level 30, about 2% from a final boss and 5% from a rare, fitted to the class', () => {
  const { P } = character(45, 'mage', 'human'); P.bags = []; P.bank = [];
  const draw = (kind, L, n) => { let c = 0; for (let i = 0; i < n; i++) { const it = G.epicDrop(kind, L); if (it) { c++; assert.strictEqual(it.q, 4); assert.ok(!it.atype || it.atype === D.CLASSES.mage.armorType, 'fits a mage'); P.bags = []; P.bank = []; } } return c / n; };
  assert.strictEqual(draw('boss', 29, 2000), 0); assert.strictEqual(draw('rare', 29, 2000), 0); assert.strictEqual(draw('rare', 60, 2000), 0);
  const b = draw('boss', 35, 6000), r = draw('rare', 50, 6000);
  assert.ok(b > 0.012 && b < 0.03, `final boss ${(b * 100).toFixed(1)}%`); assert.ok(r > 0.035 && r < 0.065, `rare ${(r * 100).toFixed(1)}%`);
});

test('a purple is never lost: with full bags it goes to the bank', () => {
  const { P } = character(45, 'warrior', 'human'); P.bank = [];
  while (P.bags.length < G.bagCap()) P.bags.push({ item: G.genGear('chest', 45, 0), n: 1 });
  const real = Math.random; let it; try { Math.random = () => 0.001; it = G.epicDrop('rare', 45); } finally { Math.random = real; }
  assert.ok(it && P.bank.some((b) => b.item === it), 'in the bank');
});

test('a dungeon run asks for its final boss purple once', () => {
  const { P } = character(35, 'warrior', 'human');
  const real = G.epicDrop, calls = []; G.epicDrop = (kind, L) => { calls.push([kind, L]); return null; };
  try {
    G.startRoulette();
    for (let i = 0; i < 20000 && G.S.run && G.S.run.phase !== 'done'; i++) {
      const R = G.S.run; if (R.phase === 'rest') { R.restUntil = 0; G.runPull(); }
      if (G.fight) for (const e of G.fight.enemies) e.hp = 1;
      advance(0.25);
    }
    assert.ok(G.S.run && G.S.run.phase === 'done', 'the run was cleared');
  } finally { G.epicDrop = real; G.leaveGroup(); }
  assert.deepStrictEqual(calls.map((c) => c[0]), ['boss'], JSON.stringify(calls));
});
