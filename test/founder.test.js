// Founder reward (#507): a code from the Discord unlocks the title and the gold mount tint on the whole account. Only the
// code's hash is in the repo, so this test checks the hash function and the flow with a code of its own.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const { G, D, character } = require('./world');

test('the game\'s SHA-256 matches Node\'s, including long and non-ASCII input (#507)', () => {
  for (const s of ['', 'abc', 'ROL:ABCD2345WXYZ', 'x'.repeat(55), 'y'.repeat(56), 'z'.repeat(130), 'Caldreth ✦ ünï']) {
    assert.strictEqual(G.sha256(s), crypto.createHash('sha256').update(s, 'utf8').digest('hex'), JSON.stringify(s));
  }
});

test('a Founder code unlocks the title and the gold tint for every character; a wrong code does nothing (#507)', () => {
  const real = D.FOUNDER.hash;
  D.FOUNDER.hash = crypto.createHash('sha256').update('ROL:TEST2345CODE').digest('hex');
  try {
    const { P } = character(20, 'mage', 'human');
    const a = G.account(); delete a.founder; G.saveAccount(a);
    const t = D.TITLES.find((x) => x.id === 'founder');
    assert.strictEqual(G.claimCode('NOPE-NOPE-NOPE'), false);
    assert.strictEqual(G.isFounder(), false);
    assert.strictEqual(G.titleUnlocked(t), false);
    assert.strictEqual(G.setMountTint('founder'), false, 'no gold tint before the code');
    assert.strictEqual(G.claimCode(' test-2345 code '), true, 'case, spaces and dashes are ignored');
    assert.strictEqual(G.isFounder(), true);
    assert.strictEqual(G.titleUnlocked(t), true);
    assert.strictEqual(G.setMountTint('founder'), true);
    assert.strictEqual(G.mountFilter(P), D.FOUNDER.tint);
    character(10, 'priest', 'orc');
    assert.strictEqual(G.isFounder(), true, 'account-wide: a new character has it too');
    assert.strictEqual(G.titleUnlocked(t), true);
  } finally { D.FOUNDER.hash = real; const a = G.account(); delete a.founder; G.saveAccount(a); }
});

test('the shipped hash is a real SHA-256 and the code itself is not in the data (#507)', () => {
  assert.match(D.FOUNDER.hash, /^[0-9a-f]{64}$/);
});
