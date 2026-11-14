// The group-ready dialog says "tap someone for their card" only when someone is there to tap: a small group lists
// everyone, a raid lists only counts plus friends and guildmates, so a raid of strangers gets no hint.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../src/ui.js'), 'utf8');
const at = src.indexOf('  function showPop(q) {');
const body = src.slice(at, src.indexOf('\n  }\n', at));

test('the pop hint depends on members you can tap, not on the counts block', () => {
  assert.ok(at > 0, 'showPop is there');
  const hint = /\$\{(\w+) \? ' · tap someone for their card' : ''\}/.exec(body);
  assert.ok(hint, 'the hint is there');
  assert.notStrictEqual(hint[1], 'who', 'the counts block alone (a raid of strangers) shows no hint');
  const def = new RegExp(`const ${hint[1]} = ([^;]+);`).exec(body);
  assert.ok(def && /knownOnly/.test(def[1]), 'a raid counts only friends and guildmates as tappable');
});
