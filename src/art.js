/* Realm of Loner - art.js
   Every visual in the game as an SVG string. Defines window.ART (see SPEC.md "ART API").
   Original fan art. No external assets, no text in any image, no SVG filters.
   Every id is suffixed with a per-call counter so many SVGs can share one page. */
(function (W) {
  'use strict';

  /* ================= core helpers ================= */
  var UID = 0;
  var OL = '#1a1009';
  /* outline-weight multiplier, only != 1 while drawing a scaled-down race body (keeps outlines bold after scaling) */
  var SWK = 1;
  function r1(v) { return Math.round(v * 10) / 10; }
  function D(s) {
    var o = s[0];
    for (var i = 1; i < arguments.length; i++) {
      var v = arguments[i];
      o += (typeof v === 'number' ? r1(v) : v) + s[i];
    }
    return o;
  }
  function rgb(c) {
    c = c.replace('#', '');
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    return [parseInt(c.substr(0, 2), 16), parseInt(c.substr(2, 2), 16), parseInt(c.substr(4, 2), 16)];
  }
  function hex(a) {
    return '#' + a.map(function (v) {
      v = Math.max(0, Math.min(255, Math.round(v)));
      return (v < 16 ? '0' : '') + v.toString(16);
    }).join('');
  }
  function mix(a, b, t) { var A = rgb(a), B = rgb(b); return hex([0, 1, 2].map(function (i) { return A[i] + (B[i] - A[i]) * t; })); }
  function lt(c, t) { return mix(c, '#ffffff', t); }
  function dk(c, t) { return mix(c, '#000000', t); }
  function clampI(v, a, b) { v = parseInt(v, 10); if (isNaN(v)) v = a; return Math.max(a, Math.min(b, v)); }

  function Ctx() { this.u = 'q' + (++UID).toString(36); this.k = 0; this.defs = []; this.cache = {}; }
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
  /* 3-tone cel gradient, light from the upper left */
  Ctx.prototype.cel = function (c) { return this.lg([[0, lt(c, 0.3)], [0.4, c], [0.72, c], [1, dk(c, 0.38)]], 0.2, 0, 0.8, 1); };
  Ctx.prototype.clip = function (d) { var id = this.nid(); this.defs.push('<clipPath id="' + id + '"><path d="' + d + '"/></clipPath>'); return 'url(#' + id + ')'; };
  Ctx.prototype.svg = function (w, h, body) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">' +
      (this.defs.length ? '<defs>' + this.defs.join('') + '</defs>' : '') + body + '</svg>';
  };

  function stk(sw) { return sw === 0 ? '' : ' stroke="' + OL + '" stroke-width="' + (SWK === 1 ? (sw || 2.5) : r1((sw || 2.5) * SWK)) + '" stroke-linejoin="round" stroke-linecap="round"'; }
  function opa(o) { return o != null && o !== 1 ? ' opacity="' + o + '"' : ''; }
  function P(d, fill, sw, o) { return '<path d="' + d + '" fill="' + fill + '"' + stk(sw) + opa(o) + '/>'; }
  function F(d, fill, o) { return P(d, fill, 0, o); }
  function S0(d, col, w, o) { return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"' + opa(o) + '/>'; }
  function S(d, col, w, o) { return S0(d, col, SWK !== 1 && col === OL ? r1(w * SWK) : w, o); }
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
  function pl(pts) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + r1(p[0]) + ',' + r1(p[1]); }).join(''); }
  /* outlined limb: dark stroke under a coloured stroke, optional shade stripe */
  function tube(pts, w, col, sh) {
    var d = pl(pts);
    return S0(d, OL, SWK === 1 ? w + 4.5 : r1(w + 4.5 * SWK)) + S0(d, col, w) +
      (sh ? '<path transform="translate(' + r1(w * 0.24) + ',' + r1(w * 0.08) + ')" d="' + d + '" fill="none" stroke="' + sh + '" stroke-width="' + r1(w * 0.36) + '" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>' : '');
  }
  function shadow(c, cx, rx, y) {
    return E(cx, y || 122.5, rx, Math.max(3, rx * 0.16), c.rg([[0, '#000', 0.45], [0.65, '#000', 0.25], [1, '#000', 0]]), 0);
  }
  function scaleAt(body, s, ax, ay) {
    if (s === 1 || !s) return body;
    return G(body, 'matrix(' + s + ',0,0,' + s + ',' + r1(ax - ax * s) + ',' + r1(ay - ay * s) + ')');
  }
  var MIRROR = 'matrix(-1,0,0,1,128,0)';
  function rnd(seed) {
    var s = seed % 2147483647; if (s <= 0) s += 2147483646;
    return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; };
  }
  /* bumpy closed blob (tree canopies, clouds, bushes) */
  function blob(cx, cy, rx, ry, k, R_, j) {
    var d = '', a0, a1, am, f;
    for (var i = 0; i < k; i++) {
      a0 = i / k * Math.PI * 2; a1 = (i + 1) / k * Math.PI * 2; am = (a0 + a1) / 2;
      f = 1.28 + (R_ ? (R_() - 0.5) * (j || 0.3) : 0);
      if (i === 0) d += 'M' + r1(cx + Math.cos(a0) * rx) + ',' + r1(cy + Math.sin(a0) * ry);
      d += 'Q' + r1(cx + Math.cos(am) * rx * f) + ',' + r1(cy + Math.sin(am) * ry * f) + ' ' + r1(cx + Math.cos(a1) * rx) + ',' + r1(cy + Math.sin(a1) * ry);
    }
    return d + 'Z';
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

  /* ================= palette ================= */
  var GOLD = '#d6a53c', WOOD = '#7a5230', LEATH = '#5a3a22';
  var STEEL = ['#f4f7fa', '#c2cad3', '#7c8793'];
  var SKIN = ['#f3cfad', '#dcab80', '#b07a52', '#7b4c31'];
  var HAIRC = ['#2b1d15', '#6e4427', '#e2bd5f', '#a5432a', '#dcd8d0'];
  var HAIRM = ['short', 'spiky', 'short', 'mane', 'mohawk'];
  var HAIRF = ['ponytail', 'long', 'bun', 'bob', 'braid'];

  /* ================= weapons & held items (grip at 0,0, pointing up) ================= */
  var WP = {
    sword: function (c) {
      return P('M-3.4,-5 L-3.4,-40 L0,-48 L3.4,-40 L3.4,-5 Z', c.lg(STEEL, 0, 0, 1, 0), 2) +
        S('M0,-9 L0,-40', '#8e99a5', 1.2) +
        P('M-2.4,-3 L2.4,-3 L2.4,9 L-2.4,9 Z', LEATH, 2) +
        P('M-11,-7 Q0,-3.5 11,-7 L11,-3 Q0,0.5 -11,-3 Z', c.cel(GOLD), 2) +
        C(0, 11.5, 3.2, c.cel(GOLD), 2);
    },
    dagger: function (c) {
      return P('M-2.8,-4 L-2.8,-21 L0,-28 L2.8,-21 L2.8,-4 Z', c.lg(STEEL, 0, 0, 1, 0), 2) +
        P('M-2.2,-2 L2.2,-2 L2.2,7 L-2.2,7 Z', '#3a2a20', 1.8) +
        P('M-7,-5.5 L7,-5.5 L7,-2 L-7,-2 Z', c.cel('#a0a0aa'), 1.8) + C(0, 8.5, 2.4, '#a0a0aa', 1.6);
    },
    cutlass: function (c) {
      return P('M-3,-4 C-4.5,-18 -3,-31 6,-44 C9,-34 6.5,-18 3.4,-4 Z', c.lg(STEEL, 0, 0, 1, 0), 2) +
        P('M-2.2,-2 L2.2,-2 L2.2,8 L-2.2,8 Z', LEATH, 1.8) +
        P('M-4,-5 C-11,-2 -10,7 -3,9 L-2,6.5 C-6.5,5 -6.5,-1 -2,-2.5 Z', c.cel(GOLD), 1.6) +
        P('M-6,-5.5 L6,-5.5 L6,-2.5 L-6,-2.5 Z', c.cel(GOLD), 1.6);
    },
    club: function (c) {
      return P('M-2.6,9 L-3.8,-17 C-7.5,-27 -4.5,-38 2,-38 C8.5,-37 8.5,-27 4.4,-17 L2.6,9 Z', c.cel('#8a5d36'), 2.2) +
        S('M-1,-30 L3,-28 M-2,-22 L1,-21 M3,-34 L5,-33', '#4a2e18', 1.2) +
        C(-3.5, -26, 1.1, '#cfcfd4', 0) + C(4.5, -31, 1.1, '#cfcfd4', 0);
    },
    bigclub: function (c) {
      var sp = '';
      [[-9, -34], [9, -38], [-8, -50], [7, -54], [0, -62]].forEach(function (p) {
        sp += P(D`M${p[0] - 2.5},${p[1] + 2} L${p[0] + (p[0] < 0 ? -6 : p[0] > 0 ? 6 : 0)},${p[1] - (p[0] === 0 ? 6 : 1)} L${p[0] + 2.5},${p[1] - 2} Z`, '#d9d4c6', 1.6);
      });
      return sp + P('M-3.5,12 L-5,-24 C-11,-36 -9,-58 1,-62 C11,-60 12,-38 6,-24 L3.5,12 Z', c.cel('#7c5231'), 2.4) +
        S('M-4,-42 L2,-38 M-2,-30 L4,-31 M-1,-52 L4,-50', '#43291a', 1.3) +
        R(-4.8, -6, 9.6, 5, '#4a3222', 1.6);
    },
    mace: function (c) {
      return P('M-2,10 L-2,-20 L2,-20 L2,10 Z', c.cel(WOOD), 2) +
        P(star(0, -27, 7, 11, 6.5), c.cel('#8d949c'), 2) + C(0, -27, 5.5, c.cel('#aab2bb'), 1.6) +
        C(0, 11.5, 2.6, '#8d949c', 1.6);
    },
    pick: function (c) {
      return P('M-2.2,12 L-2.2,-38 L2.2,-38 L2.2,12 Z', c.cel(WOOD), 2) +
        P('M-19,-31 Q0,-49 19,-31 L16,-28.5 Q0,-41 -16,-28.5 Z', c.cel('#8d949c'), 2) +
        R(-3.5, -41, 7, 7, '#5a5f66', 1.6);
    },
    shovel: function (c) {
      return P('M-2,12 L-2,-30 L2,-30 L2,12 Z', c.cel(WOOD), 2) +
        P('M-7.5,-29 L7.5,-29 L7,-43 Q0,-51 -7,-43 Z', c.cel('#8d949c'), 2) +
        P('M-6,12 L6,12 L6,16 L-6,16 Z', WOOD, 1.8);
    },
    staff: function (c) {
      return P('M-2.2,38 L-2.8,-50 L2.8,-50 L2.2,38 Z', c.lg([lt(WOOD, 0.25), WOOD, dk(WOOD, 0.35)], 0, 0, 1, 0), 2) +
        S('M-2.5,-20 L2.5,-17 M-2.5,-14 L2.5,-11', GOLD, 1.5) +
        C(0, -60, 13, c.rg([[0, '#d8f8ff', 0.95], [0.45, '#69ccf0', 0.5], [1, '#69ccf0', 0]]), 0) +
        P('M-7,-49 C-11,-57 -8,-65 -3,-68 L-1.5,-62 L1.5,-62 L3,-68 C8,-65 11,-57 7,-49 Z', c.cel(GOLD), 2) +
        C(0, -59, 5.2, c.rg([[0, '#ffffff'], [0.4, '#9ae8ff'], [1, '#2a6fb8']], 0.38, 0.35, 0.7), 1.8);
    },
    scepter: function (c) {
      return P('M-1.9,10 L-2.2,-24 L2.2,-24 L1.9,10 Z', c.cel(GOLD), 1.8) +
        C(0, -33, 12, c.rg([[0, '#fffbe0', 0.95], [0.5, '#ffe68a', 0.45], [1, '#ffe68a', 0]]), 0) +
        P(star(0, -33, 8, 9.5, 5.5), c.cel(GOLD), 1.8) +
        C(0, -33, 3.6, c.rg([[0, '#ffffff'], [1, '#ffe27a']]), 1.4) +
        C(0, 11.5, 2.4, GOLD, 1.5);
    },
    wand: function (c) {
      return P('M-1.8,8 L-1.8,-20 L1.8,-20 L1.8,8 Z', c.cel('#6a3fa0'), 1.8) +
        C(0, -24, 7, c.rg([[0, '#ffe0ff', 0.9], [1, '#c070ff', 0]]), 0) + P(star(0, -24, 4, 5, 2), '#f6d8ff', 1.2);
    },
    wrench: function (c) {
      return P('M-2.6,10 L-2.6,-22 L2.6,-22 L2.6,10 Z', c.lg(STEEL, 0, 0, 1, 0), 2) +
        P('M-8.5,-21 L-8.5,-34 L-3.5,-39 L-3.5,-29 L3.5,-29 L3.5,-39 L8.5,-34 L8.5,-21 Z', c.lg(STEEL, 0, 0, 1, 0), 2) +
        R(-3.4, 2, 6.8, 9, '#b8322a', 1.6);
    },
    ladle: function (c) {
      return P('M-1.8,10 L-1.8,-30 L1.8,-30 L1.8,10 Z', c.cel('#7a7f86'), 1.8) +
        C(0, -37, 14, c.rg([[0, '#ffd070', 0.8], [1, '#ff8a20', 0]]), 0) +
        P('M-10,-37 Q0,-24 10,-37 Z', c.cel('#6d7279'), 2) + E(0, -37, 9, 2.6, '#ffb43a', 1.4) + E(-2, -37.5, 4, 1, '#fff2a8', 0);
    },
    hammer: function (c) {
      return P('M-2.4,28 L-2.8,-40 L2.8,-40 L2.4,28 Z', c.cel(WOOD), 2) +
        P('M-15,-56 L15,-56 L16,-38 L-16,-38 Z', c.cel('#8a8f96'), 2.4) +
        R(-16.5, -50, 33, 6, '#5d6269', 1.6) + R(-3.5, -40, 7, 6, GOLD, 1.5);
    },
    spear: function (c) {
      return P('M-1.8,30 L-1.8,-42 L1.8,-42 L1.8,30 Z', c.cel(WOOD), 1.8) +
        P('M0,-60 L6,-46 L0,-40 L-6,-46 Z', c.lg(STEEL, 0, 0, 1, 0), 2) + S('M-2,-40 L2,-38 M-2,-37 L2,-35', '#c2a060', 1.4);
    },
    axe: function (c) {
      return P('M-2.2,12 L-2.2,-36 L2.2,-36 L2.2,12 Z', c.cel(WOOD), 2) +
        P('M1,-34 C8,-44 18,-42 20,-38 C20,-30 18,-22 14,-18 C10,-24 6,-26 1,-24 Z', c.lg(STEEL, 0, 0, 1, 0), 2) +
        P('M-2,-34 L-8,-30 L-2,-26 Z', '#7c8793', 1.6);
    },
    fish: function (c) {
      return P('M0,0 L-5,4 L5,4 Z', '#e0873a', 1.6) +
        P('M0,-2 C-7,-8 -7,-22 0,-28 C7,-22 7,-8 0,-2 Z', c.cel('#e8903e'), 2) +
        C(-1.8, -22.5, 1.2, '#1a1009', 0) + S('M-4,-12 Q0,-10 4,-12', '#b0561e', 1.1);
    },
    /* paladin one-hand warhammer: silver head, gold bands */
    warhammer: function (c) {
      return P('M-2.2,11 L-2.4,-27 L2.4,-27 L2.2,11 Z', c.cel(WOOD), 2) +
        S('M-2.4,-4 L2.4,-2 M-2.4,1 L2.4,3', GOLD, 1.4) +
        P('M0,-47 L3,-40 L-3,-40 Z', c.cel(GOLD), 1.6) +
        P('M-12,-40 L12,-40 L13,-26 L-13,-26 Z', c.lg(STEEL, 0, 0, 1, 0), 2.4) +
        P('M-3.6,-41 L3.6,-41 L3.6,-25 L-3.6,-25 Z', c.cel(GOLD), 1.8) +
        R(-13.5, -35, 3, 5, '#8d949c', 1.4) + R(10.5, -35, 3, 5, '#8d949c', 1.4) +
        C(0, 12.5, 2.6, c.cel(GOLD), 1.6);
    },
    /* hunter bow: stave bows out towards +x (the target when held facing right), string on -x */
    bow: function (c) {
      var st = 'M-9,-36 C1,-30 5,-14 1,-2 L1,2 C5,14 1,30 -9,36';
      return S('M-9,-36 L-9,36', '#efe6cf', 1.1, 0.95) +
        S(st, OL, 7.5) + S(st, '#8a5a30', 4) + S('M-7,-34 C2,-28 4.5,-14 1.5,-4 M1.5,4 C4.5,14 2,28 -7,34', lt('#8a5a30', 0.35), 1.2, 0.8) +
        P('M-2,-6 L4,-6 L4,6 L-2,6 Z', c.cel('#3a5a22'), 1.8) +
        C(-9, -36, 2, GOLD, 1.3) + C(-9, 36, 2, GOLD, 1.3);
    },
    /* druid staff: gnarled wood curling into a hook, sprouting leaves */
    druidstaff: function (c) {
      var hook = 'M0,-44 C-3,-54 5,-63 11,-57 C15,-52 10,-46 6,-50';
      return P('M-2.4,38 C-3.4,14 -0.6,-16 -2.8,-45 L2.4,-45 C3.8,-16 1.6,14 2.4,38 Z', c.lg([lt(WOOD, 0.2), WOOD, dk(WOOD, 0.4)], 0, 0, 1, 0), 2) +
        S('M-2,-10 C0,-12 1,-14 2,-18 M-1,10 C1,8 2,6 2,2', dk(WOOD, 0.45), 1.1) +
        C(4, -54, 11, c.rg([[0, '#f0ffc0', 0.85], [0.45, '#b8e060', 0.4], [1, '#7ac030', 0]]), 0) +
        S(hook, OL, 7) + S(hook, WOOD, 3.6) +
        leaf(c, -3, -44, -60, 0.75) + leaf(c, 4, -45, 50, 0.65) + leaf(c, -1, -30, -110, 0.55) +
        C(4, -54, 2.6, '#f4ffd0', 1.2);
    },
    /* warlock staff: dark shaft, bone skull, fel flame */
    skullstaff: function (c) {
      var sh = '#3b2a3a';
      return P('M-2.2,38 L-2.6,-48 L2.6,-48 L2.2,38 Z', c.lg([lt(sh, 0.25), sh, dk(sh, 0.4)], 0, 0, 1, 0), 2) +
        S('M-2.5,-22 L2.5,-19 M-2.5,-16 L2.5,-13', '#7ee03a', 1.4) +
        C(0, -66, 14, c.rg([[0, '#e8ffc0', 0.9], [0.45, '#7ee03a', 0.45], [1, '#3aa010', 0]]), 0) +
        P('M0,-83 C5,-76 9,-72 7,-66 C6,-62 3,-60 0,-60 C-4,-60 -7,-63 -7,-67 C-7,-72 -3,-73 -2,-78 C-1,-75 0,-75 0,-83 Z', '#4ac21a', 1.6) +
        F('M0,-76 C3,-71 5,-68 4,-65 C3,-63 -3,-63 -4,-65 C-4,-69 -1,-70 0,-76 Z', '#d8ff8a') +
        S('M-3,-47 C-10,-47 -12,-42 -9,-38 M3,-47 C10,-47 12,-42 9,-38', OL, 4) + S('M-3,-47 C-10,-47 -12,-42 -9,-38 M3,-47 C10,-47 12,-42 9,-38', '#cfc6b0', 2) +
        P('M-7,-54 C-7,-63 7,-63 7,-54 C7,-50 5,-49 4,-47 L-4,-47 C-5,-49 -7,-50 -7,-54 Z', c.cel('#ece4cc'), 1.8) +
        E(-2.6, -54.5, 1.9, 2.1, '#2a0a0a', 0) + E(2.6, -54.5, 1.9, 2.1, '#2a0a0a', 0) +
        C(-2.6, -54.3, 0.9, '#b8ff5a', 0) + C(2.6, -54.3, 0.9, '#b8ff5a', 0) +
        S('M-2.5,-48.5 L-2.5,-47 M0,-48.5 L0,-47 M2.5,-48.5 L2.5,-47', OL, 0.8);
    }
  };
  /* mireling reed spear: bound reed shaft, a sharpened bone point */
  WP.reedspear = function (c) {
    return P('M-1.7,30 L-1.9,-40 L1.9,-40 L1.7,30 Z', c.cel('#a8a060'), 1.8) +
      S('M-1.9,-12 L1.9,-12 M-1.9,8 L1.9,8', dk('#a8a060', 0.4), 1, 0.8) +
      P('M0,-60 C3.6,-54 4.6,-46 2.8,-40 L-2.8,-40 C-4.6,-46 -3.6,-54 0,-60 Z', c.cel('#e6dcc0'), 1.8) +
      S('M-2.4,-41 L2.4,-38 M-2.4,-38 L2.4,-35 M-2.4,-35 L2.4,-32', '#6a4a2a', 1.3);
  };
  /* shipwright's adze: ash handle, a curved steel blade across the top, a short poll behind */
  WP.adze = function (c) {
    return P('M-2.3,12 L-2.6,-38 L2.6,-38 L2.3,12 Z', c.cel(WOOD), 2) + S('M-2.4,2 L2.4,4 M-2.4,6 L2.4,8', dk(WOOD, 0.45), 1, 0.8) +
      P('M-5,-43 L5,-43 L5,-35 L-5,-35 Z', c.cel('#5d6269'), 1.8) +
      P('M4,-42 C10,-43 16,-40 19,-33 C20,-30 19,-27 18,-26 L15,-27 C14,-32 10,-36 4,-36 Z', c.lg(STEEL, 0, 0, 1, 1), 2) +
      P('M-5,-42 L-10,-41 L-10,-37 L-5,-36 Z', c.cel('#6d737a'), 1.6) + S('M15.5,-28 C15,-31 12.5,-34 8,-35.5', '#ffffff', 0.9, 0.6);
  };
  function wpn(c, k, x, y, a, s) {
    return G((WP[k] || WP.sword)(c), 'translate(' + r1(x) + ',' + r1(y) + ') rotate(' + a + ')' + (s && s !== 1 ? ' scale(' + s + ')' : ''));
  }
  function FI(k, a, s, dx, dy) { return function (c, g) { return wpn(c, k, g.fHand[0] + (dx || 0), g.fHand[1] + (dy || 0), a, s); }; }
  function BI(k, a, s, dx, dy) { return function (c, g) { return wpn(c, k, g.bHand[0] + (dx || 0), g.bHand[1] + (dy || 0), a, s); }; }
  function shield(c, col, trim) {
    var d = 'M-11,-13 L11,-13 L11,-2 C11,8 4,14 0,17 C-4,14 -11,8 -11,-2 Z';
    return P(d, c.cel(col), 2.4) + CG(F('M-11,-13 L-4,-13 L11,4 L11,11 Z', trim, 0.9), c.clip(d)) +
      S('M-8.5,-10.5 L8.5,-10.5 L8.5,-2 C8.5,6 3,11 0,13.5 C-3,11 -8.5,6 -8.5,-2 Z', trim, 1.4, 0.9) +
      C(0, -1, 3.2, c.cel('#c9ced6'), 1.6);
  }
  function pad(c, x, y, rx, col, spikes, trim) {
    var s = '';
    if (spikes) [-0.55, 0, 0.55].forEach(function (k) {
      var yy = y - rx * 0.5 + Math.abs(k) * 3;
      s += P(D`M${x + rx * k - 2.6},${yy} L${x + rx * k},${yy - rx * 0.85} L${x + rx * k + 2.6},${yy} Z`, '#dcd8cc', 1.6);
    });
    return s + P(D`M${x - rx},${y + 3} C${x - rx},${y - rx * 0.95} ${x + rx},${y - rx * 0.95} ${x + rx},${y + 3} C${x + rx * 0.5},${y + 5.5} ${x - rx * 0.5},${y + 5.5} ${x - rx},${y + 3} Z`, c.cel(col)) +
      (trim ? S(D`M${x - rx + 1.2},${y + 2.4} C${x - rx * 0.5},${y + 4.8} ${x + rx * 0.5},${y + 4.8} ${x + rx - 1.2},${y + 2.4}`, trim, 1.8) : '');
  }
  function glowOrb(c, x, y, r, col) {
    return C(x, y, r * 2.2, c.rg([[0, lt(col, 0.6), 0.9], [0.4, col, 0.45], [1, col, 0]]), 0) + C(x, y, r * 0.7, c.rg([[0, '#ffffff'], [1, lt(col, 0.3)]]), 0);
  }

  /* ================= humanoid base (drawn FACING RIGHT) ================= */
  var HB = {
    sx: 64, hipY: 82, shY: 50, lean: 0, shW: 16, waistW: 10.5, legW: 9.5, armW: 8.5,
    headX: 67, headY: 33, headR: 12, footY: 122, stance: 7, dig: 0, belly: 0, neck: 7,
    fEl: [8, 12], fHd: [13, 23], bEl: [-6, 14], bHd: [-3, 27]
  };
  function foot(c, o, f, col) { var s = foot0(c, o, f, col); return o.footK ? scaleAt(s, o.footK, f[0], f[1] + 5) : s; }
  function foot0(c, o, f, col) {
    var x = f[0], y = f[1] + 5, k = o.feet || 'boot';
    if (k === 'thoof') return taurenHoof(c, o, x, y);
    if (k === 'ttoe') {
      /* troll (key kept for old saves): a soft boot bound with cloth wraps up the ankle */
      var wr = f[0] < 64 ? '#b8a888' : '#d8ccae';
      return P(D`M${x - 5},${y - 10} L${x + 3},${y - 10} C${x + 5},${y - 6} ${x + 10.5},${y - 5} ${x + 10.5},${y - 1.5} L${x + 10.5},${y} L${x - 5.5},${y} Z`, c.cel(col), 2.2) +
        S(D`M${x - 5},${y - 8.5} L${x + 3.5},${y - 7} M${x - 5},${y - 5.5} L${x + 4.5},${y - 4} M${x - 4.5},${y - 3} L${x + 1},${y - 2}`, OL, 2.6) +
        S(D`M${x - 5},${y - 8.5} L${x + 3.5},${y - 7} M${x - 5},${y - 5.5} L${x + 4.5},${y - 4} M${x - 4.5},${y - 3} L${x + 1},${y - 2}`, wr, 1.4);
    }
    if (k === 'hoof') return P(D`M${x - 5},${y - 8} L${x + 5},${y - 8} L${x + 7.5},${y} L${x - 6},${y} Z`, '#2d2420', 2.2) + S(D`M${x + 1.5},${y - 7} L${x + 2},${y}`, '#000', 1.2);
    if (k === 'boot') return P(D`M${x - 5},${y - 9} L${x + 3},${y - 9} C${x + 5},${y - 6} ${x + 11},${y - 5} ${x + 11},${y - 1.5} L${x + 11},${y} L${x - 5.5},${y} Z`, c.cel(col), 2.2);
    return P(D`M${x - 5},${y - 8} L${x + 3},${y - 8} C${x + 7},${y - 6} ${x + 11},${y - 4} ${x + 12},${y} L${x - 6},${y} Z`, c.cel(col), 2.2) +
      S(D`M${x + 12},${y} l2.6,-0.6 M${x + 8},${y} l2.4,-1.2`, '#efe6cf', 1.5);
  }
  function humanoid(c, o) {
    if (o.swk && SWK === 1) { SWK = o.swk; try { return humanoid0(c, o); } finally { SWK = 1; } }
    return humanoid0(c, o);
  }
  function humanoid0(c, o) {
    var b = {}, k;
    for (k in HB) b[k] = HB[k];
    if (o.body) for (k in o.body) b[k] = o.body[k];
    var sx = b.sx, hy = b.hipY, sy = b.shY, scx = sx + b.lean, fy = b.footY;
    var g = { b: b, sx: sx, hy: hy, sy: sy, scx: scx, fy: fy, X: b.headX, Y: b.headY, r: b.headR };
    var out = '';
    var bSh = [scx - b.shW + 4, sy + 5], fSh = [scx + b.shW - 4, sy + 5];
    var bArm = [bSh, [bSh[0] + b.bEl[0], bSh[1] + b.bEl[1]], [bSh[0] + b.bHd[0], bSh[1] + b.bHd[1]]];
    var fArm = [fSh, [fSh[0] + b.fEl[0], fSh[1] + b.fEl[1]], [fSh[0] + b.fHd[0], fSh[1] + b.fHd[1]]];
    g.bHand = bArm[2]; g.fHand = fArm[2]; g.fSh = fSh; g.bSh = bSh; g.fEl = fArm[1];
    var bHip = [sx - 4.5, hy + 4], fHip = [sx + 4.5, hy + 4];
    var bFoot = [sx - b.stance, fy - 5], fFoot = [sx + b.stance + 2, fy - 5];
    function leg(h, f) {
      var L = f[1] - h[1];
      if (b.dig) return [h, [(h[0] + f[0]) / 2 + 7, h[1] + L * 0.4], [(h[0] + f[0]) / 2 - 3, h[1] + L * 0.78], f];
      return [h, [(h[0] + f[0]) / 2 + 1.5, h[1] + L * 0.5], f];
    }
    var pants = o.pants || '#5a4632', sleeve = o.sleeve || '#777777', hand = o.hand || o.skin, boots = o.boots || '#3a2a1e';
    var tl = [scx - b.shW, sy + 3], tr = [scx + b.shW, sy + 3];
    var wl = sx - b.waistW, wr = sx + b.waistW, bel = b.belly, fem = o.gender === 'f' ? 2.5 : 0;
    g.torsoD = D`M${tl[0]},${tl[1]} Q${scx},${sy - 5} ${tr[0]},${tr[1]} C${tr[0] + 1 + bel + fem},${sy + 14} ${wr + bel * 1.3},${hy - 12} ${wr},${hy} L${wl},${hy} C${wl - 1},${hy - 12} ${tl[0] - 1},${sy + 14} ${tl[0]},${tl[1]} Z`;
    g.wl = wl; g.wr = wr;
    if (o.hairBack) out += o.hairBack(c, g, o);
    if (o.cape) out += P(D`M${scx - b.shW + 3},${sy + 1} L${scx + 5},${sy + 1} L${sx + 3},${fy - 10} Q${sx - 12},${fy - 3} ${sx - 27},${fy - 8} Q${scx - b.shW - 11},${hy - 6} ${scx - b.shW + 3},${sy + 1} Z`, c.cel(o.cape));
    if (o.gBack) out += o.gBack(c, g);
    if (o.back) out += o.back(c, g);
    var bLeg = leg(bHip, bFoot), fLeg = leg(fHip, fFoot);
    out += tube(bLeg, b.legW, dk(pants, 0.2));
    if (o.gLeg) out += o.gLeg(c, g, bLeg, 0);
    out += foot(c, o, bFoot, dk(o.feet === 'paw' || o.feet === 'bare' ? o.skin : boots, 0.18));
    out += tube(bArm, b.armW, dk(sleeve, 0.2));
    if (o.bItem && !o.portrait) out += o.bItem(c, g);
    out += C(g.bHand[0], g.bHand[1], b.armW * 0.62 * (o.handK || 1), dk(hand, 0.15), 2.2);
    out += tube(fLeg, b.legW, pants, dk(pants, 0.28));
    if (o.gLeg) out += o.gLeg(c, g, fLeg, 1);
    out += foot(c, o, fFoot, o.feet === 'paw' || o.feet === 'bare' ? o.skin : boots);
    out += P(D`M${wl},${hy - 3} L${wr},${hy - 3} L${wr + 1.5 + fem * 0.4},${hy + 9} L${wl - 1.5 - fem * 0.4},${hy + 9} Z`, c.cel(pants));
    if (o.robe) {
      g.robeD = D`M${wl - 1},${hy - 6} L${wr + 1},${hy - 6} C${wr + 5},${hy + 12} ${wr + 9},${fy - 12} ${wr + 11},${fy - 4} Q${sx + 1},${fy + 1} ${wl - 10},${fy - 4} C${wl - 8},${fy - 12} ${wl - 4},${hy + 12} ${wl - 1},${hy - 6} Z`;
      out += P(g.robeD, c.cel(o.robe)) + (o.robeFx ? o.robeFx(c, g) : '');
    }
    if (o.hump) out += o.hump(c, g, o);
    out += P(g.torsoD, c.cel(o.torsoC || sleeve));
    if (o.torsoFx) out += o.torsoFx(c, g);
    if (o.raceTorso) out += o.raceTorso(c, g, o);
    if (o.belt) out += P(D`M${wl - 0.5},${hy - 6} L${wr + 0.5 + bel * 0.3},${hy - 6} L${wr + 1},${hy} L${wl - 1},${hy} Z`, o.belt, 2) +
      (o.buckle ? R(sx + 3, hy - 6.8, 5.5, 7, o.buckle, 1.5) : '');
    if (o.gTorso) out += o.gTorso(c, g);
    if (o.mid) out += o.mid(c, g);
    if (!b.noNeck) out += tube([[scx + 2, sy + 1], [b.headX - 1, b.headY + b.headR * 0.6]], b.neck, o.neckC || o.skin);
    if (!o.headLate) out += HEAD[o.head || 'human'](c, g, o);
    if (o.pads) out += o.padK ? scaleAt(o.pads(c, g), o.padK, g.scx, g.sy + 4) : o.pads(c, g);
    if (o.headLate) out += HEAD[o.head](c, g, o);
    if (o.gFront) out += o.gFront(c, g);
    if (o.raceFront) out += o.raceFront(c, g, o);
    out += tube(fArm, b.armW, sleeve, dk(sleeve, 0.28));
    if (o.bell) {
      var ex = fArm[1][0] + (fArm[2][0] - fArm[1][0]) * 0.45, ey = fArm[1][1] + (fArm[2][1] - fArm[1][1]) * 0.45;
      out += tube([[ex, ey], [fArm[2][0] - (fArm[2][0] - fArm[1][0]) * 0.18, fArm[2][1] - (fArm[2][1] - fArm[1][1]) * 0.18]], b.armW + 5, sleeve, o.bell);
    }
    if (o.armband) {
      var ax = fArm[0][0] + (fArm[1][0] - fArm[0][0]) * 0.55, ay = fArm[0][1] + (fArm[1][1] - fArm[0][1]) * 0.55;
      var ux = (fArm[1][0] - fArm[0][0]) * 0.12, uy = (fArm[1][1] - fArm[0][1]) * 0.12;
      out += tube([[ax - ux, ay - uy], [ax + ux, ay + uy]], b.armW + 1.2, o.armband);
    }
    if (o.armFx) out += o.armFx(c, g, fArm, o);
    if (o.fItem && !o.portrait) out += o.fItem(c, g);
    out += C(g.fHand[0], g.fHand[1], b.armW * 0.66 * (o.handK || 1), c.cel(hand), 2.2);
    if (o.late) out += o.late(c, g, o);
    if (o.top) out += o.topK ? scaleAt(o.top(c, g), o.topK, g.X, g.Y - g.r * 0.9) : o.top(c, g);
    return scaleAt(out, o.scale || 1, 64, o.race ? 122 : 124);
  }

  /* hoods, masks, bandanas, caps, eyepatch and hats over any head (shared by human, orc and troll heads) */
  function headWear(c, g, o, ex, ey) {
    var X = g.X, Y = g.Y, r = g.r, h = o.hair, hc = h ? h.c : null, out = '';
    if (o.hood) {
      out += P(D`M${X + r * 0.88},${Y - r * 0.35} C${X + r * 0.7},${Y - r * 1.6} ${X - r * 1.55},${Y - r * 1.55} ${X - r * 1.32},${Y + r * 0.3} C${X - r * 1.25},${Y + r * 1.2} ${X - r * 0.8},${Y + r * 1.7} ${X + r * 0.2},${Y + r * 1.62} L${X + r * 0.1},${Y + r * 0.9} C${X - r * 0.35},${Y + r * 0.5} ${X - r * 0.4},${Y - r * 0.1} ${X - r * 0.05},${Y - r * 0.5} C${X + r * 0.25},${Y - r * 0.7} ${X + r * 0.6},${Y - r * 0.55} ${X + r * 0.88},${Y - r * 0.35} Z`, c.cel(o.hood));
      if (o.hoodPeak && h) out += P(D`M${X + r * 0.05},${Y - r * 0.5} L${X + r * 0.95},${Y - r * 0.36} L${X + r * 0.7},${Y - r * 0.1} L${X + r * 0.5},${Y - r * 0.28} L${X + r * 0.3},${Y - r * 0.06} L${X + r * 0.15},${Y - r * 0.3} Z`, c.cel(hc), 1.4);
      if (o.hoodPeak) out += F(D`M${X + r * 0.1},${Y - r * 0.45} L${X + r * 1.12},${Y - r * 0.3} L${X + r * 1.05},${Y + r * 0.12} L${X},${Y + r * 0.12} Z`, '#000', 0.3) +
        P(D`M${X + r * 1.2},${Y - r * 0.22} C${X + r * 0.95},${Y - r * 0.7} ${X + r * 0.3},${Y - r * 0.8} ${X - r * 0.15},${Y - r * 0.55} L${X + r * 0.25},${Y - r * 1.05} C${X + r * 0.8},${Y - r * 1.0} ${X + r * 1.15},${Y - r * 0.7} ${X + r * 1.2},${Y - r * 0.22} Z`, c.cel(o.hood), 1.8);
    }
    if (o.mask) {
      out += P(D`M${X - r * 0.15},${Y + r * 0.15} L${X + r + 3},${Y + r * 0.22} L${X + r * 1.02},${Y + r * 0.8} C${X + r * 0.72},${Y + r * 1.2} ${X + r * 0.05},${Y + r * 1.22} ${X - r * 0.35},${Y + r * 0.92} Z`, c.cel(o.mask), 1.8) +
        S(D`M${X + r * 0.2},${Y + r * 0.55} Q${X + r * 0.6},${Y + r * 0.7} ${X + r * 0.95},${Y + r * 0.6}`, dk(o.mask, 0.35), 1.1);
      if (o.maskKnot) out += o.maskKnot(c, X, Y, r, o.mask);
      else if (!o.hood) out += P(D`M${X - r * 0.3},${Y + r * 0.4} L${X - r * 1.3},${Y + r * 0.85} L${X - r * 0.95},${Y + r * 1.2} Z`, o.mask, 1.6);
    }
    if (o.bandana) {
      out += P(D`M${X - r * 0.95},${Y - r * 0.05} L${X - r * 1.85},${Y + r * 0.7} L${X - r * 1.35},${Y + r * 0.95} Z M${X - r * 0.95},${Y + r * 0.05} L${X - r * 1.5},${Y + r * 1.15} L${X - r * 0.95},${Y + r * 1.2} Z`, dk(o.bandana, 0.15), 1.6) +
        P(D`M${X + r * 0.95},${Y - r * 0.28} C${X + r * 0.8},${Y - r * 1.48} ${X - r * 1.38},${Y - r * 1.42} ${X - r * 1.08},${Y + r * 0.15} L${X - r * 0.62},${Y - r * 0.18} C${X - r * 0.1},${Y - r * 0.5} ${X + r * 0.45},${Y - r * 0.42} ${X + r * 0.95},${Y - r * 0.28} Z`, c.cel(o.bandana), 2) +
        C(X - r * 0.3, Y - r * 0.85, 1.1, '#f4ecd8', 0) + C(X + r * 0.3, Y - r * 0.95, 1.1, '#f4ecd8', 0) + C(X - r * 0.75, Y - r * 0.35, 1.1, '#f4ecd8', 0);
    }
    if (o.cap) {
      out += P(D`M${X + r * 0.9},${Y - r * 0.35} C${X + r * 0.8},${Y - r * 1.5} ${X - r * 1.35},${Y - r * 1.45} ${X - r * 1.1},${Y + r * 0.1} L${X - r * 0.6},${Y - r * 0.2} C${X - r * 0.1},${Y - r * 0.5} ${X + r * 0.45},${Y - r * 0.45} ${X + r * 0.9},${Y - r * 0.35} Z`, c.cel(o.cap), 2) +
        P(D`M${X + r * 0.2},${Y - r * 0.5} L${X + r * 1.6},${Y - r * 0.4} L${X + r * 1.5},${Y - r * 0.2} L${X + r * 0.2},${Y - r * 0.3} Z`, dk(o.cap, 0.2), 1.6);
    }
    if (o.eyepatch) out += S(D`M${ex - 2.5},${ey - 1.5} L${X - r * 0.75},${Y - r * 0.85} M${ex + 2},${ey + 1.5} L${X + r * 1.02},${Y + r * 0.2}`, '#141010', 1.3) + E(ex + 0.3, ey, 2.9, 2.5, '#161212', 1.2);
    if (o.hat === 'wide') {
      out += P(D`M${X - r * 0.6},${Y - r * 0.95} C${X - r * 1.6},${Y - r * 1.9} ${X - r * 2.5},${Y - r * 1.5} ${X - r * 2.7},${Y - r * 0.7} C${X - r * 2.0},${Y - r * 1.15} ${X - r * 1.3},${Y - r * 0.95} ${X - r * 0.6},${Y - r * 0.7} Z`, c.cel('#b8242a'), 1.8) +
        P(D`M${X - r * 0.95},${Y - r * 0.55} C${X - r * 1.05},${Y - r * 1.7} ${X - r * 0.2},${Y - r * 1.98} ${X + r * 0.35},${Y - r * 1.78} C${X + r * 0.9},${Y - r * 1.6} ${X + r * 0.98},${Y - r * 1.1} ${X + r * 0.92},${Y - r * 0.62} Z`, c.cel('#35292e'), 2.2) +
        P(D`M${X - r * 0.98},${Y - r * 0.62} L${X + r * 0.95},${Y - r * 0.7} L${X + r * 0.95},${Y - r * 0.95} L${X - r * 1.0},${Y - r * 0.9} Z`, '#8e1c22', 1.4) +
        P(D`M${X - r * 2.05},${Y - r * 0.42} C${X - r * 1.6},${Y - r * 0.85} ${X + r * 1.6},${Y - r * 0.98} ${X + r * 2.15},${Y - r * 0.62} C${X + r * 1.7},${Y - r * 0.28} ${X - r * 1.5},${Y - r * 0.12} ${X - r * 2.05},${Y - r * 0.42} Z`, c.cel('#2c2327'), 2.2);
    }
    return out;
  }
  /* ================= heads (facing right) ================= */
  var HEAD = {
    human: function (c, g, o) {
      var X = g.X, Y = g.Y, r = g.r, sk = o.skin, fem = o.gender === 'f', h = o.hair, out = '';
      var hc = h ? h.c : null, st = h ? h.style : '';
      var capped = o.hood || o.bandana || o.cap || o.hat, race = o.race;
      if (race) out += raceHair(c, g, o, 'back', capped);
      if (h && (!o.hood || st === 'long' || st === 'ponytail' || st === 'braid')) {
        if (st === 'long' || st === 'mane') {
          var ln = st === 'long' ? 2.25 : 1.55;
          out += P(D`M${X - r * 0.85},${Y - r * 0.4} C${X - r * 1.5},${Y + r * 0.6} ${X - r * 1.4},${Y + r * (ln - 0.35)} ${X - r * 0.7},${Y + r * ln} L${X + r * 0.1},${Y + r * (ln - 0.4)} C${X - r * 0.25},${Y + r * 1.1} ${X - r * 0.1},${Y + r * 0.6} ${X - r * 0.2},${Y} Z`, c.cel(hc));
        } else if (st === 'ponytail') {
          out += P(D`M${X - r * 0.7},${Y - r * 0.7} C${X - r * 2},${Y - r * 0.6} ${X - r * 2.15},${Y + r * 1.1} ${X - r * 1.6},${Y + r * 2.1} C${X - r * 1.25},${Y + r * 1.2} ${X - r * 1.05},${Y + r * 0.5} ${X - r * 0.55},${Y + r * 0.1} Z`, c.cel(hc));
        } else if (st === 'bun') {
          out += C(X - r * 0.72, Y - r * 1.0, r * 0.5, c.cel(hc));
        } else if (st === 'braid') {
          out += tube([[X - r * 0.8, Y + r * 0.2], [X - r * 1.1, Y + r * 1.2], [X - r * 0.95, Y + r * 2.0]], r * 0.42, hc, dk(hc, 0.3)) +
            C(X - r * 0.95, Y + r * 2.15, r * 0.24, '#8a2a2a', 1.5);
        } else if (st === 'bob') {
          out += P(D`M${X - r * 0.9},${Y - r * 0.5} C${X - r * 1.4},${Y + r * 0.3} ${X - r * 1.25},${Y + r * 1.05} ${X - r * 0.6},${Y + r * 1.15} L${X - r * 0.1},${Y + r * 0.85} L${X - r * 0.2},${Y} Z`, c.cel(hc));
        }
      }
      var j = fem ? 0.9 : 1;
      out += P(D`M${X - r},${Y + 1} C${X - r},${Y - r * 1.3} ${X + r * 0.95},${Y - r * 1.3} ${X + r},${Y - r * 0.15} L${X + r + 2.6},${Y + r * 0.28} L${X + r * 0.98},${Y + r * 0.5} C${X + r * 0.95},${Y + r * j} ${X + r * 0.3},${Y + r * 1.12 * j} ${X - r * 0.2},${Y + r * 1.03 * j} C${X - r * 0.8},${Y + r * 0.95} ${X - r},${Y + r * 0.5} ${X - r},${Y + 1} Z`, c.cel(sk));
      out += F(D`M${X - r + 1.2},${Y + 2} C${X - r + 1.2},${Y + r * 0.6} ${X - r * 0.5},${Y + r * 0.92} ${X - r * 0.1},${Y + r * 0.97} C${X - r * 0.45},${Y + r * 0.5} ${X - r * 0.55},${Y} ${X - r + 1.2},${Y + 2} Z`, dk(sk, 0.3), 0.4);
      var ex = X + r * 0.52, ey = Y - r * 0.02;
      var bc = hc ? dk(hc, 0.15) : dk(sk, 0.55);
      if (race === 'gnome') out += gnomeEye(c, g, o, ex, ey, bc);
      else if (race === 'nightelf') out += nelfEye(c, g, o, ex, ey, bc);
      else {
        out += E(ex, ey, 1.95, 1.55, '#fbf6ee', 0) + C(ex + 0.7, ey + 0.1, 1.1, o.eyeC || '#20242e', 0);
        if (fem) out += S(D`M${ex - 1.4},${ey - 1.7} L${ex + 2.4},${ey - 1.5}`, '#1a1009', 1);
        out += o.angry ? S(D`M${ex - 2.8},${ey - 4.2} L${ex + 2.8},${ey - 2.2}`, o.hood ? '#1a1009' : bc, 1.9) : S(D`M${ex - 2.6},${ey - 3.2} L${ex + 2.8},${ey - 3.5}`, bc, 1.6);
      }
      if (race) out += raceFace(c, g, o, ex, ey, bc);
      if (!o.mask) out += S(D`M${X + r * 0.5},${Y + r * 0.68} L${X + r * 0.86},${Y + r * 0.63}`, dk(sk, 0.5), 1.1);
      if (o.stubble && !o.mask) out += F(D`M${X - r * 0.3},${Y + r * 0.3} C${X - r * 0.1},${Y + r * 1.0} ${X + r * 0.3},${Y + r * 1.1} ${X + r * 0.95},${Y + r * 0.5} L${X + r * 0.9},${Y + r * 0.25} C${X + r * 0.5},${Y + r * 0.55} ${X},${Y + r * 0.4} ${X - r * 0.3},${Y + r * 0.3} Z`, '#1a1009', 0.28);
      if (h && !capped) {
        if (st === 'mohawk') {
          out += F(D`M${X + r * 0.75},${Y - r * 0.55} C${X + r * 0.7},${Y - r * 1.4} ${X - r * 1.3},${Y - r * 1.35} ${X - r * 1.0},${Y + r * 0.2} L${X - r * 0.6},${Y - r * 0.1} Z`, hc, 0.35);
          out += P(D`M${X - r * 1.0},${Y - r * 0.3} C${X - r * 1.35},${Y - r * 1.6} ${X - r * 0.1},${Y - r * 2.2} ${X + r * 0.75},${Y - r * 1.25} L${X + r * 0.45},${Y - r * 0.85} C${X - r * 0.1},${Y - r * 1.15} ${X - r * 0.5},${Y - r * 0.85} ${X - r * 0.62},${Y - r * 0.2} Z`, c.cel(hc), 2);
        } else {
          if (st === 'spiky') out += P(D`M${X - r * 1.0},${Y - r * 0.4} L${X - r * 1.4},${Y - r * 0.95} L${X - r * 0.95},${Y - r * 1.0} L${X - r * 1.05},${Y - r * 1.45} L${X - r * 0.55},${Y - r * 1.3} L${X - r * 0.45},${Y - r * 1.68} L${X - r * 0.05},${Y - r * 1.36} L${X + r * 0.25},${Y - r * 1.62} L${X + r * 0.42},${Y - r * 1.22} L${X + r * 0.85},${Y - r * 1.25} L${X + r * 0.82},${Y - r * 0.5} Z`, c.cel(hc), 2);
          out += P(D`M${X + r * 0.8},${Y - r * 0.5} C${X + r * 0.72},${Y - r * 1.45} ${X - r * 1.3},${Y - r * 1.42} ${X - r * 1.08},${Y + r * 0.25} L${X - r * 0.72},${Y + r * 0.72} C${X - r * 0.55},${Y + r * 0.15} ${X - r * 0.4},${Y - r * 0.15} ${X - r * 0.05},${Y - r * 0.38} L${X + r * 0.2},${Y - r * 0.44} L${X + r * 0.3},${Y - r * 0.28} L${X + r * 0.46},${Y - r * 0.5} L${X + r * 0.6},${Y - r * 0.34} L${X + r * 0.8},${Y - r * 0.5} Z`, c.cel(hc), 2.2);
          if (fem) out += P(D`M${X + r * 0.82},${Y - r * 0.52} C${X + r * 0.7},${Y - r * 0.05} ${X + r * 0.25},${Y - r * 0.1} ${X - r * 0.15},${Y - r * 0.4} C${X + r * 0.2},${Y - r * 0.75} ${X + r * 0.6},${Y - r * 0.75} ${X + r * 0.82},${Y - r * 0.52} Z`, hc, 1.6);
          out += S(D`M${X - r * 0.6},${Y - r * 0.9} C${X - r * 0.2},${Y - r * 1.15} ${X + r * 0.2},${Y - r * 1.12} ${X + r * 0.45},${Y - r * 0.9}`, lt(hc, 0.35), 1.4, 0.7);
        }
        if (race) out += raceHair(c, g, o, 'front', capped);
      }
      if (!o.hood && race !== 'gnome' && race !== 'nightelf') out += F(D`M${X - r * 0.36},${Y - r * 0.02} C${X - r * 0.2},${Y - r * 0.25} ${X + r * 0.04},${Y} ${X - r * 0.06},${Y + r * 0.34} C${X - r * 0.14},${Y + r * 0.5} ${X - r * 0.36},${Y + r * 0.42} ${X - r * 0.36},${Y - r * 0.02} Z`, dk(sk, 0.08)) +
        S(D`M${X - r * 0.34},${Y - r * 0.04} C${X - r * 0.2},${Y - r * 0.24} ${X + r * 0.04},${Y} ${X - r * 0.06},${Y + r * 0.34} C${X - r * 0.14},${Y + r * 0.48} ${X - r * 0.3},${Y + r * 0.44} ${X - r * 0.34},${Y + r * 0.34}`, OL, 1.3) +
        S(D`M${X - r * 0.22},${Y + r * 0.06} Q${X - r * 0.08},${Y + r * 0.12} ${X - r * 0.16},${Y + r * 0.28}`, dk(sk, 0.4), 0.9);
      if (o.beard && h && !o.mask) out += P(D`M${X - r * 0.3},${Y + r * 0.25} C${X - r * 0.15},${Y + r * 1.0} ${X + r * 0.2},${Y + r * 1.45} ${X + r * 0.72},${Y + r * 1.12} C${X + r * 1.02},${Y + r * 0.85} ${X + r * 1.03},${Y + r * 0.55} ${X + r * 0.92},${Y + r * 0.48} C${X + r * 0.7},${Y + r * 0.6} ${X + r * 0.5},${Y + r * 0.5} ${X + r * 0.35},${Y + r * 0.55} C${X + r * 0.1},${Y + r * 0.5} ${X - r * 0.05},${Y + r * 0.35} ${X - r * 0.3},${Y + r * 0.25} Z`, c.cel(hc), 1.8) +
        S(D`M${X + r * 0.42},${Y + r * 0.5} Q${X + r * 0.75},${Y + r * 0.38} ${X + r * 1.02},${Y + r * 0.55}`, dk(hc, 0.2), 2);
      out += headWear(c, g, o, ex, ey);
      if (race) out += raceHair(c, g, o, 'top', capped);
      return out;
    },
    gnoll: function (c, g, o) {
      var X = g.X, Y = g.Y, r = g.r, f = o.skin, fd = dk(f, 0.3), out = '';
      out += P(D`M${X - r * 0.1},${Y - r * 0.95} L${X - r * 0.95},${Y - r * 0.85} L${X - r * 0.75},${Y - r * 0.45} L${X - r * 1.6},${Y - r * 0.15} L${X - r * 1.05},${Y + r * 0.2} L${X - r * 1.7},${Y + r * 0.7} L${X - r * 0.95},${Y + r * 0.9} L${X - r * 1.35},${Y + r * 1.55} L${X - r * 0.3},${Y + r * 1.2} Z`, c.cel(o.mane || dk(f, 0.45)), 2);
      out += P(D`M${X - r * 0.1},${Y - r * 0.7} L${X + r * 0.1},${Y - r * 1.9} L${X + r * 0.55},${Y - r * 0.7} Z`, fd, 2);
      out += P(D`M${X - r},${Y + r * 0.1} C${X - r},${Y - r * 1.1} ${X + r * 0.3},${Y - r * 1.2} ${X + r * 0.75},${Y - r * 0.55} L${X + r * 1.9},${Y - r * 0.15} C${X + r * 2.25},${Y - r * 0.05} ${X + r * 2.3},${Y + r * 0.35} ${X + r * 2.0},${Y + r * 0.5} L${X + r * 0.9},${Y + r * 0.62} C${X + r * 0.4},${Y + r * 1.1} ${X - r * 0.6},${Y + r * 1.05} ${X - r},${Y + r * 0.1} Z`, c.cel(f));
      out += F(D`M${X + r * 1.35},${Y - r * 0.3} L${X + r * 1.9},${Y - r * 0.15} C${X + r * 2.25},${Y - r * 0.05} ${X + r * 2.3},${Y + r * 0.35} ${X + r * 2.0},${Y + r * 0.5} L${X + r * 1.35},${Y + r * 0.56} Z`, dk(f, 0.55), 0.55);
      out += P(D`M${X + r * 0.7},${Y + r * 0.58} L${X + r * 1.85},${Y + r * 0.55} C${X + r * 1.75},${Y + r * 0.98} ${X + r * 1.2},${Y + r * 1.12} ${X + r * 0.55},${Y + r * 0.98} Z`, dk(f, 0.2), 2);
      out += F(D`M${X + r * 0.95},${Y + r * 0.6} l1.5,2.6 l1.5,-2.6 z M${X + r * 1.45},${Y + r * 0.58} l1.4,2.4 l1.4,-2.4 z`, '#f4ecd6');
      out += E(X + r * 2.1, Y + r * 0.02, 2.5, 2.1, '#140c08', 0);
      out += C(X - r * 0.35, Y - r * 0.35, 1.6, dk(f, 0.45), 0, 0.7) + C(X - r * 0.1, Y + r * 0.5, 1.4, dk(f, 0.45), 0, 0.7) + C(X + r * 0.8, Y - r * 0.55, 1.2, dk(f, 0.45), 0, 0.6);
      out += P(D`M${X + r * 0.2},${Y - r * 0.4} Q${X + r * 0.6},${Y - r * 0.62} ${X + r * 0.95},${Y - r * 0.35} Q${X + r * 0.6},${Y - r * 0.1} ${X + r * 0.2},${Y - r * 0.4} Z`, o.eyeC || '#f5c02a', 1.2) + C(X + r * 0.66, Y - r * 0.37, 1.1, '#140c08', 0);
      out += S(D`M${X + r * 0.05},${Y - r * 0.78} L${X + r * 1.05},${Y - r * 0.45}`, OL, 2.2);
      out += P(D`M${X - r * 0.8},${Y - r * 0.5} L${X - r * 0.62},${Y - r * 2.0} L${X + r * 0.02},${Y - r * 0.72} Z`, f, 2) + F(D`M${X - r * 0.6},${Y - r * 0.8} L${X - r * 0.58},${Y - r * 1.6} L${X - r * 0.25},${Y - r * 0.85} Z`, '#8a4a44', 0.8);
      return out;
    },
    ogre: function (c, g, o) {
      var X = g.X, Y = g.Y, r = g.r, sk = o.skin, out = '';
      out += P(D`M${X - r * 0.4},${Y - r * 0.95} C${X - r * 0.9},${Y - r * 1.9} ${X - r * 1.9},${Y - r * 1.5} ${X - r * 2.0},${Y - r * 0.6} C${X - r * 1.5},${Y - r * 1.0} ${X - r * 1.0},${Y - r * 0.9} ${X - r * 0.6},${Y - r * 0.6} Z`, c.cel('#3a2418'), 2);
      out += P(D`M${X - r * 0.95},${Y + r * 0.1} L${X - r * 1.5},${Y - r * 0.5} L${X - r * 0.8},${Y - r * 0.35} Z`, sk, 1.8);
      out += P(D`M${X - r},${Y} C${X - r},${Y - r * 1.25} ${X + r},${Y - r * 1.25} ${X + r * 1.05},${Y - r * 0.2} L${X + r * 1.3},${Y + r * 0.15} L${X + r * 1.12},${Y + r * 0.35} C${X + r * 1.45},${Y + r * 0.6} ${X + r * 1.45},${Y + r * 1.25} ${X + r * 0.95},${Y + r * 1.4} C${X + r * 0.2},${Y + r * 1.6} ${X - r * 0.8},${Y + r * 1.3} ${X - r},${Y} Z`, c.cel(sk));
      out += F(D`M${X - r * 0.9},${Y + r * 0.2} C${X - r * 0.7},${Y + r * 1.1} ${X},${Y + r * 1.4} ${X + r * 0.5},${Y + r * 1.4} C${X},${Y + r * 1.1} ${X - r * 0.4},${Y + r * 0.6} ${X - r * 0.9},${Y + r * 0.2} Z`, dk(sk, 0.35), 0.45);
      out += P(D`M${X + r * 0.1},${Y - r * 0.35} L${X + r * 1.32},${Y - r * 0.1} L${X + r * 1.25},${Y + r * 0.12} L${X + r * 0.1},${Y - r * 0.05} Z`, dk(sk, 0.2), 1.8);
      out += C(X + r * 0.72, Y + r * 0.2, 1.7, '#ffde4a', 0) + C(X + r * 0.85, Y + r * 0.22, 0.9, '#140c08', 0);
      out += P(D`M${X + r * 1.15},${Y + r * 0.3} C${X + r * 1.6},${Y + r * 0.4} ${X + r * 1.6},${Y + r * 0.75} ${X + r * 1.2},${Y + r * 0.8} Z`, dk(sk, 0.1), 1.6);
      out += S(D`M${X + r * 0.55},${Y + r * 1.05} Q${X + r * 0.95},${Y + r * 1.15} ${X + r * 1.3},${Y + r * 1.0}`, OL, 1.6);
      out += P(D`M${X + r * 0.7},${Y + r * 1.1} L${X + r * 0.8},${Y + r * 0.55} L${X + r * 1.0},${Y + r * 1.08} Z`, '#f4ecd6', 1.4) + P(D`M${X + r * 1.12},${Y + r * 1.02} L${X + r * 1.25},${Y + r * 0.62} L${X + r * 1.35},${Y + r * 0.98} Z`, '#f4ecd6', 1.3);
      return out;
    },
    tauren: function (c, g, o) {
      var X = g.X, Y = g.Y, r = g.r, f = o.skin, out = '';
      var horn = c.lg(['#f6ecd2', '#c9b58a', '#8a7650'], 0, 0, 1, 1);
      out += P(D`M${X - r * 0.3},${Y - r * 0.55} C${X - r * 1.2},${Y - r * 0.85} ${X - r * 1.85},${Y - r * 1.25} ${X - r * 1.95},${Y - r * 2.15} C${X - r * 1.55},${Y - r * 1.6} ${X - r * 0.95},${Y - r * 1.35} ${X + r * 0.1},${Y - r * 0.95} Z`, horn, 2.2);
      out += P(D`M${X - r * 0.85},${Y - r * 0.05} C${X - r * 1.55},${Y - r * 0.15} ${X - r * 1.9},${Y + r * 0.3} ${X - r * 1.85},${Y + r * 0.55} C${X - r * 1.35},${Y + r * 0.55} ${X - r * 1.0},${Y + r * 0.38} ${X - r * 0.75},${Y + r * 0.3} Z`, c.cel(dk(f, 0.1)), 2);
      out += P(D`M${X - r * 0.95},${Y - r * 0.1} C${X - r * 0.9},${Y - r * 1.1} ${X + r * 0.5},${Y - r * 1.15} ${X + r * 0.85},${Y - r * 0.5} C${X + r * 1.2},${Y - r * 0.2} ${X + r * 1.7},${Y + r * 0.1} ${X + r * 1.8},${Y + r * 0.6} C${X + r * 1.9},${Y + r * 1.3} ${X + r * 1.5},${Y + r * 1.65} ${X + r * 0.95},${Y + r * 1.6} C${X + r * 0.3},${Y + r * 1.55} ${X - r * 0.6},${Y + r * 1.2} ${X - r * 0.95},${Y - r * 0.1} Z`, c.cel(f));
      out += P(D`M${X + r * 0.85},${Y + r * 0.35} C${X + r * 1.35},${Y + r * 0.1} ${X + r * 1.9},${Y + r * 0.4} ${X + r * 1.85},${Y + r * 0.95} C${X + r * 1.8},${Y + r * 1.55} ${X + r * 1.2},${Y + r * 1.7} ${X + r * 0.85},${Y + r * 1.4} C${X + r * 0.65},${Y + r * 1.1} ${X + r * 0.65},${Y + r * 0.6} ${X + r * 0.85},${Y + r * 0.35} Z`, c.cel('#c9a47a'), 1.8);
      out += E(X + r * 1.55, Y + r * 0.72, 1.4, 2.2, '#3a2418', 0, null, -20);
      out += '<circle cx="' + r1(X + r * 1.5) + '" cy="' + r1(Y + r * 1.25) + '" r="' + r1(r * 0.3) + '" fill="none" stroke="' + OL + '" stroke-width="3.4"/><circle cx="' + r1(X + r * 1.5) + '" cy="' + r1(Y + r * 1.25) + '" r="' + r1(r * 0.3) + '" fill="none" stroke="' + GOLD + '" stroke-width="1.7"/>';
      out += C(X + r * 0.5, Y - r * 0.12, 2, '#f5c02a', 0) + C(X + r * 0.6, Y - r * 0.1, 1, '#140c08', 0);
      out += S(D`M${X + r * 0.1},${Y - r * 0.5} L${X + r * 0.95},${Y - r * 0.25}`, OL, 2.4);
      out += P(D`M${X - r * 0.55},${Y - r * 0.55} C${X - r * 0.4},${Y - r * 1.3} ${X + r * 0.25},${Y - r * 1.35} ${X + r * 0.45},${Y - r * 0.8} Z`, c.cel('#2a1a12'), 1.8);
      out += P(D`M${X + r * 0.15},${Y - r * 0.9} C${X + r * 0.9},${Y - r * 1.15} ${X + r * 1.45},${Y - r * 1.45} ${X + r * 1.5},${Y - r * 2.25} C${X + r * 1.85},${Y - r * 1.45} ${X + r * 1.3},${Y - r * 0.75} ${X + r * 0.55},${Y - r * 0.55} Z`, horn, 2.2);
      return out;
    },
    trogg: function (c, g, o) {
      var X = g.X, Y = g.Y, r = g.r, sk = o.skin, sd = dk(sk, 0.3), st = o.stone || '#8a8478', out = '';
      function q(u, v) { return D`${X + r * u},${Y + r * v}`; }
      /* stone knobs growing out of the back of the skull */
      out += P('M' + q(-0.5, -0.78) + ' L' + q(-0.72, -1.42) + ' L' + q(-0.18, -0.98) + ' Z', c.cel(st), 1.8) +
        P('M' + q(-0.92, -0.4) + ' L' + q(-1.45, -0.82) + ' L' + q(-0.8, -0.86) + ' Z', c.cel(st), 1.8) +
        P('M' + q(0.08, -0.98) + ' L' + q(0.05, -1.55) + ' L' + q(0.45, -0.96) + ' Z', c.cel(st), 1.8);
      out += P('M' + q(-0.55, -0.02) + ' L' + q(-1.08, -0.22) + ' L' + q(-0.62, 0.36) + ' Z', c.cel(sk), 1.8);
      var d = 'M' + q(-0.95, 0.2) + ' C' + q(-1.0, -0.85) + ' ' + q(-0.1, -1.12) + ' ' + q(0.55, -0.8) + ' C' + q(0.9, -0.62) + ' ' + q(1.08, -0.45) + ' ' + q(1.12, -0.22) +
        ' L' + q(0.98, 0.02) + ' C' + q(1.2, 0.12) + ' ' + q(1.25, 0.35) + ' ' + q(1.08, 0.45) + ' C' + q(1.38, 0.55) + ' ' + q(1.5, 0.95) + ' ' + q(1.22, 1.24) +
        ' C' + q(0.8, 1.52) + ' ' + q(-0.1, 1.46) + ' ' + q(-0.55, 1.1) + ' C' + q(-0.85, 0.85) + ' ' + q(-0.95, 0.55) + ' ' + q(-0.95, 0.2) + ' Z';
      out += P(d, c.cel(sk));
      out += CG(F(blob(X - r * 0.4, Y - r * 0.5, r * 0.3, r * 0.2, 5, rnd(5), 0.5), lt(sk, 0.2), 0.8) + F(blob(X + r * 0.3, Y + r * 1.15, r * 0.7, r * 0.3, 6, rnd(6), 0.5), sd, 0.55) +
        F(blob(X - r * 0.6, Y + r * 0.5, r * 0.3, r * 0.4, 5, rnd(8), 0.5), sd, 0.45) + C(X - r * 0.1, Y - r * 0.2, r * 0.1, sd, 0, 0.7) + C(X + r * 0.2, Y + r * 0.35, r * 0.08, sd, 0, 0.7), c.clip(d));
      out += P('M' + q(0.02, -0.55) + ' C' + q(0.4, -0.76) + ' ' + q(0.9, -0.64) + ' ' + q(1.2, -0.3) + ' L' + q(1.05, -0.1) + ' C' + q(0.75, -0.3) + ' ' + q(0.4, -0.32) + ' ' + q(0.08, -0.24) + ' Z', c.cel(dk(sk, 0.14)), 1.8);
      out += C(X + r * 0.66, Y - r * 0.06, r * 0.13, o.eyeC || '#ffc23a', 1.2) + C(X + r * 0.7, Y - r * 0.05, r * 0.06, '#1a0a04', 0);
      out += C(X + r * 1.08, Y + r * 0.28, r * 0.07, '#2a1a10', 0);
      out += S('M' + q(0.35, 0.8) + ' Q' + q(0.9, 0.78) + ' ' + q(1.36, 0.62), OL, 1.8);
      out += P('M' + q(1.04, 0.68) + ' L' + q(1.12, 0.34) + ' L' + q(1.23, 0.66) + ' Z', '#efe4c8', 1.2) + P('M' + q(0.7, 0.78) + ' L' + q(0.77, 0.5) + ' L' + q(0.88, 0.76) + ' Z', '#efe4c8', 1.1);
      return out;
    },
    /* mob troll head (frostmane): pointed ears, long nose, small tusks, white hair pulled back into braids */
    troll: function (c, g, o) {
      var X = g.X, Y = g.Y, r = g.r, sk = o.skin, hc = o.mane || '#e2e4de', out = '';
      function q(u, v) { return D`${X + r * u},${Y + r * v}`; }
      /* braids hanging behind the head */
      var hl0 = o.maneLen || 1;
      out += braidG(c, hpl(g, [[-0.7, -0.4], [-1.2, 0.5], [-1.2, 0.9 + 1.1 * hl0]]), r * 0.3, hc, '#c8a060') + braidG(c, hpl(g, [[-0.4, -0.6], [-0.9, 0.3], [-0.85, 0.7 + 1.2 * hl0]]), r * 0.26, dk(hc, 0.08), '#e8dcc0');
      var ear = 'M' + q(-0.25, -0.1) + ' C' + q(-0.7, -0.34) + ' ' + q(-1.2, -0.54) + ' ' + q(-1.7, -0.52) + ' C' + q(-1.25, -0.1) + ' ' + q(-0.85, 0.34) + ' ' + q(-0.3, 0.42) + ' Z';
      out += P(ear, c.cel(sk), 2) + F('M' + q(-0.4, 0.02) + ' C' + q(-0.76, -0.18) + ' ' + q(-1.1, -0.36) + ' ' + q(-1.44, -0.42) + ' C' + q(-1.1, -0.1) + ' ' + q(-0.76, 0.2) + ' ' + q(-0.4, 0.26) + ' Z', dk(sk, 0.35), 0.6);
      if (o.earRing) out += S(D`M${X - r * 0.95},${Y + r * 0.02} L${X - r * 0.97},${Y + r * 0.26}`, '#8a6038', 1.1) + E(X - r * 0.98, Y + r * 0.4, r * 0.12, r * 0.17, c.cel('#f2ead6'), 1.1);
      var d = 'M' + q(-0.9, 0.1) + ' C' + q(-0.95, -0.95) + ' ' + q(0.35, -1.15) + ' ' + q(0.78, -0.55) + ' L' + q(0.95, -0.35) + ' C' + q(1.35, -0.2) + ' ' + q(1.85, 0.15) + ' ' + q(1.8, 0.55) +
        ' C' + q(1.75, 0.74) + ' ' + q(1.45, 0.74) + ' ' + q(1.2, 0.62) + ' C' + q(1.3, 0.82) + ' ' + q(1.25, 1.1) + ' ' + q(0.95, 1.22) + ' C' + q(0.35, 1.4) + ' ' + q(-0.45, 1.1) + ' ' + q(-0.8, 0.7) +
        ' C' + q(-0.9, 0.5) + ' ' + q(-0.92, 0.3) + ' ' + q(-0.9, 0.1) + ' Z';
      out += P(d, c.cel(sk));
      out += CG(F('M' + q(-1, 0.3) + ' C' + q(-0.6, 1.1) + ' ' + q(0.2, 1.4) + ' ' + q(0.9, 1.3) + ' L' + q(0.9, 1.6) + ' L' + q(-1, 1.6) + ' Z', dk(sk, 0.3), 0.5) +
        (o.paint ? S('M' + q(0.2, 0.1) + ' L' + q(0.85, 0.2) + ' M' + q(0.15, 0.35) + ' L' + q(0.75, 0.5), o.paint, r * 0.12, 0.9) : ''), c.clip(d));
      out += P('M' + q(0.32, -0.18) + ' Q' + q(0.6, -0.4) + ' ' + q(0.9, -0.22) + ' Q' + q(0.62, -0.02) + ' ' + q(0.32, -0.18) + ' Z', o.eyeC || '#ffd23a', 1.1) + C(X + r * 0.64, Y - r * 0.2, r * 0.08, '#1a0a04', 0);
      out += S('M' + q(0.22, -0.5) + ' L' + q(1.0, -0.22), OL, 2.4);
      out += S('M' + q(1.3, 0.55) + ' q' + r1(r * 0.1) + ',' + r1(r * 0.05) + ' ' + r1(r * 0.22) + ',0', '#1a1009', 1.2);
      out += S('M' + q(0.45, 0.92) + ' Q' + q(0.85, 0.98) + ' ' + q(1.15, 0.8), OL, 1.5);
      if (o.tusk !== 0) {
        var t = (o.tusk || 1) * 0.45;
        out += P('M' + q(0.76, 1.02) + ' C' + q(1.05 + 0.1 * t, 1.0) + ' ' + q(1.2 + 0.3 * t, 0.8 - 0.1 * t) + ' ' + q(1.2 + 0.35 * t, 0.9 - 0.75 * t) + ' C' + q(1.1 + 0.25 * t, 0.85 - 0.35 * t) + ' ' + q(1.0 + 0.1 * t, 0.78) + ' ' + q(0.74, 0.82) + ' Z', c.lg(['#fbf6e8', '#e2d8c0', '#b8aa8a'], 0, 0, 1, 1), 1.6);
      }
      /* hair pulled back tight over the crown, tied off behind */
      var mh = 'M' + q(0.72, -0.62) + ' C' + q(0.5, -1.32) + ' ' + q(-1.0, -1.36) + ' ' + q(-0.94, 0.12) + ' L' + q(-0.68, 0.28) + ' C' + q(-0.68, -0.3) + ' ' + q(-0.3, -0.72) + ' ' + q(0.3, -0.76) + ' Z';
      out += P(mh, c.cel(hc), 2) + S('M' + q(0.4, -0.9) + ' C' + q(0.0, -1.1) + ' ' + q(-0.5, -1.05) + ' ' + q(-0.8, -0.7), lt(hc, 0.5), r * 0.08, 0.7) +
        S('M' + q(0.2, -0.86) + ' C' + q(-0.2, -0.95) + ' ' + q(-0.55, -0.7) + ' ' + q(-0.72, -0.2), dk(hc, 0.25), r * 0.06, 0.8) + E(X - r * 0.74, Y - r * 0.36, r * 0.18, r * 0.24, c.cel('#8a5a2a'), 1.4, null, 30);
      if (o.feathers) out += G(P('M0,0 C4,-4 5,-14 0,-20 C-5,-14 -4,-4 0,0 Z', c.cel(o.feathers[0]), 1.5) + S('M0,-1 L0,-17', dk(o.feathers[0], 0.4), 0.8), 'translate(' + r1(X - r * 1.0) + ',' + r1(Y - r * 1.1) + ') rotate(-50) scale(' + r1(r / 11) + ')') +
        G(P('M0,0 C4,-4 5,-14 0,-20 C-5,-14 -4,-4 0,0 Z', c.cel(o.feathers[1]), 1.5) + S('M0,-1 L0,-17', dk(o.feathers[1], 0.4), 0.8), 'translate(' + r1(X - r * 1.1) + ',' + r1(Y - r * 0.9) + ') rotate(-80) scale(' + r1(r / 12) + ')');
      return out;
    },
    /* satyr: long goatish face, swept horns, goatee, fel-lit eyes */
    satyr: function (c, g, o) {
      var X = g.X, Y = g.Y, r = g.r, sk = o.skin, hc = o.mane || '#2a1822', out = '';
      function q(u, v) { return D`${X + r * u},${Y + r * v}`; }
      var horn = c.lg(['#6a5a52', '#3a2e30', '#161216'], 0, 0, 1, 1);
      out += P('M' + q(0.45, -0.72) + ' C' + q(0.55, -1.7) + ' ' + q(-0.15, -2.45) + ' ' + q(-1.2, -2.6) + ' C' + q(-0.55, -2.15) + ' ' + q(-0.05, -1.6) + ' ' + q(0.02, -0.8) + ' Z', horn, 2);
      out += P('M' + q(-0.2, -0.95) + ' C' + q(-1.0, -1.1) + ' ' + q(-1.45, -0.4) + ' ' + q(-1.5, 0.3) + ' L' + q(-1.95, 0.85) + ' L' + q(-1.3, 0.9) + ' L' + q(-1.55, 1.55) + ' L' + q(-0.9, 1.2) + ' L' + q(-0.55, 0.6) + ' Z', c.cel(hc), 2);
      var d = 'M' + q(-0.95, 0.1) + ' C' + q(-1.0, -1.0) + ' ' + q(0.3, -1.2) + ' ' + q(0.8, -0.6) + ' L' + q(1.05, -0.25) + ' C' + q(1.4, 0) + ' ' + q(1.62, 0.3) + ' ' + q(1.56, 0.56) +
        ' C' + q(1.5, 0.76) + ' ' + q(1.3, 0.82) + ' ' + q(1.1, 0.78) + ' C' + q(1.0, 1.05) + ' ' + q(0.6, 1.15) + ' ' + q(0.2, 1.05) + ' C' + q(-0.4, 0.95) + ' ' + q(-0.9, 0.6) + ' ' + q(-0.95, 0.1) + ' Z';
      out += P(d, c.cel(sk));
      out += CG(F('M' + q(-1, 0.4) + ' C' + q(-0.4, 1.1) + ' ' + q(0.4, 1.2) + ' ' + q(1.2, 0.85) + ' L' + q(1.2, 1.4) + ' L' + q(-1, 1.4) + ' Z', dk(sk, 0.3), 0.55) + S('M' + q(0.3, 0.05) + ' L' + q(0.9, 0.25), '#3a1830', r * 0.1, 0.7), c.clip(d));
      out += P('M' + q(-0.3, -0.05) + ' L' + q(-1.4, -0.5) + ' L' + q(-0.42, 0.36) + ' Z', c.cel(sk), 1.8) + F('M' + q(-0.42, 0.02) + ' L' + q(-1.15, -0.36) + ' L' + q(-0.48, 0.22) + ' Z', '#5a1a30', 0.7);
      out += C(X + r * 0.55, Y - r * 0.18, r * 0.42, c.rg([[0, '#d8ff6a', 0.65], [1, '#8aff3a', 0]]), 0) + P('M' + q(0.3, -0.16) + ' Q' + q(0.58, -0.4) + ' ' + q(0.88, -0.22) + ' Q' + q(0.6, -0.02) + ' ' + q(0.3, -0.16) + ' Z', '#e8ff60', 1.1);
      out += S('M' + q(0.15, -0.55) + ' L' + q(1.0, -0.26), OL, 2.4);
      out += C(X + r * 1.42, Y + r * 0.34, r * 0.08, '#2a0a14', 0) + S('M' + q(0.7, 0.8) + ' Q' + q(0.95, 0.86) + ' ' + q(1.18, 0.74), OL, 1.4) + P('M' + q(0.9, 0.8) + ' L' + q(0.96, 1.02) + ' L' + q(1.02, 0.79) + ' Z', '#f4ecd6', 0.9);
      out += P('M' + q(0.3, 0.95) + ' L' + q(0.98, 0.84) + ' L' + q(0.58, 1.95) + ' Z', c.cel(hc), 1.6);
      out += P('M' + q(0.3, -0.82) + ' C' + q(0.25, -1.9) + ' ' + q(-0.55, -2.62) + ' ' + q(-1.75, -2.55) + ' C' + q(-1.12, -2.25) + ' ' + q(-0.62, -1.75) + ' ' + q(-0.32, -0.86) + ' Z', horn, 2.2) +
        S('M' + q(0.0, -1.3) + ' l' + r1(-r * 0.3) + ',' + r1(r * 0.1) + ' M' + q(-0.2, -1.75) + ' l' + r1(-r * 0.28) + ',' + r1(r * 0.18) + ' M' + q(-0.6, -2.12) + ' l' + r1(-r * 0.2) + ',' + r1(r * 0.24), '#8a7a70', 1, 0.8);
      return out;
    },
    goblin: function (c, g, o) {
      var X = g.X, Y = g.Y, r = g.r, sk = o.skin, out = '';
      out += P(D`M${X - r * 0.55},${Y - r * 0.3} L${X - r * 2.3},${Y - r * 1.05} C${X - r * 2.0},${Y - r * 0.2} ${X - r * 1.4},${Y + r * 0.4} ${X - r * 0.6},${Y + r * 0.45} Z`, c.cel(sk), 2.2) +
        F(D`M${X - r * 0.8},${Y - r * 0.2} L${X - r * 1.9},${Y - r * 0.75} C${X - r * 1.7},${Y - r * 0.2} ${X - r * 1.3},${Y + r * 0.2} ${X - r * 0.8},${Y + r * 0.25} Z`, dk(sk, 0.35), 0.7);
      out += P(D`M${X + r * 0.3},${Y - r * 0.7} L${X + r * 1.2},${Y - r * 1.6} C${X + r * 1.25},${Y - r * 1.1} ${X + r * 1.0},${Y - r * 0.8} ${X + r * 0.8},${Y - r * 0.5} Z`, dk(sk, 0.2), 1.8);
      out += P(D`M${X - r * 0.9},${Y + 1} C${X - r * 0.95},${Y - r * 1.2} ${X + r * 0.9},${Y - r * 1.2} ${X + r * 0.95},${Y - r * 0.1} C${X + r * 1.05},${Y + r * 0.6} ${X + r * 0.9},${Y + r * 0.95} ${X + r * 0.3},${Y + r * 0.95} C${X - r * 0.4},${Y + r * 0.95} ${X - r * 0.85},${Y + r * 0.6} ${X - r * 0.9},${Y + 1} Z`, c.cel(sk));
      out += P(D`M${X + r * 0.2},${Y + r * 0.45} Q${X + r * 0.65},${Y + r * 0.72} ${X + r * 1.0},${Y + r * 0.42} Q${X + r * 0.75},${Y + r * 0.85} ${X + r * 0.3},${Y + r * 0.75} Z`, '#f6f0d8', 1.4) + S(D`M${X + r * 0.45},${Y + r * 0.55} L${X + r * 0.48},${Y + r * 0.78} M${X + r * 0.7},${Y + r * 0.58} L${X + r * 0.7},${Y + r * 0.8}`, OL, 0.8);
      var gog = o.goggles || 'up';
      if (gog === 'eyes') {
        out += S(D`M${X - r * 0.85},${Y - r * 0.25} L${X + r * 0.3},${Y - r * 0.25}`, '#3a2a1e', 2.8);
        out += C(X + r * 0.5, Y - r * 0.2, r * 0.32, c.rg([[0, '#ffe08a'], [1, '#e0701a']], 0.4, 0.4, 0.6), 2) + C(X + r * 0.42, Y - r * 0.3, 1, '#fff', 0, 0.8);
      } else {
        out += E(X + r * 0.5, Y - r * 0.12, 2.3, 2.3, '#fff6c8', 0) + C(X + r * 0.62, Y - r * 0.12, 1.3, '#141008', 0);
        out += S(D`M${X + r * 0.15},${Y - r * 0.48} L${X + r * 0.85},${Y - r * 0.38}`, OL, 1.8);
        out += S(D`M${X - r * 0.9},${Y - r * 0.55} Q${X - r * 0.1},${Y - r * 0.9} ${X + r * 0.6},${Y - r * 0.8}`, '#3a2a1e', 2.8);
        out += C(X + r * 0.1, Y - r * 0.8, r * 0.28, c.rg([[0, '#bfefff'], [1, '#2a7ab0']], 0.4, 0.4, 0.6), 1.8) + C(X + r * 0.62, Y - r * 0.72, r * 0.26, c.rg([[0, '#bfefff'], [1, '#2a7ab0']], 0.4, 0.4, 0.6), 1.8);
      }
      out += P(D`M${X + r * 0.8},${Y - r * 0.12} L${X + r * 1.85},${Y + r * 0.3} L${X + r * 0.85},${Y + r * 0.42} Z`, c.cel(sk), 2);
      return out;
    }
  };

  /* ================= outfit details ================= */
  function mailFx(c, g, col) {
    var d = '', row = 0;
    for (var y = g.sy + 1; y < g.hy + 2; y += 4.2, row++)
      for (var x = g.scx - g.b.shW - 3 + (row % 2) * 2.6; x < g.scx + g.b.shW + 3; x += 5.2) d += D`M${x},${y}q2.6,3.2 5.2,0`;
    return CG(S(d, col, 0.9, 0.85), c.clip(g.torsoD));
  }
  function tabardFx(c, g, col, trim) {
    var x0 = g.scx + 1, x1 = g.scx + 11;
    return P(D`M${x0},${g.sy + 9} L${x1},${g.sy + 9} L${x1 + 1.5},${g.hy + 17} L${x0 - 1},${g.hy + 17} Z`, c.cel(col), 2) +
      S(D`M${x0 + 1.4},${g.sy + 11} L${x1 - 1.4},${g.sy + 11} M${x0 + 1},${g.hy + 14.5} L${x1},${g.hy + 14.5}`, trim, 1.4) +
      P(D`M${(x0 + x1) / 2},${g.sy + 15} l3.6,4 l-3.6,4 l-3.6,-4 Z`, trim, 1.2);
  }
  function vestFx(col) {
    return function (c, g) {
      var b = g.b;
      return CG(P(D`M${g.scx - b.shW - 3},${g.sy - 4} L${g.scx + 2},${g.sy - 4} L${g.sx},${g.hy + 2} L${g.sx - b.waistW - 3},${g.hy + 2} Z`, c.cel(col), 2) +
        P(D`M${g.scx + 9},${g.sy - 4} L${g.scx + b.shW + 5},${g.sy - 4} L${g.sx + b.waistW + 5},${g.hy + 2} L${g.sx + 7},${g.hy + 2} Z`, c.cel(col), 2), c.clip(g.torsoD)) +
        S(D`M${g.scx + 3},${g.sy + 10} l4,2 M${g.scx + 2},${g.sy + 16} l4,2 M${g.scx + 1},${g.sy + 22} l4,2`, '#2a1a10', 1.2);
    };
  }
  function strapFx(col, stitch) {
    return function (c, g) {
      var b = g.b;
      return CG(P(D`M${g.scx - b.shW},${g.sy + 2} L${g.scx - b.shW + 6},${g.sy - 2} L${g.sx + b.waistW + 2},${g.hy - 6} L${g.sx + b.waistW - 3},${g.hy} Z`, col, 1.8) +
        S(D`M${g.scx + 6},${g.sy + 8} L${g.scx + 6},${g.hy - 7} M${g.scx - 6},${g.sy + 12} L${g.scx - 7},${g.hy - 7}`, stitch, 0.9, 0.8), c.clip(g.torsoD)) +
        R(g.scx + 1, g.sy + 14, 4.5, 4.5, '#e8d25a', 1.3);
    };
  }
  function robeTrimFx(trim, stripe) {
    return function (c, g) {
      var x = g.scx + 5;
      return P(D`M${x - 3.2},${g.sy - 1} L${x + 3.2},${g.sy - 1} L${x + 2.6},${g.hy} L${x - 2.6},${g.hy} Z`, stripe || trim, 1.6) +
        P(D`M${g.scx - 6},${g.sy - 1} L${x},${g.sy + 9} L${g.scx + g.b.shW - 3},${g.sy - 1}`, 'none', 0) +
        S(D`M${g.scx - 7},${g.sy} L${x},${g.sy + 9} L${g.scx + g.b.shW - 2},${g.sy + 1}`, trim, 2.2);
    };
  }
  function robeHemFx(trim, stripe) {
    return function (c, g) {
      var x = g.sx + 5, fy = g.fy;
      return CG(S(D`M${g.wl - 14},${fy - 6.5} Q${g.sx},${fy - 2} ${g.wr + 14},${fy - 6.5}`, trim, 3.2) +
        P(D`M${x - 3},${g.hy - 6} L${x + 3},${g.hy - 6} L${x + 5.5},${fy} L${x - 1.5},${fy} Z`, stripe || trim, 1.4), c.clip(g.robeD));
    };
  }
  function mantle(col, trim) {
    return function (c, g) {
      var b = g.b, x = g.scx, y = g.sy;
      return P(D`M${x - b.shW - 3},${y + 8} C${x - b.shW - 3},${y - 4} ${x + b.shW + 3},${y - 4} ${x + b.shW + 4},${y + 8} L${x + b.shW - 2},${y + 13} L${x + 6},${y + 11} L${x},${y + 15} L${x - 6},${y + 11} L${x - b.shW + 1},${y + 13} Z`, c.cel(col)) +
        S(D`M${x - b.shW - 1},${y + 9} L${x - b.shW + 1},${y + 12} L${x - 6},${y + 10} L${x},${y + 13.5} L${x + 6},${y + 10} L${x + b.shW - 2},${y + 11.5} L${x + b.shW + 2},${y + 8}`, trim, 1.5);
    };
  }

  /* paladin / warlock outfit pieces */
  var FEL = '#7ee03a';
  function sunD(x, y, r) { return star(x, y, 8, r, r * 0.55, Math.PI / 8); }
  function plateFx(c, g) {
    var d = '', b = g.b;
    for (var y = g.sy + 11; y < g.hy - 2; y += 7.5) d += D`M${g.scx - b.shW - 2},${y} Q${g.scx},${y + 3} ${g.scx + b.shW + 2},${y}`;
    return CG(S(d, '#6e7a88', 1.3, 0.9) + F(D`M${g.scx - b.shW},${g.sy} L${g.scx - 4},${g.sy} L${g.sx - 6},${g.hy} L${g.sx - b.waistW - 2},${g.hy} Z`, '#ffffff', 0.28), c.clip(g.torsoD));
  }
  function holyTabardFx(c, g) {
    var x0 = g.scx - 3, x1 = g.scx + 13, y0 = g.sy + 7, y1 = g.hy + 20, cx = (x0 + x1) / 2 + 0.5, cy = g.sy + 20;
    var d = D`M${x0},${y0} L${x1},${y0} L${x1 + 2},${y1} L${x0 - 1.5},${y1} Z`;
    return P(d, c.cel('#f6f2e6'), 2.2) +
      S(D`M${x0 + 1.8},${y0 + 2} L${x1 - 1.8},${y0 + 2} L${x1 - 0.2},${y1 - 2} L${x0 + 0.4},${y1 - 2} Z`, GOLD, 1.5) +
      P(sunD(cx, cy, 6.2), c.cel('#f2c440'), 1.2) + C(cx, cy, 2.6, '#fff4c0', 1) +
      S(D`M${cx},${cy + 8} L${cx},${y1 - 4}`, GOLD, 1.6);
  }
  function roundShield(c) {
    var o = C(0, 0, 13.5, c.lg(['#ffffff', '#ece6d4', '#b8ad90'], 0.2, 0, 0.8, 1), 2.4) +
      '<circle cx="0" cy="0" r="11.4" fill="none" stroke="' + OL + '" stroke-width="4.6"/><circle cx="0" cy="0" r="11.4" fill="none" stroke="' + GOLD + '" stroke-width="2.6"/>';
    return o + P(sunD(0, 0, 8), c.cel('#f2c440'), 1.5) + C(0, 0, 3.4, c.cel('#fff2b0'), 1.4) + S('M-8,-6 A10,10 0 0 1 -2,-9.5', '#ffffff', 1.6, 0.8);
  }
  function hornedCowl(c, g) {
    var X = g.X, Y = g.Y, r = g.r, hc = c.lg(['#e6dcc6', '#a89a86', '#4e4238'], 0, 0, 1, 1);
    /* two short horns sweeping back off the cowl, crescent-curved */
    return P(D`M${X - r * 0.95},${Y - r * 0.55} C${X - r * 1.35},${Y - r * 0.95} ${X - r * 1.7},${Y - r * 1.0} ${X - r * 2.05},${Y - r * 1.55} C${X - r * 1.45},${Y - r * 1.5} ${X - r * 0.95},${Y - r * 1.25} ${X - r * 0.55},${Y - r * 0.95} Z`, hc, 2) +
      P(D`M${X - r * 0.15},${Y - r * 1.02} C${X - r * 0.35},${Y - r * 1.55} ${X - r * 0.8},${Y - r * 1.75} ${X - r * 1.45},${Y - r * 1.85} C${X - r * 0.8},${Y - r * 2.15} ${X + r * 0.05},${Y - r * 1.95} ${X + r * 0.45},${Y - r * 1.0} Z`, hc, 2) +
      S(D`M${X - r * 1.35},${Y - r * 1.08} l${r * 0.15},${-r * 0.2} M${X - r * 0.6},${Y - r * 1.62} l${r * 0.08},${-r * 0.24}`, '#4e4238', 1, 0.8);
  }
  function felHand(c, g) {
    var x = g.bHand[0] - 2, y = g.bHand[1] - 7;
    return C(x, y + 2, 10, c.rg([[0, '#e8ffc0', 0.85], [0.4, FEL, 0.45], [1, FEL, 0]]), 0) +
      P(D`M${x},${y - 9} C${x + 4},${y - 4} ${x + 6},${y - 1} ${x + 5},${y + 3} C${x + 4},${y + 6} ${x - 4},${y + 6} ${x - 5},${y + 3} C${x - 6},${y} ${x - 3},${y - 2} ${x - 2},${y - 6} C${x - 1},${y - 4} ${x},${y - 4} ${x},${y - 9} Z`, '#4ac21a', 1.5) +
      F(D`M${x},${y - 3} C${x + 2},${y} ${x + 3},${y + 2} ${x + 2},${y + 3.5} C${x + 1},${y + 4.5} ${x - 2},${y + 4.5} ${x - 2.5},${y + 3} C${x - 2.5},${y + 1} ${x - 1},${y} ${x},${y - 3} Z`, '#e0ff9a');
  }

  /* hunter / druid outfit pieces */
  function leaf(c, x, y, a, s, col) {
    col = col || '#6ab43a';
    return G(P('M0,0 C5,-4 5,-13 0,-18 C-5,-13 -5,-4 0,0 Z', c.lg([lt(col, 0.35), col, dk(col, 0.35)], 0, 0, 1, 0), 1.6) + S('M0,-1.5 L0,-15', dk(col, 0.45), 0.9),
      'translate(' + r1(x) + ',' + r1(y) + ') rotate(' + a + ') scale(' + s + ')');
  }
  function quiver(c, g) {
    var t = [g.scx - 11, g.sy - 9], b = [g.scx - 20, g.hy - 8], out = '';
    [[-4, -13, '#b8342a'], [1, -15, '#efe6cf'], [5, -12, '#b8342a']].forEach(function (a) {
      var tx = t[0] + a[0] - 3, ty = t[1] + a[1];
      out += S(D`M${t[0] + a[0] * 0.5},${t[1] + 2} L${tx},${ty}`, OL, 3.2) + S(D`M${t[0] + a[0] * 0.5},${t[1] + 2} L${tx},${ty}`, '#c9a878', 1.4) +
        P(D`M${tx},${ty} L${tx - 3.2},${ty - 5} L${tx + 0.4},${ty - 3.2} L${tx + 3},${ty - 6.5} L${tx + 1.8},${ty + 1.5} Z`, a[2], 1.3);
    });
    return out + tube([t, b], 9.5, '#6a4428', '#4a2e1a') + S(pl([[t[0] - 0.9, t[1] + 4], [t[0] + 2.4, t[1] + 5.4]]), GOLD, 1.8) +
      S(pl([[b[0] - 0.6, b[1] - 5], [b[0] + 3, b[1] - 3.6]]), GOLD, 1.8);
  }
  function antlers(c, g) {
    var X = g.X, Y = g.Y, r = g.r, col = '#b8905a', out = '';
    var a1 = D`M${X - r * 0.55},${Y - r * 0.9} C${X - r * 0.8},${Y - r * 1.5} ${X - r * 1.0},${Y - r * 1.9} ${X - r * 1.45},${Y - r * 2.3} M${X - r * 0.8},${Y - r * 1.5} L${X - r * 1.4},${Y - r * 1.55} M${X - r * 1.05},${Y - r * 2.0} L${X - r * 0.8},${Y - r * 2.45}`;
    var a2 = D`M${X + r * 0.2},${Y - r * 1.0} C${X + r * 0.25},${Y - r * 1.6} ${X + r * 0.1},${Y - r * 2.0} ${X - r * 0.15},${Y - r * 2.5} M${X + r * 0.22},${Y - r * 1.55} L${X + r * 0.8},${Y - r * 1.9} M${X + r * 0.1},${Y - r * 2.05} L${X + r * 0.55},${Y - r * 2.55}`;
    out += S(a1, OL, 5.4) + S(a1, dk(col, 0.2), 2.6) + S(a2, OL, 5.6) + S(a2, col, 2.8);
    out += leaf(c, X - r * 0.8, Y - r * 0.75, -75, 0.5, '#5aa032') + leaf(c, X - r * 0.3, Y - r * 1.08, -35, 0.55) + leaf(c, X + r * 0.3, Y - r * 1.12, 40, 0.48, '#86c84a');
    return out;
  }
  function leafMantle(c, g) {
    var x = g.scx, y = g.sy, b = g.b, out = '';
    out += pad(c, g.bSh[0] - 1, y + 2, 8, '#5a3a22', false);
    [[-9, 4, -110], [-3, 0, -80], [3, -1, -50], [9, 2, -20], [13, 7, 10]].forEach(function (L, i) {
      out += leaf(c, x + L[0] + 2, y + L[1] + 8, L[2] + 180, 0.62, i % 2 ? '#86c84a' : '#5aa032');
    });
    return out + pad(c, g.fSh[0] + 1, y + 3, 9, '#6a4428', false, '#b8e060');
  }

  /* ================= heroes ================= */
  var CLS = {
    warrior: function (o) {
      o.torsoC = '#a2abb5'; o.sleeve = '#8f98a2'; o.hand = '#6e4a2c'; o.pants = '#7a5a3a'; o.boots = '#4b3322';
      o.belt = '#5a3a22'; o.buckle = GOLD;
      o.body.armW = (o.body.armW || 8.5) + 1; o.body.shW = (o.body.shW || 16) + 1;
      o.torsoFx = function (c, g) { return mailFx(c, g, '#56606b') + tabardFx(c, g, '#2f5fa8', GOLD); };
      o.pads = function (c, g) { return pad(c, g.bSh[0] - 1, g.sy + 2, 8, '#7f8893', false) + pad(c, g.fSh[0] + 1, g.sy + 3, 9.5, '#98a1ab', false, GOLD); };
      o.mid = function (c, g) { return G(shield(c, '#2f5fa8', GOLD), 'translate(' + r1(g.bHand[0] - 3) + ',' + r1(g.bHand[1] - 6) + ')'); };
      o.fItem = FI('sword', 30);
      o.accent = '#C79C6E';
    },
    mage: function (o) {
      o.torsoC = '#5b3fa6'; o.sleeve = '#5b3fa6'; o.bell = '#3f2a7a'; o.pants = '#3d2a70'; o.boots = '#3a2a4a';
      o.robe = '#4d3592'; o.robeFx = robeHemFx(GOLD, '#69ccf0'); o.torsoFx = robeTrimFx(GOLD, '#69ccf0');
      o.belt = '#2a1f4a'; o.buckle = '#69ccf0';
      o.pads = mantle('#2f6fc0', GOLD);
      o.body.fEl = [7, 13]; o.body.fHd = [10, 24];
      o.fItem = FI('staff', 4);
      o.accent = '#69CCF0';
    },
    priest: function (o) {
      o.torsoC = '#f3efe4'; o.sleeve = '#ebe4d4'; o.bell = '#c9c0ac'; o.pants = '#d9d1c0'; o.boots = '#8a6a3a';
      o.robe = '#efe9dc'; o.robeFx = robeHemFx(GOLD, '#e8c860'); o.torsoFx = robeTrimFx(GOLD, '#e8c860');
      o.belt = GOLD; o.buckle = '#fff2b0';
      o.pads = mantle('#e9c65a', '#fff4c8');
      o.fItem = FI('scepter', 18);
      o.bItem = function (c, g) { return glowOrb(c, g.bHand[0] - 3, g.bHand[1] - 3, 5, '#ffe27a'); };
      o.accent = '#FFFFFF';
    },
    rogue: function (o) {
      o.torsoC = '#54402f'; o.sleeve = '#45362c'; o.pants = '#352b25'; o.boots = '#231c18'; o.hand = '#2e2520';
      o.belt = '#2a211b'; o.buckle = '#e8d25a';
      o.hood = '#2f2a36'; o.hoodPeak = true; o.mask = '#2f2a36';
      o.cape = '#2f2a36';
      o.torsoFx = strapFx('#2e241c', '#a08868');
      o.body.stance = 9; o.body.lean = 2; o.body.fEl = [9, 8]; o.body.fHd = [17, 13]; o.body.bEl = [-8, 12]; o.body.bHd = [-3, 24];
      o.fItem = FI('dagger', 72);
      o.bItem = BI('dagger', 200);
      o.accent = '#FFF569';
    },
    paladin: function (o) {
      o.torsoC = '#dde2e8'; o.sleeve = '#c3cad3'; o.hand = '#aab3be'; o.pants = '#aeb6c0'; o.boots = '#8b94a0';
      o.belt = '#6a4422'; o.buckle = '#fff2b0';
      o.body.armW = (o.body.armW || 8.5) + 1.5; o.body.shW = (o.body.shW || 16) + 1.5; o.body.legW = (o.body.legW || 9.5) + 0.8;
      o.torsoFx = function (c, g) { return plateFx(c, g) + holyTabardFx(c, g); };
      o.pads = function (c, g) { return pad(c, g.bSh[0] - 1, g.sy + 2, 9, '#c89a34', false) + pad(c, g.fSh[0] + 1, g.sy + 3, 11, '#e8bd48', false, '#fff4c8'); };
      o.mid = function (c, g) { return G(roundShield(c), 'translate(' + r1(g.bHand[0] - 3) + ',' + r1(g.bHand[1] - 4) + ')'); };
      o.fItem = FI('warhammer', 30);
      o.accent = '#F58CBA';
    },
    warlock: function (o) {
      o.torsoC = '#2c1a3c'; o.sleeve = '#35204a'; o.bell = '#1c1028'; o.pants = '#20142c'; o.boots = '#1a1222';
      o.robe = '#2a1838'; o.robeFx = robeHemFx(FEL, '#5a2d82'); o.torsoFx = robeTrimFx(FEL, '#5a2d82');
      o.belt = '#141018'; o.buckle = FEL;
      o.hood = '#241530'; o.eyeC = '#3a8a10';
      if (o.cowl !== 'hood') o.top = hornedCowl;
      o.pads = function (c, g) { return pad(c, g.bSh[0] - 1, g.sy + 2, 8, '#3a2352', true) + pad(c, g.fSh[0] + 1, g.sy + 3, 9.5, '#4a2d66', true, FEL); };
      o.mid = felHand;
      o.body.fEl = [7, 13]; o.body.fHd = [10, 24];
      o.fItem = FI('skullstaff', 4);
      o.accent = '#9482C9';
    },
    hunter: function (o) {
      o.torsoC = '#557a34'; o.sleeve = '#7a5632'; o.hand = '#5a3a22'; o.pants = '#6a4a2a'; o.boots = '#3e2a1a';
      o.belt = '#4a2e1a'; o.buckle = GOLD;
      o.back = quiver;
      o.torsoFx = function (c, g) { return mailFx(c, g, '#3a5a22') + strapFx('#6a4428', '#c9a060')(c, g); };
      o.pads = function (c, g) { return pad(c, g.bSh[0] - 1, g.sy + 2, 8, '#7d8a6a', false) + pad(c, g.fSh[0] + 1, g.sy + 3, 9.5, '#8f9a78', false, '#6a4428'); };
      o.armband = '#6a4428';
      o.body.fEl = [11, 3]; o.body.fHd = [21, 4];
      o.fItem = FI('bow', 0);
      o.accent = '#ABD473';
    },
    druid: function (o) {
      o.torsoC = '#5a8434'; o.sleeve = '#4a6e2a'; o.bell = '#35521e'; o.pants = '#4a3a24'; o.boots = '#5a3a22';
      o.robe = '#4d7a2c'; o.robeFx = robeHemFx('#7a5230', '#c8a860'); o.torsoFx = robeTrimFx('#7a5230', '#b8d060');
      o.belt = '#5a3a22'; o.buckle = '#b8e060';
      o.pads = leafMantle;
      o.top = antlers;
      o.body.fEl = [7, 13]; o.body.fHd = [10, 24];
      o.fItem = FI('druidstaff', 4);
      o.accent = '#FF7D0A';
    }
  };
  function heroOpts(p) {
    p = p || {};
    var cls = CLS.hasOwnProperty(p.cls) ? p.cls : 'warrior';
    var hi = clampI(p.hair, 0, 4), f = p.gender === 'f';
    var o = { cls: cls, skin: SKIN[clampI(p.skin, 0, 3)], gender: f ? 'f' : 'm', hair: { c: HAIRC[hi], style: (f ? HAIRF : HAIRM)[hi] }, beard: !f && (hi === 2 || hi === 4) };
    o.body = f ? { shW: 14.5, waistW: 9.5, headR: 11.6, armW: 7.8, legW: 9 } : {};
    var race = typeof p.race === 'string' && RACEB.hasOwnProperty(p.race) ? p.race : null;
    if (race) raceSetup(o, race, clampI(p.skin, 0, 3), hi, f);
    if (p.cowl) o.cowl = p.cowl;
    CLS[cls](o);
    if (race) racePost(o);
    if (p.gear && typeof p.gear === 'object') applyGear(o, p.gear, cls);
    if (race && RACEB[race].fin) RACEB[race].fin(o);
    return o;
  }

  /* ================= races (opts.race): human (default), dwarf, gnome =================
     A race swaps the body proportions, skin/hair palettes and head details, then the whole figure is
     scaled about the ground line (x64, y122) so class outfits and weapons shrink with it. SWK keeps
     the outlines bold after the scale. Absent/unknown race -> the untouched human path. */
  var RACES = ['human', 'dwarf', 'gnome', 'nightelf'];
  var DSKIN = ['#f4bc9c', '#e09c78', '#b87456', '#844d37'];
  var GSKIN = ['#fcdcc6', '#f0c09c', '#cc946a', '#98643f'];
  var GHAIRC = ['#ff58ae', '#26c6bc', '#9a58e8', '#ff9030', '#5acf40'];
  var GHAIRM = ['puff', 'spikes', 'crest', 'wild', 'tuft'];
  var GHAIRF = ['pigtails', 'puff', 'bun', 'pigtails', 'wild'];
  var DBEARD = ['spade', 'twin', 'triple', 'long', 'fork'];
  var DHAIRF = ['dtwin', 'dsingle', 'dtwin', 'dcrown', 'dtwin'];
  var DBAND = ['#d6a53c', '#b8b8c0', '#d6a53c', '#c88a3a', '#8aa8c8'];
  var RACEB = {
    dwarf: {
      s: 0.9, swk: 1.1, armK: 0.84, footK: 1.42, handK: 1.08, shadow: 31, pZ: 1.1, pY: 24, pX: 32,
      m: { shW: 22, waistW: 15, belly: 4, armW: 11.5, legW: 12.5, hipY: 88, shY: 58, headX: 68, headY: 42, headR: 13.5, stance: 9, neck: 9 },
      f: { shW: 19.5, waistW: 13, belly: 1.5, armW: 10.5, legW: 11.8, hipY: 88, shY: 59, headX: 68, headY: 43.5, headR: 13, stance: 8.5, neck: 8.5 }
    },
    gnome: {
      s: 0.64, swk: 1.36, armK: 0.8, footK: 1.22, handK: 1.04, shadow: 21, pZ: 1.58, pY: 36, pX: 36,
      m: { shW: 13, waistW: 9.5, belly: 1, armW: 7.8, legW: 8.8, hipY: 87, shY: 65, headX: 68, headY: 42, headR: 17.5, stance: 6.5, neck: 7 },
      f: { shW: 12, waistW: 8.8, armW: 7.2, legW: 8.3, hipY: 87, shY: 65.5, headX: 68, headY: 42.5, headR: 17, stance: 6, neck: 6.5 }
    },
    /* night elf: ~110% of human height at scale 1 (long legs, long neck, small head near the top of the frame), slender */
    nightelf: {
      s: 1, swk: 1, armK: 1.12, footK: 1, handK: 0.94, shadow: 27, pZ: 1.2, pY: 36, pX: 38, topK: 0.72,
      m: { shW: 15, waistW: 9, armW: 7.8, legW: 8.6, hipY: 73, shY: 42, headX: 68, headY: 23.5, headR: 10.6, stance: 7.5, neck: 6.4 },
      f: { shW: 13.2, waistW: 8, armW: 7, legW: 8, hipY: 74, shY: 43.5, headX: 68, headY: 25, headR: 10.2, stance: 7, neck: 5.8 }
    }
  };
  function raceSetup(o, race, si, hi, f) {
    var bd = RACEB[race][f ? 'f' : 'm'], k;
    o.race = race; o.body = {};
    for (k in bd) o.body[k] = bd[k];
    o.beard = false;
    if (race === 'dwarf') { o.skin = DSKIN[si]; o.hair = { c: HAIRC[hi], style: f ? DHAIRF[hi] : HAIRM[hi], band: DBAND[hi] }; o.dbeard = f ? null : DBEARD[hi]; }
    else if (race === 'nightelf') { o.skin = NSKIN[si]; o.hair = { c: NHAIRC[hi], style: (f ? NHAIRF : NHAIRM)[hi] }; o.nface = f ? NTATTOO[hi] : NMFACE[hi]; o.tatC = dk(o.skin, 0.32); o.eyeC = NEYEC[hi]; }
    else if (race === 'orc' || race === 'troll') raceSetup2(o, race, si, hi, f);
    else if (race === 'tauren' || race === 'undead') raceSetup3(o, race, si, hi, f);
    else { o.skin = GSKIN[si]; o.hair = { c: GHAIRC[hi], style: (f ? GHAIRF : GHAIRM)[hi], streak: hi === 3 }; o.stache = !f && hi % 2 === 0; }
  }
  function racePost(o) {
    var R = RACEB[o.race], b = o.body;
    ['fEl', 'fHd', 'bEl', 'bHd'].forEach(function (k) { var v = b[k] || HB[k]; b[k] = [v[0] * R.armK, v[1] * R.armK]; });
    o.scale = R.s; o.swk = R.swk; o.footK = R.footK; o.handK = R.handK;
    if (R.topK) o.topK = R.topK;
    if (R.lean != null && !(b.lean >= R.lean)) b.lean = R.lean;
    if (R.padK) o.padK = o.gender === 'f' ? 1 + (R.padK - 1) * 0.4 : R.padK;
    o.raceFront = raceFront;
  }
  function racePortrait(c, o) {
    var R = RACEB[o.race], s = R.s, b = o.body, Z = R.pZ;
    var X = 64 + (b.headX - 64) * s, Y = 122 + (b.headY - 122) * s;
    o.swk = 1.22 / (s * Z);
    return G(humanoid(c, o), 'matrix(' + Z + ',0,0,' + Z + ',' + r1(R.pX - X * Z) + ',' + r1(R.pY - Y * Z) + ')');
  }
  /* point on the head in radius units */
  function hp(g, u, v) { return [g.X + g.r * u, g.Y + g.r * v]; }
  function hpl(g, pts) { return pts.map(function (p) { return hp(g, p[0], p[1]); }); }
  /* plaited braid along a polyline, a metal band near the end and a flared tuft */
  function braidG(c, pts, w, col, band) {
    var out = tube(pts, w, col, dk(col, 0.22)), d = '', i, j;
    for (i = 0; i < pts.length - 1; i++) {
      var A = pts[i], B = pts[i + 1], dx = B[0] - A[0], dy = B[1] - A[1], L = Math.sqrt(dx * dx + dy * dy) || 1, n = Math.max(1, Math.round(L / (w * 0.72)));
      for (j = 0; j < n; j++) {
        var t = (j + 0.6) * L / n, p = lptA(A, B, t, 0), q = lptA(A, B, t - w * 0.5, -w * 0.46), q2 = lptA(A, B, t - w * 0.5, w * 0.46);
        d += D`M${q[0]},${q[1]} L${p[0]},${p[1]} L${q2[0]},${q2[1]}`;
      }
    }
    out += S(d, dk(col, 0.42), Math.max(0.8, w * 0.15), 0.9);
    var P1 = pts[pts.length - 2], E1 = pts[pts.length - 1], dx1 = E1[0] - P1[0], dy1 = E1[1] - P1[1], L1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) || 1;
    out += P(pl([lptA(P1, E1, L1 - w * 0.2, -w * 0.4), lptA(P1, E1, L1 + w * 1.25, -w * 0.72), lptA(P1, E1, L1 + w * 0.8, 0), lptA(P1, E1, L1 + w * 1.25, w * 0.72), lptA(P1, E1, L1 - w * 0.2, w * 0.4)]) + 'Z', c.cel(col), 1.6);
    if (band) out += P(quadOn(P1, E1, L1 - w * 0.95, L1 - w * 0.1, -w * 0.62, w * 0.62), c.cel(band), 1.5);
    return out;
  }
  /* ---- dwarf beard: one of five braided cuts, drawn over the chest (after the shoulder pads) ---- */
  function dwarfBeard(c, g, o) {
    var X = g.X, Y = g.Y, r = g.r, hc = o.hair.c, st = o.dbeard, band = o.hair.band || GOLD, out = '';
    var len = st === 'long' ? 2.55 : st === 'fork' ? 2.4 : 2.25, fork = st === 'twin' || st === 'fork';
    function q(u, v) { return D`${X + r * u},${Y + r * v}`; }
    var top = o.mask ? 1.0 : 0.02;
    var d = o.mask
      ? 'M' + q(-0.42, 0.95) + ' C' + q(-0.52, 1.25) + ' ' + q(-0.4, 1.7) + ' ' + q(-0.12, len - 0.3)
      : 'M' + q(-0.08, top) + ' C' + q(-0.34, 0.25) + ' ' + q(-0.48, 0.8) + ' ' + q(-0.4, 1.2) + ' C' + q(-0.36, 1.6) + ' ' + q(-0.22, len - 0.45) + ' ' + q(-0.08, len - 0.3);
    /* shaggy lower edge, split for the forked cuts */
    if (fork) d += ' L' + q(0.02, len) + ' L' + q(0.2, len - 0.2) + ' L' + q(0.36, len - 0.42) + ' L' + q(0.5, len - 0.18) + ' L' + q(0.68, len - 0.05) + ' L' + q(0.78, len - 0.3);
    else d += ' L' + q(0.05, len - 0.12) + ' L' + q(0.18, len - 0.05) + ' L' + q(0.3, len + 0.08) + ' L' + q(0.45, len - 0.06) + ' L' + q(0.6, len - 0.16) + ' L' + q(0.76, len - 0.4);
    d += ' C' + q(0.98, 1.85) + ' ' + q(1.16, 1.3) + ' ' + q(1.12, o.mask ? 1.0 : 0.62);
    d += o.mask ? ' C' + q(0.7, 1.22) + ' ' + q(0.0, 1.26) + ' ' + q(-0.42, 0.95) + ' Z'
      : ' L' + q(1.03, 0.47) + ' C' + q(0.85, 0.44) + ' ' + q(0.6, 0.52) + ' ' + q(0.42, 0.44) + ' C' + q(0.26, 0.36) + ' ' + q(0.14, 0.18) + ' ' + q(-0.08, top) + ' Z';
    /* braids hang from the lower edge */
    var bw = r * 0.27, br = [];
    if (st === 'spade') br = [[[0.3, len - 0.2], [0.33, len + 0.72]]];
    else if (st === 'twin') br = [[[0.05, len - 0.25], [-0.02, len + 0.7]], [[0.6, len - 0.28], [0.7, len + 0.62]]];
    else if (st === 'triple') br = [[[-0.18, len - 0.5], [-0.24, len + 0.25]], [[0.3, len - 0.2], [0.33, len + 0.62]], [[0.74, len - 0.55], [0.84, len + 0.18]]];
    else if (st === 'long') br = [[[0.3, len - 0.2], [0.3, len + 0.55], [0.38, len + 1.05]]];
    else br = [[[0.05, len - 0.2], [-0.02, len + 0.5], [0.04, len + 0.95]], [[0.62, len - 0.25], [0.72, len + 0.5], [0.66, len + 0.9]]];
    br.forEach(function (b) { out += braidG(c, hpl(g, b), bw, hc, band); });
    out += P(d, c.cel(hc), 2.1);
    var cl = c.clip(d);
    out += CG(S(D`M${X + r * 0.1},${Y + r * 0.9} C${X + r * 0.12},${Y + r * 1.4} ${X + r * 0.2},${Y + r * 1.8} ${X + r * 0.28},${Y + r * (len - 0.1)} M${X + r * 0.55},${Y + r * 0.95} C${X + r * 0.6},${Y + r * 1.4} ${X + r * 0.58},${Y + r * 1.8} ${X + r * 0.6},${Y + r * (len - 0.2)} M${X - r * 0.22},${Y + r * 0.7} C${X - r * 0.25},${Y + r * 1.2} ${X - r * 0.18},${Y + r * 1.6} ${X - r * 0.1},${Y + r * (len - 0.35)}`, dk(hc, 0.32), r * 0.09, 0.8) +
      F(D`M${X - r * 0.5},${Y} L${X - r * 0.1},${Y} L${X - r * 0.18},${Y + r * 3} L${X - r * 0.6},${Y + r * 3} Z`, dk(hc, 0.3), 0.45) +
      S(D`M${X + r * 0.75},${Y + r * 0.75} C${X + r * 0.85},${Y + r * 1.1} ${X + r * 0.85},${Y + r * 1.4} ${X + r * 0.8},${Y + r * 1.7}`, lt(hc, 0.35), r * 0.08, 0.65), cl);
    if (st === 'triple' || st === 'long') out += P(quadOn(hp(g, 0.3, 1.25), hp(g, 0.32, 1.9), 0, r * 0.28, -r * 0.62, r * 0.6), c.cel(band), 1.5);
    if (!o.mask) {
      /* big droopy moustache over the mouth */
      out += P('M' + q(1.1, 0.36) + ' C' + q(0.9, 0.24) + ' ' + q(0.52, 0.3) + ' ' + q(0.3, 0.66) + ' C' + q(0.24, 0.86) + ' ' + q(0.3, 1.02) + ' ' + q(0.44, 0.98) + ' C' + q(0.54, 0.76) + ' ' + q(0.8, 0.62) + ' ' + q(1.08, 0.64) + ' Z', c.cel(lt(hc, 0.08)), 1.8) +
        S('M' + q(0.95, 0.42) + ' C' + q(0.7, 0.42) + ' ' + q(0.5, 0.56) + ' ' + q(0.4, 0.8), dk(hc, 0.3), r * 0.06, 0.8);
    }
    return out;
  }
  /* ---- dwarf women: long braids (one behind, one over the shoulder) ---- */
  function dwarfBraids(c, g, o, layer) {
    var h = o.hair, st = h.style, bw = g.r * (st === 'dsingle' ? 0.4 : 0.32);
    if (layer === 'back') {
      if (st === 'dsingle') return braidG(c, hpl(g, [[-0.82, 0.05], [-1.12, 1.1], [-1.02, 2.55]]), bw, h.c, h.band) + C(g.X - g.r * 0.78, g.Y - g.r * 0.98, g.r * 0.5, c.cel(h.c), 2);
      return braidG(c, hpl(g, [[-0.85, 0.15], [-1.1, 1.2], [-1.0, 2.35]]), bw, h.c, h.band);
    }
    if (layer === 'front') {
      if (st === 'dsingle') return '';
      return braidG(c, hpl(g, [[-0.62, 0.62], [-0.3, 1.45], [-0.12, 2.5]]), bw, h.c, h.band);
    }
    if (layer === 'crown' && st === 'dcrown') {
      var d = D`M${g.X + g.r * 0.62},${g.Y - g.r * 0.72} C${g.X + g.r * 0.2},${g.Y - g.r * 1.12} ${g.X - g.r * 0.6},${g.Y - g.r * 1.1} ${g.X - g.r * 0.98},${g.Y - g.r * 0.35}`;
      var n = '', i;
      for (i = 0; i < 6; i++) { var t = i / 5, a = Math.PI * (0.18 + 0.72 * t); n += E(g.X - g.r * 0.18 + Math.cos(a) * g.r * 0.82, g.Y - g.r * 0.42 - Math.sin(a) * g.r * 0.62, g.r * 0.2, g.r * 0.13, c.cel(lt(h.c, 0.12)), 1.2, null, r1(90 - a * 57.3)); }
      return S(d, OL, g.r * 0.34) + S(d, h.c, g.r * 0.26) + n;
    }
    return '';
  }
  /* ---- gnome hair: tall, puffy, bright ---- */
  function gnomeHair(c, g, o, layer) {
    var X = g.X, Y = g.Y, r = g.r, h = o.hair, hc = h.c, st = h.style, out = '', R_ = rnd(31 + st.length * 7);
    function q(u, v) { return D`${X + r * u},${Y + r * v}`; }
    function puffAt(u, v, rx, ry, k) { return P(blob(X + r * u, Y + r * v, r * rx, r * ry, k || 8, R_, 0.3), c.cel(hc), 2.2); }
    var hi = lt(hc, 0.45);
    if (layer === 'back') {
      if (st === 'pigtails') {
        out += tube(hpl(g, [[-0.8, -0.6], [-1.3, -1.02]]), r * 0.32, hc) + tube(hpl(g, [[-0.2, -1.0], [-0.1, -1.5]]), r * 0.3, hc);
        out += puffAt(-1.55, -1.25, 0.56, 0.5, 8) + puffAt(-0.04, -1.9, 0.5, 0.45, 8);
        out += C(X - r * 1.22, Y - r * 0.96, r * 0.14, c.cel(o.hair.tie || '#ffe04a'), 1.4) + C(X - r * 0.12, Y - r * 1.44, r * 0.14, c.cel(o.hair.tie || '#ffe04a'), 1.4);
      } else if (st === 'puff') out += P(blob(X - r * 0.28, Y - r * 1.12, r * 0.9, r * 0.78, 11, R_, 0.16), c.cel(hc), 2.2);
      else if (st === 'bun') out += puffAt(-0.3, -1.38, 0.44, 0.38, 7) + puffAt(-0.32, -1.98, 0.3, 0.26, 6);
      else if (st === 'wild') out += P(star(X - r * 0.28, Y - r * 0.6, 9, r * 1.28, r * 0.82, 0.3), c.cel(dk(hc, 0.08)), 2.2);
      else if (st === 'tuft') {
        /* topknot: a spray of tapered locks fanning up from a hair tie on the crown */
        [[-62, 1.35], [-38, 1.6], [-12, 1.75], [14, 1.55], [38, 1.2]].forEach(function (L, i) {
          var a = L[0] * Math.PI / 180, bx = X - r * 0.2, by = Y - r * 1.1, len = r * L[1];
          var tx = bx + Math.sin(a) * len, ty = by - Math.cos(a) * len, nx = Math.cos(a) * r * 0.2, ny = Math.sin(a) * r * 0.2;
          out += P(D`M${bx - nx},${by - ny} Q${bx + Math.sin(a) * len * 0.5 - nx * 1.6},${by - Math.cos(a) * len * 0.5 - ny * 1.6} ${tx - nx * 0.6},${ty + ny * 0.2} L${tx + Math.cos(a) * r * 0.25},${ty + Math.sin(a) * r * 0.25} Q${bx + Math.sin(a) * len * 0.5 + nx * 1.2},${by - Math.cos(a) * len * 0.5 + ny * 1.2} ${bx + nx},${by + ny} Z`, c.cel(i % 2 ? dk(hc, 0.08) : hc), 2);
        });
      }
      return out;
    }
    if (layer === 'front') {
      if (st === 'spikes') out += P('M' + q(0.82, -0.5) + ' L' + q(0.72, -1.3) + ' L' + q(0.42, -0.95) + ' L' + q(0.22, -2.05) + ' L' + q(-0.12, -1.1) + ' L' + q(-0.42, -2.12) + ' L' + q(-0.62, -1.05) + ' L' + q(-1.1, -1.85) + ' L' + q(-1.05, -0.85) + ' L' + q(-1.55, -1.2) + ' L' + q(-1.08, -0.2) + ' L' + q(-0.7, 0.3) + ' L' + q(-0.3, -0.4) + ' Z', c.cel(hc), 2.2) +
        S('M' + q(0.15, -0.8) + ' L' + q(0.2, -1.6) + ' M' + q(-0.4, -0.9) + ' L' + q(-0.42, -1.7), hi, r * 0.07, 0.7);
      else if (st === 'crest') out += P('M' + q(0.85, -0.55) + ' C' + q(1.05, -1.3) + ' ' + q(0.75, -2.05) + ' ' + q(0.05, -2.3) + ' C' + q(-0.5, -2.45) + ' ' + q(-1.0, -2.05) + ' ' + q(-0.95, -1.55) + ' C' + q(-0.7, -1.85) + ' ' + q(-0.3, -1.85) + ' ' + q(-0.2, -1.6) + ' C' + q(-0.75, -1.5) + ' ' + q(-1.2, -1.0) + ' ' + q(-1.08, 0.2) + ' L' + q(-0.72, 0.6) + ' C' + q(-0.5, -0.1) + ' ' + q(-0.1, -0.5) + ' ' + q(0.85, -0.55) + ' Z', c.cel(hc), 2.2) +
        S('M' + q(0.55, -0.9) + ' C' + q(0.6, -1.5) + ' ' + q(0.3, -1.95) + ' ' + q(-0.15, -2.05), hi, r * 0.08, 0.7);
      else if (st === 'wild') out += P('M' + q(0.85, -0.5) + ' L' + q(1.1, -1.05) + ' L' + q(0.6, -0.95) + ' L' + q(0.72, -1.6) + ' L' + q(0.2, -1.25) + ' L' + q(0.05, -1.85) + ' L' + q(-0.3, -1.3) + ' L' + q(-0.75, -1.6) + ' L' + q(-0.72, -1.0) + ' L' + q(-1.25, -0.95) + ' L' + q(-0.9, -0.5) + ' L' + q(-1.1, 0.1) + ' L' + q(-0.6, 0.2) + ' L' + q(-0.2, -0.45) + ' Z', c.cel(hc), 2.2);
      else if (st === 'tuft') out += E(X - r * 0.2, Y - r * 1.08, r * 0.3, r * 0.16, c.cel('#ffe04a'), 1.6);
      else if (st === 'puff') out += puffAt(0.32, -0.9, 0.44, 0.32, 7);
      else if (st === 'bun' || st === 'pigtails') out += P('M' + q(0.9, -0.5) + ' C' + q(0.85, -0.05) + ' ' + q(0.55, 0.0) + ' ' + q(0.35, -0.3) + ' C' + q(0.25, 0.05) + ' ' + q(-0.05, 0.0) + ' ' + q(-0.1, -0.4) + ' C' + q(0.2, -0.8) + ' ' + q(0.7, -0.8) + ' ' + q(0.9, -0.5) + ' Z', c.cel(hc), 1.8);
      if (h.streak) out += S('M' + q(0.6, -0.72) + ' C' + q(0.3, -1.3) + ' ' + q(-0.2, -1.4) + ' ' + q(-0.7, -1.05), '#fff6ea', r * 0.14, 0.95);
      return out;
    }
    return '';
  }
  function gnomeEar(c, g, o) {
    var X = g.X, Y = g.Y, r = g.r, sk = o.skin;
    var d = D`M${X - r * 0.12},${Y - r * 0.12} C${X - r * 0.55},${Y - r * 0.32} ${X - r * 1.15},${Y - r * 0.58} ${X - r * 1.78},${Y - r * 0.78} C${X - r * 1.42},${Y - r * 0.22} ${X - r * 0.9},${Y + r * 0.34} ${X - r * 0.22},${Y + r * 0.42} Z`;
    return P(d, c.cel(sk), 2) + F(D`M${X - r * 0.3},${Y - r * 0.02} C${X - r * 0.7},${Y - r * 0.2} ${X - r * 1.1},${Y - r * 0.4} ${X - r * 1.5},${Y - r * 0.62} C${X - r * 1.2},${Y - r * 0.15} ${X - r * 0.8},${Y + r * 0.2} ${X - r * 0.3},${Y + r * 0.26} Z`, '#d8766a', 0.55);
  }
  function gnomeEye(c, g, o, ex, ey, bc) {
    var r = g.r, er = r * 0.2, fem = o.gender === 'f', out = '';
    out += E(ex, ey, er * 0.98, er * 1.18, '#fbf6ee', 1.1) + C(ex + er * 0.26, ey + er * 0.12, er * 0.7, o.eyeC || '#3a78c8', 0) +
      C(ex + er * 0.32, ey + er * 0.14, er * 0.36, '#10141e', 0) + C(ex + er * 0.02, ey - er * 0.36, er * 0.24, '#ffffff', 0);
    if (fem) out += S(D`M${ex - er * 1.0},${ey - er * 0.95} Q${ex},${ey - er * 1.5} ${ex + er * 1.1},${ey - er * 1.0} l${er * 0.5},${-er * 0.35}`, OL, 1.1);
    out += o.angry ? S(D`M${ex - er * 1.3},${ey - er * 2.1} L${ex + er * 1.3},${ey - er * 1.3}`, bc, r * 0.1)
      : S(D`M${ex - er * 1.25},${ey - er * 1.75} Q${ex},${ey - er * 2.35} ${ex + er * 1.35},${ey - er * 1.85}`, bc, r * 0.09);
    return out;
  }
  function raceFace(c, g, o, ex, ey, bc) {
    var X = g.X, Y = g.Y, r = g.r, sk = o.skin, out = '';
    if (o.race === 'nightelf') return nelfFace(c, g, o);
    if (o.race === 'dwarf') {
      out += S(D`M${ex - 3.4},${ey - 3.1} L${ex + 3.4},${ey - 3.9}`, OL, 4.6) + S(D`M${ex - 3.4},${ey - 3.1} L${ex + 3.4},${ey - 3.9}`, bc, 2.8);
      out += E(X + r * 0.42, Y + r * 0.4, r * 0.22, r * 0.13, '#e0504a', 0, 0.3);
      out += o.gender === 'f' ? E(X + r * 0.99, Y + r * 0.3, r * 0.15, r * 0.14, c.cel(mix(sk, '#d86a5a', 0.12)), 1.4) : E(X + r * 1.0, Y + r * 0.3, r * 0.23, r * 0.2, c.cel(mix(sk, '#d86a5a', 0.18)), 1.6);
    } else {
      out += E(X + r * 0.42, Y + r * 0.45, r * 0.17, r * 0.1, '#ff7088', 0, 0.35);
      out += C(X + r * 0.98, Y + r * 0.3, r * 0.13, c.cel(sk), 1.4);
      if (!o.mask && o.gender !== 'f') out += S(D`M${X + r * 0.55},${Y + r * 0.72} Q${X + r * 0.72},${Y + r * 0.8} ${X + r * 0.88},${Y + r * 0.66}`, dk(sk, 0.5), r * 0.06);
    }
    return out;
  }
  function raceHair(c, g, o, layer, capped) {
    var out = '', h = o.hair;
    if (!h) return '';
    if (o.race === 'nightelf') return nelfHair(c, g, o, layer, capped);
    if (o.race === 'dwarf') {
      if (o.gender === 'f' && (layer === 'back')) out += dwarfBraids(c, g, o, 'back');
      if (o.gender === 'f' && layer === 'front') out += dwarfBraids(c, g, o, 'crown');
      return out;
    }
    if (layer === 'top') {
      if (o.stache && !o.mask) {
        var X = g.X, Y = g.Y, r = g.r;
        var m = D`M${X + r * 0.94},${Y + r * 0.46} C${X + r * 0.84},${Y + r * 0.62} ${X + r * 0.6},${Y + r * 0.62} ${X + r * 0.54},${Y + r * 0.5} C${X + r * 0.5},${Y + r * 0.4} ${X + r * 0.6},${Y + r * 0.36} ${X + r * 0.65},${Y + r * 0.44} M${X + r * 0.96},${Y + r * 0.46} C${X + r * 1.02},${Y + r * 0.6} ${X + r * 1.16},${Y + r * 0.6} ${X + r * 1.18},${Y + r * 0.5} C${X + r * 1.19},${Y + r * 0.42} ${X + r * 1.12},${Y + r * 0.4} ${X + r * 1.09},${Y + r * 0.46}`;
        out += S0(m, OL, r * 0.22) + S0(m, h.c, r * 0.12);
      }
      return out + gnomeEar(c, g, o);
    }
    if (capped) return '';
    return gnomeHair(c, g, o, layer);
  }
  function raceFront(c, g, o) {
    if (o.race === 'dwarf') {
      if (o.dbeard) return dwarfBeard(c, g, o);
      if (o.hair && o.gender === 'f') return dwarfBraids(c, g, o, 'front');
    }
    if (o.race === 'nightelf' && o.hair && o.hair.style === 'nbraid' && !o.hood) return braidG(c, hpl(g, [[-0.35, 0.55], [-0.05, 1.6], [0.12, 2.9]]), g.r * 0.3, o.hair.c, '#d8e4f0');
    return '';
  }
  /* ---- wood elf (race key 'nightelf'): long swept ears, natural skin and hair, almond eyes with a coloured iris,
     long flowing hair, faint freckle / face-paint marks (NTATTOO) or a sharp jaw ---- */
  var NSKIN = ['#f1d3b8', '#c8a07a', '#8c5e3c', '#e0b894'];
  var NHAIRC = ['#5a3a24', '#c4c6c8', '#8a3a22', '#1e1a18', '#d8b060'];
  var NEYEC = ['#4a7a3a', '#5a6a7a', '#6a4a2a', '#3a5a2a', '#6a5a2a'];
  var NHAIRM = ['nmane', 'ntail', 'nflow', 'nflow', 'ntail'];
  var NHAIRF = ['nflow', 'ntail', 'nbraid', 'nmane', 'nflow'];
  var NMFACE = ['side', 'goatee', null, 'both', null];
  var NTATTOO = ['band', null, 'claw', null, 'vine'];
  function nelfEar(c, g, o) {
    var X = g.X, Y = g.Y, r = g.r, sk = o.skin;
    /* anchored behind the cheek, a long blade swept up and back */
    var d = D`M${X - r * 0.2},${Y - r * 0.24} C${X - r * 0.72},${Y - r * 0.58} ${X - r * 1.52},${Y - r * 1.04} ${X - r * 2.32},${Y - r * 1.56} C${X - r * 1.96},${Y - r * 0.9} ${X - r * 1.28},${Y - r * 0.04} ${X - r * 0.64},${Y + r * 0.4} Q${X - r * 0.46},${Y + r * 0.66} ${X - r * 0.28},${Y + r * 0.46} Z`;
    return P(d, c.cel(sk), 2) +
      F(D`M${X - r * 0.42},${Y + r * 0.02} C${X - r * 0.9},${Y - r * 0.36} ${X - r * 1.5},${Y - r * 0.84} ${X - r * 2.02},${Y - r * 1.3} C${X - r * 1.62},${Y - r * 0.72} ${X - r * 1.1},${Y - r * 0.08} ${X - r * 0.6},${Y + r * 0.26} Z`, dk(sk, 0.32), 0.7) +
      S(D`M${X - r * 0.56},${Y - r * 0.44} C${X - r * 1.1},${Y - r * 0.8} ${X - r * 1.6},${Y - r * 1.12} ${X - r * 2.1},${Y - r * 1.44}`, lt(sk, 0.45), r * 0.1, 0.8);
  }
  function nelfTattoo(c, g, o, ex, ey) {
    /* wood elves: freckles ('band'), two short green cheek lines ('claw'), a thin painted vine at the temple ('vine') */
    var X = g.X, r = g.r, t = o.tatC || '#6a4a30', k = o.nface, gp = '#4a6a32';
    if (k === 'band') return C(ex - 1.5, ey + 3.6, 0.55, t, 0, 0.7) + C(ex + 0.8, ey + 3.2, 0.5, t, 0, 0.7) + C(ex + 2.8, ey + 3.9, 0.5, t, 0, 0.7) + C(ex - 0.2, ey + 5, 0.5, t, 0, 0.6) + C(ex + 2, ey + 5.4, 0.45, t, 0, 0.6);
    if (k === 'claw') return S(D`M${ex - 2.4},${ey + 3.4} L${ex + 1.6},${ey + 4.6} M${ex - 2.2},${ey + 5.4} L${ex + 1.2},${ey + 6.4}`, gp, 1.2, 0.75);
    if (k === 'vine') return S(D`M${X - r * 0.3},${ey - r * 0.3} Q${ex - 1.5},${ey - r * 0.5} ${ex + 3.2},${ey - r * 0.36}`, gp, 1.1, 0.7) +
      G(F('M0,0 C1.6,-1.3 1.6,-4 0,-5.6 C-1.6,-4 -1.6,-1.3 0,0 Z', gp, 0.7), 'translate(' + r1(ex - 2.6) + ',' + r1(ey - r * 0.44) + ') rotate(-60)');
    return '';
  }
  function nelfEye(c, g, o, ex, ey, bc) {
    var out = o.gender === 'f' ? nelfTattoo(c, g, o, ex, ey) : '';
    /* almond eye, white with a coloured iris and dark pupil; upswept brow */
    out += P(D`M${ex - 2.4},${ey + 0.3} Q${ex + 0.1},${ey - 2.1} ${ex + 2.8},${ey - 0.8} Q${ex + 0.6},${ey + 1.6} ${ex - 2.4},${ey + 0.3} Z`, '#fbf6ee', 1.1) +
      C(ex + 0.7, ey - 0.3, 1.25, o.eyeC || '#4a7a3a', 0) + C(ex + 0.85, ey - 0.3, 0.6, '#141008', 0);
    if (o.gender === 'f') out += S(D`M${ex + 2.7},${ey - 0.9} l1.5,-1.1`, OL, 1);
    out += S(D`M${ex + 3.1},${ey - 3.1} Q${ex - 0.4},${ey - 4.3} ${ex - 4.4},${ey - 6.4}`, bc, 1.8);
    return out;
  }
  function nelfFace(c, g, o) {
    var X = g.X, Y = g.Y, r = g.r, sk = o.skin, hc = o.hair ? o.hair.c : sk, k = o.nface, out = '';
    if (o.gender === 'f') return S(D`M${X + r * 0.22},${Y + r * 0.4} L${X + r * 0.6},${Y + r * 0.5}`, dk(sk, 0.28), 0.9, 0.6);
    /* sharp, pointed chin and cheekbone */
    out += F(D`M${X + r * 0.2},${Y + r * 0.86} L${X + r * 0.62},${Y + r * 1.24} L${X + r * 0.96},${Y + r * 0.72} L${X + r * 0.6},${Y + r * 0.8} Z`, dk(sk, 0.18)) +
      S(D`M${X + r * 0.26},${Y + r * 0.98} L${X + r * 0.62},${Y + r * 1.24} L${X + r * 0.95},${Y + r * 0.76}`, OL, 2) +
      S(D`M${X - r * 0.45},${Y + r * 0.55} Q${X},${Y + r * 0.95} ${X + r * 0.5},${Y + r * 1.1}`, dk(sk, 0.38), 1.1, 0.7) +
      S(D`M${X + r * 0.18},${Y + r * 0.36} L${X + r * 0.64},${Y + r * 0.5}`, dk(sk, 0.32), 1, 0.7);
    if (k === 'side' || k === 'both') out += P(D`M${X - r * 0.4},${Y - r * 0.42} L${X - r * 0.12},${Y - r * 0.46} L${X + r * 0.16},${Y + r * 0.8} L${X - r * 0.1},${Y + r * 0.86} Z`, c.cel(hc), 1.3);
    if (k === 'goatee' || k === 'both') out += P(D`M${X + r * 0.44},${Y + r * 1.0} L${X + r * 0.62},${Y + r * 1.62} L${X + r * 0.86},${Y + r * 0.94} Z`, c.cel(hc), 1.3) +
      S(D`M${X + r * 0.5},${Y + r * 0.64} Q${X + r * 0.78},${Y + r * 0.54} ${X + r * 0.98},${Y + r * 0.7}`, hc, 1.3);
    return out;
  }
  function nelfHair(c, g, o, layer, capped) {
    var X = g.X, Y = g.Y, r = g.r, h = o.hair, hc = h.c, st = h.style, f = o.gender === 'f', out = '';
    function q(u, v) { return D`${X + r * u},${Y + r * v}`; }
    if (layer === 'top') return nelfEar(c, g, o);
    if (layer === 'back') {
      if (o.hood) return '';
      var d, st2 = '';
      if (st === 'ntail') {
        d = 'M' + q(-0.35, -1.05) + ' C' + q(-1.4, -1.5) + ' ' + q(-2.3, -0.6) + ' ' + q(-2.1, 0.9) + ' C' + q(-2.0, 1.7) + ' ' + q(-2.25, 2.4) + ' ' + q(-1.95, 2.95) +
          ' C' + q(-1.8, 2.1) + ' ' + q(-1.35, 1.4) + ' ' + q(-1.35, 0.5) + ' C' + q(-1.3, -0.25) + ' ' + q(-1.0, -0.6) + ' ' + q(-0.65, -0.6) + ' Z';
        st2 = 'M' + q(-1.0, -1.1) + ' C' + q(-1.8, -0.9) + ' ' + q(-1.9, 0.4) + ' ' + q(-1.85, 1.6);
        out += P(d, c.cel(hc)) + S(st2, lt(hc, 0.4), r * 0.1, 0.7) + E(X - r * 0.72, Y - r * 0.98, r * 0.2, r * 0.3, c.cel('#d8e4f0'), 1.4, null, -30);
        return out;
      }
      if (st === 'nmane') {
        d = 'M' + q(0.4, -0.95) + ' C' + q(-0.8, -1.5) + ' ' + q(-1.6, -0.8) + ' ' + q(-1.55, 0.2) + ' L' + q(-1.95, 0.75) + ' L' + q(-1.45, 0.88) + ' L' + q(-1.8, 1.6) + ' L' + q(-1.22, 1.5) +
          ' L' + q(-1.4, 2.3) + ' L' + q(-0.85, 1.8) + ' L' + q(-0.72, 2.4) + ' L' + q(-0.45, 1.5) + ' C' + q(-0.3, 1.0) + ' ' + q(-0.2, 0.5) + ' ' + q(-0.2, 0) + ' Z';
        return P(d, c.cel(hc)) + S('M' + q(-1.1, -0.6) + ' C' + q(-1.4, 0.2) + ' ' + q(-1.3, 0.9) + ' ' + q(-1.1, 1.5), dk(hc, 0.3), r * 0.08, 0.7);
      }
      var len = st === 'nbraid' ? 2.4 : f ? 3.4 : 2.7;
      d = 'M' + q(0.4, -0.9) + ' C' + q(-0.6, -1.35) + ' ' + q(-1.35, -0.6) + ' ' + q(-1.3, 0.6) + ' C' + q(-1.28, 1.5) + ' ' + q(-1.42, len - 0.5) + ' ' + q(-1.25, len) +
        ' L' + q(-1.0, len - 0.35) + ' L' + q(-0.78, len - 0.02) + ' L' + q(-0.6, len - 0.45) + ' L' + q(-0.38, len - 0.22) + ' C' + q(-0.3, 1.4) + ' ' + q(-0.2, 0.8) + ' ' + q(-0.2, 0.1) + ' Z';
      return P(d, c.cel(hc)) + S('M' + q(-0.9, -0.2) + ' C' + q(-1.05, 0.8) + ' ' + q(-1.02, 1.6) + ' ' + q(-1.1, len - 0.5) + ' M' + q(-0.6, 0.4) + ' C' + q(-0.62, 1.2) + ' ' + q(-0.6, 1.8) + ' ' + q(-0.55, len - 0.6), lt(hc, 0.35), r * 0.08, 0.65);
    }
    if (layer === 'front') {
      out += S('M' + q(0.55, -0.72) + ' C' + q(0.1, -1.05) + ' ' + q(-0.4, -1.0) + ' ' + q(-0.8, -0.6), lt(hc, 0.45), r * 0.09, 0.7);
      return out;
    }
    return '';
  }


  /* ================= v18 races: orc, troll =================
     Both draw their own head (HEAD.orc / HEAD.ptroll) but share headWear() with the human head,
     so hoods, masks and cowls work the same. o.hump raises the upper back (hunch), o.padK enlarges
     the class shoulder pieces, and trolls get the two-toed boot (foot kind 'ttoe'). */
  var OSKIN = ['#809b40', '#4f7c34', '#7d7446', '#7a9080'];
  var OHAIRC = ['#1e1b18', '#4a2e1c', '#8e8c88', '#a8341e', '#e8e4dc'];
  var OHAIRM = ['omohawk', 'otop', 'obraids', 'omohawk', 'oponytail'];
  var OHAIRF = ['oponytail', 'obraids', 'otop', 'obraids', 'oponytail'];
  var OBEARD = [null, 'goatee', 'braid', null, 'full'];
  /* trolls (the Kessari and the other tribes): tall and lean, grey-green or sand skin, small tusks, braided hair,
     shell and bone jewellery, wrapped boots. Hair style keys are kept for old saves; each is now a braided cut. */
  var TSKIN = ['#7f9a86', '#b8a27a', '#94a890', '#8e7a58'];
  var THAIRC = ['#2a2420', '#5a3a26', '#8a3a22', '#dcd6cc', '#4a4034'];
  var THAIRM = ['tmohawk', 'tmane', 'tspikes', 'tcrest', 'tmohawk'];
  var THAIRF = ['ttail', 'tmane', 'ttail', 'tcrest', 'tmane'];
  RACEB.orc = {
    s: 1, swk: 1, armK: 1.04, footK: 1.2, handK: 1.16, shadow: 35, pZ: 1.16, pY: 34, pX: 31, padK: 1.22, lean: 3,
    m: { shW: 21.5, waistW: 13.5, belly: 3, armW: 11.4, legW: 11.8, hipY: 83, shY: 53, headX: 74, headY: 38.5, headR: 12.6, stance: 8.5, neck: 11, lean: 3 },
    f: { shW: 17.2, waistW: 10.6, belly: 0.5, armW: 9.3, legW: 10.2, hipY: 82, shY: 51.5, headX: 71, headY: 35.5, headR: 11.8, stance: 7.5, neck: 8.4, lean: 2 }
  };
  RACEB.troll = {
    s: 1, swk: 1, armK: 1.26, footK: 1.1, handK: 1.06, shadow: 31, pZ: 1.02, pY: 38, pX: 30, padK: 1, lean: 3, topK: 0.9,
    m: { shW: 15.2, waistW: 8.4, armW: 7.7, legW: 8.4, hipY: 72, shY: 44.5, headX: 75, headY: 27.5, headR: 11, stance: 8.5, neck: 7, lean: 3 },
    f: { shW: 13.4, waistW: 7.6, armW: 7, legW: 7.9, hipY: 73, shY: 45.5, headX: 74, headY: 29, headR: 10.6, stance: 8, neck: 6.2, lean: 3 }
  };
  RACES.push('orc', 'troll');
  function raceSetup2(o, race, si, hi, f) {
    if (race === 'orc') {
      o.skin = OSKIN[si]; o.hair = { c: OHAIRC[hi], style: (f ? OHAIRF : OHAIRM)[hi] };
      o.obeard = f ? null : OBEARD[hi]; o.earring = hi % 2 === 0; o.head = 'orc';
      o.late = function (c, g, o) { return (o.obeard && !o.mask ? orcBeard(c, g, o) : '') + orcTusks(c, g, o); };
    } else {
      o.skin = TSKIN[si]; o.hair = { c: THAIRC[hi], style: (f ? THAIRF : THAIRM)[hi] };
      o.earring = hi !== 2; o.head = 'ptroll'; o.feet = 'ttoe';
      o.late = function (c, g, o) { return trollTusks(c, g, o) + trollBeads(c, g, o); };
      o.hairBack = function (c, g, o) { return o.hood ? '' : trollHair(c, g, o, 'back'); };
    }
    o.hump = raceHump; o.headLate = true;
  }
  /* raised trapezius / upper back behind the neck: the hunch */
  function raceHump(c, g, o) {
    var b = g.b, x = g.scx, y = g.sy, col = o.torsoC || o.sleeve || '#777777', t = o.race === 'troll';
    var d = t ? D`M${x - b.shW + 2},${y + 8} C${x - b.shW},${y - 1} ${x - 6},${y - 6} ${x + 4},${y - 4} L${x + 6},${y + 4} Z`
      : D`M${x - b.shW + 2},${y + 8} C${x - b.shW - 1},${y - 4} ${x - 6},${y - 9} ${x + 4},${y - 5} L${x + 6},${y + 4} Z`;
    return P(d, c.cel(col));
  }
  function hoop(x, y, rr) {
    return '<circle cx="' + r1(x) + '" cy="' + r1(y) + '" r="' + r1(rr) + '" fill="none" stroke="' + OL + '" stroke-width="2.6"/><circle cx="' + r1(x) + '" cy="' + r1(y) + '" r="' + r1(rr) + '" fill="none" stroke="' + GOLD + '" stroke-width="1.3"/>';
  }
  function qpoly(g, pts) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + r1(g.X + g.r * p[0]) + ',' + r1(g.Y + g.r * p[1]); }).join('') + 'Z'; }
  /* ---- orc head: heavy brow, small dark eyes, broad flat nose, big underbite jaw with lower tusks ---- */
  function orcSkullD(g, f) {
    var X = g.X, Y = g.Y, r = g.r, j = f ? 0.72 : 1;
    function q(u, v) { return D`${X + r * u},${Y + r * v}`; }
    return 'M' + q(-0.98, 0.1) + ' C' + q(-1.02, -1.28) + ' ' + q(0.82, -1.34) + ' ' + q(0.96, -0.34) +
      ' L' + q(1.08 + 0.04 * j, -0.2) + ' C' + q(1.02, -0.06) + ' ' + q(0.99, 0.02) + ' ' + q(1.02, 0.1) +
      ' C' + q(1.22, 0.18) + ' ' + q(1.28, 0.36) + ' ' + q(1.14, 0.46) + ' L' + q(1.03, 0.5) +
      ' C' + q(1.02 + 0.14 * j, 0.62) + ' ' + q(1.0 + 0.16 * j, 0.9 + 0.08 * j) + ' ' + q(0.94 + 0.12 * j, 1.0 + 0.12 * j) +
      ' C' + q(0.7, 1.1 + 0.2 * j) + ' ' + q(0.1, 1.18 + 0.12 * j) + ' ' + q(-0.3, 1.06) +
      ' C' + q(-0.78, 0.9) + ' ' + q(-0.98, 0.55) + ' ' + q(-0.98, 0.1) + ' Z';
  }
  function orcHair(c, g, o, layer) {
    var X = g.X, Y = g.Y, r = g.r, h = o.hair, hc = h.c, st = h.style, out = '', tie = '#8a5a2a';
    function q(u, v) { return D`${X + r * u},${Y + r * v}`; }
    var hi = lt(hc, 0.4);
    if (layer === 'back') {
      if (st === 'oponytail') out += P('M' + q(-0.62, -0.78) + ' C' + q(-1.7, -0.9) + ' ' + q(-2.05, 0.5) + ' ' + q(-1.72, 1.95) + ' C' + q(-1.62, 2.2) + ' ' + q(-1.5, 2.3) + ' ' + q(-1.38, 2.35) +
        ' C' + q(-1.46, 1.3) + ' ' + q(-1.2, 0.35) + ' ' + q(-0.66, -0.02) + ' Z', c.cel(hc)) + S('M' + q(-1.1, -0.6) + ' C' + q(-1.6, 0.0) + ' ' + q(-1.6, 1.0) + ' ' + q(-1.55, 1.8), hi, r * 0.08, 0.6);
      else if (st === 'obraids') out += braidG(c, hpl(g, [[-0.78, -0.1], [-1.2, 0.95], [-1.14, 2.1]]), r * 0.3, hc, '#e8dcc0') + braidG(c, hpl(g, [[-0.5, 0.1], [-0.72, 1.2], [-0.6, 2.25]]), r * 0.28, dk(hc, 0.08), '#e8dcc0');
      return out;
    }
    /* front: over the skull */
    var bald = st === 'omohawk' || st === 'otop';
    if (bald) out += CG(F('M' + q(-1.1, 0.25) + ' C' + q(-1.12, -1.5) + ' ' + q(1.0, -1.5) + ' ' + q(0.98, -0.5) + ' L' + q(0.3, -0.52) + ' C' + q(-0.2, -0.46) + ' ' + q(-0.6, -0.12) + ' ' + q(-0.72, 0.3) + ' Z', hc, 0.22), c.clip(orcSkullD(g, o.gender === 'f')));
    if (st === 'omohawk') {
      out += P(qpoly(g, [[0.6, -0.8], [0.78, -1.3], [0.44, -1.2], [0.42, -1.66], [0.1, -1.44], [-0.06, -1.84], [-0.3, -1.5], [-0.62, -1.74], [-0.7, -1.3], [-1.08, -1.36], [-1.0, -0.96], [-1.34, -0.82], [-1.02, -0.52],
        [-0.84, -0.86], [-0.4, -1.04], [0.1, -1.06]]), c.cel(hc), 2.1) +
        S('M' + q(0.35, -1.2) + ' L' + q(-0.05, -1.5) + ' M' + q(-0.4, -1.3) + ' L' + q(-0.75, -1.25), hi, r * 0.07, 0.7);
    } else if (st === 'otop') {
      out += P('M' + q(-0.2, -0.98) + ' C' + q(-0.3, -1.75) + ' ' + q(0.3, -2.15) + ' ' + q(0.62, -1.8) + ' C' + q(0.36, -1.78) + ' ' + q(0.16, -1.66) + ' ' + q(0.06, -1.5) +
        ' C' + q(-0.4, -1.95) + ' ' + q(-1.4, -1.75) + ' ' + q(-1.72, -0.8) + ' C' + q(-1.8, -0.4) + ' ' + q(-1.74, -0.05) + ' ' + q(-1.6, 0.2) +
        ' C' + q(-1.46, -0.5) + ' ' + q(-1.0, -0.95) + ' ' + q(-0.64, -0.98) + ' Z', c.cel(hc), 2.1) +
        S('M' + q(-0.2, -1.5) + ' C' + q(-0.8, -1.65) + ' ' + q(-1.3, -1.3) + ' ' + q(-1.5, -0.6), hi, r * 0.08, 0.65) + S('M' + q(-0.5, -1.2) + ' C' + q(-0.95, -1.2) + ' ' + q(-1.25, -0.8) + ' ' + q(-1.4, -0.3), dk(hc, 0.3), r * 0.06, 0.7) +
        E(X - r * 0.42, Y - r * 1.02, r * 0.3, r * 0.16, c.cel(tie), 1.6, null, -10);
    } else {
      /* full hair pulled back: cap over the crown */
      out += P('M' + q(0.74, -0.7) + ' C' + q(0.56, -1.32) + ' ' + q(-1.1, -1.38) + ' ' + q(-1.06, 0.12) + ' L' + q(-0.76, 0.24) + ' C' + q(-0.74, -0.34) + ' ' + q(-0.32, -0.68) + ' ' + q(0.2, -0.72) + ' L' + q(0.46, -0.62) + ' Z', c.cel(hc), 2) +
        S('M' + q(0.4, -0.9) + ' C' + q(0.0, -1.1) + ' ' + q(-0.5, -1.05) + ' ' + q(-0.8, -0.7), hi, r * 0.08, 0.65);
      if (st === 'oponytail') out += E(X - r * 0.78, Y - r * 0.56, r * 0.2, r * 0.26, c.cel(tie), 1.5, null, 30);
    }
    return out;
  }
  function orcBeard(c, g, o) {
    var X = g.X, Y = g.Y, r = g.r, hc = o.hair.c, k = o.obeard;
    function q(u, v) { return D`${X + r * u},${Y + r * v}`; }
    if (k === 'goatee') return P('M' + q(0.46, 0.98) + ' C' + q(0.5, 1.38) + ' ' + q(0.68, 1.72) + ' ' + q(0.86, 1.98) + ' C' + q(0.96, 1.62) + ' ' + q(1.06, 1.32) + ' ' + q(1.04, 1.02) +
      ' C' + q(0.86, 1.14) + ' ' + q(0.64, 1.12) + ' ' + q(0.46, 0.98) + ' Z', c.cel(hc), 1.7) + P(quadOn(hp(g, 0.74, 1.4), hp(g, 0.86, 1.85), 0, r * 0.2, -r * 0.26, r * 0.26), c.cel('#e8dcc0'), 1.3);
    if (k === 'braid') return braidG(c, hpl(g, [[0.8, 1.02], [0.82, 1.6], [0.74, 2.1]]), r * 0.26, hc, GOLD);
    if (k === 'full') return P('M' + q(-0.36, 0.3) + ' C' + q(-0.32, 1.0) + ' ' + q(0.1, 1.5) + ' ' + q(0.5, 1.74) + ' L' + q(0.64, 1.58) + ' L' + q(0.8, 1.82) + ' L' + q(0.94, 1.46) + ' L' + q(1.12, 1.24) +
      ' L' + q(1.08, 1.0) + ' C' + q(0.9, 1.0) + ' ' + q(0.7, 0.96) + ' ' + q(0.52, 0.84) + ' C' + q(0.28, 0.78) + ' ' + q(0.04, 0.6) + ' ' + q(-0.12, 0.28) + ' Z', c.cel(hc), 1.8) +
      S('M' + q(0.1, 0.9) + ' C' + q(0.25, 1.2) + ' ' + q(0.4, 1.4) + ' ' + q(0.55, 1.55), dk(hc, 0.3), r * 0.07, 0.7);
    return '';
  }
  function orcTusks(c, g, o) {
    var X = g.X, Y = g.Y, r = g.r, f = o.gender === 'f', k = f ? 0.55 : 1;
    function q(u, v) { return D`${X + r * u},${Y + r * v}`; }
    var iv = c.lg(['#fffaf0', '#e6dcc2', '#b0a080'], 0, 0, 1, 1), ivd = c.lg(['#e2d8c0', '#b8aa88', '#86785c'], 0, 0, 1, 1);
    var bx = 0.98, by = f ? 0.9 : 0.96, wk = f ? 0.75 : 1;
    function tk(ox, s2) {
      return 'M' + q(bx + ox - 0.17 * wk, by + 0.06) + ' C' + q(bx + ox - 0.18 * wk, by - 0.26 * k * s2) + ' ' + q(bx + ox - 0.02, by - 0.5 * k * s2) + ' ' + q(bx + ox + 0.16, by - 0.7 * k * s2) +
        ' C' + q(bx + ox + 0.16, by - 0.44 * k * s2) + ' ' + q(bx + ox + 0.13 * wk, by - 0.16 * k * s2) + ' ' + q(bx + ox + 0.1 * wk, by + 0.08) + ' Z';
    }
    var far = tk(-0.36, 0.8), near = tk(0, 1);
    return P(far, ivd, 1.4) + P(near, iv, 1.6);
  }
  HEAD.orc = function (c, g, o) {
    var X = g.X, Y = g.Y, r = g.r, sk = o.skin, f = o.gender === 'f', h = o.hair, out = '';
    function q(u, v) { return D`${X + r * u},${Y + r * v}`; }
    var capped = o.hood || o.bandana || o.cap || o.hat;
    if (h && !o.hood) out += orcHair(c, g, o, 'back');
    var d = orcSkullD(g, f);
    out += P(d, c.cel(sk));
    out += CG(F('M' + q(-0.9, 0.2) + ' C' + q(-0.85, 0.8) + ' ' + q(-0.4, 1.1) + ' ' + q(0.1, 1.2) + ' C' + q(-0.3, 0.64) + ' ' + q(-0.42, 0.12) + ' ' + q(-0.9, 0.2) + ' Z', dk(sk, 0.32), 0.45) +
      E(X + r * 0.66, Y - r * 0.08, r * 0.3, r * 0.16, dk(sk, 0.5), 0, 0.45), c.clip(d));
    out += S('M' + q(0.24, 0.56) + ' Q' + q(0.52, 0.98) + ' ' + q(0.96, 1.02), dk(sk, 0.38), 1.1, 0.7);
    /* pointed ear, swept back */
    var ear = 'M' + q(-0.14, -0.12) + ' C' + q(-0.48, -0.3) + ' ' + q(-0.94, -0.56) + ' ' + q(-1.3, -0.8) + ' C' + q(-1.1, -0.24) + ' ' + q(-0.76, 0.3) + ' ' + q(-0.26, 0.4) + ' Z';
    out += P(ear, c.cel(sk), 2) + F('M' + q(-0.3, 0.0) + ' C' + q(-0.58, -0.16) + ' ' + q(-0.88, -0.4) + ' ' + q(-1.08, -0.58) + ' C' + q(-0.94, -0.2) + ' ' + q(-0.68, 0.14) + ' ' + q(-0.34, 0.24) + ' Z', dk(sk, 0.34), 0.7);
    if (o.earring && !o.hood) out += hoop(X - r * 0.52, Y + r * 0.38, r * 0.14);
    /* heavy brow ridge over small dark eyes */
    var ex = X + r * 0.64, ey = Y - r * 0.01;
    out += E(ex, ey, 1.7, 1.2, '#efd9a8', 0) + C(ex + 0.5, ey + 0.1, 0.95, '#140a06', 0);
    out += F('M' + q(0.12, -0.34) + ' C' + q(0.42, -0.62) + ' ' + q(0.9, -0.58) + ' ' + q(1.14, -0.22) + ' C' + q(0.9, -0.14) + ' ' + q(0.52, -0.2) + ' ' + q(0.14, -0.2) + ' Z', lt(sk, 0.14), 0.9) +
      S('M' + q(0.2, -0.2) + ' C' + q(0.5, -0.22) + ' ' + q(0.86, -0.16) + ' ' + q(1.1, -0.2), OL, f ? 1.5 : 2.2) +
      S('M' + q(0.3, -0.5) + ' Q' + q(0.62, -0.62) + ' ' + q(0.95, -0.46), dk(sk, 0.35), 1, 0.7);
    out += S('M' + q(0.98, 0.36) + ' Q' + q(1.06, 0.44) + ' ' + q(1.16, 0.4), OL, 1.1) + F('M' + q(0.98, -0.02) + ' C' + q(1.2, 0.14) + ' ' + q(1.24, 0.34) + ' ' + q(1.12, 0.42) + ' L' + q(1.02, 0.4) + ' Z', lt(sk, 0.2), 0.5);
    if (!o.mask) out += S('M' + q(0.5, 0.76) + ' Q' + q(0.76, 0.8) + ' ' + q(1.02, 0.7), OL, 1.3);
    if (h && !capped) out += orcHair(c, g, o, 'front');
    out += headWear(c, g, o, ex, ey);
    return out;
  };
  /* ---- troll head: swept ears, sloped brow, long straight nose, small lower tusks, braided hair ---- */
  function trollHair(c, g, o, layer) {
    var X = g.X, Y = g.Y, r = g.r, h = o.hair, hc = h.c, st = h.style, out = '';
    function q(u, v) { return D`${X + r * u},${Y + r * v}`; }
    var hi = lt(hc, 0.4), band = '#e8dcc0', wrap = '#8a5a2a';
    if (layer === 'back') {
      /* braids hanging down the back, drawn behind the body */
      if (st === 'ttail') out += braidG(c, hpl(g, [[-0.8, -0.3], [-1.35, 0.9], [-1.3, 2.6]]), r * 0.36, hc, band);
      else if (st === 'tmane') [[-0.55, 0], [-0.8, -0.2], [-1.0, -0.4], [-0.35, 0.15]].forEach(function (b, i) {
        out += braidG(c, hpl(g, [[b[0], b[1]], [b[0] - 0.35, b[1] + 1.1], [b[0] - 0.3 + i * 0.05, 2.1 + i * 0.12]]), r * 0.2, i % 2 ? dk(hc, 0.1) : hc, i === 1 ? '#c8a060' : band);
      });
      else if (st === 'tspikes') out += braidG(c, hpl(g, [[-0.5, -1.05], [-1.3, -0.4], [-1.5, 0.9], [-1.35, 2.2]]), r * 0.3, hc, '#c8a060');
      else if (st === 'tcrest') out += braidG(c, hpl(g, [[-0.9, -0.1], [-1.2, 1.0], [-1.1, 1.9]]), r * 0.26, hc, band) + braidG(c, hpl(g, [[-0.6, 0.1], [-0.8, 1.1], [-0.7, 2.0]]), r * 0.24, dk(hc, 0.1), band);
      else out += braidG(c, hpl(g, [[-0.4, -1.2], [-1.1, -1.0], [-1.45, 0.3], [-1.35, 1.6]]), r * 0.28, hc, band);
      return out;
    }
    /* front: hair drawn back tight over the crown */
    var cap = 'M' + q(0.78, -0.58) + ' C' + q(0.5, -1.34) + ' ' + q(-1.02, -1.38) + ' ' + q(-0.96, 0.14) + ' L' + q(-0.7, 0.3) + ' C' + q(-0.7, -0.3) + ' ' + q(-0.32, -0.72) + ' ' + q(0.3, -0.76) + ' Z';
    if (st === 'tspikes') {
      /* shaved sides: a narrow plaited ridge over the crown */
      out += CG(F(cap, hc, 0.22), c.clip(trollSkullD(g, o.gender === 'f'))) +
        braidG(c, hpl(g, [[0.55, -0.82], [0.0, -1.14], [-0.5, -1.05]]), r * 0.28, hc, null);
      return out;
    }
    out += P(cap, c.cel(hc), 2) + S('M' + q(0.42, -0.9) + ' C' + q(0.0, -1.12) + ' ' + q(-0.5, -1.06) + ' ' + q(-0.8, -0.7), hi, r * 0.08, 0.65) +
      S('M' + q(0.2, -0.86) + ' C' + q(-0.2, -0.95) + ' ' + q(-0.55, -0.7) + ' ' + q(-0.72, -0.2), dk(hc, 0.3), r * 0.06, 0.7);
    if (st === 'tmohawk') {
      /* high topknot bound with a bone ring */
      out += P(blob(X - r * 0.3, Y - r * 1.38, r * 0.34, r * 0.3, 7, rnd(41), 0.2), c.cel(hc), 2) + E(X - r * 0.2, Y - r * 1.06, r * 0.28, r * 0.14, c.cel(band), 1.5, null, -10);
    } else if (st === 'tcrest') {
      /* hair wrapped in a cloth band */
      out += P('M' + q(0.66, -0.66) + ' C' + q(0.4, -0.98) + ' ' + q(-0.5, -1.02) + ' ' + q(-0.9, -0.5) + ' L' + q(-0.84, -0.3) + ' C' + q(-0.4, -0.76) + ' ' + q(0.3, -0.76) + ' ' + q(0.62, -0.46) + ' Z', c.cel(wrap), 1.6) +
        C(X - r * 0.9, Y - r * 0.42, r * 0.14, c.cel(band), 1.2);
    } else if (st === 'ttail' || st === 'tmane') {
      out += E(X - r * 0.8, Y - r * 0.3, r * 0.2, r * 0.26, c.cel(wrap), 1.5, null, 30);
    }
    return out;
  }
  /* shell and bone jewellery: a cord of cowrie shells and one bone bead at the throat */
  function trollBeads(c, g, o) {
    if (o.hood && o.mask) return '';
    var x = g.scx + 3, y = g.sy, d = D`M${x - 8},${y + 1} Q${x + 1},${y + 9} ${x + 9},${y + 0.5}`, out = S(d, OL, 2.4) + S(d, '#8a6038', 1.1);
    [[-5, 4.2], [-1.6, 6], [2.2, 6], [5.6, 3.8]].forEach(function (p) { out += E(x + p[0], y + p[1], 1.4, 1.9, c.cel('#f2ead6'), 1) + S(D`M${x + p[0]},${y + p[1] - 1.2} L${x + p[0]},${y + p[1] + 1.2}`, '#8a7a5a', 0.6); });
    return out + P(D`M${x - 0.4},${y + 6.4} L${x + 1.6},${y + 6.4} L${x + 1.2},${y + 11} L${x},${y + 11} Z`, c.cel('#e6dcc0'), 1);
  }
  function trollSkullD(g, f) {
    var X = g.X, Y = g.Y, r = g.r, n = f ? 0.5 : 0.62;
    function q(u, v) { return D`${X + r * u},${Y + r * v}`; }
    return 'M' + q(-0.9, 0.1) + ' C' + q(-0.95, -1.0) + ' ' + q(0.3, -1.15) + ' ' + q(0.8, -0.55) + ' L' + q(0.98, -0.3) +
      ' C' + q(1.0 + 0.3 * n, -0.18) + ' ' + q(1.0 + 0.72 * n, 0.2) + ' ' + q(1.0 + 0.84 * n, 0.52) +
      ' C' + q(1.0 + 0.86 * n, 0.72) + ' ' + q(1.0 + 0.58 * n, 0.76) + ' ' + q(1.0 + 0.34 * n, 0.66) +
      ' C' + q(1.38, 0.86) + ' ' + q(1.34, 1.1) + ' ' + q(1.04, 1.2) + ' C' + q(0.5, 1.36) + ' ' + q(-0.35, 1.14) + ' ' + q(-0.72, 0.74) +
      ' C' + q(-0.88, 0.52) + ' ' + q(-0.92, 0.3) + ' ' + q(-0.9, 0.1) + ' Z';
  }
  function trollTusks(c, g, o) {
    var X = g.X, Y = g.Y, r = g.r, k = o.gender === 'f' ? 0.3 : 0.4;
    /* small tusks poking up out of the lower jaw */
    var bx = X + r * 0.92, by = Y + r * 1.0;
    function tusk(dx, dy, fill, w) {
      var ox = bx + dx * r, oy = by + dy * r;
      function t(u, v) { return D`${ox + r * u * k},${oy + r * v * k}`; }
      return P('M' + t(-0.18, 0.08) + ' C' + t(0.5, 0.3) + ' ' + t(1.08, 0.12) + ' ' + t(0.96, -0.92) + ' C' + t(0.78, -0.42) + ' ' + t(0.5, -0.14) + ' ' + t(0.12, -0.2) + ' Z', fill, w) +
        S('M' + t(0.1, 0.04) + ' C' + t(0.55, 0.14) + ' ' + t(0.9, 0.0) + ' ' + t(0.92, -0.6), '#ffffff', r * 0.07, 0.7);
    }
    return tusk(-0.3, -0.06, c.lg(['#e2d8c0', '#b8aa88', '#86785c'], 0, 0, 1, 1), 1.6) + tusk(0, 0, c.lg(['#fffaf0', '#e8dec6', '#b0a080'], 0, 0, 1, 1), 1.8);
  }
  HEAD.ptroll = function (c, g, o) {
    var X = g.X, Y = g.Y, r = g.r, sk = o.skin, f = o.gender === 'f', h = o.hair, out = '';
    function q(u, v) { return D`${X + r * u},${Y + r * v}`; }
    var capped = o.hood || o.bandana || o.cap || o.hat;
    var d = trollSkullD(g, f);
    out += P(d, c.cel(sk));
    out += CG(F('M' + q(-1, 0.3) + ' C' + q(-0.6, 1.1) + ' ' + q(0.2, 1.4) + ' ' + q(0.9, 1.3) + ' L' + q(0.9, 1.6) + ' L' + q(-1, 1.6) + ' Z', dk(sk, 0.3), 0.5) +
      F('M' + q(-0.9, 0.0) + ' C' + q(-0.9, 0.6) + ' ' + q(-0.6, 0.9) + ' ' + q(-0.3, 1.0) + ' C' + q(-0.5, 0.5) + ' ' + q(-0.5, 0.1) + ' ' + q(-0.9, 0.0) + ' Z', dk(sk, 0.3), 0.4), c.clip(d));
    if (h && !capped) {
      var hair = trollHair(c, g, o, 'front');
      out += o.top ? scaleAt(hair, 0.72, X - r * 0.2, Y - r * 0.9) : hair;
    }
    /* pointed ear swept back (shorter than the old troll ear) */
    var ear = 'M' + q(-0.2, -0.14) + ' C' + q(-0.66, -0.36) + ' ' + q(-1.2, -0.56) + ' ' + q(-1.72, -0.6) + ' C' + q(-1.3, -0.1) + ' ' + q(-0.84, 0.34) + ' ' + q(-0.3, 0.42) + ' Z';
    out += P(ear, c.cel(sk), 2) + F('M' + q(-0.36, 0.0) + ' C' + q(-0.74, -0.2) + ' ' + q(-1.1, -0.38) + ' ' + q(-1.44, -0.46) + ' C' + q(-1.1, -0.1) + ' ' + q(-0.74, 0.2) + ' ' + q(-0.4, 0.26) + ' Z', dk(sk, 0.35), 0.6);
    /* shell earring on a short cord */
    if (o.earring && !o.hood) out += S(D`M${X - r * 0.52},${Y + r * 0.38} L${X - r * 0.54},${Y + r * 0.6}`, '#8a6038', 1.1) + E(X - r * 0.55, Y + r * 0.74, r * 0.12, r * 0.17, c.cel('#f2ead6'), 1.1);
    var ex = X + r * 0.6, ey = Y - r * 0.14;
    out += P(D`M${ex - 2.3},${ey + 0.4} Q${ex + 0.2},${ey - 1.9} ${ex + 2.7},${ey - 0.6} Q${ex + 0.5},${ey + 1.5} ${ex - 2.3},${ey + 0.4} Z`, '#f6ecc0', 1.1) + C(ex + 0.6, ey - 0.2, 1, '#1a0a04', 0);
    if (f) out += S(D`M${ex + 2.6},${ey - 0.7} l1.4,-1`, OL, 1);
    out += S('M' + q(0.16, -0.58) + ' L' + q(1.0, -0.3), OL, f ? 1.8 : 2.4);
    out += S('M' + q(1.22, 0.54) + ' q' + r1(r * 0.08) + ',' + r1(r * 0.05) + ' ' + r1(r * 0.18) + ',0', OL, 1.2);
    if (!o.mask) out += S('M' + q(0.45, 0.94) + ' Q' + q(0.8, 0.98) + ' ' + q(1.1, 0.84), OL, 1.4);
    out += headWear(c, g, o, ex, ey);
    return out;
  };

  /* ================= v18 class: shaman =================
     tribal spirit-caller: blue mail under a leather harness and hip tabs, grey wolf pelt over the front shoulder,
     bone-and-bead necklace, carved thunderbird totem on the back, lightning-charged mace + round wooden shield. */
  var SHBLUE = '#3a78c8', SHWOOD = '#8a5a32';
  WP.shammace = function (c) {
    return C(0, -28, 15, c.rg([[0, '#f0fbff', 0.8], [0.4, '#7ad0ff', 0.35], [1, '#7ad0ff', 0]]), 0) +
      P('M-2.2,11 L-2.4,-20 L2.4,-20 L2.2,11 Z', c.cel(WOOD), 2) + S('M-2.3,-1 L2.3,1 M-2.3,3 L2.3,5 M-2.3,7 L2.3,9', '#3a2412', 1.1) +
      P('M-7,-26 L-12,-23 L-12.5,-31 L-6,-32 Z M7,-26 L12,-23 L12.5,-31 L6,-32 Z', c.cel('#5e646c'), 1.8) +
      P('M-4.8,-20 L4.8,-20 L7.2,-26 L5,-34 L0,-38 L-5,-34 L-7.2,-26 Z', c.cel('#8a9098'), 2) +
      C(0, -27.5, 3, c.rg([[0, '#ffffff'], [0.5, '#9ae4ff'], [1, SHBLUE]], 0.4, 0.35, 0.7), 1.4) +
      S('M-9,-39 L-6,-35 L-9.5,-32.5 L-7,-29 M9,-41 L11.5,-36 L8.5,-34 L11,-30.5 M12.5,-20 L15,-17', '#1a3a6a', 2.6, 0.6) +
      S('M-9,-39 L-6,-35 L-9.5,-32.5 L-7,-29 M9,-41 L11.5,-36 L8.5,-34 L11,-30.5 M12.5,-20 L15,-17', '#e8fbff', 1.2) +
      C(0, 12.5, 2.6, c.cel('#8a9098'), 1.6);
  };
  function woodShield(c) {
    var cd = 'M-12.6,0 A12.6,12.6 0 1 0 12.6,0 A12.6,12.6 0 1 0 -12.6,0 Z';
    var sp = 'M0.4,0.2 C2.2,-1 3.4,1.2 2.2,3 C0.4,5.6 -3.8,4.4 -4.6,1 C-5.6,-3.6 -1.2,-7.2 3,-6.4 C7.6,-5.4 8.6,1.4 6.4,5';
    var teeth = '', i;
    for (i = 0; i < 10; i++) { var a = i / 10 * Math.PI * 2, x0 = Math.cos(a - 0.2) * 9.4, y0 = Math.sin(a - 0.2) * 9.4, x1 = Math.cos(a + 0.2) * 9.4, y1 = Math.sin(a + 0.2) * 9.4, x2 = Math.cos(a) * 7.2, y2 = Math.sin(a) * 7.2; teeth += D`M${x0},${y0} L${x2},${y2} L${x1},${y1} Z`; }
    return P(cd, c.lg(['#b8844e', SHWOOD, '#4e3018'], 0.2, 0, 0.8, 1), 2.4) +
      CG(S('M-5,-13 L-5,13 M0.5,-13 L0.5,13 M6,-13 L6,13', '#4a2e18', 1, 0.75), c.clip(cd)) +
      '<circle cx="0" cy="0" r="11.6" fill="none" stroke="' + OL + '" stroke-width="4.4"/><circle cx="0" cy="0" r="11.6" fill="none" stroke="#6e747c" stroke-width="2.4"/>' +
      F(teeth, SHBLUE, 0.95) + S(sp, OL, 3.6) + S(sp, '#bfeaff', 2) +
      C(-8.4, -8.4, 1, '#c9ced6', 0) + C(8.4, -8.4, 1, '#c9ced6', 0) + C(8.4, 8.4, 1, '#c9ced6', 0) + C(-8.4, 8.4, 1, '#c9ced6', 0);
  }
  function shamanTotem(c, g) {
    var x = g.scx - 13, y = g.sy - 3, b = '';
    b += P('M-2.8,-4 L2.8,-4 L3.2,34 L-3.2,34 Z', c.cel('#6e4a2a'), 2);
    b += P('M-5.8,-19 L-15,-26 L-13.5,-15.5 L-5.8,-15 Z', c.cel(SHBLUE), 1.8) + P('M5.8,-19 L15,-26 L13.5,-15.5 L5.8,-15 Z', c.cel(SHBLUE), 1.8) +
      S('M-7,-17.5 L-12.5,-22 M7,-17.5 L12.5,-22', '#bfeaff', 1, 0.7);
    b += P('M-6.5,-16 L6.5,-16 L6,-3 L-6,-3 Z', c.cel('#9a6a3a'), 2) +
      R(-4.6, -13, 3.2, 2.6, OL, 0) + R(1.4, -13, 3.2, 2.6, OL, 0) + R(-3.6, -8.2, 7.2, 2.8, OL, 0) + S('M-2,-8.2 L-2,-5.4 M0,-8.2 L0,-5.4 M2,-8.2 L2,-5.4', '#e8dcc0', 0.8) +
      S('M-6,-4.6 L6,-4.6', SHBLUE, 1.6);
    b += P('M-5.6,-16 L-5.6,-24 L0,-29.5 L5.6,-24 L5.6,-16 Z', c.cel(SHWOOD), 2) + P('M5,-23.5 L11.5,-20.5 L5,-18 Z', c.cel(GOLD), 1.4) +
      C(1.8, -22.5, 4.2, c.rg([[0, '#f0fbff', 0.9], [0.5, '#7ad0ff', 0.4], [1, '#7ad0ff', 0]]), 0) + C(1.8, -22.5, 1.4, '#f0fbff', 0);
    b += S('M-3,-2 L-6,6 M3,-2 L5,7', '#6a4428', 1.2) + P('M-6,6 C-4,8 -4,12 -6,14 C-8,12 -8,8 -6,6 Z', c.cel('#f0ece2'), 1.2) + P('M5,7 C7,9 7,13 5,15 C3,13 3,9 5,7 Z', c.cel(SHBLUE), 1.2);
    return G(b, 'translate(' + r1(x) + ',' + r1(y) + ') rotate(-12)');
  }
  function shamanTorso(c, g) {
    var b = g.b, hy = g.hy, n = 5, w = (g.wr - g.wl + 5) / n, tabs = '', i;
    for (i = 0; i < n; i++) {
      var x0 = g.wl - 2.5 + i * w, dy = i % 2 ? 2 : 0;
      tabs += P(D`M${x0},${hy - 3} L${x0 + w},${hy - 3} L${x0 + w - 0.6},${hy + 10 + dy} L${x0 + w / 2},${hy + 12.5 + dy} L${x0 + 0.6},${hy + 10 + dy} Z`, c.cel(i % 2 ? '#6a4a2e' : '#80593a'), 1.6);
    }
    tabs += P(D`M${g.sx + 1},${hy - 3} L${g.sx + 8},${hy - 3} L${g.sx + 8.5},${hy + 17} L${g.sx + 4.5},${hy + 14.5} L${g.sx + 0.5},${hy + 17} Z`, c.cel('#2f5f9a'), 1.6) +
      S(D`M${g.sx + 1.5},${hy + 9} L${g.sx + 7.5},${hy + 9}`, '#bfeaff', 1.1, 0.8);
    var strap = D`M${g.scx - b.shW + 1},${g.sy - 1} L${g.scx - b.shW + 7},${g.sy - 3} L${g.sx + b.waistW + 3},${hy - 5} L${g.sx + b.waistW - 3},${hy + 1} Z`;
    return mailFx(c, g, '#22426a') + tabs + CG(P(strap, c.cel('#6a4428'), 1.8) + S(D`M${g.scx - b.shW + 4},${g.sy} L${g.sx + b.waistW},${hy - 2}`, '#c9a878', 0.8, 0.7), c.clip(g.torsoD)) +
      C(g.scx + 2, g.sy + 16, 2.4, c.cel('#e8dcc0'), 1.3);
  }
  function shamanBeads(c, g) {
    var x = g.scx + 3, y = g.sy, d = D`M${x - 10},${y + 1.5} Q${x + 1},${y + 13} ${x + 11},${y + 1}`, out = S(d, OL, 2.6) + S(d, '#8a6038', 1.2);
    [[-6.5, 6.2, 28], [0.5, 8.6, 0], [7.5, 6, -28]].forEach(function (t) {
      out += G(P('M-1.7,0 L1.7,0 L0.9,7.5 Q0,9 -0.9,7.5 Z', c.cel('#f0e8d2'), 1.2), 'translate(' + r1(x + t[0]) + ',' + r1(y + t[1]) + ') rotate(' + t[2] + ')');
    });
    [[-9, 3.2], [-3, 7.8], [4, 7.7], [10, 3]].forEach(function (p) { out += C(x + p[0], y + p[1], 1.7, c.cel(SHBLUE), 1.1); });
    return out;
  }
  /* grey wolf pelt worn over the front shoulder, head forward, fur hanging down the arm */
  function wolfMantle(c, g) {
    var fx = g.fSh[0] + 1, y = g.sy + 5, fur = '#8e8c94', out = '';
    out += pad(c, g.bSh[0] - 1, g.sy + 2, 8, '#6a4428', false, '#9a7a4a');
    var pd = D`M${fx - 12},${y + 4} C${fx - 12},${y - 7} ${fx + 9},${y - 9} ${fx + 12},${y + 3} L${fx + 10},${y + 9} L${fx + 7.5},${y + 5.5} L${fx + 5.5},${y + 11} L${fx + 2.5},${y + 6.5} L${fx - 0.5},${y + 12} L${fx - 3.5},${y + 6.5} L${fx - 6.5},${y + 11} L${fx - 9},${y + 6} Z`;
    out += P(pd, c.cel(fur), 2.2) + CG(S(D`M${fx - 8},${y + 3} l1.5,4 M${fx - 2},${y + 2} l0.5,5 M${fx + 4},${y + 2} l-0.5,5`, '#56545c', 1.2, 0.8), c.clip(pd));
    var hd = D`M${fx - 8},${y - 2} C${fx - 8.5},${y - 10.5} ${fx + 1.5},${y - 12.5} ${fx + 5},${y - 8.5} L${fx + 14.5},${y - 5.5} C${fx + 16.2},${y - 4.6} ${fx + 15.8},${y - 1.8} ${fx + 13.8},${y - 1.2} L${fx + 4},${y + 0.4} C${fx},${y + 1.4} ${fx - 6},${y + 1.2} ${fx - 8},${y - 2} Z`;
    var wh = P(D`M${fx - 4.5},${y - 8.5} L${fx - 6},${y - 15.5} L${fx + 0.5},${y - 10.5} Z`, c.cel(dk(fur, 0.1)), 1.8) +
      P(hd, c.cel(lt(fur, 0.12)), 2.2) +
      F(D`M${fx + 5},${y - 3.2} L${fx + 14},${y - 3.6} L${fx + 13.8},${y - 1.2} L${fx + 4},${y + 0.4} Z`, '#e4e2e8', 0.8) +
      S(D`M${fx + 1.6},${y - 7.2} L${fx + 5},${y - 6.4}`, OL, 1.4) + C(fx + 14.6, y - 4.4, 1.3, OL, 0) +
      P(D`M${fx + 9.5},${y - 0.9} L${fx + 10.6},${y + 2.6} L${fx + 11.8},${y - 1.1} Z`, '#f4ecd6', 1) +
      S(D`M${fx - 6},${y - 7} C${fx - 3},${y - 10.5} ${fx + 2},${y - 10.5} ${fx + 4},${y - 8.4}`, lt(fur, 0.45), 1.2, 0.7);
    out += scaleAt(G(wh, 'translate(-3,3)'), 0.9, fx, y);
    return out;
  }
  CLS.shaman = function (o) {
    o.torsoC = '#3e6a9c'; o.sleeve = '#6a4a2e'; o.hand = '#5a3a22'; o.pants = '#5a4028'; o.boots = '#3e2a1a';
    o.belt = '#4a2e1a'; o.buckle = '#9ae4ff';
    o.back = shamanTotem;
    o.torsoFx = shamanTorso;
    o.pads = wolfMantle;
    o.mid = function (c, g) { return shamanBeads(c, g) + G(woodShield(c), 'translate(' + r1(g.bHand[0] - 3) + ',' + r1(g.bHand[1] - 4) + ')'); };
    o.armband = '#2f5f9a';
    o.fItem = FI('shammace', 30);
    o.accent = '#0070DE';
  };
  /* bard (v10.3, a hidden class for now: Widya's): a green leather tunic with a gold-trimmed V neck and a gold vine
     down the front, a short skirt of pointed panels over leather trousers, a satchel strap across the chest to a
     satchel at the back hip, wide sleeves, and a dagger */
  var BARD = { tunic: '#5f8a3a', dark: '#43652a', gold: '#dcb24c', strap: '#553416', bag: '#8a5a30' };
  function bardTorso(c, g) {
    var b = g.b, x = g.scx, y = g.sy, hy = g.hy, sx = g.sx, wl = g.wl, wr = g.wr, out = '';
    var sk = D`M${wl - 1},${hy - 4} L${wr + 1},${hy - 4} C${wr + 3},${hy + 5} ${wr + 5},${hy + 11} ${wr + 6},${hy + 17} L${sx + 7},${hy + 14} L${sx + 3},${hy + 19.5} L${sx - 1},${hy + 14} L${sx - 5},${hy + 19.5} L${sx - 8},${hy + 14.5} L${wl - 6},${hy + 17} C${wl - 4},${hy + 10} ${wl - 2},${hy + 4} ${wl - 1},${hy - 4} Z`;
    out += P(sk, c.cel(BARD.tunic), 2.2) + CG(S(D`M${wr + 6.5},${hy + 14.6} L${sx + 7},${hy + 11.6} L${sx + 3},${hy + 17} L${sx - 1},${hy + 11.6} L${sx - 5},${hy + 17} L${sx - 8},${hy + 12} L${wl - 7},${hy + 14.6}`, BARD.gold, 1.6) +
      F(D`M${wl - 8},${hy - 5} L${sx - 3},${hy - 5} L${sx - 3},${hy + 22} L${wl - 8},${hy + 22} Z`, BARD.dark, 0.45), c.clip(sk));
    /* the V neck, gold-trimmed, and the vine embroidered down the front */
    out += P(D`M${x - 4},${y - 2} L${x + b.shW - 4},${y - 1} L${x + 5},${y + 11} Z`, c.cel(g.b.neckC || '#f0d0b8'), 0) +
      S(D`M${x - 5},${y - 1} L${x + 5},${y + 11} L${x + b.shW - 3},${y}`, OL, 3.6) + S(D`M${x - 5},${y - 1} L${x + 5},${y + 11} L${x + b.shW - 3},${y}`, BARD.gold, 1.8);
    out += S(D`M${x + 5},${y + 13} C${x + 3},${y + 16} ${x + 7},${y + 18} ${x + 5},${y + 21} C${x + 3},${y + 24} ${x + 6.5},${hy - 9} ${x + 4.6},${hy - 6}`, BARD.gold, 1.3);
    /* the satchel strap across the chest */
    out += CG(S(D`M${x + b.shW - 2},${y - 2} L${sx - b.waistW - 1},${hy - 2}`, OL, 4.6) + S(D`M${x + b.shW - 2},${y - 2} L${sx - b.waistW - 1},${hy - 2}`, BARD.strap, 2.6), c.clip(g.torsoD));
    return out;
  }
  function bardSatchel(c, g) {
    var x = g.wl - 5, y = g.hy - 3;
    return P(D`M${x - 6},${y + 1} C${x - 6.4},${y - 1} ${x - 5},${y - 2} ${x - 3},${y - 2} L${x + 5},${y - 1.6} C${x + 6.6},${y - 1.5} ${x + 7.2},${y - 0.4} ${x + 7},${y + 1} L${x + 6},${y + 10} C${x + 5.8},${y + 11.4} ${x + 5},${y + 12} ${x + 3.6},${y + 12} L${x - 3.6},${y + 11.6} C${x - 5},${y + 11.6} ${x - 5.8},${y + 10.8} ${x - 5.8},${y + 9.4} Z`, c.cel(BARD.bag), 2) +
      P(D`M${x - 6},${y + 0.8} C${x - 6},${y - 1} ${x - 5},${y - 2} ${x - 3},${y - 2} L${x + 5},${y - 1.6} C${x + 6.6},${y - 1.5} ${x + 7.2},${y - 0.4} ${x + 7},${y + 1} L${x + 6.6},${y + 5} C${x + 3},${y + 6.6} ${x - 3},${y + 6.4} ${x - 5.8},${y + 5} Z`, c.cel(lt(BARD.bag, 0.12)), 1.6) +
      R(x - 0.4, y + 3.8, 2.8, 3.2, BARD.gold, 1);
  }
  CLS.bard = function (o) {
    o.torsoC = BARD.tunic; o.sleeve = BARD.tunic; o.bell = BARD.dark; o.pants = '#6e4a2c'; o.boots = '#5a3a22';
    o.belt = '#4a2e1a'; o.buckle = GOLD;
    o.body.neckC = o.skin;
    o.torsoFx = bardTorso;
    o.mid = bardSatchel;
    o.fItem = FI('dagger', 36);
    o.accent = '#9ACD5A';
  };


  /* ================= v19 races: tauren, undead (Reclaimed) =================
     Hornfolk: the biggest race, broad and hunched, bovine head (HEAD.ptauren) with horns that change with the
     hair index, long ears, mane or braids, cloven hooves (foot kind 'thoof') and a tail (o.hairBack).
     Undead: human height but gaunt and hunched (HEAD.pundead): grey skin, a whole jaw, sunken faintly glowing eyes,
     stitched cloth patches on the clothes (o.raceTorso) and a linen-wrapped forearm (o.armFx). No bone shows.
     RACEB[race].fin runs after the gear, so it also adjusts named weapons and cloaks. */
  var TFUR = ['#8a5a36', '#3e3430', '#cdc6ba', '#c08c4c'];
  var TMANE = ['#201a18', '#5c3a22', '#ece6da', '#a4441e', '#8e8a86'];
  var TAURM = ['mane', 'braids', 'long', 'mane', 'braids'];
  var TAURF = ['braids', 'braid1', 'braids', 'long', 'braid1'];
  var USKIN = ['#a8aca6', '#9ca2a8', '#8e928c', '#b8bcbc'];
  var UHAIRC = ['#1e1c1c', '#a8965e', '#8e8c88', '#6a2622', '#e4e0d6'];
  var UHAIRM = ['ustring', 'ubald', 'umohawk', 'ulong', 'ubald'];
  var UHAIRF = ['ulong', 'ustring', 'utail', 'ubald', 'ulong'];
  var BONE = '#e6dec6';
  RACEB.tauren = {
    s: 1, swk: 1, armK: 1.1, footK: 1.28, handK: 1.14, shadow: 42, pZ: 0.74, pY: 33, pX: 26, padK: 1.34, lean: 5, topK: 1,
    m: { shW: 25, waistW: 16, belly: 6, armW: 13, legW: 13.6, hipY: 80, shY: 47, headX: 85, headY: 31, headR: 14.2, stance: 10, neck: 13, lean: 5 },
    f: { shW: 20.5, waistW: 13, belly: 2, armW: 11, legW: 12, hipY: 80, shY: 48.5, headX: 83, headY: 32.5, headR: 13.4, stance: 9, neck: 11, lean: 4 },
    fin: taurenFin
  };
  RACEB.undead = {
    s: 1, swk: 1, armK: 1, footK: 1, handK: 0.9, shadow: 26, pZ: 1.2, pY: 33, pX: 31, padK: 1, lean: 7,
    m: { shW: 15.5, waistW: 8.2, armW: 6.8, legW: 7.6, hipY: 82, shY: 53, headX: 77, headY: 39, headR: 11.8, stance: 7, neck: 5.2, lean: 7 },
    f: { shW: 13.6, waistW: 7.4, armW: 6.2, legW: 7.2, hipY: 82, shY: 53.5, headX: 76, headY: 39.5, headR: 11.4, stance: 6.5, neck: 4.8, lean: 6 },
    fin: undeadFin
  };
  RACES.push('tauren', 'undead');
  function raceSetup3(o, race, si, hi, f) {
    if (race === 'tauren') {
      o.skin = TFUR[si]; o.hair = { c: TMANE[hi], style: (f ? TAURF : TAURM)[hi] };
      o.horn = hi; o.noseRing = false; o.tbeard = !f && (hi === 1 || hi === 3 || hi === 4);
      o.head = 'ptauren'; o.feet = 'thoof'; o.hairBack = taurenTail;
    } else {
      o.skin = USKIN[si]; o.hair = { c: UHAIRC[hi], style: (f ? UHAIRF : UHAIRM)[hi] };
      o.ujaw = false; o.head = 'pundead';
      o.raceTorso = undeadTorso; o.armFx = boneArm;
    }
    o.hump = race === 'tauren' ? taurenHump : undeadHump; o.headLate = true;
  }
  /* weapon held by a hand, scaled about the grip */
  function scaleItem(fn, k, which, rot) {
    return function (c, g) { var h = which ? g.bHand : g.fHand, s = scaleAt(fn(c, g), k, h[0], h[1]); return rot ? G(s, 'rotate(' + rot + ' ' + r1(h[0]) + ' ' + r1(h[1]) + ')') : s; };
  }
  var TROT = { warrior: -14, paladin: -18, rogue: -32, shaman: -18, priest: -8 };
  function taurenFin(o) {
    /* the horns are the tauren crest: no warlock cowl horns, the druid gets leaves on the horns instead of antlers */
    if (o.top === hornedCowl) o.top = null;
    if (o.top === antlers) o.top = taurenLeaves;
    /* bigger hands carry bigger weapons; the long reach is tilted back a little to stay in the frame */
    var rot = TROT[o.cls] || 0, big = rot !== 0;
    if (o.fItem) o.fItem = scaleItem(o.fItem, big ? 1.06 : 1, 0, rot);
    if (o.bItem) o.bItem = scaleItem(o.bItem, 1.04, 1, 0);
  }
  function undeadFin(o) { }
  /* ---- tauren body parts ---- */
  function taurenHump(c, g, o) {
    var b = g.b, x = g.scx, y = g.sy, col = o.torsoC || o.sleeve || '#777777';
    return P(D`M${x - b.shW + 1},${y + 12} C${x - b.shW - 5},${y - 4} ${x - 10},${y - 15} ${x + 6},${y - 10} L${x + 9},${y + 5} Z`, c.cel(col));
  }
  function taurenTail(c, g, o) {
    var b = g.b, x = g.sx - b.waistW + 3, y = g.hy + 2, hc = o.hair ? o.hair.c : dk(o.skin, 0.3);
    var d = [[x, y - 2], [x - 10, y + 2], [x - 18, y + 12], [x - 21, y + 22]];
    var tx = x - 21, ty = y + 22;
    var tuft = D`M${tx - 3},${ty - 5} C${tx - 8},${ty} ${tx - 7.5},${ty + 8} ${tx - 3.5},${ty + 12} C${tx - 2},${ty + 9} ${tx - 1},${ty + 12} ${tx + 0.5},${ty + 13.5} C${tx + 1.5},${ty + 10} ${tx + 3},${ty + 11} ${tx + 5},${ty + 10} C${tx + 6.5},${ty + 4} ${tx + 4.5},${ty - 1} ${tx + 2.5},${ty - 5} Z`;
    return tube(d, 3.6, dk(o.skin, 0.12)) + P(tuft, c.cel(lt(hc, 0.12)), 2) + S(D`M${tx - 2},${ty} L${tx - 2.5},${ty + 8} M${tx + 1.5},${ty} L${tx + 1.5},${ty + 7}`, lt(hc, 0.35), 0.9, 0.7);
  }
  /* quadratic horn, tapering from w0 at the base to a point */
  function taperQ(p0, p1, p2, w0) {
    var L = [], Rr = [], n = 10, i;
    for (i = 0; i <= n; i++) {
      var t = i / n, u = 1 - t;
      var x = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], y = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1];
      var dx = 2 * u * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]), dy = 2 * u * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
      var l = Math.sqrt(dx * dx + dy * dy) || 1, w = w0 * (1 - Math.pow(t, 2.4)) * 0.5 * (1 - 0.35 * t) + 0.25;
      L.push([x - dy / l * w, y + dx / l * w]); Rr.push([x + dy / l * w, y - dx / l * w]);
    }
    return pl(L.concat(Rr.reverse())) + 'Z';
  }
  /* Hornfolk horns: curled ram horns, a tapering spiral with ridges, curling back around the ear.
     By hair index: [size, sweep in turns, start angle offset] */
  var THORN = [[1.0, 0.86, 0], [0.92, 1.0, 0.1], [1.12, 0.74, -0.1], [1.04, 0.92, 0.05], [0.82, 0.7, 0]];
  function taurenHorn(c, g, o, far) {
    var X = g.X, Y = g.Y, r = g.r, sh = THORN[o.horn] || THORN[0], f = o.gender === 'f', k = (f ? 0.7 : 1) * sh[0] * (far ? 0.92 : 1);
    var cx = X + r * (-0.62 + (far ? 0.4 : 0)), cy = Y + r * (-0.42 + (far ? -0.08 : 0));
    var a0 = -0.72 + sh[2], sweep = sh[1] * Math.PI * 2, R0 = r * 0.86 * k, R1 = r * 0.26 * k, w0 = r * 0.62 * k * (f ? 0.8 : 1);
    var n = 22, L = [], Rr = [], mid = [], i;
    for (i = 0; i <= n; i++) {
      var t = i / n, a = a0 - sweep * t, rad = R0 + (R1 - R0) * t, w = w0 * (1 - 0.82 * t) * 0.5 + 0.3;
      var px = cx + Math.cos(a) * rad, py = cy + Math.sin(a) * rad, nx = Math.cos(a), ny = Math.sin(a);
      L.push([px + nx * w, py + ny * w]); Rr.push([px - nx * w, py - ny * w]); mid.push([px, py, nx, ny, w]);
    }
    var d = pl(L.concat(Rr.reverse())) + 'Z';
    var fill = far ? c.lg(['#cfc2a0', '#9a8a66', '#5e5038'], 0, 0, 1, 1) : c.lg(['#f4ead2', '#cdb890', '#8a7652'], 0, 0, 1, 1);
    var out = P(d, fill, 2.2);
    if (!far) {
      /* transverse growth ridges and a lighter outer edge */
      var rg = '';
      for (i = 2; i < n; i += 2) { var m = mid[i]; rg += D`M${m[0] + m[2] * m[4] * 0.9},${m[1] + m[3] * m[4] * 0.9} L${m[0] - m[2] * m[4] * 0.9},${m[1] - m[3] * m[4] * 0.9} `; }
      out += CG(S(rg, '#8a7652', 1, 0.8) + S(pl(L.slice(0, n - 3)), '#ffffff', w0 * 0.14, 0.45), c.clip(d));
    }
    return out;
  }
  function taurenLeaves(c, g) {
    var X = g.X, Y = g.Y, r = g.r;
    return leaf(c, X - r * 0.55, Y - r * 0.95, -70, 0.55, '#5aa032') + leaf(c, X - r * 0.05, Y - r * 1.1, -20, 0.6) + leaf(c, X + r * 0.35, Y - r * 1.0, 35, 0.5, '#86c84a') +
      S(D`M${X - r * 0.7},${Y - r * 0.78} Q${X - r * 0.1},${Y - r * 1.05} ${X + r * 0.5},${Y - r * 0.82}`, '#5a3a22', 1.2, 0.9);
  }
  function taurenSkullD(g, f) {
    /* long, narrow goat-like face sloping down to a small muzzle */
    var X = g.X, Y = g.Y, r = g.r, m = f ? 0.88 : 1;
    function q(u, v) { return D`${X + r * u},${Y + r * v}`; }
    return 'M' + q(-0.95, 0.2) + ' C' + q(-1.02, -0.98) + ' ' + q(0.2, -1.2) + ' ' + q(0.72, -0.72) +
      ' C' + q(0.95, -0.5) + ' ' + q(1.0 + 0.2 * m, -0.12) + ' ' + q(1.0 + 0.46 * m, 0.34) +
      ' C' + q(1.0 + 0.66 * m, 0.62) + ' ' + q(1.0 + 0.8 * m, 0.92) + ' ' + q(1.0 + 0.74 * m, 1.1) +
      ' C' + q(1.0 + 0.66 * m, 1.26) + ' ' + q(1.0 + 0.44 * m, 1.3) + ' ' + q(1.0 + 0.28 * m, 1.26) +
      ' C' + q(1.0, 1.38) + ' ' + q(0.8, 1.44) + ' ' + q(0.5, 1.4) +
      ' C' + q(0.0, 1.36) + ' ' + q(-0.55, 1.12) + ' ' + q(-0.8, 0.8) + ' C' + q(-0.92, 0.62) + ' ' + q(-0.96, 0.4) + ' ' + q(-0.95, 0.2) + ' Z';
  }
  function taurenHair(c, g, o, layer) {
    var X = g.X, Y = g.Y, r = g.r, h = o.hair, hc = h.c, st = h.style, out = '', hi = lt(hc, 0.4), sh = dk(hc, 0.3);
    function q(u, v) { return D`${X + r * u},${Y + r * v}`; }
    if (layer === 'back') {
      if (st === 'mane') {
        out += P(qpoly(g, [[-0.3, -0.95], [-0.95, -0.88], [-1.4, -0.5], [-1.58, 0.1], [-1.95, 0.45], [-1.5, 0.58], [-1.78, 1.1], [-1.25, 1.04], [-1.36, 1.62], [-0.9, 1.2], [-0.72, 1.56], [-0.52, 0.9], [-0.4, 0.2]]), c.cel(hc), 2.1) +
          S('M' + q(-0.6, -0.7) + ' C' + q(-1.1, -0.5) + ' ' + q(-1.35, 0.1) + ' ' + q(-1.4, 0.7), hi, r * 0.08, 0.6) + S('M' + q(-0.8, 0.2) + ' L' + q(-1.1, 1.0), sh, r * 0.06, 0.7);
      } else if (st === 'long') {
        out += P('M' + q(-0.3, -0.95) + ' C' + q(-1.35, -0.92) + ' ' + q(-1.62, 0.2) + ' ' + q(-1.56, 1.4) + ' L' + q(-1.68, 2.3) + ' L' + q(-1.3, 2.0) + ' L' + q(-1.1, 2.45) + ' L' + q(-0.92, 1.95) +
          ' C' + q(-0.82, 1.1) + ' ' + q(-0.62, 0.5) + ' ' + q(-0.4, 0.2) + ' Z', c.cel(hc), 2.1) +
          S('M' + q(-0.7, -0.6) + ' C' + q(-1.25, -0.3) + ' ' + q(-1.35, 0.8) + ' ' + q(-1.35, 1.8), hi, r * 0.08, 0.6) + S('M' + q(-1.0, 0.2) + ' C' + q(-1.1, 0.9) + ' ' + q(-1.1, 1.5) + ' ' + q(-1.15, 2.1), sh, r * 0.06, 0.7);
        if (o.gender === 'f') out += E(X - r * 1.36, Y + r * 1.25, r * 0.28, r * 0.14, c.cel('#8a5a2a'), 1.4, null, -80);
      } else {
        /* braids: short crown hair behind the horns, the braids themselves hang in front (layer 'front') */
        out += P(qpoly(g, [[-0.3, -0.95], [-0.95, -0.86], [-1.3, -0.4], [-1.3, 0.25], [-0.95, 0.5], [-0.5, 0.3]]), c.cel(hc), 2);
        if (st === 'braid1') out += braidG(c, hpl(g, [[-1.0, 0.0], [-1.45, 1.1], [-1.4, 2.3]]), r * 0.34, hc, '#e8dcc0');
      }
      return out;
    }
    /* front: forelock between the horns + hanging braids */
    out += P(qpoly(g, [[-0.62, -0.82], [-0.36, -1.22], [-0.05, -1.02], [0.2, -1.3], [0.36, -0.96], [0.72, -0.98], [0.62, -0.7], [0.3, -0.74], [0.0, -0.62], [-0.32, -0.72]]), c.cel(hc), 1.9) +
      S('M' + q(-0.3, -0.95) + ' L' + q(0.15, -1.08), hi, r * 0.07, 0.7);
    if (st === 'braids' || st === 'mane' && o.gender === 'f') {
      out += braidG(c, hpl(g, [[-0.55, 0.32], [-0.72, 1.25], [-0.6, 2.25]]), r * 0.28, dk(hc, 0.08), '#e8dcc0') +
        braidG(c, hpl(g, [[-0.3, 0.42], [-0.34, 1.35], [-0.18, 2.35]]), r * 0.3, hc, o.gender === 'f' ? '#5aa0c8' : GOLD);
    }
    return out;
  }
  HEAD.ptauren = function (c, g, o) {
    var X = g.X, Y = g.Y, r = g.r, sk = o.skin, f = o.gender === 'f', h = o.hair, out = '';
    function q(u, v) { return D`${X + r * u},${Y + r * v}`; }
    var capped = o.hood || o.bandana || o.cap || o.hat, m = f ? 0.88 : 1;
    if (h && !o.hood) out += taurenHair(c, g, o, 'back');
    out += taurenHorn(c, g, o, true);
    var d = taurenSkullD(g, f);
    out += P(d, c.cel(sk));
    var muz = mix(sk, '#e4d0bc', 0.4), nose = mix(dk(sk, 0.45), '#4a3434', 0.5), nx = 1.0 + 0.74 * m;
    /* lighter muzzle at the end of the long face, a small dark nose, a pale stripe down the face, lit forehead */
    out += CG(E(X + r * (1.0 + 0.5 * m), Y + r * 0.98, r * 0.44 * m, r * 0.4, c.cel(muz), 0) +
      F('M' + q(-1, 0.3) + ' C' + q(-0.6, 1.1) + ' ' + q(0.3, 1.45) + ' ' + q(1.4, 1.3) + ' L' + q(1.4, 1.7) + ' L' + q(-1, 1.7) + ' Z', dk(sk, 0.35), 0.45) +
      S('M' + q(0.72, -0.62) + ' C' + q(1.0, -0.3) + ' ' + q(1.25, 0.1) + ' ' + q(nx - 0.12, 0.6), lt(sk, 0.3), r * 0.14, 0.6) +
      E(X + r * (nx - 0.04), Y + r * 0.82, r * 0.14, r * 0.16, c.cel(nose), 1.2) +
      F('M' + q(-0.9, -0.2) + ' C' + q(-0.6, -0.9) + ' ' + q(0.2, -1.05) + ' ' + q(0.6, -0.72) + ' C' + q(0.1, -0.8) + ' ' + q(-0.5, -0.6) + ' ' + q(-0.9, -0.2) + ' Z', lt(sk, 0.18), 0.6), c.clip(d));
    /* slit nostril and a short mouth line under the muzzle */
    out += S('M' + q(nx - 0.08, 0.74) + ' L' + q(nx + 0.02, 0.86), '#140a08', 1.1);
    out += S('M' + q(1.0 + 0.3 * m, 1.18) + ' Q' + q(1.0 + 0.5 * m, 1.2) + ' ' + q(nx - 0.08, 1.08), OL, 1.4);
    var ex = X + r * 0.66, ey = Y - r * 0.26;
    out += E(ex, ey, 1.9, 1.5, '#f0e2c0', 0) + C(ex + 0.5, ey + 0.1, 1.15, '#140a06', 0) + C(ex + 0.1, ey - 0.4, 0.45, '#ffffff', 0);
    out += P('M' + q(0.3, -0.46) + ' C' + q(0.55, -0.72) + ' ' + q(0.9, -0.66) + ' ' + q(1.08, -0.42) + ' C' + q(0.85, -0.46) + ' ' + q(0.6, -0.44) + ' ' + q(0.36, -0.36) + ' Z', dk(sk, 0.28), f ? 1.2 : 1.8);
    if (f) out += S(D`M${ex + 1.6},${ey - 1.1} l1.4,-1`, OL, 1);
    out += S('M' + q(0.98, -0.3) + ' Q' + q(1.18, -0.14) + ' ' + q(1.24, 0.06), dk(sk, 0.35), 1, 0.7);
    /* shaggy fur fringe along the back of the jaw (males, in the hair colour) */
    if (!f && h && !o.hood) out += P(qpoly(g, [[-0.62, 0.62], [-0.2, 0.9], [0.3, 1.14], [0.8, 1.32], [0.55, 1.58], [0.3, 1.36], [0.12, 1.66], [-0.08, 1.36], [-0.34, 1.54], [-0.4, 1.18], [-0.72, 1.2]]), c.cel(h.c), 1.8);
    /* long bovine ear, sticking out sideways (back, in profile) and drooping */
    if (!o.hood) {
      var ear = 'M' + q(-0.12, -0.38) + ' C' + q(-0.55, -0.5) + ' ' + q(-1.1, -0.3) + ' ' + q(-1.5, 0.22) + ' C' + q(-1.05, 0.32) + ' ' + q(-0.55, 0.2) + ' ' + q(-0.12, -0.02) + ' Z';
      out += P(ear, c.cel(dk(sk, 0.06)), 2) + F('M' + q(-0.28, -0.26) + ' C' + q(-0.62, -0.34) + ' ' + q(-1.0, -0.16) + ' ' + q(-1.28, 0.16) + ' C' + q(-0.95, 0.18) + ' ' + q(-0.6, 0.08) + ' ' + q(-0.28, -0.08) + ' Z', mix(sk, '#c88080', 0.4), 0.85);
      if (o.horn === 3) out += hoop(X - r * 1.05, Y + r * 0.24, r * 0.11);
    }
    if (h && !capped) out += taurenHair(c, g, o, 'front');
    /* goat beard: a tapering tuft under the chin */
    if (o.tbeard && !o.mask) {
      var bx0 = 1.0 + 0.3 * m;
      out += P('M' + q(bx0 - 0.28, 1.22) + ' C' + q(bx0 - 0.3, 1.6) + ' ' + q(bx0 - 0.12, 1.95) + ' ' + q(bx0 + 0.02, 2.2) + ' C' + q(bx0 + 0.12, 1.9) + ' ' + q(bx0 + 0.34, 1.55) + ' ' + q(bx0 + 0.36, 1.2) + ' Z', c.cel(h.c), 1.8) +
        S('M' + q(bx0 - 0.06, 1.34) + ' L' + q(bx0, 1.9), dk(h.c, 0.3), r * 0.06, 0.8);
    }
    /* hoods sit on the cranium; the mask is widened to cover the muzzle */
    var mk = o.mask;
    o.mask = null; out += headWear(c, g, o, ex, ey); o.mask = mk;
    if (mk) out += headWear(c, { X: X + r * 0.5, Y: Y + r * 0.12, r: r * 1.2 }, { mask: mk, maskKnot: o.maskKnot, hood: o.hood }, ex, ey);
    out += taurenHorn(c, g, o, false);
    return out;
  };
  /* the old mob Hornfolk head (Mr. Clobber) now uses the race head: ram horns, long face, no nose ring */
  HEAD.tauren = function (c, g, o) {
    var o2 = {}, k;
    for (k in o) o2[k] = o[k];
    o2.horn = o.horn || 0; o2.noseRing = false; o2.hair = o.hair || { c: '#2a1a12', style: 'mane' }; o2.tbeard = o.tbeard != null ? o.tbeard : true;
    return HEAD.ptauren(c, g, o2);
  };
  /* two-toed hoof with a fur fetlock (foot kind 'thoof') */
  function taurenHoof(c, o, x, y) {
    var back = x < 64, fur = back ? dk(o.skin, 0.18) : o.skin, hc = back ? '#241c1a' : '#3a302c';
    return P(D`M${x - 5.5},${y - 8.5} L${x + 4.5},${y - 8.5} C${x + 7.5},${y - 6.5} ${x + 9.5},${y - 3} ${x + 10},${y} L${x + 5},${y} L${x + 3.6},${y - 3.4} L${x + 2.4},${y} L${x - 6.5},${y} Z`, c.cel(hc), 2.2) +
      S(D`M${x - 4.5},${y - 7} L${x - 5.2},${y - 1.5}`, lt(hc, 0.35), 1.1, 0.7) + S(D`M${x + 5},${y - 7} Q${x + 7.5},${y - 4.5} ${x + 8.5},${y - 1.2}`, lt(hc, 0.35), 1, 0.6) +
      P(D`M${x - 6.8},${y - 7.5} L${x - 6},${y - 12} L${x + 5.5},${y - 12} L${x + 7},${y - 7.6} L${x + 4.5},${y - 8.8} L${x + 2.5},${y - 6.8} L${x + 0.5},${y - 8.8} L${x - 1.8},${y - 6.6} L${x - 4},${y - 8.8} Z`, c.cel(fur), 1.8);
  }
  /* ---- undead body parts ---- */
  function undeadHump(c, g, o) {
    var b = g.b, x = g.scx, y = g.sy, col = o.torsoC || o.sleeve || '#777777';
    return P(D`M${x - b.shW + 1},${y + 10} C${x - b.shW - 4},${y - 3} ${x - 8},${y - 11} ${x + 4},${y - 7} L${x + 6},${y + 4} Z`, c.cel(col)) +
      S(D`M${x - b.shW + 1},${y + 2} C${x - b.shW + 2},${y - 3} ${x - 6},${y - 7} ${x - 1},${y - 7}`, lt(col, 0.3), 1, 0.6);
  }
  /* mended clothes: two stitched cloth patches on the torso, frayed strips at the hips (no exposed ribs) */
  function patchG(c, d, col, pts) {
    var st = '';
    pts.forEach(function (p) { st += D`M${p[0] - 1.1},${p[1] - 1.1} L${p[0] + 1.1},${p[1] + 1.1} M${p[0] + 1.1},${p[1] - 1.1} L${p[0] - 1.1},${p[1] + 1.1} `; });
    return P(d, c.cel(col), 1.4) + S(st, '#e6dcc6', 0.8, 0.9);
  }
  function undeadTorso(c, g, o) {
    var x = g.scx - 3, y = g.sy + 11, col = o.torsoC || o.sleeve || '#777777', out = '';
    var pc = mix(col, '#8a7a5a', 0.45);
    out += patchG(c, D`M${x - 5},${y} L${x + 5},${y - 1} L${x + 6},${y + 8} L${x - 4.5},${y + 9} Z`, pc,
      [[x - 5, y + 2], [x - 5, y + 6], [x + 5.5, y + 2], [x + 5.8, y + 6], [x, y - 0.5], [x + 0.6, y + 8.6]]);
    var rx = g.sx + 4, ry = g.hy - 12;
    out += patchG(c, D`M${rx - 3},${ry - 1} L${rx + 3},${ry - 2} L${rx + 3.4},${ry + 3} L${rx - 2.6},${ry + 3.6} Z`, mix(col, '#5a5a62', 0.5), [[rx - 3, ry + 1.2], [rx + 3.2, ry + 0.5]]);
    var hy = g.hy, wl = g.wl, wr = g.wr, fr = '';
    [[0.12, 7], [0.34, 5], [0.62, 8], [0.86, 5.5]].forEach(function (p) {
      var fx = wl + (wr - wl) * p[0];
      fr += P(D`M${fx - 2.4},${hy - 1} L${fx + 2.4},${hy - 1} L${fx + 0.8},${hy + p[1]} L${fx - 0.4},${hy + p[1] - 2} Z`, c.cel(dk(col, 0.1)), 1.3);
    });
    return out + (o.robe ? '' : fr);
  }
  /* forearm bound in a stitched linen wrap (key kept: boneArm); draws over the front forearm */
  function boneArm(c, g, A, o) {
    var E0 = A[1], H = A[2], w = g.b.armW, bell = !!o.bell;
    var t0 = bell ? 0.4 : 0.22, t1 = bell ? 0.88 : 0.7;
    var p0 = [E0[0] + (H[0] - E0[0]) * t0, E0[1] + (H[1] - E0[1]) * t0], p1 = [E0[0] + (H[0] - E0[0]) * t1, E0[1] + (H[1] - E0[1]) * t1];
    var dx = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / L, ny = dx / L, hw = w * 0.62;
    var d = pl([[p0[0] + nx * hw, p0[1] + ny * hw], [p1[0] + nx * hw, p1[1] + ny * hw], [p1[0] - nx * hw, p1[1] - ny * hw], [p0[0] - nx * hw, p0[1] - ny * hw]]) + 'Z';
    var bands = '', st = '', i;
    for (i = 1; i < 4; i++) { var t = i / 4, bx = p0[0] + dx * t, by = p0[1] + dy * t; bands += D`M${bx + nx * hw - dx / L * 1.5},${by + ny * hw - dy / L * 1.5} L${bx - nx * hw + dx / L * 1.5},${by - ny * hw + dy / L * 1.5} `; }
    for (i = 0; i < 4; i++) { var u = (i + 0.5) / 4, sx = p0[0] + dx * u, sy = p0[1] + dy * u; st += D`M${sx + nx * 0.8 - dx / L},${sy + ny * 0.8 - dy / L} L${sx - nx * 0.8 + dx / L},${sy - ny * 0.8 + dy / L} `; }
    return P(d, c.cel('#cfc6ae'), 1.5) + CG(S(bands, '#8a8068', 1, 0.9) + S(st, '#5a4a3a', 0.8, 0.8), c.clip(d));
  }
  function undeadSkullD(g, f) {
    var X = g.X, Y = g.Y, r = g.r, j = f ? 0.92 : 1;
    function q(u, v) { return D`${X + r * u},${Y + r * v}`; }
    return 'M' + q(-0.95, 0.15) + ' C' + q(-1.0, -1.25) + ' ' + q(0.85, -1.35) + ' ' + q(0.96, -0.3) +
      ' L' + q(1.06, -0.1) + ' L' + q(1.0, 0.04) + ' C' + q(1.12, 0.18) + ' ' + q(1.22, 0.34) + ' ' + q(1.1, 0.42) + ' L' + q(0.98, 0.46) +
      ' C' + q(1.0, 0.62) + ' ' + q(1.0, 0.8 * j) + ' ' + q(0.94, 0.95 * j) + ' C' + q(0.9, 1.12 * j) + ' ' + q(0.72, 1.2 * j) + ' ' + q(0.56, 1.14 * j) +
      ' C' + q(0.2, 1.02) + ' ' + q(-0.1, 0.88) + ' ' + q(-0.35, 0.74) + ' C' + q(-0.78, 0.58) + ' ' + q(-0.95, 0.45) + ' ' + q(-0.95, 0.15) + ' Z';
  }
  function strand(pts, w, col) { var d = pl(pts); return S0(d, OL, r1(w + 2.2)) + S0(d, col, w); }
  function undeadHair(c, g, o, layer) {
    var X = g.X, Y = g.Y, r = g.r, h = o.hair, hc = h.c, st = h.style, out = '', hl = lt(hc, 0.35);
    function q(u, v) { return D`${X + r * u},${Y + r * v}`; }
    function hq(u, v) { return hp(g, u, v); }
    if (layer === 'back') {
      if (st === 'ulong') out += P('M' + q(-0.5, -0.9) + ' C' + q(-1.45, -0.8) + ' ' + q(-1.5, 0.4) + ' ' + q(-1.3, 1.45) + ' L' + q(-1.42, 1.95) + ' L' + q(-1.1, 1.6) + ' L' + q(-0.98, 2.1) + ' L' + q(-0.8, 1.55) + ' L' + q(-0.6, 1.8) + ' C' + q(-0.62, 1.0) + ' ' + q(-0.55, 0.5) + ' ' + q(-0.4, 0.1) + ' Z', c.cel(dk(hc, 0.05)), 2);
      if (st === 'ustring' || st === 'ulong') out += strand([hq(-0.9, -0.2), hq(-1.25, 0.6), hq(-1.2, 1.5)], 1.3, hc) + strand([hq(-0.7, 0.0), hq(-0.95, 0.9), hq(-0.85, 1.7)], 1.2, dk(hc, 0.15));
      if (st === 'utail') out += strand([hq(-0.95, -0.5), hq(-1.55, -0.2), hq(-1.7, 0.7), hq(-1.5, 1.6)], 2.2, hc) + strand([hq(-0.95, -0.45), hq(-1.4, 0.2), hq(-1.35, 1.2)], 1.3, dk(hc, 0.15)) +
        E(X - r * 1.1, Y - r * 0.5, r * 0.16, r * 0.2, c.cel('#4a3a30'), 1.3, null, 30);
      return out;
    }
    var sk = o.skin;
    if (st === 'ubald' || st === 'umohawk') {
      /* patchy scalp: a bare patch of skull bone on the crown */
      var sd = undeadSkullD(g, o.gender === 'f');
      out += CG(F(blob(X - r * 0.12, Y - r * 0.9, r * 0.36, r * 0.2, 6, rnd(7), 0.5), dk(sk, 0.14), 0.8) + S('M' + q(-0.4, -1.0) + ' L' + q(0.2, -0.82), dk(sk, 0.45), 1) + S('M' + q(-0.3, -1.08) + ' l' + r1(r * 0.04) + ',' + r1(r * 0.14) + ' M' + q(-0.1, -1.0) + ' l' + r1(r * 0.04) + ',' + r1(r * 0.14) + ' M' + q(0.1, -0.94) + ' l' + r1(r * 0.04) + ',' + r1(r * 0.14), dk(sk, 0.5), 0.8) +
        F('M' + q(-1.1, 0.2) + ' C' + q(-1.1, -0.9) + ' ' + q(-0.6, -1.2) + ' ' + q(-0.5, -1.2) + ' L' + q(-0.62, -0.4) + ' Z', dk(sk, 0.2), 0.4), c.clip(sd));
      if (st === 'ubald') out += strand([hq(-0.62, -0.62), hq(-0.95, -0.2), hq(-1.05, 0.55)], 1.3, hc) + strand([hq(-0.4, -0.72), hq(-0.62, 0.0), hq(-0.62, 0.62)], 1.2, dk(hc, 0.12)) + strand([hq(-0.8, -0.35), hq(-1.15, 0.3), hq(-1.2, 0.9)], 1.1, hc);
      else out += P(qpoly(g, [[0.5, -0.9], [0.62, -1.28], [0.28, -1.18], [0.2, -1.52], [-0.1, -1.3], [-0.3, -1.55], [-0.45, -1.2], [-0.8, -1.3], [-0.78, -0.95], [-1.1, -0.9], [-0.95, -0.66], [-0.5, -0.96], [0.1, -1.08]]), c.cel(hc), 1.9) +
        S('M' + q(0.2, -1.2) + ' L' + q(-0.2, -1.35), hl, r * 0.06, 0.7);
      return out;
    }
    /* thin lank cap with a ragged fringe, strands falling over the face and ear */
    out += P('M' + q(0.8, -0.52) + ' C' + q(0.72, -1.45) + ' ' + q(-1.3, -1.45) + ' ' + q(-1.06, 0.2) + ' L' + q(-0.86, 0.55) + ' L' + q(-0.8, 0.1) + ' L' + q(-0.66, 0.38) + ' L' + q(-0.6, -0.12) + ' L' + q(-0.4, 0.06) +
      ' L' + q(-0.34, -0.36) + ' L' + q(-0.06, -0.44) + ' L' + q(0.1, -0.24) + ' L' + q(0.24, -0.5) + ' L' + q(0.46, -0.3) + ' L' + q(0.56, -0.54) + ' Z', c.cel(hc), 2);
    out += S('M' + q(-0.55, -0.95) + ' C' + q(-0.2, -1.15) + ' ' + q(0.2, -1.12) + ' ' + q(0.45, -0.92), hl, 1.2, 0.6);
    /* a bald patch shows through the thin hair */
    out += E(X - r * 0.15, Y - r * 0.92, r * 0.22, r * 0.1, sk, 0, 0.8, -8);
    out += strand([hq(0.35, -0.45), hq(0.4, 0.05), hq(0.3, 0.45)], 1.1, hc) + strand([hq(-0.72, 0.2), hq(-0.8, 0.7), hq(-0.7, 1.05)], 1.2, hc);
    return out;
  }
  HEAD.pundead = function (c, g, o) {
    var X = g.X, Y = g.Y, r = g.r, sk = o.skin, f = o.gender === 'f', h = o.hair, out = '';
    function q(u, v) { return D`${X + r * u},${Y + r * v}`; }
    var capped = o.hood || o.bandana || o.cap || o.hat;
    if (h && !o.hood) out += undeadHair(c, g, o, 'back');
    var d = undeadSkullD(g, f);
    out += P(d, c.cel(sk));
    out += CG(F('M' + q(-0.9, 0.2) + ' C' + q(-0.85, 0.8) + ' ' + q(-0.4, 1.1) + ' ' + q(0.1, 1.2) + ' C' + q(-0.3, 0.64) + ' ' + q(-0.42, 0.12) + ' ' + q(-0.9, 0.2) + ' Z', dk(sk, 0.32), 0.5) +
      E(X + r * 0.38, Y + r * 0.5, r * 0.34, r * 0.2, dk(sk, 0.42), 0, 0.5, -10) + E(X + r * 0.28, Y - r * 0.32, r * 0.24, r * 0.12, dk(sk, 0.3), 0, 0.4) +
      C(X - r * 0.4, Y + r * 0.1, r * 0.1, dk(sk, 0.3), 0, 0.6) + C(X + r * 0.1, Y - r * 0.62, r * 0.07, dk(sk, 0.3), 0, 0.6), c.clip(d));
    out += S('M' + q(0.1, 0.26) + ' Q' + q(0.45, 0.2) + ' ' + q(0.78, 0.32), lt(sk, 0.35), 1, 0.7);
    /* ragged ear */
    if (!o.hood) out += P('M' + q(-0.36, -0.06) + ' C' + q(-0.2, -0.26) + ' ' + q(0.02, -0.02) + ' ' + q(-0.06, 0.2) + ' L' + q(-0.16, 0.22) + ' L' + q(-0.1, 0.34) + ' C' + q(-0.16, 0.5) + ' ' + q(-0.36, 0.44) + ' ' + q(-0.4, 0.3) + ' Z', dk(sk, 0.08), 1.3) +
      S('M' + q(-0.28, 0.0) + ' Q' + q(-0.14, 0.12) + ' ' + q(-0.22, 0.3), dk(sk, 0.45), 0.9);
    /* exposed jaw: cheek flesh gone, bone and teeth showing */
    if (o.ujaw && !o.mask) {
      var jw = 'M' + q(0.18, 0.62) + ' L' + q(0.32, 0.5) + ' L' + q(0.44, 0.62) + ' L' + q(0.58, 0.5) + ' L' + q(0.7, 0.62) + ' L' + q(0.84, 0.54) + ' L' + q(1.2, 0.58) + ' L' + q(1.2, 1.4) + ' L' + q(0.1, 1.4) + ' Z';
      var gap = 'M' + q(0.36, 0.76) + ' L' + q(1.1, 0.72) + ' L' + q(1.1, 0.84) + ' L' + q(0.4, 0.86) + ' Z', teeth = '';
      for (var i = 0; i < 6; i++) { var tu = 0.46 + i * 0.1; teeth += 'M' + q(tu, 0.7) + ' L' + q(tu, 0.9); }
      out += CG(F(jw, c.cel(BONE)) + F(gap, '#1a0e0e') + S(teeth, OL, 0.8) + S('M' + q(0.2, 1.0) + ' Q' + q(0.6, 1.1) + ' ' + q(1.0, 0.98), dk(BONE, 0.35), 1, 0.8) +
        S('M' + q(0.18, 0.62) + ' L' + q(0.32, 0.5) + ' L' + q(0.44, 0.62) + ' L' + q(0.58, 0.5) + ' L' + q(0.7, 0.62) + ' L' + q(0.84, 0.54) + ' L' + q(1.2, 0.58), OL, 1.4), c.clip(d));
    } else if (!o.mask) out += S('M' + q(0.52, 0.8) + ' L' + q(0.96, 0.76), OL, 1.2) + S('M' + q(0.62, 0.8) + ' l0,1.4 M' + q(0.78, 0.79) + ' l0,1.4', OL, 0.7);
    /* sunken socket, glowing pinpoint eye */
    var ex = X + r * 0.6, ey = Y - r * 0.04;
    out += E(ex, ey + r * 0.02, r * 0.3, r * 0.24, dk(sk, 0.4), 0, 0.7) + E(ex, ey, r * 0.2, r * 0.16, '#1a1412', 0) +
      C(ex + r * 0.02, ey, r * 0.38, c.rg([[0, '#fff6c8', 0.7], [0.4, '#f0e090', 0.25], [1, '#f0e090', 0]]), 0) +
      C(ex + r * 0.03, ey, r * 0.08, '#f8f2d0', 0);
    out += S('M' + q(0.28, -0.3) + ' L' + q(1.0, -0.2), OL, f ? 1.5 : 2);
    if (f) out += S(D`M${ex + r * 0.2},${ey - r * 0.16} l1.4,-1`, OL, 0.9);
    /* thin nose line */
    out += S('M' + q(1.02, 0.14) + ' L' + q(1.1, 0.36) + ' L' + q(0.98, 0.4), dk(sk, 0.45), 0.9, 0.8);
    if (h && !capped) out += undeadHair(c, g, o, 'front');
    out += headWear(c, g, o, ex, ey);
    return out;
  };

  /* ================= named gear (opts.gear) ================= */
  var MBLUE = '#2f5fa8', BLOOD = '#b81c1c', DRED = '#7a7e83'; /* DRED: the Grey Hoods' scarf grey (was a red mask) */
  function cog(cx, cy, n, ro, ri) {
    var d = '', s = Math.PI * 2 / n;
    for (var i = 0; i < n; i++) {
      var a = i * s;
      [[ri, a - 0.3 * s], [ro, a - 0.2 * s], [ro, a + 0.2 * s], [ri, a + 0.3 * s]].forEach(function (q, j) {
        d += (i === 0 && j === 0 ? 'M' : 'L') + r1(cx + Math.cos(q[1]) * q[0]) + ',' + r1(cy + Math.sin(q[1]) * q[0]);
      });
    }
    return d + 'Z';
  }
  /* blue grip with gold spiral wrap, from y0 (top) to y1 */
  function mGrip(c, w, y0, y1) {
    var d = '';
    for (var y = y0 + 2; y < y1; y += 3) d += D`M${-w},${y + 1.4} L${w},${y - 1}`;
    return P(D`M${-w},${y0} L${w},${y0} L${w},${y1} L${-w},${y1} Z`, c.cel(MBLUE), 1.8) + S(d, GOLD, 1.3);
  }
  var GW = {
    cruel_barb: function (c) {
      var bd = 'M-3.6,-5 L-3.8,-38 L-7.5,-41 L-2.8,-44.5 L1,-54 L3.2,-47 L7.6,-49.5 L4.8,-42 L8,-38.5 L4.6,-35.5 L8.2,-32 L4.6,-29 L8.2,-25.5 L4.6,-22.5 L8,-19 L4.4,-16 L7.6,-12.5 L4,-9.5 L4,-5 Z';
      return P(bd, c.lg(['#9aa2ac', '#5c646e', '#30363e'], 0, 0, 1, 0), 2) +
        CG(F('M2.4,-60 L12,-60 L12,-4 L2.4,-4 Z', BLOOD) + F('M-12,-60 L-2,-60 L-2,-38 L-12,-38 Z', BLOOD), c.clip(bd)) +
        S('M-0.8,-8 L-0.8,-40', '#20262c', 1.3) +
        P('M-2.4,-3 L2.4,-3 L2.4,8.5 L-2.4,8.5 Z', '#5a1a18', 1.8) + S('M-2.4,0 L2.4,1.6 M-2.4,4 L2.4,5.6', '#2a0a0a', 1) +
        P('M-12,-9.5 L-7,-5.5 L7,-5.5 L12,-9.5 L10,-2 L-10,-2 Z', c.cel('#4a4e56'), 2) +
        P('M-3,8.5 L0,15.5 L3,8.5 Z', c.cel('#4a4e56'), 1.6);
    },
    smites_hammer: function (c) {
      var iron = c.cel('#5c6068');
      return P('M-2.8,34 L-3.2,-42 L3.2,-42 L2.8,34 Z', c.cel('#5a3a22'), 2.2) +
        S('M-2.8,-2 L2.8,0.5 M-2.8,3 L2.8,5.5 M-2.8,8 L2.8,10.5', '#2a1a10', 1.2) +
        P('M-3,-62 L0,-71 L3,-62 Z', iron, 1.8) +
        P('M-16,-62 L16,-62 L17.5,-39 L-17.5,-39 Z', iron, 2.6) +
        F('M-15,-60 L-6,-60 L-7,-41 L-16,-41 Z', '#ffffff', 0.18) +
        P('M-12.5,-62.5 L-8,-62.5 L-8.4,-38.5 L-13.2,-38.5 Z', c.cel(GOLD), 1.6) + P('M8,-62.5 L12.5,-62.5 L13.2,-38.5 L8.4,-38.5 Z', c.cel(GOLD), 1.6) +
        C(0, -50.5, 3.2, c.cel(GOLD), 1.5) +
        R(-4.8, -43, 9.6, 6, c.cel(GOLD), 1.6) + C(0, 35.5, 3.2, iron, 1.8);
    },
    thiefs_blade: function (c) {
      return P('M-2.2,-4 C-3.4,-20 -2.2,-36 3.4,-51 C4,-38 3.6,-20 2.2,-4 Z', c.lg(STEEL, 0, 0, 1, 0), 1.8) +
        S('M0.4,-8 C0,-22 0.8,-34 3,-45', '#8e99a5', 0.9) +
        P('M-2,-2.5 L2,-2.5 L2,8 L-2,8 Z', '#141216', 1.6) +
        P('M-6.5,-5.8 L6.5,-5.8 L5.5,-2.4 L-5.5,-2.4 Z', c.cel('#3a3a42'), 1.6) +
        C(0, 10.5, 3, c.rg([[0, '#d8ffe0'], [0.45, '#34e060'], [1, '#0a6a24']], 0.35, 0.35, 0.7), 1.6);
    },
    buzzer_blade: function (c) {
      var d = 'M-3,-10', i, y;
      for (i = 0, y = -12; y > -32; i++, y -= 3.2) d += D` L${-5.6},${y - 1.6} L${-3},${y - 3.2}`;
      d += ' L0,-40';
      for (y = -31.2; y < -12; y += 3.2) d += D` L3,${y} L${5.6},${y + 1.6}`;
      d += ' L3,-10 Z';
      return P(d, c.lg(['#e8ecef', '#a8b0b8', '#6c747c'], 0, 0, 1, 0), 1.8) +
        S('M0,-14 L0,-34', '#7c8793', 1) +
        P('M-2.2,-4 L2.2,-4 L2.2,8 L-2.2,8 Z', '#3a2a1c', 1.6) +
        P(cog(0, -8.5, 8, 6.4, 4.6), c.cel('#d0a040'), 1.5) + C(0, -8.5, 2, '#3a2a1c', 1.1) +
        C(0, 9.5, 2.2, '#b88a30', 1.4);
    },
    emberstone_staff: function (c) {
      var sh = '#3e2a1e';
      var spark = function (x, y, s) { return P(D`M${x},${y - s} L${x + s * 0.6},${y} L${x},${y + s} L${x - s * 0.6},${y} Z`, '#ffc040', 1); };
      return P('M-2.2,38 L-2.8,-50 L2.8,-50 L2.2,38 Z', c.lg([lt(sh, 0.25), sh, dk(sh, 0.4)], 0, 0, 1, 0), 2) +
        S('M-2.5,-22 L2.5,-19 M-2.5,-16 L2.5,-13', '#c24a14', 1.4) +
        C(0, -61, 16, c.rg([[0, '#fff0b0', 0.95], [0.4, '#ff7a1a', 0.5], [1, '#ff4a00', 0]]), 0) +
        P('M-6.5,-49 C-10,-55 -9,-63 -7,-67 L-3.5,-60 L3.5,-60 L7,-67 C9,-63 10,-55 6.5,-49 Z', c.cel('#4e3424'), 2) +
        P('M0,-70 L5.5,-63.5 L4.5,-55.5 L-3.5,-54.5 L-5.8,-62 Z', c.rg([[0, '#fff6c0'], [0.35, '#ffa030'], [1, '#c0280a']], 0.4, 0.3, 0.75), 1.8) +
        F('M-1.5,-66 L1.5,-65 L0,-61 Z', '#fffbe0', 0.9) +
        spark(-10, -72, 2.8) + spark(9, -76, 2.4) + spark(12, -63, 2);
    },
    cookies_rod: function (c) {
      var wd = '#b8844a';
      return P('M-2.4,38 L-2.6,-44 L2.6,-44 L2.4,38 Z', c.lg([lt(wd, 0.25), wd, dk(wd, 0.35)], 0, 0, 1, 0), 2) +
        S('M-2.4,-4 L2.4,-2 M-2.4,0 L2.4,2', '#6a3a1a', 1.4) +
        E(0, -57, 10.5, 14, c.cel(wd), 2.2) + E(0.8, -58, 7, 10.5, c.cel('#8a5a2a'), 1.4) +
        E(1.2, -55, 5.6, 6.2, c.rg([[0, '#f0a050'], [1, '#b85a18']], 0.4, 0.3, 0.7), 1) +
        C(-1, -57, 1.4, '#ffe0a0', 0) + C(3, -53.5, 1.1, '#6aa030', 0) +
        P('M5.5,-46 C6.5,-43 6,-40 5,-39 C4,-40 4,-43 5.5,-46 Z', '#c86a24', 1.2);
    },
    cookies_tenderizer: function (c) {
      var hd = c.cel('#9aa0a8'), sp = '';
      [-37.5, -33, -28.5].forEach(function (y) {
        sp += P(D`M-11,${y - 2} L-14.5,${y} L-11,${y + 2} Z`, '#c8ced4', 1.2) + P(D`M11,${y - 2} L14.5,${y} L11,${y + 2} Z`, '#c8ced4', 1.2);
      });
      return P('M-2.2,12 L-2.2,-25 L2.2,-25 L2.2,12 Z', c.cel(WOOD), 2) +
        S('M-2.2,4 L2.2,5.5 M-2.2,8 L2.2,9.5', '#3a2616', 1.1) +
        sp + P('M-11,-41 L11,-41 L11,-25 L-11,-25 Z', hd, 2.2) +
        S('M-7,-37.5 L7,-37.5 M-7,-33 L7,-33 M-7,-28.5 L7,-28.5 M-3.5,-40 L-3.5,-26 M3.5,-40 L3.5,-26', '#5a6068', 1) +
        R(-3.8, -26, 7.6, 4, '#5a6068', 1.4);
    },
    militia_sword: function (c) {
      return P('M-3.4,-5 L-3.4,-40 L0,-48 L3.4,-40 L3.4,-5 Z', c.lg(STEEL, 0, 0, 1, 0), 2) + S('M0,-9 L0,-40', '#8e99a5', 1.2) +
        mGrip(c, 2.6, -3, 12) +
        P('M-12,-11.5 L12,-11.5 L11,-6 L-11,-6 Z', c.cel(MBLUE), 2) + S('M-10,-8.7 L10,-8.7', GOLD, 1.4) +
        C(-12, -8.7, 2.4, c.cel(GOLD), 1.4) + C(12, -8.7, 2.4, c.cel(GOLD), 1.4) + C(0, -8.7, 2.6, c.cel(GOLD), 1.4) +
        C(0, 14.5, 3.4, c.cel(GOLD), 2);
    },
    militia_dagger: function (c) {
      return P('M-2.8,-4 L-2.8,-21 L0,-28 L2.8,-21 L2.8,-4 Z', c.lg(STEEL, 0, 0, 1, 0), 2) +
        mGrip(c, 2.3, -2, 10) +
        P('M-8.5,-9.5 L8.5,-9.5 L8,-5 L-8,-5 Z', c.cel(MBLUE), 1.8) + C(-8.5, -7.2, 1.9, c.cel(GOLD), 1.2) + C(8.5, -7.2, 1.9, c.cel(GOLD), 1.2) + C(0, -7.2, 2, c.cel(GOLD), 1.2) +
        C(0, 12, 2.7, c.cel(GOLD), 1.6);
    },
    militia_hammer: function (c) {
      return P('M-2.2,11 L-2.4,-27 L2.4,-27 L2.2,11 Z', c.cel(WOOD), 2) + mGrip(c, 2.4, -1, 10) +
        P('M-11.5,-40 L11.5,-40 L12.5,-26 L-12.5,-26 Z', c.lg(STEEL, 0, 0, 1, 0), 2.4) +
        P('M-4.5,-40.5 L4.5,-40.5 L4.5,-25.5 L-4.5,-25.5 Z', c.cel(MBLUE), 1.8) + S('M-4.5,-33 L4.5,-33', GOLD, 1.6) +
        C(0, 12.5, 2.6, c.cel(GOLD), 1.6);
    },
    militia_staff: function (c) {
      var wd = '#8a5c34';
      return P('M-2.2,38 L-2.6,-50 L2.6,-50 L2.2,38 Z', c.lg([lt(wd, 0.25), wd, dk(wd, 0.35)], 0, 0, 1, 0), 2) +
        mGrip(c, 3.3, -12, 12) + mGrip(c, 3.3, -44, -34) +
        P('M-3.2,34 L3.2,34 L2.8,41 L-2.8,41 Z', c.lg(STEEL, 0, 0, 1, 0), 1.6) +
        R(-4.6, -52, 9.2, 4, c.cel(GOLD), 1.4) +
        C(0, -58, 6.2, c.lg(STEEL, 0.2, 0, 0.8, 1), 2) +
        C(0, -58, 2.8, c.rg([[0, '#bfe0ff'], [1, MBLUE]], 0.4, 0.35, 0.7), 1.3) + P('M-2,-64 L0,-69 L2,-64 Z', c.cel(GOLD), 1.3);
    },
    militia_longbow: function (c) {
      var st = 'M-10,-45 C2,-37 5,-18 1.5,-3 L1.5,3 C5,18 2,37 -10,45';
      return S('M-10,-45 L-10,45', '#efe6cf', 1.1, 0.95) +
        S(st, OL, 7.5) + S(st, '#9a6634', 4) + S('M-8,-43 C3,-35 4.5,-18 2,-5 M2,5 C4.5,18 3,35 -8,43', lt('#9a6634', 0.35), 1.2, 0.8) +
        G(mGrip(c, 3.4, -12, 12), 'translate(1.5,0)') + S('M-8.6,-40 L-5.4,-37 M-8.6,40 L-5.4,37', MBLUE, 3) +
        C(-10, -45, 2.2, c.lg(STEEL, 0, 0, 1, 0), 1.3) + C(-10, 45, 2.2, c.lg(STEEL, 0, 0, 1, 0), 1.3);
    },
    /* Grik'Nir's staff: gnarled troll wood, a frozen blue orb in bone prongs, fetishes on cords */
    griknir_staff: function (c) {
      var wd = '#6a5038', out = '';
      out += P('M-2.4,38 C-3.2,20 -1.4,-8 -3,-46 L3,-46 C2.2,-8 3.6,20 2.4,38 Z', c.lg([lt(wd, 0.25), wd, dk(wd, 0.4)], 0, 0, 1, 0), 2);
      out += S('M-2.6,-30 L2.8,-27 M-2.6,-25 L2.8,-22 M-2.6,-20 L2.8,-17', '#3a78b8', 1.6);
      out += S('M-1,-24 C-6,-20 -8,-14 -7,-6 M1.5,-26 C6,-22 9,-16 8,-8', '#c9b890', 0.9);
      out += G(P('M0,0 C3,-3 3.6,-9 0,-13 C-3.6,-9 -3,-3 0,0 Z', c.cel('#e8f2fa'), 1.3) + S('M0,-1 L0,-11', '#6a8aa8', 0.7), 'translate(-7,-4) rotate(170)') +
        G(P('M0,0 C3,-3 3.6,-9 0,-13 C-3.6,-9 -3,-3 0,0 Z', c.cel('#3a78c8'), 1.3), 'translate(8,-6) rotate(190)') +
        P('M6,-9 C4,-11 4,-14 7,-15 C10,-14 10,-11 8,-9 Z', c.cel('#ece4cc'), 1.2) + C(6.3, -12.6, 0.7, '#1a1009', 0) + C(8.1, -12.6, 0.7, '#1a1009', 0);
      out += C(0, -60, 17, c.rg([[0, '#e8fbff', 0.95], [0.4, '#7fd0ff', 0.5], [1, '#3a8ae0', 0]]), 0);
      out += P('M-3,-46 C-9,-50 -10,-58 -7,-66 L-5,-58 Z M3,-46 C9,-50 10,-58 7,-66 L5,-58 Z M0,-47 L-1.5,-52 L1.5,-52 Z', c.cel('#e6dcc4'), 1.6);
      out += C(0, -59, 7.6, c.rg([[0, '#ffffff'], [0.35, '#b8ecff'], [0.75, '#4aa8e8'], [1, '#1a5aa8']], 0.38, 0.35, 0.72), 2);
      out += P('M-2.5,-63 L0,-67 L1,-61 Z M2,-57 L5,-59 L3.5,-54 Z', '#ffffff', 0, 0.85);
      out += P('M-8,-66 L-11,-73 L-6,-69 Z M8,-66 L12,-72 L7,-68 Z M0,-68 L0,-76 L2,-69 Z', c.cel('#cfeeff'), 1.2);
      return out;
    },
    /* Snowfang's claw: a huge curved lion claw set as a dagger, fur collar, leather grip */
    vagash_claw: function (c) {
      var bd = 'M-4,-5 C-5.5,-17 -3,-29 6.5,-38 C5.2,-30 4.4,-17 4,-5 Z';
      return P(bd, c.lg(['#f6eedc', '#d8c6a0', '#8a7456', '#3a2e24'], 0, 1, 0.6, 0), 2) +
        S('M-1.5,-9 C-2,-19 0,-28 5,-35', '#fff8ea', 1, 0.7) + S('M2,-8 C2,-16 2.6,-24 4.5,-30', '#6a5a44', 0.9, 0.7) +
        P('M-2.4,-3 L2.4,-3 L2.4,8.5 L-2.4,8.5 Z', '#4a2e1a', 1.8) + S('M-2.4,-0.5 L2.4,1.2 M-2.4,2.6 L2.4,4.3 M-2.4,5.7 L2.4,7.4', '#8a6038', 0.9) +
        P('M-6.5,-3 L-5,-7 L-2.5,-4.5 L0,-8 L2.5,-4.5 L5,-7.5 L6.5,-3 L4,-1.5 L-4,-1.5 Z', c.cel('#c8984e'), 1.6) +
        C(0, 10.5, 2.8, c.cel('#ece4cc'), 1.5);
    },
    /* Old Barkjaw's staff: tall gnarled totem wood, a carved bear head on top, feathers on a cord */
    oakenscowl_staff: function (c) {
      var wd = '#6e4e30', out = '', fe = function (x, y, a, col) {
        return G(P('M0,0 C3.4,-3.4 4,-11 0,-16 C-4,-11 -3.4,-3.4 0,0 Z', c.cel(col), 1.3) + S('M0,-1 L0,-14', dk(col, 0.45), 0.7) + S('M-1.8,-6 L0,-8 M1.8,-9 L0,-11', dk(col, 0.3), 0.6), 'translate(' + x + ',' + y + ') rotate(' + a + ')');
      };
      out += P('M-2.6,38 C-3.6,24 -1.2,10 -3.4,-4 C-4.6,-14 -2,-24 -3.4,-44 L3.4,-44 C2.4,-26 4.6,-14 3.2,-2 C2,10 3.8,24 2.6,38 Z', c.lg([lt(wd, 0.22), wd, dk(wd, 0.42)], 0, 0, 1, 0), 2);
      out += S('M-2.6,6 C-1,4 1,3 2.6,0 M-2.4,-18 C-0.5,-20 1,-22 2.8,-24', dk(wd, 0.5), 1.1) + C(1.4, 14, 1.4, dk(wd, 0.45), 0);
      out += S('M-3.2,-30 L3.2,-27 M-3.2,-26 L3.2,-23', '#c8a860', 1.6);
      /* feathers hung from a cord under the carving */
      out += S('M-3,-40 C-8,-36 -10,-30 -9,-24', OL, 2.4) + S('M-3,-40 C-8,-36 -10,-30 -9,-24', '#c8a870', 1.1);
      out += fe(-9, -24, 172, '#f0ece2') + fe(-6, -25, 196, '#8a5a32') + C(-8.6, -24.6, 1.8, c.cel('#b8342a'), 1);
      /* carved bear head, snout forward (+x) */
      out += C(-6.5, -60.5, 3.8, c.cel('#7a5634'), 1.8) + C(3.5, -61.5, 3.6, c.cel('#7a5634'), 1.8) + C(-6.5, -60.5, 1.6, '#4a2e1a', 0) + C(3.5, -61.5, 1.5, '#4a2e1a', 0);
      out += P('M-9,-48 C-11,-56 -6,-62 0,-61 C6,-61 9,-57 9,-53 L14.5,-51 C16.5,-50 16.5,-46 14.5,-45 L8,-43 C4,-40 -6,-40 -9,-48 Z', c.cel('#8a6038'), 2);
      out += F('M9,-53 L14.5,-51 C16.5,-50 16.5,-46 14.5,-45 L8,-43 C9,-46 9,-50 9,-53 Z', '#5a3a20', 0.6) + E(15, -49.6, 1.6, 1.3, '#1a1009', 0);
      out += S('M9,-45.5 L13.5,-45', OL, 1.1) + C(4.4, -53.8, 1.4, '#1a1009', 0) + C(4.8, -54.2, 0.5, '#e8ffb0', 0) + S('M2,-56.4 L6.5,-55.5', OL, 1.4);
      out += S('M-7,-52 C-5,-54 -3,-54 -1,-52 M-6,-47 C-4,-49 -2,-49 0,-47', dk('#8a6038', 0.45), 1, 0.9);
      out += S('M-8,-44 L8,-43', '#c8a860', 2.2) + S('M-8,-44 L8,-43', OL, 0.6, 0.6);
      return out;
    },
    /* Lord Varneth's blade: a strongly curved satyr blade, dark metal, gloom-green cutting edge */
    melenas_blade: function (c) {
      var bd = 'M-3,-5 C-7,-18 -6,-32 2,-44 C5,-49 10,-52 13,-52 C9,-46 7,-40 6.4,-32 C5.6,-22 4.4,-13 3.4,-5 Z';
      return C(6, -30, 13, c.rg([[0, '#b8ff6a', 0.45], [0.5, FEL, 0.18], [1, FEL, 0]]), 0) +
        P(bd, c.lg(['#6a6478', '#3a3444', '#1e1a26'], 0, 0, 1, 0), 2) +
        S('M3.6,-7 C4.6,-16 5.8,-26 6.4,-33 C7.2,-41 9.4,-47 12.4,-51', OL, 3.6) + S('M3.6,-7 C4.6,-16 5.8,-26 6.4,-33 C7.2,-41 9.4,-47 12.4,-51', '#8aff3a', 1.8) + S('M4,-12 C4.8,-20 5.6,-28 6.2,-34', '#eaffc0', 0.7, 0.9) +
        S('M-1,-10 C-3,-20 -2,-30 3,-40', '#8a849a', 0.9, 0.7) +
        P('M-2.2,-3 L2.2,-3 L2.2,8.5 L-2.2,8.5 Z', '#2a1a22', 1.8) + S('M-2.2,0 L2.2,1.6 M-2.2,3.6 L2.2,5.2', '#6a2a3a', 0.9) +
        P('M-3,-4 C-7,-4 -10,-7 -11,-12 C-8,-9 -5,-8 -2,-8 Z M3,-4 C7,-4 10,-6 11.5,-10.5 C8.5,-8 5.5,-7.5 2,-8 Z', c.cel('#4a4056'), 1.6) +
        P('M-4,-6 L4,-6 L3,-2 L-3,-2 Z', c.cel('#5a4e66'), 1.4) +
        C(0, 10.5, 2.8, c.rg([[0, '#e8ffc0'], [0.45, FEL], [1, '#2a6a0a']], 0.35, 0.35, 0.7), 1.5);
    }
  };
  for (var gwk in GW) if (GW.hasOwnProperty(gwk)) WP[gwk] = GW[gwk];
  /* weapons used only by Kaldvik mobs */
  WP.taxe = function (c) {
    return P('M-1.9,10 L-1.9,-20 L1.9,-20 L1.9,10 Z', c.cel('#7a5a3a'), 1.8) + S('M-1.9,4 L1.9,5.5 M-1.9,7 L1.9,8.5', '#3a78c8', 1.2) +
      P('M1,-19 C5,-26 13,-27 16,-22 C16,-16 13,-10 9,-8 C7,-12 4,-13 1,-12 Z', c.lg(['#e8eef2', '#9aa4ae', '#5a646e'], 0, 0, 1, 0), 1.8) +
      P('M-1.5,-19 L-6,-17 L-1.5,-14 Z', '#8a949e', 1.4) + S('M-1.5,-12 C-5,-10 -6,-6 -5,-3', '#e8e0c8', 0.9) + P('M-6.5,-4 L-5,-1 L-3.5,-4 Z', '#e8f2fa', 1);
  };
  WP.bonespear = function (c) {
    return P('M-1.8,30 L-1.8,-40 L1.8,-40 L1.8,30 Z', c.cel('#7a5a3a'), 1.8) +
      P('M0,-60 C4,-54 5,-46 2.4,-40 L-2.4,-40 C-5,-46 -4,-54 0,-60 Z', c.lg(['#fbf6e8', '#e2d8c0', '#a89a7a'], 0, 0, 1, 0), 1.8) +
      S('M-2,-40 L2,-38 M-2,-37 L2,-35 M-2,-34 L2,-32', '#3a78c8', 1.3) + P('M2,-36 C6,-34 7,-30 5,-27 L3,-31 Z', c.cel('#e8f2fa'), 1.1);
  };
  /* bearkin shaman's staff (key fbstaff): a plain gnarled branch, forked at the top, a tuft of moss */
  WP.fbstaff = function (c) {
    var wd = '#7a5a38';
    return P('M-2.2,38 C-3,14 -1,-16 -2.6,-42 L2.6,-42 C1.8,-16 3.2,14 2.2,38 Z', c.lg([lt(wd, 0.25), wd, dk(wd, 0.4)], 0, 0, 1, 0), 2) +
      S('M-2,-41 C-7,-46 -8,-54 -5,-60 M2,-41 C6,-47 9,-52 8,-58', OL, 5) + S('M-2,-41 C-7,-46 -8,-54 -5,-60 M2,-41 C6,-47 9,-52 8,-58', wd, 2.6) +
      S('M-2,-20 C0,-22 1,-24 2,-27 M-1,6 C1,4 2,2 2,-2', dk(wd, 0.45), 1.1) + C(1.2, -10, 1.3, dk(wd, 0.45), 0) +
      P(blob(0, -42, 4.6, 2.6, 6, rnd(12), 0.5), c.cel('#6a9a3a'), 1.4) + C(-1.5, -43, 0.9, '#a8d060', 0);
  };
  WP.seerstaff = function (c) {
    var wd = '#6a4a30';
    return P('M-2.2,38 C-3,14 -1.2,-16 -2.8,-44 L2.8,-44 C2,-16 3.4,14 2.2,38 Z', c.lg([lt(wd, 0.25), wd, dk(wd, 0.4)], 0, 0, 1, 0), 2) +
      C(0, -52, 13, c.rg([[0, '#d8f4ff', 0.8], [0.45, '#7fc8f0', 0.35], [1, '#7fc8f0', 0]]), 0) +
      S('M-2,-40 C-8,-36 -9,-28 -8,-20 M2,-40 C8,-36 9,-30 9,-22', '#c9b890', 0.9) +
      G(P('M0,0 C3,-3 3.4,-9 0,-12 C-3.4,-9 -3,-3 0,0 Z', c.cel('#3a78c8'), 1.2), 'translate(-8,-18) rotate(175)') +
      G(P('M0,0 C3,-3 3.4,-9 0,-12 C-3.4,-9 -3,-3 0,0 Z', c.cel('#f0f4f8'), 1.2), 'translate(9,-20) rotate(185)') +
      P('M-6.5,-50 C-6.5,-59 6.5,-59 6.5,-50 C6.5,-46 4.5,-45 3.5,-43 L-3.5,-43 C-4.5,-45 -6.5,-46 -6.5,-50 Z', c.cel('#ece4cc'), 1.8) +
      E(-2.4, -50.5, 1.8, 2, '#10202e', 0) + E(2.4, -50.5, 1.8, 2, '#10202e', 0) + C(-2.4, -50.3, 0.8, '#9ae0ff', 0) + C(2.4, -50.3, 0.8, '#9ae0ff', 0) +
      S('M-2.2,-44.5 L-2.2,-43 M0,-44.5 L0,-43 M2.2,-44.5 L2.2,-43', OL, 0.8) +
      P('M-5,-57 C-8,-64 -6,-70 -2,-72 C-3,-66 -2,-61 -1,-58 Z', c.cel('#3a78c8'), 1.3) + P('M4,-57 C8,-63 8,-69 5,-72 C5,-66 3,-61 1,-58 Z', c.cel('#f0f4f8'), 1.3);
  };
  var GKIND = {
    cruel_barb: 'blade', thiefs_blade: 'blade', militia_sword: 'blade', buzzer_blade: 'dagger', militia_dagger: 'dagger',
    smites_hammer: 'big', cookies_tenderizer: 'hammer', militia_hammer: 'hammer',
    emberstone_staff: 'staff', cookies_rod: 'staff', militia_staff: 'staff',
    griknir_staff: 'staff', vagash_claw: 'dagger',
    oakenscowl_staff: 'staff', melenas_blade: 'blade'
  };
  /* angle of each class's default main-hand weapon; long pieces are pulled upright where the class angle would leave the frame */
  var WANG = { warrior: 30, paladin: 30, rogue: 72, priest: 18, mage: 4, warlock: 4, druid: 4 };
  function gearWeapon(o, key, cls) {
    var kind = GKIND[key];
    /* hunters keep the bow in the front hand; melee goes in the back hand (short pieces hang down, long ones stand upright behind the body) */
    if (cls === 'hunter') { o.bItem = kind === 'staff' || kind === 'big' ? BI(key, -8, kind === 'big' ? 0.8 : 0.85) : BI(key, 200, 0.8); return; }
    var a = WANG[cls] == null ? 30 : WANG[cls], s = 1;
    if (kind === 'big') { a = Math.min(a, 16); if (cls === 'rogue') s = 0.85; }
    else if (cls === 'rogue' && kind === 'blade') { a = 40; s = 0.85; }
    else if (cls === 'rogue' && kind === 'hammer') { a = 36; s = 0.9; }
    else if (cls === 'rogue' && key === 'buzzer_blade') s = 0.8;
    else if (kind === 'staff' && a > 30) a = 22;
    /* the satyr blade curves forward, so it is held a little more upright */
    if (key === 'melenas_blade') a -= 14;
    /* the quilboar pike is extra long: held nearly upright */
    if (key === 'snagglespear_pike' && a > 16) a = 16;
    o.fItem = FI(key, a, s);
  }

  /* ---- capes: drawn behind the body, flaring past both sides and below the waist ---- */
  function capeD(g, hem, seed) {
    var b = g.b, scx = g.scx, sx = g.sx, sy = g.sy, hy = g.hy, fy = g.fy;
    var A = [scx - b.shW - 2, sy + 6], H0 = [sx + b.waistW + 12, fy - 20], H1 = [sx - b.waistW - 20, fy - 11];
    var d = D`M${A[0]},${A[1]} Q${scx - b.shW},${sy - 5} ${scx - 3},${sy - 4} L${scx + b.shW - 3},${sy - 1} C${scx + b.shW + 6},${sy + 10} ${scx + b.shW + 8},${hy - 4} ${H0[0]},${H0[1]}`;
    var R_ = rnd(seed || 7), n = hem === 'fur' ? 11 : hem === 'rag' ? 7 : 5;
    for (var i = 0; i < n; i++) {
      var t0 = i / n, t1 = (i + 1) / n, tm = (t0 + t1) / 2;
      var p1 = [H0[0] + (H1[0] - H0[0]) * t1, H0[1] + (H1[1] - H0[1]) * t1 + Math.sin(Math.PI * t1) * 5];
      var pm = [H0[0] + (H1[0] - H0[0]) * tm, H0[1] + (H1[1] - H0[1]) * tm + Math.sin(Math.PI * tm) * 5];
      if (hem === 'rag') { pm[1] += 4 + R_() * 5; pm[0] += (R_() - 0.5) * 3; p1[1] -= 1 + R_() * 2; }
      else if (hem === 'fur') pm[1] += 3.2;
      else { pm[1] += i % 2 ? -2.5 : 1.5; }
      d += D` L${pm[0]},${pm[1]} L${p1[0]},${p1[1]}`;
    }
    return d + D` C${scx - b.shW - 16},${hy + 2} ${scx - b.shW - 8},${sy + 22} ${A[0]},${A[1]} Z`;
  }
  function capeFolds(g, col) {
    var b = g.b, sx = g.sx, fy = g.fy, hy = g.hy;
    return S(D`M${sx - b.waistW - 6},${hy - 8} Q${sx - b.waistW - 12},${hy + 12} ${sx - b.waistW - 15},${fy - 12} M${sx - b.waistW + 2},${hy + 4} L${sx - b.waistW - 3},${fy - 10}`, col, 1.4, 0.75);
  }
  function collarD(g, lift) {
    var x = g.scx, y = g.sy - (lift || 0);
    return D`M${x - 12},${y + 3} Q${x - 3},${y - 7} ${x + 12},${y - 1} L${x + 11},${y + 3.5} Q${x - 2},${y - 1.5} ${x - 11},${y + 7} Z`;
  }
  function drapeD(g) {
    var x = g.bSh[0] - 1, y = g.sy + 2, rx = g.b.shW * 0.5;
    return D`M${x - rx - 2.5},${y + 13} C${x - rx - 4},${y - 2} ${x - 3},${y - 8.5} ${x + rx * 0.7},${y - 6} L${x + rx + 1.5},${y - 1} Q${x + 1},${y - 2.5} ${x - rx + 1.5},${y + 13.5} Z`;
  }
  function drape(c, g, col, trim, extra) {
    var d = drapeD(g);
    return P(d, c.cel(col), 2) + CG((trim ? S(d, trim, 4.4) : '') + (extra ? extra(c, g) : ''), c.clip(d));
  }
  var GBACK = {
    cape_brotherhood: {
      back: function (c, g) {
        var d = capeD(g, 'rag', 11);
        return P(d, c.cel('#8e1a1e')) + CG(S(d, '#161214', 6) + capeFolds(g, '#5a0e12'), c.clip(d));
      },
      torso: function (c, g) {
        var d = collarD(g);
        return P(d, c.cel('#9a1c20'), 1.8) + CG(S(D`M${g.scx - 11},${g.sy + 6} Q${g.scx - 2},${g.sy - 2} ${g.scx + 11},${g.sy + 2.8}`, '#161214', 2.2), c.clip(d));
      },
      front: function (c, g) { return drape(c, g, '#8e1a1e', '#161214'); }
    },
    garrick_cloak: {
      back: function (c, g) {
        var d = capeD(g, 'tatter', 5), col = '#6e6254';
        return P(d, c.cel(col)) + CG(capeFolds(g, dk(col, 0.35)) + S(d, dk(col, 0.3), 3.5), c.clip(d));
      },
      torso: function (c, g) {
        var x = g.scx, y = g.sy, col = '#74685a';
        /* hood down: a heavy bunched fold lying on the upper back, behind the head */
        var hd = D`M${x + 1},${y - 2} C${x - 4},${y - 12} ${x - 20},${y - 13} ${x - 24},${y - 3} C${x - 26},${y + 5} ${x - 20},${y + 12} ${x - 12},${y + 10} C${x - 6},${y + 8} ${x},${y + 5} ${x + 1},${y - 2} Z`;
        return P(hd, c.cel(col), 2.2) +
          P(D`M${x - 4},${y - 3} C${x - 8},${y - 8} ${x - 17},${y - 8} ${x - 19},${y - 2} C${x - 17},${y + 3} ${x - 10},${y + 3} ${x - 4},${y - 3} Z`, dk(col, 0.45), 1.4) +
          P(collarD(g), c.cel(col), 1.8);
      },
      front: function (c, g) { return drape(c, g, '#6e6254', dk('#6e6254', 0.3)); }
    },
    gnollhide_cloak: {
      back: function (c, g) {
        var d = capeD(g, 'fur', 3), R_ = rnd(29), sp = '';
        for (var i = 0; i < 16; i++) sp += E(g.sx - 36 + R_() * 60, g.sy - 2 + R_() * 72, 2 + R_() * 2.2, 1.6 + R_() * 1.6, '#6a4424', 0, 0.85, R_() * 180);
        return P(d, c.cel('#c29a60')) + CG(sp + capeFolds(g, '#7a5a34'), c.clip(d));
      },
      torso: function (c, g) {
        var x = g.scx, y = g.sy;
        var d = D`M${x - 13},${y + 3} Q${x - 3},${y - 8} ${x + 13},${y - 1} L${x + 12},${y + 3} L${x + 9},${y + 5.5} L${x + 6},${y + 3} L${x + 3},${y + 6} L${x},${y + 2.5} L${x - 3},${y + 6.5} L${x - 6},${y + 3.5} L${x - 9},${y + 8} L${x - 11},${y + 5} Z`;
        return P(d, c.cel('#c29a60'), 1.8) + C(x - 6, y + 0.5, 1.5, '#6a4424', 0, 0.85) + C(x + 5, y - 0.5, 1.3, '#6a4424', 0, 0.85);
      },
      front: function (c, g) {
        /* spotted pelt over the far shoulder + tiny gnoll skull clasp at the collar, muzzle forward */
        var x = g.scx + 3, y = g.sy + 5, bone = '#efe6cc';
        return drape(c, g, '#c29a60', null, function (c, g) { var bx = g.bSh[0]; return C(bx - 5, g.sy + 1, 1.8, '#6a4424', 0, 0.85) + C(bx + 1, g.sy - 2, 1.5, '#6a4424', 0, 0.85) + C(bx - 7, g.sy + 8, 1.6, '#6a4424', 0, 0.85); }) +
          P(D`M${x - 4},${y + 1} C${x - 4.5},${y - 4.5} ${x + 1.5},${y - 5} ${x + 2.5},${y - 2} L${x + 6.5},${y - 0.8} C${x + 7.5},${y + 0.5} ${x + 6.5},${y + 2.2} ${x + 5.5},${y + 2.2} L${x + 1},${y + 3.4} C${x - 1.5},${y + 4.5} ${x - 3.8},${y + 3.5} ${x - 4},${y + 1} Z`, c.cel(bone), 1.3) +
          C(x + 0.6, y - 0.8, 1.2, '#2a1a10', 0) + C(x + 6.4, y + 0.2, 0.7, '#2a1a10', 0) +
          S(D`M${x + 2},${y + 2.6} l0.4,1.4 M${x + 3.8},${y + 2.2} l0.4,1.4`, '#2a1a10', 0.7) +
          P(D`M${x - 3},${y - 3} L${x - 4.5},${y - 6.5} L${x - 1},${y - 4.2} Z`, bone, 1);
      }
    },
    /* Old Rimehide's pelt: white shaggy wendigo fur, frosted blue in the folds */
    icebeard_cloak: {
      back: function (c, g) {
        var d = capeD(g, 'fur', 17), R_ = rnd(43), t = '', i;
        for (i = 0; i < 22; i++) {
          var x = g.sx - 38 + R_() * 64, y = g.sy + R_() * 70, l = 4 + R_() * 4;
          t += D`M${x},${y} q${-1.5 + R_() * 3},${l * 0.6} ${-0.5 + R_() * 1},${l}`;
        }
        return P(d, c.cel('#eef3f6')) + CG(S(t, '#9fb6ca', 1.2, 0.8) + capeFolds(g, '#8aa4bc') + S(d, '#c8dcea', 3, 0.8), c.clip(d));
      },
      torso: function (c, g) {
        var x = g.scx, y = g.sy, d = D`M${x - 14},${y + 3}`, i;
        var pts = [[-11, 8], [-8, 4], [-5, 9], [-2, 4.5], [1, 8.5], [4, 4], [7, 7.5], [10, 3], [13, 5]];
        pts.forEach(function (p) { d += D` L${x + p[0]},${y + p[1]}`; });
        d += D` L${x + 14},${y - 1} Q${x - 2},${y - 10} ${x - 14},${y + 3} Z`;
        return P(d, c.cel('#f2f6f8'), 1.8) + S(D`M${x - 7},${y} l1,4 M${x + 1},${y - 2} l0.5,4 M${x + 8},${y - 1} l-0.5,4`, '#9fb6ca', 1, 0.8);
      },
      front: function (c, g) {
        return drape(c, g, '#eef3f6', '#c8dcea', function (c, g) { var bx = g.bSh[0]; return S(D`M${bx - 6},${g.sy} l1,4 M${bx},${g.sy - 3} l0.5,4 M${bx - 3},${g.sy + 6} l-0.5,4`, '#9fb6ca', 1.1, 0.85); });
      }
    },
    /* Skitterfang' shroud: grey-white spider silk with a faint web and wispy torn strands */
    githyiss_shroud: {
      back: function (c, g) {
        var d = capeD(g, 'rag', 23), col = '#dcdce4', cx = g.scx - 6, cy = g.sy + 2, w = '', i, k;
        for (i = 0; i < 7; i++) { var a = Math.PI * (0.35 + i * 0.13); w += D`M${cx},${cy} L${cx + Math.cos(a) * 90},${cy + Math.sin(a) * 90} `; }
        for (k = 1; k < 6; k++) {
          var rr = k * 13;
          for (i = 0; i < 6; i++) {
            var a0 = Math.PI * (0.35 + i * 0.13), a1 = a0 + Math.PI * 0.13, am = (a0 + a1) / 2;
            w += D`M${cx + Math.cos(a0) * rr},${cy + Math.sin(a0) * rr} Q${cx + Math.cos(am) * rr * 0.86},${cy + Math.sin(am) * rr * 0.86} ${cx + Math.cos(a1) * rr},${cy + Math.sin(a1) * rr} `;
          }
        }
        return S(D`M${g.sx - 18},${g.fy - 12} l-3,9 M${g.sx - 8},${g.fy - 14} l-1,10 M${g.sx - 28},${g.fy - 14} l-4,7`, '#e8e8ee', 1, 0.8) +
          P(d, c.cel(col)) + CG(S(w, '#f8f8fc', 0.9, 0.75) + S(w, '#8a8a98', 0.5, 0.35) + capeFolds(g, '#9a9aa8'), c.clip(d));
      },
      torso: function (c, g) {
        var d = collarD(g, 1);
        return P(d, c.cel('#e6e6ec'), 1.8) + CG(S(D`M${g.scx - 10},${g.sy + 5} Q${g.scx - 2},${g.sy - 1} ${g.scx + 10},${g.sy + 2}`, '#9a9aa8', 1, 0.8), c.clip(d));
      },
      front: function (c, g) {
        return drape(c, g, '#dcdce4', '#f2f2f6', function (c, g) { var bx = g.bSh[0], by = g.sy; return S(D`M${bx - 8},${by - 2} L${bx + 2},${by + 10} M${bx - 2},${by - 4} L${bx - 6},${by + 12} M${bx - 8},${by + 5} Q${bx - 3},${by + 3} ${bx + 1},${by + 6}`, '#9a9aa8', 0.8, 0.7); }) +
          C(g.scx + 8, g.sy + 1, 2.4, c.rg([[0, '#f4e8ff'], [1, '#8a5ab8']], 0.4, 0.35, 0.7), 1.3);
      }
    }
  };

  /* ---- chest ---- */
  function stitchLine(x0, y0, x1, y1, step) {
    var d = '', dx = x1 - x0, dy = y1 - y0, L = Math.sqrt(dx * dx + dy * dy) || 1, n = Math.floor(L / step);
    for (var i = 0; i <= n; i++) { var t = i / Math.max(1, n), x = x0 + dx * t, y = y0 + dy * t; d += D`M${x - 1.3},${y - 0.6} L${x + 1.3},${y + 0.6}`; }
    return d;
  }
  var GCHEST = {
    defias_armor: function (o) {
      o.torsoC = '#2c2527'; o.sleeve = '#352c2e';
      o.belt = '#5d6166'; o.buckle = null;
      o.torsoFx = function (c, g) {
        var x = g.scx, y = g.sy, hy = g.hy;
        return CG(S(D`M${x + 7},${y - 2} L${g.sx + 6},${hy} M${x - 7},${y + 1} L${g.sx - 8},${hy}`, '#1a1416', 1.4) +
          S(stitchLine(x + 9, y + 1, g.sx + 8, hy - 7, 3.4) + stitchLine(x - 9, y + 4, g.sx - 10, hy - 7, 3.4), '#a8acb0', 1) +
          P(D`M${x - 6},${y - 3} L${x + 3},${y + 11} L${x + 12},${y - 1}`, 'none', 1.8), c.clip(g.torsoD)) +
          S(D`M${x - 5},${y - 1.5} L${x + 3},${y + 9.5} L${x + 11},${y}`, '#a8acb0', 1.2);
      };
      o.gTorso = function (c, g) {
        /* sash knot and hanging tails at the front hip */
        var x = g.sx + 6, y = g.hy - 3;
        return P(D`M${x - 1},${y + 1} L${x - 4},${y + 15} L${x + 0.5},${y + 13.5} L${x + 2},${y + 2} Z`, c.cel('#5f6368'), 1.6) +
          P(D`M${x + 1},${y + 1} L${x + 6},${y + 13} L${x + 8},${y + 9.5} L${x + 3},${y} Z`, c.cel('#6b6f74'), 1.6) +
          C(x + 1, y + 0.5, 2.8, c.cel('#767a7f'), 1.6);
      };
    },
    corsair_shirt: function (o) {
      o.torsoC = '#efe8dc'; o.sleeve = '#e8e0d2';
      o.torsoFx = function (c, g) {
        var d = '';
        var b = g.b, vc = c.cel('#1e1a1c');
        for (var y = g.sy + 1; y < g.hy + 2; y += 6.4) d += D`M${g.scx - 30},${y} L${g.scx + 30},${y}`;
        return CG(S(d, '#c0282e', 3.6) +
          P(D`M${g.scx - b.shW - 3},${g.sy - 4} L${g.scx - 5},${g.sy - 4} L${g.sx - 7},${g.hy + 2} L${g.sx - b.waistW - 3},${g.hy + 2} Z`, vc, 2) +
          P(D`M${g.scx + 13},${g.sy - 4} L${g.scx + b.shW + 5},${g.sy - 4} L${g.sx + b.waistW + 5},${g.hy + 2} L${g.sx + 10},${g.hy + 2} Z`, vc, 2), c.clip(g.torsoD));
      };
      o.gTorso = function (c, g) {
        /* red stripes carried onto the collar opening */
        return S(D`M${g.scx - 1},${g.sy - 1} L${g.scx + 4},${g.sy + 5} L${g.scx + 9},${g.sy - 1}`, '#c0282e', 1.6);
      };
    }
  };

  /* ---- legs: overlays drawn along each leg polyline (front=1 for the near leg) ---- */
  function lptA(A, B, d, v) {
    var dx = B[0] - A[0], dy = B[1] - A[1], L = Math.sqrt(dx * dx + dy * dy) || 1;
    return [A[0] + dx / L * d - dy / L * v, A[1] + dy / L * d + dx / L * v];
  }
  function lpt(A, B, u, v) { var dx = B[0] - A[0], dy = B[1] - A[1]; return lptA(A, B, u * Math.sqrt(dx * dx + dy * dy), v); }
  function quadOn(A, B, d0, d1, v0, v1) { return pl([lptA(A, B, d0, v0), lptA(A, B, d1, v0), lptA(A, B, d1, v1), lptA(A, B, d0, v1)]) + 'Z'; }
  var GLEGS = {
    smelting_pants: {
      pants: '#3a3a42',
      fx: function (c, g, L, front) {
        var w = g.b.legW, segs = [[L[0], L[1]], [L[1], L[2]]], mail = '', cr = '';
        segs.forEach(function (s, si) {
          [0.3, 0.55, 0.8].forEach(function (u) {
            var a = lpt(s[0], s[1], u, -w * 0.38), m = lpt(s[0], s[1], u + 0.06, 0), b = lpt(s[0], s[1], u, w * 0.38);
            mail += D`M${a[0]},${a[1]} Q${m[0]},${m[1]} ${b[0]},${b[1]}`;
          });
          var pts = si === 0 ? [[0.12, -0.05], [0.32, 0.2], [0.5, -0.12], [0.7, 0.18], [0.92, -0.02]] : [[0.08, 0.12], [0.3, -0.16], [0.52, 0.12], [0.72, -0.14]];
          cr += pl(pts.map(function (p) { return lpt(s[0], s[1], p[0], p[1] * w); }));
        });
        return S(mail, '#1c1c22', 0.9, 0.8) + S(cr, '#ff5a00', 3.4, front ? 0.45 : 0.3) + S(cr, front ? '#ffa62a' : '#d0761a', 1.6) + S(cr, '#fff0a0', 0.6, front ? 1 : 0.6);
      }
    },
    defias_leggings: {
      pants: '#2a2426',
      fx: function (c, g, L, front) {
        var w = g.b.legW / 2 + 1.2, red = front ? DRED : dk(DRED, 0.2);
        var k = lptA(L[1], L[2], -1, -w + 0.6);
        return S(pl([lpt(L[0], L[1], 0.15, -g.b.legW * 0.18), lpt(L[0], L[1], 0.85, -g.b.legW * 0.18)]), red, 0.9, 0.7) +
          P(quadOn(L[1], L[2], -2.4, 1.6, -w, w), c.cel(red), 1.4) +
          P(quadOn(L[1], L[2], 5.5, 8.5, -w, w), c.cel(red), 1.3) +
          (front ? R(k[0] - 1.6, k[1] - 1.6, 3.2, 3.2, '#c9ced6', 1) : '');
      }
    },
    pumpkin_trousers: {
      pants: '#d8761c',
      fx: function (c, g, L, front) {
        var w = g.b.legW;
        if (front) {
          var ctr = [L[0], L[1]];
          return P(quadOn(ctr[0], ctr[1], 7, 14.5, -w * 0.42, w * 0.25), c.cel('#5a9a2a'), 1.3) +
            S(stitchLine.apply(null, lptA(ctr[0], ctr[1], 7.8, -w * 0.42).concat(lptA(ctr[0], ctr[1], 13.8, -w * 0.42), [2.4])), '#2a3a14', 0.8) +
            P(quadOn(L[1], L[2], 3, 8, -w * 0.3, w * 0.36), c.cel('#b0561a'), 1.2) +
            S(pl([lpt(L[1], L[2], 0.55, -w * 0.2), lpt(L[1], L[2], 0.9, -w * 0.2)]), '#8a4210', 0.9, 0.8);
        }
        return P(quadOn(L[1], L[2], 2, 7, -w * 0.35, w * 0.3), c.cel('#8a5a2a'), 1.2);
      }
    }
  };
  function gearMaskKnot(c, X, Y, r, col) {
    return P(D`M${X - r * 0.22},${Y + r * 0.52} L${X - r * 0.86},${Y + r * 0.36} L${X - r * 0.92},${Y + r * 0.68} L${X - r * 0.32},${Y + r * 0.9} Z`, c.cel(col), 1.4) +
      P(D`M${X - r * 0.9},${Y + r * 0.5} L${X - r * 1.7},${Y + r * 0.95} L${X - r * 1.4},${Y + r * 1.25} Z`, dk(col, 0.12), 1.5) +
      P(D`M${X - r * 0.9},${Y + r * 0.58} L${X - r * 1.3},${Y + r * 1.6} L${X - r * 0.98},${Y + r * 1.55} Z`, dk(col, 0.22), 1.5) +
      C(X - r * 0.9, Y + r * 0.52, r * 0.2, c.cel(col), 1.4);
  }
  var GMASK = { defias: '#8a8e93' };
  /* ---- v18 looks: Dunescar / Scrublands drops ---- */
  var GW18 = {
    /* Mokku the Hexer's hex staff: gnarled crook, shrunken-head fetish on a cord, red and teal feathers */
    zalazane_staff: function (c) {
      var wd = '#5a3e26', fe = 'M0,0 C3.4,-3 4,-11 0,-16 C-4,-11 -3.4,-3 0,0 Z';
      return C(-1, -62, 12, c.rg([[0, '#d8ffb0', 0.6], [0.5, '#9a6ad8', 0.25], [1, '#9a6ad8', 0]]), 0) +
        P('M-2.4,38 C-3.2,20 -1.6,0 -3,-20 C-3.6,-34 -2,-44 -3,-50 L3,-50 C2.6,-42 3.8,-30 3,-18 C2.2,0 3.4,20 2.4,38 Z', c.lg([lt(wd, 0.25), wd, dk(wd, 0.4)], 0, 0, 1, 0), 2) +
        S('M-3,-25 L3,-22 M-3,-20 L3,-17', '#b83a2a', 1.5) + S('M-2.6,-8 L2.6,-6', '#2aa0a0', 1.4) +
        P('M-3,-50 C-9,-54 -10.5,-62 -6.5,-69 C-5.5,-63 -3.5,-58.5 0,-56.5 C3,-60 5,-64.5 4,-71 C9.5,-66 9.5,-56 3,-50 Z', c.cel(wd), 2) +
        G(P(fe, c.cel('#c83a2a'), 1.3) + S('M0,-1 L0,-13', '#6a1a10', 0.8), 'translate(7,-55) rotate(165)') +
        G(P(fe, c.cel('#2aa6a0'), 1.3) + S('M0,-1 L0,-13', '#0e4a48', 0.8), 'translate(9,-57) rotate(140) scale(0.85)') +
        S('M-5,-57 L-9.5,-46', OL, 1.3) +
        G(P('M-4.2,0 C-4.8,-5.4 4.8,-5.4 4.2,0 C4.2,4 2.2,6 0,6 C-2.2,6 -4.2,4 -4.2,0 Z', c.cel('#8a6a48'), 1.5) +
          P('M-4,-2.6 C-3,-7 3,-7.5 4.2,-2.4 C2,-4 -1.5,-4.4 -4,-2.6 Z', c.cel('#1e1614'), 1.2) +
          S('M-2.6,-0.4 L-1,0.6 M-2.6,0.6 L-1,-0.4 M1,-0.4 L2.6,0.6 M1,0.6 L2.6,-0.4', OL, 0.8) +
          S('M-1.8,3.4 L1.8,3.4 M-1,2.6 L-1,4.2 M0.2,2.6 L0.2,4.2 M1.2,2.6 L1.2,4.2', OL, 0.6), 'translate(-10.5,-40)') +
        C(-1.5, -63, 2.2, c.rg([[0, '#ffffff'], [0.5, '#d8ffb0'], [1, '#6ac03a']], 0.4, 0.35, 0.7), 1.2);
    },
    /* Benedict's naval cutlass: curved steel, gold shell guard with a D-bar, ruby pommel */
    benedict_cutlass: function (c) {
      return P('M-3.2,-5 C-4.8,-20 -2.8,-34 7,-47.5 C10.2,-37 7.2,-20 3.8,-5 Z', c.lg(STEEL, 0, 0, 1, 0), 2) +
        S('M-0.6,-9 C-1,-22 1,-33 5.6,-41.5', '#8e99a5', 1.1) + S('M-2.6,-8 C-3.6,-18 -2.4,-28 2,-37', '#ffffff', 0.8, 0.7) +
        P('M-2.3,-2 L2.3,-2 L2.3,9.5 L-2.3,9.5 Z', '#2a1a12', 1.8) + S('M-2.3,1 L2.3,2.6 M-2.3,4.4 L2.3,6 M-2.3,7.4 L2.3,9', GOLD, 1) +
        P('M-4.6,-6 C-13,-4 -12.5,9 -3.5,12 L-2.6,9.4 C-8.6,7.4 -8.6,-1 -3,-2.6 Z', c.cel(GOLD), 1.6) +
        P('M-8.2,-8 C-8.2,-2 -3,-1.5 0,-2.4 C3,-1.5 8.2,-2 8.2,-8 C4,-5.2 -4,-5.2 -8.2,-8 Z', c.cel(GOLD), 1.7) +
        S('M-5.6,-5.6 L-4.4,-3.2 M-2.6,-4.6 L-2,-2.6 M2.6,-4.6 L2,-2.6 M5.6,-5.6 L4.4,-3.2', '#8a6420', 0.8) +
        C(0, 11.5, 2.7, c.rg([[0, '#ffb0b0'], [0.5, '#c8202a'], [1, '#5a0a10']], 0.4, 0.35, 0.7), 1.6);
    },
    /* cursed felblade: black jagged blade, glowing fel runework (marks only, no letters) */
    cursed_felblade: function (c) {
      var bd = 'M-4,-5 L-4.4,-36 L-6.8,-40 L-1.6,-44.5 L0,-55 L1.8,-44.5 L6.8,-40 L4.4,-36 L4,-5 Z';
      var ru = 'M-1.6,-12 L0,-14.6 L1.6,-12 M-1.6,-21 L0,-23.6 L1.6,-21 M-1.6,-30 L0,-32.6 L1.6,-30';
      return C(0, -28, 16, c.rg([[0, '#c8ff8a', 0.45], [0.5, FEL, 0.18], [1, FEL, 0]]), 0) +
        P(bd, c.lg(['#4c4854', '#24202a', '#0e0c12'], 0, 0, 1, 0), 2) +
        CG(F('M-1,-8 L1,-8 L1,-44 L-1,-44 Z', '#3a8a1a', 0.5), c.clip(bd)) +
        S(ru, '#0a1a04', 3) + S(ru, '#9aff4a', 1.3) + C(0, -17, 0.9, '#d8ffb0', 0) + C(0, -26, 0.9, '#d8ffb0', 0) + C(0, -35.5, 0.9, '#d8ffb0', 0) +
        P('M-12.5,-12 L-4,-6 L4,-6 L12.5,-12 L9.5,-2.8 L-9.5,-2.8 Z', c.cel('#2e2a34'), 2) +
        C(0, -4.6, 2.3, c.rg([[0, '#f0ffd0'], [0.45, FEL], [1, '#2a6a0a']], 0.35, 0.35, 0.7), 1.3) +
        P('M-2.3,-2.8 L2.3,-2.8 L2.3,9 L-2.3,9 Z', '#1a1418', 1.8) + S('M-2.3,0 L2.3,1.6 M-2.3,3.6 L2.3,5.2 M-2.3,7 L2.3,8.4', '#3a8a1a', 0.9) +
        P('M-3.2,9 L0,15.5 L3.2,9 Z', c.cel('#2e2a34'), 1.6);
    }
  };
  for (var gw18 in GW18) if (GW18.hasOwnProperty(gw18)) { GW[gw18] = GW18[gw18]; WP[gw18] = GW18[gw18]; }
  GKIND.zalazane_staff = 'staff'; GKIND.benedict_cutlass = 'blade'; GKIND.cursed_felblade = 'blade';
  /* black flame tongues rising from the cape hem (same hem line as capeD) */
  function hemFlames(g, seed, n, h0, h1) {
    var b = g.b, H0 = [g.sx + b.waistW + 12, g.fy - 20], H1 = [g.sx - b.waistW - 20, g.fy - 11], R_ = rnd(seed), i;
    function at(t, lift) { return [H0[0] + (H1[0] - H0[0]) * t, H0[1] + (H1[1] - H0[1]) * t + Math.sin(Math.PI * t) * 5 - (lift || 0)]; }
    var top = '', p0 = at(0, 2), d = D`M${H0[0] + 8},${H0[1] + 14} L${p0[0] + 6},${p0[1]}`;
    top = D`M${p0[0] + 6},${p0[1]}`;
    for (i = 0; i < n; i++) {
      var t0 = i / n, t1 = (i + 1) / n, tm = t0 + 0.55 / n, hh = h0 + R_() * (h1 - h0);
      var B = at(t1, 2), T = at(tm, hh), C1 = at(t0 + 0.15 / n, hh * 0.45), C2 = at(tm + 0.2 / n, hh * 0.35);
      var seg = D` Q${C1[0] + 2},${C1[1]} ${T[0] - 1.5},${T[1]} Q${C2[0]},${C2[1]} ${B[0]},${B[1]}`;
      d += seg; top += seg;
    }
    d += D` L${H1[0] - 8},${H1[1] + 14} Z`;
    return { fill: d, edge: top };
  }
  GBACK.burning_blade_cloak = {
    back: function (c, g) {
      var d = capeD(g, 'tatter', 31), col = '#6e1214', fl = hemFlames(g, 71, 7, 9, 17);
      return P(d, c.cel(col)) + CG(capeFolds(g, '#3e080a') + S(fl.edge, '#ff6a1a', 3.2, 0.55) + F(fl.fill, '#120a0a') + S(fl.edge, '#e0401a', 1, 0.8), c.clip(d)) + P(d, 'none');
    },
    torso: function (c, g) {
      var d = collarD(g);
      return P(d, c.cel('#7a1416'), 1.8) + CG(S(D`M${g.scx - 11},${g.sy + 6} Q${g.scx - 2},${g.sy - 2} ${g.scx + 11},${g.sy + 2.8}`, '#120a0a', 2.4), c.clip(d));
    },
    front: function (c, g) {
      return drape(c, g, '#6e1214', '#120a0a', function (c, g) { var bx = g.bSh[0], by = g.sy; return F(D`M${bx - 10},${by + 16} L${bx - 7},${by + 8} L${bx - 5},${by + 12} L${bx - 2},${by + 6} L${bx},${by + 11} L${bx + 3},${by + 7} L${bx + 4},${by + 16} Z`, '#120a0a'); });
    }
  };
  GBACK.subterranean_cape = {
    back: function (c, g) {
      var d = capeD(g, 'rag', 37), col = '#4a3222', R_ = rnd(83), m = '', em = '', i;
      for (i = 0; i < 9; i++) m += F(blob(g.sx - 34 + R_() * 56, g.sy + R_() * 66, 4 + R_() * 4, 3 + R_() * 3, 6, R_, 0.4), i % 2 ? '#5c4230' : '#36241a', 0.6);
      for (i = 0; i < 13; i++) {
        var x = g.sx - 36 + R_() * 60, y = g.sy + 4 + R_() * 66, s = 0.8 + R_() * 0.9;
        em += C(x, y, 3.2 * s, c.rg([[0, '#ffe8a0', 0.9], [0.35, '#ff8a1e', 0.55], [1, '#ff5a00', 0]]), 0) + C(x, y, 0.9 * s, '#fff4c8', 0);
      }
      return P(d, c.cel(col)) + CG(m + capeFolds(g, '#24160e') + S(d, '#2a1a10', 3.5) + em, c.clip(d));
    },
    torso: function (c, g) {
      var d = collarD(g, 1);
      return P(d, c.cel('#4e3624'), 1.8) + C(g.scx - 4, g.sy + 1, 1, '#ffb040', 0) + C(g.scx + 5, g.sy - 1, 0.9, '#ffb040', 0);
    },
    front: function (c, g) {
      return drape(c, g, '#4a3222', '#2a1a10', function (c, g) {
        var bx = g.bSh[0], by = g.sy, s = '';
        [[-6, 2], [-1, 8], [-8, 9], [2, 0]].forEach(function (p) { s += C(bx + p[0], by + p[1], 2.6, c.rg([[0, '#ffe8a0', 0.9], [0.4, '#ff8a1e', 0.5], [1, '#ff5a00', 0]]), 0) + C(bx + p[0], by + p[1], 0.8, '#fff4c8', 0); });
        return s;
      });
    }
  };
  /* ---- v19 looks: Greensward / Pallmoor drops ---- */
  var GW19 = {
    /* Snaggletooth's war pike: crooked spinehide shaft, a huge curved boar tusk lashed on as the blade, bristle tuft */
    snagglespear_pike: function (c) {
      var wd = '#6a4a2a', tk = 'M-3.2,-44 C-5,-54 -2,-66 7,-76 C6.5,-66 5,-56 3.2,-44 Z';
      return P('M-2.4,38 C-3.4,22 -1.4,6 -2.8,-10 C-3.6,-24 -2,-34 -3,-44 L3,-44 C2.6,-34 3.8,-22 3,-8 C2.2,6 3.4,22 2.4,38 Z', c.lg([lt(wd, 0.25), wd, dk(wd, 0.4)], 0, 0, 1, 0), 2) +
        S('M-2.6,-4 L2.6,-2 M-2.6,0 L2.6,2 M-2.6,4 L2.6,6', '#3a2412', 1.2) +
        P(qfan(-38.5, 9, 7), c.cel('#7a3a1e'), 1.6) +
        P(tk, c.lg(['#fbf4dc', '#e2d2a4', '#a8905e'], 0, 1, 0.6, 0), 2) +
        CG(S('M-1.4,-48 C-2.4,-58 0,-66 5,-72', '#ffffff', 1.1, 0.7) + S('M-3,-50 L3.4,-50.5 M-3.2,-54 L2.8,-55', '#b8a070', 0.8, 0.7), c.clip(tk)) +
        P('M-4,-45.5 L4,-45.5 L3.6,-38 L-3.6,-38 Z', c.cel('#c8a870'), 1.6) + S('M-3.8,-43 L3.8,-42 M-3.8,-40.5 L3.8,-39.5', '#6a4a28', 0.9) +
        S('M3.4,-40 C8,-36 9,-30 8,-24', OL, 2.2) + S('M3.4,-40 C8,-36 9,-30 8,-24', '#c8a870', 1) + C(8, -23, 2, c.cel('#e8dcc0'), 1.1) + C(8.3, -19.4, 1.6, c.cel('#b8342a'), 1);
    },
    /* Great Mother Dustback's totem: heavy carved dustback-bone club, a horned skull-like head with carved rings and painted bands */
    arrachea_totem: function (c) {
      var bn = '#e4d8b8', hd = 'M-8.5,-24 C-12.5,-30 -13,-44 -10,-52 C-6,-58 6,-58 10,-52 C13,-44 12.5,-30 8.5,-24 C6,-20 3,-18 0,-18 C-3,-18 -6,-20 -8.5,-24 Z';
      var hornL = 'M-9,-49 C-15,-50 -20,-55 -19,-64 C-17,-59 -14,-57 -9.5,-56 Z', hornR = 'M9,-49 C15,-50 20,-55 19,-64 C17,-59 14,-57 9.5,-56 Z';
      return P('M-2.8,16 L-3.2,-22 L3.2,-22 L2.8,16 Z', c.lg([lt(bn, 0.2), bn, dk(bn, 0.35)], 0, 0, 1, 0), 2) +
        S('M-3,-16 L3,-14 M-3,-12 L3,-10', dk(bn, 0.45), 1) +
        P('M-3.6,-6 L3.6,-6 L3.6,11 L-3.6,11 Z', c.cel('#5a3a22'), 1.8) + S('M-3.6,-3 L3.6,-1 M-3.6,1 L3.6,3 M-3.6,5 L3.6,7 M-3.6,9 L3.6,11', '#2e1c10', 1) +
        C(0, 17.5, 3.4, c.cel(bn), 1.6) +
        P(hornL + ' ' + hornR, c.lg(['#f4ecd8', '#b8aa88', '#6e624a'], 0, 0, 1, 1), 1.8) +
        P(hd, c.lg([lt(bn, 0.3), bn, dk(bn, 0.4)], 0.2, 0, 0.8, 1), 2.4) +
        CG(S('M-12,-47 Q0,-44 12,-47', dk(bn, 0.45), 1.2) + F('M-13,-50 L13,-50 L13,-47.6 L-13,-47.6 Z', '#2f6fb0', 0.85) +
          F('M-12,-28 C-6,-24 6,-24 12,-28 L12,-14 L-12,-14 Z', dk(bn, 0.25), 0.6) + S('M-6,-29 L-5,-24 M-2,-28 L-2,-23 M2,-28 L2,-23 M6,-29 L5,-24', dk(bn, 0.55), 1), c.clip(hd)) +
        P('M-7.5,-41 C-7.5,-45 -2.5,-45 -2,-41 C-2,-38 -6,-36.5 -7.5,-41 Z M7.5,-41 C7.5,-45 2.5,-45 2,-41 C2,-38 6,-36.5 7.5,-41 Z', '#2a1a10', 1) +
        C(-4.6, -41.4, 0.9, '#b8342a', 0) + C(4.6, -41.4, 0.9, '#b8342a', 0) +
        P('M-1.6,-35 L0,-38 L1.6,-35 L0,-32.5 Z', '#3a2616', 0.8) +
        S('M9,-34 C14,-30 15,-24 14,-18', OL, 2.2) + S('M9,-34 C14,-30 15,-24 14,-18', '#c8a870', 1) +
        G(P('M0,0 C3,-3 3.6,-9 0,-13 C-3.6,-9 -3,-3 0,0 Z', c.cel('#f0ece2'), 1.2) + S('M0,-1 L0,-11', '#8a7a60', 0.7), 'translate(14,-18) rotate(185)') +
        G(P('M0,0 C3,-3 3.6,-9 0,-13 C-3.6,-9 -3,-3 0,0 Z', c.cel('#b8342a'), 1.2), 'translate(16,-20) rotate(160) scale(0.8)');
    },
    /* Grubgut's axe: a crude, notched, rusty gnoll cleaver on a bound wooden haft */
    maggot_eye_axe: function (c) {
      var bl = 'M1.5,-40 L15.5,-45 C19,-38 20,-31 18.8,-27 L20,-22 L17.8,-17 L19,-12 L1.5,-13 Z';
      return P('M-2.4,12 C-3,-4 -2,-22 -2.8,-40 L2.8,-40 C2.2,-22 3,-4 2.4,12 Z', c.lg(['#8a6a44', '#5e4428', '#3a2814'], 0, 0, 1, 0), 2) +
        S('M-2.6,-3 L2.6,-1 M-2.6,1 L2.6,3 M-2.6,5 L2.6,7', '#2a1a0c', 1.1) +
        P(bl, c.lg(['#b87a44', '#8a4e26', '#4a2612'], 0, 0, 1, 1), 2.2) +
        CG(S('M16.5,-43 C19,-37 20,-31 18.5,-27 L19.6,-22 L17.4,-17 L18.6,-12', '#c8c0b0', 2.6, 0.75) +
          F(blob(9, -33, 3, 2.3, 5, rnd(911), 0.6), '#5a2a10', 0.8) + F(blob(14, -21, 2.4, 1.9, 5, rnd(912), 0.6), '#5a2a10', 0.7) + F(blob(7, -20, 1.8, 1.4, 5, rnd(913), 0.6), '#c88a4a', 0.6), c.clip(bl)) +
        C(4.4, -36, 1.2, c.cel('#6e6a64'), 0.8) + C(4.4, -17, 1.2, c.cel('#6e6a64'), 0.8) +
        P('M-2,-38 L-8,-34 L-2,-31 Z', c.cel('#6e6a64'), 1.4) +
        S('M-2.8,-15 L2.8,-13 M-2.8,-12 L2.8,-10 M-2.8,-37 L2.8,-35', '#c8a870', 1.2) +
        S('M-2.6,-11 C-7,-7 -8,-2 -7,3', OL, 2) + S('M-2.6,-11 C-7,-7 -8,-2 -7,3', '#c8a870', 0.9) +
        P('M-8.5,3 L-5.5,3 L-7,9 Z', c.cel('#efe4c8'), 1.1);
    }
  };
  /* fan of bristle spikes under a spear head at height y */
  function qfan(y, w, h) {
    var d = 'M' + r1(-w * 0.5) + ',' + r1(y), n = 5, i;
    for (i = 0; i <= n; i++) { var x = -w * 0.5 + w * i / n; d += ' L' + r1(x + (i % 2 ? 0 : -1.2)) + ',' + r1(y + (i % 2 ? h * 0.55 : h)); }
    return d + ' L' + r1(w * 0.5) + ',' + r1(y) + ' Z';
  }
  for (var gw19 in GW19) if (GW19.hasOwnProperty(gw19)) { GW[gw19] = GW19[gw19]; WP[gw19] = GW19[gw19]; }
  GKIND.snagglespear_pike = 'staff'; GKIND.arrachea_totem = 'big'; GKIND.maggot_eye_axe = 'hammer';
  /* Old Longclaw's pelt: tawny cat fur with faint stripes, the cat's head worn as a hood-down on the upper back */
  var MAZZ = '#c89a58';
  GBACK.mazzranache_cloak = {
    back: function (c, g) {
      var d = capeD(g, 'fur', 53), R_ = rnd(97), st = '', i;
      for (i = 0; i < 9; i++) { var x = g.sx - 36 + R_() * 56, y = g.sy + 6 + R_() * 62; st += D`M${x},${y} q${3 + R_() * 2},${1.5 + R_() * 2} ${6 + R_() * 3},${0.5}`; }
      return P(d, c.cel(MAZZ)) + CG(S(st, '#7a5028', 1.6, 0.75) + capeFolds(g, '#8a6434') + S(d, '#e8c888', 3, 0.6), c.clip(d));
    },
    torso: function (c, g) {
      var x = g.scx - 4, y = g.sy - 2, col = MAZZ;
      /* cat head lying on the upper back, muzzle down, ears up, eyes closed */
      var hd = D`M${x + 4},${y - 1} C${x + 2},${y - 11} ${x - 16},${y - 13} ${x - 20},${y - 3} C${x - 22},${y + 5} ${x - 16},${y + 12} ${x - 8},${y + 11} C${x - 2},${y + 9} ${x + 4},${y + 6} ${x + 4},${y - 1} Z`;
      return P(D`M${x - 15},${y - 7} L${x - 19},${y - 15} L${x - 11},${y - 10} Z M${x - 5},${y - 9} L${x - 5},${y - 17} L${x + 1},${y - 9} Z`, c.cel(dk(col, 0.1)), 1.6) +
        P(hd, c.cel(col), 2.2) +
        CG(F(D`M${x - 15},${y + 2} C${x - 12},${y + 10} ${x - 4},${y + 12} ${x + 2},${y + 6} L${x + 6},${y + 14} L${x - 18},${y + 14} Z`, lt(col, 0.35), 0.8) +
          S(D`M${x - 12},${y - 6} q2,2 4,0 M${x - 4},${y - 7} q2,2 4,0`, '#5a3a1a', 1.2) + S(D`M${x - 17},${y - 1} l4,1 M${x + 1},${y - 2} l-4,1`, '#7a5028', 1.2, 0.8), c.clip(hd)) +
        E(x - 6, y + 4, 2.2, 1.6, '#3a2418', 0) +
        P(collarD(g), c.cel(col), 1.8);
    },
    front: function (c, g) {
      /* pelt over the far shoulder, a forepaw hanging down with claws */
      var bx = g.bSh[0] - 1, by = g.sy + 2;
      return drape(c, g, MAZZ, '#e8c888', function (c, g) { var x = g.bSh[0]; return S(D`M${x - 7},${g.sy + 2} q3,1 5,0 M${x - 2},${g.sy - 3} q3,1 5,0`, '#7a5028', 1.4, 0.8); }) +
        P(D`M${bx - 8},${by + 12} C${bx - 10},${by + 18} ${bx - 9},${by + 22} ${bx - 5},${by + 23} C${bx - 1},${by + 23} ${bx},${by + 18} ${bx - 2},${by + 12} Z`, c.cel(MAZZ), 1.8) +
        S(D`M${bx - 7.5},${by + 23} l-0.6,2.4 M${bx - 5},${by + 23.5} l0,2.6 M${bx - 2.6},${by + 23} l0.6,2.4`, '#f4ecd6', 1.3);
    }
  };
  /* Aubert's cape: Order of the Pyre red with a white trim and a white flame crest on the back */
  var SCAR = '#b3161c';
  function flameCrest(c, x, y, s) {
    var d = D`M${x},${y - 9 * s} C${x + 2 * s},${y - 5 * s} ${x + 6 * s},${y - 3 * s} ${x + 5.5 * s},${y + 2 * s} C${x + 5 * s},${y + 6 * s} ${x + 2 * s},${y + 8 * s} ${x},${y + 8 * s} C${x - 2 * s},${y + 8 * s} ${x - 5 * s},${y + 6 * s} ${x - 5.5 * s},${y + 2 * s} C${x - 6 * s},${y - 2 * s} ${x - 3 * s},${y - 3 * s} ${x - 2 * s},${y - 6 * s} C${x - 1 * s},${y - 3.5 * s} ${x},${y - 4 * s} ${x},${y - 9 * s} Z`;
    return P(d, c.cel('#f6f2ea'), 1.6) + F(D`M${x},${y - 2 * s} C${x + 2.4 * s},${y + 1 * s} ${x + 2.4 * s},${y + 5 * s} ${x},${y + 5.6 * s} C${x - 2.4 * s},${y + 5 * s} ${x - 2.4 * s},${y + 1 * s} ${x},${y - 2 * s} Z`, SCAR, 0.9);
  }
  GBACK.perrine_cape = {
    back: function (c, g) {
      var d = capeD(g, 'plain', 61), b = g.b;
      return P(d, c.cel(SCAR)) + CG(S(d, '#f4f0e8', 5.4) + S(d, '#c9c2b4', 1.2, 0.8) + capeFolds(g, '#6e0a0e'), c.clip(d)) + P(d, 'none', 2.5) +
        flameCrest(c, g.sx - b.waistW - 11, g.fy - 25, 0.95);
    },
    torso: function (c, g) {
      var d = collarD(g);
      return P(d, c.cel(SCAR), 1.8) + CG(S(D`M${g.scx - 11},${g.sy + 6} Q${g.scx - 2},${g.sy - 2} ${g.scx + 11},${g.sy + 2.8}`, '#f4f0e8', 2.6), c.clip(d));
    },
    front: function (c, g) { return drape(c, g, SCAR, '#f4f0e8'); }
  };
  /* the Silverleaf Aegis (v10.2): Lyveus's leaf-and-pearl kite shield, a keepsake for finishing his story. Worn as a
     look only (no slot, no stats): slung on the back, with the carrying strap across the chest. The same shield as
     art_legends.js draws for him. */
  function aegisKite(c) {
    var outer = 'M-12,-15 C-5,-18.5 5,-18.5 12,-15 L12.5,-4 C12,7 6,14 0,21 C-6,14 -12,7 -12.5,-4 Z';
    var inner = 'M-9.6,-12.8 C-4,-15.6 4,-15.6 9.6,-12.8 L10,-4 C9.6,5.6 4.8,11.6 0,17.4 C-4.8,11.6 -9.6,5.6 -10,-4 Z';
    var lf = 'M0,-12.5 C2.6,-9.6 6.4,-7 6.6,-2 C6.8,1.6 5.4,4.4 3.4,5.8 L5.6,8 C3,8 1.4,8.6 0,10.4 C-1.4,8.6 -3,8 -5.6,8 L-3.4,5.8 C-5.4,4.4 -6.8,1.6 -6.6,-2 C-6.4,-7 -2.6,-9.6 0,-12.5 Z';
    return P(outer, c.lg([[0, '#9aa852'], [0.55, '#76853a'], [1, '#4e5a24']], 0.2, 0, 0.8, 1), 2.4) +
      P(inner, c.lg([[0, '#fafbdc'], [0.35, '#e6edaa'], [0.7, '#cbd889'], [1, '#a4b663']], 0.15, 0, 0.85, 1), 1.1) +
      CG(F('M-11,-2 L-1,-17 L4.5,-17 L-11,8 Z', '#ffffff', 0.5), c.clip(inner)) +
      P(lf, c.lg([[0, '#ffffff'], [0.6, '#eef4c8'], [1, '#bccb7c']]), 1.1) +
      S('M0,-10 L0,-2.5 M0,-7 L-2.6,-8.8 M0,-7 L2.6,-8.8 M0,-4 L-3.6,-6 M0,-4 L3.6,-6', '#7f9046', 0.8) +
      C(0, 2.2, 3.7, c.rg([[0, '#ffffff'], [0.5, '#eef1f8'], [1, '#98a6c4']], 0.36, 0.34, 0.72), 1.3) + C(-1.2, 1, 1.05, '#ffffff');
  }
  GBACK.silverleaf_aegis = {
    back: function (c, g) { return G(aegisKite(c), 'translate(' + r1(g.bSh[0] - 13) + ',' + r1(g.sy + 17) + ') rotate(-26) scale(1.25)'); },
    torso: function (c, g) {
      var d = D`M${g.scx + 9},${g.sy - 1} Q${g.scx - 1},${(g.sy + g.hy) / 2 - 2} ${g.scx - 12},${g.hy - 3}`;
      var m = [(g.scx + 9 + g.scx - 12) / 2 + 1, (g.sy - 1 + g.hy - 3) / 2 - 1];
      return S(d, '#2a1c10', 4.2) + S(d, '#6a4a2c', 2.4) + C(m[0], m[1], 1.9, '#c9b56a', 1.1);
    }
  };
  /* the Reedsong Lute (v10.3): Widya's keepsake, a copy of the Songkeepers' lute, the same lute art_legends.js draws
     for her. Worn as a look only (no slot, no stats): slung on the back, the pear-shaped body out behind the shoulder
     blade and the neck leaning back past the head, the strap across the chest. Body centred on (0,0), the neck along -y. */
  function reedLute(c) {
    var body = 'M0,-17 C5,-16.5 12.6,-9 13,1.5 C13.4,11 7.4,18 0,18 C-7.4,18 -13.4,11 -13,1.5 C-12.6,-9 -5,-16.5 0,-17 Z';
    var nk = '#8a5226', cv = '#f4cc84', out = '';
    /* pegbox bent back from the nut, three pegs down each side */
    var P1 = [-2.6, -44], P2 = [2.6, -44], P3 = [-3, -56.6], P4 = [-8, -54.2];
    [[P2, P3, 1], [P1, P4, -1]].forEach(function (e) {
      var a = e[0], b = e[1], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.sqrt(dx * dx + dy * dy), nx = -dy / l, ny = dx / l;
      if (nx * e[2] < 0) { nx = -nx; ny = -ny; }
      [0.3, 0.58, 0.86].forEach(function (f) {
        var p = [a[0] + dx * f, a[1] + dy * f], q = [p[0] + nx * 3, p[1] + ny * 3], d = pl([p, q]);
        out += S(d, OL, 2.6) + S(d, '#5e3416', 1.2) + E(q[0], q[1], 1.4, 1, c.cel('#7a4a28'), 1, null, r1(Math.atan2(ny, nx) * 180 / Math.PI));
      });
    });
    out += P(pl([P1, P2, P3, P4]) + 'Z', c.lg([[0, lt(nk, 0.28)], [1, dk(nk, 0.25)]], 0, 0, 1, 0), 2.2) + S('M-1.2,-46.4 L-4.6,-53.4', '#34200f', 1.5, 0.85);
    /* neck and fretboard */
    out += P('M-3.3,-14 L-2.6,-44 L2.6,-44 L3.3,-14 Z', c.lg([[0, lt(nk, 0.22)], [0.5, nk], [1, dk(nk, 0.3)]], 0, 0, 1, 0), 2.2) + F('M-2.1,-15 L-1.7,-44 L1.7,-44 L2.1,-15 Z', '#34200f');
    out += S('M-1.9,-19 L1.9,-19 M-1.9,-23.4 L1.9,-23.4 M-1.9,-27.8 L1.9,-27.8 M-1.9,-32.2 L1.9,-32.2 M-1.9,-36.6 L1.9,-36.6 M-1.9,-41 L1.9,-41', '#c8b48a', 0.55, 0.8);
    /* the bowl: warm wood, a binding line, carved leaves, the rosette, the bridge */
    out += P(body, c.lg([[0, '#eaaa64'], [0.42, '#c47a38'], [0.74, '#c47a38'], [1, '#86491c']], 0.15, 0, 0.85, 1), 2.6) +
      CG(F('M-14,-4 C-12,-14 -4,-18 2,-18 L-14,14 Z', '#ffffff', 0.2) + F('M14,-2 C13,10 8,17 0,19 L16,19 Z', '#000000', 0.2), c.clip(body)) +
      G(S(body, '#86491c', 1.2, 0.75), 'scale(0.84)');
    out += S('M-8,4.6 C-7,10.6 -3,13 0,13.2 C3,13 7,10.6 8,4.6', cv, 1.1, 0.85);
    [[-7.4, 8.6, -50], [-3.4, 12.4, -20], [3.4, 12.4, 20], [7.4, 8.6, 50]].forEach(function (q) {
      out += G(F('M0,0 C-1.4,-0.7 -1.5,-2.4 0,-3.6 C1.5,-2.4 1.4,-0.7 0,0 Z', cv, 0.9), 'translate(' + q[0] + ',' + q[1] + ') rotate(' + q[2] + ')');
    });
    out += C(0, -4, 5.9, 'none', 0).replace('fill="none"', 'fill="none" stroke="' + cv + '" stroke-width="1.3"') + C(0, -4, 4.4, '#1e1008', 1.4) +
      S('M-3,-4 L3,-4 M0,-7 L0,-1 M-2.1,-6.1 L2.1,-1.9 M2.1,-6.1 L-2.1,-1.9', '#9c6230', 0.7, 0.9);
    out += R(-5.2, 8, 10.4, 2.8, '#34200f', 1.3);
    /* strings from the bridge to the nut */
    out += R(-2.9, -45.6, 5.8, 1.9, '#efe4c4', 1) + S('M-1.7,9.4 L-1.2,-44.4 M-0.57,9.4 L-0.4,-44.4 M0.57,9.4 L0.4,-44.4 M1.7,9.4 L1.2,-44.4', '#f6eed6', 0.55, 0.95);
    return out;
  }
  GBACK.reedsong_lute = {
    back: function (c, g) { return G(reedLute(c), 'translate(' + r1(g.bSh[0] - 11) + ',' + r1(g.sy + 22) + ') rotate(-24) scale(0.98)'); },
    torso: function (c, g) {
      var d = D`M${g.scx + 9},${g.sy - 1} Q${g.scx - 1},${(g.sy + g.hy) / 2 - 2} ${g.scx - 12},${g.hy - 3}`;
      var m = [(g.scx + 9 + g.scx - 12) / 2 + 1, (g.sy - 1 + g.hy - 3) / 2 - 1];
      return S(d, '#2a1c10', 4.2) + S(d, '#8a5a30', 2.4) + S(d, '#dcb24c', 0.6, 0.8) + C(m[0], m[1], 1.9, '#dcb24c', 1.1);
    }
  };
  /* the Beerhammer Cloak (v10.7): Bromli's keepsake, a torn red cloak like his, the same red art_bromli.js draws for
     him. Worn as a look only (no slot, no stats): a shredded hem, a couple of holes torn through, the cloak wrapped
     round the neck like a scarf, and a small gold compass-star clasp at the throat. */
  var BEERRED = '#b3191f';
  GBACK.beerhammer_cloak = {
    back: function (c, g) {
      var d = capeD(g, 'rag', 47), b = g.b, x = g.sx - b.waistW - 16, y = g.hy;
      return P(d, c.cel(BEERRED)) + CG(capeFolds(g, '#6a0b10') + S(d, '#6a0b10', 3.2) +
        E(x, y - 2, 1.3, 2.8, OL, 0, 0.9, 14) + E(x - 3, y + 11, 1.1, 2.4, OL, 0, 0.9, 6), c.clip(d)) + P(d, 'none', 2.5);
    },
    torso: function (c, g) {
      var d = collarD(g, 1), x = g.scx, y = g.sy;
      return P(d, c.cel(BEERRED), 1.8) + CG(S(D`M${x - 11},${y + 5} Q${x - 2},${y - 3} ${x + 11},${y + 1.8}`, '#6a0b10', 1.6, 0.9), c.clip(d));
    },
    front: function (c, g) {
      var x = g.bSh[0] - 1 + g.b.shW * 0.42, y = g.sy - 1.5;
      return drape(c, g, BEERRED, '#6a0b10') + C(x, y, 2.4, c.cel('#e6b33c'), 1.1) +
        S(D`M${x},${y - 1.6} L${x},${y + 1.6} M${x - 1.6},${y} L${x + 1.6},${y}`, '#9a6816', 0.8);
    }
  };
  /* ================= raid set looks (v10.8): one set per raid, each with a Hard recolour =================
     Every look is ONE drawing function that takes a palette. The plain key is drawn with the raid's Normal palette and
     <key>_hard with its Hard palette (the same design: darker, with a glowing accent), so the two can never drift apart. */
  /* point on the torso: u = -1 back edge .. +1 front edge, v = 0 shoulder line .. 1 hip line (follows lean and taper) */
  function tq(g, u, v) { var cx = g.scx + (g.sx - g.scx) * v, hw = g.b.shW + (g.b.waistW - g.b.shW) * v; return [cx + u * hw, g.sy + (g.hy - g.sy) * v]; }
  function tpl(g, pts) { return pl(pts.map(function (p) { return tq(g, p[0], p[1]); })); }
  function rsPadD(x, y, rx) { return D`M${x - rx},${y + 3} C${x - rx},${y - rx * 0.95} ${x + rx},${y - rx * 0.95} ${x + rx},${y + 3} C${x + rx * 0.5},${y + 5.5} ${x - rx * 0.5},${y + 5.5} ${x - rx},${y + 3} Z`; }
  function rsPadRim(x, y, rx) { return D`M${x - rx + 1.2},${y + 2.4} C${x - rx * 0.5},${y + 4.8} ${x + rx * 0.5},${y + 4.8} ${x + rx - 1.2},${y + 2.4}`; }
  /* rows of overlapping scales (each arc is the lower edge of one scale), with a lighter sheen arc on each */
  function rsScales(x0, x1, y0, y1, w, h) {
    var d = '', s = '', row = 0;
    for (var y = y0; y < y1; y += h, row++)
      for (var x = x0 - w + (row % 2) * w / 2; x < x1; x += w) {
        d += D`M${x},${y}q${w / 2},${h * 1.3} ${w},0`;
        s += D`M${x + w * 0.2},${y - h * 0.2}q${w * 0.3},${h * 0.8} ${w * 0.6},0`;
      }
    return { d: d, s: s };
  }
  function rsScaleG(c, clip, x0, x1, y0, y1, w, h, line, sheen) {
    var k = rsScales(x0, x1, y0, y1, w, h);
    return CG((sheen ? S(k.s, sheen, 0.8, 0.5) : '') + S(k.d, line, 1.1, 0.95), clip);
  }
  /* a trim line: metal (Normal) or a glowing edge (palettes with glow): soft halo, dark edge, the colour, a hot core */
  function rsEdge(d, w, pal, col) {
    if (!pal.glow) return S(d, OL, w + 1.6) + S(d, col || pal.trim, w);
    return S(d, pal.glow, w * 3.4, 0.28) + S(d, OL, w + 1.4) + S(d, pal.glow, w * 1.1) + S(d, pal.core, w * 0.4);
  }
  /* a glowing seam (magma and bioluminescence): halo, dark lip, glow, core */
  function rsSeam(d, w, pal) {
    return S(d, pal.glow, w * 3.2, 0.3) + S(d, OL, w + 1.4) + S(d, pal.mid || pal.glow, w) + S(d, pal.core, w * 0.4);
  }
  function rsDot(c, x, y, r, pal) { return C(x, y, r * 2.6, c.rg([[0, pal.core, 0.9], [0.35, pal.glow, 0.55], [1, pal.glow, 0]]), 0) + C(x, y, r * 0.7, pal.core, 0); }
  /* the cape shape of capeD with a hem drawn by the look: hem(H0, H1, at) returns path commands from H0 to H1 */
  function rsCape(g, hem) {
    var b = g.b, scx = g.scx, sx = g.sx, sy = g.sy, hy = g.hy, fy = g.fy;
    var A = [scx - b.shW - 2, sy + 6], H0 = [sx + b.waistW + 12, fy - 20], H1 = [sx - b.waistW - 20, fy - 11];
    var at = function (t, drop) { return [H0[0] + (H1[0] - H0[0]) * t, H0[1] + (H1[1] - H0[1]) * t + Math.sin(Math.PI * t) * 5 + (drop || 0)]; };
    var hs = hem(H0, H1, at);
    return {
      d: D`M${A[0]},${A[1]} Q${scx - b.shW},${sy - 5} ${scx - 3},${sy - 4} L${scx + b.shW - 3},${sy - 1} C${scx + b.shW + 6},${sy + 10} ${scx + b.shW + 8},${hy - 4} ${H0[0]},${H0[1]}` + hs +
        D` C${scx - b.shW - 16},${hy + 2} ${scx - b.shW - 8},${sy + 22} ${A[0]},${A[1]} Z`,
      hem: D`M${H0[0]},${H0[1]}` + hs, at: at
    };
  }
  function rsChest(key, fn, N, H) { GCHEST[key] = function (o) { fn(o, N); }; GCHEST[key + '_hard'] = function (o) { fn(o, H); }; }
  function rsLegs(key, fn, N, H) {
    GLEGS[key] = { pants: N.pants, fx: function (c, g, L, f) { return fn(c, g, L, f, N); } };
    GLEGS[key + '_hard'] = { pants: H.pants, fx: function (c, g, L, f) { return fn(c, g, L, f, H); } };
  }
  function rsBack(key, mk, N, H) { GBACK[key] = mk(N); GBACK[key + '_hard'] = mk(H); }

  /* ---- Veshmira's Lair: the Brood Mother's hoard and the false court's finery. Black dragon scale with gold trim,
     small horns and claws. Hard: blacker scale, the gold dimmed to violet steel, every edge glowing storm violet. ---- */
  var VESH = {
    base: '#262230', base2: '#1f1c28', dark: '#131018', line: '#0a080c', sheen: '#5a5468', trim: GOLD, trimDk: '#8a6420', horn: '#e2c070',
    inner: '#6a1a22', glow: null, pants: '#221e2a'
  };
  var VESH_H = {
    base: '#1a1622', base2: '#15121c', dark: '#0a080e', line: '#050407', sheen: '#6a4aa0', trim: '#8a7ab0', trimDk: '#3e3456', horn: '#cbb8ff',
    inner: '#3a1a6a', glow: '#9a5aff', core: '#f0e4ff', pants: '#17131e'
  };
  function veshPad(c, x, y, rx, pal, front) {
    var d = rsPadD(x, y, rx), out = '', hc = c.cel(pal.horn);
    if (!front) {
      /* one horn swept back off the far pad, away from the face */
      var hx = x - rx * 0.45, hy = y - rx * 0.5, hd = D`M${hx - 2.6},${hy + 1.5} Q${hx - 3},${hy - rx * 0.5} ${hx - rx * 1.05},${hy - rx * 1.05} Q${hx - 0.4},${hy - rx * 0.75} ${hx + 2.6},${hy + 0.5} Z`;
      out += (pal.glow ? S(hd, pal.glow, 3.4, 0.35) : '') + P(hd, hc, 1.5);
    }
    out += P(d, c.cel(pal.base)) + rsScaleG(c, c.clip(d), x - rx, x + rx, y - rx, y + 5, 4.6, 3.2, pal.line, pal.sheen) + rsEdge(rsPadRim(x, y, rx), front ? 1.8 : 1.4, pal);
    if (front) [-0.5, 0, 0.5].forEach(function (k) {
      /* three small claws hanging from the rim */
      var cx = x + rx * k, cy = y + 4.2 + (k ? 0 : 0.6), cd = D`M${cx - 1.7},${cy - 1} Q${cx - 0.9},${cy + 3.2} ${cx + 1.3},${cy + 4.4} Q${cx + 0.6},${cy + 1.6} ${cx + 1.7},${cy - 1} Z`;
      out += (pal.glow ? S(cd, pal.glow, 3, 0.35) : '') + P(cd, hc, 1.1);
    });
    return out;
  }
  function veshPads(pal) { return function (c, g) { return veshPad(c, g.bSh[0] - 1, g.sy + 2, 8, pal, 0) + veshPad(c, g.fSh[0] + 1, g.sy + 3, 9.5, pal, 1); }; }
  /* high court collar: a dragon's frill standing up behind the neck, three horn points showing past the back of the
     head, lined in deep red (Hard: violet), gold-edged */
  function veshCollar(c, g, pal) {
    var x = g.scx, y = g.sy, k = g.b.shW / 16;
    var edge = D`M${x - 11 * k},${y + 6} Q${x - 16 * k},${y + 4} ${x - 20 * k},${y - 5 * k} Q${x - 14 * k},${y - 4 * k} ${x - 16 * k},${y - 13 * k} Q${x - 10 * k},${y - 9 * k} ${x - 8 * k},${y - 17 * k} Q${x - 3 * k},${y - 7 * k} ${x + 4},${y - 2}`;
    var bk = edge + D` L${x + 4},${y + 3} Z`;
    return P(bk, c.cel(pal.base), 1.8) + G(F(bk, pal.inner), 'matrix(0.74,0,0,0.74,' + r1((x - 2) * 0.26) + ',' + r1((y + 3) * 0.26) + ')') + rsEdge(edge, 1.4, pal) +
      P(D`M${x + 4},${y + 2.5} L${x + 10 * k},${y - 4 * k} Q${x + 12 * k},${y + 1} ${x + 10 * k},${y + 4} Z`, c.cel(pal.base), 1.5) + rsEdge(D`M${x + 4.5},${y + 2} L${x + 10 * k},${y - 4 * k}`, 1.1, pal);
  }
  /* court robe: black and gold, high collar, scales across the shoulders, a gold panel down the front to the hem */
  function veshRobe(o, pal) {
    o.torsoC = pal.base; o.sleeve = pal.base2; o.bell = pal.dark;
    o.robe = pal.base;
    o.belt = pal.dark; o.buckle = pal.trim;
    o.pads = veshPads(pal);
    o.robeFx = function (c, g) {
      var x = g.sx + 5, fy = g.fy, dm = '';
      for (var y = g.hy + 6; y < fy - 10; y += 8) dm += D`M${x + 1 + (y - g.hy) * 0.06},${y} l2.4,2.8 l-2.4,2.8 l-2.4,-2.8 Z`;
      return CG(rsEdge(D`M${g.wl - 14},${fy - 6.5} Q${g.sx},${fy - 2} ${g.wr + 14},${fy - 6.5}`, 2.4, pal) +
        P(D`M${x - 3.4},${g.hy - 6} L${x + 3.4},${g.hy - 6} L${x + 6.4},${fy} L${x - 2},${fy} Z`, pal.dark, 0) +
        rsEdge(D`M${x - 3.4},${g.hy - 6} L${x - 2},${fy}`, 1.1, pal) + rsEdge(D`M${x + 3.4},${g.hy - 6} L${x + 6.4},${fy}`, 1.1, pal) +
        (pal.glow ? S(dm, pal.glow, 1.6, 0.5) + F(dm, pal.core) : F(dm, pal.trim)), c.clip(g.robeD));
    };
    o.torsoFx = function (c, g) {
      var cl = c.clip(g.torsoD), top = tq(g, -1.3, 0.34), top2 = tq(g, 1.3, 0.3);
      var band = D`M${g.scx - 30},${g.sy - 8} L${g.scx + 30},${g.sy - 8} L${top2[0]},${top2[1]} Q${g.scx},${g.sy + 16} ${top[0]},${top[1]} Z`;
      var a = tq(g, 0.2, 0), b = tq(g, 0.44, 0), a1 = tq(g, 0.24, 1), b1 = tq(g, 0.5, 1);
      return CG(CG(F(band, pal.dark) + rsScaleG(c, c.clip(band), g.scx - 30, g.scx + 30, g.sy - 6, g.sy + 14, 5, 3.4, pal.line, pal.sheen), c.clip(band)) +
        rsEdge(D`M${top[0]},${top[1]} Q${g.scx},${g.sy + 16} ${top2[0]},${top2[1]}`, 1.6, pal) +
        F(D`M${a[0]},${a[1]} L${b[0]},${b[1]} L${b1[0]},${b1[1]} L${a1[0]},${a1[1]} Z`, pal.dark) +
        rsEdge(D`M${a[0]},${a[1]} L${a1[0]},${a1[1]} M${b[0]},${b[1]} L${b1[0]},${b1[1]}`, 1.1, pal), cl);
    };
    o.gTorso = function (c, g) { return veshCollar(c, g, pal); };
  }
  /* wyrmhide tunic: overlapping black scales all over, gold lacing up the front, claw-pointed flaps over the hips */
  function veshTunic(o, pal) {
    o.torsoC = pal.base; o.sleeve = pal.base2;
    o.belt = pal.dark; o.buckle = pal.trim;
    o.pads = veshPads(pal);
    o.torsoFx = function (c, g) {
      var cl = c.clip(g.torsoD), a = tq(g, 0.3, 0.05), b = tq(g, 0.33, 0.95), lace = '', i;
      for (i = 0; i < 5; i++) {
        var t0 = 0.12 + i * 0.17, t1 = t0 + 0.17, p = tq(g, 0.16, t0), q = tq(g, 0.48, t1), p2 = tq(g, 0.48, t0), q2 = tq(g, 0.16, t1);
        lace += D`M${p[0]},${p[1]} L${q[0]},${q[1]} M${p2[0]},${p2[1]} L${q2[0]},${q2[1]} `;
      }
      return CG(rsScaleG(c, cl, g.scx - 30, g.scx + 30, g.sy - 6, g.hy, 5.6, 3.8, pal.line, pal.sheen) +
        S(D`M${a[0]},${a[1]} L${b[0]},${b[1]}`, pal.dark, 5.2) + rsEdge(lace, 0.9, pal) +
        rsEdge(D`M${g.scx - 9},${g.sy + 1} Q${g.scx},${g.sy - 3} ${g.scx + 11},${g.sy}`, 1.4, pal), cl);
    };
    o.gTorso = function (c, g) {
      var out = '';
      [-0.62, 0.02, 0.66].forEach(function (u, i) {
        var x = g.sx + u * g.b.waistW, y = g.hy, fl = D`M${x - 4},${y - 1} L${x + 4},${y - 1} L${x + 1.2},${y + 9 - (i === 1 ? 0 : 1.5)} Z`;
        out += P(fl, c.cel(pal.base2), 1.5) + rsEdge(D`M${x + 4},${y - 1} L${x + 1.2},${y + 9 - (i === 1 ? 0 : 1.5)} L${x - 4},${y - 1}`, 0.8, pal);
      });
      return out;
    };
  }
  /* blackscale legguards: scale bands on thigh and shin, a gold claw-tipped knee plate */
  function veshLegs(c, g, L, front, pal) {
    var w = g.b.legW, sc = '', sh = '';
    [[L[0], L[1]], [L[1], L[2]]].forEach(function (s, si) {
      (si ? [0.3, 0.5, 0.7, 0.9] : [0.2, 0.4, 0.6, 0.8]).forEach(function (u) {
        var a = lpt(s[0], s[1], u, -w * 0.42), m = lpt(s[0], s[1], u + 0.12, 0), b = lpt(s[0], s[1], u, w * 0.42);
        var a2 = lpt(s[0], s[1], u - 0.05, -w * 0.25), m2 = lpt(s[0], s[1], u + 0.03, 0), b2 = lpt(s[0], s[1], u - 0.05, w * 0.25);
        sc += D`M${a[0]},${a[1]} Q${m[0]},${m[1]} ${b[0]},${b[1]}`; sh += D`M${a2[0]},${a2[1]} Q${m2[0]},${m2[1]} ${b2[0]},${b2[1]}`;
      });
    });
    var K = L[1], F2 = L[2], p = [lptA(K, F2, -4.5, -w * 0.56), lptA(K, F2, -4.5, w * 0.5), lptA(K, F2, 2.5, w * 0.46), lptA(K, F2, 7.5, -w * 0.05), lptA(K, F2, 2.5, -w * 0.56)];
    var kd = pl(p) + 'Z', rid = pl([lptA(K, F2, -3.5, -w * 0.05), lptA(K, F2, 6, -w * 0.05)]);
    var kc = front ? pal.trim : dk(pal.trim, 0.25);
    return S(sh, pal.sheen, 0.8, front ? 0.5 : 0.3) + S(sc, pal.line, 1.1, 0.95) +
      (pal.glow ? S(kd, pal.glow, 3.6, front ? 0.4 : 0.25) : '') + P(kd, c.cel(kc), 1.5) + S(rid, pal.glow ? pal.core : lt(kc, 0.4), 0.9, 0.8);
  }
  /* black scaled hide cloak with a jagged, wing-like hem: scalloped between bony points, the wing ribs showing */
  function veshMantle(pal) {
    function wing(g) {
      return rsCape(g, function (H0, H1, at) {
        var s = '', n = 4;
        for (var i = 0; i < n; i++) {
          var t0 = i / n, t1 = (i + 1) / n, m = at((t0 + t1) / 2, -7), e = at(t1, 5);
          s += D` Q${m[0]},${m[1]} ${e[0]},${e[1]}`;
        }
        return s;
      });
    }
    return {
      back: function (c, g) {
        var W2 = wing(g), d = W2.d, cl = c.clip(d), rb = '', o0 = [g.scx - 5, g.sy + 1];
        for (var i = 1; i <= 4; i++) { var e = W2.at(i / 4, 5); rb += D`M${o0[0]},${o0[1]} Q${(o0[0] + e[0]) / 2 - 4},${(o0[1] + e[1]) / 2} ${e[0]},${e[1]} `; }
        return P(d, c.cel(pal.base)) + CG(rsScaleG(c, cl, g.sx - 50, g.sx + 30, g.sy, g.hy + 4, 6, 4.2, pal.line, pal.sheen) +
          S(rb, pal.dark, 2.6) + S(rb, pal.sheen, 0.8, 0.6) + rsEdge(W2.hem, 1.8, pal), cl) + P(d, 'none');
      },
      torso: function (c, g) {
        var d = collarD(g);
        return P(d, c.cel(pal.base), 1.8) + CG(rsEdge(D`M${g.scx - 11},${g.sy + 6} Q${g.scx - 2},${g.sy - 2} ${g.scx + 11},${g.sy + 2.8}`, 1.4, pal), c.clip(d));
      },
      front: function (c, g) {
        var x = g.scx + 7, y = g.sy + 1.5, cw = '';
        /* a gold three-claw clasp at the throat */
        [-2.4, 0, 2.4].forEach(function (dx) { cw += D`M${x + dx - 1},${y - 2} Q${x + dx + 1.8},${y} ${x + dx},${y + 3.6} `; });
        return drape(c, g, pal.base, null, function (c, g) { var bx = g.bSh[0]; return rsScaleG(c, c.clip(drapeD(g)), bx - 12, bx + 12, g.sy - 6, g.sy + 16, 4.6, 3.2, pal.line, pal.sheen) + CG(rsEdge(drapeD(g), 2, pal), c.clip(drapeD(g))); }) +
          C(x, y, 2.8, c.cel(pal.dark), 1.2) + rsEdge(cw, 1.1, pal, pal.trim);
      }
    };
  }
  rsBack('vesh_mantle', veshMantle, VESH, VESH_H);
  rsChest('vesh_robe', veshRobe, VESH, VESH_H);
  rsChest('vesh_tunic', veshTunic, VESH, VESH_H);
  rsLegs('vesh_legs', veshLegs, VESH, VESH_H);

  /* ---- The Magma Throne: a fire lord's domain under a burning mountain. Dark rock and char with molten orange cracks.
     Hard: obsidian black with white-hot, pale blue flame in the cracks. ---- */
  var MC = {
    rock: '#40322c', rockLt: '#6a5448', rockDk: '#1e1614', glow: '#ff5a0a', mid: '#ffa01e', core: '#fff2a8',
    cloth: '#8e2410', clothDk: '#4a120a', flame: ['#ff5a0a', '#ffa01e', '#ffe680'], leather: '#4e3426', leatherDk: '#261a14', pants: '#2e2420', sheen: null
  };
  var MC_H = {
    rock: '#1e1c26', rockLt: '#3c3850', rockDk: '#0a090e', glow: '#2f8fff', mid: '#9ad8ff', core: '#ffffff',
    cloth: '#1e1c30', clothDk: '#0c0b16', flame: ['#2f7fff', '#8fd0ff', '#f2fbff'], leather: '#26232e', leatherDk: '#0e0d12', pants: '#16151c', sheen: '#7a74a8'
  };
  /* obsidian gets a glassy sheen stripe on Hard */
  function mcSheen(c, g, pal, cl) {
    if (!pal.sheen) return '';
    var a = tq(g, -0.7, 0.05), b = tq(g, -0.1, 0.05), a1 = tq(g, -0.95, 0.9), b1 = tq(g, -0.62, 0.9);
    return CG(F(D`M${a[0]},${a[1]} L${b[0]},${b[1]} L${b1[0]},${b1[1]} L${a1[0]},${a1[1]} Z`, pal.sheen, 0.22), cl);
  }
  function mcPad(c, x, y, rx, pal, front, col) {
    var d = rsPadD(x, y, rx);
    return P(d, c.cel(col || pal.rock)) + CG(rsSeam(D`M${x - rx * 0.7},${y - rx * 0.3} L${x - rx * 0.1},${y + 0.5} L${x + rx * 0.3},${y - rx * 0.45} L${x + rx * 0.8},${y + 1}`, front ? 1 : 0.8, pal) +
      (pal.sheen ? F(D`M${x - rx * 0.8},${y} C${x - rx * 0.7},${y - rx * 0.6} ${x - rx * 0.1},${y - rx * 0.8} ${x + rx * 0.2},${y - rx * 0.75} L${x - rx * 0.4},${y + 1} Z`, pal.sheen, 0.3) : ''), c.clip(d)) + P(d, 'none');
  }
  function mcPads(pal, col) { return function (c, g) { return mcPad(c, g.bSh[0] - 1, g.sy + 2, 8, pal, 0, col) + mcPad(c, g.fSh[0] + 1, g.sy + 3, 9.5, pal, 1, col); }; }
  /* flame tongues rising from a hem line between x0 and x1 at y, heights h0..h1 */
  function mcFlames(c, x0, x1, y, n, h0, h1, seed, pal, k) {
    var R_ = rnd(seed), out = ['', '', ''], i, j;
    for (j = 0; j < 3; j++) {
      var s = 1 - j * 0.3, d = D`M${x0},${y + 4}`;
      R_ = rnd(seed);
      for (i = 0; i < n; i++) {
        var a = x0 + (x1 - x0) * i / n, b = x0 + (x1 - x0) * (i + 1) / n, m = (a + b) / 2, hh = (h0 + R_() * (h1 - h0)) * s * (k || 1);
        d += D` L${a + (b - a) * 0.12 * j},${y} Q${m - (b - a) * 0.1},${y - hh * 0.5} ${m + (b - a) * 0.15},${y - hh} Q${m + (b - a) * 0.2},${y - hh * 0.4} ${b - (b - a) * 0.12 * j},${y}`;
      }
      out[j] = d + D` L${x1},${y + 4} Z`;
    }
    return F(out[0], pal.flame[0], 0.95) + F(out[1], pal.flame[1]) + F(out[2], pal.flame[2]);
  }
  /* magma-forged hauberk: rock plates with molten seams between them, a rock gorget */
  function mcMail(o, pal) {
    o.torsoC = pal.rock; o.sleeve = dk(pal.rock, 0.12);
    o.belt = pal.rockDk; o.buckle = pal.mid;
    o.pads = mcPads(pal);
    o.torsoFx = function (c, g) {
      var cl = c.clip(g.torsoD);
      var seams = tpl(g, [[-1.3, 0.36], [-0.7, 0.3], [-0.25, 0.38], [0.25, 0.31], [0.7, 0.37], [1.3, 0.33]]) +
        tpl(g, [[-1.3, 0.7], [-0.6, 0.66], [-0.05, 0.73], [0.5, 0.67], [1.3, 0.72]]) +
        tpl(g, [[-0.35, 0.0], [-0.28, 0.18], [-0.38, 0.34]]) + tpl(g, [[0.42, 0.0], [0.34, 0.16], [0.44, 0.33]]) +
        tpl(g, [[-0.6, 0.35], [-0.5, 0.52], [-0.62, 0.67]]) + tpl(g, [[0.08, 0.37], [0.0, 0.55], [0.1, 0.72]]) + tpl(g, [[0.72, 0.36], [0.64, 0.52], [0.74, 0.68]]) +
        tpl(g, [[-0.3, 0.71], [-0.36, 0.86], [-0.28, 1.0]]) + tpl(g, [[0.38, 0.68], [0.3, 0.85], [0.4, 1.0]]);
      var chips = '';
      [[-0.75, 0.08], [0.0, 0.08], [0.62, 0.08], [-0.95, 0.42], [-0.35, 0.42], [0.3, 0.42], [0.85, 0.42], [-0.7, 0.76], [0.0, 0.78], [0.6, 0.76]].forEach(function (p) {
        var a = tq(g, p[0], p[1]), b = tq(g, p[0] + 0.28, p[1] - 0.02);
        chips += D`M${a[0]},${a[1] + 1.5} L${b[0]},${b[1] + 1.5}`;
      });
      return CG(S(chips, pal.rockLt, 1.3, 0.7) + rsSeam(seams, 1.1, pal), cl) + mcSheen(c, g, pal, cl);
    };
    o.gTorso = function (c, g) {
      var d = collarD(g, 1);
      return P(d, c.cel(pal.rockDk), 1.8) + CG(rsSeam(D`M${g.scx - 10},${g.sy + 4.5} Q${g.scx - 2},${g.sy - 2} ${g.scx + 10},${g.sy + 1.2}`, 0.8, pal), c.clip(d));
    };
  }
  /* firehide tunic: charred leather, glowing ember seams with stitches, a strap with ember studs */
  function mcLeather(o, pal) {
    o.torsoC = pal.leather; o.sleeve = pal.leatherDk;
    o.belt = pal.leatherDk; o.buckle = pal.mid;
    o.pads = function (c, g) { return mcPad(c, g.bSh[0] - 1, g.sy + 2, 7, pal, 0, pal.leatherDk) + mcPad(c, g.fSh[0] + 1, g.sy + 3, 8.5, pal, 1, pal.leatherDk); };
    o.torsoFx = function (c, g) {
      var cl = c.clip(g.torsoD), R_ = rnd(59), ch = '', st = '', i;
      for (i = 0; i < 6; i++) { var p = tq(g, -0.9 + R_() * 1.7, 0.1 + R_() * 0.8); ch += F(blob(p[0], p[1], 3 + R_() * 2.5, 2 + R_() * 2, 6, R_, 0.5), '#000000', 0.28); }
      var s1 = tpl(g, [[-0.52, 0.02], [-0.6, 0.5], [-0.5, 1.0]]), s2 = tpl(g, [[0.66, 0.02], [0.58, 0.5], [0.68, 1.0]]);
      var sa = tq(g, -0.9, 0.08), sb = tq(g, 0.95, 0.9);
      for (i = 0; i < 6; i++) {
        var u = i / 5, q1 = tq(g, -0.56 - 0.04 * Math.sin(u * 3), u * 0.95 + 0.03), q2 = tq(g, 0.62 + 0.04 * Math.sin(u * 3), u * 0.95 + 0.03);
        st += D`M${q1[0] - 1.8},${q1[1] - 0.6} L${q1[0] + 1.8},${q1[1] + 0.6} M${q2[0] - 1.8},${q2[1] - 0.6} L${q2[0] + 1.8},${q2[1] + 0.6} `;
      }
      var studs = '';
      [0.25, 0.5, 0.75].forEach(function (t) { studs += rsDot(c, sa[0] + (sb[0] - sa[0]) * t, sa[1] + (sb[1] - sa[1]) * t, 1.2, pal); });
      return CG(ch + rsSeam(s1 + s2, 0.9, pal) + S(st, OL, 1.1) +
        S(D`M${sa[0]},${sa[1]} L${sb[0]},${sb[1]}`, OL, 6.4) + S(D`M${sa[0]},${sa[1]} L${sb[0]},${sb[1]}`, pal.leatherDk, 4.2) + studs +
        rsSeam(D`M${g.scx - 8},${g.sy + 0.5} L${g.scx + 4},${g.sy + 9} L${g.scx + 13},${g.sy + 1}`, 0.9, pal), cl) + mcSheen(c, g, pal, cl);
    };
  }
  /* robe of living flame: flames rising from the hem, glowing runes down the front, flame-licked shoulders */
  function mcRuneD(x, y, s, i) {
    var k = i % 4;
    if (k === 0) return D`M${x},${y - 2.6 * s} L${x + 2 * s},${y} L${x},${y + 2.6 * s} L${x - 2 * s},${y} Z`;
    if (k === 1) return D`M${x - 2 * s},${y - 1.8 * s} L${x},${y} L${x + 2 * s},${y - 1.8 * s} M${x - 2 * s},${y + 0.8 * s} L${x},${y + 2.6 * s} L${x + 2 * s},${y + 0.8 * s}`;
    if (k === 2) return D`M${x},${y - 2.6 * s} L${x + 2.2 * s},${y + 2 * s} L${x - 2.2 * s},${y + 2 * s} Z M${x},${y - 0.2 * s} L${x},${y + 1.2 * s}`;
    return D`M${x - 2 * s},${y - 2 * s} L${x + 2 * s},${y - 2 * s} M${x},${y - 2 * s} L${x},${y + 2.4 * s} M${x - 1.6 * s},${y + 0.4 * s} L${x + 1.6 * s},${y + 0.4 * s}`;
  }
  function mcRobe(o, pal) {
    o.torsoC = pal.cloth; o.sleeve = dk(pal.cloth, 0.1); o.bell = pal.clothDk;
    o.robe = pal.cloth;
    o.belt = pal.rockDk; o.buckle = pal.mid;
    o.pads = function (c, g) {
      var out = '';
      [[g.bSh[0] - 1, g.sy + 2, 8, 0], [g.fSh[0] + 1, g.sy + 3, 9.5, 1]].forEach(function (p) {
        var x = p[0], y = p[1], rx = p[2];
        out += mcFlames(c, x - rx * 0.9, x + rx * 0.9, y - rx * 0.3, 3, rx * 0.8, rx * 1.2, 17 + p[3], pal) + P(rsPadD(x, y, rx), c.cel(pal.clothDk)) + rsSeam(rsPadRim(x, y, rx), p[3] ? 1 : 0.8, pal);
      });
      return out;
    };
    o.robeFx = function (c, g) {
      var x = g.sx + 5, fy = g.fy, rn = '', i = 0;
      for (var y = g.hy + 4; y < fy - 22; y += 8, i++) rn += mcRuneD(x + 1.6 + (y - g.hy) * 0.08, y, 0.9, i);
      return CG(F(g.robeD, c.lg([[0, pal.clothDk, 0.9], [0.45, pal.clothDk, 0], [1, pal.clothDk, 0]]), 1) +
        P(D`M${x - 3},${g.hy - 6} L${x + 3.4},${g.hy - 6} L${x + 6.4},${fy} L${x - 2},${fy} Z`, pal.clothDk, 0) + rsSeam(rn, 0.7, pal) +
        mcFlames(c, g.wl - 14, g.wr + 16, fy - 3, 7, 12, 22, 29, pal), c.clip(g.robeD));
    };
    o.torsoFx = function (c, g) {
      var cl = c.clip(g.torsoD), a = tq(g, 0.2, 0), a1 = tq(g, 0.3, 1), rn = '', i;
      for (i = 0; i < 3; i++) { var p = tq(g, 0.26 + i * 0.02, 0.28 + i * 0.26); rn += mcRuneD(p[0] + 1.2, p[1], 0.85, i + 1); }
      return CG(F(g.torsoD, c.lg([[0, pal.clothDk, 0.7], [0.6, pal.clothDk, 0], [1, pal.clothDk, 0]])) +
        S(D`M${a[0] + 1},${a[1]} L${a1[0] + 1.6},${a1[1]}`, pal.clothDk, 6.4) + rsSeam(rn, 0.7, pal) +
        rsSeam(D`M${g.scx - 8},${g.sy + 0.5} L${g.scx + 4},${g.sy + 8} L${g.scx + 13},${g.sy + 1}`, 0.9, pal), cl);
    };
  }
  /* cinderhound legguards: dark plates, glowing seams between them, a rock knee plate */
  function mcLegs(c, g, L, front, pal) {
    var w = g.b.legW, sm = '', ch = '';
    [[L[0], L[1], [0.35, 0.72]], [L[1], L[2], [0.42, 0.75]]].forEach(function (s) {
      s[2].forEach(function (u, i) {
        var a = lpt(s[0], s[1], u, -w * 0.48), m = lpt(s[0], s[1], u + 0.05, w * 0.02), b = lpt(s[0], s[1], u - 0.02, w * 0.48);
        sm += pl([a, m, b]);
        var c1 = lpt(s[0], s[1], u - 0.25, -w * 0.3), c2 = lpt(s[0], s[1], u - 0.12, -w * 0.3);
        if (i === 0) ch += pl([c1, c2]);
      });
    });
    var sd = pl([lpt(L[0], L[1], 0.05, -w * 0.12), lpt(L[0], L[1], 0.35, -w * 0.18)]) + pl([lpt(L[1], L[2], 0.42, -w * 0.15), lpt(L[1], L[2], 0.75, -w * 0.1)]);
    var K = L[1], F2 = L[2], kd = pl([lptA(K, F2, -4.5, -w * 0.55), lptA(K, F2, -5, w * 0.45), lptA(K, F2, 3.5, w * 0.5), lptA(K, F2, 5.5, -w * 0.1), lptA(K, F2, 3, -w * 0.58)]) + 'Z';
    var pal2 = front ? pal : { glow: pal.glow, mid: dk(pal.mid, 0.25), core: dk(pal.core, 0.2) };
    return S(ch, pal.rockLt, 1.2, 0.6) + rsSeam(sm + sd, front ? 1 : 0.8, pal2) + P(kd, c.cel(front ? pal.rock : pal.rockDk), 1.5) +
      CG(rsSeam(pl([lptA(K, F2, -4, 0), lptA(K, F2, 0, w * 0.1), lptA(K, F2, 4, -w * 0.05)]), 0.7, pal2), c.clip(kd));
  }
  /* smouldering cloak: charred dark cloth, a burnt ragged hem glowing like embers, cracks and sparks rising from it */
  function mcCloak(pal) {
    function cape(g) {
      return rsCape(g, function (H0, H1, at) {
        var s = '', n = 9, R_ = rnd(41);
        for (var i = 0; i < n; i++) { var m = at((i + 0.5) / n, 2 + R_() * 5), e = at((i + 1) / n, -1 - R_() * 2); s += D` L${m[0] + (R_() - 0.5) * 3},${m[1]} L${e[0]},${e[1]}`; }
        return s;
      });
    }
    var col = function (pal) { return pal.sheen ? pal.rockDk : '#2a201c'; };
    return {
      back: function (c, g) {
        var K = cape(g), d = K.d, cl = c.clip(d), R_ = rnd(67), cr = '', sp = '', i;
        for (i = 0; i < 5; i++) {
          var p = K.at(0.1 + i * 0.2, 0), x = p[0], y = p[1];
          cr += D`M${x},${y + 2} L${x + (R_() - 0.5) * 6},${y - 6 - R_() * 4} L${x + (R_() - 0.5) * 8},${y - 14 - R_() * 8}`;
        }
        for (i = 0; i < 9; i++) { var q = K.at(R_(), -6 - R_() * 22); sp += rsDot(c, q[0], q[1], 0.6 + R_() * 0.5, pal); }
        return P(d, c.cel(col(pal))) + CG(capeFolds(g, '#000000') + F(d, c.lg([[0, pal.glow, 0], [0.62, pal.glow, 0], [0.86, pal.glow, 0.45], [1, pal.mid, 0.9]])) +
          rsSeam(cr, 0.8, pal) + sp + S(K.hem, pal.glow, 6, 0.5) + S(K.hem, pal.mid, 2.2) + S(K.hem, pal.core, 0.8), cl) + P(d, 'none');
      },
      torso: function (c, g) {
        var d = collarD(g);
        return P(d, c.cel(col(pal)), 1.8) + CG(rsSeam(D`M${g.scx - 11},${g.sy + 6} Q${g.scx - 2},${g.sy - 2} ${g.scx + 11},${g.sy + 2.8}`, 0.9, pal), c.clip(d));
      },
      front: function (c, g) {
        return drape(c, g, col(pal), null, function (c, g) {
          var bx = g.bSh[0], by = g.sy;
          return F(drapeD(g), c.lg([[0, pal.glow, 0], [0.6, pal.glow, 0], [1, pal.mid, 0.75]])) + rsDot(c, bx - 6, by + 9, 0.8, pal) + rsDot(c, bx - 1, by + 11, 0.7, pal) + rsDot(c, bx - 9, by + 4, 0.6, pal);
        });
      }
    };
  }
  rsBack('mc_cloak', mcCloak, MC, MC_H);
  rsChest('mc_robe', mcRobe, MC, MC_H);
  rsChest('mc_leather', mcLeather, MC, MC_H);
  rsChest('mc_mail', mcMail, MC, MC_H);
  rsLegs('mc_legs', mcLegs, MC, MC_H);

  /* ---- The Tidecrown Citadel: a drowned elven court ruled by a sea spirit. Sea teal and pearl with coral accents.
     Hard: abyssal indigo and black, the pearl and trim lit a bioluminescent cyan. ---- */
  var TC = {
    base: '#2a8e96', base2: '#237880', dark: '#12464e', light: '#8ad8d4', pearl: '#f2f4ec', pearlDk: '#aebcb8', coral: '#ec7258', coralDk: '#a83e2c',
    trim: '#f2f4ec', glow: null, pants: '#1e5e66'
  };
  var TC_H = {
    base: '#262466', base2: '#1e1c52', dark: '#0a0a22', light: '#4a5ac0', pearl: '#9af8ff', pearlDk: '#2a9ec0', coral: '#3e2c86', coralDk: '#1e1648',
    trim: '#9af8ff', glow: '#22e4ff', core: '#eaffff', mid: '#7af2ff', pants: '#17153e'
  };
  function tcPearl(c, x, y, r, pal) {
    return (pal.glow ? C(x, y, r * 2.4, c.rg([[0, pal.glow, 0.7], [1, pal.glow, 0]]), 0) : '') +
      C(x, y, r, c.rg([[0, '#ffffff'], [0.5, pal.pearl], [1, pal.pearlDk]], 0.36, 0.34, 0.72), 1.2) + C(x - r * 0.35, y - r * 0.35, r * 0.3, '#ffffff');
  }
  /* a line of curling wave crests from (x0,y) to (x1,y), crest height h */
  function tcWaveD(x0, x1, y, n, h) {
    var d = D`M${x0},${y}`, w = (x1 - x0) / n;
    for (var i = 0; i < n; i++) {
      var a = x0 + w * i;
      d += D` C${a + w * 0.35},${y} ${a + w * 0.45},${y - h} ${a + w * 0.72},${y - h} C${a + w * 0.95},${y - h} ${a + w * 0.92},${y - h * 0.45} ${a + w * 0.74},${y - h * 0.5} C${a + w * 0.84},${y - h * 0.1} ${a + w * 0.9},${y} ${a + w},${y}`;
    }
    return d;
  }
  /* scallop-shell pad: a fan with ridges */
  function tcShell(c, x, y, rx, pal, col) {
    var d = D`M${x - rx},${y + 3}`, rg = '', n = 5, i;
    for (i = 0; i < n; i++) {
      var a0 = Math.PI * (1 + i / n), a1 = Math.PI * (1 + (i + 1) / n), am = (a0 + a1) / 2;
      d += D` Q${x + Math.cos(am) * rx * 1.18},${y + 3 + Math.sin(am) * rx * 1.08} ${x + Math.cos(a1) * rx},${y + 3 + Math.sin(a1) * rx * 0.98}`;
      if (i) rg += D`M${x},${y + 4} L${x + Math.cos(a0) * rx * 0.92},${y + 3 + Math.sin(a0) * rx * 0.9} `;
    }
    d += D` Q${x},${y + 7} ${x - rx},${y + 3} Z`;
    return (pal.glow ? S(d, pal.glow, 3.4, 0.35) : '') + P(d, c.cel(col || pal.pearl)) + CG(S(rg, pal.pearlDk, 1, 0.9), c.clip(d)) + C(x, y + 4.5, 2, c.cel(pal.coral), 1.1);
  }
  function tcShells(pal) { return function (c, g) { return tcShell(c, g.bSh[0] - 1, g.sy + 2, 7.5, pal) + tcShell(c, g.fSh[0] + 1, g.sy + 3, 9, pal); }; }
  /* a line of pearl (Normal) or lit cyan (Hard) */
  function tcTrim(d, w, pal) { return pal.glow ? S(d, pal.glow, w * 3, 0.3) + S(d, OL, w + 1.2) + S(d, pal.mid, w) + S(d, pal.core, w * 0.4) : S(d, OL, w + 1.4) + S(d, pal.pearl, w); }
  /* robe of the abyss: flowing teal, a band of curling waves at the hem, a wave across the chest, shell shoulders */
  function tcRobe(o, pal) {
    o.torsoC = pal.base; o.sleeve = pal.base2; o.bell = pal.dark;
    o.robe = pal.base;
    o.belt = pal.coral; o.buckle = pal.pearl;
    o.pads = tcShells(pal);
    o.robeFx = function (c, g) {
      var fy = g.fy, y = fy - 14, x0 = g.wl - 16, x1 = g.wr + 18, wv = tcWaveD(x0, x1, y, 4, 7), wv2 = tcWaveD(x0 - 5, x1, y - 13, 4, 5);
      return CG(F(wv + D` L${x1},${fy + 4} L${x0},${fy + 4} Z`, pal.dark) + tcTrim(wv, 1.4, pal) + S(wv2, pal.light, 1.3, 0.8) +
        F(D`M${g.sx + 2},${g.hy - 6} L${g.sx + 8},${g.hy - 6} L${g.sx + 12},${fy} L${g.sx + 3},${fy} Z`, pal.base2, 0.9) +
        tcTrim(D`M${g.wl - 14},${fy - 5.5} Q${g.sx},${fy - 1} ${g.wr + 14},${fy - 5.5}`, 1.2, pal), c.clip(g.robeD));
    };
    o.torsoFx = function (c, g) {
      var cl = c.clip(g.torsoD), a = tq(g, -1.1, 0.62), b = tq(g, 1.2, 0.5);
      var wv = tcWaveD(a[0], b[0], (a[1] + b[1]) / 2 + 2, 3, 4.5);
      return CG(F(wv + D` L${b[0]},${g.hy + 4} L${a[0]},${g.hy + 4} Z`, pal.base2) + S(wv, pal.light, 1.3) +
        tcTrim(D`M${g.scx - 8},${g.sy} L${g.scx + 4},${g.sy + 9} L${g.scx + 13},${g.sy + 1}`, 1.3, pal), cl);
    };
  }
  /* leviathan hide tunic: sleek dark-backed hide, a pale pleated belly down the front, a fin on the shoulder */
  function tcFin(c, x, y, s, pal) {
    var d = D`M${x + 5 * s},${y + 2} C${x + 2 * s},${y - 5 * s} ${x - 6 * s},${y - 10 * s} ${x - 14 * s},${y - 11 * s} C${x - 10 * s},${y - 5 * s} ${x - 9 * s},${y} ${x - 7 * s},${y + 3} Z`;
    var rb = D`M${x - 5 * s},${y + 2} L${x - 11 * s},${y - 9 * s} M${x - 1 * s},${y + 2} L${x - 6 * s},${y - 7.5 * s} M${x + 2.5 * s},${y + 1} L${x - 1.5 * s},${y - 5 * s}`;
    return (pal.glow ? S(d, pal.glow, 3.6, 0.32) : '') + P(d, c.lg([[0, pal.light], [0.5, pal.base], [1, pal.dark]], 1, 0, 0, 1), 1.6) + CG(S(rb, pal.dark, 1, 0.85), c.clip(d)) +
      (pal.glow ? rsDot(c, x - 11 * s, y - 9.5 * s, 0.7, pal) + rsDot(c, x - 6 * s, y - 7.5 * s, 0.6, pal) : '');
  }
  function tcLeather(o, pal) {
    o.torsoC = pal.base; o.sleeve = pal.dark;
    o.belt = pal.dark; o.buckle = pal.pearl;
    o.pads = function (c, g) {
      var k = g.b.shW / 16;
      return tcFin(c, g.bSh[0], g.sy + 3, 0.7 * k, pal) + P(rsPadD(g.bSh[0] - 1, g.sy + 2, 7), c.cel(pal.dark)) +
        tcFin(c, g.fSh[0] + 1, g.sy + 2, 0.95 * k, pal) + P(rsPadD(g.fSh[0] + 1, g.sy + 3, 8.5), c.cel(pal.base2)) + tcTrim(rsPadRim(g.fSh[0] + 1, g.sy + 3, 8.5), 0.9, pal);
    };
    o.torsoFx = function (c, g) {
      var cl = c.clip(g.torsoD), bl = tpl(g, [[0.05, -0.2], [0.72, -0.2], [0.78, 0.5], [0.62, 1.1], [0.02, 1.1], [-0.08, 0.5]]) + 'Z', pl2 = '', i;
      for (i = 0; i < 7; i++) { var a = tq(g, 0.0, 0.1 + i * 0.13), b = tq(g, 0.8, 0.08 + i * 0.13); pl2 += D`M${a[0]},${a[1]} Q${(a[0] + b[0]) / 2},${(a[1] + b[1]) / 2 + 1.6} ${b[0]},${b[1]}`; }
      var bk = tpl(g, [[-1.3, -0.2], [-0.55, -0.2], [-0.7, 0.5], [-0.62, 1.1], [-1.3, 1.1]]) + 'Z';
      return CG(F(bk, pal.dark, 0.7) + F(bl, pal.pearlDk, pal.glow ? 0.35 : 0.8) + S(pl2, pal.glow ? pal.glow : pal.dark, pal.glow ? 1.1 : 0.9, pal.glow ? 0.8 : 0.55) +
        S(bl, OL, 1.4) + (pal.glow ? rsDot(c, tq(g, -0.3, 0.3)[0], tq(g, -0.3, 0.3)[1], 0.7, pal) + rsDot(c, tq(g, -0.4, 0.6)[0], tq(g, -0.4, 0.6)[1], 0.6, pal) + rsDot(c, tq(g, -0.28, 0.85)[0], tq(g, -0.28, 0.85)[1], 0.7, pal) : ''), cl);
    };
  }
  /* coral trim along a line: a band with little branching nubs */
  function tcCoral(c, d, w, pal) { return S(d, OL, w + 2) + S(d, pal.coral, w) + S(d, lt(pal.coral, 0.35), w * 0.3, 0.8); }
  /* scale hauberk: fish scales with pearl sheen, coral trim at the collar and the scalloped hem over the hips */
  function tcMail(o, pal) {
    o.torsoC = pal.base; o.sleeve = pal.base2;
    o.belt = pal.coralDk; o.buckle = pal.pearl;
    o.pads = function (c, g) {
      var out = '';
      [[g.bSh[0] - 1, g.sy + 2, 8, 0], [g.fSh[0] + 1, g.sy + 3, 9.5, 1]].forEach(function (p) {
        var d = rsPadD(p[0], p[1], p[2]);
        out += P(d, c.cel(pal.base2)) + rsScaleG(c, c.clip(d), p[0] - p[2], p[0] + p[2], p[1] - p[2], p[1] + 5, 4.2, 3, pal.dark, pal.light) + tcCoral(c, rsPadRim(p[0], p[1], p[2]), 1.6, pal);
      });
      return out;
    };
    o.torsoFx = function (c, g) {
      var cl = c.clip(g.torsoD);
      return CG(rsScaleG(c, cl, g.scx - 30, g.scx + 30, g.sy - 6, g.hy, 5.2, 3.6, pal.dark, pal.glow ? pal.glow : pal.pearl) +
        tcCoral(c, D`M${g.scx - 9},${g.sy + 1} Q${g.scx},${g.sy - 3} ${g.scx + 12},${g.sy}`, 2, pal), cl);
    };
    o.gTorso = function (c, g) {
      /* the hauberk's skirt over the hips: three rounded lobes, scaled, edged in coral along the bottom */
      var x0 = g.wl - 2, x1 = g.wr + 2.5, y = g.hy - 1, n = 3, w = (x1 - x0) / n, hem = D`M${x0},${y + 2}`, i;
      for (i = 0; i < n; i++) { var a = x0 + w * i; hem += D` C${a + w * 0.05},${y + 9.5} ${a + w * 0.95},${y + 9.5} ${a + w},${y + 2}`; }
      var d = hem + D` L${x1},${y} L${x0},${y} Z`;
      return P(d, c.cel(pal.base2), 1.4) + rsScaleG(c, c.clip(d), x0, x1, y, y + 9, 4.6, 3.2, pal.dark, pal.light) + tcCoral(c, hem, 1.6, pal);
    };
  }
  /* tide commander's legplates: scale bands, a scallop-shell knee guard */
  function tcLegs(c, g, L, front, pal) {
    var w = g.b.legW, sc = '';
    [[L[0], L[1], [0.25, 0.5, 0.75]], [L[1], L[2], [0.45, 0.65, 0.85]]].forEach(function (s) {
      s[2].forEach(function (u) {
        var a = lpt(s[0], s[1], u, -w * 0.44), m = lpt(s[0], s[1], u + 0.12, 0), b = lpt(s[0], s[1], u, w * 0.44);
        sc += D`M${a[0]},${a[1]} Q${m[0]},${m[1]} ${b[0]},${b[1]}`;
      });
    });
    var K = L[1], F2 = L[2], dx = F2[0] - K[0], dy = F2[1] - K[1], ang = Math.atan2(dy, dx) * 180 / Math.PI - 90, kc = lptA(K, F2, 1.5, -w * 0.05);
    var s = w / 9.5 * (front ? 1.3 : 1.15);
    var shell = G(tcShell(c, 0, -3, 5.6, pal, front ? pal.pearl : pal.pearlDk), 'translate(' + r1(kc[0]) + ',' + r1(kc[1]) + ') rotate(' + r1(ang) + ') scale(' + r1(s) + ')');
    return S(sc, pal.dark, 1.2, 0.9) + (pal.glow ? S(sc, pal.glow, 0.6, front ? 0.7 : 0.4) : S(sc, pal.light, 0.5, front ? 0.6 : 0.35)) + shell;
  }
  /* the drowned prince's mantle: flowing teal, a wave-cut hem edged in pearl foam, curls in the cloth, a pearl clasp */
  function tcMantle(pal) {
    function cape(g) {
      return rsCape(g, function (H0, H1, at) {
        var s = '', n = 5;
        for (var i = 0; i < n; i++) {
          var a = at(i / n), e = at((i + 1) / n), m = at((i + 0.55) / n, 6), cu = at((i + 0.8) / n, 1);
          s += D` C${a[0] - 1},${a[1] + 4} ${m[0] + 3},${m[1] + 2} ${m[0]},${m[1]} C${m[0] - 2},${m[1] - 2} ${cu[0] + 1},${cu[1] - 3} ${cu[0] - 1},${cu[1] - 1} L${e[0]},${e[1]}`;
        }
        return s;
      });
    }
    return {
      back: function (c, g) {
        var K = cape(g), d = K.d, cl = c.clip(d), wl = '', i;
        for (i = 0; i < 3; i++) {
          var p = K.at(0.18 + i * 0.3, -12 - i * 3), x = p[0], y = p[1];
          wl += D`M${x + 9},${y + 3} C${x + 4},${y - 2} ${x - 2},${y - 3} ${x - 4},${y + 1} C${x - 5},${y + 4} ${x - 1},${y + 5} ${x},${y + 2}`;
        }
        var flow = D`M${g.scx - 6},${g.sy + 2} C${g.sx - 20},${g.hy - 10} ${g.sx - 12},${g.hy + 6} ${g.sx - 26},${g.fy - 20} M${g.scx + 2},${g.sy + 4} C${g.sx - 8},${g.hy} ${g.sx - 2},${g.hy + 10} ${g.sx - 8},${g.fy - 22}`;
        return P(d, c.lg([[0, pal.base], [0.6, pal.base2], [1, pal.dark]])) + CG(S(flow, pal.dark, 1.6, 0.7) + S(wl, pal.light, 1.3, 0.85) + tcTrim(K.hem, 1.6, pal), cl) + P(d, 'none');
      },
      torso: function (c, g) {
        var d = collarD(g);
        return P(d, c.cel(pal.base), 1.8) + CG(tcTrim(D`M${g.scx - 11},${g.sy + 6} Q${g.scx - 2},${g.sy - 2} ${g.scx + 11},${g.sy + 2.8}`, 1.2, pal), c.clip(d));
      },
      front: function (c, g) {
        return drape(c, g, pal.base, null, function (c, g) { var bx = g.bSh[0], by = g.sy; return S(tcWaveD(bx - 12, bx + 8, by + 10, 2, 3.5), pal.light, 1.2, 0.85) + CG(tcTrim(drapeD(g), 1.6, pal), c.clip(drapeD(g))); }) +
          tcCoral(c, D`M${g.scx + 4},${g.sy + 4.5} l2.6,-3.2 M${g.scx + 5.5},${g.sy + 3} l-1.2,-2.6`, 1.2, pal) + tcPearl(c, g.scx + 8, g.sy + 1.5, 2.8, pal);
      }
    };
  }
  rsBack('tc_mantle', tcMantle, TC, TC_H);
  rsChest('tc_robe', tcRobe, TC, TC_H);
  rsChest('tc_leather', tcLeather, TC, TC_H);
  rsChest('tc_mail', tcMail, TC, TC_H);
  rsLegs('tc_legs', tcLegs, TC, TC_H);

  /* ---- raid weapon looks: like the armour, each weapon is ONE drawing that takes its raid's palette, registered as
     <key> (Normal) and <key>_hard (Hard). The weapon palettes are the armour palettes plus a few weapon-only colours.
     Drawn grip at the origin, blade up (-y), the same frame as the other weapon looks. ---- */
  function rsW(base, x) { var o = {}, k; for (k in base) o[k] = base[k]; for (k in x) o[k] = x[k]; return o; }
  function rsWeapon(key, fn, kind, N, H) {
    [[key, N], [key + '_hard', H]].forEach(function (v) { var f = function (c) { return fn(c, v[1]); }; GW[v[0]] = f; WP[v[0]] = f; GKIND[v[0]] = kind; });
  }
  /* a grip of colour col with a spiral wrap, half-width w, from y0 (top) to y1 */
  function rsGrip(c, w, y0, y1, col, wrap) {
    var d = '';
    for (var y = y0 + 2; y < y1; y += 3) d += D`M${-w},${y + 1.4} L${w},${y - 1}`;
    return P(D`M${-w},${y0} L${w},${y0} L${w},${y1} L${-w},${y1} Z`, c.cel(col), 1.8) + S(d, wrap, 1.2);
  }
  function rsHalo(c, x, y, rx, ry, col, a) { return E(x, y, rx, ry, c.rg([[0, col, a], [0.5, col, a * 0.4], [1, col, 0]]), 0); }
  function rsGem(c, x, y, r, p) {
    return (p.glow ? C(x, y, r * 2.4, c.rg([[0, p.glow, 0.7], [1, p.glow, 0]]), 0) : '') +
      C(x, y, r, c.rg([[0, p.gem[0]], [0.5, p.gem[1]], [1, p.gem[2]]], 0.4, 0.35, 0.7), 1.1) + C(x - r * 0.35, y - r * 0.35, r * 0.3, '#ffffff', 0, 0.8);
  }
  /* shortens a blade path: every point above the guard (y < -11) is pulled toward it by k, so long blades stay in frame */
  function rsLen(d, k) { return d.replace(/(-?\d*\.?\d+),(-?\d*\.?\d+)/g, function (m, x, y) { y = +y; return x + ',' + (y < -11 ? r1(-11 + (y + 11) * k) : y); }); }
  var BLK = 0.88;
  function rsOrbD(x, y, r) { return D`M${x - r},${y} A${r},${r} 0 1 0 ${x + r},${y} A${r},${r} 0 1 0 ${x - r},${y} Z`; }
  /* Veshmira's Lair: black dragon steel and gold (Hard: violet steel, storm-violet glowing edges) */
  var VESH_W = rsW(VESH, { blade: [[0, '#5a5468'], [0.5, '#262230'], [1, '#0e0c12']], gem: ['#ffc0b0', '#c8202a', '#4a0810'], wood: '#2a2228',
    orb: ['#ffffff', '#e0c8ff', '#9a5aff', '#3a1a7a'], orbGlow: '#a46aff', bolt: '#f4ecff' });
  var VESH_WH = rsW(VESH_H, { blade: [[0, '#4a3e66'], [0.5, '#1a1622'], [1, '#07060a']], gem: ['#ffffff', '#b07aff', '#3a1a6a'], wood: '#17131e',
    orb: ['#ffffff', '#f0e4ff', '#b07aff', '#4a1ab8'], orbGlow: '#9a5aff', bolt: '#ffffff' });
  /* Wyrmfang Greatblade: a two-handed fang, its back edge bowed, scale-chased near the hilt, a gold cutting edge and
     fuller, gold wing-swept guard with a ruby, a claw pommel */
  function veshSword(c, p) {
    var bd = rsLen('M-5.2,-11 C-6.8,-30 -5.8,-54 1.6,-82 C5.8,-60 6.8,-34 5.4,-11 Z', BLK), cl = c.clip(bd);
    var fu = rsLen('M-0.4,-15 C-0.8,-34 -0.2,-52 1.4,-66', BLK);
    var gd = 'M-4.6,-8.5 C-9.5,-8.5 -15,-11.5 -17.5,-19 C-13.5,-16 -9,-15 -5,-14.5 Z M4.6,-8.5 C9.5,-8.5 15,-11.5 17.5,-19 C13.5,-16 9,-15 5,-14.5 Z';
    return (p.glow ? rsHalo(c, 1, -42, 12, 32, p.glow, 0.32) : '') +
      P(bd, c.lg(p.blade, 0, 0, 1, 0), 2) +
      CG(rsScaleG(c, cl, -8, 8, -27, -10, 3.8, 2.8, p.line, p.sheen) + S(fu, OL, 3) + S(fu, p.glow || p.trim, 1.2) + (p.glow ? S(fu, p.core, 0.5) : '') +
        S(rsLen('M-3.8,-14 C-4.8,-32 -3.8,-54 0.6,-76', BLK), '#ffffff', 0.7, 0.3), cl) +
      rsEdge(rsLen('M5.4,-12 C6.8,-34 5.8,-60 1.6,-82', BLK), 1.2, p) +
      rsGrip(c, 2.6, -8, 13, p.dark, p.trim) +
      (p.glow ? S(gd, p.glow, 3.2, 0.35) : '') + P(gd, c.cel(p.trim), 1.6) + S('M-6,-11 C-10,-11.5 -13,-13 -15,-16 M6,-11 C10,-11.5 13,-13 15,-16', p.trimDk, 0.8) +
      P('M-5.6,-15 L5.6,-15 L4.4,-7.5 L-4.4,-7.5 Z', c.cel(p.base), 1.6) + rsGem(c, 0, -11.2, 2.2, p) +
      P('M-3.4,13 L3.4,13 L2.2,17.5 L0,22 L-2.2,17.5 Z', c.cel(p.trim), 1.5) + C(0, 15.6, 1, p.gem[1], 0);
  }
  /* Meriel's Kiss: a slim black stiletto with a gold edge, a small back barb, recurved gold quillons, a heart-cut ruby */
  function veshDagger(c, p) {
    var bd = 'M-2.4,-9 C-2.8,-19 -1.8,-29 0,-39 C1.8,-29 2.8,-19 2.4,-9 Z', q = 'M-8.4,-12.4 C-9,-8.6 -5,-7.6 0,-8.8 C5,-7.6 9,-8.6 8.4,-12.4';
    var ht = 'M0,-5.2 C-3.6,-7.6 -3.6,-11.2 0,-9.8 C3.6,-11.2 3.6,-7.6 0,-5.2 Z';
    return (p.glow ? rsHalo(c, 0, -22, 7, 20, p.glow, 0.32) : '') +
      P('M-2.4,-15 L-6.2,-20 L-2.2,-20.6 Z', c.cel(p.trim), 1.2) +
      P(bd, c.lg(p.blade, 0, 0, 1, 0), 1.8) + CG(S('M0,-11 L0,-34', p.glow || p.trim, 0.9) + S('M-1.4,-11 C-1.8,-20 -1.2,-28 -0.2,-35', '#ffffff', 0.6, 0.35), c.clip(bd)) +
      rsEdge('M2.4,-10 C2.8,-19 1.8,-29 0,-39', 0.8, p) +
      rsGrip(c, 1.9, -7, 8, p.dark, p.trim) +
      (p.glow ? S(q, p.glow, 4.8, 0.35) : '') + S(q, OL, 4) + S(q, p.trim, 2.2) + C(-8.4, -12.6, 1.5, c.cel(p.trim), 1) + C(8.4, -12.6, 1.5, c.cel(p.trim), 1) +
      (p.glow ? C(0, -8, 5, c.rg([[0, p.glow, 0.7], [1, p.glow, 0]]), 0) : '') + P(ht, c.rg([[0, p.gem[0]], [0.5, p.gem[1]], [1, p.gem[2]]], 0.4, 0.3, 0.75), 1.1) +
      P('M0,8 C3.2,9 3.2,13 0,15.5 C-3.2,13 -3.2,9 0,8 Z', c.cel(p.trim), 1.4) + C(0, 11.8, 1.1, p.gem[1], 0);
  }
  /* Stormcaller's Staff: black wood, gold bands, gold talons clutching a storm-violet orb with lightning in it */
  function veshStaff(c, p) {
    var wd = p.wood, tl = 'M-4.6,-51 C-11.5,-55 -11.8,-66 -4.2,-71.5 C-7.6,-65 -8,-57.5 -1.6,-51.5 Z', tr = 'M4.6,-51 C11.5,-55 11.8,-66 4.2,-71.5 C7.6,-65 8,-57.5 1.6,-51.5 Z';
    var tb = 'M-1.8,-55 C-3.4,-65 0,-73 2.6,-77 C3.2,-71 2.2,-63 1.8,-55 Z', o = p.orb;
    var sp = 'M9.5,-72 L12,-69 L10.5,-68 L13.5,-64 M-10,-58 L-12.5,-55 L-11,-54.4 L-13.6,-51 M-7,-76 L-9.6,-78.4 L-8.4,-79.4 L-10.8,-82';
    return rsHalo(c, 0, -63, p.glow ? 20 : 15, p.glow ? 20 : 15, p.orbGlow, p.glow ? 0.62 : 0.42) +
      P('M-2.2,38 C-2.8,10 -2,-20 -2.8,-48 L2.8,-48 C2,-20 2.8,10 2.2,38 Z', c.lg([[0, lt(wd, 0.25)], [0.5, wd], [1, dk(wd, 0.4)]], 0, 0, 1, 0), 2) +
      S('M-0.8,30 C-1.3,6 -0.8,-20 -1.3,-44', lt(wd, 0.3), 0.7, 0.6) +
      rsGrip(c, 3, -10, 12, p.dark, p.trim) + R(-3.4, -27, 6.8, 3, c.cel(p.trim), 1.3) + R(-3.2, 22, 6.4, 3, c.cel(p.trim), 1.3) +
      P('M-3,34 L3,34 L1.4,42 L-1.4,42 Z', c.cel(p.trim), 1.5) +
      (p.glow ? S(tl + ' ' + tr + ' ' + tb, p.glow, 3.4, 0.35) : '') + P(tb, c.cel(p.trim), 1.4) +
      C(0, -63, 7.2, c.rg([[0, o[0]], [0.3, o[1]], [0.7, o[2]], [1, o[3]]], 0.38, 0.35, 0.72), 1.8) +
      CG(S('M-4.4,-68 L-1,-65 L-2.6,-62.6 L1.8,-59 L0.4,-57.4', p.bolt, 1, 0.9) + S('M2,-69.4 L4.4,-66 L3,-64.6 L5,-62', p.bolt, 0.7, 0.8), c.clip(rsOrbD(0, -63, 7.2))) +
      C(-2.4, -65.8, 1.6, '#ffffff', 0, 0.75) +
      P(tl, c.cel(p.trim), 1.4) + P(tr, c.cel(p.trim), 1.4) +
      P('M-5,-52.5 L5,-52.5 L3.4,-46.5 L-3.4,-46.5 Z', c.cel(p.trim), 1.5) +
      S(sp, p.orbGlow, 2.6, 0.4) + S(sp, p.bolt, 0.9, 0.9);
  }
  rsWeapon('vesh_sword', veshSword, 'big', VESH_W, VESH_WH);
  rsWeapon('vesh_dagger', veshDagger, 'dagger', VESH_W, VESH_WH);
  rsWeapon('vesh_staff', veshStaff, 'staff', VESH_W, VESH_WH);

  /* The Magma Throne: rock and dark iron with molten cracks (Hard: obsidian and dark steel, white-hot pale blue) */
  var MC_W = rsW(MC, { iron: '#3e3836', ironLt: '#6e655e', obs: [[0, '#6a5a62'], [0.5, '#2a2026'], [1, '#0c0809']] });
  var MC_WH = rsW(MC_H, { iron: '#24222e', ironLt: '#4e4a64', obs: [[0, '#8a84b0'], [0.5, '#1c1a28'], [1, '#050407']] });
  var mcRock = function (c, p, x1, y1) { return c.lg([[0, p.rockLt], [0.5, p.rock], [1, p.rockDk]], 0, 0, x1 == null ? 1 : x1, y1 || 0); };
  var mcIron = function (c, p) { return c.lg([[0, p.ironLt], [0.5, p.iron], [1, dk(p.iron, 0.5)]], 0, 0, 1, 0); };
  /* Magmaheart Greatblade: a broad hewn-rock blade, faceted and chipped, split up the middle by a molten core */
  function mcSword(c, p) {
    var bd = rsLen('M-6.4,-11 L-7.4,-30 L-5.8,-36 L-7.2,-54 L-4.6,-70 L0.6,-82 L5,-71 L7.2,-56 L5.8,-42 L7.4,-30 L6.4,-11 Z', BLK), cl = c.clip(bd);
    var gd = 'M-13.5,-13 L-9.5,-17.5 L9.5,-17.5 L13.5,-13 L11,-7.5 L-11,-7.5 Z';
    return rsHalo(c, 0, -42, 13, 34, p.glow, 0.3) +
      P(bd, mcRock(c, p), 2.2) +
      CG(F(rsLen('M-7.4,-30 L-2,-33 L-3.6,-52 L-7.2,-54 L-5.8,-36 Z M7.2,-56 L2.6,-60 L0.6,-82 L5,-71 Z M-6.4,-11 L-2,-14 L-2,-24 L-7,-28 Z', BLK), p.rockLt, 0.4) +
        F(rsLen('M-3,-12 L3,-12 L2.4,-70 L0.4,-79 L-1.8,-70 Z', BLK), c.lg([[0, p.glow, 0.1], [0.5, p.glow, 0.5], [1, p.glow, 0.1]], 0, 0, 1, 0)) +
        (p.sheen ? F(rsLen('M-6,-14 L-4,-14 L-4.6,-62 L-6.4,-56 Z', BLK), p.sheen, 0.35) : '') +
        rsSeam(rsLen('M-1.2,-26 L-4.8,-31 M0.8,-38 L4.8,-44 M-0.6,-52 L-4.4,-58.5 M1,-64 L3.6,-69 M0.2,-20 L4,-22', BLK), 0.7, p) +
        rsSeam(rsLen('M0,-12 L-1.2,-26 L0.8,-38 L-0.6,-52 L1,-64 L0.4,-75', BLK), 1.3, p), cl) + P(bd, 'none', 2.2) +
      rsGrip(c, 2.7, -8, 13, p.leatherDk, p.rockLt) +
      P(gd, c.cel(p.rockDk), 2) + CG(rsSeam('M-11,-12 L-5,-13.8 L0,-11.6 L5,-13.8 L11,-12', 0.8, p), c.clip(gd)) + rsDot(c, 0, -12.4, 1.6, p) +
      P('M-4,13 L4,13 L4.8,17.4 L0,21.6 L-4.8,17.4 Z', c.cel(p.rock), 1.6) + rsDot(c, 0, 17, 1.1, p);
  }
  /* Harbinger's Fang: a jagged shard of obsidian, a molten glow rising from the hilt into it, a spiked rock guard */
  function mcDagger(c, p) {
    var bd = 'M-3.4,-8 L-4.4,-14 L-2.8,-16.4 L-4.2,-22 L-2.2,-25 L-3,-31 L2,-41 L2.8,-33 L4.2,-29.4 L3,-25 L4.4,-19.6 L3.2,-15.6 L4.2,-10.6 L3.4,-8 Z', cl = c.clip(bd);
    var gd = 'M-9.4,-13 L-4.4,-8 L4.4,-8 L9.4,-13 L6.6,-4.6 L-6.6,-4.6 Z';
    return rsHalo(c, 0, -14, 8, 10, p.glow, 0.4) +
      P(bd, c.lg(p.obs, 0, 0, 1, 0), 1.8) +
      CG(F('M-2.2,-25 L0.4,-28 L2,-41 L-3,-31 Z', p.obs[0][1], 0.5) + F('M-2.8,-16.4 L0,-18 L-0.2,-24 L-4.2,-22 Z', p.obs[0][1], 0.35) + F('M3,-25 L0.6,-21 L3.2,-15.6 L4.4,-19.6 Z', p.obs[0][1], 0.3) +
        F('M-6,-6 L6,-6 L6,-26 L-6,-26 Z', c.lg([[0, p.mid, 0.9], [0.45, p.glow, 0.4], [1, p.glow, 0]], 0, 1, 0, 0)) +
        rsSeam('M0.2,-8 L-0.8,-14 L0.8,-19 L-0.2,-23', 0.7, p) + S('M-2.2,-25 L2,-41', '#ffffff', 0.6, 0.5), cl) + P(bd, 'none', 1.8) +
      rsGrip(c, 2.2, -5, 8, p.leatherDk, p.rockLt) +
      P(gd, c.cel(p.rockDk), 1.6) + rsDot(c, 0, -7.6, 1.2, p) +
      P('M-2.9,8 L2.9,8 L0,13.6 Z', c.cel(p.rock), 1.4) + rsDot(c, 0, 9.8, 0.8, p);
  }
  /* Staff of the Steward: a dark iron staff topped by an iron crown full of fire */
  function mcStaff(c, p) {
    var cr = 'M-8.2,-47 L8.2,-47 L8.6,-52 L10.6,-60.4 L6,-55.4 L3.8,-61.8 L0,-55.8 L-3.8,-61.8 L-6,-55.4 L-10.6,-60.4 L-8.6,-52 Z';
    return rsHalo(c, 0, -64, 17, 20, p.glow, 0.42) +
      P('M-2.4,38 L-2.8,-46 L2.8,-46 L2.4,38 Z', mcIron(c, p), 2) +
      rsSeam('M-2.6,-20 L2.6,-18.6 M-2.6,24 L2.6,25.4', 0.6, p) +
      rsGrip(c, 3.1, -10, 12, p.leatherDk, p.ironLt) + R(-3.6, -32, 7.2, 3.2, c.cel(p.rockDk), 1.3) + R(-3.4, 18, 6.8, 3, c.cel(p.rockDk), 1.3) +
      P('M-3,34 L3,34 L0,44 Z', c.cel(p.iron), 1.5) +
      E(0, -52, 8.4, 2.6, dk(p.iron, 0.5), 1.4) + mcFlames(c, -8.6, 8.6, -50, 3, 21, 29, 31, p) +
      C(0, -55, 4.4, c.rg([[0, p.core, 0.95], [0.5, p.mid, 0.6], [1, p.glow, 0]]), 0) +
      P(cr, mcIron(c, p), 1.8) + S('M-8.2,-50 L8.2,-50', p.ironLt, 0.8, 0.7) +
      rsDot(c, -4.6, -50.2, 1, p) + rsDot(c, 0, -50.4, 1.2, p) + rsDot(c, 4.6, -50.2, 1, p) +
      P('M-4.6,-47 L4.6,-47 L3.2,-43 L-3.2,-43 Z', c.cel(p.rockDk), 1.4) +
      rsDot(c, -7, -82, 0.8, p) + rsDot(c, 5, -85, 0.7, p) + rsDot(c, 10, -76, 0.6, p);
  }
  /* Ashbound Scepter: a ceremonial iron rod, a rock cage of flame-tongued ribs around a molten heart, a stone flame on top */
  function mcMace(c, p) {
    var rib = 'M-3,-28 C-11.5,-31 -11.5,-46 -2,-50.5 M3,-28 C11.5,-31 11.5,-46 2,-50.5';
    return rsHalo(c, 0, -40, 14, 16, p.glow, 0.45) +
      P('M-2.1,11 L-2.3,-27 L2.3,-27 L2.1,11 Z', mcIron(c, p), 2) + rsSeam('M-2.3,-18 L2.3,-16.8 M-2.3,-22.4 L2.3,-21.2', 0.6, p) +
      rsGrip(c, 2.4, -1, 10, p.leatherDk, p.ironLt) + P('M-2.8,10 L2.8,10 L0,15.5 Z', c.cel(p.rock), 1.4) + rsDot(c, 0, 11.6, 0.8, p) +
      S('M-1,-29 C-5.6,-33 -5.6,-45 -1,-50 M1,-29 C5.6,-33 5.6,-45 1,-50', OL, 3.4) + S('M-1,-29 C-5.6,-33 -5.6,-45 -1,-50 M1,-29 C5.6,-33 5.6,-45 1,-50', p.rockDk, 1.6) +
      C(0, -39, 5.6, c.rg([[0, p.core], [0.45, p.mid], [1, p.glow]], 0.4, 0.4, 0.7), 1.4) +
      P('M-10.4,-37 L-15,-40.6 L-10.6,-42.6 Z M10.4,-37 L15,-40.6 L10.6,-42.6 Z M-9.6,-31 L-13,-30.4 L-10.6,-34 Z M9.6,-31 L13,-30.4 L10.6,-34 Z', c.cel(p.rock), 1.3) +
      S(rib, OL, 5) + S(rib, p.rock, 3) + S('M-3.6,-29.6 C-9.6,-33 -10,-43 -4,-48.6', p.rockLt, 0.8, 0.7) +
      R(-4.4, -29.5, 8.8, 3.6, c.cel(p.rockDk), 1.4) +
      P('M0,-61 C3,-57 3.8,-53.5 2.4,-50 L-2.4,-50 C-3.8,-53.5 -1.4,-56.5 0,-61 Z', c.cel(p.rockDk), 1.4) +
      F('M0,-58 C1.6,-55.5 2,-53 1.2,-51 L-1.2,-51 C-2,-53 -0.6,-55 0,-58 Z', p.mid) + F('M0,-55.4 C0.8,-54 1,-52.6 0.5,-51.4 L-0.5,-51.4 C-1,-52.6 -0.3,-53.8 0,-55.4 Z', p.core);
  }
  /* Emberfall: a huge two-handed hammer whose head is three hewn basalt columns bound with an iron band, lava in the
     joints and dripping from the base, a stone haft with molten cracks */
  function mcHammer(c, p) {
    var hf = 'M-3.2,36 L-3.6,-42 L3.6,-42 L3.2,36 Z';
    var A = 'M-19.5,-42 L-20,-66 L-17,-69.5 L-9.4,-69.5 L-7,-66 L-7,-43.5 Z', B = 'M-7,-38.5 L-7,-73 L-4,-77 L4,-77 L7,-73 L7,-38.5 Z', Cc = 'M7,-43.5 L7,-68 L9.4,-71.5 L17,-71.5 L20,-68 L19.5,-41 Z';
    var tops = 'M-20,-66 L-17,-69.5 L-9.4,-69.5 L-7,-66 Z M-7,-73 L-4,-77 L4,-77 L7,-73 Z M7,-68 L9.4,-71.5 L17,-71.5 L20,-68 Z';
    var drip = 'M-3,-38.6 C-3,-35 -1.6,-33 -1.2,-30.6 C-0.6,-33 0.4,-35.5 1,-38.6 Z M-15.6,-42.4 C-15.4,-40 -14.6,-38.6 -14.4,-37 C-13.8,-38.6 -13.4,-40.2 -13.2,-42.6 Z M12.4,-42 C12.6,-39.4 13.2,-38 13.4,-36.2 C14,-38 14.4,-39.6 14.6,-41.8 Z';
    var band = 'M-20.4,-60.5 L20.4,-61.5 L20.4,-55 L-20.4,-54 Z';
    return rsHalo(c, 0, -48, 26, 22, p.glow, 0.32) +
      P(hf, mcRock(c, p), 2.2) + CG(rsSeam('M0.6,-38 L-0.8,-30 L0.8,-22 M-0.6,22 L0.8,28', 0.6, p), c.clip(hf)) +
      rsGrip(c, 3.4, -10, 14, p.leatherDk, p.rockLt) + R(-4.4, -24, 8.8, 3.4, c.cel(p.iron), 1.4) + R(-4.2, 16, 8.4, 3, c.cel(p.iron), 1.3) +
      P('M-5,35 L5,35 L5.6,39.6 L0,43 L-5.6,39.6 Z', c.cel(p.rock), 1.8) + rsDot(c, 0, 39, 1, p) +
      G(S(drip, p.glow, 3, 0.4) + F(drip, p.mid) + F('M-1.6,-38 C-1.4,-35 -1.2,-34 -1.1,-32.6 C-0.8,-34 -0.4,-35.6 -0.2,-38 Z', p.core) +
      P(A, mcRock(c, p, 1, 0.3), 2.2) + P(Cc, mcRock(c, p, 1, 0.3), 2.2) + P(B, mcRock(c, p, 1, 0.3), 2.2) +
      F(tops, p.rockLt, 0.55) + S('M-7,-73 L7,-73 M-20,-66 L-7,-66 M7,-68 L20,-68', OL, 1.1, 0.8) +
      (p.sheen ? F('M-5,-71 L-2.6,-71 L-3.4,-40 L-5.4,-40 Z M9,-66 L11,-66 L10.6,-44 L8.8,-44 Z', p.sheen, 0.3) : '') +
      S('M-17.6,-50 L-14.6,-51 M-11,-64 L-8.6,-65 M3,-46 L5.4,-47 M14.4,-64.6 L17,-65.6 M10,-48 L13,-48.6', p.rockLt, 1.1, 0.7) +
      rsSeam('M-7,-66 L-7,-43.5 M7,-68 L7,-43.5 M-13,-53 L-14.6,-48 L-12.6,-44 M2,-73 L0.4,-66 M0,-53 L2,-47 L0.4,-41 M14,-52 L12.4,-47 M-14,-66 L-12.6,-62.4', 0.9, p) +
      P(band, c.cel(p.iron), 1.8) + S('M-20.4,-57.4 L20.4,-58.4', dk(p.iron, 0.4), 0.8, 0.8) +
      C(-14, -57.6, 1.2, c.cel(p.ironLt), 0.8) + C(0, -58, 1.2, c.cel(p.ironLt), 0.8) + C(14, -58.4, 1.2, c.cel(p.ironLt), 0.8) +
      rsDot(c, -12, -77, 0.8, p) + rsDot(c, 10, -80, 0.7, p) + rsDot(c, 2, -85, 0.6, p), 'translate(0,9)');
  }
  rsWeapon('mc_sword', mcSword, 'big', MC_W, MC_WH);
  rsWeapon('mc_dagger', mcDagger, 'dagger', MC_W, MC_WH);
  rsWeapon('mc_staff', mcStaff, 'staff', MC_W, MC_WH);
  rsWeapon('mc_mace', mcMace, 'hammer', MC_W, MC_WH);
  rsWeapon('mc_hammer', mcHammer, 'big', MC_W, MC_WH);

  /* The Tidecrown Citadel: pearl-white elven steel, teal and coral (Hard: abyssal indigo steel, everything lit cyan) */
  var TC_W = rsW(TC, { blade: [[0, '#ffffff'], [0.5, '#e2eae6'], [1, '#94aaac']], steel: [[0, '#f4f7fa'], [0.5, '#b4c6ca'], [1, '#5a6e74']], shaft: '#5a2a30',
    orb: ['#ffffff', '#c8fff6', '#3ad6cc', '#0a5a66'], orbGlow: '#4ae8dc' });
  var TC_WH = rsW(TC_H, { blade: [[0, '#7a82e0'], [0.5, '#2e2c7a'], [1, '#0e0e2e']], steel: [[0, '#7a80d0'], [0.5, '#30306e'], [1, '#10102e']], shaft: '#1e1c52',
    orb: ['#ffffff', '#eaffff', '#22e4ff', '#1a2a8a'], orbGlow: '#22e4ff' });
  /* a fine line: col on Normal, a lit cyan line on Hard */
  function tcLine(d, w, p, col) { return p.glow ? S(d, p.glow, w * 3, 0.3) + S(d, p.mid, w) + S(d, p.core, w * 0.4) : S(d, col, w); }
  /* Tidecrown, Blade of the Prince: a long slender pearl-steel blade, its back edge breaking in three wave crests, a teal
     fuller with a wave etched in it, a crescent guard curling like surf with a small crown and a pearl */
  function tcSword(c, p) {
    var bd = rsLen('M-3.8,-11 L-4,-30 C-6.6,-33 -7.6,-37 -6.4,-41.4 C-5.8,-38.6 -4.8,-37.6 -4,-38 L-3.9,-48 C-6.3,-51 -7.1,-55 -5.9,-59 C-5.3,-56.2 -4.4,-55.2 -3.7,-55.6 L-3.3,-63.4 C-5.1,-66.4 -5.5,-69.4 -4.5,-72.4 C-3.6,-70.2 -2.6,-69.4 -1.9,-69.8 C-1,-74 0,-77 1,-81 C3.4,-66 4.6,-46 4.4,-30 L4,-11 Z', BLK), cl = c.clip(bd);
    var gd = 'M-14.5,-18.5 C-12.5,-11.5 -6.5,-8 0,-8.5 C6.5,-8 12.5,-11.5 14.5,-18.5 C11.5,-14.5 6.5,-13 0,-13.5 C-6.5,-13 -11.5,-14.5 -14.5,-18.5 Z';
    var wv = rsLen('M0,-16 C-1.3,-22 1.3,-27 0,-33 C-1.3,-39 1.3,-44 0,-50 C-1.3,-56 1.1,-60 0,-64', BLK);
    return (p.glow ? rsHalo(c, 0, -42, 12, 32, p.glow, 0.3) : '') +
      P(bd, c.lg(p.blade, 0, 0, 1, 0), 1.9) +
      CG(F(rsLen('M-1.4,-13 L1.4,-13 L1.4,-62 L0,-67 L-1.4,-62 Z', BLK), p.base, 0.9) + tcLine(wv, 0.8, p, p.light) +
        S(rsLen('M2.6,-13 L2.8,-30 C3,-46 2.2,-62 0.6,-74', BLK), '#ffffff', 0.8, p.glow ? 0.25 : 0.7), cl) +
      tcLine(rsLen('M4,-12 L4.4,-30 C4.6,-46 3.4,-66 1,-81', BLK), 0.9, p, '#ffffff') +
      tcLine(rsLen('M-6.4,-41.4 C-5.8,-38.6 -4.8,-37.6 -4,-38 M-5.9,-59 C-5.3,-56.2 -4.4,-55.2 -3.7,-55.6 M-4.5,-72.4 C-3.6,-70.2 -2.6,-69.4 -1.9,-69.8', BLK), 0.7, p, p.light) +
      rsGrip(c, 2.5, -8, 13, p.dark, p.pearl) +
      (p.glow ? S(gd, p.glow, 3.2, 0.35) : '') + P(gd, c.cel(p.base), 1.6) +
      tcTrim('M-13.4,-16 C-10.5,-12.4 -6,-11.2 0,-11.4 C6,-11.2 10.5,-12.4 13.4,-16', 0.8, p) +
      tcTrim('M-14.5,-18.5 C-16.8,-16 -15.8,-13 -13,-13.6 M14.5,-18.5 C16.8,-16 15.8,-13 13,-13.6', 0.9, p) +
      P('M-4.2,-13.2 L-3.2,-17.6 L-1.6,-13.8 L0,-19.4 L1.6,-13.8 L3.2,-17.6 L4.2,-13.2 Z', c.cel(p.pearl), 1.2) +
      tcPearl(c, 0, -10.8, 2.1, p) +
      P('M-3.4,13 L3.4,13 L2.4,16 L-2.4,16 Z', c.cel(p.coral), 1.3) + tcPearl(c, 0, 18.6, 2.8, p);
  }
  /* Fang of the Drowned Court: a curved fang of nacre with an iridescent sheen, a guard of branching coral, a pearl pommel */
  function tcDagger(c, p) {
    var bd = 'M-3,-8 C-4.6,-18 -3,-29 3.6,-39 C3.8,-28 3.8,-18 3,-8 Z';
    var co = 'M-2,-8.4 C-5,-9 -7.4,-11.6 -8.6,-15.4 M-6,-10.2 C-7.4,-9.4 -8.6,-9.8 -9.6,-11 M2,-8.4 C5,-8.6 7.6,-10.6 9,-13.8 M6.2,-9.6 C7.4,-8.2 8.4,-7.6 9.6,-7.8';
    return (p.glow ? rsHalo(c, 1, -22, 8, 20, p.glow, 0.3) : '') +
      P(bd, c.lg(p.blade, 0, 0, 1, 0), 1.8) +
      CG(S('M-1.2,-11 C-1.8,-19 -0.2,-28 2.8,-35', p.glow ? p.glow : p.coral, 1.3, p.glow ? 0.5 : 0.35) + S('M1,-10 C1,-18 1.6,-26 3.2,-33', p.glow ? p.mid : p.light, 1.2, 0.55) +
        S('M-2.4,-11 C-3.2,-19 -1.8,-28 2.6,-36.4', '#ffffff', 0.7, p.glow ? 0.3 : 0.8), c.clip(bd)) +
      tcLine('M3,-9 C3.8,-18 3.8,-28 3.6,-39', 0.8, p, '#ffffff') +
      rsGrip(c, 2.1, -6, 8.5, p.coralDk, p.pearl) +
      tcCoral(c, co, 1.5, p) + P('M-4,-9.8 L4,-9.8 L3.4,-6 L-3.4,-6 Z', c.cel(p.coralDk), 1.3) +
      (p.glow ? rsDot(c, -8.6, -15.4, 0.7, p) + rsDot(c, 9, -13.8, 0.7, p) + rsDot(c, -9.6, -11, 0.5, p) + rsDot(c, 9.6, -7.8, 0.5, p) : '') +
      tcPearl(c, 0, 11, 2.6, p);
  }
  /* Nal'veshra's Abyssal Staff: a twisting shaft of dark coral, branches spreading round a glowing deep-sea orb, bubbles */
  function tcStaff(c, p) {
    var sd = 'M-2.2,38 C-4.2,26 0.6,16 -2,4 C-4.4,-8 0.4,-20 -2.2,-32 C-3.4,-38 -2.6,-43 -2.8,-47 L2.8,-47 C2.8,-42 3.8,-36 2.6,-30 C0.2,-18 4.8,-6 2.4,6 C0,18 4.4,26 2.4,38 Z';
    var br = 'M-1.6,-46 C-6,-50 -9.6,-55 -9.4,-62 C-9.2,-67 -7,-70 -5,-73 M-8.8,-58 C-11.6,-58 -13,-60 -13.6,-63 M1.6,-46 C6,-50 9.6,-56 9,-63 C8.6,-68 6.4,-71 4,-74 M8.8,-60 C11.4,-61 12.6,-64 12.8,-67';
    var fr = 'M-7,-56.4 C-3,-54 2,-54.6 6.6,-58.6', o = p.orb, sc = lt(p.shaft, 0.2);
    var tips = [[-5, -73], [-13.6, -63], [4, -74], [12.8, -67]], tp = '';
    tips.forEach(function (t) { tp += p.glow ? rsDot(c, t[0], t[1], 0.8, p) : C(t[0], t[1], 1.5, c.cel(p.coral), 1); });
    var bub = function (x, y, r) { return C(x, y, r, p.orbGlow, 0, 0.45) + C(x - r * 0.3, y - r * 0.3, r * 0.35, '#ffffff', 0, 0.85); };
    return rsHalo(c, 0, -62, p.glow ? 21 : 16, p.glow ? 21 : 16, p.orbGlow, p.glow ? 0.62 : 0.45) +
      P(sd, c.lg([[0, lt(p.shaft, 0.25)], [0.5, p.shaft], [1, dk(p.shaft, 0.45)]], 0, 0, 1, 0), 2) +
      CG(S('M-4,30 L4,25 M-4,18 L4,13 M-4,6 L4,1 M-4,-6 L4,-11 M-4,-18 L4,-23 M-4,-30 L4,-35 M-4,-40 L4,-45', dk(p.shaft, 0.5), 1.3) +
        S('M-3,28 L4,24 M-3,16 L4,12 M-3,4 L4,0 M-3,-8 L4,-12 M-3,-20 L4,-24 M-3,-32 L4,-36', lt(p.shaft, 0.35), 0.6, 0.7), c.clip(sd)) +
      (p.glow ? rsDot(c, 1.6, 20, 0.6, p) + rsDot(c, -1.2, -2, 0.6, p) + rsDot(c, 1.2, -26, 0.6, p) : '') +
      rsGrip(c, 3, -8, 10, p.dark, p.pearl) +
      P('M-2.8,34 L2.8,34 L1.4,41 L-1.4,41 Z', c.cel(p.pearl), 1.4) +
      S(br, OL, 4.6) + S(br, sc, 2.6) + S(br, p.coral, 0.9, 0.6) + tp +
      C(0, -62, 6.8, c.rg([[0, o[0]], [0.3, o[1]], [0.7, o[2]], [1, o[3]]], 0.38, 0.35, 0.72), 1.6) +
      S('M-3.6,-63 C-2.6,-66 1.4,-67 3.4,-64', '#ffffff', 0.7, 0.6) + C(-2.2, -64.8, 1.4, '#ffffff', 0, 0.8) +
      S(fr, OL, 4.2) + S(fr, sc, 2.4) + S(fr, p.coral, 0.8, 0.6) +
      P('M-3.8,-47 L3.8,-47 L2.8,-43.4 L-2.8,-43.4 Z', c.cel(p.dark), 1.3) +
      bub(8.6, -76, 1.4) + bub(-6.4, -80, 1.1) + bub(2.6, -85, 0.9);
  }
  /* Undertow: a steel mace whose head is a short trident above anchor flukes, crusted with coral, a scallop shell on its face */
  function tcMace(c, p) {
    var hd = 'M-7,-27 C-10.4,-31.5 -10.4,-40.5 -7,-45 L7,-45 C10.4,-40.5 10.4,-31.5 7,-27 Z';
    var fl = 'M-8,-30 C-14,-30.4 -17.4,-35.4 -17.4,-42.8 L-20,-36.8 L-15.8,-37.6 C-14.4,-35.2 -11.8,-34.4 -8.6,-35 Z M8,-30 C14,-30.4 17.4,-35.4 17.4,-42.8 L20,-36.8 L15.8,-37.6 C14.4,-35.2 11.8,-34.4 8.6,-35 Z';
    var pr = 'M-1.7,-44 L-1.7,-56 L0,-63 L1.7,-56 L1.7,-44 Z M-6.6,-44 L-7,-52 L-8.6,-57.4 L-4.6,-53.2 L-4.4,-44 Z M6.6,-44 L7,-52 L8.6,-57.4 L4.6,-53.2 L4.4,-44 Z';
    var st = c.lg(p.steel, 0, 0, 1, 0);
    return (p.glow ? rsHalo(c, 0, -42, 16, 20, p.glow, 0.35) : '') +
      P('M-2.2,11 L-2.4,-27 L2.4,-27 L2.2,11 Z', st, 2) +
      rsGrip(c, 2.5, -1, 10, p.coralDk, p.pearl) + tcPearl(c, 0, 12.6, 2.4, p) +
      (p.glow ? S(pr + ' ' + fl, p.glow, 3.2, 0.35) : '') +
      P(pr, st, 1.6) + tcLine('M0,-62 L0,-46', 0.6, p, '#ffffff') +
      P(fl, st, 1.6) +
      P(hd, c.lg([[0, p.light], [0.45, p.base], [1, p.dark]], 0.2, 0, 0.8, 1), 2) + S('M-5.6,-43 C-8,-39 -8,-33 -5.6,-29', '#ffffff', 0.9, p.glow ? 0.3 : 0.6) +
      tcTrim('M-7.4,-43.6 L7.4,-43.6 M-7.4,-28.4 L7.4,-28.4', 1, p) +
      P(blob(-6.6, -29.6, 2.6, 1.8, 5, rnd(1301), 0.6), c.cel(p.coral), 1) + P(blob(-3, -27.8, 2, 1.4, 5, rnd(1303), 0.6), c.cel(p.coral), 0.9) +
      P(blob(7.4, -43.4, 1.8, 1.3, 5, rnd(1302), 0.6), c.cel(p.coral), 0.9) +
      tcShell(c, 0, -39.4, 4.6, p) +
      R(-4, -28.6, 8, 3.2, c.cel(p.pearlDk), 1.3);
  }
  rsWeapon('tc_sword', tcSword, 'big', TC_W, TC_WH);
  rsWeapon('tc_dagger', tcDagger, 'dagger', TC_W, TC_WH);
  rsWeapon('tc_staff', tcStaff, 'staff', TC_W, TC_WH);
  rsWeapon('tc_mace', tcMace, 'hammer', TC_W, TC_WH);
  /* ================= the Trialsworn looks (v10.8): rewards for timed Trials at 60 =================
     Polished silver steel, midnight-blue cloth and grips, gold fittings and an hourglass with pale-gold sand.
     Every piece is ONE drawing that takes a tier t: 0 = the plain key, 1 = <key>_t15 (the sand glows, a faint light runs
     along the trim), 2 = <key>_t20 (radiant: brighter glow, a soft aura, small drifting sand motes). The cloak also
     takes a palette, so the monthly cloaks (trialsworn_cloak_mYYYYMM) are the same cloak recoloured. */
  var TWM = '#22326a', TWMD = '#141d42', TWS = ['#ffffff', '#dde3eb', '#94a0b2'], TWSM = '#c6cfdb', TWG = '#f3dc8e';
  var TWHEAD = [[0, '#f4f7fa'], [0.45, '#c3ccd8'], [1, '#6e7b8e']];
  /* the base palette: cloth (lt/mid/dk), edge band (edge, hi = its highlight, trim = the line inside it), and the
     hourglass (frame metal, glass top/mid/bottom, sand) */
  var TWP = { lt: lt(TWM, 0.12), cloth: TWM, dk: TWMD, edge: '#b4c0d2', hi: '#ffffff', trim: GOLD, frame: GOLD, glass: ['#3e5aa8', TWM, TWMD], sand: TWG };
  /* an hourglass centred on (x,y), s = half its height: caps and posts in the frame metal, the glass, sand running.
     lv = how much the sand glows (0 none .. 2 radiant) */
  function twGlass(c, x, y, s, lv, pal) {
    pal = pal || TWP; lv = lv || 0;
    var w = s * 0.6, nk = s * 0.1, cap = Math.max(1.4, s * 0.2), sw = s > 6 ? 1.5 : s > 4 ? 1.2 : 1, out = '';
    var sand = lv >= 1 ? lt(pal.sand, 0.3) : pal.sand, core = lv >= 1 ? '#ffffff' : lt(pal.sand, 0.5);
    var gd = D`M${x - w},${y - s} L${x + w},${y - s} C${x + w},${y - s * 0.4} ${x + nk},${y - s * 0.24} ${x + nk},${y} C${x + nk},${y + s * 0.24} ${x + w},${y + s * 0.4} ${x + w},${y + s} L${x - w},${y + s} C${x - w},${y + s * 0.4} ${x - nk},${y + s * 0.24} ${x - nk},${y} C${x - nk},${y - s * 0.24} ${x - w},${y - s * 0.4} ${x - w},${y - s} Z`;
    if (lv > 0) out += C(x, y, s * (1.3 + lv * 0.45), c.rg([[0, '#fff6d2', Math.min(0.95, 0.45 + lv * 0.25)], [0.4, pal.sand, 0.14 + lv * 0.14], [1, pal.sand, 0]]), 0);
    out += P(gd, c.lg([[0, pal.glass[0]], [0.55, pal.glass[1]], [1, pal.glass[2]]], 0, 0, 1, 0), 0) +
      CG(F(D`M${x - w},${y - s * 0.42} L${x + w},${y - s * 0.42} L${x + w},${y} L${x - w},${y} Z`, sand) +
        F(D`M${x - w},${y + s} L${x - w},${y + s * 0.66} Q${x},${y + s * 0.2} ${x + w},${y + s * 0.66} L${x + w},${y + s} Z`, sand) +
        S(D`M${x},${y} L${x},${y + s * 0.5}`, core, Math.max(0.6, s * 0.1)) +
        (s > 4 ? S(D`M${x - w * 0.55},${y - s * 0.86} L${x - w * 0.55},${y - s * 0.56}`, '#ffffff', s * 0.1, 0.7) : ''), c.clip(gd)) +
      P(gd, 'none', sw);
    var px = w + cap * 0.35, pd = D`M${x - px},${y - s} L${x - px},${y + s} M${x + px},${y - s} L${x + px},${y + s}`;
    if (s > 3.5) out += S(pd, OL, cap * 0.55 + sw * 1.6) + S(pd, pal.frame, cap * 0.55);
    var cw = w + cap * 0.9;
    return out + R(x - cw, y - s - cap, cw * 2, cap, c.cel(pal.frame), sw) + R(x - cw, y + s, cw * 2, cap, c.cel(pal.frame), sw);
  }
  /* tier effects: light along a trim line (t >= 1), a soft aura behind (t = 2), drifting sand motes (t = 2) */
  function twTrim(d, t, w) { return t ? S(d, TWG, (w || 2.4) + t * 1.2, 0.16 + t * 0.1) + S(d, '#fffbe8', t > 1 ? 0.9 : 0.6, 0.9) : ''; }
  function twAura(c, x, y, rx, ry, t) { return t > 1 ? E(x, y, rx, ry, c.rg([[0, '#fff4c8', 0.55], [0.45, TWG, 0.26], [1, TWG, 0]]), 0) : ''; }
  function twMotes(c, pts, t) {
    if (t < 2) return '';
    return pts.map(function (p) {
      var x = p[0], y = p[1], r = p[2] || 1.4;
      return C(x, y, r * 2.8, c.rg([[0, '#fff4c8', 0.6], [1, TWG, 0]]), 0) + P(D`M${x},${y - r * 1.5} L${x + r * 0.7},${y} L${x},${y + r * 1.5} L${x - r * 0.7},${y} Z`, '#fff8dc', 0.6);
    }).join('');
  }
  /* midnight-blue grip with a silver spiral wrap, from y0 (top) to y1 */
  function twGrip(c, w, y0, y1) {
    var d = '';
    for (var y = y0 + 2; y < y1; y += 3) d += D`M${-w},${y + 1.4} L${w},${y - 1}`;
    return P(D`M${-w},${y0} L${w},${y0} L${w},${y1} L${-w},${y1} Z`, c.cel(TWM), 1.8) + S(d, TWS[1], 1.2);
  }
  function twPommel(c, y, k) {
    k = k || 1;
    return P(D`M${-3 * k},${y} L${3 * k},${y} L${2.2 * k},${y + 3.6 * k} L0,${y + 6 * k} L${-2.2 * k},${y + 3.6 * k} Z`, c.cel(GOLD), 1.5) + C(0, y + 2.6 * k, 1.1 * k, TWM, 0);
  }
  /* silver guard arms swept up, gold tips, the hourglass at the centre */
  function twGuard(c, y, a, s, t) {
    var arm = D`M-3,${y + 2} C-7,${y + 2} ${-a + 2},${y} ${-a},${y - 4} C${-a + 3},${y - 2.6} -6,${y - 2.4} -3,${y - 2.4} Z M3,${y + 2} C7,${y + 2} ${a - 2},${y} ${a},${y - 4} C${a - 3},${y - 2.6} 6,${y - 2.4} 3,${y - 2.4} Z`;
    return P(arm, c.lg(TWS, 0, 0, 0, 1), 1.6) + twTrim(D`M${-a},${y - 4} C${-a + 3},${y - 2.6} -6,${y - 2.4} -3,${y - 2.4} M${a},${y - 4} C${a - 3},${y - 2.6} 6,${y - 2.4} 3,${y - 2.4}`, t, 1.4) +
      C(-a, y - 4, 1.9, c.cel(GOLD), 1.2) + C(a, y - 4, 1.9, c.cel(GOLD), 1.2) + twGlass(c, 0, y, s, t);
  }
  var TWSHAFT = [[0, lt(TWM, 0.25)], [0.5, TWM], [1, TWMD]];
  var GWT = {
    trialsworn_sword: function (c, t) {
      var bd = 'M-3.8,-8 L-3.8,-45 L0,-55 L3.8,-45 L3.8,-8 Z';
      return twAura(c, 0, -32, 11, 30, t) + P(bd, c.lg(TWS, 0, 0, 1, 0), 2) +
        CG(F('M-1.2,-12 L1.2,-12 L1.2,-41 L0,-44 L-1.2,-41 Z', TWM) + S('M0,-14 L0,-40', TWG, t ? 1.1 : 0.6, 0.9) + S('M-2.8,-10 L-2.8,-45', '#ffffff', 0.9, 0.8), c.clip(bd)) +
        twTrim('M-3.8,-9 L-3.8,-45 L0,-55 L3.8,-45 L3.8,-9', t, 1.6) +
        twGrip(c, 2.5, -3, 10) + twPommel(c, 9.5) + twGuard(c, -7.5, 13, 4.6, t) +
        twMotes(c, [[-8, -26, 1.2], [7.5, -38, 1.4], [-5, -50, 1], [9, -18, 1]], t);
    },
    trialsworn_dagger: function (c, t) {
      var bd = 'M-3.2,-7 L-3.2,-25 L0,-33 L3.2,-25 L3.2,-7 Z';
      return twAura(c, 0, -18, 9, 18, t) + P(bd, c.lg(TWS, 0, 0, 1, 0), 1.9) +
        CG(F('M-1,-10 L1,-10 L1,-23 L0,-26 L-1,-23 Z', TWM) + S('M-2.3,-9 L-2.3,-26', '#ffffff', 0.8, 0.8), c.clip(bd)) +
        twTrim('M-3.2,-8 L-3.2,-25 L0,-33 L3.2,-25 L3.2,-8', t, 1.4) +
        twGrip(c, 2.2, -2.5, 8.5) + twPommel(c, 8, 0.85) + twGuard(c, -6.5, 9.5, 3.8, t) +
        twMotes(c, [[-7, -20, 1.1], [6.5, -28, 1.2], [7, -12, 0.9]], t);
    },
    /* the staff tops out in a floating hourglass held in a silver cradle */
    trialsworn_staff: function (c, t) {
      var arm = 'M-2.6,-47 C-9.5,-50 -11.5,-59 -7.5,-68 M2.6,-47 C9.5,-50 11.5,-59 7.5,-68';
      var sp = function (x, y, r) { return P(D`M${x},${y - r} L${x + r * 0.55},${y} L${x},${y + r} L${x - r * 0.55},${y} Z`, '#fff4c8', 0.8); };
      return twAura(c, 0, -60, 17, 17, t) +
        P('M-2.2,38 L-2.6,-46 L2.6,-46 L2.2,38 Z', c.lg(TWSHAFT, 0, 0, 1, 0), 2) +
        twGrip(c, 3.2, -10, 12) +
        R(-3.4, -26, 6.8, 3, c.lg(TWS, 0, 0, 0, 1), 1.3) + R(-3.2, 22, 6.4, 3, c.lg(TWS, 0, 0, 0, 1), 1.3) +
        P('M-3.2,34 L3.2,34 L1.6,41.5 L-1.6,41.5 Z', c.cel(GOLD), 1.5) +
        S(arm, OL, 5.4) + S(arm, TWSM, 2.8) + S('M-3,-48 C-9,-51 -10.6,-58 -8,-66', '#ffffff', 0.8, 0.7) + twTrim(arm, t, 1.4) +
        C(-7.5, -68, 1.8, c.cel(GOLD), 1.1) + C(7.5, -68, 1.8, c.cel(GOLD), 1.1) +
        P('M-5,-50 L5,-50 L3.4,-45 L-3.4,-45 Z', c.cel(GOLD), 1.5) + C(0, -52, 1.6, TWG, 0.9) +
        twGlass(c, 0, -60.5, 6.8, 0.6 + t * 0.7) + sp(-12.5, -56, 2.2) + sp(12, -63, 1.9) + sp(-10, -70, 1.4) +
        twMotes(c, [[13.5, -52, 1.2], [-15, -64, 1.1], [9, -71, 1], [-4, -44, 0.9]], t);
    },
    /* flanged silver mace, the hourglass on a midnight boss at the centre, a gold crown point on top */
    trialsworn_mace: function (c, t) {
      var fl = 'M-6,-46 L-12.5,-41.5 L-12.5,-32.5 L-6,-28 Z M6,-46 L12.5,-41.5 L12.5,-32.5 L6,-28 Z';
      var hd = 'M0,-50 C6,-49 8,-43 8,-37 C8,-31 6,-25 0,-24 C-6,-25 -8,-31 -8,-37 C-8,-43 -6,-49 0,-50 Z';
      return twAura(c, 0, -38, 17, 16, t) +
        P('M-2.2,11 L-2.4,-27 L2.4,-27 L2.2,11 Z', c.lg(TWSHAFT, 0, 0, 1, 0), 2) +
        twGrip(c, 2.5, -1, 10) + twPommel(c, 9.5, 0.9) +
        P(fl, c.lg(['#dfe5ec', '#9aa6b6', '#5e6a7c'], 0, 0, 1, 0), 1.8) +
        P(hd, c.lg(TWHEAD, 0.2, 0, 0.8, 1), 2) + twTrim('M0,-49.5 C5.6,-48.5 7.5,-43 7.5,-37 C7.5,-31 5.6,-25.5 0,-24.5', t, 1.2) +
        S('M-4.8,-45 C-6,-41 -6,-34 -4.8,-29', '#ffffff', 0.9, 0.8) +
        P('M-2.4,-50 L0,-57 L2.4,-50 Z', c.cel(GOLD), 1.4) +
        R(-3.8, -27.5, 7.6, 3.4, c.cel(GOLD), 1.4) +
        C(0, -37, 6, c.cel(TWM), 1.4) + twGlass(c, 0, -37, 4, t) +
        twMotes(c, [[-14, -48, 1.2], [14, -26, 1.1], [10, -52, 1]], t);
    },
    /* bearded silver axe with a gold edge and an hourglass inlay, a back spike */
    trialsworn_axe: function (c, t) {
      var bl = 'M2.4,-41 C7,-42 11,-45 14.5,-50 C20,-44 23.2,-36 22.8,-28 C22.4,-20 19.4,-14 15,-10 C12,-15 7,-20 2.4,-22 Z';
      var eg = 'M14.5,-50 C20,-44 23.2,-36 22.8,-28 C22.4,-20 19.4,-14 15,-10 C16.8,-16 18.6,-21 18.9,-28 C19.2,-36 17.4,-43 14.5,-50 Z';
      return twAura(c, 12, -31, 16, 20, t) +
        P('M-2.3,12 L-2.5,-42 L2.5,-42 L2.3,12 Z', c.lg(TWSHAFT, 0, 0, 1, 0), 2) +
        twGrip(c, 2.5, -2, 10) + twPommel(c, 9.5, 0.9) +
        P('M-2,-40 L-9.5,-35 L-2,-29 Z', c.lg(TWS, 0, 0, 0, 1), 1.6) +
        P(bl, c.lg(TWHEAD, 0.1, 0, 0.9, 1), 2.1) +
        CG(F(eg, c.cel(GOLD)) + S('M16.4,-45 C19.6,-39 21,-33 20.8,-27', '#fff4c8', 0.8, 0.8) + S('M5,-39 C9,-41 12,-44 14,-47', '#ffffff', 0.9, 0.7), c.clip(bl)) +
        S(eg.replace(/ Z$/, ''), OL, 1) + twTrim('M14.5,-50 C20,-44 23.2,-36 22.8,-28 C22.4,-20 19.4,-14 15,-10', t, 1.4) + twGlass(c, 10, -30, 4.2, t) +
        R(-3.4, -44, 6.8, 4, c.cel(GOLD), 1.4) + R(-3.2, -27, 6.4, 3, c.cel(GOLD), 1.3) +
        P('M-2.4,-44 L0,-50 L2.4,-44 Z', c.cel(GOLD), 1.3) +
        twMotes(c, [[27, -38, 1.2], [26, -18, 1.1], [8, -53, 1], [-9, -44, 0.9]], t);
    },
    /* silver recurve bow: midnight riser with gold rims and an hourglass, gold tips */
    trialsworn_bow: function (c, t) {
      var st = 'M-3,-48 C-5.5,-47.5 -7.5,-45 -7.5,-41 C-1.5,-33 3.5,-19 2,-5 L2,5 C3.5,19 -1.5,33 -7.5,41 C-7.5,45 -5.5,47.5 -3,48';
      var rs = 'M0.4,-21 C4.8,-17 6.4,-9 6,0 C6.4,9 4.8,17 0.4,21 L-1.4,0 Z';
      return twAura(c, 0, 0, 13, 46, t) + S('M-7.5,-41 L-7.5,41', t ? '#fff4c8' : '#f3ecd8', 1.1, 0.95) +
        S(st, OL, 7.4) + S(st, TWSM, 4) + S('M-6,-42 C-0.5,-33 3,-19 2.2,-7 M2.2,7 C3,19 -0.5,33 -6,42', '#ffffff', 1.1, 0.8) +
        twTrim('M-7,-40 C-1,-32 4,-19 2.6,-6 M2.6,6 C4,19 -1,32 -7,40', t, 1.4) +
        P(rs, c.cel(TWM), 1.8) + S('M0.8,-19.5 C4.6,-16 6,-9 5.6,-2 M5.6,2 C6,9 4.6,16 0.8,19.5', GOLD, 1.3) +
        G(twGrip(c, 2.8, -6, 6), 'translate(2.4,0)') +
        twGlass(c, 3.2, -13.5, 3.6, t) +
        C(-3, -48, 2, c.cel(GOLD), 1.2) + C(-3, 48, 2, c.cel(GOLD), 1.2) +
        twMotes(c, [[8, -34, 1.2], [9, 26, 1.1], [-12, -20, 1], [-11, 12, 0.9]], t);
    }
  };
  /* ranged looks: bows drawn in a hunter's front hand */
  var GRANGED = { militia_longbow: 1 };
  var TWKIND = { trialsworn_sword: 'blade', trialsworn_dagger: 'dagger', trialsworn_staff: 'staff', trialsworn_mace: 'hammer', trialsworn_axe: 'hammer', trialsworn_bow: 'bow' };
  Object.keys(GWT).forEach(function (k) {
    [['', 0], ['_t15', 1], ['_t20', 2]].forEach(function (v) {
      var key = k + v[0], f = function (c) { return GWT[k](c, v[1]); };
      GW[key] = f; WP[key] = f;
      if (TWKIND[k] === 'bow') GRANGED[key] = 1; else GKIND[key] = TWKIND[k];
    });
  });
  /* the Trialsworn cloak: a silver edge with a line of the trim metal inside it, a large hourglass on the back, a small
     hourglass clasp at the shoulder. t15: the sand glows and light runs along the edge; t20: radiant, an aura round the
     hourglass and sand motes drifting up off the cloak */
  function twCloak(pal, t) {
    return {
      back: function (c, g) {
        var d = capeD(g, 'plain', 67), b = g.b, hx = g.sx - b.waistW - 12, hy = g.fy - 32;
        return (t > 1 ? S(d, TWG, 8, 0.2) + S(d, '#fff4c8', 4, 0.3) : '') + P(d, c.lg([[0, pal.lt], [0.6, pal.cloth], [1, pal.dk]], 0.2, 0, 0.8, 1)) +
          CG(capeFolds(g, pal.dk) + S(d, pal.trim, 6.4) + S(d, pal.edge, 4) + S(d, pal.hi, 1.1, 0.8) + (t ? S(d, '#fff4c8', 2.2 + t, 0.3 + t * 0.15) : '') +
            (t > 1 ? C(hx, hy, 24, c.rg([[0, '#fff4c8', 0.4], [0.5, TWG, 0.16], [1, TWG, 0]]), 0) : ''), c.clip(d)) +
          P(d, 'none', 2.5) + twGlass(c, hx, hy, 8, t ? t + 0.3 : 0, pal) +
          twMotes(c, [[hx - 10, hy - 14, 1.4], [hx + 7, hy - 22, 1.2], [hx - 5, hy - 32, 1.1], [hx + 11, hy - 6, 1.1], [hx - 12, hy + 8, 1.2], [hx - 2, hy - 46, 1]], t);
      },
      torso: function (c, g) {
        var d = collarD(g), tl = D`M${g.scx - 11},${g.sy + 6} Q${g.scx - 2},${g.sy - 2} ${g.scx + 11},${g.sy + 2.8}`;
        return P(d, c.cel(pal.cloth), 1.8) + CG(S(tl, pal.edge, 2.4) + (t ? S(tl, '#fff4c8', 1, 0.8) : ''), c.clip(d));
      },
      front: function (c, g) {
        var x = g.bSh[0] - 1 + g.b.shW * 0.42, y = g.sy - 1;
        return drape(c, g, pal.cloth, pal.edge, t ? function (c, g) { return S(drapeD(g), '#fff4c8', 1.6 + t, 0.4); } : null) + twGlass(c, x, y, 3.2, t, pal);
      }
    };
  }
  GBACK.trialsworn_cloak = twCloak(TWP, 0);
  /* ---- the Honor rank looks (#57): a tabard (rank 3), a cloak (rank 5) and a war banner on the back (rank 8), in each
     faction's colours: the Accord blue enamel and gold, the Krugar red, iron and bone */
  function honorBack(main, trim, deep, kind) {
    var emblem = function (c, x, y, s) {
      return main === '#2f5fc0'
        ? P(D`M${x},${y - s} C${x + s * 0.8},${y - s * 0.7} ${x + s},${y - s * 0.8} ${x + s},${y - s * 0.8} C${x + s},${y + s * 0.2} ${x + s * 0.5},${y + s * 0.8} ${x},${y + s} C${x - s * 0.5},${y + s * 0.8} ${x - s},${y + s * 0.2} ${x - s},${y - s * 0.8} C${x - s},${y - s * 0.8} ${x - s * 0.8},${y - s * 0.7} ${x},${y - s} Z`, trim, 1)
        : P(D`M${x - s * 0.7},${y - s * 0.6} L${x - s * 0.2},${y + s} L${x},${y - s * 0.2} L${x + s * 0.2},${y + s} L${x + s * 0.7},${y - s * 0.6} Z`, trim, 1);
    };
    if (kind === 'tabard') return {
      back: function () { return ''; },
      torso: function (c, g) { /* wider and longer than a class's plain tabard, bordered, so the rank reads at a glance */
        var x0 = g.scx - 2, x1 = g.scx + 14, xm = (x0 + x1) / 2, d = D`M${x0},${g.sy + 7} L${x1},${g.sy + 7} L${x1 + 1.5},${g.hy + 21} L${xm},${g.hy + 25} L${x0 - 1.5},${g.hy + 21} Z`;
        return P(d, c.cel(main), 2) + CG(S(d, trim, 3.4) + S(D`M${x0},${g.sy + 11} L${x1},${g.sy + 11}`, trim, 1.6), c.clip(d)) + emblem(c, xm, g.sy + 24, 3.8);
      }
    };
    if (kind === 'cloak') return {
      back: function (c, g) { var d = capeD(g, 'plain', 23); return P(d, c.cel(main)) + CG(capeFolds(g, deep) + S(d, trim, 3.2), c.clip(d)); },
      torso: function (c, g) { var d = collarD(g); return P(d, c.cel(main), 1.8) + C(g.scx + 9, g.sy + 2.5, 2.2, trim, 1); },
      front: function (c, g) { return drape(c, g, main, trim); }
    };
    return { /* the war banner: a pole across the back, its flag above the shoulder, a strap over the chest */
      back: function (c, g) {
        var x0 = g.scx - g.b.shW - 4, y0 = g.sy - 40, x1 = g.scx + 4, y1 = g.hy + 8;
        var fl = D`M${x0 + 1},${y0 + 3} L${x0 + 21},${y0 + 7} L${x0 + 17},${y0 + 13} L${x0 + 21},${y0 + 19} L${x0 + 1},${y0 + 17} Z`;
        return S(D`M${x0},${y0} L${x1},${y1}`, '#1a1009', 4.6) + S(D`M${x0},${y0} L${x1},${y1}`, '#8a5a30', 2.6) + C(x0, y0 - 1, 2.4, GOLD, 1.2) +
          P(fl, c.cel(main), 1.8) + CG(S(D`M${x0 + 3},${y0 + 5.5} L${x0 + 19},${y0 + 9}`, trim, 1.6), c.clip(fl)) + emblem(c, x0 + 9, y0 + 11, 2.6);
      },
      torso: function (c, g) { return S(D`M${g.scx - 9},${g.sy + 2} L${g.scx + 9},${g.hy - 2}`, '#1a1009', 3.4) + S(D`M${g.scx - 9},${g.sy + 2} L${g.scx + 9},${g.hy - 2}`, deep, 2); }
    };
  }
  [['alliance', '#2f5fc0', GOLD, '#1a2f6a'], ['horde', '#b8302a', '#efe6cf', '#5a1410']].forEach(function (f) {
    ['tabard', 'cloak', 'banner'].forEach(function (k) { GBACK['honor_' + f[0] + '_' + k] = honorBack(f[1], f[2], f[3], k); });
  });
  GBACK.trialsworn_cloak_t15 = twCloak(TWP, 1);
  GBACK.trialsworn_cloak_t20 = twCloak(TWP, 2);
  /* ---- the monthly Trialsworn cloaks: the same cloak in the month's colours, key trialsworn_cloak_m<YYYYMM>.
     A new month is one line here. Each: [month, cloth (light, mid, dark), edge band (edge, highlight, trim line),
     hourglass (frame metal, glass top/mid/bottom, sand)].
       October 2026   Emberwane     burnt ember orange, charcoal, bronze
       November 2026  Bronzeleaf    russet brown, copper and bronze
       December 2026  Hoarfrost     pale ice blue, frost white, silver frame, frost sand
       January 2027   Rimewind      storm grey, icy white, silver frame, frost sand
       February 2027  Heartsblood   deep crimson, gold
       March 2027     Thawbloom     fresh spring green, pale gold
       April 2027     Blossomrain   soft leaf green, blossom pink
       May 2027       Greenhaven    deep emerald, gold
       June 2027      Highsun       sun gold, azure
       July 2027      Azure Tide    bright azure, gold
       August 2027    Sunlit Sail   sail ivory, gold and azure
       September 2027 Harvest Moon  harvest amber, deep brown, bronze ---- */
  var TW_MONTHS = [
    ['202610', ['#e0683a', '#c03c18', '#5e1a0a'], ['#2e2622', '#6a5a50', '#c88a3a'], ['#c88a3a', '#5a2a14', '#3a1a0c', '#241008', '#ffc070']],
    ['202611', ['#8e5a3a', '#6a3a22', '#381c10'], ['#c47a3e', '#f0c08a', '#8a5a2a'], ['#c47a3e', '#6a3a22', '#4a2616', '#2a140a', '#f6c878']],
    ['202612', ['#d6e8f6', '#a8c6de', '#6e8eae'], ['#ffffff', '#ffffff', '#8aa8c8'], ['#dfe6ee', '#6a8ab0', '#3e5a80', '#243a5a', '#e8f6ff']],
    ['202701', ['#7e8ea2', '#56687e', '#2e3a4a'], ['#e8f0f8', '#ffffff', '#a8b8cc'], ['#d4dce6', '#4a6080', '#2e4060', '#1a2840', '#d6f0ff']],
    ['202702', ['#b02a3a', '#861424', '#480810'], ['#e6b54a', '#fff0b8', '#6a0a14'], [GOLD, '#6a1420', '#4a0a14', '#2a040a', '#ffd6a0']],
    ['202703', ['#8ad06e', '#56a044', '#2a6224'], ['#f4e6a4', '#ffffff', '#c8a848'], ['#d8b85a', '#2e6a3a', '#1e4a28', '#123018', '#fff2b0']],
    ['202704', ['#a6d8a0', '#74b87a', '#3e7a4c'], ['#f2a6c0', '#ffe4ee', '#c86a8a'], ['#dcdfe6', '#3a6a52', '#27503c', '#163426', '#ffd6e4']],
    ['202705', ['#3a9a68', '#1e6a44', '#0e3a24'], ['#e6c25a', '#fff2c0', '#8a6a20'], [GOLD, '#1a5a3a', '#0e3e28', '#062418', '#f6e08a']],
    ['202706', ['#f6d466', '#e2ac28', '#9a6a10'], ['#2f7ad8', '#9ac8ff', '#1a4a9a'], ['#2f7ad8', '#6a4a10', '#4a3208', '#2a1c04', '#fff2b8']],
    ['202707', ['#5aa6f0', '#2a78d0', '#123e80'], ['#f0c448', '#fff0b0', '#a07a20'], [GOLD, '#1a4a9a', '#12346e', '#0a1e44', '#fff0a8']],
    ['202708', ['#fffaf0', '#eee2c6', '#b8a680'], ['#e0b040', '#fff4c8', '#2f7ad8'], [GOLD, '#2f6ab8', '#1e4a88', '#10284e', '#fff0a8']],
    ['202709', ['#f2c060', '#d8961e', '#8a5608'], ['#5a3414', '#9a6a3a', '#e0b050'], ['#c8883a', '#6a3a10', '#4a260a', '#2a1404', '#ffe08a']]
  ];
  TW_MONTHS.forEach(function (m) {
    var cl = m[1], e = m[2], h = m[3];
    GBACK['trialsworn_cloak_m' + m[0]] = twCloak({ lt: cl[0], cloth: cl[1], dk: cl[2], edge: e[0], hi: e[1], trim: e[2], frame: h[0], glass: [h[1], h[2], h[3]], sand: h[4] }, 0);
  });
  /* ================= crafted looks (v10.9): the level-60 crafted sets, the Moonforged weapons and the profession keepsakes =================
     Moonforged (blacksmithing, mail): pale moonsilver plates over dark duskiron mail, cool silver-blue glints, a crescent moon.
     Wildrunner (leatherworking, leather): hard dark-brown hide, fur trim, moss-green ranger tones, stitched straps, a leaf.
     Starweave (tailoring, cloth): a deep violet-blue robe and trousers with gold star embroidery.
     The keepsakes are back looks like the Legend keepsakes (no stats): slung on the back, gold accents, a strap across the chest. */
  var MF = { iron: '#373c50', ironDk: '#23273a', ring: '#151822', plate: '#e6ecf4', plateMd: '#b2bed2', plateDk: '#6f7c96', inlay: '#26305a', glow: '#86c4ff', pants: '#2e3346' };
  function mfPlate(c) { return c.lg([[0, '#ffffff'], [0.35, MF.plate], [0.75, MF.plateMd], [1, MF.plateDk]], 0.2, 0, 0.8, 1); }
  /* a crescent: outer radius r, opening toward angle rot (degrees, 0 = +x, -90 = up) */
  function mfMoonD(x, y, r, rot) {
    var a = (rot || 0) * Math.PI / 180, a1 = a - 0.96, a2 = a + 0.96, ri = r * 0.84;
    var h1 = [x + Math.cos(a1) * r, y + Math.sin(a1) * r], h2 = [x + Math.cos(a2) * r, y + Math.sin(a2) * r];
    return D`M${h1[0]},${h1[1]} A${r},${r} 0 1 0 ${h2[0]},${h2[1]} A${ri},${ri} 0 1 1 ${h1[0]},${h1[1]} Z`;
  }
  /* a four-point glint */
  function mfGlint(x, y, s, col) {
    var q = s * 0.2;
    return F(D`M${x},${y - s} Q${x + q},${y - q} ${x + s},${y} Q${x + q},${y + q} ${x},${y + s} Q${x - q},${y + q} ${x - s},${y} Q${x - q},${y - q} ${x},${y - s} Z`, col || '#ffffff', 0.95);
  }
  /* a dark-blue inlaid disc with a glowing pale crescent in it */
  function mfMoon(c, x, y, r, rot) {
    return C(x, y, r * 1.9, c.rg([[0, MF.glow, 0.42], [1, MF.glow, 0]]), 0) +
      C(x, y, r, c.rg([[0, '#41528e'], [1, '#1a2244']], 0.4, 0.35, 0.7), 1.2) +
      P(mfMoonD(x + Math.cos(rot * Math.PI / 180) * r * 0.12, y + Math.sin(rot * Math.PI / 180) * r * 0.12, r * 0.74, rot), c.lg([[0, '#ffffff'], [0.6, '#dcefff'], [1, '#9ccaf4']], 0, 0, 1, 1), 0.7);
  }
  /* layered moonsilver pauldron: a lower lame under the main plate, rivets, a glint */
  function mfPad(c, x, y, rx, front) {
    var d = rsPadD(x, y, rx), d1 = rsPadD(x, y + 3.4, rx * 0.86);
    return P(d1, c.cel(MF.plateMd), 1.5) + P(d, mfPlate(c), front ? 2 : 1.8) + S(rsPadRim(x, y, rx), MF.plateDk, 1.2, 0.9) +
      S(D`M${x - rx * 0.6},${y - rx * 0.3} Q${x - rx * 0.15},${y - rx * 0.74} ${x + rx * 0.45},${y - rx * 0.55}`, '#ffffff', 1.1, 0.85) +
      C(x - rx * 0.55, y + 1.6, 0.9, MF.inlay, 0) + C(x, y + 2.6, 0.9, MF.inlay, 0) + C(x + rx * 0.55, y + 1.6, 0.9, MF.inlay, 0) +
      mfGlint(x + rx * 0.38, y - rx * 0.36, front ? 2.4 : 1.9);
  }
  /* Moonforged hauberk: duskiron mail, a moonsilver breastplate with a crescent-moon inlay, a moonsilver fauld band, a gorget */
  function mfChest(o) {
    o.torsoC = MF.iron; o.sleeve = MF.ironDk;
    o.belt = MF.ironDk; o.buckle = MF.plateMd;
    o.pads = function (c, g) { return mfPad(c, g.bSh[0] - 1, g.sy + 2, 8.5, 0) + mfPad(c, g.fSh[0] + 1, g.sy + 3, 10, 1); };
    o.torsoFx = function (c, g) {
      var cl = c.clip(g.torsoD), k = g.b.shW / 16;
      var a = tq(g, -1.4, -0.3), b = tq(g, 1.4, -0.3), b1 = tq(g, 1.4, 0.5), m = tq(g, 0.3, 0.64), a1 = tq(g, -1.4, 0.52);
      var edge = D`M${b1[0]},${b1[1]} Q${m[0] + 9},${m[1] + 1} ${m[0]},${m[1]} Q${m[0] - 10},${m[1] + 1} ${a1[0]},${a1[1]}`;
      var bp = D`M${a[0]},${a[1]} L${b[0]},${b[1]} L${b1[0]},${b1[1]} Q${m[0] + 9},${m[1] + 1} ${m[0]},${m[1]} Q${m[0] - 10},${m[1] + 1} ${a1[0]},${a1[1]} Z`;
      var f0 = tq(g, -1.4, 0.76), f1 = tq(g, 1.4, 0.74), f2 = tq(g, 1.4, 0.88), f3 = tq(g, -1.4, 0.9);
      var kl = tq(g, 0.32, 0.04), kl2 = tq(g, 0.3, 0.58), mo = tq(g, -0.12, 0.3), g1 = tq(g, -0.72, 0.14), g2 = tq(g, 0.5, 0.46);
      return mailFx(c, g, MF.ring) + CG(
        F(D`M${f0[0]},${f0[1]} L${f1[0]},${f1[1]} L${f2[0]},${f2[1]} L${f3[0]},${f3[1]} Z`, mfPlate(c)) +
        S(D`M${f0[0]},${f0[1]} L${f1[0]},${f1[1]} M${f3[0]},${f3[1]} L${f2[0]},${f2[1]}`, OL, 1.2) +
        F(bp, mfPlate(c)) + S(edge, OL, 1.8) + S(edge, MF.plateDk, 0.7, 0.8) +
        S(D`M${kl[0]},${kl[1]} L${kl2[0]},${kl2[1]}`, MF.plateDk, 1, 0.6) +
        mfMoon(c, mo[0], mo[1], 5.6 * k, -40) + mfGlint(g1[0], g1[1], 2.4) + mfGlint(g2[0], g2[1], 1.8), cl);
    };
    o.gTorso = function (c, g) {
      var d = collarD(g, 1);
      return P(d, mfPlate(c), 1.7) + mfGlint(g.scx + 6, g.sy - 1.5, 1.6, MF.glow);
    };
  }
  /* Moonforged legguards: duskiron mail rings, a moonsilver thigh plate, a crescent knee cop, a shin greave */
  function mfLegs(c, g, L, front) {
    var w = g.b.legW, ml = '', K = L[1], F2 = L[2];
    var l0 = Math.sqrt(Math.pow(L[1][0] - L[0][0], 2) + Math.pow(L[1][1] - L[0][1], 2)), l1 = Math.sqrt(Math.pow(F2[0] - K[0], 2) + Math.pow(F2[1] - K[1], 2));
    [[L[0], L[1]], [L[1], L[2]]].forEach(function (s) {
      [0.22, 0.4, 0.58, 0.76, 0.92].forEach(function (u) {
        var a = lpt(s[0], s[1], u, -w * 0.42), m = lpt(s[0], s[1], u + 0.07, 0), b = lpt(s[0], s[1], u, w * 0.42);
        ml += D`M${a[0]},${a[1]} Q${m[0]},${m[1]} ${b[0]},${b[1]}`;
      });
    });
    var pc = front ? c.lg([[0, MF.plate], [0.55, MF.plateMd], [1, MF.plateDk]], 0, 0, 1, 0) : c.cel(dk(MF.plateMd, 0.12));
    var th = quadOn(L[0], L[1], 3, l0 - 4, -w * 0.56, w * 0.12), gr = quadOn(K, F2, 5, l1 - 3, -w * 0.56, w * 0.14);
    var kc = lptA(K, F2, 0.5, -w * 0.12), ang = Math.atan2(F2[1] - K[1], F2[0] - K[0]) * 180 / Math.PI;
    var kd = mfMoonD(kc[0], kc[1], w * 0.52, ang - 90 - 25);
    return S(ml, MF.ring, 0.9, 0.85) + P(th, pc, 1.3) + P(gr, pc, 1.3) +
      S(pl([lptA(L[0], L[1], 4, -w * 0.3), lptA(L[0], L[1], l0 - 5, -w * 0.3)]) + pl([lptA(K, F2, 6, -w * 0.3), lptA(K, F2, l1 - 4, -w * 0.3)]), '#ffffff', 0.8, front ? 0.55 : 0.25) +
      P(kd, front ? mfPlate(c) : pc, 1.3) + (front ? mfGlint(kc[0] - w * 0.2, kc[1] - 1, 1.8, '#ffffff') : '');
  }
  GCHEST.moonforged_chest = mfChest;
  GLEGS.moonforged_legs = { pants: MF.pants, fx: mfLegs };

  /* ---- Wildrunner ---- */
  var WR = { hide: '#4a3324', hideDk: '#2e2016', hideLt: '#6e4e34', moss: '#5a6a32', mossDk: '#38441e', mossLt: '#8a9c52', fur: '#c4a47a', furDk: '#8a6a46', strap: '#2a1c12', stitch: '#dccaa0', bone: '#ece0c4', pants: '#3a2a1e' };
  /* a band of fur along the curve A -> M -> B: a smooth edge on one side, tufts hanging on the other (the left of travel) */
  function wrFurD(A, M, B, h, n) {
    var top = [], bot = [], i;
    for (i = 0; i <= n * 2; i++) {
      var t = i / (n * 2), u = 1 - t;
      var x = u * u * A[0] + 2 * u * t * M[0] + t * t * B[0], y = u * u * A[1] + 2 * u * t * M[1] + t * t * B[1];
      var dx = 2 * u * (M[0] - A[0]) + 2 * t * (B[0] - M[0]), dy = 2 * u * (M[1] - A[1]) + 2 * t * (B[1] - M[1]), l = Math.sqrt(dx * dx + dy * dy) || 1;
      var nx = -dy / l, ny = dx / l, kk = i % 2 ? 1 : 0.3;
      top.push([x - nx * h * 0.4, y - ny * h * 0.4]); bot.push([x + nx * h * kk, y + ny * h * kk]);
    }
    return pl(top) + pl(bot.reverse()).replace(/^M/, 'L') + 'Z';
  }
  function wrFur(c, A, M, B, h, n) { var d = wrFurD(A, M, B, h, n); return P(d, c.lg([[0, lt(WR.fur, 0.3)], [0.6, WR.fur], [1, WR.furDk]], 0, 0, 0, 1), 1.3); }
  /* a leaf: base (x,y), length s, pointing along angle a (degrees) */
  function wrLeafD(x, y, s, a) {
    var r = a * Math.PI / 180, ux = Math.cos(r), uy = Math.sin(r), vx = -uy, vy = ux, w = s * 0.36;
    var tip = [x + ux * s, y + uy * s], c1 = [x + ux * s * 0.3 + vx * w, y + uy * s * 0.3 + vy * w], c2 = [x + ux * s * 0.3 - vx * w, y + uy * s * 0.3 - vy * w];
    return { d: D`M${x},${y} Q${c1[0]},${c1[1]} ${tip[0]},${tip[1]} Q${c2[0]},${c2[1]} ${x},${y} Z`, vein: D`M${x},${y} L${x + ux * s * 0.85},${y + uy * s * 0.85}` };
  }
  function wrPad(c, x, y, rx, front) {
    var d = rsPadD(x, y, rx);
    return P(d, c.cel(WR.hide), front ? 1.9 : 1.7) + CG(S(stitchLine(x - rx * 0.6, y - rx * 0.4, x + rx * 0.6, y - rx * 0.4, 2.6), WR.stitch, 0.8, 0.9), c.clip(d)) +
      wrFur(c, [x - rx - 0.5, y + 2.4], [x, y + 6.4], [x + rx + 0.5, y + 2.4], front ? 4.4 : 3.6, front ? 5 : 4);
  }
  /* Wildrunner jerkin: dark hide, a moss-green yoke over the shoulders cut into leaf points and stitched along the edge,
     bone lacing up the front, a pale leaf sprig tooled on the chest, a fur collar, fur-trimmed pauldrons */
  function wrChest(o) {
    o.torsoC = WR.hide; o.sleeve = WR.hideDk;
    o.belt = WR.strap; o.buckle = WR.bone;
    o.pads = function (c, g) { return wrPad(c, g.bSh[0] - 1, g.sy + 2, 7.5, 0) + wrPad(c, g.fSh[0] + 1, g.sy + 3, 9, 1); };
    o.torsoFx = function (c, g) {
      var cl = c.clip(g.torsoD), k = g.b.shW / 16, n = 5, i;
      var yk = tpl(g, [[1.5, -0.4], [-1.5, -0.4], [-1.5, 0.36]]), ed = [], lc = '';
      for (i = 0; i < n; i++) {
        var u0 = -1.5 + 3 * i / n, u1 = -1.5 + 3 * (i + 1) / n, um = (u0 + u1) / 2, tp = tq(g, um, 0.54), c1 = tq(g, u0 + 0.12, 0.47), c2 = tq(g, u1 - 0.12, 0.47), e = tq(g, u1, 0.36);
        yk += D` Q${c1[0]},${c1[1]} ${tp[0]},${tp[1]} Q${c2[0]},${c2[1]} ${e[0]},${e[1]}`;
        ed.push([tp, e]);
      }
      var yd = yk + 'Z', st = yk.slice(yk.indexOf(' Q'));
      st = D`M${tq(g, -1.5, 0.36)[0]},${tq(g, -1.5, 0.36)[1]}` + st;
      for (i = 0; i < 3; i++) {
        var p0 = tq(g, 0.1, 0.56 + i * 0.13), p1 = tq(g, 0.34, 0.62 + i * 0.13), q0 = tq(g, 0.34, 0.56 + i * 0.13), q1 = tq(g, 0.1, 0.62 + i * 0.13);
        lc += D`M${p0[0]},${p0[1]} L${p1[0]},${p1[1]} M${q0[0]},${q0[1]} L${q1[0]},${q1[1]} `;
      }
      var sl = tq(g, 0.22, 0.4), sl1 = tq(g, 0.24, 1);
      var lp = tq(g, -0.5, 0.88), lf = wrLeafD(lp[0], lp[1], 12 * k, -70), lf2 = wrLeafD(lp[0], lp[1], 8 * k, -120), lf3 = wrLeafD(lp[0], lp[1], 7 * k, -30);
      var sm = tq(g, -0.8, 0.3), sm1 = tq(g, -0.86, 1);
      return CG(S(stitchLine(sm[0], sm[1], sm1[0], sm1[1], 3), WR.stitch, 0.7, 0.6) +
        S(D`M${sl[0]},${sl[1]} L${sl1[0]},${sl1[1]}`, OL, 1.6) + S(lc, OL, 2.2) + S(lc, WR.bone, 1) +
        P(lf2.d, c.cel(WR.mossLt), 1) + P(lf3.d, c.cel(WR.mossLt), 1) + P(lf.d, c.cel('#d0dc92'), 1.1) + S(lf.vein, WR.mossDk, 0.7) +
        P(yd, c.cel('#647834'), 1.6) + G(S(st, WR.mossLt, 0.9, 0.9), 'translate(0,-2.2)'), cl);
    };
    o.gTorso = function (c, g) {
      var x = g.scx, y = g.sy;
      return wrFur(c, [x - 13, y + 3], [x - 2, y - 8], [x + 13, y - 1], 5.4, 6);
    };
  }
  /* Wildrunner leggings: dark hide, moss cross-lacing up the shin, a stitched knee pad, a thigh strap, a fur cuff */
  function wrLegs(c, g, L, front) {
    var w = g.b.legW, K = L[1], F2 = L[2], lc = '';
    for (var i = 0; i < 4; i++) {
      var u0 = 0.22 + i * 0.17, u1 = u0 + 0.17;
      var p = lpt(K, F2, u0, -w * 0.46), q = lpt(K, F2, u1, w * 0.46), p2 = lpt(K, F2, u0, w * 0.46), q2 = lpt(K, F2, u1, -w * 0.46);
      lc += pl([p, q]) + pl([p2, q2]);
    }
    var kp = quadOn(K, F2, -4, 4.5, -w * 0.56, w * 0.28), ts = pl([lpt(L[0], L[1], 0.5, -w * 0.52), lpt(L[0], L[1], 0.58, w * 0.52)]);
    var bk = lpt(L[0], L[1], 0.53, -w * 0.18), cf = lpt(K, F2, 0.86, 0);
    var col = front ? WR.moss : WR.mossDk;
    return S(lc, OL, 2.6) + S(lc, col, 1.4) +
      S(ts, OL, 3.6) + S(ts, WR.strap, 2.2) + R(bk[0] - 1.6, bk[1] - 1.6, 3.2, 3.2, front ? '#b08a4a' : '#7a5e34', 0.9) +
      P(kp, c.cel(front ? WR.hideLt : WR.hide), 1.3) + CG(S(stitchLine.apply(null, lptA(K, F2, -3, -w * 0.3).concat(lptA(K, F2, 3.5, -w * 0.3), [2.2])), WR.stitch, 0.7, 0.9), c.clip(kp)) +
      wrFur(c, lptA(K, F2, (Math.sqrt(Math.pow(F2[0] - K[0], 2) + Math.pow(F2[1] - K[1], 2))) * 0.82, -w * 0.62), cf, lptA(K, F2, (Math.sqrt(Math.pow(F2[0] - K[0], 2) + Math.pow(F2[1] - K[1], 2))) * 0.84, w * 0.62), front ? 3.6 : 3, 3);
  }
  GCHEST.wildrunner_chest = wrChest;
  GLEGS.wildrunner_legs = { pants: WR.pants, fx: wrLegs };
  /* the Wildrunner cloak: a moss-green ranger's cloak, the hem cut into leaves, the pointed hood down on the back,
     a fur strip over the shoulder, an antler toggle at the throat */
  GBACK.wildrunner_cloak = {
    back: function (c, g) {
      var K = rsCape(g, function (H0, H1, at) {
        var s = '', n = 6;
        for (var i = 0; i < n; i++) {
          var t0 = i / n, t1 = (i + 1) / n, tip = at((t0 + t1) / 2, 7), c1 = at(t0 + 0.1 / n, 6), c2 = at(t1 - 0.1 / n, 6);
          s += D` Q${c1[0]},${c1[1]} ${tip[0]},${tip[1]} Q${c2[0]},${c2[1]} ${at(t1)[0]},${at(t1)[1]}`;
        }
        return s;
      }), d = K.d, cl = c.clip(d), vn = '';
      for (var i = 0; i < 6; i++) { var p = K.at((i + 0.5) / 6, -2), q = K.at((i + 0.5) / 6, 5); vn += D`M${p[0]},${p[1]} L${q[0]},${q[1]} `; }
      var sl = stitchLine(K.at(0.02, -5)[0], K.at(0.02, -5)[1], K.at(0.5, -5)[0], K.at(0.5, -5)[1], 3.2) + stitchLine(K.at(0.5, -5)[0], K.at(0.5, -5)[1], K.at(0.98, -5)[0], K.at(0.98, -5)[1], 3.2);
      return P(d, c.lg([[0, WR.mossLt], [0.35, WR.moss], [1, WR.mossDk]], 0.2, 0, 0.8, 1)) +
        CG(capeFolds(g, WR.mossDk) + S(K.hem, WR.mossDk, 3.2, 0.8) + S(vn, WR.mossDk, 1, 0.8) + S(sl, WR.stitch, 0.8, 0.7), cl) + P(d, 'none', 2.5);
    },
    torso: function (c, g) {
      var x = g.scx, y = g.sy, col = WR.moss;
      /* the hood down: a bunched fold on the upper back, its point falling down the back */
      var hd = D`M${x + 1},${y - 2} C${x - 4},${y - 12} ${x - 19},${y - 13} ${x - 23},${y - 4} C${x - 25},${y + 3} ${x - 24},${y + 12} ${x - 27},${y + 20} C${x - 19},${y + 15} ${x - 12},${y + 10} ${x - 8},${y + 8} C${x - 4},${y + 6} ${x},${y + 4} ${x + 1},${y - 2} Z`;
      return P(hd, c.cel(col), 2.2) +
        P(D`M${x - 4},${y - 3} C${x - 8},${y - 8} ${x - 16},${y - 8} ${x - 18},${y - 2} C${x - 16},${y + 3} ${x - 10},${y + 3} ${x - 4},${y - 3} Z`, WR.mossDk, 1.4) +
        S(D`M${x - 22},${y + 2} C${x - 21},${y + 8} ${x - 23},${y + 13} ${x - 25},${y + 17}`, WR.mossDk, 1.1, 0.8) +
        P(collarD(g), c.cel(col), 1.8);
    },
    front: function (c, g) {
      var x = g.scx + 7.5, y = g.sy + 1;
      return drape(c, g, WR.moss, WR.mossDk, function (c, g) { var bx = g.bSh[0]; return S(stitchLine(bx - 9, g.sy + 11, bx + 4, g.sy - 3, 2.8), WR.stitch, 0.8, 0.8); }) +
        S(D`M${x - 3},${y + 1} L${x + 3.2},${y - 0.6} M${x - 0.6},${y + 0.4} L${x - 1.6},${y - 2.6} M${x + 1.6},${y - 0.2} L${x + 1.4},${y - 3}`, OL, 2.8) +
        S(D`M${x - 3},${y + 1} L${x + 3.2},${y - 0.6} M${x - 0.6},${y + 0.4} L${x - 1.6},${y - 2.6} M${x + 1.6},${y - 0.2} L${x + 1.4},${y - 3}`, WR.bone, 1.5);
    }
  };

  /* ---- Starweave ---- */
  var SW = { robe: '#2c2a74', robeDk: '#18164a', robeLt: '#4c48a8', line: '#100e34', gold: '#ecc458', goldDk: '#9a7420', lining: '#8a7ad8', pants: '#25235e' };
  function swStar(x, y, r) { return star(x, y, 5, r, r * 0.45, 0); }
  function swSpark(x, y, r) { return star(x, y, 4, r, r * 0.3, 0); }
  /* gold stars scattered in the clip area: pts are [x, y, r, kind (0 star, 1 sparkle)] */
  function swStars(pts, col) {
    var d = '', e = '';
    pts.forEach(function (p) { if (p[3]) e += swSpark(p[0], p[1], p[2]); else d += swStar(p[0], p[1], p[2]); });
    return (d ? P(d, col || SW.gold, 0.7) : '') + (e ? F(e, '#fff2c0', 0.95) : '');
  }
  function swPads(c, g) {
    var out = '';
    [[g.bSh[0] - 1, g.sy + 2, 8, 0], [g.fSh[0] + 1, g.sy + 3, 9.5, 1]].forEach(function (p) {
      var x = p[0], y = p[1], rx = p[2], d = rsPadD(x, y, rx);
      out += P(d, c.cel(SW.robeLt)) + S(rsPadRim(x, y, rx), OL, 3) + S(rsPadRim(x, y, rx), SW.gold, 1.5) +
        (p[3] ? P(swStar(x + 0.5, y - 1.4, 3), SW.gold, 0.8) : C(x, y - 1, 1.2, SW.gold, 0));
    });
    return out;
  }
  /* Starweave robe: deep violet-blue, gold star embroidery scattered thickest at the hem, a gold constellation across the
     skirt, a gold-edged V yoke with a large star, a hem band lined with small stars */
  function swChest(o) {
    o.torsoC = SW.robe; o.sleeve = '#29276c'; o.bell = SW.robeDk;
    o.robe = SW.robe;
    o.belt = SW.robeDk; o.buckle = SW.gold;
    o.pads = swPads;
    o.robeFx = function (c, g) {
      var fy = g.fy, hy = g.hy, x0 = g.wl - 12, x1 = g.wr + 14, R_ = rnd(181), pts = [], i;
      for (i = 0; i < 9; i++) pts.push([x0 + 4 + R_() * (x1 - x0 - 8), hy + 8 + Math.pow(R_(), 0.6) * (fy - hy - 22), 1.6 + R_() * 1.2, i % 3 === 2 ? 1 : 0]);
      var hem = D`M${g.wl - 14},${fy - 7} Q${g.sx},${fy - 2.5} ${g.wr + 14},${fy - 7}`, band = D`M${g.wl - 16},${fy - 12} Q${g.sx},${fy - 7.5} ${g.wr + 16},${fy - 12} L${g.wr + 16},${fy + 4} L${g.wl - 16},${fy + 4} Z`;
      var hs = [];
      for (i = 0; i < 6; i++) { var t = (i + 0.5) / 6, hx = g.wl - 10 + (g.wr - g.wl + 22) * t; hs.push([hx, fy - 9.5 + Math.sin(Math.PI * t) * 3.2 - 1.6, 1.4, 1]); }
      var cs = [[g.sx - 6, hy + 10], [g.sx + 3, hy + 16], [g.sx - 1, hy + 24], [g.sx + 8, hy + 27]], cl = pl(cs);
      return CG(F(g.robeD, c.lg([[0, SW.robeDk, 0], [0.55, SW.robeDk, 0], [1, SW.robeDk, 0.85]])) + F(band, SW.line, 0.85) +
        S(hem, OL, 3) + S(hem, SW.gold, 1.6) + S(D`M${g.wl - 15},${fy - 12.5} Q${g.sx},${fy - 8} ${g.wr + 15},${fy - 12.5}`, SW.gold, 0.9, 0.9) +
        S(cl, SW.gold, 0.6, 0.75) + swStars(pts) + swStars(hs) + swStars(cs.map(function (p, j) { return [p[0], p[1], j === 2 ? 2.2 : 1.6, j % 2]; })), c.clip(g.robeD));
    };
    o.torsoFx = function (c, g) {
      var cl = c.clip(g.torsoD), k = g.b.shW / 16, st = tq(g, 0.36, 0.4), s1 = tq(g, -0.5, 0.3), s2 = tq(g, -0.2, 0.72), s3 = tq(g, 0.85, 0.75);
      var v = D`M${g.scx - 8},${g.sy + 0.5} L${g.scx + 4},${g.sy + 10} L${g.scx + 13},${g.sy + 1}`;
      return CG(F(g.torsoD, c.lg([[0, SW.robeDk, 0.65], [0.55, SW.robeDk, 0], [1, SW.robeDk, 0]])) +
        F(v + D` L${g.scx + 13},${g.sy - 6} L${g.scx - 8},${g.sy - 6} Z`, SW.lining, 0.9) + S(v, OL, 3.2) + S(v, SW.gold, 1.6) +
        S(pl([s1, st, s2]), SW.gold, 0.6, 0.7) +
        C(st[0], st[1], 7 * k, c.rg([[0, '#fff2c0', 0.5], [1, SW.gold, 0]]), 0) + P(star(st[0], st[1], 8, 5 * k, 2 * k, 0), c.rg([[0, '#fffbe6'], [0.6, SW.gold], [1, SW.goldDk]]), 0.9) +
        swStars([[s1[0], s1[1], 1.8, 0], [s2[0], s2[1], 1.5, 1], [s3[0], s3[1], 1.7, 0]]), cl);
    };
  }
  /* Starweave trousers: deep violet-blue, a gold star at the knee, gold embroidered cuffs, small stars down the shin */
  function swLegs(c, g, L, front) {
    var w = g.b.legW, K = L[1], F2 = L[2], l1 = Math.sqrt(Math.pow(F2[0] - K[0], 2) + Math.pow(F2[1] - K[1], 2));
    var kc = lptA(K, F2, 0.5, -w * 0.08), c0 = pl([lptA(K, F2, l1 - 3.4, -w * 0.52), lptA(K, F2, l1 - 3.4, w * 0.52)]), c1 = pl([lptA(K, F2, l1 - 6, -w * 0.52), lptA(K, F2, l1 - 6, w * 0.52)]);
    var s1 = lptA(L[0], L[1], 7, -w * 0.1), s2 = lptA(K, F2, l1 * 0.55, -w * 0.12);
    return S(c0, SW.gold, 1.5, front ? 1 : 0.7) + S(c1, SW.gold, 0.8, front ? 0.9 : 0.6) +
      (front ? P(swStar(kc[0], kc[1], 3.2), SW.gold, 0.8) + F(swSpark(s1[0], s1[1], 1.6) + swSpark(s2[0], s2[1], 1.4), '#fff2c0', 0.95) : F(swStar(kc[0], kc[1], 2.4), SW.goldDk, 0.9));
  }
  GCHEST.starweave_chest = swChest;
  GLEGS.starweave_legs = { pants: SW.pants, fx: swLegs };

  /* ---- Moonforged weapons: grip at the origin, blade up (-y), the same frame as the other weapon looks ---- */
  /* Moonforged Blade: a moonsilver blade with a faint moonlight fuller, a crescent guard with its horns raised, a duskiron
     grip and a full-moon pommel */
  function mfBlade(c) {
    var bd = 'M-3.6,-9 C-4.6,-24 -4.4,-38 -3.2,-47 L0.2,-56 L3.4,-47 C4.6,-38 4.6,-24 3.6,-9 Z';
    return rsHalo(c, 0, -32, 9, 26, MF.glow, 0.28) +
      P(bd, c.lg([[0, '#ffffff'], [0.5, MF.plate], [1, MF.plateDk]], 0, 0, 1, 0), 2) +
      CG(S('M0,-12 L0,-46', '#5a7ac0', 2.2, 0.7) + S('M0,-12 L0,-46', '#e4f4ff', 0.8) + S('M-2.6,-11 C-3.4,-24 -3.2,-38 -2.2,-46', '#ffffff', 0.8, 0.8), c.clip(bd)) +
      rsGrip(c, 2.4, -4, 10, MF.ironDk, MF.plateMd) +
      P(mfMoonD(0, -11, 9, -90), c.lg([[0, '#ffffff'], [0.45, MF.plate], [1, MF.plateDk]], 0, 0, 0, 1), 1.6) +
      C(0, -5.6, 1.9, c.rg([[0, '#ffffff'], [0.5, '#9ad0ff'], [1, '#3a5aa8']], 0.4, 0.35, 0.7), 1) +
      C(0, 12.6, 4.4, c.rg([[0, MF.glow, 0.5], [1, MF.glow, 0]]), 0) + C(0, 12.6, 2.8, c.rg([[0, '#ffffff'], [0.6, '#dcefff'], [1, '#8aa8d0']], 0.4, 0.35, 0.7), 1.4) +
      mfGlint(-1.6, -40, 2.2) + mfGlint(7, -18.5, 1.6);
  }
  /* Moonforged Warhammer: a moonsilver head with a flat striking face, a crescent beak behind, a top spike, the moon inlay
     on its socket; duskiron haft with moonsilver langets */
  function mfHammer(c) {
    var fc = 'M3,-47 L11,-48.5 L12.5,-46.5 L12.5,-31.5 L11,-29.5 L3,-31 Z';
    var bk = 'M-3,-44.5 C-9,-44.5 -15.5,-41 -18.5,-31.5 C-14.5,-35 -9.5,-37 -3,-35 Z';
    return rsHalo(c, 0, -38, 15, 15, MF.glow, 0.3) +
      P('M-2.2,11 L-2.4,-30 L2.4,-30 L2.2,11 Z', c.lg([[0, '#5a6280'], [0.5, MF.iron], [1, MF.ironDk]], 0, 0, 1, 0), 2) +
      P('M-3,-31 L-2.4,-20 L2.4,-20 L3,-31 Z', c.cel(MF.plateMd), 1.3) +
      rsGrip(c, 2.5, -1, 10, MF.ironDk, MF.plateMd) + P('M-3,10 L3,10 L2.2,13.6 L0,16 L-2.2,13.6 Z', c.cel(MF.plateMd), 1.4) +
      P('M-2.4,-48 L0,-56.5 L2.4,-48 Z', mfPlate(c), 1.4) +
      P(bk, c.lg([[0, '#ffffff'], [0.5, MF.plate], [1, MF.plateDk]], 0, 0, 0.6, 1), 1.7) +
      P(fc, mfPlate(c), 1.8) + S('M11,-47.4 L11,-30.6', MF.plateDk, 0.9, 0.8) + S('M4.4,-45.6 L4.4,-32.4', '#ffffff', 0.9, 0.8) +
      P('M-4.4,-48 L4.4,-48 L4.4,-30 L-4.4,-30 Z', c.cel(MF.iron), 1.8) +
      mfMoon(c, 0, -39, 3.3, -40) + mfGlint(9, -50, 2) + mfGlint(-14, -40, 1.6);
  }
  var GWCR = { moonforged_blade: mfBlade, moonforged_hammer: mfHammer };
  var CRKIND = { moonforged_blade: 'blade', moonforged_hammer: 'hammer' };
  Object.keys(GWCR).forEach(function (k) { GW[k] = GWCR[k]; WP[k] = GWCR[k]; GKIND[k] = CRKIND[k]; });

  /* ---- profession keepsakes: back looks with no stats. Each item is drawn in its own frame and slung on the back;
     the torso part is the carrying strap across the chest (front shoulder to back hip) with a gold buckle ---- */
  var KG = '#e2b648', KGD = '#9a7420';
  function ksStrapD(g) { return D`M${g.scx + 9},${g.sy - 1} Q${g.scx - 1},${(g.sy + g.hy) / 2 - 2} ${g.scx - 12},${g.hy - 3}`; }
  function ksStrapAt(g, t) {
    var a = [g.scx + 9, g.sy - 1], m = [g.scx - 1, (g.sy + g.hy) / 2 - 2], b = [g.scx - 12, g.hy - 3], u = 1 - t;
    return [u * u * a[0] + 2 * u * t * m[0] + t * t * b[0], u * u * a[1] + 2 * u * t * m[1] + t * t * b[1]];
  }
  function ksStrap(c, g, col, buckle) {
    var d = ksStrapD(g), m = ksStrapAt(g, 0.5);
    return S(d, OL, 4.4) + S(d, col, 2.6) + (buckle === false ? '' : R(m[0] - 2.3, m[1] - 2.3, 4.6, 4.6, c.cel(KG), 1.1) + R(m[0] - 0.9, m[1] - 0.9, 1.8, 1.8, col, 0));
  }
  function ksOn(g, dx, dy, rot, s) { return 'translate(' + r1(g.bSh[0] + dx) + ',' + r1(g.sy + dy) + ') rotate(' + rot + ')' + (s && s !== 1 ? ' scale(' + s + ')' : ''); }
  function ksWood(c, col) { return c.lg([[0, lt(col, 0.28)], [0.5, col], [1, dk(col, 0.4)]], 0, 0, 1, 0); }
  /* Deepdelver's Pick: a master's pickaxe, a mithril-blue double-pointed head with a gold socket and a ruby, gold-banded haft */
  function ksPick(c) {
    var hd = 'M-23,-30 C-15,-42 -7,-46.5 0,-46.5 C7,-46.5 15,-42 23,-30 C15,-36 7,-38.4 0,-38.4 C-7,-38.4 -15,-36 -23,-30 Z';
    return P('M-2.3,28 L-2.7,-40 L2.7,-40 L2.3,28 Z', ksWood(c, '#7a5230'), 1.9) +
      P('M-2.6,14 L2.6,14 L2.4,26 L-2.4,26 Z', c.cel('#4a2e1a'), 1.4) + S('M-2.5,16 L2.5,17.6 M-2.5,19.4 L2.5,21 M-2.5,22.8 L2.5,24.4', '#2a1a0e', 0.9) +
      R(-3.2, 11, 6.4, 3, c.cel(KG), 1.2) + R(-3, -22, 6, 2.8, c.cel(KG), 1.2) + P('M-2.6,28 L2.6,28 L0,32.5 Z', c.cel(KG), 1.2) +
      P(hd, c.lg([[0, '#eef6ff'], [0.4, '#8eaad0'], [1, '#34486c']], 0, 0, 0, 1), 2) +
      S('M-17,-35.4 C-11,-40.4 -5,-42.2 0,-42.2 C5,-42.2 11,-40.4 17,-35.4', KG, 0.8, 0.9) + S('M-20,-32.6 C-13,-40.6 -6,-44.6 0,-44.8', '#ffffff', 0.8, 0.7) +
      P('M-4.4,-47.5 L4.4,-47.5 L4,-36 L-4,-36 Z', c.cel(KG), 1.5) + S('M-4.2,-44.5 L4.2,-44.5 M-4,-39 L4,-39', KGD, 0.7) +
      C(0, -41.8, 1.9, c.rg([[0, '#ffc0b0'], [0.5, '#c8202a'], [1, '#4a0810']], 0.4, 0.35, 0.7), 1);
  }
  GBACK.deepdelvers_pick = {
    back: function (c, g) { return G(ksPick(c), ksOn(g, -6, 20, -30, 1.05)); },
    torso: function (c, g) { return ksStrap(c, g, '#6a4428'); }
  };
  /* Herbwise Satchel: a tooled leather satchel, its flap thrown open and herbs spilling out (leaves, a lavender sprig,
     a yellow bloom, red berries), gold clasp and gold-stitched trim */
  function ksSatchel(c) {
    var bag = 'M-12,-6 C-12,-9 12,-9 12,-6 L12.6,9 C12.6,12.6 -12.6,12.6 -12.6,9 Z', out = '';
    var lv = [[-6, -6, 13, -112, '#4e9a34'], [1, -7, 15, -84, '#3e7e2a'], [6, -6, 12, -58, '#5aa83c'], [-9, -5, 10, -140, '#3e7e2a'], [9, -5, 10, -30, '#4e9a34']];
    lv.forEach(function (l) { var f = wrLeafD(l[0], l[1], l[2], l[3]); out += P(f.d, c.cel(l[4]), 1.2) + S(f.vein, dk(l[4], 0.4), 0.7); });
    /* lavender sprig */
    out += S('M-2,-6 C-3,-12 -4,-17 -5,-22', '#3e6a2a', 1.4);
    [[-3.4, -12], [-4.2, -15.5], [-4.8, -19], [-5.2, -22.4]].forEach(function (p) { out += E(p[0], p[1], 1.6, 2.2, c.cel('#9a6ad8'), 0.8, null, -12); });
    /* yellow bloom and red berries */
    out += S('M4,-6 C5,-11 6.6,-14 8.4,-16', '#3e6a2a', 1.3);
    [0, 72, 144, 216, 288].forEach(function (a) { var r = a * Math.PI / 180; out += C(8.4 + Math.cos(r) * 2.2, -16 + Math.sin(r) * 2.2, 1.7, c.cel('#f2d24a'), 0.8); });
    out += C(8.4, -16, 1.2, '#c86a1a', 0.6) + C(-10.4, -9.8, 1.6, c.cel('#d0302a'), 0.8) + C(-12.4, -7.8, 1.4, c.cel('#d0302a'), 0.8);
    out += P(bag, c.cel('#8a5a30'), 2) + CG(S('M-10.4,-3.6 L-10.4,9 C-10.4,10.6 10.4,10.6 10.4,9 L10.4,-3.6', KG, 0.7, 0.9) + F('M-12,2 L12,2 L12,12 L-12,12 Z', '#000000', 0.12), c.clip(bag));
    /* open flap hanging down the front, a drooping leaf over its edge, the gold clasp */
    out += P('M-12,-6.4 L12,-6.4 L10.6,1.6 C6,4 -6,4 -10.6,1.6 Z', c.cel('#a06a3a'), 1.6) + S('M-10,-4.6 L10,-4.6', KG, 0.7, 0.85);
    var dl = wrLeafD(5, -5, 10, 70);
    out += P(dl.d, c.cel('#5aa83c'), 1.1) + S(dl.vein, '#2e5a1e', 0.7);
    return out + P('M-2.4,1 L2.4,1 L2.4,4.8 L0,6.6 L-2.4,4.8 Z', c.cel(KG), 1.1) + C(0, 3, 0.9, '#3e7e2a', 0);
  }
  GBACK.herbwise_satchel = {
    back: function (c, g) { return G(ksSatchel(c), ksOn(g, -10, 10, -14, 1.1)); },
    torso: function (c, g) { return ksStrap(c, g, '#7a5030'); }
  };
  /* Hide-Hunter's Pelt: a dire wolf's pelt over the shoulders, short at the back with a shaggy hem and the hind paws
     hanging, the wolf's head lying on the upper back, a forepaw over the front shoulder, a gold chain and clasps */
  var KPELT = '#8e7a62', KPELTD = '#4a3a2c', KPELTL = '#d2c2a6';
  GBACK.hide_hunters_pelt = {
    back: function (c, g) {
      var b = g.b, scx = g.scx, sy = g.sy, hy = g.hy, A = [scx - b.shW - 2, sy + 6], H0 = [scx + b.shW - 3, sy + 8], H1 = [scx - b.shW - 12, hy + 4];
      var d = D`M${A[0]},${A[1]} Q${scx - b.shW},${sy - 5} ${scx - 3},${sy - 4} L${scx + b.shW - 3},${sy - 1} L${H0[0]},${H0[1]}`, n = 8, i;
      for (i = 0; i < n; i++) {
        var t0 = i / n, t1 = (i + 1) / n, tm = (t0 + t1) / 2;
        var pm = [H0[0] + (H1[0] - H0[0]) * tm, H0[1] + (H1[1] - H0[1]) * tm + 4], p1 = [H0[0] + (H1[0] - H0[0]) * t1, H0[1] + (H1[1] - H0[1]) * t1];
        d += D` L${pm[0]},${pm[1]} L${p1[0]},${p1[1]}`;
      }
      d += D` C${scx - b.shW - 14},${hy - 10} ${scx - b.shW - 8},${sy + 18} ${A[0]},${A[1]} Z`;
      var paw = function (x, y) { return P(D`M${x - 2.6},${y - 6} C${x - 3.4},${y} ${x - 3},${y + 4} ${x},${y + 4.6} C${x + 3},${y + 4} ${x + 3.4},${y} ${x + 2.6},${y - 6} Z`, c.cel(KPELT), 1.6) + S(D`M${x - 1.8},${y + 4.4} l-0.4,2 M${x},${y + 4.8} l0,2.2 M${x + 1.8},${y + 4.4} l0.4,2`, KG, 1.2); };
      return paw(H1[0] + 6, H1[1] + 4) + paw(H1[0] + 14, H1[1] + 1) +
        P(d, c.cel(KPELT)) + CG(S(D`M${scx - 4},${sy - 3} Q${scx - b.shW - 6},${sy + 10} ${H1[0] + 3},${H1[1] - 2}`, KPELTD, 5, 0.6) +
          S(D`M${H0[0] - 8},${H0[1] + 2} L${H1[0] + 2},${H1[1] + 2}`, KPELTL, 2.4, 0.5), c.clip(d)) + P(d, 'none', 2.4);
    },
    torso: function (c, g) {
      var x = g.scx - 3, y = g.sy - 3, col = KPELT;
      /* the wolf's head on the upper back, long muzzle pointing down the back, ears up, eyes shut */
      var hd = D`M${x + 3},${y - 1} C${x + 1},${y - 10} ${x - 13},${y - 12} ${x - 17},${y - 4} L${x - 25},${y + 7} C${x - 26},${y + 10} ${x - 23},${y + 12} ${x - 20},${y + 10} L${x - 10},${y + 9} C${x - 3},${y + 8} ${x + 3},${y + 5} ${x + 3},${y - 1} Z`;
      return P(D`M${x - 13},${y - 7} L${x - 16},${y - 17} L${x - 8},${y - 9} Z M${x - 4},${y - 8} L${x - 3},${y - 18} L${x + 2},${y - 8} Z`, c.cel(KPELTD), 1.6) +
        P(hd, c.cel(col), 2.2) +
        CG(F(D`M${x - 26},${y + 6} L${x - 12},${y + 3} L${x + 4},${y + 6} L${x + 4},${y + 14} L${x - 26},${y + 14} Z`, KPELTL, 0.85) + S(D`M${x - 14},${y - 4} q2,2 4,0`, '#241c14', 1.2), c.clip(hd)) +
        E(x - 24.4, y + 8.6, 1.8, 1.4, '#1e1610', 0) + C(x - 9, y + 1, 1.6, c.cel(KG), 1) +
        P(collarD(g), c.cel(col), 1.8);
    },
    front: function (c, g) {
      var bx = g.bSh[0] - 1, by = g.sy + 2, cx = g.scx + 8, cy = g.sy + 2;
      return drape(c, g, KPELT, KPELTL) +
        P(D`M${bx - 8},${by + 12} C${bx - 10},${by + 18} ${bx - 9},${by + 22} ${bx - 5},${by + 23} C${bx - 1},${by + 23} ${bx},${by + 18} ${bx - 2},${by + 12} Z`, c.cel(KPELT), 1.8) +
        S(D`M${bx - 7.5},${by + 23} l-0.6,2.4 M${bx - 5},${by + 23.5} l0,2.6 M${bx - 2.6},${by + 23} l0.6,2.4`, KG, 1.3) +
        S(D`M${bx + 3},${by - 1} Q${(bx + cx) / 2 + 2},${cy + 5} ${cx},${cy}`, OL, 2.4) + S(D`M${bx + 3},${by - 1} Q${(bx + cx) / 2 + 2},${cy + 5} ${cx},${cy}`, KG, 1.2) +
        C(cx, cy, 2.6, c.cel(KG), 1.2) + C(cx, cy, 1, '#c8202a', 0);
    }
  };
  /* Master Smith's Hammer: a big sledge with a dark steel head, gold-banded faces and a gold anvil mark, a leather-wrapped
     haft with gold rings */
  function ksHammer(c) {
    var hd = 'M-14,-51 L14,-51 L15,-49 L15,-34 L14,-32 L-14,-32 L-15,-34 L-15,-49 Z';
    return P('M-2.6,28 L-3,-34 L3,-34 L2.6,28 Z', ksWood(c, '#6e4a2c'), 1.9) +
      P('M-3,10 L3,10 L2.8,26 L-2.8,26 Z', c.cel('#4a2e1a'), 1.4) + S('M-2.9,12 L2.9,13.8 M-2.9,15.8 L2.9,17.6 M-2.9,19.6 L2.9,21.4 M-2.9,23.4 L2.9,25', '#2a1a0e', 0.9) +
      R(-3.6, 7.4, 7.2, 3, c.cel(KG), 1.2) + R(-3.6, -26, 7.2, 3, c.cel(KG), 1.2) + C(0, 29, 2.8, c.cel(KG), 1.2) +
      P(hd, c.lg([[0, '#9aa4b0'], [0.45, '#5a6270'], [1, '#2a2e36']], 0, 0, 0, 1), 2) +
      F('M-14,-50 L-9,-50 L-9,-33 L-14,-33 Z M9,-50 L14,-50 L14,-33 L9,-33 Z', '#c8d0da', 0.55) +
      P('M-10.4,-51.6 L-7,-51.6 L-7,-31.4 L-10.4,-31.4 Z M7,-51.6 L10.4,-51.6 L10.4,-31.4 L7,-31.4 Z', c.cel(KG), 1.2) +
      P('M0,-46.6 L4.6,-41.5 L0,-36.4 L-4.6,-41.5 Z', c.cel(KG), 1.1) + C(0, -41.5, 1.4, c.rg([[0, '#ffc0b0'], [0.5, '#c8202a'], [1, '#4a0810']], 0.4, 0.35, 0.7), 0.7) +
      S('M-13,-49 L-13,-34', '#ffffff', 0.8, 0.6);
  }
  GBACK.master_smiths_hammer = {
    back: function (c, g) { return G(ksHammer(c), ksOn(g, -5, 22, -26, 1)); },
    torso: function (c, g) { return ksStrap(c, g, '#5a3a22'); }
  };
  /* Tanner's Rolled Hides: a thick bedroll of rolled leather hides (dark hide wrapped round tan), the spiral showing at the
     top end, two straps with gold buckles, a fur edge peeking out */
  function ksHides(c) {
    var body = 'M-9,-16 L9,-16 L9,16 C9,20.4 -9,20.4 -9,16 Z', sp = '', i, n = 34;
    for (i = 0; i <= n; i++) { var t = i / n, a = t * Math.PI * 5.4, r = 0.8 + t * 7.8; sp += (i ? 'L' : 'M') + r1(Math.cos(a) * r) + ',' + r1(-16 + Math.sin(a) * r * 0.5); }
    var strap = function (y) { return P(D`M-9.4,${y - 2} Q0,${y + 2.6} 9.4,${y - 2} L9.4,${y + 1.6} Q0,${y + 6.2} -9.4,${y + 1.6} Z`, c.cel('#3a2414'), 1.3) + R(-2.4, y - 0.4, 4.8, 4.4, c.cel(KG), 1) + R(-0.9, y + 0.9, 1.8, 1.8, '#3a2414', 0); };
    return P('M-8,18 L-11.4,24.6 L-7,22.4 L-6,27 L-3,21.6 L0,26 L2,20.6 Z', c.cel('#cfae80'), 1.2) +
      P(body, c.lg([[0, '#c47e50'], [0.45, '#94522e'], [1, '#4e2814']], 0, 0, 1, 0), 2) +
      P('M8.6,-13 C12.6,-7 12.8,2 10.4,9.6 L8.8,9.4 Z', c.cel('#b0683c'), 1.3) + S(stitchLine(10.2, -8, 10.6, 6, 2.6), '#f0d8a8', 0.6, 0.8) +
      E(0, -16, 9, 4.6, c.cel('#e6c290'), 1.8) + S(sp, '#6a3418', 1.5) + S(sp, '#fff0d0', 0.5, 0.5) +
      strap(-8) + strap(7);
  }
  GBACK.tanners_rolled_hides = {
    back: function (c, g) { return G(ksHides(c), ksOn(g, -9, 18, -24, 1.05)); },
    torso: function (c, g) { return ksStrap(c, g, '#4a2e18'); }
  };
  /* Weaver's Spindle: a tall carved spindle, a fat cop of crimson thread wound on it, a gold-rimmed whorl, a gold hook at
     the top with a loose thread trailing */
  function ksSpindle(c) {
    var cop = 'M0,-24 C9.6,-18 11.2,1 1,12 L-1,12 C-11.2,1 -9.6,-18 0,-24 Z', wd = '', wd2 = '';
    for (var y = -20; y < 12; y += 3.2) { wd += D`M-11,${y + 4} L11,${y - 2} `; wd2 += D`M-11,${y + 5.4} L11,${y - 0.6} `; }
    return P('M-1.6,30 L-1.9,-40 L1.9,-40 L1.6,30 Z', ksWood(c, '#8a5a30'), 1.6) +
      P(cop, c.lg([[0, '#f06a7a'], [0.5, '#c02a44'], [1, '#6a0e22']], 0, 0, 1, 0), 2) + CG(S(wd, '#ff9aa8', 0.8, 0.7) + S(wd2, '#5a0a1a', 0.6, 0.6), c.clip(cop)) +
      R(-2.2, 18, 4.4, 2.4, c.cel(KG), 1) + C(0, 31, 2, c.cel(KG), 1.1) +
      E(0, -31, 10, 3.6, c.cel('#7a4a28'), 1.8) + S('M-9,-30.4 C-4.6,-27.8 4.6,-27.8 9,-30.4', KG, 1.3) + C(0, -32.4, 1.6, c.cel(KG), 0.9) +
      S('M0,-40 L0,-44 C0,-47.4 4,-47.4 4,-44.4', OL, 2.6) + S('M0,-40 L0,-44 C0,-47.4 4,-47.4 4,-44.4', KG, 1.3) +
      S('M4,-44.4 C6,-40 3.6,-36 6.6,-31.6 C9.6,-27 8,-21 11,-16', '#c02a44', 1.1, 0.95);
  }
  GBACK.weavers_spindle = {
    back: function (c, g) { return G(ksSpindle(c), ksOn(g, -9, 18, -22, 1)); },
    torso: function (c, g) { return ksStrap(c, g, '#6a4a6a'); }
  };
  /* Alchemist's Bandolier: a gold-studded strap across the chest with glowing vials in its loops, and a holster on the back
     with three tall flasks */
  var KVIAL = [['#7aff6a', '#2a9a2a'], ['#6ad8ff', '#1a6ab0'], ['#ff7a8a', '#b01a3a'], ['#d8a0ff', '#6a2aa8']];
  function ksVial(c, x, y, s, v, tall) {
    var h = tall ? 1.6 : 1, b = D`M${x - 1.2 * s},${y - 3.4 * s * h} L${x + 1.2 * s},${y - 3.4 * s * h} L${x + 1.2 * s},${y - 1.4 * s} C${x + 2.8 * s},${y - 0.6 * s} ${x + 2.8 * s},${y + 3 * s} ${x},${y + 3 * s} C${x - 2.8 * s},${y + 3 * s} ${x - 2.8 * s},${y - 0.6 * s} ${x - 1.2 * s},${y - 1.4 * s} Z`;
    return C(x, y + 0.6 * s, 4.6 * s, c.rg([[0, v[0], 0.6], [1, v[0], 0]]), 0) +
      P(b, c.lg([[0, '#ffffff'], [0.3, v[0]], [1, v[1]]], 0.2, 0, 0.8, 1), 1.1) + S(D`M${x - 1.2 * s},${y + 0.6 * s} L${x - 0.9 * s},${y + 2 * s}`, '#ffffff', 0.6 * s, 0.8) +
      R(x - 1.6 * s, y - 4.6 * s * h, 3.2 * s, 1.4 * s, c.cel(KG), 0.8);
  }
  GBACK.alchemists_bandolier = {
    back: function (c, g) {
      var x = g.bSh[0] - 6, y = g.sy + 14, out = '';
      out += ksVial(c, x - 5, y - 8, 1.8, KVIAL[3], 1) + ksVial(c, x + 1, y - 12, 1.9, KVIAL[0], 1) + ksVial(c, x + 7, y - 7, 1.7, KVIAL[1], 1);
      return out + P(D`M${x - 9},${y - 6} L${x + 10},${y - 6} L${x + 9},${y + 6} C${x + 4},${y + 8} ${x - 4},${y + 8} ${x - 9},${y + 6} Z`, c.cel('#5a3a22'), 1.6) +
        S(D`M${x - 8},${y - 3.4} L${x + 9},${y - 3.4}`, KG, 0.9) + C(x, y + 1.8, 1.4, c.cel(KG), 0.8);
    },
    torso: function (c, g) {
      var out = ksStrap(c, g, '#4a2e1a', false), k = g.b.shW / 16;
      [0.22, 0.42, 0.62, 0.82].forEach(function (t, i) { var p = ksStrapAt(g, t); out += C(p[0], p[1], 1.1, KG, 0) + ksVial(c, p[0], p[1] - 2, 1.4 * k, KVIAL[i]); });
      return out;
    }
  };
  /* Chef's Stewpot: a fat iron stewpot with a brass rim and ears, its lid knocked askew by a carrot, a ladle sticking out,
     steam curling up; roped on with a gold buckle */
  function ksPot(c) {
    var pot = 'M-12,-6 L12,-6 C13.5,4 9,12.6 0,12.6 C-9,12.6 -13.5,4 -12,-6 Z';
    return S('M-5,-22 C-3,-26 -7,-29 -4.6,-33 M2,-21 C4.4,-25 0.6,-28 3.4,-32 M8,-17 C10,-20 7.6,-23 9.6,-26', '#ffffff', 1.6, 0.55) +
      S('M3,-4 L-9,-25', OL, 3.4) + S('M3,-4 L-9,-25', '#c8ccd2', 1.8) + S(rsOrbD(-9.4, -25.6, 2), OL, 2.6) + S(rsOrbD(-9.4, -25.6, 2), KG, 1.2) +
      P('M-3,-7 L-1,-15 L1.6,-15.4 L1.6,-7 Z', c.cel('#ee7a22'), 1.2) + S('M-1,-15 L-3.4,-19.6 M0.4,-15.2 L0.6,-20.6 M1.4,-15.2 L4,-19', '#3e8a2a', 1.4) +
      S(rsOrbD(-13.4, -3, 2.4), OL, 3) + S(rsOrbD(-13.4, -3, 2.4), KG, 1.4) +
      S(rsOrbD(13.4, -3, 2.4), OL, 3) + S(rsOrbD(13.4, -3, 2.4), KG, 1.4) +
      P(pot, c.lg([[0, '#f4a874'], [0.4, '#c8642e'], [1, '#5e2a12']], 0.2, 0, 0.8, 1), 2.2) +
      S('M-8,0 C-7,5 -4,8.6 0,9.4', '#ffd0a8', 1.1, 0.8) +
      P('M-6,11.6 L-7,15 L-4.4,15 L-3.6,12.4 Z M6,11.6 L7,15 L4.4,15 L3.6,12.4 Z', c.cel('#2a2b30'), 1.1) +
      R(-13, -8, 26, 3.4, c.cel(KG), 1.4) +
      G(P('M-12,-1 C-8,-6 8,-6 12,-1 Z', c.lg([[0, '#f0b080'], [1, '#8a4220']], 0, 0, 0, 1), 1.6) + C(0, -5.4, 1.8, c.cel(KG), 1), 'translate(1,-8.6) rotate(-14)');
  }
  GBACK.chefs_stewpot = {
    back: function (c, g) { return G(ksPot(c), ksOn(g, -11, 9, -10, 1.1)); },
    torso: function (c, g) { return ksStrap(c, g, '#b8a070'); }
  };
  /* Angler's Rod: a long rod slung on the back, a cork grip and a gold reel, gold ferrules; from the tip the line hangs
     down to a red-and-white float and a hook */
  function ksRod(c) {
    return P('M-1.5,0 C-1.4,-28 -0.6,-56 2.6,-82 L3.4,-81.8 C1,-56 1.5,-28 1.5,0 Z', ksWood(c, '#6a4a2a'), 1.3) +
      R(-1.8, -28, 3.6, 2, c.cel(KG), 0.8) + R(-1.4, -54, 2.8, 1.8, c.cel(KG), 0.8) +
      P('M-2.6,0 L2.6,0 L2.4,15 L-2.4,15 Z', c.cel('#d8b07a'), 1.4) + S('M-2.4,4 L2.4,4 M-2.4,8 L2.4,8 M-2.4,12 L2.4,12', '#a07a48', 0.7) +
      P('M-2.8,15 L2.8,15 L2.2,18.4 L-2.2,18.4 Z', c.cel(KG), 1.2) +
      C(4.6, 4, 3.8, c.cel(KG), 1.3) + C(4.6, 4, 1.4, '#5a3a14', 0) + S('M4.6,4 L8.4,1.6', OL, 2) + C(8.6, 1.4, 1.2, c.cel('#2a1a10'), 0.8);
  }
  GBACK.anglers_rod = {
    back: function (c, g) {
      var tx = g.bSh[0] - 2, ty = g.hy - 4, a = -24 * Math.PI / 180, s = 0.95;
      var tip = [tx + s * (3 * Math.cos(a) + 82 * Math.sin(a)), ty + s * (3 * Math.sin(a) - 82 * Math.cos(a))];
      var fl = [tip[0] - 3, tip[1] + 30], ln = D`M${tip[0]},${tip[1]} Q${tip[0] - 4},${tip[1] + 14} ${fl[0]},${fl[1] - 3}`;
      var fd = D`M${fl[0]},${fl[1] - 4} C${fl[0] + 3},${fl[1] - 4} ${fl[0] + 3.4},${fl[1] + 4} ${fl[0]},${fl[1] + 5} C${fl[0] - 3.4},${fl[1] + 4} ${fl[0] - 3},${fl[1] - 4} ${fl[0]},${fl[1] - 4} Z`;
      return G(ksRod(c), 'translate(' + r1(tx) + ',' + r1(ty) + ') rotate(-24) scale(' + s + ')') +
        S(ln, '#f4f0e6', 0.8, 0.9) + S(D`M${fl[0]},${fl[1] + 5} L${fl[0]},${fl[1] + 10} C${fl[0]},${fl[1] + 12.6} ${fl[0] + 2.6},${fl[1] + 12.6} ${fl[0] + 2.6},${fl[1] + 10}`, '#f4f0e6', 0.8, 0.9) +
        P(fd, '#f6f2ea', 1.2) + CG(F(D`M${fl[0] - 4},${fl[1] - 5} L${fl[0] + 4},${fl[1] - 5} L${fl[0] + 4},${fl[1] + 0.6} L${fl[0] - 4},${fl[1] + 0.6} Z`, '#d02a2a'), c.clip(fd)) + P(fd, 'none', 1.2) +
        S(D`M${fl[0]},${fl[1] - 4} L${fl[0]},${fl[1] - 6.4}`, OL, 1.2) + C(fl[0], fl[1] - 6.6, 0.9, KG, 0.6);
    },
    torso: function (c, g) { return ksStrap(c, g, '#5a3a22'); }
  };
  var GEARKEYS = {
    weapon: Object.keys(GKIND), ranged: Object.keys(GRANGED), back: Object.keys(GBACK), chest: Object.keys(GCHEST),
    legs: Object.keys(GLEGS), mask: Object.keys(GMASK)
  };
  function gk(gear, slot, table) { var v = gear[slot]; return typeof v === 'string' && table.hasOwnProperty(v) ? v : null; }
  function applyGear(o, gear, cls) {
    var k;
    if ((k = gk(gear, 'weapon', GKIND))) gearWeapon(o, k, cls);
    if (cls === 'hunter' && (k = gk(gear, 'ranged', GRANGED))) o.fItem = FI(k, 0);
    if ((k = gk(gear, 'chest', GCHEST))) { o.robe = null; o.robeFx = null; o.bell = null; GCHEST[k](o); }
    if ((k = gk(gear, 'legs', GLEGS))) { o.pants = GLEGS[k].pants; o.gLeg = GLEGS[k].fx; }
    if ((k = gk(gear, 'back', GBACK))) {
      var bk = GBACK[k], prevT = o.gTorso;
      o.cape = null; o.gBack = bk.back;
      o.gTorso = function (c, g) { return (prevT ? prevT(c, g) : '') + bk.torso(c, g); };
      if (bk.front) o.gFront = bk.front;
    }
    if ((k = gk(gear, 'mask', GMASK))) { o.mask = GMASK[k]; o.maskKnot = gearMaskKnot; }
  }

  /* ================= mobs ================= */
  function mobH(c, o, rx) { return shadow(c, 64, rx || 30) + G(humanoid(c, o), MIRROR); }
  function defias(x) {
    var o = {
      skin: SKIN[1], gender: 'm', hood: '#6b6f74', mask: '#8a8e93', angry: true,
      torsoC: '#8d8474', sleeve: '#8d8474', hand: '#4a3526', pants: '#4b3a2b', boots: '#2a211a',
      belt: '#2b2018', buckle: '#b9b1a0', torsoFx: vestFx('#6a4a2f'), armband: '#5d6166', body: {}
    };
    for (var k in x) o[k] = x[k];
    return o;
  }

  /* quadruped base (drawn FACING LEFT) */
  var QK = {
    wolf: {
      legW: 8.5,
      far: [[[46, 84], [42, 104], [40, 118]], [[94, 84], [102, 102], [96, 118]]],
      near: [[[52, 84], [50, 104], [48, 119]], [[100, 84], [107, 101], [102, 119]]],
      haunch: 'M86,68 C96,62 111,67 111,80 C111,90 105,96 101,98 L92,92 C87,86 84,77 86,68 Z',
      tail: 'M106,62 C119,57 127,67 125,81 C123,88 118,92 113,91 C118,83 114,74 106,72 Z',
      body: 'M38,64 C46,54 76,54 98,58 C110,60 114,72 110,84 C106,94 90,95 74,93 C60,93 48,92 42,88 C35,82 33,71 38,64 Z',
      belly: 'M30,82 C50,96 90,98 118,84 L118,100 L30,100 Z',
      ruff: 'M44,58 C35,66 37,80 45,88 L49,82 L53,90 L57,82 L63,86 L62,62 Z',
      head: function (c, o, f, fd) {
        return P('M44,46 L50,31 L56,48 Z', fd) +
          P('M50,52 C46,42 34,40 26,44 L14,50 L6,53 C3,55 3,60 7,61 L18,63 C24,69 34,72 42,71 C50,70 56,64 56,58 C56,55 53,53 50,52 Z', c.cel(f)) +
          F('M6,53 C3,55 3,60 7,61 L18,63 C22,66 26,66 28,62 C22,62 14,58 6,53 Z', o.belly, 0.8) +
          S('M8,61 C14,63.5 20,63.5 27,62', OL, 1.6) + P('M16,62.5 L18.2,67 L20.4,62.8 Z', '#f4eee0', 1.1) +
          P('M35,45 L38.5,29 L47,44 Z', f) + F('M38.5,42 L39.5,34 L44,42.5 Z', '#6a3a36', 0.8) +
          P('M23,51 Q28,46.5 33,50 Q28,53.5 23,51 Z', o.eye || '#f2c230', 1.3) + C(27, 50.5, 1.2, '#140c08', 0) +
          S('M21,47.5 L34,46', OL, 2.2) + E(6.2, 55.6, 3, 2.5, '#140c08', 0) +
          S('M44,64 L48,70 M49,62 L53,68', dk(f, 0.35), 1.2);
      }
    },
    bear: {
      legW: 14,
      far: [[[42, 86], [40, 104], [40, 116]], [[96, 86], [100, 104], [98, 116]]],
      near: [[[50, 86], [48, 106], [48, 117]], [[103, 84], [107, 104], [104, 117]]],
      haunch: 'M88,64 C101,58 117,65 117,82 C117,92 111,99 106,101 L94,95 C88,86 84,73 88,64 Z',
      tail: 'M113,68 C121,66 123,74 118,77 Z',
      body: 'M30,70 C32,52 58,42 82,46 C104,48 118,60 116,80 C114,96 98,99 80,98 C60,99 42,99 34,92 C27,86 28,78 30,70 Z',
      belly: 'M24,86 C50,100 90,102 120,88 L120,104 L24,104 Z',
      ruff: '',
      head: function (c, o, f, fd) {
        return C(40, 46, 4.8, fd) + C(32, 44, 5.4, f) + C(32, 44.5, 2.4, '#5a3a30', 0) +
          P('M44,54 C41,43 28,41 20,46 C14,50 10,54 7,58 C4,62 5,68 11,69 C20,75 35,77 43,72 C51,67 51,58 44,54 Z', c.cel(f)) +
          P('M7,58 C4,62 5,68 11,69 C17,70 22,67 21,61 C17,56 11,55 7,58 Z', c.cel(o.belly), 1.6) +
          E(6.8, 60, 3.2, 2.7, '#140c08', 0) + S('M9,66.5 C14,68.5 18,68.5 22,66', OL, 1.4) +
          C(24.5, 54.5, 2, '#140c08', 0) + C(24, 54, 0.7, '#fff', 0) + S('M20,51 L29,51.5', OL, 2);
      }
    },
    boar: {
      legW: 11,
      far: [[[44, 90], [42, 106], [42, 116]], [[96, 88], [100, 104], [98, 116]]],
      near: [[[52, 90], [50, 106], [50, 117]], [[103, 86], [107, 104], [104, 117]]],
      haunch: 'M90,66 C102,60 118,68 117,84 C117,94 111,99 107,101 L96,95 C89,86 86,74 90,66 Z',
      tail: '',
      body: 'M30,70 C34,54 62,48 88,52 C108,56 120,68 116,86 C112,98 92,100 72,99 C52,100 36,98 30,90 C26,84 26,76 30,70 Z',
      belly: 'M24,88 C50,102 90,102 122,90 L122,104 L24,104 Z',
      ruff: '',
      head: function (c, o, f, fd) {
        return P('M46,58 C40,52 28,54 22,60 L10,68 C5,71 5,80 9,82 L16,84 C24,89 40,89 48,82 C54,76 54,64 46,58 Z', c.cel(f)) +
          E(8, 75, 3.6, 6.6, c.cel('#d9a08a'), 1.8) + C(8, 72.5, 0.9, '#3a1a14', 0) + C(8, 77.5, 0.9, '#3a1a14', 0) +
          P('M17,82 C11,81 9.5,75 12.5,70 C14,75 16.5,78 21,80 Z', '#f4ecd6', 1.6) +
          P('M36,58 L39,45 L48,58 Z', f) + F('M39,55 L40,49 L44,55 Z', '#6a3a36', 0.8) +
          C(28, 66, 2, '#2a0a0a', 0) + C(27.6, 65.5, 0.7, '#ff8a6a', 0) + S('M23,62 L33,63.5', OL, 2.2) +
          S('M12,84 C18,86 26,86 32,84', OL, 1.4);
      }
    },
    /* big cat (Kaldvik): long low body, thick tail, round head, short muzzle */
    cat: {
      legW: 8,
      far: [[[44, 86], [41, 104], [38, 118]], [[92, 84], [100, 101], [95, 118]]],
      near: [[[51, 86], [49, 104], [46, 119]], [[99, 82], [107, 100], [101, 119]]],
      haunch: 'M84,64 C96,58 112,64 112,79 C112,90 106,96 102,98 L92,92 C86,86 82,75 84,64 Z',
      tail: 'M104,64 C115,60 122,70 122,86 C122,98 120,108 113,110 C107,110 108,104 111,100 C115,92 114,80 104,74 Z',
      body: 'M36,66 C44,56 76,55 98,59 C110,61 114,73 110,85 C106,94 90,94 74,92 C60,92 46,92 40,88 C33,82 31,72 36,66 Z',
      belly: 'M30,82 C50,96 90,98 118,84 L118,100 L30,100 Z',
      ruff: '',
      head: function (c, o, f, fd) {
        var mz = o.muzzle || lt(f, 0.4), out = '';
        out += P('M44,44 L46,33 L53,43 Z', fd, 2);
        out += P('M53,54 C53,43 44,37 32,38 C24,39 18,43 15,48 L10,51 C6.5,53 6.5,60 10,62 L16,64 C22,70 32,72 40,70 C49,68 54,62 53,54 Z', c.cel(f));
        out += F('M10,51 C6.5,53 6.5,60 10,62 L16,64 C20,67 26,67 28,61 C28,55 22,50 16,49 Z', mz, 0.9);
        out += o.torn ? P('M34,41 C32,33 36,29 39,30 L39,34 L42,33 C45,35 44,39 41,43 Z', c.cel(f), 2) : P('M34,41 C32,33 37,29 42,31 C45,34 44,39 41,43 Z', c.cel(f), 2);
        out += F('M36,39 C35,35 37,33 39,34 C41,36 41,39 39,41 Z', o.earIn || '#8a5a50', 0.7);
        out += P('M7.5,52.5 L12.5,51.5 L11.5,55.5 Z', '#c86a6a', 1.2);
        if (o.snarl) out += P('M9.5,60 C14,58 20,58 26,60 C23,67 15,68 11,64.5 Z', '#5a1414', 1.5) + F('M12.5,60 l1.3,3.6 l1.3,-3.6 z M20.5,59.8 l1.3,3.8 l1.3,-3.8 z', '#f6f0dc') + F('M13.5,65 l1,-2.6 l1,2.6 z', '#f6f0dc');
        else out += S('M10,60.5 C13,62.5 17,62.5 21,60.5', OL, 1.4) + S('M11.5,55.5 L11.5,60', OL, 1.1);
        out += P('M21,48.5 Q26.5,44.5 32,47.5 Q26.5,51 21,48.5 Z', o.eye || '#b8e04a', 1.2) + E(26.8, 48, 0.9, 2, '#140c08', 0);
        out += S(o.snarl ? 'M19,43.5 L32,46.5' : 'M19,45 L32,44', OL, 2.2);
        out += C(15, 57, 0.7, '#2a1a10', 0) + C(18, 58.5, 0.7, '#2a1a10', 0) + C(15.5, 60, 0.6, '#2a1a10', 0);
        if (o.spots) out += C(38, 50, 1.4, o.spots, 0, 0.8) + C(44, 56, 1.6, o.spots, 0, 0.8) + C(36, 61, 1.2, o.spots, 0, 0.7) + C(46, 47, 1.2, o.spots, 0, 0.7) + C(48, 62, 1.3, o.spots, 0, 0.7);
        if (o.faceScar) out += S('M21,39 L31,55 M25,39 L33,52', '#f4e2cc', 1.2, 0.9);
        return out;
      }
    }
  };
  function paw(c, p, col, kind, clawC) {
    var x = p[0], y = 121.5;
    if (kind === 'boar') return P(D`M${x - 5},${y - 5} L${x + 5},${y - 5} L${x + 4},${y + 1} L${x - 6},${y + 1} Z`, '#2d2420', 2) + S(D`M${x - 1},${y - 4} L${x - 1},${y + 1}`, '#000', 1);
    var w = kind === 'bear' ? 8 : 5.5;
    return E(x - 2, y - 1, w, 3.4, col, 2) + S(D`M${x - w - 1},${y} l-1.5,0.6 M${x - w + 2},${y + 0.8} l-1.5,0.8`, clawC || '#efe6cf', 1.2);
  }
  function quad(c, o) {
    var K = QK[o.kind], f = o.fur, fd = dk(f, 0.3), out = '';
    out += shadow(c, 64, 50);
    K.far.forEach(function (L) { out += tube(L, K.legW, fd) + paw(c, L[2], fd, o.kind, o.clawC); });
    if (K.tail) out += P(K.tail, c.cel(o.kind === 'wolf' ? dk(f, 0.08) : f));
    if (o.spots && K.tail) out += CG(rosettes(o.spots, 104, 126, 62, 112, 7, rnd(3)), c.clip(K.tail));
    if (o.pstripes && K.tail) out += CG(S(PSTR.tail, o.pstripes, 2.2, 0.55), c.clip(K.tail));
    if (o.kind === 'boar') out += S('M114,72 C123,66 127,76 120,79 C115,80 117,72 122,72', OL, 4.5) + S('M114,72 C123,66 127,76 120,79 C115,80 117,72 122,72', f, 2);
    out += P(K.body, c.cel(f));
    var cl = c.clip(K.body);
    var inner = F(K.belly, o.belly, 0.85) + F('M40,60 C60,52 90,52 108,60 C92,58 60,58 40,66 Z', lt(f, 0.25), 0.55);
    if (o.patches) inner += E(70, 70, 8, 5, o.patches, 0, 0.75) + E(90, 76, 5, 4, o.patches, 0, 0.75) + E(56, 80, 5, 3, o.patches, 0, 0.6);
    if (o.stripes) inner += S('M66,58 l-3,10 M76,57 l-3,11 M86,58 l-3,10', o.stripes, 2.2, 0.6);
    if (o.spots) inner += rosettes(o.spots, 40, 110, 58, 90, 20, rnd(5));
    if (o.pstripes) inner += S(PSTR.body, o.pstripes, 2.4, 0.5);
    if (o.backStripe) inner += F('M40,62 C60,54 90,54 108,62 C92,59 60,59 40,68 Z', o.backStripe, 0.7);
    out += CG(inner, cl);
    if (o.kind === 'wolf') out += S('M60,57 l-4,-4 M70,56 l-3,-5 M80,57 l-2,-5 M92,58 l-1,-5', OL, 1.3, 0.6);
    if (o.thistle) out += thistleBack(c, o);
    if (o.kind === 'boar') out += P('M40,60 L43,47 L50,57 L55,44 L61,55 L67,43 L72,54 L78,44 L83,54 L89,46 L93,57 C80,52 56,52 40,62 Z', c.cel(o.mane || dk(f, 0.45)), 2);
    if (o.rocks) out += rockPlates(c, 1, o.rockC || '#7c7874');
    if (o.scruff) out += P('M46,60 L48,52 L53,58 L56,49 L61,56 L65,48 L70,55 L75,48 L79,55 L84,49 L88,56 L93,51 L97,58 C80,55 60,55 46,64 Z', c.cel(lt(f, 0.12)), 1.8) +
      S('M38,70 l-5,2 M37,78 l-5,1 M40,85 l-4,3 M58,93 l-1,5 M72,94 l0,5 M86,93 l1,5', OL, 1.4, 0.8);
    out += P(K.haunch, c.cel(f));
    if (o.pstripes) out += CG(S(PSTR.haunch, o.pstripes, 2.2, 0.5), c.clip(K.haunch));
    K.near.forEach(function (L) { out += tube(L, K.legW, f, dk(f, 0.28)) + paw(c, L[2], f, o.kind, o.clawC); });
    if (K.ruff) out += P(K.ruff, c.cel(o.ruffC || f));
    out += K.head(c, o, f, fd);
    if (o.pstripes) out += S(PSTR.head, o.pstripes, 1.6, 0.55);
    if (o.bow) out += P('M44,52 L37,47 L37,56 Z M44,52 L51,47 L51,56 Z', '#ff7fb0', 1.6) + C(44, 52, 2.2, '#ff5c9a', 1.4);
    if (o.scars) out += S('M64,64 l6,8 M68,63 l6,8', '#e8d8c0', 1.3, 0.8);
    if (o.bigTusk) out += P('M19,83 C8,83 3,73 8,63 C10,71 14,77 23,80 Z', c.lg(['#fbf6e8', '#e2d8c0', '#b8aa8a'], 0, 0, 1, 1), 1.7);
    if (o.kind === 'boar' && o.rocks > 1) out += rockPlates(c, 2, o.rockC || '#7c7874');
    return scaleAt(out, o.scale || 1, 64, 123);
  }

  /* kobold base (FACING LEFT) */
  function kobold(c, o) {
    var f = o.fur, fd = dk(f, 0.28), out = '';
    out += shadow(c, 62, 30);
    out += S('M78,100 C98,110 110,100 105,86', OL, 7) + S('M78,100 C98,110 110,100 105,86', '#c9a07a', 3);
    out += tube([[70, 96], [77, 109], [72, 118]], 9, fd) + P('M62,116 L75,116 L77,122.5 L60,122.5 Z', c.cel(fd), 2.2);
    out += tube([[71, 74], [79, 86], [75, 95]], 7, fd) + C(75, 96, 4, fd, 2);
    if (o.bItem) out += o.bItem(c);
    out += P('M50,72 C56,62 74,62 80,74 C86,88 82,102 70,105 C58,108 48,102 46,92 C44,84 45,77 50,72 Z', c.cel(f));
    out += CG(F('M44,84 C50,100 64,104 74,100 C66,96 54,92 48,78 Z', lt(f, 0.3), 0.7), c.clip('M50,72 C56,62 74,62 80,74 C86,88 82,102 70,105 C58,108 48,102 46,92 C44,84 45,77 50,72 Z'));
    if (o.vest) out += P('M60,66 C68,63 76,66 80,74 C83,82 82,92 78,98 L70,90 C68,82 64,72 60,66 Z', c.cel(o.vest), 2);
    out += P('M49,93 L79,95 L77,105 L71,103 L67,110 L61,104 L53,106 Z', c.cel(o.cloth || '#8e7b52'), 2);
    out += tube([[58, 99], [55, 110], [52, 118]], 9, f, dk(f, 0.28)) + P('M42,117 L57,117 L59,122.5 L40,122.5 Z', c.cel(f), 2.2) + S('M40,122.5 l-2.5,-0.4 M44,122.5 l-2,0.3', '#efe6cf', 1.3);
    out += P('M52,43 C49,28 63,23 69,33 C73,42 65,49 58,49 Z', c.cel(f)) + F('M55,42 C54,33 62,30 65,35 C67,41 63,45 58,45 Z', '#b7736a', 0.85);
    out += P('M62,48 C60,38 48,34 40,38 C32,42 24,48 16,54 C11,57 11,62 15,63 L28,64 C36,70 52,70 60,64 C66,60 66,52 62,48 Z', c.cel(f));
    out += F('M15,63 L28,64 C36,69 48,69 56,65 C44,64 30,62 16,58 Z', lt(f, 0.3), 0.7);
    out += C(13.5, 58.5, 2.8, '#3a2020', 1.4);
    out += P('M21,62.5 L21,68 L25.5,68 L25.5,63.2 Z', '#f6eed6', 1.3);
    out += C(36, 49.5, 2.8, '#120c08', 0) + C(35.2, 48.6, 0.95, '#fff', 0) + S('M31,45.5 L41,47.5', OL, 2);
    out += S('M20,59 L7,55 M20,61 L6,62 M21,63 L9,67', '#2a1a10', 0.8, 0.8);
    if (o.candle) {
      /* dented tin miner's helmet with a small oil lamp on the brow (the old `candle` option) */
      var hd = 'M33,42 C30,30 38,21 49,21 C60,21 67,29 65,40 Z', tin = o.helmet || '#8f949a';
      out += P(hd, c.cel(tin), 2.2);
      out += CG(F('M36,30 C39,24 46,22 52,23 C46,25 41,28 38,34 Z', lt(tin, 0.45), 0.7) +
        S('M55,26 Q57,29 55.5,32 M44,31 Q46.5,33 45.5,36', dk(tin, 0.45), 1.2, 0.85) + F('M54,27 Q56.5,29.5 55,32 Q53.5,29.5 54,27 Z', dk(tin, 0.25), 0.6) +
        S('M49,21 L49,40', dk(tin, 0.22), 1.1, 0.6), c.clip(hd));
      out += P('M28,43 C40,39 56,38 69,39.5 L68.5,43.5 C56,42.5 40,43 29,46.5 Z', c.cel(dk(tin, 0.12)), 2);
      out += C(66, 41.2, 1, dk(tin, 0.5), 0) + C(31.5, 44.2, 1, dk(tin, 0.5), 0);
      out += C(34, 33, 11, c.rg([[0, '#fff2b0', 0.7], [0.4, '#ffc050', 0.3], [1, '#ff9a30', 0]]), 0);
      out += P('M36.5,28 L36.5,38 L33,38 C30,38 29,35.5 29,33 C29,30.5 30,28 33,28 Z', c.cel('#5d6269'), 1.8) +
        E(31.2, 33, 2.4, 3.4, c.rg([[0, '#ffffff'], [0.5, '#ffe68a'], [1, '#ffab3a']], 0.4, 0.4, 0.7), 1.2);
    }
    if (o.fItem) out += o.fItem(c);
    out += tube([[57, 73], [49, 84], [41, 86]], 7, f, dk(f, 0.28)) + C(40, 86.5, 4.2, c.cel(f), 2);
    if (o.claws) out += S('M36.5,84 l-3,-1.5 M36,87 l-3.4,0.3 M37,89.5 l-2.8,1.6', '#efe6cf', 1.3);
    return scaleAt(out, o.scale || 1, 62, 123);
  }

  /* mireling base (FACING LEFT): an upright marsh newt with a frilled collar, eyes on top of the head,
     smooth spotted skin, a long tail and webbed hands and feet. Options: skin, belly, fin (the frill colour),
     apron, fItem. (`hat` is accepted and ignored.) */
  function webFoot(c, x, y, col, k) {
    var s = k || 1;
    return P(D`M${x + 7 * s},${y - 5} L${x - 2 * s},${y - 5} L${x - 9 * s},${y - 1} L${x - 6 * s},${y} L${x - 8 * s},${y + 1.5} L${x - 3 * s},${y + 1.2} L${x - 4 * s},${y + 2.6} L${x + 8 * s},${y + 2.6} Z`, c.cel(col), 1.8) +
      S(D`M${x - 1 * s},${y - 3.5} L${x - 6 * s},${y - 0.3} M${x + 1 * s},${y - 3} L${x - 2.5 * s},${y + 1.6}`, dk(col, 0.35), 0.9, 0.8);
  }
  function webHand(c, x, y, col) {
    return P(D`M${x + 3},${y - 3.5} C${x - 1},${y - 4.5} ${x - 5},${y - 5} ${x - 8},${y - 3.5} L${x - 6},${y - 1.5} L${x - 9.5},${y} L${x - 6},${y + 1.5} L${x - 8},${y + 4} C${x - 4},${y + 4.5} ${x},${y + 4} ${x + 3},${y + 3} Z`, c.cel(col), 1.7) +
      S(D`M${x - 1},${y - 2.5} L${x - 6},${y - 3} M${x - 1},${y} L${x - 7.5},${y} M${x - 1},${y + 2.3} L${x - 6.5},${y + 3.4}`, dk(col, 0.35), 0.8, 0.8);
  }
  function murloc(c, o) {
    var f = o.skin, fd = dk(f, 0.28), fin = o.fin || lt(f, 0.3), bl = o.belly || lt(f, 0.5), out = '';
    out += shadow(c, 66, 38);
    /* long tail sweeping back and curling along the ground */
    var tail = 'M70,96 C82,104 96,110 108,110 C116,110 121,106 122,100 C124,108 118,117 106,118 C92,119 78,114 64,106 Z';
    out += P(tail, c.cel(fd), 2.2) + CG(F('M66,104 C80,112 96,116 110,116 L110,122 L60,122 Z', dk(fd, 0.2), 0.6) + C(88, 110, 1.6, dk(fd, 0.3), 0, 0.7) + C(100, 112, 1.4, dk(fd, 0.3), 0, 0.7), c.clip(tail));
    /* far leg and arm */
    out += tube([[72, 98], [80, 108], [77, 117]], 6.5, fd) + webFoot(c, 76, 120, dk(fd, 0.1), 0.9);
    out += tube([[70, 66], [79, 78], [76, 88]], 5, fd) + webHand(c, 76, 89, dk(fd, 0.05));
    /* body: slim upright trunk */
    var body = 'M50,62 C52,53 69,51 75,60 C81,71 82,90 77,101 C72,110 57,110 51,102 C45,92 45,72 50,62 Z';
    out += P(body, c.cel(f));
    out += CG(F('M44,70 C48,88 54,102 64,108 C56,108 48,104 46,96 Z', bl, 0.9) + F('M46,74 C50,64 58,60 66,62 C58,66 52,72 50,84 Z', lt(f, 0.25), 0.5) +
      C(68, 66, 2.2, fd, 0, 0.7) + C(74, 76, 1.8, fd, 0, 0.7) + C(70, 88, 2, fd, 0, 0.6) + C(76, 94, 1.5, fd, 0, 0.6), c.clip(body));
    if (o.apron) out += P('M47,82 C54,86 66,87 76,84 L75,102 C66,108 54,107 49,100 Z', c.cel('#f4f0e6'), 2) + S('M49,82 C58,78 68,78 76,84', '#b8b0a0', 1.2, 0.8);
    /* frilled collar fanning out around the neck, behind the head */
    var frill = 'M52,58 C50,48 54,38 60,32 L63,37 L67,31 L68,38 L74,35 L72,42 L79,42 L74,48 L80,52 L73,55 L77,61 L69,61 L70,66 C63,66 56,63 52,58 Z';
    out += P(frill, c.cel(fin), 2) + CG(S('M58,57 L61,35 M60,58 L68,34 M62,59 L74,39 M63,60 L77,47 M64,61 L76,57', dk(fin, 0.35), 1.1, 0.85) + F('M54,56 C54,50 56,44 60,38 C60,46 60,52 62,60 Z', lt(fin, 0.3), 0.6), c.clip(frill));
    /* the collar wraps under the jaw on the near side */
    var frill2 = 'M60,56 C60,63 56,69 50,72 L49,67 L44,71 L43,66 L37,67 L40,62 L34,60 C42,60 52,59 60,56 Z';
    out += P(frill2, c.cel(dk(fin, 0.06)), 1.8) + CG(S('M58,58 L50,70 M56,59 L44,69 M52,60 L39,64', dk(fin, 0.38), 1, 0.85), c.clip(frill2));
    /* head: broad flat newt head, round eyes set on top, small mouth line */
    var hd = 'M60,52 C60,42 50,37 40,38 C30,39 21,43 18,49 C16,54 20,59 28,60 C38,62 52,62 57,58 C59,56 60,54 60,52 Z';
    out += C(46, 37, 5, c.cel(dk(f, 0.08)), 2) + C(46.6, 36.4, 2.6, '#f2ecb0', 0) + C(46.2, 36.6, 1.5, '#140c08', 0);
    out += P(hd, c.cel(f));
    out += CG(F('M16,54 C22,60 36,62 50,61 L50,66 L16,66 Z', bl, 0.8) + C(44, 45, 1.6, fd, 0, 0.6) + C(52, 48, 1.3, fd, 0, 0.6) + C(36, 42, 1.1, fd, 0, 0.5), c.clip(hd));
    out += C(33, 38.5, 5.6, c.cel(f), 2.2) + C(32.6, 38, 3.4, c.rg([[0, '#fffbe0'], [1, '#e8d880']], 0.4, 0.35, 0.7), 1.2) + C(32, 38.3, 1.9, '#140c08', 0) + C(31.4, 37.2, 0.8, '#fff', 0);
    out += S('M19.5,52 C25,55 31,56 38,54.5', OL, 1.5) + C(21.5, 47.5, 0.8, '#1a1009', 0);
    if (o.fItem) out += o.fItem(c);
    out += tube([[56, 70], [46, 82], [37, 90]], 5.5, f, fd) + webHand(c, 35, 91, lt(f, 0.08));
    out += tube([[60, 98], [55, 109], [52, 117]], 7, f, fd) + webFoot(c, 50, 120, lt(f, 0.04));
    return scaleAt(out, o.scale || 1, 62, 123);
  }

  /* goblin logging machine (FACING LEFT): a tracked cart with a big circular saw on the front arm,
     the goblin driver sitting up in an open, roll-barred cab, exhaust stack smoking behind */
  function shredder(c) {
    var br = '#b0782f', out = '', st = '#8c949d', gs = '#6fae45';
    out += shadow(c, 66, 52);
    /* smoke and exhaust stack */
    out += C(104, 16, 6, '#8a8a8a', 0, 0.55) + C(110, 9, 5, '#a0a0a0', 0, 0.45) + C(97, 11, 4.5, '#9a9a9a', 0, 0.5) + C(116, 4, 4, '#b0b0b0', 0, 0.35);
    out += P('M102,64 L104,26 L111,26 L111,66 Z', c.cel('#5d6269'), 2) + R(101, 22, 12, 4.5, '#3d4248', 2);
    /* roll bar behind the driver and the seat back */
    var cage = 'M100,72 L98,40 L62,37';
    out += S(cage, OL, 5.6) + S(cage, '#6d737a', 3) + P('M90,74 L92,52 L100,52 L101,74 Z', c.cel('#5a3a22'), 2);
    /* goblin driver: vest, head with goggles pushed up, long ear */
    out += P('M76,74 C75,63 79,58 86,58 C92,58 95,63 95,74 Z', c.cel('#c8a86a'), 2) + S('M84,59 L82,74', '#8a6a3a', 1.4, 0.8);
    out += P('M86,44 L101,33 C101,40 97,46 91,49 Z', c.cel(gs), 2) + F('M88,45 L98,37 C97,41 95,44 91,47 Z', dk(gs, 0.35), 0.7);
    out += P('M92,50 C93,40 85,36 79,37 C73,38 70,43 70,48 C70,54 75,58 82,58 C88,58 92,55 92,50 Z', c.cel(gs));
    out += P('M72,47 L62,50 L71,53 Z', c.cel(gs), 1.8);
    out += S('M92,42 Q84,37 74,40', '#3a2a1e', 2.6) + C(82, 38, 3, c.rg([[0, '#bfefff'], [1, '#2a7ab0']], 0.4, 0.4, 0.6), 1.6) + C(76, 39.5, 2.8, c.rg([[0, '#bfefff'], [1, '#2a7ab0']], 0.4, 0.4, 0.6), 1.6);
    out += E(77, 46.5, 2, 2, '#fff6c8', 0) + C(76.2, 46.6, 1.1, '#141008', 0) + S('M74,43.5 L80,44', OL, 1.6);
    out += P('M73,52.5 Q77,55 81,53 Q78,56.5 74,55 Z', '#f6f0d8', 1.1);
    /* dashboard, levers and hands */
    out += S('M76,64 L66,56 M80,66 L70,54', OL, 3.6) + S('M76,64 L66,56 M80,66 L70,54', '#8a8f96', 1.8) + C(66, 56, 2, '#c83a2a', 1.2) + C(70, 54, 2, '#e8c040', 1.2);
    out += C(75, 64, 3, c.cel(gs), 1.6);
    out += P('M62,76 L64,62 L72,62 L74,76 Z', c.cel('#6d737a'), 2) + C(68, 67, 2, c.rg([[0, '#fff6c0'], [1, '#e0a020']]), 1.1);
    out += S('M63,76 L62,37', OL, 5.2) + S('M63,76 L62,37', '#6d737a', 2.8);
    /* chassis box with hazard stripes, rivets and a log strapped behind */
    out += P('M104,62 C112,60 118,64 118,70 C118,76 112,78 104,76 Z', c.cel('#8a5a34'), 2) + E(104, 69, 3.2, 6.8, c.cel('#c8a070'), 1.6) + S('M104,64.5 Q106,69 104,73.5', '#8a5a34', 0.9);
    var ch = 'M26,78 L110,72 C114,72 116,75 115,79 L112,100 L30,102 C27,102 25,99 25,96 Z';
    out += P(ch, c.cel(br));
    out += CG(F('M58,92 L64,78 L70,78 L64,92 Z M72,92 L78,78 L84,78 L78,92 Z M86,92 L92,78 L98,78 L92,92 Z M100,92 L106,78 L112,78 L106,92 Z', '#f0c830', 0.9) +
      F('M24,92 L116,88 L116,104 L24,104 Z', dk(br, 0.35), 0.6) + F('M26,78 L110,72 L110,76 L26,82 Z', lt(br, 0.35), 0.6), c.clip(ch));
    [[32, 84], [44, 83], [110, 78], [32, 96], [110, 96]].forEach(function (p) { out += C(p[0], p[1], 1.4, '#e8c888', 1); });
    out += R(36, 86, 16, 9, c.cel('#6d737a'), 1.8) + S('M39,88.5 L49,88.5 M39,92.5 L49,92.5', '#2a2e33', 1.4);
    /* tracks: steel road wheels inside a toothed tread */
    var tr = 'M20,109 C20,102 26,99 33,99 L108,99 C116,99 121,103 121,110 C121,117 116,122 108,122 L33,122 C26,122 20,116 20,109 Z';
    out += P(tr, c.cel('#3a3e44'), 2.4);
    var teeth = '';
    for (var x = 30; x <= 110; x += 6.6) teeth += D`M${x},${99} l0,-2.4 M${x},${122} l0,2.2`;
    out += S(teeth, OL, 3.4) + S(teeth, '#5d6269', 1.6);
    [[33, 110, 7.5], [53, 111, 6.5], [72, 111, 6.5], [91, 111, 6.5], [108, 110, 7.5]].forEach(function (w) {
      out += C(w[0], w[1], w[2], c.cel(st), 2) + C(w[0], w[1], w[2] * 0.35, '#3d4248', 1.2);
    });
    out += S('M26,103 C24,108 25,114 29,118', '#6d737a', 1, 0.6);
    /* saw arm and the big circular blade on the front */
    out += tube([[42, 84], [30, 78], [22, 72]], 8, st, dk(st, 0.3)) + C(42, 84, 5.5, c.cel('#6d737a'), 2);
    out += P(star(20, 70, 16, 21, 17), c.cel('#c9d0d8'), 2) +
      '<circle cx="20" cy="70" r="13" fill="none" stroke="#7c8793" stroke-width="1.4"/>' +
      S('M6,58 A19,19 0 0 1 32,55 M5,82 A19,19 0 0 0 31,86', '#ffffff', 1.4, 0.55) + C(20, 70, 5, c.cel(br), 2) + C(20, 70, 1.8, '#3d4248', 0);
    out += P('M8,56 C14,46 30,46 36,56 L32,58 C27,51 17,51 12,58 Z', c.cel('#e8c040'), 2);
    return out;
  }

  /* ================= Kaldvik mob bases ================= */
  /* snow-leopard rosettes: broken rings plus dots, scattered in a box */
  function rosettes(col, x0, x1, y0, y1, n, R_) {
    var d = '', dots = '';
    for (var i = 0; i < n; i++) {
      var x = x0 + R_() * (x1 - x0), y = y0 + R_() * (y1 - y0), rr = 1.6 + R_() * 1.4;
      if (R_() > 0.35) d += D`M${x - rr},${y} A${rr},${rr} 0 1 1 ${x + rr * 0.7},${y + rr * 0.7}`;
      else dots += C(x, y, rr * 0.6, col, 0, 0.85);
    }
    return S(d, col, 1.3, 0.85) + dots;
  }
  /* crag boar: angular stone plates grown into the hide along the spine */
  function rockPlates(c, n, col) {
    var set = n === 2 ? [[88, 70, 7], [100, 74, 6], [70, 64, 5]] : [[44, 56, 6], [54, 50, 7.5], [66, 47, 8], [78, 47, 7.5], [89, 51, 7], [99, 58, 6]];
    var out = '';
    set.forEach(function (p, i) {
      var x = p[0], y = p[1], s = p[2], k = (i % 2 ? 1 : -1);
      var d = D`M${x - s},${y + s * 0.5} L${x - s * 0.7},${y - s * 0.55} L${x + k * s * 0.15},${y - s * 1.05} L${x + s * 0.85},${y - s * 0.35} L${x + s},${y + s * 0.55} Z`;
      out += P(d, c.cel(col), 2) + F(D`M${x - s * 0.7},${y - s * 0.55} L${x + k * s * 0.15},${y - s * 1.05} L${x + s * 0.1},${y + s * 0.2} L${x - s * 0.8},${y + s * 0.4} Z`, lt(col, 0.35), 0.6) +
        S(D`M${x - s * 0.2},${y - s * 0.1} l${s * 0.4},${s * 0.5}`, dk(col, 0.4), 1, 0.8);
    });
    return out;
  }
  /* troggs: short, hunched, stony, underbite, club */
  function trogg(x) {
    var sk = x.skin || '#9a8a72';
    var o = {
      head: 'trogg', skin: sk, sleeve: sk, torsoC: sk, hand: sk, pants: '#5a4430', feet: 'bare', stone: '#7c848e',
      body: { lean: 6, headX: 91, headY: 50, headR: 12.5, shY: 62, hipY: 90, shW: 19, waistW: 13, belly: 3, armW: 11, legW: 11.5, stance: 9, neck: 11, fEl: [9, 13], fHd: [12, 29], bEl: [-5, 16], bHd: [-1, 32] },
      back: function (c, g) {
        var b = g.b, out = '', st = o.stone;
        for (var i = 0; i < 4; i++) {
          var t = i / 3, x = g.scx - b.shW + 1 + (b.shW - 3) * t, y = g.sy + 18 - 22 * t, s = 5 + (i === 1 || i === 2 ? 1.5 : 0);
          out += P(D`M${x - s * 0.7},${y + 2} L${x - s * 1.2},${y - s * 1.6} L${x + s * 0.8},${y - 1} Z`, c.cel(st), 1.8);
        }
        return out;
      },
      torsoFx: function (c, g) {
        var R_ = rnd(9), t = '';
        for (var i = 0; i < 6; i++) t += F(blob(g.scx - 16 + R_() * 30, g.sy + R_() * 28, 3 + R_() * 3, 2 + R_() * 2, 5, R_, 0.5), R_() > 0.5 ? lt(sk, 0.18) : dk(sk, 0.25), 0.7);
        return CG(t + S(D`M${g.scx - 2},${g.sy + 12} Q${g.scx + 6},${g.sy + 17} ${g.scx + 15},${g.sy + 11}`, dk(sk, 0.4), 1.5), c.clip(g.torsoD));
      },
      mid: function (c, g) {
        return P(D`M${g.wl - 1.5},${g.hy - 4} L${g.wr + 2},${g.hy - 4} L${g.wr + 1},${g.hy + 12} L${g.sx + 4},${g.hy + 8} L${g.sx},${g.hy + 15} L${g.sx - 4},${g.hy + 9} L${g.wl},${g.hy + 13} Z`, c.cel('#6a5038'), 2) +
          R(g.wl - 2, g.hy - 6, g.wr - g.wl + 4.5, 4.5, '#3a2618', 1.6);
      },
      fItem: FI('club', 24, 1.05)
    };
    for (var k in x) o[k] = x[k];
    return o;
  }
  /* frostmane trolls: tall, lanky, frost-pale grey-green skin, small tusks, white braids, fur kilt, wrapped boots */
  function furKilt(col, spot) {
    return function (c, g) {
      var d = D`M${g.wl - 2},${g.hy - 4} L${g.wr + 2.5},${g.hy - 4} L${g.wr + 4},${g.hy + 11} L${g.wr},${g.hy + 8} L${g.sx + 3},${g.hy + 14} L${g.sx},${g.hy + 9} L${g.sx - 4},${g.hy + 15} L${g.wl - 1},${g.hy + 9} L${g.wl - 4},${g.hy + 12} Z`;
      return P(d, c.cel(col), 2) + CG(C(g.sx - 2, g.hy + 3, 2, spot, 0, 0.8) + C(g.sx + 5, g.hy + 7, 1.6, spot, 0, 0.8) + C(g.wl + 1, g.hy + 6, 1.4, spot, 0, 0.7), c.clip(d)) +
        R(g.wl - 2.5, g.hy - 6, g.wr - g.wl + 5.5, 4, '#4a3222', 1.6);
    };
  }
  function troll(x) {
    var sk = x.skin || '#a4b4a6';
    var o = {
      head: 'troll', skin: sk, sleeve: sk, torsoC: sk, hand: sk, pants: sk, feet: 'ttoe', boots: '#6a5a48', mane: '#e2e4de',
      body: { lean: 6, headX: 81, headY: 38, headR: 11, shY: 50, hipY: 81, shW: 14.5, waistW: 8.5, armW: 7.4, legW: 8, stance: 10, dig: 1, neck: 7, fEl: [9, 13], fHd: [15, 26], bEl: [-6, 15], bHd: [-2, 29] },
      torsoFx: function (c, g) {
        return CG(S(D`M${g.scx - 6},${g.sy + 14} Q${g.scx + 2},${g.sy + 17} ${g.scx + 10},${g.sy + 13} M${g.scx - 5},${g.sy + 19} Q${g.scx + 2},${g.sy + 22} ${g.scx + 9},${g.sy + 18} M${g.scx - 4},${g.sy + 24} Q${g.scx + 2},${g.sy + 26.5} ${g.scx + 8},${g.sy + 23}`, dk(sk, 0.35), 1.2, 0.8) +
          P(D`M${g.scx - g.b.shW},${g.sy} L${g.scx - g.b.shW + 5},${g.sy - 3} L${g.sx + g.b.waistW + 2},${g.hy - 5} L${g.sx + g.b.waistW - 3},${g.hy} Z`, '#5a3a22', 1.6), c.clip(g.torsoD));
      },
      mid: furKilt('#ece6d8', '#9a9488'),
      pads: function (c, g) { return P(star(g.fSh[0] + 1, g.sy + 3, 7, 9, 6.2, 0.25), c.cel('#ece6d8'), 2) + C(g.fSh[0] + 2, g.sy + 2, 1.6, '#9a9488', 0, 0.8); },
      belt: '#4a3222'
    };
    for (var k in x) o[k] = x[k];
    return o;
  }
  function boneNecklace(c, g) {
    var x = g.scx, y = g.sy, d = D`M${x - 11},${y + 2} Q${x + 1},${y + 14} ${x + 13},${y + 1}`, out = S(d, OL, 2.6) + S(d, '#8a6038', 1.2);
    [[-8, 6.5, 30], [-4, 9.5, 15], [0.5, 10.8, 0], [5, 9.8, -15], [9.5, 6.5, -30]].forEach(function (b) {
      out += G(P('M-1.6,0 L1.6,0 L0.9,7 Q0,8.5 -0.9,7 Z', c.cel('#f0e8d2'), 1.2), 'translate(' + r1(x + b[0]) + ',' + r1(y + b[1]) + ') rotate(' + b[2] + ')');
    });
    return out + C(x + 1, y + 12.5, 2.6, c.rg([[0, '#ffffff'], [0.5, '#9ae0ff'], [1, '#2a7ac0']]), 1.3);
  }
  /* wendigo: white shaggy yeti with a dark slate face, frost streaks and icicles matted into the fur (FACING LEFT) */
  function shagD(cx, cy, rx, ry, n, amp, R_, a0) {
    var d = '';
    a0 = a0 || 0;
    for (var i = 0; i <= n; i++) {
      var a = a0 + i / n * Math.PI * 2, x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
      if (!i) { d += 'M' + r1(x) + ',' + r1(y); continue; }
      var am = a0 + (i - 0.45) / n * Math.PI * 2, k = 1 + amp * (0.6 + R_() * 0.7);
      d += 'L' + r1(cx + Math.cos(am) * rx * k) + ',' + r1(cy + Math.sin(am) * ry * k) + 'L' + r1(x) + ',' + r1(y);
    }
    return d + 'Z';
  }
  function furLimb(c, pts, w, col, R_) {
    var out = tube(pts, w, col, dk(col, 0.22)), t = '';
    for (var i = 0; i < pts.length - 1; i++) for (var j = 1; j <= 2; j++) {
      var A = pts[i], B = pts[i + 1], u = j / 3, p = lpt(A, B, u, w * 0.5 + 0.5), q = lpt(A, B, u + 0.12, w * 0.5 + 3 + R_() * 2), p2 = lpt(A, B, u + 0.2, w * 0.5 - 0.5);
      var n = lpt(A, B, u, -w * 0.5 - 0.5), nq = lpt(A, B, u + 0.12, -w * 0.5 - 3 - R_() * 2), n2 = lpt(A, B, u + 0.2, -w * 0.5 + 0.5);
      t += P(pl([p, q, p2]), col, 1.5) + P(pl([n, nq, n2]), col, 1.5);
    }
    return out + t;
  }
  function clawHand(c, x, y, r, col, claw) {
    return C(x, y, r, c.cel(col), 2.2) + S(D`M${x - r * 0.6},${y + r * 0.6} l-3,4 M${x - r * 0.1},${y + r * 0.9} l-1.5,4.5 M${x + r * 0.5},${y + r * 0.7} l0,4.5`, OL, 3.6) +
      S(D`M${x - r * 0.6},${y + r * 0.6} l-3,4 M${x - r * 0.1},${y + r * 0.9} l-1.5,4.5 M${x + r * 0.5},${y + r * 0.7} l0,4.5`, claw, 1.8);
  }
  function wendigo(c, o) {
    var f = o.fur || '#eef2f5', fb = mix(f, '#9fb4c8', 0.35), face = o.face || '#4a4f58', claw = '#e8eef4', R_ = rnd(o.seed || 9), out = '';
    var ice = '#a8d4ec';
    out += shadow(c, 64, 40);
    if (o.frost) out += C(64, 70, 62, c.rg([[0, '#dff4ff', 0.55], [0.6, '#9fd8ff', 0.2], [1, '#9fd8ff', 0]]), 0);
    out += furLimb(c, [[84, 92], [92, 106], [88, 116]], 15, fb, R_) + P('M78,114 L96,114 L99,122.5 L74,122.5 Z', c.cel(face), 2.2) + S('M76,122.5 l-3,-0.5 M81,122.5 l-3,0.3', claw, 1.6);
    out += furLimb(c, [[90, 58], [104, 78], [100, 98]], 14, fb, R_) + clawHand(c, 100, 100, 7.5, face, claw);
    var bd = shagD(69, 76, 27, 29, 22, 0.13, R_, 0.3);
    out += P(bd, c.cel(f), 2.4);
    var fs = '';
    for (var i = 0; i < 14; i++) { var x = 46 + R_() * 46, y = 54 + R_() * 44; fs += D`M${x},${y} q${-2 + R_() * 4},4 ${-1 + R_() * 2},7`; }
    out += CG(F('M40,86 C52,100 80,104 100,90 L100,110 L40,110 Z', fb, 0.55) + F('M44,60 C56,50 80,48 94,56 C80,54 60,56 46,68 Z', '#ffffff', 0.5) + S(fs, fb, 1.3, 0.8) +
      S('M52,60 C54,70 52,80 55,92 M66,56 C68,66 66,78 69,90 M80,60 C82,70 80,82 84,94', ice, 2.2, 0.7) + S('M53,62 C55,70 53,78 55.5,86 M81,62 C83,70 81,80 84,88', '#ffffff', 0.9, 0.8), c.clip(bd));
    out += icicleRow(c, 52, 88, 100, o.icicles ? 7 : 4, o.icicles ? 11 : 7, 0.85);
    out += furLimb(c, [[62, 94], [56, 107], [58, 116]], 15, f, R_) + P('M46,114 L64,114 L66,122.5 L42,122.5 Z', c.cel(face), 2.2) + S('M43,122.5 l-3,-0.5 M48,122.5 l-3,0.3', claw, 1.6);
    /* head: fur hood with frost streaks, dark face (no horns) */
    var hd = shagD(48, 45, 16, 15, 15, 0.17, R_, 0.1);
    out += P(hd, c.cel(f), 2.4) + CG(S('M44,31 C48,34 52,36 58,35 M52,30 C56,33 60,38 62,44', ice, 2, 0.75) + S('M45,32 C48,34 51,35 56,34.5', '#ffffff', 0.8, 0.8), c.clip(hd));
    out += P('M36,38 C38,33 46,32 50,37 C54,43 53,52 49,58 C45,63 36,63 32,59 C28,54 29,47 32,43 Z', c.cel(face), 2.2);
    out += P('M31,53 C35,50 43,50 48,54 C46,60 38,62 33,59 Z', '#1a1830', 1.5) +
      F('M34,53.5 l1.3,3.4 l1.3,-3 z M41,53.2 l1.3,3.6 l1.3,-3.4 z M36,60 l1,-2.6 l1,2.6 z', '#f6f2e6');
    out += C(31.5, 46.5, 0.9, '#10142a', 0) + C(34.5, 47.5, 0.9, '#10142a', 0);
    out += C(37, 42.5, 2.1, o.eyeC || '#ffe46a', 1.1) + C(45.5, 42, 1.9, o.eyeC || '#ffe46a', 1.1) + C(36.6, 42.6, 0.8, '#1a1009', 0) + C(45.1, 42.1, 0.7, '#1a1009', 0);
    out += S('M33,39.5 L40,41 M43,40.5 L49,38.5', OL, 2.4);
    if (o.beard) {
      var bdd = 'M30,55 C28,64 32,76 38,90 L41,82 L44,92 L47,80 L51,86 C53,74 53,62 51,56 C45,62 36,62 30,55 Z';
      out += P(bdd, c.cel('#e6f2fa'), 2.2) + CG(S('M36,64 L39,84 M42,64 L44,86 M47,62 L49,80', '#9fbcd4', 1.3, 0.85), c.clip(bdd)) +
        P('M37,88 L38.5,96 L40,88 Z M43,90 L44.5,99 L46,90 Z M49,84 L50,91 L51.5,84 Z', c.cel('#cfeeff'), 1.2);
    }
    out += furLimb(c, [[52, 60], [38, 76], [30, 92]], 15, f, R_) + clawHand(c, 30, 95, 8, face, claw);
    out += icicleRow(c, 36, 50, 80, o.icicles ? 3 : 2, o.icicles ? 8 : 6, 0.8) + icicleRow(c, 94, 104, 84, 2, o.icicles ? 7 : 5, 0.8);
    return scaleAt(out, o.scale || 1, 64, 123);
  }
  /* a row of hanging icicles between x0..x1 at y */
  function icicleRow(c, x0, x1, y, n, len, s) {
    var out = '', R_ = rnd(Math.round(x0 * 7 + y));
    for (var i = 0; i < n; i++) {
      var x = x0 + (x1 - x0) * (n === 1 ? 0.5 : i / (n - 1)), l = len * (0.6 + R_() * 0.6), w = 2.2 * (s || 1);
      out += P(D`M${x - w},${y} L${x + w},${y} L${x + 0.3},${y + l} Z`, c.lg(['#ffffff', '#bfe8ff', '#7ac4ee']), 1.2);
    }
    return out;
  }
  /* leper gnome: the gnome race body gone sickly, bandaged, with a wrench */
  function leperGnome(c) {
    var sk = '#a6b08c', k, o = {
      race: 'gnome', skin: sk, gender: 'm', hair: { c: '#dedcc8', style: 'wild' }, eyeC: '#cfc03a', angry: true,
      torsoC: '#7a6e58', sleeve: '#857a62', pants: '#5a5244', boots: '#3a3228', hand: '#8e9a78', belt: '#3a2e22', buckle: '#9aa0a8',
      armband: '#e6dcc0', body: {}
    };
    var bd = RACEB.gnome.m;
    for (k in bd) o.body[k] = bd[k];
    o.body.lean = 3;
    o.torsoFx = function (c, g) {
      var x = g.scx, y = g.sy;
      return CG(F(D`M${x - 10},${y + 16} l4,-3 l3,4 l-2,5 Z M${x + 8},${y + 4} l3,2 l-1,4 l-3,-1 Z`, '#3a3226', 0.8) +
        S(D`M${x - 16},${y + 4} L${x + 16},${y + 16} M${x - 16},${y + 10} L${x + 16},${y + 22}`, OL, 5.4) + S(D`M${x - 16},${y + 4} L${x + 16},${y + 16} M${x - 16},${y + 10} L${x + 16},${y + 22}`, '#e6dcc0', 3.2) +
        S(D`M${x - 8},${y + 6} l1.5,2 M${x + 4},${y + 12} l1.5,2 M${x - 2},${y + 15} l1.5,2`, '#b8a888', 1, 0.9), c.clip(g.torsoD));
    };
    o.top = function (c, g) {
      var X = g.X, Y = g.Y, r = g.r;
      var band = D`M${X - r * 0.95},${Y - r * 0.2} C${X - r * 0.5},${Y - r * 0.75} ${X + r * 0.3},${Y - r * 0.85} ${X + r * 0.95},${Y - r * 0.6}`;
      var wrap = D`M${X - r * 0.9},${Y + r * 0.35} C${X - r * 0.4},${Y - r * 0.2} ${X - r * 0.1},${Y - r * 0.55} ${X + r * 0.2},${Y - r * 1.0}`;
      return F(blob(X + r * 0.2, Y + r * 0.6, r * 0.18, r * 0.12, 5, rnd(4), 0.5), '#6a7a4a', 0.7) + C(X + r * 0.7, Y - r * 0.2, r * 0.07, '#6a7a4a', 0, 0.7) +
        S(wrap, OL, r * 0.42) + S(wrap, '#e6dcc0', r * 0.3) + S(D`M${X - r * 0.6},${Y + r * 0.05} l${r * 0.15},${r * 0.12} M${X - r * 0.2},${Y - r * 0.4} l${r * 0.15},${r * 0.12}`, '#b8a888', r * 0.06) +
        S(band, OL, r * 0.28) + S(band, '#4a3a2a', r * 0.16) +
        C(X + r * 0.18, Y - r * 0.8, r * 0.2, c.cel('#c8a050'), 1.6) + C(X + r * 0.18, Y - r * 0.8, r * 0.12, c.rg([[0, '#d8f0e0'], [1, '#4a7a6a']]), 0) +
        C(X + r * 0.62, Y - r * 0.74, r * 0.2, c.cel('#c8a050'), 1.6) + C(X + r * 0.62, Y - r * 0.74, r * 0.12, c.rg([[0, '#d8f0e0'], [1, '#4a7a6a']]), 0);
    };
    o.fItem = FI('wrench', 24, 1.15);
    racePost(o);
    o.raceFront = null;
    return mobH(c, o, 20);
  }

  /* ================= Greatbough mob bases (all FACING LEFT unless mirrored) ================= */
  /* faint panther stripes for the nightsabers (body, haunch, tail, head) */
  var PSTR = {
    body: 'M50,58 q-3,8 -1,16 M60,57 q-3,9 -1,18 M70,57 q-3,9 -1,19 M80,58 q-3,9 -1,18 M90,59 q-2,8 0,16 M100,62 q-2,7 0,14',
    haunch: 'M92,64 q-2,8 1,16 M100,62 q-1,9 2,18 M107,66 q0,8 2,14',
    tail: 'M110,70 l8,-3 M114,80 l8,-2 M116,90 l7,0 M115,100 l6,2',
    head: 'M36,40 l-2,6 M42,41 l-2,7 M47,45 l-3,6 M50,52 l-4,4'
  };
  /* thistle bristles: tall spines along a boar's back, green tips over brown */
  function thistleBack(c, o) {
    var out = '', pts = [[40, 60, -40], [45, 55, -30], [51, 51, -22], [57, 49, -12], [63, 47, -4], [69, 46, 4], [75, 46, 10], [81, 47, 16], [87, 50, 24], [92, 54, 34], [96, 59, 44]];
    pts.forEach(function (p, i) {
      var a = p[2] * Math.PI / 180, L = (i % 2 ? 11 : 16) * (o.spine || 1), tx = p[0] + Math.sin(a) * L, ty = p[1] - Math.cos(a) * L, nx = Math.cos(a) * 3.2, ny = Math.sin(a) * 3.2;
      out += P(D`M${p[0] - nx},${p[1] - ny + 3} L${tx},${ty} L${p[0] + nx},${p[1] + ny + 3} Z`, c.lg([i % 3 ? '#a6c054' : '#c0d468', '#6e8a30', '#7a5a34'], 0, 0, 0, 1), 1.5);
    });
    return out;
  }
  /* grell: small hunched fel imp with huge ears */
  function grell(c, o) {
    var sk = o.skin || '#8a9a78', sd = dk(sk, 0.3), eye = o.eyeC || '#d8ff40', claw = '#ece4c8', out = '';
    out += shadow(c, 62, 24);
    if (o.aura) out += C(60, 78, 50, c.rg([[0, '#b8ff5a', 0.32], [0.6, '#7ee03a', 0.1], [1, '#7ee03a', 0]]), 0);
    var tl = 'M80,98 C96,104 108,100 106,86 C105,80 100,78 97,82';
    out += S(tl, OL, 6) + S(tl, sd, 2.8) + P('M97,85 L90,79 L97,71 L104,79 Z', c.cel(sd), 1.6);
    out += tube([[72, 94], [80, 106], [74, 117]], 6.5, sd) + P('M66,116 L78,116 L80,122.5 L63,122.5 Z', c.cel(sd), 2) + S('M63,122.5 l-3,-0.4 M67,122.5 l-2.4,0.4', claw, 1.2);
    out += tube([[72, 70], [80, 84], [72, 95]], 5.5, sd) + clawHand(c, 71, 96, 4.2, sd, claw);
    var bd = 'M50,68 C54,58 70,56 80,64 C88,72 88,90 80,99 C72,106 58,104 52,96 C47,88 46,76 50,68 Z';
    if (o.spikes) [[70, 58, 20], [78, 61, 40], [84, 67, 58], [88, 75, 72], [89, 84, 86]].forEach(function (p) {
      var a = p[2] * Math.PI / 180;
      out += P(D`M${p[0] - Math.cos(a) * 3.5},${p[1] - Math.sin(a) * 3.5} L${p[0] + Math.sin(a) * 11},${p[1] - Math.cos(a) * 11} L${p[0] + Math.cos(a) * 3.5},${p[1] + Math.sin(a) * 3.5} Z`, c.cel('#4a3a2c'), 1.5);
    });
    out += P(bd, c.cel(sk));
    out += CG(F('M46,84 C54,100 70,104 82,96 C72,96 60,92 52,78 Z', lt(sk, 0.28), 0.7) + S('M56,74 q6,3 12,1 M55,80 q6,3 12,1 M56,86 q5,3 11,1', sd, 1.1, 0.7) +
      C(74, 70, 1.6, sd, 0, 0.7) + C(80, 80, 1.3, sd, 0, 0.7), c.clip(bd));
    out += P('M54,93 L81,95 L79,106 L73,102 L69,110 L63,104 L56,107 Z', c.cel('#6a4a34'), 2) + S('M58,97 L76,98', '#3a2a1c', 1.2, 0.8);
    out += tube([[62, 98], [56, 109], [60, 117]], 7.5, sk, sd) + P('M50,116 L64,116 L66,122.5 L46,122.5 Z', c.cel(sk), 2) + S('M46,122.5 l-3,-0.4 M50,122.5 l-2.4,0.4', claw, 1.3);
    /* head: far ear, skull, near ear, face */
    out += P('M50,50 C58,40 72,30 88,24 C82,36 70,46 58,55 Z', c.cel(sd), 2);
    out += P('M58,54 C60,42 50,36 40,38 C32,40 26,46 24,52 L15,56 C12,58 13,62 17,63 L26,64 C30,70 40,72 48,70 C56,68 60,62 58,54 Z', c.cel(sk));
    if (o.horns) out += P('M44,39 C43,30 46,24 52,20 C51,27 51,33 51,39 Z', c.cel('#4a3a2c'), 1.6) + P('M36,40 C33,33 34,27 38,22 C39,29 40,34 41,39 Z', c.cel('#4a3a2c'), 1.6);
    out += P('M46,46 C52,32 64,20 80,12 C76,28 66,40 55,50 Z', c.cel(sk), 2) + F('M50,45 C56,34 64,26 74,19 C70,30 63,39 55,46 Z', '#c07a7a', 0.6);
    out += C(31, 49, 6, c.rg([[0, eye, 0.7], [1, eye, 0]]), 0) + P('M26,49.5 Q31,45 37,48 Q31,52 26,49.5 Z', eye, 1.1) + E(31.5, 48.8, 0.8, 1.9, '#141008', 0);
    out += S('M23,46 L39,44.5', OL, 2.6);
    out += P('M16,62 C23,60 32,61 39,64 C34,70 22,70 17,66 Z', '#3a1010', 1.4) + F('M20,62 l1.2,3.2 l1.2,-3 z M27,62 l1.3,3.4 l1.3,-3.2 z M33,63 l1.1,3 l1.1,-2.8 z', '#f6f0dc') + F('M23,68 l1,-2.4 l1,2.4 z', '#f6f0dc');
    out += C(42, 44, 1.4, sd, 0, 0.8) + C(47, 58, 1.2, sd, 0, 0.8) + C(20, 58, 0.9, '#2a1a10', 0);
    out += tube([[58, 70], [46, 82], [37, 90]], 6, sk, sd) + clawHand(c, 35, 92, 4.8, sk, claw);
    return scaleAt(out, o.scale || 1, 62, 123);
  }
  /* spider: cephalothorax forward-left, abdomen behind, 4 legs a side */
  function spLeg(c, L, col, w) {
    var out = tube(L, w, col, dk(col, 0.3)) + C(L[1][0], L[1][1], w * 0.62, c.cel(col), 1.6);
    var A = L[0], B = L[1], d = '';
    for (var i = 1; i < 4; i++) { var p = lpt(A, B, i / 4, -w * 0.5), q = lpt(A, B, i / 4 + 0.04, -w * 0.5 - 3); d += D`M${p[0]},${p[1]} L${q[0]},${q[1]} `; }
    return out + S(d, OL, 1.1, 0.85) + P(D`M${L[2][0] - 1.6},${L[2][1] - 3} L${L[2][0] + (L[2][0] < L[1][0] ? -2.6 : 2.6)},${L[2][1] + 1.8} L${L[2][0] + 1.6},${L[2][1] - 3} Z`, dk(col, 0.4), 1.2);
  }
  function spider(c, o) {
    var f = o.col || '#6e7a62', fd = dk(f, 0.38), out = '';
    out += shadow(c, 62, 50);
    var legs = [[[42, 90], [22, 56], [6, 120]], [[47, 93], [36, 54], [24, 121]], [[54, 93], [70, 56], [82, 121]], [[58, 90], [94, 54], [114, 120]]];
    legs.forEach(function (L) { out += spLeg(c, [[L[0][0] + 6, L[0][1] - 3], [L[1][0] + 9, L[1][1] + 2], [L[2][0] + 10, L[2][1] - 3]], dk(fd, 0.15), 3.2); });
    /* the near back legs stay behind the abdomen so its shape reads */
    out += spLeg(c, legs[2], dk(f, 0.12), 4) + spLeg(c, legs[3], dk(f, 0.12), 4);
    var ab = o.bloat ? 'M62,78 C60,56 80,42 100,46 C118,50 126,68 122,88 C118,104 100,110 84,106 C68,102 62,92 62,78 Z' : 'M64,80 C62,64 76,56 90,58 C106,60 114,72 112,86 C110,98 98,104 86,102 C72,100 64,92 64,80 Z';
    out += P(ab, c.cel(f), 2.6);
    var cl = c.clip(ab), pat = '';
    if (o.bloat) pat += R(0, 0, 128, 128, c.rg([[0, '#f0c8ff', 0.7], [0.35, '#b070f0', 0.35], [1, '#6a2aa8', 0]], 0.42, 0.3, 0.6), 0) +
      S('M72,70 Q92,62 112,68 M70,82 Q94,74 118,82 M74,94 Q96,88 116,96', dk(f, 0.45), 2, 0.7) + F('M90,54 L96,64 L102,54 L96,58 Z M92,72 L96,80 L100,72 L96,75 Z', '#d8a0ff', 0.8);
    else pat += F('M80,62 L86,70 L92,62 L86,66 Z M78,74 L86,84 L94,74 L86,79 Z M82,88 L86,94 L90,88 L86,90 Z', dk(f, 0.5), 0.8) + F('M68,72 C74,62 90,58 104,64 C94,62 80,64 70,78 Z', lt(f, 0.3), 0.6);
    var hs = '', R_ = rnd(o.bloat ? 71 : 61);
    for (var i = 0; i < 18; i++) { var x = 64 + R_() * 58, y = 50 + R_() * 56; hs += D`M${x},${y} l${1.5 + R_() * 2},${-2 - R_() * 2}`; }
    out += CG(pat + S(hs, dk(f, 0.5), 0.9, 0.7), cl);
    if (o.bloat) out += S('M112,100 C114,110 112,116 116,122 M104,104 C104,112 100,118 102,122', '#eef0f4', 1, 0.75);
    out += E(50, 90, 16, 11.5, c.cel(dk(f, 0.08)), 2.4) + CG(F('M36,86 C44,80 58,80 64,86 C56,84 44,84 38,90 Z', lt(f, 0.25), 0.7), c.clip('M34,90 A16,11.5 0 1 1 66,90 A16,11.5 0 1 1 34,90 Z'));
    out += spLeg(c, legs[0], f, 4.4) + spLeg(c, legs[1], f, 4.4);
    /* head: chelicerae, eye cluster */
    out += P('M36,94 C32,98 31,104 34,108 C36,104 38,101 41,99 Z', c.cel(dk(f, 0.3)), 1.6) + P('M42,96 C40,101 40,106 43,109 C44,105 45,102 47,100 Z', c.cel(dk(f, 0.35)), 1.6);
    out += E(38, 88, 8, 6.5, c.cel(dk(f, 0.15)), 2);
    var ec = o.eyeC || '#ff4a3a';
    out += C(34, 86, 5, c.rg([[0, ec, 0.6], [1, ec, 0]]), 0) + C(33, 86.5, 1.9, c.rg([[0, '#ffe0c0'], [1, ec]]), 1) + C(37.5, 84.5, 1.7, c.rg([[0, '#ffe0c0'], [1, ec]]), 1) + C(31.5, 90, 1.1, ec, 0.8) + C(36.5, 89, 1.1, ec, 0.8) + C(41, 86.5, 1, ec, 0.8);
    if (o.crown) out += P('M36,82 L34,74 L39,80 L41,72 L44,80 L48,74 L47,83 Z', c.cel('#3a2a48'), 1.5);
    return scaleAt(out, o.scale || 1, 62, 123);
  }
  /* strigid owl: standing, wings half open */
  function owl(c, o) {
    var f = o.col || '#7e8ca4', fd = dk(f, 0.3), bl = o.belly || '#cdd4e0', out = '';
    function fl(d, col) { return P(d, c.cel(col)); }
    out += shadow(c, 62, 32);
    out += fl('M70,60 C84,46 104,38 120,44 C114,50 118,56 110,60 C116,64 112,70 104,72 C108,78 102,82 94,82 C96,88 90,92 84,90 C82,78 78,68 70,60 Z', fd) +
      S('M80,58 C90,52 104,48 116,48 M84,66 C94,62 104,60 112,62 M86,74 C92,72 98,72 104,74', dk(fd, 0.35), 1.1, 0.8);
    out += fl('M64,100 C74,104 84,110 90,117 L78,118 C74,112 70,108 62,106 Z', fd);
    ['M54,104 L52,117', 'M66,104 L66,117'].forEach(function (d) { out += S(d, OL, 8.5) + S(d, lt(bl, 0.1), 5); });
    out += S('M52,118 l-5,4 M52,118 l0,4.5 M52,118 l4,3.5 M66,118 l-5,4 M66,118 l0,4.5 M66,118 l4,3.5', OL, 3.2) + S('M52,118 l-5,4 M52,118 l0,4.5 M52,118 l4,3.5 M66,118 l-5,4 M66,118 l0,4.5 M66,118 l4,3.5', '#e8c060', 1.4);
    var bd = 'M42,72 C42,54 56,46 68,50 C82,54 88,70 86,88 C84,104 72,112 60,110 C48,108 40,96 42,72 Z';
    out += fl(bd, f);
    var bars = '';
    for (var y = 66; y < 108; y += 6) bars += D`M44,${y} q4,3 8,0 q4,3 8,0 q4,3 8,0 q4,3 8,0 `;
    out += CG(F('M40,70 C44,60 60,58 70,66 C74,80 72,100 62,112 L40,112 Z', bl, 0.95) + S(bars, fd, 1.2, 0.75), c.clip(bd));
    /* head: tufts, disc, eyes, beak */
    out += fl('M40,34 L33,14 L48,27 Z', fd) + fl('M64,28 L70,10 L74,30 Z', fd);
    var hd = 'M34,44 C34,28 50,22 62,24 C76,26 82,38 80,50 C78,62 66,68 54,68 C42,68 34,58 34,44 Z';
    out += fl(hd, f);
    out += P('M37,46 C37,36 44,31 50,33 C54,30 62,30 66,36 C70,42 68,54 60,59 C54,62 44,62 40,57 C37,54 37,50 37,46 Z', c.cel('#e2e6ee'), 1.8);
    out += S('M50,34 L50,44', fd, 1.2, 0.7);
    out += C(44, 44, 5.6, c.rg([[0, '#fff2a0'], [0.6, '#ffb020'], [1, '#d07010']], 0.4, 0.4, 0.6), 1.6) + C(58, 43, 5.8, c.rg([[0, '#fff2a0'], [0.6, '#ffb020'], [1, '#d07010']], 0.4, 0.4, 0.6), 1.6);
    out += C(43.4, 44.4, 2.8, '#141008', 0) + C(57.4, 43.4, 2.9, '#141008', 0) + C(42.4, 43, 1, '#fff', 0) + C(56.4, 42, 1, '#fff', 0);
    out += S('M37,38 L49,41 M53,40 L65,36', OL, 2.2);
    out += P('M48,48 C46,52 46,57 49,61 C50,57 52,53 52,48 Z', c.cel('#4a4234'), 1.4);
    /* near wing: half open, drooping forward */
    var wg = 'M62,58 C48,58 34,64 24,76 C30,77 32,80 30,85 C36,83 38,87 36,92 C43,89 46,93 46,98 C52,94 56,96 56,100 C62,90 68,76 68,64 Z';
    out += fl(wg, lt(f, 0.05)) + CG(S('M58,62 C48,66 38,72 30,80 M60,68 C52,74 44,80 38,88 M62,74 C58,82 52,88 46,94', fd, 1.2, 0.85) + F('M56,58 C46,60 38,64 32,70 C42,66 52,64 64,64 Z', lt(f, 0.3), 0.7), c.clip(wg));
    return scaleAt(out, o.scale || 1, 62, 123);
  }
  /* timberling: little walking tree */
  function timberling(c, o) {
    var bark = o.bark || '#735236', bd = dk(bark, 0.3), lf = o.leaf || '#5aa040', R_ = rnd(o.seed || 83), out = '';
    function twig(pts, w, col) {
      var s = tube(pts, w, col, dk(col, 0.3)), e = pts[pts.length - 1], p = pts[pts.length - 2];
      var dx = e[0] - p[0], dy = e[1] - p[1];
      s += S(D`M${e[0]},${e[1]} l${dx * 0.5 - 3},${dy * 0.5 - 4} M${e[0]},${e[1]} l${dx * 0.6 + 2},${dy * 0.6 + 2} M${e[0]},${e[1]} l${dx * 0.3 + 4},${dy * 0.3 - 3}`, OL, 3.6) +
        S(D`M${e[0]},${e[1]} l${dx * 0.5 - 3},${dy * 0.5 - 4} M${e[0]},${e[1]} l${dx * 0.6 + 2},${dy * 0.6 + 2} M${e[0]},${e[1]} l${dx * 0.3 + 4},${dy * 0.3 - 3}`, col, 1.8);
      return s;
    }
    out += shadow(c, 62, 26);
    out += tube([[68, 98], [75, 110], [73, 119]], 8, bd) + S('M73,121 l-6,1.5 M73,121 l5,1.6 M73,121 l0,2', OL, 3.4) + S('M73,121 l-6,1.5 M73,121 l5,1.6', bd, 1.8);
    out += twig([[72, 70], [84, 80], [90, 94]], 5.5, bd) + leaf(c, 88, 80, 60, 0.45, dk(lf, 0.15));
    var tr = 'M50,100 C46,86 47,70 52,60 C56,52 70,52 75,60 C80,70 80,86 76,100 C70,106 56,106 50,100 Z';
    out += P(tr, c.cel(bark));
    out += CG(S('M56,58 C54,70 58,84 55,100 M64,56 C66,70 62,86 65,102 M72,60 C74,72 71,88 73,100', bd, 1.4, 0.85) + F('M48,88 C54,98 66,102 78,96 L78,106 L48,106 Z', dk(bark, 0.2), 0.6) +
      F(blob(70, 92, 5, 3.5, 5, R_, 0.4), '#6a9a3a', 0.8) + F('M50,62 C52,56 58,54 62,56 C56,60 52,66 50,74 Z', lt(bark, 0.25), 0.7), c.clip(tr));
    out += E(56, 72, 4, 3.2, '#1a0e06', 1.2) + E(66, 72, 3.6, 3, '#1a0e06', 1.2) + C(55.4, 71.8, 2.2, c.rg([[0, '#f6ffb0'], [1, '#b8e040']]), 0) + C(65.6, 71.8, 2, c.rg([[0, '#f6ffb0'], [1, '#b8e040']]), 0);
    out += C(56, 72, 7, c.rg([[0, '#e8ff8a', 0.45], [1, '#e8ff8a', 0]]), 0);
    out += P('M54,82 C58,84 62,84 66,82 C63,86 57,87 54,82 Z', '#1a0e06', 1.2) + E(70, 90, 2, 2.6, '#2a1a0e', 1);
    out += tube([[58, 100], [54, 110], [56, 119]], 9, bark, bd) + S('M56,121 l-7,1.5 M56,121 l6,1.6 M56,121 l-2,2', OL, 3.6) + S('M56,121 l-7,1.5 M56,121 l6,1.6', bark, 2);
    /* leafy crown with a few twigs poking out */
    out += S('M58,48 L54,34 M66,48 L72,32 M62,46 L62,30', OL, 4) + S('M58,48 L54,34 M66,48 L72,32 M62,46 L62,30', bark, 2);
    var cn = blob(62, 46, 19, 12, 9, R_, 0.35);
    out += P(cn, c.cel(lf), 2.2) + CG(F(blob(56, 40, 10, 5, 6, R_, 0.4), lt(lf, 0.3), 0.8) + F(blob(70, 52, 12, 6, 6, R_, 0.4), dk(lf, 0.25), 0.7), c.clip(cn));
    out += leaf(c, 44, 44, -70, 0.5, lf) + leaf(c, 82, 40, 65, 0.5, lt(lf, 0.1)) + leaf(c, 60, 30, 10, 0.45, lt(lf, 0.2));
    out += twig([[54, 68], [42, 78], [34, 88]], 6, bark) + leaf(c, 40, 78, -50, 0.42, lf);
    return scaleAt(out, o.scale || 1, 62, 123);
  }
  /* bearkin (furbolg): upright bear-person, bark plates and moss grown into the fur (FACING LEFT).
     Old options feathers/band/paint/necklace/gem are accepted and ignored. */
  function barkPatch(c, x, y, w, h, a) {
    var d = D`M${-w},${-h * 0.4} L${-w * 0.5},${-h} L${w * 0.4},${-h * 0.8} L${w},${-h * 0.1} L${w * 0.7},${h * 0.8} L${-w * 0.3},${h} L${-w * 0.9},${h * 0.5} Z`;
    return G(P(d, c.cel('#6e5236'), 1.6) + S(D`M${-w * 0.5},${-h * 0.6} L${-w * 0.3},${h * 0.7} M${w * 0.1},${-h * 0.7} L${w * 0.2},${h * 0.8} M${w * 0.55},${-h * 0.3} L${w * 0.5},${h * 0.5}`, '#3e2a1a', 1, 0.85), 'translate(' + r1(x) + ',' + r1(y) + ') rotate(' + (a || 0) + ')');
  }
  function mossTuft(c, x, y, rx, ry, seed) {
    var R_ = rnd(seed || 7);
    return P(blob(x, y, rx, ry, 7, R_, 0.5), c.cel('#6a9a3a'), 1.5) + C(x - rx * 0.3, y - ry * 0.3, 0.9, '#b0d870', 0) + C(x + rx * 0.35, y - ry * 0.1, 0.8, '#b0d870', 0);
  }
  function furbolg(c, o) {
    var f = o.fur || '#8a6240', fb = dk(f, 0.2), mz = o.muzzle || '#c8a47a', claw = '#efe6cf', R_ = rnd(o.seed || 21), out = '';
    out += shadow(c, 64, 38);
    if (o.glow) out += C(62, 66, 60, c.rg([[0, o.glow, 0.35], [0.6, o.glow, 0.12], [1, o.glow, 0]]), 0);
    if (o.bItem) out += o.bItem(c);
    out += furLimb(c, [[82, 92], [88, 106], [86, 116]], 14, fb, R_) + P('M75,113 L94,113 L97,122.5 L71,122.5 Z', c.cel(dk(f, 0.3)), 2.2) + S('M72,122.5 l-3,-0.5 M77,122.5 l-3,0.3', claw, 1.6);
    out += furLimb(c, [[88, 60], [100, 78], [96, 96]], 12, fb, R_) + clawHand(c, 96, 98, 7, dk(f, 0.28), claw);
    var bd = shagD(68, 76, 24, 28, 20, 0.1, R_, 0.3);
    out += P(bd, c.cel(f), 2.4);
    var fs = '';
    for (var i = 0; i < 12; i++) { var x = 48 + R_() * 40, y = 56 + R_() * 40; fs += D`M${x},${y} q${-2 + R_() * 4},4 ${-1 + R_() * 2},7`; }
    out += CG(F('M42,74 C48,96 74,104 94,92 L94,110 L42,110 Z', mz, 0.55) + F('M46,58 C56,50 76,48 90,56 C76,54 60,56 48,66 Z', lt(f, 0.25), 0.55) + S(fs, dk(f, 0.3), 1.2, 0.75), c.clip(bd));
    /* bark plates and moss grown into the fur */
    out += CG(barkPatch(c, 76, 72, 7, 5.5, 20) + barkPatch(c, 60, 86, 5, 4, -15) + P(blob(64, 56, 11, 4.5, 7, rnd((o.seed || 21) + 3), 0.5), c.cel('#6a9a3a'), 1.5) +
      C(60, 54, 0.9, '#b0d870', 0) + C(68, 55, 0.8, '#b0d870', 0) + F(blob(82, 86, 4, 3, 5, R_, 0.5), '#6a9a3a', 0.85), c.clip(bd));
    out += P('M46,92 L92,94 L91,100 L46,98 Z', c.cel('#4a3222'), 2) + P('M52,97 L68,98 L66,112 L60,108 L54,113 Z', c.cel(o.hide || '#8a6a44'), 1.8);
    if (o.pad) out += pad(c, 80, 56, 11, o.pad, true, '#c8a050');
    out += furLimb(c, [[60, 94], [56, 107], [58, 116]], 15, f, R_) + P('M46,113 L65,113 L67,122.5 L42,122.5 Z', c.cel(dk(f, 0.22)), 2.2) + S('M43,122.5 l-3,-0.5 M48,122.5 l-3,0.3', claw, 1.6);
    /* head: bear skull, snout forward-left */
    out += C(62, 30, 5.6, c.cel(fb), 2) + C(62, 30.5, 2.6, '#5a3a30', 0);
    if (o.antlers) {
      var an = 'M56,32 C57,26 55,20 50,15 M55,24 L62,19 M52,18 L46,16 M64,32 C69,27 75,24 82,22 M72,26 L74,18 M78,23 L85,17';
      out += S(an, OL, 6) + S(an, '#6a4a2e', 3.4) + S('M55,28 C56,24 54,20 51,16 M68,29 C73,26 77,24 81,23', lt('#6a4a2e', 0.3), 1, 0.8);
      out += leaf(c, 50, 16, -40, 0.42, '#5aa032') + leaf(c, 85, 18, 50, 0.42, '#86c84a') + leaf(c, 74, 19, 10, 0.38, '#5aa032');
    }
    var hd = shagD(52, 44, 15, 14, 14, 0.12, R_, 0.2);
    out += P(hd, c.cel(f), 2.2);
    out += P('M42,42 C34,40 26,42 22,47 C18,51 19,56 24,57 L34,58 C41,58 45,54 45,49 Z', c.cel(mz), 2);
    out += E(22, 48.5, 3.4, 2.8, '#1a1009', 0) + C(21, 47.5, 0.8, '#fff', 0, 0.7);
    out += S('M24,56 C28,58 33,58 37,56', OL, 1.4) + F('M29,57 l1.2,2.8 l1.2,-2.6 z', '#f6f0dc');
    var ey = o.eyeC || '#1a1009';
    if (o.eyeC) out += C(38, 41, 5, c.rg([[0, o.eyeC, 0.6], [1, o.eyeC, 0]]), 0);
    out += C(38, 41, 2.1, ey, 0) + (o.eyeC ? '' : C(37.4, 40.4, 0.7, '#fff', 0)) + S(o.angry ? 'M32,37 L43,39.5' : 'M32,38 L43,38', OL, 2.2);
    out += C(50, 29, 5.6, c.cel(f), 2) + C(50, 29.5, 2.6, '#5a3a30', 0);
    /* moss over the crown and a bark scab on the brow */
    out += mossTuft(c, 57, 33, 7, 3.4, (o.seed || 21) + 5) + barkPatch(c, 50, 41, 3.4, 2.6, -25);
    if (o.fItem) out += o.fItem(c);
    out += furLimb(c, [[54, 58], [40, 74], [32, 90]], 14, f, R_) + barkPatch(c, 41, 73, 4.5, 3.6, 40) + clawHand(c, 30, 93, 7.5, dk(f, 0.18), claw);
    out += mossTuft(c, 54, 60, 6, 3, (o.seed || 21) + 9);
    if (o.fTop) out += o.fTop(c);
    return scaleAt(out, o.scale || 1, 64, 123);
  }
  /* shadow sprite: small dark faerie hovering in a purple glow */
  function shadowSprite(c) {
    var sk = '#3e2c62', wing = '#b890ff', out = '';
    out += shadow(c, 62, 14);
    out += C(62, 66, 44, c.rg([[0, '#c89aff', 0.45], [0.5, '#8a4ae0', 0.16], [1, '#8a4ae0', 0]]), 0);
    function wings(dx, dy, o2) {
      return G(P('M64,60 C74,36 98,26 108,34 C114,44 98,58 70,66 Z', wing, 1.6, o2) + P('M66,68 C84,68 98,78 96,90 C90,98 76,88 66,72 Z', wing, 1.6, o2) +
        S('M68,60 C78,46 92,38 102,38 M70,70 C80,74 88,80 92,88', '#f0e0ff', 1, o2), 'translate(' + dx + ',' + dy + ')');
    }
    out += wings(4, -2, 0.45);
    out += S('M74,90 C82,100 90,104 98,104 M72,94 C76,104 82,110 90,112', OL, 3.2) + S('M74,90 C82,100 90,104 98,104 M72,94 C76,104 82,110 90,112', sk, 1.6);
    var bd = 'M56,64 C60,62 66,64 68,70 C70,78 68,86 74,94 C66,94 60,88 58,80 C56,74 54,68 56,64 Z';
    out += P(bd, c.cel(sk), 2);
    out += P('M58,56 C64,50 74,52 80,58 C84,62 88,70 86,78 C82,70 76,66 70,64 Z', c.cel('#6a3aa8'), 1.8);
    out += C(56, 56, 8.5, c.cel(sk), 2.2);
    out += P('M60,52 C66,48 72,44 80,42 C76,48 70,52 63,56 Z', c.cel(sk), 1.6);
    out += P('M48,55 Q52,52 55,54 Q52,57 48,55 Z', '#f4e8ff', 1) + C(51, 55, 4, c.rg([[0, '#ffffff', 0.7], [1, '#d8b0ff', 0]]), 0);
    out += S('M47,51 L55,50.5', OL, 1.6);
    out += tube([[58, 68], [48, 72], [40, 68]], 3.6, sk) + glowOrb(c, 36, 67, 4.2, '#c89aff');
    out += wings(0, 0, 0.62);
    var R_ = rnd(97);
    for (var i = 0; i < 9; i++) out += sparkle(70 + R_() * 40, 60 + R_() * 50, 1.4 + R_() * 1.8, R_() > 0.5 ? '#e8d0ff' : '#b080ff');
    return out;
  }
  /* satyr furbolg-killer: humanoid body (mirrored) with goat legs */
  function melenas(c) {
    var sk = '#a8475e';
    return mobH(c, {
      head: 'satyr', skin: sk, sleeve: sk, torsoC: sk, hand: sk, pants: '#3a2430', feet: 'hoof', angry: true,
      scale: 1.04,
      body: { lean: 4, headX: 77, headY: 40, headR: 10.5, shY: 53, hipY: 80, shW: 16.5, waistW: 10, armW: 8.6, legW: 11.5, stance: 9, dig: 1, neck: 8, fEl: [8, 12], fHd: [14, 22], bEl: [-6, 14], bHd: [-3, 26] },
      torsoFx: function (c, g) {
        return CG(S(D`M${g.scx - 6},${g.sy + 14} Q${g.scx + 2},${g.sy + 17} ${g.scx + 10},${g.sy + 13} M${g.scx - 5},${g.sy + 20} Q${g.scx + 2},${g.sy + 23} ${g.scx + 9},${g.sy + 19}`, dk(sk, 0.4), 1.2, 0.8) +
          S(D`M${g.scx - 12},${g.sy + 4} C${g.scx - 4},${g.sy + 10} ${g.scx - 8},${g.sy + 20} ${g.scx},${g.sy + 24} M${g.scx + 14},${g.sy + 4} C${g.scx + 8},${g.sy + 8} ${g.scx + 12},${g.sy + 16} ${g.scx + 6},${g.sy + 22}`, '#3a1830', 1.6, 0.8), c.clip(g.torsoD));
      },
      belt: '#241420', buckle: '#8aff3a',
      mid: function (c, g) {
        var d = D`M${g.wl - 2},${g.hy - 4} L${g.wr + 3},${g.hy - 4} L${g.wr + 2},${g.hy + 14} L${g.wr - 3},${g.hy + 9} L${g.sx + 2},${g.hy + 16} L${g.sx - 2},${g.hy + 9} L${g.wl - 1},${g.hy + 13} Z`;
        return P(d, c.cel('#2a1a2a'), 2) + S(D`M${g.wl},${g.hy + 1} L${g.wr + 1},${g.hy + 1}`, '#8aff3a', 1.2, 0.8);
      },
      gLeg: function (c, g, L, front) {
        var w = g.b.legW, d = '';
        [0.3, 0.6].forEach(function (u) { var a = lpt(L[0], L[1], u, w * 0.5), b = lpt(L[0], L[1], u + 0.12, w * 0.5 + 3.5); d += D`M${a[0]},${a[1]} L${b[0]},${b[1]} `; });
        return S(d, front ? '#3a2430' : '#2a1a22', 2.2);
      },
      pads: function (c, g) { return pad(c, g.bSh[0] - 1, g.sy + 2, 8, '#2e2434', true) + pad(c, g.fSh[0] + 1, g.sy + 3, 10, '#3a2e44', true, '#8aff3a'); },
      fItem: FI('melenas_blade', 18, 1.0),
      bItem: function (c, g) { return glowOrb(c, g.bHand[0] - 2, g.bHand[1] - 3, 4.5, FEL); }
    }, 34);
  }

  var MOBS = {
    young_wolf: function (c) { return quad(c, { kind: 'wolf', fur: '#8c7d6c', belly: '#c9bca8', scale: 0.8 }); },
    mangy_wolf: function (c) { return quad(c, { kind: 'wolf', fur: '#9a8a70', belly: '#c4b594', patches: '#c7a68e', scars: 1, scale: 0.88 }); },
    prowler: function (c) { return quad(c, { kind: 'wolf', fur: '#4a4656', belly: '#77728a', ruffC: '#3a3644', eye: '#ff3a2a', stripes: '#26222e', scale: 0.96 }); },
    young_forest_bear: function (c) { return quad(c, { kind: 'bear', fur: '#7a5234', belly: '#b8906a', scale: 0.86 }); },
    princess: function (c) { return quad(c, { kind: 'boar', fur: '#a86c52', belly: '#cf9a7e', mane: '#5a3024', bow: 1, scale: 1 }); },
    kobold_vermin: function (c) { return kobold(c, { fur: '#8a7466', cloth: '#6a5a44', claws: 1, scale: 0.85 }); },
    kobold_worker: function (c) { return kobold(c, { fur: '#9a7248', cloth: '#8e7b52', candle: 1, scale: 0.95, fItem: function (c) { return wpn(c, 'shovel', 40, 86, -28, 0.9); } }); },
    kobold_laborer: function (c) { return kobold(c, { fur: '#8a6a4a', cloth: '#6e4c34', vest: '#6a5a3a', candle: 1, scale: 1, fItem: function (c) { return wpn(c, 'club', 40, 86, -34, 0.85); } }); },
    kobold_tunneler: function (c) { return kobold(c, { fur: '#7c5c40', cloth: '#5a4a3a', vest: '#5a4f48', candle: 1, scale: 1.05, fItem: function (c) { return wpn(c, 'pick', 40, 86, -24, 0.95); } }); },
    murloc_streamrunner: function (c) { return murloc(c, { skin: '#3f9c96', belly: '#cfe3aa', fin: '#e07a4a', scale: 1, fItem: function (c) { return wpn(c, 'reedspear', 33, 91, -12, 0.85); } }); },
    murloc_forager: function (c) { return murloc(c, { skin: '#7c9a3c', belly: '#e3dca0', fin: '#c85a8a', scale: 0.95, fItem: function (c) { return wpn(c, 'fish', 29, 94, 160, 0.9); } }); },
    cookie: function (c) { return murloc(c, { skin: '#4f8fb0', belly: '#d8e8c8', fin: '#e8a040', hat: 1, apron: 1, scale: 1.02, fItem: function (c) { return wpn(c, 'ladle', 31, 92, -20, 0.9); } }); },
    defias_thug: function (c) { return mobH(c, defias({ fItem: FI('club', 38) })); },
    defias_bandit: function (c) { return mobH(c, defias({ torsoFx: vestFx('#4e3a2a'), sleeve: '#6e6858', torsoC: '#6e6858', fItem: FI('sword', 34, 0.8), bItem: BI('dagger', 190) })); },
    garrick_padfoot: function (c) {
      return mobH(c, defias({
        scale: 1.1, hood: '#2a2224', torsoFx: vestFx('#3a2a22'), sleeve: '#5a5248', torsoC: '#5a5248', cape: '#4a4d52',
        pads: function (c, g) { return pad(c, g.bSh[0] - 1, g.sy + 2, 7.5, '#3a2e28', true) + pad(c, g.fSh[0] + 1, g.sy + 3, 9, '#4a3a30', true, '#8a8e93'); },
        body: { shW: 17, armW: 9.5 }, fItem: FI('sword', 36, 1.05)
      }), 34);
    },
    defias_miner: function (c) { return mobH(c, defias({ hood: null, hair: { c: '#4a3222', style: 'short' }, cap: '#6a4a2e', torsoFx: vestFx('#6e5a44'), sleeve: SKIN[1], torsoC: '#a09884', fItem: FI('pick', 24, 0.95), armband: null })); },
    defias_pirate: function (c) { return mobH(c, defias({ hood: null, mask: null, hair: { c: '#2b1d15', style: 'short' }, bandana: '#6b6f74', eyepatch: 1, stubble: 1, sleeve: '#efe8dc', torsoC: '#efe8dc', pants: '#2f3a5a', torsoFx: function (c, g) { return CG(S(D`M20,${g.sy + 6} L110,${g.sy + 6} M20,${g.sy + 13} L110,${g.sy + 13} M20,${g.sy + 20} L110,${g.sy + 20} M20,${g.sy + 27} L110,${g.sy + 27}`, '#5a6068', 3.2), c.clip(g.torsoD)); }, belt: '#3a2a1e', buckle: GOLD, armband: null, fItem: FI('cutlass', 30) })); },
    /* Corvin Blackwell, captain of the Grey Hoods: a tired shipwright in a grey hood, leather apron over a dark coat, adze in hand */
    vancleef: function (c) {
      return mobH(c, defias({
        scale: 1.05, hood: '#6b6f74', mask: null, angry: false, stubble: 1, hair: { c: '#6a6660', style: 'short' },
        torsoC: '#2e3036', sleeve: '#34373d', pants: '#2a2c30', boots: '#1e1a16', hand: '#6a4a30',
        robe: '#2a2c31', robeFx: robeHemFx('#3e4148'), torsoFx: function (c, g) { return robeTrimFx('#44474e', '#26282c')(c, g); }, belt: '#3a2a1e', buckle: '#9aa0a6',
        mid: function (c, g) {
          /* leather shipwright's apron: bib with a neck strap, long skirt over the coat, a pocket with a chisel */
          var x = g.scx + 3, y = g.sy + 5, hy = g.hy, lea = '#7a5232';
          var ap = D`M${x - 7},${y} L${x + 8},${y - 1} L${g.wr + 3},${hy - 4} L${g.wr + 7},${g.fy - 16} C${g.sx + 6},${g.fy - 12} ${g.sx - 4},${g.fy - 12} ${g.wl - 3},${g.fy - 15} L${g.wl},${hy - 4} Z`;
          return S(D`M${x - 6},${y + 1} L${x - 2},${g.sy - 3} M${x + 7},${y} L${x + 5},${g.sy - 4}`, OL, 3.2) + S(D`M${x - 6},${y + 1} L${x - 2},${g.sy - 3} M${x + 7},${y} L${x + 5},${g.sy - 4}`, '#5a3a22', 1.6) +
            P(ap, c.cel(lea), 2) + CG(S(stitchLine(g.wl + 1, hy - 3, g.wr + 2, hy - 4, 3.2), '#c8a878', 0.9, 0.8) +
            F(D`M${g.wl - 4},${hy + 6} L${g.wr + 8},${hy + 4} L${g.wr + 8},${hy + 7} L${g.wl - 4},${hy + 9} Z`, '#000', 0.18) +
            F(D`M${x - 5},${y + 2} L${x - 1},${y + 1} L${g.sx - 3},${g.fy - 14} L${g.wl},${g.fy - 15} Z`, lt(lea, 0.25), 0.4), c.clip(ap)) +
            P(D`M${g.sx - 1},${hy + 1} L${g.sx + 9},${hy} L${g.sx + 9},${hy + 9} L${g.sx - 1},${hy + 10} Z`, c.cel(dk(lea, 0.15)), 1.5) +
            P(D`M${g.sx + 2},${hy + 1} L${g.sx + 3},${hy - 7} L${g.sx + 5},${hy - 7} L${g.sx + 5},${hy + 1} Z`, c.cel('#8a8f96'), 1.2) + R(g.sx + 1.8, hy - 1, 3.6, 3.4, WOOD, 1);
        },
        pads: function (c, g) { return pad(c, g.bSh[0] - 1, g.sy + 2, 7.5, '#3a3c42', false) + pad(c, g.fSh[0] + 1, g.sy + 3, 8.5, '#44474e', false, '#6b6f74'); },
        body: { shW: 17, armW: 9 }, armband: null, fItem: FI('adze', 28, 1.05)
      }), 36);
    },
    riverpaw_gnoll: function (c) {
      return mobH(c, {
        head: 'gnoll', skin: '#b88a4a', sleeve: '#b88a4a', torsoC: '#a67a40', hand: '#b88a4a', pants: '#6a4a2e', feet: 'paw', mane: '#5a3a20',
        body: { lean: 5, headX: 79, headY: 40, headR: 11, shY: 54, hipY: 84, dig: 1, stance: 8, neck: 9, fEl: [8, 10], fHd: [13, 20] },
        torsoFx: strapFx('#5a3a22', '#3a2412'), belt: '#4a3222',
        fItem: FI('spear', 20, 0.95), top: function () { return ''; }
      }, 32);
    },
    hogger: function (c) {
      return mobH(c, {
        head: 'gnoll', skin: '#8e5c38', sleeve: '#8e5c38', torsoC: '#7e5030', hand: '#8e5c38', pants: '#4a3222', feet: 'paw', mane: '#2e1a10', eyeC: '#ffe04a',
        scale: 1.12,
        body: { lean: 6, headX: 81, headY: 44, headR: 11.5, shY: 56, hipY: 86, shW: 19, waistW: 13, belly: 3, armW: 11, legW: 11.5, dig: 1, stance: 9, neck: 10, fEl: [9, 9], fHd: [16, 16], bEl: [-7, 12], bHd: [-4, 22] },
        torsoFx: function (c, g) { return strapFx('#3a2a1e', '#1a120c')(c, g) + CG(S(D`M${g.scx - 20},${g.hy - 8} L${g.scx + 25},${g.hy - 8}`, '#8a8f96', 5), c.clip(g.torsoD)); }, belt: '#3a2a1e', buckle: '#c9ced6',
        pads: function (c, g) { return pad(c, g.bSh[0] - 1, g.sy + 2, 9, '#6d737a', true, GOLD) + pad(c, g.fSh[0] + 1, g.sy + 3, 11, '#7c838b', true, GOLD); },
        bItem: BI('bigclub', -22, 0.8)
      }, 38);
    },
    rhahkzor: function (c) {
      return mobH(c, {
        head: 'ogre', skin: '#c48c68', sleeve: '#c48c68', torsoC: '#c48c68', hand: '#c48c68', pants: '#b07a58', feet: 'bare',
        scale: 1.06,
        body: { shW: 24, waistW: 16, belly: 7, hipY: 90, shY: 54, headX: 72, headY: 42, headR: 11, armW: 13, legW: 13.5, stance: 10, neck: 11, lean: 3, fEl: [9, 15], fHd: [14, 29], bEl: [-9, 15], bHd: [-6, 30] },
        torsoFx: function (c, g) { return S(D`M${g.scx - 4},${g.sy + 16} Q${g.scx + 6},${g.sy + 22} ${g.scx + 16},${g.sy + 15}`, dk('#c48c68', 0.4), 1.6) + CG(P(D`M${g.scx - 26},${g.sy - 2} L${g.scx - 18},${g.sy - 6} L${g.scx + 28},${g.hy - 4} L${g.scx + 20},${g.hy + 2} Z`, '#5a3a22', 2), c.clip(g.torsoD)); },
        mid: function (c, g) { return P(D`M${g.wl - 2},${g.hy - 5} L${g.wr + 3},${g.hy - 5} L${g.wr + 1},${g.hy + 16} L${g.sx + 2},${g.hy + 12} L${g.wl},${g.hy + 16} Z`, c.cel('#6a4a2e'), 2.2) + R(g.wl - 2.5, g.hy - 7, g.wr - g.wl + 6, 5, '#3a2618', 1.8); },
        pads: function (c, g) { return pad(c, g.fSh[0] + 2, g.sy + 2, 11, '#6d737a', true); },
        fItem: FI('bigclub', 20, 0.8)
      }, 42);
    },
    mr_smite: function (c) {
      return mobH(c, {
        head: 'tauren', skin: '#6b4a33', sleeve: '#6b4a33', torsoC: '#6b4a33', hand: '#6b4a33', pants: '#4a3a5a', feet: 'hoof',
        scale: 1.06,
        body: { shW: 22, waistW: 14, belly: 3, hipY: 86, shY: 52, headX: 72, headY: 39, headR: 12.5, armW: 12, legW: 12, dig: 1, stance: 9, neck: 11, lean: 3, fEl: [9, 13], fHd: [15, 24] },
        torsoFx: function (c, g) { return CG(P(D`M${g.scx - 26},${g.sy - 5} L${g.scx - 2},${g.sy - 5} L${g.sx - 2},${g.hy + 2} L${g.sx - 26},${g.hy + 2} Z`, c.cel('#2c3e66'), 2) + P(D`M${g.scx + 12},${g.sy - 5} L${g.scx + 30},${g.sy - 5} L${g.sx + 30},${g.hy + 2} L${g.sx + 11},${g.hy + 2} Z`, c.cel('#2c3e66'), 2) + P(D`M${g.scx - 20},${g.hy - 12} L${g.scx + 20},${g.hy - 16} L${g.scx + 20},${g.hy - 8} L${g.scx - 20},${g.hy - 4} Z`, '#6b6f74', 2), c.clip(g.torsoD)); },
        belt: '#3a2618', buckle: GOLD,
        pads: function (c, g) { return pad(c, g.fSh[0] + 2, g.sy + 3, 10, '#8a8f96', false, GOLD); },
        fItem: FI('hammer', 5, 0.92)
      }, 40);
    },
    goblin_engineer: function (c) {
      return mobH(c, {
        head: 'goblin', skin: '#6fae45', sleeve: '#c8a86a', torsoC: '#5c4a36', hand: '#6fae45', pants: '#5c4a36', boots: '#2e241c',
        body: { shY: 70, hipY: 94, shW: 12, waistW: 9, headX: 66, headY: 53, headR: 13, armW: 7, legW: 8, stance: 5, neck: 5, fEl: [6, 9], fHd: [11, 16], bEl: [-5, 10], bHd: [-2, 18] },
        torsoFx: function (c, g) { return R(g.scx - 2, g.sy + 6, 9, 8, '#4a3a2a', 1.6) + S(D`M${g.scx - 9},${g.sy} L${g.scx - 2},${g.sy + 7} M${g.scx + 11},${g.sy} L${g.scx + 7},${g.sy + 7}`, '#3a2a1e', 2); },
        belt: '#3a2a1e', buckle: '#c9ced6',
        fItem: FI('wrench', 26, 0.8),
        bItem: function (c, g) { var x = g.bHand[0] - 4, y = g.bHand[1] - 3; return C(x, y, 6, c.rg([[0, '#6a6a7a'], [1, '#1a1a22']], 0.35, 0.35, 0.7), 2) + S(D`M${x + 3},${y - 5} q3,-4 1,-7`, '#c9a060', 1.4) + C(x + 4, y - 12.5, 2.2, '#ffd040', 0); }
      }, 24);
    },
    gilnid: function (c) {
      return mobH(c, {
        head: 'goblin', skin: '#86a84a', sleeve: '#9a7a4a', torsoC: '#9a7a4a', hand: '#3a2a1e', pants: '#4a3a2a', boots: '#2a1e16', goggles: 'eyes',
        scale: 1.15,
        body: { shY: 70, hipY: 94, shW: 13, waistW: 10.5, belly: 3, headX: 66, headY: 53, headR: 13.5, armW: 8, legW: 8.5, stance: 5, neck: 5, fEl: [6, 9], fHd: [11, 16], bEl: [-5, 10], bHd: [-2, 18] },
        robe: '#4a3322',
        torsoFx: function (c, g) { return P(D`M${g.scx - 6},${g.sy + 4} L${g.scx + 12},${g.sy + 4} L${g.sx + 12},${g.hy} L${g.sx - 6},${g.hy} Z`, c.cel('#4a3322'), 2) + S(D`M${g.scx - 6},${g.sy + 4} L${g.scx - 9},${g.sy - 2} M${g.scx + 12},${g.sy + 4} L${g.scx + 9},${g.sy - 2}`, '#2a1e16', 1.8); },
        fItem: FI('ladle', 20, 0.9)
      }, 26);
    },
    sneed_shredder: function (c) { return shredder(c); },
    /* ---- Kaldvik ---- */
    rockjaw_trogg: function (c) { return mobH(c, trogg({}), 30); },
    burly_rockjaw_trogg: function (c) {
      return mobH(c, trogg({
        skin: '#8a7a66', stone: '#8a929c', scale: 1.14,
        body: { lean: 6, headX: 94, headY: 48, headR: 13, shY: 60, hipY: 90, shW: 22, waistW: 15, belly: 5, armW: 13, legW: 13, stance: 10, neck: 12, fEl: [9, 13], fHd: [12, 29], bEl: [-5, 16], bHd: [-1, 32] },
        pads: function (c, g) { return pad(c, g.fSh[0] + 1, g.sy + 3, 10, '#8a929c', true); },
        fItem: FI('bigclub', 16, 0.78)
      }), 36);
    },
    frostmane_troll_whelp: function (c) { return mobH(c, troll({ scale: 0.8, tusk: 0.45, maneLen: 0.5, fItem: FI('dagger', 30, 1.15) }), 24); },
    frostmane_troll: function (c) { return mobH(c, troll({ fItem: FI('bonespear', 14) }), 30); },
    frostmane_headhunter: function (c) {
      return mobH(c, troll({
        skin: '#98ac9c', paint: '#f4f6f8', mane: '#d8dcd4', earRing: 1,
        mid: function (c, g) { return furKilt('#d8cfbc', '#8a8070')(c, g) + wpn(c, 'taxe', g.wl + 1, g.hy + 4, 200, 0.8); },
        fItem: FI('taxe', 44, 1.15), bItem: BI('taxe', 150, 1.0)
      }), 30);
    },
    frostmane_seer: function (c) {
      return mobH(c, troll({
        skin: '#b0beb0', feathers: ['#3a78c8', '#f0f4f8'], earRing: 1, eyeC: '#9ae8ff', tusk: 0.8,
        pads: mantle('#6a5038', '#3a78c8'),
        fItem: FI('seerstaff', 6), bItem: function (c, g) { return glowOrb(c, g.bHand[0] - 2, g.bHand[1] - 5, 4.5, '#7fd0ff'); }
      }), 30);
    },
    grik_nir: function (c) {
      return mobH(c, troll({
        skin: '#8ca092', mane: '#d4d8d0', paint: '#f4f6f8', eyeC: '#9ae8ff', earRing: 1, feathers: ['#2a5aa8', '#f0f4f8'], tusk: 1.3, scale: 1.06,
        body: { lean: 6, headX: 82, headY: 40, headR: 11.8, shY: 52, hipY: 82, shW: 16.5, waistW: 10, armW: 8.4, legW: 8.8, stance: 11, dig: 1, neck: 8, fEl: [8, 14], fHd: [12, 27], bEl: [-6, 15], bHd: [-2, 29] },
        gTorso: boneNecklace,
        pads: function (c, g) { return pad(c, g.bSh[0] - 1, g.sy + 2, 8, '#d8ccb0', true) + pad(c, g.fSh[0] + 1, g.sy + 3, 10, '#e6dcc4', true, '#3a78c8'); },
        mid: furKilt('#e2dccc', '#3a78c8'),
        fItem: FI('griknir_staff', 6)
      }), 36);
    },
    ragged_young_wolf: function (c) { return quad(c, { kind: 'wolf', fur: '#a9a8a4', belly: '#e6e5e0', ruffC: '#c9c8c2', scruff: 1, scale: 0.8 }); },
    small_crag_boar: function (c) { return quad(c, { kind: 'boar', fur: '#8e8984', belly: '#bcb4ac', mane: '#5a5654', rocks: 1, rockC: '#8a8680', scale: 0.72 }); },
    crag_boar: function (c) { return quad(c, { kind: 'boar', fur: '#86807a', belly: '#b4aca2', mane: '#4e4a48', rocks: 1, rockC: '#7e7a76', scale: 0.9 }); },
    elder_crag_boar: function (c) { return quad(c, { kind: 'boar', fur: '#a09c96', belly: '#cac4bc', mane: '#6a6664', rocks: 2, rockC: '#8a8884', bigTusk: 1, scars: 1, scale: 1.04 }); },
    ice_claw_bear: function (c) { return quad(c, { kind: 'bear', fur: '#dfe7ef', belly: '#b4c6d8', ruffC: '#c8d6e4', clawC: '#3a4a62', scale: 1.0 }); },
    snow_leopard: function (c) { return quad(c, { kind: 'cat', fur: '#dcdcd6', belly: '#f6f4ee', spots: '#4a4a52', eye: '#9ad8ec', earIn: '#b8a8a4', scale: 0.92 }); },
    vagash: function (c) { return quad(c, { kind: 'cat', fur: '#c89858', belly: '#eed8a8', muzzle: '#f2e2c4', backStripe: '#8a6232', eye: '#ffb020', snarl: 1, scars: 1, faceScar: 1, torn: 1, scale: 1.05 }); },
    young_wendigo: function (c) { return wendigo(c, { scale: 0.78, seed: 5 }); },
    wendigo: function (c) { return wendigo(c, { scale: 0.95, seed: 9 }); },
    old_icebeard: function (c) { return wendigo(c, { scale: 1.12, seed: 13, fur: '#f4f8fb', face: '#3e434c', eyeC: '#bff4ff', beard: 1, icicles: 1, frost: 1 }); },
    leper_gnome: function (c) { return leperGnome(c); },
    /* ---- Greatbough ---- */
    young_nightsaber: function (c) { return quad(c, { kind: 'cat', fur: '#686b71', belly: '#8e9197', muzzle: '#a4a7ac', eye: '#efe39a', earIn: '#9a8a86', spots: '#3a3c42', scale: 0.76 }); },
    mangy_nightsaber: function (c) { return quad(c, { kind: 'cat', fur: '#5d6066', belly: '#7e8187', muzzle: '#95989d', eye: '#e6d888', earIn: '#8a7a76', patches: '#74777c', spots: '#35373c', scars: 1, torn: 1, scale: 0.88 }); },
    nightsaber: function (c) { return quad(c, { kind: 'cat', fur: '#53565c', belly: '#74777d', muzzle: '#8c8f94', eye: '#f4e8a0', earIn: '#8a7470', spots: '#2c2e33', snarl: 1, scale: 1.0 }); },
    young_thistle_boar: function (c) { return quad(c, { kind: 'boar', fur: '#7e5e44', belly: '#b0906e', mane: '#5a6a2e', thistle: 1, spine: 0.8, scale: 0.74 }); },
    thistle_boar: function (c) { return quad(c, { kind: 'boar', fur: '#6e503a', belly: '#a4845e', mane: '#56662a', thistle: 1, spine: 1.05, scale: 0.94 }); },
    grell: function (c) { return grell(c, { scale: 0.9 }); },
    vicious_grell: function (c) { return grell(c, { skin: '#7a8a64', spikes: 1, horns: 1, aura: 1, eyeC: '#f0ff40', scale: 1.06 }); },
    webwood_spider: function (c) { return spider(c, { col: '#6e7a62', scale: 0.9 }); },
    githyiss: function (c) { return spider(c, { col: '#4e4a5e', bloat: 1, crown: 1, eyeC: '#ff3a8a', scale: 1.0 }); },
    strigid_owl: function (c) { return owl(c, { scale: 1.05 }); },
    timberling: function (c) { return timberling(c, { scale: 0.92 }); },
    gnarlpine_ursa: function (c) { return furbolg(c, { fur: '#8a6240', seed: 21, feathers: ['#f0ece2'], scale: 0.95 }); },
    gnarlpine_warrior: function (c) { return furbolg(c, { fur: '#7a5434', seed: 25, pad: '#6a5a4a', angry: 1, paint: '#e8e0c8', necklace: 0, fItem: function (c) { return wpn(c, 'club', 30, 92, -24, 1.15); }, scale: 1.0 }); },
    gnarlpine_shaman: function (c) { return furbolg(c, { fur: '#9a7252', seed: 29, feathers: ['#f0ece2', '#3a78c8', '#b8342a'], glow: '#b8e060', gem: '#6ac8e0', fItem: function (c) { return wpn(c, 'fbstaff', 30, 92, -6, 0.86); }, scale: 0.98 }); },
    oakenscowl: function (c) { return furbolg(c, { fur: '#6a4c34', muzzle: '#b8a080', seed: 33, antlers: 1, eyeC: '#ffe46a', glow: '#9ae060', feathers: ['#f0ece2', '#8a5a32'], gem: '#8ae04a', hide: '#6a8a3a', angry: 1, fItem: function (c) { return wpn(c, 'oakenscowl_staff', 30, 92, -4, 0.9); }, scale: 1.08 }); },
    shadow_sprite: function (c) { return shadowSprite(c); },
    lord_melenas: function (c) { return melenas(c); }
  };

  /* ================= scenes (400x240, opaque) ================= */
  function skyRect(c, st) { return R(0, 0, 400, 240, c.lg(st), 0); }
  function sunGlow(c, x, y, r, col) { return C(x, y, r * 4, c.rg([[0, col, 0.6], [0.3, col, 0.22], [1, col, 0]]), 0) + C(x, y, r, lt(col, 0.6), 0); }
  function clouds(c, R_, n, y0, y1, col, o) {
    var out = '';
    for (var i = 0; i < n; i++) {
      var x = R_() * 400, y = y0 + R_() * (y1 - y0), s = 0.6 + R_() * 0.7;
      out += F(blob(x, y, 26 * s, 8 * s, 7, R_, 0.5), col, o || 0.85) + F(D`M${x - 24 * s},${y + 5 * s} L${x + 24 * s},${y + 5 * s}`, 'none');
    }
    return out;
  }
  function ridge(c, y, amp, fill, seed, n, sw) {
    var R_ = rnd(seed), pts = [];
    for (var i = 0; i <= n; i++) pts.push([i * 420 / n - 10, y - R_() * amp]);
    var d = 'M-10,' + r1(pts[0][1]);
    for (i = 1; i < pts.length; i++) {
      var mx = (pts[i - 1][0] + pts[i][0]) / 2, my = (pts[i - 1][1] + pts[i][1]) / 2;
      d += 'Q' + r1(pts[i - 1][0]) + ',' + r1(pts[i - 1][1]) + ' ' + r1(mx) + ',' + r1(my);
    }
    d += 'L410,' + r1(pts[n][1]) + 'L410,245L-10,245Z';
    return P(d, fill, sw || 0);
  }
  function tree(c, x, y, s, col, R_, sw) {
    var t = P(D`M${x - 3 * s},${y + 1} L${x - 2 * s},${y - 18 * s} L${x + 2 * s},${y - 18 * s} L${x + 3 * s},${y + 1} Z`, sw ? c.cel('#6a4a2e') : dk(col, 0.45), sw || 0);
    var cd = blob(x, y - 32 * s, 17 * s, 16 * s, 8, R_, 0.4);
    t += P(cd, sw ? c.cel(col) : col, sw || 0);
    t += CG(F(blob(x + 7 * s, y - 24 * s, 14 * s, 10 * s, 6, R_, 0.4), dk(col, 0.25), 0.7) + F(blob(x - 6 * s, y - 40 * s, 8 * s, 6 * s, 5, R_, 0.4), lt(col, 0.2), 0.8), c.clip(cd));
    return t;
  }
  function pine(c, x, y, h, col, sw) {
    var w = h * 0.38, t = F(D`M${x - 1.5},${y} L${x + 1.5},${y} L${x + 1.5},${y - h * 0.2} L${x - 1.5},${y - h * 0.2} Z`, dk(col, 0.5));
    for (var i = 0; i < 3; i++) {
      var yb = y - h * 0.12 - i * h * 0.26, ww = w * (1 - i * 0.26);
      t += P(D`M${x - ww},${yb} L${x},${yb - h * 0.45} L${x + ww},${yb} Q${x},${yb - h * 0.07} ${x - ww},${yb} Z`, sw ? c.cel(col) : (i ? lt(col, i * 0.05) : col), sw || 0);
    }
    return t;
  }
  function treeRow(c, y, n, seed, col, s0, s1, sw, x0, x1) {
    var R_ = rnd(seed), out = '';
    x0 = x0 == null ? -10 : x0; x1 = x1 == null ? 410 : x1;
    for (var i = 0; i < n; i++) {
      var x = x0 + (x1 - x0) * (i + R_() * 0.8) / n, s = s0 + R_() * (s1 - s0);
      out += tree(c, x, y + R_() * 6, s, mix(col, R_() > 0.5 ? '#9ab04a' : '#2a5a3a', R_() * 0.2), R_, sw);
    }
    return out;
  }
  function pineRow(c, y, n, seed, col, h0, h1, sw, x0, x1) {
    var R_ = rnd(seed), out = '';
    x0 = x0 == null ? -10 : x0; x1 = x1 == null ? 410 : x1;
    for (var i = 0; i < n; i++) out += pine(c, x0 + (x1 - x0) * (i + R_() * 0.7) / n, y + R_() * 5, h0 + R_() * (h1 - h0), col, sw);
    return out;
  }
  function groundBand(c, y, top, bot, seed, tuftCol) {
    var R_ = rnd(seed), out = P(D`M-5,${y} Q100,${y - 5} 200,${y} T405,${y} L405,245 L-5,245 Z`, c.lg([top, bot]), 0);
    var d = '';
    for (var i = 0; i < 46; i++) {
      var x = R_() * 400, yy = y + 8 + R_() * (236 - y - 8), s = 0.5 + (yy - y) / (240 - y) * 1.1;
      d += D`M${x},${yy} l${-2 * s},${-4.5 * s} M${x},${yy} l0,${-5.5 * s} M${x},${yy} l${2 * s},${-4.5 * s}`;
    }
    return out + S(d, tuftCol || dk(bot, 0.2), 1.1, 0.45);
  }
  function edgeGrass(c, col) {
    var d = '', R_ = rnd(77);
    for (var i = 0; i < 14; i++) {
      var x = i < 7 ? R_() * 60 : 340 + R_() * 60, y = 240;
      d += D`M${x},${y} q${-3 + R_() * 2},-10 ${-6 + R_() * 2},-${14 + R_() * 10} M${x + 3},${y} q2,-9 ${4 + R_() * 3},-${12 + R_() * 8}`;
    }
    return S(d, col, 2.2, 0.8);
  }
  function warmLight(c, x, y) { return R(0, 0, 400, 240, c.rg([[0, '#fff3c0', 0.35], [1, '#fff3c0', 0]], x, y, 0.8), 0); }
  function lantern(c, x, y, s) {
    s = s || 1;
    return C(x, y + 6 * s, 24 * s, c.rg([[0, '#ffc860', 0.55], [0.35, '#ff9a30', 0.22], [1, '#ff8a20', 0]]), 0) +
      S(D`M${x},${y - 4 * s} L${x},${y}`, '#1a1210', 1.4 * s) +
      P(D`M${x - 4 * s},${y} L${x + 4 * s},${y} L${x + 5 * s},${y + 11 * s} L${x - 5 * s},${y + 11 * s} Z`, c.rg([[0, '#fff6c0'], [0.6, '#ffb040'], [1, '#c8601a']]), 1.6 * s) +
      S(D`M${x - 5 * s},${y + 11 * s} L${x + 5 * s},${y + 11 * s} M${x - 4 * s},${y} L${x + 4 * s},${y}`, '#2a1e18', 2 * s);
  }
  function beam(c, x0, y0, x1, y1, w, col) {
    return tube([[x0, y0], [x1, y1]], w, col || '#7a5230', dk(col || '#7a5230', 0.3));
  }
  function mineMouth(c, x, y, w, h, wood, rot) {
    var out = '', pw = w * 0.14, ty = y - h;
    out += P(D`M${x - w / 2},${y} L${x - w / 2},${ty + h * 0.2} Q${x},${ty - h * 0.15} ${x + w / 2},${ty + h * 0.2} L${x + w / 2},${y} Z`, c.rg([[0, '#000000'], [0.65, '#120a06'], [1, '#2e2016']], 0.5, 0.75, 0.75), 2);
    out += F(D`M${x - w * 0.3},${y} L${x - w * 0.1},${ty + h * 0.45} L${x + w * 0.1},${ty + h * 0.45} L${x + w * 0.3},${y} Z`, '#3a2a1e', 0.5);
    out += S(D`M${x - w * 0.18},${y} L${x - w * 0.05},${ty + h * 0.5} M${x + w * 0.18},${y} L${x + w * 0.05},${ty + h * 0.5}`, '#6a6a70', 1.2, 0.7);
    out += beam(c, x - w / 2 + pw * 0.3, y, x - w / 2 + pw * 0.5, ty + h * 0.1, pw, wood);
    out += beam(c, x + w / 2 - pw * 0.3, y, x + w / 2 - pw * 0.5, ty + h * 0.1, pw, wood);
    out += beam(c, x - w / 2 - pw * 0.6, ty + h * 0.08, x + w / 2 + pw * 0.6, ty + h * 0.06, pw * 1.1, wood);
    out += beam(c, x - w / 2 + pw * 0.6, ty + h * 0.35, x - w / 2 + pw * 2.2, ty + h * 0.12, pw * 0.55, wood);
    out += beam(c, x + w / 2 - pw * 0.6, ty + h * 0.35, x + w / 2 - pw * 2.2, ty + h * 0.12, pw * 0.55, wood);
    out += lantern(c, x + w / 2 + pw * 0.2, ty + h * 0.25, 0.9);
    return out;
  }
  function rails(c, x0, y0, x1, y1, spread0, spread1, col) {
    var d = D`M${x0 - spread0},${y0} L${x1 - spread1},${y1} M${x0 + spread0},${y0} L${x1 + spread1},${y1}`, ties = '';
    for (var i = 1; i < 8; i++) {
      var t = Math.pow(i / 8, 1.6), x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, s = spread0 + (spread1 - spread0) * t;
      ties += D`M${x - s * 1.25},${y} L${x + s * 1.25},${y}`;
    }
    return S(ties, '#4a3222', 3, 0.9) + S(d, OL, 3.4) + S(d, col || '#9aa0a8', 1.6);
  }
  function minecart(c, x, y, s) {
    s = s || 1;
    return G(P('M-24,-22 L24,-22 L19,0 L-19,0 Z', c.cel('#6a5a4a'), 2.2) + S('M-22,-15 L22,-15 M-8,-22 L-7,0 M8,-22 L7,0', '#3a2e24', 1.6) +
      P('M-20,-22 C-16,-32 -6,-30 -2,-24 C2,-34 14,-32 20,-22 Z', c.cel('#5a5660'), 2) + C(-6, -26, 2.2, '#e8c860', 1) + C(9, -27, 1.8, '#e8c860', 1) +
      C(-12, 2, 5, c.cel('#3d4248'), 2) + C(12, 2, 5, c.cel('#3d4248'), 2), 'translate(' + x + ',' + y + ') scale(' + s + ')');
  }
  function rockFace(c, d, col, seed) {
    var R_ = rnd(seed), out = P(d, c.cel(col)), cl = c.clip(d), inner = '';
    for (var i = 0; i < 14; i++) inner += F(blob(R_() * 400, 20 + R_() * 150, 10 + R_() * 18, 6 + R_() * 10, 5, R_, 0.6), R_() > 0.5 ? lt(col, 0.15) : dk(col, 0.25), 0.6);
    inner += S(D`M${R_() * 400},${40 + R_() * 60} l${10 + R_() * 10},${12 + R_() * 10} l${-4},${14} M${R_() * 400},${60 + R_() * 60} l${12},${10} l${6},${16}`, dk(col, 0.5), 1.4, 0.7);
    return out + CG(inner, cl);
  }
  function fence(c, x0, x1, y, h, col) {
    var out = '', d = '';
    for (var x = x0; x <= x1; x += 22) out += R(x - 2, y - h, 4, h, col, 1.4);
    d = D`M${x0 - 4},${y - h * 0.75} L${x1 + 4},${y - h * 0.72} M${x0 - 4},${y - h * 0.35} L${x1 + 4},${y - h * 0.33}`;
    return S(d, OL, 4.2) + S(d, col, 2.2) + out;
  }
  function pumpkin(c, x, y, s) {
    return G(P('M0,-12 C-4,-13 -14,-12 -15,-4 C-16,4 -8,7 0,6 C8,7 16,4 15,-4 C14,-12 4,-13 0,-12 Z', c.cel('#e8801e'), 2) +
      S('M-7,-11 C-10,-4 -9,3 -6,6 M7,-11 C10,-4 9,3 6,6 M0,-12 L0,6', '#a24a0e', 1.3) +
      P('M-1.5,-11 L-1,-17 L3,-18 L2,-11 Z', '#4a6a22', 1.4) + S('M2,-16 q6,-2 7,3', '#4a7a2a', 1.4), 'translate(' + x + ',' + y + ') scale(' + s + ')');
  }
  function cottage(c, x, y, w, h, roof, wall) {
    var out = R(x, y - h, w, h, c.cel(wall || '#efe3c8'), 2);
    out += S(D`M${x},${y - h * 0.5} L${x + w},${y - h * 0.5} M${x + w * 0.33},${y - h} L${x + w * 0.33},${y} M${x + w * 0.66},${y - h} L${x + w * 0.66},${y} M${x},${y - h} L${x + w * 0.33},${y - h * 0.5}`, '#4a3222', 2.2);
    out += R(x + w * 0.4, y - h * 0.45, w * 0.18, h * 0.45, '#5a3a22', 1.6);
    out += R(x + w * 0.1, y - h * 0.85, w * 0.14, h * 0.25, '#ffd070', 1.4) + R(x + w * 0.74, y - h * 0.85, w * 0.14, h * 0.25, '#ffd070', 1.4);
    out += P(D`M${x - w * 0.1},${y - h} L${x + w * 0.2},${y - h - h * 0.9} L${x + w * 0.8},${y - h - h * 0.9} L${x + w * 1.1},${y - h} Z`, c.cel(roof), 2);
    out += S(D`M${x + w * 0.05},${y - h - h * 0.3} L${x + w * 0.95},${y - h - h * 0.3} M${x + w * 0.13},${y - h - h * 0.6} L${x + w * 0.87},${y - h - h * 0.6}`, dk(roof, 0.3), 1.2, 0.8);
    return out;
  }
  function elwynnBase(c, seed, o) {
    o = o || {};
    var R_ = rnd(seed), out = skyRect(c, o.sky || ['#6fa8dc', '#a9d4ef', '#f3e6c0']);
    out += sunGlow(c, o.sunX || 330, o.sunY || 38, 12, '#fff2b8');
    out += clouds(c, R_, 5, 18, 70, '#ffffff', 0.8);
    out += ridge(c, 124, 26, '#8fb3ad', seed + 1, 6);
    out += ridge(c, 138, 18, '#6f9a7a', seed + 2, 8);
    return out;
  }

  /* ---- Kaldvik helpers: snow, peaks, dwarven stone, troll camp props ---- */
  var SNOW = '#f4f8fb', SNOWS = '#b9cde0', DSTONE = '#8a8278';
  /* jagged mountain range: each peak lit on the left, shaded on the right, with a ragged snow cap */
  function peaks(c, yb, n, h0, h1, seed, rock, o) {
    o = o || {};
    var R_ = rnd(seed), out = '', x0 = o.x0 == null ? -30 : o.x0, x1 = o.x1 == null ? 430 : o.x1, sw = o.sw || 0, cap = o.cap == null ? 0.42 : o.cap;
    for (var i = 0; i < n; i++) {
      var px = x0 + (x1 - x0) * (i + 0.2 + R_() * 0.6) / n, h = h0 + R_() * (h1 - h0), py = yb - h, w = h * (0.9 + R_() * 0.5), mx = px + w * (R_() * 0.3 - 0.1);
      var L = [px - w, yb + 4], Rr = [px + w * 0.95, yb + 4];
      out += P(pl([[px, py], L, Rr]) + 'Z', o.lit || lt(rock, 0.1), sw);
      out += F(pl([[px, py], [mx, yb + 4], Rr]) + 'Z', dk(rock, 0.18), 0.9);
      var ch = h * cap, sl = [px - w * cap, py + ch], sr = [px + w * 0.95 * cap, py + ch], d = pl([[px, py], sl]);
      for (var k = 1; k < 6; k++) { var t = k / 6; d += 'L' + r1(sl[0] + (sr[0] - sl[0]) * t) + ',' + r1(sl[1] + (sr[1] - sl[1]) * t + (k % 2 ? h * 0.1 : -h * 0.04) * (0.6 + R_() * 0.8)); }
      d += 'L' + r1(sr[0]) + ',' + r1(sr[1]) + 'Z';
      out += P(d, o.snow || SNOW, sw) + F(pl([[px, py], [mx + (px - mx) * (1 - cap), py + ch * 0.9], sr]) + 'Z', o.snowS || SNOWS, 0.7);
    }
    return out;
  }
  function snowSky(c, st) { return skyRect(c, st || ['#7fa6cc', '#b8d0e6', '#e6eef6']); }
  function snowGround(c, y, seed, o) {
    o = o || {};
    var R_ = rnd(seed), out = P(D`M-5,${y} Q100,${y - 5} 200,${y} T405,${y} L405,245 L-5,245 Z`, c.lg(o.cols || ['#f6f9fc', '#dde9f2', '#c6d8e8']), 0), d = '';
    for (var i = 0; i < 7; i++) {
      var x = R_() * 420 - 10, yy = y + 12 + R_() * (230 - y - 12), w = 30 + R_() * 50;
      d += D`M${x - w},${yy} Q${x},${yy - 6} ${x + w},${yy}`;
    }
    out += S(d, o.drift || '#aac2d8', 2.2, 0.6);
    for (i = 0; i < 26; i++) out += C(R_() * 400, y + 6 + R_() * (234 - y), 0.8 + R_() * 0.8, '#ffffff', 0, 0.8);
    return out;
  }
  function snowPine(c, x, y, h, col, sw) {
    var w = h * 0.36, t = F(D`M${x - 1.6},${y} L${x + 1.6},${y} L${x + 1.6},${y - h * 0.2} L${x - 1.6},${y - h * 0.2} Z`, dk(col, 0.5));
    for (var i = 0; i < 3; i++) {
      var yb = y - h * 0.12 - i * h * 0.26, ww = w * (1 - i * 0.26), ya = yb - h * 0.45;
      t += P(D`M${x - ww},${yb} L${x},${ya} L${x + ww},${yb} Q${x},${yb - h * 0.07} ${x - ww},${yb} Z`, sw ? c.cel(col) : (i ? lt(col, i * 0.05) : col), sw || 0);
      t += P(D`M${x},${ya} L${x - ww * 0.62},${ya + h * 0.28} Q${x - ww * 0.35},${ya + h * 0.22} ${x - ww * 0.2},${ya + h * 0.3} Q${x + ww * 0.1},${ya + h * 0.2} ${x + ww * 0.3},${ya + h * 0.27} L${x + ww * 0.55},${ya + h * 0.25} Z`, SNOW, sw ? sw * 0.6 : 0);
    }
    return t;
  }
  function snowPineRow(c, y, n, seed, col, h0, h1, sw, x0, x1) {
    var R_ = rnd(seed), out = '';
    x0 = x0 == null ? -10 : x0; x1 = x1 == null ? 410 : x1;
    for (var i = 0; i < n; i++) out += snowPine(c, x0 + (x1 - x0) * (i + R_() * 0.7) / n, y + R_() * 5, h0 + R_() * (h1 - h0), col, sw);
    return out;
  }
  function snowfall(c, seed, n, o) {
    var R_ = rnd(seed), out = '';
    for (var i = 0; i < n; i++) out += C(R_() * 400, R_() * 240, 0.7 + R_() * 1.3, '#ffffff', 0, o || 0.75);
    return out;
  }
  function coldLight(c) { return R(0, 0, 400, 240, c.lg([[0, '#dcecff', 0.2], [0.5, '#dcecff', 0], [1, '#1a2a40', 0.18]]), 0); }
  function glowAt(c, x, y, r, col, a) { return C(x, y, r, c.rg([[0, col, a || 0.55], [0.4, col, (a || 0.55) * 0.4], [1, col, 0]]), 0); }
  /* stone block texture clipped to a shape */
  function blocks(c, d, x0, y0, x1, y1, bh, col) {
    var s = '', row = 0;
    for (var y = y0; y < y1; y += bh, row++) {
      s += D`M${x0},${y} L${x1},${y} `;
      for (var x = x0 + (row % 2) * bh; x < x1; x += bh * 2) s += D`M${x},${y} L${x},${y + bh} `;
    }
    return CG(S(s, col, 1, 0.75), c.clip(d));
  }
  function warmWin(c, x, y, w, h, arch) {
    var d = arch ? D`M${x},${y + h} L${x},${y + w * 0.5} Q${x + w / 2},${y - w * 0.15} ${x + w},${y + w * 0.5} L${x + w},${y + h} Z` : D`M${x},${y} L${x + w},${y} L${x + w},${y + h} L${x},${y + h} Z`;
    return glowAt(c, x + w / 2, y + h / 2, Math.max(w, h) * 1.4, '#ffc060', 0.4) + P(d, c.rg([[0, '#fff4c0'], [0.6, '#ffc050'], [1, '#e0802a']]), 1.6) +
      S(D`M${x + w / 2},${y + (arch ? w * 0.1 : 0)} L${x + w / 2},${y + h} M${x},${y + h * 0.55} L${x + w},${y + h * 0.55}`, '#4a3222', 1.3);
  }
  function snowCapD(x0, x1, y, th, seed) {
    var R_ = rnd(seed), d = D`M${x0 - 2},${y + 1}`, n = Math.max(3, Math.round((x1 - x0) / 10));
    d += D` Q${x0 + (x1 - x0) * 0.5},${y - th} ${x1 + 2},${y + 1}`;
    for (var i = n; i >= 0; i--) d += D` L${x0 + (x1 - x0) * i / n},${y + 2 + (i % 2 ? th * 0.55 : th * 0.2) * (0.6 + R_() * 0.8)}`;
    return d + 'Z';
  }
  function kegG(c, x, y, s, side) {
    var o = side ? E(0, 0, 11, 13, c.cel('#9a6a3a'), 2.2) + E(0, 0, 7.5, 9, c.cel('#b07a42'), 1.4) + '<ellipse cx="0" cy="0" rx="9.3" ry="11.2" fill="none" stroke="#4a4a50" stroke-width="2"/>' + C(0, 0, 2, '#4a3222', 1.2)
      : P('M-11,-14 C-14,-5 -14,5 -11,14 L11,14 C14,5 14,-5 11,-14 Z', c.cel('#9a6a3a'), 2.2) + S('M-12.4,-8 L12.4,-8 M-12.6,8 L12.6,8', '#4a4a50', 2.2) + E(0, -14, 11, 3, c.cel('#b07a42'), 1.8) + S('M-5,-12 L-5,13 M4,-12 L4,13', '#6a4222', 1, 0.7);
    return G(o, 'translate(' + r1(x) + ',' + r1(y) + ') scale(' + s + ')');
  }
  /* lying barrel seen from the front-left: long body + round end */
  function bigKeg(c, x, y, s) {
    return G(P('M-30,-18 L22,-18 C26,-10 26,10 22,18 L-30,18 Z', c.cel('#9a6a3a'), 2.4) + S('M-18,-18 L-18,18 M4,-18 L4,18', '#4a4a50', 2.6) + S('M-26,-8 L22,-8 M-26,6 L22,6', '#6a4222', 1, 0.6) +
      E(-30, 0, 12, 18, c.cel('#b58048'), 2.4) + E(-30, 0, 8, 12.5, c.cel('#c89058'), 1.4) + '<ellipse cx="-30" cy="0" rx="10.2" ry="15.4" fill="none" stroke="#4a4a50" stroke-width="2.2"/>' +
      R(-43, -3, 7, 6, c.cel('#c9ced6'), 1.6) + R(-47, -1.5, 5, 3, '#8a8f96', 1.2), 'translate(' + r1(x) + ',' + r1(y) + ') scale(' + s + ')');
  }
  function hutG(c, x, y, s, col) {
    var hide = 'M-30,0 C-30,-26 -16,-44 0,-46 C16,-44 30,-26 30,0 Z';
    return G(S('M-8,-44 L-14,-62 M4,-45 L10,-64 M-2,-46 L-2,-60', OL, 4) + S('M-8,-44 L-14,-62 M4,-45 L10,-64 M-2,-46 L-2,-60', '#8a6a44', 2) +
      P(hide, c.cel(col), 2.4) + CG(F('M-30,-14 C-10,-20 10,-20 30,-14 L30,-8 C10,-14 -10,-14 -30,-8 Z', dk(col, 0.2), 0.7) + S('M-18,-36 L-10,-6 M12,-38 L18,-6 M-28,-20 L28,-24', dk(col, 0.35), 1.3, 0.8) +
        F('M-30,-46 C-10,-50 10,-50 30,-46 L30,-30 C12,-40 -12,-40 -30,-30 Z', SNOW, 0.95), c.clip(hide)) +
      P('M-9,0 L-9,-16 Q0,-26 9,-16 L9,0 Z', '#1a1410', 1.8) + S('M-9,-16 Q0,-26 9,-16', '#e8e0c8', 1.4, 0.8), 'translate(' + r1(x) + ',' + r1(y) + ') scale(' + s + ')');
  }
  function totemG(c, x, y, s, skull) {
    var o = S('M0,0 L0,-66', OL, 7) + S('M0,0 L0,-66', '#7a5a3a', 4.2) +
      P('M-7,-54 L7,-54 L6,-38 L-6,-38 Z', c.cel('#6a4a2e'), 1.8) + P('M-5,-49 L-1,-47 L-5,-45 Z M5,-49 L1,-47 L5,-45 Z', '#8fd8ff', 1) + S('M-4,-41 L4,-41', OL, 1.4) +
      P('M-7,-60 L-14,-66 L-7,-63 Z M7,-60 L14,-66 L7,-63 Z M-7,-36 L-13,-30 L-6,-33 Z M7,-36 L13,-30 L6,-33 Z', '#e8e0c8', 1.4) +
      G(P('M0,0 C3,-3 3.6,-9 0,-13 C-3.6,-9 -3,-3 0,0 Z', c.cel('#3a78c8'), 1.2), 'translate(-5,-30) rotate(165)') + G(P('M0,0 C3,-3 3.6,-9 0,-13 C-3.6,-9 -3,-3 0,0 Z', c.cel('#f0f4f8'), 1.2), 'translate(5,-30) rotate(195)');
    if (skull) o += P('M-6,-66 C-6,-75 6,-75 6,-66 C6,-62 4,-61 3,-59 L-3,-59 C-4,-61 -6,-62 -6,-66 Z', c.cel('#ece4cc'), 1.6) + E(-2.2, -66.5, 1.6, 1.8, '#1a1009', 0) + E(2.2, -66.5, 1.6, 1.8, '#1a1009', 0);
    return G(o, 'translate(' + r1(x) + ',' + r1(y) + ') scale(' + s + ')');
  }
  function bannerG(c, x, y, h, col, seed) {
    var w = h * 0.26, top = y - h;
    var d = D`M${x + 2},${top + 6} L${x + 2 + w},${top + 6} L${x + 2 + w},${top + h * 0.62} L${x + 2 + w * 0.5},${top + h * 0.52} L${x + 2},${top + h * 0.62} Z`;
    return S(D`M${x},${y} L${x},${top}`, OL, 5) + S(D`M${x},${y} L${x},${top}`, '#6a4a2e', 2.8) + S(D`M${x - 2},${top + 5} L${x + w + 5},${top + 5}`, OL, 4) + S(D`M${x - 2},${top + 5} L${x + w + 5},${top + 5}`, '#6a4a2e', 2.2) +
      P(d, c.cel(col), 1.8) + CG(S(D`M${x + 2},${top + h * 0.25} l${w * 0.25},${-h * 0.06} l${w * 0.25},${h * 0.06} l${w * 0.25},${-h * 0.06} l${w * 0.25},${h * 0.06} M${x + 2},${top + h * 0.38} l${w * 0.25},${-h * 0.06} l${w * 0.25},${h * 0.06} l${w * 0.25},${-h * 0.06} l${w * 0.25},${h * 0.06}`, '#eef4fa', 1.6), c.clip(d)) +
      P(D`M${x + 2 + w * 0.5},${top + h * 0.12} l3,3 l-3,3 l-3,-3 Z`, '#eef4fa', 1);
  }
  function fireG(c, x, y, s) {
    return G(C(0, -6, 30, c.rg([[0, '#ffc050', 0.55], [0.4, '#ff8a20', 0.2], [1, '#ff8a20', 0]]), 0) +
      S('M-10,2 L10,-4 M-10,-4 L10,2', OL, 5) + S('M-10,2 L10,-4 M-10,-4 L10,2', '#6a4a2e', 3) +
      P('M0,-22 C6,-14 8,-8 5,-3 C3,0 -3,0 -5,-3 C-8,-8 -5,-14 0,-22 Z', '#ff8a1e', 1.6) + F('M0,-13 C3,-9 4,-6 2.5,-3.5 C1.5,-2 -1.5,-2 -2.5,-3.5 C-3.5,-6 -2,-9 0,-13 Z', '#fff07a') +
      C(-3, -32, 4, '#9aa4ae', 0, 0.35) + C(2, -42, 5, '#aab4be', 0, 0.28), 'translate(' + r1(x) + ',' + r1(y) + ') scale(' + (s || 1) + ')');
  }
  function boneG(c, x, y, a, s) {
    var b = '#ece4cc';
    return G(S('M-8,0 L8,0', OL, 5.4) + S('M-8,0 L8,0', b, 3) + C(-9, -1.6, 2.4, b, 1.4) + C(-9, 1.6, 2.4, b, 1.4) + C(9, -1.6, 2.4, b, 1.4) + C(9, 1.6, 2.4, b, 1.4), 'translate(' + r1(x) + ',' + r1(y) + ') rotate(' + a + ') scale(' + s + ')');
  }
  function iceShard(c, x, y, h, a) {
    return G(P(D`M0,0 L${-h * 0.18},${-h * 0.35} L0,${-h} L${h * 0.18},${-h * 0.35} Z`, c.lg(['#ffffff', '#bfe8ff', '#6ab4e0'], 0, 0, 1, 0), 1.4) + F(D`M0,0 L0,${-h} L${-h * 0.18},${-h * 0.35} Z`, '#ffffff', 0.4), 'translate(' + r1(x) + ',' + r1(y) + ') rotate(' + a + ')');
  }
  function dwarfPillar(c, x, y0, y1, w, col, glow) {
    var out = R(x - w / 2, y0, w, y1 - y0, c.lg([lt(col, 0.18), col, dk(col, 0.35)], 0, 0, 1, 0), 2.2);
    out += P(D`M${x - w / 2 - 5},${y0} L${x + w / 2 + 5},${y0} L${x + w / 2 + 2},${y0 + 7} L${x - w / 2 - 2},${y0 + 7} Z`, c.cel(dk(col, 0.1)), 2) + R(x - w / 2 - 7, y0 - 6, w + 14, 6, c.cel(col), 2);
    out += P(D`M${x - w / 2 - 2},${y1 - 7} L${x + w / 2 + 2},${y1 - 7} L${x + w / 2 + 6},${y1} L${x - w / 2 - 6},${y1} Z`, c.cel(dk(col, 0.1)), 2);
    out += S(D`M${x - w * 0.2},${y0 + 12} L${x - w * 0.2},${y1 - 12} M${x + w * 0.2},${y0 + 12} L${x + w * 0.2},${y1 - 12}`, dk(col, 0.4), 1.2, 0.7);
    out += P(D`M${x},${y0 + 16} l${w * 0.22},${w * 0.22} l${-w * 0.22},${w * 0.22} l${-w * 0.22},${-w * 0.22} Z`, glow ? '#ffb040' : dk(col, 0.25), 1.2);
    return out;
  }
  function anvilG(c, x, y, s) {
    return G(P('M-16,-14 L14,-14 C18,-14 22,-12 26,-10 C20,-9 16,-8 14,-6 L8,-6 L6,0 L10,6 L-10,6 L-6,0 L-8,-6 L-16,-6 Z', c.cel('#4a4e56'), 2.2) + S('M-16,-13 L14,-13', '#8a929c', 1.2, 0.8), 'translate(' + r1(x) + ',' + r1(y) + ') scale(' + s + ')');
  }

  /* ---- Greatbough helpers: twilight sky, colossal trunks, wisps, elven wood and moonwells ---- */
  var TBARK = '#4a3a56', TLEAF = '#2e4a66', TLEAF2 = '#4a3a80', TGLOW = '#bff4ff';
  function nightSky(c, st) { return skyRect(c, st || ['#15173a', '#2c2a64', '#524892', '#8474b4']); }
  function starsG(c, seed, n, y1) {
    var R_ = rnd(seed), out = '';
    for (var i = 0; i < n; i++) { var x = R_() * 400, y = R_() * (y1 || 110), r = 0.5 + R_() * 1.1; out += C(x, y, r, '#ffffff', 0, 0.4 + R_() * 0.5); }
    for (i = 0; i < 4; i++) out += sparkle(R_() * 400, R_() * (y1 || 100) * 0.8, 2.4 + R_() * 1.6, '#eef4ff');
    return out;
  }
  function moonG(c, x, y, r) {
    return C(x, y, r * 4.2, c.rg([[0, '#e8f0ff', 0.5], [0.3, '#c8d8ff', 0.18], [1, '#c8d8ff', 0]]), 0) +
      C(x, y, r, c.rg([[0, '#ffffff'], [0.7, '#e6ecfa'], [1, '#c4cce4']], 0.4, 0.38, 0.7), 0) +
      C(x - r * 0.3, y + r * 0.1, r * 0.2, '#c8d0e6', 0, 0.8) + C(x + r * 0.28, y - r * 0.3, r * 0.14, '#c8d0e6', 0, 0.8) + C(x + r * 0.2, y + r * 0.42, r * 0.12, '#c8d0e6', 0, 0.7);
  }
  /* a colossal trunk rising out of frame, with flared roots at yb */
  function bigTrunk(c, x, yb, w, col, seed, o) {
    o = o || {};
    var R_ = rnd(seed), top = o.top == null ? -12 : o.top, lean = o.lean || 0, out = '';
    var d = D`M${x - w / 2},${yb} C${x - w * 0.46},${yb - (yb - top) * 0.45} ${x - w * 0.36 + lean},${top + (yb - top) * 0.3} ${x - w * 0.33 + lean},${top} L${x + w * 0.33 + lean},${top} C${x + w * 0.36 + lean},${top + (yb - top) * 0.3} ${x + w * 0.46},${yb - (yb - top) * 0.45} ${x + w / 2},${yb} Z`;
    if (o.flare) d = D`M${x - w * 0.62},${yb} C${x - w * 0.36},${yb - 14} ${x - w * 0.34},${yb - 50} ${x - w * 0.33 + lean * 0.3},${yb - 80} C${x - w * 0.32 + lean * 0.6},${top + 60} ${x - w * 0.3 + lean},${top + 20} ${x - w * 0.28 + lean},${top} L${x + w * 0.28 + lean},${top} C${x + w * 0.3 + lean},${top + 20} ${x + w * 0.32 + lean * 0.6},${top + 60} ${x + w * 0.33 + lean * 0.3},${yb - 80} C${x + w * 0.34},${yb - 50} ${x + w * 0.36},${yb - 14} ${x + w * 0.62},${yb} Z`;
    [[-1, 1], [1, 1], [-1, 0.6], [1, 0.55]].forEach(function (rt, i) {
      var s = rt[0], k = rt[1], bx = x + s * w * (i < 2 ? 0.46 : 0.2), ex = x + s * w * (0.95 + R_() * 0.35) * k + s * 10;
      out += P(D`M${bx - s * w * 0.12},${yb - w * 0.5 * k} C${bx + s * w * 0.1},${yb - w * 0.2 * k} ${ex - s * w * 0.2},${yb - 4} ${ex},${yb + 3} L${bx - s * w * 0.3},${yb + 3} Z`, o.sw === 0 ? dk(col, 0.1) : c.cel(dk(col, 0.06)), o.sw == null ? 2.2 : o.sw);
    });
    out += P(d, o.sw === 0 ? col : c.lg([lt(col, 0.18), col, dk(col, 0.35)], 0, 0, 1, 0), o.sw == null ? 2.4 : o.sw);
    var bl = '';
    for (var i = 0; i < Math.max(3, Math.round(w / 12)); i++) { var bx = x - w * 0.38 + i * w * 0.76 / Math.max(2, Math.round(w / 12) - 1) + (R_() - 0.5) * 4; bl += D`M${bx},${yb + 2} C${bx + (R_() - 0.5) * 10},${yb - (yb - top) * 0.4} ${bx + (R_() - 0.5) * 8 + lean * 0.6},${top + 60} ${bx + lean * 0.8},${top} `; }
    out += CG(S(bl, dk(col, 0.45), 1.6, 0.7) + F(D`M${x - w / 2},${yb} C${x - w * 0.46},${yb - 80} ${x - w * 0.36 + lean},${top + 40} ${x - w * 0.33 + lean},${top} L${x - w * 0.2 + lean},${top} C${x - w * 0.26},${top + 60} ${x - w * 0.34},${yb - 60} ${x - w * 0.32},${yb} Z`, o.rim || '#8a9ad8', o.rimO || 0.25), c.clip(d));
    return out;
  }
  /* hanging leafy canopy across the top of a scene */
  function canopyTop(c, seed, y, cols, n) {
    var R_ = rnd(seed), out = '';
    n = n || 9;
    for (var i = 0; i < n; i++) {
      var x = -20 + i * 440 / (n - 1) + (R_() - 0.5) * 20, ry = y * (0.6 + R_() * 0.5), col = cols[i % cols.length];
      out += P(blob(x, ry * 0.3, 40 + R_() * 16, ry * 0.9, 9, R_, 0.4), c.cel(col), 0);
    }
    for (i = 0; i < n; i++) out += F(blob(-10 + R_() * 420, y * (0.4 + R_() * 0.5), 12 + R_() * 10, 6 + R_() * 4, 6, R_, 0.4), lt(cols[0], 0.18), 0.55);
    return out;
  }
  /* mid-distance night-elf trees: twisted trunk, purple / teal canopy */
  function tTree(c, x, y, s, col, R_, sw) {
    var t = P(D`M${x - 4 * s},${y + 1} C${x - 3 * s},${y - 14 * s} ${x - 6 * s},${y - 22 * s} ${x - 2 * s},${y - 30 * s} L${x + 2 * s},${y - 30 * s} C${x},${y - 22 * s} ${x + 4 * s},${y - 14 * s} ${x + 4 * s},${y + 1} Z`, sw ? c.cel('#4a3a52') : dk(col, 0.5), sw || 0);
    var cd = blob(x, y - 44 * s, 22 * s, 17 * s, 9, R_, 0.4);
    t += P(cd, sw ? c.cel(col) : col, sw || 0);
    t += CG(F(blob(x + 8 * s, y - 36 * s, 16 * s, 10 * s, 6, R_, 0.4), dk(col, 0.28), 0.7) + F(blob(x - 7 * s, y - 52 * s, 10 * s, 6 * s, 5, R_, 0.4), lt(col, 0.22), 0.8), c.clip(cd));
    return t;
  }
  function tTreeRow(c, y, n, seed, cols, s0, s1, sw, x0, x1) {
    var R_ = rnd(seed), out = '';
    x0 = x0 == null ? -10 : x0; x1 = x1 == null ? 410 : x1;
    for (var i = 0; i < n; i++) out += tTree(c, x0 + (x1 - x0) * (i + R_() * 0.8) / n, y + R_() * 6, s0 + R_() * (s1 - s0), cols[Math.floor(R_() * cols.length)], R_, sw);
    return out;
  }
  function wispsG(c, seed, n, x0, x1, y0, y1, col) {
    var R_ = rnd(seed), out = '';
    col = col || TGLOW;
    for (var i = 0; i < n; i++) {
      var x = x0 + R_() * (x1 - x0), y = y0 + R_() * (y1 - y0), r = 1.2 + R_() * 1.8;
      out += C(x, y, r * 5, c.rg([[0, col, 0.55], [0.4, col, 0.18], [1, col, 0]]), 0) + C(x, y, r, '#f4ffff', 0, 0.95);
    }
    return out;
  }
  function tMushroom(c, x, y, s, col) {
    return G(C(0, -6, 12, c.rg([[0, col, 0.45], [1, col, 0]]), 0) + S('M0,0 L0,-6', OL, 3.6) + S('M0,0 L0,-6', '#d8d0e8', 1.8) +
      P('M-6,-5 C-6,-11 6,-11 6,-5 Z', c.cel(col), 1.4) + C(-2, -8, 0.8, '#ffffff', 0, 0.8), 'translate(' + r1(x) + ',' + r1(y) + ') scale(' + s + ')');
  }
  function tGround(c, y, seed, o) {
    o = o || {};
    var R_ = rnd(seed), out = P(D`M-5,${y} Q100,${y - 5} 200,${y} T405,${y} L405,245 L-5,245 Z`, c.lg(o.cols || ['#3a4a62', '#2a3650', '#1c2438']), 0), d = '';
    for (var i = 0; i < 50; i++) {
      var x = R_() * 400, yy = y + 8 + R_() * (236 - y - 8), s = 0.5 + (yy - y) / (240 - y) * 1.1;
      d += D`M${x},${yy} l${-2 * s},${-4.5 * s} M${x},${yy} l0,${-5.5 * s} M${x},${yy} l${2 * s},${-4.5 * s}`;
    }
    out += S(d, o.tuft || '#56708a', 1.1, 0.5);
    if (o.shrooms !== 0) for (i = 0; i < (o.shrooms || 5); i++) out += tMushroom(c, R_() > 0.5 ? 10 + R_() * 90 : 300 + R_() * 90, y + 10 + R_() * 50, 0.7 + R_() * 0.5, R_() > 0.5 ? '#7ae0f0' : '#b890ff');
    return out;
  }
  function moonLight(c, x, y) { return R(0, 0, 400, 240, c.rg([[0, '#c8e0ff', 0.28], [0.5, '#a0b8ff', 0.08], [1, '#101030', 0.25]], x || 0.5, y || 0.25, 0.85), 0); }
  /* curved night-elf house: dark wood walls, glowing round window, sweeping purple roof with upturned tips */
  function tHouse(c, x, y, w, h, roof) {
    roof = roof || '#6a4aa8';
    var wall = D`M${x + w * 0.1},${y} C${x},${y - h * 0.5} ${x + w * 0.06},${y - h} ${x + w * 0.18},${y - h} L${x + w * 0.82},${y - h} C${x + w * 0.94},${y - h} ${x + w},${y - h * 0.5} ${x + w * 0.9},${y} Z`;
    var out = P(wall, c.cel('#6a5064'), 2.2) + CG(S(D`M${x + w * 0.3},${y} L${x + w * 0.3},${y - h} M${x + w * 0.7},${y} L${x + w * 0.7},${y - h} M${x},${y - h * 0.45} L${x + w},${y - h * 0.45}`, '#3a2a3a', 1.4, 0.8), c.clip(wall));
    out += glowAt(c, x + w * 0.5, y - h * 0.55, w * 0.5, '#9fe8ff', 0.35) + P(D`M${x + w * 0.4},${y} L${x + w * 0.4},${y - h * 0.5} Q${x + w * 0.5},${y - h * 0.82} ${x + w * 0.6},${y - h * 0.5} L${x + w * 0.6},${y} Z`, c.rg([[0, '#e8fbff'], [0.6, '#9fdcff'], [1, '#4a7ab8']], 0.5, 0.6, 0.7), 1.8);
    out += C(x + w * 0.18, y - h * 0.62, w * 0.07, c.rg([[0, '#f0fdff'], [1, '#7ac8f0']]), 1.4) + C(x + w * 0.82, y - h * 0.62, w * 0.07, c.rg([[0, '#f0fdff'], [1, '#7ac8f0']]), 1.4);
    var ry = y - h, rd = D`M${x - w * 0.22},${ry - h * 0.1} C${x - w * 0.08},${ry + h * 0.08} ${x + w * 0.1},${ry + h * 0.02} ${x + w * 0.2},${ry - h * 0.05} C${x + w * 0.32},${ry - h * 0.72} ${x + w * 0.68},${ry - h * 0.72} ${x + w * 0.8},${ry - h * 0.05} C${x + w * 0.9},${ry + h * 0.02} ${x + w * 1.08},${ry + h * 0.08} ${x + w * 1.22},${ry - h * 0.1} C${x + w * 1.08},${ry - h * 0.12} ${x + w * 0.96},${ry - h * 0.2} ${x + w * 0.9},${ry - h * 0.36} C${x + w * 0.76},${ry - h * 1.0} ${x + w * 0.24},${ry - h * 1.0} ${x + w * 0.1},${ry - h * 0.36} C${x + w * 0.04},${ry - h * 0.2} ${x - w * 0.08},${ry - h * 0.12} ${x - w * 0.22},${ry - h * 0.1} Z`;
    out += P(rd, c.cel(roof), 2.4) + CG(S(D`M${x + w * 0.5},${ry - h * 0.9} L${x + w * 0.5},${ry} M${x + w * 0.3},${ry - h * 0.72} Q${x + w * 0.2},${ry - h * 0.3} ${x + w * 0.05},${ry - h * 0.12} M${x + w * 0.7},${ry - h * 0.72} Q${x + w * 0.8},${ry - h * 0.3} ${x + w * 0.95},${ry - h * 0.12}`, dk(roof, 0.35), 1.3, 0.8) +
      F(D`M${x + w * 0.2},${ry - h * 0.5} C${x + w * 0.3},${ry - h * 0.9} ${x + w * 0.5},${ry - h * 0.95} ${x + w * 0.5},${ry - h * 0.95} L${x + w * 0.46},${ry - h * 0.5} Z`, lt(roof, 0.3), 0.5), c.clip(rd));
    out += S(D`M${x + w * 0.5},${ry - h * 0.92} Q${x + w * 0.46},${ry - h * 1.2} ${x + w * 0.56},${ry - h * 1.34}`, OL, 4) + S(D`M${x + w * 0.5},${ry - h * 0.92} Q${x + w * 0.46},${ry - h * 1.2} ${x + w * 0.56},${ry - h * 1.34}`, '#c8b8e8', 2);
    return out;
  }
  /* moonwell: carved stone ring, glowing water, a faint column of moonlight */
  function moonwellG(c, x, y, s) {
    var o = R(-26, -120, 52, 118, c.lg([[0, '#bff4ff', 0], [0.6, '#bff4ff', 0.12], [1, '#bff4ff', 0.3]]), 0) + C(0, -8, 60, c.rg([[0, '#9ff0ff', 0.45], [0.5, '#6ad0f0', 0.14], [1, '#6ad0f0', 0]]), 0);
    o += P('M-40,-6 C-40,-18 40,-18 40,-6 L38,4 C30,12 -30,12 -38,4 Z', c.cel('#a8a4c4'), 2.4) + S('M-30,-12 L-30,6 M-12,-15 L-12,9 M8,-15 L8,9 M26,-13 L26,7', '#6a6688', 1.2, 0.8);
    o += E(0, -10, 34, 7.5, c.rg([[0, '#f4ffff'], [0.5, '#9ff0ff'], [1, '#3a9ac8']], 0.5, 0.45, 0.6), 2) + E(-6, -11, 14, 2.2, '#ffffff', 0, 0.6);
    [[-34, -8], [34, -8], [0, -17]].forEach(function (p) { o += P(D`M${p[0] - 3},${p[1] + 2} C${p[0] - 5},${p[1] - 8} ${p[0] - 1},${p[1] - 16} ${p[0] + 3},${p[1] - 18} C${p[0]},${p[1] - 12} ${p[0] + 2},${p[1] - 6} ${p[0] + 4},${p[1] + 2} Z`, c.cel('#c8c4dc'), 1.8); });
    o += sparkle(-16, -30, 3, '#f0ffff') + sparkle(12, -46, 2.4, '#f0ffff') + sparkle(2, -70, 2, '#f0ffff');
    return G(o, 'translate(' + r1(x) + ',' + r1(y) + ') scale(' + s + ')');
  }
  function lampG(c, x, y, h) {
    return S(D`M${x},${y} L${x},${y - h} Q${x},${y - h - 6} ${x + 6},${y - h - 8}`, OL, 4.4) + S(D`M${x},${y} L${x},${y - h} Q${x},${y - h - 6} ${x + 6},${y - h - 8}`, '#5a4462', 2.2) +
      glowAt(c, x + 6, y - h - 4, 20, '#9fe8ff', 0.5) + P(D`M${x + 3},${y - h - 6} C${x + 3},${y - h + 2} ${x + 9},${y - h + 2} ${x + 9},${y - h - 6} Z`, c.rg([[0, '#ffffff'], [1, '#8ad8ff']]), 1.4);
  }
  function lotusG(c, x, y, s) {
    return G(E(0, 0, 16, 4.5, c.cel('#3a7a5a'), 1.6) + F('M0,0 L14,-1 L12,2 Z', '#1e3a4a', 0.9) +
      P('M-6,-1 C-8,-6 -5,-10 0,-12 C5,-10 8,-6 6,-1 Z', c.lg(['#fff0fa', '#f0b0d8', '#c070b0']), 1.4) + P('M-9,0 C-11,-4 -9,-6 -6,-6 C-5,-3 -4,-1 -3,0 Z M9,0 C11,-4 9,-6 6,-6 C5,-3 4,-1 3,0 Z', c.cel('#f4c4e4'), 1.2) +
      C(0, -14, 8, c.rg([[0, '#ffe0f4', 0.4], [1, '#ffe0f4', 0]]), 0), 'translate(' + r1(x) + ',' + r1(y) + ') scale(' + s + ')');
  }
  function webG(c, cx, cy, r, a0, a1, n) {
    var d = '', i, k, a;
    n = n || 7;
    for (i = 0; i <= n; i++) { a = a0 + (a1 - a0) * i / n; d += D`M${cx},${cy} L${cx + Math.cos(a) * r},${cy + Math.sin(a) * r} `; }
    for (k = 1; k <= 5; k++) {
      var rr = r * k / 5.4;
      for (i = 0; i < n; i++) {
        var b0 = a0 + (a1 - a0) * i / n, b1 = a0 + (a1 - a0) * (i + 1) / n, bm = (b0 + b1) / 2;
        d += D`M${cx + Math.cos(b0) * rr},${cy + Math.sin(b0) * rr} Q${cx + Math.cos(bm) * rr * 0.84},${cy + Math.sin(bm) * rr * 0.84} ${cx + Math.cos(b1) * rr},${cy + Math.sin(b1) * rr} `;
      }
    }
    return S(d, '#0a1418', 2.4, 0.5) + S(d, '#dfeef0', 1.1, 0.75);
  }
  function cocoonG(c, x, y, s) {
    return G(S('M0,-40 L0,-14', '#dfeef0', 1, 0.8) + P('M0,-16 C7,-14 8,0 6,10 C4,18 -4,18 -6,10 C-8,0 -7,-14 0,-16 Z', c.cel('#dcdcd4'), 1.8) +
      S('M-6,-6 L6,-2 M-7,2 L7,6 M-6,10 L5,13 M-5,-11 L5,-8', '#9aa0a0', 1, 0.8), 'translate(' + r1(x) + ',' + r1(y) + ') scale(' + s + ')');
  }
  function eggsG(c, x, y, n, s, seed) {
    var R_ = rnd(seed), out = C(x, y - 6 * s, 30 * s, c.rg([[0, '#c8ffb0', 0.5], [0.5, '#8ae080', 0.16], [1, '#8ae080', 0]]), 0);
    for (var i = 0; i < n; i++) {
      var ex = x + (R_() - 0.5) * 34 * s, ey = y - R_() * 10 * s, rr = (5 + R_() * 3) * s;
      out += E(ex, ey - rr, rr * 0.85, rr, c.rg([[0, '#f4ffe8'], [0.5, '#c0f0a0'], [1, '#5a9a6a']], 0.4, 0.35, 0.7), 1.6) + C(ex - rr * 0.3, ey - rr * 1.4, rr * 0.18, '#ffffff', 0, 0.8);
    }
    return out;
  }
  function fbTotem(c, x, y, s) {
    var wd = '#7a5634', o = S('M0,0 L0,-96', OL, 9) + S('M0,0 L0,-96', '#6a4a30', 6);
    function face(yy, col, eye) {
      return P(D`M-8,${yy} L8,${yy} L7.5,${yy - 18} L-7.5,${yy - 18} Z`, c.cel(col), 1.8) + P(D`M-5.5,${yy - 13} L-1.5,${yy - 11} L-5.5,${yy - 9} Z M5.5,${yy - 13} L1.5,${yy - 11} L5.5,${yy - 9} Z`, eye, 1) +
        E(0, yy - 5, 3.2, 2.2, '#2a1a10', 0) + S(D`M-8,${yy} L8,${yy}`, '#b8342a', 2);
    }
    o += face(-20, '#8a6038', '#1a1009') + face(-44, '#7a5634', '#e8ff9a');
    o += P('M-22,-66 C-14,-62 -8,-62 -6,-66 L6,-66 C8,-62 14,-62 22,-66 L20,-60 C12,-56 -12,-56 -20,-60 Z', c.cel('#8a6038'), 1.8) + S('M-16,-62 L16,-62', '#3a78c8', 1.4);
    o += C(-7, -86, 4, c.cel(wd), 1.6) + C(7, -86, 4, c.cel(wd), 1.6) + P('M-9,-68 C-11,-80 -6,-88 0,-88 C6,-88 11,-80 9,-68 Z', c.cel('#8a6038'), 2) +
      E(0, -71, 4.6, 3.4, c.cel('#c8a47a'), 1.3) + E(0, -73, 2, 1.4, '#1a1009', 0) + C(-3.8, -79, 1.3, '#e8ff9a', 0) + C(3.8, -79, 1.3, '#e8ff9a', 0);
    o += G(P('M0,0 C3,-3 3.6,-10 0,-14 C-3.6,-10 -3,-3 0,0 Z', c.cel('#f0ece2'), 1.2), 'translate(-20,-60) rotate(190)') + G(P('M0,0 C3,-3 3.6,-10 0,-14 C-3.6,-10 -3,-3 0,0 Z', c.cel('#b8342a'), 1.2), 'translate(20,-60) rotate(170)') +
      G(P('M0,0 C3,-3 3.6,-10 0,-14 C-3.6,-10 -3,-3 0,0 Z', c.cel('#3a78c8'), 1.2), 'translate(-15,-58) rotate(178)') + G(P('M0,0 C3,-3 3.6,-10 0,-14 C-3.6,-10 -3,-3 0,0 Z', c.cel('#f0ece2'), 1.2), 'translate(15,-58) rotate(182)');
    return G(o, 'translate(' + r1(x) + ',' + r1(y) + ') scale(' + s + ')');
  }
  function felCrystal(c, x, y, h, a, col) {
    col = col || '#7ee03a';
    return G(C(0, -h * 0.4, h * 0.9, c.rg([[0, col, 0.4], [1, col, 0]]), 0) + P(D`M0,0 L${-h * 0.2},${-h * 0.3} L${-h * 0.08},${-h} L${h * 0.14},${-h * 0.62} L${h * 0.2},${-h * 0.25} Z`, c.lg([lt(col, 0.6), col, dk(col, 0.5)], 0, 0, 1, 0), 1.6) +
      F(D`M0,0 L${-h * 0.08},${-h} L${-h * 0.2},${-h * 0.3} Z`, '#ffffff', 0.3), 'translate(' + r1(x) + ',' + r1(y) + ') rotate(' + a + ')');
  }
  function owlStatue(c, x, y, s) {
    var st = '#d6d6e6', o = '';
    o += P('M-30,0 L30,0 L26,-14 L-26,-14 Z', c.cel('#b8b8cc'), 2.2) + P('M-24,-14 L24,-14 L22,-22 L-22,-22 Z', c.cel('#c8c8da'), 2);
    o += P('M-20,-22 C-26,-50 -22,-82 0,-88 C22,-82 26,-50 20,-22 Z', c.cel(st), 2.4);
    o += P('M-20,-30 C-30,-50 -28,-70 -16,-80 C-14,-60 -12,-44 -8,-26 Z', c.cel(dk(st, 0.1)), 2) + P('M20,-30 C30,-50 28,-70 16,-80 C14,-60 12,-44 8,-26 Z', c.cel(dk(st, 0.14)), 2);
    o += S('M-18,-40 L-10,-36 M-20,-52 L-12,-48 M18,-40 L10,-36 M20,-52 L12,-48', '#8a8aa6', 1.2, 0.8);
    o += P('M-18,-94 C-20,-110 -10,-118 0,-116 C10,-118 20,-110 18,-94 C16,-84 -16,-84 -18,-94 Z', c.cel(st), 2.2) + P('M-16,-108 L-20,-124 L-8,-114 Z M16,-108 L20,-124 L8,-114 Z', c.cel(st), 1.8);
    o += C(-7, -101, 5, '#b8b8cc', 1.4) + C(7, -101, 5, '#b8b8cc', 1.4) + C(-7, -101, 2.2, c.rg([[0, '#ffffff'], [1, '#9fe8ff']]), 0) + C(7, -101, 2.2, c.rg([[0, '#ffffff'], [1, '#9fe8ff']]), 0);
    o += P('M-2.5,-96 L2.5,-96 L0,-89 Z', '#9a9ab0', 1.2);
    return G(o, 'translate(' + r1(x) + ',' + r1(y) + ') scale(' + s + ')');
  }
  /* white-stone elven column with a crescent capital */
  function nColumn(c, x, y0, y1, w) {
    return R(x - w / 2, y0, w, y1 - y0, c.lg(['#ffffff', '#dcdcec', '#9a9ab8'], 0, 0, 1, 0), 2) + S(D`M${x - w * 0.15},${y0 + 6} L${x - w * 0.15},${y1 - 6} M${x + w * 0.18},${y0 + 6} L${x + w * 0.18},${y1 - 6}`, '#a8a8c4', 1, 0.8) +
      P(D`M${x - w},${y0} C${x - w},${y0 - 7} ${x - w * 0.4},${y0 - 4} ${x},${y0 - 4} C${x + w * 0.4},${y0 - 4} ${x + w},${y0 - 7} ${x + w},${y0} Z`, c.cel('#e6e6f2'), 1.8) + R(x - w * 0.8, y1 - 5, w * 1.6, 5, c.cel('#d0d0e0'), 1.6);
  }

  /* ---- wood-elf dusk palette: the Greatbough start-zone scenes keep their night composition, but every blue / violet
     colour is remapped (after drawing, gradients included) to a warm green canopy, brown bark, olive moss, cream stone
     and gold dusk light; greens, golds and reds pass through unchanged ---- */
  var DUSKSKY = ['#24402e', '#4e6a3a', '#b0a04a', '#f0cc78'];
  function hsl2hex(h, s, l) {
    h = ((h % 360) + 360) % 360 / 360;
    function f(p, q, t) { if (t < 0) t += 1; if (t > 1) t -= 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; }
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p2 = 2 * l - q;
    return hex([f(p2, q, h + 1 / 3) * 255, f(p2, q, h) * 255, f(p2, q, h - 1 / 3) * 255]);
  }
  function duskCol(hx) {
    var a = rgb(hx), r = a[0] / 255, g = a[1] / 255, b = a[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn, h = 0, s = 0;
    if (d > 0) {
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) * 60 : mx === g ? ((b - r) / d + 2) * 60 : ((r - g) / d + 4) * 60;
    }
    if (s < 0.1) return l > 0.9 || l < 0.08 ? hx : hsl2hex(40, s + 0.14, l);
    if (h < 170 || h >= 320) return hx;
    if (l > 0.72) return s > 0.5 ? hsl2hex(44, 0.9, Math.max(l, 0.78)) : hsl2hex(42, 0.34, l);
    if (h < 212) return hsl2hex(96 + (h - 170) * 0.3, Math.min(0.55, s * 0.8 + 0.12), Math.min(0.7, l * 1.08));
    if (s < 0.3) return l > 0.45 ? hsl2hex(38, 0.24, l) : h < 245 ? hsl2hex(72, s * 0.9 + 0.12, l * 1.05) : hsl2hex(28, s + 0.14, l * 1.05);
    if (h < 256) return hsl2hex(102, Math.min(0.5, s * 0.85), Math.min(0.62, l * 1.12));
    return hsl2hex(26, Math.min(0.55, s * 0.9), l);
  }
  function duskStr(t) { return t.replace(/#[0-9a-fA-F]{6}\b/g, duskCol); }
  function duskWrap(fn) {
    return function (c) { var out = duskStr(fn(c)); c.defs = c.defs.map(duskStr); return out; };
  }
  /* low gold sun through the canopy gaps, in place of the moon */
  function duskSun(c, x, y, r) {
    return C(x, y, r * 5, c.rg([[0, '#fff0b8', 0.6], [0.3, '#ffd070', 0.24], [1, '#ffb040', 0]]), 0) + C(x, y, r, c.rg([[0, '#fffbe8'], [0.7, '#ffe8a0'], [1, '#f8c860']], 0.4, 0.38, 0.7), 0);
  }
  function duskLight(c, x, y) { return R(0, 0, 400, 240, c.rg([[0, '#ffe0a0', 0.3], [0.5, '#f0b860', 0.1], [1, '#1a2410', 0.25]], x || 0.5, y || 0.25, 0.85), 0); }
  function motesG(c, seed, n, y1) {
    var R_ = rnd(seed), out = '';
    for (var i = 0; i < n; i++) { var x = R_() * 400, y = R_() * (y1 || 110), r = 0.5 + R_() * 1.0; out += C(x, y, r, '#fff2c8', 0, 0.3 + R_() * 0.4); }
    return out;
  }

  var SCENES = {
    /* ---- Greatbough ---- */
    shadowglen: function (c) {
      var out = nightSky(c, DUSKSKY) + motesG(c, 301, 30, 90) + duskSun(c, 60, 34, 11);
      out += ridge(c, 132, 22, '#22284a', 302, 7) + tTreeRow(c, 140, 12, 303, ['#2e3e62', '#3a3470', '#2a4658'], 0.8, 1.2, 0);
      out += bigTrunk(c, 26, 150, 34, '#2e2842', 304, { sw: 0, rimO: 0.12 }) + bigTrunk(c, 376, 148, 40, '#2e2842', 305, { sw: 0, rimO: 0.12 });
      /* Aldrassil: a colossal trunk with walkways spiralling up it and elven platforms */
      var ax = 244, aw = 150;
      out += bigTrunk(c, ax, 162, aw, '#5a4666', 306, { lean: -8, rim: '#a8b8f0', rimO: 0.3, flare: 1 });
      out += E(ax - 20, 120, 7, 10, '#2e2438', 1.6, 0.9) + E(ax + 26, 60, 5, 8, '#2e2438', 1.6, 0.9) + S(D`M${ax - 30},104 q-6,12 2,24 M${ax + 18},46 q6,10 -2,22`, '#7a6a90', 1.4, 0.7);
      [[150, 0.42], [112, 0.38], [76, 0.36], [42, 0.34], [10, 0.32]].forEach(function (b, i) {
        var y = b[0], hw = aw * b[1] + 4, x0 = ax - hw - (i * 1.6), x1 = ax + hw - (i * 1.6);
        var rd = D`M${x0},${y + 6} Q${ax},${y + 16} ${x1},${y - 22}`;
        out += S(rd, OL, 10) + S(rd, '#8a6a5a', 7) + S(rd, '#c0a28a', 1.6, 0.8);
        var posts = '';
        for (var k = 1; k < 7; k++) { var t = k / 7, px = (1 - t) * (1 - t) * x0 + 2 * t * (1 - t) * ax + t * t * x1, py = (1 - t) * (1 - t) * (y + 6) + 2 * t * (1 - t) * (y + 16) + t * t * (y - 22); posts += D`M${px},${py - 3} L${px},${py - 11} `; }
        out += S(posts, OL, 3) + S(posts, '#9a7a68', 1.4);
        out += glowAt(c, ax + hw * 0.1, y + 4, 16, '#9fe8ff', 0.5) + C(ax + hw * 0.1, y - 4, 1.8, '#f0ffff', 0);
      });
      /* great boughs spreading into the canopy */
      out += P(D`M${ax - 50},30 C${ax - 90},20 ${ax - 140},10 ${ax - 190},-4 L${ax - 180},-14 C${ax - 130},-4 ${ax - 90},4 ${ax - 44},12 Z`, c.cel('#4e3e5c'), 2.2) + P(D`M${ax + 44},24 C${ax + 90},14 ${ax + 130},4 ${ax + 170},-8 L${ax + 176},4 C${ax + 136},14 ${ax + 96},24 ${ax + 50},40 Z`, c.cel('#4e3e5c'), 2.2);
      out += tHouse(c, ax - 118, 134, 30, 18, '#6a4aa8') + S(D`M${ax - 122},134 L${ax - 74},136`, OL, 5) + S(D`M${ax - 122},134 L${ax - 74},136`, '#8a6a5a', 3);
      out += tHouse(c, ax + 80, 94, 28, 16, '#7a4ab0') + S(D`M${ax + 72},94 L${ax + 114},92`, OL, 5) + S(D`M${ax + 72},94 L${ax + 114},92`, '#8a6a5a', 3);
      out += tHouse(c, ax - 104, 60, 24, 14, '#5a44a0') + S(D`M${ax - 108},60 L${ax - 72},62`, OL, 4) + S(D`M${ax - 108},60 L${ax - 72},62`, '#8a6a5a', 2.4);
      out += canopyTop(c, 307, 36, ['#2a3a64', '#3a3474', '#24405a']);
      out += tTreeRow(c, 160, 3, 308, ['#3a3474', '#2a4a62'], 1.4, 1.8, 2, -30, 110);
      out += tGround(c, 158, 309);
      out += F('M190,162 C220,158 280,158 300,164 C290,190 260,215 250,245 L140,245 C160,215 180,190 190,162 Z', '#46587a', 0.6);
      /* Aldrassil's roots spilling over the ground in front */
      out += P('M170,150 C150,156 120,164 92,170 C110,172 140,170 176,164 Z', c.cel('#4e3e5c'), 2.2) + P('M318,150 C340,158 366,164 396,168 C376,172 346,170 312,164 Z', c.cel('#4e3e5c'), 2.2) +
        P('M196,156 C190,164 176,172 160,178 C178,178 196,172 210,162 Z', c.cel('#56466a'), 2) + P('M292,156 C300,164 312,170 330,174 C312,176 294,170 282,162 Z', c.cel('#56466a'), 2);
      out += wispsG(c, 310, 12, 20, 380, 40, 200);
      out += duskLight(c, 0.2, 0.15);
      return out;
    },
    shadowthread_cave: function (c) {
      var out = R(0, 0, 400, 240, c.rg([[0, '#2e5250'], [0.55, '#16282e'], [1, '#070c12']], 0.5, 0.45, 0.75), 0);
      var R_ = rnd(321), tex = '';
      for (var i = 0; i < 26; i++) tex += F(blob(R_() * 400, R_() * 150, 14 + R_() * 24, 9 + R_() * 14, 5, R_, 0.6), R_() > 0.5 ? '#2a4446' : '#0e1a20', 0.6);
      out += tex + C(210, 112, 50, c.rg([[0, '#04080a'], [0.7, '#081014'], [1, '#081014', 0]]), 0);
      out += F('M-10,-10 L410,-10 L410,28 C360,22 330,40 290,32 C250,26 220,42 180,34 C140,26 100,40 60,32 C30,26 10,34 -10,28 Z', '#0a1418', 0.9);
      var st = '';
      [[30, 30, 26], [80, 34, 18], [140, 30, 30], [250, 34, 22], [320, 30, 28], [370, 32, 16]].forEach(function (s) { st += D`M${s[0] - 7},${s[1]} L${s[0]},${s[1] + s[2]} L${s[0] + 7},${s[1]} Z `; });
      out += P(st, c.lg(['#2a3a3e', '#1a2428']), 1.8);
      out += F('M-10,60 C20,70 30,110 20,150 L-10,160 Z M410,50 C380,70 372,110 384,150 L410,160 Z', '#081014', 0.8);
      out += webG(c, -4, -4, 120, 0, Math.PI / 2, 7) + webG(c, 404, -4, 110, Math.PI / 2, Math.PI, 6) + webG(c, 214, 20, 60, 0.3, Math.PI - 0.3, 6);
      out += S('M120,0 C140,40 180,60 214,70 M300,0 C290,40 260,60 230,72 M0,140 C40,120 80,118 120,128 M400,130 C360,118 320,120 290,132', '#dfeef0', 1, 0.55);
      out += cocoonG(c, 96, 76, 1) + cocoonG(c, 318, 70, 1.15) + cocoonG(c, 356, 96, 0.8);
      out += P('M-10,150 C80,140 320,140 410,150 L410,245 L-10,245 Z', c.lg(['#324a4a', '#22343a', '#141e24']), 0);
      out += F('M30,176 C80,170 130,172 150,178 C140,186 90,188 50,184 Z M250,200 C300,194 350,196 370,204 C350,212 290,212 262,208 Z', '#dfeef0', 0.18);
      out += S('M40,190 L120,172 M60,200 L130,180 M270,214 L360,196', '#dfeef0', 0.9, 0.4);
      out += eggsG(c, 60, 166, 6, 1.1, 322) + eggsG(c, 350, 170, 7, 1.2, 323) + eggsG(c, 180, 158, 4, 0.7, 324);
      out += R(0, 0, 400, 240, c.rg([[0, '#8ae0a0', 0.18], [0.5, '#5ac0a0', 0.06], [1, '#5ac0a0', 0]], 0.5, 0.7, 0.6), 0);
      out += R(0, 0, 400, 240, c.lg([[0, '#000', 0.35], [0.3, '#000', 0], [0.85, '#000', 0], [1, '#000', 0.35]]), 0);
      return out;
    },
    dolanaar: function (c) {
      var out = nightSky(c, ['#26422e', '#56703a', '#bca450', '#f4d07c']) + motesG(c, 331, 26, 80) + duskSun(c, 330, 40, 12);
      out += bigTrunk(c, 120, 140, 30, '#2a2440', 332, { sw: 0, rimO: 0.1 }) + bigTrunk(c, 300, 138, 26, '#2a2440', 333, { sw: 0, rimO: 0.1 });
      out += ridge(c, 128, 18, '#232a4c', 334, 7) + tTreeRow(c, 142, 14, 335, ['#2e3e62', '#3e3474', '#2a4a5c'], 0.8, 1.2, 0);
      out += tTreeRow(c, 150, 4, 336, ['#3e3478', '#2a4a62'], 1.1, 1.4, 1.8, 90, 330);
      out += tHouse(c, 12, 158, 76, 36, '#6a4aa8') + tHouse(c, 300, 156, 86, 40, '#7a4cb4') + tHouse(c, 214, 146, 40, 20, '#5e46a0');
      out += tGround(c, 156, 337, { shrooms: 3 });
      out += F('M150,160 C180,156 240,156 262,162 C270,190 280,215 290,245 L110,245 C130,215 140,190 150,160 Z', '#48587a', 0.55);
      out += moonwellG(c, 202, 170, 0.8);
      out += lampG(c, 118, 170, 34) + lampG(c, 282, 170, 34);
      out += wispsG(c, 338, 9, 20, 380, 60, 160);
      out += duskLight(c, 0.8, 0.15);
      return out;
    },
    lake_alameth: function (c) {
      var out = nightSky(c, ['#141838', '#2a2e66', '#4a4a8e', '#7a74b0']) + starsG(c, 341, 44, 100) + moonG(c, 300, 48, 20);
      /* far shore of giant trees */
      out += bigTrunk(c, 60, 142, 22, '#2a2644', 342, { sw: 0, rimO: 0.1 }) + bigTrunk(c, 170, 140, 16, '#2a2644', 343, { sw: 0, rimO: 0.1 }) + bigTrunk(c, 372, 142, 26, '#2a2644', 344, { sw: 0, rimO: 0.1 });
      out += canopyTop(c, 345, 30, ['#1e2a4c', '#2a2860']);
      out += tTreeRow(c, 140, 16, 346, ['#263658', '#322e66', '#22404e'], 0.9, 1.3, 0);
      /* the lake: moon glitter, ripples, lotus pads */
      out += P('M-10,142 L410,142 L410,178 L-10,178 Z', c.lg(['#3a4a86', '#2c3a72', '#223060']), 0);
      out += F('M-10,142 L410,142 L410,148 L-10,148 Z', '#1a2448', 0.6);
      var gl = '', R_ = rnd(347), i;
      for (i = 0; i < 26; i++) { var y = 145 + R_() * 30, w = 3 + R_() * 7, gx = 300 + (R_() - 0.5) * (14 + (y - 145) * 1.1); gl += D`M${gx - w},${y} L${gx + w},${y} `; }
      out += S(gl, '#e8f0ff', 1.3, 0.55);
      var rp = '';
      for (i = 0; i < 14; i++) { var rx = R_() * 400, ry = 150 + R_() * 26; rp += D`M${rx - 12},${ry} Q${rx},${ry - 2} ${rx + 12},${ry} `; }
      out += S(rp, '#8a9ad8', 1, 0.6);
      [[80, 160, 0.8], [140, 170, 1], [210, 156, 0.6], [360, 168, 0.9], [250, 172, 0.75]].forEach(function (l) { out += lotusG(c, l[0], l[1], l[2]); });
      /* foreground shore */
      out += P('M-10,176 C60,170 140,172 200,176 C260,180 340,170 410,174 L410,245 L-10,245 Z', c.lg(['#344c5a', '#263a4c', '#1a2638']), 0);
      out += tGround(c, 184, 348, { shrooms: 3, cols: ['#304656', '#243648', '#18222e'] }).replace(/^<path[^>]*\/>/, '');
      var rd = '';
      for (i = 0; i < 9; i++) { var x = i < 5 ? R_() * 70 : 330 + R_() * 70; rd += D`M${x},182 q${-2 + R_() * 4},-16 ${-3 + R_() * 6},-${26 + R_() * 12} `; }
      out += S(rd, OL, 3.4) + S(rd, '#4a6a5a', 1.8);
      out += wispsG(c, 349, 10, 20, 380, 90, 170);
      out += moonLight(c, 0.75, 0.2);
      return out;
    },
    banethil_barrow: function (c) {
      var out = nightSky(c, ['#171a3e', '#2a2c62', '#4a4488', '#6e64a4']) + starsG(c, 351, 30, 70);
      out += ridge(c, 122, 20, '#222848', 352, 7) + tTreeRow(c, 134, 14, 353, ['#2a3a5e', '#342e6a', '#26404e'], 0.9, 1.3, 0);
      out += bigTrunk(c, 200, 110, 150, '#3e3250', 354, { sw: 0, rimO: 0.14, top: -12 });
      /* barrow mound of gnarled roots with a carved doorway */
      var md = 'M60,162 C70,120 110,94 160,88 C200,84 240,84 270,92 C320,104 346,130 350,162 Z';
      out += P(md, c.cel('#4e3e52'), 2.4);
      out += CG(S('M70,150 C100,120 150,104 200,100 M90,160 C120,130 170,118 220,116 C260,116 300,126 330,150 M150,90 C170,110 176,130 172,160 M260,92 C250,112 250,134 258,160 M110,110 C130,120 136,140 130,162', '#2a2030', 2.4, 0.8) +
        S('M80,140 C110,112 160,98 210,96', '#7a6a8a', 1.4, 0.6), c.clip(md));
      var rt = '';
      [['M40,166 C60,130 90,110 130,112 C112,122 96,140 86,166 Z'], ['M360,166 C344,134 316,114 280,112 C300,124 314,140 320,166 Z'], ['M150,90 C170,70 210,64 240,72 C216,74 196,80 180,94 Z']].forEach(function (p) { rt += P(p[0], c.cel('#5a4862'), 2.2); });
      out += rt;
      var dx = 205, dy = 164;
      out += glowAt(c, dx, dy - 26, 60, '#e8c060', 0.35);
      out += P(D`M${dx - 34},${dy} L${dx - 34},${dy - 38} Q${dx},${dy - 76} ${dx + 34},${dy - 38} L${dx + 34},${dy} Z`, c.rg([[0, '#3a2a1e'], [0.5, '#140c08'], [1, '#06040a']], 0.5, 0.85, 0.9), 2.4);
      out += S(D`M${dx - 40},${dy} L${dx - 40},${dy - 40} Q${dx},${dy - 84} ${dx + 40},${dy - 40} L${dx + 40},${dy}`, OL, 8) + S(D`M${dx - 40},${dy} L${dx - 40},${dy - 40} Q${dx},${dy - 84} ${dx + 40},${dy - 40} L${dx + 40},${dy}`, '#6a5a70', 5);
      out += S(D`M${dx - 40},${dy - 20} l-6,-4 M${dx - 40},${dy - 44} l-6,-6 M${dx + 40},${dy - 20} l6,-4 M${dx + 40},${dy - 44} l6,-6 M${dx - 14},${dy - 70} l-3,-6 M${dx + 14},${dy - 70} l3,-6`, '#a898b8', 1.6, 0.8);
      out += fbTotem(c, 126, 168, 0.95) + fbTotem(c, 286, 168, 0.95) + fbTotem(c, 28, 174, 0.72) + fbTotem(c, 376, 176, 0.76);
      out += fireG(c, dx - 58, 168, 0.55) + fireG(c, dx + 58, 168, 0.55);
      out += tGround(c, 162, 355, { shrooms: 4 });
      out += F('M170,166 C190,164 230,164 242,168 C250,190 262,215 270,245 L130,245 C150,215 160,190 170,166 Z', '#44506c', 0.55);
      out += wispsG(c, 356, 7, 20, 380, 40, 150, '#d8ffb0');
      out += moonLight(c, 0.5, 0.1);
      return out;
    },
    fel_rock: function (c) {
      var out = nightSky(c, ['#10142a', '#1e2244', '#302e5a', '#46406e']) + starsG(c, 361, 22, 60);
      out += ridge(c, 118, 20, '#1a1e36', 362, 7) + tTreeRow(c, 132, 12, 363, ['#202c44', '#28264e'], 0.9, 1.3, 0);
      var rk = 'M40,166 C50,120 90,74 150,60 C200,50 260,56 300,76 C350,100 370,140 372,166 Z';
      out += rockFace(c, rk, '#3a3848', 364);
      out += CG(F('M40,166 C60,130 100,96 150,84 C200,74 260,80 300,96 C340,116 360,140 372,166 Z', '#6aff3a', 0.08), c.clip(rk));
      var mx = 206, my = 166;
      out += glowAt(c, mx, my - 30, 110, '#7ee03a', 0.45);
      out += P(D`M${mx - 56},${my} C${mx - 58},${my - 44} ${mx - 30},${my - 82} ${mx},${my - 84} C${mx + 32},${my - 82} ${mx + 58},${my - 44} ${mx + 56},${my} Z`, c.rg([[0, '#9aff5a'], [0.2, '#3a9a1a'], [0.55, '#0e2a08'], [1, '#050a04']], 0.5, 0.8, 0.8), 2.6);
      out += F(D`M${mx - 30},${my} C${mx - 24},${my - 30} ${mx + 24},${my - 30} ${mx + 30},${my} Z`, '#c8ff8a', 0.25);
      out += S(D`M${mx - 54},${my - 24} C${mx - 50},${my - 56} ${mx - 28},${my - 80} ${mx},${my - 82} C${mx + 28},${my - 80} ${mx + 50},${my - 56} ${mx + 54},${my - 24}`, '#8aff4a', 2, 0.5);
      [[mx - 70, my + 2, 34, -14, 0], [mx - 52, my + 4, 20, 10, 1], [mx + 64, my + 2, 38, 12, 0], [mx + 82, my + 4, 22, -8, 1], [110, 170, 26, -6, 0], [310, 172, 30, 8, 1], [60, 180, 18, 4, 0], [352, 186, 20, -10, 0]].forEach(function (s) { out += felCrystal(c, s[0], s[1], s[2], s[3], s[4] ? '#b060ff' : '#7ee03a'); });
      out += tGround(c, 164, 365, { shrooms: 0, cols: ['#2a3230', '#1e2426', '#12161a'], tuft: '#3a4a3a' });
      out += F(D`M${mx - 60},${my + 2} C${mx - 30},${my - 2} ${mx + 30},${my - 2} ${mx + 60},${my + 2} C${mx + 80},${my + 40} ${mx + 70},${my + 70} ${mx + 90},245 L${mx - 90},245 C${mx - 70},${my + 70} ${mx - 80},${my + 40} ${mx - 60},${my + 2} Z`, '#7ee03a', 0.14);
      out += S('M120,190 l14,6 l6,12 M300,196 l-12,8 l2,10 M200,214 l10,-6 l12,4 M60,206 l12,4', '#8aff3a', 1.6, 0.7);
      var R_ = rnd(366), em = '';
      for (var i = 0; i < 20; i++) em += C(mx - 60 + R_() * 120, 60 + R_() * 110, 0.8 + R_() * 1.4, R_() > 0.4 ? '#b8ff6a' : '#e0ffc0', 0, 0.8);
      out += em + R(0, 0, 400, 240, c.rg([[0, '#000', 0], [0.6, '#000', 0.12], [1, '#000', 0.5]], 0.5, 0.55, 0.75), 0);
      return out;
    },
    darnassus: function (c) {
      var out = nightSky(c, ['#2a4632', '#5a7640', '#c4aa54', '#f6d888']) + motesG(c, 371, 30, 90) + duskSun(c, 200, 40, 16);
      out += bigTrunk(c, 34, 150, 60, '#3e3458', 372, { rimO: 0.2 }) + bigTrunk(c, 370, 150, 70, '#3e3458', 373, { rimO: 0.2 });
      out += canopyTop(c, 374, 34, ['#2a3a68', '#3a3478', '#2a4660']);
      out += tTreeRow(c, 138, 10, 375, ['#2e3e66', '#3a3478'], 0.9, 1.2, 0, 60, 340);
      /* Temple of the Moon: stepped white-stone base, columns, sweeping crescent roof, domed crown */
      var tx = 214, ty = 152;
      out += P(D`M${tx - 96},${ty} L${tx + 96},${ty} L${tx + 88},${ty - 8} L${tx - 88},${ty - 8} Z`, c.cel('#d8d8e8'), 2) + P(D`M${tx - 84},${ty - 8} L${tx + 84},${ty - 8} L${tx + 78},${ty - 15} L${tx - 78},${ty - 15} Z`, c.cel('#e4e4f0'), 2);
      out += R(tx - 70, ty - 70, 140, 55, c.lg(['#3a3464', '#262048']), 2);
      out += glowAt(c, tx, ty - 40, 60, '#bff4ff', 0.3);
      [-60, -30, 0, 30, 60].forEach(function (k) { out += nColumn(c, tx + k, ty - 68, ty - 15, 11); });
      var rf = D`M${tx - 98},${ty - 64} C${tx - 84},${ty - 70} ${tx - 60},${ty - 74} ${tx - 40},${ty - 76} C${tx - 20},${ty - 100} ${tx + 20},${ty - 100} ${tx + 40},${ty - 76} C${tx + 60},${ty - 74} ${tx + 84},${ty - 70} ${tx + 98},${ty - 64} C${tx + 92},${ty - 76} ${tx + 80},${ty - 84} ${tx + 64},${ty - 88} C${tx + 40},${ty - 128} ${tx - 40},${ty - 128} ${tx - 64},${ty - 88} C${tx - 80},${ty - 84} ${tx - 92},${ty - 76} ${tx - 98},${ty - 64} Z`;
      out += P(rf, c.lg(['#ffffff', '#e2e2f0', '#a8a8c8'], 0.2, 0, 0.8, 1), 2.4);
      out += CG(S(D`M${tx - 90},${ty - 68} C${tx - 60},${ty - 80} ${tx - 30},${ty - 84} ${tx},${ty - 84} C${tx + 30},${ty - 84} ${tx + 60},${ty - 80} ${tx + 90},${ty - 68}`, '#7a5aa8', 2.4, 0.9) + S(D`M${tx - 40},${ty - 96} L${tx - 30},${ty - 80} M${tx},${ty - 118} L${tx},${ty - 86} M${tx + 40},${ty - 96} L${tx + 30},${ty - 80}`, '#a8a8c8', 1.3, 0.8), c.clip(rf));
      out += P(D`M${tx - 22},${ty - 118} C${tx - 22},${ty - 142} ${tx + 22},${ty - 142} ${tx + 22},${ty - 118} Z`, c.cel('#eeeef8'), 2.2);
      out += P(D`M${tx - 5},${ty - 138} C${tx - 14},${ty - 150} ${tx - 8},${ty - 162} ${tx + 2},${ty - 166} C${tx - 3},${ty - 158} ${tx - 3},${ty - 148} ${tx + 6},${ty - 140} Z`, c.cel('#d8d0f0'), 1.6) + glowAt(c, tx, ty - 152, 20, '#e8f0ff', 0.5);
      out += bannerG(c, tx - 110, ty - 4, 64, '#6a4aa8', 1) + bannerG(c, tx + 104, ty - 4, 64, '#6a4aa8', 2);
      out += owlStatue(c, 72, 166, 0.95);
      /* white-stone plaza */
      out += P('M-10,160 C80,156 320,156 410,160 L410,245 L-10,245 Z', c.lg(['#9a9ab8', '#7a7a9c', '#56567a']), 0);
      var tl = '';
      for (var y = 172; y < 245; y += 16) tl += D`M-10,${y} L410,${y} `;
      for (var k = -6; k <= 6; k++) tl += D`M${214 + k * 26},160 L${214 + k * 70},245 `;
      out += S(tl, '#4a4a6a', 1.1, 0.6);
      out += F('M-10,160 L60,160 C40,190 20,215 0,245 L-10,245 Z M410,160 L350,160 C372,190 392,215 410,240 Z', '#2e4a4a', 0.6);
      out += E(214, 196, 60, 10, c.rg([[0, '#e8fbff', 0.6], [0.5, '#9ff0ff', 0.25], [1, '#9ff0ff', 0]]), 0);
      out += wispsG(c, 376, 10, 20, 380, 50, 190);
      out += duskLight(c, 0.5, 0.12);
      return out;
    },
    northshire_abbey: function (c) {
      var out = elwynnBase(c, 11);
      out += pineRow(c, 146, 18, 5, '#4d7a54', 24, 40);
      var st = '#e3c07a', sd = '#b88f4c', rf = '#3e6bb3';
      out += R(200, 98, 102, 54, c.cel(st), 2.2);
      out += P('M194,101 L212,70 L292,70 L308,101 Z', c.cel(rf), 2.2) + S('M204,90 L298,90 M210,80 L292,80', dk(rf, 0.35), 1.2);
      [214, 236, 258, 280].forEach(function (x) { out += P(D`M${x},${140} L${x},${118} Q${x + 5},${110} ${x + 10},${118} L${x + 10},${140} Z`, c.lg(['#274a80', '#16284a']), 1.6) + S(D`M${x + 5},${114} L${x + 5},${140}`, '#e8c86a', 0.8, 0.8); });
      [208, 230, 252, 274, 296].forEach(function (x) { out += R(x - 2.5, 104, 5, 48, sd, 1.4); });
      out += R(284, 60, 22, 92, c.cel(st), 2.2) + P('M280,62 L295,26 L310,62 Z', c.cel(rf), 2.2) + P('M292,95 L292,80 Q295,74 298,80 L298,95 Z', '#1e3560', 1.4);
      out += P('M160,152 L160,90 L191,58 L222,90 L222,152 Z', c.cel(st), 2.2);
      out += S('M160,104 L222,104 M160,118 L222,118 M160,132 L222,132 M170,90 L170,104 M190,104 L190,118 M212,90 L212,104 M176,118 L176,132 M204,118 L204,132', sd, 1, 0.7);
      out += P('M151,95 L191,49 L231,95 L224,98 L191,60 L158,98 Z', c.cel(rf), 2.2);
      out += C(191, 82, 9, c.rg([[0, '#ffe9a0'], [0.5, '#4a7ac8'], [1, '#1a3060']]), 2) + S('M191,73 L191,91 M182,82 L200,82 M185,76 L197,88 M197,76 L185,88', '#e8c86a', 1, 0.9);
      out += P('M179,152 L179,126 Q191,110 203,126 L203,152 Z', c.cel('#6a4428'), 2.2) + S('M191,116 L191,152', '#3a2414', 1.4) + C(197, 138, 1.3, GOLD, 0);
      out += P('M172,152 L210,152 L214,158 L168,158 Z', '#d8c8a0', 1.6);
      out += R(116, 64, 38, 88, c.cel(st), 2.2) + P('M110,68 L135,12 L160,68 Z', c.cel(rf), 2.2) + S('M122,52 L148,52 M128,38 L142,38', dk(rf, 0.35), 1.2);
      out += P('M129,100 L129,84 Q135,76 141,84 L141,100 Z', '#1e3560', 1.4) + P('M129,130 L129,116 Q135,108 141,116 L141,130 Z', '#1e3560', 1.4);
      out += C(135, 11, 2.6, GOLD, 1.4) + C(295, 25, 2.2, GOLD, 1.2);
      out += treeRow(c, 158, 3, 21, '#4f8a3a', 1.3, 1.6, 1.8, -20, 110) + treeRow(c, 158, 3, 23, '#4f8a3a', 1.3, 1.6, 1.8, 318, 430);
      out += groundBand(c, 156, '#7cb450', '#4f8a36', 3);
      out += F('M176,158 L206,158 C230,190 260,215 290,245 L100,245 C130,215 158,190 176,158 Z', c.lg(['#c9a468', '#a88450']), 0.95);
      out += edgeGrass(c, '#3f7a2a') + warmLight(c, 0.8, 0.1);
      return out;
    },
    echo_ridge: function (c) {
      var out = elwynnBase(c, 21, { sunX: 60 });
      out += pineRow(c, 146, 16, 6, '#46704c', 26, 44);
      out += rockFace(c, 'M130,156 C150,120 180,96 210,66 C226,52 250,48 272,58 C300,70 330,72 360,86 C384,96 400,104 410,110 L410,160 Z', '#8a7a6a', 31);
      out += F('M200,74 C222,54 250,50 272,60 C300,72 330,74 360,88 C380,96 398,104 410,110 L410,100 C380,86 350,64 320,62 C290,48 250,40 226,52 Z', '#6c9a44', 0.9);
      out += mineMouth(c, 262, 158, 60, 58, '#7a5230');
      out += rails(c, 262, 156, 300, 200, 8, 22);
      out += minecart(c, 322, 164, 0.8);
      out += pineRow(c, 162, 3, 7, '#3c6a40', 50, 70, 1.8, -10, 110);
      out += groundBand(c, 158, '#78ae4c', '#4d8634', 5);
      out += F('M230,160 C260,158 300,160 330,166 C360,172 340,190 300,196 C270,196 240,180 230,160 Z', '#a88a5a', 0.6);
      out += edgeGrass(c, '#3f7a2a') + warmLight(c, 0.15, 0.1);
      return out;
    },
    vineyards: function (c) {
      var out = elwynnBase(c, 41);
      out += treeRow(c, 142, 12, 42, '#5a8a4a', 0.55, 0.75);
      out += cottage(c, 300, 138, 40, 20, '#3e62a8');
      out += groundBand(c, 132, '#8cbc5a', '#5a9440', 9);
      var rows = [[134, 0.5], [145, 0.68], [159, 0.92], [177, 1.18]];
      rows.forEach(function (rw, i) {
        var y = rw[0], s = rw[1], R_ = rnd(50 + i), g = '', posts = '';
        for (var x = -10 + i * 7; x < 410; x += 34 * s) {
          posts += R(x - 1.3 * s, y - 20 * s, 2.6 * s, 20 * s, '#6a4a2e', 1.2 * s);
          g += P(blob(x + 17 * s, y - 16 * s, 15 * s, 6 * s, 6, R_, 0.6), c.cel(mix('#4f8a36', '#6aa040', R_())), 1.4 * s);
          for (var k = 0; k < 3; k++) g += C(x + (8 + R_() * 18) * s, y - (10 + R_() * 4) * s, 2.3 * s, '#6a2a7a', 0.8 * s);
        }
        out += S(D`M-10,${y - 17 * s} L410,${y - 17 * s}`, '#4a3222', 1.2 * s) + posts + g;
      });
      out += edgeGrass(c, '#4f8a36') + warmLight(c, 0.8, 0.1);
      return out;
    },
    goldshire: function (c) {
      var out = elwynnBase(c, 51, { sky: ['#78a8d8', '#b8d8ee', '#f8dca8'] });
      out += treeRow(c, 150, 12, 52, '#4a7e46', 0.9, 1.2);
      var rf = '#3a62a8';
      out += R(248, 14, 14, 30, c.cel('#8a8274'), 2) + C(256, 8, 6, '#c8c8c8', 0, 0.5) + C(262, 0, 7, '#d8d8d8', 0, 0.4);
      out += R(124, 112, 172, 42, c.cel('#a89c88'), 2.2) + S('M124,124 L296,124 M124,136 L296,136 M140,112 L140,124 M170,112 L170,124 M230,112 L230,124 M270,112 L270,124 M156,124 L156,136 M250,124 L250,136', '#7a7062', 1, 0.8);
      out += R(116, 76, 188, 38, c.cel('#efe3c8'), 2.2);
      var d = '';
      [116, 146, 176, 206, 236, 266, 296].forEach(function (x) { d += D`M${x + 4},76 L${x + 4},114 `; });
      d += 'M120,95 L300,95 M126,76 L146,95 M176,95 L196,76 M236,76 L256,95 M286,95 L300,82';
      out += S(d, '#4a3222', 2.6);
      out += P('M104,80 L148,34 L272,34 L316,80 Z', c.cel(rf), 2.2) + S('M114,70 L306,70 M126,58 L294,58 M138,46 L282,46', dk(rf, 0.35), 1.2);
      out += R(194, 48, 30, 26, c.cel('#efe3c8'), 2) + P('M188,50 L209,32 L230,50 Z', c.cel(rf), 2) + R(202, 54, 14, 14, '#ffd070', 1.6);
      [152, 182, 236, 266].forEach(function (x) { out += R(x, 81, 16, 10, '#ffd070', 1.6) + S(D`M${x + 8},81 L${x + 8},91`, '#4a3222', 1.2); });
      out += C(210, 132, 40, c.rg([[0, '#ffd070', 0.3], [1, '#ffd070', 0]]), 0);
      [140, 170, 244, 274].forEach(function (x) { out += R(x, 126, 16, 16, c.rg([[0, '#fff0b0'], [1, '#ffb040']]), 1.6) + S(D`M${x + 8},126 L${x + 8},142 M${x},134 L${x + 16},134`, '#4a3222', 1.2); });
      out += P('M198,154 L198,128 Q210,116 222,128 L222,154 Z', c.cel('#5a3a22'), 2.2);
      out += S('M116,90 L94,90', OL, 4) + S('M116,90 L94,90', '#4a3222', 2) + S('M98,90 L98,95 M110,90 L110,95', '#2a2a2a', 1);
      out += R(94, 95, 20, 16, c.cel('#7a5230'), 1.8) + C(104, 103, 5, c.cel(GOLD), 1.4);
      out += R(62, 118, 3, 38, '#2a2a2a', 1.4) + lantern(c, 63.5, 110, 0.8);
      out += treeRow(c, 160, 2, 53, '#467e3a', 1.4, 1.7, 1.8, -30, 60) + treeRow(c, 160, 2, 54, '#467e3a', 1.4, 1.7, 1.8, 350, 440);
      out += groundBand(c, 156, '#80b450', '#548a38', 7);
      out += F('M-5,168 C100,160 300,160 405,168 L405,245 L-5,245 Z', c.lg(['#c2a06a', '#a8864e']), 0.9);
      out += edgeGrass(c, '#3f7a2a') + warmLight(c, 0.85, 0.1);
      return out;
    },
    fargodeep: function (c) {
      var out = elwynnBase(c, 61, { sunX: 300 });
      out += treeRow(c, 146, 12, 62, '#5a8a48', 0.7, 0.9);
      out += rockFace(c, 'M-10,158 L-10,90 C20,70 60,64 96,70 C130,76 160,96 176,120 C186,136 190,150 196,160 Z', '#9a7458', 63);
      out += F('M-10,92 C20,72 60,66 96,72 C130,78 150,90 166,108 C140,86 110,78 90,78 C60,74 20,82 -10,100 Z', '#6c9a44', 0.9);
      out += mineMouth(c, 104, 158, 56, 54, '#6e4a2c');
      out += beam(c, 150, 158, 150, 116, 5, '#7a5230') + beam(c, 178, 158, 178, 116, 5, '#7a5230') + beam(c, 146, 120, 182, 120, 5, '#7a5230') + beam(c, 150, 140, 178, 124, 3.5, '#7a5230');
      out += rails(c, 104, 156, 150, 204, 8, 22);
      out += fence(c, 250, 400, 160, 16, '#8a6a44');
      out += groundBand(c, 158, '#86b852', '#588e3a', 13);
      out += F('M60,162 C100,160 150,164 170,176 C180,186 150,196 120,194 C90,190 64,178 60,162 Z', '#a88a5a', 0.55);
      out += pumpkin(c, 360, 188, 0.8) + pumpkin(c, 385, 176, 0.6);
      out += edgeGrass(c, '#3f7a2a') + warmLight(c, 0.75, 0.1);
      return out;
    },
    crystal_lake: function (c) {
      var out = elwynnBase(c, 71, { sunX: 250, sunY: 30 });
      out += treeRow(c, 128, 16, 72, '#5a8a58', 0.6, 0.8);
      out += P('M-10,126 C80,120 320,120 410,126 L410,178 C300,184 100,184 -10,178 Z', c.lg(['#8ccbe8', '#3f8fc0', '#2a6a9c']), 0);
      out += S('M40,136 L100,136 M150,142 L230,142 M260,134 L330,134 M80,152 L160,152 M220,160 L300,160 M30,166 L70,166 M330,150 L380,150', '#e8f8ff', 1.6, 0.55);
      out += S('M235,128 L265,128 M240,134 L262,134 M244,140 L258,140', '#fff8d0', 2, 0.7);
      out += P('M150,132 C160,124 190,124 200,132 Z', c.cel('#6a8a4a'), 1.6) + tree(c, 176, 128, 0.5, '#4a7a3e', rnd(3), 1.4);
      out += R(300, 150, 90, 7, c.cel('#8a6440'), 2) + S('M312,150 L312,172 M336,150 L336,170 M360,150 L360,172 M384,150 L384,170', OL, 3) + S('M312,150 L312,172 M336,150 L336,170 M360,150 L360,172 M384,150 L384,170', '#6a4a2e', 1.8);
      out += groundBand(c, 176, '#8abb58', '#5a8e3c', 17);
      out += S('M20,180 L18,160 M26,180 L28,156 M32,180 L30,164 M370,182 L368,160 M376,182 L380,158 M384,182 L382,166', '#4a7a2a', 2, 0.9) + E(28, 158, 1.8, 5, '#6a4a2e', 0) + E(380, 158, 1.8, 5, '#6a4a2e', 0);
      out += edgeGrass(c, '#3f7a2a') + warmLight(c, 0.62, 0.1);
      return out;
    },
    brackwell: function (c) {
      var out = elwynnBase(c, 81, { sky: ['#78a4d0', '#b4d2ea', '#f6d8a0'] });
      out += treeRow(c, 144, 12, 82, '#5a8a48', 0.7, 0.95);
      out += cottage(c, 70, 146, 70, 36, '#3a5a98');
      out += R(262, 96, 78, 50, c.cel('#a8402e'), 2.2) + P('M254,98 L301,62 L348,98 Z', c.cel('#5a5a66'), 2.2) + P('M286,146 L286,112 L316,112 L316,146 Z', c.cel('#6a2a1e'), 2) + S('M286,112 L316,146 M316,112 L286,146', '#e8d8c0', 2);
      out += groundBand(c, 146, '#8cbc56', '#5c903c', 19);
      out += fence(c, -4, 400, 158, 14, '#8a6a44');
      out += S('M228,160 L228,100 M212,116 L244,116', OL, 5) + S('M228,160 L228,100 M212,116 L244,116', '#7a5230', 3);
      out += P('M218,116 L238,116 L240,140 L216,140 Z', c.cel('#5a7a9a'), 2) + C(228, 104, 7, c.cel('#e8c880'), 2) + P('M218,102 L238,102 L234,93 L222,93 Z', c.cel('#8a6a3a'), 1.8) + P('M212,103 L244,103 L244,106 L212,106 Z', '#8a6a3a', 1.6);
      var R_ = rnd(83);
      for (var i = 0; i < 14; i++) out += pumpkin(c, 10 + R_() * 380, 136 + R_() * 14, 0.4 + R_() * 0.2);
      out += pumpkin(c, 30, 196, 1.1) + pumpkin(c, 64, 216, 0.9) + pumpkin(c, 362, 204, 1.2) + pumpkin(c, 336, 226, 0.8);
      out += S('M20,192 C40,186 60,200 70,210 M350,200 C360,214 340,222 330,226', '#4a7a2a', 1.8, 0.8);
      out += edgeGrass(c, '#3f7a2a') + warmLight(c, 0.8, 0.1);
      return out;
    },
    forests_edge: function (c) {
      var out = skyRect(c, ['#5a88b8', '#9cc0d8', '#e8d0a0']);
      out += sunGlow(c, 90, 40, 10, '#ffe0a0');
      out += ridge(c, 128, 22, '#6a8a80', 91, 6);
      out += pineRow(c, 146, 22, 92, '#2e5a3a', 40, 70);
      out += treeRow(c, 152, 9, 93, '#35633a', 1.0, 1.4);
      out += groundBand(c, 150, '#7a9a4a', '#4a6a30', 23);
      out += F('M40,156 C120,150 300,150 380,160 L380,190 C300,196 100,196 40,186 Z', '#8a7a52', 0.6);
      var tent = function (x, y, s, col) {
        return G(P('M-30,0 L0,-54 L30,0 Z', c.cel(col), 2.2) + F('M-12,-18 L4,-22 L2,-8 L-14,-6 Z', dk(col, 0.25), 0.7) + P('M-8,0 L0,-24 L8,0 Z', '#2a1a10', 1.8) +
          S('M-8,-64 L6,-44 M8,-64 L-6,-44 M0,-66 L0,-50', OL, 3.4) + S('M-8,-64 L6,-44 M8,-64 L-6,-44 M0,-66 L0,-50', '#8a6a44', 1.6), 'translate(' + x + ',' + y + ') scale(' + s + ')');
      };
      out += tent(96, 156, 1, '#a07850') + tent(318, 154, 0.9, '#8a6a48');
      out += R(180, 124, 50, 32, c.cel('#7a5a3a'), 2) + P('M172,126 L205,100 L238,126 Z', c.cel('#b09a5a'), 2) + S('M180,118 L230,118 M186,110 L224,110', '#8a7a40', 1.2) + P('M198,156 L198,136 L212,136 L212,156 Z', '#2a1a10', 1.6);
      out += C(262, 158, 22, c.rg([[0, '#ffb040', 0.5], [1, '#ff8a20', 0]]), 0) + S('M252,162 L272,156 M252,156 L272,162', OL, 4.4) + S('M252,162 L272,156 M252,156 L272,162', '#6a4a2e', 2.4) +
        P('M262,140 C268,148 270,154 266,158 C264,160 260,160 258,158 C254,154 258,148 262,140 Z', '#ff8a1e', 1.4) + F('M262,148 C265,152 265,155 263,157 C262,158 261,158 260,157 C259,155 260,152 262,148 Z', '#fff07a') +
        C(258, 128, 5, '#8a8a8a', 0, 0.35) + C(254, 116, 6, '#9a9a9a', 0, 0.3);
      out += S('M146,156 L146,112', OL, 5) + S('M146,156 L146,112', '#8a6a44', 3) + C(146, 110, 5, '#e8e0c8', 1.8) + C(144.5, 109, 1, '#1a1009', 0) + C(147.5, 109, 1, '#1a1009', 0) + P('M140,122 L132,132 L142,126 Z M152,122 L160,132 L150,126 Z', '#c8402a', 1.4);
      var sd = '';
      for (var x = 4; x < 60; x += 9) sd += D`M${x},158 L${x + 1},${128 + (x % 3) * 4}`;
      out += S(sd, OL, 6) + S(sd, '#8a6a44', 3.5);
      out += edgeGrass(c, '#34581f') + R(0, 0, 400, 240, c.lg([[0, '#1a2a10', 0], [0.7, '#1a2a10', 0], [1, '#1a2a10', 0.25]]), 0);
      return out;
    },
    deadmines_mine: function (c) {
      var out = R(0, 0, 400, 240, c.rg([[0, '#3a3028'], [0.6, '#221a16'], [1, '#120c0a']], 0.5, 0.5, 0.7), 0);
      var R_ = rnd(101), tex = '';
      for (var i = 0; i < 30; i++) tex += F(blob(R_() * 400, R_() * 160, 12 + R_() * 22, 8 + R_() * 14, 5, R_, 0.6), R_() > 0.5 ? '#4a3e34' : '#1a1410', 0.55);
      out += tex;
      out += C(200, 122, 34, c.rg([[0, '#000000'], [0.7, '#0a0706'], [1, '#0a0706', 0]]), 0);
      out += P('M-10,245 L170,128 L230,128 L410,245 Z', c.lg(['#2a221c', '#4a3e32', '#5a4c3e']), 0);
      out += rails(c, 200, 128, 200, 245, 3, 44, '#8a8a90');
      [0.26, 0.36, 0.52, 0.74, 1].forEach(function (d, i) {
        var hw = 190 * d, top = 128 - 104 * d, bot = 128 + 112 * d, pw = 15 * d, wood = mix('#6a4a2c', '#1a120c', (1 - d) * 0.7);
        out += beam(c, 200 - hw, bot, 200 - hw + 4 * d, top, pw, wood) + beam(c, 200 + hw, bot, 200 + hw - 4 * d, top, pw, wood) + beam(c, 200 - hw - pw * 0.4, top, 200 + hw + pw * 0.4, top, pw * 1.1, wood);
        if (i === 1 || i === 3) out += lantern(c, 200 - hw * 0.62, top + pw * 0.6, d * 1.3) + lantern(c, 200 + hw * 0.62, top + pw * 0.6, d * 1.3);
      });
      out += minecart(c, 96, 176, 0.9);
      out += F('M60,190 C70,182 90,184 96,190 Z M300,196 C312,186 330,188 336,196 Z', '#3a3028', 0.9);
      out += R(0, 0, 400, 240, c.lg([[0, '#000', 0.35], [0.3, '#000', 0], [0.85, '#000', 0], [1, '#000', 0.3]]), 0);
      return out;
    },
    deadmines_ship: function (c) {
      var out = R(0, 0, 400, 240, c.lg(['#1e3a44', '#3a7a80', '#6ab0a8']), 0);
      out += C(260, 70, 120, c.rg([[0, '#bfe8d8', 0.45], [1, '#bfe8d8', 0]]), 0);
      out += P('M-10,126 C80,122 320,122 410,126 L410,182 L-10,182 Z', c.lg(['#2f8a8a', '#1a5a64', '#0f3a44']), 0);
      out += S('M30,140 L90,140 M130,170 L210,170 M280,176 L360,176 M60,160 L110,160 M330,138 L380,138', '#bff0e8', 1.4, 0.5);
      var hull = 'M92,112 L352,106 C348,130 338,148 318,156 L130,158 C112,150 98,134 92,112 Z';
      out += S('M178,108 L178,20 M252,106 L252,10 M318,104 L318,40', OL, 6) + S('M178,108 L178,20 M252,106 L252,10 M318,104 L318,40', '#5a3a22', 3.5);
      out += S('M60,98 L178,22 L252,12 L318,42 L346,90 M178,22 L100,110 M252,12 L200,108 M318,42 L290,106', '#2a1a10', 0.9, 0.8);
      [[178, 30, 36, 30], [178, 64, 40, 32], [252, 20, 40, 32], [252, 56, 46, 36], [318, 48, 30, 26]].forEach(function (s, si) {
        out += P(D`M${s[0] - s[2]},${s[1]} Q${s[0]},${s[1] - 5} ${s[0] + s[2]},${s[1]} Q${s[0] + s[2] + 5},${s[1] + s[3] / 2} ${s[0] + s[2] - 2},${s[1] + s[3]} Q${s[0]},${s[1] + s[3] + 6} ${s[0] - s[2] + 2},${s[1] + s[3]} Q${s[0] - s[2] + 6},${s[1] + s[3] / 2} ${s[0] - s[2]},${s[1]} Z`, c.cel(si % 2 ? '#9a978e' : '#bcae8e'), 2);
        out += S(D`M${s[0] - s[2] * 0.4},${s[1] + 2} L${s[0] - s[2] * 0.35},${s[1] + s[3]} M${s[0] + s[2] * 0.4},${s[1] + 2} L${s[0] + s[2] * 0.35},${s[1] + s[3]}`, '#6e6656', 1, 0.7);
        /* weathered patches sewn on */
        if (si !== 2) out += R(s[0] + (si % 2 ? -s[2] * 0.3 : s[2] * 0.1), s[1] + s[3] * 0.35, s[2] * 0.35, s[3] * 0.3, si % 2 ? '#b4a684' : '#8e8b82', 1.2, 0.95);
      });
      out += P('M252,10 L276,15 L252,21 Z', '#1a1414', 1.6);
      out += P(hull, c.cel('#5a3a24'));
      out += CG(F('M80,120 L360,114 L360,120 L80,126 Z', '#c9a060', 0.9) + F('M80,138 L360,132 L360,160 L80,166 Z', '#2a1a10', 0.5), c.clip(hull));
      for (var x = 130; x < 320; x += 24) out += R(x, 125, 9, 7, '#1a100a', 1.4);
      out += P('M292,108 L350,104 L352,82 L296,86 Z', c.cel('#6a4428'), 2) + R(304, 90, 8, 8, '#ffd070', 1.4) + R(320, 89, 8, 8, '#ffd070', 1.4) + R(336, 88, 8, 8, '#ffd070', 1.4);
      out += S('M92,112 L56,98', OL, 5) + S('M92,112 L56,98', '#6a4428', 3);
      out += R(0, 0, 400, 240, c.lg([[0, '#000', 0], [0.5, '#000', 0], [1, '#000', 0.2]], 0, 0, 1, 0), 0);
      out += rockFace(c, 'M-10,-10 L410,-10 L410,40 C390,36 380,60 372,52 C360,40 350,28 330,30 C300,26 280,14 250,16 C210,12 190,26 160,22 C120,18 100,30 80,26 C60,30 50,50 40,60 C30,80 20,110 24,140 C26,170 16,190 -10,200 Z', '#3a3430', 111);
      out += rockFace(c, 'M410,40 C390,50 378,80 380,110 C382,140 392,170 410,190 Z', '#3a3430', 112);
      out += F('M100,24 L106,48 L112,26 Z M150,22 L154,40 L160,22 Z M216,14 L222,36 L228,16 Z M296,22 L300,38 L306,24 Z', '#2e2a26');
      out += P('M-10,178 L410,178 L410,245 L-10,245 Z', c.lg(['#8a6440', '#6a4a2e']), 0);
      var pd = '';
      for (var y = 188; y < 245; y += 14) pd += D`M-10,${y} L410,${y} `;
      for (var i2 = 0; i2 < 16; i2++) pd += D`M${(i2 * 57) % 410},${188 + (i2 % 4) * 14} l0,14 `;
      out += S(pd, '#3a2616', 1.6, 0.8) + S('M-10,178 L410,178', '#2a1a10', 3);
      out += R(20, 150, 8, 30, c.cel('#6a4a2e'), 1.8) + lantern(c, 24, 138, 0.9) + R(372, 150, 8, 30, c.cel('#6a4a2e'), 1.8) + lantern(c, 376, 138, 0.9);
      return out;
    },
    /* ================= Kaldvik ================= */
    coldridge_valley: function (c) {
      var out = snowSky(c, ['#7ea6d0', '#b8d2ea', '#eef3f8']);
      out += sunGlow(c, 70, 40, 10, '#fff6e0');
      out += peaks(c, 140, 6, 50, 95, 201, '#8ea4bc', { snow: '#eef4fa', snowS: '#c4d6e6' });
      out += peaks(c, 150, 5, 30, 60, 202, '#76889c', { x0: -40, x1: 200 });
      out += snowPineRow(c, 152, 12, 203, '#2f5a4c', 18, 30, 0, -10, 200);
      /* mountainside the hall is carved into */
      var mtn = 'M170,160 C188,120 200,90 220,64 C236,42 260,18 290,6 C320,-4 360,0 410,-10 L410,160 Z';
      out += rockFace(c, mtn, '#7a8290', 204);
      out += CG(F('M200,96 C230,86 260,90 300,80 C330,72 370,78 410,70 L410,78 C370,86 330,82 300,90 C260,98 230,94 200,104 Z M232,50 C262,40 300,36 340,30 L410,24 L410,30 C360,36 300,44 240,58 Z', SNOW, 0.95), c.clip(mtn));
      /* Brunhall: carved stone facade, stepped roofline, a great arched door */
      var fx = 244, fy = 160, st = '#9a9088';
      var fac = D`M${fx},${fy} L${fx},${fy - 70} L${fx + 16},${fy - 70} L${fx + 16},${fy - 84} L${fx + 40},${fy - 84} L${fx + 52},${fy - 100} L${fx + 94},${fy - 100} L${fx + 106},${fy - 84} L${fx + 130},${fy - 84} L${fx + 130},${fy - 70} L${fx + 146},${fy - 70} L${fx + 146},${fy} Z`;
      out += P(fac, c.cel(st), 2.4) + blocks(c, fac, fx, fy - 100, fx + 146, fy, 9, dk(st, 0.35));
      out += P(snowCapD(fx + 50, fx + 96, fy - 100, 5, 1), SNOW, 1.6) + P(snowCapD(fx + 14, fx + 42, fy - 84, 4, 2), SNOW, 1.4) + P(snowCapD(fx + 104, fx + 132, fy - 84, 4, 3), SNOW, 1.4) +
        P(snowCapD(fx - 2, fx + 18, fy - 70, 3, 4), SNOW, 1.2) + P(snowCapD(fx + 128, fx + 148, fy - 70, 3, 5), SNOW, 1.2);
      out += dwarfPillar(c, fx + 30, fy - 64, fy, 14, '#a89c90', 1) + dwarfPillar(c, fx + 116, fy - 64, fy, 14, '#a89c90', 1);
      out += P(D`M${fx + 44},${fy - 88} L${fx + 73},${fy - 96} L${fx + 102},${fy - 88} L${fx + 97},${fy - 82} L${fx + 49},${fy - 82} Z`, c.cel('#c8a050'), 1.8) + C(fx + 73, fy - 88, 3.2, '#e8c870', 1.4);
      var dx0 = fx + 48, dx1 = fx + 98;
      out += glowAt(c, fx + 73, fy - 24, 70, '#ffb050', 0.5);
      out += P(D`M${dx0},${fy} L${dx0},${fy - 40} Q${fx + 73},${fy - 76} ${dx1},${fy - 40} L${dx1},${fy} Z`, c.rg([[0, '#fff0b8'], [0.5, '#ffb050'], [1, '#b8561a']], 0.5, 0.9, 0.9), 2.4);
      out += S(D`M${dx0 - 4},${fy} L${dx0 - 4},${fy - 40} Q${fx + 73},${fy - 82} ${dx1 + 4},${fy - 40} L${dx1 + 4},${fy}`, OL, 7) + S(D`M${dx0 - 4},${fy} L${dx0 - 4},${fy - 40} Q${fx + 73},${fy - 82} ${dx1 + 4},${fy - 40} L${dx1 + 4},${fy}`, '#6e665e', 4.4);
      out += F(D`M${dx0 + 8},${fy} L${dx0 + 14},${fy - 30} L${dx1 - 14},${fy - 30} L${dx1 - 8},${fy} Z`, '#8a4a1a', 0.35);
      [[fx + 14, fy - 30], [fx + 132, fy - 30]].forEach(function (b) { out += R(b[0] - 4, b[1], 8, 30, c.cel('#6e665e'), 1.8) + P(D`M${b[0] - 8},${b[1]} L${b[0] + 8},${b[1]} L${b[0] + 6},${b[1] - 6} L${b[0] - 6},${b[1] - 6} Z`, c.cel('#5a524a'), 1.8) + G(flame(0, 0, 0.36), 'translate(' + b[0] + ',' + (b[1] - 12) + ')') + glowAt(c, b[0], b[1] - 12, 26, '#ffb040', 0.5); });
      out += P(D`M${fx + 38},${fy} L${fx + 108},${fy} L${fx + 116},${fy + 8} L${fx + 30},${fy + 8} Z`, c.cel('#a89c90'), 1.8) + P(D`M${fx + 30},${fy + 8} L${fx + 116},${fy + 8} L${fx + 124},${fy + 15} L${fx + 22},${fy + 15} Z`, c.cel('#968a80'), 1.8);
      out += snowPineRow(c, 158, 3, 205, '#2a5446', 44, 62, 1.8, -20, 120);
      out += snowGround(c, 158, 206);
      out += F('M290,172 C300,168 330,168 340,172 C330,196 300,222 270,245 L150,245 C200,220 260,196 290,172 Z', '#c4d2de', 0.8);
      out += snowfall(c, 207, 40) + coldLight(c);
      return out;
    },
    coldridge_cave: function (c) {
      var out = R(0, 0, 400, 240, c.rg([[0, '#4a5c72'], [0.55, '#26324a'], [1, '#101828']], 0.45, 0.45, 0.75), 0);
      var R_ = rnd(211), tex = '';
      for (var i = 0; i < 26; i++) tex += F(blob(R_() * 400, R_() * 150, 14 + R_() * 24, 9 + R_() * 14, 5, R_, 0.6), R_() > 0.5 ? '#3e4e66' : '#182238', 0.6);
      out += tex;
      out += C(236, 112, 42, c.rg([[0, '#05080e'], [0.7, '#0a101a'], [1, '#0a101a', 0]]), 0);
      out += F('M-10,-10 L410,-10 L410,30 C360,24 330,40 290,34 C250,28 220,44 180,36 C140,28 100,42 60,34 C30,28 10,36 -10,30 Z', '#141c2c', 0.9);
      out += icicleRow(c, 20, 380, 30, 22, 22, 1.2);
      out += F('M-10,60 C20,70 30,110 20,150 L-10,160 Z M410,50 C380,70 372,110 384,150 L410,160 Z', '#101828', 0.8);
      [[30, 150, 34, -8], [48, 150, 22, 10], [372, 152, 38, 6], [352, 152, 24, -12], [300, 146, 18, 0], [120, 144, 16, -6]].forEach(function (s) { out += iceShard(c, s[0], s[1], s[2], s[3]); });
      out += P('M-10,150 C80,140 320,140 410,150 L410,245 L-10,245 Z', c.lg(['#6a7e94', '#4a5a70', '#34425a']), 0);
      out += F('M40,170 C80,164 130,166 150,172 C140,180 90,182 50,178 Z M260,196 C300,190 350,192 370,200 C350,208 290,208 262,204 Z', '#c8d8e6', 0.55);
      out += totemG(c, 86, 162, 1.05, 1) + totemG(c, 320, 160, 0.95, 1);
      out += R(0, 0, 400, 240, c.rg([[0, '#ffa040', 0.45], [0.45, '#ff8a20', 0.12], [1, '#ff8a20', 0]], 0.46, 0.72, 0.6), 0);
      out += fireG(c, 184, 176, 1.25);
      out += boneG(c, 238, 186, 18, 0.8) + boneG(c, 128, 196, -30, 0.7);
      out += P('M246,164 C262,160 286,160 300,166 C290,172 262,172 246,170 Z', c.cel('#8a6a4a'), 1.6);
      out += R(0, 0, 400, 240, c.lg([[0, '#000', 0.3], [0.3, '#000', 0], [0.85, '#000', 0], [1, '#000', 0.3]]), 0);
      return out;
    },
    kharanos: function (c) {
      var out = snowSky(c, ['#6a8cb8', '#a6c0dc', '#e8dcd0']);
      out += peaks(c, 138, 6, 45, 80, 221, '#8a9cb4', { snow: '#eef2f8', snowS: '#c0d0e0' });
      out += snowPineRow(c, 148, 16, 222, '#2c5448', 20, 34);
      /* small stone house, left */
      var hs = D`M20,154 L20,112 L84,112 L84,154 Z`;
      out += P(hs, c.cel('#9a9290'), 2.2) + blocks(c, hs, 20, 112, 84, 154, 8, '#6e6662') + warmWin(c, 32, 124, 12, 14) + warmWin(c, 62, 124, 12, 14);
      out += P('M12,114 L52,84 L92,114 Z', c.cel('#5a4a44'), 2.2) + P('M10,115 L52,82 L94,115 L88,118 L52,90 L16,118 Z', SNOW, 1.8) + F('M22,110 L52,88 L82,110 Z', SNOW, 0.85);
      /* Maltsson-style brewery inn: stone base, timber upper floor, steep snowy roof */
      var bx = 120, by = 156, bw = 170;
      var base = D`M${bx},${by} L${bx},${by - 40} L${bx + bw},${by - 40} L${bx + bw},${by} Z`;
      out += P(base, c.cel('#9a9290'), 2.2) + blocks(c, base, bx, by - 40, bx + bw, by, 9, '#6e6662');
      out += R(bx + 6, by - 82, bw - 12, 42, c.cel('#e6d8bc'), 2.2);
      var tb = '';
      for (var x = bx + 6; x <= bx + bw - 6; x += 26) tb += D`M${x},${by - 82} L${x},${by - 40} `;
      tb += D`M${bx + 6},${by - 62} L${bx + bw - 6},${by - 62} M${bx + 6},${by - 82} L${bx + 32},${by - 62} M${bx + 84},${by - 62} L${bx + 110},${by - 82} M${bx + 136},${by - 82} L${bx + 162},${by - 62}`;
      out += S(tb, '#4a3222', 2.6);
      [bx + 18, bx + 44, bx + 96, bx + 148].forEach(function (x) { out += warmWin(c, x, by - 78, 12, 12); });
      out += warmWin(c, bx + 18, by - 32, 14, 16) + warmWin(c, bx + 138, by - 32, 14, 16);
      out += R(bx + 150, by - 118, 16, 40, c.cel('#8a8280'), 2) + C(bx + 158, by - 124, 7, '#c8ccd2', 0, 0.55) + C(bx + 166, by - 136, 9, '#d8dce2', 0, 0.45) + C(bx + 158, by - 150, 10, '#e2e6ea', 0, 0.35);
      out += P(D`M${bx - 12},${by - 80} L${bx + 40},${by - 124} L${bx + bw - 40},${by - 124} L${bx + bw + 12},${by - 80} Z`, c.cel('#5a4a44'), 2.2);
      out += P(D`M${bx - 14},${by - 79} L${bx + 40},${by - 126} L${bx + bw - 40},${by - 126} L${bx + bw + 14},${by - 79} L${bx + bw + 4},${by - 76} L${bx + bw - 44},${by - 116} L${bx + 44},${by - 116} L${bx - 4},${by - 76} Z`, SNOW, 2) + F(D`M${bx + 6},${by - 86} L${bx + 44},${by - 118} L${bx + bw - 44},${by - 118} L${bx + bw - 6},${by - 86} Z`, SNOW, 0.8);
      out += R(bx + 72, by - 110, 26, 18, c.cel('#e6d8bc'), 2) + warmWin(c, bx + 79, by - 108, 12, 13, 1);
      out += glowAt(c, bx + 85, by - 16, 40, '#ffb050', 0.45) + P(D`M${bx + 72},${by} L${bx + 72},${by - 24} Q${bx + 85},${by - 38} ${bx + 98},${by - 24} L${bx + 98},${by} Z`, c.cel('#6a4428'), 2.2) + S(D`M${bx + 85},${by - 32} L${bx + 85},${by}`, '#3a2414', 1.4);
      out += S(D`M${bx + 104},${by - 44} L${bx + 122},${by - 44}`, OL, 4) + S(D`M${bx + 104},${by - 44} L${bx + 122},${by - 44}`, '#4a3222', 2) + kegG(c, bx + 114, by - 30, 0.55, 1);
      /* big kegs racked beside the inn */
      out += R(300, 124, 4, 32, '#4a3222', 1.4) + R(372, 124, 4, 32, '#4a3222', 1.4) + S('M298,140 L378,140', OL, 4) + S('M298,140 L378,140', '#6a4a2e', 2.2);
      out += bigKeg(c, 344, 138, 0.95) + bigKeg(c, 356, 104, 0.7) + kegG(c, 312, 158, 0.9) + kegG(c, 392, 162, 0.8, 1);
      out += P(snowCapD(318, 368, 118, 4, 7), SNOW, 1.4) + P(snowCapD(334, 372, 90, 3, 8), SNOW, 1.2);
      out += R(106, 118, 3, 40, '#2a2a2a', 1.4) + lantern(c, 107.5, 110, 0.8);
      out += snowGround(c, 156, 223);
      out += F('M150,158 L230,158 C250,190 270,215 290,245 L90,245 C120,215 140,190 150,158 Z', '#c8d4e0', 0.75);
      out += snowfall(c, 224, 55) + warmLight(c, 0.5, 0.6) + coldLight(c);
      return out;
    },
    grizzled_den: function (c) {
      var out = snowSky(c, ['#5a7090', '#8ea4bc', '#c8d2dc']);
      out += peaks(c, 136, 5, 40, 70, 231, '#6e7e92', { snow: '#dfe8f0', snowS: '#aebccc' });
      out += snowPineRow(c, 146, 14, 232, '#243e3a', 22, 38);
      var hill = 'M40,162 C60,120 100,86 150,70 C190,58 250,56 300,72 C350,88 380,120 410,150 L410,165 Z';
      out += rockFace(c, hill, '#5e6470', 233);
      out += CG(F('M60,130 C100,90 150,72 200,66 C250,62 300,74 340,96 C370,112 390,130 410,140 L410,120 C380,96 340,70 290,60 C240,50 180,54 140,66 C100,80 70,104 60,130 Z', SNOW, 0.95), c.clip(hill));
      var mx = 222, my = 162;
      out += P(D`M${mx - 58},${my} C${mx - 60},${my - 40} ${mx - 36},${my - 76} ${mx},${my - 78} C${mx + 36},${my - 76} ${mx + 60},${my - 40} ${mx + 58},${my} Z`, c.rg([[0, '#000000'], [0.6, '#05070a'], [1, '#1e2430']], 0.5, 0.8, 0.8), 2.6);
      out += S(D`M${mx - 56},${my - 20} C${mx - 54},${my - 52} ${mx - 30},${my - 74} ${mx},${my - 76} C${mx + 30},${my - 74} ${mx + 54},${my - 52} ${mx + 56},${my - 20}`, '#cfe4f4', 3, 0.7);
      // icicles hang from the arch's rim itself (#118): a straight row at one height stuck out past the rounded mouth at its
      // ends once v10.10.1 showed the whole scene; along the rim's upper part they hang straight down, shorter to the sides
      (function () {
        var bez = function (p0, p1, p2, p3, t) { var u = 1 - t; return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3; };
        var rim = function (t) { // t 0..1 across the whole rim, the two halves of the stroke drawn above
          return t < 0.5 ? [bez(mx - 56, mx - 54, mx - 30, mx, t * 2), bez(my - 20, my - 52, my - 74, my - 76, t * 2)]
            : [bez(mx, mx + 30, mx + 54, mx + 56, t * 2 - 1), bez(my - 76, my - 74, my - 52, my - 20, t * 2 - 1)];
        };
        var R_ = rnd(mx * 7 + my), n = 11;
        for (var i = 0; i < n; i++) {
          var t = 0.24 + 0.52 * i / (n - 1), p = rim(t), side = Math.abs(t - 0.5) / 0.26, l = 14 * (1 - 0.45 * side) * (0.75 + R_() * 0.5), w = 2.2;
          out += P(D`M${p[0] - w},${p[1] + 1} L${p[0] + w},${p[1] + 1} L${p[0] + 0.3},${p[1] + 1 + l} Z`, c.lg(['#ffffff', '#bfe8ff', '#7ac4ee']), 1.2);
        }
      })();
      out += C(mx - 14, my - 30, 2.2, '#ffd23a', 0, 0.9) + C(mx - 4, my - 30, 2.2, '#ffd23a', 0, 0.9);
      [[mx - 64, my - 2, 26, -10], [mx - 52, my, 16, 12], [mx + 60, my - 2, 24, 8], [mx + 72, my, 14, -14]].forEach(function (s) { out += iceShard(c, s[0], s[1], s[2], s[3]); });
      out += snowPineRow(c, 166, 2, 234, '#20382f', 50, 70, 1.8, -20, 50) + snowPineRow(c, 166, 2, 235, '#20382f', 50, 66, 1.8, 350, 430);
      out += snowGround(c, 160, 236, { cols: ['#e6eef4', '#c8d8e6', '#aec4d8'] });
      out += F('M170,164 C200,160 250,160 280,166 C300,186 290,210 250,220 C210,222 180,206 170,164 Z', '#9fb4c8', 0.5);
      out += boneG(c, 150, 184, 20, 1) + boneG(c, 290, 196, -25, 1.1) + boneG(c, 206, 206, 70, 0.9) + boneG(c, 100, 214, -8, 0.8);
      out += S('M250,178 C256,170 268,170 272,178 M254,178 C258,172 266,172 268,178 M258,178 C260,174 264,174 265,178', OL, 3.4) + S('M250,178 C256,170 268,170 272,178 M254,178 C258,172 266,172 268,178 M258,178 C260,174 264,174 265,178', '#ece4cc', 1.8);
      out += P('M322,212 C322,204 334,204 334,212 C334,215 332,216 331,218 L325,218 C324,216 322,215 322,212 Z', c.cel('#ece4cc'), 1.6) + E(325.5, 211.5, 1.6, 1.8, '#1a1009', 0) + E(330.5, 211.5, 1.6, 1.8, '#1a1009', 0);
      out += snowfall(c, 237, 30, 0.6);
      out += R(0, 0, 400, 240, c.rg([[0, '#000', 0], [0.6, '#000', 0.1], [1, '#0a1020', 0.5]], 0.5, 0.55, 0.75), 0);
      return out;
    },
    frostmane_hold: function (c) {
      var out = snowSky(c, ['#7898c0', '#b0c8e0', '#e4ecf4']);
      out += sunGlow(c, 320, 36, 9, '#f4f8ff');
      out += peaks(c, 138, 6, 50, 90, 241, '#8498b2', { snow: '#eef4fa', snowS: '#c0d2e2' });
      out += snowPineRow(c, 148, 18, 242, '#2a5046', 22, 38);
      var sd = '';
      for (var x = 4; x < 70; x += 9) sd += D`M${x},160 L${x + 1},${124 + (x % 3) * 5} `;
      out += S(sd, OL, 6.4) + S(sd, '#8a6a44', 3.8) + S('M2,140 L72,140', OL, 3.4) + S('M2,140 L72,140', '#6a4a2e', 1.8);
      for (x = 5; x < 70; x += 9) out += P(D`M${x - 2.4},${124 + (x % 3) * 5 + 2} L${x + 1},${118 + (x % 3) * 5} L${x + 3.6},${124 + (x % 3) * 5 + 2} Z`, SNOW, 1.2);
      out += hutG(c, 120, 158, 1.05, '#a88a68') + hutG(c, 300, 156, 1.2, '#98785a') + hutG(c, 214, 150, 0.7, '#b09878');
      out += totemG(c, 176, 162, 1.1, 1) + totemG(c, 372, 164, 0.9, 1);
      out += bannerG(c, 88, 164, 70, '#2f64b0') + bannerG(c, 252, 160, 60, '#2a58a0') + bannerG(c, 356, 166, 54, '#2f64b0');
      out += snowGround(c, 158, 243);
      out += F('M60,168 C140,160 280,160 360,172 C340,196 260,206 190,204 C120,202 70,190 60,168 Z', '#c4d2de', 0.7);
      out += fireG(c, 214, 190, 1.1);
      out += boneG(c, 150, 200, 30, 0.8) + boneG(c, 282, 208, -20, 0.8);
      out += snowfall(c, 244, 40) + coldLight(c);
      return out;
    },
    amberstill_ranch: function (c) {
      var out = snowSky(c, ['#80aad6', '#bcd6ec', '#eef4f8']);
      out += sunGlow(c, 300, 34, 11, '#fff8e8');
      out += peaks(c, 136, 5, 70, 110, 251, '#8ea2bc', { snow: '#f0f5fa', snowS: '#c4d4e4', cap: 0.5 });
      out += peaks(c, 146, 7, 25, 45, 252, '#7a8ca2', { snow: '#e8f0f6' });
      out += snowPineRow(c, 150, 14, 253, '#2f5a4c', 18, 30);
      /* barn */
      var bx = 214, by = 158;
      out += R(bx, by - 52, 104, 52, c.cel('#9a3e2c'), 2.2) + S(D`M${bx + 13},${by - 52} L${bx + 13},${by} M${bx + 26},${by - 52} L${bx + 26},${by} M${bx + 78},${by - 52} L${bx + 78},${by} M${bx + 91},${by - 52} L${bx + 91},${by}`, '#6a2618', 1.2, 0.8);
      out += P(D`M${bx + 34},${by} L${bx + 34},${by - 34} L${bx + 70},${by - 34} L${bx + 70},${by} Z`, c.cel('#7a2a1e'), 2) + S(D`M${bx + 34},${by - 34} L${bx + 70},${by} M${bx + 70},${by - 34} L${bx + 34},${by} M${bx + 52},${by - 34} L${bx + 52},${by}`, '#efe6d6', 2.2);
      out += P(D`M${bx - 8},${by - 50} L${bx + 22},${by - 84} L${bx + 82},${by - 84} L${bx + 112},${by - 50} Z`, c.cel('#5a5a62'), 2.2);
      out += P(D`M${bx - 10},${by - 49} L${bx + 22},${by - 86} L${bx + 82},${by - 86} L${bx + 114},${by - 49} L${bx + 104},${by - 46} L${bx + 80},${by - 76} L${bx + 24},${by - 76} L${bx},${by - 46} Z`, SNOW, 2) + F(D`M${bx + 6},${by - 56} L${bx + 26},${by - 78} L${bx + 78},${by - 78} L${bx + 98},${by - 56} Z`, SNOW, 0.85);
      out += R(bx + 44, by - 70, 16, 14, c.cel('#7a2a1e'), 1.8) + S(D`M${bx + 44},${by - 70} L${bx + 60},${by - 56} M${bx + 60},${by - 70} L${bx + 44},${by - 56}`, '#efe6d6', 1.4);
      /* stone farmhouse */
      var hs = D`M70,154 L70,116 L140,116 L140,154 Z`;
      out += P(hs, c.cel('#a09a92'), 2.2) + blocks(c, hs, 70, 116, 140, 154, 8, '#76706a') + warmWin(c, 82, 126, 12, 14) + warmWin(c, 116, 126, 12, 14) + P('M98,154 L98,132 L112,132 L112,154 Z', c.cel('#6a4428'), 1.8);
      out += P('M62,118 L105,88 L148,118 Z', c.cel('#6a5244'), 2.2) + P('M60,119 L105,86 L150,119 L144,122 L105,94 L66,122 Z', SNOW, 1.8) + F('M72,114 L105,92 L138,114 Z', SNOW, 0.85);
      out += R(124, 84, 10, 20, c.cel('#8a8280'), 1.8) + C(129, 78, 5, '#d8dce2', 0, 0.5) + C(134, 68, 7, '#e2e6ea', 0, 0.4);
      out += snowGround(c, 156, 254);
      /* hay bales + trough */
      [[350, 172, 13], [376, 176, 11]].forEach(function (b) {
        out += C(b[0], b[1], b[2], c.cel('#d8b050'), 2.2) + S(D`M${b[0]},${b[1]} m-2,0 a2,2 0 1 1 4,0 a4.5,4.5 0 1 1 -9,0 a7,7 0 1 1 14,0`, '#9a7424', 1.2, 0.8) +
          P(D`M${b[0] - b[2] * 0.8},${b[1] - b[2] * 0.5} Q${b[0]},${b[1] - b[2] * 1.35} ${b[0] + b[2] * 0.8},${b[1] - b[2] * 0.5} Q${b[0]},${b[1] - b[2] * 0.75} ${b[0] - b[2] * 0.8},${b[1] - b[2] * 0.5} Z`, SNOW, 1.2);
      });
      out += P('M150,176 L196,176 L192,188 L154,188 Z', c.cel('#7a5230'), 2) + F('M154,178 L192,178 L191,181 L155,181 Z', '#bfe0f4', 0.9);
      out += fence(c, -4, 404, 196, 18, '#8a6a44');
      var fs = '';
      for (var fx = -4; fx <= 404; fx += 22) fs += D`M${fx - 3},${178} Q${fx},${174.5} ${fx + 3},${178} `;
      out += S(fs, SNOW, 2.4) + S('M-8,182.5 L408,183.5 M-8,190 L408,190.5', SNOW, 1.6, 0.9);
      out += snowfall(c, 255, 26, 0.6) + coldLight(c);
      return out;
    },
    ironforge: function (c) {
      var out = R(0, 0, 400, 240, c.rg([[0, '#6a4428'], [0.45, '#3a2618'], [1, '#140c08']], 0.5, 0.45, 0.8), 0);
      /* far wall: dark arches and a balcony ring */
      var aw = '';
      for (var i = 0; i < 6; i++) { var ax = 20 + i * 72; aw += P(D`M${ax},${118} L${ax},${70} Q${ax + 26},${40} ${ax + 52},${70} L${ax + 52},${118} Z`, '#1a120c', 1.8); }
      out += aw + S('M-10,122 L410,122', OL, 5) + S('M-10,122 L410,122', '#6a5a4e', 3) + S('M-10,64 L410,64', OL, 4) + S('M-10,64 L410,64', '#5a4a3e', 2.2);
      out += S('M60,0 L60,40 M140,0 L140,30 M260,0 L260,34 M340,0 L340,44', '#2a2018', 2, 0.9);
      /* the Great Forge: molten stream pouring into a ring-walled basin */
      out += glowAt(c, 200, 110, 150, '#ff9a30', 0.55);
      out += P('M170,0 L230,0 L222,30 L178,30 Z', c.cel('#4a3a30'), 2.2) + P('M178,30 L222,30 L214,40 L186,40 Z', c.cel('#3a2c24'), 2);
      out += P('M192,40 C190,60 194,80 190,108 L210,108 C206,80 210,60 208,40 Z', c.lg(['#fff4b0', '#ffb030', '#ff6a10'], 0, 0, 1, 0), 1.6) + S('M199,44 C198,62 201,84 199,104', '#fffbe0', 2, 0.8);
      out += E(200, 118, 64, 16, c.rg([[0, '#fff4b0'], [0.5, '#ffa028'], [1, '#d8480a']]), 2.4);
      out += P('M132,118 C132,136 150,146 200,146 C250,146 268,136 268,118 C268,128 250,136 200,136 C150,136 132,128 132,118 Z', c.cel('#5a4a40'), 2.4);
      out += P('M126,114 L136,114 L140,146 L122,146 Z M264,114 L274,114 L278,146 L260,146 Z', c.cel('#6a5a4e'), 2);
      out += S('M150,134 L150,142 M175,137 L175,145 M200,138 L200,146 M225,137 L225,145 M250,134 L250,142', '#2a2018', 1.4, 0.8);
      /* huge pillars */
      out += dwarfPillar(c, 40, 20, 150, 34, '#6e6054', 1) + dwarfPillar(c, 360, 20, 150, 34, '#6e6054', 1) + dwarfPillar(c, 104, 50, 146, 20, '#5e5248', 0) + dwarfPillar(c, 296, 50, 146, 20, '#5e5248', 0);
      out += F('M57,24 L57,146 L52,146 L52,24 Z M343,24 L343,146 L348,146 L348,24 Z', '#ff9a40', 0.35);
      /* floor: stone tiles with glowing lava channels running out from the forge */
      out += P('M-10,148 L410,148 L410,245 L-10,245 Z', c.lg(['#5a4a3e', '#4a3c32', '#3a2e26']), 0);
      var tl = '';
      for (var y = 160; y < 245; y += 16) tl += D`M-10,${y} L410,${y} `;
      for (var k = -6; k <= 6; k++) tl += D`M${200 + k * 22},148 L${200 + k * 64},245 `;
      out += S(tl, '#2a2018', 1.2, 0.7);
      var lava = c.lg(['#fff0a0', '#ffa028', '#e0500a'], 0, 0, 1, 0);
      out += P('M150,146 L160,146 L60,245 L30,245 Z', lava, 1.8) + P('M240,146 L250,146 L370,245 L340,245 Z', lava, 1.8);
      out += glowAt(c, 90, 210, 60, '#ff8a20', 0.35) + glowAt(c, 320, 210, 60, '#ff8a20', 0.35);
      out += anvilG(c, 118, 170, 1.1) + anvilG(c, 290, 172, 1.1) + anvilG(c, 350, 200, 1.4);
      out += R(0, 0, 400, 240, c.rg([[0, '#ffb050', 0.25], [0.5, '#ff8a20', 0.08], [1, '#ff8a20', 0]], 0.5, 0.5, 0.7), 0);
      var R_ = rnd(261), em = '';
      for (i = 0; i < 26; i++) em += C(130 + R_() * 140, 20 + R_() * 110, 0.8 + R_() * 1.2, R_() > 0.5 ? '#ffd060' : '#ff8a20', 0, 0.85);
      out += em + R(0, 0, 400, 240, c.lg([[0, '#000', 0.35], [0.25, '#000', 0], [0.85, '#000', 0], [1, '#000', 0.3]]), 0);
      return out;
    }
  };

  /* ================= icons (64x64) ================= */
  function iconWrap(c, bg, glyph) {
    return R(0, 0, 64, 64, c.rg([[0, bg[0]], [1, bg[1]]], 0.42, 0.38, 0.75), 0) + glyph +
      R(0, 0, 64, 64, c.rg([[0.62, '#000', 0], [1, '#000', 0.5]], 0.5, 0.5, 0.72), 0) +
      '<rect x="1.5" y="1.5" width="61" height="61" fill="none" stroke="#0b0806" stroke-width="3"/>' +
      S('M3.8,60.2 L3.8,3.8 L60.2,3.8', '#ffffff', 1.6, 0.4) + S('M3.8,60.2 L60.2,60.2 L60.2,3.8', '#000000', 1.6, 0.55);
  }
  function flameD(cx, cy, s) {
    return D`M${cx},${cy - 22 * s} C${cx + 6 * s},${cy - 12 * s} ${cx + 14 * s},${cy - 6 * s} ${cx + 13 * s},${cy + 6 * s} C${cx + 12 * s},${cy + 15 * s} ${cx + 5 * s},${cy + 19 * s} ${cx},${cy + 19 * s} C${cx - 6 * s},${cy + 19 * s} ${cx - 13 * s},${cy + 14 * s} ${cx - 13 * s},${cy + 5 * s} C${cx - 13 * s},${cy - 4 * s} ${cx - 6 * s},${cy - 8 * s} ${cx - 4 * s},${cy - 15 * s} C${cx - 2 * s},${cy - 10 * s} ${cx},${cy - 10 * s} ${cx},${cy - 22 * s} Z`;
  }
  function flame(cx, cy, s) {
    return P(flameD(cx, cy, s), '#e03c14', 2) + F(flameD(cx, cy + 5 * s, s * 0.7), '#ff9a1f') + F(flameD(cx, cy + 9 * s, s * 0.42), '#ffe868');
  }
  function shard(c, x, y, a, s, col) {
    col = col || '#9fe0ff';
    return G(P('M0,-24 L7,-5 L0,22 L-7,-5 Z', c.lg([lt(col, 0.6), col, dk(col, 0.45)], 0, 0, 1, 0), 2) + F('M0,-24 L0,22 L-7,-5 Z', '#ffffff', 0.35) + S('M0,-20 L0,18', '#ffffff', 1, 0.6),
      'translate(' + x + ',' + y + ') rotate(' + a + ') scale(' + s + ')');
  }
  function iw(c, k, x, y, a, s) { return wpn(c, k, x, y, a, s); }
  function burst(c, x, y, ro, ri, n, cols) {
    return P(star(x, y, n, ro, ri), cols[0], 2) + F(star(x, y, n, ro * 0.68, ri * 0.7, 0.2), cols[1]) + F(star(x, y, n, ro * 0.38, ri * 0.4), cols[2]);
  }
  function fistG(c, x, y, s, col) {
    col = col || '#e8b890';
    return G(P('M-12,-8 C-12,-14 12,-14 13,-8 L14,8 C14,14 8,16 0,16 C-8,16 -13,12 -13,6 Z', c.cel(col), 2.2) +
      S('M-6,-12 L-6,-2 M0,-13 L0,-2 M6,-12 L6,-2', dk(col, 0.45), 1.4) + P('M-13,2 C-8,-2 2,-1 6,3 C4,7 -6,7 -13,6 Z', c.cel(lt(col, 0.1)), 1.8) +
      P('M-10,14 L10,14 L9,24 L-9,24 Z', c.cel('#6a4a2e'), 2), 'translate(' + x + ',' + y + ') scale(' + s + ')');
  }
  function sparkle(x, y, r, col) { return F(D`M${x},${y - r} Q${x + r * 0.15},${y - r * 0.15} ${x + r},${y} Q${x + r * 0.15},${y + r * 0.15} ${x},${y + r} Q${x - r * 0.15},${y + r * 0.15} ${x - r},${y} Q${x - r * 0.15},${y - r * 0.15} ${x},${y - r} Z`, col); }
  function rays(x, y, n, r0, r1_, col, w, o) {
    var d = '';
    for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2; d += D`M${x + Math.cos(a) * r0},${y + Math.sin(a) * r0} L${x + Math.cos(a) * r1_},${y + Math.sin(a) * r1_}`; }
    return S(d, col, w, o);
  }
  var ITEM_BG = ['#3a3440', '#0e0c12'];
  var ICONS = {
    attack: function (c) { return iconWrap(c, ['#9a4a2a', '#2a0d08'], iw(c, 'sword', 20, 46, 45, 0.85) + iw(c, 'sword', 44, 46, -45, 0.85)); },
    heroic_strike: function (c) { return iconWrap(c, ['#c8642a', '#3a0e04'], burst(c, 44, 20, 16, 7, 9, ['#ff9a2a', '#ffd060', '#fff6c0']) + iw(c, 'sword', 20, 46, 45, 1)); },
    battle_shout: function (c) {
      return iconWrap(c, ['#b0402a', '#3a0e08'], S('M44,12 A12,12 0 0 1 56,26 M46,6 A20,20 0 0 1 62,26', '#ffe0a0', 2.2, 0.85) +
        P('M10,48 C16,50 30,48 40,32 C43,27 45,22 46,16 L54,22 C52,28 48,34 44,40 C36,52 20,58 10,54 Z', c.cel('#efe3c4'), 2.2) +
        S('M20,51 L22,57 M30,46 L34,52 M38,36 L43,41', '#b88a3a', 3) + P('M46,16 L54,22 L58,14 L50,10 Z', c.cel(GOLD), 2) + P('M6,46 L12,47 L12,56 L6,55 Z', c.cel(GOLD), 1.8));
    },
    charge: function (c) {
      return iconWrap(c, ['#c86a2a', '#401406'], S('M6,20 L22,20 M4,32 L20,32 M6,44 L22,44', '#ffe0a0', 2.4, 0.7) +
        P('M24,14 L50,32 L24,50 L30,32 Z', c.lg(['#fff2c0', '#ffb040', '#c8501a']), 2.2) + P('M38,20 L58,32 L38,44 L42,32 Z', c.lg(['#fff8e0', '#ffc860']), 2));
    },
    rend: function (c) {
      var sl = function (x) { return P(D`M${x},10 C${x + 10},22 ${x + 16},38 ${x + 18},56 C${x + 12},40 ${x + 6},24 ${x},10 Z`, '#fff0e8', 1.8); };
      return iconWrap(c, ['#8a1a1a', '#200404'], sl(12) + sl(24) + sl(36) + P('M18,46 C16,50 16,53 18.5,53 C21,53 21,50 18,46 Z', '#d8141a', 1.2) + P('M44,50 C42,54 42,57 44.5,57 C47,57 47,54 44,50 Z', '#d8141a', 1.2) + P('M30,52 C28.5,55 28.5,57 30.5,57 C32.5,57 32.5,55 30,52 Z', '#d8141a', 1.2));
    },
    thunder_clap: function (c) {
      return iconWrap(c, ['#3a6ab0', '#0a1430'], E(32, 52, 26, 7, 'none', 0) + S('M8,52 A24,7 0 0 0 56,52 A24,7 0 0 0 8,52', '#bfe8ff', 2.2, 0.8) + S('M16,54 A16,4 0 0 0 48,54 A16,4 0 0 0 16,54', '#ffffff', 1.6, 0.7) +
        P('M36,4 L18,30 L29,30 L22,54 L46,22 L34,22 L42,4 Z', c.lg(['#ffffff', '#fff6a0', '#ffd040']), 2.2) + rays(32, 52, 10, 8, 14, '#dff4ff', 1.6, 0.7));
    },
    fireball: function (c) { return iconWrap(c, ['#d06a1a', '#3a0a00'], G(flame(0, 0, 1.15), 'translate(36,28) rotate(-135)') + C(40, 24, 7, c.rg([[0, '#ffffff'], [0.5, '#fff0a0'], [1, '#ffb040', 0]]), 0)); },
    frost_armor: function (c) {
      return iconWrap(c, ['#4a8ad0', '#0a1a38'], P('M14,14 L24,10 Q32,16 40,10 L50,14 L52,26 L46,30 L46,52 Q32,58 18,52 L18,30 L12,26 Z', c.lg(['#e8fbff', '#9fe0ff', '#3a8ac8']), 2.2) +
        S('M32,18 L32,52 M22,30 L42,30 M22,42 L42,42', '#ffffff', 1.4, 0.7) + shard(c, 12, 12, -40, 0.35) + shard(c, 52, 12, 40, 0.35) + sparkle(46, 46, 5, '#ffffff'));
    },
    frostbolt: function (c) { return iconWrap(c, ['#2a5aa0', '#050e24'], S('M8,56 L22,42 M14,58 L26,46 M6,48 L18,38', '#bfefff', 2, 0.6) + shard(c, 34, 30, 45, 1.05) + sparkle(14, 18, 5, '#e8fbff') + sparkle(50, 50, 4, '#e8fbff')); },
    fire_blast: function (c) { return iconWrap(c, ['#e07a20', '#3a0800'], burst(c, 32, 32, 27, 12, 10, ['#e8401a', '#ff9a2a', '#fff2a0'])); },
    arcane_missiles: function (c) {
      var m = function (x, y) { return S(D`M${x - 16},${y + 16} L${x},${y}`, '#e8a0ff', 4, 0.45) + S(D`M${x - 10},${y + 10} L${x},${y}`, '#ffffff', 1.6, 0.7) + C(x, y, 6.5, c.rg([[0, '#ffffff'], [0.5, '#f0a8ff'], [1, '#a040e0']]), 1.8); };
      return iconWrap(c, ['#8a4ad0', '#1a0838'], m(46, 16) + m(30, 30) + m(50, 40) + sparkle(16, 16, 4, '#ffe0ff'));
    },
    smite: function (c) {
      return iconWrap(c, ['#e8c05a', '#5a3a08'], rays(32, 34, 16, 10, 30, '#fff8d0', 2, 0.75) + C(32, 34, 14, c.rg([[0, '#ffffff'], [0.5, '#fff2a0'], [1, '#ffd040', 0]]), 0) +
        P('M28,2 L36,2 L34,30 L30,30 Z', c.lg(['#ffffff', '#fff2b0'], 0, 0, 1, 0), 1.8) + P(star(32, 36, 4, 12, 4), '#ffffff', 1.6));
    },
    lesser_heal: function (c) {
      return iconWrap(c, ['#8ac860', '#12300a'], C(32, 32, 22, c.rg([[0, '#fffbe0', 0.9], [0.5, '#ffe68a', 0.5], [1, '#ffe68a', 0]]), 0) +
        P('M26,10 L38,10 L38,26 L54,26 L54,38 L38,38 L38,54 L26,54 L26,38 L10,38 L10,26 L26,26 Z', c.lg(['#ffffff', '#fff2a8', '#e8c04a']), 2.2) + sparkle(50, 14, 5, '#ffffff') + sparkle(14, 50, 4, '#ffffff'));
    },
    pw_fortitude: function (c) {
      return iconWrap(c, ['#e8d9a8', '#5a4a20'], C(32, 32, 24, c.rg([[0, '#ffffff', 0.8], [1, '#ffffff', 0]]), 0) +
        P('M32,54 C10,40 8,24 18,16 C24,12 30,15 32,21 C34,15 40,12 46,16 C56,24 54,40 32,54 Z', c.lg(['#ff8a7a', '#e0302a', '#8a0a14']), 2.4) + F('M20,22 C22,17 27,17 28,21 C25,20 22,21 20,25 Z', '#ffffff', 0.7) + sparkle(50, 12, 5, '#fffbe0'));
    },
    sw_pain: function (c) {
      return iconWrap(c, ['#5a2a7a', '#0e0418'], S('M32,32 m-18,0 a18,18 0 1 1 18,18 a13,13 0 1 1 -13,-13 a8,8 0 1 1 8,8', '#c070ff', 3.5, 0.9) + S('M32,32 m-18,0 a18,18 0 1 1 18,18 a13,13 0 1 1 -13,-13 a8,8 0 1 1 8,8', '#2a0a3a', 1.2, 0.8) +
        P('M40,8 L34,26 L42,28 L28,58 L32,34 L24,32 Z', c.lg(['#f0c0ff', '#9a30d8']), 1.8));
    },
    pw_shield: function (c) {
      return iconWrap(c, ['#6aa0e0', '#0c1e40'], C(32, 32, 24, c.rg([[0, '#ffffff', 0], [0.75, '#fff8d0', 0.2], [0.92, '#fff8d0', 0.85], [1, '#fff8d0', 0]]), 0) +
        G(shield(c, '#f4e6b0', GOLD), 'translate(32,30) scale(1.35)') + S('M16,20 A18,18 0 0 1 28,12', '#ffffff', 2.4, 0.8));
    },
    renew: function (c) {
      return iconWrap(c, ['#6ac070', '#0a2a10'], S('M14,32 A18,18 0 0 1 46,20', '#fff4b0', 5) + P('M42,12 L52,22 L40,26 Z', '#fff4b0', 1.6) + S('M50,32 A18,18 0 0 1 18,44', '#c8ff90', 5) + P('M22,52 L12,42 L24,38 Z', '#c8ff90', 1.6) +
        P('M32,24 C40,24 42,34 32,42 C22,34 24,24 32,24 Z', c.lg(['#e8ffc0', '#6ad040']), 1.8) + S('M32,26 L32,40', '#2a7a1a', 1.2));
    },
    sinister_strike: function (c) { return iconWrap(c, ['#7a2a2a', '#1a0606'], S('M10,44 C20,20 40,12 56,12', '#ffb0a0', 5, 0.55) + S('M12,42 C22,22 40,14 54,14', '#ffffff', 1.6, 0.9) + iw(c, 'dagger', 24, 44, 40, 1.3)); },
    eviscerate: function (c) {
      return iconWrap(c, ['#8a1a1a', '#200404'], P('M5,14 C26,18 44,32 59,54 C40,44 22,34 5,26 Z', '#fff0ea', 2) + P('M6,52 C22,40 40,24 58,10 C46,28 30,46 12,58 Z', '#fff0ea', 2) + F('M8,19 C26,22 40,32 52,46 C38,38 24,30 8,24 Z', '#e0141c', 0.55) +
        P('M22,8 C20,12 20,15 22.5,15 C25,15 25,12 22,8 Z M46,54 C44,58 44,61 46.5,61 C49,61 49,58 46,54 Z M36,30 C34,34 34,37 36.5,37 C39,37 39,34 36,30 Z', '#e0141c', 1.2));
    },
    gouge: function (c) { return iconWrap(c, ['#6a6a3a', '#1a1a08'], burst(c, 42, 20, 14, 6, 8, ['#ffd040', '#fff0a0', '#ffffff']) + G(fistG(c, 0, 0, 1.05), 'translate(28,34) rotate(35)')); },
    evasion: function (c) {
      return iconWrap(c, ['#3a6a3a', '#081208'], S('M14,48 C8,30 20,12 40,12', '#e8ff90', 4, 0.5) + S('M20,52 C14,34 26,18 44,18', '#e8ff90', 4, 0.7) + S('M26,56 C20,40 32,24 50,24', '#ffffff', 4) + P('M46,16 L56,24 L46,32 Z', '#ffffff', 1.8) +
        G(P('M0,-10 C6,-10 8,-4 6,2 L2,12 L-4,12 L-6,2 C-8,-4 -6,-10 0,-10 Z', '#2a2a30', 1.6), 'translate(30,40) rotate(-20)', 0.8));
    },
    slice_and_dice: function (c) { return iconWrap(c, ['#8a7a2a', '#1a1606'], S('M32,32 m-22,0 a22,22 0 1 1 22,22', '#fff569', 3, 0.7) + P('M28,54 L34,48 L36,58 Z', '#fff569', 1.2) + iw(c, 'dagger', 22, 42, 40, 1.15) + iw(c, 'dagger', 42, 42, -40, 1.15)); },
    eat: function (c) {
      return iconWrap(c, ['#8a5a2a', '#1a0e04'], P('M38,40 L50,52', 'none', 0) + S('M36,38 L50,52', OL, 7.5) + S('M36,38 L50,52', '#f4ecd6', 4.5) + C(52, 50, 4.5, '#f4ecd6', 2) + C(48, 55, 4.5, '#f4ecd6', 2) +
        P('M16,44 C6,34 12,14 28,12 C44,10 50,26 42,38 C38,44 30,48 24,48 Z', c.cel('#b8562e'), 2.4) + F('M18,24 C22,16 30,15 34,17 C28,18 22,22 20,28 Z', '#ffd0a0', 0.7));
    },
    drink: function (c) {
      return iconWrap(c, ['#2a6a9a', '#06121e'], P('M18,16 L46,16 L42,52 C40,56 24,56 22,52 Z', c.lg(['#e8f4ff', '#b8d0e0', '#7a98b0'], 0, 0, 1, 0), 2.2) +
        CG(F('M16,28 L48,28 L48,60 L16,60 Z', c.lg(['#8fe0ff', '#2a7ac8']), 0.9), c.clip('M18,16 L46,16 L42,52 C40,56 24,56 22,52 Z')) + S('M22,20 L25,48', '#ffffff', 2, 0.6) + E(32, 16, 14, 3, 'none', 1.8));
    },
    taunt: function (c) {
      return iconWrap(c, ['#d0502a', '#3a0a04'], S('M44,14 A10,10 0 0 1 54,24 M46,8 A18,18 0 0 1 60,24', '#ffe0a0', 2.2, 0.8) +
        P('M14,18 C14,8 38,6 42,16 L46,28 L40,30 L40,40 C40,48 34,52 26,52 C18,52 12,46 12,36 Z', c.cel('#c8342a'), 2.4) +
        P('M22,22 L32,26 L22,28 Z M34,22 L42,24 L36,28 Z', '#fff2a0', 1.4) + P('M24,38 C28,34 38,34 42,38 C38,46 28,46 24,38 Z', '#2a0806', 1.8) + F('M27,38 L39,38 L37,40 L29,40 Z', '#ffffff'));
    },
    // items
    sword: function (c) { return iconWrap(c, ITEM_BG, iw(c, 'sword', 20, 46, 45, 1.05)); },
    dagger: function (c) { return iconWrap(c, ITEM_BG, iw(c, 'dagger', 24, 42, 45, 1.5)); },
    mace: function (c) { return iconWrap(c, ITEM_BG, iw(c, 'mace', 24, 42, 40, 1.45)); },
    staff: function (c) { return iconWrap(c, ITEM_BG, S('M12,58 L44,20', OL, 8.5) + S('M12,58 L44,20', WOOD, 5) + S('M12,58 L44,20', lt(WOOD, 0.3), 1.5, 0.6) + S('M24,44 L28,48 M29,38 L33,42', GOLD, 2.4) + C(47, 17, 13, c.rg([[0, '#d8f8ff', 0.95], [0.45, '#69ccf0', 0.5], [1, '#69ccf0', 0]]), 0) + P('M38,24 C34,16 38,8 44,6 L45,12 L50,14 L56,10 C58,16 54,24 46,26 Z', c.cel(GOLD), 2) + C(47, 17, 6, c.rg([[0, '#ffffff'], [0.4, '#9ae8ff'], [1, '#2a6fb8']], 0.38, 0.35, 0.7), 2)); },
    wand: function (c) { return iconWrap(c, ITEM_BG, S('M14,52 L40,26', OL, 7.5) + S('M14,52 L40,26', '#6a3fa0', 4.2) + S('M20,46 L23,49 M32,34 L35,37', GOLD, 2.6) + C(44, 22, 14, c.rg([[0, '#ffe0ff', 0.9], [1, '#c070ff', 0]]), 0) + P(star(44, 22, 4, 9, 3.2), '#f6d8ff', 1.6) + sparkle(22, 20, 4, '#f6d8ff') + sparkle(50, 44, 3, '#f6d8ff')); },
    axe: function (c) { return iconWrap(c, ITEM_BG, iw(c, 'axe', 24, 46, 30, 1.2)); },
    chest_cloth: function (c) { return iconWrap(c, ITEM_BG, chestG(c, '#5b3fa6', GOLD, 'cloth')); },
    chest_leather: function (c) { return iconWrap(c, ITEM_BG, chestG(c, '#7a5232', '#c9a060', 'leather')); },
    chest_mail: function (c) { return iconWrap(c, ITEM_BG, chestG(c, '#a2abb5', '#56606b', 'mail')); },
    legs: function (c) { return iconWrap(c, ITEM_BG, P('M18,10 L46,10 L50,56 L36,56 L32,26 L28,56 L14,56 Z', c.cel('#9a7a50'), 2.2) + P('M17,10 L47,10 L47,16 L17,16 Z', '#3a2a1e', 2) + S('M22,20 L20,50 M42,20 L44,50', '#3a2a1e', 1.2, 0.7)); },
    boots: function (c) { return iconWrap(c, ITEM_BG, P('M20,8 L36,8 L36,38 C44,40 54,44 54,52 L54,56 L18,56 L18,40 Z', c.cel('#6a4428'), 2.4) + P('M18,8 L38,8 L38,16 L18,16 Z', c.cel('#8a6038'), 2) + P('M18,52 L54,52 L54,57 L18,57 Z', '#2a1a10', 1.8)); },
    gloves: function (c) { return iconWrap(c, ITEM_BG, P('M18,56 L18,40 C14,36 10,30 12,26 C14,24 18,28 20,32 L20,14 C20,10 25,10 25,14 L25,28 L26,10 C26,6 31,6 31,10 L31,28 L32,12 C32,8 37,8 37,12 L37,30 L38,16 C38,12 43,12 43,16 L43,42 C43,48 40,52 40,56 Z', c.cel('#7a5232'), 2.2) + P('M16,48 L42,48 L42,58 L16,58 Z', c.cel('#5a3a22'), 2)); },
    cloak: function (c) { return iconWrap(c, ITEM_BG, P('M24,8 L40,8 C44,20 52,40 54,58 C44,54 38,58 32,54 C26,58 20,54 10,58 C12,40 20,20 24,8 Z', c.cel('#2f6a3a'), 2.2) + S('M28,14 C26,30 22,44 20,54 M36,14 C38,30 42,44 44,54', '#1a3a20', 1.4, 0.8) + C(32, 10, 3.5, GOLD, 1.6)); },
    belt: function (c) { return iconWrap(c, ITEM_BG, P('M6,26 C20,22 44,22 58,26 L58,38 C44,34 20,34 6,38 Z', c.cel('#6a4428'), 2.2) + R(24, 22, 16, 18, 'none', 0) + '<rect x="24" y="22" width="16" height="18" rx="2" fill="none" stroke="#1a1009" stroke-width="5.5"/><rect x="24" y="22" width="16" height="18" rx="2" fill="none" stroke="' + GOLD + '" stroke-width="3"/>' + S('M32,26 L32,36', '#c9ced6', 2)); },
    bracers: function (c) {
      var b = function (x, y, a) { return G(P('M-12,-18 C-4,-22 8,-21 13,-16 L11,18 C6,14 -6,14 -11,18 Z', c.cel('#7a5232'), 2.2) + S('M-12,-10 C-4,-13 6,-13 12,-9 M-11,8 C-4,5 5,5 11,8', '#c9a060', 1.8) + C(0, -1, 3.2, c.cel(GOLD), 1.4) + C(-7, -1, 1.4, '#e8d8a0', 0) + C(7, -1, 1.4, '#e8d8a0', 0) + S('M-12,-18 C-4,-22 8,-21 13,-16', lt('#7a5232', 0.4), 1.2, 0.8), 'translate(' + x + ',' + y + ') rotate(' + a + ')'); };
      return iconWrap(c, ITEM_BG, b(24, 30, -18) + b(40, 36, 14));
    },
    ring: function (c) { return iconWrap(c, ITEM_BG, '<ellipse cx="32" cy="38" rx="15" ry="13" fill="none" stroke="#1a1009" stroke-width="9"/><ellipse cx="32" cy="38" rx="15" ry="13" fill="none" stroke="' + GOLD + '" stroke-width="5"/>' + S('M20,32 A14,12 0 0 1 30,25', '#fff2b0', 1.6) + P('M24,20 L32,10 L40,20 L32,28 Z', c.lg(['#b0ffc0', '#1eff00', '#0a7a10']), 2) + F('M28,19 L32,13 L33,19 Z', '#ffffff', 0.7)); },
    bread: function (c) { return iconWrap(c, ITEM_BG, P('M8,40 C8,24 24,16 34,16 C48,16 58,26 56,38 C54,46 46,48 32,48 C18,48 8,48 8,40 Z', c.cel('#c88a3a'), 2.4) + S('M20,24 L26,34 M30,20 L36,32 M40,20 L46,32', '#8a5a1a', 2) + F('M14,32 C18,24 26,20 32,20 C24,24 20,28 18,34 Z', '#ffe0a0', 0.6)); },
    water: function (c) { return iconWrap(c, ITEM_BG, P('M26,8 L38,8 L38,18 C48,22 52,30 52,40 C52,52 44,58 32,58 C20,58 12,52 12,40 C12,30 16,22 26,18 Z', c.lg(['#e8f4ff', '#b8d0e0', '#7a98b0'], 0, 0, 1, 0), 2.2) + CG(F('M8,34 L56,34 L56,60 L8,60 Z', c.lg(['#8fe0ff', '#2a6ac8']), 0.9), c.clip('M26,8 L38,8 L38,18 C48,22 52,30 52,40 C52,52 44,58 32,58 C20,58 12,52 12,40 C12,30 16,22 26,18 Z')) + R(24, 4, 16, 6, c.cel('#8a6038'), 1.8) + S('M18,36 C18,44 22,50 26,52', '#ffffff', 2, 0.6)); },
    meat: function (c) { return iconWrap(c, ITEM_BG, S('M38,40 L50,52', OL, 7.5) + S('M38,40 L50,52', '#f4ecd6', 4.5) + C(52, 50, 4.5, '#f4ecd6', 2) + C(48, 55, 4.5, '#f4ecd6', 2) + P('M16,44 C6,34 12,14 28,12 C44,10 50,26 42,38 C38,44 30,48 24,48 Z', c.cel('#c0443a'), 2.4) + P('M20,36 C16,28 20,20 28,20 C36,20 38,28 34,34 C30,38 24,40 20,36 Z', '#e88070', 1.4) + F('M24,30 C24,26 28,24 30,26 C28,27 26,28 26,31 Z', '#fff0e8', 0.8)); },
    candle: function (c) { return iconWrap(c, ITEM_BG, C(32, 18, 16, c.rg([[0, '#fff2b0', 0.8], [1, '#ffb040', 0]]), 0) + E(32, 54, 13, 4, c.cel('#e8dcb0'), 2) + P('M25,54 L25,26 L39,26 L39,54 Z', c.cel('#f3e8c4'), 2.2) + F('M26,28 L29,28 L29,40 C27,41 26,38 26,36 Z', '#fffaf0') + S('M32,26 L32,22', OL, 1.6) + P('M32,6 C37,13 39,17 37,21 C36,24 28,24 27,21 C25,17 28,12 32,6 Z', '#ff8a1e', 1.6) + F('M32,12 C34.5,15.5 35,18 34,20 C33,22 31,22 30,20 C29,18 30,15.5 32,12 Z', '#fff07a')); },
    bandana: function (c) { return iconWrap(c, ITEM_BG, P('M8,20 C20,16 44,16 56,20 L34,52 C33,54 31,54 30,52 Z', c.cel('#7a7e83'), 2.2) + P('M8,20 L2,30 L10,28 Z M56,20 L62,30 L54,28 Z', '#55595e', 1.6) + C(24, 26, 1.8, '#f4ecd8', 0) + C(36, 24, 1.8, '#f4ecd8', 0) + C(30, 34, 1.8, '#f4ecd8', 0) + C(42, 30, 1.8, '#f4ecd8', 0) + C(34, 42, 1.8, '#f4ecd8', 0)); },
    fin: function (c) { return iconWrap(c, ITEM_BG, P('M12,52 C14,34 22,16 36,8 C38,18 46,24 56,26 C50,36 46,46 44,54 Z', c.cel('#3f9c96'), 2.2) + S('M16,50 L34,12 M22,52 L42,20 M30,53 L50,28 M38,54 L54,30', dk('#3f9c96', 0.4), 1.4) + P('M10,50 L46,52 L46,58 L10,56 Z', c.cel('#e07a4a'), 2)); },
    dust: function (c) { return iconWrap(c, ITEM_BG, P('M8,54 C12,40 22,32 32,32 C42,32 52,40 56,54 Z', c.cel('#9a8ab0'), 2.2) + C(24, 44, 1.5, '#ffffff', 0) + C(36, 40, 1.3, '#ffffff', 0) + C(44, 48, 1.5, '#ffffff', 0) + sparkle(20, 22, 5, '#e8d8ff') + sparkle(42, 16, 6, '#ffffff') + sparkle(50, 30, 3.5, '#e8d8ff') + C(32, 26, 1.4, '#e8d8ff', 0)); },
    head: function (c) { return iconWrap(c, ITEM_BG, P('M12,40 C10,20 22,10 32,10 C42,10 54,20 52,40 L52,52 L40,52 L38,40 L26,40 L24,52 L12,52 Z', c.lg(STEEL, 0.2, 0, 0.8, 1), 2.4) + P('M29,12 L35,12 L35,48 L29,48 Z', c.cel(GOLD), 1.8) + S('M16,30 C20,20 26,16 30,15', '#ffffff', 1.6, 0.7) + R(18, 32, 9, 4, '#1a1a22', 1.2) + R(37, 32, 9, 4, '#1a1a22', 1.2)); },
    claw: function (c) { return iconWrap(c, ITEM_BG, P('M16,58 C12,46 16,34 26,30 L40,30 C48,34 52,46 48,58 Z', c.cel('#8e5c38'), 2.2) + P('M20,34 C14,24 14,14 20,6 C22,16 26,24 28,31 Z', '#f0e8d0', 1.8) + P('M30,30 C28,20 30,10 36,4 C36,14 38,22 38,30 Z', '#f0e8d0', 1.8) + P('M40,32 C42,24 46,16 54,12 C50,20 48,28 46,34 Z', '#f0e8d0', 1.8)); },
    armband: function (c) { return iconWrap(c, ITEM_BG, '<ellipse cx="32" cy="34" rx="20" ry="12" fill="none" stroke="#1a1009" stroke-width="13"/><ellipse cx="32" cy="34" rx="20" ry="12" fill="none" stroke="#7a7e83" stroke-width="8.5"/>' + S('M16,28 A20,12 0 0 1 36,22', '#c8ccd0', 2, 0.7) + P('M44,40 L54,54 L48,54 L44,46 L40,56 L36,52 Z', c.cel('#55595e'), 1.8)); },
    grapes: function (c) {
      var g = '';
      [[26, 22], [36, 22], [46, 24], [22, 32], [32, 32], [42, 34], [28, 42], [38, 43], [33, 52]].forEach(function (p) { g += C(p[0], p[1], 6.2, c.rg([[0, '#c890e8'], [0.6, '#7a2a9a'], [1, '#3a0a4a']], 0.35, 0.35, 0.7), 1.8); });
      return iconWrap(c, ITEM_BG, P('M34,14 C40,4 52,4 58,10 C50,10 44,14 40,18 Z', c.cel('#5aa040'), 1.8) + S('M34,16 L32,8', '#6a4a2e', 2.4) + g);
    },
    pelt: function (c) { return iconWrap(c, ITEM_BG, P('M12,16 L20,10 L26,16 L38,16 L44,10 L52,16 C54,28 50,34 54,44 L48,56 L40,50 L32,58 L24,50 L16,56 L10,44 C14,34 10,28 12,16 Z', c.cel('#8c7d6c'), 2.2) + F('M22,24 C28,30 36,30 42,24 L42,44 C36,48 28,48 22,44 Z', '#b8aa94', 0.7) + S('M20,20 l3,4 M40,20 l3,4 M24,36 l3,3 M36,38 l3,3', '#4a3e32', 1.3)); },
    coin: function (c) {
      var coin = function (x, y) { return E(x, y + 3, 14, 5, c.cel(dk(GOLD, 0.25)), 2) + E(x, y, 14, 5, c.lg(['#fff2a0', GOLD, '#a8781e'], 0, 0, 1, 0), 2); };
      return iconWrap(c, ITEM_BG, coin(26, 50) + coin(26, 44) + coin(26, 38) + coin(40, 52) + coin(40, 46) + G(C(0, 0, 13, c.lg(['#fff2a0', GOLD, '#a8781e'], 0.2, 0, 0.8, 1), 2.2) + '<circle cx="0" cy="0" r="9" fill="none" stroke="#a8781e" stroke-width="1.6"/>' + sparkle(0, 0, 5, '#fff8d0'), 'translate(42,24)'));
    },
    chest_box: function (c) {
      return iconWrap(c, ITEM_BG, C(32, 34, 24, c.rg([[0, '#ffe08a', 0.5], [1, '#ffe08a', 0]]), 0) + P('M8,30 L56,30 L54,56 L10,56 Z', c.cel('#8a5a30'), 2.4) + P('M8,30 C8,16 20,12 32,12 C44,12 56,16 56,30 Z', c.cel('#9a6838'), 2.4) +
        S('M18,14 L18,56 M46,14 L46,56 M8,30 L56,30', OL, 5) + S('M18,14 L18,56 M46,14 L46,56 M8,30 L56,30', GOLD, 3) + R(28, 28, 8, 10, c.cel(GOLD), 1.8) + C(32, 33, 1.4, OL, 0));
    },
    /* waystone: a rough grey field stone with one carved rune glowing pale blue-white */
    hearthstone: function (c) {
      var st = 'M16,18 L28,10 L42,12 L52,22 L54,38 L48,52 L34,57 L20,54 L11,43 L10,28 Z';
      var rune = 'M32,20 L32,48 M32,28 L24,21 M32,28 L40,21 M26,40 L32,34 L38,40';
      return iconWrap(c, ['#4a5058', '#101216'], P(st, c.cel('#8a8c8e'), 2.4) +
        CG(F('M16,18 L28,10 L42,12 L34,22 L20,26 Z', '#ffffff', 0.22) + F('M48,52 L54,38 L52,22 L44,30 L42,48 Z', '#000', 0.2) +
          S('M20,26 L34,22 L44,30 M42,48 L44,30 M20,26 L18,44', '#5a5c5e', 1.1, 0.7) + C(22, 48, 1.4, '#6a6c6e', 0, 0.8) + C(46, 18, 1.2, '#6a6c6e', 0, 0.8) +
          C(32, 34, 17, c.rg([[0, '#eaf6ff', 0.75], [0.5, '#a8d8f8', 0.3], [1, '#a8d8f8', 0]]), 0), c.clip(st)) +
        S(rune, '#2a2c30', 5.4) + S(rune, '#bfe6ff', 3) + S(rune, '#ffffff', 1.2));
    }
  };
  /* ---- paladin / warlock / pet icons ---- */
  function skullG(c, x, y, s, col, eye) {
    var d = 'M-13,-2 C-14,-16 -6,-20 0,-20 C6,-20 14,-16 13,-2 C13,4 10,6 9,8 L9,13 L-9,13 L-9,8 C-10,6 -13,4 -13,-2 Z';
    return G(P(d, c.cel(col), 2.2) + F('M-11,-6 C-11,-15 -5,-18 0,-18 C-6,-15 -9,-10 -9,-4 Z', '#ffffff', 0.35) +
      E(-5.5, -2, 4.2, 4.6, '#140a14', 1.2) + E(5.5, -2, 4.2, 4.6, '#140a14', 1.2) +
      (eye ? C(-5.5, -1.6, 2, eye, 0) + C(5.5, -1.6, 2, eye, 0) : '') +
      P('M0,3 L-2.4,7.5 L2.4,7.5 Z', '#140a14', 1) + S('M-4.5,9.5 L-4.5,13 M0,9.5 L0,13 M4.5,9.5 L4.5,13', OL, 1.2),
      'translate(' + x + ',' + y + ') scale(' + s + ')');
  }
  function goldHammer(c, steel) {
    var hd = steel ? c.lg(STEEL, 0, 0, 1, 0) : c.lg(['#fff4b8', '#f2c440', '#a8741a'], 0, 0, 1, 0);
    return P('M-2.6,16 L-3,-24 L3,-24 L2.6,16 Z', c.cel(WOOD), 2.2) + S('M-3,6 L3,8 M-3,11 L3,13', GOLD, 1.6) +
      P('M-15,-40 L15,-40 L16,-22 L-16,-22 Z', hd, 2.6) + P('M-4.5,-41 L4.5,-41 L4.5,-21 L-4.5,-21 Z', steel ? c.cel(GOLD) : c.cel('#fff2b0'), 2) +
      S('M-13,-37 L-2,-37', '#ffffff', 1.4, 0.7) + C(0, 18, 3.2, c.cel(GOLD), 1.8);
  }
  function darkFlame(cx, cy, s, cols) {
    return P(flameD(cx, cy, s), cols[0], 2) + F(flameD(cx, cy + 5 * s, s * 0.7), cols[1]) + F(flameD(cx, cy + 9 * s, s * 0.42), cols[2]);
  }
  function ring2(cx, cy, rx, ry, col, w) {
    return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="none" stroke="' + OL + '" stroke-width="' + (w + 2.6) + '"/>' +
      '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="none" stroke="' + col + '" stroke-width="' + w + '"/>';
  }
  var ICONS2 = {
    seal_righteousness: function (c) {
      var dots = '';
      for (var i = 0; i < 8; i++) { var a = i / 8 * Math.PI * 2 + Math.PI / 8; dots += C(32 + Math.cos(a) * 17, 32 + Math.sin(a) * 17, 1.6, '#7a4a0a', 0); }
      return iconWrap(c, ['#d8a83a', '#3a2404'], C(32, 32, 30, c.rg([[0, '#fffbe0', 0.9], [0.5, '#ffe68a', 0.35], [1, '#ffe68a', 0]]), 0) +
        rays(32, 32, 12, 22, 30, '#fff6c8', 2.2, 0.75) +
        C(32, 32, 20, c.lg(['#fff4b8', '#f2c440', '#a8741a'], 0.2, 0, 0.8, 1), 2.6) + ring2(32, 32, 17, 17, '#fff2b0', 1.6) + dots +
        P(sunD(32, 32, 12), c.lg(['#ffffff', '#fff2b0', '#e8b030'], 0.2, 0, 0.8, 1), 1.8) + C(32, 32, 4.5, '#ffffff', 1.4));
    },
    holy_light: function (c) {
      var hand = 'M22,58 L22,42 C18,38 13,33 14,29 C15,26 19,27 22,31 L24,35 L24,19 C24,15.5 29,15.5 29,19 L29,32 L30,15 C30,11.5 35,11.5 35,15 L35,32 L36,17 C36,13.5 41,13.5 41,17 L41,34 L42,23 C42,19.5 47,19.5 47,23 L46,46 C46,52 43,56 42,58 Z';
      return iconWrap(c, ['#f0c860', '#6a3a06'], C(34, 26, 30, c.rg([[0, '#ffffff', 0.95], [0.4, '#fff2a0', 0.55], [1, '#ffd040', 0]]), 0) +
        rays(34, 26, 16, 14, 31, '#ffffff', 2.2, 0.7) +
        P(hand, c.lg(['#ffffff', '#fff2c0', '#e8b040'], 0.2, 0, 0.8, 1), 2.2) + S('M29,32 L29,40 M35,32 L35,40 M41,34 L41,41', '#c8902a', 1.2, 0.6) +
        sparkle(12, 12, 5, '#ffffff') + sparkle(54, 44, 4, '#ffffff'));
    },
    devotion_aura: function (c) {
      return iconWrap(c, ['#6a4a8a', '#120a1e'], C(32, 36, 28, c.rg([[0, '#ffe68a', 0.55], [1, '#ffe68a', 0]]), 0) +
        S('M8,46 A26,26 0 0 1 12,20 M56,46 A26,26 0 0 0 52,20', '#ffe8a0', 2.2, 0.6) +
        G(shield(c, '#f2c440', '#fff4c8'), 'translate(32,38) scale(1.45)') +
        ring2(32, 11, 13, 4, '#fff2a0', 2.6) + S('M22,9.5 A13,4 0 0 1 36,7.2', '#ffffff', 1.2, 0.8));
    },
    judgement: function (c) {
      return iconWrap(c, ['#e0a030', '#3a1604'], burst(c, 46, 48, 17, 7, 10, ['#ffffff', '#fff2a0', '#ffffff']) +
        S('M10,30 A26,26 0 0 1 30,8 M8,40 A32,32 0 0 1 24,10', '#fff4c8', 2.4, 0.6) +
        C(46, 40, 16, c.rg([[0, '#fffbe0', 0.8], [1, '#ffe68a', 0]]), 0) +
        G(goldHammer(c), 'translate(24,28) rotate(118) scale(0.8)'));
    },
    divine_protection: function (c) {
      return iconWrap(c, ['#d8a848', '#3a2406'], E(32, 52, 26, 6, c.rg([[0, '#ffffff', 0.7], [1, '#ffffff', 0]]), 0) +
        P('M8,52 C8,24 20,10 32,10 C44,10 56,24 56,52 Z', c.rg([[0, '#ffffff', 0.08], [0.7, '#fff6d0', 0.35], [1, '#ffffff', 0.9]], 0.5, 0.75, 0.7), 2.4) +
        S('M13,40 C13,24 22,15 30,14', '#ffffff', 3, 0.85) + S('M50,30 C52,36 53,42 53,48', '#ffffff', 1.6, 0.6) +
        S('M8,52 L56,52', '#fff2b0', 2.2) +
        C(32, 30, 5, '#f2c440', 1.8) + P('M24,52 C24,40 28,36 32,36 C36,36 40,40 40,52 Z', c.cel('#f2c440'), 1.8) +
        sparkle(46, 18, 4, '#ffffff'));
    },
    hammer_justice: function (c) {
      var st = function (x, y, r) { return P(star(x, y, 5, r, r * 0.45), '#ffe23a', 1.4); };
      return iconWrap(c, ['#4a6aa8', '#0a1228'], S('M10,44 A24,24 0 0 1 22,12', '#bfe0ff', 3, 0.6) + S('M54,24 A24,24 0 0 1 40,56', '#bfe0ff', 3, 0.6) +
        P('M22,12 L26,4 L28,14 Z', '#bfe0ff', 0) +
        G(goldHammer(c, true), 'translate(28,40) rotate(35) scale(0.95)') +
        st(12, 14, 6) + st(52, 12, 5) + st(50, 50, 5.5));
    },
    shadow_bolt: function (c) {
      return iconWrap(c, ['#5a2a8a', '#0a0418'], C(36, 28, 22, c.rg([[0, '#d090ff', 0.6], [1, '#8030d0', 0]]), 0) +
        S('M8,56 L22,42 M14,60 L24,50 M4,48 L16,38', '#c080ff', 2.4, 0.55) +
        G(darkFlame(0, 0, 1.15, ['#b060ff', '#4a1280', '#12041e']), 'translate(36,28) rotate(-135)') +
        C(41, 23, 6.5, c.rg([[0, '#000000'], [0.7, '#1a0630'], [1, '#9040e0']]), 1.6));
    },
    immolate: function (c) {
      var fc = ['#3ac81a', '#ff8a1a', '#ffe868'];
      return iconWrap(c, ['#8a3a10', '#1a0600'], C(32, 40, 28, c.rg([[0, '#b8ff60', 0.45], [1, '#b8ff60', 0]]), 0) +
        darkFlame(16, 42, 0.72, fc) + darkFlame(48, 42, 0.72, fc) + darkFlame(32, 34, 1.15, fc) +
        E(32, 58, 22, 4, '#1a0600', 0, 0.5));
    },
    demon_skin: function (c) {
      var d = 'M12,18 L20,12 L26,17 L38,17 L44,12 L52,18 C54,30 50,36 54,46 L48,58 L40,52 L32,60 L24,52 L16,58 L10,46 C14,36 10,30 12,18 Z';
      var sc = '';
      for (var y = 22, r = 0; y < 60; y += 6, r++) for (var x = 6 + (r % 2) * 4; x < 60; x += 8) sc += D`M${x},${y}q4,5 8,0`;
      return iconWrap(c, ['#3a6a2a', '#08140a'], C(32, 36, 26, c.rg([[0, '#9aff5a', 0.35], [1, '#9aff5a', 0]]), 0) +
        P('M20,12 L22,3 L26,14 Z M44,12 L42,3 L38,14 Z', c.lg(['#e6dcc6', '#8a7a68']), 1.8) +
        P(d, c.cel('#7a3ab0'), 2.4) + CG(S(sc, '#3a0a5a', 1.6, 0.9) + F('M10,16 L28,16 L14,44 Z', '#ffffff', 0.15), c.clip(d)) +
        S('M32,22 L32,52', '#c890ff', 1.6, 0.5) + P('M28,34 L32,26 L36,34 L32,40 Z', '#9aff5a', 1.4));
    },
    corruption: function (c) {
      var t1 = 'M4,58 C12,50 10,40 18,36 C24,33 22,26 16,22', t2 = 'M60,6 C52,12 54,20 48,24 C42,28 46,34 52,38', t3 = 'M60,58 C54,52 48,54 44,48';
      var tend = S(t1 + t2 + t3, OL, 7) + S(t1 + t2 + t3, '#a040d0', 4) + S(t1 + t2 + t3, '#e0a0ff', 1.2, 0.6);
      return iconWrap(c, ['#4a7a1a', '#081204'], C(32, 30, 24, c.rg([[0, '#c8ff70', 0.5], [1, '#c8ff70', 0]]), 0) + tend +
        skullG(c, 32, 31, 1.05, '#b8e070', '#c070ff') +
        P('M24,44 C22,49 22,52 24.5,52 C27,52 27,49 24,44 Z M40,44 C38.5,48 38.5,50 40.5,50 C42.5,50 42.5,48 40,44 Z', '#8ac030', 1.2));
    },
    life_tap: function (c) {
      return iconWrap(c, ['#5a2a4a', '#0a0610'], C(32, 48, 20, c.rg([[0, '#8fe0ff', 0.6], [1, '#2a6ac8', 0]]), 0) +
        E(32, 50, 20, 8, c.lg(['#bff0ff', '#3a8ae0', '#0a2a7a']), 2.2) + ring2(32, 49, 9, 3, '#e8fbff', 1.4) +
        S('M20,44 L17,38 M44,44 L47,38 M32,42 L32,37', '#bff0ff', 1.8, 0.8) +
        P('M32,4 C38,14 42,20 42,26 C42,32 37,36 32,36 C27,36 22,32 22,26 C22,20 26,14 32,4 Z', c.lg(['#ff8a7a', '#e0141c', '#6a0008'], 0.2, 0, 0.8, 1), 2.2) +
        F('M26,24 C26,20 28,16 30,14 C29,20 29,24 30,28 Z', '#ffffff', 0.55));
    },
    curse_of_agony: function (c) {
      return iconWrap(c, ['#7a2a9a', '#12041e'], ring2(32, 32, 27, 27, '#e0a0ff', 1.4) + ring2(32, 32, 22, 22, '#c070ff', 1.8) +
        S('M6,20 L10,22 L7,26 M58,20 L54,22 L57,26 M6,44 L10,42 L7,38 M58,44 L54,42 L57,38', '#ffc0ff', 1.8, 0.85) +
        skullG(c, 32, 33, 1.0, '#ecd4f4', '#ff4ae0') + S('M30,14 L32,18 L29,21', OL, 1.2) + S('M40,16 L38,20', OL, 1));
    },
    summon_imp: function (c) {
      var sk = '#d9452c', horn = c.lg(['#6a5a50', '#3a2c26', '#1a1210'], 0, 0, 1, 1);
      return iconWrap(c, ['#e0802a', '#3a0a04'], C(32, 36, 26, c.rg([[0, '#ffe08a', 0.5], [1, '#ffe08a', 0]]), 0) +
        P('M20,30 C12,26 6,20 2,12 C4,24 10,34 20,40 Z', c.cel(sk), 2.2) + P('M44,30 C52,26 58,20 62,12 C60,24 54,34 44,40 Z', c.cel(sk), 2.2) +
        F('M18,32 C12,28 8,24 6,19 C9,26 13,32 19,36 Z M46,32 C52,28 56,24 58,19 C55,26 51,32 45,36 Z', '#8a2418', 0.8) +
        P('M22,20 C20,13 21,8 25,5 C25,10 27,14 29,17 Z M42,20 C44,13 43,8 39,5 C39,10 37,14 35,17 Z', horn, 1.8) +
        P('M18,34 C16,20 24,14 32,14 C40,14 48,20 46,34 C45,44 40,54 32,56 C24,54 19,44 18,34 Z', c.cel(sk), 2.4) +
        P('M21,29 L29,32 L28,36 L22,35 Z M43,29 L35,32 L36,36 L42,35 Z', '#ffe23a', 1.2) + C(26, 33.5, 1.3, '#1a0a04', 0) + C(38, 33.5, 1.3, '#1a0a04', 0) +
        S('M20,26 L30,30 M44,26 L34,30', OL, 2.2) +
        P('M23,43 Q32,49 41,43 Q38,52 32,52 Q26,52 23,43 Z', '#3a0a08', 1.6) + F('M25,44.5 l1.6,2.6 l1.6,-2 z M30.4,46 l1.6,2.6 l1.6,-2.6 z M35.8,45 l1.6,2 l1.6,-2.6 z', '#fff6dc'));
    },
    summon_voidwalker: function (c) {
      var b = '#4b3f9a', bl = '#8a7ee0';
      return iconWrap(c, ['#3a3a8a', '#06061a'], F(blob(32, 30, 22, 18, 9, rnd(7), 0.4), bl, 0.3) +
        P('M4,64 C4,46 14,40 22,38 L42,38 C50,40 60,46 60,64 Z', c.cel(dk(b, 0.1)), 2.4) +
        P('M16,36 C14,20 22,10 32,10 C42,10 50,20 48,36 C46,46 40,50 32,50 C24,50 18,46 16,36 Z', c.cel(b), 2.4) +
        F('M18,30 C18,18 26,12 32,12 C26,16 22,22 22,32 Z', bl, 0.55) +
        C(32, 30, 16, c.rg([[0, '#dffaff', 0.6], [1, '#7fe0ff', 0]]), 0) +
        P('M19,28 L29,31 L28,35 L21,34 Z M45,28 L35,31 L36,35 L43,34 Z', '#e8fcff', 1.4) + S('M18,25 L30,29 M46,25 L34,29', OL, 2) +
        S('M26,42 Q32,44 38,42', '#1a1440', 1.6, 0.8) + S('M8,50 C12,46 18,48 20,52 M56,50 C52,46 46,48 44,52', bl, 1.8, 0.6) +
        S('M24,12 C20,6 24,2 20,-2 M34,10 C36,4 32,0 36,-4 M42,14 C46,8 44,4 48,0', bl, 2.2, 0.55));
    },
    firebolt: function (c) {
      return iconWrap(c, ['#b0381a', '#200400'], S('M6,58 L24,40 M12,60 L26,46 M4,50 L20,36', '#ffb040', 2.4, 0.6) +
        C(38, 26, 18, c.rg([[0, '#fff2a0', 0.9], [0.4, '#ff9a2a', 0.5], [1, '#ff6a1a', 0]]), 0) +
        C(38, 26, 10, c.rg([[0, '#ffffff'], [0.35, '#fff07a'], [0.75, '#ff9a1f'], [1, '#e03c14']], 0.4, 0.4, 0.65), 2.2) +
        C(24, 40, 2.4, '#ffd060', 1.2) + C(17, 47, 1.8, '#ff9a2a', 1) + C(29, 46, 1.6, '#ffb040', 1));
    },
    torment: function (c) {
      var b = '#5a4ab0';
      return iconWrap(c, ['#2a2a6a', '#06061a'], F(blob(32, 30, 22, 20, 9, rnd(9), 0.4), '#8a7ee0', 0.3) +
        rays(34, 22, 10, 22, 30, '#bfe0ff', 1.8, 0.55) +
        G(fistG(c, 0, 0, 1, b) + P('M-12,12 L12,12 L11,24 L-11,24 Z', c.cel('#8e949c'), 2) + S('M-11,16 L11,16 M-11,20 L11,20', '#5d6269', 1.2) + C(-5, 18, 1.2, '#dfe3e8', 0) + C(5, 18, 1.2, '#dfe3e8', 0), 'translate(32,30) scale(1.25) rotate(-10)') +
        chainLink(22, 58, 20) + chainLink(42, 58, -20));
    }
  };
  for (var ik in ICONS2) ICONS[ik] = ICONS2[ik];

  /* ---- hunter / druid icons ---- */
  function arrowG(c, x, y, a, s, head, shaft, fl) {
    return G(S('M0,24 L0,-16', OL, 5) + S('M0,24 L0,-16', shaft || '#c9a878', 2.6) +
      P('M0,-26 L6,-14 L0,-17 L-6,-14 Z', head || c.lg(STEEL, 0, 0, 1, 0), 1.8) +
      P('M0,14 L-6,22 L-6,30 L0,23 Z', fl || '#b8342a', 1.5) + P('M0,14 L6,22 L6,30 L0,23 Z', fl || '#b8342a', 1.5),
      'translate(' + x + ',' + y + ') rotate(' + a + ') scale(' + s + ')');
  }
  function pawG(c, x, y, s, col) {
    return G(P('M0,2 C8,2 13,8 12,13 C11,17 6,16 0,16 C-6,16 -11,17 -12,13 C-13,8 -8,2 0,2 Z', c.cel(col), 2) +
      E(-11, -4, 3.6, 4.6, c.cel(col), 1.8, null, -25) + E(-4, -10, 3.8, 4.9, c.cel(col), 1.8, null, -8) +
      E(4, -10, 3.8, 4.9, c.cel(col), 1.8, null, 8) + E(11, -4, 3.6, 4.6, c.cel(col), 1.8, null, 25),
      'translate(' + x + ',' + y + ') scale(' + s + ')');
  }
  function heartD(x, y, s) { return D`M${x},${y + 10 * s} C${x - 12 * s},${y + 2 * s} ${x - 12 * s},${y - 8 * s} ${x - 5 * s},${y - 8 * s} C${x - 2 * s},${y - 8 * s} ${x},${y - 6 * s} ${x},${y - 3 * s} C${x},${y - 6 * s} ${x + 2 * s},${y - 8 * s} ${x + 5 * s},${y - 8 * s} C${x + 12 * s},${y - 8 * s} ${x + 12 * s},${y + 2 * s} ${x},${y + 10 * s} Z`; }
  function bearHead(c, x, y, s) {
    var f = '#7a4a28';
    return G(C(-15, -14, 7, c.cel(f), 2.2) + C(15, -14, 7, c.cel(f), 2.2) + C(-15, -14, 3.2, '#3a2418', 0) + C(15, -14, 3.2, '#3a2418', 0) +
      P('M-20,0 C-20,-16 -10,-22 0,-22 C10,-22 20,-16 20,0 C20,12 12,20 0,20 C-12,20 -20,12 -20,0 Z', c.cel(f), 2.4) +
      P('M-9,6 C-9,-1 -4,-2 0,-2 C4,-2 9,-1 9,6 C9,13 4,16 0,16 C-4,16 -9,13 -9,6 Z', c.cel('#c9a070'), 1.8) +
      E(0, 2.5, 4.4, 3, '#140c08', 0) + S('M0,5 L0,9 M-4,11 Q0,13 4,11', OL, 1.4) +
      C(-8, -6, 2.4, '#140c08', 0) + C(8, -6, 2.4, '#140c08', 0) + C(-8.6, -6.8, 0.8, '#fff', 0) + C(7.4, -6.8, 0.8, '#fff', 0),
      'translate(' + x + ',' + y + ') scale(' + s + ')');
  }
  function slashes(n, x0, dx, col) {
    var o = '';
    for (var i = 0; i < n; i++) { var x = x0 + i * dx; o += P(D`M${x},8 C${x + 10},20 ${x + 16},36 ${x + 18},56 C${x + 12},40 ${x + 6},24 ${x},8 Z`, col, 1.8); }
    return o;
  }
  var ICONS3 = {
    auto_shot: function (c) {
      return iconWrap(c, ['#8a7a3a', '#141006'], S('M6,46 L20,32 M10,56 L24,42 M18,58 L28,48', '#fff4c8', 2.2, 0.55) + arrowG(c, 34, 30, 45, 1.2));
    },
    raptor_strike: function (c) {
      return iconWrap(c, ['#b0561a', '#260a02'], slashes(3, 16, 11, '#fff0e0') + iw(c, 'sword', 16, 50, 45, 0.9) + burst(c, 46, 16, 9, 4, 7, ['#ffb040', '#fff0a0', '#ffffff']));
    },
    serpent_sting: function (c) {
      var sn = 'M10,52 C18,44 30,50 34,40 C38,30 26,26 30,18 C33,12 40,12 44,14';
      return iconWrap(c, ['#3a6a2a', '#061004'], arrowG(c, 30, 34, 45, 1.05, c.lg(['#e8ffc0', '#6ad040', '#1a6a10']), null, '#3a8a2a') +
        S(sn, OL, 8) + S(sn, '#6ab43a', 5) + S(sn, '#d8ff8a', 1.2, 0.6) + P('M42,10 C48,9 52,12 52,15 C52,18 48,20 43,18 Z', c.cel('#6ab43a'), 1.8) +
        C(47, 13.5, 1.3, '#ffe23a', 0) + S('M52,15 L57,15 M55,15 L58,13 M55,15 L58,17', '#e0141c', 1.1));
    },
    arcane_shot: function (c) {
      return iconWrap(c, ['#5a2a9a', '#0a0418'], C(38, 26, 20, c.rg([[0, '#ffe0ff', 0.7], [1, '#b040ff', 0]]), 0) +
        S('M8,56 L28,36', '#e8a0ff', 6, 0.35) + S('M10,54 L28,36', '#ffffff', 1.4, 0.7) +
        arrowG(c, 32, 32, 45, 1.2, c.lg(['#ffffff', '#f0a8ff', '#a040e0']), '#e0b0ff', '#c070ff') + sparkle(50, 44, 4, '#ffe0ff') + sparkle(14, 16, 4, '#ffe0ff'));
    },
    hunters_mark: function (c) {
      var red = '#ff3a2a';
      return iconWrap(c, ['#6a1a1a', '#140404'], ring2(32, 32, 21, 21, red, 3) + ring2(32, 32, 11, 11, red, 2.6) +
        S('M32,4 L32,18 M32,46 L32,60 M4,32 L18,32 M46,32 L60,32', OL, 6) + S('M32,4 L32,18 M32,46 L32,60 M4,32 L18,32 M46,32 L60,32', red, 3) +
        C(32, 32, 3.6, '#ffd0c0', 1.4));
    },
    concussive_shot: function (c) {
      var st = function (x, y, r) { return P(star(x, y, 5, r, r * 0.45), '#ffe23a', 1.4); };
      return iconWrap(c, ['#3a5a8a', '#08101e'], burst(c, 44, 20, 11, 5, 8, ['#bfe0ff', '#ffffff', '#ffffff']) + arrowG(c, 30, 34, 45, 1.1) +
        '<ellipse cx="44" cy="20" rx="17" ry="6" fill="none" stroke="#fff6a0" stroke-width="1.6" opacity="0.8" transform="rotate(-15 44 20)"/>' +
        st(28, 12, 5) + st(58, 16, 4.5) + st(46, 32, 4));
    },
    aspect_monkey: function (c) {
      var f = '#7a5230', m = '#e0b088';
      return iconWrap(c, ['#6a8a3a', '#0e1406'], C(10, 34, 8, c.cel(f), 2.2) + C(54, 34, 8, c.cel(f), 2.2) + C(10, 34, 4, m, 0) + C(54, 34, 4, m, 0) +
        P('M12,32 C12,14 22,8 32,8 C42,8 52,14 52,32 C52,48 44,58 32,58 C20,58 12,48 12,32 Z', c.cel(f), 2.4) +
        P('M32,26 C28,18 18,18 18,28 C18,34 20,38 22,42 C24,50 28,54 32,54 C36,54 40,50 42,42 C44,38 46,34 46,28 C46,18 36,18 32,26 Z', c.cel(m), 2) +
        C(25, 29, 2.8, '#140c08', 0) + C(39, 29, 2.8, '#140c08', 0) + C(24.2, 28, 0.9, '#fff', 0) + C(38.2, 28, 0.9, '#fff', 0) +
        E(29, 39, 1.2, 1.6, '#3a2418', 0) + E(35, 39, 1.2, 1.6, '#3a2418', 0) + S('M25,45 Q32,51 39,45', OL, 1.8) +
        S('M22,16 L26,11 M30,14 L32,8 M38,15 L40,10', dk(f, 0.35), 1.6));
    },
    tame_beast: function (c) {
      return iconWrap(c, ['#a05a3a', '#200a04'], pawG(c, 28, 36, 1.35, '#e0c49a') +
        P(heartD(46, 18, 0.95), c.lg(['#ff8a7a', '#e0302a', '#8a0a14']), 2) + F('M40,13 C41,11 43,11 44,12 C42,13 41,14 41,16 Z', '#ffffff', 0.7) +
        S('M8,56 C14,52 12,46 18,46', '#c9a060', 2.4, 0.9));
    },
    wrath: function (c) {
      return iconWrap(c, ['#4a7a1a', '#081004'], S('M6,58 L24,40 M12,60 L26,46 M4,50 L20,36', '#d8ff8a', 2.4, 0.6) +
        C(38, 26, 20, c.rg([[0, '#fffbe0', 0.9], [0.4, '#d8f060', 0.5], [1, '#6ac030', 0]]), 0) +
        C(38, 26, 10, c.rg([[0, '#ffffff'], [0.35, '#fff6a0'], [0.75, '#b8e040'], [1, '#4a9a20']], 0.4, 0.4, 0.65), 2.2) +
        leaf(c, 20, 44, -135, 0.7, '#86c84a') + leaf(c, 52, 46, 160, 0.55, '#5aa032'));
    },
    healing_touch: function (c) {
      var hand = 'M22,58 L22,42 C18,38 13,33 14,29 C15,26 19,27 22,31 L24,35 L24,19 C24,15.5 29,15.5 29,19 L29,32 L30,15 C30,11.5 35,11.5 35,15 L35,32 L36,17 C36,13.5 41,13.5 41,17 L41,34 L42,23 C42,19.5 47,19.5 47,23 L46,46 C46,52 43,56 42,58 Z';
      return iconWrap(c, ['#2a7a3a', '#041208'], C(34, 30, 28, c.rg([[0, '#e8ffc0', 0.85], [0.45, '#8ae060', 0.45], [1, '#4ab030', 0]]), 0) +
        P(hand, c.lg(['#f4ffe0', '#b8f080', '#4aa030'], 0.2, 0, 0.8, 1), 2.2) + S('M29,32 L29,40 M35,32 L35,40 M41,34 L41,41', '#3a8a2a', 1.2, 0.6) +
        leaf(c, 50, 14, 30, 0.7, '#86c84a') + leaf(c, 12, 16, -30, 0.6, '#5aa032') + sparkle(52, 44, 4, '#ffffff'));
    },
    mark_wild: function (c) {
      return iconWrap(c, ['#8a3a9a', '#160420'], C(32, 32, 26, c.rg([[0, '#ffe0ff', 0.5], [1, '#ffe0ff', 0]]), 0) +
        leaf(c, 32, 58, 0, 2.4, '#6ab43a') + pawG(c, 32, 30, 1.1, '#f4e6c8'));
    },
    moonfire: function (c) {
      return iconWrap(c, ['#2a3a7a', '#04081a'], P('M24,0 L40,0 L36,64 L28,64 Z', c.lg([[0, '#ffffff', 0.9], [1, '#9ad8ff', 0.2]], 0, 0, 0, 1), 0) +
        C(32, 30, 22, c.rg([[0, '#e8f4ff', 0.6], [1, '#6aa0e0', 0]]), 0) +
        P('M40,10 C24,10 16,22 16,32 C16,44 26,54 40,54 C30,48 26,40 26,32 C26,22 32,14 40,10 Z', c.lg(['#ffffff', '#d8e8ff', '#8aa8d8'], 0.2, 0, 0.8, 1), 2.2) +
        sparkle(46, 22, 4, '#ffffff') + sparkle(48, 42, 3, '#e8f4ff') + E(32, 60, 14, 3, '#bfe0ff', 0, 0.6));
    },
    rejuvenation: function (c) {
      var L = '';
      for (var i = 0; i < 6; i++) { var a = i / 6 * Math.PI * 2, rr = 10 + i * 2.6; L += leaf(c, 32 + Math.cos(a) * rr, 32 + Math.sin(a) * rr, a * 180 / Math.PI + 180, 0.62 + i * 0.05, i % 2 ? '#86c84a' : '#b8e060'); }
      return iconWrap(c, ['#3a7a5a', '#041410'], C(32, 32, 24, c.rg([[0, '#f0ffd0', 0.8], [0.4, '#a8e070', 0.35], [1, '#a8e070', 0]]), 0) +
        S('M32,32 m-4,0 a4,4 0 1 1 4,4 a8,8 0 1 1 -8,-8 a13,13 0 1 1 13,13 a19,19 0 1 1 -19,-19', '#e8ffc0', 1.8, 0.75) + L + C(32, 32, 3.6, '#ffffff', 1.2));
    },
    thorns: function (c) {
      var v = 'M8,58 C18,50 14,40 24,34 C34,28 30,18 40,14 C46,11 52,12 56,6';
      var th = '';
      [[16, 50, -30], [22, 38, 40], [28, 30, -40], [34, 22, 30], [44, 14, -20], [52, 9, 40]].forEach(function (t) { th += G(P('M-3,0 L0,-8 L3,0 Z', '#e8dcb0', 1.3), 'translate(' + t[0] + ',' + t[1] + ') rotate(' + t[2] + ')'); });
      return iconWrap(c, ['#6a6a2a', '#101404'], th + S(v, OL, 8) + S(v, '#6a7a2a', 5) + S(v, '#b8c860', 1.3, 0.6) +
        S('M44,40 C50,44 54,50 54,58', OL, 6) + S('M44,40 C50,44 54,50 54,58', '#5a6a22', 3.4) + G(P('M-3,0 L0,-8 L3,0 Z', '#e8dcb0', 1.3), 'translate(50,46) rotate(60)') +
        leaf(c, 30, 44, -150, 0.6, '#5aa032') + leaf(c, 46, 26, 100, 0.55, '#86c84a'));
    },
    entangling_roots: function (c) {
      var r1_ = 'M14,62 C12,50 18,42 14,32 C12,26 16,20 20,22', r2 = 'M32,62 C34,48 28,38 32,24 C34,16 40,14 42,18', r3 = 'M50,62 C52,52 46,44 50,36 C52,30 56,30 56,34';
      var rr = r1_ + r2 + r3;
      return iconWrap(c, ['#4a6a2a', '#0e0a04'], E(32, 58, 28, 6, '#2a1a0a', 0, 0.7) + S(rr, OL, 8) + S(rr, '#7a5230', 5) + S(rr, '#b8905a', 1.4, 0.7) +
        S('M16,40 L10,36 M31,34 L24,30 M49,44 L56,42', OL, 4.5) + S('M16,40 L10,36 M31,34 L24,30 M49,44 L56,42', '#7a5230', 2.4) +
        leaf(c, 24, 30, -60, 0.5, '#6ab43a') + leaf(c, 44, 20, 50, 0.5, '#86c84a'));
    },
    bear_form: function (c) { return iconWrap(c, ['#8a5a2a', '#1a0e04'], C(32, 36, 26, c.rg([[0, '#e8ffb0', 0.35], [1, '#b8e060', 0]]), 0) + bearHead(c, 32, 36, 1.2)); },
    bow: function (c) {
      return iconWrap(c, ITEM_BG, G(WP.bow(c), 'translate(34,34) rotate(-45) scale(0.82)'));
    },
    maul: function (c) {
      return iconWrap(c, ['#8a2a1a', '#200604'], slashes(3, 14, 12, '#fff0e0') +
        P('M44,52 C44,46 52,44 56,50 L60,62 L40,62 Z', c.cel('#7a4a28'), 2) +
        P('M42,48 L36,40 L44,44 Z M48,46 L44,36 L50,43 Z M54,47 L54,37 L57,46 Z', '#f4ecd6', 1.3) +
        P('M22,50 C20,54 20,57 22.5,57 C25,57 25,54 22,50 Z M34,54 C32.5,57 32.5,59 34.5,59 C36.5,59 36.5,57 34,54 Z', '#e0141c', 1.2));
    },
    growl: function (c) {
      var f = '#7a4a28';
      return iconWrap(c, ['#e07a20', '#3a0e02'], S('M50,10 A14,14 0 0 1 58,26 M54,4 A22,22 0 0 1 62,26', '#fff0c0', 2.2, 0.8) +
        C(14, 14, 6, c.cel(f), 2) + C(42, 12, 6, c.cel(f), 2) +
        P('M8,30 C6,14 18,8 28,8 C40,8 50,14 50,28 C50,40 44,54 30,56 C16,58 8,46 8,30 Z', c.cel(f), 2.4) +
        P('M14,34 C16,28 40,26 44,32 C44,44 38,52 28,52 C18,52 14,44 14,34 Z', '#3a0a08', 2) +
        P('M16,34 L19,41 L22,33 Z M38,32 L35,40 L41,33 Z M20,51 L22,45 L25,51 Z M31,51 L33,45 L36,51 Z', '#f6f0dc', 1.1) +
        F('M20,44 C24,42 32,42 36,44 C34,48 22,48 20,44 Z', '#c0404a', 0.8) +
        E(28, 20, 4.5, 3, '#140c08', 0) + S('M16,16 L24,20 M40,15 L33,19', OL, 2.2));
    },
    revive_pet: function (c) {
      return iconWrap(c, ['#2a6a3a', '#041208'], C(32, 32, 28, c.rg([[0, '#f0ffd0', 0.9], [0.45, '#8ae060', 0.45], [1, '#4ab030', 0]]), 0) +
        rays(32, 32, 12, 20, 29, '#e8ffc0', 2, 0.6) + pawG(c, 32, 32, 1.3, '#f4ecd6') + sparkle(52, 12, 4, '#ffffff') + sparkle(12, 50, 3.5, '#ffffff'));
    }
  };
  for (var ik3 in ICONS3) ICONS[ik3] = ICONS3[ik3];
  /* ---- Kaldvik icons ---- */
  var ICONS4 = {
    journal: function (c) {
      var lea = '#7a4a2a';
      return iconWrap(c, ['#6a5238', '#140c06'],
        P('M14,12 L48,10 C51,10 53,12 53,15 L53,50 C53,53 51,55 48,55 L14,56 Z', c.cel('#efe4c8'), 2) + S('M16,50 L50,49 M16,46 L50,45', '#b8a888', 1, 0.8) +
        P('M10,10 L46,8 C49,8 50,10 50,13 L50,48 C50,51 48,52 45,52 L10,54 Z', c.cel(lea), 2.4) +
        P('M10,10 L17,10 L17,54 L10,54 Z', c.cel(dk(lea, 0.25)), 2) + S('M11,18 L16,18 M11,44 L16,44', GOLD, 1.8) +
        '<rect x="22" y="16" width="22" height="30" rx="2" fill="none" stroke="' + dk(lea, 0.4) + '" stroke-width="1.6" stroke-dasharray="2.4,2"/>' +
        P('M26,26 L32,20 L38,26 L32,40 Z', c.cel('#d6a53c'), 1.6) + C(32, 28, 2.4, '#8a3a2a', 1) +
        P('M44,8 L50,8 L50,14 Z M44,52 L50,52 L50,46 Z', c.cel('#c9ced6'), 1.4) +
        P('M38,28 L56,28 L56,36 L38,36 Z', c.cel('#4a2e1a'), 1.8) + R(46, 26.5, 7, 11, c.cel(GOLD), 1.5) + R(48.5, 29.5, 2, 5, '#4a2e1a', 0) +
        P('M26,52 L26,60 L29,57 L32,60 L32,52 Z', c.cel('#b82d31'), 1.4));
    },
    keg: function (c) {
      return iconWrap(c, ['#8a5a2a', '#1a0c04'],
        P('M14,14 C9,24 9,40 14,52 L50,52 C55,40 55,24 50,14 Z', c.cel('#9a6a3a'), 2.4) +
        S('M20,15 C17,26 17,40 20,51 M32,15 L32,51 M44,15 C47,26 47,40 44,51', '#6a4222', 1.2, 0.8) +
        S('M11.5,22 L52.5,22 M10.5,44 L53.5,44', OL, 4.6) + S('M11.5,22 L52.5,22 M10.5,44 L53.5,44', '#9aa2ac', 2.6) +
        E(32, 14, 18, 5, c.cel('#b58048'), 2.2) + E(32, 14, 12, 3, '#c89058', 1.2) +
        P('M26,10 C24,4 30,2 32,6 C34,1 42,3 40,9 C44,9 44,14 40,14 L24,14 C20,14 21,9 26,10 Z', c.cel('#fbf6ea'), 1.8) + P('M38,14 C39,18 38,21 36.5,21 C35,21 35,18 36,14 Z', '#fbf6ea', 1.2) +
        R(24, 32, 16, 8, c.cel('#c9ced6'), 1.8) + P('M36,40 L40,40 L40,48 L36,48 Z', c.cel('#8a8f96'), 1.6) + P('M38,48 C40,52 40,55 38,55 C36,55 36,52 38,48 Z', '#e8b030', 1.2));
    },
    rib: function (c) {
      var bone = '#f0e8d2';
      return iconWrap(c, ['#8a3a22', '#1e0804'],
        S('M18,46 C10,40 8,30 12,24 M26,42 C20,34 20,24 26,18 M34,38 C30,30 32,20 38,14', OL, 7.4) + S('M18,46 C10,40 8,30 12,24 M26,42 C20,34 20,24 26,18 M34,38 C30,30 32,20 38,14', bone, 4.4) +
        C(12, 23, 3.6, c.cel(bone), 1.8) + C(26, 17, 3.6, c.cel(bone), 1.8) + C(38.5, 13, 3.6, c.cel(bone), 1.8) +
        P('M14,44 C20,36 32,30 44,30 C54,30 58,38 56,46 C54,54 44,58 32,56 C22,55 14,52 14,44 Z', c.cel('#a8482a'), 2.4) +
        F('M20,44 C26,38 36,35 46,36 C40,40 30,42 22,48 Z', '#d8804a', 0.8) + S('M24,50 C32,46 42,44 50,44 M30,54 C38,52 46,50 52,48', '#6a1e10', 1.4, 0.8) +
        P('M44,32 C50,32 55,36 56,42 C52,38 48,36 44,36 Z', c.cel('#f4e2c0'), 1.2) + sparkle(50, 16, 4, '#fff6d0') + C(20, 54, 1.4, '#f4e2c0', 0, 0.8));
    }
  };
  for (var ik4 in ICONS4) ICONS[ik4] = ICONS4[ik4];
  /* ---- Greatbough loot ---- */
  var ICONS5 = {
    moss: function (c) {
      var R_ = rnd(501), out = C(32, 38, 26, c.rg([[0, '#c8ff8a', 0.55], [0.5, '#7ee03a', 0.2], [1, '#7ee03a', 0]]), 0);
      out += P('M8,50 C8,40 16,34 24,36 C26,26 38,24 42,32 C50,28 58,36 56,46 C60,50 58,56 52,56 L12,56 C6,56 5,52 8,50 Z', c.cel('#4aa024'), 2.2);
      out += CG(F(blob(24, 42, 9, 6, 6, R_, 0.5), '#7ee03a', 0.9) + F(blob(42, 38, 8, 5, 6, R_, 0.5), '#9aff4a', 0.85) + F(blob(34, 50, 14, 5, 6, R_, 0.5), '#2a6a14', 0.7), c.clip('M8,50 C8,40 16,34 24,36 C26,26 38,24 42,32 C50,28 58,36 56,46 C60,50 58,56 52,56 L12,56 C6,56 5,52 8,50 Z'));
      out += S('M20,36 q-2,-6 1,-10 M34,30 q0,-7 4,-10 M46,32 q2,-6 6,-8', OL, 3) + S('M20,36 q-2,-6 1,-10 M34,30 q0,-7 4,-10 M46,32 q2,-6 6,-8', '#8aff3a', 1.4);
      out += C(21, 25.5, 2.2, c.rg([[0, '#ffffff'], [1, '#b8ff6a']]), 1) + C(38, 20, 2.4, c.rg([[0, '#ffffff'], [1, '#b8ff6a']]), 1) + C(52, 24, 2, c.rg([[0, '#ffffff'], [1, '#b8ff6a']]), 1);
      out += sparkle(12, 20, 3.5, '#e8ffc0') + sparkle(56, 12, 3, '#e8ffc0') + sparkle(30, 12, 2.2, '#e8ffc0');
      return iconWrap(c, ['#2e4a1e', '#060c04'], out);
    },
    venom: function (c) {
      var sac = 'M32,8 C40,16 50,26 50,38 C50,48 42,56 32,56 C22,56 14,48 14,38 C14,26 24,16 32,8 Z';
      return iconWrap(c, ['#3e5a2a', '#081006'],
        C(32, 38, 26, c.rg([[0, '#b8ff6a', 0.4], [1, '#b8ff6a', 0]]), 0) +
        P(sac, c.rg([[0, '#e8ffc0'], [0.35, '#8ad83a'], [0.8, '#3a8a1a'], [1, '#1e5a0a']], 0.38, 0.4, 0.7), 2.4) +
        CG(S('M24,22 C22,32 24,42 30,52 M40,20 C44,30 44,42 38,52 M18,38 C26,36 34,38 46,34', '#1e5a0a', 1.2, 0.7) + E(32, 48, 16, 7, '#b8ff6a', 0, 0.35), c.clip(sac)) +
        E(24, 30, 4, 7, '#ffffff', 0, 0.6, -20) + C(38, 44, 2.2, '#f0ffd0', 0, 0.8) +
        P('M46,50 C48,54 48,58 46,60 C44,58 44,54 46,50 Z', c.cel('#8ad83a'), 1.3) + P('M32,4 L28,10 L36,10 Z', c.cel('#6a5a44'), 1.4));
    },
    feather: function (c) {
      var fd = 'M12,54 C12,40 20,24 34,14 C42,8 50,6 54,8 C54,14 50,24 44,32 C36,44 24,52 12,54 Z';
      var bars = '';
      for (var i = 0; i < 6; i++) { var t = 0.18 + i * 0.13, x = 14 + t * 38, y = 52 - t * 42; bars += D`M${x},${y} L${x + 8 - i},${y + 6 + i * 0.5} M${x},${y} L${x - 5},${y - 7 + i * 0.3} `; }
      return iconWrap(c, ['#56688a', '#0e1626'],
        P(fd, c.lg(['#e8ecf4', '#aab4c8', '#6a7690'], 0.2, 0, 0.8, 1), 2.2) +
        CG(S(bars, '#56607a', 2.2, 0.75) + S('M20,46 L30,36 M28,40 L38,30 M36,32 L44,22', '#f4f6fa', 1, 0.6), c.clip(fd)) +
        S('M8,58 L14,52 C22,42 34,26 52,9', OL, 3.6) + S('M8,58 L14,52 C22,42 34,26 52,9', '#f0ece2', 1.6) +
        F('M40,20 L46,22 L42,26 Z M26,40 L32,40 L28,45 Z', '#141c2c', 0.5));
    },
    seed: function (c) {
      var sd = 'M32,18 C42,20 48,30 46,42 C44,52 38,56 32,56 C26,56 20,52 18,42 C16,30 22,20 32,18 Z';
      return iconWrap(c, ['#4a4a1e', '#0e0c04'],
        C(32, 38, 28, c.rg([[0, '#f4ffa0', 0.55], [0.45, '#b8e040', 0.2], [1, '#b8e040', 0]]), 0) +
        P(sd, c.rg([[0, '#fffbd0'], [0.35, '#d8e060'], [0.8, '#7a9a2a'], [1, '#4a5a1a']], 0.4, 0.4, 0.7), 2.4) +
        CG(S('M32,20 C28,30 28,44 32,55 M24,26 C22,36 24,46 28,54 M40,26 C42,36 40,46 36,54', '#5a6a1a', 1.2, 0.7), c.clip(sd)) +
        E(26, 30, 3.4, 6, '#ffffff', 0, 0.55, -18) +
        S('M32,18 C32,12 36,8 40,6', OL, 3.4) + S('M32,18 C32,12 36,8 40,6', '#6a9a2a', 1.6) + leaf(c, 38, 9, 50, 0.55, '#7ac43a') + leaf(c, 33, 12, -40, 0.45, '#5aa032') +
        sparkle(12, 18, 3, '#fffbd0') + sparkle(52, 46, 2.6, '#fffbd0') + sparkle(14, 50, 2, '#fffbd0'));
    }
  };
  for (var ik5 in ICONS5) ICONS[ik5] = ICONS5[ik5];
  /* ---- v18 icons: shaman spells, Dunescar / Scrublands items ---- */
  function boltD(pts) { return pl(pts) + 'Z'; }
  function totemPost(c, x, y, s, wood, face) {
    /* carved totem post standing on y, width 20*s, height 40*s */
    var w = 10 * s, h = 40 * s, out = '';
    out += P(D`M${x - w},${y} L${x - w * 0.9},${y - h} L${x + w * 0.9},${y - h} L${x + w},${y} Z`, c.lg([lt(wood, 0.3), wood, dk(wood, 0.4)], 0, 0, 1, 0), 2.2);
    out += S(D`M${x - w},${y - h * 0.35} L${x + w},${y - h * 0.35} M${x - w * 0.95},${y - h * 0.7} L${x + w * 0.95},${y - h * 0.7}`, dk(wood, 0.5), 1.6);
    out += R(x - w * 0.62, y - h * 0.62, w * 0.44, h * 0.08, face || OL, 0) + R(x + w * 0.18, y - h * 0.62, w * 0.44, h * 0.08, face || OL, 0) + R(x - w * 0.5, y - h * 0.5, w, h * 0.08, OL, 0);
    return out;
  }
  var ICONS6 = {
    lightning_bolt: function (c) {
      var b = boltD([[40, 4], [22, 30], [32, 31], [18, 60], [46, 24], [35, 24], [48, 4]]);
      return iconWrap(c, ['#34448a', '#05071a'],
        F(blob(20, 10, 16, 7, 7, rnd(601), 0.4), '#5a64a0', 0.9) + F(blob(46, 8, 14, 6, 7, rnd(602), 0.4), '#4a5290', 0.9) +
        C(33, 32, 26, c.rg([[0, '#e8f8ff', 0.7], [0.4, '#6ab8ff', 0.3], [1, '#6ab8ff', 0]]), 0) +
        S('M22,30 L10,38 L14,44 M32,31 L44,40 L42,48', '#9ad8ff', 1.4, 0.8) +
        P(b, c.lg(['#ffffff', '#c8f0ff', '#6ab8ff'], 0, 0, 1, 1), 2.4) + S('M40,8 L27,28 M33,33 L23,53', '#ffffff', 1.4, 0.9) +
        sparkle(12, 54, 3, '#e8f8ff') + sparkle(52, 44, 2.6, '#e8f8ff'));
    },
    rockbiter_weapon: function (c) {
      var R_ = rnd(611), rocks = '', i;
      for (i = 0; i < 6; i++) { var t = 0.2 + i * 0.13, sd = i % 2 ? 1 : -1, x = 16 + t * 36 + sd * 4, y = 52 - t * 40 + sd * 4; rocks += P(blob(x, y, 3.4 + R_() * 1.4, 2.8 + R_() * 1.2, 5, R_, 0.6), c.cel(i % 2 ? '#8a7458' : '#a08a6a'), 1.6); }
      return iconWrap(c, ['#7a5a32', '#140c04'],
        C(32, 32, 26, c.rg([[0, '#ffd890', 0.45], [0.5, '#c08a3a', 0.2], [1, '#c08a3a', 0]]), 0) +
        iw(c, 'sword', 16, 50, 45, 1.05) + rocks +
        P(blob(10, 20, 3, 2.4, 5, rnd(612), 0.6), c.cel('#8a7458'), 1.4) + P(blob(50, 52, 2.6, 2, 5, rnd(613), 0.6), c.cel('#a08a6a'), 1.4) +
        S('M20,36 L24,40 M30,26 L33,31 M40,18 L42,22', '#ffe0a0', 1.2, 0.8));
    },
    healing_wave: function (c) {
      var wv = 'M6,50 C10,36 22,26 36,26 C48,26 56,34 54,44 C52,52 42,54 38,48 C35,43 40,38 44,40 C42,34 34,32 28,36 C20,41 18,52 20,58 L6,58 Z';
      return iconWrap(c, ['#2a6ab0', '#04122a'],
        C(34, 36, 28, c.rg([[0, '#e8fbff', 0.75], [0.45, '#6ad0ff', 0.35], [1, '#6ad0ff', 0]]), 0) +
        P(wv, c.lg(['#e8fbff', '#6ad0ff', '#1e5aa8'], 0.2, 0, 0.8, 1), 2.4) +
        CG(S('M10,50 C14,40 24,32 36,31 M16,56 C18,46 24,40 32,38', '#ffffff', 1.6, 0.7), c.clip(wv)) +
        S('M40,26 C46,20 52,20 56,24', OL, 3.6) + S('M40,26 C46,20 52,20 56,24', '#bff0ff', 1.8) +
        sparkle(16, 16, 4.5, '#ffffff') + sparkle(30, 12, 3, '#e8fbff') + sparkle(52, 12, 3.4, '#ffffff') + C(46, 44, 1.6, '#ffffff', 0));
    },
    earth_shock: function (c) {
      var R_ = rnd(631), out = '', i;
      out += C(32, 40, 26, c.rg([[0, '#ffe0a0', 0.7], [0.4, '#d8903a', 0.35], [1, '#d8903a', 0]]), 0);
      out += P('M2,46 L20,42 L30,48 L44,42 L62,46 L62,62 L2,62 Z', c.cel('#6a5034'), 2.2);
      out += S('M32,48 L28,54 L33,58 L30,62 M32,48 L40,53 L46,52 M32,48 L22,50 L16,56', OL, 3.6) + S('M32,48 L28,54 L33,58 L30,62 M32,48 L40,53 L46,52 M32,48 L22,50 L16,56', '#ffb040', 1.6);
      [[18, 28, 5], [30, 18, 6], [44, 26, 5], [24, 12, 3.5], [48, 12, 4], [10, 36, 3.5], [54, 36, 3.5]].forEach(function (p, j) {
        out += P(blob(p[0], p[1], p[2], p[2] * 0.8, 5, R_, 0.6), c.cel(j % 2 ? '#9a7c56' : '#b8966a'), 1.8);
      });
      for (i = 0; i < 5; i++) { var a = -Math.PI * (0.15 + i * 0.175); out += S(D`M${32 + Math.cos(a) * 8},${46 + Math.sin(a) * 8} L${32 + Math.cos(a) * 16},${46 + Math.sin(a) * 16}`, '#ffe8b0', 1.4, 0.7); }
      return iconWrap(c, ['#7a5a2a', '#140a04'], out);
    },
    stoneskin_totem: function (c) {
      var st = '#9a968a', sh = 'M-7,-8 L7,-8 L7,0 C7,6 3,9 0,11 C-3,9 -7,6 -7,0 Z';
      return iconWrap(c, ['#5a5a4a', '#0e0e0a'],
        C(32, 34, 24, c.rg([[0, '#f4ecc0', 0.45], [1, '#f4ecc0', 0]]), 0) +
        E(32, 56, 16, 4, '#000', 0, 0.35) +
        P('M14,58 L16,46 L48,46 L50,58 Z', c.lg([lt(st, 0.2), dk(st, 0.1), dk(st, 0.45)], 0, 0, 1, 0), 2.4) +
        P('M19,47 L20,22 L44,22 L45,47 Z', c.lg([lt(st, 0.3), st, dk(st, 0.4)], 0, 0, 1, 0), 2.4) +
        P('M22,23 L24,12 L40,12 L42,23 Z', c.lg([lt(st, 0.3), st, dk(st, 0.4)], 0, 0, 1, 0), 2.2) +
        F('M22,24 L30,24 L30,46 L21,46 Z', '#ffffff', 0.12) + S('M26,16 L38,16', dk(st, 0.45), 1.4) +
        P('M22,27 L29,26 L28,30 L23,30 Z M42,27 L35,26 L36,30 L41,30 Z', OL, 0) +
        G(P(sh, c.lg(['#fff4c8', '#d8b860', '#8a6a24'], 0, 0, 1, 1), 1.8) + P('M0,-4.5 L3,0 L0,4.5 L-3,0 Z', '#6a4a14', 0) + C(0, 0, 1.2, '#fff4c8', 0), 'translate(32,38.5) scale(0.95)') +
        C(32, 40, 13, c.rg([[0, '#fff8d0', 0.4], [1, '#fff8d0', 0]]), 0));
    },
    lightning_shield: function (c) {
      var orb = function (x, y, r) { return C(x, y, r * 2.2, c.rg([[0, '#e8f8ff', 0.85], [0.45, '#6ab8ff', 0.35], [1, '#6ab8ff', 0]]), 0) + C(x, y, r, c.rg([[0, '#ffffff'], [0.5, '#bfeaff'], [1, '#3a78c8']], 0.4, 0.35, 0.7), 1.6); };
      return iconWrap(c, ['#2a2a6a', '#04040e'],
        '<ellipse cx="32" cy="34" rx="22" ry="10" fill="none" stroke="#6ab8ff" stroke-width="1.6" opacity="0.7" transform="rotate(-18 32 34)"/>' +
        C(32, 34, 10, c.rg([[0, '#bfeaff', 0.5], [1, '#bfeaff', 0]]), 0) +
        S('M18,24 L24,28 L22,32 L28,34 M44,40 L40,44 L44,46 L38,50 M40,20 L36,24 L40,26', '#e8fbff', 1.4, 0.9) +
        orb(12, 40, 5.4) + orb(50, 22, 5.4) + orb(34, 50, 4.4) + orb(26, 16, 3.6));
    },
    searing_totem: function (c) {
      return iconWrap(c, ['#8a2a10', '#140402'],
        C(32, 18, 22, c.rg([[0, '#fff0a0', 0.85], [0.4, '#ff7a1a', 0.45], [1, '#ff4a00', 0]]), 0) +
        flame(32, 20, 0.75) +
        totemPost(c, 32, 58, 1.05, '#7a4a28', '#ffb040') +
        P('M18,26 L10,20 L12,30 L20,32 Z M46,26 L54,20 L52,30 L44,32 Z', c.cel('#a04a20'), 1.8) +
        C(26.5, 34.5, 1.4, '#fff4c0', 0) + C(37.5, 34.5, 1.4, '#fff4c0', 0));
    },
    cactus_apple: function (c) {
      var fr = 'M32,16 C44,16 52,26 50,40 C48,52 40,58 32,58 C24,58 16,52 14,40 C12,26 20,16 32,16 Z', sp = '';
      [[22, 28], [30, 24], [40, 26], [20, 40], [28, 36], [38, 36], [46, 40], [24, 48], [34, 48], [42, 50]].forEach(function (p) { sp += S(D`M${p[0]},${p[1]} l-2,-2 M${p[0]},${p[1]} l2,-2.4`, '#f4ecd0', 0.9) + C(p[0], p[1], 1, '#e8c860', 0); });
      return iconWrap(c, ITEM_BG,
        P(fr, c.rg([[0, '#ffa0b8'], [0.4, '#e03a6a'], [0.85, '#8a1440'], [1, '#5a0a28']], 0.38, 0.35, 0.7), 2.4) + CG(sp, c.clip(fr)) +
        E(24, 26, 4, 6, '#ffffff', 0, 0.4, -20) +
        P('M26,18 C24,10 28,6 32,8 C36,6 40,10 38,18 C36,15 28,15 26,18 Z', c.cel('#5aa040'), 1.8) + S('M32,9 L32,15', '#3a7a28', 1.2));
    },
    tusk: function (c) {
      var t = 'M14,54 C12,40 18,24 32,14 C40,8 50,6 56,8 C48,12 40,18 34,26 C28,34 26,44 28,56 Z';
      return iconWrap(c, ITEM_BG,
        P(t, c.lg(['#fffaf0', '#e6dcc2', '#a89878'], 0.2, 0, 0.8, 1), 2.4) +
        CG(S('M20,50 C20,38 26,28 36,20 M22,54 C24,44 28,36 34,30', '#b8a888', 1.2, 0.8) + S('M17,46 C18,34 26,22 40,13', '#ffffff', 1.6, 0.8), c.clip(t)) +
        P('M12,50 L30,52 L30,60 L12,58 Z', c.cel('#7a4a28'), 2) + S('M14,53 L28,55 M14,56 L28,58', '#4a2a14', 1.1) + C(21, 55, 1.6, c.cel(GOLD), 1));
    },
    voodoo_doll: function (c) {
      var b = 'M32,10 C40,10 44,16 42,22 C48,22 56,24 56,30 C56,34 50,34 44,32 L44,42 L50,56 C48,59 44,59 42,56 L34,46 L30,46 L22,56 C20,59 16,59 14,56 L20,42 L20,32 C14,34 8,34 8,30 C8,24 16,22 22,22 C20,16 24,10 32,10 Z';
      return iconWrap(c, ['#4a2a4a', '#0e060e'],
        P(b, c.cel('#b8986a'), 2.4) +
        CG(S('M8,30 L56,30 M20,42 L44,42', '#8a6a44', 1.1, 0.8) + S('M32,22 L32,46', '#6a4a2a', 1.2, 0.8), c.clip(b)) +
        S('M27,14.5 L30,17.5 M30,14.5 L27,17.5 M34,14.5 L37,17.5 M37,14.5 L34,17.5', OL, 1.4) + S('M28,20 L36,20 M29.5,19 L29.5,21 M32,19 L32,21 M34.5,19 L34.5,21', OL, 0.9) +
        S('M44,26 L56,14 M26,36 L16,46 M36,38 L48,48', OL, 2.6) + S('M44,26 L56,14 M26,36 L16,46 M36,38 L48,48', '#c9ced6', 1.2) +
        C(56, 14, 2.6, c.cel('#d8302a'), 1.3) + C(16, 46, 2.6, c.cel('#3a78c8'), 1.3) + C(48, 48, 2.6, c.cel('#6ac03a'), 1.3) +
        P('M26,10 C26,6 30,4 32,6 C34,4 38,6 38,10 Z', c.cel('#3a2418'), 1.4));
    },
    scorpid_stinger: function (c) {
      var col = '#c8782a', seg = '';
      [[14, 52, 7], [20, 42, 6.4], [28, 34, 5.8], [36, 28, 5.2]].forEach(function (p) { seg += E(p[0], p[1], p[2], p[2] * 0.8, c.cel(col), 2, null, -40) + S(D`M${p[0] - p[2] * 0.5},${p[1] - p[2] * 0.3} L${p[0] + p[2] * 0.4},${p[1] - p[2] * 0.6}`, lt(col, 0.4), 1.2, 0.7); });
      return iconWrap(c, ITEM_BG, seg +
        P('M38,24 C42,16 48,12 54,12 C58,12 58,16 56,18 C52,16 48,18 46,22 C44,26 42,28 40,30 Z', c.cel(dk(col, 0.1)), 2) +
        P('M54,12 C58,10 60,14 58,20 C56,24 52,28 48,30 C52,24 54,18 54,12 Z', c.lg(['#fff2d0', '#3a2410'], 0, 0, 1, 1), 1.8) +
        P('M48,32 C50,35 50,38 48,40 C46,38 46,35 48,32 Z', c.cel('#8ad83a'), 1.3));
    },
    lizard_horn: function (c) {
      var h = 'M12,56 C10,44 14,30 24,20 C32,12 44,8 54,8 C46,12 40,18 36,26 C32,34 30,44 30,56 Z', rings = '';
      [[0.2], [0.35], [0.5], [0.65]].forEach(function (u) { var t = u[0], x0 = 12 + t * 26, y0 = 56 - t * 38; rings += D`M${x0 - 2},${y0 + 1} Q${x0 + 8 - t * 6},${y0 + 4 - t * 4} ${x0 + 18 - t * 18},${y0 + 1 - t * 6} `; });
      return iconWrap(c, ITEM_BG,
        P(h, c.lg(['#d8d0a8', '#8a8a5a', '#4a4a2a'], 0.2, 0, 0.8, 1), 2.4) + CG(S(rings, '#3a3a1e', 1.5, 0.85) + S('M16,48 C16,36 22,26 32,18', '#f4f0d8', 1.4, 0.6), c.clip(h)) +
        P('M10,52 L32,54 L32,60 L10,58 Z', c.cel('#5a6a3a'), 2) + C(16, 56, 1.3, '#2a3a1a', 0) + C(24, 57, 1.3, '#2a3a1a', 0));
    }
  };
  for (var ik6 in ICONS6) ICONS[ik6] = ICONS6[ik6];
  /* ---- v19 icons: tauren / Reclaimed racials, Greensward and Pallmoor drops ---- */
  function iLink(x, y, rot, rx, ry) {
    var e = '<ellipse cx="0" cy="0" rx="' + rx + '" ry="' + ry + '" fill="none" stroke="';
    return G(e + OL + '" stroke-width="5.4"/>' + e + '#9aa2ac" stroke-width="2.8"/>' + e + '#e8eef4" stroke-width="0.9" opacity="0.7"/>', 'translate(' + x + ',' + y + ') rotate(' + rot + ')');
  }
  var ICONS7 = {
    war_stomp: function (c) {
      var fur = '#9a6a40', hoofC = c.lg(['#b8a898', '#6e5e52', '#3a2e28'], 0, 0, 1, 1);
      return iconWrap(c, ['#d0904a', '#3a1a06'],
        P('M0,44 C14,40 50,40 64,44 L64,64 L0,64 Z', c.lg(['#9a6a38', '#6a4422', '#3a2412']), 0) +
        C(32, 47, 20, c.rg([[0, '#fff4c0', 0.9], [0.35, '#ffc860', 0.5], [1, '#ffc860', 0]]), 0) +
        S('M32,47 L18,57 L10,55 M32,47 L44,59 L54,58 M32,47 L30,62 M32,47 L6,47 M32,47 L58,48', '#1a0c04', 2.6, 0.85) +
        S('M32,47 L18,57 M32,47 L44,59 M32,47 L30,62', '#ffd870', 1.2, 0.95) +
        '<ellipse cx="32" cy="47" rx="28" ry="7.5" fill="none" stroke="#fff4d0" stroke-width="2.4" opacity="0.7"/>' +
        '<ellipse cx="32" cy="47" rx="19" ry="5" fill="none" stroke="#ffffff" stroke-width="2.6" opacity="0.85"/>' +
        F(blob(8, 41, 7, 4, 6, rnd(701), 0.5), '#e8c898', 0.8) + F(blob(56, 41, 7, 4, 6, rnd(702), 0.5), '#e8c898', 0.8) +
        S('M20,4 L20,14 M44,4 L44,14 M14,10 L14,18 M50,10 L50,18', '#fff0c8', 1.8, 0.7) +
        tube([[32, -4], [32, 26]], 16, fur, dk(fur, 0.3)) +
        P('M21,24 L24,31 L27,27 L30,32 L33,27 L36,32 L39,27 L42,31 L44,24 Z', c.cel(lt(fur, 0.15)), 1.8) +
        P('M20,30 L31,30 L31,44 C31,47 27,48 23,47.5 C18,47 15,44 16,39 C17,35 19,33 20,30 Z', hoofC, 2.2) + P('M33,30 L44,30 C45,33 47,35 48,39 C49,44 46,47 41,47.5 C37,48 33,47 33,44 Z', hoofC, 2.2) +
        P('M29,30 L35,30 L32,40 Z', '#1a1410', 0) +
        S('M20,34 C18,38 18,42 20,45 M37,33 C36,37 36,41 37,45', '#f0e6dc', 1.5, 0.75));
    },
    will_forsaken: function (c) {
      var bn = c.lg(['#fbf6e6', '#d8ccae', '#8a7c60'], 0.2, 0, 0.8, 1);
      return iconWrap(c, ['#5a4a7a', '#0a0612'],
        C(32, 28, 26, c.rg([[0, '#c8b0ff', 0.35], [1, '#c8b0ff', 0]]), 0) +
        P('M19,26 C18,12 46,12 45,26 C45,32 42,35 40,37 L40,42 L24,42 L24,37 C22,35 19,32 19,26 Z', bn, 2.4) +
        E(26.5, 28, 4.2, 4.6, '#140c10', 0) + E(37.5, 28, 4.2, 4.6, '#140c10', 0) +
        C(26.5, 28.5, 4, c.rg([[0, '#fffbd8', 0.95], [0.3, '#ffe060', 0.55], [1, '#ffd84a', 0]]), 0) + C(37.5, 28.5, 4, c.rg([[0, '#fffbd8', 0.95], [0.3, '#ffe060', 0.55], [1, '#ffd84a', 0]]), 0) +
        C(26.5, 28.5, 1.1, '#ffffff', 0) + C(37.5, 28.5, 1.1, '#ffffff', 0) +
        P('M30.5,33 L32,30.5 L33.5,33 Z', '#140c10', 0) + S('M27,38 L27,42 M30.4,38 L30.4,42 M33.6,38 L33.6,42 M37,38 L37,42', OL, 1) +
        S('M23,19 C26,16 30,15 33,15.5', '#ffffff', 1.6, 0.6) +
        iLink(6, 50, -12, 4.6, 2.8) + iLink(14, 48, -8, 4.6, 2.8) + iLink(22, 46.5, 60, 4.6, 2.8) +
        iLink(58, 50, 12, 4.6, 2.8) + iLink(50, 48, 8, 4.6, 2.8) + iLink(42, 46.5, -60, 4.6, 2.8) +
        S('M27,44.5 C28,42 30,42 30.5,44 M37,44.5 C36,42 34,42 33.5,44', OL, 3.6) + S('M27,44.5 C28,42 30,42 30.5,44 M37,44.5 C36,42 34,42 33.5,44', '#9aa2ac', 1.8) +
        sparkle(32, 50, 5, '#fff0b0') + sparkle(26, 55, 2.6, '#e8d8ff') + sparkle(39, 54, 2.2, '#e8d8ff') + S('M32,46 L29,51 M32,46 L35.5,52 M32,46 L32,53', '#fff4c8', 0.9, 0.9));
    },
    cannibalize: function (c) {
      var bn = c.lg(['#efe6cc', '#bfb08c', '#6e6248'], 0, 0, 1, 1);
      var meat = 'M20,30 C18,22 26,16 34,18 C42,20 46,28 42,36 C38,44 28,46 22,40 C19,37 20,34 20,30 Z';
      return iconWrap(c, ['#4a2226', '#060304'],
        C(32, 32, 26, c.rg([[0, '#6a8a4a', 0.3], [1, '#6a8a4a', 0]]), 0) +
        S('M14,50 L50,14', OL, 9) + S('M14,50 L50,14', '#d8ccae', 5.6) +
        C(11, 48, 5, bn, 2) + C(16, 53, 5, bn, 2) + C(48, 11, 5, bn, 2) + C(53, 16, 5, bn, 2) +
        P(meat, c.lg(['#9a3a36', '#6a1e1e', '#3a0c0e'], 0.2, 0, 0.8, 1), 2.4) +
        CG(S('M24,24 C28,28 30,34 28,42 M32,20 C36,26 38,32 36,40', '#b85a50', 1.4, 0.7) + E(28, 26, 6, 3.5, '#e8dcc4', 0, 0.8, -30), c.clip(meat)) +
        P('M30,44 C29,48 29,50 31,50 C33,50 33,48 30,44 Z', '#6a1e1e', 1.1) +
        S('M8,28 C12,26 12,22 16,20 M46,50 C50,48 52,50 56,46', '#9ab87a', 1.4, 0.5));
    },
    plainstrider_beak: function (c) {
      var up = 'M10,30 C14,20 28,14 42,16 C52,18 58,24 58,30 C58,34 56,36 54,35 C52,30 46,28 38,29 C30,30 20,32 10,34 Z';
      var lo = 'M12,35 C22,33 32,32 40,32 C46,32 50,34 52,37 C46,42 34,44 24,43 C18,42 14,40 12,35 Z';
      return iconWrap(c, ITEM_BG,
        P(lo, c.lg(['#f4c060', '#d8862a', '#8a4a14'], 0, 0, 1, 1), 2.2) +
        P(up, c.lg(['#ffe08a', '#f0a030', '#a85a18'], 0, 0, 1, 1), 2.4) +
        S('M16,26 C26,20 38,19 50,22', '#fff4c8', 1.4, 0.7) + E(24, 25, 2.2, 1.2, '#4a2a10', 0, null, -15) +
        P('M6,24 C10,26 12,32 10,40 C7,38 4,34 4,30 Z', c.cel('#c8a878'), 1.8) + S('M6,28 L9,30 M5,33 L9,34', '#7a5a38', 1, 0.8));
    },
    quilboar_tusk: function (c) {
      var t = 'M8,44 C14,26 30,14 48,12 C54,12 58,14 58,17 C50,18 38,24 30,32 C24,38 20,46 18,54 L12,52 Z';
      return iconWrap(c, ['#5a3a2a', '#120a06'],
        P(t, c.lg(['#f6e8b8', '#d4bc80', '#8a7040'], 0.2, 0, 0.8, 1), 2.4) +
        CG(S('M14,46 C20,32 32,22 46,17', '#fffbe6', 1.6, 0.7) +
          S('M22,34 L25,30 L28,34 L31,30 M30,26 L33,23 L36,26 L39,22', '#b8281e', 2.2, 0.95) + S('M16,50 C20,40 24,36 30,32', '#8a6a3a', 1, 0.7), c.clip(t)) +
        P('M7,43 L13,40 L20,53 L14,57 Z', c.cel('#6a4428'), 1.8) + S('M9,44 L16,55 M11,42 L18,54', '#3a2414', 1, 0.8) +
        S('M16,56 C14,60 12,61 10,60', OL, 2.2) + S('M16,56 C14,60 12,61 10,60', '#c8a870', 1) + C(9.5, 60, 2, c.cel('#2f6fb0'), 1.1) +
        P('M8,44 L6,47 L9,48 L7,51 L10,50 Z', '#e8d8a8', 1));
    },
    bat_wing: function (c) {
      var m = 'M12,54 L14,12 Q24,26 38,8 Q42,24 58,20 Q48,32 58,44 Q34,42 12,54 Z';
      var bones = 'M12,54 L14,12 M12,54 L38,8 M12,54 L58,20 M12,54 L58,44';
      return iconWrap(c, ['#4a3a5a', '#0a0610'],
        P(m, c.lg(['#9a7a8a', '#6a4a5a', '#3a2432'], 0.2, 0, 0.8, 1), 2.4) +
        CG(S(bones, OL, 3.6) + S(bones, '#d8c4bc', 1.8) + S('M20,40 Q28,34 36,34 M24,48 Q36,42 46,42', '#3a2430', 1, 0.6), c.clip(m)) +
        C(12, 54, 3.8, c.cel('#d8c4bc'), 1.8) + P('M14,12 L11,5 L17,9 Z M38,8 L39,2 L41,8 Z', '#efe4d8', 1.2));
    },
    zombie_brain: function (c) {
      var b = 'M12,36 C8,26 16,14 28,14 C34,10 44,12 48,18 C56,20 58,30 54,38 C52,46 44,50 36,48 C30,52 20,50 16,44 C13,42 12,39 12,36 Z';
      return iconWrap(c, ITEM_BG,
        P(b, c.lg(['#c8d4b0', '#98a888', '#5a6a50'], 0.2, 0, 0.8, 1), 2.4) +
        CG(S('M20,24 C24,20 28,24 26,28 C24,32 30,34 32,30 M36,18 C40,22 36,26 40,28 C44,30 46,26 48,28 M18,38 C22,34 26,38 30,40 C34,42 38,38 42,40 M32,30 L34,46', '#5a6a4a', 1.5, 0.85) +
          S('M18,22 C22,16 30,15 34,16', '#eef4e0', 1.6, 0.6), c.clip(b)) +
        P('M40,48 C39,52 39,55 41,55 C43,55 43,52 40,48 Z', c.cel('#98a888'), 1.2));
    },
    scarlet_armband: function (c) {
      var band = 'M10,26 C18,31 46,31 54,26 L54,42 C46,47 18,47 10,42 Z';
      return iconWrap(c, ITEM_BG,
        P('M10,26 C12,20 52,20 54,26 C46,23 18,23 10,26 Z', dk(SCAR, 0.45), 2) +
        P(band, c.lg([lt(SCAR, 0.25), SCAR, dk(SCAR, 0.35)], 0, 0, 1, 0), 2.4) +
        CG(S('M10,27.5 C18,32.5 46,32.5 54,27.5 M10,40.5 C18,45.5 46,45.5 54,40.5', '#f4f0e8', 3) + S('M14,33 C22,36 42,36 50,33', lt(SCAR, 0.4), 1, 0.5), c.clip(band)) +
        G(flameCrest(c, 0, 0, 0.62), 'translate(32,37)'));
    }
  };
  for (var ik7 in ICONS7) ICONS[ik7] = ICONS7[ik7];
  function chestG(c, col, trim, kind) {
    var d = 'M20,8 L28,12 Q32,16 36,12 L44,8 L58,16 L54,30 L46,26 L46,56 L18,56 L18,26 L10,30 L6,16 Z';
    var s = P(d, c.cel(col), 2.4);
    if (kind === 'mail') {
      var m = '';
      for (var y = 12, r = 0; y < 58; y += 4.5, r++) for (var x = 4 + (r % 2) * 2.8; x < 60; x += 5.6) m += D`M${x},${y}q2.8,3.4 5.6,0`;
      s += CG(S(m, trim, 1, 0.9), c.clip(d)) + S('M18,50 L46,50', '#6a4428', 3);
    } else if (kind === 'leather') {
      s += S('M22,24 L42,24 M22,38 L42,38', trim, 1.4, 0.8) + S('M32,14 L32,56', dk(col, 0.4), 1.6) + S('M29,20 L35,22 M29,28 L35,30 M29,36 L35,38', trim, 1.4);
    } else {
      s += S('M28,12 Q32,20 36,12', trim, 2.4) + P('M29.5,16 L34.5,16 L35.5,56 L28.5,56 Z', trim, 1.4) + S('M18,50 L46,50', trim, 2.2);
    }
    return s;
  }

  /* ================= warlock pets (128x128, FACING RIGHT) ================= */
  function chainLink(x, y, rot) {
    return G('<ellipse cx="0" cy="0" rx="2.6" ry="4" fill="none" stroke="' + OL + '" stroke-width="4"/><ellipse cx="0" cy="0" rx="2.6" ry="4" fill="none" stroke="#a7adb5" stroke-width="1.8"/>', 'translate(' + r1(x) + ',' + r1(y) + ') rotate(' + (rot || 0) + ')');
  }
  function cuff(c, p0, p1, w) {
    var mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2;
    return tube([p0, p1], w, '#8e949c', '#5d6269') + S(pl([p0, p1]), '#c9ced6', 1.2, 0.6) +
      C(mx - 3, my - 1, 1.3, '#dfe3e8', 0.8) + C(mx + 3, my + 1, 1.3, '#dfe3e8', 0.8);
  }
  function imp(c) {
    var sk = '#d9452c', sd = dk(sk, 0.3), out = '';
    var horn = c.lg(['#6a5a50', '#3a2c26', '#1a1210'], 0, 0, 1, 1);
    out += shadow(c, 62, 20);
    var tail = 'M52,104 C38,112 28,106 30,96 C31,90 27,86 22,88';
    out += S(tail, OL, 6.2) + S(tail, sd, 2.6) + P('M22,81 L27,88 L22,92 L17,88 Z', sd, 1.8);
    out += tube([[55, 103], [49, 111], [53, 117.5]], 6, sd) + P('M48,116 L56,116 C59,118 62,120 62,122.5 L47,122.5 Z', c.cel(dk(sd, 0.1)), 2);
    out += tube([[55, 84], [47, 92], [48, 99]], 5, sd) + C(48, 100, 3.3, sd, 2);
    var body = 'M50,84 C50,76 60,74 68,78 C76,82 79,94 75,104 C71,110 59,112 53,106 C48,100 48,90 50,84 Z';
    out += P(body, c.cel(sk)) + CG(F('M62,86 C72,86 76,96 72,104 C66,108 60,106 62,96 Z', '#f5a070', 0.7), c.clip(body));
    out += P('M50,99 C58,103 68,103 76,99 L73,110 L67,107.5 L63,114 L58,108 L52,110 Z', c.cel('#4a2a1e'), 2) + S('M51,100 C58,104 68,104 75,100', '#8a6a3a', 1.4);
    out += tube([[65, 106], [73, 112], [67, 118]], 6.5, sk, sd) + P('M62,116 L70,116 C74,118 78,119 79,122.5 L61,122.5 Z', c.cel(sk), 2) + S('M79,122.5 l2.6,-0.6 M75,122.5 l2.4,-1', '#efe6cf', 1.3);
    /* ears */
    out += P('M62,66 C54,60 44,56 34,50 C38,60 48,70 60,76 Z', c.cel(sk), 2.2) + F('M58,68 C52,64 45,60 40,56 C44,62 50,68 57,72 Z', '#8a2418', 0.8);
    out += P('M80,58 C86,52 92,48 100,44 C98,52 92,60 84,64 Z', c.cel(sd), 2) + F('M83,59 C88,54 92,51 96,49 C94,54 90,58 85,61 Z', '#5a140c', 0.8);
    /* head */
    var hd = 'M58,70 C56,58 66,52 76,54 C84,56 88,62 87,68 L92,73 L86,75 C84,82 76,86 68,84 C61,82 58,77 58,70 Z';
    out += P(hd, c.cel(sk)) + CG(F('M56,72 C58,82 66,86 74,85 C68,80 62,76 60,66 Z', '#000', 0.22), c.clip(hd));
    out += P('M65,57 C63,51 65,47 69,44 C68.5,49 70,52 72,55 Z', horn, 1.8) + P('M77,55 C78,49 81,46 85,45 C82,50 82,53 82,57 Z', horn, 1.8);
    out += P('M74,63 L83,61.5 L81.5,67 L75,67 Z', '#ffe23a', 1.2) + C(79.5, 64.5, 1.2, '#1a0a04', 0) +
      P('M66,64.5 L71,63.5 L70.5,67.5 L66.5,67.5 Z', '#ffe23a', 1.1) + C(69, 65.6, 0.9, '#1a0a04', 0);
    out += S('M72,60.5 L84,58.5 M64,62 L70,61', OL, 2);
    out += P('M71,74 Q79,78.5 86.5,73.5 Q83,81 75,80 Q72,78 71,74 Z', '#3a0a08', 1.4) +
      F('M73,75.5 l1.5,2.4 l1.5,-2 z M77,76.6 l1.5,2.2 l1.5,-2 z M81,76 l1.3,2 l1.3,-2.1 z', '#fff6dc');
    /* raised arm + fireball */
    out += tube([[70, 86], [81, 90], [87, 80]], 5.5, sk, sd);
    out += C(90, 66, 16, c.rg([[0, '#fff2a0', 0.9], [0.35, '#ff9a2a', 0.45], [1, '#ff6a1a', 0]]), 0);
    out += G(flame(0, 0, 0.5), 'translate(90,65)');
    out += C(87, 79, 3.7, c.cel(sk), 2) + S('M84.5,76.5 l-1,-2.4 M87,75.5 l0,-2.6 M89.5,76.5 l1,-2.4', '#efe6cf', 1.1);
    return scaleAt(out, 0.9, 62, 123);
  }
  function voidwalker(c) {
    var b = '#4b3f9a', bl = '#8a7ee0', bd = '#221a4e', out = '';
    out += shadow(c, 60, 36);
    /* smoke plumes behind */
    out += F(blob(34, 22, 11, 8, 7, rnd(11), 0.5), bl, 0.35) + F(blob(54, 12, 8, 6, 6, rnd(12), 0.5), bl, 0.28) + F(blob(104, 26, 8, 7, 6, rnd(13), 0.5), bl, 0.3);
    /* wisp tail */
    var wisp = 'M34,88 C34,102 44,108 56,112 C62,114 64,119 55,122.5 C70,123 80,118 77,110 C75,103 84,98 88,88 Z';
    out += P(wisp, c.cel(dk(b, 0.12))) + CG(F('M40,94 C46,104 58,108 66,110 C62,100 50,98 40,94 Z', bl, 0.45) + F('M60,114 C66,112 72,114 72,118 C68,116 64,116 60,114 Z', bl, 0.5), c.clip(wisp));
    out += S('M36,102 C30,108 32,116 40,118', bl, 2.2, 0.55) + S('M84,102 C92,106 92,114 86,118', bl, 2, 0.5);
    /* back arm */
    out += tube([[30, 50], [14, 72], [20, 94]], 16, dk(b, 0.28));
    out += cuff(c, [17, 80], [19, 90], 20);
    out += P(blob(20, 102, 10, 9, 7, rnd(21), 0.2), c.cel(dk(b, 0.25)), 2.4);
    out += chainLink(26, 95, 20) + chainLink(29, 102, -10);
    /* torso: hunched mass, shoulders high */
    var tor = 'M18,58 C14,34 38,20 62,20 C88,20 112,32 110,58 C108,76 96,88 86,94 C72,100 50,100 38,94 C26,86 20,72 18,58 Z';
    out += P(tor, c.cel(b), 2.8);
    out += CG(F('M22,44 C30,28 52,22 70,24 C52,28 36,36 28,56 Z', bl, 0.55) +
      S('M40,60 C50,54 62,58 60,68 C58,76 46,76 46,68 C46,64 52,62 54,66', bl, 2.6, 0.5) +
      S('M70,76 C78,70 88,74 86,82', bl, 2.2, 0.45) +
      F('M26,82 C42,96 70,98 92,86 L96,104 L26,104 Z', bd, 0.55) +
      F('M60,22 C78,22 96,28 104,40 C94,36 80,36 66,40 Z', bd, 0.35), c.clip(tor));
    /* head pushed forward from between the shoulders */
    var hd = 'M64,36 C62,23 72,14 83,15 C95,16 101,26 98,37 C95,45 83,49 74,46 C68,44 64,40 64,36 Z';
    out += P(hd, c.cel(dk(b, 0.05)), 2.4) + CG(F('M66,24 C72,16 84,14 92,18 C82,18 74,22 68,32 Z', bl, 0.5) + F('M64,20 L102,20 L102,29 C92,26 76,27 64,31 Z', bd, 0.6), c.clip(hd));
    out += C(86, 31, 14, c.rg([[0, '#dffaff', 0.85], [0.4, '#7fe0ff', 0.35], [1, '#7fe0ff', 0]]), 0);
    out += P('M76,30 C79,28 83,28 86,29 C84,32 80,33 77,33 Z', '#effdff', 0) + P('M89,28.5 C92,27.5 95,27.5 97,28.5 C95.5,31 92.5,32 90,32 Z', '#effdff', 0);
    out += S('M76,30 C79,28 83,28 86,29 M89,28.5 C92,27.5 95,27.5 97,28.5', '#7fe0ff', 1.2, 0.9);
    out += S('M76,40 Q84,42 92,39.5', bd, 1.6, 0.8);
    /* blend the head's lower edge into the shoulders so it rises out of the mass */
    out += F('M63,40 C70,48 88,50 99,40 L101,54 L60,54 Z', b) + S('M60,41 C62,46 66,49 70,50 M99,40 C98,45 96,48 93,50', OL, 2.4, 0.85);
    /* front arm */
    out += tube([[100, 52], [117, 74], [107, 94]], 17, b, dk(b, 0.28));
    out += cuff(c, [110, 81], [108, 91], 21);
    out += P(blob(106, 103, 11, 10, 7, rnd(31), 0.2), c.cel(b), 2.4) + S('M99,99 C103,97 108,97 112,99 M99,105 C103,103 108,103 112,105', bd, 1.8, 0.8);
    out += chainLink(100, 95, -25) + chainLink(96, 101, 10) + chainLink(95, 108, -15);
    out += S('M104,46 C110,40 116,42 120,38', bl, 2, 0.5) + S('M22,42 C16,36 12,38 8,34', bl, 2, 0.5);
    return out;
  }
  /* druid bear form: the bear quadruped (drawn facing left) mirrored to face right, with nature markings */
  function bearForm(c) {
    var out = C(64, 84, 58, c.rg([[0, '#e8ffb0', 0.45], [0.55, '#b8e060', 0.2], [1, '#b8e060', 0]]), 0);
    var mark = '#d8f08a';
    var body = quad(c, { kind: 'bear', fur: '#6e4526', belly: '#c9a070' });
    /* leaf markings + glowing swirl on shoulder and flank (facing-left coordinates) */
    body += S('M50,66 C56,58 66,60 64,68 C62,74 55,72 57,67', mark, 2, 0.75) +
      S('M86,62 C96,66 100,76 94,84', mark, 1.8, 0.6) +
      G(F('M0,0 C4,-3 4,-10 0,-14 C-4,-10 -4,-3 0,0 Z', mark, 0.8), 'translate(76,70) rotate(-35)') +
      G(F('M0,0 C4,-3 4,-10 0,-14 C-4,-10 -4,-3 0,0 Z', mark, 0.65), 'translate(84,74) rotate(20) scale(0.8)') +
      S('M28,49 L22,47', mark, 1.6, 0.8) + C(24.5, 54.5, 1.2, '#e8ff9a', 0);
    out += G(body, MIRROR);
    out += leaf(c, 18, 40, -40, 0.55, '#86c84a') + leaf(c, 30, 26, 25, 0.45, '#b8e060') + leaf(c, 108, 30, 60, 0.5, '#5aa032');
    return out;
  }
  var PETS = { imp: imp, voidwalker: voidwalker, bear_form: bearForm };

  /* ================= placeholders ================= */
  function phMob(c) { return shadow(c, 64, 26) + P('M44,122 C42,96 46,70 64,62 C82,70 86,96 84,122 Z', '#8a8a92', 2.5, 0.8) + C(64, 50, 14, '#9a9aa2', 2.5, 0.8); }
  function phIcon(c) { return iconWrap(c, ['#5a5a62', '#1a1a1e'], C(32, 32, 12, '#8a8a92', 2)); }
  function phScene(c) { return elwynnBase(c, 5) + treeRow(c, 150, 10, 6, '#4f8a3a', 0.8, 1.1) + groundBand(c, 156, '#7cb450', '#4f8a36', 3); }

  function safe(fn, fb) { try { return fn(); } catch (e) { try { return fb(); } catch (e2) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"></svg>'; } } }

  ['shadowglen', 'dolanaar', 'darnassus', 'lake_alameth', 'banethil_barrow', 'fel_rock', 'shadowthread_cave'].forEach(function (k) { if (SCENES[k]) SCENES[k] = duskWrap(SCENES[k]); });
  W.ART = {
    mob: function (key) {
      return safe(function () { var c = new Ctx(); var f = MOBS.hasOwnProperty(key) ? MOBS[key] : phMob; return c.svg(128, 128, f(c)); },
        function () { var c = new Ctx(); return c.svg(128, 128, phMob(c)); });
    },
    hero: function (opts) {
      return safe(function () { var c = new Ctx(); var o = heroOpts(opts); return c.svg(128, 128, shadow(c, 62, o.race ? RACEB[o.race].shadow : 30) + humanoid(c, o)); },
        function () { var c = new Ctx(); return c.svg(128, 128, phMob(c)); });
    },
    portrait: function (opts) {
      return safe(function () {
        var c = new Ctx(); var o = heroOpts(opts); o.portrait = true;
        var ac = o.accent || '#C79C6E';
        var bg = R(0, 0, 64, 64, c.rg([[0, mix(ac, '#2a2a3a', 0.45)], [1, mix(ac, '#0a0a12', 0.8)]], 0.5, 0.4, 0.65), 0);
        if (o.race) return c.svg(64, 64, bg + racePortrait(c, o));
        var X = 67, Y = 33;
        return c.svg(64, 64, bg + G(humanoid(c, o), 'matrix(1.22,0,0,1.22,' + r1(32 - X * 1.22) + ',' + r1(30 - Y * 1.22) + ')'));
      }, function () { var c = new Ctx(); return c.svg(64, 64, phIcon(c)); });
    },
    scene: function (key) {
      return safe(function () { var c = new Ctx(); var f = SCENES.hasOwnProperty(key) ? SCENES[key] : phScene; return c.svg(400, 240, f(c)); },
        function () { var c = new Ctx(); return c.svg(400, 240, R(0, 0, 400, 240, '#6a8a6a', 0)); });
    },
    icon: function (key) {
      return safe(function () { var c = new Ctx(); var f = ICONS.hasOwnProperty(key) ? ICONS[key] : phIcon; return c.svg(64, 64, f(c)); },
        function () { var c = new Ctx(); return c.svg(64, 64, R(0, 0, 64, 64, '#444', 0)); });
    },
    pet: function (key) {
      return safe(function () { var c = new Ctx(); var f = PETS.hasOwnProperty(key) ? PETS[key] : phMob; return c.svg(128, 128, f(c)); },
        function () { var c = new Ctx(); return c.svg(128, 128, phMob(c)); });
    },
    keys: { mobs: Object.keys(MOBS), scenes: Object.keys(SCENES), icons: Object.keys(ICONS), pets: Object.keys(PETS), looks: GEARKEYS, races: RACES.slice(), classes: Object.keys(CLS) }
  };
})(typeof window !== 'undefined' ? window : this);
