// Back on a quest's page goes back, never stacks (#113): paste into the browser console on the game page (a local build,
// /dev/ or the beta page) with a character entered. It takes two quests from the people here if it has none, then:
// opens the Quest Log, a quest, its Back, three times, and checks that exactly one sheet is open, it is the Quest Log,
// and it has no ‹ Back of its own (nothing stacked under it); the same from a quest giver's page; and Abandon from a
// quest's page lands on the log, not on a log above the quest. It changes the character's quests: use a test character.
// Prints one line per check and a total.
(async () => {
  const W = (ms) => new Promise((r) => setTimeout(r, ms));
  const P = G.S.player, D = window.D, out = []; let bad = 0;
  const ok = (c, m) => { out.push((c ? 'ok   ' : 'FAIL ') + m); if (!c) bad++; };
  const sheets = () => document.querySelectorAll('.sheet-back').length;
  const title = () => { const t = document.querySelector('.sheet-h h2'); return t ? t.firstChild.textContent : null; };
  const stacked = () => !!document.querySelector('.sheet-backbtn');
  const btn = (text, scope) => [...(scope || document).querySelectorAll('button')].find((b) => b.textContent.trim() === text);
  const rowFor = (name) => [...document.querySelectorAll('.sheet button.row')].find((b) => b.textContent.includes(name));
  const close = async () => { const x = document.querySelector('.sheet .x'); if (x) x.click(); await W(150); };
  // two quests to look at
  const here = D.PLACES[P.place];
  for (const npc of here.npcs) for (const { qid } of G.npcQuests(npc)) if (Object.keys(P.quests).length < 2 && G.questState(qid) === 'available') G.accept(qid);
  const qs = Object.keys(P.quests); ok(qs.length >= 1, `a quest to open (${qs.length} held)`); if (!qs.length) return console.log(out.join('\n'));
  const Q = D.QUESTS[qs[0]];
  // 1. from the Quest Log: open the quest, Back, three times
  await close(); btn('Quests', document.querySelector('nav')).click(); await W(200);
  for (let i = 0; i < 3; i++) { rowFor(Q.name).click(); await W(150); btn('Back', document.querySelector('.sheet')).click(); await W(150); }
  ok(sheets() === 1 && title() === 'Quest Log' && !stacked(), `log → quest → Back ×3 leaves one Quest Log with nothing under it (${sheets()} sheet, "${title()}", ‹ Back ${stacked() ? 'shown' : 'none'})`);
  // the header's ‹ Back does the same
  rowFor(Q.name).click(); await W(150); document.querySelector('.sheet-backbtn').click(); await W(150);
  ok(sheets() === 1 && title() === 'Quest Log' && !stacked(), 'log → quest → ‹ Back leaves one Quest Log');
  // 2. from a quest giver's page
  const giver = here.npcs.find((n) => G.npcQuests(n).some((x) => P.quests[x.qid] || x.st === 'available'));
  if (giver) {
    await close(); btn('People').click(); await W(200); // the People tab lists who is here
    [...document.querySelectorAll('#panel button, .panel button')].find((b) => b.textContent.includes(D.NPCS[giver].name)).click(); await W(200);
    const GQ = D.QUESTS[G.npcQuests(giver)[0].qid];
    for (let i = 0; i < 3; i++) { const r = rowFor(GQ.name); if (!r) break; r.click(); await W(150); btn('Back', document.querySelector('.sheet')).click(); await W(150); }
    ok(sheets() === 1 && title() === D.NPCS[giver].name && !stacked(), `quest giver → quest → Back ×3 leaves one ${D.NPCS[giver].name} page (${sheets()} sheet, "${title()}", ‹ Back ${stacked() ? 'shown' : 'none'})`);
  } else ok(true, 'no quest giver here with a quest (skipped)');
  // 3. Abandon from a quest's page lands on the log, nothing stacked
  await close(); btn('Quests', document.querySelector('nav')).click(); await W(200);
  const last = D.QUESTS[Object.keys(P.quests).slice(-1)[0]];
  rowFor(last.name).click(); await W(150); btn('Abandon', document.querySelector('.sheet')).click(); await W(150);
  ok(sheets() === 1 && title() === 'Quest Log' && !stacked() && !rowFor(last.name), `Abandon lands on the Quest Log, refreshed (${sheets()} sheet, "${title()}", ‹ Back ${stacked() ? 'shown' : 'none'})`);
  await close();
  console.log(out.join('\n') + `\nquestback: ${out.length - bad}/${out.length} checks pass`);
})();
