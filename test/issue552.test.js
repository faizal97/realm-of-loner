// #552: torn debt notes show their goal, n/40 toward the Debt-Breaker title, until the title is yours.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, character } = require('./world');

test('notes read n/40 until the Debt-Breaker title is owned, then the plain count', () => {
  const { P } = character(30);
  const a = G.account(); delete a.debtBreaker; G.saveAccount(a);
  P.debtNotes = 12; assert.strictEqual(G.debtNotesText(), '12/40');
  P.debtNotes = 40; assert.ok(G.noteTrade('debt_breaker'));
  P.debtNotes = 7; assert.strictEqual(G.debtNotesText(), '7');
});
