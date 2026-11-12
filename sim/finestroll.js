// Season's Finest season roll (#593): per boss, how often one kill gives each piece of its season pool through the roll
// (G.finestRoll, D.FINEST_ROLL), measured over N kills, against what one piece of its own table drops today (2 of the
// table each kill). A piece in both (a listed piece from the table) gets either.
//   SEED=0 N=20000 DATE=2026-11-15 node sim/finestroll.js      (ROOT=<tree> to measure another checkout)
require('./_seed.js');
const ROOT = process.env.ROOT || require('path').join(__dirname, '..');
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
for (const f of ['data', 'engine', 'bots', 'game']) require(ROOT + '/src/' + f + '.js');
const { G, D } = globalThis;
const N = +process.env.N || 20000, when = new Date(process.env.DATE || '2026-11-15T12:00');
Date.now = () => when.getTime();
const pc = (x) => (x * 100).toFixed(1) + '%', med = (a) => { const b = a.slice().sort((x, y) => x - y); return b.length ? b[b.length >> 1] : 0; };
const kinds = { raid: { table: [], roll: [], fresh: [] }, dungeon: { table: [], roll: [], fresh: [] } };
console.log(`season roll: ${JSON.stringify(D.FINEST_ROLL)}, ${N} kills per boss, ${when.toISOString().slice(0, 10)}`);
for (const dk in D.DUNGEONS) for (const p of D.DUNGEONS[dk].pulls) {
  if (!p.boss) continue; const mk = p.mobs[0], M = D.MOBS[mk], raid = !!D.DUNGEONS[dk].raid, P = G.finestPool(mk, when);
  if (!P.now.length && !P.old.length) continue;
  const got = {}; for (let i = 0; i < N; i++) { const id = G.finestRoll(mk, raid); if (id) got[id] = (got[id] || 0) + 1; }
  const k = kinds[raid ? 'raid' : 'dungeon'], each = M.loot && M.loot.length ? Math.min(1, 2 / M.loot.length) : 0;
  for (const id of M.loot || []) k.table.push(each);
  const line = P.now.concat(P.old).map((id) => { const x = (got[id] || 0) / N; k.roll.push(x); if (!(M.loot || []).includes(id)) k.fresh.push(x); return `${id} ${pc(x)} (expected ${pc(G.finestRollOdds(mk, raid, id, when))})`; });
  console.log(`${D.DUNGEONS[dk].name} / ${M.name}: table ${(M.loot || []).length} pieces, each ${pc(each)} per kill | roll pool ${P.now.length}${P.old.length ? ' + ' + P.old.length + ' retired' : ''}: ${line.join(', ')}`);
}
for (const k in kinds) { const x = kinds[k]; console.log(`${k} bosses: one table piece per kill median ${pc(med(x.table))}; one season-roll piece median ${pc(med(x.roll))}, new pieces (roll only) median ${pc(med(x.fresh))}`); }
