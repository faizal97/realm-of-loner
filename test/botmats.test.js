// A guildmate asking for materials pays what they cost on the auction house (play-test, build 69aa5d9).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const W = require('./world');
const { G, D, B, character } = W;

const SOC = () => globalThis.SOC;

test('a guildmate asking for materials pays about what they cost on the auction house, never more', () => {
  const { S, P } = character(50, 'warrior', 'human');
  P.guild = B.GUILDS.map((_, g) => g).find((g) => B.GUILD_FACTION[g] === G.myFaction());
  const io = B.isOnline; B.isOnline = () => true;
  let n = 0;
  try {
    for (let i = 0; i < 200 && n < 10; i++) {
      const from = S.chatSeq || 0; SOC().makeGuildRequest();
      for (const m of S.chat) if (m.id > from && m.act && m.act.kind === 'g_mats') {
        n++; const it = D.ITEMS[m.act.item], value = G.ahValue(G.copyItem(m.act.item)) * m.act.n;
        assert.ok(m.act.pay >= 0.75 * value && m.act.pay <= value, `${m.act.n} ${it.name}: pays ${m.act.pay}, auction value ${value}`);
        m.act.state = 'done';
      }
    }
  } finally { B.isOnline = io; }
  assert.ok(n >= 3, `${n} requests`);
});
