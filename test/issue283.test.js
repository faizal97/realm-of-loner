// #283: Deserter was 10 minutes for leaving any run before its end, even right after a wipe (and a browser player
// can't tab out to wait). Now 5 minutes, and none once the group has wiped.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character, now } = require('./world');

function inRun() {
  const { S } = character(20, 'warrior', 'human');
  const act = Object.keys(D.ACTIVITIES).find((k) => { const A = D.ACTIVITIES[k]; return A.dungeon && (A.size || 5) === 5 && !A.needQuest && !A.worldBoss && A.minLvl <= 20; });
  S.player.place = D.ACTIVITIES[act].where; G.queueFor(act); assert.ok(S.queue, 'queued ' + act); S.queue.popAt = Date.now() - 1; G.update(0.5); G.acceptPop();
  assert.ok(S.run, 'in the run'); G.fight = null;
  return S;
}

test('leaving a run that is going fine: Deserter for 5 minutes', () => {
  const S = inRun();
  assert.strictEqual(G.deserterFor(S.run), 5 * 60000);
  G.leaveGroup();
  const left = S.flags.deserterUntil - now();
  assert.ok(left > 4.9 * 60000 && left <= 5 * 60000, String(left));
});

test('leaving after a wipe: no Deserter', () => {
  const S = inRun();
  S.run.wipes = 1;
  assert.strictEqual(G.deserterFor(S.run), 0);
  delete S.flags.deserterUntil;
  G.leaveGroup();
  assert.ok(!(S.flags.deserterUntil > now()), 'no Deserter');
  assert.ok(JSON.stringify(G.S.chat || []).includes('no Deserter'), 'it says so');
});

test('a finished run never gives Deserter', () => {
  assert.strictEqual(G.deserterFor({ phase: 'done', wipes: 0 }), 0);
  assert.strictEqual(G.deserterFor(null), 0);
});
