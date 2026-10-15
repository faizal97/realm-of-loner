// One beat for every song (#257): a song started while another plays ends its first round on the other's beat (never
// sooner than half a round away); a tap on the beat adds a round from the beat itself, not from the tap; an early tap
// costs a verse and leaves the beat where it was; every song tap has the short global cooldown, Dirge included.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, E, character } = require('./world');

function bardFight() {
  G.fight = null;
  const { P } = character(20, 'bard', 'human');
  P.place = Object.keys(D.PLACES).find((k) => { const p = D.PLACES[k]; return p.lvl && p.lvl[0] <= 20 && p.lvl[1] >= 20 && !p.safe && (p.mobs || []).length; });
  const m = G.placeMobs().find((x) => x.state === 'alive'); G.engage(m.id);
  const C = G.fight, u = G.pUnit; u.res = u.maxRes = 1e6; u.maxHp = u.hp = 1e6;
  for (const e of C.enemies) { e.maxHp = e.hp = 1e8; }
  return { C, u };
}
const R = () => E.RHYTHM.lute;
const until = (C, fn) => { for (let i = 0; i < 400 && !fn(); i++) E.tick(C, 0.1); assert.ok(fn(), 'reached the moment'); };
const freeGcd = (C, u) => until(C, () => u.gcdUntil <= C.t && !u.cast);
const end = (u, id) => E.songOf(u, id).until;

test('every song tap has the short global cooldown, Dirge included', () => {
  for (const id in D.ABILITIES) if (D.ABILITIES[id].song) assert.strictEqual(D.ABILITIES[id].gcdLen, 0.5, id);
});

test('a second song joins the first one\'s beat', () => {
  const { C, u } = bardFight();
  G.useAbility('dirge');
  until(C, () => end(u, 'dirge') - C.t <= R().len - 3); freeGcd(C, u); // 3+ sec in: more than half a round is left
  G.useAbility('song_of_rest');
  assert.ok(Math.abs(end(u, 'song_of_rest') - end(u, 'dirge')) < 1e-9, 'same beat');
});

test('a song started late joins the beat after next, never a short first round', () => {
  const { C, u } = bardFight();
  G.useAbility('dirge');
  until(C, () => end(u, 'dirge') - C.t < R().len / 2 - 0.5); freeGcd(C, u);
  G.useAbility('song_of_rest');
  assert.ok(Math.abs(end(u, 'song_of_rest') - (end(u, 'dirge') + R().len)) < 1e-9, 'one round after the first song\'s beat');
  assert.ok(end(u, 'song_of_rest') - C.t >= R().len / 2);
});

test('a tap on the beat adds a round from the beat, so two songs tapped apart stay together', () => {
  const { C, u } = bardFight();
  G.useAbility('dirge'); freeGcd(C, u); G.useAbility('song_of_rest');
  const beat = end(u, 'dirge');
  until(C, () => E.songState(C, u, 'dirge').inWindow); freeGcd(C, u); G.useAbility('dirge');
  freeGcd(C, u); E.tick(C, 0.1); G.useAbility('song_of_rest');
  assert.strictEqual(E.songOf(u, 'song_of_rest').verses, 1, 'both on the beat');
  assert.ok(Math.abs(end(u, 'dirge') - (beat + R().len)) < 1e-9 && Math.abs(end(u, 'song_of_rest') - (beat + R().len)) < 1e-9, 'one clock');
});

test('an early tap costs a verse and leaves the beat where it was', () => {
  const { C, u } = bardFight();
  G.useAbility('dirge');
  until(C, () => E.songState(C, u, 'dirge').inWindow); freeGcd(C, u); G.useAbility('dirge');
  const beat = end(u, 'dirge');
  freeGcd(C, u); G.useAbility('dirge');
  assert.strictEqual(E.songOf(u, 'dirge').verses, 0);
  assert.strictEqual(end(u, 'dirge'), beat);
});
