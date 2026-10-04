// Buffs and debuffs in the frames (#79): paste into the browser console on the game page (the beta page, or a local
// build) with a level-60 character entered, at the phone size you want to check (375x812, 412x915). In a dungeon boss
// fight it gives you, a party member and the boss eight long harmless buffs (30 min, like food and flasks) and one debuff,
// and checks that in each frame the debuff is an icon you can see (inside the row, not folded) while "+N" holds the long
// buffs and is not red; then it overfills the rows with debuffs and checks "+N" turns red; then a tap on "+N" lists every
// aura with what it does, who put it there and the time left. Prints one line per check. Use a test character.
(async () => {
  const W = (ms) => new Promise((r) => setTimeout(r, ms)), out = [`viewport ${innerWidth}x${innerHeight}`];
  // the frames paint in the game's animation-frame loop, which a hidden tab pauses: run it on timers while checking
  const rAF = window.requestAnimationFrame; window.requestAnimationFrame = (f) => setTimeout(() => f(performance.now()), 16);
  const skip = async () => { for (let j = 0; j < 8; j++) { const b = [...document.querySelectorAll('button')].find((x) => /^(Skip|Enter|Accept|Join)/.test(x.textContent.trim())); if (!b) break; b.click(); await W(250); } };
  if (G.S.run) G.leaveGroup(); G.S.flags.deserterUntil = 0;
  const act = Object.keys(D.ACTIVITIES).find((k) => { const A = D.ACTIVITIES[k]; return A.dungeon && (A.size || 5) === 5 && A.minLvl <= 60 && A.maxLvl >= 60 && !A.needQuest && !A.worldBoss && G.activityBlock(k) !== 'hidden'; });
  G.S.player.place = D.ACTIVITIES[act].where; G.queueFor(act); if (G.S.queue) G.S.queue.popAt = Date.now() - 1; for (let i = 0; i < 20 && !G.S.run; i++) G.update(0.5); await skip();
  const R = G.S.run; R.idx = R.pulls.map((p, i) => (p.boss ? i : -1)).filter((i) => i >= 0).pop(); R.phase = 'rest';
  for (let i = 0; i < 400 && !G.fight; i++) { R.restUntil = 0; G.update(0.25); }
  const C = G.fight; if (!C) return 'no fight started';
  const boss = C.enemies[0], mate = C.allies.find((u) => u !== G.pUnit && u.kind !== 'pet'), me = G.pUnit;
  G.setTarget(boss.uid); G.emit('change'); await W(300);
  const longBuffs = (u) => { for (let i = 0; i < 8; i++) u.auras.push({ id: 'test_long' + i, name: 'Long buff ' + (i + 1), icon: 'power_word_fortitude', stats: { sta: 1 }, until: C.t + 1800 }); };
  const debuff = (u, n) => u.auras.push({ id: 'test_debuff' + (n || ''), name: 'Test Poison' + (n ? ' ' + n : ''), icon: 'corruption', dot: 5, every: 3, school: 'nature', src: u.side === 'enemy' ? me.uid : boss.uid, until: C.t + 12 + (n || 0) });
  for (const u of [me, mate, boss]) { longBuffs(u); debuff(u); }
  await W(700);
  const boxes = () => [['your frame', document.querySelector('.frames .uf:not(.target) .buffs')], ['the target frame', document.querySelector('.frames .uf.target .buffs')], [`${mate.name.split('-')[0]}'s party row`, document.querySelector(`[data-au="${mate.uid}"]`)]];
  const visibleDebuff = (box) => { const r = box.getBoundingClientRect(); return [...box.querySelectorAll('.au.de')].some((c) => { const q = c.getBoundingClientRect(); return q.width > 0 && q.left >= r.left - 1 && q.right <= r.right + 1; }); };
  for (const [name, box] of boxes()) {
    if (!box) { out.push(`${name}: NO ROW`); continue; }
    const more = box.querySelector('.au.more');
    out.push(`${name}: ${visibleDebuff(box) ? 'the debuff shows' : 'DEBUFF NOT VISIBLE'}, ${box.querySelectorAll('.au:not(.more)').length} icons + ${more ? more.textContent : 'no fold'}${more && more.classList.contains('lost') ? ' (RED: wrong, only long buffs folded)' : ''}`);
  }
  // overfill with debuffs: "+N" turns red, and its list has every aura
  for (const u of [me, mate, boss]) for (let n = 1; n <= 12; n++) debuff(u, n);
  await W(700);
  for (const [name, box] of boxes()) { if (!box) continue; const more = box.querySelector('.au.more'); out.push(`${name}, 13 debuffs: ${visibleDebuff(box) ? 'debuffs show first' : 'NO DEBUFF VISIBLE'}, "+N" ${more && more.classList.contains('lost') ? 'is red' : 'IS NOT RED'}`); }
  const [, tb] = boxes()[1], more = tb && tb.querySelector('.au.more');
  if (more) { more.click(); await W(200); const rows = [...document.querySelectorAll('.dialog .list .row')], mine = rows.filter((r) => /Long buff|Test Poison/.test(r.textContent)).length;
    const poison = rows.find((r) => /Test Poison/.test(r.textContent));
    out.push(`"+N" list: ${rows.length} rows, ${mine} of the 21 test auras${mine === 21 ? '' : ' (MISSING SOME)'}; a debuff row reads "${poison ? poison.querySelector('small').textContent : 'NONE'}"`);
    const d = document.querySelector('.dialog'); if (d) d.click(); }
  for (const u of [me, mate, boss]) u.auras = u.auras.filter((a) => !/^test_/.test(a.id));
  for (const e of C.enemies) e.hp = 1; for (let i = 0; i < 300 && G.fight; i++) G.update(0.2); if (G.S.run) G.leaveGroup(); G.S.flags.deserterUntil = 0;
  window.requestAnimationFrame = rAF;
  console.log(out.join('\n')); return out;
})();
