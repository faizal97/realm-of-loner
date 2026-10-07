// Gear variety and epics before 60 (#141). From the game's own data and functions, every 10-level band (10-19 ... 50-59):
// 1. per slot and quality, the stat budget (sum of an item's stats) of every gear item a player can get, by source:
//    fixed items (creature and boss drops, crafted), generated items (random world drops, quest reward families, end-of-run
//    and other fitted gear: G.genGear's curve), and the stat mixes (distinct stat-key sets) a class can get per slot;
// 2. epics: the chance per kill of a purple from levelling (named creatures' drops, random world drops) and the expected
//    purples per dungeon run (each boss drops 2 of its loot list, shuffled, plus a 25% random blue);
// 3. the green/blue/purple share of a typical character's gear at 20, 40 and 59: bots made by G.botChar (B.makeBot), the
//    gear the game gives the simulated players.
//   ROOT=~/azeroth-solo-measure node sim/gearvariety.js
require('./_seed.js'); // seeded: the same commit gives the same result; SEED=n picks other dice
const ROOT = process.env.ROOT || require('path').join(__dirname, '..');
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
for (const f of ['data', 'engine', 'bots', 'game']) require(ROOT + '/src/' + f + '.js');
const { G, D, B } = globalThis;
G.newGame({ name: 'V', cls: 'warrior', race: 'human' });
const SLOTS = ['weapon', 'ranged', 'chest', 'legs', 'feet', 'hands', 'wrist', 'waist', 'back', 'finger'];
const BANDS = [[10, 19], [20, 29], [30, 39], [40, 49], [50, 59]], QN = ['grey', 'white', 'green', 'blue', 'purple', 'heirloom'];
const CLASSES = Object.keys(D.CLASSES).filter((c) => !D.CLASSES[c].hidden);
const budget = (it) => Object.values(it.stats || {}).reduce((a, b) => a + (+b || 0), 0);
const mix = (it) => Object.keys(it.stats || {}).filter((k) => it.stats[k] > 0).sort().join('+') || '(none)';
const bandOf = (l) => BANDS.findIndex(([a, b]) => l >= a && l <= b);
const q = (a, f) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(f * (s.length - 1)))] : null; };
// ---- sources of fixed items
const src = {}; const tag = (id, s) => { (src[id] = src[id] || new Set()).add(s); };
for (const k in D.MOBS) { const M = D.MOBS[k]; for (const [id] of M.drops || []) tag(id, M.boss ? 'boss drop' : M.named ? 'named creature' : 'creature drop'); for (const id of M.loot || []) tag(id, 'dungeon/raid boss'); }
for (const k in D.RECIPES || {}) if (D.RECIPES[k].makes) tag(D.RECIPES[k].makes, 'crafted');
for (const k in D.REWARD_FAMILIES || {}) for (const id of Object.values(D.REWARD_FAMILIES[k].fixed || {})) tag(id, 'quest reward');
const fixed = Object.entries(D.ITEMS).filter(([id, it]) => SLOTS.includes(it.slot) && !it.lookOnly && it.q >= 2 && it.q <= 4 && src[id]).map(([id, it]) => ({ id, it, src: [...src[id]] }));
// ---- 1. budget spread per band, slot, quality (fixed items by source, and the generated curve)
console.log('== 1. stat budget (sum of stats) per band, slot and quality; fixed items from drops and crafting, and generated gear (G.genGear)');
const genBudget = (lvl, qq) => Math.max(1, Math.round(qq === 2 ? lvl * 0.55 + 1 : qq === 3 ? lvl * 0.55 + 2 : lvl * 0.64 + 2));
const rows1 = [];
for (let b = 0; b < BANDS.length; b++) for (const qq of [2, 3, 4]) {
  const F = fixed.filter((x) => bandOf(x.it.lvl) === b && x.it.q === qq);
  const genAt = BANDS[b].map((l) => genBudget(l, qq));
  for (const slot of SLOTS) { const f = F.filter((x) => x.it.slot === slot), bud = f.map((x) => budget(x.it));
    if (!f.length && qq === 4) continue;
    rows1.push({ band: BANDS[b].join('-'), q: QN[qq], slot, n: f.length, min: q(bud, 0), med: q(bud, 0.5), max: q(bud, 1), gen: qq <= 3 ? `${genAt[0]}-${genAt[1]}` : 'none', srcs: [...new Set(f.flatMap((x) => x.src))].join(', ') }); } }
for (const r of rows1) console.log(`${r.band} ${r.q.padEnd(6)} ${r.slot.padEnd(7)} fixed items ${String(r.n).padStart(2)}${r.n ? ` budget ${r.min}/${r.med}/${r.max}` : ''} · generated ${r.gen}${r.srcs ? ' · ' + r.srcs : ''}`);
// budget spread at one level: generated gear has one budget per level and quality; fixed items vary
const sameLvl = {}; for (const x of fixed) { const k = `${x.it.slot}|${x.it.q}|${x.it.lvl}`; (sameLvl[k] = sameLvl[k] || []).push(budget(x.it)); }
const spreads = Object.entries(sameLvl).filter(([, a]) => a.length >= 2).map(([k, a]) => { const m = q(a, 0.5); return { k, n: a.length, spread: m ? (Math.max(...a) - Math.min(...a)) / m : 0 }; });
console.log(`same slot, quality and level, fixed items: ${spreads.length} groups of 2+ items; budget spread (max-min)/median: median ${(q(spreads.map((s) => s.spread), 0.5) * 100).toFixed(0)}%, max ${(Math.max(...spreads.map((s) => s.spread)) * 100).toFixed(0)}% · generated gear: 0% (one budget per level and quality)`);
// fixed items against the generated budget at their own level: a blue below a green of its level, a green below
const below = (qq, ref) => { const f = fixed.filter((x) => x.it.q === qq && x.it.lvl >= 10 && x.it.lvl <= 59 && x.it.slot !== 'weapon' && x.it.slot !== 'ranged'); return [f.filter((x) => budget(x.it) < genBudget(x.it.lvl, ref)).length, f.length]; };
{ const [b2, n2] = below(3, 2), [b3, n3] = below(3, 3); console.log(`fixed blues 10-59 (armour, back, finger; weapons carry most of their power in damage): ${b3} of ${n3} under a generated blue of their level, ${b2} of ${n3} under a generated green`); }
// ---- stat mixes per class and slot
console.log('\n== stat mixes a class can get per slot and band (distinct stat-key sets): random drops use all affixes, quest rewards the class affix only');
const affixMixes = D.AFFIXES.map((a) => Object.keys(a.stats).sort().join('+'));
const usable = (it, cls) => (G.canUseItem ? G.canUseItem(it, cls) : true);
const rows2 = [];
for (let b = 0; b < BANDS.length; b++) for (const cls of CLASSES) { const per = {};
  for (const slot of SLOTS) { const f = fixed.filter((x) => bandOf(x.it.lvl) === b && x.it.slot === slot && usable(x.it, cls)); per[slot] = new Set(f.map((x) => mix(x.it))).size; }
  const mean = SLOTS.reduce((a, s) => a + per[s], 0) / SLOTS.length; rows2.push({ band: BANDS[b].join('-'), cls, fixedMean: mean, per }); }
console.log(`generated items: ${new Set(affixMixes).size} stat mixes (D.AFFIXES), the same for every class and slot; quest reward families: 1 (the class affix, G.CLASS_AFFIX)`);
for (const r of rows2.filter((r) => r.cls === 'warrior' || r.cls === 'mage' || r.cls === 'rogue')) console.log(`  ${r.band} ${r.cls.padEnd(8)} fixed-item mixes per slot, mean ${r.fixedMean.toFixed(1)}: ${SLOTS.map((s) => s + ' ' + r.per[s]).join(', ')}`);
// ---- 2. epics
console.log('\n== 2. purples before 60');
const isEpic = (id) => D.ITEMS[id] && D.ITEMS[id].q === 4 && SLOTS.includes(D.ITEMS[id].slot) && !D.ITEMS[id].lookOnly;
for (let b = 0; b < BANDS.length; b++) { const [lo, hi] = BANDS[b];
  const mobs = Object.keys(D.MOBS).filter((k) => { const M = D.MOBS[k]; return !M.boss && M.lvl && M.lvl[1] >= lo && M.lvl[0] <= hi; });
  const named = mobs.filter((k) => D.MOBS[k].named), pNamed = named.map((k) => (D.MOBS[k].drops || []).filter(([id]) => isEpic(id)).reduce((a, [, p]) => a + p, 0));
  const acts = Object.keys(D.ACTIVITIES).filter((k) => { const A = D.ACTIVITIES[k]; return A.dungeon && !A.worldBoss && A.minLvl >= lo && A.minLvl <= hi; });
  const perRun = acts.map((k) => { const Dg = D.DUNGEONS[D.ACTIVITIES[k].dungeon]; let e = 0; for (const p of Dg.pulls || []) if (p.boss) for (const m of p.mobs) { const L = D.MOBS[m].loot || []; if (L.length) e += Math.min(2, L.length) * L.filter(isEpic).length / L.length; } return { k, e }; });
  console.log(`${lo}-${hi}: random world drops purple chance per kill 0 (rollLoot: blue 1.2%, green 3.8%) · named creatures ${named.length}, purple drop chance per named kill: max ${Math.max(0, ...pNamed).toFixed(3)} · dungeons ${acts.length}, expected purples per run: ${perRun.map((r) => D.ACTIVITIES[r.k].name + ' ' + r.e.toFixed(2)).join(', ') || '-'}`); }
// quest rewards per band (the reward's own level, D.REWARD_FAMILIES): by quality; and blues per dungeon run
console.log('\n== quest rewards (first choice of each quest with an item, by the item\'s level) and blues per dungeon run');
const famOf = (qk) => { const Q = D.QUESTS[qk]; return Q.reward && Q.reward.choice ? D.REWARD_FAMILIES[Q.reward.choice[0]] : null; };
for (let b = 0; b < BANDS.length; b++) { const n = [0, 0, 0, 0, 0]; let fx = 0;
  for (const qk in D.QUESTS) { const f = famOf(qk); if (!f) continue; if (f.fixed) { fx++; continue; } if (bandOf(f.lvl) === b) n[f.q]++; }
  const acts = Object.keys(D.ACTIVITIES).filter((k) => { const A = D.ACTIVITIES[k]; return A.dungeon && !A.worldBoss && bandOf(A.minLvl) === b; });
  const runs = acts.map((k) => { const Dg = D.DUNGEONS[D.ACTIVITIES[k].dungeon]; let bl = 0, bosses = 0; for (const p of Dg.pulls || []) if (p.boss) for (const m of p.mobs) { bosses++; const L = (D.MOBS[m].loot || []).filter((id) => D.ITEMS[id]); if (L.length) bl += Math.min(2, L.length) * L.filter((id) => D.ITEMS[id].q === 3).length / L.length; bl += 0.25; } return `${D.ACTIVITIES[k].name} ${bl.toFixed(1)} (${bosses} bosses)`; });
  console.log(`${BANDS[b].join('-')}: quest reward items white ${n[1]}, green ${n[2]}, blue ${n[3]}, purple ${n[4]}${b === 0 ? ` (+${fx} fixed by class)` : ''} · blues dropped per dungeon run: ${runs.join(', ')}`); }
// blues a player wins per run, by class: each boss's 2 shuffled loot items plus the 25% random blue (endRunFight); the
// player Needs what it can use, each of 4 bots (classes drawn evenly) Needs what it can use 85% of the time (addRoll's
// rule), the highest roll wins: a Need against k other Needs is won 1 time in k+1
const canUse = (it, cls) => G.canUseItem(it, cls) && (!it.atype || it.atype === D.CLASSES[cls].armorType || it.slot === 'back') && (it.slot !== 'weapon' || D.CLASSES[cls].weapons.includes(it.wtype));
const RUNS = +process.env.RUNS || 400, won = {};
for (let b = 0; b < BANDS.length; b++) for (const k of Object.keys(D.ACTIVITIES).filter((k) => { const A = D.ACTIVITIES[k]; return A.dungeon && !A.worldBoss && bandOf(A.minLvl) === b; })) {
  const A = D.ACTIVITIES[k], Dg = D.DUNGEONS[A.dungeon], L = A.minLvl;
  for (const cls of CLASSES) { let w = 0;
    for (let r = 0; r < RUNS; r++) { const bots = [0, 1, 2, 3].map(() => CLASSES[Math.floor(Math.random() * CLASSES.length)]);
      for (const p of Dg.pulls || []) if (p.boss) { const drops = (D.MOBS[p.mobs[0]].loot || []).slice().sort(() => Math.random() - 0.5).slice(0, 2).map((id) => D.ITEMS[id]).filter(Boolean);
        if (Math.random() < 0.25) drops.push(G.genGear(D.GEAR_SLOTS[Math.floor(Math.random() * D.GEAR_SLOTS.length)], L, 3));
        for (const it of drops) if (it.q === 3 && canUse(it, cls)) { const k2 = bots.filter((c) => canUse(it, c) && Math.random() < 0.85).length; w += 1 / (k2 + 1); } } }
    (won[b] = won[b] || {})[cls] = ((won[b] || {})[cls] || 0) + w / RUNS; }
  won[b].n = (won[b].n || 0) + 1; }
{ const n = 20000, u = {}; for (let i = 0; i < n; i++) { const it = G.genGear(D.GEAR_SLOTS[Math.floor(Math.random() * D.GEAR_SLOTS.length)], 30, 3); for (const c of CLASSES) u[c] = (u[c] || 0) + (canUse(it, c) ? 1 : 0); }
  console.log(`random world blue (rollLoot: 1.2% a normal kill, random slot, armour and weapon type): usable by the class it drops for: ${CLASSES.map((c) => `${c} ${((u[c] / n) * 100).toFixed(0)}%`).join(' · ')}`); }
console.log(`blues a player wins per dungeon run (${RUNS} runs a dungeon and class; band mean over its dungeons):`);
for (let b = 0; b < BANDS.length; b++) if (won[b]) console.log(`  ${BANDS[b].join('-')}: ${CLASSES.map((c) => `${c} ${(won[b][c] / won[b].n).toFixed(1)}`).join(' · ')}`);
// ---- 3. typical character's gear: bots at 20, 40 and 59
console.log('\n== 3. quality share of a typical character\'s gear (2,000 bots each made by B.makeBot and G.botChar, all equipped slots)');
for (const L of [20, 40, 59]) { const n = [0, 0, 0, 0, 0, 0]; let tot = 0;
  for (let i = 0; i < 2000; i++) { const b = B.makeBot(1 + i, new Set(), { level: L }); const c = G.botChar(b); for (const s in c.equip) { const it = c.equip[s]; if (!it || !SLOTS.includes(s)) continue; n[it.q] = (n[it.q] || 0) + 1; tot++; } }
  console.log(`level ${L}: ${n.map((x, k) => (x ? `${QN[k]} ${((x / tot) * 100).toFixed(1)}%` : null)).filter(Boolean).join(' · ')} (of ${tot} items, ${(tot / 2000).toFixed(1)} slots a bot)`); }
// a questing character: every quest done up to that level, the best quest reward kept in each slot (the newest item;
// the higher quality at the same level). An upper bound for questing alone: no drops, dungeons or crafting
console.log('\n== quality share of a questing character\'s gear: every quest reward up to that level, the best kept per slot (10 slots)');
for (const L of [20, 40, 59]) { const best = {};
  for (const qk in D.QUESTS) { const f = famOf(qk); if (!f || f.fixed || f.lvl > L) continue; const o = best[f.slot]; if (!o || f.lvl > o.lvl || (f.lvl === o.lvl && f.q > o.q)) best[f.slot] = f; }
  const n = [0, 0, 0, 0, 0]; for (const s of SLOTS) if (best[s]) n[best[s].q]++;
  console.log(`level ${L}: ${SLOTS.map((s) => s + ' ' + (best[s] ? QN[best[s].q] + ' ' + best[s].lvl : 'none')).join(', ')} · green ${n[2]}, blue ${n[3]}, purple ${n[4]}, empty ${SLOTS.filter((s) => !best[s]).length}`); }
console.log('JSON ' + JSON.stringify({ rows1, rows2 }));
