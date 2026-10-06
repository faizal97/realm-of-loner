// Every place is on its zone's map (#134): the Gates of Gearhollow, the Thorn Warrens and the Magma Throne existed and
// had roads, but the maps (MAPS in src/ui.js) had no point for them, so the map never showed them. A new place, a new
// gate above all, now fails this test until it has a point. The only exceptions are listed below, each with its issue.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs'), path = require('path');
const { D } = require('./world');

// the MAPS literal from src/ui.js (the UI isn't loaded in Node)
const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui.js'), 'utf8'), at = src.indexOf('const MAPS = {');
let depth = 0, from = src.indexOf('{', at), to = -1;
for (let k = from; k < src.length && to < 0; k++) { if (src[k] === '{') depth++; else if (src[k] === '}' && !--depth) to = k; }
const MAPS = eval('(' + src.slice(from, to + 1) + ')');

// known gaps, decided elsewhere (#136): Rumhook Bay doesn't fit on The Vinewild's map, and Saltmarsh has no map yet
const NOT_YET = { places: ['rumhook_bay', 'saltpenny_wharf', 'thunderhowl_rise', 'blackgull_cove', 'bonegrin_warcamp', 'bonded_yard', 'bloodsand_arena'], regions: ['dustwallow'] };

test('every place is on its zone map (dungeon and raid gates included)', () => {
  const missing = Object.keys(D.PLACES).filter((k) => { const p = D.PLACES[k]; return !NOT_YET.regions.includes(p.region) && !NOT_YET.places.includes(k) && !(MAPS[p.region] && MAPS[p.region][k]); });
  assert.deepStrictEqual(missing.map((k) => `${D.PLACES[k].region}: ${k} (${D.PLACES[k].name})`), []);
});

test('the exceptions are still real (remove one here once #136 puts it on a map)', () => {
  for (const k of NOT_YET.places) assert.ok(D.PLACES[k] && !(MAPS[D.PLACES[k].region] || {})[k], `${k} is on a map now: take it off the list`);
  for (const r of NOT_YET.regions) assert.ok(!MAPS[r], `${r} has a map now: take it off the list`);
});

test('map points sit inside the map, and no two places in a zone share a point', () => {
  for (const [r, M] of Object.entries(MAPS)) {
    const seen = new Set();
    for (const [k, [x, y]] of Object.entries(M)) {
      assert.ok(x >= 0 && x <= 340 && y >= 0 && y <= 400, `${r}: ${k} at ${x},${y} is off the 340x400 map`);
      assert.ok(!seen.has(x + ',' + y), `${r}: ${k} shares its point`); seen.add(x + ',' + y);
    }
  }
});
