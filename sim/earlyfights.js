// Early fights (#119): how long a level 1-10 fight lasts and how much of the kit a class gets to use. Every class, alone,
// against a same-level normal creature of the starting regions (Elwynn, Dun Morogh, Teldrassil, Durotar, Mulgore,
// Tirisfal: one drawn at random from those whose level range covers the level), skill 0.8, gear the game gives a bot of
// that level, and the pet a player has then. Each fight starts at full health and resource.
// Per class and level: time to kill (median, 10th-90th percentile), distinct abilities used in a fight (the engine's
// 'ability' events; auto-attack isn't one), the share of fights that end before a 3rd distinct ability, resource spent,
// deaths. Target (game designer, #119): from level 4 a typical fight uses at least 3 abilities and lasts 8-15 s.
//   ROOT=~/azeroth-solo-measure node sim/earlyfights.js [fights per class and level, default 200]
require('./_seed.js'); // seeded: the same commit gives the same result; SEED=n picks other dice
const ROOT = process.env.ROOT || require('path').join(__dirname, '..');
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
const RealDate = Date; let t = new RealDate(2026, 9, 7, 19).getTime();
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(t); } static now() { return t; } };
for (const f of ['data', 'engine', 'bots', 'game']) require(ROOT + '/src/' + f + '.js');
const { G, D, E } = globalThis;
const N = +process.argv[2] || 200, CAP = 120, LEVELS = (process.env.LEVELS || '1,2,3,4,5,6,7,8,9,10').split(',').map(Number);
const CLASSES = Object.keys(D.CLASSES).filter((c) => !D.CLASSES[c].hidden);
const START = new Set(Object.values(D.RACES).map((r) => (D.PLACES[r.start] || {}).region).filter(Boolean));
const normal = (k) => D.MOBS[k] && !D.MOBS[k].named && !D.MOBS[k].elite && !D.MOBS[k].boss;
const foes = (L) => { const c = new Set(); for (const p of Object.values(D.PLACES)) if (START.has(p.region)) for (const [m] of p.mobs || []) if (normal(m) && D.MOBS[m].lvl[0] <= L && D.MOBS[m].lvl[1] >= L) c.add(m); return [...c]; };
const known = (cls, L) => Object.values(D.ABILITIES).filter((a) => a.cls === cls && (a.lvl || 1) <= L && !a.passive).length; // what the class has at that level (buffs included)
const pick = (a) => a[Math.floor(Math.random() * a.length)];
function player(cls, L) {
  G.newGame({ name: 'E', cls, race: 'human' }); const P = G.S.player; P.level = L; G.S.flags.warModeAsked = true;
  P.equip = G.botChar({ name: 'x', cls, race: 'human', level: L, skill: 0.8 }).equip; P.talents = G.autoTalents(cls, 'dps', L, 0); P.role = 'dps';
  // the pet a player has at this level (as sim/lvpace.js): a Warlock's imp, a Voidwalker from its level; a Hunter's beast from its level
  if (cls === 'warlock') P.pet = { type: D.PETS.voidwalker && L >= D.PETS.voidwalker.lvl ? 'voidwalker' : 'imp', name: 'Pet', hp: null };
  if (cls === 'hunter' && D.PETS.beast && L >= D.PETS.beast.lvl) { const b = Object.keys(D.MOBS).filter((k) => D.MOBS[k].family === 'beast' && normal(k) && D.MOBS[k].lvl[0] <= L).sort((a, c) => D.MOBS[c].lvl[0] - D.MOBS[a].lvl[0])[0]; if (b) P.pet = { type: 'beast', mob: b, name: D.MOBS[b].name, hp: null }; }
  P.hp = null; P.res = null; return P;
}
function fight(cls, L, foe) {
  const P = player(cls, L), pu = E.charUnit(P, 'ally', 'player', t); pu.kind = 'bot'; pu.bot = { skill: 0.8, react: 0.4 }; pu.role = 'dps';
  const allies = [pu], pet = G.petUnitFor ? G.petUnitFor(pu) : null; if (pet) allies.push(pet);
  const mu = E.mobUnit(foe, L), C = E.fight(allies, [mu], { soloUid: pu.uid, puller: pu });
  const used = new Set(); let third = null, spent = 0, last = pu.res, maxRes = pu.maxRes;
  while (!C.over && C.t < CAP) { E.tick(C, 0.1);
    for (const e of C.events) if (e.type === 'ability' && e.src === pu.uid && e.ab && !used.has(e.ab)) { used.add(e.ab); if (used.size === 3 && third == null) third = C.t; }
    C.events.length = 0; if (pu.res != null && last != null && pu.res < last) spent += last - pu.res; last = pu.res; }
  return { win: mu.hp <= 0, died: pu.hp <= 0, secs: C.t, abilities: used.size, before3: used.size < 3, spent, maxRes, resType: pu.resType };
}
const q = (a, f) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(f * (s.length - 1)))]; };
console.log(`early fights: ${N} a class and level, alone against a same-level normal creature of the starting regions; target from level 4: at least 3 abilities, 8-15 s`);
const rows = [];
for (const L of LEVELS) { const F = foes(L);
  for (const cls of CLASSES) { const R = []; for (let i = 0; i < N; i++) R.push(fight(cls, L, pick(F)));
    const won = R.filter((r) => r.win), secs = won.map((r) => r.secs), ab = R.map((r) => r.abilities);
    const row = { L, cls, ttk: q(secs, 0.5), p10: q(secs, 0.1), p90: q(secs, 0.9), ab: q(ab, 0.5), abMean: ab.reduce((a, b) => a + b, 0) / N, before3: R.filter((r) => r.before3).length / N, spent: R.reduce((a, r) => a + r.spent, 0) / N, maxRes: R[0].maxRes, resType: R[0].resType, deaths: R.filter((r) => r.died).length / N, foes: F.length, known: known(cls, L) };
    row.ok = L < 4 || (row.ab >= 3 && row.ttk >= 8 && row.ttk <= 15); rows.push(row);
    console.log(`L${String(L).padStart(2)} ${cls.padEnd(8)} knows ${row.known} · TTK ${row.ttk.toFixed(1)} s (${row.p10.toFixed(1)}-${row.p90.toFixed(1)}) · abilities median ${row.ab} (mean ${row.abMean.toFixed(1)}) · ended before a 3rd ${(row.before3 * 100).toFixed(0)}% · ${row.resType || 'no resource'} spent ${row.spent.toFixed(0)}${row.maxRes ? ' of ' + row.maxRes : ''} · deaths ${(row.deaths * 100).toFixed(1)}%${L >= 4 ? (row.ok ? '' : '  misses the target') : ''}`); } }
console.log('JSON ' + JSON.stringify(rows));
