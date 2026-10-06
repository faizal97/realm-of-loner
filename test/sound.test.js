// Volume sliders (#120): the saved sound prefs load in any format (an old { music, sfx } save comes in at 100% with its
// on/off, never silent), the slider maps to the gain the game always had at 100% and to silence at 0%, and On/Off
// mutes without losing the slider's value. Runs src/sound.js in Node with no audio: no AudioContext, no AUDIO_DATA.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const SRC = path.join(__dirname, '..', 'src', 'sound.js');

// a fresh copy of src/sound.js over a storage that holds `saved` (a string, or nothing) under azsolo.sound
function load(saved) {
  const m = new Map(); if (saved != null) m.set('azsolo.sound', saved);
  globalThis.localStorage = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
  delete globalThis.SND; delete require.cache[require.resolve(SRC)]; require(SRC);
  return { SND: globalThis.SND, stored: () => JSON.parse(m.get('azsolo.sound')) };
}

test('a save from before the sliders keeps its on/off and loads at 100%, never silent', () => {
  for (const [old, music, sfx] of [[{ music: true, sfx: true }, true, true], [{ music: false, sfx: true }, false, true], [{ music: true, sfx: false }, true, false]]) {
    const { SND } = load(JSON.stringify(old));
    assert.deepStrictEqual(SND.prefs, { music, sfx, musicVol: 100, sfxVol: 100 }, JSON.stringify(old));
  }
});

test('no save, an empty one or a broken one: both on, both at 100%', () => {
  for (const saved of [undefined, '{}', 'not json', 'null', '[]']) assert.deepStrictEqual(load(saved).SND.prefs, { music: true, sfx: true, musicVol: 100, sfxVol: 100 }, String(saved));
});

test('a saved slider value comes back, snapped to a step of 5 and kept within 0-100', () => {
  assert.deepStrictEqual(load(JSON.stringify({ music: true, sfx: false, musicVol: 60, sfxVol: 0 })).SND.prefs, { music: true, sfx: false, musicVol: 60, sfxVol: 0 });
  const { SND } = load(JSON.stringify({ musicVol: 37, sfxVol: 140 }));
  assert.strictEqual(SND.prefs.musicVol, 35); assert.strictEqual(SND.prefs.sfxVol, 100);
  assert.strictEqual(load(JSON.stringify({ musicVol: -20, sfxVol: 'loud' })).SND.prefs.musicVol, 0);
  assert.strictEqual(load(JSON.stringify({ musicVol: -20, sfxVol: 'loud' })).SND.prefs.sfxVol, 100);
});

test('the slider maps to the gain: 100% is the old level, 0% silent, and every step is quieter than the one above', () => {
  const { SND } = load();
  assert.strictEqual(SND.volGain('music', 100), 0.55); assert.strictEqual(SND.volGain('sfx', 100), 0.9);
  assert.strictEqual(SND.volGain('music', 0), 0); assert.strictEqual(SND.volGain('sfx', 0), 0);
  for (const k of ['music', 'sfx']) for (let v = 5; v <= 100; v += 5) assert.ok(SND.volGain(k, v) > SND.volGain(k, v - 5), `${k} ${v}%`);
  assert.ok(Math.abs(SND.volGain('music', 50) - 0.55 / 4) < 1e-12, 'half the slider is a quarter of the gain (loudness follows the square)');
});

test('On/Off mutes and keeps the slider value; the slider saves on this device', () => {
  const { SND, stored } = load(JSON.stringify({ music: true, sfx: true }));
  SND.setVol('music', 60); assert.strictEqual(SND.prefs.musicVol, 60); assert.strictEqual(stored().musicVol, 60);
  SND.setPref('music', false); assert.strictEqual(SND.gainOf(SND.prefs, 'music'), 0, 'off is silent');
  assert.strictEqual(SND.prefs.musicVol, 60); assert.strictEqual(stored().musicVol, 60, 'the value stays while off');
  SND.setPref('music', true); assert.strictEqual(SND.gainOf(SND.prefs, 'music'), SND.volGain('music', 60), 'on brings 60% back');
  SND.setVol('sfx', 0); assert.strictEqual(SND.gainOf(SND.prefs, 'sfx'), 0, '0% is silent with Effects on');
  assert.deepStrictEqual(load(JSON.stringify(stored())).SND.prefs, { music: true, sfx: true, musicVol: 60, sfxVol: 0 }, 'it all loads back');
});
