// #295: the fight log. A real Lanternwake run is lost on purpose (the boss hits 20x); the log of that fight has every
// section, its deaths are the Deaths recap's, every red bar that landed names each member who had an answer, and the
// file stays small. A won fight is never kept.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character, setNow, now } = require('./world');
const FLOG = globalThis.FLOG;

function loseRun() {
  setNow(new Date(2026, 10, 1, 19).getTime()); // Lanternwake is on
  const { S, P } = character(52, 'priest');
  P.place = D.ACTIVITIES.ev_snuffed_road.where; P.hp = null; P.res = null;
  FLOG.clear();
  G.queueFor('ev_snuffed_road'); G.acceptPop();
  const R = S.run; assert.ok(R, 'in the run');
  R.pulls = R.pulls.filter((p) => p.boss); R.bossMult = { hp: R.bossMult.hp, dmg: 20 };
  let lost = null;
  for (let g = 0; g < 40000 && !lost; g++) {
    if (G.fight && G.pUnit && G.pUnit.kind === 'player') { G.pUnit.kind = 'bot'; G.pUnit.isPlayer = true; G.pUnit.bot = { skill: 0.7, react: 0.5 }; G.pUnit.role = 'healer'; }
    const C = G.fight; G.update(0.1); setNow(now() + 100);
    if (C && C.over === 'lose') lost = C;
  }
  return lost;
}

test('a lost fight: every section, the recap\'s deaths, and each landed red bar names who could answer', () => {
  const C = loseRun();
  assert.ok(C, 'the fight was lost');
  const L = FLOG.lost(); assert.ok(L, 'the lost fight is kept');
  const txt = FLOG.text();
  for (const h of ['Realm of Loner fight log', 'GROUP (as the fight began)', 'ENEMIES', 'WHAT KILLED US', 'RED BARS', 'TOTALS', 'TIMELINE (every event)']) assert.ok(txt.includes(h), h);
  assert.match(txt, /The Snuffed Road · pull 1\/1/);
  assert.match(txt, /^you Tester/m, 'the player is "you"');
  assert.ok(L.members.filter((m) => m.who === 'bot').every((m) => m.skill != null), 'every bot shows its skill');
  assert.deepEqual(L.deaths.map((d) => d.name), C.recap.deaths.map((d) => d.name), 'deaths are the recap\'s');
  for (const d of C.recap.deaths) assert.ok(txt.includes(`${d.name} ${G.recapText(d).head}`), d.name);
  const landed = L.bars.filter((b) => !b.cut && b.fates.length);
  assert.ok(landed.length > 0, 'a red bar landed');
  for (const b of landed) for (const m of L.members) {
    const f = b.fates.find((x) => x.startsWith(m.name + ':'));
    if (f) assert.match(f, /: (kicked|mended|braced|avoided it|blocked|cut it|.+: (dead|on cooldown|ready|kicks already full|already mended))/, f);
  }
  assert.ok(txt.length < 200000, `${txt.length} characters`);
  assert.match(FLOG.fileName(), /^fightlog-the-snuffed-road-pull1\.txt$/);
});

test('a won fight is not kept, and the next lost fight replaces the last', () => {
  FLOG.clear();
  const C = { kind: 'solo', t: 0, allies: [], enemies: [], units: {}, over: null };
  FLOG.feed(C, []); C.over = 'win'; FLOG.end(C);
  assert.strictEqual(FLOG.lost(), null);
  const C2 = { kind: 'solo', t: 3, allies: [], enemies: [], units: {}, over: null };
  FLOG.feed(C2, []); C2.over = 'lose'; FLOG.end(C2);
  assert.ok(FLOG.lost()); assert.strictEqual(FLOG.lost().t, 3);
});
