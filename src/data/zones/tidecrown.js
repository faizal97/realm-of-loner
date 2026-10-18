// EXPANSION: The Tidecrown Citadel (raid, 10 players, level 60). Prince Aeldran's drowned seat out in the surf of the
// Stormveil Reach, and beneath it the Deepmother, Nal'veshra. Both factions queue from the citadel gate.
(function (root) {
  const D = root.D;
  D.item('drowned_crown', { name: 'The Drowned Crown', slot: 'quest', q: 1, icon: 'ring' });
  D.item('deepmother_heart', { name: "Heart of the Deepmother", slot: 'quest', q: 1, icon: 'seed' });
  const epic = (id, name, slot, o) => D.item(id, Object.assign({ name, slot, q: 4 }, o));
  epic('serathis_legs', 'Legplates of the Tide Commander', 'legs', { atype: 'mail', lvl: 60, armor: 520, stats: { str: 26, sta: 22 }, icon: 'legs', sell: 18000 });
  epic('serathis_gloves', "Serathis's Coral Grips", 'hands', { atype: 'leather', lvl: 60, armor: 160, stats: { agi: 21, sta: 15 }, icon: 'gloves', sell: 17000 });
  epic('twins_ring', 'Band of the Twin Tides', 'finger', { lvl: 60, stats: { sta: 16, int: 14 }, sp: 16, icon: 'ring', sell: 17000 });
  epic('twins_boots', 'Riptide Walkers', 'feet', { atype: 'cloth', lvl: 60, armor: 84, stats: { int: 19, spi: 14 }, sp: 22, icon: 'boots', sell: 17000 });
  epic('colossus_belt', 'Coralheart Girdle', 'waist', { atype: 'mail', lvl: 60, armor: 400, stats: { str: 21, sta: 20 }, icon: 'belt', sell: 17000 });
  epic('colossus_bracers', 'Living Coral Bracers', 'wrist', { atype: 'leather', lvl: 60, armor: 130, stats: { agi: 18, sta: 14 }, icon: 'bracers', sell: 16800 });
  epic('aeldran_blade', 'Tidecrown, Blade of the Prince', 'weapon', { wtype: 'sword', lvl: 60, dmg: [104, 156], speed: 3.2, stats: { str: 27, sta: 18 }, icon: 'sword', sell: 20000 });
  epic('aeldran_dagger', 'Fang of the Drowned Court', 'weapon', { wtype: 'dagger', lvl: 60, dmg: [58, 106], speed: 1.8, stats: { agi: 21, sta: 13 }, icon: 'dagger', sell: 19600 });
  epic('aeldran_cloak', "Prince's Drowned Mantle", 'back', { lvl: 60, armor: 96, stats: { sta: 17, agi: 14 }, icon: 'cloak', sell: 17600 });
  epic('deepmother_staff', "Nal'veshra's Abyssal Staff", 'weapon', { wtype: 'staff', lvl: 60, dmg: [104, 150], speed: 3, stats: { int: 30, spi: 22 }, sp: 50, icon: 'staff', sell: 20400 });
  epic('deepmother_maul', 'Undertow', 'weapon', { wtype: 'mace', lvl: 60, dmg: [88, 140], speed: 2.7, stats: { str: 22, sta: 17 }, icon: 'mace', sell: 20000 });
  epic('deepmother_robe', 'Robe of the Abyss', 'chest', { atype: 'cloth', lvl: 60, armor: 140, stats: { int: 29, spi: 21 }, sp: 38, icon: 'chest_cloth', sell: 19600 });
  epic('deepmother_leather', 'Leviathan Hide Tunic', 'chest', { atype: 'leather', lvl: 60, armor: 310, stats: { agi: 29, sta: 21 }, icon: 'chest_leather', sell: 19600 });
  epic('deepmother_plate', 'Deepmother Scale Hauberk', 'chest', { atype: 'mail', lvl: 60, armor: 580, stats: { str: 29, sta: 25 }, icon: 'chest_mail', sell: 19800 });

  // the raid's set (v10.7): each piece has its look, and a recoloured Hard look when it drops on Hard (G.hardCopy)
  D.ITEMS.aeldran_cloak.look = ['back', 'tc_mantle'];
  D.ITEMS.deepmother_robe.look = ['chest', 'tc_robe'];
  D.ITEMS.deepmother_leather.look = ['chest', 'tc_leather'];
  D.ITEMS.deepmother_plate.look = ['chest', 'tc_mail'];
  D.ITEMS.serathis_legs.look = ['legs', 'tc_legs'];
  D.ITEMS.aeldran_blade.look = ['weapon', 'tc_sword'];
  D.ITEMS.aeldran_dagger.look = ['weapon', 'tc_dagger'];
  D.ITEMS.deepmother_staff.look = ['weapon', 'tc_staff'];
  D.ITEMS.deepmother_maul.look = ['weapon', 'tc_mace'];

  Object.assign(D.MOBS, {
    tidecrown_guard: { name: 'Tidecrown Royal Guard', lvl: [60, 60], family: 'humanoid', hpMult: 1.2, drops: [['thieves_coin', 0.6], ['linen_cloth', 0.3]], aggro: 'Kneel before the Prince!' },
    tidecrown_tidecaller: { name: 'Tidecrown Tidecaller', lvl: [60, 60], family: 'humanoid', drops: [['thieves_coin', 0.6], ['linen_cloth', 0.4]] },
    abyssal_spawn: { name: 'Abyssal Spawn', plural: 'Abyssal Spawn', lvl: [60, 60], family: 'elemental', hpMult: 1.3, drops: [['gold_dust', 0.3]] },
    commander_serathis: { name: 'Commander Serathis', lvl: [60, 60], family: 'humanoid', boss: true, special: 'slam', buster: { style: 'crush', name: 'Trident Thrust', text: 'Serathis levels his trident at the tank!', size: 3, mend: 1.5, kickCap: 0, floor: 1.5, brace: 1.5 }, specialText: 'Serathis drives his trident into the ground!', loot: ['serathis_legs', 'serathis_gloves', 'colossus_bracers'], aggro: 'The Prince\'s gate does not open for thieves.' },
    tide_twin_myrel: { name: 'Myrel of the Rising Tide', lvl: [60, 60], family: 'humanoid', boss: true, hpMult: 0.6, dmgMult: 0.6, special: 'molten', specialText: 'Myrel calls a rising tide!', loot: ['twins_ring', 'twins_boots'], aggro: 'Sister, they are here.' },
    tide_twin_sorin: { name: 'Sorin of the Falling Tide', lvl: [60, 60], family: 'humanoid', boss: true, hpMult: 0.6, dmgMult: 0.6, special: 'whirl', specialText: 'Sorin spins through the falling tide!', loot: ['twins_boots', 'twins_ring'], aggro: 'Then we drown them together.' },
    coralheart_colossus: { name: 'Coralheart Colossus', lvl: [60, 60], family: 'elemental', boss: true, special: 'slam', buster: { style: 'heavy', name: 'Tidal Crush', text: 'The Coralheart Colossus lifts its coral arm high!', size: 4, floor: 2, cast: 4, brace: 1.5, hard: { floor: 1 } }, specialText: 'The Coralheart Colossus shakes the citadel!', loot: ['colossus_belt', 'colossus_bracers', 'serathis_gloves'] },
    prince_aeldran: { name: 'Prince Aeldran Tidecrown', lvl: [60, 60], family: 'humanoid', boss: true, special: 'kelris', summon: 'tidecrown_guard', specialText: 'Aeldran calls his drowned court to his side!', loot: ['aeldran_blade', 'aeldran_dagger', 'aeldran_cloak'], qdrops: [['drowned_crown', 1]], aggro: 'Ten thousand years I waited. You will not take the surface from me.' },
    nalveshra: { name: "Nal'veshra the Deepmother", lvl: [60, 60], family: 'elemental', boss: true, special: 'kelris', summon: 'abyssal_spawn', specialText: 'The Deepmother spawns her children from the dark!', loot: ['deepmother_staff', 'deepmother_maul', 'deepmother_robe', 'deepmother_leather', 'deepmother_plate'], qdrops: [['deepmother_heart', 1]], aggro: 'Little lights. I will swallow you as I swallowed the spirit.' },
  });

  const A = (id, q) => { q.faction = 'alliance'; D.QUESTS[id] = q; };
  const H = (id, q) => { q.faction = 'horde'; D.QUESTS[id] = q; };
  A('tc_crown_a', { name: 'The Drowned Crown', lvl: 60, giver: 'admiral_vane', turnin: 'admiral_vane', dungeon: 'tidecrown_citadel', pre: ['tw_causeway'], text: 'Prince Aeldran rules the Tidecrown Citadel. He wears a crown that commands every drowned thing on this isle. Take it from him.',
    objs: [{ type: 'collect', item: 'drowned_crown', n: 1 }], reward: { choice: ['fam_ring_rare60'] } });
  H('tc_crown_h', { name: 'The Drowned Crown', lvl: 60, giver: 'shadow_hunter_zulkesh', turnin: 'shadow_hunter_zulkesh', dungeon: 'tidecrown_citadel', pre: ['sr_causeway'], text: 'The elf prince in the citadel commands the drowned with his crown. Take it, and the Wavebreakers can rest.',
    objs: [{ type: 'collect', item: 'drowned_crown', n: 1 }], reward: { choice: ['fam_ring_rare60'] } });
  A('tc_deepmother_a', { name: 'The Deepmother', lvl: 60, giver: 'lyssa_moonquill', turnin: 'lyssa_moonquill', dungeon: 'tidecrown_citadel', pre: ['tc_crown_a'], text: "The crown was never Aeldran's. It belongs to what lies beneath the citadel: Nal'veshra, the spirit that kept Sael'anor alive. End her.",
    objs: [{ type: 'collect', item: 'deepmother_heart', n: 1 }], reward: { choice: ['fam_back_rare60'] } });
  H('tc_deepmother_h', { name: 'The Deepmother', lvl: 60, giver: 'hexxer_mazu', turnin: 'hexxer_mazu', dungeon: 'tidecrown_citadel', pre: ['tc_crown_h'], text: "Shal'zua's spirit is not free. The thing under the citadel ate her. Mazu wants its heart.",
    objs: [{ type: 'collect', item: 'deepmother_heart', n: 1 }], reward: { choice: ['fam_back_rare60'] } });
  Object.assign(D.DUNGEONS, {
    tidecrown_citadel: { name: 'The Tidecrown Citadel', raid: true, music: 'tidecrown', minLvl: 60, par: 506, trialPar: 660, size: 10, trashMult: { hp: 4.4, dmg: 4.4 }, bossMult: { hp: 22, dmg: 12.6 }, trial: { trashMult: { hp: 4.4, dmg: 2.6 }, bossMult: { hp: 22, dmg: 7.4 } }, pulls: [ // Normal and Hard damage raised (#215: sim/difficulty.js, a fitted player wipes in 20-35% of runs); Trials keep the numbers they were tuned on
      { scene: 'citadel_court', label: 'The drowned courtyard', mobs: ['tidecrown_guard', 'tidecrown_guard', 'tidecrown_tidecaller'] },
      { scene: 'citadel_court', label: 'Commander Serathis', mobs: ['commander_serathis'], boss: true },
      { scene: 'citadel_court', label: 'The Hall of Tides', mobs: ['tidecrown_tidecaller', 'tidecrown_guard', 'abyssal_spawn'] },
      { scene: 'citadel_court', label: 'The Twin Tides', mobs: ['tide_twin_myrel', 'tide_twin_sorin'], boss: true },
      { scene: 'citadel_throne', label: 'The Coral Gallery', mobs: ['abyssal_spawn', 'abyssal_spawn'] },
      { scene: 'citadel_throne', label: 'Coralheart Colossus', mobs: ['coralheart_colossus'], boss: true },
      { scene: 'citadel_throne', label: 'Prince Aeldran Tidecrown', mobs: ['prince_aeldran'], boss: true },
      { scene: 'citadel_abyss', label: 'The Abyss', mobs: ['abyssal_spawn', 'abyssal_spawn', 'tidecrown_tidecaller'] },
      { scene: 'citadel_abyss', label: "Nal'veshra the Deepmother", mobs: ['nalveshra'], boss: true },
    ],
    // Hard (v10.7): opens after a Normal clear; stronger enemies (tuned by sim/hardraid.js) and one extra mechanic per boss
    hard: { trashMult: { hp: 4.8, dmg: 4.6 }, bossMult: { hp: 24.2, dmg: 13.2 }, extra: {
      commander_serathis: [{ kind: 'hit', tele: true, miss: 4, name: 'Courtyard Wave', every: 14, mult: 0.45, who: 'all', school: 'frost', text: 'Serathis raises a wave over the courtyard!' }],
      tide_twin_myrel: [{ kind: 'heal', tele: true, miss: 2.5, name: 'Rising Tide', every: 18, heal: 0.03, text: 'The rising tide gathers around Myrel!' }],
      tide_twin_sorin: [{ kind: 'enrage', at: 0.3, mult: 1.3, text: 'Sorin fights harder as the tide falls!' }],
      coralheart_colossus: [{ kind: 'adds', at: 0.5, mob: 'abyssal_spawn', n: 2, lvl: 0, text: 'Two spawn of the deep crawl out of the Colossus!' }],
      prince_aeldran: [{ kind: 'enrage', at: 0.3, mult: 1.25, text: 'Aeldran fights with ten thousand years of grief!' }],
      nalveshra: [{ kind: 'hit', tele: true, miss: 4, name: 'Deep Tendril', every: 12, mult: 1, who: 'random', school: 'shadow', text: 'A tendril rises from the deep!' }],
    } } },
  });
  Object.assign(D.ACTIVITIES, {
    tidecrown_citadel: { name: 'The Tidecrown Citadel', dungeon: 'tidecrown_citadel', where: 'tidecrown_gate', size: 10, minLvl: 60, maxLvl: 60, desc: 'Raid in the Stormveil Reach. 10 players. Both factions.' },
  });
})(typeof window !== 'undefined' ? window : globalThis);
