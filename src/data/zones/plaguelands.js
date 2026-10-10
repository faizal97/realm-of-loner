// The West Rotmoor: contested, levels 55–58 (v8). Greyfrost Camp (Accord) and the Bulwark (Krugar); Castle Ardmore
// holds The Blackcloister, and the road east leads to the gates of Graymouth. The Hollow Host's heartland.
(function (root) {
  const D = root.D;
  D.zone('plaguelands', { name: 'West Rotmoor', faction: 'contested', music: 'rotmoor', town: 'rotmoor_town' });
  D.item('plaguehound_fang', { name: 'Plaguehound Fang', slot: 'quest', q: 1, icon: 'claw' });
  D.item('ghoul_flesh', { name: 'Diseased Flesh', slot: 'quest', q: 1, icon: 'rib' });
  D.item('executioner_axe', { name: "Executioner's Axe Head", slot: 'quest', q: 1, icon: 'axe' });
  D.item('warder_skull', { name: 'Warder Skull', slot: 'quest', q: 1, icon: 'head' });
  D.item('scarlet_badge_wp', { name: 'Morrowglen Badge', slot: 'quest', q: 1, icon: 'coin' });
  D.item('lightsworn_writ', { name: 'Lightsworn Writ', slot: 'quest', q: 1, icon: 'journal' });
  D.item('behemoth_bile', { name: 'Behemoth Bile', slot: 'quest', q: 1, icon: 'venom' });
  D.item('foulmane_heart', { name: "Mangefang's Heart", slot: 'quest', q: 1, icon: 'zombie_brain' });
  D.item('araj_phylactery', { name: "Vashti's Phylactery", slot: 'quest', q: 1, icon: 'seed' });
  D.item('foulmane_ring', { name: 'Blighted Band', slot: 'finger', q: 3, lvl: 57, stats: { sta: 13, str: 11 }, icon: 'ring', sell: 11200, source: 'Mangefang, Gloomstone Field' });
  D.item('araj_staff', { name: "Vashti's Scarab Staff", slot: 'weapon', wtype: 'staff', q: 3, lvl: 58, dmg: [84, 124], speed: 3, stats: { int: 22, spi: 16 }, sp: 36, icon: 'staff', sell: 12400 });
  D.item('araj_plate', { name: 'Plagueguard Hauberk', slot: 'chest', atype: 'mail', q: 3, lvl: 58, armor: 500, stats: { str: 22, sta: 19 }, icon: 'chest_mail', sell: 12400 });
  D.item('araj_cloak', { name: "Summoner's Shroud", slot: 'back', q: 3, lvl: 58, armor: 78, stats: { agi: 13, sta: 13 }, icon: 'cloak', sell: 11800 });

  Object.assign(D.MOBS, {
    plaguehound: { name: 'Plaguehound', lvl: [55, 56], family: 'undead', drops: [['rotting_flesh', 0.4]], qdrops: [['plaguehound_fang', 0.55]] },
    diseased_ghoul: { name: 'Diseased Ghoul', lvl: [55, 56], family: 'undead', hpMult: 1.1, drops: [['rotting_flesh', 0.5]], qdrops: [['ghoul_flesh', 0.55]] },
    skeletal_executioner: { name: 'Skeletal Executioner', lvl: [56, 57], family: 'undead', hpMult: 1.1, drops: [['thieves_coin', 0.4]], qdrops: [['executioner_axe', 0.5]] },
    scourge_warder: { name: 'Hollow Host Warder', lvl: [57, 58], family: 'undead', drops: [['thieves_coin', 0.45]], qdrops: [['warder_skull', 0.5]], aggro: 'The Hollow Host commands it!' },
    scarlet_sentinel: { name: 'Pyre Warden', lvl: [56, 57], family: 'humanoid', hpMult: 1.1, drops: [['thieves_coin', 0.55], ['linen_cloth', 0.3]], qdrops: [['scarlet_badge_wp', 0.5]], aggro: 'Morrowglen will be cleansed of your kind!' },
    scarlet_lightsworn: { name: 'Pyre Lightsworn', lvl: [57, 58], family: 'humanoid', drops: [['thieves_coin', 0.55], ['linen_cloth', 0.35]], qdrops: [['lightsworn_writ', 0.45]], aggro: 'The Light judges you!' },
    rotting_behemoth: { name: 'Rotting Behemoth', lvl: [57, 58], family: 'undead', hpMult: 1.3, drops: [['rotting_flesh', 0.6]], qdrops: [['behemoth_bile', 0.5]] },
    foulmane: { name: 'Mangefang', lvl: [57, 57], family: 'undead', named: true, hpMult: 2.2, dmgMult: 1.35, drops: [['foulmane_ring', 0.35], ['rotting_flesh', 1]], qdrops: [['foulmane_heart', 1]] },
    araj_the_summoner: { name: 'Vashti the Summoner', lvl: [58, 58], family: 'undead', elite: true, named: true, hpMult: 5.5, dmgMult: 4.8, special: 'kelris', summon: 'skeletal_executioner', specialText: 'Vashti summons his skeletal guard!', drops: [['thieves_coin', 1]], qdrops: [['araj_phylactery', 1]], loot: ['araj_staff', 'araj_plate', 'araj_cloak'], aggro: 'Your souls belong to the Hollow Host!' },
  });

  Object.assign(D.PLACES, {
    chillwind_camp: { name: 'Greyfrost Camp', zone: 'West Rotmoor', region: 'plaguelands', faction: 'alliance', scene: 'chillwind_camp', lvl: [55, 60], safe: true, inn: true, mobs: [], pool: 0, npcs: ['commander_ashlam', 'argent_officer_a', 'alchemist_arbington', 'quartermaster_hudson'], vendor: 'quartermaster_hudson',
      links: { felstone_field: 16, caer_darrow: 18, alterac_foothills: 45 }, via: { alterac_foothills: 'Road through Vaskar' } },
    the_bulwark: { name: 'The Bulwark', zone: 'West Rotmoor', region: 'plaguelands', faction: 'horde', scene: 'the_bulwark', lvl: [55, 60], safe: true, inn: true, mobs: [], pool: 0, npcs: ['high_executor_derrington', 'argent_officer_h', 'apothecary_dithers', 'quartermaster_lauren'], vendor: 'quartermaster_lauren',
      links: { felstone_field: 18, dalson_tears: 16, brill: 40 }, via: { brill: 'Road from Pallmoor' } },
    felstone_field: { name: 'Gloomstone Field', zone: 'West Rotmoor', region: 'plaguelands', scene: 'felstone_field', lvl: [55, 57], mobs: [['plaguehound', 5], ['diseased_ghoul', 4]], named: { foulmane: 300 }, pool: 10, npcs: [], links: { chillwind_camp: 16, the_bulwark: 18, dalson_tears: 16 } },
    dalson_tears: { name: "Harmon's Tears", zone: 'West Rotmoor', region: 'plaguelands', scene: 'dalson_tears', lvl: [55, 57], mobs: [['diseased_ghoul', 4], ['skeletal_executioner', 4]], pool: 9, npcs: [], links: { felstone_field: 16, the_bulwark: 16, andorhal: 18, hearthglen: 20 } },
    andorhal: { name: 'Ruins of Elmsworth', zone: 'West Rotmoor', region: 'plaguelands', scene: 'andorhal', lvl: [56, 58], mobs: [['skeletal_executioner', 5], ['scourge_warder', 4]], named: { araj_the_summoner: 150 }, pool: 10, npcs: [], links: { dalson_tears: 18, the_writhing_haunt: 16, caer_darrow: 18 } },
    hearthglen: { name: 'Morrowglen', zone: 'West Rotmoor', region: 'plaguelands', scene: 'hearthglen', lvl: [56, 58], mobs: [['scarlet_sentinel', 5], ['scarlet_lightsworn', 4]], pool: 10, npcs: [], links: { dalson_tears: 20, stratholme_gate: 30 } },
    the_writhing_haunt: { name: 'The Weeping Haunt', zone: 'West Rotmoor', region: 'plaguelands', scene: 'the_writhing_haunt', lvl: [57, 58], mobs: [['rotting_behemoth', 6], ['diseased_ghoul', 3]], pool: 9, npcs: [], links: { andorhal: 16 } },
    caer_darrow: { name: 'Castle Ardmore', zone: 'West Rotmoor', region: 'plaguelands', scene: 'caer_darrow', lvl: [57, 60], mobs: [['scourge_warder', 3], ['diseased_ghoul', 3]], pool: 6, npcs: [], links: { chillwind_camp: 18, andorhal: 18 } },
    stratholme_gate: { gate: true, name: 'Graymouth', zone: 'East Rotmoor', region: 'plaguelands', scene: 'stratholme_gate', lvl: [57, 60], mobs: [['plaguehound', 3], ['skeletal_executioner', 3]], pool: 6, npcs: [], links: { hearthglen: 30 }, via: { hearthglen: 'Road to the East Rotmoor' } },
  });
  D.PLACES.alterac_foothills.links.chillwind_camp = 45; D.PLACES.alterac_foothills.via.chillwind_camp = 'Road through Vaskar';
  D.PLACES.brill.links.the_bulwark = 40; D.PLACES.brill.via = Object.assign(D.PLACES.brill.via || {}, { the_bulwark: 'Road to the Rotmoor' });

  Object.assign(D.NPCS, {
    commander_ashlam: { name: 'Commander Braddock', title: 'Greyfrost Camp' },
    argent_officer_a: { name: 'Lantern Officer Brighthand', title: 'Lantern Watch' },
    alchemist_arbington: { name: 'Alchemist Pennifer', title: 'Greyfrost Camp' },
    quartermaster_hudson: { name: 'Quartermaster Hurst', title: 'Supplies' },
    high_executor_derrington: { name: 'High Executor Colm', title: 'The Bulwark' },
    argent_officer_h: { name: 'Lantern Officer Ruzh', title: 'Lantern Watch' },
    apothecary_dithers: { name: 'Apothecary Nettle', title: 'Royal Apothecary Guild' },
    quartermaster_lauren: { name: 'Quartermaster Hesketh', title: 'Supplies' },
  });

  const A = (id, q) => { q.faction = 'alliance'; D.QUESTS[id] = q; };
  const H = (id, q) => { q.faction = 'horde'; D.QUESTS[id] = q; };
  A('to_chillwind', { name: 'Greyfrost Camp', lvl: 55, giver: 'marshal_maxwell', turnin: 'commander_ashlam', text: 'The Lantern Watch and the Accord hold Greyfrost Camp against the Hollow Host. Take the road through Vaskar and report to Commander Braddock.',
    objs: [{ type: 'visit', place: 'chillwind_camp' }], reward: { money: 3000 } });
  H('to_bulwark', { name: 'The Bulwark', lvl: 55, giver: 'thal_kaur', turnin: 'high_executor_derrington', text: 'The Reclaimed hold the Bulwark at the edge of the Rotmoor. Report to High Executor Colm.',
    objs: [{ type: 'visit', place: 'the_bulwark' }], reward: { money: 3000 } });
  const both = (key, lvl, name, text, objs, ra, rh, pre) => {
    A('wpa_' + key, Object.assign({ name, lvl, giver: ra[0], turnin: ra[0], text: text[0], objs, reward: ra[1] }, pre ? { pre: ['wpa_' + pre] } : {}));
    H('wph_' + key, Object.assign({ name, lvl, giver: rh[0], turnin: rh[0], text: text[1], objs, reward: rh[1] }, pre ? { pre: ['wph_' + pre] } : {}));
  };
  const s = (a) => [a, a];
  both('plaguehounds', 55, 'Plaguehounds', s('Plague-ridden hounds run the fields. Kill 12.'), [{ type: 'kill', mob: 'plaguehound', n: 12 }], ['commander_ashlam', { choice: ['fam_feet56'] }], ['high_executor_derrington', { choice: ['fam_feet56'] }]);
  both('hound_fangs', 56, 'Plaguehound Fangs', s('Bring me 10 fangs. The Lantern Watch counts every kill.'), [{ type: 'collect', item: 'plaguehound_fang', n: 10 }], ['argent_officer_a', { money: 7000 }], ['argent_officer_h', { money: 7000 }], 'plaguehounds');
  both('ghouls', 55, 'Gloomstone Field', s('Ghouls gather in the fields. Kill 12 and bring me 6 samples of their flesh.'), [{ type: 'kill', mob: 'diseased_ghoul', n: 12 }, { type: 'collect', item: 'ghoul_flesh', n: 6 }], ['alchemist_arbington', { choice: ['fam_wrist56'] }], ['apothecary_dithers', { choice: ['fam_wrist56'] }]);
  both('foulmane', 57, 'Mangefang', s('A huge ghoul called Mangefang leads the others. It is rarely seen. Bring me its heart.'), [{ type: 'collect', item: 'foulmane_heart', n: 1 }], ['commander_ashlam', { choice: ['fam_ring_rare60'] }], ['high_executor_derrington', { choice: ['fam_ring_rare60'] }]);
  both('executioners', 56, 'The Executioners', s('Skeletal executioners guard the road to Elmsworth. Kill 12.'), [{ type: 'kill', mob: 'skeletal_executioner', n: 12 }], ['commander_ashlam', { choice: ['fam_chest57'] }], ['high_executor_derrington', { choice: ['fam_chest57'] }]);
  both('axe_heads', 57, 'Axe Heads', s('Bring me 8 of their axe heads.'), [{ type: 'collect', item: 'executioner_axe', n: 8 }], ['quartermaster_hudson', { money: 7300 }], ['quartermaster_lauren', { money: 7300 }], 'executioners');
  both('warders', 57, 'Elmsworth', s('Hollow Host warders hold the ruins of Elmsworth. Kill 10 and bring me 5 skulls.'), [{ type: 'kill', mob: 'scourge_warder', n: 10 }, { type: 'collect', item: 'warder_skull', n: 5 }], ['argent_officer_a', { choice: ['fam_legs57'] }], ['argent_officer_h', { choice: ['fam_legs57'] }], 'executioners');
  both('hearthglen', 57, 'Morrowglen', ['The Order of the Pyre holds Morrowglen and shoots anyone who is not them. Kill 12 sentinels.', 'The Pyre zealots of Morrowglen kill our scouts. Kill 12 sentinels.'], [{ type: 'kill', mob: 'scarlet_sentinel', n: 12 }], ['commander_ashlam', { choice: ['fam_hands57'] }], ['high_executor_derrington', { choice: ['fam_hands57'] }]);
  both('lightsworn', 58, 'The Lightsworn', s('Kill 10 lightsworn and bring me 4 writs.'), [{ type: 'kill', mob: 'scarlet_lightsworn', n: 10 }, { type: 'collect', item: 'lightsworn_writ', n: 4 }], ['argent_officer_a', { choice: ['fam_back58'] }], ['argent_officer_h', { choice: ['fam_back58'] }], 'hearthglen');
  both('scarlet_badges', 58, 'Morrowglen Badges', s('Bring me 10 badges.'), [{ type: 'collect', item: 'scarlet_badge_wp', n: 10 }], ['quartermaster_hudson', { money: 7600 }], ['quartermaster_lauren', { money: 7600 }], 'hearthglen');
  both('behemoths', 58, 'The Weeping Haunt', s('Rotting behemoths crawl out of the Haunt. Kill 10 and bring me 5 flasks of bile.'), [{ type: 'kill', mob: 'rotting_behemoth', n: 10 }, { type: 'collect', item: 'behemoth_bile', n: 5 }], ['alchemist_arbington', { choice: ['fam_weapon58'] }], ['apothecary_dithers', { choice: ['fam_weapon58'] }], 'warders');
  both('field_patrol', 56, 'Clear the Fields', s('8 hounds and 8 ghouls.'), [{ type: 'kill', mob: 'plaguehound', n: 8 }, { type: 'kill', mob: 'diseased_ghoul', n: 8 }], ['commander_ashlam', { money: 7100 }], ['high_executor_derrington', { money: 7100 }], 'hound_fangs');
  both('andorhal_patrol', 58, 'Hold Elmsworth', s('8 executioners and 6 warders.'), [{ type: 'kill', mob: 'skeletal_executioner', n: 8 }, { type: 'kill', mob: 'scourge_warder', n: 6 }], ['argent_officer_a', { choice: ['fam_waist58'] }], ['argent_officer_h', { choice: ['fam_waist58'] }], 'warders');
  both('araj', 58, 'Wanted: Vashti the Summoner', s('A lich, Vashti the Summoner, raises the dead in Elmsworth. Bring me his phylactery. Take friends.'), [{ type: 'collect', item: 'araj_phylactery', n: 1 }], ['argent_officer_a', { choice: ['fam_weapon58'] }], ['argent_officer_h', { choice: ['fam_weapon58'] }]);
  D.QUESTS.wpa_araj.group = 3; D.QUESTS.wph_araj.group = 3;
  Object.assign(D.ACTIVITIES, {
    araj: { name: 'Wanted: Vashti the Summoner', where: 'andorhal', size: 3, minLvl: 55, maxLvl: 58, desc: 'Open-world elite in the West Rotmoor. 3 players.', boss: 'araj_the_summoner', pulls: [{ scene: 'andorhal', label: 'The ruins', mobs: ['skeletal_executioner', 'scourge_warder'] }, { scene: 'andorhal', label: 'The ruins', mobs: ['skeletal_executioner', 'skeletal_executioner'] }, { scene: 'andorhal', label: 'Vashti the Summoner', mobs: ['araj_the_summoner'], boss: true }] },
  });
})(typeof window !== 'undefined' ? window : globalThis);
