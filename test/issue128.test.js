// A weekly bounty's bonus gear is never lost to full bags (#128). As a quest turn-in with an item reward does, and the
// heirloom vendor since #87; since #184 full bags send the gear to the bank (the #164 rule); with room, everything is
// paid and the gear is in the bags. Chat and the hand-in toast only name what arrived.
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

test('full bags: a weekly bounty hands in and its bonus gear goes to the bank (#184, the #164 rule)', () => {
  const { P, b, acct } = weeklyDone(0);
  const money = P.money, marks = acct(), bags = P.bags.length, bank = (P.bank || []).length;
  G.turnInBounty(b);
  assert.strictEqual(G.bountyState(b), 'done');
  assert.ok(P.money > money && acct() > marks, 'money and Marks paid');
  assert.strictEqual(P.bags.length, bags, 'bags unchanged');
  assert.strictEqual(P.bank.length, bank + 1, 'the gear is in the bank');
  assert.ok(G.S.chat.some((m) => /went to your bank/.test(m.text || '')), 'chat says where it went');
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
  assert.ok(!toasts.includes('Bags are full.'));
});

test('a daily bounty (no item) still hands in with full bags', () => {
  const { P } = character(30, 'warrior', 'human');
  P.place = Object.keys(D.PLACES).find((k) => G.isHub(k) && G.bounties(k).length);
  const b = G.bounties(P.place).find((x) => !x.weekly); G.acceptBounty(b); P.bounty[b.id].prog = b.n;
  while (P.bags.length < G.bagCap()) P.bags.push({ item: G.genGear('chest', P.level, 0), n: 1 });
  lines = []; G.turnInBounty(b);
  assert.strictEqual(G.bountyState(b), 'done'); assert.ok(lines[0].startsWith('Bounty complete') && !lines[0].includes('bonus gear'), lines[0]);
});
