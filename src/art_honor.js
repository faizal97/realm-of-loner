/* art_honor.js - Honor rank insignia for Realm of Loner (#57, docs/plans/2026-10-03-honor-ranks-design.md).
 * ART.icon keys:
 *   honor_alliance_1 .. honor_alliance_8  the Accord's ranks: blue enamel and gold (chevrons, a shield, a lantern,
 *                                         crossed swords, a crown)
 *   honor_horde_1 .. honor_horde_8        the Krugar's ranks: red, iron and bone (a fang, tusks, an iron brow, an axe,
 *                                         a skull, a crowned fist)
 *   honor_tabard_<f>, honor_banner_<f>    the icons of the rank looks (the cloak uses the game's own 'cloak' icon)
 * The rank climbs in the drawing too: more metal, a brighter ground and a gold ring from rank 5, so a badge reads at a
 * glance at 16-34 px (party frames, the scoreboard) as well as at 64. Loads after the other icon packs and EXTENDS
 * window.ART: ART.icon handles these keys and falls through to the previous ART.icon for every other key. Never throws.
 * Style: 64x64, tinted radial ground, bold glyph, #1a1009 outline, vignette + bevel frame, no text, no filters.
 * Gradient ids use the prefix hR<counter>_. Contact sheet: node art/honor/render.js
 */
(function (root) {
  'use strict';
  var W = root || {};
  var ART = W.ART = W.ART || {};
  var UID = 0, OL = '#1a1009', GOLD = '#d6a53c';
  function r1(v) { v = +v; return isFinite(v) ? Math.round(v * 10) / 10 : 0; }
  function rgb(c) { c = String(c || '').replace('#', ''); if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2]; var v = parseInt(c, 16); if (isNaN(v)) v = 0x808080; return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; }
  function hex(a) { return '#' + a.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  function mix(a, b, t) { var A = rgb(a), B = rgb(b); return hex([0, 1, 2].map(function (i) { return A[i] + (B[i] - A[i]) * t; })); }
  function lt(c, t) { return mix(c, '#ffffff', t); }
  function dk(c, t) { return mix(c, '#000000', t); }
  function Ctx() { this.u = 'hR' + (++UID).toString(36); this.k = 0; this.defs = []; }
  Ctx.prototype.grad = function (tag, st, a) {
    var id = this.u + '_' + (this.k++).toString(36);
    this.defs.push('<' + tag + ' id="' + id + '" ' + a + '>' + st.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '/>'; }).join('') + '</' + tag + '>');
    return 'url(#' + id + ')';
  };
  Ctx.prototype.lg = function (st, x1, y1, x2, y2) { return this.grad('linearGradient', st, 'x1="' + (x1 || 0) + '" y1="' + (y1 || 0) + '" x2="' + (x2 == null ? 0 : x2) + '" y2="' + (y2 == null ? 1 : y2) + '"'); };
  Ctx.prototype.rg = function (st, cx, cy, r) { return this.grad('radialGradient', st, 'cx="' + (cx == null ? 0.5 : cx) + '" cy="' + (cy == null ? 0.5 : cy) + '" r="' + (r || 0.5) + '"'); };
  Ctx.prototype.cel = function (c) { return this.lg([[0, lt(c, 0.32)], [0.45, c], [1, dk(c, 0.4)]], 0.2, 0, 0.8, 1); };
  Ctx.prototype.svg = function (body) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">' + (this.defs.length ? '<defs>' + this.defs.join('') + '</defs>' : '') + body + '</svg>'; };
  function P(d, fill, sw) { return '<path d="' + d + '" fill="' + fill + '"' + (sw === 0 ? '' : ' stroke="' + OL + '" stroke-width="' + (sw || 2.2) + '" stroke-linejoin="round" stroke-linecap="round"') + '/>'; }
  function S(d, col, w, o) { return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + r1(w) + '" stroke-linecap="round" stroke-linejoin="round"' + (o != null ? ' opacity="' + o + '"' : '') + '/>'; }
  function C(x, y, r, fill, sw) { return '<circle cx="' + r1(x) + '" cy="' + r1(y) + '" r="' + r1(r) + '" fill="' + fill + '"' + (sw === 0 ? '' : ' stroke="' + OL + '" stroke-width="' + (sw || 2) + '"') + '/>'; }
  function G(body, tf) { return '<g transform="' + tf + '">' + body + '</g>'; }
  function frame(c, bg, glyph, ring) {
    return '<rect width="64" height="64" fill="' + c.rg([[0, bg[0]], [1, bg[1]]], 0.45, 0.4, 0.75) + '"/>' +
      (ring ? C(32, 32, 27, 'none', 0) + S('M32,5 A27,27 0 1 1 31.9,5', ring, 2.4, 0.85) : '') + glyph +
      '<rect width="64" height="64" fill="' + c.rg([[0.62, '#000', 0], [1, '#000', 0.5]], 0.5, 0.5, 0.72) + '"/>' +
      '<rect x="1.5" y="1.5" width="61" height="61" fill="none" stroke="#0b0806" stroke-width="3"/>' +
      S('M3.8,60.2 L3.8,3.8 L60.2,3.8', '#ffffff', 1.6, 0.4) + S('M3.8,60.2 L60.2,60.2 L60.2,3.8', '#000000', 1.6, 0.55);
  }
  // ---- shared glyph parts
  var A_BLUE = '#2f5fc0', A_DEEP = '#1a2f6a', K_RED = '#b8302a', K_DEEP = '#5a1410', IRON = '#7c8793', BONE = '#efe6cf';
  function chevron(c, y, col) { return P('M14,' + y + ' L32,' + (y - 9) + ' L50,' + y + ' L50,' + (y + 7) + ' L32,' + (y - 2) + ' L14,' + (y + 7) + ' Z', c.cel(col)); }
  function shield(c, col, edge) { var d = 'M32,10 C40,13 47,13 50,12 C51,30 46,44 32,54 C18,44 13,30 14,12 C17,13 24,13 32,10 Z'; return P(d, c.cel(col), 2.6) + S('M32,14 C39,16 44,16 46.5,15.5 C47,30 43,41 32,49.5 C21,41 17,30 17.5,15.5 C20,16 25,16 32,14 Z', edge, 1.6, 0.9); }
  function sword(x1, y1, x2, y2) { var a = Math.atan2(y2 - y1, x2 - x1), px = Math.cos(a + Math.PI / 2) * 4, py = Math.sin(a + Math.PI / 2) * 4, gx = x1 + (x2 - x1) * 0.28, gy = y1 + (y2 - y1) * 0.28;
    return S('M' + r1(x1) + ',' + r1(y1) + ' L' + r1(x2) + ',' + r1(y2), OL, 6.4) + S('M' + r1(x1) + ',' + r1(y1) + ' L' + r1(x2) + ',' + r1(y2), '#e6ecf2', 3.6) + S('M' + r1(gx - px) + ',' + r1(gy - py) + ' L' + r1(gx + px) + ',' + r1(gy + py), OL, 5.2) + S('M' + r1(gx - px) + ',' + r1(gy - py) + ' L' + r1(gx + px) + ',' + r1(gy + py), GOLD, 3); }
  function crown(c, y, col) { return P('M17,' + (y + 10) + ' L15,' + y + ' L24,' + (y + 5) + ' L32,' + (y - 4) + ' L40,' + (y + 5) + ' L49,' + y + ' L47,' + (y + 10) + ' Z', c.cel(col || GOLD)) + C(32, y - 4, 2.4, '#ffffff', 1.2) + C(15, y, 1.8, lt(GOLD, 0.4), 1) + C(49, y, 1.8, lt(GOLD, 0.4), 1); }
  function fang(c, x, y, h, flip) { var s = flip ? -1 : 1; return P('M' + (x - 5 * s) + ',' + y + ' C' + (x - 4 * s) + ',' + (y + h * 0.6) + ' ' + x + ',' + (y + h * 0.9) + ' ' + (x + 2 * s) + ',' + (y + h) + ' C' + (x + 3 * s) + ',' + (y + h * 0.6) + ' ' + (x + 5 * s) + ',' + (y + h * 0.3) + ' ' + (x + 5 * s) + ',' + y + ' Z', c.cel(BONE)); }
  function tusk(c, flip) { var s = flip ? -1 : 1, x = 32 + 13 * s; return P('M' + x + ',46 C' + (x - 12 * s) + ',44 ' + (x - 15 * s) + ',30 ' + (x - 6 * s) + ',14 C' + (x - 9 * s) + ',28 ' + (x - 6 * s) + ',38 ' + (x + 3 * s) + ',40 Z', c.cel(BONE)); }
  function skull(c, y) { return P('M20,' + (y + 4) + ' C20,' + (y - 12) + ' 44,' + (y - 12) + ' 44,' + (y + 4) + ' C44,' + (y + 10) + ' 40,' + (y + 12) + ' 39,' + (y + 16) + ' L25,' + (y + 16) + ' C24,' + (y + 12) + ' 20,' + (y + 10) + ' 20,' + (y + 4) + ' Z', c.cel(BONE)) +
      P('M24,' + (y + 2) + ' C24,' + (y - 3) + ' 30,' + (y - 3) + ' 30,' + (y + 2) + ' C30,' + (y + 6) + ' 24,' + (y + 6) + ' 24,' + (y + 2) + ' Z', '#2a0e0a', 0) + P('M34,' + (y + 2) + ' C34,' + (y - 3) + ' 40,' + (y - 3) + ' 40,' + (y + 2) + ' C40,' + (y + 6) + ' 34,' + (y + 6) + ' 34,' + (y + 2) + ' Z', '#2a0e0a', 0) +
      S('M28,' + (y + 12) + ' L28,' + (y + 16) + ' M32,' + (y + 11) + ' L32,' + (y + 16) + ' M36,' + (y + 12) + ' L36,' + (y + 16), OL, 1.6); }
  function axe(c) { return S('M22,52 L42,14', OL, 6.6) + S('M22,52 L42,14', '#8a5a30', 3.6) + P('M36,10 C46,6 54,12 54,22 C50,20 45,21 41,24 Z', c.cel(IRON), 2.2) + P('M38,20 C32,26 26,24 24,18 C28,19 32,17 36,13 Z', c.cel(IRON), 2); }
  function lantern(c) { return S('M32,8 L32,14', OL, 3) + C(32, 8, 3, 'none', 1.8) + P('M22,18 L42,18 L40,46 L24,46 Z', c.cel(GOLD), 2.4) + P('M26,22 L38,22 L36.5,42 L27.5,42 Z', c.rg([[0, '#fffbe0'], [0.5, '#ffd46a'], [1, '#e08a1a']]), 1.4) + P('M20,46 L44,46 L42,51 L22,51 Z', c.cel(dk(GOLD, 0.15)), 2) + P('M20,14 L44,14 L42,18 L22,18 Z', c.cel(dk(GOLD, 0.15)), 2); }
  function fist(c) { return P('M20,30 C20,22 24,20 27,21 C27,17 31,16 33,19 C34,15 39,15 40,19 C42,17 46,18 46,22 L46,38 C46,46 40,52 32,52 C24,52 20,46 20,38 Z', c.cel('#8a6a4a'), 2.4) + S('M27,22 L27,31 M33,20 L33,31 M40,20 L40,31', OL, 1.6, 0.8) + P('M20,30 C16,30 15,36 19,38 L24,37 Z', c.cel('#8a6a4a'), 2); }
  // ---- the ranks: [ground (light, dark), gold ring or not, glyph]
  var RANKS = {
    alliance: [
      function (c) { return G(chevron(c, 36, A_BLUE), 'translate(32 34) scale(1.35) translate(-32 -34)'); }, // one bold chevron: it has to read at 24 px
      function (c) { return chevron(c, 30, A_BLUE) + chevron(c, 42, A_BLUE); },
      function (c) { return chevron(c, 26, A_BLUE) + chevron(c, 36, A_BLUE) + chevron(c, 46, GOLD); },
      function (c) { return shield(c, A_BLUE, GOLD); },
      function (c) { return shield(c, A_BLUE, GOLD) + G(chevron(c, 32, GOLD), 'translate(32 0) scale(0.6 1) translate(-32 0)'); },
      function (c) { return lantern(c); },
      function (c) { return shield(c, A_DEEP, GOLD) + sword(18, 50, 46, 16) + sword(46, 50, 18, 16); },
      function (c) { return shield(c, A_BLUE, GOLD) + G(crown(c, 26), 'translate(32 30) scale(0.75) translate(-32 -30)') + sword(32, 50, 32, 38); },
    ],
    horde: [
      function (c) { return G(fang(c, 32, 14, 34), 'translate(32 30) scale(1.7 1) translate(-32 -30)'); }, // one broad fang
      function (c) { return P('M32,12 C40,26 44,34 44,40 C44,47 38,52 32,52 C26,52 20,47 20,40 C20,34 24,26 32,12 Z', c.cel(K_RED), 2.4) + S('M27,38 C27,33 29,29 31,26', '#ffffff', 2, 0.5); },
      function (c) { return fang(c, 24, 14, 34) + fang(c, 40, 14, 34, true); },
      function (c) { return tusk(c) + tusk(c, true); },
      function (c) { return P('M14,30 C14,16 50,16 50,30 L50,38 L43,38 L41,32 L23,32 L21,38 L14,38 Z', c.cel(IRON), 2.6) + P('M20,24 L44,24 L44,28 L20,28 Z', c.cel(dk(IRON, 0.2)), 1.6) + tusk(c) + tusk(c, true); },
      function (c) { return axe(c); },
      function (c) { return skull(c, 26); },
      function (c) { return fist(c) + G(crown(c, 12, '#c8a040'), 'translate(32 14) scale(0.7) translate(-32 -14)'); },
    ],
  };
  var BG = { alliance: [['#3a4a7a', '#0c1024'], ['#4a5ea0', '#101634']], horde: [['#6a2a22', '#1a0806'], ['#8a3428', '#240a08']] };
  function rank(f, n) { return function (c) { var hi = n >= 5; return frame(c, BG[f][hi ? 1 : 0], RANKS[f][n - 1](c), hi ? GOLD : null); }; }
  // the looks' icons: a tabard and a war banner in the faction's colours
  function tabard(f) { return function (c) { var col = f === 'alliance' ? A_BLUE : K_RED, trim = f === 'alliance' ? GOLD : BONE;
    return frame(c, ['#3a3440', '#0e0c12'], P('M18,10 L46,10 L50,22 L44,24 L44,54 L20,54 L20,24 L14,22 Z', c.cel(col), 2.4) + S('M20,50 L44,50', trim, 2.4) + (f === 'alliance' ? G(shield(c, A_DEEP, GOLD), 'translate(32 34) scale(0.42) translate(-32 -32)') : G(skull(c, 26), 'translate(32 34) scale(0.5) translate(-32 -32)'))); }; }
  function banner(f) { return function (c) { var col = f === 'alliance' ? A_BLUE : K_RED, trim = f === 'alliance' ? GOLD : BONE;
    return frame(c, ['#3a3440', '#0e0c12'], S('M18,8 L18,58', OL, 5.4) + S('M18,8 L18,58', '#8a5a30', 3) + C(18, 7, 3, GOLD, 1.6) + P('M20,12 L48,12 L48,40 L34,34 L20,40 Z', c.cel(col), 2.4) + S('M23,16 L45,16', trim, 2) +
      (f === 'alliance' ? G(crown(c, 22), 'translate(34 24) scale(0.55) translate(-32 -24)') : G(fang(c, 30, 18, 14) + fang(c, 38, 18, 14, true), 'translate(0 0)'))); }; }
  var NEW = {};
  ['alliance', 'horde'].forEach(function (f) { for (var n = 1; n <= 8; n++) NEW['honor_' + f + '_' + n] = rank(f, n); NEW['honor_tabard_' + f] = tabard(f); NEW['honor_banner_' + f] = banner(f); });
  var has = function (o, k) { return Object.prototype.hasOwnProperty.call(o, k); };
  var base = ART.icon;
  function make(k) { try { var c = new Ctx(); return c.svg(NEW[k](c)); } catch (e) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><rect width="64" height="64" fill="#222"/></svg>'; } }
  ART.icon = function (k) { if (has(NEW, k)) return make(k); return base ? base.apply(this, arguments) : make('honor_alliance_1'); };
  ART.keys = ART.keys || {};
  var list = Array.isArray(ART.keys.icons) ? ART.keys.icons : (ART.keys.icons = []);
  Object.keys(NEW).forEach(function (k) { if (list.indexOf(k) < 0) list.push(k); });
})(typeof window !== 'undefined' ? window : this);
