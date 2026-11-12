// Graymouth (dungeon, levels 58–60, v8): the burned city where the plague took Wexmoor's people. The Order of the Pyre
// holds the living side, the Hollow Host the dead side under Baron Mortvale. Reached through Morrowglen, open to both factions.
(function (root) {
  const D = root.D;
  // filling the gear gaps (#535; Feral tank pieces #533): blues and purples where a class and role had none
  D.item('graymouth_bow', { name: 'Graymouth Longbow', slot: 'ranged', q: 3, wtype: 'bow', lvl: 58, dmg: [69, 127], speed: 2.9, stats: { agi: 35 }, icon: 'bow', sell: 12100 });
  D.item('graymouth_mace', { name: 'Lightward Mace', slot: 'weapon', q: 3, wtype: 'mace', lvl: 59, dmg: [67, 125], speed: 2.8, stats: { int: 24, spi: 17 }, sp: 37, icon: 'mace', sell: 12500 });
  D.item('balnazzar_sigil', { name: "Xazzarak's Sigil", slot: 'quest', q: 1, icon: 'coin' });
  D.item('rivendare_seal', { name: "Mortvale's Seal", slot: 'quest', q: 1, icon: 'ring' });
  D.item('stratholme_ledger', { name: 'Graymouth Archive Ledger', slot: 'quest', q: 1, icon: 'journal' });
  const gear = (id, name, slot, o) => D.item(id, Object.assign({ name, slot, q: 3 }, o));
  gear('timmy_gloves', 'Grimgore Gauntlets', 'hands', { atype: 'mail', lvl: 58, armor: 310, stats: { str: 16, sta: 13 }, icon: 'gloves', sell: 11400 });
  gear('galford_boots', 'Archivist Slippers', 'feet', { atype: 'cloth', lvl: 58, armor: 70, stats: { int: 14, spi: 12 }, sp: 16, icon: 'boots', sell: 11200 });
  gear('balnazzar_blade', 'Demon Lord\'s Edge', 'weapon', { wtype: 'sword', lvl: 59, dmg: [72, 120], speed: 2.6, stats: { agi: 18, str: 12 }, icon: 'sword', sell: 12600 });
  gear('balnazzar_mantle', 'Crimson Felt Cloak', 'back', { lvl: 59, armor: 80, stats: { sta: 14, int: 12 }, icon: 'cloak', sell: 12000 });
  gear('anastari_bracers', "Banshee's Bracers", 'wrist', { atype: 'leather', lvl: 59, armor: 110, stats: { agi: 14, sta: 11 }, icon: 'bracers', sell: 11600 });
  gear('ramstein_belt', 'Gorger Girdle', 'waist', { atype: 'mail', lvl: 59, armor: 320, stats: { str: 17, sta: 16 }, icon: 'belt', sell: 11800 });
  gear('rivendare_runeblade', 'Runeblade of Baron Mortvale', 'weapon', { wtype: 'sword', lvl: 60, dmg: [92, 140], speed: 3.2, stats: { str: 22, sta: 16 }, icon: 'sword', sell: 14000 });
  gear('rivendare_staff', 'Bonesteed Staff', 'weapon', { wtype: 'staff', lvl: 60, dmg: [90, 134], speed: 3, stats: { int: 23, spi: 18 }, sp: 40, icon: 'staff', sell: 13800 });
  gear('rivendare_robe', 'Robe of the Baron', 'chest', { atype: 'cloth', lvl: 60, armor: 126, stats: { int: 24, spi: 17 }, sp: 30, icon: 'chest_cloth', sell: 13600 });
  gear('rivendare_leather', 'Death Knight Jerkin', 'chest', { atype: 'leather', lvl: 60, armor: 284, stats: { agi: 24, sta: 18 }, icon: 'chest_leather', sell: 13600 });
  gear('rivendare_plate', "Baron's Deathplate", 'chest', { atype: 'mail', lvl: 60, armor: 526, stats: { str: 24, sta: 21 }, icon: 'chest_mail', sell: 13800 });

  Object.assign(D.MOBS, {
    crimson_guardsman: { name: 'Crimson Guardsman', lvl: [58, 59], family: 'humanoid', hpMult: 1.1, drops: [['thieves_coin', 0.55], ['linen_cloth', 0.35]], aggro: 'Burn the plague out of this city!' },
    crimson_conjuror: { name: 'Crimson Conjuror', ranged: 'fire', lvl: [58, 59], family: 'humanoid', drops: [['thieves_coin', 0.55], ['linen_cloth', 0.4]] },
    skeletal_guardian: { name: 'Skeletal Guardian', lvl: [58, 59], family: 'undead', drops: [['thieves_coin', 0.4]] },
    bile_spewer: { name: 'Bile Spewer', lvl: [59, 60], family: 'undead', hpMult: 1.3, drops: [['rotting_flesh', 0.6]] },
    timmy_the_cruel: { name: 'Nibbles the Cruel', lvl: [58, 58], family: 'undead', boss: true, special: 'whirl', specialText: 'Nibbles the Cruel ravages everyone nearby!', loot: ['timmy_gloves', 'galford_boots'], aggro: 'TIMMY!' },
    archivist_galford: { name: 'Archivist Penrose', lvl: [58, 58], family: 'humanoid', boss: true, special: 'molten', specialText: 'Penrose sets the archive ablaze!', loot: ['galford_boots', 'timmy_gloves', 'graymouth_mace'], qdrops: [['stratholme_ledger', 1]], aggro: 'Burn it! Burn it all!' },
    balnazzar: { name: 'Xazzarak', lvl: [59, 59], family: 'demon', boss: true, special: 'kelris', summon: 'crimson_guardsman', specialText: 'Xazzarak raises the dead Crusaders!', loot: ['balnazzar_blade', 'balnazzar_mantle'], qdrops: [['balnazzar_sigil', 1]], aggro: 'Fools! The Order has served its purpose.' },
    baroness_anastari: { name: 'Baroness Vessaline', lvl: [59, 59], family: 'undead', boss: true, special: 'molten', specialText: 'Baroness Vessaline wails!', loot: ['anastari_bracers', 'balnazzar_mantle'] },
    ramstein_the_gorger: { name: 'Bloatgut the Gorger', lvl: [59, 59], family: 'undead', boss: true, special: 'slam', specialText: 'Ramstein tramples the ground!', loot: ['ramstein_belt', 'anastari_bracers'] },
    baron_rivendare: { name: 'Baron Mortvale', lvl: [60, 60], family: 'undead', boss: true, special: 'kelris', summon: 'skeletal_guardian', specialText: 'Baron Mortvale raises a skeleton from the dead!', loot: ['rivendare_runeblade', 'rivendare_staff', 'rivendare_robe', 'rivendare_leather', 'rivendare_plate', 'graymouth_bow'], qdrops: [['rivendare_seal', 1]], aggro: 'Intruders! More pawns for my master.' },
  });

  const A = (id, q) => { q.faction = 'alliance'; D.QUESTS[id] = q; };
  const H = (id, q) => { q.faction = 'horde'; D.QUESTS[id] = q; };
  A('st_baron_a', { name: "The Baron's Doom", lvl: 60, giver: 'argent_officer_a', turnin: 'argent_officer_a', dungeon: 'stratholme', text: 'Baron Mortvale rules the dead side of Graymouth for the Hollow Host. End him and bring me his seal.',
    objs: [{ type: 'collect', item: 'rivendare_seal', n: 1 }], reward: { choice: ['fam_weapon60'] } });
  H('st_baron_h', { name: "The Baron's Doom", lvl: 60, giver: 'argent_officer_h', turnin: 'argent_officer_h', dungeon: 'stratholme', text: 'Baron Mortvale commands the Hollow Host in Graymouth. The Lantern Watch wants him gone.',
    objs: [{ type: 'collect', item: 'rivendare_seal', n: 1 }], reward: { choice: ['fam_weapon60'] } });
  A('st_balnazzar_a', { name: 'The Demon in the Order', lvl: 59, giver: 'commander_ashlam', turnin: 'commander_ashlam', dungeon: 'stratholme', text: "The Order's Grand Crusader in Graymouth is not what he seems. Find out what leads them, and bring me proof.",
    objs: [{ type: 'collect', item: 'balnazzar_sigil', n: 1 }], reward: { choice: ['fam_back60'] } });
  H('st_balnazzar_h', { name: 'The Demon in the Order', lvl: 59, giver: 'high_executor_derrington', turnin: 'high_executor_derrington', dungeon: 'stratholme', text: 'Our spies say a demon lord leads the Order of the Pyre in Graymouth. Bring me proof.',
    objs: [{ type: 'collect', item: 'balnazzar_sigil', n: 1 }], reward: { choice: ['fam_back60'] } });
  A('st_ledger_a', { name: 'The Archive', lvl: 58, giver: 'alchemist_arbington', turnin: 'alchemist_arbington', dungeon: 'stratholme', text: "Graymouth's archivist kept records of the grain shipments that carried the plague. Find his ledger.",
    objs: [{ type: 'collect', item: 'stratholme_ledger', n: 1 }], reward: { choice: ['fam_ring_rare60'] } });
  H('st_ledger_h', { name: 'The Archive', lvl: 58, giver: 'apothecary_dithers', turnin: 'apothecary_dithers', dungeon: 'stratholme', text: "The archivist's ledger names who shipped the plagued grain. The Guild wants it.",
    objs: [{ type: 'collect', item: 'stratholme_ledger', n: 1 }], reward: { choice: ['fam_ring_rare60'] } });
  Object.assign(D.DUNGEONS, {
    stratholme: { music: 'graymouth', name: 'Graymouth', minLvl: 58, par: 575 /* x1.40: longer fights with bots in gear for their level (#582) */, trialPar: 570, size: 5, trashMult: { hp: 4.18, dmg: 3.57 }, bossMult: { hp: 19, dmg: 6.9 }, /* health x1.9: bots wear gear for their level (#582) */ trial: { trashMult: { hp: 2.2, dmg: 2.2 }, bossMult: { hp: 10, dmg: 4.3 } }, pulls: [ // damage raised to the level-60 dungeon target (#215: a fitted player wipes in 10-20% of runs); Trials keep the numbers they were tuned on
      { scene: 'strat_city', label: 'King\'s Square', mobs: ['crimson_guardsman', 'crimson_conjuror'] },
      { scene: 'strat_city', label: 'Nibbles the Cruel', mobs: ['timmy_the_cruel'], boss: true },
      { scene: 'strat_city', label: 'Archivist Penrose', mobs: ['archivist_galford'], boss: true },
      { scene: 'strat_bastion', label: 'The Pyre Bastion', mobs: ['crimson_guardsman', 'crimson_guardsman', 'crimson_conjuror'] },
      { scene: 'strat_bastion', label: 'Xazzarak', mobs: ['balnazzar'], boss: true },
      { scene: 'strat_ziggurat', label: 'The ziggurats', mobs: ['skeletal_guardian', 'bile_spewer'] },
      { scene: 'strat_ziggurat', label: 'Baroness Vessaline', mobs: ['baroness_anastari'], boss: true },
      { scene: 'strat_ziggurat', label: 'Bloatgut the Gorger', mobs: ['ramstein_the_gorger'], boss: true },
      { scene: 'strat_ziggurat', label: 'Baron Mortvale', mobs: ['baron_rivendare'], boss: true },
    ] },
  });
  Object.assign(D.ACTIVITIES, {
    stratholme: { name: 'Graymouth', dungeon: 'stratholme', where: 'stratholme_gate', size: 5, minLvl: 58, maxLvl: 60, desc: 'Dungeon in East Rotmoor. 5 players. Both factions.' },
  });
  // Season's Finest, Season 1 (#593): pieces made for the season's lists. They drop only through the season roll
  // (G.finestRoll: one extra roll per boss kill), never from the boss's own table, so its drop chances stay as they
  // were. A Best piece (tier: 'best') is at its family's newest-raid ceiling; a Next best one at this place's own share.
  D.item('mortvale_grasp', { name: "Mortvale's Grasp", slot: 'hands', q: 4, atype: 'mail', lvl: 60, armor: 370, stats: { str: 22, sta: 15 }, icon: 'gloves', sell: 18000, finest: 1, tier: 'best' });
  D.item('mourning_lute', { name: "Baroness's Mourning Lute", slot: 'ranged', q: 4, wtype: 'instrument', lvl: 60, speed: 2, stats: { int: 14, spi: 14 }, sp: 18, icon: 'reedsong_lute', sell: 18000, finest: 1, tier: 'best' });
  D.item('cruel_iron_treads', { name: 'Iron Treads of the Cruel', slot: 'feet', q: 3, atype: 'mail', lvl: 60, armor: 367, stats: { str: 17, sta: 11 }, icon: 'boots', sell: 12500, finest: 1, tier: 'until' });
  D.item('cruel_hide_leggings', { name: 'Cruel Hide Leggings', slot: 'legs', q: 3, atype: 'leather', lvl: 60, armor: 198, stats: { agi: 19, sta: 13 }, icon: 'legs', sell: 12500, finest: 1, tier: 'until' });
  D.item('archivist_felt_boots', { name: "Archivist's Felt Boots", slot: 'feet', q: 3, atype: 'leather', lvl: 60, armor: 167, stats: { int: 15, spi: 13 }, icon: 'boots', sell: 12500, finest: 1, tier: 'until' });
  D.item('demonbinder_sash', { name: "Demonbinder's Sash", slot: 'waist', q: 3, atype: 'leather', lvl: 60, armor: 134, stats: { int: 15, spi: 13 }, icon: 'belt', sell: 12500, finest: 1, tier: 'until' });
  D.item('gorger_chain_grips', { name: "Gorger's Chain Grips", slot: 'hands', q: 3, atype: 'mail', lvl: 60, armor: 333, stats: { str: 17, sta: 12 }, icon: 'gloves', sell: 12500, finest: 1, tier: 'until' });
  D.item('pactbound_cuffs', { name: 'Pactbound Cuffs', slot: 'wrist', q: 4, atype: 'cloth', lvl: 60, armor: 56, stats: { int: 16, spi: 7 }, sp: 18, icon: 'bracers', sell: 18000, finest: 1, tier: 'best' });
  D.item('mortvale_shroud', { name: "Mortvale's Shroud", slot: 'back', q: 4, lvl: 60, armor: 94, stats: { int: 18, spi: 8 }, sp: 21, icon: 'cloak', sell: 18000, finest: 1, tier: 'best' });
  D.item('gorger_bulwark_hauberk', { name: "Gorger's Bulwark Hauberk", slot: 'chest', q: 4, atype: 'mail', lvl: 60, armor: 580, stats: { sta: 32, str: 22 }, icon: 'chest_mail', sell: 18000, finest: 1, tier: 'best' });
  D.item('baroness_riding_belt', { name: "Baroness's Riding Belt", slot: 'waist', q: 4, atype: 'leather', lvl: 60, armor: 149, stats: { agi: 23, sta: 12 }, icon: 'belt', sell: 18000, finest: 1, tier: 'best' });
  D.item('penrose_mending_seal', { name: "Penrose's Seal of Mending", slot: 'finger', q: 4, lvl: 60, stats: { int: 16, spi: 12 }, sp: 18, icon: 'ring', sell: 18000, finest: 1, tier: 'best' });
  D.MOBS.baron_rivendare.finest = ['mortvale_grasp', 'mortvale_shroud'];
  D.MOBS.baroness_anastari.finest = ['mourning_lute', 'baroness_riding_belt'];
  D.MOBS.timmy_the_cruel.finest = ['cruel_iron_treads', 'cruel_hide_leggings'];
  D.MOBS.archivist_galford.finest = ['archivist_felt_boots', 'penrose_mending_seal'];
  D.MOBS.balnazzar.finest = ['demonbinder_sash', 'pactbound_cuffs'];
  D.MOBS.ramstein_the_gorger.finest = ['gorger_chain_grips', 'gorger_bulwark_hauberk'];
})(typeof window !== 'undefined' ? window : globalThis);
