// This week (#541): banners picked by date from D.WEEK, a live festival first, the next festival when nothing is on,
// and steps that tick themselves from the character's real progress.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

const at = (s) => new Date(s + 'T12:00:00');
const ids = (d) => G.weekBanners(at(d)).filter((b) => !b.board).map((b) => b.id);
const keep = D.WEEK;
const withWeek = (list, fn) => { D.WEEK = list; try { return fn(); } finally { D.WEEK = keep; } };
const B = (id, kind, from, to, steps) => ({ id, kind, from, to, art: ['scene', 'goldshire'], title: id, text: ['x'], steps: steps || [] });

test('banners show from their first day to their last, on now first, then new, then coming', () => {
  character(30);
  withWeek([B('c', 'soon', '2026-11-09', '2026-11-13'), B('b', 'new', '2026-11-09', '2026-11-13'), B('a', 'now', '2026-11-10', '2026-11-20')], () => {
    assert.deepStrictEqual(ids('2026-11-09'), ['b', 'c']);
    assert.deepStrictEqual(ids('2026-11-13'), ['a', 'b', 'c'], 'the last day still counts');
    assert.deepStrictEqual(ids('2026-11-14'), ['a']);
  });
});

test('a live festival comes first; with nothing on, the next festival shows as coming', () => {
  character(30);
  withWeek([B('x', 'new', '2026-12-14', '2026-12-20')], () => {
    const on = G.weekBanners(at('2026-12-16')).filter((b) => !b.board);
    assert.strictEqual(on[0].event, 'longnight'); assert.strictEqual(on[1].id, 'x');
  });
  withWeek([], () => {
    const off = G.weekBanners(at('2026-11-20')).filter((b) => !b.board);
    assert.strictEqual(off.length, 1); assert.strictEqual(off[0].kind, 'soon'); assert.ok(off[0].event);
  });
});

test('steps tick from real progress; a tip is not counted', () => {
  const { S, P } = character(30);
  const steps = [{ text: 'a', check: ['level', 30] }, { text: 'b', check: ['level', 60] }, { text: 'c', check: ['friends', 1] }, { text: 'd', check: ['guild', 1] }, { text: 'tip' }];
  P.guild = -1; S.soc = S.soc || {}; S.soc.friends = {};
  assert.deepStrictEqual(steps.map(G.weekStepDone), [true, false, false, false, null]);
  assert.deepStrictEqual(G.weekProgress([{ steps }]), { n: 1, of: 4 });
  S.soc.friends[S.bots[0].id] = { since: 0 }; P.guild = 0;
  assert.deepStrictEqual(G.weekProgress([{ steps }]), { n: 3, of: 4 });
});

test("this week's real banners are valid and on for the patch week", () => {
  character(30);
  const on = ids('2026-11-10');
  for (const id of ['prepatch_teaser', 'living_realm', 'faire_soon']) assert.ok(on.includes(id), id);
  for (const b of D.WEEK) for (const st of b.steps) if (st.check) assert.ok(G.WEEK_CHECKS[st.check[0]], st.check[0]);
});

test('featured dungeons: one per level band, the same all week, a new set on Saturday, only while its banner is on', () => {
  character(30);
  const wk = (d) => G.featuredDungeons(at(d));
  assert.deepStrictEqual(wk('2026-11-09'), wk('2026-11-13'), 'Monday to Friday: the same');
  assert.notDeepStrictEqual(wk('2026-11-13'), wk('2026-11-14'), 'Saturday: a new set');
  assert.strictEqual(wk('2026-11-09').length, G.FD_BANDS.length + 1);
  for (const k of wk('2026-11-09')) assert.ok(!D.DUNGEONS[D.ACTIVITIES[k].dungeon].raid);
  assert.ok(G.featuredDungeonsOn(at('2026-11-10'))); assert.ok(!G.featuredDungeonsOn(at('2026-11-20')), 'no banner, no bonus');
  const mine = G.featuredDungeonFor(30, at('2026-11-10')), A = D.ACTIVITIES[mine];
  assert.ok(A.minLvl >= 22 && A.minLvl < 33, 'level 30 gets the 22–32 band');
});

test('a featured dungeon pays ×1.5 for speed and no wipes, and a bonus on the first clear of the week only', () => {
  const realNow = Date.now; Date.now = () => at('2026-11-10').getTime();
  try {
    const { S, P } = character(30); const act = G.featuredDungeonFor(30);
    assert.ok(act && G.isFeaturedDungeon(act));
    const run = () => { const m0 = P.money; S.run = { act, wipes: 0, noSpeed: true, help: null, started: Date.now() - 600000 }; G._runBonuses(S.run); return P.money - m0; };
    const first = run(), second = run(), L = G.syncLevel(act);
    assert.strictEqual(second, Math.round(L * 200 * G.FD_MULT), 'no-wipe gold ×1.5');
    assert.strictEqual(first - second, L * 250, 'the first clear adds the bonus gold');
    assert.ok(G.featuredDungeonClaimed());
  } finally { Date.now = realNow; }
});

test('the featured raid shows its own banner at level 60, not below', () => {
  character(59); assert.ok(!G.weekBanners(at('2026-11-10')).some((b) => /^raid_/.test(b.id)));
  character(60); const b = G.weekBanners(at('2026-11-10')).find((x) => /^raid_/.test(x.id));
  assert.ok(b && b.title.startsWith('Featured raid: '));
  assert.deepStrictEqual(b.art, ['banner', 'raid_' + G.featuredRaid(at('2026-11-10'))]);
});

test('the boards: only the steps this character can do, each ticking from what the game keeps', () => {
  const { P } = character(30); P.guild = -1;
  const wk = () => G.weekBanners(at('2026-11-10')).find((b) => b.board === 'week'), dy = () => G.weekBanners(at('2026-11-10')).find((b) => b.board === 'day');
  assert.deepStrictEqual(wk().steps.map((x) => x.check[0]), ['bounty_week'], 'no guild, not 60: the bounty only');
  assert.deepStrictEqual(dy().steps.map((x) => x.check[0]), ['bounty_day', 'roulette'], 'below the Brawl\'s level');
  P.guild = 0; assert.ok(wk().steps.some((x) => x.check[0] === 'guild_goal'));
  const { P: Q } = character(60); Q.guild = -1;
  assert.deepStrictEqual(wk().steps.map((x) => x.check[0]), ['bounty_week', 'world_boss', 'trials_week']);
  assert.ok(dy().steps.some((x) => x.check[0] === 'brawl_chest'));
  assert.ok(dy().quiet, 'the Daily Board never opens This week by itself');
  // a done weekly bounty ticks
  assert.strictEqual(G.weekStepDone({ check: ['bounty_week'] }), false);
  const b = G.bounties(Object.keys(D.PLACES).find((k) => G.isHub(k) && G.bounties(k).length)).find((x) => x.weekly);
  G.acceptBounty(b); Q.bounty[b.id].prog = b.n; G.turnInBounty(b);
  assert.strictEqual(G.weekStepDone({ check: ['bounty_week'] }), true);
});
