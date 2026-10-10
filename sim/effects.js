// Item effects (v10.10, design docs/plans/2026-10-02-item-effects-design.md §4): each effect item against a plain item for
// the same slot, level and quality (the plain one keeps the stats the effect paid for), at levels 20, 40 and 60, in a case
// where it should win and one where it should lose. Both variants fight on the same seeds, so the difference is the
// effect. Pass bars, written first (design mindset §5): wins >= +2% in a wins case, loses <= -2% in a loses case, at most
// +8% in its best case, and the best mix of different effects in one case at most +10% over plain gear.
//   node sim/effects.js [fights per case, default 200]
// Two stages (game designer, #45): every bar runs on one seed; a bar within NEAR (1) point of its line runs its cells again
// on SEEDS and is judged on the worst (or best) cell's mean, since one seed's wobble (up to about 0.9 points, the analyst on #45) is larger than that.
// Those reruns print to stderr, so the build log shows which bars went to 5 seeds and their means.
let seedS = 0; let SEED = +process.env.SEED || 0; const seed = (n) => { seedS = (0x5eed1e55 ^ Math.imul(n + 1 + SEED * 100003, 0x9E3779B1)) >>> 0; }; // SEED=n: another fixed seed, to measure a bar's wobble (unset: the build's)
Math.random = () => { seedS = (seedS + 0x6D2B79F5) >>> 0; let x = seedS; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
seed(0);
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
require('../src/data.js'); require('../src/engine.js'); require('../src/bots.js'); require('../src/game.js');
const { G, D, E } = globalThis;
const N = +process.argv[2] || 200;
G.BOT_FX.at60 = 0; // the test pieces are the only effects here: no bot wears one of its own (#56)
if (process.env.FXGROW) D.FX_GROW = +process.env.FXGROW; // try the upgrade curve (#37)
if (process.env.TUNE) { const T = JSON.parse(process.env.TUNE); for (const k in T) Object.assign(D.EFFECTS[k], T[k]); } // try numbers without editing the data
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('FAIL ' + m); } };
const pct = (a, b) => (b ? (a / b - 1) * 100 : 0);

// a test piece at level L in the effect's shape: plain (the full budget) or with the effect (it pays its effect's cost)
const SHAPE = {
  opening_cut: { slot: 'hands', atype: 'leather', st: ['agi', 'str'] }, kindled_edge: { slot: 'hands', atype: 'leather', st: ['agi', 'str'] },
  chase_the_next: { slot: 'feet', atype: 'leather', st: ['agi', 'str'] }, steady_fuse: { slot: 'wrist', atype: 'leather', st: 'main' },
  glass_heart: { slot: 'finger', st: 'main' },
  echoing_mend: { slot: 'chest', atype: 'cloth', st: ['int', 'spi'] }, lavish_mend: { slot: 'legs', atype: 'cloth', st: ['sp', 'int'] }, tethered_mend: { slot: 'hands', atype: 'cloth', st: ['sp', 'int'] },
  turning_guard: { slot: 'waist', atype: 'mail', st: ['sta', 'str'] }, spiteful_hide: { slot: 'chest', atype: 'mail', st: ['sta', 'str'] },
  stubborn_blood: { slot: 'finger', st: ['agi', 'str'] }, tithe_of_battle: { slot: 'back', st: 'main' },
};
// 'main': the stats the testing class uses, so the effect's cost is what that class really gives up
const MAIN = (cls) => (['mage', 'warlock', 'priest', 'druid', 'shaman', 'bard'].includes(cls) ? ['int', 'sp'] : ['agi', 'str']);
let curCls = null;
let UPG = 1; // the upgrade stage being tested: 1 as dropped, FULL at the ceiling (#37)
function piece(effect, L, withFx) {
  const P0 = SHAPE[effect], P = P0.st === 'main' ? Object.assign({}, P0, { st: MAIN(curCls) }) : P0, full = Math.round(L * 0.55 + 2) + 4, budget = withFx ? Math.round(full * (1 - D.effectCost(effect))) : full; // a dungeon blue's budget
  const stats = {}; let left = budget; P.st.forEach((k, i) => { const v = i === P.st.length - 1 ? left : Math.round(budget / P.st.length); stats[k] = v; left -= v; });
  const armor = P.slot === 'finger' || P.slot === 'back' ? (P.slot === 'back' ? Math.round(3 * 0.3 * (L + 2) * 0.9 * 1.22) : 0) : Math.round((D.SLOT_ARMOR[P.slot] || 3) * (P.atype ? D.GEAR_BASES[P.atype].arm : 0.3) * (L + 2) * 0.9 * 1.22);
  if (UPG !== 1) { for (const k in stats) stats[k] = Math.round(stats[k] * UPG); } // an upgraded pair (#37): both pieces' stats grow, and the effect with them
  return { id: effect + (withFx ? '_fx' : '_plain'), name: 'Test', slot: P.slot, atype: P.atype, q: 3, lvl: L, stats, armor: Math.round(armor * UPG), effect: withFx ? effect : undefined, fxScale: withFx && UPG !== 1 ? UPG : undefined };
}
function unit(cls, role, L, pieces, i) {
  seed(7000 + i); const c = G.botChar({ name: cls + i, cls, race: 'human', level: L, skill: 0.8, role }); c.role = role;
  for (const it of pieces) c.equip[it.slot] = it; c.hp = null; c.res = null;
  const u = E.charUnit(c, 'ally', 'bot', 0); u.bot = { skill: 0.8, react: 0.4, healOnly: role === 'healer' && pieces.length > 0 }; u.role = role; return u; // the healer wearing the item being measured only heals (game designer, #37: the healer test cases measure healing, not spare-mana damage); a support healer in another case plays as usual
}
const mob = (key, L, mult) => E.mobUnit(key, L, mult);
let lastC = null; const run = (C, secs) => { lastC = C; while (!C.over && C.t < secs) { E.tick(C, 0.1); C.events.length = 0; } return C; };

// the hard healing fight's damage, searched so the plain item holds 7 in 10 (on its own seeds, not the measured ones)
const HARD = {}, HOLD = 0.7;
function hardDmg(cls, L) {
  const k = cls + L; if (HARD[k] != null) return HARD[k]; // searched once, as dropped: at full upgrade it's the same fight with better gear (#37)
  const U0 = UPG; UPG = 1;
  let lo = 0.2, hi = 4; HARD[k] = 1;
  // on the same fights the bars measure (40 other seeds steered it to 7 in 10 there and 8 in 10 here: survival flips
  // sharply with damage), so "the plain item holds 7 in 10" is true of the fights that count (#37)
  for (let step = 0; step < 10; step++) { const m = (lo + hi) / 2; HARD[k] = m; let held = 0; curCls = cls;
    for (let i = 0; i < N; i++) held += CASES.hardheal({ cls, pieces: [piece('lavish_mend', L, false)] }, L, i);
    if (held / N > HOLD) lo = m; else hi = m; }
  UPG = U0; HARD[k] = (lo + hi) / 2; if (process.env.DBG) console.log('hardDmg', k, HARD[k].toFixed(2)); return HARD[k];
}
// cases scored in points of a rate (1 won / 0 lost), not in % of the plain item; and cases where dying is what they measure
const POINTS = { hardheal: true }, DEATH_IS_THE_MEASURE = { meleeboss: true, casterboss: true, solo: true, hardheal: true };
// the cases: each returns one number per fight, higher is better
const CASES = {
  // damage: a pack of three normal monsters (damage per second until they die) / a long boss (damage in 3 min, it hits nothing)
  trash: (fx, L, i) => { const me = unit(fx.cls, 'dps', L, fx.pieces, i); seed(i); const C = E.fight([me], [0, 1, 2].map(() => mob('defias_thug', L, { hp: 1.4, dmg: 0.35 })), { puller: me }); run(C, 120); const d = (C.tot && C.tot[me.uid] || {}).dmg || 0; return d / Math.max(1, C.t); },
  boss: (fx, L, i) => { const me = unit(fx.cls, 'dps', L, fx.pieces, i); seed(i); const C = E.fight([me], [mob('defias_thug', L, { hp: 60, dmg: 0 })], { puller: me }); run(C, 180); return (C.tot && C.tot[me.uid] || {}).dmg || 0; },
  // healing: group-wide damage (a boss whose blast hits everyone) / damage on the tank only; healing done in 2 min
  // (a long fight with more damage than the healer's mana can cover: healing done is healing per mana)
  groupwide: (fx, L, i) => { const h = unit(fx.cls, 'healer', L, fx.pieces, i), t = unit('warrior', 'tank', L, [], i + 1), d1 = unit('rogue', 'dps', L, [], i + 2), d2 = unit('mage', 'dps', L, [], i + 3); seed(i); const C = E.fight([t, h, d1, d2], [mob('garr', L, { hp: 200, dmg: 1.6 })], { puller: t }); run(C, 240); return (C.tot && C.tot[h.uid] || {}).heal || 0; },
  // a busy healer who holds the tank: with no effects the tank never dies (at 4 he died in nearly every fight, so the
  // case measured a wipe; #22)
  tankonly: (fx, L, i) => { const h = unit(fx.cls, 'healer', L, fx.pieces, i), t = unit('warrior', 'tank', L, [], i + 1), d1 = unit('rogue', 'dps', L, [], i + 2), d2 = unit('mage', 'dps', L, [], i + 3); seed(i); const C = E.fight([t, h, d1, d2], [mob('defias_thug', L, { hp: 200, dmg: L <= 25 ? 1.5 : 2.2 })], { puller: t }); run(C, 240); return (C.tot && C.tot[h.uid] || {}).heal || 0; },
  // tanking: how long a tank lasts alone against a melee boss / a caster boss
  meleeboss: (fx, L, i) => { const t = unit(fx.cls, 'tank', L, fx.pieces, i); seed(i); const C = E.fight([t], [mob('defias_thug', L, { hp: 200, dmg: 2.2 })], { puller: t }); run(C, 300); return C.t; },
  casterboss: (fx, L, i) => { const t = unit(fx.cls, 'tank', L, fx.pieces, i); seed(i); const C = E.fight([t], [mob('frostmane_seer', L, { hp: 200, dmg: 2.2 })], { puller: t }); run(C, 300); return C.t; },
  // survival: solo against a tough pull (1 won, 0 lost) / damage done in a well-healed group
  // (solo: how long you last in a pull you can't win, the bad pull that a survival effect is for)
  solo: (fx, L, i) => { const me = unit(fx.cls, 'dps', L, fx.pieces, i); seed(i); const C = E.fight([me], [mob('defias_thug', L + 1, { hp: 50, dmg: 1.4 }), mob('defias_thug', L, { hp: 50, dmg: 1.4 })], { puller: me }); run(C, 240); return C.t; },
  healed: (fx, L, i) => { const me = unit(fx.cls, 'dps', L, fx.pieces, i), t = unit('warrior', 'tank', L, [], i + 1), h = unit('priest', 'healer', L, [], i + 2); seed(i); const C = E.fight([t, me, h], [mob('garr', L, { hp: 30, dmg: 0.5 })], { puller: t }); run(C, 120); return (C.tot && C.tot[me.uid] || {}).dmg || 0; },

  // more cases for part 2 (#22)
  shorttrash: (fx, L, i) => { const me = unit(fx.cls, 'dps', L, fx.pieces, i); seed(i); const C = E.fight([me], [0, 1, 2].map(() => mob('defias_thug', L, { hp: 0.7, dmg: 0.35 })), { puller: me }); run(C, 120); const d = (C.tot && C.tot[me.uid] || {}).dmg || 0; return d / Math.max(1, C.t); }, // monsters that die before a burn finishes
  highcrit: (fx, L, i) => { const me = unit(fx.cls, 'dps', L, fx.pieces, i); me.auras.push({ id: 'test_crit', stats: { critPct: 25 }, until: 1e9 }); E.recalc(me, true); seed(i); const C = E.fight([me], [mob('defias_thug', L, { hp: 60, dmg: 0 })], { puller: me }); run(C, 180); return (C.tot && C.tot[me.uid] || {}).dmg || 0; }, // a build that crits often
  // a pack the tank holds alone (at 0.5 a level-20 or 40 Paladin died in every fight, and at 0.3 still 15 in 40; #22, #4)
  tankpack: (fx, L, i) => { const t = unit(fx.cls, 'tank', L, fx.pieces, i); seed(i); const C = E.fight([t], [0, 1, 2].map(() => mob('defias_thug', L, { hp: 4, dmg: 0.25 })), { puller: t }); run(C, 90); return (C.tot && C.tot[t.uid] || {}).dmg || 0; },
  // a hard fight the plain item holds about 7 times in 10 (the boss's damage is searched for each class and level, so it
  // stays true whatever the balance does; #22): 1 if the tank is alive after 2 min, else 0 (scored in points, not %)
  hardheal: (fx, L, i) => { const h = unit(fx.cls, 'healer', L, fx.pieces, i), t = unit('warrior', 'tank', L, [], i + 1); seed(i); const C = E.fight([t, h], [mob('hogger', L, { hp: 200, dmg: hardDmg(fx.cls, L) })], { puller: t }); run(C, 120); return t.hp > 0 ? 1 : 0; },
  shortheal: (fx, L, i) => { const h = unit(fx.cls, 'healer', L, fx.pieces, i), t = unit('warrior', 'tank', L, [], i + 1), d1 = unit('rogue', 'dps', L, [], i + 2); seed(i); const C = E.fight([t, h, d1], [mob('garr', L, { hp: 200, dmg: 1.6 })], { puller: t }); run(C, 60); return (C.tot && C.tot[h.uid] || {}).heal || 0; },
};
const PLAN = [
  { effect: 'opening_cut', classes: ['rogue', 'warrior'], wins: ['trash'], loses: ['boss'] },
  { effect: 'echoing_mend', classes: ['priest', 'druid'], wins: ['groupwide'], loses: ['tankonly'], provisional: '#40, judged on sim/capacity.js' }, // healing done can't judge a healer's item (#40): capacity does
  { effect: 'turning_guard', classes: ['warrior', 'paladin'], wins: ['meleeboss'], loses: ['casterboss'] },
  { effect: 'stubborn_blood', classes: ['warrior', 'rogue'], wins: ['solo'], loses: ['healed'] },
  { effect: 'kindled_edge', classes: ['rogue', 'warrior'], wins: ['boss'], loses: ['shorttrash'] },
  { effect: 'chase_the_next', classes: ['rogue', 'warrior'], wins: ['trash'], loses: ['boss'] },
  { effect: 'steady_fuse', classes: ['mage', 'warrior'], wins: ['boss'], loses: ['highcrit'], loseBar: -1.75 }, // its own lose bar (game designer, #191): no cost passes both -2 and +2, and a sure crit on a timer barely loses where crits are already common
  { effect: 'glass_heart', classes: ['rogue', 'warrior'], wins: ['healed'], loses: ['solo'] },
  { effect: 'lavish_mend', classes: ['priest', 'druid'], wins: ['groupwide'], loses: ['tankonly'], provisional: '#40, judged on sim/capacity.js' }, // wins: survival, +5 to +15 points (game designer, #22),
  { effect: 'tethered_mend', classes: ['priest', 'druid'], wins: ['tankonly'], loses: ['groupwide'], provisional: '#40, judged on sim/capacity.js' },
  { effect: 'spiteful_hide', classes: ['warrior', 'paladin'], wins: ['tankpack'], loses: ['casterboss'] },
  { effect: 'tithe_of_battle', classes: ['warlock'], wins: ['boss'], loses: ['boss'], losesClasses: ['mage'] },
];
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
const SEEDS = [0, 1, 2, 3, 4], NEAR = process.env.NEAR ? +process.env.NEAR : 1; let stageNow = ''; // NEAR=x tries another window // the balance analyst's five seeds (#45)
// f measured on every seed in SEEDS, given its value on this run's seed: the mean
const onSeeds = (v0, f) => { const keep = SEED, vs = [v0]; for (const sd of SEEDS) if (sd !== keep) { SEED = sd; vs.push(f()); } SEED = keep; return vs.reduce((a, b) => a + b, 0) / vs.length; };
// a bar: met if v is at least (dir +1) or at most (dir -1) line; within NEAR of it, judged on recompute() instead
const gate = (bar, v, line, dir, recompute, msg) => {
  if (Math.abs(v - line) > NEAR) return bar(dir > 0 ? v >= line : v <= line, msg(v));
  const m = recompute(), met = dir > 0 ? m >= line : m <= line;
  console.error(`effects: ${stageNow}${msg(m)}: within ${NEAR} of the line on seed ${SEED} (${v.toFixed(2)}), so the mean of seeds ${SEEDS.join(', ')} is judged: ${m.toFixed(2)}, ${met ? 'met' : 'missed'}`);
  bar(met, `${msg(m)} [mean of ${SEEDS.length} seeds; seed ${SEED} gave ${v.toFixed(2)}]`);
};
const measure = (cs, cls, L, pieces) => { curCls = cls; let s = 0; for (let i = 0; i < N; i++) s += CASES[cs]({ cls, pieces }, L, i); return s / N; };
// the cases are what they say (game designer, #22): with the plain item, the tank (or the one player) dies in at most
// 1 fight in 10, except where dying is what a case measures (how long you last, or the hard fight above)
{
  const seen = new Set();
  for (const P of PLAN) { if (ONLY && !ONLY.includes(P.effect)) continue; for (const cs of P.wins.concat(P.loses)) for (const cls of P.classes.concat(P.losesClasses || [])) for (const L of [20, 40, 60]) {
    const key = cs + cls + L; if (DEATH_IS_THE_MEASURE[cs] || seen.has(key)) continue; seen.add(key);
    let died = 0; for (let i = 0; i < 40; i++) { curCls = cls; CASES[cs]({ cls, pieces: [piece(P.effect, L, false)] }, L, 60000 + i); if (lastC && lastC.allies[0].hp <= 0) died++; }
    ok(died <= 4, `the ${cs} case doesn't wipe: the plain item loses ${died} of 40 (${cls} ${L})`);
  } }
}
// every bar again at full upgrade (#37: a sidegrade must still be one once upgraded): the largest effect scale any
// level-60 effect item reaches at its ceiling, with both pieces' stats grown the same
const FULL = (() => { let m = 1; for (const id in D.ITEMS) { const it0 = D.ITEMS[id]; if (!it0.effect || (it0.lvl || 0) < D.UPGRADE.minLvl) continue; let x = G.copyItem(id), n = 0; while (G.upgradeInfo(x).room && n++ < 40) x = G.upgradedCopy(x, G.upgradeInfo(x).next); m = Math.max(m, Math.min(1.5, x.fxScale || 1)); } return Math.round(m * 100) / 100; })();
const okTop = ok;
for (const stage of [1, FULL]) {
  UPG = stage; const STAGE = stage === 1 ? '' : `[at full upgrade, x${stage}] `; stageNow = STAGE;
  console.log(stage === 1 ? '— as dropped —' : `— at full upgrade: stats and effect x${stage} —`);
  const ok = (c, m) => okTop(c, STAGE + m);
const all = [];
  for (const P of PLAN) {
    if (ONLY && !ONLY.includes(P.effect)) continue;
    const res = { wins: [], loses: [] };
    for (const kind of ['wins', 'loses']) for (const cs of P[kind]) for (const cls of (kind === 'loses' && P.losesClasses) || P.classes) for (const L of [20, 40, 60]) {
      curCls = cls; const plain = measure(cs, cls, L, [piece(P.effect, L, false)]); curCls = cls; const withFx = measure(cs, cls, L, [piece(P.effect, L, true)]), d = POINTS[cs] ? (withFx - plain) * 100 : pct(withFx, plain);
      if (POINTS[cs] && UPG === 1) ok(plain >= 0.6 && plain <= 0.8, `the ${cs} fight is hard: the plain item holds 6-8 in 10 (${cls} ${L}: ${(plain * 10).toFixed(1)} in 10)`);
      res[kind].push({ cs, cls, L, d, pts: !!POINTS[cs] }); all.push({ effect: P.effect, cs, cls, L, d });
    }
    const pc = res.wins.concat(res.loses).filter((x) => !x.pts), pp = res.wins.concat(res.loses).filter((x) => x.pts), unit = (x) => (x.pts ? ' points' : '%');
    const best = pc.length ? Math.max(...pc.map((x) => x.d)) : 0, win = Math.max(...res.wins.map((x) => x.d)), lose = Math.min(...res.loses.map((x) => x.d));
    console.log(`${D.EFFECTS[P.effect].name.padEnd(15)} wins ${res.wins.map((x) => `${x.cs} ${x.cls} ${x.L}: ${x.d >= 0 ? '+' : ''}${x.d.toFixed(1)}${unit(x)}`).join(', ')}`);
    console.log(`${''.padEnd(15)} loses ${res.loses.map((x) => `${x.cs} ${x.cls} ${x.L}: ${x.d >= 0 ? '+' : ''}${x.d.toFixed(1)}${unit(x)}`).join(', ')}`);
    if (D.EFFECTS[P.effect].review) { console.log(`${''.padEnd(15)} (under review by the game designer: reported, not gated)`); continue; }
    // an accepted exception (game designer, #37): healing effects measured by healing done can't show their trade with a
    // healer that only heals; they ship as they are until #40 measures them by capacity. Their misses print, not fail
    const bar = P.provisional ? (c, m) => { if (!c) console.log(`ACCEPTED (${P.provisional}, provisional) ${STAGE}${m}`); } : ok;
    // a cell's mean over SEEDS (measured once, shared by every bar that reruns it); a provisional bar never reruns, as it
    // doesn't gate
    const mean = (x) => (x.mean != null ? x.mean : (x.mean = onSeeds(x.d, () => { curCls = x.cls; const a = measure(x.cs, x.cls, x.L, [piece(P.effect, x.L, false)]); curCls = x.cls; const b = measure(x.cs, x.cls, x.L, [piece(P.effect, x.L, true)]); return x.pts ? (b - a) * 100 : pct(b, a); })));
    const g = P.provisional ? (v, line, dir, re, msg) => bar(dir > 0 ? v >= line : v <= line, msg(v)) : (v, line, dir, re, msg) => gate(bar, v, line, dir, re, msg);
    if (res.wins.some((x) => x.pts)) { const w = Math.max(...res.wins.map((x) => x.d)), p = Math.max(...pp.map((x) => x.d));
      g(w, 5, 1, () => Math.max(...res.wins.map(mean)), (v) => `${P.effect} wins somewhere: at least +5 points of survival in a wins case (best ${v.toFixed(1)})`);
      g(p, 15, -1, () => Math.max(...pp.map(mean)), (v) => `${P.effect} is not too strong: at most +15 points of survival (${v.toFixed(1)})`);
    } else g(win, 2, 1, () => Math.max(...res.wins.map(mean)), (v) => `${P.effect} wins somewhere: at least +2% in a wins case (best ${v.toFixed(1)}%)`);
    const loseBar = P.loseBar != null ? P.loseBar : -2; // -2 unless the plan gives the effect its own bar
    g(lose, loseBar, -1, () => Math.min(...res.loses.map(mean)), (v) => `${P.effect} loses somewhere: at least ${loseBar}% in a loses case (worst ${v.toFixed(1)}%)`);
    g(best, 8, -1, () => Math.max(...pc.map(mean)), (v) => `${P.effect} is not too strong: at most +8% in its best case (${v.toFixed(1)}%)`);
  }
  // the ceiling holds: different effects worn together in the case that suits them stay within +10% of plain gear
  const MIXES = [
    { name: 'Opening Cut + Stubborn Blood', cs: 'solo', cls: 'rogue', fx: ['opening_cut', 'stubborn_blood'] },
    { name: 'Opening Cut + Chase the Next + Glass Heart', cs: 'trash', cls: 'rogue', fx: ['opening_cut', 'chase_the_next', 'glass_heart'] },
    { name: 'Kindled Edge + Steady Fuse + Glass Heart', cs: 'boss', cls: 'warrior', fx: ['kindled_edge', 'steady_fuse', 'glass_heart'] },
    { name: 'Echoing Mend + Lavish Mend + Tethered Mend', cs: 'groupwide', cls: 'priest', fx: ['echoing_mend', 'lavish_mend', 'tethered_mend'] },
  ];
  for (const M of MIXES) {
    if (ONLY && !M.fx.some((k) => ONLY.includes(k))) continue;
    if (M.fx.some((k) => D.EFFECTS[k].review)) continue; // a mix with an effect under review waits for it
    for (const L of [20, 40, 60]) {
      curCls = M.cls; const plain = measure(M.cs, M.cls, L, M.fx.map((k) => piece(k, L, false))); curCls = M.cls; const mixed = measure(M.cs, M.cls, L, M.fx.map((k) => piece(k, L, true))), d = pct(mixed, plain);
      console.log(`mixed (${M.name}), ${M.cs} ${M.cls} ${L}: ${d >= 0 ? '+' : ''}${d.toFixed(1)}%`);
      gate(ok, d, 10, -1, () => onSeeds(d, () => { curCls = M.cls; const a = measure(M.cs, M.cls, L, M.fx.map((k) => piece(k, L, false))); curCls = M.cls; return pct(measure(M.cs, M.cls, L, M.fx.map((k) => piece(k, L, true))), a); }),
        (v) => `the best mix of effects stays within +10% of plain gear (${M.name}, ${M.cs} ${M.cls} ${L}: ${v.toFixed(1)}%)`);
    }
  }
}
console.log(bad ? `${bad} failures` : 'effects sim OK');
process.exit(bad ? 1 : 0);
