// Spell queue (#249): a tap in the last 0.4 s of a cast or the global cooldown waits and fires the moment it ends; a
// newer tap replaces it; an earlier tap is refused as before and never cuts the cast short.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, E, character } = require('./world');

function castingMage() {
  const { P } = character(20, 'mage', 'human');
  P.place = Object.keys(D.PLACES).find((k) => { const p = D.PLACES[k]; return p.lvl && p.lvl[0] <= 20 && p.lvl[1] >= 20 && !p.safe && (p.mobs || []).length; });
  const m = G.placeMobs().find((x) => x.state === 'alive'); G.engage(m.id);
  const u = G.pUnit; u.res = u.maxRes; u.maxHp = u.hp = 1e6; // the mob can't end the test early
  G.useAbility('fireball'); assert.ok(u.cast && u.cast.ab === 'fireball', 'casting Fireball');
  for (const e of G.fight.enemies) { e.maxHp = e.hp = 1e7; } // nor die mid-test
  return { C: G.fight, u };
}
const stepUntil = (C, fn) => { for (let i = 0; i < 200 && !fn(); i++) E.tick(C, 0.1); assert.ok(fn(), 'reached the moment'); };

test('a tap in the last 0.4 s of a cast queues and starts the moment the cast ends', () => {
  const { C, u } = castingMage();
  const first = u.cast;
  stepUntil(C, () => first.end - C.t <= E.QUEUE_WINDOW);
  assert.strictEqual(G.useAbility('frostbolt'), null, 'not refused');
  assert.deepStrictEqual(u.queued && u.queued.ab, 'frostbolt');
  stepUntil(C, () => u.cast !== first);
  assert.ok(u.cast && u.cast.ab === 'frostbolt', 'Frostbolt began on the step Fireball finished');
  assert.ok(u.cast.start >= first.end - 1e-9 && u.cast.start < first.end + 0.1 + 1e-9, `no gap: started ${u.cast.start}, Fireball ended ${first.end}`);
  assert.strictEqual(u.queued, null);
});

test('an earlier tap is refused and leaves the cast alone', () => {
  const { C, u } = castingMage();
  const first = u.cast, end = first.end;
  E.tick(C, 0.1);
  assert.ok(first.end - C.t > E.QUEUE_WINDOW);
  assert.strictEqual(G.useAbility('frostbolt'), E.castingText('fireball'));
  assert.ok(!u.queued, 'nothing queued');
  assert.strictEqual(u.cast, first, 'still casting Fireball');
  assert.ok(first.end >= end, 'the cast was not cut short');
});

test('a newer tap replaces the queued spell; an instant goes off when its turn comes', () => {
  const { C, u } = castingMage();
  const first = u.cast;
  stepUntil(C, () => first.end - C.t <= E.QUEUE_WINDOW);
  G.useAbility('frostbolt'); G.useAbility('fire_blast');
  assert.strictEqual(u.queued.ab, 'fire_blast');
  stepUntil(C, () => !u.queued);
  assert.ok(u.cds.fire_blast > C.t, 'Fire Blast was used (its cooldown runs)');
  assert.ok(!u.cast || u.cast.ab !== 'frostbolt', 'Frostbolt was replaced');
});

test('a tap that would fail anyway is not queued: it says why straight away', () => {
  const { C, u } = castingMage();
  const first = u.cast;
  u.cds.fire_blast = C.t + 30;
  stepUntil(C, () => first.end - C.t <= E.QUEUE_WINDOW);
  assert.strictEqual(G.useAbility('fire_blast'), E.castingText('fireball'));
  assert.ok(!u.queued);
});

test('the global cooldown queues too: an instant then a cast, no gap', () => {
  const { C, u } = castingMage();
  stepUntil(C, () => !u.cast);
  stepUntil(C, () => u.gcdUntil <= C.t);
  assert.strictEqual(G.useAbility('fire_blast'), null); // instant: the global cooldown starts
  stepUntil(C, () => u.gcdUntil - C.t <= E.QUEUE_WINDOW);
  const gcdEnd = u.gcdUntil;
  assert.strictEqual(G.useAbility('frostbolt'), null);
  assert.strictEqual(u.queued.ab, 'frostbolt');
  stepUntil(C, () => !!u.cast);
  assert.ok(u.cast.ab === 'frostbolt' && u.cast.start < gcdEnd + 0.1 + 1e-9, `started ${u.cast.start}, global cooldown ended ${gcdEnd}`);
});
