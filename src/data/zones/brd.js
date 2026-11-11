// Cinderpeak Depths (dungeon, levels 51–55, v7): the Slagborn capital under Cinderpeak. Both factions run it;
// Marshal Hale, lost since Chapter 3, is a prisoner in its detention block.
(function (root) {
  const D = root.D;
  // filling the gear gaps (#535; Feral tank pieces #533): blues and purples where a class and role had none
  D.item('cinder_sash', { name: "Ashweaver's Sash", slot: 'waist', q: 3, atype: 'cloth', lvl: 53, armor: 54, stats: { int: 20, spi: 14 }, sp: 16, icon: 'belt', sell: 10100 });
  D.item('cinder_ring', { name: 'Emberglass Loop', slot: 'finger', q: 3, lvl: 54, stats: { int: 20, spi: 15 }, icon: 'ring', sell: 10500 });
  D.item('cinder_legs', { name: 'Hide of the Forge Bear', slot: 'legs', q: 3, atype: 'leather', lvl: 54, armor: 213, stats: { agi: 20, sta: 15 }, icon: 'legs', sell: 10500 });
  D.item('prison_cell_key', { name: 'Prison Cell Key', slot: 'quest', q: 1, icon: 'coin' });
  D.item('windsor_notes', { name: "Hale's Notes", slot: 'quest', q: 1, icon: 'journal' });
  D.item('thaurissan_crown', { name: "Grimmark's Crown", slot: 'quest', q: 1, icon: 'ring' });
  D.item('argelmach_core', { name: 'Golem Core', slot: 'quest', q: 1, icon: 'dust' });
  const gear = (id, name, slot, o) => D.item(id, Object.assign({ name, slot, q: 3 }, o));
  gear('gerstahn_whip', "Interrogator's Wand", 'weapon', { wtype: 'dagger', lvl: 52, dmg: [42, 78], speed: 1.8, stats: { agi: 14, sta: 9 }, icon: 'dagger', sell: 9400 });
  gear('roccor_bracers', 'Rockfist Bracers', 'wrist', { atype: 'mail', lvl: 52, armor: 190, stats: { str: 13, sta: 11 }, icon: 'bracers', sell: 9000 });
  gear('baelgar_cloak', 'Molten Cloak', 'back', { lvl: 53, armor: 72, stats: { sta: 13, int: 11 }, icon: 'cloak', sell: 9400 });
  gear('angerforge_blade', 'Ashhelm Blade', 'weapon', { wtype: 'sword', lvl: 53, dmg: [66, 110], speed: 2.6, stats: { str: 16, sta: 11 }, icon: 'sword', sell: 10200 });
  gear('angerforge_legs', 'Slagborn Legguards', 'legs', { atype: 'mail', lvl: 53, armor: 390, stats: { str: 17, sta: 15 }, icon: 'legs', sell: 10000 });
  gear('argelmach_gloves', 'Golem Handlers', 'hands', { atype: 'leather', lvl: 54, armor: 140, stats: { agi: 16, sta: 12 }, icon: 'gloves', sell: 9800 });
  gear('magmus_boots', 'Magma-Forged Boots', 'feet', { atype: 'mail', lvl: 54, armor: 320, stats: { str: 16, sta: 13 }, icon: 'boots', sell: 9900 });
  gear('thaurissan_hammer', 'Foebreaker', 'weapon', { wtype: 'mace', lvl: 55, dmg: [70, 116], speed: 2.8, stats: { str: 18, sta: 12 }, icon: 'mace', sell: 11600 });
  gear('thaurissan_staff', 'Staff of the Emperor', 'weapon', { wtype: 'staff', lvl: 55, dmg: [80, 118], speed: 3, stats: { int: 21, spi: 15 }, sp: 34, icon: 'staff', sell: 11600 });
  gear('thaurissan_robe', "Emperor's Seal Robe", 'chest', { atype: 'cloth', lvl: 55, armor: 118, stats: { int: 20, spi: 15 }, sp: 26, icon: 'chest_cloth', sell: 11400 });
  gear('thaurissan_leather', 'Ashforge Jerkin', 'chest', { atype: 'leather', lvl: 55, armor: 250, stats: { agi: 21, sta: 15 }, icon: 'chest_leather', sell: 11400 });
  gear('thaurissan_plate', 'Imperial Plate Hauberk', 'chest', { atype: 'mail', lvl: 55, armor: 470, stats: { str: 21, sta: 18 }, icon: 'chest_mail', sell: 11600 });

  Object.assign(D.MOBS, {
    anvilrage_warden: { name: 'Slagguard Warden', lvl: [51, 52], family: 'humanoid', hpMult: 1.1, drops: [['thieves_coin', 0.5], ['linen_cloth', 0.3]], qdrops: [['prison_cell_key', 0.15]] },
    shadowforge_flame_keeper: { name: 'Ashforge Flame Keeper', lvl: [51, 52], family: 'humanoid', drops: [['thieves_coin', 0.5], ['linen_cloth', 0.35]] },
    ragereaver_golem: { name: 'Ragereaver Golem', lvl: [52, 53], family: 'mechanical', hpMult: 1.2, drops: [['linen_cloth', 0.1]] },
    high_interrogator_gerstahn: { name: 'High Interrogator Brisa', lvl: [52, 52], family: 'humanoid', boss: true, special: 'molten', specialText: 'Brisa lashes you with shadow!', loot: ['gerstahn_whip', 'roccor_bracers'], qdrops: [['prison_cell_key', 1]], aggro: 'Another spy for the cells!' },
    lord_roccor: { name: 'Lord Stonebrand', lvl: [52, 52], family: 'elemental', boss: true, special: 'slam', specialText: 'Lord Stonebrand shakes the earth!', loot: ['roccor_bracers', 'baelgar_cloak'] },
    bael_gar: { name: "Magmagor", lvl: [53, 53], family: 'giant', boss: true, special: 'molten', specialText: "Magmagor spews magma!", loot: ['baelgar_cloak', 'magmus_boots'] },
    general_angerforge: { name: 'General Ashhelm', lvl: [53, 53], family: 'humanoid', boss: true, special: 'kelris', summon: 'anvilrage_warden', specialText: 'General Ashhelm calls for reinforcements!', loot: ['angerforge_blade', 'angerforge_legs', 'cinder_legs'], aggro: 'Slagborn! To arms!' },
    golem_lord_argelmach: { name: 'Golemsmith Kragg', lvl: [54, 54], family: 'humanoid', boss: true, special: 'kelris', summon: 'ragereaver_golem', specialText: 'Golemsmith Kragg awakens a golem!', loot: ['argelmach_gloves', 'magmus_boots'], qdrops: [['argelmach_core', 1]] },
    magmus: { name: 'Slagmaw', lvl: [54, 54], family: 'giant', boss: true, special: 'whirl', specialText: 'Slagmaw bursts with flame!', loot: ['magmus_boots', 'angerforge_legs', 'cinder_ring'] },
    emperor_dagran_thaurissan: { name: 'Emperor Haldor Grimmark', lvl: [54, 54], family: 'humanoid', boss: true, special: 'slam', specialText: 'The Emperor brings down Foebreaker!', loot: ['thaurissan_hammer', 'thaurissan_staff', 'thaurissan_robe', 'thaurissan_leather', 'thaurissan_plate', 'cinder_sash'], qdrops: [['thaurissan_crown', 1], ['windsor_notes', 1]], aggro: 'Come to aid the Throne!' },
  });

  const A = (id, q) => { q.faction = 'alliance'; D.QUESTS[id] = q; };
  const H = (id, q) => { q.faction = 'horde'; D.QUESTS[id] = q; };
  A('brd_jail_break', { name: 'The Detention Block', lvl: 54, giver: 'marshal_maxwell', turnin: 'marshal_maxwell', dungeon: 'blackrock_depths', text: 'Marshal Hale is alive, in the detention block of Cinderpeak Depths. The High Interrogator keeps the keys. Take them and set him free.',
    objs: [{ type: 'collect', item: 'prison_cell_key', n: 1 }], reward: { choice: ['fam_back_rare55'] } });
  A('brd_emperor_a', { name: 'The Emperor', lvl: 55, giver: 'marshal_maxwell', turnin: 'marshal_maxwell', dungeon: 'blackrock_depths', text: "Hale's notes were taken to the Emperor himself. Kill Haldor Grimmark and bring them back. They name Kingsmere's traitor.",
    objs: [{ type: 'collect', item: 'windsor_notes', n: 1 }], reward: { choice: ['fam_weapon55'] } });
  H('brd_emperor_h', { name: 'The Heart of the Mountain', lvl: 55, giver: 'thal_kaur', turnin: 'thal_kaur', dungeon: 'blackrock_depths', text: 'The Slagborn Emperor, Haldor Grimmark, rules the mountain. The High Chief wants his crown.',
    objs: [{ type: 'collect', item: 'thaurissan_crown', n: 1 }], reward: { choice: ['fam_weapon55'] } });
  H('brd_golem_core', { name: 'The Golem Lord', lvl: 54, giver: 'gorzeeki', turnin: 'gorzeeki', dungeon: 'blackrock_depths', text: "Golemsmith Kragg makes the Slagborn golems. Bring me the core he carries. I have plans for it.",
    objs: [{ type: 'collect', item: 'argelmach_core', n: 1 }], reward: { choice: ['fam_back_rare55'] } });
  Object.assign(D.DUNGEONS, {
    blackrock_depths: { music: 'cinderpeak', name: 'Cinderpeak Depths', minLvl: 51, par: 850 /* x1.70: longer fights with bots in gear for their level (#582) */, trialPar: 570, size: 5, trashMult: { hp: 4.4, dmg: 2.53 }, bossMult: { hp: 20, dmg: 4.94 }, /* health x2.0: bots wear gear for their level (#582) */ trial: { trashMult: { hp: 2.2, dmg: 2.53 }, bossMult: { hp: 10, dmg: 4.94 } }, /* Trials keep their numbers */ pulls: [
      { scene: 'brd_prison', label: 'The detention block', mobs: ['anvilrage_warden', 'anvilrage_warden'] },
      { scene: 'brd_prison', label: 'High Interrogator Brisa', mobs: ['high_interrogator_gerstahn'], boss: true },
      { scene: 'brd_prison', label: 'Lord Stonebrand', mobs: ['lord_roccor'], boss: true },
      { scene: 'brd_city', label: 'The Forgehall', mobs: ['shadowforge_flame_keeper', 'shadowforge_flame_keeper', 'anvilrage_warden'] },
      { scene: 'brd_city', label: "Magmagor", mobs: ['bael_gar'], boss: true },
      { scene: 'brd_city', label: 'General Ashhelm', mobs: ['general_angerforge'], boss: true },
      { scene: 'brd_city', label: 'The golem workshop', mobs: ['ragereaver_golem', 'shadowforge_flame_keeper'] },
      { scene: 'brd_city', label: 'Golemsmith Kragg', mobs: ['golem_lord_argelmach'], boss: true },
      { scene: 'brd_throne', label: 'Slagmaw', mobs: ['magmus'], boss: true },
      { scene: 'brd_throne', label: 'Emperor Haldor Grimmark', mobs: ['emperor_dagran_thaurissan'], boss: true },
    ] },
  });
  Object.assign(D.ACTIVITIES, {
    blackrock_depths: { name: 'Cinderpeak Depths', dungeon: 'blackrock_depths', where: 'blackrock_mountain', size: 5, minLvl: 51, maxLvl: 55, desc: 'Dungeon in Cinderpeak. 5 players. Both factions.' },
  });
})(typeof window !== 'undefined' ? window : globalThis);
