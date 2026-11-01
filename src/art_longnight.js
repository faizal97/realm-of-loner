/* art_longnight.js - Longnight, the winter festival (v10.17, docs/plans/2026-11-01-longnight-design.md).
 * Loads after the other packs and EXTENDS window.ART; every other key falls through. Never throws.
 *   ART.scene  shuttered_lane, open_door                                     400x240
 *   ART.mob    ln_frost_hound, ln_frostling, ln_snowman, ln_knocker, ln_uninvited, ln_cold_guest,
 *              snowtuft (the snow fox kit companion, drawn small by the UI)   128x128, facing left
 *   ART.icon   ln_kindling, ln_snowball, ln_cocoa, ln_garland, ln_fireworks, ln_costume, ln_stew, ln_coat, ln_trousers,
 *              ln_cloak, companion_snowtuft, event_longnight, ln_door, ln_door_open, ln_hearth,
 *              ln_snow_throw, ln_snow_pack, ln_snow_duck, ln_snow_boulder (the Snowball Brawl kit)   64x64
 *   ART.lnTown(stage)  NEW: a 400x240 transparent overlay for a town scene, stage 0..4 (0 a hearth glow; 1 garlands;
 *              2 music; 3 snow; 4 New Year fireworks). Each stage keeps the ones before it.
 * Palette: night blue, snow white, hearth orange-gold (the warmth), frost cyan (the cold).
 * Style: bold #1a1009 outlines, 2-3 tone cel shading, soft radial glows, no text, no filters, no images.
 * Gradient ids use the prefix lN<counter>_. Contact sheet: node art/longnight/render.js
 */
(function (root) {
  'use strict';
  var W = root || {};
  var ART = W.ART = W.ART || {};
  var UID = 0, OL = '#1a1009';
  var NIGHT = '#16203e', SNOW = '#f4f8fc', SNOW2 = '#cddcec', SNOW3 = '#8ea6c4', FROST = '#7ae0ff', FROST2 = '#3aa0d0', ICE = '#bff0ff';
  var GOLD = '#ffc24a', HEARTH = '#ff9a2a', HEARTH2 = '#e8581a', CORE = '#fff2c0', WOOD = '#6a4226', PINE = '#2f6a3e', RED = '#c0302a';
  function r1(v) { v = +v; return isFinite(v) ? Math.round(v * 10) / 10 : 0; }
  function rgb(c) { c = String(c || '').replace('#', ''); if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2]; var v = parseInt(c, 16); if (isNaN(v)) v = 0x808080; return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; }
  function hex(a) { return '#' + a.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  function mix(a, b, t) { var A = rgb(a), B = rgb(b); return hex([0, 1, 2].map(function (i) { return A[i] + (B[i] - A[i]) * t; })); }
  function lt(c, t) { return mix(c, '#ffffff', t); }
  function dk(c, t) { return mix(c, '#000000', t); }
  function Ctx() { this.u = 'lN' + (++UID).toString(36); this.k = 0; this.defs = []; }
  Ctx.prototype.id = function () { return this.u + '_' + (this.k++).toString(36); };
  Ctx.prototype.grad = function (tag, st, a) {
    var id = this.id();
    this.defs.push('<' + tag + ' id="' + id + '" ' + a + '>' + st.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '/>'; }).join('') + '</' + tag + '>');
    return 'url(#' + id + ')';
  };
  Ctx.prototype.lg = function (st, x1, y1, x2, y2) { return this.grad('linearGradient', st, 'x1="' + (x1 || 0) + '" y1="' + (y1 || 0) + '" x2="' + (x2 == null ? 0 : x2) + '" y2="' + (y2 == null ? 1 : y2) + '"'); };
  Ctx.prototype.rg = function (st, cx, cy, r) { return this.grad('radialGradient', st, 'cx="' + (cx == null ? 0.5 : cx) + '" cy="' + (cy == null ? 0.5 : cy) + '" r="' + (r || 0.5) + '"'); };
  Ctx.prototype.cel = function (c) { return this.lg([[0, lt(c, 0.32)], [0.45, c], [1, dk(c, 0.4)]], 0.2, 0, 0.8, 1); };
  Ctx.prototype.glow = function (c, a) { a = a == null ? 0.6 : a; return this.rg([[0, c, a], [0.4, c, a * 0.4], [1, c, 0]]); };
  Ctx.prototype.clip = function (d) { var id = this.id(); this.defs.push('<clipPath id="' + id + '"><path d="' + d + '"/></clipPath>'); return 'url(#' + id + ')'; };
  Ctx.prototype.svg = function (w, h, body) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">' + (this.defs.length ? '<defs>' + this.defs.join('') + '</defs>' : '') + body + '</svg>'; };
  function P(d, fill, sw, o) { return '<path d="' + d + '" fill="' + fill + '"' + (sw === 0 ? '' : ' stroke="' + OL + '" stroke-width="' + (sw || 2.2) + '" stroke-linejoin="round" stroke-linecap="round"') + (o != null ? ' opacity="' + o + '"' : '') + '/>'; }
  function S(d, col, w, o) { return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + r1(w) + '" stroke-linecap="round" stroke-linejoin="round"' + (o != null ? ' opacity="' + o + '"' : '') + '/>'; }
  function E(x, y, rx, ry, fill, sw, o) { return '<ellipse cx="' + r1(x) + '" cy="' + r1(y) + '" rx="' + r1(rx) + '" ry="' + r1(ry) + '" fill="' + fill + '"' + (sw ? ' stroke="' + OL + '" stroke-width="' + sw + '"' : '') + (o != null ? ' opacity="' + o + '"' : '') + '/>'; }
  function C(x, y, r, fill, sw, o) { return E(x, y, r, r, fill, sw, o); }
  function R(x, y, w, h, fill, o) { return '<rect x="' + r1(x) + '" y="' + r1(y) + '" width="' + r1(w) + '" height="' + r1(h) + '" fill="' + fill + '"' + (o != null ? ' opacity="' + o + '"' : '') + '/>'; }
  function G(body, tf, o) { return '<g' + (tf ? ' transform="' + tf + '"' : '') + (o != null ? ' opacity="' + o + '"' : '') + '>' + body + '</g>'; }
  function CG(body, clip) { return '<g clip-path="' + clip + '">' + body + '</g>'; }
  function L2(x0, y0, x1, y1) { return 'M' + r1(x0) + ',' + r1(y0) + ' L' + r1(x1) + ',' + r1(y1); }
  function rect(x, y, w, h) { return 'M' + r1(x) + ',' + r1(y) + ' L' + r1(x + w) + ',' + r1(y) + ' L' + r1(x + w) + ',' + r1(y + h) + ' L' + r1(x) + ',' + r1(y + h) + ' Z'; }
  function shadow(x, w) { return E(x, 118, w, 6, '#000', 0, 0.28); }
  /* a small seeded random, so every drawing is the same every time */
  function rnd(seed) { var s = (seed || 1) >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  // ---- shared parts
  /* a snowflake: three crossing strokes */
  function flake(x, y, r, col, o) {
    var d = '';
    for (var i = 0; i < 3; i++) { var a = Math.PI * i / 3 + 0.3, dx = Math.cos(a) * r, dy = Math.sin(a) * r; d += L2(x - dx, y - dy, x + dx, y + dy) + ' '; }
    return S(d, col || '#ffffff', Math.max(0.7, r * 0.35), o == null ? 0.9 : o);
  }
  /* falling snow: soft dots and a few flakes over an area */
  function snowfall(seed, n, x0, y0, x1, y1, big) {
    var r = rnd(seed), s = '';
    for (var i = 0; i < n; i++) {
      var x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), k = r();
      s += k < 0.2 ? flake(x, y, (big || 1) * (2 + r() * 1.6), '#ffffff', 0.85) : C(x, y, (big || 1) * (0.7 + k * 1.5), '#ffffff', 0, 0.45 + k * 0.45);
    }
    return s;
  }
  /* icicles hanging under a line */
  function icicles(c, x0, x1, y, n, len, seed) {
    var r = rnd(seed || 3), s = '', w = (x1 - x0) / n, fill = c.lg([[0, '#ffffff'], [0.5, ICE], [1, FROST2]]);
    for (var i = 0; i < n; i++) {
      var x = x0 + w * (i + 0.5) + (r() - 0.5) * w * 0.4, h = len * (0.45 + r() * 0.75), hw = Math.min(w * 0.42, 1.6 + h * 0.14);
      s += P('M' + r1(x - hw) + ',' + r1(y) + ' L' + r1(x + hw) + ',' + r1(y) + ' L' + r1(x + 0.3) + ',' + r1(y + h) + ' Z', fill, 1);
    }
    return s;
  }
  /* frost creeping on a wall: pale curls with fern strokes */
  function frostCurl(x, y, k, flip, o) {
    var f = flip ? -1 : 1, d = 'M' + r1(x) + ',' + r1(y) + ' C' + r1(x + 6 * k * f) + ',' + r1(y - 8 * k) + ' ' + r1(x + 14 * k * f) + ',' + r1(y - 8 * k) + ' ' + r1(x + 16 * k * f) + ',' + r1(y - 16 * k) +
      ' C' + r1(x + 17 * k * f) + ',' + r1(y - 21 * k) + ' ' + r1(x + 12 * k * f) + ',' + r1(y - 23 * k) + ' ' + r1(x + 10 * k * f) + ',' + r1(y - 19 * k);
    var fern = L2(x + 5 * k * f, y - 4 * k, x + 3 * k * f, y - 9 * k) + ' ' + L2(x + 10 * k * f, y - 8 * k, x + 9 * k * f, y - 13 * k) + ' ' + L2(x + 9 * k * f, y - 6 * k, x + 13 * k * f, y - 3 * k);
    return S(d, '#e8f8ff', 1.4 * k, o == null ? 0.7 : o) + S(fern, ICE, 1 * k, (o == null ? 0.7 : o) * 0.8);
  }
  /* a hearth fire: three tongues of flame with a hot core */
  function fire(c, x, y, h, a) {
    var w = h * 0.5, out = C(x, y - h * 0.4, h * 1.4, c.glow(HEARTH, a == null ? 0.55 : a), 0);
    [[-0.55, 0.7], [0.55, 0.62], [0, 1]].forEach(function (t) {
      var fx = x + t[0] * w, fh = h * t[1], fw = fh * 0.42;
      out += P('M' + r1(fx) + ',' + r1(y - fh) + ' C' + r1(fx + fw) + ',' + r1(y - fh * 0.45) + ' ' + r1(fx + fw * 1.1) + ',' + r1(y) + ' ' + r1(fx) + ',' + r1(y) + ' C' + r1(fx - fw * 1.1) + ',' + r1(y) + ' ' + r1(fx - fw) + ',' + r1(y - fh * 0.45) + ' ' + r1(fx) + ',' + r1(y - fh) + ' Z',
        c.lg([[0, GOLD], [0.6, HEARTH], [1, HEARTH2]]), 1.2);
    });
    return out + E(x, y - h * 0.25, w * 0.32, h * 0.28, CORE, 0);
  }
  /* split logs under a fire (or cold ash when dead) */
  function logs(c, x, y, w, dead) {
    var col = dead ? '#4a4c58' : '#5a3418';
    return P('M' + r1(x - w) + ',' + r1(y - 2) + ' L' + r1(x + w * 0.6) + ',' + r1(y - 8) + ' L' + r1(x + w * 0.7) + ',' + r1(y - 3) + ' L' + r1(x - w * 0.9) + ',' + r1(y + 3) + ' Z', c.cel(col), 1.6) +
      P('M' + r1(x + w) + ',' + r1(y - 2) + ' L' + r1(x - w * 0.6) + ',' + r1(y - 8) + ' L' + r1(x - w * 0.7) + ',' + r1(y - 3) + ' L' + r1(x + w * 0.9) + ',' + r1(y + 3) + ' Z', c.cel(dk(col, 0.1)), 1.6) +
      (dead ? E(x, y + 2, w * 1.1, 3, '#8a8e9a', 0, 0.8) : E(x, y, w * 0.5, 2.4, GOLD, 0, 0.8));
  }
  /* a snowball with a cold sheen */
  function snowball(c, x, y, r) {
    return P('M' + r1(x - r) + ',' + r1(y) + ' C' + r1(x - r) + ',' + r1(y - r * 1.05) + ' ' + r1(x + r * 0.2) + ',' + r1(y - r * 1.08) + ' ' + r1(x + r * 0.6) + ',' + r1(y - r * 0.82) +
      ' C' + r1(x + r * 1.1) + ',' + r1(y - r * 0.5) + ' ' + r1(x + r * 1.04) + ',' + r1(y + r * 0.6) + ' ' + r1(x + r * 0.3) + ',' + r1(y + r * 0.96) + ' C' + r1(x - r * 0.5) + ',' + r1(y + r * 1.1) + ' ' + r1(x - r) + ',' + r1(y + r * 0.6) + ' ' + r1(x - r) + ',' + r1(y) + ' Z',
      c.rg([[0, '#ffffff'], [0.55, SNOW2], [1, SNOW3]], 0.36, 0.32, 0.75), Math.max(1.2, r * 0.13)) +
      E(x - r * 0.35, y - r * 0.38, r * 0.26, r * 0.16, '#ffffff', 0, 0.9) + C(x + r * 0.3, y + r * 0.2, r * 0.1, SNOW3, 0, 0.6) + C(x - r * 0.1, y + r * 0.5, r * 0.08, SNOW3, 0, 0.6);
  }
  /* a pine sprig garland strung between two points, sagging, with warm bulbs */
  function garland(c, x0, y0, x1, y1, sag, bulbs, seed) {
    var r = rnd(seed || 5), mx = (x0 + x1) / 2, my = Math.max(y0, y1) + sag, d = 'M' + r1(x0) + ',' + r1(y0) + ' Q' + r1(mx) + ',' + r1(my + sag * 0.6) + ' ' + r1(x1) + ',' + r1(y1);
    var pt = function (t) { var u = 1 - t, cy = my + sag * 0.6; return [u * u * x0 + 2 * u * t * mx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1]; };
    var s = S(d, OL, 7.4) + S(d, dk(PINE, 0.15), 5.4), tufts = '', b = '', i;
    for (i = 0; i <= 22; i++) { var p = pt(i / 22), a = r() * Math.PI * 2; tufts += L2(p[0] - Math.cos(a) * 3.6, p[1] - Math.sin(a) * 3.6, p[0] + Math.cos(a) * 3.6, p[1] + Math.sin(a) * 3.6) + ' '; }
    s += S(tufts, lt(PINE, 0.2), 1.6, 0.9);
    for (i = 0; i < bulbs; i++) {
      var q = pt((i + 0.5) / bulbs), col = [GOLD, RED, GOLD, FROST][i % 4];
      b += C(q[0], q[1] + 3, 7, c.glow(col === FROST ? FROST : GOLD, 0.55), 0) + C(q[0], q[1] + 3, 2.4, col, 1);
    }
    return s + b;
  }
  /* a house front on a street: wall, timber, snowy roof, icicles, a lit or shuttered window, a barred door */
  function window_(c, x, y, w, h, shut) {
    var s = C(x + w / 2, y + h / 2, Math.max(w, h) * 1.1, c.glow(HEARTH, 0.5), 0);
    s += P(rect(x, y, w, h), c.rg([[0, CORE], [0.55, GOLD], [1, HEARTH2]]), 1.8);
    if (shut) {
      // shutters drawn closed: warm light leaks through the gap and the slats
      var sw = w / 2 - 0.8, sl = '';
      for (var yy = y + 3.5; yy < y + h - 1; yy += 3.6) sl += L2(x + 1.5, yy, x + w - 1.5, yy) + ' ';
      s += P(rect(x, y, sw, h), c.cel('#4a3020'), 1.4) + P(rect(x + w - sw, y, sw, h), c.cel('#4a3020'), 1.4) + S(sl, '#2a1a10', 0.9, 0.9) +
        S(L2(x + w / 2, y + 1, x + w / 2, y + h - 1), GOLD, 1.4) + S(L2(x - 1, y + h * 0.5, x + w + 1, y + h * 0.5), OL, 2.4) + S(L2(x - 1, y + h * 0.5, x + w + 1, y + h * 0.5), '#5a5e6a', 1.2);
    } else {
      s += S(L2(x + w / 2, y, x + w / 2, y + h) + ' ' + L2(x, y + h / 2, x + w, y + h / 2), '#3a2414', 1.6) +
        P(rect(x - w * 0.42, y, w * 0.4, h), c.cel('#4a3020'), 1.4) + P(rect(x + w + 0.2, y, w * 0.4, h), c.cel('#4a3020'), 1.4);
    }
    return s + P('M' + r1(x - 3) + ',' + r1(y + h) + ' L' + r1(x + w + 3) + ',' + r1(y + h) + ' L' + r1(x + w + 2) + ',' + r1(y + h + 2.6) + ' Q' + r1(x + w / 2) + ',' + r1(y + h + 4) + ' ' + r1(x - 2) + ',' + r1(y + h + 2.6) + ' Z', SNOW, 1);
  }
  function door(c, x, y, w, h, barred, wreath) {
    var d = 'M' + r1(x) + ',' + r1(y + h) + ' L' + r1(x) + ',' + r1(y + w * 0.5) + ' Q' + r1(x + w / 2) + ',' + r1(y - w * 0.15) + ' ' + r1(x + w) + ',' + r1(y + w * 0.5) + ' L' + r1(x + w) + ',' + r1(y + h) + ' Z';
    var pl = L2(x + w / 3, y + 2, x + w / 3, y + h) + ' ' + L2(x + w * 2 / 3, y + 2, x + w * 2 / 3, y + h);
    var s = P(d, c.cel('#5a3a22'), 1.8) + CG(S(pl, '#2e1c10', 1, 0.9), c.clip(d));
    if (barred) {
      var by = y + h * 0.52;
      s += P(rect(x - 3, by - 2.6, w + 6, 5.2), c.cel('#3a2414'), 1.4) + R(x - 1, by - 3.2, 2.2, 6.4, '#5a5e6a') + R(x + w - 1.2, by - 3.2, 2.2, 6.4, '#5a5e6a');
    }
    if (wreath) {
      var wx = x + w / 2, wy = y + h * 0.28, wr = Math.max(3, w * 0.24);
      s += C(wx, wy, wr, 'none', 0) + S('M' + r1(wx - wr) + ',' + r1(wy) + ' A' + r1(wr) + ',' + r1(wr) + ' 0 1,0 ' + r1(wx + wr) + ',' + r1(wy) + ' A' + r1(wr) + ',' + r1(wr) + ' 0 1,0 ' + r1(wx - wr) + ',' + r1(wy), OL, wr * 0.7 + 1.6) +
        S('M' + r1(wx - wr) + ',' + r1(wy) + ' A' + r1(wr) + ',' + r1(wr) + ' 0 1,0 ' + r1(wx + wr) + ',' + r1(wy) + ' A' + r1(wr) + ',' + r1(wr) + ' 0 1,0 ' + r1(wx - wr) + ',' + r1(wy), PINE, wr * 0.7) +
        C(wx - wr * 0.6, wy + wr * 0.5, 0.9, RED, 0) + C(wx + wr * 0.7, wy - wr * 0.3, 0.9, RED, 0) + P('M' + r1(wx - 2) + ',' + r1(wy + wr) + ' L' + r1(wx + 2) + ',' + r1(wy + wr) + ' L' + r1(wx + 3) + ',' + r1(wy + wr + 3) + ' L' + r1(wx - 3) + ',' + r1(wy + wr + 3) + ' Z', RED, 0.8);
    } else s += C(x + w * 0.78, y + h * 0.6, 1.3, '#9a9ea8', 0.8);
    return s + P('M' + r1(x - 4) + ',' + r1(y + h + 1) + ' Q' + r1(x + w * 0.3) + ',' + r1(y + h - 5) + ' ' + r1(x + w * 0.6) + ',' + r1(y + h - 2) + ' Q' + r1(x + w + 2) + ',' + r1(y + h - 4) + ' ' + r1(x + w + 5) + ',' + r1(y + h + 1) + ' Z', SNOW, 1);
  }
  /* o: { wall, roof, timber, win: [[dx, dy, w, h, shut]], door: [dx, w, h, barred, wreath], chimney: dx, seed, ice } */
  function house(c, x, base, w, h, rh, o) {
    var top = base - h, xm = x + w / 2, s = '';
    if (o.chimney != null) {
      var cx = x + o.chimney;
      s += S('M' + r1(cx + 4) + ',' + r1(top - rh * 0.7 - 6) + ' C' + r1(cx - 2) + ',' + r1(top - rh - 16) + ' ' + r1(cx + 12) + ',' + r1(top - rh - 26) + ' ' + r1(cx + 4) + ',' + r1(top - rh - 40), '#aab4cc', 5, 0.25) +
        P(rect(cx, top - rh * 0.75 - 6, 9, rh * 0.75 + 4), c.cel('#4a4c5c'), 1.6) + P(rect(cx - 1.5, top - rh * 0.75 - 9, 12, 4), SNOW, 1.2);
    }
    var wall = rect(x, top, w, h);
    s += P(wall, c.cel(o.wall || '#5a5068'), 2);
    if (o.timber) s += CG(S(L2(x, top + 4, x + w, top + 4) + ' ' + L2(x + 4, top, x + 4, base) + ' ' + L2(x + w - 4, top, x + w - 4, base) + ' ' + L2(x, base - h * 0.5, x + w, base - h * 0.5), '#2e2230', 3), c.clip(wall));
    // frost creeping up from the snow
    s += CG(frostCurl(x + 3, base, 0.9, false, 0.55) + frostCurl(x + w - 3, base, 0.8, true, 0.5), c.clip(wall));
    (o.win || []).forEach(function (v) { s += window_(c, x + v[0], top + v[1], v[2], v[3], v[4]); });
    if (o.door) s += door(c, x + o.door[0], base - o.door[2], o.door[1], o.door[2], o.door[3], o.door[4]);
    // roof with a thick snow cap and icicles at the eaves
    var rl = x - 7, rr = x + w + 7, rt = top - rh;
    s += P('M' + r1(rl) + ',' + r1(top + 2) + ' L' + r1(xm) + ',' + r1(rt) + ' L' + r1(rr) + ',' + r1(top + 2) + ' Z', c.cel(o.roof || '#2e3450'), 2);
    var snow = 'M' + r1(rl - 2) + ',' + r1(top + 1) + ' L' + r1(xm) + ',' + r1(rt - 4) + ' L' + r1(rr + 2) + ',' + r1(top + 1);
    var r = rnd(o.seed || 7), n = 6, i;
    for (i = n; i >= 0; i--) { var t = i / n, px = rr + (xm - rr) * t, py = top + 1 + (rt - top) * t; snow += ' Q' + r1(px + 3) + ',' + r1(py + 10 + r() * 5) + ' ' + r1(px - 2) + ',' + r1(py + 7); }
    for (i = 1; i <= n; i++) { var t2 = i / n, qx = xm + (rl - xm) * t2, qy = rt + (top + 1 - rt) * t2; snow += ' Q' + r1(qx + 2) + ',' + r1(qy + 10 + r() * 5) + ' ' + r1(qx - 2) + ',' + r1(qy + 7); }
    s += P(snow + ' Z', c.lg([[0, '#ffffff'], [1, SNOW2]]), 1.6);
    if (o.ice !== false) s += icicles(c, x - 4, x + w + 4, top + 3, Math.max(4, Math.round(w / 9)), 9, o.seed);
    return s;
  }

  // ============================================================ scenes
  var SCENES = {
    /* The Shuttered Lane: a snowy street at night, every house shut against the Knocker, hearths still burning inside */
    shuttered_lane: function (c) {
      var s = R(0, 0, 400, 240, c.lg([[0, '#070b1c'], [0.55, '#16225a'], [1, '#3a4a7a']]));
      var r = rnd(11);
      for (var i = 0; i < 26; i++) s += C(r() * 400, r() * 90, r() < 0.2 ? 1.3 : 0.8, '#eef4ff', 0, 0.5 + r() * 0.4);
      // a cold moon behind thin cloud
      s += C(70, 44, 46, c.glow('#cfe0ff', 0.35), 0) + C(70, 44, 18, c.rg([[0, '#ffffff'], [1, '#c4d4ec']]), 0) + E(84, 50, 34, 4, '#1e2a5e', 0, 0.75) + E(54, 40, 22, 3, '#1e2a5e', 0, 0.6);
      // the far rooftops of the town
      s += P('M0,128 L14,128 L14,112 L30,100 L46,112 L46,124 L70,124 L70,108 L84,96 L98,108 L98,126 L300,126 L300,110 L318,96 L336,110 L336,122 L356,122 L356,104 L372,92 L388,104 L388,124 L400,124 L400,150 L0,150 Z', '#121a3c', 0);
      [[22, 108], [80, 112], [326, 106], [372, 100]].forEach(function (p) { s += R(p[0], p[1], 4, 4, GOLD, 0.8) + C(p[0] + 2, p[1] + 2, 7, c.glow(GOLD, 0.45), 0); });
      // the back row of houses
      s += house(c, 112, 152, 54, 48, 26, { wall: '#4e4660', timber: true, win: [[8, 12, 14, 14, true], [32, 12, 14, 14, false]], chimney: 36, seed: 3 });
      s += house(c, 176, 152, 50, 56, 30, { wall: '#3e4a66', door: [16, 18, 30, true, true], win: [[6, 8, 10, 12, true], [34, 8, 10, 12, true]], seed: 5 });
      s += house(c, 236, 152, 58, 46, 24, { wall: '#56485a', timber: true, win: [[8, 12, 14, 14, false], [36, 12, 14, 14, true]], chimney: 8, seed: 9 });
      // the snowy street, with a trodden lane down the middle
      s += P('M0,150 C80,144 320,144 400,150 L400,240 L0,240 Z', c.lg([[0, '#dfe8f4'], [0.5, '#b8c8de'], [1, '#8ea2c0']]), 0);
      s += P('M160,152 C170,152 230,152 240,152 C262,180 300,212 334,240 L66,240 C100,212 138,180 160,152 Z', c.lg([[0, '#a8b8d0'], [1, '#7a8cac']]), 0);
      s += S('M188,154 C176,182 150,212 128,240 M212,154 C226,182 256,212 278,240', '#6a7c9c', 1.4, 0.5);
      // footprints in the lane, leading up to a barred door
      for (var f = 0; f < 6; f++) { var fy = 232 - f * 14, fx = 200 + (f % 2 ? 5 : -5) * (1 - f * 0.1); s += E(fx, fy, 3 - f * 0.3, 1.6 - f * 0.15, '#5a6c8c', 0, 0.55); }
      // the near houses at either edge
      s += house(c, -30, 206, 100, 98, 40, { wall: '#5a4a5e', timber: true, win: [[38, 14, 22, 22, true]], door: [70, 24, 44, true, false], chimney: 20, seed: 13 });
      s += house(c, 330, 206, 100, 98, 40, { wall: '#465068', win: [[14, 14, 22, 22, false]], door: [44, 24, 44, true, true], seed: 17 });
      // a lamp post in the snow by the right-hand house
      s += S('M312,210 L312,150', OL, 5) + S('M312,210 L312,150', '#2e3240', 3) + P('M304,150 L320,150 L317,136 L307,136 Z', c.rg([[0, CORE], [0.6, GOLD], [1, HEARTH2]]), 1.8) + P('M302,136 L322,136 L312,128 Z', c.cel('#2e3240'), 1.6) +
        P('M301,135 L323,135 L312,126 Z', 'none', 0) + C(312, 143, 28, c.glow(GOLD, 0.4), 0) + P('M300,129 Q312,121 324,129 L321,131 Q312,127 303,131 Z', SNOW, 1);
      // drifts along the house fronts
      s += P('M0,214 C30,204 60,210 80,206 C84,214 70,222 0,226 Z', SNOW, 0) + P('M400,214 C370,204 340,210 324,206 C318,214 332,222 400,226 Z', SNOW, 0);
      // falling snow, and a cold mist low on the street
      s += E(200, 160, 220, 10, '#ffffff', 0, 0.12) + snowfall(21, 70, 0, 0, 400, 236);
      return s;
    },
    /* The Open Door: inside the one house that let her in. The hearth is dead, the door thrown open to a blizzard */
    open_door: function (c) {
      var s = R(0, 0, 400, 240, c.lg([[0, '#1a2440'], [1, '#26365a']]));
      // the plank wall, rimed with frost
      var pl = '';
      for (var x = 0; x < 400; x += 22) pl += L2(x, 14, x, 172) + ' ';
      s += S(pl, '#121a30', 1.6, 0.8) + R(0, 14, 400, 40, c.lg([[0, '#9ab8d8', 0.25], [1, '#9ab8d8', 0]]));
      // the window: frosted over, the night outside
      s += P(rect(176, 52, 60, 56), c.lg([[0, '#0e1838'], [1, '#2a4070']]), 2.4) + CG(frostCurl(178, 108, 1.2, false, 0.9) + frostCurl(234, 108, 1.1, true, 0.9) + frostCurl(180, 70, 0.8, false, 0.7) + snowfall(4, 10, 176, 52, 236, 108), c.clip(rect(176, 52, 60, 56))) +
        S(L2(206, 52, 206, 108) + ' ' + L2(176, 80, 236, 80), '#3a2a20', 3) + P(rect(170, 106, 72, 6), c.cel('#4a3424'), 1.8) + P('M170,106 Q206,100 242,106 Z', SNOW, 1);
      // the dead hearth on the left: stone, cold ash, icicles from the mantel
      var st = '#5a6274';
      s += P('M18,174 L18,66 L134,66 L134,174 Z', c.cel(st), 2.4);
      var bl = '';
      for (var y = 76, row = 0; y < 174; y += 12, row++) { bl += L2(18, y, 134, y) + ' '; for (var bx = 18 + (row % 2) * 14; bx < 134; bx += 28) bl += L2(bx, y - 12, bx, y) + ' '; }
      s += CG(S(bl, dk(st, 0.4), 1.2, 0.8), c.clip('M18,174 L18,66 L134,66 L134,174 Z'));
      s += P('M38,174 L38,112 Q76,90 114,112 L114,174 Z', c.lg([[0, '#0a0e18'], [1, '#1a2030']]), 2.2) + logs(c, 76, 168, 22, true) + S('M70,160 C66,150 74,144 70,134', '#8a90a0', 1.6, 0.35);
      s += P(rect(10, 58, 132, 10), c.cel('#4a3424'), 2) + P('M10,58 Q76,52 142,58 Z', SNOW, 1) + icicles(c, 12, 140, 68, 11, 14, 31);
      s += frostCurl(22, 174, 1.4, false, 0.8) + frostCurl(130, 174, 1.3, true, 0.8) + frostCurl(40, 112, 0.9, false, 0.6);
      // a cold kettle hanging in the hearth
      s += S('M76,94 L76,124', OL, 1.4) + P('M66,126 Q76,118 86,126 L84,140 Q76,144 68,140 Z', c.cel('#3a3e48'), 1.6) + icicles(c, 68, 84, 139, 3, 6, 5);
      // the front door on the right, thrown open; the blizzard outside
      var dw = 'M276,174 L276,62 Q312,40 348,62 L348,174 Z';
      s += P('M268,176 L268,58 Q312,30 356,58 L356,176 Z', c.cel('#3a2a1e'), 2.4);
      s += P(dw, c.lg([[0, '#e8f2ff'], [0.5, '#a8c4e8'], [1, '#6a8ab8']]), 2);
      s += CG(S('M276,80 C300,74 320,92 348,84 M276,110 C296,100 324,122 348,108 M276,140 C300,132 318,150 348,138', '#ffffff', 3, 0.6) + snowfall(9, 34, 276, 44, 348, 174, 1.2), c.clip(dw));
      // the door leaf swung in toward us, frosted
      s += P('M348,62 L384,44 L384,200 L348,174 Z', c.cel('#5a3a22'), 2.2) + S('M360,57 L360,182 M372,51 L372,191', '#2e1c10', 1.2, 0.8) + C(378, 120, 2, '#9a9ea8', 1) + frostCurl(352, 172, 1, false, 0.7);
      s += icicles(c, 270, 354, 60, 8, 10, 41);
      // the floor, and the cold light falling in through the door
      s += P('M0,172 L400,172 L400,240 L0,240 Z', c.lg([[0, '#2e3a58'], [1, '#1a2238']]), 0);
      var fb = '';
      for (var k = -6; k <= 12; k++) fb += L2(200 + k * 14, 172, 200 + k * 34, 240) + ' ';
      s += S(fb, '#121a2c', 1.2, 0.8);
      s += P('M276,174 L348,174 L400,226 L400,240 L232,240 Z', c.lg([[0, '#cfe4ff', 0.55], [1, '#cfe4ff', 0.05]]), 0);
      // snow blown in across the floor
      s += P('M348,174 C330,186 300,192 262,196 C230,200 214,212 236,222 C270,232 330,222 380,206 L400,190 L400,174 Z', c.lg([[0, '#ffffff'], [1, SNOW2]]), 1.4);
      // a chair knocked over by the hearth
      s += G(P(rect(0, 0, 24, 4), c.cel('#4a3424'), 1.4) + P(rect(2, 4, 3, 16), c.cel('#4a3424'), 1.2) + P(rect(19, 4, 3, 16), c.cel('#4a3424'), 1.2) + P(rect(-1, -20, 4, 22), c.cel('#4a3424'), 1.2) + P(rect(-1, -20, 14, 3), c.cel('#4a3424'), 1.2), 'translate(150,214) rotate(-78)');
      // snow streaming in from the door, ceiling beam with icicles
      s += S('M340,96 C300,104 250,110 196,104 M344,126 C300,132 240,140 180,132 M340,150 C300,154 260,164 214,160', '#ffffff', 1.6, 0.35) + snowfall(15, 40, 150, 40, 400, 200);
      s += P('M0,0 L400,0 L400,16 L0,16 Z', c.cel('#3a2a1e'), 2) + icicles(c, 0, 400, 15, 26, 16, 51);
      // the room's cold glow
      s += C(312, 120, 120, c.glow('#bfe0ff', 0.22), 0);
      return s;
    },
  };

  // ============================================================ mobs (128x128, facing left)
  /* a frost hound: a lean pale wolf-hound, ice shards along its back, cold eyes, its breath freezing */
  function hound(c, col, crys, eye) {
    var dc = dk(col, 0.28), bel = lt(col, 0.6), s = '';
    var lg = function (d, cc, w) { return S(d, OL, w + 4.4) + S(d, cc, w); };
    // far legs
    s += lg('M92,78 L100,96 L94,115', dc, 6.4) + lg('M46,80 L44,98 L40,115', dc, 6.4);
    s += E(39, 117, 5, 2.6, dk(col, 0.4), 1.4) + E(93, 117, 5, 2.6, dk(col, 0.4), 1.4);
    // tail, plumed and tipped with ice
    s += P('M102,60 C110,56 114,46 112,34 C120,44 122,58 114,68 C110,74 106,74 100,72 Z', c.cel(col), 2.2) + P('M112,34 L116,26 L117,36 L122,33 L118,42 Z', c.cel(ICE), 1.4);
    // body: a deep chest and a tucked waist
    var bd = 'M36,56 C44,44 66,46 80,52 C92,56 102,52 108,60 C114,70 110,82 100,84 C92,84 86,78 76,80 C66,84 56,90 46,88 C36,84 32,70 36,56 Z';
    s += P(bd, c.cel(col), 2.4) + CG(P('M30,74 C40,84 52,92 66,86 L66,96 L30,96 Z', bel, 0) + S('M60,60 l6,4 M78,62 l6,4 M94,64 l4,4', dk(col, 0.3), 1.2), c.clip(bd));
    // the ice shards growing along the neck and back
    [[36, 48, -2.4, 13], [46, 45, -2.1, 15], [57, 46, -1.8, 12], [68, 49, -1.7, 10], [80, 51, -1.6, 9], [92, 54, -1.4, 7]].forEach(function (p) {
      var a = p[2], h = p[3], ca = Math.cos(a), sa = Math.sin(a), px = -sa * 3, py = ca * 3;
      s += P('M' + r1(p[0] - px) + ',' + r1(p[1] - py) + ' L' + r1(p[0] + ca * h) + ',' + r1(p[1] + sa * h) + ' L' + r1(p[0] + px) + ',' + r1(p[1] + py) + ' Z', c.lg([[0, '#ffffff'], [1, crys]]), 1.4);
    });
    // head, raised, snarling
    s += P('M32,30 L32,12 L42,26 Z', c.cel(dc), 1.6);
    s += P('M46,38 C42,26 28,24 20,28 L8,34 C3,36 3,41 6,43 L10,44 L8,48 L18,50 C24,56 34,58 42,54 C50,50 52,42 46,38 Z', c.cel(col), 2.3) + P('M10,47 L18,50 C24,55 32,57 38,55 C30,54 22,51 16,47 Z', bel, 0);
    s += P('M40,32 L46,12 L50,32 Z', c.cel(col), 1.6) + P('M42.6,29 L46,19 L47.6,29 Z', dk(col, 0.4), 0);
    s += E(5, 37, 2, 1.6, OL) + P('M7,44 L22,46 L10,48 Z', '#2a1a2a', 1.2) + P('M11,44 L12,46.6 L13.6,44.4 Z M17,45 L18,47.6 L19.4,45.2 Z', '#fff', 0.6);
    s += S('M20,32 L30,34', OL, 2) + C(25, 37, 7, c.glow(eye, 0.75), 0) + E(25, 37, 2.6, 1.8, eye, 1) + C(25.6, 36.6, 0.7, '#ffffff', 0);
    // freezing breath
    s += C(2, 46, 12, c.glow('#e8f8ff', 0.5), 0) + S('M2,44 C-4,40 -2,36 2,34', '#ffffff', 1.4, 0.6);
    // near legs, the hind one bent at the hock
    s += lg('M52,82 L50,100 L46,115', col, 7.4) + lg('M100,76 L108,96 L104,115', col, 7.4);
    s += E(45, 118, 6, 3, c.cel(bel), 1.6) + E(103, 118, 6, 3, c.cel(bel), 1.6) + S('M40,118 l-3,1 M43,119 l-2,1.4 M98,118 l-3,1', OL, 1.2);
    return shadow(68, 36) + G(s, 'translate(4,0)');
  }
  /* the Snowman (the costume): three snowballs, coal eyes, a carrot nose, a hearth-red scarf and a knitted cap */
  function snowman(c) {
    var s = shadow(64, 26) + snowball(c, 64, 94, 23) + snowball(c, 64, 62, 17) + snowball(c, 64, 36, 13);
    // stick arms
    s += S('M48,60 L28,46 M34,50 L28,54 M80,62 L100,52 M94,55 L100,60', OL, 3.6) + S('M48,60 L28,46 M34,50 L28,54 M80,62 L100,52 M94,55 L100,60', '#6a4226', 1.8);
    // coal buttons and eyes, the carrot
    s += C(60, 58, 1.8, '#1a1a22', 0) + C(59, 66, 1.8, '#1a1a22', 0) + C(58, 88, 2.2, '#1a1a22', 0) + C(57, 98, 2.2, '#1a1a22', 0);
    s += C(56, 32, 1.9, '#1a1a22', 0) + C(66, 32, 1.9, '#1a1a22', 0) + P('M58,37 L42,40 L58,40.6 Z', c.cel('#f07a1a'), 1.3);
    s += S('M54,43 Q60,46 66,43', '#1a1a22', 1.2, 0.8);
    // the scarf, a tail blowing back
    s += P('M50,47 Q64,53 78,47 L78,52 Q64,58 50,52 Z', c.cel(RED), 1.6) + P('M72,51 L84,70 L77,72 L68,54 Z', c.cel(RED), 1.6) + S('M74,58 L80,56 M77,63 L82,62', GOLD, 1.4);
    s += S('M53,48.5 L53,53.5 M60,50 L60,55 M67,50 L67,55', GOLD, 1.4);
    // knitted cap with a pompom
    s += P('M51,30 C50,16 74,14 78,28 Z', c.cel(HEARTH2), 1.8) + P('M49,28 Q64,24 80,28 L79,32 Q64,28 50,32 Z', c.cel(SNOW), 1.4) + C(70, 14, 4, c.cel(SNOW), 1.4);
    return s;
  }
  var MOBS = {
    ln_frost_hound: function (c) { return hound(c, '#a8bccf', FROST, '#7ae8ff'); },
    /* a frostling: a small ice imp with jagged horns, a grin, and a chill gathering in its claw */
    ln_frostling: function (c) {
      var col = '#8ed8f4', s = E(66, 118, 16, 4, '#000', 0, 0.22) + C(64, 70, 44, c.glow(FROST, 0.35), 0);
      // a tail of shards instead of legs: it floats
      s += P('M54,84 C56,96 62,106 72,112 C70,104 72,96 76,86 Z', c.lg([[0, col], [1, '#ffffff']]), 2);
      s += P('M58,104 L54,112 L62,108 Z', c.cel(ICE), 1.2) + P('M78,100 L86,104 L80,96 Z', c.cel(ICE), 1.2);
      // body
      s += P('M46,62 C46,50 84,50 84,62 C86,76 80,88 64,90 C50,88 44,76 46,62 Z', c.cel(col), 2.4) + P('M54,66 L60,82 L66,66 L72,80', 'none', 0) +
        S('M56,62 L62,78 M70,64 L74,76', '#ffffff', 1.4, 0.7) + E(62, 72, 9, 10, lt(col, 0.45), 0, 0.6);
      // the back arm
      s += S('M82,62 L94,72 L98,66', OL, 7) + S('M82,62 L94,72 L98,66', dk(col, 0.2), 3.6);
      // head: big, with jagged horns of ice
      s += P('M48,30 L40,12 L54,26 Z', c.cel(ICE), 1.6) + P('M74,26 L86,6 L82,28 Z', c.cel(ICE), 1.6) + P('M80,32 L96,24 L86,38 Z', c.cel(ICE), 1.4);
      s += P('M42,40 C40,24 58,18 70,20 C84,22 90,34 86,46 C82,56 70,60 58,58 C46,56 42,50 42,40 Z', c.cel(col), 2.4);
      s += P('M36,38 L44,34 L46,44 Z', c.cel(col), 1.6);
      s += C(52, 38, 7, c.glow(FROST, 0.8), 0) + C(70, 38, 7, c.glow(FROST, 0.8), 0) + E(52, 38, 4, 3.6, '#e8fdff', 1.4) + E(70, 38, 4, 3.6, '#e8fdff', 1.4) + C(50.6, 38, 1.6, '#0a3a5a', 0) + C(68.6, 38, 1.6, '#0a3a5a', 0);
      s += P('M50,48 Q60,54 72,48 Q62,58 50,48 Z', '#0a2a40', 1.2) + P('M54,49.6 L56,52.6 L58,50.6 Z M64,50.4 L66,53 L67.6,50 Z', '#ffffff', 0);
      // the near arm reaching out, a swirl of cold (Hearthchill) in its claw
      s += S('M48,62 L34,70 L24,62', OL, 7.6) + S('M48,62 L34,70 L24,62', col, 4.2);
      s += C(18, 56, 16, c.glow(FROST, 0.7), 0) + C(18, 56, 6, c.rg([[0, '#ffffff'], [0.6, ICE], [1, FROST2]]), 1.4) + S('M10,50 C14,44 24,46 26,52 M26,62 C22,68 12,66 10,60', '#ffffff', 1.4, 0.8);
      s += S('M22,60 l-3,3 M25,62 l-1,4', OL, 1.4);
      s += flake(30, 40, 3, '#ffffff', 0.9) + flake(100, 48, 2.4, '#ffffff', 0.8) + flake(96, 90, 2, '#ffffff', 0.7);
      return s;
    },
    ln_snowman: function (c) { return snowman(c); },
    /* the Knocker: tall and gaunt in a frost-rimed coat and deep hood, cold eyes in the dark, carrying a door-knocker
       ring of black iron as big as a shield */
    ln_knocker: function (c) {
      var coat = '#2c303e', coat2 = '#1e212c', skin = '#9aa8bc', iron = '#3e424e', s = shadow(64, 32);
      s += C(64, 64, 58, c.glow('#7ae0ff', 0.18), 0);
      // the coat behind, ragged at the hem and frozen stiff
      s += P('M70,34 C90,40 102,70 106,112 L98,106 L92,116 L84,106 L76,116 L72,60 Z', c.lg([[0, coat], [1, coat2]]), 2.4);
      // legs
      s += P('M56,92 L52,114 L60,114 L62,92 Z', c.cel('#1a1c24'), 2) + P('M68,92 L70,114 L78,114 L74,92 Z', c.cel('#1a1c24'), 2);
      s += P('M46,113 L61,113 L61,118 L44,118 Z', c.cel('#121318'), 1.8) + P('M68,113 L82,113 L82,118 L66,118 Z', c.cel('#121318'), 1.8);
      // the long coat
      var cd = 'M48,40 C54,34 74,34 82,40 L84,70 L94,108 L80,104 L72,110 L64,103 L56,110 L48,104 L36,108 L46,70 Z';
      s += P(cd, c.cel(coat), 2.4) + CG(S('M64,42 L64,104', OL, 1.6) + S('M50,74 L42,106 M78,74 L88,106', dk(coat, 0.45), 1.6) +
        S('M38,106 L48,100 L56,106 L64,100 L72,106 L80,100 L92,104', '#e8f8ff', 3, 0.85) + S('M40,102 L48,96 M84,100 L90,98', ICE, 1.6, 0.7), c.clip(cd));
      s += icicles(c, 40, 92, 104, 8, 8, 61);
      s += P('M46,68 L82,68 L83,74 L45,74 Z', c.cel('#18191f'), 1.6) + P('M60,67 L68,67 L68,75 L60,75 Z', c.cel('#6a7080'), 1.2);
      // rime on the shoulders
      s += P('M44,42 C50,34 78,32 86,42 C80,40 74,44 66,42 C58,44 50,40 44,42 Z', SNOW, 1.4);
      // the far arm, long fingers
      s += S('M82,44 L92,62 L94,80', OL, 9) + S('M82,44 L92,62 L94,80', coat2, 5.6) + S('M94,80 L92,88 M94,80 L96,89 M94,80 L98,86', OL, 3) + S('M94,80 L92,88 M94,80 L96,89 M94,80 L98,86', skin, 1.4);
      // the hood: peaked, a deep shadow with two cold eyes
      s += P('M46,40 C42,26 50,10 66,6 C74,10 82,18 82,30 C82,38 78,44 72,46 L50,46 Z', c.cel(coat), 2.4);
      s += P('M50,42 C46,30 52,18 62,16 C68,20 70,30 68,42 Z', '#05060a', 1.2);
      s += C(55, 28, 6, c.glow(FROST, 0.8), 0) + C(64, 28, 6, c.glow(FROST, 0.8), 0) + E(55, 28, 2.2, 1.4, '#dffaff', 0) + E(64, 28, 2.2, 1.4, '#dffaff', 0);
      s += P('M58,8 C62,4 70,4 76,10 C72,10 66,10 58,8 Z', SNOW, 1.2);
      // the near arm, holding the great knocker out in front
      s += S('M48,46 L36,58 L32,62', OL, 9.4) + S('M48,46 L36,58 L32,62', coat, 6);
      var cx = 26, cy = 84, rr = 18;
      s += C(cx, cy, rr + 8, c.glow(FROST, 0.25), 0);
      s += P('M' + (cx - 7) + ',58 L' + (cx + 7) + ',58 L' + (cx + 6) + ',70 L' + (cx - 6) + ',70 Z', c.cel(iron), 1.8) + C(cx, 64, 2.4, '#8a90a0', 1);
      var ring = 'M' + (cx - rr) + ',' + cy + ' A' + rr + ',' + rr + ' 0 1,0 ' + (cx + rr) + ',' + cy + ' A' + rr + ',' + rr + ' 0 1,0 ' + (cx - rr) + ',' + cy;
      s += S(ring, OL, 10.4) + S(ring, iron, 7) + S('M' + (cx - rr + 3) + ',' + (cy - 6) + ' A' + rr + ',' + rr + ' 0 0,1 ' + (cx + 4) + ',' + (cy - rr + 1), '#8a90a0', 2, 0.8);
      s += S('M' + (cx - rr + 2) + ',' + (cy + 8) + ' A' + rr + ',' + rr + ' 0 0,0 ' + (cx + 8) + ',' + (cy + rr - 2), '#e8f8ff', 2.4, 0.8) + icicles(c, cx - 10, cx + 10, cy + rr + 2, 4, 7, 7);
      s += P('M' + (cx - 5) + ',' + (cy - rr - 4) + ' L' + (cx + 5) + ',' + (cy - rr - 4) + ' L' + (cx + 4) + ',' + (cy - rr + 4) + ' L' + (cx - 4) + ',' + (cy - rr + 4) + ' Z', c.cel(iron), 1.6);
      s += S('M30,60 L26,64 M32,62 L29,67 M34,63 L33,68', OL, 3) + S('M30,60 L26,64 M32,62 L29,67 M34,63 L33,68', skin, 1.4);
      return s;
    },
    /* the Uninvited: the frozen ghost of someone from the house that let her in, nightclothes and nightcap, hands out */
    ln_uninvited: function (c) {
      var col = '#c4def4', s = E(66, 118, 18, 4, '#000', 0, 0.18) + C(64, 62, 50, c.glow('#a8d8ff', 0.4), 0);
      var gown = 'M50,40 C60,34 76,34 84,42 C92,56 96,80 98,96 C92,100 88,110 80,108 C76,114 70,116 64,110 C58,116 50,114 48,106 C42,104 40,96 42,90 C42,72 44,52 50,40 Z';
      s += G(P(gown, c.lg([[0, '#ffffff'], [0.5, col], [1, '#6a8ab8', 0.4]]), 2.2) + CG(S('M58,46 L56,104 M70,46 L72,108 M80,52 L88,100', '#7a9ac4', 1.4, 0.6), c.clip(gown)), '', 0.92);
      s += icicles(c, 48, 96, 100, 7, 9, 71);
      // the back arm
      s += S('M78,46 L86,64 L88,76', OL, 8) + S('M78,46 L86,64 L88,76', lt(col, 0.2), 4.6) + icicles(c, 82, 92, 76, 2, 6, 3);
      // the head and nightcap
      s += P('M70,20 C78,10 92,10 100,22 C104,30 102,40 108,46 C100,46 94,40 90,34 C86,30 80,28 74,30 Z', c.cel('#a8c8e8'), 2) + C(108, 48, 4, c.cel(SNOW), 1.4);
      s += P('M50,30 C50,18 74,14 78,28 C80,40 72,48 62,48 C54,48 50,40 50,30 Z', c.cel('#dceefc'), 2.2);
      s += P('M48,24 C56,14 74,14 80,26 C72,22 58,22 48,24 Z', c.cel('#a8c8e8'), 1.6);
      s += E(56, 32, 2.8, 3.6, '#1a2a44', 0) + E(66, 32, 2.8, 3.6, '#1a2a44', 0) + E(60, 41, 2.6, 3.4, '#1a2a44', 0);
      // the near arm, hand reaching out: let me in
      s += S('M54,46 L38,58 L24,58', OL, 8.6) + S('M54,46 L38,58 L24,58', '#e8f4fc', 5) + icicles(c, 34, 46, 60, 3, 6, 9);
      s += S('M24,58 L16,54 M24,58 L15,58 M24,58 L16,62', OL, 3) + S('M24,58 L16,54 M24,58 L15,58 M24,58 L16,62', '#dceefc', 1.4);
      s += flake(20, 30, 2.6) + flake(104, 74, 2.2) + flake(34, 96, 2);
      return s;
    },
    /* the Cold Guest: a tall veiled woman of frost and snow; her gown trails behind her like drifting snow, icicles
       crown her, and under the veil only two cold lights */
    ln_cold_guest: function (c) {
      var gown = '#dbe8f6', s = E(70, 118, 46, 6, '#000', 0, 0.25) + C(62, 60, 70, c.glow('#bfe4ff', 0.45), 0);
      // the train of her gown, drifting back like snow, its hem breaking up into wisps
      var tr = 'M60,52 C80,60 96,80 108,96 C114,104 122,108 128,112 L120,114 L125,119 L110,117 L112,122 L96,119 L93,124 L80,120 L73,124 L62,120 L51,124 L44,119 L33,122 L28,117 L17,119 C28,100 38,80 46,62 Z';
      s += P(tr, c.lg([[0, '#ffffff'], [0.45, gown], [1, '#7a9cc8']], 0, 0, 1, 1), 2.4) + CG(S('M70,70 C84,90 100,104 124,112 M58,76 C62,96 70,108 86,120 M48,80 C46,96 40,108 30,118', '#9ab4d8', 1.6, 0.8) +
        S('M52,92 C58,86 66,90 62,96 C60,99 56,98 57,95 M82,98 C88,92 96,96 92,102 C90,105 86,104 87,101 M38,108 C44,102 52,106 48,112', FROST, 1.4, 0.7) + E(76, 122, 60, 8, '#ffffff', 0, 0.5), c.clip(tr));
      s += snowfall(81, 14, 20, 100, 128, 124, 1.2);
      // the veil falling down her back
      s += P('M66,14 C86,16 100,40 104,70 C106,84 112,94 118,100 C104,98 94,88 88,74 C82,60 74,44 64,34 Z', c.lg([[0, '#ffffff', 0.95], [1, '#c4d8f0', 0.55]]), 2);
      // the bodice
      s += P('M50,40 C56,34 70,34 74,40 L72,64 C66,68 56,68 50,64 Z', c.cel('#d0def0'), 2.2) + S('M52,52 Q62,58 72,52', FROST, 1.4, 0.8) + S('M56,42 L62,50 L68,42', FROST, 1.2, 0.7);
      // the far arm, long and pale, falling at her side
      s += S('M70,42 L80,60 L84,74', OL, 7.6) + S('M70,42 L80,60 L84,74', '#c4d6ec', 4.2) + S('M84,74 L82,82 M84,74 L86,82 M84,74 L88,79', OL, 2.8) + S('M84,74 L82,82 M84,74 L86,82 M84,74 L88,79', '#e6f2fc', 1.3);
      // the head: a pale face with dark hollows for eyes, seen through the veil
      s += P('M48,26 C48,14 70,10 74,24 C76,36 70,44 60,44 C52,44 48,36 48,26 Z', c.cel('#b8cce4'), 2.2);
      s += E(54, 27, 3.6, 2.8, '#16243e', 0) + E(64, 27, 3.6, 2.8, '#16243e', 0) + S('M55,37 Q59,35 63,37', '#16243e', 1.2, 0.7);
      s += P('M44,20 C50,8 72,6 78,18 C80,30 78,40 74,48 C70,40 70,30 66,26 C58,24 50,26 44,32 Z', c.lg([[0, '#ffffff', 0.85], [1, '#d4e4f6', 0.6]]), 1.8);
      s += P('M44,32 C46,42 50,48 56,52 C50,52 44,46 42,38 Z', '#ffffff', 1.2, 0.85);
      // her eyes, two cold lights through the veil
      s += C(54, 27, 7, c.glow(FROST, 0.95), 0) + C(64, 27, 7, c.glow(FROST, 0.95), 0) + E(54, 27, 2, 1.3, '#ffffff', 0) + E(64, 27, 2, 1.3, '#ffffff', 0);
      // the icicle crown
      [[48, 16, 10], [54, 11, 14], [61, 9, 17], [68, 11, 13], [74, 15, 9]].forEach(function (p) {
        s += P('M' + (p[0] - 2.6) + ',' + (p[1] + 2) + ' L' + (p[0] + 2.6) + ',' + (p[1] + 2) + ' L' + (p[0] + 0.4) + ',' + (p[1] - p[2] + 4) + ' Z', c.lg([[0, '#ffffff'], [1, FROST]], 0, 1, 0, 0), 1.2);
      });
      s += C(61, -2, 8, c.glow(FROST, 0.6), 0);
      // the near arm, reaching out: a knock at the door
      s += S('M52,42 L36,50 L22,44', OL, 8) + S('M52,42 L36,50 L22,44', '#d4e2f2', 4.6) + P('M42,44 C36,52 30,54 26,52 L30,46 Z', '#ffffff', 1.2, 0.85);
      s += S('M22,44 L14,40 M22,44 L13,44 M22,44 L15,48 M22,44 L18,38', OL, 2.8) + S('M22,44 L14,40 M22,44 L13,44 M22,44 L15,48 M22,44 L18,38', '#eef6fc', 1.3);
      s += C(14, 42, 12, c.glow('#ffffff', 0.5), 0);
      s += flake(30, 22, 3) + flake(100, 30, 2.6) + flake(12, 80, 2.4) + flake(114, 70, 2) + flake(36, 98, 2.2);
      return s;
    },
    /* Snowtuft: a snow fox kit, sitting, three-quarter view. Big ears, big eyes, a big tail: it must read at 24 px */
    snowtuft: function (c) {
      var fur = '#f6f9fc', sh = '#b8cce4', s = shadow(68, 32);
      // the big plumed tail behind, curling up
      s += P('M80,114 C104,118 124,102 124,78 C124,60 114,46 100,44 C106,56 106,70 98,80 C92,88 84,90 78,90 Z', c.lg([[0, fur], [1, sh]], 0, 0, 1, 1), 2.4) +
        P('M100,44 C114,46 124,60 124,74 C118,66 110,58 102,56 Z', '#ffffff', 1.4) + S('M108,70 C112,80 110,92 102,100', sh, 1.4, 0.8);
      // body, sitting
      s += P('M50,80 C50,66 82,64 90,80 C96,94 94,110 82,114 L56,114 C46,108 46,92 50,80 Z', c.cel(fur), 2.4);
      s += P('M54,78 C58,86 56,96 60,104 C64,98 66,90 68,82 Z', '#ffffff', 0);
      // front legs with round paws
      s += P('M54,96 C54,104 54,110 56,114 L64,114 C64,108 64,102 63,96 Z', c.cel(fur), 1.8) + P('M68,98 C68,106 68,110 70,114 L78,114 C78,108 78,102 77,98 Z', c.cel(fur), 1.8);
      s += E(59, 114, 6, 3.4, c.cel(fur), 1.8) + E(73, 114, 6, 3.4, c.cel(fur), 1.8) + S('M57,115 l0,-2 M61,115 l0,-2 M71,115 l0,-2 M75,115 l0,-2', SNOW3, 1);
      // big ears
      s += P('M30,46 L22,12 L48,34 Z', c.cel(fur), 2.2) + P('M31,40 L26,20 L42,34 Z', '#f2c2cc', 0);
      s += P('M54,34 L68,6 L72,42 Z', c.cel(fur), 2.2) + P('M58,34 L67,15 L69,38 Z', '#f2c2cc', 0);
      // the round head with fluffy cheeks
      s += P('M26,52 C26,36 44,28 58,30 C72,32 80,44 76,58 L82,62 L74,64 L78,70 L68,70 C62,76 52,78 44,76 L38,80 L36,74 C30,72 24,70 22,66 C22,60 24,56 26,52 Z', c.cel(fur), 2.4);
      // a short muzzle and a black nose
      s += E(30, 64, 9, 6.6, '#ffffff', 0) + E(22, 61, 3.4, 2.6, '#1a1a22', 1) + C(21, 60, 0.9, '#ffffff', 0, 0.8) + S('M26,67 Q30,70 33,67', OL, 1.2);
      // big bright eyes
      s += E(36, 50, 4.6, 5.6, '#1a1a22', 0) + C(34.6, 48, 1.8, '#ffffff', 0) + E(54, 51, 4.8, 5.8, '#1a1a22', 0) + C(52.4, 49, 1.9, '#ffffff', 0);
      s += E(44, 64, 3.6, 2.2, '#f2a8b8', 0, 0.6) + E(62, 62, 3.6, 2.2, '#f2a8b8', 0, 0.6);
      s += flake(100, 30, 3) + flake(12, 30, 2.2);
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
  var NIGHTBG = ['#3a5aa0', '#0a1028'], WARMBG = ['#d0782a', '#2a1006'], COLDBG = ['#7ab8e0', '#0a1830'];
  /* a mitten (for the snowball kit), cuff at (x, y), pointing along angle a */
  function mitten(c, x, y, a, col, flip) {
    var f = flip ? -1 : 1;
    return G(P('M-6,0 L6,0 L7,-10 C8,-20 -8,-20 -7,-10 Z', c.cel(col || RED), 1.8) + P('M' + (5 * f) + ',-8 C' + (12 * f) + ',-10 ' + (12 * f) + ',-16 ' + (6 * f) + ',-14 Z', c.cel(col || RED), 1.6) +
      P('M-7,0 L7,0 L7,4 L-7,4 Z', c.cel(SNOW), 1.4), 'translate(' + r1(x) + ',' + r1(y) + ') rotate(' + r1(a) + ')');
  }
  var ICONS = {
    ln_kindling: function (c) {
      var st = '';
      [[-12, 1, '#8a5a30'], [-4, 0, '#7a4a26'], [4, 1, '#9a6a3a'], [12, 0, '#6a4226'], [-8, -1, '#8a5a30'], [8, -1, '#7a4a26']].forEach(function (p, i) {
        st += G(P('M-2.6,-24 L2.6,-24 L2.8,24 L-2.8,24 Z', c.cel(p[2]), 1.6) + E(0, -24, 2.6, 1.2, '#d8b080', 1), 'translate(32,34) rotate(' + (-34 + p[0] * 0.45) + ') translate(' + (p[0] * 0.7) + ',' + (p[1] * 2) + ')');
      });
      return frame(c, WARMBG, C(32, 30, 26, c.glow(GOLD, 0.55), 0) + st + G(P('M-16,-3 Q0,3 16,-3 L16,2 Q0,8 -16,2 Z', c.cel(RED), 1.6) + P('M-2,1 L-8,11 L-4,11 L0,5 L4,11 L8,11 L2,1 Z', c.cel(RED), 1.2), 'translate(32,34) rotate(-34)') +
        C(16, 14, 1.4, GOLD, 0) + C(48, 12, 1.2, CORE, 0) + C(44, 20, 1, GOLD, 0));
    },
    ln_snowball: function (c) { return frame(c, COLDBG, snowball(c, 32, 34, 18) + flake(14, 14, 3.4) + flake(52, 50, 2.6) + flake(50, 14, 2)); },
    ln_cocoa: function (c) {
      var mug = 'M16,26 L44,26 L42,54 C42,57 18,57 18,54 Z';
      return frame(c, WARMBG, S('M24,20 C20,14 28,10 24,4 M33,20 C29,14 37,10 33,4', '#ffffff', 2, 0.65) +
        S('M42,32 C54,32 54,48 41,48', OL, 7) + S('M42,32 C54,32 54,48 41,48', '#b8302a', 3.6) +
        P(mug, c.cel('#c0382a'), 2.2) + CG(R(14, 38, 32, 6, SNOW), c.clip(mug)) + S('M14,38 L46,38 M14,44 L46,44', OL, 1, 0.6) +
        E(30, 26, 14, 3.4, c.rg([[0, '#8a5030'], [1, '#4a2614']]), 1.6) + E(26, 25.4, 3.4, 2, '#fff6ea', 1) + E(33, 26, 3, 1.8, '#fff6ea', 1));
    },
    ln_garland: function (c) {
      return frame(c, NIGHTBG, garland(c, 6, 18, 58, 18, 14, 4, 9) + garland(c, 10, 40, 54, 42, 6, 3, 13) + P('M26,14 L32,22 L38,14 L34,12 L32,16 L30,12 Z', c.cel(RED), 1.4) + C(32, 15, 2, c.cel(GOLD), 1));
    },
    ln_fireworks: function (c) {
      var rocket = function (x, y, a, col) {
        return G(S('M0,10 L0,30', OL, 3) + S('M0,10 L0,30', '#a07a4a', 1.4) + P('M-4,-6 L4,-6 L4,12 L-4,12 Z', c.cel(col), 1.6) + P('M-4,-6 L0,-14 L4,-6 Z', c.cel(GOLD), 1.4) + S('M-4,2 L4,2', GOLD, 1.6), 'translate(' + x + ',' + y + ') rotate(' + a + ')');
      };
      var burst = '', i;
      for (i = 0; i < 10; i++) { var a = Math.PI * 2 * i / 10; burst += L2(46 + Math.cos(a) * 4, 18 + Math.sin(a) * 4, 46 + Math.cos(a) * 12, 18 + Math.sin(a) * 12) + ' '; }
      return frame(c, NIGHTBG, C(46, 18, 16, c.glow(GOLD, 0.6), 0) + S(burst, GOLD, 2) + C(46, 18, 2.4, CORE, 0) +
        rocket(20, 30, -14, RED) + rocket(34, 36, 8, '#2a6ac0') + C(12, 52, 1.2, GOLD, 0) + C(44, 56, 1, CORE, 0));
    },
    ln_costume: function (c) { return frame(c, COLDBG, G(snowman(c), 'matrix(0.48,0,0,0.48,1.3,5)')); },
    ln_stew: function (c) {
      return frame(c, WARMBG, S('M22,22 C18,16 26,12 22,6 M32,20 C28,14 36,10 32,4 M42,22 C38,16 46,12 42,6', '#ffffff', 2, 0.6) +
        S('M44,34 L56,14', OL, 4.4) + S('M44,34 L56,14', '#c8a070', 2.4) +
        E(32, 34, 22, 6, c.rg([[0, '#c8682a'], [1, '#7a3414']]), 1.8) + C(24, 33, 2.4, '#f08a2a', 1) + C(36, 35, 2.2, '#f08a2a', 1) + C(30, 31, 2, '#7aa040', 1) + C(42, 32, 2, '#d8b070', 1) +
        P('M10,34 C10,50 22,56 32,56 C42,56 54,50 54,34 C48,38 16,38 10,34 Z', c.cel('#8a5a30'), 2.2) + S('M14,42 Q32,50 50,42', '#5a3418', 1.2, 0.8));
    },
    ln_coat: function (c) {
      return frame(c, NIGHTBG, P('M20,12 L44,12 L50,22 L52,56 L12,56 L14,22 Z', c.cel('#22305a'), 2.4) + S('M32,14 L32,56', OL, 1.4) +
        P('M12,50 L52,50 L52,58 L12,58 Z', c.cel(SNOW), 1.6) + P('M20,10 Q32,20 44,10 L46,16 Q32,26 18,16 Z', c.cel(SNOW), 1.8) +
        C(28, 28, 1.8, c.cel(GOLD), 1) + C(28, 37, 1.8, c.cel(GOLD), 1) + C(36, 28, 1.8, c.cel(GOLD), 1) + C(36, 37, 1.8, c.cel(GOLD), 1));
    },
    ln_trousers: function (c) { return frame(c, NIGHTBG, P('M20,10 L44,10 L46,54 L35,54 L32,26 L29,54 L18,54 Z', c.cel('#1e2a4e'), 2.4) + S('M20,14 L44,14', GOLD, 2) + P('M17,50 L30,50 L30,58 L17,58 Z', c.cel(SNOW), 1.6) + P('M34,50 L47,50 L47,58 L34,58 Z', c.cel(SNOW), 1.6)); },
    ln_cloak: function (c) {
      return frame(c, NIGHTBG, P('M22,14 L42,14 C48,26 54,42 56,56 L8,56 C10,42 16,26 22,14 Z', c.cel('#c0461e'), 2.4) + S('M26,20 C22,32 18,44 16,54 M38,20 C42,32 46,44 48,54', '#7a2410', 1.6, 0.8) +
        P('M8,52 L56,52 L56,58 L8,58 Z', c.cel(SNOW), 1.4) + P('M16,14 Q32,4 48,14 Q40,22 32,20 Q24,22 16,14 Z', c.cel(SNOW), 1.8) + C(32, 19, 2.6, c.cel(GOLD), 1.2));
    },
    companion_snowtuft: function (c) { return frame(c, COLDBG, G(MOBS.snowtuft(c), 'matrix(0.56,0,0,0.56,-3,-4)')); },
    /* the festival's mark (the event button, the Events row): a lit window in a snowy house on night blue */
    event_longnight: function (c) {
      return frame(c, NIGHTBG, snowfall(3, 12, 6, 6, 58, 30) + P('M14,58 L14,30 L50,30 L50,58 Z', c.cel('#4e4660'), 2.2) +
        P('M8,32 L32,10 L56,32 Z', c.cel('#2e3450'), 2.2) + P('M6,32 L32,7 L58,32 Q50,34 46,30 Q40,36 34,30 Q28,36 22,31 Q14,36 6,32 Z', c.lg([[0, '#ffffff'], [1, SNOW2]]), 1.6) +
        window_(c, 23, 36, 18, 16, false) + P('M10,58 Q24,52 32,56 Q42,52 54,58 Z', SNOW, 1.2));
    },
    /* the advent calendar's doors: shut (a wreath on it) and opened (warm light inside) */
    ln_door: function (c) {
      return frame(c, NIGHTBG, P('M12,58 L12,10 L52,10 L52,58 Z', c.cel('#3a2a1e'), 2.2) + door(c, 17, 14, 30, 42, false, true));
    },
    ln_door_open: function (c) {
      return frame(c, NIGHTBG, P('M12,58 L12,10 L52,10 L52,58 Z', c.cel('#3a2a1e'), 2.2) + C(32, 38, 26, c.glow(GOLD, 0.6), 0) +
        P('M17,56 L17,29 Q32,6 47,29 L47,56 Z', c.rg([[0, CORE], [0.6, GOLD], [1, HEARTH2]], 0.5, 0.7, 0.8), 1.8) + fire(c, 32, 54, 12, 0.3) +
        P('M17,56 L17,29 L6,24 L6,62 Z', c.cel('#5a3a22'), 1.8) + C(9, 42, 1.4, '#9a9ea8', 0.8) + C(10, 30, 3.4, 'none', 0));
    },
    /* the great hearth of a town */
    ln_hearth: function (c) {
      var st = '#6a7084', bl = 'M10,58 L10,16 L54,16 L54,58 Z';
      return frame(c, WARMBG, P(bl, c.cel(st), 2.2) + CG(S('M10,26 L54,26 M10,36 L54,36 M10,46 L54,46 M24,16 L24,26 M40,16 L40,26 M18,26 L18,36 M46,26 L46,36', dk(st, 0.4), 1, 0.8), c.clip(bl)) +
        P('M18,58 L18,36 Q32,26 46,36 L46,58 Z', '#1a0e08', 2) + logs(c, 32, 55, 10) + fire(c, 32, 54, 18, 0.6) + P('M6,14 L58,14 L58,20 L6,20 Z', c.cel('#5a3a22'), 1.8) + garland(c, 8, 18, 56, 18, 3, 3, 4));
    },
    /* the Snowball Brawl kit */
    ln_snow_throw: function (c) {
      return frame(c, COLDBG, S('M8,46 L30,34 M10,36 L28,30 M14,54 L32,40', '#ffffff', 2.6, 0.6) + snowball(c, 42, 28, 13) + S('M30,46 l4,4 M54,40 l4,2 M50,14 l3,-3', '#ffffff', 1.6, 0.8));
    },
    ln_snow_pack: function (c) {
      return frame(c, COLDBG, mitten(c, 18, 52, 30) + mitten(c, 46, 52, -30, null, true) + snowball(c, 32, 30, 11) + flake(14, 14, 2.6) + flake(50, 14, 2.4) + C(22, 22, 1.2, '#ffffff', 0) + C(44, 24, 1.2, '#ffffff', 0));
    },
    ln_snow_duck: function (c) {
      var bricks = '';
      [[8, 40, 16], [25, 40, 16], [42, 40, 14], [14, 30, 16], [31, 30, 16], [20, 20, 16]].forEach(function (b) { bricks += P('M' + b[0] + ',' + (b[1] + 10) + ' L' + b[0] + ',' + (b[1] + 2) + ' Q' + (b[0] + b[2] / 2) + ',' + (b[1] - 1) + ' ' + (b[0] + b[2]) + ',' + (b[1] + 2) + ' L' + (b[0] + b[2]) + ',' + (b[1] + 10) + ' Z', c.cel(SNOW), 1.6); });
      return frame(c, COLDBG, P('M6,58 L6,50 L58,50 L58,58 Z', SNOW2, 0) + bricks + snowball(c, 50, 18, 6) + S('M44,24 l-4,4 M40,18 l-5,0 M46,30 l-2,4', '#ffffff', 1.6, 0.9) + C(42, 22, 1.4, '#ffffff', 0) + C(38, 26, 1, '#ffffff', 0));
    },
    ln_snow_boulder: function (c) {
      return frame(c, ['#c84a3a', '#2a0a10'], S('M4,40 L14,40 M2,30 L12,32 M6,50 L16,48', '#ffffff', 2.4, 0.7) + snowball(c, 36, 34, 22) + S('M24,24 C30,20 36,22 40,26 M28,44 C34,48 42,46 46,42', SNOW3, 1.4, 0.8) +
        P('M14,58 L58,58 L58,62 L14,62 Z', SNOW, 0) + C(14, 54, 2, SNOW, 1) + C(20, 58, 1.6, SNOW, 1));
    },
  };

  // ============================================================ town overlay (stages 0..4)
  function townOverlay(stage) {
    var c = new Ctx(), s = '', st = Math.max(0, Math.min(4, Math.floor(+stage || 0)));
    // the great hearth's glow, always there while the festival is on
    s += E(200, 244, 230, 60, c.rg([[0, HEARTH, 0.32], [0.6, HEARTH, 0.1], [1, HEARTH, 0]]), 0);
    if (st >= 1) {
      // garlands strung across the town, just under the top the scene crops away (it shows y 65 to 240 on a phone)
      s += garland(c, -10, 70, 140, 74, 16, 6, 21) + garland(c, 130, 74, 270, 70, 18, 6, 22) + garland(c, 262, 70, 410, 76, 14, 6, 23);
    }
    if (st >= 2) {
      // music by the hearth: a few warm notes rising
      var note = function (x, y, k, two) {
        var b = two ? S('M' + (x + 3) + ',' + (y - 12) + ' L' + (x + 11) + ',' + (y - 15), OL, 4 * k) + S('M' + (x + 3) + ',' + (y - 12) + ' L' + (x + 11) + ',' + (y - 15), GOLD, 2.2 * k) + E(x + 8, y - 3, 3.2 * k, 2.4 * k, GOLD, 1.2) + S('M' + (x + 11) + ',' + (y - 3) + ' L' + (x + 11) + ',' + (y - 15), OL, 1.4) : S('M' + (x + 3) + ',' + y + ' C' + (x + 8) + ',' + (y - 6) + ' ' + (x + 8) + ',' + (y - 8) + ' ' + (x + 6) + ',' + (y - 10), GOLD, 1.4);
        return G(C(x, y, 9, c.glow(GOLD, 0.35), 0) + E(x, y, 3.2 * k, 2.4 * k, GOLD, 1.2) + S('M' + (x + 3) + ',' + y + ' L' + (x + 3) + ',' + (y - 12), OL, 1.4) + b, '', 0.75);
      };
      s += note(150, 196, 1, false) + note(176, 182, 1, true) + note(232, 190, 1, false) + note(256, 176, 0.9, true);
      s += E(200, 236, 110, 26, c.rg([[0, GOLD, 0.18], [1, GOLD, 0]]), 0);
    }
    if (st >= 3) {
      // snow settles on the ground and keeps falling
      s += P('M0,226 C40,218 80,224 120,220 C170,216 220,224 270,219 C320,214 360,222 400,218 L400,240 L0,240 Z', c.lg([[0, '#ffffff', 0.92], [1, SNOW2, 0.9]]), 0) +
        S('M0,226 C40,218 80,224 120,220 C170,216 220,224 270,219 C320,214 360,222 400,218', '#ffffff', 1.6, 0.9);
      s += snowfall(33, 60, 0, 0, 400, 226);
    }
    if (st >= 4) {
      // the New Year fireworks over the rooftops
      var burst = function (x, y, rr, col, n) {
        var d = '', dots = '', i;
        for (i = 0; i < n; i++) { var a = Math.PI * 2 * i / n; d += L2(x + Math.cos(a) * rr * 0.3, y + Math.sin(a) * rr * 0.3, x + Math.cos(a) * rr, y + Math.sin(a) * rr) + ' '; dots += C(x + Math.cos(a) * (rr + 4), y + Math.sin(a) * (rr + 4), 1.4, col, 0, 0.9); }
        return C(x, y, rr * 1.5, c.glow(col, 0.4), 0) + S(d, col, 2) + S(d, '#ffffff', 0.7, 0.8) + dots + C(x, y, 3, '#ffffff', 0, 0.9);
      };
      s += burst(80, 100, 24, GOLD, 14) + burst(300, 96, 30, '#ff6a5a', 16) + burst(196, 118, 18, FROST, 12) + burst(358, 130, 14, GOLD, 10);
      s += S('M196,162 C194,148 196,138 196,128 M80,160 C82,138 80,120 80,110', GOLD, 1.2, 0.5);
    }
    return c.svg(400, 240, s);
  }
  ART.lnTown = function (stage) {
    try { return townOverlay(stage); } catch (e) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240"></svg>'; }
  };

  // ============================================================ extend the public API
  var has = function (t, k) { return typeof k === 'string' && Object.prototype.hasOwnProperty.call(t, k); };
  function make(tbl, key, w, h) {
    try { var c = new Ctx(); return c.svg(w, h, tbl[key](c)); }
    catch (e) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '"><rect width="' + w + '" height="' + h + '" fill="' + NIGHT + '"/></svg>'; }
  }
  var baseScene = ART.scene, baseMob = ART.mob, baseIcon = ART.icon;
  ART.scene = function (k) { return has(SCENES, k) ? make(SCENES, k, 400, 240) : baseScene ? baseScene.apply(this, arguments) : make(SCENES, 'shuttered_lane', 400, 240); };
  ART.mob = function (k) { return has(MOBS, k) ? make(MOBS, k, 128, 128) : baseMob ? baseMob.apply(this, arguments) : make(MOBS, 'ln_frostling', 128, 128); };
  ART.icon = function (k) { return has(ICONS, k) ? make(ICONS, k, 64, 64) : baseIcon ? baseIcon.apply(this, arguments) : make(ICONS, 'ln_snowball', 64, 64); };
  ART.keys = ART.keys || {};
  function addKeys(name, keys) { var a = Array.isArray(ART.keys[name]) ? ART.keys[name] : (ART.keys[name] = []); keys.forEach(function (k) { if (a.indexOf(k) < 0) a.push(k); }); }
  addKeys('scenes', Object.keys(SCENES)); addKeys('mobs', Object.keys(MOBS)); addKeys('icons', Object.keys(ICONS));
})(typeof window !== 'undefined' ? window : this);
