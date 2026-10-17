/* art_icons14.js - the ten class interrupts for Realm of Loner (#179): Hilt Bash, Throat Jab, Spellbreak, Hush,
 * Storm Snap, Choke Hex, Pinning Shot, Stern Word, Thornlash and Sour Note. Each shows its class's way of cutting off a
 * cast, with a small broken spell spiral where the cast is cut.
 * Loads AFTER art.js, art_icons2.js .. art_icons13.js and art_mounts.js and EXTENDS window.ART: ART.icon handles the keys
 * below and falls through to the previous ART.icon for every other key (prototype keys included). Keys are appended to
 * ART.keys.icons. Self-contained: the helpers are copied from art_icons13.js (same maths, same look). Never throws.
 * Style: 64x64, tinted radial background, bold glyph, #1a1009 outline, vignette + bevel frame, no text, no filters.
 * Gradient ids use the prefix iZ<counter>_ so they never collide.
 */
(function (root) {
  'use strict';
  var W = root || {};
  var ART = W.ART = W.ART || {};

  /* ================= helpers (copied from art_icons13.js) ================= */
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

  function Ctx() { this.u = 'iZ' + (++UID).toString(36); this.k = 0; this.defs = []; this.cache = {}; }
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

  /* the cast being cut: a spell spiral with a gap, its broken end flying off */
  function cut(x, y, s, col) {
    var d = D`M${x + 7 * s},${y} A${7 * s},${7 * s} 0 1 1 ${x},${y - 7 * s} M${x},${y - 3.6 * s} A${3.6 * s},${3.6 * s} 0 1 0 ${x + 3.6 * s},${y}`;
    return S2(d, col, 2 * s) + S(D`M${x + 4 * s},${y - 9 * s} L${x + 9 * s},${y - 5 * s}`, '#ffffff', 1.6 * s, 0.9) +
      C(x + 10.5 * s, y - 9.5 * s, 1.4 * s, col, 0) + C(x + 12 * s, y - 4.5 * s, 1 * s, col, 0, 0.8);
  }
  function burst(c, x, y, ro, ri, n, col) { return glow(c, x, y, ro * 1.6, col, 0.7) + P(star(x, y, n, ro, ri, 0.2), c.lg([[0, '#fffbe8'], [1, col]]), 1.8); }
  function lines(x, y, a, n, len, col) {
    var o = '', ca = Math.cos(a * Math.PI / 180), sa = Math.sin(a * Math.PI / 180);
    for (var i = 0; i < n; i++) { var off = (i - (n - 1) / 2) * 5, px = x - sa * off, py = y + ca * off, l = len * (i % 2 ? 0.7 : 1);
      o += S(D`M${px},${py} L${px - ca * l},${py - sa * l}`, col, 1.8, 0.8); }
    return o;
  }

  var NEW = {
    /* warrior: a sword turned round, its pommel slamming in with a hot impact burst */
    hilt_bash: function (c) {
      var g = G(R(-2.6, -24, 5.2, 18, c.lg(STEEL, 0, 0, 1, 0), 2) + R(-11, -7, 22, 5, c.cel(GOLD), 2, 1, 2) +
        R(-3, -2, 6, 13, c.cel(LEATH), 2) + S('M-3,1 L3,3 M-3,5 L3,7', '#8a6040', 1.2) + C(0, 14, 5.2, c.cel(GOLD), 2.2), tr(36, 34, -38));
      return iconWrap(c, ['#b04420', '#180402'], burst(c, 22, 46, 13, 6, 9, '#ff9a3a') + lines(46, 22, -128, 3, 9, '#ffd8a0') + g + cut(46, 50, 0.85, '#ff7a3a'));
    },
    /* rogue: a gloved fist driving forward, knuckles first, motion lines behind */
    throat_jab: function (c) {
      var fist = P('M18,30 C18,25 22,23 27,23 L42,23 C47,23 50,26 50,30 L50,38 C50,42 47,45 42,45 L28,45 C22,45 18,41 18,36 Z', c.cel('#3a3a44'), 2.4) +
        S('M42,24 L42,44 M34,24 L34,44 M27,26 L27,44', '#1a1a20', 1.6, 0.7) + P('M20,36 C14,36 10,40 10,44 L22,44 Z', c.cel('#2a2a32'), 2) +
        R(8, 40, 12, 14, c.cel('#24242c'), 2.2) + S('M45,27 L48,27 M45,33 L48,33 M45,39 L48,39', '#9aa0b0', 1.4, 0.8);
      return iconWrap(c, ['#3a5a4a', '#040a06'], lines(14, 32, 0, 3, 10, '#c8f0d8') + burst(c, 54, 33, 9, 4, 7, '#c8ffd8') + fist + cut(18, 16, 0.8, '#7aeab0'));
    },
    /* mage: an arcane rune circle shattering into shards */
    spellbreak: function (c) {
      var ring = '<circle cx="32" cy="32" r="18" fill="none" stroke="' + OL + '" stroke-width="6"/>' +
        '<circle cx="32" cy="32" r="18" fill="none" stroke="#c8a0ff" stroke-width="3" stroke-dasharray="20 6 14 9 24 6"/>';
      var runes = S('M32,20 L32,26 M44,32 L38,32 M32,44 L32,38 M20,32 L26,32', '#f0e0ff', 2, 0.9);
      var shards = P('M46,14 L54,10 L52,19 Z', c.cel('#b088ff'), 1.6) + P('M50,24 L60,24 L54,30 Z', c.cel('#9a70f0'), 1.6) + P('M42,8 L46,4 L47,11 Z', c.cel('#d0b8ff'), 1.4);
      var crack = S2('M32,32 L40,24 L44,26 L50,18', '#ffffff', 2.2);
      return iconWrap(c, ['#5a3ad0', '#06041c'], glow(c, 32, 32, 22, '#9a70ff', 0.6) + ring + runes + crack + shards + sparkle(32, 32, 6, '#ffffff'));
    },
    /* priest: a raised finger against a soft glow, a sound wave falling silent */
    hush: function (c) {
      var hand = P('M28,58 L28,40 C28,37 30,36 32,36 L32,14 C32,11 34,10 36,10 C38,10 40,11 40,14 L40,36 L44,37 C47,38 48,40 48,43 L46,58 Z', c.cel('#f0d8b8'), 2.4) +
        S('M40,36 L40,44 M34,38 L34,44', '#c8a080', 1.4, 0.8);
      var waves = S('M14,26 C10,30 10,36 14,40', '#fff4c8', 2.2, 0.9) + S('M9,22 C3,28 3,38 9,44', '#fff4c8', 1.8, 0.45) + S('M50,22 C54,26 54,32 50,36', '#fff4c8', 1.6, 0.3);
      return iconWrap(c, ['#e8d8a0', '#1a1408'], glow(c, 36, 24, 24, '#fff2c0', 0.75) + waves + hand + cut(14, 52, 0.75, '#ffe890'));
    },
    /* shaman: a big spell spiral snapped in two by a thin fork of lightning, the halves pushed apart */
    storm_snap: function (c) {
      var half = function (x, y, a) { return G(S2('M0,-14 A14,14 0 0 0 -14,0 A14,14 0 0 0 0,14 M0,-7 A7,7 0 0 0 -7,0 A7,7 0 0 0 0,7', '#8ad8ff', 3), tr(x, y, a)); };
      var fork = P('M44,4 L30,28 L36,29 L26,46 L40,26 L34,25 L48,4 Z', c.lg([[0, '#ffffff'], [1, '#9ad8ff']]), 1.8) + S2('M30,40 L22,58', '#e8f8ff', 1.6) + S2('M33,36 L42,56', '#e8f8ff', 1.4);
      return iconWrap(c, ['#1a7a8a', '#020a10'], glow(c, 32, 32, 26, '#6ae0ff', 0.55) + half(26, 36, -12) + half(40, 34, 168) + fork + sparkle(14, 14, 4, '#ffffff') + sparkle(52, 50, 3, '#c8f4ff'));
    },
    /* warlock: a fel hand of smoke closing round a spell spiral */
    choke_hex: function (c) {
      var smoke = c.lg([[0, '#b8ff70'], [1, '#3a8a1a']]);
      var hand = P('M10,58 C14,50 16,44 22,40 C18,34 16,26 20,20 C22,24 24,28 28,30 C26,22 28,14 34,10 C34,18 36,24 38,28 C40,20 46,16 52,16 C48,22 46,28 46,34 C52,32 56,34 58,38 C50,40 44,48 40,58 Z', smoke, 2.4);
      return iconWrap(c, ['#5a2a7a', '#06020a'], glow(c, 34, 34, 24, '#8aff4a', 0.4) + hand + cut(34, 36, 0.8, '#e0a0ff') + C(20, 20, 1.6, '#d8ff9a', 0) + C(52, 16, 1.4, '#d8ff9a', 0) + C(34, 10, 1.4, '#d8ff9a', 0));
    },
    /* hunter: an arrow pinning a fluttering spell spiral to the ground */
    pinning_shot: function (c) {
      var arrow = G(R(-1.6, -30, 3.2, 44, c.cel('#a8763e'), 1.8) + P('M0,20 L-6,10 L6,10 Z', c.lg(STEEL, 0, 0, 1, 0), 2) +
        P('M-1.6,-30 L-7,-38 L-7,-28 L-1.6,-22 Z', '#e8e0d0', 1.6) + P('M1.6,-30 L7,-38 L7,-28 L1.6,-22 Z', '#c8c0b0', 1.6), tr(34, 30, 30));
      return iconWrap(c, ['#5a7a2a', '#060a02'], E(42, 52, 18, 5, '#000', 0, 0.35) + cut(38, 46, 0.9, '#ffd060') + arrow + lines(18, 10, 120, 2, 7, '#f0ffd0'));
    },
    /* paladin: a commanding word as three golden rings of sound driving into a spell spiral and breaking it */
    stern_word: function (c) {
      var arc = function (r, w, o) { return S2(D`M${12 + r * 0.5},${32 - r} A${r},${r} 0 0 1 ${12 + r * 0.5},${32 + r}`, '#ffe68a', w, o); };
      return iconWrap(c, ['#c88a20', '#1a0c02'], glow(c, 20, 32, 24, '#ffe070', 0.6) + P('M6,24 L14,24 L22,16 L22,48 L14,40 L6,40 Z', c.cel('#f0d8a0'), 2.2) +
        arc(8, 3, 1) + arc(14, 2.6, 0.85) + arc(20, 2.2, 0.7) + cut(48, 34, 1, '#fff0b0') + sparkle(54, 12, 4, '#ffffff'));
    },
    /* druid: a thorny vine whipping out in an S */
    thornlash: function (c) {
      var vine = 'M10,56 C20,48 14,36 26,32 C38,28 34,16 52,10';
      var thorns = '';
      [[14, 50, -40], [18, 40, 150], [26, 32, -60], [36, 26, 140], [44, 16, -50]].forEach(function (t) { thorns += P('M0,-2 L8,0 L0,2 Z', '#d8e8a0', 1.4).replace('<path', '<path transform="' + tr(t[0], t[1], t[2]) + '"'); });
      return iconWrap(c, ['#7a3a1a', '#0a0402'], glow(c, 32, 32, 24, '#c8ff8a', 0.35) + S2(vine, '#5aa83a', 4.4) + S(vine, '#9ad870', 1.6, 0.8) + thorns +
        P('M50,10 C54,6 58,8 56,12 C54,14 52,13 50,10 Z', '#7ad850', 1.6) + lines(54, 18, 60, 2, 6, '#e0ffd0') + cut(44, 46, 0.9, '#c0ff90'));
    },
    /* bard: a musical note split by a crack, a sour wave bent out of shape */
    sour_note: function (c) {
      var note = P('M30,12 L44,8 L44,40 C44,46 38,50 32,48 C27,46 27,40 32,38 C35,37 37,37 39,38 L39,18 L35,19 L35,46 C35,52 29,56 23,54 C18,52 18,46 23,44 C26,43 28,43 30,44 Z', c.lg([[0, '#fff0f8'], [1, '#e070c0']]), 2.2);
      var crack = S2('M28,16 L33,24 L29,30 L35,38', '#2a0a20', 1.2);
      var wave = S('M8,56 C12,50 14,60 18,54 C22,48 22,62 28,56', '#ff9ad8', 2.2, 0.9);
      return iconWrap(c, ['#a02a7a', '#14020e'], glow(c, 34, 30, 24, '#ff8ad0', 0.6) + note + crack + wave + sparkle(52, 50, 4, '#ffd0f0') + C(50, 14, 1.6, '#ffd0f0', 0));
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
