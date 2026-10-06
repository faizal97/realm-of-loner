// Quest items never need a bag slot (#144): Thunderhowl Rise's Thornback Hides fell to full bags ("Inventory is full.") and
// were gone, so the quest could never be finished. An item a quest collects is now kept with the quests, not in the bags:
// picked up with full bags, counted toward the objective, taken on turn-in, dropped if the quest is abandoned. Quest
// items an old save holds in its bags still count. A turn-in whose reward is an item follows #128: with full bags it
// pays nothing and the quest stays complete.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character, advance } = require('./world');

let toasts = []; G.on('toast', (t) => toasts.push(t));
const fill = (P) => { while (P.bags.length < G.bagCap()) P.bags.push({ item: G.genGear('chest', P.level, 0), n: 1 }); };
// fight the creatures here until the quest is done (or a cap), the player kept alive
function hunt(qid, cap) {
  const Q = D.QUESTS[qid];
  for (let i = 0; i < (cap || 300) && !G.questComplete(qid); i++) {
    const m = G.placeMobs().find((x) => x.state === 'alive' && Q.objs.some((o) => o.mob === x.key || (D.MOBS[x.key].qdrops || []).some((d) => d[0] === o.item)));
    if (!m) { advance(30); continue; }
    G.engage(m.id); if (!G.fight) { advance(1); continue; }
    for (const e of G.fight.enemies) e.hp = 1; G.pUnit.hp = G.pUnit.maxHp;
    for (let k = 0; k < 200 && G.fight; k++) advance(0.25);
    G.S.player.hp = 99999;
  }
}

test("full bags: Thornback Hides still drop, count toward the quest and take no bag slot", () => {
  const { P } = character(38, 'warrior', 'orc'); P.place = 'rumhook_bay'; G.accept('rh_hides'); P.place = 'thunderhowl_rise';
  fill(P); const bags = JSON.stringify(P.bags); toasts = [];
  hunt('rh_hides');
  assert.ok(G.questComplete('rh_hides'), `8 hides collected with full bags (${G.questProgress('rh_hides')[0].have}/8)`);
  assert.strictEqual(JSON.stringify(P.bags), bags, 'the bags are untouched');
  assert.ok((P.qitems || {}).thornback_hide >= 8, 'the hides are held with the quest (other loot may still meet full bags)');
  P.place = 'rumhook_bay';
  if (G.rewardItem('rh_hides')) { G.turnIn('rh_hides'); assert.ok(!P.done.rh_hides && G.questState('rh_hides') === 'complete', 'its reward needs a slot: it waits'); P.bags.pop(); } // make room
  G.turnIn('rh_hides');
  assert.ok(P.done.rh_hides, 'handed in'); assert.ok(!(P.qitems || {}).thornback_hide, 'the hides went with the turn-in');
});

test('an old save with quest items in its bags: they still count, and the turn-in takes them from the bags', () => {
  const { P } = character(38, 'warrior', 'human'); P.place = 'rumhook_bay'; G.accept('rh_hides');
  P.bags.push({ item: G.copyItem('thornback_hide'), n: 8 }); delete P.qitems;
  assert.strictEqual(G.questProgress('rh_hides')[0].have, 8);
  G.turnIn('rh_hides');
  assert.ok(P.done.rh_hides); assert.ok(!P.bags.some((b) => b.item.id === 'thornback_hide'), 'taken from the bags');
});

test('a turn-in whose reward is an item, with full bags: nothing paid, the quest stays complete, and it says to make room', () => {
  const { P } = character(20, 'warrior', 'human');
  const qid = Object.keys(D.QUESTS).find((q) => { const Q = D.QUESTS[q]; return Q.lvl <= 20 && !Q.faction && !Q.pre && Q.objs.every((o) => o.type === 'kill') && G.rewardItem(q); });
  P.quests[qid] = { prog: D.QUESTS[qid].objs.map((o) => o.n) }; fill(P);
  const money = P.money, xp = P.xp, lvl = P.level; toasts = [];
  G.turnIn(qid);
  assert.deepStrictEqual([P.money, P.xp, P.level], [money, xp, lvl], 'nothing paid');
  assert.ok(P.quests[qid] && !P.done[qid] && G.questState(qid) === 'complete', 'still complete, still held');
  assert.deepStrictEqual(toasts, ['Make room in your bags first: this quest gives an item.']);
});

test('abandoning a quest drops the items it was collecting, unless another quest still needs them', () => {
  const { P } = character(38, 'warrior', 'human'); P.place = 'rumhook_bay'; G.accept('rh_hides');
  G.addItem(G.copyItem('thornback_hide'), 3);
  assert.strictEqual(G.questProgress('rh_hides')[0].have, 3); assert.ok(!P.bags.some((b) => b.item.id === 'thornback_hide'), 'kept with the quest');
  G.abandon('rh_hides');
  assert.ok(!(P.qitems || {}).thornback_hide, 'dropped with the quest');
});
