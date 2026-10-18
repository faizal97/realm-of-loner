// Greymead Foothills and Mourncross (with Ashwick Village in Needlewood and Greyhowl Keep): Krugar, levels 24–30 (v4).
// Everything that lives in this zone: its places, creatures, people, quests and the items they drop.
// The Reclaimed of Mourncross wage a quiet war on the human farms; the Black Ledger hold Blackhelm; Cairn's worgen haunt Needlewood.
(function (root) {
  const D = root.D;
  D.zone('hillsbrad', { name: 'Greymead Foothills', faction: 'horde', music: 'greymead', town: 'greymead_town' });
  // quest items
  D.item('farm_deed', { name: 'Greymead Farm Deed', slot: 'quest', q: 1, icon: 'journal' });
  D.item('peasant_scythe', { name: "Farmhand's Scythe", slot: 'quest', q: 1, icon: 'axe' });
  D.item('azurelode_ore', { name: 'Kestrel Ore', slot: 'quest', q: 1, icon: 'dust' });
  D.item('syndicate_missive', { name: 'Black Ledger Missive', slot: 'quest', q: 1, icon: 'journal' });
  D.item('syndicate_badge', { name: 'Black Ledger Badge', slot: 'quest', q: 1, icon: 'coin' });
  D.item('gray_bear_tongue', { name: 'Gray Bear Tongue', slot: 'quest', q: 1, icon: 'meat' });
  D.item('lion_mane', { name: 'Mountain Lion Mane', slot: 'quest', q: 1, icon: 'pelt' });
  D.item('yeti_fur', { name: 'Yeti Fur', slot: 'quest', q: 1, icon: 'pelt' });
  D.item('yeti_horn', { name: 'Ferocious Yeti Horn', slot: 'quest', q: 1, icon: 'tusk' });
  D.item('moonrage_fang', { name: 'Howlmoor Fang', slot: 'quest', q: 1, icon: 'claw' });
  D.item('bonds_hammer', { name: "Foreman Cutts' Hammer", slot: 'quest', q: 1, icon: 'mace' });
  D.item('samras_pelt', { name: "Big Bruin's Pelt", slot: 'quest', q: 1, icon: 'pelt' });
  D.item('arugal_head', { name: 'Head of Cairn', slot: 'quest', q: 1, icon: 'head' });
  D.item('springvale_seal', { name: "Ashdown's Seal", slot: 'quest', q: 1, icon: 'coin' });
  D.item('sfk_journal', { name: "Gravestalker Adamant's Journal", slot: 'quest', q: 1, icon: 'journal' });
  // named and elite drops
  D.item('bonds_band', { name: "Foreman's Ring", slot: 'finger', q: 3, lvl: 27, stats: { str: 6, sta: 6 }, icon: 'ring', sell: 3000, source: 'Foreman Cutts, Kestrel Mine' });
  D.item('samras_hide', { name: 'Grizzled Hide Vest', slot: 'chest', atype: 'leather', q: 3, lvl: 30, armor: 150, stats: { agi: 11, sta: 9 }, icon: 'chest_leather', sell: 4200 });
  D.item('samras_claw', { name: 'Claw of Big Bruin', slot: 'weapon', wtype: 'dagger', q: 3, lvl: 30, dmg: [24, 44], speed: 1.8, stats: { agi: 9, sta: 5 }, icon: 'dagger', sell: 4200 });
  D.item('samras_mantle', { name: 'Bearskin Mantle', slot: 'back', q: 3, lvl: 30, armor: 44, stats: { sta: 8, str: 6 }, icon: 'cloak', sell: 3900 });
  // Greyhowl Keep drops (levels 26-30)
  D.item('rethilgore_bracers', { name: "Jailer's Bracers", slot: 'wrist', atype: 'mail', q: 3, lvl: 27, armor: 102, stats: { str: 6, sta: 6 }, icon: 'bracers', sell: 3000 });
  D.item('butcher_cleaver', { name: "Butcher's Cleaver", slot: 'weapon', wtype: 'axe', q: 3, lvl: 27, dmg: [35, 58], speed: 2.6, stats: { str: 9, sta: 5 }, icon: 'axe', sell: 3400 });
  D.item('butcher_apron', { name: "Butcher's Apron", slot: 'chest', atype: 'cloth', q: 3, lvl: 27, armor: 60, stats: { sta: 9, spi: 7 }, sp: 10, icon: 'chest_cloth', sell: 3200 });
  D.item('silverlaine_rapier', { name: "Ashcroft's Rapier", slot: 'weapon', wtype: 'sword', q: 3, lvl: 28, dmg: [26, 48], speed: 1.9, stats: { agi: 9, sta: 5 }, icon: 'sword', sell: 3600 });
  D.item('silverlaine_gloves', { name: "Baron's Gloves", slot: 'hands', atype: 'leather', q: 3, lvl: 28, armor: 64, stats: { agi: 7, sta: 6 }, icon: 'gloves', sell: 3200 });
  D.item('springvale_hammer', { name: "Commander's Warhammer", slot: 'weapon', wtype: 'mace', q: 3, lvl: 28, dmg: [37, 60], speed: 2.7, stats: { str: 10, int: 5 }, sp: 8, icon: 'mace', sell: 3600 });
  D.item('springvale_boots', { name: 'Boots of the Fallen Order', slot: 'feet', atype: 'mail', q: 3, lvl: 28, armor: 135, stats: { str: 7, sta: 7 }, icon: 'boots', sell: 3300 });
  D.item('fenrus_pelt', { name: 'Pelt of Grimwolf', slot: 'back', q: 3, lvl: 29, armor: 46, stats: { agi: 8, sta: 6 }, icon: 'cloak', sell: 3500 });
  D.item('fenrus_fang', { name: 'Fang of the Dream-Eater', slot: 'finger', q: 3, lvl: 29, stats: { str: 7, agi: 6 }, icon: 'ring', sell: 3500 });
  D.item('arugal_staff', { name: "Cairn's Staff", slot: 'weapon', wtype: 'staff', q: 3, lvl: 30, dmg: [50, 76], speed: 3, stats: { int: 13, spi: 9 }, sp: 20, icon: 'staff', sell: 4500 });
  D.item('arugal_robe', { name: 'Robe of the Moccasin', slot: 'chest', atype: 'cloth', q: 3, lvl: 30, armor: 66, stats: { int: 12, sta: 8 }, sp: 14, icon: 'chest_cloth', sell: 4400 });
  D.item('arugal_leggings', { name: 'Werewolf Hunter Leggings', slot: 'legs', atype: 'leather', q: 3, lvl: 30, armor: 124, stats: { agi: 12, sta: 8 }, icon: 'legs', sell: 4400 });
  D.item('arugal_plate', { name: 'Greyhowl Mail', slot: 'chest', atype: 'mail', q: 3, lvl: 30, armor: 270, stats: { str: 12, sta: 10 }, icon: 'chest_mail', sell: 4600 });

  // creatures
  Object.assign(D.MOBS, {
    hillsbrad_farmer: { name: 'Greymead Farmer', lvl: [24, 25], family: 'humanoid', drops: [['linen_cloth', 0.3], ['thieves_coin', 0.35]], qdrops: [['farm_deed', 0.3]], aggro: 'Get off my land, monster!' },
    hillsbrad_peasant: { name: 'Greymead Farmhand', lvl: [25, 26], family: 'humanoid', drops: [['linen_cloth', 0.3], ['thieves_coin', 0.35]], qdrops: [['peasant_scythe', 0.5], ['farm_deed', 0.2]], aggro: 'For Greymead!' },
    hillsbrad_miner: { name: 'Greymead Miner', lvl: [25, 26], family: 'humanoid', drops: [['linen_cloth', 0.3], ['thieves_coin', 0.35]], qdrops: [['azurelode_ore', 0.55]], aggro: 'Back off, this is our mine!' },
    syndicate_rogue: { name: 'Black Ledger Rogue', lvl: [26, 27], family: 'humanoid', drops: [['linen_cloth', 0.3], ['thieves_coin', 0.5]], qdrops: [['syndicate_badge', 0.5]], aggro: 'Nobody leaves Blackhelm alive.' },
    syndicate_mercenary: { name: 'Black Ledger Mercenary', lvl: [27, 28], family: 'humanoid', hpMult: 1.15, drops: [['linen_cloth', 0.3], ['thieves_coin', 0.5]], qdrops: [['syndicate_badge', 0.4], ['syndicate_missive', 0.2]], aggro: 'The Black Ledger pays well for Krugar heads.' },
    gray_bear: { name: 'Gray Bear', lvl: [26, 27], family: 'beast', hpMult: 1.1, drops: [['ruined_pelt', 0.4]], qdrops: [['gray_bear_tongue', 0.55]] },
    mountain_lion: { name: 'Mountain Lion', lvl: [27, 28], family: 'beast', drops: [['ruined_pelt', 0.4]], qdrops: [['lion_mane', 0.55]] },
    cave_yeti: { name: 'Cave Yeti', lvl: [28, 29], family: 'yeti', hpMult: 1.1, drops: [['ruined_pelt', 0.4]], qdrops: [['yeti_fur', 0.55]] },
    ferocious_yeti: { name: 'Ferocious Yeti', lvl: [29, 30], family: 'yeti', hpMult: 1.2, drops: [['ruined_pelt', 0.4]], qdrops: [['yeti_horn', 0.5], ['yeti_fur', 0.3]] },
    moonrage_worgen: { name: 'Howlmoor Werewolf', lvl: [24, 26], family: 'humanoid', drops: [['linen_cloth', 0.3], ['thieves_coin', 0.3]], qdrops: [['moonrage_fang', 0.55]], aggro: "Cairn's children hunt tonight!" },
    foreman_bonds: { name: 'Foreman Cutts', lvl: [27, 27], family: 'humanoid', named: true, hpMult: 2, dmgMult: 1.3, drops: [['bonds_band', 0.35], ['thieves_coin', 1]], qdrops: [['bonds_hammer', 1]], aggro: 'This mine stays human!' },
    big_samras: { name: 'Big Bruin', lvl: [30, 30], family: 'beast', elite: true, named: true, hpMult: 5.5, dmgMult: 2.6, special: 'hogger', drops: [['ruined_pelt', 1]], qdrops: [['samras_pelt', 1]], loot: ['samras_hide', 'samras_claw', 'samras_mantle'] },
    // Greyhowl Keep
    shadowfang_moonwalker: { name: 'Greyhowl Moonwalker', lvl: [26, 27], family: 'humanoid', drops: [['linen_cloth', 0.3], ['thieves_coin', 0.4]] },
    shadowfang_darksoul: { name: 'Greyhowl Darksoul', lvl: [26, 27], family: 'humanoid', drops: [['linen_cloth', 0.35], ['thieves_coin', 0.4]], qdrops: [['sfk_journal', 0.15]] },
    haunted_servitor: { name: 'Haunted Servitor', lvl: [27, 28], family: 'undead', drops: [['thieves_coin', 0.4]] },
    rethilgore: { name: 'Rotjaw', lvl: [27, 27], family: 'humanoid', boss: true, special: 'slam', loot: ['rethilgore_bracers', 'butcher_apron'], aggro: 'About time someone killed the wizard.' },
    razorclaw: { name: 'Cleaver the Butcher', lvl: [27, 27], family: 'humanoid', boss: true, special: 'slam', loot: ['butcher_cleaver', 'butcher_apron'], aggro: 'Fresh meat for the kitchens!' },
    baron_silverlaine: { name: 'Baron Ashcroft', lvl: [28, 28], family: 'undead', boss: true, loot: ['silverlaine_rapier', 'silverlaine_gloves'], aggro: 'Leave my halls at once!' },
    commander_springvale: { name: 'Commander Ashdown', lvl: [28, 28], family: 'undead', boss: true, special: 'cook', healName: 'Unholy Light', specialText: 'Commander Ashdown calls on unholy light!', loot: ['springvale_hammer', 'springvale_boots'], qdrops: [['springvale_seal', 1]], aggro: 'Countless more will fall before my eyes!' },
    fenrus: { name: 'Grimwolf the Dream-Eater', lvl: [28, 28], family: 'beast', boss: true, loot: ['fenrus_pelt', 'fenrus_fang'] },
    arugal: { name: 'Archmage Cairn', lvl: [28, 28], family: 'humanoid', boss: true, special: 'arugal', loot: ['arugal_staff', 'arugal_robe', 'arugal_leggings', 'arugal_plate'], qdrops: [['arugal_head', 1]], aggro: 'You, too, shall serve!' },
  });

  // places
  Object.assign(D.PLACES, {
    tarren_mill: { name: 'Mourncross', zone: 'Greymead Foothills', region: 'hillsbrad', scene: 'tarren_mill', lvl: [24, 30], safe: true, inn: true, mobs: [], pool: 0, npcs: ['darthalia', 'lydon', 'krusk', 'dalar', 'marla', 'dogran'], vendor: 'marla', gearVendor: 'dogran',
      links: { hillsbrad_fields: 16, durnholde_keep: 18, alterac_foothills: 16, pyrewood_village: 30, undercity: 45 }, via: { undercity: 'Bat Rider' } },
    hillsbrad_fields: { name: 'Greymead Fields', zone: 'Greymead Foothills', region: 'hillsbrad', scene: 'hillsbrad_fields', lvl: [24, 26], mobs: [['hillsbrad_farmer', 5], ['hillsbrad_peasant', 4]], pool: 10, npcs: [], links: { tarren_mill: 16, azurelode_mine: 16, durnholde_keep: 18 } },
    azurelode_mine: { name: 'Kestrel Mine', zone: 'Greymead Foothills', region: 'hillsbrad', scene: 'azurelode_mine', lvl: [25, 27], mobs: [['hillsbrad_miner', 7]], named: { foreman_bonds: 300 }, pool: 9, npcs: [], links: { hillsbrad_fields: 16 } },
    durnholde_keep: { name: 'Blackhelm Keep', zone: 'Greymead Foothills', region: 'hillsbrad', scene: 'durnholde_keep', lvl: [26, 28], mobs: [['syndicate_rogue', 5], ['syndicate_mercenary', 4]], pool: 10, npcs: [], links: { tarren_mill: 18, hillsbrad_fields: 18 } },
    alterac_foothills: { name: 'Vaskar Foothills', zone: 'Greymead Foothills', region: 'hillsbrad', scene: 'alterac_foothills', lvl: [26, 28], mobs: [['gray_bear', 5], ['mountain_lion', 4]], named: { big_samras: 150 }, pool: 10, npcs: [], links: { tarren_mill: 16, growless_cave: 16 } },
    growless_cave: { name: 'Frostmouth Cave', zone: 'Greymead Foothills', region: 'hillsbrad', scene: 'growless_cave', lvl: [28, 30], mobs: [['cave_yeti', 5], ['ferocious_yeti', 4]], pool: 10, npcs: [], links: { alterac_foothills: 16 } },
    pyrewood_village: { name: 'Ashwick Village', zone: 'Needlewood', region: 'hillsbrad', scene: 'pyrewood_village', lvl: [24, 26], mobs: [['moonrage_worgen', 8]], pool: 9, npcs: [], links: { tarren_mill: 30, brill: 35 } },
  });
  D.PLACES.undercity.links.tarren_mill = 45; D.PLACES.undercity.via = Object.assign(D.PLACES.undercity.via || {}, { tarren_mill: 'Bat Rider' });
  D.PLACES.brill.links.pyrewood_village = 35;

  // people
  Object.assign(D.NPCS, {
    darthalia: { name: 'High Executor Mordane', title: 'Mourncross' },
    lydon: { name: 'Apothecary Crail', title: 'Royal Apothecary Guild' },
    krusk: { name: 'Grol', title: 'Grunt' },
    dalar: { name: 'Dalen Mourne', title: 'Arcanist' },
    marla: { name: 'Innkeeper Wilma', title: 'Innkeeper' },
    dogran: { name: 'Ushar', title: 'Weaponsmith' },
  });

  // quests (levels 24–30)
  Object.assign(D.QUESTS, {
    undercity_tarren: { name: 'Mourncross', lvl: 24, giver: 'mastok', turnin: 'darthalia', text: 'The Pale Queen needs soldiers in the Greymead Foothills. Take the wyvern rider to Dustfort, then the bat from the Gravenhold, and report to High Executor Mordane in Mourncross.',
      objs: [{ type: 'visit', place: 'tarren_mill' }], reward: { money: 800 } },
    farmers: { name: 'The Greymead Farms', lvl: 24, giver: 'darthalia', turnin: 'darthalia', text: 'The farms feed the Accord army. Kill 12 farmers.',
      objs: [{ type: 'kill', mob: 'hillsbrad_farmer', n: 12 }], reward: { choice: ['fam_feet27'] } },
    farm_deeds: { name: 'Deeds of the Land', lvl: 24, giver: 'lydon', turnin: 'lydon', text: 'Every deed we take is land they cannot claim. Bring me 5.',
      objs: [{ type: 'collect', item: 'farm_deed', n: 5 }], reward: { money: 1300 } },
    farmhands: { name: 'The Farmhands', lvl: 25, giver: 'darthalia', turnin: 'darthalia', pre: ['farmers'], text: 'Now the farmhands. Kill 10 and bring me 5 of their scythes.',
      objs: [{ type: 'kill', mob: 'hillsbrad_peasant', n: 10 }, { type: 'collect', item: 'peasant_scythe', n: 5 }], reward: { choice: ['fam_wrist27'] } },
    azurelode_ore_q: { name: 'Kestrel Ore', lvl: 25, giver: 'dogran', turnin: 'dogran', text: 'The human miners dig good ore at Kestrel. It should be ours. Bring me 8.',
      objs: [{ type: 'collect', item: 'azurelode_ore', n: 8 }], reward: { choice: ['fam_weapon27'] } },
    miners: { name: 'Close the Mine', lvl: 26, giver: 'krusk', turnin: 'krusk', pre: ['azurelode_ore_q'], text: 'Kill 12 miners and the mine is ours.',
      objs: [{ type: 'kill', mob: 'hillsbrad_miner', n: 12 }], reward: { money: 1400 } },
    foreman_bonds_q: { name: 'Foreman Cutts', lvl: 27, giver: 'krusk', turnin: 'krusk', text: 'The mine foreman, Cutts, hides deep in Kestrel. He is rarely seen. Bring me his hammer.',
      objs: [{ type: 'collect', item: 'bonds_hammer', n: 1 }], reward: { choice: ['fam_ring_rare30'] } },
    durnholde_scout: { name: 'Blackhelm Keep', lvl: 26, giver: 'darthalia', turnin: 'darthalia', text: 'The Black Ledger have taken Blackhelm Keep south of the fields. Find out how many.',
      objs: [{ type: 'visit', place: 'durnholde_keep' }], reward: { money: 900 } },
    syndicate_rogues: { name: 'The Black Ledger', lvl: 26, giver: 'darthalia', turnin: 'darthalia', pre: ['durnholde_scout'], text: 'The Black Ledger rob our caravans. Kill 12 rogues.',
      objs: [{ type: 'kill', mob: 'syndicate_rogue', n: 12 }], reward: { choice: ['fam_chest28'] } },
    syndicate_badges: { name: 'Black Ledger Badges', lvl: 27, giver: 'lydon', turnin: 'lydon', pre: ['durnholde_scout'], text: 'I want to know which noble houses pay them. Bring me 10 badges.',
      objs: [{ type: 'collect', item: 'syndicate_badge', n: 10 }], reward: { money: 1500 } },
    mercenaries: { name: 'Mercenaries', lvl: 28, giver: 'krusk', turnin: 'krusk', pre: ['syndicate_rogues'], text: 'The mercenaries are the real fighters. Kill 10.',
      objs: [{ type: 'kill', mob: 'syndicate_mercenary', n: 10 }], reward: { choice: ['fam_legs28'] } },
    syndicate_missives: { name: 'The Missives', lvl: 28, giver: 'darthalia', turnin: 'darthalia', text: 'The Black Ledger send orders between their camps. Bring me 3 missives.',
      objs: [{ type: 'collect', item: 'syndicate_missive', n: 3 }], reward: { money: 1600 } },
    bear_tongues: { name: 'Gray Bear Tongues', lvl: 26, giver: 'lydon', turnin: 'lydon', text: 'The Apothecary Guild needs bear tongues for a new plague. Bring me 8. Do not ask.',
      objs: [{ type: 'collect', item: 'gray_bear_tongue', n: 8 }], reward: { choice: ['fam_back28'] } },
    lion_manes: { name: 'Mountain Lions', lvl: 27, giver: 'krusk', turnin: 'krusk', text: 'The lions stalk our patrols in the foothills. Kill 10 and bring me 5 manes.',
      objs: [{ type: 'kill', mob: 'mountain_lion', n: 10 }, { type: 'collect', item: 'lion_mane', n: 5 }], reward: { choice: ['fam_hands29'] } },
    bear_cull: { name: 'Bears in the Hills', lvl: 27, giver: 'krusk', turnin: 'krusk', pre: ['bear_tongues'], text: 'Too many bears on the patrol road. Kill 10.',
      objs: [{ type: 'kill', mob: 'gray_bear', n: 10 }], reward: { money: 1500 } },
    growless_scout: { name: 'Frostmouth Cave', lvl: 28, giver: 'lydon', turnin: 'lydon', text: 'Yetis live in Frostmouth Cave above the foothills. Their fur resists our plagues. Go and look.',
      objs: [{ type: 'visit', place: 'growless_cave' }], reward: { money: 1000 } },
    yeti_fur_q: { name: 'Yeti Fur', lvl: 29, giver: 'lydon', turnin: 'lydon', pre: ['growless_scout'], text: 'Bring me 8 bundles of yeti fur. I must learn why the plague does not take them.',
      objs: [{ type: 'collect', item: 'yeti_fur', n: 8 }], reward: { choice: ['fam_waist29'] } },
    cave_yetis: { name: 'The Cave Yetis', lvl: 29, giver: 'krusk', turnin: 'krusk', pre: ['growless_scout'], text: 'The yetis come down to raid our supply lines. Kill 12.',
      objs: [{ type: 'kill', mob: 'cave_yeti', n: 12 }], reward: { money: 1700 } },
    ferocious_yetis: { name: 'The Ferocious Ones', lvl: 30, giver: 'krusk', turnin: 'krusk', pre: ['cave_yetis'], text: 'The biggest yetis lead the raids. Kill 10 and bring me 5 horns.',
      objs: [{ type: 'kill', mob: 'ferocious_yeti', n: 10 }, { type: 'collect', item: 'yeti_horn', n: 5 }], reward: { choice: ['fam_weapon30'] } },
    pyrewood_scout: { name: 'Ashwick Village', lvl: 24, giver: 'dalar', turnin: 'dalar', text: 'West of here, in Needlewood, Ashwick Village turns to werewolves every night. The curse comes from Greyhowl Keep above it. Go and look.',
      objs: [{ type: 'visit', place: 'pyrewood_village' }], reward: { money: 800 } },
    moonrage: { name: 'The Howlmoor', lvl: 25, giver: 'dalar', turnin: 'dalar', pre: ['pyrewood_scout'], text: 'The Howlmoor werewolves guard the road to the keep. Kill 12 and bring me 6 fangs.',
      objs: [{ type: 'kill', mob: 'moonrage_worgen', n: 12 }, { type: 'collect', item: 'moonrage_fang', n: 6 }], reward: { choice: ['fam_back28'] } },
    farm_patrol: { name: 'Burn the Fields', lvl: 25, giver: 'lydon', turnin: 'lydon', pre: ['farmhands'], text: 'Keep the farms from recovering: 8 farmers and 6 farmhands.',
      objs: [{ type: 'kill', mob: 'hillsbrad_farmer', n: 8 }, { type: 'kill', mob: 'hillsbrad_peasant', n: 6 }], reward: { money: 1400 } },
    durnholde_patrol: { name: 'Keep Blackhelm Busy', lvl: 28, giver: 'darthalia', turnin: 'darthalia', pre: ['mercenaries'], text: 'Hold the Black Ledger in their keep: 8 rogues and 6 mercenaries.',
      objs: [{ type: 'kill', mob: 'syndicate_rogue', n: 8 }, { type: 'kill', mob: 'syndicate_mercenary', n: 6 }], reward: { choice: ['fam_feet27'] } },
    foothills_patrol: { name: 'The Foothills Road', lvl: 28, giver: 'krusk', turnin: 'krusk', pre: ['lion_manes'], text: 'Clear the road again: 8 bears and 6 lions.',
      objs: [{ type: 'kill', mob: 'gray_bear', n: 8 }, { type: 'kill', mob: 'mountain_lion', n: 6 }], reward: { money: 1700 } },
    yeti_patrol: { name: 'Snow and Blood', lvl: 30, giver: 'lydon', turnin: 'lydon', pre: ['yeti_fur_q'], text: 'One more push into the cave: 8 cave yetis.',
      objs: [{ type: 'kill', mob: 'cave_yeti', n: 8 }], reward: { choice: ['fam_hands29'] } },
    mine_patrol: { name: 'Hold the Mine', lvl: 27, giver: 'dogran', turnin: 'dogran', pre: ['miners'], text: 'The humans keep sending new miners. Kill 10 more.',
      objs: [{ type: 'kill', mob: 'hillsbrad_miner', n: 10 }], reward: { choice: ['fam_waist29'] } },
    moonrage_patrol: { name: 'The Road to the Keep', lvl: 26, giver: 'dalar', turnin: 'dalar', pre: ['moonrage'], text: 'Keep the Howlmoor off the road while we plan the assault. Kill 10 more.',
      objs: [{ type: 'kill', mob: 'moonrage_worgen', n: 10 }], reward: { money: 1400 } },
    wanted_samras: { name: 'Wanted: Big Bruin', lvl: 30, giver: 'krusk', turnin: 'krusk', group: 3, text: 'A grizzled old bear called Big Bruin has killed six of my grunts in the foothills. Bring me its pelt. Take friends.',
      objs: [{ type: 'collect', item: 'samras_pelt', n: 1 }], reward: { choice: ['fam_weapon30'] } },
    // Greyhowl Keep
    arugal_must_die: { name: 'Cairn Must Die', lvl: 29, giver: 'dalar', turnin: 'dalar', dungeon: 'shadowfang', text: 'The archmage Cairn made the werewolves of Needlewood, and he rules them from Greyhowl Keep. End him and bring me his head.',
      objs: [{ type: 'collect', item: 'arugal_head', n: 1 }], reward: { choice: ['fam_back_rare30'] } },
    springvale_q: { name: 'The Fallen Commander', lvl: 28, giver: 'darthalia', turnin: 'darthalia', dungeon: 'shadowfang', text: 'Commander Ashdown led the keep\'s defenders. Now he serves Cairn in death. Bring me his seal.',
      objs: [{ type: 'collect', item: 'springvale_seal', n: 1 }], reward: { choice: ['fam_weapon30'] } },
    deathstalker_journal: { name: 'The Lost Gravestalker', lvl: 27, giver: 'lydon', turnin: 'lydon', dungeon: 'shadowfang', text: 'One of our gravestalkers went into the keep and never came back. Her journal must be on one of the darksouls. Bring it to me.',
      objs: [{ type: 'collect', item: 'sfk_journal', n: 1 }], reward: { money: 2000 } },
  });

  // group finder: Greyhowl Keep and the open-world elite
  Object.assign(D.DUNGEONS, {
    shadowfang: { music: 'greyhowl_keep', name: 'Greyhowl Keep', minLvl: 26, par: 398, trialPar: 480, size: 5, trashMult: { hp: 2.2, dmg: 2.2 }, bossMult: { hp: 10, dmg: 4.8 }, pulls: [
      { scene: 'shadowfang_courtyard', label: 'The courtyard', mobs: ['shadowfang_moonwalker', 'shadowfang_darksoul'] },
      { scene: 'shadowfang_courtyard', label: 'Rotjaw', mobs: ['rethilgore'], boss: true },
      { scene: 'shadowfang_courtyard', label: 'The stables', mobs: ['shadowfang_moonwalker', 'shadowfang_moonwalker', 'haunted_servitor'] },
      { scene: 'shadowfang_hall', label: 'Cleaver the Butcher', mobs: ['razorclaw'], boss: true },
      { scene: 'shadowfang_hall', label: 'The dining hall', mobs: ['haunted_servitor', 'shadowfang_darksoul'] },
      { scene: 'shadowfang_hall', label: 'Baron Ashcroft', mobs: ['baron_silverlaine'], boss: true },
      { scene: 'shadowfang_hall', label: 'Commander Ashdown', mobs: ['commander_springvale'], boss: true },
      { scene: 'shadowfang_courtyard', label: 'The ramparts', mobs: ['shadowfang_darksoul', 'shadowfang_moonwalker'] },
      { scene: 'shadowfang_courtyard', label: 'Grimwolf the Dream-Eater', mobs: ['fenrus'], boss: true },
      { scene: 'shadowfang_hall', label: 'Archmage Cairn', mobs: ['arugal'], boss: true },
    ] },
  });
  Object.assign(D.ACTIVITIES, {
    shadowfang: { name: 'Greyhowl Keep', dungeon: 'shadowfang', where: 'pyrewood_village', size: 5, minLvl: 26, maxLvl: 30, desc: 'Dungeon above Ashwick Village, Needlewood. 5 players.' },
    big_samras: { name: 'Wanted: Big Bruin', where: 'alterac_foothills', size: 3, minLvl: 27, maxLvl: 30, desc: 'Open-world elite in Greymead. 3 players.', boss: 'big_samras', pulls: [{ scene: 'alterac_foothills', label: 'Bear dens', mobs: ['gray_bear', 'gray_bear'] }, { scene: 'alterac_foothills', label: 'Bear dens', mobs: ['mountain_lion', 'gray_bear'] }, { scene: 'alterac_foothills', label: 'Big Bruin', mobs: ['big_samras'], boss: true }] },
  });
})(typeof window !== 'undefined' ? window : globalThis);
