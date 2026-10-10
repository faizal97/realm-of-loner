// PvP fights always run at 1× (#193). At 3× a human reacts three times slower in game time while a bot doesn't, so
// duels, war-mode ambushes, the Brawl and battlegrounds ignore the battle speed; a PvE fight still runs at the setting.
// The first PvP fight of a session with the setting above 1× says so once, in a yellow note.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

const notes = []; G.on('infoToast', (t) => notes.push(t));
// a fight of the given kind, with enemies that can't die in the time measured; returns how far 1 s of real time moved it
function oneSecond(kind) {
  const { P } = character(30, 'warrior', 'human');
  P.place = Object.keys(D.PLACES).find((k) => { const p = D.PLACES[k]; return p.lvl && p.lvl[0] <= 30 && p.lvl[1] >= 30 && !p.safe && (p.mobs || []).length; });
  G.engage(G.placeMobs().find((x) => x.state === 'alive').id);
  const C = G.fight; C.kind = kind;
  for (const u of Object.values(C.units)) { u.maxHp = u.hp = 1e9; }
  const t0 = C.t; for (let i = 0; i < 10; i++) G.update(0.1);
  const moved = C.t - t0; G.fight = null; G.pUnit = null;
  return moved;
}

test('at 3×, a duel, an ambush, a Brawl round and a battleground fight run at 1×; a PvE fight at 3×', () => {
  G.setSpeed(3);
  try {
    for (const k of ['duel', 'pvp', 'brawl', 'bg']) { const m = oneSecond(k); assert.ok(Math.abs(m - 1) < 0.15, `${k}: ${m.toFixed(2)} s`); }
    for (const k of ['solo', 'run']) { const m = oneSecond(k); assert.ok(Math.abs(m - 3) < 0.15, `${k}: ${m.toFixed(2)} s`); }
  } finally { G.setSpeed(1); }
});

test('the setting is kept: it comes back in the next PvE fight', () => {
  G.setSpeed(2);
  try { oneSecond('duel'); assert.strictEqual(G.speed, 2); assert.ok(Math.abs(oneSecond('solo') - 2) < 0.15); } finally { G.setSpeed(1); }
});

test('one note a session, only when the setting is above 1×', () => {
  // the first test already ran PvP fights at 3×: exactly one note so far, and no more after other PvP fights
  assert.deepStrictEqual(notes, ['PvP fights run at normal speed.']);
  G.setSpeed(3); try { oneSecond('bg'); } finally { G.setSpeed(1); }
  assert.strictEqual(notes.length, 1);
});
