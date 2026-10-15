// The Bard on test builds only (#255): a dev build lets every race pick it so it can be tried before it ships; a live
// build keeps it hidden (test/issue251.test.js checks that half, issue255-beta.test.js the beta). Each test file runs in its own process.
'use strict';
globalThis.AZ_DEV = { sha: 'test000' };
const test = require('node:test');
const assert = require('node:assert');
const { D } = require('./world');

test('on a dev build every race can be a Bard', () => {
  assert.ok(!D.CLASSES.bard.hidden);
  for (const r in D.RACES) assert.ok(D.RACES[r].classes.includes('bard'), r);
});
