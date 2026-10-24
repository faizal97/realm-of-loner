// Pack pulls (#211): creatures of a kind standing together come as one pull when the player asks for the group, each at
// half a lone one's health, damage and XP; a plain pull is unchanged, and elites and rares never come as a pack.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, E, character } = require('./world');

// a place with at least 3 normal creatures of one kind alive
const packPlace = (lvl) => Object.keys(D.PLACES).find((k) => { const p = D.PLACES[k]; return !p.safe && (p.lvl || [0])[0] >= lvl && (p.mobs || []).some(([key, n]) => n >= 3 && !D.MOBS[key].elite && !D.MOBS[key].named); });
const setup = (lvl) => { const c = character(lvl, 'mage', 'human'); G.fight = null; c.P.place = packPlace(lvl); G.S.world = {}; return c; };
const enemies = () => G.fight.enemies;

test('a pack is 2 below creature level 20, then 3, of one kind', () => {
  setup(12);
  const m = G.placeMobs().find((x) => x.state === 'alive' && G.packFor(x.id));
  assert.ok(m, 'a pack at level 12');
  const p = G.packFor(m.id);
  assert.strictEqual(p.length, G.PACK.size(m.level));
  assert.ok(p.every((x) => x.key === m.key && x.state === 'alive'));
  assert.strictEqual(G.PACK.size(19), 2); assert.strictEqual(G.PACK.size(20), 3); assert.strictEqual(G.PACK.size(55), 3);
});

test('pulling the group brings the whole pack at half health and damage; a plain pull is one at full', () => {
  setup(30);
  const m = G.placeMobs().find((x) => x.state === 'alive' && G.packFor(x.id));
  const n = G.packFor(m.id).length;
  G.engage(m.id, null, true);
  assert.strictEqual(enemies().length, n, 'every pack creature in the fight at once');
  for (const e of enemies()) { const lone = E.mobUnit(e.key, e.level); assert.strictEqual(e.maxHp, Math.round(lone.maxHp * G.PACK.mult)); assert.ok(Math.abs(e.dmg[1] - lone.dmg[1] * G.PACK.mult) < 1e-6); assert.strictEqual(e.packXp, G.PACK.xp); }
  G.fight = null;
  setup(30);
  const m2 = G.placeMobs().find((x) => x.state === 'alive' && G.packFor(x.id));
  G.engage(m2.id);
  assert.ok(enemies()[0].maxHp === E.mobUnit(m2.key, m2.level).maxHp && !enemies()[0].packXp, 'a plain pull is unchanged');
  G.fight = null;
});

test('a pack creature gives half the XP of a lone one', () => {
  const { P } = setup(30); P.rested = 0;
  const m = G.placeMobs().find((x) => x.state === 'alive' && G.packFor(x.id));
  G.engage(m.id, null, true);
  const es = enemies().slice(), x0 = P.xp;
  for (const e of es) { e.hp = 0; e.dead = true; }
  for (let i = 0; i < 20 && G.fight; i++) G.update(0.25);
  const got = P.xp - x0, full = es.reduce((a, e) => a + G.xpForKill(e.level, false), 0);
  assert.ok(got > 0, 'XP for the pack');
  assert.ok(Math.abs(got - full * G.PACK.xp) <= es.length + full * 0.05, `half the XP (${got} of ${full})`);
  assert.ok(got < full, `less than lone kills (${got} of ${full})`);
  G.fight = null;
});

test('elites and rares never come as a pack', () => {
  setup(30);
  for (const m of G.placeMobs()) { const M = D.MOBS[m.key]; if (M.elite || M.named || m.id.startsWith('n_')) assert.strictEqual(G.packFor(m.id), null); }
});
