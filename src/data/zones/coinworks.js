// The Coinworks (dungeon, levels 40–44, v10.6): the Deepgold Company's mint under Coppergulch in Sirocco, where the
// Black Ledger's gold is struck into warm, claw-stamped coins. Open to both factions (Coppergulch is neutral).
// Story tie: Chapter 4 (40), the Slagborn paid in Ledger coin. Hints only: warm coins, the claw, whelps on the
// strongboxes (the dragon is revealed at 60), a noble's seal (Marrow is named at 45, so never here).
(function (root) {
  const D = root.D;
  // filling the gear gaps (#535; Feral tank pieces #533): blues and purples where a class and role had none
  D.item('coinworks_cuffs', { name: "Ledgerkeeper's Cuffs", slot: 'wrist', q: 3, atype: 'cloth', lvl: 42, armor: 33, stats: { int: 17, spi: 12 }, sp: 13, icon: 'bracers', sell: 6400 });
  D.item('coinworks_band', { name: 'Pressed Iron Band', slot: 'finger', q: 3, lvl: 42, stats: { agi: 17, sta: 12 }, icon: 'ring', sell: 6400 });
  D.item('coinwhistle_ledger', { name: "Coinwhistle's Ledger", slot: 'quest', q: 1, icon: 'journal' });
  D.item('press_die_plate', { name: 'Claw-Stamped Die Plate', slot: 'quest', q: 1, icon: 'ring' });
  const gear = (id, name, slot, o) => D.item(id, Object.assign({ name, slot, q: 3 }, o));
  gear('nettlecog_ladle', "Foreman's Ladle", 'weapon', { wtype: 'mace', lvl: 41, dmg: [53, 88], speed: 2.8, stats: { str: 13, sta: 9 }, icon: 'mace', sell: 6300 });
  gear('nettlecog_apron', 'Scorched Smelting Apron', 'chest', { atype: 'leather', lvl: 41, armor: 190, stats: { agi: 14, sta: 10 }, icon: 'chest_leather', sell: 6200 });
  gear('press_gauntlets', 'Pressworker Gauntlets', 'hands', { atype: 'mail', lvl: 42, armor: 185, stats: { str: 11, sta: 9 }, icon: 'gloves', sell: 6100 });
  gear('press_ring', 'Band of the First Strike', 'finger', { lvl: 42, stats: { int: 10, sta: 9 }, icon: 'ring', sell: 6300 });
  gear('emberhide_cloak', 'Emberhide Cloak', 'back', { lvl: 43, armor: 56, stats: { agi: 10, sta: 10 }, icon: 'cloak', sell: 6600 });
  gear('emberhide_slippers', 'Emberscale Slippers', 'feet', { atype: 'cloth', lvl: 43, armor: 62, stats: { int: 11, spi: 8 }, sp: 12, icon: 'boots', sell: 6400 });
  gear('coinwhistle_staff', "Mintmaster's Rod", 'weapon', { wtype: 'staff', lvl: 44, dmg: [66, 98], speed: 3, stats: { int: 16, spi: 11 }, sp: 26, icon: 'staff', sell: 7100 });
  gear('coinwhistle_coat', 'Gold-Buttoned Coat', 'chest', { atype: 'cloth', lvl: 44, armor: 94, stats: { int: 15, sta: 11 }, sp: 18, icon: 'chest_cloth', sell: 7000 });
  gear('coinwhistle_legs', 'Counting-House Legguards', 'legs', { atype: 'mail', lvl: 44, armor: 315, stats: { str: 15, sta: 12 }, icon: 'legs', sell: 7100 });
  gear('coinwhistle_knife', 'Clipping Knife', 'weapon', { wtype: 'dagger', lvl: 44, dmg: [35, 64], speed: 1.8, stats: { agi: 12, sta: 7 }, icon: 'dagger', sell: 7000 });

  Object.assign(D.MOBS, {
    cw_coinguard: { name: 'Deepgold Coinguard', sprite: 'venture_enforcer', lvl: [40, 41], family: 'humanoid', hpMult: 1.1, drops: [['thieves_coin', 0.5], ['linen_cloth', 0.3]], aggro: 'No visitors on the floor!' },
    cw_smelter: { name: 'Deepgold Smelter', sprite: 'venture_mechanic', lvl: [40, 42], family: 'humanoid', drops: [['thieves_coin', 0.45], ['linen_cloth', 0.3]], aggro: 'Mind the pour!' },
    cw_whelp: { name: 'Vault Whelp', fly: 7, sprite: 'black_dragon_whelp', lvl: [41, 42], family: 'dragonkin', drops: [['thieves_coin', 0.4]] },
    cw_sentry: { name: 'Brass Sentry', sprite: 'mechano_tank', lvl: [42, 43], family: 'mechanical', hpMult: 1.15 },
    foreman_nettlecog: { name: 'Foreman Nettlecog', lvl: [41, 41], family: 'humanoid', boss: true, special: 'molten', specialText: 'Foreman Nettlecog flings a ladle of molten gold!', loot: ['nettlecog_ladle', 'nettlecog_apron'], aggro: 'Who let you onto my floor?' },
    the_great_press: { name: 'The Great Press', lvl: [42, 42], family: 'mechanical', boss: true, special: 'slam', specialText: 'The Great Press stamps down!', loot: ['press_gauntlets', 'press_ring', 'coinworks_band'], qdrops: [['press_die_plate', 1]] },
    emberhide: { name: 'Emberhide', lvl: [43, 43], family: 'dragonkin', boss: true, special: 'whirl', specialText: 'Emberhide breathes fire across the strongroom!', loot: ['emberhide_cloak', 'emberhide_slippers'] },
    mintmaster_coinwhistle: { name: 'Mintmaster Coinwhistle', lvl: [44, 44], family: 'humanoid', boss: true, special: 'kelris', summon: 'cw_coinguard', specialText: 'Mintmaster Coinwhistle whistles for the guards!', loot: ['coinwhistle_staff', 'coinwhistle_coat', 'coinwhistle_legs', 'coinwhistle_knife', 'coinworks_cuffs'], qdrops: [['coinwhistle_ledger', 1]], aggro: 'Every coin in this room is counted. So are you.' },
  });

  Object.assign(D.QUESTS, {
    cw_warm_coins: { name: 'Warm Coins', lvl: 40, giver: 'noggenfogger', turnin: 'noggenfogger', text: 'Coins turn up in my own bazaar still warm, stamped with a claw. Nobody in Coppergulch minted them, and nobody paid me a cut. Carts go in and out of a brass door under the cliff at night. Go and look at it.',
      objs: [{ type: 'visit', place: 'coinworks_gate' }], reward: { money: 1800 } },
    cw_mintmaster: { name: 'Cooking the Books', lvl: 44, giver: 'noggenfogger', turnin: 'noggenfogger', pre: ['cw_warm_coins'], dungeon: 'coinworks', text: 'The Deepgold Company runs a mint under my town. Their mintmaster, Coinwhistle, writes down every coin that leaves it. I want that ledger: who pays, and who gets paid.',
      objs: [{ type: 'collect', item: 'coinwhistle_ledger', n: 1 }], reward: { choice: ['fam_weapon44'] } },
    cw_press: { name: 'The Die Plate', lvl: 42, giver: 'fizzledowser', turnin: 'fizzledowser', dungeon: 'coinworks', text: 'Every one of those coins carries the same claw. The mark is cut into the die plate of their great press. Bring me the plate. For science, and so nobody can strike another.',
      objs: [{ type: 'collect', item: 'press_die_plate', n: 1 }], reward: { money: 4200 } },
    cw_whelps: { name: 'Nest Egg', lvl: 43, giver: 'sprinkle', turnin: 'sprinkle', dungeon: 'coinworks', text: 'My cousin went down to the mint for work and came back with his eyebrows burned off. He says little black whelps sleep on the strongboxes. Kill 6 of them.',
      objs: [{ type: 'kill', mob: 'cw_whelp', n: 6 }], reward: { choice: ['fam_hands44'] } },
  });
  Object.assign(D.DUNGEONS, {
    // since: joins the Trials rotation from November (the October season was fixed on 1 October)
    coinworks: { music: 'coinworks', name: 'The Coinworks', minLvl: 40, par: 525 /* x1.38: longer fights with bots in gear for their level (#582) */, trialPar: 450, size: 5, since: '2026-11-01', trashMult: { hp: 3.74, dmg: 2.53 }, bossMult: { hp: 17, dmg: 5.52 }, /* health x1.7: bots wear gear for their level (#582) */ trial: { trashMult: { hp: 2.2, dmg: 2.53 }, bossMult: { hp: 10, dmg: 5.52 } }, /* Trials keep their numbers */ pulls: [
      { scene: 'cw_smelter', label: 'The loading dock', mobs: ['cw_coinguard', 'cw_coinguard'] },
      { scene: 'cw_smelter', label: 'The smelting floor', mobs: ['cw_smelter', 'cw_smelter', 'cw_coinguard'] },
      { scene: 'cw_smelter', label: 'Foreman Nettlecog', mobs: ['foreman_nettlecog'], boss: true },
      { scene: 'cw_smelter', label: 'The moulds', mobs: ['cw_sentry', 'cw_smelter'] },
      { scene: 'cw_vault', label: 'The Great Press', mobs: ['the_great_press'], boss: true },
      { scene: 'cw_vault', label: 'The strongroom', mobs: ['cw_whelp', 'cw_whelp', 'cw_coinguard'] },
      { scene: 'cw_vault', label: 'Emberhide', mobs: ['emberhide'], boss: true },
      { scene: 'cw_vault', label: 'The counting house', mobs: ['cw_sentry', 'cw_coinguard'] },
      { scene: 'cw_vault', label: 'Mintmaster Coinwhistle', mobs: ['mintmaster_coinwhistle'], boss: true },
    ] },
  });
  Object.assign(D.ACTIVITIES, {
    coinworks: { name: 'The Coinworks', dungeon: 'coinworks', where: 'coinworks_gate', size: 5, minLvl: 40, maxLvl: 44, desc: 'Dungeon in Sirocco. 5 players. Both factions.' },
  });
})(typeof window !== 'undefined' ? window : globalThis);
