// While a player card is open the run waits to pull (#323): reading someone's card between pulls ended with the group
// already 9 s into the next pull.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character, advance } = require('./world');

test('the run does not pull while a card is open, and does once it closes', () => {
  character(20, 'priest', 'human'); G.S.player.role = 'healer';
  const act = Object.keys(D.ACTIVITIES).find((k) => { const A = D.ACTIVITIES[k]; return A.dungeon && (A.size || 5) === 5 && !A.needQuest && !A.worldBoss && A.minLvl <= 20 && !(A.where && G.enemyTown(A.where)); });
  G.S.player.place = D.ACTIVITIES[act].where; G.queueFor(act); G.S.queue.popAt = Date.now() - 1; G.update(0.5); G.acceptPop();
  assert.ok(G.S.run && G.S.run.phase === 'rest', 'resting before the first pull');
  G.looking = true;
  advance(40);
  assert.ok(!G.fight && G.S.run.phase === 'rest', 'still waiting with the card open');
  G.looking = false;
  advance(40);
  assert.ok(G.fight || G.S.run.phase !== 'rest' || G.S.run.idx > 0, 'pulls once it closes');
});
