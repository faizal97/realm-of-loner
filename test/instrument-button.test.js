// A bard's instruments are one button (#261): it shows the instrument played now, a tap moves to the next one learned,
// and like Eat and Drink it is on the bar only outside a fight (three buttons that only refused in a fight before).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { G, D, character } = require('./world');

test('a tap moves to the next instrument learned and wraps around', () => {
  const { P } = character(20, 'bard', 'human');
  assert.strictEqual(G.instrumentAb(), 'play_lute');
  const seen = [];
  for (let i = 0; i < 4; i++) { assert.strictEqual(G.nextInstrument(), null); seen.push(P.instrument); }
  assert.deepStrictEqual(seen, ['drum', 'horn', 'lute', 'drum']);
  assert.strictEqual(G.instrumentAb(), 'play_drum');
});

test('below level 10 the Lute is the only one, and the tap says when the Drum comes', () => {
  const { P } = character(5, 'bard', 'human');
  assert.match(G.nextInstrument(), /level 10/);
  assert.ok(!P.instrument || P.instrument === 'lute');
});

test('at level 10 it moves between the Lute and the Drum only', () => {
  const { P } = character(10, 'bard', 'human');
  G.nextInstrument(); assert.strictEqual(P.instrument, 'drum');
  G.nextInstrument(); assert.strictEqual(P.instrument, 'lute');
});

test('the bar has one instrument button, out of a fight only, with the instrument played now', () => {
  const ui = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui.js'), 'utf8');
  assert.match(ui, /G\.knownAbilities\(\)\.filter\(\(id\) => !D\.ABILITIES\[id\]\.instrument \|\| id === 'play_lute'\)/);
  assert.match(ui, /const peaceOnly = \(id\) => [^\n]*\.instrument/);
  assert.match(ui, /const abIcon = \(id\) => \{ id = barAb\(id\);/);
  for (const id of G.INSTRUMENTS) assert.ok(ART_ICON_KEYS().includes(D.ABILITIES[id].icon), id + ' has its own icon');
  assert.strictEqual(new Set(G.INSTRUMENTS.map((id) => D.ABILITIES[id].icon)).size, 3);
});

function ART_ICON_KEYS() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'art_legends.js'), 'utf8');
  return [...src.matchAll(/^ {4}([a-z_]+): function \(c\)/gm)].map((m) => m[1]);
}
