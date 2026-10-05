// A dev build keeps its own storage (#92): played as a dev build, the game writes only "azsolo-next…" keys, so the /dev/
// page on the same site can never read or write a player's characters, settings or tips; and the updater, cloud saves
// and Friends stay off. test/livekeys.test.js is the other half: a normal build never writes a dev key.
'use strict';
globalThis.AZ_DEV = { sha: 'test000' };
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs'), path = require('path');
const { G, character, store } = require('./world');
const { key, DEV } = globalThis.AZ_DEVKEYS;

// every storage key the game names, read from its source (a new one is covered without touching this test)
const liveKeys = (() => {
  const keys = new Set(), dir = path.join(__dirname, '..', 'src');
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js'))) for (const m of fs.readFileSync(path.join(dir, f), 'utf8').matchAll(/['"`](azsolo\.[A-Za-z0-9_.:-]*)/g)) keys.add(m[1]);
  return [...keys];
})();

test('every key the game names maps to its own dev key, never to a live one', () => {
  assert.ok(liveKeys.length >= 15, `${liveKeys.length} keys found in src/`);
  for (const k of liveKeys) { const d = key(k); assert.ok(d.startsWith(DEV), `${k} -> ${d}`); assert.ok(!liveKeys.includes(d), `${d} is also a live key`); }
});

test('a dev session (new character, save, settings) writes only dev keys', () => {
  const { P } = character(16, 'mage', 'orc'); P.money += 5; G.save();
  for (const k of ['azsolo.tips', 'azsolo.sound', 'azsolo.speed', 'azsolo.seenVersion']) store.setItem(k, '1'); // what the UI writes
  const written = store.keys();
  assert.ok(written.length >= 5, `${written.length} keys written`);
  const live = written.filter((k) => k.startsWith('azsolo') && !k.startsWith(DEV));
  assert.deepStrictEqual(live, [], `a dev build wrote live keys: ${live.join(', ')}`);
  assert.ok(G.characters().length >= 1, 'the dev character is listed (read back through the dev keys)');
});

test('the updater, cloud saves and Friends are off in a dev build', async () => {
  for (const f of ['cloud', 'friends']) require(`../src/${f}.js`);
  assert.strictEqual(await globalThis.UPD.check(true), null, 'no release is offered');
  assert.strictEqual(globalThis.CLOUD.on() || globalThis.CLOUD.available(), false, 'cloud saves off');
  assert.strictEqual(globalThis.FRIENDS.on() || globalThis.FRIENDS.available(), false, 'Friends off');
});
