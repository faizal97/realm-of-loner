// A song still in its round when a fight ends plays on into the next fight, verses and all (#266): E.writeBack saves it
// in real time (char.songs, epoch ms), E.charUnit brings it back while its round runs, and drops it once it has run out.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { character } = require('./world');
const E = globalThis.E;

test('a song carries into the next fight while its round runs', () => {
  const { P } = character(20, 'bard', 'human');
  const now = 1e12;
  const u = E.charUnit(P, 'ally', 'player', now);
  u.auras.push({ id: 'song:dirge', song: true, ab: 'dirge', src: u.uid, began: 0, until: 10, verses: 2, every: 3, next: 3, tgt: null });
  E.writeBack({ t: 4 }, u, now);
  assert.deepStrictEqual(P.songs, [{ ab: 'dirge', verses: 2, until: now + 6000 }]);
  const v = E.charUnit(P, 'ally', 'player', now + 2000); // the next pull, 2 sec later: 4 sec of its round left
  const s = E.songOf(v, 'dirge');
  assert.ok(s, 'the song plays on');
  assert.strictEqual(s.verses, 2);
  assert.ok(Math.abs(s.until - 4) < 1e-9, `4 sec left (${s.until})`);
  const w = E.charUnit(P, 'ally', 'player', now + 7000); // too late: the round ran out
  assert.strictEqual(E.songOf(w, 'dirge'), null);
});

test('a dead bard carries no song', () => {
  const { P } = character(20, 'bard', 'human');
  const u = E.charUnit(P, 'ally', 'player', 0);
  u.auras.push({ id: 'song:dirge', song: true, ab: 'dirge', src: u.uid, began: 0, until: 10, verses: 2, every: 3, next: 3, tgt: null });
  u.dead = true;
  E.writeBack({ t: 4 }, u, 0);
  assert.strictEqual(P.songs, undefined);
});
