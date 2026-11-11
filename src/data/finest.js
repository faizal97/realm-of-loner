// Season's Finest (#593): the best pieces per class and role, by season. Best is mostly the newest raid with some of
// the newest dungeons; Next best is the older raids and dungeons. Seasons are data: a season with no new raid, or
// many, works the same. `to: null` runs until a later season starts. A season adds, never moves: no item's drop
// changes. Picks are proposed by tools/finest_pick.js and pasted here; tools/validate.js checks them (#593).
(function (root) {
  const D = root.D;
  D.FINEST_SEASONS = [{
    id: 1, name: 'Season of the Tides', titles: { tank: 'finest_1_tank', healer: 'finest_1_healer', dps: 'finest_1_dps' }, from: '2026-11-14', to: null,
    best: {
      'warrior:tank': { weapon: 'aeldran_blade', chest: 'deepmother_plate', legs: 'serathis_legs', feet: 'tidefang_boots', hands: 'inkbound_gloves', wrist: 'oyala_bracers', waist: 'colossus_belt', back: 'aeldran_cloak', finger: 'brittle_crown_signet' },
      'warrior:dps': { weapon: 'aeldran_blade', chest: 'deepmother_plate', legs: 'serathis_legs', feet: 'tidefang_boots', hands: 'inkbound_gloves', wrist: 'oyala_bracers', waist: 'colossus_belt', back: 'aeldran_cloak', finger: 'brittle_crown_signet' },
      'mage:dps': { weapon: 'deepmother_staff', chest: 'deepmother_robe', legs: 'zanjin_legs', feet: 'twins_boots', hands: 'archive_gloves', wrist: 'twinned_tide_bracers', back: 'ellaris_cloak', finger: 'twins_ring' },
      'priest:healer': { weapon: 'deepmother_staff', chest: 'deepmother_robe', legs: 'zanjin_legs', feet: 'twins_boots', hands: 'archive_gloves', wrist: 'twinned_tide_bracers', back: 'ellaris_cloak', finger: 'twins_ring' },
      'priest:dps': { weapon: 'deepmother_staff', chest: 'deepmother_robe', legs: 'zanjin_legs', feet: 'twins_boots', hands: 'archive_gloves', wrist: 'twinned_tide_bracers', back: 'ellaris_cloak', finger: 'twins_ring' },
      'rogue:dps': { weapon: 'aeldran_dagger', chest: 'deepmother_leather', legs: 'nerathil_legs', feet: 'tidecrown_boots', hands: 'serathis_gloves', wrist: 'colossus_bracers', waist: 'tidecrown_girdle', back: 'aeldran_cloak', finger: 'brittle_crown_signet' },
      'paladin:healer': { chest: 'deepmother_robe', legs: 'zanjin_legs', feet: 'twins_boots', hands: 'archive_gloves', wrist: 'twinned_tide_bracers', back: 'ellaris_cloak', finger: 'twins_ring' },
      'paladin:tank': { weapon: 'aeldran_blade', chest: 'deepmother_plate', legs: 'serathis_legs', feet: 'tidefang_boots', hands: 'inkbound_gloves', wrist: 'oyala_bracers', waist: 'colossus_belt', back: 'ellaris_cloak', finger: 'twins_ring' },
      'warlock:dps': { weapon: 'deepmother_staff', chest: 'deepmother_robe', legs: 'zanjin_legs', feet: 'twins_boots', hands: 'archive_gloves', wrist: 'twinned_tide_bracers', back: 'ellaris_cloak', finger: 'twins_ring' },
      'hunter:dps': { weapon: 'nerathil_blade', chest: 'deepmother_leather', legs: 'nerathil_legs', feet: 'tidecrown_boots', hands: 'serathis_gloves', wrist: 'colossus_bracers', waist: 'tidecrown_girdle', back: 'aeldran_cloak', finger: 'brittle_crown_signet' },
      'druid:healer': { weapon: 'deepmother_staff', chest: 'deepmother_robe', legs: 'zanjin_legs', feet: 'twins_boots', hands: 'archive_gloves', wrist: 'twinned_tide_bracers', back: 'ellaris_cloak', finger: 'twins_ring' },
      'druid:tank': { weapon: 'deepmother_maul', chest: 'deepmother_leather', legs: 'nerathil_legs', feet: 'tidecrown_boots', hands: 'serathis_gloves', wrist: 'colossus_bracers', waist: 'tidecrown_girdle', back: 'aeldran_cloak', finger: 'brittle_crown_signet' },
      'druid:dps': { weapon: 'deepmother_staff', chest: 'deepmother_leather', legs: 'nerathil_legs', feet: 'tidecrown_boots', hands: 'returning_tide_gloves', wrist: 'colossus_bracers', waist: 'tidecrown_girdle', back: 'ellaris_cloak', finger: 'twins_ring' },
      'shaman:dps': { weapon: 'deepmother_staff', chest: 'deepmother_leather', legs: 'nerathil_legs', feet: 'tidecrown_boots', hands: 'serathis_gloves', wrist: 'colossus_bracers', waist: 'tidecrown_girdle', back: 'ellaris_cloak', finger: 'twins_ring' },
      'shaman:healer': { weapon: 'deepmother_staff', chest: 'deepmother_robe', legs: 'zanjin_legs', feet: 'twins_boots', hands: 'archive_gloves', wrist: 'twinned_tide_bracers', back: 'ellaris_cloak', finger: 'twins_ring' },
      'bard:healer': { weapon: 'deepmother_staff', chest: 'deepmother_robe', legs: 'zanjin_legs', feet: 'twins_boots', hands: 'archive_gloves', wrist: 'twinned_tide_bracers', back: 'ellaris_cloak', finger: 'twins_ring' },
      'bard:dps': { weapon: 'deepmother_staff', chest: 'deepmother_leather', legs: 'nerathil_legs', feet: 'tidecrown_boots', hands: 'returning_tide_gloves', wrist: 'colossus_bracers', waist: 'tidecrown_girdle', back: 'ellaris_cloak', finger: 'twins_ring' },
    },
    until: {
      'warrior:tank': { weapon: 'onyx_sword', chest: 'gandling_plate', legs: 'onyx_legs', wrist: 'cinderhide_bracers', waist: 'onyx_belt', back: 'onyx_mantle', finger: 'garr_ring' },
      'warrior:dps': { weapon: 'onyx_sword', chest: 'gandling_plate', legs: 'onyx_legs', wrist: 'cinderhide_bracers', waist: 'onyx_belt', back: 'magmadar_cloak' },
      'mage:dps': { weapon: 'executus_staff', chest: 'gandling_robe', feet: 'onyx_boots', waist: 'sulfuron_cord', finger: 'garr_ring' },
      'priest:healer': { weapon: 'onyx_staff', chest: 'gandling_robe', feet: 'onyx_boots', waist: 'sulfuron_cord', back: 'stewards_grace', finger: 'garr_ring' },
      'priest:dps': { weapon: 'onyx_staff', chest: 'gandling_robe', feet: 'onyx_boots', waist: 'sulfuron_cord', back: 'stewards_grace', finger: 'garr_ring' },
      'rogue:dps': { weapon: 'onyx_dagger', chest: 'gandling_leather', legs: 'molten_heart_leggings', hands: 'onyx_gloves', wrist: 'garr_bracers', back: 'magmadar_cloak' },
      'paladin:healer': { weapon: 'veshmira_mace', chest: 'gandling_robe', feet: 'onyx_boots', waist: 'sulfuron_cord', finger: 'garr_ring' },
      'paladin:tank': { weapon: 'onyx_sword', chest: 'gandling_plate', legs: 'onyx_legs', wrist: 'cinderhide_bracers', waist: 'onyx_belt', back: 'onyx_mantle', finger: 'garr_ring' },
      'warlock:dps': { weapon: 'executus_staff', chest: 'gandling_robe', feet: 'onyx_boots', waist: 'sulfuron_cord', finger: 'garr_ring' },
      'hunter:dps': { weapon: 'onyx_dagger', ranged: 'magma_bow', chest: 'gandling_leather', hands: 'onyx_gloves', wrist: 'garr_bracers', back: 'onyx_mantle', finger: 'garr_ring' },
      'druid:healer': { weapon: 'executus_staff', chest: 'gandling_robe', feet: 'onyx_boots', waist: 'sulfuron_cord', finger: 'garr_ring' },
      'druid:tank': { weapon: 'ragnaros_hammer', chest: 'rivendare_leather', legs: 'molten_heart_leggings', feet: 'houndrunner_boots', hands: 'onyx_gloves', wrist: 'garr_bracers', back: 'onyx_mantle', finger: 'onyx_ring' },
      'druid:dps': { weapon: 'onyx_staff', chest: 'rivendare_leather', legs: 'molten_heart_leggings', hands: 'geddon_gloves', wrist: 'garr_bracers', finger: 'onyx_ring' },
      'shaman:dps': { weapon: 'gandling_staff', chest: 'onyx_tunic', legs: 'molten_heart_leggings', feet: 'houndrunner_boots', hands: 'onyx_gloves', wrist: 'garr_bracers', back: 'magmadar_cloak', finger: 'onyx_ring' },
      'shaman:healer': { weapon: 'executus_staff', chest: 'gandling_robe', feet: 'onyx_boots', waist: 'sulfuron_cord', finger: 'garr_ring' },
      'bard:healer': { weapon: 'executus_staff', chest: 'gandling_robe', feet: 'onyx_boots', waist: 'sulfuron_cord', finger: 'garr_ring' },
      'bard:dps': { weapon: 'onyx_staff', chest: 'rivendare_leather', hands: 'geddon_gloves', wrist: 'garr_bracers', finger: 'onyx_ring' },
    },
  }];
  // one title per role kind each season: any class's Best pieces for that role, all found blind (#593)
  D.TITLES.push(
    { id: 'finest_1_tank', name: '%s the Tideward', need: { finest: 1, role: 'tank' }, how: "Season of the Tides: find every Best piece of a tank's Season's Finest, any class, without a Hint or Reveal" },
    { id: 'finest_1_healer', name: '%s the Tidemender', need: { finest: 1, role: 'healer' }, how: "Season of the Tides: find every Best piece of a healer's Season's Finest, any class, without a Hint or Reveal" },
    { id: 'finest_1_dps', name: '%s the Tidebreaker', need: { finest: 1, role: 'dps' }, how: "Season of the Tides: find every Best piece of a damage dealer's Season's Finest, any class, without a Hint or Reveal" });
})(typeof window !== 'undefined' ? window : globalThis);
