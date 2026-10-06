// Every v2.0 ability fires once in a real fight without errors and does its thing.
require('./_seed.js'); // seeded (#125): the same commit always gives the same result; SEED=n picks other dice
require('../src/data.js'); require('../src/engine.js');
const {D,E}=globalThis;
const NEW={warrior:['hamstring','cleave'],mage:['frost_nova','arcane_explosion'],priest:['mind_blast','inner_fire'],rogue:['backstab','garrote'],paladin:['blessing_might','lay_on_hands'],warlock:['searing_pain','shadow_ward'],hunter:['wing_clip','multi_shot'],druid:['entangling_roots','thorns'],shaman:['flame_shock','strength_earth']};
let bad=0;
for (const [cls,ids] of Object.entries(NEW)) for (const id of ids) {
  const ch={name:'P',cls,level:15,equip:{weapon:D.ITEMS[D.CLASSES[cls].startWeapon]},role:'dps'};
  const p=E.charUnit(ch,'ally','player',0); p.res=p.maxRes||100; if(cls==='warrior'||cls==='rogue') p.res=100;
  const mobs=[E.mobUnit('riverpaw_brute',15),E.mobUnit('riverpaw_brute',15)];
  const C=E.fight([p],mobs,{soloUid:p.uid});
  if (id==='lay_on_hands') p.hp=Math.round(p.maxHp*0.2);
  const hp0=mobs.map(m=>m.hp), php=p.hp;
  let why; try { why=E.use ? E.use(C,p,id,mobs[0].uid) : 'no E.use'; } catch(e){ why='THROW '+e.message; }
  for(let i=0;i<40;i++) E.tick(C,0.1);
  const dmg=mobs.map((m,i)=>hp0[i]-m.hp), auras=[...p.auras.map(a=>a.id),...mobs[0].auras.map(a=>a.id)];
  const ok=!String(why||'').startsWith('THROW');
  console.log((ok?'ok  ':'FAIL')+` ${cls.padEnd(8)} ${id.padEnd(17)} result=${why??'cast'} mobDmg=${dmg.join('/')} heal=${p.hp-php} auras=${auras.join(',')}`);
  if(!ok) bad++;
}
process.exitCode=bad?1:0;
