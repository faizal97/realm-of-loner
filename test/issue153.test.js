// The social pull (#153): a humanoid or murloc sometimes brings a friend of its kind. Below creature level 20 it happens
// 7% of the time (it was 14%; Mages and Priests died in many of those fights at 15-25), from 20 it stays 14%, and the
// friend arrives after 4-7 s (it was 2-5 s), giving a caster time to shield, slow it or step back.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

// a place with a non-named humanoid or murloc creature in the level range, and a character standing there
function placeFor(lo, hi) {
  return Object.keys(D.PLACES).find((k) => { const p = D.PLACES[k]; return !p.safe && (p.mobs || []).some(([key]) => { const M = D.MOBS[key]; return M && !M.named && !M.elite && (M.family === 'humanoid' || M.family === 'murloc') && M.lvl[0] >= lo && M.lvl[1] < hi; }); });
}
function pulls(lo, hi, n) {
  const { P } = character(hi > 20 ? 30 : 15, 'warrior', 'human');
  P.place = placeFor(lo, hi); assert.ok(P.place, `a place with level ${lo}-${hi} humanoids`);
  let social = 0, tries = 0; const delays = [];
  for (let i = 0; i < n; i++) {
    const mobs = G.placeMobs(); for (const x of mobs) x.state = 'alive';
    const m = mobs.find((x) => { const M = D.MOBS[x.key]; return !M.named && (M.family === 'humanoid' || M.family === 'murloc') && x.level >= lo && x.level < hi && mobs.some((y) => y !== x && y.key === x.key); });
    if (!m) continue;
    tries++; G.engage(m.id);
    if (G.fight.addAt) { social++; delays.push(G.fight.addAt.t); }
    G.fight = null; G.pUnit = null;
  }
  return { rate: social / tries, delays, tries };
}

test('below creature level 20 about 7% of pulls bring a friend; from 20 about 14%', () => {
  const low = pulls(1, 20, 3000), high = pulls(20, 60, 3000);
  assert.ok(low.tries > 1000 && high.tries > 1000, `${low.tries} and ${high.tries} pulls`);
  assert.ok(low.rate > 0.05 && low.rate < 0.09, `below 20: ${(low.rate * 100).toFixed(1)}%`);
  assert.ok(high.rate > 0.11 && high.rate < 0.17, `from 20: ${(high.rate * 100).toFixed(1)}%`);
});

test('the friend arrives 4-7 s into the fight', () => {
  const { delays } = pulls(20, 60, 2000);
  assert.ok(delays.length > 100, `${delays.length} social pulls`);
  assert.ok(Math.min(...delays) >= 4 && Math.max(...delays) <= 7, `${Math.min(...delays).toFixed(2)}-${Math.max(...delays).toFixed(2)} s`);
});
