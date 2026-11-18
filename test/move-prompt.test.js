// The Android app moved to a new package, so a fresh install starts empty. Its first launch with no characters says
// this is the new app and offers the old app's characters back (cloud save, or a save code without Google Play
// services). Only in the app, only with no characters, only once.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const ui = fs.readFileSync(path.join(__dirname, '../src/ui.js'), 'utf8');
const fnBody = (name) => { const i = ui.indexOf(`function ${name}(`); assert.ok(i > 0, `${name} is there`); return ui.slice(i, ui.indexOf('\n  }\n', i)); };

test('the move prompt shows only in the app, with no characters, once', () => {
  const b = fnBody('moveCheck');
  assert.match(b, /UPD\.inApp\(\)/, 'only in the Android app');
  assert.match(b, /G\.characters\(\)\.length\) return/, 'never once a character exists');
  assert.match(b, /localStorage\.getItem\(MOVE_KEY\)\) return; localStorage\.setItem\(MOVE_KEY/, 'asked once, remembered');
  assert.match(b, /ui\.dialog \|\| \(window\.CS && CS\.playing\)/, 'never over a dialog or a cutscene');
});

test('the move prompt offers cloud save, or a save code where cloud save cannot work', () => {
  const b = fnBody('moveDialog');
  assert.match(b, /CLOUD\.available\(\)/);
  assert.match(b, /openRestore\(/, 'cloud: the Google Drive restore');
  assert.match(b, /importSave\(\)/, 'no cloud: Load save code');
  assert.match(b, /'Start new'/);
  assert.match(fnBody('showCreate'), /if \(!fromSelect\) moveCheck\(\)/, 'checked when the game opens on Create');
});
