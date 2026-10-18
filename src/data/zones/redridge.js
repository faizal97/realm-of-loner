// Stoneharrow Mountains and Longbridge (with Kingsmere Gaol in Kingsmere): Accord, levels 18–25 (v3).
// Everything that lives in this zone: its places, creatures, people, quests and the items they drop.
// Gnolls raid the farms, the Cinderpeak orcs hold Watcher's Keep, and black dragon whelps circle Dunmore Valley.
(function (root) {
  const D = root.D;
  D.zone('redridge', { name: 'Stoneharrow Mountains', faction: 'alliance', music: 'stoneharrow', town: 'stoneharrow_town' });
  // quest items
  D.item('goretusk_flank', { name: 'Great Razorhog Flank', slot: 'quest', q: 1, icon: 'meat' });
  D.item('tarantula_silk', { name: 'Tarantula Silk', slot: 'quest', q: 1, icon: 'venom' });
  D.item('gnoll_paw', { name: 'Stoneharrow Gnoll Paw', slot: 'quest', q: 1, icon: 'claw' });
  D.item('poacher_bow', { name: "Poacher's Bowstring", slot: 'quest', q: 1, icon: 'bow' });
  D.item('mystic_totem', { name: 'Mystic Bone Charm', slot: 'quest', q: 1, icon: 'voodoo_doll' });
  D.item('rr_murloc_fin', { name: 'Flesheater Fin', slot: 'quest', q: 1, icon: 'fin' });
  D.item('tidecaller_pearl', { name: 'Tidecaller Pearl', slot: 'quest', q: 1, icon: 'ring' });
  D.item('blackrock_medallion', { name: 'Cinderpeak Medallion', slot: 'quest', q: 1, icon: 'coin' });
  D.item('blackrock_orders', { name: 'Cinderpeak Battle Orders', slot: 'quest', q: 1, icon: 'journal' });
  D.item('summoner_tome', { name: "Summoner's Tome", slot: 'quest', q: 1, icon: 'journal' });
  D.item('whelp_scale', { name: 'Black Whelp Scale', slot: 'quest', q: 1, icon: 'chest_box' });
  D.item('shadowhide_pendant', { name: 'Tarfur Pendant', slot: 'quest', q: 1, icon: 'ring' });
  D.item('gathilzogg_head', { name: "Head of Uzbrak", slot: 'quest', q: 1, icon: 'head' });
  D.item('ribchaser_necklace', { name: "Bonegnaw's Bone Necklace", slot: 'quest', q: 1, icon: 'claw' });
  D.item('squiddic_tentacle', { name: "Gulpfin's Tentacle", slot: 'quest', q: 1, icon: 'fin' });
  D.item('bellygrub_tusk', { name: "Lardhide's Tusk", slot: 'quest', q: 1, icon: 'tusk' });
  D.item('head_targorr', { name: 'Head of Ulgrak', slot: 'quest', q: 1, icon: 'head' });
  D.item('head_bazil', { name: 'Head of Silas Crane', slot: 'quest', q: 1, icon: 'head' });
  D.item('head_kam', { name: 'Head of Kalf Brandsson', slot: 'quest', q: 1, icon: 'head' });
  D.item('riot_ledger', { name: 'Riot Ringleader Ledger', slot: 'quest', q: 1, icon: 'journal' });
  // named and elite drops
  D.item('ribchaser_cleaver', { name: "Bonegnaw's Cleaver", slot: 'weapon', wtype: 'axe', q: 3, lvl: 21, dmg: [27, 45], speed: 2.5, stats: { str: 7, agi: 4 }, icon: 'axe', sell: 2300, source: 'Bonegnaw, the Stoneharrow Canyons' });
  D.item('squiddic_staff', { name: 'Tidecaller Staff', slot: 'weapon', wtype: 'staff', q: 3, lvl: 21, dmg: [34, 52], speed: 3, stats: { int: 9, spi: 6 }, sp: 14, icon: 'staff', sell: 2300, source: 'Gulpfin, Lake Calder' });
  D.item('bellygrub_hide', { name: 'Lardhide Hide Vest', slot: 'chest', atype: 'leather', q: 3, lvl: 25, armor: 128, stats: { agi: 9, sta: 8 }, icon: 'chest_leather', sell: 3100 });
  D.item('bellygrub_belt', { name: "Swine Herder's Belt", slot: 'waist', atype: 'mail', q: 3, lvl: 25, armor: 118, stats: { str: 8, sta: 6 }, icon: 'belt', sell: 2800 });
  D.item('bellygrub_charm', { name: 'Truffle Charm', slot: 'finger', q: 3, lvl: 25, stats: { int: 7, sta: 5 }, icon: 'ring', sell: 2800 });
  // Kingsmere Gaol drops (levels 23-26)
  D.item('iron_knuckles', { name: 'Iron Knuckles', slot: 'hands', atype: 'mail', q: 3, lvl: 24, armor: 120, stats: { str: 7, sta: 5 }, icon: 'gloves', sell: 2600 });
  D.item('bruegal_belt', { name: "Hugo's Brawler Belt", slot: 'waist', atype: 'leather', q: 3, lvl: 24, armor: 58, stats: { agi: 7, sta: 5 }, icon: 'belt', sell: 2600 });
  D.item('targorr_axe', { name: "Ulgrak's Rusted Axe", slot: 'weapon', wtype: 'axe', q: 3, lvl: 24, dmg: [31, 51], speed: 2.6, stats: { str: 8, sta: 5 }, icon: 'axe', sell: 2900 });
  D.item('targorr_shackle', { name: 'Broken Shackle Band', slot: 'wrist', atype: 'mail', q: 3, lvl: 24, armor: 90, stats: { sta: 7, str: 4 }, icon: 'bracers', sell: 2400 });
  D.item('kam_hammer', { name: "Kam's Forge Hammer", slot: 'weapon', wtype: 'mace', q: 3, lvl: 25, dmg: [33, 53], speed: 2.7, stats: { str: 9, sta: 5 }, icon: 'mace', sell: 3000 });
  D.item('kam_bracers', { name: 'Brandsson Bracers', slot: 'wrist', atype: 'leather', q: 3, lvl: 25, armor: 45, stats: { agi: 6, sta: 5 }, icon: 'bracers', sell: 2500 });
  D.item('hamhock_leggings', { name: "Porkchop's Prison Leggings", slot: 'legs', atype: 'cloth', q: 3, lvl: 25, armor: 45, stats: { sta: 8, int: 6 }, sp: 10, icon: 'legs', sell: 2800 });
  D.item('hamhock_club', { name: 'Ogre Cell Club', slot: 'weapon', wtype: 'staff', q: 3, lvl: 25, dmg: [45, 70], speed: 3.3, stats: { str: 10, sta: 8 }, icon: 'staff', sell: 3000 });
  D.item('dextren_cleaver', { name: "Dexter's Cleaver", slot: 'weapon', wtype: 'dagger', q: 3, lvl: 25, dmg: [20, 36], speed: 1.8, stats: { agi: 8, sta: 4 }, icon: 'dagger', sell: 3000 });
  D.item('dextren_boots', { name: 'Blood-Stained Boots', slot: 'feet', atype: 'leather', q: 3, lvl: 25, armor: 72, stats: { agi: 6, sta: 6 }, icon: 'boots', sell: 2600 });
  D.item('thredd_mask', { name: "Crane's Riot Mask", slot: 'chest', atype: 'leather', q: 3, lvl: 26, armor: 132, stats: { agi: 10, sta: 7 }, icon: 'chest_leather', sell: 3300, look: ['chest', 'defias_armor'] });
  D.item('thredd_blade', { name: 'Ringleader\'s Shiv', slot: 'weapon', wtype: 'dagger', q: 3, lvl: 26, dmg: [21, 38], speed: 1.8, stats: { agi: 9 }, icon: 'dagger', sell: 3300 });
  D.item('thredd_robe', { name: "Warden's Stolen Robe", slot: 'chest', atype: 'cloth', q: 3, lvl: 26, armor: 58, stats: { int: 10, spi: 7 }, sp: 12, icon: 'chest_cloth', sell: 3300 });
  D.item('thredd_cape', { name: 'Cape of the Riot', slot: 'back', q: 3, lvl: 26, armor: 40, stats: { sta: 7, str: 5 }, icon: 'cloak', sell: 3000 });

  // creatures
  Object.assign(D.MOBS, {
    redridge_mongrel: { name: 'Stoneharrow Mongrel', lvl: [18, 19], family: 'humanoid', drops: [['gnoll_mane', 0.35], ['linen_cloth', 0.3]], qdrops: [['gnoll_paw', 0.5]], aggro: 'Yip! Yip! Kill!' },
    redridge_poacher: { name: 'Stoneharrow Poacher', lvl: [19, 20], family: 'humanoid', drops: [['gnoll_mane', 0.35], ['linen_cloth', 0.3]], qdrops: [['poacher_bow', 0.5], ['gnoll_paw', 0.35]], aggro: 'More meat for the pot!' },
    redridge_brute: { name: 'Stoneharrow Brute', lvl: [20, 21], family: 'humanoid', hpMult: 1.15, drops: [['gnoll_mane', 0.4], ['linen_cloth', 0.3]], qdrops: [['gnoll_paw', 0.4]], aggro: 'Brute smash you!' },
    redridge_mystic: { name: 'Stoneharrow Mystic', ranged: 'nature', lvl: [20, 21], family: 'humanoid', drops: [['gnoll_mane', 0.35], ['linen_cloth', 0.3]], qdrops: [['mystic_totem', 0.5]], aggro: 'The bones say you die!' },
    shadowhide_warrior: { name: 'Tarfur Warrior', lvl: [22, 23], family: 'humanoid', hpMult: 1.1, drops: [['gnoll_mane', 0.4], ['linen_cloth', 0.3]], qdrops: [['shadowhide_pendant', 0.5]], aggro: 'Tarfur rule these hills!' },
    shadowhide_darkweaver: { name: 'Tarfur Darkweaver', lvl: [23, 24], family: 'humanoid', drops: [['gnoll_mane', 0.35], ['linen_cloth', 0.3]], qdrops: [['shadowhide_pendant', 0.5]], aggro: 'Darkness takes you!' },
    murloc_flesheater: { name: 'Mireling Flesheater', lvl: [19, 20], family: 'humanoid', drops: [['murloc_eye', 0.4]], qdrops: [['rr_murloc_fin', 0.55]], aggro: 'Mrglglglgl!' },
    murloc_tidecaller: { name: 'Mireling Tidecaller', lvl: [20, 21], family: 'humanoid', drops: [['murloc_eye', 0.4]], qdrops: [['tidecaller_pearl', 0.45], ['rr_murloc_fin', 0.3]], aggro: 'Mrrgll! Mrrrgll!' },
    tarantula: { name: 'Tarantula', lvl: [18, 19], family: 'beast', drops: [['ruined_pelt', 0.25]], qdrops: [['tarantula_silk', 0.55]] },
    great_goretusk: { name: 'Great Razorhog', lvl: [18, 19], family: 'beast', hpMult: 1.1, drops: [['ruined_pelt', 0.4]], qdrops: [['goretusk_flank', 0.55]] },
    blackrock_outrunner: { name: 'Cinderpeak Outrunner', lvl: [21, 22], family: 'humanoid', drops: [['thieves_coin', 0.45], ['linen_cloth', 0.3]], qdrops: [['blackrock_medallion', 0.5]], aggro: 'For the Cinderpeak!' },
    blackrock_renegade: { name: 'Cinderpeak Renegade', lvl: [22, 23], family: 'humanoid', hpMult: 1.1, drops: [['thieves_coin', 0.5], ['linen_cloth', 0.3]], qdrops: [['blackrock_medallion', 0.5], ['blackrock_orders', 0.2]], aggro: 'Your kingdom will burn!' },
    blackrock_champion: { name: 'Cinderpeak Champion', lvl: [23, 24], family: 'humanoid', hpMult: 1.2, drops: [['thieves_coin', 0.5], ['linen_cloth', 0.3]], qdrops: [['blackrock_medallion', 0.5], ['blackrock_orders', 0.3]], aggro: 'Blood and dust!' },
    blackrock_summoner: { name: 'Cinderpeak Summoner', lvl: [24, 25], family: 'humanoid', drops: [['thieves_coin', 0.5], ['linen_cloth', 0.35]], qdrops: [['summoner_tome', 0.45]], aggro: 'The fire answers me!' },
    black_dragon_whelp: { name: 'Black Dragon Whelp', fly: 7, lvl: [22, 23], family: 'dragonkin', drops: [['ruined_pelt', 0.2]], qdrops: [['whelp_scale', 0.55]] },
    gathilzogg: { name: "Uzbrak", lvl: [25, 25], family: 'humanoid', named: true, hpMult: 2.2, dmgMult: 1.35, drops: [['thieves_coin', 1]], qdrops: [['gathilzogg_head', 1]], aggro: 'Watcher\'s Keep is ours! Stoneharrow will follow!' },
    ribchaser: { name: 'Bonegnaw', lvl: [21, 21], family: 'humanoid', named: true, hpMult: 2, dmgMult: 1.3, drops: [['ribchaser_cleaver', 0.35], ['gnoll_mane', 1]], qdrops: [['ribchaser_necklace', 1]], aggro: 'Bonegnaw gnaws your bones!' },
    squiddic: { name: 'Gulpfin', lvl: [21, 21], family: 'humanoid', named: true, hpMult: 2, dmgMult: 1.3, drops: [['squiddic_staff', 0.35], ['murloc_eye', 1]], qdrops: [['squiddic_tentacle', 1]], aggro: 'Mrrrrgl! MRRRGLE!' },
    bellygrub: { name: 'Lardhide', lvl: [25, 25], family: 'beast', elite: true, named: true, hpMult: 5.5, dmgMult: 2.6, special: 'hogger', drops: [['ruined_pelt', 1]], qdrops: [['bellygrub_tusk', 1]], loot: ['bellygrub_hide', 'bellygrub_belt', 'bellygrub_charm'] },
    // Kingsmere Gaol
    defias_convict: { name: 'Grey Hood Convict', lvl: [22, 23], family: 'humanoid', drops: [['thieves_coin', 0.4], ['linen_cloth', 0.3]] },
    defias_inmate: { name: 'Grey Hood Inmate', lvl: [22, 23], family: 'humanoid', drops: [['thieves_coin', 0.4], ['linen_cloth', 0.3]], qdrops: [['riot_ledger', 0.2]] },
    defias_insurgent: { name: 'Grey Hood Insurgent', lvl: [23, 24], family: 'humanoid', drops: [['thieves_coin', 0.45], ['linen_cloth', 0.3]], qdrops: [['riot_ledger', 0.25]] },
    defias_captive: { name: 'Grey Hood Captive', lvl: [23, 24], family: 'humanoid', drops: [['thieves_coin', 0.45], ['linen_cloth', 0.3]] },
    targorr: { name: 'Ulgrak the Butcher', lvl: [23, 23], family: 'humanoid', boss: true, special: 'slam', loot: ['targorr_axe', 'targorr_shackle'], qdrops: [['head_targorr', 1]], aggro: 'Free at last! And you will be the first to die!' },
    kam_deepfury: { name: 'Kalf Brandsson', lvl: [24, 24], family: 'humanoid', boss: true, special: 'molten', loot: ['kam_hammer', 'kam_bracers'], qdrops: [['head_kam', 1]], aggro: 'I have waited years for this!' },
    hamhock: { name: 'Porkchop', lvl: [24, 24], family: 'giant', boss: true, special: 'slam', buster: { style: 'heavy', name: 'Belly Flop', text: 'Porkchop rears back for a belly flop!' }, loot: ['hamhock_leggings', 'hamhock_club'], aggro: 'Porkchop hungry!' },
    dextren_ward: { name: 'Dexter Crowe', lvl: [24, 24], family: 'humanoid', boss: true, loot: ['dextren_cleaver', 'dextren_boots'], aggro: 'Another one for my collection.' },
    bruegal_ironknuckle: { name: 'Hugo Knuckles', lvl: [24, 24], family: 'humanoid', boss: true, loot: ['iron_knuckles', 'bruegal_belt'], aggro: 'Put up yer fists!' },
    bazil_thredd: { name: 'Silas Crane', lvl: [25, 25], family: 'humanoid', boss: true, special: 'thredd', loot: ['thredd_mask', 'thredd_blade', 'thredd_robe', 'thredd_cape'], qdrops: [['head_bazil', 1]], aggro: 'Blackwell will have your head for this!' },
  });

  // places
  Object.assign(D.PLACES, {
    three_corners: { name: 'Hob\'s Fork', zone: 'Stoneharrow Mountains', region: 'redridge', scene: 'three_corners', lvl: [18, 20], mobs: [['great_goretusk', 5], ['tarantula', 4]], named: { bellygrub: 150 }, pool: 10, npcs: [], links: { crystal_lake: 28, lakeshire: 18, redridge_canyons: 18 } },
    lakeshire: { name: 'Longbridge', zone: 'Stoneharrow Mountains', region: 'redridge', scene: 'lakeshire', lvl: [18, 25], safe: true, inn: true, mobs: [], pool: 0, npcs: ['solomon', 'marris', 'oslow', 'darcy', 'brianna', 'verner'], vendor: 'brianna', gearVendor: 'verner',
      links: { three_corners: 18, lake_everstill: 12, althers_mill: 18, renders_valley: 22, galardell_valley: 20, stormwind_gate: 45 }, via: { stormwind_gate: 'Gryphon' } },
    lake_everstill: { name: 'Lake Calder', zone: 'Stoneharrow Mountains', region: 'redridge', scene: 'lake_everstill', lvl: [19, 21], mobs: [['murloc_flesheater', 5], ['murloc_tidecaller', 4]], named: { squiddic: 300 }, pool: 10, npcs: [], links: { lakeshire: 12, stonewatch_keep: 20 } },
    redridge_canyons: { name: 'Stoneharrow Canyons', zone: 'Stoneharrow Mountains', region: 'redridge', scene: 'redridge_canyons', lvl: [19, 21], mobs: [['redridge_mongrel', 5], ['redridge_poacher', 4]], named: { ribchaser: 300 }, pool: 10, npcs: [], links: { three_corners: 18, althers_mill: 16 } },
    althers_mill: { name: "Pike's Mill", zone: 'Stoneharrow Mountains', region: 'redridge', scene: 'althers_mill', lvl: [20, 22], mobs: [['redridge_brute', 5], ['redridge_mystic', 4]], pool: 10, npcs: [], links: { lakeshire: 18, redridge_canyons: 16 } },
    renders_valley: { name: "Scorched Valley", zone: 'Stoneharrow Mountains', region: 'redridge', scene: 'renders_valley', lvl: [21, 23], mobs: [['blackrock_outrunner', 5], ['blackrock_renegade', 4]], pool: 10, npcs: [], links: { lakeshire: 22, stonewatch_keep: 18 } },
    stonewatch_keep: { name: 'Watcher\'s Keep', zone: 'Stoneharrow Mountains', region: 'redridge', scene: 'stonewatch_keep', lvl: [23, 25], mobs: [['blackrock_champion', 5], ['blackrock_summoner', 4]], named: { gathilzogg: 180 }, pool: 10, npcs: [], links: { renders_valley: 18, lake_everstill: 20, galardell_valley: 18 } },
    galardell_valley: { name: 'Dunmore Valley', zone: 'Stoneharrow Mountains', region: 'redridge', scene: 'galardell_valley', lvl: [22, 24], mobs: [['shadowhide_warrior', 4], ['shadowhide_darkweaver', 3], ['black_dragon_whelp', 3]], pool: 10, npcs: [], links: { lakeshire: 20, stonewatch_keep: 18 } },
  });
  D.PLACES.crystal_lake.links.three_corners = 28;
  D.PLACES.stormwind_gate.links.lakeshire = 45; D.PLACES.stormwind_gate.via = Object.assign(D.PLACES.stormwind_gate.via || {}, { lakeshire: 'Gryphon' });
  D.PLACES.stormwind.npcs.push('thelwater');

  // people
  Object.assign(D.NPCS, {
    solomon: { name: 'Magistrate Aldren', title: 'Magistrate of Longbridge' },
    marris: { name: 'Marshal Corwin', title: 'Stoneharrow Watch' },
    oslow: { name: 'Foreman Gant', title: 'Bridge Foreman' },
    darcy: { name: 'Maisie Cobb', title: 'Longbridge Cook' },
    brianna: { name: 'Innkeeper Agnes', title: 'Innkeeper' },
    verner: { name: 'Hob Tarrant', title: 'Blacksmith' },
    thelwater: { name: 'Warden Pryce', title: 'Warden of Kingsmere Gaol' },
  });

  // quests (levels 18–25)
  Object.assign(D.QUESTS, {
    westfall_redridge: { name: 'To Stoneharrow', lvl: 18, giver: 'gryan', turnin: 'solomon', text: 'Magistrate Aldren of Longbridge begs Kingsmere for help against the orcs, and Kingsmere sends nobody. Go east past Stillwater Lake to Stoneharrow.',
      objs: [{ type: 'visit', place: 'lakeshire' }], reward: { money: 600 } },
    goretusk_flanks: { name: 'Stoneharrow Goulash', lvl: 18, giver: 'darcy', turnin: 'darcy', text: 'My goulash feeds half the town. The great razorhogs at Hob\'s Fork give the best meat. Bring me 8 flanks.',
      objs: [{ type: 'collect', item: 'goretusk_flank', n: 8 }], reward: { choice: ['fam_feet22'] } },
    tarantula_silk_q: { name: 'Silk for the Bridge', lvl: 18, giver: 'oslow', turnin: 'oslow', text: 'Tarantula silk makes the strongest rope I know, and the bridge needs rope. Bring me 8 lengths.',
      objs: [{ type: 'collect', item: 'tarantula_silk', n: 8 }], reward: { money: 900 } },
    mongrels: { name: 'The Gnoll Menace', lvl: 19, giver: 'marris', turnin: 'marris', text: 'Gnolls come down from the canyons every night. Kill 12 mongrels.',
      objs: [{ type: 'kill', mob: 'redridge_mongrel', n: 12 }], reward: { choice: ['fam_wrist22'] } },
    rr_gnoll_paws: { name: 'Paws for Proof', lvl: 19, giver: 'solomon', turnin: 'solomon', text: 'The town pays a bounty on gnolls. Bring me 10 paws.',
      objs: [{ type: 'collect', item: 'gnoll_paw', n: 10 }], reward: { money: 1000 } },
    rr_poachers: { name: 'Poachers', lvl: 20, giver: 'marris', turnin: 'marris', pre: ['mongrels'], text: 'The poachers are killing every deer in the hills. Kill 10 and bring me 5 bowstrings.',
      objs: [{ type: 'kill', mob: 'redridge_poacher', n: 10 }, { type: 'collect', item: 'poacher_bow', n: 5 }], reward: { choice: ['fam_weapon22'] } },
    murloc_fins: { name: 'Mirelings in the Lake', lvl: 19, giver: 'oslow', turnin: 'oslow', text: 'Mirelings keep dragging my workers off the bridge. Bring me 10 fins.',
      objs: [{ type: 'collect', item: 'rr_murloc_fin', n: 10 }], reward: { choice: ['fam_back23'] } },
    tidecallers: { name: 'The Tidecallers', lvl: 20, giver: 'solomon', turnin: 'solomon', pre: ['murloc_fins'], text: 'The mireling tidecallers stir up storms on the lake. Kill 10.',
      objs: [{ type: 'kill', mob: 'murloc_tidecaller', n: 10 }], reward: { money: 1100 } },
    tidecaller_pearls: { name: 'Pearls of Calder', lvl: 20, giver: 'darcy', turnin: 'darcy', text: 'They say the tidecallers keep pearls from the lake bed. I would love a necklace. Bring me 5.',
      objs: [{ type: 'collect', item: 'tidecaller_pearl', n: 5 }], reward: { choice: ['fam_hands24'] } },
    althers_mill_scout: { name: "Pike's Mill", lvl: 20, giver: 'oslow', turnin: 'oslow', text: 'Our timber came from Pike\'s Mill until the gnolls took it. Go and look.',
      objs: [{ type: 'visit', place: 'althers_mill' }], reward: { money: 700 } },
    brutes: { name: 'Take Back the Mill', lvl: 21, giver: 'oslow', turnin: 'oslow', pre: ['althers_mill_scout'], text: 'The brutes guard the mill. Kill 12 and my lumbermen can go back to work.',
      objs: [{ type: 'kill', mob: 'redridge_brute', n: 12 }], reward: { choice: ['fam_legs23'] } },
    mystic_charms: { name: 'Bone Charms', lvl: 21, giver: 'solomon', turnin: 'solomon', text: 'The gnoll mystics carry charms that drive the others mad. Bring me 8 so I can see what magic they use.',
      objs: [{ type: 'collect', item: 'mystic_totem', n: 8 }], reward: { money: 1100 } },
    ribchaser_q: { name: 'Bonegnaw', lvl: 21, giver: 'marris', turnin: 'marris', text: 'A gnoll called Bonegnaw leads the worst raids from the canyons. He is rarely seen. Bring me his bone necklace.',
      objs: [{ type: 'collect', item: 'ribchaser_necklace', n: 1 }], reward: { choice: ['fam_ring_rare25'] } },
    squiddic_q: { name: 'Gulpfin', lvl: 21, giver: 'oslow', turnin: 'oslow', text: 'Something with tentacles leads the mirelings on Lake Calder. The workers call it Gulpfin. Bring me a tentacle.',
      objs: [{ type: 'collect', item: 'squiddic_tentacle', n: 1 }], reward: { money: 1400 } },
    renders_scout: { name: "Scorched Valley", lvl: 21, giver: 'marris', turnin: 'marris', text: 'The Cinderpeak orcs camp in the valley under Scorched Rock. Scout it and come back.',
      objs: [{ type: 'visit', place: 'renders_valley' }], reward: { money: 800 } },
    outrunners: { name: 'The Outrunners', lvl: 22, giver: 'marris', turnin: 'marris', pre: ['renders_scout'], text: 'Their scouts watch every road into Longbridge. Kill 12 outrunners.',
      objs: [{ type: 'kill', mob: 'blackrock_outrunner', n: 12 }], reward: { choice: ['fam_chest23'] } },
    blackrock_medallions: { name: 'Cinderpeak Medallions', lvl: 22, giver: 'solomon', turnin: 'solomon', pre: ['renders_scout'], text: 'Every Cinderpeak orc wears their clan medallion. Bring me 10 and I will send them to Kingsmere as proof.',
      objs: [{ type: 'collect', item: 'blackrock_medallion', n: 10 }], reward: { money: 1200 } },
    renegades: { name: 'The Renegades', lvl: 23, giver: 'marris', turnin: 'marris', pre: ['outrunners'], text: 'The renegades raid our farms. Kill 10.',
      objs: [{ type: 'kill', mob: 'blackrock_renegade', n: 10 }], reward: { choice: ['fam_waist24'] } },
    blackrock_orders_q: { name: 'Battle Orders', lvl: 23, giver: 'solomon', turnin: 'solomon', text: 'The orcs are planning something. Their officers carry battle orders. Bring me 3.',
      objs: [{ type: 'collect', item: 'blackrock_orders', n: 3 }], reward: { choice: ['fam_back23'] } },
    galardell_scout: { name: 'Dunmore Valley', lvl: 22, giver: 'darcy', turnin: 'darcy', text: 'My brother went hunting in Dunmore Valley and saw small black dragons. Nobody believes him. Would you look?',
      objs: [{ type: 'visit', place: 'galardell_valley' }], reward: { money: 800 } },
    whelp_scales: { name: 'Black Dragon Whelps', lvl: 23, giver: 'solomon', turnin: 'solomon', pre: ['galardell_scout'], text: 'Black dragons, here? Bring me 8 whelp scales. Kingsmere must hear of this.',
      objs: [{ type: 'collect', item: 'whelp_scale', n: 8 }], reward: { choice: ['fam_hands24'] } },
    shadowhide: { name: 'The Tarfur', lvl: 23, giver: 'marris', turnin: 'marris', pre: ['galardell_scout'], text: 'Black-furred gnolls in Dunmore serve the orcs. Kill 10 Tarfur warriors and 6 darkweavers.',
      objs: [{ type: 'kill', mob: 'shadowhide_warrior', n: 10 }, { type: 'kill', mob: 'shadowhide_darkweaver', n: 6 }], reward: { choice: ['fam_weapon25'] } },
    shadowhide_pendants: { name: 'Tarfur Pendants', lvl: 23, giver: 'darcy', turnin: 'darcy', text: 'The Tarfur wear pendants carved with a dragon. Bring me 8 and I will show my brother he was right.',
      objs: [{ type: 'collect', item: 'shadowhide_pendant', n: 8 }], reward: { money: 1300 } },
    stonewatch_scout: { name: 'Watcher\'s Keep', lvl: 23, giver: 'solomon', turnin: 'solomon', pre: ['blackrock_orders_q'], text: 'The orders name Watcher\'s Keep, our old fortress, as their base. Scout it.',
      objs: [{ type: 'visit', place: 'stonewatch_keep' }], reward: { money: 900 } },
    champions: { name: 'Cinderpeak Champions', lvl: 24, giver: 'marris', turnin: 'marris', pre: ['stonewatch_scout'], text: 'Their champions hold the walls of Watcher\'s Keep. Kill 10.',
      objs: [{ type: 'kill', mob: 'blackrock_champion', n: 10 }], reward: { choice: ['fam_chest23'] } },
    summoner_tomes: { name: 'The Summoners', lvl: 24, giver: 'solomon', turnin: 'solomon', pre: ['stonewatch_scout'], text: 'The summoners call fire down on the town. Kill 8 and bring me 4 of their tomes.',
      objs: [{ type: 'kill', mob: 'blackrock_summoner', n: 8 }, { type: 'collect', item: 'summoner_tome', n: 4 }], reward: { choice: ['fam_legs23'] } },
    gathilzogg_q: { name: "Uzbrak", lvl: 25, giver: 'solomon', turnin: 'solomon', pre: ['champions'], text: "The warlord Uzbrak leads the Cinderpeak from the keep. End him and bring me his head.",
      objs: [{ type: 'collect', item: 'gathilzogg_head', n: 1 }], reward: { choice: ['fam_back_rare25'] } },
    wanted_bellygrub: { name: 'Wanted: Lardhide', lvl: 25, giver: 'darcy', turnin: 'darcy', group: 3, text: 'There is a boar at Hob\'s Fork as big as a cart. Lardhide, the farmers call it. It has eaten three of our pigs and one farmer. Bring me its tusk. Take friends.',
      objs: [{ type: 'collect', item: 'bellygrub_tusk', n: 1 }], reward: { choice: ['fam_weapon25'] } },
    tarantula_hunt: { name: 'Eight Legs Too Many', lvl: 18, giver: 'oslow', turnin: 'oslow', pre: ['tarantula_silk_q'], text: 'Now that I have rope, I want the spiders gone from the road. Kill 10 tarantulas.',
      objs: [{ type: 'kill', mob: 'tarantula', n: 10 }], reward: { money: 950 } },
    goretusk_cull: { name: 'The Razorhog Herd', lvl: 19, giver: 'darcy', turnin: 'darcy', pre: ['goretusk_flanks'], text: 'The razorhogs trample the farms at Hob\'s Fork. Kill 10 and I will cook you something special.',
      objs: [{ type: 'kill', mob: 'great_goretusk', n: 10 }], reward: { money: 1000 } },
    bridge_workers: { name: 'Protect the Workers', lvl: 20, giver: 'oslow', turnin: 'oslow', pre: ['murloc_fins'], text: 'The flesheaters still wait under the bridge. Kill 10 of them.',
      objs: [{ type: 'kill', mob: 'murloc_flesheater', n: 10 }], reward: { choice: ['fam_waist24'] } },
    gnoll_mystics: { name: 'Silence the Mystics', lvl: 21, giver: 'marris', turnin: 'marris', pre: ['mongrels'], text: 'The mystics whip the other gnolls into a frenzy. Kill 10.',
      objs: [{ type: 'kill', mob: 'redridge_mystic', n: 10 }], reward: { money: 1150 } },
    whelp_hunt: { name: 'Whelps of the Black Brood', lvl: 23, giver: 'marris', turnin: 'marris', pre: ['whelp_scales'], text: 'If there are whelps, there are eggs, and there is a mother. Start with the whelps. Kill 10.',
      objs: [{ type: 'kill', mob: 'black_dragon_whelp', n: 10 }], reward: { choice: ['fam_feet22'] } },
    keep_patrol: { name: 'Hold the Walls', lvl: 24, giver: 'solomon', turnin: 'solomon', pre: ['champions'], text: 'Keep Watcher\'s Keep under pressure while we gather the watch: 8 champions and 6 summoners.',
      objs: [{ type: 'kill', mob: 'blackrock_champion', n: 8 }, { type: 'kill', mob: 'blackrock_summoner', n: 6 }], reward: { money: 1500 } },
    // Kingsmere Gaol (Kingsmere)
    stockade_riot: { name: 'Riot in the Gaol', lvl: 24, giver: 'thelwater', turnin: 'thelwater', dungeon: 'stockade', text: 'The prisoners in Kingsmere Gaol have taken the cell blocks. Their ringleader is Silas Crane of the Grey Hood. Bring me his head.',
      objs: [{ type: 'collect', item: 'head_bazil', n: 1 }], reward: { choice: ['fam_back_rare25'] } },
    targorr_q: { name: 'Ulgrak the Butcher', lvl: 23, giver: 'thelwater', turnin: 'thelwater', dungeon: 'stockade', text: 'An orc called Ulgrak butchered a village before we caught him. He is loose in the cell blocks. End him.',
      objs: [{ type: 'collect', item: 'head_targorr', n: 1 }], reward: { choice: ['fam_weapon25'] } },
    kam_q: { name: 'Kalf Brandsson', lvl: 24, giver: 'marris', turnin: 'marris', dungeon: 'stockade', text: 'The dwarf Kalf Brandsson sold our patrol routes to the Cinderpeak. He sits in Kingsmere Gaol. Now he has broken out of his cell. Bring me his head.',
      objs: [{ type: 'collect', item: 'head_kam', n: 1 }], reward: { choice: ['fam_hands24'] } },
    riot_ledgers: { name: 'The Riot Ledger', lvl: 24, giver: 'thelwater', turnin: 'thelwater', dungeon: 'stockade', text: 'Someone smuggled weapons in to start this riot. The insurgents keep a ledger. Bring it to me.',
      objs: [{ type: 'collect', item: 'riot_ledger', n: 1 }], reward: { money: 1500 } },
  });

  // group finder: Kingsmere Gaol and the open-world elite
  Object.assign(D.DUNGEONS, {
    stockade: { music: 'kingsmere_gaol', name: 'Kingsmere Gaol', minLvl: 22, par: 418, trialPar: 480, size: 5, trashMult: { hp: 2.2, dmg: 1.76 }, bossMult: { hp: 10, dmg: 3.84 }, trial: { trashMult: { hp: 2.2, dmg: 2.2 }, bossMult: { hp: 10, dmg: 4.8 } }, /* damage lowered to the dungeon target (#215: a fitted player wiped in 18-49% of runs, target 5-15%); Trials keep the numbers they were tuned on */ pulls: [
      { scene: 'the_stockade', label: 'Cell block', mobs: ['defias_convict', 'defias_inmate'] },
      { scene: 'the_stockade', label: 'Cell block', mobs: ['defias_insurgent', 'defias_convict'] },
      { scene: 'the_stockade', label: 'Ulgrak the Butcher', mobs: ['targorr'], boss: true },
      { scene: 'the_stockade', label: 'Kalf Brandsson', mobs: ['kam_deepfury'], boss: true },
      { scene: 'the_stockade', label: 'Riot barricade', mobs: ['defias_insurgent', 'defias_insurgent', 'defias_captive'] },
      { scene: 'the_stockade', label: 'Porkchop', mobs: ['hamhock'], boss: true },
      { scene: 'stockade_depths', label: 'The drain', mobs: ['defias_captive', 'defias_convict'] },
      { scene: 'stockade_depths', label: 'Hugo Knuckles', mobs: ['bruegal_ironknuckle'], boss: true },
      { scene: 'stockade_depths', label: 'Dexter Crowe', mobs: ['dextren_ward', 'defias_inmate'], boss: true },
      { scene: 'stockade_depths', label: 'Silas Crane', mobs: ['bazil_thredd'], boss: true },
    ] },
  });
  Object.assign(D.ACTIVITIES, {
    stockade: { name: 'Kingsmere Gaol', dungeon: 'stockade', where: 'stormwind', size: 5, minLvl: 22, maxLvl: 25, desc: 'Dungeon in Kingsmere. 5 players.' },
    bellygrub: { name: 'Wanted: Lardhide', where: 'three_corners', size: 3, minLvl: 22, maxLvl: 25, desc: 'Open-world elite in Stoneharrow. 3 players.', boss: 'bellygrub', pulls: [{ scene: 'three_corners', label: 'Razorhog herd', mobs: ['great_goretusk', 'great_goretusk'] }, { scene: 'three_corners', label: 'Razorhog herd', mobs: ['great_goretusk', 'tarantula'] }, { scene: 'three_corners', label: 'Lardhide', mobs: ['bellygrub'], boss: true }] },
  });
})(typeof window !== 'undefined' ? window : globalThis);
