// The other half of #92: a normal build never writes a dev build's key, so the game and /dev/ never share a save.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, character, store } = require('./world');

test('a normal session writes live keys only, never "azsolo-next…"', () => {
  const { P } = character(16, 'mage', 'orc'); P.money += 5; G.save();
  const written = store.keys();
  assert.ok(written.some((k) => k.startsWith('azsolo.char.')), 'the character is saved under its live key');
  assert.deepStrictEqual(written.filter((k) => k.startsWith('azsolo-next')), []);
  assert.ok(!globalThis.AZ_DEV, 'not a dev build');
});
