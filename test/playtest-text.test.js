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

test('before the campaign opens, the reason fits the level: "Opens at 60" below it, never at 60', () => {
  const { P } = character(59, 'warrior', 'human');
  assert.match(G.prepatchLocked(), /^Opens at 60/);
  P.level = 60;
  assert.ok(G.prepatchLocked() && !/at 60/.test(G.prepatchLocked()), G.prepatchLocked());
  P.done.tc_crown_a = true;
  assert.strictEqual(G.prepatchLocked(), null);
});

test('a quest hint names a named creature once, never as a plural ("Bruk the Mauler", not "Bruk the Maulers")', () => {
  character(26, 'warrior', 'human');
  const item = D.MOBS.ursal_the_mauler.qdrops[0][0];
  const hint = G.objHint({ type: 'collect', item, n: 1 });
  assert.match(hint, /Bruk the Mauler\b/); assert.doesNotMatch(hint, /Maulers/);
  const plain = Object.keys(D.MOBS).find((k) => !D.MOBS[k].named && !D.MOBS[k].boss && (D.MOBS[k].qdrops || []).length);
  assert.ok(G.mobUnique && !G.mobUnique(plain) && G.mobUnique('ursal_the_mauler'));
});

test('a title from one faction\'s dungeon belongs to that faction: the Lorebound is the Accord\'s, the Spirit-Breaker the Krugar\'s', () => {
  const T = (id) => D.TITLES.find((t) => t.id === id);
  assert.strictEqual(G.titleFaction(T('sunken_archive')), 'alliance');
  assert.strictEqual(G.titleFaction(T('shalzua')), 'horde');
  assert.strictEqual(G.titleFaction(T('deadmines')), null);
  assert.strictEqual(G.titleFaction(T('notes_due_h')), 'horde');
  character(60, 'warrior', 'orc');
  assert.ok(!G.titlesForMe().some((t) => t.id === 'sunken_archive'));
  assert.ok(G.titlesForMe().some((t) => t.id === 'shalzua'));
});

test('a Go to an NPC finds the nearest place they stand, in your own faction\'s towns: the debt clerk and the class tutor', () => {
  for (const race of ['human', 'orc']) {
    const { P } = character(60, 'warrior', race); P.place = race === 'orc' ? 'hammerfall' : 'refuge_pointe'; /* a town of your own, not its capital */
    const c = G.nearestNpc('note_clerk');
    assert.ok(c && D.PLACES[c.place].npcs.includes('note_clerk') && !G.enemyTown(c.place), race + ': ' + JSON.stringify(c));
    const t = G.nearestNpc(D.QUESTS[D.ABILITIES[D.PREPATCH_ABILITIES.warrior].learn].giver);
    assert.strictEqual(t && t.place, 'rumhook_bay');
    P.place = c.place; assert.strictEqual(G.nearestNpc('note_clerk').secs, 0);
  }
});
