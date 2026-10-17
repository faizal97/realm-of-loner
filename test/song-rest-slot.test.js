// A healer Bard whose two song slots hold Marching Song and Dirge gives up Dirge for Song of Rest once the party is hurt
// (#267): botSong started a song only in a free slot, so Rest waited for Dirge to run out and played 8 sec of a 90 sec
// fight at level 20 (sim/bard.js healer fight), against about 56 sec from level 40.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, E, character } = require('./world');

test('a healer Bard drops Dirge, not Marching Song, to sing Song of Rest', () => {
  G.fight = null;
  const { P } = character(20, 'bard', 'human');
  P.place = Object.keys(D.PLACES).find((k) => { const p = D.PLACES[k]; return p.lvl && p.lvl[0] <= 20 && p.lvl[1] >= 20 && !p.safe && (p.mobs || []).length; });
  const m = G.placeMobs().find((x) => x.state === 'alive'); G.engage(m.id);
  const C = G.fight, u = G.pUnit;
  const mate = E.charUnit(P, 'ally', 'bot', 0); mate.uid = 'mate'; C.units.mate = mate; C.allies.push(mate); // two on our side: the group brain, not the solo one
  for (const e of C.enemies) e.maxHp = e.hp = 1e8;
  u.role = 'healer'; u.bot = { skill: 0.9, react: 0.1 }; u.res = u.maxRes; u.gcdUntil = 0; u.nextThink = 0;
  mate.hp = mate.maxHp * 0.6; // hurt, not low
  for (const ab of ['marching_song', 'dirge']) u.auras.push({ id: 'song:' + ab, song: true, ab, src: u.uid, began: C.t - (ab === 'dirge' ? 1 : 2), until: C.t + 8, verses: 0, every: D.ABILITIES[ab].song.every, next: C.t + 1, tgt: null });
  assert.ok(D.CLASSES.bard.abilities.includes('song_of_rest') && P.level >= D.ABILITIES.song_of_rest.lvl, 'Song of Rest known at 20');
  E.botThink(C, u);
  assert.ok(E.songOf(u, 'song_of_rest'), 'Song of Rest plays');
  assert.ok(E.songOf(u, 'marching_song'), 'Marching Song keeps its slot');
  assert.strictEqual(E.songOf(u, 'dirge'), null, 'Dirge made room');
});
