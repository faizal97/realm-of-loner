// Hard raids (manual, slow): wipes on a first clear, Normal against Hard, for a player near the gear ceiling (every
// piece raid epic, upgraded to the ceiling) with the bots a Hard queue draws, geared as the game gears them; after a
// wipe some leave and others join, as in the game (NOLEAVE=1 keeps the group). Target (docs/plans/2026-09-30-horizontal-
// progression-design.md): about 2-3 wipes on a first Hard clear.
//   node sim/hardraid.js [runs, default 12] [raid activity, default onyxias_lair] [Trial rating, default 400]
globalThis.localStorage = (() => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; })();
require('../src/data.js'); require('../src/engine.js'); require('../src/bots.js'); require('../src/game.js'); require('../src/trials.js');
const { G, D, TRIALS: T } = globalThis;
const N = +process.argv[2] || 12, ACT = process.argv[3] || 'onyxias_lair', RATING = process.argv[4] != null ? +process.argv[4] : 400;
const RealDate = Date; let t = new RealDate(2026, 9, 14, 12).getTime();
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(t); } static now() { return t; } };
const raids = Object.keys(D.DUNGEONS).filter((k) => D.DUNGEONS[k].raid);
const lootOf = (dk) => { const s = new Set(); for (const p of D.DUNGEONS[dk].pulls) for (const m of p.mobs) for (const i of (D.MOBS[m].loot || [])) s.add(i); return [...s]; };
const atCeiling = (id) => { const it = G.copyItem(id), inf = G.upgradeInfo(it); return inf.ok ? G.upgradedCopy(it, D.UPGRADE.cap[it.q] * G.upgradeRef(it)) : it; };
function gear(P) { const ids = raids.flatMap(lootOf); for (const slot of D.GEAR_SLOTS) { const f = ids.filter((id) => D.ITEMS[id].slot === slot && G.canUseItem(D.ITEMS[id], P.cls)).sort((a, b) => G.itemScore(D.ITEMS[b], P.cls) - G.itemScore(D.ITEMS[a], P.cls)); if (f.length) P.equip[slot] = atCeiling(f[0]); } }
G.trialRating = () => RATING;
// HARD="boss hp,boss dmg,trash hp,trash dmg" tries other numbers (for tuning)
if (process.env.HARD) { const [bh, bd, th, td] = process.env.HARD.split(',').map(Number); Object.assign(D.DUNGEONS[D.ACTIVITIES[ACT].dungeon].hard, { bossMult: { hp: bh, dmg: bd }, trashMult: { hp: th, dmg: td } }); }
const ONLY_HARD = !!process.env.HARD;
// TELE=x:baron_geddon,slam switches on telegraphs by kind ('x:<mob>' for a boss extra), as in sim/difficulty.js (#179)
if (process.env.TELE) for (const k of process.env.TELE.split(',')) globalThis.E.TELE.on.add(k);
// BUSTER=coralheart_colossus.floor=1 sets a boss's Hard slam numbers (buster.hard) for measuring
// XMISS=4,2.5 switches on every Hard extra's red bar (hits, heals) with that size when missed, for measuring
if (process.env.XMISS) { const [h, hl] = process.env.XMISS.split(',').map(Number); for (const xs of Object.values(D.DUNGEONS[D.ACTIVITIES[ACT].dungeon].hard.extra || {})) for (const x of xs) if (x.kind === 'hit' || x.kind === 'heal') { x.tele = true; if (x.kind === 'hit' ? h : hl) x.miss = x.kind === 'hit' ? h : hl; } }
if (process.env.BUSTER) for (const kv of process.env.BUSTER.split(',')) { const [km, v] = kv.split('='), [k, f] = km.split('.'), b = D.MOBS[k].buster; b.hard = Object.assign({}, b.hard, { [f]: +v }); }
function run(hard, cls) {
  G.newGame({ name: 'Hr', cls, race: 'human' }); const S = G.S, P = S.player; P.level = 60; S.flags.warModeAsked = true;
  P.talents = G.autoTalents(cls, 'dps', 60, 0); P.role = 'dps'; gear(P);
  P.codex = { [ACT]: { clears: 1, flawless: 0, speed: 0, best: null } }; P.place = D.ACTIVITIES[ACT].where;
  G.queueFor(ACT, { hard }); if (!S.queue) return null; G.acceptPop();
  const sk = S.group.members.map((m) => m.bot.skill);
  let g = 0;
  while (S.run && S.run.phase !== 'done' && g++ < 900000) {
    if (G.fight && G.pUnit && G.pUnit.kind === 'player') { G.pUnit.kind = 'bot'; G.pUnit.bot = { skill: 0.75, react: 0.45 }; G.pUnit.role = G.role(); }
    for (const r of (S.run.rolls || [])) if (!r.done && !r.player) { try { G.roll(S.run.rolls.indexOf(r), 'pass'); } catch (e) {} }
    if (process.env.NOLEAVE) for (const m of S.group.members) m.gone = false;
    if (S.run && S.run.wipes > (+process.env.MAXWIPES || 15)) break; // MAXWIPES=60 proves a run is clearable (the game has no limit)
    G.update(0.1); t += 100;
  }
  return { done: S.run && S.run.phase === 'done', wipes: S.run ? S.run.wipes : 99, secs: G.runClock(), skill: sk.reduce((a, b) => a + b, 0) / sk.length, hard: S.run && S.run.hard };
}
const cls = ['mage', 'rogue', 'hunter', 'warlock', 'warrior', 'priest'];
for (const hard of ONLY_HARD ? [true] : [false, true]) {
  const rs = []; for (let i = 0; i < N; i++) { const r = run(hard, cls[i % cls.length]); if (r) rs.push(r); }
  const w = rs.map((r) => r.wipes).sort((a, b) => a - b), avg = w.reduce((a, b) => a + b, 0) / (w.length || 1);
  console.log(`${hard ? 'Hard  ' : 'Normal'} ${ACT}: ${rs.filter((r) => r.done).length}/${rs.length} cleared · wipes on the first clear avg ${avg.toFixed(1)}, median ${w[w.length >> 1]} (${w.join(' ')}), no wipe ${Math.round(w.filter((x) => !x).length / (w.length || 1) * 100)}% · bot skill ${(rs.reduce((a, r) => a + r.skill, 0) / (rs.length || 1)).toFixed(2)} · ${Math.round(rs.reduce((a, r) => a + r.secs, 0) / (rs.length || 1))}s${hard && rs.some((r) => !r.hard) ? ' · NOT HARD' : ''}`);
}
