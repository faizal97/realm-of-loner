// Lanternwake (v10.13, #220 #221 #222): on from 24 October to 7 November every year in the player's own time (and in
// test builds whatever the date), candles up to a daily cap and gone when it ends, the keeper's wares kept by the
// account, the Snuffed Road at your own level with its loot once a day and the Wickless Steed by the 10th daily kill.
'use strict';
globalThis.TEST_TZ = 'Asia/Jakarta';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character, setNow, advance, store } = require('./world');

const at = (y, mo, d, h) => setNow(new Date(y, mo - 1, d, h || 12).getTime());
const LW = D.EVENTS.lanternwake;
// a whole Snuffed Road run, as a player plays it: queue, accept, every pull cleared, done
function playRoad(hard, onStart) {
  G.queueFor(LW.act, hard ? { hard: true } : undefined);
  assert.ok(G.S.queue, 'queued');
  G.acceptPop();
  if (onStart) onStart();
  for (let i = 0; i < 20000 && G.S.run && G.S.run.phase !== 'done'; i++) {
    const R = G.S.run; if (R.phase === 'rest') { R.restUntil = 0; G.runPull(); }
    if (G.fight) for (const e of G.fight.enemies) e.hp = 1;
    advance(0.25);
  }
  assert.ok(G.S.run && G.S.run.phase === 'done', 'the run was cleared');
  G.leaveGroup();
}
const fresh = () => { store.removeItem('azsolo.account'); };

test('on from 24 October to 7 November in the player\'s own time, every year; off outside it in a normal build', () => {
  character(20); fresh();
  at(2026, 10, 23, 23); assert.ok(!G.eventLive('lanternwake'), '23 October');
  at(2026, 10, 24, 0); assert.ok(G.eventLive('lanternwake'), '24 October, local midnight');
  at(2026, 11, 7, 23); assert.ok(G.eventLive('lanternwake'), '7 November, late');
  at(2026, 11, 8, 0); assert.ok(!G.eventLive('lanternwake'), '8 November');
  at(2027, 10, 30); assert.ok(G.eventLive('lanternwake'), 'back by itself next year');
  at(2026, 11, 20); assert.strictEqual(G.eventNext('lanternwake').getFullYear(), 2027, 'after it ends, it next starts next year');
  assert.strictEqual(G.lw(), null, 'no festival state outside it');
});

test('a test build (beta or dev) keeps it on whatever the date, and its candles never carry into the real season', () => {
  character(20); fresh();
  at(2026, 10, 12); globalThis.AZ_VERSION = '10.13.0-beta.1';
  try {
    assert.ok(G.eventLive('lanternwake'), 'forced on in a beta');
    assert.strictEqual(G.eventEnds('lanternwake'), null, 'no end date while forced');
    G.lwEarn(30, 'test'); assert.strictEqual(G.lw().candles, 30);
    at(2026, 10, 24); assert.strictEqual(G.lw().candles, 0, 'the real season starts fresh');
  } finally { delete globalThis.AZ_VERSION; }
  at(2026, 10, 12); assert.ok(!G.eventLive('lanternwake'), 'a normal build follows the dates');
});

test('candles: a kill that is not grey pays one, even at the level cap; the daily cap holds; midnight resets it; they go when it ends', () => {
  const { P } = character(60); fresh(); at(2026, 10, 25, 10);
  assert.strictEqual(G.lwKill(60, false), 1, 'a level-60 kill at 60 pays a candle (no XP there, still a candle)');
  assert.strictEqual(G.lwKill(55, false), 0, 'a grey kill (5 levels under) pays nothing');
  assert.strictEqual(G.lwKill(59, true), LW.earn.elite, 'an elite pays more');
  for (let i = 0; i < 200; i++) G.lwKill(60, false);
  assert.strictEqual(G.lw().today, LW.cap, 'stops at the daily cap');
  assert.strictEqual(G.lwEarn(5, 'x'), 0, 'nothing more today');
  at(2026, 10, 26, 0); assert.strictEqual(G.lw().today, 0, 'a new day');
  assert.strictEqual(G.lw().candles, LW.cap, 'the candles held stay');
  at(2026, 11, 8, 0); G.lwExpire(); assert.strictEqual(P.lw, undefined, 'gone when the festival ends');
});

test('Light the Way: a lantern at 5 different places out in the world a day pays its candles; never in a town', () => {
  const { P } = character(30); fresh(); at(2026, 10, 25, 10);
  const wild = Object.keys(D.PLACES).filter((k) => !D.PLACES[k].safe).slice(0, 6), town = Object.keys(D.PLACES).find((k) => D.PLACES[k].safe);
  P.place = town; assert.strictEqual(G.lwCanLight(town), null, 'no lantern in a town');
  for (let i = 0; i < 4; i++) { P.place = wild[i]; G.lwLight(); }
  P.place = wild[0]; assert.strictEqual(G.lwCanLight(wild[0]), 'lit', 'once a place a day');
  P.place = wild[4]; const before = G.lw().today; G.lwLight();
  assert.strictEqual(G.lw().today - before, LW.earn.light, 'the fifth pays');
  P.place = wild[5]; assert.strictEqual(G.lwCanLight(wild[5]), 'done');
});

test('the Wakekeeper: looks, Flicker and the title once each for the account; the candle sink as often as you like', () => {
  const { P } = character(30); fresh(); at(2026, 10, 25, 10);
  const st = G.lw(); st.candles = 1000;
  G.lwBuy('lw_robe'); assert.ok((G.account().looks || []).includes('chest:lw_robe'), 'the robe is in the wardrobe');
  const left = G.lw().candles; G.lwBuy('lw_robe'); assert.strictEqual(G.lw().candles, left, 'not twice');
  G.lwBuy('lantern_bearer'); assert.ok(G.titleUnlocked(D.TITLES.find((t) => t.id === 'lantern_bearer')), 'the title is earned');
  G.lwBuy('flicker'); assert.deepStrictEqual(G.companions(), ['flicker']); G.setCompanion('flicker'); assert.strictEqual(P.companion, 'flicker');
  G.lwBuy('lw_treat'); G.lwBuy('lw_treat'); assert.strictEqual(P.bags.filter((b) => b.item.id === 'lw_treat').reduce((n, b) => n + (b.n || 1), 0), 2, 'two treats');
  st.candles = 3; G.lwBuy('lw_lantern'); assert.ok(!(G.account().looks || []).includes('back:lw_lantern'), 'not without the candles');
  // a costume is only a look, for an hour
  G.lw().candles = 50; G.lwBuy('lw_costume_ghost');
  const idx = P.bags.findIndex((b) => b.item.id === 'lw_costume_ghost'); G.useItem(idx);
  assert.strictEqual(G.costumeOf(P), 'lw_ghost'); advance(1); at(2026, 10, 25, 12); assert.strictEqual(G.costumeOf(P), null, 'gone after an hour');
});

test('the Snuffed Road: fought at your own level, no gear; loot once a day; the Steed by the 10th daily kill; Hard after one clear', () => {
  const { P } = character(23); fresh(); at(2026, 10, 25, 10);
  assert.strictEqual(G.activityBlock(LW.act), null, 'open at 23, from anywhere');
  const bags = P.bags.length;
  playRoad(false, () => {
    assert.strictEqual(G.S.run.mobLevel, 23, 'the enemies are at your level');
    assert.ok(G.S.group.members.every((m) => m.syncLevel === 23), 'the group fights at your level');
  });
  assert.strictEqual(G.lw().lootDay, G.lw().day, 'today\'s loot taken');
  assert.ok(P.bags.length <= bags + 1, 'no gear from a festival run');
  assert.strictEqual(G.lwAccount().lw.steedKills, 1);
  playRoad(); assert.strictEqual(G.lwAccount().lw.steedKills, 1, 'a second kill the same day does not count');
  assert.ok(G.lwHardOpen(), 'Hard opens after a Normal clear');
  playRoad(true); assert.strictEqual(G.lwHardLeft().length, LW.set.length - 1, 'Hard: one recolour');
  for (let d = 26; d <= 35 && !G.lwAccount().lw.steed; d++) { at(2026, 10, d > 31 ? d - 31 : d, 10); if (d > 31) at(2026, 11, d - 31, 10); playRoad(); }
  assert.ok(G.lwAccount().lw.steed, 'the Steed by the 10th daily kill at the latest');
  assert.ok(P.mounts.includes('wickless_steed'));
  assert.ok(G.lwAccount().lw.steedKills <= LW.steedAt);
});

test('outside the festival the run and the keeper\'s wares are gone', () => {
  character(30); fresh(); at(2026, 12, 1);
  assert.strictEqual(G.activityBlock(LW.act), 'hidden');
  assert.strictEqual(G.lw(), null);
  assert.ok(/over/.test(G.lwBuy('lw_robe') || ''), 'the keeper is gone');
});
