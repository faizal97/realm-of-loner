// Every game source file parses (df02a5d shipped a comment that cut a line of ui.js in half: the tests never load ui.js,
// so only a black screen showed it). node --check on each file, the way the browser would read it.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const SRC = path.join(__dirname, '..', 'src');
const files = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? files(path.join(d, e.name)) : e.name.endsWith('.js') ? [path.join(d, e.name)] : []);

test('every src/**/*.js file parses', () => {
  const bad = [];
  for (const f of files(SRC)) { try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); } catch (e) { bad.push(path.relative(SRC, f) + ': ' + String(e.stderr).split('\n').find((l) => /Error/.test(l))); } }
  assert.deepStrictEqual(bad, []);
});
