// Economy at level 60: Marks, coin and loot value per clear and per hour, per activity.
//   SEED=n [REPEAT=1] node sim/economy.js <activity> [runs]      prints one JSON line per run: {act, marks, coin, vend, ah, secs, ok, ...}
// Measures the repo it sits in: run it from ~/azeroth-solo-measure for numbers that match main (#181, #501).
const ROOT = require('path').join(__dirname, '..');
require(ROOT + '/sim/_seed.js');
globalThis.localStorage = (() => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; })();
const RealDate = Date; let t = new RealDate(2026, 10, 3, 12).getTime(); // Tue 2026-11-03 12:00 local
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(t); } static now() { return t; } };
for (const f of ['data', 'engine', 'bots', 'game', 'trials', 'social']) { try { require(ROOT + '/src/' + f + '.js'); } catch (e) { if (f !== 'social') throw e; } }
const { G, D } = globalThis;
const ACT = process.argv[2] || 'stratholme', N = +process.argv[3] || 3;
const CLASSES = ['mage', 'rogue', 'hunter', 'warrior', 'warlock', 'priest'];
const lootOf = (dk) => { const s = new Set(); for (const p of D.DUNGEONS[dk].pulls) for (const m of p.mobs) for (const i of (D.MOBS[m].loot || [])) s.add(i); return [...s]; };
// "raider" gear, as sim/trialpace.js: the best raid purple per slot from Magma Throne + Veshmira's Lair, not upgraded
function gear(P) {
  const ids = ['molten_core', 'onyxias_lair'].flatMap(lootOf);
  for (const slot of D.GEAR_SLOTS) {
    const fits = ids.filter((id) => D.ITEMS[id].slot === slot && G.canUseItem(D.ITEMS[id], P.cls)).sort((a, b) => G.itemScore(D.ITEMS[b], P.cls) - G.itemScore(D.ITEMS[a], P.cls));
    P.equip[slot] = fits.length ? G.copyItem(fits[0]) : G.genGear(slot, 60, 3, P.cls === 'mage' || P.cls === 'warlock' || P.cls === 'priest' ? { atype: 'cloth' } : P.cls === 'warrior' ? { atype: 'mail' } : {});
  }
}
let realBagCap = null;
function setup(cls, race) {
  G.newGame({ name: 'Eco', cls, race: race || 'human' }); const S = G.S, P = S.player;
  P.level = 60; S.flags.warModeAsked = true; S.flags.stormBroken = true; P.riding = true;
  P.mount = Object.keys(D.MOUNTS).find((k) => D.MOUNTS[k].cost && (!D.MOUNTS[k].faction || D.MOUNTS[k].faction === D.RACES[P.race].faction));
  P.talents = G.autoTalents(cls, 'dps', 60, 0); P.role = 'dps'; gear(P);
  P.hp = null; P.res = null;
  if (!realBagCap) realBagCap = G.bagCap;
  G.bagCap = () => 999; // nothing lost to full bags: we count everything that dropped
  return P;
}
const sellable = (it) => it && !it.noSell && it.slot !== 'quest' && it.id !== 'hearthstone' && it.slot !== 'food' && it.slot !== 'drink';
function inv() {
  const P = G.S.player; let vend = 0, ah = 0, items = 0; const q = [0, 0, 0, 0, 0, 0];
  for (const b of [].concat(P.bags || [], P.bank || [])) { const it = b.item; if (!sellable(it)) continue; vend += (it.sell || 1) * b.n; items += b.n; q[it.q || 0] += b.n; ah += G.ahTrade(it) ? Math.round(G.ahValue(it) * 0.8 * 0.95) * b.n : (it.sell || 1) * b.n; }
  return { vend, ah, items, q };
}
function snap() { return { marks: G.account().marks, coin: G.S.player.money, inv: inv(), t }; }
function diff(a, b, extra) {
  return Object.assign({ act: ACT, seed: +(process.env.SEED || 0), marks: b.marks - a.marks, coin: b.coin - a.coin, vend: b.inv.vend - a.inv.vend, ah: b.inv.ah - a.inv.ah, items: b.inv.items - a.inv.items, blues: b.inv.q[3] - a.inv.q[3], purples: b.inv.q[4] - a.inv.q[4], greens: b.inv.q[2] - a.inv.q[2], secs: Math.round((b.t - a.t) / 1000) }, extra || {});
}
const botify = (skill) => { if (G.fight && G.pUnit && G.pUnit.kind === 'player') { G.pUnit.kind = 'bot'; G.pUnit.bot = { skill: skill || 0.72, react: 0.45 }; G.pUnit.role = G.role(); } };
function rolls() {
  const R = G.S.run; if (!R) return;
  (R.rolls || []).forEach((r, i) => { if (!r.done && !r.player) { try { G.roll(i, r.item && D.GEAR_SLOTS.includes(r.item.slot) && G.canUseItem(r.item) && G.isUpgrade && G.isUpgrade(r.item) ? 'need' : 'greed'); } catch (e) {} } });
}
function step(s) { for (let i = 0; i < s * 10; i++) { G.update(0.1); t += 100; } }
function waitQueue() { const S = G.S; let g = 0; while (S.queue && !S.queue.popped && g++ < 100000) { G.update(1); t += 1000; } if (S.queue) G.acceptPop(); }
// drive a run to its end; returns {done, wipes}
function driveRun(maxWipes) {
  const S = G.S; let g = 0;
  while (S.run && S.run.phase !== 'done' && g++ < 1500000) {
    botify(); rolls();
    if (S.run && S.run.phase === 'rest' && S.run.restUntil <= t) { try { G.runPull(); } catch (e) {} }
    if (S.run && S.run.wipes > maxWipes) break;
    G.update(0.1); t += 100;
  }
  const R = S.run, out = { done: !!(R && R.phase === 'done'), wipes: R ? R.wipes : 99, bonus: R && R.bonus ? { speed: R.bonus.speed, flawless: R.bonus.flawless } : null };
  // let open rolls settle (the group does not wait long)
  for (let k = 0; k < 900 && S.run && (S.run.rolls || []).some((r) => !r.done); k++) { rolls(); G.update(0.1); t += 100; }
  return out;
}
function endRun() { const S = G.S; try { G.leaveGroup(); } catch (e) {} S.run = null; S.group = null; S.queue = null; G.fight = null; G.pUnit = null; }
const hub = 'chillwind_camp';
function travelSecs(dest) { if (!dest || dest === hub) return 0; const r = G.route(hub, dest); return r ? Math.round(r.secs) : 0; }

const out = (o) => console.log('JSON ' + JSON.stringify(o));
const A = D.ACTIVITIES[ACT];

if (ACT === 'roulette') {
  for (let i = 0; i < N; i++) {
    setup(CLASSES[i % CLASSES.length]); t += 86400000; // a fresh day each time
    const a = snap(); G.startRoulette(); const act = G.S.run && G.S.run.act; const r = driveRun(15); endRun();
    out(diff(a, snap(), { ok: r.done, wipes: r.wipes, which: act, sync: act && G.syncLevel ? G.syncLevel(act) : null, bonus: r.bonus }));
  }
} else if (ACT === 'trial') {
  const LV = +(process.env.TLVL || 5);
  for (let i = 0; i < N; i++) {
    const cls = CLASSES[i % 3]; setup(cls); const S = G.S, P = S.player; const acts = G.trialPicks(); const act = acts[i % acts.length];
    P.trials = { season: globalThis.TRIALS.season(new Date()), best: {}, open: { [act]: LV }, week: null, history: [], bestEver: 0, bestRank: null };
    const a = snap();
    if (!G.queueTrial(act, LV)) { out({ act: 'trial', err: 'no queue', which: act }); continue; }
    waitQueue();
    for (const k of S.run.omens || []) {
      if (k === 'guarded') S.run.bossPlan = 'adds'; if (k === 'enraging') S.run.bossPlan = 'boss';
      if (k === 'volatile') S.run.pace = 'careful'; if (k === 'hasty' || k === 'restless') S.run.pace = 'fast';
      if (k === 'warded' || k === 'vengeful' || k === 'sheltered') { S.run.marks = {}; S.run.pulls.forEach((p, j) => { const n = p.mobs.length; if (n < 2) return; S.run.marks[j] = k === 'warded' ? { [n - 1]: 'skull' } : n >= 3 ? { 0: 'skull', 1: 'cross' } : { 0: 'skull' }; }); }
    }
    for (const m of S.group.members) { m.bot.skill = 0.72; gear(m); }
    const r = driveRun(12); const timed = !!(S.run && S.run.bonus) && G.trials().best[act] && G.trials().best[act].timed; endRun();
    out(diff(a, snap(), { act: 'trial' + LV, ok: r.done, wipes: r.wipes, which: act, timed }));
  }
} else if (ACT === 'bg') {
  const smart = (bg) => { const n = D.BG.highmoor.banners.map((x) => x[0]), k = (b) => G.bgScoutRange(bg, b)[1];
    const empty = n.filter((b) => !k(b) && bg.owner[b] !== 'us'), weak = n.slice().sort((a, b) => k(a) - k(b));
    const pair = empty[0] || weak.find((b) => k(b) <= 1) || weak[0];
    const grp = n.filter((b) => b !== pair).sort((a, b) => (k(a) - (bg.owner[a] === 'them' ? 0.5 : 0)) - (k(b) - (bg.owner[b] === 'them' ? 0.5 : 0)))[0] || pair; return [grp, pair]; };
  for (let i = 0; i < N; i++) {
    setup(CLASSES[i % CLASSES.length], i % 2 ? 'orc' : 'human'); const S = G.S; const a = snap();
    G.queueFor('bg_highmoor'); waitQueue(); let g = 0;
    while (S.bg && S.bg.phase !== 'done' && g++ < 600000) { if (S.bg.phase === 'choose' && !G.fight) G.bgGo(...smart(S.bg)); botify(0.6); G.update(0.1); t += 100; }
    const win = S.bg && S.bg.result === 'win'; try { G.leaveBg(); } catch (e) {}
    out(diff(a, snap(), { ok: true, win }));
  }
} else if (ACT === 'brawl') {
  for (let i = 0; i < N; i++) {
    const cls = CLASSES[i % CLASSES.length]; setup(cls); const S = G.S, P = S.player; P.place = 'bloodsand_arena';
    // the next open window
    let w = G.brawlWindow(new Date(t)); if (!w.open) t = w.opensAt.getTime() + 60000;
    P.brawl = Object.assign(P.brawl || {}, { last: null });
    const a = snap();
    if (!G.brawlJoin()) { out({ act: 'brawl', err: G.brawlBlock && G.brawlBlock() }); t += 3 * 3600000; continue; }
    let g = 0;
    while (S.brawl && S.brawl.phase !== 'done' && g++ < 400000) { if (S.brawl.phase === 'choose' && !G.fight) G.brawlFight(); botify(0.7); G.update(0.1); t += 100; }
    const br = S.brawl; if (br && br.chest) G.brawlTakeChest(0);
    out(diff(a, snap(), { ok: true, wins: br ? br.wins : 0, champion: !!(br && br.champion) }));
    S.brawl = null; t += 3 * 3600000;
  }
} else if (ACT === 'help') {
  // Help Wanted: one character answers N posts in a row; between them it waits for the next post (the game's own gap),
  // so 'waited' is the honest idle time a player who does only this would see
  setup(CLASSES[0]); const S = G.S, P = S.player; P.place = hub;
  P.codex = {}; for (const k of Object.keys(D.ACTIVITIES)) if (D.ACTIVITIES[k].dungeon && !D.DUNGEONS[D.ACTIVITIES[k].dungeon].raid) P.codex[k] = { clears: 1, flawless: 0, speed: 0, best: null };
  S.flags.nextHelpWanted = t + 13 * 60000; // not a free post at t=0
  for (let i = 0; i < N; i++) {
    const a = snap(); let g = 0;
    while (!(S.helpWanted || []).length && g++ < 40000) { G.update(1); t += 1000; }
    const waited = Math.round((t - a.t) / 1000);
    const req = S.helpWanted[0]; if (!req) { out({ act: 'help', err: 'no post' }); continue; }
    const b0 = snap(); G.joinHelpWanted(req.id); const r = driveRun(15); endRun(); P.place = hub;
    S.helpWanted = (S.helpWanted || []).filter((x) => x.expires > t);
    out(diff(a, snap(), { ok: r.done, wipes: r.wipes, which: req.act, stuck: !!req.startIdx, firstTimers: req.firstTimers, waited, runSecs: Math.round((t - b0.t) / 1000), sync: G.syncLevel(req.act) }));
  }
} else if (ACT === 'farm' || ACT === 'bounty') {
  // open world at level 60: kill what is at the place for MIN minutes, eat/drink when low, sell nothing (counted as value)
  const PLACE = process.env.PLACE || 'the_wyrmbog', MIN = +(process.env.MIN || 60);
  for (let i = 0; i < N; i++) {
    const cls = CLASSES[i % CLASSES.length]; setup(cls); const S = G.S, P = S.player; P.place = PLACE; P.bind = PLACE;
    G.addItem(G.copyItem('sweet_roll_60'), 200); G.addItem(G.copyItem('spring_water_60'), 200);
    let bty = [];
    if (ACT === 'bounty') { // take this place's hub dailies + weekly whose mob lives here
      const H = process.env.HUB || 'brackenwall_village'; bty = G.bounties(H); for (const b of bty) G.acceptBounty(b);
    }
    const a = snap(); let food = 0, drink = 0, kills = 0, deaths = 0, d0 = P.deaths || 0; const end = t + MIN * 60000;
    while (t < end) {
      if (P.ghostUntil) { step(5); continue; }
      if (!G.fight) {
        const v = G.vitals(), hpPct = v.hp / v.maxHp, resPct = v.resType === 'mana' ? v.res / v.maxRes : 1;
        if (hpPct < 0.6) { G.consume('food'); food++; step(G.EAT_SECS); continue; }
        if (resPct < 0.4) { G.consume('drink'); drink++; step(G.DRINK_SECS); continue; }
        const al = G.placeMobs().filter((x) => x.state === 'alive' && (x.level || 60) <= 61 && !x.elite);
        if (!al.length) { step(2); continue; }
        const m = al[Math.floor(Math.random() * al.length)]; G.engage(m.id);
        if (!G.fight) { step(1); continue; }
        const dd = P.deaths || 0; let g = 0; while (G.fight && g++ < 6000) { botify(0.72); G.update(0.1); t += 100; }
        if ((P.deaths || 0) === dd) kills++; step(1.5); // loot and walk to the next
      } else { botify(0.72); step(0.1); }
      if (ACT === 'bounty') for (const b of bty) if (G.bountyState(b) === 'complete') { G.turnInBounty(b); b.doneAt = Math.round((t - a.t) / 1000); }
    }
    const r = snap(); deaths = (P.deaths || 0) - d0;
    const bdone = bty.map((b) => (b.weekly ? 'W:' : 'D:') + b.mob + ':' + b.n + ':' + (b.doneAt || 'open'));
    out(diff(a, r, { act: ACT + ':' + PLACE, ok: true, kills, deaths, food, drink, bounties: bdone }));
  }
} else if (A && A.worldBoss) {
  for (let i = 0; i < N; i++) {
    setup(CLASSES[i % CLASSES.length]); const S = G.S, P = S.player;
    // this boss's week
    let k = 0; while (G.worldBoss(new Date(t)) !== ACT && k++ < 20) t += 7 * 86400000;
    P.place = A.where; const a = snap(); G.queueFor(ACT); waitQueue(); const r = driveRun(8); endRun();
    const first = diff(a, snap(), { ok: r.done, wipes: r.wipes, first: true, travel: travelSecs(A.where) });
    out(first);
    // the second kill that week: no boss loot, no Marks
    P.place = A.where; const b = snap(); G.queueFor(ACT); waitQueue(); const r2 = driveRun(8); endRun();
    out(diff(b, snap(), { ok: r2.done, wipes: r2.wipes, first: false }));
    t += 7 * 86400000 * 3;
  }
} else if (A && A.dungeon) {
  const raid = D.DUNGEONS[A.dungeon].raid;
  for (let i = 0; i < N; i++) {
    setup(CLASSES[i % CLASSES.length]); const S = G.S, P = S.player; P.place = A.where;
    P.codex = { [ACT]: { clears: 1, flawless: 0, speed: 0, best: null } };
    // not the featured week's first clear: measured as a repeat clear (the featured bonus is added on top in the report)
    if (raid) G.raidWeek().featured = true;
    if (raid && process.env.REPEAT) G.raidWeek().got['marks:' + ACT] = true; // REPEAT=1: not this raid's first clear this week (#501)
    const a = snap(); G.queueFor(ACT, { hard: !!process.env.HARD }); if (!S.queue) { out({ act: ACT, err: 'no queue: ' + G.activityBlock(ACT) }); continue; }
    waitQueue(); const r = driveRun(raid ? 15 : 12); endRun();
    out(diff(a, snap(), { ok: r.done, wipes: r.wipes, bonus: r.bonus, travel: travelSecs(A.where), hard: !!process.env.HARD }));
  }
} else console.log('unknown activity', ACT);
module.exports = { setup, gear, G, D, CLASSES };
