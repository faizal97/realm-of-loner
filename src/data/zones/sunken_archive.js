// EXPANSION: The Sunken Archive (Accord dungeon, level 60). The great library of Sael'anor, drowned for ten thousand
// years and still kept by its dead. Entered from the Archive Steps on the Tidewatch Coast.
(function (root) {
  const D = root.D;
  D.item('vessaria_quill', { name: "Vessaria's Tidequill", slot: 'quest', q: 1, icon: 'feather' });
  D.item('codex_of_tides', { name: 'Codex of Tides', slot: 'quest', q: 1, icon: 'journal' });
  const gear = (id, name, slot, o) => D.item(id, Object.assign({ name, slot, q: 3 }, o));
  gear('ellaris_cloak', "Curator's Shroud", 'back', { lvl: 60, armor: 84, stats: { int: 15, sta: 13 }, sp: 14, icon: 'cloak', sell: 13000 });
  gear('ellaris_bracers', 'Ink-Stained Bracers', 'wrist', { atype: 'leather', lvl: 60, armor: 118, stats: { agi: 15, sta: 12 }, icon: 'bracers', sell: 12800 });
  gear('inkbound_gloves', 'Inkbound Gauntlets', 'hands', { atype: 'mail', lvl: 60, armor: 330, stats: { str: 18, sta: 15 }, icon: 'gloves', sell: 13000 });
  gear('inkbound_boots', 'Slippers of the Deep Stacks', 'feet', { atype: 'cloth', lvl: 60, armor: 76, stats: { int: 16, spi: 12 }, sp: 18, icon: 'boots', sell: 13000 });
  gear('nerathil_blade', "Lorekeeper's Edge", 'weapon', { wtype: 'sword', lvl: 60, dmg: [70, 118], speed: 2.4, stats: { agi: 17, sta: 12 }, icon: 'sword', sell: 13800 });
  gear('nerathil_legs', 'Tidewoven Leggings', 'legs', { atype: 'leather', lvl: 60, armor: 196, stats: { agi: 20, sta: 16 }, icon: 'legs', sell: 13400 });
  gear('vessaria_staff', 'Staff of the Tidescribe', 'weapon', { wtype: 'staff', lvl: 60, dmg: [92, 136], speed: 3, stats: { int: 25, spi: 18 }, sp: 42, icon: 'staff', sell: 14000 });
  gear('vessaria_mace', 'Tidecrown Scepter', 'weapon', { wtype: 'mace', lvl: 60, dmg: [76, 124], speed: 2.6, stats: { str: 18, sta: 14 }, icon: 'mace', sell: 14000 });
  gear('vessaria_robe', 'Robe of Drowned Knowledge', 'chest', { atype: 'cloth', lvl: 60, armor: 128, stats: { int: 25, spi: 18 }, sp: 32, icon: 'chest_cloth', sell: 13800 });
  gear('vessaria_plate', 'Scaled Archivist Hauberk', 'chest', { atype: 'mail', lvl: 60, armor: 532, stats: { str: 25, sta: 21 }, icon: 'chest_mail', sell: 14000 });

  Object.assign(D.MOBS, {
    archive_wardkeeper: { name: 'Archive Wardkeeper', lvl: [60, 60], family: 'humanoid', hpMult: 1.1, drops: [['thieves_coin', 0.55], ['linen_cloth', 0.3]], aggro: 'The stacks are closed.' },
    inkbound_wisp: { name: 'Inkbound Wisp', fly: 7, lvl: [60, 60], family: 'elemental', drops: [['gold_dust', 0.3]] },
    drowned_scholar: { name: 'Drowned Scholar', lvl: [60, 60], family: 'undead', drops: [['thieves_coin', 0.5], ['linen_cloth', 0.4]] },
    curator_ellaris: { name: 'Curator Ellaris', lvl: [60, 60], family: 'undead', boss: true, special: 'kelris', summon: 'inkbound_wisp', specialText: 'Curator Ellaris calls ink from the pages!', loot: ['ellaris_cloak', 'ellaris_bracers'], aggro: 'Silence in the archive!' },
    the_inkbound_horror: { name: 'The Inkbound Horror', lvl: [60, 60], family: 'elemental', boss: true, special: 'whirl', specialText: 'The Inkbound Horror lashes out with tendrils of ink!', loot: ['inkbound_gloves', 'inkbound_boots'] },
    lorekeeper_nerathil: { name: 'Lorekeeper Nerathil', lvl: [60, 60], family: 'undead', boss: true, special: 'molten', specialText: 'Nerathil reads a word of drowning!', loot: ['nerathil_blade', 'nerathil_legs'], qdrops: [['codex_of_tides', 1]], aggro: 'Ten thousand years of study, and you come to steal it?' },
    lady_vessaria: { name: 'Lady Vessaria the Tidescribe', lvl: [60, 60], family: 'humanoid', boss: true, special: 'kelris', summon: 'drowned_scholar', specialText: 'Vessaria writes the drowned back into the world!', loot: ['vessaria_staff', 'vessaria_mace', 'vessaria_robe', 'vessaria_plate'], qdrops: [['vessaria_quill', 1]], aggro: 'Every word I write, the sea obeys.' },
  });

  const A = (id, q) => { q.faction = 'alliance'; D.QUESTS[id] = q; };
  A('ar_vessaria', { name: 'The Tidescribe', lvl: 60, giver: 'lyssa_moonquill', turnin: 'lyssa_moonquill', dungeon: 'sunken_archive', text: "The relics name the Archive's mistress: Lady Vessaria, Aeldran's scribe. She writes the drowned back into the world. Take her quill.",
    objs: [{ type: 'collect', item: 'vessaria_quill', n: 1 }], reward: { choice: ['fam_weapon60'] } });
  A('ar_codex', { name: 'The Codex of Tides', lvl: 60, giver: 'admiral_vane', turnin: 'admiral_vane', dungeon: 'sunken_archive', text: 'Lorekeeper Nerathil keeps a codex that charts every current around the isle. With it, my ships stop sinking.',
    objs: [{ type: 'collect', item: 'codex_of_tides', n: 1 }], reward: { choice: ['fam_back_rare60'] } });
  Object.assign(D.DUNGEONS, {
    sunken_archive: { music: 'sunken_archive', name: 'The Sunken Archive', minLvl: 60, par: 303, trialPar: 480, size: 5, trashMult: { hp: 2.2, dmg: 3.6 }, bossMult: { hp: 10, dmg: 7.1 }, trial: { trashMult: { hp: 2.2, dmg: 2.2 }, bossMult: { hp: 10, dmg: 4.3 } }, pulls: [ // damage raised to the level-60 dungeon target (#215: a fitted player wipes in 10-20% of runs); Trials keep the numbers they were tuned on
      { scene: 'archive_stacks', label: 'The flooded stacks', mobs: ['archive_wardkeeper', 'inkbound_wisp'] },
      { scene: 'archive_stacks', label: 'Curator Ellaris', mobs: ['curator_ellaris'], boss: true },
      { scene: 'archive_hall', label: 'The reading hall', mobs: ['drowned_scholar', 'drowned_scholar', 'archive_wardkeeper'] },
      { scene: 'archive_hall', label: 'The Inkbound Horror', mobs: ['the_inkbound_horror'], boss: true },
      { scene: 'archive_hall', label: 'Lorekeeper Nerathil', mobs: ['lorekeeper_nerathil'], boss: true },
      { scene: 'archive_sanctum', label: 'The scriptorium', mobs: ['archive_wardkeeper', 'drowned_scholar'] },
      { scene: 'archive_sanctum', label: 'Lady Vessaria the Tidescribe', mobs: ['lady_vessaria'], boss: true },
    ] },
  });
  Object.assign(D.ACTIVITIES, {
    sunken_archive: { name: 'The Sunken Archive', dungeon: 'sunken_archive', where: 'archive_steps', size: 5, minLvl: 60, maxLvl: 60, desc: 'Dungeon on the Tidewatch Coast. 5 players. Accord.' },
  });
})(typeof window !== 'undefined' ? window : globalThis);
