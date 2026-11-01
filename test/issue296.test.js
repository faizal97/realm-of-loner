// #296: long-press the bar's Potion to pick what it drinks: Auto (health first; in a fight mana unless under 60% health)
// or one potion from the bags, kept per character until it runs out, then back to Auto with one line.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, character } = require('./world');

const give = (id, n) => G.addItem(G.copyItem(id), n);
const count = (id) => G.S.player.bags.filter((b) => b.item.id === id).reduce((a, b) => a + b.n, 0);
const ready = () => { G.S.player.potionAt = 0; };

test('Auto by default: health first out of a fight', () => {
  character(40, 'mage'); give('greater_healing_potion', 2); give('greater_mana_potion', 2);
  assert.strictEqual(G.S.player.potionPick || null, null);
  assert.strictEqual(G.potionNext().item.id, 'greater_healing_potion');
  ready(); G.pressPotion(); assert.strictEqual(count('greater_healing_potion'), 1);
});

test('a picked potion: the button shows it and a tap drinks it, one per tap', () => {
  character(40, 'mage'); give('greater_healing_potion', 2); give('greater_mana_potion', 2);
  G.setPotionPick('greater_mana_potion');
  assert.strictEqual(G.potionNext().item.id, 'greater_mana_potion');
  ready(); G.pressPotion();
  assert.strictEqual(count('greater_mana_potion'), 1); assert.strictEqual(count('greater_healing_potion'), 2);
  assert.strictEqual(G.S.player.potionPick, 'greater_mana_potion', 'kept while some are left');
});

test('running out goes back to Auto, with one line', () => {
  character(40, 'mage'); give('greater_healing_potion', 2); give('greater_mana_potion', 1);
  G.setPotionPick('greater_mana_potion');
  const toasts = []; G.on('toast', (t) => toasts.push(t));
  ready(); G.pressPotion();
  assert.strictEqual(G.S.player.potionPick, null);
  assert.strictEqual(G.potionNext().item.id, 'greater_healing_potion');
  assert.ok(toasts.includes('Out of Greater Mana Potion. Potion button: Auto.'), toasts.join(' | '));
});

test('the cooldown is shared and unchanged', () => {
  character(40, 'mage'); give('greater_mana_potion', 3); G.setPotionPick('greater_mana_potion');
  ready(); G.pressPotion(); G.pressPotion();
  assert.strictEqual(count('greater_mana_potion'), 2, 'the second tap is on cooldown');
});

test('the picker lists only potions the character can use, stacks counted together', () => {
  character(20, 'warrior'); give('healing_potion', 2); give('healing_potion', 1); give('lesser_mana_potion', 2); give('greater_healing_potion', 1);
  const o = G.potionOptions().map((x) => `${x.item.id} ${x.n}`);
  assert.deepStrictEqual(o, ['healing_potion 3'], 'no mana for a warrior, nothing above their level');
});
