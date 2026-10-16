// Paws for Proof (rr_gnoll_paws): a v5 save migration copied Westfall's Gnoll Paws ('gnoll_paws', a real Accord quest)
// onto Stoneharrow's on every load, so an Accord character of level 20+ who had done Westfall's found Paws for Proof
// "done" while still in the log: no turn-in, no Abandon. A quest in the log and marked done is in the log.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

const reload = () => { G.save(); G.load(G.S.id); return G.S.player; };

test('Paws for Proof in the log stays active after a load, and turns in', () => {
  let P = character(22, 'warrior', 'human').P;
  P.done.gnoll_paws = true; G.accept('rr_gnoll_paws');
  P = reload();
  assert.strictEqual(G.questState('rr_gnoll_paws'), 'active');
  P.qitems = Object.assign(P.qitems || {}, { gnoll_paw: 10 });
  assert.strictEqual(G.questState('rr_gnoll_paws'), 'complete');
  G.turnIn('rr_gnoll_paws');
  assert.strictEqual(G.questState('rr_gnoll_paws'), 'done');
});

test('a save already caught (in the log and marked done) is mended on load', () => {
  let P = character(22, 'warrior', 'human').P;
  G.accept('rr_gnoll_paws'); P.done.rr_gnoll_paws = true;
  P = reload();
  assert.ok(!P.done.rr_gnoll_paws && P.quests.rr_gnoll_paws, 'back in the log only');
  assert.strictEqual(G.questState('rr_gnoll_paws'), 'active');
});

test('Westfall\'s Gnoll Paws does not mark Paws for Proof done, nor turn into it', () => {
  let P = character(22, 'warrior', 'human').P;
  P.done.gnoll_paws = true;
  P = reload();
  assert.ok(!P.done.rr_gnoll_paws, 'not done by Westfall\'s');
  P = character(18, 'warrior', 'human').P;
  G.accept('gnoll_paws');
  P = reload();
  assert.ok(P.quests.gnoll_paws && !P.quests.rr_gnoll_paws, 'Westfall\'s quest stays itself');
});

test('Paws for Proof marked done by the old migration, never in Longbridge, can be picked up again', () => {
  let P = character(25, 'warrior', 'human').P;
  P.done.rr_gnoll_paws = true; delete P.visited.lakeshire;
  P = reload();
  assert.ok(!P.done.rr_gnoll_paws);
  P.done.rr_gnoll_paws = true; P.visited.lakeshire = true;
  P = reload();
  assert.ok(P.done.rr_gnoll_paws, 'been to Longbridge: it stays done');
});
