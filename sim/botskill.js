// The skill (b.skill) bots really get in the group finder (Faizal's question: are bots too good or too bad?). Queue and
// accept the real group finder many times and read the skill of every bot it brings: Normal dungeons by level band, raids,
// Hard raids and Trials. Also the skill of the bots in the world (B.makeBot), which the finder draws from.
//   ROOT=~/azeroth-solo-measure K=300 SEED=0 node sim/botskill.js
require('./_seed.js');
const ROOT = process.env.ROOT || require('path').join(__dirname, '..');
globalThis.localStorage = (() => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; })();
for (const f of ['data', 'engine', 'bots', 'game']) require(ROOT + '/src/' + f + '.js'); require(ROOT + '/src/trials.js');
const { G, D, B } = globalThis;
const RealDate = Date; let t = new RealDate(2026, 9, 14, 19).getTime();
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(t); } static now() { return t; } };
const K = +(process.env.K || 200);
const stats = (a) => { const s = a.slice().sort((x, y) => x - y), q = (f) => s[Math.min(s.length - 1, Math.floor(f * (s.length - 1)))], m = s.reduce((x, y) => x + y, 0) / s.length, sd = Math.sqrt(s.reduce((x, y) => x + (y - m) ** 2, 0) / s.length); return { n: s.length, mean: +m.toFixed(2), sd: +sd.toFixed(2), min: +s[0].toFixed(2), p10: +q(0.1).toFixed(2), p50: +q(0.5).toFixed(2), p90: +q(0.9).toFixed(2), max: +s[s.length - 1].toFixed(2) }; };
const band = (a) => { const b = [0, 0, 0, 0, 0]; for (const x of a) b[x < 0.3 ? 0 : x < 0.45 ? 1 : x < 0.6 ? 2 : x < 0.75 ? 3 : 4]++; return b.map((n) => Math.round(n / a.length * 100) + '%').join(' / '); };
function grab(act, lvl, opts) {
  const sk = [];
  for (let i = 0; i < K; i++) {
    G.newGame({ name: 'S', cls: ['mage', 'warrior', 'priest'][i % 3], race: 'human' }); const S = G.S, P = S.player; P.level = lvl; S.flags.warModeAsked = true; P.place = D.ACTIVITIES[act].where;
    if (opts && opts.trial) { P.trials = { season: 0, best: {}, open: { [act]: opts.trial }, week: null, history: [], bestEver: 0, bestRank: null }; G.trialBlock = () => null; if (!G.queueTrial(act, opts.trial)) continue; }
    else { if (opts && opts.hard) P.codex = { [act]: { clears: 1, flawless: 0, speed: 0, best: null } }; G.queueFor(act, opts && opts.hard ? { hard: true } : undefined); }
    if (!S.queue) continue; G.acceptPop(); if (!S.group) continue;
    for (const m of S.group.members) if (m.bot && !m.legend) sk.push(m.bot.skill);
  }
  return sk;
}
console.log('skill = b.skill; bands: <0.30 / 0.30-0.45 / 0.45-0.60 / 0.60-0.75 / >=0.75 (share of bots)');
const world = []; for (let i = 0; i < 2000; i++) world.push(B.makeBot(1 + i, new Set(), { level: 20 + (i % 40) }).skill);
console.log('world bots (B.makeBot)'.padEnd(34), JSON.stringify(stats(world)), band(world));
const rows = [['Normal 5-player, level 17-30', 'deadmines', 20], ['Normal 5-player, level 33-47', 'sm_library', 36], ['Normal 5-player, level 51-60', 'blackrock_depths', 55], ['Normal 5-player at 60', 'stratholme', 60], ['Normal 3-player elite group', 'stitches', 28], ['Raid Normal (10)', 'onyxias_lair', 60], ['Raid Normal (10)', 'molten_core', 60], ['Raid Normal (10)', 'tidecrown_citadel', 60]];
for (const [lab, act, lvl] of rows) { const a = grab(act, lvl); console.log(`${lab} (${act})`.padEnd(34), JSON.stringify(stats(a)), band(a)); }
for (const act of ['onyxias_lair', 'molten_core', 'tidecrown_citadel']) { const a = grab(act, 60, { hard: true }); console.log(`Raid Hard (${act})`.padEnd(34), JSON.stringify(stats(a)), band(a)); }
for (const lv of [1, 5, 10, 15, 20]) for (const act of ['stratholme']) { const a = grab(act, 60, { trial: lv }); console.log(`Trial ${lv} (${act})`.padEnd(34), JSON.stringify(stats(a)), band(a)); }
