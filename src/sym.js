// Drawn symbols (v10.8). The game's fonts (Alegreya Sans, Marcellus SC) have no arrows, ticks, shapes or dingbats, so a
// phone fills those in from its own font: thin, the wrong style, or a colour emoji (the skull, the swords, the timer).
// Text can keep the character: ui.js swaps each one for an inline SVG in the text's own colour with a dark outline, the
// same treatment as the quest marks. tools/symcheck.js stops the build on a symbol that is neither here nor in the fonts.
// Each glyph is drawn on a 20x20 grid: `line` parts are stroked (width w), `fill` parts are filled (evenodd for holes).
(function (root) {
  const L = (d, w) => ({ d, w: w || 2.4 }), F = (d) => ({ d, fill: true });
  const ring = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
  const G = {
    '✓': [L('M4 10.6l4.2 4L16 5.4', 2.8)],
    'ⓘ': [L(ring(10, 10, 7.6), 1.8), F('M8.8 4.8h2.4v2.4H8.8Z'), L('M10 9.2v5.4', 2.4)], // more about this: help one tap away (docs/ui-text-style.md)
    '▦': [F('M2.6 2.6h4.4v4.4H2.6ZM7.8 2.6h4.4v4.4H7.8ZM13 2.6h4.4v4.4H13ZM2.6 7.8h4.4v4.4H2.6ZM7.8 7.8h4.4v4.4H7.8ZM13 7.8h4.4v4.4H13ZM2.6 13h4.4v4.4H2.6ZM7.8 13h4.4v4.4H7.8ZM13 13h4.4v4.4H13Z')], // the small-slots grid on Bags and the bank (#534): nine small squares
    '✗': [L('M5.2 5.2l9.6 9.6M14.8 5.2l-9.6 9.6', 2.8)],
    '✕': [L('M5.5 5.5l9 9M14.5 5.5l-9 9', 2.6)],
    '✖': [L('M5 5l10 10M15 5L5 15', 3.4)],
    '▲': [F('M10 3.6L17 15.6H3Z')],
    '▼': [F('M3 4.4h14L10 16.4Z')],
    '▴': [F('M10 6l5 7.6H5Z')],
    '▾': [F('M5 6.4h10L10 14Z')],
    '▸': [F('M6.6 5L14 10l-7.4 5Z')],
    '▶': [F('M5 3.6L16.6 10 5 16.4Z')],
    '◆': [F('M10 2.6L17.2 10 10 17.4 2.8 10Z')],
    '✦': [F('M10 1.6c.9 5.4 3 7.5 8.4 8.4-5.4.9-7.5 3-8.4 8.4-.9-5.4-3-7.5-8.4-8.4 5.4-.9 7.5-3 8.4-8.4Z')],
    '◎': [L(ring(10, 10, 6.6), 2.2), F(ring(10, 10, 2.5))],
    '⛉': [F('M10 1.6L17 4.2v5.4c0 4.3-3 7.3-7 8.8-4-1.5-7-4.5-7-8.8V4.2ZM10 5l1.4 3.2 3.2 1.4-3.2 1.4L10 14.2l-1.4-3.2-3.2-1.4 3.2-1.4Z')], // the Season's Finest crest: a shield with a star cut out (#593)
    '🔒': [L('M6.4 9.4V6.8a3.6 3.6 0 0 1 7.2 0v2.6', 2.4), F('M3.8 9h12.4v8.6H3.8ZM9 11.8h2v3.4H9Z')], // a locked item (#557)
    // a skull: the eyes and nose are holes, the teeth are cut with the outline colour
    '☠': [F('M10 2C5.3 2 3 5.2 3 8.7c0 2.3 1 3.8 2.6 4.6V16c0 .8.6 1.4 1.4 1.4h6c.8 0 1.4-.6 1.4-1.4v-2.7C16 12.5 17 11 17 8.7 17 5.2 14.7 2 10 2Z' +
      ring(7.2, 8.8, 1.9) + ring(12.8, 8.8, 1.9) + 'M10 11.4l-1.1 1.9h2.2Z'), { d: 'M8.4 14.6v2.6M10 14.6v2.6M11.6 14.6v2.6', w: 0.9, ink: true }],
    // crossed swords: pointed blades from the top corners, guards and grips at the bottom corners
    '⚔': [F('M2.6 2.6L13.6 11.2 11.2 13.6Z'), L('M10.4 14.8l4.4-4.4M13.4 13.4l3.4 3.4', 2.2), F('M17.4 2.6L6.4 11.2l2.4 2.4Z'), L('M9.6 14.8l-4.4-4.4M6.6 13.4l-3.4 3.4', 2.2)],
    '⏱': [L(ring(10, 11.6, 6.4), 2), L('M10 11.6V8', 1.8), L('M8.2 2.6h3.6M10 2.6v2.6', 2)],
    '→': [L('M3.4 10h12.2M11.2 5.6l4.4 4.4-4.4 4.4', 2.2)],
    '←': [L('M16.6 10H4.4M8.8 5.6L4.4 10l4.4 4.4', 2.2)],
    '↑': [L('M10 16.6V4.4M5.6 8.8L10 4.4l4.4 4.4', 2.2)],
    '↓': [L('M10 3.4v12.2M5.6 11.2l4.4 4.4 4.4-4.4', 2.2)],
  };
  const INK = '#1a0e00';
  // the SVG for one symbol, in currentColor with a dark outline
  function svg(ch) {
    const parts = G[ch]; if (!parts) return null;
    let under = '', over = '';
    for (const p of parts) {
      if (p.ink) { over += `<path d="${p.d}" fill="none" stroke="${INK}" stroke-width="${p.w}" stroke-linecap="round"/>`; continue; }
      if (p.fill) {
        under += `<path d="${p.d}" fill="${INK}" fill-rule="evenodd" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>`;
        over += `<path d="${p.d}" fill="currentColor" fill-rule="evenodd"/>`;
      } else {
        under += `<path d="${p.d}" fill="none" stroke="${INK}" stroke-width="${p.w + 2.4}" stroke-linecap="round" stroke-linejoin="round"/>`;
        over += `<path d="${p.d}" fill="none" stroke="currentColor" stroke-width="${p.w}" stroke-linecap="round" stroke-linejoin="round"/>`;
      }
    }
    return `<svg class="sym" viewBox="-1 -1 22 22" role="img" aria-label="${ch}">${under}${over}</svg>`;
  }
  const CHARS = Object.keys(G);
  root.SYM = { G, CHARS, svg, re: new RegExp('[' + CHARS.join('') + ']', 'u') };
})(typeof window !== 'undefined' ? window : globalThis);
