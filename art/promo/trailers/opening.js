// The Ruinfall Saga opening movie, as a video: the same cut the game plays (src/opening.js), with "Coming soon" on the
// last card. The recorder injects it into a build of the game:
//   art/promo/export_trailer.sh opening <out.mp4> ruinfall_opening      (the song is audio/out/music_ruinfall_opening.m4a)
(function () {
  const svgUrl = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg || '<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"/>');
  const art = (kind, key) => {
    try {
      if (kind === 'story') return svgUrl((ART.story.keys.scenes || []).includes(key) ? ART.story.scene(key) : ART.story.actor(key));
      return svgUrl(ART[kind](key));
    } catch (e) { return svgUrl(''); }
  };
  window.TRAILER = { id: 'trailer_opening', movie: true, title: 'The Ruinfall Saga', shots: CS.openingShots(true) };
  window.TRAILER_PLAY = () => CS.play(TRAILER, { art, heroUrl: '', name: '', zone: '', setMusic: () => {} });
})();
