// A passer-by only saw a fight that happened outdoors: a kill inside a dungeon run is not one (play-test, build 69aa5d9).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const W = require('./world');
const { G, B, character } = W;

test('a kill in a dungeon run is not one a passer-by in town saw you fight', () => {
  const { S, P } = character(35, 'warrior', 'human'); P.lastKill = null;
  G.startRoulette();
  assert.ok(S.run, 'in a run');
  const k0 = P.kills;
  for (let i = 0; i < 4000 && P.kills === k0; i++) { const R = S.run; if (R.phase === 'rest') { R.restUntil = 0; G.runPull(); } if (G.fight) for (const e of G.fight.enemies) e.hp = 1; W.advance(0.25); }
  assert.ok(P.kills > k0, 'killed something in the run');
  const fought = B.lineContext(S).fought; G.leaveGroup();
  assert.strictEqual(fought, null);
});
