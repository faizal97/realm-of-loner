// Friends, chat requests and guilds (beta.4 sweep): invite answers say only what happened (#386).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const W = require('./world');
const { G, D, B, character, advance } = W;
const toasts = []; G.on('toast', (t) => toasts.push(t));

test('"joined your party" only for someone who joined (#386)', () => {
  const { S, P } = character(30);
  const cnt = (k) => B.onlineIn(S, k, new Date()).filter((x) => B.factionOf(x) === G.myFaction()).length;
  P.place = Object.keys(D.PLACES).sort((a, b) => cnt(b) - cnt(a))[0];
  const here = B.onlineIn(S, P.place, new Date()).filter((x) => B.factionOf(x) === G.myFaction()).slice(0, 4);
  assert.ok(here.length >= 3, 'enough people here');
  const rr = Math.random; Math.random = () => 0.01; // everyone says yes
  try { for (const x of here) G.invite(x.id); } finally { Math.random = rr; }
  toasts.length = 0; advance(6);
  const joined = toasts.filter((t) => /joined your party/.test(t)).length;
  assert.strictEqual(joined, S.wparty.members.length, JSON.stringify(toasts));
});
