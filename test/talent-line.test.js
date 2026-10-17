// The level-up line about a new talent point opens Talents when tapped (#273): it carries go: 'talents', which makes
// it a tappable line in the chat strip and the full chat.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { D, character } = require('./world');
const G = globalThis.G;

test('the new talent point line points to Talents', () => {
  const { S, P } = character(D.TALENT_START - 1, 'bard', 'human');
  P.xp = 0;
  G.gainXp(D.XP_TO_LEVEL[P.level]);
  assert.strictEqual(P.level, D.TALENT_START);
  const m = S.chat.filter((x) => /new talent point/.test(x.text)).pop();
  assert.ok(m, 'the line is posted');
  assert.strictEqual(m.go, 'talents');
});
