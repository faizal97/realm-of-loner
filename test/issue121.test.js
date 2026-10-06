// Dying in the same moment as killing a mob (#121). The rule the engine already has: a solo fight is won when its last
// enemy falls (it checks the enemies first), so a kill landing in the same moment as your death counts and you live,
// left at 1 HP, never alive at 0. A fight always ends: a win, or a death with the ghost run, and even a step of the
// ending that throws can't leave the fight open (it used to be retried every frame, paying the kill again each time,
// until a refresh).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, E, character, advance } = require('./world');

// your HP the moment a fight ends, before any rest (regen would hide a 0)
let hpAtEnd = null; G.on('fightEnd', () => { hpAtEnd = G.S.player.hp; });
const hunt = Object.keys(D.PLACES).find((k) => { const p = D.PLACES[k]; return p.lvl && p.lvl[0] <= 22 && p.lvl[1] >= 22 && !p.safe && (p.mobs || []).length; });
// a level-22 character in a fight with one creature of the zone
function fight(cls) {
  const { P } = character(22, cls || 'warrior', 'human'); P.place = hunt;
  const m = G.placeMobs().find((x) => x.state === 'alive'); G.engage(m.id);
  assert.ok(G.fight, 'in a fight'); return { P, C: G.fight, pu: G.pUnit, mu: G.fight.enemies[0], inst: m };
}
// one game step at a time, the way the game's frame loop calls it; a throw is caught and counted, as the loop now does
function steps(sec) { let threw = 0; for (let i = 0; i < sec * 4; i++) { try { advance(0.25); } catch (e) { threw++; } } return threw; }

test('both reach 0 in the same moment: the kill counts, and you live at 1 HP (no death, no ghost)', () => {
  const { P, C, pu, mu, inst } = fight();
  const xp0 = P.xp, lvl0 = P.level, deaths0 = P.deaths || 0;
  E.kill(C, pu, mu); E.kill(C, mu, pu); // the mob's last hit and your killing blow, in one step
  steps(1);
  assert.strictEqual(G.fight, null, 'the fight is over');
  assert.strictEqual(C.over, 'win', 'the kill counts');
  assert.ok(hpAtEnd >= 1, `alive with at least 1 HP when the fight ends (was ${hpAtEnd})`);
  assert.ok(!P.ghostUntil, 'no ghost run'); assert.strictEqual(P.deaths || 0, deaths0, 'no death counted');
  assert.ok(P.xp > xp0 || P.level > lvl0, 'the kill gave experience'); assert.strictEqual(inst.state, 'dead', 'the creature is down');
});

test("the mob's hit and your killing blow in the same update always end cleanly: a win alive, or a death", () => {
  const seen = { win: 0, lose: 0 };
  for (let i = 0; i < 60; i++) {
    const { P, C, pu, mu } = fight(['warrior', 'rogue', 'hunter', 'warlock', 'paladin', 'priest'][i % 6]);
    const deaths0 = P.deaths || 0;
    pu.hp = 1; mu.hp = 1; pu.swingT = 0; mu.swingT = 0; // both swing on the next step
    steps(2);
    assert.strictEqual(G.fight, null, 'the fight ended');
    if (C.over === 'win') { assert.ok(hpAtEnd >= 1 && !P.ghostUntil && (P.deaths || 0) === deaths0, 'a win leaves you alive'); }
    else { assert.strictEqual(C.over, 'lose'); assert.ok(P.ghostUntil > 0 && P.deaths === deaths0 + 1, 'a death runs the ghost'); }
    seen[C.over]++;
  }
  assert.ok(seen.win + seen.lose === 60, JSON.stringify(seen));
});

test('a step of the fight\'s ending that throws never leaves the fight open or pays the kill twice', () => {
  const { P, C, pu, mu } = fight();
  const real = G.gainXp; let calls = 0;
  G.gainXp = function () { calls++; if (calls === 1) throw new Error('a reward step failed'); return real.apply(this, arguments); };
  try {
    E.kill(C, mu, pu);
    const threw = steps(3);
    assert.strictEqual(threw, 1, 'the error surfaces once');
    assert.strictEqual(G.fight, null, 'the fight is closed anyway, so the game goes on');
    assert.strictEqual(calls, 1, 'the kill is not paid again on the next frames');
  } finally { G.gainXp = real; }
  assert.ok(P.hp >= 1);
});

// The report was an Orc Mage. A Mage's damage after death goes through the same ending: Fireball's burn sits on the mob
// and still ticks with you dead (the only damage that does: a dead caster's cast or channel stops), so it can kill the
// mob in the step you die, and the fight ends as above.
test("an Orc Mage's Fireball burn killing the mob in the step the Mage dies: the kill counts, alive at 1 HP", () => {
  const { P, C, pu, mu } = fight('mage'); P.race = 'orc';
  for (let i = 0; i < 40 && !mu.auras.some((a) => a.id === 'fireball_burn'); i++) { if (!pu.cast) G.useAbility('fireball'); steps(0.25); }
  const burn = mu.auras.find((a) => a.id === 'fireball_burn'); assert.ok(burn, 'the burn is on the mob');
  burn.next = C.t; mu.hp = 1; // the burn's next tick is due now, and it will kill the mob
  E.kill(C, pu, mu); // the mob's hit kills the Mage first, in the same step
  steps(1);
  assert.strictEqual(C.over, 'win', 'the burn landed the kill'); assert.ok(mu.dead);
  assert.ok(hpAtEnd >= 1 && !P.ghostUntil, `alive at 1 HP (was ${hpAtEnd})`);
});

test("a dead Mage's Arcane Missiles stop: no kill after death, so it is a clean death", () => {
  const { P, C, pu, mu } = fight('mage'); pu.res = pu.maxRes; // a test character starts the fight with no mana
  for (let i = 0; i < 20 && !(pu.cast && pu.cast.channel); i++) { G.useAbility('arcane_missiles'); steps(0.25); }
  assert.ok(pu.cast && pu.cast.channel, 'channelling'); mu.hp = 1; mu.auras = [];
  E.kill(C, pu, mu); steps(2);
  assert.strictEqual(C.over, 'lose'); assert.ok(!mu.dead, 'no missile landed from a dead Mage'); assert.ok(P.ghostUntil > 0, 'the ghost run');
});
