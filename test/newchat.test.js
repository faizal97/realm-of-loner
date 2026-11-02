// A new character keeps its chat on its first load: the v10 names migration ran on new saves too and kept only open
// requests, so the welcome lines vanished on the first reload.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G } = require('./world');

test('a new character\'s chat survives its first reload', () => {
  if (G.S) G.logout();
  G.newGame({ name: 'Newby', cls: 'mage', race: 'human' });
  const id = G.S.id, n = G.S.chat.length;
  assert.ok(n > 0, 'the welcome lines');
  G.logout(); G.load(id);
  assert.ok(G.S.chat.length >= n, `${G.S.chat.length} of ${n} lines kept`);
});
