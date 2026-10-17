// Normal raids were tuned up to the difficulty targets (#215): a fitted player wipes in 20-35% of runs (sim/difficulty.js).
// The Magma Throne and the Tidecrown Citadel hit harder; Veshmira breathes fire over the whole raid (her fight tested only
// the tank). Hard stays above Normal on every number; a raid's Trials keep the numbers they were tuned on, with no breath.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D } = require('./world');

const raids = Object.keys(D.DUNGEONS).filter((k) => D.DUNGEONS[k].raid);

test('a raid run starts from Normal, Hard or its Trial numbers', () => {
  for (const k of raids) {
    const Dg = D.DUNGEONS[k];
    assert.strictEqual(G.runBase(Dg, false, 0), Dg, k);
    if (Dg.hard) assert.strictEqual(G.runBase(Dg, true, 0), Dg.hard, k);
    assert.strictEqual(G.runBase(Dg, false, 5), Dg.trial || Dg, k);
  }
  const Dg5 = D.DUNGEONS.ragefire; // a dungeon with no Trial numbers of its own: its Trials start from Normal, as before
  assert.strictEqual(G.runBase(Dg5, false, 5), Dg5);
});

test('Hard hits harder than Normal; Trials keep their numbers', () => {
  const trialWas = { molten_core: [2.2, 7.2], tidecrown_citadel: [2.6, 7.4] };
  for (const k of raids) {
    const Dg = D.DUNGEONS[k];
    if (Dg.hard) for (const m of ['trashMult', 'bossMult']) assert.ok(Dg.hard[m].dmg > Dg[m].dmg, `${k} ${m}: Hard above Normal`);
    if (trialWas[k]) {
      assert.deepStrictEqual([Dg.trial.trashMult.dmg, Dg.trial.bossMult.dmg], trialWas[k], `${k}: Trial numbers unchanged`);
      assert.ok(Dg.bossMult.dmg > Dg.trial.bossMult.dmg, `${k}: Normal raised`);
    }
  }
});

test("Veshmira breathes on the whole raid on Normal and hotter on Hard; never in a Trial", () => {
  const Dg = D.DUNGEONS.onyxias_lair, n = G.normalExtra('onyxias_lair', 'onyxia'), h = G.hardExtra('onyxias_lair', 'onyxia');
  const breath = (xs) => xs.find((x) => x.kind === 'hit' && x.who === 'all' && x.school === 'fire');
  assert.ok(breath(n) && n[0].hard === false, 'Normal: the breath, shown without the Hard tag');
  assert.ok(breath(h).mult * Dg.hard.bossMult.dmg > breath(n).mult * Dg.bossMult.dmg, 'Hard: a hotter breath');
  assert.ok(h.some((x) => (x.kind || 'adds') === 'adds'), 'Hard keeps the brood');
  assert.strictEqual(G.normalExtra('molten_core', 'ragnaros'), null, 'other Normal bosses have no extra');
});

test('level-60 dungeons hit harder; their Trials keep their numbers', () => {
  const was = { scholomance: 4.1, stratholme: 4.3, shalzua_temple: 4.3, sunken_archive: 4.3 };
  for (const k in was) {
    const Dg = D.DUNGEONS[k];
    assert.deepStrictEqual([Dg.trial.trashMult.dmg, Dg.trial.bossMult.dmg], [2.2, was[k]], `${k}: Trial numbers unchanged`);
    assert.ok(Dg.trashMult.dmg > 2.2 && Dg.bossMult.dmg > was[k], `${k}: Normal raised`);
    assert.strictEqual(G.runBase(Dg, false, 5), Dg.trial, `${k}: a Trial starts from them`);
  }
});

test('dungeons that were too hard for a fitted player hit softer; their Trials keep their numbers', () => {
  for (const k of ['deadmines', 'wailing_caverns', 'stockade', 'gnomeregan', 'maraudon', 'sm_cathedral']) {
    const Dg = D.DUNGEONS[k];
    assert.deepStrictEqual([Dg.trial.trashMult.dmg, Dg.trial.bossMult.dmg], [2.2, 4.8], `${k}: Trial numbers unchanged`);
    assert.ok(Dg.trashMult.dmg < 2.2 && Dg.bossMult.dmg < 4.8, `${k}: Normal lowered`);
  }
});
