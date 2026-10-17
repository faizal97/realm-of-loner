// Simulated players who are Bards (#255): the bot class pool and the group finder's healer and damage picks include the
// Bard, and a Bard bot gets gear and talents for its role.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, B } = require('./world');

test('some simulated players are Bards, healers and damage', () => {
  let n = 0;
  for (let i = 0; i < 2000; i++) if (B.makeBot(i, new Set(), { level: 30 }).cls === 'bard') n++;
  assert.ok(n > 50, `${n} Bards in 2000 bots`);
  for (const role of ['healer', 'dps']) {
    const b = B.makeBot(1, new Set(), { level: 40 }); b.cls = 'bard'; b.role = role;
    const c = G.botChar(b);
    assert.ok(c.equip && c.equip.weapon, `${role}: a weapon`);
    assert.ok(Object.keys(c.talents || G.autoTalents('bard', role, 40, 0)).length, `${role}: talents`);
  }
});
