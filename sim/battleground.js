// Battlegrounds (v10.7): the Battle for Highmoor, played to the end by a bot-driven player with three ways to pick the
// banner each round, reading only what the player sees (the scouts' ranges). The choice must be real: the smart pick (gain a banner for the fewest enemies) clearly beats
// charging the biggest group, and a game takes a sensible time. node sim/battleground.js [runs per case, default 12]
require('./_seed.js'); // seeded (#125): the same commit always gives the same result; SEED=n picks other dice
globalThis.localStorage = (() => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; })();
require('../src/data.js'); require('../src/engine.js'); require('../src/bots.js'); require('../src/game.js');
const { G, D } = globalThis;
// a fixed start (#125): the real clock made every run different (who is online follows the local hour); a Wednesday
// evening, as test/world.js; the sim moves t itself
const RealDate = Date; let t = new RealDate(2026, 9, 7, 19).getTime();
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(t); } static now() { return t; } };
const N = +process.argv[2] || 12;
// tuning knobs for trying values without editing the game (BG_SPREAD=2 BG_RG=0.5 node sim/battleground.js 24)
if (process.env.BG_SPREAD) G.BG_SCOUT_SPREAD = +process.env.BG_SPREAD;
if (process.env.BG_RG) G.BG_REACT_GROUP = +process.env.BG_RG;
if (process.env.BG_R) G.BG_REACT = +process.env.BG_R;
// a pick is [where your group goes, where the pair goes]
const names = () => D.BG.highmoor.banners.map((x) => x[0]);
const PICK = {
  // smart: the pair takes an empty banner (or the weakest one); your group goes where it gains most for the fewest enemies
  smart: (bg) => { const n = names(), k = (b) => G.bgScoutRange(bg, b)[1];
    const empty = n.filter((b) => !k(b) && bg.owner[b] !== 'us'), weak = n.slice().sort((a, b) => k(a) - k(b));
    const pair = empty[0] || weak.find((b) => k(b) <= 1) || weak[0];
    const grp = n.filter((b) => b !== pair).sort((a, b) => (k(a) - (bg.owner[a] === 'them' ? 0.5 : 0)) - (k(b) - (bg.owner[b] === 'them' ? 0.5 : 0)))[0] || pair;
    return [grp, pair]; },
  naive: (bg) => { const b = names().sort((a, c) => G.bgScoutRange(bg, c)[1] - G.bgScoutRange(bg, a)[1])[0]; return [b, b]; },
  random: () => { const n = names(); return [n[Math.floor(Math.random() * 3)], n[Math.floor(Math.random() * 3)]]; },
};
function play(strat, cls, L) {
  G.newGame({ name: 'Bg', cls, race: cls === 'shaman' ? 'orc' : 'human' }); const S = G.S, P = S.player; P.level = L; S.flags.warModeAsked = true;
  P.equip = G.botChar({ name: 'x', cls, race: 'human', level: L, skill: 0.6 }).equip; P.talents = G.autoTalents(cls, 'dps', L, 0); P.role = 'dps';
  G.queueFor('bg_highmoor'); G.acceptPop(); const t0 = t; let g = 0, fights = 0;
  while (S.bg && S.bg.phase !== 'done' && g++ < 500000) {
    if (S.bg.phase === 'choose' && !G.fight) { G.bgGo(...PICK[strat](S.bg)); if (G.fight) fights++; }
    if (G.fight && G.pUnit && G.pUnit.kind === 'player') { G.pUnit.kind = 'bot'; G.pUnit.bot = { skill: 0.6, react: 0.5 }; G.pUnit.role = G.role(); }
    G.update(0.1); t += 100;
  }
  return { win: S.bg && S.bg.result === 'win', secs: (t - t0) / 1000, fights, score: S.bg ? S.bg.score : null };
}
let bad = 0;
const res = {};
for (const L of [10, 20, 40, 60]) for (const strat of Object.keys(PICK)) { // 10: where the battleground opens (issue #19)
  let w = 0, secs = 0, f = 0;
  for (let i = 0; i < N; i++) { const r = play(strat, ['warrior', 'mage', 'priest', 'rogue'][i % 4], L); w += r.win ? 1 : 0; secs += r.secs; f += r.fights; }
  res[L + strat] = w / N;
  console.log(`L${L} ${strat.padEnd(6)}: wins ${Math.round((w / N) * 100)}% · ${Math.round(secs / N)}s a game · ${(f / N).toFixed(1)} fights`);
}
for (const L of [10, 20, 40, 60]) if (res[L + 'smart'] - res[L + 'naive'] < 0.2) { bad++; console.log(`FAIL L${L}: the smart pick is not clearly better`); }
// a battleground never outstays you (issue #30): a finished one doesn't block invites or groups, and closes on a reload;
// one still going stays through a short break and ends after 10 minutes away, without a Deserter mark
{
  const chk = (c, msg) => { if (!c) { bad++; console.log('FAIL ' + msg); } };
  play('smart', 'warrior', 20); const S = G.S;
  chk(S.bg && S.bg.phase === 'done' && !G.bgBusy(), 'a finished battleground is not busy');
  S.lastSeen = t - 1000; G.catchUp();
  chk(!S.bg && S.chat.some((m) => /You left the Battle for Highmoor/.test(m.text)), 'a finished battleground closes on a reload, with a chat line');
  G.newGame({ name: 'Bg', cls: 'mage', race: 'human' }); G.S.player.level = 20; G.S.flags.warModeAsked = true; G.queueFor('bg_highmoor'); G.acceptPop();
  chk(G.S.bg && G.bgBusy(), 'a battleground in progress is busy');
  G.S.lastSeen = t - 60000; G.catchUp(); chk(!!G.S.bg, 'a battleground in progress stays through a short break');
  G.S.lastSeen = t - 660000; G.catchUp(); chk(!G.S.bg && !((G.S.flags.deserterUntil || 0) > t), 'after 10 minutes away it ends, with no Deserter mark');
}
console.log(bad ? `${bad} problem(s)` : 'battleground: the choice is real; it never outstays you');
process.exitCode = bad ? 1 : 0;
