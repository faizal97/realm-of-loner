// Every v2.1 ability (levels 16 and 18) fires in a real fight without errors and does its thing.
require('./_seed.js'); // seeded (#125): the same commit always gives the same result; SEED=n picks other dice
require('../src/data.js'); require('../src/engine.js');
const { D, E } = globalThis;
const NEW = { warrior: ['bloodrage', 'retaliation'], mage: ['flamestrike', 'mana_shield'], priest: ['heal', 'psychic_scream'], rogue: ['rupture', 'kidney_shot'], paladin: ['exorcism', 'retribution_aura'], warlock: ['rain_of_fire', 'demon_armor'], hunter: ['rapid_fire', 'immolation_trap'], druid: ['regrowth', 'swipe'], shaman: ['frost_shock', 'flametongue_weapon'] };
let bad = 0;
for (const [cls, ids] of Object.entries(NEW)) for (const id of ids) {
  const p = E.charUnit({ name: 'P', cls, level: 20, equip: { weapon: D.ITEMS[D.CLASSES[cls].startWeapon] }, role: 'dps' }, 'ally', 'player', 0);
  if (cls === 'warrior' || cls === 'rogue') p.res = 100;
  const mobs = [E.mobUnit('harvest_reaper', 20), E.mobUnit('harvest_reaper', 20)];
  const C = E.fight([p], mobs, { soloUid: p.uid });
  if (id === 'swipe') E.shiftIn(C, p, 'bear'), p.res = 60;
  if (id === 'kidney_shot' || id === 'rupture') { p.cp = 3; p.cpTarget = mobs[0].uid; }
  if (id === 'heal' || id === 'regrowth') p.hp = Math.round(p.maxHp * 0.3);
  const hp0 = mobs.map((m) => m.hp), php = p.hp, res0 = p.res;
  let why; try { why = E.use(C, p, id, id === 'heal' || id === 'regrowth' ? p.uid : mobs[0].uid); } catch (e) { why = 'THROW ' + e.message; }
  for (let i = 0; i < 45; i++) E.tick(C, 0.1);
  const ok = !String(why || '').startsWith('THROW') && !why;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${cls.padEnd(8)} ${id.padEnd(18)} ${why || 'cast'} · mob dmg ${hp0.map((h, i) => h - mobs[i].hp).join('/')} · self hp ${p.hp - php} · res ${Math.round(p.res - res0)} · auras ${[...p.auras, ...mobs[0].auras].map((a) => a.id).join(',')}${mobs[0].stunUntil > C.t - 4.5 ? ' · stunned' : ''}`);
  if (!ok) bad++;
}
process.exitCode = bad ? 1 : 0;
