// The beta.4 dev sweep: festival items, run and realm state left by a reload or a clock change (#403 onward).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const W = require('./world');
const { G, D } = W;
const count = (id) => G.S.player.bags.filter((b) => b.item.id === id).reduce((n, b) => n + (b.n || 1), 0);

test('Longnight items stay in the bags across a reload while Longnight is on (#403)', () => {
  W.setNow(new Date(2026, 11, 20, 19).getTime());
  W.character(30); const id = G.S.id;
  G.addItem(G.copyItem('ln_snowball'), 5); G.addItem(G.copyItem('ln_stew'), 2);
  G.save(); G.logout(); G.load(id);
  assert.strictEqual(count('ln_snowball'), 5); assert.strictEqual(count('ln_stew'), 2);
});

test('a Longnight reward taken from the mail after the festival stays in the bags (#382)', () => {
  W.setNow(new Date(2026, 11, 20, 19).getTime());
  W.character(30); const id = G.S.id;
  for (let i = 0; i < 500 && !G.bagsFull(); i++) G.addItem(G.genGear('chest', 30, 2, { atype: 'mail' }), 1);
  G.ln(); G.lnGive(100000, 'test', true);
  G.save(); G.logout();
  W.setNow(new Date(2027, 0, 6, 19).getTime()); G.load(id);
  G.S.player.bags = G.S.player.bags.filter((b) => b.item.slot !== 'chest');
  const m = G.mail().find(G.mailWaiting); assert.ok(m, 'a reward letter');
  assert.ok(G.mailTake(m.id) !== false); const n = count(m.item.id); assert.ok(n > 0, 'taken');
  G.save(); G.logout(); G.load(id);
  assert.strictEqual(count(m.item.id), n);
});

test('festival dailies never reset when the clock moves to another day and back (#404)', () => {
  const t0 = new Date(2026, 9, 30, 12).getTime(); W.setNow(t0); W.character(30);
  const cap = D.EVENTS.lanternwake.cap;
  G.lwEarn(cap * 2, 'test', true); assert.strictEqual(G.lw().today, cap);
  W.setNow(t0 - 86400000); G.lw(); W.setNow(t0);
  assert.strictEqual(G.lwEarn(cap, 'test', true), 0, 'no candles past the cap');
  const t1 = new Date(2026, 11, 20, 12).getTime(); W.setNow(t1); G.ln().done = true;
  W.setNow(t1 - 86400000); G.ln(); W.setNow(t1);
  assert.ok(G.ln().done, 'the Longnight daily stays done');
});
