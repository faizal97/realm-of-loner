// Play-test findings on bot chat (build 69aa5d9): what people near you say fits the place.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const W = require('./world');
const { G, D, B, character } = W;

const FIGHT = /respawn|u can have this one|nice pull|thought that was mine|spawns|almost died|one more and im done|where did all the mobs|close call|the last one|that crit|who pulled|tagged it|oom, sitting|\brun!!|\bow\b|\brip\b/;

test('in a town with nothing to fight, nobody nearby talks about fighting', () => {
  const { S, P } = character(30, 'warrior', 'human'); P.place = 'stormwind';
  assert.ok(!(D.PLACES.stormwind.mobs || []).length);
  let seen = S.chatSeq || 0; const said = [];
  for (let i = 0; i < 900; i++) {
    S.chatTimers = S.chatTimers || {}; S.chatTimers.say = 1; W.setNow(W.now() + 60000); B.chatTick(S, W.now());
    for (const m of S.chat) if (m.id > seen && m.ch === 'say') said.push(m.text);
    seen = S.chatSeq || 0;
  }
  assert.ok(said.length >= 5, `${said.length} lines said`);
  const bad = said.filter((t) => FIGHT.test(t.toLowerCase()));
  assert.deepStrictEqual(bad, []);
});
