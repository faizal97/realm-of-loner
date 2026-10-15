// Songs on the beat (#250): a combat song plays for its instrument's length and pulses; a tap in the beat window adds a
// verse, an early tap costs one, running out loses them all; at full verses a tap off the beat plays the Finale and a
// tap on the beat keeps it full; two songs at once, a third replaces the first. Bots land the beat by skill.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, E, character } = require('./world');

function bardFight(level) {
  const { P } = character(level || 20, 'bard', 'human');
  P.place = Object.keys(D.PLACES).find((k) => { const p = D.PLACES[k]; return p.lvl && p.lvl[0] <= 20 && p.lvl[1] >= 20 && !p.safe && (p.mobs || []).length; });
  const m = G.placeMobs().find((x) => x.state === 'alive'); G.engage(m.id);
  const C = G.fight, u = G.pUnit; u.res = u.maxRes = 1e6; u.maxHp = u.hp = 1e6;
  for (const e of C.enemies) { e.maxHp = e.hp = 1e8; }
  return { C, u };
}
const R = () => E.RHYTHM.lute;
const until = (C, fn) => { for (let i = 0; i < 400 && !fn(); i++) E.tick(C, 0.1); assert.ok(fn(), 'reached the moment'); };
const freeGcd = (C, u) => until(C, () => u.gcdUntil <= C.t && !u.cast);
const songs = (C, u) => C.events.filter((e) => e.type === 'song' && e.src === u.uid);

test('Song of Rest and Dirge are songs from level 4', () => {
  for (const id of ['song_of_rest', 'dirge']) { assert.ok(D.ABILITIES[id].song, id); assert.strictEqual(D.ABILITIES[id].lvl, 4); }
});

test('a tap in the beat window adds a verse and the song plays on', () => {
  const { C, u } = bardFight();
  assert.strictEqual(G.useAbility('dirge'), null);
  let st = E.songState(C, u, 'dirge'); assert.ok(st.playing && st.verses === 0);
  until(C, () => E.songState(C, u, 'dirge').inWindow); freeGcd(C, u);
  assert.strictEqual(G.useAbility('dirge'), null);
  st = E.songState(C, u, 'dirge');
  assert.strictEqual(st.verses, 1);
  assert.ok(st.left > R().len - 0.2, 'the timer started again');
});

test('an early tap costs a verse; running out loses the song and every verse', () => {
  const { C, u } = bardFight();
  G.useAbility('dirge');
  for (let v = 1; v <= 2; v++) { until(C, () => E.songState(C, u, 'dirge').inWindow); freeGcd(C, u); G.useAbility('dirge'); }
  assert.strictEqual(E.songState(C, u, 'dirge').verses, 2);
  freeGcd(C, u); assert.ok(!E.songState(C, u, 'dirge').inWindow);
  G.useAbility('dirge');
  assert.strictEqual(E.songState(C, u, 'dirge').verses, 1, 'early: one verse lost');
  until(C, () => !E.songState(C, u, 'dirge').playing);
  assert.ok(songs(C, u).some((e) => e.what === 'end' && e.ab === 'dirge'));
  freeGcd(C, u); G.useAbility('dirge');
  assert.strictEqual(E.songState(C, u, 'dirge').verses, 0, 'starts again from none');
});

test('pulses grow with verses; the Finale spends them all in one burst', () => {
  const { C, u } = bardFight();
  const tgt = C.enemies[0];
  G.useAbility('dirge');
  const pulseDmg = () => C.events.filter((e) => e.type === 'dmg' && e.src === u.uid && e.ab === 'dirge' && !e.finale).map((e) => e.amount);
  until(C, () => pulseDmg().length >= 1);
  const first = pulseDmg()[0];
  for (let v = 1; v <= R().max; v++) { until(C, () => E.songState(C, u, 'dirge').inWindow); freeGcd(C, u); G.useAbility('dirge'); }
  const n = pulseDmg().length; until(C, () => pulseDmg().length > n);
  const full = pulseDmg()[pulseDmg().length - 1];
  assert.ok(Math.abs(full / first - (1 + E.VERSE_BONUS * R().max)) < 0.02, `a full-verse pulse is ${(full / first).toFixed(2)}x the first`);
  assert.ok(E.songState(C, u, 'dirge').finale);
  // on the beat at full verses: stays full
  until(C, () => E.songState(C, u, 'dirge').inWindow); freeGcd(C, u); G.useAbility('dirge');
  assert.strictEqual(E.songState(C, u, 'dirge').verses, R().max, 'on the beat at full: kept');
  // off the beat at full verses: the Finale
  freeGcd(C, u); const hp0 = tgt.hp;
  G.useAbility('dirge');
  assert.ok(songs(C, u).some((e) => e.what === 'finale' && e.verses === R().max), 'a Finale');
  assert.ok(hp0 - tgt.hp > full * 4, `Finale ${Math.round(hp0 - tgt.hp)} vs a pulse ${Math.round(full)}`);
  const st = E.songState(C, u, 'dirge');
  assert.ok(st.playing && st.verses === 0, 'the song plays on from none');
});

test('the healing song pulses on the party; its Finale heals everyone at once', () => {
  const { C, u } = bardFight();
  G.useAbility('song_of_rest');
  until(C, () => C.events.some((e) => e.type === 'heal' && e.src === u.uid && e.ab === 'song_of_rest'));
  for (let v = 1; v <= R().max; v++) { until(C, () => E.songState(C, u, 'song_of_rest').inWindow); freeGcd(C, u); G.useAbility('song_of_rest'); }
  freeGcd(C, u); const n = C.events.length;
  G.useAbility('song_of_rest');
  assert.ok(songs(C, u).some((e) => e.what === 'finale' && e.ab === 'song_of_rest'));
  const healed = C.events.slice(n).filter((e) => e.type === 'heal' && e.ab === 'song_of_rest').map((e) => e.tgt);
  assert.deepStrictEqual([...new Set(healed)].sort(), C.allies.filter((a) => !a.dead).map((a) => a.uid).sort(), 'everyone in the party at once');
});

test('two songs at once; a third takes the place of the first', () => {
  const { C, u } = bardFight();
  D.ABILITIES.test_song = Object.assign({}, D.ABILITIES.dirge, { name: 'Test Song' });
  try {
    G.useAbility('dirge'); freeGcd(C, u); G.useAbility('song_of_rest'); freeGcd(C, u);
    assert.ok(E.songOf(u, 'dirge') && E.songOf(u, 'song_of_rest'));
    E.use(C, u, 'test_song', C.enemies[0].uid);
    assert.ok(!E.songOf(u, 'dirge'), 'the first song stopped');
    assert.ok(E.songOf(u, 'song_of_rest') && E.songOf(u, 'test_song'));
  } finally { delete D.ABILITIES.test_song; }
});

test('a skilled bot lands far more beats than an unskilled one', () => {
  const landed = (skill) => {
    let beats = 0, misses = 0;
    for (let seed = 0; seed < 30; seed++) {
      const { C, u } = bardFight();
      u.kind = 'bot'; u.role = 'dps'; u.bot = { skill }; u.target = C.enemies[0].uid;
      for (let i = 0; i < 600; i++) { u.res = u.maxRes; u.hp = u.maxHp; E.tick(C, 0.1); } // mana and health kept full: only the timing is measured
      for (const e of songs(C, u)) { if (e.what === 'beat') beats++; if (e.what === 'early' || e.what === 'end') misses++; }
      G.fight = null;
    }
    return beats / Math.max(1, beats + misses);
  };
  const hi = landed(0.95), lo = landed(0.1);
  assert.ok(hi > 0.7, `skilled: ${(hi * 100).toFixed(0)}% on the beat`);
  assert.ok(lo < hi - 0.1, `unskilled: ${(lo * 100).toFixed(0)}% vs ${(hi * 100).toFixed(0)}%`);
});
