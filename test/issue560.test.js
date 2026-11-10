// #560: the basic materials your crafts use at your skill are always on the auction house, priced never under their
// value, so a crafter whose gathering doesn't feed the craft can still level it.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

const listed = () => { G.S.ah = null; return G.ahListings(); };

test('an Apprentice and an Expert Blacksmith with Herbalism always find their bars, never under value', () => {
  for (const [level, skill, max, bar] of [[10, 10, 75, 'copper_bar'], [35, 130, 225, null]]) {
    const { P } = character(level, 'warrior', 'human');
    P.prof = { herbalism: { skill: 1, max: 75, known: [] }, blacksmithing: { skill, max, known: [] } };
    const need = G.craftMatsNeeded();
    assert.ok(need.length > 0 && need.length <= 4, `level ${level}: ${need}`);
    if (bar) assert.ok(need.includes(bar), `${need} has ${bar}`);
    assert.ok(need.every((m) => !D.ITEMS[m].cost), 'nothing a vendor sells');
    for (let i = 0; i < 20; i++) {
      const L = listed();
      for (const m of need) {
        const l = L.find((x) => x.item.id === m && x.id.includes('_c'));
        if (!l) assert.ok(L.some((x) => x.item.id === m), `${m} listed (refresh ${i})`);
        else assert.ok(l.price >= G.ahValue(l.item) * l.n, `${m} priced ${l.price} under value`);
      }
    }
  }
});

test('no craft, no extra listings', () => {
  const { P } = character(20, 'mage', 'human');
  P.prof = { herbalism: { skill: 50, max: 75, known: [] }, mining: { skill: 50, max: 75, known: [] } };
  assert.deepStrictEqual(G.craftMatsNeeded(), []);
  assert.ok(!listed().some((l) => l.id.includes('_c')));
});
