// Telegraphs (#179, docs/plans/2026-10-17-telegraphs-design.md): a boss's timed mechanic warns with a named cast, and
// each kind has one answer. Answered, the hit is avoided (an interrupt or a stun cancels the cast); missed, it hits
// TELE.miss times as hard, but only a unit that has the answer is punished for missing it.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, E } = require('./world');

// a fight with one mob that carries a boss extra (m.hardX), its telegraph switched on or off
function fight(level, cls, x, on = true) {
  G.fight = null;
  const { P } = require('./world').character(level, cls, 'human');
  P.place = Object.keys(D.PLACES).find((k) => { const p = D.PLACES[k]; return p.lvl && p.lvl[0] <= level && p.lvl[1] >= level && !p.safe && (p.mobs || []).length; });
  const m0 = G.placeMobs().find((x2) => x2.state === 'alive'); G.engage(m0.id);
  const C = G.fight, u = G.pUnit, m = C.enemies[0];
  u.maxHp = u.hp = 1e6; u.res = u.maxRes = 1e6;
  m.maxHp = m.hp = 1e7; m.dmg = [100, 100]; m.special = null; m.auto = () => 0;
  m.hardX = [Object.assign({ every: 4, hard: false }, x)];
  E.TELE.on.clear(); if (on) E.TELE.on.add('x:' + m.key);
  return { C, u, m };
}
const tick = (C, sec) => { for (let i = 0; i < sec * 10; i++) E.tick(C, 0.1); };
const startOf = (C) => { for (let i = 0; i < 100 && !C.enemies[0].tele; i++) E.tick(C, 0.1); assert.ok(C.enemies[0].tele, 'the cast started'); return C.enemies[0].tele; };
const teleDmg = (C, u) => C.events.filter((e) => e.type === 'dmg' && e.tgt === u.uid && e.tele).reduce((s, e) => s + e.amount, 0);
const evs = (C, what) => C.events.filter((e) => e.type === 'tele' && e.what === what);
const BREATH = { kind: 'hit', who: 'all', mult: 1, name: 'Test Breath', school: 'fire' };

test('every class has an interrupt, free, 12 sec, from level 6', () => {
  for (const cls in D.CLASSES) {
    const id = D.INTERRUPTS[cls], a = D.ABILITIES[id];
    assert.ok(a && D.CLASSES[cls].abilities.includes(id), cls);
    assert.deepStrictEqual([a.cost, a.cd, a.lvl, a.interrupt, a.gcd], [0, 12, 6, true, false], cls);
  }
});

test('a telegraph switched off lands at once, as before', () => {
  const { C, u, m } = fight(20, 'mage', BREATH, false);
  tick(C, 3);
  assert.ok(!m.tele);
  assert.strictEqual(evs(C, 'start').length, 0);
  assert.ok(C.events.some((e) => e.type === 'dmg' && e.tgt === u.uid && e.src === m.uid), 'the hit landed');
});

test('Step Back during the cast avoids a group hit', () => {
  const { C, u } = fight(20, 'mage', BREATH);
  const t = startOf(C);
  assert.strictEqual(E.teleAnswer(t), 'step');
  assert.strictEqual(E.use(C, u, 'step_back'), null, 'Step Back used');
  tick(C, 3);
  assert.strictEqual(teleDmg(C, u), 0);
  assert.ok(evs(C, 'dodge').some((e) => e.tgt === u.uid));
});

test('a missed answer hits TELE.miss times as hard as the plain hit', () => {
  const plain = fight(20, 'mage', BREATH, false); tick(plain.C, 2.2);
  const hit = plain.C.events.find((e) => e.type === 'dmg' && e.tgt === plain.u.uid && /^hard_/.test(e.ab)).amount;
  const { C, u } = fight(20, 'mage', BREATH);
  startOf(C); tick(C, 3);
  assert.ok(Math.abs(teleDmg(C, u) / hit - E.TELE.miss) < 0.15, `${teleDmg(C, u)} vs ${hit}`);
});

test('a unit that does not know the answer takes the plain hit, never the big one', () => {
  // a level-20 Warrior has no defensive yet (Shield Wall is 32): a Crushing Blow on it lands as it did before
  const SLAM = { kind: 'hit', who: 'target', mult: 1, name: 'Test Slam' };
  assert.deepStrictEqual(E.answersOf(fight(20, 'warrior', SLAM).u, 'guard'), []);
  const plain = fight(20, 'warrior', SLAM, false); tick(plain.C, 2.2);
  const hit = plain.C.events.find((e) => e.type === 'dmg' && e.tgt === plain.u.uid && /^hard_/.test(e.ab)).amount;
  const { C, u } = fight(20, 'warrior', SLAM);
  startOf(C); tick(C, 3);
  assert.ok(Math.abs(teleDmg(C, u) / hit - 1) < 0.15, `${teleDmg(C, u)} vs ${hit}`);
});

test('a defensive up when it lands avoids a slam on the tank', () => {
  const { C, u } = fight(40, 'warrior', { kind: 'hit', who: 'target', mult: 1, name: 'Test Slam' });
  const t = startOf(C);
  assert.strictEqual(E.teleAnswer(t), 'guard');
  assert.ok(E.answersOf(u, 'guard').includes('shield_wall'));
  assert.strictEqual(E.use(C, u, 'shield_wall'), null);
  tick(C, 3);
  assert.strictEqual(teleDmg(C, u), 0);
});

test('an interrupt cancels a heal cast', () => {
  const { C, u, m } = fight(20, 'mage', { kind: 'heal', heal: 0.2, name: 'Test Mend' });
  m.hp = m.maxHp / 2;
  const t = startOf(C);
  assert.strictEqual(E.teleAnswer(t), 'cut');
  assert.strictEqual(E.use(C, u, 'spellbreak', m.uid), null, 'Spellbreak used');
  assert.strictEqual(m.tele, null);
  assert.strictEqual(evs(C, 'cut').length, 1);
  const hp = m.hp; tick(C, 3);
  assert.ok(m.hp <= hp, 'no heal landed');
});

test('a stun cancels a cast too', () => {
  const { C, u, m } = fight(20, 'rogue', { kind: 'heal', heal: 0.2, name: 'Test Mend' });
  startOf(C);
  u.res = 100; u.cp = 5; u.cpTarget = m.uid;
  assert.ok(E.answersOf(u, 'cut').includes('kidney_shot'));
  assert.strictEqual(E.use(C, u, 'kidney_shot', m.uid), null, 'Kidney Shot used');
  assert.strictEqual(m.tele, null);
});

test('a missed heal heals TELE.healMiss times as much', () => {
  const { C, m } = fight(20, 'mage', { kind: 'heal', heal: 0.1, name: 'Test Mend' });
  m.hp = m.maxHp / 2; startOf(C); const hp = m.hp; tick(C, 3);
  assert.ok(Math.abs((m.hp - hp) / m.maxHp - 0.1 * E.TELE.healMiss) < 0.01, String((m.hp - hp) / m.maxHp));
});

test('a skilled bot answers a group hit on its own', () => {
  const { C, u } = fight(20, 'mage', BREATH);
  const b = E.charUnit(G.botChar({ name: 'Ally', cls: 'priest', race: 'human', level: 20, skill: 1 }), 'ally', 'bot', Date.now());
  b.bot = { skill: 1, react: 0.3 }; b.maxHp = b.hp = 1e6; E.addAlly(C, b);
  startOf(C); tick(C, 3);
  assert.strictEqual(teleDmg(C, b), 0, 'the bot stepped back');
  assert.ok(teleDmg(C, u) > 0, 'the player who did nothing was hit');
});
