// A weekly bounty's bonus gear is never lost to full bags (#128). As a quest turn-in with an item reward does, and the
// heirloom vendor since #87: with no room, the hand-in pays nothing, the bounty stays Ready and the player is told to make
// room; with room, everything is paid and the gear is in the bags. Chat and the hand-in toast only name what arrived.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

let toasts = [], lines = [];
G.on('toast', (t) => toasts.push(t)); G.on('questDone', (d) => lines.push(d && d.text));
// a character at a bounty board with this week's bounty done, and `free` bag slots left
function weeklyDone(free) {
  const { P } = character(30, 'warrior', 'human');
  P.place = Object.keys(D.PLACES).find((k) => G.isHub(k) && G.bounties(k).length);
  const b = G.bounties(P.place).find((x) => x.weekly);
  G.acceptBounty(b); P.bounty[b.id].prog = b.n;
  while (G.bagCap() - P.bags.length > free) P.bags.push({ item: G.genGear('chest', P.level, 0), n: 1 });
  toasts = []; lines = [];
  return { P, b, acct: () => G.account().marks };
}

test('full bags: a weekly bounty with bonus gear pays nothing, stays Ready, and says to make room', () => {
  const { P, b, acct } = weeklyDone(0);
  const money = P.money, xp = P.xp, lvl = P.level, marks = acct(), bags = P.bags.length, chat = G.S.chat.length;
  G.turnInBounty(b);
  assert.deepStrictEqual([P.money, P.xp, P.level, acct(), P.bags.length], [money, xp, lvl, marks, bags], 'nothing paid, nothing taken');
  assert.strictEqual(G.bountyState(b), 'complete', 'still Ready to hand in');
  assert.deepStrictEqual(toasts, ['Make room in your bags first: this bounty gives an item.']);
  assert.deepStrictEqual(lines, [], 'no "Bounty complete"');
  assert.ok(!G.S.chat.slice(chat).some((m) => /bounty/i.test(m.text || '')), 'chat claims nothing');
});

test('one free slot: everything is paid and the gear is in the bags, and chat and the toast name it', () => {
  const { P, b, acct } = weeklyDone(1);
  const money = P.money, marks = acct(), bags = P.bags.length, chat = G.S.chat.length;
  G.turnInBounty(b);
  assert.strictEqual(G.bountyState(b), 'done');
  assert.ok(P.money > money && acct() > marks, 'money and Marks paid');
  assert.strictEqual(P.bags.length, bags + 1, 'the gear is in the bags');
  const gear = P.bags[P.bags.length - 1].item;
  assert.ok(lines.length === 1 && lines[0].includes('bonus gear'), lines[0]);
  assert.ok(G.S.chat.slice(chat).some((m) => (m.text || '').includes(gear.name)), 'chat names the gear that arrived');
  assert.ok(!toasts.includes('Inventory is full.'));
});

test('a daily bounty (no item) still hands in with full bags', () => {
  const { P } = character(30, 'warrior', 'human');
  P.place = Object.keys(D.PLACES).find((k) => G.isHub(k) && G.bounties(k).length);
  const b = G.bounties(P.place).find((x) => !x.weekly); G.acceptBounty(b); P.bounty[b.id].prog = b.n;
  while (P.bags.length < G.bagCap()) P.bags.push({ item: G.genGear('chest', P.level, 0), n: 1 });
  lines = []; G.turnInBounty(b);
  assert.strictEqual(G.bountyState(b), 'done'); assert.ok(lines[0].startsWith('Bounty complete') && !lines[0].includes('bonus gear'), lines[0]);
});
