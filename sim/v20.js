// Levels 1-10 flow per starting zone: a greedy player does every solo quest the moment it is
// available and grinds only when none is left. Reports quest share of XP and the longest grind.
require('./_seed.js'); // seeded (#125): the same commit always gives the same result; SEED=n picks other dice
globalThis.localStorage={getItem(){return null},setItem(){},removeItem(){}};
require('../src/data.js');require('../src/engine.js');require('../src/bots.js');require('../src/game.js');
const {D,G}=globalThis;
const at={}; for(const k in D.PLACES) for(const n of (D.PLACES[k].npcs||[])) at[n]=k;
const regionOf=(q)=>(D.PLACES[at[D.QUESTS[q].giver]]||{}).region||'elwynn';
let bad=0;
for (const race of ['human','dwarf','nightelf','orc','tauren','undead']) { const FROM=+(process.env.FROM||1), TO=+(process.env.TO||10);
  const region = D.PLACES[D.RACES[race].start].region || 'elwynn';
  G.newGame({name:'Sim',cls:'warrior',race}); const P=G.S.player;
  const done=new Set(process.env.ONLY?[...(process.env.PRE||'').split(',').filter(Boolean),'report_gryan','westfall_dunmorogh','westfall_teldrassil','crossroads_durotar','crossroads_mulgore','crossroads_tirisfal']:[]); if(process.env.DONEBELOW) for(const [k,q] of Object.entries(D.QUESTS)) if(q.lvl<+process.env.DONEBELOW) done.add(k); let lvl=FROM, xp=0, qxp=0, kxp=0, grind=0, worst=0, worstAt=0, log=[];
  const gain=(n)=>{ xp+=n; while(lvl<TO && xp>=D.XP_TO_LEVEL[lvl]){ xp-=D.XP_TO_LEVEL[lvl]; lvl++; } };
  while(lvl<TO){
    P.level=lvl; P.done=Object.fromEntries([...done].map(q=>[q,true])); P.quests={};
    const avail=Object.keys(D.QUESTS).filter(q=>!done.has(q)&&!D.QUESTS[q].group&&(process.env.ONLY?regionOf(q)===(D.RACES[race].faction==='horde'?'barrens':'westfall'):(regionOf(q)===region||regionOf(q)===(D.RACES[race].faction==='horde'?'barrens':'westfall')))&&G.questState(q)==='available');
    if(avail.length){ if(grind>worst){worst=grind;worstAt=lvl;} grind=0; const q=avail[0]; done.add(q); const Q=D.QUESTS[q];
      // kills made doing the quest count as questing: kill n, or n / drop chance for collects
      let kills=0; for(const o of Q.objs){ if(o.type==='kill') kills+=o.n; if(o.type==='collect'){ const src=Object.values(D.MOBS).find(m=>(m.qdrops||[]).some(d=>d[0]===o.item)); const pr=src?src.qdrops.find(d=>d[0]===o.item)[1]:1; kills+= o.n===1?1:Math.ceil(o.n/pr); } }
      const x=G.questXp(Q.lvl)+kills*Math.round(G.xpForKill(Math.max(lvl,Q.lvl-1),false)); qxp+=x; gain(x); continue; }
    const k=Math.round(G.xpForKill(lvl+0.5,false)); kxp+=k; grind++; (log[lvl]=(log[lvl]||0)+1); gain(k);
  }
  if(grind>worst){worst=grind;worstAt=lvl;}
  const share=Math.round(qxp/(qxp+kxp)*100);
  const needed = Math.max(0, qxp+kxp); // total
  const qKills = done.size; // quests done
  const pre9 = log.slice(FROM,TO-1).reduce((a,b)=>a+(b||0),0);
  const ok = share>=50 && pre9<=30;
  if(!ok) bad++;
  console.log(`${ok?'PASS':'FAIL'} ${race.padEnd(8)} ${region.padEnd(10)} quests ${String(done.size).padStart(2)} · quest share ${share}% · kills outside quests ${String(grind).padStart(3)} · longest grind ${worst} kills (at level ${worstAt}) · grind by level ${JSON.stringify(log.map((x,i)=>x?i+':'+x:null).filter(Boolean))}`);
}
process.exitCode = bad?1:0;
