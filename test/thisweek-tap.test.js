// This week banners must open on the first tap. Any style on .wk-banner:active (a 1px shift, a brightness) made the
// browser jump the banner list on press, so the tap landed in the gap and a second tap opened the banner above.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

test('This week banners have no press style that moves the list', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'src', 'style.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/\.wk-banner:active/.test(css), 'style.css has a .wk-banner:active rule');
});
