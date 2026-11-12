// Create all with full bags (play-test, beta.7): a batch is made one at a time, so each craft must fit when it is made.
// Create all counted only the end of the batch, where the last of the materials frees their slot: with full bags it
// offered "Create all (6)" for Copper Bars that could not even start ("Bags are full.").
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

function fullBags(rid, extra) {
  const { P } = character(10, 'warrior', 'human');
  const r = D.RECIPES[rid]; P.prof = { [r.prof]: { skill: 1, max: 75 } }; P.bags = [];
  for (const m in r.mats) G.addItem(G.copyItem(m), r.mats[m] * 5 + extra);
  const junk = Object.keys(D.ITEMS).find((k) => D.ITEMS[k].slot === 'junk');
  for (let g = 0; G.bagFree(D.ITEMS[r.makes]) > 0 && g < 500; g++) G.addItem(G.copyItem(junk), 1);
  return P;
}

test('full bags, and one craft frees no slot: Create all offers nothing, as Create refuses', () => {
  fullBags('smelt_copper', 0);
  assert.strictEqual(G.craftable('smelt_copper'), 5);
  assert.strictEqual(G.craftFit('smelt_copper'), 0);
  assert.strictEqual(G.craft('smelt_copper', 1), 'Bags are full.');
});

test('room for the first bar: the rest stack on it, so Create all counts the whole batch', () => {
  const P = fullBags('smelt_copper', 0);
  const junkAt = P.bags.findIndex((b) => b.item.slot === 'junk'); P.bags.splice(junkAt, 1);
  assert.strictEqual(G.craftFit('smelt_copper'), 5);
});
