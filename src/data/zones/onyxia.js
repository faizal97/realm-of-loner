// Veshmira's Lair (raid, 10 players, level 60). Exposed at the Kingsmere court, the Brood Mother fled south to her cave
// under the Dragonmire in Saltmarsh. The storm she raised over the sea will not break while she lives; her death opens
// the way to the Stormveil Isle. Both factions queue from the lair's mouth. Loot sits a step below the Tidecrown Citadel.
(function (root) {
  const D = root.D;
  D.item('onyxia_head', { name: 'Head of Veshmira', slot: 'quest', q: 1, icon: 'head' });
  const epic = (id, name, slot, o) => D.item(id, Object.assign({ name, slot, q: 4 }, o));
  epic('onyx_mantle', 'Mantle of the Brood Mother', 'back', { lvl: 60, armor: 86, stats: { sta: 15, agi: 13 }, icon: 'cloak', sell: 15800 });
  epic('onyx_robe', 'Robe of the False Court', 'chest', { atype: 'cloth', lvl: 60, armor: 126, stats: { int: 26, spi: 19 }, sp: 34, icon: 'chest_cloth', sell: 17600 });
  epic('onyx_tunic', 'Wyrmhide Tunic', 'chest', { atype: 'leather', lvl: 60, armor: 279, stats: { agi: 26, sta: 19 }, icon: 'chest_leather', sell: 17600 });
  epic('onyx_legs', 'Blackscale Legguards', 'legs', { atype: 'mail', lvl: 60, armor: 468, stats: { str: 23, sta: 20 }, icon: 'legs', sell: 16200 });
  epic('onyx_belt', 'Stormscale Girdle', 'waist', { atype: 'mail', lvl: 60, armor: 360, stats: { str: 19, sta: 18 }, icon: 'belt', sell: 15300 });
  epic('onyx_gloves', 'Talon-Stitched Gloves', 'hands', { atype: 'leather', lvl: 60, armor: 144, stats: { agi: 19, sta: 13 }, icon: 'gloves', sell: 15300 });
  epic('onyx_boots', 'Slippers of the Coronation', 'feet', { atype: 'cloth', lvl: 60, armor: 76, stats: { int: 17, spi: 13 }, sp: 20, icon: 'boots', sell: 15300 });
  epic('onyx_ring', "Lady Thorne's Signet", 'finger', { lvl: 60, stats: { sta: 14, int: 13 }, sp: 14, icon: 'ring', sell: 15300 });
  epic('onyx_sword', 'Wyrmfang Greatblade', 'weapon', { wtype: 'sword', lvl: 60, dmg: [94, 140], speed: 3.2, stats: { str: 24, sta: 16 }, icon: 'sword', sell: 18000 });
  epic('onyx_dagger', "Meriel's Kiss", 'weapon', { wtype: 'dagger', lvl: 60, dmg: [52, 95], speed: 1.8, stats: { agi: 19, sta: 12 }, icon: 'dagger', sell: 17600 });
  epic('onyx_staff', "Stormcaller's Staff", 'weapon', { wtype: 'staff', lvl: 60, dmg: [94, 135], speed: 3, stats: { int: 27, spi: 20 }, sp: 45, icon: 'staff', sell: 18400 });

  // the raid's set (v10.7): each piece has its look, and a recoloured Hard look when it drops on Hard (G.hardCopy)
  D.ITEMS.onyx_mantle.look = ['back', 'vesh_mantle'];
  D.ITEMS.onyx_robe.look = ['chest', 'vesh_robe'];
  D.ITEMS.onyx_tunic.look = ['chest', 'vesh_tunic'];
  D.ITEMS.onyx_legs.look = ['legs', 'vesh_legs'];
  D.ITEMS.onyx_sword.look = ['weapon', 'vesh_sword'];
  D.ITEMS.onyx_dagger.look = ['weapon', 'vesh_dagger'];
  D.ITEMS.onyx_staff.look = ['weapon', 'vesh_staff'];

  Object.assign(D.MOBS, {
    onyxian_warder: { name: 'Veshmiran Warder', lvl: [60, 60], family: 'dragonkin', hpMult: 1.2, drops: [['thieves_coin', 0.6]], aggro: 'The mother sleeps. You will not wake her.' },
    onyxian_whelp: { name: 'Veshmiran Whelp', fly: 7, lvl: [60, 60], family: 'dragonkin', hpMult: 0.6, dmgMult: 0.7, drops: [['ruined_pelt', 0.2]] },
    onyxia: { name: 'Veshmira', lvl: [60, 60], family: 'dragonkin', boss: true, special: 'kelris', summon: 'onyxian_whelp', specialText: 'Veshmira roars, and whelps pour out of the nests!',
      loot: ['onyx_mantle', 'onyx_robe', 'onyx_tunic', 'onyx_legs', 'onyx_belt', 'onyx_gloves', 'onyx_boots', 'onyx_ring', 'onyx_sword', 'onyx_dagger', 'onyx_staff'], qdrops: [['onyxia_head', 1]],
      aggro: 'You chased me across the sea for this? Little kingdoms send little heroes.' },
  });

  const A = (id, q) => { q.faction = 'alliance'; D.QUESTS[id] = q; };
  const H = (id, q) => { q.faction = 'horde'; D.QUESTS[id] = q; };
  A('dw_onyxia_a', { name: 'The Brood Mother', lvl: 60, giver: 'commander_ashby', turnin: 'commander_ashby', dungeon: 'onyxias_lair', pre: ['dw_a_lair'], text: 'Veshmira sleeps in that cave with her brood around her. The storm she raised still hangs over the sea, and the sailors say it will not break while she lives. No ship reaches the new isle until it does. Bring me her head. Take nine good people with you.',
    objs: [{ type: 'collect', item: 'onyxia_head', n: 1 }], reward: { choice: ['fam_back_rare60'] } });
  H('dw_onyxia_h', { name: 'The Brood Mother', lvl: 60, giver: 'warlord_durnak', turnin: 'warlord_durnak', dungeon: 'onyxias_lair', pre: ['dw_h_lair'], text: 'The dragon is in her cave. Her storm sits on the sea like a lid, and it will not lift while she breathes. The High Chief wants that sea open. Bring me her head, and take nine warriors with you.',
    objs: [{ type: 'collect', item: 'onyxia_head', n: 1 }], reward: { choice: ['fam_back_rare60'] } });

  const BREATH = (mult) => ({ kind: 'hit', name: 'Searing Breath', every: 25, mult, who: 'all', school: 'fire', text: 'Veshmira rears back and breathes fire over the cavern!' });
  Object.assign(D.DUNGEONS, {
    onyxias_lair: { name: "Veshmira's Lair", raid: true, music: 'veshmira', minLvl: 60, par: 188, trialPar: 330, size: 10, trashMult: { hp: 5, dmg: 2.6 }, bossMult: { hp: 30, dmg: 9.4 }, pulls: [
      { scene: 'lair_tunnel', label: 'The entry tunnel', mobs: ['onyxian_warder', 'onyxian_warder'] },
      { scene: 'lair_tunnel', label: 'The warders', mobs: ['onyxian_warder', 'onyxian_warder', 'onyxian_whelp'] },
      { scene: 'lair_cavern', label: 'The whelp nests', mobs: ['onyxian_whelp', 'onyxian_whelp', 'onyxian_whelp', 'onyxian_whelp'] },
      { scene: 'lair_cavern', label: 'Veshmira', mobs: ['onyxia'], boss: true },
    ],
    // Hard (v10.7): opens after a Normal clear. Stronger enemies (tuned by sim/hardraid.js: a group near the ceiling
    // wipes about 2-3 times on a first clear) and one extra mechanic per boss: her last phase calls the rest of the brood
    hard: { trashMult: { hp: 5.1, dmg: 2.65 }, bossMult: { hp: 31, dmg: 9.5 }, // #215: just above Normal; with the breath, more made Hard unwinnable
      extra: { onyxia: [BREATH(1.35), { kind: 'adds', at: 0.25, mob: 'onyxian_whelp', n: 3, lvl: 0, text: 'Veshmira shrieks, and the rest of the brood pours out of the nests!' }] } },
    // Normal: her breath over the whole raid (#215). Without it the fight tested only the tank: no damage number made a group
    // wipe on Normal without making Hard impossible
    extra: { onyxia: [Object.assign(BREATH(1.35), { hard: false })] } },
  });
  Object.assign(D.ACTIVITIES, {
    onyxias_lair: { name: "Veshmira's Lair", dungeon: 'onyxias_lair', where: 'onyxias_lair_gate', size: 10, minLvl: 60, maxLvl: 60, desc: 'Raid in Saltmarsh. 10 players. Both factions.' },
  });
})(typeof window !== 'undefined' ? window : globalThis);
