// The Bard's kit (#251): daggers and staves; an instrument in the ranged slot that gives stats only, while the kind
// played (Lute, Drum, Horn) is chosen outside a fight and sets the rhythm; Marching Song and Ballad of Blades are songs;
// the eight new abilities do what they say; Grand Finale is Standing Ovation.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, E, character } = require('./world');

function bardFight(level, setup) {
  G.fight = null;
  const { P } = character(level || 60, 'bard', 'human');
  if (setup) setup(P);
  P.place = Object.keys(D.PLACES).find((k) => { const p = D.PLACES[k]; return p.lvl && p.lvl[0] <= 20 && p.lvl[1] >= 20 && !p.safe && (p.mobs || []).length; });
  const m = G.placeMobs().find((x) => x.state === 'alive'); G.engage(m.id);
  const C = G.fight, u = G.pUnit;
  for (const e of C.enemies) { e.maxHp = e.hp = 1e8; }
  u.res = u.maxRes;
  return { C, u, P };
}
const until = (C, fn) => { for (let i = 0; i < 400 && !fn(); i++) { if (G.pUnit) { G.pUnit.res = G.pUnit.maxRes; G.pUnit.hp = G.pUnit.maxHp; } E.tick(C, 0.1); } assert.ok(fn(), 'reached the moment'); };
const freeGcd = (C, u) => until(C, () => u.gcdUntil <= C.t && !u.cast);
const songs = (C, u) => C.events.filter((e) => e.type === 'song' && e.src === u.uid);

test('the kit: daggers and staves, 24 abilities (Sour Note, the interrupt every class has since #179) plus three instruments, Standing Ovation', () => {
  const B = D.CLASSES.bard;
  assert.deepStrictEqual(B.weapons, ['dagger', 'staff']);
  assert.deepStrictEqual(B.roles, ['healer', 'dps']);
  assert.ok(!B.hidden, 'pickable on a live build (#255)');
  for (const r in D.RACES) assert.ok(D.RACES[r].classes.includes('bard'), `${r}: can be a Bard`);
  assert.strictEqual(B.abilities.filter((id) => !D.ABILITIES[id].instrument).length, 24);
  assert.strictEqual(D.ABILITIES.grand_finale.name, 'Standing Ovation');
  for (const id of ['song_of_rest', 'dirge', 'marching_song', 'ballad_of_blades']) assert.ok(D.ABILITIES[id].song, `${id} is a song`);
  for (const id of ['hearthsong', 'anthem_of_stone']) assert.ok(D.ABILITIES[id].buff && !D.ABILITIES[id].song, `${id} stays a buff`);
  for (const id of B.abilities) assert.ok(D.ABILITIES[id] && D.ABILITIES[id].desc, id);
});

test('instruments: a bard plays one, a hunter cannot; it gives stats, not damage', () => {
  const it = G.genGear('ranged', 30, 3, { wtype: 'instrument', affix: G.classAffix('bard') });
  assert.strictEqual(it.wtype, 'instrument'); assert.ok(!it.dmg, 'no weapon damage');
  assert.ok(Object.keys(it.stats || {}).length, 'it has stats');
  assert.ok(G.canUseItem(it, 'bard')); assert.ok(!G.canUseItem(it, 'hunter'));
  const bow = G.genGear('ranged', 30, 3);
  assert.ok(G.canUseItem(bow, 'hunter')); assert.ok(!G.canUseItem(bow, 'bard'));
  let seen = false; for (let i = 0; i < 300 && !seen; i++) { const g = G.fittedGear(30, 3, 'bard'); if (g.slot === 'ranged') { seen = true; assert.strictEqual(g.wtype, 'instrument'); } }
  assert.ok(seen, 'bards find instruments');
});

test('the kind is chosen outside a fight and sets the rhythm', () => {
  const { P } = character(20, 'bard', 'human');
  assert.strictEqual(G.castOutOfCombat('play_drum'), null);
  assert.strictEqual(P.instrument, 'drum');
  const { P: low } = character(5, 'bard', 'human');
  assert.notStrictEqual(G.castOutOfCombat('play_drum'), null, 'not learned at 5');
  assert.ok(!low.instrument);
  const { C, u } = bardFight(20, (p) => { p.instrument = 'horn'; });
  assert.strictEqual(E.rhythmOf(u), E.RHYTHM.horn);
  assert.strictEqual(G.useAbility('play_lute'), 'Change instruments outside a fight');
  G.useAbility('dirge');
  assert.ok(Math.abs(E.songState(C, u, 'dirge').left - 16) < 0.01, 'a Horn song lasts 16 sec');
});

test('Marching Song hastes the party while it plays; its Finale is a surge', () => {
  const { C, u } = bardFight(30);
  const h0 = u.st.haste || 0;
  G.useAbility('marching_song');
  assert.ok((u.st.haste || 0) > h0, `haste ${h0} → ${u.st.haste}`);
  for (let v = 1; v <= 3; v++) { until(C, () => E.songState(C, u, 'marching_song').inWindow); freeGcd(C, u); G.useAbility('marching_song'); }
  freeGcd(C, u); const h1 = u.st.haste;
  G.useAbility('marching_song');
  assert.ok(songs(C, u).some((e) => e.what === 'finale'));
  assert.ok(u.st.haste > h1 * 1.5, `surge ${h1} → ${u.st.haste}`);
});

test('Ballad of Blades hits every enemy near its target', () => {
  const { C, u } = bardFight(30);
  const extra = E.mobUnit(C.enemies[0].key, C.enemies[0].level); E.addEnemy(C, extra); extra.maxHp = extra.hp = 1e8;
  if (extra.pos && C.enemies[0].pos) { extra.pos.x = C.enemies[0].pos.x; extra.pos.y = C.enemies[0].pos.y; }
  G.useAbility('ballad_of_blades');
  until(C, () => C.events.filter((e) => e.type === 'dmg' && e.ab === 'ballad_of_blades').length >= 2);
  const hit = new Set(C.events.filter((e) => e.type === 'dmg' && e.ab === 'ballad_of_blades').map((e) => e.tgt));
  assert.ok(hit.size >= 2, `${hit.size} enemies hit`);
});

test('Mocking Verse: the party deals 8% more to the target', () => {
  const { C, u } = bardFight(50);
  const t = C.enemies[0];
  G.useAbility('mocking_verse');
  const a = t.auras.find((x) => x.id === 'mocking_verse');
  assert.ok(a && a.takenPct === 8 && a.bySide === 'ally');
});

test('Cleansing Verse clears an enemy\'s damage over time from a friend', () => {
  const { C, u } = bardFight(20);
  const foe = C.enemies[0];
  u.auras.push({ id: 'poison', until: C.t + 20, every: 2, next: C.t + 2, dot: 10, src: foe.uid, ab: 'x' });
  assert.strictEqual(G.useAbility('cleansing_verse'), null);
  assert.ok(!u.auras.some((a) => a.id === 'poison'));
});

test('Stage Fright: a non-boss runs from you for 6 sec', () => {
  const { C, u } = bardFight(40);
  const t = C.enemies[0]; t.boss = false;
  G.useAbility('stage_fright');
  assert.ok(t.fleeUntil > C.t + 5.9 && t.fleeFrom === u.uid);
});

test('Intermission gives 30% mana back over 8 sec while not casting', () => {
  const { C, u } = bardFight(30);
  u.res = 0; const max = u.maxRes;
  u.lastCastT = C.t; // no spirit regen in the window: only Intermission counts
  assert.strictEqual(G.useAbility('intermission'), null);
  for (let i = 0; i < 80; i++) { u.lastCastT = C.t; u.hp = u.maxHp; E.tick(C, 0.1); }
  assert.ok(Math.abs(u.res / max - 0.3) < 0.03, `${(u.res / max * 100).toFixed(1)}% back`);
});

test('Echo replays the last Finale at half strength', () => {
  const { C, u } = bardFight(60);
  const t = C.enemies[0];
  G.useAbility('dirge');
  // up to the verse limit, talents included (Fourth Verse, #253)
  for (let v = 1; v <= E.songState(C, u, 'dirge').max; v++) { until(C, () => E.songState(C, u, 'dirge').inWindow); freeGcd(C, u); G.useAbility('dirge'); }
  freeGcd(C, u); let hp = t.hp; G.useAbility('dirge'); const fin = hp - t.hp;
  freeGcd(C, u); hp = t.hp; assert.strictEqual(G.useAbility('echo'), null); const echo = hp - t.hp;
  assert.ok(fin > 0 && Math.abs(echo / fin - 0.5) < 0.15, `Finale ${Math.round(fin)}, Echo ${Math.round(echo)}`);
});
