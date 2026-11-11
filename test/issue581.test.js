// Gear power (#581): a Mentor Mark upgrade never lifts a weapon's damage or an item's armour past its family's newest
// raid piece, and a Hard raid copy is stronger than the Normal drop.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const W = require('./world');
const { G, D } = W;
W.character(60);
const dps = (x) => (x.dmg[0] + x.dmg[1]) / 2 / x.speed;
const key = (x) => `${x.slot}|${x.wtype || x.atype || ''}|${x.sp ? 'c' : ''}`;
const lootOf = (dk) => { const s = new Set(); for (const p of D.DUNGEONS[dk].pulls) for (const m of p.mobs) for (const id of (D.MOBS[m].loot || [])) if (D.ITEMS[id]) s.add(id); return [...s].map((id) => D.ITEMS[id]); };
const raid = lootOf(D.UPGRADE.raid).filter((x) => !x.effect);
const top = (k, fn) => { const v = raid.filter((x) => key(x) === k).map(fn).filter((n) => n > 0); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };

test('an upgraded item at its ceiling stays at or under its family\'s raid damage and armour', () => {
  let n = 0;
  for (const it of Object.values(D.ITEMS)) {
    if (it.effect || !D.GEAR_SLOTS.includes(it.slot)) continue;
    const inf = G.upgradeInfo(G.copyItem(it.id)); if (!inf.ok || !inf.room) continue;
    const up = G.upgradedCopy(G.copyItem(it.id), D.UPGRADE.cap[it.q] * G.upgradeRef(it)), k = key(it);
    if (it.dmg && it.speed) { const r = top(k, (x) => (x.dmg && x.speed ? dps(x) : 0)); if (r && dps(it) <= r) { assert.ok(dps(up) <= r + 0.6, `${it.name}: ${dps(up).toFixed(1)} > raid ${r.toFixed(1)}`); n++; } }
    if (it.armor) { const r = top(k, (x) => x.armor || 0); if (r && it.armor <= r) { assert.ok(up.armor <= r + 1, `${it.name} armour ${up.armor} > raid ${r}`); n++; } }
  }
  assert.ok(n > 20, 'checked ' + n);
});

test('a Hard raid copy is stronger than the Normal drop', () => {
  for (const it of raid.filter((x) => D.GEAR_SLOTS.includes(x.slot) && G.upgradeInfo(G.copyItem(x.id)).ok)) {
    const n = G.copyItem(it.id), h = G.hardCopy(it.id);
    assert.ok(G.itemPoints(h) > G.itemPoints(n), it.name + ' stats');
    if (n.dmg) assert.ok(dps(h) > dps(n), it.name + ' damage');
    if (n.armor) assert.ok(h.armor > n.armor, it.name + ' armour');
  }
});

test('an old save\'s inflated upgrade and clamped Hard copy are rebuilt on load, once (#581)', () => {
  const { S, P } = W.character(60);
  const blue = Object.values(D.ITEMS).find((i) => i.name === "Saltbones' Cutlass"), epic = Object.values(D.ITEMS).find((i) => i.name === 'Tidecrown, Blade of the Prince');
  const old = G.copyItem(blue.id), ref = G.upgradeRef(blue), pw = D.UPGRADE.cap[blue.q] * ref, f = pw / G.itemPoints(old);
  Object.assign(old, { base: JSON.parse(JSON.stringify({ stats: old.stats, dmg: old.dmg })), pw, dmg: [Math.round(old.dmg[0] * f), Math.round(old.dmg[1] * f)], locked: true }); // as the old formula made it
  const oldHard = Object.assign(G.copyItem(epic.id), { hard: true }); // clamped: no base, no growth
  P.equip.weapon = old; P.bags.push({ item: oldHard, n: 1 }); S.flags = S.flags || {}; delete S.flags.gear581;
  G.save(); G.load(S.id);
  const w = G.S.player.equip.weapon, h = G.S.player.bags.find((b) => b.item.id === epic.id).item;
  assert.ok(dps(w) < dps(epic), `upgraded blue ${dps(w).toFixed(1)} under the raid's ${dps(epic).toFixed(1)}`);
  assert.strictEqual(w.locked, true, 'keeps its other fields');
  assert.ok(dps(h) > dps(epic) && h.hard, 'Hard copy grows');
  const again = JSON.stringify(G.regearItem(h)); assert.strictEqual(again, JSON.stringify(h), 'rebuilding again changes nothing');
  assert.strictEqual(G.S.flags.gear581, 1);
});
