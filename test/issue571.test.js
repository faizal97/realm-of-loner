// Keybinds (#571): Space gets a visible label; Arrange never keeps an old key wait armed.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const src = fs.readFileSync(require('path').join(__dirname, '../src/ui.js'), 'utf8');
const at = src.indexOf('  function keyLabel(e) {'), end = src.indexOf('\n  }\n', at) + 4;
const keyLabel = new Function(src.slice(at, end) + '; return keyLabel;')();

test('Space reads Spc, never a blank label', () => {
  assert.strictEqual(keyLabel({ code: 'Space', key: ' ' }), 'Spc');
  assert.strictEqual(keyLabel({ code: 'Space', key: ' ', shiftKey: true }), 'SSpc');
  assert.strictEqual(keyLabel({ code: 'Digit3', key: '3' }), '3');
  assert.strictEqual(keyLabel({ code: 'KeyQ', key: 'q' }), 'Q');
});

test('opening Arrange and picking a tile both drop a key wait', () => {
  const ed = src.slice(src.indexOf('  function openBarEditor() {'), src.indexOf('  function openBarEditor() {') + 3000);
  assert.match(ed, /let pick = null; keyCapture = null;/);
  assert.match(ed, /pick = pick === i \? null : i; keyCapture = null;/);
});
