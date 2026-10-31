// Release notes in game (UPD.notesHtml): bold names, and an italic dev note indented under its bullet stays in that
// bullet, as docs/release-notes-style.md writes it.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
require('../src/update.js');
const UPD = globalThis.UPD;

test('an indented italic dev note stays under its bullet', () => {
  const html = UPD.notesHtml('**Balance**\n- **Heirlooms**: 130% → 90%.\n  *Dev note: too strong.*\n- Next.\n');
  assert.strictEqual(html, '<p><b>Balance</b></p><ul><li><b>Heirlooms</b>: 130% → 90%.<br><i>Dev note: too strong.</i></li><li>Next.</li></ul>');
});

test('a bulleted dev note and bold still read right', () => {
  assert.strictEqual(UPD.notesHtml('- *Dev note: x.*'), '<ul><li><i>Dev note: x.</i></li></ul>');
  assert.strictEqual(UPD.notesHtml('a **b** c'), '<p>a <b>b</b> c</p>');
});

test('the shipped v10.16.0 notes show no stray asterisks', () => {
  const md = require('fs').readFileSync(require('path').join(__dirname, '../notes/v10.16.0.md'), 'utf8');
  assert.doesNotMatch(UPD.notesHtml(md).replace(/<[^>]+>/g, ''), /\*/);
});
