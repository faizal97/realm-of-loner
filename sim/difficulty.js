// Dungeon and raid difficulty (player feedback): how often a group wipes and how close each fight gets. Full clears through
// the game's real run loop (the group finder's own bots, loot off), the player driven by the bot AI as sim/tactics.js does.
// Per activity and class: runs cleared, runs with a wipe, wipes per run, and for the closest fight the group won: the lowest
// the group's total health fell (share of its max health, sampled every 0.1 s), the lowest any one member fell, and how long
// the fight lasted. Fights where someone died but the group won are counted too.
//   ROOT=~/azeroth-solo-measure ACTS=deadmines,stockade CLASSES=mage,warrior,priest N=8 SEED=0 node sim/difficulty.js
//   LVOFF=3 plays that many levels above the activity's minimum (default 0, the lowest level the finder lets in);
//   GEAR=blue gives a level-60 player a level-60 blue in every slot (default: the gear the game gives its bots, G.botChar);
//   PROFILE=fitted|masher|undergeared|baddraw (docs/design-mindset.md section 7): fitted = level-60-grade blue gear in every slot and
//   bot AI skill 0.85; masher = the player presses ONE button (the class's first damaging ability, or its first heal for a healer)
//   and nothing else; undergeared = white gear ten levels below the activity; baddraw = every bot in the group at skill 0.2 (gear
//   unchanged). Default: today's player (bot gear, skill 0.7). All four are done in the sim, with no engine hook.
//   TELE=whirl switches on the telegraphs of that kind of mechanic (#179); TELE=* all of them.
//   SCALE=1.2,1.2 multiplies the Normal trash and boss damage (and hp: SCALE=td,bd,th,bh) of the activities in ACTS.
//   ONLY=golemagg fights only the pull with that mob, so one boss's mechanic is measured without the rest of the run's luck.
//   HARD=1 queues a raid on Hard (needs a Normal clear first: the sim records one); JSON=1 prints the raw rows.
//   Lanternwake's run (v10.13): ACTS=ev_snuffed_road DATE=2026-10-28T19:00 LVOFF=5|25|50 (levels 15, 35, 60).
require('./_seed.js');
const ROOT = process.env.ROOT || require('path').join(__dirname, '..');
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
for (const f of ['data', 'engine', 'bots', 'game']) require(ROOT + '/src/' + f + '.js');
require(ROOT + '/src/trials.js');
const { G, D } = globalThis;
const RealDate = Date; let t = process.env.DATE ? new RealDate(process.env.DATE).getTime() : new RealDate(2026, 9, 14, 19).getTime(); // DATE=2026-10-28T19:00 plays on that day (a festival run needs its dates, v10.13)
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(t); } static now() { return t; } };
const PROFILE = process.env.PROFILE || 'today';
const N = +(process.env.N || 8), CLS = (process.env.CLASSES || 'mage,warrior,priest').split(','), LVOFF = +(process.env.LVOFF || 0), HARD = !!process.env.HARD, BLUE = process.env.GEAR === 'blue';
const SKIP = (k) => D.ACTIVITIES[k].worldBoss || !(D.ACTIVITIES[k].dungeon ? D.DUNGEONS[D.ACTIVITIES[k].dungeon].pulls.length : (D.ACTIVITIES[k].pulls || []).length);
const ACTS = (process.env.ACTS ? process.env.ACTS.split(',') : Object.keys(D.ACTIVITIES).filter((k) => !SKIP(k)));
// SCALE="trash dmg,boss dmg[,trash hp,boss hp]" multiplies the Normal multipliers of every activity in ACTS (#215: searching for
// the step that meets the targets without editing the data)
// XMULT=0.5 sets the strength of every Normal boss extra hit (a share of the boss's hit) in ACTS (#215: Veshmira's breath)
if (process.env.XMULT) for (const k of ACTS) { const o = D.DUNGEONS[D.ACTIVITIES[k].dungeon] || {}; for (const b in o.extra || {}) for (const x of o.extra[b]) if ((x.kind || 'adds') === 'hit') x.mult = +process.env.XMULT; }
// TELE=whirl,molten switches on telegraphs by kind (a special's kind, 'x:<mob>' for a boss extra, '*' for all), as E.TELE.on (#179)
if (process.env.TELE) for (const k of process.env.TELE.split(',')) globalThis.E.TELE.on.add(k);
// TELE_MISS=guard:1.5 sets a missed answer's size by answer; TELE_DEF=shield_block makes abilities count as defensives (trying answers, #179)
if (process.env.TELE_MISS) for (const kv of process.env.TELE_MISS.split(',')) { const [k, v] = kv.split(':'); globalThis.E.TELE.missOf[k] = +v; }
if (process.env.TELE_DEF) for (const id of process.env.TELE_DEF.split(',')) D.ABILITIES[id].defensive = true;
if (process.env.SCALE) { const [td, bd, th = 1, bh = 1] = process.env.SCALE.split(',').map(Number); for (const k of ACTS) { const o = D.ACTIVITIES[k].dungeon ? D.DUNGEONS[D.ACTIVITIES[k].dungeon] : D.ACTIVITIES[k]; o.trashMult = { hp: (o.trashMult || { hp: 1 }).hp * th, dmg: (o.trashMult || { dmg: 1 }).dmg * td }; o.bossMult = { hp: (o.bossMult || { hp: 1 }).hp * bh, dmg: (o.bossMult || { dmg: 1 }).dmg * bd }; } }
if (PROFILE === 'masher') {
  const use = globalThis.E.use, one = {};
  const pick = (cls, role) => one[cls + role] || (one[cls + role] = D.CLASSES[cls].abilities.find((id) => { const A = D.ABILITIES[id]; return A && !A.form && !A.shapeshift && !A.opener && !A.finisher && !A.taunt && (role === 'healer' ? (A.heal && A.target === 'ally') : (A.target === 'enemy' && A.dmg && !A.cd)); }) || null);
  globalThis.E.use = function (C, u, id, tgt) { if (u && u.isPlayer && id !== pick(u.cls, u.role)) return 'masher'; return use.apply(this, arguments); };
}
function clear(act, cls) {
  const A = D.ACTIVITIES[act];
  G.newGame({ name: 'D', cls, race: 'human' });
  const S = G.S, P = S.player, LV = Math.min(60, (A.minLvl || 10) + (A.minLvl >= 60 ? 0 : LVOFF)); P.level = LV;
  P.equip = G.botChar({ name: 'x', cls, race: 'human', level: LV, skill: 0.6 }).equip;
  if (BLUE && LV >= 60) for (const slot of D.GEAR_SLOTS) P.equip[slot] = G.genGear(slot, 60, 3, D.CLASSES[cls].armorType === 'cloth' ? { atype: 'cloth' } : D.CLASSES[cls].armorType === 'leather' ? { atype: 'leather' } : D.CLASSES[cls].armorType === 'plate' ? { atype: 'plate' } : { atype: 'mail' });
  if (PROFILE === 'undergeared') for (const slot of D.GEAR_SLOTS) if (slot !== 'offhand' && (slot !== 'ranged' || D.CLASSES[cls].ranged)) P.equip[slot] = G.genGear(slot, Math.max(1, LV - 10), 1, slot === 'weapon' ? { wtype: D.CLASSES[cls].weapons[0] } : slot === 'ranged' ? {} : { atype: D.CLASSES[cls].armorType });
  if (PROFILE === 'fitted') for (const slot of D.GEAR_SLOTS) if (slot !== 'offhand' && (slot !== 'ranged' || D.CLASSES[cls].ranged)) P.equip[slot] = G.genGear(slot, LV, 3, Object.assign({ affix: G.classAffix(cls) }, slot === 'weapon' ? { wtype: D.CLASSES[cls].weapons[0] } : slot === 'ranged' ? {} : { atype: D.CLASSES[cls].armorType }));
  P.talents = G.autoTalents(cls, D.CLASSES[cls].role === 'tank' ? 'tank' : D.CLASSES[cls].role === 'healer' ? 'healer' : 'dps', LV, 0); P.hp = null; P.res = null;
  S.flags.warModeAsked = true; P.place = A.where;
  if (HARD) P.codex = { [act]: { clears: 1, flawless: 0, speed: 0, best: null } };
  G.queueFor(act, HARD ? { hard: true } : undefined); if (!S.queue) return null; G.acceptPop(); if (!S.run) return null;
  if (PROFILE === 'baddraw') for (const m of S.group.members) if (m.bot) m.bot.skill = 0.2;
  const R = S.run, atts = []; let last = null, att = null, g = 0;
  if (process.env.ONLY) { R.pulls = R.pulls.filter((p) => p.mobs.includes(process.env.ONLY)); if (!R.pulls.length) return null; } // one boss's pull alone (#179)
  const sample = (C) => {
    const al = C.allies.filter((u) => u.kind !== 'pet'); if (!al.length) return;
    let hp = 0, mx = 0, lo = 1; for (const u of al) { const h = u.dead ? 0 : Math.max(0, u.hp), f = h / u.maxHp; hp += h; mx += u.maxHp; if (f < lo) lo = f; }
    att.g = Math.min(att.g, hp / mx); att.m = Math.min(att.m, lo); att.t = C.t; att.dead = Math.max(att.dead, al.filter((u) => u.dead).length);
  };
  while (S.run && S.run.phase !== 'done' && g++ < 600000) {
    if (G.fight && G.pUnit && G.pUnit.kind === 'player') { G.pUnit.kind = 'bot'; G.pUnit.bot = { skill: PROFILE === 'fitted' ? 0.85 : 0.7, react: PROFILE === 'fitted' ? 0.4 : 0.5 }; G.pUnit.role = G.role(); G.pUnit.isPlayer = true; }
    for (const r of (S.run.rolls || [])) if (!r.done && r.player && r.choice == null) { try { G.roll(S.run.rolls.indexOf(r), 'pass'); } catch (e) {} }
    if (S.run.phase === 'rest' && G.role() === 'tank' && Date.now() >= S.run.restUntil && (G.restState().topped || Date.now() >= S.run.restUntil + 60000) && !S.group.members.some((m) => m.gone)) G.runPull(); // a tank player pulls by the rule a bot tank uses (G.restState: everyone topped up, or after a cap)
    if (S.run.wipes > 12) break;
    G.update(0.1); t += 100;
    const C = G.fight;
    if (C) { if (C !== last) { const pl = R.pulls[R.idx] || {}; last = C; att = { idx: R.idx, boss: !!pl.boss, name: pl.boss ? (D.MOBS[pl.mobs[0]] || {}).name : null, g: 1, m: 1, t: 0, dead: 0, res: null }; atts.push(att); } sample(C); att.res = C.over; }
    else if (last) { att.res = last.over || att.res; last = null; }
  }
  return { done: !!(S.run && S.run.phase === 'done'), wipes: S.run ? S.run.wipes : 99, atts, size: S.group ? S.group.members.length + 1 : 0 };
}
const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[s.length >> 1] : null; }, pc = (x) => Math.round(x * 100) + '%';
const rows = [];
for (const act of ACTS) for (const cls of CLS) {
  const rs = []; for (let i = 0; i < N; i++) { const r = clear(act, cls); if (r) rs.push(r); }
  if (!rs.length) continue;
  const won = rs.map((r) => r.atts.filter((a) => a.res === 'win')), allWon = won.flat(), fights = rs.map((r) => r.atts).flat();
  const closest = rs.map((r, i) => won[i].slice().sort((a, b) => a.g - b.g)[0]).filter(Boolean);
  const worst = closest.slice().sort((a, b) => a.g - b.g)[0];
  const row = { act, cls, profile: PROFILE, runs: rs.length, cleared: rs.filter((r) => r.done).length, wipeRuns: rs.filter((r) => r.wipes > 0).length, wipes: rs.reduce((a, r) => a + r.wipes, 0) / rs.length,
    fights: fights.length, lost: fights.filter((a) => a.res === 'lose').length, deathInWin: allWon.filter((a) => a.dead > 0).length, won: allWon.length,
    closestMed: closest.length ? med(closest.map((a) => a.g)) : null, closestMin: worst ? worst.g : null, closestMinM: worst ? worst.m : null, closestSecs: worst ? Math.round(worst.t) : null, closestName: worst ? (worst.name || 'trash pull ' + (worst.idx + 1)) : null,
    under30: allWon.filter((a) => a.g < 0.3).length, size: med(rs.map((r) => r.size)) };
  rows.push(row);
  if (process.env.JSON) console.log(JSON.stringify(row)); else console.log(`${act.padEnd(18)} ${cls.padEnd(8)} ${PROFILE.padEnd(11)} lvl ${String(Math.min(60, D.ACTIVITIES[act].minLvl + (D.ACTIVITIES[act].minLvl >= 60 ? 0 : LVOFF))).padEnd(3)} runs ${String(row.runs).padEnd(3)} cleared ${row.cleared}/${row.runs} · runs with a wipe ${row.wipeRuns}/${row.runs} · wipes/run ${row.wipes.toFixed(2)} · fights lost ${row.lost}/${row.fights} · deaths in won fights ${row.deathInWin}/${row.won} · closest won fight: group low ${pc(row.closestMin)} (one member ${pc(row.closestMinM)}), ${row.closestSecs}s, ${row.closestName} · median run's closest ${pc(row.closestMed)}`);
}
