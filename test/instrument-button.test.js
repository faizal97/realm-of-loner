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
  assert.match(ui, /const barIcon = \(id\) => abIcon\(barAb\(id\)\);/); assert.match(ui, /img\(barIcon\(id\)\), h\('div', \{ class: 'cd' \}\)/);
  for (const id of G.INSTRUMENTS) assert.ok(ART_ICON_KEYS().includes(D.ABILITIES[id].icon), id + ' has its own icon');
  assert.strictEqual(new Set(G.INSTRUMENTS.map((id) => D.ABILITIES[id].icon)).size, 3);
});

function ART_ICON_KEYS() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'art_legends.js'), 'utf8');
  return [...src.matchAll(/^ {4}([a-z_]+): function \(c\)/gm)].map((m) => m[1]);
}

// the bar keeps its size in and out of a fight (#66): out of a fight Eat, Drink and the instrument sit in fight-only
// slots; a fight added one empty slot for each of them as well, a row of empty buttons once there were three (#261)
test('a fight adds no empty slots to the bar when the out-of-fight buttons fit in fight-only slots', () => {
  const ui = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui.js'), 'utf8');
  const i = ui.indexOf('  function barSlots() {'), src = ui.slice(i, ui.indexOf('\n  }\n', i) + 4);
  const AB = { a: {}, b: {}, s1: { combatOnly: true }, s2: { combatOnly: true }, s3: { combatOnly: true }, play_lute: { instrument: 'lute' } };
  const slots = (fight, base) => new Function('G', 'D', 'barArrange', 'barPool', src + '; return barSlots();')(
    { S: { player: { bags: [] } }, racial: () => null, fight }, { ABILITIES: AB }, () => base, () => base);
  const base = ['a', 's1', 'play_lute', 'b', 's2', 's3', 'step_back', 'eat', 'drink'];
  assert.deepStrictEqual(slots(false, base), ['a', 'play_lute', 'b', 'eat', 'drink', null]);
  assert.deepStrictEqual(slots(true, base), ['a', 's1', 'b', 's2', 's3', 'step_back']);
  // more out-of-fight buttons than fight-only slots: the extra ones go at the end, an empty slot in a fight
  assert.deepStrictEqual(slots(false, ['a', 'step_back', 'eat', 'drink']), ['a', 'eat', 'drink']);
  assert.deepStrictEqual(slots(true, ['a', 'step_back', 'eat', 'drink']), ['a', 'step_back', null]);
});

// every Bard ability has its own icon (#261): eight of them borrowed another's (Sharp Refrain and Mocking Verse wore
// Dissonant Note's, Ballad of Blades and Shatterchord Requiem's, ...), so two buttons on the bar looked the same
test('no two Bard abilities share an icon, and each is drawn', () => {
  const bard = Object.entries(D.ABILITIES).filter(([, a]) => a.cls === 'bard'), seen = {};
  for (const [k, a] of bard) { const ic = a.icon || k; assert.ok(!seen[ic], `${k} and ${seen[ic]} share ${ic}`); seen[ic] = k; assert.ok(ART_ICON_KEYS().includes(ic), `${ic} is drawn`); }
});
