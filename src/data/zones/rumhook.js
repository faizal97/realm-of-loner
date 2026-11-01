// Southern Vinewild: Rumhook Bay, contested, levels 35–40 (v10.9). A neutral goblin port that both factions use, with
// the Black Ledger's grain trail (main story: where Longfield's seized grain goes, on toward Cinderpeak) and the
// Bloodsand Arena. Design: docs/plans/2026-10-01-rumhook-bay-design.md. The north (30–35) is stranglethorn.js; a jungle
// road runs south from the Ruins of Mokkari, and a goblin ship sails from Rumhook Bay to Coppergulch.
(function (root) {
  const D = root.D;
  // quest items
  D.item('grain_tag', { name: 'Sealed Grain Tag', slot: 'quest', q: 1, icon: 'journal' });
  D.item('stolen_grain', { name: 'Stolen Grain Sack', slot: 'quest', q: 1, icon: 'bag' });
  D.item('warm_purse', { name: 'Purse of Warm Coins', slot: 'quest', q: 1, icon: 'coin' });
  D.item('torn_manifest', { name: 'Torn Manifest Page', slot: 'quest', q: 1, icon: 'journal' });
  D.item('bonded_manifest', { name: 'Bonded Yard Manifest', slot: 'quest', q: 1, icon: 'journal' });
  D.item('factor_order', { name: "The Factor's Last Order", slot: 'quest', q: 1, icon: 'journal' });
  D.item('crawler_shell', { name: 'Surf Crawler Shell', slot: 'quest', q: 1, icon: 'scale' });
  D.item('thornback_hide', { name: 'Thornback Hide', slot: 'quest', q: 1, icon: 'pelt' });
  D.item('sunken_crate', { name: 'Waterlogged Cargo Crate', slot: 'quest', q: 1, icon: 'bag' });
  D.item('hex_fetish', { name: 'Bonegrin Hex Fetish', slot: 'quest', q: 1, icon: 'voodoo_doll' });
  D.item('grukka_tusk', { name: "Chieftain Grukka's Tusk", slot: 'quest', q: 1, icon: 'tusk' });
  D.item('rum_cask', { name: 'Cask of Blackgull Rum', slot: 'quest', q: 1, icon: 'bag' });
  D.item('brine_hook', { name: "Captain Brine's Spyglass", slot: 'quest', q: 1, icon: 'journal' });
  // the Wanted captain's loot and the named drops
  D.item('brine_cutlass', { name: "Brine's Cutlass", slot: 'weapon', wtype: 'sword', q: 3, lvl: 38, dmg: [48, 81], speed: 2.5, stats: { agi: 10, sta: 8 }, icon: 'sword', sell: 6400 });
  D.item('brine_coat', { name: 'Salt-Stiff Captain\'s Coat', slot: 'chest', atype: 'leather', q: 3, lvl: 38, armor: 186, stats: { agi: 14, sta: 11 }, icon: 'chest_leather', sell: 6600 });
  D.item('brine_ring', { name: 'Gull-Eye Ring', slot: 'finger', q: 3, lvl: 38, stats: { int: 9, spi: 8 }, sp: 9, icon: 'ring', sell: 6000 });
  D.item('grukka_charm', { name: 'Hexbound Bangle', slot: 'wrist', atype: 'mail', q: 3, lvl: 39, armor: 120, stats: { str: 9, sta: 8 }, icon: 'bracers', sell: 6200, source: 'Chieftain Grukka, the Bonegrin Warcamp' });

  // creatures (sprites borrowed until the Rumhook art pack draws their own)
  Object.assign(D.MOBS, {
    blackgull_skimmer: { name: 'Blackgull Skimmer', sprite: 'southsea_pirate', lvl: [35, 36], family: 'humanoid', drops: [['thieves_coin', 0.5], ['linen_cloth', 0.3]], qdrops: [['grain_tag', 0.5], ['stolen_grain', 0.45]], aggro: 'That sack fell off a ship. Honest!' },
    surf_crawler: { name: 'Surf Crawler', lvl: [35, 36], family: 'beast', drops: [['ruined_pelt', 0.3]], qdrops: [['crawler_shell', 0.55]] },
    thornback_gorilla: { name: 'Thornback Gorilla', sprite: 'ungoro_gorilla', lvl: [36, 37], family: 'beast', hpMult: 1.1, drops: [['ruined_pelt', 0.4]], qdrops: [['thornback_hide', 0.55]] },
    thornback_bruiser: { name: 'Thornback Bruiser', sprite: 'ungoro_gorilla', lvl: [37, 37], family: 'beast', hpMult: 1.2, drops: [['ruined_pelt', 0.45]], qdrops: [['thornback_hide', 0.35]] },
    blackgull_cutthroat: { name: 'Blackgull Cutthroat', sprite: 'southsea_pirate', lvl: [37, 38], family: 'humanoid', drops: [['thieves_coin', 0.55], ['linen_cloth', 0.3]], qdrops: [['warm_purse', 0.35], ['rum_cask', 0.45]], aggro: 'Your purse or your teeth!' },
    blackgull_powder_monkey: { name: 'Blackgull Powder Monkey', sprite: 'southsea_cannoneer', lvl: [37, 38], family: 'humanoid', drops: [['thieves_coin', 0.5], ['linen_cloth', 0.3]], qdrops: [['sunken_crate', 0.5]], aggro: 'Light the fuse!' },
    captain_brine: { name: 'Captain Odda Brine', sprite: 'southsea_pirate', lvl: [38, 38], family: 'humanoid', elite: true, named: true, hpMult: 5.5, dmgMult: 2.5, special: 'hogger', specialText: 'Captain Brine lunges with her cutlass!', drops: [['thieves_coin', 1]], qdrops: [['brine_hook', 1], ['torn_manifest', 1]], loot: ['brine_cutlass', 'brine_coat', 'brine_ring'], aggro: 'Every page of that manifest costs extra.' },
    bonegrin_raider: { name: 'Bonegrin Raider', sprite: 'skullsplitter_warrior', lvl: [38, 39], family: 'humanoid', hpMult: 1.15, drops: [['troll_tusk', 0.45], ['linen_cloth', 0.3]], aggro: 'The road belongs to Bonegrin!' },
    bonegrin_hexbinder: { name: 'Bonegrin Hexbinder', sprite: 'skullsplitter_witch_doctor', lvl: [38, 39], family: 'humanoid', drops: [['troll_tusk', 0.4], ['linen_cloth', 0.35]], qdrops: [['hex_fetish', 0.5]], aggro: 'Your bones for my fetish!' },
    chieftain_grukka: { name: 'Chieftain Grukka', sprite: 'skullsplitter_warrior', lvl: [39, 39], family: 'humanoid', named: true, hpMult: 2.3, dmgMult: 1.35, drops: [['grukka_charm', 0.35], ['troll_tusk', 1]], qdrops: [['grukka_tusk', 1]], aggro: 'Grukka eats goblins. You are worse.' },
    grey_hood_wharfguard: { name: 'Grey Hood Wharfguard', sprite: 'defias_highwayman', lvl: [39, 40], family: 'humanoid', hpMult: 1.15, drops: [['thieves_coin', 0.55], ['linen_cloth', 0.3]], aggro: 'This yard is bonded. So are you, now.' },
    ledger_tallyman: { name: 'Ledger Tallyman', sprite: 'syndicate_magus', lvl: [39, 40], family: 'humanoid', drops: [['thieves_coin', 0.6], ['linen_cloth', 0.3]], qdrops: [['bonded_manifest', 0.5]], aggro: 'You are not in my books.' },
    factor_crane: { name: 'Factor Simeon Crane', sprite: 'syndicate_magus', lvl: [40, 40], family: 'humanoid', named: true, hpMult: 2.4, dmgMult: 1.4, drops: [['thieves_coin', 1]], qdrops: [['factor_order', 1]], aggro: 'Grain is grain. Debt is debt. And you are late.' },
  });

  // places
  Object.assign(D.PLACES, {
    rumhook_bay: { music: 'rumhook', name: 'Rumhook Bay', zone: 'The Vinewild', region: 'stranglethorn', scene: 'rumhook_bay', lvl: [35, 40], safe: true, neutral: true, inn: true, mobs: [], pool: 0,
      npcs: ['rh_nixa', 'rh_gorvo', 'rh_krant', 'rh_tobble', 'rh_vessa', 'rh_riska', 'rh_zan', 'rh_mabbie', 'rh_snik'], vendor: 'rh_mabbie', gearVendor: 'rh_snik',
      links: { saltpenny_wharf: 8, thunderhowl_rise: 16, bloodsand_arena: 10, bonded_yard: 14, gadgetzan: 50 }, via: { gadgetzan: 'Goblin ship' } },
    saltpenny_wharf: { name: 'The Saltpenny Wharf', zone: 'The Vinewild', region: 'stranglethorn', scene: 'saltpenny_wharf', lvl: [35, 36], mobs: [['blackgull_skimmer', 5], ['surf_crawler', 4]], pool: 10, npcs: [], links: { rumhook_bay: 8, blackgull_cove: 16 } },
    thunderhowl_rise: { name: 'Thunderhowl Rise', zone: 'The Vinewild', region: 'stranglethorn', scene: 'thunderhowl_rise', lvl: [36, 37], mobs: [['thornback_gorilla', 5], ['thornback_bruiser', 3]], pool: 10, npcs: [], links: { rumhook_bay: 16, zul_kunda: 18, bonegrin_warcamp: 16 }, via: { zul_kunda: 'Jungle road north' } },
    blackgull_cove: { name: 'Blackgull Cove', zone: 'The Vinewild', region: 'stranglethorn', scene: 'blackgull_cove', lvl: [37, 38], mobs: [['blackgull_cutthroat', 5], ['blackgull_powder_monkey', 4]], named: { captain_brine: 150 }, pool: 10, npcs: [], links: { saltpenny_wharf: 16, bonded_yard: 18 } },
    bonegrin_warcamp: { name: 'The Bonegrin Warcamp', zone: 'The Vinewild', region: 'stranglethorn', scene: 'bonegrin_warcamp', lvl: [38, 39], mobs: [['bonegrin_raider', 5], ['bonegrin_hexbinder', 4]], named: { chieftain_grukka: 240 }, pool: 10, npcs: [], links: { thunderhowl_rise: 16, bonded_yard: 16 } },
    bonded_yard: { name: 'The Bonded Yard', zone: 'The Vinewild', region: 'stranglethorn', scene: 'bonded_yard', lvl: [39, 40], mobs: [['grey_hood_wharfguard', 5], ['ledger_tallyman', 4]], named: { factor_crane: 240 }, pool: 10, npcs: [], links: { blackgull_cove: 18, bonegrin_warcamp: 16, rumhook_bay: 14 } },
    bloodsand_arena: { name: 'The Bloodsand Arena', zone: 'The Vinewild', region: 'stranglethorn', scene: 'bloodsand_arena', lvl: [35, 40], mobs: [], pool: 0, npcs: [], links: { rumhook_bay: 10 } },
  });
  D.PLACES.zul_kunda.links.thunderhowl_rise = 18; D.PLACES.zul_kunda.via = Object.assign(D.PLACES.zul_kunda.via || {}, { thunderhowl_rise: 'Jungle road south' });
  D.PLACES.gadgetzan.links.rumhook_bay = 50; D.PLACES.gadgetzan.via = Object.assign(D.PLACES.gadgetzan.via || {}, { rumhook_bay: 'Goblin ship' });

  // people
  Object.assign(D.NPCS, {
    rh_nixa: { name: 'Harbourmaster Nixa Brightrivet', title: 'Rumhook Bay' },
    rh_gorvo: { name: 'Gorvo Saltpenny', title: 'Saltpenny Trading House' },
    rh_krant: { name: 'Dock Boss Krant', title: 'Saltpenny Wharf' },
    rh_tobble: { name: 'Old Tobble', title: 'Cooper' },
    rh_vessa: { name: 'Vessa Hidewright', title: 'Tanner' },
    rh_riska: { name: 'Riska Quickfuse', title: 'Road Warden' },
    rh_zan: { name: 'Lucky Zan', title: 'Bookmaker' },
    rh_mabbie: { name: 'Innkeeper Mabbie Fizzlecork', title: 'Innkeeper' },
    rh_snik: { name: 'Snik Rattlebolt', title: 'Arms Dealer' },
  });

  // quests
  const A = (id, q) => { q.faction = 'alliance'; D.QUESTS[id] = q; };
  const H = (id, q) => { q.faction = 'horde'; D.QUESTS[id] = q; };
  const Q = (id, q) => { D.QUESTS[id] = q; };
  // the way south, and the reports back (one thread per faction)
  A('rh_south_a', { name: 'South to Rumhook', lvl: 35, giver: 'lieutenant_doren', turnin: 'rh_nixa', text: 'Longfield\'s grain was seized for the Ledger and shipped south. The Regent wants to know who buys it. Take the jungle road past Mokkari to Rumhook Bay and ask the harbourmaster.',
    objs: [{ type: 'visit', place: 'rumhook_bay' }], reward: { money: 1400 } });
  H('rh_south_h', { name: 'South to Rumhook', lvl: 35, giver: 'commander_aggro', turnin: 'rh_nixa', text: 'The Ledger took grain carts from our farms too. Whatever banner you fly, they hold your debts. Find out who buys the grain. The goblin port of Rumhook Bay lies south, past Mokkari. Ask the harbourmaster.',
    objs: [{ type: 'visit', place: 'rumhook_bay' }], reward: { money: 1400 } });
  A('rh_report_a', { name: 'A Copy for the Lieutenant', lvl: 39, giver: 'rh_nixa', turnin: 'lieutenant_doren', pre: ['rh_bonded'], text: 'Your lieutenant sent you for answers. Take him a copy of the manifests. I keep the original. I am a harbourmaster, not a fool.',
    objs: [{ type: 'visit', place: 'rebel_camp' }], reward: { choice: ['fam_waist39'] } });
  H('rh_report_h', { name: 'A Copy for the Commander', lvl: 39, giver: 'rh_nixa', turnin: 'commander_aggro', pre: ['rh_bonded'], text: 'Your commander will want this. Take him a copy of the manifests. I keep the original. I am a harbourmaster, not a fool.',
    objs: [{ type: 'visit', place: 'grom_gol' }], reward: { choice: ['fam_waist39'] } });
  // the grain trail (main story, src/data/main_story.js)
  Q('rh_grain', { name: 'Where the Grain Goes', lvl: 35, giver: 'rh_nixa', turnin: 'rh_nixa', main: true, text: 'Every week another ship comes in from Longfield, low in the water, every sack under a Ledger seal. I tax what lands on my wharf, and the numbers do not add up. The skimmers on the Saltpenny Wharf cut the seals. Bring me 6 grain tags.',
    objs: [{ type: 'collect', item: 'grain_tag', n: 6 }], reward: { choice: ['fam_feet36'] } });
  Q('rh_short_weight', { name: 'Short Weight', lvl: 36, giver: 'rh_nixa', turnin: 'rh_nixa', pre: ['rh_grain'], main: true, text: 'The tags say four hundred sacks a ship. The warehouses count three hundred. The Blackgull take the rest off the wharf at night. Kill 10 skimmers and bring back 5 sacks.',
    objs: [{ type: 'kill', mob: 'blackgull_skimmer', n: 10 }, { type: 'collect', item: 'stolen_grain', n: 5 }], reward: { money: 2600 } });
  Q('rh_warm_coin', { name: 'Paid in Warm Coin', lvl: 37, giver: 'rh_nixa', turnin: 'rh_gorvo', pre: ['rh_short_weight'], main: true, text: 'The Saltpenny house buys every sack and pays the captains in coin I never minted. The Blackgull rob those captains on the way home. Take a purse off a cutthroat in Blackgull Cove and show it to Gorvo Saltpenny. See what he says.',
    objs: [{ type: 'collect', item: 'warm_purse', n: 1 }], reward: { choice: ['fam_weapon37'] } });
  Q('rh_bonded', { name: 'Bonded', lvl: 39, giver: 'rh_gorvo', turnin: 'rh_gorvo', pre: ['rh_warm_coin'], main: true, text: 'Warm, isn\'t it? I pay what the Ledger gives me to pay, and I buy what it tells me to buy. My house owes them more than this port is worth. The grain does not stay here. It goes to their Bonded Yard, and from there I do not ask. Their tallymen carry the manifests. Bring me 5.',
    objs: [{ type: 'kill', mob: 'grey_hood_wharfguard', n: 8 }, { type: 'collect', item: 'bonded_manifest', n: 5 }], reward: { choice: ['fam_chest38'] } });
  Q('rh_factor', { name: 'The Factor', lvl: 40, giver: 'rh_gorvo', turnin: 'rh_nixa', pre: ['rh_bonded'], main: true, text: 'Coppergulch, then over the sand to Cinderpeak. Food for thousands of diggers. The man who signs for it is the Ledger\'s factor, Simeon Crane. He keeps his own orders in the Bonded Yard. Bring them to the harbourmaster. I was never here.',
    objs: [{ type: 'collect', item: 'factor_order', n: 1 }], reward: { choice: ['fam_ring_rare40'] } });
  Q('rh_passage', { name: 'Passage South', lvl: 40, giver: 'rh_nixa', turnin: 'noggenfogger', pre: ['rh_factor'], main: true, text: 'The grain goes on to Coppergulch, and so does the coin. The mayor there finds warm coins in his own bazaar. Take the goblin ship and show him the factor\'s order.',
    objs: [{ type: 'visit', place: 'gadgetzan' }], reward: { money: 3000 } });
  // port life
  Q('rh_moorings', { name: 'Fouled Moorings', lvl: 35, giver: 'rh_krant', turnin: 'rh_krant', text: 'Surf crawlers nest in the mooring ropes and chew them through. Kill 10.',
    objs: [{ type: 'kill', mob: 'surf_crawler', n: 10 }], reward: { money: 2200 } });
  Q('rh_shells', { name: 'Shell Hoops', lvl: 36, giver: 'rh_tobble', turnin: 'rh_tobble', pre: ['rh_moorings'], text: 'A crawler shell makes the best barrel hoop there is. Bring me 8.',
    objs: [{ type: 'collect', item: 'crawler_shell', n: 8 }], reward: { choice: ['fam_wrist37'] } });
  Q('rh_hides', { name: 'Thornback Leather', lvl: 36, giver: 'rh_vessa', turnin: 'rh_vessa', text: 'Thornback hide takes a blade and keeps the rain out. Bring me 8 from the gorillas on Thunderhowl Rise.',
    objs: [{ type: 'collect', item: 'thornback_hide', n: 8 }], reward: { choice: ['fam_back38'] } });
  Q('rh_bruisers', { name: 'The Big Ones', lvl: 37, giver: 'rh_vessa', turnin: 'rh_vessa', pre: ['rh_hides'], text: 'The bruisers throw rocks at my hunters. Kill 10.',
    objs: [{ type: 'kill', mob: 'thornback_bruiser', n: 10 }], reward: { money: 2800 } });
  Q('rh_lost_hold', { name: 'The Lost Hold', lvl: 37, giver: 'rh_krant', turnin: 'rh_krant', pre: ['rh_moorings'], text: 'The Merry Debtor went down off Blackgull Cove with a full hold, and the powder monkeys dive for the crates. Bring me 6 before they open them all.',
    objs: [{ type: 'collect', item: 'sunken_crate', n: 6 }], reward: { choice: ['fam_legs38'] } });
  Q('rh_powder', { name: 'Damp Powder', lvl: 38, giver: 'rh_krant', turnin: 'rh_krant', pre: ['rh_lost_hold'], text: 'They mean to blow up my wharf. Kill 10 powder monkeys and 6 cutthroats.',
    objs: [{ type: 'kill', mob: 'blackgull_powder_monkey', n: 10 }, { type: 'kill', mob: 'blackgull_cutthroat', n: 6 }], reward: { money: 3000 } });
  Q('rh_wharf_rats', { name: 'Wharf Rats', lvl: 35, giver: 'rh_krant', turnin: 'rh_krant', text: 'Skimmers on my wharf every night, cutting seals and carrying sacks off like rats. Kill 12.',
    objs: [{ type: 'kill', mob: 'blackgull_skimmer', n: 12 }], reward: { money: 2200 } });
  Q('rh_night_watch', { name: 'Night Shift', lvl: 36, giver: 'rh_krant', turnin: 'rh_krant', pre: ['rh_wharf_rats'], text: 'Work a night shift with my dockers. Kill 8 skimmers and 8 crawlers before morning.',
    objs: [{ type: 'kill', mob: 'blackgull_skimmer', n: 8 }, { type: 'kill', mob: 'surf_crawler', n: 8 }], reward: { choice: ['fam_feet36'] } });
  Q('rh_black_sails', { name: 'Black Sails', lvl: 37, giver: 'rh_nixa', turnin: 'rh_nixa', pre: ['rh_short_weight'], text: 'The cutthroats in Blackgull Cove row out to every ship that comes in. Thin them out: kill 10.',
    objs: [{ type: 'kill', mob: 'blackgull_cutthroat', n: 10 }], reward: { money: 2800 } });
  Q('rh_rum', { name: 'Stolen Rum', lvl: 37, giver: 'rh_mabbie', turnin: 'rh_mabbie', text: 'The Blackgull stole my rum and drink it on my own beach. Bring me 6 casks back.',
    objs: [{ type: 'collect', item: 'rum_cask', n: 6 }], reward: { choice: ['fam_wrist37'] } });
  Q('rh_clear_road', { name: 'Clear the Road', lvl: 36, giver: 'rh_riska', turnin: 'rh_riska', text: 'Carts going north over Thunderhowl Rise get turned over by gorillas. Kill 12.',
    objs: [{ type: 'kill', mob: 'thornback_gorilla', n: 12 }], reward: { money: 2500 } });
  Q('rh_hexbinders', { name: 'Hexbinders', lvl: 39, giver: 'rh_riska', turnin: 'rh_riska', pre: ['rh_fetishes'], text: 'Every fetish you burn, they hang another. Go to the source: kill 10 hexbinders.',
    objs: [{ type: 'kill', mob: 'bonegrin_hexbinder', n: 10 }], reward: { choice: ['fam_legs38'] } });
  Q('rh_bonded_patrol', { name: 'Bonded Patrol', lvl: 40, giver: 'rh_nixa', turnin: 'rh_nixa', pre: ['rh_bonded'], text: 'The yard still runs without its paperwork. Make it run slower: 10 wharfguards and 8 tallymen.',
    objs: [{ type: 'kill', mob: 'grey_hood_wharfguard', n: 10 }, { type: 'kill', mob: 'ledger_tallyman', n: 8 }], reward: { money: 3600 } });
  Q('rh_bets', { name: 'Odds at the Arena', lvl: 36, giver: 'rh_zan', turnin: 'rh_zan', text: 'Every few hours the Bloodsand Arena opens and fighters beat each other for a chest. I take bets. Walk over and look at the pit, so you know what I am selling.',
    objs: [{ type: 'visit', place: 'bloodsand_arena' }], reward: { money: 1600 } });
  Q('wanted_brine', { name: 'Wanted: Captain Odda Brine', lvl: 38, giver: 'rh_nixa', turnin: 'rh_nixa', pre: ['rh_warm_coin'], group: 3, text: 'The Blackgull answer to Captain Odda Brine. She kept a page of every manifest she ever stole, to sell back. Bring me her spyglass and that page. Take friends; she has sunk better than you.',
    objs: [{ type: 'collect', item: 'brine_hook', n: 1 }, { type: 'collect', item: 'torn_manifest', n: 1 }], reward: { choice: ['fam_back_rare40'] } });
  // the Bonegrin of the south
  Q('rh_raiders', { name: 'Raiders on the Road', lvl: 38, giver: 'rh_riska', turnin: 'rh_riska', text: 'The Bonegrin raid the jungle road from their warcamp. Kill 10 raiders.',
    objs: [{ type: 'kill', mob: 'bonegrin_raider', n: 10 }], reward: { choice: ['fam_hands39'] } });
  Q('rh_fetishes', { name: 'Hex Fetishes', lvl: 38, giver: 'rh_riska', turnin: 'rh_riska', text: 'Their hexbinders hang fetishes on the road to curse the carts. Bring me 6.',
    objs: [{ type: 'collect', item: 'hex_fetish', n: 6 }], reward: { money: 3000 } });
  Q('rh_warcamp', { name: 'Break the Warcamp', lvl: 39, giver: 'rh_riska', turnin: 'rh_riska', pre: ['rh_raiders'], text: 'Push them back into the trees: 8 raiders and 6 hexbinders.',
    objs: [{ type: 'kill', mob: 'bonegrin_raider', n: 8 }, { type: 'kill', mob: 'bonegrin_hexbinder', n: 6 }], reward: { choice: ['fam_weapon40'] } });
  Q('rh_grukka', { name: 'Chieftain Grukka', lvl: 39, giver: 'rh_riska', turnin: 'rh_riska', pre: ['rh_warcamp'], text: 'Their chieftain, Grukka, swears he will eat the next goblin he catches. Bring me his tusk first.',
    objs: [{ type: 'collect', item: 'grukka_tusk', n: 1 }], reward: { money: 3400 } });

  // the Wanted captain (open-world elite, 3 players)
  Object.assign(D.ACTIVITIES, {
    brine: { name: 'Wanted: Captain Odda Brine', where: 'blackgull_cove', size: 3, minLvl: 37, maxLvl: 40, desc: 'Open-world elite in the Vinewild. 3 players.', boss: 'captain_brine',
      pulls: [{ scene: 'blackgull_cove', label: 'The beach', mobs: ['blackgull_cutthroat', 'blackgull_cutthroat'] }, { scene: 'blackgull_cove', label: 'The beach', mobs: ['blackgull_powder_monkey', 'blackgull_cutthroat'] }, { scene: 'blackgull_cove', label: 'Captain Odda Brine', mobs: ['captain_brine'], boss: true }] },
  });
})(typeof window !== 'undefined' ? window : globalThis);
