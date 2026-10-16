// Bard talents that change how songs work (#253, docs/plans/2026-10-15-bard-playable-design.md §9): three trees of a
// songs branch and an instrument branch, tier 3 keystones either/or per tree, and each rule doing what it says.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, E, character } = require('./world');

function bardFight(talents, o) {
  G.fight = null;
  const { P } = character(60, 'bard', 'human');
  P.talents = Object.assign({}, talents); if (o && o.instrument) P.instrument = o.instrument;
  P.place = Object.keys(D.PLACES).find((k) => { const p = D.PLACES[k]; return p.lvl && p.lvl[0] <= 55 && p.lvl[1] >= 55 && !p.safe && (p.mobs || []).length; });
  const m = G.placeMobs().find((x) => x.state === 'alive'); G.engage(m.id);
  const C = G.fight, u = G.pUnit; u.res = u.maxRes = 1e6; u.maxHp = u.hp = 1e6;
  for (const e of C.enemies) { e.maxHp = e.hp = 1e9; e.dmgMult = 0; }
  return { C, u, P };
}
const until = (C, fn) => { for (let i = 0; i < 600 && !fn(); i++) E.tick(C, 0.1); assert.ok(fn(), 'reached the moment'); };
const ready = (C, u) => until(C, () => u.gcdUntil <= C.t && !u.cast);
const toBeat = (C, u, id) => { const R = E.rhythmOf(u); until(C, () => E.songOf(u, id).until - C.t <= R.win - 0.05); ready(C, u); };
const evs = (C, fn) => C.events.filter(fn);
const land = (C, u, id, n) => { for (let i = 0; i < n; i++) { toBeat(C, u, id); G.useAbility(id); } };

test('each tree is 17 points (Tempo 15) and its keystones are either/or', () => {
  for (const tree of D.TALENTS.bard) {
    const pts = tree.talents.filter((t) => t.tier < 3).reduce((a, t) => a + t.ranks, 0) + 1;
    assert.ok(pts === 17 || (tree.id === 'tempo' && pts === 15), tree.id + ' ' + pts);
    assert.deepStrictEqual(tree.talents.filter((t) => t.tier === 3).map((t) => t.branch).sort(), ['instrument', 'songs']);
  }
  const char = { cls: 'bard', level: 60, talents: { rousing_verses: 5, taut_strings: 5, lingering_dirge: 3, drumbeat: 3, showstopper: 1 } };
  assert.match(G.canLearnTalent(char, 'syncopation'), /You chose Showstopper/);
  const auto = G.autoTalents('bard', 'dps', 60, 0);
  for (const tree of D.TALENTS.bard) assert.ok(tree.talents.filter((t) => t.tier === 3 && auto[t.id]).length <= 1, tree.id);
});

test('an old talent gives its points back on load; a second keystone too', () => {
  const { P } = character(60, 'bard', 'human');
  P.talents = { long_rest: 3, resonance: 2, medley: 1, perfect_pitch: 1 };
  G.save(); G.load(G.S.id);
  assert.deepStrictEqual(G.S.player.talents, { resonance: 2, medley: 1 });
});

test('Practised Hands widens the beat and Fourth Verse adds a verse', () => {
  const { u } = bardFight({ practised_hands: 5, fourth_verse: 1 });
  const R = E.rhythmOf(u), L = E.RHYTHM.lute;
  assert.ok(Math.abs(R.win - (L.win + 0.5)) < 1e-9); assert.strictEqual(R.max, L.max + 1);
});

test('Medley keeps three songs', () => {
  const { C, u } = bardFight({ medley: 1 });
  for (const id of ['dirge', 'song_of_rest', 'marching_song']) { ready(C, u); G.useAbility(id); }
  assert.strictEqual(u.auras.filter((a) => a.song).length, 3);
  const b = bardFight({});
  for (const id of ['dirge', 'song_of_rest', 'marching_song']) { ready(b.C, b.u); G.useAbility(id); }
  assert.strictEqual(b.u.auras.filter((a) => a.song).length, 2);
});

test('Perfect Pitch: a beat in its last half second adds two verses', () => {
  const { C, u } = bardFight({ perfect_pitch: 1 });
  G.useAbility('dirge');
  until(C, () => E.songOf(u, 'dirge').until - C.t <= 0.4); ready(C, u);
  G.useAbility('dirge');
  assert.strictEqual(E.songOf(u, 'dirge').verses, 2);
});

test('Resonance gives mana on each beat; Drumbeat strikes the target', () => {
  const { C, u } = bardFight({ resonance: 5, drumbeat: 3 });
  G.useAbility('dirge'); toBeat(C, u, 'dirge');
  u.res = E.abCost(D.ABILITIES.dirge, u); const n = C.events.length; G.useAbility('dirge');
  assert.ok(Math.abs(u.res - u.maxRes * 0.05) < u.maxRes * 0.001, 'mana back: ' + u.res);
  assert.ok(C.events.slice(n).some((e) => e.type === 'dmg' && e.fx === 'drumbeat'), 'a drumbeat hit');
});

test('Heartstrings heals the most hurt ally on the beat', () => {
  const { C, u } = bardFight({ heartstrings: 3 });
  G.useAbility('dirge'); u.hp = u.maxHp * 0.5;
  const n = C.events.length; land(C, u, 'dirge', 1);
  assert.ok(C.events.slice(n).some((e) => e.type === 'heal' && e.tgt === u.uid && e.ab === 'song_of_rest'));
});

test('Syncopation: a beat on one song adds a verse to the other, once per 10 sec', () => {
  const { C, u } = bardFight({ syncopation: 1 });
  G.useAbility('dirge'); ready(C, u); G.useAbility('song_of_rest');
  land(C, u, 'dirge', 1);
  assert.strictEqual(E.songOf(u, 'song_of_rest').verses, 1, 'the other song gained a verse');
  ready(C, u); G.useAbility('song_of_rest'); // the same beat, under 10 sec later: no extra for Dirge
  assert.strictEqual(E.songOf(u, 'dirge').verses, 1);
});

test('Sustain holds a song 3 sec past its end, all on the beat, once', () => {
  const { C, u } = bardFight({ sustain: 1 });
  G.useAbility('dirge'); const end = E.songOf(u, 'dirge').until;
  until(C, () => C.t > end + 0.5);
  const s = E.songOf(u, 'dirge'); assert.ok(s && s.held, 'still playing');
  assert.ok(E.songState(C, u, 'dirge').inWindow);
  G.useAbility('dirge');
  assert.strictEqual(s.verses, 1); assert.ok(Math.abs(s.until - (end + E.RHYTHM.lute.len)) < 1e-9, 'back on the shared beat');
});

test('Showstopper: a damage Finale makes the next Shatterchord instant', () => {
  const { C, u } = bardFight({ showstopper: 1 });
  G.useAbility('dirge'); land(C, u, 'dirge', 3); ready(C, u);
  until(C, () => E.songOf(u, 'dirge').until - C.t > E.RHYTHM.lute.win + 0.5); G.useAbility('dirge'); // the Finale
  assert.ok(E.lit(u, 'shatterchord'));
  ready(C, u); G.useAbility('shatterchord');
  assert.ok(!u.cast, 'no cast bar'); assert.ok(!E.lit(u, 'shatterchord'));
});

test('Lingering Dirge (3 ranks): the damage Finale leaves a Dirge on the enemy', () => {
  const { C, u } = bardFight({ lingering_dirge: 3 });
  G.useAbility('ballad_of_blades'); land(C, u, 'ballad_of_blades', 3); ready(C, u);
  until(C, () => E.songOf(u, 'ballad_of_blades').until - C.t > E.RHYTHM.lute.win + 0.5); G.useAbility('ballad_of_blades');
  assert.ok(C.enemies.some((e) => e.auras.some((a) => a.id === 'lingering_dirge')));
});

test('Second Wind: Marching Song\'s Finale gives the party resource', () => {
  const { C, u } = bardFight({ second_wind: 3 });
  G.useAbility('marching_song'); land(C, u, 'marching_song', 3); ready(C, u);
  until(C, () => E.songOf(u, 'marching_song').until - C.t > E.RHYTHM.lute.win + 0.5); u.res = E.abCost(D.ABILITIES.marching_song, u); G.useAbility('marching_song');
  assert.ok(Math.abs(u.res - u.maxRes * 0.3) < 1, 'mana: ' + u.res);
});

test('Rescue Note: an ally under 25% readies the healing Finale at any verse', () => {
  const { C, u } = bardFight({ rescue_note: 1 });
  G.useAbility('song_of_rest'); ready(C, u);
  assert.ok(!E.songState(C, u, 'song_of_rest').finale);
  u.hp = u.maxHp * 0.2; E.tick(C, 0.1);
  assert.ok(u.rescueReady && E.songState(C, u, 'song_of_rest').finale);
  until(C, () => E.songOf(u, 'song_of_rest').until - C.t > E.RHYTHM.lute.win + 0.5);
  const n = C.events.length; G.useAbility('song_of_rest');
  assert.ok(C.events.slice(n).some((e) => e.type === 'song' && e.what === 'finale'));
  assert.ok(!u.rescueReady);
});

test('Rising Finale heals more the more hurt the party is', () => {
  const heal = (hurt) => {
    const { C, u } = bardFight({ rising_finale: 3 });
    G.useAbility('song_of_rest'); land(C, u, 'song_of_rest', 3); ready(C, u);
    until(C, () => E.songOf(u, 'song_of_rest').until - C.t > E.RHYTHM.lute.win + 0.5);
    u.hp = u.maxHp * hurt; const n = C.events.length; G.useAbility('song_of_rest');
    return C.events.slice(n).filter((e) => e.type === 'heal' && e.tgt === u.uid).reduce((a, e) => a + (e.amount + (e.over || 0)), 0);
  };
  assert.ok(heal(0.5) > heal(0.999) * 1.2, 'more when hurt');
});
