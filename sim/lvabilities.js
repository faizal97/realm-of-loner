// Every class ability learned between MIN and MAX (env, default 44–48) fires in a real fight without errors.
// `MIN=52 MAX=58 node sim/lvabilities.js` checks the v7/v8 spells.
require('./_seed.js'); // seeded (#125): the same commit always gives the same result; SEED=n picks other dice
require('../src/data.js'); require('../src/engine.js');
const { D, E } = globalThis;
const MIN = +(process.env.MIN || 44), MAX = +(process.env.MAX || 48), LV = MAX + 2;
let bad = 0, n = 0;
for (const [cls, k] of Object.entries(D.CLASSES)) for (const id of k.abilities || []) {
  const ab = D.ABILITIES[id]; if (!ab || ab.lvl < MIN || ab.lvl > MAX) continue; n++;
  const p = E.charUnit({ name: 'P', cls, level: LV, equip: { weapon: D.ITEMS[k.startWeapon] }, role: 'dps' }, 'ally', 'player', 0);
  if (cls === 'warrior' || cls === 'rogue') p.res = 100;
  const mobs = [E.mobUnit('boulderfist_brute', LV), E.mobUnit('boulderfist_brute', LV)];
  const C = E.fight([p], mobs, { soloUid: p.uid });
  if (ab.form) E.shiftIn(C, p, ab.form), p.res = 60;
  if (ab.finisher) { p.cp = 3; p.cpTarget = mobs[0].uid; }
  const ally = ab.target === 'ally';
  if (ally) p.hp = Math.round(p.maxHp * 0.3);
  const hp0 = mobs.map((m) => m.hp), php = p.hp, res0 = p.res;
  let why; try { why = E.use(C, p, id, ally ? p.uid : mobs[0].uid); } catch (e) { why = 'THROW ' + e.message; }
  for (let i = 0; i < 55; i++) E.tick(C, 0.1);
  const ok = !why;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${cls.padEnd(8)} ${String(ab.lvl).padEnd(3)}${id.padEnd(20)} ${why || 'cast'} · mob dmg ${hp0.map((h, i) => h - mobs[i].hp).join('/')} · self hp ${p.hp - php} · res ${Math.round(p.res - res0)} · auras ${[...p.auras, ...mobs[0].auras].map((a) => a.id).join(',')}`);
  if (!ok) bad++;
}
console.log(`${n - bad}/${n} ok`);
process.exitCode = bad ? 1 : 0;
