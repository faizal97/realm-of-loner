// #183: four clocks (local midnight, local Monday, the Trials' Omen periods, 6-hour UTC rare-hunt windows) and screens that
// didn't say when things change ("Omens change every week", which they don't). One helper, G.nextChange(kind), gives
// every screen its time, and G.whenText words it: 'midnight', a clock time today, else 'Mon 9 Nov'.
'use strict';
globalThis.TEST_TZ = 'Asia/Jakarta';
const test = require('node:test');
const assert = require('node:assert');
const { G, character, setNow } = require('./world');

const at = (y, mo, d, h, mi) => { const t = new Date(y, mo - 1, d, h || 0, mi || 0).getTime(); setNow(t); return t; };
const day = (ms) => { const d = new Date(ms); return [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()]; };

test('daily: the next local midnight', () => {
  character(10);
  at(2026, 11, 3, 9, 30); assert.deepStrictEqual(day(G.nextChange('day')), [2026, 11, 4, 0, 0]);
  at(2026, 12, 31, 23, 59); assert.deepStrictEqual(day(G.nextChange('day')), [2027, 1, 1, 0, 0]);
  assert.strictEqual(G.whenText(G.nextChange('day')), 'midnight');
});

test('weekly: the next local Monday, a full week on a Monday', () => {
  at(2026, 11, 3, 12); assert.deepStrictEqual(day(G.nextChange('week')), [2026, 11, 9, 0, 0]);   // Tuesday -> Mon 9 Nov
  at(2026, 11, 9, 0, 1); assert.deepStrictEqual(day(G.nextChange('week')), [2026, 11, 16, 0, 0]); // Monday -> next Monday
  at(2026, 11, 8, 15); assert.strictEqual(G.whenText(G.nextChange('week')), 'midnight');          // Sunday: tonight
  at(2026, 11, 3, 12); assert.strictEqual(G.whenText(G.nextChange('week')), 'Mon 9 Nov');
});

test('Omens: the 1st, 8th, 15th and 22nd, and they agree with the Trials calendar', () => {
  at(2026, 11, 3); assert.deepStrictEqual(day(G.nextChange('omens')), [2026, 11, 8, 0, 0]);
  at(2026, 11, 22, 10); assert.deepStrictEqual(day(G.nextChange('omens')), [2026, 12, 1, 0, 0]);
  const T = globalThis.TRIALS;
  for (const d of [1, 7, 8, 14, 15, 21, 22, 30]) {
    const t = at(2026, 11, d, 12), n = G.nextChange('omens');
    assert.notStrictEqual(T.period(new Date(n)).id, T.period(new Date(t)).id, `day ${d}: a new period starts then`);
    assert.strictEqual(T.period(new Date(n - 1)).id, T.period(new Date(t)).id, `day ${d}: and not before`);
  }
});

test('rare hunts: the next 6-hour window in UTC, shown as a clock time today', () => {
  const t = at(2026, 11, 3, 9, 30), n = G.nextChange('hunt');
  assert.strictEqual(n % G.HUNT_WINDOW, 0); assert.ok(n > t && n - t <= G.HUNT_WINDOW);
  assert.match(G.whenText(n), /^\d\d:\d\d$/);
});

test('the group finder\'s clocks are these: the Roulette is ready again at the next midnight, the featured raid and world boss change at the next Monday', () => {
  character(60);
  const t = at(2026, 11, 3, 15), S = G.S;
  S.flags.rouletteDay = new Date(t).getFullYear() + '-' + String(new Date(t).getMonth() + 1).padStart(2, '0') + '-' + String(new Date(t).getDate()).padStart(2, '0'); S.flags.rouletteLocal = true;
  const dn = G.nextChange('day');
  setNow(dn - 1); assert.strictEqual(G.rouletteReady(), false, 'done until midnight');
  setNow(dn); assert.strictEqual(G.rouletteReady(), true, 'ready at midnight');
  setNow(t); const wn = G.nextChange('week');
  G.raidWeek().featured = true;
  setNow(wn - 1); assert.strictEqual(G.featuredClaimed(), true, 'the featured bonus stays taken until Monday');
  assert.strictEqual(G.featuredRaid(new Date(wn - 1)), G.featuredRaid(new Date(t)), 'the same raid until Monday');
  assert.strictEqual(G.worldBoss(new Date(wn - 1)), G.worldBoss(new Date(t)), 'the same world boss until Monday');
  setNow(wn); assert.strictEqual(G.featuredClaimed(), false, 'a new week at Monday');
});
