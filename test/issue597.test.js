// Group-run play-test fixes (#597).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const src = fs.readFileSync(require('path').join(__dirname, '../src/ui.js'), 'utf8');
const fnSrc = (name) => { const at = src.indexOf('  function ' + name + '('); assert.ok(at >= 0, name); return src.slice(at, src.indexOf('\n  }\n', at) + 4); };

test('a fight opens on Party only for a player in the healer role, not for a class that can heal', () => {
  for (const [role, want] of [['healer', 'party'], ['tank', 'next'], ['dps', 'next']]) {
    const G = { role: () => role, healsAllies: () => true }; // a Paladin, Druid or Shaman: heals allies whatever the role
    const runTabNow = new Function('G', 'ui', fnSrc('runTabNow') + '; return runTabNow;')(G, {});
    const R = { phase: 'fight' }, C = {};
    assert.strictEqual(runTabNow(R, C, G.healsAllies()), want, role);
    assert.strictEqual(runTabNow(R, null, G.healsAllies()), 'next', role + ' between pulls');
  }
});

test('a player card open after a wipe: the run back goes on; while resting, only the pull waits', () => {
  const { G, character, advance, now } = require('./world');
  const { S } = character(35, 'mage', 'human');
  G.startRoulette(); const R = S.run;
  R.phase = 'wipe'; R.restUntil = now() + 1000; G.looking = true;
  advance(3);
  assert.strictEqual(R.phase, 'rest', 'ran back with the card open');
  const until = R.restUntil; advance(3);
  assert.strictEqual(R.phase, 'rest', 'the pull still waits for the card');
  assert.ok(R.restUntil > until);
  G.looking = false;
});

test('a finished run names its kind: raid, dungeon, Wanted target, world boss', () => {
  const { D } = require('./world');
  const ak = src.slice(src.indexOf('  const actKind = '), src.indexOf('\n', src.indexOf('  const actKind = ')));
  const doneText = new Function('D', ak + '\n' + fnSrc('doneText') + '; return doneText;')(D);
  assert.strictEqual(doneText(D.ACTIVITIES.molten_core), 'Raid complete.');
  assert.strictEqual(doneText(D.ACTIVITIES.deadmines), 'Dungeon complete.');
  assert.strictEqual(doneText(D.ACTIVITIES.hogger), 'Wanted target defeated.');
  assert.strictEqual(doneText(D.ACTIVITIES.wb_ashwing), 'World boss defeated.');
});

test('the Potion button counts what a tap drinks, not health and mana potions summed', () => {
  const line = src.slice(src.indexOf('  const potionCount = '), src.indexOf('  const potionName = '));
  const hp = { id: 'hp', slot: 'potion', heal: [100, 200], lvl: 1 }, mp = { id: 'mp', slot: 'potion', mana: [100, 200], lvl: 1 };
  const bags = [{ item: hp, n: 6 }, { item: mp, n: 4 }];
  let next = bags[0], pick = null;
  const G = { S: { player: { level: 30, bags } }, potionNext: () => next, potionChoice: () => pick };
  const potionCount = new Function('G', line + '; return potionCount;')(G);
  assert.strictEqual(potionCount(), 6, 'Auto, drinking health');
  next = bags[1]; assert.strictEqual(potionCount(), 4, 'Auto, drinking mana');
  pick = bags[1]; assert.strictEqual(potionCount(), 4, 'the picked one');
});

test('the red bar shows the answer that is ready: the shorter cooldown first, else the one ready soonest', () => {
  const D = { ABILITIES: { divine_protection: { cd: 300 }, holy_shield: { cd: 10 } }, INTERRUPTS: {} };
  const E = { answersOf: () => ['divine_protection', 'holy_shield'] }; // the class's order: the 5 min one first
  const u = { cds: {} }, G = { pUnit: u, fight: { t: 100 }, S: { player: { cls: 'paladin' } } };
  const teleIconId = new Function('G', 'E', 'D', fnSrc('teleIconId') + '; return teleIconId;')(G, E, D);
  assert.strictEqual(teleIconId('guard'), 'holy_shield', 'both ready: the 10 sec one');
  u.cds.holy_shield = 104;
  assert.strictEqual(teleIconId('guard'), 'divine_protection', 'Holy Shield cooling down: the ready one');
  u.cds.divine_protection = 250;
  assert.strictEqual(teleIconId('guard'), 'holy_shield', 'neither ready: the one ready soonest');
});
