// Heal numbers float as whole numbers (#603): health in a fight is always whole, whatever left a fraction before it.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, E } = require('./world');

const unit = (cls, name, hp) => { const c = G.botChar({ name: name || cls, cls, race: 'human', level: 60, skill: 0.6 }); if (hp != null) c.hp = hp; const u = E.charUnit(c, 'ally', 'bot', 1); u.res = u.maxRes; u.bot = { skill: 0.6, afkUntil: 1e9 }; return u; };
const mob = () => { const m = E.mobUnit(Object.keys(D.MOBS).find((k) => D.MOBS[k].lvl && !D.MOBS[k].boss), 60, { hp: 1, dmg: 0 }); m.maxHp = m.hp = 1e7; return m; };
const healAmounts = (C, from) => C.events.slice(from).filter((e) => e.type === 'heal').map((e) => e.amount);

test('a party member who rested to a fraction of health enters the fight with whole health (#603)', () => {
  assert.strictEqual(unit('hunter', 'H', 2546.2999999999997).hp, 2546);
});

test('Kinship Totem leaves whole health, so the heal after it floats a whole number (#603)', () => {
  const s = unit('shaman'), a = unit('warrior', 'A'), b = unit('mage', 'B'), C = E.fight([s, a, b], [mob()], { apart: 0 });
  a.hp = Math.round(a.maxHp * 0.2) + 1; b.hp = b.maxHp - 7; s.hp = s.maxHp - 3;
  s.gcdUntil = 0; s.cast = null; assert.strictEqual(E.use(C, s, 'kinship_totem'), null);
  for (let i = 0; i < 21; i++) E.tick(C, 0.1);
  for (const w of [s, a, b]) assert.ok(Number.isInteger(w.hp), `${w.name}: ${w.hp}`);
  const n0 = C.events.length; E.heal(C, s, a, 333.3, { ab: 'healing_wave' });
  assert.deepStrictEqual(healAmounts(C, n0).filter((x) => !Number.isInteger(x)), []);
});

test('a heal on a fraction of health lands on whole health and reports a whole amount (#603)', () => {
  const p = unit('priest'), a = unit('warrior', 'A'), C = E.fight([p, a], [mob()], { apart: 0 });
  a.hp = 1000.45;
  const n0 = C.events.length; E.heal(C, p, a, 200.2, { ab: 'heal' });
  assert.ok(Number.isInteger(a.hp), `${a.hp}`);
  const got = healAmounts(C, n0); assert.ok(got.length);
  assert.deepStrictEqual(got.filter((x) => !Number.isInteger(x)), []);
});
