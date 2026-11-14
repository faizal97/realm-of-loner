// The group finder takes only players at or above an activity's level (the Trials fix, 479dd09, for every activity): a
// level-59 player no longer joins a level-60 raid or dungeon, where it fought as 59. One under your level is still fine
// where the activity allows it.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character, advance } = require('./world');

function lowest(act, n) {
  let low = Infinity;
  for (let i = 0; i < n; i++) {
    G.S.queue = null; G.S.group = null; G.S.run = null;
    G.queueFor(act); if (!G.S.queue) return null;
    G.S.queue.popAt = Date.now() - 1; advance(1);
    const grp = G.S.group || (G.S.queue && G.S.queue.group);
    for (const m of (grp && grp.members) || []) low = Math.min(low, (m.char || m).level);
    G.S.queue = null; G.S.group = null;
  }
  return low;
}

test('a level-60 raid from the group finder has no player under 60', () => {
  character(60, 'warrior');
  const raid = Object.keys(D.ACTIVITIES).find((k) => D.ACTIVITIES[k].dungeon && D.ACTIVITIES[k].size === 10 && D.ACTIVITIES[k].minLvl === 60 && !G.activityBlock(k));
  assert.ok(raid, 'a level-60 raid is open');
  for (const b of G.S.bots) if (b.level >= 59) b.level = 59; // the realm's top players are all one level short: the finder must look elsewhere
  const low = lowest(raid, 20);
  assert.ok(low != null && low !== Infinity, 'groups formed');
  assert.ok(low >= 60, `lowest member level ${low}`);
});
