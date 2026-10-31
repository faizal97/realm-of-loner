// Tidecrown and Veshmira's storm (#288): a clear of Veshmira's Lair lifts the storm as well as the quest, and while it
// blocks, the game can list the quest chain that ends in The Brood Mother, each step with its giver, place and state.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

test('a Veshmira\'s Lair clear lifts the storm without the quest', () => {
  const { P } = character(60, 'warrior', 'human');
  assert.strictEqual(G.stormBroken(), false);
  assert.match(G.activityBlock('tidecrown_citadel'), /storm/);
  P.codex = { onyxias_lair: { clears: 1, flawless: 0, speed: 0, best: null } };
  assert.strictEqual(G.stormBroken(), true);
  assert.doesNotMatch(String(G.activityBlock('tidecrown_citadel')), /storm/);
});

test('the storm chain lists each step in order with giver, place and state', () => {
  const { P } = character(60, 'warrior', 'human');
  const ch = G.stormChain();
  assert.deepStrictEqual(ch.map((s) => s.q), ['dw_to_theramore', 'dw_a_whelps', 'dw_a_drakonids', 'dw_a_dragonspawn', 'dw_a_lair', 'dw_onyxia_a']);
  for (const s of ch) { assert.ok(D.NPCS[s.npc] && D.PLACES[s.place], s.q); assert.ok(D.PLACES[s.place].npcs.includes(s.npc)); }
  assert.strictEqual(ch[0].state, 'next');
  assert.ok(ch.slice(1).every((s) => s.state === 'ahead'));
  P.done.dw_to_theramore = 1; P.quests.dw_a_whelps = { prog: [0] };
  assert.deepStrictEqual(G.stormChain().map((s) => s.state).slice(0, 3), ['done', 'current', 'ahead']);
});

test('a Krugar character gets the Krugar chain', () => {
  G.newGame({ name: 'Orc', cls: 'warrior', race: 'orc' }); G.S.player.level = 60;
  assert.strictEqual(G.stormChain().slice(-1)[0].q, 'dw_onyxia_h');
});
