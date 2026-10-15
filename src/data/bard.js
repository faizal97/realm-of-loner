// The Bard (v10.2): a healer who heals the whole party a little at a time with songs and lifts it with party buffs,
// where the priest, paladin and druid heal with big single spells. Hidden for now (not in any race's class list, so
// character creation and the simulated players never use it); Widya, the second Legend, plays one.
// Design: docs/plans/2026-09-30-widya-bard-design.md. A "party" song that heals reaches every living party member
// (engine.js), like a party buff always did.
(function (root) {
  const D = root.D;
  D.CLASSES.bard = {
    name: 'Bard', color: '#2EC4B6', role: 'healer', roles: ['healer', 'dps'], hidden: true, resource: 'mana', armorType: 'leather', weapons: ['dagger', 'staff'], instrument: true, // #251: daggers and staves (no caster swords exist), an instrument in the ranged slot
    base: { str: 20, agi: 21, sta: 21, int: 22, spi: 23 }, gain: { str: 0.5, agi: 1, sta: 1.2, int: 1.6, spi: 1.7 },
    baseHp: -150, hpPerLvl: 10, baseMana: -230, manaPerLvl: 16, baseArmor: 20, startWeapon: 'worn_dagger', startChest: 'footpad_shirt',
    abilities: ['soothing_chord', 'dissonant_note', 'play_lute', 'song_of_rest', 'dirge', 'marching_song', 'sharp_refrain', 'lullaby', 'play_drum', 'cleansing_verse',
      'verse_of_mending', 'ballad_of_blades', 'chorus_grove', 'intermission', 'play_horn', 'counterpoint', 'hearthsong', 'shatterchord', 'crescendo', 'stage_fright',
      'anthem_of_stone', 'mocking_verse', 'encore', 'echo', 'requiem', 'grand_finale'],
  };
  const B = (id, o) => { D.ABILITIES[id] = Object.assign({ cls: 'bard' }, o); };
  B('soothing_chord', { name: 'Soothing Chord', lvl: 1, cost: 30, costPerLvl: 4, cd: 0, cast: 1.8, target: 'ally', heal: { base: [42, 52], perLvl: 6.5, coef: 0.8 }, desc: 'A warm chord heals a friendly target for {h}.' });
  B('dissonant_note', { name: 'Dissonant Note', lvl: 1, cost: 25, costPerLvl: 3, cd: 0, cast: 2, target: 'enemy', dmg: { base: [18, 24], perLvl: 4, coef: 0.7, school: 'arcane' }, desc: 'A sour, piercing note deals {b} Arcane damage.' });
  // combat songs (#250): on the beat, with verses and a Finale (engine.js, songs on the beat)
  const SONG = ' Tap again on the beat (its last {win} sec) for a verse, up to {max}. At full verses, tap off the beat for its Finale.';
  B('song_of_rest', { name: 'Song of Rest', lvl: 4, cost: 45, costPerLvl: 4, cd: 0, target: 'party', combatOnly: true, song: { part: 'high', pulse: 'heal', every: 3, amt: 5, perLvl: 0.9, coef: 0.1, finale: 3 }, desc: 'Song: heals your party for {p} every 3 sec.' + SONG });
  B('marching_song', { name: 'Marching Song', lvl: 6, cost: 30, costPerLvl: 2, cd: 0, target: 'party', combatOnly: true, song: { part: 'march', pulse: 'haste', every: 3, amt: 3, perLvl: 0.08, finale: 3, surge: 6 }, desc: 'Song: your party attacks and casts {p}% faster while it plays. Its Finale: three times that for 6 sec.' + SONG });
  B('ballad_of_blades', { name: 'Ballad of Blades', lvl: 16, cost: 50, costPerLvl: 3, cd: 0, target: 'enemy', combatOnly: true, icon: 'requiem', song: { part: 'riff', pulse: 'dmg', area: true, every: 3, amt: 8, perLvl: 1.4, coef: 0.1, school: 'arcane', finale: 1.5 }, desc: 'Song: {p} Arcane damage to your target and every enemy near it, every 3 sec.' + SONG });
  // the eight new abilities (#251)
  B('sharp_refrain', { name: 'Sharp Refrain', lvl: 8, cost: 12, costPerLvl: 1.3, cd: 6, target: 'enemy', icon: 'dissonant_note', dmg: { base: [14, 18], perLvl: 2.5, coef: 0.45, school: 'arcane' }, desc: 'A quick, bright phrase: {b} Arcane damage. 6 sec cooldown.' });
  B('cleansing_verse', { name: 'Cleansing Verse', lvl: 12, cost: 30, costPerLvl: 2, cd: 0, target: 'ally', icon: 'verse_of_mending', cleanse: true, desc: 'Removes every poison, curse and other damage over time an enemy put on a friend.' });
  B('intermission', { name: 'Intermission', lvl: 20, cost: 0, cd: 180, target: 'self', gcd: false, combatOnly: true, icon: 'hearthsong', manaBack: { pct: 30, over: 8 }, desc: 'Catch your breath: 30% of your mana comes back over 8 sec while you are not casting. 3 min cooldown.' });
  B('shatterchord', { name: 'Shatterchord', lvl: 28, cost: 40, costPerLvl: 3.4, cd: 0, cast: 2.5, target: 'enemy', icon: 'requiem', dmg: { base: [70, 84], perLvl: 6, coef: 1.0, school: 'arcane' }, desc: 'One chord, struck hard enough to crack stone: {b} Arcane damage.' });
  B('stage_fright', { name: 'Stage Fright', lvl: 36, cost: 50, costPerLvl: 2, cd: 30, target: 'enemy', combatOnly: true, icon: 'lullaby', stun: 6, fear: true, desc: 'One enemy (not a boss) panics and runs from you for 6 sec. 30 sec cooldown.' });
  B('mocking_verse', { name: 'Mocking Verse', lvl: 44, cost: 40, costPerLvl: 2, cd: 0, target: 'enemy', icon: 'dissonant_note', debuff: { id: 'mocking_verse', dur: 15, taken: 8 }, desc: 'A cruel little rhyme: your whole party deals 8% more damage to the target for 15 sec.' });
  B('echo', { name: 'Echo', lvl: 52, cost: 100, cd: 120, target: 'self', combatOnly: true, icon: 'encore', echo: 0.5, desc: 'Your last Finale rings out again at half strength. 2 min cooldown.' });
  // the instrument sets the rhythm (#251): chosen outside a fight like a stance; the item in the ranged slot gives stats only
  B('play_lute', { name: 'Play the Lute', lvl: 1, cost: 0, cd: 0, target: 'self', gcd: false, icon: 'reedsong_lute', instrument: 'lute', desc: 'Songs last 12 sec, the beat is their last 2 sec, up to 3 verses. Change instruments outside a fight.' });
  B('play_drum', { name: 'Play the Drum', lvl: 10, cost: 0, cd: 0, target: 'self', gcd: false, icon: 'marching_song', instrument: 'drum', desc: 'Fast: songs last 8 sec, the beat is their last 1.5 sec, up to 3 verses. Change instruments outside a fight.' });
  B('play_horn', { name: 'Play the Horn', lvl: 20, cost: 0, cd: 0, target: 'self', gcd: false, icon: 'anthem_of_stone', instrument: 'horn', desc: 'Slow and forgiving: songs last 16 sec, the beat is their last 3 sec, up to 2 verses, and Finales hit 60% harder. Change instruments outside a fight.' });
  B('lullaby', { name: 'Lullaby', lvl: 10, cost: 50, costPerLvl: 2, cd: 30, target: 'self', combatOnly: true, stompAll: 3, desc: 'A soft song: nearby enemies (not bosses) fall asleep for 3 sec. 30 sec cooldown.' });
  B('verse_of_mending', { name: 'Verse of Mending', lvl: 14, cost: 40, costPerLvl: 4, cd: 0, target: 'ally', hot: { id: 'verse_of_mending', ticks: 5, every: 3, heal: 9, perLvl: 1.5, coef: 0.2 }, desc: 'A verse for one friend heals them for {hh} over 15 sec.' });
  B('chorus_grove', { name: 'Chorus of the Grove', lvl: 18, cost: 90, costPerLvl: 5, cd: 15, target: 'party', heal: { base: [30, 38], perLvl: 3.5, coef: 0.25 }, desc: 'Every voice joins in: heals everyone in your party for {h}. 15 sec cooldown.' });
  B('counterpoint', { name: 'Counterpoint', lvl: 22, cost: 60, costPerLvl: 4, cd: 6, target: 'ally', shield: { base: 60, perLvl: 9, coef: 0.3, dur: 15 }, desc: 'A second melody wraps a friend: absorbs {s} damage for 15 sec. 6 sec cooldown.' });
  B('hearthsong', { name: 'Hearthsong', lvl: 26, cost: 50, costPerLvl: 3, cd: 0, target: 'party', buff: { id: 'hearthsong', dur: 1800, stats: { spi: 6, int: 4 }, perLvl: { spi: 0.4, int: 0.3 } }, desc: 'A song of home: your party gains {spi} Spirit and {int} Intellect for 30 min.' });
  B('crescendo', { name: 'Crescendo', lvl: 30, cost: 80, costPerLvl: 6, cd: 0, cast: 3, target: 'ally', heal: { base: [160, 190], perLvl: 11, coef: 1.1 }, desc: 'The song swells and breaks over one friend: heals them for {h}.' });
  B('dirge', { name: 'Dirge', lvl: 4, cost: 25, costPerLvl: 2, cd: 0, target: 'enemy', combatOnly: true, song: { part: 'low', pulse: 'dmg', every: 3, amt: 12, perLvl: 2, coef: 0.15, school: 'shadow', finale: 1.5 }, desc: 'Song: {p} Shadow damage to your target every 3 sec.' + SONG });
  B('anthem_of_stone', { name: 'Anthem of Stone', lvl: 40, cost: 60, costPerLvl: 3, cd: 0, target: 'party', buff: { id: 'anthem_of_stone', dur: 1800, stats: { armor: 40, sta: 5 }, perLvl: { armor: 3.5, sta: 0.2 } }, desc: 'Your party stands firm: {armor} armor and {sta} Stamina for 30 min.' });
  B('encore', { name: 'Encore', lvl: 50, cost: 180, cd: 180, target: 'party', hot: { id: 'encore', ticks: 6, every: 2, heal: 20, perLvl: 1.2, coef: 0.1 }, desc: 'Once more, louder: heals everyone in your party for {hh} over 12 sec. 3 min cooldown.' });
  B('requiem', { name: 'Requiem', lvl: 56, cost: 140, costPerLvl: 4, cd: 10, target: 'aoe', dmg: { base: [60, 70], perLvl: 3, coef: 0.25, school: 'arcane' }, desc: 'A song for the fallen strikes all nearby enemies for {b} Arcane damage. 10 sec cooldown.' });
  B('grand_finale', { name: 'Standing Ovation', lvl: 60, cost: 250, cd: 120, target: 'party', heal: { base: [220, 260], perLvl: 6, coef: 0.5 }, desc: 'The last and loudest chord heals everyone in your party for {h}. 2 min cooldown.' });

  // three trees of five, like every class (talents.js explains the effect types)
  const t = (id, tier, ranks, name, icon, desc, ...fx) => ({ id, tier, ranks, name, icon, desc, fx });
  const f = (k, v, x) => Object.assign({ k, v }, x || {});
  D.TALENTS.bard = [
    { id: 'harmony', name: 'Harmony', icon: 'song_of_rest', talents: [
      t('resonance', 1, 5, 'Resonance', 'soothing_chord', 'Your healing is increased by {v}%.', f('heal', 2)),
      t('long_rest', 1, 3, 'Long Rest', 'song_of_rest', 'Song of Rest and Verse of Mending heal {v}% more per tick.', f('hot', 5, { ab: ['song_of_rest', 'verse_of_mending'] })),
      t('quick_fingers', 2, 5, 'Quick Fingers', 'crescendo', 'Crescendo casts {v} sec faster.', f('abilCast', 0.1, { ab: ['crescendo'] })),
      t('full_chorus', 2, 3, 'Full Chorus', 'chorus_grove', 'Chorus of the Grove and Standing Ovation heal {v}% more.', f('abilHeal', 6, { ab: ['chorus_grove', 'grand_finale'] })),
      t('perfect_pitch', 3, 1, 'Perfect Pitch', 'encore', '+{v}% spell critical strike chance, and 3% more healing.', f('spellCrit', 3), f('heal', 3)),
    ] },
    { id: 'tempo', name: 'Tempo', icon: 'marching_song', talents: [
      t('steady_beat', 1, 5, 'Steady Beat', 'marching_song', 'Marching Song is {v}% stronger.', f('buff', 6, { ab: ['marching_song'] })),
      t('light_step', 1, 5, 'Light Step', 'hearthsong', '+{v}% chance to dodge.', f('dodge', 1)),
      t('warm_hearth', 2, 3, 'Warm Hearth', 'hearthsong', 'Hearthsong and Anthem of Stone are {v}% stronger.', f('buff', 10, { ab: ['hearthsong', 'anthem_of_stone'] })),
      t('open_throat', 2, 5, 'Open Throat', 'soothing_chord', 'Your songs cost {v}% less mana.', f('abilCost', 2, { ab: ['*'] })),
      t('cadence', 3, 1, 'Cadence', 'counterpoint', 'Counterpoint absorbs {v}% more.', f('shield', 20, { ab: ['counterpoint'] })),
    ] },
    { id: 'discord', name: 'Battle Hymn', icon: 'dissonant_note', talents: [
      t('sharp_notes', 1, 5, 'Sharp Notes', 'dissonant_note', 'Dissonant Note deals {v}% more damage.', f('abilDmg', 4, { ab: ['dissonant_note'] })),
      t('grating_voice', 1, 5, 'Grating Voice', 'requiem', 'Your Arcane damage is increased by {v}%.', f('school', 2, { school: 'arcane' })),
      t('slow_dirge', 2, 3, 'Slow Dirge', 'dirge', 'Dirge deals {v}% more damage.', f('dot', 8, { ab: ['dirge'] })),
      t('deep_lullaby', 2, 3, 'Deep Lullaby', 'lullaby', 'Lullaby comes back {v} sec sooner.', f('abilCd', 4, { ab: ['lullaby'] })),
      t('last_note', 3, 1, 'Last Note', 'requiem', 'Requiem deals {v}% more damage, and +2% spell critical strike chance.', f('abilDmg', 20, { ab: ['requiem'] }), f('spellCrit', 2)),
    ] },
  ];
  // on test builds only (/dev/ and betas, the same rule as G.testBuild) every race can pick the Bard so it can be tried
  // before it ships (#255); a live build keeps it hidden until step 6 of docs/plans/2026-10-15-bard-playable-design.md.
  // build.py sets AZ_DEV and AZ_VERSION before any game script runs.
  if (root.AZ_DEV || /-beta\./.test(String(root.AZ_VERSION || ''))) { delete D.CLASSES.bard.hidden; for (const r in D.RACES) if (!D.RACES[r].classes.includes('bard')) D.RACES[r].classes.push('bard'); }
  // a song tap has a short global cooldown (0.5 sec): songs share one beat window (#257), and a full 1.5 sec one after the
  // first tap would leave no time to land the next. Here, after every song is defined (Dirge comes later than the rest).
  for (const id in D.ABILITIES) if (D.ABILITIES[id].song) D.ABILITIES[id].gcdLen = 0.5;
  // each song's part in the song music (#257, audio/compose_bard.py): one per range, so any songs played together fit. A
  // song that names none gets one from what it does; a new part needs its layers in the composer.
  D.SONG_PARTS = ['high', 'low', 'march', 'riff'];
  D.songPart = (abId) => { const S = D.ABILITIES[abId].song; return S.part || (S.pulse === 'heal' ? 'high' : S.pulse === 'haste' ? 'march' : S.area ? 'riff' : 'low'); };
  D.TALENT_BOT.healer.bard = ['harmony', 'tempo'];
  D.TALENT_BOT.dps.bard = ['discord', 'harmony'];
})(typeof window !== 'undefined' ? window : globalThis);
