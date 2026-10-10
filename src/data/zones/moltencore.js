// The Magma Throne (raid, 10 players, level 60): the molten sea beneath Cinderpeak Depths, where Vulcarn the King Below sleeps.
// The Slagborn dug for him for two hundred years; with Emperor Grimmark dead, nothing holds him asleep. Optional for the
// story, the gear step at 60 before the Stormveil Isle. Both factions queue from the gate inside Cinderpeak.
// Loot sits at about 90% of the Tidecrown Citadel's, which stays the strongest raid.
(function (root) {
  const D = root.D;
  D.item('firelord_essence', { name: 'Essence of the King Below', slot: 'quest', q: 1, icon: 'firebolt' });
  D.item('executus_rune', { name: 'Binding Rune of the Steward', slot: 'quest', q: 1, icon: 'dust' });
  const epic = (id, name, slot, o) => D.item(id, Object.assign({ name, slot, q: 4 }, o));
  // Cinderhound
  epic('magmadar_legs', 'Legguards of the Cinderhound', 'legs', { atype: 'mail', lvl: 60, armor: 470, stats: { str: 23, sta: 20 }, icon: 'legs', sell: 16200 });
  epic('magmadar_cloak', 'Cloak of the Molten Hound', 'back', { lvl: 60, armor: 86, stats: { sta: 15, agi: 13 }, icon: 'cloak', sell: 15800 });
  // Stonecore
  epic('garr_bracers', 'Bindings of the Firesworn', 'wrist', { atype: 'leather', lvl: 60, armor: 116, stats: { agi: 16, sta: 12 }, icon: 'bracers', sell: 15100 });
  epic('garr_ring', 'Firesworn Signet', 'finger', { lvl: 60, stats: { sta: 14, int: 13 }, sp: 14, icon: 'ring', sell: 15300 });
  // Baron Ashfall
  epic('geddon_boots', 'Cinderwalkers of the Baron', 'feet', { atype: 'cloth', lvl: 60, armor: 76, stats: { int: 17, spi: 12 }, sp: 20, icon: 'boots', sell: 15300 });
  epic('geddon_gloves', 'Inferno Grips', 'hands', { atype: 'leather', lvl: 60, armor: 144, stats: { agi: 19, sta: 13 }, icon: 'gloves', sell: 15300 });
  // Magmahulk the Incinerator
  epic('golemagg_belt', 'Girdle of the Incinerator', 'waist', { atype: 'mail', lvl: 60, armor: 360, stats: { str: 19, sta: 18 }, icon: 'belt', sell: 15300 });
  epic('golemagg_sword', 'Magmaheart Greatblade', 'weapon', { wtype: 'sword', lvl: 60, dmg: [94, 140], speed: 3.2, stats: { str: 24, sta: 16 }, icon: 'sword', sell: 18000 });
  // Brimstone Harbinger
  epic('sulfuron_dagger', "Harbinger's Fang", 'weapon', { wtype: 'dagger', lvl: 60, dmg: [52, 95], speed: 1.8, stats: { agi: 19, sta: 12 }, icon: 'dagger', sell: 17600 });
  epic('sulfuron_cord', "Ashbound Priest's Cord", 'waist', { atype: 'cloth', lvl: 60, armor: 66, stats: { int: 16, spi: 11 }, sp: 18, icon: 'belt', sell: 15000 });
  // Steward Cindral
  epic('executus_staff', 'Staff of the Steward', 'weapon', { wtype: 'staff', lvl: 60, dmg: [94, 135], speed: 3, stats: { int: 27, spi: 20 }, sp: 45, icon: 'staff', sell: 18400 });
  epic('executus_mace', 'Ashbound Scepter', 'weapon', { wtype: 'mace', lvl: 60, dmg: [79, 126], speed: 2.7, stats: { str: 20, sta: 15 }, icon: 'mace', sell: 18000 });
  // Vulcarn: a lesser hammer forged in the King Below's fire, and the chest pieces
  epic('ragnaros_hammer', 'Emberfall, Hammer of the King Below', 'weapon', { wtype: 'mace', lvl: 60, dmg: [96, 146], speed: 3.4, stats: { str: 25, sta: 17 }, icon: 'mace', sell: 18400 });
  epic('ragnaros_robe', 'Robe of Living Flame', 'chest', { atype: 'cloth', lvl: 60, armor: 126, stats: { int: 26, spi: 19 }, sp: 34, icon: 'chest_cloth', sell: 17600 });
  epic('ragnaros_leather', 'Firehide Tunic', 'chest', { atype: 'leather', lvl: 60, armor: 279, stats: { agi: 26, sta: 19 }, icon: 'chest_leather', sell: 17600 });
  epic('ragnaros_mail', 'Magmaforged Hauberk', 'chest', { atype: 'mail', lvl: 60, armor: 522, stats: { str: 26, sta: 22 }, icon: 'chest_mail', sell: 17800 });

  // the raid's set (v10.7): each piece has its look, and a recoloured Hard look when it drops on Hard (G.hardCopy)
  D.ITEMS.magmadar_cloak.look = ['back', 'mc_cloak'];
  D.ITEMS.ragnaros_robe.look = ['chest', 'mc_robe'];
  D.ITEMS.ragnaros_leather.look = ['chest', 'mc_leather'];
  D.ITEMS.ragnaros_mail.look = ['chest', 'mc_mail'];
  D.ITEMS.magmadar_legs.look = ['legs', 'mc_legs'];
  D.ITEMS.golemagg_sword.look = ['weapon', 'mc_sword'];
  D.ITEMS.sulfuron_dagger.look = ['weapon', 'mc_dagger'];
  D.ITEMS.executus_staff.look = ['weapon', 'mc_staff'];
  D.ITEMS.executus_mace.look = ['weapon', 'mc_mace'];
  D.ITEMS.ragnaros_hammer.look = ['weapon', 'mc_hammer'];

  Object.assign(D.MOBS, {
    // trash
    core_hound: { name: 'Core Hound', lvl: [60, 60], family: 'beast', drops: [['gold_dust', 0.2]] },
    molten_giant: { name: 'Molten Giant', lvl: [60, 60], family: 'giant', hpMult: 1.35, drops: [['gold_dust', 0.35]] },
    firelord: { name: 'King Below', lvl: [60, 60], family: 'elemental', hpMult: 1.15, drops: [['gold_dust', 0.3]] },
    core_surger: { name: 'Lava Surger', lvl: [60, 60], family: 'elemental', drops: [['gold_dust', 0.25]] },
    flamewaker_guard: { name: 'Ashbound Guard', lvl: [60, 60], family: 'elemental', hpMult: 1.2, drops: [['gold_dust', 0.3]], aggro: 'The master sleeps. You will not wake him.' },
    // boss adds
    firesworn: { name: 'Firesworn', lvl: [60, 60], family: 'elemental', hpMult: 0.55, dmgMult: 0.5, drops: [] },
    core_rager: { name: 'Core Rager', lvl: [60, 60], family: 'beast', hpMult: 0.6, dmgMult: 0.45, drops: [] },
    flamewaker_priest: { name: 'Ashbound Priest', ranged: 'fire', lvl: [60, 60], family: 'elemental', hpMult: 0.8, drops: [['gold_dust', 0.2]] },
    flamewaker_elite: { name: 'Ashbound Elite', lvl: [60, 60], family: 'elemental', hpMult: 0.8, dmgMult: 0.6, drops: [['gold_dust', 0.3]] },
    flamewaker_healer: { name: 'Ashbound Healer', lvl: [60, 60], family: 'elemental', hpMult: 0.6, dmgMult: 0.5, special: 'cook', specialText: 'The Ashbound Healer knits its flames back together.', drops: [['gold_dust', 0.2]] },
    son_of_flame: { name: 'Son of Flame', lvl: [60, 60], family: 'elemental', hpMult: 0.9, drops: [] },
    // bosses
    magmadar: { name: 'Cinderhound', lvl: [60, 60], family: 'beast', boss: true, special: 'slam', specialText: 'Cinderhound sinks both jaws into you!', loot: ['magmadar_legs', 'magmadar_cloak', 'garr_bracers'] },
    garr: { name: 'Stonecore', lvl: [60, 60], family: 'elemental', boss: true, dmgMult: 0.9, special: 'whirl', specialText: 'Stonecore sends a pulse of fire through the cavern!', loot: ['garr_bracers', 'garr_ring', 'magmadar_cloak'] },
    baron_geddon: { name: 'Baron Ashfall', lvl: [60, 60], family: 'elemental', boss: true, special: 'molten', specialText: 'Baron Ashfall makes you a living bomb!', loot: ['geddon_boots', 'geddon_gloves', 'garr_ring'] },
    golemagg: { name: 'Magmahulk the Incinerator', lvl: [60, 60], family: 'giant', boss: true, special: 'slam', specialText: 'Magmahulk brings his fists down on you!', loot: ['golemagg_belt', 'golemagg_sword', 'magmadar_legs'] },
    sulfuron_harbinger: { name: 'Brimstone Harbinger', lvl: [60, 60], family: 'elemental', boss: true, hpMult: 0.85, special: 'kelris', summon: 'flamewaker_priest', specialText: 'Brimstone calls another priest to the fire!', loot: ['sulfuron_dagger', 'sulfuron_cord', 'geddon_gloves'], aggro: 'The King Below\'s herald does not kneel to thieves.' },
    majordomo_executus: { name: 'Steward Cindral', lvl: [60, 60], family: 'elemental', boss: true, hpMult: 0.8, dmgMult: 0.85, special: 'whirl', specialText: 'Steward Cindral looses a wave of flame!', loot: ['executus_staff', 'executus_mace', 'sulfuron_cord'], qdrops: [['executus_rune', 1]], aggro: 'You walk uninvited in the King Below\'s house. You will leave it as ash.' },
    ragnaros: { name: 'Vulcarn', lvl: [60, 60], family: 'elemental', boss: true, hpMult: 1.25, dmgMult: 1.75, special: 'kelris', summon: 'son_of_flame', specialText: 'Vulcarn calls a Son of Flame out of the lava!', loot: ['ragnaros_hammer', 'ragnaros_robe', 'ragnaros_leather', 'ragnaros_mail'], qdrops: [['firelord_essence', 1]], aggro: 'You dug me out of my sleep for this? Then take the fire you came for.' },
  });

  // the gate: down from Cinderpeak into its fiery heart
  Object.assign(D.PLACES, {
    molten_core_gate: { gate: true, name: 'The Magma Throne', zone: 'The Cinderfields', region: D.PLACES.blackrock_mountain.region, scene: 'molten_core_gate', lvl: [60, 60], mobs: [], pool: 0, npcs: [], links: { blackrock_mountain: 20 } },
  });
  D.PLACES.blackrock_mountain.links.molten_core_gate = 20;

  const A = (id, q) => { q.faction = 'alliance'; D.QUESTS[id] = q; };
  const H = (id, q) => { q.faction = 'horde'; D.QUESTS[id] = q; };
  A('mc_executus_a', { name: 'The King Below\'s Steward', lvl: 60, giver: 'helendis', turnin: 'helendis', dungeon: 'molten_core', text: 'Steward Cindral keeps the house of Vulcarn. His ashbounds tend the runes that feed the fire below. Break him and bring me the rune he carries. I want to know what it binds.',
    objs: [{ type: 'collect', item: 'executus_rune', n: 1 }], reward: { choice: ['fam_ring_rare60'] } });
  H('mc_executus_h', { name: 'The King Below\'s Steward', lvl: 60, giver: 'gorzeeki', turnin: 'gorzeeki', dungeon: 'molten_core', text: 'The King Below has a servant who runs his house for him. Steward Cindral. He carries a binding rune. Bring it to me. I have plans for it.',
    objs: [{ type: 'collect', item: 'executus_rune', n: 1 }], reward: { choice: ['fam_ring_rare60'] } });
  A('mc_firelord_a', { name: 'The King Below Wakes', lvl: 60, giver: 'marshal_maxwell', turnin: 'marshal_maxwell', dungeon: 'molten_core', text: 'The Emperor is dead, and the mountain has not gone quiet. The Slagborn dug for Vulcarn for two hundred years. With Grimmark gone, nothing keeps their master asleep. Go down into the Magma Throne and put him back in the fire. Bring me his essence.',
    objs: [{ type: 'collect', item: 'firelord_essence', n: 1 }], reward: { choice: ['fam_back_rare60'] } });
  H('mc_firelord_h', { name: 'The King Below Wakes', lvl: 60, giver: 'thal_kaur', turnin: 'thal_kaur', dungeon: 'molten_core', text: 'The Emperor\'s fall woke something worse. Vulcarn stirs in the Magma Throne, and the whole mountain shakes with him. The High Chief will not wait for him to climb out. Take nine others down there and bring back his essence.',
    objs: [{ type: 'collect', item: 'firelord_essence', n: 1 }], reward: { choice: ['fam_back_rare60'] } });

  Object.assign(D.DUNGEONS, {
    molten_core: { name: 'The Magma Throne', raid: true, music: 'magma', minLvl: 60, par: 580, trialPar: 720, size: 10, trashMult: { hp: 3.3, dmg: 2.2 }, bossMult: { hp: 17, dmg: 7.2 }, pulls: [
      { scene: 'mc_caverns', label: 'The lava caverns', mobs: ['core_hound', 'core_hound', 'core_surger'] },
      { scene: 'mc_caverns', label: 'Molten giants', mobs: ['molten_giant', 'molten_giant'] },
      { scene: 'mc_caverns', label: 'Cinderhound', mobs: ['magmadar'], boss: true },
      { scene: 'mc_caverns', label: 'The king belows', mobs: ['firelord', 'core_surger'] },
      { scene: 'mc_caverns', label: 'Stonecore', mobs: ['garr', 'firesworn', 'firesworn'], boss: true },
      { scene: 'mc_halls', label: 'The rune-lit halls', mobs: ['flamewaker_guard', 'flamewaker_guard', 'firelord'] },
      { scene: 'mc_halls', label: 'Baron Ashfall', mobs: ['baron_geddon'], boss: true },
      { scene: 'mc_halls', label: 'A core hound pack', mobs: ['core_hound', 'core_hound', 'core_hound'] },
      { scene: 'mc_halls', label: 'Magmahulk the Incinerator', mobs: ['golemagg', 'core_rager', 'core_rager'], boss: true },
      { scene: 'mc_halls', label: 'Brimstone Harbinger', mobs: ['sulfuron_harbinger', 'flamewaker_priest'], boss: true },
      { scene: 'mc_domain', label: "The Steward's guard", mobs: ['molten_giant', 'flamewaker_guard', 'core_surger'] },
      { scene: 'mc_domain', label: 'Steward Cindral', mobs: ['majordomo_executus', 'flamewaker_elite', 'flamewaker_healer'], boss: true },
      { scene: 'mc_lake', label: 'Vulcarn', mobs: ['ragnaros'], boss: true },
    ],
    // Hard (v10.7): opens after a Normal clear; stronger enemies (tuned by sim/hardraid.js) and one extra mechanic per boss
    hard: { trashMult: { hp: 4.5, dmg: 2.9 }, bossMult: { hp: 25, dmg: 10.4 }, extra: {
      magmadar: [{ kind: 'enrage', at: 0.3, mult: 1.3, text: 'Cinderhound goes into a frenzy!' }],
      garr: [{ kind: 'adds', at: 0.5, mob: 'firesworn', n: 2, lvl: 0, text: 'Stonecore pulls two more Firesworn out of the rock!' }],
      baron_geddon: [{ kind: 'hit', every: 15, mult: 0.5, who: 'all', school: 'fire', text: 'Baron Ashfall bursts into a ring of fire!' }],
      golemagg: [{ kind: 'heal', every: 20, heal: 0.04, text: 'Magmahulk sinks into the lava and comes out whole!' }],
      sulfuron_harbinger: [{ kind: 'hit', every: 12, mult: 1, who: 'random', school: 'fire', text: 'Brimstone Harbinger hurls a ball of brimstone!' }],
      majordomo_executus: [{ kind: 'adds', at: 0.5, mob: 'flamewaker_healer', n: 1, lvl: 0, text: 'Steward Cindral calls another healer to his side!' }],
      ragnaros: [{ kind: 'adds', at: 0.25, mob: 'son_of_flame', n: 2, lvl: 0, text: 'Vulcarn roars, and two more Sons of Flame rise from the lava!' }],
    } } },
  });
  Object.assign(D.ACTIVITIES, {
    molten_core: { name: 'The Magma Throne', dungeon: 'molten_core', where: 'molten_core_gate', size: 10, minLvl: 60, maxLvl: 60, desc: 'Raid beneath Cinderpeak. 10 players. Both factions.' },
  });
})(typeof window !== 'undefined' ? window : globalThis);
