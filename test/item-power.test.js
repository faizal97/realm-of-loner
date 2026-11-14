// Item Power (IP): a level-57+ piece's power on a fixed scale where the Tidecrown Citadel's epics are 100
// (G.upgradeInfo(it).pct). The number must never move when nothing about the gear changed.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D } = require('./world');

test('Item Power 100 is the Tidecrown Citadel: a newer ceiling raid needs its own anchor for the scale', () => {
  // When a newer raid becomes D.UPGRADE.raid, upgradeRef moves with it and every piece's Item Power would drop overnight.
  // Before changing this, keep Item Power measured against the Tidecrown (and let the new ceiling read above 100).
  assert.strictEqual(D.UPGRADE.raid, 'tidecrown_citadel');
});

test('a Tidecrown epic without upgrades reads Item Power 100', () => {
  const ids = Object.keys(D.ITEMS).filter((id) => { const x = D.ITEMS[id]; return x.q === 4 && !x.effect && (x.lvl || 0) >= D.UPGRADE.minLvl && D.GEAR_SLOTS.includes(x.slot) && G.itemPoints(x) > 0 && Math.abs(G.itemPoints(x) - G.upgradeRef(x)) <= 0.5; });
  assert.ok(ids.length > 0, 'no epic at the ceiling found');
  for (const id of ids) assert.strictEqual(G.upgradeInfo(G.copyItem(id)).pct, 100, id);
});

test('every worn piece has an Item Power: greens count, a piece with no stats is 0', () => {
  const green = G.genGear('chest', 60, 2, { atype: 'mail' }), bare = Object.assign(G.genGear('legs', 60, 1, { atype: 'mail' }), { stats: {} });
  delete bare.sp;
  assert.ok(G.itemPower(green) > 0, 'a level-60 green has an Item Power');
  assert.strictEqual(G.itemPower(bare), 0);
  assert.strictEqual(G.avgItemPower({ chest: green, legs: bare }), Math.round(G.itemPower(green) / 2));
  assert.strictEqual(G.avgItemPower({}), null);
});

test('Recommended Item Power: raids ask more on Hard; levelling content has none', () => {
  const n = G.recItemPower('tidecrown_citadel', false), hd = G.recItemPower('tidecrown_citadel', true);
  assert.ok(n >= 85 && n <= 110 && n % 5 === 0, `Normal ${n}`);
  assert.ok(hd > n, `Hard ${hd} above Normal ${n}`);
  const low = Object.keys(D.ACTIVITIES).find((k) => (D.ACTIVITIES[k].maxLvl || 0) > 0 && D.ACTIVITIES[k].maxLvl < 50);
  assert.strictEqual(G.recItemPower(low, false), null, low);
});

test('a look-only piece (a Trialsworn appearance) has no Item Power and is left out of the average', () => {
  const cloak = G.copyItem('trialsworn_cloak'), green = G.genGear('chest', 60, 2, { atype: 'mail' });
  assert.ok(cloak.lookOnly, 'the Trialsworn Cloak is look-only');
  assert.strictEqual(G.itemPower(cloak), null);
  assert.strictEqual(G.avgItemPower({ chest: green, back: cloak }), G.itemPower(green));
});

test('a ring family with no raid ring of its own reads by quality, not a flat 90 (its Season Best ring is the 100)', () => {
  const ip = (k) => G.itemPower(G.copyItem(k));
  assert.strictEqual(ip('stonecore_band'), 100);
  assert.ok(ip('rimefather_band') > ip('scorchmaw_band'), `epic ${ip('rimefather_band')} over blue ${ip('scorchmaw_band')}`);
  assert.ok(ip('foulmane_ring') < 85, `a level-57 blue ring reads under 85: ${ip('foulmane_ring')}`);
  assert.ok(G.itemPower(G.genGear('finger', 60, 3, {})) > G.itemPower(G.genGear('finger', 60, 2, {})), 'a generated blue ring over a green');
});
