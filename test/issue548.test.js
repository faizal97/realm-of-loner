// #548: a craft whose product didn't fit refunded its materials with G.addItem and ignored the result; from an old save's
// stack over 20 with full bags, the refund needed a new slot and the materials were gone. They now go to the bank.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character, advance } = require('./world');

const sum = (l, id) => (l || []).filter((b) => b.item.id === id).reduce((a, b) => a + b.n, 0);
const r = Object.values(D.RECIPES).find((x) => !x.rare && Object.keys(x.mats).length === 1 && Object.values(x.mats)[0] >= 2 && !D.GEAR_SLOTS.includes(D.ITEMS[x.makes].slot) && G.stackable(D.ITEMS[x.makes]) && x.prof !== 'cooking');
const m = Object.keys(r.mats)[0];

test('a failed craft from an old stack of 45 with full bags loses no materials', () => {
  const { P } = character(30);
  P.bagsEq = []; P.prof = { [r.prof]: { skill: 300, max: 300, known: [] } }; P.bank = [];
  P.bags = [{ item: G.copyItem(m), n: 45 }];
  while (P.bags.length < G.bagCap() - 1) P.bags.push({ item: G.genGear('legs', 30, 2), n: 1 });
  assert.ok(G.craft(r.id, 1), 'one free slot: it starts');
  P.bags.push({ item: G.genGear('legs', 30, 2), n: 1 }); // loot fills the last slot during the cast
  advance(3);
  assert.strictEqual(sum(P.bags, r.makes), 0, 'nothing made');
  assert.strictEqual(sum(P.bags, m) + sum(P.bank, m), 45, 'every material is still there');
});
