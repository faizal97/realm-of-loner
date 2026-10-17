// A sim player who whispers you to group (a kill or a quest) is within SOC.GROUP_LEVELS of you: a level 4 asking a
// level 31 to team up died to the first pull. Other whispers (trade, questions, duels) still come from anyone.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { D, character } = require('./world');
const SOC = globalThis.SOC;

test('group whispers come from players near your level', () => {
  const { S, P } = character(31, 'warrior', 'human');
  P.place = Object.keys(D.PLACES).find((k) => { const p = D.PLACES[k]; return p.lvl && p.lvl[0] <= 31 && p.lvl[1] >= 31 && (p.mobs || []).length; });
  S.bots.forEach((b, i) => { b.level = 1 + (i % 60); }); // a new world's players are all low level: spread them 1-60
  const n0 = S.chat.length;
  for (let i = 0; i < 400; i++) SOC.makeWhisper();
  const asks = S.chat.slice(n0).filter((m) => m.act && (m.act.kind === 'help_kill' || m.act.kind === 'quest_team'));
  assert.ok(asks.length >= 10, `enough group whispers to tell (${asks.length})`);
  for (const m of asks) {
    const lvl = S.bots.find((b) => b.id === m.fromId).level;
    assert.ok(Math.abs(lvl - P.level) <= SOC.GROUP_LEVELS, `${m.act.kind} from a level ${lvl}`);
  }
  const others = S.chat.slice(n0).filter((m) => m.ch === 'whisper' && !asks.includes(m)).map((m) => S.bots.find((b) => b.id === m.fromId).level);
  assert.ok(others.some((l) => Math.abs(l - P.level) > SOC.GROUP_LEVELS), 'other whispers still come from any level');
});
