// The inbox (#258, docs/plans/2026-10-16-inbox-design.md): a sold auction sends a receipt (its gold already arrived);
// an expired one sends a letter holding the item, taken at a mailbox in any town; the newest 50 letters are kept and a
// letter still holding an item is never thrown away.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character, now } = require('./world');

const post = (S, o) => { S.ah = S.ah || { listings: [], mine: [], next: 0 }; const it = G.genGear('chest', 20, 2); S.ah.mine.push(Object.assign({ item: it, n: 1, price: 10000, deposit: 200, postedAt: now() - 1000, sellAt: null, expires: now() + 1e9 }, o)); return it; };
const wild = () => Object.keys(D.PLACES).find((k) => !G.mailboxAt(k) && (D.PLACES[k].mobs || []).length);

test('a sale pays at once and leaves a receipt', () => {
  const { S, P } = character(20);
  const it = post(S, { sellAt: now() - 1 }), m0 = P.money;
  G.ahTick();
  assert.strictEqual(P.money - m0, 9500 + 200);
  const [m] = G.mail();
  assert.strictEqual(m.kind, 'sold'); assert.strictEqual(m.item, it); assert.strictEqual(m.got, 9500); assert.strictEqual(m.dep, 200);
  assert.strictEqual(G.mailUnread(), 1); assert.ok(!G.mailWaiting(m));
  G.mailReadAll(); assert.strictEqual(G.mailUnread(), 0);
  G.mailDelete(m.id); assert.strictEqual(G.mail().length, 0);
});

test('an expired auction waits in the mail, not the bags; taken only at a mailbox', () => {
  const { S, P } = character(20);
  const it = post(S, { expires: now() - 1 }), bags = P.bags.length;
  G.ahTick();
  assert.strictEqual(P.bags.length, bags, 'not put in the bags');
  const [m] = G.mail(); assert.strictEqual(m.kind, 'expired'); assert.ok(G.mailWaiting(m));
  assert.match(G.mailDelete(m.id), /Take the item first/);
  P.place = wild();
  assert.match(G.mailTakeWhy(m), /mailbox/);
  G.mailTake(m.id); assert.ok(G.mailWaiting(m));
  P.place = Object.keys(D.PLACES).find((k) => D.PLACES[k].inn && D.PLACES[k].safe);
  assert.strictEqual(G.mailTakeWhy(m), null);
  G.mailTake(m.id);
  assert.ok(!G.mailWaiting(m)); assert.ok(P.bags.some((b) => b.item === it));
});

test('full bags: the item stays in the letter', () => {
  const { S, P } = character(20);
  post(S, { expires: now() - 1 }); G.ahTick();
  P.place = Object.keys(D.PLACES).find((k) => D.PLACES[k].inn && D.PLACES[k].safe);
  while (!G.bagsFull()) P.bags.push({ item: G.genGear('legs', 20, 2), n: 1 });
  const [m] = G.mail();
  assert.match(G.mailTakeWhy(m), /bags are full/); G.mailTake(m.id); assert.ok(G.mailWaiting(m));
});

test('the newest 50 are kept: read receipts go first, a letter holding an item never', () => {
  character(20);
  const it = G.genGear('chest', 20, 2);
  G.mailSend({ kind: 'expired', item: it, n: 1, at: 1 });
  for (let i = 0; i < 60; i++) G.mailSend({ kind: 'sold', item: it, n: 1, buyer: 'x', got: 1, at: 10 + i });
  const L = G.mail();
  assert.strictEqual(L.length, 50);
  assert.ok(L.some((m) => m.kind === 'expired'), 'the waiting item is kept');
  G.mailReadAll(); const keep = L.slice(-5).map((m) => m.id);
  for (const m of L.slice(-5)) m.read = false; // the newest five unread
  G.mailSend({ kind: 'sold', item: it, n: 1, buyer: 'x', got: 1, at: 100 });
  assert.strictEqual(G.mail().length, 50);
  for (const id of keep) assert.ok(G.mail().some((m) => m.id === id), 'an unread letter outlives older read ones');
});

test('every town has a mailbox: each zone with an inn, and the capitals', () => {
  for (const [k, p] of Object.entries(D.PLACES)) if (p.inn && p.safe) assert.ok(G.mailboxAt(k), k);
  assert.ok(Object.keys(D.PLACES).some((k) => D.PLACES[k].city && G.mailboxAt(k)));
});
