// #294: Lanternwake's Normal at level 60 hits about 15% softer than v10.17.0 (2.6 / 4.2), so a fitted healer or dps
// clears it; Hard is unchanged
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { D } = require('./world');

test("The Snuffed Road's Normal at 60 hits 15% softer; Hard is unchanged", () => {
  const A = D.ACTIVITIES.ev_snuffed_road, T = A.dungeon ? D.DUNGEONS[A.dungeon] : A, top = A.atCap || T.atCap;
  assert.deepEqual([top.trashMult.dmg, top.bossMult.dmg], [2.2, 3.6]);
  assert.deepEqual([top.trashMult.hp, top.bossMult.hp], [2.8, 9], 'health unchanged');
  assert.deepEqual([top.hard.trashMult.dmg, top.hard.bossMult.dmg], [2.8, 4.2], 'Hard unchanged');
});
