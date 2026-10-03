// Shared game data: classes, races, abilities, gear rules and the items every zone uses.
// Zone content lives in src/data/zones/<zone>.js; load order is in src/data/files.json.
(function (root) {
  const D = {};
  root.D = D;

  D.REALM = 'Starlight';
  D.LEVEL_CAP = 60;
  D.XP_TO_LEVEL = [0, 400, 900, 1400, 2100, 2800, 3600, 4500, 5400, 6500, 8000, 9600, 11200, 12900, 14600, 16400, 17000, 18000, 19000, 20000, 21400, 21800, 22400, 23000, 23600, 24400, 25000, 25600, 26200, 26800, 27600, 28400, 29200, 30000, 30800, 31600, 32400, 33200, 34000, 34800, 35600, 36400, 37200, 38000, 38800, 39600, 40600, 41600, 42600, 43600, 44600, 45800, 47000, 48200, 49400, 50600, 52000, 53400, 54800, 56200, 57600];

  D.QUALITY = [{ name: 'Poor', color: '#9d9d9d' }, { name: 'Common', color: '#ffffff' }, { name: 'Uncommon', color: '#1eff00' }, { name: 'Rare', color: '#0070dd' }, { name: 'Epic', color: '#a335ee' }, { name: 'Heirloom', color: '#e6cc80' }];

  D.CHANNELS = {
    say: { label: 'Say', color: '#ffffff' },
    yell: { label: 'Yell', color: '#ff4040' },
    general: { label: '1. General', color: '#ffc0c0' },
    defense: { label: '2. LocalDefense', color: '#ffc0c0' },
    lfg: { label: '4. LookingForGroup', color: '#ffc0c0' },
    whisper: { label: 'Whisper', color: '#ff80ff' },
    party: { label: 'Party', color: '#aaaaff' },
    guild: { label: 'Guild', color: '#40ff40' },
    system: { label: '', color: '#ffff00' },
    loot: { label: '', color: '#00aa00' },
    monster: { label: '', color: '#fffc9e' },
    combat: { label: '', color: '#d8d0c0' },
  };

  // ---- classes, races, pets
  D.CLASSES = {
    warrior: { name: 'Warrior', color: '#C79C6E', role: 'tank', resource: 'rage', armorType: 'mail', weapons: ['sword', 'axe', 'mace'], base: { str: 23, agi: 20, sta: 22, int: 20, spi: 21 }, gain: { str: 2, agi: 1.2, sta: 2, int: 0.3, spi: 0.6 }, baseHp: -140, hpPerLvl: 12, baseMana: 0, manaPerLvl: 0, baseArmor: 60, startWeapon: 'worn_shortsword', startChest: 'recruits_vest', abilities: ['heroic_strike', 'battle_shout', 'charge', 'rend', 'thunder_clap', 'taunt', 'hamstring', 'cleave', 'bloodrage', 'retaliation', 'shield_block', 'intimidating_shout', 'overpower', 'whirlwind', 'shield_wall', 'slam', 'mortal_strike', 'berserker_rage', 'intercept', 'recklessness', 'shield_slam', 'last_stand', 'bladestorm', 'rallying_cry'] },
    mage: { name: 'Mage', color: '#69CCF0', role: 'dps', resource: 'mana', armorType: 'cloth', weapons: ['staff', 'dagger'], base: { str: 20, agi: 20, sta: 20, int: 24, spi: 23 }, gain: { str: 0.3, agi: 0.3, sta: 1, int: 2, spi: 1.8 }, baseHp: -150, hpPerLvl: 9, baseMana: -250, manaPerLvl: 18, baseArmor: 10, startWeapon: 'bent_staff', startChest: 'apprentice_robe', abilities: ['fireball', 'frost_armor', 'frostbolt', 'fire_blast', 'arcane_missiles', 'frost_nova', 'arcane_explosion', 'flamestrike', 'mana_shield', 'cone_of_cold', 'scorch', 'blizzard', 'blast_wave', 'ice_block', 'pyroblast', 'arcane_power', 'fire_ward', 'ice_barrier', 'combustion', 'arcane_brilliance', 'dragons_breath', 'arcane_blast', 'mirror_image'] },
    priest: { name: 'Priest', color: '#FFFFFF', role: 'healer', resource: 'mana', armorType: 'cloth', weapons: ['mace', 'staff'], base: { str: 20, agi: 20, sta: 20, int: 22, spi: 25 }, gain: { str: 0.3, agi: 0.3, sta: 1, int: 1.8, spi: 2 }, baseHp: -150, hpPerLvl: 9, baseMana: -220, manaPerLvl: 18, baseArmor: 10, startWeapon: 'battered_mallet', startChest: 'neophyte_robe', abilities: ['smite', 'lesser_heal', 'pw_fortitude', 'sw_pain', 'pw_shield', 'renew', 'mind_blast', 'inner_fire', 'heal', 'psychic_scream', 'holy_fire', 'fade', 'mind_flay', 'flash_heal', 'holy_nova', 'greater_heal', 'shadowform', 'desperate_prayer', 'power_infusion', 'prayer_of_fortitude', 'vampiric_embrace', 'pain_suppression', 'penance', 'divine_hymn'] },
    rogue: { name: 'Rogue', color: '#FFF569', role: 'dps', resource: 'energy', armorType: 'leather', weapons: ['dagger', 'sword'], base: { str: 21, agi: 23, sta: 21, int: 20, spi: 20 }, gain: { str: 1, agi: 2, sta: 1.9, int: 0.3, spi: 0.5 }, baseHp: -145, hpPerLvl: 11, baseMana: 0, manaPerLvl: 0, baseArmor: 30, startWeapon: 'worn_dagger', startChest: 'footpad_shirt', abilities: ['sinister_strike', 'eviscerate', 'gouge', 'sprint', 'evasion', 'slice_and_dice', 'backstab', 'garrote', 'rupture', 'kidney_shot', 'ambush', 'blade_flurry', 'cheap_shot', 'feint', 'blind', 'vanish', 'adrenaline_rush', 'ghostly_strike', 'cold_blood', 'hemorrhage', 'fan_of_knives', 'cloak_of_shadows', 'killing_spree', 'shadow_dance'] },
    paladin: { name: 'Paladin', color: '#F58CBA', role: 'healer', roles: ['healer', 'tank'], resource: 'mana', armorType: 'mail', weapons: ['mace', 'sword', 'axe'], base: { str: 22, agi: 20, sta: 22, int: 20, spi: 21 }, gain: { str: 1.8, agi: 0.8, sta: 1.8, int: 1, spi: 1 }, baseHp: -140, hpPerLvl: 11, baseMana: -220, manaPerLvl: 14, baseArmor: 60, startWeapon: 'battered_mallet', startChest: 'recruits_vest', abilities: ['seal_righteousness', 'holy_light', 'devotion_aura', 'judgement', 'divine_protection', 'hammer_justice', 'blessing_might', 'lay_on_hands', 'exorcism', 'retribution_aura', 'consecration', 'blessing_wisdom', 'hammer_of_wrath', 'holy_wrath', 'holy_shock', 'seal_command', 'blessing_kings', 'avenging_wrath', 'repentance', 'crusader_strike', 'holy_shield', 'hammer_righteous', 'divine_storm', 'aura_mastery'] },
    warlock: { name: 'Warlock', color: '#9482C9', role: 'dps', resource: 'mana', armorType: 'cloth', weapons: ['staff', 'dagger', 'sword'], base: { str: 20, agi: 20, sta: 21, int: 23, spi: 23 }, gain: { str: 0.3, agi: 0.3, sta: 1.2, int: 1.9, spi: 1.8 }, baseHp: -150, hpPerLvl: 9, baseMana: -250, manaPerLvl: 17, baseArmor: 10, startWeapon: 'worn_dagger', startChest: 'apprentice_robe', pets: ['imp', 'voidwalker'], abilities: ['shadow_bolt', 'immolate', 'demon_skin', 'corruption', 'life_tap', 'curse_of_agony', 'searing_pain', 'shadow_ward', 'rain_of_fire', 'demon_armor', 'shadowburn', 'death_coil', 'howl_of_terror', 'soul_fire', 'siphon_life', 'conflagrate', 'curse_of_doom', 'hellfire', 'shadowfury', 'shadow_bolt_volley', 'incinerate', 'demonic_sacrifice', 'haunt', 'metamorphosis'] },
    hunter: { name: 'Hunter', color: '#ABD473', role: 'dps', resource: 'mana', armorType: 'leather', ranged: true, weapons: ['axe', 'sword', 'dagger'], base: { str: 21, agi: 23, sta: 21, int: 21, spi: 22 }, gain: { str: 0.9, agi: 2, sta: 1.4, int: 0.8, spi: 0.9 }, baseHp: -145, hpPerLvl: 11, baseMana: -230, manaPerLvl: 12, baseArmor: 30, startWeapon: 'worn_axe', startChest: 'footpad_shirt', startRanged: 'worn_shortbow', pets: ['beast'], abilities: ['raptor_strike', 'serpent_sting', 'aspect_monkey', 'arcane_shot', 'hunters_mark', 'concussive_shot', 'wing_clip', 'multi_shot', 'rapid_fire', 'immolation_trap', 'aspect_hawk', 'feign_death', 'volley', 'aimed_shot', 'scatter_shot', 'trueshot_aura', 'explosive_trap', 'deterrence', 'counterattack', 'wyvern_sting', 'kill_command', 'bestial_wrath', 'chimera_shot', 'rapid_killing'] },
    druid: { name: 'Druid', color: '#FF7D0A', role: 'healer', roles: ['healer', 'tank', 'dps'], resource: 'mana', armorType: 'leather', weapons: ['staff', 'mace', 'dagger'], base: { str: 21, agi: 20, sta: 20, int: 22, spi: 24 }, gain: { str: 1, agi: 0.7, sta: 1.2, int: 1.6, spi: 1.8 }, baseHp: -150, hpPerLvl: 10, baseMana: -230, manaPerLvl: 16, baseArmor: 20, startWeapon: 'bent_staff', startChest: 'neophyte_robe', abilities: ['wrath', 'healing_touch', 'mark_wild', 'moonfire', 'rejuvenation', 'bear_form', 'entangling_roots', 'thorns', 'regrowth', 'starfire', 'insect_swarm', 'hurricane', 'barkskin', 'bash', 'innervate', 'swiftmend', 'frenzied_regeneration', 'feral_charge', 'gift_of_the_wild', 'starfall', 'wild_growth', 'typhoon', 'lifebloom'], forms: { bear: ['bear_form', 'maul', 'growl', 'swipe'] } },
    shaman: { name: 'Shaman', color: '#0070DE', role: 'dps', roles: ['dps', 'healer'], resource: 'mana', armorType: 'leather', weapons: ['mace', 'axe', 'staff', 'dagger'], base: { str: 22, agi: 20, sta: 22, int: 21, spi: 22 }, gain: { str: 1.4, agi: 0.8, sta: 1.5, int: 1.2, spi: 1.1 }, baseHp: -145, hpPerLvl: 11, baseMana: -230, manaPerLvl: 14, baseArmor: 30, startWeapon: 'battered_mallet', startChest: 'footpad_shirt', abilities: ['lightning_bolt', 'rockbiter_weapon', 'healing_wave', 'earth_shock', 'stoneskin_totem', 'lightning_shield', 'searing_totem', 'flame_shock', 'strength_earth', 'frost_shock', 'flametongue_weapon', 'lesser_healing_wave', 'fire_nova_totem', 'chain_lightning', 'windfury_weapon', 'magma_totem', 'chain_heal', 'stormstrike', 'mana_tide_totem', 'earth_shield', 'elemental_mastery', 'earthquake', 'fire_elemental_totem', 'thunderstorm', 'bloodlust'] },
  };

  D.RACIALS = {
    human: { active: 'every_man', passives: { spiPct: 5, questMoneyPct: 10 }, text: ['+5% Spirit', 'Diplomacy: +10% gold from quests'] },
    dwarf: { active: 'stoneform', passives: { resist: { frost: 10 }, lootMoneyPct: 10 }, text: ['Frost damage taken −10%', 'Find Treasure: +10% gold from loot'] },
    gnome: { active: 'escape_artist', passives: { intPct: 5, resist: { arcane: 10 } }, text: ['+5% Intellect', 'Arcane damage taken −10%'] },
    nightelf: { active: 'shadowmeld', passives: { dodge: 1, resist: { nature: 10 } }, text: ['+1% dodge', 'Nature damage taken −10%'] },
    orc: { active: 'blood_fury', passives: { stunPct: 25, petDmgPct: 5 }, text: ['Hardiness: stuns 25% shorter', 'Command: pets deal +5% damage'] },
    troll: { active: 'berserking', passives: { regen: true, beastPct: 5 }, text: ['Regeneration: faster health regen, even in combat', 'Beast Slaying: +5% damage to beasts'] },
    tauren: { active: 'war_stomp', passives: { hpPct: 5, resist: { nature: 10 } }, text: ['Endurance: +5% health', 'Nature damage taken −10%'] },
    undead: { active: 'will_forsaken', passives: { resist: { shadow: 10 }, cannibalize: true }, text: ['Shadow damage taken −10%', 'Cannibalize: heal 15% after killing a humanoid or undead'] },
  };

  D.FACTIONS = { alliance: { name: 'Accord', color: '#3f7fff' }, horde: { name: 'Krugar', color: '#d23a2a' } };

  D.RACES = {
    human: { name: 'Human', faction: 'alliance', classes: ['warrior', 'paladin', 'hunter', 'rogue', 'priest', 'shaman', 'mage', 'warlock', 'druid'], start: 'northshire_abbey', startZone: 'Halden Vale' },
    dwarf: { name: 'Dwarf', faction: 'alliance', classes: ['warrior', 'paladin', 'hunter', 'rogue', 'priest', 'shaman', 'mage', 'warlock', 'druid'], start: 'anvilmar', startZone: 'Rimefold Valley' },
    gnome: { name: 'Gnome', faction: 'alliance', classes: ['warrior', 'paladin', 'hunter', 'rogue', 'priest', 'shaman', 'mage', 'warlock', 'druid'], start: 'anvilmar', startZone: 'Rimefold Valley' },
    nightelf: { name: 'Wood Elf', faction: 'alliance', classes: ['warrior', 'paladin', 'hunter', 'rogue', 'priest', 'shaman', 'mage', 'warlock', 'druid'], start: 'shadowglen', startZone: 'Dewfern Glade' },
    orc: { name: 'Orc', faction: 'horde', classes: ['warrior', 'paladin', 'hunter', 'rogue', 'priest', 'shaman', 'mage', 'warlock', 'druid'], start: 'valley_of_trials', startZone: 'The Blooding Grounds' },
    troll: { name: 'Troll', faction: 'horde', classes: ['warrior', 'paladin', 'hunter', 'rogue', 'priest', 'shaman', 'mage', 'warlock', 'druid'], start: 'valley_of_trials', startZone: 'The Blooding Grounds' },
    tauren: { name: 'Hornfolk', faction: 'horde', classes: ['warrior', 'paladin', 'hunter', 'rogue', 'priest', 'shaman', 'mage', 'warlock', 'druid'], start: 'camp_narache', startZone: 'Calf Hill Camp' },
    undead: { name: 'Undead', faction: 'horde', classes: ['warrior', 'paladin', 'hunter', 'rogue', 'priest', 'shaman', 'mage', 'warlock', 'druid'], start: 'deathknell', startZone: 'Last Bell' },
  };

  D.PETS = {
    imp: { name: 'Imp', lvl: 1, hpMult: 0.55, armorMult: 0.6, noMelee: true, cost: 0.25, threatMult: 0.35, spell: { name: 'Firebolt', icon: 'firebolt', every: 2.2, dmg: [5, 8], perLvl: 1.7, school: 'fire' }, names: ['Zillnoz', 'Jubnar', 'Rakzik', 'Grubnik', 'Flikkit', 'Yazzik', 'Kizzle', 'Nozzrik'] },
    voidwalker: { name: 'Voidwalker', lvl: 10, hpMult: 1.5, armorMult: 3, dmgMult: 0.55, threatMult: 3, cost: 0.4, torment: { every: 5 }, names: ['Sarkoth', 'Jaznar', 'Galvuul', 'Morthul', 'Vazgul', 'Ozrath'] },
    beast: { name: 'Beast', lvl: 10, hpMult: 1.1, armorMult: 1.6, dmgMult: 0.7, threatMult: 1.3, cost: 0.3, torment: { every: 6 }, tamed: true },
  };

  // ---- abilities
  D.ABILITIES = {
    // shared
    attack: { name: 'Attack', icon: 'attack', desc: 'Toggle auto-attack.', auto: true },
    eat: { name: 'Eat', icon: 'bread', desc: 'Eat food out of combat.', consumable: 'food' },
    drink: { name: 'Drink', icon: 'water', desc: 'Drink water out of combat.', consumable: 'drink' },
    potion: { name: 'Potion', icon: 'potion_red', desc: 'Drink your best potion. Works in combat.', consumable: 'potion' },
    // warrior
    heroic_strike: { name: 'Heroic Strike', cls: 'warrior', lvl: 1, cost: 15, cd: 0, target: 'enemy', dmg: { weapon: true, bonus: [11, 11], perLvl: 1.6 }, threat: 1.5, desc: 'A strong attack that adds {b} damage to a weapon hit.' },
    battle_shout: { name: 'Battle Shout', cls: 'warrior', lvl: 1, cost: 10, cd: 0, target: 'party', buff: { id: 'battle_shout', dur: 120, stats: { ap: 20 }, perLvl: { ap: 2 } }, threat: 5, desc: 'Raises the attack power of your party by {ap}.' },
    charge: { dash: true, range: 25, name: 'Charge', cls: 'warrior', lvl: 4, cost: 0, cd: 15, target: 'enemy', opener: true, gcd: false, rage: 12, stun: 1, desc: 'Charge an enemy you are not fighting yet. Generates 12 rage and stuns for 1 sec.' },
    rend: { name: 'Rend', cls: 'warrior', lvl: 4, cost: 10, cd: 0, target: 'enemy', dot: { id: 'rend', ticks: 3, every: 3, dmg: 5, perLvl: 1.1, school: 'physical' }, desc: 'Wounds the target for {d} damage over 9 sec.' },
    thunder_clap: { name: 'Thunder Clap', cls: 'warrior', lvl: 6, cost: 20, cd: 6, target: 'aoe', dmg: { base: [10, 10], perLvl: 1.2, school: 'physical' }, slow: { pct: 10, dur: 10 }, threat: 2.5, desc: 'Hits all nearby enemies for {b} and slows their attacks.' },
    taunt: { name: 'Taunt', cls: 'warrior', lvl: 10, cost: 0, cd: 10, target: 'enemy', gcd: false, taunt: true, desc: 'Forces the enemy to attack you and matches the highest threat on it.' },
    hamstring: { name: 'Hamstring', cls: 'warrior', lvl: 12, cost: 10, cd: 0, target: 'enemy', dmg: { base: [5, 5], perLvl: 0.6, school: 'physical' }, slow: { pct: 50, dur: 15 }, desc: 'Maims the enemy for {b} damage and slows its attacks by 50% for 15 sec.' },
    cleave: { name: 'Cleave', cls: 'warrior', lvl: 14, cost: 20, cd: 6, target: 'aoe', dmg: { base: [12, 12], perLvl: 1.5, school: 'physical' }, threat: 1.2, desc: 'A sweeping strike that hits every enemy in front of you for {b}.' },
    // paladin
    seal_righteousness: { name: 'Oath of Righteousness', cls: 'paladin', lvl: 1, cost: 20, costPerLvl: 3, cd: 0, target: 'self', combatOnly: true, buff: { id: 'seal', dur: 30, seal: { base: 3, perLvl: 1.1 } }, desc: 'Each melee hit deals extra Holy damage for 30 sec. Verdict releases it.' },
    holy_light: { name: 'Holy Light', cls: 'paladin', lvl: 1, cost: 35, costPerLvl: 5, cd: 0, cast: 2.5, target: 'ally', heal: { base: [42, 51], perLvl: 8, coef: 0.71 }, desc: 'Heals a friendly target for {h}.' },
    devotion_aura: { name: 'Steadfast Aura', cls: 'paladin', lvl: 1, cost: 0, cd: 0, target: 'party', buff: { id: 'devotion_aura', dur: 1800, stats: { armor: 35 }, perLvl: { armor: 8 } }, desc: 'Raises the armor of your party by {armor}.' },
    judgement: { name: 'Verdict', cls: 'paladin', lvl: 2, cost: 25, costPerLvl: 2, cd: 10, target: 'enemy', needSeal: true, dmg: { base: [15, 18], perLvl: 3.4, coef: 0.45, school: 'holy' }, threat: 1.5, desc: 'Unleashes your seal on the enemy for {b} Holy damage.' },
    divine_protection: { name: 'Divine Protection', cls: 'paladin', lvl: 6, cost: 15, costPerLvl: 2, cd: 300, target: 'self', gcd: false, combatOnly: true, buff: { id: 'divine_protection', dur: 6, immune: true }, desc: 'You are immune to all damage for 6 sec. 5 min cooldown.' },
    hammer_justice: { name: 'Hammer of Order', cls: 'paladin', lvl: 8, cost: 30, costPerLvl: 2, cd: 60, target: 'enemy', stun: 3, desc: 'Stuns the target for 3 sec.' },
    blessing_might: { name: 'Blessing of Might', cls: 'paladin', lvl: 12, cost: 30, costPerLvl: 2, cd: 0, target: 'party', buff: { id: 'blessing_might', dur: 300, stats: { ap: 20 }, perLvl: { ap: 3 } }, desc: 'Raises the attack power of your party by {ap} for 5 min.' },
    lay_on_hands: { name: 'Lay on Hands', cls: 'paladin', lvl: 14, cost: 0, cd: 600, target: 'ally', heal: { base: [400, 400], perLvl: 30 }, desc: 'Heals a friendly target for {h}. 10 min cooldown.' },
    // hunter
    raptor_strike: { name: 'Savage Strike', cls: 'hunter', lvl: 1, cost: 15, costPerLvl: 2, cd: 6, target: 'enemy', dmg: { weapon: true, bonus: [5, 5], perLvl: 1 }, desc: 'A strong melee attack that adds {b} damage.' },
    serpent_sting: { name: 'Venom Sting', cls: 'hunter', lvl: 4, cost: 15, costPerLvl: 2, cd: 0, target: 'enemy', dot: { id: 'serpent_sting', ticks: 5, every: 3, dmg: 4, perLvl: 1.2, school: 'nature' }, desc: 'Stings the target for {d} Nature damage over 15 sec.' },
    aspect_monkey: { name: 'Spirit of the Monkey', cls: 'hunter', lvl: 4, cost: 20, cd: 0, target: 'self', buff: { id: 'aspect_monkey', dur: 1800, stats: { dodge: 8 } }, desc: 'Raises your chance to dodge by 8%.' },
    arcane_shot: { name: 'Arcane Shot', cls: 'hunter', lvl: 2, cost: 25, costPerLvl: 3, cd: 6, target: 'enemy', dmg: { base: [13, 13], perLvl: 2.4, rapCoef: 0.15, school: 'arcane' }, desc: 'An instant shot for {b} Arcane damage.' },
    hunters_mark: { name: "Hunter's Mark", cls: 'hunter', lvl: 6, cost: 15, costPerLvl: 1, cd: 0, target: 'enemy', debuff: { id: 'hunters_mark', dur: 120 }, desc: 'Marks the target. You and your pet deal 10% more damage to it.' },
    concussive_shot: { name: 'Concussive Shot', cls: 'hunter', lvl: 8, cost: 15, costPerLvl: 2, cd: 12, target: 'enemy', slow: { pct: 50, dur: 4 }, desc: 'Dazes the target, slowing its attacks by 50% for 4 sec.' },
    wing_clip: { range: 5, name: 'Wing Clip', cls: 'hunter', lvl: 12, cost: 30, costPerLvl: 2, cd: 0, target: 'enemy', dmg: { base: [6, 6], perLvl: 0.8, school: 'physical' }, slow: { pct: 50, dur: 10 }, desc: 'Clips the enemy for {b} damage and slows its attacks by 50% for 10 sec.' },
    multi_shot: { name: 'Multi-Shot', cls: 'hunter', lvl: 14, cost: 60, costPerLvl: 4, cd: 10, target: 'aoe', dmg: { base: [14, 14], perLvl: 1.6, rapCoef: 0.2, school: 'physical' }, desc: 'Fires a volley at every nearby enemy for {b} damage.' },
    // rogue
    sinister_strike: { name: 'Sinister Strike', cls: 'rogue', lvl: 1, cost: 45, cd: 0, target: 'enemy', gcdLen: 1, dmg: { weapon: true, bonus: [3, 3], perLvl: 1.5 }, cp: 1, desc: 'An instant strike that deals weapon damage plus {b}. Awards 1 combo point.' },
    eviscerate: { name: 'Eviscerate', cls: 'rogue', lvl: 1, cost: 35, cd: 0, target: 'enemy', gcdLen: 1, finisher: true, dmg: { perCp: [8, 14], perLvl: 1.4, apCoef: 0.03, school: 'physical' }, desc: 'Finishing move. Damage rises with each combo point.' },
    gouge: { name: 'Gouge', cls: 'rogue', lvl: 3, cost: 45, cd: 10, target: 'enemy', gcdLen: 1, dmg: { base: [8, 8], perLvl: 0.7, school: 'physical' }, stun: 4, cp: 1, desc: 'Incapacitates the target for 4 sec. Awards 1 combo point.' },
    sprint: { name: 'Sprint', cls: 'rogue', lvl: 6, cost: 0, cd: 60, target: 'self', gcd: false, combatOnly: true, buff: { id: 'sprint', dur: 6, speed: 70 }, desc: 'Run 70% faster for 6 sec, to catch a fighter who keeps its distance. 1 min cooldown.' },
    evasion: { name: 'Evasion', cls: 'rogue', lvl: 8, cost: 0, cd: 120, target: 'self', gcd: false, buff: { id: 'evasion', dur: 15, stats: { dodge: 50 } }, desc: 'Dodge chance raised by 50% for 15 sec.' },
    slice_and_dice: { name: 'Slice and Dice', cls: 'rogue', lvl: 10, cost: 25, cd: 0, target: 'self', gcdLen: 1, finisher: true, buff: { id: 'slice_and_dice', dur: 9, perCpDur: 3, stats: { haste: 20 } }, desc: 'Finishing move. Attack speed +20%. Lasts longer per combo point.' },
    backstab: { name: 'Backstab', cls: 'rogue', lvl: 12, cost: 60, cd: 0, target: 'enemy', gcdLen: 1, dmg: { weapon: true, bonus: [15, 15], perLvl: 1.5 }, cp: 1, desc: 'A vicious stab for weapon damage plus {b}. Awards 1 combo point.' },
    garrote: { name: 'Garrote', cls: 'rogue', lvl: 14, cost: 50, cd: 0, target: 'enemy', opener: true, gcdLen: 1, dot: { id: 'garrote', ticks: 6, every: 3, dmg: 5, perLvl: 1.2, school: 'physical' }, cp: 1, desc: 'Opener. Garrotes an enemy you are not fighting yet for {d} damage over 18 sec. Awards 1 combo point.' },
    // priest
    smite: { name: 'Smite', cls: 'priest', lvl: 1, cost: 20, costPerLvl: 3, cd: 0, cast: 2, target: 'enemy', dmg: { base: [15, 20], perLvl: 2.8, coef: 0.71, school: 'holy' }, desc: 'Smite an enemy for {b} Holy damage.' },
    lesser_heal: { name: 'Lesser Heal', cls: 'priest', lvl: 1, cost: 30, costPerLvl: 4, cd: 0, cast: 2, target: 'ally', heal: { base: [46, 56], perLvl: 7, coef: 0.85 }, desc: 'Heal a friendly target for {h}.' },
    pw_fortitude: { name: 'Word of Fortitude', cls: 'priest', lvl: 1, cost: 60, cd: 0, target: 'party', buff: { id: 'pw_fortitude', dur: 1800, stats: { sta: 3 }, perLvl: { sta: 0.8 } }, desc: 'Power infuses your party, raising Stamina by {sta}.' },
    sw_pain: { name: 'Word of Pain', cls: 'priest', lvl: 2, cost: 25, costPerLvl: 3, cd: 0, target: 'enemy', dot: { id: 'sw_pain', ticks: 6, every: 3, dmg: 8, perLvl: 1.8, coef: 0.1, school: 'shadow' }, desc: 'A word of darkness that deals {d} Shadow damage over 18 sec.' },
    pw_shield: { name: 'Word of Warding', cls: 'priest', lvl: 6, cost: 45, costPerLvl: 4, cd: 4, target: 'ally', shield: { base: 44, perLvl: 6, coef: 0.1, dur: 30 }, weakened: 15, desc: 'Absorbs {s} damage for 30 sec. The target cannot be shielded again for 15 sec.' },
    renew: { name: 'Renew', cls: 'priest', lvl: 8, cost: 40, costPerLvl: 4, cd: 0, target: 'ally', hot: { id: 'renew', ticks: 5, every: 3, heal: 9, perLvl: 1.6, coef: 0.2 }, desc: 'Heals the target for {hh} over 15 sec.' },
    mind_blast: { name: 'Mind Blast', cls: 'priest', lvl: 4, cost: 50, costPerLvl: 4, cd: 8, cast: 1.5, target: 'enemy', dmg: { base: [36, 40], perLvl: 3, coef: 0.43, school: 'shadow' }, threat: 1.5, desc: "Blasts the target's mind for {b} Shadow damage." },
    inner_fire: { name: 'Inner Fire', cls: 'priest', lvl: 14, cost: 60, costPerLvl: 2, cd: 0, target: 'self', buff: { id: 'inner_fire', dur: 600, stats: { armor: 150, ap: 10 }, perLvl: { armor: 10, ap: 1 } }, desc: 'Raises your armor by {armor} and your attack power for 10 min.' },
    // shaman
    lightning_bolt: { name: 'Lightning Bolt', cls: 'shaman', lvl: 1, cost: 15, costPerLvl: 3, cd: 0, cast: 2, target: 'enemy', dmg: { base: [13, 16], perLvl: 3, coef: 0.79, school: 'nature' }, desc: 'Casts a bolt of lightning for {b} Nature damage.' },
    rockbiter_weapon: { name: 'Earthen Weapon', cls: 'shaman', lvl: 1, cost: 20, costPerLvl: 2, cd: 0, target: 'self', buff: { id: 'rockbiter', dur: 300, seal: { base: 2, perLvl: 1, school: 'physical' } }, desc: 'Imbues your weapon with earth for 5 min: each hit deals extra damage.' },
    healing_wave: { name: 'Healing Wave', cls: 'shaman', lvl: 1, cost: 25, costPerLvl: 5, cd: 0, cast: 2.5, target: 'ally', heal: { base: [36, 47], perLvl: 8, coef: 0.86 }, desc: 'Heals a friendly target for {h}.' },
    earth_shock: { name: 'Earth Shock', cls: 'shaman', lvl: 2, cost: 25, costPerLvl: 3, cd: 6, target: 'enemy', dmg: { base: [19, 22], perLvl: 2.5, coef: 0.39, school: 'nature' }, threat: 2, desc: 'Instantly shocks the target for {b} Nature damage.' },
    stoneskin_totem: { name: 'Stoneskin Totem', cls: 'shaman', lvl: 4, cost: 25, costPerLvl: 2, cd: 0, target: 'party', buff: { id: 'stoneskin', dur: 120, stats: { armor: 25 }, perLvl: { armor: 6 } }, desc: "Drops a totem that raises your party's armor by {armor}." },
    lightning_shield: { name: 'Lightning Shield', cls: 'shaman', lvl: 8, cost: 30, costPerLvl: 2, cd: 0, target: 'self', buff: { id: 'lightning_shield', dur: 600, thorns: { base: 13, perLvl: 2.5, charges: 3 } }, desc: 'Three orbs of lightning strike enemies that hit you in melee.' },
    searing_totem: { name: 'Searing Totem', cls: 'shaman', lvl: 10, cost: 25, costPerLvl: 2, cd: 0, target: 'enemy', dot: { id: 'searing_totem', ticks: 12, every: 2.5, dmg: 5, perLvl: 1.2, coef: 0.08, school: 'fire' }, desc: 'Drops a totem that burns the enemy for {d} Fire damage over 30 sec.' },
    flame_shock: { name: 'Flame Shock', cls: 'shaman', lvl: 12, cost: 55, costPerLvl: 3, cd: 6, target: 'enemy', dmg: { base: [25, 25], perLvl: 1.8, coef: 0.15, school: 'fire' }, dot: { id: 'flame_shock', ticks: 4, every: 3, dmg: 6, perLvl: 1, coef: 0.1, school: 'fire' }, desc: 'Burns the enemy for {b} Fire damage and {d} more over 12 sec.' },
    strength_earth: { name: 'Strength of Earth Totem', cls: 'shaman', lvl: 14, cost: 30, costPerLvl: 2, cd: 0, target: 'party', buff: { id: 'strength_earth', dur: 120, stats: { str: 10 }, perLvl: { str: 0.8 } }, desc: "Drops a totem that raises your party's Strength by {str}." },
    // mage
    fireball: { name: 'Fireball', cls: 'mage', lvl: 1, cost: 30, costPerLvl: 4, cd: 0, cast: 2, target: 'enemy', dmg: { base: [14, 22], perLvl: 3.2, coef: 0.8, school: 'fire' }, dot: { id: 'fireball_burn', ticks: 2, every: 2, dmg: 2, perLvl: 0.3, school: 'fire' }, desc: 'Hurls a fiery ball for {b} Fire damage.' },
    frost_armor: { name: 'Frost Armor', cls: 'mage', lvl: 1, cost: 60, cd: 0, target: 'self', gcd: true, buff: { id: 'frost_armor', dur: 600, stats: { armor: 30 }, perLvl: { armor: 6 }, chillAttackers: true }, desc: 'Increases armor by {armor}. Melee attackers are slowed.' },
    frostbolt: { name: 'Frostbolt', cls: 'mage', lvl: 4, cost: 30, costPerLvl: 4, cd: 0, cast: 1.8, target: 'enemy', dmg: { base: [16, 20], perLvl: 2.6, coef: 0.8, school: 'frost' }, slow: { pct: 40, dur: 5 }, desc: 'Launches a bolt of frost for {b} Frost damage and slows the target.' },
    fire_blast: { name: 'Fire Blast', cls: 'mage', lvl: 2, cost: 40, costPerLvl: 3, cd: 8, target: 'enemy', dmg: { base: [24, 30], perLvl: 2.4, coef: 0.43, school: 'fire' }, desc: 'Blasts the enemy for {b} Fire damage. Instant.' },
    arcane_missiles: { name: 'Arcane Missiles', cls: 'mage', lvl: 8, cost: 85, costPerLvl: 5, cd: 0, cast: 3, channel: 3, target: 'enemy', dmg: { base: [12, 12], perLvl: 1.5, coef: 0.24, school: 'arcane' }, desc: 'Fires 3 missiles over 3 sec, {b} Arcane damage each.' },
    frost_nova: { root: 4, name: 'Frost Nova', cls: 'mage', lvl: 12, cost: 55, costPerLvl: 3, cd: 25, target: 'aoe', dmg: { base: [8, 10], perLvl: 1, coef: 0.1, school: 'frost' }, slow: { pct: 60, dur: 8 }, desc: 'Blasts nearby enemies for {b} Frost damage and slows them for 8 sec.' },
    arcane_explosion: { name: 'Arcane Explosion', cls: 'mage', lvl: 14, cost: 75, costPerLvl: 4, cd: 0, target: 'aoe', dmg: { base: [14, 16], perLvl: 1.6, coef: 0.14, school: 'arcane' }, desc: 'A wave of arcane energy hits all nearby enemies for {b} Arcane damage.' },
    // warlock
    shadow_bolt: { name: 'Shadow Bolt', cls: 'warlock', lvl: 1, cost: 25, costPerLvl: 4, cd: 0, cast: 2, target: 'enemy', dmg: { base: [13, 18], perLvl: 3.3, coef: 0.86, school: 'shadow' }, desc: 'Sends a bolt of shadow for {b} Shadow damage.' },
    immolate: { name: 'Immolate', cls: 'warlock', lvl: 1, cost: 25, costPerLvl: 4, cd: 0, cast: 1.5, target: 'enemy', dmg: { base: [10, 12], perLvl: 1.6, coef: 0.2, school: 'fire' }, dot: { id: 'immolate', ticks: 5, every: 3, dmg: 2, perLvl: 0.8, coef: 0.1, school: 'fire' }, desc: 'Burns the enemy for {b} Fire damage and {d} more over 15 sec.' },
    demon_skin: { name: 'Demon Skin', cls: 'warlock', lvl: 1, cost: 30, costPerLvl: 2, cd: 0, target: 'self', buff: { id: 'demon_skin', dur: 1800, stats: { armor: 30 }, perLvl: { armor: 5 } }, desc: 'Raises your armor by {armor}.' },
    corruption: { name: 'Corruption', cls: 'warlock', lvl: 2, cost: 25, costPerLvl: 3, cd: 0, cast: 1.5, target: 'enemy', dot: { id: 'corruption', ticks: 6, every: 3, dmg: 4, perLvl: 1.2, coef: 0.15, school: 'shadow' }, desc: 'Corrupts the target for {d} Shadow damage over 18 sec.' },
    life_tap: { name: 'Life Tap', cls: 'warlock', lvl: 6, cost: 0, cd: 0, target: 'self', lifetap: { base: 20, perLvl: 3 }, desc: 'Converts {lt} health into {lt} mana.' },
    curse_of_agony: { name: 'Curse of Agony', cls: 'warlock', lvl: 8, cost: 25, costPerLvl: 2, cd: 0, target: 'enemy', dot: { id: 'curse_of_agony', ticks: 8, every: 3, dmg: 3, perLvl: 0.9, coef: 0.1, school: 'shadow' }, desc: 'Curses the target with agony: {d} Shadow damage over 24 sec.' },
    searing_pain: { name: 'Searing Pain', cls: 'warlock', lvl: 12, cost: 30, costPerLvl: 3, cd: 0, cast: 1.5, target: 'enemy', dmg: { base: [18, 22], perLvl: 2.2, coef: 0.43, school: 'fire' }, threat: 2, desc: 'Sears the target for {b} Fire damage. Causes a lot of threat.' },
    shadow_ward: { name: 'Shadow Ward', cls: 'warlock', lvl: 14, cost: 40, costPerLvl: 3, cd: 30, target: 'self', gcd: false, shield: { base: 60, perLvl: 8, coef: 0.1, dur: 30 }, weakened: 0.1, desc: 'A dark barrier absorbs {s} damage for 30 sec.' },
    // druid
    wrath: { name: 'Wrath', cls: 'druid', lvl: 1, cost: 20, costPerLvl: 3, cd: 0, cast: 2, target: 'enemy', dmg: { base: [13, 16], perLvl: 2.9, coef: 0.57, school: 'nature' }, desc: 'Hurls a bolt of nature for {b} Nature damage.' },
    healing_touch: { name: 'Healing Touch', cls: 'druid', lvl: 1, cost: 25, costPerLvl: 5, cd: 0, cast: 2.5, target: 'ally', heal: { base: [40, 55], perLvl: 8, coef: 0.8 }, desc: 'Heals a friendly target for {h}.' },
    mark_wild: { name: 'Mark of the Grove', cls: 'druid', lvl: 1, cost: 20, costPerLvl: 3, cd: 0, target: 'party', buff: { id: 'mark_wild', dur: 1800, stats: { armor: 25, str: 1, agi: 1, sta: 1, int: 1, spi: 1 }, perLvl: { armor: 5, str: 0.2, agi: 0.2, sta: 0.2, int: 0.2, spi: 0.2 } }, desc: 'Raises armor by {armor} and all attributes for your party.' },
    moonfire: { name: 'Moonbeam', cls: 'druid', lvl: 2, cost: 25, costPerLvl: 3, cd: 0, target: 'enemy', dmg: { base: [9, 12], perLvl: 1.6, coef: 0.15, school: 'arcane' }, dot: { id: 'moonfire', ticks: 4, every: 3, dmg: 4.5, perLvl: 1.2, school: 'arcane' }, desc: 'Burns the enemy for {b} Arcane damage and {d} more over 12 sec.' },
    rejuvenation: { name: 'Rejuvenation', cls: 'druid', lvl: 4, cost: 25, costPerLvl: 3, cd: 0, target: 'ally', hot: { id: 'rejuvenation', ticks: 4, every: 3, heal: 8, perLvl: 1.8, coef: 0.2 }, desc: 'Heals the target for {hh} over 12 sec.' },
    bear_form: { name: 'Bear Form', cls: 'druid', lvl: 10, cost: 55, cd: 0, target: 'self', shapeshift: 'bear', combatOnly: true, desc: 'Shapeshift into a bear: much more armor and health, attacks use rage. Cast again to change back.' },
    maul: { name: 'Maul', cls: 'druid', lvl: 10, cost: 15, cd: 0, target: 'enemy', form: 'bear', dmg: { weapon: true, bonus: [18, 18], perLvl: 1.5 }, threat: 1.75, desc: 'A heavy swipe that adds {b} damage and extra threat.' },
    growl: { name: 'Growl', cls: 'druid', lvl: 10, cost: 0, cd: 10, target: 'enemy', gcd: false, taunt: true, form: 'bear', desc: 'Forces the enemy to attack you.' },
    entangling_roots: { root: 6, name: 'Entangling Roots', cls: 'druid', lvl: 12, cost: 50, costPerLvl: 3, cd: 0, cast: 1.5, target: 'enemy', dot: { id: 'entangling_roots', ticks: 4, every: 3, dmg: 4, perLvl: 0.9, school: 'nature' }, slow: { pct: 75, dur: 12 }, desc: 'Roots bind the enemy: it slows by 75% and takes {d} Nature damage over 12 sec.' },
    thorns: { name: 'Thorns', cls: 'druid', lvl: 14, cost: 35, costPerLvl: 2, cd: 0, target: 'self', buff: { id: 'thorns', dur: 600, thorns: { base: 3, perLvl: 0.6, charges: 20 } }, desc: 'Thorns sprout from you: enemies that hit you in melee take Nature damage.' },
    // ---- levels 16 and 18 (v2.1), built only from mechanics the engine already has
    bloodrage: { name: 'Bloodrage', cls: 'warrior', lvl: 16, cost: 0, cd: 60, target: 'self', gcd: false, combatOnly: true, rage: 20, desc: 'Generates 20 rage instantly. 1 min cooldown.' },
    retaliation: { name: 'Retaliation', cls: 'warrior', lvl: 18, cost: 0, cd: 300, target: 'self', gcd: false, combatOnly: true, buff: { id: 'retaliation', dur: 15, thorns: { base: 8, perLvl: 1.2, charges: 12 } }, desc: 'For 15 sec, strikes back at every enemy that hits you in melee. 5 min cooldown.' },
    flamestrike: { name: 'Flamestrike', cls: 'mage', lvl: 16, cost: 110, costPerLvl: 4, cd: 0, cast: 3, target: 'aoe', dmg: { base: [52, 60], perLvl: 2.4, coef: 0.24, school: 'fire' }, desc: 'Calls down a pillar of fire on all nearby enemies for {b} Fire damage.' },
    mana_shield: { name: 'Mana Shield', cls: 'mage', lvl: 18, cost: 60, costPerLvl: 3, cd: 20, target: 'self', gcd: false, shield: { base: 90, perLvl: 9, coef: 0.1, dur: 60 }, weakened: 0.1, desc: 'A shield of mana absorbs {s} damage for 1 min.' },
    heal: { name: 'Heal', cls: 'priest', lvl: 16, cost: 80, costPerLvl: 5, cd: 0, cast: 3, target: 'ally', heal: { base: [130, 160], perLvl: 12, coef: 0.9 }, desc: 'A strong, slow heal on a friendly target for {h}.' },
    psychic_scream: { fear: true, name: 'Psychic Scream', cls: 'priest', lvl: 18, cost: 50, costPerLvl: 2, cd: 30, target: 'self', combatOnly: true, stompAll: 3, desc: 'A terrifying scream: nearby enemies are frozen in fear for 3 sec. 30 sec cooldown.' },
    rupture: { name: 'Rupture', cls: 'rogue', lvl: 16, cost: 25, cd: 0, target: 'enemy', gcdLen: 1.0, finisher: true, dot: { id: 'rupture', ticks: 5, every: 2, dmg: 9, perLvl: 1.6, school: 'physical' }, desc: 'Finishing move. The target bleeds for {d} damage over 10 sec.' },
    kidney_shot: { name: 'Kidney Shot', cls: 'rogue', lvl: 18, cost: 25, cd: 20, target: 'enemy', gcdLen: 1.0, finisher: true, stun: 3, desc: 'Finishing move. Stuns the target for 3 sec. 20 sec cooldown.' },
    exorcism: { name: 'Exorcism', cls: 'paladin', lvl: 16, cost: 50, costPerLvl: 3, cd: 15, target: 'enemy', dmg: { base: [45, 52], perLvl: 3, coef: 0.43, school: 'holy' }, desc: 'Blasts the enemy with holy light for {b} Holy damage. 15 sec cooldown.' },
    retribution_aura: { name: 'Thorned Aura', cls: 'paladin', lvl: 18, cost: 0, cd: 0, target: 'party', buff: { id: 'retribution_aura', dur: 1800, thorns: { base: 5, perLvl: 0.6, charges: 60 } }, desc: 'Your party deals Holy damage to every enemy that hits them in melee.' },
    rain_of_fire: { name: 'Rain of Fire', cls: 'warlock', lvl: 16, cost: 110, costPerLvl: 4, cd: 0, cast: 3, target: 'aoe', dmg: { base: [45, 52], perLvl: 2.2, coef: 0.25, school: 'fire' }, desc: 'Fire rains down on all nearby enemies for {b} Fire damage.' },
    demon_armor: { name: 'Demon Armor', cls: 'warlock', lvl: 18, cost: 60, costPerLvl: 3, cd: 0, target: 'self', buff: { id: 'demon_armor', dur: 1800, stats: { armor: 110, sta: 4 }, perLvl: { armor: 10, sta: 0.2 } }, desc: 'Demonic armor raises your armor by {armor} and your Stamina.' },
    rapid_fire: { name: 'Rapid Fire', cls: 'hunter', lvl: 16, cost: 40, cd: 180, target: 'self', gcd: false, combatOnly: true, buff: { id: 'rapid_fire', dur: 15, stats: { haste: 40 } }, desc: 'Shoot 40% faster for 15 sec. 3 min cooldown.' },
    immolation_trap: { name: 'Immolation Trap', cls: 'hunter', lvl: 18, cost: 50, costPerLvl: 2, cd: 15, target: 'enemy', dot: { id: 'immolation_trap', ticks: 5, every: 3, dmg: 10, perLvl: 1.6, school: 'fire' }, desc: 'A fire trap burns the enemy for {d} Fire damage over 15 sec.' },
    regrowth: { name: 'Regrowth', cls: 'druid', lvl: 16, cost: 80, costPerLvl: 4, cd: 0, cast: 2, target: 'ally', heal: { base: [80, 95], perLvl: 7, coef: 0.5 }, hot: { id: 'regrowth', ticks: 7, every: 3, heal: 6, perLvl: 1.2, coef: 0.1 }, desc: 'Heals a friendly target for {h} and {hh} more over 21 sec.' },
    swipe: { name: 'Swipe', cls: 'druid', lvl: 18, cost: 20, cd: 0, target: 'aoe', form: 'bear', dmg: { weapon: true, bonus: [10, 10], perLvl: 0.8 }, threat: 1.5, desc: 'Swipes every nearby enemy for weapon damage plus {b}.' },
    frost_shock: { name: 'Frost Shock', cls: 'shaman', lvl: 16, cost: 70, costPerLvl: 3, cd: 6, target: 'enemy', dmg: { base: [45, 50], perLvl: 2.5, coef: 0.39, school: 'frost' }, slow: { pct: 50, dur: 8 }, desc: 'Shocks the target with frost for {b} Frost damage and slows it.' },
    flametongue_weapon: { name: 'Burning Weapon', cls: 'shaman', lvl: 18, cost: 30, costPerLvl: 2, cd: 0, target: 'self', buff: { id: 'rockbiter', dur: 300, seal: { base: 5, perLvl: 1.3, school: 'fire' } }, desc: 'Imbues your weapon with fire for 5 min: each hit deals extra Fire damage. Replaces Rockbiter.' },
    // racial actives (combat only, off the global cooldown)
    every_man: { name: 'Every Man for Himself', racial: true, lvl: 1, cost: 0, cd: 120, target: 'self', gcd: false, combatOnly: true, freeOf: 'stun', desc: 'Breaks free of stuns and slows. 2 min cooldown.' },
    stoneform: { name: 'Granite Skin', racial: true, lvl: 1, cost: 0, cd: 120, target: 'self', gcd: false, combatOnly: true, cleanse: true, buff: { id: 'stoneform', dur: 8, stats: { armor: 10 }, perLvl: { armor: 6 } }, desc: 'Turns your skin to stone: more armor, and bleeds and poisons are removed. 8 sec.' },
    escape_artist: { name: 'Escape Artist', racial: true, lvl: 1, cost: 0, cd: 60, target: 'self', gcd: false, combatOnly: true, freeOf: 'stun', desc: 'Escapes stuns and slows. 1 min cooldown.' },
    // v3 (levels 20 and 24)
    shield_block: { name: 'Shield Block', cls: 'warrior', lvl: 20, cost: 10, cd: 10, target: 'self', gcd: false, combatOnly: true, buff: { id: 'shield_block', dur: 5, stats: { dodge: 40 } }, desc: 'Raise your guard: 40% more chance to avoid attacks for 5 sec. 10 sec cooldown.' },
    intimidating_shout: { fear: true, name: 'Intimidating Shout', cls: 'warrior', lvl: 24, cost: 25, cd: 120, target: 'self', combatOnly: true, stompAll: 4, desc: 'A terrifying roar: nearby enemies cower for 4 sec. 2 min cooldown.' },
    cone_of_cold: { name: 'Cone of Cold', cls: 'mage', lvl: 20, cost: 90, costPerLvl: 4, cd: 10, target: 'aoe', dmg: { base: [60, 68], perLvl: 2.2, coef: 0.2, school: 'frost' }, slow: { pct: 50, dur: 8 }, desc: 'Blasts all nearby enemies with cold for {b} Frost damage and slows them. 10 sec cooldown.' },
    scorch: { name: 'Scorch', cls: 'mage', lvl: 24, cost: 50, costPerLvl: 3, cd: 0, cast: 1.5, target: 'enemy', dmg: { base: [53, 65], perLvl: 2.6, coef: 0.43, school: 'fire' }, desc: 'Scorches the enemy for {b} Fire damage.' },
    holy_fire: { name: 'Holy Fire', cls: 'priest', lvl: 20, cost: 85, costPerLvl: 4, cd: 10, cast: 3, target: 'enemy', dmg: { base: [84, 104], perLvl: 3.4, coef: 0.6, school: 'holy' }, dot: { id: 'holy_fire', ticks: 5, every: 2, dmg: 4, perLvl: 0.8, school: 'holy' }, desc: 'Consumes the enemy in holy flame for {b} Holy damage and {d} more over 10 sec.' },
    fade: { name: 'Fade', cls: 'priest', lvl: 24, cost: 45, cd: 30, target: 'self', gcd: false, combatOnly: true, dropThreat: true, desc: 'Fade from sight: enemies lose all threat on you. 30 sec cooldown.' },
    ambush: { name: 'Ambush', cls: 'rogue', lvl: 20, cost: 60, cd: 0, target: 'enemy', opener: true, gcdLen: 1, dmg: { weapon: true, bonus: [70, 70], perLvl: 3 }, cp: 2, desc: 'Opener. Strikes an enemy you are not fighting yet for weapon damage plus {b}. Awards 2 combo points.' },
    blade_flurry: { name: 'Blade Flurry', cls: 'rogue', lvl: 24, cost: 25, cd: 120, target: 'self', gcd: false, combatOnly: true, buff: { id: 'blade_flurry', dur: 15, stats: { haste: 20 } }, desc: 'Attack 20% faster for 15 sec. 2 min cooldown.' },
    consecration: { name: 'Consecration', cls: 'paladin', lvl: 20, cost: 90, costPerLvl: 3, cd: 8, target: 'aoe', dmg: { base: [40, 46], perLvl: 2.2, coef: 0.3, school: 'holy' }, threat: 2, desc: 'Consecrates the ground: all nearby enemies take {b} Holy damage. 8 sec cooldown.' },
    blessing_wisdom: { name: 'Blessing of Wisdom', cls: 'paladin', lvl: 24, cost: 40, costPerLvl: 2, cd: 0, target: 'party', buff: { id: 'blessing_wisdom', dur: 600, stats: { spi: 8 }, perLvl: { spi: 0.4 } }, desc: 'Blesses your party with {spi} Spirit for 10 min.' },
    shadowburn: { name: 'Shadowburn', cls: 'warlock', lvl: 20, cost: 60, costPerLvl: 3, cd: 15, target: 'enemy', dmg: { base: [70, 80], perLvl: 3, coef: 0.43, school: 'shadow' }, desc: 'Instantly blasts the enemy for {b} Shadow damage. 15 sec cooldown.' },
    death_coil: { name: 'Death Coil', cls: 'warlock', lvl: 24, cost: 70, costPerLvl: 3, cd: 120, target: 'enemy', dmg: { base: [120, 130], perLvl: 2, coef: 0.21, school: 'shadow' }, stun: 3, desc: 'Horrifies the enemy for 3 sec and deals {b} Shadow damage. 2 min cooldown.' },
    aspect_hawk: { name: 'Spirit of the Hawk', cls: 'hunter', lvl: 20, cost: 20, cd: 0, target: 'self', buff: { id: 'aspect_hawk', dur: 1800, stats: { ap: 20 }, perLvl: { ap: 1 } }, desc: 'Raises your attack power by {ap}.' },
    feign_death: { name: 'Feign Death', cls: 'hunter', lvl: 24, cost: 30, cd: 30, target: 'self', gcd: false, combatOnly: true, dropThreat: true, desc: 'Play dead: enemies lose all threat on you. 30 sec cooldown.' },
    starfire: { name: 'Star Bolt', cls: 'druid', lvl: 20, cost: 95, costPerLvl: 4, cd: 0, cast: 3, target: 'enemy', dmg: { base: [95, 115], perLvl: 3.6, coef: 0.85, school: 'arcane' }, desc: 'Calls down starlight for {b} Arcane damage.' },
    insect_swarm: { name: 'Insect Swarm', cls: 'druid', lvl: 24, cost: 45, costPerLvl: 2, cd: 0, target: 'enemy', dot: { id: 'insect_swarm', ticks: 6, every: 2, dmg: 8, perLvl: 1.2, coef: 0.1, school: 'nature' }, desc: 'A swarm of insects bites the enemy for {d} Nature damage over 12 sec.' },
    lesser_healing_wave: { name: 'Lesser Healing Wave', cls: 'shaman', lvl: 20, cost: 60, costPerLvl: 3, cd: 0, cast: 1.5, target: 'ally', heal: { base: [80, 95], perLvl: 4, coef: 0.43 }, desc: 'A quick heal for {h}.' },
    fire_nova_totem: { name: 'Fire Nova Totem', cls: 'shaman', lvl: 24, cost: 90, costPerLvl: 3, cd: 15, target: 'aoe', dmg: { base: [55, 63], perLvl: 2.4, coef: 0.2, school: 'fire' }, desc: 'A totem that bursts in flame: all nearby enemies take {b} Fire damage. 15 sec cooldown.' },
    // v4 (levels 26 and 28)
    overpower: { name: 'Overpower', cls: 'warrior', lvl: 2, cost: 5, cd: 0, target: 'enemy', needAura: 'overpower_ready', dmg: { weapon: true, bonus: [8, 8], perLvl: 2.4 }, desc: 'A quick counter-strike for weapon damage plus {b}. Lights up for 5 sec whenever an attack is dodged or missed, yours or an enemy\'s.' },
    whirlwind: { name: 'Whirlwind', cls: 'warrior', lvl: 28, cost: 25, cd: 10, target: 'aoe', dmg: { weapon: true, bonus: [10, 10], perLvl: 0.6 }, threat: 1.3, desc: 'Spin and strike every nearby enemy for weapon damage plus {b}. 10 sec cooldown.' },
    blizzard: { name: 'Frost Storm', cls: 'mage', lvl: 26, cost: 130, costPerLvl: 4, cd: 0, cast: 3, target: 'aoe', dmg: { base: [60, 68], perLvl: 2.4, coef: 0.3, school: 'frost' }, slow: { pct: 30, dur: 6 }, desc: 'Ice shards rain on all nearby enemies for {b} Frost damage and slow them.' },
    blast_wave: { name: 'Blast Wave', cls: 'mage', lvl: 28, cost: 110, costPerLvl: 4, cd: 30, target: 'aoe', dmg: { base: [70, 80], perLvl: 2.6, coef: 0.2, school: 'fire' }, slow: { pct: 50, dur: 6 }, desc: 'A wave of flame hits all nearby enemies for {b} Fire damage and slows them. 30 sec cooldown.' },
    mind_flay: { name: 'Mind Flay', cls: 'priest', lvl: 26, cost: 70, costPerLvl: 3, cd: 0, cast: 3, target: 'enemy', dmg: { base: [75, 85], perLvl: 2.8, coef: 0.45, school: 'shadow' }, slow: { pct: 50, dur: 3 }, desc: "Assaults the target's mind for {b} Shadow damage and slows it." },
    flash_heal: { name: 'Flash Heal', cls: 'priest', lvl: 28, cost: 90, costPerLvl: 4, cd: 0, cast: 1.5, target: 'ally', heal: { base: [95, 115], perLvl: 5, coef: 0.43 }, desc: 'A quick heal for {h}.' },
    cheap_shot: { name: 'Cheap Shot', cls: 'rogue', lvl: 26, cost: 60, cd: 0, target: 'enemy', opener: true, gcdLen: 1, stun: 4, cp: 2, desc: 'Opener. Stuns an enemy you are not fighting yet for 4 sec. Awards 2 combo points.' },
    feint: { name: 'Feint', cls: 'rogue', lvl: 28, cost: 20, cd: 10, target: 'self', gcd: false, combatOnly: true, dropThreat: true, desc: 'A feint makes enemies forget their threat on you. 10 sec cooldown.' },
    hammer_of_wrath: { name: 'Hammer of Wrath', cls: 'paladin', lvl: 26, cost: 60, costPerLvl: 3, cd: 6, cast: 1, target: 'enemy', dmg: { base: [80, 90], perLvl: 3, coef: 0.43, school: 'holy' }, desc: 'Hurls a hammer of light for {b} Holy damage. 6 sec cooldown.' },
    holy_wrath: { aoeAt: 'self', name: 'Holy Wrath', cls: 'paladin', lvl: 28, cost: 110, costPerLvl: 4, cd: 60, cast: 2, target: 'aoe', dmg: { base: [75, 85], perLvl: 2.6, coef: 0.3, school: 'holy' }, threat: 2, desc: 'Holy light strikes all nearby enemies for {b} Holy damage. 1 min cooldown.' },
    howl_of_terror: { fear: true, name: 'Howl of Terror', cls: 'warlock', lvl: 26, cost: 80, costPerLvl: 2, cd: 40, target: 'self', combatOnly: true, stompAll: 4, desc: 'A demonic howl: nearby enemies flee in terror for 4 sec. 40 sec cooldown.' },
    soul_fire: { name: 'Soul Fire', cls: 'warlock', lvl: 28, cost: 120, costPerLvl: 4, cd: 60, cast: 4, target: 'enemy', dmg: { base: [190, 220], perLvl: 4, coef: 1, school: 'fire' }, desc: 'Burns the enemy\'s soul for {b} Fire damage. 1 min cooldown.' },
    volley: { name: 'Volley', cls: 'hunter', lvl: 26, cost: 90, costPerLvl: 4, cd: 30, cast: 2, target: 'aoe', dmg: { base: [45, 45], perLvl: 2, rapCoef: 0.2, school: 'arcane' }, desc: 'Arrows rain on all nearby enemies for {b} Arcane damage. 30 sec cooldown.' },
    aimed_shot: { name: 'Aimed Shot', cls: 'hunter', lvl: 28, cost: 70, costPerLvl: 3, cd: 6, cast: 2.5, target: 'enemy', dmg: { base: [70, 70], perLvl: 3, rapCoef: 0.4, school: 'physical' }, desc: 'A careful shot for {b} damage. 6 sec cooldown.' },
    hurricane: { name: 'Hurricane', cls: 'druid', lvl: 26, cost: 130, costPerLvl: 4, cd: 30, cast: 3, target: 'aoe', dmg: { base: [65, 75], perLvl: 2.4, coef: 0.3, school: 'nature' }, slow: { pct: 25, dur: 6 }, desc: 'A storm batters all nearby enemies for {b} Nature damage and slows them. 30 sec cooldown.' },
    barkskin: { name: 'Barkskin', cls: 'druid', lvl: 28, cost: 0, cd: 60, target: 'self', gcd: false, combatOnly: true, buff: { id: 'barkskin', dur: 15, stats: { armor: 300 }, perLvl: { armor: 10 } }, desc: 'Your skin turns to bark: +{armor} armor for 15 sec. 1 min cooldown.' },
    chain_lightning: { name: 'Chain Lightning', cls: 'shaman', lvl: 26, cost: 110, costPerLvl: 4, cd: 6, cast: 2.5, target: 'aoe', dmg: { base: [70, 80], perLvl: 2.6, coef: 0.4, school: 'nature' }, desc: 'Lightning arcs between all nearby enemies for {b} Nature damage. 6 sec cooldown.' },
    windfury_weapon: { name: 'Gale Weapon', cls: 'shaman', lvl: 28, cost: 40, costPerLvl: 2, cd: 0, target: 'self', buff: { id: 'rockbiter', dur: 300, seal: { base: 8, perLvl: 1.6, school: 'physical' } }, desc: 'Imbues your weapon with wind for 5 min: each hit deals extra damage. Replaces other imbues.' },
    // v5 (levels 32 and 34)
    shield_wall: { name: 'Shield Wall', cls: 'warrior', lvl: 32, cost: 0, cd: 180, target: 'self', gcd: false, combatOnly: true, shield: { base: 300, perLvl: 18, coef: 0, dur: 10 }, desc: 'Brace behind your shield: absorbs {s} damage for 10 sec. 3 min cooldown.' },
    slam: { name: 'Slam', cls: 'warrior', lvl: 34, cost: 15, cd: 0, cast: 1.5, target: 'enemy', dmg: { weapon: true, bonus: [45, 45], perLvl: 1.6 }, desc: 'A heavy blow for weapon damage plus {b}.' },
    ice_block: { name: 'Ice Block', cls: 'mage', lvl: 32, cost: 0, cd: 300, target: 'self', gcd: false, combatOnly: true, buff: { id: 'ice_block', dur: 8, immune: true }, desc: 'Encase yourself in ice: immune to all damage for 8 sec. 5 min cooldown.' },
    pyroblast: { name: 'Inferno Blast', cls: 'mage', lvl: 34, cost: 150, costPerLvl: 4, cd: 30, cast: 5, target: 'enemy', dmg: { base: [260, 300], perLvl: 5, coef: 1.1, school: 'fire' }, desc: 'Hurls an immense fiery boulder for {b} Fire damage. 30 sec cooldown.' },
    holy_nova: { name: 'Holy Nova', cls: 'priest', lvl: 32, cost: 110, costPerLvl: 4, cd: 8, target: 'aoe', dmg: { base: [50, 58], perLvl: 2, coef: 0.2, school: 'holy' }, desc: 'A burst of holy light hits all nearby enemies for {b} Holy damage. 8 sec cooldown.' },
    greater_heal: { name: 'Greater Heal', cls: 'priest', lvl: 34, cost: 180, costPerLvl: 6, cd: 0, cast: 3, target: 'ally', heal: { base: [360, 420], perLvl: 12, coef: 1.2 }, desc: 'A slow, powerful heal for {h}.' },
    blind: { name: 'Blind', cls: 'rogue', lvl: 32, cost: 30, cd: 180, target: 'enemy', stun: 8, desc: 'Blinds the target: it can\'t act for 8 sec. 3 min cooldown.' },
    vanish: { name: 'Vanish', cls: 'rogue', lvl: 34, cost: 0, cd: 300, target: 'self', gcd: false, combatOnly: true, dropThreat: true, desc: 'Vanish in a puff of smoke: enemies lose all threat on you. 5 min cooldown.' },
    holy_shock: { name: 'Holy Shock', cls: 'paladin', lvl: 32, cost: 90, costPerLvl: 3, cd: 20, target: 'enemy', dmg: { base: [110, 125], perLvl: 3.5, coef: 0.43, school: 'holy' }, desc: 'A burst of holy energy for {b} Holy damage. Instant. 20 sec cooldown.' },
    seal_command: { name: 'Oath of Command', cls: 'paladin', lvl: 34, cost: 30, costPerLvl: 3, cd: 0, target: 'self', combatOnly: true, buff: { id: 'seal', dur: 30, seal: { base: 8, perLvl: 1.6 } }, desc: 'A stronger seal: each melee hit deals more extra Holy damage for 30 sec. Verdict releases it.' },
    siphon_life: { name: 'Siphon Life', cls: 'warlock', lvl: 32, cost: 70, costPerLvl: 3, cd: 0, target: 'enemy', dot: { id: 'siphon_life', ticks: 10, every: 3, dmg: 9, perLvl: 1.4, coef: 0.1, school: 'shadow' }, desc: 'Drains the life of the target for {d} Shadow damage over 30 sec.' },
    conflagrate: { name: 'Conflagrate', cls: 'warlock', lvl: 34, cost: 80, costPerLvl: 3, cd: 10, target: 'enemy', dmg: { base: [130, 150], perLvl: 3.5, coef: 0.43, school: 'fire' }, desc: 'Ignites the target for {b} Fire damage. Instant. 10 sec cooldown.' },
    scatter_shot: { name: 'Scatter Shot', cls: 'hunter', lvl: 32, cost: 40, cd: 30, target: 'enemy', stun: 4, desc: 'A short-range shot that disorients the target for 4 sec. 30 sec cooldown.' },
    trueshot_aura: { name: 'Keen Eye Aura', cls: 'hunter', lvl: 34, cost: 0, cd: 0, target: 'party', buff: { id: 'trueshot_aura', dur: 1800, stats: { ap: 30 }, perLvl: { ap: 1 } }, desc: 'Raises the attack power of your party by {ap}.' },
    bash: { name: 'Bash', cls: 'druid', lvl: 32, cost: 10, cd: 60, target: 'enemy', form: 'bear', stun: 4, desc: 'Stuns the target for 4 sec. Bear Form only. 1 min cooldown.' },
    innervate: { name: 'Innervate', cls: 'druid', lvl: 34, cost: 0, cd: 360, target: 'self', gcd: false, combatOnly: true, buff: { id: 'innervate', dur: 20, stats: { spi: 60 }, perLvl: { spi: 2 } }, desc: 'Nature floods you with energy: +{spi} Spirit for 20 sec. 6 min cooldown.' },
    magma_totem: { name: 'Magma Totem', cls: 'shaman', lvl: 32, cost: 110, costPerLvl: 4, cd: 12, target: 'aoe', dmg: { base: [70, 80], perLvl: 2.4, coef: 0.2, school: 'fire' }, desc: 'A totem of lava burns all nearby enemies for {b} Fire damage. 12 sec cooldown.' },
    chain_heal: { name: 'Chain Heal', cls: 'shaman', lvl: 34, cost: 150, costPerLvl: 5, cd: 0, cast: 2.5, target: 'ally', heal: { base: [300, 340], perLvl: 9, coef: 0.9 }, desc: 'A wave of healing for {h}.' },
    // v5.1 (levels 36 and 38)
    mortal_strike: { name: 'Grievous Strike', cls: 'warrior', lvl: 36, cost: 30, cd: 6, target: 'enemy', dmg: { weapon: true, bonus: [85, 85], perLvl: 2 }, desc: 'A vicious strike for weapon damage plus {b}. 6 sec cooldown.' },
    berserker_rage: { name: 'Berserker Rage', cls: 'warrior', lvl: 38, cost: 0, cd: 60, target: 'self', gcd: false, combatOnly: true, rage: 15, buff: { id: 'berserker_rage', dur: 10, stats: { haste: 20 } }, desc: 'Go berserk: 15 rage and 20% faster attacks for 10 sec. 1 min cooldown.' },
    arcane_power: { name: 'Arcane Power', cls: 'mage', lvl: 36, cost: 0, cd: 180, target: 'self', gcd: false, combatOnly: true, buff: { id: 'arcane_power', dur: 15, stats: { sp: 40 }, perLvl: { sp: 1 } }, desc: 'Your spells deal more damage: +{sp} spell power for 15 sec. 3 min cooldown.' },
    fire_ward: { name: 'Fire Ward', cls: 'mage', lvl: 38, cost: 80, costPerLvl: 3, cd: 30, target: 'self', gcd: false, shield: { base: 220, perLvl: 10, coef: 0.1, dur: 30 }, desc: 'A ward of flame absorbs {s} damage for 30 sec.' },
    shadowform: { name: 'Shadowform', cls: 'priest', lvl: 36, cost: 60, cd: 0, target: 'self', buff: { id: 'shadowform', dur: 1800, stats: { sp: 25, armor: 150 }, perLvl: { sp: 0.8 } }, desc: 'Become a creature of shadow: +{sp} spell power and more armor.' },
    desperate_prayer: { name: 'Desperate Prayer', cls: 'priest', lvl: 38, cost: 0, cd: 180, target: 'self', gcd: false, heal: { base: [480, 560], perLvl: 12, coef: 0.3 }, desc: 'A desperate plea heals you for {h}. Instant. 3 min cooldown.' },
    adrenaline_rush: { name: 'Adrenaline Rush', cls: 'rogue', lvl: 36, cost: 0, cd: 300, target: 'self', gcd: false, combatOnly: true, buff: { id: 'adrenaline_rush', dur: 15, stats: { haste: 30 } }, desc: 'Attack 30% faster for 15 sec. 5 min cooldown.' },
    ghostly_strike: { name: 'Ghostly Strike', cls: 'rogue', lvl: 38, cost: 40, cd: 20, target: 'enemy', gcdLen: 1, dmg: { weapon: true, bonus: [30, 30], perLvl: 1.2 }, cp: 1, desc: 'A ghostly strike for weapon damage plus {b}. Awards 1 combo point. 20 sec cooldown.' },
    blessing_kings: { name: 'Blessing of Kings', cls: 'paladin', lvl: 36, cost: 60, costPerLvl: 2, cd: 0, target: 'party', buff: { id: 'blessing_kings', dur: 600, stats: { str: 5, agi: 5, sta: 5, int: 5, spi: 5 }, perLvl: { str: 0.15, agi: 0.15, sta: 0.15, int: 0.15, spi: 0.15 } }, desc: 'Blesses your party with +{sta} to all stats for 10 min.' },
    avenging_wrath: { name: 'Radiant Wrath', cls: 'paladin', lvl: 38, cost: 0, cd: 180, target: 'self', gcd: false, combatOnly: true, buff: { id: 'avenging_wrath', dur: 20, stats: { ap: 60, sp: 40 }, perLvl: { ap: 1.5, sp: 1 } }, desc: 'Wings of light: +{ap} attack power and +{sp} spell power for 20 sec. 3 min cooldown.' },
    curse_of_doom: { name: 'Curse of Doom', cls: 'warlock', lvl: 36, cost: 100, costPerLvl: 3, cd: 60, target: 'enemy', dot: { id: 'curse_of_doom', ticks: 1, every: 20, dmg: 600, perLvl: 18, coef: 1, school: 'shadow' }, desc: 'After 20 sec, the curse deals {d} Shadow damage. 1 min cooldown.' },
    hellfire: { aoeAt: 'self', name: 'Hellfire', cls: 'warlock', lvl: 38, cost: 140, costPerLvl: 4, cd: 0, cast: 3, target: 'aoe', dmg: { base: [80, 90], perLvl: 2.6, coef: 0.3, school: 'fire' }, desc: 'A ring of gloom fire burns all nearby enemies for {b} Fire damage.' },
    explosive_trap: { name: 'Explosive Trap', cls: 'hunter', lvl: 36, cost: 80, costPerLvl: 3, cd: 30, target: 'aoe', dmg: { base: [90, 100], perLvl: 2.6, rapCoef: 0.1, school: 'fire' }, desc: 'A trap explodes under all nearby enemies for {b} Fire damage. 30 sec cooldown.' },
    deterrence: { name: 'Deterrence', cls: 'hunter', lvl: 38, cost: 0, cd: 300, target: 'self', gcd: false, combatOnly: true, buff: { id: 'deterrence', dur: 10, stats: { dodge: 60 } }, desc: 'Dodge 60% more attacks for 10 sec. 5 min cooldown.' },
    swiftmend: { name: 'Quick Mend', cls: 'druid', lvl: 36, cost: 90, costPerLvl: 3, cd: 15, target: 'ally', heal: { base: [300, 340], perLvl: 8, coef: 0.6 }, desc: 'Instantly heals a friendly target for {h}. 15 sec cooldown.' },
    frenzied_regeneration: { name: 'Frenzied Regeneration', cls: 'druid', lvl: 38, cost: 0, cd: 180, target: 'self', gcd: false, combatOnly: true, hot: { id: 'frenzied_regeneration', ticks: 10, every: 1, heal: 40, perLvl: 2 }, desc: 'Regenerate {hh} health over 10 sec. 3 min cooldown.' },
    stormstrike: { name: 'Storm Blade', cls: 'shaman', lvl: 36, cost: 70, costPerLvl: 2, cd: 10, target: 'enemy', dmg: { weapon: true, bonus: [60, 60], perLvl: 1.6 }, desc: 'Strike with a storm-charged weapon for weapon damage plus {b}. 10 sec cooldown.' },
    mana_tide_totem: { name: 'Wellspring Totem', cls: 'shaman', lvl: 38, cost: 20, cd: 300, target: 'party', buff: { id: 'mana_tide', dur: 12, stats: { spi: 80 }, perLvl: { spi: 2 } }, desc: 'A totem of water: your party gains +{spi} Spirit for 12 sec. 5 min cooldown.' },
    // v6 (levels 44 and 48)
    intercept: { dash: true, range: 25, name: 'Intercept', cls: 'warrior', lvl: 44, cost: 10, cd: 30, target: 'enemy', dmg: { weapon: true, bonus: [25, 25], perLvl: 1 }, stun: 3, desc: 'Leap at the enemy for weapon damage plus {b} and stun it for 3 sec. 30 sec cooldown.' },
    recklessness: { name: 'Recklessness', cls: 'warrior', lvl: 48, cost: 0, cd: 300, target: 'self', gcd: false, combatOnly: true, buff: { id: 'recklessness', dur: 15, stats: { ap: 120, haste: 15 }, perLvl: { ap: 2 } }, desc: 'Throw caution aside: +{ap} attack power and 15% faster attacks for 15 sec. 5 min cooldown.' },
    ice_barrier: { name: 'Ice Barrier', cls: 'mage', lvl: 44, cost: 150, costPerLvl: 4, cd: 30, target: 'self', gcd: false, shield: { base: 450, perLvl: 14, coef: 0.1, dur: 60 }, desc: 'A shell of ice absorbs {s} damage for 1 min. 30 sec cooldown.' },
    combustion: { name: 'Combustion', cls: 'mage', lvl: 48, cost: 0, cd: 180, target: 'self', gcd: false, combatOnly: true, buff: { id: 'combustion', dur: 15, stats: { sp: 70 }, perLvl: { sp: 1.5 } }, desc: 'Your fire burns hotter: +{sp} spell power for 15 sec. 3 min cooldown.' },
    power_infusion: { name: 'Surge of Power', cls: 'priest', lvl: 44, cost: 0, cd: 180, target: 'self', gcd: false, combatOnly: true, buff: { id: 'power_infusion', dur: 15, stats: { sp: 60, haste: 15 }, perLvl: { sp: 1.2 } }, desc: 'Infused with power: +{sp} spell power and 15% faster casting for 15 sec. 3 min cooldown.' },
    prayer_of_fortitude: { name: 'Prayer of Fortitude', cls: 'priest', lvl: 48, cost: 180, costPerLvl: 4, cd: 0, target: 'party', buff: { id: 'pw_fortitude', dur: 3600, stats: { sta: 20 }, perLvl: { sta: 1.1 } }, desc: 'Power infuses your whole party, raising Stamina by {sta} for 1 hour.' },
    cold_blood: { name: 'Cold Blood', cls: 'rogue', lvl: 54, cost: 0, cd: 180, target: 'self', gcd: false, combatOnly: true, buff: { id: 'cold_blood', dur: 12, stats: { ap: 150 }, perLvl: { ap: 2 } }, desc: 'Your blood runs cold: +{ap} attack power for 12 sec. 3 min cooldown.' },
    hemorrhage: { name: 'Hemorrhage', cls: 'rogue', lvl: 48, cost: 35, cd: 0, target: 'enemy', gcdLen: 1, dmg: { weapon: true, bonus: [40, 40], perLvl: 1.4 }, cp: 1, desc: 'A deep, bleeding cut for weapon damage plus {b}. Awards 1 combo point.' },
    repentance: { name: 'Repentance', cls: 'paladin', lvl: 44, cost: 60, cd: 60, target: 'enemy', stun: 6, desc: 'The target kneels in repentance and can\'t act for 6 sec. 1 min cooldown.' },
    crusader_strike: { name: 'Zealot Strike', cls: 'paladin', lvl: 48, cost: 40, costPerLvl: 2, cd: 6, target: 'enemy', dmg: { weapon: true, bonus: [60, 60], perLvl: 1.6 }, desc: 'A holy strike for weapon damage plus {b}. 6 sec cooldown.' },
    shadowfury: { name: 'Shadowfury', cls: 'warlock', lvl: 44, cost: 120, costPerLvl: 3, cd: 20, target: 'aoe', dmg: { base: [90, 104], perLvl: 2.8, coef: 0.2, school: 'shadow' }, stompAll: 2, desc: 'Shadow bursts from the ground: {b} Shadow damage to all nearby enemies, stunning them for 2 sec. 20 sec cooldown.' },
    shadow_bolt_volley: { name: 'Shadow Bolt Volley', cls: 'warlock', lvl: 48, cost: 160, costPerLvl: 4, cd: 0, cast: 2.5, target: 'aoe', dmg: { base: [105, 120], perLvl: 3, coef: 0.3, school: 'shadow' }, desc: 'Shadow bolts hit all nearby enemies for {b} Shadow damage.' },
    counterattack: { name: 'Counterattack', cls: 'hunter', lvl: 44, cost: 45, cd: 5, target: 'enemy', dmg: { weapon: true, bonus: [45, 45], perLvl: 1.4 }, stun: 2, desc: 'A counter-blow for weapon damage plus {b}; the target is stunned for 2 sec. 5 sec cooldown.' },
    wyvern_sting: { name: 'Sleep Sting', cls: 'hunter', lvl: 48, cost: 80, cd: 60, target: 'enemy', stun: 6, dot: { id: 'wyvern_sting', ticks: 4, every: 3, dmg: 40, perLvl: 1.5, school: 'nature' }, desc: 'Puts the target to sleep for 6 sec, then poisons it for {d} Nature damage. 1 min cooldown.' },
    feral_charge: { dash: true, range: 25, name: 'Feral Charge', cls: 'druid', lvl: 44, cost: 5, cd: 15, target: 'enemy', form: 'bear', stun: 3, desc: 'Charge the enemy and stun it for 3 sec. Bear Form only. 15 sec cooldown.' },
    gift_of_the_wild: { name: 'Gift of the Grove', cls: 'druid', lvl: 48, cost: 200, costPerLvl: 4, cd: 0, target: 'party', buff: { id: 'mark_wild', dur: 3600, stats: { str: 8, agi: 8, sta: 8, int: 8, spi: 8, armor: 150 }, perLvl: { str: 0.2, agi: 0.2, sta: 0.2, int: 0.2, spi: 0.2 } }, desc: 'Nature blesses your whole party: +{sta} to all stats and more armor for 1 hour.' },
    earth_shield: { name: 'Earth Shield', cls: 'shaman', lvl: 44, cost: 130, costPerLvl: 4, cd: 30, target: 'self', gcd: false, shield: { base: 420, perLvl: 13, coef: 0.2, dur: 60 }, desc: 'A ring of stone absorbs {s} damage for 1 min. 30 sec cooldown.' },
    elemental_mastery: { name: 'Elemental Mastery', cls: 'shaman', lvl: 48, cost: 0, cd: 180, target: 'self', gcd: false, combatOnly: true, buff: { id: 'elemental_mastery', dur: 15, stats: { sp: 70 }, perLvl: { sp: 1.5 } }, desc: 'Master the elements: +{sp} spell power for 15 sec. 3 min cooldown.' },
    // v7 (levels 52 and 54)
    shield_slam: { name: 'Shield Slam', cls: 'warrior', lvl: 52, cost: 20, cd: 6, target: 'enemy', dmg: { weapon: true, bonus: [110, 110], perLvl: 2 }, threat: 2, desc: 'Slam the target with your shield for weapon damage plus {b}. 6 sec cooldown.' },
    last_stand: { name: 'Last Stand', cls: 'warrior', lvl: 54, cost: 0, cd: 300, target: 'self', gcd: false, combatOnly: true, heal: { base: [600, 700], perLvl: 14, coef: 0 }, desc: 'A last burst of will heals you for {h}. 5 min cooldown.' },
    arcane_brilliance: { name: 'Arcane Brilliance', cls: 'mage', lvl: 52, cost: 200, costPerLvl: 4, cd: 0, target: 'party', buff: { id: 'arcane_brilliance', dur: 3600, stats: { int: 20 }, perLvl: { int: 0.6 } }, desc: 'Raises the Intellect of your party by {int} for 1 hour.' },
    dragons_breath: { name: "Dragon's Breath", cls: 'mage', lvl: 54, cost: 170, costPerLvl: 4, cd: 20, target: 'aoe', dmg: { base: [150, 170], perLvl: 3.4, coef: 0.2, school: 'fire' }, stompAll: 2, desc: 'Breathe fire on all nearby enemies for {b} Fire damage, stunning them for 2 sec. 20 sec cooldown.' },
    vampiric_embrace: { name: 'Vampiric Embrace', cls: 'priest', lvl: 52, cost: 80, cd: 20, target: 'self', hot: { id: 'vampiric_embrace', ticks: 10, every: 2, heal: 45, perLvl: 1.5 }, desc: 'Shadow feeds you {hh} health over 20 sec. 20 sec cooldown.' },
    pain_suppression: { name: 'Pain Suppression', cls: 'priest', lvl: 54, cost: 60, cd: 120, target: 'ally', gcd: false, shield: { base: 700, perLvl: 18, coef: 0.3, dur: 8 }, desc: 'A friendly target absorbs {s} damage for 8 sec. 2 min cooldown.' },
    fan_of_knives: { name: 'Fan of Knives', cls: 'rogue', lvl: 52, cost: 50, cd: 10, target: 'aoe', gcdLen: 1, dmg: { weapon: true, bonus: [30, 30], perLvl: 1 }, desc: 'Throw knives at all nearby enemies for weapon damage plus {b}. 10 sec cooldown.' },
    cloak_of_shadows: { name: 'Cloak of Shadows', cls: 'rogue', lvl: 44, cost: 0, cd: 120, target: 'self', gcd: false, combatOnly: true, buff: { id: 'cloak_of_shadows', dur: 5, immune: true }, desc: 'A cloak of shadow makes you immune to all damage for 5 sec. 2 min cooldown.' },
    holy_shield: { name: 'Holy Shield', cls: 'paladin', lvl: 52, cost: 100, costPerLvl: 3, cd: 10, target: 'self', gcd: false, shield: { base: 500, perLvl: 14, coef: 0.2, dur: 10 }, threat: 2, desc: 'A holy barrier absorbs {s} damage for 10 sec. 10 sec cooldown.' },
    hammer_righteous: { name: 'Hammer of the Righteous', cls: 'paladin', lvl: 54, cost: 60, cd: 6, target: 'aoe', dmg: { weapon: true, bonus: [60, 60], perLvl: 1.4 }, threat: 1.5, desc: 'Strike all nearby enemies for weapon damage plus {b}. 6 sec cooldown.' },
    incinerate: { name: 'Incinerate', cls: 'warlock', lvl: 52, cost: 140, costPerLvl: 4, cd: 0, cast: 2.5, target: 'enemy', dmg: { base: [230, 270], perLvl: 5, coef: 0.7, school: 'fire' }, desc: 'Deals {b} Fire damage.' },
    demonic_sacrifice: { name: 'Demonic Sacrifice', cls: 'warlock', lvl: 54, cost: 0, cd: 300, target: 'self', gcd: false, combatOnly: true, buff: { id: 'demonic_sacrifice', dur: 30, stats: { sp: 90 }, perLvl: { sp: 1.5 } }, desc: 'Feed on demonic power: +{sp} spell power for 30 sec. 5 min cooldown.' },
    kill_command: { name: 'Kill Command', cls: 'hunter', lvl: 52, cost: 90, costPerLvl: 3, cd: 8, target: 'enemy', dmg: { base: [160, 160], perLvl: 4, rapCoef: 0.4, school: 'physical' }, desc: 'Command a killing blow for {b} damage. 8 sec cooldown.' },
    bestial_wrath: { name: 'Bestial Wrath', cls: 'hunter', lvl: 54, cost: 0, cd: 120, target: 'self', gcd: false, combatOnly: true, buff: { id: 'bestial_wrath', dur: 18, stats: { ap: 150, haste: 20 }, perLvl: { ap: 2 } }, desc: 'Go wild: +{ap} attack power and 20% faster attacks for 18 sec. 2 min cooldown.' },
    starfall: { name: 'Falling Stars', cls: 'druid', lvl: 52, cost: 200, costPerLvl: 4, cd: 60, target: 'aoe', dmg: { base: [180, 210], perLvl: 4, coef: 0.5, school: 'arcane' }, desc: 'Stars fall on all nearby enemies for {b} Arcane damage. 1 min cooldown.' },
    wild_growth: { name: 'Wild Growth', cls: 'druid', lvl: 54, cost: 180, costPerLvl: 4, cd: 6, target: 'ally', hot: { id: 'wild_growth', ticks: 7, every: 1, heal: 70, perLvl: 2, coef: 0.1 }, desc: 'Heals a friendly target for {hh} over 7 sec. 6 sec cooldown.' },
    earthquake: { name: 'Earthquake', cls: 'shaman', lvl: 52, cost: 200, costPerLvl: 4, cd: 10, cast: 2.5, target: 'aoe', dmg: { base: [170, 200], perLvl: 4, coef: 0.4, school: 'nature' }, desc: 'The ground shakes under all nearby enemies for {b} Nature damage. 10 sec cooldown.' },
    fire_elemental_totem: { name: 'Fire Elemental Totem', cls: 'shaman', lvl: 54, cost: 150, costPerLvl: 4, cd: 120, target: 'aoe', dmg: { base: [300, 340], perLvl: 6, coef: 0.4, school: 'fire' }, desc: 'A fire elemental bursts from the totem: {b} Fire damage to all nearby enemies. 2 min cooldown.' },
    // v8 (levels 56 and 58)
    bladestorm: { name: 'Bladestorm', cls: 'warrior', lvl: 56, cost: 25, cd: 90, target: 'aoe', dmg: { weapon: true, bonus: [140, 140], perLvl: 2.4 }, desc: 'Become a storm of steel: weapon damage plus {b} to all nearby enemies. 1.5 min cooldown.' },
    rallying_cry: { name: 'Rallying Cry', cls: 'warrior', lvl: 58, cost: 20, cd: 180, target: 'party', buff: { id: 'rallying_cry', dur: 10, stats: { sta: 60 }, perLvl: { sta: 1 } }, desc: 'Rally your party: +{sta} Stamina for 10 sec. 3 min cooldown.' },
    arcane_blast: { name: 'Arcane Blast', cls: 'mage', lvl: 56, cost: 160, costPerLvl: 4, cd: 0, cast: 2, target: 'enemy', dmg: { base: [260, 300], perLvl: 5, coef: 0.7, school: 'arcane' }, desc: 'Blasts the target for {b} Arcane damage.' },
    mirror_image: { name: 'Mirror Image', cls: 'mage', lvl: 58, cost: 90, cd: 120, target: 'self', gcd: false, combatOnly: true, dropThreat: true, desc: 'Copies of you draw the enemies away: all threat on you is lost. 2 min cooldown.' },
    penance: { name: 'Penance', cls: 'priest', lvl: 56, cost: 150, costPerLvl: 4, cd: 10, target: 'enemy', dmg: { base: [280, 320], perLvl: 5, coef: 0.6, school: 'holy' }, desc: 'Holy light strikes the target for {b} Holy damage. 10 sec cooldown.' },
    divine_hymn: { name: 'Divine Hymn', cls: 'priest', lvl: 58, cost: 200, cd: 180, target: 'ally', hot: { id: 'divine_hymn', ticks: 8, every: 1, heal: 180, perLvl: 4, coef: 0.2 }, desc: 'A hymn heals a friendly target for {hh} over 8 sec. 3 min cooldown.' },
    killing_spree: { name: 'Killing Spree', cls: 'rogue', lvl: 56, cost: 0, cd: 60, target: 'enemy', gcdLen: 1, dmg: { weapon: true, bonus: [220, 220], perLvl: 3 }, desc: 'A flurry of strikes for weapon damage plus {b}. 1 min cooldown.' },
    shadow_dance: { name: 'Shadow Dance', cls: 'rogue', lvl: 58, cost: 0, cd: 120, target: 'self', gcd: false, combatOnly: true, buff: { id: 'shadow_dance', dur: 8, stats: { ap: 200, haste: 20 }, perLvl: { ap: 2 } }, desc: 'Dance through the shadows: +{ap} attack power and faster attacks for 8 sec. 2 min cooldown.' },
    divine_storm: { name: 'Divine Storm', cls: 'paladin', lvl: 56, cost: 80, cd: 10, target: 'aoe', dmg: { weapon: true, bonus: [80, 80], perLvl: 1.8 }, desc: 'A holy storm hits all nearby enemies for weapon damage plus {b}. 10 sec cooldown.' },
    aura_mastery: { name: 'Aura Mastery', cls: 'paladin', lvl: 58, cost: 0, cd: 120, target: 'party', buff: { id: 'aura_mastery', dur: 10, stats: { armor: 800 }, perLvl: { armor: 15 } }, desc: 'Empower your aura: your party gains +{armor} armor for 10 sec. 2 min cooldown.' },
    haunt: { name: 'Haunt', cls: 'warlock', lvl: 56, cost: 120, costPerLvl: 3, cd: 8, cast: 1.5, target: 'enemy', dmg: { base: [200, 230], perLvl: 4, coef: 0.5, school: 'shadow' }, dot: { id: 'haunt', ticks: 4, every: 3, dmg: 40, perLvl: 1.2, school: 'shadow' }, desc: 'A ghostly soul strikes for {b} Shadow damage and haunts the target for {d} more. 8 sec cooldown.' },
    metamorphosis: { name: 'Metamorphosis', cls: 'warlock', lvl: 58, cost: 0, cd: 180, target: 'self', gcd: false, combatOnly: true, buff: { id: 'metamorphosis', dur: 30, stats: { sp: 80, armor: 1200 }, perLvl: { sp: 1.2 } }, desc: 'Become a demon: +{sp} spell power and much more armor for 30 sec. 3 min cooldown.' },
    chimera_shot: { name: 'Twinfang Shot', cls: 'hunter', lvl: 56, cost: 110, costPerLvl: 3, cd: 10, target: 'enemy', dmg: { base: [230, 230], perLvl: 5, rapCoef: 0.5, school: 'nature' }, desc: 'A shot for {b} Nature damage. 10 sec cooldown.' },
    rapid_killing: { name: 'Rapid Killing', cls: 'hunter', lvl: 58, cost: 0, cd: 120, target: 'self', gcd: false, combatOnly: true, buff: { id: 'rapid_killing', dur: 15, stats: { haste: 35, ap: 80 } }, desc: 'Shoot 35% faster with more attack power for 15 sec. 2 min cooldown.' },
    typhoon: { name: 'Typhoon', cls: 'druid', lvl: 56, cost: 180, costPerLvl: 4, cd: 20, target: 'aoe', dmg: { base: [200, 230], perLvl: 4, coef: 0.3, school: 'nature' }, stompAll: 2, desc: 'A wall of wind hits all nearby enemies for {b} Nature damage and stuns them for 2 sec. 20 sec cooldown.' },
    lifebloom: { name: 'Blossoming Life', cls: 'druid', lvl: 58, cost: 150, costPerLvl: 3, cd: 0, target: 'ally', hot: { id: 'lifebloom', ticks: 7, every: 1, heal: 90, perLvl: 2.5, coef: 0.12 }, desc: 'Heals a friendly target for {hh} over 7 sec.' },
    thunderstorm: { name: 'Thunderstorm', cls: 'shaman', lvl: 56, cost: 160, costPerLvl: 4, cd: 30, target: 'aoe', dmg: { base: [210, 240], perLvl: 4, coef: 0.3, school: 'nature' }, stompAll: 2, desc: 'Thunder hits all nearby enemies for {b} Nature damage, stunning them for 2 sec. 30 sec cooldown.' },
    bloodlust: { name: 'Bloodlust', cls: 'shaman', lvl: 58, cost: 150, cd: 300, target: 'party', buff: { id: 'bloodlust', dur: 20, stats: { haste: 30 } }, desc: 'Your party attacks and casts 30% faster for 20 sec. 5 min cooldown.' },
    shadowmeld: { name: 'Shadow Fade', racial: true, lvl: 1, cost: 0, cd: 120, target: 'self', gcd: false, combatOnly: true, dropThreat: true, desc: 'Fade into the shadows: enemies lose track of you and all your threat is wiped. 2 min cooldown.' },
    blood_fury: { name: 'Blood Fury', racial: true, lvl: 1, cost: 0, cd: 120, target: 'self', gcd: false, combatOnly: true, bloodFury: true, desc: 'Attack power +25% for 15 sec. 2 min cooldown.' },
    berserking: { name: 'Berserking', racial: true, lvl: 1, cost: 0, cd: 180, target: 'self', gcd: false, combatOnly: true, berserk: true, desc: 'Attack and casting speed +10% to +30%, more when you are hurt. 10 sec. 3 min cooldown.' },
    war_stomp: { name: 'War Stomp', racial: true, lvl: 1, cost: 0, cd: 120, target: 'self', gcd: false, combatOnly: true, stompAll: 2, desc: 'Stomps the ground, stunning nearby enemies for 2 sec. 2 min cooldown.' },
    will_forsaken: { name: 'Will of the Reclaimed', racial: true, lvl: 1, cost: 0, cd: 120, target: 'self', gcd: false, combatOnly: true, freeOf: 'stun', stunImmune: 5, desc: 'Breaks free of stuns and slows, and ignores new stuns for 5 sec. 2 min cooldown.' },
  };

  // ---- items: D.item(id, fields). Zone files add their own.
  D.ITEMS = {};
  D.item = (id, o) => { D.ITEMS[id] = Object.assign({ id }, o); };
  D.item('worn_shortsword', { name: 'Worn Shortsword', slot: 'weapon', wtype: 'sword', q: 1, lvl: 1, dmg: [2, 5], speed: 1.9, icon: 'sword', sell: 7 });
  D.item('bent_staff', { name: 'Bent Staff', slot: 'weapon', wtype: 'staff', q: 1, lvl: 1, dmg: [3, 5], speed: 2.9, icon: 'staff', sell: 9 });
  D.item('battered_mallet', { name: 'Battered Mallet', slot: 'weapon', wtype: 'mace', q: 1, lvl: 1, dmg: [2, 5], speed: 2, icon: 'mace', sell: 7 });
  D.item('worn_dagger', { name: 'Worn Dagger', slot: 'weapon', wtype: 'dagger', q: 1, lvl: 1, dmg: [1, 3], speed: 1.6, icon: 'dagger', sell: 7 });
  D.item('worn_axe', { name: 'Worn Axe', slot: 'weapon', wtype: 'axe', q: 1, lvl: 1, dmg: [2, 5], speed: 2.1, icon: 'axe', sell: 7 });
  D.item('worn_shortbow', { name: 'Worn Shortbow', slot: 'ranged', wtype: 'bow', q: 1, lvl: 1, dmg: [2, 5], speed: 2.3, icon: 'bow', sell: 7 });
  D.item('militia_longbow', { name: 'Militia Longbow', slot: 'ranged', wtype: 'bow', q: 2, lvl: 9, dmg: [10, 19], speed: 2.8, stats: { agi: 3 }, icon: 'bow', sell: 180, look: ['ranged', 'militia_longbow'], source: 'Quest: Wanted: Old Snaggle' });
  D.item('recruits_vest', { name: "Recruit's Vest", slot: 'chest', atype: 'mail', q: 1, lvl: 1, armor: 22, icon: 'chest_mail', sell: 1 });
  D.item('apprentice_robe', { name: "Apprentice's Robe", slot: 'chest', atype: 'cloth', q: 1, lvl: 1, armor: 5, icon: 'chest_cloth', sell: 1 });
  D.item('neophyte_robe', { name: "Neophyte's Robe", slot: 'chest', atype: 'cloth', q: 1, lvl: 1, armor: 5, icon: 'chest_cloth', sell: 1 });
  D.item('footpad_shirt', { name: "Footpad's Vest", slot: 'chest', atype: 'leather', q: 1, lvl: 1, armor: 12, icon: 'chest_leather', sell: 1 });
  D.item('hearthstone', { name: 'Waystone', slot: 'special', q: 1, lvl: 1, icon: 'hearthstone', noSell: true, desc: "Returns you to Bracken Arms Inn. 15 min cooldown." });
  D.item('tough_bread', { name: 'Tough Hunk of Bread', slot: 'food', q: 1, lvl: 1, restore: 61, icon: 'bread', sell: 1, cost: 5 });
  D.item('fresh_bread', { name: 'Freshly Baked Bread', slot: 'food', q: 1, lvl: 5, restore: 243, icon: 'bread', sell: 6, cost: 25 });
  D.item('spring_water', { name: 'Refreshing Spring Water', slot: 'drink', q: 1, lvl: 1, restore: 151, icon: 'water', sell: 1, cost: 5 });
  D.item('ice_milk', { name: 'Ice Cold Milk', slot: 'drink', q: 1, lvl: 5, restore: 436, icon: 'water', sell: 6, cost: 25 });
  D.item('ruined_pelt', { name: 'Ruined Pelt', slot: 'junk', q: 0, icon: 'pelt', sell: 4 });
  D.item('wolf_fang', { name: 'Chipped Fang', slot: 'junk', q: 0, icon: 'claw', sell: 3 });
  D.item('kobold_rag', { name: 'Dirty Kobold Rag', slot: 'junk', q: 0, icon: 'bandana', sell: 3 });
  D.item('broken_candle', { name: 'Melted Candle Stub', slot: 'junk', q: 0, icon: 'candle', sell: 5 });
  D.item('thieves_coin', { name: 'Tarnished Coin', slot: 'junk', q: 0, icon: 'coin', sell: 9 });
  D.item('murloc_eye', { name: 'Slimy Mireling Scale', slot: 'junk', q: 0, icon: 'fin', sell: 12 });
  D.item('bear_hide', { name: 'Thick Bear Fur', slot: 'junk', q: 0, icon: 'pelt', sell: 15 });
  D.item('gnoll_mane', { name: 'Matted Gnoll Mane', slot: 'junk', q: 0, icon: 'pelt', sell: 18 });
  D.item('linen_cloth', { name: 'Linen Cloth', slot: 'junk', q: 1, icon: 'bandana', sell: 5 });
  D.item('pumpkin', { name: 'Stolen Pumpkin', slot: 'junk', q: 0, icon: 'grapes', sell: 20 });
  D.item('wolf_meat', { name: 'Tough Wolf Meat', slot: 'quest', q: 1, icon: 'meat' });
  D.item('vancleef_head', { name: 'Head of Blackwell', slot: 'quest', q: 1, icon: 'head' });
  D.item('militia_shortsword', { name: 'Militia Shortsword', slot: 'weapon', wtype: 'sword', q: 2, lvl: 9, dmg: [8, 16], speed: 2.1, stats: { str: 2, sta: 1 }, icon: 'sword', sell: 180, look: ['weapon', 'militia_sword'], source: 'Quest: Wanted: Old Snaggle' });
  D.item('militia_dagger', { name: 'Militia Dagger', slot: 'weapon', wtype: 'dagger', q: 2, lvl: 9, dmg: [6, 11], speed: 1.6, stats: { agi: 3 }, icon: 'dagger', sell: 170, look: ['weapon', 'militia_dagger'], source: 'Quest: Wanted: Old Snaggle' });
  D.item('militia_staff', { name: 'Militia Quarterstaff', slot: 'weapon', wtype: 'staff', q: 2, lvl: 9, dmg: [13, 20], speed: 3, stats: { int: 4, spi: 3 }, sp: 6, icon: 'staff', sell: 190, look: ['weapon', 'militia_staff'], source: 'Quest: Wanted: Old Snaggle' });
  D.item('militia_hammer', { name: 'Militia Warhammer', slot: 'weapon', wtype: 'mace', q: 2, lvl: 9, dmg: [8, 15], speed: 2.3, stats: { int: 2, spi: 2 }, sp: 4, icon: 'mace', sell: 180, look: ['weapon', 'militia_hammer'], source: 'Quest: Wanted: Old Snaggle' });
  D.item('defias_armor', { name: 'Blackened Grey Hood Armor', slot: 'chest', atype: 'leather', q: 3, lvl: 21, armor: 119, stats: { agi: 8, sta: 5 }, icon: 'chest_leather', sell: 1540, look: ['chest', 'defias_armor'], set: 'defias', source: 'Corvin Blackwell, The Smugglers\' Deep' });
  D.item('defias_leggings', { name: 'Blackened Grey Hood Leggings', slot: 'legs', atype: 'leather', q: 3, lvl: 19, armor: 96, stats: { agi: 6, sta: 5 }, icon: 'legs', sell: 1540, look: ['legs', 'defias_leggings'], set: 'defias', source: 'Gimble, The Smugglers\' Deep' });
  D.item('defias_boots', { name: 'Blackened Grey Hood Boots', slot: 'feet', atype: 'leather', q: 3, lvl: 19, armor: 70, stats: { agi: 5, sta: 5 }, icon: 'boots', sell: 1320, set: 'defias', source: "Snork's Shredder, The Smugglers' Deep" });
  D.item('defias_belt', { name: 'Blackened Grey Hood Belt', slot: 'waist', atype: 'leather', q: 3, lvl: 18, armor: 50, stats: { agi: 5, sta: 3 }, icon: 'belt', sell: 1100, set: 'defias', source: "Rukko the Foreman, The Smugglers' Deep" });
  D.item('troll_tusk', { name: 'Grimtooth Tusk', slot: 'junk', q: 0, icon: 'claw', sell: 11 });
  D.item('trogg_stone', { name: 'Gravelmaw Pebble', slot: 'junk', q: 0, icon: 'dust', sell: 3 });
  D.item('thunder_ale', { name: 'Thunder Ale', slot: 'drink', q: 1, lvl: 5, restore: 436, icon: 'keg', sell: 6, cost: 25 });
  D.item('grell_earring', { name: 'Thornling Earring', slot: 'junk', q: 0, icon: 'ring', sell: 6 });
  D.item('furbolg_charm', { name: 'Mossback Charm', slot: 'junk', q: 0, icon: 'claw', sell: 14 });
  D.item('moonberry_juice', { name: 'Starberry Juice', slot: 'drink', q: 1, lvl: 5, restore: 436, icon: 'water', sell: 6, cost: 25 });
  D.item('boar_tusk', { name: 'Mottled Tusk', slot: 'junk', q: 0, icon: 'tusk', sell: 4 });
  D.item('troll_trinket', { name: 'Hexed Trinket', slot: 'junk', q: 0, icon: 'voodoo_doll', sell: 12 });
  D.item('horde_bread', { name: 'Haunch of Meat', slot: 'food', q: 1, lvl: 5, restore: 243, icon: 'meat', sell: 6, cost: 25 });
  D.item('quilboar_tusk', { name: 'Spinehide Tusk', slot: 'junk', q: 0, icon: 'quilboar_tusk', sell: 8 });
  D.item('mulgore_bread', { name: 'Greensward Spice Bread', slot: 'food', q: 1, lvl: 5, restore: 243, icon: 'bread', sell: 6, cost: 25 });
  D.item('rotting_flesh', { name: 'Rotting Flesh', slot: 'junk', q: 0, icon: 'zombie_brain', sell: 5 });
  D.item('tirisfal_pumpkin', { name: 'Pallmoor Pumpkin', slot: 'food', q: 1, lvl: 5, restore: 243, icon: 'grapes', sell: 6, cost: 25 });
  D.item('moist_cornbread', { name: 'Buttered Cornbread', slot: 'food', q: 1, lvl: 10, restore: 552, icon: 'bread', sell: 12, cost: 50 });
  D.item('mutton_chop', { name: 'Mutton Chop', slot: 'food', q: 1, lvl: 15, restore: 874, icon: 'meat', sell: 20, cost: 80 });
  D.item('sweet_nectar', { name: 'Sweet Nectar', slot: 'drink', q: 1, lvl: 15, restore: 1344, icon: 'water', sell: 20, cost: 80 });
  D.item('wild_hog_shank', { name: 'Wild Hog Shank', slot: 'food', q: 1, lvl: 22, restore: 1152, icon: 'meat', sell: 30, cost: 120 });
  D.item('morning_glory_dew', { name: 'Morning Glory Dew', slot: 'drink', q: 1, lvl: 22, restore: 1800, icon: 'water', sell: 30, cost: 120 });
  D.item('roasted_boar', { name: 'Roasted Boar Meat', slot: 'food', q: 1, lvl: 27, restore: 1392, icon: 'meat', sell: 40, cost: 160 });
  D.item('sparkling_water', { name: 'Sparkling Spring Water', slot: 'drink', q: 1, lvl: 27, restore: 2148, icon: 'water', sell: 40, cost: 160 });
  D.item('spiced_jungle_meat', { name: 'Spiced Jungle Meat', slot: 'food', q: 1, lvl: 32, restore: 1632, icon: 'meat', sell: 55, cost: 220 });
  D.item('bubbling_water', { name: 'Bubbling Water', slot: 'drink', q: 1, lvl: 32, restore: 2556, icon: 'water', sell: 55, cost: 220 });
  D.item('hardened_mushroom', { name: 'Hardened Mushroom', slot: 'food', q: 1, lvl: 37, restore: 1932, icon: 'bread', sell: 70, cost: 280 });
  D.item('moonberry_cordial', { name: 'Starberry Cordial', slot: 'drink', q: 1, lvl: 37, restore: 2934, icon: 'water', sell: 70, cost: 280 });
  D.item('smoked_desert_dumplings', { name: 'Smoked Desert Dumplings', slot: 'food', q: 1, lvl: 45, restore: 2148, icon: 'bread', sell: 90, cost: 360 });
  D.item('sweet_nectar_45', { name: 'Morning Glory Cordial', slot: 'drink', q: 1, lvl: 45, restore: 3600, icon: 'water', sell: 90, cost: 360 });
  D.item('cured_ham_steak', { name: 'Cured Ham Steak', slot: 'food', q: 1, lvl: 52, restore: 2550, icon: 'meat', sell: 110, cost: 440 });
  D.item('morning_glory_60', { name: 'Morning Glory Dew', slot: 'drink', q: 1, lvl: 52, restore: 4410, icon: 'water', sell: 110, cost: 440 });
  D.item('sweet_roll_60', { name: 'Homemade Cherry Pie', slot: 'food', q: 1, lvl: 57, restore: 3000, icon: 'bread', sell: 130, cost: 520 });
  D.item('spring_water_60', { name: 'Sparkling Seacombe Cider', slot: 'drink', q: 1, lvl: 57, restore: 5100, icon: 'water', sell: 130, cost: 520 });
  D.item('melon_juice', { name: 'Melon Juice', slot: 'drink', q: 1, lvl: 10, restore: 835, icon: 'water', sell: 12, cost: 50 });
  D.item('pool_water', { name: 'Forgotten Pool Water', slot: 'quest', q: 1, icon: 'water' });

  D.SETS = { defias: { name: 'Blackened Grey Hood', pieces: 4, mask: 3 } };

  // ---- random gear
  D.AFFIXES = [{ name: 'of the Bear', stats: { str: 1, sta: 1 } }, { name: 'of the Tiger', stats: { str: 1, agi: 1 } }, { name: 'of the Monkey', stats: { agi: 1, sta: 1 } }, { name: 'of the Eagle', stats: { sta: 1, int: 1 } }, { name: 'of the Owl', stats: { int: 1, spi: 1 } }, { name: 'of the Whale', stats: { sta: 1, spi: 1 } }, { name: 'of the Falcon', stats: { agi: 1, int: 1 } }, { name: 'of Strength', stats: { str: 2 } }, { name: 'of Agility', stats: { agi: 2 } }, { name: 'of Intellect', stats: { int: 2 } }, { name: 'of Stamina', stats: { sta: 2 } }, { name: 'of Spirit', stats: { spi: 2 } }];

  D.GEAR_BASES = {
    cloth: { mats: ['Linen', 'Soft', 'Woolen'], grey: ['Frayed', 'Tattered'], arm: 0.25 },
    leather: { mats: ['Handstitched', 'Rawhide', 'Rough Leather'], grey: ['Worn', 'Cracked'], arm: 0.55 },
    mail: { mats: ['Chainmail', 'Ringed', 'Rusted'], grey: ['Dented', 'Battered'], arm: 1 },
  };

  D.SLOT_NAMES = {
    chest: ['Tunic', 'Vest', 'Robe'],
    legs: ['Pants', 'Leggings'],
    feet: ['Boots', 'Shoes'],
    hands: ['Gloves', 'Handwraps'],
    wrist: ['Bracers', 'Cuffs'],
    waist: ['Belt', 'Sash'],
    back: ['Cloak', 'Cape'],
    finger: ['Band', 'Ring'],
  };

  D.SLOT_ARMOR = { chest: 8, legs: 7, feet: 5, hands: 4, wrist: 3, waist: 4, back: 3, finger: 0 };

  D.WEAPON_BASES = {
    sword: { names: ['Shortsword', 'Broadsword', 'Blade'], speed: 2.2, icon: 'sword' },
    axe: { names: ['Hatchet', 'Handaxe'], speed: 2.4, icon: 'axe' },
    mace: { names: ['Mallet', 'Cudgel', 'Hammer'], speed: 2.3, icon: 'mace' },
    dagger: { names: ['Dirk', 'Knife', 'Stiletto'], speed: 1.6, icon: 'dagger' },
    staff: { names: ['Staff', 'Quarterstaff', 'Walking Stick'], speed: 3, icon: 'staff' },
    bow: { names: ['Shortbow', 'Longbow', 'Recurve Bow'], speed: 2.6, icon: 'bow' },
  };

  D.GEAR_SLOTS = ['weapon', 'ranged', 'chest', 'legs', 'feet', 'hands', 'wrist', 'waist', 'back', 'finger'];
  D.SLOT_LABEL = { weapon: 'Main Hand', ranged: 'Ranged', chest: 'Chest', legs: 'Legs', feet: 'Feet', hands: 'Hands', wrist: 'Wrist', waist: 'Waist', back: 'Back', finger: 'Finger' };
  D.SLOT_ICON = { chest: null, legs: 'legs', feet: 'boots', hands: 'gloves', wrist: 'bracers', waist: 'belt', back: 'cloak', finger: 'ring' };

  // ---- Help Wanted rewards (v2.3): Mentor Marks buy account-wide heirlooms that scale with your level
  // Each heirloom piece also gives +5% experience (up to 3 pieces). base: the item's shape at level 1.
  D.HEIRLOOMS = {
    heirloom_blade: { name: 'Veteran\'s Blade', slot: 'weapon', wtype: 'sword', speed: 2.4, stat: ['str', 'agi'], cost: 60, icon: 'sword' },
    heirloom_hammer: { name: 'Veteran\'s Hammer', slot: 'weapon', wtype: 'mace', speed: 2.6, stat: ['str', 'sta'], cost: 60, icon: 'mace' },
    heirloom_staff: { name: 'Veteran\'s Staff', slot: 'weapon', wtype: 'staff', speed: 3.0, stat: ['int', 'spi'], sp: true, cost: 60, icon: 'staff' },
    heirloom_dagger: { name: 'Veteran\'s Dirk', slot: 'weapon', wtype: 'dagger', speed: 1.7, stat: ['agi', 'sta'], cost: 60, icon: 'dagger' },
    heirloom_bow: { name: 'Veteran\'s Longbow', slot: 'ranged', wtype: 'bow', speed: 2.8, stat: ['agi', 'sta'], cost: 50, icon: 'bow' },
    heirloom_cloak: { name: 'Veteran\'s Cloak', slot: 'back', stat: ['sta', 'agi'], cost: 40, icon: 'cloak' },
    heirloom_ring: { name: 'Veteran\'s Band', slot: 'finger', stat: ['sta', 'int'], cost: 40, icon: 'ring' },
  };
  // Gear upgrades (v10.3): Mentor Marks raise a level-57+ blue or purple item one step at a time. A step adds 3% of the
  // ceiling (the power of the item's own family in the ceiling raid's loot); purples stop at 100% of it, blues at 92%.
  // A new raid moves `raid` to itself, which gives every older item room to climb. An item keeps the power it reached. Design:
  // docs/plans/2026-09-30-horizontal-progression-design.md
  // Step Back (v10.9, distance): every class can hop 8 m away from the nearest enemy; it is how you kite after a freeze.
  // No global cooldown, so it can follow a spell. It joins the action bar with the one-on-one AI (distance stage 3).
  D.ABILITIES.step_back = { id: 'step_back', name: 'Step Back', cls: 'all', lvl: 1, cost: 0, cd: 12, gcd: false, target: 'self', combatOnly: true, stepBack: 8, icon: 'boots',
    desc: 'Hop 8 m back from the nearest enemy. Melee attacks cannot reach you until it closes in again. 12 sec cooldown.' };
  // Reactions (v10.4): an event can light an ability for a few seconds. `on`: hit (a spell or attack of `from` lands),
  // melee (a weapon hit), crit (a critical hit of `from`), autoshot, tick (a damage-over-time tick of `from`), avoided
  // (your attack dodged or missed), dodged (you dodged an enemy's attack), cp5 (5 combo points). minLvl: a second,
  // mid-game reaction starts at that level. icd: at most one light per so many seconds. A lit ability may be free, instant, or have its cooldown reset; using it
  // spends the light. `tell` is the callout over your character; `teach` the one-time card that explains it.
  D.PROCS = {
    warrior: [
      { on: ['avoided', 'dodged'], aura: 'overpower_ready', dur: 5, icd: 8, lights: ['overpower'], name: 'Overpower', tell: 'Overpower is ready!', teach: 'When an attack is dodged or missed (yours or an enemy\'s), Overpower lights up for 5 seconds. Tap it while it glows: a strong strike that can only be used then.' },
      { on: ['melee'], from: ['heroic_strike', 'cleave'], chance: 0.2, minLvl: 34, aura: 'battle_fury', dur: 8, lights: ['slam'], instant: true, free: true, name: 'Battle Fury', tell: 'Battle Fury! Slam is instant and free', teach: 'Battle Fury: Heroic Strike and Cleave can make your next Slam instant and free. Tap it while it glows.' }],
    mage: [
      { on: ['hit'], from: ['fireball'], chance: 0.3, aura: 'ember_spark', dur: 8, lights: ['fire_blast'], reset: true, free: true, name: 'Ember Spark', tell: 'Ember Spark! Fire Blast is free', teach: 'Ember Spark: when Fireball hits, Fire Blast can light up. It is ready at once and costs no mana. Tap it while it glows.' },
      { on: ['crit'], from: ['fireball', 'scorch', 'fire_blast'], minLvl: 34, aura: 'blaze_heart', dur: 10, lights: ['pyroblast'], reset: true, instant: true, free: true, name: 'Blaze Heart', tell: 'Blaze Heart! Instant Inferno Blast', teach: 'Blaze Heart: a critical hit with Fireball, Scorch or Fire Blast makes your next Inferno Blast instant, free and ready. Tap it while it glows.' }],
    priest: [
      { on: ['hit'], from: ['smite'], chance: 0.25, aura: 'dawnlight', dur: 8, lights: ['smite', 'lesser_heal'], instant: true, name: 'Dawnlight', tell: 'Dawnlight! Next Smite or heal is instant', teach: 'Dawnlight: when Smite hits, your next Smite or Lesser Heal can become instant, no cast time. Tap one while they glow.' },
      { on: ['tick'], from: ['sw_pain'], chance: 0.15, minLvl: 26, aura: 'dark_thoughts', dur: 8, lights: ['mind_blast'], reset: true, instant: true, name: 'Dark Thoughts', tell: 'Dark Thoughts! Mind Blast is ready', teach: 'Dark Thoughts: while Word of Pain hurts an enemy, Mind Blast can become ready and instant. Tap it while it glows.' }],
    rogue: [
      { on: ['cp5'], lights: ['eviscerate'], name: 'Full combo', tell: '5 combo points! Eviscerate', teach: 'At 5 combo points Eviscerate glows: that is when it hits hardest. Build points with Sinister Strike, then spend them.' },
      { on: ['melee'], from: ['sinister_strike'], chance: 0.2, minLvl: 24, aura: 'blade_rush', dur: 8, lights: ['eviscerate'], free: true, name: 'Blade Rush', tell: 'Blade Rush! Eviscerate costs no energy', teach: 'Blade Rush: Sinister Strike can make your next Eviscerate cost no energy. Spend it while it glows.' }],
    paladin: [
      { on: ['melee'], chance: 0.2, aura: 'fervor', dur: 6, lights: ['judgement'], reset: true, name: 'Fervor', tell: 'Fervor! Verdict is ready', teach: 'Fervor: your weapon hits can make Verdict ready again at once. Tap it while it glows.' },
      { on: ['hit'], from: ['judgement'], chance: 0.3, minLvl: 26, aura: 'holy_momentum', dur: 8, lights: ['exorcism'], reset: true, free: true, name: 'Holy Momentum', tell: 'Holy Momentum! Exorcism is free', teach: 'Holy Momentum: Verdict can make Exorcism ready at once and free. Tap it while it glows.' }],
    warlock: [
      { on: ['tick'], from: ['corruption', 'immolate'], chance: 0.12, aura: 'dark_tide', dur: 10, lights: ['shadow_bolt'], instant: true, name: 'Dark Tide', tell: 'Dark Tide! Instant Shadow Bolt', teach: 'Dark Tide: while Corruption or Immolate burns an enemy, your next Shadow Bolt can become instant. Tap it while it glows.' },
      { on: ['tick'], from: ['immolate'], chance: 0.15, minLvl: 34, aura: 'kindled_ruin', dur: 8, lights: ['conflagrate'], reset: true, free: true, name: 'Kindled Ruin', tell: 'Kindled Ruin! Conflagrate is free', teach: 'Kindled Ruin: while Immolate burns an enemy, Conflagrate can become ready at once and free. Tap it while it glows.' }],
    hunter: [
      { on: ['autoshot'], chance: 0.15, aura: 'swift_quiver', dur: 8, lights: ['arcane_shot'], reset: true, free: true, name: 'Swift Quiver', tell: 'Swift Quiver! Arcane Shot is free', teach: 'Swift Quiver: your auto shots can light up Arcane Shot. It is ready at once and costs no mana. Tap it while it glows.' },
      { on: ['hit'], from: ['arcane_shot'], chance: 0.3, minLvl: 28, aura: 'steady_aim', dur: 8, lights: ['aimed_shot'], reset: true, instant: true, name: 'Steady Aim', tell: 'Steady Aim! Instant Aimed Shot', teach: 'Steady Aim: Arcane Shot can make your next Aimed Shot instant and ready. Tap it while it glows.' }],
    druid: [
      { on: ['tick'], from: ['moonfire'], chance: 0.15, aura: 'groves_grace', dur: 10, lights: ['wrath'], instant: true, name: 'Grove\'s Grace', tell: 'Grove\'s Grace! Instant Wrath', teach: 'Grove\'s Grace: while Moonbeam burns an enemy, your next Wrath can become instant. Tap it while it glows.' },
      { on: ['hit'], from: ['wrath'], chance: 0.2, minLvl: 24, aura: 'moonrise', dur: 8, lights: ['starfire'], instant: true, name: 'Moonrise', tell: 'Moonrise! Instant Star Bolt', teach: 'Moonrise: Wrath can make your next Star Bolt instant. Tap it while it glows.' }],
    shaman: [
      { on: ['hit'], from: ['lightning_bolt'], chance: 0.25, aura: 'stormcall', dur: 8, lights: ['earth_shock'], reset: true, free: true, name: 'Stormcall', tell: 'Stormcall! Earth Shock is free', teach: 'Stormcall: when Lightning Bolt hits, Earth Shock can light up. It is ready at once and costs no mana. Tap it while it glows.' },
      { on: ['hit'], from: ['lightning_bolt'], chance: 0.2, minLvl: 26, aura: 'thunderhead', dur: 8, lights: ['chain_lightning'], reset: true, instant: true, free: true, name: 'Thunderhead', tell: 'Thunderhead! Instant Chain Lightning', teach: 'Thunderhead: Lightning Bolt can make your next Chain Lightning instant, free and ready. Tap it while it glows.' }],
  };
  // Talent reactions (v10.4): each talent tree's capstone also brings a reaction of its own (`talent`), so a level-60
  // build changes which buttons light up, not only its numbers. When the tree's late ability is not learned yet, the
  // first ability in `lights` that is known lights instead.
  const TR = (cls, list) => { D.PROCS[cls] = (D.PROCS[cls] || []).concat(list); };
  const R = (talent, name, on, from, chance, lights, eff, tell, teach) => Object.assign({ talent, name, on, from, chance, aura: 'cap_' + talent, dur: 8, lights, tell, teach }, eff);
  TR('warrior', [
    R('sweeping_strikes', 'Sweeping Blows', ['melee', 'hit'], ['cleave', 'thunder_clap'], 0.35, ['whirlwind'], { reset: true, free: true }, 'Sweeping Blows! Whirlwind is ready', 'Sweeping Blows (Arms): Cleave and Thunder Clap can make Whirlwind ready at once and free.'),
    R('death_wish', 'Blood Frenzy', ['crit'], null, 0.5, ['heroic_strike'], { free: true }, 'Blood Frenzy! Free Heroic Strike', 'Blood Frenzy (Fury): your critical hits can make your next Heroic Strike cost no rage.'),
    R('shield_wall', 'Unyielding', ['dodged'], null, 0.6, ['shield_slam', 'shield_block'], { reset: true, free: true }, 'Unyielding! Shield Slam is ready', 'Unyielding (Protection): when you dodge, Shield Slam (or Shield Block before you learn it) becomes ready at once and free.')]);
  TR('mage', [
    R('arcane_power', 'Arcane Surge', ['crit'], null, 1, ['arcane_missiles'], { free: true }, 'Arcane Surge! Free Arcane Missiles', 'Arcane Surge (Arcane): any critical hit makes your next Arcane Missiles cost no mana.'),
    R('combustion', 'Wildfire', ['hit'], ['fire_blast'], 0.5, ['scorch'], { instant: true, free: true }, 'Wildfire! Instant Scorch', 'Wildfire (Fire): Fire Blast can make your next Scorch instant and free.'),
    R('ice_barrier', 'Frostbite', ['hit'], ['frostbolt'], 0.25, ['cone_of_cold'], { reset: true, free: true }, 'Frostbite! Cone of Cold is ready', 'Frostbite (Frost): Frostbolt can make Cone of Cold ready at once and free.')]);
  TR('priest', [
    R('power_infusion', 'Steady Grace', ['heal'], ['lesser_heal', 'heal', 'flash_heal'], 0.2, ['penance', 'pw_shield'], { reset: true, instant: true }, 'Steady Grace! Penance is ready', 'Steady Grace (Discipline): your heals can make Penance (or Word of Warding before you learn it) ready at once.'),
    R('inspiration', 'Answered Prayer', ['heal'], ['flash_heal', 'heal'], 0.3, ['greater_heal', 'heal'], { instant: true }, 'Answered Prayer! Instant big heal', 'Answered Prayer (Holy): Flash Heal and Heal can make your next Greater Heal instant.'),
    R('shadowform', 'Creeping Dark', ['tick'], ['sw_pain'], 0.12, ['mind_flay'], { free: true }, 'Creeping Dark! Free Mind Flay', 'Creeping Dark (Shadow): while Word of Pain hurts an enemy, your next Mind Flay can cost no mana.')]);
  TR('rogue', [
    R('relentless_strikes', 'Cold Edge', ['hit'], ['eviscerate'], 0.6, ['sinister_strike'], { free: true }, 'Cold Edge! Free Sinister Strike', 'Cold Edge (Assassination): Eviscerate can make your next Sinister Strike cost no energy.'),
    R('blade_flurry', 'Blade Dance', ['melee'], null, 0.12, ['killing_spree', 'ghostly_strike'], { reset: true }, 'Blade Dance! Killing Spree is ready', 'Blade Dance (Combat): your weapon hits can make Killing Spree (or Ghostly Strike before you learn it) ready at once.'),
    R('preparation', 'Quiet Blade', ['dodged'], null, 0.5, ['backstab'], { free: true }, 'Quiet Blade! Free Backstab', 'Quiet Blade (Subtlety): when you dodge, your next Backstab costs no energy.')]);
  TR('paladin', [
    R('divine_favor', 'Radiance', ['heal'], ['holy_light'], 0.3, ['holy_shock'], { reset: true, free: true }, 'Radiance! Holy Shock is ready', 'Radiance (Holy): Holy Light can make Holy Shock ready at once and free.'),
    R('blessing_sanctuary', 'Bulwark', ['dodged'], null, 0.5, ['holy_shield', 'consecration'], { reset: true, free: true }, 'Bulwark! Holy Shield is ready', 'Bulwark (Protection): when you dodge, Holy Shield (or Consecration before you learn it) becomes ready at once and free.'),
    R('vengeance', 'Vengeful Strike', ['crit'], null, 0.6, ['crusader_strike', 'exorcism'], { reset: true }, 'Vengeful Strike! Zealot Strike is ready', 'Vengeful Strike (Retribution): your critical hits can make Zealot Strike (or Exorcism before you learn it) ready at once.')]);
  TR('warlock', [
    R('amplify_curse', 'Withering', ['tick'], ['curse_of_agony'], 0.12, ['haunt', 'corruption'], { reset: true, instant: true }, 'Withering! Haunt is ready', 'Withering (Affliction): while Curse of Agony hurts an enemy, Haunt (or an instant Corruption before you learn it) can light up.'),
    R('soul_link', 'Soulfire Rush', ['hit'], ['shadow_bolt'], 0.2, ['soul_fire'], { reset: true, instant: true }, 'Soulfire Rush! Instant Soul Fire', 'Soulfire Rush (Demonology): Shadow Bolt can make your next Soul Fire instant and ready.'),
    R('ruin', 'Ruinous Flame', ['crit'], ['shadow_bolt', 'incinerate', 'searing_pain'], 1, ['shadowburn'], { reset: true, free: true }, 'Ruinous Flame! Shadowburn is ready', 'Ruinous Flame (Destruction): a critical Shadow Bolt, Incinerate or Searing Pain makes Shadowburn ready at once and free.')]);
  TR('hunter', [
    R('bestial_wrath', 'Pack Call', ['autoshot'], null, 0.12, ['kill_command', 'multi_shot'], { reset: true, free: true }, 'Pack Call! Kill Command is ready', 'Pack Call (Beast Mastery): your auto shots can make Kill Command (or Multi-Shot before you learn it) ready at once and free.'),
    R('trueshot', 'Dead Aim', ['crit'], ['arcane_shot', 'aimed_shot'], 1, ['chimera_shot', 'aimed_shot'], { reset: true, instant: true }, 'Dead Aim! Twinfang Shot is ready', 'Dead Aim (Marksmanship): a critical Arcane or Aimed Shot makes Twinfang Shot (or an instant Aimed Shot before you learn it) ready.'),
    R('deterrence', 'Quick Reflexes', ['dodged'], null, 0.6, ['counterattack', 'raptor_strike'], { reset: true, free: true }, 'Quick Reflexes! Counterattack', 'Quick Reflexes (Survival): when you dodge, Counterattack (or Savage Strike before you learn it) becomes ready at once and free.')]);
  TR('druid', [
    R('moonkin', 'Night Sky', ['crit'], ['wrath', 'starfire'], 1, ['starfall', 'hurricane'], { reset: true, free: true }, 'Night Sky! Falling Stars is ready', 'Night Sky (Balance): a critical Wrath or Star Bolt makes Falling Stars (or Hurricane before you learn it) ready at once and free.'),
    R('heart_wild', 'Wild Heart', ['dodged'], null, 0.4, ['frenzied_regeneration'], { reset: true }, 'Wild Heart! Frenzied Regeneration', 'Wild Heart (Feral): when you dodge, Frenzied Regeneration can become ready at once.'),
    R('natures_swiftness', 'Clear Stream', ['heal'], ['rejuvenation', 'regrowth'], 0.08, ['healing_touch'], { instant: true }, 'Clear Stream! Instant Healing Touch', 'Clear Stream (Restoration): Rejuvenation and Regrowth can make your next Healing Touch instant.')]);
  TR('shaman', [
    R('elemental_fury', 'Molten Fury', ['crit'], ['lightning_bolt', 'chain_lightning'], 1, ['earthquake', 'flame_shock'], { reset: true, free: true }, 'Molten Fury! Earthquake is ready', 'Molten Fury (Elemental): a critical Lightning Bolt or Chain Lightning makes Earthquake (or Flame Shock before you learn it) ready at once and free.'),
    R('flurry', 'Storm Surge', ['melee'], null, 0.15, ['stormstrike'], { reset: true, free: true }, 'Storm Surge! Storm Blade is ready', 'Storm Surge (Enhancement): your weapon hits can make Storm Blade ready at once and free.'),
    R('healing_way', 'Tidal Surge', ['heal'], ['healing_wave', 'lesser_healing_wave'], 0.25, ['chain_heal'], { instant: true, free: true }, 'Tidal Surge! Instant Chain Heal', 'Tidal Surge (Restoration): Healing Wave can make your next Chain Heal instant and free.')]);
  D.UPGRADE = { raid: 'tidecrown_citadel', step: 0.03, cap: { 3: 0.92, 4: 1 }, minLvl: 57, perPct: 5 }; // 5 Mentor Marks per 1% of the ceiling gained, so a step costs 15
  // Titles show next to your name. `need` is checked against your records (see G.titleUnlocked).
  // Honor ranks (v10.10, #57, docs/plans/2026-10-03-honor-ranks-design.md): eight ranks from lifetime Honor, per faction,
  // each a title. No decay and no spending. Ranks 1-4 keep the old titles' thresholds (and ids pvp1-pvp4, so saves keep
  // what they earned, under the new name); 5-8 are PROVISIONAL until the balance analyst's Honor-pace numbers (#57: rank
  // 8 at about 30 hours of PvP at level 60). Looks at ranks 3, 5 and 8 (the rank looks below). title: where the name
  // goes ('%s' is the character's name)
  D.HONOR_RANKS = [
    { at: 100, alliance: 'Recruit %s', horde: 'Whelp %s' },
    { at: 500, alliance: 'Shieldbearer %s', horde: 'Bloodied %s' },
    { at: 1500, alliance: 'Banneret %s', horde: 'Raider %s', look: 'tabard' },
    { at: 4000, alliance: 'Lancer %s', horde: 'Tusker %s' },
    { at: 8000, alliance: '%s, Warden of the Line', horde: 'Ironhide %s', look: 'cloak' },
    { at: 15000, alliance: 'Lantern Captain %s', horde: 'Warbringer %s' },
    { at: 26000, alliance: 'High Guard %s', horde: 'Skullbearer %s' },
    { at: 42000, alliance: '%s, Lord of the Accord', horde: '%s, Hand of the Krugar', look: 'banner' },
  ];
  // the rank looks: worn on the back, in each faction's colours, collected account-wide when a character of that faction
  // reaches the rank (G.honorLooks); a look only, no stats. faction: only that faction's characters may show it
  for (const [f, names] of [['alliance', ["Banneret's Tabard", 'Cloak of the Line', 'War Banner of the Accord']], ['horde', ["Raider's Tabard", 'Ironhide Cloak', 'War Banner of the Krugar']]]) {
    let n = 0;
    D.HONOR_RANKS.forEach((r, i) => { if (!r.look) return; const id = `honor_${f}_${r.look}`;
      D.item(id, { name: names[n++], slot: 'back', q: 4, lvl: i + 1, look: ['back', id], lookOnly: true, faction: f, icon: r.look === 'banner' ? 'honor_banner_' + f : r.look === 'tabard' ? 'honor_tabard_' + f : 'cloak', source: `Honor rank ${i + 1}` }); });
  }
  D.TITLES = [
    { id: 'tried', name: '%s the Tried', need: { trial: 10 }, how: 'Beat par in a Trial 10' },
    { id: 'unbroken', name: '%s the Unbroken', need: { trial: 15 }, how: 'Beat par in a Trial 15' },
    { id: 'trialmaster', name: 'Trialmaster %s', need: { trial: 20 }, how: 'Beat par in a Trial 20' },
    { id: 'realm_ten', name: '%s of the Ten', need: { trialRank: 10 }, how: 'Finish a month of Trials in your realm\'s top 10' },
    { id: 'realm_first', name: 'Champion %s', need: { trialRank: 1 }, how: 'Finish a month of Trials first on your realm' },
    { id: 'mentor', name: '%s the Mentor', need: { mentor: 5 }, how: 'Help 5 groups through Help Wanted' },
    { id: 'guide', name: '%s the Guide', need: { mentor: 25 }, how: 'Help 25 groups through Help Wanted' },
    { id: 'flawless', name: '%s the Flawless', need: { flawless: 10 }, how: 'Clear dungeons without a wipe 10 times' },
    { id: 'swift', name: '%s the Swift', need: { speed: 10 }, how: 'Beat par time 10 times' },
    // the Honor ranks (#57): one title per rank, from D.HONOR_RANKS below (ids pvp1..pvp8; pvp1-4 are the old titles renamed)
    ...D.HONOR_RANKS.map((r, i) => ({ id: 'pvp' + (i + 1), name: r.alliance, horde: r.horde, need: { honor: r.at }, how: `Reach Honor rank ${i + 1} (${r.at.toLocaleString('en-US')} Honor)`, rank: i + 1 })),
    { id: 'defender', name: '%s, Defender of the Realm', horde: '%s, Defender of the Krugar', need: { kills: 50 }, how: 'Defeat 50 enemy players' },
    { id: 'biggame', name: '%s the Big-Game Hunter', need: { trophies: 10 }, how: 'Take 10 trophies from level-60 rares and world bosses' },
    { id: 'deadmines', name: '%s of Longfield', need: { clear: 'deadmines' }, how: 'Clear the Smugglers\' Deep' },
    { id: 'wailing', name: '%s the Dreamwalker', need: { clear: 'wailing_caverns' }, how: 'Clear The Dreaming Caves' },
    { id: 'stockade', name: 'Warden %s', need: { clear: 'stockade' }, how: 'Clear Kingsmere Gaol' },
    { id: 'shadowfang', name: '%s the Wolfslayer', need: { clear: 'shadowfang' }, how: 'Clear Greyhowl Keep' },
    { id: 'blackfathom', name: '%s of the Deeps', need: { clear: 'blackfathom' }, how: 'Clear The Tidehollow Deeps' },
    { id: 'coinworks', name: '%s the Unminted', need: { clear: 'coinworks' }, how: 'Clear The Coinworks' },
    { id: 'zulfarrak', name: '%s the Sandbreaker', need: { clear: 'zul_farrak' }, how: "Clear The Dune Temple" },
    { id: 'maraudon', name: '%s of the Stone Circle', need: { clear: 'maraudon' }, how: 'Clear The Gemfall Caves' },
    { id: 'brd', name: '%s, Bane of the Slagborn', need: { clear: 'blackrock_depths' }, how: 'Clear Cinderpeak Depths' },
    { id: 'scholomance', name: 'Headmaster %s', need: { clear: 'scholomance' }, how: 'Clear The Blackcloister' },
    { id: 'stratholme', name: '%s of the Lantern Watch', need: { clear: 'stratholme' }, how: 'Clear Graymouth' },
    { id: 'sunken_archive', name: '%s the Lorebound', need: { clear: 'sunken_archive' }, how: 'Clear the Sunken Archive' },
    { id: 'shalzua', name: '%s, Spirit-Breaker', need: { clear: 'shalzua_temple' }, how: "Clear the Temple of Shal'zua" },
    { id: 'guild_champion', name: '%s, Champion of the Guild', need: { guildRank: 4 }, how: 'Reach Champion rank in a guild' },
    { id: 'oathkeeper', name: '%s the Oathkeeper', need: { quest: 'lg_lyv_oath' }, how: "Finish Lyveus Cloveus's story" },
    { id: 'balladworthy', name: '%s the Ballad-Worthy', need: { quest: 'lg_bro_ballad' }, how: "Finish Bromli Beerhammer's story" },
    { id: 'bloodsand', name: '%s the Bloodsand Champion', need: { brawl: 1 }, how: 'Win the Bloodsand Brawl in Rumhook Bay' },
    { id: 'tidecrown', name: '%s of the Drowned Crown', need: { clear: 'tidecrown_citadel' }, how: 'Clear the Tidecrown Citadel' },
    { id: 'hard_vesh', name: 'Broodbreaker %s', need: { hard: 'onyxias_lair' }, how: "Clear Veshmira's Lair on Hard" },
    { id: 'hard_mc', name: '%s the Fireproof', need: { hard: 'molten_core' }, how: 'Clear the Magma Throne on Hard' },
    { id: 'hard_tc', name: '%s of the Deep Tide', need: { hard: 'tidecrown_citadel' }, how: 'Clear the Tidecrown Citadel on Hard' },
    { id: 'scarlet', name: '%s the Crusader\'s Bane', need: { clear: 'sm_cathedral' }, how: 'Clear the Pyre Abbey Cathedral' },
    { id: 'rider', name: '%s the Rider', need: { riding: 1 }, how: 'Learn to ride' },
    { id: 'gnomeregan', name: '%s, Liberator of Gearhollow', need: { clear: 'gnomeregan' }, how: 'Clear Gearhollow' },
    { id: 'razorfen', name: '%s the Thornbreaker', need: { clear: 'razorfen_kraul' }, how: 'Clear The Thorn Warrens' },
    { id: 'hunter_big', name: '%s the Big Game Hunter', need: { clear: 'bangalash' }, how: 'Defeat King Ghostpelt' },
    { id: 'artisan', name: 'Journeyman %s', need: { craft: 150 }, how: 'Reach 150 in a crafting profession' },
  ];
  // ---- mounts (v5.1): learn riding at 40 from a stable master in a capital, then buy a mount.
  // Riding makes every road 40% faster (boats, zeppelins, gryphons and trams keep their time).
  D.RIDING = { lvl: 40, cost: 400000, speed: 0.6 };
  // The Trialsworn set (v10.7, Trials stage 4): looks earned once per account, the cloak for beating Trial 5 in time,
  // a weapon look for every weapon type and the Trialsworn Charger for Trial 10. The items exist for their looks only.
  const tsw = (id, name, slot, o) => D.item(id, Object.assign({ name, slot, q: 4, lvl: 60, look: [slot, id], source: slot === 'back' ? 'Trials: beat Trial 5 in time' : 'Trials: beat Trial 10 in time', lookOnly: true, sell: 0 }, o));
  tsw('trialsworn_cloak', 'Trialsworn Cloak', 'back', { armor: 1, icon: 'cloak' });
  for (const [w, nm] of [['sword', 'Blade'], ['dagger', 'Dirk'], ['staff', 'Staff'], ['mace', 'Mace'], ['axe', 'Axe']]) tsw('trialsworn_' + w, 'Trialsworn ' + nm, 'weapon', { wtype: w, dmg: [1, 2], speed: 2, icon: w === 'mace' ? 'mace' : w });
  tsw('trialsworn_bow', 'Trialsworn Longbow', 'ranged', { wtype: 'bow', dmg: [1, 2], speed: 2.8, icon: 'bow' });
  // the upgrades (for players who own the set): the whole set glowing at Trial 15, radiant at Trial 20
  const TSW_W = ['sword', 'dagger', 'staff', 'mace', 'axe'], TSW_WN = { sword: 'Blade', dagger: 'Dirk', staff: 'Staff', mace: 'Mace', axe: 'Axe' };
  for (const [t, adj] of [['t15', 'Glowing'], ['t20', 'Radiant']]) {
    const lvl = t === 't15' ? 15 : 20, src = `Trials: beat Trial ${lvl} in time`;
    tsw('trialsworn_cloak_' + t, `${adj} Trialsworn Cloak`, 'back', { armor: 1, icon: 'cloak', source: src });
    for (const w of TSW_W) tsw('trialsworn_' + w + '_' + t, `${adj} Trialsworn ${TSW_WN[w]}`, 'weapon', { wtype: w, dmg: [1, 2], speed: 2, icon: w, source: src });
    tsw('trialsworn_bow_' + t, `${adj} Trialsworn Longbow`, 'ranged', { wtype: 'bow', dmg: [1, 2], speed: 2.8, icon: 'bow', source: src });
  }
  const tswSet = (t) => ['trialsworn_cloak'].concat(TSW_W.map((w) => 'trialsworn_' + w), ['trialsworn_bow']).map((id) => (t ? id + '_' + t : id));
  D.TRIALSWORN = { cloak: { lvl: 5, looks: ['trialsworn_cloak'] }, weapons: { lvl: 10, looks: tswSet('').slice(1) }, mount: { lvl: 10, mount: 'trialsworn_charger' },
    t15: { lvl: 15, looks: tswSet('t15'), mount: 'trialsworn_charger_t15' }, t20: { lvl: 20, looks: tswSet('t20'), mount: 'trialsworn_charger_t20' },
    // the yearly mount: all 12 cloaks of the first year (October 2026 to September 2027), earned or bought
    year1: { year: [0, 11], mount: 'trialsworn_year1' } };
  // a cloak for each month (season index from October 2026), earned by beating Trial 10 in time during that month.
  // Hand-picked palettes, planned a year ahead (art.js, the Trialsworn month table); a month without one has no cloak.
  D.TRIALSWORN_MONTHS = ['Emberwane', 'Bronzeleaf', 'Hoarfrost', 'Rimewind', 'Heartsblood', 'Thawbloom', 'Blossomrain', 'Greenhaven', 'Highsun', 'Azure Tide', 'Sunlit Sail', 'Harvest Moon']; // the palette names in art.js (TW_MONTHS)
  D.TRIALSWORN_MONTHS.forEach((nm, k) => { const y = 2026 + Math.floor((9 + k) / 12), m = (9 + k) % 12 + 1, key = `trialsworn_cloak_m${y}${String(m).padStart(2, '0')}`;
    tsw(key, `${nm} Trialsworn Cloak`, 'back', { armor: 1, icon: 'cloak', source: `Trials: beat Trial 10 in time in ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m - 1]} ${y}`, month: k }); });
  D.MOUNTS = {
    trialsworn_charger: { name: 'Trialsworn Charger', reward: 'Beat Trial 10 in time' }, // no faction: never sold
    trialsworn_charger_t15: { name: 'Glowing Trialsworn Charger', reward: 'Beat Trial 15 in time' },
    trialsworn_charger_t20: { name: 'Radiant Trialsworn Charger', reward: 'Beat Trial 20 in time' },
    trialsworn_year1: { name: 'Twelvefold Charger', reward: 'Collect all 12 Trialsworn Cloaks of the first year' },
    horse: { name: 'Brown Horse', race: 'human', faction: 'alliance', cost: 100000 },
    ram: { name: 'Grey Ram', race: 'dwarf', faction: 'alliance', cost: 100000 },
    mechanostrider: { name: 'Red Clockwork Trike', race: 'gnome', faction: 'alliance', cost: 100000 },
    nightsaber: { name: 'Striped Shadowcat', race: 'nightelf', faction: 'alliance', cost: 100000 },
    wolf: { name: 'Timber Wolf', race: 'orc', faction: 'horde', cost: 100000 },
    raptor: { name: 'Emerald Raptor', race: 'troll', faction: 'horde', cost: 100000 },
    kodo: { name: 'Grey Dustback', race: 'tauren', faction: 'horde', cost: 100000 },
    skeletal_horse: { name: 'Red Skeletal Horse', race: 'undead', faction: 'horde', cost: 100000 },
  };
  // ---- quest reward families
  D.REWARD_FAMILIES = {
    fam_chest: { slot: 'chest', lvl: 2, q: 1 },
    fam_legs: { slot: 'legs', lvl: 2, q: 1 },
    fam_feet: { slot: 'feet', lvl: 3, q: 1 },
    fam_hands: { slot: 'hands', lvl: 4, q: 2 },
    fam_weapon5: { slot: 'weapon', lvl: 5, q: 2 },
    fam_wrist: { slot: 'wrist', lvl: 6, q: 2 },
    fam_back: { slot: 'back', lvl: 8, q: 2 },
    fam_waist: { slot: 'waist', lvl: 8, q: 2 },
    fam_chest9: { slot: 'chest', lvl: 9, q: 2 },
    fam_legs9: { slot: 'legs', lvl: 9, q: 2 },
    fam_hands9: { slot: 'hands', lvl: 10, q: 2 },
    fam_back_rare: { slot: 'back', lvl: 10, q: 3 },
    militia: { fixed: { warrior: 'militia_shortsword', rogue: 'militia_dagger', mage: 'militia_staff', priest: 'militia_hammer', paladin: 'militia_hammer', warlock: 'militia_staff', hunter: 'militia_longbow', druid: 'militia_staff', shaman: 'militia_hammer' } },
    fam_feet12: { slot: 'feet', lvl: 11, q: 2 },
    fam_wrist12: { slot: 'wrist', lvl: 12, q: 2 },
    fam_weapon12: { slot: 'weapon', lvl: 12, q: 2 },
    fam_chest13: { slot: 'chest', lvl: 13, q: 2 },
    fam_legs13: { slot: 'legs', lvl: 13, q: 2 },
    fam_back14: { slot: 'back', lvl: 14, q: 2 },
    fam_waist14: { slot: 'waist', lvl: 14, q: 2 },
    fam_hands14: { slot: 'hands', lvl: 14, q: 2 },
    fam_weapon15: { slot: 'weapon', lvl: 15, q: 2 },
    fam_ring_rare: { slot: 'finger', lvl: 15, q: 3 },
    fam_feet17: { slot: 'feet', lvl: 16, q: 2 }, fam_wrist17: { slot: 'wrist', lvl: 17, q: 2 }, fam_weapon17: { slot: 'weapon', lvl: 17, q: 2 },
    fam_chest18: { slot: 'chest', lvl: 18, q: 2 }, fam_legs18: { slot: 'legs', lvl: 18, q: 2 }, fam_back19: { slot: 'back', lvl: 19, q: 2 },
    fam_waist19: { slot: 'waist', lvl: 19, q: 2 }, fam_hands19: { slot: 'hands', lvl: 19, q: 2 }, fam_weapon20: { slot: 'weapon', lvl: 20, q: 2 },
    fam_ring_rare20: { slot: 'finger', lvl: 20, q: 3 }, fam_back_rare20: { slot: 'back', lvl: 21, q: 3 },
    // v3 (levels 20-25)
    fam_feet22: { slot: 'feet', lvl: 21, q: 2 }, fam_wrist22: { slot: 'wrist', lvl: 22, q: 2 }, fam_weapon22: { slot: 'weapon', lvl: 22, q: 2 },
    fam_chest23: { slot: 'chest', lvl: 23, q: 2 }, fam_legs23: { slot: 'legs', lvl: 23, q: 2 }, fam_back23: { slot: 'back', lvl: 23, q: 2 },
    fam_waist24: { slot: 'waist', lvl: 24, q: 2 }, fam_hands24: { slot: 'hands', lvl: 24, q: 2 }, fam_weapon25: { slot: 'weapon', lvl: 25, q: 2 },
    fam_ring_rare25: { slot: 'finger', lvl: 25, q: 3 }, fam_back_rare25: { slot: 'back', lvl: 25, q: 3 },
    // v4 (levels 25-30)
    fam_feet27: { slot: 'feet', lvl: 26, q: 2 }, fam_wrist27: { slot: 'wrist', lvl: 27, q: 2 }, fam_weapon27: { slot: 'weapon', lvl: 27, q: 2 },
    fam_chest28: { slot: 'chest', lvl: 28, q: 2 }, fam_legs28: { slot: 'legs', lvl: 28, q: 2 }, fam_back28: { slot: 'back', lvl: 28, q: 2 },
    fam_waist29: { slot: 'waist', lvl: 29, q: 2 }, fam_hands29: { slot: 'hands', lvl: 29, q: 2 }, fam_weapon30: { slot: 'weapon', lvl: 30, q: 2 },
    fam_ring_rare30: { slot: 'finger', lvl: 30, q: 3 }, fam_back_rare30: { slot: 'back', lvl: 30, q: 3 },
    // v5 (levels 30-35)
    fam_feet31: { slot: 'feet', lvl: 31, q: 2 }, fam_wrist32: { slot: 'wrist', lvl: 32, q: 2 }, fam_weapon32: { slot: 'weapon', lvl: 32, q: 2 },
    fam_chest33: { slot: 'chest', lvl: 33, q: 2 }, fam_legs33: { slot: 'legs', lvl: 33, q: 2 }, fam_back33: { slot: 'back', lvl: 33, q: 2 },
    fam_waist34: { slot: 'waist', lvl: 34, q: 2 }, fam_hands34: { slot: 'hands', lvl: 34, q: 2 }, fam_weapon35: { slot: 'weapon', lvl: 35, q: 2 },
    fam_ring_rare35: { slot: 'finger', lvl: 35, q: 3 }, fam_back_rare35: { slot: 'back', lvl: 35, q: 3 },
    // v5.1 (levels 35-40)
    fam_feet36: { slot: 'feet', lvl: 36, q: 2 }, fam_wrist37: { slot: 'wrist', lvl: 37, q: 2 }, fam_weapon37: { slot: 'weapon', lvl: 37, q: 2 },
    fam_chest38: { slot: 'chest', lvl: 38, q: 2 }, fam_legs38: { slot: 'legs', lvl: 38, q: 2 }, fam_back38: { slot: 'back', lvl: 38, q: 2 },
    fam_waist39: { slot: 'waist', lvl: 39, q: 2 }, fam_hands39: { slot: 'hands', lvl: 39, q: 2 }, fam_weapon40: { slot: 'weapon', lvl: 40, q: 2 },
    fam_ring_rare40: { slot: 'finger', lvl: 40, q: 3 }, fam_back_rare40: { slot: 'back', lvl: 40, q: 3 },
    // v6 (levels 40-50)
    fam_feet41: { slot: 'feet', lvl: 41, q: 2 }, fam_wrist41: { slot: 'wrist', lvl: 41, q: 2 }, fam_weapon41: { slot: 'weapon', lvl: 41, q: 2 }, fam_chest41: { slot: 'chest', lvl: 41, q: 2 }, fam_legs41: { slot: 'legs', lvl: 41, q: 2 }, fam_back41: { slot: 'back', lvl: 41, q: 2 }, fam_waist41: { slot: 'waist', lvl: 41, q: 2 }, fam_hands41: { slot: 'hands', lvl: 41, q: 2 },
    fam_feet42: { slot: 'feet', lvl: 42, q: 2 }, fam_wrist42: { slot: 'wrist', lvl: 42, q: 2 }, fam_weapon42: { slot: 'weapon', lvl: 42, q: 2 }, fam_chest42: { slot: 'chest', lvl: 42, q: 2 }, fam_legs42: { slot: 'legs', lvl: 42, q: 2 }, fam_back42: { slot: 'back', lvl: 42, q: 2 }, fam_waist42: { slot: 'waist', lvl: 42, q: 2 }, fam_hands42: { slot: 'hands', lvl: 42, q: 2 },
    fam_feet43: { slot: 'feet', lvl: 43, q: 2 }, fam_wrist43: { slot: 'wrist', lvl: 43, q: 2 }, fam_weapon43: { slot: 'weapon', lvl: 43, q: 2 }, fam_chest43: { slot: 'chest', lvl: 43, q: 2 }, fam_legs43: { slot: 'legs', lvl: 43, q: 2 }, fam_back43: { slot: 'back', lvl: 43, q: 2 }, fam_waist43: { slot: 'waist', lvl: 43, q: 2 }, fam_hands43: { slot: 'hands', lvl: 43, q: 2 },
    fam_feet44: { slot: 'feet', lvl: 44, q: 2 }, fam_wrist44: { slot: 'wrist', lvl: 44, q: 2 }, fam_weapon44: { slot: 'weapon', lvl: 44, q: 2 }, fam_chest44: { slot: 'chest', lvl: 44, q: 2 }, fam_legs44: { slot: 'legs', lvl: 44, q: 2 }, fam_back44: { slot: 'back', lvl: 44, q: 2 }, fam_waist44: { slot: 'waist', lvl: 44, q: 2 }, fam_hands44: { slot: 'hands', lvl: 44, q: 2 },
    fam_feet45: { slot: 'feet', lvl: 45, q: 2 }, fam_wrist45: { slot: 'wrist', lvl: 45, q: 2 }, fam_weapon45: { slot: 'weapon', lvl: 45, q: 2 }, fam_chest45: { slot: 'chest', lvl: 45, q: 2 }, fam_legs45: { slot: 'legs', lvl: 45, q: 2 }, fam_back45: { slot: 'back', lvl: 45, q: 2 }, fam_waist45: { slot: 'waist', lvl: 45, q: 2 }, fam_hands45: { slot: 'hands', lvl: 45, q: 2 },
    fam_feet46: { slot: 'feet', lvl: 46, q: 2 }, fam_wrist46: { slot: 'wrist', lvl: 46, q: 2 }, fam_weapon46: { slot: 'weapon', lvl: 46, q: 2 }, fam_chest46: { slot: 'chest', lvl: 46, q: 2 }, fam_legs46: { slot: 'legs', lvl: 46, q: 2 }, fam_back46: { slot: 'back', lvl: 46, q: 2 }, fam_waist46: { slot: 'waist', lvl: 46, q: 2 }, fam_hands46: { slot: 'hands', lvl: 46, q: 2 },
    fam_feet47: { slot: 'feet', lvl: 47, q: 2 }, fam_wrist47: { slot: 'wrist', lvl: 47, q: 2 }, fam_weapon47: { slot: 'weapon', lvl: 47, q: 2 }, fam_chest47: { slot: 'chest', lvl: 47, q: 2 }, fam_legs47: { slot: 'legs', lvl: 47, q: 2 }, fam_back47: { slot: 'back', lvl: 47, q: 2 }, fam_waist47: { slot: 'waist', lvl: 47, q: 2 }, fam_hands47: { slot: 'hands', lvl: 47, q: 2 },
    fam_feet48: { slot: 'feet', lvl: 48, q: 2 }, fam_wrist48: { slot: 'wrist', lvl: 48, q: 2 }, fam_weapon48: { slot: 'weapon', lvl: 48, q: 2 }, fam_chest48: { slot: 'chest', lvl: 48, q: 2 }, fam_legs48: { slot: 'legs', lvl: 48, q: 2 }, fam_back48: { slot: 'back', lvl: 48, q: 2 }, fam_waist48: { slot: 'waist', lvl: 48, q: 2 }, fam_hands48: { slot: 'hands', lvl: 48, q: 2 },
    fam_feet49: { slot: 'feet', lvl: 49, q: 2 }, fam_wrist49: { slot: 'wrist', lvl: 49, q: 2 }, fam_weapon49: { slot: 'weapon', lvl: 49, q: 2 }, fam_chest49: { slot: 'chest', lvl: 49, q: 2 }, fam_legs49: { slot: 'legs', lvl: 49, q: 2 }, fam_back49: { slot: 'back', lvl: 49, q: 2 }, fam_waist49: { slot: 'waist', lvl: 49, q: 2 }, fam_hands49: { slot: 'hands', lvl: 49, q: 2 },
    fam_feet50: { slot: 'feet', lvl: 50, q: 2 }, fam_wrist50: { slot: 'wrist', lvl: 50, q: 2 }, fam_weapon50: { slot: 'weapon', lvl: 50, q: 2 }, fam_chest50: { slot: 'chest', lvl: 50, q: 2 }, fam_legs50: { slot: 'legs', lvl: 50, q: 2 }, fam_back50: { slot: 'back', lvl: 50, q: 2 }, fam_waist50: { slot: 'waist', lvl: 50, q: 2 }, fam_hands50: { slot: 'hands', lvl: 50, q: 2 },
    // v7-v8 (levels 51-60)
    fam_feet51: { slot: 'feet', lvl: 51, q: 2 }, fam_wrist51: { slot: 'wrist', lvl: 51, q: 2 }, fam_weapon51: { slot: 'weapon', lvl: 51, q: 2 }, fam_chest51: { slot: 'chest', lvl: 51, q: 2 }, fam_legs51: { slot: 'legs', lvl: 51, q: 2 }, fam_back51: { slot: 'back', lvl: 51, q: 2 }, fam_waist51: { slot: 'waist', lvl: 51, q: 2 }, fam_hands51: { slot: 'hands', lvl: 51, q: 2 },
    fam_feet52: { slot: 'feet', lvl: 52, q: 2 }, fam_wrist52: { slot: 'wrist', lvl: 52, q: 2 }, fam_weapon52: { slot: 'weapon', lvl: 52, q: 2 }, fam_chest52: { slot: 'chest', lvl: 52, q: 2 }, fam_legs52: { slot: 'legs', lvl: 52, q: 2 }, fam_back52: { slot: 'back', lvl: 52, q: 2 }, fam_waist52: { slot: 'waist', lvl: 52, q: 2 }, fam_hands52: { slot: 'hands', lvl: 52, q: 2 },
    fam_feet53: { slot: 'feet', lvl: 53, q: 2 }, fam_wrist53: { slot: 'wrist', lvl: 53, q: 2 }, fam_weapon53: { slot: 'weapon', lvl: 53, q: 2 }, fam_chest53: { slot: 'chest', lvl: 53, q: 2 }, fam_legs53: { slot: 'legs', lvl: 53, q: 2 }, fam_back53: { slot: 'back', lvl: 53, q: 2 }, fam_waist53: { slot: 'waist', lvl: 53, q: 2 }, fam_hands53: { slot: 'hands', lvl: 53, q: 2 },
    fam_feet54: { slot: 'feet', lvl: 54, q: 2 }, fam_wrist54: { slot: 'wrist', lvl: 54, q: 2 }, fam_weapon54: { slot: 'weapon', lvl: 54, q: 2 }, fam_chest54: { slot: 'chest', lvl: 54, q: 2 }, fam_legs54: { slot: 'legs', lvl: 54, q: 2 }, fam_back54: { slot: 'back', lvl: 54, q: 2 }, fam_waist54: { slot: 'waist', lvl: 54, q: 2 }, fam_hands54: { slot: 'hands', lvl: 54, q: 2 },
    fam_feet55: { slot: 'feet', lvl: 55, q: 2 }, fam_wrist55: { slot: 'wrist', lvl: 55, q: 2 }, fam_weapon55: { slot: 'weapon', lvl: 55, q: 2 }, fam_chest55: { slot: 'chest', lvl: 55, q: 2 }, fam_legs55: { slot: 'legs', lvl: 55, q: 2 }, fam_back55: { slot: 'back', lvl: 55, q: 2 }, fam_waist55: { slot: 'waist', lvl: 55, q: 2 }, fam_hands55: { slot: 'hands', lvl: 55, q: 2 },
    fam_feet56: { slot: 'feet', lvl: 56, q: 2 }, fam_wrist56: { slot: 'wrist', lvl: 56, q: 2 }, fam_weapon56: { slot: 'weapon', lvl: 56, q: 2 }, fam_chest56: { slot: 'chest', lvl: 56, q: 2 }, fam_legs56: { slot: 'legs', lvl: 56, q: 2 }, fam_back56: { slot: 'back', lvl: 56, q: 2 }, fam_waist56: { slot: 'waist', lvl: 56, q: 2 }, fam_hands56: { slot: 'hands', lvl: 56, q: 2 },
    fam_feet57: { slot: 'feet', lvl: 57, q: 2 }, fam_wrist57: { slot: 'wrist', lvl: 57, q: 2 }, fam_weapon57: { slot: 'weapon', lvl: 57, q: 2 }, fam_chest57: { slot: 'chest', lvl: 57, q: 2 }, fam_legs57: { slot: 'legs', lvl: 57, q: 2 }, fam_back57: { slot: 'back', lvl: 57, q: 2 }, fam_waist57: { slot: 'waist', lvl: 57, q: 2 }, fam_hands57: { slot: 'hands', lvl: 57, q: 2 },
    fam_feet58: { slot: 'feet', lvl: 58, q: 2 }, fam_wrist58: { slot: 'wrist', lvl: 58, q: 2 }, fam_weapon58: { slot: 'weapon', lvl: 58, q: 2 }, fam_chest58: { slot: 'chest', lvl: 58, q: 2 }, fam_legs58: { slot: 'legs', lvl: 58, q: 2 }, fam_back58: { slot: 'back', lvl: 58, q: 2 }, fam_waist58: { slot: 'waist', lvl: 58, q: 2 }, fam_hands58: { slot: 'hands', lvl: 58, q: 2 },
    fam_feet59: { slot: 'feet', lvl: 59, q: 2 }, fam_wrist59: { slot: 'wrist', lvl: 59, q: 2 }, fam_weapon59: { slot: 'weapon', lvl: 59, q: 2 }, fam_chest59: { slot: 'chest', lvl: 59, q: 2 }, fam_legs59: { slot: 'legs', lvl: 59, q: 2 }, fam_back59: { slot: 'back', lvl: 59, q: 2 }, fam_waist59: { slot: 'waist', lvl: 59, q: 2 }, fam_hands59: { slot: 'hands', lvl: 59, q: 2 },
    fam_feet60: { slot: 'feet', lvl: 60, q: 2 }, fam_wrist60: { slot: 'wrist', lvl: 60, q: 2 }, fam_weapon60: { slot: 'weapon', lvl: 60, q: 2 }, fam_chest60: { slot: 'chest', lvl: 60, q: 2 }, fam_legs60: { slot: 'legs', lvl: 60, q: 2 }, fam_back60: { slot: 'back', lvl: 60, q: 2 }, fam_waist60: { slot: 'waist', lvl: 60, q: 2 }, fam_hands60: { slot: 'hands', lvl: 60, q: 2 },
    fam_ring_rare55: { slot: 'finger', lvl: 55, q: 3 }, fam_back_rare55: { slot: 'back', lvl: 55, q: 3 }, fam_ring_rare60: { slot: 'finger', lvl: 60, q: 3 }, fam_back_rare60: { slot: 'back', lvl: 60, q: 3 },
    fam_ring_rare45: { slot: 'finger', lvl: 45, q: 3 }, fam_back_rare45: { slot: 'back', lvl: 45, q: 3 }, fam_ring_rare50: { slot: 'finger', lvl: 50, q: 3 }, fam_back_rare50: { slot: 'back', lvl: 50, q: 3 },
  };

  // ---- filled by the zone files
  D.MOBS = {}; D.PLACES = {}; D.REGIONS = {}; D.NPCS = {}; D.QUESTS = {}; D.DUNGEONS = {}; D.ACTIVITIES = {};
  // A zone registers itself; its places carry region: <id>.
  D.zone = (id, meta) => { D.REGIONS[id] = meta; };
})(typeof window !== 'undefined' ? window : globalThis);
