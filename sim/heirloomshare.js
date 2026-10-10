// Heirloom power against quest gear (#194). For each heirloom, level and class that can use it: the heirloom's stat points,
// armour and weapon damage per second, and the game's own gear score (G.itemScore, class weights), against a fitted green
// and a fitted blue of the same slot and level (G.fittedGear's rule: the class's armour type, weapon type and stat affix; a
// weapon of the heirloom's own type). Fitted pieces are averaged over DRAWS draws (a weapon's speed is random).
// share = heirloom / fitted green. "green over heirloom" = what a quest green adds: green / heirloom - 1.
//   ROOT=~/azeroth-solo-measure node sim/heirloomshare.js
require('./_seed.js');
const ROOT = process.env.ROOT || require('path').join(__dirname, '..');
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
for (const f of ['data', 'engine', 'bots', 'game']) require(ROOT + '/src/' + f + '.js');
const { G, D } = globalThis;
G.newGame({ name: 'H', cls: 'warrior', race: 'human' });
const LEVELS = [10, 20, 30, 40, 50, 59], DRAWS = +(process.env.DRAWS || 300);
const pts = (it) => Object.values(it.stats || {}).reduce((a, b) => a + b, 0);
const dps = (it) => (it.dmg ? (it.dmg[0] + it.dmg[1]) / 2 / it.speed : 0);
const fitted = (cls, slot, L, q, wtype) => {
  const C = D.CLASSES[cls], aff = G.classAffix(cls), o = { affix: aff };
  if (slot === 'weapon') o.wtype = wtype; else if (slot !== 'ranged' && slot !== 'back' && slot !== 'finger') o.atype = C.armorType;
  return G.genGear(slot, L, q, o);
};
const avg = (f) => { let s = 0; for (let i = 0; i < DRAWS; i++) s += f(); return s / DRAWS; };
const rows = [];
for (const id of Object.keys(D.HEIRLOOMS)) for (const cls of Object.keys(D.CLASSES).filter((c) => !D.CLASSES[c].hidden)) {
  const probe = G.makeHeirloom(id, 30); if (!G.canUseItem(probe, cls)) continue;
  for (const L of LEVELS) {
    const h = G.makeHeirloom(id, L), H = D.HEIRLOOMS[id];
    const g = (q, f) => avg(() => f(fitted(cls, H.slot, L, q, H.wtype)));
    rows.push({ id, name: H.name, cls, L, slot: H.slot,
      hPts: pts(h), gPts: g(2, pts), bPts: g(3, pts), hSc: G.itemScore(h, cls), gSc: g(2, (x) => G.itemScore(x, cls)), bSc: g(3, (x) => G.itemScore(x, cls)),
      hArm: h.armor || 0, gArm: g(2, (x) => x.armor || 0), hDps: dps(h), gDps: g(2, dps), bDps: g(3, dps) });
  }
}
if (process.env.JSON) { console.log(JSON.stringify(rows)); process.exit(0); }
const pad = (s, n) => String(s).padEnd(n), pc = (x) => Math.round(x * 100) + '%', f1 = (x) => (Math.round(x * 10) / 10).toString();
for (const L of LEVELS) {
  console.log(`\n## level ${L}: heirloom vs fitted green (g) and blue (b)`);
  console.log(pad('heirloom / class', 30) + pad('stat pts h|g|b', 18) + pad('score h|g|b', 22) + pad('share (score)', 14) + pad('share (stat pts)', 17) + pad('weapon dps h|g|b', 20) + 'armour h|g');
  for (const r of rows.filter((x) => x.L === L)) console.log(pad(`${r.name} / ${r.cls}`, 30) + pad(`${r.hPts}|${f1(r.gPts)}|${f1(r.bPts)}`, 18) + pad(`${f1(r.hSc)}|${f1(r.gSc)}|${f1(r.bSc)}`, 22) + pad(pc(r.hSc / r.gSc), 14) + pad(pc(r.hPts / r.gPts), 17) + pad(r.hDps ? `${f1(r.hDps)}|${f1(r.gDps)}|${f1(r.bDps)}` : '-', 20) + (r.hArm || r.gArm ? `${r.hArm}|${f1(r.gArm)}` : '-'));
}
console.log('\n## share of a fitted green (score), by heirloom slot: min / median / max over classes and levels');
const med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
for (const slot of ['weapon', 'ranged', 'back', 'finger']) { const r = rows.filter((x) => x.slot === slot), s = r.map((x) => x.hSc / x.gSc), p = r.map((x) => x.hPts / x.gPts); console.log(pad(slot, 8), `score ${pc(Math.min(...s))} / ${pc(med(s))} / ${pc(Math.max(...s))}   stat points ${pc(Math.min(...p))} / ${pc(med(p))} / ${pc(Math.max(...p))}`); }
