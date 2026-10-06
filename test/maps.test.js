// Every place is on a map (#134, #136): the Gates of Gearhollow, the Thorn Warrens and the Magma Throne had roads but no
// point on their zone's map, Rumhook Bay's seven places didn't fit The Vinewild's, and Saltmarsh had no map at all (nor a
// point on the world map). A place is on its zone's map, or on a map of its own inside that zone (SUBMAPS: Rumhook Bay),
// opened from a marker on the zone's map. A new place, a new gate above all, fails here until it has a point.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs'), path = require('path');
const { D } = require('./world');

// an object literal from src/ui.js by its name (the UI isn't loaded in Node)
const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui.js'), 'utf8');
function literal(name) {
  const at = src.indexOf(`const ${name} = {`); assert.ok(at >= 0, `${name} in ui.js`);
  let depth = 0, from = src.indexOf('{', at), to = -1;
  for (let k = from; k < src.length && to < 0; k++) { if (src[k] === '{') depth++; else if (src[k] === '}' && !--depth) to = k; }
  return eval('(' + src.slice(from, to + 1) + ')');
}
const MAPS = literal('MAPS'), SUBMAPS = literal('SUBMAPS'), WORLD = literal('WORLD');
const inside = (x, y) => x >= 0 && x <= 340 && y >= 0 && y <= 400;

test('every place is on its zone map or on a map inside its zone (gates, Rumhook Bay and Saltmarsh included)', () => {
  const onMap = (k) => { const r = D.PLACES[k].region; return !!((MAPS[r] && MAPS[r][k]) || Object.keys(SUBMAPS).some((s) => SUBMAPS[s].parent === r && MAPS[s][k])); };
  assert.deepStrictEqual(Object.keys(D.PLACES).filter((k) => !onMap(k)).map((k) => `${D.PLACES[k].region}: ${k} (${D.PLACES[k].name})`), []);
});

test('a map inside a zone opens from a marker on the zone map, joined to its road, and has a way back', () => {
  for (const [k, S] of Object.entries(SUBMAPS)) {
    assert.ok(MAPS[k] && MAPS[S.parent] && D.REGIONS[S.parent], `${k}: its map and its zone's map exist`);
    assert.ok(S.name && inside(...S.at) && inside(...S.back), `${k}: a name, and its marker and way back inside the map`);
    assert.ok(MAPS[S.parent][S.from] && Object.keys(MAPS[k]).some((p) => D.PLACES[p].links[S.from]), `${k}: the marker's road starts at ${S.from}, which leads into it`);
    assert.ok(MAPS[k][S.backFrom] && D.PLACES[S.backFrom].links[S.from], `${k}: the way back starts at ${S.backFrom}, on the road out`);
    assert.ok(Object.keys(MAPS[k]).every((p) => D.PLACES[p].region === S.parent), `${k}: every place in it belongs to ${S.parent}`);
  }
});

test('every zone with places is on the world map', () => {
  const zones = [...new Set(Object.values(D.PLACES).map((p) => p.region))];
  assert.deepStrictEqual(zones.filter((r) => !WORLD[r]).map((r) => `${r} (${D.REGIONS[r].name})`), []);
});

test('map points sit inside the map, and no two places in a map share a point', () => {
  for (const [r, M] of Object.entries(MAPS)) {
    const seen = new Set();
    for (const [k, [x, y]] of Object.entries(M)) {
      assert.ok(inside(x, y), `${r}: ${k} at ${x},${y} is off the 340x400 map`);
      assert.ok(!seen.has(x + ',' + y), `${r}: ${k} shares its point`); seen.add(x + ',' + y);
    }
  }
});
