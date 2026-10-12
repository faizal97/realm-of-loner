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

test('a bot bear tank uses Swipe on a pack, and Barkskin and Frenzied Regeneration when hurt', () => {
  const { P } = character(60, 'druid', 'human');
  const u = E.charUnit(P, 'ally', 'bot', 1); u.bot = { skill: 1, react: 0.2 }; u.role = 'tank';
  const key = Object.keys(D.MOBS).find((k) => { const M = D.MOBS[k]; return !M.boss && !M.elite && M.lvl && M.lvl[0] <= 60 && M.lvl[1] >= 60; });
  const C = E.fight([u], [0, 1, 2].map(() => E.mobUnit(key, 60, { hp: 20, dmg: 1.5 })), {});
  const used = {};
  for (let i = 0; i < 1500 && !C.over; i++) { E.tick(C, 0.1); for (const e of C.events) if (e.type === 'ability' && e.src === u.uid) used[e.ab] = (used[e.ab] || 0) + 1; C.events.length = 0; }
  for (const id of ['bear_form', 'swipe', 'barkskin', 'frenzied_regeneration']) assert.ok(used[id], `${id} used (${JSON.stringify(used)})`);
});

test('Innervate refills mana while you keep casting', () => {
  const { P } = character(60, 'druid', 'human');
  const u = E.charUnit(P, 'ally', 'player', 1);
  const key = Object.keys(D.MOBS).find((k) => { const M = D.MOBS[k]; return !M.boss && !M.elite && M.lvl && M.lvl[0] <= 60 && M.lvl[1] >= 60; });
  const C = E.fight([u], [E.mobUnit(key, 60, { hp: 50, dmg: 0 })], {});
  u.res = 100; u.gcdUntil = 0; E.use(C, u, 'innervate');
  const r0 = u.res;
  for (let i = 0; i < 200; i++) { u.lastCastT = C.t; E.tick(C, 0.1); } // casting the whole time
  assert.ok(u.res - r0 > 500, `gained ${Math.round(u.res - r0)} mana while casting`);
});
