/* art_icons15.js - the ten new level-60 class abilities for Realm of Loner (the pre-patch): Intervene, Chronomark,
 * Vow of Atonement, Set Up, Lantern of Faith, Blood Bargain, Lure, Seed of Renewal, Kinship Totem and Duet. Each shows
 * what the ability does in one picture, in its class's colours.
 * Loads AFTER art.js, art_icons2.js .. art_icons14.js and art_mounts.js and EXTENDS window.ART: ART.icon handles the keys
 * below and falls through to the previous ART.icon for every other key (prototype keys included). Keys are appended to
 * ART.keys.icons. Self-contained: the helpers are copied from art_icons14.js (same maths, same look). Never throws.
 * Style: 64x64, tinted radial background, bold glyph, #1a1009 outline, vignette + bevel frame, no text, no filters.
 * Gradient ids use the prefix iV<counter>_ so they never collide.
 */
(function (root) {
  'use strict';
  var W = root || {};
  var ART = W.ART = W.ART || {};

  /* ================= helpers (copied from art_icons14.js) ================= */
  var UID = 0;
  var OL = '#1a1009';
  var GOLD = '#d6a53c', LEATH = '#5a3a22';
  var STEEL = ['#f4f7fa', '#c2cad3', '#7c8793'];
  var ITEM_BG = ['#3a3440', '#0e0c12'];
  function r1(v) { v = +v; return isFinite(v) ? Math.round(v * 10) / 10 : 0; }
  function D(s) {
    var o = s[0];
    for (var i = 1; i < arguments.length; i++) { var v = arguments[i]; o += (typeof v === 'number' ? r1(v) : v) + s[i]; }
    return o;
  }
  function rgb(c) {
    c = String(c || '').replace('#', '');
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    var v = parseInt(c, 16); if (isNaN(v)) v = 0x808080;
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }
  function hex(a) { return '#' + a.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  function mix(a, b, t) { var A = rgb(a), B = rgb(b); return hex([0, 1, 2].map(function (i) { return A[i] + (B[i] - A[i]) * t; })); }
  function lt(c, t) { return mix(c, '#ffffff', t); }
  function dk(c, t) { return mix(c, '#000000', t); }
  function rng(seed) { var s = seed >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  function Ctx() { this.u = 'iV' + (++UID).toString(36); this.k = 0; this.defs = []; this.cache = {}; }
  Ctx.prototype.nid = function () { return this.u + '_' + (this.k++).toString(36); };
  function stopsXml(st) {
    return st.map(function (s, i) {
      if (typeof s === 'string') s = [st.length === 1 ? 0 : Math.round(i / (st.length - 1) * 1000) / 1000, s];
      return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '/>';
    }).join('');
  }
  Ctx.prototype.lg = function (st, x1, y1, x2, y2) {
    if (x1 == null) { x1 = 0; y1 = 0; x2 = 0; y2 = 1; }
    var key = 'l' + JSON.stringify(st) + [x1, y1, x2, y2].join();
    if (this.cache[key]) return this.cache[key];
    var id = this.nid();
    this.defs.push('<linearGradient id="' + id + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '">' + stopsXml(st) + '</linearGradient>');
    return (this.cache[key] = 'url(#' + id + ')');
  };
  Ctx.prototype.rg = function (st, cx, cy, r) {
    if (cx == null) { cx = 0.5; cy = 0.5; r = 0.5; }
    var key = 'r' + JSON.stringify(st) + [cx, cy, r].join();
    if (this.cache[key]) return this.cache[key];
    var id = this.nid();
    this.defs.push('<radialGradient id="' + id + '" cx="' + cx + '" cy="' + cy + '" r="' + r + '">' + stopsXml(st) + '</radialGradient>');
    return (this.cache[key] = 'url(#' + id + ')');
  };
  Ctx.prototype.cel = function (c) { return this.lg([[0, lt(c, 0.3)], [0.4, c], [0.72, c], [1, dk(c, 0.38)]], 0.2, 0, 0.8, 1); };
  Ctx.prototype.clip = function (d) { var id = this.nid(); this.defs.push('<clipPath id="' + id + '"><path d="' + d + '"/></clipPath>'); return 'url(#' + id + ')'; };
  Ctx.prototype.svg = function (w, h, body) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">' +
      (this.defs.length ? '<defs>' + this.defs.join('') + '</defs>' : '') + body + '</svg>';
  };

  function stk(sw) { return sw === 0 ? '' : ' stroke="' + OL + '" stroke-width="' + r1(sw || 2.5) + '" stroke-linejoin="round" stroke-linecap="round"'; }
  function opa(o) { return o != null && o !== 1 ? ' opacity="' + o + '"' : ''; }
  function P(d, fill, sw, o) { return '<path d="' + d + '" fill="' + fill + '"' + stk(sw) + opa(o) + '/>'; }
  function F(d, fill, o) { return P(d, fill, 0, o); }
  function S(d, col, w, o) { return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + r1(w) + '" stroke-linecap="round" stroke-linejoin="round"' + opa(o) + '/>'; }
  function S2(d, col, w, o) { return S(d, OL, w + 2.6, o) + S(d, col, w, o); }
  /* dashed stroke (stitching) */
  function SD(d, col, w, dash, o) { return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + r1(w) + '" stroke-dasharray="' + dash + '" stroke-linecap="round"' + opa(o) + '/>'; }
  function C(cx, cy, r, fill, sw, o) { return '<circle cx="' + r1(cx) + '" cy="' + r1(cy) + '" r="' + r1(r) + '" fill="' + fill + '"' + stk(sw) + opa(o) + '/>'; }
  function E(cx, cy, rx, ry, fill, sw, o, rot) {
    return '<ellipse cx="' + r1(cx) + '" cy="' + r1(cy) + '" rx="' + r1(rx) + '" ry="' + r1(ry) + '" fill="' + fill + '"' + stk(sw) + opa(o) +
      (rot ? ' transform="rotate(' + rot + ' ' + r1(cx) + ' ' + r1(cy) + ')"' : '') + '/>';
  }
  function R(x, y, w, h, fill, sw, o, rx) {
    return '<rect x="' + r1(x) + '" y="' + r1(y) + '" width="' + r1(w) + '" height="' + r1(h) + '"' + (rx ? ' rx="' + rx + '"' : '') + ' fill="' + fill + '"' + stk(sw) + opa(o) + '/>';
  }
  function G(body, tf, o) { return '<g' + (tf ? ' transform="' + tf + '"' : '') + opa(o) + '>' + body + '</g>'; }
  function CG(body, clip) { return '<g clip-path="' + clip + '">' + body + '</g>'; }
  function tr(x, y, a, s) { return 'translate(' + r1(x) + ',' + r1(y) + ')' + (a ? ' rotate(' + r1(a) + ')' : '') + (s != null && s !== 1 ? ' scale(' + s + ')' : ''); }
  function pl(pts) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + r1(p[0]) + ',' + r1(p[1]); }).join(''); }
  /* closed curve through the midpoints of a polygon (soft lumps) */
  function blob(pts) {
    var n = pts.length, m = function (a, b) { return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }, s = m(pts[n - 1], pts[0]), d = 'M' + r1(s[0]) + ',' + r1(s[1]);
    for (var i = 0; i < n; i++) { var q = m(pts[i], pts[(i + 1) % n]); d += 'Q' + r1(pts[i][0]) + ',' + r1(pts[i][1]) + ' ' + r1(q[0]) + ',' + r1(q[1]); }
    return d + 'Z';
  }
  /* irregular ring of points around an ellipse */
  function lump(cx, cy, rx, ry, seed, n, jag, a0) {
    var r = rng(seed), p = [];
    for (var i = 0; i < n; i++) { var a = (a0 || 0) + i / n * Math.PI * 2 + (r() - 0.5) * 0.35, k = 1 - jag / 2 + r() * jag; p.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    return p;
  }
  function star(cx, cy, n, ro, ri, rot) {
    var d = '', a;
    for (var i = 0; i < n * 2; i++) {
      a = (rot || 0) + i * Math.PI / n - Math.PI / 2;
      var rr = i % 2 ? ri : ro;
      d += (i ? 'L' : 'M') + r1(cx + Math.cos(a) * rr) + ',' + r1(cy + Math.sin(a) * rr);
    }
    return d + 'Z';
  }
  function sparkle(x, y, r, col) { return F(D`M${x},${y - r} Q${x + r * 0.15},${y - r * 0.15} ${x + r},${y} Q${x + r * 0.15},${y + r * 0.15} ${x},${y + r} Q${x - r * 0.15},${y + r * 0.15} ${x - r},${y} Q${x - r * 0.15},${y - r * 0.15} ${x},${y - r} Z`, col); }

  /* ---- icon parts ---- */
  function iconWrap(c, bg, glyph) {
    return R(0, 0, 64, 64, c.rg([[0, bg[0]], [1, bg[1]]], 0.42, 0.38, 0.75), 0) + glyph +
      R(0, 0, 64, 64, c.rg([[0.62, '#000', 0], [1, '#000', 0.5]], 0.5, 0.5, 0.72), 0) +
      '<rect x="1.5" y="1.5" width="61" height="61" fill="none" stroke="#0b0806" stroke-width="3"/>' +
      S('M3.8,60.2 L3.8,3.8 L60.2,3.8', '#ffffff', 1.6, 0.4) + S('M3.8,60.2 L60.2,60.2 L60.2,3.8', '#000000', 1.6, 0.55);
  }
  function glow(c, x, y, r, col, o) { return C(x, y, r, c.rg([[0, lt(col, 0.6), o == null ? 0.8 : o], [0.45, col, (o == null ? 0.8 : o) * 0.45], [1, col, 0]]), 0); }

  function burst(c, x, y, ro, ri, n, col) { return glow(c, x, y, ro * 1.6, col, 0.7) + P(star(x, y, n, ro, ri, 0.2), c.lg([[0, '#fffbe8'], [1, col]]), 1.8); }
  function lines(x, y, a, n, len, col) {
    var o = '', ca = Math.cos(a * Math.PI / 180), sa = Math.sin(a * Math.PI / 180);
    for (var i = 0; i < n; i++) { var off = (i - (n - 1) / 2) * 5, px = x - sa * off, py = y + ca * off, l = len * (i % 2 ? 0.7 : 1);
      o += S(D`M${px},${py} L${px - ca * l},${py - sa * l}`, col, 1.8, 0.8); }
    return o;
  }

  /* an arrowhead at (x,y) pointing at angle a (degrees) */
  function head(x, y, a, s, col) { return P('M0,0 L-7,-4.6 L-5,0 L-7,4.6 Z', col, 1.8).replace('<path', '<path transform="' + tr(x, y, a, s) + '"'); }
  /* a heal cross */
  function plus(c, x, y, s, col) { return P(D`M${x - 2.4 * s},${y - 7 * s} L${x + 2.4 * s},${y - 7 * s} L${x + 2.4 * s},${y - 2.4 * s} L${x + 7 * s},${y - 2.4 * s} L${x + 7 * s},${y + 2.4 * s} L${x + 2.4 * s},${y + 2.4 * s} L${x + 2.4 * s},${y + 7 * s} L${x - 2.4 * s},${y + 7 * s} L${x - 2.4 * s},${y + 2.4 * s} L${x - 7 * s},${y + 2.4 * s} L${x - 7 * s},${y - 2.4 * s} L${x - 2.4 * s},${y - 2.4 * s} Z`, c.lg([[0, '#ffffff'], [1, col]]), 1.8); }
  function heart(c, x, y, s, col) { return P(D`M${x},${y + 6 * s} C${x - 9 * s},${y} ${x - 7 * s},${y - 7 * s} ${x - 3 * s},${y - 6 * s} C${x - 1 * s},${y - 5.6 * s} ${x},${y - 4 * s} ${x},${y - 3 * s} C${x},${y - 4 * s} ${x + 1 * s},${y - 5.6 * s} ${x + 3 * s},${y - 6 * s} C${x + 7 * s},${y - 7 * s} ${x + 9 * s},${y} ${x},${y + 6 * s} Z`, c.lg([[0, lt(col, 0.5)], [1, col]]), 1.8); }

  var NEW = {
    /* warrior: a big shield stepping in front of a smaller ally, the hit sparking off its face */
    intervene: function (c) {
      var ally = C(17, 30, 5.4, c.cel('#6a7a90'), 2) + P('M8,58 C8,46 11,39 17,39 C23,39 26,46 26,58 Z', c.cel('#4a5a70'), 2);
      var shield = P('M26,14 C34,16 42,15 50,11 C52,22 53,34 50,42 C47,50 42,55 38,58 C33,55 28,50 26,42 C24,34 24,24 26,14 Z', c.cel('#b8423a'), 2.6) +
        S('M38,16 L38,56 M27,32 L50,32', GOLD, 3, 0.95) + C(38, 32, 4, c.cel(GOLD), 1.8);
      var arc = S2('M8,24 C10,12 22,8 30,10', '#ffe0a0', 2.4, 0.9);
      return iconWrap(c, ['#b04420', '#180402'], glow(c, 38, 32, 24, '#ff9a3a', 0.45) + ally + arc + shield + burst(c, 54, 22, 8, 3.5, 7, '#ffd070') + lines(60, 12, -135, 2, 6, '#ffe0b0'));
    },
    /* mage: an arcane clock face, its hands set at a mark, a curved arrow winding back round it */
    chronomark: function (c) {
      var face = C(32, 33, 15, c.rg([[0, '#e8d8ff'], [0.7, '#9a70f0'], [1, '#4a2aa0']], 0.45, 0.4, 0.6), 2.6);
      var ticks = '';
      for (var i = 0; i < 12; i++) { var a = i * Math.PI / 6, r0 = i % 3 ? 11.5 : 9.5; ticks += S(D`M${32 + Math.sin(a) * r0},${33 - Math.cos(a) * r0} L${32 + Math.sin(a) * 13},${33 - Math.cos(a) * 13}`, '#2a1060', i % 3 ? 1.2 : 2); }
      var hands = S2('M32,33 L32,23', '#ffffff', 2.2) + S2('M32,33 L39,37', '#ffffff', 2.2) + C(32, 33, 2, '#fff', 1.4);
      var rewind = S2('M52,44 A22,22 0 1 1 46,15', '#c8a0ff', 3.2) + head(47, 16, 45, 1, '#e0c8ff');
      return iconWrap(c, ['#5a3ad0', '#06041c'], glow(c, 32, 33, 26, '#9a70ff', 0.55) + rewind + face + ticks + hands +
        sparkle(32, 7, 4.2, '#ffffff') + C(54, 47, 2, '#e0c8ff', 0));
    },
    /* priest: a bolt of shadow and light that turns, mid-flight, into a green-gold heal */
    vow_of_atonement: function (c) {
      var bolt = P('M8,8 C16,10 26,18 33,27 L28,31 C20,24 12,16 8,8 Z', c.lg([[0, '#3a1a5a'], [0.6, '#9a6ad0'], [1, '#ffe890']], 0, 0, 1, 1), 2.2);
      var swirl = S('M10,14 C16,16 20,20 24,26', '#d0b0ff', 1.4, 0.7);
      return iconWrap(c, ['#e8d8a0', '#1a1408'], glow(c, 40, 40, 22, '#c8ff8a', 0.7) + glow(c, 18, 18, 14, '#8a5ad0', 0.5) + bolt + swirl +
        burst(c, 31, 30, 6, 2.6, 8, '#fff2b0') + plus(c, 42, 42, 1.25, '#7ad860') + sparkle(54, 30, 3.5, '#f0ffd0') + sparkle(30, 54, 3, '#f0ffd0') + C(52, 54, 1.6, '#e0ffb0', 0));
    },
    /* rogue: a target marked with a red X in aiming brackets, a dagger pointing at it, an arrow passing the opening on to someone else */
    set_up: function (c) {
      var mark = S2('M30,16 L46,34 M46,16 L30,34', '#ff3a2a', 4.4) + S('M31,18 L44,32', '#ffb0a0', 1.2, 0.7);
      var brackets = S2('M22,12 L22,8 L26,8 M50,8 L54,8 L54,12 M54,38 L54,42 L50,42 M26,42 L22,42 L22,38', '#ffd0c0', 2);
      var dagger = G(P('M0,-26 L3.4,-8 L-3.4,-8 Z', c.lg(STEEL, 0, 0, 1, 0), 2) + R(-8, -8, 16, 3.6, c.cel('#4a4a58'), 1.8, 1, 1.5) +
        R(-2.2, -4.4, 4.4, 10, c.cel(LEATH), 1.8) + C(0, 7.6, 2.6, c.cel('#4a4a58'), 1.6), tr(22, 46, 45));
      var pass = SD('M46,44 C52,48 54,54 50,58', '#c8f0d8', 2.2, '3 3', 0.9) + head(50, 58, 120, 0.8, '#c8f0d8');
      return iconWrap(c, ['#3a5a4a', '#040a06'], glow(c, 38, 25, 18, '#ff6a4a', 0.4) + brackets + mark + dagger + pass);
    },
    /* paladin: a holy lantern, its light spilling two ways */
    lantern_of_faith: function (c) {
      var ring = S2('M27,13 C27,6 37,6 37,13', GOLD, 2.4);
      var cap = P('M22,18 L42,18 L38,13 L26,13 Z', c.cel(GOLD), 2.2);
      var glass = P('M23,18 L41,18 L43,44 L21,44 Z', c.lg([[0, '#fff8d8'], [0.5, '#ffe070'], [1, '#e8a020']]), 2.4);
      var flame = P('M32,24 C36,30 38,34 35,38 C34,40 30,40 29,38 C26,34 29,30 32,24 Z', c.lg([[0, '#ffffff'], [1, '#ff9a20']]), 1.4);
      var bars = S('M28,18 L27,44 M36,18 L37,44', dk(GOLD, 0.35), 2.2) + R(19, 44, 26, 6, c.cel(GOLD), 2.2, 1, 1.5) + R(23, 50, 18, 4, c.cel(dk(GOLD, 0.2)), 2, 1, 1);
      var rays = S('M14,30 L5,24 M14,36 L5,40', '#fff4b0', 2.2, 0.85) + S('M50,30 L59,24 M50,36 L59,40', '#fff4b0', 2.2, 0.85);
      return iconWrap(c, ['#c88a20', '#1a0c02'], glow(c, 32, 32, 28, '#ffe070', 0.75) + rays + ring + glass + flame + bars + cap +
        sparkle(8, 32, 3.5, '#ffffff') + sparkle(56, 32, 3.5, '#ffffff'));
    },
    /* warlock: a dark contract sealed with a drop of blood, two more drops falling from it */
    blood_bargain: function (c) {
      var page = P('M14,12 L46,8 C44,22 48,40 50,52 L18,56 C20,42 16,26 14,12 Z', c.lg([[0, '#e8d8b8'], [1, '#a88a60']]), 2.4) +
        S('M20,18 L40,15 M21,24 L41,21 M22,30 L36,28', '#5a3a22', 1.6, 0.7) + P('M10,10 C12,8 16,9 16,12 L14,12 C14,10 12,10 10,12 Z', '#a88a60', 1.8);
      var drop = P('M34,30 C40,38 44,42 44,47 C44,53 39,57 34,57 C29,57 24,53 24,47 C24,42 28,38 34,30 Z', c.lg([[0, '#ff6a6a'], [0.5, '#c01818'], [1, '#5a0408']]), 2.6) +
        E(30, 45, 2, 4, '#ffd0d0', 0, 0.75, 25);
      var drips = P('M52,40 C54,44 55,46 55,48 C55,50 53,51 52,51 C51,51 49,50 49,48 C49,46 50,44 52,40 Z', '#c01818', 1.6) + P('M12,48 C13.6,51 14.4,52 14.4,53.6 C14.4,55 13.4,56 12,56 C10.6,56 9.6,55 9.6,53.6 C9.6,52 10.4,51 12,48 Z', '#c01818', 1.4);
      return iconWrap(c, ['#5a2a7a', '#06020a'], glow(c, 34, 46, 18, '#ff3a3a', 0.45) + page + drop + drips + C(50, 14, 1.6, '#d8ff9a', 0) + C(56, 22, 1.2, '#d8ff9a', 0));
    },
    /* hunter: a lump of bait swinging on a hook, its scent drifting up */
    lure: function (c) {
      var line = S('M32,2 L32,16', '#e8e0d0', 1.6) + S('M32,2 L32,16', OL, 0.6);
      var hook = S2('M32,16 L32,40 C32,50 20,50 20,42 L22,38', '#c2cad3', 3) + P('M20,37 L24,41 L19,43 Z', '#c2cad3', 1.4) + C(32, 16, 2.4, '#c2cad3', 1.6);
      var meat = P(blob(lump(34, 36, 11, 8, 17, 9, 0.3)), c.cel('#c0443a'), 2.4) + P(blob(lump(32, 34, 6, 4, 5, 7, 0.3)), '#e8807a', 0, 0.8) +
        R(42, 32, 12, 3.6, '#f0e8d8', 2, 1, 1.5) + C(54, 31.5, 2.4, '#f0e8d8', 1.6) + C(54, 35.5, 2.4, '#f0e8d8', 1.6);
      var scent = S('M18,28 C14,24 20,20 16,14', '#f0ffd0', 1.8, 0.7) + S('M48,22 C44,18 50,14 46,8', '#f0ffd0', 1.8, 0.6);
      return iconWrap(c, ['#5a7a2a', '#060a02'], glow(c, 34, 36, 20, '#e0ff9a', 0.4) + scent + line + meat + hook + sparkle(12, 52, 3, '#f0ffd0'));
    },
    /* druid: a glowing seed in the soil, a two-leaf sprout rising from it */
    seed_of_renewal: function (c) {
      var soil = P('M4,52 C14,44 26,46 32,46 C40,46 50,44 60,50 L60,60 L4,60 Z', c.cel('#5a3a22'), 2.2);
      var seed = E(32, 48, 8, 6, c.rg([[0, '#fff8c0'], [0.6, '#e8c050'], [1, '#8a5a20']], 0.4, 0.35, 0.7), 2.4);
      var stem = S2('M32,43 C32,34 30,28 32,20', '#7ad850', 2.6);
      var leaves = P('M32,26 C26,18 16,18 12,22 C18,28 26,30 32,26 Z', c.cel('#5aa83a'), 2.2) + P('M32,22 C36,12 46,10 52,12 C48,20 40,24 32,22 Z', c.cel('#6ac048'), 2.2) +
        S('M30,26 C24,23 19,22 15,22 M34,21 C39,17 44,14 49,13', '#c8ff9a', 1.2, 0.8);
      return iconWrap(c, ['#7a3a1a', '#0a0402'], glow(c, 32, 40, 24, '#c8ff8a', 0.6) + soil + stem + leaves + seed + sparkle(32, 48, 3, '#ffffff') +
        sparkle(14, 36, 3, '#e0ffc0') + sparkle(50, 32, 3, '#e0ffc0') + C(42, 40, 1.4, '#e0ffc0', 0));
    },
    /* shaman: a small totem holding two spirit rings level on a beam, a link of light between them */
    kinship_totem: function (c) {
      var pole = P('M27,22 L37,22 L38,58 L26,58 Z', c.cel('#8a5a30'), 2.4) + S('M27,34 L37,34 M26,46 L38,46', '#3a2210', 1.8) +
        C(29.6, 28, 1.6, '#ffd060', 0) + C(34.4, 28, 1.6, '#ffd060', 0) + S('M29,31 L35,31', '#3a2210', 1.4) + P('M24,22 L32,12 L40,22 Z', c.cel('#3a9aa8'), 2.2);
      var beam = R(10, 18, 44, 4.4, c.cel('#a87040'), 2.2, 1, 1.5);
      var ring = function (x) { return S(D`M${x},22 L${x},28`, '#e8e0d0', 1.4) + '<circle cx="' + x + '" cy="37" r="7" fill="none" stroke="' + OL + '" stroke-width="6"/><circle cx="' + x + '" cy="37" r="7" fill="none" stroke="#8ad8ff" stroke-width="3"/>' + C(x, 37, 3, '#e8f8ff', 0, 0.9); };
      var link = SD('M22,38 C26,44 38,44 42,38', '#c8f4ff', 2, '2.4 2.6', 0.9);
      return iconWrap(c, ['#1a7a8a', '#020a10'], glow(c, 32, 36, 26, '#6ae0ff', 0.5) + pole + beam + ring(15) + ring(49) + link + sparkle(32, 6, 3.2, '#ffffff'));
    },
    /* bard: two notes joined by one beam, a heart between them */
    duet: function (c) {
      var beam = P('M19,14 L47,8 L47,14 L19,20 Z', c.cel('#f0c860'), 2.2);
      var stemL = R(17, 16, 4, 28, '#f0c860', 2), stemR = R(45, 10, 4, 28, '#e070c0', 2);
      var headL = E(14, 45, 7.4, 5.4, c.lg([[0, '#fff0b8'], [1, '#d8a030']]), 2.4, 1, -22), headR = E(42, 39, 7.4, 5.4, c.lg([[0, '#fff0f8'], [1, '#d050a8']]), 2.4, 1, -22);
      return iconWrap(c, ['#a02a7a', '#14020e'], glow(c, 32, 32, 26, '#ff8ad0', 0.55) + stemL + stemR + beam + headL + headR + glow(c, 32, 32, 9, '#ffb0e0', 0.8) +
        heart(c, 32, 31, 1.15, '#ff4a8a') + sparkle(56, 52, 3.5, '#ffd0f0') + C(8, 26, 1.6, '#ffd0f0', 0) + C(28, 54, 1.4, '#ffd0f0', 0));
    }
  };


  /* ================= extend the public API ================= */
  var has = function (t, k) { return typeof k === 'string' && Object.prototype.hasOwnProperty.call(t, k); };
  function phIcon(c) { return iconWrap(c, ['#5a5a62', '#1a1a1e'], C(32, 32, 12, '#8a8a92', 2)); }
  function make(k) {
    try { var c = new Ctx(); return c.svg(64, 64, NEW[k](c)); } catch (e) {
      try { var c2 = new Ctx(); return c2.svg(64, 64, phIcon(c2)); } catch (e2) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><rect width="64" height="64" fill="#444"/></svg>'; }
    }
  }
  var baseIcon = typeof ART.icon === 'function' ? ART.icon : function () { var c = new Ctx(); return c.svg(64, 64, phIcon(c)); };
  ART.icon = function (k) {
    if (has(NEW, k)) return make(k);
    try { return baseIcon.apply(this, arguments); } catch (e) { return make.call(null, '__none__'); }
  };
  ART.keys = ART.keys || {};
  var list = Array.isArray(ART.keys.icons) ? ART.keys.icons : (ART.keys.icons = []);
  Object.keys(NEW).forEach(function (k) { if (list.indexOf(k) < 0) list.push(k); });
})(typeof window !== 'undefined' ? window : this);
