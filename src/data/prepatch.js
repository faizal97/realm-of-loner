// The Ruinfall pre-patch's class abilities (#142, #512–#521, docs/plans/2026-11-08-prepatch-design.md): one per class,
// at level 60. Each moves power around or asks for a decision; none adds power. `special` names the engine's handler
// (engine.js, SPECIAL); `learn` the class quest that teaches it to a player (bots at 60 know it). Each
// icon is its id (art_icons15.js).
(function (root) {
  const D = root.D;
  const NEW = {
    warrior: { id: 'intervene', name: 'Intervene', cost: 10, cd: 20, target: 'ally', gcd: false, combatOnly: true,
      special: 'intervene', dur: 6, big: 0.12,
      desc: 'Guard a party member for 6 sec: the next big hit meant for them lands on you instead. 20 sec cooldown.' },
    mage: { id: 'chronomark', name: 'Chronomark', cost: 0, cd: 90, target: 'self', gcd: false, combatOnly: true,
      special: 'chronomark', dur: 8, toggle: true,
      desc: 'Set a mark. Use it again within 8 sec to snap your health and mana back to the mark. 90 sec cooldown.' },
    priest: { id: 'vow_of_atonement', name: 'Vow of Atonement', cost: 0, cd: 60, target: 'self', gcd: false, combatOnly: true,
      special: 'vow', dur: 10, pct: 0.5,
      desc: 'For 10 sec, half the damage of your spells heals your most hurt ally instead. 1 min cooldown.' },
    rogue: { id: 'set_up', name: 'Set Up', cost: 25, cd: 30, target: 'enemy', gcdLen: 1, finisher: true,
      special: 'setup', dur: 8,
      desc: 'Finishing move. No damage now: the next party member to hit the target deals your finisher\'s damage on top, with its threat. 30 sec cooldown.' },
    paladin: { id: 'lantern_of_faith', name: 'Lantern of Faith', cost: 0, cd: 60, target: 'ally', gcd: false, combatOnly: true,
      special: 'lantern', dur: 20,
      desc: 'For 20 sec, every heal you cast lands half on its target and half on this ally. 1 min cooldown.' },
    warlock: { id: 'blood_bargain', name: 'Blood Bargain', cost: 0, cd: 120, target: 'enemy', gcd: false, combatOnly: true,
      special: 'bargain', dur: 10, pct: 20,
      desc: 'For 10 sec, you and your target both take 20% more damage. 2 min cooldown.' },
    hunter: { id: 'lure', name: 'Lure', cost: 0, cd: 45, target: 'self', gcd: false, combatOnly: true,
      special: 'lure', wait: 30, hold: 6,
      desc: 'Throw a lure: the next enemy to join the fight is held at it for 6 sec. 45 sec cooldown.' },
    druid: { id: 'seed_of_renewal', name: 'Seed of Renewal', cost: 0, cd: 60, target: 'ally', gcd: false, combatOnly: true, anyForm: true,
      special: 'seed', dur: 10, big: 0.12, toggle: true, mult: 1.2, from: 0.3,
      desc: 'Plant a seed by an ally: it grows for 10 sec, then blooms into a heal. Use it again to bloom it early, for less. A big hit on the ally crushes it. 1 min cooldown.' },
    shaman: { id: 'kinship_totem', name: 'Kinship Totem', cost: 0, cd: 120, target: 'self', gcd: false, combatOnly: true,
      special: 'kinship', dur: 8, every: 2, share: 0.5, range: 30,
      desc: 'For 8 sec, every 2 sec, the health of allies near you evens out: the healthy give to the hurt. 2 min cooldown.' },
    bard: { id: 'duet', name: 'Duet', cost: 0, cd: 60, target: 'ally', gcd: false, combatOnly: true,
      special: 'duet', dur: 15,
      desc: 'For 15 sec, your party songs reach only this ally, twice as strong. 1 min cooldown.' },
  };
  D.PREPATCH_ABILITIES = {};
  for (const cls in NEW) {
    const a = NEW[cls];
    D.ABILITIES[a.id] = Object.assign({ cls, lvl: 60, learn: 'cq_' + cls + '_' + a.id }, a);
    D.CLASSES[cls].abilities.push(a.id); D.PREPATCH_ABILITIES[cls] = a.id;
  }

  // The debt collectors (#522, design §3): while the pre-patch is live, every levelling place with creatures has a few,
  // at the place's own level (content-proof: a new zone needs nothing). Below 30 they carry no Ledger name. Each kill
  // that is not grey to you gives a torn debt note, spent at the trade-in (#523). `live` goes false when v11.0 ships.
  D.PREPATCH = { live: true, collectors: 2 };
  // The saga's look on the title screen and in What's new (#524). chapter 0 is the pre-patch; v11.0 sets 1 and its logo
  D.SAGA = { name: 'The Ruinfall Saga', chapter: 0, logo: 'ruinfallWord' };
  D.MOBS.debt_collector = { name: 'Debt Collector', sprite: 'defias_highwayman', lvl: [1, 60], placeLvl: true, collector: true, family: 'humanoid', hpMult: 1.1,
    drops: [['thieves_coin', 0.4]], aggro: "You're behind on your payments." };
  D.MOBS.ledger_collector = { name: 'Ledger Collector', sprite: 'defias_highwayman', lvl: [30, 60], placeLvl: true, collector: true, family: 'humanoid', hpMult: 1.1,
    drops: [['thieves_coin', 0.4]], aggro: 'Every note comes due. Yours too.' };
})(typeof window !== 'undefined' ? window : globalThis);
