// Lanternwake pacing (v10.13, #225): how long the daily candle cap takes, and how much of the vendor each kind of player
// finishes in the 14 days. Targets (docs/plans/2026-10-11-lanternwake-design.md): the cap in about 40 minutes of normal
// play at levels 10, 30 and 60; the vendor in about 10 days for a player who plays every day.
// Part 1 plays the game's real solo loop (sim/lvpace.js's: attack the nearest normal monster at a place of the level,
// rest on food and drink, about 2 sec between pulls) with the festival on, and counts the candles the game gives,
// minute by minute, until the cap. A questing player also earns 4 a quest and 20 for Light the Way; this part counts kills
// only, so it is the slowest way to the cap a player who is fighting can take.
// Part 2 is the calendar: candles a day for each kind of player and the day each finishes the vendor.
//   node sim/lanternwake.js [levels, default 10,30,60] [classes, default warrior,mage,priest,hunter,rogue]
// SEED=n runs another fixed seed; ROOT=~/azeroth-solo-measure measures the measuring copy.
require('./_seed.js');
globalThis.localStorage = (() => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; })();
const ROOT = process.env.ROOT || require('path').join(__dirname, '..');
for (const f of ['data', 'engine', 'bots', 'game']) require(ROOT + '/src/' + f + '.js');
const { G, D } = globalThis;
const RealDate = Date; let t = new RealDate(2026, 9, 28, 19).getTime(); // a Wednesday evening, during the festival
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(t); } static now() { return t; } };
const LEVELS = (process.argv[2] || '10,30,60').split(',').map(Number), CLASSES = (process.argv[3] || 'warrior,mage,priest,hunter,rogue').split(',');
const Ev = D.EVENTS.lanternwake, step = (secs) => { G.update(secs); t += secs * 1000; };
const normal = (k) => D.MOBS[k] && !D.MOBS[k].named && !D.MOBS[k].elite && !D.MOBS[k].boss;
const placeFor = (L) => Object.keys(D.PLACES).filter((k) => { const p = D.PLACES[k]; return p.lvl && !p.safe && !p.city && (p.mobs || []).length && p.mobs.every(([m]) => normal(m)) && p.lvl[0] <= L && p.lvl[1] >= L; })
  .sort((a, b) => Math.abs((D.PLACES[a].lvl[0] + D.PLACES[a].lvl[1]) / 2 - L) - Math.abs((D.PLACES[b].lvl[0] + D.PLACES[b].lvl[1]) / 2 - L))[0];
// minutes of solo play to the daily cap (stops at 120)
function toCap(cls, L) {
  G.newGame({ name: 'L', cls, race: 'human' }); const S = G.S, P = S.player; S.flags.warModeAsked = true; S.flags.noInvites = true;
  P.level = L; P.equip = G.botChar({ name: 'x', cls, race: 'human', level: L, skill: 0.8 }).equip; P.talents = G.autoTalents(cls, 'dps', L, 0); P.role = 'dps';
  P.place = placeFor(L); P.bagsEq = [0, 1, 2, 3].map(() => G.copyItem('woolen_bag')); P.hp = null; P.res = null;
  if (cls === 'warlock') P.pet = { type: L >= D.PETS.voidwalker.lvl ? 'voidwalker' : 'imp', name: 'Pet', hp: null };
  const food = Object.values(D.ITEMS).filter((i) => i.slot === 'food' && i.cost && (i.lvl || 1) <= L).sort((a, b) => (b.lvl || 1) - (a.lvl || 1))[0], drink = Object.values(D.ITEMS).filter((i) => i.slot === 'drink' && i.cost && (i.lvl || 1) <= L).sort((a, b) => (b.lvl || 1) - (a.lvl || 1))[0];
  const t0 = t, end = t + 120 * 60e3; let resting = false;
  while (t < end && (G.lw() || {}).today < Ev.cap) {
    if (food && G.countItem(food.id) < 5) G.addItem(G.copyItem(food.id), 20); if (drink && G.countItem(drink.id) < 5) G.addItem(G.copyItem(drink.id), 20);
    if (P.ghostUntil) { step(1); continue; }
    if (G.fight) { if (G.pUnit && G.pUnit.kind === 'player') { G.pUnit.kind = 'bot'; G.pUnit.bot = { skill: 0.8, react: 0.4 }; G.pUnit.role = 'dps'; } step(0.1); continue; }
    const v = G.vitals(), low = v.hp < v.maxHp * 0.6 || (v.resType === 'mana' && v.res < v.maxRes * 0.35);
    if (low) resting = true;
    if (resting && v.hp >= v.maxHp * 0.95 && (v.resType !== 'mana' || v.res >= v.maxRes * 0.9)) resting = false;
    if (resting) { if (v.hp < v.maxHp * 0.95 && !(P.eating && P.eating.until > t)) G.consume('food'); if (v.resType === 'mana' && v.res < v.maxRes * 0.9 && !(P.drinking && P.drinking.until > t)) G.consume('drink'); step(1); continue; }
    const m = G.placeMobs().find((x) => x.state === 'alive' && normal(x.key)); if (!m) { step(1); continue; }
    step(2); if (G.fight) continue;
    G.engage(m.id); if (!G.fight) step(1);
  }
  const mins = (t - t0) / 60e3, got = (G.lw() || {}).today || 0;
  return { mins, got };
}
console.log(`Lanternwake pacing · cap ${Ev.cap} candles a day · kill ${Ev.earn.kill}, elite ${Ev.earn.elite}, quest ${Ev.earn.quest}, dungeon boss ${Ev.earn.boss}, Light the Way ${Ev.earn.light}, the Knight ${Ev.earn.daily}`);
console.log('\nPart 1: minutes of solo killing to the daily cap (kills only; skill 0.8, gear for the level)');
const all = [];
for (const L of LEVELS) {
  const rows = CLASSES.map((cls) => Object.assign({ cls }, toCap(cls, L)));
  const ms = rows.map((r) => r.mins), mean = ms.reduce((a, b) => a + b, 0) / ms.length; all.push(...ms);
  console.log(`  level ${String(L).padStart(2)} (${placeFor(L)}): mean ${mean.toFixed(0)} min, spread ${Math.min(...ms).toFixed(0)}–${Math.max(...ms).toFixed(0)} · ` + rows.map((r) => `${r.cls} ${r.mins.toFixed(0)}${r.got < Ev.cap ? ` (only ${r.got})` : ''}`).join(', '));
}
console.log(`  all: mean ${(all.reduce((a, b) => a + b, 0) / all.length).toFixed(0)} min (target about 40)`);
// Part 2: the 14 days. A player who plays a day reaches the cap (the Knight's daily 20 is inside it); the vendor's
// looks, Flicker and the title cost what the data says
const vendor = Ev.shop.filter((s) => s.kind !== 'use').reduce((a, s) => a + s.cost, 0), days = 14;
console.log(`\nPart 2: the vendor (${vendor} candles: looks, Flicker, the title) over ${days} days`);
for (const [name, every] of [['every day', 1], ['every other day', 2], ['three days a week', 7 / 3], ['once a week', 7]]) {
  const played = Math.floor(days / every + 1e-9), have = played * Ev.cap, day = Math.ceil(vendor / Ev.cap * every);
  console.log(`  ${name.padEnd(18)} ${String(played).padStart(2)} days played · ${String(have).padStart(4)} candles · ${have >= vendor ? `vendor done on day ${day}` : `${Math.round(have / vendor * 100)}% of the vendor`}`);
}
console.log(`  the Wickless Steed: by the ${Ev.steedAt}th daily kill at the latest (1 in ${Math.round(1 / Ev.steedChance)} each): a daily player has it by day ${Ev.steedAt}; ${Math.round((1 - Math.pow(1 - Ev.steedChance, 5)) * 100)}% have it by day 5`);
