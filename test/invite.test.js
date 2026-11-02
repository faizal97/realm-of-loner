// Invite reaches only someone where you are (#304): the player card shows people from anywhere on the realm, and an
// accepted invite once pulled a player from another zone into your party on the spot.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, B, character, now } = require('./world');

test('an invite to someone online elsewhere is refused; someone here gets one', () => {
  const { S, P } = character(5, 'warrior', 'human'), d = new Date(now());
  const mine = (b) => B.factionOf(b) === G.myFaction();
  const away = S.bots.find((b) => mine(b) && B.isOnline(b, d) && B.placeFor(b, d) !== P.place);
  const here = B.onlineIn(S, P.place, d).find(mine);
  assert.ok(away && here, 'the realm has both');
  const before = S.pending.length;
  G.invite(away.id);
  assert.strictEqual(S.pending.length, before, 'no reply is coming from another zone');
  G.invite(here.id);
  assert.strictEqual(S.pending.length, before + 1, 'someone here answers');
});
