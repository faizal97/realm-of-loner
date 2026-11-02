// #72: a person you ran with remembers it: runs together, the last one, where; a ninja is remembered too. Only people
// from the realm (not cross-realm fill or legends), and at most G.MET_MAX of them.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, character, advance } = require('./world');

test('finishing a run with people: each one from the realm remembers it', () => {
  character(20, 'warrior');
  G.startRoulette();
  for (let i = 0; i < 20000 && G.S.run && G.S.run.phase !== 'done'; i++) {
    const R = G.S.run; if (R.phase === 'rest') { R.restUntil = 0; G.runPull(); }
    if (G.fight) for (const e of G.fight.enemies) e.hp = 1;
    advance(0.25);
  }
  assert.ok(G.S.run && G.S.run.phase === 'done', 'the run was cleared');
  const act = G.S.run.act, mates = G.S.group.members.filter((m) => !m.gone && !m.cameo && G.S.bots.some((b) => b.id === m.bot.id));
  assert.ok(mates.length >= 2, 'the group had people from the realm');
  G.leaveGroup();
  for (const m of mates) { const r = G.metWith(m.bot.id); assert.ok(r && r.n === 1 && r.where === act, `${m.name} remembers the run`); }
  assert.strictEqual(Object.keys(G.S.player.met).length, mates.length, 'nobody from outside the realm is kept');
});

test('a ninja is remembered, and the list stays bounded', () => {
  const bots = G.S.bots;
  G.remember(bots[0], { ninja: 1 }); assert.strictEqual(G.metWith(bots[0].id).ninja, 1);
  for (let i = 0; i < G.MET_MAX + 40 && i < bots.length; i++) G.remember(bots[i], { run: 'x' });
  assert.ok(Object.keys(G.S.player.met).length <= G.MET_MAX);
  G.remember({ id: 999999 }, { run: 'x' }); assert.strictEqual(G.metWith(999999), null, 'not someone from the realm');
});

test('a ninja from someone new is kept when the list is full (#310)', () => {
  const bots = G.S.bots; G.S.player.met = {};
  for (let i = 0; i < G.MET_MAX; i++) G.remember(bots[i], { run: 'x' });
  const late = bots[G.MET_MAX + 5]; G.remember(late, { ninja: 1 });
  assert.ok(G.metWith(late.id) && G.metWith(late.id).ninja === 1);
});
