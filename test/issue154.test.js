// The bounty cap counts only bounties you can see (#154). Bounties from an earlier day lapse and leave the Quest Log,
// but they used to stay in the save until the next kill, so a player back on a new day was told "You can hold 6
// bounties at a time" while holding two.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character, now, setNow } = require('./world');

const DAY = 24 * 3600 * 1000;
// a character at a bounty board holding 4 bounties taken on earlier days (lapsed) and 2 taken today: the save a
// player has when they come back on a new day, so the setup writes it as it was saved rather than through acceptBounty
function lapsedAndLive() {
  const { P } = character(20, 'warrior', 'human');
  P.place = Object.keys(D.PLACES).find((k) => G.isHub(k) && G.bounties(k).length);
  const t0 = now(), held = {};
  for (const ago of [2, 3]) {
    setNow(t0 - ago * DAY); P.bounty = {};
    for (const b of G.bounties(P.place).filter((x) => !x.weekly).slice(0, 2)) G.acceptBounty(b);
    Object.assign(held, P.bounty);
  }
  setNow(t0); P.bounty = {};
  const today = G.bounties(P.place);
  G.acceptBounty(today[0]); G.acceptBounty(today[1]);
  P.bounty = Object.assign(held, P.bounty);
  return { P, today, t0 };
}

test('4 lapsed and 2 live bounties: the cap counts 2, and a new one can be taken', () => {
  const { P, today } = lapsedAndLive();
  assert.strictEqual(Object.keys(P.bounty).length, 6, 'the save held 6 before taking more');
  assert.strictEqual(G.myBounties().length, 2, 'the log shows 2');
  assert.strictEqual(G.bountiesHeld(), 2, 'the cap counts the same 2');
  G.acceptBounty(today[2]);
  assert.strictEqual(G.bountyState(today[2]), 'active', 'the third bounty was taken');
  assert.strictEqual(G.myBounties().length, 3);
});

test('the board shows ! while there is room among live bounties', () => {
  const { P } = lapsedAndLive();
  assert.strictEqual(G.bountyMarker(P.place), '!');
});

test('the cap still stops a seventh live bounty', () => {
  const { P } = character(20, 'warrior', 'human');
  P.place = Object.keys(D.PLACES).find((k) => G.isHub(k) && G.bounties(k).length);
  const hubs = Object.keys(D.PLACES).filter((k) => G.isHub(k) && G.bounties(k).length);
  const all = hubs.flatMap((h) => G.bounties(h));
  for (const b of all.slice(0, 7)) G.acceptBounty(b);
  assert.strictEqual(G.myBounties().length, 6);
  assert.strictEqual(G.bountyState(all[6]), 'available');
});

test('lapsed bounties leave the save when the character loads', () => {
  const { P } = lapsedAndLive();
  G.save(); G.load(G.S.id);
  const kept = Object.values(G.S.player.bounty);
  assert.strictEqual(kept.length, 2, `only today's stay: ${kept.map((x) => x.day).join(', ')}`);
  assert.ok(P !== G.S.player);
});
