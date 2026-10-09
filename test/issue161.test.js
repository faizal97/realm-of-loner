// A won loot roll is never lost (#161). With full bags the item used to be deleted after "You won"; it now goes to
// the bank, with a toast and a chat line saying so.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character, now, advance } = require('./world');

const toasts = []; G.on('toast', (t) => toasts.push(t));
// a character in a dungeon run with one roll waiting, which they have rolled Need 100 on and nobody else is in
function wonRoll(fullBags) {
  const { P, S } = character(35, 'warrior', 'human');
  G.startRoulette(); assert.ok(S.run, 'in a run');
  const it = G.genGear('chest', 35, 3);
  if (fullBags) while (!G.bagsFull()) P.bags.push({ item: G.genGear('legs', 35, 1), n: 1 });
  P.bank = [];
  S.run.rolls.push({ item: it, until: now() + 25000, left: 25000, choices: {}, player: { c: 'need', v: 100 }, done: false });
  toasts.length = 0;
  advance(2); // rolls resolve on the once-a-second world tick
  return { P, S, it };
}

test('won with full bags: the item goes to the bank, and the player is told', () => {
  const { P, S, it } = wonRoll(true);
  assert.ok(P.bank.some((b) => b.item === it), 'in the bank');
  assert.ok(!P.bags.some((b) => b.item === it), 'not in the bags (they were full)');
  assert.ok(toasts.includes(`Bags full: ${it.name} sent to your bank`), toasts.join(' | '));
  assert.ok(S.chat.some((m) => /went to your bank/.test(m.text) && m.text.includes(it.name)), 'a chat line names it');
  G.leaveGroup();
});

test('won with room: the item goes to the bags as before', () => {
  const { P, it } = wonRoll(false);
  assert.ok(P.bags.some((b) => b.item === it), 'in the bags');
  assert.ok(!P.bank.some((b) => b.item === it));
  assert.ok(!toasts.some((t) => /bank/.test(t)));
  G.leaveGroup();
});
