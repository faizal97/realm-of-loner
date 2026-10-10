// Quest XP falls once you outlevel the quest (#188): full up to 2 levels over it, then 20% less for each level beyond,
// never under 20%; the quest window shows the reduced XP before you take the quest. A dungeon's entrance place is
// marked (gate) so zone levels leave it out, and no solo quest sits more than 2 levels over its zone.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

test('the share of quest XP by how far you are over the quest', () => {
  const want = { '-3': 1, 0: 1, 1: 1, 2: 1, 3: 0.8, 4: 0.6, 5: 0.4, 6: 0.2, 7: 0.2, 20: 0.2 };
  for (const over in want) assert.ok(Math.abs(G.questXpShare(30, 30 + +over) - want[over]) < 1e-9, `+${over}: ${want[over]}`);
});

test('turning in a quest 4 levels under you gives 60% of its XP', () => {
  const q = Object.keys(D.QUESTS).find((x) => { const Q = D.QUESTS[x]; return Q.lvl === 20 && Q.objs.length && Q.objs.every((o) => o.type === 'kill') && !(Q.reward.choice || []).length; });
  for (const [lvl, share] of [[22, 1], [24, 0.6]]) {
    const { P } = character(lvl, 'warrior', 'human');
    P.xp = 0; P.quests[q] = { prog: D.QUESTS[q].objs.map((o) => o.n) };
    G.turnIn(q);
    assert.strictEqual(P.xp, Math.round(G.questXp(20) * share), `at ${lvl}`);
    assert.strictEqual(G.questXpFor(D.QUESTS[q]), Math.round(G.questXp(20) * share));
  }
});

test('bounties keep their XP (they already follow your level)', () => {
  character(40, 'warrior', 'human');
  const src = require('fs').readFileSync(require('path').join(__dirname, '../src/game.js'), 'utf8');
  assert.match(src, /xp: Math\.round\(G\.questXp\(L\) \* \(weekly/);
});

test('dungeon entrances are marked, and zone levels leave them out', () => {
  const doors = Object.values(D.ACTIVITIES).filter((a) => a.dungeon && a.where && /_gate$/.test(a.where)).map((a) => a.where);
  assert.ok(doors.includes('razorfen_gate'));
  for (const k of doors) assert.strictEqual(D.PLACES[k].gate, true, k);
  assert.deepStrictEqual(D.zoneLevels().barrens, [10, 20], 'The Scrublands without The Thorn Warrens');
});
