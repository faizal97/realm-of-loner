// Helping makes a friend (#338): finishing a run you joined from someone's request, and buying what they sell in chat,
// count as helping them, as selling to a buyer and team-ups already did.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, character } = require('./world');
const SOC = globalThis.SOC;

const someone = () => G.S.bots.find((b) => B().factionOf(b) === G.myFaction() && !SOC.isFriend(b.id));
const B = () => globalThis.B;

test('finishing a run you joined from their LFG makes the leader a friend', () => {
  character(20);
  const b = someone();
  SOC.onRunComplete({ act: Object.keys(globalThis.D.ACTIVITIES)[0], soc: { kind: 'lfg', leader: b.id } });
  assert.ok(SOC.isFriend(b.id));
});

test('buying from a seller in chat makes them a friend', () => {
  const { P } = character(20); P.money = 100000;
  const b = someone(), item = JSON.parse(JSON.stringify(G.copyItem ? G.copyItem('linen_cloth') || {} : {}));
  const m = { id: 1, ch: 'trade', from: b.name, fromId: b.id, text: 'wts', act: { kind: 'wts', bot: b.id, state: 'open', price: 100, until: Date.now() + 60000, itemData: Object.assign({ id: 'linen_cloth', name: 'Linen Cloth' }, item) } };
  const buy = SOC.actions(m)[0]; buy.fn();
  assert.strictEqual(m.act.state, 'done', 'bought');
  assert.ok(SOC.isFriend(b.id));
});

test('Haggle: one try, then greyed with how it went (#342)', () => {
  const { P } = character(20); P.money = 100000;
  const b = someone();
  const m = { id: 2, ch: 'trade', from: b.name, fromId: b.id, text: 'wts', act: { kind: 'wts', bot: b.id, state: 'open', price: 1000, until: Date.now() + 60000, itemData: { id: 'linen_cloth', name: 'Linen Cloth' } } };
  const h1 = SOC.actions(m).find((x) => x.label === 'Haggle'); assert.ok(h1);
  h1.fn();
  const h2 = SOC.actions(m)[1];
  assert.ok(h2.disabled && /Haggled|Price is firm/.test(h2.label), h2.label);
  assert.ok(m.act.price === 1000 || m.act.price === 800, 'at most one drop');
});
