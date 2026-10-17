// The Blackcloister (dungeon, levels 57–60, v8): the Hollow Host's school of necromancy in the crypts under Castle Ardmore,
// in the West Rotmoor. Reachable by both factions.
(function (root) {
  const D = root.D;
  D.item('kirtonos_blood', { name: "Skreel's Blood", slot: 'quest', q: 1, icon: 'venom' });
  D.item('gandling_head', { name: "Headmaster Sallow's Head", slot: 'quest', q: 1, icon: 'head' });
  D.item('barov_deed', { name: 'Varga Family Deed', slot: 'quest', q: 1, icon: 'journal' });
  const gear = (id, name, slot, o) => D.item(id, Object.assign({ name, slot, q: 3 }, o));
  gear('kirtonos_cloak', 'Cloak of the Herald', 'back', { lvl: 57, armor: 78, stats: { agi: 13, sta: 12 }, icon: 'cloak', sell: 11200 });
  gear('jandice_gloves', "Mirela's Gloves", 'hands', { atype: 'cloth', lvl: 57, armor: 70, stats: { int: 14, spi: 11 }, sp: 16, icon: 'gloves', sell: 11000 });
  gear('rattlegore_legs', 'Bone Ring Leggings', 'legs', { atype: 'mail', lvl: 58, armor: 440, stats: { str: 20, sta: 17 }, icon: 'legs', sell: 11800 });
  gear('rattlegore_axe', 'Bonebreaker', 'weapon', { wtype: 'axe', lvl: 58, dmg: [74, 124], speed: 2.8, stats: { str: 19, sta: 12 }, icon: 'axe', sell: 12200 });
  gear('ras_boots', 'Hoarwind Boots', 'feet', { atype: 'leather', lvl: 58, armor: 140, stats: { agi: 15, sta: 14 }, icon: 'boots', sell: 11600 });
  gear('ras_wand', 'Icy Tomb Spaulders', 'wrist', { atype: 'cloth', lvl: 58, armor: 50, stats: { int: 13, sta: 10 }, sp: 14, icon: 'bracers', sell: 11200 });
  gear('malicia_dagger', 'Necromantic Dagger', 'weapon', { wtype: 'dagger', lvl: 59, dmg: [48, 90], speed: 1.8, stats: { agi: 16, sta: 10 }, icon: 'dagger', sell: 12400 });
  gear('gandling_staff', 'Headmaster\'s Charge', 'weapon', { wtype: 'staff', lvl: 60, dmg: [90, 134], speed: 3, stats: { int: 24, spi: 18 }, sp: 40, icon: 'staff', sell: 13600 });
  gear('gandling_robe', 'Robe of the Headmaster', 'chest', { atype: 'cloth', lvl: 60, armor: 124, stats: { int: 23, spi: 17 }, sp: 30, icon: 'chest_cloth', sell: 13400 });
  gear('gandling_leather', 'Skulk Hide Jerkin', 'chest', { atype: 'leather', lvl: 60, armor: 280, stats: { agi: 24, sta: 17 }, icon: 'chest_leather', sell: 13400 });
  gear('gandling_plate', 'Deathbone Chestplate', 'chest', { atype: 'mail', lvl: 60, armor: 520, stats: { str: 24, sta: 20 }, icon: 'chest_mail', sell: 13600 });

  Object.assign(D.MOBS, {
    scholomance_acolyte: { name: 'Blackcloister Acolyte', ranged: 'shadow', lvl: [57, 58], family: 'humanoid', drops: [['thieves_coin', 0.5], ['linen_cloth', 0.35]] },
    scholomance_necromancer: { name: 'Blackcloister Necromancer', ranged: 'shadow', lvl: [58, 59], family: 'humanoid', drops: [['thieves_coin', 0.55], ['linen_cloth', 0.35]], aggro: 'Another body for the lessons!' },
    risen_construct: { name: 'Risen Construct', lvl: [58, 59], family: 'undead', hpMult: 1.3, drops: [['rotting_flesh', 0.5]] },
    kirtonos_the_herald: { name: 'Skreel the Herald', lvl: [58, 58], family: 'demon', boss: true, special: 'kelris', summon: 'scholomance_acolyte', specialText: 'Skreel shrieks, and acolytes answer!', loot: ['kirtonos_cloak', 'jandice_gloves'], qdrops: [['kirtonos_blood', 1]] },
    jandice_barov: { name: 'Mirela Varga', lvl: [58, 58], family: 'undead', boss: true, special: 'whirl', specialText: 'Mirela splits into a dozen illusions!', loot: ['jandice_gloves', 'kirtonos_cloak'] },
    rattlegore: { name: 'Bonecrunch', lvl: [58, 58], family: 'undead', boss: true, special: 'slam', specialText: 'Bonecrunch smashes the ground!', loot: ['rattlegore_legs', 'rattlegore_axe'] },
    ras_frostwhisper: { name: 'Morvish the Frozen', lvl: [59, 59], family: 'undead', boss: true, special: 'molten', specialText: 'Morvish the Frozen hurls a frost volley!', loot: ['ras_boots', 'ras_wand'], aggro: 'Your life is mine, mortal.' },
    instructor_malicia: { name: 'Instructor Grimsby', lvl: [59, 59], family: 'humanoid', boss: true, special: 'molten', specialText: 'Malicia hurls a shadow bolt!', loot: ['malicia_dagger', 'ras_boots'] },
    lord_alexei_barov: { name: 'Lord Anton Varga', lvl: [59, 59], family: 'undead', boss: true, special: 'cook', specialText: 'Anton Varga drains your life to heal himself.', loot: ['malicia_dagger', 'rattlegore_legs'], qdrops: [['barov_deed', 1]] },
    darkmaster_gandling: { name: 'Headmaster Sallow', lvl: [60, 60], family: 'undead', boss: true, special: 'kelris', summon: 'risen_construct', specialText: 'Headmaster Sallow shadow-shifts you into a room of the risen!', loot: ['gandling_staff', 'gandling_robe', 'gandling_leather', 'gandling_plate'], qdrops: [['gandling_head', 1]], aggro: 'School is in session!' },
  });

  const A = (id, q) => { q.faction = 'alliance'; D.QUESTS[id] = q; };
  const H = (id, q) => { q.faction = 'horde'; D.QUESTS[id] = q; };
  A('sc_gandling_a', { name: 'The Headmaster', lvl: 60, giver: 'commander_ashlam', turnin: 'commander_ashlam', dungeon: 'scholomance', text: 'Headmaster Sallow runs the Blackcloister, where the Hollow Host teaches necromancy. Bring me his head.',
    objs: [{ type: 'collect', item: 'gandling_head', n: 1 }], reward: { choice: ['fam_weapon60'] } });
  H('sc_gandling_h', { name: 'The Headmaster', lvl: 60, giver: 'high_executor_derrington', turnin: 'high_executor_derrington', dungeon: 'scholomance', text: 'The Pale Queen wants the headmaster of the Blackcloister dead. Bring me Headmaster Sallow\'s head.',
    objs: [{ type: 'collect', item: 'gandling_head', n: 1 }], reward: { choice: ['fam_weapon60'] } });
  A('sc_kirtonos_a', { name: 'The Herald', lvl: 58, giver: 'alchemist_arbington', turnin: 'alchemist_arbington', dungeon: 'scholomance', text: "A demon called Skreel guards the school's gates. Its blood could help me understand the plague.",
    objs: [{ type: 'collect', item: 'kirtonos_blood', n: 1 }], reward: { choice: ['fam_back_rare60'] } });
  H('sc_kirtonos_h', { name: 'The Herald', lvl: 58, giver: 'apothecary_dithers', turnin: 'apothecary_dithers', dungeon: 'scholomance', text: 'Skreel the Herald guards the Blackcloister. Its blood will serve the Royal Apothecary Guild.',
    objs: [{ type: 'collect', item: 'kirtonos_blood', n: 1 }], reward: { choice: ['fam_back_rare60'] } });
  A('sc_barov_a', { name: 'The Varga Family Fortune', lvl: 59, giver: 'argent_officer_a', turnin: 'argent_officer_a', dungeon: 'scholomance', text: 'The Vargas sold Castle Ardmore to the Cult for eternal life. Lord Anton still carries the deed. Take it.',
    objs: [{ type: 'collect', item: 'barov_deed', n: 1 }], reward: { choice: ['fam_waist60'] } });
  H('sc_barov_h', { name: 'The Varga Family Fortune', lvl: 59, giver: 'argent_officer_h', turnin: 'argent_officer_h', dungeon: 'scholomance', text: 'Lord Anton Varga carries the deed to Castle Ardmore. Take it back from the dead.',
    objs: [{ type: 'collect', item: 'barov_deed', n: 1 }], reward: { choice: ['fam_waist60'] } });
  Object.assign(D.DUNGEONS, {
    scholomance: { music: 'blackcloister', name: 'The Blackcloister', minLvl: 57, par: 483, trialPar: 630, size: 5, trashMult: { hp: 2.2, dmg: 3.1 }, bossMult: { hp: 10, dmg: 5.7 }, trial: { trashMult: { hp: 2.2, dmg: 2.2 }, bossMult: { hp: 10, dmg: 4.1 } }, pulls: [ // damage raised to the level-60 dungeon target (#215: a fitted player wipes in 10-20% of runs); Trials keep the numbers they were tuned on
      { scene: 'scholo_hall', label: 'The reliquary', mobs: ['scholomance_acolyte', 'scholomance_acolyte'] },
      { scene: 'scholo_hall', label: 'Skreel the Herald', mobs: ['kirtonos_the_herald'], boss: true },
      { scene: 'scholo_hall', label: 'Mirela Varga', mobs: ['jandice_barov'], boss: true },
      { scene: 'scholo_crypt', label: 'The ossuary', mobs: ['risen_construct', 'scholomance_necromancer'] },
      { scene: 'scholo_crypt', label: 'Bonecrunch', mobs: ['rattlegore'], boss: true },
      { scene: 'scholo_crypt', label: 'Morvish the Frozen', mobs: ['ras_frostwhisper'], boss: true },
      { scene: 'scholo_hall', label: 'The classrooms', mobs: ['scholomance_necromancer', 'scholomance_acolyte', 'scholomance_acolyte'] },
      { scene: 'scholo_hall', label: 'Instructor Grimsby', mobs: ['instructor_malicia'], boss: true },
      { scene: 'scholo_hall', label: 'Lord Anton Varga', mobs: ['lord_alexei_barov'], boss: true },
      { scene: 'scholo_study', label: 'Headmaster Sallow', mobs: ['darkmaster_gandling'], boss: true },
    ] },
  });
  Object.assign(D.ACTIVITIES, {
    scholomance: { name: 'The Blackcloister', dungeon: 'scholomance', where: 'caer_darrow', size: 5, minLvl: 57, maxLvl: 60, desc: 'Dungeon in the West Rotmoor. 5 players. Both factions.' },
  });
})(typeof window !== 'undefined' ? window : globalThis);
