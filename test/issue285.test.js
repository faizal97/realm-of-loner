// The group activities your quests need show in the Group Finder's For You at any level (#285): G.questActs maps an
// activity to the quest whose creature is in its pulls, so an outlevelled Wanted no longer hides under Earlier.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

const questFor = (act) => Object.keys(D.QUESTS).find((k) => D.QUESTS[k].name === D.ACTIVITIES[act].name && D.QUESTS[k].giver && (D.QUESTS[k].faction || 'accord') !== 'krugar');

test('an outlevelled Wanted is listed for the quest that needs it', () => {
  const { P } = character(48, 'warrior', 'human');
  const q = questFor('rotmaw'); assert.ok(q, 'the Old Rotmaw quest');
  assert.ok(48 > D.ACTIVITIES.rotmaw.maxLvl, 'level 48 has outlevelled it');
  assert.deepStrictEqual(G.questActs(), {});
  P.quests[q] = { prog: D.QUESTS[q].objs.map(() => 0), at: 0 };
  assert.strictEqual(G.questActs().rotmaw, D.QUESTS[q].name);
});

test('a finished objective no longer lists the activity', () => {
  const { P } = character(48, 'warrior', 'human');
  const q = questFor('rotmaw');
  P.quests[q] = { prog: D.QUESTS[q].objs.map(() => 0), at: 0 };
  for (const o of D.QUESTS[q].objs) if (o.type === 'collect') G.addItem(D.ITEMS[o.item], o.n);
  assert.ok(!G.questActs().rotmaw);
});
