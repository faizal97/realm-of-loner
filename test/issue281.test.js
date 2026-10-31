// A replacement who joins a run between pulls redraws the party at once (#281): the game says the run changed, so the
// screen drops the "(left)" row without the player having to tap it.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, character, advance } = require('./world');

test('a replacement joining between pulls says the run changed', () => {
  const { S } = character(35, 'mage', 'human');
  G.startRoulette();
  assert.ok(S.run && S.run.phase === 'rest', 'resting in a run');
  S.run.restUntil = Date.now() + 3600e3; // no pull while we wait
  const m = S.group.members.find((x) => !x.legend);
  m.gone = true;
  let updates = 0; G.on('runUpdate', () => updates++);
  for (let i = 0; i < 40 && S.group.members.includes(m); i++) advance(1);
  assert.ok(!S.group.members.includes(m), 'the leaver was replaced');
  assert.ok(updates > 0, 'runUpdate after the replacement joined');
});
