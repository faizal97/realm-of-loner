// Runs after every zone has loaded: derived fields that need the whole world.
(function (root) {
  const D = root.D;
  // Stamp "Drops from <boss>, <dungeon>" onto boss loot, using the dungeon each boss belongs to.
  for (const dk in D.DUNGEONS) for (const pl of D.DUNGEONS[dk].pulls) for (const mk of pl.mobs)
    for (const id of (D.MOBS[mk].loot || [])) if (D.ITEMS[id] && !D.ITEMS[id].source) D.ITEMS[id].source = `${D.MOBS[mk].name}, ${D.DUNGEONS[dk].name}`;
  for (const k in D.ABILITIES) D.ABILITIES[k].id = k; // engine looks up talent effects by ability id
  // a zone's level span by region (#188): the lowest and highest level of its places, leaving out capitals (they span
  // 1-60) and dungeon entrances (gate: the dungeon's levels, not the zone's)
  D.zoneLevels = () => {
    const z = {};
    for (const k in D.PLACES) { const p = D.PLACES[k]; if (!p.lvl || !p.region || p.gate || p.lvl[1] - p.lvl[0] >= 50) continue; const r = z[p.region] = z[p.region] || [99, 0]; r[0] = Math.min(r[0], p.lvl[0]); r[1] = Math.max(r[1], p.lvl[1]); }
    return z;
  };
  // a fixed blue below 60 is never weaker than a random one (#141): one under the generated blue budget of its level
  // gets the missing points in its own stats, spread by their shares (tools/validate.js holds the line). Saves keep the
  // copies they hold.
  for (const id in D.ITEMS) {
    const it = D.ITEMS[id], keys = Object.keys(it.stats || {}).filter((k) => it.stats[k] > 0);
    if (it.q !== 3 || !(it.lvl < 60) || !keys.length) continue;
    const have = keys.reduce((a, k) => a + it.stats[k], 0), need = Math.round(D.gearBudget(it.lvl, 3));
    if (have >= need) continue;
    const add = need - have, share = keys.map((k) => ({ k, x: (add * it.stats[k]) / have }));
    let given = 0; for (const s of share) { const v = Math.floor(s.x); it.stats[s.k] += v; given += v; }
    share.sort((a, b) => (b.x % 1) - (a.x % 1)); for (let i = 0; given < add; i++, given++) it.stats[share[i % share.length].k]++;
  }
  delete D.item; delete D.zone; // authoring helpers only
})(typeof window !== 'undefined' ? window : globalThis);
