// A bot in your group is not looking for a group (play-test, build 69aa5d9).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const W = require('./world');
const { G, D, B, character } = W;

const SOC = () => globalThis.SOC;

test('a bot in your group does not post in Looking for Group chat', () => {
  const { S } = character(30, 'warrior', 'human');
  const b = S.bots.find((x) => B.factionOf(x) === G.myFaction() && x.level >= 20);
  S.group = { members: [{ name: b.name, bot: { id: b.id } }] };
  try {
    for (const t of ['took us an hour, never again', 'the group finder is so good honestly', 'nvm group full']) assert.strictEqual(B.lineFits(S, t, b, 'lfg'), false, t);
    assert.notStrictEqual(B.lineFits(S, 'the group finder is so good honestly', S.bots.find((x) => x !== b && B.factionOf(x) === G.myFaction() && x.level >= 20), 'lfg'), false, 'someone outside the group still may');
  } finally { S.group = null; }
});
