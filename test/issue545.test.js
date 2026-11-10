// #545: items in the Account bank count as owned, so a Trial find kept there doesn't drop again and the Effects codex
// still lists it.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

test('a Trial find in the Account bank is still yours: no second drop, still in the codex', () => {
  const { P } = character(60);
  const a = G.account(); delete a.bank; G.saveAccount(a);
  const act = Object.keys(D.TRIAL_FIND).find((k) => { const it = D.ITEMS[D.TRIAL_FIND[k]]; return it && G.canUseItem(it) && G.abankTakes(it); });
  const id = D.TRIAL_FIND[act];
  P.bags = [{ item: G.copyItem(id), n: 1 }]; P.bank = [];
  const inBags = G.trialFindFor(act);
  assert.notStrictEqual(inBags, id, 'held in the bags: a different find');
  assert.ok(G.abankDeposit(0)); assert.strictEqual(P.bags.length, 0);
  assert.ok(G.ownsItem(id), 'the Account bank counts');
  assert.notStrictEqual(G.trialFindFor(act), id, 'held in the Account bank: still a different find');
  if (D.ITEMS[id].effect && D.EFFECTS[D.ITEMS[id].effect]) assert.ok(G.ownedEffectItems()[id], 'the codex still lists it');
});
