// Ferndeep: contested, levels 44–50 (v6). Starfeather Hold (Accord) and Camp Ruga (Krugar); the road north
// leads to the gate of The Gemfall Caves in Mournwaste. Windgorge joins it to Sirocco.
(function (root) {
  const D = root.D;
  D.zone('feralas', { name: 'Ferndeep', faction: 'contested', music: 'ferndeep', town: 'ferndeep_town' });
  D.item('hippogryph_feather', { name: 'Tatterwing Plume', slot: 'quest', q: 1, icon: 'feather' });
  D.item('woodpaw_mane', { name: 'Mossgut Mane', slot: 'quest', q: 1, icon: 'pelt' });
  D.item('gordunni_scroll', { name: 'Stonegut Scroll', slot: 'quest', q: 1, icon: 'journal' });
  D.item('ogre_tusk_f', { name: 'Stonegut Tusk', slot: 'quest', q: 1, icon: 'tusk' });
  D.item('hatecrest_scale', { name: 'Spitecoil Scale', slot: 'quest', q: 1, icon: 'fin' });
  D.item('siren_coral', { name: "Siren's Coral", slot: 'quest', q: 1, icon: 'seed' });
  D.item('longtooth_pelt', { name: 'Greymuzzle Pelt', slot: 'quest', q: 1, icon: 'pelt' });
  D.item('walker_bark', { name: 'Ancient Bark', slot: 'quest', q: 1, icon: 'moss' });
  D.item('rathtalon_talon', { name: "Hisk's Talon", slot: 'quest', q: 1, icon: 'claw' });
  D.item('grizzlegut_hide', { name: "Bramblebelly's Hide", slot: 'quest', q: 1, icon: 'pelt' });
  D.item('shalzaru_crown', { name: "Nazzir's Crown", slot: 'quest', q: 1, icon: 'ring' });
  D.item('rathtalon_cloak', { name: 'Black Plume Cloak', slot: 'back', q: 3, lvl: 48, armor: 62, stats: { agi: 11, sta: 10 }, icon: 'cloak', sell: 7600, source: 'Sister Hisk, Tatterwing Highlands' });
  D.item('grizzlegut_maul', { name: "Bramblebelly's Paw", slot: 'weapon', wtype: 'mace', q: 3, lvl: 47, dmg: [58, 96], speed: 2.8, stats: { str: 15, sta: 10 }, icon: 'mace', sell: 7800, source: 'Old Bramblebelly, the Lower Wilds' });
  // v10.6: Wanted: Old Rotmaw (44-47), the Mossgut chieftain
  D.item('rotmaw_tooth', { name: "Old Rotmaw's Tusk", slot: 'quest', q: 1, icon: 'pelt' });
  D.item('rotmaw_axe', { name: 'Rotmaw Cleaver', slot: 'weapon', wtype: 'axe', q: 3, lvl: 47, dmg: [58, 96], speed: 2.7, stats: { str: 15, sta: 10 }, icon: 'axe', sell: 7800 });
  D.item('rotmaw_leggings', { name: 'Mossgut Hide Leggings', slot: 'legs', atype: 'leather', q: 3, lvl: 47, armor: 182, stats: { agi: 15, sta: 11 }, icon: 'legs', sell: 7700 });
  D.item('rotmaw_wraps', { name: 'Bone-Reader Wraps', slot: 'hands', atype: 'cloth', q: 3, lvl: 47, armor: 60, stats: { int: 12, spi: 9 }, sp: 14, icon: 'gloves', sell: 7400 });
  D.item('shalzaru_blade', { name: "Nazzir's Sword", slot: 'weapon', wtype: 'sword', q: 3, lvl: 50, dmg: [62, 102], speed: 2.6, stats: { agi: 15, str: 11 }, icon: 'sword', sell: 8800 });
  D.item('shalzaru_robe', { name: 'Robe of the Tides', slot: 'chest', atype: 'cloth', q: 3, lvl: 50, armor: 106, stats: { int: 18, spi: 13 }, sp: 22, icon: 'chest_cloth', sell: 8700 });
  D.item('shalzaru_mail', { name: 'Spitecoil Scale Armor', slot: 'chest', atype: 'mail', q: 3, lvl: 50, armor: 410, stats: { str: 18, sta: 15 }, icon: 'chest_mail', sell: 8900 });

  Object.assign(D.MOBS, {
    frayfeather_stagwing: { name: 'Tatterwing Stagwing', lvl: [44, 45], family: 'beast', drops: [['ruined_pelt', 0.35]], qdrops: [['hippogryph_feather', 0.55]] },
    frayfeather_skystormer: { name: 'Tatterwing Skystormer', lvl: [45, 46], family: 'beast', drops: [['ruined_pelt', 0.35]], qdrops: [['hippogryph_feather', 0.5]] },
    woodpaw_reaver: { name: 'Mossgut Reaver', lvl: [45, 46], family: 'humanoid', hpMult: 1.1, drops: [['gnoll_mane', 0.45], ['linen_cloth', 0.3]], qdrops: [['woodpaw_mane', 0.55]], aggro: 'Mossgut kill!' },
    woodpaw_mystic: { name: 'Mossgut Mystic', ranged: 'nature', lvl: [46, 47], family: 'humanoid', drops: [['gnoll_mane', 0.4], ['linen_cloth', 0.35]], qdrops: [['woodpaw_mane', 0.4]], aggro: 'Bones say die!' },
    gordunni_ogre: { name: 'Stonegut Ogre', lvl: [46, 47], family: 'giant', hpMult: 1.2, drops: [['thieves_coin', 0.55], ['linen_cloth', 0.3]], qdrops: [['ogre_tusk_f', 0.55]], aggro: 'Stonegut crush!' },
    gordunni_mage_lord: { name: 'Stonegut Mage-Lord', ranged: 'arcane', lvl: [47, 48], family: 'giant', hpMult: 1.1, drops: [['thieves_coin', 0.55], ['linen_cloth', 0.35]], qdrops: [['gordunni_scroll', 0.45]], aggro: 'We read the scrolls! Now we burn you!' },
    hatecrest_warrior: { name: 'Spitecoil Warrior', lvl: [47, 48], family: 'humanoid', hpMult: 1.1, drops: [['murloc_eye', 0.3], ['thieves_coin', 0.5]], qdrops: [['hatecrest_scale', 0.55]], aggro: 'The coast belongs to the naga!' },
    hatecrest_siren: { name: 'Spitecoil Siren', lvl: [48, 49], family: 'humanoid', drops: [['murloc_eye', 0.3], ['thieves_coin', 0.5]], qdrops: [['siren_coral', 0.45], ['hatecrest_scale', 0.3]], aggro: 'Listen to my song... and drown.' },
    longtooth_runner: { name: 'Greymuzzle Runner', lvl: [48, 49], family: 'beast', drops: [['ruined_pelt', 0.4]], qdrops: [['longtooth_pelt', 0.55]] },
    wandering_forest_walker: { name: 'Wandering Forest Walker', lvl: [49, 50], family: 'elemental', hpMult: 1.25, drops: [['trogg_stone', 0.2]], qdrops: [['walker_bark', 0.55]] },
    sister_rathtalon: { name: 'Sister Hisk', lvl: [48, 48], family: 'humanoid', named: true, hpMult: 2.2, dmgMult: 1.35, drops: [['rathtalon_cloak', 0.35], ['linen_cloth', 1]], qdrops: [['rathtalon_talon', 1]], aggro: 'The highlands are my hunting ground!' },
    old_grizzlegut: { name: 'Old Bramblebelly', lvl: [47, 47], family: 'beast', named: true, hpMult: 2.2, dmgMult: 1.35, drops: [['grizzlegut_maul', 0.35], ['ruined_pelt', 1]], qdrops: [['grizzlegut_hide', 1]] },
    rotmaw: { name: 'Old Rotmaw', sprite: 'woodpaw_reaver', lvl: [47, 47], family: 'humanoid', elite: true, named: true, hpMult: 5.5, dmgMult: 2.6, special: 'slam', specialText: 'Old Rotmaw brings his cleaver down!', drops: [['gnoll_mane', 1]], qdrops: [['rotmaw_tooth', 1]], loot: ['rotmaw_axe', 'rotmaw_leggings', 'rotmaw_wraps'], aggro: 'Rotmaw eat you!' },
    lord_shalzaru: { name: 'Lord Nazzir', lvl: [50, 50], family: 'humanoid', elite: true, named: true, hpMult: 5.5, dmgMult: 2.6, special: 'whirl', specialText: 'Lord Nazzir whirls his four blades!', drops: [['thieves_coin', 1]], qdrops: [['shalzaru_crown', 1]], loot: ['shalzaru_blade', 'shalzaru_robe', 'shalzaru_mail'], aggro: 'The tide rises for you!' },
  });

  Object.assign(D.PLACES, {
    feathermoon_stronghold: { name: 'Starfeather Hold', zone: 'Ferndeep', region: 'feralas', faction: 'alliance', scene: 'feathermoon_stronghold', lvl: [44, 50], safe: true, inn: true, mobs: [], pool: 0, npcs: ['shandris', 'latronicus', 'innkeeper_shyria', 'vivianna'], vendor: 'innkeeper_shyria', gearVendor: 'vivianna',
      links: { frayfeather_highlands: 20, the_forgotten_coast: 16, darnassus: 60 }, via: { darnassus: 'Hippogryph' } },
    camp_mojache: { name: 'Camp Ruga', zone: 'Ferndeep', region: 'feralas', faction: 'horde', scene: 'camp_mojache', lvl: [44, 50], safe: true, inn: true, mobs: [], pool: 0, npcs: ['hadoken', 'orwin', 'innkeeper_greul', 'krueg'], vendor: 'innkeeper_greul', gearVendor: 'krueg',
      links: { woodpaw_hills: 16, gordunni_outpost: 18, lower_wilds: 20, thunder_bluff: 55 }, via: { thunder_bluff: 'Wind Rider' } },
    frayfeather_highlands: { name: 'Tatterwing Highlands', zone: 'Ferndeep', region: 'feralas', scene: 'frayfeather_highlands', lvl: [44, 46], mobs: [['frayfeather_stagwing', 5], ['frayfeather_skystormer', 4]], named: { sister_rathtalon: 300 }, pool: 10, npcs: [], links: { feathermoon_stronghold: 20, woodpaw_hills: 18, lower_wilds: 20 } },
    woodpaw_hills: { name: 'Mossgut Hills', zone: 'Ferndeep', region: 'feralas', scene: 'woodpaw_hills', lvl: [45, 47], mobs: [['woodpaw_reaver', 5], ['woodpaw_mystic', 4]], named: { rotmaw: 150 }, pool: 10, npcs: [], links: { camp_mojache: 16, frayfeather_highlands: 18, maraudon_gate: 35 }, via: { maraudon_gate: 'Road to Mournwaste' } },
    gordunni_outpost: { name: 'Stonegut Outpost', zone: 'Ferndeep', region: 'feralas', scene: 'gordunni_outpost', lvl: [46, 48], mobs: [['gordunni_ogre', 5], ['gordunni_mage_lord', 4]], pool: 10, npcs: [], links: { camp_mojache: 18, the_forgotten_coast: 20 } },
    the_forgotten_coast: { name: 'The Forgotten Coast', zone: 'Ferndeep', region: 'feralas', scene: 'the_forgotten_coast', lvl: [47, 49], mobs: [['hatecrest_warrior', 5], ['hatecrest_siren', 4]], named: { lord_shalzaru: 150 }, pool: 10, npcs: [], links: { feathermoon_stronghold: 16, gordunni_outpost: 20 } },
    lower_wilds: { name: 'The Lower Wilds', zone: 'Ferndeep', region: 'feralas', scene: 'lower_wilds', lvl: [48, 50], mobs: [['longtooth_runner', 5], ['wandering_forest_walker', 4]], named: { old_grizzlegut: 300 }, pool: 10, npcs: [], links: { camp_mojache: 20, frayfeather_highlands: 20, thistleshrub_valley: 45 }, via: { thistleshrub_valley: 'Road through Windgorge' } },
    maraudon_gate: { gate: true, name: 'The Gemfall Caves', zone: 'Mournwaste', region: 'feralas', scene: 'maraudon_gate', lvl: [46, 50], mobs: [['putridus_trickster', 4], ['cavern_lurker', 3]], pool: 7, npcs: [], links: { woodpaw_hills: 35 }, via: { woodpaw_hills: 'Road to Ferndeep' } },
  });
  D.PLACES.darnassus.links.feathermoon_stronghold = 60; D.PLACES.darnassus.via.feathermoon_stronghold = 'Hippogryph';
  D.PLACES.thunder_bluff.links.camp_mojache = 55; D.PLACES.thunder_bluff.via = Object.assign(D.PLACES.thunder_bluff.via || {}, { camp_mojache: 'Wind Rider' });
  D.PLACES.thistleshrub_valley.links.lower_wilds = 45; D.PLACES.thistleshrub_valley.via = Object.assign(D.PLACES.thistleshrub_valley.via || {}, { lower_wilds: 'Road through Windgorge' });

  Object.assign(D.NPCS, {
    shandris: { name: 'Commander Ilara Starfeather', title: 'General of the Wood Elf Wardens' },
    latronicus: { name: 'Corin Swiftbow', title: 'Starfeather' },
    innkeeper_shyria: { name: 'Innkeeper Lysa', title: 'Innkeeper' },
    vivianna: { name: 'Vesna', title: 'Weaponsmith' },
    hadoken: { name: 'Hado of the Far Paths', title: 'Camp Ruga' },
    orwin: { name: 'Orbin Fizzlecog', title: 'Camp Ruga' },
    innkeeper_greul: { name: 'Innkeeper Durga', title: 'Innkeeper' },
    krueg: { name: 'Kurr Bonegrin', title: 'Weaponsmith' },
  });

  const A = (id, q) => { q.faction = 'alliance'; D.QUESTS[id] = q; };
  const H = (id, q) => { q.faction = 'horde'; D.QUESTS[id] = q; };
  A('tanaris_feralas_a', { name: 'Starfeather', lvl: 45, giver: 'noggenfogger', turnin: 'shandris', text: 'The wood elves of Starfeather Hold want help on the Forgotten Coast. Take the hippogryph from Nyrwen, or the road through Windgorge.',
    objs: [{ type: 'visit', place: 'feathermoon_stronghold' }], reward: { money: 1800 } });
  H('tanaris_feralas_h', { name: 'Camp Ruga', lvl: 45, giver: 'noggenfogger', turnin: 'hadoken', text: 'The hornfolk of Camp Ruga in Ferndeep need hunters. Take the wyvern rider from Hornwind Mesa, or the road through Windgorge.',
    objs: [{ type: 'visit', place: 'camp_mojache' }], reward: { money: 1800 } });
  const both = (key, lvl, name, text, objs, ra, rh, pre) => {
    A('fa_' + key, Object.assign({ name, lvl, giver: ra[0], turnin: ra[0], text: text[0], objs, reward: ra[1] }, pre ? { pre: ['fa_' + pre] } : {}));
    H('fh_' + key, Object.assign({ name, lvl, giver: rh[0], turnin: rh[0], text: text[1], objs, reward: rh[1] }, pre ? { pre: ['fh_' + pre] } : {}));
  };
  both('stagwings', 45, 'Tatterwing Hippogryphs', ['Wild hippogryphs attack our messengers. Kill 12 stagwings.', 'Hippogryphs in the highlands dive on our scouts. Kill 12 stagwings.'],
    [{ type: 'kill', mob: 'frayfeather_stagwing', n: 12 }], ['latronicus', { choice: ['fam_feet45'] }], ['hadoken', { choice: ['fam_feet45'] }]);
  both('plumes', 45, 'Tatterwing Plumes', ['Bring me 8 plumes for our arrows.', 'Bring me 8 plumes for our totems.'],
    [{ type: 'collect', item: 'hippogryph_feather', n: 8 }], ['vivianna', { money: 4200 }], ['orwin', { money: 4200 }], 'stagwings');
  both('skystormers', 46, 'Skystormers', ['The skystormers are the fiercest of the flock. Kill 10.', 'The skystormers lead the flock. Kill 10.'],
    [{ type: 'kill', mob: 'frayfeather_skystormer', n: 10 }], ['latronicus', { choice: ['fam_wrist46'] }], ['hadoken', { choice: ['fam_wrist46'] }], 'stagwings');
  both('rathtalon', 48, 'Sister Hisk', ['A harpy matriarch hunts the highlands. She is rarely seen. Bring me her talon.', 'Sister Hisk, the harpy, preys on our riders. She is rarely seen. Bring me her talon.'],
    [{ type: 'collect', item: 'rathtalon_talon', n: 1 }], ['shandris', { choice: ['fam_ring_rare50'] }], ['hadoken', { choice: ['fam_ring_rare50'] }]);
  both('woodpaw', 46, 'The Mossgut', ['Mossgut gnolls raid the roads. Kill 12 reavers.', 'Mossgut gnolls raid Camp Ruga. Kill 12 reavers.'],
    [{ type: 'kill', mob: 'woodpaw_reaver', n: 12 }], ['latronicus', { money: 4300 }], ['hadoken', { money: 4300 }]);
  both('woodpaw_manes', 47, 'Mossgut Manes', ['Their mystics call the pack. Kill 8 and bring me 8 manes.', 'Kill 8 mystics and bring me 8 manes.'],
    [{ type: 'kill', mob: 'woodpaw_mystic', n: 8 }, { type: 'collect', item: 'woodpaw_mane', n: 8 }], ['shandris', { choice: ['fam_hands47'] }], ['orwin', { choice: ['fam_hands47'] }], 'woodpaw');
  both('gordunni', 47, 'The Stonegut', ['Ogres of the Stonegut clan dig in the elven ruins. Kill 12.', 'The Stonegut ogres attack our patrols. Kill 12.'],
    [{ type: 'kill', mob: 'gordunni_ogre', n: 12 }], ['latronicus', { choice: ['fam_chest47'] }], ['hadoken', { choice: ['fam_chest47'] }]);
  both('gordunni_scrolls', 48, 'The Stonegut Scrolls', ['Their mage-lords read old elven scrolls. Kill 8 and bring me 4 scrolls.', 'Kill 8 mage-lords and bring me 4 of their scrolls.'],
    [{ type: 'kill', mob: 'gordunni_mage_lord', n: 8 }, { type: 'collect', item: 'gordunni_scroll', n: 4 }], ['shandris', { choice: ['fam_back48'] }], ['orwin', { choice: ['fam_back48'] }], 'gordunni');
  both('ogre_tusks_f', 48, 'Ogre Tusks', ['Bring me 10 ogre tusks. The Wood Elf Wardens pay a bounty.', 'Bring me 10 ogre tusks. The camp pays a bounty.'],
    [{ type: 'collect', item: 'ogre_tusk_f', n: 10 }], ['vivianna', { money: 4600 }], ['krueg', { money: 4600 }], 'gordunni');
  both('hatecrest', 48, 'The Spitecoil', ['Naga of the Spitecoil raid the coast. Kill 12 warriors.', 'Spitecoil naga threaten the coast. Kill 12 warriors.'],
    [{ type: 'kill', mob: 'hatecrest_warrior', n: 12 }], ['shandris', { choice: ['fam_legs48'] }], ['hadoken', { choice: ['fam_legs48'] }]);
  both('sirens', 49, 'The Sirens', ['Their sirens sing sailors to their deaths. Kill 10 and bring me 5 corals.', 'Kill 10 sirens and bring me 5 corals.'],
    [{ type: 'kill', mob: 'hatecrest_siren', n: 10 }, { type: 'collect', item: 'siren_coral', n: 5 }], ['latronicus', { choice: ['fam_waist49'] }], ['orwin', { choice: ['fam_waist49'] }], 'hatecrest');
  both('scales_f', 49, 'Spitecoil Scales', ['Bring me 10 scales.', 'Bring me 10 scales.'],
    [{ type: 'collect', item: 'hatecrest_scale', n: 10 }], ['vivianna', { money: 4900 }], ['krueg', { money: 4900 }], 'hatecrest');
  both('longtooth', 49, 'The Greymuzzle Pack', ['Wolves hunt the Lower Wilds. Kill 12 and bring me 6 pelts.', 'Kill 12 Greymuzzle runners and bring me 6 pelts.'],
    [{ type: 'kill', mob: 'longtooth_runner', n: 12 }, { type: 'collect', item: 'longtooth_pelt', n: 6 }], ['latronicus', { choice: ['fam_hands49'] }], ['hadoken', { choice: ['fam_hands49'] }]);
  both('forest_walkers', 50, 'The Forest Walkers', ['The ancient walkers have gone mad. Kill 10 and bring me 5 bark samples.', 'The forest walkers crush our camps. Kill 10 and bring me 5 bark samples.'],
    [{ type: 'kill', mob: 'wandering_forest_walker', n: 10 }, { type: 'collect', item: 'walker_bark', n: 5 }], ['shandris', { choice: ['fam_weapon50'] }], ['hadoken', { choice: ['fam_weapon50'] }], 'longtooth');
  both('grizzlegut', 47, 'Old Bramblebelly', ['A huge old bear roams the Lower Wilds. He is rarely seen. Bring me his hide.', 'Old Bramblebelly, the bear, is rarely seen. Bring me his hide.'],
    [{ type: 'collect', item: 'grizzlegut_hide', n: 1 }], ['latronicus', { choice: ['fam_back_rare50'] }], ['orwin', { choice: ['fam_back_rare50'] }]);
  both('highland_patrol', 46, 'The Highland Road', ['Keep the road safe: 8 stagwings and 6 skystormers.', 'Keep the road safe: 8 stagwings and 6 skystormers.'],
    [{ type: 'kill', mob: 'frayfeather_stagwing', n: 8 }, { type: 'kill', mob: 'frayfeather_skystormer', n: 6 }], ['vivianna', { money: 4400 }], ['krueg', { money: 4400 }], 'plumes');
  both('gnoll_patrol', 47, 'Back to the Hills', ['8 reavers and 6 mystics, then we sleep.', '8 reavers and 6 mystics, then we sleep.'],
    [{ type: 'kill', mob: 'woodpaw_reaver', n: 8 }, { type: 'kill', mob: 'woodpaw_mystic', n: 6 }], ['latronicus', { money: 4500 }], ['orwin', { money: 4500 }], 'woodpaw_manes');
  both('ogre_patrol_f', 48, 'The Outpost', ['Keep the ogres busy: 8 ogres and 6 mage-lords.', 'Keep the ogres busy: 8 ogres and 6 mage-lords.'],
    [{ type: 'kill', mob: 'gordunni_ogre', n: 8 }, { type: 'kill', mob: 'gordunni_mage_lord', n: 6 }], ['shandris', { choice: ['fam_feet48'] }], ['hadoken', { choice: ['fam_feet48'] }], 'gordunni_scrolls');
  both('coast_patrol', 49, 'Hold the Coast', ['8 warriors and 6 sirens.', '8 warriors and 6 sirens.'],
    [{ type: 'kill', mob: 'hatecrest_warrior', n: 8 }, { type: 'kill', mob: 'hatecrest_siren', n: 6 }], ['latronicus', { money: 5000 }], ['orwin', { money: 5000 }], 'sirens');
  both('wilds_patrol', 50, 'The Wilds', ['10 more runners.', '10 more runners.'],
    [{ type: 'kill', mob: 'longtooth_runner', n: 10 }], ['vivianna', { choice: ['fam_chest50'] }], ['krueg', { choice: ['fam_chest50'] }], 'longtooth');
  both('shalzaru', 50, 'Wanted: Lord Nazzir', ['The naga lord Nazzir rules the Forgotten Coast. Bring me his crown. Take friends.', 'Lord Nazzir leads the naga. Bring me his crown. Take friends.'],
    [{ type: 'collect', item: 'shalzaru_crown', n: 1 }], ['shandris', { choice: ['fam_weapon50'] }], ['hadoken', { choice: ['fam_weapon50'] }]);
  both('rotmaw', 47, 'Wanted: Old Rotmaw', ['The Mossgut follow the oldest of them, Old Rotmaw. Bring me his tusk and the pack breaks. Take friends.', 'Old Rotmaw leads the Mossgut raids on Camp Ruga. Bring me his tusk. Take friends.'],
    [{ type: 'collect', item: 'rotmaw_tooth', n: 1 }], ['latronicus', { choice: ['fam_waist47'] }], ['hadoken', { choice: ['fam_waist47'] }], 'woodpaw');
  D.QUESTS.fa_rotmaw.group = 3; D.QUESTS.fh_rotmaw.group = 3;
  D.QUESTS.fa_shalzaru.group = 3; D.QUESTS.fh_shalzaru.group = 3;
  Object.assign(D.ACTIVITIES, {
    rotmaw: { name: 'Wanted: Old Rotmaw', where: 'woodpaw_hills', size: 3, minLvl: 44, maxLvl: 47, desc: 'Open-world elite in Ferndeep. 3 players.', boss: 'rotmaw', pulls: [{ scene: 'woodpaw_hills', label: 'The Mossgut camp', mobs: ['woodpaw_reaver', 'woodpaw_reaver'] }, { scene: 'woodpaw_hills', label: 'The Mossgut camp', mobs: ['woodpaw_mystic', 'woodpaw_reaver'] }, { scene: 'woodpaw_hills', label: 'Old Rotmaw', mobs: ['rotmaw'], boss: true }] },
    shalzaru: { name: 'Wanted: Lord Nazzir', where: 'the_forgotten_coast', size: 3, minLvl: 47, maxLvl: 50, desc: 'Open-world elite in Ferndeep. 3 players.', boss: 'lord_shalzaru', pulls: [{ scene: 'the_forgotten_coast', label: 'Naga ruins', mobs: ['hatecrest_warrior', 'hatecrest_warrior'] }, { scene: 'the_forgotten_coast', label: 'Naga ruins', mobs: ['hatecrest_siren', 'hatecrest_warrior'] }, { scene: 'the_forgotten_coast', label: 'Lord Nazzir', mobs: ['lord_shalzaru'], boss: true }] },
  });
})(typeof window !== 'undefined' ? window : globalThis);
