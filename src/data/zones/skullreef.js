// EXPANSION "The Drowned Crown" (level 60). The Skullreef Isles are the Krugar side of the Stormveil Isle: Kessari and
// Reclaimed crews hold Bloodtide Landing. The drowned Wavebreaker trolls, who served the sea spirit Shal'zua, have risen with
// the isle. Also the Stormveil Reach (contested): the causeway out to the Tidecrown Citadel, where both sides meet.
(function (root) {
  const D = root.D;
  D.zone('skullreef', { name: 'Skullreef Isles', faction: 'horde', music: 'skullreef', town: 'skullreef_town' });
  D.zone('stormveil', { name: 'The Stormveil Reach', faction: 'contested', music: 'stormveil' });
  D.item('makrura_claw', { name: 'Makrura Claw', slot: 'quest', q: 1, icon: 'claw' });
  D.item('wavebreaker_fetish', { name: 'Wavebreaker Fetish', slot: 'quest', q: 1, icon: 'seed' });
  D.item('sailor_logbook', { name: 'Waterlogged Logbook', slot: 'quest', q: 1, icon: 'journal' });
  D.item('siren_feather', { name: 'Siren Feather', slot: 'quest', q: 1, icon: 'feather' });
  D.item('saltbones_hat', { name: "Captain Saltbones' Hat", slot: 'quest', q: 1, icon: 'bandana' });
  D.item('kragvesh_tusk', { name: "Krag'vesh's Tusk", slot: 'quest', q: 1, icon: 'tusk' });
  D.item('saltbones_cutlass', { name: "Saltbones' Cutlass", slot: 'weapon', wtype: 'sword', q: 3, lvl: 60, dmg: [64, 110], speed: 2.3, stats: { agi: 15, sta: 12 }, icon: 'sword', sell: 13000, source: 'Captain Saltbones, the Sunken Pier' });
  D.item('kragvesh_maul', { name: 'Reefbreaker Maul', slot: 'weapon', wtype: 'mace', q: 3, lvl: 60, dmg: [98, 146], speed: 3.3, stats: { str: 23, sta: 14 }, icon: 'mace', sell: 14000 });
  D.item('kragvesh_leather', { name: 'Sharkskin Jerkin', slot: 'chest', atype: 'leather', q: 3, lvl: 60, armor: 284, stats: { agi: 24, sta: 18 }, icon: 'chest_leather', sell: 13600 });
  D.item('kragvesh_cloak', { name: 'Kelp-Tangle Shroud', slot: 'back', q: 3, lvl: 60, armor: 84, stats: { int: 16, spi: 12 }, sp: 16, icon: 'cloak', sell: 13000 });

  Object.assign(D.MOBS, {
    reef_makrura: { name: 'Reef Makrura', lvl: [59, 60], family: 'beast', hpMult: 1.1, drops: [['light_leather', 0.2]], qdrops: [['makrura_claw', 0.55]] },
    drowned_wavebreaker: { name: 'Drowned Wavebreaker', lvl: [59, 60], family: 'undead', hpMult: 1.1, drops: [['thieves_coin', 0.5]], qdrops: [['wavebreaker_fetish', 0.45]], aggro: 'Shal\'zua wakes! Shal\'zua hungers!' },
    wavebreaker_hexer: { name: 'Wavebreaker Hexer', ranged: 'shadow', lvl: [60, 60], family: 'undead', drops: [['thieves_coin', 0.55], ['linen_cloth', 0.35]], qdrops: [['wavebreaker_fetish', 0.45]] },
    drowned_sailor: { name: 'Drowned Sailor', lvl: [59, 60], family: 'undead', drops: [['thieves_coin', 0.5], ['linen_cloth', 0.3]], qdrops: [['sailor_logbook', 0.5]] },
    grotto_siren: { name: 'Grotto Siren', lvl: [60, 60], family: 'humanoid', drops: [['thieves_coin', 0.5]], qdrops: [['siren_feather', 0.55]], aggro: 'Come closer, sailor...' },
    captain_saltbones: { name: 'Captain Saltbones', lvl: [60, 60], family: 'undead', named: true, hpMult: 2.2, dmgMult: 2.6, drops: [['saltbones_cutlass', 0.35], ['thieves_coin', 1]], qdrops: [['saltbones_hat', 1]], aggro: 'Yarr, fresh crew!' },
    kragvesh_the_tidebeast: { name: "Krag'vesh the Tidebeast", lvl: [60, 60], family: 'giant', elite: true, named: true, hpMult: 6.6, dmgMult: 2.6, special: 'slam', specialText: "Krag'vesh slams the reef!", drops: [['thieves_coin', 1]], qdrops: [['kragvesh_tusk', 1]], loot: ['kragvesh_maul', 'kragvesh_leather', 'kragvesh_cloak'] },
  });

  Object.assign(D.PLACES, {
    bloodtide_landing: { name: 'Bloodtide Landing', zone: 'Skullreef Isles', region: 'skullreef', faction: 'horde', scene: 'bloodtide_landing', lvl: [60, 60], safe: true, inn: true, mobs: [], pool: 0, npcs: ['shadow_hunter_zulkesh', 'deathstalker_voss', 'hexxer_mazu', 'trader_gikkix', 'armorer_krosh'], vendor: 'trader_gikkix', gearVendor: 'armorer_krosh',
      links: { coralbone_beach: 16, sunken_pier: 18, grom_gol: 60 }, via: { grom_gol: 'Bloodtide ship' } },
    coralbone_beach: { name: 'Coralbone Beach', zone: 'Skullreef Isles', region: 'skullreef', scene: 'coralbone_beach', lvl: [60, 60], mobs: [['reef_makrura', 7]], pool: 9, npcs: [], links: { bloodtide_landing: 16, screaming_grotto: 18 } },
    sunken_pier: { name: 'The Sunken Pier', zone: 'Skullreef Isles', region: 'skullreef', scene: 'sunken_pier', lvl: [60, 60], mobs: [['drowned_sailor', 7]], named: { captain_saltbones: 300 }, pool: 9, npcs: [], links: { bloodtide_landing: 18, loas_rest: 18 } },
    screaming_grotto: { name: 'The Screaming Grotto', zone: 'Skullreef Isles', region: 'skullreef', scene: 'screaming_grotto', lvl: [60, 60], mobs: [['grotto_siren', 6], ['reef_makrura', 2]], named: { kragvesh_the_tidebeast: 150 }, pool: 9, npcs: [], links: { coralbone_beach: 18, loas_rest: 18 } },
    loas_rest: { name: "Spirit's Rest", zone: 'Skullreef Isles', region: 'skullreef', scene: 'loas_rest', lvl: [60, 60], mobs: [['drowned_wavebreaker', 5], ['wavebreaker_hexer', 4]], pool: 10, npcs: [], links: { sunken_pier: 18, screaming_grotto: 18, temple_steps: 16, drowned_causeway: 20 } },
    temple_steps: { name: "Shal'zua's Steps", zone: 'Skullreef Isles', region: 'skullreef', faction: 'horde', scene: 'temple_steps', lvl: [60, 60], safe: true, mobs: [], pool: 0, npcs: [], links: { loas_rest: 16 } },
    drowned_causeway: { name: 'The Drowned Causeway', zone: 'The Stormveil Reach', region: 'stormveil', scene: 'drowned_causeway', lvl: [60, 60], mobs: [['tidebound_sentinel', 4], ['drowned_wavebreaker', 4]], pool: 8, npcs: [], links: { sael_anor_outskirts: 20, loas_rest: 20, tidecrown_gate: 18 } },
    tidecrown_gate: { gate: true, name: 'The Tidecrown Citadel', zone: 'The Stormveil Reach', region: 'stormveil', scene: 'tidecrown_gate', lvl: [60, 60], mobs: [['tidebound_sentinel', 3], ['tidebound_sorceress', 2]], pool: 5, npcs: [], links: { drowned_causeway: 18 } },
  });
  D.PLACES.grom_gol.links.bloodtide_landing = 60; D.PLACES.grom_gol.via.bloodtide_landing = 'Bloodtide ship';

  Object.assign(D.NPCS, {
    shadow_hunter_zulkesh: { name: "Shadow Hunter Zul'kesh", title: 'Kessari Expedition' },
    deathstalker_voss: { name: 'Gravestalker Maren Voss', title: 'Reclaimed Expedition' },
    hexxer_mazu: { name: 'Hexxer Mazu', title: 'Witch Doctor' },
    trader_gikkix: { name: 'Trader Gikkix', title: 'Supplies' },
    armorer_krosh: { name: 'Armorer Krosh', title: 'Weaponsmith' },
  });

  const H = (id, q) => { q.faction = 'horde'; D.QUESTS[id] = q; };
  H('x_to_skullreef', { name: 'The Drowned Crown', lvl: 60, storm: true, giver: 'thrall_herald', turnin: 'shadow_hunter_zulkesh', text: "An island has risen from the sea, and with the dragon dead the storm around it has broken. The Kessari say its reefs are full of their drowned ancestors. The High Chief wants the Krugar there first. Take the Bloodtide ship from Camp Skarn.",
    objs: [{ type: 'visit', place: 'bloodtide_landing' }], reward: { money: 4000 } });
  H('sr_makrura', { name: 'Coralbone Beach', lvl: 60, giver: 'shadow_hunter_zulkesh', turnin: 'shadow_hunter_zulkesh', text: 'Makrura crawl up the beach at night. Kill 12.',
    objs: [{ type: 'kill', mob: 'reef_makrura', n: 12 }], reward: { choice: ['fam_feet60'] } });
  H('sr_claws', { name: 'Makrura Claws', lvl: 60, giver: 'trader_gikkix', turnin: 'trader_gikkix', pre: ['sr_makrura'], text: 'Makrura claws sell well in Rumhook Bay. Bring me 8, I split the profit. Mostly.',
    objs: [{ type: 'collect', item: 'makrura_claw', n: 8 }], reward: { money: 9000 } });
  H('sr_sailors', { name: 'The Sunken Pier', lvl: 60, giver: 'deathstalker_voss', turnin: 'deathstalker_voss', text: 'Drowned sailors walk the old pier. Not ours, not Hollow Host. Something else raised them. Kill 12.',
    objs: [{ type: 'kill', mob: 'drowned_sailor', n: 12 }], reward: { choice: ['fam_wrist60'] } });
  H('sr_logbooks', { name: 'Waterlogged Logbooks', lvl: 60, giver: 'deathstalker_voss', turnin: 'deathstalker_voss', pre: ['sr_sailors'], text: 'Bring me 8 logbooks. I want to know which ships the sea took, and when.',
    objs: [{ type: 'collect', item: 'sailor_logbook', n: 8 }], reward: { choice: ['fam_back60'] } });
  H('sr_sirens', { name: 'The Screaming Grotto', lvl: 60, giver: 'hexxer_mazu', turnin: 'hexxer_mazu', text: 'The sirens sing our scouts into the water. Kill 10 and bring me 6 feathers. Mazu has a use for them.',
    objs: [{ type: 'kill', mob: 'grotto_siren', n: 10 }, { type: 'collect', item: 'siren_feather', n: 6 }], reward: { choice: ['fam_hands60'] } });
  H('sr_grotto_patrol', { name: 'Grotto Patrol', lvl: 60, giver: 'hexxer_mazu', turnin: 'hexxer_mazu', pre: ['sr_sirens'], text: '8 makrura and 8 sirens. Then the road is quiet.',
    objs: [{ type: 'kill', mob: 'reef_makrura', n: 8 }, { type: 'kill', mob: 'grotto_siren', n: 8 }], reward: { money: 9500 } });
  H('sr_wavebreakers', { name: 'The Drowned Tribe', lvl: 60, giver: 'shadow_hunter_zulkesh', turnin: 'shadow_hunter_zulkesh', text: "The Wavebreaker tribe drowned with this isle ten thousand years ago. Now they walk again, and they pray to a spirit that should be dead. Put 12 to rest.",
    objs: [{ type: 'kill', mob: 'drowned_wavebreaker', n: 12 }], reward: { choice: ['fam_legs60'] } });
  H('sr_fetishes', { name: 'Wavebreaker Fetishes', lvl: 60, giver: 'hexxer_mazu', turnin: 'hexxer_mazu', pre: ['sr_wavebreakers'], text: 'Their fetishes still hum with Shal\'zua\'s power. Bring me 8.',
    objs: [{ type: 'collect', item: 'wavebreaker_fetish', n: 8 }], reward: { money: 9500 } });
  H('sr_hexers', { name: 'The Hexers', lvl: 60, giver: 'shadow_hunter_zulkesh', turnin: 'shadow_hunter_zulkesh', pre: ['sr_wavebreakers'], text: "Their hexers lead the prayers. Kill 10.",
    objs: [{ type: 'kill', mob: 'wavebreaker_hexer', n: 10 }], reward: { choice: ['fam_chest60'] } });
  H('sr_loas_rest', { name: "Hold Spirit's Rest", lvl: 60, giver: 'shadow_hunter_zulkesh', turnin: 'shadow_hunter_zulkesh', pre: ['sr_hexers'], text: '8 wavebreakers and 6 hexers. Push them back to the causeway.',
    objs: [{ type: 'kill', mob: 'drowned_wavebreaker', n: 8 }, { type: 'kill', mob: 'wavebreaker_hexer', n: 6 }], reward: { choice: ['fam_waist60'] } });
  H('sr_causeway', { name: 'The Causeway', lvl: 60, giver: 'deathstalker_voss', turnin: 'deathstalker_voss', pre: ['sr_loas_rest'], text: 'Beyond Spirit\'s Rest a causeway runs out to a citadel in the surf. The Accord is already looking at it. Go and look first.',
    objs: [{ type: 'visit', place: 'drowned_causeway' }], reward: { money: 8000 } });
  H('sr_saltbones', { name: 'Captain Saltbones', lvl: 60, giver: 'deathstalker_voss', turnin: 'deathstalker_voss', text: 'A drowned captain still gives orders on the pier. Bring me his hat. It will look good on my wall.',
    objs: [{ type: 'collect', item: 'saltbones_hat', n: 1 }], reward: { choice: ['fam_ring_rare60'] } });
  H('sr_kragvesh', { name: "Wanted: Krag'vesh", lvl: 60, giver: 'shadow_hunter_zulkesh', turnin: 'shadow_hunter_zulkesh', group: 3, text: "A sea giant, Krag'vesh, lairs in the grotto and wrecks our boats. Bring me its tusk. Take friends.",
    objs: [{ type: 'collect', item: 'kragvesh_tusk', n: 1 }], reward: { choice: ['fam_back_rare60'] } });
  Object.assign(D.ACTIVITIES, {
    kragvesh: { name: "Wanted: Krag'vesh", where: 'screaming_grotto', size: 3, minLvl: 60, maxLvl: 60, desc: 'Open-world elite on the Skullreef Isles. 3 players.', boss: 'kragvesh_the_tidebeast', pulls: [{ scene: 'screaming_grotto', label: 'The grotto', mobs: ['grotto_siren', 'reef_makrura'] }, { scene: 'screaming_grotto', label: 'The grotto', mobs: ['grotto_siren', 'grotto_siren'] }, { scene: 'screaming_grotto', label: "Krag'vesh", mobs: ['kragvesh_the_tidebeast'], boss: true }] },
  });
})(typeof window !== 'undefined' ? window : globalThis);
