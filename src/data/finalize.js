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
  delete D.item; delete D.zone; // authoring helpers only
})(typeof window !== 'undefined' ? window : globalThis);
