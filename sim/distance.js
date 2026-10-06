// Distance in combat (v10.9, stage 1): the rules themselves, each tested by placing fighters at set distances.
// docs/plans/2026-10-01-distance-design.md.   node sim/distance.js
require('./_seed.js'); // seeded (#125): the same commit always gives the same result; SEED=n picks other dice
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
require('../src/data.js'); require('../src/engine.js'); require('../src/bots.js'); require('../src/game.js');
const { G, D, E } = globalThis;
let ok = 0, bad = 0; const check = (c, m) => { if (c) ok++; else { bad++; console.log('FAIL', m); } };
G.newGame({ name: 'X', cls: 'warrior', race: 'human' });
const L = 40, DI = E.DIST;
const ch = (cls, side, role) => { const c = G.botChar({ name: cls + side, cls, race: 'human', level: L, skill: 0.6, role: role || 'dps' }); c.role = role || 'dps'; c.hp = null; c.res = null;
  const u = E.charUnit(c, side, 'bot', 0); u.bot = { skill: 0.6, react: 0.3 }; u.role = role || 'dps'; if (side === 'enemy') u.threat = {}; return u; };
const mob = (key, lvl) => E.mobUnit(key, lvl || L);
const at = (u, x, y, z) => { u.pos = { x, y: y || 0, z: z || 0 }; };
const run = (C, s) => { for (let k = 0; k < s / 0.1 && !C.over; k++) E.tick(C, 0.1); };

// 1. where a fight starts: in contact, except a group's back line (stage 4)
{
  const allies = ['warrior', 'priest', 'mage', 'rogue', 'hunter'].map((c, i) => ch(c, 'ally', ['tank', 'healer', 'dps', 'dps', 'dps'][i]));
  const C = E.fight(allies, [mob('defias_thug', 18), mob('defias_thug', 18), mob('defias_thug', 18)], {});
  // stage 4: the melee in contact; the casters, hunter and healer behind, still in reach of the monsters and the tank
  const tank = C.allies[0], back = C.allies.slice(1).filter((a) => a.cls !== 'rogue');
  check(C.enemies.every((e) => E.dist(tank, e) <= DI.melee) && C.enemies.every((e) => E.dist(C.allies[3], e) <= DI.melee), 'the tank and the rogue start in contact');
  check(back.every((a) => C.enemies.every((e) => E.dist(a, e) > 15 && E.dist(a, e) < 25)), `the healer, mage and hunter start 15-25 m back (${back.map((a) => Math.min(...C.enemies.map((e) => E.dist(a, e))).toFixed(0)).join(', ')} m)`);
  check(back.every((a) => E.dist(a, tank) <= DI.ally && C.enemies.every((e) => E.dist(a, e) <= E.rangeOf(D.ABILITIES.fireball))), 'from there they reach the monsters, and the healer reaches the tank');
  const solo = ch('mage', 'ally'), C1 = E.fight([solo], [mob('defias_thug', 18)], {}); check(E.dist(solo, C1.enemies[0]) <= DI.melee, 'alone, a caster still starts in contact');
}
// 2. ranges from the data
{
  const r = (id) => E.rangeOf(D.ABILITIES[id]);
  check(r('heroic_strike') === 5 && r('sinister_strike') === 5 && r('hamstring') === 5, 'weapon and physical attacks reach 5 m');
  check(r('fireball') === 30 && r('smite') === 30 && r('lightning_bolt') === 30, 'spells reach 30 m');
  check(r('arcane_shot') === 35 && r('aimed_shot') === 35 && r('wing_clip') === 5, 'shots reach 35 m, Wing Clip is melee');
  check(r('lesser_heal') === 40 && r('healing_touch') === 40, 'heals reach 40 m');
  check(r('charge') === 25 && r('intercept') === 25, 'charges reach 25 m');
  check(r('frost_nova') === null && r('blizzard') === 30 && r('hellfire') === null, 'Frost Nova and Hellfire land around the caster, Frost Storm at range');
}
// 3. out of range
{
  const m = ch('mage', 'ally'), w = ch('warrior', 'enemy'); const C = E.fight([m], [w], {}); at(m, 0); at(w, 40); m.target = w.uid;
  check(E.canUse(C, m, 'fireball', w) === 'Out of range', 'a spell cannot reach 40 m');
  at(w, 20); check(E.canUse(C, m, 'fireball', w) === null, 'a spell reaches 20 m');
  w.res = 100; check(E.canUse(C, w, 'heroic_strike', m) === 'Out of range', 'a sword cannot reach 20 m');
}
// 4. a melee fighter out of reach does not swing, it closes in at the running speed
{
  const w = ch('warrior', 'ally'), t = mob('defias_thug', L); const C = E.fight([w], [t], {}); at(w, 0); at(t, 20); w.target = t.uid; t.target = w.uid;
  t.stunUntil = 99; // the target stands still
  w.cds.charge = 999; // this check is about running, not Charge (bots open with it since issue #2)
  const hp0 = t.hp; E.tick(C, 0.1); check(t.hp === hp0, 'no swing from 20 m');
  run(C, 1); const d1 = E.dist(w, t); check(d1 > 11 && d1 < 15, `running closes about 7 m a second (${d1.toFixed(1)} m left after 1 s)`);
  run(C, 3); check(E.dist(w, t) <= DI.melee, 'it reaches melee range'); run(C, 3); check(t.hp < hp0, 'and then it hits');
}
// 5. snares slow movement; 6. roots stop it
{
  const w = ch('warrior', 'ally'), t = mob('defias_thug', L); const C = E.fight([w], [t], {}); at(w, 0); at(t, 30); w.target = t.uid; t.stunUntil = 99;
  w.auras.push({ id: 'test_slow', until: 99, slow: 50 }); run(C, 1); const moved = 30 - E.dist(w, t); check(moved > 2.5 && moved < 4.5, `a 50% snare halves the running speed (${moved.toFixed(1)} m in 1 s)`);
  w.auras = [{ id: 'test_root', until: 99, root: true }]; const d = E.dist(w, t); run(C, 2); check(Math.abs(E.dist(w, t) - d) < 0.01, 'a root holds a fighter in place');
}
{
  const m = ch('mage', 'ally'), w = ch('warrior', 'enemy'); const C = E.fight([m], [w], {}); at(m, 0); at(w, 3); m.res = m.maxRes;
  for (let i = 0; i < 6 && !w.auras.some((a) => a.root); i++) { m.cds = {}; m.gcdUntil = 0; m.res = m.maxRes; E.use(C, m, 'frost_nova'); }
  check(w.auras.some((a) => a.root), 'Frost Nova roots an enemy in its radius');
  const m2 = ch('mage', 'ally'), w2 = ch('warrior', 'enemy'), w3 = ch('warrior', 'enemy'); const C2 = E.fight([m2], [w2, w3], {}); at(m2, 0); at(w2, 3); at(w3, 14); m2.res = m2.maxRes;
  for (let i = 0; i < 6 && !w2.auras.some((a) => a.root); i++) { m2.cds = {}; m2.gcdUntil = 0; m2.res = m2.maxRes; E.use(C2, m2, 'frost_nova'); } // a spell can be resisted: cast again
  check(w2.auras.some((a) => a.root) && !w3.auras.some((a) => a.root), 'an area attack has a radius (3 m hit, 14 m not)');
}
// 7. a charge closes the gap at once
{
  const w = ch('warrior', 'ally'), t = ch('mage', 'enemy'); const C = E.fight([w], [t], {}); at(w, 0); at(t, 20); w.target = t.uid; w.res = 100;
  const why = E.use(C, w, 'charge', t.uid); check(why === null && E.dist(w, t) <= DI.melee, `Charge jumps into melee range (${why || E.dist(w, t).toFixed(1) + ' m'})`);
}
// 8. Step Back hops away; melee cannot reach until it closes again
{
  const m = ch('mage', 'ally'), w = ch('warrior', 'enemy'); const C = E.fight([m], [w], {}); at(m, 0); at(w, 3); w.target = m.uid; w.auras.push({ id: 'r', until: 2, root: true });
  const why = E.use(C, m, 'step_back'); check(why === null && E.dist(m, w) >= 10.5, `Step Back hops 8 m away (${why || E.dist(m, w).toFixed(1) + ' m'})`);
  w.res = 100; check(E.canUse(C, w, 'heroic_strike', m) === 'Out of range', 'the warrior cannot reach after the hop');
  check(E.canUse(C, m, 'step_back') === 'Not ready yet', 'Step Back has a cooldown');
}
// 9. a fear makes the target run away
{
  const p = ch('priest', 'ally'), w = ch('warrior', 'enemy'); const C = E.fight([p], [w], {}); at(p, 0); at(w, 3); p.res = p.maxRes; w.target = p.uid;
  E.use(C, p, 'psychic_scream'); run(C, 2); check(E.dist(p, w) > 10, `a feared enemy runs away (${E.dist(p, w).toFixed(1)} m after 2 s)`);
  const s = ch('shaman', 'ally'), e = ch('warrior', 'enemy'); const C2 = E.fight([s], [e], {}); at(s, 0); at(e, 3); s.race = 'tauren';
  check(!D.ABILITIES.war_stomp || !D.ABILITIES.war_stomp.fear, 'a stomp stuns without making anyone run');
}
// 10. a caster stands still to cast; a target that runs out of range during the cast is missed
{
  const m = ch('mage', 'ally'), w = ch('warrior', 'enemy'); const C = E.fight([m], [w], {}); at(m, 0); at(w, 25); m.target = w.uid; m.res = m.maxRes; m.kind = 'player'; m.auto = false; w.stunUntil = 99; w.kind = 'script'; w.auras.push({ id: 'r', until: 99, root: true }); // held where it is put (a racial could free it from the stun)
  E.use(C, m, 'fireball', w.uid); check(!!m.cast, 'a cast starts at 25 m');
  at(w, 45); const hp = w.hp, x = m.pos.x; let missed = false; for (let k = 0; k < 40; k++) { E.tick(C, 0.1); if (C.events.some((e) => e.type === 'castStop' && e.range)) missed = true; C.events.length = 0; }
  check(missed && w.hp === hp, 'the fireball misses a target that ran out of range');
}
// 11. a flyer high up is out of melee reach, but spells reach it
{
  const w = ch('warrior', 'ally'), m = ch('mage', 'ally'), f = mob('defias_thug', L); const C = E.fight([w, m], [f], {}); at(w, 0); at(m, -10); at(f, 1, 0, 10); w.target = f.uid;
  w.res = 100; check(E.canUse(C, w, 'heroic_strike', f) === 'Out of range', 'a sword cannot reach a flyer 10 m up');
  m.res = m.maxRes; check(E.canUse(C, m, 'fireball', f) === null, 'a spell reaches it');
  w.cds.charge = 999; // about standing still, not Charge (issue #2)
  const x0 = w.pos.x, t0 = w.pos.y; f.stunUntil = 99; f.auras.push({ id: 'r', until: 99, root: true }); run(C, 1); check(Math.abs(w.pos.x - x0) < 0.01 && Math.abs(w.pos.y - t0) < 0.01, 'a fighter right under a flyer stands still (no running back and forth)');
}
// 12. ranged monsters (stage 4): start behind their line, attack from range with their school, stand their ground
{
  const w = ch('warrior', 'ally'), m = mob('frostmane_seer', 9); w.level = 9; const C = E.fight([w], [m], {});
  check(E.dist(w, m) > 15, `a caster monster starts behind its line (${E.dist(w, m).toFixed(1)} m)`);
  w.stunUntil = 99; w.cds.charge = 999; w.cds.every_man = 999; m.target = w.uid; const hp = w.hp, x = m.pos.x; let bolt = false; for (let k = 0; k < 60; k++) { E.tick(C, 0.1); for (const e of C.events) if (e.type === 'dmg' && e.src === m.uid && e.school === 'frost') bolt = true; C.events.length = 0; } // about the bolt, not Charge (issue #2)
  check(bolt && w.hp < hp, 'it hits from range with a frost bolt');
  check(Math.abs(m.pos.x - x) < 0.01, 'it stays where it is to cast, it does not walk in');
  const h = mob('frostmane_headhunter', L), w2 = ch('warrior', 'ally'); const C2 = E.fight([w2], [h], {}); w2.stunUntil = 99; h.target = w2.uid; let shot = false;
  for (let k = 0; k < 200 && !shot; k++) { E.tick(C2, 0.1); for (const e of C2.events) if (e.type === 'dmg' && e.src === h.uid && e.school === 'physical' && !e.melee) shot = true; C2.events.length = 0; } // 20 sec: in 6, about 1 run in 30 missed every throw
  check(shot, 'a spear thrower throws from range (physical, not a melee swing)');
  const t = mob('frostmane_troll', 9), w3 = ch('warrior', 'ally'); const C3 = E.fight([w3], [t], {}); check(E.dist(w3, t) <= DI.melee, 'a melee monster still starts in contact');
}
// 13. stomps and screams reach 8 m; a group heal reaches 40 m (stage 4)
{
  const p = ch('priest', 'ally'), a = mob('defias_thug', L), b = mob('defias_thug', L); const C = E.fight([p], [a, b], {}); at(p, 0); at(a, 3); at(b, 20); p.res = p.maxRes;
  E.use(C, p, 'psychic_scream'); check(a.fleeUntil > C.t && !(b.fleeUntil > C.t), 'Psychic Scream scares a foe at 3 m, not one at 20 m');
  const pr = ch('bard', 'ally', 'healer'), n = ch('warrior', 'ally', 'tank'), f = ch('mage', 'ally'), th = mob('defias_thug', L); const C2 = E.fight([pr, n, f], [th], {}); at(pr, 0); at(n, 10); at(f, -50); th.stunUntil = 99; th.kind = 'mob';
  for (const u of [pr, n, f]) { u.hp = Math.round(u.maxHp / 2); u.kind = 'script'; } pr.res = pr.maxRes; const h0 = n.hp, f0 = f.hp;
  const why = E.use(C2, pr, 'chorus_grove'); for (let k = 0; k < 30; k++) E.tick(C2, 0.1);
  check(!why && n.hp > h0 && f.hp === f0, `a group heal (Chorus Grove) heals an ally at 10 m, not one at 50 m (${why || 'cast'})`);
}
// 14. flyers (stage 4): start up out of melee reach, dive to attack, climb again; a stun brings one down
{
  const w = ch('warrior', 'ally'), b = mob('black_dragon_whelp', L); const C = E.fight([w], [b], {}); w.res = 100; w.kind = 'script';
  check(b.pos.z >= DI.flyLow && E.canUse(C, w, 'heroic_strike', b) === 'Out of range', `a whelp starts on the wing, out of sword reach (${b.pos.z} m up)`);
  run(C, E.FLY.up + 1.5); w.res = 100; check(b.pos.z < DI.flyLow && E.canUse(C, w, 'heroic_strike', b) === null, `it dives to attack, and the sword reaches it (${b.pos.z.toFixed(1)} m)`);
  run(C, E.FLY.low); check(b.pos.z >= DI.flyLow, 'then it climbs again for a moment');
  b.stunUntil = C.t + 3; run(C, 1.2); check(b.pos.z < DI.flyLow, 'a stunned flyer cannot stay up');
  const m = ch('mage', 'ally'), b2 = mob('black_dragon_whelp', L); const C2 = E.fight([m], [b2], {}); m.res = m.maxRes; check(E.canUse(C2, m, 'fireball', b2) === null, 'a spell reaches a flyer up high');
}
console.log(`distance: ${ok}/${ok + bad} checks pass`);
process.exitCode = bad ? 1 : 0;
