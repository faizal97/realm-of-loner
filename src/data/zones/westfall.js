// Longfield and Warrick's Rise (with The Smugglers' Deep): Accord, levels 10–16.
// Everything that lives in this zone: its places, creatures, people, quests and the items they drop.
// Links to other zones sit on the places themselves (place.links / place.via).
(function (root) {
  const D = root.D;
  D.zone('westfall', { name: 'Longfield', faction: 'alliance', music: 'longfield', town: 'longfield_town' });
  // items
  D.item('cruel_barb', { name: 'Cruel Barb', slot: 'weapon', wtype: 'sword', q: 3, lvl: 21, dmg: [24, 42], speed: 2.4, stats: { str: 8 }, icon: 'sword', sell: 1980, look: ['weapon', 'cruel_barb'], source: 'Corvin Blackwell, The Smugglers\' Deep' });
  D.item('cape_brotherhood', { name: 'Cape of the Brotherhood', slot: 'back', q: 3, lvl: 21, armor: 34, stats: { agi: 6, sta: 3 }, icon: 'cloak', sell: 1320, look: ['back', 'cape_brotherhood'], source: 'Corvin Blackwell, The Smugglers\' Deep' });
  D.item('smites_hammer', { name: "Smite's Mighty Hammer", slot: 'weapon', wtype: 'mace', q: 3, lvl: 20, dmg: [24, 42], speed: 2.8, stats: { str: 10, sta: 5 }, icon: 'mace', sell: 2200, look: ['weapon', 'smites_hammer'], source: 'Mr. Clobber, The Smugglers\' Deep' });
  D.item('thiefs_blade', { name: "Thief's Blade", slot: 'weapon', wtype: 'sword', q: 3, lvl: 20, dmg: [17, 31], speed: 1.9, stats: { agi: 8 }, icon: 'sword', sell: 1870, look: ['weapon', 'thiefs_blade'], source: 'Mr. Clobber, The Smugglers\' Deep' });
  D.item('cookies_rod', { name: "Crumbs's Stirring Rod", slot: 'weapon', wtype: 'staff', q: 3, lvl: 20, dmg: [26, 40], speed: 3, stats: { int: 10, spi: 6 }, sp: 16, icon: 'staff', sell: 1980, look: ['weapon', 'cookies_rod'], source: 'Crumbs, The Smugglers\' Deep' });
  D.item('cookies_tenderizer', { name: "Crumbs's Tenderizer", slot: 'weapon', wtype: 'mace', q: 3, lvl: 20, dmg: [19, 35], speed: 2.5, stats: { sta: 5, spi: 5 }, sp: 11, icon: 'mace', sell: 1980, look: ['weapon', 'cookies_tenderizer'], source: 'Crumbs, The Smugglers\' Deep' });
  D.item('smelting_pants', { name: 'Forgeman\'s Trousers', slot: 'legs', atype: 'mail', q: 3, lvl: 19, armor: 192, stats: { str: 6, sta: 6 }, icon: 'legs', sell: 1540, look: ['legs', 'smelting_pants'], source: 'Gimble, The Smugglers\' Deep' });
  D.item('buzzer_blade', { name: 'Buzzer Blade', slot: 'weapon', wtype: 'dagger', q: 3, lvl: 19, dmg: [13, 25], speed: 1.7, stats: { agi: 5, sta: 3 }, icon: 'dagger', sell: 1760, look: ['weapon', 'buzzer_blade'], source: "Snork's Shredder, The Smugglers' Deep" });
  D.item('gold_gloves', { name: 'Gold-flecked Gloves', slot: 'hands', atype: 'cloth', q: 3, lvl: 19, armor: 21, stats: { int: 6, spi: 5 }, sp: 6, icon: 'gloves', sell: 1100, source: "Snork's Shredder, The Smugglers' Deep" });
  D.item('lavish_ring', { name: 'Lavishly Jeweled Ring', slot: 'finger', q: 3, lvl: 19, stats: { int: 5, spi: 5, sta: 3 }, icon: 'ring', sell: 1540, source: 'Gimble, The Smugglers\' Deep' });
  D.item('foreman_belt', { name: "Foreman's Girdle", slot: 'waist', atype: 'mail', q: 3, lvl: 18, armor: 100, stats: { sta: 8 }, icon: 'belt', sell: 1100, source: "Rukko the Foreman, The Smugglers' Deep" });
  D.item('emberstone_staff', { name: 'Emberstone Staff', slot: 'weapon', wtype: 'staff', q: 3, lvl: 20, dmg: [30, 45], speed: 3.1, stats: { int: 8, sta: 5 }, sp: 19, icon: 'staff', sell: 2200, look: ['weapon', 'emberstone_staff'], source: 'Mr. Clobber, The Smugglers\' Deep' });
  D.item('corsair_shirt', { name: "Corsair's Overshirt", slot: 'chest', atype: 'cloth', q: 3, lvl: 20, armor: 51, stats: { int: 8, spi: 6 }, sp: 8, icon: 'chest_cloth', sell: 1540, look: ['chest', 'corsair_shirt'], source: 'Crumbs, The Smugglers\' Deep' });
  D.item('miners_bracers', { name: "Miner's Revenge Bracers", slot: 'wrist', atype: 'mail', q: 3, lvl: 18, armor: 83, stats: { str: 5, sta: 5 }, icon: 'bracers', sell: 1100, source: "Rukko the Foreman, The Smugglers' Deep" });
  D.item('handful_oats', { name: 'Handful of Oats', slot: 'quest', q: 1, icon: 'seed' });
  D.item('goretusk_liver', { name: 'Razorhog Liver', slot: 'quest', q: 1, icon: 'meat' });
  D.item('vulture_meat', { name: 'Stringy Vulture Meat', slot: 'quest', q: 1, icon: 'meat' });
  D.item('goretusk_snout', { name: 'Razorhog Snout', slot: 'quest', q: 1, icon: 'meat' });
  D.item('defias_bandana_wf', { name: 'Red Leather Bandana', slot: 'quest', q: 1, icon: 'bandana' });
  D.item('fleshripper_talon', { name: 'Bonepicker Talon', slot: 'quest', q: 1, icon: 'claw' });
  D.item('foe_reaper_core', { name: 'Grim Harvester Power Core', slot: 'quest', q: 1, icon: 'coin' });
  D.item('defias_orders', { name: 'Grey Hood Orders', slot: 'quest', q: 1, icon: 'journal' });
  D.item('reaper_scythe', { name: "Grim Harvester's Scythe", slot: 'weapon', wtype: 'staff', q: 3, lvl: 15, dmg: [26, 39], speed: 3.2, stats: { str: 6, sta: 4 }, icon: 'staff', sell: 1400, source: 'Grim Harvester 3000, Hartwell Farm' });
  D.item('riverpaw_paw', { name: 'Tallgrass Paw', slot: 'quest', q: 1, icon: 'claw' });
  D.item('swirling_sand', { name: 'Swirling Sand', slot: 'quest', q: 1, icon: 'dust' });
  D.item('tidehunter_scale', { name: 'Tidehunter Scale', slot: 'quest', q: 1, icon: 'fin' });

  // creatures
  Object.assign(D.MOBS, {
    defias_miner: { name: 'Grey Hood Miner', lvl: [17, 18], family: 'humanoid', drops: [['thieves_coin', 0.5], ['linen_cloth', 0.4]] },
    defias_pirate: { name: 'Grey Hood Pirate', lvl: [18, 19], family: 'humanoid', drops: [['thieves_coin', 0.5], ['linen_cloth', 0.4]] },
    goblin_engineer: { name: 'Goblin Engineer', lvl: [17, 18], family: 'humanoid', drops: [['thieves_coin', 0.5]] },
    rhahkzor: { name: "Rukko the Foreman", lvl: [18, 18], family: 'giant', boss: true, special: 'slam', aggro: 'Blackwell pay big for your heads!', loot: ['foreman_belt', 'miners_bracers', 'defias_belt'] },
    sneed_shredder: { name: "Snork's Shredder", lvl: [19, 19], family: 'mechanical', boss: true, special: 'whirl', loot: ['buzzer_blade', 'gold_gloves', 'defias_boots'] },
    gilnid: { name: 'Gimble', lvl: [19, 19], family: 'humanoid', boss: true, special: 'molten', aggro: 'Anyone want to take a break? Well too bad! Get to work you oafs!', loot: ['smelting_pants', 'lavish_ring', 'defias_leggings'] },
    mr_smite: { name: 'Mr. Clobber', lvl: [20, 20], family: 'humanoid', boss: true, special: 'smite', aggro: "We're under attack! Avast, ye swabs! Repel the invaders!", loot: ['smites_hammer', 'thiefs_blade', 'emberstone_staff'] },
    cookie: { name: 'Crumbs', lvl: [20, 20], family: 'murloc', boss: true, special: 'cook', aggro: 'Mrrglrrgl... blub!', loot: ['cookies_rod', 'cookies_tenderizer', 'corsair_shirt'] },
    vancleef: { name: 'Corvin Blackwell', lvl: [21, 21], family: 'humanoid', boss: true, special: 'vancleef', aggro: 'None may challenge the Brotherhood!', loot: ['cruel_barb', 'cape_brotherhood', 'defias_armor'], qdrops: [['vancleef_head', 1], ['unsent_letter', 1]] },
    blackguard: { name: 'Blackguard', lvl: [19, 19], family: 'humanoid', sprite: 'defias_pirate', drops: [] },
    young_goretusk: { name: 'Young Razorhog', lvl: [10, 11], family: 'beast', drops: [['boar_tusk', 0.4], ['ruined_pelt', 0.3]], qdrops: [['goretusk_liver', 0.55]] },
    goretusk: { name: 'Razorhog', lvl: [12, 13], family: 'beast', hpMult: 1.1, drops: [['boar_tusk', 0.45], ['ruined_pelt', 0.35]], qdrops: [['goretusk_liver', 0.55], ['goretusk_snout', 0.55]] },
    fleshripper: { name: 'Bonepicker', lvl: [10, 11], family: 'beast', drops: [['wolf_fang', 0.3]], qdrops: [['vulture_meat', 0.6], ['fleshripper_talon', 0.5]] },
    harvest_watcher: { name: 'Harvest Watcher', lvl: [11, 12], family: 'mechanical', hpMult: 1.1, drops: [['linen_cloth', 0.2]], qdrops: [['handful_oats', 0.6]], aggro: 'Intruder detected.' },
    defias_trapper: { name: 'Grey Hood Trapper', lvl: [11, 12], family: 'humanoid', drops: [['thieves_coin', 0.4], ['linen_cloth', 0.35]], qdrops: [['defias_bandana_wf', 0.45]], aggro: 'The Brotherhood sees all.' },
    defias_smuggler: { name: 'Grey Hood Smuggler', lvl: [12, 13], family: 'humanoid', drops: [['thieves_coin', 0.45], ['linen_cloth', 0.35]], qdrops: [['defias_bandana_wf', 0.45]], aggro: 'Nobody takes our goods!' },
    defias_pathstalker: { name: 'Grey Hood Pathstalker', lvl: [13, 14], family: 'humanoid', drops: [['thieves_coin', 0.5], ['linen_cloth', 0.35]], qdrops: [['defias_bandana_wf', 0.45], ['defias_orders', 0.2]], aggro: 'For Blackwell!' },
    murloc_coastrunner: { name: 'Mireling Coastrunner', lvl: [11, 12], family: 'murloc', drops: [['murloc_eye', 0.45]], aggro: 'Mrrglglgl!' },
    murloc_tidehunter: { name: 'Mireling Tidehunter', lvl: [13, 14], family: 'murloc', hpMult: 1.1, drops: [['murloc_eye', 0.5]], aggro: 'Aaaaughibbrgubugbugrguburgle!', qdrops: [['tidehunter_scale', 0.55]] },
    foe_reaper: { name: 'Grim Harvester 3000', lvl: [15, 15], family: 'mechanical', named: true, hpMult: 2.2, dmgMult: 1.35, drops: [['reaper_scythe', 0.35]], qdrops: [['foe_reaper_core', 1]], aggro: 'Harvest protocol engaged.' },
    riverpaw_brute: { name: 'Tallgrass Brute', lvl: [14, 15], family: 'humanoid', hpMult: 1.15, drops: [['gnoll_mane', 0.45], ['linen_cloth', 0.35]], qdrops: [['riverpaw_paw', 0.55]], aggro: 'Grrr... fresh meat!' },
    dust_devil: { name: 'Dust Devil', lvl: [14, 15], family: 'elemental', drops: [['linen_cloth', 0.1]], qdrops: [['swirling_sand', 0.6]] },
  });

  // places
  Object.assign(D.PLACES, {
    furlbrow_farm: { name: "Tuck's Pumpkin Farm", zone: 'Longfield', region: 'westfall', scene: 'furlbrow_farm', lvl: [10, 11], mobs: [['young_goretusk', 5], ['fleshripper', 4]], pool: 9, npcs: ['furlbrow', 'verna'], links: { goldshire: 30, saldean_farm: 14, sentinel_hill: 20 } },
    saldean_farm: { name: "Wenham Farm", zone: 'Longfield', region: 'westfall', scene: 'saldean_farm', lvl: [10, 12], mobs: [['harvest_watcher', 5], ['young_goretusk', 3], ['defias_trapper', 3]], pool: 10, npcs: ['saldean', 'salma'], links: { furlbrow_farm: 14, sentinel_hill: 16 } },
    sentinel_hill: { name: 'Warrick\'s Rise', zone: 'Longfield', region: 'westfall', scene: 'sentinel_hill', lvl: [10, 15], safe: true, inn: true, mobs: [], pool: 0, npcs: ['gryan', 'danuvin', 'galiaan', 'heather', 'lewis'], vendor: 'heather', gearVendor: 'lewis', links: { gold_coast_quarry: 18, moonbrook: 20, the_dead_acre: 22, furlbrow_farm: 20, saldean_farm: 16, jangolode_mine: 16, molsen_farm: 18, the_longshore: 18, dagger_hills: 20 } },
    jangolode_mine: { name: 'Copperseam Mine', zone: 'Longfield', region: 'westfall', scene: 'jangolode_mine', lvl: [11, 13], mobs: [['defias_smuggler', 5], ['defias_trapper', 4]], pool: 10, npcs: [], links: { sentinel_hill: 16 } },
    molsen_farm: { name: 'Hartwell Farm', zone: 'Longfield', region: 'westfall', scene: 'molsen_farm', lvl: [12, 14], mobs: [['harvest_watcher', 3], ['goretusk', 4], ['defias_pathstalker', 4]], named: { foe_reaper: 300 }, pool: 10, npcs: [], links: { sentinel_hill: 18 } },
    the_longshore: { name: 'The Saltstrand', zone: 'Longfield', region: 'westfall', scene: 'the_longshore', lvl: [11, 15], mobs: [['murloc_coastrunner', 5], ['murloc_tidehunter', 4], ['fleshripper', 2]], pool: 10, npcs: [], links: { gold_coast_quarry: 16, sentinel_hill: 18, dagger_hills: 16 } },
    dagger_hills: { name: 'The Flint Hills', zone: 'Longfield', region: 'westfall', scene: 'dagger_hills', lvl: [14, 16], mobs: [['riverpaw_brute', 5], ['dust_devil', 4]], pool: 10, npcs: [], links: { moonbrook: 16, sentinel_hill: 20, the_longshore: 16 } },
  });

  // people
  Object.assign(D.NPCS, {
    gryan: { name: 'Bram Oakhollow', title: "The Farmers' Watch" },
    danuvin: { name: 'Captain Merrow', title: 'Warrick\'s Rise' },
    galiaan: { name: 'Scout Linnet', title: 'Scout' },
    heather: { name: 'Innkeeper Bess', title: 'Innkeeper' },
    lewis: { name: 'Quartermaster Dunstan', title: 'Weaponsmith' },
    furlbrow: { name: 'Farmer Tuck', title: 'Farmer' },
    verna: { name: 'Mabel Tuck', title: 'Farmer' },
    saldean: { name: 'Farmer Wenham', title: 'Farmer' },
    salma: { name: 'Rose Wenham', title: 'Cook' },
  });

  // quests
  Object.assign(D.QUESTS, {
    poor_blanchy: { name: 'Poor Old Clover', lvl: 10, giver: 'verna', turnin: 'verna', text: 'Our old horse Old Clover is starving. The harvest watchers guard what oats are left in the fields. Bring me 8 handfuls.',
      objs: [{ type: 'collect', item: 'handful_oats', n: 8 }], reward: { money: 250 } },
    westfall_stew: { name: 'Longfield Stew', lvl: 10, giver: 'furlbrow', turnin: 'furlbrow', text: 'We lost everything but our stew pot. Bonepicker meat is stringy, but it fills a belly. Bring me 6.',
      objs: [{ type: 'collect', item: 'vulture_meat', n: 6 }], reward: { choice: ['fam_feet12'] } },
    goretusk_pie: { name: 'Razorhog Liver Pie', lvl: 10, giver: 'salma', turnin: 'salma', text: 'My liver pie keeps the militia on its feet. I need 8 razorhog livers.',
      objs: [{ type: 'collect', item: 'goretusk_liver', n: 8 }], reward: { money: 260 } },
    harvest_watchers: { name: 'Scarecrows of Steel', lvl: 11, giver: 'saldean', turnin: 'saldean', text: 'The Grey Hood built those harvest watchers to guard our own fields against us. Smash 8.',
      objs: [{ type: 'kill', mob: 'harvest_watcher', n: 8 }], reward: { choice: ['fam_wrist12'] } },
    peoples_militia: { name: "The Farmers' Watch", lvl: 11, giver: 'gryan', turnin: 'gryan', pre: ['report_gryan'], text: 'Grey Hood trappers watch the roads for travellers to rob. Show them the militia still stands: 10 trappers.',
      objs: [{ type: 'kill', mob: 'defias_trapper', n: 10 }], reward: { choice: ['fam_chest13'] } },
    fleshripper_talons: { name: 'Bonepicker Talons', lvl: 11, giver: 'lewis', turnin: 'lewis', text: 'Bonepicker talons make good arrowheads. Bring me 6 and I will find you a better weapon.',
      objs: [{ type: 'collect', item: 'fleshripper_talon', n: 6 }], reward: { choice: ['fam_weapon12'] } },
    jangolode: { name: 'The Copperseam Mine', lvl: 12, giver: 'danuvin', turnin: 'danuvin', text: 'The Grey Hood smuggle stolen ore out of the Copperseam Mine. Kill 10 smugglers.',
      objs: [{ type: 'kill', mob: 'defias_smuggler', n: 10 }], reward: { choice: ['fam_legs13'] } },
    red_bandanas: { name: 'Borrowed Hoods', lvl: 12, giver: 'danuvin', turnin: 'danuvin', text: 'Every Grey Hood wears a red bandana. My scouts need disguises. Bring me 12.',
      objs: [{ type: 'collect', item: 'defias_bandana_wf', n: 12 }], reward: { money: 380 } },
    coast_murlocs: { name: "Raiders from the Saltstrand", lvl: 12, giver: 'galiaan', turnin: 'galiaan', text: 'Mirelings from the Saltstrand raid the farms at night. Kill 10 coastrunners.',
      objs: [{ type: 'kill', mob: 'murloc_coastrunner', n: 10 }], reward: { choice: ['fam_hands14'] } },
    goretusk_snouts: { name: 'Razorhog Snouts', lvl: 13, giver: 'heather', turnin: 'heather', text: "Snout soup is the militia's favourite. The big razorhogs on Hartwell Farm have the best. Bring me 8.",
      objs: [{ type: 'collect', item: 'goretusk_snout', n: 8 }], reward: { money: 400 } },
    peoples_militia2: { name: "The Farmers' Watch (2)", lvl: 13, giver: 'gryan', turnin: 'gryan', pre: ['peoples_militia'], text: "The pathstalkers are the Brotherhood's eyes. Blind them: 10 pathstalkers on Hartwell Farm.",
      objs: [{ type: 'kill', mob: 'defias_pathstalker', n: 10 }], reward: { choice: ['fam_back14'] } },
    molsen_watchers: { name: 'Clearing Hartwell Farm', lvl: 13, giver: 'saldean', turnin: 'saldean', pre: ['harvest_watchers'], text: 'More watchers walk the Hartwell fields, and bigger razorhogs follow them. Kill 8 razorhogs there.',
      objs: [{ type: 'kill', mob: 'goretusk', n: 8 }], reward: { choice: ['fam_waist14'] } },
    tidehunters: { name: 'Tidehunters', lvl: 14, giver: 'galiaan', turnin: 'galiaan', pre: ['coast_murlocs'], text: 'The tidehunters lead the mireling raids. Kill 8 and the rest will scatter.',
      objs: [{ type: 'kill', mob: 'murloc_tidehunter', n: 8 }], reward: { choice: ['fam_legs13'] } },
    defias_orders: { name: 'The Grey Hood Orders', lvl: 14, giver: 'gryan', turnin: 'gryan', pre: ['peoples_militia2'], text: 'The pathstalkers carry written orders from their master. Bring me one and we will learn where the Brotherhood hides.',
      objs: [{ type: 'collect', item: 'defias_orders', n: 1 }], reward: { choice: ['fam_weapon15'] } },
    foe_reaper_q: { name: 'The Grim Harvester', lvl: 15, giver: 'gryan', turnin: 'gryan', text: 'A monstrous harvest golem, the Grim Harvester 4000, stalks Hartwell Farm. It is rarely seen. Destroy it and bring me its power core.',
      objs: [{ type: 'collect', item: 'foe_reaper_core', n: 1 }], reward: { choice: ['fam_ring_rare'] } },
    hills_scout: { name: 'The Flint Hills', lvl: 13, giver: 'galiaan', turnin: 'galiaan', text: 'Gnolls gather in the Flint Hills to the south. Scout the hills and come back alive.',
      objs: [{ type: 'visit', place: 'dagger_hills' }], reward: { money: 350 } },
    riverpaw_brutes: { name: 'The Tallgrass Brutes', lvl: 14, giver: 'danuvin', turnin: 'danuvin', text: 'Tallgrass brutes raid the southern farms. Kill 10 in the Flint Hills.',
      objs: [{ type: 'kill', mob: 'riverpaw_brute', n: 10 }], reward: { choice: ['fam_chest13'] } },
    dust_devils: { name: 'Dust Devils', lvl: 14, giver: 'saldean', turnin: 'saldean', text: 'Dust devils rip up what crops we have left. Break 6 of them apart.',
      objs: [{ type: 'kill', mob: 'dust_devil', n: 6 }], reward: { money: 420 } },
    tidehunter_scales: { name: 'Tidehunter Scales', lvl: 14, giver: 'lewis', turnin: 'lewis', text: 'Tidehunter scales make good armour plates. Bring me 8.',
      objs: [{ type: 'collect', item: 'tidehunter_scale', n: 8 }], reward: { choice: ['fam_wrist12'] } },
    swirling_sand: { name: 'Swirling Sand', lvl: 15, giver: 'heather', turnin: 'heather', text: 'The sand inside a dust devil never stops moving. A mage in Kingsmere pays well for it. Bring me 6 handfuls.',
      objs: [{ type: 'collect', item: 'swirling_sand', n: 6 }], reward: { money: 480 } },
    gnoll_paws: { name: 'Gnoll Paws', lvl: 15, giver: 'salma', turnin: 'salma', text: 'Proof of every gnoll you kill earns a bounty from the militia. Bring me 8 paws.',
      objs: [{ type: 'collect', item: 'riverpaw_paw', n: 8 }], reward: { choice: ['fam_hands14'] } },
    hills_patrol: { name: 'Patrolling the Hills', lvl: 15, giver: 'gryan', turnin: 'gryan', pre: ['hills_scout'], text: 'Keep the Flint Hills clear: 6 brutes and 4 dust devils.',
      objs: [{ type: 'kill', mob: 'riverpaw_brute', n: 6 }, { type: 'kill', mob: 'dust_devil', n: 4 }], reward: { choice: ['fam_waist14'] } },
    riverpaw_camp: { name: 'The Tallgrass Camp', lvl: 16, giver: 'danuvin', turnin: 'danuvin', pre: ['riverpaw_brutes'], text: 'Their main camp is in the hills. Break it: 12 brutes.',
      objs: [{ type: 'kill', mob: 'riverpaw_brute', n: 12 }], reward: { choice: ['fam_back14'] } },
  });

  // dungeons
  Object.assign(D.DUNGEONS, {
    deadmines: { music: 'smugglers_deep', name: 'The Smugglers\' Deep', minLvl: 17, par: 454, trialPar: 450, size: 5, trashMult: { hp: 2.2, dmg: 1.65 }, bossMult: { hp: 10, dmg: 3.6 }, trial: { trashMult: { hp: 2.2, dmg: 2.2 }, bossMult: { hp: 10, dmg: 4.8 } }, /* damage lowered to the dungeon target (#215: a fitted player wiped in 18-49% of runs, target 5-15%); Trials keep the numbers they were tuned on */ pulls: [{ scene: 'deadmines_mine', label: 'Mine tunnel', mobs: ['defias_miner', 'defias_miner'] }, { scene: 'deadmines_mine', label: 'Mine tunnel', mobs: ['defias_miner', 'goblin_engineer'] }, { scene: 'deadmines_mine', label: "Rukko the Foreman", mobs: ['rhahkzor'], boss: true }, { scene: 'deadmines_mine', label: 'Lumber mill', mobs: ['goblin_engineer', 'goblin_engineer', 'defias_miner'] }, { scene: 'deadmines_mine', label: "Snork's Shredder", mobs: ['sneed_shredder'], boss: true }, { scene: 'deadmines_mine', label: 'Foundry', mobs: ['goblin_engineer', 'defias_miner'] }, { scene: 'deadmines_mine', label: 'Gimble', mobs: ['gilnid'], boss: true }, { scene: 'deadmines_ship', label: 'The cove', mobs: ['defias_pirate', 'defias_pirate'] }, { scene: 'deadmines_ship', label: 'The cove', mobs: ['defias_pirate', 'defias_pirate', 'defias_pirate'] }, { scene: 'deadmines_ship', label: 'Mr. Clobber', mobs: ['mr_smite'], boss: true }, { scene: 'deadmines_ship', label: 'Crumbs', mobs: ['cookie'], boss: true }, { scene: 'deadmines_ship', label: 'Corvin Blackwell', mobs: ['vancleef'], boss: true }] },
  });

  // group finder
  Object.assign(D.ACTIVITIES, {
    deadmines: { name: 'The Smugglers\' Deep', dungeon: 'deadmines', where: 'moonbrook', size: 5, minLvl: 17, maxLvl: 21, desc: 'Dungeon under Fenwick. 5 players.' },
  });


  // ---- levels 15-20 (v2.1): the Gull Point Quarry, Fenwick and the Rustfield
  D.item('unsent_letter', { name: 'An Unsent Letter', slot: 'quest', q: 1, icon: 'journal' });
  D.item('quarry_ore', { name: 'Gull Point Ore', slot: 'quest', q: 1, icon: 'dust' });
  D.item('defias_ledger', { name: 'Quarry Ledger', slot: 'quest', q: 1, icon: 'journal' });
  D.item('furlbrow_deed', { name: "Tuck's Deed", slot: 'quest', q: 1, icon: 'journal' });
  D.item('moonbrook_insignia', { name: 'Fenwick Insignia', slot: 'quest', q: 1, icon: 'coin' });
  D.item('defias_letter', { name: 'Sealed Grey Hood Letter', slot: 'quest', q: 1, icon: 'journal' });
  D.item('overseer_whip', { name: 'Overseer Whip', slot: 'quest', q: 1, icon: 'belt' });
  D.item('golem_oil', { name: 'Golem Oil', slot: 'quest', q: 1, icon: 'venom' });
  D.item('golem_gear', { name: 'Rusted Golem Gear', slot: 'quest', q: 1, icon: 'coin' });
  D.item('brashclaw_banner', { name: "Mudjaw's War Banner", slot: 'quest', q: 1, icon: 'bandana' });
  D.item('brashclaw_cleaver', { name: "Mudjaw's Cleaver", slot: 'weapon', wtype: 'axe', q: 3, lvl: 18, dmg: [24, 37], speed: 2.6, stats: { str: 6, sta: 4 }, icon: 'axe', sell: 1700, source: 'Sergeant Mudjaw, the Rustfield' });
  Object.assign(D.MOBS, {
    defias_digger: { name: 'Grey Hood Digger', lvl: [15, 16], family: 'humanoid', drops: [['thieves_coin', 0.45], ['linen_cloth', 0.35]], qdrops: [['quarry_ore', 0.55], ['furlbrow_deed', 0.2]], aggro: 'Back to work... after I kill you.' },
    defias_overseer: { name: 'Grey Hood Overseer', lvl: [16, 17], family: 'humanoid', hpMult: 1.1, drops: [['thieves_coin', 0.5], ['linen_cloth', 0.35]], qdrops: [['defias_ledger', 0.5], ['overseer_whip', 0.5]], aggro: 'Nobody slacks on my watch!' },
    defias_knuckleduster: { name: 'Grey Hood Knuckleduster', lvl: [16, 17], family: 'humanoid', drops: [['thieves_coin', 0.5], ['linen_cloth', 0.35]], qdrops: [['moonbrook_insignia', 0.5]], aggro: 'Put your fists up!' },
    defias_highwayman: { name: 'Grey Hood Highwayman', lvl: [17, 18], family: 'humanoid', drops: [['thieves_coin', 0.55], ['linen_cloth', 0.35]], qdrops: [['moonbrook_insignia', 0.5], ['defias_letter', 0.15]], aggro: 'Your money or your life. Both, actually.' },
    rusty_harvest_golem: { name: 'Rusty Harvest Golem', lvl: [17, 18], family: 'mechanical', hpMult: 1.1, drops: [['linen_cloth', 0.15]], qdrops: [['golem_gear', 0.55], ['golem_oil', 0.5]], aggro: 'Harvest... protocol... restored.' },
    harvest_reaper: { name: 'Harvest Reaper', lvl: [18, 19], family: 'mechanical', hpMult: 1.15, drops: [['linen_cloth', 0.15]], qdrops: [['golem_gear', 0.55], ['golem_oil', 0.5]], aggro: 'Reaping sequence initiated.' },
    sergeant_brashclaw: { name: 'Sergeant Mudjaw', lvl: [18, 18], family: 'humanoid', named: true, hpMult: 2, dmgMult: 1.3, drops: [['brashclaw_cleaver', 0.35], ['gnoll_mane', 1]], qdrops: [['brashclaw_banner', 1]], aggro: 'Mudjaw takes your bones!' },
  });
  Object.assign(D.PLACES, {
    gold_coast_quarry: { name: 'Gull Point Quarry', zone: 'Longfield', region: 'westfall', scene: 'gold_coast_quarry', lvl: [15, 17], mobs: [['defias_digger', 5], ['defias_overseer', 4]], pool: 10, npcs: [], links: { sentinel_hill: 18, the_longshore: 16 } },
    moonbrook: { name: 'Fenwick', zone: 'Longfield', region: 'westfall', scene: 'moonbrook', lvl: [16, 19], mobs: [['defias_knuckleduster', 5], ['defias_highwayman', 4]], pool: 10, npcs: [], links: { sentinel_hill: 20, the_dead_acre: 16, dagger_hills: 16 } },
    the_dead_acre: { name: 'The Rustfield', zone: 'Longfield', region: 'westfall', scene: 'the_dead_acre', lvl: [17, 20], mobs: [['rusty_harvest_golem', 5], ['harvest_reaper', 4]], named: { sergeant_brashclaw: 300 }, pool: 10, npcs: [], links: { moonbrook: 16, sentinel_hill: 22 } },
  });
  Object.assign(D.QUESTS, {
    gold_coast_scout: { name: 'The Gull Point Quarry', lvl: 15, giver: 'galiaan', turnin: 'galiaan', text: 'The Grey Hood work a quarry on the coast north of the Saltstrand. Find it.',
      objs: [{ type: 'visit', place: 'gold_coast_quarry' }], reward: { money: 500 } },
    quarry_diggers: { name: 'Quarry Diggers', lvl: 15, giver: 'danuvin', turnin: 'danuvin', text: 'Every stone the Grey Hood dig out of the Gull Point Quarry pays for their war. Kill 12 diggers.',
      objs: [{ type: 'kill', mob: 'defias_digger', n: 12 }], reward: { choice: ['fam_feet17'] } },
    gold_coast_ore: { name: 'Gull Point Ore', lvl: 15, giver: 'lewis', turnin: 'lewis', text: 'The quarry ore is good iron. Bring me 8 and I will forge you something better.',
      objs: [{ type: 'collect', item: 'quarry_ore', n: 8 }], reward: { choice: ['fam_weapon17'] } },
    furlbrow_deed_q: { name: "Tuck's Deed", lvl: 15, giver: 'furlbrow', turnin: 'furlbrow', text: 'The Grey Hood stole the deed to my farm. One of their diggers at the quarry has it. Please bring it back.',
      objs: [{ type: 'collect', item: 'furlbrow_deed', n: 1 }], reward: { money: 600 } },
    quarry_overseers: { name: 'The Overseers', lvl: 16, giver: 'danuvin', turnin: 'danuvin', pre: ['quarry_diggers'], text: 'The overseers keep the diggers working. Kill 10.',
      objs: [{ type: 'kill', mob: 'defias_overseer', n: 10 }], reward: { choice: ['fam_wrist17'] } },
    quarry_ledgers: { name: 'The Quarry Ledgers', lvl: 16, giver: 'gryan', turnin: 'gryan', text: 'The overseers keep ledgers of where the ore goes. Bring me 6 and we will follow the money.',
      objs: [{ type: 'collect', item: 'defias_ledger', n: 6 }], reward: { money: 650 } },
    moonbrook_scout: { name: 'Fenwick', lvl: 16, giver: 'gryan', turnin: 'gryan', pre: ['defias_orders'], text: 'The orders point to Fenwick, the burned town to the south. Scout it and come back.',
      objs: [{ type: 'visit', place: 'moonbrook' }], reward: { money: 550 } },
    knuckledusters: { name: 'The Knuckledusters', lvl: 17, giver: 'danuvin', turnin: 'danuvin', text: 'Brawlers guard the streets of Fenwick. Kill 12 knuckledusters.',
      objs: [{ type: 'kill', mob: 'defias_knuckleduster', n: 12 }], reward: { choice: ['fam_chest18'] } },
    moonbrook_insignias: { name: 'Fenwick Insignias', lvl: 17, giver: 'heather', turnin: 'heather', text: 'Every Grey Hood in Fenwick wears their insignia. Bring me 10 and the militia will pay a bounty.',
      objs: [{ type: 'collect', item: 'moonbrook_insignia', n: 10 }], reward: { money: 700 } },
    dead_acre_scout: { name: 'The Rustfield', lvl: 17, giver: 'saldean', turnin: 'saldean', text: 'Past Fenwick lies the Rustfield, where old harvest golems still walk. See what the Grey Hood are building there.',
      objs: [{ type: 'visit', place: 'the_dead_acre' }], reward: { money: 550 } },
    rusty_golems: { name: 'Rust and Ruin', lvl: 17, giver: 'saldean', turnin: 'saldean', text: 'The rusty golems on the Rustfield trample what little grows there. Smash 12.',
      objs: [{ type: 'kill', mob: 'rusty_harvest_golem', n: 12 }], reward: { choice: ['fam_hands19'] } },
    highwaymen: { name: 'The Highwaymen', lvl: 18, giver: 'gryan', turnin: 'gryan', pre: ['moonbrook_scout'], text: 'Highwaymen rob every cart on the road through Fenwick. Kill 12.',
      objs: [{ type: 'kill', mob: 'defias_highwayman', n: 12 }], reward: { choice: ['fam_legs18'] } },
    golem_gears: { name: 'Golem Gears', lvl: 18, giver: 'lewis', turnin: 'lewis', text: 'The golems are built from stolen parts. Bring me 8 gears and we will see who is making them.',
      objs: [{ type: 'collect', item: 'golem_gear', n: 8 }], reward: { choice: ['fam_waist19'] } },
    defias_letter_q: { name: 'The Sealed Letter', lvl: 18, giver: 'gryan', turnin: 'gryan', pre: ['highwaymen'], text: "A highwayman carries a sealed letter for the Brotherhood's leader. Take it from them.",
      objs: [{ type: 'collect', item: 'defias_letter', n: 1 }], reward: { choice: ['fam_weapon20'] } },
    harvest_reapers: { name: 'The Harvest Reapers', lvl: 19, giver: 'saldean', turnin: 'saldean', pre: ['rusty_golems'], text: "The reapers are the Grey Hood' newest machines. Destroy 10 before they reach the farms.",
      objs: [{ type: 'kill', mob: 'harvest_reaper', n: 10 }], reward: { choice: ['fam_back19'] } },
    overseer_whips: { name: 'No More Whips', lvl: 17, giver: 'verna', turnin: 'verna', text: 'My brother works in that quarry now, under the lash. Bring me 8 overseer whips so I can burn them.',
      objs: [{ type: 'collect', item: 'overseer_whip', n: 8 }], reward: { money: 700 } },
    moonbrook_patrol: { name: 'Patrolling Fenwick', lvl: 18, giver: 'danuvin', turnin: 'danuvin', pre: ['knuckledusters'], text: 'Keep Fenwick off balance: 8 knuckledusters and 6 highwaymen.',
      objs: [{ type: 'kill', mob: 'defias_knuckleduster', n: 8 }, { type: 'kill', mob: 'defias_highwayman', n: 6 }], reward: { choice: ['fam_hands19'] } },
    golem_oil_q: { name: 'Oil for the Mill', lvl: 19, giver: 'salma', turnin: 'salma', text: 'The mill wheel squeaks worse than the golems. Their oil will do. Bring me 8 flasks.',
      objs: [{ type: 'collect', item: 'golem_oil', n: 8 }], reward: { money: 800 } },
    wanted_highwaymen: { name: 'Wanted: Highwaymen', lvl: 19, giver: 'galiaan', turnin: 'galiaan', pre: ['highwaymen'], text: 'The worst of the highwaymen still ride. Kill 10 more.',
      objs: [{ type: 'kill', mob: 'defias_highwayman', n: 10 }], reward: { choice: ['fam_waist19'] } },
    dead_acre_sweep: { name: 'Sweep the Rustfield', lvl: 20, giver: 'gryan', turnin: 'gryan', pre: ['harvest_reapers'], text: 'End the golem threat for good: 8 harvest reapers and 8 rusty golems.',
      objs: [{ type: 'kill', mob: 'harvest_reaper', n: 8 }, { type: 'kill', mob: 'rusty_harvest_golem', n: 8 }], reward: { choice: ['fam_chest18'] } },
    unsent_letter_q: { name: 'The Captain\'s Letter', lvl: 20, giver: 'gryan', turnin: 'gryan', pre: ['defias_letter_q'], dungeon: 'deadmines', text: "The sealed letter names Blackwell's ship in the Smugglers' Deep. End him, and bring me whatever he carries. Take friends: the group finder can help.",
      objs: [{ type: 'collect', item: 'unsent_letter', n: 1 }], reward: { choice: ['fam_back_rare20'] } },
    brashclaw_q: { name: 'Sergeant Mudjaw', lvl: 19, giver: 'galiaan', turnin: 'galiaan', text: 'A gnoll called Sergeant Mudjaw leads raids from the Rustfield. He is rarely seen. Bring me his war banner.',
      objs: [{ type: 'collect', item: 'brashclaw_banner', n: 1 }], reward: { choice: ['fam_ring_rare20'] } },
  });
})(typeof window !== 'undefined' ? window : globalThis);