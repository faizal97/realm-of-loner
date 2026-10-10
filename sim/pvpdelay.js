// PvP reaction delay (#193): duel, battleground and Bloodsand Brawl win rates today and with a reaction delay on the bots.
// The delay is a MODEL in the sim (src/ is not touched): a bot in a player-versus-player fight (an enemy character on the
// other side) that wants a reactive ability (a heal, shield, stun, fear, root, slow, dash, hop or racial: the things that
// answer something that happened) waits DELAY seconds after the first moment it wanted it before the game lets it act;
// until then the use fails and the bot plays on with what it has. Draw once per reaction, +-20%. Rotation (damage,
// buffs) is unchanged, and the player's own unit never waits. DELAY=fixed:0.4 | fixed:1.2 | scaled (1.2 s at skill 0 down
// to 0.4 s at skill 1, the issue's rule) | none. SIDE=both (every bot in the fight) | enemy (only bots against the player).
//   ROOT=~/azeroth-solo-measure MODE=duel|bg|brawl L=60 N=300 SEED=0 DELAY=scaled node sim/pvpdelay.js
// Duel: the player (class cls, game's own gear for its level, bot AI at PSKILL, default 0.6) against a bot of a random class
// at the same level with the skill rule of G.startDuel (the bot's skill clamped to 0.3-0.8), 25 m apart, game's own gear
// for both (G.botChar). N fights per player class.
require('./_seed.js');
const ROOT = process.env.ROOT || require('path').join(__dirname, '..');
globalThis.localStorage = (() => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; })();
for (const f of ['data', 'engine', 'bots', 'game']) require(ROOT + '/src/' + f + '.js');
const { G, D, E, B } = globalThis;
const RealDate = Date; let t = new RealDate(2026, 9, 7, 19).getTime();
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(t); } static now() { return t; } };
const MODE = process.env.MODE || 'duel', L = +(process.env.L || 60), N = +(process.env.N || 100), PSKILL = +(process.env.PSKILL || 0.6), SIDE = process.env.SIDE || 'both';
const DELAY = process.env.DELAY || 'none', PDELAY = +(process.env.PDELAY || 0); // PDELAY: seconds of game time the PLAYER's reactive abilities wait (a human's 0.5 s x the game speed: 1.5 s at 3x); bots keep DELAY
const CLASSES = Object.keys(D.CLASSES).filter((c) => !D.CLASSES[c].hidden);
// ---- the delay model
const reactive = (A) => !!(A && (A.heal || A.hot || A.shield || A.stun || A.fear || A.root || A.slow || A.stompAll || A.dash || A.stepBack || A.racial || A.cleanse || (A.buff && (A.buff.speed || A.buff.immune))));
const delayOf = (u) => { const sk = (u.bot && u.bot.skill) || 0.5, base = DELAY === 'scaled' ? 1.2 - 0.8 * Math.min(1, Math.max(0, sk)) : +DELAY.split(':')[1]; return base * (0.8 + 0.4 * Math.random()); };
const stats = { wanted: 0, waited: 0, acted: 0 };
if (DELAY !== 'none' || PDELAY) {
  const use = E.use;
  E.use = function (C, u, id, tgt) {
    if (!u || u.kind !== 'bot' || !reactive(D.ABILITIES[id]) || (u.isPlayer ? !PDELAY : DELAY === 'none')) return use.apply(this, arguments);
    const pvp = C.enemies.some((x) => x.cls && x.kind !== 'pet') && C.allies.some((x) => x.cls && x.kind !== 'pet');
    if (!pvp || (!u.isPlayer && SIDE === 'enemy' && u.side !== 'enemy')) return use.apply(this, arguments);
    const k = (u._rx = u._rx || {}), s = k[id];
    if (!s || C.t - s.last > 1.6) { k[id] = { due: C.t + (u.isPlayer ? PDELAY * (0.8 + 0.4 * Math.random()) : delayOf(u)), last: C.t }; stats.wanted++; return 'reacting'; }
    s.last = C.t; if (C.t < s.due) { stats.waited++; return 'reacting'; }
    delete k[id]; stats.acted++; return use.apply(this, arguments);
  };
}
const out = (o) => console.log(JSON.stringify(Object.assign({ mode: MODE, L, delay: DELAY, pdelay: PDELAY, side: SIDE, seed: +(process.env.SEED || 0) }, o)));
if (MODE === 'duel') {
  const unit = (cls, skill, side, isPlayer) => { const c = G.botChar({ name: cls + side, cls, race: cls === 'shaman' ? 'orc' : 'human', level: L, skill, role: 'dps' }); c.role = 'dps'; c.talents = G.autoTalents(cls, 'dps', L, Math.floor(Math.random() * 3)); c.hp = null; c.res = null;
    const u = E.charUnit(c, side, 'bot', 0); u.bot = { skill, react: 0.9 - 0.6 * skill }; u.role = 'dps'; if (side === 'enemy') u.threat = {}; u.isPlayer = !!isPlayer; return u; };
  const byClass = {}; let w = 0, n = 0, secs = 0;
  for (const cls of CLASSES) {
    let cw = 0;
    for (let i = 0; i < N; i++) {
      const ecls = CLASSES[Math.floor(Math.random() * CLASSES.length)], esk = Math.min(0.8, Math.max(0.3, B.makeBot(1 + Math.floor(Math.random() * 1e6), new Set(), { level: L }).skill));
      G.newGame({ name: 'D', cls, race: cls === 'shaman' ? 'orc' : 'human' }); const P = G.S.player; P.level = L; P.equip = G.botChar({ name: 'x', cls, race: 'human', level: L, skill: 0.6 }).equip; P.talents = G.autoTalents(cls, 'dps', L, Math.floor(Math.random() * 3)); P.role = 'dps'; P.hp = null; P.res = null;
      if (cls === 'warlock' && L >= 10) P.pet = { type: 'voidwalker', name: 'Pet', hp: null };
      if (cls === 'hunter') { const b = Object.keys(D.MOBS).filter((k) => D.MOBS[k].family === 'beast' && !D.MOBS[k].named && !D.MOBS[k].elite && !D.MOBS[k].boss && D.MOBS[k].lvl[0] <= L).sort((a, c) => D.MOBS[c].lvl[0] - D.MOBS[a].lvl[0])[0]; if (b) P.pet = { type: 'beast', mob: b, name: D.MOBS[b].name, hp: null }; }
      const pu = E.charUnit(P, 'ally', 'bot', 0); pu.bot = { skill: PSKILL, react: 0.9 - 0.6 * PSKILL }; pu.role = 'dps'; pu.isPlayer = true; const eu = unit(ecls, esk, 'enemy'), allies = [pu], pet = G.petUnitFor(pu); if (pet) allies.push(pet);
      const C = E.fight(allies, [eu], { soloUid: pu.uid, puller: pu, apart: G.DUEL_APART || 25 });
      while (!C.over && C.t < 300) { E.tick(C, 0.1); C.events.length = 0; }
      const win = eu.hp <= 0 && pu.hp > 0 ? 1 : 0; cw += win; w += win; n++; secs += C.t;
    }
    byClass[cls] = cw / N;
  }
  const v = Object.values(byClass); out({ n, win: w / n, secs: secs / n, byClass, min: Math.min(...v), max: Math.max(...v), stats });
}
if (MODE === 'bg') {
  require(ROOT + '/src/trials.js');
  const names = () => D.BG.highmoor.banners.map((x) => x[0]);
  const smart = (bg) => { const n = names(), k = (b) => G.bgScoutRange(bg, b)[1]; const empty = n.filter((b) => !k(b) && bg.owner[b] !== 'us'), weak = n.slice().sort((a, b) => k(a) - k(b)); const pair = empty[0] || weak.find((b) => k(b) <= 1) || weak[0]; const grp = n.filter((b) => b !== pair).sort((a, b) => (k(a) - (bg.owner[a] === 'them' ? 0.5 : 0)) - (k(b) - (bg.owner[b] === 'them' ? 0.5 : 0)))[0] || pair; return [grp, pair]; };
  let w = 0, n = 0, secs = 0; const by = {};
  for (let i = 0; i < N; i++) {
    const cls = ['warrior', 'mage', 'priest', 'rogue'][i % 4];
    G.newGame({ name: 'Bg', cls, race: cls === 'shaman' ? 'orc' : 'human' }); const S = G.S, P = S.player; P.level = L; S.flags.warModeAsked = true;
    P.equip = G.botChar({ name: 'x', cls, race: 'human', level: L, skill: 0.6 }).equip; P.talents = G.autoTalents(cls, 'dps', L, 0); P.role = 'dps';
    G.queueFor('bg_highmoor'); G.acceptPop(); const t0 = t; let g = 0;
    while (S.bg && S.bg.phase !== 'done' && g++ < 500000) {
      if (S.bg.phase === 'choose' && !G.fight) G.bgGo(...smart(S.bg));
      if (G.fight && G.pUnit && G.pUnit.kind === 'player') { G.pUnit.kind = 'bot'; G.pUnit.bot = { skill: PSKILL, react: 0.5 }; G.pUnit.role = G.role(); G.pUnit.isPlayer = true; }
      G.update(0.1); t += 100;
    }
    const win = S.bg && S.bg.result === 'win' ? 1 : 0; w += win; n++; secs += (t - t0) / 1000; (by[cls] = by[cls] || [0, 0]); by[cls][0] += win; by[cls][1]++;
  }
  out({ n, win: w / n, secs: secs / n, byClass: Object.fromEntries(Object.entries(by).map(([k, v]) => [k, v[0] / v[1]])), stats });
}
if (MODE === 'brawl') {
  const OPEN = new Date('2026-10-01T15:01:00').getTime(); let seedN = 0, champs = 0, rounds = 0, n = 0; const by = {};
  for (const cls of CLASSES) {
    let rw = 0, c = 0, m = 0;
    for (let i = 0; i < N; i++) {
      t = OPEN; G.newGame({ name: 'Pit', cls, race: cls === 'shaman' ? 'orc' : 'human' }); const S = G.S, P = S.player; P.level = L; S.flags.warModeAsked = true; P.place = 'bloodsand_arena';
      P.equip = G.botChar({ name: 'x', cls, race: 'human', level: L, skill: PSKILL }).equip; P.talents = G.autoTalents(cls, 'dps', L, seedN++); P.role = 'dps';
      if (!G.brawlJoin()) continue; let g = 0;
      while (S.brawl && S.brawl.phase !== 'done' && g++ < 400000) { if (S.brawl.phase === 'choose' && !G.fight) G.brawlFight(); if (G.fight && G.pUnit && G.pUnit.kind === 'player') { G.pUnit.kind = 'bot'; G.pUnit.bot = { skill: PSKILL, react: 0.9 - 0.6 * PSKILL }; G.pUnit.role = 'dps'; G.pUnit.isPlayer = true; } G.update(0.1); t += 100; }
      const br = S.brawl; if (!br) continue; m++; n++; rw += br.wins; rounds += br.wins; if (br.champion) { champs++; c++; }
    }
    by[cls] = { rounds: rw / Math.max(1, m), champion: c / Math.max(1, m) };
  }
  out({ n, champion: champs / n, rounds: rounds / n, byClass: by, stats });
}
