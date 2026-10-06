// Hard raids (v10.7, fast, in the build): the rules, not the tuning (sim/hardraid.js tunes). Hard opens after a Normal
// clear at the cap; a Hard run uses the Hard numbers and the boss's extra mechanic fires at its mark; the first kill of
// a boss in a week drops its items two upgrade steps up and the second does not; the week resets on Monday; the
// briefing text names the extra mechanic with its numbers; Hard clears count in the codex.
require('./_seed.js'); // seeded (#125): the same commit always gives the same result; SEED=n picks other dice
globalThis.localStorage = (() => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; })();
require('../src/data.js'); require('../src/engine.js'); require('../src/bots.js'); require('../src/game.js'); require('../src/trials.js');
const { G, D, E } = globalThis;
const RealDate = Date; let t = new RealDate(2026, 9, 14, 12).getTime(); // a Wednesday
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(t); } static now() { return t; } };
let ok = 0, bad = 0; const check = (c, m) => { if (c) ok++; else { bad++; console.log('FAIL ' + m); } };
const raids = Object.keys(D.ACTIVITIES).filter((k) => { const A = D.ACTIVITIES[k]; return A.dungeon && D.DUNGEONS[A.dungeon].hard; });
check(raids.length >= 1, 'at least one raid has Hard');
for (const act of raids) {
  const Dg = D.DUNGEONS[D.ACTIVITIES[act].dungeon];
  check(Dg.hard.bossMult.hp > Dg.bossMult.hp && Dg.hard.bossMult.dmg > Dg.bossMult.dmg && Dg.hard.trashMult.hp > Dg.trashMult.hp, `${act}: Hard is stronger than Normal`);
  const bosses = [...new Set(Dg.pulls.filter((p) => p.boss).flatMap((p) => p.mobs.filter((m) => D.MOBS[m].boss)))]; // every boss, both Twin Tides too
  for (const b of bosses) check(Dg.hard.extra && Dg.hard.extra[b] && Dg.hard.extra[b].length, `${act}: ${b} has an extra Hard mechanic`);
  // opens after a Normal clear, at the cap
  G.newGame({ name: 'H', cls: 'warrior', race: 'human' }); const S = G.S, P = S.player; S.flags.warModeAsked = true; P.place = D.ACTIVITIES[act].where;
  P.level = 59; P.codex = { [act]: { clears: 1 } }; check(!G.hardOpen(act), `${act}: not open below the cap`);
  P.level = 60; P.codex = {}; check(!G.hardOpen(act), `${act}: not open before a Normal clear`);
  G.queueFor(act, { hard: true }); check(!S.queue, `${act}: a Hard queue is refused before a Normal clear`);
  P.codex = { [act]: { clears: 1 } }; check(G.hardOpen(act), `${act}: open after a Normal clear`);
  G.queueFor(act, { hard: true }); check(S.queue && S.queue.hard, `${act}: Hard queue`); G.acceptPop();
  check(S.run && S.run.hard && S.run.bossMult === Dg.hard.bossMult && /Hard/.test(S.run.name), `${act}: the run uses the Hard numbers`);
  // every boss's extra mechanic: the briefing text names it, and it does what it says
  for (const b of bosses) for (const x of Dg.hard.extra[b]) {
    const kind = x.kind || 'adds', mk = () => { const u = E.mobUnit(b, 60, Dg.hard.bossMult); u.hardX = G.hardExtra(act, b).filter((y) => (y.kind || 'adds') === kind); return u; };
    const facts = E.specialFacts(mk()).join(' ');
    check(/Hard: /.test(facts), `${act} ${b}: the briefing names the ${kind} mechanic (${facts})`);
    // the mechanic itself, on a copy of the boss that barely hurts (so the fight runs long enough) and no own special
    const u = E.mobUnit(b, 60, { hp: 50, dmg: 0.001 }); u.hardX = G.hardExtra(act, b).filter((y) => (y.kind || 'adds') === kind); u.special = null;
    const C = E.fight([E.charUnit(P, 'ally', 'bot', t)], [u], {}), me = C.allies[0]; me.hp = me.maxHp = 1e9;
    if (kind === 'adds') {
      u.hp = Math.floor(u.maxHp * (x.at + 0.05)); E.tick(C, 0.1); const n0 = C.enemies.length;
      u.hp = Math.floor(u.maxHp * (x.at - 0.02)); E.tick(C, 0.1); const n1 = C.enemies.length; E.tick(C, 0.1);
      check(n1 - n0 === x.n && C.enemies.length === n1, `${act} ${b}: ${x.n} join at ${x.at} (${n0} → ${n1}), once`);
    } else if (kind === 'enrage') {
      u.hp = Math.floor(u.maxHp * (x.at + 0.05)); E.tick(C, 0.1); const e0 = u.enrage || 1;
      u.hp = Math.floor(u.maxHp * (x.at - 0.02)); E.tick(C, 0.1); E.tick(C, 0.1);
      check(e0 === 1 && Math.abs((u.enrage || 1) - x.mult) < 1e-9, `${act} ${b}: hits ${x.mult}x below ${x.at} (${e0} → ${u.enrage})`);
    } else if (kind === 'heal') {
      u.hp = Math.floor(u.maxHp * 0.5); const h0 = u.hp; let n = 0;
      for (let i = 0; i < Math.round(x.every * 10 * 1.2); i++) { me.hp = me.maxHp; E.tick(C, 0.1); n += C.events.filter((e) => e.type === 'emote' && e.uid === u.uid && e.text === x.text).length; C.events.length = 0; }
      check(n === 1, `${act} ${b}: heals once in ${x.every * 1.2} sec (${n})`);
    } else {
      let n = 0;
      for (let i = 0; i < Math.round(x.every * 10 * 1.2); i++) { me.hp = me.maxHp; E.tick(C, 0.1); n += C.events.filter((e) => e.type === 'dmg' && e.src === u.uid && e.ab === 'hard_' + (x.school || 'hit')).length; C.events.length = 0; }
      check(n >= 1 && n <= (x.who === 'all' ? C.allies.length : 1), `${act} ${b}: the timed hit lands once in ${x.every * 1.2} sec (${n})`);
    }
  }
  const b0 = bosses[0];
  // loot: two steps up the first time this week, Normal the second time, again after Monday
  const it = G.hardCopy(D.MOBS[b0].loot[0]), base = G.copyItem(D.MOBS[b0].loot[0]), ib = G.upgradeInfo(base), ih = G.upgradeInfo(it);
  check(it.hard && Math.abs((ih.pts - ib.pts) - Math.min(G.HARD_STEPS * D.UPGRADE.step * G.upgradeRef(base), D.UPGRADE.cap[base.q] * G.upgradeRef(base) - ib.pts)) < 0.02, `${act}: a Hard drop is ${G.HARD_STEPS} steps up (${ib.pct}% → ${ih.pct}%)`);
  check(G.hardBonusLeft(act, b0), `${act}: bonus open at the start of the week`);
  G.raidWeek().got[act + ':' + b0] = true; check(!G.hardBonusLeft(act, b0), `${act}: bonus taken`);
  t += 7 * 86400000; check(G.hardBonusLeft(act, b0), `${act}: bonus back after the Monday reset`);
}
// a real Hard clear with a very strong group: finishes, counts a Hard clear, and takes the weekly bonus
{
  const act = raids[0], Dg = D.DUNGEONS[D.ACTIVITIES[act].dungeon];
  G.newGame({ name: 'H', cls: 'warrior', race: 'human' }); const S = G.S, P = S.player; S.flags.warModeAsked = true; P.level = 60; P.place = D.ACTIVITIES[act].where;
  P.equip = G.botChar({ name: 'x', cls: 'warrior', race: 'human', level: 60, skill: 0.8 }).equip; P.talents = G.autoTalents('warrior', 'dps', 60, 0); P.hp = null; P.res = null;
  P.codex = { [act]: { clears: 1 } };
  const saved = JSON.stringify(Dg.hard); Dg.hard.bossMult = { hp: 1, dmg: 1 }; Dg.hard.trashMult = { hp: 1, dmg: 1 }; // the rules, not the numbers
  G.queueFor(act, { hard: true }); G.acceptPop();
  let g = 0; while (S.run && S.run.phase !== 'done' && g++ < 300000) {
    if (G.fight && G.pUnit && G.pUnit.kind === 'player') { G.pUnit.kind = 'bot'; G.pUnit.bot = { skill: 0.8, react: 0.4 }; G.pUnit.role = G.role(); }
    for (const r of (S.run.rolls || [])) if (!r.done && !r.player) { try { G.roll(S.run.rolls.indexOf(r), 'pass'); } catch (e) {} }
    if (S.run && S.run.phase === 'rest' && S.run.restUntil <= t) { try { G.runPull(); } catch (e) {} }
    G.update(0.1); t += 100;
  }
  if (bad || process.env.DEBUG) console.log('run end:', S.run && S.run.phase, S.run && S.run.idx, S.run && S.run.wipes, g, S.group && S.group.members.length);
  Object.assign(Dg.hard, JSON.parse(saved));
  check(S.run && S.run.phase === 'done', 'a Hard run can be finished');
  check(P.codex[act].hard === 1 && P.codex[act].clears === 2, `the codex counts the Hard clear (${JSON.stringify(P.codex[act])})`);
  const b0 = Dg.pulls.filter((p) => p.boss)[0].mobs[0];
  check(!G.hardBonusLeft(act, b0), 'the weekly bonus was taken by the kill');
  check((S.run.rolls || []).some((r) => r.item.hard), 'the kill dropped Hard items');
}
// the featured raid: fixed for a whole week, every raid gets a turn, and new raids (none, one, many) join cleanly
{
  const W = (y, m, d) => new RealDate(y, m - 1, d, 12), fr = (d) => G.featuredRaid(d);
  check(fr(W(2026, 10, 12)) === fr(W(2026, 10, 18)), 'the featured raid is the same Monday to Sunday');
  const turns = new Set([0, 1, 2, 3, 4, 5].map((i) => fr(W(2026, 10, 5 + 7 * i))));
  check(turns.size === G.raidActs().length, `every raid is featured in turn (${[...turns].join(', ')})`);
  const before = [0, 1, 2, 3].map((i) => fr(W(2026, 10, 12 + 7 * i)));
  const addRaid = (k, since) => { D.DUNGEONS[k] = Object.assign({}, D.DUNGEONS.onyxias_lair, { since }); D.ACTIVITIES[k] = Object.assign({}, D.ACTIVITIES.onyxias_lair, { dungeon: k }); };
  const drop = (...ks) => { for (const k of ks) { delete D.DUNGEONS[k]; delete D.ACTIVITIES[k]; } };
  addRaid('zz_new_a', '2026-10-14'); // one new raid, shipped on a Wednesday
  check(fr(W(2026, 10, 12)) === before[0] && fr(W(2026, 10, 18)) === before[0], 'a raid shipped mid-week does not change that week');
  check(fr(W(2026, 10, 19)) === 'zz_new_a', 'a new raid is featured the first full week after it ships');
  addRaid('zz_new_b', '2026-10-15'); // many: two in the same week
  check(fr(W(2026, 10, 19)) === 'zz_new_b', 'two new raids: the newest first');
  const later = new Set([1, 2, 3, 4, 5, 6, 7].map((i) => fr(W(2026, 10, 19 + 7 * i))));
  check(later.has('zz_new_a') && later.has('zz_new_b') && later.size === G.raidActs().length, 'afterwards the new ones take turns with the rest');
  drop('zz_new_a', 'zz_new_b');
  check([0, 1, 2, 3].every((i) => fr(W(2026, 10, 12 + 7 * i)) === before[i]), 'no new raid: the rotation is as before');
}
// the featured bonus: the first clear of the featured raid in a week pays the Marks once
{
  const act = G.raidActs()[0], Dg = D.DUNGEONS[D.ACTIVITIES[act].dungeon];
  while (G.featuredRaid(new Date(t)) !== act) t += 7 * 86400000;
  const runOnce = () => {
    G.newGame({ name: 'F', cls: 'warrior', race: 'human' }); const S = G.S, P = S.player; S.flags.warModeAsked = true; P.level = 60; P.place = D.ACTIVITIES[act].where;
    P.equip = G.botChar({ name: 'x', cls: 'warrior', race: 'human', level: 60, skill: 0.8 }).equip; P.talents = G.autoTalents('warrior', 'dps', 60, 0);
    const saved = [Dg.bossMult, Dg.trashMult]; Dg.bossMult = { hp: 1, dmg: 1 }; Dg.trashMult = { hp: 1, dmg: 1 };
    G.queueFor(act); G.acceptPop();
    let g = 0; while (S.run && S.run.phase !== 'done' && g++ < 300000) {
      if (G.fight && G.pUnit && G.pUnit.kind === 'player') { G.pUnit.kind = 'bot'; G.pUnit.bot = { skill: 0.8, react: 0.4 }; G.pUnit.role = G.role(); }
      for (const r of (S.run.rolls || [])) if (!r.done && !r.player) { try { G.roll(S.run.rolls.indexOf(r), 'pass'); } catch (e) {} }
      if (S.run && S.run.phase === 'rest' && S.run.restUntil <= t) { try { G.runPull(); } catch (e) {} }
      G.update(0.1); t += 100;
    }
    [Dg.bossMult, Dg.trashMult] = saved; return S;
  };
  const m0 = G.account().marks; const S1 = runOnce(); const m1 = G.account().marks;
  check(S1.run && S1.run.phase === 'done' && m1 - m0 === G.clearMarks(act) + G.FEATURED_MARKS && G.featuredClaimed(), `the featured clear pays +${G.FEATURED_MARKS} once (${m1 - m0})`);
  const P1 = S1.player; P1.level = 60; S1.run = null; S1.group = null; P1.place = D.ACTIVITIES[act].where;
  G.queueFor(act); G.acceptPop(); const m2a = G.account().marks;
  const saved = [Dg.bossMult, Dg.trashMult]; Dg.bossMult = { hp: 1, dmg: 1 }; Dg.trashMult = { hp: 1, dmg: 1 };
  let g = 0; while (S1.run && S1.run.phase !== 'done' && g++ < 300000) {
    if (G.fight && G.pUnit && G.pUnit.kind === 'player') { G.pUnit.kind = 'bot'; G.pUnit.bot = { skill: 0.8, react: 0.4 }; G.pUnit.role = G.role(); }
    for (const r of (S1.run.rolls || [])) if (!r.done && !r.player) { try { G.roll(S1.run.rolls.indexOf(r), 'pass'); } catch (e) {} }
    if (S1.run && S1.run.phase === 'rest' && S1.run.restUntil <= t) { try { G.runPull(); } catch (e) {} }
    G.update(0.1); t += 100;
  }
  [Dg.bossMult, Dg.trashMult] = saved;
  check(G.account().marks - m2a === G.clearMarks(act), `the second clear that week pays only the normal Marks (${G.account().marks - m2a})`);
}
// the raid sets (v10.7): every raid has looks; a Hard drop carries the Hard recolour; the wardrobe lists both; the
// featured bonus gives a look you do not have; a whole raid on Hard gives its title
{
  for (const act of raids) {
    const Dg = D.DUNGEONS[D.ACTIVITIES[act].dungeon], ids = new Set(); for (const p of Dg.pulls) for (const m of p.mobs) for (const id of (D.MOBS[m].loot || [])) ids.add(id);
    const withLook = [...ids].filter((id) => D.ITEMS[id].look);
    check(withLook.length >= 4, `${act}: its set has ${withLook.length} looks`);
    const hc = G.hardCopy(withLook[0]); check(hc.look && hc.look[1] === D.ITEMS[withLook[0]].look[1] + '_hard', `${act}: a Hard drop carries the Hard look (${hc.look})`);
    const T = D.TITLES.find((x) => x.need && x.need.hard === act);
    G.newGame({ name: 'L', cls: 'priest', race: 'human' }); G.S.player.level = 60;
    check(T && !G.titleUnlocked(T), `${act}: a Hard title, locked before a Hard clear`);
    G.S.player.codex = { [act]: { clears: 3, hard: 1 } }; check(T && G.titleUnlocked(T), `${act}: the Hard title after a Hard clear`);
  }
  G.newGame({ name: 'L', cls: 'priest', race: 'human' });
  const all = G.wardrobeAll('chest'), n = all.filter((o) => /_hard$/.test(o.key)).length, base = all.filter((o) => all.some((h) => h.key === o.key + '_hard')).length;
  check(n >= 3 && n === base, `the wardrobe lists a Hard recolour for each raid chest a priest can wear (${n})`);
  const a0 = G.account(); a0.looks = []; G.saveAccount(a0); const act = G.raidActs()[0], left = G.raidLooksLeft(act);
  check(left.length && G.canUseItem(D.ITEMS[left[0]], 'priest'), `the featured look is one this class can wear first (${left[0]})`);
}
// at the cap, dungeons and raids queue from anywhere (the group summons you); below it, and for Wanted, you go there
{
  G.newGame({ name: 'Q', cls: 'warrior', race: 'human' }); const S = G.S, P = S.player; S.flags.warModeAsked = true; P.place = 'stormwind';
  P.level = 60; check(!G.activityBlock('molten_core') && !G.activityBlock('onyxias_lair') && !G.activityBlock('stratholme'), `at 60, raids and dungeons queue from Kingsmere (${G.activityBlock('molten_core')})`);
  const w60 = Object.keys(D.ACTIVITIES).find((k) => !D.ACTIVITIES[k].dungeon && !D.ACTIVITIES[k].needQuest && !D.ACTIVITIES[k].bg && !D.ACTIVITIES[k].worldBoss && D.ACTIVITIES[k].where && D.ACTIVITIES[k].maxLvl >= 60 && D.PLACES[D.ACTIVITIES[k].where].region !== 'elwynn');
  check(!w60 || /^Go to /.test(G.activityBlock(w60) || ''), `a level-60 Wanted still needs you in its zone (${w60}: ${G.activityBlock(w60)})`);
  P.level = 52; check(/^Go to /.test(G.activityBlock('blackrock_depths') || ''), 'below the cap you still travel to the dungeon');
  P.level = 60; G.queueFor('molten_core'); G.acceptPop(); check(S.run && S.run.returnTo === 'stormwind', 'after the run you are back where you queued');
}
console.log(`hard: ${ok}/${ok + bad} checks pass`);
process.exitCode = bad ? 1 : 0;
