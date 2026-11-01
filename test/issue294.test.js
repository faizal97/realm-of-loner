// #294: Lanternwake hits about 15% softer than v10.17.0 at every level, Normal and Hard (v10.17.1: Normal at 60;
// v10.17.2: Normal's base, so levels 41-59 get it all, and Hard), so a bot tank no longer goes down faster than it can be healed
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { D } = require('./world');

test("The Snuffed Road hits 15% softer, Normal and Hard, at every level; health is unchanged", () => {
  const A = D.ACTIVITIES.ev_snuffed_road, T = A.dungeon ? D.DUNGEONS[A.dungeon] : A, top = A.atCap || T.atCap;
  assert.deepEqual([top.trashMult.dmg, top.bossMult.dmg], [2.2, 3.6]);
  assert.deepEqual([top.trashMult.hp, top.bossMult.hp], [2.8, 9], 'health unchanged');
  assert.deepEqual([top.hard.trashMult.dmg, top.hard.bossMult.dmg], [2.4, 3.6], 'Hard at 60');
  assert.deepEqual([T.trashMult.dmg, T.bossMult.dmg], [1.9, 3.1], 'Normal below 40 (and blended from 40 to 60)');
  assert.deepEqual([T.hard.trashMult.dmg, T.hard.bossMult.dmg], [2.0, 3.1], 'Hard below 40');
  assert.deepEqual([T.trashMult.hp, T.bossMult.hp, T.hard.trashMult.hp, T.hard.bossMult.hp, top.hard.trashMult.hp, top.hard.bossMult.hp], [2.2, 7, 2.4, 7.4, 3, 9.3], 'health unchanged');
});
