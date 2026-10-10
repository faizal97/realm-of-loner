// Selling at a vendor (#168): a grey or white sells on one tap; a green or better, or an upgrade, asks first; every sale
// reports what sold, how many and for how much (the vendor's "Last sale" line reads it).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

test('green or better, or an upgrade, asks before it sells; grey and white do not', () => {
  const { P } = character(20, 'warrior', 'human');
  const grey = G.genGear('chest', 20, 0, { atype: 'mail' }), white = G.genGear('chest', 1, 1, { atype: 'mail' }), green = G.genGear('legs', 20, 2, { atype: 'mail' }), blue = G.genGear('feet', 20, 3, { atype: 'mail' });
  assert.strictEqual(G.sellNeedsConfirm(grey), false);
  assert.strictEqual(G.sellNeedsConfirm(white), false);
  assert.strictEqual(G.sellNeedsConfirm(green), true);
  assert.strictEqual(G.sellNeedsConfirm(blue), true);
  delete P.equip.wrist; const up = G.genGear('wrist', 20, 1, { atype: 'mail' }); // a white for an empty slot is an upgrade
  assert.ok(G.isUpgrade(up)); assert.strictEqual(G.sellNeedsConfirm(up), true);
  assert.strictEqual(G.sellNeedsConfirm(D.ITEMS.linen_cloth), false, 'trade goods sell on one tap');
});

test('a sale reports the item, the count and the money', () => {
  const { P } = character(20, 'warrior', 'human');
  G.addItem(G.copyItem('linen_cloth'), 4);
  const idx = P.bags.findIndex((b) => b.item.id === 'linen_cloth'), money = P.money;
  let got = null; G.on('sold', (e) => { got = e; });
  G.sell(idx);
  assert.ok(got && got.item && got.item.id === 'linen_cloth', 'the item');
  assert.strictEqual(got.n, 4);
  assert.strictEqual(got.money, P.money - money);
});
