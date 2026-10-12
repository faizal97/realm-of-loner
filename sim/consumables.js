// The modest edge (v10.9, Artisan; design docs/plans/2026-10-02-professions-design.md section 4): a full set of
// level-60 consumables (a flask, a Well Fed meal, a weapon stone; tanks an armour kit) makes a player about 5% stronger,
// never 20%. Raids, Trials and Hard modes stay tuned without them (their sims run with none).
// Every class at 60 in bot gear, 90-second fights against a training dummy that does not hit back; the same seeds with
// and without the set, so the difference is the consumables, not luck. Tanks: effective health against a level-60 hit.
//   node sim/consumables.js [fights per pass, default 24]
const seed = (n) => { let s = (0x5eed1e55 ^ n) >>> 0; Math.random = () => { s = (s + 0x6D2B79F5) >>> 0; let x = s; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; };
seed(0);
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
require('../src/data.js'); require('../src/engine.js'); require('../src/bots.js'); require('../src/game.js');
const { G, D, E } = globalThis;
let t = Date.now(); Date.now = () => t;
const N = +process.argv[2] || 80, SECS = 90; // 80: at 40 the Shaman (near the 1% floor) read 1.0% one build and 1.4% at 72
let fails = 0; const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL', msg); } };

// every elixir and flask, every Well Fed meal: the best of any tier, so an older item cannot slip past the edge
const FLASKS = Object.keys(D.ITEMS).filter((k) => D.ITEMS[k].slot === 'elixir');
const DISHES = Object.keys(D.ITEMS).filter((k) => D.ITEMS[k].wellFed);
const aura = (id, it, stats) => ({ id, name: it.name, icon: it.icon, stats: Object.assign({}, stats), until: t + 3600e3 });
function setUp(cls, set) {
  G.newGame({ name: 'C', cls, race: 'human' }); const P = G.S.player; P.level = 60; G.S.flags.warModeAsked = true;
  // a full set of level-60 blues in the class's armour (bot gear is only a few pieces, which would inflate every gain)
  seed(7); const wpn = G.botChar({ name: 'x', cls, race: 'human', level: 60, skill: 0.8 }).equip;
  P.equip = { weapon: wpn.weapon }; if (wpn.ranged) P.equip.ranged = wpn.ranged;
  for (const sl of D.GEAR_SLOTS) if (!P.equip[sl] && sl !== 'weapon' && sl !== 'ranged' && sl !== 'offhand') P.equip[sl] = G.genGear(sl, 60, 3, { atype: D.CLASSES[cls].armorType }); P.talents = G.autoTalents(cls, 'dps', 60, 0); P.role = 'dps';
  P.auras = [];
  if (set.flask) P.auras.push(aura('elixir', D.ITEMS[set.flask], D.ITEMS[set.flask].buff));
  if (set.dish) P.auras.push(aura('wellfed', D.ITEMS[set.dish], D.ITEMS[set.dish].wellFed));
  if (set.stone) P.auras.push(aura('sharpened', D.ITEMS.deepstone_whetstone, { wdmg: D.ITEMS.deepstone_whetstone.wdmg }));
  P.hp = null; P.res = null; return P;
}
// damage done by the player and its pet in SECS against a dummy that cannot hurt it
function damage(cls, set, fights) {
  let total = 0;
  for (let f = 0; f < fights; f++) {
    const P = setUp(cls, set); seed(1000 + f);
    const pu = E.charUnit(P, 'ally', 'player', t); pu.kind = 'bot'; pu.bot = { skill: 0.8, react: 0.4 }; pu.role = 'dps';
    const allies = [pu], pet = G.petUnitFor ? G.petUnitFor(pu) : null; if (pet) allies.push(pet);
    const dummy = E.mobUnit('risen_construct', 60, { hp: 80, dmg: 0 });
    const C = E.fight(allies, [dummy], { soloUid: pu.uid, puller: pu });
    const mine = new Set(allies.map((u) => u.uid));
    while (!C.over && C.t < SECS) { E.tick(C, 0.1); for (const e of C.events) if (e.type === 'dmg' && mine.has(e.src)) total += e.amount; C.events.length = 0; }
  }
  return total / fights;
}
// the set a player of the class would bring: the flask and meal for its main stat (the stat it gains most per level);
// a whetstone for those who fight with a melee weapon (not casters, not hunters)
const mainStat = (cls) => { const g = D.CLASSES[cls].gain || {}; return ['str', 'agi', 'int'].sort((a, b) => (g[b] || 0) - (g[a] || 0))[0]; };
const statOf = (it) => (it.buff || it.wellFed || {});
const pickFor = (keys, stat) => keys.slice().sort((a, b) => (statOf(D.ITEMS[b])[stat] || 0) - (statOf(D.ITEMS[a])[stat] || 0) || (Object.values(statOf(D.ITEMS[b])).reduce((x, y) => x + y, 0) - Object.values(statOf(D.ITEMS[a])).reduce((x, y) => x + y, 0)))[0];

const rows = [];
for (const cls of Object.keys(D.CLASSES)) {
  const st = mainStat(cls), flask = pickFor(FLASKS, st), dish = pickFor(DISHES, st), stone = st !== 'int' && cls !== 'hunter';
  const set = { flask, dish, stone };
  const without = damage(cls, {}, N), withSet = damage(cls, set, N), gain = (withSet / without - 1) * 100;
  rows.push({ cls, gain, set });
  console.log(`${cls.padEnd(8)} +${gain.toFixed(1)}% damage with ${D.ITEMS[flask].name}, ${D.ITEMS[dish].name}${stone ? ', a whetstone' : ''}`);
}
// tanks: effective health against a level-60 hit (health over the share armour lets through); a druid tanks in bear form
const ehp = (P) => { const u = E.charUnit(P, 'ally', 'player', t); if (P.cls === 'druid') { u.auras.push({ id: 'bear_form', bear: true, stats: {}, until: 1e9 }); E.recalc(u, true); } const arm = u.st.armor || 0, dr = Math.min(0.75, arm / (arm + 400 + 85 * 60)); return u.maxHp / (1 - dr); };
const kitUp = (P) => { for (const s of ['chest', 'legs', 'feet', 'hands']) if (P.equip[s]) { P.equip[s].armor = (P.equip[s].armor || 0) - (P.equip[s].kit || 0) + D.ITEMS.hardhide_armor_kit.kit; P.equip[s].kit = D.ITEMS.hardhide_armor_kit.kit; } return P; };
for (const cls of ['warrior', 'paladin', 'druid']) {
  const base = ehp(setUp(cls, {}));
  let top = null; // the strongest elixir or flask and meal for this tank, by effective health itself
  for (const flask of FLASKS) for (const dish of DISHES) { const v = ehp(kitUp(setUp(cls, { flask, dish }))); if (!top || v > top.v) top = { v, flask, dish }; }
  const g = (top.v / base - 1) * 100; rows.push({ cls: cls + ' tank', gain: g, tank: true });
  console.log(`${(cls + ' tank').padEnd(13)} +${g.toFixed(1)}% effective health with ${D.ITEMS[top.flask].name}, ${D.ITEMS[top.dish].name} and armour kits`);
}
const dps = rows.filter((r) => !r.tank), avg = dps.reduce((a, r) => a + r.gain, 0) / dps.length;
console.log(`average damage gain ${avg.toFixed(1)}% (want 3-7%), highest ${Math.max(...dps.map((r) => r.gain)).toFixed(1)}%`);
ok(avg >= 3 && avg <= 7, `a full set of consumables gives 3-7% on average (${avg.toFixed(1)}%)`);
// damage: no class above 8%. Tanks: effective health no more than 18% (Faizal's call, 2026-10-02: survival, not damage,
// and it comes from Stamina items players already have; a druid's bear form multiplies the armour kits add, and a bear
// has less health for Stamina to add to, so druids sit highest)
for (const r of rows) ok(r.gain <= (r.tank ? 18 : 8), `${r.cls}: no more than ${r.tank ? 18 : 8}% (${r.gain.toFixed(1)}%)`);
for (const r of dps) ok(r.gain >= 1, `${r.cls}: the set does something (${r.gain.toFixed(1)}%)`);
console.log(fails ? `${fails} failures` : 'consumables sim OK');
process.exit(fails ? 1 : 0);
