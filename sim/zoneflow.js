// Level flow through a set of zones: a greedy player does every solo quest there the moment it is available and
// grinds only when none is left (group and dungeon quests left out). Entry quests (given elsewhere, turned in there)
// count too. Target: quest share of XP >= 70%.
//   REGIONS=ungoro,steppes FROM=50 TO=55 node sim/zoneflow.js
require('./_seed.js'); // seeded (#125): the same commit always gives the same result; SEED=n picks other dice
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
require('../src/data.js'); require('../src/engine.js'); require('../src/bots.js'); require('../src/game.js');
const { D, G } = globalThis;
const REGIONS = (process.env.REGIONS || 'ungoro,steppes').split(','), FROM = +(process.env.FROM || 50), TO = +(process.env.TO || 55);
const at = {}; for (const k in D.PLACES) for (const n of (D.PLACES[k].npcs || [])) if (!at[n]) at[n] = k;
const regionOfNpc = (n) => (D.PLACES[at[n]] || {}).region;
const mine = (q) => REGIONS.includes(regionOfNpc(D.QUESTS[q].giver)) || REGIONS.includes(regionOfNpc(D.QUESTS[q].turnin));
let bad = 0;
for (const race of ['human', 'orc']) {
  const fac = race === 'orc' ? 'horde' : 'alliance';
  G.newGame({ name: 'Sim', cls: 'warrior', race }); const P = G.S.player;
  const done = new Set(Object.keys(D.QUESTS).filter((q) => !mine(q)));
  let lvl = FROM, xp = 0, qxp = 0, kxp = 0, grind = 0, worst = 0, worstAt = 0, n = 0;
  const gain = (x) => { xp += x; while (lvl < TO && xp >= D.XP_TO_LEVEL[lvl]) { xp -= D.XP_TO_LEVEL[lvl]; lvl++; } };
  while (lvl < TO) {
    P.level = lvl;
    const avail = Object.keys(D.QUESTS).filter((q) => { const Q = D.QUESTS[q]; return !done.has(q) && !Q.group && !Q.dungeon && Q.lvl <= lvl + 1 && (Q.pre || []).every((p) => done.has(p)) && (!Q.faction || Q.faction === fac); });
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
  const left = Object.keys(D.QUESTS).filter((q) => !done.has(q) && !D.QUESTS[q].group && !D.QUESTS[q].dungeon && (!D.QUESTS[q].faction || D.QUESTS[q].faction === fac));
  console.log(`${ok ? 'PASS' : 'FAIL'} ${fac.padEnd(8)} ${REGIONS.join('+')} ${FROM}-${TO} · quests ${n} · quest share ${share}% · longest grind ${worst} at ${worstAt} · solo quests left at ${TO}: ${left.length}`);
}
process.exitCode = bad ? 1 : 0;
