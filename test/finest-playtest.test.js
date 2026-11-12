// Season's Finest and loot, play-test findings on 69aa5d9: a piece seen on a roll card, pieces that come back to you,
// role-fitted dungeon rewards, Stamina and role Need, and Best pieces at their power ceiling.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character, setNow, now } = require('./world');

const IN_SEASON = new Date(2026, 10, 15, 12).getTime();
const S1 = () => D.FINEST_SEASONS.find((s) => s.id === 1);
const UNTIL = (k) => S1().until[G.myFaction()][k], BEST = (k) => S1().best[G.myFaction()][k];
const row = (cls, role, slot, tier) => G.finest(cls, role).rows.find((r) => r.slot === slot && r.tier === tier);

test('a season piece on a roll card is Seen, whoever wins it', () => {
  setNow(IN_SEASON); const { S } = character(60, 'mage', 'human');
  G.startRoulette(); assert.ok(S.run, 'in a run');
  const id = UNTIL('mage:dps').chest;
  assert.strictEqual(row('mage', 'dps', 'chest', 'until').state, 'unknown');
  G._addRoll(G.copyItem(id));
  assert.strictEqual(row('mage', 'dps', 'chest', 'until').state, 'seen');
  G.leaveGroup();
});

test('a piece that comes back (mail, buyback, own bank, a cancelled auction) is Found, never Found blind', () => {
  const take = (slot, put, get) => {
    setNow(IN_SEASON); const { P } = character(60, 'mage', 'human');
    const id = BEST('mage:dps')[slot]; delete P.finest;
    put(P, G.copyItem(id)); get(P);
    const r = row('mage', 'dps', slot, 'best');
    assert.strictEqual(r.state, 'found', slot); assert.strictEqual(r.blind, false, `${slot}: came back, not blind`);
  };
  const atMailbox = (P) => { P.place = Object.keys(D.PLACES).find((k) => G.mailboxAt(k)); };
  /* an auction listed before the season, back in the mail when it expired */
  take('weapon', (P, it) => G.mailSend({ kind: 'expired', item: it, n: 1, dep: 0 }), (P) => { atMailbox(P); G.mailTake(G.mail().find((m) => G.mailWaiting(m)).id); });
  /* sold before the season, bought back */
  take('chest', (P, it) => { P.buyback = [{ item: it, n: 1, price: 1 }]; P.money = 100; }, () => G.buyBack(0));
  /* the character's own bank */
  take('legs', (P, it) => { P.bank = [{ item: it, n: 1 }]; }, () => G.bankWithdraw(0));
  /* an auction cancelled */
  take('feet', (P, it) => { G.S.ah = G.S.ah || {}; G.S.ah.mine = [{ item: it, n: 1, deposit: 0 }]; }, () => G.ahCancel(0));
});

test('a gift sent this season and taken from the mail can still be Found blind', () => {
  setNow(IN_SEASON); const { P } = character(60, 'mage', 'human');
  const id = BEST('mage:dps').hands; delete P.finest;
  G.mailSend({ kind: 'reward', gift: true, from: 'Someone', item: G.copyItem(id), n: 1 });
  P.place = Object.keys(D.PLACES).find((k) => G.mailboxAt(k)); G.mailTake(G.mail().find((m) => G.mailWaiting(m)).id);
  const r = row('mage', 'dps', 'hands', 'best');
  assert.strictEqual(r.state, 'found'); assert.strictEqual(r.blind, true);
});

test('dungeon reward gear fits the role you play, not only the class', () => {
  for (const [cls, role] of [['paladin', 'healer'], ['shaman', 'healer'], ['druid', 'tank'], ['paladin', 'tank'], ['warrior', 'tank'], ['mage', 'dps']]) {
    const { P } = character(60, cls, 'human'); P.role = role;
    for (let i = 0; i < 60; i++) { const it = G.fittedGear(60, 3, cls); if (it.stats && Object.keys(it.stats).length) assert.ok(G.suitsRole(it, cls, role), `${cls} ${role}: ${it.name} ${JSON.stringify(it.stats)}`); }
    /* the speed chest's boss blue too */
    for (const dk in D.DUNGEONS) { const Dg = D.DUNGEONS[dk]; if (Dg.raid) continue; const it = G.fittedBossBlue(Dg, 50, cls); assert.ok(G.suitsRole(it, cls, role), `${cls} ${role} ${dk}: ${it.name} ${JSON.stringify(it.stats)}`); }
  }
});

test('Stamina is a tank\'s stat: a Stamina-heavy ring or cloak suits tanks only, so other roles Greed it', () => {
  character(60, 'warrior', 'human');
  const cloak = { slot: 'back', q: 3, lvl: 60, stats: { sta: 14 } }, ring = { slot: 'finger', q: 3, lvl: 60, stats: { sta: 12, int: 4 } };
  for (const [cls, role] of [['mage', 'dps'], ['priest', 'healer'], ['rogue', 'dps'], ['warrior', 'dps'], ['paladin', 'healer'], ['druid', 'healer']]) {
    assert.strictEqual(G.suitsRole(cloak, cls, role), false, `${cls} ${role}: Stamina cloak`);
    assert.strictEqual(G.suitsRole(ring, cls, role), false, `${cls} ${role}: Stamina ring`);
  }
  for (const cls of ['warrior', 'paladin', 'druid']) assert.strictEqual(G.suitsRole(cloak, cls, 'tank'), true, `${cls} tank`);
  /* a two-stat affix with Stamina still suits the role of its other stat */
  assert.strictEqual(G.suitsRole({ slot: 'chest', stats: { sta: 8, int: 8 } }, 'warlock', 'dps'), true);
  assert.strictEqual(G.suitsRole({ slot: 'chest', stats: { agi: 8, sta: 8 } }, 'rogue', 'dps'), true);
});
