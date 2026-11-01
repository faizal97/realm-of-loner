// Two random streams (#74): chat and other cosmetic randomness draw from their own stream (E.crand), so changing what
// bots say, how often, or turning chat off leaves every fight, drop, roll and group exactly as it was, not just within
// noise. The same seeded dungeon runs (a level-20 group, a level-60 group, with loot rolls, wipes and members leaving) are
// played in fresh processes with chat as it is, chat off, chat at half volume, and every cosmetic draw tripled; their
// outcomes must match to the last random number. The check also proves chat really ran and really changed.
//   node sim/streams.js
const MODE = process.env.STREAMS_MODE;
if (!MODE) {
  // the judge: each mode in its own process (a fresh world), compared with the base
  const { execFileSync } = require('child_process');
  const run = (m) => JSON.parse(execFileSync('node', [__filename], { env: Object.assign({}, process.env, { STREAMS_MODE: m }), encoding: 'utf8' }).trim().split('\n').pop());
  const base = run('base'); let ok = 0, bad = 0; const check = (c, m) => { if (c) ok++; else { bad++; console.log('FAIL ' + m); } };
  console.log(`base: ${base.runs.map((r) => `${r.act} ${r.done ? 'cleared' : 'not cleared'}, ${r.wipes} wipes, ${r.rolls.length} rolls, ${r.left} left`).join('; ')}; ${base.chat} chat lines`);
  check(base.chat > 20, `chat ran in the base (${base.chat} lines)`);
  for (const r of base.runs) check(r.started && (r.done || r.wipes > 0), `the ${r.act} run started and was played out`);
  check(base.runs.some((r) => r.wipes > 0), 'a run wipes, so the wipe and walk-out lines are covered');
  for (const m of ['nochat', 'half', 'burn']) {
    const r = run(m), same = JSON.stringify(r.outcome) === JSON.stringify(base.outcome);
    const diff = same ? '' : Object.keys(base.outcome).filter((k) => JSON.stringify(base.outcome[k]) !== JSON.stringify(r.outcome[k])).join(', ');
    console.log(`${m}: ${r.chat} chat lines (chat ${r.chatSig === base.chatSig ? 'unchanged' : 'changed'}), outcomes ${same ? 'identical' : 'DIFFER in ' + diff}`);
    check(same, `${m}: the fights, drops and rolls are identical to the base (differ in: ${diff})`);
    check(r.chatSig !== base.chatSig, `${m}: the chat really changed, so the check proves something`);
  }
  console.log(`streams: ${ok}/${ok + bad} checks pass`);
  process.exitCode = bad ? 1 : 0;
  return;
}
{ let s = 0x5eed1e55 >>> 0; Math.random = () => { s = (s + 0x6D2B79F5) >>> 0; let x = s; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
globalThis.localStorage = (() => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; })();
require('../src/data.js'); require('../src/engine.js'); require('../src/bots.js'); require('../src/game.js'); require('../src/trials.js'); require('../src/social.js');
const { G, D, E, B, SOC } = globalThis;
const RealDate = Date; let t = new RealDate(2026, 9, 7, 19).getTime(); // a Wednesday evening: a busy server, plenty of chat
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(t); } static now() { return t; } };
// the chat changes, none of which may touch an outcome
if (MODE === 'nochat') { B.chatTick = () => {}; SOC.tick = () => {}; }
if (MODE === 'half') { const ct = B.chatTick, st = SOC.tick; let k = 0, j = 0; B.chatTick = (S, n) => { if (k++ % 2) ct(S, n); }; SOC.tick = () => { if (j++ % 2) st(); }; }
if (MODE === 'burn' && E.crand) { const c = E.crand; E.crand = () => { c(); c(); return c(); }; }
let chat = 0, chatSig = 0; const seen = new Set();
const sign = (S) => { for (const m of S.chat) if (!seen.has(G.S.id + ':' + m.id)) { seen.add(G.S.id + ':' + m.id); chat++; for (const ch of String(m.text)) chatSig = (Math.imul(chatSig, 31) + ch.charCodeAt(0)) | 0; } };
const runs = [];
// a level-20 and a level-60 dungeon, this week's world boss, and a level-20 group of careless players who wipe (so members
// also lose patience and walk out, a draw on the outcome stream with a line on the cosmetic one)
for (const [lvl, cls, race, wb, weak] of [[20, 'priest', 'human'], [60, 'warrior', 'dwarf'], [60, 'mage', 'gnome', true], [20, 'rogue', 'orc', false, true]]) {
  const act = wb ? G.worldBoss(new Date(t)) : Object.keys(D.ACTIVITIES).find((k) => { const A = D.ACTIVITIES[k]; return A.dungeon && !A.needQuest && !A.worldBoss && (A.size || 5) === 5 && A.minLvl <= lvl && A.maxLvl >= lvl; });
  G.newGame({ name: 'S' + lvl, cls, race }); const S = G.S, P = S.player; S.flags.warModeAsked = true; P.level = lvl;
  P.equip = G.botChar({ name: 'x', cls, race, level: lvl, skill: 0.8 }).equip; P.talents = G.autoTalents(cls, cls === 'priest' ? 'healer' : 'dps', lvl, 0);
  P.place = D.ACTIVITIES[act].where; G.queueFor(act); G.acceptPop(); const started = !!S.run; let g = 0;
  if (weak && S.run) { const up = (m) => ({ hp: (m ? m.hp : 1) * 2.5, dmg: (m ? m.dmg : 1) * 2.5 }); S.run.mult = up(S.run.mult); S.run.bossMult = up(S.run.bossMult); }
  while (S.run && S.run.phase !== 'done' && g++ < 400000) {
    if (G.fight && G.pUnit && G.pUnit.kind === 'player') { G.pUnit.kind = 'bot'; G.pUnit.bot = weak ? { skill: 0.1, react: 0.9 } : { skill: 0.75, react: 0.45 }; G.pUnit.role = G.role(); }
    for (const r of (S.run.rolls || [])) if (!r.done && !r.player) { try { G.roll(S.run.rolls.indexOf(r), 'need'); } catch (e) {} }
    if (S.run && S.run.phase === 'rest' && S.run.restUntil <= t) { try { G.runPull(); } catch (e) {} }
    if (S.run && S.run.wipes > 8) break;
    G.update(0.1); t += 100; if (g % 50 === 0) sign(S);
  }
  sign(S);
  const R = S.run || {};
  runs.push({ act, started, done: R.phase === 'done', wipes: R.wipes || 0, idx: R.idx, rolls: (R.rolls || []).map((r) => (r.item && r.item.id) + ':' + (r.winner || r.won || '')), left: S.group ? S.group.members.filter((m) => m.gone).length : 0,
    xp: P.xp, level: P.level, money: P.money, bags: JSON.stringify(P.bags || P.inv || []).length, hp: P.hp });
}
// the next number on the outcome stream: equal only if every outcome draw happened, in the same order
const outcome = { runs, next: Math.random() };
console.log(JSON.stringify({ runs, chat, chatSig, outcome }));
