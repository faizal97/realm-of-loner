// Professions (v3): three gathering skills and four crafts, skill 1–300 (Apprentice 75, Journeyman 150, Expert 225 and
// Artisan 300 since v10.9; design docs/plans/2026-10-02-professions-design.md).
// Loads after the zones: it adds trainers to the cities and hubs, and reads place levels to decide what grows where.
// Rules live in game.js (G.prof*); this file is only data.
(function (root) {
  const D = root.D;

  // ---- the professions. Two primary professions per character, as in the original game.
  D.PROFESSIONS = {
    mining: { name: 'Mining', icon: 'prof_mining', kind: 'gather', verb: 'Mine', desc: 'Mine ore veins in the wild, and smelt ore into bars. Blacksmiths need the bars.' },
    herbalism: { name: 'Herbalism', icon: 'prof_herbalism', kind: 'gather', verb: 'Pick', desc: 'Pick herbs in the wild. Alchemists turn them into potions and elixirs.' },
    skinning: { name: 'Skinning', icon: 'prof_skinning', kind: 'gather', verb: 'Skin', desc: 'Skin the beasts you kill for leather. It happens as you loot. Leatherworkers need it.' },
    blacksmithing: { name: 'Blacksmithing', icon: 'prof_blacksmithing', kind: 'craft', desc: 'Forge mail armour, weapons and sharpening stones from metal bars.' },
    alchemy: { name: 'Alchemy', icon: 'prof_alchemy', kind: 'craft', desc: 'Brew healing and mana potions, and elixirs that last an hour.' },
    leatherworking: { name: 'Leatherworking', icon: 'prof_leatherworking', kind: 'craft', desc: 'Stitch leather armour and armour kits that add armour to your gear for good.' },
    tailoring: { name: 'Tailoring', icon: 'prof_tailoring', kind: 'craft', desc: 'Sew cloth armour and bags from the linen and wool that humanoids drop.' },
    // secondary skills (v10.9): anyone can learn both on top of their two professions
    cooking: { name: 'Cooking', icon: 'prof_cooking', kind: 'secondary', desc: 'Cook fish and the meat beasts drop into food that restores more than shop food, and meals that leave you Well Fed.' },
    fishing: { name: 'Fishing', icon: 'prof_fishing', kind: 'secondary', verb: 'Fish', desc: 'Fish at lakes, rivers, coasts and harbours. Tap when the bobber dips; big and rare fish fight on the reel.' },
  };
  D.isSecondary = (id) => (D.PROFESSIONS[id] || {}).kind === 'secondary';
  D.PROF_MAX = 2;
  // Ranks are bought from a profession trainer.
  D.PROF_RANKS = [
    { name: 'Apprentice', max: 75, lvl: 5, skill: 0, cost: 100 },
    { name: 'Journeyman', max: 150, lvl: 10, skill: 50, cost: 5000 },
    { name: 'Expert', max: 225, lvl: 30, skill: 125, cost: 25000 }, // v10.9: levels 25-45
    { name: 'Artisan', max: 300, lvl: 45, skill: 200, cost: 50000 }, // v10.9: levels 45-60
  ];
  // Gathering: what each node needs, and the colour bands above that (orange, yellow, green, then grey).
  D.NODES = {
    copper: { name: 'Copper Vein', prof: 'mining', skill: 1, item: 'copper_ore', n: [1, 3], extra: ['rough_stone', 0.5] },
    tin: { name: 'Tin Vein', prof: 'mining', skill: 65, item: 'tin_ore', n: [1, 2], extra: ['coarse_stone', 0.5] },
    silver: { name: 'Silver Vein', prof: 'mining', skill: 75, item: 'silver_ore', n: [1, 1], extra: ['coarse_stone', 0.3] },
    peacebloom: { name: 'Softpetal', prof: 'herbalism', skill: 1, item: 'peacebloom', n: [1, 3] },
    silverleaf: { name: 'Silverleaf', prof: 'herbalism', skill: 1, item: 'silverleaf', n: [1, 3] },
    earthroot: { name: 'Knotroot', prof: 'herbalism', skill: 15, item: 'earthroot', n: [1, 3] },
    mageroyal: { name: 'Sageflower', prof: 'herbalism', skill: 50, item: 'mageroyal', n: [1, 3] },
    briarthorn: { name: 'Hookthorn', prof: 'herbalism', skill: 70, item: 'briarthorn', n: [1, 3] },
    bruiseweed: { name: 'Bramblewort', prof: 'herbalism', skill: 100, item: 'bruiseweed', n: [1, 3] },
    // Expert (v10.9)
    iron: { name: 'Iron Deposit', prof: 'mining', skill: 125, item: 'iron_ore', n: [1, 2], extra: ['heavy_stone', 0.5] },
    gold: { name: 'Gold Vein', prof: 'mining', skill: 155, item: 'gold_ore', n: [1, 1] },
    embersilver: { name: 'Embersilver Vein', prof: 'mining', skill: 175, item: 'embersilver_ore', n: [1, 2], extra: ['heavy_stone', 0.4] },
    ironthistle: { name: 'Ironthistle', prof: 'herbalism', skill: 115, item: 'ironthistle', n: [1, 3] },
    redmantle: { name: 'Redmantle', prof: 'herbalism', skill: 125, item: 'redmantle', n: [1, 3] },
    stoutroot: { name: 'Stoutroot', prof: 'herbalism', skill: 150, item: 'stoutroot', n: [1, 3] },
    dimleaf: { name: 'Dimleaf', prof: 'herbalism', skill: 160, item: 'dimleaf', n: [1, 3] },
    goldspur: { name: 'Goldspur', prof: 'herbalism', skill: 170, item: 'goldspur', n: [1, 3] },
    hermits_beard: { name: "Hermit's Beard", prof: 'herbalism', skill: 185, item: 'hermits_beard', n: [1, 3] },
    rimeleaf: { name: 'Rimeleaf', prof: 'herbalism', skill: 195, item: 'rimeleaf', n: [1, 3] },
    // Artisan (v10.9): levels 45-60
    duskiron: { name: 'Duskiron Deposit', prof: 'mining', skill: 230, item: 'duskiron_ore', n: [2, 3], extra: ['deepstone', 0.5] }, // 2-3: Artisan smithing costs 6-12 bars a piece (issue #6)
    moonsilver: { name: 'Moonsilver Vein', prof: 'mining', skill: 260, item: 'moonsilver_ore', n: [1, 1], extra: ['deepstone', 0.3] },
    cinderbloom: { name: 'Cinderbloom', prof: 'herbalism', skill: 230, item: 'cinderbloom', n: [1, 3] },
    gloomcap: { name: 'Gloomcap', prof: 'herbalism', skill: 245, item: 'gloomcap', n: [1, 3] },
    sunveil: { name: 'Sunveil', prof: 'herbalism', skill: 260, item: 'sunveil', n: [1, 3] },
    frostpetal: { name: 'Frostpetal', prof: 'herbalism', skill: 275, item: 'frostpetal', n: [1, 3] },
  };
  D.GATHER_BANDS = [25, 50, 100]; // skill below req+25 always gains, below +50 half the time, below +100 a quarter
  // Which nodes grow at a place, by the place's level. Weights; the game rolls one per spawn.
  D.nodeTable = function (L) {
    if (L <= 9) return { ore: [['copper', 1]], herb: [['peacebloom', 3], ['silverleaf', 3], ['earthroot', L >= 5 ? 2 : 0], ['mageroyal', L >= 8 ? 1 : 0]] };
    if (L <= 15) return { ore: [['copper', 4], ['tin', 5], ['silver', L >= 13 ? 1 : 0]], herb: [['silverleaf', 1], ['earthroot', 3], ['mageroyal', 3], ['briarthorn', L >= 12 ? 2 : 0]] };
    if (L <= 21) return { ore: [['copper', 1], ['tin', 7], ['silver', 2]], herb: [['mageroyal', 2], ['briarthorn', 4], ['bruiseweed', L >= 18 ? 4 : 1]] };
    // Expert (v10.9): iron from 26, gold from 30, embersilver from 35; the herbs by their skill
    if (L <= 30) return { ore: [['tin', 2], ['silver', 2], ['iron', L >= 26 ? 6 : 1]], herb: [['bruiseweed', 3], ['ironthistle', L >= 25 ? 4 : 0], ['redmantle', L >= 28 ? 3 : 0]] };
    if (L <= 38) return { ore: [['iron', 6], ['silver', 1], ['gold', L >= 30 ? 1 : 0], ['embersilver', L >= 35 ? 3 : 0]], herb: [['redmantle', 2], ['stoutroot', 4], ['dimleaf', L >= 32 ? 3 : 0], ['goldspur', L >= 35 ? 2 : 0]] };
    if (L <= 45) return { ore: [['iron', 3], ['embersilver', 6], ['gold', 1]], herb: [['goldspur', 3], ['hermits_beard', 4], ['rimeleaf', L >= 40 ? 3 : 0], ['dimleaf', 1]] };
    // Artisan (v10.9): duskiron from 46, the moonsilver vein from 50; the herbs by their skill
    return { ore: [['duskiron', 6], ['embersilver', L < 50 ? 3 : 0], ['moonsilver', L >= 50 ? 1 : 0]], herb: [['cinderbloom', 3], ['gloomcap', L >= 50 ? 3 : 0], ['sunveil', L >= 53 ? 3 : 0], ['frostpetal', L >= 56 ? 3 : 0], ['rimeleaf', L < 50 ? 2 : 0]] };
  };
  // Skinning needs skill by the beast's level, like the original game.
  D.skinSkill = (lvl) => (lvl <= 10 ? 1 : lvl <= 20 ? (lvl - 10) * 10 : lvl * 5);
  D.skinLeather = (lvl) => (lvl >= 50 ? 'hardhide_leather' : lvl >= 40 ? 'thick_leather' : lvl >= 28 ? 'heavy_leather' : lvl >= 20 ? 'medium_leather' : 'light_leather');

  // ---- materials (stack to 20; slot 'mat')
  const mat = (id, name, icon, sell, o) => D.item(id, Object.assign({ name, slot: 'mat', q: 1, icon, sell }, o));
  mat('copper_ore', 'Copper Ore', 'copper_ore', 5);
  mat('tin_ore', 'Tin Ore', 'tin_ore', 10);
  mat('silver_ore', 'Silver Ore', 'silver_ore', 75, { q: 2 });
  mat('rough_stone', 'Rough Stone', 'rough_stone', 2);
  mat('coarse_stone', 'Coarse Stone', 'coarse_stone', 6);
  mat('copper_bar', 'Copper Bar', 'copper_bar', 10);
  mat('tin_bar', 'Tin Bar', 'tin_bar', 20);
  mat('bronze_bar', 'Bronze Bar', 'bronze_bar', 25);
  mat('silver_bar', 'Silver Bar', 'silver_bar', 100, { q: 2 });
  mat('peacebloom', 'Softpetal', 'peacebloom', 5);
  mat('silverleaf', 'Silverleaf', 'silverleaf', 5);
  mat('earthroot', 'Knotroot', 'earthroot', 10);
  mat('mageroyal', 'Sageflower', 'mageroyal', 15);
  mat('briarthorn', 'Hookthorn', 'briarthorn', 20);
  mat('bruiseweed', 'Bramblewort', 'bruiseweed', 25);
  mat('light_leather', 'Light Leather', 'light_leather', 10);
  mat('medium_leather', 'Medium Leather', 'medium_leather', 25);
  mat('linen_bolt', 'Bolt of Linen Cloth', 'linen_bolt', 15);
  mat('wool_cloth', 'Wool Cloth', 'wool_cloth', 10);
  mat('wool_bolt', 'Bolt of Woolen Cloth', 'wool_bolt', 35);
  mat('empty_vial', 'Empty Vial', 'vial', 1, { cost: 4 });
  mat('coarse_thread', 'Coarse Thread', 'coarse_thread', 3, { cost: 10 });
  // Expert (v10.9): levels 25-45
  mat('iron_ore', 'Iron Ore', 'iron_ore', 40);
  mat('gold_ore', 'Gold Ore', 'gold_ore', 150, { q: 2 });
  mat('embersilver_ore', 'Embersilver Ore', 'embersilver_ore', 90);
  mat('heavy_stone', 'Heavy Stone', 'heavy_stone', 15);
  mat('iron_bar', 'Iron Bar', 'iron_bar', 60);
  mat('steel_bar', 'Steel Bar', 'steel_bar', 90);
  mat('gold_bar', 'Gold Bar', 'gold_bar', 200, { q: 2 });
  mat('embersilver_bar', 'Embersilver Bar', 'embersilver_bar', 130);
  mat('ironthistle', 'Ironthistle', 'ironthistle', 30);
  mat('redmantle', 'Redmantle', 'redmantle', 35);
  mat('stoutroot', 'Stoutroot', 'stoutroot', 45);
  mat('dimleaf', 'Dimleaf', 'dimleaf', 50);
  mat('goldspur', 'Goldspur', 'goldspur', 60);
  mat('hermits_beard', "Hermit's Beard", 'hermits_beard', 70);
  mat('rimeleaf', 'Rimeleaf', 'rimeleaf', 80);
  mat('heavy_leather', 'Heavy Leather', 'heavy_leather', 45);
  mat('thick_leather', 'Thick Leather', 'thick_leather', 70);
  mat('silk_cloth', 'Silk Cloth', 'silk_cloth', 25);
  mat('silk_bolt', 'Bolt of Silk Cloth', 'silk_bolt', 80);
  mat('smithing_coal', 'Smithing Coal', 'smithing_coal', 5, { cost: 25 });
  mat('fine_thread', 'Fine Thread', 'fine_thread', 8, { cost: 30 });
  mat('sturdy_vial', 'Sturdy Vial', 'sturdy_vial', 5, { cost: 20 });
  // Artisan (v10.9): levels 45-60
  mat('duskiron_ore', 'Duskiron Ore', 'duskiron_ore', 70);
  mat('duskiron_bar', 'Duskiron Bar', 'duskiron_bar', 100);
  mat('moonsilver_ore', 'Moonsilver Ore', 'moonsilver_ore', 250, { q: 2 });
  mat('moonsilver_bar', 'Moonsilver Bar', 'moonsilver_bar', 330, { q: 2 });
  mat('deepstone', 'Deepstone', 'deepstone', 25);
  mat('cinderbloom', 'Cinderbloom', 'cinderbloom', 90);
  mat('gloomcap', 'Gloomcap', 'gloomcap', 100);
  mat('sunveil', 'Sunveil', 'sunveil', 115);
  mat('frostpetal', 'Frostpetal', 'frostpetal', 130);
  mat('hardhide_leather', 'Hardhide Leather', 'hardhide_leather', 100);
  mat('duskweave_cloth', 'Duskweave Cloth', 'duskweave_cloth', 40);
  mat('duskweave_bolt', 'Bolt of Duskweave', 'duskweave_bolt', 130);
  // Linen was vendor trash before v3. It is a tailoring material now (existing stacks keep working).
  D.ITEMS.linen_cloth.slot = 'mat'; D.ITEMS.linen_cloth.icon = 'linen_bolt';

  // ---- fish and meat (v10.9): Cooking's ingredients
  mat('silverfin_minnow', 'Silverfin Minnow', 'silverfin_minnow', 3);
  mat('mudbelly_carp', 'Mudbelly Carp', 'mudbelly_carp', 6);
  mat('whiskered_pike', 'Whiskered Pike', 'whiskered_pike', 20);
  mat('glimmerscale', 'Glimmerscale', 'glimmerscale', 80, { q: 2 });
  mat('speckled_trout', 'Speckled Trout', 'speckled_trout', 12);
  mat('reedback_perch', 'Reedback Perch', 'reedback_perch', 18);
  mat('ironjaw_catfish', 'Ironjaw Catfish', 'ironjaw_catfish', 45);
  mat('lantern_eel', 'Lantern Eel', 'lantern_eel', 160, { q: 2 });
  mat('saltfin_snapper', 'Saltfin Snapper', 'saltfin_snapper', 30);
  mat('greyscale_cod', 'Greyscale Cod', 'greyscale_cod', 40);
  mat('stormback_tuna', 'Stormback Tuna', 'stormback_tuna', 90);
  mat('duskglass_ray', 'Duskglass Ray', 'duskglass_ray', 300, { q: 2 });
  mat('lean_meat', 'Lean Meat', 'lean_meat', 4);
  mat('tough_meat', 'Tough Meat', 'tough_meat', 12);
  mat('thick_steak', 'Thick Steak', 'thick_steak', 30);
  // Artisan (v10.9): 45-60 water and beasts
  mat('ashgill_bass', 'Ashgill Bass', 'ashgill_bass', 45);
  mat('frostscale_herring', 'Frostscale Herring', 'frostscale_herring', 55);
  mat('thunderhead_marlin', 'Thunderhead Marlin', 'thunderhead_marlin', 130);
  mat('starlit_koi', 'Starlit Koi', 'starlit_koi', 450, { q: 2 });
  mat('marbled_haunch', 'Marbled Haunch', 'marbled_haunch', 45);
  mat('cooking_spices', 'Cooking Spices', 'cooking_spices', 2, { cost: 15 });
  // where you can fish: places with water, fishing at the place's level (tier 1: up to 15, 2: up to 28, 3: up to 45, 4: above)
  D.WATERS = ['goldshire', 'crystal_lake', 'lake_alameth', 'echo_isles', 'the_longshore', 'gold_coast_quarry', 'moonbrook', 'forgotten_pools', 'stagnant_oasis',
    'sludge_fen', 'lushwater_oasis', 'lakeshire', 'lake_everstill', 'cragpool_lake', 'mirkfallon_lake', 'the_hushed_bank', 'mystral_lake', 'menethil_harbor',
    'bluegill_marsh', 'saltspray_glen', 'lake_nazferiti', 'waterspring_field', 'lost_rigger_cove', 'rumhook_bay', 'saltpenny_wharf', 'blackgull_cove',
    'the_forgotten_coast', 'marshals_refuge', 'golakka_hot_springs', 'the_marshlands', 'lake_keltheril', 'theramore_isle', 'the_quagmire', 'scorched_fen',
    'the_wyrmbog', 'brightwater_landing', 'saltmarsh_shallows', 'bloodtide_landing', 'coralbone_beach', 'tidecrown_gate'];
  // what bites, by tier: common fish by the skill they need, one big and one rare that fight on the reel
  D.FISH = {
    1: { common: [['silverfin_minnow', 1], ['mudbelly_carp', 25]], big: ['whiskered_pike', 50], rare: ['glimmerscale', 60] },
    2: { common: [['speckled_trout', 75], ['reedback_perch', 100]], big: ['ironjaw_catfish', 125], rare: ['lantern_eel', 135] },
    3: { common: [['saltfin_snapper', 150], ['greyscale_cod', 175]], big: ['stormback_tuna', 200], rare: ['duskglass_ray', 210] },
    4: { common: [['ashgill_bass', 225], ['frostscale_herring', 250]], big: ['thunderhead_marlin', 275], rare: ['starlit_koi', 285] }, // Artisan (v10.9)
  };
  D.waterTier = (place) => { const P = D.PLACES[place]; if (!P || !D.WATERS.includes(place)) return 0; const L = Math.round(((P.lvl || [1, 1])[0] + (P.lvl || [1, 1])[1]) / 2); return L <= 15 ? 1 : L <= 28 ? 2 : L <= 45 ? 3 : 4; };
  D.FISH_CHANCE = { big: 0.15, rare: 0.05 }; // once your skill is up to them
  // meat from beasts you loot when you know Cooking (35%)
  D.beastMeat = (lvl) => (lvl > 45 ? 'marbled_haunch' : lvl >= 28 ? 'thick_steak' : lvl >= 15 ? 'tough_meat' : 'lean_meat');

  // ---- consumables
  // potion: instant, usable in combat, shared 2 min cooldown. elixir: 1 hour, one at a time. stone: weapon damage for 30 min.
  D.item('minor_healing_potion', { name: 'Minor Healing Potion', slot: 'potion', q: 1, lvl: 1, icon: 'potion_red', heal: [70, 90], sell: 10 });
  D.item('lesser_healing_potion', { name: 'Lesser Healing Potion', slot: 'potion', q: 1, lvl: 8, icon: 'potion_red', heal: [140, 180], sell: 25 });
  D.item('healing_potion', { name: 'Healing Potion', slot: 'potion', q: 1, lvl: 16, icon: 'potion_red', heal: [280, 360], sell: 50 });
  D.item('minor_mana_potion', { name: 'Minor Mana Potion', slot: 'potion', q: 1, lvl: 5, icon: 'potion_blue', mana: [140, 180], sell: 20 });
  D.item('lesser_mana_potion', { name: 'Lesser Mana Potion', slot: 'potion', q: 1, lvl: 14, icon: 'potion_blue', mana: [280, 360], sell: 40 });
  D.item('elixir_lions_strength', { name: "Elixir of Lion's Strength", slot: 'elixir', q: 1, lvl: 1, icon: 'elixir_gold', buff: { str: 4 }, sell: 10 });
  D.item('elixir_minor_defense', { name: 'Elixir of Minor Defense', slot: 'elixir', q: 1, lvl: 1, icon: 'elixir_green', buff: { armor: 50 }, sell: 10 });
  D.item('elixir_minor_agility', { name: 'Elixir of Minor Agility', slot: 'elixir', q: 1, lvl: 2, icon: 'elixir_green', buff: { agi: 4 }, sell: 20 });
  D.item('elixir_minor_fortitude', { name: 'Elixir of Minor Fortitude', slot: 'elixir', q: 1, lvl: 2, icon: 'elixir_gold', buff: { sta: 3 }, sell: 20 });
  D.item('elixir_wisdom', { name: 'Elixir of Wisdom', slot: 'elixir', q: 1, lvl: 10, icon: 'elixir_green', buff: { int: 6 }, sell: 40 });
  D.item('elixir_fortitude', { name: 'Elixir of Fortitude', slot: 'elixir', q: 2, lvl: 18, icon: 'elixir_gold', buff: { sta: 8 }, sell: 80 });
  D.item('rough_sharpening_stone', { name: 'Rough Sharpening Stone', slot: 'stone', q: 1, lvl: 1, icon: 'sharpening_stone', wdmg: 1, sell: 3 });
  D.item('coarse_sharpening_stone', { name: 'Coarse Sharpening Stone', slot: 'stone', q: 1, lvl: 15, icon: 'weightstone', wdmg: 2, sell: 10 });
  D.item('light_armor_kit', { name: 'Light Armor Kit', slot: 'kit', q: 1, lvl: 1, icon: 'armor_kit', kit: 8, sell: 10 });
  D.item('medium_armor_kit', { name: 'Medium Armor Kit', slot: 'kit', q: 1, lvl: 15, icon: 'armor_kit', kit: 16, sell: 30 });
  // bags: equip up to four; each adds its slots to your 16-slot backpack
  D.item('small_pouch', { name: 'Small Brown Pouch', slot: 'bag', q: 1, lvl: 1, icon: 'bag_linen', bag: 4, sell: 25, cost: 2500 });
  D.item('linen_bag', { name: 'Linen Bag', slot: 'bag', q: 1, lvl: 1, icon: 'bag_linen', bag: 6, sell: 60 });
  D.item('woolen_bag', { name: 'Woolen Bag', slot: 'bag', q: 1, lvl: 1, icon: 'bag_wool', bag: 8, sell: 150 });
  // Expert (v10.9) consumables and the silk bag
  D.item('greater_healing_potion', { name: 'Greater Healing Potion', slot: 'potion', q: 1, lvl: 28, icon: 'potion_red', heal: [455, 585], sell: 90 });
  D.item('mana_potion', { name: 'Mana Potion', slot: 'potion', q: 1, lvl: 30, icon: 'potion_blue', mana: [455, 585], sell: 100 });
  D.item('greater_mana_potion', { name: 'Greater Mana Potion', slot: 'potion', q: 1, lvl: 40, icon: 'potion_blue', mana: [700, 900], sell: 160 });
  D.item('superior_healing_potion', { name: 'Superior Healing Potion', slot: 'potion', q: 1, lvl: 44, icon: 'potion_red', heal: [700, 900], sell: 170 });
  D.item('elixir_agility', { name: 'Elixir of Agility', slot: 'elixir', q: 1, lvl: 32, icon: 'elixir_green', buff: { agi: 12 }, sell: 110 });
  D.item('elixir_greater_defense', { name: 'Elixir of Greater Defense', slot: 'elixir', q: 1, lvl: 34, icon: 'elixir_green', buff: { armor: 60 }, sell: 120 });
  D.item('elixir_intellect', { name: 'Elixir of Intellect', slot: 'elixir', q: 1, lvl: 38, icon: 'elixir_gold', buff: { int: 12 }, sell: 140 });
  D.item('elixir_ironhide', { name: 'Elixir of the Ironhide', slot: 'elixir', q: 2, lvl: 44, icon: 'elixir_gold', buff: { sta: 8, armor: 30 }, sell: 260 });
  D.item('heavy_sharpening_stone', { name: 'Heavy Sharpening Stone', slot: 'stone', q: 1, lvl: 25, icon: 'sharpening_stone', wdmg: 3, sell: 25 });
  D.item('embersilver_weightstone', { name: 'Embersilver Weightstone', slot: 'stone', q: 1, lvl: 35, icon: 'weightstone', wdmg: 3, sell: 45 });
  D.item('heavy_armor_kit', { name: 'Heavy Armor Kit', slot: 'kit', q: 1, lvl: 25, icon: 'armor_kit', kit: 24, sell: 70 });
  D.item('thick_armor_kit', { name: 'Thick Armor Kit', slot: 'kit', q: 1, lvl: 38, icon: 'armor_kit', kit: 32, sell: 120 });
  D.item('silk_bag', { name: 'Silk Bag', slot: 'bag', q: 1, lvl: 1, icon: 'bag_wool', bag: 10, sell: 400 });
  // Artisan (v10.9) consumables and bags (flasks: elixirs that last 2 hours and stay when you die)
  D.item('grand_healing_potion', { name: 'Grand Healing Potion', slot: 'potion', q: 1, lvl: 50, icon: 'potion_red', heal: [1000, 1300], sell: 220 });
  D.item('grand_mana_potion', { name: 'Grand Mana Potion', slot: 'potion', q: 1, lvl: 52, icon: 'potion_blue', mana: [1000, 1300], sell: 240 });
  D.item('elixir_might', { name: 'Elixir of Might', slot: 'elixir', q: 1, lvl: 52, icon: 'elixir_gold', buff: { str: 14 }, sell: 200 });
  D.item('elixir_swiftness', { name: 'Elixir of Swiftness', slot: 'elixir', q: 1, lvl: 53, icon: 'elixir_green', buff: { agi: 14 }, sell: 210 });
  D.item('elixir_clarity', { name: 'Elixir of Clarity', slot: 'elixir', q: 1, lvl: 54, icon: 'elixir_gold', buff: { int: 14 }, sell: 220 });
  D.item('flask_iron_wall', { name: 'Flask of the Iron Wall', slot: 'elixir', flask: true, q: 2, lvl: 60, icon: 'flask_iron_wall', buff: { sta: 10 }, sell: 600 });
  D.item('flask_warpath', { name: 'Flask of the Warpath', slot: 'elixir', flask: true, q: 2, lvl: 60, icon: 'flask_warpath', buff: { str: 8, agi: 8 }, sell: 600 });
  D.item('flask_stillmind', { name: 'Flask of the Stillmind', slot: 'elixir', flask: true, q: 3, lvl: 60, icon: 'flask_stillmind', buff: { int: 16, spi: 8 }, sell: 900 });
  D.item('deepstone_whetstone', { name: 'Deepstone Whetstone', slot: 'stone', q: 1, lvl: 50, icon: 'deepstone_whetstone', wdmg: 4, sell: 70 });
  D.item('hardhide_armor_kit', { name: 'Hardhide Armor Kit', slot: 'kit', q: 1, lvl: 50, icon: 'hardhide_armor_kit', kit: 34, sell: 180 });
  D.item('duskweave_bag', { name: 'Duskweave Bag', slot: 'bag', q: 1, lvl: 1, icon: 'bag_duskweave', bag: 12, sell: 900 });
  D.item('starweave_bag', { name: 'Starweave Bag', slot: 'bag', q: 2, lvl: 1, icon: 'bag_starweave', bag: 14, sell: 2000 });
  D.BAG_SLOTS = 4;
  // ---- Cooking (v10.9): food restores 10% more than shop food of its level; a Well Fed meal also gives a small buff for
  // 30 min (one at a time, beside an elixir)
  const shopFood = Object.values(D.ITEMS).filter((i) => i.slot === 'food' && i.cost && i.restore).map((i) => [i.lvl || 1, i.restore]).sort((a, b) => a[0] - b[0]);
  D.foodRestore = (L) => { let lo = shopFood[0], hi = shopFood[shopFood.length - 1]; for (const f of shopFood) { if (f[0] <= L) lo = f; if (f[0] >= L) { hi = f; break; } }
    const v = hi[0] === lo[0] ? lo[1] : lo[1] + (hi[1] - lo[1]) * (L - lo[0]) / (hi[0] - lo[0]); return Math.round(v * 1.1); };
  const dish = (id, name, lvl, wellFed, sell) => D.item(id, Object.assign({ name, slot: 'food', q: 1, lvl, icon: id, restore: D.foodRestore(lvl), sell }, wellFed ? { wellFed } : {}));
  dish('grilled_minnow', 'Grilled Minnow', 5, null, 2);
  dish('roast_lean_meat', 'Roast Lean Meat', 7, null, 3);
  dish('carp_stew', 'Carp Stew', 10, null, 5);
  dish('spiced_pike', 'Spiced Pike', 12, { sta: 3, spi: 3 }, 12);
  dish('glimmerscale_supper', 'Glimmerscale Supper', 15, { str: 4, sta: 4 }, 40);
  dish('pan_fried_trout', 'Pan-Fried Trout', 18, null, 8);
  dish('meat_skewer', 'Meat Skewer', 20, null, 9);
  dish('perch_chowder', 'Perch Chowder', 22, null, 12);
  dish('hunters_stew', "Hunter's Stew", 22, { str: 5, sta: 5 }, 25);
  dish('catfish_gumbo', 'Catfish Gumbo', 25, { sta: 6, spi: 6 }, 30);
  dish('baked_lantern_eel', 'Baked Lantern Eel', 27, { int: 6, spi: 6 }, 70);
  dish('saltfin_skewer', 'Saltfin Skewer', 30, null, 18);
  dish('peppered_steak', 'Peppered Steak', 32, { str: 8, sta: 6 }, 40);
  dish('smoked_cod', 'Smoked Cod', 37, null, 25);
  dish('seafarers_stew', "Seafarer's Stew", 38, { agi: 8, sta: 6 }, 50);
  dish('stormback_tuna_steak', 'Stormback Tuna Steak', 40, { sta: 6, spi: 7 }, 60);
  dish('duskglass_feast', 'Duskglass Feast', 43, { int: 10, sta: 6 }, 150);
  // Artisan (v10.9): skill 225-300
  dish('ashgill_fillet', 'Ashgill Bass Fillet', 46, null, 30);
  dish('roast_haunch', 'Roast Marbled Haunch', 48, null, 32);
  dish('herring_pie', 'Frostscale Herring Pie', 52, null, 40);
  dish('smokehouse_stew', 'Smokehouse Stew', 53, { str: 8, sta: 5 }, 70);
  dish('spiced_haunch', 'Spiced Haunch Roast', 55, { agi: 9, sta: 5 }, 75);
  dish('trail_skewer', "Trailmaster's Skewer", 56, null, 45);
  dish('marlin_steak', 'Thunderhead Marlin Steak', 57, { sta: 6, spi: 7 }, 90);
  dish('koi_banquet', 'Starlit Koi Banquet', 59, { int: 11, sta: 6 }, 220);
  dish('long_table_feast', 'Feast of the Long Table', 60, { str: 8, agi: 8, sta: 5 }, 260);

  // ---- crafted gear, on the same curve as random drops (G.genGear), with fixed stats
  const QM = [0.8, 1, 1.1, 1.22, 1.35];
  function gear(id, o) {
    const it = Object.assign({ q: 2, crafted: true }, o);
    const qm = QM[it.q], L = it.lvl;
    if (it.slot === 'weapon') {
      const Wb = D.WEAPON_BASES[it.wtype];
      const dps = (1.6 + L * 0.45) * qm * (it.wtype === 'staff' ? 1.35 : 1);
      it.speed = it.speed || Wb.speed;
      it.dmg = [Math.max(1, Math.round(dps * it.speed * 0.7)), Math.max(2, Math.round(dps * it.speed * 1.3))];
      it.icon = it.icon || Wb.icon;
    } else {
      it.armor = Math.max(1, Math.round((D.SLOT_ARMOR[it.slot] || 3) * (it.atype ? D.GEAR_BASES[it.atype].arm : 0.3) * (L + 2) * 0.9 * qm));
      it.icon = it.icon || (it.slot === 'chest' ? 'chest_' + (it.atype || 'cloth') : D.SLOT_ICON[it.slot]);
    }
    if (it.q >= 2 && it.st) {
      const budget = Math.max(1, Math.round(it.q === 2 ? L * 0.55 + 1 : it.q === 3 ? L * 0.55 + 2 : L * 0.64 + 2)); // the drop curve (G.genGear)
      const ks = it.st; it.stats = {}; let left = budget;
      ks.forEach((k, i) => { const v = i === ks.length - 1 ? Math.max(1, left) : Math.max(1, Math.round(budget / ks.length)); it.stats[k] = v; left -= v; });
    }
    delete it.st;
    it.sell = Math.max(1, Math.round((L * L * 0.9 + 4) * [0.5, 1, 3, 7, 12][it.q]));
    D.item(id, it);
  }
  // blacksmithing
  gear('copper_bracers', { name: 'Copper Bracers', slot: 'wrist', atype: 'mail', q: 1, lvl: 3 });
  gear('copper_mace', { name: 'Copper Mace', slot: 'weapon', wtype: 'mace', q: 1, lvl: 4 });
  gear('copper_shortsword', { name: 'Copper Shortsword', slot: 'weapon', wtype: 'sword', q: 1, lvl: 4 });
  gear('copper_chain_belt', { name: 'Copper Chain Belt', slot: 'waist', atype: 'mail', lvl: 7, st: ['str', 'sta'] });
  gear('runed_copper_gauntlets', { name: 'Runed Copper Gauntlets', slot: 'hands', atype: 'mail', lvl: 9, st: ['str', 'sta'] });
  gear('rough_bronze_boots', { name: 'Rough Bronze Boots', slot: 'feet', atype: 'mail', lvl: 17, st: ['sta', 'str'] });
  gear('bronze_mace', { name: 'Bronze Mace', slot: 'weapon', wtype: 'mace', lvl: 19, st: ['str', 'sta'] });
  gear('bronze_shortsword', { name: 'Bronze Shortsword', slot: 'weapon', wtype: 'sword', lvl: 19, st: ['str', 'agi'] });
  gear('silvered_bronze_boots', { name: 'Silvered Bronze Boots', slot: 'feet', atype: 'mail', lvl: 22, st: ['str', 'sta'] });
  gear('silvered_bronze_gauntlets', { name: 'Silvered Bronze Gauntlets', slot: 'hands', atype: 'mail', lvl: 23, st: ['str', 'sta'] });
  gear('silvered_bronze_breastplate', { name: 'Silvered Bronze Breastplate', slot: 'chest', atype: 'mail', q: 3, lvl: 25, st: ['str', 'sta'] });
  // leatherworking
  gear('handstitched_leather_boots', { name: 'Handstitched Leather Boots', slot: 'feet', atype: 'leather', q: 1, lvl: 3 });
  gear('handstitched_leather_cloak', { name: 'Handstitched Leather Cloak', slot: 'back', q: 1, lvl: 4 });
  gear('embossed_leather_vest', { name: 'Embossed Leather Vest', slot: 'chest', atype: 'leather', lvl: 9, st: ['agi', 'sta'] });
  gear('embossed_leather_gloves', { name: 'Embossed Leather Gloves', slot: 'hands', atype: 'leather', lvl: 11, st: ['agi', 'sta'] });
  gear('fine_leather_belt', { name: 'Fine Leather Belt', slot: 'waist', atype: 'leather', lvl: 14, st: ['agi', 'sta'] });
  gear('dark_leather_boots', { name: 'Dark Leather Boots', slot: 'feet', atype: 'leather', lvl: 18, st: ['agi', 'sta'] });
  gear('dark_leather_tunic', { name: 'Dark Leather Tunic', slot: 'chest', atype: 'leather', lvl: 20, st: ['agi', 'sta'] });
  gear('hillmans_leather_gloves', { name: "Hillman's Leather Gloves", slot: 'hands', atype: 'leather', lvl: 23, st: ['sta', 'agi'] });
  gear('toughened_leather_leggings', { name: 'Toughened Leather Leggings', slot: 'legs', atype: 'leather', q: 3, lvl: 25, st: ['agi', 'sta'] });
  // tailoring
  gear('linen_cloak', { name: 'Linen Cloak', slot: 'back', q: 1, lvl: 3 });
  gear('brown_linen_vest', { name: 'Brown Linen Vest', slot: 'chest', atype: 'cloth', q: 1, lvl: 5 });
  gear('heavy_linen_gloves', { name: 'Heavy Linen Gloves', slot: 'hands', atype: 'cloth', lvl: 8, st: ['int', 'sta'] });
  gear('reinforced_linen_cape', { name: 'Reinforced Linen Cape', slot: 'back', lvl: 12, st: ['sta', 'int'] });
  gear('woolen_cape', { name: 'Woolen Cape', slot: 'back', lvl: 15, st: ['int', 'spi'] });
  gear('heavy_woolen_gloves', { name: 'Heavy Woolen Gloves', slot: 'hands', atype: 'cloth', lvl: 16, st: ['int', 'sta'] });
  gear('gray_woolen_robe', { name: 'Gray Woolen Robe', slot: 'chest', atype: 'cloth', lvl: 19, st: ['int', 'spi'] });
  gear('heavy_woolen_pants', { name: 'Heavy Woolen Pants', slot: 'legs', atype: 'cloth', lvl: 21, st: ['int', 'sta'] });
  gear('sorcerers_woolen_robe', { name: "Sorcerer's Woolen Robe", slot: 'chest', atype: 'cloth', q: 3, lvl: 25, st: ['int', 'spi'], sp: 8 });
  // Expert (v10.9), levels 28-44
  gear('iron_chain_boots', { name: 'Iron Chain Boots', slot: 'feet', atype: 'mail', lvl: 28, st: ['str', 'sta'] });
  gear('iron_hauberk', { name: 'Iron Hauberk', slot: 'chest', atype: 'mail', lvl: 30, st: ['sta', 'str'] });
  gear('steel_warhammer', { name: 'Steel Warhammer', slot: 'weapon', wtype: 'mace', lvl: 33, st: ['str', 'sta'] });
  gear('steel_longsword', { name: 'Steel Longsword', slot: 'weapon', wtype: 'sword', lvl: 34, st: ['str', 'agi'] });
  gear('steel_banded_belt', { name: 'Steel-Banded Belt', slot: 'waist', atype: 'mail', lvl: 36, st: ['str', 'sta'] });
  gear('embersilver_gauntlets', { name: 'Embersilver Gauntlets', slot: 'hands', atype: 'mail', lvl: 38, st: ['str', 'sta'] });
  gear('embersilver_greaves', { name: 'Embersilver Greaves', slot: 'legs', atype: 'mail', lvl: 41, st: ['sta', 'str'] });
  gear('embersilver_breastplate', { name: 'Embersilver Breastplate', slot: 'chest', atype: 'mail', q: 3, lvl: 44, st: ['str', 'sta'] });
  gear('heavy_leather_boots', { name: 'Heavy Leather Boots', slot: 'feet', atype: 'leather', lvl: 28, st: ['agi', 'sta'] });
  gear('heavy_leather_gloves', { name: 'Heavy Leather Gloves', slot: 'hands', atype: 'leather', lvl: 30, st: ['agi', 'sta'] });
  gear('guardian_leather_tunic', { name: 'Guardian Leather Tunic', slot: 'chest', atype: 'leather', lvl: 34, st: ['sta', 'agi'] });
  gear('thick_leather_belt', { name: 'Thick Leather Belt', slot: 'waist', atype: 'leather', lvl: 39, st: ['agi', 'sta'] });
  gear('thick_leather_pants', { name: 'Thick Leather Pants', slot: 'legs', atype: 'leather', lvl: 41, st: ['agi', 'sta'] });
  gear('thick_leather_jerkin', { name: 'Thick Leather Jerkin', slot: 'chest', atype: 'leather', q: 3, lvl: 44, st: ['agi', 'sta'] });
  gear('silk_gloves', { name: 'Silk Gloves', slot: 'hands', atype: 'cloth', lvl: 29, st: ['int', 'sta'] });
  gear('silk_cloak', { name: 'Silk Cloak', slot: 'back', lvl: 32, st: ['int', 'spi'] });
  gear('crimson_silk_robe', { name: 'Crimson Silk Robe', slot: 'chest', atype: 'cloth', lvl: 36, st: ['int', 'spi'] });
  gear('silk_sash', { name: 'Silk Sash', slot: 'waist', atype: 'cloth', lvl: 38, st: ['int', 'sta'] });
  gear('silk_leggings', { name: 'Silk Leggings', slot: 'legs', atype: 'cloth', lvl: 40, st: ['int', 'sta'] });
  gear('silk_slippers', { name: 'Silk Slippers', slot: 'feet', atype: 'cloth', lvl: 42, st: ['int', 'spi'] }); // issue #6: tailoring had no trainer recipe between 195 and 225
  gear('silk_bracers', { name: 'Silk Bracers', slot: 'wrist', atype: 'cloth', lvl: 43, st: ['int', 'sta'] });
  gear('embersilver_threaded_robe', { name: 'Embersilver-Threaded Robe', slot: 'chest', atype: 'cloth', q: 3, lvl: 44, st: ['int', 'spi'], sp: 14 });
  // Artisan (v10.9), levels 48-60. The level-60 blues are the catch-up pieces and carry a crafted look (only from crafting)
  const crafted = (prof, sk) => `Crafted: ${D.PROFESSIONS[prof].name} ${sk}`;
  gear('duskiron_sabatons', { name: 'Duskiron Sabatons', slot: 'feet', atype: 'mail', lvl: 48, st: ['str', 'sta'] });
  gear('duskiron_hauberk', { name: 'Duskiron Hauberk', slot: 'chest', atype: 'mail', lvl: 52, st: ['sta', 'str'] });
  gear('duskiron_greatsword', { name: 'Duskiron Greatsword', slot: 'weapon', wtype: 'sword', lvl: 54, st: ['str', 'sta'] });
  gear('duskiron_bracers', { name: 'Duskiron Bracers', slot: 'wrist', atype: 'mail', lvl: 57, st: ['str', 'sta'] });
  gear('moonforged_breastplate', { name: 'Moonforged Breastplate', slot: 'chest', atype: 'mail', q: 3, lvl: 60, st: ['str', 'sta'], look: ['chest', 'moonforged_chest'], source: crafted('blacksmithing', 280) });
  gear('moonforged_legplates', { name: 'Moonforged Legplates', slot: 'legs', atype: 'mail', q: 3, lvl: 60, st: ['sta', 'str'], look: ['legs', 'moonforged_legs'], source: crafted('blacksmithing', 285) });
  gear('moonforged_blade', { name: 'Moonforged Blade', slot: 'weapon', wtype: 'sword', q: 3, lvl: 60, st: ['str', 'agi'], look: ['weapon', 'moonforged_blade'], source: crafted('blacksmithing', 290) + ' (a rare recipe)' });
  gear('moonforged_warhammer', { name: 'Moonforged Warhammer', slot: 'weapon', wtype: 'mace', q: 3, lvl: 60, st: ['str', 'sta'], look: ['weapon', 'moonforged_hammer'], source: crafted('blacksmithing', 295) + ' (a rare recipe)' });
  gear('thickhide_bracers', { name: 'Thickhide Bracers', slot: 'wrist', atype: 'leather', lvl: 46, st: ['agi', 'sta'] }); // from thick leather: a leatherworker at 225 has work before level-50 beasts
  gear('hardhide_boots', { name: 'Hardhide Boots', slot: 'feet', atype: 'leather', lvl: 50, st: ['agi', 'sta'] });
  gear('hardhide_gloves', { name: 'Hardhide Gloves', slot: 'hands', atype: 'leather', lvl: 52, st: ['agi', 'sta'] });
  gear('hardhide_belt', { name: 'Hardhide Belt', slot: 'waist', atype: 'leather', lvl: 55, st: ['sta', 'agi'] });
  gear('wildrunner_tunic', { name: 'Wildrunner Tunic', slot: 'chest', atype: 'leather', q: 3, lvl: 60, st: ['agi', 'sta'], look: ['chest', 'wildrunner_chest'], source: crafted('leatherworking', 280) });
  gear('wildrunner_leggings', { name: 'Wildrunner Leggings', slot: 'legs', atype: 'leather', q: 3, lvl: 60, st: ['agi', 'sta'], look: ['legs', 'wildrunner_legs'], source: crafted('leatherworking', 285) });
  gear('wildrunner_cloak', { name: 'Wildrunner Cloak', slot: 'back', q: 3, lvl: 60, st: ['agi', 'sta'], look: ['back', 'wildrunner_cloak'], source: crafted('leatherworking', 290) + ' (a rare recipe)' });
  gear('duskweave_gloves', { name: 'Duskweave Gloves', slot: 'hands', atype: 'cloth', lvl: 49, st: ['int', 'sta'] });
  gear('duskweave_robe', { name: 'Duskweave Robe', slot: 'chest', atype: 'cloth', lvl: 52, st: ['int', 'spi'] });
  gear('duskweave_leggings', { name: 'Duskweave Leggings', slot: 'legs', atype: 'cloth', lvl: 55, st: ['int', 'sta'] });
  gear('starweave_robe', { name: 'Starweave Robe', slot: 'chest', atype: 'cloth', q: 3, lvl: 60, st: ['int', 'spi'], look: ['chest', 'starweave_chest'], source: crafted('tailoring', 280) });
  gear('starweave_trousers', { name: 'Starweave Trousers', slot: 'legs', atype: 'cloth', q: 3, lvl: 60, st: ['int', 'sta'], look: ['legs', 'starweave_legs'], source: crafted('tailoring', 285) });

  // ---- recipes. sk = [learn, yellow, green, grey]; default [s, s+25, s+37, s+50].
  // rare: taught by a recipe item that drops in dungeons, not by the trainer.
  const R = D.RECIPES = {};
  const rec = (id, prof, s, makes, mats, o) => { R[id] = Object.assign({ id, prof, sk: [s, s + 25, s + 37, s + 50], makes, n: 1, mats }, o); };
  // mining (smelting)
  rec('smelt_copper', 'mining', 1, 'copper_bar', { copper_ore: 1 }, { sk: [1, 25, 47, 70] });
  rec('smelt_tin', 'mining', 65, 'tin_bar', { tin_ore: 1 }, { sk: [65, 65, 70, 75] });
  rec('smelt_bronze', 'mining', 65, 'bronze_bar', { copper_bar: 1, tin_bar: 1 }, { n: 2, sk: [65, 65, 90, 115] });
  rec('smelt_silver', 'mining', 75, 'silver_bar', { silver_ore: 1 }, { sk: [75, 115, 122, 130] });
  // blacksmithing
  rec('bs_rough_stone', 'blacksmithing', 1, 'rough_sharpening_stone', { rough_stone: 1 }, { sk: [1, 15, 35, 55] });
  rec('bs_copper_bracers', 'blacksmithing', 1, 'copper_bracers', { copper_bar: 2 }, { sk: [1, 20, 40, 60] });
  rec('bs_copper_mace', 'blacksmithing', 15, 'copper_mace', { copper_bar: 6, linen_cloth: 2 });
  rec('bs_copper_shortsword', 'blacksmithing', 25, 'copper_shortsword', { copper_bar: 6, linen_cloth: 2 });
  rec('bs_copper_chain_belt', 'blacksmithing', 35, 'copper_chain_belt', { copper_bar: 6 });
  rec('bs_runed_gauntlets', 'blacksmithing', 50, 'runed_copper_gauntlets', { copper_bar: 8, rough_stone: 2 });
  rec('bs_coarse_stone', 'blacksmithing', 65, 'coarse_sharpening_stone', { coarse_stone: 1 }, { sk: [65, 65, 72, 80] });
  rec('bs_bronze_boots', 'blacksmithing', 95, 'rough_bronze_boots', { bronze_bar: 6, coarse_stone: 1 });
  rec('bs_bronze_mace', 'blacksmithing', 105, 'bronze_mace', { bronze_bar: 6, light_leather: 1 });
  rec('bs_bronze_shortsword', 'blacksmithing', 110, 'bronze_shortsword', { bronze_bar: 6, light_leather: 1 });
  rec('bs_silvered_boots', 'blacksmithing', 125, 'silvered_bronze_boots', { bronze_bar: 6, silver_bar: 1 });
  rec('bs_silvered_gauntlets', 'blacksmithing', 135, 'silvered_bronze_gauntlets', { bronze_bar: 8, silver_bar: 1 });
  rec('bs_silvered_breastplate', 'blacksmithing', 140, 'silvered_bronze_breastplate', { bronze_bar: 10, silver_bar: 2 }, { rare: true });
  // alchemy
  rec('al_minor_healing', 'alchemy', 1, 'minor_healing_potion', { peacebloom: 1, silverleaf: 1, empty_vial: 1 }, { sk: [1, 55, 75, 95] });
  rec('al_lions_strength', 'alchemy', 1, 'elixir_lions_strength', { earthroot: 1, silverleaf: 1, empty_vial: 1 }, { sk: [1, 45, 65, 85] });
  rec('al_minor_defense', 'alchemy', 5, 'elixir_minor_defense', { silverleaf: 2, empty_vial: 1 });
  rec('al_minor_mana', 'alchemy', 25, 'minor_mana_potion', { mageroyal: 1, silverleaf: 1, empty_vial: 1 }, { sk: [25, 65, 85, 105] });
  rec('al_minor_agility', 'alchemy', 50, 'elixir_minor_agility', { earthroot: 1, mageroyal: 1, empty_vial: 1 });
  rec('al_minor_fortitude', 'alchemy', 50, 'elixir_minor_fortitude', { earthroot: 2, peacebloom: 1, empty_vial: 1 });
  rec('al_lesser_healing', 'alchemy', 55, 'lesser_healing_potion', { minor_healing_potion: 1, briarthorn: 1 }, { sk: [55, 85, 105, 125] });
  rec('al_wisdom', 'alchemy', 90, 'elixir_wisdom', { mageroyal: 1, briarthorn: 1, empty_vial: 1 });
  rec('al_healing', 'alchemy', 110, 'healing_potion', { bruiseweed: 1, briarthorn: 1, empty_vial: 1 }, { sk: [110, 135, 155, 175] });
  rec('al_lesser_mana', 'alchemy', 120, 'lesser_mana_potion', { mageroyal: 1, bruiseweed: 1, empty_vial: 1 }, { sk: [120, 145, 165, 185] });
  rec('al_fortitude', 'alchemy', 135, 'elixir_fortitude', { bruiseweed: 2, briarthorn: 1, empty_vial: 1 }, { rare: true });
  // leatherworking
  rec('lw_light_kit', 'leatherworking', 1, 'light_armor_kit', { light_leather: 1 }, { sk: [1, 30, 45, 60] });
  rec('lw_hs_boots', 'leatherworking', 1, 'handstitched_leather_boots', { light_leather: 2, coarse_thread: 1 }, { sk: [1, 40, 55, 70] });
  rec('lw_hs_cloak', 'leatherworking', 10, 'handstitched_leather_cloak', { light_leather: 2, coarse_thread: 1 });
  rec('lw_embossed_vest', 'leatherworking', 40, 'embossed_leather_vest', { light_leather: 8, coarse_thread: 4 });
  rec('lw_embossed_gloves', 'leatherworking', 55, 'embossed_leather_gloves', { light_leather: 3, coarse_thread: 2 });
  rec('lw_fine_belt', 'leatherworking', 80, 'fine_leather_belt', { light_leather: 6, coarse_thread: 2 });
  rec('lw_medium_kit', 'leatherworking', 100, 'medium_armor_kit', { medium_leather: 3, coarse_thread: 1 }, { sk: [100, 115, 122, 130] });
  rec('lw_dark_boots', 'leatherworking', 100, 'dark_leather_boots', { medium_leather: 4, coarse_thread: 2 });
  rec('lw_dark_tunic', 'leatherworking', 110, 'dark_leather_tunic', { medium_leather: 6, coarse_thread: 2 });
  rec('lw_hillmans_gloves', 'leatherworking', 135, 'hillmans_leather_gloves', { medium_leather: 5, coarse_thread: 2 });
  rec('lw_toughened_leggings', 'leatherworking', 140, 'toughened_leather_leggings', { medium_leather: 10, coarse_thread: 4 }, { rare: true });
  // tailoring
  rec('tl_linen_bolt', 'tailoring', 1, 'linen_bolt', { linen_cloth: 2 }, { sk: [1, 25, 37, 50] });
  rec('tl_linen_cloak', 'tailoring', 1, 'linen_cloak', { linen_bolt: 1, coarse_thread: 1 }, { sk: [1, 35, 47, 60] });
  rec('tl_brown_vest', 'tailoring', 10, 'brown_linen_vest', { linen_bolt: 1, coarse_thread: 1 });
  rec('tl_heavy_linen_gloves', 'tailoring', 35, 'heavy_linen_gloves', { linen_bolt: 2, coarse_thread: 1 });
  rec('tl_linen_bag', 'tailoring', 45, 'linen_bag', { linen_bolt: 3, coarse_thread: 3 }, { sk: [45, 70, 82, 95] });
  rec('tl_reinforced_cape', 'tailoring', 60, 'reinforced_linen_cape', { linen_bolt: 2, coarse_thread: 3 });
  rec('tl_wool_bolt', 'tailoring', 75, 'wool_bolt', { wool_cloth: 3 }, { sk: [75, 100, 112, 125] });
  rec('tl_woolen_cape', 'tailoring', 75, 'woolen_cape', { wool_bolt: 1, coarse_thread: 1 });
  rec('tl_woolen_bag', 'tailoring', 85, 'woolen_bag', { wool_bolt: 3, coarse_thread: 1 }, { sk: [85, 110, 122, 135] });
  rec('tl_heavy_woolen_gloves', 'tailoring', 95, 'heavy_woolen_gloves', { wool_bolt: 2, coarse_thread: 1 });
  rec('tl_gray_robe', 'tailoring', 105, 'gray_woolen_robe', { wool_bolt: 3, coarse_thread: 2 });
  rec('tl_heavy_woolen_pants', 'tailoring', 115, 'heavy_woolen_pants', { wool_bolt: 3, coarse_thread: 2 });
  rec('tl_sorcerers_robe', 'tailoring', 140, 'sorcerers_woolen_robe', { wool_bolt: 6, silver_bar: 1, coarse_thread: 2 }, { rare: true });
  // ---- Expert (v10.9): skill 125-215, levels 25-44
  rec('smelt_iron', 'mining', 125, 'iron_bar', { iron_ore: 1 });
  rec('smelt_gold', 'mining', 155, 'gold_bar', { gold_ore: 1 }, { sk: [155, 170, 175, 180] });
  rec('smelt_steel', 'mining', 165, 'steel_bar', { iron_bar: 1, smithing_coal: 1 });
  rec('smelt_embersilver', 'mining', 175, 'embersilver_bar', { embersilver_ore: 1 }, { sk: [175, 200, 212, 225] });
  rec('bs_heavy_stone', 'blacksmithing', 150, 'heavy_sharpening_stone', { heavy_stone: 2 }, { sk: [150, 165, 177, 190] });
  rec('bs_iron_boots', 'blacksmithing', 150, 'iron_chain_boots', { iron_bar: 6, heavy_stone: 1 });
  rec('bs_iron_hauberk', 'blacksmithing', 160, 'iron_hauberk', { iron_bar: 10 });
  rec('bs_steel_warhammer', 'blacksmithing', 170, 'steel_warhammer', { steel_bar: 6, heavy_stone: 2 });
  rec('bs_steel_longsword', 'blacksmithing', 175, 'steel_longsword', { steel_bar: 6, heavy_stone: 2 });
  rec('bs_steel_belt', 'blacksmithing', 180, 'steel_banded_belt', { steel_bar: 5, heavy_stone: 2 });
  rec('bs_ember_weightstone', 'blacksmithing', 180, 'embersilver_weightstone', { embersilver_bar: 1, heavy_stone: 1 }, { sk: [180, 200, 212, 225] });
  rec('bs_ember_gauntlets', 'blacksmithing', 190, 'embersilver_gauntlets', { embersilver_bar: 6, steel_bar: 2 });
  rec('bs_ember_greaves', 'blacksmithing', 205, 'embersilver_greaves', { embersilver_bar: 10, gold_bar: 1 });
  rec('bs_ember_breastplate', 'blacksmithing', 215, 'embersilver_breastplate', { embersilver_bar: 14, gold_bar: 2 }, { rare: true });
  rec('al_greater_healing', 'alchemy', 150, 'greater_healing_potion', { ironthistle: 1, redmantle: 1, sturdy_vial: 1 }); // the first Expert recipe, so an alchemist at 150 has one
  rec('al_mana', 'alchemy', 160, 'mana_potion', { redmantle: 1, stoutroot: 1, sturdy_vial: 1 });
  rec('al_agility', 'alchemy', 165, 'elixir_agility', { dimleaf: 1, ironthistle: 1, sturdy_vial: 1 });
  rec('al_greater_defense', 'alchemy', 175, 'elixir_greater_defense', { dimleaf: 1, goldspur: 1, sturdy_vial: 1 });
  rec('al_intellect', 'alchemy', 185, 'elixir_intellect', { goldspur: 1, hermits_beard: 1, sturdy_vial: 1 });
  rec('al_greater_mana', 'alchemy', 195, 'greater_mana_potion', { hermits_beard: 1, rimeleaf: 1, sturdy_vial: 1 });
  rec('al_superior_healing', 'alchemy', 210, 'superior_healing_potion', { rimeleaf: 1, goldspur: 1, sturdy_vial: 1 });
  rec('al_ironhide', 'alchemy', 215, 'elixir_ironhide', { rimeleaf: 2, hermits_beard: 1, gold_bar: 1, sturdy_vial: 1 }, { rare: true });
  rec('lw_heavy_kit', 'leatherworking', 150, 'heavy_armor_kit', { heavy_leather: 4, fine_thread: 1 });
  rec('lw_heavy_boots', 'leatherworking', 150, 'heavy_leather_boots', { heavy_leather: 6, fine_thread: 2 });
  rec('lw_heavy_gloves', 'leatherworking', 160, 'heavy_leather_gloves', { heavy_leather: 6, fine_thread: 2 });
  rec('lw_guardian_tunic', 'leatherworking', 175, 'guardian_leather_tunic', { heavy_leather: 10, fine_thread: 3 });
  rec('lw_thick_belt', 'leatherworking', 190, 'thick_leather_belt', { thick_leather: 6, fine_thread: 2 });
  rec('lw_thick_kit', 'leatherworking', 200, 'thick_armor_kit', { thick_leather: 4, fine_thread: 1 });
  rec('lw_thick_pants', 'leatherworking', 205, 'thick_leather_pants', { thick_leather: 10, fine_thread: 3 });
  rec('lw_thick_jerkin', 'leatherworking', 215, 'thick_leather_jerkin', { thick_leather: 14, gold_bar: 1 }, { rare: true });
  rec('tl_silk_bolt', 'tailoring', 150, 'silk_bolt', { silk_cloth: 2 }, { sk: [150, 175, 187, 200] }); // 2 cloth, like duskweave: tailoring kept up with the other crafts (issue #6)
  rec('tl_silk_gloves', 'tailoring', 155, 'silk_gloves', { silk_bolt: 2, fine_thread: 1 });
  rec('tl_silk_bag', 'tailoring', 160, 'silk_bag', { silk_bolt: 4, fine_thread: 2 });
  rec('tl_silk_cloak', 'tailoring', 165, 'silk_cloak', { silk_bolt: 2, fine_thread: 1 });
  rec('tl_crimson_robe', 'tailoring', 180, 'crimson_silk_robe', { silk_bolt: 4, fine_thread: 3 });
  rec('tl_silk_sash', 'tailoring', 185, 'silk_sash', { silk_bolt: 2, fine_thread: 1 });
  rec('tl_silk_leggings', 'tailoring', 195, 'silk_leggings', { silk_bolt: 3, fine_thread: 2 });
  rec('tl_silk_slippers', 'tailoring', 205, 'silk_slippers', { silk_bolt: 2, fine_thread: 1 });
  rec('tl_silk_bracers', 'tailoring', 210, 'silk_bracers', { silk_bolt: 2, fine_thread: 1 });
  rec('tl_ember_robe', 'tailoring', 215, 'embersilver_threaded_robe', { silk_bolt: 8, embersilver_bar: 2, fine_thread: 3 }, { rare: true });
  // ---- Artisan (v10.9): skill 225-295, levels 45-60
  rec('smelt_duskiron', 'mining', 225, 'duskiron_bar', { duskiron_ore: 1 });
  rec('smelt_moonsilver', 'mining', 260, 'moonsilver_bar', { moonsilver_ore: 1 }, { sk: [260, 275, 280, 285] });
  rec('bs_deepstone_whetstone', 'blacksmithing', 205, 'deepstone_whetstone', { deepstone: 2 }, { sk: [205, 225, 245, 265] }); // from 205: a smith arriving at 45 with 200-225 has work (issue #6)
  rec('bs_duskiron_sabatons', 'blacksmithing', 230, 'duskiron_sabatons', { duskiron_bar: 8, deepstone: 1 });
  rec('bs_duskiron_hauberk', 'blacksmithing', 250, 'duskiron_hauberk', { duskiron_bar: 12 });
  rec('bs_duskiron_greatsword', 'blacksmithing', 260, 'duskiron_greatsword', { duskiron_bar: 8, deepstone: 2 });
  rec('bs_duskiron_bracers', 'blacksmithing', 270, 'duskiron_bracers', { duskiron_bar: 6, deepstone: 1 }); // issue #6: a step between 260 and 280
  rec('bs_moonforged_breastplate', 'blacksmithing', 280, 'moonforged_breastplate', { duskiron_bar: 12, moonsilver_bar: 1 });
  rec('bs_moonforged_legplates', 'blacksmithing', 285, 'moonforged_legplates', { duskiron_bar: 11, moonsilver_bar: 1 });
  rec('bs_moonforged_blade', 'blacksmithing', 290, 'moonforged_blade', { moonsilver_bar: 4, duskiron_bar: 8 }, { rare: true });
  rec('bs_moonforged_hammer', 'blacksmithing', 295, 'moonforged_warhammer', { moonsilver_bar: 4, duskiron_bar: 8 }, { rare: true });
  rec('lw_thickhide_bracers', 'leatherworking', 225, 'thickhide_bracers', { thick_leather: 5, fine_thread: 1 });
  rec('lw_hardhide_kit', 'leatherworking', 230, 'hardhide_armor_kit', { hardhide_leather: 4, fine_thread: 1 });
  rec('lw_hardhide_boots', 'leatherworking', 235, 'hardhide_boots', { hardhide_leather: 6, fine_thread: 2 });
  rec('lw_hardhide_gloves', 'leatherworking', 250, 'hardhide_gloves', { hardhide_leather: 6, fine_thread: 2 });
  rec('lw_hardhide_belt', 'leatherworking', 260, 'hardhide_belt', { hardhide_leather: 8, fine_thread: 2 });
  rec('lw_wildrunner_tunic', 'leatherworking', 280, 'wildrunner_tunic', { hardhide_leather: 14, fine_thread: 3 });
  rec('lw_wildrunner_leggings', 'leatherworking', 285, 'wildrunner_leggings', { hardhide_leather: 12, fine_thread: 3 });
  rec('lw_wildrunner_cloak', 'leatherworking', 290, 'wildrunner_cloak', { hardhide_leather: 10, frostpetal: 2 }, { rare: true });
  rec('tl_duskweave_bolt', 'tailoring', 200, 'duskweave_bolt', { duskweave_cloth: 2 }, { sk: [200, 225, 250, 275] }); // from 200, the trainer's requirement (issue #6)
  rec('tl_duskweave_gloves', 'tailoring', 235, 'duskweave_gloves', { duskweave_bolt: 2, fine_thread: 1 });
  rec('tl_duskweave_bag', 'tailoring', 240, 'duskweave_bag', { duskweave_bolt: 4, fine_thread: 2 });
  rec('tl_duskweave_robe', 'tailoring', 250, 'duskweave_robe', { duskweave_bolt: 3, fine_thread: 2 });
  rec('tl_duskweave_leggings', 'tailoring', 260, 'duskweave_leggings', { duskweave_bolt: 2, fine_thread: 2 });
  rec('tl_starweave_robe', 'tailoring', 280, 'starweave_robe', { duskweave_bolt: 4, fine_thread: 3 });
  rec('tl_starweave_trousers', 'tailoring', 285, 'starweave_trousers', { duskweave_bolt: 3, fine_thread: 3 });
  rec('tl_starweave_bag', 'tailoring', 295, 'starweave_bag', { duskweave_bolt: 8, moonsilver_bar: 1 }, { rare: true });
  rec('al_grand_healing', 'alchemy', 225, 'grand_healing_potion', { cinderbloom: 1, gloomcap: 1, sturdy_vial: 1 }); // the first Artisan recipe, so an alchemist at 225 has one
  rec('al_grand_mana', 'alchemy', 240, 'grand_mana_potion', { gloomcap: 1, sunveil: 1, sturdy_vial: 1 });
  rec('al_might', 'alchemy', 245, 'elixir_might', { cinderbloom: 2, sturdy_vial: 1 });
  rec('al_swiftness', 'alchemy', 250, 'elixir_swiftness', { sunveil: 2, sturdy_vial: 1 });
  rec('al_clarity', 'alchemy', 255, 'elixir_clarity', { frostpetal: 1, gloomcap: 1, sturdy_vial: 1 });
  rec('al_flask_iron_wall', 'alchemy', 275, 'flask_iron_wall', { frostpetal: 2, gloomcap: 2, moonsilver_bar: 1 });
  rec('al_flask_warpath', 'alchemy', 285, 'flask_warpath', { cinderbloom: 3, sunveil: 2, moonsilver_bar: 1 });
  rec('al_flask_stillmind', 'alchemy', 290, 'flask_stillmind', { frostpetal: 3, sunveil: 2, moonsilver_bar: 1 }, { rare: true });
  // cooking (v10.9): fish and meat, by tier
  rec('ck_grilled_minnow', 'cooking', 1, 'grilled_minnow', { silverfin_minnow: 1 });
  rec('ck_roast_lean_meat', 'cooking', 10, 'roast_lean_meat', { lean_meat: 1 });
  rec('ck_carp_stew', 'cooking', 25, 'carp_stew', { mudbelly_carp: 1, cooking_spices: 1 });
  rec('ck_spiced_pike', 'cooking', 50, 'spiced_pike', { whiskered_pike: 1, cooking_spices: 1 });
  rec('ck_glimmerscale_supper', 'cooking', 60, 'glimmerscale_supper', { glimmerscale: 1, lean_meat: 1 });
  rec('ck_pan_fried_trout', 'cooking', 75, 'pan_fried_trout', { speckled_trout: 1 });
  rec('ck_meat_skewer', 'cooking', 90, 'meat_skewer', { tough_meat: 1 });
  rec('ck_perch_chowder', 'cooking', 100, 'perch_chowder', { reedback_perch: 1, cooking_spices: 1 });
  rec('ck_hunters_stew', 'cooking', 110, 'hunters_stew', { tough_meat: 2, cooking_spices: 1 });
  rec('ck_catfish_gumbo', 'cooking', 125, 'catfish_gumbo', { ironjaw_catfish: 1, cooking_spices: 1 });
  rec('ck_baked_lantern_eel', 'cooking', 135, 'baked_lantern_eel', { lantern_eel: 1, tough_meat: 1 });
  rec('ck_saltfin_skewer', 'cooking', 150, 'saltfin_skewer', { saltfin_snapper: 1 });
  rec('ck_peppered_steak', 'cooking', 165, 'peppered_steak', { thick_steak: 1, cooking_spices: 1 });
  rec('ck_smoked_cod', 'cooking', 175, 'smoked_cod', { greyscale_cod: 1, cooking_spices: 1 });
  rec('ck_seafarers_stew', 'cooking', 185, 'seafarers_stew', { greyscale_cod: 1, thick_steak: 1, cooking_spices: 1 });
  rec('ck_tuna_steak', 'cooking', 200, 'stormback_tuna_steak', { stormback_tuna: 1, cooking_spices: 1 });
  rec('ck_duskglass_feast', 'cooking', 210, 'duskglass_feast', { duskglass_ray: 1, thick_steak: 1 });
  // Artisan (v10.9)
  rec('ck_ashgill_fillet', 'cooking', 225, 'ashgill_fillet', { ashgill_bass: 1 });
  rec('ck_roast_haunch', 'cooking', 235, 'roast_haunch', { marbled_haunch: 1 });
  rec('ck_herring_pie', 'cooking', 250, 'herring_pie', { frostscale_herring: 1, cooking_spices: 1 });
  rec('ck_smokehouse_stew', 'cooking', 255, 'smokehouse_stew', { marbled_haunch: 2, cooking_spices: 1 });
  rec('ck_spiced_haunch', 'cooking', 265, 'spiced_haunch', { marbled_haunch: 2, cooking_spices: 1 });
  rec('ck_trail_skewer', 'cooking', 270, 'trail_skewer', { marbled_haunch: 1, ashgill_bass: 1 });
  rec('ck_marlin_steak', 'cooking', 275, 'marlin_steak', { thunderhead_marlin: 1 });
  rec('ck_koi_banquet', 'cooking', 285, 'koi_banquet', { starlit_koi: 1, cooking_spices: 1 });
  rec('ck_long_table', 'cooking', 290, 'long_table_feast', { marbled_haunch: 2, thunderhead_marlin: 1 }, { rare: true });
  // recipe items for the rare ones (dungeon bosses and named rares drop them)
  const rname = { blacksmithing: 'Plans', alchemy: 'Recipe', leatherworking: 'Pattern', tailoring: 'Pattern', cooking: 'Recipe' };
  D.RARE_RECIPES = [];
  for (const id in R) if (R[id].rare) {
    const r = R[id], mk = D.ITEMS[r.makes];
    D.item('rc_' + id, { name: `${rname[r.prof]}: ${mk.name}`, slot: 'recipe', q: 2, icon: 'journal', teaches: id, sell: 250 });
    D.RARE_RECIPES.push('rc_' + id);
  }

  // ---- Artisan collections (v10.9): reaching 300 in a skill gives its keepsake (a look for your back, for every character
  // on the device; it never drops and has no stats) and its title
  D.PROF_REWARDS = {
    mining: { keepsake: 'deepdelvers_pick', name: "Deepdelver's Pick", title: '%s the Deepdelver', desc: 'A master miner\'s pick, worn on your back.' },
    herbalism: { keepsake: 'herbwise_satchel', name: 'Herbwise Satchel', title: '%s the Herbwise', desc: 'A satchel that never quite closes over its herbs. Worn on your back.' },
    skinning: { keepsake: 'hide_hunters_pelt', name: "Hide-Hunter's Pelt", title: '%s the Hide-Hunter', desc: 'The best pelt you ever took, worn over your shoulders.' },
    blacksmithing: { keepsake: 'master_smiths_hammer', name: "Master Smith's Hammer", title: '%s the Master Smith', desc: 'The hammer of a master smith, worn on your back.' },
    leatherworking: { keepsake: 'tanners_rolled_hides', name: "Tanner's Rolled Hides", title: '%s the Master Tanner', desc: 'A roll of your finest hides, strapped to your back.' },
    tailoring: { keepsake: 'weavers_spindle', name: "Weaver's Spindle", title: '%s the Master Weaver', desc: 'A great spindle wound with your own thread. Worn on your back.' },
    alchemy: { keepsake: 'alchemists_bandolier', name: "Alchemist's Bandolier", title: 'Master Alchemist %s', desc: 'A strap of glowing vials across your back.' },
    cooking: { keepsake: 'chefs_stewpot', name: "Chef's Stewpot", title: '%s the Chef', desc: 'Your stewpot and ladle, strapped to your back. It still smells of supper.' },
    fishing: { keepsake: 'anglers_rod', name: "Angler's Rod", title: '%s the Angler', desc: 'Your best fishing rod, carried on your back.' },
  };
  for (const [prof, R] of Object.entries(D.PROF_REWARDS)) {
    D.item(R.keepsake, { name: R.name, slot: 'back', keepsake: prof, lookOnly: true, q: 4, lvl: 1, icon: R.keepsake, look: ['back', R.keepsake], noSell: true, sell: 0, desc: R.desc, source: `Reach 300 in ${D.PROFESSIONS[prof].name}` });
    D.TITLES.push({ id: 'prof_' + prof, name: R.title, need: { prof }, how: `Reach 300 in ${D.PROFESSIONS[prof].name}` });
  }

  // ---- trainers: one artisan per city and level-10 hub, per faction
  Object.assign(D.NPCS, {
    crafts_alliance: { name: 'Artisan Hollis', title: 'Profession Trainer' },
    crafts_horde: { name: 'Artisan Grunna', title: 'Profession Trainer' },
    stable_alliance: { name: 'Stablemaster Rowan', title: 'Riding Trainer' },
    stable_horde: { name: 'Stablemaster Kuno', title: 'Riding Trainer' },
  });
  // both factions train in their own camps through 60, and a neutral town has both trainers (v10.9, issue #7)
  const TRAIN = { crafts_alliance: ['stormwind', 'ironforge', 'darnassus', 'sentinel_hill', 'lakeshire', 'darkshire', 'astranaar', 'menethil_harbor', 'rebel_camp', 'refuge_pointe', 'gadgetzan', 'feathermoon_stronghold', 'marshals_refuge', 'morgans_vigil', 'chillwind_camp', 'everlook', 'brightwater_landing'], crafts_horde: ['orgrimmar', 'thunder_bluff', 'undercity', 'crossroads', 'sun_rock_retreat', 'tarren_mill', 'splintertree_post', 'grom_gol', 'hammerfall', 'gadgetzan', 'camp_mojache', 'marshals_refuge', 'flame_crest', 'the_bulwark', 'everlook', 'bloodtide_landing'] };
  for (const npc in TRAIN) for (const p of TRAIN[npc]) if (D.PLACES[p] && !D.PLACES[p].npcs.includes(npc)) D.PLACES[p].npcs.push(npc);
  D.PROF_TRAINERS = TRAIN;
  // riding trainers in the capitals (v5.1)
  for (const [npc, caps] of [['stable_alliance', ['stormwind', 'ironforge', 'darnassus']], ['stable_horde', ['orgrimmar', 'thunder_bluff', 'undercity']]]) for (const p of caps) if (D.PLACES[p] && !D.PLACES[p].npcs.includes(npc)) D.PLACES[p].npcs.push(npc);
  // ---- Reagents (#505, docs/plans/2026-11-07-currency-sinks-design.md §2): every endgame consumable (level 57+: the
  // flasks, elixirs and Well Fed meals a level-60 player keeps up) also takes one vendor-only reagent, priced REAGENT_C x
  // its level, so keeping them up costs about 10% of a level-60 player's gold income (a flask lasts 2 h, a meal 30 min).
  // Level-50 stones and kits, which crafters make to level the skill, take none. The consumable's value rises by the
  // reagent's price over the auction house's x5, so bots selling it include the reagent.
  D.REAGENT_C = 250;
  D.item('crystal_vial', { name: 'Crystal Vial', slot: 'mat', q: 1, icon: 'sturdy_vial', sell: 1, cost: 0 });
  D.item('fine_spice', { name: 'Fine Spice', slot: 'mat', q: 1, icon: 'cooking_spices', sell: 1, cost: 0 });
  D.REAGENT_FOR = (it) => !it || (it.lvl || 0) < 57 ? null : it.flask || it.slot === 'elixir' ? 'crystal_vial' : it.wellFed ? 'fine_spice' : null;
  for (const r of Object.values(R)) {
    const it = D.ITEMS[r.makes], rg = D.REAGENT_FOR(it); if (!rg) continue;
    const price = Math.round(D.REAGENT_C * it.lvl), RG = D.ITEMS[rg];
    RG.cost = Math.max(RG.cost, price); // one price per reagent: the dearest level that uses it (level 60)
  }
  for (const r of Object.values(R)) {
    const it = D.ITEMS[r.makes], rg = D.REAGENT_FOR(it); if (!rg) continue;
    r.mats = Object.assign({}, r.mats, { [rg]: 1 }); it.sell = (it.sell || 1) + Math.round(D.ITEMS[rg].cost / 5 / (r.n || 1));
  }
})(typeof window !== 'undefined' ? window : globalThis);
