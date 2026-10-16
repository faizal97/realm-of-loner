/* art_legends.js — Legend characters for Realm of Loner. First legend: Lyveus Cloveus, the Exiled Knight, a wood elf
 * paladin (an original character by a friend of the developer, redrawn from his reference drawing in the game's style).
 *   legend  lyveus               ART.legend(key): a party / world sprite in exactly the ART.hero format
 *                                (128x128, facing RIGHT, feet on y=122, shadow at y=122.5). ART.legend.keys lists the keys.
 *                                Unknown keys return ART.hero({ cls: 'paladin', race: 'human' }).
 *   actors  lyveus, vyn          ART.story.actor: 160x160 transparent, facing LEFT, feet on the bottom edge
 *   scene   silverleaf_lodge     ART.scene: 400x240, the wood elf lodge in the Kinloch pines, burned two years ago, at sunset
 *   mob     lord_cassius_marrow  ART.mob: 128x128, facing LEFT, feet on y=122 (open-world elite, Lady Thorne's cabal)
 *   icons   legend_lyveus, oathbound_strike, ancients_bulwark, silverleaf_aegis   ART.icon: 64x64
 * Second batch (the hooded-wanderer stage and the Theater lore cutscene):
 *   legend  lyveus_hooded        the same sprite format: a deep moss-green travel cloak, hood up, face in shadow but for
 *                                the chin and one eye glint, the shield wrapped in cloth on his back, the same sword
 *   actors  lyveus_hooded        the same disguise in the actor format, sword point lowered
 *           deathwing            Ossarak, the Black Ruin: wings spread, bolted iron plates, molten cracks, fire in his jaws
 *   story scenes (480x270)       silverleaf_burning (the lodge on fire at night, hooded riders leaving),
 *                                caravan_road (the ambushed Kingsmere wagon, the burst of holy light mid-road)
 * Loads AFTER every other art pack (art_story.js and art_story2.js included) and EXTENDS window.ART: ART.scene, ART.mob,
 * ART.icon, ART.story.scene and ART.story.actor handle the keys above and fall through to the previous functions for
 * every other key (prototype keys included). Keys are appended to ART.keys.scenes / mobs / icons and
 * ART.story.keys.scenes / actors. Self-contained: helpers are copies of the zone packs'. Never throws.
 * Lyveus's look (from the reference): pale skin, long swept-back pointed ears, short swept mint hair, eager open mouth;
 * sage-green padded vest with a high dark collar and a cross-laced front, grey-green shoulder guards, white sleeves and
 * leggings, brown strapped gloves, grey-green greaves with pointed knee guards; a long dark-steel sword with white
 * glints; a pale green-gold kite shield with a leaf emblem and a pearl at its centre.
 * Style: bold dark outlines (#1a1009), 2-3 tone cel shading via hard-stop gradients, no text, no images, no filters,
 * ids unique per call (prefix lg<counter>_).
 */
(function (root) {
  'use strict';
  var W = root || {};
  var ART = (W.ART && (typeof W.ART === 'object' || typeof W.ART === 'function')) ? W.ART : {};
  try { if (W.ART !== ART) W.ART = ART; } catch (e) { }
  var OL = '#1a1009';
  var SEQ = 0;
  var SWM = 1; // stroke multiplier, lowered while a figure is drawn scaled up (story actors, portrait)
  var PI = Math.PI;

  // ---------- colour + number helpers ----------
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rgb(h) {
    h = String(h || '').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var v = parseInt(h, 16);
    if (isNaN(v)) v = 0x808080;
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }
  function hex(a) { return '#' + a.map(function (v) { var s = Math.round(clamp(v, 0, 255)).toString(16); return s.length < 2 ? '0' + s : s; }).join(''); }
  function mix(a, b, t) { var x = rgb(a), y = rgb(b); return hex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]); }
  function lt(c, t) { return mix(c, '#ffffff', t); }
  function dk(c, t) { return mix(c, '#000000', t); }
  function n(v) { v = +v; return isFinite(v) ? Math.round(v * 10) / 10 : 0; }
  function pt(p) { return n(p[0]) + ',' + n(p[1]); }
  function pd(a, close) { return 'M' + a.map(pt).join('L') + (close ? 'Z' : ''); }
  function lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
  function rng(seed) { var s = seed >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // ---------- per-call context (unique ids, defs) ----------
  function Ctx() { this.p = 'lg' + (SEQ++).toString(36) + '_'; this.k = 0; this.defs = []; this.cache = {}; }
  Ctx.prototype.id = function () { return this.p + (this.k++).toString(36); };
  function stopsS(st) {
    return st.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '/>'; }).join('');
  }
  Ctx.prototype.lg = function (st, x1, y1, x2, y2) {
    if (x1 == null) { x1 = 0; y1 = 0; x2 = 0; y2 = 1; }
    var key = 'l' + JSON.stringify(st) + [x1, y1, x2, y2].join();
    if (this.cache[key]) return this.cache[key];
    var id = this.id();
    this.defs.push('<linearGradient id="' + id + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '">' + stopsS(st) + '</linearGradient>');
    return (this.cache[key] = 'url(#' + id + ')');
  };
  Ctx.prototype.rg = function (st, cx, cy, r) {
    if (cx == null) { cx = 0.5; cy = 0.5; r = 0.5; }
    var key = 'r' + JSON.stringify(st) + [cx, cy, r].join();
    if (this.cache[key]) return this.cache[key];
    var id = this.id();
    this.defs.push('<radialGradient id="' + id + '" cx="' + cx + '" cy="' + cy + '" r="' + r + '">' + stopsS(st) + '</radialGradient>');
    return (this.cache[key] = 'url(#' + id + ')');
  };
  Ctx.prototype.cel = function (col) { return this.lg([[0, lt(col, 0.3)], [0.4, col], [0.72, col], [1, dk(col, 0.38)]], 0.2, 0, 0.8, 1); };
  Ctx.prototype.clip = function (d) { var id = this.id(); this.defs.push('<clipPath id="' + id + '"><path d="' + d + '"/></clipPath>'); return 'url(#' + id + ')'; };
  Ctx.prototype.svg = function (w, h, body) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">' +
      (this.defs.length ? '<defs>' + this.defs.join('') + '</defs>' : '') + body + '</svg>';
  };
  function glow(c, col, a) { a = a == null ? 0.6 : a; return c.rg([[0, col, a], [0.4, col, a * 0.45], [1, col, 0]]); }

  // ---------- primitives ----------
  function stk(w) { return w ? ' stroke="' + OL + '" stroke-width="' + n(w * SWM) + '" stroke-linejoin="round" stroke-linecap="round"' : ''; }
  function opa(o) { return o != null && o < 1 ? ' opacity="' + o + '"' : ''; }
  function P(d, fill, w, o) { return '<path d="' + d + '" fill="' + (fill || 'none') + '"' + stk(w) + opa(o) + '/>'; }
  function F(d, fill, o) { return P(d, fill, 0, o); }
  function L(d, col, w, o) { return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + n(w) + '" stroke-linecap="round" stroke-linejoin="round"' + opa(o) + '/>'; }
  function E(cx, cy, rx, ry, fill, w, o, rot) {
    return '<ellipse cx="' + n(cx) + '" cy="' + n(cy) + '" rx="' + n(rx) + '" ry="' + n(ry) + '" fill="' + fill + '"' + stk(w) + opa(o) +
      (rot ? ' transform="rotate(' + n(rot) + ' ' + n(cx) + ' ' + n(cy) + ')"' : '') + '/>';
  }
  function C(cx, cy, r, fill, w, o) { return E(cx, cy, r, r, fill, w, o); }
  function R(x, y, w, h, fill, sw, o) { return '<rect x="' + n(x) + '" y="' + n(y) + '" width="' + n(w) + '" height="' + n(h) + '" fill="' + fill + '"' + stk(sw) + opa(o) + '/>'; }
  function G(s, tf, o) { return '<g' + (tf ? ' transform="' + tf + '"' : '') + opa(o) + '>' + s + '</g>'; }
  function CG(s, clip) { return '<g clip-path="' + clip + '">' + s + '</g>'; }
  // outlined limb: dark stroke under a coloured stroke, optional shade stripe
  function tube(pts, w, col, sh) {
    var d = pd(pts);
    return L(d, OL, w + 4.4 * SWM) + L(d, col, w) + (sh ? '<path transform="translate(' + n(w * 0.24) + ',' + n(w * 0.08) + ')" d="' + d + '" fill="none" stroke="' + sh + '" stroke-width="' + n(w * 0.36) + '" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>' : '');
  }
  function shadow(c, cx, rx, y) { return E(cx, y || 122.5, rx, Math.max(3, rx * 0.16), c.rg([[0, '#000', 0.45], [0.65, '#000', 0.25], [1, '#000', 0]])); }
  function sparkle(x, y, r, col, o) { return F('M' + n(x) + ',' + n(y - r) + 'Q' + n(x + r * 0.15) + ',' + n(y - r * 0.15) + ' ' + n(x + r) + ',' + n(y) + 'Q' + n(x + r * 0.15) + ',' + n(y + r * 0.15) + ' ' + n(x) + ',' + n(y + r) + 'Q' + n(x - r * 0.15) + ',' + n(y + r * 0.15) + ' ' + n(x - r) + ',' + n(y) + 'Q' + n(x - r * 0.15) + ',' + n(y - r * 0.15) + ' ' + n(x) + ',' + n(y - r) + 'Z', col, o); }
  // a leaf pointing along -y from (0,0), length s*10
  function leafD(s) { return 'M0,0 C' + n(-4 * s) + ',' + n(-2 * s) + ' ' + n(-4.4 * s) + ',' + n(-7 * s) + ' 0,' + n(-10.5 * s) + ' C' + n(4.4 * s) + ',' + n(-7 * s) + ' ' + n(4 * s) + ',' + n(-2 * s) + ' 0,0 Z'; }
  function leaf(c, x, y, a, s, col) {
    col = col || '#8ad05a';
    return G(P(leafD(s), c.lg([[0, lt(col, 0.35)], [1, dk(col, 0.25)]], 0, 0, 1, 0), 1.1) + L('M0,' + n(-1 * s) + ' L0,' + n(-8.6 * s), dk(col, 0.35), 0.7), 'translate(' + n(x) + ',' + n(y) + ') rotate(' + n(a) + ')');
  }

  // =====================================================================
  // LYVEUS: one rig, drawn FACING RIGHT in hero-sprite coordinates (128 box, feet on 122).
  // The story actor is the same rig in another pose, mirrored and scaled.
  // =====================================================================
  var LY = {
    skin: '#f5e1d6', skinD: '#d8b4ae', hair: '#9fe3c9', hairD: '#58ab96', hairL: '#e0fff3',
    vest: '#8da585', vestD: '#627a5e', collar: '#3c5848', guard: '#a4b59c', white: '#f2f4f3', whiteD: '#c2cad3',
    glove: '#71472a', strap: '#3a2414', greave: '#7f917c', eye: '#34a484'
  };
  // the sprite pose (party slot, town)
  var POSE_SPRITE = {
    head: [69, 27, 10.5], bSh: [57, 48], bEl: [50, 60], bHd: [51, 70], fSh: [76, 48], fEl: [86, 57], fHd: [93, 63],
    bHip: [61, 80], bKn: [57.5, 99], bFt: [54, 117], fHip: [68, 80], fKn: [73.5, 99], fFt: [77, 117],
    shield: [44, 71, 0.84, -8], sword: [30, 56], tail: 0
  };
  // the story pose: sword raised high and forward, shield up, a wide heroic stance
  var POSE_ACTOR = {
    head: [70, 27, 10.5], bSh: [57, 48], bEl: [49, 59], bHd: [55, 66], fSh: [76, 48], fEl: [87, 44], fHd: [97, 44],
    bHip: [61, 80], bKn: [52, 99], bFt: [44, 117], fHip: [68, 80], fKn: [82, 96], fFt: [86, 117],
    shield: [48, 66, 0.9, -4], sword: [42, 54], tail: 1
  };

  function kiteD() { return 'M-12,-15 C-5,-18.5 5,-18.5 12,-15 L12.5,-4 C12,7 6,14 0,21 C-6,14 -12,7 -12.5,-4 Z'; }
  // the leaf-and-pearl kite shield, centred on (0,0), about 25 x 40 at scale 1
  function kite(c) {
    var inner = 'M-9.6,-12.8 C-4,-15.6 4,-15.6 9.6,-12.8 L10,-4 C9.6,5.6 4.8,11.6 0,17.4 C-4.8,11.6 -9.6,5.6 -10,-4 Z';
    var o = P(kiteD(), c.lg([[0, '#9aa852'], [0.55, '#76853a'], [1, '#4e5a24']], 0.2, 0, 0.8, 1), 2.4);
    o += P(inner, c.lg([[0, '#fafbdc'], [0.35, '#e6edaa'], [0.7, '#cbd889'], [1, '#a4b663']], 0.15, 0, 0.85, 1), 1.1);
    o += CG(F('M-11,-2 L-1,-17 L4.5,-17 L-11,8 Z', '#ffffff', 0.5) + F('M-11,12 L7,-17 L8.6,-17 L-11,15 Z', '#ffffff', 0.35), c.clip(inner));
    // the leaf emblem, flame-like, cupping the pearl
    var lf = 'M0,-12.5 C2.6,-9.6 6.4,-7 6.6,-2 C6.8,1.6 5.4,4.4 3.4,5.8 L5.6,8 C3,8 1.4,8.6 0,10.4 C-1.4,8.6 -3,8 -5.6,8 L-3.4,5.8 C-5.4,4.4 -6.8,1.6 -6.6,-2 C-6.4,-7 -2.6,-9.6 0,-12.5 Z';
    o += P(lf, c.lg([[0, '#ffffff'], [0.6, '#eef4c8'], [1, '#bccb7c']], 0, 0, 0, 1), 1.1);
    o += L('M0,-10 L0,-2.5 M0,-7 L-2.6,-8.8 M0,-7 L2.6,-8.8 M0,-4 L-3.6,-6 M0,-4 L3.6,-6', '#7f9046', 0.8);
    o += C(0, 2.2, 3.7, c.rg([[0, '#ffffff'], [0.5, '#eef1f8'], [1, '#98a6c4']], 0.36, 0.34, 0.72), 1.3) + C(-1.2, 1, 1.05, '#ffffff');
    return o;
  }
  // long straight sword along -y from the grip centre (0,0): dark steel blade, white glints, a crossguard
  function lsword(c, len) {
    var bw = 2.8, o = '';
    var blade = 'M' + n(-bw) + ',-6 L' + n(-bw * 0.86) + ',' + n(-len + 7) + ' L0,' + n(-len) + ' L' + n(bw * 0.86) + ',' + n(-len + 7) + ' L' + n(bw) + ',-6 Z';
    o += P(blade, c.lg([[0, '#a4adb8'], [0.4, '#626a76'], [0.6, '#4a515b'], [1, '#2a2e35']], 0, 0, 1, 0), 1.9);
    o += L('M0,-9 L0,' + n(-len + 9), '#262a30', 1, 0.9);
    [0.3, 0.62].forEach(function (t) {
      var y = -6 - (len - 12) * t;
      o += F('M' + n(-bw + 0.6) + ',' + n(y + 2.4) + ' L' + n(bw - 0.6) + ',' + n(y - 2.2) + ' L' + n(bw - 0.6) + ',' + n(y - 0.9) + ' L' + n(-bw + 0.6) + ',' + n(y + 3.7) + ' Z', '#ffffff', 0.95);
    });
    o += L('M' + n(-bw * 0.55) + ',-10 L' + n(-bw * 0.5) + ',' + n(-len + 12), '#ffffff', 0.7, 0.5);
    o += F('M' + n(-bw * 0.5) + ',' + n(-len + 8) + ' L0,' + n(-len + 1.5) + ' L0,' + n(-len + 8) + ' Z', '#ffffff', 0.8);
    o += R(-2.1, -4.6, 4.2, 10.6, '#5a3a22', 1.5) + L('M-2,-2.2 L2,-0.8 M-2,1 L2,2.4 M-2,4 L2,5.2', '#2e1c10', 0.9);
    o += P('M-10.5,-8.4 C-6,-7.2 6,-7.2 10.5,-8.4 L11.4,-5.4 C6,-4.2 -6,-4.2 -11.4,-5.4 Z', c.lg([[0, '#9aa0a8'], [1, '#4e535a']]), 1.6);
    o += C(-11.2, -6.9, 1.6, '#6a6f76', 1.1) + C(11.2, -6.9, 1.6, '#6a6f76', 1.1) + P('M-2.4,-8 L0,-11.2 L2.4,-8 Z', '#6a6f76', 1.1);
    o += C(0, 7.6, 2.7, c.cel('#8a9098'), 1.4);
    return o;
  }
  function strap(a, b, t, w) {
    var p = lerp(a, b, t), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.sqrt(dx * dx + dy * dy) || 1, px = -dy / l * w, py = dx / l * w;
    return L('M' + n(p[0] - px) + ',' + n(p[1] - py) + ' L' + n(p[0] + px) + ',' + n(p[1] + py), LY.strap, 1.7) + R(p[0] + px * 0.3 - 0.9, p[1] + py * 0.3 - 0.9, 1.8, 1.8, '#c8b27a');
  }
  function lyvArm(c, sh, el, hd, back) {
    var o = tube([sh, el, hd], 8, back ? LY.whiteD : LY.white, back ? null : LY.whiteD);
    var g0 = lerp(el, hd, 0.3);
    o += tube([g0, hd], 9, back ? dk(LY.glove, 0.15) : LY.glove);
    o += strap(el, hd, 0.46, 4.6) + strap(el, hd, 0.72, 4.6);
    return o;
  }
  function lyvHand(c, hd, back) { return C(hd[0], hd[1], 4.7, c.cel(back ? dk(LY.glove, 0.15) : LY.glove), 2.1) + L('M' + n(hd[0] - 2) + ',' + n(hd[1] + 1.8) + ' L' + n(hd[0] + 2.4) + ',' + n(hd[1] + 1.2), LY.strap, 1); }
  function lyvLeg(c, h, kn, f, back) {
    var gr = back ? dk(LY.greave, 0.16) : LY.greave, o = '';
    o += tube([h, kn], 9.8, back ? LY.whiteD : LY.white, back ? null : LY.whiteD);
    var ax = f[0] + 1, ay = f[1] - 3, dx = ax - kn[0], dy = ay - kn[1], l = Math.sqrt(dx * dx + dy * dy) || 1, px = -dy / l, py = dx / l;
    function q(t, w) { return [kn[0] + dx * t + px * w, kn[1] + dy * t + py * w]; }
    o += P(pd([q(0.02, -5.4), q(0.4, -6.5), q(1, -4.8), q(1, 4.8), q(0.4, 6.5), q(0.02, 5.4)], true), c.cel(gr), 2.1);
    o += L(pd([q(0.2, -2.6), q(0.95, -2)]), lt(gr, 0.35), 1.2, 0.8);
    // pointed sabaton
    var x = f[0], y = f[1] + 5;
    o += P('M' + n(x - 5.2) + ',' + n(y - 10) + ' L' + n(x + 3) + ',' + n(y - 10) + ' C' + n(x + 6) + ',' + n(y - 6.4) + ' ' + n(x + 11) + ',' + n(y - 4) + ' ' + n(x + 12.5) + ',' + n(y) + ' L' + n(x - 5.6) + ',' + n(y) + ' Z', c.cel(dk(gr, 0.12)), 2.1);
    o += L('M' + n(x - 4.6) + ',' + n(y - 6) + ' L' + n(x + 4.6) + ',' + n(y - 6), dk(gr, 0.45), 1, 0.8);
    // pointed knee guard, tip up the thigh
    var kx = kn[0] + px * 0.6, ky = kn[1];
    o += P('M' + n(kx + 0.8) + ',' + n(ky - 8) + ' L' + n(kx + 5.4) + ',' + n(ky - 0.8) + ' C' + n(kx + 5) + ',' + n(ky + 3.8) + ' ' + n(kx - 3.6) + ',' + n(ky + 4) + ' ' + n(kx - 4.2) + ',' + n(ky - 0.8) + ' Z', c.cel(lt(gr, 0.14)), 1.9);
    o += L('M' + n(kx + 0.8) + ',' + n(ky - 5.6) + ' L' + n(kx + 0.7) + ',' + n(ky + 2.2), lt(gr, 0.5), 1, 0.8);
    return o;
  }
  function guard(c, x, y, rx, col) {
    var o = P('M' + n(x - rx * 0.92) + ',' + n(y + 3) + ' C' + n(x - rx * 0.8) + ',' + n(y + 8.4) + ' ' + n(x + rx * 0.8) + ',' + n(y + 8.4) + ' ' + n(x + rx * 0.92) + ',' + n(y + 3) + ' Z', c.cel(dk(col, 0.12)), 1.8);
    o += P('M' + n(x - rx) + ',' + n(y + 3) + ' C' + n(x - rx) + ',' + n(y - rx * 0.95) + ' ' + n(x + rx) + ',' + n(y - rx * 0.95) + ' ' + n(x + rx) + ',' + n(y + 3) + ' C' + n(x + rx * 0.5) + ',' + n(y + 5.2) + ' ' + n(x - rx * 0.5) + ',' + n(y + 5.2) + ' ' + n(x - rx) + ',' + n(y + 3) + ' Z', c.cel(col), 2.1);
    o += L('M' + n(x - rx * 0.55) + ',' + n(y - rx * 0.35) + ' Q' + n(x) + ',' + n(y - rx * 0.72) + ' ' + n(x + rx * 0.5) + ',' + n(y - rx * 0.4), lt(col, 0.55), 1.3, 0.8);
    return o;
  }
  function lyvHead(c, X, Y, r) {
    function q(u, v) { return n(X + r * u) + ',' + n(Y + r * v); }
    var o = '';
    var face = 'M' + q(-1, 0.05) + ' C' + q(-1, -1.3) + ' ' + q(0.95, -1.3) + ' ' + q(1, -0.15) + ' L' + q(1.22, 0.28) + ' L' + q(0.98, 0.46) +
      ' C' + q(0.97, 0.86) + ' ' + q(0.5, 1.1) + ' ' + q(0.02, 1.06) + ' C' + q(-0.7, 0.98) + ' ' + q(-1, 0.55) + ' ' + q(-1, 0.05) + ' Z';
    o += P(face, c.cel(LY.skin), 2.1);
    o += CG(F('M' + q(-1.1, -0.2) + ' L' + q(-0.25, -0.2) + ' C' + q(-0.4, 0.4) + ' ' + q(-0.2, 0.8) + ' ' + q(0.2, 1.2) + ' L' + q(-1.1, 1.2) + ' Z', LY.skinD, 0.55), c.clip(face));
    // eye (bright green), eager raised brow
    var ex = X + r * 0.5, ey = Y - r * 0.04;
    o += E(ex, ey, 2.3, 1.9, '#fbf8f2') + C(ex + 0.6, ey + 0.15, 1.35, LY.eye) + C(ex + 0.85, ey + 0.15, 0.6, '#10302a') + C(ex + 0.2, ey - 0.45, 0.45, '#ffffff');
    o += L('M' + n(ex - 2.3) + ',' + n(ey - 1.1) + ' Q' + n(ex) + ',' + n(ey - 2.5) + ' ' + n(ex + 2.5) + ',' + n(ey - 1.2), OL, 1.1);
    o += L('M' + n(ex - 3) + ',' + n(ey - 4.4) + ' Q' + n(ex) + ',' + n(ey - 6.2) + ' ' + n(ex + 3.2) + ',' + n(ey - 4.8), dk(LY.hairD, 0.2), 1.5);
    // open, eager mouth
    o += P('M' + q(0.5, 0.56) + ' Q' + q(0.73, 0.5) + ' ' + q(0.94, 0.53) + ' Q' + q(0.9, 0.92) + ' ' + q(0.64, 0.86) + ' Q' + q(0.5, 0.74) + ' ' + q(0.5, 0.56) + ' Z', '#6a2228', 1.1);
    o += F('M' + q(0.6, 0.8) + ' Q' + q(0.76, 0.7) + ' ' + q(0.88, 0.8) + ' Q' + q(0.78, 0.9) + ' ' + q(0.6, 0.8) + ' Z', '#e07a80');
    o += F('M' + q(0.56, 0.57) + ' L' + q(0.92, 0.55) + ' L' + q(0.9, 0.62) + ' L' + q(0.58, 0.64) + ' Z', '#ffffff', 0.9);
    o += E(X + r * 0.22, Y + r * 0.42, 2, 1.2, '#f0a0a0', 0, 0.35);
    // short swept mint hair
    var hair = 'M' + q(0.92, -0.42) + ' C' + q(1.02, -0.9) + ' ' + q(0.78, -1.36) + ' ' + q(0.36, -1.62) + ' L' + q(0.14, -1.26) + ' L' + q(-0.34, -1.78) + ' L' + q(-0.42, -1.3) +
      ' L' + q(-1.08, -1.56) + ' L' + q(-0.96, -1.02) + ' L' + q(-1.58, -0.84) + ' L' + q(-1.08, -0.42) + ' L' + q(-1.36, -0.04) + ' L' + q(-0.97, 0.22) +
      ' C' + q(-0.82, -0.2) + ' ' + q(-0.56, -0.42) + ' ' + q(-0.2, -0.5) + ' C' + q(0.2, -0.56) + ' ' + q(0.5, -0.34) + ' ' + q(0.66, -0.16) + ' L' + q(0.92, -0.42) + ' Z';
    o += P(hair, c.lg([[0, LY.hairL], [0.35, LY.hair], [0.72, LY.hair], [1, LY.hairD]], 0.7, 0, 0.2, 1), 2);
    o += L('M' + q(0.7, -0.62) + ' C' + q(0.4, -1.0) + ' ' + q(-0.1, -1.2) + ' ' + q(-0.6, -1.12) + ' M' + q(0.3, -0.62) + ' C' + q(-0.1, -0.9) + ' ' + q(-0.6, -0.9) + ' ' + q(-1.05, -0.7), LY.hairD, 1, 0.85);
    o += L('M' + q(0.78, -0.84) + ' C' + q(0.5, -1.2) + ' ' + q(0.1, -1.38) + ' ' + q(-0.2, -1.4), LY.hairL, 1.1, 0.9);
    // long ear swept back and up, over the side of the hair
    var ear = 'M' + q(-0.22, -0.06) + ' C' + q(-0.72, -0.34) + ' ' + q(-1.36, -0.86) + ' ' + q(-2.02, -1.32) + ' C' + q(-1.66, -0.56) + ' ' + q(-1.16, 0.2) + ' ' + q(-0.42, 0.5) + ' Z';
    o += P(ear, c.cel(LY.skin), 1.8);
    o += F('M' + q(-0.46, 0.14) + ' C' + q(-0.96, -0.16) + ' ' + q(-1.42, -0.68) + ' ' + q(-1.76, -1.04) + ' C' + q(-1.42, -0.42) + ' ' + q(-1.02, 0.12) + ' ' + q(-0.52, 0.32) + ' Z', LY.skinD, 0.85);
    return o;
  }
  // torso pieces (fixed in the rig; only the limbs move between poses)
  var VEST = 'M53,45 Q66,40 80,45 C81.5,56 76,66 73.5,75 L57,75 C55.5,66 51.5,56 53,45 Z';
  function lyvTorso(c, tail) {
    var o = '';
    // white under-tunic and the vest's tails
    o += P(tail ? 'M57,73 L63,74 L56,88 L44,95 L49,85 Z' : 'M57,73 L63,74 L58,87 L50,91 L52,83 Z', c.cel(dk(LY.vest, 0.12)), 1.9);
    o += P('M57.5,73 L73.5,73 L75,83.5 Q66,86.5 56.4,83.5 Z', c.cel(LY.white), 1.9) + L('M62,76 L61.4,84.6 M68,76 L68.6,85.4', LY.whiteD, 1.1);
    o += P('M66,73 L74,73 L77,87.5 L70.5,84 Z', c.cel(LY.vest), 1.9);
    o += P(VEST, c.cel(LY.vest), 2.2);
    o += CG(F('M48,40 L59.5,40 L61,80 L48,80 Z', LY.vestD, 0.55) + F('M74,40 L84,40 L84,80 L72,80 Z', '#ffffff', 0.12), c.clip(VEST));
    // quilted padding seams and the cross-laced front
    o += L('M59,48 C60,58 60,66 60,74 M76.5,50 C75.5,60 74,67 72.5,74', LY.vestD, 1, 0.9);
    o += L('M68.6,46 L67.2,74.5', '#2c3a2a', 1.3);
    [51, 57, 63, 69].forEach(function (y) { var x = 68.4 - (y - 46) * 0.05; o += L('M' + n(x - 2) + ',' + n(y - 2) + ' L' + n(x + 2) + ',' + n(y + 2) + ' M' + n(x + 2) + ',' + n(y - 2) + ' L' + n(x - 2) + ',' + n(y + 2), '#243022', 1.3); });
    o += P('M56.6,72 L74,72 L73.5,75.6 L57,75.6 Z', dk(LY.vest, 0.3), 1.4);
    // high dark collar
    o += P('M59.5,35.5 Q67,33 74.5,35 L75.8,44.5 Q67,48 58.6,44.5 Z', c.cel(LY.collar), 2);
    o += L('M60.2,37.4 Q67,35 74,37', lt(LY.collar, 0.35), 1.1, 0.8) + L('M67.4,36 L67.8,46.6', dk(LY.collar, 0.3), 1);
    return o;
  }
  // full figure in sprite coordinates; opts.upper: head, torso and guards only (portrait)
  function lyvRig(c, J, opts) {
    opts = opts || {};
    var o = '';
    if (!opts.upper) {
      o += lyvArm(c, J.bSh, J.bEl, J.bHd, true) + lyvHand(c, J.bHd, true);
      o += lyvLeg(c, J.bHip, J.bKn, J.bFt, true);
      o += lyvLeg(c, J.fHip, J.fKn, J.fFt, false);
    }
    o += guard(c, 56.5, 46.5, 7.6, dk(LY.guard, 0.12));
    o += lyvTorso(c, J.tail);
    o += lyvHead(c, J.head[0], J.head[1], J.head[2]);
    if (!opts.upper) {
      var S = J.shield;
      o += G(kite(c), 'translate(' + n(S[0]) + ',' + n(S[1]) + ') rotate(' + n(S[3]) + ') scale(' + S[2] + ')');
    }
    o += guard(c, 77.5, 47.5, 9.2, LY.guard);
    if (!opts.upper) {
      o += lyvArm(c, J.fSh, J.fEl, J.fHd, false);
      o += G(lsword(c, J.sword[1]), 'translate(' + n(J.fHd[0]) + ',' + n(J.fHd[1]) + ') rotate(' + n(J.sword[0]) + ')');
      o += lyvHand(c, J.fHd, false);
    }
    return o;
  }
  function lyveusSprite(c) { return shadow(c, 64, 28) + G(lyvRig(c, POSE_SPRITE), 'matrix(1.05,0,0,1.05,-3.2,-6.1)'); }
  function lyveusActor(c) {
    var keep = SWM; SWM = 0.8;
    try { return E(96, 155, 40, 5, c.rg([[0, '#000', 0.45], [0.65, '#000', 0.25], [1, '#000', 0]])) + G(lyvRig(c, POSE_ACTOR), 'matrix(-1.25,0,0,1.25,176,2.5)'); } finally { SWM = keep; }
  }

  // =====================================================================
  // LYVEUS, HOODED: the wanderer players meet from level 15. The same rig under a deep moss-green travel cloak,
  // hood up, face in shadow but for the chin and one glint of an eye; the shield wrapped in cloth on his back.
  // =====================================================================
  var HD = { cloak: '#3f4c30', cloakD: '#2a3320', cloakL: '#5e6c44', wrap: '#8a7c62', wrapD: '#5e5442', cord: '#3a2a1a', mud: '#4a3a28' };
  var POSE_HOOD_SPRITE = {
    head: [69, 27, 10.5], fSh: [76, 48], fEl: [86, 57], fHd: [93, 63],
    bHip: [61, 80], bKn: [57.5, 99], bFt: [54, 117], fHip: [68, 80], fKn: [73.5, 99], fFt: [77, 117], sword: [30, 56]
  };
  // the story pose: standing still, the sword point lowered in front of him
  var POSE_HOOD_ACTOR = {
    head: [69, 27, 10.5], fSh: [76, 48], fEl: [83, 62], fHd: [91, 71],
    bHip: [61, 80], bKn: [57, 99], bFt: [52, 117], fHip: [68, 80], fKn: [74, 99], fFt: [79, 117], sword: [152, 50]
  };
  function frayed(pts, y0, amp) {
    // a ragged hem: zig-zag between the given x points at y0
    var d = '';
    pts.forEach(function (x, i) { d += ' L' + n(x) + ',' + n(y0 + (i % 2 ? -amp : 0) + (i % 3 === 2 ? amp * 0.5 : 0)); });
    return d;
  }
  function wrappedShield(c) {
    // the kite shield bundled in travel cloth, bound with cord: no emblem shows
    var o = P(kiteD(), c.lg([[0, lt(HD.wrap, 0.12)], [0.6, HD.wrap], [1, HD.wrapD]], 0.2, 0, 0.8, 1), 2.4);
    o += CG(L('M-14,-8 L14,-14 M-14,2 L14,-6 M-12,11 L12,3 M-6,19 L10,12', HD.wrapD, 1.4, 0.9) + F('M-13,-18 L-4,-18 L-13,6 Z', '#ffffff', 0.12), c.clip(kiteD()));
    o += L('M-12.5,-4 L12.5,-10 M-10,8 L10.5,2', OL, 3.4) + L('M-12.5,-4 L12.5,-10 M-10,8 L10.5,2', HD.cord, 1.8);
    o += L('M9,-16 L13,-19 M-7,16 L-10,20', HD.wrapD, 1.6);
    return o;
  }
  function hoodHead(c, X, Y, r) {
    function q(u, v) { return n(X + r * u) + ',' + n(Y + r * v); }
    var o = '';
    var hood = 'M' + q(1.0, -0.62) + ' C' + q(0.9, -1.6) + ' ' + q(-0.6, -2.0) + ' ' + q(-1.3, -1.25) + ' L' + q(-2.0, -0.2) + ' L' + q(-1.45, 0.05) +
      ' C' + q(-1.5, 0.7) + ' ' + q(-1.55, 1.3) + ' ' + q(-1.7, 1.9) + ' L' + q(0.7, 1.9) + ' C' + q(1.25, 1.2) + ' ' + q(1.38, 0.2) + ' ' + q(1.0, -0.62) + ' Z';
    o += P(hood, c.lg([[0, HD.cloakL], [0.45, HD.cloak], [1, HD.cloakD]], 0.7, 0, 0.3, 1), 2.2);
    o += L('M' + q(0.3, -1.45) + ' C' + q(-0.3, -1.4) + ' ' + q(-0.9, -0.9) + ' ' + q(-1.2, 0.1) + ' M' + q(-0.2, 1.0) + ' C' + q(-0.5, 1.3) + ' ' + q(-0.9, 1.5) + ' ' + q(-1.3, 1.6), HD.cloakD, 1.2, 0.9);
    // the opening: deep shadow, the chin in the light at its bottom
    var hole = 'M' + q(1.0, -0.62) + ' C' + q(0.35, -0.62) + ' ' + q(-0.05, 0.05) + ' ' + q(0.08, 0.85) + ' C' + q(0.3, 1.25) + ' ' + q(0.9, 1.22) + ' ' + q(1.16, 0.8) + ' C' + q(1.3, 0.2) + ' ' + q(1.22, -0.3) + ' ' + q(1.0, -0.62) + ' Z';
    o += P(hole, c.lg([[0, '#050806'], [0.7, '#0e1410'], [1, '#1e2418']], 0, 0, 0, 1), 1.4);
    o += CG(P('M' + q(0.28, 1.3) + ' C' + q(0.4, 0.9) + ' ' + q(0.9, 0.78) + ' ' + q(1.24, 0.88) + ' L' + q(1.24, 1.4) + ' Z', c.lg([[0, dk(LY.skin, 0.35)], [1, LY.skin]], 0, 0, 0, 1), 1) + L('M' + q(0.62, 1.02) + ' L' + q(0.88, 1.0), dk(LY.skin, 0.55), 0.9), c.clip(hole));
    // one glint of an eye, and a single mint strand escaping the hood
    o += E(X + r * 0.66, Y + r * 0.1, 3.4, 2.4, glow(c, '#b8ffe0', 0.7)) + E(X + r * 0.66, Y + r * 0.1, 1.3, 0.8, '#d8fff0') + C(X + r * 0.7, Y + r * 0.1, 0.45, '#ffffff');
    o += L('M' + q(0.92, -0.5) + ' C' + q(0.7, -0.2) + ' ' + q(0.8, 0.1) + ' ' + q(0.62, 0.36), OL, 2.4) + L('M' + q(0.92, -0.5) + ' C' + q(0.7, -0.2) + ' ' + q(0.8, 0.1) + ' ' + q(0.62, 0.36), LY.hair, 1.1);
    o += L('M' + q(1.0, -0.62) + ' C' + q(1.36, 0.2) + ' ' + q(1.24, 1.2) + ' ' + q(0.7, 1.9), HD.cloakL, 1.2, 0.8);
    return o;
  }
  function hoodRig(c, J) {
    var o = '';
    // cloak behind, ragged hem
    o += P('M57,40 C47,56 41,82 37,110' + frayed([42, 46, 51, 56, 61, 66, 71, 76], 110, 4) + ' L79,106 C80,84 79,60 75,44 Z', c.lg([[0, HD.cloak], [1, HD.cloakD]], 0, 0, 0, 1), 2.1);
    o += L('M50,60 C46,76 44,92 43,106 M60,58 C58,76 57,92 57,108', HD.cloakD, 1.2, 0.9);
    // the wrapped shield slung on his back
    o += G(wrappedShield(c), 'translate(47,64) rotate(-16) scale(0.8)');
    o += lyvLeg(c, J.bHip, J.bKn, J.bFt, true);
    o += lyvLeg(c, J.fHip, J.fKn, J.fFt, false);
    // travel mud on the greaves
    [[J.bFt, -1], [J.fFt, 1]].forEach(function (q) { var f = q[0]; o += F('M' + n(f[0] - 5) + ',' + n(f[1] + 4) + ' Q' + n(f[0] - 2) + ',' + n(f[1] - 5) + ' ' + n(f[0] + 2) + ',' + n(f[1] - 2) + ' Q' + n(f[0] + 6) + ',' + n(f[1] - 1) + ' ' + n(f[0] + 10) + ',' + n(f[1] + 4) + ' Z', HD.mud, 0.75); });
    // front of the cloak, closed over the armour, a patch on it
    var front = 'M59,35 Q68,32 77,36 C84,48 86,64 83,80 C82,88 82,94 81,100' + frayed([77, 73, 69, 65, 61, 57], 98, 3.6) + ' L55,96 C53,78 53,56 55,42 Z';
    o += P(front, c.lg([[0, HD.cloakL], [0.35, HD.cloak], [1, HD.cloakD]], 0.8, 0, 0.2, 1), 2.2);
    o += CG(F('M48,30 L62,30 L62,104 L48,104 Z', '#000000', 0.22) + L('M72,40 C76,56 77,74 75,96 M65,42 C66,60 66,78 65,96', HD.cloakD, 1.2, 0.9), c.clip(front));
    o += P('M60,78 L68,77 L68.6,85 L60.4,85.6 Z', c.cel('#6a6448'), 1.2) + L('M61,79 L62,79 M64,78.6 L65,78.6 M61,84.4 L62,84.4 M65,84 L66,84', '#2a2418', 0.8);
    // the shield's carrying strap across his chest
    o += L('M58,42 L80,76', OL, 3.8) + L('M58,42 L80,76', '#5a3a22', 2.2) + R(67.2, 57, 3.2, 3.2, '#b8a068', 0.9);
    o += hoodHead(c, J.head[0], J.head[1], J.head[2]);
    // the sword arm, sleeved in the cloak, the same sword
    o += tube([J.fSh, J.fEl, J.fHd], 8.4, HD.cloak, HD.cloakD);
    o += tube([lerp(J.fEl, J.fHd, 0.3), J.fHd], 9, LY.glove) + strap(J.fEl, J.fHd, 0.46, 4.6) + strap(J.fEl, J.fHd, 0.72, 4.6);
    o += G(lsword(c, J.sword[1]), 'translate(' + n(J.fHd[0]) + ',' + n(J.fHd[1]) + ') rotate(' + n(J.sword[0]) + ')');
    o += lyvHand(c, J.fHd, false);
    return o;
  }
  function lyveusHoodedSprite(c) { return shadow(c, 64, 28) + G(hoodRig(c, POSE_HOOD_SPRITE), 'matrix(1.05,0,0,1.05,-3.2,-6.1)'); }
  function lyveusHoodedActor(c) {
    var keep = SWM; SWM = 0.8;
    try { return E(84, 155, 38, 5, c.rg([[0, '#000', 0.45], [0.65, '#000', 0.25], [1, '#000', 0]])) + G(hoodRig(c, POSE_HOOD_ACTOR), 'matrix(-1.3,0,0,1.3,170,-4)'); } finally { SWM = keep; }
  }

  // =====================================================================
  // VYN: Lyveus's comrade, a young Kingsmere guard in blue-and-gold plate, his helm under his arm.
  // Same sprite-coordinate rig idea, mirrored into the 160 actor box.
  // =====================================================================
  var VY = { skin: '#f0c4a0', hair: '#7a4e2c', steel: '#b9c3cd', blue: '#2f5eb2', gold: '#e0b44a', leather: '#5a3a22' };
  function plateLeg(c, h, kn, f, back) {
    var st = back ? dk(VY.steel, 0.18) : VY.steel, o = '';
    o += tube([h, kn, [f[0], f[1] - 3]], 9.4, st, back ? null : dk(st, 0.25));
    o += C(kn[0] + 1, kn[1], 4.6, c.cel(lt(st, 0.1)), 1.8) + C(kn[0] + 1, kn[1], 1.6, c.cel(VY.gold), 1);
    var x = f[0], y = f[1] + 5;
    o += P('M' + n(x - 5.2) + ',' + n(y - 10) + ' L' + n(x + 3) + ',' + n(y - 10) + ' C' + n(x + 6) + ',' + n(y - 6) + ' ' + n(x + 11.5) + ',' + n(y - 4.4) + ' ' + n(x + 11.5) + ',' + n(y - 1) + ' L' + n(x + 11.5) + ',' + n(y) + ' L' + n(x - 5.6) + ',' + n(y) + ' Z', c.cel(dk(st, 0.08)), 2.1);
    o += L('M' + n(x - 4.8) + ',' + n(y - 5.6) + ' L' + n(x + 5) + ',' + n(y - 5.6), dk(st, 0.4), 1, 0.8);
    return o;
  }
  function plateArm(c, sh, el, hd, back) {
    var st = back ? dk(VY.steel, 0.18) : VY.steel;
    return tube([sh, el, hd], 8.4, st, back ? null : dk(st, 0.25)) + C(el[0], el[1], 3.8, c.cel(VY.gold), 1.6);
  }
  function gauntlet(c, hd, back) { return C(hd[0], hd[1], 5, c.cel(back ? dk(VY.steel, 0.2) : lt(VY.steel, 0.05)), 2.1) + L('M' + n(hd[0] - 2.6) + ',' + n(hd[1] - 1) + ' L' + n(hd[0] + 2.8) + ',' + n(hd[1] - 1.6), dk(VY.steel, 0.4), 1); }
  function lionCrest(c, x, y, r) {
    var sp = '';
    for (var i = 0; i < 10; i++) {
      var a = i / 10 * PI * 2, a2 = a + PI / 10, a3 = a - PI / 10;
      sp += (i ? ' L' : 'M') + n(x + Math.cos(a3) * r) + ',' + n(y + Math.sin(a3) * r) + ' L' + n(x + Math.cos(a) * r * 1.55) + ',' + n(y + Math.sin(a) * r * 1.55) + ' L' + n(x + Math.cos(a2) * r) + ',' + n(y + Math.sin(a2) * r);
    }
    return P(sp + ' Z', c.cel(VY.gold), 1) + C(x, y, r * 0.82, lt(VY.gold, 0.2), 1) + E(x - r * 0.22, y - r * 0.1, r * 0.3, r * 0.22, dk(VY.gold, 0.35));
  }
  function vynHelm(c, x, y) {
    // open-faced Kingsmere guard helm seen from the side (face opening to the right): steel dome, gold brow band,
    // a flared neck guard behind, a cheek guard, and a blue crest along the top
    var o = '';
    o += P('M' + n(x - 9) + ',' + n(y - 7) + ' C' + n(x - 6) + ',' + n(y - 15) + ' ' + n(x + 5) + ',' + n(y - 16) + ' ' + n(x + 9) + ',' + n(y - 10) + ' L' + n(x + 6.4) + ',' + n(y - 8.6) + ' C' + n(x + 3) + ',' + n(y - 12) + ' ' + n(x - 4) + ',' + n(y - 11) + ' ' + n(x - 6.6) + ',' + n(y - 5.4) + ' Z', c.cel(VY.blue), 1.6);
    o += L('M' + n(x - 5) + ',' + n(y - 12) + ' L' + n(x - 3.4) + ',' + n(y - 9.6) + ' M' + n(x - 1) + ',' + n(y - 14) + ' L' + n(x) + ',' + n(y - 11) + ' M' + n(x + 3.4) + ',' + n(y - 14) + ' L' + n(x + 3) + ',' + n(y - 11), dk(VY.blue, 0.35), 0.9);
    var dome = 'M' + n(x - 11) + ',' + n(y + 4) + ' C' + n(x - 12) + ',' + n(y - 10) + ' ' + n(x + 9) + ',' + n(y - 13) + ' ' + n(x + 10.4) + ',' + n(y + 0.4) + ' L' + n(x + 3.6) + ',' + n(y + 0.8) + ' L' + n(x + 3.2) + ',' + n(y + 7) + ' L' + n(x - 1.6) + ',' + n(y + 11.4) + ' L' + n(x - 4.4) + ',' + n(y + 6.6) + ' L' + n(x - 12.6) + ',' + n(y + 9) + ' Z';
    o += P(dome, c.cel(VY.steel), 2);
    o += F('M' + n(x + 3.6) + ',' + n(y + 0.8) + ' L' + n(x + 10.4) + ',' + n(y + 0.4) + ' L' + n(x + 9.4) + ',' + n(y + 7) + ' L' + n(x + 3.2) + ',' + n(y + 7) + ' Z', '#1e1e28', 0.95);
    o += L('M' + n(x - 11.4) + ',' + n(y + 1) + ' C' + n(x - 6) + ',' + n(y - 1) + ' ' + n(x + 4) + ',' + n(y - 1.4) + ' ' + n(x + 10.4) + ',' + n(y + 0.4), OL, 3.6) + L('M' + n(x - 11.4) + ',' + n(y + 1) + ' C' + n(x - 6) + ',' + n(y - 1) + ' ' + n(x + 4) + ',' + n(y - 1.4) + ' ' + n(x + 10.4) + ',' + n(y + 0.4), VY.gold, 1.9);
    o += C(x - 3.6, y + 4.6, 1.5, c.cel(VY.gold), 0.9) + L('M' + n(x - 7) + ',' + n(y - 6.6) + ' Q' + n(x - 2) + ',' + n(y - 9.4) + ' ' + n(x + 4) + ',' + n(y - 7.6), '#ffffff', 1.2, 0.75);
    return o;
  }
  function vynHead(c, X, Y, r) {
    function q(u, v) { return n(X + r * u) + ',' + n(Y + r * v); }
    var o = '', sk = VY.skin, hc = VY.hair;
    var face = 'M' + q(-1, 0.05) + ' C' + q(-1, -1.3) + ' ' + q(0.95, -1.3) + ' ' + q(1, -0.15) + ' L' + q(1.2, 0.3) + ' L' + q(0.98, 0.5) +
      ' C' + q(0.96, 0.95) + ' ' + q(0.35, 1.12) + ' ' + q(-0.15, 1.04) + ' C' + q(-0.8, 0.96) + ' ' + q(-1, 0.5) + ' ' + q(-1, 0.05) + ' Z';
    o += P(face, c.cel(sk), 2.1);
    o += C(X - r * 0.36, Y + r * 0.14, r * 0.26, c.cel(sk), 1.4);
    // short brown beard along the jaw and chin
    o += P('M' + q(-0.62, 0.2) + ' C' + q(-0.5, 0.74) + ' ' + q(-0.1, 1.06) + ' ' + q(0.36, 1.12) + ' C' + q(0.72, 1.12) + ' ' + q(0.98, 0.9) + ' ' + q(0.99, 0.56) +
      ' L' + q(0.84, 0.62) + ' C' + q(0.66, 0.46) + ' ' + q(0.46, 0.5) + ' ' + q(0.34, 0.66) + ' C' + q(0.1, 0.62) + ' ' + q(-0.2, 0.46) + ' ' + q(-0.46, 0.14) + ' Z', c.cel(hc), 1.6);
    // kind smile over the beard, rosy cheek
    o += P('M' + q(0.42, 0.64) + ' Q' + q(0.66, 0.66) + ' ' + q(0.94, 0.58) + ' Q' + q(0.84, 0.92) + ' ' + q(0.62, 0.9) + ' Q' + q(0.46, 0.84) + ' ' + q(0.42, 0.64) + ' Z', '#5a1a18', 1) +
      F('M' + q(0.47, 0.66) + ' Q' + q(0.66, 0.68) + ' ' + q(0.9, 0.6) + ' L' + q(0.86, 0.7) + ' Q' + q(0.66, 0.76) + ' ' + q(0.5, 0.74) + ' Z', '#ffffff', 0.95);
    o += E(X + r * 0.3, Y + r * 0.34, 2.2, 1.3, '#f08a78', 0, 0.45);
    var ex = X + r * 0.5, ey = Y - r * 0.04;
    o += E(ex, ey, 2.1, 1.9, '#fbf6ee') + C(ex + 0.6, ey + 0.2, 1.3, '#4a7ab8') + C(ex + 0.8, ey + 0.2, 0.6, '#101828') + C(ex + 0.2, ey - 0.4, 0.45, '#ffffff');
    o += L('M' + n(ex - 2.4) + ',' + n(ey - 1) + ' Q' + n(ex) + ',' + n(ey - 2.4) + ' ' + n(ex + 2.4) + ',' + n(ey - 1.1), OL, 1);
    // short tousled brown hair
    o += P('M' + q(0.9, -0.62) + ' C' + q(0.9, -1.36) + ' ' + q(-0.4, -1.58) + ' ' + q(-1.05, -0.9) + ' C' + q(-1.25, -0.5) + ' ' + q(-1.2, 0) + ' ' + q(-1.04, 0.3) +
      ' L' + q(-0.72, 0.1) + ' C' + q(-0.6, -0.24) + ' ' + q(-0.46, -0.5) + ' ' + q(-0.2, -0.62) + ' L' + q(0.06, -0.5) + ' L' + q(0.2, -0.74) + ' L' + q(0.44, -0.54) + ' L' + q(0.6, -0.76) + ' L' + q(0.9, -0.62) + ' Z', c.cel(hc), 2);
    o += L('M' + n(ex - 3) + ',' + n(ey - 3.4) + ' Q' + n(ex - 0.4) + ',' + n(ey - 5) + ' ' + n(ex + 2.8) + ',' + n(ey - 4), dk(hc, 0.2), 1.6);

    o += L('M' + q(-0.6, -0.9) + ' C' + q(-0.2, -1.15) + ' ' + q(0.2, -1.12) + ' ' + q(0.5, -0.9), lt(hc, 0.35), 1.3, 0.8);
    o += L('M' + q(-0.98, -0.1) + ' C' + q(-0.9, 0.3) + ' ' + q(-0.8, 0.5) + ' ' + q(-0.66, 0.6), hc, 2.4) ;
    return o;
  }
  function vynRig(c) {
    var o = '';
    var bSh = [57, 49], bEl = [50.5, 63], bHd = [54, 75.5], fSh = [76, 49], fEl = [85, 61], fHd = [90, 73];
    // sword sheathed at the back hip, his hand resting on the hilt
    o += P('M53.4,80.6 L59,81.6 L43.6,109.6 L39,107.2 Z', c.cel(dk(VY.blue, 0.35)), 1.8) + L('M50.4,88 L55,89.4 M45.6,97 L50,98.6', VY.gold, 1.4) + P('M39,107.2 L43.6,109.6 L40,114.6 L37,111 Z', c.cel(VY.gold), 1.4);
    o += P('M49.4,79.4 L62.8,82.2 L62.2,84.8 L48.8,82 Z', c.cel(VY.gold), 1.4) + L('M56,81.4 L54.2,72', OL, 5.6) + L('M56,81.4 L54.2,72', '#5a3a22', 3.2);
    o += plateArm(c, bSh, bEl, bHd, true);
    o += gauntlet(c, bHd, true) + C(53.4, 69.8, 2.6, c.cel(VY.gold), 1.3);
    o += plateLeg(c, [61, 80], [59, 99], [56, 117], true);
    o += plateLeg(c, [68, 80], [71.5, 99], [74, 117], false);
    // faulds, the blue tabard strip, belt
    o += P('M56,74 L75,74 L78,88 Q66,91 53,88 Z', c.cel(VY.steel), 2) + L('M55,80.6 Q66,83 76.6,80.6 M54,85.4 Q66,88 77.6,85.4', dk(VY.steel, 0.35), 1.1);
    o += P('M62,76 L71,76 L72,97 L66.5,94 L61,97 Z', c.cel(VY.blue), 1.8) + L('M63,78 L63.4,94.6 M70,78 L70.6,94.6', VY.gold, 1.2);
    o += guard(c, 55.4, 46.5, 9.6, dk(VY.blue, 0.1));
    // breastplate: blue enamel, gold trim, the lion crest
    var bp = 'M52,46 Q66,40 81,46 C82,58 77,68 74.5,76 L56.5,76 C55,68 51,58 52,46 Z';
    o += P(bp, c.cel(VY.blue), 2.2) + CG(F('M47,40 L58.6,40 L60,80 L47,80 Z', '#000000', 0.25) + F('M70,42 Q78,52 76,66 L73,66 Q74,52 68,43 Z', '#ffffff', 0.25), c.clip(bp));
    o += L('M53.4,48.6 Q66,43 79.6,48.6', VY.gold, 1.8) + L('M69,47 L67.6,74', dk(VY.blue, 0.35), 1.1);
    o += lionCrest(c, 68.6, 58, 3.6);
    o += P('M55.6,72.6 L75.4,72.6 L75,77 L56,77 Z', c.cel(VY.leather), 1.6) + R(64.8, 71.8, 5.4, 5.8, c.cel(VY.gold), 1.3);
    // gorget, neck, head
    o += P('M59.6,37 Q67,34.4 74.4,36.6 L75.4,44.6 Q67,47.4 58.8,44.6 Z', c.cel(VY.steel), 1.9) + L('M60,41.4 Q67,39.4 75,41.2', VY.gold, 1.2);
    o += vynHead(c, 68, 27.5, 11);
    // the helm tucked under his near arm, held from below
    o += plateArm(c, fSh, fEl, fHd, false);
    o += guard(c, 78, 47.5, 11.4, VY.blue) + L('M67.8,50.6 C71,45.6 84.6,45.6 88.6,50.6', VY.gold, 1.7);
    o += G(vynHelm(c, 0, 0), 'translate(89,67) rotate(-8) scale(1.2)');
    o += gauntlet(c, [92, 79], false);
    return o;
  }
  function vynActor(c) {
    var keep = SWM; SWM = 0.8;
    try { return E(82, 155, 36, 5, c.rg([[0, '#000', 0.45], [0.65, '#000', 0.25], [1, '#000', 0]])) + G(vynRig(c), 'matrix(-1.32,0,0,1.32,170,-6)'); } finally { SWM = keep; }
  }

  // =====================================================================
  // LORD CASSIUS MARROW: court noble of Lady Thorne's cabal, drawn facing right then mirrored (mobs face left).
  // Fencer's stance: silver rapier thrust forward, the back hand raised, short cape flaring behind.
  // =====================================================================
  var CM = { skin: '#e8c8b0', hair: '#1c1822', black: '#2c2636', purple: '#50246e', silver: '#cfd4de', lining: '#6a2e8e' };
  function cassiusRig(c) {
    var o = '';
    var bSh = [57.5, 48], bEl = [47, 43], bHd = [41, 32], fSh = [76.5, 49], fEl = [87, 54], fHd = [97, 56];
    // short cape flaring out behind, purple lining showing
    o += P('M58,43 C48,50 38,62 30,80 L38,77 L41,86 L48,78 L55,85 L60,68 Z', c.lg([[0, CM.lining], [1, dk(CM.lining, 0.4)]], 0, 0, 1, 1), 2.2);
    o += P('M59,43 C52,52 46,62 42,78 L48,76 L50,82 L56,76 L60,80 L63,60 Z', c.cel(CM.black), 2);
    o += L('M42,78 L48,76 L50,82 L56,76 L60,80', CM.silver, 1.2);
    // back arm raised behind, black glove
    o += tube([bSh, bEl, bHd], 7.2, dk(CM.black, 0.1));
    o += tube([lerp(bEl, bHd, 0.55), bHd], 8.2, '#141018') + L('M' + n(lerp(bEl, bHd, 0.55)[0] - 3.6) + ',' + n(lerp(bEl, bHd, 0.55)[1] + 1.6) + ' L' + n(lerp(bEl, bHd, 0.55)[0] + 3.4) + ',' + n(lerp(bEl, bHd, 0.55)[1] - 2.2), CM.silver, 1.4);
    o += P('M' + n(bHd[0] - 3.6) + ',' + n(bHd[1] + 2) + ' C' + n(bHd[0] - 5.4) + ',' + n(bHd[1] - 2) + ' ' + n(bHd[0] - 3) + ',' + n(bHd[1] - 7.4) + ' ' + n(bHd[0] + 0.6) + ',' + n(bHd[1] - 7) + ' C' + n(bHd[0] + 4.4) + ',' + n(bHd[1] - 6.4) + ' ' + n(bHd[0] + 5) + ',' + n(bHd[1] - 1) + ' ' + n(bHd[0] + 3.2) + ',' + n(bHd[1] + 2.4) + ' Z', c.cel('#2a2230'), 2) +
      L('M' + n(bHd[0] - 1.6) + ',' + n(bHd[1] - 6.6) + ' L' + n(bHd[0] - 1.2) + ',' + n(bHd[1] - 3) + ' M' + n(bHd[0] + 1) + ',' + n(bHd[1] - 6.8) + ' L' + n(bHd[0] + 1) + ',' + n(bHd[1] - 3.2), '#4a4056', 0.9);
    // legs: black breeches, tall boots with silver cuffs, a lunge
    function legC(h, kn, f, back) {
      var col = back ? '#16121c' : CM.black, s = tube([h, kn], 8.4, back ? '#2c2434' : '#3a3044');
      s += tube([kn, [f[0], f[1] - 3]], 8.8, col, back ? null : '#3e3448');
      var x = f[0], y = f[1] + 5;
      s += P('M' + n(x - 5) + ',' + n(y - 9) + ' L' + n(x + 3) + ',' + n(y - 9) + ' C' + n(x + 6) + ',' + n(y - 6) + ' ' + n(x + 11) + ',' + n(y - 4) + ' ' + n(x + 11.5) + ',' + n(y) + ' L' + n(x - 5.5) + ',' + n(y) + ' Z', c.cel(col), 2.1);
      s += P('M' + n(kn[0] - 6) + ',' + n(kn[1] - 1) + ' L' + n(kn[0] + 6) + ',' + n(kn[1] - 3) + ' L' + n(kn[0] + 6.4) + ',' + n(kn[1] + 3) + ' L' + n(kn[0] - 5.6) + ',' + n(kn[1] + 4) + ' Z', c.cel(col), 1.8) + L('M' + n(kn[0] - 5.4) + ',' + n(kn[1] + 3.4) + ' L' + n(kn[0] + 6) + ',' + n(kn[1] + 2.4), CM.silver, 1.3);
      return s;
    }
    o += legC([60, 82], [51, 100], [44, 117], true);
    o += legC([69, 82], [80, 98], [86, 117], false);
    // the doublet: black with a deep purple front, silver trim, a flared peplum
    o += P('M55.5,79 L76,79 L81,91 L71,88 L66,92 L60,88 L50,91 Z', c.cel(CM.black), 2) + L('M51.4,89.6 L60,87 L66,90.6 L71,87 L79.6,89.6', CM.silver, 1.2);
    var dbl = 'M54,46 Q67,40.5 80.5,46 C81.5,58 77,70 75,81 L57,81 C56,70 52.5,58 54,46 Z';
    o += P(dbl, c.cel(CM.black), 2.2);
    o += CG(F('M65,40 L82,44 L79,82 L64.4,82 Z', c.cel(CM.purple)) + F('M49,40 L58,40 L60,82 L49,82 Z', '#000000', 0.3), c.clip(dbl));
    o += L('M65,42 L64.4,81', CM.silver, 1.6) + L('M65,42 L64.4,81', OL, 0.5);
    [50, 56, 62, 68, 74].forEach(function (y) { o += C(66.6, y, 0.95, CM.silver, 0.6); });
    o += L('M68,48 C71,54 74,56 78,56 M68,58 C71,63 74,64 77,64', lt(CM.purple, 0.25), 1, 0.7);
    // silver chain across the chest from the dragon brooch
    o += L('M72.6,51 Q66,58 58.4,56', CM.silver, 1.2) + L('M72.6,51 Q66,58 58.4,56', OL, 0.4, 0.5);
    o += P('M55.6,77.4 L76,77.4 L75.6,81.4 L56.2,81.4 Z', '#18141e', 1.4) + R(63.4, 76.8, 5, 5, c.cel(CM.silver), 1.2);
    // high stiff collar rising behind the head, purple inside
    o += P('M59,44 C54,38 52,30 54,22 C58,28 63,33 68,38 L66,44 Z', c.lg([[0, CM.lining], [1, dk(CM.purple, 0.3)]], 0, 0, 1, 1), 1.9) + L('M54,22 C53,30 55,38 59,44', CM.silver, 1.3);
    o += P('M60,37 Q67,34.5 74,36.5 L75,44.4 Q67,47 59,44.4 Z', c.cel(CM.black), 1.8) + L('M60.4,43.6 Q67,46.2 74.6,43.6', CM.silver, 1.2);
    // the small black dragon brooch, the cabal's sign
    o += C(73, 50.6, 3.8, c.cel(CM.silver), 1.2);
    o += P('M70.4,52.6 C71,50 72.6,48.6 74.6,48.6 L76.4,47.2 L75.8,49.4 C75.2,51 73.8,52 72.4,52 L74,53.8 L71.8,53.2 Z M71.6,50.4 L69.8,47.8 L72.8,49.2 Z', '#0c0a10', 0.6) + C(74.8, 49.2, 0.4, '#ff3a3a');
    // head: lean, cruel, slicked dark hair greying at the temple, a thin beard
    var X = 70.5, Y = 25, r = 10;
    function q(u, v) { return n(X + r * u) + ',' + n(Y + r * v); }
    o += P('M' + q(-0.7, -0.9) + ' C' + q(-1.4, -0.7) + ' ' + q(-1.6, 0.2) + ' ' + q(-1.3, 0.72) + ' L' + q(-0.8, 0.46) + ' Z', c.cel(CM.hair), 1.8);
    var face = 'M' + q(-1, 0.05) + ' C' + q(-1, -1.3) + ' ' + q(0.95, -1.3) + ' ' + q(1, -0.2) + ' L' + q(1.34, 0.36) + ' L' + q(1.02, 0.5) +
      ' C' + q(0.98, 0.96) + ' ' + q(0.5, 1.2) + ' ' + q(0.1, 1.14) + ' C' + q(-0.7, 1.02) + ' ' + q(-1, 0.55) + ' ' + q(-1, 0.05) + ' Z';
    o += P(face, c.cel(CM.skin), 2.1);
    o += CG(F('M' + q(-1.1, -0.1) + ' L' + q(-0.2, -0.1) + ' C' + q(-0.3, 0.5) + ' ' + q(0, 0.9) + ' ' + q(0.4, 1.3) + ' L' + q(-1.1, 1.3) + ' Z', dk(CM.skin, 0.3), 0.45), c.clip(face));
    o += L('M' + q(0.12, 0.32) + ' C' + q(0.2, 0.52) + ' ' + q(0.3, 0.62) + ' ' + q(0.42, 0.66), dk(CM.skin, 0.4), 1, 0.8);
    o += C(X - r * 0.36, Y + r * 0.12, r * 0.24, c.cel(CM.skin), 1.3);
    // thin beard along the jaw to a pointed chin, thin moustache, a smirk
    o += P('M' + q(-0.46, 0.4) + ' C' + q(-0.26, 0.9) + ' ' + q(0.1, 1.1) + ' ' + q(0.44, 1.14) + ' L' + q(0.6, 1.46) + ' L' + q(0.78, 1.08) + ' C' + q(0.86, 1.02) + ' ' + q(0.9, 0.96) + ' ' + q(0.9, 0.9) +
      ' C' + q(0.7, 0.98) + ' ' + q(0.5, 1.02) + ' ' + q(0.38, 1.0) + ' C' + q(0.08, 0.96) + ' ' + q(-0.2, 0.8) + ' ' + q(-0.4, 0.38) + ' Z', CM.hair, 0.9);
    o += P('M' + q(0.5, 0.68) + ' C' + q(0.66, 0.6) + ' ' + q(0.9, 0.6) + ' ' + q(1.04, 0.64) + ' L' + q(1.0, 0.72) + ' C' + q(0.86, 0.68) + ' ' + q(0.68, 0.72) + ' ' + q(0.52, 0.78) + ' Z', CM.hair, 0.8);
    o += L('M' + q(0.58, 0.86) + ' Q' + q(0.78, 0.86) + ' ' + q(0.96, 0.76), '#4a1a1a', 1.1);
    var ex = X + r * 0.52, ey = Y - r * 0.04;
    o += P('M' + n(ex - 2.4) + ',' + n(ey) + ' Q' + n(ex) + ',' + n(ey - 1.6) + ' ' + n(ex + 2.6) + ',' + n(ey - 0.2) + ' Q' + n(ex) + ',' + n(ey + 1.3) + ' ' + n(ex - 2.4) + ',' + n(ey) + ' Z', '#f4efe6', 0.8);
    o += C(ex + 0.7, ey - 0.1, 1, '#5a4a7a') + C(ex + 0.8, ey - 0.1, 0.45, '#0a0810');
    o += P('M' + n(ex - 3.4) + ',' + n(ey - 4.4) + ' L' + n(ex + 3.2) + ',' + n(ey - 1.6) + ' L' + n(ex + 3) + ',' + n(ey - 2.9) + ' L' + n(ex - 3) + ',' + n(ey - 5.6) + ' Z', CM.hair, 0.8);
    // slicked-back hair, a grey streak at the temple, widow's peak
    o += P('M' + q(0.9, -0.5) + ' C' + q(0.9, -1.3) + ' ' + q(-0.4, -1.5) + ' ' + q(-1.08, -0.9) + ' C' + q(-1.3, -0.5) + ' ' + q(-1.2, 0) + ' ' + q(-1.0, 0.28) +
      ' L' + q(-0.66, 0.1) + ' C' + q(-0.56, -0.2) + ' ' + q(-0.4, -0.4) + ' ' + q(-0.1, -0.5) + ' L' + q(0.46, -0.3) + ' Z', c.lg([[0, '#4a4058'], [0.4, CM.hair], [1, '#0a080c']], 0.7, 0, 0.3, 1), 1.9);
    o += L('M' + q(0.6, -0.8) + ' C' + q(0.1, -1.1) + ' ' + q(-0.5, -1.0) + ' ' + q(-0.95, -0.6) + ' M' + q(0.7, -0.6) + ' C' + q(0.2, -0.8) + ' ' + q(-0.3, -0.76) + ' ' + q(-0.8, -0.4), '#6a6078', 1, 0.8);
    o += L('M' + q(-0.1, -0.44) + ' C' + q(-0.4, -0.5) + ' ' + q(-0.7, -0.3) + ' ' + q(-0.86, 0.02), '#a8a8b4', 1.4, 0.95);
    // the rapier: thin silver blade thrust forward, a swept hilt round the hand
    var blade = 'M' + n(fHd[0] + 3) + ',' + n(fHd[1] - 1.2) + ' L124.6,49.6 L' + n(fHd[0] + 3.4) + ',' + n(fHd[1] + 0.8) + ' Z';
    o += P(blade, c.lg([[0, '#ffffff'], [0.5, '#c8d0dc'], [1, '#7a8494']], 0, 0, 0, 1), 1.3) + L('M' + n(fHd[0] + 4) + ',' + n(fHd[1] - 0.5) + ' L121,50.6', '#ffffff', 0.7, 0.9);
    o += tube([fSh, fEl, fHd], 7.6, CM.black, '#3e3448');
    o += E(fSh[0] + 1.5, fSh[1] + 1, 7.2, 6, c.cel(CM.purple), 2) + L('M' + n(fSh[0] - 3) + ',' + n(fSh[1] - 2.6) + ' Q' + n(fSh[0] + 1) + ',' + n(fSh[1] + 3) + ' ' + n(fSh[0] + 1) + ',' + n(fSh[1] + 7), CM.silver, 1.2);
    o += tube([lerp(fEl, fHd, 0.5), fHd], 8.2, '#141018') + L('M' + n(lerp(fEl, fHd, 0.5)[0] - 0.6) + ',' + n(lerp(fEl, fHd, 0.5)[1] - 4) + ' L' + n(lerp(fEl, fHd, 0.5)[0] + 0.4) + ',' + n(lerp(fEl, fHd, 0.5)[1] + 4), CM.silver, 1.5);
    o += C(fHd[0], fHd[1], 4.4, c.cel('#2a2230'), 2);
    o += L('M' + n(fHd[0] + 1.6) + ',' + n(fHd[1] - 6.4) + ' C' + n(fHd[0] + 6) + ',' + n(fHd[1] - 6) + ' ' + n(fHd[0] + 6) + ',' + n(fHd[1] + 4) + ' ' + n(fHd[0] + 1) + ',' + n(fHd[1] + 6.4), OL, 3.4) +
      L('M' + n(fHd[0] + 1.6) + ',' + n(fHd[1] - 6.4) + ' C' + n(fHd[0] + 6) + ',' + n(fHd[1] - 6) + ' ' + n(fHd[0] + 6) + ',' + n(fHd[1] + 4) + ' ' + n(fHd[0] + 1) + ',' + n(fHd[1] + 6.4), CM.silver, 1.6);
    o += L('M' + n(fHd[0] + 4.2) + ',' + n(fHd[1] - 5) + ' L' + n(fHd[0] + 4.6) + ',' + n(fHd[1] + 3.4), OL, 3.6) + L('M' + n(fHd[0] + 4.2) + ',' + n(fHd[1] - 5) + ' L' + n(fHd[0] + 4.6) + ',' + n(fHd[1] + 3.4), CM.silver, 1.8);
    o += C(fHd[0] - 3.2, fHd[1] + 1.4, 1.8, c.cel(CM.silver), 1.1);
    return o;
  }
  function cassiusMob(c) { return shadow(c, 64, 30) + G(cassiusRig(c), 'matrix(-1,0,0,1,128,0)'); }

  // =====================================================================
  // SCENE: silverleaf_lodge (400 x 240)
  // =====================================================================
  function pine(c, x, base, h, w, col, rim, burnt, seed) {
    var r = rng(seed || 3), o = '', tr = burnt === 2 ? '#1c1614' : '#3a2a22';
    o += P('M' + n(x - w * 0.09) + ',' + n(base) + ' L' + n(x - 0.8) + ',' + n(base - h) + ' L' + n(x + 0.8) + ',' + n(base - h) + ' L' + n(x + w * 0.09) + ',' + n(base) + ' Z', tr, 1.2);
    if (burnt === 2) {
      // bare charred snag: stubby broken branches
      var br = '';
      for (var i = 0; i < 9; i++) { var y = base - h * (0.25 + i * 0.075), s = i % 2 ? 1 : -1, len = w * (0.5 - i * 0.04) * (0.6 + r() * 0.5); br += 'M' + n(x) + ',' + n(y) + ' L' + n(x + s * len) + ',' + n(y - len * 0.3 + r() * 3); }
      return o + L(br, OL, 3.2) + L(br, '#2a201c', 1.6);
    }
    var tiers = Math.max(4, Math.round(h / 12));
    for (var t = 0; t < tiers; t++) {
      var f = t / tiers, ty = base - h * 0.2 - h * 0.8 * f, tw = w * (1 - f * 0.82) * (0.9 + r() * 0.2), th = h * 0.8 / tiers * 1.9;
      var cc = burnt === 1 && t < tiers * 0.45 ? '#2a221e' : col;
      o += P('M' + n(x - tw) + ',' + n(ty + 3) + ' Q' + n(x - tw * 0.45) + ',' + n(ty - th * 0.3) + ' ' + n(x) + ',' + n(ty - th) + ' Q' + n(x + tw * 0.45) + ',' + n(ty - th * 0.3) + ' ' + n(x + tw) + ',' + n(ty + 3) +
        ' Q' + n(x + tw * 0.5) + ',' + n(ty) + ' ' + n(x) + ',' + n(ty + 2) + ' Q' + n(x - tw * 0.5) + ',' + n(ty) + ' ' + n(x - tw) + ',' + n(ty + 3) + ' Z', cc, 1.3);
      if (rim && cc === col) o += L('M' + n(x + tw * 0.15) + ',' + n(ty - th * 0.7) + ' Q' + n(x + tw * 0.55) + ',' + n(ty - th * 0.2) + ' ' + n(x + tw * 0.92) + ',' + n(ty + 2), rim, 1.2, 0.7);
    }
    return o;
  }
  function tuft(x, y, s, col) { return F('M' + n(x - 3 * s) + ',' + n(y) + ' L' + n(x - 2.2 * s) + ',' + n(y - 5 * s) + ' L' + n(x - 0.9 * s) + ',' + n(y - 1.2 * s) + ' L' + n(x + 0.2 * s) + ',' + n(y - 7 * s) + ' L' + n(x + 0.9 * s) + ',' + n(y - 1.2 * s) + ' L' + n(x + 2.4 * s) + ',' + n(y - 5.4 * s) + ' L' + n(x + 3 * s) + ',' + n(y) + ' Z', col); }
  function lodgeScene(c) {
    var r = rng(4117), s = '';
    var CH = '#2a201c', CHL = '#4a3428', WOODL = '#b8986e', STONE = '#9a938a';
    // muted sunset sky
    s += R(0, 0, 400, 240, c.lg([[0, '#3e3e5e'], [0.25, '#665672'], [0.43, '#a8767a'], [0.53, '#d89a78'], [0.6, '#eab88a']]));
    s += C(300, 112, 120, glow(c, '#ffd6a0', 0.6));
    s += C(300, 116, 16, c.rg([[0, '#fff4dc'], [0.7, '#ffd8a4'], [1, '#f6b478']]));
    // long thin clouds, lit from below
    [[40, 34, 110, 5], [150, 22, 90, 4], [230, 58, 130, 5], [60, 76, 80, 4], [320, 40, 70, 3.5]].forEach(function (q) {
      var x = q[0], y = q[1], w = q[2], h = q[3];
      s += F('M' + x + ',' + y + ' Q' + n(x + w * 0.3) + ',' + n(y - h * 1.6) + ' ' + n(x + w * 0.6) + ',' + n(y - h) + ' Q' + n(x + w * 0.85) + ',' + n(y - h * 1.8) + ' ' + (x + w) + ',' + y + ' Q' + n(x + w * 0.5) + ',' + n(y + h) + ' ' + x + ',' + y + ' Z', '#8a6a80', 0.85);
      s += L('M' + n(x + w * 0.1) + ',' + n(y + h * 0.3) + ' Q' + n(x + w * 0.5) + ',' + n(y + h * 0.9) + ' ' + n(x + w * 0.9) + ',' + n(y + h * 0.2), '#f0b494', 1.3, 0.8);
    });
    // soft sun rays
    s += F('M300,116 L180,0 L222,0 Z M300,116 L262,0 L290,0 Z M300,116 L360,0 L398,0 Z', '#fff0d0', 0.08);
    // far highland hills
    s += F('M0,118 C40,108 84,104 132,110 C184,116 222,100 272,104 C320,108 360,100 400,106 L400,150 L0,150 Z', '#7a6c88');
    s += F('M0,126 C60,116 110,122 160,118 C220,114 262,124 312,118 C352,114 382,120 400,118 L400,150 L0,150 Z', '#5f6474');
    // far treeline of pines
    var tl = '';
    for (var x = -4; x < 406; x += 6 + r() * 5) { var h = 12 + r() * 16, w = 3 + r() * 2.5, b = 134 + r() * 2; tl += 'M' + n(x - w) + ',' + n(b) + ' L' + n(x) + ',' + n(b - h) + ' L' + n(x + w) + ',' + n(b) + ' Z'; }
    s += F(tl, '#3c4640') + R(0, 130, 400, 8, '#3c4640');
    // ground: scorched meadow, warm sunset light
    s += P('M0,132 C80,128 160,134 240,130 C300,127 350,131 400,129 L400,240 L0,240 Z', c.lg([[0, '#6e5e42'], [0.35, '#54463a'], [1, '#2e2622']]), 0);
    // burned patches and ash
    [[60, 170, 46, 8], [256, 150, 54, 6], [150, 206, 64, 10], [330, 198, 46, 8], [210, 176, 32, 5]].forEach(function (q, i) {
      var x = q[0], y = q[1], w = q[2], h = q[3], d = 'M' + (x - w) + ',' + y;
      for (var k = 1; k <= 8; k++) { var a = PI + k / 8 * PI * 2, rr = 0.7 + r() * 0.45; d += ' Q' + n(x + Math.cos(a - PI / 8) * w * 1.05) + ',' + n(y + Math.sin(a - PI / 8) * h * 1.1) + ' ' + n(x + Math.cos(a) * w * rr) + ',' + n(y + Math.sin(a) * h * rr); }
      s += F(d + ' Z', '#1e1816', 0.42) + L('M' + n(x - w * 0.5) + ',' + n(y - h * 0.1) + ' Q' + n(x) + ',' + n(y - h * 0.5) + ' ' + n(x + w * 0.45) + ',' + n(y), '#8a8278', 1.6, 0.4);
    });
    // back pines, a burned snag
    s += pine(c, 226, 134, 96, 12, '#2c3c34', null, 2, 9);
    s += pine(c, 244, 132, 70, 16, '#34463a', '#b08a5a', 1, 5);
    // the small pavilion behind (right): swept spire roof, burned through
    s += R(262, 124, 60, 6, STONE, 1.3);
    [268, 292, 316].forEach(function (px, i) { s += R(px - 2, i === 2 ? 110 : 100, 4, i === 2 ? 14 : 24, CH, 1.1); });
    s += P('M258,100 C272,96 284,82 292,54 C300,82 312,96 326,100 Q292,105 258,100 Z', c.lg([[0, '#6a3c38'], [1, '#2e2226']]), 1.6);
    s += P('M300,72 L310,88 L306,92 L318,98 L304,100 L296,90 Z', '#140e0e', 0);
    s += L('M300,74 L312,62 M304,84 L318,80 M306,94 L322,106', CH, 2.4) + L('M258,100 Q272,99 286,101', '#a88a50', 1.4) + P('M292,54 C290,46 291,40 294,34 C295,40 295,48 292,54 Z', '#8a7040', 1.1);
    // the main hall (left): elven timber, graceful curved roof, the right half fallen in
    s += P('M34,138 L174,138 L170,131 L38,131 Z', c.cel(STONE), 1.5);
    s += F('M44,131 L44,94 Q80,88 120,90 L164,98 L164,131 Z', '#1a1412');
    s += L('M52,96 L52,131 M60,96 L60,131 M88,95 L88,131 M96,95 L96,131', '#2e2420', 1.4, 0.9);
    [[48, 92, 131], [76, 94, 131], [104, 94, 131], [132, 106, 131], [160, 116, 131]].forEach(function (q, i) {
      var x0 = q[0], y0 = q[1];
      s += P('M' + (x0 - 3) + ',131 L' + (x0 - 3) + ',' + (y0 + (i > 2 ? 3 : 0)) + ' L' + (x0 - 1) + ',' + y0 + ' L' + (x0 + 1) + ',' + (y0 + (i > 2 ? 4 : 0)) + ' L' + (x0 + 3) + ',' + (y0 + (i > 2 ? 1 : 0)) + ' L' + (x0 + 3) + ',131 Z', CH, 1.3);
      s += L('M' + (x0 + 2) + ',' + (y0 + 5) + ' L' + (x0 + 2) + ',129', '#9a5a38', 0.9, 0.7);
    });
    // curved elven brackets between the standing posts, part burned
    s += L('M51,108 Q62,96 73,108 M79,108 Q90,96 101,108', OL, 4.6) + L('M51,108 Q62,96 73,108', WOODL, 2.6) + L('M79,108 Q90,96 101,108', CHL, 2.6);
    // roof
    var roof = 'M20,84 C34,94 64,98 92,97 L126,96 L120,89 L128,83 L118,77 L124,69 L116,65 L82,61 L46,59 C40,61 30,71 20,84 Z';
    s += P(roof, c.lg([[0, '#74403a'], [0.55, '#4a2c2c'], [1, '#2a1e20']], 0, 0, 0.3, 1), 1.8);
    s += CG(L('M28,80 C50,88 80,90 124,88 M36,72 C56,79 84,80 122,79 M42,65 C60,70 84,70 118,70', '#2a1a1a', 1.2, 0.8) +
      F('M64,74 L78,72 L84,80 L70,84 Z', '#120c0c') + F('M92,64 L108,66 L114,90 L100,92 L96,78 Z', '#161010', 0.9) + F('M20,84 L60,90 L90,74 L50,60 Z', '#9a4a3e', 0.25), c.clip(roof));
    s += L('M68,76 L80,82 M96,70 L104,88', CH, 2);
    s += L('M20,84 C34,94 64,98 92,97', '#b0924e', 1.8) + L('M20,84 C22,80 22,76 18,72', OL, 3.4) + L('M20,84 C22,80 22,76 18,72', '#b0924e', 1.6);
    s += L('M46,59 C62,59 84,61 116,65', '#a88a50', 1.3, 0.8);
    // a torn, faded crimson-and-gold banner still hanging under the eave
    s += P('M57,96 L69,96.6 L68.6,117 L66,113 L63.6,120 L61,114 L58,118 Z', c.lg([[0, '#9a4038'], [1, '#5a2624']]), 1.4);
    s += L('M57.6,99 L68.8,99.6', '#c8a050', 1.4) + G(P(leafD(0.55), '#c8a050', 0.7), 'translate(63.2,110)');
    // gable finial: a tall leaf spire
    s += P('M46,59 C41,50 41,42 45,32 C49,42 51,50 48,59 Z', c.lg([[0, '#c8a860'], [1, '#6a5430']], 0, 0, 1, 0), 1.3);
    // bare rafters where the roof fell, beams down on the plinth
    var raf = 'M118,66 L148,58 M122,77 L154,70 M126,86 L150,104 M134,96 L162,124 M140,131 L172,120 M110,64 L136,52';
    s += L(raf, OL, 4.6) + L(raf, CH, 2.6) + L('M120,67 L146,60 M124,78 L150,72', '#7a4a34', 0.9, 0.8);
    s += F('M128,131 L136,122 L146,126 L152,118 L162,124 L170,120 L174,131 Z', '#1e1816') + F('M134,131 L140,126 L150,129 L160,126 L168,131 Z', '#6e6860', 0.6);
    // the grove shrine, still standing, its leaf symbol faintly lit
    var SX = 192;
    s += C(SX, 114, 26, glow(c, '#c8f0a0', 0.4));
    s += P('M172,142 L212,142 L209,136 L175,136 Z', c.cel('#a8a294'), 1.4) + P('M177,136 L207,136 L205,131 L179,131 Z', c.cel('#b4ae9e'), 1.4);
    var up = 'M181,131 C175,118 178,104 192,89 C186,104 186,118 188,131 Z', up2 = 'M203,131 C209,118 206,104 192,89 C198,104 198,118 196,131 Z';
    s += P(up, c.cel('#c4beac'), 1.6) + P(up2, c.cel('#c4beac'), 1.6);
    s += F('M181,128 C179,122 179,118 181,114 L184,120 L185,128 Z M203,127 C205,121 205,117 204,113 L201,120 L200,127 Z', '#6a9a4a', 0.8);
    s += C(SX, 114, 7, c.cel('#cfc9b8'), 1.4) + C(SX, 114, 11, glow(c, '#d8ffb0', 0.55));
    s += G(P(leafD(1), c.lg([[0, '#f0ffd8'], [1, '#98d870']], 0, 0, 1, 0), 0.9) + L('M0,-1.2 L0,-8.6', '#5a9a3a', 0.7), 'translate(' + SX + ',119) scale(0.95)');
    // new growth: shoots through the ash, a few flowers
    var tf = '';
    for (var i = 0; i < 70; i++) {
      var tx = r() * 400, ty = 134 + Math.pow(r(), 0.8) * 104, sc = 0.45 + (ty - 134) / 104 * 0.9;
      tf += tuft(tx, ty, sc, r() < 0.5 ? '#6aa844' : '#8cc85a');
    }
    s += tf;
    for (var j = 0; j < 26; j++) { var fx = r() * 400, fy = 138 + r() * 96; s += C(fx, fy, 0.9 + r() * 0.8, r() < 0.5 ? '#f0f0d8' : '#f4d060', 0, 0.9); }
    [[178, 142, 1.2], [206, 143, 1.1], [168, 140, 0.8], [214, 141, 0.9]].forEach(function (q) { s += tuft(q[0], q[1], q[2], '#9ad866'); });
    // tall highland pines framing the lodge
    s += pine(c, 14, 150, 170, 26, '#2a3a30', '#b89060', 0, 11);
    s += pine(c, 352, 140, 130, 20, '#2e3e34', '#c09a66', 1, 13);
    s += pine(c, 388, 152, 180, 28, '#26352c', '#b89060', 0, 17);
    // foreground: a charred stump and a fallen beam at the edges, ash in the grass
    s += P('M2,236 L4,214 L10,210 L14,216 L18,212 L20,236 Z', CH, 1.6) + L('M8,214 L8,234', CHL, 1);
    s += P('M330,232 L398,220 L400,228 L334,240 Z', CH, 1.6) + L('M336,234 L396,223', '#5a3a2c', 1.2);
    s += tuft(24, 236, 1.6, '#7ab84e') + tuft(340, 238, 1.5, '#8cc85a') + tuft(396, 236, 1.4, '#6aa844');
    // light motes drifting in the low sun
    for (var m = 0; m < 16; m++) s += C(120 + r() * 270, 60 + r() * 110, 0.8 + r() * 0.8, '#fff0c8', 0, 0.55);
    // warm haze and vignette
    s += R(0, 0, 400, 240, c.lg([[0, '#1a1428', 0.28], [0.35, '#1a1428', 0], [0.75, '#2a1a10', 0.05], [1, '#140c08', 0.35]]));
    s += R(0, 0, 400, 240, c.rg([[0.6, '#000', 0], [1, '#000', 0.35]], 0.55, 0.5, 0.75));
    return s;
  }

  // =====================================================================
  // ICONS (64 x 64, the art.js / art_icons10.js frame)
  // =====================================================================
  function iconWrap(c, bg, glyph) {
    return R(0, 0, 64, 64, c.rg([[0, bg[0]], [1, bg[1]]], 0.42, 0.38, 0.75)) + glyph +
      R(0, 0, 64, 64, c.rg([[0.62, '#000', 0], [1, '#000', 0.5]], 0.5, 0.5, 0.72)) +
      '<rect x="1.5" y="1.5" width="61" height="61" fill="none" stroke="#0b0806" stroke-width="3"/>' +
      L('M3.8,60.2 L3.8,3.8 L60.2,3.8', '#ffffff', 1.6, 0.4) + L('M3.8,60.2 L60.2,60.2 L60.2,3.8', '#000000', 1.6, 0.55);
  }
  function iglow(c, x, y, r, col, o) { return C(x, y, r, c.rg([[0, lt(col, 0.6), o == null ? 0.8 : o], [0.45, col, (o == null ? 0.8 : o) * 0.45], [1, col, 0]])); }
  var ICONS = {
    legend_lyveus: function (c) {
      var keep = SWM, g;
      SWM = 0.9;
      try { g = G(lyvRig(c, POSE_SPRITE, { upper: true }), 'matrix(1.22,0,0,1.22,-51,0.5)') + G(kite(c), 'translate(9,56) rotate(-14) scale(0.95)'); } finally { SWM = keep; }
      return iconWrap(c, ['#7cc4aa', '#0e2a24'], iglow(c, 40, 24, 30, '#d8fff0', 0.35) + g);
    },
    oathbound_strike: function (c) {
      var arc = 'M6,54 C14,30 32,12 58,6 C38,18 24,32 14,58 Z';
      var lv = [[12, 18, -40, 0.75, '#8ad05a'], [50, 42, 60, 0.7, '#a8e068'], [20, 40, -110, 0.6, '#6ab846'], [44, 16, 20, 0.6, '#b8e878'], [56, 28, 100, 0.55, '#8ad05a']];
      var o = iglow(c, 34, 30, 30, '#ffe08a', 0.85);
      o += P(arc, c.lg([[0, '#fff6c0', 0.95], [0.5, '#ffd24a', 0.85], [1, '#e89a20', 0.6]], 0, 1, 1, 0), 0) + F('M10,52 C18,32 34,16 54,9 C38,20 26,34 16,54 Z', '#ffffff', 0.7);
      o += L('M16,48 L54,10', '#ffe070', 11, 0.5) + L('M16,48 L54,10', '#fff8d0', 5, 0.6) + G(lsword(c, 50), 'translate(17,47) rotate(45) scale(1.08)');
      lv.forEach(function (q) { o += leaf(c, q[0], q[1], q[2], q[3], q[4]); });
      return iconWrap(c, ['#d8b048', '#1c2408'], o + sparkle(52, 10, 3.6, '#ffffff') + sparkle(10, 34, 2.6, '#fff4c0') + sparkle(40, 54, 2.4, '#fff4c0'));
    },
    ancients_bulwark: function (c) {
      var o = iglow(c, 32, 33, 34, '#e8f8a0', 0.75);
      var ray = '';
      for (var i = 0; i < 16; i++) { var a = i / 16 * PI * 2; ray += 'M' + n(32 + Math.cos(a) * 22) + ',' + n(33 + Math.sin(a) * 22) + ' L' + n(32 + Math.cos(a) * 31) + ',' + n(33 + Math.sin(a) * 31); }
      o += L(ray, '#f4ffc0', 1.6, 0.7);
      o += E(32, 33, 25, 25, 'none', 0).replace('fill="none"', 'fill="none" stroke="#e0f890" stroke-width="3" opacity="0.8"') + E(32, 33, 20.5, 20.5, 'none', 0).replace('fill="none"', 'fill="none" stroke="#ffffff" stroke-width="1.2" opacity="0.7"');
      o += C(32, 33, 19, c.rg([[0, '#f0ffc0', 0.05], [0.8, '#c8f070', 0.35], [1, '#f4ffd0', 0.6]]));
      o += leaf(c, 10, 14, -50, 0.6, '#9ad860') + leaf(c, 55, 50, 130, 0.6, '#9ad860') + leaf(c, 54, 14, 40, 0.5, '#b8e878') + leaf(c, 9, 52, -140, 0.5, '#b8e878');
      o += G(kite(c), 'translate(32,31) scale(1.02)');
      return iconWrap(c, ['#88c450', '#0c2008'], o + sparkle(32, 5.5, 3, '#ffffff') + sparkle(58, 33, 2.4, '#ffffff'));
    },
    silverleaf_aegis: function (c) {
      var o = iglow(c, 32, 28, 26, '#e8f0b8', 0.4);
      o += E(32, 57, 16, 3, '#000', 0, 0.35) + G(kite(c), 'translate(32,30) rotate(-6) scale(1.28)');
      return iconWrap(c, ['#5e6e4a', '#10140c'], o + sparkle(21, 14, 3, '#ffffff') + sparkle(46, 48, 2, '#ffffff', 0.8));
    }
  };

  // =====================================================================
  // DEATHWING, the Black Ruin (story actor, 160x160, facing LEFT): wings spread, iron plates bolted to his hide,
  // molten cracks glowing between them, fire in his jaws. Bigger and more monstrous than onyxia / nefarian.
  // =====================================================================
  function bz(q, t) {
    var u = 1 - t;
    return [u * u * u * q[0][0] + 3 * u * u * t * q[1][0] + 3 * u * t * t * q[2][0] + t * t * t * q[3][0],
      u * u * u * q[0][1] + 3 * u * u * t * q[1][1] + 3 * u * t * t * q[2][1] + t * t * t * q[3][1]];
  }
  // tapered ribbon along a cubic bezier: width w0 at the root to w1 at the tip
  function ribbon(q, w0, w1, N) {
    N = N || 20; var Lf = [], Rt = [];
    for (var i = 0; i <= N; i++) {
      var t = i / N, p = bz(q, t), a = bz(q, Math.max(0, t - 0.01)), b = bz(q, Math.min(1, t + 0.01));
      var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / len, ny = dx / len, w = (w0 + (w1 - w0) * t) / 2;
      Lf.push([p[0] + nx * w, p[1] + ny * w]); Rt.push([p[0] - nx * w, p[1] - ny * w]);
    }
    return pd(Lf.concat(Rt.reverse()), true);
  }
  var DW = { hide: '#241d24', hideL: '#3e3238', plate: '#4a4448', plateL: '#776e70', mem: '#4a1e1c', memL: '#7e3628', molt: '#ff6a1a', core: '#ffd868', ember: '#ff3a0a' };
  function molten(d, w) { w = w || 1; return L(d, DW.ember, 4.6 * w, 0.45) + L(d, DW.molt, 2.2 * w) + L(d, DW.core, 0.8 * w, 0.95); }
  function rivets(pts) { return pts.map(function (p) { return C(p[0], p[1], 0.9, '#9a9294', 0.5); }).join(''); }
  function dwWing(c, sh, wr, tips, root) {
    // membrane from the shoulder through the finger tips, scalloped between them, back to the body
    var d = 'M' + pt(sh) + ' L' + pt(wr) + ' L' + pt(tips[0]);
    for (var i = 1; i < tips.length; i++) { var a = tips[i - 1], b = tips[i], m = lerp(a, b, 0.5), k = lerp(m, wr, 0.12); d += ' Q' + pt(k) + ' ' + pt(b); }
    var last = tips[tips.length - 1], km = lerp(lerp(last, root, 0.5), wr, 0.2);
    d += ' Q' + pt(km) + ' ' + pt(root) + ' Z';
    var o = P(d, c.lg([[0, lt(DW.memL, 0.12)], [0.45, DW.memL], [1, DW.mem]], 0.2, 0, 0.6, 1), 2);
    // veins glowing faintly, torn notches near the edge
    var v = '';
    tips.forEach(function (t, i) { if (i) v += 'M' + pt(wr) + ' L' + pt(lerp(wr, t, 0.95)); });
    o += L(v, OL, 3.6) + L(v, DW.hideL, 1.6);
    o += L('M' + pt(lerp(wr, tips[1], 0.3)) + ' L' + pt(lerp(wr, tips[1], 0.7)), DW.molt, 0.8, 0.6);
    o += L('M' + pt(sh) + ' L' + pt(wr) + ' L' + pt(tips[0]), OL, 7) + L('M' + pt(sh) + ' L' + pt(wr) + ' L' + pt(tips[0]), DW.hideL, 4.2);
    // a claw on the wrist, an iron cap on the arm
    o += P('M' + pt([wr[0] - 3, wr[1] + 2]) + ' L' + pt([wr[0], wr[1] - 8]) + ' L' + pt([wr[0] + 3, wr[1] + 1]) + ' Z', '#cfc6b8', 1.2);
    var mid = lerp(sh, wr, 0.5);
    o += P('M' + pt([mid[0] - 5, mid[1] - 3]) + ' L' + pt([mid[0] + 4, mid[1] - 5]) + ' L' + pt([mid[0] + 6, mid[1] + 3]) + ' L' + pt([mid[0] - 3, mid[1] + 5]) + ' Z', c.cel(DW.plate), 1.4) + rivets([[mid[0] - 2, mid[1] - 2], [mid[0] + 3, mid[1] + 1]]);
    return o;
  }
  function flameD(x, y, s, lean) {
    lean = lean || 0;
    return 'M' + n(x) + ',' + n(y) + ' C' + n(x - 8 * s) + ',' + n(y) + ' ' + n(x - 9 * s + lean * 0.3) + ',' + n(y - 9 * s) + ' ' + n(x - 4 * s + lean * 0.6) + ',' + n(y - 14 * s) +
      ' C' + n(x - 4 * s + lean * 0.6) + ',' + n(y - 9 * s) + ' ' + n(x - 1 * s + lean * 0.7) + ',' + n(y - 9 * s) + ' ' + n(x + lean) + ',' + n(y - 20 * s) +
      ' C' + n(x + 4 * s + lean * 0.7) + ',' + n(y - 12 * s) + ' ' + n(x + 5 * s + lean * 0.6) + ',' + n(y - 14 * s) + ' ' + n(x + 5 * s + lean * 0.6) + ',' + n(y - 16 * s) +
      ' C' + n(x + 10 * s + lean * 0.3) + ',' + n(y - 9 * s) + ' ' + n(x + 8 * s) + ',' + n(y) + ' ' + n(x) + ',' + n(y) + ' Z';
  }
  function fire(c, x, y, s, lean, sw) {
    return P(flameD(x, y, s, lean), '#e0401a', sw == null ? 1.4 : sw) + F(flameD(x, y - 1 * s, s * 0.7, lean * 0.7), '#ff9a2a') + F(flameD(x, y - 1.5 * s, s * 0.4, lean * 0.4), '#ffe68a');
  }
  function deathwing(c) {
    var o = '';
    o += E(80, 90, 74, 68, glow(c, DW.ember, 0.34));
    // far wing (up and back, to the right)
    o += dwWing(c, [108, 76], [132, 24], [[152, 7], [154, 44], [149, 78], [128, 96]], [118, 100]);
    // tail sweeping round behind, spiked
    var tq = [[136, 120], [154, 120], [150, 150], [126, 152]];
    o += P(ribbon(tq, 18, 3, 24), c.lg([[0, DW.hideL], [1, DW.hide]], 0, 0, 1, 1), 2);
    [0.25, 0.45, 0.65, 0.82].forEach(function (t) { var p = bz(tq, t); o += P('M' + n(p[0] - 3) + ',' + n(p[1] - 2) + ' L' + n(p[0] + 2) + ',' + n(p[1] - 9 + t * 4) + ' L' + n(p[0] + 4) + ',' + n(p[1] - 1) + ' Z', '#1a1418', 1.2); });
    o += molten('M' + pt(bz(tq, 0.15)) + ' L' + pt(bz(tq, 0.35)) + ' L' + pt(bz(tq, 0.5)), 0.8);
    // near wing (up and forward, over the head)
    o += dwWing(c, [86, 76], [52, 18], [[8, 7], [6, 38], [20, 60], [56, 82]], [70, 92]);
    // far legs
    o += tube([[108, 128], [114, 138], [107, 145]], 13, DW.hide) + tube([[134, 122], [148, 134], [141, 144]], 15, DW.hide);
    var claws = function (x, y, s2) { return P('M' + n(x - 8 * s2) + ',' + n(y) + ' L' + n(x - 12 * s2) + ',' + n(y + 4 * s2) + ' L' + n(x - 5 * s2) + ',' + n(y + 2 * s2) + ' L' + n(x - 3 * s2) + ',' + n(y + 4.6 * s2) + ' L' + n(x) + ',' + n(y + 2 * s2) + ' L' + n(x + 3 * s2) + ',' + n(y + 4.4 * s2) + ' L' + n(x + 4 * s2) + ',' + n(y) + ' Z', '#d8cfc0', 1.1); };
    o += claws(105, 147, 0.9) + claws(139, 147, 1);
    // the body: hunched, massive
    var bd = 'M56,112 C60,90 78,76 98,76 C122,74 144,88 150,110 C154,126 146,140 132,146 C114,152 86,152 70,142 C58,134 54,124 56,112 Z';
    o += P(bd, c.lg([[0, DW.hideL], [0.5, DW.hide], [1, '#140f14']], 0.3, 0, 0.7, 1), 2.4);
    o += CG(molten('M70,104 L80,112 L78,124 L90,132 M104,94 L112,106 L124,108 L132,122 M92,140 L104,136 L118,142 M120,86 L128,96 L140,100', 1), c.clip(bd));
    // iron plates bolted on, in rows along the back and flank
    [['M78,84 L96,78 L100,90 L82,96 Z', [[82, 86], [95, 82], [97, 88]]], ['M102,78 L122,80 L122,94 L104,94 Z', [[106, 82], [119, 83], [119, 91]]], ['M124,84 L140,96 L134,108 L124,98 Z', [[128, 90], [136, 98]]],
      ['M84,112 L102,108 L106,124 L88,128 Z', [[88, 114], [100, 111], [102, 122]]], ['M110,112 L128,114 L126,130 L110,128 Z', [[114, 116], [124, 117], [123, 126]]]].forEach(function (p) {
      o += P(p[0], c.cel(DW.plate), 1.6) + rivets(p[1]);
    });
    o += L('M80,86 L96,80 M104,80 L120,82', DW.plateL, 1, 0.8);
    [[84, 78], [96, 74], [108, 73], [120, 76], [132, 82], [142, 92]].forEach(function (p, i) { o += P('M' + n(p[0] - 4) + ',' + n(p[1] + 3) + ' L' + n(p[0] + 1) + ',' + n(p[1] - 11 + (i % 2) * 3) + ' L' + n(p[0] + 4) + ',' + n(p[1] + 3) + ' Z', '#1a1418', 1.3); });
    // neck reaching forward and down, plated, the throat glowing through the seams
    var nq = [[86, 104], [72, 98], [60, 86], [48, 76]];
    var neck = ribbon(nq, 32, 20, 22);
    o += P(neck, c.lg([[0, DW.hideL], [1, DW.hide]], 0, 0, 1, 1), 2.2);
    o += CG(molten('M52,92 L62,98 L60,86 L68,88 M64,106 L74,102', 0.9), c.clip(neck));
    [0.22, 0.46, 0.7].forEach(function (t) { var p = bz(nq, t); o += P('M' + n(p[0] - 5) + ',' + n(p[1] - 8) + ' L' + n(p[0] + 8) + ',' + n(p[1] - 10) + ' L' + n(p[0] + 9) + ',' + n(p[1]) + ' L' + n(p[0] - 3) + ',' + n(p[1] + 2) + ' Z', c.cel(DW.plate), 1.4) + rivets([[p[0] - 2, p[1] - 6], [p[0] + 6, p[1] - 7]]); });
    // near foreleg with an iron greave
    o += tube([[76, 124], [64, 136], [61, 143]], 16, DW.hide, '#140f14');
    o += P('M57,134 L70,130 L69,146 L59,148 Z', c.cel(DW.plate), 1.5) + rivets([[61, 136], [66, 134], [63, 145]]) + molten('M66,124 L72,128', 0.8);
    o += claws(60, 146, 1.15);
    // the head, low and forward: great swept horns, iron jaw plates, jaws open on fire
    var h = '';
    h += P('M56,40 C60,26 70,12 88,2 C80,16 72,30 66,44 Z', c.lg([[0, '#7a7070'], [1, '#2a2226']], 0, 0, 1, 0), 1.8) + P('M60,46 C70,40 84,36 98,38 C86,42 76,48 66,54 Z', c.lg([[0, '#5a5052'], [1, '#2a2226']], 0, 0, 1, 0), 1.6);
    h += P('M40,32 C40,22 46,14 54,10 C52,18 50,26 50,32 Z', '#3a3034', 1.4);
    h += P('M44,62 L42,74 L48,66 Z M50,62 L52,74 L55,64 Z', '#2a2226', 1.2);
    h += F('M48,60 L8,56 L12,80 Z', DW.ember) + F('M44,60 L12,58 L15,76 Z', DW.molt) + F('M36,61 L16,60 L18,72 Z', DW.core);
    h += P('M48,60 L30,63 L12,78 L16,82 L38,75 L54,66 Z', c.cel(DW.hide), 1.9);
    h += P('M16,79 L20,74 L22,80 Z M24,74 L27,69 L29,75 Z', '#e8e0d0', 0.7);
    var head = 'M62,40 C58,28 42,26 30,34 L10,46 L5,55 L30,58 L48,60 C58,58 64,50 62,40 Z';
    h += P(head, c.lg([[0, DW.hideL], [0.55, DW.hide], [1, '#140f14']], 0.3, 0, 0.7, 1), 2.2);
    h += P('M8,55 L11,59 L14,55 Z M17,56 L20,61 L23,56.4 Z M26,57 L29,62 L32,57.4 Z', '#e8e0d0', 0.7);
    h += P('M12,48 L34,40 L40,52 L10,54 Z', c.cel(DW.plate), 1.5) + rivets([[16, 50], [24, 47], [32, 45], [36, 50]]) + molten('M40,52 L48,50 L52,56', 0.8);
    h += P('M28,34 L46,32 L50,40 L30,40 Z', '#1a1418', 1.2);
    h += E(38, 40, 9, 6, glow(c, DW.molt, 0.95)) + P('M32,41 Q38,35.6 44,39 Q39,43 32,41 Z', DW.core, 1) + E(38.6, 40, 0.8, 2, '#3a0a00');
    o += G(h, 'matrix(1.2,0,0,1.2,1,20)');
    // fire pouring from the jaws onto the land below
    var gout = [[18, 102], [10, 116], [24, 132], [20, 146]];
    o += C(22, 120, 18, glow(c, '#ffb040', 0.8));
    o += P(ribbon(gout, 8, 26, 20), c.lg([[0, '#ffe68a'], [0.5, '#ff9a2a'], [1, '#e0401a']], 0, 0, 0, 1), 1.4) + F(ribbon(gout, 3, 12, 20), '#fff2b0', 0.85);
    o += fire(c, 20, 153, 1.1, -4, 1.2) + fire(c, 34, 152, 0.8, 4, 1) + fire(c, 10, 151, 0.5, -2, 0.9);
    return o;
  }

  // =====================================================================
  // STORY SCENES (480 x 270, opaque)
  // =====================================================================
  function rider(x, y, s, col, rim) {
    // a hooded rider galloping to the right, in silhouette
    function q(u, v) { return n(x + u * s) + ',' + n(y + v * s); }
    var d = 'M' + q(-11, -12) + ' C' + q(-6, -16) + ' ' + q(6, -16) + ' ' + q(10, -13) + ' L' + q(14, -20) + ' L' + q(20, -18) + ' L' + q(19, -14) + ' L' + q(14, -9) + ' C' + q(12, -6) + ' ' + q(8, -5) + ' ' + q(6, -5) +
      ' L' + q(10, 0) + ' L' + q(7, 0) + ' L' + q(3, -5) + ' L' + q(-5, -5) + ' L' + q(-9, 0) + ' L' + q(-12, 0) + ' L' + q(-9, -6) + ' C' + q(-13, -7) + ' ' + q(-16, -9) + ' ' + q(-19, -6) + ' C' + q(-17, -10) + ' ' + q(-14, -12) + ' ' + q(-11, -12) + ' Z';
    var man = 'M' + q(-6, -14) + ' L' + q(-7, -22) + ' C' + q(-6, -28) + ' ' + q(-3, -32) + ' ' + q(-6, -36) + ' C' + q(0, -34) + ' ' + q(4, -30) + ' ' + q(3, -24) + ' L' + q(5, -14) + ' Z M' + q(-6, -22) + ' L' + q(-18, -18) + ' L' + q(-14, -15) + ' L' + q(-6, -16) + ' Z';
    return F(d, col) + F(man, col) + L('M' + q(-10, -13) + ' C' + q(-4, -16) + ' ' + q(6, -16) + ' ' + q(10, -13) + ' M' + q(-6, -36) + ' C' + q(0, -34) + ' ' + q(4, -30) + ' ' + q(3, -24), rim, 1, 0.8);
  }
  function burningScene(c) {
    var r = rng(9133), s = '';
    s += R(0, 0, 480, 270, c.lg([[0, '#0a0814'], [0.35, '#2a1026'], [0.6, '#8a301a'], [0.76, '#e0701e'], [0.8, '#f09030']]));
    s += C(210, 196, 230, glow(c, '#ff8a2a', 0.55));
    for (var i = 0; i < 24; i++) s += C(r() * 480, r() * 70, 0.6 + r() * 0.7, '#fff0e0', 0, 0.7);
    // smoke pouring up from the roofs, lit from below
    [[150, 150, 60, -40], [250, 140, 70, 30], [380, 160, 44, 50]].forEach(function (q, k) {
      var x = q[0], y = q[1], w = q[2], lean = q[3], d = 'M' + n(x - w * 0.4) + ',' + n(y);
      for (var j = 0; j < 7; j++) { var t = (j + 1) / 7, cx = x + lean * t - w * (0.5 + t * 0.6), cy = y - t * (y + 10); d += ' Q' + n(cx - 14) + ',' + n(cy + 12) + ' ' + n(cx) + ',' + n(cy); }
      for (var j2 = 6; j2 >= 0; j2--) { var t2 = (j2 + 0.5) / 7, cx2 = x + lean * t2 + w * (0.5 + t2 * 0.6), cy2 = y - t2 * (y + 10); d += ' Q' + n(cx2 + 16) + ',' + n(cy2 - 6) + ' ' + n(cx2) + ',' + n(cy2 + 10); }
      s += F(d + ' Z', k === 1 ? '#2a1c20' : '#241820', 0.88) + L('M' + n(x - w * 0.5) + ',' + n(y - 10) + ' Q' + n(x) + ',' + n(y - 24) + ' ' + n(x + w * 0.5 + lean * 0.2) + ',' + n(y - 14), '#ff9a4a', 2, 0.35);
    });
    // far treeline against the glow, and a ridge on the right where the riders go
    var tl = '';
    for (var x = -4; x < 360; x += 6 + r() * 6) { var h = 14 + r() * 18, w = 3.5 + r() * 3; tl += 'M' + n(x - w) + ',206 L' + n(x) + ',' + n(206 - h) + ' L' + n(x + w) + ',206 Z'; }
    s += F(tl, '#140a0e') + R(0, 204, 480, 10, '#140a0e');
    s += F('M330,214 C370,204 410,198 480,200 L480,230 L330,230 Z', '#120a0c');
    s += rider(376, 208, 1.3, '#0a0608', '#ff8a3a') + rider(410, 204, 1.18, '#0a0608', '#ff8a3a') + rider(442, 201, 1.05, '#0a0608', '#ff8a3a');
    // the lodge, whole on this night: timber halls with curved elven roofs, burning
    s += R(104, 206, 240, 10, '#2a1a16', 1.6);
    s += P('M122,206 L122,164 L326,164 L326,206 Z', '#2a1814', 1.8);
    [[138, 176], [170, 176], [202, 176], [246, 176], [278, 176], [310, 176]].forEach(function (p) {
      s += P('M' + (p[0] - 8) + ',' + (p[1] + 22) + ' L' + (p[0] - 8) + ',' + p[1] + ' Q' + p[0] + ',' + (p[1] - 10) + ' ' + (p[0] + 8) + ',' + p[1] + ' L' + (p[0] + 8) + ',' + (p[1] + 22) + ' Z', c.lg([[0, '#fff0a0'], [0.5, '#ffb040'], [1, '#e0601a']]), 1.4);
      s += L('M' + p[0] + ',' + (p[1] - 6) + ' L' + p[0] + ',' + (p[1] + 22), '#2a1814', 1.6);
    });
    s += R(222, 170, 14, 36, '#1a0e0c', 1.4) + L('M126,206 L126,166 M226,206 L226,166 M322,206 L322,166', '#1a0e0c', 3);
    // upper roof: steep, concave, rising to a leaf finial; lower roof: a skirt with upswept eave tips
    var up = 'M114,146 C150,140 184,122 206,98 C214,88 220,76 226,60 C232,76 238,88 246,98 C268,122 302,140 338,146 Z';
    s += P(up, c.lg([[0, '#6a3026'], [0.55, '#3e1e1a'], [1, '#1e1010']]), 2);
    s += CG(L('M150,140 C180,128 200,112 214,94 M300,140 C272,128 252,112 238,94 M136,146 C170,138 196,124 210,106', '#1a0c0c', 1.3, 0.8) + F('M170,146 L204,108 L220,146 Z', '#ff7a2a', 0.3), c.clip(up));
    s += L('M114,146 C150,140 184,122 206,98 C214,88 220,76 226,60 C232,76 238,88 246,98 C268,122 302,140 338,146', '#c89a4a', 1.4, 0.9);
    var skirt = 'M76,150 C90,162 112,168 138,168 L314,168 C340,168 362,162 376,150 C362,154 346,152 332,144 L120,144 C106,152 90,154 76,150 Z';
    s += P(skirt, c.lg([[0, '#5a2a22'], [1, '#2a1414']]), 1.8) + L('M76,150 C90,162 112,168 138,168 L314,168 C340,168 362,162 376,150', '#c89a4a', 1.6);
    s += P('M226,60 C222,50 222,42 226,32 C230,42 230,50 226,60 Z', c.lg([[0, '#e0b060'], [1, '#6a4a28']], 0, 0, 1, 0), 1.3);
    // the pavilion to the left, its spire roof alight
    s += R(30, 200, 64, 8, '#2a1a16', 1.4) + L('M40,200 L40,178 M62,200 L62,178 M84,200 L84,178', '#1a0e0c', 3.4);
    s += P('M24,180 C40,176 52,160 62,128 C72,160 84,176 100,180 Q62,186 24,180 Z', c.lg([[0, '#5a2a22'], [1, '#1e1010']]), 1.8);
    // flames along the ridges and out of the windows
    [[200, 108, 2.6, -8], [250, 104, 3, 10], [226, 92, 2, 2], [178, 128, 1.8, -10], [276, 124, 2.2, 12], [150, 140, 1.3, -6], [306, 138, 1.5, 8], [336, 150, 0.8, 6], [98, 156, 0.8, -4], [226, 146, 1.1, 4],
      [52, 146, 1.1, -3], [66, 136, 1.4, 4], [80, 162, 0.8, 3], [170, 172, 0.7, -2], [278, 172, 0.8, 3]].forEach(function (q) { s += fire(c, q[0], q[1], q[2], q[3]); });
    s += C(226, 120, 60, glow(c, '#ffd070', 0.35));
    // tall pines black against the fire
    function spine(x, base, h, w) {
      var d = 'M' + n(x - 2.4) + ',' + base + ' L' + n(x - 1) + ',' + n(base - h) + ' L' + n(x + 1) + ',' + n(base - h) + ' L' + n(x + 2.4) + ',' + base + ' Z';
      for (var t = 0; t < 9; t++) { var f = t / 9, ty = base - h * 0.16 - h * 0.84 * f, tw = w * (1 - f * 0.85), th = h / 9 * 1.8; d += ' M' + n(x - tw) + ',' + n(ty + 3) + ' Q' + n(x - tw * 0.4) + ',' + n(ty - th * 0.3) + ' ' + n(x) + ',' + n(ty - th) + ' Q' + n(x + tw * 0.4) + ',' + n(ty - th * 0.3) + ' ' + n(x + tw) + ',' + n(ty + 3) + ' Q' + n(x) + ',' + n(ty + 1) + ' ' + n(x - tw) + ',' + n(ty + 3) + ' Z'; }
      return P(d, '#0c080a', 1.2) + L('M' + n(x + w * 0.2) + ',' + n(base - h * 0.9) + ' L' + n(x + w * 0.7) + ',' + n(base - h * 0.2), '#ff7a2a', 1, 0.35);
    }
    s += spine(14, 240, 220, 26) + spine(470, 236, 210, 24) + spine(360, 214, 130, 16) + spine(104, 220, 150, 18);
    // ground lit orange in front of the fire
    s += P('M0,214 L480,214 L480,270 L0,270 Z', c.lg([[0, '#3a1a10'], [0.4, '#1e0e0a'], [1, '#0a0606']]), 0);
    s += E(226, 222, 170, 12, glow(c, '#ff8a2a', 0.45));
    var gr = '';
    for (var g = 0; g < 60; g++) { var gx = r() * 480, gy = 230 + r() * 40, gs = 0.6 + r() * 1.2; gr += 'M' + n(gx - 3 * gs) + ',' + n(gy) + ' L' + n(gx - 1 * gs) + ',' + n(gy - 7 * gs) + ' L' + n(gx) + ',' + n(gy - 1) + ' L' + n(gx + 2 * gs) + ',' + n(gy - 8 * gs) + ' L' + n(gx + 3 * gs) + ',' + n(gy) + ' Z'; }
    s += F(gr, '#080406');
    // embers rising
    for (var e = 0; e < 90; e++) { var ex = 60 + r() * 360, ey = 20 + r() * 200, er = 0.6 + r() * 1.4; s += C(ex, ey, er * 2.4, glow(c, '#ff8a2a', 0.5)) + C(ex, ey, er, r() < 0.5 ? '#ffd070' : '#ff8a3a'); }
    s += R(0, 0, 480, 270, c.rg([[0.55, '#000', 0], [1, '#000', 0.55]], 0.48, 0.55, 0.75));
    return s;
  }
  function caravanScene(c) {
    var r = rng(2207), s = '';
    s += R(0, 0, 480, 270, c.lg([[0, '#5a9ad8'], [0.55, '#a8d4f0'], [0.62, '#d8ecf0']]));
    s += C(400, 40, 70, glow(c, '#fff8d8', 0.6)) + C(400, 40, 16, '#fffbe8');
    [[60, 44, 1.1], [220, 30, 0.9], [330, 70, 0.8]].forEach(function (q) {
      var x = q[0], y = q[1], k = q[2];
      s += P('M' + n(x - 34 * k) + ',' + n(y + 8 * k) + ' Q' + n(x - 34 * k) + ',' + n(y - 6 * k) + ' ' + n(x - 18 * k) + ',' + n(y - 4 * k) + ' Q' + n(x - 12 * k) + ',' + n(y - 20 * k) + ' ' + n(x + 4 * k) + ',' + n(y - 12 * k) + ' Q' + n(x + 20 * k) + ',' + n(y - 22 * k) + ' ' + n(x + 28 * k) + ',' + n(y - 4 * k) + ' Q' + n(x + 40 * k) + ',' + n(y - 2 * k) + ' ' + n(x + 38 * k) + ',' + n(y + 8 * k) + ' Z', '#ffffff', 1.4) +
        F('M' + n(x - 30 * k) + ',' + n(y + 6 * k) + ' L' + n(x + 34 * k) + ',' + n(y + 6 * k) + ' L' + n(x + 36 * k) + ',' + n(y + 8 * k) + ' L' + n(x - 32 * k) + ',' + n(y + 8 * k) + ' Z', '#c8dcec');
    });
    // Kinloch hills and the far pinewood
    s += F('M0,142 C60,122 130,118 190,130 C250,140 300,118 360,120 C410,122 450,130 480,128 L480,170 L0,170 Z', '#8aa88a');
    var tl = '';
    for (var x = -4; x < 486; x += 7 + r() * 6) { var h = 16 + r() * 20, w = 4 + r() * 3; if (x > 206 && x < 272) h *= 0.5; tl += 'M' + n(x - w) + ',160 L' + n(x) + ',' + n(160 - h) + ' L' + n(x + w) + ',160 Z'; }
    s += F(tl, '#3a5a40') + R(0, 156, 480, 8, '#3a5a40');
    // meadow and the road winding up into the pines
    s += R(0, 160, 480, 110, c.lg([[0, '#78a850'], [1, '#4e7c34']]));
    var road = 'M150,270 C176,226 214,196 230,176 C236,168 234,164 232,160 L248,160 C252,166 252,172 258,180 C276,204 316,232 346,270 Z';
    s += P(road, c.lg([[0, '#c8aa78'], [1, '#a8885a']]), 1.6);
    s += L('M196,270 C212,232 232,200 238,176 M296,270 C284,232 262,200 246,176', '#8a6c44', 1.6, 0.8);
    var tf = '';
    for (var g = 0; g < 80; g++) { var gx = r() * 480, gy = 164 + Math.pow(r(), 0.8) * 104, gs = 0.5 + (gy - 164) / 104; if (gx > 150 && gx < 346 && gy > 200) continue; tf += 'M' + n(gx - 3 * gs) + ',' + n(gy) + ' L' + n(gx - 1.6 * gs) + ',' + n(gy - 6 * gs) + ' L' + n(gx) + ',' + n(gy - 1.4 * gs) + ' L' + n(gx + 1.6 * gs) + ',' + n(gy - 7 * gs) + ' L' + n(gx + 3 * gs) + ',' + n(gy) + ' Z'; }
    s += F(tf, '#5a8e3a');
    // framing pines
    s += pine(c, 26, 250, 240, 34, '#2e4a30', '#8ab868', 0, 21) + pine(c, 74, 196, 150, 20, '#34523a', '#8ab868', 0, 23);
    s += pine(c, 456, 252, 240, 34, '#2e4a30', '#8ab868', 0, 25) + pine(c, 404, 196, 150, 20, '#34523a', '#8ab868', 0, 27);
    // the overturned Kingsmere supply wagon, spilled crates, arrows in the wood
    var WD = '#8a6440', WL = '#b08a5a';
    s += E(128, 238, 78, 8, '#000', 0, 0.25);
    s += P('M66,236 C70,220 84,212 100,214 L124,232 Z', c.lg([[0, '#f0e8d0'], [1, '#c8bc9c']]), 1.6) + L('M78,228 L96,218 M90,232 L106,222', '#a89c7c', 1.1);
    s += P('M96,172 L186,184 L184,236 L94,226 Z', c.cel(WD), 2);
    s += L('M95,186 L185,197 M95,200 L185,210 M95,213 L184,223', dk(WD, 0.35), 1.3) + L('M110,174 L108,228 M140,178 L138,232 M170,182 L168,234', dk(WD, 0.25), 1.1);
    s += P('M186,184 L198,178 L196,230 L184,236 Z', c.cel(dk(WD, 0.2)), 1.8);
    function wheel(x, y, rr) {
      var sp = '';
      for (var k = 0; k < 8; k++) { var a = k / 8 * PI * 2; sp += 'M' + n(x) + ',' + n(y) + ' L' + n(x + Math.cos(a) * rr) + ',' + n(y + Math.sin(a) * rr); }
      return E(x, y, rr, rr, 'none', 0).replace('fill="none"', 'fill="none" stroke="' + OL + '" stroke-width="7"') + E(x, y, rr, rr, 'none', 0).replace('fill="none"', 'fill="none" stroke="' + WL + '" stroke-width="3.6"') + L(sp, OL, 3) + L(sp, WL, 1.4) + C(x, y, rr * 0.22, c.cel('#6a6a72'), 1.4);
    }
    s += wheel(118, 170, 17) + wheel(168, 176, 15);
    s += P('M200,222 L222,222 L222,240 L200,240 Z', c.cel(WL), 1.6) + L('M200,231 L222,231 M211,222 L211,240', dk(WL, 0.35), 1.1);
    s += P('M52,236 C52,226 70,226 70,236 L70,248 C70,256 52,256 52,248 Z', c.cel('#9a6a3a'), 1.6) + L('M52,240 L70,240 M52,248 L70,248', '#5a5a62', 1.6);
    // the blue-and-gold banner on a broken pole, sagging from the wagon
    s += L('M150,174 L126,120', OL, 4.6) + L('M150,174 L126,120', '#6a4a28', 2.4) + C(126, 120, 2.6, c.cel('#e0b44a'), 1.2);
    s += P('M127,124 L160,128 L164,148 L156,146 L150,156 L146,144 L136,140 Z', c.lg([[0, '#3a6ac0'], [1, '#1e3e80']], 0, 0, 1, 1), 1.6) + L('M129,128 L159,132', '#e0b44a', 1.6);
    s += lionCrest(c, 148, 138, 3.8);
    // arrows stuck in the wagon and the road
    [[120, 196, -30], [136, 206, -24], [158, 192, -36], [176, 214, -20], [104, 212, -28], [192, 206, -40], [272, 236, 20], [300, 250, 14], [182, 256, -12]].forEach(function (q) {
      var x = q[0], y = q[1], a = q[2] * PI / 180, dx = Math.cos(a) * 14, dy = Math.sin(a) * 14;
      s += L('M' + n(x) + ',' + n(y) + ' L' + n(x - dx) + ',' + n(y + dy), OL, 2.8) + L('M' + n(x) + ',' + n(y) + ' L' + n(x - dx) + ',' + n(y + dy), '#c8a870', 1.2) +
        P('M' + n(x - dx) + ',' + n(y + dy) + ' l' + n(-Math.cos(a) * 4 - 2) + ',' + n(Math.sin(a) * 4 - 2) + ' l3,1 Z', '#c83a2a', 0.8);
    });
    // the burst of holy light in the middle of the road, where young Lyveus stood
    s += E(240, 226, 64, 14, glow(c, '#fff0a0', 0.9));
    var ray = '';
    for (var k = 0; k < 18; k++) { var a = -PI + k / 17 * PI, rr0 = 20, rr1 = 70 + (k % 2) * 30; ray += 'M' + n(240 + Math.cos(a) * rr0) + ',' + n(206 + Math.sin(a) * rr0 * 0.9) + ' L' + n(240 + Math.cos(a - 0.05) * rr1) + ',' + n(206 + Math.sin(a - 0.05) * rr1 * 0.9) + ' L' + n(240 + Math.cos(a + 0.05) * rr1) + ',' + n(206 + Math.sin(a + 0.05) * rr1 * 0.9) + ' Z'; }
    s += F(ray, '#fff4c0', 0.45);
    s += C(240, 200, 64, glow(c, '#ffe68a', 0.75));
    s += E(240, 226, 40, 7, 'none', 0).replace('fill="none"', 'fill="none" stroke="#fff4c0" stroke-width="2" opacity="0.9"') + E(240, 226, 56, 10, 'none', 0).replace('fill="none"', 'fill="none" stroke="#ffe68a" stroke-width="1.2" opacity="0.7"');
    [[200, 180, 3.4], [284, 176, 3], [226, 150, 2.6], [262, 160, 2.2], [306, 208, 2.4], [174, 214, 2.4]].forEach(function (q) { s += sparkle(q[0], q[1], q[2], '#ffffff'); });
    s += R(0, 0, 480, 270, c.rg([[0.62, '#000', 0], [1, '#000', 0.3]], 0.5, 0.5, 0.75));
    return s;
  }

  // =====================================================================
  // WIDYA, the Songkeeper's Daughter: the second Legend, a wood elf bard of Reedsong (an original character by a friend
  // of the developer, redrawn from her two reference pictures in the game's style). One rig, drawn FACING RIGHT in
  // hero-sprite coordinates, playing Reedsong's lute; the story actor is the same rig in a dancing step, mirrored.
  // Look: long, very wavy auburn hair past the waist with green leaf sprigs in it, freckles, warm brown eyes, long
  // pointed ears; a loose moss-green tunic with wide sleeves, a gold-trimmed V neck and gold vine embroidery, a leather
  // strap across the body to a satchel at the hip, brown leather trousers, tall slouched boots; a pear-shaped wooden
  // lute with a round sound hole, carved leaves and a pegbox bent back.
  // =====================================================================
  var WI = {
    skin: '#f6dcc8', skinD: '#ddb29c', hair: '#b25a2c', hairD: '#7a3517', hairL: '#e89454', eye: '#7a4620', brow: '#8a3c1a',
    tunic: '#66803c', tunicD: '#45592a', gold: '#dcb24c', pants: '#7a5232', boot: '#6c4328', strap: '#553416', satchel: '#8a5a30', leafC: '#6aa844'
  };
  var LU = { wood: '#c47a38', woodL: '#eaaa64', woodD: '#86491c', neck: '#8a5226', board: '#34200f', peg: '#5e3416', str: '#f6eed6', hole: '#1e1008', carve: '#f4cc84' };
  // a stroked circle
  function ring(x, y, r, col, w, o) { return L('M' + n(x - r) + ',' + n(y) + ' A' + n(r) + ',' + n(r) + ' 0 1 0 ' + n(x + r) + ',' + n(y) + ' A' + n(r) + ',' + n(r) + ' 0 1 0 ' + n(x - r) + ',' + n(y), col, w, o); }
  // a wavy run through the points: each segment bows out to alternate sides by amp (long curly hair)
  function wavy(pts, amp) {
    var d = '';
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.sqrt(dx * dx + dy * dy) || 1, s = (i % 2 ? 1 : -1) * amp;
      d += ' Q' + n((a[0] + b[0]) / 2 - dy / l * s) + ',' + n((a[1] + b[1]) / 2 + dx / l * s) + ' ' + pt(b);
    }
    return d;
  }

  // ---- Reedsong's lute: body centred on (0,0), the neck along -y ----
  var LUTE_BODY = 'M0,-17 C5,-16.5 12.6,-9 13,1.5 C13.4,11 7.4,18 0,18 C-7.4,18 -13.4,11 -13,1.5 C-12.6,-9 -5,-16.5 0,-17 Z';
  // the pear-shaped bowl: warm wood, an inner binding line, carved leaves round the lower bowl, the rosette and bridge
  function luteBody(c) {
    var o = P(LUTE_BODY, c.lg([[0, LU.woodL], [0.42, LU.wood], [0.74, LU.wood], [1, LU.woodD]], 0.15, 0, 0.85, 1), 2.6);
    o += CG(F('M-14,-4 C-12,-14 -4,-18 2,-18 L-14,14 Z', '#ffffff', 0.2) + F('M14,-2 C13,10 8,17 0,19 L16,19 Z', '#000000', 0.2), c.clip(LUTE_BODY));
    o += G(L(LUTE_BODY, LU.woodD, 1.2, 0.75), 'scale(0.84)');
    o += L('M-8,4.6 C-7,10.6 -3,13 0,13.2 C3,13 7,10.6 8,4.6', LU.carve, 1.1, 0.85);
    [[-7.4, 8.6, -50], [-3.4, 12.4, -20], [3.4, 12.4, 20], [7.4, 8.6, 50]].forEach(function (q) {
      o += G(F(leafD(0.34), LU.carve, 0.9), 'translate(' + q[0] + ',' + q[1] + ') rotate(' + q[2] + ')');
    });
    o += ring(0, -4, 5.9, LU.carve, 1.3) + C(0, -4, 4.4, LU.hole, 1.4);
    o += L('M-3,-4 L3,-4 M0,-7 L0,-1 M-2.1,-6.1 L2.1,-1.9 M2.1,-6.1 L-2.1,-1.9', dk(LU.wood, 0.2), 0.7, 0.9);
    o += R(-5.2, 8, 10.4, 2.8, LU.board, 1.3) + L('M-4,9.4 L4,9.4', LU.carve, 0.6, 0.7);
    return o;
  }
  // neck and fretboard up to the nut at -len, then the pegbox bent back, three pegs down each side
  function luteNeck(c, len) {
    var t = -len, o = '';
    var P1 = [-2.6, t], P2 = [2.6, t], P3 = [-3, t - 12.6], P4 = [-8, t - 10.2];
    [[P2, P3, 1], [P1, P4, -1]].forEach(function (e) {
      var a = e[0], b = e[1], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.sqrt(dx * dx + dy * dy), nx = -dy / l, ny = dx / l;
      if (nx * e[2] < 0) { nx = -nx; ny = -ny; }
      [0.3, 0.58, 0.86].forEach(function (f) {
        var p = lerp(a, b, f), q = [p[0] + nx * 3, p[1] + ny * 3];
        o += L('M' + pt(p) + ' L' + pt(q), OL, 2.6) + L('M' + pt(p) + ' L' + pt(q), LU.peg, 1.2) + E(q[0], q[1], 1.4, 1, c.cel(lt(LU.peg, 0.25)), 1, null, Math.atan2(ny, nx) * 180 / PI);
      });
    });
    o += P(pd([P1, P2, P3, P4], true), c.lg([[0, lt(LU.neck, 0.28)], [1, dk(LU.neck, 0.25)]], 0, 0, 1, 0), 2.2);
    o += L('M-1.2,' + n(t - 2.4) + ' L-4.6,' + n(t - 9.4), LU.board, 1.5, 0.85);
    o += P('M-3.3,-14 L-2.6,' + t + ' L2.6,' + t + ' L3.3,-14 Z', c.lg([[0, lt(LU.neck, 0.22)], [0.5, LU.neck], [1, dk(LU.neck, 0.3)]], 0, 0, 1, 0), 2.2);
    o += F('M-2.1,-15 L-1.7,' + t + ' L1.7,' + t + ' L2.1,-15 Z', LU.board);
    for (var y = -19; y > t + 2; y -= 4.4) o += L('M-1.9,' + n(y) + ' L1.9,' + n(y), '#c8b48a', 0.55, 0.8);
    return o;
  }
  function luteStrings(len) {
    var t = -len - 0.4;
    return R(-2.9, -len - 1.6, 5.8, 1.9, '#efe4c4', 1) +
      L('M-1.7,9.4 L-1.2,' + t + ' M-0.57,9.4 L-0.4,' + t + ' M0.57,9.4 L0.4,' + t + ' M1.7,9.4 L1.2,' + t, LU.str, 0.55, 0.95);
  }
  function lute(c, len) { len = len || 44; return luteNeck(c, len) + luteBody(c) + luteStrings(len); }
  // a point on the lute's centre line, t units up the neck from the body centre, for a lute placed at J.lute
  function luteAt(J, t, x) { var a = J.lute[2] * PI / 180, s = J.lute[3]; x = x || 0; return [J.lute[0] + (x * Math.cos(a) + Math.sin(a) * t) * s, J.lute[1] + (x * Math.sin(a) - Math.cos(a) * t) * s]; }

  // ---- Widya's rig ----
  var WPOSE_SPRITE = {
    head: [70, 27, 10.2], flow: 0, tilt: 0,
    bSh: [59, 47], bEl: [74.5, 64], fSh: [76, 47], fEl: [66, 62], strum: [-6, -2],
    bHip: [61, 80], bKn: [58, 99], bFt: [55, 117], fHip: [68, 80], fKn: [72.5, 99], fFt: [76, 117],
    lute: [67, 75, 58, 0.94]
  };
  // the story pose: a dancing step (back heel lifted), head bowed to the lute, eyes closed, singing, hair swinging out
  var WPOSE_ACTOR = {
    head: [70, 27.5, 10.2], flow: 1, tilt: 9, closed: true, sing: true,
    bSh: [59, 47], bEl: [74.5, 63], fSh: [76, 47], fEl: [66, 61], strum: [-6, -2],
    bHip: [61, 80], bKn: [54, 97.5], bFt: [48, 113.5], bLift: 20, fHip: [68, 80], fKn: [75.5, 98], fFt: [79, 117],
    lute: [67, 74, 54, 0.96]
  };
  function wiHairBack(c, J) {
    var X = J.head[0], Y = J.head[1], r = J.head[2], f = J.flow || 0;
    var outer = [[X - r * 0.9, Y - r * 0.95], [X - r * 1.45 - f * 1.5, Y - r * 0.2], [X - r * 1.75 - f * 3, Y + r * 0.6], [X - r * 1.95 - f * 4.5, Y + r * 1.4], [X - r * 2.1 - f * 6, Y + r * 2.2],
      [X - r * 2.25 - f * 7.5, Y + r * 3.0], [X - r * 2.35 - f * 8.5, Y + r * 3.8], [X - r * 2.35 - f * 9.5, Y + r * 4.6], [X - r * 2.2 - f * 9, Y + r * 5.4]];
    var e = outer[outer.length - 1];
    var d = 'M' + n(X + r * 0.6) + ',' + n(Y - r * 1.25) + ' C' + n(X) + ',' + n(Y - r * 1.6) + ' ' + n(X - r * 0.7) + ',' + n(Y - r * 1.3) + ' ' + pt(outer[0]) + wavy(outer, 3) +
      // curly tips at the bottom
      ' Q' + n(e[0] - 1) + ',' + n(e[1] + 5) + ' ' + n(e[0] + 2) + ',' + n(e[1] + 6.4) + ' Q' + n(e[0] + 3.6) + ',' + n(e[1] + 2.4) + ' ' + n(e[0] + 5.4) + ',' + n(e[1] + 3) +
      ' Q' + n(e[0] + 6.4) + ',' + n(e[1] + 7.6) + ' ' + n(e[0] + 9) + ',' + n(e[1] + 6.8) + ' Q' + n(e[0] + 9.6) + ',' + n(e[1] + 2.6) + ' ' + n(e[0] + 11.4) + ',' + n(e[1] + 1.4) +
      wavy([[e[0] + 11.4, e[1] + 1.4], [X - r * 0.95 - f * 3, Y + r * 4.2], [X - r * 0.9 - f, Y + r * 2.6], [X - r * 0.7, Y + r * 1.2], [X - r * 0.2, Y + r * 0.4]], 1.4) + ' Z';
    var o = P(d, c.lg([[0, WI.hairL], [0.3, WI.hair], [0.75, WI.hair], [1, WI.hairD]], 0.8, 0, 0.2, 1), 2.1);
    var s1 = [[X - r * 1.1, Y - r * 0.2], [X - r * 1.5 - f, Y + r * 1.1], [X - r * 1.65 - f * 3, Y + r * 2.4], [X - r * 1.8 - f * 5, Y + r * 3.6], [X - r * 1.75 - f * 6, Y + r * 4.8], [X - r * 1.5 - f * 5, Y + r * 5.8]];
    var s2 = [[X - r * 0.8, Y + r * 0.6], [X - r * 1.1 - f, Y + r * 1.8], [X - r * 1.2 - f * 2, Y + r * 3.1], [X - r * 1.3 - f * 3, Y + r * 4.3], [X - r * 1.2 - f * 3, Y + r * 5.4]];
    o += CG(L('M' + pt(s1[0]) + wavy(s1, 1.8), WI.hairD, 1.1, 0.9) + L('M' + pt(s2[0]) + wavy(s2, 1.6), WI.hairD, 1, 0.8) +
      L('M' + pt([s1[0][0] - 1.6, s1[0][1] + 2]) + wavy(s1.slice(1, 4).map(function (p) { return [p[0] - 2, p[1] + 1]; }), 1.6), WI.hairL, 1, 0.8), c.clip(d));
    return o;
  }
  // the lock of hair that falls over the near shoulder
  function wiLock(c, J) {
    var X = J.head[0], Y = J.head[1], r = J.head[2];
    var fr = [[X - r * 0.3, Y + r * 0.6], [X + r * 0.02, Y + r * 1.6], [X + r * 0.18, Y + r * 2.6], [X + r * 0.22, Y + r * 3.5]];
    var bk = [[X - r * 0.26, Y + r * 3.35], [X - r * 0.44, Y + r * 2.25], [X - r * 0.6, Y + r * 1.15], [X - r * 0.8, Y + r * 0.3]];
    var d = 'M' + pt(fr[0]) + wavy(fr, 1.6) + ' Q' + n(X + r * 0.3) + ',' + n(Y + r * 4.1) + ' ' + n(X + r * 0.02) + ',' + n(Y + r * 4.1) + ' Q' + n(X - r * 0.1) + ',' + n(Y + r * 3.6) + ' ' + pt(bk[0]) + wavy(bk, 1.2) + ' Z';
    return P(d, c.lg([[0, WI.hairL], [0.4, WI.hair], [1, WI.hairD]], 0.8, 0, 0.2, 1), 1.9) +
      L('M' + pt([X - r * 0.34, Y + r * 1.0]) + wavy([[X - r * 0.34, Y + r * 1.0], [X - r * 0.14, Y + r * 2.0], [X - r * 0.04, Y + r * 3.0], [X - r * 0.02, Y + r * 3.8]], 1), WI.hairD, 0.9, 0.85);
  }
  function wiHead(c, X, Y, r, J) {
    function q(u, v) { return n(X + r * u) + ',' + n(Y + r * v); }
    var o = '';
    var face = 'M' + q(-1, 0.05) + ' C' + q(-1, -1.3) + ' ' + q(0.95, -1.3) + ' ' + q(1, -0.15) + ' L' + q(1.15, 0.3) + ' L' + q(0.97, 0.45) +
      ' C' + q(0.95, 0.84) + ' ' + q(0.5, 1.06) + ' ' + q(0.04, 1.02) + ' C' + q(-0.68, 0.96) + ' ' + q(-1, 0.55) + ' ' + q(-1, 0.05) + ' Z';
    o += P(face, c.cel(WI.skin), 2.1);
    o += CG(F('M' + q(-1.1, -0.2) + ' L' + q(-0.25, -0.2) + ' C' + q(-0.4, 0.4) + ' ' + q(-0.2, 0.8) + ' ' + q(0.2, 1.2) + ' L' + q(-1.1, 1.2) + ' Z', WI.skinD, 0.5), c.clip(face));
    // freckles over the nose and cheek, a warm blush
    o += E(X + r * 0.3, Y + r * 0.42, 2.2, 1.3, '#f0968a', 0, 0.4);
    [[0.14, 0.32], [0.3, 0.26], [0.24, 0.44], [0.42, 0.36], [0.62, 0.3], [0.08, 0.46]].forEach(function (p) { o += C(X + r * p[0], Y + r * p[1], 0.42, '#b86a4a', 0, 0.85); });
    // warm brown eye with lashes (closed while she sings), a soft auburn brow
    var ex = X + r * 0.5, ey = Y - r * 0.03;
    if (J.closed) {
      o += L('M' + n(ex - 2.3) + ',' + n(ey - 0.2) + ' Q' + n(ex) + ',' + n(ey + 1.6) + ' ' + n(ex + 2.3) + ',' + n(ey - 0.3), OL, 1.3) + L('M' + n(ex - 2.3) + ',' + n(ey - 0.2) + ' L' + n(ex - 3.3) + ',' + n(ey - 1.2), OL, 1);
    } else {
      o += E(ex, ey, 2.3, 1.9, '#fbf6ee') + C(ex + 0.55, ey + 0.2, 1.4, WI.eye) + C(ex + 0.8, ey + 0.2, 0.65, '#2a1408') + C(ex + 0.15, ey - 0.4, 0.5, '#ffffff');
      o += L('M' + n(ex - 2.4) + ',' + n(ey - 0.8) + ' Q' + n(ex) + ',' + n(ey - 2.6) + ' ' + n(ex + 2.5) + ',' + n(ey - 1.2), OL, 1.4) + L('M' + n(ex - 2.4) + ',' + n(ey - 0.8) + ' L' + n(ex - 3.5) + ',' + n(ey - 2), OL, 1);
    }
    o += L('M' + n(ex - 2.8) + ',' + n(ey - 4.2) + ' Q' + n(ex) + ',' + n(ey - 5.8) + ' ' + n(ex + 3) + ',' + n(ey - 4.6), WI.brow, 1.3);
    // mouth: a soft smile, or open in song
    if (J.sing) o += P('M' + q(0.6, 0.6) + ' Q' + q(0.78, 0.55) + ' ' + q(0.92, 0.6) + ' Q' + q(0.9, 0.86) + ' ' + q(0.72, 0.84) + ' Q' + q(0.6, 0.76) + ' ' + q(0.6, 0.6) + ' Z', '#7a2a2c', 1) + F('M' + q(0.66, 0.78) + ' Q' + q(0.78, 0.72) + ' ' + q(0.88, 0.8) + ' Q' + q(0.78, 0.84) + ' ' + q(0.66, 0.78) + ' Z', '#e87a80');
    else o += L('M' + q(0.54, 0.62) + ' Q' + q(0.74, 0.76) + ' ' + q(0.93, 0.6), '#8a3a30', 1.2) + L('M' + q(0.66, 0.8) + ' Q' + q(0.76, 0.84) + ' ' + q(0.86, 0.79), '#d8807a', 0.9, 0.8);
    // hair over the crown: a side part, a wave falling over the brow, down the back of the head
    var cap = 'M' + q(1.02, -0.42) + ' C' + q(1.1, -1.15) + ' ' + q(0.35, -1.58) + ' ' + q(-0.35, -1.42) + ' C' + q(-1.0, -1.3) + ' ' + q(-1.34, -0.7) + ' ' + q(-1.24, 0.05) +
      ' C' + q(-1.22, 0.5) + ' ' + q(-1.1, 0.82) + ' ' + q(-0.95, 1.08) + ' L' + q(-0.62, 0.92) + ' C' + q(-0.62, 0.4) + ' ' + q(-0.46, 0.0) + ' ' + q(-0.24, -0.32) +
      ' C' + q(0.06, -0.66) + ' ' + q(0.5, -0.6) + ' ' + q(0.74, -0.36) + ' C' + q(0.82, -0.5) + ' ' + q(0.95, -0.52) + ' ' + q(1.02, -0.42) + ' Z';
    o += P(cap, c.lg([[0, WI.hairL], [0.35, WI.hair], [0.75, WI.hair], [1, WI.hairD]], 0.7, 0, 0.3, 1), 2);
    o += L('M' + q(0.72, -0.72) + ' C' + q(0.3, -1.12) + ' ' + q(-0.3, -1.16) + ' ' + q(-0.8, -0.86) + ' M' + q(0.4, -0.56) + ' C' + q(0.0, -0.9) + ' ' + q(-0.6, -0.84) + ' ' + q(-1.0, -0.4), WI.hairD, 1, 0.85);
    o += L('M' + q(0.84, -0.9) + ' C' + q(0.5, -1.26) + ' ' + q(0.0, -1.36) + ' ' + q(-0.4, -1.28), WI.hairL, 1.2, 0.9);
    // long ear swept back and up through the hair
    var ear = 'M' + q(-0.24, -0.06) + ' C' + q(-0.72, -0.34) + ' ' + q(-1.3, -0.82) + ' ' + q(-1.9, -1.26) + ' C' + q(-1.58, -0.52) + ' ' + q(-1.12, 0.2) + ' ' + q(-0.42, 0.48) + ' Z';
    o += P(ear, c.cel(WI.skin), 1.8);
    o += F('M' + q(-0.46, 0.14) + ' C' + q(-0.94, -0.14) + ' ' + q(-1.36, -0.64) + ' ' + q(-1.66, -0.98) + ' C' + q(-1.36, -0.4) + ' ' + q(-1.0, 0.12) + ' ' + q(-0.52, 0.3) + ' Z', WI.skinD, 0.85);
    o += C(X - r * 0.36, Y + r * 0.46, 0.8, WI.gold, 0.7);
    // green leaf sprigs tucked in the hair
    o += leaf(c, X - r * 0.72, Y - r * 1.08, -72, 0.48, WI.leafC) + leaf(c, X - r * 0.62, Y - r * 1.16, -28, 0.42, '#8ac858') + leaf(c, X - r * 0.9, Y - r * 0.84, -118, 0.4, '#4e8a34');
    o += leaf(c, X + r * 0.36, Y - r * 1.34, 18, 0.4, '#8ac858') + leaf(c, X + r * 0.3, Y - r * 1.3, 62, 0.36, WI.leafC);
    return o;
  }
  // brown leather trousers into a tall slouched boot with a folded cuff
  function wiLeg(c, h, kn, f, back, lift) {
    var pc = back ? dk(WI.pants, 0.2) : WI.pants, bc = back ? dk(WI.boot, 0.18) : WI.boot, o = '';
    o += tube([h, kn, [f[0] + 0.5, f[1] - 4]], 8.4, pc, back ? null : dk(pc, 0.28));
    var tx = kn[0], ty = kn[1] + 2, ax = f[0] + 0.6, ay = f[1] - 2, dx = ax - tx, dy = ay - ty, l = Math.sqrt(dx * dx + dy * dy) || 1, px = -dy / l, py = dx / l;
    function q(t, w) { return [tx + dx * t + px * w, ty + dy * t + py * w]; }
    var x = f[0], y = f[1] + 5;
    var ft = P('M' + n(x - 5.4) + ',' + n(y - 9.4) + ' L' + n(x + 3) + ',' + n(y - 9.4) + ' C' + n(x + 5.4) + ',' + n(y - 6.2) + ' ' + n(x + 11) + ',' + n(y - 5.4) + ' ' + n(x + 11) + ',' + n(y - 1.6) +
      ' L' + n(x + 11) + ',' + n(y) + ' L' + n(x - 5.8) + ',' + n(y) + ' Z', c.cel(bc), 2.1) + R(x - 5.8, y - 2.6, 5.4, 2.6, dk(bc, 0.45), 1.2);
    o += lift ? G(ft, 'rotate(' + lift + ' ' + n(x + 10) + ' ' + n(y) + ')') : ft;
    o += P(pd([q(0.12, -5.4), q(0.55, -5.9), q(1, -5), q(1, 5), q(0.55, 5.9), q(0.12, 5.4)], true), c.cel(bc), 2);
    o += L('M' + pt(q(0.46, -5.4)) + ' Q' + pt(q(0.56, 0)) + ' ' + pt(q(0.44, 5.4)) + ' M' + pt(q(0.72, -5.2)) + ' Q' + pt(q(0.8, 0)) + ' ' + pt(q(0.7, 5.2)), dk(bc, 0.4), 1, 0.85);
    o += L('M' + pt(q(0.4, 3.8)) + ' L' + pt(q(0.9, 3.4)), lt(bc, 0.3), 1, 0.6);
    // the slouched cuff folded over the top
    o += P('M' + pt(q(-0.06, -6.6)) + ' L' + pt(q(-0.06, 6.6)) + ' L' + pt(q(0.2, 6.6)) + ' Q' + pt(q(0.24, 3.4)) + ' ' + pt(q(0.2, 1)) + ' Q' + pt(q(0.3, -2)) + ' ' + pt(q(0.24, -6.6)) + ' Z', c.cel(lt(bc, 0.14)), 1.9);
    return o;
  }
  var WI_SKIRT = 'M55.4,72 L77,72 C80,79 83,87 85.4,96 L80.6,94.4 L77.4,101.4 L72,95.8 L66.2,102.6 L61,95.8 L55.6,101.8 L52.4,95 L47.4,97.8 C49,88 51.8,79 55.4,72 Z';
  // the tunic's long skirt, split into pointed panels, a gold band above the hem
  function wiSkirt(c) {
    var o = P(WI_SKIRT, c.cel(WI.tunic), 2.1);
    o += CG(F('M44,70 L60.5,70 L60.5,104 L44,104 Z', WI.tunicD, 0.5) + L('M84.6,93.2 L80.2,91.6 L77.2,98.4 L72,93 L66.2,99.6 L61,93 L55.6,98.8 L52.6,92.2 L48,94.8', WI.gold, 1.5) +
      L('M66.6,76 L66.2,99 M73,78 C75,84 76.6,90 77.2,98', WI.tunicD, 1, 0.85) + L('M69,84 C67.6,87 70,88.6 68.8,91.4 M59,84 C57.6,87 60,88.6 58.8,91.4', WI.gold, 0.9, 0.9), c.clip(WI_SKIRT));
    return o;
  }
  function wiSatchel(c) {
    var o = P('M44.6,79 C44.4,77 45.4,76 47.2,76 L56,76.4 C57.6,76.5 58.2,77.6 58,79 L57,88.6 C56.8,90 56,90.6 54.6,90.6 L47.2,90.2 C45.8,90.2 45,89.4 45,88 Z', c.cel(WI.satchel), 1.9);
    o += P('M44.6,78.8 C44.6,77 45.6,76 47.4,76 L56,76.4 C57.6,76.5 58.2,77.6 58,79 L57.6,83.4 C54,85 48,84.8 44.8,83.4 Z', c.cel(lt(WI.satchel, 0.12)), 1.6);
    o += R(49.8, 82.4, 2.8, 3.2, WI.gold, 1) + L('M46.2,87.2 L56.4,87.6', dk(WI.satchel, 0.4), 0.8, 0.8);
    return o;
  }
  var WI_TUNIC = 'M53,45 Q66,40.5 80,45 C82.6,52 81.4,60 78.4,66 C77.2,69 76.8,72 76.8,75 L56,75 C55,66 51.4,56 53,45 Z';
  function wiTorso(c) {
    var o = P(WI_TUNIC, c.cel(WI.tunic), 2.2);
    o += CG(F('M48,40 L60,40 L61.4,80 L48,80 Z', WI.tunicD, 0.55) + F('M75,42 L84,42 L84,80 L74,80 Z', '#ffffff', 0.1) +
      L('M58,50 C59,58 59.6,66 59.6,74 M76.4,52 C75.8,60 74.8,67 73.4,74', WI.tunicD, 1, 0.8), c.clip(WI_TUNIC));
    // the V neck, gold-trimmed, the laced bodice just showing at its point, a thin chain with a small pendant
    o += P('M62.8,40.6 L75.4,41 L70.2,52.4 Z', c.cel(WI.skin), 1.4);
    o += F('M67.6,49 L72,49.2 L70.2,52.8 Z', '#6a4226') + L('M68.6,50 L71,50.1', '#c8a060', 0.6);
    o += L('M62.6,40.4 L70.2,52.8 L75.8,40.8', OL, 3.2) + L('M62.6,40.4 L70.2,52.8 L75.8,40.8', WI.gold, 1.6);
    o += L('M64.4,41.8 Q69.6,47.2 74.2,42', '#f0d078', 0.6) + C(69.5, 46.3, 0.8, WI.gold, 0.6);
    // gold vine embroidery down the front
    o += L('M70.2,54.6 C68.6,57.6 71.4,59.6 70,62.8 C68.8,65.4 71,67.6 69.8,70.6', WI.gold, 1.1);
    [[69.4, 57.2, -60], [71, 61, 60], [69.4, 65.4, -60], [70.8, 69, 60]].forEach(function (p) { o += G(F(leafD(0.26), WI.gold), 'translate(' + p[0] + ',' + p[1] + ') rotate(' + p[2] + ')'); });
    // belt, and the satchel strap across the body
    o += P('M55.6,72 L77,72 L76.8,75.6 L56,75.6 Z', c.cel(WI.strap), 1.4) + R(64.4, 71.4, 3.6, 4.8, WI.gold, 1.1);
    o += L('M75.6,42.6 L56.6,77', OL, 4) + L('M75.6,42.6 L56.6,77', WI.strap, 2.3) + L('M74.6,45 L57.8,75.4', lt(WI.strap, 0.3), 0.6, 0.7) + ring(68.4, 55.6, 1.5, WI.gold, 1);
    return o;
  }
  // a wide bell sleeve on the forearm from el towards hd, its open end hanging down, gold at the cuff
  function bellSleeve(c, el, hd, col, drop, side) {
    var dx = hd[0] - el[0], dy = hd[1] - el[1], l = Math.sqrt(dx * dx + dy * dy) || 1, px = -dy / l, py = dx / l;
    if (side ? px * side < 0 : py < 0) { px = -px; py = -py; }
    function q(t, w, dd) { return [el[0] + dx * t + px * w, el[1] + dy * t + py * w + (dd || 0)]; }
    // a trumpet along the forearm, the lower side sagging, the open cuff at 3/4 of the way to the hand
    var a = q(-0.04, -4.2), b = q(0.74, -5.4), cc = q(0.74, 6, drop), d = q(-0.04, 4.2);
    var sl = 'M' + pt(a) + ' L' + pt(b) + ' L' + pt(cc) + ' Q' + pt(q(0.38, 6.4, drop * 0.8)) + ' ' + pt(d) + ' Z';
    var o = P(sl, c.cel(col), 2);
    o += L('M' + pt(q(0.7, -4.6)) + ' L' + pt(q(0.7, 5.2, drop)), WI.gold, 1.6);
    o += L('M' + pt(q(0.24, 1)) + ' Q' + pt(q(0.44, 3, drop * 0.4)) + ' ' + pt(q(0.6, 4.6, drop * 0.8)), dk(col, 0.32), 0.9, 0.85);
    return o;
  }
  function wiHand(c, p, back) { return C(p[0], p[1], 3.5, c.cel(back ? WI.skinD : WI.skin), 1.8); }
  function wiRig(c, J, opts) {
    opts = opts || {};
    var o = '', X = J.head[0], Y = J.head[1], r = J.head[2];
    var L0 = J.lute, bHd = luteAt(J, 30, 1), fHd = luteAt(J, J.strum[0], J.strum[1]);
    o += wiHairBack(c, J);
    if (!opts.upper) {
      o += tube([J.bSh, J.bEl], 7.6, dk(WI.tunic, 0.22));
      o += wiLeg(c, J.bHip, J.bKn, J.bFt, true, J.bLift);
      o += wiLeg(c, J.fHip, J.fKn, J.fFt, false);
      o += wiSkirt(c);
      o += wiSatchel(c);
    }
    o += tube([[66.8, 42], [X - r * 0.1, Y + r * 0.6]], 6.2, WI.skin);
    o += wiTorso(c);
    o += wiLock(c, J);
    o += J.tilt ? G(wiHead(c, X, Y, r, J), 'rotate(' + J.tilt + ' ' + n(X - r * 0.2) + ' ' + n(Y + r) + ')') : wiHead(c, X, Y, r, J);
    if (!opts.upper) {
      // the fretting arm reaches round the front to the neck; the lute over it; the fingers over the neck
      o += tube([lerp(J.bEl, bHd, 0.6), bHd], 4.4, WI.skinD) + bellSleeve(c, J.bEl, bHd, dk(WI.tunic, 0.14), 3);
      o += G(lute(c), 'translate(' + L0[0] + ',' + L0[1] + ') rotate(' + L0[2] + ') scale(' + L0[3] + ')');
      o += wiHand(c, bHd, true) + L('M' + n(bHd[0] - 1.2) + ',' + n(bHd[1] - 3) + ' L' + n(bHd[0] + 0.6) + ',' + n(bHd[1] - 0.6) + ' M' + n(bHd[0] + 1.2) + ',' + n(bHd[1] - 3.4) + ' L' + n(bHd[0] + 2.6) + ',' + n(bHd[1] - 1.2), dk(WI.skinD, 0.3), 0.8);
      // the strumming arm over the bowl
      o += tube([J.fSh, J.fEl], 8, WI.tunic, WI.tunicD);
      o += tube([lerp(J.fEl, fHd, 0.6), fHd], 4.6, WI.skin) + bellSleeve(c, J.fEl, fHd, WI.tunic, 4, -1);
      o += wiHand(c, fHd, false) + L('M' + n(fHd[0] - 2.6) + ',' + n(fHd[1] + 0.6) + ' L' + n(fHd[0] - 0.4) + ',' + n(fHd[1] + 2.8), dk(WI.skinD, 0.3), 0.8);
    }
    return o;
  }
  function widyaSprite(c) { return shadow(c, 64, 26) + wiRig(c, WPOSE_SPRITE); }
  function widyaActor(c) {
    var keep = SWM; SWM = 0.8;
    try { return E(92, 155, 36, 5, c.rg([[0, '#000', 0.45], [0.65, '#000', 0.25], [1, '#000', 0]])) + G(wiRig(c, WPOSE_ACTOR), 'matrix(-1.25,0,0,1.25,176,2.5)'); } finally { SWM = keep; }
  }

  // =====================================================================
  // HARROWBY: the Black Ledger's appraiser, a tired middle-aged clerk who prices what people lose. Not a villain.
  // Drawn FACING RIGHT in hero-sprite coordinates (so he can stand in a scene as an NPC), a little stooped: a long
  // grey-black coat over a drab waistcoat, round spectacles, grey at the temples, a thick oxblood ledger clamped under
  // his far arm, a quill in his ink-stained near hand. The story actor is the same rig mirrored.
  // =====================================================================
  var HW = {
    skin: '#ecc8a8', skinD: '#c9a084', hair: '#3e3a40', grey: '#a29ea8', coat: '#3a3c44', coatD: '#26272c', lapel: '#555862', shirt: '#ece6d8',
    vest: '#6a5a44', trouser: '#4a4a50', shoe: '#221c1a', ink: '#1c2a52', book: '#6e2a22', page: '#efe6cc', brass: '#c8a050', quill: '#f2eee2'
  };
  // the ledger, cover to the viewer, the thick page block on top and the spine on the right, brass corners, a strap
  function ledger(c) {
    var o = P('M-9,-11 L-4.6,-15.4 L13.4,-15.4 L9,-11 Z', c.lg([[0, '#fbf4de'], [1, '#d8ccaa']]), 1.6);
    o += L('M-6.6,-13 L11,-13 M-5.4,-14.2 L12.2,-14.2', '#b0a080', 0.5, 0.9);
    o += P('M9,-11 L13.4,-15.4 L13.4,7 L9,11.4 Z', c.cel(dk(HW.book, 0.3)), 1.6);
    o += P('M-9,-11 L9,-11 L9,11.4 L-9,11.4 Z', c.cel(HW.book), 1.8);
    o += R(-6.6, -8.6, 13.2, 17.6, 'none', 0).replace('fill="none"', 'fill="none" stroke="' + lt(HW.book, 0.25) + '" stroke-width="0.8" opacity="0.8"');
    o += P('M-9,-11 L-4.4,-11 L-9,-6.4 Z', c.cel(HW.brass), 1) + P('M-9,11.4 L-4.4,11.4 L-9,6.8 Z', c.cel(HW.brass), 1);
    o += P('M5.2,-11.2 L9.4,-11.2 L9.4,11.6 L5.2,11.6 Z', c.cel('#3a2418'), 1.2) + R(4.4, -1.8, 5.8, 4, c.cel(HW.brass), 1);
    o += R(-3.4, -2.4, 5.4, 4, '#e8dcbc', 0.8) + L('M-2.4,-1 L1,-1 M-2.4,0.6 L0.2,0.6', '#6a5a44', 0.5);
    return o;
  }
  function hwHead(c, X, Y, r) {
    function q(u, v) { return n(X + r * u) + ',' + n(Y + r * v); }
    var o = '';
    // grey-black hair at the back and sides, thin on top, grey at the temple
    o += P('M' + q(0.3, -0.98) + ' C' + q(-0.4, -1.3) + ' ' + q(-1.2, -0.9) + ' ' + q(-1.16, -0.1) + ' C' + q(-1.14, 0.3) + ' ' + q(-1.0, 0.62) + ' ' + q(-0.84, 0.8) + ' L' + q(-0.5, 0.5) + ' Z', c.cel(HW.hair), 1.8);
    var face = 'M' + q(-1, 0.05) + ' C' + q(-1, -1.3) + ' ' + q(0.95, -1.3) + ' ' + q(1, -0.15) + ' L' + q(1.24, 0.36) + ' L' + q(1.0, 0.52) +
      ' C' + q(1.0, 0.96) + ' ' + q(0.5, 1.16) + ' ' + q(0.02, 1.08) + ' C' + q(-0.7, 1.0) + ' ' + q(-1, 0.55) + ' ' + q(-1, 0.05) + ' Z';
    o += P(face, c.cel(HW.skin), 2.1);
    o += CG(F('M' + q(-1.1, -0.2) + ' L' + q(-0.25, -0.2) + ' C' + q(-0.4, 0.4) + ' ' + q(-0.2, 0.8) + ' ' + q(0.2, 1.2) + ' L' + q(-1.1, 1.2) + ' Z', HW.skinD, 0.5) +
      // grey stubble along the jaw
      F('M' + q(-0.5, 0.5) + ' C' + q(-0.3, 0.9) + ' ' + q(0.3, 1.1) + ' ' + q(0.8, 0.96) + ' L' + q(1.1, 0.7) + ' L' + q(1.2, 1.4) + ' L' + q(-0.6, 1.4) + ' Z', '#8a8078', 0.35), c.clip(face));
    o += L('M' + q(0.2, 0.4) + ' C' + q(0.3, 0.56) + ' ' + q(0.4, 0.62) + ' ' + q(0.52, 0.64), dk(HW.skin, 0.35), 0.9, 0.8);
    // ear
    o += E(X - r * 0.4, Y + r * 0.14, r * 0.2, r * 0.3, c.cel(HW.skin), 1.4, null, 10) + L('M' + q(-0.4, 0.0) + ' Q' + q(-0.3, 0.14) + ' ' + q(-0.38, 0.3), HW.skinD, 0.8);
    // hair over the ear, receding, the grey temple
    o += P('M' + q(-0.1, -0.9) + ' C' + q(-0.6, -1.0) + ' ' + q(-1.02, -0.7) + ' ' + q(-1.04, -0.12) + ' L' + q(-0.66, -0.06) + ' C' + q(-0.62, -0.34) + ' ' + q(-0.44, -0.56) + ' ' + q(-0.14, -0.68) + ' Z', c.cel(HW.hair), 1.6);
    o += L('M' + q(-0.2, -0.76) + ' C' + q(-0.5, -0.74) + ' ' + q(-0.7, -0.5) + ' ' + q(-0.76, -0.14), HW.grey, 1.6, 0.95);
    o += L('M' + q(0.62, -0.94) + ' C' + q(0.3, -1.08) + ' ' + q(0.0, -1.06) + ' ' + q(-0.26, -0.96), dk(HW.skin, 0.12), 0.9, 0.6);
    // tired eye: heavy lid, a bag under it, behind round spectacles
    var ex = X + r * 0.52, ey = Y - r * 0.02;
    o += E(ex, ey + 0.2, 2, 1.4, '#f6f0e4') + C(ex + 0.6, ey + 0.4, 1.1, '#5a5a4a') + C(ex + 0.75, ey + 0.4, 0.5, '#141414');
    o += P('M' + n(ex - 2.3) + ',' + n(ey - 0.4) + ' Q' + n(ex) + ',' + n(ey - 2.2) + ' ' + n(ex + 2.3) + ',' + n(ey - 0.3) + ' L' + n(ex + 2.2) + ',' + n(ey + 0.2) + ' Q' + n(ex) + ',' + n(ey - 0.8) + ' ' + n(ex - 2.2) + ',' + n(ey + 0.1) + ' Z', HW.skinD, 1);
    o += L('M' + n(ex - 1.8) + ',' + n(ey + 2.2) + ' Q' + n(ex) + ',' + n(ey + 3.2) + ' ' + n(ex + 1.8) + ',' + n(ey + 2.1), dk(HW.skin, 0.3), 0.8, 0.9);
    o += L('M' + n(ex - 3) + ',' + n(ey - 3.4) + ' Q' + n(ex) + ',' + n(ey - 4.4) + ' ' + n(ex + 2.8) + ',' + n(ey - 3.2), '#5a5458', 1.4);
    o += ring(ex + 0.4, ey + 0.4, 3.3, OL, 2.2) + ring(ex + 0.4, ey + 0.4, 3.3, '#b8a060', 0.9) + L('M' + n(ex - 2.9) + ',' + n(ey - 0.2) + ' L' + q(-0.36, -0.1), OL, 1.1) + L('M' + n(ex + 1.6) + ',' + n(ey - 1.6) + ' L' + n(ex + 2.4) + ',' + n(ey - 0.6), '#ffffff', 0.9, 0.8);
    // thin, downturned mouth
    o += L('M' + q(0.56, 0.74) + ' Q' + q(0.76, 0.68) + ' ' + q(0.96, 0.78), '#6a3a32', 1.2);
    return o;
  }
  function hwLeg(c, h, kn, f, back) {
    var col = back ? dk(HW.trouser, 0.22) : HW.trouser, o = tube([h, kn, [f[0] + 0.5, f[1] - 3]], 8.6, col, back ? null : dk(col, 0.25));
    var x = f[0], y = f[1] + 5;
    o += P('M' + n(x - 5) + ',' + n(y - 7.4) + ' L' + n(x + 3) + ',' + n(y - 7.4) + ' C' + n(x + 6) + ',' + n(y - 5.6) + ' ' + n(x + 10.6) + ',' + n(y - 4.4) + ' ' + n(x + 10.6) + ',' + n(y - 1.4) + ' L' + n(x + 10.6) + ',' + n(y) + ' L' + n(x - 5.4) + ',' + n(y) + ' Z', c.cel(back ? dk(HW.shoe, 0.1) : HW.shoe), 2.1);
    o += L('M' + n(x + 3.4) + ',' + n(y - 5.4) + ' Q' + n(x + 7) + ',' + n(y - 4.4) + ' ' + n(x + 9) + ',' + n(y - 2.6), '#8a8288', 0.9, 0.7);
    return o;
  }
  function hwRig(c) {
    var o = '';
    var bSh = [58, 50], bEl = [53.5, 63], bHd = [54, 75], fSh = [75, 50], fEl = [82.5, 64.5], fHd = [89, 58];
    // the coat's long skirt and back vent
    o += P('M55,74 L77.6,74 C80.4,84 82.4,94 83.6,104.6 L74.4,105.6 L70.6,87 L64.4,87 L60.6,106.4 L48.6,104.4 C50.6,94 52.8,84 55,74 Z', c.cel(HW.coat), 2.1);
    o += CG(F('M44,70 L60,70 L60,108 L44,108 Z', HW.coatD, 0.5), c.clip('M55,74 L77.6,74 C80.4,84 82.4,94 83.6,104.6 L74.4,105.6 L70.6,87 L64.4,87 L60.6,106.4 L48.6,104.4 C50.6,94 52.8,84 55,74 Z'));
    // far arm down, the ledger clamped under it, the hand holding its corner
    o += tube([bSh, bEl, bHd], 8.2, dk(HW.coat, 0.15));
    o += G(ledger(c), 'translate(48.6,68) rotate(-7)');
    o += C(bHd[0], bHd[1] + 2, 4.1, c.cel(HW.skinD), 1.8) + C(bHd[0] + 2.2, bHd[1] + 3.4, 0.9, HW.ink, 0, 0.8);
    o += hwLeg(c, [61, 82], [60, 100], [57.5, 117], true);
    o += hwLeg(c, [67, 82], [70, 100], [73.5, 117], false);
    // re-draw the front of the coat skirt over the near thigh
    o += P('M68,76 L77.6,74 C80.4,84 82.4,94 83.6,104.6 L74.4,105.6 L70.6,87 Z', c.cel(HW.coat), 2);
    o += L('M77.4,78 C79.4,86 81,94 82,103', HW.lapel, 1.1, 0.8);
    // waistcoat, shirt and neckcloth, the coat over the back and shoulder, its lapel
    var body = 'M53,47 Q66,42 79,47 C81,58 79.4,68 77.6,78 L55.4,78 C54.6,68 51,58 53,47 Z';
    o += P(body, c.cel(HW.vest), 2.2);
    [52, 57, 62, 67, 72].forEach(function (y) { o += C(76.2 - (y - 52) * 0.03, y, 0.8, '#c8b078', 0.6); });
    o += P('M69,41.6 L77,43.6 L76,50 L71.4,48 Z', c.cel(HW.shirt), 1.4) + P('M71,46 L75.4,47 L74,54 L72,53.4 Z', c.cel('#8a8478'), 1.1);
    var coat = 'M53,47 Q60,43 67.6,42 L71.6,49.4 L72.4,78 L55.4,78 C54.6,68 51,58 53,47 Z';
    o += P(coat, c.cel(HW.coat), 2.2) + CG(F('M48,40 L60,40 L61,82 L48,82 Z', HW.coatD, 0.5), c.clip(coat));
    o += P('M67.6,42 L73,44.6 L71.8,58 L70.2,50 Z', c.cel(HW.lapel), 1.5);
    o += P('M55.6,74.4 L72.4,74.4 L72.4,78 L55.4,78 Z', HW.coatD, 1.2);
    // a pocket watch chain, and an ink blot on the waistcoat
    o += L('M73.2,64 Q75,67 77.2,64.6', '#c8b078', 0.8) + E(74.8, 58.6, 1.1, 0.8, HW.ink, 0, 0.8);
    o += tube([[67, 44], [71, 37]], 6.4, HW.skin);
    o += hwHead(c, 72, 29.5, 10.4);
    // near arm: coat sleeve, shirt cuff, the quill in ink-stained fingers
    o += tube([fSh, fEl, fHd], 8.4, HW.coat, HW.coatD);
    o += tube([lerp(fEl, fHd, 0.82), lerp(fEl, fHd, 0.9)], 8.8, HW.shirt);
    var nib = [fHd[0] + 2.2, fHd[1] + 5], tip = [fHd[0] + 11, fHd[1] - 21];
    o += L('M' + pt(nib) + ' L' + pt(lerp(nib, tip, 0.3)), OL, 2.6) + L('M' + pt(nib) + ' L' + pt(lerp(nib, tip, 0.3)), '#d8cfae', 1.1) + C(nib[0], nib[1], 0.9, HW.ink, 0.6);
    o += P('M' + pt(lerp(nib, tip, 0.26)) + ' C' + n(fHd[0] + 1.6) + ',' + n(fHd[1] - 9) + ' ' + n(tip[0] - 4) + ',' + n(tip[1] + 3) + ' ' + pt(tip) + ' C' + n(tip[0] + 0.6) + ',' + n(tip[1] + 6) + ' ' + n(fHd[0] + 6.4) + ',' + n(fHd[1] - 4) + ' ' + pt(lerp(nib, tip, 0.3)) + ' Z', c.lg([[0, '#ffffff'], [1, '#c8c0ac']], 0, 0, 1, 0), 1.3);
    o += L('M' + pt(lerp(nib, tip, 0.34)) + ' Q' + n(fHd[0] + 5) + ',' + n(fHd[1] - 9) + ' ' + pt(lerp(nib, tip, 0.94)), '#a89e88', 0.7);
    o += C(fHd[0], fHd[1], 4.2, c.cel(HW.skin), 1.9) + F('M' + n(fHd[0] + 1.6) + ',' + n(fHd[1] - 2.6) + ' Q' + n(fHd[0] + 4.2) + ',' + n(fHd[1] - 0.6) + ' ' + n(fHd[0] + 3) + ',' + n(fHd[1] + 2.4) + ' Q' + n(fHd[0] + 2) + ',' + n(fHd[1]) + ' ' + n(fHd[0] + 1.6) + ',' + n(fHd[1] - 2.6) + ' Z', HW.ink, 0.85);
    o += C(fHd[0] - 1.4, fHd[1] + 2.6, 0.7, HW.ink, 0, 0.8);
    return o;
  }
  function harrowbySprite(c) { return shadow(c, 64, 27) + hwRig(c); }
  function harrowbyActor(c) {
    var keep = SWM; SWM = 0.8;
    try { return E(84, 155, 36, 5, c.rg([[0, '#000', 0.45], [0.65, '#000', 0.25], [1, '#000', 0]])) + G(hwRig(c), 'matrix(-1.28,0,0,1.28,166,-1.2)'); } finally { SWM = keep; }
  }

  // =====================================================================
  // SAL BRIGHTBELL, Camp Champion: the loud, cocky human singer who rules the song contests at Wexley's Expedition.
  // Drawn facing right then mirrored (mobs face left): a plum cavalier hat with a big red-and-gold plume, a curled
  // moustache, mouth wide open in song; a bright red waistcoat with gold diamonds over puffed white sleeves, a teal
  // sash, blue breeches, brown boots with gold cuffs; a jingling hand drum held high.
  // =====================================================================
  var SB = { skin: '#f2c29c', hair: '#3a2212', hat: '#5e2a70', plume: '#e0402a', plumeT: '#f4c448', waist: '#c8302a', gold: '#f2c040', shirt: '#f6f2e8', sash: '#2a8a78', breeches: '#2f4a80', boot: '#6a4020', wood: '#b0743a', skinDrum: '#f0dcae' };
  function sbDrum(c) {
    // frame drum face-on: a wooden rim with brass jingles, a pale skin painted with a sun
    var o = C(0, 0, 11.6, c.cel(SB.wood), 2.2) + C(0, 0, 8.8, c.rg([[0, '#fff6dc'], [0.7, SB.skinDrum], [1, '#cfb07a']], 0.4, 0.36, 0.7), 1.4);
    o += P(sparkleD(0, 0, 5.2), c.cel('#e88a2a'), 1) + C(0, 0, 2, c.cel(SB.gold), 0.9);
    [30, 100, 170, 240, 310].forEach(function (a) { var x = Math.cos(a * PI / 180) * 10.2, y = Math.sin(a * PI / 180) * 10.2; o += E(x, y, 2.2, 1.3, c.cel(SB.gold), 1, null, a + 90) + L('M' + n(x) + ',' + n(y - 0.9) + ' L' + n(x) + ',' + n(y + 0.9), OL, 0.6); });
    return o;
  }
  function sparkleD(x, y, r) { var d = ''; for (var i = 0; i < 16; i++) { var a = i / 16 * PI * 2, rr = i % 2 ? r * 0.55 : r; d += (i ? ' L' : 'M') + n(x + Math.cos(a) * rr) + ',' + n(y + Math.sin(a) * rr); } return d + ' Z'; }
  function sbLeg(c, h, kn, f, back) {
    var col = back ? dk(SB.breeches, 0.22) : SB.breeches, bc = back ? dk(SB.boot, 0.18) : SB.boot, o = tube([h, kn], 9, col, back ? null : dk(col, 0.25));
    o += tube([kn, [f[0] + 0.5, f[1] - 3]], 9.4, bc, back ? null : dk(bc, 0.3));
    var x = f[0], y = f[1] + 5;
    o += P('M' + n(x - 5.4) + ',' + n(y - 9) + ' L' + n(x + 3) + ',' + n(y - 9) + ' C' + n(x + 5.6) + ',' + n(y - 6) + ' ' + n(x + 11) + ',' + n(y - 5) + ' ' + n(x + 11) + ',' + n(y - 1.4) + ' L' + n(x + 11) + ',' + n(y) + ' L' + n(x - 5.8) + ',' + n(y) + ' Z', c.cel(bc), 2.1);
    // gold-trimmed cuff under the knee
    var dx = f[0] - kn[0], dy = f[1] - kn[1], l = Math.sqrt(dx * dx + dy * dy) || 1, px = -dy / l * 6.6, py = dx / l * 6.6, a = [kn[0] + dx / l * 1.5, kn[1] + dy / l * 1.5], b = [kn[0] + dx / l * 6, kn[1] + dy / l * 6];
    o += P(pd([[a[0] - px, a[1] - py], [a[0] + px, a[1] + py], [b[0] + px * 0.9, b[1] + py * 0.9], [b[0] - px * 0.9, b[1] - py * 0.9]], true), c.cel(lt(bc, 0.15)), 1.8) + L(pd([[b[0] - px * 0.85, b[1] - py * 0.85], [b[0] + px * 0.85, b[1] + py * 0.85]]), SB.gold, 1.4);
    return o;
  }
  function sbRig(c) {
    var o = '';
    var bSh = [57, 47], bEl = [47, 45], bHd = [42, 36], fSh = [76, 48], fEl = [87.5, 53], fHd = [97, 46];
    // the drum arm raised behind, the drum held high
    o += tube([bSh, bEl, bHd], 8.8, dk(SB.shirt, 0.18));
    o += G(sbDrum(c), 'translate(36,30) rotate(-14)');
    o += C(bHd[0] + 1, bHd[1] + 1, 4, c.cel(dk(SB.skin, 0.1)), 1.8);
    o += sbLeg(c, [60, 81], [52.5, 99], [46.5, 117], true);
    o += sbLeg(c, [69, 81], [78, 99], [84, 117], false);
    // breeches seat, the sash with its hanging ends
    o += P('M55,76 L77,76 L78.6,86 L53.6,86 Z', c.cel(SB.breeches), 2);
    o += P('M55,72 L57.4,72 L52,92 L47.6,90 Z', c.cel(dk(SB.sash, 0.12)), 1.7) + P('M56,73 L59,73 L57,90 L52.6,89 Z', c.cel(SB.sash), 1.7);
    // puffed white shirt, the red waistcoat with gold diamonds and buttons
    var chest = 'M52.4,46 Q66,40 81,45.6 C83.4,57 80,68 77.6,77 L55.6,77 C54.6,68 50.6,57 52.4,46 Z';
    o += P(chest, c.cel(SB.shirt), 2.2);
    var wc = 'M52.4,46 Q60,42.4 66.4,42 L73,52 L75.8,42.6 Q79,43.6 81,45.6 C83.4,57 80,68 77.6,77 L55.6,77 C54.6,68 50.6,57 52.4,46 Z';
    var dia = '';
    for (var y = 44; y < 80; y += 8) for (var x = 50; x < 84; x += 8) { var ox = (Math.round((y - 44) / 8) % 2) * 4; dia += 'M' + (x + ox) + ',' + (y - 3) + ' L' + (x + ox + 2.6) + ',' + y + ' L' + (x + ox) + ',' + (y + 3) + ' L' + (x + ox - 2.6) + ',' + y + ' Z'; }
    o += P(wc, c.cel(SB.waist), 2.2) + CG(F(dia, SB.gold, 0.85) + F('M48,40 L60,40 L61,80 L48,80 Z', '#000000', 0.25), c.clip(wc));
    o += L('M73,52 L74.6,77', OL, 1.2);
    [56, 62, 68, 74].forEach(function (y) { o += C(75.6 + (y - 56) * 0.04, y, 1.1, c.cel(SB.gold), 0.8); });
    o += P('M55.6,74 L77.6,74 L77.2,78.2 L55.4,78.2 Z', c.cel(SB.sash), 1.5);
    o += L('M66.4,42 L73,52 L75.8,42.6', SB.gold, 1.3);
    // head: thrown back in song
    var X = 71, Y = 26, r = 10.8;
    function q(u, v) { return n(X + r * u) + ',' + n(Y + r * v); }
    var h = '';
    h += P('M' + q(-0.7, -0.6) + ' C' + q(-1.3, -0.4) + ' ' + q(-1.4, 0.4) + ' ' + q(-1.1, 0.8) + ' L' + q(-0.6, 0.6) + ' Z', c.cel(SB.hair), 1.8);
    var face = 'M' + q(-1, 0.05) + ' C' + q(-1, -1.3) + ' ' + q(0.95, -1.3) + ' ' + q(1, -0.15) + ' L' + q(1.3, 0.3) + ' L' + q(1.02, 0.46) +
      ' C' + q(1.06, 0.98) + ' ' + q(0.5, 1.2) + ' ' + q(0.04, 1.1) + ' C' + q(-0.7, 1.0) + ' ' + q(-1, 0.55) + ' ' + q(-1, 0.05) + ' Z';
    h += P(face, c.cel(SB.skin), 2.1) + CG(F('M' + q(-1.1, -0.2) + ' L' + q(-0.25, -0.2) + ' C' + q(-0.4, 0.4) + ' ' + q(-0.2, 0.8) + ' ' + q(0.2, 1.2) + ' L' + q(-1.1, 1.2) + ' Z', dk(SB.skin, 0.2), 0.5), c.clip(face));
    h += C(X - r * 0.36, Y + r * 0.14, r * 0.25, c.cel(SB.skin), 1.4);
    // wide-open singing mouth, a curled moustache, a rosy cheek, a cocky raised brow, eye squeezed shut with gusto
    h += P('M' + q(0.44, 0.6) + ' Q' + q(0.7, 0.5) + ' ' + q(1.02, 0.56) + ' Q' + q(1.0, 1.08) + ' ' + q(0.66, 1.04) + ' Q' + q(0.44, 0.9) + ' ' + q(0.44, 0.6) + ' Z', '#6a1a1c', 1.2);
    h += F('M' + q(0.54, 0.9) + ' Q' + q(0.74, 0.78) + ' ' + q(0.94, 0.9) + ' Q' + q(0.8, 1.02) + ' ' + q(0.54, 0.9) + ' Z', '#e0707a') + F('M' + q(0.5, 0.6) + ' L' + q(1.0, 0.58) + ' L' + q(0.98, 0.66) + ' L' + q(0.52, 0.68) + ' Z', '#ffffff', 0.9);
    h += P('M' + q(0.5, 0.52) + ' C' + q(0.7, 0.36) + ' ' + q(1.0, 0.4) + ' ' + q(1.14, 0.5) + ' C' + q(1.3, 0.56) + ' ' + q(1.42, 0.44) + ' ' + q(1.4, 0.3) + ' C' + q(1.5, 0.5) + ' ' + q(1.36, 0.7) + ' ' + q(1.12, 0.62) + ' C' + q(0.9, 0.56) + ' ' + q(0.66, 0.56) + ' ' + q(0.5, 0.52) + ' Z', c.cel(SB.hair), 1);
    h += E(X + r * 0.26, Y + r * 0.34, 2.4, 1.4, '#f07a6a', 0, 0.5);
    var ex = X + r * 0.5, ey = Y - r * 0.06;
    h += L('M' + n(ex - 2.3) + ',' + n(ey + 0.3) + ' Q' + n(ex) + ',' + n(ey - 1.6) + ' ' + n(ex + 2.4) + ',' + n(ey + 0.2), OL, 1.4);
    h += L('M' + n(ex - 2.8) + ',' + n(ey - 4) + ' Q' + n(ex) + ',' + n(ey - 6.6) + ' ' + n(ex + 3.2) + ',' + n(ey - 5), SB.hair, 1.6);
    // dark curls under the hat brim
    h += P('M' + q(-1.02, -0.2) + ' Q' + q(-1.2, 0.3) + ' ' + q(-0.9, 0.56) + ' Q' + q(-0.74, 0.3) + ' ' + q(-0.5, 0.46) + ' Q' + q(-0.5, 0.1) + ' ' + q(-0.2, -0.1) + ' L' + q(-0.2, -0.5) + ' Z', c.cel(SB.hair), 1.5);
    // the plum cavalier hat, brim swept up at the back, a big plume
    h += P('M' + q(-0.9, -0.66) + ' C' + q(-0.9, -1.7) + ' ' + q(0.6, -1.9) + ' ' + q(0.8, -0.84) + ' Z', c.cel(SB.hat), 2);
    h += L('M' + q(-0.86, -0.86) + ' Q' + q(0, -1.1) + ' ' + q(0.8, -0.96), SB.gold, 1.8);
    h += P('M' + q(-1.7, -1.3) + ' C' + q(-1.5, -0.7) + ' ' + q(-0.6, -0.56) + ' ' + q(0.4, -0.6) + ' C' + q(1.1, -0.62) + ' ' + q(1.6, -0.5) + ' ' + q(1.76, -0.72) + ' C' + q(1.4, -0.96) + ' ' + q(0.8, -0.96) + ' ' + q(0.2, -0.9) + ' C' + q(-0.6, -0.86) + ' ' + q(-1.3, -0.96) + ' ' + q(-1.7, -1.3) + ' Z', c.cel(dk(SB.hat, 0.06)), 2);
    var plume = 'M' + q(-0.2, -1.0) + ' C' + q(-0.8, -2.2) + ' ' + q(-2.2, -2.6) + ' ' + q(-3.0, -1.8) + ' C' + q(-2.4, -2.0) + ' ' + q(-1.8, -1.9) + ' ' + q(-1.5, -1.5) + ' C' + q(-2.1, -1.6) + ' ' + q(-2.5, -1.2) + ' ' + q(-2.6, -0.8) + ' C' + q(-1.8, -1.4) + ' ' + q(-0.8, -1.3) + ' ' + q(-0.2, -1.0) + ' Z';
    h += P(plume, c.lg([[0, SB.plume], [0.7, lt(SB.plume, 0.15)], [1, SB.plumeT]], 1, 1, 0, 0), 1.8);
    h += L('M' + q(-0.3, -1.04) + ' C' + q(-1.0, -1.8) + ' ' + q(-1.9, -2.0) + ' ' + q(-2.6, -1.8), dk(SB.plume, 0.35), 0.9) + L('M' + q(-2.9, -1.84) + ' Q' + q(-2.6, -1.9) + ' ' + q(-2.3, -1.84), SB.plumeT, 1.4);
    o += tube([[67, 43], [70, 36]], 7, SB.skin);
    o += G(h, 'rotate(-8 ' + n(X - 2) + ' ' + n(Y + r) + ')');
    // puffed near sleeve, the showman's flourish
    o += tube([fSh, fEl], 10.4, SB.shirt, dk(SB.shirt, 0.2)) + tube([fEl, fHd], 8.2, SB.shirt, dk(SB.shirt, 0.2));
    o += tube([lerp(fEl, fHd, 0.82), lerp(fEl, fHd, 0.9)], 8.6, SB.waist);
    o += C(fHd[0], fHd[1], 4.4, c.cel(SB.skin), 2) + L('M' + n(fHd[0] + 1) + ',' + n(fHd[1] - 3) + ' L' + n(fHd[0] + 3) + ',' + n(fHd[1] - 9), OL, 4.2) + L('M' + n(fHd[0] + 1) + ',' + n(fHd[1] - 3) + ' L' + n(fHd[0] + 3) + ',' + n(fHd[1] - 9), SB.skin, 2.2);
    return o;
  }
  function salMob(c) { return shadow(c, 64, 30) + G(sbRig(c), 'matrix(-1,0,0,1,128,0)'); }

  // =====================================================================
  // WIDYA'S ICONS (64 x 64): her portrait, the fifteen bard songs (music and nature: notes, strings, leaves, light,
  // each on its own colour so they tell apart at a glance), the lute pieces of her questline and the keepsake lute
  // =====================================================================
  // music glyphs: a note head, an outlined stem, a flag; an eighth note (head at x,y, stem up), a beamed pair
  function noteHead(c, x, y, s, col) { return E(x, y, 3.8 * s, 2.8 * s, c.lg([[0, lt(col, 0.55)], [0.5, col], [1, dk(col, 0.3)]], 0.2, 0, 0.8, 1), 1.6, null, -24); }
  function stem(x, y0, y1, s, col) { var d = 'M' + n(x) + ',' + n(y0) + ' L' + n(x) + ',' + n(y1); return L(d, OL, 4.2 * s) + L(d, col, 1.8 * s); }
  function flagD(x, y, s) { return 'M' + n(x) + ',' + n(y) + ' C' + n(x + 1 * s) + ',' + n(y + 4 * s) + ' ' + n(x + 7 * s) + ',' + n(y + 5 * s) + ' ' + n(x + 5 * s) + ',' + n(y + 12 * s) + ' C' + n(x + 5.4 * s) + ',' + n(y + 8 * s) + ' ' + n(x + 2 * s) + ',' + n(y + 6.4 * s) + ' ' + n(x) + ',' + n(y + 5.6 * s) + ' Z'; }
  function note(c, x, y, s, col, flags) {
    var sx = x + 3.3 * s, top = y - 17 * s, o = stem(sx, y - 0.6 * s, top, s, col);
    for (var i = 0; i < (flags == null ? 1 : flags); i++) o += P(flagD(sx, top + i * 4.6 * s, s), c.cel(col), 1.4);
    return o + noteHead(c, x, y, s, col);
  }
  function notePair(c, x, y, s, col) {
    var x2 = x + 11 * s, y2 = y - 2.4 * s, s1 = x + 3.3 * s, s2 = x2 + 3.3 * s, t1 = y - 17 * s, t2 = y2 - 17 * s;
    var beam = 'M' + n(s1 - 1 * s) + ',' + n(t1 - 0.6 * s) + ' L' + n(s2 + 1 * s) + ',' + n(t2 - 0.6 * s) + ' L' + n(s2 + 1 * s) + ',' + n(t2 + 3.6 * s) + ' L' + n(s1 - 1 * s) + ',' + n(t1 + 3.6 * s) + ' Z';
    return stem(s1, y - 0.6 * s, t1 + 1 * s, s, col) + stem(s2, y2 - 0.6 * s, t2 + 1 * s, s, col) + P(beam, c.cel(col), 1.5) + noteHead(c, x, y, s, col) + noteHead(c, x2, y2, s, col);
  }
  // an outlined stroke (dark under colour) for strings, cords, vines and sound lines
  function ol(d, col, w, o) { return L(d, OL, w + 2.4, o) + L(d, col, w, o); }
  function rays(x, y, r0, r1, k, col, o, rot) {
    var d = '';
    for (var i = 0; i < k; i++) { var a = (rot || 0) + i / k * PI * 2, b = PI / k * 0.45; d += 'M' + n(x + Math.cos(a - b) * r0) + ',' + n(y + Math.sin(a - b) * r0) + ' L' + n(x + Math.cos(a) * r1) + ',' + n(y + Math.sin(a) * r1) + ' L' + n(x + Math.cos(a + b) * r0) + ',' + n(y + Math.sin(a + b) * r0) + ' Z'; }
    return F(d, col, o);
  }
  var WICONS = {
    legend_widya: function (c) {
      var keep = SWM, g;
      SWM = 0.9;
      try {
        g = G(lute(c, 44), 'translate(53,72) rotate(8) scale(0.92)') + G(wiRig(c, WPOSE_SPRITE, { upper: true }), 'matrix(1.24,0,0,1.24,-55,0.2)');
      } finally { SWM = keep; }
      return iconWrap(c, ['#a6c46a', '#1e2a0c'], iglow(c, 34, 26, 30, '#fff2c8', 0.35) + g);
    },
    // a quick single heal: a warm chord of three notes on one stem, soft light and a leaf
    soothing_chord: function (c) {
      var o = iglow(c, 30, 32, 30, '#f0ffd8', 0.85);
      o += ol('M42,20 Q48,28 42,36 M47,16 Q56,28 47,40', '#e8ffd0', 1.6, 0.9);
      o += stem(31.5, 46, 12, 1.2, '#fff4d6') + P(flagD(31.5, 12, 1.2), c.cel('#fff4d6'), 1.4);
      o += noteHead(c, 27.4, 47, 1.2, '#fff4d6') + noteHead(c, 27.4, 39.6, 1.2, '#fff4d6') + noteHead(c, 27.4, 32.2, 1.2, '#fff4d6');
      o += leaf(c, 46, 50, 60, 0.8, '#8ad05a') + leaf(c, 14, 22, -40, 0.6, '#a8e068');
      return iconWrap(c, ['#8cd67c', '#0c2a12'], o + sparkle(50, 10, 3.2, '#ffffff') + sparkle(12, 44, 2.4, '#ffffff'));
    },
    // arcane damage: a cracked, clashing note throwing off jagged shocks
    dissonant_note: function (c) {
      var o = iglow(c, 28, 36, 30, '#ffb8ff', 0.75);
      var st = '';
      for (var i = 0; i < 10; i++) { var a = i / 10 * PI * 2 + 0.3, r0 = i % 2 ? 12 : 26; st += (i ? ' L' : 'M') + n(28 + Math.cos(a) * r0) + ',' + n(34 + Math.sin(a) * r0); }
      o += F(st + ' Z', '#f08aff', 0.35);
      o += note(c, 22, 46, 1.45, '#f6c4ff', 1);
      o += ol('M17,40 L21.6,44 L19.4,46 L25,50', '#3a0a4a', 1.1);
      var bolt = 'M36,24 L43,28 L40,30.6 L50,35 L46.4,37 L58,43';
      o += ol(bolt, '#ffffff', 2) + ol('M38,16 L44,14 L43,18 L52,15', '#ffd8ff', 1.4) + ol('M40,44 L46,50 L42,51 L47,58', '#ffd8ff', 1.4);
      return iconWrap(c, ['#c064e0', '#1a0626'], o + sparkle(54, 20, 3, '#ffffff') + sparkle(10, 18, 2.2, '#ffe0ff'));
    },
    // a heal over time on the party: a flowing ribbon of staff lines, notes riding it, leaves drifting down
    song_of_rest: function (c) {
      var o = iglow(c, 32, 32, 32, '#d8fff0', 0.7);
      [0, 4.6, 9.2].forEach(function (d) { o += ol('M2,' + (48 + d) + ' C14,' + (36 + d) + ' 24,' + (52 + d) + ' 36,' + (38 + d) + ' C44,' + (29 + d) + ' 52,' + (32 + d) + ' 62,' + (24 + d), '#e8fff6', 1.3, 0.95); });
      o += note(c, 14, 44, 0.8, '#ffffff') + note(c, 30, 40, 0.9, '#fff8e0') + note(c, 46, 33, 0.8, '#ffffff');
      o += leaf(c, 20, 14, 30, 0.6, '#8ad05a') + leaf(c, 42, 10, -50, 0.55, '#a8e068') + leaf(c, 54, 52, 120, 0.55, '#6ab846');
      return iconWrap(c, ['#62c8b4', '#08241e'], o + sparkle(8, 22, 2.4, '#ffffff') + sparkle(56, 12, 2.8, '#ffffff'));
    },
    // party haste: a marching side drum, crossed sticks, speed lines
    marching_song: function (c) {
      var o = iglow(c, 34, 32, 30, '#ffd8a0', 0.7);
      o += ol('M4,30 L16,30 M2,38 L14,38 M6,46 L16,46', '#fff0d0', 1.6, 0.9);
      var body = 'M18,28 L50,28 L50,46 C50,51 18,51 18,46 Z';
      o += P(body, c.lg([[0, '#f0503a'], [0.6, '#c8281e'], [1, '#801410']], 0, 0, 1, 0), 2.2);
      o += CG(ol('M18,31 L26,45 L34,31 L42,45 L50,31', '#f4c448', 1.2) + F('M18,28 L24,28 L24,52 L18,52 Z', '#ffffff', 0.2), c.clip(body));
      o += E(34, 28, 16, 5.4, c.lg([[0, '#fff6e0'], [1, '#d8c8a0']]), 2.2) + P('M18,45 C18,50.4 50,50.4 50,45 L50,47.6 C50,53 18,53 18,47.6 Z', c.cel('#e8c060'), 1.6);
      o += ol('M22,6 L42,26', '#e8c890', 2.2) + ol('M48,6 L28,26', '#e8c890', 2.2) + C(22, 6, 2.6, c.cel('#fff2d0'), 1.4) + C(48, 6, 2.6, c.cel('#fff2d0'), 1.4);
      o += note(c, 52, 58, 0.6, '#ffffff');
      return iconWrap(c, ['#f08a3a', '#2a0c04'], o + sparkle(58, 16, 2.6, '#ffffff'));
    },
    // sleep: a crescent moon, a note hanging from its tip, stars, drowsy curls
    lullaby: function (c) {
      var o = iglow(c, 34, 28, 30, '#e0e4ff', 0.6);
      o += P('M40,6 C26,6 16,17 16,30 C16,43 27,53 40,53 C47,53 53,50 57,45 C45,47 34,39 34,27 C34,18 39,10 46,7 C44,6.3 42,6 40,6 Z', c.lg([[0, '#fffbe0'], [0.6, '#f4e8a8'], [1, '#c8b868']], 0.2, 0, 0.8, 1), 2.2);
      o += L('M22,22 C21,30 24,40 32,46', '#ffffff', 1.4, 0.55);
      o += L('M46,44 L46,50', '#d8dcf8', 0.8, 0.9) + note(c, 44, 56, 0.55, '#ffffff');
      o += ol('M8,14 Q12,12 10,16 Q8,20 12,18', '#c8d0ff', 1, 0.9) + ol('M54,24 Q58,22 56,26 Q54,30 58,28', '#c8d0ff', 1, 0.9);
      return iconWrap(c, ['#6a74d8', '#080a2a'], o + sparkle(52, 12, 2.8, '#ffffff') + sparkle(10, 44, 2.2, '#ffffff') + sparkle(26, 58, 1.8, '#ffffff', 0.8));
    },
    // a heal over time on one ally: a verse on a parchment page, a green vine stitched across it
    verse_of_mending: function (c) {
      var o = iglow(c, 32, 32, 30, '#f4ffc0', 0.6);
      var pg = 'M12,14 C20,11 36,13 50,10 C49,24 51,38 50,52 C36,55 22,52 13,55 C14,40 11,26 12,14 Z';
      o += G(P(pg, c.lg([[0, '#fffaea'], [0.6, '#efe2bc'], [1, '#c8b684']], 0.2, 0, 0.8, 1), 2.2) + L('M16,24 C26,22 36,23 46,21 M16,29 C26,27 36,28 46,26 M16,34 C26,32 36,33 46,31', '#9a8a68', 0.8, 0.9) + note(c, 26, 33, 0.85, '#58b840'), 'rotate(-6 32 32)');
      var vine = 'M6,52 C16,42 24,50 32,42 C40,34 48,42 58,32';
      o += ol(vine, '#4e9a34', 1.8) + L('M14,44 L18,50 M26,43 L28,50 M38,36 L40,43 M48,35 L50,41', '#e8ffd0', 1.1, 0.9);
      o += leaf(c, 20, 46, -120, 0.55, '#8ad05a') + leaf(c, 36, 40, 40, 0.55, '#6ab846') + leaf(c, 52, 36, -150, 0.5, '#a8e068');
      return iconWrap(c, ['#c4d468', '#1c2206'], o + sparkle(54, 12, 2.8, '#ffffff') + sparkle(8, 12, 2, '#ffffff'));
    },
    // an instant party heal: a grove tree in a burst of light, a ring of notes round it
    chorus_grove: function (c) {
      var o = iglow(c, 32, 30, 34, '#f0ffc0', 0.85) + rays(32, 28, 12, 31, 12, '#f8ffd8', 0.35);
      o += P('M29.6,50 C30.4,44 30,38 28,32 L36,32 C34,38 33.6,44 34.6,50 Z', c.cel('#8a5a30'), 1.8);
      o += C(24, 27, 8.6, c.cel('#5aa838'), 1.9) + C(40, 27, 8.6, c.cel('#5aa838'), 1.9) + C(32, 19, 10, c.cel('#78c048'), 1.9);
      o += E(32, 51, 12, 2.6, '#2a4a14', 0, 0.5);
      [[10, 20, 0.5], [12, 44, 0.48], [50, 12, 0.5], [54, 38, 0.5], [30, 60, 0.42]].forEach(function (q) { o += note(c, q[0], q[1] + 7, q[2], '#ffffff'); });
      return iconWrap(c, ['#9ee060', '#0a2206'], o + sparkle(44, 6, 2.6, '#ffffff') + sparkle(6, 32, 2.2, '#ffffff'));
    },
    // a shield on one ally: two notes crossing, one up, one down, inside a bright bubble
    counterpoint: function (c) {
      var o = iglow(c, 32, 32, 30, '#d8f0ff', 0.6);
      o += C(32, 32, 22, c.rg([[0, '#ffffff', 0.05], [0.75, '#a8d8ff', 0.3], [1, '#e8f6ff', 0.75]]), 0) + ring(32, 32, 22, OL, 4.4) + ring(32, 32, 22, '#e0f2ff', 2.2);
      o += L('M18,20 A18,18 0 0 1 30,14', '#ffffff', 2, 0.85);
      o += note(c, 23, 44, 1.05, '#fff2c8') + G(note(c, 23, 44, 1.05, '#9ac8f0'), 'rotate(180 32 32)');
      return iconWrap(c, ['#74aee8', '#061626'], o + sparkle(52, 12, 3, '#ffffff') + sparkle(12, 52, 2.2, '#ffffff'));
    },
    // party Spirit and Intellect: a hearth fire in a ring of stones, notes rising in its warmth
    hearthsong: function (c) {
      var o = iglow(c, 32, 40, 30, '#ffe0a0', 0.9);
      o += fire(c, 32, 50, 1.55, 0, 1.8);
      [[16, 52, 5], [23, 55, 5.2], [32, 56.4, 5.4], [41, 55, 5.2], [48, 52, 5]].forEach(function (q) { o += E(q[0], q[1], q[2], 3.4, c.cel('#9a948a'), 1.6); });
      o += L('M24,48 L28,52 M40,48 L36,52 M30,49 L34,52', '#6a3a1a', 2.4, 0.9);
      o += note(c, 12, 26, 0.7, '#fff4d8') + note(c, 46, 18, 0.75, '#fff4d8');
      return iconWrap(c, ['#eea24a', '#2a1004'], o + sparkle(22, 10, 2.4, '#ffffff') + sparkle(56, 34, 2.2, '#fff4c0'));
    },
    // a big slow heal: the crescendo hairpin opening into a burst of golden light
    crescendo: function (c) {
      var o = iglow(c, 46, 32, 26, '#fff4c0', 0.9);
      o += F('M6,32 L54,12 L54,52 Z', c.lg([[0, '#fff6c0', 0], [1, '#fff6c0', 0.75]], 0, 0, 1, 0));
      o += ol('M6,32 L54,12 M6,32 L54,52', '#f8d048', 2.6);
      o += rays(50, 32, 6, 16, 10, '#ffffff', 0.7) + C(50, 32, 6, c.rg([[0, '#ffffff'], [1, '#ffe27a']]), 1.6);
      o += note(c, 22, 38, 0.55, '#ffffff');
      return iconWrap(c, ['#f4d060', '#2a1c02'], o + sparkle(58, 10, 2.8, '#ffffff') + sparkle(58, 54, 2.4, '#ffffff'));
    },
    // shadow damage over time: a drooping dark note, a wilted leaf, smoky wisps
    dirge: function (c) {
      var o = iglow(c, 30, 30, 30, '#c8a8f0', 0.55);
      o += L('M6,58 C12,50 6,42 14,34 M52,60 C48,52 56,46 50,38 M30,62 C26,56 32,52 28,46', '#1a1024', 6, 0.75) + L('M6,58 C12,50 6,42 14,34 M52,60 C48,52 56,46 50,38 M30,62 C26,56 32,52 28,46', '#9a7ac0', 1.4, 0.75);
      // the note wilts like a flower: its stem bends over, the flag hangs down
      var sd = 'M25,44 C24,26 32,14 44,14 C48,14 50,17 50,21';
      o += L(sd, OL, 5) + L(sd, '#b8a4d8', 2.2);
      o += P('M50,21 C47,24 47,30 50,34 C51,30 53,27 56,26 C53,25 51,23 50,21 Z', c.cel('#a890cc'), 1.4);
      o += G(noteHead(c, 0, 0, 1.4, '#a890cc'), 'translate(21.4,45.4) rotate(18)');
      o += G(P(leafD(0.95), c.lg([[0, '#b09a5a'], [1, '#5a4626']], 0, 0, 1, 0), 1.3) + L('M0,-1 L0,-8.6', '#3a2a18', 0.7), 'translate(42,46) rotate(160)');
      o += C(34, 26, 1.4, '#e8d8ff', 0, 0.7) + C(12, 20, 1, '#e8d8ff', 0, 0.6);
      return iconWrap(c, ['#7c6a92', '#0c0812'], o + sparkle(54, 10, 2.2, '#e8d8ff', 0.9));
    },
    // party armour and Stamina: a standing stone with a carved glowing note, moss at its foot
    anthem_of_stone: function (c) {
      var o = iglow(c, 32, 30, 30, '#fff0c0', 0.5);
      var st = 'M18,56 C16,40 17,22 22,12 C26,6 38,6 42,12 C47,22 48,40 46,56 Z';
      o += P(st, c.lg([[0, '#d0c8b8'], [0.45, '#a8a090'], [1, '#6a6458']], 0.2, 0, 0.8, 1), 2.4);
      o += CG(F('M36,6 L50,6 L50,58 L40,58 Z', '#000000', 0.2) + L('M24,20 L28,26 L26,32 M40,40 L36,46', '#5a5448', 1, 0.8), c.clip(st));
      o += iglow(c, 32, 32, 12, '#ffd870', 0.8) + note(c, 29, 40, 0.95, '#ffd460');
      o += F('M14,58 C18,52 24,54 26,50 C30,54 36,52 40,55 C44,51 48,53 50,58 Z', '#5a9a38') + tuft(20, 58, 1, '#8ac858') + tuft(44, 58, 1.1, '#8ac858');
      o += ol('M6,26 Q2,32 6,38 M58,26 Q62,32 58,38', '#fff0c8', 1.2, 0.8);
      return iconWrap(c, ['#aaa290', '#181410'], o + sparkle(50, 10, 2.6, '#ffffff'));
    },
    // a strong party heal over time: a leafy wreath turning back on itself like a repeat, flowers, a beamed pair
    encore: function (c) {
      var o = iglow(c, 32, 32, 30, '#ffe0f0', 0.7);
      var arc = 'M50,22 A20,20 0 1 0 52,40';
      o += L(arc, OL, 7) + L(arc, '#4e9a34', 4) + P('M44,16 L56,18 L52,28 Z', c.cel('#4e9a34'), 1.6);
      [[14, 26, -60], [20, 50, -150], [40, 52, 150], [30, 12, 10]].forEach(function (q) { o += leaf(c, q[0], q[1], q[2], 0.6, '#8ad05a'); });
      [[14, 40], [48, 44], [22, 14]].forEach(function (p) {
        var f = '';
        for (var i = 0; i < 5; i++) { var a = i / 5 * PI * 2; f += C(p[0] + Math.cos(a) * 2.6, p[1] + Math.sin(a) * 2.6, 2.3, c.cel('#ff9ac8'), 1.1); }
        o += f + C(p[0], p[1], 1.5, '#ffe070', 0.8);
      });
      o += notePair(c, 24, 40, 0.85, '#ffffff');
      return iconWrap(c, ['#ec74aa', '#2a0616'], o + sparkle(56, 8, 2.6, '#ffffff'));
    },
    // arcane damage to all nearby: rings of sound spreading from a dark note
    requiem: function (c) {
      var o = iglow(c, 32, 34, 32, '#c8c8ff', 0.6);
      [[28, 0.35, 1.4], [21, 0.55, 1.8], [14, 0.8, 2.2]].forEach(function (q) { o += ring(32, 34, q[0], '#e0e0ff', q[2], q[1]); });
      o += C(32, 34, 8, glow(c, '#ffffff', 0.7));
      o += note(c, 29, 42, 0.95, '#6a70b0');
      [[8, 18], [54, 16], [56, 50], [10, 52]].forEach(function (p) { o += noteHead(c, p[0], p[1], 0.5, '#e8e8ff'); });
      return iconWrap(c, ['#5a6ad8', '#04061c'], o + sparkle(32, 6, 2.6, '#ffffff') + sparkle(60, 34, 2, '#ffffff'));
    },
    // the great party heal: the lute swung up in a starburst, leaves and notes flying
    grand_finale: function (c) {
      var o = iglow(c, 32, 30, 34, '#ffffff', 0.9) + rays(32, 30, 10, 32, 16, '#fff8d0', 0.55, 0.1);
      o += G(lute(c, 44), 'translate(28,40) rotate(38) scale(0.62)');
      o += note(c, 8, 20, 0.55, '#ffffff') + note(c, 50, 58, 0.5, '#ffffff') + leaf(c, 54, 14, 40, 0.55, '#8ad05a') + leaf(c, 10, 50, -130, 0.5, '#a8e068') + leaf(c, 46, 30, 90, 0.45, '#6ab846');
      return iconWrap(c, ['#fff0a0', '#3a2006'], o + sparkle(46, 8, 3.4, '#ffffff') + sparkle(14, 34, 2.6, '#ffffff') + sparkle(56, 44, 2.4, '#ffffff'));
    },
    // quest item: a bundle of lake reeds with cattail heads, tied with twine, over water
    lake_reed: function (c) {
      var o = E(32, 54, 22, 4, '#bfe8f0', 0, 0.35) + L('M12,54 Q32,50 52,54', '#e8faff', 1, 0.6);
      [[-6, 26, -8], [0, 30, 0], [6, 25, 8]].forEach(function (q) {
        var bx = 32 + q[0] * 0.4, tx = 32 + q[0] * 2.4 + q[2] * 0.6, ty = 10 + (30 - q[1]) * 0.3;
        o += ol('M' + n(bx) + ',56 Q' + n(bx + q[2] * 0.2) + ',36 ' + n(tx) + ',' + n(ty), '#7ab048', 1.8);
        o += G(P('M-2.6,0 C-2.8,-5 -2.4,-9 0,-10 C2.4,-9 2.8,-5 2.6,0 C2.4,2 -2.4,2 -2.6,0 Z', c.cel('#8a5a30'), 1.4), 'translate(' + n(tx + (bx - tx) * 0.18) + ',' + n(ty + 12) + ') rotate(' + n(q[2] * 1.5) + ')');
      });
      o += ol('M20,56 Q16,40 10,26', '#9ad060', 1.4) + ol('M44,56 Q50,42 56,30', '#9ad060', 1.4);
      o += ol('M26,42 Q32,45 38,42', '#d8b878', 1.6) + L('M28,43.6 L26,48 M36,43.6 L38,48', '#c8a060', 1, 0.9);
      return iconWrap(c, ['#5e9aa4', '#081a1e'], o + sparkle(50, 12, 2.4, '#ffffff'));
    },
    // quest item: a coil of silver lute strings, the ends trailing
    silver_lute_strings: function (c) {
      var o = iglow(c, 30, 30, 24, '#e8f0ff', 0.45) + E(32, 52, 18, 3.4, '#000', 0, 0.3);
      [[16, 11], [13.4, 9.2], [10.8, 7.4], [8.2, 5.6]].forEach(function (q, i) { o += G(ring(0, 0, q[0], OL, 3.2) + ring(0, 0, q[0], i % 2 ? '#c8d0dc' : '#f4f8ff', 1.3), 'translate(30,32) scale(1,' + n(q[1] / q[0]) + ') rotate(0)'); });
      o += ol('M44,34 C50,40 52,48 58,50', '#e8eef8', 1.2) + ol('M42,38 C46,46 50,52 54,58', '#c8d0dc', 1.1);
      o += L('M16,28 A16,11 0 0 1 30,21', '#ffffff', 1.6, 0.9);
      return iconWrap(c, ['#8894ac', '#0c1016'], o + sparkle(20, 16, 3, '#ffffff') + sparkle(48, 24, 2.2, '#ffffff'));
    },
    // quest item: three heartwood tuning pegs, fanned out
    heartwood_pegs: function (c) {
      var o = iglow(c, 32, 30, 24, '#ffd8b0', 0.4) + E(32, 54, 18, 3.4, '#000', 0, 0.3);
      // a tuning peg: a flat heart-shaped thumb grip, a collar, a tapered shaft with a string hole
      function peg(x, y, a) {
        return G(G(P('M-1.8,0 L-1,22 L1,22 L1.8,0 Z', c.lg([[0, '#d08a56'], [1, '#7a3a1a']], 0, 0, 1, 0), 1.6) + C(0, 16, 0.8, '#2a140a') +
          P('M-2.8,-1 L2.8,-1 L2.8,2.4 L-2.8,2.4 Z', c.cel('#e8c890'), 1.2) +
          P('M0,-1 C-3,-1.4 -7.6,-3 -7.6,-8.4 C-7.6,-12.6 -4,-14 -2,-12 L0,-10.4 L2,-12 C4,-14 7.6,-12.6 7.6,-8.4 C7.6,-3 3,-1.4 0,-1 Z', c.lg([[0, '#f0a468'], [0.45, '#b8582e'], [1, '#6a2810']], 0.2, 0, 0.8, 1), 1.9) +
          L('M-4.6,-7.4 C-3.6,-4.6 -1.6,-3.4 0,-3.2 M4.6,-7.4 C3.6,-4.6 1.6,-3.4 0,-3.2', '#f4c890', 0.8, 0.8), 'scale(0.9)'), 'translate(' + n(x) + ',' + n(y) + ') rotate(' + a + ')');
      }
      // three pegs side by side along the diagonal, centred on the icon
      o += peg(27.7, 23.1, 40) + peg(34.6, 28.9, 40) + peg(41.5, 34.7, 40);
      return iconWrap(c, ['#a86a44', '#1c0c06'], o + sparkle(50, 10, 2.4, '#ffffff'));
    },
    // quest item: the carved neck and bent-back pegbox, names cut down its side
    carved_lute_neck: function (c) {
      var o = iglow(c, 32, 30, 26, '#ffe8c0', 0.4);
      var ln = luteNeck(c, 30) + P('M-3.4,-10 L-3.3,-14 L3.3,-14 L3.4,-10 L1.4,-8.4 L0,-10.6 L-1.6,-8.2 Z', c.cel(LU.neck), 1.6);
      for (var y = -16.4; y > -29; y -= 3) ln += L('M3.6,' + n(y) + ' L5,' + n(y - 1) + ' M3.6,' + n(y - 1.4) + ' L4.6,' + n(y - 1.6), LU.carve, 0.8, 0.9);
      o += G(ln, 'translate(10.3,57.9) rotate(40) scale(1.35)');
      return iconWrap(c, ['#c09460', '#1e1408'], o + sparkle(52, 12, 2.6, '#ffffff'));
    },
    // quest item: the lute's body, the neck broken away at the top
    lute_body: function (c) {
      var o = iglow(c, 32, 32, 26, '#ffe0b0', 0.4) + E(32, 57, 17, 3, '#000', 0, 0.3);
      o += G(P('M-3.3,-14 L-3,-20 L-1.2,-18.4 L0.4,-21 L1.6,-18.6 L3,-20.4 L3.3,-14 Z', c.cel(LU.neck), 1.8) + luteBody(c) + R(-2.9, -15.4, 5.8, 1.4, LU.board, 0.8), 'translate(32,33) rotate(14) scale(1.3)');
      return iconWrap(c, ['#c08a4c', '#1e0e06'], o + sparkle(50, 12, 2.6, '#ffffff'));
    },
    // the keepsake: Reedsong's lute whole again, a soft glow and a leaf
    reedsong_lute: function (c) {
      var o = iglow(c, 32, 32, 30, '#f4ffd8', 0.6);
      o += G(lute(c, 44), 'translate(27,41) rotate(40) scale(0.72)');
      o += leaf(c, 50, 50, 130, 0.55, '#8ad05a') + leaf(c, 12, 16, -40, 0.5, '#a8e068');
      return iconWrap(c, ['#78ac6c', '#0c1a0a'], o + sparkle(48, 10, 3, '#ffffff') + sparkle(12, 40, 2.2, '#ffffff'));
    },
    // the Bard's Drum (#261): a laced hand drum, wooden goblet body, pale hide, a beat ringing off it
    bard_drum: function (c) {
      var o = iglow(c, 32, 30, 30, '#ffe0b0', 0.6) + E(32, 58, 14, 2.6, '#000', 0, 0.3);
      var body = 'M14,22 L50,22 C50,32 42,36 38,42 L40,57 L24,57 L26,42 C22,36 14,32 14,22 Z';
      o += P(body, c.lg([[0, '#d08848'], [0.55, '#9a5426'], [1, '#5a2c10']], 0, 0, 1, 0), 2.2);
      o += CG(ol('M16,24 L24,40 L32,24 L40,40 L48,24', '#f0dcb0', 1.1) + F('M38,20 L52,20 L52,60 L40,60 Z', '#000000', 0.18), c.clip(body));
      o += P('M23,52 L41,52 L41,55 L23,55 Z', c.cel('#e8c060'), 1.4);
      o += E(32, 22, 18, 5.6, c.lg([[0, '#fff8e8'], [1, '#d8c49a']]), 2.2) + E(32, 22, 11, 3.2, '#ffffff', 0, 0.35);
      o += ol('M8,12 Q4,18 8,24 M56,12 Q60,18 56,24', '#fff0c8', 1.4, 0.85) + ol('M12,6 Q6,14 12,22', '#fff0c8', 1, 0.5);
      return iconWrap(c, ['#c08a4c', '#1e0e06'], o + sparkle(52, 8, 2.4, '#ffffff'));
    },
    // the Bard's Horn (#261): a curled war horn banded in brass, its call spreading from the bell
    bard_horn: function (c) {
      var o = iglow(c, 30, 34, 30, '#fff0c8', 0.55), h = '';
      var horn = 'M10,48 C10,30 24,18 40,16 L46,8 C52,14 54,20 52,26 L44,24 C30,26 20,34 18,48 Z';
      h += P(horn, c.lg([[0, '#fff4dc'], [0.5, '#e0c898'], [1, '#9a7a4a']], 0, 0, 1, 1), 2.2);
      h += CG(F('M10,40 L22,40 L22,52 L10,52 Z', '#5a3a1a', 0.35) + L('M16,30 L24,36 M26,22 L32,28', '#b0905a', 1, 0.7), c.clip(horn));
      h += P('M15.6,37 L24.4,40.6 L22.6,44 L13.8,41 Z', c.cel('#e8b848'), 1.3) + P('M32,19.4 L36.2,25.4 L32.6,26.8 L28.6,21 Z', c.cel('#e8b848'), 1.3);
      h += E(49, 17, 4.6, 9.8, '#3a2410', 1.8) + E(49, 17, 2.6, 6.6, '#1a0e04');
      o += G(h, 'translate(1,9) scale(0.84)') + ol('M50,8 Q55,17 50,27 M54,4 Q61,17 54,31', '#fff0c8', 1.4, 0.8);
      return iconWrap(c, ['#8a9a6c', '#10140a'], o + sparkle(12, 12, 2.4, '#ffffff'));
    }
  };
  Object.keys(WICONS).forEach(function (k) { ICONS[k] = WICONS[k]; });

  // =====================================================================
  // INSTALL: extend ART.legend / ART.mob / ART.scene / ART.icon / ART.story
  // =====================================================================
  function has(t, k) { return typeof k === 'string' && Object.prototype.hasOwnProperty.call(t, k); }
  function blank(w, h, col) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">' + (col ? '<rect width="' + w + '" height="' + h + '" fill="' + col + '"/>' : '') + '</svg>'; }
  function phFig(c) { return shadow(c, 64, 26) + P('M44,122 C42,96 46,70 64,62 C82,70 86,96 84,122 Z', '#8a8a92', 2.5, 0.8) + C(64, 50, 14, '#9a9aa2', 2.5, 0.8); }
  function phScene(c) { return R(0, 0, 400, 240, c.lg([[0, '#6a5a70'], [1, '#d89a78']])) + R(0, 132, 400, 108, '#4a3e32'); }
  function phIcon(c) { return iconWrap(c, ['#5a5a62', '#1a1a1e'], C(32, 32, 12, '#8a8a92', 2)); }
  function phActor(c) { return E(80, 155, 36, 5, c.rg([[0, '#000', 0.45], [1, '#000', 0]])) + P('M58,154 C58,110 64,70 80,70 C96,70 102,110 102,154 Z', c.cel('#7a7a84'), 2) + E(80, 50, 16, 17, c.cel('#8a8a94'), 2); }
  function make(fn, w, h, ph, bg) {
    var keep = SWM;
    try { var c = new Ctx(); var out = c.svg(w, h, fn(c)); SWM = keep; return out; } catch (e) {
      SWM = keep;
      try { var c2 = new Ctx(); return c2.svg(w, h, ph(c2)); } catch (e2) { return blank(w, h, bg); }
    }
  }
  function callBase(base, self, args, fn, w, h, ph, bg) {
    try { if (typeof base === 'function') { var s = base.apply(self, args); if (typeof s === 'string' && s) return s; } } catch (e) { }
    return make(fn || ph, w, h, ph, bg);
  }
  function addKeys(list, keys) { var a = Array.isArray(list) ? list : []; keys.forEach(function (k) { if (a.indexOf(k) < 0) a.push(k); }); return a; }

  var LEGENDS = { lyveus: lyveusSprite, lyveus_hooded: lyveusHoodedSprite, widya: widyaSprite, harrowby: harrowbySprite };
  var MOBS = { lord_cassius_marrow: cassiusMob, sal_brightbell: salMob };
  var SCENES = { silverleaf_lodge: lodgeScene };
  var ACTORS = { lyveus: lyveusActor, vyn: vynActor, lyveus_hooded: lyveusHoodedActor, deathwing: deathwing, widya: widyaActor, harrowby: harrowbyActor };
  var STORY_SCENES = { silverleaf_burning: burningScene, caravan_road: caravanScene };
  var KEYS = ART.keys;
  try { if (!KEYS || typeof KEYS !== 'object') { KEYS = {}; ART.keys = KEYS; } } catch (e) { KEYS = {}; }
  function keyList(name, keys) {
    try { KEYS[name] = addKeys(KEYS[name], keys); if (KEYS[name].indexOf(keys[0]) < 0) throw new Error('read-only'); } catch (e) { try { KEYS[name] = addKeys(Array.isArray(KEYS[name]) ? KEYS[name].slice() : [], keys); } catch (e2) { } }
  }

  // ---- legend sprites ----
  try {
    var legend = function (key) {
      if (has(LEGENDS, key)) return make(LEGENDS[key], 128, 128, phFig);
      try { var A = W.ART || ART; if (A && typeof A.hero === 'function') { var s = A.hero({ cls: 'paladin', race: 'human' }); if (typeof s === 'string' && s) return s; } } catch (e) { }
      return make(phFig, 128, 128, phFig);
    };
    legend.keys = Object.keys(LEGENDS);
    ART.legend = legend;
  } catch (e) { }

  // ---- mobs, scenes, icons ----
  try {
    var baseMob = ART.mob;
    ART.mob = function (k) { return has(MOBS, k) ? make(MOBS[k], 128, 128, phFig) : callBase(baseMob, this, arguments, null, 128, 128, phFig); };
    keyList('mobs', Object.keys(MOBS));
  } catch (e) { }
  try {
    var baseScene = ART.scene;
    ART.scene = function (k) { return has(SCENES, k) ? make(SCENES[k], 400, 240, phScene, '#5a4a40') : callBase(baseScene, this, arguments, null, 400, 240, phScene, '#5a4a40'); };
    keyList('scenes', Object.keys(SCENES));
  } catch (e) { }
  try {
    var baseIcon = ART.icon;
    ART.icon = function (k) { return has(ICONS, k) ? make(ICONS[k], 64, 64, phIcon, '#444') : callBase(baseIcon, this, arguments, null, 64, 64, phIcon, '#444'); };
    keyList('icons', Object.keys(ICONS));
  } catch (e) { }

  // ---- story actors (the art_story2.js wrapping, extended in place when it can be) ----
  try {
    var prev = (ART.story && (typeof ART.story === 'object' || typeof ART.story === 'function')) ? ART.story : {};
    var bScene = typeof prev.scene === 'function' ? prev.scene : null;
    var bActor = typeof prev.actor === 'function' ? prev.actor : null;
    var phStory = function (c) { return R(0, 0, 480, 270, c.lg([[0, '#5a5a62'], [1, '#2e2e34']])); };
    var sceneFn = function (key) { return has(STORY_SCENES, key) ? make(STORY_SCENES[key], 480, 270, phStory, '#444') : callBase(bScene, this, arguments, null, 480, 270, phStory, '#444'); };
    var actorFn = function (key) { return has(ACTORS, key) ? make(ACTORS[key], 160, 160, phActor) : callBase(bActor, this, arguments, null, 160, 160, phActor); };
    try {
      var K0 = (prev.keys && typeof prev.keys === 'object') ? prev.keys : {};
      K0.scenes = addKeys(K0.scenes, Object.keys(STORY_SCENES));
      K0.actors = addKeys(K0.actors, Object.keys(ACTORS));
      prev.keys = K0; prev.scene = sceneFn; prev.actor = actorFn;
      if (prev.scene !== sceneFn || prev.actor !== actorFn || prev.keys !== K0 || K0.actors.indexOf('vyn') < 0) throw new Error('read-only');
      ART.story = prev;
    } catch (e) {
      var pk = (prev.keys && typeof prev.keys === 'object') ? prev.keys : {};
      ART.story = { scene: sceneFn, actor: actorFn, keys: { scenes: addKeys(Array.isArray(pk.scenes) ? pk.scenes.slice() : [], Object.keys(STORY_SCENES)), actors: addKeys(Array.isArray(pk.actors) ? pk.actors.slice() : [], Object.keys(ACTORS)) } };
    }
  } catch (e) { }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
