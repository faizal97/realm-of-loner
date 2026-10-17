// The Bard on a dev build (#255): every race can pick it, as on a live build (test/issue251.test.js) and a beta
// (issue255-beta.test.js). Each test file runs in its own process.
'use strict';
globalThis.AZ_DEV = { sha: 'test000' };
const test = require('node:test');
const assert = require('node:assert');
const { D } = require('./world');

test('on a dev build every race can be a Bard', () => {
  assert.ok(!D.CLASSES.bard.hidden);
  for (const r in D.RACES) assert.ok(D.RACES[r].classes.includes('bard'), r);
});
