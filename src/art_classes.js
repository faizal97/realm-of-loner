/* art_classes.js - class crests for Realm of Loner (#231: the database and guides; the game can use them too).
 * ART.icon keys: class_<id> for every class in D.CLASSES (warrior, mage, priest, rogue, paladin, warlock, hunter,
 *   druid, shaman, bard): one bold glyph on a ground in the class's colour.
 *   warrior  a heater shield over two crossed blades     mage     an eight-point star around an orb
 *   priest   a sun disk with twelve rays                 rogue    two crossed daggers
 *   paladin  an upright hammer in a gold halo            warlock  a fel flame inside a horned ring
 *   hunter   a drawn bow with its arrow                  druid    an oak leaf over a crescent moon
 *   shaman   a lightning bolt through a stone ring       bard     a lyre
 * Built to read at 24 px (a list row) as well as at 64. Loads after the other icon packs and EXTENDS window.ART:
 * ART.icon handles these keys and falls through to the previous ART.icon for every other key. Never throws.
 * Style as art_honor.js: 64x64, tinted radial ground, #1a1009 outline, vignette + bevel frame, no text, no filters.
 * Gradient ids use the prefix cC<counter>_. Contact sheet: node art/classes/render.js
 */
(function (root) {
  'use strict';
  var W = root || {};
  var ART = W.ART = W.ART || {};
  var UID = 0, OL = '#1a1009', GOLD = '#d6a53c', STEEL = '#c9ced6';
  function r1(v) { v = +v; return isFinite(v) ? Math.round(v * 10) / 10 : 0; }
  function rgb(c) { c = String(c || '').replace('#', ''); if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2]; var v = parseInt(c, 16); if (isNaN(v)) v = 0x808080; return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; }
  function hex(a) { return '#' + a.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  function mix(a, b, t) { var A = rgb(a), B = rgb(b); return hex([0, 1, 2].map(function (i) { return A[i] + (B[i] - A[i]) * t; })); }
  function lt(c, t) { return mix(c, '#ffffff', t); }
  function dk(c, t) { return mix(c, '#000000', t); }
  function Ctx() { this.u = 'cC' + (++UID).toString(36); this.k = 0; this.defs = []; }
  Ctx.prototype.grad = function (tag, st, a) {
    var id = this.u + '_' + (this.k++).toString(36);
    this.defs.push('<' + tag + ' id="' + id + '" ' + a + '>' + st.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '/>'; }).join('') + '</' + tag + '>');
    return 'url(#' + id + ')';
  };
  Ctx.prototype.lg = function (st, x1, y1, x2, y2) { return this.grad('linearGradient', st, 'x1="' + (x1 || 0) + '" y1="' + (y1 || 0) + '" x2="' + (x2 == null ? 0 : x2) + '" y2="' + (y2 == null ? 1 : y2) + '"'); };
  Ctx.prototype.rg = function (st, cx, cy, r) { return this.grad('radialGradient', st, 'cx="' + (cx == null ? 0.5 : cx) + '" cy="' + (cy == null ? 0.5 : cy) + '" r="' + (r || 0.5) + '"'); };
  Ctx.prototype.cel = function (c) { return this.lg([[0, lt(c, 0.35)], [0.45, c], [1, dk(c, 0.4)]], 0.2, 0, 0.8, 1); };
  Ctx.prototype.svg = function (body) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">' + (this.defs.length ? '<defs>' + this.defs.join('') + '</defs>' : '') + body + '</svg>'; };
  function P(d, fill, sw) { return '<path d="' + d + '" fill="' + fill + '"' + (sw === 0 ? '' : ' stroke="' + OL + '" stroke-width="' + (sw || 2.2) + '" stroke-linejoin="round" stroke-linecap="round"') + '/>'; }
  function S(d, col, w, o) { return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + r1(w) + '" stroke-linecap="round" stroke-linejoin="round"' + (o != null ? ' opacity="' + o + '"' : '') + '/>'; }
  function C(x, y, r, fill, sw) { return '<circle cx="' + r1(x) + '" cy="' + r1(y) + '" r="' + r1(r) + '" fill="' + fill + '"' + (sw === 0 ? '' : ' stroke="' + OL + '" stroke-width="' + (sw || 2) + '"') + '/>'; }
  function G(body, tf) { return '<g transform="' + tf + '">' + body + '</g>'; }
  // a thick outlined stroke: the outline first, then the colour, so a line reads at 24 px
  function bar(d, col, w) { return S(d, OL, w + 2.6) + S(d, col, w); }
  function frame(c, base, glyph) {
    return '<rect width="64" height="64" fill="' + c.rg([[0, dk(base, 0.35)], [1, dk(base, 0.82)]], 0.45, 0.4, 0.75) + '"/>' + glyph +
      '<rect width="64" height="64" fill="' + c.rg([[0.6, '#000', 0], [1, '#000', 0.55]], 0.5, 0.5, 0.72) + '"/>' +
      '<rect x="1.5" y="1.5" width="61" height="61" fill="none" stroke="#0b0806" stroke-width="3"/>' +
      S('M3.8,60.2 L3.8,3.8 L60.2,3.8', '#ffffff', 1.6, 0.4) + S('M3.8,60.2 L60.2,60.2 L60.2,3.8', '#000000', 1.6, 0.55);
  }
  function star(cx, cy, n, ro, ri, rot) {
    var d = '', a0 = (rot || 0) - Math.PI / 2;
    for (var i = 0; i < n * 2; i++) { var r = i % 2 ? ri : ro, a = a0 + (i * Math.PI) / n; d += (i ? ' L' : 'M') + r1(cx + Math.cos(a) * r) + ',' + r1(cy + Math.sin(a) * r); }
    return d + ' Z';
  }
  function dagger(c, x1, y1, x2, y2) { // a blade from (x1,y1) to its tip (x2,y2), guard and pommel at the start
    var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy), ux = dx / L, uy = dy / L, px = -uy, py = ux;
    var gx = x1 + ux * 9, gy = y1 + uy * 9;
    return bar('M' + r1(x1) + ',' + r1(y1) + ' L' + r1(gx) + ',' + r1(gy), '#6b4423', 3.4) + C(x1 - ux * 1.5, y1 - uy * 1.5, 2.6, GOLD, 1.6) +
      P('M' + r1(gx + px * 3) + ',' + r1(gy + py * 3) + ' L' + r1(x2) + ',' + r1(y2) + ' L' + r1(gx - px * 3) + ',' + r1(gy - py * 3) + ' Z', c.cel(STEEL), 1.8) +
      bar('M' + r1(gx + px * 6) + ',' + r1(gy + py * 6) + ' L' + r1(gx - px * 6) + ',' + r1(gy - py * 6), GOLD, 2.6);
  }

  var CREST = {
    warrior: function (c, col) {
      // two long swords crossed behind a smaller shield: guards, grips and points all clear of it
      return dagger(c, 11, 55, 53, 9) + dagger(c, 53, 55, 11, 9) +
        P('M23,21 L41,21 L41,34 C41,42 37,47 32,50 C27,47 23,42 23,34 Z', c.cel(col), 2.4) +
        P('M32,23 L39,23 L39,34 C39,40 36,44 32,47 Z', lt(col, 0.25), 0) + bar('M32,25 L32,45', GOLD, 2) + bar('M26,32 L38,32', GOLD, 2);
    },
    mage: function (c, col) {
      return P(star(32, 32, 8, 25, 10), c.cel(col), 2.2) + P(star(32, 32, 4, 17, 7, Math.PI / 4), lt(col, 0.4), 1.6) +
        C(32, 32, 7.5, c.rg([[0, '#ffffff'], [0.5, lt(col, 0.5)], [1, col]], 0.4, 0.35, 0.6), 2);
    },
    priest: function (c, col) {
      var rays = ''; for (var i = 0; i < 12; i++) { var a = (i * Math.PI) / 6, b = a + 0.16, d = a - 0.16;
        rays += P('M' + r1(32 + Math.cos(d) * 13) + ',' + r1(32 + Math.sin(d) * 13) + ' L' + r1(32 + Math.cos(a) * 27) + ',' + r1(32 + Math.sin(a) * 27) + ' L' + r1(32 + Math.cos(b) * 13) + ',' + r1(32 + Math.sin(b) * 13) + ' Z', i % 2 ? lt(GOLD, 0.3) : '#fff3c4', 1.6); }
      return rays + C(32, 32, 13, c.rg([[0, '#ffffff'], [0.6, '#fff1b8'], [1, GOLD]], 0.42, 0.38, 0.65), 2.4) + C(32, 32, 7, '#ffffff', 0);
    },
    rogue: function (c, col) {
      return dagger(c, 13, 51, 47, 15) + dagger(c, 51, 51, 17, 15) + C(32, 33, 3.2, col, 1.6);
    },
    paladin: function (c, col) {
      return C(32, 30, 20, 'none', 0) + S('M32,30 m-19,0 a19,19 0 1,0 38,0 a19,19 0 1,0 -38,0', OL, 6.4) + S('M32,30 m-19,0 a19,19 0 1,0 38,0 a19,19 0 1,0 -38,0', GOLD, 3.2) +
        bar('M32,24 L32,54', '#7a4f2a', 4.4) + C(32, 55, 3, GOLD, 1.6) +
        P('M18,12 L46,12 L46,26 L18,26 Z', c.cel(lt(col, 0.15)), 2.4) + P('M22,14 L42,14 L42,17 L22,17 Z', lt(col, 0.6), 0) + bar('M18,19 L46,19', GOLD, 1.6);
    },
    warlock: function (c, col) {
      var fel = '#7dff3a';
      return P('M14,22 C10,14 12,8 16,6 C16,12 19,16 22,18 Z', c.cel('#4a3d55'), 2) + P('M50,22 C54,14 52,8 48,6 C48,12 45,16 42,18 Z', c.cel('#4a3d55'), 2) +
        S('M32,34 m-17,0 a17,17 0 1,0 34,0 a17,17 0 1,0 -34,0', OL, 6.2) + S('M32,34 m-17,0 a17,17 0 1,0 34,0 a17,17 0 1,0 -34,0', col, 3.2) +
        P('M32,13 C36,21 44,26 42,37 C41,45 36,49 32,49 C27,49 22,45 22,38 C22,31 27,29 29,22 C31,26 31,29 33,30 C35,25 34,19 32,13 Z', c.lg([[0, lt(fel, 0.5)], [0.6, fel], [1, '#2f8a12']]), 2.2) +
        P('M32,30 C35,35 38,38 37,42 C36,46 34,47 32,47 C29,47 27,45 27,42 C27,38 30,36 32,30 Z', '#eaffd6', 0);
    },
    hunter: function (c, col) {
      return S('M22,9 C40,16 40,48 22,55', OL, 7.4) + S('M22,9 C40,16 40,48 22,55', '#8a5a2b', 4.2) + S('M22,9 C39,17 39,47 22,55', lt('#8a5a2b', 0.35), 1.4, 0.8) +
        S('M22,9 L16,32 L22,55', '#efe6d0', 1.6) +
        bar('M10,32 L48,32', '#a37b4b', 2.6) + P('M47,27 L57,32 L47,37 Z', c.cel(STEEL), 1.8) +
        P('M10,32 L5,27 L13,27 L16,32 L13,37 L5,37 Z', c.cel(col), 1.6);
    },
    druid: function (c, col) {
      // a crescent: the moon's circle less a second, offset one (they cross at 23.7,13 and 41.4,39.6)
      return P('M23.7,13 A19,19 0 1,0 41.4,39.6 A16,16 0 0,1 23.7,13 Z', c.lg([[0, '#fffbe8'], [0.5, '#efe3b8'], [1, '#b9a874']], 0, 0, 1, 1), 2.4) +
        P('M34,10 C48,16 54,34 44,52 C38,47 30,42 26,32 C22,22 26,14 34,10 Z', c.cel(col), 2.4) +
        S('M44,52 C38,40 34,26 34,10', dk(col, 0.45), 2) + S('M37,24 L45,21 M38,32 L48,31 M39,40 L47,42 M35,30 L28,27 M36,38 L30,37', dk(col, 0.45), 1.6) +
        bar('M44,52 L47,58', '#6b4423', 2.4);
    },
    shaman: function (c, col) {
      return S('M32,32 m-20,0 a20,20 0 1,0 40,0 a20,20 0 1,0 -40,0', OL, 7.2) + S('M32,32 m-20,0 a20,20 0 1,0 40,0 a20,20 0 1,0 -40,0', '#8a8378', 4.2) +
        S('M14,24 L18,25 M50,40 L46,39 M24,50 L26,46 M40,14 L38,18', '#5c564d', 1.6) +
        P('M36,6 L20,34 L30,34 L25,58 L45,26 L34,26 L40,6 Z', c.lg([[0, '#ffffff'], [0.35, lt(col, 0.55)], [1, col]]), 2.4);
    },
    bard: function (c, col) {
      var arm = c.cel(GOLD);
      return P('M20,10 C12,18 14,34 24,44 L28,44 C20,34 20,20 25,13 Z', arm, 2.2) + P('M44,10 C52,18 50,34 40,44 L36,44 C44,34 44,20 39,13 Z', arm, 2.2) +
        bar('M19,14 L45,14', '#7a4f2a', 3.4) + P('M22,44 L42,44 L40,53 L24,53 Z', c.cel(col), 2.2) +
        S('M27,15 L28,44 M32,15 L32,44 M37,15 L36,44', '#f4ecd2', 1.2) + C(20, 10, 2.6, col, 1.4) + C(44, 10, 2.6, col, 1.4);
    },
  };
  // the class colours (src/style.css --c-*; bard from .cls-bard)
  var COL = { warrior: '#C79C6E', mage: '#69CCF0', priest: '#e8e8e8', rogue: '#FFF569', paladin: '#F58CBA', warlock: '#9482C9', hunter: '#ABD473', druid: '#FF7D0A', shaman: '#0070DE', bard: '#2EC4B6' };

  function crest(k) {
    var c = new Ctx(), col = COL[k] || '#999999';
    return c.svg(frame(c, col, CREST[k](c, col)));
  }
  var prev = ART.icon;
  ART.icon = function (key) {
    var m = /^class_([a-z]+)$/.exec(key || '');
    if (m && CREST[m[1]]) { try { return crest(m[1]); } catch (e) { /* fall through */ } }
    return prev ? prev.apply(this, arguments) : '';
  };
  ART.keys = ART.keys || {};
  ART.keys.icons = (ART.keys.icons || []).concat(Object.keys(CREST).map(function (k) { return 'class_' + k; }));
})(typeof window !== 'undefined' ? window : this);
