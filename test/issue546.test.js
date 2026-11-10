// #546: in a time zone ahead of UTC, The Daily Board showed yesterday's bounty as done until the UTC day turned (07:00 in
// UTC+7), and The Weekly Board showed last week's guild goal until Monday 07:00. Both now turn at local midnight.
'use strict';
globalThis.TEST_TZ = 'Asia/Jakarta'; // UTC+7 (test/world.js sets it)
const test = require('node:test');
const assert = require('node:assert');
const { G, SOC, character, setNow } = (() => { const w = require('./world'); return { ...w, SOC: globalThis.SOC }; })();

test("yesterday's daily bounty is not done today, from local midnight", () => {
  character(30);
  setNow(new Date(2026, 10, 10, 18).getTime()); // Tuesday 18:00
  G.S.player.bounty = { x: { mob: 'm', n: 1, prog: 1, done: true, weekly: false, day: '2026-11-10' } };
  assert.strictEqual(G.WEEK_CHECKS.bounty_day(), true, 'done today');
  setNow(new Date(2026, 10, 11, 0, 30).getTime()); // Wednesday 00:30 local, still Tuesday in UTC
  assert.strictEqual(G.WEEK_CHECKS.bounty_day(), false, 'a new day');
});

test("last week's guild goal is not done on Monday at 00:30", () => {
  character(30); G.S.player.guild = 0;
  setNow(new Date(2026, 10, 15, 20).getTime()); // Sunday 20:00
  const w = SOC.week(); assert.ok(w); w.done = true;
  assert.strictEqual(G.WEEK_CHECKS.guild_goal(), true);
  setNow(new Date(2026, 10, 16, 0, 30).getTime()); // Monday 00:30 local, still Sunday in UTC
  assert.strictEqual(G.WEEK_CHECKS.guild_goal(), false, 'a new week');
});
