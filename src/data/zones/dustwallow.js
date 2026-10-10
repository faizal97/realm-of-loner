// Saltmarsh: contested, level 60 (Chapter 6, "The Creditor"). Beaten back from Kingsmere, Veshmira fled south across the
// sea to her lair in the Dragonmire. Harborwatch Isle (Accord, by ship from Gullhaven) and Mudwall Village (Krugar,
// by road from Dustfort) watch the marsh while her brood spreads out of the south. The raid is in onyxia.js.
(function (root) {
  const D = root.D;
  D.zone('dustwallow', { name: 'Saltmarsh', faction: 'contested', music: 'saltmarsh', town: 'saltmarsh_town' });
  D.item('drakonid_claw', { name: 'Drakeborn Claw', slot: 'quest', q: 1, icon: 'claw' });
  D.item('brood_scale', { name: 'Black Brood Scale', slot: 'quest', q: 1, icon: 'chest_box' });
  D.item('scorchmaw_fang', { name: "Scorchmaw's Fang", slot: 'quest', q: 1, icon: 'tusk' });
  D.item('scorchmaw_band', { name: 'Scorchmaw Band', slot: 'finger', q: 3, lvl: 60, stats: { agi: 13, sta: 14 }, icon: 'ring', sell: 13000, source: 'Scorchmaw, the Scorched Fen' });

  Object.assign(D.MOBS, {
    brood_whelp: { name: 'Brood Whelp', fly: 7, lvl: [58, 59], family: 'dragonkin', drops: [['ruined_pelt', 0.2]] },
    brood_drakonid: { name: 'Brood Drakeborn', lvl: [59, 60], family: 'dragonkin', hpMult: 1.15, drops: [['thieves_coin', 0.5]], qdrops: [['drakonid_claw', 0.55]], aggro: 'The mother is hungry.' },
    brood_dragonspawn: { name: 'Brood Dragonspawn', lvl: [59, 60], family: 'dragonkin', hpMult: 1.25, drops: [['thieves_coin', 0.55]], qdrops: [['brood_scale', 0.5]], aggro: 'None of you leave the bog.' },
    scorchmaw: { name: 'Scorchmaw', lvl: [60, 60], family: 'dragonkin', named: true, hpMult: 2.2, dmgMult: 2.6, drops: [['scorchmaw_band', 0.35], ['thieves_coin', 1]], qdrops: [['scorchmaw_fang', 1]] },
  });

  Object.assign(D.PLACES, {
    theramore_isle: { name: 'Harborwatch Isle', zone: 'Saltmarsh', region: 'dustwallow', faction: 'alliance', scene: 'theramore_isle', lvl: [58, 60], safe: true, inn: true, mobs: [], pool: 0,
      npcs: ['commander_ashby', 'mage_winfield', 'scout_holt', 'innkeeper_tolly', 'armorer_bexley'], vendor: 'innkeeper_tolly', gearVendor: 'armorer_bexley',
      links: { the_quagmire: 18, menethil_harbor: 60 }, via: { menethil_harbor: 'Ship to Gullhaven' } },
    brackenwall_village: { name: 'Mudwall Village', zone: 'Saltmarsh', region: 'dustwallow', faction: 'horde', scene: 'brackenwall_village', lvl: [58, 60], safe: true, inn: true, mobs: [], pool: 0,
      npcs: ['warlord_durnak', 'seer_longrunner', 'scout_vekra', 'innkeeper_mogra', 'gorvash'], vendor: 'innkeeper_mogra', gearVendor: 'gorvash',
      links: { the_quagmire: 18, crossroads: 60 }, via: { crossroads: 'Road to the Scrublands' } },
    the_quagmire: { name: 'The Quagmire', zone: 'Saltmarsh', region: 'dustwallow', scene: 'the_quagmire', lvl: [58, 59], mobs: [['brood_whelp', 6], ['brood_drakonid', 2]], pool: 9, npcs: [],
      links: { theramore_isle: 18, brackenwall_village: 18, scorched_fen: 16, the_wyrmbog: 20 } },
    scorched_fen: { name: 'The Scorched Fen', zone: 'Saltmarsh', region: 'dustwallow', scene: 'scorched_fen', lvl: [59, 60], mobs: [['brood_drakonid', 5], ['brood_whelp', 3]], named: { scorchmaw: 300 }, pool: 9, npcs: [],
      links: { the_quagmire: 16, the_wyrmbog: 18 } },
    the_wyrmbog: { name: 'The Dragonmire', zone: 'Saltmarsh', region: 'dustwallow', scene: 'the_wyrmbog', lvl: [59, 60], mobs: [['brood_dragonspawn', 5], ['brood_drakonid', 3]], pool: 10, npcs: [],
      links: { the_quagmire: 20, scorched_fen: 18, onyxias_lair_gate: 16 } },
    onyxias_lair_gate: { gate: true, name: "Veshmira's Lair", zone: 'Saltmarsh', region: 'dustwallow', scene: 'onyxias_lair_gate', lvl: [60, 60], safe: true, mobs: [], pool: 0, npcs: [], links: { the_wyrmbog: 16 } },
  });
  D.PLACES.menethil_harbor.links.theramore_isle = 60; D.PLACES.menethil_harbor.via.theramore_isle = 'Ship to Harborwatch';
  D.PLACES.crossroads.links.brackenwall_village = 60; D.PLACES.crossroads.via.brackenwall_village = 'Road to Saltmarsh';

  Object.assign(D.NPCS, {
    commander_ashby: { name: 'Commander Brant Ashby', title: 'Harborwatch Guard' },
    mage_winfield: { name: 'Orla Winfield', title: 'Harborwatch Mage' },
    scout_holt: { name: 'Scout Deren Holt', title: 'Marsh Scout' },
    innkeeper_tolly: { name: 'Innkeeper Mara Tolly', title: 'Innkeeper' },
    armorer_bexley: { name: 'Armorer Bexley', title: 'Weaponsmith' },
    warlord_durnak: { name: 'Warlord Durnak', title: 'Mudwall Village' },
    seer_longrunner: { name: 'Seer Hanu Longrunner', title: 'Shaman' },
    scout_vekra: { name: 'Scout Vekra', title: 'Marsh Scout' },
    innkeeper_mogra: { name: 'Innkeeper Mogra', title: 'Innkeeper' },
    gorvash: { name: 'Gorvash', title: 'Weaponsmith' },
  });

  const A = (id, q) => { q.faction = 'alliance'; D.QUESTS[id] = q; };
  const H = (id, q) => { q.faction = 'horde'; D.QUESTS[id] = q; };
  A('dw_to_theramore', { name: 'The Brood Mother', lvl: 60, giver: 'thelwater', turnin: 'commander_ashby', text: 'The Ledger\'s creditor was a dragon, Veshmira, and Lady Thorne sold the kingdom to her. They fled south over the sea, to a lair in Saltmarsh. Harborwatch watches that marsh. Take the ship from Gullhaven and report to Commander Ashby.',
    objs: [{ type: 'visit', place: 'theramore_isle' }], reward: { money: 4000 } });
  H('dw_to_brackenwall', { name: 'The Brood Mother', lvl: 60, giver: 'thrall_herald', turnin: 'warlord_durnak', text: 'The dragon who bought the human crown with her gold has gone to ground in Saltmarsh, and the Krugar owe her too. The High Chief wants eyes on her. Take the road south from Dustfort to Mudwall Village and find Warlord Durnak.',
    objs: [{ type: 'visit', place: 'brackenwall_village' }], reward: { money: 4000 } });

  // the marsh chain: same objectives for both factions, each with its own givers
  const both = (key, name, text, objs, ra, rh, pre) => {
    A('dw_a_' + key, Object.assign({ name, lvl: 60, giver: ra[0], turnin: ra[0], text: text[0], objs, reward: ra[1] }, { pre: [pre ? 'dw_a_' + pre : 'dw_to_theramore'] }));
    H('dw_h_' + key, Object.assign({ name, lvl: 60, giver: rh[0], turnin: rh[0], text: text[1], objs, reward: rh[1] }, { pre: [pre ? 'dw_h_' + pre : 'dw_to_brackenwall'] }));
  };
  both('whelps', 'Whelps in the Quagmire', [
    'Her whelps hatch all over the Quagmire. Every one we leave alive is a drake next spring. Kill 12.',
    'Whelps crawl out of every pool in the Quagmire. They snatch our wolves. Kill 12.'],
  [{ type: 'kill', mob: 'brood_whelp', n: 12 }], ['scout_holt', { choice: ['fam_feet60'] }], ['scout_vekra', { choice: ['fam_feet60'] }]);
  both('drakonids', 'Drakeborn Claws', [
    'The drakeborn in the Scorched Fen were hatched to fight, not to fly. I want to know what she fed them. Kill 10 and bring me 6 claws.',
    'The drakeborn are something new. The spirits do not know them. Kill 10 and bring me 6 claws, and I will ask again.'],
  [{ type: 'kill', mob: 'brood_drakonid', n: 10 }, { type: 'collect', item: 'drakonid_claw', n: 6 }], ['mage_winfield', { choice: ['fam_hands60'] }], ['seer_longrunner', { choice: ['fam_hands60'] }], 'whelps');
  both('dragonspawn', 'The Dragonmire', [
    'Dragonspawn guard the Dragonmire, where she has gone to ground. They cut down two of my patrols. Kill 12.',
    'Her dragonspawn hold the Dragonmire. Mudwall does not hide from anything that walks. Kill 12.'],
  [{ type: 'kill', mob: 'brood_dragonspawn', n: 12 }], ['commander_ashby', { choice: ['fam_legs60'] }], ['warlord_durnak', { choice: ['fam_legs60'] }], 'drakonids');
  both('scales', 'Black Brood Scales', [
    'Brood scales turn a blade better than steel. Bring me 8 and I will make the watch some proper shields.',
    'Bring me 8 brood scales. Good armour does not waste itself on a dead dragon.'],
  [{ type: 'collect', item: 'brood_scale', n: 8 }], ['armorer_bexley', { money: 9500 }], ['gorvash', { money: 9500 }], 'dragonspawn');
  both('scorchmaw', 'Scorchmaw', [
    'A drake the scouts call Scorchmaw burns the Scorched Fen black. Nothing grows there now. Bring me its fang.',
    'A drake called Scorchmaw has eaten three of our raptors. Bring me its fang.'],
  [{ type: 'collect', item: 'scorchmaw_fang', n: 1 }], ['scout_holt', { choice: ['fam_ring_rare60'] }], ['scout_vekra', { choice: ['fam_ring_rare60'] }], 'whelps');
  both('lair', "The Lair's Mouth", [
    'Past the Dragonmire there is a cave in a hill of black rock. The brood flies in and out of it all night. Go and see it, and come back alive.',
    'There is a cave past the Dragonmire. Every dragon in the marsh flies to it. Find it and come back.'],
  [{ type: 'visit', place: 'onyxias_lair_gate' }], ['commander_ashby', { money: 8000 }], ['warlord_durnak', { money: 8000 }], 'dragonspawn');
})(typeof window !== 'undefined' ? window : globalThis);
