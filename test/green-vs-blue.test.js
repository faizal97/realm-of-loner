// Past level 50 a green you get sat a point under the blue (34 vs 35 at 60), so a blue barely beat a green.
// Greens you get are now a fifth under that level's blue; group-finder players keep their old greens, because
// dungeon difficulty was tuned on them (cutting theirs too took bad draw at 60 from 37% to 64% of runs with a wipe).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D } = require('./world');
const pts = (it) => Object.values(it.stats || {}).reduce((a, v) => a + v, 0);

test('a level-60 green you get is clearly under a blue', () => {
  const g = pts(G.genGear('chest', 60, 2, { atype: 'mail' })), b = pts(G.genGear('chest', 60, 3, { atype: 'mail' }));
  assert.ok(b >= g * 1.15, `blue ${b} vs green ${g}`);
});

test('a group-finder player at 60 still wears the old green budget', () => {
  const ch = G.botChar({ id: -1, name: 'Test', cls: 'warrior', role: 'tank', level: 60, skill: 0.3 });
  const greens = Object.values(ch.equip).filter((it) => it && it.q === 2 && it.slot !== 'weapon' && it.slot !== 'ranged');
  assert.ok(greens.length > 0, 'a careless player wears greens');
  for (const it of greens) assert.strictEqual(pts(it), Math.round(60 * 0.55 + 1), it.slot);
});
