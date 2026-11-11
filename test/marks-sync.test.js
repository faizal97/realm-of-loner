// Mentor Marks and cloud sync: the account file merged Marks by the higher balance, so Marks spent on this device came
// back at the next sync (a player report: spend, relaunch, move on the map, the Marks are full again). Marks now keep
// what each device earned and spent; a merge takes each device's counters, so a spend survives every sync and nothing
// earned on another device is lost.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G } = require('./world');
require('../src/cloud.js');
const CLOUD = globalThis.CLOUD;
const setMarks = (n) => { const a = G.account(); a.marks = n; G.saveAccount(a); };
const clone = (x) => JSON.parse(JSON.stringify(x));

test('a spend survives a merge with the older, higher balance in the cloud', () => {
  setMarks(100);
  const cloud = clone(G.account()); // synced at 100
  const a = G.account(); a.marks -= 40; G.saveAccount(a); // spent 40 here
  const m = CLOUD.mergeAccount(clone(G.account()), cloud);
  assert.strictEqual(m.marks, 60);
});

test('Marks earned on two devices both count, and a spend on one is kept', () => {
  setMarks(100);
  const base = clone(G.account());
  const here = G.account(); here.marks -= 30; G.saveAccount(here); // this device: spent 30
  const other = clone(base); other.mk.earn.other = 25; other.marks = 125; // another device earned 25
  const m = CLOUD.mergeAccount(clone(G.account()), other);
  assert.strictEqual(m.marks, 95);
  assert.strictEqual(CLOUD.mergeAccount(m, other).marks, 95, 'merging again changes nothing');
});

test('an account from before counters keeps its balance as the base; an old cloud file merges by the higher, as before', () => {
  localStorage.setItem('azsolo.account', JSON.stringify({ marks: 50, heirlooms: [] })); // as an older version saved it
  assert.strictEqual(G.account().marks, 50);
  assert.strictEqual(CLOUD.mergeAccount(clone(G.account()), { marks: 80, heirlooms: [] }).marks, 80);
  // updated with 100 in the cloud's old file, then spent 40 here: the old file's balance is the same base, the spend stays
  localStorage.setItem('azsolo.account', JSON.stringify({ marks: 100, heirlooms: [] }));
  const a = G.account(); a.marks -= 40; G.saveAccount(a);
  assert.strictEqual(CLOUD.mergeAccount(clone(G.account()), { marks: 100, heirlooms: [] }).marks, 60);
});

test('a merged account written back keeps its balance and counts no new earning', () => {
  setMarks(100);
  const cloud = clone(G.account());
  const a = G.account(); a.marks -= 40; G.saveAccount(a);
  const m = CLOUD.mergeAccount(clone(G.account()), cloud);
  G.writeAccountMarks(m.mk);
  assert.strictEqual(G.account().marks, 60);
  assert.strictEqual(CLOUD.mergeAccount(clone(G.account()), cloud).marks, 60);
});

test('what the account buys or earns syncs too: mounts, Renown, Trialsworn, festival records, titles', () => {
  const here = { marks: 10, heirlooms: [], mounts: ['a'], renown: 2, trialsworn: { bought: [3], monthPaid: ['2026-10'] }, ln: { owned: ['x'], hound: false, houndKills: 4, town: { t1: 2 } }, founder: 1 };
  const there = { marks: 10, heirlooms: [], mounts: ['b'], renown: 3, trialsworn: { bought: [5], earned: [4] }, ln: { owned: ['y'], hound: true, houndKills: 2, town: { t1: 1, t2: 3 } }, debtBreaker: 1 };
  const m = CLOUD.mergeAccount(here, there);
  assert.deepStrictEqual(m.mounts.sort(), ['a', 'b']);
  assert.strictEqual(m.renown, 3);
  assert.deepStrictEqual(m.trialsworn, { bought: [3, 5], monthPaid: ['2026-10'], earned: [4] });
  assert.deepStrictEqual(m.ln, { owned: ['x', 'y'], hound: true, houndKills: 4, town: { t1: 2, t2: 3 } });
  assert.strictEqual(m.founder, 1); assert.strictEqual(m.debtBreaker, 1);
  assert.deepStrictEqual(CLOUD.mergeAccount(m, there), m, 'merging again changes nothing');
});

test('a character changed only in honor or talents counts as played since the last sync', () => {
  const S = { player: { level: 60, xp: 0, money: 5, kills: 0, deaths: 0, place: 'x', quests: {}, done: {}, equip: {}, bags: [], pvp: { honor: 100 }, talents: {} } };
  const before = CLOUD.mark(S); S.player.pvp.honor = 40;
  assert.notStrictEqual(CLOUD.mark(S), before, 'honor spent');
  const t = CLOUD.mark(S); S.player.talents = { a: 1 };
  assert.notStrictEqual(CLOUD.mark(S), t, 'a talent');
});
