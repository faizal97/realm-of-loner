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

test('festival items stack in one bag slot (#405)', () => {
  W.setNow(new Date(2026, 11, 20, 19).getTime()); W.character(30);
  for (let i = 0; i < 5; i++) G.addItem(G.copyItem('ln_snowball'), 1);
  assert.deepStrictEqual(G.S.player.bags.filter((b) => b.item.id === 'ln_snowball').map((b) => b.n), [5]);
});

test('an armour kit stays on top of the armour through every upgrade step (#406)', () => {
  W.character(60); const P = G.S.player, kit = 'hardhide_armor_kit', k = D.ITEMS[kit].kit;
  P.money = 1e9;
  const fresh = () => G.genGear('chest', 60, 3, { atype: D.CLASSES[P.cls].armorType });
  const step = (n) => { for (let i = 0; i < n; i++) G.upgradeItem({ slot: 'chest' }); return P.equip.chest.armor; };
  const apply = () => { G.addItem(G.copyItem(kit), 1); G.useItem(P.bags.findIndex((b) => b.item.id === kit)); };
  P.equip.chest = fresh(); const plain = step(2);
  P.equip.chest = fresh(); step(1); apply(); assert.strictEqual(step(1), plain + k, 'kit after a step');
  P.equip.chest = fresh(); apply(); assert.strictEqual(step(2), plain + k, 'kit before any step');
});

test('the auction house sells into a stack the bags already have, even when they are full (#407)', () => {
  W.character(30); const P = G.S.player; P.bags = []; P.money = 1e8;
  const L = G.ahListings().find((l) => G.stackable(l.item) && (l.n || 1) < 10); G.addItem(G.copyItem(L.item.id), 1);
  while (!G.bagsFull()) G.addItem(G.genGear('chest', 30, 1, { atype: 'mail' }), 1);
  G.ahBuy(L.id);
  assert.strictEqual(G.countItem(L.item.id), 1 + (L.n || 1));
});

test('a battleground fight left by closing the app is a lost round, and the battleground goes on (#408)', () => {
  let done = false;
  for (let tries = 0; tries < 20 && !done; tries++) {
    W.character(20); const id = G.S.id;
    G.queueFor('bg_highmoor'); W.advance(90); G.acceptPop();
    const bg = G.S.bg, bn = D.BG[bg.key].banners.map((b) => b[0]);
    const target = bn.slice().sort((a, b) => (bg.plan[b] || 0) - (bg.plan[a] || 0))[0];
    G.bgGo(target, bn.find((x) => x !== target));
    if (!(G.fight && G.fight.kind === 'bg')) continue;
    done = true; W.advance(1); const round = G.S.bg.round;
    G.save(); G.S = null; G.fight = null; G.pUnit = null; W.setNow(W.now() + 30000); G.load(id);
    const b2 = G.S.bg;
    assert.ok(!b2 || b2.phase === 'choose' || b2.phase === 'done', 'phase ' + (b2 && b2.phase));
    assert.ok(!b2 || b2.phase === 'done' || b2.round === round + 1, 'the round was played out');
  }
  assert.ok(done, 'reached a battleground fight');
});

test('a creature you were fighting when the app closed is back on the next load (#409)', () => {
  W.character(5); const id = G.S.id; G.S.player.place = 'northshire_abbey';
  const m = G.placeMobs().find((x) => x.state === 'alive' && !x.id.startsWith('n_')); G.engage(m.id);
  W.advance(2); assert.ok(G.fight);
  G.save(); G.S = null; G.fight = null; G.pUnit = null; W.setNow(W.now() + 20000); G.load(id);
  assert.strictEqual(G.S.world.northshire_abbey.mobs.filter((y) => y.state === 'fight').length, 0);
});

test('a clock set back between sessions keeps every timer at the time it had left (#410)', () => {
  W.character(20); const id = G.S.id, P = G.S.player; P.place = 'sentinel_hill';
  G.queueFor('deadmines'); const waitLeft = G.S.queue.popAt - W.now();
  P.cds = { x: W.now() + 120000 }; P.auras = [{ id: 'test', until: W.now() + 600000 }];
  G.save(); G.logout(); W.setNow(W.now() - 86400000); G.load(id);
  const t = W.now(), Q = G.S.player;
  assert.ok(G.S.queue.popAt - t <= waitLeft, 'queue');
  assert.ok(Q.cds.x - t <= 120000, 'cooldown'); assert.ok(Q.auras[0].until - t <= 600000, 'buff');
});

test('a clock set back mid-run never gives a negative run time or a day-long wait (#422, #410)', () => {
  W.character(20); const S = G.S; S.player.place = D.ACTIVITIES.deadmines.where;
  G.queueFor('deadmines'); S.queue.popAt = W.now() - 1; G.update(0.5); G.acceptPop();
  W.advance(3); const c0 = G.runClock();
  W.setNow(W.now() - 2 * 3600000); W.advance(1);
  assert.ok(G.runClock() >= c0, `run clock ${G.runClock()}`);
  assert.ok(S.run.restUntil - W.now() < 60000, 'rest');
});
