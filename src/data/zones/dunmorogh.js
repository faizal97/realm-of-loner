// Kaldvik, Rimefold Valley and Keldrun: Accord, levels 1–11.
// Everything that lives in this zone: its places, creatures, people, quests and the items they drop.
// Links to other zones sit on the places themselves (place.links / place.via).
(function (root) {
  const D = root.D;
  D.zone('dunmorogh', { name: 'Kaldvik', faction: 'alliance', music: 'kaldvik', town: 'kaldvik_town' });
  // items
  D.item('felix_journal', { name: "Nib's Journal", slot: 'quest', q: 1, icon: 'journal' });
  D.item('crag_boar_rib', { name: 'Crag Boar Rib', slot: 'quest', q: 1, icon: 'rib' });
  D.item('wendigo_mane', { name: 'Wendigo Mane', slot: 'quest', q: 1, icon: 'pelt' });
  D.item('restab_cog', { name: 'Gearhollow Cog', slot: 'quest', q: 1, icon: 'coin' });
  D.item('vagash_fang', { name: 'Fang of Snowfang', slot: 'quest', q: 1, icon: 'claw' });
  D.item('griknir_staff', { name: "Skrell's Frozen Staff", slot: 'weapon', wtype: 'staff', q: 3, lvl: 5, dmg: [7, 12], speed: 3, stats: { int: 3, spi: 2 }, sp: 3, icon: 'staff', sell: 150, source: "Skrell the Cold, Rimefold Valley", look: ['weapon', 'griknir_staff'] });
  D.item('icebeard_cloak', { name: "Rimehide's Shaggy Cloak", slot: 'back', q: 3, lvl: 9, armor: 18, stats: { sta: 3, str: 1, spi: 1 }, icon: 'cloak', sell: 380, source: 'Old Rimehide, the Rimebone Den', look: ['back', 'icebeard_cloak'] });
  D.item('vagash_claw', { name: 'Claw of Snowfang', slot: 'weapon', wtype: 'dagger', q: 3, lvl: 10, dmg: [8, 15], speed: 1.7, stats: { agi: 3, sta: 2 }, icon: 'dagger', sell: 700, source: 'Snowfang, Ranson Ranch', look: ['weapon', 'vagash_claw'] });
  D.item('frostmane_tusk', { name: 'Grimtooth Tusk', slot: 'quest', q: 1, icon: 'tusk' });
  D.item('ice_bear_pelt', { name: 'Ice Claw Pelt', slot: 'quest', q: 1, icon: 'pelt' });

  // creatures
  Object.assign(D.MOBS, {
    rockjaw_trogg: { name: 'Gravelmaw Cavekin', lvl: [1, 2], family: 'humanoid', drops: [['trogg_stone', 0.4], ['linen_cloth', 0.2]], aggro: 'Grrrr... mine!' },
    burly_rockjaw_trogg: { name: 'Burly Gravelmaw Cavekin', lvl: [3, 4], family: 'humanoid', drops: [['trogg_stone', 0.4], ['linen_cloth', 0.25]] },
    ragged_young_wolf: { name: 'Ragged Young Wolf', lvl: [1, 2], family: 'beast', drops: [['ruined_pelt', 0.35], ['wolf_fang', 0.25]], qdrops: [['wolf_meat', 0.75]] },
    small_crag_boar: { name: 'Small Crag Boar', lvl: [2, 3], family: 'beast', drops: [['ruined_pelt', 0.3]], qdrops: [['crag_boar_rib', 0.5]] },
    frostmane_troll_whelp: { name: 'Grimtooth Troll Whelp', lvl: [3, 4], family: 'humanoid', drops: [['troll_tusk', 0.35], ['linen_cloth', 0.25]], aggro: 'You be dead soon!' },
    grik_nir: { name: "Skrell the Cold", lvl: [5, 5], family: 'humanoid', named: true, hpMult: 1.7, dmgMult: 1.2, drops: [['troll_tusk', 1], ['griknir_staff', 0.35]], qdrops: [['felix_journal', 1]], aggro: 'The ice takes the careless!' },
    crag_boar: { name: 'Crag Boar', lvl: [5, 6], family: 'beast', drops: [['ruined_pelt', 0.4]], qdrops: [['crag_boar_rib', 0.55]] },
    young_wendigo: { name: 'Young Wendigo', lvl: [5, 6], family: 'yeti', drops: [['bear_hide', 0.3]], qdrops: [['wendigo_mane', 0.6]] },
    wendigo: { name: 'Wendigo', lvl: [7, 8], family: 'yeti', hpMult: 1.1, drops: [['bear_hide', 0.4]], qdrops: [['wendigo_mane', 0.65]] },
    old_icebeard: { name: 'Old Rimehide', lvl: [9, 9], family: 'yeti', named: true, hpMult: 1.9, dmgMult: 1.25, drops: [['bear_hide', 1], ['icebeard_cloak', 0.35]] },
    frostmane_troll: { name: 'Grimtooth Troll', lvl: [6, 7], family: 'humanoid', drops: [['troll_tusk', 0.4], ['linen_cloth', 0.3]], aggro: 'You be dead soon!', qdrops: [['frostmane_tusk', 0.55]] },
    frostmane_headhunter: { name: 'Grimtooth Headhunter', ranged: 'physical', lvl: [8, 9], family: 'humanoid', drops: [['troll_tusk', 0.45], ['linen_cloth', 0.3]], aggro: 'Your head be mine!' },
    frostmane_seer: { name: 'Grimtooth Seer', ranged: 'frost', lvl: [8, 9], family: 'humanoid', drops: [['troll_tusk', 0.4], ['linen_cloth', 0.35]] },
    elder_crag_boar: { name: 'Elder Crag Boar', lvl: [8, 9], family: 'beast', hpMult: 1.1, drops: [['ruined_pelt', 0.4]], qdrops: [['crag_boar_rib', 0.6]] },
    ice_claw_bear: { name: 'Ice Claw Bear', lvl: [8, 9], family: 'beast', hpMult: 1.15, drops: [['bear_hide', 0.4]], qdrops: [['ice_bear_pelt', 0.55]] },
    snow_leopard: { name: 'Snow Leopard', lvl: [8, 9], family: 'beast', drops: [['ruined_pelt', 0.4]] },
    leper_gnome: { name: 'Leper Gnome', lvl: [8, 10], family: 'humanoid', drops: [['linen_cloth', 0.4], ['thieves_coin', 0.3]], qdrops: [['restab_cog', 0.6]], aggro: 'Gearhollow will be ours again!' },
    vagash: { name: 'Snowfang', lvl: [11, 11], family: 'beast', elite: true, named: true, hpMult: 5.2, dmgMult: 2.5, drops: [['bear_hide', 1]], qdrops: [['vagash_fang', 1]], special: 'hogger', buster: { style: 'quick', name: 'Savage Maul', text: 'Snowfang rears up to maul!' }, loot: ['vagash_claw'] },
  });

  // places
  Object.assign(D.PLACES, {
    anvilmar: { name: 'Brunhall', zone: 'Rimefold Valley', region: 'dunmorogh', scene: 'coldridge_valley', lvl: [1, 3], mobs: [['rockjaw_trogg', 5], ['ragged_young_wolf', 5], ['small_crag_boar', 2], ['burly_rockjaw_trogg', 2]], pool: 10, npcs: ['sten', 'balir', 'talin', 'adlin'], vendor: 'adlin', links: { coldridge_cave: 12, kharanos: 30 } },
    coldridge_cave: { name: 'Grimtooth Cave', zone: 'Rimefold Valley', region: 'dunmorogh', scene: 'coldridge_cave', lvl: [3, 5], mobs: [['frostmane_troll_whelp', 8], ['burly_rockjaw_trogg', 2]], named: { grik_nir: 90 }, pool: 9, npcs: [], links: { anvilmar: 12 } },
    kharanos: { name: 'Bjornstad', zone: 'Kaldvik', region: 'dunmorogh', scene: 'kharanos', lvl: [5, 10], safe: true, inn: true, mobs: [], pool: 0, npcs: ['ragnar', 'belm', 'stonegear', 'senir', 'grawn'], vendor: 'belm', gearVendor: 'grawn', links: { anvilmar: 30, grizzled_den: 14, frostmane_hold: 16, amberstill_ranch: 18, ironforge: 20 } },
    grizzled_den: { name: 'The Rimebone Den', zone: 'Kaldvik', region: 'dunmorogh', scene: 'grizzled_den', lvl: [5, 8], mobs: [['young_wendigo', 6], ['wendigo', 4], ['crag_boar', 3]], named: { old_icebeard: 150 }, pool: 10, npcs: [], links: { kharanos: 14 } },
    frostmane_hold: { name: 'Grimtooth Hold', zone: 'Kaldvik', region: 'dunmorogh', scene: 'frostmane_hold', lvl: [7, 10], mobs: [['frostmane_troll', 5], ['frostmane_headhunter', 4], ['frostmane_seer', 3]], pool: 10, npcs: [], links: { kharanos: 16 } },
    amberstill_ranch: { name: 'Ranson Ranch', zone: 'Kaldvik', region: 'dunmorogh', scene: 'amberstill_ranch', lvl: [8, 11], mobs: [['elder_crag_boar', 5], ['ice_claw_bear', 4], ['snow_leopard', 4], ['leper_gnome', 3]], named: { vagash: 180 }, pool: 11, npcs: ['rudra'], links: { kharanos: 18 } },
    ironforge: { music: 'keldrun', name: 'Keldrun', zone: 'Keldrun', region: 'dunmorogh', scene: 'ironforge', lvl: [1, 60], safe: true, inn: true, city: true, mobs: [], pool: 0, npcs: ['firebrew', 'overspark', 'bruuk', 'mentor_alliance', 'banker_alliance', 'auctioneer_alliance'], vendor: 'firebrew', gearVendor: 'bruuk', links: { kharanos: 20, stormwind: 40 }, via: { stormwind: 'Underrail' } },
  });

  // people
  Object.assign(D.NPCS, {
    mentor_alliance: { name: 'Quartermaster Aldwin', title: 'Mentor Quartermaster' },
    banker_alliance: { name: 'Banker Olwen', title: 'Banker' }, auctioneer_alliance: { name: 'Auctioneer Redmuse', title: 'Auctioneer' },
    sten: { name: 'Arvid Halvarsson', title: 'Coldridge Guard' },
    balir: { name: 'Toke Ormsson', title: 'Mountaineer' },
    talin: { name: 'Sigrun Eyvindsdottir', title: 'Hunter' },
    adlin: { name: 'Ulf Bjarnason', title: 'Food & Drink' },
    ragnar: { name: 'Egil Maltsson', title: 'Brewmaster' },
    belm: { name: 'Innkeeper Gudrun', title: 'Innkeeper' },
    stonegear: { name: 'Pilot Nibby Sprocket', title: 'Gnomish Pilot' },
    senir: { name: 'Old Halstein', title: 'Mountaineer' },
    grawn: { name: 'Grim Torsson', title: 'Weaponsmith' },
    rudra: { name: 'Hilde Ranson', title: 'Rancher' },
    firebrew: { name: 'Innkeeper Solvi', title: 'Innkeeper' },
    overspark: { name: 'Tinkmaster Gizzlebolt', title: 'Master Tinker' },
    bruuk: { name: 'Knut Barlowsson', title: 'Weaponsmith' },
  });

  // quests
  Object.assign(D.QUESTS, {
    dwarven_outfitters: { name: 'Proper Gear', lvl: 2, giver: 'talin', turnin: 'talin', text: 'The young wolves are fat on our supplies. Bring me 8 Tough Wolf Meat and I can make you some proper gear.',
      objs: [{ type: 'collect', item: 'wolf_meat', n: 8 }], reward: { choice: ['fam_chest'] } },
    a_new_threat: { name: 'Cavekin at the Door', lvl: 2, giver: 'balir', turnin: 'balir', text: 'Gravelmaw cavekin are crawling up out of the earth all over the valley. Kill 10 of them before they reach Brunhall.',
      objs: [{ type: 'kill', mob: 'rockjaw_trogg', n: 10 }], reward: { choice: ['fam_legs'] } },
    the_troll_cave: { name: 'Whelps in the Cave', lvl: 4, giver: 'sten', turnin: 'sten', pre: ['a_new_threat'], text: 'Grimtooth trolls have holed up in the cave to the west. Thin out 12 of their whelps.',
      objs: [{ type: 'kill', mob: 'frostmane_troll_whelp', n: 12 }], reward: { choice: ['fam_feet'] } },
    stolen_journal: { name: 'Nib\'s Journal', lvl: 5, giver: 'sten', turnin: 'sten', pre: ['the_troll_cave'], text: "Their chief, Skrell the Cold, stole Nib's journal. Get it back from the back of the cave.",
      objs: [{ type: 'collect', item: 'felix_journal', n: 1 }], reward: { choice: ['fam_weapon5'] } },
    report_kharanos: { name: "Word for Old Halstein", lvl: 5, giver: 'sten', turnin: 'senir', text: 'Take word of the trolls east through the pass to Old Halstein in Bjornstad.',
      objs: [{ type: 'visit', place: 'kharanos' }], reward: {} },
    beer_basted_ribs: { name: 'Ribs for the Taproom', lvl: 6, giver: 'ragnar', turnin: 'ragnar', text: 'Nothing goes with Maltsson like crag boar ribs. Bring me 6 and I will pour you a round.',
      objs: [{ type: 'collect', item: 'crag_boar_rib', n: 6 }], reward: { choice: ['fam_hands'] } },
    grizzled_den_q: { name: 'The Rimebone Den', lvl: 7, giver: 'stonegear', turnin: 'stonegear', text: 'Wendigo manes make the best engine insulation. Get me 8 from the Rimebone Den.',
      objs: [{ type: 'collect', item: 'wendigo_mane', n: 8 }], reward: { choice: ['fam_wrist'] } },
    frostmane_hold_q: { name: 'Grimtooth Hold', lvl: 8, giver: 'senir', turnin: 'senir', pre: ['report_kharanos'], text: 'Scout Grimtooth Hold to the west and take down 5 of their headhunters.',
      objs: [{ type: 'visit', place: 'frostmane_hold' }, { type: 'kill', mob: 'frostmane_headhunter', n: 5 }], reward: { choice: ['fam_back'] } },
    recombobulation: { name: 'Cogs for Gearhollow', lvl: 8, giver: 'overspark', turnin: 'overspark', text: 'The poor leper gnomes carry parts we need to take Gearhollow back. Recover 8 Gearhollow Cogs.',
      objs: [{ type: 'collect', item: 'restab_cog', n: 8 }], reward: { choice: ['fam_waist'] } },
    mountaineers_hunt: { name: 'Hunting the Ranch', lvl: 9, giver: 'rudra', turnin: 'rudra', text: 'Bears and leopards are taking my rams. Kill 6 Ice Claw Bears and 6 Snow Leopards.',
      objs: [{ type: 'kill', mob: 'ice_claw_bear', n: 6 }, { type: 'kill', mob: 'snow_leopard', n: 6 }], reward: { choice: ['fam_chest9'] } },
    protecting_herd: { name: 'The Herd Killer', lvl: 11, giver: 'rudra', turnin: 'rudra', group: 3, text: 'A huge mountain lion called Snowfang has killed half my herd. Bring me his fang. Bring friends.',
      objs: [{ type: 'collect', item: 'vagash_fang', n: 1 }], reward: { choice: ['militia'] } },
    wendigo_cull: { name: 'The Wendigo Problem', lvl: 5, giver: 'belm', turnin: 'belm', text: 'Young wendigos come down from the Rimebone Den and scare off my regulars. Put down 8 of them.',
      objs: [{ type: 'kill', mob: 'young_wendigo', n: 8 }], reward: { money: 90 } },
    frostmane_tusks: { name: 'Grimtooth Tusks', lvl: 6, giver: 'grawn', turnin: 'grawn', text: 'Troll tusk makes a fine grip for an axe. Bring me 6 from the Grimtooth trolls and I will make you a weapon.',
      objs: [{ type: 'collect', item: 'frostmane_tusk', n: 6 }], reward: { choice: ['fam_weapon5'] } },
    troll_scouting: { name: 'Troll Trouble', lvl: 6, giver: 'senir', turnin: 'senir', pre: ['report_kharanos'], text: 'The Grimtooth push closer to Bjornstad every day. Show them we bite back. Kill 8 Grimtooth Trolls.',
      objs: [{ type: 'kill', mob: 'frostmane_troll', n: 8 }], reward: { choice: ['fam_hands'] } },
    boar_hunt: { name: 'Boar Season', lvl: 6, giver: 'ragnar', turnin: 'ragnar', text: 'The crag boars are trampling my barley. Hunt 8 of them. The ribs are yours to keep.',
      objs: [{ type: 'kill', mob: 'crag_boar', n: 8 }], reward: { money: 110 } },
    ice_claw_pelts: { name: 'Ice Claw Pelts', lvl: 8, giver: 'stonegear', turnin: 'stonegear', text: 'Ice Claw pelts keep the cold out of the engine house. The bears roam near Ranson Ranch. Bring me 6.',
      objs: [{ type: 'collect', item: 'ice_bear_pelt', n: 6 }], reward: { choice: ['fam_waist'] } },
    frostmane_seers: { name: 'Seers of the Grimtooth', lvl: 9, giver: 'senir', turnin: 'senir', pre: ['troll_scouting'], text: 'Their seers keep the Grimtooth fighting. Without them the rest will scatter. Kill 6.',
      objs: [{ type: 'kill', mob: 'frostmane_seer', n: 6 }], reward: { choice: ['fam_legs9'] } },
    elder_boars: { name: 'The Elder Boars', lvl: 9, giver: 'belm', turnin: 'belm', text: 'The old crag boars near Ranson are too tough for my hunters. Bring down 8 elders.',
      objs: [{ type: 'kill', mob: 'elder_crag_boar', n: 8 }], reward: { money: 220 } },
    leper_gnomes: { name: 'A Sad Duty', lvl: 10, giver: 'grawn', turnin: 'grawn', text: 'Leper gnomes from Gearhollow wander the ranch roads, and they are not who they were. End it for 8 of them.',
      objs: [{ type: 'kill', mob: 'leper_gnome', n: 8 }], reward: { choice: ['fam_hands9'] } },
    westfall_dunmorogh: { name: 'Longfield Needs You', lvl: 10, giver: 'senir', turnin: 'gryan', text: 'Kingsmere asks for help in Longfield. Take the Underrail from Keldrun to Kingsmere, head south through Brackenford, then west, and report to Bram Oakhollow at Warrick\'s Rise.',
      objs: [{ type: 'visit', place: 'sentinel_hill' }], reward: {} },
  });

  // group finder
  Object.assign(D.ACTIVITIES, {
    vagash: { name: 'The Herd Killer: Snowfang', where: 'amberstill_ranch', size: 3, minLvl: 8, maxLvl: 12, desc: 'Open-world elite in Kaldvik. 3 players.', boss: 'vagash', pulls: [{ scene: 'amberstill_ranch', label: 'The ranch', mobs: ['snow_leopard', 'snow_leopard'] }, { scene: 'amberstill_ranch', label: 'The ranch', mobs: ['ice_claw_bear', 'elder_crag_boar'] }, { scene: 'amberstill_ranch', label: 'Snowfang', mobs: ['vagash'], boss: true }] },
  });

})(typeof window !== 'undefined' ? window : globalThis);