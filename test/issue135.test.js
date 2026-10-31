// Accepting a bounty says so where you tapped (#135): one toast pointing to the Quest Log, and the bounty is held.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

test('accepting a bounty toasts that it went to the Quest Log', () => {
  const { P } = character(20, 'warrior', 'human');
  P.place = Object.keys(D.PLACES).find((k) => G.isHub(k) && G.bounties(k).length);
  const b = G.bounties(P.place)[0], toasts = [];
  G.on('toast', (t) => toasts.push(t));
  G.acceptBounty(b);
  assert.ok(P.bounty[b.id], 'held');
  assert.deepStrictEqual(toasts, ['Bounty accepted: added to your Quest Log.']);
});
