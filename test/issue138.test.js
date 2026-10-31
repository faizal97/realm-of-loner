// No route says why (#138): the enemy town the road runs through, and the Group Finder when an activity goes there.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D } = require('./world');
const find = (n) => Object.keys(D.PLACES).find((k) => D.PLACES[k].name === n);

test('a Krugar character: Gates of Gearhollow is behind Bjornstad, and the Group Finder goes there', () => {
  G.newGame({ name: 'T', cls: 'warrior', race: 'orc' }); G.S.player.level = 30;
  const to = find('Gates of Gearhollow');
  assert.strictEqual(G.route(G.S.player.place, to), null, 'no road');
  const b = G.routeBlock(G.S.player.place, to);
  assert.strictEqual(D.PLACES[b.town].name, 'Bjornstad');
  assert.ok(b.act && D.ACTIVITIES[b.act].where === to);
});

test('an ordinary place behind an enemy town names the town, no Group Finder', () => {
  G.newGame({ name: 'T', cls: 'warrior', race: 'orc' });
  const b = G.routeBlock(G.S.player.place, find('The Rimebone Den'));
  assert.strictEqual(D.PLACES[b.town].name, 'Bjornstad');
  assert.ok(!b.act);
});

test('a reachable place and an enemy town itself have no block', () => {
  G.newGame({ name: 'T', cls: 'warrior', race: 'human' });
  assert.strictEqual(G.routeBlock(G.S.player.place, find('The Rimebone Den')), null);
  G.newGame({ name: 'T', cls: 'warrior', race: 'orc' });
  assert.strictEqual(G.routeBlock(G.S.player.place, find('Bjornstad')), null);
});
