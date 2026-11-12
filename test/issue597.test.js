// Group-run play-test fixes (#597).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const src = fs.readFileSync(require('path').join(__dirname, '../src/ui.js'), 'utf8');
const fnSrc = (name) => { const at = src.indexOf('  function ' + name + '('); assert.ok(at >= 0, name); return src.slice(at, src.indexOf('\n  }\n', at) + 4); };

test('a fight opens on Party only for a player in the healer role, not for a class that can heal', () => {
  for (const [role, want] of [['healer', 'party'], ['tank', 'next'], ['dps', 'next']]) {
    const G = { role: () => role, healsAllies: () => true }; // a Paladin, Druid or Shaman: heals allies whatever the role
    const runTabNow = new Function('G', 'ui', fnSrc('runTabNow') + '; return runTabNow;')(G, {});
    const R = { phase: 'fight' }, C = {};
    assert.strictEqual(runTabNow(R, C, G.healsAllies()), want, role);
    assert.strictEqual(runTabNow(R, null, G.healsAllies()), 'next', role + ' between pulls');
  }
});
