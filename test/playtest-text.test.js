// Play-test findings on build 69aa5d9: messages, quest and banner text, the game-side rules behind them.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

// the default chat tabs show 'system' (ui.js CHAT_DEFAULT), never 'loot': what the player must see goes to 'system'
test('a new title and a quest-taught ability are said in the system channel, where the default chat shows them', () => {
  const { P, S } = character(60, 'warrior', 'human');
  G.titleCheck(true);
  const qid = D.ABILITIES[D.PREPATCH_ABILITIES.warrior].learn;
  P.quests[qid] = { prog: {} }; for (const o of D.QUESTS[qid].objs) if (o.type === 'collect') G.addItem(G.copyItem(o.item), o.n);
  const c0 = S.chat.length; const qc = G.questComplete; G.questComplete = (q) => (q === qid ? true : qc(q)); G.turnIn(qid); G.questComplete = qc;
  const ab = S.chat.slice(c0).find((m) => /new ability/.test(m.text));
  assert.ok(ab, 'the ability line is said'); assert.strictEqual(ab.ch, 'system');
  const c1 = S.chat.length; P.done.pp_a_crown = true; G.titleCheck(true);
  const tl = S.chat.slice(c1).find((m) => /^New title: /.test(m.text));
  assert.ok(tl, 'the title line is said'); assert.strictEqual(tl.ch, 'system');
});
