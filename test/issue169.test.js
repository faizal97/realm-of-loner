// Disabled buttons say why (#169): a bot's sale, swap or duel that you can't take reads as the reason ("Need 2g 40s",
// "Bags full"), marked why so it is drawn as unavailable-with-a-reason rather than faded out.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character, now } = require('./world');
const SOC = globalThis.SOC;

const req = (act) => ({ ch: 'whisper', act: Object.assign({ state: 'open', posted: now(), until: now() + 5 * 60000 }, act) });

test('a sale you are short for: the label is the shortfall', () => {
  const { P } = character(20, 'warrior', 'human');
  const it = G.genGear('chest', 20, 2, { atype: 'mail' });
  P.money = 100;
  let [buy] = SOC.actions(req({ kind: 'wts', itemData: it, price: 2500 }));
  assert.strictEqual(buy.label, `Need ${G.moneyText(2400)}`);
  assert.ok(buy.disabled && buy.why); assert.strictEqual(buy.need, 2400);
  P.money = 3000; [buy] = SOC.actions(req({ kind: 'wts', itemData: it, price: 2500 }));
  assert.strictEqual(buy.label, `Buy for ${G.moneyText(2500)}`); assert.ok(!buy.disabled && !buy.why);
});

test('a duel wager you cannot cover says how much more you need', () => {
  const { P } = character(20, 'warrior', 'human');
  P.money = 50;
  const [acc] = SOC.actions(req({ kind: 'duel', wager: 500 }));
  assert.strictEqual(acc.label, `Need ${G.moneyText(450)}`); assert.ok(acc.disabled && acc.why);
});

test('a swap with full bags says "Bags full"', () => {
  const { P } = character(20, 'warrior', 'human');
  const it = G.genGear('chest', 20, 2, { atype: 'mail' });
  G.addItem(G.copyItem('linen_cloth'), 5);
  const m = req({ kind: 'swap', item: 'linen_cloth', n: 5, itemData: it });
  assert.ok(!SOC.actions(m)[0].disabled, 'room: it can be done');
  const real = G.bagsFull; G.bagsFull = () => true;
  try {
    const [sw] = SOC.actions(m);
    assert.strictEqual(sw.label, 'Bags full'); assert.ok(sw.disabled && sw.why);
  } finally { G.bagsFull = real; }
});
