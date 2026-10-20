// The spam-PR guard's matching rules (#148): the closed bounty-bot PR #147
// must match, a real gameplay PR must not.
//   node --test test/spam-guard.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { spamReason } = require('../tools/spam_pr_guard');

// #147 as closed: a 5-line script at the repo root, the body says Closes #144,
// carries /claim and a wallet address (redacted here — the shape is what
// matters, not the address).
const SPAM_147 = {
  title: 'Add claim script',
  body: 'Closes #144\n/claim #144\nBounty Reward Wallet: 0x1234567890abcdef1234567890abcdef12345678',
  files: ['claim.js'],
};

// A real contribution like the merged gameplay PRs (e.g. #218: Bear Form holds
// through the autosave): touches src/, a plain description, no markers.
const REAL_218 = {
  title: 'Bear Form holds through the autosave (Refs #217)',
  body: 'The form buff was dropped by the autosave tick; keep it across saves.\n\nRefs #217',
  files: ['src/game.js', 'test/issue217.test.js'],
};

test('the bounty-bot PR #147 matches (its marker fires first, the wallet too)', () => {
  const reason = spamReason(SPAM_147.title, SPAM_147.body, SPAM_147.files);
  assert.ok(reason, 'expected a spam reason');
  assert.match(reason, /bounty marker/);
  assert.match(spamReason('Add claim script', 'send to 0x1234567890abcdef1234567890abcdef12345678', SPAM_147.files), /wallet address/);
});

test('the bounty-bot PR #147 also matches on its file list alone', () => {
  const reason = spamReason('Add claim script', 'Closes #144', SPAM_147.files);
  assert.ok(reason, 'expected a spam reason');
  assert.match(reason, /source directory|no change/);
});

test('/claim alone in the body matches', () => {
  assert.match(spamReason('Fix bags', '/claim #10', ['src/ui.js']), /bounty marker/);
});

test('every other bounty marker matches', () => {
  for (const marker of ['/opire', '/bounty', '/reward']) {
    assert.match(spamReason('hi', `${marker} please`, ['src/ui.js']), /bounty marker/, marker);
  }
});

test('a wallet address matches regardless of case', () => {
  const body = 'send to 0XABCDEF1234567890ABCDEF1234567890ABCDEF12';
  assert.match(spamReason('', body, ['src/ui.js']), /wallet address/);
});

test('a 0x-prefixed constant or short hex is not a wallet address', () => {
  const body = 'use 0xDEADBEEF and 0x1234567890abcdef1234567890abcdef1234567 (39 chars)';
  assert.equal(spamReason('', body, ['src/ui.js']), null);
});

test('a real gameplay pull request is left open', () => {
  assert.equal(spamReason(REAL_218.title, REAL_218.body, REAL_218.files), null);
});

test('a docs-only change is a real contribution, not spam', () => {
  assert.equal(spamReason('Fix a typo in the guide', 'Refs #141', ['docs/guide-style.md']), null);
});

test('an empty pull request with no files and no text is not closed on rule 2 alone without files data', () => {
  // files unknown (not an array): rule 2 can't run, and empty text has no marker
  assert.equal(spamReason('', '', undefined), null);
});

test('an empty pull request with a known empty file list matches rule 2', () => {
  assert.match(spamReason('', '', []), /no changed files/);
});
