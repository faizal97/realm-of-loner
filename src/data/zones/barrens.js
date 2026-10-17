// The Scrublands and Dustfort: Krugar, levels 10–16.
// Everything that lives in this zone: its places, creatures, people, quests and the items they drop.
// Links to other zones sit on the places themselves (place.links / place.via).
(function (root) {
  const D = root.D;
  D.zone('barrens', { name: 'The Scrublands', faction: 'horde', music: 'scrublands', town: 'scrublands_town' });
  // items
  D.item('zhevra_hoof', { name: 'Stripeback Hoof', slot: 'quest', q: 1, icon: 'claw' });
  D.item('lashtail_claw', { name: 'Lashtail Raptor Claw', slot: 'quest', q: 1, icon: 'claw' });
  D.item('razormane_tusk', { name: 'Snoutspike Tusk', slot: 'quest', q: 1, icon: 'quilboar_tusk' });
  D.item('snapjaw_shell', { name: 'Snapjaw Shell Fragment', slot: 'quest', q: 1, icon: 'chest_box' });
  D.item('swiftmane_hoof', { name: "Quickhoof's Hoof", slot: 'quest', q: 1, icon: 'claw' });
  D.item('kolkar_whip', { name: 'Galloran Whip', slot: 'quest', q: 1, icon: 'belt' });
  D.item('swiftmane_boots', { name: 'Quickhoof Striders', slot: 'feet', q: 3, lvl: 14, armor: 42, stats: { agi: 5, sta: 3 }, icon: 'boots', sell: 900, source: 'Quickhoof, the Silent Pools' });
  D.item('kodobane_axe', { name: "Herdbreaker's Axe", slot: 'weapon', wtype: 'axe', q: 3, lvl: 15, dmg: [19, 30], speed: 2.5, stats: { str: 5, agi: 3 }, icon: 'axe', sell: 1300, source: 'Rhaz the Herdbreaker, the Sourwater Oasis' });
  D.item('storm_charm', { name: 'Galloran Storm Charm', slot: 'quest', q: 1, icon: 'voodoo_doll' });
  D.item('stormsnout_hide', { name: 'Boomsnout Hide', slot: 'quest', q: 1, icon: 'pelt' });
  D.item('lizard_steak', { name: 'Thunder Lizard Steak', slot: 'quest', q: 1, icon: 'meat' });

  // creatures
  Object.assign(D.MOBS, {
    kolkar_drudge: { name: 'Galloran Drudge', lvl: [10, 11], family: 'humanoid', drops: [['linen_cloth', 0.35], ['ruined_pelt', 0.25]], aggro: 'The Galloran will crush you!' },
    kolkar_wrangler: { name: 'Galloran Wrangler', lvl: [12, 13], family: 'humanoid', drops: [['linen_cloth', 0.35], ['thieves_coin', 0.35]], qdrops: [['kolkar_whip', 0.5]], aggro: 'Another beast for the herd!' },
    barak_kodobane: { name: 'Rhaz the Herdbreaker', lvl: [15, 15], family: 'humanoid', named: true, hpMult: 2, dmgMult: 1.3, drops: [['kodobane_axe', 0.35], ['thieves_coin', 1]], aggro: 'The plains belong to the Galloran!' },
    zhevra_runner: { name: 'Stripeback Runner', lvl: [10, 11], family: 'beast', drops: [['ruined_pelt', 0.4]], qdrops: [['zhevra_hoof', 0.55]] },
    swiftmane: { name: 'Quickhoof', lvl: [14, 14], family: 'beast', named: true, hpMult: 1.9, dmgMult: 1.25, drops: [['swiftmane_boots', 0.35], ['ruined_pelt', 1]], qdrops: [['swiftmane_hoof', 1]] },
    savannah_prowler: { name: 'Savannah Prowler', lvl: [12, 13], family: 'beast', drops: [['ruined_pelt', 0.4], ['wolf_fang', 0.3]] },
    sunscale_lashtail: { name: 'Dustscale Lashtail', lvl: [11, 12], family: 'beast', drops: [['ruined_pelt', 0.35]], qdrops: [['lashtail_claw', 0.55]] },
    oasis_snapjaw: { name: 'Oasis Snapjaw', lvl: [13, 14], family: 'beast', hpMult: 1.2, drops: [['ruined_pelt', 0.3]], qdrops: [['snapjaw_shell', 0.55]] },
    razormane_quilboar: { name: 'Snoutspike Spinehide', lvl: [11, 12], family: 'humanoid', drops: [['quilboar_tusk', 0.35], ['linen_cloth', 0.3]], qdrops: [['razormane_tusk', 0.5]], aggro: 'Snoutspike! Kill!' },
    razormane_thornweaver: { name: 'Snoutspike Thornweaver', lvl: [13, 14], family: 'humanoid', drops: [['quilboar_tusk', 0.35], ['linen_cloth', 0.35]], qdrops: [['razormane_tusk', 0.5]], aggro: 'The thorns hunger!' },
    kolkar_stormer: { name: 'Galloran Stormer', lvl: [14, 15], family: 'humanoid', drops: [['linen_cloth', 0.4], ['thieves_coin', 0.35]], qdrops: [['storm_charm', 0.55]], aggro: 'The storm answers the Galloran!' },
    stormsnout: { name: 'Boomsnout', lvl: [14, 15], family: 'beast', hpMult: 1.2, drops: [['ruined_pelt', 0.4]], qdrops: [['stormsnout_hide', 0.5], ['lizard_steak', 0.55]] },
  });

  // places
  Object.assign(D.PLACES, {
    far_watch: { name: 'Hollow Tower', zone: 'The Scrublands', region: 'barrens', scene: 'far_watch', lvl: [10, 12], mobs: [['kolkar_drudge', 4], ['zhevra_runner', 4], ['razormane_quilboar', 3]], pool: 10, npcs: ['kargal'], links: { sludge_fen: 18, razor_hill: 25, crossroads: 20, razormane_grounds: 16 } },
    crossroads: { name: 'Dustfort', zone: 'The Scrublands', region: 'barrens', scene: 'crossroads', lvl: [10, 15], safe: true, inn: true, mobs: [], pool: 0, npcs: ['thork', 'sergra', 'helbrim', 'zargh', 'boorand', 'nargal'], vendor: 'boorand', gearVendor: 'nargal', links: { sludge_fen: 20, lushwater_oasis: 20, baeldun_digsite: 24, far_watch: 20, forgotten_pools: 16, stagnant_oasis: 20, razormane_grounds: 18, bloodhoof_village: 35, orgrimmar: 40, thunder_bluff: 40, thorn_hill: 22 }, via: { orgrimmar: 'Wind rider', thunder_bluff: 'Wind rider' } },
    forgotten_pools: { name: 'The Silent Pools', zone: 'The Scrublands', region: 'barrens', scene: 'forgotten_pools', lvl: [11, 13], mobs: [['sunscale_lashtail', 5], ['zhevra_runner', 3], ['savannah_prowler', 3]], named: { swiftmane: 300 }, pool: 10, npcs: [], links: { crossroads: 16 } },
    stagnant_oasis: { name: 'The Sourwater Oasis', zone: 'The Scrublands', region: 'barrens', scene: 'stagnant_oasis', lvl: [12, 15], mobs: [['kolkar_wrangler', 5], ['oasis_snapjaw', 4], ['kolkar_drudge', 2]], named: { barak_kodobane: 240 }, pool: 10, npcs: [], links: { lushwater_oasis: 16, crossroads: 20, thorn_hill: 16 } },
    razormane_grounds: { name: 'Snoutspike Grounds', zone: 'The Scrublands', region: 'barrens', scene: 'razormane_grounds', lvl: [11, 14], mobs: [['razormane_quilboar', 5], ['razormane_thornweaver', 4]], pool: 10, npcs: [], links: { crossroads: 18, far_watch: 16 } },
    thorn_hill: { name: 'Hoofbreak Hill', zone: 'The Scrublands', region: 'barrens', scene: 'thorn_hill', lvl: [14, 16], mobs: [['kolkar_stormer', 5], ['stormsnout', 4]], pool: 10, npcs: [], links: { baeldun_digsite: 18, crossroads: 22, stagnant_oasis: 16 } },
  });

  // people
  Object.assign(D.NPCS, {
    thork: { name: 'Grukk', title: 'Dustfort' },
    sergra: { name: 'Vesha Blackbriar', title: 'Hunter' },
    helbrim: { name: 'Apothecary Norrin', title: 'Apothecary' },
    zargh: { name: 'Zugg', title: 'Cook' },
    boorand: { name: 'Innkeeper Bruma', title: 'Innkeeper' },
    nargal: { name: 'Nazz', title: 'Weaponsmith' },
    kargal: { name: 'Ogrin', title: 'Hollow Tower' },
  });

  // quests
  Object.assign(D.QUESTS, {
    disrupt_attacks: { name: 'Raids on the Supply Line', lvl: 10, giver: 'thork', turnin: 'thork', text: 'Galloran centaurs raid our supply lines from the north. Kill 8 drudges.',
      objs: [{ type: 'kill', mob: 'kolkar_drudge', n: 8 }], reward: { choice: ['fam_feet12'] } },
    zhevra_runners: { name: 'Stripeback Runners', lvl: 10, giver: 'boorand', turnin: 'boorand', text: 'The stripebacks trample our tents at night. Hunt 8.',
      objs: [{ type: 'kill', mob: 'zhevra_runner', n: 8 }], reward: { money: 250 } },
    zhevra_hooves: { name: 'Stripeback Hooves', lvl: 10, giver: 'zargh', turnin: 'zargh', text: 'Stripeback hoof jelly. Nobody likes it, everybody eats it. Bring me 6 hooves.',
      objs: [{ type: 'collect', item: 'zhevra_hoof', n: 6 }], reward: { money: 260 } },
    raptor_thieves: { name: 'Thieves with Claws', lvl: 11, giver: 'sergra', turnin: 'sergra', text: 'Dustscale raptors steal from our caravans. Kill 10 lashtails at the Silent Pools.',
      objs: [{ type: 'kill', mob: 'sunscale_lashtail', n: 10 }], reward: { choice: ['fam_wrist12'] } },
    razormane_raid: { name: 'The Snoutspike', lvl: 11, giver: 'kargal', turnin: 'kargal', text: 'The Snoutspike spinehide grow bolder near Hollow Tower. Kill 10.',
      objs: [{ type: 'kill', mob: 'razormane_quilboar', n: 10 }], reward: { choice: ['fam_chest13'] } },
    lashtail_claws: { name: 'Lashtail Claws', lvl: 12, giver: 'helbrim', turnin: 'helbrim', text: 'Raptor claw is useful to an apothecary. Bring me 6 lashtail claws.',
      objs: [{ type: 'collect', item: 'lashtail_claw', n: 6 }], reward: { choice: ['fam_hands14'] } },
    razormane_tusks: { name: 'Snoutspike Tusks', lvl: 12, giver: 'nargal', turnin: 'nargal', text: 'Spinehide tusk makes a fine hilt. Bring me 8 from the Snoutspike and I will make you a weapon.',
      objs: [{ type: 'collect', item: 'razormane_tusk', n: 8 }], reward: { choice: ['fam_weapon12'] } },
    savannah_prowlers: { name: 'Savannah Prowlers', lvl: 12, giver: 'kargal', turnin: 'kargal', text: 'Prowlers stalk the road to Hollow Tower. Kill 8.',
      objs: [{ type: 'kill', mob: 'savannah_prowler', n: 8 }], reward: { choice: ['fam_legs13'] } },
    forgotten_pools_q: { name: 'The Silent Pools', lvl: 12, giver: 'helbrim', turnin: 'helbrim', text: 'Something fouls the water in the Scrublands. Bring me a sample from the Silent Pools.',
      objs: [{ type: 'visit', place: 'forgotten_pools' }], reward: { money: 300 } },
    kolkar_wranglers: { name: 'Galloran Wranglers', lvl: 13, giver: 'thork', turnin: 'thork', pre: ['disrupt_attacks'], text: 'The wranglers break beasts for the centaur war bands. Kill 10 at the Sourwater Oasis.',
      objs: [{ type: 'kill', mob: 'kolkar_wrangler', n: 10 }], reward: { choice: ['fam_back14'] } },
    kolkar_whips: { name: 'Wrangler Whips', lvl: 13, giver: 'sergra', turnin: 'sergra', text: "Take the wranglers' whips and they cannot drive their beasts. Bring me 6.",
      objs: [{ type: 'collect', item: 'kolkar_whip', n: 6 }], reward: { money: 400 } },
    thornweavers: { name: 'Thornweavers', lvl: 13, giver: 'kargal', turnin: 'kargal', pre: ['razormane_raid'], text: "The thornweavers work the Snoutspike's dark magic. Kill 8.",
      objs: [{ type: 'kill', mob: 'razormane_thornweaver', n: 8 }], reward: { choice: ['fam_waist14'] } },
    snapjaw_shells: { name: 'Snapjaw Shells', lvl: 14, giver: 'zargh', turnin: 'zargh', text: 'Turtle soup! The snapjaws at the Sourwater Oasis bite back, so be careful. Bring me 6 shell pieces.',
      objs: [{ type: 'collect', item: 'snapjaw_shell', n: 6 }], reward: { choice: ['fam_legs13'] } },
    swiftmane_q: { name: 'Quickhoof', lvl: 14, giver: 'sergra', turnin: 'sergra', text: 'A great stripebacks called Quickhoof is seen at the Silent Pools, but rarely. Bring me its hoof.',
      objs: [{ type: 'collect', item: 'swiftmane_hoof', n: 1 }], reward: { choice: ['fam_ring_rare'] } },
    kolkar_leaders: { name: 'Galloran Leaders', lvl: 15, giver: 'thork', turnin: 'thork', pre: ['kolkar_wranglers'], text: 'Rhaz the Herdbreaker leads the centaur at the Sourwater Oasis. Kill him.',
      objs: [{ type: 'kill', mob: 'barak_kodobane', n: 1 }], reward: { choice: ['fam_weapon15'] } },
    thorn_hill_scout: { name: 'Hoofbreak Hill', lvl: 13, giver: 'kargal', turnin: 'kargal', text: 'The Galloran gather storm shamans at Hoofbreak Hill. Scout it for me.',
      objs: [{ type: 'visit', place: 'thorn_hill' }], reward: { money: 350 } },
    kolkar_stormers: { name: 'Galloran Stormers', lvl: 14, giver: 'thork', turnin: 'thork', text: 'The stormers call lightning down on our caravans. Kill 10.',
      objs: [{ type: 'kill', mob: 'kolkar_stormer', n: 10 }], reward: { choice: ['fam_chest13'] } },
    stormsnouts: { name: 'Boomsnouts', lvl: 14, giver: 'sergra', turnin: 'sergra', text: 'The boomsnouts of Hoofbreak Hill are the toughest lizards in the Scrublands. Hunt 8.',
      objs: [{ type: 'kill', mob: 'stormsnout', n: 8 }], reward: { money: 420 } },
    storm_charms: { name: 'Storm Charms', lvl: 15, giver: 'helbrim', turnin: 'helbrim', text: "The stormers' charms hold real power. Bring me 8 to study.",
      objs: [{ type: 'collect', item: 'storm_charm', n: 8 }], reward: { choice: ['fam_wrist12'] } },
    stormsnout_hides: { name: 'Boomsnout Hides', lvl: 15, giver: 'nargal', turnin: 'nargal', text: 'Boomsnout hide turns a blade. Bring me 6.',
      objs: [{ type: 'collect', item: 'stormsnout_hide', n: 6 }], reward: { choice: ['fam_hands14'] } },
    lizard_steaks: { name: 'Thunder Lizard Steaks', lvl: 15, giver: 'zargh', turnin: 'zargh', text: 'Thunder lizard steak, crackling hot. Bring me 6.',
      objs: [{ type: 'collect', item: 'lizard_steak', n: 6 }], reward: { money: 480 } },
    thorn_hill_patrol: { name: 'Storm over Hoofbreak Hill', lvl: 15, giver: 'kargal', turnin: 'kargal', pre: ['thorn_hill_scout'], text: 'Push the Galloran off Hoofbreak Hill: 6 stormers and 4 boomsnouts.',
      objs: [{ type: 'kill', mob: 'kolkar_stormer', n: 6 }, { type: 'kill', mob: 'stormsnout', n: 4 }], reward: { choice: ['fam_waist14'] } },
    centaur_camp: { name: 'The Centaur War Camp', lvl: 16, giver: 'thork', turnin: 'thork', pre: ['kolkar_stormers'], text: 'Break the war camp on Hoofbreak Hill: 12 stormers.',
      objs: [{ type: 'kill', mob: 'kolkar_stormer', n: 12 }], reward: { choice: ['fam_back14'] } },
  });


  // ---- levels 15-20 (v2.1): the Slick, Greenwell Oasis and Stonegrave Dig
  D.item('venture_contract', { name: 'Deepgold Company Contract', slot: 'quest', q: 1, icon: 'journal' });
  D.item('crystal_sample', { name: 'Geologist Crystal', slot: 'quest', q: 1, icon: 'dust' });
  D.item('scytheclaw_talon', { name: 'Scytheclaw Talon', slot: 'quest', q: 1, icon: 'claw' });
  D.item('crocolisk_steak', { name: 'Crocodile Steak', slot: 'quest', q: 1, icon: 'meat' });
  D.item('crocolisk_hide', { name: 'Thick Crocodile Hide', slot: 'quest', q: 1, icon: 'pelt' });
  D.item('dwarven_rations', { name: 'Dwarven Rations', slot: 'quest', q: 1, icon: 'bread' });
  D.item('rifle_part', { name: 'Dwarven Rifle Part', slot: 'quest', q: 1, icon: 'coin' });
  D.item('takk_claw', { name: "Skarr's Claw", slot: 'quest', q: 1, icon: 'claw' });
  D.item('digsite_relic', { name: "Stonegrave Relic", slot: 'quest', q: 1, icon: 'coin' });
  D.item('baeldun_orders', { name: "Stonegrave Orders", slot: 'quest', q: 1, icon: 'journal' });
  D.item('takk_fang', { name: "Skarr's Fang", slot: 'weapon', wtype: 'dagger', q: 3, lvl: 19, dmg: [15, 25], speed: 1.7, stats: { agi: 6, sta: 3 }, icon: 'dagger', sell: 1700, source: 'Skarr the Leaper, Greenwell Oasis' });
  Object.assign(D.MOBS, {
    venture_mercenary: { name: 'Deepgold Company Mercenary', lvl: [15, 16], family: 'humanoid', drops: [['thieves_coin', 0.45], ['linen_cloth', 0.35]], qdrops: [['venture_contract', 0.5]], aggro: 'Time is money, friend!' },
    venture_geologist: { name: 'Deepgold Company Geologist', lvl: [16, 17], family: 'humanoid', drops: [['thieves_coin', 0.5], ['linen_cloth', 0.35]], qdrops: [['venture_contract', 0.5], ['crystal_sample', 0.55]], aggro: 'Hands off my samples!' },
    sunscale_scytheclaw: { name: 'Dustscale Scytheclaw', lvl: [17, 18], family: 'beast', hpMult: 1.1, drops: [['ruined_pelt', 0.4]], qdrops: [['scytheclaw_talon', 0.55]] },
    oasis_crocolisk: { name: 'Oasis Crocodile', lvl: [16, 17], family: 'beast', hpMult: 1.15, drops: [['ruined_pelt', 0.35]], qdrops: [['crocolisk_steak', 0.55], ['crocolisk_hide', 0.5]] },
    takk_the_leaper: { name: 'Skarr the Leaper', lvl: [19, 19], family: 'beast', named: true, hpMult: 2, dmgMult: 1.3, drops: [['takk_fang', 0.35], ['ruined_pelt', 1]], qdrops: [['takk_claw', 1]] },
    baeldun_excavator: { name: "Stonegrave Excavator", lvl: [18, 19], family: 'humanoid', drops: [['thieves_coin', 0.5], ['linen_cloth', 0.35]], qdrops: [['digsite_relic', 0.5], ['dwarven_rations', 0.55]], aggro: 'For Keldrun!' },
    baeldun_soldier: { name: "Stonegrave Soldier", lvl: [19, 20], family: 'humanoid', hpMult: 1.1, drops: [['thieves_coin', 0.55], ['linen_cloth', 0.35]], qdrops: [['digsite_relic', 0.5], ['baeldun_orders', 0.15], ['rifle_part', 0.5]], aggro: 'Krugar scum! Hold the line!' },
  });
  Object.assign(D.PLACES, {
    sludge_fen: { name: 'The Slick', zone: 'The Scrublands', region: 'barrens', scene: 'sludge_fen', lvl: [15, 17], mobs: [['venture_mercenary', 5], ['venture_geologist', 4]], pool: 10, npcs: [], links: { crossroads: 20, far_watch: 18 } },
    lushwater_oasis: { name: 'Greenwell Oasis', zone: 'The Scrublands', region: 'barrens', scene: 'lushwater_oasis', lvl: [16, 18], mobs: [['sunscale_scytheclaw', 5], ['oasis_crocolisk', 4]], named: { takk_the_leaper: 300 }, pool: 10, npcs: [], links: { crossroads: 20, stagnant_oasis: 16 } },
    baeldun_digsite: { name: "Stonegrave Dig", zone: 'The Scrublands', region: 'barrens', scene: 'baeldun_digsite', lvl: [18, 20], mobs: [['baeldun_excavator', 5], ['baeldun_soldier', 4]], pool: 10, npcs: [], links: { crossroads: 24, thorn_hill: 18 } },
  });
  Object.assign(D.QUESTS, {
    sludge_scout: { name: 'The Slick', lvl: 15, giver: 'kargal', turnin: 'kargal', text: 'Goblins of the Deepgold Company are poisoning the land north of Hollow Tower. Go and look.',
      objs: [{ type: 'visit', place: 'sludge_fen' }], reward: { money: 500 } },
    venture_mercs: { name: 'Deepgold Mercenaries', lvl: 15, giver: 'kargal', turnin: 'kargal', text: 'The Deepgold Company hired guns guard their oil pumps. Kill 12.',
      objs: [{ type: 'kill', mob: 'venture_mercenary', n: 12 }], reward: { choice: ['fam_feet17'] } },
    venture_contracts: { name: 'Read the Fine Print', lvl: 16, giver: 'helbrim', turnin: 'helbrim', text: 'The goblins carry their contracts everywhere. Bring me 8 and we will learn who pays them.',
      objs: [{ type: 'collect', item: 'venture_contract', n: 8 }], reward: { money: 650 } },
    geologists: { name: 'The Geologists', lvl: 16, giver: 'thork', turnin: 'thork', text: 'Deepgold Company geologists search the Scrublands for anything worth digging up. Stop 10.',
      objs: [{ type: 'kill', mob: 'venture_geologist', n: 10 }], reward: { choice: ['fam_wrist17'] } },
    crystal_samples: { name: 'Crystal Samples', lvl: 17, giver: 'helbrim', turnin: 'helbrim', text: 'The geologists found strange crystals. Bring me 6.',
      objs: [{ type: 'collect', item: 'crystal_sample', n: 6 }], reward: { choice: ['fam_weapon17'] } },
    stop_drilling: { name: 'Stop the Drilling', lvl: 17, giver: 'kargal', turnin: 'kargal', pre: ['venture_mercs'], text: 'Finish the job at the Slick: 6 mercenaries and 6 geologists.',
      objs: [{ type: 'kill', mob: 'venture_mercenary', n: 6 }, { type: 'kill', mob: 'venture_geologist', n: 6 }], reward: { choice: ['fam_waist19'] } },
    lushwater_scout: { name: 'Greenwell Oasis', lvl: 16, giver: 'sergra', turnin: 'sergra', text: 'Raptors nest at Greenwell Oasis to the south. Scout it for me.',
      objs: [{ type: 'visit', place: 'lushwater_oasis' }], reward: { money: 550 } },
    crocolisk_steaks: { name: 'Crocodile Steaks', lvl: 16, giver: 'zargh', turnin: 'zargh', text: 'Crocodile steak! Tough as boots but worth the chewing. Bring me 6.',
      objs: [{ type: 'collect', item: 'crocolisk_steak', n: 6 }], reward: { money: 650 } },
    oasis_crocs: { name: 'Crocs in the Water', lvl: 16, giver: 'boorand', turnin: 'boorand', text: 'The crocodiles at Greenwell drag off our water carriers. Kill 10.',
      objs: [{ type: 'kill', mob: 'oasis_crocolisk', n: 10 }], reward: { money: 650 } },
    scytheclaws: { name: 'The Scytheclaws', lvl: 17, giver: 'sergra', turnin: 'sergra', pre: ['lushwater_scout'], text: 'The scytheclaws are the deadliest raptors in the Scrublands. Hunt 12.',
      objs: [{ type: 'kill', mob: 'sunscale_scytheclaw', n: 12 }], reward: { choice: ['fam_chest18'] } },
    scytheclaw_talons: { name: 'Scytheclaw Talons', lvl: 17, giver: 'nargal', turnin: 'nargal', text: 'A scytheclaw talon makes a wicked blade. Bring me 8.',
      objs: [{ type: 'collect', item: 'scytheclaw_talon', n: 8 }], reward: { choice: ['fam_hands19'] } },
    digsite_scout: { name: "Stonegrave Dig", lvl: 18, giver: 'thork', turnin: 'thork', text: 'Dwarves are digging in the hills south of Hoofbreak Hill, on Krugar land. Find out what they want.',
      objs: [{ type: 'visit', place: 'baeldun_digsite' }], reward: { money: 600 } },
    excavators: { name: 'The Excavators', lvl: 18, giver: 'thork', turnin: 'thork', pre: ['digsite_scout'], text: 'The excavators dig day and night. Kill 12.',
      objs: [{ type: 'kill', mob: 'baeldun_excavator', n: 12 }], reward: { choice: ['fam_legs18'] } },
    digsite_relics: { name: "Stonegrave Relics", lvl: 18, giver: 'helbrim', turnin: 'helbrim', text: 'Whatever the dwarves dig up, I want to see it first. Bring me 8 relics.',
      objs: [{ type: 'collect', item: 'digsite_relic', n: 8 }], reward: { choice: ['fam_waist19'] } },
    crocolisk_hides: { name: 'Crocodile Hides', lvl: 18, giver: 'sergra', turnin: 'sergra', text: 'Crocodile hide makes good armour for our scouts. Bring me 8.',
      objs: [{ type: 'collect', item: 'crocolisk_hide', n: 8 }], reward: { choice: ['fam_legs18'] } },
    lushwater_raptors: { name: 'Greenwell Raptors', lvl: 18, giver: 'boorand', turnin: 'boorand', pre: ['scytheclaws'], text: 'The raptors of Greenwell are still hunting our caravans. Kill 10 scytheclaws.',
      objs: [{ type: 'kill', mob: 'sunscale_scytheclaw', n: 10 }], reward: { money: 750 } },
    dwarven_rations_q: { name: 'Dwarven Rations', lvl: 19, giver: 'zargh', turnin: 'zargh', text: 'The dwarves eat well. Bring me 8 of their rations and I will learn their recipes.',
      objs: [{ type: 'collect', item: 'dwarven_rations', n: 8 }], reward: { money: 800 } },
    rifle_parts: { name: 'Rifle Parts', lvl: 19, giver: 'nargal', turnin: 'nargal', text: 'Dwarven rifles are fine work. Bring me 8 parts and I will see how they are made.',
      objs: [{ type: 'collect', item: 'rifle_part', n: 8 }], reward: { choice: ['fam_hands19'] } },
    digsite_sweep: { name: 'Push Back the Dwarves', lvl: 20, giver: 'kargal', turnin: 'kargal', pre: ['excavators'], text: 'Drive the dwarves out of the Scrublands: 8 excavators and 8 soldiers.',
      objs: [{ type: 'kill', mob: 'baeldun_excavator', n: 8 }, { type: 'kill', mob: 'baeldun_soldier', n: 8 }], reward: { choice: ['fam_chest18'] } },
    takk_q: { name: 'Skarr the Leaper', lvl: 19, giver: 'sergra', turnin: 'sergra', text: 'An old raptor called Skarr the Leaper hunts at Greenwell. It is rarely seen. Bring me its claw.',
      objs: [{ type: 'collect', item: 'takk_claw', n: 1 }], reward: { choice: ['fam_ring_rare20'] } },
    baeldun_soldiers: { name: "Stonegrave Soldiers", lvl: 19, giver: 'thork', turnin: 'thork', pre: ['excavators'], text: 'Their soldiers guard the dig. Break them: 10 soldiers.',
      objs: [{ type: 'kill', mob: 'baeldun_soldier', n: 10 }], reward: { choice: ['fam_back19'] } },
    baeldun_orders_q: { name: 'Orders from Keldrun', lvl: 20, giver: 'thork', turnin: 'thork', pre: ['baeldun_soldiers'], text: 'A soldier carries orders from Keldrun. Bring them to me.',
      objs: [{ type: 'collect', item: 'baeldun_orders', n: 1 }], reward: { choice: ['fam_weapon20'] } },
  });

  // ---- The Dreaming Caves (v2.1): a 5-player dungeon under the Greenwell caves, levels 17-21
  D.item('serpentbloom', { name: 'The Cavern Flower', slot: 'quest', q: 1, icon: 'seed' });
  D.item('deviate_hide', { name: 'Deviate Hide', slot: 'quest', q: 1, icon: 'pelt' });
  D.item('belt_of_the_fang', { name: 'Belt of the Fang', slot: 'waist', atype: 'leather', q: 3, lvl: 20, armor: 58, stats: { agi: 6, sta: 4 }, icon: 'belt', sell: 1500 });
  D.item('fangdrip_runners', { name: 'Venomstep Boots', slot: 'feet', atype: 'leather', q: 3, lvl: 20, armor: 72, stats: { agi: 5, sta: 5 }, icon: 'boots', sell: 1500 });
  D.item('serpent_gloves', { name: 'Serpent Gloves', slot: 'hands', atype: 'cloth', q: 3, lvl: 20, armor: 22, stats: { int: 6, spi: 4 }, sp: 9, icon: 'gloves', sell: 1400 });
  D.item('cobrahn_grasp', { name: "Vesk's Grasp", slot: 'waist', atype: 'mail', q: 3, lvl: 20, armor: 115, stats: { str: 6, sta: 5 }, icon: 'belt', sell: 1500 });
  D.item('leggings_of_the_fang', { name: 'Leggings of the Fang', slot: 'legs', atype: 'leather', q: 3, lvl: 20, armor: 110, stats: { agi: 7, sta: 6 }, icon: 'legs', sell: 1800 });
  D.item('robe_moccasin', { name: 'Robe of the Moccasin', slot: 'chest', atype: 'cloth', q: 3, lvl: 20, armor: 44, stats: { int: 8, spi: 6 }, sp: 11, icon: 'chest_cloth', sell: 1800 });
  D.item('kresh_back', { name: "Old Shell's Back", slot: 'back', q: 3, lvl: 20, armor: 34, stats: { sta: 8 }, icon: 'cloak', sell: 1500 });
  D.item('turtle_scale_bracers', { name: 'Turtle Scale Bracers', slot: 'wrist', atype: 'mail', q: 3, lvl: 20, armor: 74, stats: { str: 4, sta: 5 }, icon: 'bracers', sell: 1300 });
  D.item('stinging_viper', { name: 'Stinging Viper', slot: 'weapon', wtype: 'mace', q: 3, lvl: 21, dmg: [23, 40], speed: 2.4, stats: { str: 6, sta: 4 }, icon: 'mace', sell: 2000 });
  D.item('lizardscale_cloak', { name: 'Glowing Lizardscale Cloak', slot: 'back', q: 3, lvl: 21, armor: 34, stats: { agi: 6, sta: 4 }, icon: 'cloak', sell: 1600 });
  D.item('mutant_scale_breastplate', { name: 'Mutant Scale Breastplate', slot: 'chest', atype: 'mail', q: 3, lvl: 21, armor: 250, stats: { str: 8, sta: 8 }, icon: 'chest_mail', sell: 2200 });
  D.item('staff_of_the_deviate', { name: 'Staff of the Deviate', slot: 'weapon', wtype: 'staff', q: 3, lvl: 21, dmg: [36, 55], speed: 3.1, stats: { int: 8, spi: 6 }, sp: 15, icon: 'staff', sell: 2200 });
  D.item('band_of_the_fang', { name: 'Band of the Fang', slot: 'finger', q: 3, lvl: 21, stats: { int: 4, agi: 4, sta: 4 }, icon: 'ring', sell: 1800 });
  Object.assign(D.MOBS, {
    druid_of_the_fang: { name: 'Druid of the Fang', lvl: [18, 19], family: 'humanoid', drops: [['linen_cloth', 0.4], ['thieves_coin', 0.35]], qdrops: [['serpentbloom', 0.5]], aggro: 'The Nightmare will take you!' },
    deviate_ravager: { name: 'Deviate Ravager', lvl: [18, 19], family: 'beast', drops: [['ruined_pelt', 0.4]], qdrops: [['deviate_hide', 0.5]] },
    deviate_viper: { name: 'Deviate Viper', lvl: [17, 18], family: 'beast', drops: [['ruined_pelt', 0.35]], qdrops: [['deviate_hide', 0.5]] },
    lady_anacondra: { name: 'Lady Sythra', lvl: [20, 20], family: 'humanoid', boss: true, aggro: 'None can stand against the Serpent Lords!', loot: ['belt_of_the_fang', 'fangdrip_runners', 'serpent_gloves'] },
    kresh: { name: 'Old Shell', lvl: [20, 20], family: 'beast', boss: true, loot: ['kresh_back', 'turtle_scale_bracers'] },
    lord_cobrahn: { name: 'Lord Vesk', lvl: [20, 20], family: 'humanoid', boss: true, aggro: 'You will never wake the dreamer!', loot: ['cobrahn_grasp', 'leggings_of_the_fang', 'robe_moccasin'] },
    lord_pythas: { name: 'Lord Ophis', lvl: [21, 21], family: 'humanoid', boss: true, aggro: 'The coils of death will crush you!', loot: ['stinging_viper', 'lizardscale_cloak'] },
    mutanus: { name: 'Gulgoth the Dreambane', lvl: [21, 21], family: 'murloc', boss: true, aggro: 'Elarion dreams... and I feed.', loot: ['mutant_scale_breastplate', 'staff_of_the_deviate', 'band_of_the_fang'] },
  });
  Object.assign(D.DUNGEONS, {
    wailing_caverns: { music: 'dreaming_caves', name: 'The Dreaming Caves', minLvl: 17, par: 435, trialPar: 430, size: 5, trashMult: { hp: 2.2, dmg: 1.65 }, bossMult: { hp: 10, dmg: 3.6 }, trial: { trashMult: { hp: 2.2, dmg: 2.2 }, bossMult: { hp: 10, dmg: 4.8 } }, /* damage lowered to the dungeon target (#215: a fitted player wiped in 18-49% of runs, target 5-15%); Trials keep the numbers they were tuned on */ pulls: [
      { scene: 'wailing_caverns', label: 'The mouth of the caves', mobs: ['deviate_viper', 'deviate_viper'] },
      { scene: 'wailing_caverns', label: 'Fungal grotto', mobs: ['druid_of_the_fang', 'deviate_ravager'] },
      { scene: 'wailing_caverns', label: 'Lady Sythra', mobs: ['lady_anacondra', 'druid_of_the_fang'], boss: true },
      { scene: 'wailing_caverns', label: 'Deviate den', mobs: ['deviate_ravager', 'deviate_ravager', 'deviate_viper'] },
      { scene: 'wailing_caverns', label: 'Old Shell', mobs: ['kresh'], boss: true },
      { scene: 'wailing_caverns_deep', label: 'Serpent lair', mobs: ['druid_of_the_fang', 'druid_of_the_fang'] },
      { scene: 'wailing_caverns_deep', label: 'Lord Vesk', mobs: ['lord_cobrahn', 'deviate_viper'], boss: true },
      { scene: 'wailing_caverns_deep', label: 'The waterfall', mobs: ['deviate_ravager', 'druid_of_the_fang', 'deviate_viper'] },
      { scene: 'wailing_caverns_deep', label: 'Lord Ophis', mobs: ['lord_pythas', 'druid_of_the_fang'], boss: true },
      { scene: 'wailing_caverns_deep', label: 'Dreamer\'s rest', mobs: ['druid_of_the_fang', 'deviate_ravager'] },
      { scene: 'wailing_caverns_deep', label: 'Gulgoth the Dreambane', mobs: ['mutanus'], boss: true }] },
  });
  Object.assign(D.ACTIVITIES, {
    wailing_caverns: { name: 'The Dreaming Caves', dungeon: 'wailing_caverns', where: 'lushwater_oasis', size: 5, minLvl: 17, maxLvl: 21, desc: 'Dungeon in the Scrublands. 5 players.', boss: 'mutanus' },
  });
  Object.assign(D.QUESTS, {
    wc_serpentbloom: { name: 'The Cavern Flower', lvl: 18, giver: 'helbrim', turnin: 'helbrim', dungeon: 'wailing_caverns', text: 'A rare flower grows only in the Dreaming Caves, and the Druids of the Coil guard it. Bring me 8 the cavern flower.',
      objs: [{ type: 'collect', item: 'serpentbloom', n: 8 }], reward: { choice: ['fam_hands19'] } },
    wc_deviate_hides: { name: 'Twisted Hides', lvl: 19, giver: 'sergra', turnin: 'sergra', dungeon: 'wailing_caverns', text: 'The beasts in the caverns are twisted into something new. Their hides are strong. Bring me 8.',
      objs: [{ type: 'collect', item: 'deviate_hide', n: 8 }], reward: { choice: ['fam_chest18'] } },
    wc_leaders: { name: 'Leaders of the Coil', lvl: 21, giver: 'thork', turnin: 'thork', dungeon: 'wailing_caverns', text: 'Four druids went into the caverns to heal the land and came out as the Fang. Kill three of their leaders: Sythra, Vesk and Ophis.',
      objs: [{ type: 'kill', mob: 'lady_anacondra', n: 1 }, { type: 'kill', mob: 'lord_cobrahn', n: 1 }, { type: 'kill', mob: 'lord_pythas', n: 1 }], reward: { choice: ['fam_back_rare20'] } },
    wc_mutanus: { name: 'The Dream-Eater', lvl: 21, giver: 'thork', turnin: 'thork', pre: ['wc_leaders'], dungeon: 'wailing_caverns', text: 'Something feeds on the dreams of the druid Elarion, deep in the caverns. Kill it.',
      objs: [{ type: 'kill', mob: 'mutanus', n: 1 }], reward: { choice: ['fam_weapon20'] } },
  });
})(typeof window !== 'undefined' ? window : globalThis);