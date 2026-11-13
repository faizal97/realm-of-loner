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
