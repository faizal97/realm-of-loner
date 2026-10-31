// The bar's Potion button shows the potion a tap drinks (#279): a Mana Potion when that is all you carry, a healing
// potion out of a fight or when you are hurt, and a mana potion in a fight while your health is fine.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

const bags = (P, ids) => { P.bags = []; for (const id of ids) G.addItem(D.ITEMS[id], 1); };
const heal = () => Object.keys(D.ITEMS).find((k) => D.ITEMS[k].slot === 'potion' && D.ITEMS[k].heal && (D.ITEMS[k].lvl || 1) <= 30);

test('only a mana potion: the button is that mana potion', () => {
  const { P } = character(30, 'mage');
  bags(P, ['mana_potion']);
  assert.strictEqual(G.potionNext().item.id, 'mana_potion');
  assert.strictEqual(G.potionNext().item.icon, 'potion_blue');
});

test('both: health first out of a fight; in a fight mana while health is fine, health once under 60%', () => {
  const { P } = character(30, 'mage');
  bags(P, ['mana_potion', heal()]);
  G.fight = null; G.pUnit = null;
  assert.ok(G.potionNext().item.heal, 'out of a fight: health');
  G.pUnit = { hp: 900, maxHp: 1000 };
  assert.strictEqual(G.potionNext().item.id, 'mana_potion', 'in a fight, healthy: mana');
  G.pUnit.hp = 500;
  assert.ok(G.potionNext().item.heal, 'in a fight, hurt: health');
  G.pUnit = null;
});

test('no potions: nothing', () => {
  const { P } = character(30, 'mage');
  bags(P, []);
  assert.strictEqual(G.potionNext(), undefined);
});
