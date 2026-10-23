// The queue pop shows who you'll play with (#189): the group is picked when the queue pops, Enter joins that same group,
// and Enter is refused mid-fight.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character, advance } = require('./world');

const toasts = [], pops = [];
G.on('toast', (t) => toasts.push(t)); G.on('pop', (q) => pops.push(q));

const popFor = (act) => { if (D.ACTIVITIES[act].where) G.S.player.place = D.ACTIVITIES[act].where; G.queueFor(act); assert.ok(G.S.queue, 'queued'); for (let i = 0; i < 1200 && !G.S.queue.popped; i++) advance(1); assert.ok(G.S.queue.popped, 'popped'); return G.S.queue; };

test('the pop carries the group, and Enter joins that same group', () => {
  const { S } = character(20, 'warrior', 'human'); G.setRole('tank');
  const q = popFor('deadmines');
  assert.strictEqual(pops[pops.length - 1], q);
  const names = q.group.members.map((m) => m.name);
  assert.strictEqual(names.length, 4);
  for (const m of q.group.members) assert.ok(m.cls && m.level && m.role && m.bot, 'a member has a class, level, role and bot');
  assert.strictEqual(S.group, null, 'popping does not join the group');
  G.acceptPop();
  assert.deepStrictEqual(S.group.members.map((m) => m.name), names);
});

test('Enter is refused mid-fight, and the queue stays', () => {
  const { S } = character(20, 'warrior', 'human');
  const q = popFor('deadmines');
  const m = G.placeMobs().find((x) => x.state === 'alive'); G.engage(m.id); assert.ok(G.fight, 'in a fight');
  G.acceptPop();
  assert.strictEqual(toasts[toasts.length - 1], 'Finish the fight first.');
  assert.strictEqual(S.queue, q); assert.ok(!S.run);
  G.fight = null;
});

test('a battleground pop picks no group (it forms its own two teams)', () => {
  character(20, 'warrior', 'human'); G.S.flags.warModeAsked = true;
  const q = popFor('bg_highmoor');
  assert.strictEqual(q.group, undefined);
  assert.ok(D.ACTIVITIES.bg_highmoor.bg);
});
