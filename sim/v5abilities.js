// Every v5 ability (levels 32 and 34) fires in a real fight without errors and does its thing.
require('./_seed.js'); // seeded (#125): the same commit always gives the same result; SEED=n picks other dice
require('../src/data.js'); require('../src/engine.js');
const { D, E } = globalThis;
const NEW = { warrior: ['shield_wall', 'slam'], mage: ['ice_block', 'pyroblast'], priest: ['holy_nova', 'greater_heal'], rogue: ['blind', 'vanish'], paladin: ['holy_shock', 'seal_command'], warlock: ['siphon_life', 'conflagrate'], hunter: ['scatter_shot', 'trueshot_aura'], druid: ['bash', 'innervate'], shaman: ['magma_totem', 'chain_heal'] };
let bad = 0;
for (const [cls, ids] of Object.entries(NEW)) for (const id of ids) {
  const p = E.charUnit({ name: 'P', cls, level: 35, equip: { weapon: D.ITEMS[D.CLASSES[cls].startWeapon] }, role: 'dps' }, 'ally', 'player', 0);
  if (cls === 'warrior' || cls === 'rogue') p.res = 100;
  const mobs = [E.mobUnit('skullsplitter_warrior', 35), E.mobUnit('skullsplitter_warrior', 35)];
  const C = E.fight([p], mobs, { soloUid: p.uid });
  if (id === 'swipe' || id === 'bash') E.shiftIn(C, p, 'bear'), p.res = 60;
  if (id === 'kidney_shot' || id === 'rupture') { p.cp = 3; p.cpTarget = mobs[0].uid; }
  if (id === 'heal' || id === 'regrowth' || id === 'lesser_healing_wave' || id === 'flash_heal' || id === 'greater_heal' || id === 'chain_heal') p.hp = Math.round(p.maxHp * 0.3);
  const hp0 = mobs.map((m) => m.hp), php = p.hp, res0 = p.res;
  let why; try { why = E.use(C, p, id, id === 'heal' || id === 'regrowth' || id === 'lesser_healing_wave' || id === 'flash_heal' || id === 'greater_heal' || id === 'chain_heal' ? p.uid : mobs[0].uid); } catch (e) { why = 'THROW ' + e.message; }
  for (let i = 0; i < 70; i++) E.tick(C, 0.1);
  const ok = !String(why || '').startsWith('THROW') && !why;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${cls.padEnd(8)} ${id.padEnd(18)} ${why || 'cast'} · mob dmg ${hp0.map((h, i) => h - mobs[i].hp).join('/')} · self hp ${p.hp - php} · res ${Math.round(p.res - res0)} · auras ${[...p.auras, ...mobs[0].auras].map((a) => a.id).join(',')}${mobs[0].stunUntil > C.t - 4.5 ? ' · stunned' : ''}`);
  if (!ok) bad++;
}
process.exitCode = bad ? 1 : 0;
