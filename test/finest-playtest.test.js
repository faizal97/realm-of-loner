// Season's Finest and loot, play-test findings on 69aa5d9: a piece seen on a roll card, pieces that come back to you,
// role-fitted dungeon rewards, Stamina and role Need, and Best pieces at their power ceiling.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character, setNow, now } = require('./world');

const IN_SEASON = new Date(2026, 10, 15, 12).getTime();
const S1 = () => D.FINEST_SEASONS.find((s) => s.id === 1);
const UNTIL = (k) => S1().until[G.myFaction()][k], BEST = (k) => S1().best[G.myFaction()][k];
const row = (cls, role, slot, tier) => G.finest(cls, role).rows.find((r) => r.slot === slot && r.tier === tier);

test('a season piece on a roll card is Seen, whoever wins it', () => {
  setNow(IN_SEASON); const { S } = character(60, 'mage', 'human');
  G.startRoulette(); assert.ok(S.run, 'in a run');
  const id = UNTIL('mage:dps').chest;
  assert.strictEqual(row('mage', 'dps', 'chest', 'until').state, 'unknown');
  G._addRoll(G.copyItem(id));
  assert.strictEqual(row('mage', 'dps', 'chest', 'until').state, 'seen');
  G.leaveGroup();
});
