// The run menu is tappable in every run mode and state (#67): paste into the browser console on the game page (the beta
// page, or a local build) with a level-60 character entered, at the phone size you want to check (375x812, 412x915).
// It enters a dungeon, a raid, a battleground, a Trial and the Bloodsand Brawl, and in each state (resting, fighting,
// wiped, cleared, dead; a battleground's choosing, fighting and finished) checks that the scene's menu button is the
// top element at its own centre (document.elementFromPoint), that a tap opens the menu, and that each of its four rows
// is shown and opens its own sheet (Bags, Hero, Quests, Social), and with that sheet open the button is still on top and
// switches to the next sheet in two taps (menu, row); and that no unit (sprite, nameplate or health bar, ally or enemy) is
// drawn into the scene's top strip where the controls live (#83), in each state, at ten moments across a dungeon and a raid
// fight, in a boss fight, and in every boss fight of every dungeon and raid. It changes the
// character's state (runs, Deserter, a brief death): use a test character. Prints one line per state.
(async () => {
  const W = (ms) => new Promise((r) => setTimeout(r, ms));
  // units move in the game's animation-frame loop, which a hidden tab pauses: run it on timers while checking
  const rAF = window.requestAnimationFrame; window.requestAnimationFrame = (f) => setTimeout(() => f(performance.now()), 16);
  const settle = (fn) => { fn(); G.emit('runUpdate'); G.emit('change'); };
  const skip = async () => { for (let j = 0; j < 8; j++) { const b = [...document.querySelectorAll('button')].find((x) => /^(Skip|Enter|Accept|Join)/.test(x.textContent.trim())); if (!b) break; b.click(); await W(250); } };
  // the button is on top at its centre, its tap opens the menu, and each of the menu's four rows is shown, on top and opens
  // its own sheet (a check that stopped at the menu's title once passed while every row was hidden, #67)
  const atTop = (el) => { const r = el.getBoundingClientRect(); if (!r.width || !r.height) return false; const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!(t && (t === el || el.contains(t))); };
  const closeAll = () => { const x = document.querySelector('.sheet button.x'); if (x) x.click(); const d = document.querySelector('.dialog'); if (d) d.click(); };
  // no unit (sprite, nameplate or health bar, ally or enemy) drawn into the scene's top strip, where the controls live (#83)
  const covered = () => { const out = [], st = document.querySelector('.scene .strip'), sc = document.querySelector('.scene').getBoundingClientRect();
    // a build before #83 has no strip: the controls themselves (the run menu and the battle speed) are what a unit must not be under
    const ctl = [...document.querySelectorAll('.scene .run-menu, .scene .speed-chip')].filter((e) => !e.hidden && e.getBoundingClientRect().width).map((e) => e.getBoundingClientRect());
    const r = st ? st.getBoundingClientRect() : ctl.length ? { left: Math.min(...ctl.map((q) => q.left)), right: Math.max(...ctl.map((q) => q.right)), top: Math.min(...ctl.map((q) => q.top)), bottom: Math.max(...ctl.map((q) => q.bottom)) } : { left: 0, right: 0, top: 0, bottom: 0 };
    for (const el of document.querySelectorAll('.scene .sprite, .scene .sprite .np, .scene .sprite .hpb')) { const q = el.getBoundingClientRect(); if (!q.width || !q.height) continue;
      const ix = Math.min(r.right, q.right) - Math.max(r.left, q.left), iy = Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top);
      if (ix > 0 && iy > 0) { const sp = el.closest('.sprite'), nm = ((sp.querySelector('.np') || {}).textContent || '?').trim().slice(0, 20); out.push(`${el.classList.contains('np') ? 'nameplate' : el.classList.contains('hpb') ? 'health bar' : 'sprite'} of ${nm} in the strip (${Math.round(iy)} px)`); } }
    return [...new Set(out)]; };
  const check = (label) => {
    const m = document.querySelector('.run-menu'); if (!m || m.hidden) return `${label}: NO MENU`;
    const cov = covered(); if (cov.length) return `${label}: ${cov.join(', ')}`;
    if (!atTop(m)) { const r = m.getBoundingClientRect(), t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return `${label}: COVERED by ${t && t.className}`; }
    const bad = [];
    for (const [i, k] of ['bags', 'hero', 'quests', 'social'].entries()) {
      m.click(); const rows = [...document.querySelectorAll('.dialog .list .row')];
      if (rows.length !== 4) { closeAll(); return `${label}: the menu has ${rows.length} rows, not 4`; }
      if (!atTop(rows[i])) { bad.push(`${k} row hidden`); closeAll(); continue; }
      rows[i].click(); const sh = document.querySelector('.sheet'); if (!(sh && sh.classList.contains('sheet-' + k))) { bad.push(`${k} opened ${sh ? sh.className : 'nothing'}`); closeAll(); continue; }
      // with that sheet open, the menu is still one tap away and switches straight to the next sheet (QA on beta.1)
      const nx = ['bags', 'hero', 'quests', 'social'][(i + 1) % 4];
      if (!atTop(m)) { bad.push(`with ${k} open the menu is covered`); closeAll(); continue; }
      m.click(); const rows2 = [...document.querySelectorAll('.dialog .list .row')];
      if (rows2.length !== 4 || !atTop(rows2[(i + 1) % 4])) { bad.push(`with ${k} open the menu did not open`); closeAll(); continue; }
      rows2[(i + 1) % 4].click(); const sh2 = document.querySelector('.sheet'); if (!(sh2 && sh2.classList.contains('sheet-' + nx))) bad.push(`${k} -> ${nx} opened ${sh2 ? sh2.className : 'nothing'}`);
      closeAll();
    }
    return `${label}: ${bad.length ? bad.join(', ') : 'ok (each of the four opens, and from each open sheet the menu switches to the next)'}`;
  };
  const clear = () => { if (G.fight) { for (const e of G.fight.enemies) e.hp = 1; for (let i = 0; i < 400 && G.fight; i++) G.update(0.2); } if (G.S.brawl) G.leaveBrawl(); if (G.S.run) G.leaveGroup(); if (G.S.bg) G.leaveBg(); G.S.flags.deserterUntil = 0; };
  const fightNow = () => { for (let i = 0; i < 400 && !G.fight; i++) { if (G.S.run) G.S.run.restUntil = 0; G.update(0.25); } };
  const endFight = () => { if (G.fight) { for (const e of G.fight.enemies) e.hp = 1; for (let i = 0; i < 300 && G.fight; i++) G.update(0.2); } };
  const enter = async (act) => { clear(); G.queueFor(act); if (G.S.queue) G.S.queue.popAt = Date.now() - 1; for (let i = 0; i < 20 && !G.S.run && !G.S.bg; i++) G.update(0.5); await skip(); };
  const out = [`viewport ${innerWidth}x${innerHeight}`];
  const pick = (f) => Object.keys(D.ACTIVITIES).find((k) => f(D.ACTIVITIES[k]) && G.activityBlock(k) !== 'hidden');
  for (const [label, act] of [['dungeon', pick((A) => A.dungeon && (A.size || 5) <= 5 && A.minLvl <= 60 && A.maxLvl >= 60 && !A.needQuest)], ['raid', pick((A) => (A.size || 5) > 5 && !A.worldBoss && A.minLvl <= 60)]]) {
    await enter(act); if (!G.S.run) { out.push(`${label}: did not start`); continue; }
    out.push(check(`${label} resting`)); fightNow(); out.push(check(`${label} fighting`));
    // QA's samples (#83): ten moments across the fight, as units move and fly
    { const hits = []; let n = 0; for (let k = 0; k < 10 && G.S.run; k++) { if (!G.fight) { if (G.S.run.phase !== 'rest') break; fightNow(); } for (let i = 0; i < 8; i++) G.update(0.25); await W(60); n++; hits.push(...covered()); } out.push(`${label}: ${n} fight samples, ${hits.length ? [...new Set(hits)].join('; ') : 'no unit in the strip'}`); }
    endFight();
    { const R = G.S.run, bi = R.pulls.map((p, i) => (p.boss ? i : -1)).filter((i) => i >= 0).pop(); if (bi != null) { R.idx = bi; R.phase = 'rest'; fightNow(); G.emit('change'); out.push(check(`${label} boss fight (${G.fight ? G.fight.enemies[0].name : 'none'})`)); endFight(); } }
    settle(() => { G.S.run.phase = 'wipe'; }); out.push(check(`${label} wiped`));
    settle(() => { G.S.run.phase = 'done'; }); out.push(check(`${label} cleared`));
    settle(() => { G.S.run.phase = 'rest'; G.S.player.ghostUntil = Date.now() + 60000; }); out.push(check(`${label} dead`)); settle(() => { G.S.player.ghostUntil = 0; });
  }
  await enter('bg_highmoor');
  if (!G.S.bg) out.push('battleground: did not start'); else {
    const C = D.BG[G.S.bg.key], go = () => G.bgGo(C.banners[0][0], C.banners[1][0]);
    out.push(check('battleground choosing')); go(); for (let i = 0; i < 10; i++) G.update(0.2); out.push(check('battleground fighting'));
    for (let r = 0; r < 40 && G.S.bg && G.S.bg.phase !== 'done'; r++) { endFight(); if (G.S.bg.phase === 'choose') go(); for (let i = 0; i < 20; i++) G.update(0.2); }
    G.emit('change'); out.push(check('battleground finished'));
  }
  clear(); const tact = Object.keys(D.ACTIVITIES).find((k) => !G.trialBlock(k));
  if (!tact) out.push('Trial: none open'); else {
    G.queueTrial(tact, 1); if (G.S.queue) G.S.queue.popAt = Date.now() - 1; for (let i = 0; i < 20 && !G.S.run; i++) G.update(0.5); await skip();
    if (!G.S.run) out.push('Trial: did not start'); else { out.push(check('Trial resting')); fightNow(); out.push(check('Trial fighting')); endFight(); settle(() => { G.S.run.phase = 'done'; }); out.push(check('Trial finished')); }
  }
  clear(); const bb = G.brawlBlock; G.brawlBlock = () => null; G.brawlJoin(); G.brawlBlock = bb; await skip();
  out.push(G.S.brawl ? check(`Brawl (${G.S.brawl.phase})`) : 'Brawl: did not start');
  // every boss of every dungeon, raid and world boss: the corner never covers its nameplate
  { let n = 0; const hits = [];
    for (const act of Object.keys(D.ACTIVITIES).filter((k) => (D.ACTIVITIES[k].dungeon || D.ACTIVITIES[k].worldBoss) && !D.ACTIVITIES[k].needQuest && G.activityBlock(k) !== 'hidden')) {
      await enter(act); if (!G.S.run) continue;
      for (const bi of G.S.run.pulls.map((p, i) => (p.boss ? i : -1)).filter((i) => i >= 0)) { if (!G.S.run) break; endFight(); if (!G.S.run) break; G.S.run.idx = bi; G.S.run.phase = 'rest'; fightNow(); G.emit('change'); n++; const c = covered(); if (c.length) hits.push(`${D.ACTIVITIES[act].name}: ${c.join(', ')}`); }
    }
    out.push(`every boss fight (${n}): ${hits.length ? hits.join('; ') : 'no unit in the strip'}`); }
  clear(); window.requestAnimationFrame = rAF; console.log(out.join('\n')); return out;
})();
