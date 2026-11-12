// A mana potion in Bear or Cat Form (#601): the mana goes to the mana the form keeps, never to rage or energy.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

test('a mana potion in a form fills kept mana, not rage; the button only offers mana when mana is low', () => {
  const { S } = character(60, 'druid', 'human');
  G.addItem(G.copyItem('mana_potion'), 2);
  const id = S.player.bags.find((b) => b.item.slot === 'potion' && b.item.mana); assert.ok(id, 'a mana potion in the bags');
  S.player.place = Object.keys(D.PLACES).find((k) => { const p = D.PLACES[k]; return p.lvl && p.lvl[1] >= 55 && !p.safe && (p.mobs || []).length; });
  const m = G.placeMobs().find((x) => x.state === 'alive'); G.engage(m.id);
  const u = G.pUnit; u.hp = u.maxHp; u.resType = 'rage'; u.form = 'bear'; u.savedMana = 100; u.res = 0; u.maxRes = 100;
  assert.strictEqual(G.potionKind(), 'mana', 'kept mana is low, so mana is offered');
  S.player.potionAt = 0; G.usePotion('mana');
  assert.strictEqual(u.res, 0, 'rage untouched');
  assert.ok(u.savedMana > 100, 'kept mana went up');
  u.savedMana = u.st.maxMana; assert.strictEqual(G.potionKind(), null, 'full mana: health first');
});
