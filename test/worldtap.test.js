// Your own party never takes a mob from you (#313): the world's taps came from everyone online in the place, your party
// members too, and a mob your party member stood on read "Tapped by <them>. You won't get anything from it."
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, B, character, now } = require('./world');

test('a mob is never tapped by someone in your party', () => {
  const { S, P } = character(5, 'warrior', 'human'), D = globalThis.D, d = new Date(now());
  // a place with mobs and at least two people of your side
  // a place with mobs where the first person the world would pick (with the dice at 0) is of your side, and others too
  P.place = Object.keys(D.PLACES).find((k) => { const o = B.onlineIn(S, k, d); return (D.PLACES[k].mobs || []).length && !D.PLACES[k].city && o.length >= 2 && B.factionOf(o[0]) === G.myFaction(); });
  const near = B.onlineIn(S, P.place, d);
  assert.ok(near.length >= 2, 'people are here');
  const R = Math.random; Math.random = () => 0.99; try { G.acceptPartyInvite(near[0].id); } finally { Math.random = R; }
  assert.ok(S.wparty && S.wparty.members.some((m) => m.bot.id === near[0].id), 'they joined');
  Math.random = () => 0; // every mob that can be tapped is, by the first person in the list
  try { G.update(1.1); } finally { Math.random = R; }
  const mobs = Object.values(S.world).flatMap((W) => (W.mobs || []).concat(Object.values(W.named || {})));
  assert.ok(mobs.some((m) => m.state === 'tapped'), 'the world tapped mobs');
  assert.ok(!mobs.some((m) => m.state === 'tapped' && m.by === near[0].name), 'not by the party member');
});

test('a creature still on its way when the fight is won goes back to the world (#318)', () => {
  const { S, P } = character(8, 'warrior', 'human'), D = globalThis.D;
  P.place = Object.keys(D.PLACES).find((k) => (D.PLACES[k].mobs || []).length && !D.PLACES[k].city && D.PLACES[k].lvl && D.PLACES[k].lvl[0] <= 8);
  const [m, friend] = G.placeMobs().filter((x) => x.state === 'alive' && !x.id.startsWith('n_'));
  G.engage(m.id); assert.ok(G.fight, 'a fight');
  friend.state = 'fight'; G.fight.addAt = { t: 999, inst: friend };
  for (const e of G.fight.enemies) { e.hp = 0; e.dead = true; }
  G.update(0.3);
  assert.ok(!G.fight, 'won');
  assert.strictEqual(friend.state, 'alive', 'not stuck as fighting');
});
