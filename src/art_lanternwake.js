/* art_lanternwake.js - Lanternwake, the autumn festival (v10.13, docs/plans/2026-10-11-lanternwake-design.md).
 * Loads after the other packs and EXTENDS window.ART; every other key falls through. Never throws.
 *   ART.scene  snuffed_road                400x240: a night road lined with lanterns, half of them put out
 *   ART.mob    lw_wisp, lw_ghost, wickless_knight, flicker (Flicker is the companion, drawn small by the UI)
 *   ART.icon   lw_candle, lw_costume, lw_treat, lw_robe, lw_trousers, lw_lantern, companion_flicker, event_lanternwake
 * Palette: night blue, candle gold, ash grey; the Knight's flame is black with a violet rim (a light gone out).
 * Style: bold #1a1009 outlines, 2-3 tone cel shading, soft radial glows, no text, no filters, no images.
 * Gradient ids use the prefix lW<counter>_. Contact sheet: node art/lanternwake/render.js
 */
(function (root) {
  'use strict';
  var W = root || {};
  var ART = W.ART = W.ART || {};
  var UID = 0, OL = '#1a1009';
  var NIGHT = '#16203e', NIGHT2 = '#0a0f22', GOLD = '#ffc24a', GOLD2 = '#ff8a1e', CANDLE = '#efe6cf', ASH = '#6a6f7c', VOID = '#120c1c', RIM = '#9a6aff';
  function r1(v) { v = +v; return isFinite(v) ? Math.round(v * 10) / 10 : 0; }
  function rgb(c) { c = String(c || '').replace('#', ''); if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2]; var v = parseInt(c, 16); if (isNaN(v)) v = 0x808080; return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; }
  function hex(a) { return '#' + a.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  function mix(a, b, t) { var A = rgb(a), B = rgb(b); return hex([0, 1, 2].map(function (i) { return A[i] + (B[i] - A[i]) * t; })); }
  function lt(c, t) { return mix(c, '#ffffff', t); }
  function dk(c, t) { return mix(c, '#000000', t); }
  function Ctx() { this.u = 'lW' + (++UID).toString(36); this.k = 0; this.defs = []; }
  Ctx.prototype.grad = function (tag, st, a) {
    var id = this.u + '_' + (this.k++).toString(36);
    this.defs.push('<' + tag + ' id="' + id + '" ' + a + '>' + st.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '/>'; }).join('') + '</' + tag + '>');
    return 'url(#' + id + ')';
  };
  Ctx.prototype.lg = function (st, x1, y1, x2, y2) { return this.grad('linearGradient', st, 'x1="' + (x1 || 0) + '" y1="' + (y1 || 0) + '" x2="' + (x2 == null ? 0 : x2) + '" y2="' + (y2 == null ? 1 : y2) + '"'); };
  Ctx.prototype.rg = function (st, cx, cy, r) { return this.grad('radialGradient', st, 'cx="' + (cx == null ? 0.5 : cx) + '" cy="' + (cy == null ? 0.5 : cy) + '" r="' + (r || 0.5) + '"'); };
  Ctx.prototype.cel = function (c) { return this.lg([[0, lt(c, 0.32)], [0.45, c], [1, dk(c, 0.4)]], 0.2, 0, 0.8, 1); };
  Ctx.prototype.glow = function (c, a) { a = a == null ? 0.6 : a; return this.rg([[0, c, a], [0.4, c, a * 0.4], [1, c, 0]]); };
  Ctx.prototype.svg = function (w, h, body) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">' + (this.defs.length ? '<defs>' + this.defs.join('') + '</defs>' : '') + body + '</svg>'; };
  function P(d, fill, sw, o) { return '<path d="' + d + '" fill="' + fill + '"' + (sw === 0 ? '' : ' stroke="' + OL + '" stroke-width="' + (sw || 2.2) + '" stroke-linejoin="round" stroke-linecap="round"') + (o != null ? ' opacity="' + o + '"' : '') + '/>'; }
  function S(d, col, w, o) { return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + r1(w) + '" stroke-linecap="round" stroke-linejoin="round"' + (o != null ? ' opacity="' + o + '"' : '') + '/>'; }
  function E(x, y, rx, ry, fill, sw, o) { return '<ellipse cx="' + r1(x) + '" cy="' + r1(y) + '" rx="' + r1(rx) + '" ry="' + r1(ry) + '" fill="' + fill + '"' + (sw ? ' stroke="' + OL + '" stroke-width="' + sw + '"' : '') + (o != null ? ' opacity="' + o + '"' : '') + '/>'; }
  function C(x, y, r, fill, sw, o) { return E(x, y, r, r, fill, sw, o); }
  function R(x, y, w, h, fill, o) { return '<rect x="' + r1(x) + '" y="' + r1(y) + '" width="' + r1(w) + '" height="' + r1(h) + '" fill="' + fill + '"' + (o != null ? ' opacity="' + o + '"' : '') + '/>'; }
  function G(body, tf, o) { return '<g' + (tf ? ' transform="' + tf + '"' : '') + (o != null ? ' opacity="' + o + '"' : '') + '>' + body + '</g>'; }
  function shadow(x, w) { return E(x, 118, w, 6, '#000', 0, 0.28); }

  // ---- shared parts
  /* a candle flame: teardrop with a hot core */
  function flame(c, x, y, h, col, core) {
    var w = h * 0.42;
    return C(x, y - h * 0.35, h * 1.3, c.glow(col || GOLD, 0.45), 0) +
      P('M' + r1(x) + ',' + r1(y - h) + ' C' + r1(x + w) + ',' + r1(y - h * 0.4) + ' ' + r1(x + w) + ',' + r1(y) + ' ' + r1(x) + ',' + r1(y) + ' C' + r1(x - w) + ',' + r1(y) + ' ' + r1(x - w) + ',' + r1(y - h * 0.4) + ' ' + r1(x) + ',' + r1(y - h) + ' Z', c.lg([[0, lt(col || GOLD, 0.4)], [1, col || GOLD2]]), 1.2) +
      E(x, y - h * 0.28, w * 0.38, h * 0.26, core || '#fff6d0', 0);
  }
  /* a hanging lantern: cap, glass, base; lit (glowing) or snuffed (dark glass and a curl of smoke) */
  function lantern(c, x, y, s, lit, black) {
    var k = s || 1, gl = black ? VOID : lit ? c.rg([[0, '#fff6d0'], [0.5, GOLD], [1, GOLD2]]) : '#2a2e3a';
    var body = S('M' + x + ',' + r1(y - 13 * k) + ' L' + x + ',' + r1(y - 9 * k), OL, 2) +
      P('M' + r1(x - 6 * k) + ',' + r1(y - 7 * k) + ' L' + r1(x + 6 * k) + ',' + r1(y - 7 * k) + ' L' + r1(x + 4 * k) + ',' + r1(y - 10 * k) + ' L' + r1(x - 4 * k) + ',' + r1(y - 10 * k) + ' Z', c.cel('#4a3a26'), 1.6) +
      P('M' + r1(x - 7 * k) + ',' + r1(y - 7 * k) + ' L' + r1(x + 7 * k) + ',' + r1(y - 7 * k) + ' L' + r1(x + 6 * k) + ',' + r1(y + 7 * k) + ' L' + r1(x - 6 * k) + ',' + r1(y + 7 * k) + ' Z', gl, 1.8) +
      S('M' + x + ',' + r1(y - 7 * k) + ' L' + x + ',' + r1(y + 7 * k), '#4a3a26', 1.2) +
      P('M' + r1(x - 7 * k) + ',' + r1(y + 7 * k) + ' L' + r1(x + 7 * k) + ',' + r1(y + 7 * k) + ' L' + r1(x + 5 * k) + ',' + r1(y + 10 * k) + ' L' + r1(x - 5 * k) + ',' + r1(y + 10 * k) + ' Z', c.cel('#4a3a26'), 1.6);
    if (black) body += S('M' + r1(x - 5 * k) + ',' + r1(y - 6 * k) + ' L' + r1(x + 5 * k) + ',' + r1(y + 6 * k) + ' M' + r1(x + 5 * k) + ',' + r1(y - 6 * k) + ' L' + r1(x - 5 * k) + ',' + r1(y + 6 * k), RIM, 0.8, 0.5);
    var halo = lit ? C(x, y, 22 * k, c.glow(GOLD, 0.5), 0) : black ? C(x, y, 16 * k, c.glow(RIM, 0.35), 0) : '';
    var smoke = !lit && !black ? S('M' + x + ',' + r1(y - 14 * k) + ' C' + r1(x - 4 * k) + ',' + r1(y - 20 * k) + ' ' + r1(x + 4 * k) + ',' + r1(y - 24 * k) + ' ' + r1(x) + ',' + r1(y - 30 * k), '#8a90a0', 1.4 * k, 0.5) : '';
    return halo + body + smoke;
  }
  /* a lantern post on the roadside */
  function post(c, x, y, h, lit) {
    return S('M' + x + ',' + y + ' L' + x + ',' + (y - h) + ' L' + (x + 12) + ',' + (y - h), OL, 5) + S('M' + x + ',' + y + ' L' + x + ',' + (y - h) + ' L' + (x + 12) + ',' + (y - h), '#3a2e22', 3) +
      lantern(c, x + 12, y - h + 20, 0.9, lit);
  }
  function bareTree(x, y, s, col) {
    var k = s;
    return S('M' + x + ',' + y + ' C' + (x + 2 * k) + ',' + (y - 30 * k) + ' ' + (x - 4 * k) + ',' + (y - 50 * k) + ' ' + (x + 2 * k) + ',' + (y - 70 * k) +
      ' M' + (x + 1 * k) + ',' + (y - 36 * k) + ' C' + (x + 14 * k) + ',' + (y - 44 * k) + ' ' + (x + 20 * k) + ',' + (y - 56 * k) + ' ' + (x + 26 * k) + ',' + (y - 62 * k) +
      ' M' + (x - 1 * k) + ',' + (y - 48 * k) + ' C' + (x - 12 * k) + ',' + (y - 54 * k) + ' ' + (x - 18 * k) + ',' + (y - 64 * k) + ' ' + (x - 22 * k) + ',' + (y - 72 * k) +
      ' M' + (x + 14 * k) + ',' + (y - 48 * k) + ' L' + (x + 18 * k) + ',' + (y - 40 * k), col, 4 * k);
  }

  // ============================================================ scene
  var SCENES = {
    snuffed_road: function (c) {
      var s = R(0, 0, 400, 240, c.lg([[0, '#0a0f24'], [0.55, '#1e2450'], [1, '#3a2a4a']]));
      // stars and the moon behind thin cloud
      [[30, 22], [74, 40], [120, 14], [170, 34], [236, 18], [290, 44], [336, 20], [378, 38], [210, 52], [60, 64]].forEach(function (p, i) { s += C(p[0], p[1], i % 3 ? 0.9 : 1.4, '#fff4d8', 0, 0.8); });
      s += C(312, 58, 44, c.glow('#d8dcff', 0.35), 0) + C(312, 58, 22, c.rg([[0, '#fffbe8'], [1, '#c8ccec']]), 0) + E(300, 66, 36, 5, '#1e2450', 0, 0.7);
      // far hills, then the near ridge
      s += P('M0,128 C40,112 80,118 120,108 C170,96 210,114 250,104 C300,92 350,108 400,100 L400,150 L0,150 Z', '#141a36', 0);
      s += P('M0,146 C60,132 120,140 180,132 C240,124 300,138 400,128 L400,160 L0,160 Z', '#0e1228', 0);
      // bare trees on the ridge
      s += bareTree(46, 146, 0.9, '#0a0c1c') + bareTree(352, 136, 1.1, '#0a0c1c') + bareTree(270, 136, 0.6, '#0e1228');
      // the ground and the road winding off to the horizon
      s += P('M0,156 C100,150 300,150 400,156 L400,240 L0,240 Z', c.lg([[0, '#1c2030'], [1, '#0c0e16']]), 0);
      s += P('M120,240 C150,210 190,190 196,170 C200,160 210,154 220,152 L232,152 C226,156 220,164 222,174 C226,196 280,214 330,240 Z', c.lg([[0, '#3a3a44'], [1, '#22222a']]), 0);
      s += S('M168,240 C190,214 212,196 214,176', '#4a4a56', 1.4, 0.6) + S('M290,240 C256,218 232,196 228,176', '#4a4a56', 1.4, 0.6);
      // lantern posts: lit ones on the near side, snuffed ones up the road where the Knight has passed
      s += post(c, 60, 214, 70, true) + post(c, 336, 212, 70, true) + post(c, 150, 178, 42, false) + post(c, 262, 176, 40, false) + post(c, 196, 160, 22, false);
      // ground fog
      s += E(100, 200, 120, 10, '#8a94b8', 0, 0.12) + E(300, 186, 140, 9, '#8a94b8', 0, 0.12) + E(200, 228, 200, 12, '#8a94b8', 0, 0.1);
      // a few candles left on the roadside for the dead
      [[96, 222], [112, 226], [306, 220]].forEach(function (p) { s += R(p[0] - 2, p[1] - 8, 4, 8, CANDLE) + flame(c, p[0], p[1] - 8, 6); });
      return s;
    },
  };

  // ============================================================ mobs (128x128, facing left)
  /* a lantern-wisp: a cold blue-white flame with two dim eyes and a trailing wick of smoke */
  function wisp(c, col, core, eye) {
    var s = shadow(64, 18) + C(64, 62, 40, c.glow(col, 0.5), 0);
    s += S('M74,86 C84,96 80,106 92,112', '#8a90a0', 3, 0.45);
    s += P('M64,26 C80,44 88,58 86,72 C84,86 74,94 64,94 C52,94 42,86 42,72 C42,58 52,52 56,40 C58,48 60,50 62,50 C62,42 62,34 64,26 Z', c.lg([[0, lt(col, 0.5)], [0.6, col], [1, dk(col, 0.35)]]), 2.4);
    s += P('M64,52 C72,62 76,70 74,78 C72,86 68,88 64,88 C58,88 54,84 54,78 C54,70 60,64 64,52 Z', core, 0);
    s += E(57, 72, 3, 4, eye, 0) + E(69, 72, 3, 4, eye, 0);
    return s;
  }
  var MOBS = {
    lw_wisp: function (c) { return wisp(c, '#7ab8ff', '#e6f4ff', '#1a2a4a'); },
    flicker: function (c) { return wisp(c, GOLD, '#fff6d0', '#5a2a08'); },
    /* the costume ghost: an old sheet with two holes and a ragged hem */
    lw_ghost: function (c) {
      var col = '#dfe8f2';
      return shadow(64, 22) + C(64, 64, 44, c.glow('#b8d0ff', 0.3), 0) +
        P('M64,18 C88,18 96,40 96,62 L98,104 L88,96 L80,108 L72,98 L64,110 L56,98 L48,108 L40,96 L30,104 L32,62 C32,40 40,18 64,18 Z', c.lg([[0, '#ffffff'], [0.6, col], [1, '#9aa8c0']]), 2.6) +
        E(54, 52, 5, 7, '#1a2030', 0) + E(72, 52, 5, 7, '#1a2030', 0) + E(63, 70, 4, 5, '#1a2030', 0) +
        S('M40,40 C42,30 50,24 58,22', '#ffffff', 2.4, 0.7);
    },
    /* the Wickless Knight: hollow plate in ash-black, a ragged cloak, two ember eyes in the helm, and in his left hand a
       lantern burning black (the light of all the lanterns he has put out) */
    wickless_knight: function (c) {
      var plate = '#3a3e4a', plate2 = '#262a34', cloak = '#1e1a2e';
      var s = shadow(64, 30);
      // cloak behind
      s += P('M70,34 C92,40 104,70 106,112 L96,104 L90,114 L82,104 L74,114 L72,60 Z', c.lg([[0, '#2e2844'], [1, cloak]]), 2.4);
      // legs
      s += P('M54,84 L50,112 L60,112 L62,86 Z', c.cel(plate2), 2.2) + P('M68,84 L70,112 L80,112 L76,84 Z', c.cel(plate2), 2.2);
      s += P('M46,112 L62,112 L62,117 L44,117 Z', c.cel('#1a1c24'), 1.8) + P('M68,112 L84,112 L84,117 L66,117 Z', c.cel('#1a1c24'), 1.8);
      // torso
      s += P('M46,46 C52,40 76,40 82,46 L80,86 C72,90 56,90 48,86 Z', c.cel(plate), 2.4);
      s += S('M64,46 L64,86', dk(plate, 0.4), 1.6) + S('M50,64 C58,68 70,68 78,64', dk(plate, 0.4), 1.4);
      s += P('M46,82 L82,82 L80,90 L48,90 Z', c.cel('#4a3a2a'), 1.8) + R(60, 82, 8, 8, '#8a7040');
      // pauldrons
      s += P('M38,44 C40,34 56,34 56,44 C52,50 42,50 38,44 Z', c.cel(plate), 2.2) + P('M72,44 C72,34 90,34 90,44 C86,50 76,50 72,44 Z', c.cel(plate), 2.2);
      // the far arm with a long sword point-down
      s += S('M84,48 L92,72', OL, 9) + S('M84,48 L92,72', plate2, 6) + S('M96,62 L96,112', OL, 5.4) + S('M96,62 L96,112', '#a8b0c0', 3) + S('M90,64 L102,64', OL, 4) + S('M90,64 L102,64', '#6a5a3a', 2.4);
      // the helm: tall and hollow, a slit with two embers
      s += P('M52,18 C52,8 76,8 76,18 L78,38 C72,44 56,44 50,38 Z', c.cel(plate), 2.4);
      s += P('M54,24 L74,24 L73,29 L55,29 Z', VOID, 1.2) + C(59, 26.5, 1.8, GOLD2, 0) + C(68, 26.5, 1.8, GOLD2, 0) + C(59, 26.5, 5, c.glow(GOLD2, 0.6), 0) + C(68, 26.5, 5, c.glow(GOLD2, 0.6), 0);
      s += S('M64,8 C66,0 72,-2 76,2', '#5a5a6a', 2.4);
      // the near arm holding the black lantern out in front
      s += S('M44,50 L32,70', OL, 9) + S('M44,50 L32,70', plate2, 6) + C(31, 71, 4, c.cel(plate2), 1.6);
      s += lantern(c, 28, 88, 1.15, false, true);
      s += P('M28,92 C32,86 31,82 28,78 C25,82 24,86 28,92 Z', '#05030a', 1) + S('M28,92 C32,86 31,82 28,78 C25,82 24,86 28,92', RIM, 0.8, 0.8);
      return s;
    },
  };

  // ============================================================ icons (64x64, item style)
  function frame(c, bg, glyph) {
    return R(0, 0, 64, 64, c.rg([[0, bg[0]], [1, bg[1]]], 0.45, 0.4, 0.75)) + glyph +
      R(0, 0, 64, 64, c.rg([[0.62, '#000', 0], [1, '#000', 0.5]], 0.5, 0.5, 0.72)) +
      '<rect x="1.5" y="1.5" width="61" height="61" fill="none" stroke="#0b0806" stroke-width="3"/>' +
      S('M3.8,60.2 L3.8,3.8 L60.2,3.8', '#ffffff', 1.6, 0.4) + S('M3.8,60.2 L60.2,60.2 L60.2,3.8', '#000000', 1.6, 0.55);
  }
  var NIGHTBG = ['#3a4a8a', '#0a0f22'];
  var ICONS = {
    lw_candle: function (c) { return frame(c, NIGHTBG, P('M24,30 L40,30 L40,54 L24,54 Z', c.lg([[0, '#ffffff'], [0.5, CANDLE], [1, '#b8ae90']], 0, 0, 1, 0), 2.2) + P('M24,30 C28,34 30,30 32,34 C34,30 36,35 40,30', CANDLE, 1.6) + S('M32,30 L32,25', OL, 1.6) + flame(c, 32, 25, 14) + E(32, 55, 13, 3, '#4a3a26', 1.6)); },
    lw_costume: function (c) { return frame(c, ['#6a7aa8', '#141a30'], G(MOBS.lw_ghost(c), 'matrix(0.5,0,0,0.5,0,6)')); },
    lw_treat: function (c) {
      return frame(c, ['#c8762a', '#2a1006'], P('M10,26 L20,32 L20,40 L10,44 L14,35 Z', c.cel('#a83a6a'), 1.8) + P('M54,26 L44,32 L44,40 L54,44 L50,35 Z', c.cel('#a83a6a'), 1.8) +
        E(32, 36, 14, 10, c.cel(GOLD2), 2.2) + S('M24,30 C28,36 36,36 40,42 M22,38 C28,40 32,44 34,46', '#fff0c0', 1.6, 0.8));
    },
    lw_robe: function (c) {
      return frame(c, NIGHTBG, P('M22,12 L42,12 L48,20 L52,54 L12,54 L16,20 Z', c.cel('#26345e'), 2.4) + P('M28,12 L32,20 L36,12', 'none', 0) + S('M28,12 L32,20 L36,12', GOLD, 2) +
        S('M32,20 L32,54', GOLD, 1.6, 0.8) + S('M13,50 L51,50', GOLD, 2.4) + flame(c, 24, 40, 6) + flame(c, 40, 40, 6));
    },
    lw_trousers: function (c) { return frame(c, NIGHTBG, P('M20,10 L44,10 L46,56 L35,56 L32,26 L29,56 L18,56 Z', c.cel('#26345e'), 2.4) + S('M20,14 L44,14', GOLD, 2.4) + S('M19,52 L29,52 M35,52 L46,52', GOLD, 1.8)); },
    lw_lantern: function (c) { return frame(c, NIGHTBG, S('M14,58 L46,8', OL, 5.4) + S('M14,58 L46,8', '#6a4a2a', 3) + S('M46,8 L52,14', OL, 4) + lantern(c, 50, 30, 1.25, true)); },
    companion_flicker: function (c) { return frame(c, ['#a8701a', '#1e1004'], G(MOBS.flicker(c), 'matrix(0.6,0,0,0.6,-6.4,-6)')); },
    /* the festival's own mark (the event lantern button, the Events row): a lit lantern on night blue */
    event_lanternwake: function (c) { return frame(c, NIGHTBG, lantern(c, 32, 34, 1.7, true)); },
  };

  // ============================================================ extend the public API
  var has = function (t, k) { return typeof k === 'string' && Object.prototype.hasOwnProperty.call(t, k); };
  function make(tbl, key, w, h) {
    try { var c = new Ctx(); return c.svg(w, h, tbl[key](c)); }
    catch (e) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '"><rect width="' + w + '" height="' + h + '" fill="' + NIGHT + '"/></svg>'; }
  }
  var baseScene = ART.scene, baseMob = ART.mob, baseIcon = ART.icon;
  ART.scene = function (k) { return has(SCENES, k) ? make(SCENES, k, 400, 240) : baseScene ? baseScene.apply(this, arguments) : make(SCENES, 'snuffed_road', 400, 240); };
  ART.mob = function (k) { return has(MOBS, k) ? make(MOBS, k, 128, 128) : baseMob ? baseMob.apply(this, arguments) : make(MOBS, 'lw_wisp', 128, 128); };
  ART.icon = function (k) { return has(ICONS, k) ? make(ICONS, k, 64, 64) : baseIcon ? baseIcon.apply(this, arguments) : make(ICONS, 'lw_candle', 64, 64); };
  ART.keys = ART.keys || {};
  function addKeys(name, keys) { var a = Array.isArray(ART.keys[name]) ? ART.keys[name] : (ART.keys[name] = []); keys.forEach(function (k) { if (a.indexOf(k) < 0) a.push(k); }); }
  addKeys('scenes', Object.keys(SCENES)); addKeys('mobs', Object.keys(MOBS)); addKeys('icons', Object.keys(ICONS));
  void NIGHT2; void ASH;
})(typeof window !== 'undefined' ? window : this);
