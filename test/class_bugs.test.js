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

test('Warrior and Priest can queue as Damage (#245)', () => {
  for (const [cls, main] of [['warrior', 'tank'], ['priest', 'healer']]) {
    character(30, cls, 'human');
    assert.deepStrictEqual(G.roles().slice().sort(), [main, 'dps'].sort(), cls);
    G.setRole('dps'); assert.strictEqual(G.role(), 'dps', cls);
  }
});

test('a Paladin tank has a taunt: Hand of Challenge (#245)', () => {
  const { C, u, e } = fight(30, 'paladin');
  assert.ok(G.knownAbilities().includes('hand_of_challenge'), 'on the bar at 30');
  e.threat = { 999: 5000 }; e.target = 999;
  assert.strictEqual(use(C, u, 'hand_of_challenge', e), null);
  assert.strictEqual(e.target, u.uid, 'it attacks the paladin');
  assert.ok(e.threat[u.uid] > 5000, 'top threat');
});

test('a caster at the back steps in for a close area attack, uses it, and walks back (#245)', () => {
  const { P } = character(60, 'mage', 'human');
  const tank = E.charUnit(G.botChar(Object.assign(require('./world').B.makeBot(9001, new Set(), { level: 60 }), { cls: 'warrior', role: 'tank' })), 'ally', 'bot', 1); tank.role = 'tank'; tank.bot = { skill: 1, react: 0.2 };
  const u = E.charUnit(P, 'ally', 'player', 1); u.role = 'dps';
  const key = Object.keys(D.MOBS).find((k) => { const M = D.MOBS[k]; return !M.boss && !M.elite && !M.ranged && M.lvl && M.lvl[0] <= 60 && M.lvl[1] >= 60; });
  const C = E.fight([tank, u], [0, 1, 2].map(() => E.mobUnit(key, 60, { hp: 20, dmg: 0.2 })), {});
  for (let i = 0; i < 30; i++) E.tick(C, 0.1); // the enemies reach the tank
  const start = { x: u.pos.x, y: u.pos.y };
  assert.ok(C.enemies.every((e) => E.dist(u, e) > 8), 'the mage stands back');
  u.res = 1e6; u.gcdUntil = 0;
  assert.strictEqual(E.use(C, u, 'arcane_explosion'), null);
  let hit = 0;
  for (let i = 0; i < 120; i++) { E.tick(C, 0.1); for (const e of C.events) if (e.type === 'dmg' && e.src === u.uid && e.ab === 'arcane_explosion') hit++; C.events.length = 0; }
  assert.ok(hit >= 2, `Arcane Explosion hit ${hit} enemies`);
  assert.ok(Math.hypot(u.pos.x - start.x, u.pos.y - start.y) < 1, 'back where it stood');
});

test('each recent Arcane Blast makes the next cost 50% more, up to 3 times, for 6 sec (#245)', () => {
  const { C, u, e } = fight(60, 'mage', {});
  const base = E.abCost(D.ABILITIES.arcane_blast, u), costs = [];
  for (let i = 0; i < 5; i++) { costs.push(E.abCost(D.ABILITIES.arcane_blast, u)); use(C, u, 'arcane_blast', e); for (let k = 0; k < 25 && u.cast; k++) E.tick(C, 0.1); }
  assert.deepStrictEqual(costs.map((c) => Math.round((c / base) * 10) / 10), [1, 1.5, 2, 2.5, 2.5]);
  for (let k = 0; k < 70; k++) E.tick(C, 0.1);
  assert.strictEqual(E.abCost(D.ABILITIES.arcane_blast, u), base, 'back to normal after 6 sec');
});

test('Chain Heal jumps to the 2 most hurt allies nearby for half and a quarter (#245)', () => {
  const { P } = character(60, 'shaman', 'human'); P.talents = {};
  const mk = (cls, i) => { const b = require('./world').B.makeBot(9100 + i, new Set(), { level: 60 }); b.cls = cls; const u = E.charUnit(G.botChar(b), 'ally', 'bot', i); u.bot = { skill: 0.5, react: 1 }; return u; };
  const u = E.charUnit(P, 'ally', 'player', 1), a = mk('warrior', 1), b = mk('rogue', 2), c = mk('mage', 3);
  const key = Object.keys(D.MOBS).find((k) => { const M = D.MOBS[k]; return !M.boss && M.lvl && M.lvl[0] <= 60 && M.lvl[1] >= 60; });
  const C = E.fight([u, a, b, c], [E.mobUnit(key, 60, { hp: 50, dmg: 0 })], { apart: 0 });
  for (const x of [u, a, b, c]) { x.pos = { x: 0, y: 0, z: 0 }; x.hp = x.maxHp * 0.3; }
  b.hp = b.maxHp * 0.2; u.res = 1e6; u.st.spellCrit = 0;
  use(C, u, 'chain_heal', a); for (let i = 0; i < 30 && u.cast; i++) E.tick(C, 0.1);
  const healed = C.events.filter((e) => e.type === 'heal' && e.ab === 'chain_heal');
  assert.strictEqual(healed.length, 3, 'three heals');
  assert.strictEqual(healed[1].tgt, b.uid, 'the most hurt one second');
  const raw = healed.map((e) => e.amount + e.over); // before overhealing
  assert.ok(Math.abs(raw[1] / raw[0] - 0.5) < 0.05 && Math.abs(raw[2] / raw[0] - 0.25) < 0.05, raw.join(' '));
});

test('a slow on a boss works at a quarter of its strength (#245)', () => {
  const { e } = fight(60, 'warrior');
  e.auras.push({ id: 'hamstring_slow', until: 1e9, slow: 50 });
  e.boss = false; assert.strictEqual(E.slowPct(e), 50);
  e.boss = true; assert.strictEqual(E.slowPct(e), 12.5);
});

test('Holy Shock heals a teammate and hurts an enemy; a healer aims it at their heal target (#245)', () => {
  const { C, u, e } = fight(60, 'paladin');
  u.hp = u.maxHp * 0.3; const hp0 = e.hp;
  assert.strictEqual(use(C, u, 'holy_shock', u), null);
  assert.ok(C.events.some((x) => x.type === 'heal' && x.ab === 'holy_shock' && x.tgt === u.uid), 'healed the ally');
  assert.strictEqual(e.hp, hp0, 'no damage when cast on an ally');
  C.events.length = 0;
  assert.strictEqual(use(C, u, 'holy_shock', e), null);
  assert.ok(e.hp < hp0, 'hurt the enemy');
  assert.ok(!C.events.some((x) => x.type === 'heal' && x.ab === 'holy_shock'), 'no heal when cast on an enemy');
  // the player's tap: a healer's goes to the heal target (here yourself), anyone else's to the enemy
  G.S.player.role = 'healer'; C.events.length = 0; u.cds.holy_shock = 0; u.gcdUntil = 0; u.target = e.uid;
  G.useAbility('holy_shock');
  assert.ok(C.events.some((x) => x.type === 'heal' && x.ab === 'holy_shock'), 'a healer heals with it');
  G.S.player.role = 'tank'; C.events.length = 0; u.cds.holy_shock = 0; u.gcdUntil = 0;
  G.useAbility('holy_shock');
  assert.ok(C.events.some((x) => x.type === 'dmg' && x.ab === 'holy_shock'), 'a tank hurts with it');
});

test('the Retribution Oath talents cover every Oath, Oath of Command too (#245)', () => {
  const seal = (talents) => { const { C, u } = fight(60, 'paladin', talents); use(C, u, 'seal_command'); return { v: u.auras.find((a) => a.id === 'seal').seal / (u.st.wSpeed / 2.5), cost: E.abCost(D.ABILITIES.seal_command, u) }; }; // per 2.5 sec of weapon speed
  const a = seal({}), b = seal({ imp_seal: 5, benediction: 5 });
  assert.ok(Math.abs(b.v / a.v - 1.15) < 0.001, `Improved Oaths: ${a.v} → ${b.v}`);
  assert.ok(b.cost < a.cost, `Benediction: ${a.cost} → ${b.cost}`);
});
