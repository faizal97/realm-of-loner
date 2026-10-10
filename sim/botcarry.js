// Do bots carry the group, or does the player? (Faizal's question on dungeon and raid difficulty.) Full clears through the
// game's real run loop, as sim/difficulty.js (the player is driven by the bot AI, the group finder's own bots). Per run:
// 1. each member's damage and healing, the player against the average bot of the same role (pets count for their owner);
// 2. mistakes per fight by the bot's skill band. The engine has no mistake counter: these are PROXIES read from the
//    combat stream and the fight state every 0.1 s (the sim's own definitions, not the game's):
//      late/missed heal  an ally fell under 50% and then under 30% in one stretch and no heal landed on them within 2 s of
//                        the first drop (charged to each healer bot that was alive)
//      lost taunt        a monster stayed on a group member who is not the tank for 2.5 s while a tank was alive and not
//                        stunned (charged to each tank bot)
//      wrong target      a damage bot's target differed from the most common target of the group's damage dealers for 1.5 s
//                        (only groups with 3+ damage dealers)
//      idle              a damage bot, alive and not stunned, dealt no damage for 4 s while a monster was alive
// 3. the counterfactual: PSKILL sets the player's AI skill (default 0.7, as sim/difficulty.js); PSKILL=0.48 is the average
//    bot's (sim/botskill.js). The same seed then gives the same dice with a bot-average player.
//   ROOT=~/azeroth-solo-measure ACTS=deadmines,stratholme CLASSES=mage,warrior,priest N=10 SEED=0 PSKILL=0.7 JSON=1 node sim/botcarry.js
require('./_seed.js');
const ROOT = process.env.ROOT || require('path').join(__dirname, '..');
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
for (const f of ['data', 'engine', 'bots', 'game']) require(ROOT + '/src/' + f + '.js');
require(ROOT + '/src/trials.js');
const { G, D } = globalThis;
const RealDate = Date; let t = new RealDate(2026, 9, 14, 19).getTime();
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(t); } static now() { return t; } };
const N = +(process.env.N || 8), CLS = (process.env.CLASSES || 'mage,warrior,priest').split(','), PSKILL = +(process.env.PSKILL || 0.7), LVOFF = +(process.env.LVOFF || 0);
const ACTS = process.env.ACTS ? process.env.ACTS.split(',') : ['deadmines', 'stockade', 'sm_library', 'coinworks', 'maraudon', 'blackrock_depths', 'stratholme', 'sunken_archive', 'onyxias_lair', 'molten_core'];
const BANDS = [[0, 0.3], [0.3, 0.45], [0.45, 0.6], [0.6, 0.75], [0.75, 2]], BN = ['<0.30', '0.30-0.45', '0.45-0.60', '0.60-0.75', '>=0.75'];
const bandOf = (s) => BANDS.findIndex(([a, b]) => s >= a && s < b);
const acc = { healer: BANDS.map(() => ({ fights: 0, late: 0 })), tank: BANDS.map(() => ({ fights: 0, lost: 0 })), dps: BANDS.map(() => ({ fights: 0, wrong: 0, idle: 0 })) };
let run = null; // the current run: { reg, dmg, heal, lastDmg, healAt }
G.on('combat', (evs) => {
  if (!run || !G.fight) return; const U = G.fight.units, now = G.fight.t;
  for (const e of evs) {
    const u = e.src != null ? U[e.src] : null; if (!u || u.side !== 'ally') continue;
    const owner = u.kind === 'pet' ? U[u.owner] : u, key = owner && owner.name; if (!key) continue;
    if (e.type === 'dmg') { run.dmg[key] = (run.dmg[key] || 0) + (e.amount || 0); if (u.kind !== 'pet') run.lastDmg[key] = now; }
    if (e.type === 'heal') { run.heal[key] = (run.heal[key] || 0) + (e.amount || 0); const tg = U[e.tgt]; if (tg) run.healAt[tg.name] = now; }
  }
});
function clear(act, cls) {
  const A = D.ACTIVITIES[act];
  G.newGame({ name: 'D', cls, race: 'human' });
  const S = G.S, P = S.player, LV = Math.min(60, (A.minLvl || 10) + (A.minLvl >= 60 ? 0 : LVOFF)); P.level = LV;
  P.equip = G.botChar({ name: 'x', cls, race: 'human', level: LV, skill: Math.min(0.6, PSKILL) }).equip;
  P.talents = G.autoTalents(cls, D.CLASSES[cls].role === 'tank' ? 'tank' : D.CLASSES[cls].role === 'healer' ? 'healer' : 'dps', LV, 0); P.hp = null; P.res = null;
  S.flags.warModeAsked = true; P.place = A.where;
  G.queueFor(act); if (!S.queue) return null; G.acceptPop(); if (!S.run) return null;
  run = { reg: {}, dmg: {}, heal: {}, lastDmg: {}, healAt: {} };
  let last = null, st = {}, fights = 0, g = 0;
  const finish = () => { // count unit-fights and mistakes for the fight that just ended
    for (const name in run.reg) { const n = run.reg[name]; if (n.isPlayer) continue; const b = bandOf(n.skill), s = st[name] || {}; const a = acc[n.role] || acc.dps; a[b].fights++; if (n.role === 'healer') a[b].late += s.late || 0; else if (n.role === 'tank') a[b].lost += s.lost || 0; else { a[b].wrong += s.wrong || 0; a[b].idle += s.idle || 0; } }
    st = {}; run.lastDmg = {}; run.healAt = {};
  };
  const sample = (C) => {
    const al = C.allies.filter((u) => u.kind !== 'pet'), liveEn = C.enemies.filter((u) => !u.dead);
    for (const u of al) { if (!run.reg[u.name]) run.reg[u.name] = { role: u.role || 'dps', cls: u.cls, skill: u.isPlayer || u.name === 'D' ? PSKILL : ((u.bot && u.bot.skill) != null ? u.bot.skill : 0.5), isPlayer: !!u.isPlayer || u.name === 'D' }; st[u.name] = st[u.name] || { late: 0, lost: 0, wrong: 0, idle: 0, heal: null, loose: {}, off: 0, offDone: false, idleDone: false }; }
    const tanks = al.filter((u) => u.role === 'tank' && !u.dead && !(u.stunUntil > C.t)), healers = al.filter((u) => u.role === 'healer' && !u.dead);
    for (const a of al) { // late or missed heal
      const s = st[a.name], f = a.dead ? 0 : a.hp / a.maxHp;
      if (a.dead) { if (!s.gone) { s.gone = true; if (s.heal && s.heal.low) for (const h of healers) if (!h.isPlayer && h.name !== 'D') st[h.name].late++; } s.heal = null; continue; } // a death counts once (an ally who fell under 30% and was not healed in time), not on every tick after
      s.gone = false;
      if (!s.heal && f < 0.5) s.heal = { at: C.t, low: false, h0: run.healAt[a.name] == null ? -9 : run.healAt[a.name] };
      if (s.heal) {
        if (f < 0.3) s.heal.low = true;
        const landed = (run.healAt[a.name] == null ? -9 : run.healAt[a.name]) > s.heal.h0;
        if (landed || f >= 0.7 || a.dead || C.t - s.heal.at > 2.05) { if (s.heal.low && !landed) for (const h of healers) if (!h.isPlayer && h.name !== 'D') st[h.name].late++; s.heal = (f < 0.5 && !a.dead && !landed) ? { at: C.t, low: false, h0: s.heal.h0 } : null; if (landed && f < 0.5 && !a.dead) s.heal = { at: C.t, low: false, h0: run.healAt[a.name] }; }
      }
    }
    for (const e of liveEn) { // lost taunt
      const tg = C.units[e.target], loose = tanks.length && tg && tg.side === 'ally' && tg.role !== 'tank' && tg.kind !== 'pet';
      const k = tanks.length ? st[tanks[0].name].loose : null;
      if (loose) { k[e.uid] = k[e.uid] || { at: C.t, done: false }; if (!k[e.uid].done && C.t - k[e.uid].at >= 2.5) { k[e.uid].done = true; for (const tk of tanks) if (!tk.isPlayer && tk.name !== 'D') st[tk.name].lost++; } } else for (const tk of tanks) delete st[tk.name].loose[e.uid];
    }
    const dps = al.filter((u) => (u.role || 'dps') === 'dps' && !u.dead), cnt = {};
    for (const u of dps) if (u.target != null && C.units[u.target] && !C.units[u.target].dead) cnt[u.target] = (cnt[u.target] || 0) + 1;
    const modal = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0];
    for (const u of dps) { // wrong target and idle
      const s = st[u.name];
      if (modal != null && dps.length >= 3 && String(u.target) !== modal) { s.off += 0.1; if (s.off >= 1.5 && !s.offDone) { s.offDone = true; s.wrong++; } } else { s.off = 0; s.offDone = false; }
      if (!(u.stunUntil > C.t) && liveEn.length) { const ld = run.lastDmg[u.name]; if (ld == null ? C.t > 4 : C.t - ld >= 4) { if (!s.idleDone) { s.idleDone = true; s.idle++; } } else s.idleDone = false; }
    }
  };
  while (S.run && S.run.phase !== 'done' && g++ < 600000) {
    if (G.fight && G.pUnit && G.pUnit.kind === 'player') { G.pUnit.kind = 'bot'; G.pUnit.bot = { skill: PSKILL, react: 0.9 - 0.6 * PSKILL }; G.pUnit.role = G.role(); G.pUnit.isPlayer = true; }
    for (const r of (S.run.rolls || [])) if (!r.done && !r.player) { try { G.roll(S.run.rolls.indexOf(r), 'pass'); } catch (e) {} }
    if (S.run.phase === 'rest' && G.role() === 'tank' && Date.now() >= S.run.restUntil && (G.restState().topped || Date.now() >= S.run.restUntil + 60000) && !S.group.members.some((m) => m.gone)) G.runPull(); // a tank player pulls by the rule a bot tank uses (G.restState: everyone topped up, or after a cap)
    if (S.run.wipes > 12) break;
    G.update(0.1); t += 100;
    const C = G.fight;
    if (C) { if (C !== last) { if (last) finish(); last = C; fights++; st = {}; run.lastDmg = {}; run.healAt = {}; } sample(C); } else if (last) { finish(); last = null; }
  }
  return { done: !!(S.run && S.run.phase === 'done'), wipes: S.run ? S.run.wipes : 99, fights, reg: run.reg, dmg: run.dmg, heal: run.heal };
}
const runs = [];
for (const act of ACTS) for (const cls of CLS) for (let i = 0; i < N; i++) { const r = clear(act, cls); if (!r) continue; runs.push(Object.assign({ act, cls }, r)); }
const out = { runs: runs.map((r) => ({ act: r.act, cls: r.cls, done: r.done, wipes: r.wipes, fights: r.fights, reg: r.reg, dmg: r.dmg, heal: r.heal })), acc, BN, PSKILL, seed: +(process.env.SEED || 0) };
if (process.env.JSON) { console.log(JSON.stringify(out)); process.exit(0); }
console.log(`runs ${runs.length}, player skill ${PSKILL}: cleared ${runs.filter((r) => r.done).length}, runs with a wipe ${runs.filter((r) => r.wipes).length}, wipes/run ${(runs.reduce((a, r) => a + r.wipes, 0) / runs.length).toFixed(2)}`);
for (const role of ['healer', 'tank', 'dps']) console.log(role, BN.map((b, i) => `${b}: ${acc[role][i].fights} unit-fights, ${role === 'healer' ? (acc[role][i].late / Math.max(1, acc[role][i].fights)).toFixed(2) + ' late heals' : role === 'tank' ? (acc[role][i].lost / Math.max(1, acc[role][i].fights)).toFixed(2) + ' lost taunts' : (acc[role][i].wrong / Math.max(1, acc[role][i].fights)).toFixed(2) + ' wrong-target, ' + (acc[role][i].idle / Math.max(1, acc[role][i].fights)).toFixed(2) + ' idle'} per fight`).join(' | '));
