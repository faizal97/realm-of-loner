// Taps that can't act say why (#167): the action bar on the road or dead, gathering in a fight, an item the vendor
// won't buy. Each refusal is one message, and the bar's state is known before the tap (G.barBlock).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character, now } = require('./world');

const toasts = []; G.on('toast', (t) => toasts.push(t));

test('the action bar on the road or dead says why; food and potions still work on the road', () => {
  const { P } = character(20, 'warrior', 'human');
  assert.strictEqual(G.barBlock('heroic_strike'), null, 'standing still: usable');
  P.travel = { to: P.place, from: P.place, start: now(), end: now() + 60000 };
  assert.strictEqual(G.barBlock('heroic_strike'), "You're travelling.");
  assert.strictEqual(G.barBlock('attack'), "You're travelling.");
  assert.strictEqual(G.barBlock('eat'), null, 'eating on the road is allowed');
  delete P.travel; P.ghostUntil = now() + 12000;
  assert.match(G.barBlock('heroic_strike'), /^You're dead\. You revive in 12 sec\.$/);
  assert.match(G.barBlock('eat'), /^You're dead\./, 'nothing works while dead');
  P.ghostUntil = 0;
});

test('gathering in a fight says to finish it first', () => {
  const { P } = character(20, 'warrior', 'human');
  const pl = Object.keys(D.PLACES).find((k) => D.PLACES[k].gather && D.PLACES[k].mobs && D.PLACES[k].mobs.length); P.place = pl;
  const m = G.placeMobs().find((x) => x.state === 'alive'); G.engage(m.id); assert.ok(G.fight, 'in a fight');
  toasts.length = 0; G.gather(); assert.deepStrictEqual(toasts, ['Finish the fight first.']);
  toasts.length = 0; G.gatherNode(0); assert.deepStrictEqual(toasts, ['Finish the fight first.']);
});

test('the vendor names what it will not buy', () => {
  const { P } = character(20, 'warrior', 'human');
  const idx = P.bags.findIndex((b) => b.item.id === 'hearthstone');
  assert.strictEqual(G.sellable(P.bags[idx].item), false);
  toasts.length = 0; G.sell(idx);
  assert.deepStrictEqual(toasts, [`The vendor won't buy ${P.bags[idx].item.name}.`]);
  assert.strictEqual(G.sellable(D.ITEMS.linen_cloth), true);
});
