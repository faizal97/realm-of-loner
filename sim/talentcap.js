// Talent points against what the trees can hold: points a character has at each level, and the most it can spend across
// a class's three trees (the sum of every talent's ranks). A class whose trees hold fewer points than a level-60 character
// has leaves points that can never be spent.
//   ROOT=~/azeroth-solo-measure node sim/talentcap.js
const ROOT = process.env.ROOT || require('path').join(__dirname, '..');
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
for (const f of ['data', 'engine', 'bots', 'game']) require(ROOT + '/src/' + f + '.js');
const { G, D } = globalThis;
const pts = G.talentTotal(D.LEVEL_CAP);
console.log(`points at ${D.LEVEL_CAP}: ${pts} (1 a level from ${D.TALENT_START}); a tier opens at ${D.TALENT_TIER_POINTS.slice(1).join(', ')} points in its tree`);
let bad = 0;
for (const cls of Object.keys(D.TALENTS)) {
  const trees = D.TALENTS[cls].map((tr) => ({ n: tr.name, cap: tr.talents.reduce((a, t) => a + t.ranks, 0) })), all = trees.reduce((a, x) => a + x.cap, 0), lost = Math.max(0, pts - all);
  if (lost) bad++;
  console.log(`${cls.padEnd(8)} ${trees.map((x) => `${x.n} ${x.cap}`).join(' | ').padEnd(52)} all trees ${all}  ${lost ? `UNSPENDABLE at ${D.LEVEL_CAP}: ${lost}` : `spare ${all - pts}`}`);
}
console.log(bad ? `${bad} classes have points that can never be spent` : 'every class can spend all its points');
