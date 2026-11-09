// Elderglen (with The Tidehollow Deeps): the first CONTESTED zone, levels 22–30 (v4.1).
// Both factions quest here: the Accord from Ilvaris, the Krugar from Stumpwatch. Each town is closed to the
// other faction (place.faction), so the roads meet in the wild and nowhere else. War Mode ambushes are more frequent here.
(function (root) {
  const D = root.D;
  D.zone('ashenvale', { name: 'Elderglen', faction: 'contested', music: 'elderglen', town: 'elderglen_town' });
  // quest items
  // filling the gear gaps (#535; Feral tank pieces #533): blues and purples where a class and role had none
  D.item('tidehollow_sash', { name: 'Kelpweave Sash', slot: 'waist', q: 3, atype: 'cloth', lvl: 25, armor: 27, stats: { int: 11, spi: 7 }, sp: 8, icon: 'belt', sell: 2300 });
  D.item('naga_scale', { name: 'Scalelash Scale', slot: 'quest', q: 1, icon: 'fin' });
  D.item('sea_witch_pearl', { name: "Sea Witch's Pearl", slot: 'quest', q: 1, icon: 'ring' });
  D.item('bear_claw_av', { name: 'Elderglen Bear Claw', slot: 'quest', q: 1, icon: 'claw' });
  D.item('ghostpaw_pelt', { name: 'Mistpaw Pelt', slot: 'quest', q: 1, icon: 'pelt' });
  D.item('alpha_fang', { name: 'Alpha Fang', slot: 'quest', q: 1, icon: 'claw' });
  D.item('thistlefur_totem', { name: 'Briarpelt Totem', slot: 'quest', q: 1, icon: 'voodoo_doll' });
  D.item('satyr_horn', { name: 'Sourheart Horn', slot: 'quest', q: 1, icon: 'tusk' });
  D.item('fel_orb', { name: 'Gloom Orb', slot: 'quest', q: 1, icon: 'seed' });
  D.item('demon_heart', { name: 'Smouldering Demon Heart', slot: 'quest', q: 1, icon: 'zombie_brain' });
  D.item('ursal_headdress', { name: "Ursal's Bone Headdress", slot: 'quest', q: 1, icon: 'head' });
  D.item('sharptalon_claw', { name: "Skyrend's Claw", slot: 'quest', q: 1, icon: 'claw' });
  D.item('head_kelris', { name: 'Head of Oreth', slot: 'quest', q: 1, icon: 'head' });
  D.item('akumai_scale', { name: "Scale of Old Coilmaw", slot: 'quest', q: 1, icon: 'fin' });
  D.item('sarevess_crown', { name: "Szira's Serpent Crown", slot: 'quest', q: 1, icon: 'ring' });
  // named and elite drops
  D.item('ursal_maul', { name: "Ursal's Maul", slot: 'weapon', wtype: 'staff', q: 3, lvl: 26, dmg: [46, 70], speed: 3.3, stats: { str: 11, sta: 8 }, icon: 'staff', sell: 3400, source: 'Bruk the Mauler, Briarpelt Village' });
  D.item('sharptalon_cloak', { name: 'Feathered Mantle', slot: 'back', q: 3, lvl: 30, armor: 46, stats: { agi: 9, sta: 7 }, icon: 'cloak', sell: 3900 });
  D.item('sharptalon_bow', { name: 'Talonstrike Bow', slot: 'ranged', wtype: 'bow', q: 3, lvl: 30, dmg: [36, 60], speed: 2.8, stats: { agi: 8 }, icon: 'bow', sell: 4000 });
  D.item('sharptalon_band', { name: 'Skyrider Band', slot: 'finger', q: 3, lvl: 30, stats: { sta: 7, int: 7 }, icon: 'ring', sell: 3800 });
  // The Tidehollow Deeps drops (levels 25-28)
  D.item('ghamoo_shell', { name: 'Ancient Shell Vest', slot: 'chest', atype: 'mail', q: 3, lvl: 25, armor: 230, stats: { sta: 9, str: 7 }, icon: 'chest_mail', sell: 3200 });
  D.item('ghamoo_band', { name: 'Tortoise Band', slot: 'finger', q: 3, lvl: 25, stats: { sta: 8, spi: 5 }, icon: 'ring', sell: 3000 });
  D.item('sarevess_bow', { name: "Szira's Longbow", slot: 'ranged', wtype: 'bow', q: 3, lvl: 26, dmg: [32, 54], speed: 2.8, stats: { agi: 7 }, icon: 'bow', sell: 3300 });
  D.item('sarevess_gloves', { name: 'Serpent Scale Gloves', slot: 'hands', atype: 'leather', q: 3, lvl: 26, armor: 62, stats: { agi: 7, sta: 5 }, icon: 'gloves', sell: 3000 });
  D.item('gelihast_spear', { name: "Glubb's Spear", slot: 'weapon', wtype: 'staff', q: 3, lvl: 26, dmg: [44, 67], speed: 3.2, stats: { str: 10, agi: 6 }, icon: 'staff', sell: 3300 });
  D.item('gelihast_cloak', { name: 'Murkwater Cloak', slot: 'back', q: 3, lvl: 26, armor: 40, stats: { sta: 7, int: 5 }, icon: 'cloak', sell: 2900 });
  D.item('kelris_wand', { name: 'Twilight Cultist Robe', slot: 'chest', atype: 'cloth', q: 3, lvl: 27, armor: 62, stats: { int: 11, spi: 8 }, sp: 12, icon: 'chest_cloth', sell: 3400 });
  D.item('kelris_blade', { name: 'Blade of the Betrayer', slot: 'weapon', wtype: 'dagger', q: 3, lvl: 27, dmg: [23, 42], speed: 1.8, stats: { agi: 8, sta: 5 }, icon: 'dagger', sell: 3400 });
  D.item('akumai_greaves', { name: 'Deepwater Greaves', slot: 'legs', atype: 'mail', q: 3, lvl: 28, armor: 205, stats: { str: 10, sta: 9 }, icon: 'legs', sell: 3700 });
  D.item('akumai_leggings', { name: 'Hydra Hide Leggings', slot: 'legs', atype: 'leather', q: 3, lvl: 28, armor: 118, stats: { agi: 11, sta: 8 }, icon: 'legs', sell: 3700 });
  D.item('akumai_staff', { name: 'Staff of the Deeps', slot: 'weapon', wtype: 'staff', q: 3, lvl: 28, dmg: [48, 73], speed: 3, stats: { int: 12, spi: 8 }, sp: 18, icon: 'staff', sell: 3800 });
  D.item('akumai_blade', { name: "Old Coilmaw's Fang", slot: 'weapon', wtype: 'sword', q: 3, lvl: 28, dmg: [38, 62], speed: 2.6, stats: { str: 9, agi: 6 }, icon: 'sword', sell: 3800 });

  // creatures
  Object.assign(D.MOBS, {
    wrathtail_myrmidon: { name: 'Scalelash Myrmidon', lvl: [22, 23], family: 'humanoid', drops: [['murloc_eye', 0.3], ['thieves_coin', 0.35]], qdrops: [['naga_scale', 0.55]], aggro: 'The sea will take you!' },
    wrathtail_sea_witch: { name: 'Scalelash Sea Witch', ranged: 'frost', lvl: [23, 24], family: 'humanoid', drops: [['murloc_eye', 0.3], ['thieves_coin', 0.4]], qdrops: [['sea_witch_pearl', 0.45], ['naga_scale', 0.3]], aggro: 'Drown, surface-dweller!' },
    ashenvale_bear: { name: 'Elderglen Bear', lvl: [22, 23], family: 'beast', hpMult: 1.1, drops: [['ruined_pelt', 0.4]], qdrops: [['bear_claw_av', 0.55]] },
    ghostpaw_runner: { name: 'Mistpaw Runner', lvl: [23, 24], family: 'beast', drops: [['ruined_pelt', 0.4]], qdrops: [['ghostpaw_pelt', 0.55]] },
    ghostpaw_alpha: { name: 'Mistpaw Alpha', lvl: [25, 27], family: 'beast', hpMult: 1.15, drops: [['ruined_pelt', 0.4]], qdrops: [['alpha_fang', 0.5], ['ghostpaw_pelt', 0.3]] },
    thistlefur_ursa: { name: 'Briarpelt Ursa', lvl: [24, 25], family: 'humanoid', hpMult: 1.1, drops: [['furbolg_charm', 0.35], ['linen_cloth', 0.25]], qdrops: [['thistlefur_totem', 0.45]], aggro: 'Briarpelt territory!' },
    thistlefur_shaman: { name: 'Briarpelt Shaman', ranged: 'nature', lvl: [25, 26], family: 'humanoid', drops: [['furbolg_charm', 0.35], ['linen_cloth', 0.3]], qdrops: [['thistlefur_totem', 0.5]], aggro: 'The spirits reject you!' },
    bleakheart_satyr: { name: 'Sourheart Satyr', lvl: [26, 27], family: 'demon', drops: [['thieves_coin', 0.45], ['linen_cloth', 0.3]], qdrops: [['satyr_horn', 0.55]], aggro: 'Your soul will make a fine meal.' },
    bleakheart_hellcaller: { name: 'Sourheart Hellcaller', lvl: [27, 28], family: 'demon', drops: [['thieves_coin', 0.5], ['linen_cloth', 0.3]], qdrops: [['fel_orb', 0.45], ['satyr_horn', 0.3]], aggro: 'Burn in gloom fire!' },
    mannoroc_lasher: { name: 'Pit Lasher', lvl: [28, 29], family: 'demon', hpMult: 1.15, drops: [['thieves_coin', 0.5]], qdrops: [['demon_heart', 0.5]] },
    felguard_sentry: { name: 'Pit Guard Sentry', lvl: [29, 30], family: 'demon', hpMult: 1.2, drops: [['thieves_coin', 0.55]], qdrops: [['demon_heart', 0.5]], aggro: 'None pass the hill.' },
    ursal_the_mauler: { name: 'Bruk the Mauler', lvl: [26, 26], family: 'humanoid', named: true, hpMult: 2, dmgMult: 1.3, drops: [['ursal_maul', 0.35], ['furbolg_charm', 1]], qdrops: [['ursal_headdress', 1]], aggro: 'Ursal crush you!' },
    sharptalon: { name: 'Skyrend', lvl: [30, 30], family: 'beast', elite: true, named: true, hpMult: 5.5, dmgMult: 2.6, special: 'hogger', drops: [['ruined_pelt', 1]], qdrops: [['sharptalon_claw', 1]], loot: ['sharptalon_cloak', 'sharptalon_bow', 'sharptalon_band'] },
    // The Tidehollow Deeps
    blackfathom_myrmidon: { name: 'Tidehollow Myrmidon', lvl: [24, 25], family: 'humanoid', drops: [['murloc_eye', 0.3], ['thieves_coin', 0.4]] },
    twilight_acolyte: { name: 'Twilight Acolyte', ranged: 'shadow', lvl: [24, 25], family: 'humanoid', drops: [['linen_cloth', 0.35], ['thieves_coin', 0.4]] },
    aku_mai_snapjaw: { name: "Old Coilmaw Snapjaw", lvl: [25, 26], family: 'beast', hpMult: 1.1, drops: [['ruined_pelt', 0.3]] },
    ghamoo_ra: { name: "Shellmaw", lvl: [25, 25], family: 'beast', boss: true, special: 'slam', loot: ['ghamoo_shell', 'ghamoo_band'] },
    lady_sarevess: { name: 'Lady Szira', lvl: [26, 26], family: 'humanoid', boss: true, special: 'molten', loot: ['sarevess_bow', 'sarevess_gloves'], qdrops: [['sarevess_crown', 1]], aggro: 'You will be food for the deep!' },
    gelihast: { name: 'Glubb', lvl: [26, 26], family: 'murloc', boss: true, loot: ['gelihast_spear', 'gelihast_cloak'] },
    twilight_lord_kelris: { name: 'Eclipse Lord Oreth', lvl: [27, 27], family: 'humanoid', boss: true, special: 'kelris', loot: ['kelris_wand', 'kelris_blade'], qdrops: [['head_kelris', 1]], aggro: 'Who dares disturb my meditation?' },
    aku_mai: { name: "Old Coilmaw", lvl: [27, 27], family: 'beast', boss: true, special: 'whirl', loot: ['akumai_greaves', 'akumai_leggings', 'akumai_staff', 'akumai_blade', 'tidehollow_sash'], qdrops: [['akumai_scale', 1]] },
  });

  // places
  Object.assign(D.PLACES, {
    astranaar: { name: 'Ilvaris', zone: 'Elderglen', region: 'ashenvale', faction: 'alliance', scene: 'astranaar', lvl: [22, 30], safe: true, inn: true, mobs: [], pool: 0, npcs: ['raene', 'shindrell', 'thenysil', 'orendil', 'kimlya', 'aeolynn'], vendor: 'kimlya', gearVendor: 'aeolynn',
      links: { the_zoram_strand: 20, mystral_lake: 16, thistlefur_village: 18, darnassus: 50 }, via: { darnassus: 'Boat to Mistshore' } },
    splintertree_post: { name: 'Stumpwatch', zone: 'Elderglen', region: 'ashenvale', faction: 'horde', scene: 'splintertree_post', lvl: [22, 30], safe: true, inn: true, mobs: [], pool: 0, npcs: ['senani', 'ertog', 'mitsuwa', 'kaylisk', 'burkrum'], vendor: 'kaylisk', gearVendor: 'burkrum',
      links: { satyrnaar: 16, felfire_hill: 16, mystral_lake: 22, crossroads: 40 }, via: { crossroads: 'Road through the Scrublands' } },
    the_zoram_strand: { name: 'The Coral Strand', zone: 'Elderglen', region: 'ashenvale', scene: 'the_zoram_strand', lvl: [22, 24], mobs: [['wrathtail_myrmidon', 5], ['wrathtail_sea_witch', 4]], pool: 10, npcs: [], links: { astranaar: 20, mystral_lake: 20 } },
    mystral_lake: { name: 'Lake Aurel', zone: 'Elderglen', region: 'ashenvale', scene: 'mystral_lake', lvl: [22, 24], mobs: [['ashenvale_bear', 5], ['ghostpaw_runner', 4]], named: { sharptalon: 150 }, pool: 10, npcs: [], links: { astranaar: 16, splintertree_post: 22, the_zoram_strand: 20, the_howling_vale: 18 } },
    thistlefur_village: { name: 'Briarpelt Village', zone: 'Elderglen', region: 'ashenvale', scene: 'thistlefur_village', lvl: [24, 26], mobs: [['thistlefur_ursa', 5], ['thistlefur_shaman', 4]], named: { ursal_the_mauler: 300 }, pool: 10, npcs: [], links: { astranaar: 18, the_howling_vale: 18 } },
    the_howling_vale: { name: 'Grey Wolf Vale', zone: 'Elderglen', region: 'ashenvale', scene: 'the_howling_vale', lvl: [25, 27], mobs: [['ghostpaw_alpha', 5], ['ghostpaw_runner', 3]], pool: 9, npcs: [], links: { mystral_lake: 18, thistlefur_village: 18, satyrnaar: 16 } },
    satyrnaar: { name: 'Hornhold', zone: 'Elderglen', region: 'ashenvale', scene: 'satyrnaar', lvl: [26, 28], mobs: [['bleakheart_satyr', 5], ['bleakheart_hellcaller', 4]], pool: 10, npcs: [], links: { the_howling_vale: 16, splintertree_post: 16 } },
    felfire_hill: { name: 'Gloomfire Hill', zone: 'Elderglen', region: 'ashenvale', scene: 'felfire_hill', lvl: [28, 30], mobs: [['mannoroc_lasher', 5], ['felguard_sentry', 4]], pool: 10, npcs: [], links: { splintertree_post: 16 } },
  });
  D.PLACES.darnassus.links.astranaar = 50; D.PLACES.darnassus.via = Object.assign(D.PLACES.darnassus.via || {}, { astranaar: 'Boat to Mistshore' });
  D.PLACES.crossroads.links.splintertree_post = 40; D.PLACES.crossroads.via = Object.assign(D.PLACES.crossroads.via || {}, { splintertree_post: 'Road north' });

  // people
  Object.assign(D.NPCS, {
    raene: { name: 'Raelis Swift', title: 'Warden Captain' },
    shindrell: { name: 'Syndra Quill', title: 'Huntress' },
    thenysil: { name: 'Warden Oriel', title: 'Ilvaris' },
    orendil: { name: 'Talan Ashgrove', title: 'Druid' },
    kimlya: { name: 'Innkeeper Elsin', title: 'Innkeeper' },
    aeolynn: { name: 'Aelys', title: 'Weaponsmith' },
    senani: { name: 'Sena of the Deep Roots', title: 'Stumpwatch' },
    ertog: { name: 'Hrokk', title: 'Woodcleaver Outrider' },
    mitsuwa: { name: 'Nisha', title: 'Shaman' },
    kaylisk: { name: 'Innkeeper Grelda', title: 'Innkeeper' },
    burkrum: { name: 'Tagga', title: 'Weaponsmith' },
  });

  // quests: Accord (Ilvaris) and Krugar (Stumpwatch) share the wild, not the quests
  const A = (id, q) => { q.faction = 'alliance'; D.QUESTS[id] = q; };
  const H = (id, q) => { q.faction = 'horde'; D.QUESTS[id] = q; };
  A('redridge_ashenvale', { name: 'A Call from the Forest', lvl: 22, giver: 'solomon', turnin: 'raene', text: 'The wood elves of Elderglen ask Kingsmere for help against the Krugar and the demons in their forest. Take the boat from Nyrwen to Mistshore, and ride south to Ilvaris.',
    objs: [{ type: 'visit', place: 'astranaar' }], reward: { money: 800 } });
  H('stonetalon_ashenvale', { name: 'The Woodcleaver Front', lvl: 22, giver: 'mastok', turnin: 'senani', text: 'The Woodcleaver clan cuts timber in Elderglen for the Krugar, and the wood elves kill our loggers for it. Take the road north from Dustfort to Stumpwatch.',
    objs: [{ type: 'visit', place: 'splintertree_post' }], reward: { money: 800 } });
  // shared targets, separate givers
  const both = (key, lvl, name, text, objs, rewardA, rewardH) => {
    A('a_' + key, { name, lvl, giver: rewardA[0], turnin: rewardA[0], text: text[0], objs, reward: rewardA[1] });
    H('h_' + key, { name, lvl, giver: rewardH[0], turnin: rewardH[0], text: text[1], objs, reward: rewardH[1] });
  };
  both('naga', 22, 'The Scalelash', ['Naga have crawled out of the sea onto the Coral Strand. Kill 12 myrmidons.', 'The naga on the Coral Strand raid our supply boats. Kill 12 myrmidons.'],
    [{ type: 'kill', mob: 'wrathtail_myrmidon', n: 12 }], ['thenysil', { choice: ['fam_feet22'] }], ['ertog', { choice: ['fam_feet22'] }]);
  both('sea_witch', 23, 'The Sea Witches', ['Their witches call the tide against us. Kill 8 and bring me 4 pearls.', 'The sea witches drown our scouts. Kill 8 and bring me 4 pearls.'],
    [{ type: 'kill', mob: 'wrathtail_sea_witch', n: 8 }, { type: 'collect', item: 'sea_witch_pearl', n: 4 }], ['raene', { choice: ['fam_wrist22'] }], ['senani', { choice: ['fam_wrist22'] }]);
  both('naga_scales', 23, 'Scalelash Scales', ['The scales make good armour for the sentinels. Bring me 10.', 'Naga scales make fine armour. Bring me 10.'],
    [{ type: 'collect', item: 'naga_scale', n: 10 }], ['aeolynn', { money: 1200 }], ['burkrum', { money: 1200 }]);
  both('bears', 22, 'Bears of Lake Aurel', ['The bears by Lake Aurel have grown savage. Bring me 8 claws.', 'Bears maul our loggers by Lake Aurel. Bring me 8 claws.'],
    [{ type: 'collect', item: 'bear_claw_av', n: 8 }], ['orendil', { money: 1100 }], ['mitsuwa', { money: 1100 }]);
  both('ghostpaw', 23, 'The Mistpaw Pack', ['The Mistpaw wolves hunt too close to town. Kill 10 runners.', 'Mistpaw wolves hunt our patrols. Kill 10 runners.'],
    [{ type: 'kill', mob: 'ghostpaw_runner', n: 10 }], ['shindrell', { choice: ['fam_weapon22'] }], ['ertog', { choice: ['fam_weapon22'] }]);
  both('pelts', 24, 'Mistpaw Pelts', ['Mistpaw pelts are prized in Nyrwen. Bring me 8.', 'Our riders need warm saddles. Bring me 8 Mistpaw pelts.'],
    [{ type: 'collect', item: 'ghostpaw_pelt', n: 8 }], ['kimlya', { money: 1300 }], ['kaylisk', { money: 1300 }]);
  both('thistlefur', 24, 'The Briarpelt', ['The Briarpelt bearkin were our friends once. Something has driven them mad. Kill 12.', 'The Briarpelt bearkin attack anyone near their village. Kill 12.'],
    [{ type: 'kill', mob: 'thistlefur_ursa', n: 12 }], ['orendil', { choice: ['fam_chest23'] }], ['senani', { choice: ['fam_chest23'] }]);
  both('totems', 25, 'Corrupted Totems', ['Their totems carry the corruption. Bring me 8 so I can cleanse them.', 'Their shamans carry totems full of dark power. Bring me 8.'],
    [{ type: 'collect', item: 'thistlefur_totem', n: 8 }], ['orendil', { choice: ['fam_back23'] }], ['mitsuwa', { choice: ['fam_back23'] }]);
  both('ursal', 26, 'Bruk the Mauler', ['The Briarpelt chieftain, Ursal, leads the raids. He is rarely seen. Bring me his headdress.', 'Bruk the Mauler leads the bearkin. He is rarely seen. Bring me his headdress.'],
    [{ type: 'collect', item: 'ursal_headdress', n: 1 }], ['raene', { choice: ['fam_ring_rare30'] }], ['senani', { choice: ['fam_ring_rare30'] }]);
  both('alphas', 26, 'The Alphas', ['The alphas of Grey Wolf Vale lead every pack. Kill 10 and bring me 5 fangs.', 'The alphas lead the packs from Grey Wolf Vale. Kill 10 and bring me 5 fangs.'],
    [{ type: 'kill', mob: 'ghostpaw_alpha', n: 10 }, { type: 'collect', item: 'alpha_fang', n: 5 }], ['shindrell', { choice: ['fam_legs23'] }], ['ertog', { choice: ['fam_legs23'] }]);
  both('satyrs', 27, 'Hornhold', ['Satyrs, the cursed ones, gather at Hornhold. Kill 12.', 'Satyrs lurk in the glade west of the post. Kill 12.'],
    [{ type: 'kill', mob: 'bleakheart_satyr', n: 12 }], ['raene', { choice: ['fam_hands24'] }], ['senani', { choice: ['fam_hands24'] }]);
  both('satyr_horns', 27, 'Sourheart Horns', ['Bring me 10 satyr horns. We will burn them.', 'Bring me 10 satyr horns. The shaman want them for a ward.'],
    [{ type: 'collect', item: 'satyr_horn', n: 10 }], ['thenysil', { money: 1500 }], ['mitsuwa', { money: 1500 }]);
  both('hellcallers', 28, 'The Hellcallers', ['The hellcallers summon demons. Kill 10 and bring me 4 gloom orbs.', 'The hellcallers call demons into the forest. Kill 10 and bring me 4 gloom orbs.'],
    [{ type: 'kill', mob: 'bleakheart_hellcaller', n: 10 }, { type: 'collect', item: 'fel_orb', n: 4 }], ['orendil', { choice: ['fam_waist24'] }], ['mitsuwa', { choice: ['fam_waist24'] }]);
  both('felfire', 29, 'Gloomfire Hill', ['Demons hold Gloomfire Hill. Kill 10 lashers.', 'Demons hold the hill east of the post. Kill 10 lashers.'],
    [{ type: 'kill', mob: 'mannoroc_lasher', n: 10 }], ['raene', { choice: ['fam_chest28'] }], ['senani', { choice: ['fam_chest28'] }]);
  both('felguards', 30, 'The Pit Guard', ['End the demon threat: 8 pit guards and 5 smouldering hearts.', 'Break the demons: 8 pit guards and 5 smouldering hearts.'],
    [{ type: 'kill', mob: 'felguard_sentry', n: 8 }, { type: 'collect', item: 'demon_heart', n: 5 }], ['raene', { choice: ['fam_weapon30'] }], ['ertog', { choice: ['fam_weapon30'] }]);
  both('sharptalon', 30, 'Wanted: Skyrend', ['A great hippogryph, Skyrend, has gone mad over Lake Aurel. Bring me a claw. Take friends.', 'A mad hippogryph, Skyrend, kills our wyvern riders over Lake Aurel. Bring me a claw. Take friends.'],
    [{ type: 'collect', item: 'sharptalon_claw', n: 1 }], ['shindrell', { choice: ['fam_weapon30'] }], ['ertog', { choice: ['fam_weapon30'] }]);
  D.QUESTS.a_sharptalon.group = 3; D.QUESTS.h_sharptalon.group = 3;
  // The Tidehollow Deeps
  A('bfd_kelris', { name: 'The Eclipse Cult', lvl: 27, giver: 'thenysil', turnin: 'thenysil', dungeon: 'blackfathom', text: 'A wood elf traitor, Oreth, leads the Twilight cult in The Tidehollow Deeps, under the Coral Strand. Bring me his head.',
    objs: [{ type: 'collect', item: 'head_kelris', n: 1 }], reward: { choice: ['fam_back_rare30'] } });
  A('bfd_sarevess', { name: 'The Naga Sorceress', lvl: 26, giver: 'raene', turnin: 'raene', dungeon: 'blackfathom', text: 'The naga in the Deeps obey Lady Szira. Bring me her crown.',
    objs: [{ type: 'collect', item: 'sarevess_crown', n: 1 }], reward: { choice: ['fam_weapon27'] } });
  H('bfd_akumai', { name: "The Essence of Old Coilmaw", lvl: 27, giver: 'mitsuwa', turnin: 'mitsuwa', dungeon: 'blackfathom', text: "The cult worships a hydra, Old Coilmaw, in the depths of Tidehollow. Kill it and bring me a scale.",
    objs: [{ type: 'collect', item: 'akumai_scale', n: 1 }], reward: { choice: ['fam_back_rare30'] } });
  H('bfd_kelris_h', { name: 'The Eclipse Cult', lvl: 27, giver: 'senani', turnin: 'senani', dungeon: 'blackfathom', text: 'The Twilight cult in The Tidehollow Deeps plots against the Krugar and the Accord alike. Their leader is Oreth. Bring me his head.',
    objs: [{ type: 'collect', item: 'head_kelris', n: 1 }], reward: { choice: ['fam_weapon27'] } });

  // group finder
  Object.assign(D.DUNGEONS, {
    blackfathom: { music: 'tidehollow', name: 'The Tidehollow Deeps', minLvl: 24, par: 349, trialPar: 390, size: 5, trashMult: { hp: 2.2, dmg: 2.53 }, bossMult: { hp: 10, dmg: 5.52 }, pulls: [
      { scene: 'blackfathom_deeps', label: 'The flooded steps', mobs: ['blackfathom_myrmidon', 'blackfathom_myrmidon'] },
      { scene: 'blackfathom_deeps', label: 'Shellmaw', mobs: ['ghamoo_ra'], boss: true },
      { scene: 'blackfathom_deeps', label: 'Naga ruins', mobs: ['blackfathom_myrmidon', 'aku_mai_snapjaw'] },
      { scene: 'blackfathom_deeps', label: 'Lady Szira', mobs: ['lady_sarevess'], boss: true },
      { scene: 'blackfathom_deeps', label: 'Glubb', mobs: ['gelihast'], boss: true },
      { scene: 'blackfathom_depths', label: 'Twilight shrine', mobs: ['twilight_acolyte', 'twilight_acolyte', 'aku_mai_snapjaw'] },
      { scene: 'blackfathom_depths', label: 'Eclipse Lord Oreth', mobs: ['twilight_lord_kelris'], boss: true },
      { scene: 'blackfathom_depths', label: 'The black pool', mobs: ['aku_mai_snapjaw', 'aku_mai_snapjaw'] },
      { scene: 'blackfathom_depths', label: "Old Coilmaw", mobs: ['aku_mai'], boss: true },
    ] },
  });
  Object.assign(D.ACTIVITIES, {
    blackfathom: { name: 'The Tidehollow Deeps', dungeon: 'blackfathom', where: 'the_zoram_strand', size: 5, minLvl: 24, maxLvl: 28, desc: 'Dungeon under the Coral Strand, Elderglen. 5 players. Both factions.' },
    sharptalon: { name: 'Wanted: Skyrend', where: 'mystral_lake', size: 3, minLvl: 26, maxLvl: 30, desc: 'Open-world elite in Elderglen. 3 players.', boss: 'sharptalon', pulls: [{ scene: 'mystral_lake', label: 'The lake shore', mobs: ['ashenvale_bear', 'ghostpaw_runner'] }, { scene: 'mystral_lake', label: 'The lake shore', mobs: ['ghostpaw_runner', 'ghostpaw_runner'] }, { scene: 'mystral_lake', label: 'Skyrend', mobs: ['sharptalon'], boss: true }] },
  });
})(typeof window !== 'undefined' ? window : globalThis);
