// Class bugs found while writing the class guides (#231, #234-#244): each test fails on the code before its fix.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, E, character } = require('./world');

// a fight against a dummy that never dies and never hits back
function fight(level, cls, talents) {
  const { P } = character(level, cls, 'human');
  if (talents) P.talents = Object.assign({}, talents);
  P.place = Object.keys(D.PLACES).find((k) => { const p = D.PLACES[k]; return p.lvl && p.lvl[0] <= level && p.lvl[1] >= level && !p.safe && (p.mobs || []).length; }) || P.place;
  const m = G.placeMobs().find((x) => x.state === 'alive'); G.engage(m.id);
  const C = G.fight, u = G.pUnit;
  for (const e of C.enemies) { e.hp = e.maxHp = 1e7; e.dmg = [0, 0]; e.special = null; e.armor = 0; }
  u.res = u.maxRes = 1e6;
  return { C, u, e: C.enemies[0] };
}
const use = (C, u, id, tgt) => { u.gcdUntil = 0; u.cast = null; u.cds[id] = 0; return E.use(C, u, id, tgt && tgt.uid); };

test('shields are their own auras: a second shield no longer replaces the first', () => {
  const { C, u } = fight(60, 'priest');
  assert.strictEqual(use(C, u, 'pain_suppression', u), null);
  const big = u.auras.find((a) => a.id === 'pain_suppression');
  assert.ok(big && big.absorb > 1000, 'Pain Suppression absorbs');
  u.auras = u.auras.filter((a) => a.id !== 'weakened_soul');
  assert.strictEqual(use(C, u, 'pw_shield', u), null);
  assert.strictEqual(u.auras.find((a) => a.id === 'pain_suppression').absorb, big.absorb, 'Word of Warding left Pain Suppression alone');
  assert.ok(u.auras.find((a) => a.id === 'pw_shield').absorb > 0);
});

test('Holy Shield makes the extra threat its data gives it', () => {
  const { C, u, e } = fight(60, 'paladin');
  for (const x of C.enemies.slice(1)) x.dead = true;
  e.threat = {}; use(C, u, 'holy_shield', u);
  const amt = u.auras.find((a) => a.id === 'holy_shield').absorb;
  assert.ok(Math.abs(e.threat[u.uid] - amt * 0.5 * D.ABILITIES.holy_shield.threat) < 1, `threat ${e.threat[u.uid]} for ${amt} absorbed`);
});

test('a shield out of a fight is refused before it costs anything', () => {
  const { P } = character(60, 'warlock', 'human');
  const v = G.vitals(); P.res = v.maxRes;
  assert.strictEqual(G.castOutOfCombat('shadow_ward'), 'Use it in a fight.');
  assert.strictEqual(P.res, v.maxRes, 'no mana spent');
  assert.ok(!((P.cds || {}).shadow_ward > 0), 'no cooldown');
});

test('Improved Lightning Shield counts out of a fight too', () => {
  const { P } = character(60, 'shaman', 'human');
  P.res = 1e6; P.talents = {};
  G.castOutOfCombat('lightning_shield');
  const plain = P.auras.find((a) => a.id === 'lightning_shield').thorns.dmg;
  P.talents = { imp_lightning_shield: 3 }; G.castOutOfCombat('lightning_shield');
  assert.ok(P.auras.find((a) => a.id === 'lightning_shield').thorns.dmg > plain, 'stronger with the talent');
});

test('Arcane Missiles spends Arcane Surge, and its crits can light it again', () => {
  const { C, u, e } = fight(60, 'mage', { arcane_power: 1 });
  E.proc(C, u, 'crit', 'fireball');
  assert.ok(E.lit(u, 'arcane_missiles'), 'lit by a crit');
  u.st.spellCrit = 0; use(C, u, 'arcane_missiles', e);
  for (let i = 0; i < 40 && u.cast; i++) E.tick(C, 0.1);
  assert.ok(!E.lit(u, 'arcane_missiles'), 'the light was spent');
  u.st.spellCrit = 100; use(C, u, 'arcane_missiles', e);
  for (let i = 0; i < 40 && u.cast; i++) { E.tick(C, 0.1); u.st.spellCrit = 100; }
  assert.ok(E.lit(u, 'arcane_missiles'), 'a missile crit lit it again');
});

test('Rupture grows with combo points', () => {
  const bleed = (cp) => { const { C, u, e } = fight(60, 'rogue'); u.cp = cp; u.cpTarget = e.uid; use(C, u, 'rupture', e); return e.auras.find((a) => a.id === 'rupture').dot; };
  const one = bleed(1), five = bleed(5);
  assert.ok(Math.abs(five / one - 5) < 0.01, `5 points ${five}, 1 point ${one}`);
});

test('Relentless Strikes adds 20% to Rupture, not 44%', () => {
  const tick = (tal) => { const { C, u, e } = fight(60, 'rogue', tal); u.cp = 5; u.cpTarget = e.uid; use(C, u, 'rupture', e); const a = e.auras.find((x) => x.id === 'rupture'); const hp = e.hp; a.next = C.t; E.tick(C, 0.01); return hp - e.hp; };
  const r = tick({ relentless_strikes: 1 }) / tick({});
  assert.ok(r > 1.15 && r < 1.25, `ratio ${r.toFixed(3)}`);
});

test('Cleave can light Battle Fury', () => {
  const { C, u, e } = fight(60, 'warrior');
  const p = D.PROCS.warrior.find((x) => x.aura === 'battle_fury');
  const chance = p.chance; p.chance = 1;
  try { use(C, u, 'cleave', e); } finally { p.chance = chance; }
  assert.ok(E.lit(u, 'slam'), 'Slam is lit');
});

test('Thorned Aura strikes back in Holy under its own name, and adds to Thorns', () => {
  const { C, u, e } = fight(60, 'druid');
  u.auras.push({ id: 'thorns', until: C.t + 600, thorns: { dmg: 10, charges: 20 } });
  u.auras.push({ id: 'retribution_aura', until: C.t + 600, thorns: { dmg: 20, charges: 60 } });
  const seen = []; const ev0 = C.events.length;
  e.dmg = [5, 5]; e.st = e.st || {};
  for (let i = 0; i < 200 && seen.length < 2; i++) {
    E.tick(C, 0.1);
    for (const x of C.events.slice(ev0)) if (x.type === 'dmg' && x.src === u.uid && (x.ab === 'thorns' || x.ab === 'retribution_aura') && !seen.find((s) => s.ab === x.ab)) seen.push(x);
  }
  assert.deepStrictEqual(seen.map((x) => x.ab).sort(), ['retribution_aura', 'thorns']);
  assert.strictEqual(seen.find((x) => x.ab === 'retribution_aura').school, 'holy');
});

test('a talent reaction lights only the first ability you know', () => {
  const { C, u } = fight(60, 'hunter', { trueshot: 1 });
  E.proc(C, u, 'crit', 'arcane_shot');
  assert.ok(E.lit(u, 'chimera_shot'), 'Twinfang Shot lit');
  assert.ok(!E.lit(u, 'aimed_shot'), 'Aimed Shot is not');
});

test('aspects replace each other, and so do Demon Skin and Demon Armor', () => {
  for (const [cls, a, b] of [['hunter', 'aspect_monkey', 'aspect_hawk'], ['warlock', 'demon_skin', 'demon_armor']]) {
    const { C, u } = fight(60, cls);
    use(C, u, a, u); use(C, u, b, u);
    assert.ok(!u.auras.find((x) => x.id === a) && u.auras.find((x) => x.id === b), `${b} replaced ${a} in a fight`);
    const { P } = character(60, cls, 'human'); P.res = 1e6;
    G.castOutOfCombat(a); G.castOutOfCombat(b);
    assert.ok(!P.auras.find((x) => x.id === a) && P.auras.find((x) => x.id === b), `${b} replaced ${a} out of a fight`);
  }
});

test('Improved Word of Fortitude raises Prayer of Fortitude too', () => {
  const sta = (tal) => { const { C, u } = fight(60, 'priest', tal); use(C, u, 'prayer_of_fortitude', u); return u.auras.find((a) => a.id === 'pw_fortitude').stats.sta; };
  assert.ok(sta({ imp_fortitude: 5 }) > sta({}));
});

test("a Shaman's imbue adds damage to the weapon's shot from range", () => {
  const { C, u, e } = fight(30, 'shaman');
  use(C, u, 'flametongue_weapon', u);
  const ev0 = C.events.length;
  for (let i = 0; i < 300; i++) { u.lastCastT = -99; E.tick(C, 0.1); }
  assert.ok(C.events.slice(ev0).some((x) => x.type === 'dmg' && x.src === u.uid && x.ab === 'rockbiter_weapon'), 'imbue damage seen');
  void e;
});
