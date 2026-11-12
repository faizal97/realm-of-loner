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
