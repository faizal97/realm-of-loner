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

// a Trial cleared in time at level lvl, as the run's end reports it
const trialWin = (lvl) => {
  const Rec = G.trials(), act = G.trialPicks()[0];
  return G.trialDone({ act, trial: { lvl, season: Rec.season, bestHere: 0 } }, 60, 600);
};

test('the clock moved a week forward and back pays the weekly Trials goal once a week (#471)', () => {
  const t0 = new Date(2026, 10, 9, 12).getTime(); W.setNow(t0); W.character(60);
  const marks = () => G.account().marks;
  for (let i = 0; i < 4; i++) trialWin(2);
  W.setNow(t0 + 7 * 86400000); for (let i = 0; i < 4; i++) trialWin(2);
  W.setNow(t0); const m0 = marks(); for (let i = 0; i < 4; i++) trialWin(2);
  assert.strictEqual(marks() - m0, 4 * 7, 'only the Trials\' own Marks, no second weekly goal');
});

test('the clock moved to next month and back keeps this month\'s Trials (#472)', () => {
  const t0 = new Date(2026, 10, 20, 12).getTime(); W.setNow(t0); W.character(60);
  trialWin(8); const act = G.trialPicks()[0], open = G.trials().open[act];
  W.setNow(new Date(2026, 11, 2, 12).getTime()); G.trials();
  W.setNow(t0); const Rec = G.trials();
  assert.strictEqual(Rec.best[act].lvl, 8); assert.strictEqual(Rec.open[act], open);
  assert.ok(!Rec.history.some((h) => h.season === Rec.season), 'no history for a month not over');
});

test('a story scene during a pull does not stop the run clock (#470)', () => {
  W.character(20); const S = G.S; S.player.place = D.ACTIVITIES.deadmines.where;
  G.queueFor('deadmines'); S.queue.popAt = W.now() - 1; G.update(0.5); G.acceptPop();
  G.runPull(); W.advance(0.5);
  assert.ok(G.fight, 'a pull started'); const c0 = G.runClock();
  G.paused = true; try { W.advance(5); } finally { G.paused = false; }
  assert.ok(G.runClock() - c0 > 4, `run clock moved ${G.runClock() - c0}`);
});
