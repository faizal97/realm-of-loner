// The auction house (v10.9, issue #20): reselling is allowed but neither risk-free nor unbounded, and every price button
// is a real choice when you sell your own loot. A higher price is less likely to sell within the day (G.ahSellChance)
// and posting costs a 5% deposit that comes back only on a sale.
//   node sim/auction.js [days per run, default 25]
{ let s = 0x5eed1e55 >>> 0; Math.random = () => { s = (s + 0x6D2B79F5) >>> 0; let x = s; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
require('../src/data.js'); require('../src/engine.js'); require('../src/bots.js'); require('../src/game.js');
const { G, D } = globalThis;
const RealDate = Date; let t = new RealDate(2026, 9, 1, 12).getTime();
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(t); } static now() { return t; } };
const DAYS = +process.argv[2] || 25, GOLD = 10000;
if (process.env.SURE) G.AH_CURVE.sure = +process.env.SURE; if (process.env.NONE) G.AH_CURVE.none = +process.env.NONE;
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('FAIL ' + m); } };

// 1. flipping: every 30 min buy listings and repost them, 8 auctions at a time, for a day. Profit = money gained plus what
// is still held (unsold or in bags), valued at what it would fetch sold off now.
function flipDay(level, repost, buyBelow) {
  G.newGame({ name: 'F', cls: 'warrior', race: 'human' }); const S = G.S, P = S.player; P.level = level; P.money = 1e8; S.flags.warModeAsked = true;
  P.bagsEq = [0, 1, 2, 3].map(() => G.copyItem('woolen_bag')); S.flags.noInvites = true;
  const m0 = P.money, end = t + 24 * 3600e3;
  while (t < end) {
    for (const l of G.ahListings().slice().sort((a, b) => a.price / (G.ahValue(a.item) * (a.n || 1)) - b.price / (G.ahValue(b.item) * (b.n || 1)))) {
      if (S.ah.mine.length + P.bags.filter((b) => G.ahTrade(b.item)).length >= 8) break;
      if (l.price / (G.ahValue(l.item) * (l.n || 1)) > buyBelow) break;
      G.ahBuy(l.id);
    }
    for (const m of G.mail()) if (G.mailWaiting(m)) { G.addItem(m.item, m.n || 1); m.taken = true; } // an expired auction comes back by mail (#258): collected at the town's mailbox
    for (let i = P.bags.length - 1; i >= 0; i--) { const b = P.bags[i]; if (S.ah.mine.length >= 8) break; if (G.ahTrade(b.item)) G.ahPost(i, Math.round(G.ahValue(b.item) * b.n * repost)); }
    t += 30 * 60000; G.update(1);
  }
  for (const m of G.mail()) if (G.mailWaiting(m)) { G.addItem(m.item, m.n || 1); m.taken = true; } // still in the mail is still held
  // what is still held counts at what it fetches if sold off now (0.8x always sells), after the cut
  const held = S.ah.mine.concat(P.bags.filter((b) => G.ahTrade(b.item))).reduce((a, x) => a + G.ahValue(x.item) * (x.n || 1) * 0.8 * 0.95, 0);
  return (P.money - m0 + held) / GOLD;
}
for (const [level, cap] of [[20, 1.5], [60, 10]]) {
  // the strategy QA tried (buy the cheapest, repost at 1.6x) and the best a flipper could pick among a few
  const qa = []; for (let d = 0; d < DAYS; d++) qa.push(flipDay(level, 1.6, 1.45));
  let best = { avg: -1e9 };
  for (const [repost, buyBelow] of [[1.0, 0.95], [1.0, 0.9], [1.3, 1.0], [1.3, 0.9], [1.6, 0.9]]) {
    const days = []; for (let d = 0; d < Math.ceil(DAYS / 2); d++) days.push(flipDay(level, repost, buyBelow));
    const avg = days.reduce((a, b) => a + b, 0) / days.length; if (avg > best.avg) best = { avg, repost, buyBelow };
  }
  const qaAvg = qa.reduce((a, b) => a + b, 0) / qa.length, loss = qa.filter((x) => x < 0).length;
  console.log(`level ${level}: QA's flip (cheapest, repost 1.6x) ${qaAvg.toFixed(2)}g a day, ${loss}/${qa.length} days lost · best flip (repost ${best.repost}x, buy under ${best.buyBelow}x) ${best.avg.toFixed(2)}g a day`);
  ok(Math.max(qaAvg, best.avg) <= cap, `level ${level}: flipping earns at most ${cap}g a day (${Math.max(qaAvg, best.avg).toFixed(2)}g)`);
  ok(loss >= qa.length / 5, `level ${level}: at least 1 day in 5 of flipping ends with a loss (${loss}/${qa.length})`);
}

// 2. selling your own loot: each button wins somewhere. Per item worth 1 at the usual price, reposted when it doesn't
// sell, over a horizon; gold per auction-hour when you keep a slot busy.
{
  const R = [0.8, 1, 1.3, 1.6], N = 20000;
  const sell = (r, tries) => { let gold = 0, hours = 0; for (let k = 0; k < tries; k++) { gold -= 0.05; if (Math.random() < G.ahSellChance(r)) { const h = Math.min(23.5, 0.3 * Math.pow(Math.max(0.3, r), 3) * (0.6 + Math.random())); return { gold: gold + 0.05 + r * 0.95, hours: hours + h }; } hours += 24; } return { gold, hours }; };
  const avg = (r, tries) => { let g = 0, h = 0; for (let i = 0; i < N; i++) { const x = sell(r, tries); g += x.gold; h += x.hours; } return { perItem: g / N, perHour: g / h }; };
  const rows = R.map((r) => ({ r, day: avg(r, 1), two: avg(r, 2), week: avg(r, 7) }));
  for (const x of rows) console.log(`${x.r}x: per item in a day ${x.day.perItem.toFixed(2)}, in 2 days ${x.two.perItem.toFixed(2)}, in a week ${x.week.perItem.toFixed(2)} · per auction-hour ${x.week.perHour.toFixed(2)}`);
  const top = (f) => rows.slice().sort((a, b) => f(b) - f(a))[0].r;
  const wins = { [top((x) => x.week.perHour)]: 'fast (gold per auction-hour)', [top((x) => x.day.perItem)]: 'a day', [top((x) => x.two.perItem)]: 'two days', [top((x) => x.week.perItem)]: 'a week' };
  ok(top((x) => x.week.perHour) === 0.8, '0.8x gives the most gold per auction-hour (it sells fast)');
  ok(top((x) => x.week.perItem) === 1.6, '1.6x gives the most gold per item over a week of reposting');
  ok(R.every((r) => wins[r]), `every price button wins somewhere (${R.map((r) => r + 'x: ' + (wins[r] || 'nowhere')).join(', ')})`);
}
console.log(bad ? `${bad} failures` : 'auction sim OK');
process.exit(bad ? 1 : 0);
