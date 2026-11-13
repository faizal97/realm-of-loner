// A Wanted elite's group run hits harder by a step that follows its level (#586); a Legend's or a festival's run is not touched.
'use strict';
const test = require('node:test');
const assert = require('node:assert');

test("a Wanted elite's run starts with its own multipliers", () => {
  const { G, D, character } = require('./world');
  character(10, 'warrior', 'human');
  G.queueFor('hogger'); G.acceptPop();
  assert.ok(G.S.run, 'the run started');
  assert.deepStrictEqual([G.S.run.mult, G.S.run.bossMult], [D.ACTIVITIES.hogger.trashMult, D.ACTIVITIES.hogger.bossMult]);
  assert.strictEqual(G.S.run.bossMult.dmg, 2.2);
});

test('the Wanted step follows the level: x2.2 at 8, x3 at 25, x3.6 from 40, straight lines between', () => {
  const { D } = require('./world');
  assert.deepStrictEqual([1, 8, 25, 40, 60].map(D.wantedStep), [2.2, 2.2, 3, 3.6, 3.6]);
  assert.strictEqual(D.wantedStep(32), 3.28);
  for (const k in D.ACTIVITIES) {
    const A = D.ACTIVITIES[k], wanted = !A.dungeon && !A.event && !A.needQuest && !A.worldBoss && A.boss && (A.pulls || []).length;
    if (wanted) assert.deepStrictEqual(A.bossMult, { hp: 1, dmg: D.wantedStep(A.minLvl || 1) }, k);
    else if (A.needQuest) assert.ok(!A.bossMult, `${k}: a Legend's fight keeps its numbers`);
  }
});
