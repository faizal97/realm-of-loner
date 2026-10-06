// Class reactions (v10.4, D.PROCS) and the early game: the mechanics, how many different buttons each class uses in
// fights at levels 1-10 (target: 3 or more by level 4), and how much the reactions change a fight (small).
//   node sim/reactions.js
require('./_seed.js'); // seeded (#125): the same commit always gives the same result; SEED=n picks other dice
globalThis.localStorage = (() => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; })();
require('../src/data.js'); require('../src/engine.js'); require('../src/bots.js'); require('../src/game.js');
const { G, D, E } = globalThis;
let bad = 0, n = 0; const ok = (c, m) => { n++; if (!c) { bad++; console.log('FAIL ' + m); } };
const CLASSES = Object.keys(D.CLASSES).filter((c) => !D.CLASSES[c].hidden);
const mobFor = (L) => Object.keys(D.MOBS).find((k) => { const M = D.MOBS[k]; return !M.boss && !M.elite && !M.named && !M.special && !M.hpMult && !M.dmgMult && M.lvl && M.lvl[0] <= L && M.lvl[1] >= L && M.family === 'beast'; }); // a plain beast
function fight(cls, L, opts) {
  G.newGame({ name: 'R', cls, race: cls === 'shaman' || cls === 'hunter' ? 'orc' : 'human' }); const P = G.S.player; P.level = L; P.hp = null; P.res = null; // full health and mana at the new level
  if (L >= 4) for (const slot of D.GEAR_SLOTS) { if (slot === 'ranged' && !D.CLASSES[cls].ranged) continue; const it = G.genGear(slot, L, 2, slot === 'weapon' ? { wtype: D.CLASSES[cls].weapons[0] } : { atype: D.CLASSES[cls].armorType }); if (G.canUseItem(it, cls)) P.equip[slot] = it; } // quest greens, like a real player
  const u = E.charUnit(P, 'ally', 'bot', Date.now()); u.bot = { skill: 0.75, react: 0.45 }; u.role = 'dps';
  const m = E.mobUnit(mobFor(L), L, opts && opts.long ? { hp: 2.5, dmg: 1 } : null); // long: a tougher fight, like an elite or a dungeon pull
  const C = E.fight([u], [m], {});
  const used = new Set(); let procs = 0, litUses = 0;
  for (let i = 0; i < 1200 && !C.over; i++) {
    E.tick(C, 0.1);
    for (const e of C.events) {
      if (e.src !== u.uid) continue;
      if (e.type === 'proc') procs++;
      if (e.type === 'ability') { used.add(e.ab); if (opts && opts.lit && opts.lit.has(e.ab)) litUses++; }
    }
    C.events.length = 0;
  }
  const longBuff = (a) => { const A = D.ABILITIES[a]; return !A || (A.buff && (A.buff.dur || 0) >= 300); }; // Frost Armor, Fortitude and the like are not rotation buttons
  return { used: [...used].filter((a) => !longBuff(a)), secs: C.t, won: C.over === 'win', over: C.over, mob: m.key, procs, litUses };
}

// ---- the mechanics
{
  G.newGame({ name: 'M', cls: 'mage', race: 'human' }); const P = G.S.player; P.level = 6;
  const u = E.charUnit(P, 'ally', 'bot', Date.now()), m = E.mobUnit(mobFor(6), 6), C = E.fight([u], [m], {});
  u.cds.fire_blast = C.t + 99; const pr = D.PROCS.mage[0], save = pr.chance; pr.chance = 1;
  E.proc(C, u, 'hit', 'fireball');
  ok(E.lit(u, 'fire_blast') && (u.cds.fire_blast || 0) <= C.t && E.abCost(D.ABILITIES.fire_blast, u) === 0, 'Ember Spark: Fire Blast lit, ready and free');
  ok(C.events.some((e) => e.type === 'proc' && e.src === u.uid), 'a proc tells the UI');
  const res0 = u.res; E.use(C, u, 'fire_blast', m.uid);
  ok(!E.lit(u, 'fire_blast') && u.res === res0, 'using it spends the light, and it cost nothing');
  E.proc(C, u, 'hit', 'frostbolt'); ok(!E.lit(u, 'fire_blast'), 'only Fireball lights it');
  pr.chance = save;
}
{
  G.newGame({ name: 'W', cls: 'warrior', race: 'human' }); const P = G.S.player; P.level = 2;
  const u = E.charUnit(P, 'ally', 'bot', Date.now()), m = E.mobUnit(mobFor(2), 2), C = E.fight([u], [m], {}); u.res = 50;
  ok(E.canUse(C, u, 'overpower', m) === 'Not lit yet', 'Overpower needs its light');
  E.proc(C, u, 'avoided', null);
  ok(E.canUse(C, u, 'overpower', m) === null && E.use(C, u, 'overpower', m.uid) === null && !E.lit(u, 'overpower'), 'after a dodge or miss it can be used once');
  G.S.player.level = 1; const u1 = E.charUnit(G.S.player, 'ally', 'bot', Date.now()); const C1 = E.fight([u1], [E.mobUnit(mobFor(2), 2)], {});
  E.proc(C1, u1, 'avoided', null); ok(!E.lit(u1, 'overpower'), 'nothing lights before the ability is learned');
}
{
  G.newGame({ name: 'Pr', cls: 'priest', race: 'human' }); const P = G.S.player; P.level = 4;
  const u = E.charUnit(P, 'ally', 'bot', Date.now()), m = E.mobUnit(mobFor(4), 4), C = E.fight([u], [m], {});
  const pr = D.PROCS.priest[0], save = pr.chance; pr.chance = 1; E.proc(C, u, 'hit', 'smite'); pr.chance = 0; // no re-light from this Smite's own hit
  u.gcdUntil = 0; E.use(C, u, 'smite', m.uid); pr.chance = save;
  ok(!u.cast && !E.lit(u, 'smite'), 'Dawnlight: the next Smite is instant, and spends the light');
}


// ---- second reactions: they start at their level, and happen in mid-game fights
for (const cls of CLASSES) {
  const mid = (D.PROCS[cls] || []).find((p) => p.minLvl);
  ok(!!mid, `${cls}: has a second, mid-game reaction`);
  if (!mid) continue;
  G.newGame({ name: 'Mid', cls, race: cls === 'shaman' || cls === 'hunter' ? 'orc' : 'human' }); G.S.player.level = mid.minLvl - 1;
  const lo = E.charUnit(G.S.player, 'ally', 'bot', Date.now()), C0 = E.fight([lo], [E.mobUnit(mobFor(20), 20)], {});
  const save = mid.chance; mid.chance = 1; for (const f of mid.from || [null]) for (const on of mid.on) E.proc(C0, lo, on, f);
  ok(!mid.lights.some((l) => E.lit(lo, l)), `${cls}: ${mid.name} is off before level ${mid.minLvl}`);
  G.S.player.level = mid.minLvl; const hi = E.charUnit(G.S.player, 'ally', 'bot', Date.now()), C1 = E.fight([hi], [E.mobUnit(mobFor(20), 20)], {});
  for (const f of mid.from || [null]) for (const on of mid.on) E.proc(C1, hi, on, f);
  mid.chance = save;
  ok(mid.lights.some((l) => E.lit(hi, l)), `${cls}: ${mid.name} lights at level ${mid.minLvl}`);
}

// ---- talent reactions: each capstone brings one; only with the talent; it lights something at level 60
{
  let caps = 0;
  for (const cls of CLASSES) for (const tr of D.TALENTS[cls]) {
    const cap = tr.talents.find((t) => t.tier === 3), pr = (D.PROCS[cls] || []).find((p) => p.talent === cap.id);
    ok(!!pr, `${cls} ${tr.id}: the capstone ${cap.name} brings a reaction`); if (!pr) continue; caps++;
    G.newGame({ name: 'Cap', cls, race: cls === 'shaman' || cls === 'hunter' ? 'orc' : 'human' }); const P = G.S.player; P.level = 60;
    const u0 = E.charUnit(P, 'ally', 'bot', Date.now()), C0 = E.fight([u0], [E.mobUnit(mobFor(60), 60)], {});
    const save = pr.chance; pr.chance = 1; for (const f of pr.from || [null]) for (const on of pr.on) E.proc(C0, u0, on, f);
    ok(!pr.lights.some((l) => E.lit(u0, l)), `${cls}: ${pr.name} needs its talent`);
    P.talents = Object.assign({}, P.talents, { [cap.id]: 1 });
    const u1 = E.charUnit(P, 'ally', 'bot', Date.now()), C1 = E.fight([u1], [E.mobUnit(mobFor(60), 60)], {});
    for (const f of pr.from || [null]) for (const on of pr.on) E.proc(C1, u1, on, f);
    pr.chance = save;
    ok(pr.lights.some((l) => E.lit(u1, l)), `${cls}: ${pr.name} lights with its talent at 60`);
  }
  ok(caps === CLASSES.length * 3, `every capstone has a reaction (${caps})`);
}
// ---- the early game: different buttons per fight, by level (target: 3 or more by level 4)
const report = [];
for (const cls of CLASSES) {
  const lit = new Set((D.PROCS[cls] || []).flatMap((p) => p.lights));
  const row = [];
  for (const L of [1, 2, 4, 6, 10]) {
    let used = 0, procs = 0, lits = 0, won = 0; const N = 6;
    for (let i = 0; i < N; i++) { const r = fight(cls, L, { lit, long: true }), w = fight(cls, L); won += w.won ? 1 : 0; used += r.used.length; procs += r.procs; lits += r.litUses; if (!w.won && process.env.RX_DEBUG) console.log('  lost', cls, L, w.over, w.mob, w.secs.toFixed(1)); }
    row.push({ L, used: used / N, procs: procs / N, lits: lits / N, won: won / N });
  }
  report.push(`${cls.padEnd(8)} ${row.map((r) => `L${r.L}: ${r.used.toFixed(1)} buttons, ${r.procs.toFixed(1)} lights`).join(' | ')}`);
  const combat = D.CLASSES[cls].abilities.filter((a) => { const A = D.ABILITIES[a]; return A.lvl <= 4 && !(A.buff && (A.buff.dur || 0) >= 300) && A.target !== 'party'; });
  ok(combat.length >= 3, `${cls}: knows 3 or more combat buttons by level 4 (${combat.map((a) => D.ABILITIES[a].name).join(', ')})`);
  ok(row.filter((r) => r.L >= 4).some((r) => r.procs > 0), `${cls}: its reaction happens in early fights`);
  ok(row.every((r) => r.won >= 0.5), `${cls}: still wins its early fights`);
}
console.log(report.join('\n'));

// ---- how much the reactions change a fight: kill time with and without them, level 10
{
  const keep = D.PROCS; const t = (on) => { D.PROCS = on ? keep : {}; let s = 0; const N = 8; for (const cls of CLASSES) for (let i = 0; i < N; i++) s += fight(cls, 10).secs; return s / (N * CLASSES.length); };
  const off = t(false), on = t(true); D.PROCS = keep;
  console.log(`kill time at level 10: ${off.toFixed(1)}s without reactions, ${on.toFixed(1)}s with`);
  ok(on >= off * 0.8, `reactions speed fights up by at most 20% (${((1 - on / off) * 100).toFixed(0)}%)`);
}
console.log(`reactions: ${n - bad}/${n} checks pass`);
process.exit(bad ? 1 : 0);
