// The Gemfall Caves (dungeon, levels 46–50, v6): the corrupted caverns of Ghesra, the Stone Duchess in Mournwaste. The gate is reached from
// contested Ferndeep, so both factions can run it.
(function (root) {
  const D = root.D;
  D.item('theradras_scepter', { name: 'Scepter of Faolan', slot: 'quest', q: 1, icon: 'staff' });
  D.item('theradras_gem', { name: 'Gem of Ghesra', slot: 'quest', q: 1, icon: 'seed' });
  D.item('vyletongue_blade', { name: "Venomlip's Blade", slot: 'quest', q: 1, icon: 'dagger' });
  const gear = (id, name, slot, o) => D.item(id, Object.assign({ name, slot, q: 3 }, o));
  gear('noxxion_cloak', 'Noxious Shroud', 'back', { lvl: 47, armor: 60, stats: { sta: 11, int: 9 }, icon: 'cloak', sell: 7400 });
  gear('noxxion_boots', 'Slime-Coated Boots', 'feet', { atype: 'mail', lvl: 47, armor: 250, stats: { str: 12, sta: 11 }, icon: 'boots', sell: 7400 });
  gear('razorlash_gloves', 'Thorn-Laced Gloves', 'hands', { atype: 'leather', lvl: 47, armor: 110, stats: { agi: 12, sta: 10 }, icon: 'gloves', sell: 7300 });
  gear('vyletongue_dagger', 'Satyr Fang', 'weapon', { wtype: 'dagger', lvl: 48, dmg: [38, 70], speed: 1.8, stats: { agi: 13, sta: 8 }, icon: 'dagger', sell: 8000 });
  gear('vyletongue_boots', "Venomlip's Treads", 'feet', { atype: 'leather', lvl: 48, armor: 118, stats: { agi: 12, sta: 11 }, icon: 'boots', sell: 7600 });
  gear('celebras_staff', 'Staff of Faolan', 'weapon', { wtype: 'staff', lvl: 48, dmg: [70, 104], speed: 3, stats: { int: 18, spi: 12 }, sp: 28, icon: 'staff', sell: 8200 });
  gear('celebras_robe', "Keeper's Robe", 'chest', { atype: 'cloth', lvl: 48, armor: 104, stats: { int: 17, spi: 12 }, sp: 20, icon: 'chest_cloth', sell: 8000 });
  gear('landslide_maul', 'Rockgrip Maul', 'weapon', { wtype: 'mace', lvl: 49, dmg: [62, 104], speed: 2.8, stats: { str: 17, sta: 11 }, icon: 'mace', sell: 8600 });
  gear('landslide_legs', 'Granite Skin Leggings', 'legs', { atype: 'mail', lvl: 49, armor: 350, stats: { str: 16, sta: 14 }, icon: 'legs', sell: 8400 });
  gear('theradras_blade', "Ghesra's Blade", 'weapon', { wtype: 'sword', lvl: 50, dmg: [64, 106], speed: 2.6, stats: { agi: 16, str: 12 }, icon: 'sword', sell: 9200 });
  gear('theradras_robe', "Duchess's Silk Robe", 'chest', { atype: 'cloth', lvl: 50, armor: 108, stats: { int: 19, spi: 14 }, sp: 24, icon: 'chest_cloth', sell: 9000 });
  gear('theradras_leather', 'Earthen Leather Vest', 'chest', { atype: 'leather', lvl: 50, armor: 230, stats: { agi: 19, sta: 14 }, icon: 'chest_leather', sell: 9000 });
  gear('theradras_plate', 'Crystal-Studded Hauberk', 'chest', { atype: 'mail', lvl: 50, armor: 420, stats: { str: 19, sta: 16 }, icon: 'chest_mail', sell: 9200 });

  Object.assign(D.MOBS, {
    putridus_trickster: { name: 'Graverot Trickster', lvl: [46, 47], family: 'demon', drops: [['thieves_coin', 0.5], ['linen_cloth', 0.3]] },
    constrictor_vine: { name: 'Constrictor Vine', lvl: [46, 47], family: 'elemental', hpMult: 1.1, drops: [['trogg_stone', 0.2]] },
    cavern_lurker: { name: 'Cavern Lurker', lvl: [47, 48], family: 'elemental', hpMult: 1.2, drops: [['trogg_stone', 0.3]] },
    noxxion: { name: 'Sludgewell', lvl: [47, 47], family: 'elemental', boss: true, special: 'kelris', summon: 'constrictor_vine', specialText: 'Sludgewell splits off a slime!', loot: ['noxxion_cloak', 'noxxion_boots'] },
    razorlash: { name: 'Thornlash', lvl: [47, 47], family: 'elemental', boss: true, special: 'whirl', specialText: 'Thornlash lashes out with thorns!', loot: ['razorlash_gloves', 'noxxion_cloak'] },
    lord_vyletongue: { name: 'Lord Venomlip', lvl: [48, 48], family: 'demon', boss: true, special: 'molten', specialText: 'Lord Venomlip throws a poisoned blade!', loot: ['vyletongue_dagger', 'vyletongue_boots'], qdrops: [['vyletongue_blade', 1]], aggro: 'The Gemfall Caves is ours!' },
    celebras_the_cursed: { name: 'Faolan the Cursed', lvl: [48, 48], family: 'elemental', boss: true, special: 'cook', specialText: 'Faolan draws strength from the roots.', loot: ['celebras_staff', 'celebras_robe'], qdrops: [['theradras_scepter', 1]] },
    landslide: { name: 'Landslide', lvl: [49, 49], family: 'elemental', boss: true, special: 'slam', specialText: 'Landslide shakes the cavern!', loot: ['landslide_maul', 'landslide_legs'] },
    princess_theradras: { name: 'Ghesra, the Stone Duchess', lvl: [49, 49], family: 'elemental', boss: true, special: 'slam', specialText: 'Ghesra, the Stone Duchess hurls a boulder!', loot: ['theradras_blade', 'theradras_robe', 'theradras_leather', 'theradras_plate'], qdrops: [['theradras_gem', 1]], aggro: 'You will be buried in my caverns!' },
  });

  const A = (id, q) => { q.faction = 'alliance'; D.QUESTS[id] = q; };
  const H = (id, q) => { q.faction = 'horde'; D.QUESTS[id] = q; };
  A('md_theradras_a', { name: 'The Stone Duchess', lvl: 50, giver: 'shandris', turnin: 'shandris', dungeon: 'maraudon', text: 'Ghesra, the Stone Duchess, poisons Mournwaste from the depths of The Gemfall Caves. End her and bring me her gem.',
    objs: [{ type: 'collect', item: 'theradras_gem', n: 1 }], reward: { choice: ['fam_back_rare50'] } });
  H('md_theradras_h', { name: 'The Stone Duchess', lvl: 50, giver: 'hadoken', turnin: 'hadoken', dungeon: 'maraudon', text: 'Ghesra, the Stone Duchess, corrupts the land from The Gemfall Caves. End her and bring me her gem.',
    objs: [{ type: 'collect', item: 'theradras_gem', n: 1 }], reward: { choice: ['fam_back_rare50'] } });
  A('md_celebras', { name: 'The Scepter of Faolan', lvl: 48, giver: 'latronicus', turnin: 'latronicus', dungeon: 'maraudon', text: 'Faolan, a keeper of the grove, went down into The Gemfall Caves to calm the Duchess, and she cursed him. His scepter may break the curse. Bring it to me.',
    objs: [{ type: 'collect', item: 'theradras_scepter', n: 1 }], reward: { choice: ['fam_weapon48'] } });
  H('md_vyletongue', { name: "Venomlip's Blade", lvl: 48, giver: 'orwin', turnin: 'orwin', dungeon: 'maraudon', text: 'The satyr lord Venomlip rules the caverns\' upper halls. Take his blade.',
    objs: [{ type: 'collect', item: 'vyletongue_blade', n: 1 }], reward: { choice: ['fam_weapon48'] } });
  Object.assign(D.DUNGEONS, {
    maraudon: { music: 'gemfall', name: 'The Gemfall Caves', minLvl: 46, par: 425, trialPar: 480, size: 5, trashMult: { hp: 2.2, dmg: 2.09 }, bossMult: { hp: 10, dmg: 4.56 }, trial: { trashMult: { hp: 2.2, dmg: 2.2 }, bossMult: { hp: 10, dmg: 4.8 } }, /* damage lowered to the dungeon target (#215: a fitted player wiped in 18-49% of runs, target 5-15%); Trials keep the numbers they were tuned on */ pulls: [
      { scene: 'maraudon_caverns', label: 'The purple caves', mobs: ['putridus_trickster', 'constrictor_vine'] },
      { scene: 'maraudon_caverns', label: 'Sludgewell', mobs: ['noxxion'], boss: true },
      { scene: 'maraudon_caverns', label: 'Thornlash', mobs: ['razorlash'], boss: true },
      { scene: 'maraudon_caverns', label: 'Satyr halls', mobs: ['putridus_trickster', 'putridus_trickster'] },
      { scene: 'maraudon_caverns', label: 'Lord Venomlip', mobs: ['lord_vyletongue'], boss: true },
      { scene: 'maraudon_falls', label: 'The orange falls', mobs: ['cavern_lurker', 'constrictor_vine'] },
      { scene: 'maraudon_falls', label: 'Faolan the Cursed', mobs: ['celebras_the_cursed'], boss: true },
      { scene: 'maraudon_falls', label: 'Landslide', mobs: ['landslide'], boss: true },
      { scene: 'maraudon_throne', label: 'Ghesra, the Stone Duchess', mobs: ['princess_theradras'], boss: true },
    ] },
  });
  Object.assign(D.ACTIVITIES, {
    maraudon: { name: 'The Gemfall Caves', dungeon: 'maraudon', where: 'maraudon_gate', size: 5, minLvl: 46, maxLvl: 50, desc: 'Dungeon in Mournwaste. 5 players. Both factions.' },
  });
})(typeof window !== 'undefined' ? window : globalThis);
