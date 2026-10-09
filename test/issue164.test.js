// World loot with full bags (#164): each item a creature dropped was thrown away with a generic "Inventory is full."
// Now green-or-better items go to the bank ("Bags full: <item> sent to your bank"), and grey and white items that
// don't fit are named in one log line per kill: "Bags full: left behind <item>, <item>".
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

const toasts = []; G.on('toast', (t) => toasts.push(t));
function fullBags() {
  const { P, S } = character(30, 'warrior', 'human');
  while (!G.bagsFull()) P.bags.push({ item: G.genGear('legs', 30, 1), n: 1 });
  P.bank = []; toasts.length = 0;
  return { P, S };
}
const give = (items) => (G.giveLoot ? G.giveLoot({ money: 0, items }) : assert.fail('no way to hand out loot'));

test('full bags: a green and a blue go to the bank, each with a toast', () => {
  const { P } = fullBags();
  const g = G.genGear('chest', 30, 2), b = G.genGear('hands', 30, 3);
  give([g, b]);
  assert.ok(P.bank.some((x) => x.item === g) && P.bank.some((x) => x.item === b), 'both in the bank');
  assert.ok(toasts.includes(`Bags full: ${g.name} sent to your bank`) && toasts.includes(`Bags full: ${b.name} sent to your bank`), toasts.join(' | '));
});

test('full bags: grey and white items are named in one log line', () => {
  const { P, S } = fullBags();
  const grey = G.genGear('feet', 30, 0), white = G.genGear('waist', 30, 1);
  const c0 = S.chat.length;
  give([grey, white]);
  assert.ok(!P.bank.some((x) => x.item === grey || x.item === white), 'not banked');
  const lines = S.chat.slice(c0).filter((m) => /^Bags full: left behind /.test(m.text));
  assert.strictEqual(lines.length, 1, 'one line');
  assert.ok(lines[0].text.includes(grey.name) && lines[0].text.includes(white.name), lines[0].text);
});

test('with room: loot goes to the bags as before, no bank and no line', () => {
  const { P, S } = character(30, 'warrior', 'human'); P.bank = [];
  const g = G.genGear('chest', 30, 2), w = G.genGear('feet', 30, 1);
  const c0 = S.chat.length; give([g, w]);
  assert.ok(P.bags.some((x) => x.item === g) && P.bags.some((x) => x.item === w));
  assert.strictEqual(P.bank.length, 0);
  assert.ok(!S.chat.slice(c0).some((m) => /Bags full/.test(m.text)));
});
