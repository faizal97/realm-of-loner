// The Daily Roulette resets at the player's own midnight (#96), as its message says; it used to reset at UTC midnight
// (07:00 in Jakarta). Played in Jakarta time (UTC+7), where the two days differ for seven hours. A save from before keeps
// its UTC day until its next Roulette, so nobody gains or loses a run at the switch.
'use strict';
globalThis.TEST_TZ = 'Asia/Jakarta';
const test = require('node:test');
const assert = require('node:assert');
const { G, character, setNow, advance } = require('./world');

const at = (y, mo, d, h) => setNow(new Date(y, mo - 1, d, h).getTime()); // local (Jakarta) time
// a whole Roulette run, as a player plays it: start, every pull cleared, done
function playRoulette() {
  G.startRoulette();
  for (let i = 0; i < 20000 && G.S.run && G.S.run.phase !== 'done'; i++) {
    const R = G.S.run; if (R.phase === 'rest') { R.restUntil = 0; G.runPull(); } // the player presses Pull
    if (G.fight) for (const e of G.fight.enemies) e.hp = 1;
    advance(0.25);
  }
  assert.ok(G.S.run && G.S.run.phase === 'done', 'the Roulette run was cleared');
  G.leaveGroup();
}

test('a Roulette done at 08:00 is ready again at the next local midnight (the old UTC reset waited until 07:00)', () => {
  character(30, 'warrior', 'human'); at(2026, 10, 7, 8); // 01:00 UTC on 7 October
  assert.ok(G.rouletteReady(), 'ready before the first run');
  playRoulette();
  assert.ok(!G.rouletteReady(), 'not ready again the same day');
  assert.strictEqual(G.S.flags.rouletteDay, '2026-10-07'); assert.strictEqual(G.S.flags.rouletteLocal, true);
  at(2026, 10, 7, 23); assert.ok(!G.rouletteReady(), 'still not at 23:00');
  at(2026, 10, 8, 0); assert.ok(G.rouletteReady(), 'ready at local midnight (17:00 UTC: the old UTC day had not turned)');
});

test('a save from before the switch keeps its UTC day once: no extra run and no lost one', () => {
  const { S } = character(30, 'warrior', 'human');
  at(2026, 10, 8, 6); // 23:00 UTC on 7 October: the old code wrote UTC's day
  S.flags.rouletteDay = '2026-10-07'; delete S.flags.rouletteLocal; // as an old save has it, done "today" in UTC
  assert.ok(!G.rouletteReady(), 'not ready again in the same UTC day (no extra run from the switch)');
  at(2026, 10, 8, 7); assert.ok(G.rouletteReady(), 'ready when that UTC day ends, as before');
  playRoulette();
  assert.strictEqual(G.S.flags.rouletteLocal, true, 'from its next run it counts local days');
});
