// This week (#541): banners picked by date from D.WEEK, a live festival first, the next festival when nothing is on,
// and steps that tick themselves from the character's real progress.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

const at = (s) => new Date(s + 'T12:00:00');
const ids = (d) => G.weekBanners(at(d)).map((b) => b.id);
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
    const on = G.weekBanners(at('2026-12-16'));
    assert.strictEqual(on[0].event, 'longnight'); assert.strictEqual(on[1].id, 'x');
  });
  withWeek([], () => {
    const off = G.weekBanners(at('2026-11-20'));
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
