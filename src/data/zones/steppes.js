// The Cinderfields: contested, levels 52–55 (v7). Drummond's Vigil (Accord) and Brand Crest (Krugar); Cinderpeak
// with the gate of Cinderpeak Depths looms over it. The Black Brood is close now.
(function (root) {
  const D = root.D;
  D.zone('steppes', { name: 'The Cinderfields', faction: 'contested', music: 'cinderfields', town: 'cinderfields_town' });
  D.item('firegut_tusk', { name: 'Smokebelly Tusk', slot: 'quest', q: 1, icon: 'tusk' });
  D.item('blackrock_signet', { name: 'Cinderpeak Signet', slot: 'quest', q: 1, icon: 'ring' });
  D.item('flamecaller_tome', { name: "Flamecaller's Tome", slot: 'quest', q: 1, icon: 'journal' });
  D.item('broodling_essence', { name: 'Broodling Essence', slot: 'quest', q: 1, icon: 'firebolt' });
  D.item('dragonspawn_scale', { name: 'Black Dragonspawn Scale', slot: 'quest', q: 1, icon: 'chest_box' });
  D.item('flamekin_ember', { name: 'Emberling Ember', slot: 'quest', q: 1, icon: 'firebolt' });
  D.item('gorlash_horn', { name: "Old Smokejaw's Horn", slot: 'quest', q: 1, icon: 'tusk' });
  D.item('volchan_core', { name: "Scorch's Core", slot: 'quest', q: 1, icon: 'dust' });
  D.item('gorlash_cloak', { name: 'Cinder Cloak', slot: 'back', q: 3, lvl: 54, armor: 70, stats: { sta: 13, str: 11 }, icon: 'cloak', sell: 9800, source: 'Old Smokejaw, Broodwing Path' });
  D.item('volchan_staff', { name: 'Staff of the Cinderfields', slot: 'weapon', wtype: 'staff', q: 3, lvl: 55, dmg: [78, 116], speed: 3, stats: { int: 20, spi: 14 }, sp: 32, icon: 'staff', sell: 11000 });
  D.item('volchan_plate', { name: 'Cinderfall Mail', slot: 'chest', atype: 'mail', q: 3, lvl: 55, armor: 460, stats: { str: 20, sta: 17 }, icon: 'chest_mail', sell: 11000 });
  D.item('volchan_band', { name: 'Ember Band', slot: 'finger', q: 3, lvl: 55, stats: { agi: 12, sta: 12 }, icon: 'ring', sell: 10000 });

  Object.assign(D.MOBS, {
    firegut_ogre: { name: 'Smokebelly Ogre', lvl: [52, 53], family: 'giant', hpMult: 1.2, drops: [['thieves_coin', 0.55], ['linen_cloth', 0.3]], qdrops: [['firegut_tusk', 0.55]], aggro: 'Smokebelly burn you!' },
    firegut_brute: { name: 'Smokebelly Brute', lvl: [53, 54], family: 'giant', hpMult: 1.25, drops: [['thieves_coin', 0.55], ['linen_cloth', 0.3]], qdrops: [['firegut_tusk', 0.4]], aggro: 'Crush tiny thing!' },
    blackrock_battlemaster: { name: 'Cinderpeak Battlemaster', lvl: [53, 54], family: 'humanoid', hpMult: 1.15, drops: [['thieves_coin', 0.55], ['linen_cloth', 0.3]], qdrops: [['blackrock_signet', 0.5]], aggro: 'For Vale!' },
    blackrock_flamecaller: { name: 'Cinderpeak Flamecaller', lvl: [54, 55], family: 'humanoid', drops: [['thieves_coin', 0.55], ['linen_cloth', 0.35]], qdrops: [['flamecaller_tome', 0.45], ['blackrock_signet', 0.3]], aggro: 'Burn in the fires of Cinderpeak!' },
    black_broodling: { name: 'Black Broodling', lvl: [53, 54], family: 'dragonkin', drops: [['ruined_pelt', 0.2]], qdrops: [['broodling_essence', 0.55]] },
    black_dragonspawn: { name: 'Black Dragonspawn', lvl: [54, 55], family: 'dragonkin', hpMult: 1.25, drops: [['thieves_coin', 0.5]], qdrops: [['dragonspawn_scale', 0.5]], aggro: 'The whelps will feast on your bones!' },
    flamekin_spitter: { name: 'Emberling Spitter', lvl: [52, 53], family: 'elemental', drops: [['trogg_stone', 0.3]], qdrops: [['flamekin_ember', 0.55]] },
    blazing_elemental: { name: 'Blazing Elemental', lvl: [53, 54], family: 'elemental', hpMult: 1.15, drops: [['trogg_stone', 0.3]], qdrops: [['flamekin_ember', 0.4]] },
    gorlash: { name: 'Old Smokejaw', lvl: [54, 54], family: 'dragonkin', named: true, hpMult: 2.2, dmgMult: 1.35, drops: [['gorlash_cloak', 0.35], ['thieves_coin', 1]], qdrops: [['gorlash_horn', 1]] },
    volchan: { name: 'Scorch', lvl: [55, 55], family: 'elemental', elite: true, named: true, hpMult: 5.5, dmgMult: 2.6, special: 'molten', specialText: 'Scorch erupts in flame!', drops: [['trogg_stone', 1]], qdrops: [['volchan_core', 1]], loot: ['volchan_staff', 'volchan_plate', 'volchan_band'] },
  });

  Object.assign(D.PLACES, {
    morgans_vigil: { name: "Drummond's Vigil", zone: 'The Cinderfields', region: 'steppes', faction: 'alliance', scene: 'morgans_vigil', lvl: [52, 55], safe: true, inn: true, mobs: [], pool: 0, npcs: ['marshal_maxwell', 'oralius', 'helendis', 'innkeeper_ashmorn'], vendor: 'innkeeper_ashmorn',
      links: { dreadmaul_rock: 16, ruins_of_thaurissan: 18, lakeshire: 40 }, via: { lakeshire: 'Road through Stoneharrow' } },
    flame_crest: { name: 'Brand Crest', zone: 'The Cinderfields', region: 'steppes', faction: 'horde', scene: 'flame_crest', lvl: [52, 55], safe: true, inn: true, mobs: [], pool: 0, npcs: ['gorzeeki', 'thal_kaur', 'innkeeper_bruk', 'shul_kar'], vendor: 'innkeeper_bruk', gearVendor: 'shul_kar',
      links: { terror_wing_path: 16, blackrock_stronghold: 18, orgrimmar: 60 }, via: { orgrimmar: 'Wind Rider' } },
    dreadmaul_rock: { name: 'Brokemaw Rock', zone: 'The Cinderfields', region: 'steppes', scene: 'dreadmaul_rock', lvl: [52, 54], mobs: [['firegut_ogre', 5], ['firegut_brute', 4]], pool: 10, npcs: [], links: { morgans_vigil: 16, blackrock_stronghold: 18 } },
    ruins_of_thaurissan: { name: 'Ruins of Grimmark', zone: 'The Cinderfields', region: 'steppes', scene: 'ruins_of_thaurissan', lvl: [52, 54], mobs: [['flamekin_spitter', 5], ['blazing_elemental', 4]], named: { volchan: 150 }, pool: 10, npcs: [], links: { morgans_vigil: 18, blackrock_mountain: 18 } },
    blackrock_stronghold: { name: 'Cinderpeak Stronghold', zone: 'The Cinderfields', region: 'steppes', scene: 'blackrock_stronghold', lvl: [53, 55], mobs: [['blackrock_battlemaster', 5], ['blackrock_flamecaller', 4]], pool: 10, npcs: [], links: { flame_crest: 18, dreadmaul_rock: 18, blackrock_mountain: 16 } },
    terror_wing_path: { name: 'Broodwing Path', zone: 'The Cinderfields', region: 'steppes', scene: 'terror_wing_path', lvl: [53, 55], mobs: [['black_broodling', 5], ['black_dragonspawn', 4]], named: { gorlash: 300 }, pool: 10, npcs: [], links: { flame_crest: 16, blackrock_mountain: 18 } },
    blackrock_mountain: { name: 'Cinderpeak', zone: 'The Cinderfields', region: 'steppes', scene: 'blackrock_mountain', lvl: [51, 60], mobs: [['blazing_elemental', 3], ['blackrock_battlemaster', 3]], pool: 6, npcs: [], links: { ruins_of_thaurissan: 18, blackrock_stronghold: 16, terror_wing_path: 18 } },
  });
  D.PLACES.lakeshire.links.morgans_vigil = 40; D.PLACES.lakeshire.via = Object.assign(D.PLACES.lakeshire.via || {}, { morgans_vigil: 'Road to the Cinderfields' });
  D.PLACES.orgrimmar.links.flame_crest = 60; D.PLACES.orgrimmar.via.flame_crest = 'Wind Rider';

  Object.assign(D.NPCS, {
    marshal_maxwell: { name: 'Marshal Kettering', title: "Drummond's Vigil" },
    oralius: { name: 'Ossian', title: 'Explorer' },
    helendis: { name: 'Hela of the River', title: 'Druid' },
    innkeeper_ashmorn: { name: 'Quartermaster Harl', title: 'Supplies' },
    gorzeeki: { name: 'Gizzeki Sparks', title: 'Brand Crest' },
    thal_kaur: { name: "Thakka", title: 'Woodcleaver Scout' },
    innkeeper_bruk: { name: 'Innkeeper Rugga', title: 'Innkeeper' },
    shul_kar: { name: "Shukka", title: 'Weaponsmith' },
  });

  const A = (id, q) => { q.faction = 'alliance'; D.QUESTS[id] = q; };
  const H = (id, q) => { q.faction = 'horde'; D.QUESTS[id] = q; };
  A('lakeshire_steppes', { name: "Drummond's Vigil", lvl: 52, giver: 'solomon', turnin: 'marshal_maxwell', text: "South of Stoneharrow lies the Cinderfields. Marshal Kettering holds Drummond's Vigil there, in the shadow of Cinderpeak. He asked for you by name.",
    objs: [{ type: 'visit', place: 'morgans_vigil' }], reward: { money: 2600 } });
  H('org_steppes', { name: 'Brand Crest', lvl: 52, giver: 'thrall_herald', turnin: 'thal_kaur', text: "The High Chief sends scouts to watch Cinderpeak. Take the wyvern rider to Brand Crest.",
    objs: [{ type: 'visit', place: 'flame_crest' }], reward: { money: 2600 } });
  const both = (key, lvl, name, text, objs, ra, rh, pre) => {
    A('bsa_' + key, Object.assign({ name, lvl, giver: ra[0], turnin: ra[0], text: text[0], objs, reward: ra[1] }, pre ? { pre: ['bsa_' + pre] } : {}));
    H('bsh_' + key, Object.assign({ name, lvl, giver: rh[0], turnin: rh[0], text: text[1], objs, reward: rh[1] }, pre ? { pre: ['bsh_' + pre] } : {}));
  };
  both('firegut', 52, 'Brokemaw Rock', ['Smokebelly ogres hold Brokemaw Rock. Kill 12.', 'Smokebelly ogres attack our scouts. Kill 12.'],
    [{ type: 'kill', mob: 'firegut_ogre', n: 12 }], ['marshal_maxwell', { choice: ['fam_feet53'] }], ['thal_kaur', { choice: ['fam_feet53'] }]);
  both('firegut_tusks', 53, 'Smokebelly Tusks', ['Bring me 10 tusks.', 'Bring me 10 tusks.'], [{ type: 'collect', item: 'firegut_tusk', n: 10 }], ['oralius', { money: 6000 }], ['gorzeeki', { money: 6000 }], 'firegut');
  both('brutes_bs', 54, 'Smokebelly Brutes', ['Kill 10 brutes.', 'Kill 10 brutes.'], [{ type: 'kill', mob: 'firegut_brute', n: 10 }], ['marshal_maxwell', { choice: ['fam_wrist54'] }], ['thal_kaur', { choice: ['fam_wrist54'] }], 'firegut');
  both('flamekin', 52, 'The Ruins of Grimmark', ['Fire elementals haunt the ruins of the old dwarven capital. Kill 12 spitters and bring me 5 embers.', 'Kill 12 emberling spitters and bring me 5 embers.'],
    [{ type: 'kill', mob: 'flamekin_spitter', n: 12 }, { type: 'collect', item: 'flamekin_ember', n: 5 }], ['helendis', { choice: ['fam_hands53'] }], ['gorzeeki', { choice: ['fam_hands53'] }]);
  both('blazing', 53, 'Blazing Elementals', ['Kill 10 blazing elementals.', 'Kill 10 blazing elementals.'], [{ type: 'kill', mob: 'blazing_elemental', n: 10 }], ['helendis', { money: 6100 }], ['gorzeeki', { money: 6100 }], 'flamekin');
  both('blackrock', 53, 'The Cinderpeak Clan', ['The Cinderpeak orcs serve Vale. Kill 12 battlemasters.', 'The Cinderpeak betrayed the Krugar. Kill 12 battlemasters.'],
    [{ type: 'kill', mob: 'blackrock_battlemaster', n: 12 }], ['marshal_maxwell', { choice: ['fam_chest54'] }], ['thal_kaur', { choice: ['fam_chest54'] }]);
  both('signets', 54, 'Cinderpeak Signets', ['Bring me 8 signets.', 'Bring me 8 signets.'], [{ type: 'collect', item: 'blackrock_signet', n: 8 }], ['oralius', { money: 6400 }], ['shul_kar', { money: 6400 }], 'blackrock');
  both('flamecallers', 55, 'The Flamecallers', ['Kill 10 flamecallers and bring me 4 tomes.', 'Kill 10 flamecallers and bring me 4 tomes.'],
    [{ type: 'kill', mob: 'blackrock_flamecaller', n: 10 }, { type: 'collect', item: 'flamecaller_tome', n: 4 }], ['marshal_maxwell', { choice: ['fam_legs55'] }], ['thal_kaur', { choice: ['fam_legs55'] }], 'blackrock');
  both('broodlings', 54, 'Broodwing', ['Black dragon broodlings hatch on the Broodwing Path. Kill 12 and bring me 5 essences.', 'Kill 12 black broodlings and bring me 5 essences.'],
    [{ type: 'kill', mob: 'black_broodling', n: 12 }, { type: 'collect', item: 'broodling_essence', n: 5 }], ['helendis', { choice: ['fam_back54'] }], ['gorzeeki', { choice: ['fam_back54'] }]);
  both('dragonspawn', 55, 'The Dragonspawn', ['Kill 10 dragonspawn and bring me 5 scales. Kingsmere must see them.', 'Kill 10 dragonspawn and bring me 5 scales.'],
    [{ type: 'kill', mob: 'black_dragonspawn', n: 10 }, { type: 'collect', item: 'dragonspawn_scale', n: 5 }], ['marshal_maxwell', { choice: ['fam_weapon55'] }], ['thal_kaur', { choice: ['fam_weapon55'] }], 'broodlings');
  both('gorlash', 54, 'Old Smokejaw', ['A dragonkin brute, Old Smokejaw, guards the path. It is rarely seen. Bring me its horn.', 'Old Smokejaw, a dragonkin brute, is rarely seen. Bring me its horn.'],
    [{ type: 'collect', item: 'gorlash_horn', n: 1 }], ['oralius', { choice: ['fam_ring_rare55'] }], ['gorzeeki', { choice: ['fam_ring_rare55'] }]);
  both('ogre_patrol_bs', 54, 'The Rock', ['8 ogres and 6 brutes.', '8 ogres and 6 brutes.'], [{ type: 'kill', mob: 'firegut_ogre', n: 8 }, { type: 'kill', mob: 'firegut_brute', n: 6 }], ['oralius', { money: 6300 }], ['shul_kar', { money: 6300 }], 'brutes_bs');
  both('stronghold_patrol', 55, 'Siege the Stronghold', ['8 battlemasters and 6 flamecallers.', '8 battlemasters and 6 flamecallers.'], [{ type: 'kill', mob: 'blackrock_battlemaster', n: 8 }, { type: 'kill', mob: 'blackrock_flamecaller', n: 6 }], ['marshal_maxwell', { choice: ['fam_waist55'] }], ['thal_kaur', { choice: ['fam_waist55'] }], 'flamecallers');
  both('volchan', 55, 'Wanted: Scorch', ['A great fire elemental, Scorch, rises from the ruins. Bring me its core. Take friends.', 'Scorch, a fire elemental, burns the ruins. Bring me its core. Take friends.'],
    [{ type: 'collect', item: 'volchan_core', n: 1 }], ['helendis', { choice: ['fam_weapon55'] }], ['gorzeeki', { choice: ['fam_weapon55'] }]);
  D.QUESTS.bsa_volchan.group = 3; D.QUESTS.bsh_volchan.group = 3;
  Object.assign(D.ACTIVITIES, {
    volchan: { name: 'Wanted: Scorch', where: 'ruins_of_thaurissan', size: 3, minLvl: 52, maxLvl: 55, desc: 'Open-world elite in the Cinderfields. 3 players.', boss: 'volchan', pulls: [{ scene: 'ruins_of_thaurissan', label: 'The ruins', mobs: ['flamekin_spitter', 'flamekin_spitter'] }, { scene: 'ruins_of_thaurissan', label: 'The ruins', mobs: ['blazing_elemental', 'flamekin_spitter'] }, { scene: 'ruins_of_thaurissan', label: 'Scorch', mobs: ['volchan'], boss: true }] },
  });
})(typeof window !== 'undefined' ? window : globalThis);
