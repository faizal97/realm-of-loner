// How far ahead of a zone's level a player is after doing every solo quest in it (player feedback, #187). From the game's
// own data and functions: a quester walks the zones of their faction in level order and, in each, does every solo quest
// the game offers (group and dungeon quests left out, counted as done for the quests that follow them), lowest level
// first, the moment it is offered (the game's rule: quest level <= player level + 2). It never grinds: when nothing is
// left to offer it moves to the next zone. Two XP countings, as #187:
//   turn-in  = the quest's turn-in XP only (G.questXp, the "You gain" line on the turn-in)
//   +kills   = turn-in plus the kill XP of the creatures the quest needs (kill count; a collect objective counts
//              n / drop chance kills), each at its own creature level (G.xpForKill at the player's current level)
// Zone level (capitals, which span 1-60, left out) = the lowest and highest level of its places (D.PLACES lvl). Lead = level on leaving the zone minus the
// zone's highest level. Turn-in XP does not depend on class, race or the player's level, so the class does not move it.
//   ROOT=~/azeroth-solo-measure node sim/questlead.js        (CLASSES=mage,warrior,hunter RACES=human,orc)
require('./_seed.js');
const ROOT = process.env.ROOT || require('path').join(__dirname, '..');
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
for (const f of ['data', 'engine', 'bots', 'game']) require(ROOT + '/src/' + f + '.js');
const { G, D } = globalThis;
const CLS = (process.env.CLASSES || 'mage,warrior,hunter').split(','), RACES = (process.env.RACES || 'human,orc').split(',');
const at = {}; for (const k in D.PLACES) for (const n of (D.PLACES[k].npcs || [])) if (!at[n]) at[n] = k;
const regionOf = (n) => (D.PLACES[at[n]] || {}).region;
const qRegion = (q) => regionOf(D.QUESTS[q].turnin) || regionOf(D.QUESTS[q].giver);
const zlvl = {}; for (const k in D.PLACES) { const p = D.PLACES[k]; if (!p.lvl || !p.region || p.lvl[1] - p.lvl[0] >= 50 || p.gate) continue; const z = zlvl[p.region] = zlvl[p.region] || [99, 0]; z[0] = Math.min(z[0], p.lvl[0]); z[1] = Math.max(z[1], p.lvl[1]); } // capitals and dungeon entrances (gate: true, as D.zoneLevels() leaves them out) do not set a zone's level
const STARTERS = { alliance: ['elwynn', 'dunmorogh', 'teldrassil'], horde: ['durotar', 'mulgore', 'tirisfal'] };
const mobLvl = (m) => { const l = D.MOBS[m].lvl; return Array.isArray(l) ? Math.round((l[0] + l[1]) / 2) : l; };
function killsOf(Q) { // [{lvl, n, elite}] the creatures a quest has you kill
  const out = [];
  for (const o of Q.objs) {
    if (o.type === 'kill') out.push({ m: o.mob, n: o.n });
    if (o.type === 'collect') { const src = Object.keys(D.MOBS).find((m) => (D.MOBS[m].qdrops || []).some((d) => d[0] === o.item)); if (!src) continue; out.push({ m: src, n: Math.round(o.n / D.MOBS[src].qdrops.find((d) => d[0] === o.item)[1]) }); }
  }
  return out;
}
function run(cls, race, withKills) {
  G.newGame({ name: 'Q', cls, race }); const P = G.S.player;
  const fac = D.RACES[race].faction || (['orc', 'troll', 'tauren', 'undead'].includes(race) ? 'horde' : 'alliance');
  const start = regionOf(Object.keys(D.QUESTS).map((q) => D.QUESTS[q]).find((Q) => Q.lvl <= 3 && (!Q.faction || Q.faction === fac)).giver);
  const startReg = (D.PLACES[D.RACES[race].start] || {}).region || start;
  const regs = Object.keys(D.REGIONS).filter((r) => zlvl[r] && (D.REGIONS[r].faction === fac || D.REGIONS[r].faction === 'contested' || r === startReg) && !(STARTERS[fac].includes(r) && r !== startReg));
  regs.sort((a, b) => zlvl[a][0] - zlvl[b][0] || (a < b ? -1 : 1));
  const solo = (q) => { const Q = D.QUESTS[q]; return !Q.group && !Q.dungeon && !Q.storm && (!Q.faction || Q.faction === fac); };
  const done = new Set(Object.keys(D.QUESTS).filter((q) => !solo(q) && (!D.QUESTS[q].faction || D.QUESTS[q].faction === fac)));
  const mine = {}; for (const q of Object.keys(D.QUESTS)) if (solo(q)) { const r = qRegion(q); (mine[r] = mine[r] || []).push(q); }
  let lvl = 1, xp = 0; const rows = [];
  const gain = (x) => { xp += x; while (lvl < D.LEVEL_CAP && xp >= D.XP_TO_LEVEL[lvl]) { xp -= D.XP_TO_LEVEL[lvl]; lvl++; } if (lvl >= D.LEVEL_CAP) xp = 0; };
  for (const r of regs) {
    const todo = (mine[r] || []).slice(), enter = lvl; let n = 0, tx = 0, kx = 0;
    for (;;) {
      P.level = lvl;
      const ok = todo.filter((q) => !done.has(q) && D.QUESTS[q].lvl <= lvl + 2 && (D.QUESTS[q].pre || []).every((p) => done.has(p)));
      if (!ok.length) break;
      ok.sort((a, b) => D.QUESTS[a].lvl - D.QUESTS[b].lvl); const q = ok[0], Q = D.QUESTS[q]; done.add(q); n++;
      if (withKills) for (const k of killsOf(Q)) { P.level = lvl; const x = k.n * G.xpForKill(mobLvl(k.m), !!D.MOBS[k.m].elite); kx += x; gain(x); }
      const x = G.questXpShare ? Math.round(G.questXp(Q.lvl) * G.questXpShare(Q.lvl, lvl)) : G.questXp(Q.lvl); tx += x; gain(x); // the XP falloff for outlevelled quests (#188) where the build has it
    }
    const left = todo.filter((q) => !done.has(q)).length, qs = (mine[r] || []).map((q) => D.QUESTS[q].lvl).sort((a, b) => a - b);
    rows.push({ r, name: D.REGIONS[r].name, zl: zlvl[r], n, total: (mine[r] || []).length, left, enter, exit: lvl, tx, kx, qmax: qs.length ? qs[qs.length - 1] : 0 });
  }
  return { rows, fac };
}
const pad = (s, n) => String(s).padEnd(n), num = (x) => (x > 0 ? '+' : '') + x, pc = (a, b) => (a + b ? Math.round(a / (a + b) * 100) : 0) + '%';
const out = {};
for (const race of RACES) {
  const only = run(CLS[0], race, false), peek = only.rows.find((w) => w.n < w.total);
  console.log(`\n## ${race} (${only.fac}) turn-in XP only, no kill XP: stops at level ${only.rows[only.rows.length - 1].exit}, with ${only.rows.reduce((a, w) => a + w.n, 0)} of ${only.rows.reduce((a, w) => a + w.total, 0)} quests done (first stall: ${peek ? peek.name : '-'})`);
  const per = CLS.map((c) => run(c, race, true)), same = per.every((p) => JSON.stringify(p.rows) === JSON.stringify(per[0].rows));
  out[race] = per[0];
  console.log(`## ${race} (${per[0].fac}), turn-in + kill XP of the quest creatures · classes ${CLS.join(', ')}: ${same ? 'identical' : 'DIFFER'}`);
  console.log(pad('zone (place levels)', 34) + pad('quests', 9) + pad('in→out', 8) + pad('top quest', 10) + pad('lead vs place top', 19) + pad('vs top quest', 14) + 'turn-in share of XP');
  for (const w of per[0].rows) if (w.total) console.log(pad(`${w.name} (${w.zl[0]}-${w.zl[1]})`, 34) + pad(`${w.n}/${w.total}`, 9) + pad(`${w.enter}→${w.exit}`, 8) + pad(w.qmax, 10) + pad(num(w.exit - w.zl[1]), 19) + pad(num(w.exit - w.qmax), 14) + pc(w.tx, w.kx));
}
const med = (l) => l.sort((a, b) => a - b)[Math.floor(l.length / 2)];
console.log('\nlead on leaving a zone (zones with 8+ quests done and not capped at 60 on entry):');
for (const k in out) { const rows = out[k].rows.filter((w) => w.n >= 8 && w.enter < 60), a = rows.map((w) => w.exit - w.zl[1]), b = rows.map((w) => w.exit - w.qmax); console.log(pad(k, 6), `vs place top: min ${num(Math.min(...a))} median ${num(med(a))} max ${num(Math.max(...a))} | vs top quest: min ${num(Math.min(...b))} median ${num(med(b))} max ${num(Math.max(...b))} | zones ${rows.length}`); }
