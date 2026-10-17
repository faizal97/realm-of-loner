// In-page side of the playtest driver: injected before the game's own scripts (marks what can be tapped) and the
// helpers that read the screen as text (look) and check it (check). Everything here is synchronous: the page runs on
// paused virtual time, so a promise or a timer would never settle until the driver advances the clock.

// runs before any game script: every element that gets a tap handler is marked, so look can list exactly the
// controls a player could tap (the game wires all of them through addEventListener)
exports.hook = `(() => {
  const TAP = new Set(['click', 'pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend']);
  const add = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (type, fn, opt) {
    if (TAP.has(type) && this && this.nodeType === 1) this.__ptTap = true;
    return add.call(this, type, fn, opt);
  };
  window.__ptErrors = [];
  addEventListener('error', (e) => window.__ptErrors.push('error: ' + (e.message || e.type) + (e.filename ? ' @' + e.filename.split('/').pop() + ':' + e.lineno : '')));
  addEventListener('unhandledrejection', (e) => window.__ptErrors.push('promise: ' + String(e.reason && (e.reason.stack || e.reason.message) || e.reason).slice(0, 300)));
  const ce = console.error; console.error = function (...a) { window.__ptErrors.push('console.error: ' + a.map(String).join(' ').slice(0, 300)); return ce.apply(this, a); };
})();`;

// the helpers, defined once per page load as window.__pt
exports.lib = `(() => {
  const SRC = ${Date.now()};
  if (window.__pt && window.__pt.src === SRC) return;
  const W = () => innerWidth, H = () => innerHeight;
  const vis = (el) => {
    if (!el.isConnected) return false;
    const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false;
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || (+s.opacity === 0 && s.animationName === 'none')) return false; } // a fading-in layer counts as there
    return true;
  };
  const tappable = (el) => el.__ptTap || /^(BUTTON|A|INPUT|SELECT|TEXTAREA|SUMMARY)$/.test(el.tagName) || el.getAttribute('role') === 'button';
  const tapAncestor = (el) => { for (let e = el; e && e !== document.body; e = e.parentElement) if (tappable(e)) return e; return null; };
  // what a finger at the element's centre would hit: is it this element (or inside it), and is it on screen
  const reach = (el) => {
    const r = el.getBoundingClientRect(), x = Math.min(W() - 1, Math.max(0, r.left + r.width / 2)), y = r.top + r.height / 2;
    if (y < 0 || y >= H()) return { on: false, y };
    const hit = document.elementFromPoint(x, y);
    return { on: true, top: !!hit && (hit === el || el.contains(hit) || (tapAncestor(hit) === el)), hit, x, y };
  };
  const txt = (s) => String(s || '').replace(/\\s+/g, ' ').trim();
  const label = (el) => {
    // its own words, without the words of controls nested inside it
    let t = el.innerText || el.value || ''; for (const d of el.querySelectorAll('*')) if (tappable(d) && d.innerText) t = t.replace(d.innerText, ' ');
    t = txt(t);
    return t || el.getAttribute('aria-label') || el.getAttribute('title') || (el.querySelector('img,svg') ? '(icon' + (el.className ? ' .' + String(el.className).split(' ')[0] : '') + ')' : '(' + el.tagName.toLowerCase() + ')');
  };
  // the screen as text: on-screen controls a finger can reach get an id; covered ones are left out (another layer is
  // on top of them); readable text blocks in reading order; long runs of the same kind of item are shortened
  function look(opts) {
    opts = opts || {};
    const els = [], lines = [], seen = new Set();
    let covered = 0, below = 0, above = 0;
    const all = document.body.querySelectorAll('*');
    for (const el of all) {
      if (seen.has(el)) continue;
      if (tappable(el)) {
        for (const d of el.querySelectorAll('*')) if (!tappable(d)) seen.add(d);
        if (!vis(el)) continue;
        const rc = reach(el);
        if (!rc.on) { if (rc.y < 0) above++; else below++; continue; }
        if (!rc.top) { covered++; continue; }
        const id = 'e' + (els.length + 1); els.push(el);
        const r = el.getBoundingClientRect();
        let l = label(el); if (l.length > 90) l = l.slice(0, 87) + '…';
        const flags = [];
        if (el.disabled || el.classList.contains('disabled') || el.getAttribute('aria-disabled') === 'true') flags.push('disabled');
        if (/\\b(on|active|sel|selected|cur)\\b/.test(el.className)) flags.push('selected');
        lines.push({ y: r.top, x: r.left, s: '[' + id + '] ' + l + (flags.length ? ' {' + flags.join(',') + '}' : '') , par: el.parentElement, kind: 'tap', cls: el.className });
        continue;
      }
      // own text (a text node directly inside), not part of a control
      let own = ''; for (const n of el.childNodes) if (n.nodeType === 3) own += n.nodeValue;
      own = txt(own); if (!own) continue;
      if (/^(SCRIPT|STYLE|NOSCRIPT|TITLE)$/.test(el.tagName) || el.closest('svg')) continue;
      if (!vis(el)) continue;
      const rc = reach(el); if (!rc.on) continue;
      if (!rc.top && !opts.all) continue;
      const r = el.getBoundingClientRect();
      lines.push({ y: r.top, x: r.left, s: own, par: el.parentElement, kind: 'text', el });
    }
    // reading order: top to bottom, left to right on the same row; a text block keeps its full text once
    lines.sort((a, b) => (Math.abs(a.y - b.y) < 6 ? a.x - b.x : a.y - b.y));
    const out = []; let run = null;
    for (const L of lines) {
      // shorten long lists: 9+ controls in a row with the same parent and class
      const key = L.kind === 'tap' ? L.par && (L.cls + '|' + (L.par.className || L.par.tagName)) : null;
      // shortened items keep their id and a short label, all on one line
      const short = () => out.push('   … ' + run.hidden.length + ' more: ' + run.hidden.join(', '));
      if (key && run && run.key === key) { run.n++; if (run.n > 12) { run.hidden.push(L.s.replace(/^(\[e\d+\]) (.{0,22}).*$/, '$1 $2')); continue; } }
      else { if (run && run.hidden.length) short(); run = key ? { key, n: 1, hidden: [] } : null; }
      out.push(L.s);
    }
    if (run && run.hidden.length) out.push('   … ' + run.hidden.length + ' more: ' + run.hidden.join(', '));
    // join texts on the same row into one line
    const merged = [];
    for (let i = 0; i < out.length; i++) merged.push(out[i]);
    window.__ptEls = els;
    const extra = [];
    if (below) extra.push(below + ' controls below (scroll)'); if (above) extra.push(above + ' above'); if (covered) extra.push(covered + ' covered by the top layer');
    return { lines: merged, extra: extra.join(' · '), n: els.length };
  }
  // the player in one line, from the game itself
  function state() {
    const G = window.G; if (!G || !G.S || !G.S.player) return null;
    const P = G.S.player, xpNeed = window.D && D.XP_TO_LEVEL ? D.XP_TO_LEVEL[P.level] : null;
    const f = G.fight, u = G.pUnit;
    const qs = Object.keys(P.quests || {}).length;
    return { lvl: P.level, xp: P.xp, xpNeed, hp: u ? Math.round(u.hp) + '/' + u.maxHp : P.hp, res: u ? Math.round(u.res) + '/' + u.maxRes : P.res, money: P.money, place: P.place, quests: qs, fight: !!f, run: !!G.S.run, travel: !!P.travel, dead: !!P.ghostUntil };
  }
  // the checks: things a player would call a bug or a rough edge, found on the screen as it is now
  function check() {
    const out = [];
    const errs = (window.__ptErrors || []).splice(0); for (const e of errs) out.push({ k: 'error', m: e });
    const text = document.body.innerText;
    const bad = text.match(/[^\\n]*(\\bNaN\\b|\\bundefined\\b|\\[object|\\bInfinity\\b|\\bnull\\b)[^\\n]*/g);
    if (bad) for (const b of [...new Set(bad)].slice(0, 5)) out.push({ k: 'bad-text', m: txt(b).slice(0, 160) });
    if (document.documentElement.scrollWidth > innerWidth + 1) out.push({ k: 'page-scroll-x', m: 'the page scrolls sideways: ' + document.documentElement.scrollWidth + ' px wide at ' + innerWidth });
    const els = document.body.querySelectorAll('*');
    let small = [], off = [], clip = [], lowc = [];
    for (const el of els) {
      if (!vis(el)) continue;
      const r = el.getBoundingClientRect();
      if (tappable(el) && !tapAncestor(el.parentElement)) {
        const rc = reach(el);
        if (rc.on && rc.top && (r.width < 32 || r.height < 28)) small.push(label(el).slice(0, 30) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
      }
      if (r.right > innerWidth + 2 && r.left < innerWidth && getComputedStyle(el).position !== 'fixed') {
        let clipped = false; for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const s = getComputedStyle(p); if (/(hidden|auto|scroll|clip)/.test(s.overflowX)) { clipped = true; break; } }
        if (!clipped && txt(el.innerText).length) off.push(label(el).slice(0, 40) + ' right edge ' + Math.round(r.right));
      }
      // text cut without an ellipsis: overflow hidden, content wider than the box
      const s = getComputedStyle(el);
      if (el.scrollWidth > el.clientWidth + 2 && s.overflowX === 'hidden' && s.textOverflow !== 'ellipsis' && txt(el.innerText).length && el.children.length === 0) clip.push(txt(el.innerText).slice(0, 40));
      if (el.scrollHeight > el.clientHeight + 2 && s.overflowY === 'hidden' && el.children.length === 0 && txt(el.innerText).length > 0 && s.webkitLineClamp === 'none') clip.push(txt(el.innerText).slice(0, 40) + ' (height)');
    }
    if (small.length) out.push({ k: 'small-tap', m: small.length + ' tap targets under 32x28 px: ' + small.slice(0, 6).join('; ') });
    if (off.length) out.push({ k: 'off-screen', m: off.slice(0, 4).join('; ') });
    if (clip.length) out.push({ k: 'clipped-text', m: [...new Set(clip)].slice(0, 5).join('; ') });
    // the player's numbers stay in range
    const G = window.G;
    if (G && G.S && G.S.player) {
      const P = G.S.player, u = G.pUnit;
      if (u && (u.hp > u.maxHp + 0.5 || u.res > u.maxRes + 0.5 || u.hp < 0 || u.res < -0.5)) out.push({ k: 'state', m: 'unit out of range hp ' + u.hp + '/' + u.maxHp + ' res ' + u.res + '/' + u.maxRes });
      if (P.money < 0 || !Number.isFinite(P.money)) out.push({ k: 'state', m: 'money ' + P.money });
      if (!Number.isFinite(P.xp)) out.push({ k: 'state', m: 'xp ' + P.xp });
      // spoilers: every visible line the story may not name yet at this level
      if (G.nameable) { const sp = text.split('\\n').map(txt).filter((l) => l && !G.nameable(l, 1)); if (sp.length) out.push({ k: 'spoiler', m: sp.slice(0, 3).join(' | ') }); }
    }
    return out;
  }
  // a fingerprint of the screen, to tell whether a tap did anything
  const sig = () => { const t = document.body.innerText; let h = 0; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return h + ':' + document.querySelectorAll('*').length; };
  function target(q) {
    const els = window.__ptEls || [];
    const m = /^e(\\d+)$/.exec(q); if (m) return els[+m[1] - 1] || null;
    const re = new RegExp(q, 'i'); return els.find((e) => re.test(label(e))) || null;
  }
  window.__pt = { src: SRC, look, state, check, sig, target, label, reach, vis };
})();`;
