// Who sells materials and bags on the auction house: someone at least the item's level (play-test, build 69aa5d9).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const W = require('./world');
const { G, D, B, character } = W;

const SOC = () => globalThis.SOC;

test('an auction house seller of materials and bags is at least the level that item is for', () => {
  const { S } = character(45, 'warrior', 'human');
  let checked = 0;
  for (let r = 0; r < 8; r++) {
    S.ah = null; const L = G.ahListings();
    for (const l of L) {
      if (D.GEAR_SLOTS.includes(l.item.slot) && l.item.slot !== 'bag') continue;
      const need = (D.BAG_TIER && D.BAG_TIER[l.item.id]) || SOC().itemLvl(l.item);
      const seller = S.bots.find((b) => b.name === l.seller);
      if (!seller) continue;
      checked++;
      assert.ok(seller.level >= need, `${l.item.name} (level ${need}) sold by a level ${seller.level}`);
    }
  }
  assert.ok(checked >= 20, `${checked} listings checked`);
});
