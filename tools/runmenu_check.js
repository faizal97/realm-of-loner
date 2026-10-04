// The run menu is tappable in every run mode and state (#67): paste into the browser console on the game page (the beta
// page, or a local build) with a level-60 character entered, at the phone size you want to check (375x812, 412x915).
// It enters a dungeon, a raid, a battleground, a Trial and the Bloodsand Brawl, and in each state (resting, fighting,
// wiped, cleared, dead; a battleground's choosing, fighting and finished) checks that the scene's menu button is the
// top element at its own centre (document.elementFromPoint), that a tap opens the menu, and that each of its four rows
// is shown and opens its own sheet (Bags, Hero, Quests, Social). It changes the
// character's state (runs, Deserter, a brief death): use a test character. Prints one line per state.
(async () => {
  const W = (ms) => new Promise((r) => setTimeout(r, ms));
  const settle = (fn) => { fn(); G.emit('runUpdate'); G.emit('change'); };
  const skip = async () => { for (let j = 0; j < 8; j++) { const b = [...document.querySelectorAll('button')].find((x) => /^(Skip|Enter|Accept|Join)/.test(x.textContent.trim())); if (!b) break; b.click(); await W(250); } };
  // the button is on top at its centre, its tap opens the menu, and each of the menu's four rows is shown, on top and opens
  // its own sheet (a check that stopped at the menu's title once passed while every row was hidden, #67)
  const atTop = (el) => { const r = el.getBoundingClientRect(); if (!r.width || !r.height) return false; const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!(t && (t === el || el.contains(t))); };
  const closeAll = () => { const x = document.querySelector('.sheet button.x'); if (x) x.click(); const d = document.querySelector('.dialog'); if (d) d.click(); };
  const check = (label) => {
    const m = document.querySelector('.run-menu'); if (!m || m.hidden) return `${label}: NO MENU`;
    if (!atTop(m)) { const r = m.getBoundingClientRect(), t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return `${label}: COVERED by ${t && t.className}`; }
    const bad = [];
    for (const [i, k] of ['bags', 'hero', 'quests', 'social'].entries()) {
      m.click(); const rows = [...document.querySelectorAll('.dialog .list .row')];
      if (rows.length !== 4) { closeAll(); return `${label}: the menu has ${rows.length} rows, not 4`; }
      if (!atTop(rows[i])) { bad.push(`${k} row hidden`); closeAll(); continue; }
      rows[i].click(); const sh = document.querySelector('.sheet'); if (!(sh && sh.classList.contains('sheet-' + k))) bad.push(`${k} opened ${sh ? sh.className : 'nothing'}`);
      closeAll();
    }
    return `${label}: ${bad.length ? bad.join(', ') : 'ok (Bags, Hero, Quests, Social each open)'}`;
  };
  const clear = () => { if (G.fight) { for (const e of G.fight.enemies) e.hp = 1; for (let i = 0; i < 400 && G.fight; i++) G.update(0.2); } if (G.S.brawl) G.leaveBrawl(); if (G.S.run) G.leaveGroup(); if (G.S.bg) G.leaveBg(); G.S.flags.deserterUntil = 0; };
  const fightNow = () => { for (let i = 0; i < 400 && !G.fight; i++) { if (G.S.run) G.S.run.restUntil = 0; G.update(0.25); } };
  const endFight = () => { if (G.fight) { for (const e of G.fight.enemies) e.hp = 1; for (let i = 0; i < 300 && G.fight; i++) G.update(0.2); } };
  const enter = async (act) => { clear(); G.queueFor(act); if (G.S.queue) G.S.queue.popAt = Date.now() - 1; for (let i = 0; i < 20 && !G.S.run && !G.S.bg; i++) G.update(0.5); await skip(); };
  const out = [`viewport ${innerWidth}x${innerHeight}`];
  const pick = (f) => Object.keys(D.ACTIVITIES).find((k) => f(D.ACTIVITIES[k]) && G.activityBlock(k) !== 'hidden');
  for (const [label, act] of [['dungeon', pick((A) => A.dungeon && (A.size || 5) <= 5 && A.minLvl <= 60 && A.maxLvl >= 60 && !A.needQuest)], ['raid', pick((A) => (A.size || 5) > 5 && !A.worldBoss && A.minLvl <= 60)]]) {
    await enter(act); if (!G.S.run) { out.push(`${label}: did not start`); continue; }
    out.push(check(`${label} resting`)); fightNow(); out.push(check(`${label} fighting`)); endFight();
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
  clear(); console.log(out.join('\n')); return out;
})();
