// Levelling time along the real quest path, per class (issue #4, the game designer's bar): time to level through each
// band within ±20% of the class average. Players get 70%+ of their XP from quests (sim/zoneflow.js), where travel,
// talking and hand-ins take every class the same time; only the kills depend on the class.
// The path: a greedy player takes the nearest open solo quest (by real route time from where they stand, both
// factions), walks giver -> objective -> turn-in (G.route; mounted from D.RIDING.lvl), talks 10 sec a quest, and grinds
// at the level when no quest is open. Each class kills at its own measured pace: seconds per kill from sim/lvpace.js,
// which already holds resting, deaths and the time between pulls.
//   node sim/lvpace.js 6 > lv.txt; LVPACE=lv.txt node sim/questpace.js
// Several seeds (sim/lvpace.js with SEED=n): files of one seed joined by ',', seeds by ';'. Each class then reads as the
// mean over seeds, ± half the range between the lowest and highest seed. Deaths an hour on the path come from each
// class's deaths per kill at the level (the game designer's bar: at most 2 an hour). ORDER=zoneflow takes the open
// quests in sim/zoneflow.js's order (the data's order) instead of the nearest one, to check the path doesn't decide it.
// The bar (game designer, #4, 2026-10-02): against the median class's time, not the average (Warrior and Hunter dragged
// the average down). Slow side: at most +20% of the median. Fast side: a nerf only past 40% faster. Deaths: at most 2
// an hour, the Mage 3. BAR=average gives the earlier report (±20% of the class average). A later file of a seed
// overrides an earlier one per class and level, so a candidate run of one class (sim/lvpace.js with CLASSES=priest)
// goes after that seed's base files.
//   LVPACE='s0_L10.txt,s0_L25.txt;s1_L10.txt,s1_L25.txt' ORDER=zoneflow node sim/questpace.js
{ let s = 0x5eed1e55 >>> 0; Math.random = () => { s = (s + 0x6D2B79F5) >>> 0; let x = s; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
require('../src/data.js'); require('../src/engine.js'); require('../src/bots.js'); require('../src/game.js');
const { D, G } = globalThis;
const fs = require('fs');
// HOP=x scales every hop between two places in the same zone (not boats or other 'via' routes), to try a travel change
// without editing the data (#107). BANDS=10-20,20-30,... sets the level bands (contiguous bands give time 10 to 60).
if (process.env.HOP) { const k = +process.env.HOP; for (const a in D.PLACES) { const A = D.PLACES[a]; for (const b in A.links || {}) { const B = D.PLACES[b]; if (B && A.zone && A.zone === B.zone && !(A.via && A.via[b])) A.links[b] *= k; } } }
const BAR = process.env.BAR || 'median', SLOW = 20, FAST = BAR === 'median' ? 40 : 20, DEATHS = 2, DEATHS_CLS = { mage: 3 }, TALK = 10, BANDS = process.env.BANDS ? process.env.BANDS.split(',').map((b) => b.split('-').map(Number)) : [[10, 20], [15, 25], [20, 30], [25, 35], [40, 50], [50, 60]], ORDER = process.env.ORDER || 'nearest';
// seconds and deaths per kill by seed, class and level, from sim/lvpace.js output
const SEEDS = (process.env.LVPACE || '').split(';').filter(Boolean).map((files) => {
  const pace = {}; // pace[cls][L] = { spk: seconds per kill (3600 / kills an hour), dpk: deaths per kill }
  for (const f of files.split(',').filter(Boolean)) {
    let L = null;
    for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
      const lv = line.match(/^level (\d+)/); if (lv) { L = +lv[1]; continue; }
      const m = line.match(/^\s+(\w+)\s+\d+ XP\/h.*?· (\d+) kills, ([\d.]+) deaths an hour/); if (m && L) (pace[m[1]] = pace[m[1]] || {})[L] = { spk: 3600 / +m[2], dpk: +m[3] / +m[2] };
    }
  }
  return pace;
});
const CLASSES = SEEDS.length ? Object.keys(SEEDS[0]) : [];
if (!CLASSES.length) { console.log('no lvpace input: LVPACE=<sim/lvpace.js output> node sim/questpace.js'); process.exit(1); }
const perKill = (pace, cls, L, key) => { const t = pace[cls], ks = Object.keys(t).map(Number).sort((a, b) => a - b);
  if (L <= ks[0]) return t[ks[0]][key]; if (L >= ks[ks.length - 1]) return t[ks[ks.length - 1]][key];
  for (let i = 0; i < ks.length - 1; i++) if (L <= ks[i + 1]) { const f = (L - ks[i]) / (ks[i + 1] - ks[i]); return t[ks[i]][key] + f * (t[ks[i + 1]][key] - t[ks[i]][key]); } };
// where an NPC stands, and where a monster lives
const npcAt = {}; for (const k in D.PLACES) for (const n of (D.PLACES[k].npcs || [])) if (!npcAt[n]) npcAt[n] = k;
const mobAt = {}; for (const k in D.PLACES) for (const [m] of (D.PLACES[k].mobs || [])) (mobAt[m] = mobAt[m] || []).push(k);
const dropFrom = (item) => { for (const k in D.MOBS) { const d = (D.MOBS[k].qdrops || []).find((x) => x[0] === item); if (d) return { mob: k, chance: d[1] || 1 }; } return null; };
// the class-free part of a band and its kill count: { secsFree, kills: [[level, n], ...] }
function walk(race, from, to) {
  const fac = race === 'orc' ? 'horde' : 'alliance';
  G.newGame({ name: 'Q', cls: 'warrior', race }); const P = G.S.player;
  const done = new Set(Object.keys(D.QUESTS).filter((q) => D.QUESTS[q].lvl < from - 3)); // the band's own quests, roughly
  let lvl = from, xp = 0, cur = P.place, travel = 0, talk = 0; const kills = {};
  const route = (a, b) => { if (!a || !b || a === b) return 0; const r = G.route(a, b); const s = r ? r.secs : 120; return lvl >= D.RIDING.lvl ? s * D.RIDING.speed : s; };
  const gain = (x) => { xp += x; while (lvl < to && xp >= D.XP_TO_LEVEL[lvl]) { xp -= D.XP_TO_LEVEL[lvl]; lvl++; } };
  let guard = 0;
  while (lvl < to && guard++ < 5000) {
    P.level = lvl;
    const avail = Object.keys(D.QUESTS).filter((q) => { const Q = D.QUESTS[q]; return !done.has(q) && !Q.group && !Q.dungeon && Q.lvl <= lvl + 1 && Q.lvl >= lvl - 4 && (Q.pre || []).every((p) => done.has(p) || D.QUESTS[p].lvl < from - 3) && (!Q.faction || Q.faction === fac) && npcAt[Q.giver]; });
    if (!avail.length) { kills[lvl] = (kills[lvl] || 0) + 1; gain(Math.round(G.xpForKill(lvl + 0.5, false))); continue; } // grind
    const q = ORDER === 'zoneflow' ? avail[0] : avail.map((k) => ({ k, d: route(cur, npcAt[D.QUESTS[k].giver]) })).sort((a, b) => a.d - b.d)[0].k, Q = D.QUESTS[q]; done.add(q);
    const giver = npcAt[Q.giver], turnin = npcAt[Q.turnin] || giver; let n = 0, objAt = null;
    for (const o of Q.objs) {
      if (o.type === 'kill') { n += o.n; objAt = objAt || (mobAt[o.mob] || [])[0]; }
      if (o.type === 'collect') { const s = dropFrom(o.item); if (s) { n += Math.ceil(o.n / s.chance); objAt = objAt || (mobAt[s.mob] || [])[0]; } }
    }
    travel += route(cur, giver) + route(giver, objAt || giver) + route(objAt || giver, turnin); talk += TALK; cur = turnin;
    kills[lvl] = (kills[lvl] || 0) + n;
    gain((G.questXpShare ? Math.round(G.questXp(Q.lvl) * G.questXpShare(Q.lvl, lvl)) : G.questXp(Q.lvl)) + n * Math.round(G.xpForKill(Math.max(lvl, Q.lvl - 1), false))); // the falloff for outlevelled quests (#188) where the build has it
  }
  return { free: travel + talk, travel, kills };
}
let bad = 0, badD = 0;
const pm = (x) => `${x >= 0 ? '+' : ''}${x.toFixed(0)}%`;
console.log(`time to level through each band along the quest path (hours; both factions averaged; ${ORDER} quest order), at most +${SLOW}% ${BAR === 'median' ? `of the median class (a nerf only past −${FAST}%)` : `/ −${FAST}% of the class average`}, at most ${DEATHS} deaths an hour (Mage 3); ${SEEDS.length} seed${SEEDS.length > 1 ? 's' : ''} of sim/lvpace.js`);
for (const [from, to] of BANDS) {
  const W = ['human', 'orc'].map((r) => walk(r, from, to));
  // per seed: each class's hours and deaths, and its % against that seed's class average
  const per = SEEDS.map((pace) => {
    const rows = CLASSES.map((cls) => { const r = W.map((w) => { const ks = Object.entries(w.kills); const h = (w.free + ks.reduce((s, [L, n]) => s + n * perKill(pace, cls, +L, 'spk'), 0)) / 3600; return { h, d: ks.reduce((s, [L, n]) => s + n * perKill(pace, cls, +L, 'dpk'), 0) / h }; });
      return { cls, h: (r[0].h + r[1].h) / 2, dph: (r[0].d + r[1].d) / 2 }; });
    const hs = rows.map((r) => r.h).sort((a, b) => a - b), mid = hs.length >> 1, avg = BAR === 'median' ? (hs.length % 2 ? hs[mid] : (hs[mid - 1] + hs[mid]) / 2) : hs.reduce((a, b) => a + b, 0) / hs.length;
    for (const r of rows) r.pct = (r.h / avg - 1) * 100; return { rows, avg };
  });
  const free = (W[0].free + W[1].free) / 2 / 3600, nk = W.map((w) => Object.values(w.kills).reduce((a, b) => a + b, 0)), avg = per.reduce((s, p) => s + p.avg, 0) / per.length;
  console.log(`levels ${from}-${to}: ${BAR === 'median' ? 'median class' : 'class average'} ${avg.toFixed(1)} h (travel and talking ${free.toFixed(1)} h, ${Math.round((nk[0] + nk[1]) / 2)} kills)`);
  const rows = CLASSES.map((cls) => { const xs = per.map((p) => p.rows.find((r) => r.cls === cls)), ps = xs.map((x) => x.pct), ds = xs.map((x) => x.dph);
    return { cls, h: xs.reduce((s, x) => s + x.h, 0) / xs.length, pct: ps.reduce((a, b) => a + b, 0) / ps.length, spread: (Math.max(...ps) - Math.min(...ps)) / 2, lo: Math.min(...ps), hi: Math.max(...ps), dph: ds.reduce((a, b) => a + b, 0) / ds.length, dmax: Math.max(...ds) }; });
  const fails = (p) => p > SLOW || p < -FAST;
  for (const r of rows.sort((a, b) => a.h - b.h)) { const out = fails(r.pct), edge = !out && (fails(r.lo) || fails(r.hi)), dl = DEATHS_CLS[r.cls] || DEATHS, dout = r.dph > dl; if (out) bad++; if (dout) badD++; // faster first: less time is better
    const why = r.pct > SLOW ? `  slow: over +${SLOW}%` : r.pct < -FAST ? `  fast: past −${FAST}%` : edge ? '  inside, but a seed is outside' : '';
    console.log(`  ${r.cls.padEnd(8)} ${r.h.toFixed(1).padStart(5)} h  ${pm(r.pct)} time${SEEDS.length > 1 ? ` ±${r.spread.toFixed(0)} (seeds ${pm(r.lo)} to ${pm(r.hi)})` : ''}${why} · ${r.dph.toFixed(1)} deaths an hour${SEEDS.length > 1 ? ` (worst seed ${r.dmax.toFixed(1)})` : ''}${dout ? '  over ' + dl : ''}`); }
}
console.log(bad ? `${bad} class-bands off the bar (a report for the game designer)` : `every class on the bar at every band`);
console.log(badD ? `${badD} class-bands over their deaths an hour` : `every class at most ${DEATHS} deaths an hour (Mage 3) at every band`);
