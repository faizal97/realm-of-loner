// Runs and the group finder (beta.4 sweep): a Trial's replacement fights at the cap (#384).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, E, character, advance } = require('./world');

test("a replacement who joins mid-Trial fights at the Trial's level (#384)", () => {
  const { S } = character(60, 'warrior', 'human');
  const act = G.trialPicks()[0]; S.player.place = D.ACTIVITIES[act].where;
  G.queueTrial(act, 1); S.queue.popAt = Date.now() - 1; advance(2); G.acceptPop();
  assert.ok(S.run && S.run.trial, 'in a Trial');
  S.run.restUntil = Date.now() + 1e9;
  const m = S.group.members.find((x) => !x.legend); m.gone = true;
  advance(25);
  assert.ok(!S.group.members.includes(m), 'someone replaced them');
  for (const x of S.group.members) assert.strictEqual(E.levelOf(x), D.LEVEL_CAP, `${x.name} fights at ${E.levelOf(x)}`);
});

test('Roulette picks only 5-player dungeons the storm does not hide (#385)', () => {
  character(60, 'warrior', 'human');
  const opts = G.rouletteOptions(); assert.ok(opts.length);
  for (const k of opts) { const A = D.ACTIVITIES[k]; assert.strictEqual(A.size || 5, 5, k); assert.ok(!(A.where && G.stormBlocks(A.where)), k); }
});

test('a person wears the same gear in the world and in the group finder (#388)', () => {
  let n = 0;
  for (const [L, cls] of [[20, 'warrior'], [30, 'priest'], [40, 'mage'], [50, 'warrior']]) {
    const { S } = character(L, cls, 'human');
    const act = Object.keys(D.ACTIVITIES).find((k) => { const A = D.ACTIVITIES[k]; return A.dungeon && (A.size || 5) === 5 && !A.needQuest && A.minLvl <= L && (A.maxLvl || 60) >= L; });
    if (!act) continue;
    S.player.place = D.ACTIVITIES[act].where; G.queueFor(act); if (!S.queue) continue; S.queue.popAt = Date.now() - 1; advance(2); if (!S.queue.group) continue;
    for (const m of S.queue.group.members) {
      const live = S.bots.find((b) => b.id === m.bot.id); if (!live) continue;
      const world = G.botChar(Object.assign({}, live, { role: G.mainRole(live) })); // what their card shows in the world
      for (const slot of Object.keys(m.equip)) assert.strictEqual(world.equip[slot] && world.equip[slot].name, m.equip[slot].name, `${m.name} ${slot}`);
      n++;
    }
    G.declinePop();
  }
  assert.ok(n >= 6, `${n} people compared`);
});
