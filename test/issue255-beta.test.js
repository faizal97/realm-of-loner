// The Bard on a beta build (#255): betas are test builds like /dev/, so every race can pick it there too.
'use strict';
globalThis.AZ_VERSION = '10.14.0-beta.1';
const test = require('node:test');
const assert = require('node:assert');
const { D } = require('./world');

test('on a beta build every race can be a Bard', () => {
  assert.ok(!D.CLASSES.bard.hidden);
  for (const r in D.RACES) assert.ok(D.RACES[r].classes.includes('bard'), r);
});
