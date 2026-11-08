// The Ruinfall Saga opening movie (v10.19 pre-patch): the saga's theme song (music_ruinfall_opening, 73.6 s) told in
// pictures, no words but a few title lines. It plays once per account (the cutscene store, like every chapter), the first
// time a character who has reached the pre-patch enters the world, and replays from the Theater.
// The same cut makes the video: art/promo/export_trailer.sh opening <out.mp4> (promo: true adds "Coming soon" at the end).
// Spoilers: the story so far (levels 1-60, Veshmira, the pre-patch) is shown; nothing of Chapter One beyond its setting
// (the vault in Cinderpeak Spire, the coronation in Kingsmere), no Kethriax, no new keeper; Chapters 2 and 3 only by name.
// Art: ART.opening(key) (src/art_ruinfall_opening.js, from art/promo/trailers/pack.py); 'look:cls.race' is a hero sprite.
(function (root) {
  const CS = root.CS; if (!CS) return;
  function build(promo) {
    const ART = root.ART;
    const plate = (x, num, lit) => `<g transform="translate(${x},0)">
        ${lit ? '<ellipse cx="0" cy="95" rx="96" ry="96" fill="#ff9a3a" opacity=".12"/>' : ''}
        <path d="M-70,20 L70,20 L82,95 L70,170 L-70,170 L-82,95 Z" fill="${lit ? '#2a1a10' : '#0c0a09'}" stroke="${lit ? '#f0c45a' : '#3a332c'}" stroke-width="3" stroke-linejoin="round"/>
        <text x="0" y="118" text-anchor="middle" font-family="Marcellus SC, Georgia, serif" font-size="64" fill="${lit ? '#f0c45a' : '#3a332c'}">${num}</text></g>`;
    const PLATES = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="190" viewBox="0 0 640 190">${plate(140, 'I', true)}${plate(320, 'II', false)}${plate(500, 'III', false)}</svg>`;
    const ICONS = ['intervene', 'chronomark', 'vow_of_atonement', 'set_up', 'lantern_of_faith', 'blood_bargain', 'lure', 'seed_of_renewal', 'kinship_totem', 'duet'];
    const ICON_ROW = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="150" viewBox="0 0 640 150">${ICONS.map((k, i) =>
      `<image x="${45 + (i % 5) * 124}" y="${i < 5 ? 0 : 76}" width="70" height="70" href="${'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(ART.icon(k))}"/>`).join('')}</svg>`;

    // grades: the art is bright and friendly; the movie is not
    const DUSK = 'brightness(.62) saturate(.7) sepia(.25) contrast(1.1)', NIGHT = 'brightness(.5) saturate(.6) hue-rotate(-12deg) contrast(1.15)',
      ASH = 'brightness(.55) saturate(.25) sepia(.35) contrast(1.1)', BLOOD = 'brightness(.6) saturate(1.2) sepia(.4) hue-rotate(-18deg) contrast(1.15)';
    const hero = (k, x, o = {}) => Object.assign({ a: 'look:' + k, x, y: 3 }, o, { w: Math.round((o.w || 20) * 1.25) }); /* a hero a quarter bigger than the scene's own spacing */
    // timeline: [start second, shot]; each shot lasts until the next one starts (the last until END)
    const END = 73.6;
    const T = [
      // --- cold open: the boom at 1.0
      [0, { fx: ['embers'] }],
      [1.0, { bg: 'opening:rf_torn_land', cam: [[0, 3, 1.25], [0, 1, 1.12]], fx: ['flash@0', 'shake@0.05', 'embers'],
        actors: [{ a: 'story:deathwing', x: 40, y: 6, w: 56, anim: 'breathe', from: { y: -24, o: 0 }, dur: 1.4 }], card: { kicker: 'LONG AGO', cls: 'low', at: 0.4, out: 99 } }],
      [3.0, { bg: 'story:azeroth_dawn', filter: NIGHT, cam: [[-3, 0, 1.12], [1, -1, 1.16]], fx: ['embers'],
        actors: [{ a: 'story:deathwing', x: 66, y: 40, w: 22, flip: true, from: { x: 30, y: 0, o: 0 }, dur: 2 }] }],
      [5.0, { bg: 'opening:rf_war_field', cam: [[4, 0, 1.15], [0, 0, 1.12]], card: { kicker: 'THE LONG WAR ENDED', cls: 'low', at: 0.2, out: 99 } }],
      [7.0, { bg: 'opening:rf_ledger', cam: [[0, 2, 1.04], [0, -1, 1.14]], fx: ['fadeout@0.5'], card: { kicker: 'AND EVERYONE BORROWED', cls: 'low', at: 0.2, out: 99 } }],
      [9.0, { bg: 'scene:stormwind', filter: DUSK, cam: [[-4, 0, 1.12], [-1, 0, 1.12]], fx: ['fadein@0.4'] }],
      [10.25, { bg: 'scene:orgrimmar', filter: DUSK, cam: [[4, 0, 1.12], [1, 0, 1.14]] }],
      // --- 11.5 the orchestra: the title
      [11.5, { fx: ['flash@0', 'shake@0.05', 'embers'], card: { mark: ART.emblem, text: 'THE RUINFALL SAGA', drift: 1.08, at: 0, out: 99 } }],
      // --- the story so far
      [13.5, { bg: 'story:westfall', filter: DUSK, cam: [[0, 0, 1.08], [0, -1, 1.14]], actors: [{ a: 'story:defias_crowd', x: 34, y: 0, w: 54, from: { x: 44, o: 0 }, dur: 0.8 }] }],
      [14.9, { bg: 'story:shadow_court', cam: [[3, 0, 1.08], [0, 0, 1.14]], actors: [{ a: 'story:lady_prestor', x: 38, y: 0, w: 34, anim: 'breathe', from: { o: 0 }, dur: 0.6 }] }],
      [16.3, { bg: 'story:blackrock_mountain', cam: [[0, 2, 1.04], [0, 0, 1.12]], fx: ['embers'], actors: [{ a: 'story:nefarian', x: 42, y: 0, w: 36, anim: 'breathe', from: { o: 0 }, dur: 0.6 }] }],
      [17.7, { bg: 'story:shadow_court', filter: BLOOD, cam: [[0, 0, 1.06], [0, -2, 1.2]], actors: [{ a: 'story:prestor_shadow', x: 30, y: 0, w: 52, anim: 'breathe', from: { o: 0 }, dur: 0.8 }] }],
      [19.1, { bg: 'story:stormwind_keep', filter: BLOOD, cam: [[0, 3, 1.25], [0, 1, 1.1]], fx: ['flash@0.2', 'shake@0.25', 'embers'], actors: [{ a: 'story:onyxia', x: 30, y: 0, w: 60, anim: 'breathe', from: { y: -30, o: 0 }, dur: 0.9 }] }],
      [20.7, { bg: 'scene:theramore_isle', cam: [[-3, 0, 1.08], [-1, 0, 1.1]], actors: [hero('warrior.human', 22, { from: { x: 12, o: 0 }, dur: 0.7 }), hero('paladin.dwarf', 40, { from: { x: 30, o: 0 }, delay: 0.15, dur: 0.7 }), hero('druid.nightelf', 58, { from: { x: 48, o: 0 }, delay: 0.3, dur: 0.7 })] }],
      [22.0, { bg: 'scene:brackenwall_village', cam: [[3, 0, 1.08], [1, 0, 1.1]], actors: [hero('warrior.orc', 62, { flip: true, from: { x: 72, o: 0 }, dur: 0.7 }), hero('shaman.troll', 44, { flip: true, from: { x: 54, o: 0 }, delay: 0.15, dur: 0.7 }), hero('hunter.tauren', 24, { flip: true, w: 22, from: { x: 34, o: 0 }, delay: 0.3, dur: 0.7 })] }],
      [23.3, { bg: 'scene:lair_cavern', filter: BLOOD, cam: [[0, 3, 1.28], [0, 1, 1.14]], fx: ['flash@0.5', 'shake@0.55', 'embers'], actors: [{ a: 'mob:onyxia', x: 30, y: 0, w: 64, anim: 'breathe', from: { y: -20, o: 0 }, dur: 0.8 }] }],
      [24.7, { bg: 'scene:lair_cavern', filter: BLOOD, cam: [[0, 0, 1.08], [0, 3, 1.2]], fx: ['flash@0.2', 'shake@0.25', 'fadeout@0.6'], actors: [{ a: 'mob:onyxia', x: 30, y: -60, w: 64, from: { y: 0, o: 1 }, dur: 1.4 }] }],
      [26.1, { bg: 'story:stormveil_storm', cam: [[0, 2, 1.2], [0, 0, 1.08]], fx: ['fadein@0.3', 'flash@0.9'] }],
      // --- a debt does not die: three chapters
      [27.5, { bg: 'opening:rf_ledger', filter: 'brightness(.45)', cam: [[0, -2, 1.2], [0, 0, 1.1]], card: { kicker: 'A DEBT DOES NOT DIE WITH ITS CREDITOR', cls: 'low', at: 0.1, out: 99 } }],
      [29.5, { card: { mark: PLATES, sub: 'A STORY IN THREE CHAPTERS', drift: 1.06, at: 0, out: 99 } }],
      [31.5, { bg: 'opening:rf_spire_night', cam: [[0, 3, 1.04], [0, 0, 1.16]], fx: ['ash', 'embers'] }],
      [32.9, { bg: 'story:stormwind_keep', filter: 'brightness(.4) saturate(.25) sepia(.4) blur(1.5px)', cam: [[0, 0, 1.08], [0, -1, 1.16]], fx: ['ash'], actors: [{ a: 'opening:rf_crown', x: 34, y: 8, w: 32, from: { o: 0 }, dur: 0.6 }] }],
      // --- 34.3 the hit: the three chapters, each a glimpse and its logo (names only, no story)
      [34.3, { fx: ['flash@0', 'shake@0.05', 'ash', 'embers'], card: { mark: ART.opening('ch1'), drift: 1.08, at: 0, out: 99 } }],
      [36.3, { bg: 'opening:rf_wound_sky', cam: [[0, 2, 1.2], [0, 0, 1.08]], fx: ['flash@0', 'shake@0.05'] }],
      [37.8, { fx: ['flash@0'], card: { mark: ART.opening('ch2'), drift: 1.08, at: 0, out: 99 } }],
      [39.4, { bg: 'opening:rf_ruin_eye', cam: [[0, 0, 1.04], [0, 0, 1.18]], fx: ['flash@0', 'shake@0.6', 'embers'] }],
      [41.0, { fx: ['flash@0', 'shake@0.05', 'embers'], card: { mark: ART.opening('ch3'), drift: 1.1, at: 0, out: 99 } }],
      [42.8, { fx: ['embers'] }],
      // --- 44.1 the drop
      [44.1, { }],
      [46.1, { card: { kicker: 'BUT FIRST', at: 0.2, out: 99 } }],
      [48.1, { bg: 'opening:rf_ledger', filter: 'brightness(.25) blur(2px)', cam: [[0, 0, 1.1], [0, 0, 1.14]], actors: [{ a: 'opening:rf_note', x: 30, y: 6, w: 40, from: { o: 0 }, dur: 0.8 }], fx: ['fadeout@0.6'] }],
      [49.5, { }],
      // --- 50.9 back in: the pre-patch
      [50.9, { fx: ['flash@0', 'shake@0.05', 'embers'], card: { mark: ART.opening('prepatch'), drift: 1.08, at: 0, out: 99 } }],
      [52.9, { bg: 'scene:saldean_farm', filter: DUSK, cam: [[-3, 0, 1.12], [0, 0, 1.14]], actors: [{ a: 'mob:defias_highwayman', x: 20, y: 4, w: 24, from: { x: 10, o: 0 }, dur: 0.7 }, { a: 'mob:defias_highwayman', x: 56, y: 2, w: 26, flip: true, from: { x: 66, o: 0 }, delay: 0.15, dur: 0.7 }] }],
      [54.6, { bg: 'scene:rumhook_bay', filter: DUSK, cam: [[3, 0, 1.14], [0, 0, 1.16]], actors: [{ a: 'mob:defias_highwayman', x: 44, y: 3, w: 24, from: { o: 0 }, dur: 0.5 }] }],
      [56.3, { card: { mark: ICON_ROW, drift: 1.05, at: 0, out: 99 } }],
      [58.1, { bg: 'scene:stormwind_gate', filter: DUSK, cam: [[0, 2, 1.18], [0, 0, 1.1]], fx: ['flash@0'], actors: [hero('priest.human', 28, { w: 22, from: { y: -8, o: 0 }, dur: 0.5 }), hero('bard.nightelf', 52, { w: 22, flip: true, from: { y: -8, o: 0 }, dur: 0.5 })] }],
      [59.7, { bg: 'scene:orgrimmar', filter: DUSK, cam: [[-4, 0, 1.14], [0, 0, 1.14]], fx: ['flash@0'], actors: [hero('shaman.orc', 26, { w: 24, from: { x: 14, o: 0 }, dur: 0.5 }), hero('hunter.troll', 52, { w: 24, flip: true, from: { x: 64, o: 0 }, dur: 0.5 })] }],
      [61.3, { bg: 'scene:the_wyrmbog', filter: NIGHT, cam: [[-4, 0, 1.1], [0, 0, 1.12]], fx: ['flash@0'], actors: [{ a: 'mob:onyxian_whelp', x: 66, y: 10, w: 18, anim: 'breathe', from: { x: 80, o: 0 }, dur: 0.6 }, hero('mage.gnome', 16, { w: 16, from: { x: 4, o: 0 }, dur: 0.5 }), hero('rogue.undead', 32, { w: 18, from: { x: 20, o: 0 }, dur: 0.5 })] }],
      [63.05, { bg: 'opening:rf_ledger', filter: 'brightness(.3) blur(2px)', cam: [[0, 0, 1.12], [0, 0, 1.24]], fx: ['embers'], actors: [{ a: 'opening:rf_note', x: 30, y: 6, w: 40, anim: 'breathe' }] }],
      // --- 64.8 the last hit
      [64.8, { fx: ['flash@0', 'shake@0.05', 'embers'], card: { mark: ART.opening('prepatch'), ...(promo ? { sub: 'COMING SOON' } : {}), drift: 1.06, at: 0, out: 3.8 } }],
      [69.2, { card: { mark: ART.gameLogo, at: 0.2, out: 99 } }],
    ];
    // cut every picture shot into pieces of at most MAX seconds, each a new framing of the same picture (the first keeps
    // the shot's own camera; then close left, close right, low wide); actors arrive in the first piece and stay; a flash or
    // shake lands in the piece it falls in; a card stays up across the cuts without fading in again. Only the two end cards (the saga logo, the game logo) are held longer.
    const MAX = 2, HOLD = new Set([64.8, 69.2]);
    const VAR = [null, [[-9, -2, 1.5], [-7, -2, 1.56]], [[9, -1, 1.5], [7, -1, 1.56]], [[0, 5, 1.16], [0, 3, 1.22]]];
    const lerp = (a, b, f) => a.map((v, k) => +(v + (b[k] - v) * f).toFixed(2));
    const shots = [];
    T.forEach(([t, s], i) => {
      const dur = +(((T[i + 1] ? T[i + 1][0] : END) - t)).toFixed(2); if (dur <= 0) return;
      const n = HOLD.has(t) ? 1 : Math.ceil(dur / MAX - 1e-6), step = dur / n;
      for (let p = 0; p < n; p++) {
        const a = p * step, b = a + step, sh = { dur: +step.toFixed(3), bg: s.bg, filter: s.filter };
        const c0 = (s.cam || [[0, 0, 1], [0, 0, 1]]);
        sh.cam = p === 0 || !VAR[p % VAR.length] ? [lerp(c0[0], c0[1], a / dur), lerp(c0[0], c0[1], b / dur)] : VAR[p % VAR.length];
        /* every figure stands 9% higher: the bottom cinema bar covers 12% of the picture */
        sh.actors = (s.actors || []).map((ac) => Object.assign({}, ac, { y: (ac.y || 0) + 9 }, p === 0 ? {} : { from: undefined, delay: 0 }));
        sh.fx = (s.fx || []).filter((f) => {
          const [nm, at] = f.split('@');
          if (nm === 'fadein') return p === 0;
          if (nm === 'fadeout') return p === n - 1;
          if (nm === 'flash' || nm === 'shake') return +at >= a && +at < b;
          return true;
        }).map((f) => { const [nm, at] = f.split('@'); return (nm === 'flash' || nm === 'shake') ? nm + '@' + (+at - a).toFixed(2) : f; });
        if (s.card) {
          const c = s.card, at = c.at || 0, out = c.out != null ? c.out : dur - 0.9;
          if (at < b && out > a) sh.card = Object.assign({}, c, at >= a ? { at: at - a } : { at: 0, still: true }, { out: out - a });
        }
        shots.push(sh);
      }
    });
    return shots;
  }
  CS.openingShots = build;
  let cached = null;
  CS.CHAPTERS.push({ id: 'ruinfall_opening', movie: true, level: 60, title: 'The Ruinfall Saga', music: 'ruinfall_opening',
    get shots() { try { return cached || (root.ART && root.ART.openingArt ? (cached = build(false)) : null); } catch (e) { return null; } } });
})(typeof window !== 'undefined' ? window : globalThis);
