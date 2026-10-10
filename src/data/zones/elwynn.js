// Ambermoor and Halden: Accord, levels 1–11.
// Everything that lives in this zone: its places, creatures, people, quests and the items they drop.
// Links to other zones sit on the places themselves (place.links / place.via).
(function (root) {
  const D = root.D;
  D.zone('elwynn', { name: 'Ambermoor', faction: 'alliance' });
  // items
  D.item('red_bandana', { name: 'Red Burlap Bandana', slot: 'quest', q: 1, icon: 'bandana' });
  D.item('grape_crate', { name: 'Crate of Grapes', slot: 'quest', q: 1, icon: 'grapes' });
  D.item('garrick_head', { name: "Jory's Head", slot: 'quest', q: 1, icon: 'head' });
  D.item('large_candle', { name: 'Large Candle', slot: 'quest', q: 1, icon: 'candle' });
  D.item('gold_dust', { name: 'Gold Dust', slot: 'quest', q: 1, icon: 'dust' });
  D.item('murloc_fin', { name: 'Torn Mireling Fin', slot: 'quest', q: 1, icon: 'fin' });
  D.item('red_linen', { name: 'Red Linen Bandana', slot: 'quest', q: 1, icon: 'bandana' });
  D.item('brass_collar', { name: 'Brass Collar', slot: 'quest', q: 1, icon: 'ring' });
  D.item('gnoll_armband', { name: 'Painted Gnoll Armband', slot: 'quest', q: 1, icon: 'armband' });
  D.item('gnoll_claw', { name: 'Huge Gnoll Claw', slot: 'quest', q: 1, icon: 'claw' });
  D.item('garrick_cloak', { name: "Jory's Bandit Cloak", slot: 'back', q: 3, lvl: 5, armor: 9, stats: { agi: 2, sta: 1 }, icon: 'cloak', sell: 120, source: 'Jory Blackthumb, Halden Vineyards', look: ['back', 'garrick_cloak'] });
  D.item('pumpkin_trousers', { name: 'Pumpkin Patch Trousers', slot: 'legs', atype: 'cloth', q: 3, lvl: 9, armor: 16, stats: { sta: 3, spi: 2 }, icon: 'legs', sell: 300, source: 'Duchess, Tamsin\'s Pumpkin Patch', look: ['legs', 'pumpkin_trousers'] });
  D.item('gnollhide_cloak', { name: 'Gnollhide Cloak', slot: 'back', q: 3, lvl: 10, armor: 20, stats: { str: 2, agi: 2, sta: 3 }, icon: 'cloak', sell: 450, source: "Old Snaggle, Greywood Verge", look: ['back', 'gnollhide_cloak'] });
  D.item('kobold_pick', { name: 'Kobold Mining Pick', slot: 'quest', q: 1, icon: 'axe' });
  D.item('crystal_clam', { name: 'Stillwater Lake Clam', slot: 'quest', q: 1, icon: 'meat' });
  D.item('prowler_claw', { name: 'Prowler Claw', slot: 'quest', q: 1, icon: 'claw' });

  // creatures
  Object.assign(D.MOBS, {
    young_wolf: { name: 'Young Wolf', lvl: [1, 2], family: 'beast', drops: [['ruined_pelt', 0.35], ['wolf_fang', 0.25]], qdrops: [['wolf_meat', 0.75]] },
    kobold_vermin: { name: 'Kobold Vermin', lvl: [1, 2], family: 'humanoid', drops: [['kobold_rag', 0.4], ['linen_cloth', 0.2]], aggro: 'Our dig! Get out!' },
    kobold_worker: { name: 'Kobold Worker', lvl: [3, 4], family: 'humanoid', drops: [['broken_candle', 0.35], ['linen_cloth', 0.25]], aggro: 'Out of the tunnels, tall one!' },
    defias_thug: { name: 'Grey Hood Thug', lvl: [3, 5], family: 'humanoid', drops: [['thieves_coin', 0.35], ['linen_cloth', 0.3]], qdrops: [['red_bandana', 0.7]], aggro: 'The Brotherhood will not tolerate your actions!' },
    garrick_padfoot: { name: 'Jory Blackthumb', lvl: [5, 5], family: 'humanoid', named: true, hpMult: 1.6, dmgMult: 1.2, drops: [['thieves_coin', 1], ['garrick_cloak', 0.35]], qdrops: [['garrick_head', 1]], aggro: "I'll gut you like a fish!" },
    mangy_wolf: { name: 'Mangy Wolf', lvl: [5, 6], family: 'beast', drops: [['ruined_pelt', 0.4], ['wolf_fang', 0.3]] },
    kobold_laborer: { name: 'Kobold Laborer', lvl: [5, 6], family: 'humanoid', drops: [['broken_candle', 0.4], ['linen_cloth', 0.3]], qdrops: [['large_candle', 0.6], ['gold_dust', 0.5]], aggro: 'Dig-thief! Dig-thief!' },
    kobold_tunneler: { name: 'Kobold Tunneler', lvl: [6, 7], family: 'humanoid', drops: [['broken_candle', 0.4], ['linen_cloth', 0.3]], qdrops: [['large_candle', 0.6], ['gold_dust', 0.5], ['kobold_pick', 0.55]], aggro: 'Tunnel-rats, to me!' },
    young_forest_bear: { name: 'Young Forest Bear', lvl: [7, 8], family: 'beast', hpMult: 1.15, drops: [['bear_hide', 0.4]] },
    prowler: { name: 'Prowler', lvl: [7, 8], family: 'beast', drops: [['ruined_pelt', 0.4], ['wolf_fang', 0.3]], qdrops: [['prowler_claw', 0.55]] },
    murloc_streamrunner: { name: 'Mireling Streamrunner', lvl: [7, 8], family: 'murloc', drops: [['murloc_eye', 0.45]], qdrops: [['murloc_fin', 0.6], ['crystal_clam', 0.5]], aggro: 'Mrrrggllll!' },
    murloc_forager: { name: 'Mireling Forager', lvl: [8, 9], family: 'murloc', drops: [['murloc_eye', 0.45]], qdrops: [['murloc_fin', 0.6], ['crystal_clam', 0.5]], aggro: 'Aaaaaughibbrgubugbugrguburgle!' },
    defias_bandit: { name: 'Grey Hood Bandit', lvl: [8, 10], family: 'humanoid', drops: [['thieves_coin', 0.4], ['linen_cloth', 0.35], ['pumpkin', 0.2]], qdrops: [['red_linen', 0.65]], aggro: 'Your bones will break under my boot!' },
    princess: { name: 'Duchess', lvl: [9, 9], family: 'beast', named: true, hpMult: 1.8, dmgMult: 1.2, drops: [['bear_hide', 1], ['pumpkin_trousers', 0.35]], qdrops: [['brass_collar', 1]] },
    riverpaw_gnoll: { name: 'Tallgrass Gnoll', lvl: [9, 10], family: 'humanoid', drops: [['gnoll_mane', 0.45], ['linen_cloth', 0.3]], qdrops: [['gnoll_armband', 0.6]], aggro: 'Grrr... fresh meat!' },
    hogger: { name: 'Old Snaggle', lvl: [11, 11], family: 'humanoid', elite: true, named: true, hpMult: 5.5, dmgMult: 2.6, drops: [['gnoll_mane', 1]], qdrops: [['gnoll_claw', 1]], aggro: 'More bones to gnaw on...', special: 'hogger', loot: ['gnollhide_cloak'] },
  });

  // places
  Object.assign(D.PLACES, {
    northshire_abbey: { name: 'Halden Abbey', zone: 'Halden Vale', scene: 'northshire_abbey', lvl: [1, 2], mobs: [['young_wolf', 5], ['kobold_vermin', 5]], pool: 9, npcs: ['mcbride', 'willem', 'eagan', 'danil'], vendor: 'danil', links: { echo_ridge: 10, northshire_vineyards: 12, goldshire: 30 }, region: 'elwynn' },
    echo_ridge: { name: 'Tinder Hollow', zone: 'Halden Vale', scene: 'echo_ridge', lvl: [3, 4], mobs: [['kobold_worker', 8], ['kobold_vermin', 2]], pool: 8, npcs: [], links: { northshire_abbey: 10, northshire_vineyards: 14 }, region: 'elwynn' },
    northshire_vineyards: { name: 'Halden Vineyards', zone: 'Halden Vale', scene: 'vineyards', lvl: [3, 5], mobs: [['defias_thug', 10]], named: { garrick_padfoot: 90 }, pool: 8, npcs: ['milly'], gather: { item: 'grape_crate', label: 'Crate of Grapes', quest: 'millys_harvest' }, links: { northshire_abbey: 12, echo_ridge: 14 }, region: 'elwynn' },
    goldshire: { name: 'Brackenford', zone: 'Ambermoor', scene: 'goldshire', lvl: [5, 10], safe: true, inn: true, mobs: [], pool: 0, npcs: ['dughan', 'remy', 'pestle', 'farley', 'corina'], vendor: 'farley', gearVendor: 'corina', links: { stormwind_gate: 25, northshire_abbey: 30, fargodeep: 16, crystal_lake: 18, brackwell: 20, forests_edge: 24, darnassus: 60, furlbrow_farm: 30 }, via: { darnassus: "Boat to Rut'theran" }, region: 'elwynn' },
    fargodeep: { name: 'Deepcut Mine', zone: 'Ambermoor', scene: 'fargodeep', lvl: [5, 7], mobs: [['kobold_laborer', 6], ['kobold_tunneler', 4], ['mangy_wolf', 3]], pool: 9, npcs: [], links: { goldshire: 16, brackwell: 14 }, region: 'elwynn' },
    crystal_lake: { name: 'Stillwater Lake', zone: 'Ambermoor', scene: 'crystal_lake', lvl: [7, 9], mobs: [['murloc_streamrunner', 5], ['murloc_forager', 3], ['young_forest_bear', 3], ['prowler', 3]], pool: 10, npcs: ['thomas'], links: { goldshire: 18, forests_edge: 16 }, region: 'elwynn' },
    brackwell: { name: 'Tamsin\'s Pumpkin Patch', zone: 'Ambermoor', scene: 'brackwell', lvl: [8, 10], mobs: [['defias_bandit', 8], ['prowler', 2]], named: { princess: 120 }, pool: 9, npcs: ['ma_stonefield'], links: { goldshire: 20, fargodeep: 14 }, region: 'elwynn' },
    forests_edge: { name: "Greywood Verge", zone: 'Ambermoor', scene: 'forests_edge', lvl: [9, 11], mobs: [['riverpaw_gnoll', 10]], named: { hogger: 150 }, pool: 9, npcs: [], links: { goldshire: 24, crystal_lake: 16 }, region: 'elwynn' },
  });

  // people
  Object.assign(D.NPCS, {
    mcbride: { name: 'Marshal Aldous Venn', title: 'Halden Marshal' },
    willem: { name: 'Deputy Harlan', title: 'Halden Guard' },
    eagan: { name: 'Rolf Tanner', title: 'Hunter' },
    danil: { name: 'Brother Cade', title: 'Food & Drink' },
    milly: { name: 'Nell Harrow', title: 'Vineyard Hand' },
    dughan: { name: 'Marshal Brede', title: 'Brackenford Marshal' },
    remy: { name: 'Pell "Twice Over"', title: 'Trader' },
    pestle: { name: 'Tobin Ashcombe', title: 'Herbalist' },
    farley: { name: 'Innkeeper Maudie', title: 'Innkeeper' },
    corina: { name: 'Gretta Holloway', title: 'Weaponsmith' },
    thomas: { name: 'Guard Emmett', title: 'Kingsmere Guard' },
    ma_stonefield: { name: 'Old Ma Dunmere', title: 'Farmer' },
  });

  // quests
  Object.assign(D.QUESTS, {
    wolves_border: { name: 'Wolves at the Abbey Wall', lvl: 2, giver: 'eagan', turnin: 'eagan', text: "Wolves from the woods keep raiding our stores. Bring me 8 Tough Wolf Meat and I'll make it worth your while.",
      objs: [{ type: 'collect', item: 'wolf_meat', n: 8 }], reward: { choice: ['fam_chest'] } },
    kobold_cleanup: { name: 'Vermin at the Abbey', lvl: 2, giver: 'mcbride', turnin: 'mcbride', text: 'Kobolds have been spotted around the abbey. Kill 10 Kobold Vermin.',
      objs: [{ type: 'kill', mob: 'kobold_vermin', n: 10 }], reward: { choice: ['fam_legs'] } },
    investigate_echo: { name: 'Trouble in Tinder Hollow', lvl: 3, giver: 'mcbride', turnin: 'mcbride', pre: ['kobold_cleanup'], text: 'More kobolds are digging at Tinder Hollow. Thin out 10 Kobold Workers.',
      objs: [{ type: 'kill', mob: 'kobold_worker', n: 10 }], reward: { choice: ['fam_feet'] } },
    brotherhood_thieves: { name: 'Hoods in the Vineyard', lvl: 4, giver: 'willem', turnin: 'willem', text: 'The Grey Hoods has moved into the vineyards. Bring me 12 of their Red Burlap Bandanas.',
      objs: [{ type: 'collect', item: 'red_bandana', n: 12 }], reward: { choice: ['fam_hands'] } },
    millys_harvest: { name: "Nell's Harvest", lvl: 4, giver: 'milly', turnin: 'milly', text: 'The thugs chased us off before we finished the harvest. The crates are still stacked between the rows. Could you bring back 8 Crates of Grapes?',
      objs: [{ type: 'collect', item: 'grape_crate', n: 8 }], reward: {} },
    bounty_garrick: { name: 'Bounty on Jory Blackthumb', lvl: 5, giver: 'willem', turnin: 'willem', pre: ['brotherhood_thieves'], text: 'Their leader Jory Blackthumb hides in the vineyards. Bring me his head.',
      objs: [{ type: 'collect', item: 'garrick_head', n: 1 }], reward: { choice: ['fam_weapon5'] } },
    report_goldshire: { name: 'The Road to Brackenford', lvl: 5, giver: 'mcbride', turnin: 'dughan', text: "You've done well. Head south to Brackenford and report to Marshal Brede.",
      objs: [{ type: 'visit', place: 'goldshire' }], reward: {} },
    fargodeep_mine: { name: 'Scouting Deepcut Mine', lvl: 6, giver: 'dughan', turnin: 'dughan', text: 'Scout Deepcut Mine to the south and see what the kobolds are up to.',
      objs: [{ type: 'visit', place: 'fargodeep' }], reward: {} },
    kobold_candles: { name: 'Wax for Tobin', lvl: 6, giver: 'pestle', turnin: 'pestle', text: 'The kobolds in Deepcut carry fine candles. I need 8 Large Candles for my work.',
      objs: [{ type: 'collect', item: 'large_candle', n: 8 }], reward: { choice: ['fam_wrist'] } },
    gold_dust: { name: 'Pell\'s Twice-Over Deal', lvl: 6, giver: 'remy', turnin: 'remy', text: "Kobolds hoard gold dust from the mines. Get me 10 and I'll pay you twice. Heh. Two times.",
      objs: [{ type: 'collect', item: 'gold_dust', n: 10 }], reward: { money: 150 } },
    protect_frontier: { name: 'Teeth by the Lake', lvl: 8, giver: 'thomas', turnin: 'thomas', text: 'Wildlife near Stillwater Lake has turned vicious. Kill 8 Prowlers and 5 Young Forest Bears.',
      objs: [{ type: 'kill', mob: 'prowler', n: 8 }, { type: 'kill', mob: 'young_forest_bear', n: 5 }], reward: { choice: ['fam_back'] } },
    bounty_murlocs: { name: 'Fins from Stillwater', lvl: 8, giver: 'thomas', turnin: 'thomas', text: 'Mirelings are raiding the lake shore. Bring me 8 Torn Mireling Fins.',
      objs: [{ type: 'collect', item: 'murloc_fin', n: 8 }], reward: { choice: ['fam_waist'] } },
    red_linen: { name: 'Ma Dunmere\'s Linen', lvl: 9, giver: 'ma_stonefield', turnin: 'ma_stonefield', text: 'Those Grey Hood bandits stole my linen. Get back 6 Red Linen Bandanas from them.',
      objs: [{ type: 'collect', item: 'red_linen', n: 6 }], reward: { choice: ['fam_chest9'] } },
    princess_must_die: { name: 'Duchess Has Eaten Her Last Pumpkin', lvl: 9, giver: 'ma_stonefield', turnin: 'ma_stonefield', text: 'That fat sow Duchess ate my prize pumpkins. Bring me her brass collar.',
      objs: [{ type: 'collect', item: 'brass_collar', n: 1 }], reward: { choice: ['fam_legs9'] } },
    gnoll_bounty: { name: 'Tallgrass at the Verge', lvl: 10, giver: 'dughan', turnin: 'dughan', text: "Tallgrass gnolls are crossing into Ambermoor at Greywood Verge. Bring me 8 Painted Gnoll Armbands.",
      objs: [{ type: 'collect', item: 'gnoll_armband', n: 8 }], reward: { choice: ['fam_hands9'] } },
    wanted_hogger: { name: 'Wanted: Old Snaggle', lvl: 11, giver: 'dughan', turnin: 'dughan', group: 3, text: 'A huge gnoll called Old Snaggle leads the Tallgrass. Bring me his claw. Take friends — he is no ordinary gnoll.',
      objs: [{ type: 'collect', item: 'gnoll_claw', n: 1 }], reward: { choice: ['militia'] } },
    defias_brotherhood: { name: 'The Grey Hoods', lvl: 20, giver: 'dughan', turnin: 'dughan', dungeon: 'deadmines', text: 'Corvin Blackwell leads the Grey Hood from a hidden cove under Fenwick. End him, and bring back proof.',
      objs: [{ type: 'collect', item: 'vancleef_head', n: 1 }], reward: { choice: ['fam_weapon20'] } },
    inn_wolves: { name: 'Wolves at the Door', lvl: 5, giver: 'farley', turnin: 'farley', text: 'Mangy wolves from the Deepcut hills keep coming for my chickens. Thin them out: 8 will do.',
      objs: [{ type: 'kill', mob: 'mangy_wolf', n: 8 }], reward: { money: 90 } },
    kobold_picks: { name: 'Kobold Picks', lvl: 6, giver: 'corina', turnin: 'corina', text: 'Kobold picks are poor tools but good iron. Bring me 6 from the tunnelers in Deepcut and I will forge you something.',
      objs: [{ type: 'collect', item: 'kobold_pick', n: 6 }], reward: { choice: ['fam_weapon5'] } },
    lake_clams: { name: 'Chowder Season', lvl: 7, giver: 'farley', turnin: 'farley', text: 'Clam chowder sells well, but the mirelings have taken the lake. They hoard clams. Bring me 6.',
      objs: [{ type: 'collect', item: 'crystal_clam', n: 6 }], reward: { money: 140 } },
    prowler_claws: { name: 'Prowler Claws', lvl: 7, giver: 'pestle', turnin: 'pestle', text: 'Ground prowler claw is the base of a strong tonic. The prowlers near Stillwater Lake will do. I need 6.',
      objs: [{ type: 'collect', item: 'prowler_claw', n: 6 }], reward: { choice: ['fam_wrist'] } },
    brackwell_bandits: { name: 'Bandits in the Pumpkins', lvl: 8, giver: 'dughan', turnin: 'dughan', pre: ['fargodeep_mine'], text: 'Grey Hood bandits have set up at the Tamsin\'s Pumpkin Patch. Drive them out: 8 bandits.',
      objs: [{ type: 'kill', mob: 'defias_bandit', n: 8 }], reward: { choice: ['fam_waist'] } },
    report_gryan: { name: 'Report to Bram Oakhollow', lvl: 10, giver: 'dughan', turnin: 'gryan', text: 'The farmers of Longfield rose up against the Grey Hood. Their leader, Bram Oakhollow, holds Warrick\'s Rise. Go west and offer your sword.',
      objs: [{ type: 'visit', place: 'sentinel_hill' }], reward: {} },
  });

  // group finder
  Object.assign(D.ACTIVITIES, {
    hogger: { name: 'Wanted: Old Snaggle', where: 'forests_edge', size: 3, minLvl: 8, maxLvl: 12, desc: 'Open-world elite in Ambermoor. 3 players.', boss: 'hogger', pulls: [{ scene: 'forests_edge', label: 'Tallgrass camp', mobs: ['riverpaw_gnoll', 'riverpaw_gnoll'] }, { scene: 'forests_edge', label: 'Tallgrass camp', mobs: ['riverpaw_gnoll', 'riverpaw_gnoll'] }, { scene: 'forests_edge', label: 'Old Snaggle', mobs: ['hogger'], boss: true }] },
  });


  // ---- Kingsmere (v2.3): the Accord capital. The Underrail runs here from Keldrun.
  Object.assign(D.PLACES, {
    stormwind_gate: { music: 'kingsmere', name: 'Hall of Banners', zone: 'Kingsmere', region: 'elwynn', scene: 'stormwind_gate', lvl: [1, 60], safe: true, city: true, mobs: [], pool: 0, npcs: [], links: { goldshire: 25, stormwind: 8 } },
    stormwind: { music: 'kingsmere', name: 'Market Ward', zone: 'Kingsmere', region: 'elwynn', scene: 'stormwind', lvl: [1, 60], safe: true, inn: true, city: true, mobs: [], pool: 0, npcs: ['allison', 'mentor_alliance', 'thurman'], vendor: 'allison', gearVendor: 'thurman',
      links: { stormwind_gate: 8, stormwind_bank: 6, ironforge: 40 }, via: { ironforge: 'Underrail' } },
    stormwind_bank: { music: 'kingsmere', name: 'Bank and Auction House', zone: 'Kingsmere', region: 'elwynn', scene: 'stormwind_bank', lvl: [1, 60], safe: true, city: true, mobs: [], pool: 0, npcs: ['banker_alliance', 'auctioneer_alliance'], links: { stormwind: 6 } },
  });
  Object.assign(D.NPCS, {
    allison: { name: 'Innkeeper Rosalind', title: 'Innkeeper' }, thurman: { name: 'Oswin Ferrell', title: 'Weaponsmith' },
  });
})(typeof window !== 'undefined' ? window : globalThis);