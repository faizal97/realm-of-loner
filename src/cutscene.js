// Realm of Loner — story cutscenes: a tiny in-page film player plus the chapter scripts.
// Shots use our own art (ART.story scenes/actors, ART.scene, ART.mob, the player's hero).
(function (root) {
  const CS = { playing: null, music: null };
  const STORE = 'azsolo.story';

  // ------------------------------------------------------------ chapters
  // lines: {t: seconds into the shot, who: speaker or '' for narrator, text}. {name}/{zone} fill in per player.
  CS.CHAPTERS = [
    { id: 'intro', level: 1, title: 'The Borrowed Peace', music: 'ambermoor', shots: [
      { bg: 'story:azeroth_dawn', dur: 9, cam: [[0, 0, 1.12], [0, -2, 1.0]], fx: ['fadein'],
        lines: [{ t: 0.6, text: 'Twelve years have passed since the Long War between the Accord and the Krugar.' }, { t: 4.8, text: 'Both sides rebuilt on borrowed gold, and a tired peace holds.' }] },
      { bg: 'story:stormwind_keep', dur: 10, cam: [[-3, 0, 1.08], [3, 0, 1.08]],
        actors: [{ a: 'story:king_varian_portrait', x: 50, y: 42, w: 17 }, { a: 'story:bolvar', x: 16, y: 2, w: 34, flip: true, from: { x: -8, o: 0 } }],
        lines: [{ t: 0.5, text: 'Last winter, Kingsmere buried King Rhodric Aldane.' }, { t: 5.2, text: 'Lord Regent Edmund Carrow rules until Prince Tamlin comes of age, and he is drowning in paperwork.' }] },
      { bg: 'story:stormwind_keep', dur: 10, cam: [[3, 0, 1.08], [0, 0, 1.2]],
        actors: [{ a: 'story:bolvar', x: 14, y: 2, w: 34, flip: true }, { a: 'story:lady_prestor', x: 62, y: 2, w: 34, from: { x: 95, o: 0 }, delay: 0.3, dur: 2.2 }],
        lines: [{ t: 0.8, text: 'The crown\'s Mistress of Coin, Lady Meriel Thorne, keeps its books. Nobody else can read them.' }, { t: 5, who: 'Lady Thorne', text: 'Every stone of this city was bought on credit, my lord. Someone will come to collect.' }] },
      { bg: 'scene:deadmines_ship', dur: 11, cam: [[4, 2, 1.15], [-2, 0, 1.05]], fx: ['fadein'],
        actors: [{ a: 'story:defias_crowd', x: 8, y: 0, w: 46, flip: true, from: { x: -10, o: 0 } }, { a: 'story:vancleef_story', x: 58, y: 0, w: 40, anim: 'breathe' }],
        lines: [{ t: 0.5, text: 'In Longfield, the farmers who borrowed to replant after the war cannot pay. The Black Ledger sends its collectors.' }, { t: 5, who: 'Corvin Blackwell', text: 'I owed the Ledger too, once. Now I collect for it. Pay, or pack your things.' }] },
      { bg: 'story:blackrock_mountain', dur: 10, cam: [[0, 4, 1.25], [0, 0, 1.05]], fx: ['embers', 'shake'],
        actors: [{ a: 'story:ragnaros', x: 25, y: 0, w: 50, from: { y: -30, o: 0 }, delay: 1.5, dur: 3 }],
        lines: [{ t: 0.8, text: 'Under Cinderpeak, the Slagborn dwarves dig deeper every year to pay what they owe.' }, { t: 5.2, text: 'Below the deepest hall, something vast sleeps in the fire.' }] },
      { bg: 'story:shadow_court', dur: 10, cam: [[0, 0, 1.0], [0, -3, 1.18]],
        actors: [{ a: 'story:prestor_shadow', x: 25, y: 0, w: 50, from: { o: 0 }, delay: 1.2, dur: 2.5 }],
        fx: ['flash@3.8'],
        lines: [{ t: 0.4, text: 'Everyone owes the Black Ledger something. Nobody has met its master.' }, { t: 5.2, who: 'A voice in the dark', text: 'Lend them everything. A kingdom in debt is a kingdom for sale.' }] },
      { bg: 'scene:@start', dur: 9, cam: [[0, 0, 1.15], [0, 0, 1.0]], fx: ['fadein', 'fadeout'],
        actors: [{ a: 'hero:player', x: 38, y: 2, w: 26, from: { x: 20, o: 0 }, dur: 2 }],
        lines: [{ t: 0.6, text: 'Far from the court, in {zone}, a new hero takes up arms.' }, { t: 4.8, text: 'Your story begins here, {name}.' }] },
    ] },
    { id: 'ch1', level: 10, title: 'Chapter 1: Debts Come Due', music: 'dungeon', shots: [
      { bg: 'story:westfall', dur: 10, cam: [[-4, 0, 1.1], [4, 0, 1.1]], fx: ['fadein', 'embers'],
        actors: [{ a: 'story:defias_crowd', x: 50, y: 0, w: 46, from: { x: 80, o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: 'Longfield once fed all of Kingsmere. Now its fields have new owners.' }, { t: 5, text: 'The Grey Hoods collect for the Black Ledger, and every farm they take, they keep.' }] },
      { bg: 'story:stormwind_keep', dur: 11, cam: [[0, 0, 1.05], [0, 0, 1.18]],
        actors: [{ a: 'story:bolvar', x: 12, y: 2, w: 34, flip: true }, { a: 'story:lady_prestor', x: 60, y: 2, w: 34 }],
        lines: [{ t: 0.5, who: 'Lord Regent Carrow', text: 'The farmers of Longfield beg for soldiers, my lady.' }, { t: 4.4, who: 'Lady Thorne', text: 'They signed the notes, my lord. The law is the law, and a debt is a debt.' }, { t: 8.2, text: 'Not one soldier rides west.' }] },
      { bg: 'scene:deadmines_ship', dur: 10, cam: [[0, 3, 1.2], [0, 0, 1.02]], fx: ['shake@6'],
        actors: [{ a: 'story:vancleef_story', x: 40, y: 0, w: 40, anim: 'breathe' }],
        lines: [{ t: 0.5, who: 'Corvin Blackwell', text: 'Every sack of grain, every bar of iron, into the ships. The Ledger wants it all by spring.' }, { t: 5.5, who: 'Corvin Blackwell', text: 'Nobody asks where it goes. I stopped asking the day they took my shipyard.' }] },
      { bg: 'scene:@here', dur: 9, cam: [[0, 0, 1.12], [0, 0, 1.0]], fx: ['fadeout'],
        actors: [{ a: 'hero:player', x: 38, y: 2, w: 26, anim: 'breathe' }],
        lines: [{ t: 0.5, text: 'Word of the Grey Hoods has reached you, {name}.' }, { t: 4.4, text: 'The Farmers\' Watch gathers at Warrick\'s Rise. The road west is waiting.' }] },
    ] },
    // ---- instance intros: play once, the first time any character enters
    { id: 'legend_lyveus', legend: 'lyveus', title: 'Lyveus Cloveus: The Exiled Knight', music: 'dungeon', shots: [
      { bg: 'story:azeroth_dawn', dur: 11, cam: [[0, 2, 1.18], [0, 0, 1.04]], fx: ['fadein', 'embers', 'shake@6'],
        actors: [{ a: 'story:deathwing', x: 36, y: 0, w: 60, anim: 'breathe', from: { y: -16, o: 0 }, dur: 2.4 }],
        lines: [{ t: 0.5, text: 'Long before the Long War, the black dragon Ossarak tore the world open. The elves of the Kinloch pines call him the Black Ruin.' }, { t: 6, text: 'He was driven off. He was never destroyed.' }] },
      { bg: 'scene:silverleaf_lodge', dur: 10, cam: [[-3, 0, 1.12], [3, 0, 1.12]],
        actors: [{ a: 'story:lyveus', x: 40, y: 2, w: 32, anim: 'breathe', from: { o: 0 }, dur: 1.6 }],
        lines: [{ t: 0.5, text: 'In Silverleaf Lodge, a wood elf village in those pines, young Lyveus Cloveus learned the blade, the bow, and the old grove oath of his people.' }] },
      { bg: 'story:caravan_road', dur: 11, cam: [[0, 0, 1.05], [0, -2, 1.2]], fx: ['shake@4'],
        actors: [{ a: 'story:lyveus', x: 40, y: 2, w: 32, anim: 'breathe', from: { x: 20, o: 0 }, dur: 1.2 }],
        lines: [{ t: 0.5, text: 'Seven years ago, raiders struck a Kingsmere caravan near the forest. Lyveus ran to defend it, and the Light burst out of him.' }, { t: 6, text: 'The crown took him into its guard: a fine sword, and a sign that the old bond between men and elves still held.' }] },
      { bg: 'story:stormwind_keep', dur: 10, cam: [[0, 2, 1.18], [0, 0, 1.04]],
        actors: [{ a: 'story:lyveus', x: 18, y: 2, w: 30, flip: true }, { a: 'story:vyn', x: 58, y: 2, w: 30, anim: 'breathe', from: { o: 0 }, dur: 1.6 }],
        lines: [{ t: 0.5, text: 'In Kingsmere he met Vyn. The two rose through the ranks together, until they were chosen to guard the nobles of the court.' }, { t: 5.5, who: 'Vyn', text: 'An elf and a farm boy, guarding lords. Who would have guessed?' }] },
      { bg: 'story:shadow_court', dur: 11, cam: [[0, 0, 1.05], [0, 2, 1.22]],
        actors: [{ a: 'story:prestor_shadow', x: 40, y: 2, w: 36, anim: 'breathe', from: { o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: 'Five years ago, in a room he was never meant to enter, he heard a circle of nobles plot to sell the kingdom\'s soldiers to pay a master they had never met.' }, { t: 6, who: 'A voice in the dark', text: 'No one will miss a few soldiers. Or one elf.' }] },
      { bg: 'story:stormwind_keep', dur: 10, cam: [[0, 0, 1.12], [0, 2, 1.02]],
        actors: [{ a: 'story:vyn', x: 40, y: 2, w: 32, anim: 'breathe' }],
        lines: [{ t: 0.5, text: 'They condemned him. Vyn faked his death and got him out of the city.' }, { t: 5, who: 'Vyn', text: 'Go home, Lyv. Be dead for a while. I\'ll keep my ears open.' }] },
      { bg: 'story:silverleaf_burning', dur: 11, cam: [[-3, 0, 1.12], [3, 0, 1.12]], fx: ['embers'],
        lines: [{ t: 0.5, text: 'For three years he lived quietly at home. Then the cabal learned the truth.' }, { t: 5.5, text: 'Silverleaf Lodge burned, and his kin with it. The world was told it was bandits from the hills. Lyveus knew better.' }] },
      { bg: 'scene:silverleaf_lodge', dur: 11, cam: [[0, 0, 1.12], [0, 0, 1.0]], fx: ['fadeout'],
        actors: [{ a: 'story:lyveus_hooded', x: 40, y: 2, w: 32, anim: 'breathe', from: { o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: 'He alone survived. Now he walks the roads under a hood, and the Black Brood stirs again.' }, { t: 6, who: 'Lyveus Cloveus', text: 'They made me a ghost. Ghosts keep watch.' }] },
    ] },
    // Quest scenes (v10.2): short moments on key quests (quest + on: 'accept' | 'done'), locked in the Theater until seen
    { id: 'wid_meet', legend: 'widya', scene: true, quest: 'lg_wid_meet', on: 'accept', level: 22, title: 'Widya: A Borrowed Lute', music: 'town', shots: [
      { bg: 'scene:mystral_lake', dur: 10, cam: [[0, 2, 1.14], [0, 0, 1.04]], fx: ['fadein'],
        actors: [{ a: 'story:widya', x: 42, y: 2, w: 32, anim: 'breathe', from: { o: 0 }, dur: 1.6 }],
        lines: [{ t: 0.5, text: 'On a jetty at Lake Aurel, a wood elf plays a borrowed lute, badly, and sings anyway.' }, { t: 5, who: 'Widya', text: 'Every song is somebody\'s. I\'m only keeping them warm.' }] },
      { bg: 'scene:mystral_lake', dur: 8, cam: [[0, 0, 1.04], [0, -2, 1.18]], fx: ['fadeout'],
        actors: [{ a: 'story:widya', x: 42, y: 2, w: 32, anim: 'breathe' }],
        lines: [{ t: 0.5, who: 'Widya', text: 'This lute is awful. Mine was taken. Help me, and I\'ll sing you the whole story.' }] },
    ] },
    { id: 'wid_strings', legend: 'widya', scene: true, quest: 'lg_wid_strings', on: 'done', level: 24, title: 'Widya: Silver Strings', music: 'town', shots: [
      { bg: 'scene:mystral_lake', dur: 10, cam: [[-3, 0, 1.1], [0, 0, 1.04]], fx: ['fadein', 'fadeout'],
        actors: [{ a: 'story:widya', x: 42, y: 2, w: 32, anim: 'breathe', from: { o: 0 }, dur: 1.2 }],
        lines: [{ t: 0.5, text: 'Widya winds the silver strings around her wrist, since there is no lute yet to put them on.' }, { t: 5, who: 'Widya', text: 'One piece. Three to go. Don\'t tell the lute, it worries.' }] },
    ] },
    { id: 'wid_harrowby', legend: 'widya', scene: true, quest: 'lg_wid_pegs', on: 'accept', level: 27, title: 'Widya: The Appraiser', music: 'dungeon', shots: [
      { bg: 'scene:stromgarde_keep', dur: 10, cam: [[0, 2, 1.16], [0, 0, 1.04]], fx: ['fadein', 'fadeout'],
        actors: [{ a: 'story:harrowby', x: 44, y: 2, w: 30, anim: 'breathe', from: { o: 0 }, dur: 1.6 }],
        lines: [{ t: 0.5, text: 'Far away, a tired man in grey writes a price beside each piece of a lute.' }, { t: 5, who: 'Harrowby', text: 'Worth more apart. Most things are.' }] },
    ] },
    { id: 'wid_contest', legend: 'widya', scene: true, quest: 'lg_wid_contest', on: 'done', level: 33, title: 'Widya: A Song for the Neck', music: 'town', shots: [
      { bg: 'scene:nesingwary_camp', dur: 9, cam: [[3, 0, 1.12], [0, 0, 1.04]], fx: ['fadein', 'embers'],
        actors: [{ a: 'mob:sal_brightbell', x: 44, y: 0, w: 34, from: { o: 0 }, dur: 1.2 }],
        lines: [{ t: 0.5, text: 'The fire burns low at Wexley\'s Expedition. The brawlers are asleep where they fell.' }, { t: 4.5, who: 'Sal Brightbell', text: 'Fine! Fine. The neck is yours. Where did you learn to sing like that?' }] },
      { bg: 'scene:nesingwary_camp', dur: 8, cam: [[0, 0, 1.04], [0, -2, 1.18]], fx: ['embers', 'fadeout'],
        actors: [{ a: 'story:widya', x: 42, y: 2, w: 32, anim: 'breathe', from: { o: 0 }, dur: 1.2 }],
        lines: [{ t: 0.5, who: 'Widya', text: 'In Reedsong. Where everyone does.' }] },
    ] },
    { id: 'wid_song', legend: 'widya', scene: true, quest: 'lg_wid_song', on: 'done', level: 40, title: 'Widya: Reedsong\'s Song', music: 'town', shots: [
      { bg: 'scene:highland_plains', dur: 9, cam: [[0, 2, 1.14], [0, 0, 1.04]], fx: ['fadein'],
        actors: [{ a: 'story:harrowby', x: 44, y: 2, w: 30, anim: 'breathe', from: { o: 0 }, dur: 1.4 }],
        lines: [{ t: 0.5, text: 'Harrowby climbs the plains with the body of the lute under his arm.' }, { t: 4.5, who: 'Harrowby', text: 'Play. I will know what it is worth when I hear it.' }] },
      { bg: 'scene:highland_plains', dur: 10, cam: [[0, 0, 1.06], [0, -2, 1.2]], fx: ['embers'],
        actors: [{ a: 'story:widya', x: 42, y: 2, w: 32, anim: 'breathe', from: { o: 0 }, dur: 1.4 }],
        lines: [{ t: 0.5, text: 'She plays Reedsong\'s song, the one every family there knows. For once, Harrowby writes nothing down.' }] },
      { bg: 'scene:highland_plains', dur: 10, cam: [[0, -2, 1.2], [0, 0, 1.04]], fx: ['fadeout'],
        actors: [{ a: 'story:widya', x: 42, y: 2, w: 32, anim: 'breathe' }],
        lines: [{ t: 0.5, who: 'Widya', text: 'He gave it back. The debt is still there, I know.' }, { t: 4.5, who: 'Widya', text: 'But look: the last name on the neck is mine.' }] },
    ] },
    // Bromli Beerhammer (v10.6): meeting him, the giant, the fire pit, and Widya's ballad
    { id: 'bro_meet', legend: 'bromli', scene: true, quest: 'lg_bro_meet', on: 'accept', level: 44, title: 'Bromli: Nobody Sings About Bromli', music: 'town', shots: [
      { bg: 'scene:gadgetzan', dur: 9, cam: [[0, 2, 1.14], [0, 0, 1.04]], fx: ['fadein'],
        actors: [{ a: 'story:bromli', x: 42, y: 2, w: 32, anim: 'breathe', from: { o: 0 }, dur: 1.4 }],
        lines: [{ t: 0.5, text: 'At the Coppergulch inn, a dwarf in gold-rimmed sunglasses is standing on a table.' }, { t: 4.5, who: 'Bromli', text: 'Every war in the land! Every brawl! And not one song!' }] },
      { bg: 'scene:gadgetzan', dur: 10, cam: [[0, 0, 1.04], [0, -2, 1.18]], fx: ['fadeout'],
        actors: [{ a: 'story:bromli', x: 42, y: 2, w: 32, anim: 'breathe' }],
        lines: [{ t: 0.5, who: 'Bromli', text: 'You. You look like a witness. Come and watch me be magnificent.' }, { t: 5, who: 'Bromli', text: 'Count out loud. Singers like numbers.' }] },
    ] },
    { id: 'bro_giant', legend: 'bromli', scene: true, quest: 'lg_bro_giant', on: 'done', level: 46, title: 'Bromli: The Dune Giant', music: 'town', shots: [
      { bg: 'scene:eastmoon_ruins', dur: 9, cam: [[0, 0, 1.12], [0, 2, 1.02]], fx: ['fadein'],
        actors: [{ a: 'mob:duneback', x: 58, y: 2, w: 40 }, { a: 'story:bromli', x: 30, y: 2, w: 28, anim: 'breathe', from: { y: -30, o: 0 }, dur: 1.2 }],
        lines: [{ t: 0.5, text: 'Old Duneback lies still in the sand at last.' }, { t: 4.5, who: 'Bromli', text: 'I was on top of him for a whole verse. Did you see? A whole verse!' }] },
      { bg: 'scene:eastmoon_ruins', dur: 9, cam: [[0, 0, 1.04], [0, -2, 1.16]], fx: ['fadeout'],
        actors: [{ a: 'story:bromli', x: 42, y: 2, w: 32, anim: 'breathe' }],
        lines: [{ t: 0.5, who: 'Bromli', text: 'The falling off is not important. Leave the falling off out.' }, { t: 5, who: 'Bromli', text: 'Next: the king of the dinosaurs. Nobody has ever ridden him. Yet.' }] },
    ] },
    { id: 'bro_pit', legend: 'bromli', scene: true, quest: 'lg_bro_pit', on: 'done', level: 54, title: 'Bromli: The Champion of the Pit', music: 'town', shots: [
      { bg: 'scene:smokebelly_pit', dur: 9, cam: [[-3, 0, 1.12], [3, 0, 1.12]], fx: ['fadein', 'embers'],
        actors: [{ a: 'mob:thudd', x: 60, y: 2, w: 36 }, { a: 'story:bromli', x: 30, y: 2, w: 28, anim: 'breathe', from: { x: -10, o: 0 }, dur: 1.4 }],
        lines: [{ t: 0.5, text: 'Thudd the Unbeaten is beaten. The Smokebelly ogres go very quiet.' }, { t: 4.5, who: 'Bromli', text: 'Thrown out twice. Climbed back in twice. That is called persistence.' }] },
      { bg: 'scene:smokebelly_pit', dur: 9, cam: [[0, 0, 1.04], [0, -2, 1.18]], fx: ['fadeout'],
        actors: [{ a: 'story:bromli', x: 42, y: 2, w: 32, anim: 'breathe' }],
        lines: [{ t: 0.5, who: 'Bromli', text: 'A giant, a king and a champion. That has to be enough for one song.' }, { t: 5, who: 'Bromli', text: 'To Coppergulch! I am going to be famous.' }] },
    ] },
    { id: 'bro_ballad', legend: 'bromli', scene: true, quest: 'lg_bro_ballad', on: 'done', level: 55, title: 'The Ballad of Bromli Beerhammer', music: 'town', shots: [
      { bg: 'scene:gadgetzan', dur: 10, cam: [[0, 2, 1.14], [0, 0, 1.04]], fx: ['fadein'],
        actors: [{ a: 'story:widya', x: 42, y: 2, w: 32, anim: 'breathe', from: { o: 0 }, dur: 1.4 }],
        lines: [{ t: 0.5, text: 'The Coppergulch inn goes quiet. The wood elf bard tunes her lute.' }, { t: 4.5, who: 'Widya', text: 'This one is new. It is called The Ballad of Bromli Beerhammer.' }] },
      { bg: 'scene:gadgetzan', dur: 11, cam: [[0, 0, 1.04], [0, -2, 1.14]],
        actors: [{ a: 'story:widya', x: 42, y: 2, w: 32, anim: 'breathe' }],
        lines: [{ t: 0.5, who: 'Widya', text: '"He climbed the giant of the dunes, the biggest in the sand, and fell the whole way down again, and said he\'d meant to land."' }, { t: 6, who: 'Widya', text: '"He rode the king of the crater, a hundred teeth or more, and stayed on for a heartbeat, then he studied the floor."' }] },
      { bg: 'scene:gadgetzan', dur: 11, cam: [[0, -2, 1.14], [0, 0, 1.06]],
        actors: [{ a: 'story:widya', x: 42, y: 2, w: 32, anim: 'breathe' }],
        lines: [{ t: 0.5, who: 'Widya', text: '"They threw him from the fire pit, they threw him out twice, and twice he climbed back in again, which no one thought was wise."' }, { t: 6, who: 'Widya', text: 'Eleven verses. Nine are about falling. The other two are about getting up.' }] },
      { bg: 'scene:gadgetzan', dur: 10, cam: [[0, 0, 1.06], [0, -2, 1.2]], fx: ['fadeout'],
        actors: [{ a: 'story:bromli', x: 42, y: 2, w: 32, anim: 'breathe', from: { o: 0 }, dur: 1.2 }],
        lines: [{ t: 0.5, text: 'Bromli takes off his sunglasses to wipe his eyes. Nobody sees what is behind them.' }, { t: 5, who: 'Bromli', text: 'It\'s perfect. Sing it again. From the falling.' }] },
    ] },
    { id: 'lyv_hood', legend: 'lyveus', scene: true, quest: ['lg_hood_a', 'lg_hood_h'], on: 'accept', level: 17, title: 'The Hooded Wanderer', music: 'dungeon', shots: [
      { bg: 'scene:@here', dur: 10, cam: [[0, 0, 1.08], [0, -2, 1.2]], fx: ['fadein', 'fadeout'],
        actors: [{ a: 'story:lyveus_hooded', x: 42, y: 2, w: 32, anim: 'breathe', from: { o: 0 }, dur: 1.6 }],
        lines: [{ t: 0.5, text: 'A hooded knight waits by the road, as if he has been waiting for you.' }, { t: 4.5, who: 'Hooded Wanderer', text: 'Don\'t look at my face. Look at the seals.' }] },
    ] },
    { id: 'lyv_page', legend: 'lyveus', scene: true, quest: 'lg_lyv_page', on: 'done', level: 54, title: 'Lyveus: The Name on the Page', music: 'dungeon', shots: [
      { bg: 'scene:brd_prison', dur: 9, cam: [[0, 2, 1.14], [0, 0, 1.04]], fx: ['fadein'],
        lines: [{ t: 0.5, text: 'A torn page of Hale\'s notes. Near the bottom, one line:' }, { t: 3.5, text: '"The elf guard who should be dead. Lyveus Cloveus. Ask him."' }] },
      { bg: 'scene:silverleaf_lodge', dur: 9, cam: [[0, 0, 1.04], [0, -2, 1.18]], fx: ['embers', 'fadeout'],
        actors: [{ a: 'story:lyveus', x: 40, y: 2, w: 32, anim: 'breathe', from: { o: 0 }, dur: 1.2 }],
        lines: [{ t: 0.5, who: 'Lyveus', text: 'He saw it too. Five years, and someone else saw it too.' }] },
    ] },
    { id: 'lyv_unhood', legend: 'lyveus', scene: true, quest: 'lg_lyv_ashes', on: 'accept', level: 37, title: 'Lyveus: The Face Under the Hood', music: 'dungeon', shots: [
      { bg: 'scene:silverleaf_lodge', dur: 8, cam: [[0, 0, 1.12], [0, 0, 1.04]], fx: ['fadein', 'embers'],
        actors: [{ a: 'story:lyveus_hooded', x: 40, y: 2, w: 32, anim: 'breathe', from: { o: 0 }, dur: 1.6 }],
        lines: [{ t: 0.5, text: 'In the ashes of Silverleaf Lodge, the hooded wanderer stops, and turns.' }] },
      { bg: 'scene:silverleaf_lodge', dur: 11, cam: [[0, 0, 1.04], [0, -2, 1.2]], fx: ['embers', 'fadeout'],
        actors: [{ a: 'story:lyveus', x: 40, y: 2, w: 32, anim: 'breathe', from: { o: 0 }, dur: 1.2 }],
        lines: [{ t: 0.5, who: 'Lyveus', text: 'My name is Lyveus Cloveus. This was my home.' }, { t: 5, who: 'Lyveus', text: 'They told the world bandits burned it. I know better.' }] },
    ] },
    { id: 'lyv_vyn', legend: 'lyveus', scene: true, quest: 'lg_lyv_vyn', on: 'done', level: 44, title: 'Lyveus: A Friend in Coppergulch', music: 'town', shots: [
      { bg: 'scene:gadgetzan', dur: 9, cam: [[-3, 0, 1.1], [0, 0, 1.04]], fx: ['fadein'],
        actors: [{ a: 'story:vyn', x: 44, y: 2, w: 30, anim: 'breathe', from: { o: 0 }, dur: 1.4 }],
        lines: [{ t: 0.5, who: 'Vyn', text: 'Lyv sent you? Light. Five years I told everyone I buried him.' }, { t: 5, who: 'Vyn', text: 'I knew it. I always knew it.' }] },
      { bg: 'story:stormwind_keep', dur: 10, cam: [[0, 2, 1.16], [0, 0, 1.04]], fx: ['fadeout'],
        actors: [{ a: 'story:lyveus', x: 20, y: 2, w: 30, flip: true, from: { o: 0 }, dur: 1.2 }, { a: 'story:vyn', x: 58, y: 2, w: 30, anim: 'breathe', from: { o: 0 }, dur: 1.2 }],
        lines: [{ t: 0.5, text: 'An elf and a farm boy, once, in the guard of Kingsmere.' }, { t: 4.5, who: 'Vyn', text: 'Tell him the farm boy still has his back. Now, about that seal.' }] },
    ] },
    { id: 'lyv_oath', legend: 'lyveus', scene: true, quest: 'lg_lyv_oath', on: 'done', level: 60, title: 'Lyveus: The Oath Kept', music: 'dungeon', shots: [
      { bg: 'scene:silverleaf_lodge', dur: 8, cam: [[0, 0, 1.18], [0, 0, 1.06]], fx: ['fadein', 'embers', 'shake@1'],
        actors: [{ a: 'mob:lord_cassius_marrow', x: 44, y: 0, w: 36, from: { o: 0 }, dur: 1.2 }],
        lines: [{ t: 0.5, text: 'Lord Cassius Marrow falls in the grove where Lyveus once took his oath.' }] },
      { bg: 'story:silverleaf_burning', dur: 11, cam: [[0, 0, 1.04], [0, -2, 1.18]], fx: ['embers', 'fadeout'],
        actors: [{ a: 'story:lyveus', x: 40, y: 2, w: 32, anim: 'breathe', from: { o: 0 }, dur: 1.6 }],
        lines: [{ t: 0.5, who: 'Lyveus', text: 'The oath was to guard this grove and the people in it.' }, { t: 5.5, who: 'Lyveus', text: 'Most of them are gone. I will keep it for them.' }] },
    ] },
    { id: 'dm_intro', instance: 'deadmines', title: 'The Smugglers\' Deep', music: 'dungeon', shots: [
      { bg: 'story:westfall', dur: 9, cam: [[0, 0, 1.15], [0, 2, 1.02]], fx: ['fadein', 'embers'],
        lines: [{ t: 0.5, text: 'Fenwick was once a quiet mining town in Longfield. The Ledger foreclosed on it, and now it stands empty.' }, { t: 4.8, text: 'Beneath it runs an old mine the Grey Hoods use as their road to the sea.' }] },
      { bg: 'scene:deadmines_mine', dur: 10, cam: [[-4, 0, 1.12], [4, 0, 1.12]],
        actors: [{ a: 'mob:defias_miner', x: 58, y: 2, w: 24 }, { a: 'mob:goblin_engineer', x: 30, y: 2, w: 20, from: { x: 10, o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: 'Grey Hood miners dig day and night. Goblin engineers, paid in warm Ledger coin, build machines in the dark.' }, { t: 5.5, who: 'Goblin Engineer', text: 'Time is money, friend! Keep those carts moving!' }] },
      { bg: 'scene:deadmines_mine', dur: 8, cam: [[0, 4, 1.25], [0, 0, 1.05]], fx: ['shake@2'],
        actors: [{ a: 'mob:rhahkzor', x: 40, y: 0, w: 34, from: { x: 70, o: 0 }, dur: 1.8 }],
        lines: [{ t: 0.6, text: 'Rukko, Blackwell\'s ogre foreman, guards the first gate.' }, { t: 4.2, who: "Rukko the Foreman", text: 'Blackwell pay big for your heads!' }] },
      { bg: 'scene:deadmines_ship', dur: 11, cam: [[0, 0, 1.0], [0, -2, 1.2]],
        actors: [{ a: 'story:defias_crowd', x: 6, y: 0, w: 44, flip: true }, { a: 'story:vancleef_story', x: 58, y: 0, w: 38, anim: 'breathe', from: { o: 0 }, delay: 2, dur: 2 }],
        lines: [{ t: 0.5, text: 'At the end of the mine, in a hidden cove, Blackwell builds the Ledger\'s fleet.' }, { t: 5.8, who: 'Corvin Blackwell', text: 'Nobody takes back what the Ledger owns!' }], fx: ['fadeout'] },
    ] },
    { id: 'rfc_intro', instance: 'ragefire', title: 'The Smoke Pit', music: 'dungeon', shots: [
      { bg: 'scene:orgrimmar', dur: 9, cam: [[0, 0, 1.12], [0, 3, 1.02]], fx: ['fadein'],
        lines: [{ t: 0.5, text: 'Vazhrak, capital of the Krugar, was built on the red earth of Dunescar.' }, { t: 4.8, text: 'But beneath its streets, something festers.' }] },
      { bg: 'scene:ragefire_chasm', dur: 10, cam: [[-4, 2, 1.18], [3, 0, 1.06]], fx: ['embers'],
        actors: [{ a: 'mob:searing_blade_cultist', x: 56, y: 2, w: 24 }, { a: 'mob:ragefire_trogg', x: 30, y: 2, w: 20, from: { x: 10, o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: 'The Smoke Pit is a maze of volcanic caves, crawling with cavekin.' }, { t: 5, text: 'The Hollow Eye, a cult of demon worshippers, hides here and plots against the High Chief.' }] },
      { bg: 'scene:ragefire_chasm', dur: 9, cam: [[0, 4, 1.25], [0, 0, 1.05]], fx: ['shake@1.5', 'embers'],
        actors: [{ a: 'mob:taragaman', x: 36, y: 0, w: 36, from: { y: -20, o: 0 }, dur: 2 }],
        lines: [{ t: 0.8, who: 'Bazzak the Hungerer', text: 'They call me the Hungerer. Soon you will see why!' }] },
      { bg: 'scene:ragefire_chasm', dur: 9, cam: [[2, 0, 1.1], [-2, 0, 1.0]], fx: ['fadeout'],
        actors: [{ a: 'mob:jergosh', x: 20, y: 2, w: 26 }, { a: 'mob:bazzalan', x: 56, y: 2, w: 26 }],
        lines: [{ t: 0.5, text: 'Varrok the Invoker and the satyr Ulzan lead the cult from the deepest caves.' }, { t: 4.8, text: 'The High Chief\'s order is clear: root them out.' }] },
    ] },
    { id: 'wc_intro', instance: 'wailing_caverns', title: 'The Dreaming Caves', music: 'dungeon', shots: [
      { bg: 'scene:lushwater_oasis', dur: 9, cam: [[0, 0, 1.15], [0, 2, 1.02]], fx: ['fadein'],
        lines: [{ t: 0.5, text: 'Beneath the oases of the Scrublands lies a maze of caves where the wind moans like a living thing.' }, { t: 5, text: 'The Hornfolk call them the Dreaming Caves.' }] },
      { bg: 'scene:wailing_caverns', dur: 10, cam: [[-4, 0, 1.12], [4, 0, 1.12]],
        actors: [{ a: 'mob:druid_of_the_fang', x: 56, y: 2, w: 24 }, { a: 'mob:deviate_ravager', x: 28, y: 2, w: 22, from: { x: 8, o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: 'The wood elf druid Elarion came here to heal the dying land. He fell asleep, and his dream became a nightmare.' }, { t: 5.5, text: 'His disciples, the Druids of the Coil, turned the caves and every beast in them into something twisted.' }] },
      { bg: 'scene:wailing_caverns', dur: 9, cam: [[0, 3, 1.22], [0, 0, 1.05]],
        actors: [{ a: 'mob:lady_anacondra', x: 40, y: 0, w: 32, from: { o: 0 }, dur: 1.6 }],
        lines: [{ t: 0.6, who: 'Lady Sythra', text: 'None can stand against the Serpent Lords!' }, { t: 4.4, text: 'Four Coil leaders guard the way to the dreamer.' }] },
      { bg: 'scene:wailing_caverns_deep', dur: 10, cam: [[0, 0, 1.0], [0, -2, 1.2]], fx: ['shake@5', 'fadeout'],
        actors: [{ a: 'mob:mutanus', x: 40, y: 0, w: 40, from: { y: -20, o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: 'And in the deepest grotto, something feeds on Elarion\'s nightmare.' }, { t: 5, who: 'Gulgoth the Dreambane', text: 'Elarion dreams... and I feed.' }] },
    ] },
    { id: 'stockade_intro', instance: 'stockade', title: 'Kingsmere Gaol', music: 'dungeon', shots: [
      { bg: 'scene:stormwind', dur: 9, cam: [[0, 0, 1.15], [0, 2, 1.02]], fx: ['fadein'],
        lines: [{ t: 0.5, text: 'Beneath the canals of Kingsmere lies the Gaol, where the crown keeps its worst prisoners and its worst debtors.' }, { t: 5, text: 'Tonight, the prisoners hold the keys.' }] },
      { bg: 'scene:the_stockade', dur: 10, cam: [[-4, 0, 1.12], [4, 0, 1.12]],
        actors: [{ a: 'mob:defias_insurgent', x: 56, y: 2, w: 22 }, { a: 'mob:defias_convict', x: 28, y: 2, w: 20, from: { x: 8, o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: 'Someone smuggled blades past the guards. The cell doors opened all at once.' }, { t: 5.5, text: 'Orc butchers, dwarf traitors and Grey Hood thieves now run the cell blocks.' }] },
      { bg: 'scene:the_stockade', dur: 9, cam: [[0, 3, 1.22], [0, 0, 1.05]],
        actors: [{ a: 'mob:targorr', x: 40, y: 0, w: 30, from: { o: 0 }, dur: 1.6 }],
        lines: [{ t: 0.6, who: 'Ulgrak the Butcher', text: 'Free at last! And you will be the first to die!' }, { t: 4.4, text: 'The wardens hold the gate. Nobody else will go in.' }] },
      { bg: 'scene:stockade_depths', dur: 10, cam: [[0, 0, 1.0], [0, -2, 1.2]], fx: ['fadeout'],
        actors: [{ a: 'mob:bazil_thredd', x: 40, y: 0, w: 32, from: { y: -20, o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: 'At the bottom of it all waits Silas Crane, the Grey Hood who planned the riot.' }, { t: 5, who: 'Silas Crane', text: 'Blackwell will have your head for this!' }] },
    ] },
    { id: 'sfk_intro', instance: 'shadowfang', title: 'Greyhowl Keep', music: 'dungeon', shots: [
      { bg: 'scene:pyrewood_village', dur: 9, cam: [[0, 0, 1.15], [0, 2, 1.02]], fx: ['fadein'],
        lines: [{ t: 0.5, text: 'When the Hollow Host came to Wexmoor, the archmage Cairn tried to fight it with a curse of his own.' }, { t: 5, text: 'He called wolves from another world, and made werewolves of the people of Needlewood.' }] },
      { bg: 'scene:shadowfang_courtyard', dur: 10, cam: [[-4, 0, 1.12], [4, 0, 1.12]],
        actors: [{ a: 'mob:shadowfang_moonwalker', x: 56, y: 2, w: 22 }, { a: 'mob:haunted_servitor', x: 28, y: 2, w: 20, from: { x: 8, o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: 'The werewolves turned on everyone. Cairn went mad and took Greyhowl Keep for himself.' }, { t: 5.5, text: 'The baron who owned it still walks its halls, dead and unable to leave.' }] },
      { bg: 'scene:shadowfang_hall', dur: 9, cam: [[0, 3, 1.22], [0, 0, 1.05]],
        actors: [{ a: 'mob:fenrus', x: 40, y: 0, w: 32, from: { o: 0 }, dur: 1.6 }],
        lines: [{ t: 0.6, text: 'His wolf, Grimwolf, guards the stairs to the tower.' }, { t: 4.4, text: 'Every werewolf in Needlewood answers to the man at the top.' }] },
      { bg: 'scene:shadowfang_hall', dur: 10, cam: [[0, 0, 1.0], [0, -2, 1.2]], fx: ['fadeout'],
        actors: [{ a: 'mob:arugal', x: 40, y: 0, w: 32, from: { y: -20, o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: 'Archmage Cairn waits in his tower.' }, { t: 5, who: 'Archmage Cairn', text: 'You, too, shall serve!' }] },
    ] },
    { id: 'bfd_intro', instance: 'blackfathom', title: 'The Tidehollow Deeps', music: 'dungeon', shots: [
      { bg: 'scene:the_zoram_strand', dur: 9, cam: [[0, 0, 1.15], [0, 2, 1.02]], fx: ['fadein'],
        lines: [{ t: 0.5, text: 'Long ago the wood elves built a temple to the moon on the coast of Elderglen.' }, { t: 5, text: 'When the Heartfire burst, the sea swallowed it.' }] },
      { bg: 'scene:blackfathom_deeps', dur: 10, cam: [[-4, 0, 1.12], [4, 0, 1.12]],
        actors: [{ a: 'mob:blackfathom_myrmidon', x: 56, y: 2, w: 22 }, { a: 'mob:aku_mai_snapjaw', x: 28, y: 2, w: 22, from: { x: 8, o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: 'Now naga swim its flooded halls, and something older stirs below.' }, { t: 5.5, text: 'The Eclipse Cult has come to wake it.' }] },
      { bg: 'scene:blackfathom_depths', dur: 9, cam: [[0, 3, 1.22], [0, 0, 1.05]],
        actors: [{ a: 'mob:twilight_lord_kelris', x: 40, y: 0, w: 30, from: { o: 0 }, dur: 1.6 }],
        lines: [{ t: 0.6, who: 'Eclipse Lord Oreth', text: 'Who dares disturb my meditation?' }, { t: 4.4, text: 'Oreth, a wood elf who betrayed his people, leads the cult.' }] },
      { bg: 'scene:blackfathom_depths', dur: 10, cam: [[0, 0, 1.0], [0, -2, 1.2]], fx: ['shake@5', 'fadeout'],
        actors: [{ a: 'mob:aku_mai', x: 40, y: 0, w: 40, from: { y: -20, o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: "In the black pool at the bottom, the cult feeds their god: Old Coilmaw." }, { t: 5, text: 'Both the Accord and the Krugar send heroes down. Few come back.' }] },
    ] },
    { id: 'gnomer_intro', instance: 'gnomeregan', title: 'Gearhollow', music: 'dungeon', shots: [
      { bg: 'scene:gnomeregan_gate', dur: 9, cam: [[0, 0, 1.15], [0, 2, 1.02]], fx: ['fadein'],
        lines: [{ t: 0.5, text: 'Gearhollow was the wonder of the gnomes: a city of gears and steam beneath the snows of Kaldvik.' }, { t: 5, text: 'Then the cavekin came up from the deep.' }] },
      { bg: 'scene:gnomeregan_halls', dur: 10, cam: [[-4, 0, 1.12], [4, 0, 1.12]],
        actors: [{ a: 'mob:irradiated_pillager', x: 56, y: 2, w: 22 }, { a: 'mob:leper_gnome', x: 28, y: 2, w: 18, from: { x: 8, o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: 'Their chief engineer promised a machine to drive them out. When he switched it on, the halls filled with poison.' }, { t: 5.5, text: 'It killed thousands. The cavekin survived. So did the gnomes who stayed behind, sick and changed.' }] },
      { bg: 'scene:gnomeregan_core', dur: 10, cam: [[0, 0, 1.0], [0, -2, 1.2]], fx: ['shake@5', 'fadeout'],
        actors: [{ a: 'mob:mekgineer_thermaplugg', x: 40, y: 0, w: 36, from: { y: -20, o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: 'The engineer who built it, Chief Engineer Voltwhistle, rules the ruins now, and says it worked.' }, { t: 5, who: 'Chief Engineer Voltwhistle', text: 'My machines are the future! They will destroy you!' }] },
    ] },
    { id: 'rfk_intro', instance: 'razorfen_kraul', title: 'The Thorn Warrens', music: 'dungeon', shots: [
      { bg: 'scene:razorfen_gate', dur: 9, cam: [[0, 0, 1.15], [0, 2, 1.02]], fx: ['fadein'],
        lines: [{ t: 0.5, text: 'Long ago a great boar spirit fell in the south of the Scrublands.' }, { t: 5, text: 'Great thorns grew from its blood. The spinehide made them their home.' }] },
      { bg: 'scene:razorfen_kraul', dur: 10, cam: [[-4, 0, 1.12], [4, 0, 1.12]],
        actors: [{ a: 'mob:razorfen_quilguard', x: 56, y: 2, w: 22 }, { a: 'mob:death_head_cultist', x: 28, y: 2, w: 20, from: { x: 8, o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: 'Inside the Warrens, a cult of the dead has taken root among the tribe.' }, { t: 5.5, text: 'Its masks and skulls whisper of a power older than the thorns.' }] },
      { bg: 'scene:razorfen_depths', dur: 10, cam: [[0, 0, 1.0], [0, -2, 1.2]], fx: ['fadeout'],
        actors: [{ a: 'mob:charlga_razorflank', x: 40, y: 0, w: 34, from: { y: -20, o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: 'Their matriarch, Mother Grisla, waits on the thorn throne.' }, { t: 5, who: 'Mother Grisla', text: 'The thorns will be your grave!' }] },
    ] },
    { id: 'sm_intro', instance: 'sm_library', also: ['sm_cathedral'], title: 'The Pyre Abbey', music: 'dungeon', shots: [
      { bg: 'scene:scarlet_monastery_gate', dur: 9, cam: [[0, 0, 1.15], [0, 2, 1.02]], fx: ['fadein'],
        lines: [{ t: 0.5, text: 'When the plague took Wexmoor, a few survivors swore to burn out every trace of undeath.' }, { t: 5, text: 'They called themselves the Order of the Pyre.' }] },
      { bg: 'scene:sm_library', dur: 10, cam: [[-4, 0, 1.12], [4, 0, 1.12]],
        actors: [{ a: 'mob:scarlet_monk', x: 56, y: 2, w: 22 }, { a: 'mob:scarlet_chaplain', x: 28, y: 2, w: 20, from: { x: 8, o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: 'Their faith turned to madness. Now they kill anyone they suspect: the living and the dead alike.' }, { t: 5.5, text: 'Their abbey in Pallmoor holds their library, their armory and their cathedral.' }] },
      { bg: 'scene:sm_cathedral', dur: 10, cam: [[0, 0, 1.0], [0, -2, 1.2]], fx: ['fadeout'],
        actors: [{ a: 'mob:high_inquisitor_whitemane', x: 40, y: 0, w: 34, from: { y: -20, o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: 'In the cathedral, Commander Vance and High Inquisitor Ashe lead them.' }, { t: 5, text: 'The Krugar and the Accord agree on almost nothing. They agree on this.' }] },
    ] },
    { id: 'zf_intro', instance: 'zul_farrak', title: 'The Dune Temple', music: 'dungeon', shots: [
      { bg: 'scene:zul_farrak_gate', dur: 9, cam: [[0, 0, 1.15], [0, 2, 1.02]], fx: ['fadein'],
        lines: [{ t: 0.5, text: 'In the burning sands of Sirocco rises the city of the Duneskin trolls.' }, { t: 5, text: 'They raid every caravan on the road to Coppergulch.' }] },
      { bg: 'scene:zf_courtyard', dur: 10, cam: [[-4, 0, 1.12], [4, 0, 1.12]],
        actors: [{ a: 'mob:sandfury_blood_drinker', x: 56, y: 2, w: 22 }, { a: 'mob:zul_farrak_zombie', x: 28, y: 2, w: 20, from: { x: 8, o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: 'Their witch doctors raise the dead, and their priests keep a hydra in the sacred pool.' }, { t: 5.5, text: 'Goblin mercenaries who came to rob the city now fight for their lives on the pyramid stairs.' }] },
      { bg: 'scene:zf_temple', dur: 10, cam: [[0, 0, 1.0], [0, -2, 1.2]], fx: ['fadeout'],
        actors: [{ a: 'mob:chief_ukorz_sandscalp', x: 40, y: 0, w: 36, from: { y: -20, o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: 'At the top of the temple waits their chief, Uzzak.' }, { t: 5, who: 'Chief Uzzak', text: "Who dares enter the Chief's city?" }] },
    ] },
    { id: 'cw_intro', instance: 'coinworks', title: 'The Coinworks', music: 'dungeon', shots: [
      { bg: 'scene:coinworks_gate', dur: 9, cam: [[0, 0, 1.15], [0, 2, 1.02]], fx: ['fadein'],
        lines: [{ t: 0.5, text: 'Under the cliffs of Coppergulch, carts of gold roll through a brass door every night.' }, { t: 5, text: 'Nobody in town minted the coins that come back out.' }] },
      { bg: 'scene:cw_smelter', dur: 10, cam: [[-4, 0, 1.12], [4, 0, 1.12]],
        actors: [{ a: 'mob:foreman_nettlecog', x: 58, y: 2, w: 24 }, { a: 'mob:venture_mechanic', x: 28, y: 2, w: 20, from: { x: 8, o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: 'The Deepgold Company melts the gold down and strikes it into coins, still warm and stamped with a claw.' }, { t: 5.5, text: 'Most of them leave the same night, on the road to Cinderpeak.' }] },
      { bg: 'scene:cw_vault', dur: 10, cam: [[0, 0, 1.0], [0, -2, 1.2]], fx: ['fadeout'],
        actors: [{ a: 'mob:mintmaster_coinwhistle', x: 40, y: 0, w: 30, from: { y: -20, o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: 'In the counting house, the mintmaster writes down every coin.' }, { t: 5, who: 'Mintmaster Coinwhistle', text: 'Every coin in this room is counted. So are you.' }] },
    ] },
    { id: 'md_intro', instance: 'maraudon', title: 'The Gemfall Caves', music: 'dungeon', shots: [
      { bg: 'scene:maraudon_gate', dur: 9, cam: [[0, 0, 1.15], [0, 2, 1.02]], fx: ['fadein'],
        lines: [{ t: 0.5, text: 'The centaur of Mournwaste keep one law: take nothing from under the ground. Long ago a khan broke it here.' }, { t: 5, text: 'What he woke has poisoned Mournwaste ever since.' }] },
      { bg: 'scene:maraudon_caverns', dur: 10, cam: [[-4, 0, 1.12], [4, 0, 1.12]],
        actors: [{ a: 'mob:putridus_trickster', x: 56, y: 2, w: 22 }, { a: 'mob:constrictor_vine', x: 28, y: 2, w: 20, from: { x: 8, o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: 'Satyrs and twisted vines choke the purple caves. Faolan, a keeper of the grove, lies cursed in the falls.' }, { t: 5.5, text: 'Deeper still, the earth itself moves.' }] },
      { bg: 'scene:maraudon_throne', dur: 10, cam: [[0, 0, 1.0], [0, -2, 1.2]], fx: ['shake@5', 'fadeout'],
        actors: [{ a: 'mob:princess_theradras', x: 40, y: 0, w: 40, from: { y: -20, o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: 'On her stone throne sits Ghesra, the Stone Duchess.' }, { t: 5, who: 'Ghesra', text: 'You will be buried in my caverns!' }] },
    ] },
    { id: 'brd_intro', instance: 'blackrock_depths', title: 'Cinderpeak Depths', music: 'dungeon', shots: [
      { bg: 'scene:blackrock_mountain', dur: 9, cam: [[0, 0, 1.15], [0, 2, 1.02]], fx: ['fadein', 'embers'],
        lines: [{ t: 0.5, text: 'The Slagborn were a proud people once. After the Long War they borrowed to rebuild their empire, and the Ledger lent gladly.' }, { t: 5.2, text: 'To pay it back, they dig. Every hall they open brings them closer to the fire below.' }] },
      { bg: 'scene:brd_city', dur: 10, cam: [[-4, 0, 1.12], [4, 0, 1.12]], fx: ['embers'],
        actors: [{ a: 'mob:shadowforge_flame_keeper', x: 56, y: 2, w: 22 }, { a: 'mob:anvilrage_warden', x: 28, y: 2, w: 20, from: { x: 8, o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: 'Their city of Ashforge works off its debt one forge at a time.' }, { t: 5.5, text: 'Prisons, forges, golem workshops, a whole kingdom under the stone.' }] },
      { bg: 'scene:brd_throne', dur: 10, cam: [[0, 0, 1.0], [0, -2, 1.2]], fx: ['shake@5', 'fadeout'],
        actors: [{ a: 'mob:emperor_dagran_thaurissan', x: 40, y: 0, w: 36, from: { y: -20, o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: 'Emperor Haldor Grimmark rules it all from the Anvil Throne.' }, { t: 5, who: 'Emperor Grimmark', text: 'Come to aid the Throne!' }] },
    ] },
    { id: 'scholo_intro', instance: 'scholomance', title: 'The Blackcloister', music: 'dungeon', shots: [
      { bg: 'scene:caer_darrow', dur: 9, cam: [[0, 0, 1.15], [0, 2, 1.02]], fx: ['fadein'],
        lines: [{ t: 0.5, text: 'Castle Ardmore was the seat of the Varga family. They borrowed against it to buy a promise of eternal life.' }, { t: 5.5, text: 'The necromancers who bought the debt kept their word, after a fashion.' }] },
      { bg: 'scene:scholo_hall', dur: 10, cam: [[-4, 0, 1.12], [4, 0, 1.12]],
        actors: [{ a: 'mob:scholomance_necromancer', x: 56, y: 2, w: 22 }, { a: 'mob:scholomance_acolyte', x: 28, y: 2, w: 20, from: { x: 8, o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: "In the crypts beneath the castle, they run a school. Its lessons are necromancy." }, { t: 5.5, text: "Every necromancer of the Hollow Host learned here." }] },
      { bg: 'scene:scholo_study', dur: 10, cam: [[0, 0, 1.0], [0, -2, 1.2]], fx: ['fadeout'],
        actors: [{ a: 'mob:darkmaster_gandling', x: 40, y: 0, w: 34, from: { y: -20, o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: 'Headmaster Sallow never lets a student leave.' }, { t: 5, who: 'Headmaster Sallow', text: 'School is in session!' }] },
    ] },
    { id: 'strat_intro', instance: 'stratholme', title: 'Graymouth', music: 'dungeon', shots: [
      { bg: 'scene:stratholme_gate', dur: 10, cam: [[0, 0, 1.15], [0, 2, 1.02]], fx: ['fadein', 'embers'],
        lines: [{ t: 0.5, text: 'When the plague reached Graymouth, its lord barred the gates with the living still inside.' }, { t: 5.5, text: 'It turned anyway. It has been burning ever since.' }] },
      { bg: 'scene:strat_bastion', dur: 10, cam: [[-4, 0, 1.12], [4, 0, 1.12]], fx: ['embers'],
        actors: [{ a: 'mob:crimson_guardsman', x: 56, y: 2, w: 22 }, { a: 'mob:crimson_conjuror', x: 28, y: 2, w: 20, from: { x: 8, o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: 'The Order of the Pyre holds the living side of the city. Its Grand Crusader is not what he seems.' }, { t: 5.5, text: 'The dead hold the rest.' }] },
      { bg: 'scene:strat_ziggurat', dur: 10, cam: [[0, 0, 1.0], [0, -2, 1.2]], fx: ['shake@5', 'fadeout'],
        actors: [{ a: 'mob:baron_rivendare', x: 40, y: 0, w: 34, from: { y: -20, o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: 'Among the ziggurats rules Baron Mortvale, lord of the Hollow Host.' }, { t: 5, who: 'Baron Mortvale', text: 'Intruders! More pawns for my master.' }] },
    ] },
    { id: 'archive_intro', instance: 'sunken_archive', title: 'The Sunken Archive', music: 'dungeon', shots: [
      { bg: 'scene:archive_steps', dur: 9, cam: [[0, 0, 1.15], [0, 2, 1.02]], fx: ['fadein'],
        lines: [{ t: 0.5, text: "Under the drowned orchards lies the great library of Sael'anor, ten thousand years under the sea." }, { t: 5, text: 'Its keepers never stopped working. They never stopped being dead, either.' }] },
      { bg: 'scene:archive_hall', dur: 10, cam: [[-4, 0, 1.12], [4, 0, 1.12]],
        actors: [{ a: 'mob:drowned_scholar', x: 56, y: 2, w: 22 }, { a: 'mob:archive_wardkeeper', x: 28, y: 2, w: 20, from: { x: 8, o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: 'Drowned scholars still read the same pages. Ink moves in the water like something alive.' }, { t: 5.5, text: 'Every tide chart the Tidecrown needs was written here.' }] },
      { bg: 'scene:archive_sanctum', dur: 10, cam: [[0, 0, 1.0], [0, -2, 1.2]], fx: ['fadeout'],
        actors: [{ a: 'mob:lady_vessaria', x: 40, y: 0, w: 34, from: { y: -20, o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: "Lady Vessaria, Aeldran's scribe, writes the drowned back into the world." }, { t: 5, who: 'Lady Vessaria', text: 'Every word I write, the sea obeys.' }] },
    ] },
    { id: 'shalzua_intro', instance: 'shalzua_temple', title: "Temple of Shal'zua", music: 'dungeon', shots: [
      { bg: 'scene:temple_steps', dur: 9, cam: [[0, 0, 1.15], [0, 2, 1.02]], fx: ['fadein'],
        lines: [{ t: 0.5, text: "The Wavebreaker trolls once served Shal'zua, a spirit of the sea. When the isle sank, they sank with it." }, { t: 5, text: 'They are praying again.' }] },
      { bg: 'scene:shalzua_shrine', dur: 10, cam: [[-4, 0, 1.12], [4, 0, 1.12]],
        actors: [{ a: 'mob:wavebreaker_zealot', x: 56, y: 2, w: 22 }, { a: 'mob:wavebreaker_spiritcaller', x: 28, y: 2, w: 20, from: { x: 8, o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: 'Hexmother Oyala raised the drowned tribe. High Priest Zan\'jin feeds the altar.' }, { t: 5.5, text: 'But the thing they pray to does not answer like a spirit.' }] },
      { bg: 'scene:shalzua_sanctum', dur: 10, cam: [[0, 0, 1.0], [0, -2, 1.2]], fx: ['shake@5', 'fadeout'],
        actors: [{ a: 'mob:avatar_of_shalzua', x: 40, y: 0, w: 38, from: { y: -20, o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: "Shal'zua's avatar rises from the altar, wearing the spirit's face. Something else looks out through its eyes." }, { t: 5, who: "Avatar of Shal'zua", text: 'I... was a god...' }] },
    ] },
    { id: 'mc_intro', instance: 'molten_core', title: 'The Magma Throne', music: 'dungeon', shots: [
      { bg: 'scene:molten_core_gate', dur: 10, cam: [[0, 2, 1.18], [0, 0, 1.02]], fx: ['fadein', 'embers'],
        lines: [{ t: 0.5, text: 'Below Cinderpeak Depths lies a sea of fire. The Slagborn dug toward it to pay their debts, and did not stop when the stone grew hot.' }, { t: 6, text: 'The Emperor is gone now. Nothing keeps Vulcarn asleep.' }] },
      { bg: 'scene:mc_halls', dur: 10, cam: [[-4, 0, 1.12], [4, 0, 1.12]], fx: ['embers'],
        actors: [{ a: 'mob:core_hound', x: 26, y: 2, w: 24 }, { a: 'mob:majordomo_executus', x: 62, y: 2, w: 24, anim: 'breathe', from: { x: 80, o: 0 }, dur: 1.8 }],
        lines: [{ t: 0.5, text: 'His lieutenants guard the runes that feed the fire: hounds of living lava, lords of flame, and the Steward who keeps his house.' }, { t: 6, who: 'Steward Cindral', text: 'The King Below\'s house is not open to the living.' }] },
      { bg: 'scene:mc_lake', dur: 11, cam: [[0, 0, 1.0], [0, -2, 1.22]], fx: ['shake@5', 'fadeout'],
        actors: [{ a: 'mob:ragnaros', x: 40, y: 0, w: 50, anim: 'breathe', from: { y: 18, o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: 'At the heart of the mountain, the lava lake begins to rise.' }, { t: 5.5, who: 'Vulcarn', text: 'They dug toward me to pay their little debts. Now the little ones come to put out the fire? Burn.' }] },
    ] },
    { id: 'onyxia_intro', instance: 'onyxias_lair', title: "Veshmira's Lair", music: 'dungeon', shots: [
      { bg: 'scene:the_wyrmbog', dur: 10, cam: [[-4, 0, 1.12], [4, 0, 1.12]], fx: ['fadein', 'embers'],
        actors: [{ a: 'mob:brood_dragonspawn', x: 58, y: 2, w: 22 }],
        lines: [{ t: 0.5, text: 'For years Veshmira bought the Accord one debt at a time. When her deal came to light, she flew home to her hoard.' }, { t: 5.5, text: 'Home is the Dragonmire, deep in Saltmarsh, where her brood guards the gold.' }] },
      { bg: 'scene:lair_tunnel', dur: 10, cam: [[0, 0, 1.18], [0, 0, 1.02]],
        actors: [{ a: 'mob:onyxian_warder', x: 30, y: 2, w: 24 }, { a: 'mob:onyxian_warder', x: 66, y: 2, w: 24, flip: true }],
        lines: [{ t: 0.5, text: 'Her warders hold the tunnel. Beyond them, the whelps of a whole new brood are hatching in the heat.' }, { t: 5.5, text: 'Over the sea, her storm still hides the risen isle. It will not break while she lives.' }] },
      { bg: 'scene:lair_cavern', dur: 11, cam: [[0, 0, 1.0], [0, -2, 1.22]], fx: ['shake@5', 'fadeout'],
        actors: [{ a: 'mob:onyxia', x: 40, y: 0, w: 48, anim: 'breathe', from: { y: -10, o: 0 }, dur: 1.4 }],
        lines: [{ t: 0.5, text: 'The creditor waits on a nest of scorched stone and stolen coin.' }, { t: 5.5, who: 'Veshmira', text: 'You came all this way to settle your debts? Very well. I accept payment in blood.' }] },
    ] },
    { id: 'tidecrown_intro', instance: 'tidecrown_citadel', title: 'The Tidecrown Citadel', music: 'dungeon', shots: [
      { bg: 'scene:tidecrown_gate', dur: 9, cam: [[0, 0, 1.15], [0, 2, 1.02]], fx: ['fadein'],
        lines: [{ t: 0.5, text: "At the end of the causeway stands the Tidecrown Citadel, Prince Aeldran's seat. The Accord and the Krugar arrive at its gate on the same morning." }, { t: 5.5, text: 'For once, neither side draws on the other.' }] },
      { bg: 'scene:citadel_throne', dur: 10, cam: [[-4, 0, 1.12], [4, 0, 1.12]],
        actors: [{ a: 'mob:prince_aeldran', x: 44, y: 0, w: 34, from: { o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: 'The prince waits on his coral throne, with his drowned court around him.' }, { t: 5, who: 'Prince Aeldran', text: 'Ten thousand years I waited. You will not take the surface from me.' }] },
      { bg: 'scene:citadel_abyss', dur: 10, cam: [[0, 0, 1.0], [0, -2, 1.22]], fx: ['shake@5', 'fadeout'],
        actors: [{ a: 'mob:nalveshra', x: 40, y: 0, w: 42, from: { y: 20, o: 0 }, dur: 2.4 }],
        lines: [{ t: 0.5, text: 'Below the throne, the Deepmother waits in the dark.' }, { t: 5, who: "Nal'veshra", text: 'Little lights. I will swallow you as I swallowed the spirit.' }] },
    ] },
    // level beats (v10.2): a short scene on reaching a level, where you are (@here); faction: only that side
    { id: 'ms_notice', beat: true, scene: true, level: 5, title: 'The Notice', music: 'town', shots: [
      { bg: 'scene:@here', dur: 10, cam: [[0, 0, 1.08], [0, -2, 1.2]], fx: ['fadein', 'fadeout'],
        lines: [{ t: 0.5, text: 'Across the realm, the same notice goes up on every inn door.' }, { t: 4.5, text: 'It lists debts: farms, forges, fishing boats. At the bottom, a black seal, a closed ledger.' }] },
    ] },
    { id: 'ms_smokepit', faction: 'horde', scene: true, quest: 'hidden_enemies', on: 'done', level: 13, title: 'The Offering Bowl', music: 'dungeon', shots: [
      { bg: 'scene:ragefire_chasm', dur: 10, cam: [[0, 2, 1.14], [0, 0, 1.04]], fx: ['fadein', 'embers', 'fadeout'],
        lines: [{ t: 0.5, text: 'Bazzak the Hungerer falls in the Smoke Pit beneath Vazhrak.' }, { t: 4.5, text: 'In the cult\'s offering bowl lies a coin, still warm, stamped with a claw.' }] },
    ] },
    { id: 'ms_quarry', faction: 'alliance', scene: true, quest: 'quarry_ledgers', on: 'done', level: 16, title: 'Where the Ore Goes', music: 'ambermoor', shots: [
      { bg: 'scene:gold_coast_quarry', dur: 10, cam: [[-3, 0, 1.1], [0, 0, 1.04]], fx: ['fadein', 'fadeout'],
        lines: [{ t: 0.5, text: 'The overseers keep neat books. Every cart of ore goes the same way: to a cove under Fenwick.' }, { t: 5, text: 'Paid in full, by a lender nobody in Longfield has met: the Black Ledger.' }] },
    ] },
    { id: 'ms_caravan', faction: 'horde', scene: true, quest: 'venture_contracts', on: 'done', level: 16, title: 'Whatever Banner You Fly', music: 'town', shots: [
      { bg: 'scene:crossroads', dur: 12, cam: [[0, 0, 1.08], [0, 2, 1.18]], fx: ['fadein', 'fadeout'],
        lines: [{ t: 0.5, text: 'Norrin spreads the goblin contracts across the table. The Deepgold Company is not the one paying.' }, { t: 4.5, who: 'Apothecary Norrin', text: 'Same black seal on every page. And this one is signed by one of our own caravan masters.' }, { t: 8.5, text: 'At the foot of each page, in small print: whatever banner you fly, the Ledger holds your debts.' }] },
    ] },
    { id: 'ms_whelps', faction: 'alliance', scene: true, quest: 'whelp_hunt', on: 'done', level: 23, title: 'The Strongbox', music: 'dungeon', shots: [
      { bg: 'scene:galardell_valley', dur: 10, cam: [[0, 2, 1.16], [0, 0, 1.04]], fx: ['fadein', 'fadeout'],
        actors: [{ a: 'mob:black_dragon_whelp', x: 44, y: 2, w: 26, anim: 'breathe', from: { o: 0 }, dur: 1.4 }],
        lines: [{ t: 0.5, text: 'The black whelps sleep curled around a strongbox, like cats around a stove.' }, { t: 5, text: 'Its lock is stamped with a closed ledger.' }] },
    ] },
    { id: 'ms_crates', beat: true, scene: true, faction: 'horde', level: 23, title: 'Stamped Crates', music: 'town', shots: [
      { bg: 'scene:@here', dur: 10, cam: [[0, 0, 1.08], [0, -2, 1.18]], fx: ['fadein', 'fadeout'],
        lines: [{ t: 0.5, text: 'The camp\'s new axes arrive in crates stamped with a closed ledger.' }, { t: 4.5, text: 'The quartermaster signs for them without reading. Everyone signs without reading.' }] },
    ] },
    { id: 'ms_wyrmchain', faction: 'alliance', scene: true, quest: 'whelp_collars', on: 'done', level: 29, title: 'New Chains', music: 'dungeon', shots: [
      { bg: 'scene:angerfang_encampment', dur: 10, cam: [[0, 2, 1.14], [0, 0, 1.04]], fx: ['fadein', 'embers', 'fadeout'],
        lines: [{ t: 0.5, text: 'The Wyrmchain\'s chains are new, and the collars on the whelps are fine steel.' }, { t: 5, text: 'Folded in a collar is the smith\'s receipt: paid by the Black Ledger, in advance.' }] },
    ] },
    { id: 'ms_badges', faction: 'horde', scene: true, quest: 'syndicate_badges', on: 'done', level: 27, title: 'Scratched Seals', music: 'dungeon', shots: [
      { bg: 'scene:durnholde_keep', dur: 10, cam: [[3, 0, 1.12], [0, 0, 1.04]], fx: ['fadein', 'fadeout'],
        lines: [{ t: 0.5, text: 'Every badge carries the seal of a noble house of Kingsmere.' }, { t: 4.5, text: 'On every one, someone has scratched the seal away.' }] },
    ] },
    { id: 'ms_initial', scene: true, quest: ['a_documents', 'h_documents'], on: 'done', level: 38, title: 'Signed M.', music: 'dungeon', shots: [
      { bg: 'scene:stromgarde_keep', dur: 10, cam: [[0, 0, 1.06], [0, -2, 1.2]], fx: ['fadein', 'fadeout'],
        lines: [{ t: 0.5, text: 'The orders are dry and exact: who to rob, who to pay, who to bury.' }, { t: 5, text: 'Each one is signed with a single letter: M.' }] },
    ] },
    // Rumhook Bay (v10.9): the factor's order shows where Longfield's grain goes
    { id: 'ms_factor', scene: true, quest: 'rh_factor', on: 'done', level: 40, title: 'Food for the Diggers', music: 'dungeon', shots: [
      { bg: 'scene:bonded_yard', dur: 9, cam: [[0, 0, 1.06], [0, -2, 1.2]], fx: ['fadein'],
        lines: [{ t: 0.5, text: 'The factor\'s order is dry and exact: every sack from Longfield, by ship to Coppergulch, then over the sand.' }, { t: 5, text: 'At the end of the road is Cinderpeak, where the Slagborn dig to pay what they owe.' }] },
      { bg: 'scene:bonded_yard', dur: 7, cam: [[0, -2, 1.2], [0, -3, 1.26]], fx: ['fadeout'],
        lines: [{ t: 0.5, text: 'Diggers have to eat. The order is signed with the same single letter: M.' }] },
    ] },
    { id: 'ms_deeds', beat: true, scene: true, level: 43, title: 'Deeds by the Stack', music: 'town', shots: [
      { bg: 'scene:gadgetzan', dur: 10, cam: [[-3, 0, 1.1], [0, 0, 1.04]], fx: ['fadein', 'fadeout'],
        lines: [{ t: 0.5, text: 'In Coppergulch, the Black Ledger has opened an office.' }, { t: 4.5, text: 'Farm deeds from Longfield sell by the stack. Nobody asks where the farmers went.' }] },
    ] },
    { id: 'ms_courier', beat: true, scene: true, level: 46, title: 'Count the Coins', music: 'dungeon', shots: [
      { bg: 'scene:@here', dur: 10, cam: [[0, 0, 1.06], [0, 2, 1.18]], fx: ['fadein', 'fadeout'],
        actors: [{ a: 'hero', x: 40, y: 2, w: 30, anim: 'breathe', from: { o: 0 }, dur: 1.2 }],
        lines: [{ t: 0.5, text: 'A courier finds you on the road, hands you a folded note, and will not say who sent him.' }, { t: 5, text: 'Smuggled out of the mountain, in a careful hand: "Count the coins. G. H."' }] },
    ] },
    { id: 'ms_vale', scene: true, quest: ['bsa_blackrock', 'bsh_blackrock'], on: 'done', level: 53, title: 'A Cheap Mine', music: 'dungeon', shots: [
      { bg: 'story:blackrock_mountain', dur: 10, cam: [[0, 2, 1.16], [0, 0, 1.04]], fx: ['fadein', 'embers', 'fadeout'],
        lines: [{ t: 0.5, text: 'High on the Spire, Lord Kethran Vale watches the Cinderpeak orcs drill.' }, { t: 5, who: 'Lord Vale', text: 'A burning mountain is a cheap mine.' }] },
    ] },
    { id: 'ms_broodwing', faction: 'horde', scene: true, quest: 'bsh_broodlings', on: 'done', level: 54, title: 'Gold Among the Eggs', music: 'dungeon', shots: [
      { bg: 'scene:terror_wing_path', dur: 10, cam: [[0, 0, 1.08], [0, -2, 1.2]], fx: ['fadein', 'embers', 'fadeout'],
        lines: [{ t: 0.5, text: 'On the Broodwing Path, the broodlings hatch by the dozen.' }, { t: 4.5, text: 'Someone has scattered gold among the eggs, the way a farmer scatters grain for hens.' }] },
    ] },
    // Main-story quest scenes (v10.2): a short moment when a key story quest is done (both factions where there are two)
    { id: 'ms_watch', faction: 'alliance', scene: true, quest: 'peoples_militia', on: 'done', level: 11, title: 'The Watchfires of Warrick\'s Rise', music: 'ambermoor', shots: [
      { bg: 'scene:sentinel_hill', dur: 10, cam: [[0, 2, 1.14], [0, 0, 1.04]], fx: ['fadein', 'embers', 'fadeout'],
        actors: [{ a: 'hero', x: 40, y: 2, w: 30, anim: 'breathe', from: { o: 0 }, dur: 1.4 }],
        lines: [{ t: 0.5, text: 'The Grey Hood trappers are gone from the roads. At Warrick\'s Rise, the farmers light the watchfires again.' }, { t: 5.5, who: 'Bram Oakhollow', text: 'Let them count us now. The Farmers\' Watch still stands.' }] },
    ] },
    { id: 'ms_blackwell', faction: 'alliance', scene: true, quest: 'defias_brotherhood', on: 'done', level: 20, title: 'The Account Remains Open', music: 'dungeon', shots: [
      { bg: 'scene:deadmines_ship', dur: 9, cam: [[-3, 0, 1.12], [2, 0, 1.06]], fx: ['fadein'],
        lines: [{ t: 0.5, text: 'Corvin Blackwell is dead. His last ship still sits in the cove, loaded with Longfield\'s grain.' }] },
      { bg: 'scene:deadmines_ship', dur: 9, cam: [[2, 0, 1.06], [0, -2, 1.22]], fx: ['fadeout'],
        lines: [{ t: 0.5, text: 'In his cabin lies a note, in a clerk\'s neat hand:' }, { t: 3.5, text: '"Payment received. The account remains open."' }] },
    ] },
    { id: 'ms_coin', scene: true, quest: ['venture_ledgers_a', 'venture_ledgers_h'], on: 'done', level: 33, title: 'The Warm Coin', music: 'dungeon', shots: [
      { bg: 'scene:venture_base_camp', dur: 10, cam: [[0, 0, 1.06], [0, -2, 1.22]], fx: ['fadein', 'embers', 'fadeout'],
        lines: [{ t: 0.5, text: 'The goblins\' ledgers balance to the copper.' }, { t: 4, text: 'Every page is paid in the same coin: warm to the touch, and stamped with a claw.' }] },
    ] },
    { id: 'ms_hale_cell', faction: 'alliance', scene: true, quest: 'brd_jail_break', on: 'done', level: 54, title: 'The Last Door', music: 'dungeon', shots: [
      { bg: 'scene:brd_prison', dur: 8, cam: [[0, 2, 1.16], [0, 0, 1.04]], fx: ['fadein', 'embers'],
        actors: [{ a: 'story:windsor', x: 42, y: 2, w: 30, anim: 'breathe', from: { o: 0 }, dur: 1.6 }],
        lines: [{ t: 0.5, text: 'Behind the last door of the detention block, Marshal Hale is still counting: in chalk, on the wall.' }] },
      { bg: 'scene:brd_prison', dur: 10, cam: [[0, 0, 1.04], [0, -2, 1.2]], fx: ['embers', 'fadeout'],
        actors: [{ a: 'story:windsor', x: 42, y: 2, w: 30, anim: 'breathe' }],
        lines: [{ t: 0.5, who: 'Hale', text: 'My notes first. The Emperor keeps them.' }, { t: 4.5, who: 'Hale', text: 'Bring me those, and then we can talk about doors.' }] },
    ] },
    { id: 'ms_archive', scene: true, quest: ['st_ledger_a', 'st_ledger_h'], on: 'done', level: 58, title: 'Settled in Full', music: 'dungeon', shots: [
      { bg: 'scene:strat_city', dur: 11, cam: [[3, 0, 1.12], [0, 0, 1.04]], fx: ['fadein', 'embers', 'fadeout'],
        lines: [{ t: 0.5, text: 'The archivist listed every cart of grain that carried the plague into Wexmoor.' }, { t: 5, text: 'Beside one line he wrote, and underlined twice: "Account settled in full."' }] },
    ] },
    { id: 'ch2', level: 20, title: 'Chapter 2: The Collector\'s Fleet', music: 'dungeon', shots: [
      { bg: 'story:stormwind_keep', dur: 10, cam: [[0, 2, 1.18], [0, 0, 1.04]], fx: ['fadein'],
        lines: [{ t: 0.5, text: 'Corvin Blackwell once built the finest ships in Longfield. The Ledger lent him the timber.' }, { t: 5.2, text: 'One bad season, and the Ledger took the yard, the ships and the house. It let him keep the debt.' }] },
      { bg: 'scene:deadmines_ship', dur: 11, cam: [[0, 0, 1.0], [0, -2, 1.2]], fx: ['embers'],
        actors: [{ a: 'story:vancleef_story', x: 44, y: 0, w: 40, anim: 'breathe', from: { o: 0 }, dur: 1.6 }],
        lines: [{ t: 0.5, who: 'Corvin Blackwell', text: 'They said I could work it off. Every farm I take knocks a little off what I owe.' }, { t: 5.2, who: 'Corvin Blackwell', text: 'Now they want a fleet. I build what I am told, and I stop asking questions.' }] },
      { bg: 'scene:moonbrook', dur: 10, cam: [[-4, 0, 1.12], [4, 0, 1.12]], fx: ['embers'],
        actors: [{ a: 'story:defias_crowd', x: 48, y: 0, w: 46, from: { x: 80, o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: 'From Fenwick, the Grey Hoods spread across Longfield, and the seized grain went down to the Smugglers\' Deep.' }, { t: 5, text: 'The Ledger paid for the fleet in coins that stay warm in the hand, each one stamped with a claw.' }] },
      { bg: 'story:shadow_court', dur: 12, cam: [[0, 0, 1.05], [0, 2, 1.22]], fx: ['shake@9'],
        actors: [{ a: 'story:prestor_shadow', x: 40, y: 2, w: 36, anim: 'breathe', from: { o: 0 }, dur: 2 }],
        lines: [{ t: 0.6, who: 'Lady Thorne', text: 'Let the farmers and the collectors quarrel. Quarrels are cheap.' }, { t: 5, who: 'Lady Thorne', text: 'A kingdom busy with its own debts never reads its own books.' }, { t: 9.2, text: 'Somewhere, whoever holds the Ledger\'s purse is counting.' }] },
      { bg: 'scene:@here', dur: 10, cam: [[0, 0, 1.12], [0, 0, 1.0]], fx: ['fadeout'],
        actors: [{ a: 'hero:player', x: 38, y: 2, w: 26, anim: 'breathe' }],
        lines: [{ t: 0.5, text: 'Rumours reach every city, {name}: the Ledger\'s gold comes from no mine in Caldreth.' }, { t: 5, text: 'Blackwell\'s fleet waits in the Smugglers\' Deep. Accord or Krugar, everyone owes someone.' }] },
    ] },
    { id: 'ch3', level: 30, title: 'Chapter 3: The Audit', music: 'dungeon', shots: [
      { bg: 'story:stormwind_keep', dur: 10, cam: [[0, 2, 1.18], [0, 0, 1.04]], fx: ['fadein'],
        actors: [{ a: 'story:bolvar', x: 40, y: 2, w: 34, anim: 'breathe', from: { o: 0 }, dur: 1.6 }],
        lines: [{ t: 0.5, text: 'Reports reached the keep: black dragon whelps guarding Ledger strongboxes in Stoneharrow.' }, { t: 5.2, who: 'Lord Regent Carrow', text: 'Dragons, guarding coin? Send Marshal Hale. He was an auditor before he was a soldier.' }] },
      { bg: 'scene:galardell_valley', dur: 10, cam: [[-4, 0, 1.12], [4, 0, 1.12]],
        actors: [{ a: 'mob:black_dragon_whelp', x: 52, y: 18, w: 26, anim: 'breathe', from: { x: 90, o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: 'Marshal Gideon Hale rode east with his best soldiers and his account books.' }, { t: 5, text: 'In Dunmore Valley he found the whelps, and the claw-stamped coins they guarded.' }] },
      { bg: 'scene:angerfang_encampment', dur: 10, cam: [[0, 0, 1.0], [0, -2, 1.18]], fx: ['embers'],
        actors: [{ a: 'mob:dragonmaw_grunt', x: 30, y: 0, w: 26 }, { a: 'mob:crimson_whelp', x: 60, y: 6, w: 20, from: { o: 0 }, dur: 1.6 }],
        lines: [{ t: 0.5, text: 'North, in Greenfen, the Wyrmchain orcs breed red drakes, and they are paid in the same warm gold.' }, { t: 5, text: 'Every road the coins took ended at Cinderpeak, where the Ledger keeps a vault in the Spire.' }] },
      { bg: 'story:blackrock_mountain', dur: 9, cam: [[0, 0, 1.05], [0, 2, 1.2]], fx: ['embers', 'shake@6'],
        lines: [{ t: 0.5, text: 'The marshal went in to audit the vault.' }, { t: 4.5, text: 'He did not come out.' }] },
      { bg: 'story:shadow_court', dur: 11, cam: [[0, 0, 1.05], [0, 2, 1.22]],
        actors: [{ a: 'story:prestor_shadow', x: 40, y: 2, w: 36, anim: 'breathe', from: { o: 0 }, dur: 2 }],
        lines: [{ t: 0.6, who: 'Lady Thorne', text: 'The marshal read too many ledgers. Let the mountain keep him.' }, { t: 5.4, who: 'Lady Thorne', text: 'My accounts will show he fled with crown funds. Accounts do not lie, my lord.' }] },
      { bg: 'scene:@here', dur: 10, cam: [[0, 0, 1.12], [0, 0, 1.0]], fx: ['fadeout'],
        actors: [{ a: 'hero:player', x: 38, y: 2, w: 26, anim: 'breathe' }],
        lines: [{ t: 0.5, text: 'The court says Hale stole from the crown, {name}. The soldiers who rode with him say otherwise.' }, { t: 5, text: 'The road he took runs through places you will soon walk.' }] },
    ] },
    { id: 'ch4', level: 40, title: 'Chapter 4: Cinderpeak Rising', music: 'dungeon', shots: [
      { bg: 'story:blackrock_mountain', dur: 10, cam: [[0, 0, 1.05], [0, 2, 1.2]], fx: ['fadein', 'embers'],
        lines: [{ t: 0.5, text: 'Cinderpeak burns day and night. Deep inside, the Slagborn dwarves dig to pay what they owe.' }, { t: 5.2, text: 'Somewhere in their cells, a soldier of Kingsmere is still alive: Marshal Hale.' }] },
      { bg: 'story:blackrock_mountain', dur: 10, cam: [[0, 2, 1.2], [0, 0, 1.05]], fx: ['embers', 'shake@6'],
        actors: [{ a: 'story:ragnaros', x: 40, y: 0, w: 40, anim: 'breathe', from: { y: -16, o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: 'Below them all, in a sea of fire, sleeps Vulcarn, the King Below.' }, { t: 5.2, who: 'Vulcarn', text: 'Let them dig. Every stone they break brings my fire closer to the world above.' }] },
      { bg: 'story:blackrock_mountain', dur: 10, cam: [[-3, 0, 1.12], [3, 0, 1.12]],
        actors: [{ a: 'story:nefarian', x: 40, y: 2, w: 36, anim: 'breathe', from: { o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: 'Above them, in the Spire, Lord Kethran Vale keeps the Ledger\'s vault, and the Cinderpeak orcs guard it.' }, { t: 5.2, who: 'Lord Kethran Vale', text: 'A burning mountain is a cheap mine. Let the Emperor dig. Every hall he opens, he opens on credit.' }] },
      { bg: 'story:shadow_court', dur: 11, cam: [[0, 0, 1.05], [0, 2, 1.22]],
        actors: [{ a: 'story:prestor_shadow', x: 40, y: 2, w: 36, anim: 'breathe', from: { o: 0 }, dur: 2 }],
        lines: [{ t: 0.6, who: 'Lady Thorne', text: 'The Emperor digs, the Regent signs, and the books balance.' }, { t: 5.4, who: 'Lady Thorne', text: 'And the marshal? Let him count the stones of his cell. He will not be the last.' }] },
      { bg: 'scene:@here', dur: 10, cam: [[0, 0, 1.12], [0, 0, 1.0]], fx: ['fadeout'],
        actors: [{ a: 'hero:player', x: 38, y: 2, w: 26, anim: 'breathe' }],
        lines: [{ t: 0.5, text: 'Word travels fast on the roads, {name}: Hale was seen alive, in chains, under the mountain.' }, { t: 5, text: 'Someone will have to go and get him. Not yet. But soon.' }] },
    ] },
    { id: 'ch5', level: 50, title: 'Chapter 5: Balancing the Books', music: 'dungeon', shots: [
      { bg: 'story:shadow_court', dur: 11, cam: [[0, 0, 1.05], [0, 2, 1.22]], fx: ['fadein'],
        actors: [{ a: 'story:prestor_shadow', x: 40, y: 2, w: 36, anim: 'breathe', from: { o: 0 }, dur: 2 }],
        lines: [{ t: 0.6, who: 'Lady Thorne', text: 'The Emperor has his golems. Lord Vale has his vault.' }, { t: 5.4, who: 'Lady Thorne', text: 'And Kingsmere has me. The coronation is set, and every page the Regent signs, I wrote first.' }] },
      { bg: 'scene:brd_prison', dur: 10, cam: [[-4, 0, 1.12], [4, 0, 1.12]], fx: ['embers'],
        actors: [{ a: 'mob:anvilrage_warden', x: 58, y: 2, w: 22 }],
        lines: [{ t: 0.5, text: 'In the cells of Cinderpeak Depths, Marshal Hale counts. Not the days: the coins.' }, { t: 5.2, text: 'He has written down every warm coin that passed through the mountain, and every one leads to a single purse.' }] },
      { bg: 'scene:brd_throne', dur: 10, cam: [[0, 0, 1.0], [0, -2, 1.18]], fx: ['embers'],
        actors: [{ a: 'mob:emperor_dagran_thaurissan', x: 40, y: 0, w: 34, from: { o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: "The guards took the marshal's notes to the Emperor himself." }, { t: 5.2, who: 'Emperor Grimmark', text: 'Let the human scribble. Nobody leaves my mountain to read it.' }] },
      { bg: 'story:stormwind_keep', dur: 10, cam: [[0, 2, 1.18], [0, 0, 1.04]],
        actors: [{ a: 'story:bolvar', x: 40, y: 2, w: 34, anim: 'breathe', from: { o: 0 }, dur: 1.6 }],
        lines: [{ t: 0.5, who: 'Lord Regent Carrow', text: 'If Hale is alive, I want him home.' }, { t: 5, who: 'Lord Regent Carrow', text: 'And I want to know why my Mistress of Coin called him a thief.' }] },
      { bg: 'scene:@here', dur: 10, cam: [[0, 0, 1.12], [0, 0, 1.0]], fx: ['fadeout'],
        actors: [{ a: 'hero:player', x: 38, y: 2, w: 26, anim: 'breathe' }],
        lines: [{ t: 0.5, text: 'Cinderpeak Depths waits under the mountain, {name}. The marshal is in its cells; his notes are on the Emperor\'s throne.' }, { t: 5.5, text: 'Whatever banner you fly, the Ledger holds your debts too.' }] },
    ] },
    { id: 'ch6', level: 60, title: 'Chapter 6: The Creditor', music: 'dungeon', shots: [
      { bg: 'scene:brd_prison', dur: 10, cam: [[-3, 0, 1.12], [3, 0, 1.12]], fx: ['fadein', 'embers'],
        actors: [{ a: 'story:windsor', x: 40, y: 2, w: 32, anim: 'breathe', from: { o: 0 }, dur: 1.6 }],
        lines: [{ t: 0.5, text: 'The cell doors of Cinderpeak Depths stand open. Marshal Gideon Hale walks out into the light.' }, { t: 5.2, who: 'Marshal Hale', text: 'Kingsmere. Now. Before the coronation.' }] },
      { bg: 'story:stormwind_keep', dur: 11, cam: [[0, 2, 1.18], [0, 0, 1.04]],
        actors: [{ a: 'story:windsor', x: 20, y: 2, w: 30, flip: true, from: { x: 0, o: 0 }, dur: 2 }, { a: 'story:bolvar', x: 62, y: 2, w: 30, anim: 'breathe' }],
        lines: [{ t: 0.5, who: 'Marshal Hale', text: 'My lord Regent, read my notes. Every coin the Ledger lent this crown came out of one purse.' }, { t: 5.5, who: 'Lord Regent Carrow', text: 'Lady Thorne has kept our books for years, Marshal.' }] },
      { bg: 'story:stormwind_keep', dur: 10, cam: [[0, 2, 1.12], [0, 0, 1.02]],
        actors: [{ a: 'story:windsor', x: 16, y: 2, w: 28, flip: true }, { a: 'story:lyveus', x: 56, y: 2, w: 30, anim: 'breathe', from: { x: 80, o: 0 }, dur: 1.8 }],
        lines: [{ t: 0.5, who: 'Marshal Hale', text: 'And I did not come alone. Your court buried this knight five years ago, my lord.' }, { t: 5.2, who: 'Lyveus Cloveus', text: 'I heard them plot in these halls. They burned my home to keep it quiet. I am done being dead.' }] },
      { bg: 'story:stormwind_keep', dur: 10, cam: [[0, 0, 1.05], [0, 2, 1.2]],
        actors: [{ a: 'story:lady_prestor', x: 40, y: 2, w: 32, anim: 'breathe', from: { o: 0 }, dur: 1.6 }],
        lines: [{ t: 0.5, who: 'Lady Thorne', text: 'I deny none of it. Here is the deed, my lord.' }, { t: 5, who: 'Lady Thorne', text: 'The crown\'s debt falls due at the coronation. The kingdom is already sold.' }] },
      { bg: 'story:stormwind_keep', dur: 11, cam: [[0, 0, 1.0], [0, -2, 1.22]], fx: ['shake@1', 'embers'],
        actors: [{ a: 'story:onyxia', x: 40, y: 0, w: 46, anim: 'breathe', from: { y: -10, o: 0 }, dur: 1.2 }],
        lines: [{ t: 0.5, text: 'Then the creditor came to collect: Veshmira of the Black Brood, who lends her hoard instead of sleeping on it.' }, { t: 5.5, who: 'Veshmira', text: 'I do not want your little kingdom. I own it. I have come for my collateral.' }] },
      { bg: 'story:stormveil_storm', dur: 11, cam: [[-4, 0, 1.12], [4, 0, 1.12]],
        lines: [{ t: 0.5, text: 'Beaten back from Kingsmere, Veshmira flew south over the sea, and Lady Thorne went with her. A storm closed over the water behind them to guard her hoard.' }, { t: 5.5, text: 'Out past the storm, sailors saw land where no land had been for ten thousand years. The storm did not clear.' }] },
      { bg: 'scene:@here', dur: 10, cam: [[0, 0, 1.12], [0, 0, 1.0]], fx: ['fadeout'],
        actors: [{ a: 'hero:player', x: 38, y: 2, w: 26, anim: 'breathe' }],
        lines: [{ t: 0.5, text: 'The creditor has gone to ground in her lair in Saltmarsh, {name}. While she lives, her storm hides the new isle.' }, { t: 5.5, text: 'Harborwatch and Mudwall are already gathering. Look for her trail in your quest log.' }] },
    ] },
    // Veshmira is dead: Thorne gives herself up in the lair and names Vale for what he is; then The Drowned Crown
    { id: 'thorne_end', level: 60, title: 'The Mistress of Coin', music: 'dungeon', after: ['dw_onyxia_a', 'dw_onyxia_h'], then: 'x1', shots: [
      { bg: 'scene:lair_cavern', dur: 10, cam: [[0, 2, 1.16], [0, 0, 1.04]], fx: ['fadein', 'embers'],
        lines: [{ t: 0.5, text: 'Behind the nests, among the ledgers Veshmira kept, Lady Thorne sits at a folding desk. She is still writing.' }, { t: 5.5, who: 'Lady Thorne', text: 'She is dead, then. Her debts are not. Debts never are.' }] },
      { bg: 'scene:lair_cavern', dur: 10, cam: [[-3, 0, 1.12], [3, 0, 1.12]],
        actors: [{ a: 'story:lady_prestor', x: 40, y: 2, w: 36, anim: 'breathe', from: { o: 0 }, dur: 1.6 }],
        lines: [{ t: 0.5, who: 'Lady Thorne', text: 'I will come quietly. I have always kept my word. It is the one thing I never sold.' }, { t: 5.5, text: 'She hands over her pen as if she were settling a bill.' }] },
      { bg: 'story:blackrock_mountain', dur: 11, cam: [[0, 0, 1.05], [0, 2, 1.2]], fx: ['embers', 'shake@6'],
        actors: [{ a: 'story:nefarian', x: 40, y: 2, w: 36, anim: 'breathe', from: { o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, who: 'Lady Thorne', text: 'You think the Ledger ends here. Ask who keeps the vault in the Spire.' }, { t: 5.5, who: 'Lady Thorne', text: 'Lord Kethran Vale is Kethriax, her eldest. He has waited a long time to inherit.' }] },
      { bg: 'story:stormwind_keep', dur: 10, cam: [[0, 0, 1.12], [0, 0, 1.0]], fx: ['fadeout'],
        lines: [{ t: 0.5, text: 'Kingsmere takes Thorne back to its own gaol, to a cell among the debtors she put there.' }, { t: 5, text: 'The Spire stays shut, and its keeper has not come down. Not yet.' }] },
    ] },
    // plays once Veshmira is dead (after: any of these quests done); her death breaks the storm over the isle
    { id: 'x1', level: 60, title: 'The Drowned Crown', music: 'dungeon', needs: 'tidewatch', after: ['dw_onyxia_a', 'dw_onyxia_h'], shots: [
      { bg: 'story:stormveil_storm', dur: 9, cam: [[-4, 0, 1.12], [4, 0, 1.12]], fx: ['fadein'],
        lines: [{ t: 0.5, text: 'When Veshmira fell in her lair, the storm over the sea finally broke.' }, { t: 5, text: 'For the first time, ships could reach the isle it had hidden.' }] },
      { bg: 'story:stormveil_storm', dur: 10, cam: [[0, 2, 1.18], [0, 0, 1.04]],
        lines: [{ t: 0.5, text: "Ten thousand years ago, when the Heartfire burst, the Starborn city of Sael'anor sank beneath the sea." }, { t: 5.5, text: 'Its people should have drowned. Most of them did.' }] },
      { bg: 'scene:citadel_throne', dur: 11, cam: [[-3, 0, 1.12], [3, 0, 1.12]],
        actors: [{ a: 'story:aeldran', x: 40, y: 2, w: 34, anim: 'breathe', from: { o: 0 }, dur: 2 }],
        lines: [{ t: 0.5, text: "Their prince, Aeldran, made a bargain in the dark: his court would live on beneath the waves." }, { t: 5.5, who: 'Prince Aeldran', text: 'The sea kept us. Now the sea gives us back.' }] },
      { bg: 'scene:citadel_abyss', dur: 11, cam: [[0, 0, 1.0], [0, -2, 1.22]], fx: ['shake@6'],
        actors: [{ a: 'story:nalveshra', x: 40, y: 0, w: 46, anim: 'breathe', from: { y: 20, o: 0 }, dur: 2.4 }],
        lines: [{ t: 0.5, text: "He made the bargain with Nal'veshra, the Deepmother, a spirit older than the Starborn. She does not give anything back." }, { t: 5.8, who: "Nal'veshra", text: 'Rise, my drowned children. The world above is ours to swallow.' }] },
      { bg: 'scene:brightwater_landing', dur: 9, cam: [[-4, 0, 1.12], [4, 0, 1.12]],
        lines: [{ t: 0.5, text: 'Brineholt ships carry the Accord from Gullhaven to the Tidewatch Coast.' }] },
      { bg: 'scene:bloodtide_landing', dur: 9, cam: [[4, 0, 1.12], [-4, 0, 1.12]],
        lines: [{ t: 0.5, text: "Kessari and Reclaimed crews sail from Camp Skarn to the Skullreef Isles." }] },
      { bg: 'scene:@here', dur: 10, cam: [[0, 0, 1.12], [0, 0, 1.0]], fx: ['fadeout'],
        actors: [{ a: 'hero:player', x: 38, y: 2, w: 26, anim: 'breathe' }],
        lines: [{ t: 0.5, text: 'The Stormveil Isle has risen, {name}. Take ship and see for yourself.' }, { t: 5, text: 'Look for "The Drowned Crown" in your quest log.' }] },
    ] },
  ];
  // a chapter with `needs` waits until that zone ships (the expansion prologue)
  // the mark for a cutscene (#525), from data so new content needs no code: a raid's intro (raid_<instance>), the scene
  // that ends a Legend's questline (legend_<key>, never earlier: the name is the questline's reveal), a story chapter
  CS.mark = (ch) => {
    const M = root.ART && root.ART.marks, D = root.D; if (!M) return null;
    const L = ch.legend && D && D.LEGENDS[ch.legend], qs = [].concat(ch.quest || []);
    const key = ch.instance ? 'raid_' + ch.instance
      : L && (ch.id === 'legend_' + ch.legend || qs.includes(L.unlock)) ? 'legend_' + ch.legend : 'chapter_' + ch.id;
    return M[key] || null;
  };
  CS.CHAPTERS = CS.CHAPTERS.filter((c) => !c.needs || !root.D || (root.D.REGIONS || {})[c.needs]);
  CS.byId = (id) => CS.CHAPTERS.find((c) => c.id === id);
  CS.forInstance = (key) => CS.CHAPTERS.find((c) => c.instance === key || (c.also || []).includes(key));

  // Unlocks are account-wide so the Theater shows everything any character has reached.
  CS.unlocked = function () { try { return new Set(JSON.parse(localStorage.getItem(STORE) || '[]')); } catch (e) { return new Set(); } };
  CS.unlock = function (id) { const s = CS.unlocked(); s.add(id); try { localStorage.setItem(STORE, JSON.stringify([...s])); } catch (e) { } };

  // ------------------------------------------------------------ player
  // env: { art(kind,key) -> url, heroUrl, name, zone, startScene, hereScene, setMusic(name|null) }
  CS.play = function (ch, env) {
    if (!ch || !ch.shots || CS.playing) return Promise.resolve();
    CS.unlock(ch.id);
    return new Promise((resolve) => {
      const wrap = document.createElement('div'); wrap.className = 'cs';
      wrap.innerHTML = `<div class="cs-bar"></div><div class="cs-stage"><div class="cs-cam"><img class="cs-bg" alt=""></div><div class="cs-fx"></div><div class="cs-flash"></div><div class="cs-title"></div></div>
        <div class="cs-cap"><b class="cs-who"></b><span class="cs-text"></span><i class="cs-tap">Tap to continue</i></div><button class="cs-skip" type="button">Skip</button>`;
      document.getElementById('app').append(wrap);
      const $ = (s) => wrap.querySelector(s);
      const stage = $('.cs-stage'), cam = $('.cs-cam'), bg = $('.cs-bg'), fx = $('.cs-fx'), flash = $('.cs-flash');
      CS.playing = ch; CS.music = ch.music || null; if (env.setMusic) env.setMusic(CS.music);
      let shotIdx = -1, timers = [], anims = [], skipShot = null, done = false;
      const fill = (t) => t.replace('{name}', env.name).replace('{zone}', env.zone);
      const clear = () => { timers.forEach(clearTimeout); timers = []; anims.forEach((a) => { try { a.finish(); } catch (e) { } }); anims = []; };
      const finish = () => { if (done) return; done = true; clear(); clearTimeout(armTimer); wrap.classList.add('cs-out'); setTimeout(() => wrap.remove(), 450); CS.playing = null; CS.music = null; if (env.setMusic) env.setMusic(null); resolve(); };
      // guard against stray taps: a cutscene often starts right after a tap on a dialog (whose close button sits where
      // Skip is), so taps are ignored at first, Skip asks for a second tap, and a shot needs a moment before a tap moves on
      const t0 = performance.now(), GRACE = 1500, SHOT_GRACE = 600, ARM = 3000;
      let shotAt = t0, armed = 0, armTimer = null;
      const skipBtn = $('.cs-skip'); skipBtn.classList.add('wait');
      setTimeout(() => skipBtn.classList.remove('wait'), GRACE);
      const disarm = () => { armed = 0; clearTimeout(armTimer); skipBtn.classList.remove('armed'); skipBtn.textContent = 'Skip'; };
      skipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const now = performance.now();
        // the first tap always arms (#319: one in the first moments did nothing, so Skip took three); the second skips,
        // unless it is the same stray burst (within 0.3 s of the first, in the first moments)
        if (armed && now - armed < ARM && (now - t0 >= GRACE || now - armed >= 300)) { clearTimeout(armTimer); return finish(); }
        armed = now; skipBtn.classList.add('armed'); skipBtn.textContent = 'Tap again to skip';
        clearTimeout(armTimer); armTimer = setTimeout(disarm, ARM);
      });
      wrap.addEventListener('click', () => {
        const now = performance.now();
        if (now - t0 < GRACE || now - shotAt < SHOT_GRACE) return;
        if (armed) disarm();
        if (skipShot) skipShot();
      });
      // a raid, a Legend's last scene or a story chapter shows its mark (#525) instead of the plain title, a little longer
      const titleEl = $('.cs-title'), mk = CS.mark(ch);
      if (mk) { titleEl.innerHTML = mk; titleEl.classList.add('mark'); titleEl.setAttribute('role', 'img'); titleEl.setAttribute('aria-label', ch.title); } else titleEl.textContent = ch.title;
      titleEl.classList.add('show');
      setTimeout(() => titleEl.classList.remove('show'), mk ? 3400 : 2600);

      function src(a) {
        const [kind, key] = a.split(':');
        if (kind === 'hero') return env.heroUrl;
        if (kind === 'scene' && key === '@start') return env.art('scene', env.startScene);
        if (kind === 'scene' && key === '@here') return env.art('scene', env.hereScene);
        return env.art(kind, key);
      }
      function typeLine(line) {
        const who = $('.cs-who'), tx = $('.cs-text');
        who.textContent = line.who || ''; who.hidden = !line.who;
        const text = fill(line.text); let i = 0; tx.textContent = '';
        const tick = () => { if (done) return; tx.textContent = text.slice(0, ++i); if (i < text.length) timers.push(setTimeout(tick, 22)); };
        tick();
      }
      function particles(kind) {
        for (let i = 0; i < 26; i++) {
          const p = document.createElement('i'); p.className = 'cs-p ' + kind;
          p.style.left = (Math.random() * 100) + '%'; p.style.animationDelay = (-Math.random() * 4) + 's'; p.style.animationDuration = (3 + Math.random() * 3) + 's';
          fx.append(p);
        }
      }
      function next() {
        clear();
        shotIdx++; shotAt = performance.now();
        if (shotIdx >= ch.shots.length) return finish();
        const shot = ch.shots[shotIdx];
        // swap backdrop and actors
        stage.querySelectorAll('.cs-actor').forEach((n) => n.remove());
        fx.innerHTML = '';
        bg.src = src(shot.bg);
        const [c0, c1] = shot.cam || [[0, 0, 1], [0, 0, 1]];
        anims.push(cam.animate([{ transform: `translate(${c0[0]}%, ${c0[1]}%) scale(${c0[2]})` }, { transform: `translate(${c1[0]}%, ${c1[1]}%) scale(${c1[2]})` }], { duration: shot.dur * 1000, easing: 'ease-in-out', fill: 'forwards' }));
        for (const ac of (shot.actors || [])) {
          const el = document.createElement('img'); el.className = 'cs-actor' + (ac.anim ? ' ' + ac.anim : ''); el.alt = '';
          el.src = src(ac.a);
          el.style.left = ac.x + '%'; el.style.bottom = (ac.y || 0) + '%'; el.style.width = ac.w + '%';
          const sx = ac.flip ? -1 : 1;
          el.style.transform = `scaleX(${sx})`;
          cam.append(el);
          if (ac.from) {
            const f = ac.from;
            const tf = (x, y) => `translate(${x}%, ${y}%) scaleX(${sx})`;
            const dx = f.x != null ? (f.x - ac.x) * (100 / ac.w) : 0, dy = f.y != null ? -f.y * (100 / ac.w) : 0;
            anims.push(el.animate([{ transform: tf(dx, dy), opacity: f.o != null ? f.o : 1 }, { transform: tf(0, 0), opacity: 1 }], { duration: (ac.dur || 1.6) * 1000, delay: (ac.delay || 0) * 1000, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'both' }));
          }
        }
        for (const f of (shot.fx || [])) {
          const [name, at] = f.split('@'); const t = at ? +at * 1000 : 0;
          if (name === 'fadein') anims.push(stage.animate([{ filter: 'brightness(0)' }, { filter: 'brightness(1)' }], { duration: 1200, easing: 'ease-out' }));
          if (name === 'fadeout') timers.push(setTimeout(() => anims.push(stage.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(0)' }], { duration: 1400, fill: 'forwards' })), shot.dur * 1000 - 1400));
          if (name === 'flash') timers.push(setTimeout(() => anims.push(flash.animate([{ opacity: 0 }, { opacity: 0.95, offset: 0.08 }, { opacity: 0 }], { duration: 900 })), t));
          if (name === 'shake') timers.push(setTimeout(() => anims.push(stage.animate([0, -6, 5, -4, 3, -2, 0].map((x, i) => ({ transform: `translate(${x}px, ${i % 2 ? 2 : -2}px)` })), { duration: 700 })), t || 600));
          if (name === 'embers' || name === 'snow') particles(name);
        }
        for (const line of (shot.lines || [])) timers.push(setTimeout(() => typeLine(line), line.t * 1000));
        if (!(shot.lines || []).length) { $('.cs-who').hidden = true; $('.cs-text').textContent = ''; }
        const end = setTimeout(next, shot.dur * 1000); timers.push(end);
        // a tap jumps to the end of the shot (first tap finishes the typing)
        skipShot = () => { next(); };
      }
      next();
    });
  };

  root.CS = CS;
})(typeof window !== 'undefined' ? window : globalThis);
