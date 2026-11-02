// Saves and the realm (beta.4 sweep): a long time away loads quickly (#379).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const W = require('./world');
const { G } = W;

test('a year away loads in seconds, not minutes (#379)', () => {
  W.character(20); const id = G.S.id; G.logout();
  W.setNow(W.now() + 365 * 86400000);
  const t0 = process.hrtime.bigint(); G.load(id); const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  assert.ok(G.S && G.S.player, 'the character loaded');
  assert.ok(ms < 3000, `load took ${ms} ms`);
});
