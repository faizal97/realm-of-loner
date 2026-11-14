// The docked loot roll (under the run panel) draws its icon in a 32 px column; the icon's frame (.rollic, 40 px
// elsewhere) must shrink to it too, or it runs 8 px into the item's name.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const css = fs.readFileSync(path.join(__dirname, '../src/style.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

test('the docked roll sizes the icon frame to its 32 px column', () => {
  const col = /\.roll\.docked\s*\{[^}]*grid-template-columns:\s*(\d+)px/.exec(css);
  assert.ok(col, 'the docked roll has a fixed icon column');
  const rule = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].find((m) => /\.roll\.docked\s+\.rollic\b/.test(m[1]));
  assert.ok(rule, '.roll.docked .rollic has its own size');
  const w = /width:\s*(\d+)px/.exec(rule[2]);
  assert.ok(w && +w[1] <= +col[1], `frame ${w && w[1]}px fits the ${col[1]}px column`);
});
