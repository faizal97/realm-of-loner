// Bear Form held through the autosave (#217): the 10-second save wrote the character back with E.writeBack, which
// shifted the live fight unit out of its form, so Bear Form dropped by itself and rage reset. A save during a fight now
// writes the character's caster values from a copy and leaves the unit as it is; the end of a fight still shifts out.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, E, character, advance } = require('./world');

function bearFight() {
  const { P } = character(15, 'druid', 'human');
  P.place = Object.keys(D.PLACES).find((k) => { const p = D.PLACES[k]; return p.lvl && p.lvl[0] <= 15 && p.lvl[1] >= 15 && !p.safe && (p.mobs || []).length; });
  const m = G.placeMobs().find((x) => x.state === 'alive'); G.engage(m.id);
  assert.ok(G.fight, 'in a fight');
  for (const e of G.fight.enemies) { e.hp = e.maxHp = 1e6; e.dmg = [0, 0]; e.special = null; } // a fight that lasts and doesn't hurt
  G.useAbility('bear_form');
  assert.strictEqual(G.pUnit.form, 'bear', 'in Bear Form');
  return G.pUnit;
}

test('a save in the middle of a fight keeps Bear Form and rage', () => {
  const u = bearFight();
  u.res = 30;
  G.save();
  assert.strictEqual(G.pUnit, u, 'the same fight unit');
  assert.strictEqual(u.form, 'bear', 'still in Bear Form after the save');
  assert.strictEqual(u.resType, 'rage');
  assert.strictEqual(u.res, 30, 'rage kept');
});

test('the autosave over 15 seconds of fighting leaves the druid in Bear Form', () => {
  const u = bearFight();
  advance(15); // the autosave runs every 10 s
  assert.ok(G.fight, 'still fighting');
  assert.strictEqual(G.pUnit, u);
  assert.strictEqual(u.form, 'bear', 'Bear Form held through the autosave');
  assert.ok(u.res > 0, `rage builds up (${u.res})`);
});

test('the save writes the caster form: the mana kept from before the shift, and health within the caster maximum', () => {
  const u = bearFight();
  u.savedMana = 123; u.res = 40;
  G.save();
  const P = G.S.player, casterMax = E.statsFor(u.char, {}).maxHp;
  assert.strictEqual(P.res, 123, 'saved mana, not rage');
  assert.ok(P.hp >= 1 && P.hp <= casterMax, `saved health ${P.hp} fits the caster maximum ${casterMax}`);
});

test('the end of a fight still shifts the druid out', () => {
  const u = bearFight();
  E.writeBack(G.fight, u, Date.now());
  assert.strictEqual(u.form, null, 'writeBack at the end of a fight shifts out as before');
});
