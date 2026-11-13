// Dungeon and raid difficulty (player feedback): how often a group wipes and how close each fight gets. Full clears through
// the game's real run loop (the group finder's own bots, loot off), the player driven by the bot AI as sim/tactics.js does.
// Per activity and class: runs cleared, runs with a wipe, wipes per run, and for the closest fight the group won: the lowest
// the group's total health fell (share of its max health, sampled every 0.1 s), the lowest any one member fell, and how long
// the fight lasted. Fights where someone died but the group won are counted too.
//   ROOT=~/azeroth-solo-measure ACTS=deadmines,stockade CLASSES=mage,warrior,priest N=8 SEED=0 node sim/difficulty.js
//   LVOFF=3 plays that many levels above the activity's minimum (default 0, the lowest level the finder lets in);
//   GEAR=blue gives a level-60 player a level-60 blue in every slot (default: the gear the game gives its bots, G.botChar);
//   GEAR=epic with PROFILE=fitted: the fitted gear at Epic quality (a player who has cleared Normal raids, for HARD=1);
//   RATING=0|400|800 sets the Trial rating, which picks a Hard group's bot skill (0.6-0.7 at 0, 0.85-0.95 at 800);
//   PROFILE=fitted|masher|undergeared|baddraw (docs/design-mindset.md section 7): fitted = level-60-grade blue gear in every slot and
//   bot AI skill 0.85; masher = the player presses ONE button (the class's first damaging ability, or its first heal for a healer)
//   and nothing else; undergeared = white gear ten levels below the activity; baddraw = careless bots at skill 0.2 in the gear
//   they would wear: every bot in a dungeon group, BADN (default 3) of the nine in a raid. Default: today's player (bot gear, skill 0.7). All four are done in the sim, with no engine hook.
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
// FLOG=<file> writes the fight log (#295) of the last fight lost in these runs, as a player's Share fight log would
if (process.env.FLOG) { require(ROOT + '/src/fightlog.js'); process.on('exit', () => { const x = globalThis.FLOG.text(); require('fs').writeFileSync(process.env.FLOG, x || '(no fight lost)\n'); console.log(`fight log: ${process.env.FLOG} (${x ? x.length.toLocaleString('en-US') : 0} characters)`); }); }
// TELESTAT=1: every red bar the runs saw, by its answer and name: started, cut (an interrupt or stun), landed; for a slam on
// the tank, how many were braced (its defensive), mended (a healer's shield) and kicked (others' interrupts), and how many
// had no answer at all (a player report, #294)
const TS = {}; if (process.env.TELESTAT) {
  const cur = {}, row = (k) => (TS[k] = TS[k] || { start: 0, cut: 0, land: 0, braced: 0, mended: 0, kicked: 0, none: 0 });
  const close = (src) => { const c = cur[src]; if (!c) return; const r = row(c.k); r.braced += c.brace; r.mended += c.mend; r.kicked += c.kicks > 0 ? 1 : 0; if (!c.brace && !c.mend && !c.kicks && !c.cut) r.none++; delete cur[src]; };
  globalThis.G.on('combat', (evs) => { for (const e of evs || []) { if (e.type !== 'tele') continue;
    if (e.what === 'start') { close(e.src); cur[e.src] = { k: (e.ans || '?') + ' ' + e.name, brace: 0, mend: 0, kicks: 0, cut: 0 }; row(cur[e.src].k).start++; continue; }
    const c = cur[e.src]; if (!c) continue;
    if (e.what === 'brace' || e.what === 'dodge') c.brace = 1; else if (e.what === 'mend') c.mend = 1; else if (e.what === 'kick') c.kicks++; else if (e.what === 'cut') { c.cut = 1; row(c.k).cut++; close(e.src); } else if (e.what === 'land') row(c.k).land++; } }); // a bar's tally closes at its caster's next bar (dodges and braces as it lands come after 'land')
  process.on('exit', () => { for (const k of Object.keys(cur)) close(k); console.log('red bars (answer name: started; cut; braced or dodged, mended, kicked at least once; no answer at all):'); for (const [k, r] of Object.entries(TS).sort((a, b) => b[1].start - a[1].start)) { const pc = (n) => `${n} (${r.start ? Math.round((n / r.start) * 100) : 0}%)`; console.log(`  ${k}: ${r.start}; cut ${pc(r.cut)}; braced or dodged ${pc(r.braced)}, mended ${pc(r.mended)}, kicked ${pc(r.kicked)}; no answer ${pc(r.none)}`); } }); }
const { G, D } = globalThis;
// ABILSTAT=1: how much of its kit each bot uses in group fights (#149): per class and role, the median of distinct
// abilities a bot used in a fight of 15 s or more, against what it knows (its class's abilities at its level, not passive),
// and the abilities it knows but never used across all its fights
const AS = {}; if (process.env.ABILSTAT) {
  const live = new Map(); // fight -> { uid: Set }
  G.on('combat', (evs) => { const C = G.fight; if (!C) return; let m = live.get(C); if (!m) { m = {}; live.set(C, m); } for (const e of evs || []) if (e.type === 'ability' && e.src != null) { const u = C.units[e.src]; if (u && u.kind === 'bot' && !u.isPlayer && u.side === 'ally') (m[e.src] = m[e.src] || new Set()).add(e.ab); } });
  const close = () => { for (const [C, m] of live) { if (!C.over) continue; live.delete(C); if (C.t < 15) continue;
    for (const u of C.allies) { if (u.kind !== 'bot' || u.isPlayer || !u.cls) continue; const role = u.role || D.CLASSES[u.cls].role, k = u.cls + ' ' + role, r = AS[k] = AS[k] || { n: [], known: [], seen: {}, kit: {} };
      const kit = D.CLASSES[u.cls].abilities.filter((id) => D.ABILITIES[id] && !D.ABILITIES[id].passive && (D.ABILITIES[id].lvl || 1) <= u.level); for (const id of kit) r.kit[id] = 1;
      const used = m[u.uid] || new Set(); r.n.push(used.size); r.known.push(kit.length); for (const id of used) r.seen[id] = (r.seen[id] || 0) + 1; } } };
  globalThis.__asClose = close; // the run loop closes ended fights between steps
  process.on('exit', () => { close(); const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s[s.length >> 1]; };
    console.log('kit use by bots (class role: fights; median distinct abilities a fight / median known; known but never used):');
    for (const [k, r] of Object.entries(AS).sort()) console.log(`  ${k}: ${r.n.length}; ${med(r.n)} / ${med(r.known)}; never: ${Object.keys(r.kit).filter((id) => !r.seen[id]).map((id) => D.ABILITIES[id].name).join(', ')}`); });
}
const RealDate = Date; let t = process.env.DATE ? new RealDate(process.env.DATE).getTime() : new RealDate(2026, 9, 14, 19).getTime(); // DATE=2026-10-28T19:00 plays on that day (a festival run needs its dates, v10.13)
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(t); } static now() { return t; } };
const PROFILE = process.env.PROFILE || 'today';
const N = +(process.env.N || 8), CLS = (process.env.CLASSES || 'mage,warrior,priest').split(','), LVOFF = +(process.env.LVOFF || 0), HARD = !!process.env.HARD, BLUE = process.env.GEAR === 'blue', EPIC = process.env.GEAR === 'epic';
if (process.env.RATING) G.trialRating = () => +process.env.RATING; // RATING=800: the Trial rating that sets a Hard group's skill (#298)
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
// BUSTER=golemagg.floor=2,golemagg.size=4 sets a boss's slam numbers for measuring (#179)
if (process.env.BUSTER) for (const kv of process.env.BUSTER.split(',')) { const [km, v] = kv.split('='), [k, f] = km.split('.'); D.MOBS[k].buster = Object.assign({}, D.MOBS[k].buster, { [f]: +v }); }
if (process.env.TELE_DEF) for (const id of process.env.TELE_DEF.split(',')) D.ABILITIES[id].defensive = true;
// WSCALE="8:2.2,25:3,40:3.6": a damage step for the Wanted elites in ACTS that follows the elite's level (minLvl), straight
// lines between the points and flat past the ends (#586: one flat step was too hard at level 8 and too easy from 40 up)
if (process.env.WSCALE) { const pts = process.env.WSCALE.split(',').map((p) => p.split(':').map(Number)); const at = (l) => { if (l <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (l <= pts[i][0]) { const [l0, x0] = pts[i - 1], [l1, x1] = pts[i]; return x0 + (x1 - x0) * (l - l0) / (l1 - l0); } return pts[pts.length - 1][1]; }; for (const k of ACTS) { const A = D.ACTIVITIES[k]; if (A.dungeon || A.event || A.needQuest || A.worldBoss) continue; const x = at(A.minLvl || 1); A.trashMult = { hp: 1, dmg: x }; A.bossMult = { hp: 1, dmg: x }; } }
if (process.env.SCALE) { const [td, bd, th = 1, bh = 1] = process.env.SCALE.split(',').map(Number); for (const k of ACTS) { const o = D.ACTIVITIES[k].dungeon ? D.DUNGEONS[D.ACTIVITIES[k].dungeon] : D.ACTIVITIES[k]; o.trashMult = { hp: (o.trashMult || { hp: 1 }).hp * th, dmg: (o.trashMult || { dmg: 1 }).dmg * td }; o.bossMult = { hp: (o.bossMult || { hp: 1 }).hp * bh, dmg: (o.bossMult || { dmg: 1 }).dmg * bd }; for (const c of [o.atCap, o.atCap && o.atCap.hard, o.hard]) if (c) { if (c.trashMult) c.trashMult = { hp: c.trashMult.hp * th, dmg: c.trashMult.dmg * td }; if (c.bossMult) c.bossMult = { hp: c.bossMult.hp * bh, dmg: c.bossMult.dmg * bd }; } } } // atCap and Hard scale too, or a level-60 run ignores SCALE
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
  // fitted: the gear the game gives a careful player of the class's role (skill 0.85), every piece blue at level (Epic
  // with GEAR=epic). Before this it was a blue of the class's own affix in every slot: a Mage's Owl (Intellect, Spirit)
  // scored below today's green Eagle (Stamina, Intellect), so fitted casters died to raid hits today's survived (#586)
  if (PROFILE === 'fitted') P.equip = G.botChar({ name: 'x', cls, race: 'human', level: LV, skill: 0.85, role: D.CLASSES[cls].role, gearFloor: EPIC ? 4 : 3 }).equip;
  P.talents = G.autoTalents(cls, D.CLASSES[cls].role === 'tank' ? 'tank' : D.CLASSES[cls].role === 'healer' ? 'healer' : 'dps', LV, 0); P.hp = null; P.res = null;
  S.flags.warModeAsked = true; P.place = A.where;
  if (HARD) P.codex = { [act]: { clears: 1, flawless: 0, speed: 0, best: null } };
  if (A.needQuest) P.quests[A.needQuest] = { prog: D.QUESTS[A.needQuest].objs.map(() => 0), at: Date.now() }; // a Legend's story fight queues only while you're on its quest; without this its runs were skipped silently
  G.queueFor(act, HARD ? { hard: true } : undefined); if (!S.queue) return null; G.acceptPop(); if (!S.run) return null;
  // a bad draw: careless bots at skill 0.2, in the gear a player that careless wears (#582: gear follows skill). A dungeon
  // group: every bot. A raid: BADN (default 3) of its bots, picked at random, any role, the rest an ordinary group-finder
  // draw: nine careless teammates is the worst raid there is, not the weaker teammates groups fairly often get (#586)
  const bots = S.group.members.filter((m) => m.bot && !m.legend);
  const careless = PROFILE !== 'baddraw' ? [] : bots.length > 4 ? bots.slice().sort(() => Math.random() - 0.5).slice(0, +(process.env.BADN || 3)) : bots;
  for (const m of careless) { m.bot.skill = 0.2; if (G.gearFloor) m.equip = G.botChar(Object.assign({}, m.bot, { role: m.role, gearFloor: G.gearFloor(act, HARD) })).equip; m.hp = null; m.res = null; }
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
    G.update(0.1); t += 100; if (globalThis.__asClose && !G.fight) globalThis.__asClose();
    const C = G.fight;
    if (C) { if (C !== last) { const pl = R.pulls[R.idx] || {}; last = C; att = { idx: R.idx, boss: !!pl.boss, name: pl.boss ? (D.MOBS[pl.mobs[0]] || {}).name : null, g: 1, m: 1, t: 0, dead: 0, res: null }; atts.push(att); } sample(C); att.res = C.over; }
    else if (last) { att.res = last.over || att.res; last = null; }
  }
  return { done: !!(S.run && S.run.phase === 'done'), wipes: S.run ? S.run.wipes : 99, atts, size: S.group ? S.group.members.length + 1 : 0, speed: !!(S.run && S.run.bonus && S.run.bonus.speed), secs: S.run && S.run.bonus ? S.run.bonus.secs : null, par: S.run && S.run.bonus ? S.run.bonus.par : null }; // speed: under par (#582: longer fights)
}
const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[s.length >> 1] : null; }, pc = (x) => Math.round(x * 100) + '%';
const rows = [];
for (const act of ACTS) for (const cls of CLS) {
  const rs = []; for (let i = 0; i < N; i++) { const r = clear(act, cls); if (r) rs.push(r); }
  if (!rs.length) continue;
  const won = rs.map((r) => r.atts.filter((a) => a.res === 'win')), allWon = won.flat(), fights = rs.map((r) => r.atts).flat();
  const closest = rs.map((r, i) => won[i].slice().sort((a, b) => a.g - b.g)[0]).filter(Boolean);
  if (process.env.LOSTAT) { const by = {}; for (const a of fights) if (a.res === 'lose') { const pl = (D.ACTIVITIES[act].dungeon ? D.DUNGEONS[D.ACTIVITIES[act].dungeon] : D.ACTIVITIES[act]).pulls[a.idx] || {}, k = `${a.idx + 1} ${pl.label || '?'}`; by[k] = (by[k] || 0) + 1; } console.log(`lost fights by pull (${act} ${cls}): ${JSON.stringify(by)}`); } // LOSTAT=1: where a run's lost fights happen, by pull
  const worst = closest.slice().sort((a, b) => a.g - b.g)[0];
  const row = { act, cls, profile: PROFILE, runs: rs.length, cleared: rs.filter((r) => r.done).length, wipeRuns: rs.filter((r) => r.wipes > 0).length, wipes: rs.reduce((a, r) => a + r.wipes, 0) / rs.length, speed: rs.filter((r) => r.speed).length, secsMed: med(rs.map((r) => r.secs).filter((x) => x != null)), par: (rs.find((r) => r.par) || {}).par || null,
    fights: fights.length, lost: fights.filter((a) => a.res === 'lose').length, deathInWin: allWon.filter((a) => a.dead > 0).length, won: allWon.length,
    closestMed: closest.length ? med(closest.map((a) => a.g)) : null, closestMin: worst ? worst.g : null, closestMinM: worst ? worst.m : null, closestSecs: worst ? Math.round(worst.t) : null, closestName: worst ? (worst.name || 'trash pull ' + (worst.idx + 1)) : null,
    under30: allWon.filter((a) => a.g < 0.3).length, size: med(rs.map((r) => r.size)) };
  rows.push(row);
  if (process.env.JSON) console.log(JSON.stringify(row)); else console.log(`${act.padEnd(18)} ${cls.padEnd(8)} ${PROFILE.padEnd(11)} lvl ${String(Math.min(60, D.ACTIVITIES[act].minLvl + (D.ACTIVITIES[act].minLvl >= 60 ? 0 : LVOFF))).padEnd(3)} runs ${String(row.runs).padEnd(3)} cleared ${row.cleared}/${row.runs} · runs with a wipe ${row.wipeRuns}/${row.runs} · wipes/run ${row.wipes.toFixed(2)} · fights lost ${row.lost}/${row.fights} · deaths in won fights ${row.deathInWin}/${row.won} · closest won fight: group low ${pc(row.closestMin)} (one member ${pc(row.closestMinM)}), ${row.closestSecs}s, ${row.closestName} · median run's closest ${pc(row.closestMed)}`);
}
