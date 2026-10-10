// Talents (v2.2): 1 point per level from 10. Three trees per class, the first three tiers for now
// (tier 2 opens at 5 points in a tree, tier 3 at 10). Every talent is a passive built from a small set of
// effect types that the engine understands (see E.talentMods):
//   stat {stat, v}        flat attribute (str agi sta int spi)
//   pct {stat, v}         % of str/agi/sta/int/spi/armor/hp/mana
//   crit / spellCrit / dodge / haste {v}   percentage points
//   school {school, v}    % damage of that school (physical fire frost arcane shadow holy nature)
//   heal {v}              % healing done (all heals)
//   abilDmg {ab, v}       % damage of listed abilities (direct and ticks)
//   abilHeal {ab, v}      % healing of listed abilities
//   dot / hot {ab, v}     % damage / healing per tick of listed abilities' damage or heal over time
//   abilCost {ab, v}      % less resource cost ('*' = every ability)
//   abilCd {ab, v}        seconds off the cooldown
//   abilCast {ab, v}      seconds off the cast time
//   buff {ab, v}          % stronger buff from listed abilities (stats, seals, thorns)
//   shield {ab, v}        % stronger absorb
//   taken {v}             % less damage taken
//   threat {v}            % more threat
//   pet {v}               % more pet health and damage
// Values are per rank. {v} in a description is the first effect's value at the rank shown.
(function (root) {
  const D = root.D;
  const t = (id, tier, ranks, name, icon, desc, ...fx) => ({ id, tier, ranks, name, icon, desc, fx });
  const f = (k, v, x) => Object.assign({ k, v }, x || {});
  D.TALENT_TIER_POINTS = [0, 0, 5, 10]; // points needed in a tree to open tier 1, 2, 3
  D.TALENT_START = 10;                   // first point at this level
  D.TALENTS = {
    warrior: [
      { id: 'arms', name: 'Arms', icon: 'rend', talents: [
        t('imp_heroic_strike', 1, 3, 'Improved Heroic Strike', 'heroic_strike', 'Heroic Strike costs {v}% less rage.', f('abilCost', 10, { ab: ['heroic_strike'] })),
        t('deflection', 1, 5, 'Deflection', 'retaliation', '+{v}% chance to dodge.', f('dodge', 1)),
        t('imp_rend', 2, 3, 'Improved Rend', 'rend', 'Rend deals {v}% more damage.', f('dot', 15, { ab: ['rend'] })),
        t('two_handed_spec', 2, 3, 'Weapon Specialization', 'cleave', 'Your physical damage is increased by {v}%.', f('school', 2, { school: 'physical' })),
        t('heavy_swings', 2, 3, 'Heavy Swings', 'heroic_strike', 'Heroic Strike deals {v}% more damage.', f('abilDmg', 5, { ab: ['heroic_strike'] })), // #191
        t('sweeping_strikes', 3, 1, 'Sweeping Strikes', 'cleave', 'Cleave and Thunder Clap deal {v}% more damage.', f('abilDmg', 30, { ab: ['cleave', 'thunder_clap'] })),
      ] },
      { id: 'fury', name: 'Fury', icon: 'bloodrage', talents: [
        t('cruelty', 1, 5, 'Cruelty', 'bloodrage', '+{v}% critical strike chance.', f('crit', 1)),
        t('unbridled_wrath', 1, 5, 'Unbridled Wrath', 'battle_shout', 'Your physical damage is increased by {v}%.', f('school', 2, { school: 'physical' })),
        t('imp_cleave', 2, 3, 'Improved Cleave', 'cleave', 'Cleave deals {v}% more damage.', f('abilDmg', 20, { ab: ['cleave'] })),
        t('enrage', 2, 3, 'Enrage', 'retaliation', 'You attack {v}% faster.', f('haste', 3)),
        t('death_wish', 3, 1, 'Death Wish', 'bloodrage', 'Your physical damage is increased by {v}% and you attack 5% faster.', f('school', 6, { school: 'physical' }), f('haste', 5)),
      ] },
      { id: 'protection', name: 'Protection', icon: 'taunt', talents: [
        t('toughness', 1, 5, 'Toughness', 'retaliation', 'Armor from items increased by {v}%.', f('pct', 2, { stat: 'armor' })),
        t('iron_will', 1, 5, 'Iron Will', 'battle_shout', 'Stamina increased by {v}%.', f('pct', 2, { stat: 'sta' })),
        t('imp_taunt', 2, 2, 'Improved Taunt', 'taunt', 'Taunt cooldown reduced by {v} sec.', f('abilCd', 1, { ab: ['taunt'] })),
        t('defiance', 2, 3, 'Defiance', 'taunt', 'You generate {v}% more threat.', f('threat', 5)),
        t('shield_wall', 3, 1, 'Last Stand', 'retaliation', 'You take {v}% less damage.', f('taken', 8)),
      ] },
    ],
    mage: [
      { id: 'arcane', name: 'Arcane', icon: 'arcane_missiles', talents: [
        t('arcane_focus', 1, 5, 'Arcane Focus', 'arcane_missiles', 'Your Arcane damage is increased by {v}%.', f('school', 2, { school: 'arcane' })),
        t('arcane_mind', 1, 5, 'Arcane Mind', 'mana_shield', 'Maximum mana increased by {v}%.', f('pct', 2, { stat: 'mana' })),
        t('imp_arcane_missiles', 2, 3, 'Improved Arcane Missiles', 'arcane_missiles', 'Arcane Missiles costs {v}% less mana.', f('abilCost', 10, { ab: ['arcane_missiles'] })),
        t('arcane_instability', 2, 3, 'Arcane Instability', 'arcane_explosion', '+{v}% spell critical strike chance.', f('spellCrit', 1)),
        t('arcane_power', 3, 1, 'Arcane Power', 'arcane_explosion', 'Your Arcane damage is increased by {v}% and +2% spell critical strike chance.', f('school', 8, { school: 'arcane' }), f('spellCrit', 2)),
      ] },
      { id: 'fire', name: 'Fire', icon: 'fireball', talents: [
        t('imp_fireball', 1, 5, 'Improved Fireball', 'fireball', 'Fireball casts {v} sec faster.', f('abilCast', 0.1, { ab: ['fireball'] })),
        t('fire_power', 1, 5, 'Fire Power', 'fire_blast', 'Your Fire damage is increased by {v}%.', f('school', 2, { school: 'fire' })),
        t('imp_fire_blast', 2, 3, 'Improved Fire Blast', 'fire_blast', 'Fire Blast cooldown reduced by {v} sec.', f('abilCd', 0.5, { ab: ['fire_blast'] })),
        t('incinerate', 2, 2, 'Incinerate', 'flamestrike', '+{v}% spell critical strike chance.', f('spellCrit', 2)),
        t('combustion', 3, 1, 'Combustion', 'flamestrike', 'Your Fire damage is increased by {v}% and +2% spell critical strike chance.', f('school', 6, { school: 'fire' }), f('spellCrit', 2)),
      ] },
      { id: 'frost', name: 'Frost', icon: 'frostbolt', talents: [
        t('imp_frostbolt', 1, 5, 'Improved Frostbolt', 'frostbolt', 'Frostbolt casts {v} sec faster.', f('abilCast', 0.1, { ab: ['frostbolt'] })),
        t('piercing_ice', 1, 5, 'Piercing Ice', 'frostbolt', 'Your Frost damage is increased by {v}%.', f('school', 2, { school: 'frost' })),
        t('imp_frost_nova', 2, 2, 'Improved Frost Nova', 'frost_nova', 'Frost Nova cooldown reduced by {v} sec.', f('abilCd', 2, { ab: ['frost_nova'] })),
        t('frost_warding', 2, 2, 'Frost Warding', 'frost_armor', 'Frost Armor gives {v}% more armor.', f('buff', 15, { ab: ['frost_armor'] })),
        t('biting_cold', 2, 3, 'Biting Cold', 'frostbolt', '+{v}% spell critical strike chance.', f('spellCrit', 1)), // #191
        t('ice_barrier', 3, 1, 'Ice Barrier', 'frost_nova', 'You take {v}% less damage and your Frost damage is increased by 5%.', f('taken', 5), f('school', 5, { school: 'frost' })),
      ] },
    ],
    priest: [
      { id: 'discipline', name: 'Discipline', icon: 'pw_shield', talents: [
        t('imp_fortitude', 1, 5, 'Improved Word of Fortitude', 'pw_fortitude', 'Word of Fortitude gives {v}% more Stamina.', f('buff', 6, { ab: ['pw_fortitude'] })),
        t('mental_agility', 1, 5, 'Mental Agility', 'inner_fire', 'Your spells cost {v}% less mana.', f('abilCost', 2, { ab: ['*'] })),
        t('imp_pw_shield', 2, 3, 'Improved Word of Warding', 'pw_shield', 'Word of Warding absorbs {v}% more.', f('shield', 5, { ab: ['pw_shield'] })),
        t('imp_inner_fire', 2, 3, 'Improved Inner Fire', 'inner_fire', 'Inner Fire gives {v}% more.', f('buff', 10, { ab: ['inner_fire'] })),
        t('power_infusion', 3, 1, 'Surge of Power', 'heal', 'Healing done increased by {v}% and Holy damage by 5%.', f('heal', 5), f('school', 5, { school: 'holy' })),
      ] },
      { id: 'holy', name: 'Holy', icon: 'heal', talents: [
        t('holy_spec', 1, 5, 'Holy Specialization', 'smite', '+{v}% spell critical strike chance.', f('spellCrit', 1)),
        t('imp_renew', 1, 3, 'Improved Renew', 'renew', 'Renew heals {v}% more.', f('hot', 5, { ab: ['renew'] })),
        t('divine_fury', 2, 5, 'Divine Fury', 'smite', 'Smite, Lesser Heal and Heal cast {v} sec faster.', f('abilCast', 0.1, { ab: ['smite', 'lesser_heal', 'heal'] })),
        t('spiritual_healing', 2, 5, 'Spiritual Healing', 'lesser_heal', 'Healing done increased by {v}%.', f('heal', 2)),
        t('inspiration', 3, 1, 'Inspiration', 'heal', 'Healing done increased by {v}% and you take 3% less damage.', f('heal', 5), f('taken', 3)),
      ] },
      { id: 'shadow', name: 'Shadow', icon: 'sw_pain', talents: [
        t('shadow_focus', 1, 5, 'Shadow Focus', 'sw_pain', 'Your Shadow damage is increased by {v}%.', f('school', 2, { school: 'shadow' })),
        t('imp_sw_pain', 1, 2, 'Improved Word of Pain', 'sw_pain', 'Word of Pain deals {v}% more damage.', f('dot', 15, { ab: ['sw_pain'] })),
        t('imp_mind_blast', 2, 5, 'Improved Mind Blast', 'mind_blast', 'Mind Blast cooldown reduced by {v} sec.', f('abilCd', 0.5, { ab: ['mind_blast'] })),
        t('darkness', 2, 3, 'Darkness', 'mind_blast', 'Your Shadow damage is increased by {v}%.', f('school', 2, { school: 'shadow' })),
        t('shadowform', 3, 1, 'Shadowform', 'psychic_scream', 'Your Shadow damage is increased by {v}% and you take 5% less damage.', f('school', 10, { school: 'shadow' }), f('taken', 5)),
      ] },
    ],
    rogue: [
      { id: 'assassination', name: 'Assassination', icon: 'eviscerate', talents: [
        t('malice', 1, 5, 'Malice', 'backstab', '+{v}% critical strike chance.', f('crit', 1)),
        t('imp_eviscerate', 1, 3, 'Improved Eviscerate', 'eviscerate', 'Eviscerate deals {v}% more damage.', f('abilDmg', 5, { ab: ['eviscerate'] })),
        t('murder', 2, 2, 'Murder', 'garrote', 'Your physical damage is increased by {v}%.', f('school', 2, { school: 'physical' })),
        t('lethality', 2, 3, 'Lethality', 'sinister_strike', 'Sinister Strike and Backstab deal {v}% more damage.', f('abilDmg', 5, { ab: ['sinister_strike', 'backstab'] })),
        t('quick_finish', 2, 3, 'Quick Finish', 'kidney_shot', 'Eviscerate and Rupture cost {v}% less energy.', f('abilCost', 5, { ab: ['eviscerate', 'rupture'] })), // #191: every class can spend its 51 points
        t('relentless_strikes', 3, 1, 'Relentless Strikes', 'rupture', 'Eviscerate and Rupture deal {v}% more damage.', f('abilDmg', 20, { ab: ['eviscerate', 'rupture'] }), f('dot', 20, { ab: ['rupture'] })),
      ] },
      { id: 'combat', name: 'Combat', icon: 'sinister_strike', talents: [
        t('imp_sinister_strike', 1, 2, 'Improved Sinister Strike', 'sinister_strike', 'Sinister Strike costs {v}% less energy.', f('abilCost', 5, { ab: ['sinister_strike'] })),
        t('lightning_reflexes', 1, 5, 'Lightning Reflexes', 'evasion', '+{v}% chance to dodge.', f('dodge', 1)),
        t('precise_strikes', 1, 2, 'Precise Strikes', 'sinister_strike', '+{v}% critical strike chance.', f('crit', 1)), // #191
        t('dual_wield_spec', 2, 5, 'Weapon Expertise', 'sinister_strike', 'Your physical damage is increased by {v}%.', f('school', 2, { school: 'physical' })),
        t('imp_gouge', 2, 3, 'Improved Gouge', 'gouge', 'Gouge cooldown reduced by {v} sec.', f('abilCd', 1, { ab: ['gouge'] })),
        t('blade_flurry', 3, 1, 'Blade Flurry', 'slice_and_dice', 'You attack {v}% faster.', f('haste', 10)),
      ] },
      { id: 'subtlety', name: 'Subtlety', icon: 'garrote', talents: [
        t('opportunity', 1, 5, 'Opportunity', 'backstab', 'Backstab and Garrote deal {v}% more damage.', f('abilDmg', 4, { ab: ['backstab', 'garrote'] }), f('dot', 4, { ab: ['garrote'] })),
        t('elusiveness', 1, 2, 'Elusiveness', 'evasion', 'Evasion cooldown reduced by {v} sec.', f('abilCd', 30, { ab: ['evasion'] })),
        t('serrated_blades', 2, 3, 'Serrated Blades', 'rupture', 'Rupture and Garrote deal {v}% more damage.', f('dot', 10, { ab: ['rupture', 'garrote'] })),
        t('initiative', 2, 3, 'Initiative', 'kidney_shot', '+{v}% critical strike chance.', f('crit', 1)),
        t('shadowed_step', 2, 2, 'Shadowed Step', 'evasion', 'You take {v}% less damage.', f('taken', 2)), // #191
        t('preparation', 3, 1, 'Preparation', 'garrote', 'Kidney Shot, Gouge and Evasion cooldowns reduced by {v} sec, and +2% critical strike chance.', f('abilCd', 5, { ab: ['kidney_shot', 'gouge', 'evasion'] }), f('crit', 2)),
      ] },
    ],
    paladin: [
      { id: 'holy', name: 'Holy', icon: 'holy_light', talents: [
        t('divine_intellect', 1, 5, 'Divine Intellect', 'holy_light', 'Intellect increased by {v}%.', f('pct', 2, { stat: 'int' })),
        t('healing_light', 1, 5, 'Healing Light', 'holy_light', 'Holy Light heals {v}% more.', f('abilHeal', 4, { ab: ['holy_light'] })),
        t('imp_lay_on_hands', 2, 2, 'Improved Lay on Hands', 'lay_on_hands', 'Lay on Hands cooldown reduced by {v} sec.', f('abilCd', 120, { ab: ['lay_on_hands'] })),
        t('illumination', 2, 5, 'Illumination', 'holy_light', 'Holy Light costs {v}% less mana.', f('abilCost', 3, { ab: ['holy_light'] })),
        t('divine_favor', 3, 1, 'Divine Favor', 'exorcism', '+{v}% spell critical strike chance and 5% more healing.', f('spellCrit', 5), f('heal', 5)),
      ] },
      { id: 'protection', name: 'Protection', icon: 'devotion_aura', talents: [
        t('imp_devotion', 1, 5, 'Improved Steadfast Aura', 'devotion_aura', 'Steadfast Aura gives {v}% more armor.', f('buff', 5, { ab: ['devotion_aura'] })),
        t('toughness', 1, 5, 'Toughness', 'divine_protection', 'Armor from items increased by {v}%.', f('pct', 2, { stat: 'armor' })),
        t('guardians_favor', 2, 2, "Guardian's Favor", 'hammer_justice', 'Hammer of Order and Divine Protection cooldowns reduced by {v} sec.', f('abilCd', 10, { ab: ['hammer_justice', 'divine_protection'] })),
        t('redoubt', 2, 3, 'Redoubt', 'devotion_aura', 'You take {v}% less damage.', f('taken', 2)),
        t('blessing_sanctuary', 3, 1, 'Blessing of Sanctuary', 'retribution_aura', 'You generate {v}% more threat and take 3% less damage.', f('threat', 20), f('taken', 3)),
      ] },
      { id: 'retribution', name: 'Retribution', icon: 'seal_righteousness', talents: [
        t('benediction', 1, 5, 'Benediction', 'judgement', 'Verdict and seals cost {v}% less mana.', f('abilCost', 3, { ab: ['judgement', 'seal_righteousness'] })),
        t('imp_judgement', 1, 2, 'Improved Verdict', 'judgement', 'Verdict cooldown reduced by {v} sec.', f('abilCd', 1, { ab: ['judgement'] })),
        t('imp_seal', 2, 5, 'Improved Oath of Righteousness', 'seal_righteousness', 'Oath of Righteousness deals {v}% more damage.', f('buff', 3, { ab: ['seal_righteousness'] })),
        t('conviction', 2, 5, 'Conviction', 'seal_righteousness', '+{v}% critical strike chance.', f('crit', 1)),
        t('vengeance', 3, 1, 'Vengeance', 'retribution_aura', 'Your Holy damage is increased by {v}% and physical damage by 4%.', f('school', 8, { school: 'holy' }), f('school', 4, { school: 'physical' })),
      ] },
    ],
    warlock: [
      { id: 'affliction', name: 'Affliction', icon: 'corruption', talents: [
        t('imp_corruption', 1, 5, 'Improved Corruption', 'corruption', 'Corruption casts {v} sec faster and deals 4% more damage per rank.', f('abilCast', 0.3, { ab: ['corruption'] }), f('dot', 4, { ab: ['corruption'] })),
        t('imp_curse_agony', 1, 3, 'Improved Curse of Agony', 'curse_of_agony', 'Curse of Agony deals {v}% more damage.', f('dot', 6, { ab: ['curse_of_agony'] })),
        t('shadow_mastery', 2, 5, 'Shadow Mastery', 'shadow_bolt', 'Your Shadow damage is increased by {v}%.', f('school', 3, { school: 'shadow' })),
        t('fel_concentration', 2, 3, 'Gloom Concentration', 'life_tap', 'Your spells cost {v}% less mana.', f('abilCost', 3, { ab: ['*'] })),
        t('amplify_curse', 3, 1, 'Amplify Curse', 'curse_of_agony', 'Corruption, Curse of Agony and Immolate deal {v}% more damage over time.', f('dot', 15, { ab: ['corruption', 'curse_of_agony', 'immolate'] })),
      ] },
      { id: 'demonology', name: 'Demonology', icon: 'summon_voidwalker', talents: [
        t('demonic_embrace', 1, 5, 'Demonic Embrace', 'demon_skin', 'Stamina increased by {v}%.', f('pct', 3, { stat: 'sta' })),
        t('imp_imp', 1, 3, 'Improved Imp', 'summon_imp', 'Your pet has {v}% more health and damage.', f('pet', 10)),
        t('fel_intellect', 2, 3, 'Gloom Intellect', 'summon_voidwalker', 'Maximum mana increased by {v}%.', f('pct', 3, { stat: 'mana' })),
        t('master_demonologist', 2, 3, 'Master Demonologist', 'summon_voidwalker', 'You take {v}% less damage.', f('taken', 2)),
        t('soul_link', 3, 1, 'Soul Link', 'demon_armor', 'You take {v}% less damage and your pet has 10% more health and damage.', f('taken', 5), f('pet', 10)),
      ] },
      { id: 'destruction', name: 'Destruction', icon: 'searing_pain', talents: [
        t('imp_shadow_bolt', 1, 5, 'Improved Shadow Bolt', 'shadow_bolt', 'Shadow Bolt casts {v} sec faster.', f('abilCast', 0.1, { ab: ['shadow_bolt'] })),
        t('cataclysm', 1, 5, 'Cataclysm', 'searing_pain', 'Shadow Bolt, Immolate and Searing Pain cost {v}% less mana.', f('abilCost', 2, { ab: ['shadow_bolt', 'immolate', 'searing_pain'] })),
        t('devastation', 2, 5, 'Devastation', 'rain_of_fire', '+{v}% spell critical strike chance.', f('spellCrit', 1)),
        t('imp_immolate', 2, 3, 'Improved Immolate', 'immolate', 'Immolate deals {v}% more damage.', f('abilDmg', 5, { ab: ['immolate'] })),
        t('ruin', 3, 1, 'Ruin', 'searing_pain', 'Your Fire and Shadow damage is increased by {v}%.', f('school', 6, { school: 'fire' }), f('school', 6, { school: 'shadow' })),
      ] },
    ],
    hunter: [
      { id: 'beast_mastery', name: 'Beast Mastery', icon: 'aspect_monkey', talents: [
        t('endurance_training', 1, 5, 'Endurance Training', 'aspect_monkey', 'Your pet has {v}% more health and damage.', f('pet', 3)),
        t('thick_hide', 1, 3, 'Thick Hide', 'aspect_monkey', 'Armor from items increased by {v}%.', f('pct', 3, { stat: 'armor' })),
        t('unleashed_fury', 2, 5, 'Unleashed Fury', 'hunters_mark', 'Your pet has {v}% more health and damage.', f('pet', 4)),
        t('ferocity', 2, 5, 'Ferocity', 'raptor_strike', '+{v}% critical strike chance.', f('crit', 1)),
        t('bestial_wrath', 3, 1, 'Bestial Wrath', 'rapid_fire', 'Your pet has {v}% more health and damage.', f('pet', 15)),
      ] },
      { id: 'marksmanship', name: 'Marksmanship', icon: 'arcane_shot', talents: [
        t('lethal_shots', 1, 5, 'Lethal Shots', 'arcane_shot', '+{v}% critical strike chance and 1% more physical damage per rank.', f('crit', 1), f('school', 1, { school: 'physical' })),
        t('efficiency', 1, 5, 'Efficiency', 'arcane_shot', 'Your abilities cost {v}% less mana.', f('abilCost', 2, { ab: ['*'] })),
        t('ranged_weapon_spec', 2, 5, 'Ranged Weapon Specialization', 'arcane_shot', 'Your physical damage is increased by {v}%.', f('school', 2, { school: 'physical' })),
        t('mortal_shots', 2, 5, 'Mortal Shots', 'multi_shot', 'Arcane Shot and Multi-Shot deal {v}% more damage.', f('abilDmg', 3, { ab: ['arcane_shot', 'multi_shot'] })),
        t('trueshot', 3, 1, 'Keen Eye Aura', 'rapid_fire', 'Your physical and Arcane damage is increased by {v}%.', f('school', 5, { school: 'physical' }), f('school', 5, { school: 'arcane' })),
      ] },
      { id: 'survival', name: 'Survival', icon: 'wing_clip', talents: [
        t('savage_strikes', 1, 3, 'Savage Strikes', 'raptor_strike', 'Savage Strike and Wing Clip deal {v}% more damage.', f('abilDmg', 7, { ab: ['raptor_strike', 'wing_clip'] })),
        t('deflection', 1, 5, 'Deflection', 'wing_clip', '+{v}% chance to dodge.', f('dodge', 1)),
        t('clever_traps', 2, 2, 'Clever Traps', 'immolation_trap', 'Immolation Trap deals {v}% more damage.', f('dot', 15, { ab: ['immolation_trap'] })),
        t('surefooted', 2, 3, 'Surefooted', 'aspect_monkey', 'Stamina increased by {v}%.', f('pct', 3, { stat: 'sta' })),
        t('deterrence', 3, 1, 'Deterrence', 'wing_clip', 'You take {v}% less damage.', f('taken', 8)),
      ] },
    ],
    druid: [
      { id: 'balance', name: 'Balance', icon: 'moonfire', talents: [
        t('imp_wrath', 1, 5, 'Improved Wrath', 'wrath', 'Wrath casts {v} sec faster.', f('abilCast', 0.06, { ab: ['wrath'] })),
        t('moonfury', 1, 5, 'Moonfury', 'moonfire', 'Your Arcane and Nature damage is increased by {v}%.', f('school', 2, { school: 'arcane' }), f('school', 2, { school: 'nature' })),
        t('imp_moonfire', 2, 5, 'Improved Moonbeam', 'moonfire', 'Moonbeam deals {v}% more damage.', f('abilDmg', 2, { ab: ['moonfire'] }), f('dot', 2, { ab: ['moonfire'] })),
        t('imp_entangling', 2, 3, "Nature's Grasp", 'entangling_roots', 'Entangling Roots casts {v} sec faster.', f('abilCast', 0.3, { ab: ['entangling_roots'] })),
        t('moonkin', 3, 1, 'Moonkin Form', 'wrath', '+{v}% spell critical strike chance and you take 4% less damage.', f('spellCrit', 3), f('taken', 4)),
      ] },
      { id: 'feral', name: 'Feral', icon: 'bear_form', talents: [
        t('ferocity', 1, 5, 'Ferocity', 'maul', 'Maul and Swipe cost {v}% less rage.', f('abilCost', 5, { ab: ['maul', 'swipe'] })),
        t('thick_hide', 1, 5, 'Thick Hide', 'bear_form', 'Armor from items increased by {v}%.', f('pct', 2, { stat: 'armor' })),
        t('feral_instinct', 2, 5, 'Feral Instinct', 'growl', 'You generate {v}% more threat.', f('threat', 3)),
        t('sharpened_claws', 2, 3, 'Sharpened Claws', 'maul', '+{v}% critical strike chance.', f('crit', 2)),
        t('heart_wild', 3, 1, 'Heart of the Wild', 'swipe', 'Stamina increased by {v}% and physical damage by 3%.', f('pct', 5, { stat: 'sta' }), f('school', 3, { school: 'physical' })),
      ] },
      { id: 'restoration', name: 'Restoration', icon: 'rejuvenation', talents: [
        t('imp_healing_touch', 1, 5, 'Improved Healing Touch', 'healing_touch', 'Healing Touch casts {v} sec faster.', f('abilCast', 0.1, { ab: ['healing_touch'] })),
        t('intensity', 1, 5, 'Intensity', 'mark_wild', 'Intellect increased by {v}%.', f('pct', 2, { stat: 'int' })),
        t('imp_rejuvenation', 2, 3, 'Improved Rejuvenation', 'rejuvenation', 'Rejuvenation heals {v}% more.', f('hot', 5, { ab: ['rejuvenation'] })),
        t('gift_of_nature', 2, 5, 'Gift of Nature', 'regrowth', 'Healing done increased by {v}%.', f('heal', 2)),
        t('natures_swiftness', 3, 1, "Nature's Swiftness", 'regrowth', 'Healing done increased by {v}% and your spells cost 5% less mana.', f('heal', 5), f('abilCost', 5, { ab: ['*'] })),
      ] },
    ],
    shaman: [
      { id: 'elemental', name: 'Elemental', icon: 'lightning_bolt', talents: [
        t('convection', 1, 5, 'Convection', 'lightning_bolt', 'Lightning Bolt and shocks cost {v}% less mana.', f('abilCost', 2, { ab: ['lightning_bolt', 'earth_shock', 'flame_shock', 'frost_shock'] })),
        t('concussion', 1, 5, 'Concussion', 'earth_shock', 'Lightning Bolt and shocks deal {v}% more damage.', f('abilDmg', 1, { ab: ['lightning_bolt', 'earth_shock', 'flame_shock', 'frost_shock'] })),
        t('call_of_thunder', 2, 5, 'Call of Thunder', 'lightning_bolt', '+{v}% spell critical strike chance.', f('spellCrit', 1)),
        t('imp_fire_totems', 2, 2, 'Improved Fire Totems', 'searing_totem', 'Searing Totem deals {v}% more damage.', f('dot', 10, { ab: ['searing_totem'] })),
        t('elemental_fury', 3, 1, 'Elemental Fury', 'flame_shock', 'Your Nature, Fire and Frost damage is increased by {v}%.', f('school', 5, { school: 'nature' }), f('school', 5, { school: 'fire' }), f('school', 5, { school: 'frost' })),
      ] },
      { id: 'enhancement', name: 'Enhancement', icon: 'rockbiter_weapon', talents: [
        t('ancestral_knowledge', 1, 5, 'Ancestral Knowledge', 'rockbiter_weapon', 'Maximum mana increased by {v}%.', f('pct', 2, { stat: 'mana' })),
        t('shield_spec', 1, 5, 'Shield Specialization', 'lightning_shield', '+{v}% chance to dodge.', f('dodge', 1)),
        t('thundering_strikes', 2, 5, 'Thundering Strikes', 'rockbiter_weapon', '+{v}% critical strike chance.', f('crit', 1)),
        t('imp_lightning_shield', 2, 3, 'Improved Lightning Shield', 'lightning_shield', 'Lightning Shield deals {v}% more damage.', f('buff', 8, { ab: ['lightning_shield'] })),
        t('flurry', 3, 1, 'Flurry', 'strength_earth', 'You attack {v}% faster.', f('haste', 8)),
      ] },
      { id: 'restoration', name: 'Restoration', icon: 'healing_wave', talents: [
        t('tidal_focus', 1, 5, 'Tidal Focus', 'healing_wave', 'Healing Wave costs {v}% less mana.', f('abilCost', 2, { ab: ['healing_wave'] })),
        t('imp_healing_wave', 1, 5, 'Improved Healing Wave', 'healing_wave', 'Healing Wave casts {v} sec faster.', f('abilCast', 0.1, { ab: ['healing_wave'] })),
        t('totemic_focus', 2, 5, 'Totemic Focus', 'stoneskin_totem', 'Totems cost {v}% less mana.', f('abilCost', 5, { ab: ['stoneskin_totem', 'searing_totem', 'strength_earth'] })),
        t('purification', 2, 5, 'Purification', 'healing_wave', 'Healing done increased by {v}%.', f('heal', 2)),
        t('healing_way', 3, 1, 'Healing Way', 'strength_earth', 'Healing Wave heals {v}% more and +2% spell critical strike chance.', f('abilHeal', 8, { ab: ['healing_wave'] }), f('spellCrit', 2)),
      ] },
    ],
  };
  // bots put points where their role wants them: [main tree, second tree]
  D.TALENT_BOT = {
    tank: { warrior: ['protection', 'arms'], paladin: ['protection', 'holy'], druid: ['feral', 'restoration'] },
    healer: { priest: ['holy', 'discipline'], paladin: ['holy', 'protection'], druid: ['restoration', 'balance'], shaman: ['restoration', 'elemental'] },
    dps: { warrior: ['fury', 'arms'], mage: ['fire', 'frost', 'arcane'], priest: ['shadow', 'discipline'], rogue: ['combat', 'assassination', 'subtlety'], paladin: ['retribution', 'holy'], warlock: ['affliction', 'destruction', 'demonology'], hunter: ['marksmanship', 'beast_mastery', 'survival'], druid: ['balance', 'feral'], shaman: ['enhancement', 'elemental'] },
  };
})(typeof window !== 'undefined' ? window : globalThis);
