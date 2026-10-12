// Bear Form and its own abilities (#233): in Bear Form a Druid couldn't use Frenzied Regeneration or Barkskin (every
// ability without a form was refused), so Wild Heart lit an ability nobody could press; and the bar in Bear Form listed
// only Bear Form, Maul, Growl and Swipe, so Bash and Feral Charge (Bear Form only) never reached it.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, E, character } = require('./world');

function bearFight(level) {
  const { P } = character(level, 'druid', 'human');
  P.place = Object.keys(D.PLACES).find((k) => { const p = D.PLACES[k]; return p.lvl && p.lvl[0] <= level && p.lvl[1] >= level && !p.safe && (p.mobs || []).length; }) || P.place;
  const m = G.placeMobs().find((x) => x.state === 'alive'); G.engage(m.id);
  for (const e of G.fight.enemies) { e.hp = e.maxHp = 1e6; e.dmg = [0, 0]; e.special = null; }
  G.useAbility('bear_form');
  assert.strictEqual(G.pUnit.form, 'bear', 'in Bear Form');
  return G.pUnit;
}

test('Frenzied Regeneration and Barkskin work in Bear Form; spells still do not', () => {
  const u = bearFight(60);
  u.gcdUntil = 0; u.res = 1000; // more than any cost, so the form rule is what answers
  const why = (id) => E.canUse(G.fight, u, id, G.fight.units[u.target]) || 'OK';
  assert.strictEqual(why('frenzied_regeneration'), 'OK');
  assert.strictEqual(why('barkskin'), 'OK');
  for (const id of ['wrath', 'healing_touch', 'rejuvenation', 'innervate']) assert.strictEqual(why(id), 'Not while in Bear Form', id);
});

test('the bar in Bear Form has every bear ability the Druid knows', () => {
  bearFight(60);
  const known = G.knownAbilities();
  for (const id of ['bear_form', 'maul', 'growl', 'swipe', 'bash', 'feral_charge', 'barkskin', 'frenzied_regeneration']) assert.ok(known.includes(id), id);
  for (const id of ['wrath', 'healing_touch', 'innervate']) assert.ok(!known.includes(id), id);
});

test('a level 20 bear only gets what it has learned', () => {
  bearFight(20);
  assert.deepStrictEqual(G.knownAbilities().slice().sort(), ['bear_form', 'growl', 'maul', 'swipe']);
});
