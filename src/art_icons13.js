/* art_icons13.js - Artisan-tier profession icons for Realm of Loner, plus the battleground activity icon (#52) (42 keys for the level 45-60 tier: duskiron and
 * moonsilver ore and bars, deepstone, four herbs, hardhide leather, duskweave cloth and bolt, four fish, a marbled haunch,
 * nine dishes, three flasks, a whetstone, an armour kit, two bags and the nine skill-300 profession keepsakes), plus 6
 * gathering nodes (ART.node: duskiron and moonsilver veins and the four herbs; 96x96, transparent, same style as the
 * art_icons3.js / art_icons11.js nodes; other keys fall through to the previous ART.node, keys appended to ART.keys.nodes).
 * Loads AFTER art.js, art_icons2.js .. art_icons12.js and art_mounts.js and EXTENDS window.ART: ART.icon handles the keys
 * below and falls through to the previous ART.icon for every other key (prototype keys included). Keys are appended to
 * ART.keys.icons. Self-contained: the helpers of the earlier packs are private, so the few needed here are copied (same
 * maths, same look). Never throws. Style matches the earlier material, food and profession icons: 64x64, tinted radial
 * background, bold glyph, #1a1009 outline, vignette + bevel frame, no text, no filters. Dishes that give a buff carry a
 * soft warm glow; keepsakes sit on a profession-tinted ground inside a thin gold ring. Gradient ids use the prefix
 * iW<counter>_ so they never collide.
 */
(function (root) {
  'use strict';
  var W = root || {};
  var ART = W.ART = W.ART || {};

  /* ================= helpers (copied from art.js / art_icons3.js / art_icons11.js) ================= */
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

  function Ctx() { this.u = 'iW' + (++UID).toString(36); this.k = 0; this.defs = []; this.cache = {}; }
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
  function item(c, glyph) { return iconWrap(c, ITEM_BG, glyph); }

  /* ore chunk: faceted rock (rock colour) with metal bits drawn by bits (clipped to the rock) */
  function oreChunk(c, rock, seed, bits) {
    var d = pl(lump(32, 37, 24, 18, seed, 9, 0.24, 0.2)) + 'Z', cl = c.clip(d);
    return E(32, 55, 22, 4, '#000', 0, 0.35) + P(d, c.cel(rock), 2.4) +
      CG(F('M0,0 L64,0 L64,24 L38,28 L22,42 L0,48 Z', lt(rock, 0.2), 0.55) + F('M38,28 L64,24 L64,64 L30,64 L33,46 Z', dk(rock, 0.32), 0.75) +
        S('M38,28 L22,42 M38,28 L33,46 M38,28 L44,16', dk(rock, 0.55), 1.3, 0.8) + (bits || ''), cl);
  }
  /* metal nugget: irregular blob with metal gradient + a white point highlight */
  function nug(c, x, y, r, cols, seed) {
    var d = pl(lump(x, y, r, r * 0.8, seed, 6, 0.4)) + 'Z';
    return P(d, c.lg(cols, 0.2, 0, 0.8, 1), 1.5) + C(x - r * 0.3, y - r * 0.3, Math.max(0.8, r * 0.26), '#ffffff', 0, 0.85);
  }
  /* tapered prism in a fixed 3/4 view: bottom half-extents (bx,bz), top half-extents (tx,tz), height h */
  function pj(ox, oy, X, Y, Z) { return [ox + X * 0.94 - Z * 0.55, oy + X * 0.3 + Z * 0.45 - Y]; }
  function prism(c, ox, oy, bx, bz, tx, tz, h, col, sw, deco) {
    var p = function (X, Y, Z) { return pj(ox, oy, X, Y, Z); };
    var front = [p(-bx, 0, bz), p(bx, 0, bz), p(tx, h, tz), p(-tx, h, tz)];
    var side = [p(bx, 0, bz), p(bx, 0, -bz), p(tx, h, -tz), p(tx, h, tz)];
    var top = [p(-tx, h, -tz), p(tx, h, -tz), p(tx, h, tz), p(-tx, h, tz)];
    return P(pl(front) + 'Z', c.lg([lt(col, 0.1), col, dk(col, 0.2)], 0, 0, 1, 0), sw) + P(pl(side) + 'Z', c.lg([dk(col, 0.2), dk(col, 0.42)], 0, 0, 1, 0), sw) +
      P(pl(top) + 'Z', c.lg([lt(col, 0.55), lt(col, 0.25)], 0, 0, 1, 1), sw) + (deco ? deco(p) : '');
  }
  function seg(a, b) { return 'M' + r1(a[0]) + ',' + r1(a[1]) + ' L' + r1(b[0]) + ',' + r1(b[1]); }
  /* a cast ingot (same shape as the copper/silver bars); mark(p) adds stamps or glow on top */
  function bar(c, col, mark) {
    var one = function (ox, oy) {
      return prism(c, ox, oy, 19, 8, 14, 5, 9, col, 1.8, function (p) {
        return S(seg(p(-13, 9, 4.2), p(12, 9, 4.2)), '#ffffff', 1.4, 0.75) + S(seg(p(-18, 0.6, 7.8), p(18, 0.6, 7.8)), dk(col, 0.5), 1.2, 0.6) + (mark ? mark(p) : '');
      });
    };
    return E(32, 55, 28, 4.5, '#000', 0, 0.35) + G(one(32, 44), 'matrix(1.3,0,0,1.3,-9.6,-12.4)');
  }
  function cork(c, x, y, w, h) { return P('M' + r1(x - w / 2) + ',' + r1(y + h) + ' L' + r1(x - w / 2 + 1) + ',' + r1(y) + ' L' + r1(x + w / 2 - 1) + ',' + r1(y) + ' L' + r1(x + w / 2) + ',' + r1(y + h) + ' Z', c.cel('#a8763e'), 1.8) + S('M' + r1(x - w / 2 + 2) + ',' + r1(y + 2) + ' L' + r1(x - w / 2 + 2) + ',' + r1(y + h - 1), '#e0b070', 1, 0.8); }
  /* herb parts */
  function stem(d, col, w, o) { return S(d, OL, w + 2.4, o) + S(d, col, w, o); }
  function blade(c, x, y, a, s, col, w) {
    w = w || 4;
    return G(P('M0,0 C' + w + ',-6 ' + w + ',-18 0,-26 C-' + w + ',-18 -' + w + ',-6 0,0 Z', c.lg([lt(col, 0.35), col, dk(col, 0.35)], 0, 0, 1, 0), 1.5) + S('M0,-1.5 L0,-22', dk(col, 0.45), 0.9, 0.8), tr(x, y, a, s));
  }
  /* serrated leaf pointing up from the origin */
  function sawLeaf(len, w, teeth) {
    var L = [], Rr = [], i;
    for (i = 1; i <= teeth; i++) {
      var t = i / (teeth + 1), wy = Math.sin(t * Math.PI) * w;
      L.push([-wy * 1.15, -len * t + len * 0.04]); L.push([-wy * 0.7, -len * t - len * 0.05]);
      Rr.push([wy * 1.15, -len * t + len * 0.04]); Rr.push([wy * 0.7, -len * t - len * 0.05]);
    }
    return pl([[0, 0]].concat(L, [[0, -len]], Rr.reverse())) + 'Z';
  }
  /* cloth bolt: a thick cylinder of cloth, spiral end facing the viewer, tail hanging off the front */
  function clothBolt(c, col, band, tex) {
    var body = 'M14,22 L42,14 C50,12 56,22 56,32 C56,42 50,50 44,48 L16,56 Z';
    var cl = c.clip(body);
    return E(32, 57, 24, 4, '#000', 0, 0.35) +
      P('M20,52 C22,58 30,60 38,58 L40,48 Z', c.cel(dk(col, 0.08)), 2) +
      P(body, c.lg([lt(col, 0.3), col, dk(col, 0.3)], 0, 0, 0.3, 1), 2.4) +
      CG((tex || '') + S('M14,30 L42,22 M14,38 L43,30 M15,46 L44,38', dk(col, 0.25), 1.2, 0.6) +
        R(26, 10, 7, 50, band, 0) + S('M26,10 L26,60 M33,10 L33,60', OL, 1.4), cl) +
      E(16, 39, 7, 17, c.lg([lt(col, 0.25), dk(col, 0.1)], 0, 0, 1, 1), 2.4, null, -15) +
      '<path d="M16,39 m-1.5,0 a1.5,3 -15 1 1 3,0 a3.2,6.5 -15 1 1 -6,0 a5,11 -15 1 1 9,0" fill="none" stroke="' + dk(col, 0.4) + '" stroke-width="1.2" stroke-linecap="round"/>' +
      C(16, 39, 1.8, dk(col, 0.55), 0) + S('M18,24 C13,28 11,36 12,44', '#ffffff', 1.4, 0.5);
  }
  /* a tanned hide sheet (sheet path) rolled up into a fat roll in front, y0..y1 is the roll height; the spiral end on the
   * right shows how many layers thick it is. Same family as art_icons3 leatherRoll, scaled up for heavier grades. */
  function hideRoll(c, col, sheet, y0, y1, layers) {
    var h = y1 - y0, ry = h / 2, cy = y0 + ry, rx = ry * 0.5, x0 = 10, x1 = 52;
    var body = D`M${x0},${y0} L${x1},${y0} L${x1},${y1} L${x0},${y1} Z`, sp = '';
    for (var i = 1; i <= layers; i++) { var k = i / (layers + 0.6); sp += '<ellipse cx="' + r1(x1) + '" cy="' + r1(cy) + '" rx="' + r1(rx * k) + '" ry="' + r1(ry * k) + '" fill="none" stroke="' + dk(col, 0.55) + '" stroke-width="1.3"/>'; }
    return E(32, y1 + 2, 26, 4, '#000', 0, 0.35) +
      P(sheet, c.cel(col), 2.4) + CG(F('M34,0 L64,0 L64,' + y0 + ' L40,' + y0 + ' C44,' + (y0 - 10) + ' 40,10 34,0 Z', '#000', 0.2) +
        S('M12,' + (y0 - 12) + ' C22,' + (y0 - 8) + ' 30,' + (y0 - 13) + ' 38,' + (y0 - 9) + ' M16,' + (y0 - 5) + ' C26,' + (y0 - 3) + ' 38,' + (y0 - 7) + ' 48,' + (y0 - 4), dk(col, 0.3), 1, 0.6), c.clip(sheet)) +
      E(x0, cy, rx, ry, c.cel(dk(col, 0.15)), 2.4) +
      P(body, c.lg([[0, lt(col, 0.35)], [0.35, col], [0.75, dk(col, 0.15)], [1, dk(col, 0.42)]], 0, 0, 0, 1), 2.4) +
      CG(S(D`M${x0},${y0 + h * 0.2} L${x1},${y0 + h * 0.2}`, '#ffffff', 1.4, 0.4), c.clip(body)) +
      E(x1, cy, rx, ry, c.lg([lt(col, 0.2), dk(col, 0.1)], 0, 0, 1, 1), 2.4) + sp + C(x1, cy, 1.2, dk(col, 0.6), 0);
  }
  /* tiny six-arm rime crystal */
  function flake(x, y, r) {
    var d = '';
    for (var i = 0; i < 3; i++) { var a = i * Math.PI / 3 + Math.PI / 6; d += D`M${x - Math.cos(a) * r},${y - Math.sin(a) * r} L${x + Math.cos(a) * r},${y + Math.sin(a) * r} `; }
    return S(d, '#2a4a6a', 2.2, 0.8) + S(d, '#ffffff', 1.1);
  }
  /* tapering root from a (wide, width w) to b (tip), bowed by bend */
  function taper(ax, ay, bx, by, w, bend) {
    var dx = bx - ax, dy = by - ay, L = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / L, ny = dx / L, mx = (ax + bx) / 2 + nx * bend, my = (ay + by) / 2 + ny * bend;
    return D`M${ax + nx * w / 2},${ay + ny * w / 2} Q${mx + nx * w * 0.42},${my + ny * w * 0.42} ${bx},${by} Q${mx - nx * w * 0.42},${my - ny * w * 0.42} ${ax - nx * w / 2},${ay - ny * w / 2} Z`;
  }

  /* ---- more parts (copied from art_icons3.js / art_icons12.js) and a few new ones ---- */
  var WARM = '#ffb048';
  /* a dish that gives a buff: the item frame with a soft warm glow behind the glyph */
  function buff(c, glyph, col) { return iconWrap(c, ITEM_BG, glow(c, 32, 36, 30, col || WARM, 0.42) + glyph); }
  function shadow(cx, cy, rx, ry) { return E(cx, cy, rx, ry || 3.6, '#000', 0, 0.38); }
  function glass(c) { return c.lg([[0, '#f2fbff', 0.9], [0.45, '#b8d4e4', 0.55], [1, '#6a8aa0', 0.7]], 0, 0, 1, 0); }
  function bubble(x, y, r) { return '<circle cx="' + r1(x) + '" cy="' + r1(y) + '" r="' + r1(r) + '" fill="#ffffff" fill-opacity="0.25" stroke="#ffffff" stroke-width="0.9" stroke-opacity="0.8"/>'; }
  function ringO(cx, cy, rx, ry, col, w, o) { return '<ellipse cx="' + r1(cx) + '" cy="' + r1(cy) + '" rx="' + r1(rx) + '" ry="' + r1(ry) + '" fill="none" stroke="' + col + '" stroke-width="' + r1(w) + '"' + opa(o) + '/>'; }
  /* crescent opening to the right: outer half-ellipse rx,ry round (x,y), inner edge a flatter arc */
  function crescentD(x, y, rx, ry) { return D`M${x},${y - ry} A${rx},${ry} 0 0 0 ${x},${y + ry} A${rx * 1.3},${ry * 1.3} 0 0 1 ${x},${y - ry} Z`; }
  var GOLDS = ['#fff2b8', '#e0a830', '#8a5a10'];
  /* a skill-300 keepsake: profession-tinted ground, a thin gold ring with four studs behind the glyph */
  function keep(c, bg, glyph) {
    var dm = function (x, y) { return P(D`M${x},${y - 2.4} L${x + 1.7},${y} L${x},${y + 2.4} L${x - 1.7},${y} Z`, '#e8c050', 0.9); };
    return iconWrap(c, bg, ringO(32, 32, 26.5, 26.5, '#e8c050', 1.3, 0.5) + dm(32, 5.6) + dm(58.4, 32) + dm(32, 58.4) + dm(5.6, 32) + glyph);
  }
  /* duskiron metal (steel with a dusk-violet sheen) and moonsilver */
  var DUSK = ['#f0ecff', '#8c86b8', '#363452'];
  var MOON = ['#ffffff', '#d4e4f6', '#7a92b8'];
  /* a pale six-sided moonsilver crystal growing up from (x,y) */
  function moonCrystal(c, x, y, a, s) {
    return G(P('M0,3 L-4.4,-3 L-3.2,-17 L0,-23 L3.2,-17 L4.4,-3 Z', c.lg(['#ffffff', '#d8e8fa', '#8aa4cc'], 0, 0, 1, 0), 1.6) +
      F('M0,3 L0,-23 L-3.2,-17 L-4.4,-3 Z', '#ffffff', 0.5) + S('M0,1 L0,-21', '#a8c0e0', 0.8, 0.8), tr(x, y, a, s));
  }

  /* ================= fish (side view, nose on the left at x=L, tail base at x=T, centred on y=0) ================= */
  function fishGeo(o) {
    var L = o.L, T = o.T, px = o.px, hu = o.hu, hd = o.hd, ped = o.ped;
    var top = function (x) {
      if (x <= px) { var t = (px - x) / (px - L); return -hu * Math.sqrt(Math.max(0, 1 - t * t)); }
      var u = Math.min(1, (x - px) / (T - px)), s = u * u * (3 - 2 * u); return -(hu + (ped - hu) * s);
    };
    var bot = function (x) {
      if (x <= px) { var t = (px - x) / (px - L); return hd * Math.sqrt(Math.max(0, 1 - t * t)); }
      var u = Math.min(1, (x - px) / (T - px)), s = u * u * (3 - 2 * u); return hd + (ped - hd) * s;
    };
    return { top: top, bot: bot };
  }
  function fishBodyD(o) {
    var L = o.L, T = o.T, px = o.px, hu = o.hu, hd = o.hd, ped = o.ped, my = o.my || 0;
    var aL = (px - L) * 0.52, aT = (T - px) * 0.5, sx = L + (px - L) * (o.sx || 0.04), bl = o.blunt || 0.78;
    return D`M${L},${my} C${sx},${-hu * bl} ${px - aL},${-hu} ${px},${-hu} C${px + aT},${-hu} ${T - 3},${-ped * 1.3} ${T},${-ped} L${T},${ped} C${T - 3},${ped * 1.3} ${px + aT},${hd} ${px},${hd} C${px - aL},${hd} ${sx},${hd * bl} ${L},${my} Z`;
  }
  function tailD(o) {
    var T = o.T - 2, p = o.ped + 0.4, w = o.tw, h = o.th;
    switch (o.tail) {
      case 'round': return D`M${T},${-p} C${T + w * 0.55},${-h} ${T + w},${-h * 0.75} ${T + w},${0} C${T + w},${h * 0.75} ${T + w * 0.55},${h} ${T},${p} Z`;
      case 'square': return D`M${T},${-p} C${T + w * 0.4},${-p} ${T + w * 0.8},${-h * 0.8} ${T + w},${-h} Q${T + w * 0.8},${0} ${T + w},${h} C${T + w * 0.8},${h * 0.8} ${T + w * 0.4},${p} ${T},${p} Z`;
      case 'crescent': return D`M${T},${-p} C${T + w * 0.35},${-p} ${T + w * 0.7},${-h * 0.6} ${T + w * 1.05},${-h} C${T + w * 0.65},${-h * 0.35} ${T + w * 0.4},${-p * 0.5} ${T + w * 0.38},${0} C${T + w * 0.4},${p * 0.5} ${T + w * 0.65},${h * 0.35} ${T + w * 1.05},${h} C${T + w * 0.7},${h * 0.6} ${T + w * 0.35},${p} ${T},${p} Z`;
      default: return D`M${T},${-p} C${T + w * 0.45},${-p * 1.1} ${T + w * 0.8},${-h * 0.75} ${T + w},${-h} C${T + w * 0.62},${-h * 0.35} ${T + w * 0.58},${h * 0.35} ${T + w},${h} C${T + w * 0.8},${h * 0.75} ${T + w * 0.45},${p * 1.1} ${T},${p} Z`;
    }
  }
  /* a fin on the back (side -1) or belly (side 1) from x0 to x1, h tall; kind 'spiky' gives a row of spines */
  function finD(g, x0, x1, h, side, kind, peak) {
    var edge = side < 0 ? g.top : g.bot, ins = function (x) { return edge(x) - side * 2.6; };
    if (kind === 'spiky') {
      var n = 7, pts = [[x0, ins(x0)]];
      for (var i = 0; i <= n; i++) { var t = i / n, x = x0 + (x1 - x0) * t; pts.push([x, edge(x) + side * h * (1 - 0.45 * t) * (i % 2 ? 0.55 : 1)]); }
      pts.push([x1, ins(x1)]);
      return pl(pts) + 'Z';
    }
    var xt = x0 + (x1 - x0) * (peak == null ? 0.4 : peak), yt = edge(xt) + side * h, e1 = edge(x1);
    return D`M${x0},${ins(x0)} C${x0},${edge(x0) + side * h * 0.6} ${xt - (xt - x0) * 0.45},${yt} ${xt},${yt} C${xt + (x1 - xt) * 0.55},${yt} ${x1},${e1 + side * h * 0.35} ${x1},${ins(x1)} Z`;
  }
  function finFill(c, col, side) { return c.lg([lt(col, 0.25), col, dk(col, 0.3)], 0, side < 0 ? 0 : 1, 0, side < 0 ? 1 : 0); }
  /* fin rays: short strokes from the base outwards, clipped to the fin */
  function finRays(c, d, x0, x1, side, col, n) {
    var o = '';
    n = n || 4;
    for (var i = 0; i < n; i++) { var x = x0 + (x1 - x0) * (i + 0.6) / n; o += D`M${x},${-side * 30} L${x + 3},${side * 30} `; }
    return CG(S(o, col, 0.9, 0.6), c.clip(d));
  }
  /* o: L,T,px,hu,hd,ped (body), tail,tw,th (tail), back,belly,fin (colours), fins [[x0,x1,h,side,kind,col,peak]],
   * pat(c,g) (drawn clipped to the body), pec (pectoral fin), eye [x,y,r,iris], top(c,g) (drawn last) */
  function fish(c, o) {
    var g = fishGeo(o), body = fishBodyD(o), cl = c.clip(body), fc = o.fin || lt(o.back, 0.2), behind = '';
    (o.fins || []).forEach(function (f) {
      var d = finD(g, f[0], f[1], f[2], f[3], f[4], f[6]), col = f[5] || fc;
      behind += P(d, finFill(c, col, f[3]), 1.6) + (f[4] === 'spiky' ? '' : finRays(c, d, f[0], f[1], f[3], dk(col, 0.4)));
    });
    var tl = tailD(o), tc = o.tailCol || fc;
    var gx = o.L + (o.px - o.L) * (o.gill || 0.6);
    var ex = o.eye ? o.eye[0] : o.L + (o.px - o.L) * 0.3, ey = o.eye ? o.eye[1] : -o.hu * 0.2, er = o.eye ? o.eye[2] : 2.4, iris = (o.eye && o.eye[3]) || '#f4ecc8';
    var pec = o.pec === false ? '' : (function () {
      var y = o.hd * 0.28, x = gx + 2, s = o.pecS || 1;
      return P(D`M${x},${y} C${x + 5 * s},${y - 2 * s} ${x + 11 * s},${y + 0.5 * s} ${x + 12 * s},${y + 4.5 * s} C${x + 7 * s},${y + 5.5 * s} ${x + 3 * s},${y + 3.5 * s} ${x},${y} Z`, finFill(c, o.pecCol || fc, 1), 1.3);
    })();
    return behind +
      P(tl, c.lg([lt(tc, 0.2), tc, dk(tc, 0.35)], 0, 0, 1, 0), 1.8) + CG(S(D`M${o.T},0 L${o.T + o.tw},0 M${o.T},0 L${o.T + o.tw},${-o.th * 0.6} M${o.T},0 L${o.T + o.tw},${o.th * 0.6}`, dk(tc, 0.4), 0.9, 0.6), c.clip(tl)) +
      P(body, c.lg([[0, lt(o.back, 0.12)], [0.42, o.back], [0.6, o.belly], [1, dk(o.belly, 0.18)]], 0, 0, 0, 1), 0) +
      CG((o.pat ? o.pat(c, g) : '') +
        S(D`M${o.L + 4},${-o.hu * 0.5} Q${o.px},${-o.hu * 1.02} ${o.T - 5},${-o.ped - 1.2}`, '#ffffff', 1.3, o.shine == null ? 0.45 : o.shine) +
        S(D`M${gx},${g.top(gx) * 0.8} Q${gx + 4.5},0 ${gx},${g.bot(gx) * 0.8}`, dk(o.back, 0.5), 1.4, 0.85), cl) +
      P(body, 'none', 2.2) + pec +
      C(ex, ey, er, iris, 1.2) + C(ex + er * 0.12, ey, er * 0.52, OL, 0) + C(ex - er * 0.25, ey - er * 0.3, Math.max(0.5, er * 0.25), '#ffffff', 0) +
      S(D`M${o.L + 0.4},${(o.my || 0) + 0.6} L${o.L + 4},${(o.my || 0) + 1.6}`, dk(o.back, 0.6), 1.1, 0.9) +
      (o.top ? o.top(c, g) : '');
  }
  /* scale arcs facing the tail over a box */
  function scaleArcs(x0, x1, y0, y1, st, col, w, o) {
    var d = '', row = 0;
    for (var y = y0; y <= y1; y += st * 0.8, row++) for (var x = x0 + (row % 2 ? st / 2 : 0); x <= x1; x += st) d += D`M${x},${y - st * 0.42} Q${x + st * 0.45},${y} ${x},${y + st * 0.42} `;
    return S(d, col, w || 0.8, o == null ? 0.6 : o);
  }
  function dots(seed, n, x0, x1, y0, y1, r0, r1_, col, o) {
    var r = rng(seed), s = '';
    for (var i = 0; i < n; i++) s += C(x0 + r() * (x1 - x0), y0 + r() * (y1 - y0), r0 + r() * (r1_ - r0), col, 0, o);
    return s;
  }
  function whisker(d, col, w) { return S(d, OL, (w || 1.2) + 1.8) + S(d, col, w || 1.2); }

  /* ================= meat ================= */
  /* sweep a top-face path down by th to give it a side; returns outline + side fill, the top is drawn by the caller */
  function extrude(d, th, side, sw, n) {
    var o1 = '', o2 = '';
    n = n || Math.max(4, Math.ceil(th * 1.5));
    for (var i = n; i >= 0; i--) { var tf = 'translate(0,' + r1(th * i / n) + ')'; o1 += G(S(d, OL, (sw || 2.4) * 2), tf); o2 += G(F(d, side), tf); }
    return o1 + o2;
  }
  function slab(c, d, th, topFill, side, extra) {
    return extrude(d, th, side) + P(d, topFill, 2.2) + (extra ? CG(extra, c.clip(d)) + P(d, 'none', 2.2) : '');
  }

  /* ================= dishware ================= */
  function plate(c, cx, cy, rx, ry, col, rim) {
    return shadow(cx, cy + ry + 2.5, rx * 0.92, 3.6) + E(cx, cy + 2.6, rx, ry, dk(col, 0.45), 2.2) +
      E(cx, cy, rx, ry, c.lg([lt(col, 0.35), col, dk(col, 0.12)], 0, 0, 0, 1), 2.2) +
      E(cx, cy + ry * 0.06, rx * 0.74, ry * 0.68, c.lg([dk(col, 0.14), lt(col, 0.12)], 0, 0, 0, 1), 0) +
      (rim ? '<ellipse cx="' + r1(cx) + '" cy="' + r1(cy) + '" rx="' + r1(rx * 0.87) + '" ry="' + r1(ry * 0.84) + '" fill="none" stroke="' + rim + '" stroke-width="1.4"/>' : '') +
      S(D`M${cx - rx * 0.8},${cy - ry * 0.35} Q${cx - rx * 0.4},${cy - ry * 0.95} ${cx + rx * 0.1},${cy - ry * 0.96}`, '#ffffff', 1.2, 0.55);
  }
  /* bowl: rim ellipse centred at (cx,ty), depth dep; soup is the surface fill, inner(cl) adds things floating in it */
  function bowl(c, cx, ty, rx, ry, dep, col, soup, inner, foot) {
    var body = D`M${cx - rx},${ty} C${cx - rx},${ty + dep * 0.92} ${cx - rx * 0.5},${ty + dep} ${cx},${ty + dep} C${cx + rx * 0.5},${ty + dep} ${cx + rx},${ty + dep * 0.92} ${cx + rx},${ty} Z`;
    var sd = D`M${cx - rx + 2.6},${ty + 0.6} A${rx - 2.6},${ry - 1.8} 0 1 0 ${cx + rx - 2.6},${ty + 0.6} A${rx - 2.6},${ry - 1.8} 0 1 0 ${cx - rx + 2.6},${ty + 0.6} Z`;
    return shadow(cx, ty + dep + 3, rx * 0.85, 3.6) +
      (foot === false ? '' : P(D`M${cx - rx * 0.36},${ty + dep - 3} L${cx - rx * 0.44},${ty + dep + 2.6} L${cx + rx * 0.44},${ty + dep + 2.6} L${cx + rx * 0.36},${ty + dep - 3} Z`, dk(col, 0.3), 2)) +
      P(body, c.lg([[0, lt(col, 0.3)], [0.35, col], [1, dk(col, 0.5)]], 0, 0, 1, 0.3), 2.4) +
      CG(S(D`M${cx - rx + 3.5},${ty + 3} C${cx - rx + 3.5},${ty + dep * 0.6} ${cx - rx * 0.5},${ty + dep * 0.85} ${cx - rx * 0.2},${ty + dep * 0.9}`, '#ffffff', 1.6, 0.4), c.clip(body)) +
      E(cx, ty, rx, ry, c.lg([dk(col, 0.35), lt(col, 0.25)], 0, 0, 0, 1), 2.4) +
      F(sd, soup) + (inner ? CG(inner, c.clip(sd)) : '') + P(sd, 'none', 1.4);
  }
  function steam(x, y, s, o) {
    s = s || 1;
    var d = D`M${x},${y} C${x - 3 * s},${y - 4 * s} ${x + 3 * s},${y - 7 * s} ${x},${y - 11 * s} C${x - 2 * s},${y - 13 * s} ${x},${y - 15 * s} ${x + 1 * s},${y - 16 * s}`;
    return S(d, '#ffffff', 2 * s, o == null ? 0.45 : o);
  }
  function chunk(c, x, y, r, col, seed, sw) {
    var rr = rng(seed), p = [];
    for (var i = 0; i < 6; i++) { var a = i / 6 * Math.PI * 2 + rr() * 0.5, k = 0.75 + rr() * 0.4; p.push([x + Math.cos(a) * r * k, y + Math.sin(a) * r * 0.8 * k]); }
    return P(pl(p) + 'Z', c.cel(col), sw == null ? 1.2 : sw) + C(x - r * 0.3, y - r * 0.3, r * 0.22, '#ffffff', 0, 0.45);
  }
  function lemon(c, x, y, a, s) {
    return G(P('M-7,0 A7,7 0 0 0 7,0 Z', c.cel('#f4d430'), 1.6) + P('M-5.4,0.4 A5.4,5.4 0 0 0 5.4,0.4 Z', '#fff6b0', 0) +
      S('M0,0.6 L0,5 M0,0.6 L-3.6,3.6 M0,0.6 L3.6,3.6', '#e8c020', 0.9), tr(x, y, a, s));
  }
  function sprig(c, x, y, a, s) { return G(blade(c, 0, 0, -30, 0.36, '#5aa040', 4) + blade(c, 0, 0, 10, 0.42, '#4a9038', 4) + blade(c, 0, 0, 48, 0.32, '#5aa040', 4), tr(x, y, a, s)); }
  /* boneless fish fillet centred at 0,0, skin edge on top */
  var FILLET = 'M-19,-1 C-15,-8 4,-9.5 16,-6 C21,-4.4 22,0 19,2.6 C9,7 -9,7.4 -17,3.4 C-19.6,2 -20,0.4 -19,-1 Z';
  function fillet(c, col, skin, extra, tail) {
    var cl = c.clip(FILLET);
    return (tail ? P('M16,-1 C20,-3 24,-7 27,-9 C25,-4 25,3 27,8 C24,6 20,3 16,2 Z', c.lg([lt(tail, 0.2), tail, dk(tail, 0.3)], 0, 0, 1, 0), 1.6) + S('M18,0 L26,-6 M18,0.6 L26,5 M18,0.3 L25.6,-0.4', dk(tail, 0.4), 0.8, 0.6) : '') +
      P(FILLET, c.lg([lt(col, 0.3), col, dk(col, 0.25)], 0, 0, 0, 1), 0) +
      CG((skin ? S('M-19,-3 C-12,-9 6,-10.6 20,-5.4', skin, 3.4) : '') +
        S('M-11,-5 C-13,-1 -12,3 -9,5 M-4,-7 C-6,-2 -5,3 -2,6 M3,-7.4 C1,-2 2,3 5,5.6 M10,-6.6 C8,-2 9,2 12,4.4', dk(col, 0.3), 1, 0.75) +
        S('M-14,-2 C-6,-6 6,-6.4 16,-3', '#ffffff', 1.2, 0.45) + (extra || ''), cl) + P(FILLET, 'none', 2.2);
  }
  function skewer(c, x1, y1, x2, y2, pieces) {
    var o = S2(D`M${x1},${y1} L${x2},${y2}`, '#c8a070', 1.8) + S(D`M${x1},${y1} L${x2},${y2}`, '#f0d8a8', 0.6, 0.8);
    pieces.forEach(function (p) { o += p(x1 + (x2 - x1) * p.t, y1 + (y2 - y1) * p.t); });
    return o;
  }
  function at(t, f) { var g = function (x, y) { return f(x, y); }; g.t = t; return g; }
  function grill(d, ang, step, col, w, n) {
    var s = '';
    n = n || 4;
    for (var i = -n; i <= n; i++) s += D`M${-30 + i * step},${-30} L${30 + i * step},${30} `;
    return G(S(s, col || '#2a1206', w || 1.8, 0.85), 'rotate(' + (ang || 0) + ')');
  }
  function flameD(x, y, s) { return D`M${x},${y} C${x - 4 * s},${y} ${x - 5 * s},${y - 5 * s} ${x - 2 * s},${y - 9 * s} C${x - 1.5 * s},${y - 6 * s} ${x},${y - 6 * s} ${x},${y - 11 * s} C${x + 3 * s},${y - 8 * s} ${x + 5 * s},${y - 5 * s} ${x + 4 * s},${y - 2 * s} C${x + 3.4 * s},${y} ${x + 2 * s},${y} ${x},${y} Z`; }
  function flame(c, x, y, s) { return P(flameD(x, y, s), c.lg(['#fff0a0', '#ffa020', '#e04a10'], 0, 0, 0, 1), 1.4) + F(flameD(x + 0.4 * s, y - 0.6 * s, s * 0.5), '#fff8d0', 0.85); }
  function peppercorns(c, seed, n, x0, x1, y0, y1, r) {
    var rr = rng(seed), s = '';
    for (var i = 0; i < n; i++) { var x = x0 + rr() * (x1 - x0), y = y0 + rr() * (y1 - y0); s += C(x, y, r, c.lg(['#6a5040', '#2a1a12', '#140a06'], 0.2, 0, 0.8, 1), 0.9) + C(x - r * 0.35, y - r * 0.35, r * 0.3, '#c8b098', 0, 0.8); }
    return s;
  }

  var FISH = {
    /* a deep-bodied black bass: spiny back, big jaw, pale ash-grey gill plate with a few ember specks */
    ashgill_bass: {
      L: -22, T: 13, px: -3, hu: 11, hd: 9.5, ped: 3.8, my: 1.6, sx: 0.1, blunt: 0.68, tail: 'square', tw: 10, th: 10, back: '#2a2d33', belly: '#a4a8ae', fin: '#3e4249',
      fins: [[-10, 2, 7.5, -1, 'spiky', '#30333a'], [3, 10, 6, -1, 0, 0, 0.4], [-3, 3, 5, 1], [5, 10, 4.5, 1]], eye: [-15.5, -3.4, 2.6, '#f0b040'], gill: 0.62,
      pat: function () {
        return E(-12.6, 0.6, 4.4, 8.6, '#d4d6d9', 0, 0.85) + S('M-15,-6 C-12,-3 -12,4 -15,7', '#8a8e94', 1, 0.8) +
          dots(47, 14, -8, 12, -8, 2, 0.5, 1, '#6a6e74', 0.7) + S('M-6,-1 C0,-3 6,-2 13,-1', '#14161a', 1.6, 0.6) +
          C(-11.2, 3.4, 0.8, '#ff8a3a', 0, 0.95) + C(-13, -2.4, 0.7, '#ffb060', 0, 0.9) + C(-10.6, -4.6, 0.6, '#ff8a3a', 0, 0.85);
      },
      top: function () { return S('M-22,1.6 L-15.5,3.6', OL, 1.4); }
    },
    /* a slim silver-blue herring, frost-white scale arcs and little rime crystals */
    frostscale_herring: {
      L: -26, T: 16, px: -6, hu: 6.8, hd: 6.4, ped: 2.2, sx: 0.2, blunt: 0.5, tail: 'fork', tw: 10, th: 8.4, back: '#3e6c9e', belly: '#eef6ff', fin: '#a8cce8', shine: 0.8,
      fins: [[-5, 4, 5.5, -1, 0, 0, 0.4], [3, 8, 3.8, 1]], eye: [-20, -1.4, 2.4, '#e8f4ff'], pecS: 0.7,
      pat: function () { return scaleArcs(-18, 14, -6, 6, 3.4, '#ffffff', 0.8, 0.7) + S('M-22,0.6 L15,0.2', '#7ab8f0', 1.2, 0.7) + E(-6, -4, 10, 1.6, '#ffffff', 0, 0.35); },
      top: function () { return flake(-9, -2.6, 1.7) + flake(5, -1.8, 1.5) + flake(-2, 2.8, 1.3); }
    },
    /* a big dark-blue marlin: tall sail fin, pale blue side bars, a long sword bill */
    thunderhead_marlin: {
      L: -20, T: 18, px: -6, hu: 8.4, hd: 7.4, ped: 2, sx: 0.15, blunt: 0.5, tail: 'crescent', tw: 12, th: 14, back: '#162a5e', belly: '#dce6f2', fin: '#2a4892', tailCol: '#1c3270',
      fins: [[-15, 8, 13, -1, 0, '#2c4ea4', 0.18], [0, 6, 6, 1, 0, 0, 0.4]], eye: [-15, -2, 2.4, '#e8eef8'], pecS: 1.2,
      pat: function () { var s = ''; for (var x = -10; x <= 14; x += 4) s += D`M${x},-10 L${x - 1.4},3 `; return S(s, '#6ab8ff', 1.5, 0.75); },
      top: function (c) { return P('M-19.4,-1.8 L-34,-0.4 L-19.4,1.4 Z', c.lg(['#5a7ab8', '#162a5e'], 0, 0, 0, 1), 1.4); }
    },
    /* a koi in deep night blue, long flowing fins, gold star spots and gold barbels */
    starlit_koi: {
      L: -20, T: 12, px: -4, hu: 9.4, hd: 8, ped: 3, sx: 0.15, blunt: 0.75, tail: 'fork', tw: 15, th: 13, back: '#1a2c78', belly: '#4a6ac4', fin: '#6a8ae0', tailCol: '#5a7ad8', shine: 0.7,
      fins: [[-9, 9, 4.5, -1, 0, 0, 0.3], [-3, 4, 7.5, 1, 0, 0, 0.6], [5, 10, 4, 1]], eye: [-14, -2.4, 2.3, '#ffe8a0'], pecS: 1.3,
      pat: function () { return E(-2, -2, 16, 6, '#3a5ad0', 0, 0.35) + koiStars('#ffd84a'); },
      top: function () { return whisker('M-19.6,1.2 C-22,4 -21,7 -18,8.4', '#e8c060', 0.9) + whisker('M-18.6,0.4 C-17,4 -14,5 -12,5.6', '#e8c060', 0.8); }
    },
    /* the koi roasted whole and glazed: the night-blue back keeps its gold stars, the belly turns amber */
    koi_cooked: {
      L: -20, T: 12, px: -4, hu: 9.4, hd: 8, ped: 3, sx: 0.15, blunt: 0.75, tail: 'fork', tw: 13, th: 11, back: '#26347a', belly: '#d08a3a', fin: '#d89a4a', tailCol: '#c8803a', shine: 0.9, pec: false,
      fins: [[-9, 9, 4, -1, 0, 0, 0.3], [-3, 4, 5, 1, 0, 0, 0.6]], eye: [-14, -2.4, 2.1, '#f0e8d8'],
      pat: function () { return koiStars('#ffd84a') + S('M-14,-6 C-6,-9.6 4,-9 12,-5', '#ffe0a0', 1.6, 0.55) + S('M-12,4 C-4,6.4 4,6.4 12,3.6', '#7a3a10', 1.2, 0.5); }
    }
  };
  function koiStars(col) {
    var s = '';
    [[-9, -5, 2.4], [-2, -6.5, 2], [4, -3, 2.6], [-5, 1.5, 1.8], [9, -4.5, 1.6], [1, 3, 1.5], [10, 0.5, 1.3], [-11, 3.6, 1.2]].forEach(function (p) {
      s += F(star(p[0], p[1], 4, p[2], p[2] * 0.4), col) + C(p[0], p[1], p[2] * 0.3, '#fff8d0', 0);
    });
    return s;
  }
  function rawFish(c, k, x, y, a, s) { return G(fish(c, FISH[k]), tr(x, y, a, s)); }

  /* ================= other parts for this pack ================= */
  /* the flask: a tall flat-shouldered bottle in a gold cage (side straps, shoulder band, foot, collar, domed cap),
   * wax drips under the collar and a medallion with the flask's emblem. Taller and squarer than the potions and elixirs */
  var FLASK_B = 'M26,22 L26,17 L38,17 L38,22 C44,23.5 47,27 47,32 L47,53 C47,56.5 45,58 42,58 L22,58 C19,58 17,56.5 17,53 L17,32 C17,27 20,23.5 26,22 Z';
  function flask(c, liq, wax, emblem) {
    var cl = c.clip(FLASK_B), gd = c.lg(GOLDS, 0, 0, 1, 0), gv = c.lg(GOLDS, 0, 0, 0, 1);
    return glow(c, 32, 40, 30, liq[1], 0.5) + E(32, 59.5, 17, 3, '#000', 0, 0.4) +
      F(FLASK_B, glass(c)) +
      CG(R(10, 26.4, 44, 34, c.lg([lt(liq[1], 0.3), liq[1], liq[2]], 0, 0, 1, 0), 0) + E(32, 26.6, 13, 2.2, lt(liq[1], 0.55), 0, 0.9) +
        S('M18,38 C24,35 28,41 34,38 C39,35.6 43,39 47,37', lt(liq[1], 0.45), 1.3, 0.6) + bubble(22, 48, 1.5) + bubble(42, 50, 1.2) + bubble(40, 28.6, 0.9), cl) +
      S(FLASK_B, OL, 2.4) + S('M21,36 L21,51', '#ffffff', 2, 0.75) + S('M28,18 L28,22', '#ffffff', 1.2, 0.7) +
      R(15.2, 32, 3.4, 21, gd, 1.4) + R(45.4, 32, 3.4, 21, gd, 1.4) +
      P('M15.4,30 L48.6,30 L48.6,34 L15.4,34 Z', gv, 1.6) + S('M17,31.4 L47,31.4', '#fff8d8', 0.9, 0.8) +
      P('M15.2,52.6 L48.8,52.6 L48.8,55.6 C48.8,58.4 46.8,60 43.6,60 L20.4,60 C17.2,60 15.2,58.4 15.2,55.6 Z', gv, 1.6) +
      C(32, 43.4, 8, gd, 1.8) + C(32, 43.4, 5.9, c.rg([[0, lt(liq[2], 0.25)], [1, dk(liq[2], 0.45)]]), 1.1) + G(emblem, 'translate(32,43.4)') +
      P('M25.8,19.4 L38.2,19.4 L38.2,21 C38.2,23.8 36.6,23.8 36.4,21 C35.8,22.8 34.6,22.8 34.2,21 L30,21 C29.6,24.2 27.6,24.2 27.4,21 L25.8,21 Z', c.cel(wax), 1.1) +
      R(24.6, 15.2, 14.8, 4.4, gd, 1.6, null, 1.2) +
      P('M26.4,15.6 L37.6,15.6 L36.6,10 C36.4,8.4 34.6,7.6 32,7.6 C29.4,7.6 27.6,8.4 27.4,10 Z', gd, 1.6) + S('M29,14 L28.8,10.4', '#fff8d8', 1, 0.8) +
      C(32, 5.8, 2.2, c.cel('#e8b840'), 1.3);
  }
  /* a bag with a turned-over cuff, a drawstring and two tasselled cords */
  function bag2(c, col, cuff, tie, extra, cuffDeco) {
    var b = 'M19,27 C8,32 6,50 14,56 C20,61 44,61 50,56 C58,50 56,32 45,27 Z';
    var cf = 'M17,16 C22,14 42,14 47,16 L46,27 C40,30 24,30 18,27 Z';
    var tass = function (x, y) { return P(D`M${x - 1.6},${y} L${x + 1.6},${y} L${x + 2.6},${y + 6} L${x - 2.6},${y + 6} Z`, c.cel(tie), 1.2) + S(D`M${x - 1},${y + 2} L${x - 1.4},${y + 5.4} M${x + 1},${y + 2} L${x + 1.4},${y + 5.4}`, dk(tie, 0.35), 0.7, 0.8); };
    return shadow(32, 59, 22) + P(b, c.cel(col), 2.4) +
      CG(F('M45,27 C58,32 58,50 50,56 C46,59.6 40,61 35,61 C44,54 48,42 42,27 Z', dk(col, 0.28), 0.8) + F('M19,31 C13,37 12,46 14,52 C16,44 20,38 24,33 Z', '#ffffff', 0.22) + (extra || ''), c.clip(b)) +
      P(cf, c.lg([lt(cuff, 0.25), cuff, dk(cuff, 0.3)], 0, 0, 1, 0), 2.2) + (cuffDeco ? CG(cuffDeco, c.clip(cf)) : '') +
      E(32, 16, 15, 3.4, dk(col, 0.7), 1.8) + S('M19,16.6 C24,18.4 40,18.4 45,16.6', dk(col, 0.4), 1, 0.7) +
      S2('M18,24 C24,27.4 40,27.4 46,24', tie, 1.6) +
      S2('M32,27 C30,33 28,37 27,41 M32,27 C34,33 36,37 37,40', tie, 1.2) + C(32, 27, 2.6, c.cel(tie), 1.3) + tass(27, 41) + tass(37, 40);
  }
  /* a small upright vial with a cork, liquid from y+top..bottom */
  function vialG(c, x, y, liq) {
    var v = D`M${x - 3.6},${y - 12} L${x + 3.6},${y - 12} L${x + 3.6},${y + 6} C${x + 3.6},${y + 10.6} ${x - 3.6},${y + 10.6} ${x - 3.6},${y + 6} Z`;
    return glow(c, x, y + 2, 9, liq, 0.6) + F(v, glass(c)) + CG(R(x - 5, y - 5, 10, 18, c.lg([lt(liq, 0.4), liq, dk(liq, 0.4)], 0, 0, 1, 0), 0) + E(x, y - 5, 3.6, 1, lt(liq, 0.6), 0, 0.9), c.clip(v)) +
      S(v, OL, 2) + S(D`M${x - 1.6},${y - 9} L${x - 1.6},${y + 6}`, '#ffffff', 1.2, 0.8) + cork(c, x, y - 17, 7, 5.6);
  }
  /* a horizontal hide roll from x0 to x1, y0..y1, spiral end on the right */
  function hroll(c, x0, x1, y0, y1, col, layers) {
    var ry = (y1 - y0) / 2, cy = y0 + ry, rx = ry * 0.5, body = D`M${x0},${y0} L${x1},${y0} L${x1},${y1} L${x0},${y1} Z`, sp = '';
    for (var i = 1; i <= layers; i++) sp += ringO(x1, cy, rx * i / (layers + 0.6), ry * i / (layers + 0.6), dk(col, 0.55), 1.2);
    return E(x0, cy, rx, ry, c.cel(dk(col, 0.15)), 2.2) +
      P(body, c.lg([[0, lt(col, 0.35)], [0.35, col], [0.75, dk(col, 0.15)], [1, dk(col, 0.42)]], 0, 0, 0, 1), 2.2) +
      S(D`M${x0 + 1},${y0 + ry * 0.4} L${x1 - 1},${y0 + ry * 0.4}`, '#ffffff', 1.2, 0.4) +
      E(x1, cy, rx, ry, c.lg([lt(col, 0.2), dk(col, 0.1)], 0, 0, 1, 1), 2.2) + sp + C(x1, cy, 1, dk(col, 0.6), 0);
  }
  /* a small five-petal flower */
  function bloom(c, x, y, r, col, mid) {
    var o = '';
    for (var i = 0; i < 5; i++) { var a = -90 + i * 72, rr = a * Math.PI / 180; o += E(x + Math.cos(rr) * r * 0.55, y + Math.sin(rr) * r * 0.55, r * 0.5, r * 0.34, c.lg([lt(col, 0.45), col, dk(col, 0.2)], 0, 0, 1, 1), 1.2, null, a); }
    return o + C(x, y, r * 0.3, mid || '#ffe070', 1);
  }
  function orangeSlice(c, x, y, s) {
    return G(C(0, 0, 4.6, c.cel('#f08a1a'), 1.4) + C(0, 0, 3.4, '#ffc060', 0) + S('M0,-3.2 L0,3.2 M-2.8,-1.6 L2.8,1.6 M-2.8,1.6 L2.8,-1.6', '#e07010', 0.8), tr(x, y, 0, s));
  }
  /* a meat bone running from a to b with a double knob at b */
  function bone(c, ax, ay, bx, by, w) {
    var dx = bx - ax, dy = by - ay, L = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / L, uy = dy / L, px = -uy, py = ux, k = w * 0.62;
    var d = D`M${ax},${ay} L${bx},${by}`;
    return S(d, OL, w + 2.8) + S(d, '#ece2c8', w) + S(D`M${ax + px * w * 0.25},${ay + py * w * 0.25} L${bx + px * w * 0.25 - ux * 2},${by + py * w * 0.25 - uy * 2}`, '#ffffff', 1.4, 0.65) +
      C(bx + ux * 1.4 + px * k, by + uy * 1.4 + py * k, w * 0.62, c.cel('#efe6d0'), 1.8) + C(bx + ux * 1.4 - px * k, by + uy * 1.4 - py * k, w * 0.62, c.cel('#efe6d0'), 1.8);
  }

  /* ================= the icons ================= */
  var NEW = {
    /* ---------- ores, stone ---------- */
    /* a dark blue-grey chunk banded with two seams of dusk-violet metal and violet-steel nuggets */
    duskiron_ore: function (c) {
      var band = function (d) { return S(d, '#1c1830', 6.4) + S(d, '#6e62a8', 3.6) + S(d, '#d8ccff', 1.1, 0.9); };
      return item(c, glow(c, 32, 36, 26, '#8a6ad8', 0.32) + oreChunk(c, '#3a3f50', 77,
        band('M6,33 L16,29 L27,32 L38,26 L58,28') + band('M8,45 L20,41 L31,44 L44,38 L58,41') +
        nug(c, 22, 31, 4.6, DUSK, 3) + nug(c, 40, 27, 4, DUSK, 5) + nug(c, 30, 44, 4.4, DUSK, 7) + nug(c, 47, 40, 3.2, DUSK, 9) + nug(c, 16, 42, 2.6, DUSK, 11)) +
        sparkle(40, 25, 3.4, '#ece6ff') + sparkle(16, 20, 2, '#d8ccff'));
    },
    /* a dark slate rock with pale moonsilver crystals growing out of it, a cool blue glow and a crescent glint (precious) */
    moonsilver_ore: function (c) {
      return iconWrap(c, ['#34405a', '#0a0e18'], glow(c, 32, 30, 28, '#9ad0ff', 0.55) +
        G(oreChunk(c, '#2e3444', 85, S('M10,44 L22,40 L34,46 L50,40', '#5a7090', 4.4) + S('M10,44 L22,40 L34,46 L50,40', '#e8f2ff', 2) + nug(c, 22, 40, 3.6, MOON, 3) + nug(c, 44, 44, 3, MOON, 5)), 'translate(0,5)') +
        moonCrystal(c, 21, 38, -34, 0.8) + moonCrystal(c, 43, 37, 30, 0.86) + moonCrystal(c, 31, 38, -4, 1.14) +
        P(crescentD(50, 13, 4.4, 4.4), '#f0f8ff', 1.2) + sparkle(31, 13, 4, '#ffffff') + sparkle(13, 22, 2.4, '#d8ecff'));
    },
    /* a clean-cut block of near-black stone, banded strata and glinting blue-violet specks, a chip beside it */
    deepstone: function (c) {
      var col = '#383b48', r = rng(57);
      return item(c, E(32, 56, 25, 4.5, '#000', 0, 0.4) + prism(c, 31, 44, 16, 10, 15.4, 9.6, 21, col, 2.4, function (p) {
        var fs = pl([p(-16, 0, 10), p(16, 0, 10), p(16, 0, -10), p(15.4, 21, -9.6), p(15.4, 21, 9.6), p(-15.4, 21, 9.6)]) + 'Z';
        var band = function (Y0, Y1, sh) { return F(pl([p(-17, Y0, 10), p(16, Y0, 10), p(16, Y0, -11), p(16, Y1, -11), p(16, Y1, 10), p(-17, Y1, 10)]) + 'Z', sh, 0.9); };
        var fl = '';
        for (var i = 0; i < 28; i++) { var Y = 1 + r() * 19, q = r() < 0.62 ? p(-15 + r() * 30, Y, 10) : p(16, Y, -9 + r() * 18); fl += C(q[0], q[1], 0.5 + r() * 0.55, r() < 0.45 ? '#b8acff' : '#8a90a8', 0, 0.9); }
        return CG(band(5, 8.4, '#4a4e5e') + band(13, 15.4, '#24262e') + fl, c.clip(fs)) +
          S(seg(p(-15, 21, 9.6), p(15, 21, 9.6)), '#ffffff', 1.1, 0.4) + S(seg(p(16, 0, 10), p(15.4, 21, 9.6)), '#6a6e80', 1, 0.6);
      }) + P('M47,55 L50,49 L56,49 L58,54 L53,57 Z', c.cel('#3a3d4a'), 1.8) + F('M50,50 L55.6,50 L52.6,52.6 Z', '#6a6e80', 0.8) +
        sparkle(20, 22, 2.6, '#d8d0ff'));
    },
    /* ---------- bars ---------- */
    /* a dark blue-grey ingot with a dusk-violet sheen on top and a stamped setting sun */
    duskiron_bar: function (c) {
      var col = '#4c5268';
      return item(c, glow(c, 32, 38, 26, '#8a6ad8', 0.32) + bar(c, col, function (p) {
        var tp = [p(-14, 9, -5), p(14, 9, -5), p(14, 9, 5), p(-14, 9, 5)], m = p(0, 9, 0);
        var sun = D`M${m[0] - 3.8},${m[1] + 0.8} A3.8,2.2 0 0 1 ${m[0] + 3.8},${m[1] + 0.8} Z`;
        var rays = D`M${m[0]},${m[1] - 2} L${m[0]},${m[1] - 3.4} M${m[0] - 3},${m[1] - 1.2} L${m[0] - 4.4},${m[1] - 2.2} M${m[0] + 3},${m[1] - 1.2} L${m[0] + 4.4},${m[1] - 2.2}`;
        return F(pl(tp) + 'Z', c.lg([[0, '#c0a8ff', 0.6], [0.5, '#7a6ab8', 0.2], [1, '#c0a8ff', 0.55]], 0, 0, 1, 1)) +
          S(seg(p(-15, 1.5, 7.6), p(-9, 7.5, 5.4)), '#c8b8ff', 2, 0.85) + S(seg(p(4, 1.5, 7.6), p(10, 7.5, 5.4)), '#a890ff', 1.2, 0.6) +
          '<path d="' + sun + '" fill="none" stroke="' + dk(col, 0.6) + '" stroke-width="1.2"/>' + S(rays, dk(col, 0.6), 1, 0.9);
      }) + sparkle(21, 31, 2.8, '#e8e0ff'));
    },
    /* a pale blue-tinted silver ingot with a cool moonlit glow and a big stamped crescent (precious) */
    moonsilver_bar: function (c) {
      var col = '#c8d8ee';
      return iconWrap(c, ['#34405a', '#0a0e18'], glow(c, 32, 38, 30, '#8ac8ff', 0.6) + bar(c, col, function (p) {
        var tp = [p(-14, 9, -5), p(14, 9, -5), p(14, 9, 5), p(-14, 9, 5)], m = p(0, 9, 0);
        return F(pl(tp) + 'Z', c.lg([[0, '#a8d4ff', 0.55], [1, '#ffffff', 0.25]], 0, 0, 1, 1)) +
          P(crescentD(m[0] - 1.6, m[1], 4, 3), '#4a6aa8', 0.8) +
          S(seg(p(-15, 1.5, 7.6), p(-9, 7.5, 5.4)), '#ffffff', 2.2, 0.9) + S(seg(p(-18, 3, 7.9), p(18, 3, 7.9)), '#8ab8f0', 1.4, 0.6);
      }) + P(crescentD(14, 16, 3.6, 3.6), '#e8f4ff', 1.1) + sparkle(20, 30, 3.6, '#ffffff') + sparkle(49, 22, 2.8, '#d8ecff') + sparkle(51, 50, 2, '#d8ecff'));
    },
    /* ---------- herbs ---------- */
    /* an ember-red flower of flame-shaped petals with glowing edges, an ember heart, ash-grey leaves, sparks rising */
    cinderbloom: function (c, nd) {
      var pet = function (a, len, w) {
        var d = D`M0,0 C${-w},${-len * 0.25} ${-w * 1.15},${-len * 0.62} ${-w * 0.3},${-len} C${-w * 0.25},${-len * 0.76} ${w * 0.2},${-len * 0.7} ${w * 0.3},${-len * 0.86} C${w * 1.05},${-len * 0.6} ${w * 0.95},${-len * 0.25} 0,0 Z`;
        return G(P(d, c.lg([[0, '#ffd870'], [0.3, '#ff7a1e'], [0.7, '#d02a0e'], [1, '#6a0a04']], 0, 0, 0, 1), 1.8) + S(d, '#ffb040', 0.9, 0.85) +
          S(D`M0,-2 C${-w * 0.2},${-len * 0.4} ${-w * 0.1},${-len * 0.6} ${-w * 0.2},${-len * 0.8}`, '#ffe0a0', 0.9, 0.6), tr(32, 37, a));
      };
      var g = blade(c, 30, 60, -56, 0.62, '#6a625a') + blade(c, 34, 60, 56, 0.62, '#6a625a') + blade(c, 32, 60, -18, 0.5, '#5a544e') +
        stem('M32,60 C31,52 33,44 32,38', '#3e3430', 2.8) +
        pet(-62, 20, 6) + pet(62, 20, 6) + pet(-30, 24, 7) + pet(30, 24, 7) + pet(0, 26, 7.5) +
        E(32, 36.5, 6, 3.2, c.rg([[0, '#ffe080'], [0.5, '#ff6a14'], [1, '#5a0a04']]), 1.6) +
        C(29, 34.6, 1, '#fff4c0', 0) + C(32, 33.6, 1.1, '#fff4c0', 0) + C(35, 34.6, 1, '#fff4c0', 0);
      return nd ? g : item(c, glow(c, 32, 26, 26, '#ff6a1a', 0.5) + E(32, 60, 13, 2.6, '#000', 0, 0.35) + g +
        C(15, 16, 1.4, '#ffb040', 0) + C(48, 9, 1.2, '#ffd070', 0) + C(53, 22, 1.1, '#ff8a2a', 0) + C(11, 30, 1, '#ffb040', 0, 0.8) + C(23, 7, 1, '#ffd070', 0, 0.8));
    },
    /* a cluster of three dark purple-grey swamp mushrooms with pale spots on a mossy mound, faint spore motes */
    gloomcap: function (c, nd) {
      var cap = '#5e4a74', st = '#cbc2d2', r = rng(29);
      var shroom = function (x, y, rx, h, sh, dx) {
        var sw = rx * 0.24, b = y + sh;
        var stemD = D`M${x - sw},${y} C${x - sw + dx * 0.3},${y + sh * 0.5} ${x - sw * 1.3 + dx},${b - 2} ${x - sw * 1.5 + dx},${b} L${x + sw * 1.5 + dx},${b} C${x + sw * 1.3 + dx},${b - 2} ${x + sw + dx * 0.3},${y + sh * 0.5} ${x + sw},${y} Z`;
        var capD = D`M${x - rx},${y + 1} C${x - rx},${y - h * 1.3} ${x + rx},${y - h * 1.3} ${x + rx},${y + 1} C${x + rx * 0.6},${y + h * 0.34} ${x - rx * 0.6},${y + h * 0.34} ${x - rx},${y + 1} Z`;
        var spots = '';
        for (var i = 0; i < 5; i++) spots += E(x - rx * 0.62 + r() * rx * 1.24, y - h * 0.1 - r() * h * 0.7, rx * 0.1 + r() * rx * 0.06, rx * 0.07 + r() * rx * 0.04, '#d8c8e8', 0, 0.9);
        return P(stemD, c.lg([lt(st, 0.3), st, dk(st, 0.35)], 0, 0, 1, 0), 1.8) + S(D`M${x - sw * 0.3},${y + 2} L${x - sw * 0.6 + dx * 0.8},${b - 1}`, '#ffffff', 1, 0.5) +
          E(x, y + 1.4, rx * 0.9, h * 0.26, dk(cap, 0.55), 1.4) +
          P(capD, c.rg([[0, lt(cap, 0.35)], [0.6, cap], [1, dk(cap, 0.4)]], 0.4, 0.3, 0.7), 2) + CG(spots, c.clip(capD)) +
          S(D`M${x - rx * 0.7},${y - h * 0.3} C${x - rx * 0.5},${y - h * 0.85} ${x - rx * 0.1},${y - h * 0.98} ${x + rx * 0.2},${y - h * 0.96}`, '#ffffff', 1.2, 0.45);
      };
      var g = E(32, 58, 22, 4.4, c.cel('#2e3a28'), 1.8) + S('M14,56 L12,53 M18,57 L17,53.4 M46,57 L47,53 M50,56 L52,53', '#5a7a3a', 1.2, 0.9) +
        shroom(31, 26, 16, 11, 31, 0) + shroom(48, 40, 9.5, 7, 17, 2) + shroom(17, 44, 8, 5.6, 13, -1.5) +
        C(22, 16, 1, '#d8f0e8', 0, 0.8) + C(46, 22, 0.9, '#d8f0e8', 0, 0.7) + C(54, 31, 0.8, '#d8f0e8', 0, 0.7);
      return nd ? g : item(c, glow(c, 32, 30, 28, '#9a7ac8', 0.32) + g);
    },
    /* a pale gold flower hanging from a bowed stem, long translucent petals falling like a veil, gold stamens below */
    sunveil: function (c, nd) {
      var fx = 38, fy = 14;
      var pet = function (a, len, w, o) {
        var d = D`M0,0 C${w},3 ${w * 1.15},${len * 0.6} 0,${len} C${-w * 1.15},${len * 0.6} ${-w},3 0,0 Z`;
        return G(P(d, c.lg([[0, '#fffbe8', 0.9], [0.55, '#f8e08a', o], [1, '#e8b840', 0.85]], 0, 0, 0, 1), 1.4) +
          S(D`M0,2 L0,${len - 3}`, '#fff8d8', 0.9, 0.8) + S(D`M0,${len * 0.35} L${w * 0.5},${len * 0.6} M0,${len * 0.35} L${-w * 0.5},${len * 0.6}`, '#fff8d8', 0.7, 0.6), tr(fx, fy + 1, a));
      };
      var g = blade(c, 22, 60, -48, 0.55, '#8aa040') + blade(c, 26, 60, 40, 0.5, '#7a9438') +
        stem('M24,60 C21,46 22,28 28,18 C31,13 35,11 38,13', '#7a9438', 2.4) +
        pet(40, 24, 5, 0.6) + pet(-40, 24, 5, 0.6) + pet(20, 29, 5.4, 0.62) + pet(-20, 29, 5.4, 0.62) +
        S('M38,16 L35.4,40 M38,16 L40.6,42 M38,16 L38,45', '#c89a20', 0.8, 0.9) + C(35.4, 40.6, 1.3, '#ffd040', 0.7) + C(40.6, 42.6, 1.3, '#ffd040', 0.7) + C(38, 45.6, 1.4, '#ffd040', 0.7) +
        pet(0, 31, 5.8, 0.66) +
        E(fx, fy + 0.6, 4.4, 2.6, c.cel('#8aa040'), 1.4);
      return nd ? g : item(c, glow(c, 38, 30, 26, '#ffe070', 0.42) + E(26, 60, 13, 2.6, '#000', 0, 0.35) + g + sparkle(14, 18, 2.8, '#fffbe0') + sparkle(55, 50, 2.4, '#fff2a0'));
    },
    /* an icy blue flower of faceted crystal petals in two rings, a white gem heart, frost crystals around it */
    frostpetal: function (c, nd) {
      var cx = 32, cy = 27, o = '', i;
      var pet = function (a, len, w, col) {
        return G(P(D`M0,0 L${-w},${-len * 0.45} L0,${-len} L${w},${-len * 0.45} Z`, col, 1.6) + F(D`M0,0 L${-w},${-len * 0.45} L0,${-len} Z`, '#ffffff', 0.4) +
          S(D`M0,-2 L0,${-len + 2}`, '#ffffff', 0.8, 0.7), tr(cx, cy, a));
      };
      for (i = 0; i < 6; i++) o += pet(i * 60, 21, 6.6, c.lg(['#e8f8ff', '#86c8f0', '#3a78b0'], 0, 0, 1, 1));
      for (i = 0; i < 6; i++) o += pet(30 + i * 60, 13, 4.4, c.lg(['#ffffff', '#c8ecff', '#7ab8e0'], 0, 0, 1, 1));
      var g = blade(c, 30, 60, -52, 0.56, '#6a9ab0') + blade(c, 34, 60, 52, 0.56, '#6a9ab0') + stem('M32,60 L32,44', '#5a8aa0', 2.4) + o +
        C(cx, cy, 3.6, c.rg([[0, '#ffffff'], [0.6, '#c8f0ff'], [1, '#6ab0e0']]), 1.4) + C(cx - 1, cy - 1.2, 1, '#ffffff', 0);
      return nd ? g : item(c, glow(c, 32, 28, 28, '#b8e8ff', 0.5) + E(32, 60, 12, 2.6, '#000', 0, 0.3) + g + flake(12, 47, 2.6) + flake(52, 49, 2.4) + flake(54, 10, 2) + sparkle(11, 12, 2.6, '#ffffff'));
    },
    /* ---------- leather, cloth ---------- */
    /* a fat roll of stiff, dark brown thick hide (stiff angular edges, pebbled hard grain), bound by two riveted iron bands */
    hardhide_leather: function (c) {
      var col = '#4e2e1a', r = rng(13), peb = '';
      var sheet = 'M10,36 L8,25 L14,20 L11,12 L22,15 L29,8 L37,14 L46,8 L49,15 L56,12 L54,24 L56,36 Z';
      for (var i = 0; i < 34; i++) peb += C(11 + r() * 40, 30 + r() * 26, 0.6 + r() * 0.5, r() < 0.5 ? dk(col, 0.4) : lt(col, 0.2), 0, 0.85);
      var band = function (x) {
        return R(x, 28.6, 5, 28.8, c.lg(['#8a929c', '#c8ced6', '#5a626c'], 0, 0, 1, 0), 1.6) + C(x + 2.5, 33, 1.1, '#2a2e34', 0) + C(x + 2.5, 52, 1.1, '#2a2e34', 0) +
          S(D`M${x + 1.2},30 L${x + 1.2},56`, '#ffffff', 0.9, 0.6);
      };
      return item(c, G(hideRoll(c, col, sheet, 30, 56, 5) + CG(peb, c.clip('M10,30 L52,30 L52,56 L10,56 Z')) +
        CG(peb.replace(/cy="(\d+(\.\d+)?)"/g, function (m, v) { return 'cy="' + r1(+v - 18) + '"'; }), c.clip(sheet)) +
        band(19) + band(37), 'matrix(0.92,0,0,0.92,2.6,3.4)'));
    },
    /* two overlapping frayed scraps of dark violet cloth, a dusk-rose sheen, a lilac stitched hem */
    duskweave_cloth: function (c) {
      var fray = function (w, h, seed) {
        var r = rng(seed), p = [], n = 7, i, j = function () { return (r() - 0.5) * 3.2; };
        for (i = 0; i < n; i++) p.push([-w / 2 + w * i / n, -h / 2 + j()]);
        for (i = 0; i < n; i++) p.push([w / 2 + j(), -h / 2 + h * i / n]);
        for (i = 0; i < n; i++) p.push([w / 2 - w * i / n, h / 2 + j()]);
        for (i = 0; i < n; i++) p.push([-w / 2 + j(), h / 2 - h * i / n]);
        return pl(p) + 'Z';
      };
      var scrap = function (x, y, a, w, h, col, seed, front) {
        var d = fray(w, h, seed), weave = '', i;
        for (i = -6; i <= 6; i++) weave += D`M${-w},${i * 4} L${w},${i * 4 - 2} M${i * 4},${-h} L${i * 4 + 2},${h} `;
        return G(S2(D`M${-w / 2 + 4},${h / 2} l-0.6,3.4 M${-w / 2 + 10},${h / 2} l0.4,3.6 M${-w / 2 + 16},${h / 2} l-0.4,3 M${w / 2 - 9},${h / 2} l0.6,3.4 M${w / 2 - 3},${h / 2} l-0.3,3`, lt(col, 0.2), 1) +
          P(d, c.cel(col), 2.2) + CG(S(weave, dk(col, 0.4), 0.9, 0.6) +
          R(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4, c.lg([[0, '#ffffff', 0.18], [0.5, '#ffffff', 0], [1, '#e070b0', front ? 0.42 : 0.22]], 0, 0, 1, 1), 0) +
          (front ? SD(D`M${-w / 2 + 3},${-h / 2 + 3.6} L${w / 2 - 3},${-h / 2 + 3.6}`, '#d0b8f4', 1.3, '2.4 1.8') + S(D`M${-w / 2 + 4},${-h / 2 + 8} L${w / 2 - 6},${-h / 2 + 6}`, '#ffffff', 1.2, 0.3) : ''), c.clip(d)), tr(x, y, a));
      };
      return item(c, shadow(32, 57, 24) + scrap(26, 27, -16, 34, 26, '#3e2462', 5, false) + scrap(36, 38, 9, 36, 27, '#5c378c', 9, true) + sparkle(50, 20, 2.8, '#ece0ff'));
    },
    /* the dark violet cloth wound on a bolt standing on end, a lilac band, the loose end pooling on the ground, a dusk-rose
     * fade and silver thread flecks (the other bolts lie on their side) */
    duskweave_bolt: function (c) {
      var col = '#58358a';
      var body = 'M17,15 L45,15 L45,52 C45,58.4 17,58.4 17,52 Z';
      var tail = 'M38,31 C47,33 51,42 49,50 C48,54 51,57.6 56,59.6 L42,59.6 C40,56 39,52 40,46 C41,40 39,35 34,33.4 Z';
      return item(c, glow(c, 32, 34, 28, '#9a6ad8', 0.3) + shadow(35, 58, 22) +
        P(body, c.lg([[0, lt(col, 0.28)], [0.35, col], [1, dk(col, 0.48)]], 0, 0, 1, 0), 2.4) +
        CG(F('M10,38 L52,38 L52,62 L10,62 Z', c.lg([[0, '#e070b0', 0], [1, '#e070b0', 0.4]], 0, 0, 0, 1)) + dots(71, 16, 18, 44, 18, 54, 0.5, 0.8, '#ece4ff', 0.85) +
          S('M21,18 L21,54', '#ffffff', 2, 0.35) + S('M26,18 L26,55 M38,18 L38,55', dk(col, 0.25), 1, 0.5) +
          P('M17,29 C23,32 39,32 45,29 L45,35 C39,38 23,38 17,35 Z', c.lg(['#ffffff', '#d4c4f0', '#9a86c8'], 0, 0, 1, 0), 1.4), c.clip(body)) +
        P(tail, c.lg([lt(col, 0.2), col, dk(col, 0.35)], 0, 0, 1, 1), 2.2) + S('M44,40 C46,46 45,52 47,57', dk(col, 0.35), 1, 0.7) + F('M40,47 L46,54 L49,59.6 L42,59.6 Z', '#e070b0', 0.3) +
        E(31, 15, 14, 5, c.lg([lt(col, 0.32), dk(col, 0.1)], 0, 0, 1, 1), 2.4) +
        ringO(31, 15, 9.6, 3.4, dk(col, 0.42), 1.1) + ringO(31, 15, 5.4, 1.9, dk(col, 0.42), 1.1) + C(31, 15, 1.4, dk(col, 0.6), 0) +
        sparkle(51, 18, 3, '#ece0ff'));
    },
    /* ---------- fish ---------- */
    ashgill_bass: function (c) { return item(c, shadow(32, 56, 23) + rawFish(c, 'ashgill_bass', 30, 33, 14, 1.14)); },
    frostscale_herring: function (c) {
      return item(c, glow(c, 32, 32, 26, '#b8e8ff', 0.3) + shadow(32, 56, 24) + rawFish(c, 'frostscale_herring', 31, 32, 22, 1.08) +
        flake(13, 17, 2.4) + flake(51, 51, 2) + sparkle(50, 13, 2.6, '#ffffff'));
    },
    thunderhead_marlin: function (c) {
      var z = 'M55,5 L50,12 L54,12 L49,19';
      return item(c, glow(c, 33, 32, 27, '#5ab0ff', 0.32) + shadow(33, 57, 25) + rawFish(c, 'thunderhead_marlin', 33.6, 36, 24, 0.86) +
        S(z, '#0a1a30', 3.4) + S(z, '#8ad8ff', 1.6) + sparkle(12, 46, 2.2, '#c8ecff'));
    },
    /* a rare deep-blue koi with gold star spots, on a night-blue ground with a faint glow */
    starlit_koi: function (c) {
      return iconWrap(c, ['#24346a', '#060a18'], glow(c, 32, 32, 28, '#6a8aff', 0.45) + shadow(32, 56, 22) + rawFish(c, 'starlit_koi', 30, 32, 12, 1.12) +
        sparkle(50, 12, 3.6, '#fff4c0') + sparkle(13, 48, 2.6, '#ffe890') + sparkle(54, 46, 2, '#fff4c0'));
    },
    /* ---------- meat ---------- */
    /* a big dark-red marbled haunch with a cream fat edge, a thick bone with a double knob */
    marbled_haunch: function (c) {
      var d = 'M9,37 C8,25 18,17 30,17 C35,17 39,18 42,20 C46,23 46,27 43,29 C40,33 38,41 32,47 C26,53 16,53 12,47 C10,44 9,41 9,37 Z';
      var marb = 'M14,30 C18,27 21,31 25,28 C29,25 31,29 35,25 M14,40 C18,37 22,41 26,37 C30,34 33,37 36,33 M22,22 C26,24 30,21 34,23 M20,46 C23,44 26,46 28,43 M28,33 C31,31 33,34 37,31 M38,24 C40,25 41,24 42,25';
      return item(c, shadow(30, 56, 22) + bone(c, 40, 25, 51, 12, 6.6) +
        slab(c, d, 5, c.rg([[0, '#e45a62'], [0.6, '#b8303a'], [1, '#8a1e28']], 0.4, 0.4, 0.65), '#7a1a22',
          S('M10,43 C8,30 16,20 27,18', '#f4e4cc', 4) + S(marb, '#f8e4dc', 1.2, 0.85) + S(marb, '#ffffff', 0.5, 0.6) +
          S('M14,34 C16,27 22,22 28,21', '#ffffff', 1.2, 0.35)) +
        E(43.2, 23.8, 3.6, 2.6, '#f0e6d0', 1.4, null, -45) + C(43.2, 23.8, 1.2, '#c8a890', 0));
    },
    /* ---------- dishes (plain) ---------- */
    /* a grilled ash-grey-skinned fillet on a broad green leaf, a lemon wedge, a herb sprig */
    ashgill_fillet: function (c) {
      var leaf = 'M3,44 C10,29 40,22 61,31 C54,45 26,55 3,44 Z';
      return item(c, shadow(32, 54, 26) + P(leaf, c.lg(['#7ab84a', '#4a8a2e', '#2e5a1c'], 0, 0, 0.3, 1), 2.2) +
        CG(S('M5,43.6 C22,36 42,31 60,31', '#a8d878', 1.3, 0.8) + S('M14,40 L12,33 M24,37 L22,29 M34,35 L33,27 M44,33 L44,26 M18,40.4 L19,48 M30,38 L32,48 M42,35 L45,44', '#2e5a1c', 1, 0.6), c.clip(leaf)) +
        G(fillet(c, '#f2ebe0', '#55595f', S('M-13,-8 L-9,6 M-5,-9 L-1,7 M3,-9 L7,7 M11,-8 L14,4', '#3a2410', 1.7, 0.75), '#6a6e74'), tr(29, 37, -10, 1.0)) +
        lemon(c, 50, 42, -20, 0.85) + sprig(c, 12, 41, -10, 0.8) + C(20, 46, 1, '#c8200e', 0) + C(24, 47.4, 0.9, '#c8200e', 0));
    },
    /* a glazed roast haunch on a plate, the bone dressed in a white paper frill, two roast potatoes */
    roast_haunch: function (c) {
      var d = 'M9,40 C8,30 17,24 27,24 C32,24 36,25 39,27 C42,29 42,33 40,35 C37,39 34,45 29,48 C23,51 15,51 11,47 C9,45 9,43 9,40 Z';
      var frill = 'M-4,-4 L4,-4 L5.6,-2.7 L4,-1.3 L5.6,0 L4,1.3 L5.6,2.7 L4,4 L-4,4 L-5.6,2.7 L-4,1.3 L-5.6,0 L-4,-1.3 L-5.6,-2.7 Z';
      return item(c, plate(c, 32, 44, 27, 12, '#d8d2c4') + bone(c, 37, 30, 49, 17, 5.4) +
        G(P(frill, '#ffffff', 1.4) + S('M-2,-4 L-2,4 M1.4,-4 L1.4,4', '#c8c0b0', 0.8, 0.8), tr(44.4, 22.4, -47)) +
        chunk(c, 46, 47, 4.6, '#e8b860', 3, 1.6) + chunk(c, 52, 41.4, 3.6, '#e0a850', 7, 1.4) +
        slab(c, d, 4, c.lg(['#d88a40', '#9a4e18', '#5a280a'], 0.2, 0, 0.8, 1), '#4a2008',
          S('M13,34 C16,28 22,25.6 29,25.6', '#ffd8a0', 1.8, 0.65) + S('M16,42 C20,39 24,41 28,38 M22,32 C26,30 30,32 34,30', '#5a2808', 1.3, 0.7) +
          C(20, 37, 1.4, '#ffffff', 0, 0.5) + C(31, 31, 1, '#ffffff', 0, 0.5)) +
        sprig(c, 14, 50, -30, 0.8));
    },
    /* a golden pie in a terracotta dish, three silver herring tails poking up through the crust */
    herring_pie: function (c) {
      var crust = 'M7,42 C7,30 20,24 32,24 C44,24 57,30 57,42 C48,48 16,48 7,42 Z';
      var tail = function (x, y, a, s) {
        return E(x, y + 1, 3.6 * s, 1.5 * s, '#5a2a0a', 0) +
          G(P('M-2.2,2 L-2.4,-5 C-6,-8 -7.4,-12 -6.6,-16 C-3.6,-13 -1.4,-12 0,-10 C1.4,-12 3.6,-13 6.6,-16 C7.4,-12 6,-8 2.4,-5 L2.2,2 Z', c.lg(['#e8f4ff', '#8ab0d0', '#4a6a90'], 0, 0, 1, 0), 1.6) +
            S('M0,-9 L-4.6,-14 M0,-9 L4.6,-14 M0,-9 L0,0', '#3a5a80', 0.8, 0.6), tr(x, y, a, s));
      };
      var crimp = '', i;
      for (i = 0; i <= 12; i++) { var ang = Math.PI * i / 12; crimp += C(32 + Math.cos(ang) * 24.6, 42 + Math.sin(ang) * 4.6, 2.5, c.cel('#e8a850'), 1.2); }
      return item(c, shadow(32, 57, 26) + P('M5,42 C5,52 16,56 32,56 C48,56 59,52 59,42 Z', c.lg(['#d07a48', '#a04a24', '#6a2a10'], 0, 0, 1, 0.3), 2.2) +
        E(32, 42, 27, 9, c.lg(['#e8986a', '#a85428'], 0, 0, 0, 1), 2.2) +
        P(crust, c.rg([[0, '#ffe0a0'], [0.6, '#e8a850'], [1, '#b06a24']], 0.45, 0.35, 0.7), 2.2) +
        S('M14,34 C18,28 26,25.6 32,25.6', '#fff0c8', 1.6, 0.6) + S('M26,38 L29,36 M38,37 L41,39 M32,41 L35,40', '#7a4010', 1.4, 0.85) + crimp +
        tail(20, 33, -24, 0.95) + tail(46, 34, 26, 0.95) + tail(33, 28, 2, 1.1) + steam(26, 18, 0.7, 0.45) + steam(40, 20, 0.6, 0.4));
    },
    /* meat cubes and onion on one skewer, ash-skinned fish pieces on another, crossed */
    trail_skewer: function (c) {
      var cube = function (col, seed) { return function (x, y) { return G(chunk(c, 0, 0, 6.6, col, seed, 2) + S('M-3,-3.6 L3,3.6 M-5.4,-1 L-1,4.4', '#2a1206', 1.3, 0.75), tr(x, y, 0)); }; };
      var fishp = function (x, y) {
        return G(P('M-6,-5 L6,-5 L6,5 L-6,5 Z', c.lg(['#ffffff', '#f2e6d4', '#d4c0a0'], 0, 0, 0, 1), 1.8) + P('M-6,-5 L6,-5 L6,-2 L-6,-2 Z', c.cel('#5a5e66'), 1.4) +
          S('M-2,-0.6 C-3,1.4 -2,3 -1,4 M2.4,-0.6 C1.4,1.4 2.4,3 3,4', '#c8b090', 0.9, 0.8) + S('M-4,4 L4,-1', '#8a5a2a', 1.4, 0.5), tr(x, y, 40));
      };
      var onion = function (x, y) { return E(x, y, 5.4, 3.4, c.cel('#efe0c4'), 1.5, null, -50) + ringO(x, y, 3.4, 1.9, '#c8a878', 0.9, 0.9) + E(x - 1, y - 1, 2, 0.8, '#ffffff', 0, 0.6, -50); };
      return item(c, shadow(32, 58, 24) +
        skewer(c, 55, 58, 13, 8, [at(0.2, fishp), at(0.38, fishp), at(0.72, fishp)]) + S('M58,61 L55,58', '#c8a070', 1.6) +
        skewer(c, 9, 58, 51, 8, [at(0.19, cube('#8a4418', 3)), at(0.35, onion), at(0.7, cube('#9a5020', 7)), at(0.86, cube('#844016', 11))]) + S('M6,61 L9,58', '#c8a070', 1.6));
    },
    /* ---------- dishes (buff) ---------- */
    /* a dark stoneware bowl of near-black stew with sausage coins and beans, thick grey smoke curling up */
    smokehouse_stew: function (c) {
      var coin = function (x, y, r) { return E(x, y, r, r * 0.7, c.cel('#8a3a22'), 1.2) + E(x, y - 0.3, r * 0.64, r * 0.42, '#c8786a', 0) + C(x - r * 0.2, y - 0.4, 0.5, '#f0d0c0', 0) + C(x + r * 0.25, y, 0.5, '#f0d0c0', 0); };
      var smoke = 'M20,23 C14,17 24,13 19,6 M33,21 C28,14 38,10 33,3 M45,24 C42,19 48,16 45,10';
      return buff(c, S(smoke, '#4a4a52', 5.6, 0.5) + S(smoke, '#a0a0a8', 3.2, 0.7) + S(smoke, '#e0e0e4', 1, 0.45) +
        bowl(c, 32, 31, 24, 8, 23, '#3a3532', c.lg(['#5a3214', '#2a1406'], 0, 0, 0, 1),
          coin(23, 30, 3.6) + coin(36, 32.4, 3.4) + coin(43, 28.6, 2.8) + coin(29, 27.4, 2.6) + C(17, 31, 1.4, '#c8a060', 0.8) + C(33, 28, 1.2, '#c8a060', 0.8) + C(40, 34.4, 1.1, '#c8a060', 0.8) + C(26, 33.6, 0.9, '#5aa040', 0)) +
        S2('M54,30 C59,31 60,38 56,43', '#8a3a22', 3) + S('M55,32 C58,33 58.6,37 56.6,40', '#d8887a', 1, 0.7), '#ff9a50');
    },
    /* a roast haunch in a crust of red spice on a wooden board, two red chillies, spice dust */
    spiced_haunch: function (c) {
      var board = 'M3,45 C3,39 9,36 17,36 L48,32 C56,32 61,36 61,41 C61,47 56,50 48,50 L17,54 C9,54 3,51 3,45 Z';
      var d = 'M9,38 C8,28 17,22 27,22 C32,22 36,23 39,25 C42,27 42,31 40,33 C37,37 34,43 29,46 C23,49 15,49 11,45 C9,43 9,41 9,38 Z';
      var chili = function (x, y, a, s) { return G(P('M0,0 C6,-2 14,0 20,6 C14,4 6,4 0,4 Z', c.cel('#e0281a'), 1.6) + P('M0,0 C-3,0 -4,2 -3,4 L0,4 Z', c.cel('#4a8a2a'), 1.2) + S('M3,1.2 C8,0.4 13,1.4 17,4', '#ff9a8a', 0.9, 0.7), tr(x, y, a, s)); };
      return buff(c, shadow(32, 57, 28) + extrude(board, 4, '#6a3c1c') + P(board, c.lg(['#c08850', '#8a5a2e'], 0, 0, 1, 1), 2.2) +
        CG(S('M5,43 L59,37 M5,49 L59,43', '#6a3c1c', 1, 0.5) + dots(61, 30, 6, 58, 36, 53, 0.4, 0.8, '#d8200e', 0.85), c.clip(board)) +
        bone(c, 37, 28, 49, 15, 5.4) +
        slab(c, d, 4, c.lg(['#d0501e', '#962c0c', '#5a1606'], 0.2, 0, 0.8, 1), '#3a0e04',
          dots(63, 44, 8, 44, 20, 48, 0.5, 1.0, '#ff6a3a', 0.9) + dots(67, 22, 8, 44, 20, 48, 0.4, 0.8, '#2a0a02', 0.85) + S('M13,30 C16,25 22,23 28,23', '#ffb080', 1.3, 0.55)) +
        chili(34, 46, -6, 0.9) + chili(41, 50.6, 8, 0.8), '#ff6a3a');
    },
    /* a thick round marlin steak, pale with the four-swirl grain, a dark blue skin rim and grill marks, lemon and herbs */
    marlin_steak: function (c) {
      var st = 'M13,35 C13,26 23,21 33,21 C45,21 53,27 52,35 C51,42 43,46 32,46 C21,46 13,42 13,35 Z';
      return buff(c, plate(c, 32, 41, 28, 13, '#ecebe6') +
        slab(c, st, 6, c.rg([[0, '#fbeedd'], [0.6, '#eccaa8'], [1, '#d0a07c']], 0.5, 0.45, 0.6), '#9a6a4e',
          S(st, '#24345e', 5.4) + S(st, '#5a6a98', 1.2, 0.7) +
          S('M32,33 C26,28 21,30 19,35 M32,33 C38,28 44,29 46,34 M32,33 C27,37 25,41 27,44 M32,33 C37,37 40,40 40,44', '#b8785a', 1.4, 0.8) + C(32, 33, 1.6, '#a86a4a', 0) +
          G(grill(0, 0, 8, '#3a1a08', 2, 2), 'translate(32,33)') + S('M18,29 C22,24.6 28,23.4 34,23.6', '#ffffff', 1.2, 0.5)) +
        lemon(c, 14, 47, 20, 0.8) + sprig(c, 50, 47, 30, 0.8), '#ffb060');
    },
    /* the starlit koi roasted whole on a gold-rimmed porcelain platter, orange slices and greens, gold sparkles */
    koi_banquet: function (c) {
      var lotus = function (x, y) {
        var o = '';
        [-60, -30, 0, 30, 60].forEach(function (a) { o += G(P('M0,0 C2.6,-2 2.6,-6 0,-8 C-2.6,-6 -2.6,-2 0,0 Z', c.lg(['#ffe0f0', '#f08ac0', '#b04a80'], 0, 0, 0, 1), 1.1), tr(x, y, a)); });
        return o + C(x, y - 1, 1.4, '#ffd040', 0.8);
      };
      return iconWrap(c, ITEM_BG, glow(c, 32, 36, 30, '#ffd060', 0.45) + glow(c, 32, 40, 22, '#6a8aff', 0.3) +
        plate(c, 32, 42, 29, 13.5, '#f6f4f0', '#d6a53c') + ringO(32, 42.6, 24.4, 10.6, '#3a5ab0', 1.3, 0.75) +
        orangeSlice(c, 12, 43, 0.85) + orangeSlice(c, 52, 46, 0.8) + sprig(c, 16, 49, -40, 0.75) +
        G(fish(c, FISH.koi_cooked), tr(31, 39, -6, 0.98)) + lotus(51, 34) +
        sparkle(18, 24, 3.4, '#fff4c0') + sparkle(46, 18, 2.8, '#fff4c0') + sparkle(54, 28, 2, '#ffe890') + sparkle(12, 34, 2, '#ffe890'));
    },
    /* a feast spread on a long wooden table: a roast bird, a loaf, a pie, grapes and a gold goblet of wine */
    long_table_feast: function (c) {
      var gd = c.lg(GOLDS, 0, 0, 1, 0);
      var bird = 'M13,42 C12,32 21,27 30,27 C39,27 46,32 45,41 C44,46 38,48 29,48 C20,48 14,46 13,42 Z';
      var grapes = function (x, y) {
        var o = '';
        [[0, 0], [4, 0.4], [2, 3.4], [6, 3.6], [4, 7], [-2, 3.2], [0.6, 6.6]].forEach(function (p) { o += C(x + p[0], y + p[1], 2.4, c.rg([[0, '#d8a8ff'], [1, '#5a2a8a']], 0.35, 0.35, 0.7), 1.1); });
        return S2(D`M${x + 1},${y - 2} L${x + 2},${y - 5}`, '#5a3a20', 1) + o;
      };
      return buff(c, P('M2,42 L62,38 L62,56 L2,58 Z', c.lg(['#a8703a', '#7a4a22'], 0, 0, 0, 1), 2) + P('M2,58 L62,56 L62,62 L2,62 Z', '#4a2a12', 2) +
        S('M3,47 L61,43.4 M3,52.6 L61,49.4', '#5a3418', 1, 0.6) +
        grapes(8, 30) +
        P('M50,26 L50,36 M50,26', 'none', 0) + S2('M50,26 L50,36', '#c89028', 2.4) + E(50, 30, 2.6, 1.4, gd, 1.2) + E(50, 37, 6.4, 2.2, gd, 1.6) +
        P('M42,12 L58,12 C58,21.6 54.6,26 50,26 C45.4,26 42,21.6 42,12 Z', gd, 2) + E(50, 12.6, 7.4, 1.9, '#7a0e2a', 1.2) + S('M44.6,15 C44.6,20 46.6,23 49,24', '#fff8d8', 1.2, 0.7) +
        C(46, 18, 1.2, '#e84a6a', 0.8) + C(54, 18, 1.2, '#4a8ae8', 0.8) +
        bone(c, 18, 32, 12, 24, 3.4) + bone(c, 41, 31, 48, 23, 3.4) +
        P(bird, c.lg(['#e09048', '#a85a20', '#6a300c'], 0.2, 0, 0.8, 1), 2.2) + S('M17,36 C20,31 26,28.6 32,28.6', '#ffd8a0', 1.6, 0.65) + S('M29,30 C27,36 28,42 30,47', '#7a3a10', 1.2, 0.6) +
        E(12, 52, 9, 5, c.cel('#d89a48'), 2) + S('M7,50 L9,53 M11,49.4 L13,52.6 M15,49.6 L17,52.8', '#8a5020', 1.2, 0.8) +
        E(46, 51, 10, 5.4, c.rg([[0, '#ffe0a0'], [0.6, '#e8a850'], [1, '#b06a24']], 0.45, 0.35, 0.7), 2) + S('M42,50 L44,49 M48,50 L50,51.6', '#7a4010', 1.2, 0.8) +
        sparkle(32, 14, 3, '#fff4c0') + sparkle(56, 30, 2, '#fff4c0'), '#ffc060');
    },
    /* ---------- flasks ---------- */
    /* steel-grey liquid, a shield on the medallion */
    flask_iron_wall: function (c) {
      return item(c, flask(c, ['#eef2f6', '#9aa6b4', '#4a5462'], '#3a4a6a',
        P('M-4,-4.6 L4,-4.6 L4,-0.6 C4,2.8 1.8,4.6 0,5.4 C-1.8,4.6 -4,2.8 -4,-0.6 Z', c.lg(STEEL, 0, 0, 1, 1), 1.1) + S('M0,-3.8 L0,4.4 M-3.2,-0.8 L3.2,-0.8', '#5a626c', 0.8, 0.9)) +
        sparkle(52, 22, 2.6, '#ffffff'));
    },
    /* red-orange liquid, crossed blades on the medallion */
    flask_warpath: function (c) {
      var bl = 'M-4.2,4.2 L4,-4 M4.2,4.2 L-4,-4', gu = 'M-4.8,1.4 L-1.4,4.8 M4.8,1.4 L1.4,4.8';
      return item(c, flask(c, ['#ffc080', '#f0581a', '#8a1a06'], '#8a1a10', S(bl, OL, 3.2) + S(bl, '#eef2f6', 1.5) + S(gu, OL, 2.6) + S(gu, '#e8b840', 1.2)) +
        sparkle(52, 22, 2.6, '#fff0d0'));
    },
    /* calm violet-blue liquid, an open eye on the medallion */
    flask_stillmind: function (c) {
      return item(c, flask(c, ['#c8c0ff', '#6a5ae8', '#241a7a'], '#3a2a8a',
        P('M-5,0 Q0,-4.8 5,0 Q0,4.8 -5,0 Z', '#f4f0ff', 1) + C(0, 0, 2.2, c.rg([[0, '#c8b8ff'], [1, '#5a4ae0']]), 0) + C(0, 0, 0.9, OL, 0) + C(-0.7, -0.8, 0.5, '#ffffff', 0)) +
        sparkle(52, 22, 2.6, '#ece8ff') + sparkle(11, 20, 2, '#d8d0ff'));
    },
    /* ---------- activities ---------- */
    /* a battleground (#52): two crossed banner poles, a blue and a red swallowtail banner, gold finials, over trampled
     * grass; for every activity of that kind (it never borrows a boss's face) */
    battleground: function (c) {
      var fin = c.lg(['#fff0b0', GOLD, '#7a5418'], 0.2, 0, 0.8, 1);
      var pole = function (col) {
        var cloth = 'M1.6,-22 L18,-19.6 L14.6,-15 L18,-10.4 L1.6,-9 Z';
        return S2('M0,-23 L0,25', '#6a4424', 2.6) + S('M-0.7,-22 L-0.7,23', '#a8784a', 0.9, 0.7) +
          P(cloth, c.lg([[0, lt(col, 0.25)], [0.55, col], [1, dk(col, 0.35)]], 0, 0, 1, 1), 2) +
          S('M4.6,-20.6 L4.6,-10', dk(col, 0.4), 1.1, 0.7) + F('M3.6,-19.4 L12,-18.4 L3.6,-17 Z', '#ffffff', 0.2) +
          P('M0,-29 L2.4,-23.6 L0,-22.4 L-2.4,-23.6 Z', fin, 1.3);
      };
      return iconWrap(c, ['#5a4a2a', '#1a140a'],
        F('M4,53 Q32,46 60,53 L60,60 L4,60 Z', '#2e3a1a', 0.85) + S('M10,53 l1.5,-4 M17,51 l-1,-4 M47,51 l1.4,-4 M54,53 l-1.2,-3.6', '#5a7a2a', 1.2, 0.8) +
        shadow(32, 56, 20, 3) +
        G(pole('#2e62c4'), tr(32, 33, -34) + ' scale(-1,1)') +
        G(pole('#c43a2a'), tr(32, 33, 34)) +
        C(32, 33, 2.4, fin, 1.2));
    },
    /* ---------- crafted goods ---------- */
    /* a long spindle-shaped dark whetstone with a flat honed face, blue-violet specks and a leather loop */
    deepstone_whetstone: function (c) {
      var d = 'M-27,0 C-21,-6.4 -9,-7.6 0,-7.6 C9,-7.6 21,-6.4 27,0 C21,6.4 9,7.6 0,7.6 C-9,7.6 -21,6.4 -27,0 Z', r = rng(83), fl = '';
      for (var i = 0; i < 20; i++) fl += C(-21 + r() * 42, (r() - 0.5) * 10, 0.5 + r() * 0.5, r() < 0.5 ? '#b0a8f4' : '#7a8098', 0, 0.9);
      var loop = 'M-21.2,1.8 C-25,9 -18,15 -12,11 C-9,9 -12,4.6 -18.4,1.8';
      return item(c, shadow(32, 55, 25) + G(S(loop, OL, 4) + S(loop, '#8a5a30', 2) +
        P(d, c.lg(['#6a6e82', '#3a3d4c', '#1e2028'], 0, 0, 0, 1), 2.4) +
        CG(F('M-30,-9 L30,-9 L30,-2.2 L-30,-2.2 Z', c.lg(['#8a8ea4', '#5a5e72'], 0, 0, 0, 1), 0.9) + S('M-30,-2.2 L30,-2.2', '#1e2028', 1, 0.7) + fl + S('M-20,-4.8 L18,-4.8', '#ffffff', 1.2, 0.5), c.clip(d)) +
        P(d, 'none', 2.4) + C(-19.6, 1.4, 2, '#0e0e14', 1.2), tr(33, 33, -32)) +
        sparkle(53, 17, 3.8, '#eceeff') + sparkle(13, 47, 2, '#c8ccff'));
    },
    /* a fan of three thick hardened leather patches, stitched and riveted at the corners, a buckled strap across them */
    hardhide_armor_kit: function (c) {
      var pd = 'M-10,-14 L10,-14 C12,-14 13,-13 13,-11 L13,11 C13,13 12,14 10,14 L-10,14 C-12,14 -13,13 -13,11 L-13,-11 C-13,-13 -12,-14 -10,-14 Z';
      var rivet = function (x, y, rr) { rr = rr || 1.8; return C(x, y, rr, c.lg(['#f0f4f8', '#9aa4ae', '#4a525c'], 0.2, 0, 0.8, 1), 1) + C(x - rr * 0.28, y - rr * 0.3, rr * 0.32, '#ffffff', 0, 0.9); };
      var patch = function (a, col, seed) {
        return G(G(extrude(pd, 3, dk(col, 0.25)) + P(pd, c.cel(col), 2.2) +
          CG(dots(seed, 16, -12, 12, -13, 13, 0.5, 0.9, dk(col, 0.4), 0.8) + S('M-11,-9 L11,-9', lt(col, 0.3), 1.2, 0.5), c.clip(pd)) +
          SD('M-9,-10.6 L9,-10.6 L9.6,10 L-9.6,10 Z', '#d8a870', 1.1, '2.2 1.8', 0.9) +
          rivet(-8.6, -10.4) + rivet(8.6, -10.4) + rivet(-8.6, 9.6) + rivet(8.6, 9.6), 'translate(0,-21)'), 'translate(32,53) rotate(' + a + ')');
      };
      return item(c, shadow(32, 58, 25) + patch(-26, '#7a4a2a', 3) + patch(26, '#4a2c18', 5) + patch(0, '#5e3822', 7) +
        P('M5,43 L59,39 L59,46.6 L5,50.6 Z', c.lg(['#3e2816', '#24140a'], 0, 0, 0, 1), 1.6) + SD('M6,44.8 L58,40.8 M6,48.8 L58,44.8', '#a07850', 0.8, '1.6 1.4', 0.9) +
        '<rect x="40" y="39.4" width="8.4" height="10" rx="1.2" fill="none" stroke="' + OL + '" stroke-width="4" transform="rotate(-4 44.2 44.4)"/>' +
        '<rect x="40" y="39.4" width="8.4" height="10" rx="1.2" fill="none" stroke="#c8ced6" stroke-width="2" transform="rotate(-4 44.2 44.4)"/>' + S('M44.2,40.4 L44.6,48.4', '#e8ecf0', 1.3) +
        rivet(9, 56, 1.5) + rivet(13.6, 57.6, 1.5) + rivet(54, 56.6, 1.5));
    },
    /* a full dark violet bag with a turned cuff, lilac cords and an embroidered silver crescent */
    bag_duskweave: function (c) {
      return item(c, bag2(c, '#5a3684', '#46286c', '#d4c4f0',
        P(crescentD(24, 44, 5, 5), '#e0d8f4', 1.1) + SD('M12,52 C22,57.6 42,57.6 52,52', '#c8b0f0', 1.2, '2.2 1.8', 0.9) + S('M18,36 C22,34 26,34 28,36', '#ffffff', 1, 0.25)));
    },
    /* a richer deep indigo bag embroidered with gold stars and a constellation, gold-trimmed cuff, gold cords, a soft glow */
    bag_starweave: function (c) {
      var st = function (x, y, r) { return P(star(x, y, 5, r, r * 0.45), '#ffd84a', 0.8) + C(x, y, r * 0.25, '#fff8d0', 0); };
      return item(c, glow(c, 32, 38, 30, '#8a7aff', 0.32) + bag2(c, '#2c2a74', '#24225e', '#e8b840',
        S('M18,46 L26,40 L34,47 L42,41', '#e8c860', 0.8, 0.8) + st(18, 46, 2.4) + st(26, 40, 2.8) + st(34, 47, 2.2) + st(42, 41, 3) + st(22, 53, 1.8) + st(46, 52, 2) + st(38, 33, 1.6) +
        SD('M12,52 C22,57.6 42,57.6 52,52', '#e8c060', 1.2, '2.2 1.8', 0.9),
        S('M16,19.4 C22,17.6 42,17.6 48,19.4 M17,25.4 C24,28 40,28 47,25.4', '#e8b840', 1.4) + st(32, 22.6, 1.8)) +
        sparkle(52, 14, 3.2, '#fff4c0') + sparkle(10, 30, 2.2, '#fff4c0'));
    },
    /* a materials bag (beta.3): a sturdy olive satchel stuffed so full that a leaf, a lump of ore and a fish tail poke out of the top */
    bag_gatherer: function (c) {
      var ore = P('M34,13 L37,4.4 L44,3.4 L48,8.6 L45,14 Z', c.cel('#8a8a96'), 1.8) + F('M37,7 L39.4,5 L43,5 L40,8.6 Z', '#e8e8f0', 0.8) + C(43.4, 10, 1.4, '#e09040', 0) + C(39, 11, 1, '#e09040', 0);
      var tail = P('M19,15 L13.4,3 L19.4,6.4 L24.4,2.4 L24,15 Z', c.cel('#5a9ac0'), 1.8);
      return item(c, blade(c, 30, 16, -14, 1.05, '#5aa040') + tail + ore + bag2(c, '#7a7a3a', '#5e5e2a', '#d8c08a',
        SD('M12,52 C22,57.6 42,57.6 52,52', '#e0d0a0', 1.2, '2.2 1.8', 0.9) + P('M26,38 L32,34 L38,38 L38,46 L26,46 Z', c.cel('#a08a50'), 1.2) + S('M29,41 L35,41 M29,43.6 L35,43.6', '#5e4a26', 0.9)));
    },
    /* the bigger one: a deep moss-green haversack with gold cords, overflowing with a herb sprig, a violet crystal and a fish */
    bag_forager: function (c) {
      var gem = P('M37,14 L40.6,2.6 L46.6,6.6 L47,14 Z', c.lg(['#e8d0ff', '#9a60e0', '#4a2a8a'], 0, 0, 1, 1), 1.8) + F('M39.4,11 L40.8,5 L43,6.6 Z', '#ffffff', 0.65);
      var tail = P('M19,15 L13.4,3 L19.4,6.4 L24.4,2.4 L24,15 Z', c.cel('#4a9ab8'), 1.8);
      return item(c, blade(c, 31, 16, -8, 1.05, '#6ab43a') + blade(c, 28, 16, -34, 0.8, '#4a9038') + tail + gem + bag2(c, '#2e5a3a', '#24482e', '#e8b840',
        SD('M12,52 C22,57.6 42,57.6 52,52', '#e8c060', 1.2, '2.2 1.8', 0.9) + blade(c, 32, 46, 0, 0.5, '#e8c060')) + sparkle(52, 12, 2.8, '#fff4c0'));
    },
    /* ---------- profession keepsakes (skill 300) ---------- */
    /* a master miner's pickaxe: dark steel head edged in gold, a blue gem in a gold socket, banded haft */
    deepdelvers_pick: function (c) {
      var pick = S2('M0,-8 L0,30', '#5a3418', 4.6) + S('M1,-6 L1,28', '#8a5a30', 1.3, 0.7) +
        R(-3.4, 17, 6.8, 11, c.cel('#3a2414'), 1.5) + S('M-3.4,19.6 L3.4,21.6 M-3.4,23.2 L3.4,25.2', '#7a5a3a', 1, 0.8) +
        R(-3.2, 28.4, 6.4, 3.8, c.lg(GOLDS, 0, 0, 1, 0), 1.4, null, 1) + R(-3, 6, 6, 2.6, c.lg(GOLDS, 0, 0, 1, 0), 1.2) +
        P('M-26,3 C-17,-10 17,-10 26,3 L24,6 C13,-3 -13,-3 -24,6 Z', c.lg(['#b8c0d0', '#6a7488', '#343a4a'], 0, 0, 0, 1), 2.2) +
        S('M-24,2 C-15,-8 15,-8 24,2', '#f0c850', 1.5) +
        R(-6, -10.4, 12, 11.4, c.lg(GOLDS, 0, 0, 1, 1), 1.8, null, 2) +
        P('M0,-8.6 L3.6,-4.7 L0,-0.8 L-3.6,-4.7 Z', c.lg(['#d0f4ff', '#3a8ae8', '#123a8a'], 0, 0, 1, 1), 1.2) + F('M0,-8.6 L-3.6,-4.7 L0,-4.7 Z', '#ffffff', 0.55);
      return keep(c, ['#5a4a3a', '#120c08'], glow(c, 32, 26, 22, '#ffd060', 0.25) + G(pick, tr(32, 30, 32)) + sparkle(14, 46, 2.6, '#fff4c0') + sparkle(50, 14, 2.2, '#fff4c0'));
    },
    /* a leather satchel with a gold buckle, too full to close: leaves, flowers and sprigs spilling out of the top */
    herbwise_satchel: function (c) {
      var lc = '#8a5a30';
      var body = 'M11,30 L53,30 L55,55 C55,58 53,59 50,59 L14,59 C11,59 9,58 9,55 Z';
      var flap = 'M11,30 C11,26.6 53,26.6 53,30 L51,44 C42,48 22,48 13,44 Z';
      return keep(c, ['#3a5a2a', '#08120a'],
        S2('M10,34 C3,12 61,12 54,34', '#4a2c16', 2.6) +
        blade(c, 17, 30, -34, 0.78, '#5aa040') + blade(c, 24, 29, -10, 0.92, '#4a9038') + blade(c, 40, 29, 12, 0.88, '#6ab43a') + blade(c, 47, 30, 38, 0.74, '#5aa040') +
        blade(c, 32, 29, 2, 0.7, '#8aa040') + stem('M36,29 C37,22 40,17 44,15', '#5a8a3a', 1.4) +
        bloom(c, 26, 14, 7, '#f4f4ec') + bloom(c, 40, 17, 6, '#a080e0', '#ffe8a0') + bloom(c, 17, 21, 5.4, '#ff6a3a', '#ffe070') + bloom(c, 48, 23, 5, '#ffd040', '#ff9a30') +
        blade(c, 11, 34, -118, 0.6, '#5aa040') +
        P(body, c.cel(lc), 2.4) + SD('M12.6,33 L51.4,33 L53,55.4 L11,55.4 Z', '#e0b880', 1, '2 1.8', 0.75) +
        P(flap, c.cel(dk(lc, 0.18)), 2.4) + SD('M13.6,30.6 C14,29.4 50,29.4 50.4,30.6 L48.8,42 C40,45.4 24,45.4 15.2,42', '#e0b880', 1, '2 1.8', 0.8) +
        R(29.6, 43, 4.8, 11, c.cel('#4a2c16'), 1.4) +
        '<rect x="27.4" y="41.2" width="9.2" height="8" rx="1.2" fill="none" stroke="' + OL + '" stroke-width="4"/><rect x="27.4" y="41.2" width="9.2" height="8" rx="1.2" fill="none" stroke="#e8b840" stroke-width="2"/>' +
        P('M9,55 L9,58 C9,58.6 10,59 11,59 L15,59 L15,56 Z', c.cel('#e8b840'), 1.2) + P('M55,55 L55,58 C55,58.6 54,59 53,59 L49,59 L49,56 Z', c.cel('#e8b840'), 1.2));
    },
    /* a fine wolf pelt worn as a cloak: the head with its ears as a hood, the forelegs crossing at a gold clasp, a fur cape */
    hide_hunters_pelt: function (c) {
      var fur = '#8a8478', dkf = '#5a554c', r = rng(53), st = '';
      var cape = 'M18,22 C10,28 7,40 6,56 L12,53.6 L16,58 L22,54.6 L27,59 L32,55.6 L37,59 L42,54.6 L48,58 L52,53.6 L58,56 C57,40 54,28 46,22 Z';
      var head = 'M20,19 C20,11 26,8 32,8 C38,8 44,11 44,19 C44,25 38,29 32,29 C26,29 20,25 20,19 Z';
      var leg = function (x0, y0, x1, y1, side) { return P(taper(x0, y0, x1, y1, 7, side * 2), c.lg([lt(fur, 0.2), fur, dk(fur, 0.3)], 0, 0, 1, 0), 2) + S(D`M${x1 - 1.8},${y1 + 0.6} l-0.6,2.4 M${x1},${y1 + 1} l0,2.6 M${x1 + 1.8},${y1 + 0.6} l0.6,2.4`, '#f0ece0', 1, 0.9); };
      for (var i = 0; i < 40; i++) { var x = 9 + r() * 46, y = 26 + r() * 28; st += D`M${x},${y} l${0.4 + r() * 0.8},${2.6 + r() * 2} `; }
      return keep(c, ['#3a4048', '#0a0c0e'],
        P(cape, c.lg([lt(fur, 0.12), fur, dk(fur, 0.35)], 0, 0, 1, 0), 2.4) +
        CG(F('M26,20 L38,20 L42,60 L22,60 Z', dkf, 0.75) + S(st, dk(fur, 0.45), 1.1, 0.8) + S(st.replace(/M(\d+)/g, function (m, v) { return 'M' + (+v + 1.6); }), lt(fur, 0.4), 0.8, 0.6), c.clip(cape)) +
        P('M21,15 L19,3.6 L29,10 Z', c.cel(dkf), 2) + P('M43,15 L45,3.6 L35,10 Z', c.cel(dkf), 2) + F('M22,12 L21,6.6 L26,10 Z', '#c8a8a0', 0.8) + F('M42,12 L43,6.6 L38,10 Z', '#c8a8a0', 0.8) +
        P(head, c.lg([lt(fur, 0.25), fur, dk(fur, 0.3)], 0, 0, 1, 1), 2.2) + F('M28,9 L36,9 L35,20 L29,20 Z', dkf, 0.6) +
        P('M27,20 C27,26 29,30 32,31.4 C35,30 37,26 37,20 C35,18.6 29,18.6 27,20 Z', c.lg(['#e8e2d4', '#b8b0a0'], 0, 0, 0, 1), 1.8) + C(32, 30, 1.8, OL, 0) +
        S('M23.6,17.6 L27.6,19 M40.4,17.6 L36.4,19', OL, 1.6) +
        leg(24, 27, 30, 42, 1) + leg(40, 27, 34, 42, -1) +
        C(32, 41, 3.6, c.lg(GOLDS, 0, 0, 1, 1), 1.5) + C(32, 41, 1.3, '#b8401a', 0) + sparkle(54, 12, 2.4, '#fff4c0'));
    },
    /* an ornate smithing hammer: a big dark steel head banded in gold with a glowing forge rune, sparks flying */
    master_smiths_hammer: function (c) {
      var steel = c.lg(['#a8b0be', '#5a6272', '#262a34'], 0, 0, 0, 1);
      var h = S2('M0,-2 L0,33', '#5a3418', 5) + S('M1.2,0 L1.2,31', '#8a5a30', 1.4, 0.7) +
        R(-3.6, 18, 7.2, 12, c.cel('#3a2414'), 1.5) + S('M-3.6,20.4 L3.6,22.4 M-3.6,24 L3.6,26 M-3.6,27.6 L3.6,29.6', '#7a5a3a', 1, 0.8) +
        R(-3.4, 30.4, 6.8, 4, c.lg(GOLDS, 0, 0, 1, 0), 1.4, null, 1) +
        P('M-21,-16 L-16,-17.6 L-16,-1.4 L-21,-3 Z', steel, 2) + P('M21,-16 L16,-17.6 L16,-1.4 L21,-3 Z', steel, 2) +
        P('M-16,-19 L16,-19 L16,0 L-16,0 Z', steel, 2.4) + S('M-14,-16.6 L14,-16.6', '#ffffff', 1.3, 0.65) +
        R(-12.6, -19.6, 3.6, 20.2, c.lg(GOLDS, 0, 0, 1, 0), 1.4) + R(9, -19.6, 3.6, 20.2, c.lg(GOLDS, 0, 0, 1, 0), 1.4) +
        C(0, -9.4, 6.4, c.rg([[0, '#ffe0a0', 0.9], [0.5, '#ff7a1a', 0.5], [1, '#ff7a1a', 0]]), 0) +
        S('M-3,-14.6 L0,-4.4 L3,-14.6 M-2.4,-10.4 L2.4,-10.4', '#5a1a04', 3) + S('M-3,-14.6 L0,-4.4 L3,-14.6 M-2.4,-10.4 L2.4,-10.4', '#ffc050', 1.5);
      return keep(c, ['#6a3a1a', '#140804'], glow(c, 34, 22, 20, '#ff8a2a', 0.3) + G(h, tr(33, 31, 20)) +
        C(12, 18, 1.4, '#ffb040', 0) + C(16, 10, 1.1, '#ffd070', 0) + C(52, 12, 1.2, '#ff8a2a', 0) + C(55, 22, 1, '#ffb040', 0, 0.8) + sparkle(10, 26, 2.6, '#fff0c0'));
    },
    /* three fine hides rolled tight and stacked end-on (spirals facing you), bound by a strap with a gold buckle */
    tanners_rolled_hides: function (c) {
      var roll = function (x, y, r, col, seed) {
        var sp = '', n = 46, turns = 3.2, a0 = seed;
        for (var i = 0; i <= n; i++) { var t = i / n, rr = r * (0.12 + 0.8 * t), a = a0 + t * turns * Math.PI * 2; sp += (i ? 'L' : 'M') + r1(x + Math.cos(a) * rr) + ',' + r1(y + Math.sin(a) * rr * 0.96); }
        var ea = a0 + turns * Math.PI * 2, ex = x + Math.cos(ea) * r * 0.92, ey = y + Math.sin(ea) * r * 0.92;
        return E(x + 5, y - 4, r, r * 0.96, c.cel(dk(col, 0.3)), 2.2) +
          P(D`M${x - r * 0.62},${y - r * 0.78} L${x - r * 0.62 + 5},${y - r * 0.78 - 4} L${x + r * 0.62 + 5},${y + r * 0.78 - 4} L${x + r * 0.62},${y + r * 0.78} Z`, dk(col, 0.3), 0) +
          C(x, y, r, c.rg([[0, lt(col, 0.25)], [0.7, col], [1, dk(col, 0.25)]], 0.4, 0.4, 0.7), 2.2) + S(sp, dk(col, 0.5), 1.3, 0.9) + S(sp, lt(col, 0.3), 0.6, 0.5) +
          P(D`M${ex - 2},${ey - 1} L${ex + 3},${ey - 4} L${ex + 2},${ey + 1} Z`, c.cel(col), 1.2);
      };
      var hull = 'M7,46 C7,58 18,59.4 32,57.6 C46,59.4 57,58 57,46 C57,38 47,32 44.6,23 C42,10 22,10 19.4,23 C17,32 7,38 7,46 Z';
      return keep(c, ['#5a3a22', '#120a04'],
        S2('M16,20 C4,24 4,46 14,52', '#3a2414', 2.6) + S2('M48,20 C60,24 60,46 50,52', '#3a2414', 2.6) +
        shadow(32, 59, 25) + roll(20, 45, 12.4, '#8a5a32', 0.4) + roll(44, 45, 12.4, '#5a3620', 2.1) + roll(32, 24, 12.4, '#b8844c', 4.2) +
        S(hull, OL, 5.6) + S(hull, '#3a2414', 3.2) + S(hull, '#6a4a2a', 0.9, 0.7) +
        '<rect x="44" y="27" width="8" height="7" rx="1" fill="none" stroke="' + OL + '" stroke-width="3.8" transform="rotate(30 48 30.5)"/>' +
        '<rect x="44" y="27" width="8" height="7" rx="1" fill="none" stroke="#e8b840" stroke-width="1.8" transform="rotate(30 48 30.5)"/>' +
        sparkle(54, 12, 2.4, '#fff4c0'));
    },
    /* a great drop spindle: a fat cone of rose thread wound on the shaft with a gold band, an ornate gold whorl with gems,
     * a loose thread trailing from the top */
    weavers_spindle: function (c) {
      var th = '#d890c0', wind = '', i;
      var cone = 'M32,14 C41,20 45,30 43,40 C41,46 37,48 32,48 C27,48 23,46 21,40 C19,30 23,20 32,14 Z';
      for (i = 0; i < 14; i++) wind += D`M16,${16 + i * 2.4} C24,${18.6 + i * 2.4} 40,${18.6 + i * 2.4} 48,${16 + i * 2.4} `;
      var g = S2('M32,5 L32,58', '#8a5a30', 2.6) + S2('M32,6 C32,1.6 36.6,1.6 36.6,5', '#e8b840', 1.3) +
        P(cone, c.lg([lt(th, 0.4), th, dk(th, 0.35)], 0, 0, 1, 0), 2.2) +
        CG(S(wind, dk(th, 0.3), 0.8, 0.75) + R(14, 30, 36, 5, c.lg(['#fff2b8', '#e0a830', '#8a5a10'], 0, 0, 1, 0), 0) + S('M14,30 L50,30 M14,35 L50,35', OL, 1) +
          S('M24.6,24 C23.6,30 23.6,38 25.6,44', '#ffffff', 1.6, 0.45), c.clip(cone)) +
        E(32, 52.4, 17, 5.4, c.lg(['#8a5a10', '#e0a830', '#fff2b8'], 0, 0, 0, 1), 2) + E(32, 50.8, 17, 5, c.lg(GOLDS, 0, 0, 1, 0), 2) +
        ringO(32, 50.8, 12.6, 3.6, '#8a5a10', 1, 0.8) + C(19.4, 50.8, 1.6, '#e84a6a', 1) + C(44.6, 50.8, 1.6, '#4a8ae8', 1) + C(32, 54.6, 1.6, '#4ac06a', 1) +
        P('M30.6,57 L33.4,57 L32,62 Z', c.cel('#8a5a30'), 1.2) +
        S2('M36.6,5 C46,4 56,10 53,20 C51,27 56,32 59,33', th, 1.1);
      return keep(c, ['#4a2a5a', '#0e0612'], G(g, 'rotate(10 32 34)') + sparkle(12, 16, 2.6, '#fff4c0') + sparkle(48, 58, 2, '#fff4c0'));
    },
    /* a leather bandolier across the back holding four glowing vials (red, green, blue, gold), a gold buckle */
    alchemists_bandolier: function (c) {
      var band = 'M0,15 L64,40 L64,52 L0,27 Z';
      var loop = function (x, y) { var a = Math.atan2(25, 64) * 180 / Math.PI; return G(R(-5.4, -2.6, 10.8, 5.2, c.cel('#7a4a28'), 1.4) + S('M-5,-1.6 L5,-1.6', '#d8a870', 0.8, 0.6), tr(x, y, a)); };
      var ys = function (x) { return 21 + x * 25 / 64; };
      return keep(c, ['#2a4a4a', '#060e0e'],
        P(band, c.lg(['#8a5a32', '#5a3418', '#3a2010'], 0, 0, 0, 1), 2.2) + CG(SD('M0,17.4 L64,42.4 M0,24.6 L64,49.6', '#d8a870', 1, '2.2 1.8', 0.8), c.clip(band)) +
        vialG(c, 14, ys(14) - 3, '#f04a2a') + vialG(c, 26, ys(26) - 3, '#4ac040') + vialG(c, 38, ys(38) - 3, '#3a7af0') + vialG(c, 50, ys(50) - 3, '#f0b020') +
        loop(14, ys(14) + 1) + loop(26, ys(26) + 1) + loop(38, ys(38) + 1) + loop(50, ys(50) + 1) +
        G('<rect x="-4.6" y="-5" width="9.2" height="10" rx="1.2" fill="none" stroke="' + OL + '" stroke-width="4"/><rect x="-4.6" y="-5" width="9.2" height="10" rx="1.2" fill="none" stroke="#e8b840" stroke-width="2"/>' + S('M0,-4 L0,4', '#fff2b8', 1.2), tr(5, 21, 21)));
    },
    /* a tall straight-walled copper stockpot with brass loop handles and a gold band, a ladle standing in the stew, steam */
    chefs_stewpot: function (c) {
      var pot = 'M12,27 L52,27 L50,52 C50,55 48,56.4 45,56.4 L19,56.4 C16,56.4 14,55 14,52 Z';
      var cu = c.lg([[0, '#f8b880'], [0.35, '#d8743a'], [1, '#6a2a10']], 0, 0, 1, 0.3);
      return keep(c, ['#7a4a1a', '#160a04'],
        S2('M13,31 C5,31 5,40 13.6,40', '#e8b840', 2) + S2('M51,31 C59,31 59,40 50.4,40', '#e8b840', 2) +
        S2('M38,28 L50,6', '#c8ccd4', 2.6) + C(51, 4.6, 2.2, 'none', 1.2) +
        P(pot, cu, 2.4) + CG(S('M17,31 L18,52', '#ffffff', 2, 0.45) + S('M12,42 L52,42', OL, 4.6) + S('M12,42 L52,42', '#e8b840', 2.6) + S('M12,46 L52,46', '#a85a28', 1, 0.6), c.clip(pot)) +
        C(32, 42, 3.2, c.lg(GOLDS, 0, 0, 1, 1), 1.4) +
        E(32, 27, 20.6, 5.6, c.lg(['#8a4a20', '#f0a060'], 0, 0, 0, 1), 2.4) + ringO(32, 27, 20.6, 5.6, '#e8b840', 1, 0.8) +
        E(32, 27.6, 17.6, 3.8, c.lg(['#d87a32', '#8a3a12'], 0, 0, 0, 1), 1.2) +
        C(25, 27.4, 2.2, c.cel('#a0502a'), 1) + C(33, 28.2, 1.8, c.cel('#f08a2a'), 1) + C(29, 26.6, 1.2, '#ffd890', 0, 0.9) + C(41, 27.6, 1.2, '#5aa040', 0) +
        S2('M38,28 L41.6,21.4', '#c8ccd4', 2.6) + steam(24, 20, 0.85, 0.55) + steam(32, 18, 1, 0.6));
    },
    /* a fine fishing rod: tapered wood with gold ferrules and guides, a big ornate gold reel, the line ending in a feathered fly */
    anglers_rod: function (c) {
      var rod = taper(10, 58, 58, 6, 4.8, 0);
      var at_ = function (t) { return [10 + 48 * t, 58 - 52 * t]; };
      var fer = function (t) { var p = at_(t), w = 4.6 * (1 - t) + 1.4; return S(D`M${p[0] - w * 0.55},${p[1] - w * 0.5} L${p[0] + w * 0.55},${p[1] + w * 0.5}`, OL, 3.4) + S(D`M${p[0] - w * 0.55},${p[1] - w * 0.5} L${p[0] + w * 0.55},${p[1] + w * 0.5}`, '#e8b840', 1.8); };
      var guide = function (t) { var p = at_(t); return C(p[0] - 1.8, p[1] - 1.8, 1.3, 'none', 0.9); };
      return keep(c, ['#1a4a5a', '#04121a'],
        S('M58,6 C62,22 56,34 47,39', '#f4f4ec', 1, 0.95) +
        guide(0.42) + guide(0.62) + guide(0.8) +
        P(rod, c.lg(['#d8a060', '#8a5a30', '#5a3418'], 0, 0, 1, 1), 1.8) +
        S('M11,56.6 L19,47.6', '#e8d0a0', 5.6) + S2('M10,58 L19,47.6', '#d8b880', 3.8) + S('M11.6,55 L13.4,53 M14.6,51.4 L16.6,49.4', '#a08050', 1, 0.8) +
        fer(0.2) + fer(0.4) + fer(0.6) + fer(0.8) +
        C(25, 50, 6.6, c.lg(GOLDS, 0, 0, 1, 1), 2) + C(25, 50, 4, '#3a2a14', 1.2) + S('M25,46.4 L25,53.6 M21.4,50 L28.6,50', '#e8b840', 1.2) + C(25, 50, 1.4, c.cel('#e8b840'), 0.9) +
        S2('M25,50 L31,54', '#e8b840', 1.3) + C(31.6, 54.4, 1.8, c.cel('#c8925a'), 1.1) +
        G(P('M0,0 C-3.6,-2 -5.6,-6.4 -4.6,-10 C-1.6,-7.6 0.6,-4 0,0 Z', c.cel('#e83a2a'), 1.2) + P('M0,0 C3.6,-2 5.6,-6.4 4.6,-10 C1.6,-7.6 -0.6,-4 0,0 Z', c.cel('#ffd040'), 1.2) +
          S2('M0,0 L0,4 C0,7 3,7 3,4.6', '#d8dce4', 0.9), tr(47, 39, -20)) +
        sparkle(14, 14, 2.6, '#fff4c0') + sparkle(54, 50, 2.2, '#c8f0ff'));
    }
  };

  /* ================= gathering nodes (96x96, transparent; same style as the art_icons3.js nodes) ================= */
  var NSW = 3.4;   /* node outline: ~1.6px once the node is shown ~46px wide */
  function nshadow(c, rx) { return E(48, 86, rx || 40, 7, c.rg([[0, '#000', 0.45], [0.65, '#000', 0.25], [1, '#000', 0]]), 0); }
  function flat(pts, y) { return pts.map(function (p) { return [p[0], Math.min(p[1], y)]; }); }
  function nrock(c, cx, cy, rx, ry, seed, col, inner) {
    var d = blob(flat(lump(cx, cy, rx, ry, seed, 9, 0.22), 86)), cl = c.clip(d);
    return P(d, c.cel(col), NSW) + CG(F('M' + r1(cx - rx * 0.1) + ',0 L96,0 L96,96 L' + r1(cx + rx * 0.2) + ',96 C' + r1(cx + rx * 0.5) + ',' + r1(cy) + ' ' + r1(cx + rx * 0.2) + ',' + r1(cy - ry * 0.5) + ' ' + r1(cx - rx * 0.1) + ',0 Z', dk(col, 0.3), 0.8) +
      E(cx - rx * 0.35, cy - ry * 0.5, rx * 0.3, ry * 0.14, lt(col, 0.35), 0, 0.7) + (inner || ''), cl);
  }
  function nvein(pts, deep, col, w) { var d = pl(pts); return S(d, deep, w + 3) + S(d, col, w) + S(d, lt(col, 0.5), w * 0.35, 0.8); }
  function nnug(c, x, y, r, cols, seed) { var d = pl(lump(x, y, r, r * 0.8, seed, 6, 0.4)) + 'Z'; return P(d, c.lg(cols, 0.2, 0, 0.8, 1), 2) + C(x - r * 0.3, y - r * 0.3, r * 0.3, '#ffffff', 0, 0.9); }
  /* big outcrop (inner drawn clipped to it) plus two small loose rocks */
  function outcrop(c, rock, seed, inner, small) {
    return nshadow(c, 42) + nrock(c, 50, 58, 32, 30, seed, rock, inner) +
      nrock(c, 20, 80, 14, 10, 17, dk(rock, 0.08), small || '') + nrock(c, 80, 82, 12, 8, 23, lt(rock, 0.05));
  }
  function nblade(c, x, y, a, s, col, w) { return G(P('M0,0 C' + (w || 5) + ',-8 ' + (w || 5) + ',-24 0,-34 C-' + (w || 5) + ',-24 -' + (w || 5) + ',-8 0,0 Z', c.lg([lt(col, 0.3), col, dk(col, 0.35)], 0, 0, 1, 0), 2.2) + S('M0,-2 L0,-28', dk(col, 0.45), 1.2, 0.8), tr(x, y, a, s)); }
  function nstem(d, col, w) { return S(d, OL, w + 3) + S(d, col, w); }
  /* an item-icon herb glyph (base at 32,59 in the 64 box) planted at the node's ground line (48,86), scale s */
  function plant(g, s, dx) { return G(g, 'matrix(' + s + ',0,0,' + s + ',' + r1(48 + (dx || 0) - 32 * s) + ',' + r1(86 - 59 * s) + ')'); }
  function phNode(c) {
    var d = blob(flat(lump(48, 68, 24, 20, 5, 8, 0.2), 86));
    return nshadow(c, 30) + P(d, c.cel('#8a8a86'), NSW) + CG(F('M50,40 L96,40 L96,96 L54,96 Z', '#000', 0.2), c.clip(d));
  }

  var NODES = {
    /* dark blue-grey outcrop banded with dusk-violet metal seams and violet-steel nuggets, a faint violet glow */
    duskiron: function (c) {
      return C(50, 56, 36, c.rg([[0, '#8a6ad8', 0.32], [1, '#8a6ad8', 0]]), 0) +
        outcrop(c, '#3c4254', 61,
          nvein([[20, 50], [34, 44], [48, 50], [62, 40], [82, 44]], '#1c1830', '#6e62a8', 4.4) + nvein([[20, 68], [36, 62], [52, 68], [70, 58], [84, 62]], '#1c1830', '#6e62a8', 4) +
          nnug(c, 34, 44, 5.6, DUSK, 3) + nnug(c, 62, 40, 5, DUSK, 5) + nnug(c, 52, 68, 5, DUSK, 7) + nnug(c, 72, 57, 3.6, DUSK, 9) + nnug(c, 28, 62, 3.4, DUSK, 11),
          nnug(c, 20, 78, 3, DUSK, 13)) +
        sparkle(62, 38, 5, '#ece6ff') + sparkle(30, 32, 3, '#d8ccff');
    },
    /* a dark slate outcrop with pale moonsilver crystals growing out of its top, a cool blue glow and a crescent glint */
    moonsilver: function (c) {
      return C(50, 50, 40, c.rg([[0, '#9ad0ff', 0.45], [1, '#9ad0ff', 0]]), 0) +
        outcrop(c, '#323a4c', 67, nvein([[22, 66], [38, 60], [54, 68], [78, 60]], '#3a4a66', '#e8f2ff', 3) + nnug(c, 38, 60, 4.6, MOON, 3) + nnug(c, 66, 64, 4, MOON, 5)) +
        moonCrystal(c, 34, 50, -32, 1.1) + moonCrystal(c, 64, 47, 28, 1.15) + moonCrystal(c, 49, 45, -2, 1.5) + moonCrystal(c, 76, 58, 56, 0.75) +
        P(crescentD(78, 18, 5.6, 5.6), '#f0f8ff', 1.8) + sparkle(49, 12, 6, '#ffffff') + sparkle(22, 34, 3.4, '#d8ecff');
    },
    /* the ember flower grown big over a patch of ash with glowing cracks, sparks rising */
    cinderbloom: function (c) {
      return nshadow(c, 34) + E(48, 85, 30, 5.6, c.rg([[0, '#3a3430'], [0.8, '#2a2420', 0.8], [1, '#2a2420', 0]]), 0) +
        S('M26,85 L32,83 L38,86 M56,84 L62,86 L68,84', '#ff6a14', 1.6, 0.9) +
        plant(NEW.cinderbloom(c, true), 1.55) +
        C(24, 22, 2, '#ffb040', 0) + C(72, 18, 1.6, '#ffd070', 0) + C(78, 36, 1.5, '#ff8a2a', 0) + C(18, 40, 1.4, '#ffb040', 0, 0.8);
    },
    /* the swamp mushroom cluster, a few pale spore motes */
    gloomcap: function (c) {
      return nshadow(c, 36) + plant(NEW.gloomcap(c, true), 1.5) + C(20, 28, 1.6, '#d8f0e8', 0, 0.8) + C(78, 34, 1.4, '#d8f0e8', 0, 0.7) + C(62, 12, 1.2, '#d8f0e8', 0, 0.7);
    },
    /* the veil flower hanging from its bowed stem, a warm glint */
    sunveil: function (c) {
      return nshadow(c, 32) + plant(NEW.sunveil(c, true), 1.55, -2) + sparkle(18, 26, 3.6, '#fffbe0') + sparkle(80, 66, 3, '#fff2a0');
    },
    /* the crystal flower over a patch of frost, rime crystals round it */
    frostpetal: function (c) {
      return nshadow(c, 32) + E(48, 85, 28, 5, c.rg([[0, '#f0faff', 0.85], [1, '#c8e8ff', 0]]), 0) +
        plant(NEW.frostpetal(c, true), 1.5) + flake(18, 80, 3) + flake(78, 81, 2.6) + flake(16, 40, 2.6) + sparkle(78, 26, 4, '#ffffff');
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
  var baseNode = typeof ART.node === 'function' ? ART.node : null;
  function makeNode(k) {
    try { var c = new Ctx(); return c.svg(96, 96, (has(NODES, k) ? NODES[k] : phNode)(c)); } catch (e) {
      try { var c2 = new Ctx(); return c2.svg(96, 96, phNode(c2)); } catch (e2) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96"></svg>'; }
    }
  }
  ART.node = function (k) {
    if (has(NODES, k) || !baseNode) return makeNode(k);
    try { return baseNode.apply(this, arguments); } catch (e) { return makeNode('__none__'); }
  };
  ART.keys = ART.keys || {};
  var list = Array.isArray(ART.keys.icons) ? ART.keys.icons : (ART.keys.icons = []);
  Object.keys(NEW).forEach(function (k) { if (list.indexOf(k) < 0) list.push(k); });
  var nlist = Array.isArray(ART.keys.nodes) ? ART.keys.nodes : (ART.keys.nodes = []);
  Object.keys(NODES).forEach(function (k) { if (nlist.indexOf(k) < 0) nlist.push(k); });
})(typeof window !== 'undefined' ? window : this);
