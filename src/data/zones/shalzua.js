// EXPANSION: The Temple of Shal'zua (Krugar dungeon, level 60). The Wavebreaker trolls' drowned temple to the sea spirit
// Shal'zua, whose spirit was swallowed by the Deepmother. Entered from Shal'zua's Steps on the Skullreef Isles.
(function (root) {
  const D = root.D;
  D.item('loa_pearl', { name: "Shal'zua's Pearl", slot: 'quest', q: 1, icon: 'seed' });
  D.item('oyala_fetish', { name: "Oyala's Bone Fetish", slot: 'quest', q: 1, icon: 'rib' });
  const gear = (id, name, slot, o) => D.item(id, Object.assign({ name, slot, q: 3 }, o));
  gear('oyala_cloak', "Hexmother's Mantle", 'back', { lvl: 60, armor: 84, stats: { int: 15, sta: 13 }, sp: 14, icon: 'cloak', sell: 13000 });
  gear('oyala_bracers', 'Bone-Bead Bracers', 'wrist', { atype: 'mail', lvl: 60, armor: 232, stats: { str: 15, sta: 13 }, icon: 'bracers', sell: 12800 });
  gear('tidefang_gloves', 'Eelskin Grips', 'hands', { atype: 'leather', lvl: 60, armor: 150, stats: { agi: 18, sta: 13 }, icon: 'gloves', sell: 13000 });
  gear('tidefang_boots', 'Tidefang Treads', 'feet', { atype: 'mail', lvl: 60, armor: 364, stats: { str: 17, sta: 15 }, icon: 'boots', sell: 13000 });
  gear('zanjin_dagger', "Zan'jin's Sacrificial Knife", 'weapon', { wtype: 'dagger', lvl: 60, dmg: [50, 94], speed: 1.8, stats: { agi: 17, sta: 11 }, icon: 'dagger', sell: 13800 });
  gear('zanjin_legs', 'Wavebreaker Kilt', 'legs', { atype: 'cloth', lvl: 60, armor: 96, stats: { int: 20, spi: 15 }, sp: 24, icon: 'legs', sell: 13400 });
  gear('avatar_staff', "Staff of the Drowned Spirit", 'weapon', { wtype: 'staff', lvl: 60, dmg: [92, 136], speed: 3, stats: { int: 25, spi: 18 }, sp: 42, icon: 'staff', sell: 14000 });
  gear('avatar_axe', 'Reefcleaver', 'weapon', { wtype: 'axe', lvl: 60, dmg: [100, 150], speed: 3.4, stats: { str: 24, sta: 15 }, icon: 'axe', sell: 14000 });
  gear('avatar_leather', "Spirit-Touched Vest", 'chest', { atype: 'leather', lvl: 60, armor: 288, stats: { agi: 25, sta: 18 }, icon: 'chest_leather', sell: 13800 });
  gear('avatar_robe', 'Robe of the Tide Priest', 'chest', { atype: 'cloth', lvl: 60, armor: 128, stats: { int: 25, spi: 18 }, sp: 32, icon: 'chest_cloth', sell: 13800 });

  Object.assign(D.MOBS, {
    wavebreaker_zealot: { name: 'Wavebreaker Zealot', lvl: [60, 60], family: 'undead', hpMult: 1.1, drops: [['thieves_coin', 0.55], ['linen_cloth', 0.3]], aggro: 'For the spirit!' },
    tide_serpent: { name: 'Tide Serpent', lvl: [60, 60], family: 'beast', hpMult: 1.2, drops: [['light_leather', 0.3]] },
    wavebreaker_spiritcaller: { name: 'Wavebreaker Spiritcaller', lvl: [60, 60], family: 'undead', drops: [['thieves_coin', 0.55], ['linen_cloth', 0.4]] },
    hexmother_oyala: { name: 'Hexmother Oyala', lvl: [60, 60], family: 'undead', boss: true, special: 'kelris', summon: 'wavebreaker_zealot', specialText: 'Oyala calls her drowned children!', loot: ['oyala_cloak', 'oyala_bracers'], qdrops: [['oyala_fetish', 1]], aggro: 'Mother is here, little ones.' },
    tidefang: { name: 'Tidefang', lvl: [60, 60], family: 'beast', boss: true, special: 'whirl', specialText: 'Tidefang thrashes through the pool!', loot: ['tidefang_gloves', 'tidefang_boots'] },
    high_priest_zanjin: { name: "High Priest Zan'jin", lvl: [60, 60], family: 'undead', boss: true, special: 'molten', specialText: "Zan'jin calls down a drowning curse!", loot: ['zanjin_dagger', 'zanjin_legs'], aggro: 'Shal\'zua will feed on you!' },
    avatar_of_shalzua: { name: "Avatar of Shal'zua", lvl: [60, 60], family: 'elemental', boss: true, special: 'slam', specialText: "The Avatar of Shal'zua crashes down like a wave!", loot: ['avatar_staff', 'avatar_axe', 'avatar_leather', 'avatar_robe'], qdrops: [['loa_pearl', 1]], aggro: 'I... was a god...' },
  });

  const H = (id, q) => { q.faction = 'horde'; D.QUESTS[id] = q; };
  H('tp_avatar', { name: 'A Drowned God', lvl: 60, giver: 'shadow_hunter_zulkesh', turnin: 'shadow_hunter_zulkesh', dungeon: 'shalzua_temple', text: "Shal'zua was a spirit of the sea. Now something in the deep wears her like a mask. Free her. Bring me her pearl.",
    objs: [{ type: 'collect', item: 'loa_pearl', n: 1 }], reward: { choice: ['fam_weapon60'] } });
  H('tp_oyala', { name: 'The Hexmother', lvl: 60, giver: 'hexxer_mazu', turnin: 'hexxer_mazu', dungeon: 'shalzua_temple', text: 'Hexmother Oyala raised the drowned tribe. Her bone fetish binds them. Break it, and bring it to Mazu.',
    objs: [{ type: 'collect', item: 'oyala_fetish', n: 1 }], reward: { choice: ['fam_back_rare60'] } });
  Object.assign(D.DUNGEONS, {
    shalzua_temple: { music: 'shalzua', name: "Temple of Shal'zua", minLvl: 60, par: 305, trialPar: 480, size: 5, trashMult: { hp: 2.2, dmg: 3.1 }, bossMult: { hp: 10, dmg: 6.0 }, trial: { trashMult: { hp: 2.2, dmg: 2.2 }, bossMult: { hp: 10, dmg: 4.3 } }, pulls: [ // damage raised to the level-60 dungeon target (#215: a fitted player wipes in 10-20% of runs); Trials keep the numbers they were tuned on
      { scene: 'shalzua_pools', label: 'The tide pools', mobs: ['wavebreaker_zealot', 'tide_serpent'] },
      { scene: 'shalzua_pools', label: 'Hexmother Oyala', mobs: ['hexmother_oyala'], boss: true },
      { scene: 'shalzua_pools', label: 'Tidefang', mobs: ['tidefang'], boss: true },
      { scene: 'shalzua_shrine', label: 'The drowned shrine', mobs: ['wavebreaker_spiritcaller', 'wavebreaker_zealot', 'wavebreaker_zealot'] },
      { scene: 'shalzua_shrine', label: "High Priest Zan'jin", mobs: ['high_priest_zanjin'], boss: true },
      { scene: 'shalzua_sanctum', label: 'The spirit\'s altar', mobs: ['wavebreaker_spiritcaller', 'tide_serpent'] },
      { scene: 'shalzua_sanctum', label: "Avatar of Shal'zua", mobs: ['avatar_of_shalzua'], boss: true },
    ] },
  });
  Object.assign(D.ACTIVITIES, {
    shalzua_temple: { name: "Temple of Shal'zua", dungeon: 'shalzua_temple', where: 'temple_steps', size: 5, minLvl: 60, maxLvl: 60, desc: 'Dungeon on the Skullreef Isles. 5 players. Krugar.' },
  });
})(typeof window !== 'undefined' ? window : globalThis);
