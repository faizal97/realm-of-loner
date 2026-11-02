// The realm's population over time (#71): one roster per account that grows up. A new realm is played out day by day
// (B.advance, as the catch-up runs it) for 60 days, and the design's targets are checked on every seed:
//   at least 15% of the realm at the level cap after 30 days, and still after 60 (steady, not a spike);
//   at least 40% of the established people (above level 20 when the realm starts) still there after 60 days: the
//   levelling zones churn as they do today (mostly new arrivals), so the people you get to know are the ones who stay;
//   no friend or guildmate ever removed (they take a break, say so, and come back);
//   the roster stays at its size (B.ROSTER_CAP under the cap, in today's level spread, and B.VETERANS at it).
//   node sim/population.js            seeds 0 and 1
//   SEEDS=0,1,2 DAYS=90 node sim/population.js
//   TRACE=1 DAYS=180 node sim/population.js   the share at the cap every 15 days
const SEEDS = (process.env.SEEDS || '0,1').split(',').map(Number), DAYS = Math.max(60, +process.env.DAYS || 60);
const runSeed = (seed) => {
  let s = (0x5eed + seed * 7919) >>> 0;
  Math.random = () => { s = (s + 0x6D2B79F5) >>> 0; let x = s; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  for (const k of Object.keys(require.cache)) if (k.includes('/src/')) delete require.cache[k];
  globalThis.localStorage = (() => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; })();
  const RealDate = Date; let t = new RealDate(2026, 10, 2, 19).getTime();
  globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(t); } static now() { return t; } };
  for (const f of ['data', 'engine', 'bots', 'game', 'trials', 'social']) require(`../src/${f}.js`);
  const { G, B, D } = globalThis;
  G.newGame({ name: 'Pop', cls: 'warrior', race: 'human' });
  const byes = { n: 0, bye: new Set() }, post = B.post; B.post = (S1, ch, b, text) => { if (/taking a break|away a bit|short break/.test(text)) byes.n++; if (/done with this game|quitting for a while|for good/.test(text)) byes.bye.add(b.name); return post(S1, ch, b, text); }; // counted as said (chat keeps only the latest lines)
  const S = G.S, start = new Set(S.bots.map((b) => b.name)), est = new Set(S.bots.filter((b) => b.level > 20).map((b) => b.name)); // est: the established, above the levelling zones
  // the player's friends and guild: ten of the starting people, and a guild of their own
  const friends = S.bots.slice(0, 10); S.soc = S.soc || {}; S.soc.friends = {}; for (const b of friends) S.soc.friends[b.id] = { n: 3, where: null, last: t };
  G.save(); S.player.guild = S.bots[20].guild >= 0 ? S.bots[20].guild : 0;
  const mates = new Set(S.bots.filter((b) => b.guild === S.player.guild).map((b) => b.name));
  const rows = [], allMates = new Set(mates);
  for (let d = 1; d <= DAYS; d++) {
    for (const b of S.bots) if (b.guild === S.player.guild) allMates.add(b.name);
    B.advance(S, 86400000); t += 86400000;
    const cap = S.bots.filter((b) => b.level >= D.LEVEL_CAP).length;
    rows.push({ d, n: S.bots.length, cap: cap / S.bots.length, kept: S.bots.filter((b) => start.has(b.name)).length / start.size, estKept: S.bots.filter((b) => est.has(b.name)).length / est.size, low: S.bots.filter((b) => b.level <= 20).length, mid: S.bots.filter((b) => b.level > 20 && b.level < D.LEVEL_CAP).length });
  }
  const names = new Set(S.bots.map((b) => b.name));
  const lostFriends = friends.filter((b) => !names.has(b.name)).length;
  // every guildmate (then or later) who left said goodbye first
  const lostMates = [...allMates].filter((n) => !names.has(n) && !byes.bye.has(n)).length;
  const goodbyes = byes.n;
  return { rows, lostFriends, lostMates, goodbyes, mates: mates.size, maxN: Math.max(...rows.map((r) => r.n)) };
};
let ok = 0, bad = 0; const check = (c, m) => { if (c) ok++; else { bad++; console.log('FAIL ' + m); } };
const pct = (x) => (x * 100).toFixed(1) + '%';
for (const seed of SEEDS) {
  const R = runSeed(seed), at = (d) => R.rows[d - 1];
  if (process.env.TRACE) console.log(`seed ${seed} levels 1-20 / 21-59 / cap: ` + R.rows.filter((r) => r.d % 15 === 0).map((r) => `day ${r.d} ${r.low}/${r.mid}/${Math.round(r.cap * r.n)}`).join(', '));
  console.log(`seed ${seed}: at 60 day 7 ${pct(at(7).cap)}, day 14 ${pct(at(14).cap)}, day 30 ${pct(at(30).cap)}, day ${DAYS - 15} ${pct(at(DAYS - 15).cap)}, day ${DAYS} ${pct(at(DAYS).cap)}; starting people kept day 30 ${pct(at(30).kept)}, day ${DAYS} ${pct(at(DAYS).kept)}; established kept day 30 ${pct(at(30).estKept)}, day ${DAYS} ${pct(at(DAYS).estKept)}; roster at most ${R.maxN}; friends lost ${R.lostFriends}, guildmates lost ${R.lostMates}, goodbyes ${R.goodbyes}`);
  check(at(30).cap >= 0.15, `seed ${seed}: at least 15% at the level cap after 30 days (${pct(at(30).cap)})`);
  check(at(DAYS).cap >= 0.15 && Math.abs(at(DAYS).cap - at(DAYS - 15).cap) <= 0.08, `seed ${seed}: steady after 30 days (${pct(at(DAYS - 15).cap)} on day ${DAYS - 15}, ${pct(at(DAYS).cap)} on day ${DAYS})`);
  check(R.goodbyes <= 10 * Math.ceil(DAYS / 30), `seed ${seed}: a friend takes a break at most once a month (${R.goodbyes} breaks, 10 friends)`);
  check(at(Math.min(60, DAYS)).estKept >= 0.4, `seed ${seed}: at least 40% of the established people after 60 days (${pct(at(Math.min(60, DAYS)).estKept)})`);
  check(R.lostFriends === 0 && R.lostMates === 0, `seed ${seed}: no friend removed, no guildmate gone without a goodbye (${R.lostFriends}, ${R.lostMates})`);
  check(R.maxN <= globalThis.B.ROSTER_CAP + globalThis.B.VETERANS + 10, `seed ${seed}: the roster stays at its size (at most ${R.maxN})`);
}
// #302: one long absence keeps the realm's spread (a catch-up of 180 days once emptied it to ~126 people, 40 under 20),
// live play brings new players too (each minute added its share as 0), and names stay unique and real
for (const seed of SEEDS) {
  let s = (0x5eed + seed * 7919) >>> 0;
  Math.random = () => { s = (s + 0x6D2B79F5) >>> 0; let x = s; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  for (const k of Object.keys(require.cache)) if (k.includes('/src/')) delete require.cache[k];
  globalThis.localStorage = (() => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; })();
  for (const f of ['data', 'engine', 'bots', 'game', 'trials', 'social']) require(`../src/${f}.js`);
  const { G, B, D } = globalThis;
  G.newGame({ name: 'Pop', cls: 'warrior', race: 'human' });
  const S = G.S, n0 = S.bots.length;
  let live = 0; for (let i = 0; i < 360; i++) { const before = S.nextBotId; B.advance(S, 60000); live += S.nextBotId - before; } // six hours a minute at a time
  B.advance(S, 180 * 86400000);
  const lv = (a, b) => S.bots.filter((x) => x.level >= a && x.level <= b).length, names = S.bots.map((x) => x.name);
  console.log(`seed ${seed}: live 6 h: ${live} new players; after 180 days away: ${S.bots.length} people, levels 1-20 ${lv(1, 20)}, 21-39 ${lv(21, 39)}, 40-59 ${lv(40, 59)}, 60 ${lv(60, 60)}`);
  check(live >= 12, `seed ${seed}: six hours of live play bring new players (${live})`);
  check(S.bots.length >= n0 - 10 && lv(1, 20) >= 200 && lv(21, 39) >= 20 && lv(40, 59) >= 20, `seed ${seed}: 180 days away keeps the realm's spread`);
  check(new Set(names).size === names.length && !names.some((x) => /^Alt\d/.test(x)), `seed ${seed}: names unique, none a placeholder`);
}
console.log(`population: ${ok}/${ok + bad} checks pass`);
process.exitCode = bad ? 1 : 0;
