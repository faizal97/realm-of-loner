// Lanternwake (v10.13): Caldreth's autumn festival, every year from 24 October to 7 November, worked out from the date.
// Everything it gives is a look, a companion, a mount, a title or a keepsake: no power.
// Design: docs/plans/2026-10-11-lanternwake-design.md. The rules live in game.js (G.eventLive, G.lw*).
(function (root) {
  const D = root.D;
  D.EVENTS = D.EVENTS || {};
  D.EVENTS.lanternwake = {
    name: 'Lanternwake',
    // [month, day], inclusive, in the player's own time
    from: [10, 24], to: [11, 7],
    // 'test' keeps it on in test builds (beta and dev) whatever the date; null follows the dates everywhere
    force: null,
    story: [
      'On Lanternwake night Caldreth lights candles for its dead, so they can find the road home.',
      'The old tale says a knight lost his way centuries ago, and now he puts out every lantern he passes. Some years, the tale is true.',
    ],
    currency: { name: 'Wake Candles', one: 'Wake Candle', icon: 'lw_candle' },
    cap: 160, // candles a day from play: about 40 minutes of normal play (sim/lanternwake.js: 29 to 48 min of killing alone)
    earn: { kill: 1, elite: 3, quest: 6, boss: 8, light: 30, daily: 30 },
    light: 5, // Light the Way: lanterns to light a day, each at a different place out in the world
    act: 'ev_snuffed_road',
    steedAt: 10, steedChance: 0.1, // the Wickless Steed: 1 in 10 a daily kill, and the 10th daily kill always drops it
    keeper: 'lw_keeper',
  };

  // ---- rewards. Prices are days at the daily cap (cap × days), so the vendor costs about 10 of the 14 days
  const E = D.EVENTS.lanternwake, day = (n) => Math.round(E.cap * n);
  const look = (id, name, slot, o) => D.item(id, Object.assign({ name, slot, q: 4, lvl: 1, lookOnly: true, noSell: true, sell: 0, icon: id, look: [slot, id], source: 'Lanternwake vendor', event: 'lanternwake' }, o));
  look('lw_robe', 'Lanternwake Robe', 'chest', { desc: '"Night-blue cloth stitched with candle-gold."' });
  look('lw_trousers', 'Lanternwake Trousers', 'legs', { desc: '"Worn for the long walk with the dead."' });
  look('lw_lantern', 'Wakelight Lantern', 'back', { desc: '"It keeps burning."' });
  E.set = ['lw_robe', 'lw_trousers', 'lw_lantern']; // the Hard recolour of each drops from the Wickless Knight on Hard
  // what the festival keeper sells: { id, kind, cost }. kind: look | companion | title | use (spent, can be bought again)
  E.shop = [
    { id: 'lw_robe', kind: 'look', cost: day(2) },
    { id: 'lw_trousers', kind: 'look', cost: day(2) },
    { id: 'lw_lantern', kind: 'look', cost: day(2) },
    { id: 'flicker', kind: 'companion', cost: day(2) },
    { id: 'lantern_bearer', kind: 'title', cost: day(2) },
    { id: 'lw_costume_ghost', kind: 'use', cost: 15 },
    { id: 'lw_costume_bones', kind: 'use', cost: 15 },
    { id: 'lw_costume_local', kind: 'use', cost: 25 },
    { id: 'lw_treat', kind: 'use', cost: 3 },
    { id: 'lw_town_lantern', kind: 'use', cost: 8 },
  ];
  // the candle sink: cheap, endless, no power. A costume shows you as a creature for an hour
  const use = (id, name, icon, desc, o) => D.item(id, Object.assign({ name, slot: 'event', q: 1, icon, noSell: true, sell: 0, stack: 20, desc, event: 'lanternwake' }, o));
  use('lw_costume_ghost', 'Costume: Wandering Ghost', 'lw_costume', 'Use: look like a Wandering Ghost for 1 hour.', { costume: 'lw_ghost' });
  use('lw_costume_bones', 'Costume: Rattling Bones', 'lw_costume', 'Use: look like a skeleton for 1 hour.', { costume: 'skeletal_executioner' });
  use('lw_costume_local', 'Costume: Local Creature', 'lw_costume', 'Use: look like a creature from this zone for 1 hour.', { costume: 'local' });
  use('lw_treat', 'Lanternwake Treat', 'lw_treat', 'Use: toss to someone in town.', { treat: true });
  use('lw_town_lantern', 'Town Lantern', 'lw_candle', 'Use: hang in a town. More lanterns, brighter town.', { townLantern: true });

  // companion: a little light that follows you (the Hero screen's Companions)
  D.COMPANIONS = D.COMPANIONS || {};
  D.COMPANIONS.flicker = { name: 'Flicker', desc: 'A wisp of lantern-light that follows you.', how: 'Lanternwake vendor', event: 'lanternwake' };
  // mount: drops from the Wickless Knight (daily loot, and always on the 10th daily kill)
  D.MOUNTS.wickless_steed = { name: 'Wickless Steed', reward: 'The Wickless Knight, Lanternwake' };
  // title: bought, so it is stored (need.event: the account's Lanternwake buys)
  D.TITLES.push({ id: 'lantern_bearer', name: '%s the Lantern-Bearer', need: { event: 'lantern_bearer' }, how: 'Lanternwake vendor' });

  // ---- the festival keeper, in every city and hub that has a profession trainer (shown only while the festival is on)
  D.NPCS.lw_keeper = { name: 'Wakekeeper Ondine', title: 'Lanternwake', event: 'lanternwake' };
  const towns = new Set([].concat(...Object.values(D.PROF_TRAINERS || {})));
  for (const p of towns) if (D.PLACES[p] && !D.PLACES[p].npcs.includes('lw_keeper')) D.PLACES[p].npcs.push('lw_keeper');

  // ---- The Snuffed Road: a short 5-player run at your own level (10 to 60), one pack of wisps, then the Knight
  Object.assign(D.MOBS, {
    lw_wisp: { name: 'Lantern-Wisp', plural: 'Lantern-Wisps', lvl: [10, 60], family: 'elemental', hpMult: 0.8, dmgMult: 0.9, aggro: 'Snnf... snnf...' },
    lw_ghost: { name: 'Wandering Ghost', lvl: [10, 60], family: 'undead', sprite: 'lw_ghost' }, // the costume's look only
    wickless_knight: { name: 'The Wickless Knight', lvl: [10, 60], family: 'undead', boss: true, elite: true, named: true, special: 'slam', specialText: 'The Wickless Knight snuffs the light out of his target!', aggro: 'Another light. Another light to put out.' },
  });
  // his mechanics are the Hard-raid system's (`extra`, hard: false on Normal); Hard adds faster blows and more wisps
  const gallop = { kind: 'hit', every: 15, mult: 0.4, who: 'all', school: 'shadow', hard: false, text: 'The Wickless Knight gallops through the group!' };
  const wisps = (at, n, hard) => ({ kind: 'adds', at, mob: 'lw_wisp', n, lvl: 0, hard, text: 'The Wickless Knight calls his wisps to relight his lantern!' });
  const midnight = (after, hard) => ({ kind: 'enrage', after, mult: 2.5, hard, text: 'Midnight! The Wickless Knight\'s lantern blazes black!' });
  D.ACTIVITIES.ev_snuffed_road = {
    name: 'The Snuffed Road', where: 'stormwind', size: 5, minLvl: 10, maxLvl: 60, event: 'lanternwake', scale: true, music: 'lanternwake', since: '2026-10-24',
    desc: 'Lanternwake. 5 players, fought at your own level. The Wickless Knight puts out every lantern he passes.',
    boss: 'wickless_knight',
    trashMult: { hp: 2.2, dmg: 2.2 }, bossMult: { hp: 7, dmg: 3.6 },
    hard: { trashMult: { hp: 2.4, dmg: 2.4 }, bossMult: { hp: 7.4, dmg: 3.6 } },
    // at the level cap groups wear raid gear, so from level 40 the numbers rise to these at 60
    atCap: { from: 40, trashMult: { hp: 2.8, dmg: 2.6 }, bossMult: { hp: 9, dmg: 4.2 }, hard: { trashMult: { hp: 3, dmg: 2.8 }, bossMult: { hp: 9.3, dmg: 4.2 } } },
    extra: { wickless_knight: [gallop, wisps(0.66, 2, false), wisps(0.33, 2, false), midnight(100, false)] },
    hardExtra: { wickless_knight: [Object.assign({}, gallop, { every: 14, hard: true }), wisps(0.7, 2, true), wisps(0.45, 2, true), wisps(0.2, 2, true), midnight(90, true)] },
    pulls: [
      { scene: 'snuffed_road', label: 'Lantern-wisps', mobs: ['lw_wisp', 'lw_wisp', 'lw_wisp'] },
      { scene: 'snuffed_road', label: 'The Wickless Knight', mobs: ['wickless_knight'], boss: true },
    ],
  };
})(typeof window !== 'undefined' ? window : globalThis);
