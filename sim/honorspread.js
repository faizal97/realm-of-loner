// Bots' Honor ranks (#57): the share of bots at each rank at levels 20, 40 and 60, from the game's own G.botHonor (a
// bot's lifetime Honor from its id and level) and G.honorRank. Target (game designer): about half unranked; from rank 5
// to 8 each rank about half the one below; rank 8 about 1-2% (at 60).
//   ROOT=~/azeroth-solo-measure node sim/honorspread.js [bots per level, default 20000]
require('./_seed.js'); // seeded (#125): the same commit always gives the same result; SEED=n picks other dice
const ROOT = process.env.ROOT || require('path').join(__dirname, '..');
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
for (const f of ['data', 'engine', 'bots', 'game']) require(ROOT + '/src/' + f + '.js');
const { G, D } = globalThis;
const N = +process.argv[2] || 20000, R = D.HONOR_RANKS.length;
console.log(`ladder ${D.HONOR_RANKS.map((r) => r.at).join(' / ')} · G.BOT_HONOR ${JSON.stringify(G.BOT_HONOR)} · ${N} bots per level`);
let bad = 0;
for (const L of [20, 40, 60]) {
  const n = new Array(R + 1).fill(0);
  for (let i = 1; i <= N; i++) n[G.honorRank(G.botHonor({ id: i, name: 'b' + i, level: L })).rank]++;
  const pct = n.map((x) => (x / N) * 100);
  console.log(`level ${L}: unranked ${pct[0].toFixed(1)}% · ` + pct.slice(1).map((p, i) => `r${i + 1} ${p.toFixed(1)}%`).join(' · '));
  if (L === 60) { const halves = [5, 6, 7, 8].map((r) => (pct[r - 1] ? pct[r] / pct[r - 1] : 0)); console.log(`  rank 5-8 each against the one below: ${halves.map((h, i) => `r${i + 5}/r${i + 4} ${h.toFixed(2)}`).join(' · ')}`);
    const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) bad++; };
    ok(pct[0] >= 40 && pct[0] <= 60, `about half unranked (${pct[0].toFixed(1)}%)`);
    ok(pct[8] >= 1 && pct[8] <= 2.5, `rank 8 about 1-2% (${pct[8].toFixed(1)}%)`);
    ok(halves.every((h) => h >= 0.35 && h <= 0.7), 'each of ranks 5-8 about half the one below (0.35-0.7)'); }
}
process.exitCode = bad ? 1 : 0;
