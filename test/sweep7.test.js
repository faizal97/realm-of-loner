// The beta.5 dev sweep: weekly goals and the clock, items with full bags, runs started over a finished one (#469 onward).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const W = require('./world');
const { G, D } = W; const SOC = globalThis.SOC;
// one kill short of the weekly goal, then the kill: true when it paid
const finishWeek = () => {
  const w = SOC.week(); if (w.done) return false;
  Object.assign(w, { kind: 'kill', got: w.goal - 1 }); const m0 = G.S.player.money;
  SOC.onKill(D.PLACES[G.S.player.place].mobs ? D.PLACES[G.S.player.place].mobs[0] : Object.keys(D.MOBS)[0]);
  return G.S.player.money > m0;
};

test('a weekly guild reward paid in another guild is not paid again on rejoining (#469)', () => {
  W.setNow(new Date(2026, 10, 4, 12).getTime());
  W.character(30); const gs = SOC.myGuilds().filter((x) => x.min <= 30).map((x) => x.g);
  G.joinGuild(gs[0]); SOC.week(); SOC.leaveGuild();
  G.joinGuild(gs[1]); assert.ok(finishWeek(), 'paid in the second guild'); SOC.leaveGuild();
  G.joinGuild(gs[0]); assert.ok(SOC.week().done, 'already paid this week'); assert.ok(!finishWeek());
});

test('the clock moved a week forward and back pays the guild weekly goal once a week (#471)', () => {
  const t0 = new Date(2026, 10, 4, 12).getTime(); W.setNow(t0);
  W.character(30); G.joinGuild(SOC.myGuilds().find((x) => x.min <= 30).g);
  assert.ok(finishWeek());
  W.setNow(t0 + 7 * 86400000); assert.ok(finishWeek(), 'a new week pays');
  W.setNow(t0); assert.ok(SOC.week().done); assert.ok(!finishWeek(), 'not again for the old week');
});
