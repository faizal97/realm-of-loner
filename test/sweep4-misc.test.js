// Runs together with other realms (#363), and a save code without the realm-only history (#376).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, B, character } = require('./world');

test('a teammate from another realm is remembered by name and realm (#363)', () => {
  const { S } = character(20);
  const nb = B.makeBot(S.nextBotId++, new Set(S.bots.map((x) => x.name)), { level: 20 }); nb.realm = 'Copperbell';
  G.remember(nb, { run: 'deadmines', wipes: 1 }); G.remember(nb, { run: 'deadmines' });
  const m = G.metWith(nb.id, nb);
  assert.ok(m && m.n === 2 && m.wipes === 1);
  assert.strictEqual(G.metWith(nb.id), null, 'never under an id that means no one here');
});

test('a save code leaves out the realm-only history; the cloud copy keeps it (#376)', async () => {
  const { S } = character(20);
  for (const b of S.bots.slice(0, 200)) b.hist = Array.from({ length: 12 }, (_, i) => ({ t: i, k: 'ding', lv: i + 2 }));
  S.server.gone = Array.from({ length: 1500 }, (_, i) => 'Gonename' + i);
  const lite = await G.encodeSave(S, true), full = await G.encodeSave(S);
  assert.ok(lite.length < full.length, `${lite.length} vs ${full.length}`);
  const back = await G.decodeSave(lite);
  assert.strictEqual(back.player.name, S.player.name);
  assert.ok(!back.server.gone);
});
