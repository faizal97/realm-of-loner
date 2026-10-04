// World bosses (v10.7, fast, in the build): one a week from the date (none, one, many new handled like the featured
// raid), only that one is out, loot and Marks once a week, its mechanics shown untagged; and a fight a level-60 group
// can win. node sim/worldboss.js
// seeded (as sim/brawl.js), and the fight check in two stages (game designer, #69): the build's seed first, and only if
// that fight is lost (more than 2 wipes), the same fight on SEEDS other fixed seeds, passing when at least PASS_RATE of them
// win within 2 wipes. One seed judged alone failed whenever unrelated code (chat) moved the shared dice onto a bad fight:
// the same code lost on about 1 seed in 6 (52 seeds, #69). SEED=n runs another fixed seed (unset: the build's).
const SEED = process.env.SEED ? +process.env.SEED : 0, SEEDS = 20, PASS_RATE = 0.8;
{ let s = (SEED ? (0x5eed1e55 ^ Math.imul(SEED, 0x9E3779B1)) : 0x5eed1e55) >>> 0; Math.random = () => { s = (s + 0x6D2B79F5) >>> 0; let x = s; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
globalThis.localStorage = (() => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; })();
require('../src/data.js'); require('../src/engine.js'); require('../src/bots.js'); require('../src/game.js'); require('../src/trials.js');
const { G, D, E } = globalThis;
const RealDate = Date; let t = new RealDate(2026, 9, 14, 12).getTime();
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(t); } static now() { return t; } };
let ok = 0, bad = 0; const check = (c, m) => { if (c) ok++; else { bad++; console.log('FAIL ' + m); } };
const W = (y, m, d) => new RealDate(y, m - 1, d, 12), wb = (d) => G.worldBoss(d);
const acts = G.worldBossActs();
check(acts.length >= 3, `${acts.length} world bosses`);
check(wb(W(2026, 10, 1)) === null, 'none before the first week');
check(wb(W(2026, 10, 12)) === wb(W(2026, 10, 18)), 'the same boss Monday to Sunday');
check(new Set([0, 1, 2, 3, 4, 5].map((i) => wb(W(2026, 10, 5 + 7 * i)))).size === acts.length, 'every world boss in turn');
{ const before = wb(W(2026, 10, 19)); D.ACTIVITIES.zz_wb = Object.assign({}, D.ACTIVITIES[acts[0]], { since: '2026-10-21' });
  check(wb(W(2026, 10, 19)) === before && wb(W(2026, 10, 26)) === 'zz_wb', 'a new one joins the week after it ships'); delete D.ACTIVITIES.zz_wb; }
for (const act of acts) {
  const A = D.ACTIVITIES[act], M = D.MOBS[A.boss];
  check(M && M.loot && M.loot.length >= 3 && M.boss, `${act}: a boss with loot`);
  const u = E.mobUnit(A.boss, 60, { hp: 1, dmg: 1 }); u.hardX = A.extra[A.boss];
  const rows = E.specialRows(u); check(rows.length >= 2 && rows.every((r) => !r.hard), `${act}: ${rows.length} abilities, none tagged Hard`);
}
// only this week's is out; travel there; a level-60 group wins; loot and Marks once a week
{
  while (wb(new Date(t)) !== acts[0]) t += 7 * 86400000;
  const act = acts[0], A = D.ACTIVITIES[act], other = acts.find((k) => k !== act);
  G.newGame({ name: 'W', cls: 'warrior', race: 'human' }); const S = G.S, P = S.player; S.flags.warModeAsked = true; P.level = 60;
  P.equip = G.botChar({ name: 'x', cls: 'warrior', race: 'human', level: 60, skill: 0.8 }).equip; P.talents = G.autoTalents('warrior', 'dps', 60, 0);
  P.place = A.where; check(!G.activityBlock(act), `this week's world boss is open (${G.activityBlock(act)})`);
  check(G.activityBlock(other) === 'hidden', 'the others are not out this week');
  P.place = 'stormwind'; check(/^Go to /.test(G.activityBlock(act) || ''), 'you travel to a world boss');
  P.place = A.where;
  const fight = () => { G.queueFor(act); G.acceptPop(); let g = 0; while (S.run && S.run.phase !== 'done' && g++ < 600000) {
    if (G.fight && G.pUnit && G.pUnit.kind === 'player') { G.pUnit.kind = 'bot'; G.pUnit.bot = { skill: 0.75, react: 0.45 }; G.pUnit.role = G.role(); }
    for (const r of (S.run.rolls || [])) if (!r.done && !r.player) { try { G.roll(S.run.rolls.indexOf(r), 'pass'); } catch (e) {} }
    if (S.run && S.run.phase === 'rest' && S.run.restUntil <= t) { try { G.runPull(); } catch (e) {} }
    if (S.run && S.run.wipes > 8) break;
    G.update(0.1); t += 100; }
    const r = { done: S.run && S.run.phase === 'done', wipes: S.run ? S.run.wipes : 99, rolls: (S.run && S.run.rolls || []).length, bossRolls: (S.run && S.run.rolls || []).filter((x) => (D.MOBS[A.boss].loot || []).includes(x.item && x.item.id)).length }; S.run = null; S.group = null; return r; };
  const m0 = G.account().marks, r1 = fight(), m1 = G.account().marks;
  console.log(`${act}: first fight done ${r1.done}, wipes ${r1.wipes}, rolls ${r1.rolls} (boss loot ${r1.bossRolls})`);
  const won = (r) => r.done && r.wipes <= 2;
  if (won(r1) || SEED) check(won(r1), `a level-60 group beats ${A.name} (${r1.wipes} wipes)`);
  else {
    // stage 2: each seed in its own process (a fresh world), read from its first-fight line
    const { execFileSync } = require('child_process'), wins = [];
    for (let n = 1; n <= SEEDS; n++) {
      let out = ''; try { out = execFileSync('node', [__filename], { env: Object.assign({}, process.env, { SEED: String(n) }), encoding: 'utf8' }); } catch (e) { out = String(e.stdout || ''); }
      const m = out.match(/first fight done (true|false), wipes (\d+)/); wins.push(!!m && won({ done: m[1] === 'true', wipes: +m[2] }));
    }
    const k = wins.filter(Boolean).length, rate = k / SEEDS;
    console.log(`${act}: the build's seed lost (${r1.wipes} wipes), so ${SEEDS} seeds: ${k}/${SEEDS} (${Math.round(rate * 100)}%) win within 2 wipes, ${rate >= PASS_RATE ? 'pass' : 'FAIL'} at ${Math.round(PASS_RATE * 100)}%`);
    check(rate >= PASS_RATE, `a level-60 group beats ${A.name}: ${k}/${SEEDS} seeds within 2 wipes, under ${Math.round(PASS_RATE * 100)}%`);
  }
  check(m1 - m0 === G.WB_MARKS && G.worldBossLooted(act) && r1.bossRolls >= 2, `the first kill this week drops loot and ${G.WB_MARKS} Marks`);
  check(!!(G.account().trophies || {})[A.boss] && G.trophyList().some((x) => x.key === A.boss && x.boss), `the kill takes ${D.MOBS[A.boss].name}'s trophy (#44)`);
  // the second kill: none of the boss's loot and no Marks (a trash mob on the way may still drop something of its own)
  const r2 = fight(); check(r2.done && G.account().marks === m1 && r2.bossRolls === 0, `the second kill this week drops none of the boss's loot (${r2.bossRolls} of its items rolled)`);
  t += 7 * 86400000; check(!G.worldBossLooted(act), 'loot is open again the next week');
}
console.log(`worldboss: ${ok}/${ok + bad} checks pass`);
process.exitCode = bad ? 1 : 0;
