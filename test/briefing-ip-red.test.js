// The briefing's "You <Item Power>" turns red when it is under the recommendation. The stylesheet has no global .red
// rule (only inside tooltips, cooking and bag facts), so the span carries its own colour.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const ui = fs.readFileSync(path.join(__dirname, '../src/ui.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../src/style.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

test('the briefing colours your Item Power red when it is under the recommendation', () => {
  const line = ui.split('\n').find((l) => l.includes('` · You ${mine}`'));
  assert.ok(line, 'the briefing\'s Item Power row is there');
  const globalRed = /(^|})\s*\.red\s*[{,]/m.test(css);
  assert.ok(globalRed || /color:\s*'#[0-9a-f]{6}'/i.test(line), 'the span has a colour that applies outside a tooltip');
});
