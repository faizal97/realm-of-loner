// Levels 40-45 flow in tanaris: a greedy player does every solo quest in the zone
// the moment it is available and grinds only when none is left. Group and dungeon quests are left out.
// Reports the quest share of XP and the longest grind. Target: quest share >= 70%.
require('./_seed.js'); // seeded (#125): the same commit always gives the same result; SEED=n picks other dice
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
require('../src/data.js'); require('../src/engine.js'); require('../src/bots.js'); require('../src/game.js');
const { D, G } = globalThis;
const at = {}; for (const k in D.PLACES) for (const n of (D.PLACES[k].npcs || [])) if (!at[n]) at[n] = k;
const regionOf = (q) => (D.PLACES[at[D.QUESTS[q].giver]] || {}).region;
let bad = 0;
const ENTRY = 'stv_tanaris,stv_tanaris'.split(',');
for (const [race, region] of [['human', 'tanaris'], ['orc', 'tanaris']]) {
  G.newGame({ name: 'Sim', cls: 'warrior', race }); const P = G.S.player;
  const done = new Set();
  // earlier-zone quests that unlock ours
  for (const q in D.QUESTS) if (['westfall', 'barrens', 'redridge', 'stonetalon', 'duskwood', 'hillsbrad', 'wetlands', 'ashenvale', 'stranglethorn', 'arathi', 'tanaris'].filter((r) => r !== 'tanaris').includes(regionOf(q))) done.add(q);
  for (const q of ENTRY) done.delete(q);
  let lvl = 40, xp = 0, qxp = 0, kxp = 0, grind = 0, worst = 0, worstAt = 0, n = 0;
  const gain = (x) => { xp += x; while (lvl < 45 && xp >= D.XP_TO_LEVEL[lvl]) { xp -= D.XP_TO_LEVEL[lvl]; lvl++; } };
  while (lvl < 45) {
    P.level = lvl;
    const avail = Object.keys(D.QUESTS).filter((q) => { const Q = D.QUESTS[q]; return !done.has(q) && !Q.group && !Q.dungeon && Q.lvl <= lvl + 1 && (Q.pre || []).every((p) => done.has(p)) && (regionOf(q) === region || ENTRY.includes(q)) && (!Q.faction || Q.faction === (race === 'orc' ? 'horde' : 'alliance')); });
    if (avail.length) {
      if (grind > worst) { worst = grind; worstAt = lvl; } grind = 0;
      const q = avail[0], Q = D.QUESTS[q]; done.add(q); n++;
      let kills = 0; for (const o of Q.objs) { if (o.type === 'kill') kills += o.n; if (o.type === 'collect') { const src = Object.values(D.MOBS).find((m) => (m.qdrops || []).some((d) => d[0] === o.item)); const pr = src ? src.qdrops.find((d) => d[0] === o.item)[1] : 1; kills += Math.round(o.n / pr); } }
      const x = G.questXp(Q.lvl) + kills * Math.round(G.xpForKill(Math.max(lvl, Q.lvl - 1), false)); qxp += x; gain(x); continue;
    }
    const k = Math.round(G.xpForKill(lvl + 0.5, false)); kxp += k; grind++; gain(k);
  }
  if (grind > worst) { worst = grind; worstAt = lvl; }
  const share = Math.round(qxp / (qxp + kxp) * 100), ok = share >= 70;
  if (!ok) bad++;
  const left = Object.keys(D.QUESTS).filter((q) => regionOf(q) === region && !done.has(q) && !D.QUESTS[q].group && !D.QUESTS[q].dungeon);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${region.padEnd(10)} quests ${n} · quest share ${share}% · grind kills ${kxp ? Math.round(kxp / G.xpForKill(21, false)) : 0} · longest grind ${worst} at ${worstAt} · quests left at 45: ${left.length}`);
}
process.exitCode = bad ? 1 : 0;
