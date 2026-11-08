// The Ruinfall Saga trailer: a 16:9 cutscene that never ships in the game. The recorder runs this in the page:
//   INJECT=art/promo/trailers/ruinfall.js VW=640 VH=360 SCALE=3 CLIP=stage node art/promo/record_cutscene.js trailer <outdir>
// (art/promo/export_trailer.sh does that and adds the music). Three acts: the saga (three chapters), Chapter One, and the
// pre-patch that comes first. Spoilers: only what the game already shows up to the pre-patch; nothing of Chapter One's
// story beyond its setting (the vault in Cinderpeak Spire, the coronation in Kingsmere), no names for Chapters Two and Three.
(function () {
  const svgUrl = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  const art = (kind, key) => {
    let svg = '';
    try {
      if (kind === 'story') svg = (ART.story.keys.scenes || []).includes(key) ? ART.story.scene(key) : ART.story.actor(key);
      else svg = ART[kind](key);
    } catch (e) { svg = ''; }
    return svgUrl(svg || '<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"/>');
  };
  const CH1_LOGO = __FILE(art/ruinfall/chapter1.svg)__;
  // three chapter plates: I lit, II and III dark and unnamed
  const plate = (x, num, lit) => `<g transform="translate(${x},0)">
      <path d="M-70,20 L70,20 L82,95 L70,170 L-70,170 L-82,95 Z" fill="${lit ? '#2a1a10' : '#0c0a09'}" stroke="${lit ? '#f0c45a' : '#3a332c'}" stroke-width="3" stroke-linejoin="round"/>
      <text x="0" y="118" text-anchor="middle" font-family="Marcellus SC, Georgia, serif" font-size="64" fill="${lit ? '#f0c45a' : '#3a332c'}">${num}</text>
      ${lit ? '<ellipse cx="0" cy="95" rx="90" ry="90" fill="#ff9a3a" opacity=".10"/>' : ''}
    </g>`;
  const PLATES = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="190" viewBox="0 0 640 190">${plate(140, 'I', true)}${plate(320, 'II', false)}${plate(500, 'III', false)}</svg>`;
  // the ten new level-60 abilities, one icon each
  const ICONS = ['intervene', 'chronomark', 'vow_of_atonement', 'set_up', 'lantern_of_faith', 'blood_bargain', 'lure', 'seed_of_renewal', 'kinship_totem', 'duet'];
  const iconRow = () => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="640" height="150" viewBox="0 0 640 150">${ICONS.map((k, i) => {
    const x = 20 + (i % 5) * 124, y = i < 5 ? 0 : 76;
    return `<image x="${x + 25}" y="${y}" width="70" height="70" href="${svgUrl(ART.icon(k))}"/>`;
  }).join('')}</svg>`;

  window.TRAILER = { id: 'trailer_ruinfall', title: 'The Ruinfall Saga', music: 'worldboss', shots: [
    // ACT ONE: the saga
    { dur: 4, card: { text: 'Every debt comes due.', at: 0.5 } },
    { bg: 'story:azeroth_dawn', dur: 7, cam: [[0, 2, 1.18], [0, 0, 1.04]], fx: ['fadein', 'embers', 'shake@3.5'],
      actors: [{ a: 'story:deathwing', x: 36, y: 0, w: 60, anim: 'breathe', from: { y: -16, o: 0 }, dur: 2.4 }],
      lines: [{ t: 0.4, text: 'Long ago, the black dragon Ossarak tore the world open.' }, { t: 3.8, text: 'He was driven off. He was never destroyed.' }] },
    { bg: 'story:shadow_court', dur: 6, cam: [[-3, 0, 1.12], [3, 0, 1.06]],
      actors: [{ a: 'story:onyxia', x: 40, y: 0, w: 46, anim: 'breathe', from: { o: 0 }, dur: 1.6 }],
      lines: [{ t: 0.4, text: 'Through the Black Ledger, Veshmira owned the kingdom\'s debts.' }, { t: 3.2, text: 'Veshmira is dead. The notes keep coming.' }] },
    { dur: 5.5, fx: ['flash@0.1'], card: { mark: ART.emblem, text: 'THE RUINFALL SAGA', at: 0.3 } },
    { dur: 5, card: { mark: PLATES, sub: 'A STORY IN THREE CHAPTERS', at: 0.3 } },
    // ACT TWO: Chapter One
    { bg: 'story:blackrock_mountain', dur: 5.5, cam: [[0, 0, 1.04], [0, -2, 1.2]], fx: ['fadein', 'embers', 'ash'],
      lines: [{ t: 0.4, text: 'The notes are drawn on a vault in Cinderpeak Spire.' }, { t: 3, text: 'The Ledger has a new keeper.' }] },
    { bg: 'story:stormwind_keep', dur: 5.5, cam: [[0, 2, 1.18], [0, 0, 1.04]], fx: ['ash'],
      lines: [{ t: 0.4, text: 'In Kingsmere, a boy will be crowned.' }, { t: 2.8, text: 'Every note falls due on Coronation Day.' }] },
    { dur: 6, fx: ['ash', 'shake@0.2'], card: { mark: CH1_LOGO, at: 0.2 } },
    // ACT THREE: the pre-patch
    { dur: 3.5, card: { kicker: 'BUT FIRST', text: 'The Notes Come Due', at: 0.2 } },
    { bg: 'scene:saldean_farm', dur: 5, cam: [[-3, 0, 1.12], [3, 0, 1.12]],
      actors: [{ a: 'mob:defias_highwayman', x: 22, y: 4, w: 24, from: { x: 10, o: 0 }, dur: 1.4 }, { a: 'mob:defias_highwayman', x: 56, y: 2, w: 26, flip: true, from: { x: 70, o: 0 }, delay: 0.4, dur: 1.4 }],
      lines: [{ t: 0.4, text: 'Debt collectors walk every road in the kingdom.' }, { t: 2.8, text: 'Their notes are signed by no one. The ink is still warm.' }] },
    { dur: 5, card: { mark: iconRow(), sub: 'EVERY HERO LEARNS SOMETHING NEW', at: 0.3 } },
    { dur: 5, fx: ['embers'], card: { mark: ART.ruinfallWord, sub: 'THE NOTES COME DUE  ·  COMING SOON', at: 0.3 } },
    { dur: 3.5, card: { mark: ART.gameLogo, at: 0.2, out: 99 } },
  ] };

  window.TRAILER_PLAY = () => {
    const p = CS.play(TRAILER, { art, heroUrl: '', name: '', zone: '', setMusic: () => {} });
    const w = document.querySelector('.cs'); if (w) w.classList.add('trailer');
    return p;
  };
  // captions sit on the picture, as subtitles, so the video is the picture alone (16:9)
  const st = document.createElement('style');
  st.textContent = `.cs.trailer .cs-cap { position: absolute; left: 0; right: 0; bottom: 4%; z-index: 99; background: none; border: 0; text-align: center; padding: 0 10%; min-height: 0; }
    .cs.trailer .cs-text { font: 15px/1.35 var(--display); color: #f4ead2; text-shadow: 0 1px 3px #000, 0 0 12px #000; }
    .cs.trailer .cs-who, .cs.trailer .cs-bar, .cs.trailer .cs-title { display: none !important; }`;
  document.head.append(st);
})();
