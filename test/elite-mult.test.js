// A Wanted elite's or a Legend's group run takes its own damage and health numbers when the data gives them (#586).
'use strict';
const test = require('node:test');
const assert = require('node:assert');

test("a Wanted elite's run carries its own multipliers; without them, none", () => {
  const { G, D, character } = require('./world');
  const A = D.ACTIVITIES.hogger, was = [A.trashMult, A.bossMult];
  try {
    character(10, 'warrior', 'human');
    G.queueFor('hogger'); G.acceptPop();
    assert.ok(G.S.run, 'the run started');
    assert.strictEqual(G.S.run.bossMult, null, 'no numbers in the data: the mobs fight as they are');
    G.leaveGroup ? G.leaveGroup() : (G.S.run = null);
    A.trashMult = { hp: 1, dmg: 1.5 }; A.bossMult = { hp: 1.2, dmg: 2 };
    character(10, 'warrior', 'human');
    G.queueFor('hogger'); G.acceptPop();
    assert.deepStrictEqual([G.S.run.mult, G.S.run.bossMult], [A.trashMult, A.bossMult]);
  } finally { [A.trashMult, A.bossMult] = was; }
});
