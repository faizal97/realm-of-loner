// Runs and the group finder (beta.4 sweep): a Trial's replacement fights at the cap (#384).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, E, character, advance } = require('./world');

test("a replacement who joins mid-Trial fights at the Trial's level (#384)", () => {
  const { S } = character(60, 'warrior', 'human');
  const act = G.trialPicks()[0]; S.player.place = D.ACTIVITIES[act].where;
  G.queueTrial(act, 1); S.queue.popAt = Date.now() - 1; advance(2); G.acceptPop();
  assert.ok(S.run && S.run.trial, 'in a Trial');
  S.run.restUntil = Date.now() + 1e9;
  const m = S.group.members.find((x) => !x.legend); m.gone = true;
  advance(25);
  assert.ok(!S.group.members.includes(m), 'someone replaced them');
  for (const x of S.group.members) assert.strictEqual(E.levelOf(x), D.LEVEL_CAP, `${x.name} fights at ${E.levelOf(x)}`);
});
