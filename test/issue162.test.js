// Taking a craft order with full bags (#162): the materials used to be lost while the order counted as taken. Now the
// order is refused until every material fits, and stays open; with room, the materials arrive as before.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, B, character, now } = require('./world');
const SOC = globalThis.SOC;

// a craft order whose recipe needs two or more different materials, offered by a bot in chat
function order() {
  const { P, S } = character(30, 'warrior', 'human');
  const r = Object.values(D.RECIPES).find((x) => Object.keys(x.mats).length >= 2 && Object.keys(x.mats).every((k) => !G.isQuestItem(k)));
  const m = { ch: 'whisper', act: { kind: 'craft_order', rid: r.id, tip: 100, sent: false, until: now() + 60000, state: 'open', bot: S.bots[0].id } };
  const take = () => SOC.actions(m).find((x) => x.label === 'Take the order').fn();
  return { P, S, r, m, take };
}
const fillBags = (P) => { while (!G.bagsFull()) P.bags.push({ item: G.genGear('legs', 30, 1), n: 1 }); };

test('full bags: the order is refused, stays open, and nothing is lost', () => {
  const { P, r, m, take } = order(); fillBags(P);
  const n = Object.keys(r.mats).length;
  const said = take();
  assert.strictEqual(said, `Make room for ${n} materials first.`);
  assert.strictEqual(m.act.sent, false, 'not taken');
  assert.strictEqual(m.act.state, 'open', 'still open');
  assert.ok(SOC.actions(m).some((x) => x.label === 'Take the order'), 'can be taken once there is room');
});

test('one slot short: it says how many', () => {
  const { P, take } = order(); fillBags(P); P.bags.pop();
  assert.match(take(), /^Make room for \d+ materials? first\.$/);
});

test('with room: every material arrives and the order is taken', () => {
  const { r, m, take } = order();
  assert.strictEqual(take(), undefined);
  assert.strictEqual(m.act.sent, true);
  for (const k in r.mats) assert.strictEqual(G.countItem(k), r.mats[k], D.ITEMS[k].name);
});

test('a material that joins a stack already in the bags needs no slot', () => {
  const { P, r, m, take } = order(); fillBags(P);
  const ks = Object.keys(r.mats);
  // free exactly one slot per material but one, and give the last one a stack with room
  for (let i = 0; i < ks.length; i++) P.bags.pop();
  P.bags.push({ item: G.copyItem(ks[0]), n: 1 });
  assert.strictEqual(take(), undefined, 'fits');
  assert.strictEqual(m.act.sent, true);
});

test('the bot never says the mats are in a mailbox (there is no mail)', () => {
  const src = require('node:fs').readFileSync(require('node:path').join(__dirname, '../src/social.js'), 'utf8');
  assert.ok(!/mailbox/.test(src));
});
