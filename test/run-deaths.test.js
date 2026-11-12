// Hero -> Deaths counts every death (play-test, beta.7): a death in a dungeon or raid counted nowhere, only the open
// world's and PvP's did, so a player who died in runs saw 0
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, character, advance } = require('./world');

function runFight() {
  const { S, P } = character(30, 'warrior', 'human');
  G.startRoulette(); assert.ok(S.run, 'in a run');
  G.runPull(); advance(0.2);
  const C = G.fight; assert.ok(C && C.kind === 'run', 'a run fight');
  return { S, P, C };
}

test('dying in a dungeon fight the group wins counts a death', () => {
  const { P, C } = runFight();
  const d0 = P.deaths || 0;
  G.pUnit.hp = 0; G.pUnit.dead = true;
  for (const e of C.enemies) { e.hp = 0; e.dead = true; }
  advance(0.5);
  assert.notStrictEqual(G.fight, C, 'the fight ended');
  assert.strictEqual(P.deaths, d0 + 1);
});

test('a wipe in a dungeon counts a death', () => {
  const { P, C } = runFight();
  const d0 = P.deaths || 0;
  for (const u of C.allies) { u.hp = 0; u.dead = true; }
  advance(0.5);
  assert.strictEqual(G.S.run.phase, 'wipe');
  assert.strictEqual(P.deaths, d0 + 1);
});

test('a dungeon fight won alive counts no death', () => {
  const { P, C } = runFight();
  const d0 = P.deaths || 0;
  for (const e of C.enemies) { e.hp = 0; e.dead = true; }
  advance(0.5);
  assert.strictEqual(P.deaths || 0, d0);
});
