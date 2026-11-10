// #547: Hero → Journey rows asked for a Social tab named 'groups'; there is none, so they opened on the Guild tab.
// Every openSocial call in the ui names a tab that exists.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');

test('every openSocial(...) names a real Social tab', () => {
  const src = fs.readFileSync(require.resolve('../src/ui.js'), 'utf8');
  const tabs = new Set([...src.match(/for \(const \[k, label\] of (\[\['group'[^\n]*?\]\])\)/)[1].matchAll(/\['(\w+)', '/g)].map((m) => m[1]));
  assert.ok(tabs.has('group') && tabs.has('guild'), 'found the tab list');
  const bad = [...src.matchAll(/openSocial\('(\w+)'\)/g)].map((m) => m[1]).filter((t) => !tabs.has(t));
  assert.deepStrictEqual(bad, []);
});
