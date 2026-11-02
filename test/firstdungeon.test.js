// The "Dungeons are open" tip comes at your side's first dungeon (#317): it came at 8 for everyone, where the Accord
// has none (the Smoke Pit is under Vazhrak); theirs open at 17.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, character } = require('./world');

test('each side\'s first dungeon level', () => {
  character(5, 'warrior', 'human'); assert.strictEqual(G.firstDungeonLvl(), 17);
  character(5, 'warrior', 'orc'); assert.strictEqual(G.firstDungeonLvl(), 8);
});
