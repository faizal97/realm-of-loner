// With storage full (#329): the character list says only what the saves hold, so it never lists a level, or a
// character, that a reload can't load.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, store } = require('./world');

const fresh = () => { if (G.S) G.logout(); store.clear(); G.R = null; };
const full = (fn) => { const set = store.setItem; store.setItem = function (k, v) { if (/char\./.test(k)) throw new Error('QuotaExceededError'); return set.call(this, k, v); }; try { fn(); } finally { store.setItem = set; } };

test('a refused save leaves the list as the save is', () => {
  fresh(); G.newGame({ name: 'Ana', cls: 'warrior', race: 'human' }); G.S.player.level = 10; G.save();
  const id = G.S.id;
  full(() => { G.S.player.level = 12; G.save(); });
  assert.strictEqual(G.characters().find((c) => c.id === id).level, 10, 'the list says 10, as the save does');
  assert.strictEqual(G.readSave(id).player.level, 10, 'and the save holds 10');
});

test('a character that was never written is not listed', () => {
  fresh(); G.newGame({ name: 'Ana', cls: 'warrior', race: 'human' }); G.save();
  full(() => { G.logout(); G.newGame({ name: 'Bel', cls: 'mage', race: 'human' }); G.save(); G.logout(); });
  assert.deepStrictEqual(G.characters().map((c) => c.name), ['Ana']);
});
