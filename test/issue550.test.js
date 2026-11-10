// #550: chat buy, swap and guild-material requests counted only the bags, so after Store materials a player with the
// materials in the bank saw "You have 0/5". The bank counts now; the bags pay first.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

const ore = Object.keys(D.ITEMS).find((k) => D.ITEMS[k].slot === 'mat' && !G.isQuestItem(k) && !D.ITEMS[k].noSell);
const sum = (l, id) => (l || []).filter((b) => b.item.id === id).reduce((a, b) => a + b.n, 0);
const act = (S, kind, extra) => globalThis.SOC.actions({ ch: 'whisper', act: Object.assign({ state: 'open', kind, bot: S.bots[0].id, item: ore, n: 5 }, extra) });

test('a buy request takes materials from the bank', () => {
  const { S, P } = character(30);
  P.bags = [{ item: G.copyItem(ore), n: 2 }]; P.bank = [{ item: G.copyItem(ore), n: 10 }];
  const a = act(S, 'wtb', { price: 100 }); assert.ok(!a[0].disabled, a[0].label);
  const m = P.money; a[0].fn();
  assert.strictEqual(P.money, m + 100);
  assert.strictEqual(sum(P.bags, ore), 0, 'the bags pay first'); assert.strictEqual(sum(P.bank, ore), 7);
});

test('guild materials and swaps count the bank too', () => {
  const { S, P } = character(30);
  P.bags = []; P.bank = [{ item: G.copyItem(ore), n: 6 }]; P.guild = 0;
  const g = act(S, 'g_mats', { pay: 50, guild: true }); assert.ok(!g[0].disabled, g[0].label);
  P.bank = [{ item: G.copyItem(ore), n: 6 }];
  const s = act(S, 'swap', { itemData: G.genGear('legs', 30, 2) }); assert.ok(!s[0].disabled, s[0].label);
  s[0].fn(); assert.strictEqual(sum(P.bank, ore), 1); assert.strictEqual(P.bags.length, 1, 'the item arrived');
});
