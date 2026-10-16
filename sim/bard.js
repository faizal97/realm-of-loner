// The Bard's proof (#254, docs/plans/2026-10-15-bard-playable-design.md "Proof"): its two own checks.
//   Instruments: Drum, Lute and Horn within a few % of each other when played well (damage and healing).
//   Skill matters: a Bard who misses beats does clearly worse than one who lands them.
//   Healing at level 60: at most 10% more than the best other healer class in the same fight, and with only the tank hurt,
//   the tank dies no more often than with the other healers (#254).
// A bot Bard with its role's talents, against one long-lived enemy (damage) or in a party of five whose tank a strong enemy hits
// and whom an area attack hits every 6 sec (healing), for 90 sec; seeded runs, the mean and the spread. Not in the build yet (manual, like sim/talents.js).
//   SEED=0 N=40 node sim/bard.js
require('./_seed.js');
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
require('../src/data.js'); require('../src/engine.js'); require('../src/bots.js'); require('../src/game.js');
const { D, E, G } = globalThis;
G.newGame({ name: 'Sim', cls: 'warrior' });
const N = +(process.env.N || 40), SECS = 90, LEVELS = (process.env.L || '40,60').split(',').map(Number);
const INST = ['lute', 'drum', 'horn'];

// one 90-sec fight; returns the bard's damage or healing produced per second. o.cls: another healer class in its place;
// o.landed: healing without overheal; o.tankOnly: no area hit, and returns 1 if the tank died
function fight(role, L, instrument, skill, o) {
  o = o || {}; const cls = o.cls || 'bard', landed = o.landed;
  const tl = G.autoTalents(cls, role, L, 0);
  const ch = { name: 'Healer', cls, level: L, role, talents: tl, instrument: cls === 'bard' ? instrument : undefined, equip: G.botChar({ name: 'g', cls, race: 'human', level: L, skill: 0.6, role }).equip };
  const b = E.charUnit(ch, 'ally', 'bot', 0); b.bot = { skill, react: 0.3 };
  const allies = [b];
  let tank = null;
  if (role === 'healer') {
    const tc = { name: 'Tank', cls: 'warrior', level: L, role: 'tank', talents: G.autoTalents('warrior', 'tank', L, 0), equip: G.botChar({ name: 't', cls: 'warrior', race: 'human', level: L, skill: 0.6, role: 'tank' }).equip };
    tank = E.charUnit(tc, 'ally', 'bot', 1); tank.bot = { skill: 0.8, react: 0.3 }; allies.unshift(tank);
    ['rogue', 'mage', 'hunter'].forEach((cls, i) => { // three damage dealers, so the party heals (and its Finale) have a party to heal
      const dc = { name: 'D' + i, cls, level: L, role: 'dps', talents: G.autoTalents(cls, 'dps', L, 0), equip: G.botChar({ name: 'd' + i, cls, race: 'human', level: L, skill: 0.6, role: 'dps' }).equip };
      const d = E.charUnit(dc, 'ally', 'bot', 2 + i); d.bot = { skill: 0.7, react: 0.3 }; allies.push(d);
    });
  }
  // healing: a boss-strength hitter on the tank (6x a mob's damage): every healer class falls short here, so it measures how
  // much each can heal (in a fight one can carry, the healing that lands is capped by the damage taken)
  const mob = E.mobUnit('harvest_reaper', L, role === 'healer' ? { hp: 1, dmg: +(process.env.HIT || 6) } : null); mob.maxHp = mob.hp = 1e9;
  if (role !== 'healer') mob.dmg = mob.dmg.map(() => 0);
  const C = E.fight(allies, [mob], role === 'healer' ? {} : { soloUid: b.uid });
  let out = 0;
  while (!C.over && C.t < SECS) {
    E.tick(C, 0.1);
    // healing: a party-wide hit every 6 sec (a boss's area attack: 10% of everyone's health, never the killing blow); at 20% every
    // healer class wipes and runs dry, so skill can't show
    if (role === 'healer' && !o.tankOnly && Math.floor(C.t / 6) > Math.floor((C.t - 0.1) / 6)) for (const a of allies) if (a.hp > 0) a.hp = Math.max(1, a.hp - a.maxHp * +(process.env.AOE || 0.1));
    for (const e of C.events.splice(0)) if (e.src === b.uid) { if (role === 'healer' ? e.type === 'heal' : e.type === 'dmg') out += e.amount + (landed ? 0 : e.over || 0); } // healing produced, overheal included: the output, whatever the incoming damage (landed: without overheal, to compare classes)
  }
  return o.tankOnly ? (tank.dead ? 1 : 0) : out / Math.max(1, C.t);
}
const stat = (xs) => { const m = xs.reduce((a, x) => a + x, 0) / xs.length; return { m, sd: Math.sqrt(xs.reduce((a, x) => a + (x - m) * (x - m), 0) / xs.length) }; };
const runs = (role, L, inst, skill, o) => stat(Array.from({ length: N }, () => fight(role, L, inst, skill, o)));

let ok = true;
const check = (cond, msg) => { console.log((cond ? 'ok   ' : 'FAIL ') + msg); if (!cond) ok = false; };
for (const role of ['dps', 'healer']) for (const L of LEVELS) {
  const per = {};
  for (const inst of INST) per[inst] = runs(role, L, inst, 0.9);
  const mean = INST.reduce((a, i) => a + per[i].m, 0) / INST.length;
  const line = INST.map((i) => `${i} ${per[i].m.toFixed(1)} ±${per[i].sd.toFixed(1)} (${((per[i].m / mean - 1) * 100).toFixed(1)}%)`).join(' · ');
  console.log(`${role} L${L} ${role === 'healer' ? 'healing' : 'damage'}/sec, skill 0.9, ${N} runs: ${line}`);
  check(INST.every((i) => Math.abs(per[i].m / mean - 1) <= 0.05), `${role} L${L}: every instrument within 5% of the mean`);
  const low = runs(role, L, 'lute', 0.4);
  console.log(`${role} L${L} lute skill 0.4: ${low.m.toFixed(1)} ±${low.sd.toFixed(1)} (${((low.m / per.lute.m - 1) * 100).toFixed(1)}% vs skill 0.9)`);
  check(low.m <= per.lute.m * 0.9, `${role} L${L}: missing beats costs at least 10%`);
  if (role === 'healer' && L === 60) { // party healing is the Bard's niche, but by a little: at most 10% over the best other healer here
    const others = ['priest', 'paladin', 'druid', 'shaman'].map((c) => [c, runs('healer', L, null, 0.9, { cls: c, landed: true }).m]), best = Math.max(...others.map((x) => x[1]));
    const bard = runs('healer', L, 'lute', 0.9, { landed: true }).m;
    console.log(`healer L${L} healing landed/sec: bard ${bard.toFixed(1)} · ` + others.map(([c, m]) => `${c} ${m.toFixed(1)}`).join(' · '));
    check(bard <= best * 1.1, `healer L${L}: the Bard heals at most 10% more than the best other healer`);
    // only the tank hurt: its songs heal a party that needs none, so one-target healing has to keep the tank up
    const lost = ['priest', 'paladin', 'druid', 'shaman'].map((c) => [c, runs('healer', L, null, 0.9, { cls: c, tankOnly: true }).m]), worst = Math.max(...lost.map((x) => x[1]));
    const bLost = runs('healer', L, 'lute', 0.9, { tankOnly: true }).m;
    console.log(`healer L${L} only the tank hurt, tank died: bard ${(bLost * 100).toFixed(0)}% · ` + lost.map(([c, m]) => `${c} ${(m * 100).toFixed(0)}%`).join(' · '));
    check(bLost <= worst + 0.05, `healer L${L}: with only the tank hurt, the Bard keeps it up as well as the other healers`);
  }
}
console.log(ok ? 'bard sim OK' : 'bard sim: a check failed');
process.exitCode = ok ? 0 : 1;
