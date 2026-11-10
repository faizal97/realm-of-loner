// #544: the Marks trade-in was a farm on low-level alts (a level 5 made ~430 Marks/h). Only a level-60 character trades
// notes for Marks now, at 10 notes for 10 Marks; any level still collects notes for the Debt-Breaker title.
const { test } = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world.js');

test('the Marks trade: level 60 only, 10 notes for 10 Marks (#544)', () => {
  const t = D.PREPATCH.trade.find((x) => x.kind === 'marks');
  assert.strictEqual(t.cost, 10); assert.strictEqual(t.marks, 10); assert.strictEqual(t.minLevel, 60);
  const { P } = character(20, 'warrior', 'human');
  P.debtNotes = 30; const m0 = G.account().marks;
  assert.strictEqual(G.noteTrade('marks'), false, 'below 60: no Marks');
  assert.strictEqual(P.debtNotes, 30, 'notes kept');
  assert.strictEqual(G.account().marks, m0);
  const b = character(60, 'warrior', 'human');
  b.P.debtNotes = 9;
  assert.strictEqual(G.noteTrade('marks'), false, 'nine notes: not enough');
  b.P.debtNotes = 10; const m1 = G.account().marks;
  assert.strictEqual(G.noteTrade('marks'), true);
  assert.strictEqual(G.account().marks, m1 + 10); assert.strictEqual(b.P.debtNotes, 0);
});

test('the title trade stays open at any level (#544)', () => {
  const { P } = character(12, 'mage', 'gnome');
  const a = G.account(); delete a.debtBreaker; G.saveAccount(a);
  P.debtNotes = 40;
  assert.strictEqual(G.noteTrade('debt_breaker'), true);
});
