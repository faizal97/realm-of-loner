/* art_mounts.js - riding mounts for Realm of Loner (the eight racial mounts, the Trialsworn charger, the riding skill icon).
 * Loads AFTER art.js and the other packs and EXTENDS window.ART:
 *   ART.mount(key)  NEW: a 160x128 SVG, transparent background, side view facing RIGHT, standing, saddled and
 *                   bridled, no rider. The game draws the hero FIRST and the mount on top, so the mount's body is
 *                   opaque from the saddle (seat top ~y60) down to ~y96 and hides the hero's legs. Unknown keys
 *                   return a neutral placeholder. Never throws. Keys in ART.keys.mounts.
 *                   Rider placement used by the art/mounts contact sheet: hero SVG (128x128) drawn at x=33.6,
 *                   y=12.8 in mount units, scale 0.6 (so the hero's hips, hero y82, land on the seat at 72,62).
 *   ART.icon(key)   handles mount_<key>, riding and trialsworn_hourglass (the Trials rewards emblem), falls through to the previous ART.icon for every other key.
 *                   Keys appended to ART.keys.icons. 64x64 item-style icons like art_icons5.js.
 * Self-contained: helpers are copies of art_stranglethorn.js / art_icons5.js (same maths, same look).
 * Style: bold dark outlines (#1a1009), 2-3 tone cel shading, flat shadows, no text, no filters, no images.
 * Gradient ids use the prefix mt<counter>_ so they never collide.
 */
(function (root) {
  'use strict';
  var W = root || {};
  var ART = W.ART = W.ART || {};
  var OL = '#1a1009';
  var SEQ = 0;
  var PI = Math.PI;

  /* ================= colour + number helpers ================= */
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
  function rng(seed) { var s = seed >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  /* ================= per-call context (unique ids, defs) ================= */
  function Ctx() { this.p = 'mt' + (SEQ++).toString(36) + '_'; this.k = 0; this.defs = []; this.cache = {}; }
  Ctx.prototype.id = function () { return this.p + (this.k++).toString(36); };
  function stopsS(st) {
    return st.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '/>'; }).join('');
  }
  Ctx.prototype.cel = function (c) {
    var key = 'c' + c; if (this.cache[key]) return this.cache[key];
    var id = this.id();
    this.defs.push('<linearGradient id="' + id + '" x1="0.2" y1="0" x2="0.8" y2="1"><stop offset="0" stop-color="' + lt(c, 0.3) + '"/><stop offset="0.4" stop-color="' + c + '"/><stop offset="0.72" stop-color="' + c + '"/><stop offset="1" stop-color="' + dk(c, 0.38) + '"/></linearGradient>');
    return (this.cache[key] = 'url(#' + id + ')');
  };
  Ctx.prototype.lg = function (stops, x1, y1, x2, y2) {
    var id = this.id();
    this.defs.push('<linearGradient id="' + id + '" x1="' + (x1 == null ? 0 : x1) + '" y1="' + (y1 == null ? 0 : y1) + '" x2="' + (x2 == null ? 0 : x2) + '" y2="' + (y2 == null ? 1 : y2) + '">' + stopsS(stops) + '</linearGradient>');
    return 'url(#' + id + ')';
  };
  Ctx.prototype.rg = function (stops, cx, cy, r) {
    var id = this.id();
    this.defs.push('<radialGradient id="' + id + '" cx="' + (cx == null ? 0.5 : cx) + '" cy="' + (cy == null ? 0.5 : cy) + '" r="' + (r == null ? 0.5 : r) + '">' + stopsS(stops) + '</radialGradient>');
    return 'url(#' + id + ')';
  };
  Ctx.prototype.clip = function (d) { var id = this.id(); this.defs.push('<clipPath id="' + id + '"><path d="' + d + '"/></clipPath>'); return id; };
  Ctx.prototype.svg = function (w, h, b) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">' +
      (this.defs.length ? '<defs>' + this.defs.join('') + '</defs>' : '') + b + '</svg>';
  };
  function glow(c, col, a) { return c.rg([[0, col, a == null ? 0.6 : a], [0.35, col, (a == null ? 0.6 : a) * 0.4], [1, col, 0]]); }

  /* ================= primitives ================= */
  function P(d, fill, sw) { return '<path d="' + d + '" fill="' + fill + '"' + (sw ? ' stroke="' + OL + '" stroke-width="' + n(sw) + '" stroke-linejoin="round" stroke-linecap="round"' : '') + '/>'; }
  function F(d, fill, op) { return '<path d="' + d + '" fill="' + fill + '"' + (op != null && op < 1 ? ' opacity="' + op + '"' : '') + '/>'; }
  function L(d, col, w, op) { return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + n(w) + '" stroke-linecap="round" stroke-linejoin="round"' + (op != null && op < 1 ? ' opacity="' + op + '"' : '') + '/>'; }
  function E(cx, cy, rx, ry, fill, sw, op) { return '<ellipse cx="' + n(cx) + '" cy="' + n(cy) + '" rx="' + n(rx) + '" ry="' + n(ry) + '" fill="' + fill + '"' + (sw ? ' stroke="' + OL + '" stroke-width="' + n(sw) + '"' : '') + (op != null && op < 1 ? ' opacity="' + op + '"' : '') + '/>'; }
  function C(cx, cy, r, fill, sw, op) { return E(cx, cy, r, r, fill, sw, op); }
  function R(x, y, w, h, fill, sw, rx) { return '<rect x="' + n(x) + '" y="' + n(y) + '" width="' + n(w) + '" height="' + n(h) + '"' + (rx ? ' rx="' + rx + '"' : '') + ' fill="' + fill + '"' + (sw ? ' stroke="' + OL + '" stroke-width="' + n(sw) + '" stroke-linejoin="round"' : '') + '/>'; }
  function G(s, tf, op) { return '<g' + (tf ? ' transform="' + tf + '"' : '') + (op != null && op < 1 ? ' opacity="' + op + '"' : '') + '>' + s + '</g>'; }
  function at(k, x, y) { return 'matrix(' + k + ',0,0,' + k + ',' + n(x - x * k) + ',' + n(y - y * k) + ')'; }
  function limb(d, col, w) { return L(d, OL, w + 4.5) + L(d, col, w); }
  function body(c, d, col, shade, sw) {
    var s = P(d, c.cel(col), sw == null ? 2.5 : sw);
    if (shade) s += '<g clip-path="url(#' + c.clip(d) + ')">' + shade + '</g>';
    return s;
  }
  function shadow(c, cx, rx) { return E(cx, 122, rx, 6.5, c.rg([[0, '#000', 0.42], [0.65, '#000', 0.24], [1, '#000', 0]])); }
  function ellD(x, y, rx, ry) { return 'M' + pt([x - rx, y]) + 'A' + n(rx) + ',' + n(ry) + ' 0 1,0 ' + pt([x + rx, y]) + 'A' + n(rx) + ',' + n(ry) + ' 0 1,0 ' + pt([x - rx, y]) + 'Z'; }
  function glowEye(c, x, y, r, col) { return C(x, y, r * 3.4, glow(c, col, 0.8)) + C(x, y, r, col) + C(x - r * 0.3, y - r * 0.3, r * 0.35, '#ffffff', 0, 0.9); }
  // shaggy blob outline: points alternate between an outer and an inner ellipse, joined by soft curves
  function shag(cx, cy, rx, ry, k, jag, seed, a0) {
    var r = rng(seed || 7), d = '', pts = [];
    a0 = a0 || 0;
    for (var i = 0; i < k * 2; i++) {
      var a = a0 + PI * 2 * i / (k * 2), f = i % 2 ? 1 - jag * (0.7 + r() * 0.5) : 1 + jag * r() * 0.3;
      pts.push([cx + Math.cos(a) * rx * f, cy + Math.sin(a) * ry * f]);
    }
    d = 'M' + pt(pts[0]);
    for (var j = 1; j <= pts.length; j++) { var p = pts[j % pts.length], q = pts[j - 1]; d += 'Q' + pt([(p[0] + q[0]) / 2 + (r() - 0.5) * 2, (p[1] + q[1]) / 2 + (r() - 0.5) * 2]) + ' ' + pt(p); }
    return d + 'Z';
  }
  function lerp2(p, q, t) { return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]; }
  // Catmull-Rom sampling through control points
  function spline(pts, k) {
    var out = [], i, j; k = k || 6;
    for (i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || pts[i + 1];
      for (j = 0; j < k; j++) {
        var t = j / k, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map(function (a) { return 0.5 * (2 * p1[a] + (-p0[a] + p2[a]) * t + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * t2 + (-p0[a] + 3 * p1[a] - 3 * p2[a] + p3[a]) * t3); }));
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }
  // tapered ribbon along a smooth curve; side a is the right of the travel direction on screen, side b the left
  function taper(pts, w0, w1, k) {
    var s = spline(pts, k), A = [], B = [], m = s.length;
    for (var i = 0; i < m; i++) {
      var a = s[Math.max(0, i - 1)], b = s[Math.min(m - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.sqrt(dx * dx + dy * dy) || 1, t = i / (m - 1), w = (w0 + (w1 - w0) * t) / 2;
      A.push([s[i][0] - dy / d * w, s[i][1] + dx / d * w]); B.push([s[i][0] + dy / d * w, s[i][1] - dx / d * w]);
    }
    return { d: pd(A.concat(B.slice().reverse()), true), a: A, b: B, s: s };
  }
  function bands(T, every, from) { var d = ''; for (var i = from || 2; i < T.s.length - 1; i += every) d += 'M' + pt(T.a[i]) + 'L' + pt(T.b[i]); return d; }
  function along(T, f, i0, i1) { var p = []; for (var i = i0 || 0; i < (i1 || T.s.length); i++) p.push(lerp2(T.a[i], T.b[i], f)); return 'M' + p.map(pt).join('L'); }
  function ribbonBand(T, f0, f1) { var P0 = [], P1 = []; for (var i = 0; i < T.s.length; i++) { P0.push(lerp2(T.a[i], T.b[i], f0)); P1.push(lerp2(T.a[i], T.b[i], f1)); } return pd(P0.concat(P1.reverse()), true); }
  function tipD(T, from) { var A = T.a.slice(from), B = T.b.slice(from).reverse(); return pd(A.concat(B), true); }
  function dirQ(p, ang) { var ca = Math.cos(ang), sa = Math.sin(ang), px = -sa, py = ca; return function (u, v) { return [p[0] + ca * u + px * v, p[1] + sa * u + py * v]; }; }
  function wedge(x, y, len, ang, w) { var q = dirQ([x, y], ang); return pd([q(0, -w / 2), q(len * 0.5, -w * 0.36), q(len, 0), q(len * 0.5, w * 0.36), q(0, w / 2)], true); }
  // a jagged fringe (mane, ruff, hair) growing outward from side b of a ribbon, between samples i0 and i1
  function fringe(T, i0, i1, len, side) {
    var pts = [], out = [], i, S = side === 'a' ? T.a : T.b, O = side === 'a' ? T.b : T.a;
    i1 = Math.min(i1, S.length - 1);
    for (i = i0; i <= i1; i++) {
      var dx = S[i][0] - O[i][0], dy = S[i][1] - O[i][1], d = Math.sqrt(dx * dx + dy * dy) || 1, k = (i - i0) % 2 ? 0.35 : 1;
      pts.push(lerp2(S[i], O[i], 0.12));
      out.push([S[i][0] + dx / d * len * k, S[i][1] + dy / d * len * k]);
    }
    return pd(pts.concat(out.reverse()), true);
  }

  /* ================= mount pieces ================= */
  // a jointed leg as round-capped strokes: segs = [[x0,y0], [x1,y1, w], [x2,y2, w] ...]; one outline pass, one fill pass
  function leg(segs, col, hl) {
    var o = '', f = '', h = '', i;
    for (i = 1; i < segs.length; i++) {
      var a = segs[i - 1], b = segs[i], d = 'M' + pt(a) + 'L' + pt(b), w = b[2];
      o += L(d, OL, w + 4.4); f += L(d, col, w);
      if (hl !== false) h += L('M' + pt([a[0] - w * 0.22, a[1]]) + 'L' + pt([b[0] - w * 0.22, b[1]]), lt(col, 0.22), w * 0.28, 0.7) + L('M' + pt([a[0] + w * 0.26, a[1]]) + 'L' + pt([b[0] + w * 0.26, b[1]]), dk(col, 0.22), w * 0.3, 0.7);
    }
    return o + f + h;
  }
  function hoof(x, y, w, col) {
    return P('M' + pt([x - w / 2, y - 5]) + 'L' + pt([x + w / 2, y - 5]) + 'L' + pt([x + w / 2 + 2.6, y + 1]) + 'L' + pt([x - w / 2 - 0.6, y + 1]) + 'Z', col || '#3a2a1e', 1.8) +
      L('M' + pt([x - w / 2 + 1, y - 3.6]) + 'L' + pt([x + w / 2 + 0.2, y - 3.6]), lt(col || '#3a2a1e', 0.25), 1, 0.8);
  }
  function splitHoof(x, y, w, col) { return hoof(x, y, w, col) + L('M' + pt([x + 1.4, y - 4]) + 'L' + pt([x + 2.4, y + 1]), OL, 1.2); }
  // cat / wolf paw facing right
  function paw(x, y, col, big) {
    var k = big || 1;
    return P('M' + pt([x - 5 * k, y - 5 * k]) + 'C' + pt([x - 7 * k, y]) + ' ' + pt([x - 5 * k, y + 1.5]) + ' ' + pt([x - 1 * k, y + 1.5]) + 'L' + pt([x + 7 * k, y + 1.5]) + 'C' + pt([x + 10 * k, y + 1.5]) + ' ' + pt([x + 10 * k, y - 3 * k]) + ' ' + pt([x + 5 * k, y - 4.5 * k]) + 'Z', col, 2) +
      L('M' + pt([x + 3 * k, y - 1]) + 'l0,2.5 M' + pt([x + 6 * k, y - 1]) + 'l0,2.5', OL, 1);
  }
  function claws(x, y, col) { var d = 'M' + pt([x + 8, y]) + 'l3,1 M' + pt([x + 5, y + 1]) + 'l3,0.8'; return L(d, OL, 2.6) + L(d, col || '#efe6cf', 1.2); }
  // bird / raptor / strider foot facing right: three toes forward, a spur back
  function birdFoot(x, y, col, talon) {
    var d = 'M' + pt([x, y - 4]) + 'L' + pt([x + 14, y + 0.5]) + 'M' + pt([x, y - 4]) + 'L' + pt([x + 9, y + 1]) + 'M' + pt([x, y - 4]) + 'L' + pt([x - 7, y]);
    var o = L(d, OL, 7.5) + L(d, col, 3.8);
    if (talon) o += P('M' + pt([x + 14, y - 2]) + 'L' + pt([x + 19, y + 1]) + 'L' + pt([x + 13, y + 1.5]) + 'Z', talon, 1) + P('M' + pt([x + 9, y - 1.4]) + 'L' + pt([x + 13.4, y + 1.4]) + 'L' + pt([x + 8, y + 1.8]) + 'Z', talon, 1);
    return o;
  }
  function stud(x, y, r, col) { return C(x, y, r, col, 1) + C(x - r * 0.3, y - r * 0.3, r * 0.35, '#ffffff', 0, 0.7); }
  function studRow(p0, p1, cnt, r, col) { var o = ''; for (var i = 0; i < cnt; i++) { var p = lerp2(p0, p1, cnt < 2 ? 0.5 : i / (cnt - 1)); o += stud(p[0], p[1], r, col); } return o; }
  function spikes(pts, h, col) {
    var o = '';
    pts.forEach(function (p) { var q = dirQ(p, p[2] == null ? -PI / 2 : p[2]); o += P(pd([q(0, -2.6), q(h, 0), q(0, 2.6)], true), col, 1.3); });
    return o;
  }
  // the seat. o: x (seat centre, default 72), y (seat top, default 60), leather, blanket, trim, metal, blanketD, emblem, noStirrup, cantle, pommel
  function saddle(c, o) {
    var x = o.x || 72, y = o.y || 60, lea = o.leather || '#6a4222', met = o.metal || '#c8ccd2', s = '';
    var q = function (u, v) { return [x + u, y + v]; };
    if (o.blanket) {
      var bd = o.blanketD || ('M' + pt(q(-22, -3)) + 'L' + pt(q(22, -4)) + 'C' + pt(q(24, 8)) + ' ' + pt(q(24, 18)) + ' ' + pt(q(22, 28)) + 'C' + pt(q(8, 33)) + ' ' + pt(q(-8, 33)) + ' ' + pt(q(-22, 28)) + 'C' + pt(q(-24, 18)) + ' ' + pt(q(-24, 8)) + ' ' + pt(q(-22, -3)) + 'Z');
      var trimD = o.trimD || ('M' + pt(q(-21.5, 25)) + 'C' + pt(q(-8, 30)) + ' ' + pt(q(8, 30)) + ' ' + pt(q(21.5, 25)));
      s += body(c, bd, o.blanket, F('M' + pt(q(6, -8)) + 'L' + pt(q(30, -8)) + 'L' + pt(q(30, 36)) + 'L' + pt(q(8, 36)) + 'C' + pt(q(16, 20)) + ' ' + pt(q(14, 6)) + ' ' + pt(q(6, -8)) + 'Z', dk(o.blanket, 0.28), 0.6) +
        (o.trim ? L(trimD, OL, 5.4) + L(trimD, o.trim, 3) : '') + (o.pattern || ''), 2.2);
      if (o.emblem) s += o.emblem;
    }
    // stirrup leather + iron (drawn under the seat flap)
    if (!o.noStirrup) {
      s += limb('M' + pt(q(2, 4)) + 'L' + pt(q(3, 22)), dk(lea, 0.1), 2.6);
      var st = 'M' + pt(q(-3, 22)) + 'L' + pt(q(9, 22)) + 'L' + pt(q(8, 28)) + 'L' + pt(q(-2, 28)) + 'Z';
      s += L(st, OL, 4.6) + L(st, met, 2.2);
    }
    // seat: low cantle behind (left), pommel in front (right)
    var cy = o.cantle == null ? 8 : o.cantle, py = o.pommel == null ? 7 : o.pommel;
    var sd = 'M' + pt(q(-16, 3)) + 'C' + pt(q(-18, -2)) + ' ' + pt(q(-16, -cy)) + ' ' + pt(q(-12, -cy)) + 'C' + pt(q(-10, -cy)) + ' ' + pt(q(-9, -cy + 3)) + ' ' + pt(q(-8, -2)) + 'C' + pt(q(-2, 1)) + ' ' + pt(q(6, 1)) + ' ' + pt(q(12, -2)) +
      'C' + pt(q(13, -py + 1)) + ' ' + pt(q(15, -py)) + ' ' + pt(q(17, -py)) + 'C' + pt(q(20, -py + 1)) + ' ' + pt(q(20, -1)) + ' ' + pt(q(18, 4)) + 'C' + pt(q(8, 8)) + ' ' + pt(q(-6, 8)) + ' ' + pt(q(-16, 3)) + 'Z';
    s += body(c, sd, lea, F('M' + pt(q(-16, 3)) + 'C' + pt(q(-6, 7)) + ' ' + pt(q(8, 7)) + ' ' + pt(q(18, 3)) + 'L' + pt(q(18, 10)) + 'L' + pt(q(-16, 10)) + 'Z', dk(lea, 0.3), 0.8) +
      L('M' + pt(q(-13, -cy + 2)) + 'C' + pt(q(-14, -2)) + ' ' + pt(q(-12, 1)) + ' ' + pt(q(-8, 1.5)), lt(lea, 0.35), 1.2, 0.8), 2.2);
    // seat flap with stitching
    var fl = 'M' + pt(q(-6, 4)) + 'C' + pt(q(-7, 10)) + ' ' + pt(q(-6, 15)) + ' ' + pt(q(-3, 17)) + 'L' + pt(q(9, 17)) + 'C' + pt(q(11, 14)) + ' ' + pt(q(11, 9)) + ' ' + pt(q(10, 4)) + 'Z';
    s += body(c, fl, dk(lea, 0.06), L('M' + pt(q(-4, 6)) + 'C' + pt(q(-5, 10)) + ' ' + pt(q(-4, 13)) + ' ' + pt(q(-2, 15)) + 'L' + pt(q(8, 15)) + 'C' + pt(q(9, 12)) + ' ' + pt(q(9, 9)) + ' ' + pt(q(8.4, 6)), lt(lea, 0.35), 0.8, 0.8), 1.8);
    if (o.rim) s += L('M' + pt(q(-15, 2.6)) + 'C' + pt(q(-6, 6.6)) + ' ' + pt(q(8, 6.6)) + ' ' + pt(q(17.6, 3.4)), o.rim, 1.6);
    return s;
  }
  // reins from the bit back to the pommel, sagging a little
  function reins(from, to, col, sag) {
    var m = [(from[0] + to[0]) / 2, Math.max(from[1], to[1]) + (sag == null ? 8 : sag)];
    var d = 'M' + pt(from) + 'Q' + pt(m) + ' ' + pt(to);
    return L(d, OL, 3.6) + L(d, col || '#4a2e18', 1.8);
  }

  // an hourglass centred on (x,y), s = half its height, turned by rot degrees: gold caps and posts, midnight glass,
  // pale-gold sand running (the Trialsworn emblem)
  function hglass(c, x, y, s, lv, rot) {
    var w = s * 0.6, nk = s * 0.1, cap = Math.max(1.3, s * 0.2), sw = s > 6 ? 1.6 : s > 4 ? 1.3 : 1, gold = '#e0b040', sand = lv ? '#fbeec0' : '#f3dc8e', out = '';
    var q = function (u, v) { return pt([x + u, y + v]); };
    var gd = 'M' + q(-w, -s) + 'L' + q(w, -s) + 'C' + q(w, -s * 0.4) + ' ' + q(nk, -s * 0.24) + ' ' + q(nk, 0) + 'C' + q(nk, s * 0.24) + ' ' + q(w, s * 0.4) + ' ' + q(w, s) +
      'L' + q(-w, s) + 'C' + q(-w, s * 0.4) + ' ' + q(-nk, s * 0.24) + ' ' + q(-nk, 0) + 'C' + q(-nk, -s * 0.24) + ' ' + q(-w, -s * 0.4) + ' ' + q(-w, -s) + 'Z';
    if (lv) out += C(x, y, s * (1.3 + lv * 0.45), glow(c, '#ffe9a0', Math.min(0.95, 0.45 + lv * 0.25)));
    out += F(gd, c.lg([[0, '#3e5aa8'], [0.55, '#22326a'], [1, '#141d42']], 0, 0, 1, 0)) +
      '<g clip-path="url(#' + c.clip(gd) + ')">' + F('M' + q(-w, -s * 0.42) + 'L' + q(w, -s * 0.42) + 'L' + q(w, 0) + 'L' + q(-w, 0) + 'Z', sand) +
      F('M' + q(-w, s) + 'L' + q(-w, s * 0.66) + 'Q' + q(0, s * 0.2) + ' ' + q(w, s * 0.66) + 'L' + q(w, s) + 'Z', sand) +
      L('M' + q(0, 0) + 'L' + q(0, s * 0.5), '#fff4c8', Math.max(0.6, s * 0.1)) +
      (s > 4 ? L('M' + q(-w * 0.55, -s * 0.86) + 'L' + q(-w * 0.55, -s * 0.56), '#ffffff', s * 0.1, 0.7) : '') + '</g>' + P(gd, 'none', sw);
    var px = w + cap * 0.35, pdd = 'M' + q(-px, -s) + 'L' + q(-px, s) + 'M' + q(px, -s) + 'L' + q(px, s);
    if (s > 3.5) out += L(pdd, OL, cap * 0.55 + sw * 1.6) + L(pdd, gold, cap * 0.55);
    var cw = w + cap * 0.9;
    out += R(x - cw, y - s - cap, cw * 2, cap, c.cel(gold), sw) + R(x - cw, y + s, cw * 2, cap, c.cel(gold), sw);
    return rot ? G(out, 'rotate(' + n(rot) + ' ' + n(x) + ' ' + n(y) + ')') : out;
  }

  /* the Trialsworn charger (v10.8, a Trials reward): a dark slate warhorse in polished silver barding (crinet,
     chanfron, chest plate and crupper) over a midnight-blue caparison, gold hourglasses on the chest plate and the
     caparison, and a pale-gold glowing mane and tail. t = tier: 0 the plain key, 1 = _t15 (the sand glows, light runs
     along the gold trim), 2 = _t20 (radiant: brighter glow, a soft aura, sand motes drifting round it). */
  function twCharger(c, o, t) {
    var col = '#4c5468', dc = dk(col, 0.3), sand = '#f3dc8e', mid = '#22326a', gold = '#e0b040', s = o.icon ? '' : shadow(c, 80, 56);
    var steel = function () { return c.lg([[0, '#f4f7fa'], [0.45, '#c3ccd8'], [1, '#6e7b8e']], 0.2, 0, 0.8, 1); };
    var hoofS = function (x, y) { var d = 'M' + pt([x - 4.4, y - 7]) + 'L' + pt([x + 4.6, y - 7]); return hoof(x, y, 8.5, '#262a34') + L(d, OL, 4.2) + L(d, gold, 2.2) + (t ? L(d, '#fff4c8', 0.8, 0.9) : ''); };
    // light along a gold trim line (t >= 1)
    var trim = function (d, w) { return t ? L(d, '#ffe9a0', (w || 2.4) + t * 1.6, 0.2 + t * 0.1) + L(d, '#fffbe8', t > 1 ? 1 : 0.7, 0.9) : ''; };
    var mote = function (x, y, r) { return C(x, y, r * 2.8, glow(c, '#ffe9a0', 0.6)) + P('M' + pt([x, y - r * 1.5]) + 'L' + pt([x + r * 0.7, y]) + 'L' + pt([x, y + r * 1.5]) + 'L' + pt([x - r * 0.7, y]) + 'Z', '#fff8dc', 0.6); };
    // the aura stays below the seat and round the head: the mount is drawn over its rider, so it must not wash over them
    if (t > 1) s += E(80, 100, 78, 28, c.rg([[0, '#fff4c8', 0.34], [0.55, '#ffe9a0', 0.16], [1, '#ffe9a0', 0]])) + C(140, 40, 24, glow(c, '#ffe9a0', 0.3));
    s += leg([[52, 82], [58, 98, 13], [50, 108, 8], [51, 117, 6]], dc) + hoofS(51, 121);
    s += leg([[104, 84], [106, 100, 12], [106, 110, 8], [107, 117, 6]], dc) + hoofS(107, 121);
    // glowing tail
    var T = taper([[40, 62], [30, 66], [23, 80], [22, 96], [28, 108]], 14, 5, 5);
    s += F(T.d, glow(c, '#ffe9a0', 0.5 + t * 0.15)) + L(T.d, '#ffe9a0', 7 + t * 2, 0.25 + t * 0.08);
    s += body(c, T.d, sand, L(along(T, 0.35, 2) + along(T, 0.7, 4), '#fffbe6', 1.2, 0.9) + L(along(T, 0.55, 3), dk(sand, 0.2), 1, 0.7), 2.2);
    // body
    var bd = 'M36,72 C33,60 42,54 54,56 C64,58 76,61 90,57 C98,55 104,52 110,54 C122,58 125,76 119,88 C113,96 101,96 90,94 C76,97 60,97 48,94 C38,90 37,82 36,72 Z';
    s += body(c, bd, col, F('M30,86 C50,98 96,100 124,84 L126,104 L30,104 Z', dk(col, 0.22), 0.8) + F('M42,58 C54,56 66,60 80,62 L80,66 C66,64 52,62 42,64 Z', lt(col, 0.22), 0.55));
    // crupper plate over the hindquarters
    var cr = 'M37,64 C40,57 48,55 56,57 L57,79 C49,82 42,81 38,77 C36,73 36,68 37,64 Z', crt = 'M38.5,76 C44,80.5 51,81 56.6,78.4';
    s += body(c, cr, '#c3ccd8', F('M36,74 C44,80 52,81 58,78 L58,84 L36,84 Z', '#6e7b8e', 0.7) + L('M40,62 C44,58 50,57 55,58', '#ffffff', 1.1, 0.8), 2.2) + L(crt, gold, 1.6) + trim(crt, 1.6) + stud(46.5, 68, 1.5, gold);
    // neck: glowing mane on top, silver crinet lames below it
    var N = taper([[104, 78], [112, 60], [122, 46], [131, 36]], 30, 18, 5);
    s += F(fringe(N, 1, 15, 11 + t * 2, 'b'), glow(c, '#ffe9a0', 0.75 + t * 0.1));
    s += body(c, N.d, col, F(ribbonBand(N, 0, 0.3), dk(col, 0.2), 0.8), 2.4);
    var cn = ribbonBand(N, 0.34, 0.92);
    s += body(c, cn, '#c3ccd8', L(bands(N, 3, 1), '#5e6a7c', 1.3) + L(along(N, 0.8, 1), '#ffffff', 1, 0.7) + L(along(N, 0.4, 1), '#8a96a8', 1, 0.8), 1.8);
    s += P(fringe(N, 1, 15, 8, 'b'), c.lg([[0, '#fff6d0'], [0.45, '#f6d67a'], [1, '#d8a840']], 0, 0, 1, 1), 1.8) + L(along(N, 1.05, 2, 15), '#fffbe6', 1, 0.7);
    // head, ears, silver chanfron with a gold hourglass and a gold crest spike
    var hd = 'M124,28 C128,20 138,20 143,27 L155,47 C158,52 155,58 149,58 C143,58 139,56 135,52 C129,46 121,38 124,28 Z';
    s += P('M130,24 L133,11 L138,22 Z', c.cel(dc), 1.6);
    s += body(c, hd, col, F('M140,22 L160,22 L160,60 L150,60 C156,50 150,40 140,22 Z', dk(col, 0.22), 0.8) + L('M126,36 C130,44 136,46 138,44', dk(col, 0.35), 1.4), 2.3);
    s += P('M125,26 L125,12 L132,22 Z', c.cel(col), 1.6) + F('M126.6,23 L126.8,16 L130,21.6 Z', dk(col, 0.4));
    s += P('M128,22 L140,23 L152,43 L148,48 L136,36 C132,33 129,28 128,22 Z', steel(), 1.7) + L('M130,24 L139.5,25 L149.5,42.5', gold, 1.5) + trim('M130,24 L139.5,25 L149.5,42.5', 1.2) + L('M131,27 C133,31 136,34 139,36', '#ffffff', 1, 0.7);
    s += hglass(c, 140.5, 32, 3.6, t, -32);
    s += P('M129,23 L126,9 L133,21 Z', c.cel(gold), 1.4);
    s += E(134, 34, 2.4, 2, '#1a0e08', 1) + C(133.4, 33.4, 0.7, '#ffffff') + E(151, 51, 1.4, 1, OL) + L('M146,56.6 L152,56', OL, 1.2);
    // bridle
    s += L('M127,27 L134,41 L147,55 M134,41 L143,47', OL, 3.2) + L('M127,27 L134,41 L147,55 M134,41 L143,47', mid, 1.6) + C(146.6, 55, 1.8, gold, 1);
    // midnight caparison under the saddle, a dagged hem edged in silver and gold, a gold hourglass beside the stirrup
    var cap = 'M49,56 L97,56 C99,66 100,78 99,90 L95,97 L90,92 L85,99 L80,93 L74,100 L68,93 L62,99 L57,92 L52,97 L48,90 C47,78 47,66 49,56 Z';
    var hem = 'M48,90 L52,97 L57,92 L62,99 L68,93 L74,100 L80,93 L85,99 L90,92 L95,97 L99,90';
    s += saddle(c, { leather: '#2a2f45', blanket: mid, blanketD: cap, trim: null, metal: '#d8dce2', rim: gold,
      pattern: L(hem, '#c3ccd8', 5.4) + L(hem, gold, 1.6) + trim(hem, 1.6) + L('M49,60 L97,60', '#c3ccd8', 2.2) + L('M49,62.4 L97,62.4', gold, 1) + trim('M49,62.4 L97,62.4', 1),
      emblem: hglass(c, 89, 79.5, 6.4, t, 0) });
    s += leg([[44, 80], [50, 97, 16], [40, 108, 9], [41, 117, 6.5]], col) + hoofS(41, 121);
    s += leg([[112, 82], [115, 100, 13], [116, 110, 8.5], [118, 117, 6.5]], col) + hoofS(118, 121);
    // silver chest plate over the chest and the top of the near foreleg, a gold hourglass on it
    var cp = 'M103,64 C112,65 120,70 124,77 C126,85 123,93 116,97 C110,94 104,88 101,82 C99,76 100,69 103,64 Z', cpt = 'M102.6,67.6 C111,68.6 119,73 122.8,79';
    s += body(c, cp, '#c3ccd8', F('M98,86 C106,92 114,96 118,99 L128,99 L128,86 Z', '#6e7b8e', 0.6) + L('M104,67 C112,68 118,72 121.5,77', '#ffffff', 1.1, 0.8), 2.2) +
      L(cpt, gold, 1.5) + trim(cpt, 1.4) + hglass(c, 113, 80.5, 5.6, t, 0);
    s += reins([147, 55], [89, 57], mid, 7);
    if (t > 1 && !o.icon) s += mote(22, 54, 1.4) + mote(12, 86, 1.2) + mote(154, 14, 1.1) + mote(156, 66, 1.2) + mote(134, 76, 1) + mote(30, 114, 1) + mote(128, 112, 1.1);
    return s;
  }

  /* the first year of Trials, October 2026 to September 2027: each month's cloak colours, copied from TW_MONTHS in
     art.js (cloth light, cloth, cloth dark, edge), in calendar order */
  var TW_YEAR1 = [
    ['#e0683a', '#c03c18', '#5e1a0a', '#2e2622'], ['#8e5a3a', '#6a3a22', '#381c10', '#c47a3e'], ['#d6e8f6', '#a8c6de', '#6e8eae', '#ffffff'],
    ['#7e8ea2', '#56687e', '#2e3a4a', '#e8f0f8'], ['#b02a3a', '#861424', '#480810', '#e6b54a'], ['#8ad06e', '#56a044', '#2a6224', '#f4e6a4'],
    ['#a6d8a0', '#74b87a', '#3e7a4c', '#f2a6c0'], ['#3a9a68', '#1e6a44', '#0e3a24', '#e6c25a'], ['#f6d466', '#e2ac28', '#9a6a10', '#2f7ad8'],
    ['#5aa6f0', '#2a78d0', '#123e80', '#f0c448'], ['#fffaf0', '#eee2c6', '#b8a680', '#e0b040'], ['#f2c060', '#d8961e', '#8a5608', '#5a3414']
  ];
  // an hourglass whose glass holds the whole year: twelve bands of sand, October at the top, September at the bottom
  function hglass12(c, x, y, s, yr) {
    var w = s * 0.6, nk = s * 0.12, cap = Math.max(1.3, s * 0.2), gold = '#e0b040', out = '', i;
    var q = function (u, v) { return pt([x + u, y + v]); };
    var gd = 'M' + q(-w, -s) + 'L' + q(w, -s) + 'C' + q(w, -s * 0.4) + ' ' + q(nk, -s * 0.24) + ' ' + q(nk, 0) + 'C' + q(nk, s * 0.24) + ' ' + q(w, s * 0.4) + ' ' + q(w, s) +
      'L' + q(-w, s) + 'C' + q(-w, s * 0.4) + ' ' + q(-nk, s * 0.24) + ' ' + q(-nk, 0) + 'C' + q(-nk, -s * 0.24) + ' ' + q(-w, -s * 0.4) + ' ' + q(-w, -s) + 'Z';
    var b = '', h = s * 2 / yr.length;
    for (i = 0; i < yr.length; i++) b += R(x - w, y - s + i * h, w * 2, h + (i < yr.length - 1 ? 0.3 : 0), yr[i][0]);
    out += F(gd, '#141d42') + '<g clip-path="url(#' + c.clip(gd) + ')">' + b +
      L('M' + q(-w * 0.55, -s * 0.86) + 'L' + q(-w * 0.55, -s * 0.5), '#ffffff', s * 0.12, 0.75) + '</g>' + P(gd, 'none', 1.5);
    var px = w + cap * 0.35, pdd = 'M' + q(-px, -s) + 'L' + q(-px, s) + 'M' + q(px, -s) + 'L' + q(px, s);
    out += L(pdd, OL, cap * 0.55 + 2.4) + L(pdd, gold, cap * 0.55);
    var cw = w + cap * 0.9;
    return out + R(x - cw, y - s - cap, cw * 2, cap, c.cel(gold), 1.5) + R(x - cw, y + s, cw * 2, cap, c.cel(gold), 1.5);
  }
  /* the Twelvefold Charger (trialsworn_year1, for all twelve cloaks of the first year): the charger's rig, so riders sit
     the same, but a pearl-white coat, gold barding, a caparison of twelve hanging banners (one per month, each tipped in
     that month's edge colour), a gold chest plate with a twelve-band hourglass, a gold crown on the poll, and a mane of
     twelve locks and a banded tail that run through the year's colours. */
  function twYear(c, o) {
    var yr = TW_YEAR1, col = '#e8e2d6', dc = dk(col, 0.26), gold = '#e0b040', mid = '#22326a', s = o.icon ? '' : shadow(c, 80, 56), i;
    var goldS = function () { return c.lg([[0, '#fff2b8'], [0.42, '#eec65a'], [1, '#a87a20']], 0.2, 0, 0.8, 1); };
    var hoofG = function (x, y) { var d = 'M' + pt([x - 4.4, y - 7]) + 'L' + pt([x + 4.6, y - 7]); return hoof(x, y, 8.5, '#5a4630') + L(d, OL, 4.2) + L(d, gold, 2.2) + L(d, '#fff4c8', 0.8, 0.9); };
    var gem = function (x, y, r, g) { return C(x, y, r, c.cel(g), 1.1) + C(x - r * 0.3, y - r * 0.32, r * 0.34, '#ffffff', 0, 0.85); };
    // far legs
    s += leg([[52, 82], [58, 98, 13], [50, 108, 8], [51, 117, 6]], dc) + hoofG(51, 121);
    s += leg([[104, 84], [106, 100, 12], [106, 110, 8], [107, 117, 6]], dc) + hoofG(107, 121);
    // the long tail, banded through the year from the root (October) to the tip (September), a gold cuff at the root
    var T = taper([[40, 62], [30, 64], [21, 76], [17, 92], [19, 106], [27, 116]], 16, 4.5, 8), m = T.s.length, tb = '';
    s += L(T.d, '#fff4c8', 6, 0.22);
    for (i = 0; i < 12; i++) {
      var i0 = Math.round(i * (m - 1) / 12), i1 = Math.min(m - 1, Math.round((i + 1) * (m - 1) / 12) + (i < 11 ? 1 : 0));
      tb += F(pd(T.a.slice(i0, i1 + 1).concat(T.b.slice(i0, i1 + 1).reverse()), true), yr[i][0]);
    }
    s += P(T.d, yr[0][0], 2.2) + '<g clip-path="url(#' + c.clip(T.d) + ')">' + tb + F(ribbonBand(T, 0.62, 1), '#000', 0.16) +
      L(along(T, 0.26, 2) + along(T, 0.48, 6, 36), '#ffffff', 1, 0.6) + L(along(T, 0.38, 3, 38) + along(T, 0.62, 2, 30) + along(T, 0.8, 4), '#000', 0.8, 0.25) + '</g>' + P(T.d, 'none', 2.2);
    var cuff = 'M' + pt(T.a[3]) + 'L' + pt(T.b[3]);
    s += L(cuff, OL, 5) + L(cuff, gold, 2.8);
    // body
    var bd = 'M36,72 C33,60 42,54 54,56 C64,58 76,61 90,57 C98,55 104,52 110,54 C122,58 125,76 119,88 C113,96 101,96 90,94 C76,97 60,97 48,94 C38,90 37,82 36,72 Z';
    s += body(c, bd, col, F('M30,86 C50,98 96,100 124,84 L126,104 L30,104 Z', dk(col, 0.16), 0.8) + F('M42,58 C54,56 66,60 80,62 L80,66 C66,64 52,62 42,64 Z', '#ffffff', 0.55));
    // gold crupper plate with a gem
    var cr = 'M37,64 C40,57 48,55 56,57 L57,79 C49,82 42,81 38,77 C36,73 36,68 37,64 Z';
    s += body(c, cr, gold, F('M36,74 C44,80 52,81 58,78 L58,84 L36,84 Z', '#a87a20', 0.6) + L('M40,62 C44,58 50,57 55,58', '#fff8dc', 1.1, 0.9) + L('M38.5,76 C44,80.5 51,81 56.6,78.4', mid, 1.4), 2.2) + gem(46.5, 68, 2.4, yr[4][0]);
    // neck: midnight crinet edged in gold, then the mane of twelve locks (October at the poll, September at the withers)
    var N = taper([[104, 78], [112, 60], [122, 46], [131, 36]], 30, 18, 5);
    s += F(fringe(N, 1, 15, 12, 'b'), glow(c, '#fff4c8', 0.6));
    s += body(c, N.d, col, F(ribbonBand(N, 0, 0.3), dk(col, 0.14), 0.8), 2.4);
    var cn = ribbonBand(N, 0.36, 0.9);
    s += body(c, cn, mid, L(bands(N, 3, 1), gold, 1.1) + L(along(N, 0.86, 1), '#5a72c0', 1, 0.8), 1.8) + L(along(N, 0.38, 1), gold, 1.4);
    var ns = N.s.length, lk = '';
    for (i = 11; i >= 0; i--) {
      var f = 1 + i * (ns - 3) / 11, j0 = Math.floor(f), j1 = Math.min(ns - 1, j0 + 1), t = f - j0;
      var Bp = lerp2(lerp2(N.a[j0], N.a[j1], t), lerp2(N.b[j0], N.b[j1], t), 0.8), Bo = lerp2(N.b[j0], N.b[j1], t), Ao = lerp2(N.a[j0], N.a[j1], t);
      var ux = Bo[0] - Ao[0], uy = Bo[1] - Ao[1], ud = Math.sqrt(ux * ux + uy * uy) || 1; ux /= ud; uy /= ud;
      var p0 = N.s[Math.max(0, j0 - 1)], p1 = N.s[Math.min(ns - 1, j1 + 1)], vx = p0[0] - p1[0], vy = p0[1] - p1[1], vd = Math.sqrt(vx * vx + vy * vy) || 1; vx /= vd; vy /= vd;
      var len = 8 + i * 0.32 + (i % 2 ? 0 : 2.6) + Math.sin(PI * i / 11) * 2, hw = 2.8;
      var Q = function (a, b) { return [Bp[0] + ux * a + vx * b, Bp[1] + uy * a + vy * b]; };
      var ld = 'M' + pt(Q(0, -hw)) + 'Q' + pt(Q(len * 0.9, -hw * 0.4)) + ' ' + pt(Q(len, len * 0.62)) + 'Q' + pt(Q(len * 0.36, hw * 1.7)) + ' ' + pt(Q(0, hw)) + 'Z';
      lk += P(ld, c.cel(yr[11 - i][0]), 1.5) + L('M' + pt(Q(1.5, -hw * 0.2)) + 'Q' + pt(Q(len * 0.7, 0)) + ' ' + pt(Q(len * 0.9, len * 0.48)), '#ffffff', 0.9, 0.55);
    }
    s += lk;
    // head, ears, gold chanfron with a gem, and a gold crown on the poll
    var hd = 'M124,28 C128,20 138,20 143,27 L155,47 C158,52 155,58 149,58 C143,58 139,56 135,52 C129,46 121,38 124,28 Z';
    s += P('M130,24 L133,11 L138,22 Z', c.cel(dc), 1.6);
    s += body(c, hd, col, F('M140,22 L160,22 L160,60 L150,60 C156,50 150,40 140,22 Z', dk(col, 0.16), 0.8) + L('M126,36 C130,44 136,46 138,44', dk(col, 0.3), 1.4), 2.3);
    s += P('M125,26 L125,12 L132,22 Z', c.cel(col), 1.6) + F('M126.6,23 L126.8,16 L130,21.6 Z', '#c8a8a0');
    s += P('M133,26 L141,26 L152,43 L148,48 L137,37 C134.6,34 133.4,30 133,26 Z', goldS(), 1.7) + L('M135,28.4 L140.2,28.2 L149.4,42.6', mid, 1.3) +
      P('M145.2,36.4 L147.4,39.8 L145.2,43.2 L143,39.8 Z', c.cel(yr[4][0]), 1.1) + C(144.6, 38.6, 0.5, '#ffffff', 0, 0.85);
    // the crown sits on the brow in front of the ears: a gold band and three points standing up off the forehead
    var cb = 'M129.6,22.2 L143.4,26.4 L141.8,30 L130.2,26.6 Z', ca = -1.27;
    var spike = function (tx, ty, h, g) { var qq = dirQ([tx, ty], ca), tp = qq(h, 0); return P(pd([qq(0, -2.3), qq(h * 0.72, -1.1), tp, qq(h * 0.72, 1.1), qq(0, 2.3)], true), goldS(), 1.3) + gem(tp[0], tp[1], 1.35, g); };
    s += spike(132.4, 23.4, 7, '#fff4c8') + spike(136.6, 24.6, 10, yr[9][0]) + spike(140.8, 25.9, 7, '#fff4c8');
    s += P(cb, goldS(), 1.5) + gem(133, 25.4, 1.05, yr[0][0]) + gem(136.6, 26.5, 1.25, yr[7][0]) + gem(140.2, 27.6, 1.05, yr[10][3]);
    // bridle
    s += L('M126,31 L133,42.4 L147,55 M133,42.4 L143,47', OL, 3.2) + L('M126,31 L133,42.4 L147,55 M133,42.4 L143,47', gold, 1.6) + C(146.6, 55, 1.8, gold, 1);
    s += E(134, 34.6, 2.4, 2, '#1a0e08', 1) + C(133.4, 34, 0.7, '#ffffff') + E(151, 51, 1.4, 1, OL) + L('M146,56.6 L152,56', OL, 1.2);
    // the caparison: twelve banners hanging from a gold band, each dag tipped in its month's edge colour
    var x0 = 48, x1 = 99, pw = (x1 - x0) / 12, hemY = function (x) { return 90 + 3.5 * Math.sin(PI * (x - x0) / (x1 - x0)); };
    var hemP = [], panels = '', tails = '', seams = '';
    for (i = 0; i < 12; i++) {
      var a = x0 + i * pw, b2 = a + pw, xc = a + pw / 2, ya = hemY(a), yb = hemY(b2), drop = 7 + (i % 2 ? 0 : 1.6), ty = (ya + yb) / 2 + drop;
      if (!i) hemP.push([a, ya]);
      hemP.push([b2, yb]);
      panels += R(a - 0.15, 50, pw + 0.3, 60, c.cel(yr[i][0]));
      if (i) seams += 'M' + pt([a, 62]) + 'L' + pt([a, ya]);
      // the banner's tail: a pennant below the hem, in its month's cloth, its point in the month's edge colour
      var tl = pd([[a + 0.3, ya - 2], [b2 - 0.3, yb - 2], [b2 - 0.3, yb + drop * 0.45], [xc, ty], [a + 0.3, ya + drop * 0.45]], true);
      var tip = pd([[b2 - 0.3, yb + drop * 0.45], [xc, ty], [a + 0.3, ya + drop * 0.45], lerp2([a + 0.3, ya + drop * 0.45], [xc, ty], 0.4), lerp2([b2 - 0.3, yb + drop * 0.45], [xc, ty], 0.4)], true);
      tails += P(tl, yr[i][1], 1.2) + F(tip, yr[i][3]) + P(tl, 'none', 1.2);
    }
    var cap = 'M49,56 L97,56 C99,66 100,78 ' + pt(hemP[hemP.length - 1]) + hemP.slice().reverse().map(function (p) { return 'L' + pt(p); }).join('') + ' C47,78 47,66 49,56 Z';
    s += tails;
    s += saddle(c, { leather: '#1e2440', blanket: mid, blanketD: cap, trim: null, metal: '#f0d890', rim: gold,
      pattern: panels + L(seams, OL, 0.9, 0.85) + F('M76,50 L104,50 L104,104 L80,104 C86,84 84,66 76,50 Z', '#000', 0.14) + F('M40,84 L104,84 L104,104 L40,104 Z', '#000', 0.1) +
        L(pd(hemP), OL, 3.4) + L(pd(hemP), gold, 1.6) + L('M49,60 L97,60', OL, 4.6) + L('M49,60 L97,60', gold, 2.6) + L('M49,59.2 L97,59.2', '#fff4c8', 0.8, 0.9) + P(cap, 'none', 2.2) });
    // near legs
    s += leg([[44, 80], [50, 97, 16], [40, 108, 9], [41, 117, 6.5]], col) + hoofG(41, 121);
    s += leg([[112, 82], [115, 100, 13], [116, 110, 8.5], [118, 117, 6.5]], col) + hoofG(118, 121);
    // gold chest plate with a midnight medallion holding the twelve-band hourglass
    var cp = 'M103,63 C112,64 121,69 125,77 C127,86 124,94 116,98 C110,95 103,89 100,82 C98,76 99,68 103,63 Z';
    s += body(c, cp, gold, F('M98,86 C106,92 114,96 118,99 L128,99 L128,86 Z', '#a87a20', 0.55) + L('M104,66 C112,67 118,71 122,76.5', '#fff8dc', 1.1, 0.85), 2.2);
    s += E(113.4, 80.6, 7.6, 11.4, mid, 1.6) + L(ellD(113.4, 80.6, 6.2, 10), '#5a72c0', 0.8, 0.8) + hglass12(c, 113.4, 80.6, 7.6, yr);
    s += reins([147, 55], [89, 57], gold, 7);
    return s;
  }

  /* ================= the mounts (all face RIGHT; seat at 72,60; hooves on y 121) ================= */
  /* the skeletal horse, drawn from a palette so the Wickless Steed shares its bones */
  var SKEL_VOID = { bone: '#e6dcc2', dbone: '#a89e84', voidc: '#241a30', glow: '#b060ff', cloth: '#3e2650', light: '#e0b8ff', deep: '#4a1a7a', pale: '#e8c8ff', eye: '#d8a0ff' };
  var SKEL_WICK = { bone: '#d6dce6', dbone: '#8e98aa', voidc: '#141a2e', glow: '#ffb03a', cloth: '#1e2a4a', light: '#fff0b8', deep: '#7a3a08', pale: '#ffe6a0', eye: '#fff2c0',
    lantern: function (c) { return L('M58,64 L58,74', OL, 2.6) + P('M52,74 L64,74 L62,88 L54,88 Z', c.cel('#3a3428'), 2) + P('M55,77 L61,77 L60,85 L56,85 Z', '#ffd06a', 0) + C(58, 81, 7, glow(c, '#ffb03a', 0.55), 0); } };
  function skelHorse(c, o, K) {
      var bone = K.bone, dbone = K.dbone, voidc = K.voidc, glowc = K.glow, cloth = K.cloth, s = o.icon ? '' : shadow(c, 80, 56);
      var bl = function (d, w, cc) { return L(d, OL, w + 3.8) + L(d, cc || bone, w); };
      var knob = function (x, y, r, cc) { return C(x, y, r, c.cel(cc || bone), 1.6); };
      // far legs
      s += bl('M52,84 L58,98 L50,108 L51,117', 4, dbone) + knob(58, 98, 3.2, dbone) + knob(50, 108, 2.6, dbone) + hoof(51, 121, 8, '#1a1418');
      s += bl('M104,86 L106,100 L106,110 L107,117', 4, dbone) + knob(106, 100, 3, dbone) + knob(106, 110, 2.6, dbone) + hoof(107, 121, 8, '#1a1418');
      // ghost-flame tail
      var T = taper([[40, 62], [28, 66], [20, 80], [22, 96], [16, 106]], 14, 2, 5);
      s += F(T.d, glow(c, glowc, 0.7)) + P(fringe(T, 2, 20, 6, 'a'), c.lg([[0, K.light], [0.5, glowc], [1, K.deep]]), 1.6);
      s += bl('M40,62 C34,64 30,68 28,74', 2.6);
      // body silhouette filled with dark void and glow
      var bd = 'M36,72 C33,60 42,54 54,56 C64,58 76,61 90,57 C98,55 104,52 110,54 C122,58 125,76 119,88 C113,96 101,96 90,94 C76,97 60,97 48,94 C38,90 37,82 36,72 Z';
      s += body(c, bd, voidc, C(100, 76, 26, glow(c, glowc, 0.7)) + C(48, 76, 14, glow(c, glowc, 0.4)), 2.4);
      // ribs + sternum
      var rb = '';
      [[96, 0], [102, 1], [108, 2], [114, 3]].forEach(function (k) { rb += 'M' + pt([k[0] - 2, 58]) + 'C' + pt([k[0] + 6, 66]) + ' ' + pt([k[0] + 4, 80]) + ' ' + pt([k[0] - 2 + k[1], 90]); });
      s += bl(rb, 2.6) + bl('M92,92 C102,94 110,92 116,86', 2.4);
      // spine
      s += bl('M40,60 C54,56 70,60 90,57 C100,55 106,53 110,54', 3) + (function () { var v = ''; for (var i = 0; i < 9; i++) { var x = 44 + i * 8; v += C(x, i < 4 ? 58.4 - i * 0.2 : 58 - (i - 4) * 0.9, 1.8, bone, 1.2); } return v; })();
      // pelvis
      s += P('M36,64 C40,58 50,58 54,64 C56,72 50,78 44,80 C40,76 36,72 36,64 Z', c.cel(bone), 1.8) + E(46, 68, 3.4, 4, voidc, 1.2);
      // neck: vertebrae over a void strip, ghostly mane
      var N = taper([[104, 76], [112, 60], [122, 46], [131, 36]], 20, 12, 5);
      s += F(fringe(N, 1, 15, 9, 'b'), glow(c, glowc, 0.9)) + P(fringe(N, 1, 15, 7, 'b'), c.lg([[0, K.deep], [0.6, glowc], [1, K.pale]], 0, 1, 1, 0), 1.6);
      s += P(N.d, voidc, 2);
      [0, 3, 6, 9, 12, 15].forEach(function (i) { var p = N.s[i]; s += E(p[0], p[1], 5.4, 3.6, c.cel(bone), 1.4); });
      // skull
      var hd = 'M124,28 C128,20 138,20 143,27 L155,47 C158,52 155,58 149,58 C143,58 139,56 135,52 C129,46 121,38 124,28 Z';
      s += P('M130,24 L133,12 L138,22 Z', c.cel(dbone), 1.6);
      s += body(c, hd, bone, F('M140,22 L160,22 L160,60 L150,60 C156,50 150,40 140,22 Z', dk(bone, 0.25), 0.8), 2.3);
      s += P('M125,26 L125,13 L132,22 Z', c.cel(bone), 1.6);
      s += E(134, 33, 4.2, 3.6, voidc, 1.4) + glowEye(c, 134.4, 33.4, 1.8, K.eye);
      s += P('M146,42 L150,47 L147,49 Z', voidc, 1) + P('M138,52 L154,53 L152,57 L140,56 Z', voidc, 1.2) + L('M141,53 L141,56 M144,53.4 L144,56.4 M147,53.6 L147,56.6 M150,53.8 L150,56.6', bone, 1.2);
      s += L('M127,38 C131,44 136,46 139,45', dk(bone, 0.4), 1.2);
      // tattered barding + black spiked saddle
      var rag = 'M50,57 L94,56 C96,66 96,76 95,86 L91,93 L88,85 L83,94 L79,86 L73,95 L69,86 L63,94 L59,85 L54,92 L50,85 C48,76 48,66 50,57 Z';
      s += saddle(c, { leather: '#2a2230', blanket: cloth, blanketD: rag, trim: null, metal: '#8a8a96', rim: glowc, pattern: L('M50,62 L95,61', '#8a8a96', 2) + F('M64,70 L72,64 L80,70 L72,78 Z', glowc, 0.8) });
      s += spikes([[57, 52, -2.2], [89, 53, -1]], 5.4, '#b8bcc8');
      // near legs
      s += bl('M44,80 L50,97 L40,108 L41,117', 5) + knob(50, 97, 3.8) + knob(40, 108, 3) + hoof(41, 121, 8.5, '#1a1418');
      s += bl('M112,82 L115,100 L116,110 L118,117', 5) + knob(112, 82, 5) + knob(115, 100, 3.4) + knob(116, 110, 3) + hoof(118, 121, 8.5, '#1a1418');
      // chain bridle + reins
      s += L('M127,27 L134,41 L147,55', OL, 3) + L('M127,27 L134,41 L147,55', '#6a6a76', 1.4) + C(146.6, 55, 1.8, '#9a9aa6', 1);
      s += reins([147, 55], [89, 57], '#2a2230', 7);
      if (K.lantern) s += K.lantern(c);
      return s;
  }
  var MOUNTS = {
    /* human: a brown Kingsmere horse in blue-and-gold barding, steel chanfron and a blue plume */
    horse: function (c, o) {
      var col = '#8e5a32', dc = dk(col, 0.3), mane = '#3a2216', blue = '#2c4ea2', gold = '#e0b040', s = o.icon ? '' : shadow(c, 80, 56);
      s += leg([[52, 82], [58, 98, 13], [50, 108, 8], [51, 117, 6]], dc) + hoof(51, 121, 8, '#2a1c14');
      s += leg([[104, 84], [106, 100, 12], [106, 110, 8], [107, 117, 6]], dc) + hoof(107, 121, 8, '#2a1c14');
      // tail
      var T = taper([[40, 62], [30, 66], [24, 80], [24, 96], [30, 106]], 13, 5, 5);
      s += body(c, T.d, mane, L(along(T, 0.35, 2) + along(T, 0.7, 4), lt(mane, 0.25), 1.2, 0.8), 2.2);
      // body
      var bd = 'M36,72 C33,60 42,54 54,56 C64,58 76,61 90,57 C98,55 104,52 110,54 C122,58 125,76 119,88 C113,96 101,96 90,94 C76,97 60,97 48,94 C38,90 37,82 36,72 Z';
      s += body(c, bd, col, F('M30,86 C50,98 96,100 124,84 L126,104 L30,104 Z', dk(col, 0.22), 0.8) + F('M42,58 C54,56 66,60 80,62 L80,66 C66,64 52,62 42,64 Z', lt(col, 0.22), 0.55));
      // neck, mane, head
      var N = taper([[104, 78], [112, 60], [122, 46], [131, 36]], 30, 18, 5);
      s += body(c, N.d, col, F(ribbonBand(N, 0, 0.35), dk(col, 0.2), 0.8) + L(along(N, 0.2, 2, 14), lt(col, 0.2), 1.2, 0.6), 2.4);
      s += P(fringe(N, 1, 15, 7, 'b'), c.cel(mane), 1.8);
      var hd = 'M124,28 C128,20 138,20 143,27 L155,47 C158,52 155,58 149,58 C143,58 139,56 135,52 C129,46 121,38 124,28 Z';
      s += P('M130,24 L133,11 L138,22 Z', c.cel(dc), 1.6);
      s += body(c, hd, col, F('M140,22 L160,22 L160,60 L150,60 C156,50 150,40 140,22 Z', dk(col, 0.22), 0.8) + L('M126,36 C130,44 136,46 138,44', dk(col, 0.35), 1.4), 2.3);
      s += P('M125,26 L125,12 L132,22 Z', c.cel(col), 1.6) + F('M126.6,23 L126.8,16 L130,21.6 Z', '#4a2a18');
      // chanfron + plume
      s += P('M129,23 L139,24 L151,43 L147,47 L135,34 Z', c.cel('#c8ccd4'), 1.6) + L('M131,25 L138,26 L148,42', blue, 1.6) + stud(139, 30, 1.2, gold);
      s += P('M128,22 C124,12 128,4 136,2 C132,8 134,14 136,21 Z', c.cel(blue), 1.5) + L('M129,18 C128,12 130,8 134,4', lt(blue, 0.35), 1, 0.8);
      s += E(134, 33, 2.4, 2, '#1a0e08', 1) + C(133.4, 32.4, 0.7, '#ffffff') + E(151, 51, 1.4, 1, OL) + L('M146,56.6 L152,56', OL, 1.2);
      // bridle
      s += L('M127,27 L134,41 L147,55 M134,41 L143,47', OL, 3.2) + L('M127,27 L134,41 L147,55 M134,41 L143,47', '#5a3418', 1.6) + C(146.6, 55, 1.8, gold, 1);
      // peytral (breast strap) + crupper
      s += limb('M96,62 C104,70 112,76 120,78', blue, 3.4) + studRow([100, 66], [117, 77], 4, 1.3, gold) + limb('M52,62 C46,62 42,62 38,64', '#5a3418', 2.4);
      // barding and saddle
      var em = P('M68,72 L78,72 L78,80 C78,84 75,86 73,87 C71,86 68,84 68,80 Z', c.cel(gold), 1.4) + P('M70.6,74 L75.4,74 L75.4,79.6 C75.4,82 74,83.4 73,84 C72,83.4 70.6,82 70.6,79.6 Z', blue, 0);
      s += saddle(c, { leather: '#5a3418', blanket: blue, trim: gold, metal: '#d8dce2', emblem: em, rim: gold });
      s += leg([[44, 80], [50, 97, 16], [40, 108, 9], [41, 117, 6.5]], col) + hoof(41, 121, 8.5, '#2a1c14');
      s += leg([[112, 82], [115, 100, 13], [116, 110, 8.5], [118, 117, 6.5]], col) + hoof(118, 121, 8.5, '#2a1c14');
      s += reins([147, 55], [89, 57], '#5a3418', 7);
      return s;
    },

    /* dwarf: a big grey-white mountain ram with huge curled horns and a red-and-bronze Keldrun saddle */
    ram: function (c, o) {
      var wool = '#e4dfd4', dw = '#b4ac9e', face = '#a89e90', horn = '#c8b28a', red = '#9a2a1e', bronze = '#cc8a3a', s = o.icon ? '' : shadow(c, 80, 54);
      var lc = '#8e8476';
      s += leg([[54, 88], [56, 104, 12], [53, 117, 8]], dk(lc, 0.25)) + splitHoof(53, 121, 9, '#2a2420');
      s += leg([[100, 88], [103, 104, 11], [104, 117, 8]], dk(lc, 0.25)) + splitHoof(104, 121, 9, '#2a2420');
      // tail puff
      s += P(shag(34, 68, 8, 7, 6, 0.2, 21), c.cel(dw), 1.8);
      // wool body
      var bd = shag(76, 77, 45, 20, 22, 0.04, 5);
      var curls = '', r = rng(9);
      for (var i = 0; i < 16; i++) { var x = 38 + r() * 76, y = 64 + r() * 28; curls += 'M' + pt([x - 3, y]) + 'q3,-3 6,0'; }
      s += body(c, bd, wool, L(curls, dw, 1.2, 0.9) + F('M26,86 C50,100 100,100 126,86 L126,104 L26,104 Z', dw, 0.85) + F('M40,60 C60,56 90,56 110,62 L110,66 C90,62 60,62 40,66 Z', '#ffffff', 0.35), 2.4);
      // neck ruff + head
      s += P(shag(114, 67, 15, 17, 12, 0.07, 13), c.cel(wool), 2.2) + L('M108,60 q3,-3 6,0 M112,72 q3,-3 6,0 M104,68 q3,-3 6,0', dw, 1.2);
      var h = '', hd = 'M117,50 C120,41 131,39 138,45 L149,58 C152,62 150,69 143,69 C137,69 131,65 127,61 C121,57 115,56 117,50 Z';
      h += body(c, hd, face, F('M136,40 L156,40 L156,72 L144,72 C150,62 146,52 136,40 Z', dk(face, 0.22), 0.8) + F('M140,64 C144,68 150,68 152,62 L152,72 L138,72 Z', lt(face, 0.4), 0.8), 2.3);
      h += E(133, 50, 2.6, 1.9, '#e8b020', 1) + R(131.6, 49.4, 2.8, 1.2, OL) + E(147.5, 61, 1.3, 0.9, OL) + L('M145,66 L150,65.4', OL, 1.2);
      // ear under the horn
      h += P('M121,52 C114,52 110,56 108,60 C114,60 118,58 122,55 Z', c.cel(face), 1.5);
      // the big curled horn
      var H = taper([[128, 43], [121, 34], [109, 33], [100, 42], [100, 56], [109, 64], [119, 61], [122, 52], [116, 47]], 14, 4, 5);
      h += body(c, H.d, horn, L(bands(H, 2, 1), dk(horn, 0.35), 1.3) + F(ribbonBand(H, 0, 0.3), dk(horn, 0.22), 0.8), 2.2);
      // bridle with bronze studs
      h += L('M122,46 L132,58 L146,66 M132,58 L141,57', OL, 3.2) + L('M122,46 L132,58 L146,66 M132,58 L141,57', '#5a3418', 1.6) + stud(132, 58, 1.6, bronze) + C(145.6, 66, 1.8, bronze, 1);
      s += G(h, at(1.14, 126, 58));
      var em = C(73, 79, 5, c.cel(bronze), 1.4) + L('M70,76 L76,82 M76,76 L70,82', dk(bronze, 0.45), 1.4);
      s += saddle(c, { leather: '#6a3e1e', blanket: red, trim: bronze, metal: '#c8a070', emblem: em, rim: bronze, pattern: L('M52,64 L94,64', dk(red, 0.3), 2) });
      s += leg([[46, 88], [48, 104, 14], [43, 117, 9]], lc) + splitHoof(43, 121, 9.5, '#2a2420');
      s += leg([[110, 88], [113, 104, 13], [115, 117, 9]], lc) + splitHoof(115, 121, 9.5, '#2a2420');
      s += reins([148.4, 67.1], [89, 57], '#5a3418', 6);
      return s;
    },

    /* gnome: a red clockwork trike, a steam tricycle with one big spoked front wheel, two small rear wheels, a red
       riveted chassis with brass trim and a pressure gauge, a little brass boiler puffing steam, handlebars and a footrest */
    mechanostrider: function (c, o) {
      var red = '#b0302a', brass = '#d09a3a', steel = '#aab4be', dst = '#6a7682', tyre = '#2a2622', s = o.icon ? '' : shadow(c, 86, 62);
      // a spoked wheel: tyre, brass rim ring, steel spokes, riveted hub
      var wheel = function (cx, cy, r, sp, rim, spoke, rot) {
        var w = C(cx, cy, r, tyre, 2.2) + L('M' + pt([cx - r * 0.72, cy - r * 0.62]) + 'A' + n(r - 1.6) + ',' + n(r - 1.6) + ' 0 0,1 ' + pt([cx + r * 0.5, cy - r * 0.82]), lt(tyre, 0.3), 1.2, 0.8);
        var ri = r - 4.2, ring = ellD(cx, cy, ri, ri), sd = '';
        for (var i = 0; i < sp; i++) { var a = rot + i * 2 * PI / sp; sd += 'M' + pt([cx + Math.cos(a) * 3, cy + Math.sin(a) * 3]) + 'L' + pt([cx + Math.cos(a) * (ri - 1), cy + Math.sin(a) * (ri - 1)]); }
        w += L(sd, OL, 2.8) + L(sd, spoke, 1.2);
        w += L(ring, OL, 4.2) + L(ring, rim, 2.2) + L('M' + pt([cx - ri * 0.7, cy - ri * 0.7]) + 'A' + n(ri) + ',' + n(ri) + ' 0 0,1 ' + pt([cx + ri * 0.2, cy - ri * 0.98]), lt(rim, 0.45), 0.9, 0.9);
        w += C(cx, cy, r * 0.2 + 1.6, c.cel(rim), 1.6) + C(cx, cy, r * 0.07 + 0.6, OL) + C(cx - 1, cy - 1, 0.7, '#ffffff', 0, 0.7);
        return w;
      };
      var rivet = function (x, y) { return C(x, y, 1.2, dk(brass, 0.4)) + C(x - 0.3, y - 0.3, 0.5, lt(brass, 0.55)); };
      // far rear wheel (peeks out behind the near one)
      s += wheel(55, 109, 12, 8, dk(brass, 0.35), dk(steel, 0.4), 0.3);
      // far fork leg
      s += limb('M108,64 L121,98', dk(steel, 0.4), 2.6);
      // boiler: a brass cylinder behind the seat, steel hoops, a short chimney with a flared cap
      s += limb('M33,46 L32,31', dst, 5.2) + P('M26,31 L38,31 L36,26 L28,26 Z', c.cel(brass), 1.6) + L('M28.4,28 L35.6,28', dk(brass, 0.35), 1);
      var bl = 'M24,52 C24,46 28,44 34,44 C40,44 45,46 45,52 L45,86 C45,90 40,92 34,92 C28,92 24,90 24,86 Z';
      s += body(c, bl, brass, F('M37,40 L50,40 L50,96 L38,96 C41,78 41,58 37,40 Z', dk(brass, 0.26), 0.8) + F('M26,50 L30,48 L30,90 L26,88 Z', '#fff4c8', 0.45) +
        L('M24,53 L45,53 M24,84 L45,84', OL, 3.6) + L('M24,53 L45,53 M24,84 L45,84', steel, 1.8), 2.3);
      s += rivet(28, 48.6) + rivet(41, 48.6) + rivet(28, 88.4);
      // boiler pressure gauge
      s += C(30.4, 64, 4.8, c.cel(brass), 1.6) + C(30.4, 64, 3.3, '#f2eee2', 1) + L('M30.4,64 L32.6,61.6', red, 1.2) + C(30.4, 64, 0.8, OL) + L('M28.2,66.4 L29,65.7 M32.6,66.4 L31.8,65.7', dk(steel, 0.3), 0.8);
      // steam puffs from the chimney
      s += C(29, 20, 4.4, '#dfe6ea', 0, 0.8) + C(31.5, 21.5, 2.6, '#ffffff', 0, 0.6) + C(21, 13, 5.4, '#dfe6ea', 0, 0.6) + C(23.5, 11.5, 3, '#ffffff', 0, 0.5) + C(11, 8, 4.2, '#dfe6ea', 0, 0.42);
      // chassis: a red riveted tub from the boiler to the steering head
      var bd = 'M36,70 C36,64 41,62 48,62 L98,63 C105,63 110,67 111,74 C112,84 108,93 102,98 C98,101 92,102 86,102 L46,102 C39,102 34,98 34,90 Z';
      var rv = '';
      [[44, 68.4], [56, 68.6], [92, 69], [102, 70.4], [42, 96], [54, 97.4], [70, 97.6], [86, 97.4], [98, 94]].forEach(function (p) { rv += rivet(p[0], p[1]); });
      s += body(c, bd, red, F('M24,90 C50,99 90,99 118,86 L118,110 L24,110 Z', dk(red, 0.28), 0.85) + F('M40,64 C56,62 80,63 100,64 L100,66.5 C80,65.5 56,65 40,67 Z', '#ffffff', 0.25) +
        L('M36,67 L98,67.6 C105,68 109,71 110.4,76', OL, 5) + L('M36,67 L98,67.6 C105,68 109,71 110.4,76', brass, 2.8) +
        L('M35,93 C38,99 42,100.4 48,100.4 L86,100.4 C94,100.4 100,98 104,94', OL, 5) + L('M35,93 C38,99 42,100.4 48,100.4 L86,100.4 C94,100.4 100,98 104,94', brass, 2.8) +
        P('M50,74 L81,74 C83,74 84,75 84,77 L84,88 C84,90 83,91 81,91 L50,91 C48,91 47,90 47,88 L47,77 C47,75 48,74 50,74 Z', dk(red, 0.1), 1.2) +
        L('M49,76 L82,76', lt(red, 0.25), 0.9, 0.7) + rv, 2.5);
      // dash gauge on the nose
      s += C(91, 81, 5.2, c.cel(brass), 1.6) + C(91, 81, 3.6, '#f2eee2', 1) + L('M91,81 L93.4,78.6', red, 1.2) + C(91, 81, 0.8, OL);
      // gear emblem on the side panel
      var cog = '';
      for (var i = 0; i < 8; i++) { var a = i * PI / 4; cog += 'M' + pt([65.5 + Math.cos(a) * 4, 83 + Math.sin(a) * 4]) + 'L' + pt([65.5 + Math.cos(a) * 6.4, 83 + Math.sin(a) * 6.4]); }
      s += L(cog, OL, 4.4) + L(cog, brass, 2.4) + C(65.5, 83, 4.6, c.cel(brass), 1.4) + C(65.5, 83, 1.6, dk(red, 0.2), 1);
      // the seat
      var sd = { leather: '#8a2a2a', metal: steel, rim: brass, noStirrup: true, cantle: 10 };
      s += saddle(c, sd);
      // footrest for the rider
      s += limb('M84,90 L88,95', dst, 2.4) + P('M81,94 L97,94 L96,98 L82,98 Z', c.cel(steel), 1.4) + L('M84,96 L94,96', dk(steel, 0.4), 0.8);
      // drive: a little steam cylinder on the rear axle
      s += P('M58,98 L72,98 L72,104 L58,104 Z', c.cel(dst), 1.4) + limb('M58,101 L49,105', steel, 1.8);
      // near rear wheel
      s += wheel(46, 108, 13, 8, brass, steel, 0.1);
      s += C(49, 105, 1.6, lt(steel, 0.2), 1);
      // front mudguard over the big wheel
      var fg = 'M' + pt([120 + Math.cos(-2.05) * 28, 97 + Math.sin(-2.05) * 28]) + 'A28,28 0 0,1 ' + pt([120 + Math.cos(-0.35) * 28, 97 + Math.sin(-0.35) * 28]);
      // big front wheel
      s += wheel(120, 97, 24, 12, brass, steel, 0.12);
      s += L(fg, OL, 7.4) + L(fg, red, 4) + L('M' + pt([120 + Math.cos(-1.9) * 29, 97 + Math.sin(-1.9) * 29]) + 'A29,29 0 0,1 ' + pt([120 + Math.cos(-1.1) * 29, 97 + Math.sin(-1.1) * 29]), lt(red, 0.35), 1.1, 0.8);
      // near fork leg, steering head, handlebars (the grip sits where the rider's hands go)
      s += limb('M109,63 L120,97', steel, 3.4) + L('M108.4,64 L118.6,93', lt(steel, 0.35), 1, 0.8) + C(120, 97, 2.2, c.cel(brass), 1.2);
      s += P('M105,58 L112,57 L113,68 L107,69 Z', c.cel(brass), 1.6) + L('M106,63 L112.6,62', dk(brass, 0.4), 1);
      var hb = 'M109,58 L101,51 L90,52';
      s += L(hb, OL, 4.8) + L(hb, steel, 2.4) + E(88, 52, 3, 2, '#3a2a20', 1.2);
      return s;
    },

    /* wood elf: a smoky grey rosetted forest cat in a teal and silver moon-crested saddle */
    nightsaber: function (c, o) {
      var col = '#86878c', st = '#34343a', bel = '#d4d2cc', teal = '#2a7a7c', silver = '#dce4ec', s = o.icon ? '' : shadow(c, 82, 58), dc = dk(col, 0.28);
      // leopard-like rosette: a broken dark ring round a slightly darker centre
      var ros = function (x, y, r, a) {
        var o2 = E(x, y, r * 0.7, r * 0.56, dk(col, 0.14), 0, 0.9), k;
        for (k = 0; k < 3; k++) { var a0 = (a || 0) + k * 2.1, a1 = a0 + 1.45; o2 += L('M' + pt([x + Math.cos(a0) * r, y + Math.sin(a0) * r * 0.8]) + 'A' + n(r) + ',' + n(r * 0.8) + ' 0 0 1 ' + pt([x + Math.cos(a1) * r, y + Math.sin(a1) * r * 0.8]), st, r * 0.42); }
        return o2;
      };
      var rosList = function (list) { return list.map(function (q) { return ros(q[0], q[1], q[2], q[3]); }).join(''); };
      s += leg([[56, 86], [60, 102, 11], [52, 116, 8]], dc) + paw(52, 121, dk(col, 0.4));
      s += leg([[104, 86], [108, 102, 10], [106, 116, 8]], dc) + paw(106, 121, dk(col, 0.4));
      s += C(58, 104, 1.8, st) + C(55, 111, 1.5, st) + C(106, 100, 1.8, st) + C(107, 108, 1.5, st);
      // tail, curling up behind
      var T = taper([[40, 68], [28, 64], [18, 52], [18, 38], [26, 30]], 10, 5.6, 5);
      s += body(c, T.d, col, rosList([[36, 64, 3, 0.3], [26, 58, 2.8, 1.2], [20, 48, 2.6, 2], [20, 38, 2.2, 0.6]]) + F(tipD(T, 16), st, 0.95) + F(ribbonBand(T, 0.6, 1), dk(col, 0.22), 0.6), 2);
      // body
      var bd = 'M34,76 C32,62 44,57 56,58 C70,61 86,61 100,58 C112,56 124,62 126,72 C128,84 120,93 108,94 C96,96 84,92 70,95 C56,97 42,95 36,88 Z';
      var spots = rosList([[42, 70, 4, 0.2], [50, 80, 4.4, 1], [44, 88, 3.4, 2], [56, 66, 3.6, 2.4], [62, 88, 4, 0.6], [100, 70, 4.2, 1.4], [110, 66, 3.8, 0.4], [106, 80, 4.4, 2.2], [118, 74, 3.6, 1], [96, 88, 3.8, 0.2], [114, 88, 3.2, 1.8], [74, 90, 3.4, 1.2], [86, 92, 3.2, 2.6]]);
      s += body(c, bd, col, F('M28,86 C50,100 96,100 130,88 L130,106 L28,106 Z', bel, 0.9) + spots + F('M40,58 C54,56 70,62 86,62 L86,66 C70,66 54,62 40,64 Z', lt(col, 0.2), 0.5), 2.4);
      // shoulder
      s += P('M122,76 C122,64 112,58 102,62 C110,64 114,70 114,80 Z', c.cel(col), 1.8) + ros(114, 68, 3.2, 0.8);
      // head (facing right)
      var h = '';
      h += P('M126,56 C124,44 132,42 136,52 Z', c.cel(dk(col, 0.15)), 1.8);
      var hd = 'M112,64 C114,54 126,50 136,53 C142,55 148,58 152,62 C157,65 160,71 158,76 C156,82 150,85 143,84 C135,88 123,86 117,80 C112,75 110,69 112,64 Z';
      h += body(c, hd, col, F('M112,54 L126,54 C116,62 116,78 124,88 L110,88 Z', dk(col, 0.22), 0.7) + F('M158,74 C152,83 142,86 130,84 L126,78 C136,80 146,78 154,70 Z', bel, 0.95) +
        C(126, 56, 1.4, st) + C(131, 55, 1.3, st) + C(136, 57, 1.2, st) + C(129, 60, 1.2, st) + ros(118, 70, 3, 1.1) + ros(120, 79, 2.6, 2.3) + C(140, 58, 1, st), 2.2);
      h += P('M118,58 C118,46 128,46 128,56 Z', c.cel(col), 1.8) + P('M120.6,56 C121,50 125.6,50 125.8,55 Z', '#3a2a2a', 0);
      h += P('M158,72 C158,66 150,64 145,67 C142,70 143,76 147,78 C152,80 158,77 158,72 Z', bel, 1.4) + P('M159,67.6 L153,66.4 L154.6,71.4 Z', '#2e2626', 1.2);
      h += L('M156,78 Q151,81 145,78', OL, 1.4) + P('M153,79 L152,84.4 L150.4,79.4 Z', '#fff', 0.8) + P('M148,79.2 L147,83.6 L145.6,79 Z', '#fff', 0.8);
      h += L('M149,61 L136.6,63', OL, 2.4) + glowEye(c, 142.6, 66, 2.2, '#a8ff9a') + L('M147,66.4 L138.6,66.4', OL, 0.8);
      h += L('M148,74 l10,-3 M148,76 l10,2', '#ffffff', 0.8, 0.9);
      s += h;
      // saddle: teal blanket with silver trim and a crescent moon
      var em = P('M78,72 C72,72 68,76 68,80 C68,85 72,88 78,88 C74,86 72,83 72,80 C72,76 74,73 78,72 Z', c.cel(silver), 1.3) + C(80, 76, 0.9, silver) + C(82, 81, 0.7, silver);
      var pat = L('M52,66 C60,70 66,64 72,68 C78,72 86,64 94,68', lt(teal, 0.3), 1.2, 0.8);
      s += saddle(c, { leather: '#3a3234', blanket: teal, trim: silver, metal: silver, emblem: em, rim: silver, pattern: pat });
      s += leg([[46, 86], [52, 102, 13], [44, 116, 9]], col) + paw(46, 121, dk(col, 0.35));
      s += leg([[116, 86], [118, 102, 12], [122, 116, 9]], col) + paw(124, 121, dk(col, 0.35));
      s += ros(48, 100, 3, 0.4) + C(44, 109, 1.8, st) + ros(117, 98, 3, 1.6) + C(119, 107, 1.8, st);
      // silver bridle + reins
      s += L('M126,58 L138,72 L146,80 M138,72 L148,70', OL, 3.2) + L('M126,58 L138,72 L146,80 M138,72 L148,70', silver, 1.5) + C(146, 80, 1.8, silver, 1);
      s += reins([146, 80], [89, 57], teal, 4);
      return s;
    },

    /* orc: a big shaggy grey wolf with a red leather saddle, iron studs and a spiked collar */
    wolf: function (c, o) {
      var col = '#8e8a88', dc = dk(col, 0.3), bel = '#cfcac2', red = '#a82018', iron = '#5a5a60', s = o.icon ? '' : shadow(c, 82, 56);
      s += leg([[56, 86], [60, 102, 11], [52, 116, 7.5]], dc) + paw(52, 121, dk(col, 0.45));
      s += leg([[104, 86], [107, 102, 10], [105, 116, 7.5]], dc) + paw(105, 121, dk(col, 0.45));
      // bushy tail hanging back
      var tl = 'M42,62 C32,62 22,70 18,80 L12,83 L17,87 C15,92 14,97 15,101 L10,105 L16,107 C18,111 23,114 29,112 C27,106 28,100 29,94 C30,86 34,78 44,74 Z';
      s += body(c, tl, col, F('M28,70 C24,80 24,96 28,114 L44,114 L44,70 Z', dk(col, 0.25), 0.8) + F('M12,100 C14,108 20,114 28,114 L30,106 C24,108 18,104 16,98 Z', bel, 0.95) +
        L('M24,76 l4,4 M20,88 l5,3 M20,98 l5,2 M30,70 l4,4', dk(col, 0.35), 1.2), 2.2);
      // shaggy body
      var bd = shag(76, 77, 44, 19, 16, 0.07, 41);
      s += body(c, bd, col, F('M28,88 C50,100 100,100 126,88 L126,106 L28,106 Z', bel, 0.85) + F('M36,58 C56,52 90,52 116,60 L116,66 C90,60 56,60 36,66 Z', dk(col, 0.3), 0.8) +
        L('M44,74 l6,4 M60,82 l6,4 M92,80 l6,4 M104,70 l5,4', dk(col, 0.3), 1.2), 2.4);
      // chest ruff
      s += P(shag(114, 74, 14, 18, 9, 0.16, 47), c.cel(lt(col, 0.1)), 2.2) + L('M110,68 l4,4 M112,80 l4,4 M118,72 l3,4', dk(col, 0.25), 1.2);
      // head
      var hd = 'M116,50 C120,42 132,40 140,46 L156,55 C160,57 160,62 157,64 L146,68 C138,72 124,72 118,66 C113,62 112,56 116,50 Z';
      s += P('M126,46 L126,30 L134,42 Z', c.cel(dc), 1.6);
      s += body(c, hd, col, F('M138,40 L162,40 L162,72 L146,72 C152,62 148,52 138,40 Z', dk(col, 0.22), 0.8) + F('M140,62 C148,64 154,62 160,60 L160,72 L136,72 Z', bel, 0.9) + F('M118,48 C124,42 134,42 140,46 L140,50 C132,46 124,46 118,52 Z', dk(col, 0.3), 0.7), 2.3);
      s += P('M119,46 L117,30 L127,42 Z', c.cel(col), 1.6) + F('M120,43 L119.4,34 L124.6,41 Z', '#4a2a2a');
      s += E(157.4, 56.6, 2, 1.6, OL) + L('M144,64 L157,61', OL, 1.4) + P('M148,63 L149,66.6 L150.4,62.6 Z M153,62 L154,65.4 L155.2,61.6 Z', '#fff', 0.7);
      s += L('M126,49 L140,51', OL, 2.2) + E(135, 52.6, 2.6, 1.8, '#f0c020', 1) + E(135, 52.6, 0.7, 1.5, OL);
      // spiked collar
      var cl = 'M112,58 C116,66 120,70 124,72';
      s += limb(cl, iron, 4) + spikes([[113.4, 59.4, -2.4], [117, 65, -2.8], [121.4, 69.6, -3.1]], 6, '#c8ccd2');
      // bridle
      s += L('M122,46 L132,60 L146,66 M132,60 L144,58', OL, 3.2) + L('M122,46 L132,60 L146,66 M132,60 L144,58', '#3a2418', 1.6) + C(146, 66, 1.8, '#9aa0a8', 1);
      // red saddle with iron studs and a black trim
      var em = P('M68,74 L78,74 L76,84 L73,87 L70,84 Z', c.cel(iron), 1.4) + P('M73,76 L75.4,80 L73,84 L70.6,80 Z', red, 0.8);
      s += saddle(c, { leather: '#4a2618', blanket: red, trim: '#2a1a14', metal: '#9aa0a8', emblem: em, rim: iron, pattern: studRow([54, 64], [90, 63], 6, 1.2, '#b8bcc4') });
      s += spikes([[57, 52, -2.2], [60, 51, -1.9]], 6, '#c8ccd2');
      s += leg([[46, 86], [52, 102, 13], [44, 116, 8.5]], col) + paw(46, 121, dk(col, 0.4));
      s += leg([[114, 86], [117, 102, 12], [120, 116, 8.5]], col) + paw(122, 121, dk(col, 0.4)) + claws(122, 121) + claws(46, 121);
      s += reins([146, 66], [89, 57], '#3a2418', 5);
      return s;
    },

    /* troll: a green-and-orange riding raptor with a red crest and a bone-trimmed saddle */
    raptor: function (c, o) {
      var col = '#5a9a3a', st = '#e8781a', bel = '#dcd896', dc = dk(col, 0.28), s = o.icon ? '' : shadow(c, 74, 48);
      var teal = '#2a8a8a', red = '#8a2a1a', bone = '#ece2c6';
      // far leg
      s += E(80, 86, 10, 11, c.cel(dc), 2) + leg([[82, 90], [74, 104, 6], [84, 114, 5], [82, 117, 4.4]], dc, false) + birdFoot(82, 121, dk(col, 0.45), '#f4ecd6');
      // tail
      var T = taper([[50, 72], [34, 70], [20, 62], [6, 52]], 22, 3, 5);
      s += body(c, T.d, col, L('M40,64 L36,76 M28,60 L24,70 M18,54 L14,62', st, 3) + F(ribbonBand(T, 0, 0.35), bel, 0.8), 2.2);
      // body
      var bd = 'M44,72 C44,62 56,58 74,58 C92,58 106,62 110,72 C112,84 102,94 82,95 C62,96 46,88 44,72 Z';
      s += body(c, bd, col, L('M56,60 L52,72 M92,60 L96,72 M102,64 L106,74', st, 3.2) + F('M36,80 C50,96 90,100 116,82 L116,104 L36,104 Z', bel, 0.9), 2.4);
      // neck
      var N = taper([[100, 76], [112, 64], [118, 52], [126, 42]], 24, 15, 5);
      s += body(c, N.d, col, F(ribbonBand(N, 0, 0.32), bel, 0.85) + L('M112,56 L120,60 M108,66 L116,70', st, 2.6), 2.3);
      // head: long jaw to the right, crest on top
      s += P('M120,32 L112,12 L122,24 L124,8 L130,24 L138,14 L136,30 Z', c.cel('#d8401e'), 1.5);
      var hd = 'M120,36 C124,28 138,27 146,32 L156,40 C159,42 159,46 155,47 L144,49 C138,53 128,53 124,50 C118,46 116,42 120,36 Z';
      s += body(c, hd, col, F('M140,26 L162,26 L162,54 L148,54 C154,44 150,36 140,26 Z', dk(col, 0.22), 0.8) + L('M130,30 L126,36 M136,29 L134,35', st, 2.2) + F('M156,45 C150,48 140,50 128,50 L128,56 L158,56 Z', bel, 0.9), 2.3);
      s += P('M154,46 L144,47.6 C140,50 134,51 130,50 L132,53 C140,54 150,52 154,48 Z', '#5a1a14', 1.2) + P('M151,46.6 L150,49.2 L148.6,46.8 Z M146,47.2 L145,50 L143.6,47.6 Z M140,48.6 L139,51 L137.6,48.8 Z', '#fff', 0.6);
      s += L('M144,32 L132,34', OL, 2.2) + E(137, 36.4, 2.3, 1.8, '#ffe040', 1) + E(137.4, 36.4, 0.6, 1.4, OL) + E(154, 40.4, 1, 0.8, OL);
      // bone-bead bridle
      s += L('M126,34 L132,46 L144,48', OL, 3.2) + L('M126,34 L132,46 L144,48', '#5a3418', 1.6) + E(129, 40, 1.6, 2.4, bone, 1) + C(144, 48.4, 1.8, bone, 1);
      // little arms
      s += limb('M106,80 L114,88 L118,86', col, 4) + L('M118,86 l4,-2 M118,86 l4,1 M117,87 l2,4', OL, 1.6);
      // troll saddle: red blanket, teal zigzag, a tusk on each end
      var zz = '', i;
      for (i = 0; i < 8; i++) zz += (i ? 'L' : 'M') + pt([52 + i * 6, 74 + (i % 2 ? -4 : 3)]);
      var em = P('M64,80 C66,86 74,88 80,84 C76,84 70,84 66,80 Z', c.cel(bone), 1.2) + C(73, 78, 2.2, c.cel(teal), 1.1);
      s += saddle(c, { leather: '#6a3a1c', blanket: red, trim: teal, metal: bone, emblem: em, rim: bone, pattern: L(zz, OL, 4.2) + L(zz, teal, 2.2) });
      s += P('M53,59 C47,54 46,49 49,45 C50,50 53,54 57,57 Z', c.cel(bone), 1.3) + P('M92,60 C97,57 99,53 98,49 C96,53 93,56 89,58 Z', c.cel(bone), 1.3);
      // near leg
      s += body(c, ellD(66, 84, 14, 13), col, L('M58,76 L66,90 M66,74 L72,86', st, 2.6) + F('M52,88 C60,98 74,98 82,88 L82,100 L52,100 Z', dk(col, 0.2), 0.7), 2.2);
      s += leg([[68, 92], [58, 106, 7], [66, 115, 5.6], [64, 117, 5]], col, false) + birdFoot(64, 121, dk(col, 0.4), '#f4ecd6');
      s += reins([144, 48.4], [89, 57], '#5a3418', 6);
      return s;
    },

    /* hornfolk: a massive grey dustback (armoured, scute-backed lizard-beast, small brow horns, clubbed tail) with a wooden howdah-like saddle, painted cloth and feathers */
    kodo: function (c, o) {
      var col = '#8c857c', dc = dk(col, 0.28), bel = '#b4ac9e', plate = '#6a6258', wood = '#8a5a30', red = '#b4402a', cream = '#ecc878', s = o.icon ? '' : shadow(c, 80, 66);
      // far legs: thick columns with toenails
      var foot = function (x, cc) { return P('M' + pt([x - 9, 116]) + 'L' + pt([x + 9, 116]) + 'L' + pt([x + 10.4, 122]) + 'L' + pt([x - 10, 122]) + 'Z', cc, 2) + E(x - 4, 121, 2.4, 1.6, '#e8dcc0', 1) + E(x + 2, 121, 2.4, 1.6, '#e8dcc0', 1) + E(x + 7.6, 121, 2, 1.5, '#e8dcc0', 1); };
      s += leg([[52, 90], [52, 104, 18], [52, 116, 16]], dc) + foot(52, dk(dc, 0.1));
      s += leg([[100, 90], [101, 104, 18], [101, 116, 16]], dc) + foot(101, dk(dc, 0.1));
      // short thick tail ending in a bony club
      s += limb('M24,72 C14,76 10,84 10,92', col, 7) + body(c, 'M4,94 C3,88 10,86 15,89 C19,92 18,100 12,102 C7,103 4,99 4,94 Z', plate, E(10, 93, 2, 1.4, lt(plate, 0.4), 0, 0.8) + P('M4,95 L0,93 L4,91 Z', '#e8dcc0', 0), 2);
      // huge body with a shoulder hump
      var bd = 'M18,82 C14,64 24,52 40,52 C54,52 62,58 76,58 C90,58 100,46 114,46 C130,46 138,62 136,80 C134,96 122,102 106,102 C88,104 64,104 44,102 C28,100 20,94 18,82 Z';
      var wr = L('M28,72 C32,76 32,84 28,90 M40,74 C44,80 44,88 40,94 M112,58 C116,64 118,72 116,80 M122,56 C126,64 128,72 126,82', dk(col, 0.25), 1.3, 0.9);
      s += body(c, bd, col, wr + F('M12,92 C40,108 110,110 140,90 L140,110 L12,110 Z', bel, 0.85) + F('M22,62 C30,54 44,52 56,56 L56,60 C44,56 32,58 24,66 Z', lt(col, 0.2), 0.6), 2.6);
      // armoured back: scute plates over the rump and the shoulder hump, bony knobs along the flank
      var scu = function (list) { return list.map(function (q) { return body(c, ellD(q[0], q[1], q[2], q[3]), plate, C(q[0], q[1] - q[3] * 0.25, q[3] * 0.34, lt(plate, 0.35), 0, 0.9), 1.6); }).join(''); };
      s += scu([[26, 62, 6.4, 4.2], [36, 56, 6.8, 4.4], [24, 74, 5, 3.6], [100, 50, 6.6, 4.2], [112, 47, 7, 4.4], [124, 52, 6.4, 4.2], [130, 62, 5, 3.6]]);
      [[22, 86], [30, 92], [122, 76], [130, 82]].forEach(function (g) { s += P('M' + (g[0] - 3.6) + ',' + (g[1] - 1) + ' L' + g[0] + ',' + (g[1] + 5) + ' L' + (g[0] + 3.6) + ',' + (g[1] - 1) + ' Z', c.cel('#e8dcc0'), 1.3); });
      // head: heavy, low, beaked
      var hd = 'M114,60 C118,50 132,46 144,52 C152,56 156,64 158,74 C160,84 156,94 148,98 C142,101 134,98 130,92 C124,86 116,80 114,72 Z';
      s += body(c, hd, col, F('M146,48 L164,48 L164,104 L148,104 C158,90 156,64 146,48 Z', dk(col, 0.25), 0.8) + L('M122,62 C126,68 128,76 126,84', dk(col, 0.28), 1.3) + F('M150,88 C152,94 148,100 140,100 L136,104 L156,104 Z', bel, 0.9), 2.5);
      // lizard mouth line and nostril
      s += L('M136,90 C142,94 150,95 157,90', OL, 1.5) + E(154, 78, 1.3, 2, OL);
      // small armour plates over the skull, then a short horn swept back above the eye
      s += P('M112,60 C112,48 122,42 134,44 C142,45 148,50 150,56 C142,52 134,52 126,56 C120,58 116,62 114,66 Z', c.cel(plate), 1.8) + L(ellD(124, 50, 4.4, 2.6) + ellD(136, 48.6, 4.4, 2.6), dk(plate, 0.4), 1.1);
      var hn = 'M136,58 C134,52 130,47 123,44 C129,49 130,54 130,60 Z';
      s += P(hn, c.cel('#e8dcc0'), 1.8) + L('M130,51 L133,50', dk('#e8dcc0', 0.35), 1.1);
      s += L('M138,66 L148,68', OL, 2.2) + E(144, 70.4, 2, 1.5, '#e8a020', 1) + E(144.4, 70.4, 0.6, 1.2, OL);
      // howdah: cloth blanket with a zigzag border, wooden frame, feathers
      var bl = 'M44,57 L102,54 C106,68 106,82 104,94 C84,100 62,100 44,94 C40,82 40,68 44,57 Z';
      var zz = '', i;
      for (i = 0; i < 11; i++) zz += (i ? 'L' : 'M') + pt([46 + i * 5.6, 88 + (i % 2 ? -4 : 1)]);
      s += body(c, bl, red, F('M44,84 L106,84 L106,100 L44,100 Z', cream, 0.95) + L(zz, OL, 2.8) + L(zz, red, 1.4) + F('M84,50 L110,50 L110,100 L88,100 C96,80 94,64 84,50 Z', dk(red, 0.3), 0.5) + L('M48,64 L102,62', cream, 2), 2.2);
      s += F('M62,72 L72,66 L82,72 L72,78 Z', cream) + F('M66,72 L72,68.6 L78,72 L72,75.4 Z', '#2a6a8a');
      // wooden frame: back rail + posts + front rail
      s += limb('M42,60 L36,42', wood, 4) + limb('M104,57 L108,48', wood, 3.6) + limb('M37,46 C44,46 50,50 54,56', wood, 3.4);
      s += P('M31,38 L39,37 L40,43 L32,44 Z', c.cel(dk(wood, 0.1)), 1.4) + P('M104,45 L112,45 L112,49 L104,49 Z', c.cel(dk(wood, 0.1)), 1.4);
      var fth = function (x, y, a, cc) { var q = dirQ([x, y], a); return P(pd([q(0, 0), q(6, -3), q(16, -2), q(20, 0), q(16, 2), q(6, 3)], true), c.cel(cc), 1.2) + L('M' + pt(q(1, 0)) + 'L' + pt(q(18, 0)), dk(cc, 0.4), 0.8); };
      s += fth(34, 40, -2.2, '#f0ece0') + fth(38, 40, -1.8, red) + fth(110, 47, -1.1, '#f0ece0');
      s += saddle(c, { leather: '#6a3a1c', metal: '#c8a070', rim: cream, cantle: 6, pommel: 5 });
      // near legs
      s += leg([[40, 92], [40, 106, 20], [40, 116, 18]], col) + foot(40, dk(col, 0.1));
      s += leg([[112, 92], [114, 106, 19], [114, 116, 17]], col) + foot(114, dk(col, 0.1));
      // rope halter round the snout + reins
      s += L('M148,72 C150,80 150,88 146,96', OL, 3.2) + L('M148,72 C150,80 150,88 146,96', '#8a6a3a', 1.6) + C(148, 86, 2, c.cel('#c8a070'), 1);
      s += reins([148, 86], [89, 57], '#5a3418', 10);
      return s;
    },

    /* undead: a skeletal horse, bones over a dark void, purple glow, tattered barding and a black spiked saddle */
    skeletal_horse: function (c, o) { return skelHorse(c, o, SKEL_VOID); },
    /* the Wickless Steed (Lanternwake, v10.13): the same bones, burning lantern-gold in a night-blue void, a lantern
       hung from the saddle */
    wickless_steed: function (c, o) { return skelHorse(c, o, SKEL_WICK); },
    /* the Trialsworn charger and its Trial 15 and Trial 20 tiers (drawn by twCharger) */
    trialsworn_charger: function (c, o) { return twCharger(c, o, 0); },
    trialsworn_charger_t15: function (c, o) { return twCharger(c, o, 1); },
    trialsworn_charger_t20: function (c, o) { return twCharger(c, o, 2); },
    /* the Twelvefold Charger, the first year's mount (drawn by twYear) */
    trialsworn_year1: function (c, o) { return twYear(c, o); }
  };
  // neutral placeholder: a plain grey saddled beast
  function phMount(c) {
    var col = '#8a8a92';
    return shadow(c, 80, 50) + leg([[52, 84], [52, 117, 8]], dk(col, 0.25), false) + leg([[104, 84], [104, 117, 8]], dk(col, 0.25), false) +
      P('M36,76 C34,60 50,56 72,58 C96,56 118,58 120,76 C122,92 104,96 78,96 C52,96 38,92 36,76 Z', col, 2.4) + P('M112,64 C114,48 126,40 138,44 C146,48 146,58 138,62 C130,66 122,70 118,74 Z', col, 2.2) +
      saddle(c, { leather: '#6a6a72', metal: '#b0b0b8' }) + leg([[44, 84], [44, 117, 9]], col, false) + leg([[112, 84], [112, 117, 9]], col, false);
  }
  function safeMount(k) {
    try {
      var c = new Ctx();
      var f = typeof k === 'string' && Object.prototype.hasOwnProperty.call(MOUNTS, k) ? MOUNTS[k] : null;
      return c.svg(160, 128, f ? f(c, {}) : phMount(c));
    } catch (e) {
      try { var c2 = new Ctx(); return c2.svg(160, 128, phMount(c2)); } catch (e2) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 128" width="160" height="128"></svg>'; }
    }
  }
  ART.mount = function (key) { return safeMount(key); };

  /* ================= icons ================= */
  function iconWrap(c, bg, glyph) {
    return R(0, 0, 64, 64, c.rg([[0, bg[0]], [1, bg[1]]], 0.42, 0.38, 0.75)) + glyph +
      R(0, 0, 64, 64, c.rg([[0.62, '#000', 0], [1, '#000', 0.5]], 0.5, 0.5, 0.72)) +
      '<rect x="1.5" y="1.5" width="61" height="61" fill="none" stroke="#0b0806" stroke-width="3"/>' +
      L('M3.8,60.2 L3.8,3.8 L60.2,3.8', '#ffffff', 1.6, 0.4) + L('M3.8,60.2 L60.2,60.2 L60.2,3.8', '#000000', 1.6, 0.55);
  }
  // mount icons: the mount's own drawing, zoomed onto its head and shoulders ([focus x, focus y, zoom], background)
  var FOCUS = {
    horse: [134, 33, 0.98, ['#4a74c8', '#0c1430']],
    ram: [126, 52, 1.0, ['#8ab0d0', '#10202e']],
    mechanostrider: [84, 64, 0.45, ['#3aa0b0', '#061c22']],
    nightsaber: [134, 68, 1.08, ['#6a8a8e', '#0a1416']],
    wolf: [134, 58, 1.06, ['#c83a24', '#240604']],
    raptor: [134, 38, 1.04, ['#8ac848', '#0e2408']],
    kodo: [132, 70, 0.96, ['#d0a060', '#281808']],
    skeletal_horse: [134, 36, 1.02, ['#7a3ab0', '#0e0418']],
    wickless_steed: [134, 36, 1.02, ['#c07a20', '#0a0e1e']],
    trialsworn_charger: [127, 44, 0.8, ['#b8964a', '#101a3c']],
    trialsworn_charger_t15: [127, 44, 0.8, ['#d8b860', '#101a3c']],
    trialsworn_charger_t20: [127, 44, 0.8, ['#fff0b0', '#1a2450']]
  };
  var ICONS = {};
  Object.keys(FOCUS).forEach(function (k) {
    ICONS['mount_' + k] = function (c) {
      var f = FOCUS[k], z = f[2];
      return iconWrap(c, f[3], G(MOUNTS[k](c, { icon: true }), 'matrix(' + z + ',0,0,' + z + ',' + n(32 - f[0] * z) + ',' + n(32 - f[1] * z) + ')'));
    };
  });
  /* the Twelvefold Charger: its crowned head and the hourglass in front of a ring of the twelve month colours */
  ICONS.mount_trialsworn_year1 = function (c) {
    var ring = '', z = 0.7, fx = 128, fy = 45;
    for (var i = 0; i < 12; i++) {
      var a0 = -PI / 2 + i * PI / 6 + 0.03, a1 = a0 + PI / 6 - 0.06, r0 = 23, r1 = 29;
      ring += P('M' + pt([32 + Math.cos(a0) * r1, 32 + Math.sin(a0) * r1]) + 'A' + r1 + ',' + r1 + ' 0 0,1 ' + pt([32 + Math.cos(a1) * r1, 32 + Math.sin(a1) * r1]) +
        'L' + pt([32 + Math.cos(a1) * r0, 32 + Math.sin(a1) * r0]) + 'A' + r0 + ',' + r0 + ' 0 0,0 ' + pt([32 + Math.cos(a0) * r0, 32 + Math.sin(a0) * r0]) + 'Z', TW_YEAR1[i][0], 0, 0.9);
    }
    return iconWrap(c, ['#5a4a9a', '#0c0a24'], G(ring, '', 0.85) + G(twYear(c, { icon: true }), 'matrix(' + z + ',0,0,' + z + ',' + n(32 - fx * z) + ',' + n(32 - fy * z) + ')'));
  };
  /* riding skill: a leather saddle with a stirrup, a steel horseshoe in front */
  ICONS.riding = function (c) {
    var lea = '#8a5028', steel = '#c8ccd4';
    var z = 1.08, g = G(saddle(c, { leather: lea, metal: '#d8dce2', rim: '#e0b040' }), 'matrix(' + z + ',0,0,' + z + ',' + n(25 - 73 * z) + ',' + n(30 - 68 * z) + ')');
    var hs = 'M-12,12 C-16,2 -14,-12 0,-14 C14,-12 16,2 12,12 L6,12 C9,4 8,-7 0,-8 C-8,-7 -9,4 -6,12 Z';
    var shoe = P(hs, c.cel(steel), 2.2) + L('M-10,6 L-10.4,4 M-11,-2 L-11,-4 M10,6 L10.4,4 M11,-2 L11,-4 M-4,-11 L-2,-11.4 M4,-11 L2,-11.4', OL, 1.6) + L('M-9,-5 C-8,-9 -4,-11 0,-11.4', '#ffffff', 1.2, 0.6);
    return iconWrap(c, ['#c08040', '#2a1406'], g + G(shoe, 'translate(46,44) rotate(-20) scale(0.95)'));
  };

  /* the Trialsworn emblem, used for the Trials rewards: a gold hourglass with glowing sand on midnight blue */
  ICONS.trialsworn_hourglass = function (c) {
    var sp = function (x, y, r) { return P('M' + pt([x, y - r]) + 'L' + pt([x + r * 0.55, y]) + 'L' + pt([x, y + r]) + 'L' + pt([x - r * 0.55, y]) + 'Z', '#fff4c8', 0.9); };
    return iconWrap(c, ['#3a52a0', '#080e24'], L(ellD(32, 32, 26, 26), '#e0b040', 1.4, 0.55) +
      hglass(c, 32, 32, 19, 1, 0) + sp(12, 16, 2.6) + sp(52, 22, 2.2) + sp(50, 50, 1.8) + sp(14, 47, 1.6));
  };

  /* ================= extend the public API ================= */
  var has = function (t, k) { return typeof k === 'string' && Object.prototype.hasOwnProperty.call(t, k); };
  function phIcon(c) { return iconWrap(c, ['#5a5a62', '#1a1a1e'], C(32, 32, 12, '#8a8a92', 2)); }
  function makeIcon(k) {
    try { var c = new Ctx(); return c.svg(64, 64, ICONS[k](c)); } catch (e) {
      try { var c2 = new Ctx(); return c2.svg(64, 64, phIcon(c2)); } catch (e2) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><rect width="64" height="64" fill="#444"/></svg>'; }
    }
  }
  var baseIcon = typeof ART.icon === 'function' ? ART.icon : function () { var c = new Ctx(); return c.svg(64, 64, phIcon(c)); };
  ART.icon = function (k) {
    if (has(ICONS, k)) return makeIcon(k);
    try { return baseIcon.apply(this, arguments); } catch (e) { return makeIcon('__none__'); }
  };
  ART.keys = ART.keys || {};
  var il = Array.isArray(ART.keys.icons) ? ART.keys.icons : (ART.keys.icons = []);
  Object.keys(ICONS).forEach(function (k) { if (il.indexOf(k) < 0) il.push(k); });
  var ml = Array.isArray(ART.keys.mounts) ? ART.keys.mounts : (ART.keys.mounts = []);
  Object.keys(MOUNTS).forEach(function (k) { if (ml.indexOf(k) < 0) ml.push(k); });
})(typeof window !== 'undefined' ? window : this);
