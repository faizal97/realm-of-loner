// The Bard (v10.2): a healer who heals the whole party a little at a time with songs and lifts it with party buffs,
// where the priest, paladin and druid heal with big single spells. Every race can be one (#255); Widya, the second
// Legend, plays one.
// Design: docs/plans/2026-09-30-widya-bard-design.md. A "party" song that heals reaches every living party member
// (engine.js), like a party buff always did.
(function (root) {
  const D = root.D;
  D.CLASSES.bard = {
    name: 'Bard', color: '#2EC4B6', role: 'healer', roles: ['healer', 'dps'], resource: 'mana', armorType: 'leather', weapons: ['dagger', 'staff'], instrument: true, // #251: daggers and staves (no caster swords exist), an instrument in the ranged slot
    base: { str: 20, agi: 21, sta: 21, int: 22, spi: 23 }, gain: { str: 0.5, agi: 1, sta: 1.2, int: 1.6, spi: 1.7 },
    baseHp: -150, hpPerLvl: 10, baseMana: -230, manaPerLvl: 16, baseArmor: 20, startWeapon: 'worn_dagger', startChest: 'footpad_shirt',
    abilities: ['soothing_chord', 'dissonant_note', 'play_lute', 'song_of_rest', 'dirge', 'marching_song', 'sharp_refrain', 'lullaby', 'play_drum', 'cleansing_verse',
      'verse_of_mending', 'ballad_of_blades', 'chorus_grove', 'intermission', 'play_horn', 'counterpoint', 'hearthsong', 'shatterchord', 'crescendo', 'stage_fright',
      'anthem_of_stone', 'mocking_verse', 'encore', 'echo', 'requiem', 'grand_finale'],
  };
  const B = (id, o) => { D.ABILITIES[id] = Object.assign({ cls: 'bard' }, o); };
  B('soothing_chord', { name: 'Soothing Chord', lvl: 1, cost: 30, costPerLvl: 4, cd: 0, cast: 1.8, target: 'ally', heal: { base: [36, 45], perLvl: 5.6, coef: 0.69 }, desc: 'A warm chord heals a friendly target for {h}.' });
  B('dissonant_note', { name: 'Dissonant Note', lvl: 1, cost: 25, costPerLvl: 3, cd: 0, cast: 2, target: 'enemy', dmg: { base: [23, 31], perLvl: 5.2, coef: 0.91, school: 'arcane' }, desc: 'A sour, piercing note deals {b} Arcane damage.' });
  // Bard healing (#254), against its first numbers: party heals (songs, Chorus, Encore, Standing Ovation) about 54%, one-target
  // heals (Soothing Chord, Verse of Mending, Crescendo, Counterpoint) about 86%. sim/bard.js: in a party fight within 10% of
  // the best other healer (it was 1.45x), and with only the tank hurt it keeps the tank up as well as the others
  // Bard damage (#255): Dissonant Note, Sharp Refrain and Shatterchord 1.3x their first numbers, Dirge and Ballad of Blades
  // 0.75x. Solo fights end before songs build verses, so the spells carry levelling (sim/lvpace.js: the Bard was 28-32%
  // under the class average); in a group the songs still carry it
  // combat songs (#250): on the beat, with verses and a Finale (engine.js, songs on the beat)
  const SONG = ' Tap again on the beat (its last {win} sec) for a verse, up to {max}. At full verses, tap off the beat for its Finale.';
  B('song_of_rest', { name: 'Song of Rest', lvl: 4, cost: 45, costPerLvl: 4, cd: 0, target: 'party', combatOnly: true, song: { part: 'high', pulse: 'heal', every: 3, amt: 0.8, perLvl: 0.145, coef: 0.016, finale: 3 }, desc: 'Song: heals your party for {p} every 3 sec.' + SONG });
  B('marching_song', { name: 'Marching Song', lvl: 6, cost: 30, costPerLvl: 2, cd: 0, target: 'party', combatOnly: true, song: { part: 'march', pulse: 'haste', every: 3, amt: 3, perLvl: 0.08, finale: 3, surge: 6 }, desc: 'Song: your party attacks and casts {p}% faster while it plays. Its Finale: three times that for 6 sec.' + SONG });
  B('ballad_of_blades', { name: 'Ballad of Blades', lvl: 16, cost: 50, costPerLvl: 3, cd: 0, target: 'enemy', combatOnly: true, icon: 'ballad_of_blades', song: { part: 'riff', pulse: 'dmg', area: true, every: 3, amt: 2.7, perLvl: 0.4725, coef: 0.0338, school: 'arcane', finale: 1.5 }, desc: 'Song: {p} Arcane damage to your target and every enemy near it, every 3 sec.' + SONG });
  // the eight new abilities (#251)
  B('sharp_refrain', { name: 'Sharp Refrain', lvl: 8, cost: 12, costPerLvl: 1.3, cd: 6, target: 'enemy', icon: 'sharp_refrain', dmg: { base: [18, 23], perLvl: 3.25, coef: 0.585, school: 'arcane' }, desc: 'A quick, bright phrase: {b} Arcane damage. 6 sec cooldown.' });
  B('cleansing_verse', { name: 'Cleansing Verse', lvl: 12, cost: 30, costPerLvl: 2, cd: 0, target: 'ally', icon: 'cleansing_verse', cleanse: true, desc: 'Removes every poison, curse and other damage over time an enemy put on a friend.' });
  B('intermission', { name: 'Intermission', lvl: 20, cost: 0, cd: 180, target: 'self', gcd: false, combatOnly: true, icon: 'intermission', manaBack: { pct: 30, over: 8 }, desc: 'Catch your breath: 30% of your mana comes back over 8 sec while you are not casting. 3 min cooldown.' });
  B('shatterchord', { name: 'Shatterchord', lvl: 28, cost: 34, costPerLvl: 2.9, cd: 0, cast: 2.5, target: 'enemy', icon: 'shatterchord', dmg: { base: [91, 109], perLvl: 7.8, coef: 1.3, school: 'arcane' }, desc: 'One chord, struck hard enough to crack stone: {b} Arcane damage.' });
  B('stage_fright', { name: 'Stage Fright', lvl: 36, cost: 50, costPerLvl: 2, cd: 30, target: 'enemy', combatOnly: true, icon: 'stage_fright', stun: 6, fear: true, desc: 'One enemy (not a boss) panics and runs from you for 6 sec. 30 sec cooldown.' });
  B('mocking_verse', { name: 'Mocking Verse', lvl: 44, cost: 40, costPerLvl: 2, cd: 0, target: 'enemy', icon: 'mocking_verse', debuff: { id: 'mocking_verse', dur: 15, taken: 8 }, desc: 'A cruel little rhyme: your whole party deals 8% more damage to the target for 15 sec.' });
  B('echo', { name: 'Echo', lvl: 52, cost: 100, cd: 120, target: 'self', combatOnly: true, icon: 'echo', echo: 0.5, desc: 'Your last Finale rings out again at half strength. 2 min cooldown.' });
  // the instrument sets the rhythm (#251): chosen outside a fight like a stance; the item in the ranged slot gives stats only
  B('play_lute', { name: 'Play the Lute', lvl: 1, cost: 0, cd: 0, target: 'self', gcd: false, icon: 'reedsong_lute', instrument: 'lute', desc: 'Songs last 12 sec, the beat is their last 2 sec, up to 3 verses. Tap for your next instrument, outside a fight.' });
  B('play_drum', { name: 'Play the Drum', lvl: 10, cost: 0, cd: 0, target: 'self', gcd: false, icon: 'bard_drum', instrument: 'drum', desc: 'Fast: songs last 8 sec, the beat is their last 1.5 sec, up to 3 verses. Each round costs less mana; damage songs hit 15% softer, healing songs 10% softer and Finales 20% softer. Tap for your next instrument, outside a fight.' });
  B('play_horn', { name: 'Play the Horn', lvl: 20, cost: 0, cd: 0, target: 'self', gcd: false, icon: 'bard_horn', instrument: 'horn', desc: 'Slow and forgiving: songs last 16 sec, the beat is their last 3 sec, up to 2 verses. Each round costs more mana; damage songs hit 15% harder, healing songs 25% softer and Finales 60% harder. Tap for your next instrument, outside a fight.' });
  B('lullaby', { name: 'Lullaby', lvl: 10, cost: 50, costPerLvl: 2, cd: 30, target: 'self', combatOnly: true, stompAll: 3, desc: 'A soft song: nearby enemies (not bosses) fall asleep for 3 sec. 30 sec cooldown.' });
  B('verse_of_mending', { name: 'Verse of Mending', lvl: 14, cost: 40, costPerLvl: 4, cd: 0, target: 'ally', hot: { id: 'verse_of_mending', ticks: 5, every: 3, heal: 7.8, perLvl: 1.3, coef: 0.17 }, desc: 'A verse for one friend heals them for {hh} over 15 sec.' });
  B('chorus_grove', { name: 'Chorus of the Grove', lvl: 18, cost: 90, costPerLvl: 5, cd: 15, target: 'party', heal: { base: [16, 21], perLvl: 1.87, coef: 0.134 }, desc: 'Every voice joins in: heals everyone in your party for {h}. 15 sec cooldown.' });
  B('counterpoint', { name: 'Counterpoint', lvl: 22, cost: 60, costPerLvl: 4, cd: 6, target: 'ally', shield: { base: 52, perLvl: 7.8, coef: 0.26, dur: 15 }, desc: 'A second melody wraps a friend: absorbs {s} damage for 15 sec. 6 sec cooldown.' });
  B('hearthsong', { name: 'Hearthsong', lvl: 26, cost: 50, costPerLvl: 3, cd: 0, target: 'party', buff: { id: 'hearthsong', dur: 1800, stats: { spi: 6, int: 4 }, perLvl: { spi: 0.4, int: 0.3 } }, desc: 'A song of home: your party gains {spi} Spirit and {int} Intellect for 30 min.' });
  B('crescendo', { name: 'Crescendo', lvl: 30, cost: 80, costPerLvl: 6, cd: 0, cast: 3, target: 'ally', heal: { base: [139, 164], perLvl: 9.5, coef: 0.95 }, desc: 'The song swells and breaks over one friend: heals them for {h}.' });
  B('dirge', { name: 'Dirge', lvl: 4, cost: 25, costPerLvl: 2, cd: 0, target: 'enemy', combatOnly: true, song: { part: 'low', pulse: 'dmg', every: 3, amt: 4.05, perLvl: 0.675, coef: 0.0506, school: 'shadow', finale: 1.5 }, desc: 'Song: {p} Shadow damage to your target every 3 sec.' + SONG });
  B('anthem_of_stone', { name: 'Anthem of Stone', lvl: 40, cost: 60, costPerLvl: 3, cd: 0, target: 'party', buff: { id: 'anthem_of_stone', dur: 1800, stats: { armor: 40, sta: 5 }, perLvl: { armor: 3.5, sta: 0.2 } }, desc: 'Your party stands firm: {armor} armor and {sta} Stamina for 30 min.' });
  B('encore', { name: 'Encore', lvl: 50, cost: 180, cd: 180, target: 'party', hot: { id: 'encore', ticks: 6, every: 2, heal: 10.7, perLvl: 0.64, coef: 0.054 }, desc: 'Once more, louder: heals everyone in your party for {hh} over 12 sec. 3 min cooldown.' });
  B('requiem', { name: 'Requiem', lvl: 56, cost: 140, costPerLvl: 4, cd: 10, target: 'aoe', dmg: { base: [60, 70], perLvl: 3, coef: 0.25, school: 'arcane' }, desc: 'A song for the fallen strikes all nearby enemies for {b} Arcane damage. 10 sec cooldown.' });
  B('grand_finale', { name: 'Standing Ovation', lvl: 60, cost: 250, cd: 120, target: 'party', heal: { base: [118, 140], perLvl: 3.2, coef: 0.27 }, desc: 'The last and loudest chord heals everyone in your party for {h}. 2 min cooldown.' });

  // three trees, each a songs branch and an instrument branch (#253, docs/plans/2026-10-15-bard-playable-design.md §9):
  // tier 1 small numbers, tiers 2 and 3 change how the songs work ('rule' effects, read by the song code in engine.js),
  // tier 3 a one-point keystone per branch, and a tree's two keystones are either/or (pickOne): 17 points a tree, 51 at 60
  const t = (branch, id, tier, ranks, name, icon, desc, ...fx) => ({ id, tier, ranks, name, icon, desc, fx, branch });
  const f = (k, v, x) => Object.assign({ k, v }, x || {});
  const rule = (name, v) => f('rule', v, { rule: name });
  D.TALENTS.bard = [
    { id: 'discord', name: 'Battle Hymn', icon: 'dissonant_note', pickOne: 3, talents: [
      t('songs', 'rousing_verses', 1, 5, 'Rousing Verses', 'dirge', 'Your damage songs and their Finales deal {v}% more.', f('dot', 4, { ab: ['dirge', 'ballad_of_blades'] })),
      t('songs', 'lingering_dirge', 2, 3, 'Lingering Dirge', 'dirge', 'Your damage Finales leave a Dirge on each enemy they hit: {v}% chance, 9 sec.', rule('lingeringDirge', 34)),
      t('songs', 'showstopper', 3, 1, 'Showstopper', 'shatterchord', 'After a damage Finale, your next Shatterchord is instant.', rule('showstopper', 1)),
      t('instrument', 'taut_strings', 1, 5, 'Taut Strings', 'reedsong_lute', 'Your Arcane damage is increased by {v}%.', f('school', 2, { school: 'arcane' })),
      t('instrument', 'drumbeat', 2, 3, 'Drumbeat', 'bard_drum', 'Each beat you land on a damage song also strikes its target for {v}% of a pulse.', rule('drumbeat', 25)),
      t('instrument', 'syncopation', 3, 1, 'Syncopation', 'ballad_of_blades', 'A beat landed on one song adds a verse to your other songs too. Once every 10 sec.', rule('syncopation', 10)),
    ] },
    { id: 'harmony', name: 'Harmony', icon: 'song_of_rest', pickOne: 3, talents: [
      t('songs', 'soothing_voice', 1, 5, 'Soothing Voice', 'song_of_rest', 'Your healing songs and their Finales heal {v}% more.', f('hot', 4, { ab: ['song_of_rest'] })),
      t('songs', 'rising_finale', 2, 3, 'Rising Finale', 'grand_finale', 'Your healing Finales heal up to {v}% more the more hurt your party is.', rule('risingFinale', 15)),
      t('songs', 'rescue_note', 3, 1, 'Rescue Note', 'verse_of_mending', 'When an ally drops under 25% health, your next healing Finale is ready at any verse. Once every 30 sec.', rule('rescueNote', 30)),
      t('instrument', 'resonance', 1, 5, 'Resonance', 'soothing_chord', 'Each beat you land gives back {v}% of your mana.', rule('beatMana', 1)),
      t('instrument', 'heartstrings', 2, 3, 'Heartstrings', 'hearthsong', 'Each beat you land heals your most hurt ally for {v}% of a Song of Rest pulse.', rule('heartstrings', 30)),
      t('instrument', 'sustain', 3, 1, 'Sustain', 'intermission', 'A song about to run out holds on {v} sec more, all of it on the beat. Once per song.', rule('sustain', 3)),
    ] },
    { id: 'tempo', name: 'Tempo', icon: 'marching_song', pickOne: 3, talents: [
      t('songs', 'rallying_cadence', 1, 5, 'Rallying Cadence', 'marching_song', 'Marching Song, Hearthsong and Anthem of Stone are {v}% stronger.', f('dot', 4, { ab: ['marching_song'] }), f('buff', 4, { ab: ['hearthsong', 'anthem_of_stone'] })),
      t('songs', 'second_wind', 2, 3, 'Second Wind', 'encore', "Marching Song's Finale gives your party {v}% of their mana, rage or energy.", rule('secondWind', 10)),
      t('songs', 'medley', 3, 1, 'Medley', 'chorus_grove', 'Keep three songs at once instead of two.', rule('medley', 1)),
      t('instrument', 'practised_hands', 1, 5, 'Practised Hands', 'counterpoint', 'The beat lasts {v} sec longer.', rule('beatWin', 0.1)),
      t('instrument', 'fourth_verse', 2, 1, 'Fourth Verse', 'crescendo', 'Your songs hold one more verse, and their Finales grow with it.', rule('fourthVerse', 1)),
      t('instrument', 'perfect_pitch', 3, 1, 'Perfect Pitch', 'echo', 'A beat landed in its last {v} sec adds two verses.', rule('perfectPitch', 0.5)),
    ] },
  ];
  // every race can be a Bard (#255, the any-race-any-class house rule)
  for (const r in D.RACES) if (!D.RACES[r].classes.includes('bard')) D.RACES[r].classes.push('bard');
  // a song tap has a short global cooldown (0.5 sec): songs share one beat window (#257), and a full 1.5 sec one after the
  // first tap would leave no time to land the next. Here, after every song is defined (Dirge comes later than the rest).
  for (const id in D.ABILITIES) if (D.ABILITIES[id].song) D.ABILITIES[id].gcdLen = 0.5;
  // each song's part in the song music (#257, audio/compose_bard.py): one per range, so any songs played together fit. A
  // song that names none gets one from what it does; a new part needs its layers in the composer.
  D.SONG_PARTS = ['high', 'low', 'march', 'riff'];
  D.songPart = (abId) => { const S = D.ABILITIES[abId].song; return S.part || (S.pulse === 'heal' ? 'high' : S.pulse === 'haste' ? 'march' : S.area ? 'riff' : 'low'); };
  // the Rehearsal's practice target (#256): never in the world, never fights back; art in art_legends.js
  D.MOBS.practice_target = { name: 'Practice Target', lvl: [1, 60], family: 'mechanical', drops: [] };
  D.TALENT_BOT.healer.bard = ['harmony', 'tempo'];
  D.TALENT_BOT.dps.bard = ['discord', 'harmony'];
})(typeof window !== 'undefined' ? window : globalThis);
