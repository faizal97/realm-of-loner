// Bags for everyone (#534): bags over 6 slots came only from Tailoring, so a player without it stayed near 40 slots.
// The auction house now always lists a bag for your level (Woolen from 15, Silk from 30, Duskweave from 45), priced at
// about 6 to 8 quests' gold at its level, so it is worth saving for and never cheaper than the vendor's 4-slot pouch.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

const bagsListed = () => { G.S.ah = null; return G.ahListings().filter((l) => l.item.slot === 'bag').map((l) => l.item.id); };

test('the auction house lists a bag for your level, and none above it', () => {
  for (const [L, best] of [[15, 'woolen_bag'], [30, 'silk_bag'], [45, 'duskweave_bag'], [60, 'duskweave_bag']]) {
    character(L);
    const seen = new Set(); for (let i = 0; i < 20; i++) bagsListed().forEach((k) => seen.add(k));
    assert.ok(seen.has(best), `level ${L} sees the ${best}`);
    for (const k of D.BAG_AH) if (D.BAG_TIER[k] > L) assert.ok(!seen.has(k), `level ${L} does not see the ${k}`);
  }
});

test('below 15 no big bag is listed', () => {
  character(10);
  for (let i = 0; i < 10; i++) assert.ok(!bagsListed().some((k) => D.BAG_AH.includes(k)));
});

test('a bigger bag costs more, and every bag more per slot than nothing: Woolen over the vendor pouch', () => {
  const v = (k) => G.ahValue(D.ITEMS[k]);
  assert.ok(v('woolen_bag') > D.ITEMS.small_pouch.cost, 'an 8-slot bag costs more than the 4-slot pouch');
  assert.ok(v('woolen_bag') < v('silk_bag') && v('silk_bag') < v('duskweave_bag') && v('duskweave_bag') < v('starweave_bag'));
  assert.ok(v('duskweave_bag') <= 8 * 8 * G.questMoney(45), 'not out of reach: under 8 quests at 45 per slot step');
});
