// A bear tank's upgrades (#533): the upgrade check scored every druid as a caster, so a level-60 druid tanking was told a
// caster belt (Intellect, Spirit) beat its tank belt, and a tank belt was never an upgrade over a caster one. The score now
// follows the role: a druid tank weighs what Bear Form uses (Strength for attack power, Stamina and armor, both multiplied
// in the form). Plain items (no effect: an effect item shows ◆ Effect instead of an upgrade arrow).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, character } = require('./world');

const belt = (stats, armor, q) => ({ id: 'gen_test_waist', name: 'Test Belt', slot: 'waist', lvl: 60, q: q || 3, atype: 'leather', stats, armor });
const tankBelt = () => belt({ sta: 16, agi: 15 }, 150);
const casterBelt = () => belt({ int: 18, spi: 15 }, 150);

test('a druid tank is not told a caster belt beats its tank belt', () => {
  const { P } = character(60, 'druid', 'human'); P.role = 'tank';
  P.equip.waist = tankBelt();
  assert.strictEqual(G.isUpgrade(casterBelt()), false);
});

test('a druid tank is told a tank belt beats its caster belt', () => {
  const { P } = character(60, 'druid', 'human'); P.role = 'tank';
  P.equip.waist = casterBelt();
  assert.strictEqual(G.isUpgrade(tankBelt()), true);
});

test('a druid healer still weighs Intellect and Spirit', () => {
  const { P } = character(60, 'druid', 'human'); P.role = 'healer';
  P.equip.waist = tankBelt();
  assert.strictEqual(G.isUpgrade(casterBelt()), true);
  P.equip.waist = casterBelt();
  assert.strictEqual(G.isUpgrade(tankBelt()), false);
});
