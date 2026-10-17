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
  // frames from the virtual clock: headless Chrome stamps animation frames with real time, so on virtual time the game
  // would see almost no time pass. A timer obeys the virtual clock; __ptFrameMs sets the frame rate (autoplay lowers it)
  window.__ptFrameMs = 50;
  window.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), window.__ptFrameMs);
  window.cancelAnimationFrame = (id) => clearTimeout(id);
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
    // a bag slot is only an icon: name it from the bag it shows (the grid's children are the bag in order)
    if (!t && el.classList && el.classList.contains('slot') && el.parentElement && el.parentElement.classList.contains('bags')) {
      const b = G.S.player.bags[[...el.parentElement.children].indexOf(el)];
      if (b) return 'bag: ' + b.item.name + (b.n > 1 ? ' x' + b.n : '');
    }
    const al = el.getAttribute && el.getAttribute('aria-label');
    if (al && t && !t.includes(al)) return al + ' (' + t + ')'; // a count or timer on an icon button: name first
    return t || al || el.getAttribute('title') || (el.querySelector('img,svg') ? '(icon' + (el.className ? ' .' + String(el.className).split(' ')[0] : '') + ')' : '(' + el.tagName.toLowerCase() + ')');
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
        // a big tappable layer (a sheet that stops taps going through) is read in full, a control is kept short
        const big = r.width * r.height > innerWidth * innerHeight * 0.25;
        let l = label(el); const max = big ? 900 : 90; if (l.length > max) l = l.slice(0, max - 3) + '…';
        const flags = [];
        if (el.disabled || el.classList.contains('disabled') || el.getAttribute('aria-disabled') === 'true') flags.push('disabled');
        if (/\\b(on|active|sel|selected|cur)\\b/.test(el.className)) flags.push('selected');
        // an ability button's state classes (singing, beat, loaded, lit, teach, cd …) say what the button shows
        if (el.classList.contains('ab')) for (const c of el.classList) if (c !== 'ab') flags.push(c);
        lines.push({ y: r.top, x: r.left, s: '[' + id + '] ' + l + (flags.length ? ' {' + flags.join(',') + '}' : '') , par: el.parentElement, kind: 'tap', cls: el.className });
        continue;
      }
      // own text (a text node directly inside), not part of a control
      let own = ''; for (const n of el.childNodes) if (n.nodeType === 3) own += n.nodeValue;
      own = txt(own); if (!own) continue;
      if (/^(SCRIPT|STYLE|NOSCRIPT|TITLE)$/.test(el.tagName) || el.closest('svg')) continue;
      if (!vis(el)) continue;
      const rc = reach(el); if (!rc.on) continue;
      // a banner that lets taps through (pointer-events: none) is still on top for the eye
      if (!rc.top && !opts.all && getComputedStyle(el).pointerEvents !== 'none') continue;
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
        // an invisible ::before/::after with a negative inset is part of the tap area (a thumb-sized hit box)
        let w = r.width, hh = r.height;
        for (const ps of ['::before', '::after']) { const q = getComputedStyle(el, ps); if (q.content === 'none' || q.position !== 'absolute') continue; const n = (v) => Math.max(0, -(parseFloat(v) || 0)); w = Math.max(w, r.width + n(q.left) + n(q.right)); hh = Math.max(hh, r.height + n(q.top) + n(q.bottom)); }
        if (rc.on && rc.top && (w < 32 || hh < 28)) { const kind = el.tagName.toLowerCase() + (el.classList && el.classList[0] ? '.' + el.classList[0] : ''); if (!small.some((x) => x.kind === kind)) small.push({ kind, ex: label(el).slice(0, 30) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) }); }
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
    if (small.length) out.push({ k: 'small-tap', m: 'tap targets under 32x28 px: ' + small.map((x) => x.kind).join(', '), ex: small.map((x) => x.ex).join('; ') });
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
      if (G.nameable) { const sp = text.split('\\n').map(txt).filter((l) => l && !G.nameable(l, G.S.player.level)); if (sp.length) out.push({ k: 'spoiler', m: sp.slice(0, 3).join(' | ') }); }
    }
    return out;
  }
  // a fingerprint of the screen, to tell whether a tap did anything
  const sig = () => { const t = document.body.innerText; let h = 0; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return h + ':' + document.querySelectorAll('*').length; };
  function target(q) {
    const els = window.__ptEls || [];
    const m = /^e(\\d+)$/.exec(q); if (m) return els[+m[1] - 1] || null;
    // exact label first, then one that starts with it, then any match
    const lq = q.toLowerCase(), L = els.map((e) => [e, label(e).toLowerCase()]);
    const hit = L.find(([, l]) => l === lq) || L.find(([, l]) => l.startsWith(lq)) || L.find(([, l]) => new RegExp(q, 'i').test(l));
    return hit ? hit[0] : null;
  }
  // autoplay: one decision per call, the way a steady player would level. Quests first (turn in, take, do the nearest
  // objective), else grind at the level. In a fight the bots' brain plays the player's unit. Anything it can't decide
  // (a dialog, a new screen) is returned as a stop, for a human look. Stats gather in window.__ptStats.
  const S0 = () => window.__ptStats || (window.__ptStats = { fights: 0, won: 0, deaths: 0, secs: 0, dmgTaken: 0, beats: 0, early: 0, finales: 0, quests: 0, levels: [], tips: [], notes: [], stuck: {} });
  const npcPlace = (npc) => Object.keys(D.PLACES).find((k) => (D.PLACES[k].npcs || []).includes(npc));
  const solo = (Q) => !Q.group && !Q.dungeon && !Q.raid;
  function autoStep(o) {
    const G = window.G, E = window.E, st = S0();
    if (!G || !G.S || !G.S.player) return { stop: 'not in the world' };
    const P = G.S.player;
    // layers a player must answer: tips are read and closed, everything else stops autoplay
    const tip = [...document.querySelectorAll('button')].find((b) => /^Got it$/.test(b.textContent.trim()) && vis(b) && reach(b).top);
    if (tip) { const box = tip.closest('div'); st.tips.push(txt(box && box.parentElement ? box.parentElement.innerText : '').slice(0, 160)); tip.click(); return { act: 'closed a tip' }; }
    // a story cutscene is skipped (Skip, then Tap again to skip) and its title kept
    const cs = document.querySelector('.cs'); const sk = cs && vis(cs) && cs.querySelector('.cs-skip');
    if (sk) { const t = txt((cs.querySelector('.cs-title, h1, h2, b') || cs).innerText).slice(0, 60); if (!st.scenes) st.scenes = []; if (st.scenes[st.scenes.length - 1] !== t) st.scenes.push(t); sk.click(); return { act: 'skipping a cutscene', wait: 0.5 }; }
    const modal = [...document.querySelectorAll('.dialog, .cs, .sheet')].find((e) => vis(e));
    // an invitation (guild, group, duel, trade) is declined and noted: autoplay keeps to its own path
    const no = modal && [...modal.querySelectorAll('button')].find((b) => /^(Decline|Not now|Later|No thanks)$/i.test(b.textContent.trim()) && vis(b));
    if (no && !o.stopOnInvites) { st.notes.push('L' + P.level + ': declined: ' + txt(modal.innerText).slice(0, 90)); no.click(); return { act: 'declined an invitation' }; }
    // a group the player queued for is ready: go in (that is why they queued)
    const enter = modal && G.S.queue && [...modal.querySelectorAll('button')].find((b) => /^Enter$/.test(b.textContent.trim()) && vis(b));
    if (enter) { st.notes.push('L' + P.level + ': entered a queued group: ' + txt(modal.innerText).slice(0, 90)); enter.click(); return { act: 'entered the group', wait: 2 }; }
    // the death recap is read and closed: the cause goes in the notes
    const close = modal && /^You died/.test(txt(modal.innerText)) && [...modal.querySelectorAll('button')].find((b) => /^Close$/.test(b.textContent.trim()) && vis(b));
    if (close) { st.notes.push('L' + P.level + ': ' + txt(modal.innerText).replace(/Close$/, '').slice(0, 200)); close.click(); return { act: 'read the death recap' }; }
    if (modal && !o.ignoreModal) return { stop: 'a screen opened: ' + txt(modal.innerText).slice(0, 300) };
    if (P.ghostUntil) { if (st.inFight) { st.secs += (Date.now() - st.inFight.t0) / 1000; st.deaths++; st.inFight = null; } return { act: 'dead, waiting', wait: 5 }; }
    // the whole route, leg by leg, as the travel screen's Go does; false when the trip didn't start
    const go = (dest) => { G.travelRoute(dest); return !!P.travel; };
    const C = G.fight, u = G.pUnit;
    if (C && u) {
      if (!st.inFight) { st.inFight = { t0: Date.now(), foes: Object.values(C.units).filter((x) => x.side !== u.side).map((x) => x.name + ' ' + (x.level || '')).join(', ') }; st.fights++; }
      st.inFight.ct = C.t;
      // what the player's unit did this fight: casts by ability, damage by source (kept for the last fight)
      const F = st.inFight; F.by = F.by || {}; F.seen = F.seen || 0;
      // the game drains C.events every frame into its recap feed: read them there
      if (!G.__ptFeed) { const f = G.recapFeed; G.__ptFeed = []; G.recapFeed = function (C2, evs) { G.__ptFeed.push(...evs); return f.apply(this, arguments); }; }
      for (const e of G.__ptFeed.splice(0)) {
        if (!e || e.src !== u.uid) continue;
        if (e.type === 'song') { if (e.what === 'beat' && !e.sync) st.beats++; if (e.what === 'early') st.early++; if (e.what === 'finale') st.finales++; }
        if (/^(dmg|heal|castStart|ability|stepFail|queueFail|song)$/.test(e.type)) { const k = e.type + ':' + (e.ab || '') + (e.what ? ':' + e.what : '') + (e.why ? ':' + e.why : ''); F.by[k] = (F.by[k] || 0) + (e.type === 'dmg' || e.type === 'heal' ? e.amount : 1); }
      }
      u.bot = u.bot || { skill: o.skill || 0.85, react: 0.45 }; u.role = o.role || (G.S.run || G.S.bg ? G.role() : 'dps'); // in a group the queued role; solo dps, as the levelling sim plays it (with no role the brain heals)
      E.botThink(C, u);
      return { act: 'fighting', wait: 0.25 };
    }
    if (st.inFight) { (st.log = st.log || []).push({ wall: +((Date.now() - st.inFight.t0) / 1000).toFixed(1), ct: +(st.inFight.ct || 0).toFixed(1), foes: st.inFight.foes, dead: !!P.ghostUntil, by: st.inFight.by }); if (st.log.length > 40) st.log.shift(); st.secs += (Date.now() - st.inFight.t0) / 1000; if (P.ghostUntil) st.deaths++; else st.won++; st.inFight = null; }
    if (P.travel) return { act: 'travelling', wait: 5 };
    // in a dungeon, raid or battleground the group moves on by itself between pulls: wait for the next one
    if (G.S.run || G.S.bg) { st.runs = st.runs || {}; return { act: 'in a run, between pulls', wait: 1 }; }
    // gear and bags, as a tidy player would: wear upgrades, sell grey junk, and when the bags are nearly full sell the
    // gear that is no upgrade (cheapest first). Counted, so a run says how often bags got in the way.
    for (let i = 0; i < P.bags.length; i++) { const it = P.bags[i].item; if (G.markedUpgrade(it) && typeof G.equip(i) !== 'string') { st.equipped = (st.equipped || 0) + 1; return { act: 'equipped ' + it.name }; } }
    // bags: wear a bag that adds room, and buy Small Brown Pouches at a vendor while slots are free and money allows
    for (let i = 0; i < P.bags.length; i++) { const it = P.bags[i].item; if (it.slot === 'bag' && ((P.bagsEq || []).length < D.BAG_SLOTS || (P.bagsEq || []).some((x) => x.bag < it.bag))) { G.useItem(i); st.bagsWorn = (st.bagsWorn || 0) + 1; return { act: 'wore ' + it.name + ' (' + G.bagCap() + ' slots)' }; } }
    const pl0 = D.PLACES[P.place];
    if (pl0 && pl0.vendor && (P.bagsEq || []).length < D.BAG_SLOTS && P.money >= 2500 * 4 && P.bags.length < G.bagCap() && !P.bags.some((b) => b.item.slot === 'bag')) { G.buy(G.copyItem('small_pouch'), 1); if (P.bags.some((b) => b.item.slot === 'bag')) return { act: 'bought a Small Brown Pouch' }; }
    if (P.bags.length >= G.bagCap() - 2) {
      st.bagsFull = (st.bagsFull || 0) + 1; G.sellJunk();
      // with no profession to use them, full stacks of materials past the first go to the vendor
      const mats = P.bags.map((b, i) => [b, i]).filter(([b]) => b.item.slot === 'mat');
      const extra = mats.find(([b, i]) => mats.some(([c, j]) => j < i && c.item.id === b.item.id));
      if (extra && !extra[0].item.noSell) { G.sell(extra[1]); return { act: 'sold a spare stack of ' + extra[0].item.name }; }
      if (P.bags.length >= G.bagCap() - 2) {
        const gear = P.bags.map((b, i) => [b, i]).filter(([b]) => D.GEAR_SLOTS.includes(b.item.slot) && !G.isUpgrade(b.item) && !b.item.noSell).sort((a, b) => (a[0].item.sell || 0) - (b[0].item.sell || 0));
        if (gear.length) { G.sell(gear[0][1]); return { act: 'sold ' + gear[0][0].item.name }; }
        st.notes.push('L' + P.level + ': bags full of things autoplay will not sell');
      }
    }
    // talents: spend any free points the way the game's own picks would
    if (G.talentPoints(P).free > 0) { P.talents = G.autoTalents(P.cls, o.role || 'dps', P.level, 0); st.notes.push('L' + P.level + ': talent points were free, spent with autoTalents'); }
    // rest below half health or a quarter mana
    if (o.rest !== false && (P.hp != null || P.res != null)) { const m = E.charUnit(P, 'ally', 'player', 0); if ((P.hp != null && P.hp < m.maxHp * 0.6) || (P.res != null && m.resType === 'mana' && P.res < m.maxRes * 0.4)) { st.restSecs = (st.restSecs || 0) + 5; return { act: 'resting', wait: 5 }; } }
    // 1. turn in what is complete, where its NPC stands
    for (const qid in P.quests) if (G.questState(qid) === 'complete') {
      const Q = D.QUESTS[qid], at = npcPlace(Q.turnin);
      if (at && at !== P.place) { if (!go(at)) return { stop: 'could not travel to ' + at }; return { act: 'to ' + at + ' to turn in ' + Q.name }; }
      const before = P.level; G.turnIn(qid, 0); if (!P.quests[qid]) { st.quests++; return { act: 'turned in ' + Q.name }; }
      st.stuck[qid] = (st.stuck[qid] || 0) + 1; if (st.stuck[qid] > 3) return { stop: 'cannot turn in ' + Q.name + ' (bags full?)' };
    }
    // 2. take every solo quest offered here
    const here = D.PLACES[P.place] || {};
    for (const npc of here.npcs || []) for (const { qid, st: s } of G.npcQuests(npc)) if (s === 'available' && solo(D.QUESTS[qid]) && Object.keys(P.quests).length < 20) { G.accept(qid); if (P.quests[qid]) return { act: 'took ' + D.QUESTS[qid].name }; }
    // 3. the nearest open objective
    const objs = G.openObjectives().filter(({ qid }) => solo(D.QUESTS[qid]) && (st.stuck[qid] || 0) < 40);
    for (const { qid, o: ob } of objs) {
      if (ob.type === 'visit') { if (ob.place !== P.place) { if (!go(ob.place)) return { stop: 'could not travel to ' + ob.place }; return { act: 'to ' + ob.place + ' (explore)' }; } continue; }
      // an item picked up in a place (Collecting ... at a gather spot)
      const gat = ob.type === 'collect' && Object.keys(D.PLACES).filter((k) => D.PLACES[k].gather && D.PLACES[k].gather.item === ob.item && G.canReach(P.place, k));
      if (gat && gat.length) {
        if (!gat.includes(P.place)) { if (!go(gat[0])) return { stop: 'could not travel to ' + gat[0] }; return { act: 'to ' + gat[0] + ' to collect for ' + D.QUESTS[qid].name }; }
        if (!P.casting) G.gather(); if (P.casting) return { act: 'gathering for ' + D.QUESTS[qid].name, wait: 3.2 };
      }
      const want = ob.type === 'kill' ? [ob.mob] : (G.questMobs ? [...G.questMobs()] : []);
      const hasMob = (k) => (D.PLACES[k].mobs || []).some((m) => want.includes(m[0])) || Object.keys(D.PLACES[k].named || {}).some((m) => want.includes(m)); // named spawns too
      const live = G.placeMobs().find((m) => want.includes(m.key) && m.state === 'alive');
      if (live) { G.engage(live.id); if (G.fight) return { act: 'attacked ' + D.MOBS[live.key].name + ' for ' + D.QUESTS[qid].name }; }
      const at = Object.keys(D.PLACES).find((k) => k !== P.place && hasMob(k) && G.canReach(P.place, k));
      if (at && !hasMob(P.place)) { if (!go(at)) return { stop: 'could not travel to ' + at }; return { act: 'to ' + at + ' for ' + D.QUESTS[qid].name }; }
      if (live === undefined && hasMob(P.place)) { st.stuck[qid] = (st.stuck[qid] || 0) + 1; return { act: 'waiting for a respawn', wait: 3 }; }
    }
    // 4. a quest giver elsewhere with something to offer, nearest first
    const givers = [];
    for (const qid in D.QUESTS) { const Q = D.QUESTS[qid]; if (!solo(Q) || G.questState(qid) !== 'available' || (Q.lvl || 1) > P.level + 1) continue; const at = npcPlace(Q.giver); if (at && at !== P.place && G.canReach(P.place, at)) givers.push(at); }
    // quests far below the player (left behind) don't count against the 8 it carries
    if (givers.length && Object.keys(P.quests).filter((q) => (D.QUESTS[q].lvl || 1) >= P.level - 8).length < 8) { const r = givers.map((k) => [k, (G.route(P.place, k) || {}).secs || 1e9]).sort((a, b) => a[1] - b[1])[0]; if (!go(r[0])) return { stop: 'could not travel to ' + r[0] }; return { act: 'to ' + r[0] + ' for new quests' }; }
    // 5. grind here at the level, or go where the level is
    const fit = G.placeMobs().filter((m) => m.state === 'alive' && Math.abs(m.level - P.level) <= 2 && !D.MOBS[m.key].elite);
    if (fit.length) { G.engage(fit[0].id); if (G.fight) return { act: 'grinding ' + D.MOBS[fit[0].key].name }; }
    const spot = Object.keys(D.PLACES).find((k) => { const p = D.PLACES[k]; return p.lvl && p.lvl[0] <= P.level && p.lvl[1] >= P.level && (p.mobs || []).length && !p.safe && G.canReach(P.place, k); });
    if (spot && spot !== P.place) { if (!go(spot)) return { stop: 'could not travel to ' + spot }; return { act: 'to ' + spot + ' to grind' }; }
    return { act: 'idle', wait: 3 };
  }
  window.__pt = { src: SRC, autoStep, look, state, check, sig, target, label, reach, vis };
})();`;
