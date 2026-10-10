// The Thorn Warrens (Krugar dungeon, levels 29–34, v5): the quilboar's thorny warren in the southern Scrublands.
// The gate is a place in the Scrublands; the dungeon is reached by the group finder from there.
(function (root) {
  const D = root.D;
  D.item('charlga_head', { name: "Mother Grisla's Head", slot: 'quest', q: 1, icon: 'head' });
  D.item('blueleaf_tuber', { name: 'Rootbulb', slot: 'quest', q: 1, icon: 'seed' });
  D.item('jargba_skull', { name: "Harrok's Skull Staff", slot: 'quest', q: 1, icon: 'staff' });
  // drops (levels 30-33)
  D.item('aggem_crown', { name: 'Brambletusk Circlet', slot: 'wrist', atype: 'leather', q: 3, lvl: 30, armor: 50, stats: { int: 7, spi: 6 }, icon: 'bracers', sell: 4000 });
  D.item('aggem_staff', { name: 'Thorn Staff', slot: 'weapon', wtype: 'staff', q: 3, lvl: 30, dmg: [52, 78], speed: 3, stats: { int: 11, spi: 8 }, sp: 16, icon: 'staff', sell: 4400 });
  D.item('jargba_robe', { name: 'Death Speaker Robes', slot: 'chest', atype: 'cloth', q: 3, lvl: 31, armor: 68, stats: { int: 12, sta: 8 }, sp: 12, icon: 'chest_cloth', sell: 4500 });
  D.item('jargba_mantle', { name: 'Death Speaker Mantle', slot: 'back', q: 3, lvl: 31, armor: 46, stats: { int: 8, spi: 7 }, icon: 'cloak', sell: 4200 });
  D.item('ramtusk_hammer', { name: "Snarltusk's Maul", slot: 'weapon', wtype: 'mace', q: 3, lvl: 32, dmg: [43, 71], speed: 2.7, stats: { str: 11, sta: 7 }, icon: 'mace', sell: 4700 });
  D.item('ramtusk_legs', { name: 'Tusked Leggings', slot: 'legs', atype: 'mail', q: 3, lvl: 32, armor: 232, stats: { str: 11, sta: 9 }, icon: 'legs', sell: 4600 });
  D.item('agathelos_hide', { name: 'Raging Hide Boots', slot: 'feet', atype: 'leather', q: 3, lvl: 32, armor: 88, stats: { agi: 9, sta: 7 }, icon: 'boots', sell: 4400 });
  D.item('agathelos_tusk', { name: 'Rageback Tusk', slot: 'finger', q: 3, lvl: 32, stats: { agi: 8, str: 6 }, icon: 'ring', sell: 4300 });
  D.item('charlga_staff', { name: "Grisla's Thornstaff", slot: 'weapon', wtype: 'staff', q: 3, lvl: 33, dmg: [56, 84], speed: 3, stats: { int: 14, spi: 9 }, sp: 22, icon: 'staff', sell: 5000 });
  D.item('charlga_blade', { name: 'Grisla Blade', slot: 'weapon', wtype: 'sword', q: 3, lvl: 33, dmg: [44, 72], speed: 2.6, stats: { agi: 9, str: 8 }, icon: 'sword', sell: 5000 });
  D.item('charlga_vest', { name: 'Matriarch Hide Vest', slot: 'chest', atype: 'leather', q: 3, lvl: 33, armor: 166, stats: { agi: 13, sta: 10 }, icon: 'chest_leather', sell: 5000 });
  D.item('charlga_mail', { name: 'Thornplate Hauberk', slot: 'chest', atype: 'mail', q: 3, lvl: 33, armor: 300, stats: { str: 13, sta: 11 }, icon: 'chest_mail', sell: 5200 });

  Object.assign(D.MOBS, {
    razorfen_quilguard: { name: 'Thorn Warrens Quilguard', lvl: [29, 30], family: 'humanoid', hpMult: 1.1, drops: [['quilboar_tusk', 0.4]], qdrops: [['blueleaf_tuber', 0.3]] },
    razorfen_geomancer: { name: 'Thorn Warrens Geomancer', lvl: [29, 30], family: 'humanoid', drops: [['quilboar_tusk', 0.4], ['linen_cloth', 0.3]], qdrops: [['blueleaf_tuber', 0.3]] },
    kraul_bat: { name: 'Warrens Bat', fly: 7, lvl: [30, 31], family: 'beast', drops: [['ruined_pelt', 0.3]] },
    death_head_cultist: { name: 'Bone Mask Cultist', ranged: 'shadow', lvl: [30, 31], family: 'humanoid', drops: [['quilboar_tusk', 0.3], ['linen_cloth', 0.35]] },
    aggem_thorncurse: { name: 'Hexer Brambletusk', lvl: [30, 30], family: 'humanoid', boss: true, special: 'cook', specialText: 'Hexer Brambletusk calls the thorns to mend his wounds.', loot: ['aggem_crown', 'aggem_staff'], aggro: 'The thorns will drink your blood!' },
    death_speaker_jargba: { name: 'Bone Speaker Harrok', lvl: [31, 31], family: 'humanoid', boss: true, special: 'molten', specialText: 'Bone Speaker Harrok hurls a bolt of death!', loot: ['jargba_robe', 'jargba_mantle'], qdrops: [['jargba_skull', 1]], aggro: 'Death comes for you!' },
    overlord_ramtusk: { name: 'Overlord Snarltusk', lvl: [31, 31], family: 'humanoid', boss: true, special: 'slam', loot: ['ramtusk_hammer', 'ramtusk_legs'], aggro: 'Thorn Warrens never falls!' },
    agathelos: { name: 'Rageback', lvl: [32, 32], family: 'beast', boss: true, special: 'hogger', specialText: 'Rageback charges!', loot: ['agathelos_hide', 'agathelos_tusk'] },
    charlga_razorflank: { name: 'Mother Grisla', lvl: [32, 32], family: 'humanoid', boss: true, special: 'kelris', summon: 'razorfen_quilguard', specialText: 'Mother Grisla calls her quilguards!', loot: ['charlga_staff', 'charlga_blade', 'charlga_vest', 'charlga_mail'], qdrops: [['charlga_head', 1]], aggro: 'The thorns will be your grave!' },
  });

  Object.assign(D.PLACES, {
    razorfen_gate: { gate: true, name: 'The Thorn Warrens', zone: 'The Scrublands', region: 'barrens', scene: 'razorfen_gate', lvl: [29, 34], mobs: [['razorfen_quilguard', 4], ['razorfen_geomancer', 3]], pool: 7, npcs: [], links: { baeldun_digsite: 22 } },
  });
  D.PLACES.baeldun_digsite.links.razorfen_gate = 22;

  Object.assign(D.QUESTS, {
    rfk_charlga: { name: 'Mother Grisla', lvl: 33, giver: 'thork', turnin: 'thork', dungeon: 'razorfen_kraul', text: 'The spinehide of The Thorn Warrens follow Mother Grisla, and she follows something darker. End her and bring me her head.',
      objs: [{ type: 'collect', item: 'charlga_head', n: 1 }], reward: { choice: ['fam_back_rare35'] } },
    rfk_tubers: { name: 'Rootbulbs of the Warrens', lvl: 30, giver: 'helbrim', turnin: 'helbrim', dungeon: 'razorfen_kraul', text: 'The spinehide grow rare rootbulbs of the warrens deep in the Warrens. Bring me 4. I have plans for them.',
      objs: [{ type: 'collect', item: 'blueleaf_tuber', n: 4 }], reward: { money: 2500 } },
    rfk_jargba: { name: 'The Skull Staff', lvl: 31, giver: 'thork', turnin: 'thork', dungeon: 'razorfen_kraul', text: 'A spinehide necromancer, Bone Speaker Harrok, raises the dead in the Warrens. Bring me his skull staff.',
      objs: [{ type: 'collect', item: 'jargba_skull', n: 1 }], reward: { choice: ['fam_weapon32'] } },
  });

  Object.assign(D.DUNGEONS, {
    razorfen_kraul: { music: 'thorn_warrens', name: 'The Thorn Warrens', minLvl: 29, par: 383, trialPar: 420, size: 5, trashMult: { hp: 2.2, dmg: 2.2 }, bossMult: { hp: 10, dmg: 4.8 }, pulls: [
      { scene: 'razorfen_kraul', label: 'The thorn tunnels', mobs: ['razorfen_quilguard', 'razorfen_geomancer'] },
      { scene: 'razorfen_kraul', label: 'Hexer Brambletusk', mobs: ['aggem_thorncurse'], boss: true },
      { scene: 'razorfen_kraul', label: 'Bat roost', mobs: ['kraul_bat', 'kraul_bat', 'razorfen_quilguard'] },
      { scene: 'razorfen_kraul', label: 'Bone Speaker Harrok', mobs: ['death_speaker_jargba'], boss: true },
      { scene: 'razorfen_kraul', label: 'Overlord Snarltusk', mobs: ['overlord_ramtusk'], boss: true },
      { scene: 'razorfen_depths', label: 'The cult shrine', mobs: ['death_head_cultist', 'death_head_cultist'] },
      { scene: 'razorfen_depths', label: 'Rageback', mobs: ['agathelos'], boss: true },
      { scene: 'razorfen_depths', label: 'The thorn throne', mobs: ['razorfen_quilguard', 'death_head_cultist'] },
      { scene: 'razorfen_depths', label: 'Mother Grisla', mobs: ['charlga_razorflank'], boss: true },
    ] },
  });
  Object.assign(D.ACTIVITIES, {
    razorfen_kraul: { name: 'The Thorn Warrens', dungeon: 'razorfen_kraul', where: 'razorfen_gate', size: 5, minLvl: 29, maxLvl: 34, desc: 'Dungeon in the southern Scrublands. 5 players.' },
  });
})(typeof window !== 'undefined' ? window : globalThis);
