// Between pulls the screen shows what the pull waits for (#159): a ✓ on each row that meets the pace's health and mana
// thresholds (your own row also needs your minimum rest over), a status line naming the hold-up, and no "ready?" in the
// tank's pull lines. The rule itself is unchanged: G.restState().topped is the old check, compared here on random states.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, E, B, character, now, setNow } = require('./world');

// a level-35 character in a dungeon run, between pulls
function resting(cls) {
  const { P, S } = character(35, cls || 'mage', 'human');
  G.startRoulette();
  assert.ok(S.run && S.run.phase === 'rest' && S.group, 'in a run, resting');
  return { P, S, R: S.run };
}
const manaMember = (S) => S.group.members.find((m) => D.CLASSES[m.cls].resource === 'mana');
const fill = (S, P) => { const v = G.vitals(); P.hp = v.maxHp; P.res = v.maxRes; for (const m of S.group.members) { const st = E.statsFor(m); m.hp = st.maxHp; m.res = st.maxMana; } };

test('the pull rule is the old one: topped matches the pre-#159 check on 300 random states', () => {
  const { P, S, R } = resting('mage');
  const PACE = { careful: { hp: 0.95, mana: 0.9, bossHp: 0.95 }, normal: { hp: 0.5, mana: 0.45, bossHp: 0.8 }, fast: { hp: 0.3, mana: 0.25, bossHp: 0.55 } };
  let tops = 0;
  for (let i = 0; i < 300; i++) {
    R.pace = ['careful', 'normal', 'fast'][i % 3]; R.idx = i % R.pulls.length;
    const v = G.vitals(); P.hp = v.maxHp * Math.random(); P.res = v.maxRes * Math.random();
    for (const m of S.group.members) { const st = E.statsFor(m); m.hp = Math.random() < 0.1 ? null : st.maxHp * (0.3 + 0.7 * Math.random()); m.res = Math.random() < 0.1 ? null : st.maxMana * Math.random(); m.gone = Math.random() < 0.05; }
    // the check as it was in runTick before #159
    const pace = PACE[R.pace], boss = R.pulls[R.idx] && R.pulls[R.idx].boss, need = boss ? { hp: Math.max(pace.hp, pace.bossHp), mana: Math.max(pace.mana, pace.bossHp) } : pace;
    const old = !need.hp || (P.hp >= v.maxHp * need.hp && (v.resType !== 'mana' || P.res >= v.maxRes * need.mana) && S.group.members.every((m) => { if (m.gone || m.hp == null) return true; const st = E.statsFor(m); return m.hp >= st.maxHp * need.hp && (D.CLASSES[m.cls].resource !== 'mana' || m.res == null || m.res >= st.maxMana * need.mana); }));
    assert.strictEqual(G.restState().topped, old, `state ${i}`); tops += old;
  }
  assert.ok(tops > 5 && tops < 295, `both outcomes were tried (${tops} topped)`);
  for (const m of S.group.members) m.gone = false;
});

test('marks: a member short of mana has none and the line names them with the numbers; topped up, everyone gets one', () => {
  const { P, S, R } = resting('mage'); R.pace = 'normal'; fill(S, P);
  const m = manaMember(S); assert.ok(m, 'a mana user in the group');
  const st0 = E.statsFor(m); m.res = st0.maxMana * 0.32;
  let st = G.restState();
  const row = st.rows.find((r) => r.char === m);
  assert.strictEqual(row.ready, false);
  assert.strictEqual(st.rows.filter((r) => !r.me && r.ready).length, S.group.members.length - 1, 'the others are marked');
  const need = Math.round(st.need.mana * 100);
  assert.strictEqual(G.restLine(), `Waiting for ${m.name}'s mana (32% of ${need}%)`);
  // a second one short of health: the furthest behind is named, "+1 more"
  const o = S.group.members.find((x) => x !== m); o.hp = E.statsFor(o).maxHp * 0.45;
  assert.strictEqual(G.restLine(), `Waiting for ${m.name}'s mana (32% of ${need}%) +1 more`);
  o.hp = E.statsFor(o).maxHp * 0.05;
  assert.strictEqual(G.restLine(), `Waiting for ${o.name}'s health +1 more`);
  fill(S, P); st = G.restState();
  assert.ok(st.rows.filter((r) => !r.me).every((r) => r.ready), 'every member marked');
});

test('your own row waits for your minimum rest, which Ready skips; then the line says everyone is ready', () => {
  const { P, S, R } = resting('mage'); fill(S, P);
  R.restUntil = now() + 4200;
  assert.strictEqual(G.restState().rows[0].ready, false, 'resting: no mark yet');
  assert.strictEqual(G.restLine(), 'Resting · 5 s');
  G.runReady();
  assert.strictEqual(G.restState().rows[0].ready, true, 'Ready: marked at once');
  assert.strictEqual(G.restLine(), 'Everyone ready. Pulling.');
});

test('the tank is told to pull when ready; a missing member comes first', () => {
  const { P, S } = resting('warrior'); fill(S, P);
  assert.strictEqual(G.role(), 'tank');
  S.run.restUntil = now() - 1;
  assert.strictEqual(G.restLine(), 'Everyone ready. Pull when you are.');
  S.group.members[0].gone = true;
  assert.strictEqual(G.restLine(), 'Looking for replacements...');
});

test('your own mana is "your mana"; past the 25 s cap the line says the group pulls anyway', () => {
  const { P, S, R } = resting('mage'); R.pace = 'careful'; fill(S, P);
  P.res = G.vitals().maxRes * 0.2; R.restUntil = now() - 1000;
  assert.match(G.restLine(), /^Waiting for your mana \(20% of 90%\)$/);
  R.restUntil = now() - 25001;
  assert.strictEqual(G.restLine(), 'Pulling anyway.');
});

test('the tank\'s pull line is never "ready?"', () => {
  const { S } = resting('mage');
  const bot = S.group.members[0].bot;
  const lines = new Set(); for (let i = 0; i < 400; i++) lines.add(B.partyLine(bot, 'pull'));
  assert.ok(lines.size >= 2 && ![...lines].some((l) => /ready\?/i.test(l)), [...lines].join(' | '));
});
