// #72: a person wears the same gear every time you meet them; a new level is a new set; the odds of each quality (the
// power band) are the ones every bot had before.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, B } = require('./world');

const gear = (c) => JSON.stringify(Object.keys(c.equip).sort().map((s) => [s, c.equip[s].id, c.equip[s].name, c.equip[s].q, c.equip[s].stats]));
const bot = (id, level, skill) => ({ id, name: 'Testbot' + id, cls: 'warrior', race: 'human', level, skill, role: 'dps' });

test('the same bot, met twice, wears the same gear; a new level is a new set', () => {
  if (!G.S) G.newGame({ name: 'Ana', cls: 'warrior', race: 'human' });
  const b = bot(4242, 60, 0.9);
  assert.strictEqual(gear(G.botChar(b)), gear(G.botChar(Object.assign({}, b))));
  assert.notStrictEqual(gear(G.botChar(b)), gear(G.botChar(Object.assign({}, b, { level: 59 }))));
  const before = Math.random(); G.botChar(b); assert.notStrictEqual(Math.random(), before, 'the game\'s own random numbers are back after');
});

// #582: Rare chests for 60% of skilled bots (was 40%), and an unskilled one wears Uncommon (was Common with no stats)
test('the quality odds: about 60% rare chests for a skilled bot, uncommon for an unskilled one', () => {
  let rare = 0, low = 0; const n = 2000;
  for (let i = 0; i < n; i++) { if (G.botChar(bot(i, 60, 0.9)).equip.chest.q === 3) rare++; if (G.botChar(bot(i, 60, 0.3)).equip.chest.q === 2) low++; }
  assert.ok(Math.abs(rare / n - 0.6) < 0.04, `rare share ${rare / n}`);
  assert.strictEqual(low, n);
});

test('gear names fit the level: no Linen at 60, no Gossamer at 5', () => {
  const names = (lvl) => { const out = new Set(); for (let i = 0; i < 300; i++) for (const a of ['cloth', 'leather', 'mail']) out.add(G.genGear('chest', lvl, 2, { atype: a }).name.split(' ')[0]); return out; };
  const at60 = names(60), at5 = names(5);
  for (const low of ['Linen', 'Woolen', 'Homespun', 'Rawhide', 'Chainmail', 'Ringed']) assert.ok(!at60.has(low), `${low} at 60`);
  for (const high of ['Gossamer', 'Spellwoven', 'Blacksteel', 'Wyvernhide']) assert.ok(!at5.has(high), `${high} at 5`);
});
