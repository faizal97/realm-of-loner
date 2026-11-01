// Longnight (v10.17): Caldreth's winter festival, every year from 15 December to 4 January, worked out from the date.
// No candles and no vendor: an advent calendar (a door a day for the day's daily) and the town hearths (Kindling, Hearth
// ranks). The Knocker (5 players) all festival; the Cold Guest (a 10-player raid) only in the finale, 31 December on.
// Everything it gives is a look, a companion, a mount, a title, a toy or a keepsake: no power.
// Design: docs/plans/2026-11-01-longnight-design.md. The rules live in game.js (G.ln*).
(function (root) {
  const D = root.D;
  D.EVENTS = D.EVENTS || {};
  D.EVENTS.longnight = {
    name: 'Longnight',
    // [month, day], inclusive, in the player's own time; it ends the next year (G.eventLive handles the wrap)
    from: [12, 15], to: [1, 4],
    finale: [12, 31], // the New Year finale: the hubs change and the Cold Guest's door opens
    // 'test' keeps it on in test builds (beta and dev) whatever the date; null follows the dates everywhere
    force: null,
    story: [
      'On the longest night of the year, every house in Caldreth keeps its hearth burning and its door shut until the year turns.',
      'The old tale says the Cold Guest walks on Longnight, knocking at doors. Where someone lets her in, the hearth dies and the house never warms again.',
    ],
    currency: { name: 'Kindling', one: 'Kindling', icon: 'ln_kindling' },
    // Kindling for the town hearth: no cap, never spent; how much you gave sets your Hearth rank
    earn: { kill: 1, elite: 3, quest: 6, boss: 8, daily: 40, knocker: 30, guest: 60 },
    // Hearth ranks: Kindling given this festival (about 240 an hour of normal play: rank 5 is about 17 hours)
    ranks: [
      { at: 200, name: 'Hearth Helper', reward: { item: 'ln_snowball', n: 20 } },
      { at: 800, name: 'Hearth Friend', reward: { item: 'ln_cocoa', n: 5 } },
      { at: 1600, name: 'Firekeeper', reward: { item: 'ln_fireworks', n: 10 } },
      { at: 2800, name: 'Warden of the Hearth', reward: { item: 'ln_costume_hound', n: 3 } },
      { at: 4000, name: 'Keeper of the Hearth', reward: { title: 'ln_keeper_title' } },
    ],
    // the town's stages, on fixed dates (the game runs offline: a town never waits for one player): [month, day]
    stages: [
      { on: [12, 18], name: 'Garlands', text: 'Garlands go up across the town.' },
      { on: [12, 22], name: 'Music', text: 'Musicians play by the great hearth.' },
      { on: [12, 26], name: 'Snow', text: 'Snow settles on the rooftops.' },
      { on: [12, 31], name: 'Fireworks', text: 'Fireworks wait for midnight. The year is turning.' },
    ],
    // the three dailies, in turn from the first day (day 0: Snowball Brawl)
    dailies: ['snow', 'knock', 'stew'],
    knock: 3, // A Knock at the Door: homes to keep warm
    stew: { wood: 5, bowls: 3 }, // Longnight Stew: firewood to gather, bowls to hand out
    snow: { wins: 3 }, // Snowball Brawl: rounds to win
    // the advent calendar: 16 doors, 15 to 30 December; up to two a day (one late) until the festival ends
    doors: [
      { item: 'ln_snowball', n: 10 }, { item: 'ln_cocoa', n: 3 }, { item: 'ln_garland', n: 3 }, { look: 'ln_coat' },
      { item: 'ln_costume_snowman', n: 2 }, { item: 'ln_fireworks', n: 5 }, { item: 'ln_snowball', n: 20 }, { look: 'ln_trousers' },
      { item: 'ln_cocoa', n: 5 }, { item: 'ln_garland', n: 5 }, { item: 'ln_fireworks', n: 10 }, { look: 'ln_cloak' },
      { item: 'ln_costume_snowman', n: 3 }, { item: 'ln_snowball', n: 20 }, { item: 'ln_fireworks', n: 10 }, { companion: 'snowtuft' },
    ],
    perDay: 2,
    knocker: 'ev_shuttered_lane', guest: 'ev_open_door',
    houndAt: 10, houndChance: 0.1, // the Frost Hound: 1 in 10 a daily Knocker kill, and the 10th always drops it
    stagAt: 3, stagChance: 0.25, // the Pale Stag: the raid is open five days, so the 3rd daily kill always drops it
    keeper: 'ln_keeper',
    music: 'icewold_town', // the menu and the festival towns, until Longnight has its own theme (new music needs a listen first)
  };

  // ---- the outfit: three looks from the calendar; the Knocker on Hard drops the dark recolour, the raid on Hard the pale
  const look = (id, name, slot, desc) => D.item(id, { name, slot, q: 4, lvl: 1, lookOnly: true, noSell: true, sell: 0, icon: id, look: [slot, id], source: 'Longnight calendar', event: 'longnight', desc });
  look('ln_coat', 'Longnight Coat', 'chest', '"Thick wool, buttoned to the chin against the cold."');
  look('ln_trousers', 'Longnight Trousers', 'legs', '"Lined with fleece. Good for long walks in the snow."');
  look('ln_cloak', 'Hearthwool Cloak', 'back', '"Woven by the fire. It still smells of woodsmoke."');
  D.EVENTS.longnight.set = ['ln_coat', 'ln_trousers', 'ln_cloak'];

  // ---- toys from the calendar and the Hearth ranks: used from your bags, no power
  const use = (id, name, icon, desc, o) => D.item(id, Object.assign({ name, slot: 'event', q: 1, icon, noSell: true, sell: 0, stack: 20, desc, event: 'longnight' }, o));
  use('ln_snowball', 'Snowball', 'ln_snowball', 'Use: throw at someone in town.', { snowball: true });
  use('ln_cocoa', 'Hearthside Cocoa', 'ln_cocoa', 'Use: sit by the fire with a warm cup.', { cocoa: true });
  use('ln_garland', 'Longnight Garland', 'ln_garland', 'Use: hang in a town. More garlands, merrier town.', { garland: true });
  use('ln_fireworks', 'Fireworks', 'ln_fireworks', 'Use: set off over a town.', { fireworks: true });
  use('ln_costume_snowman', 'Costume: Snowman', 'ln_costume', 'Use: look like a snowman for 1 hour.', { costume: 'ln_snowman' });
  use('ln_costume_hound', 'Costume: Frost Hound', 'ln_costume', 'Use: look like a frost hound for 1 hour.', { costume: 'ln_frost_hound' });
  use('ln_stew', 'Longnight Stew', 'ln_stew', 'A warm bowl for someone in town who asks for one.', { stack: 3, stew: true });

  // companion, mounts, titles
  D.COMPANIONS = D.COMPANIONS || {};
  D.COMPANIONS.snowtuft = { name: 'Snowtuft', desc: 'A snow fox kit that follows you.', how: 'Longnight calendar, door 16', event: 'longnight' };
  D.MOUNTS.frost_hound = { name: 'Frost Hound', reward: 'The Knocker, Longnight' };
  D.MOUNTS.pale_stag = { name: 'Pale Stag', reward: 'The Cold Guest, Longnight' };
  D.TITLES.push({ id: 'ln_keeper_title', name: '%s, Keeper of the Hearth', need: { event: 'ln_keeper_title' }, how: 'Longnight: Hearth rank 5' });
  D.TITLES.push({ id: 'ln_door_title', name: '%s, Who Kept the Door', need: { event: 'ln_door_title' }, how: 'Longnight: defeat the Cold Guest' });

  // ---- the festival keeper and the great hearth, in every city and hub that has a profession trainer (only while it's on)
  D.NPCS.ln_keeper = { name: 'Hearthwarden Brannoc', title: 'Longnight', event: 'longnight' };
  const towns = new Set([].concat(...Object.values(D.PROF_TRAINERS || {})));
  for (const p of towns) if (D.PLACES[p] && !D.PLACES[p].npcs.includes('ln_keeper')) D.PLACES[p].npcs.push('ln_keeper');

  Object.assign(D.MOBS, {
    // A Knock at the Door (the daily): the hounds, and a frostling whose Hearthchill (a red bar) must be interrupted
    ln_frost_hound: { name: 'Frost Hound', lvl: [1, 60], family: 'beast', hpMult: 0.8, dmgMult: 0.85, aggro: 'Grrrr...' },
    ln_frostling: { name: 'Frostling', lvl: [1, 60], family: 'elemental', hpMult: 0.7, dmgMult: 0.8, ranged: 'frost', spellName: 'Hearthchill', aggro: 'Let... the cold... in...' },
    ln_snowman: { name: 'Snowman', lvl: [1, 60], family: 'elemental', sprite: 'ln_snowman' }, // the costume's look only
    // The Shuttered Lane: the Knocker and his hounds
    ln_knocker: { name: 'The Knocker', lvl: [10, 60], family: 'undead', boss: true, elite: true, named: true, aggro: 'Knock, knock. She is coming.' },
    // The Open Door: the Uninvited, then the Cold Guest
    ln_uninvited: { name: 'Uninvited', plural: 'the Uninvited', lvl: [10, 60], family: 'undead', hpMult: 0.9, aggro: 'We let her in. We let her in.' },
    ln_cold_guest: { name: 'The Cold Guest', lvl: [10, 60], family: 'undead', boss: true, elite: true, named: true, aggro: 'You left the door open.' },
  });

  // ---- The Shuttered Lane: a short 5-player run at your own level (10 to 60). He heals his hounds, knocks the street
  // flat, chills one of you, and the cold gets in after 150 seconds. Kill the hounds first and he has nothing to heal
  const mend = (every, hard) => ({ kind: 'heal', to: 'ln_frost_hound', every, heal: 0.35, name: 'Frost Mend', tele: true, hard, text: 'The Knocker breathes frost over his hound!' });
  const knock = (every, hard) => ({ kind: 'hit', every, mult: 0.5, who: 'all', school: 'frost', name: 'The Knock', tele: true, hard, text: 'The Knocker slams a door so hard the street shakes!' });
  const chill = (every, hard) => ({ kind: 'hit', every, mult: 0.9, who: 'random', school: 'frost', name: 'Hearthchill', tele: true, hard, text: 'The Knocker breathes the cold of an empty hearth!' });
  const doorOpens = (after, hard) => ({ kind: 'enrage', after, mult: 2.5, hard, text: 'The door opens! The cold gets in!' });
  const houndWave = (at, n, hard) => ({ kind: 'adds', at, mob: 'ln_frost_hound', n, lvl: 0, hard, text: 'The Knocker whistles: more hounds come out of the snow!' });
  D.ACTIVITIES.ev_shuttered_lane = {
    name: 'The Shuttered Lane', where: 'stormwind', size: 5, minLvl: 10, maxLvl: 60, event: 'longnight', scale: true, music: 'snow', since: '2026-12-15',
    desc: 'Longnight. 5 players, fought at your own level. The Knocker and his hounds go ahead of the Cold Guest.',
    intro: 'Every shutter on the lane is barred, every hearth behind them burning. Then the knocking starts, slow and heavy, door after door. The Knocker goes ahead of her. Send him back into the snow.', introBtn: 'Walk the lane',
    boss: 'ln_knocker',
    trashMult: { hp: 2.2, dmg: 3.1 }, bossMult: { hp: 6.5, dmg: 4.5 },
    hard: { trashMult: { hp: 2.4, dmg: 3.4 }, bossMult: { hp: 7, dmg: 4.8 } },
    atCap: { from: 40, trashMult: { hp: 2.8, dmg: 3 }, bossMult: { hp: 8.5, dmg: 4.6 }, hard: { trashMult: { hp: 3, dmg: 2.9 }, bossMult: { hp: 9, dmg: 4.2 } } },
    extra: { ln_knocker: [mend(16, false), knock(18, false), chill(13, false), houndWave(0.5, 1, false), doorOpens(150, false)] },
    hardExtra: { ln_knocker: [mend(13, true), knock(14, true), chill(11, true), houndWave(0.6, 1, true), houndWave(0.3, 1, true), doorOpens(130, true)] },
    pulls: [
      { scene: 'shuttered_lane', label: 'Frost Hounds', mobs: ['ln_frost_hound', 'ln_frost_hound', 'ln_frost_hound'] },
      { scene: 'shuttered_lane', label: 'The Knocker', mobs: ['ln_knocker', 'ln_frost_hound', 'ln_frost_hound'], boss: true },
    ],
  };

  // ---- The Open Door: a 10-player raid at your own level (10 to 60), only in the finale. Three parts by her health:
  // Cold Welcome (Frostbite on the tank, Whiteout on all), Let Me In (three Uninvited heal her: split the interrupts),
  // The Year Turns (below 30%: a countdown to midnight, then the cold takes the house)
  const frostbite = (every, hard) => ({ kind: 'hit', every, mult: 1.6, who: 'target', school: 'frost', name: 'Frostbite', tele: true, hard, text: 'The Cold Guest lays a frozen hand on her target!' });
  const whiteout = (every, hard) => ({ kind: 'hit', every, mult: 0.45, who: 'all', school: 'frost', name: 'Whiteout', tele: true, hard, text: 'The Cold Guest fills the room with snow!' });
  const letMeIn = (every, hard) => ({ kind: 'heal', to: 'ln_cold_guest', every, heal: 0.06, name: 'Let Me In', tele: true, hard, text: 'Let her in... let her in...' });
  const uninvited = (n, every, hard) => ({ kind: 'adds', at: 0.6, mob: 'ln_uninvited', n, lvl: 0, hard, extra: [letMeIn(every, hard)], text: 'The Cold Guest throws the doors open. The Uninvited come in!' });
  const yearTurns = (secs, hard) => ({ kind: 'countdown', at: 0.3, secs, mult: 3, hard, name: 'The Year Turns', text: `The bells start to ring. Midnight in ${secs} seconds!`, endText: 'Midnight passes in the dark. The cold takes the house!' });
  D.ACTIVITIES.ev_open_door = {
    name: 'The Open Door', where: 'stormwind', size: 10, minLvl: 10, maxLvl: 60, event: 'longnight', finale: true, raid: true, scale: true, music: 'worldboss', since: '2026-12-31',
    desc: 'Longnight, New Year. A 10-player raid, fought at your own level. The Cold Guest herself.',
    intro: 'One house opened its door to her. Its hearth is ash, its people stand frozen where they let her in, and she is waiting by the fire that went out. Hold her until midnight, when the bells ring and the fireworks go up.', introBtn: 'Shut the door behind you',
    boss: 'ln_cold_guest',
    trashMult: { hp: 3.6, dmg: 3.4 }, bossMult: { hp: 22, dmg: 7.5 },
    hard: { trashMult: { hp: 3.8, dmg: 3.6 }, bossMult: { hp: 23, dmg: 8 } },
    atCap: { from: 40, trashMult: { hp: 4.4, dmg: 4 }, bossMult: { hp: 28, dmg: 9 }, hard: { trashMult: { hp: 4.6, dmg: 4.2 }, bossMult: { hp: 29, dmg: 9.6 } } },
    extra: { ln_cold_guest: [frostbite(15, false), whiteout(17, false), uninvited(3, 12, false), yearTurns(60, false)] },
    hardExtra: { ln_cold_guest: [frostbite(13, true), whiteout(14, true), uninvited(4, 10, true), yearTurns(50, true)] },
    pulls: [
      { scene: 'open_door', label: 'The Uninvited', mobs: ['ln_uninvited', 'ln_uninvited', 'ln_uninvited', 'ln_uninvited'] },
      { scene: 'open_door', label: 'The Cold Guest', mobs: ['ln_cold_guest'], boss: true },
    ],
  };
})(typeof window !== 'undefined' ? window : globalThis);
