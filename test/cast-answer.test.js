// A red bar's answer stops a cast in progress: before this a caster partway through a spell could not Step Back, and a
// bot that was casting never answered at all (a healer starting Lightning Bolt into a breath took the missed hit).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, E } = require('./world');

function fight(level, cls, on = true) {
  G.fight = null;
  const { P } = require('./world').character(level, cls, 'human');
  P.place = Object.keys(D.PLACES).find((k) => { const p = D.PLACES[k]; return p.lvl && p.lvl[0] <= level && p.lvl[1] >= level && !p.safe && (p.mobs || []).length; });
  const m0 = G.placeMobs().find((x2) => x2.state === 'alive'); G.engage(m0.id);
  const C = G.fight, u = G.pUnit, m = C.enemies[0];
  u.maxHp = u.hp = 1e6; u.res = u.maxRes = 1e6;
  m.maxHp = m.hp = 1e7; m.dmg = [100, 100]; m.special = null; m.auto = () => 0;
  m.hardX = [{ every: 4, hard: false, kind: 'hit', who: 'all', mult: 1, name: 'Test Breath', school: 'fire' }];
  E.TELE.on.clear(); if (on) E.TELE.on.add('x:' + m.key);
  return { C, u, m };
}
const ON = [...E.TELE.on];
test.after(() => { E.TELE.on.clear(); for (const k of ON) E.TELE.on.add(k); });
const tick = (C, sec) => { for (let i = 0; i < sec * 10; i++) E.tick(C, 0.1); };
const teleDmg = (C, u) => C.events.filter((e) => e.type === 'dmg' && e.tgt === u.uid && e.tele).reduce((s, e) => s + e.amount, 0);

test('with no red bar up, Step Back still waits for the cast', () => {
  const { C, u, m } = fight(20, 'mage');
  u.gcdUntil = 0; assert.strictEqual(E.use(C, u, 'fireball', m.uid), null);
  assert.ok(u.cast, 'casting');
  assert.strictEqual(E.use(C, u, 'step_back'), E.castingText('fireball'));
  assert.ok(u.cast, 'still casting');
});

test('with a red bar up, Step Back stops the cast and avoids the hit', () => {
  const { C, u, m } = fight(20, 'mage');
  for (let i = 0; i < 100 && !m.tele; i++) E.tick(C, 0.1);
  assert.ok(m.tele, 'the bar started');
  u.cast = null; u.gcdUntil = 0; assert.strictEqual(E.use(C, u, 'fireball', m.uid), null);
  assert.ok(u.cast, 'casting into the bar');
  assert.strictEqual(E.use(C, u, 'step_back'), null, 'Step Back used');
  assert.ok(!u.cast, 'the cast stopped');
  assert.ok(C.events.some((e) => e.type === 'castStop' && e.src === u.uid && !e.done));
  tick(C, 3);
  assert.strictEqual(teleDmg(C, u), 0);
});

test('a bot partway through a cast answers the bar (skill 1 always does)', () => {
  const { C, u, m } = fight(20, 'mage');
  u.kind = 'bot'; u.isPlayer = false; u.bot = { skill: 1, react: 0.6 };
  for (let i = 0; i < 100 && !m.tele; i++) E.tick(C, 0.1);
  assert.ok(m.tele, 'the bar started');
  u.cast = { ab: 'fireball', tgt: m.uid, start: C.t, end: C.t + 30, channel: 0, ticks: 0, pushed: 0 }; // a long cast past the bar
  tick(C, 3);
  assert.strictEqual(teleDmg(C, u), 0, 'no missed hit');
});
