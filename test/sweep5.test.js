// Saves and the realm (beta.4 sweep): a long time away loads quickly (#379).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const W = require('./world');
const { G } = W;

test('a year away loads in seconds, not minutes (#379)', () => {
  W.character(20); const id = G.S.id; G.logout();
  W.setNow(W.now() + 365 * 86400000);
  const t0 = process.hrtime.bigint(); G.load(id); const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  assert.ok(G.S && G.S.player, 'the character loaded');
  assert.ok(ms < 3000, `load took ${ms} ms`);
});

test('a duel left by closing the app counts as lost: the wager is paid (#380)', () => {
  W.character(30); const P = G.S.player, id = G.S.id; P.money = 50000;
  const foe = G.S.bots.slice().sort((a, b) => b.level - a.level)[0];
  assert.ok(G.startDuel(foe.id, 40000));
  W.advance(0.25); assert.ok(G.fight, 'still fighting'); G.save();
  G.S = null; G.fight = null; G.pUnit = null; G.load(id);
  assert.strictEqual(G.S.player.money, 10000);
  assert.ok(!G.S.duelOn);
  assert.ok(G.S.chat.some((m) => /counts as lost/.test(m.text || '')), JSON.stringify(G.S.chat.slice(-4).map((m) => m.text)));
});

test('a brawl round left by closing the app is a lost round, and the brawl is not stuck (#381)', () => {
  W.character(40); const id = G.S.id;
  G.S.player.place = Object.keys(W.D.PLACES).find((k) => /bloodsand/i.test(W.D.PLACES[k].name));
  for (let i = 0; i < 400 && G.brawlBlock(); i++) W.setNow(W.now() + 3600000);
  assert.ok(G.brawlJoin(), 'joined a brawl');
  G.brawlFight(); W.advance(2); assert.strictEqual(G.S.brawl.phase, 'fight');
  G.save(); G.S = null; G.fight = null; G.pUnit = null; G.load(id);
  const br = G.S.brawl;
  assert.strictEqual(br.phase, 'done');
  assert.strictEqual(br.results.length, 1, 'the round was played out as lost');
  assert.ok(!G.groupBusy());
});

test('Longnight rewards still waiting at the Hearthwarden arrive by mail when it ends (#382)', () => {
  W.setNow(new Date(2026, 11, 20, 19).getTime());
  W.character(30); const id = G.S.id;
  for (let i = 0; i < 500 && !G.bagsFull(); i++) G.addItem(G.genGear('chest', 30, 2, { atype: 'mail' }), 1);
  G.ln(); G.lnGive(100000, 'test', true);
  const owed = G.ln().owed || []; assert.ok(owed.length, 'some rewards wait');
  G.save(); G.logout();
  W.setNow(new Date(2027, 0, 6, 19).getTime()); G.load(id);
  assert.ok(!G.S.player.ln, 'the festival has ended');
  const mail = G.mail().filter(G.mailWaiting);
  for (const r of owed) assert.ok(mail.some((m) => m.kind === 'reward' && m.item.id === r.item && m.n === (r.n || 1)), r.item);
});
