// Solo levelling pace by class (issue #4): XP per hour through the game's real solo loop (attack the nearest monster at a
// wild place of your level, rest on food and drink from below 60% health or 35% mana back to 95% / 90%, pets, extra pulls, deaths and the run
// back), a skilled player (bot skill 0.8), gear and talents for the level. The level is held fixed so every hour is at
// the same level, with about 2 sec between pulls (loot, tap the next). Normal monsters only: a player levels on those, not
// on the rare. Target (game designer, #4): every class within ±20% of the class average at 10, 25, 40 and 55, and at most 2 deaths an hour.
//   node sim/lvpace.js [hours per class and level, default 4] [levels, default 10,25,40,55]
// SEED=n runs another fixed seed (default 0x5eed1e55, the numbers posted on #4), so a spread across seeds can be measured.
{ let s = (process.env.SEED ? (0x5eed1e55 ^ Math.imul(+process.env.SEED, 0x9E3779B1)) : 0x5eed1e55) >>> 0; Math.random = () => { s = (s + 0x6D2B79F5) >>> 0; let x = s; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
const ROOT = process.env.ROOT || require('path').join(__dirname, '..'); // ROOT=~/azeroth-solo-measure runs this sim against the measuring copy
for (const f of ['data', 'engine', 'bots', 'game']) require(ROOT + '/src/' + f + '.js');
const { G, D } = globalThis;
const RealDate = Date; let t = new RealDate(2026, 9, 7, 19).getTime();
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(t); } static now() { return t; } };
if (process.env.DRINK) G.DRINK_SECS = +process.env.DRINK; // #4 levers, to compare: a drink's seconds, the solo self-heal line
if (process.env.HEALAT) globalThis.E.SOLO_HEAL_AT = +process.env.HEALAT;
if (process.env.PETDMG) globalThis.E.SOLO_PET_DMG = +process.env.PETDMG; // the Hunter's beast alone against monsters
// Pack pulls (#139, not in the game yet): PACK=1 lets a class that knows an area attack (a damaging 'aoe' ability) pull a
// pack of the creature it attacks: 2 below level 20, 3 from 20, 4 from 40 (PACKS=2,3,4 sets them), as many as are alive
// there, fought in the game's 'spread' kill order (area attacks from 2 enemies, as a player who pulled the group to use
// them); PACKAI=focus keeps the usual order (area attacks from 3). Other classes pull one as now. KILLS=creatures counts
// every creature killed (a fight with a social pull is 2 kills) instead of one a fight; deaths a kill follow it. FIGHTS=1
// adds each class's fights by size (creatures in it at any point) and the deaths in them.
const PACK = !!process.env.PACK, PACKS = (process.env.PACKS || '2,3,4').split(',').map(Number), PACKAI = process.env.PACKAI || 'spread', KILLC = process.env.KILLS === 'creatures', FIGHTS = !!process.env.FIGHTS;
const packSize = (cls, L) => (Object.values(D.ABILITIES).some((a) => a.cls === cls && a.target === 'aoe' && a.dmg && (a.lvl || 1) <= L) ? PACKS[L < 20 ? 0 : L < 40 ? 1 : 2] : 1);
const BAND = 20; // game designer, #4: within ±20% of the class average (was ±15%), at most 2 deaths an hour
const HOURS = +process.argv[2] || 4, LEVELS = (process.argv[3] || '10,25,40,55').split(',').map(Number);
const CLASSES = Object.keys(D.CLASSES).filter((c) => !D.CLASSES[c].hidden); // players can't make a hidden class (the Bard)
if (process.env.CLASSES) CLASSES.splice(0, CLASSES.length, ...process.env.CLASSES.split(',')); // e.g. CLASSES=priest for a candidate run of one class; its % then reads against that subset only
const step = (secs) => { G.update(secs); t += secs * 1000; };
// a wild place where this level fights: monsters around the level, no town
const normal = (k) => D.MOBS[k] && !D.MOBS[k].named && !D.MOBS[k].elite && !D.MOBS[k].boss;
const placeFor = (L) => Object.keys(D.PLACES).filter((k) => { const p = D.PLACES[k]; return p.lvl && !p.safe && !p.city && (p.mobs || []).length && p.mobs.every(([m]) => normal(m)) && p.lvl[0] <= L && p.lvl[1] >= L; }).sort((a, b) => Math.abs((D.PLACES[a].lvl[0] + D.PLACES[a].lvl[1]) / 2 - L) - Math.abs((D.PLACES[b].lvl[0] + D.PLACES[b].lvl[1]) / 2 - L))[0];
function hour(cls, L) {
  G.newGame({ name: 'L', cls, race: 'human' }); const S = G.S, P = S.player; S.flags.warModeAsked = true; S.flags.warMode = false; S.flags.noInvites = true;
  P.level = L; P.equip = G.botChar({ name: 'x', cls, race: 'human', level: L, skill: 0.8 }).equip; P.talents = G.autoTalents(cls, 'dps', L, 0); P.role = 'dps';
  P.place = placeFor(L); P.bagsEq = [0, 1, 2, 3].map(() => G.copyItem('woolen_bag')); P.hp = null; P.res = null;
  // the pet a levelling player has (#4): a Warlock's Voidwalker from level 10 (it tanks), a Hunter's tamed beast of its
  // level from 10; below that a Warlock's imp, and a Hunter none (#34: a new Hunter's imp is a bug)
  if (cls === 'warlock') P.pet = { type: L >= D.PETS.voidwalker.lvl ? 'voidwalker' : 'imp', name: 'Pet', hp: null };
  if (cls === 'hunter') { const b = L >= D.PETS.beast.lvl && Object.keys(D.MOBS).filter((k) => D.MOBS[k].family === 'beast' && !D.MOBS[k].named && !D.MOBS[k].elite && !D.MOBS[k].boss && D.MOBS[k].lvl[0] <= L).sort((a, c) => D.MOBS[c].lvl[0] - D.MOBS[a].lvl[0])[0]; P.pet = b ? { type: 'beast', mob: b, name: D.MOBS[b].name, hp: null } : null; }
  const food = Object.values(D.ITEMS).filter((i) => i.slot === 'food' && i.cost && (i.lvl || 1) <= L).sort((a, b) => (b.lvl || 1) - (a.lvl || 1))[0], drink = Object.values(D.ITEMS).filter((i) => i.slot === 'drink' && i.cost && (i.lvl || 1) <= L).sort((a, b) => (b.lvl || 1) - (a.lvl || 1))[0];
  let xp = 0, deaths = 0, kills = 0, resting = false, maxN = 0; const end = t + 3600e3, tm = { fight: 0, rest: 0, dead: 0, other: 0 }, size = {}, pack = PACK ? packSize(cls, L) : 1;
  while (t < end) {
    if (food && G.countItem(food.id) < 5) G.addItem(G.copyItem(food.id), 20); if (drink && G.countItem(drink.id) < 5) G.addItem(G.copyItem(drink.id), 20);
    if (P.ghostUntil) { tm.dead += 1; step(1); continue; }
    if (G.fight) { tm.fight += 0.1; if (G.pUnit && G.pUnit.kind === 'player') { G.pUnit.kind = 'bot'; G.pUnit.bot = { skill: 0.8, react: 0.4 }; G.pUnit.role = 'dps'; } const lv0 = P.level, x0 = P.xp, Cf = G.fight; maxN = Math.max(maxN, Cf.enemies.length); step(0.1); if (!G.fight) { const died = !!P.ghostUntil, dead = Cf.enemies.filter((e) => e.dead || e.hp <= 0).length; if (died) deaths++; if (KILLC) kills += dead; else if (!died) kills++; const z = size[maxN] = size[maxN] || { n: 0, d: 0 }; z.n++; if (died) z.d++; maxN = 0; xp += P.xp - x0; P.level = L; P.xp = 0; } continue; }
    // rest: start below 60% health or 35% mana, then eat and drink back up like a player (to 95% health, 90% mana), not
    // just over the line: pulling again at 35% mana ran casters dry mid-fight (#4)
    const v = G.vitals(), low = v.hp < v.maxHp * 0.6 || (v.resType === 'mana' && v.res < v.maxRes * 0.35);
    if (low) resting = true;
    if (resting && v.hp >= v.maxHp * 0.95 && (v.resType !== 'mana' || v.res >= v.maxRes * 0.9)) resting = false;
    if (resting) { tm.rest += 1;
      if (v.hp < v.maxHp * 0.95 && !(P.eating && P.eating.until > t)) G.consume('food');
      if (v.resType === 'mana' && v.res < v.maxRes * 0.9 && !(P.drinking && P.drinking.until > t)) G.consume('drink');
      step(1); continue;
    }
    const m = G.placeMobs().find((x) => x.state === 'alive' && normal(x.key)); if (!m) { tm.other += 1; step(1); continue; } // a player levels on normal monsters, not the rare
    tm.other += 2; step(2); if (G.fight) continue; // a player loots and taps the next one: about 2 sec between pulls
    G.engage(m.id); if (!G.fight) { step(1); continue; }
    if (pack > 1) { for (const o of G.placeMobs().filter((x) => x.state === 'alive' && x.key === m.key && x !== m).slice(0, pack - 1)) { o.state = 'fight'; const ou = globalThis.E.mobUnit(o.key, o.level); ou.inst = o; globalThis.E.addEnemy(G.fight, ou); } if (PACKAI === 'spread') G.fight.opts.killOrder = 'spread'; }
  }
  return { xp, deaths, kills, tm, size };
}
let bad = 0;
for (const L of LEVELS) {
  const rows = CLASSES.map((cls) => { let xp = 0, deaths = 0, kills = 0; const T = { fight: 0, rest: 0, dead: 0, other: 0 }; const Z = {}; for (let h = 0; h < HOURS; h++) { const r = hour(cls, L); xp += r.xp; deaths += r.deaths; kills += r.kills; for (const k in T) T[k] += r.tm[k]; for (const n in r.size) { const z = Z[n] = Z[n] || { n: 0, d: 0 }; z.n += r.size[n].n; z.d += r.size[n].d; } } return { cls, Z, xph: xp / HOURS, deaths: deaths / HOURS, kills: kills / HOURS, T }; });
  const avg = rows.reduce((a, r) => a + r.xph, 0) / rows.length;
  console.log(`level ${L} (${placeFor(L)}): class average ${Math.round(avg)} XP an hour`);
  for (const r of rows.sort((a, b) => b.xph - a.xph)) { const d = (r.xph / avg - 1) * 100, out = Math.abs(d) > BAND; if (out) bad++;
    const all = r.T.fight + r.T.rest + r.T.dead + r.T.other || 1, sh = (x) => `${Math.round((x / all) * 100)}%`;
    console.log(`  ${r.cls.padEnd(8)} ${String(Math.round(r.xph)).padStart(7)} XP/h ${d >= 0 ? '+' : ''}${d.toFixed(0)}%${out ? '  outside ±' + BAND + '%' : ''} · ${r.kills.toFixed(0)} kills, ${r.deaths.toFixed(1)} deaths an hour · ${(r.T.fight / Math.max(1, r.kills * HOURS)).toFixed(1)} s a kill · fight ${sh(r.T.fight)} rest ${sh(r.T.rest)} dead ${sh(r.T.dead)} between ${sh(r.T.other)}`);
    if (FIGHTS) console.log(`             fights by creatures in them: ${Object.keys(r.Z).sort().map((n) => `${n}: ${r.Z[n].n} (${r.Z[n].d} deaths)`).join(' · ')}${PACK ? ` · pack ${packSize(r.cls, L)}` : ''}`); }
}
console.log(bad ? `${bad} class-levels outside ±${BAND}% (a report for the game designer, not a gate yet)` : `every class within ±${BAND}%`);
