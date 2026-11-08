// The pre-patch's debt collectors (#522, docs/plans/2026-11-08-prepatch-design.md §3): while D.PREPATCH.live every levelling
// place with creatures has a few collectors at the place's own level; a kill that isn't grey gives a torn debt note.
// Part 1 fights them the way the game does (G.engage on a collector from G.placeMobs, social pulls included), the player
// driven by the bot AI (skill 0.8, dps talents, the game's bot gear for the level, a Warlock's or Hunter's pet as
// sim/lvpace.js), from full health and no cooldowns each fight, at the collector place whose range is centred nearest the
// level. The baseline is the same place's normal creatures, fought the same way. Per level and class: median kill time
// (won fights), deaths per 100 fights, torn debt notes per collector killed, and the name the place's collectors carry.
// Part 2 (EDGE=1) checks the edges: notes by level gap (grey = 5 or more levels under you), safe, city and gated places
// have none, normal creatures give none, and none spawn once D.PREPATCH.live is false.
//   ROOT=~/azeroth-solo-measure node sim/collectors.js            all classes at 10, 35, 60; seeds 0-4; 10 fights of each a seed
//   LEVELS=10,35 CLASSES=mage,warrior SEEDS=0,1 N=6 node sim/collectors.js     EDGE=1 runs part 2 only; JSON=1 prints raw rows
const ROOT = process.env.ROOT || require('path').join(__dirname, '..');
globalThis.localStorage = (() => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; })();
const seed = (n) => { let s = (0x5eed1e55 ^ Math.imul(+n, 0x9E3779B1)) >>> 0; Math.random = () => { s = (s + 0x6D2B79F5) >>> 0; let x = s; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }; // sim/_seed.js's generator
seed(0);
for (const f of ['data', 'engine', 'bots', 'game']) require(ROOT + '/src/' + f + '.js');
const { G, D } = globalThis;
const RealDate = Date; let t = new RealDate(2026, 10, 9, 19).getTime(); // a Monday evening, pre-patch live (D.PREPATCH.live is a flag, not a date)
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(t); } static now() { return t; } };
const step = (secs) => { G.update(secs); t += secs * 1000; };
const LEVELS = (process.env.LEVELS || '10,35,60').split(',').map(Number), CLASSES = (process.env.CLASSES || Object.keys(D.CLASSES).join(',')).split(',');
const SEEDS = (process.env.SEEDS || '0,1,2,3,4').split(',').map(Number), N = +(process.env.N || 10);
const normal = (k) => D.MOBS[k] && !D.MOBS[k].named && !D.MOBS[k].elite && !D.MOBS[k].boss && !D.MOBS[k].collector;
const placeFor = (L) => Object.keys(D.PLACES).filter((k) => { const p = D.PLACES[k]; return p.lvl && p.lvl[0] <= L && p.lvl[1] >= L && G.collectorsHere(p) && p.mobs.every(([m]) => normal(m)); })
  .sort((a, b) => Math.abs((D.PLACES[a].lvl[0] + D.PLACES[a].lvl[1]) / 2 - L) - Math.abs((D.PLACES[b].lvl[0] + D.PLACES[b].lvl[1]) / 2 - L))[0];
function setup(cls, L, place) {
  G.newGame({ name: 'C', cls, race: 'human' }); const S = G.S, P = S.player; S.flags.warModeAsked = true; S.flags.noInvites = true;
  P.level = L; P.equip = G.botChar({ name: 'x', cls, race: 'human', level: L, skill: 0.8 }).equip; P.talents = G.autoTalents(cls, 'dps', L, 0); P.role = 'dps';
  P.place = place; P.hp = null; P.res = null;
  if (cls === 'warlock') P.pet = { type: L >= D.PETS.voidwalker.lvl ? 'voidwalker' : 'imp', name: 'Pet', hp: null };
  if (cls === 'hunter') { const b = L >= D.PETS.beast.lvl && Object.keys(D.MOBS).filter((k) => D.MOBS[k].family === 'beast' && !D.MOBS[k].named && !D.MOBS[k].elite && !D.MOBS[k].boss && D.MOBS[k].lvl[0] <= L).sort((a, c) => D.MOBS[c].lvl[0] - D.MOBS[a].lvl[0])[0]; P.pet = b ? { type: 'beast', mob: b, name: D.MOBS[b].name, hp: null } : null; }
  return P;
}
const fresh = (P) => { P.hp = null; P.res = null; P.cds = {}; P.ghostUntil = 0; if (P.pet) P.pet.hp = null; };
// one fight against the first alive creature the test picks; waits (game time) for a respawn when none is up
function fightOne(P, want) {
  fresh(P);
  let m = null; for (let w = 0; w < 120 && !(m = G.placeMobs().find((x) => x.state === 'alive' && want(x))); w++) step(1);
  if (!m) return null;
  fresh(P); const notes0 = P.debtNotes || 0, C = G.engage(m.id); if (!C) return null;
  while (G.fight === C && C.t < 600) { if (G.pUnit && G.pUnit.kind === 'player') { G.pUnit.kind = 'bot'; G.pUnit.bot = { skill: 0.8, react: 0.4 }; G.pUnit.role = 'dps'; } step(0.1); }
  const win = C.over === 'win', coll = C.enemies.filter((e) => D.MOBS[e.key].collector).length;
  return { win, t: C.t, lvl: m.level, key: m.key, enemies: C.enemies.length, coll: win ? coll : 0, notes: (P.debtNotes || 0) - notes0 };
}
const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[s.length >> 1] : NaN; };
function sum(rows) { const w = rows.filter((r) => r.win), coll = w.reduce((a, r) => a + r.coll, 0), notes = rows.reduce((a, r) => a + r.notes, 0);
  return { n: rows.length, kill: med(w.map((r) => r.t)), deaths: (rows.length - w.length) / rows.length * 100, npk: coll ? notes / coll : notes ? Infinity : 0, notes, adds: rows.filter((r) => r.enemies > 1).length, lv: [Math.min(...rows.map((r) => r.lvl)), Math.max(...rows.map((r) => r.lvl))] }; }
if (!process.env.EDGE) {
  const out = [];
  console.log(`Debt collectors (#522) · ${CLASSES.length} classes · seeds ${SEEDS.join(',')} · ${N} fights of each kind a seed · skill 0.8, bot gear`);
  console.log('level class   place (lvl) | collector: name, kill s, deaths/100, notes/kill, lv | normal: kill s, deaths/100, notes | ratio');
  for (const L of LEVELS) {
    const place = placeFor(L);
    for (const cls of CLASSES) {
      const col = [], nor = []; let names = new Set();
      for (const sd of SEEDS) {
        seed(sd * 1000 + L); const P = setup(cls, L, place);
        for (let i = 0; i < N; i++) { const r = fightOne(P, (x) => D.MOBS[x.key].collector); if (r) { col.push(r); names.add(D.MOBS[r.key].name); } }
        for (let i = 0; i < N; i++) { const r = fightOne(P, (x) => normal(x.key)); if (r) nor.push(r); }
      }
      const a = sum(col), b = sum(nor), ratio = a.kill / b.kill, flag = ratio > 1.6 || a.deaths > b.deaths ? ' FLAG' : '';
      out.push({ L, cls, place, names: [...names], col: a, nor: b, ratio });
      console.log(`${String(L).padStart(2)} ${cls.padEnd(8)} ${place} (${D.PLACES[place].lvl}) | ${[...names].join('/')}, ${a.kill.toFixed(1)}, ${a.deaths.toFixed(0)}, ${a.npk.toFixed(2)}, ${a.lv.join('-')} [${a.n} fights, ${a.adds} with an add] | ${b.kill.toFixed(1)}, ${b.deaths.toFixed(0)}, ${b.notes}, ${b.lv.join('-')} [${b.n}, ${b.adds} adds] | ${ratio.toFixed(2)}${flag}`);
    }
  }
  if (process.env.JSON) console.log(JSON.stringify(out));
} else {
  const ok = (c, s) => console.log(`${c ? 'PASS' : 'FAIL'} ${s}`);
  // notes by level gap: the kill hook the fight end calls (G.collectorKill), and one real fight per gap
  for (const gap of [0, 4, 5, 10]) {
    seed(gap); const L = 30 + gap, P = setup('warrior', L, placeFor(30));
    const got = G.collectorKill('ledger_collector', 30);
    const W = G.placeMobs().filter((x) => D.MOBS[x.key].collector); W.forEach((x) => { x.level = 30; });
    const r = fightOne(P, (x) => D.MOBS[x.key].collector && x.level === 30);
    ok(gap < 5 ? got === 1 && r && r.notes === r.coll && r.coll > 0 : got === 0 && r && r.notes === 0 && r.win, `player ${L} vs collector 30 (gap ${gap}): hook gives ${got}, a won fight gave ${r && r.notes} note(s) for ${r && r.coll} collector(s)`);
  }
  seed(7); let P = setup('warrior', 20, placeFor(20)); const nr = []; for (let i = 0; i < 5; i++) nr.push(fightOne(P, (x) => normal(x.key)));
  ok(nr.every((r) => r && r.notes === 0), `normal creatures give no note: ${nr.map((r) => r && r.notes).join(',')} over ${nr.length} fights`);
  // places: every place the world builds, by kind
  const kinds = { safe: [], city: [], gate: [], noMobs: [], levelling: [] }; let bad = [];
  for (const k of Object.keys(D.PLACES)) {
    const p = D.PLACES[k]; if (!p.pool && !p.named) continue;
    G.S.player.place = k; const ev = G.placeMobs().filter((x) => D.MOBS[x.key].collector);
    const kind = p.safe ? 'safe' : p.city ? 'city' : p.gate ? 'gate' : !(p.mobs || []).length || !p.lvl ? 'noMobs' : 'levelling'; kinds[kind].push([k, ev]);
    const want = kind === 'levelling' && p.pool ? D.PREPATCH.collectors : 0, nameOk = ev.every((x) => x.key === (p.lvl[0] >= 30 ? 'ledger_collector' : 'debt_collector') && x.level >= p.lvl[0] && x.level <= p.lvl[1]);
    if (ev.length !== want || !nameOk) bad.push(`${k}(${kind}, ${ev.length})`);
  }
  const towns = [...kinds.safe, ...kinds.city, ...kinds.gate];
  ok(towns.every(([, ev]) => !ev.length), `safe/city/gated places with creature lists: ${towns.length}, with collectors: ${towns.filter(([, ev]) => ev.length).length}`);
  ok(!bad.length, `levelling places: ${kinds.levelling.length}, each with ${D.PREPATCH.collectors} collectors at its own level and the right name; wrong: ${bad.slice(0, 8).join(' ') || 'none'}`);
  const lv = kinds.levelling.filter(([k]) => D.PLACES[k].lvl[0] < 30 && D.PLACES[k].lvl[1] >= 30).map(([k, ev]) => `${k} ${D.PLACES[k].lvl} ${ev.map((x) => D.MOBS[x.key].name + ' ' + x.level).join(', ')}`);
  console.log(`  places straddling 30 (named by their lowest level): ${lv.join(' | ') || 'none'}`);
  D.PREPATCH.live = false; G.newGame({ name: 'O', cls: 'mage', race: 'human' }); G.S.player.place = placeFor(10) || 'forests_edge';
  const off = Object.keys(D.PLACES).filter((k) => { G.S.player.place = k; return (D.PLACES[k].pool || D.PLACES[k].named) && G.placeMobs().some((x) => D.MOBS[x.key].collector); });
  ok(!off.length, `D.PREPATCH.live = false: places with collectors ${off.length}`);
}
