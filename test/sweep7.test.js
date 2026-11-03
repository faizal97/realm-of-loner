// The beta.5 dev sweep: weekly goals and the clock, items with full bags, runs started over a finished one (#469 onward).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const W = require('./world');
const { G, D } = W; const SOC = globalThis.SOC;
// one kill short of the weekly goal, then the kill: true when it paid
const finishWeek = () => {
  const w = SOC.week(); if (w.done) return false;
  Object.assign(w, { kind: 'kill', got: w.goal - 1 }); const m0 = G.S.player.money;
  SOC.onKill(D.PLACES[G.S.player.place].mobs ? D.PLACES[G.S.player.place].mobs[0] : Object.keys(D.MOBS)[0]);
  return G.S.player.money > m0;
};

test('a weekly guild reward paid in another guild is not paid again on rejoining (#469)', () => {
  W.setNow(new Date(2026, 10, 4, 12).getTime());
  W.character(30); const gs = SOC.myGuilds().filter((x) => x.min <= 30).map((x) => x.g);
  G.joinGuild(gs[0]); SOC.week(); SOC.leaveGuild();
  G.joinGuild(gs[1]); assert.ok(finishWeek(), 'paid in the second guild'); SOC.leaveGuild();
  G.joinGuild(gs[0]); assert.ok(SOC.week().done, 'already paid this week'); assert.ok(!finishWeek());
});

test('the clock moved a week forward and back pays the guild weekly goal once a week (#471)', () => {
  const t0 = new Date(2026, 10, 4, 12).getTime(); W.setNow(t0);
  W.character(30); G.joinGuild(SOC.myGuilds().find((x) => x.min <= 30).g);
  assert.ok(finishWeek());
  W.setNow(t0 + 7 * 86400000); assert.ok(finishWeek(), 'a new week pays');
  W.setNow(t0); assert.ok(SOC.week().done); assert.ok(!finishWeek(), 'not again for the old week');
});

// a Trial cleared in time at level lvl, as the run's end reports it
const trialWin = (lvl) => {
  const Rec = G.trials(), act = G.trialPicks()[0];
  return G.trialDone({ act, trial: { lvl, season: Rec.season, bestHere: 0 } }, 60, 600);
};

test('the clock moved a week forward and back pays the weekly Trials goal once a week (#471)', () => {
  const t0 = new Date(2026, 10, 9, 12).getTime(); W.setNow(t0); W.character(60);
  const marks = () => G.account().marks;
  for (let i = 0; i < 4; i++) trialWin(2);
  W.setNow(t0 + 7 * 86400000); for (let i = 0; i < 4; i++) trialWin(2);
  W.setNow(t0); const m0 = marks(); for (let i = 0; i < 4; i++) trialWin(2);
  assert.strictEqual(marks() - m0, 4 * 7, 'only the Trials\' own Marks, no second weekly goal');
});

test('the clock moved to next month and back keeps this month\'s Trials (#472)', () => {
  const t0 = new Date(2026, 10, 20, 12).getTime(); W.setNow(t0); W.character(60);
  trialWin(8); const act = G.trialPicks()[0], open = G.trials().open[act];
  W.setNow(new Date(2026, 11, 2, 12).getTime()); G.trials();
  W.setNow(t0); const Rec = G.trials();
  assert.strictEqual(Rec.best[act].lvl, 8); assert.strictEqual(Rec.open[act], open);
  assert.ok(!Rec.history.some((h) => h.season === Rec.season), 'no history for a month not over');
});

test('a story scene during a pull does not stop the run clock (#470)', () => {
  W.character(20); const S = G.S; S.player.place = D.ACTIVITIES.deadmines.where;
  G.queueFor('deadmines'); S.queue.popAt = W.now() - 1; G.update(0.5); G.acceptPop();
  G.runPull(); W.advance(0.5);
  assert.ok(G.fight, 'a pull started'); const c0 = G.runClock();
  G.paused = true; try { W.advance(5); } finally { G.paused = false; }
  assert.ok(G.runClock() - c0 > 4, `run clock moved ${G.runClock() - c0}`);
});

test('a guild night signed up for does not start when you come back after it (#473)', () => {
  const { S } = W.character(30); const g = SOC.myGuilds().find((x) => x.min <= 30).g; G.joinGuild(g);
  const b = S.bots.find((x) => x.guild === g);
  const m = { id: 9300, ch: 'guild', from: b.name, text: 'event', act: { kind: 'g_event', guild: true, bot: b.id, act: 'deadmines', startAt: W.now() + 60000, until: W.now() + 240000, signed: true, state: 'open' } };
  S.chat.push(m); W.setNow(W.now() + 5 * 3600000); SOC.tick();
  assert.ok(!S.run, 'no run'); assert.notStrictEqual(m.act.state, 'open');
});

const fillBags = (P) => { while (P.bags.length < G.bagCap()) P.bags.push({ item: G.genGear('chest', 30, 1, { atype: 'mail' }), n: 1 }); };

test('gathering into the last room of a stack keeps what fits (#474)', () => {
  let tried = 0;
  for (let k = 0; k < 40 && tried < 3; k++) {
    const { P } = W.character(32, 'warrior', 'human');
    P.prof = { mining: { skill: 300, known: [] }, herbalism: { skill: 300, known: [] } };
    P.place = Object.keys(D.PLACES).find((p) => { P.place = p; return G.placeNodes().length; });
    const nd = G.placeNodes().find((x) => x.N.n[1] > 1); if (!nd) continue;
    P.bags = [{ item: G.copyItem(nd.N.item), n: 19 }]; fillBags(P);
    G.gatherNode(nd.i); W.advance(4); tried++;
    assert.strictEqual(P.bags.find((b) => b.item.id === nd.N.item).n, 20, 'the one that fits goes in');
  }
  assert.ok(tried > 0);
});

test('a stackable reward sent to the bank joins a stack there (#476)', () => {
  const { P } = W.character(30); P.bags = []; fillBags(P);
  P.bank = [{ item: G.copyItem('linen_cloth'), n: 5 }];
  G.giveReward(G.copyItem('linen_cloth'), 'test'); G.giveReward(G.copyItem('linen_cloth'), 'test');
  assert.deepStrictEqual(P.bank.map((b) => b.n), [7]);
});

test('stacks over 20 from an old save split into 20s on load (#485)', () => {
  const { P, S } = W.character(30); P.bags = [{ item: G.copyItem('linen_cloth'), n: 45 }]; P.bank = [{ item: G.copyItem('linen_cloth'), n: 60 }];
  G.save(); G.logout(); G.load(S.id);
  const n = (list) => list.filter((b) => b.item.id === 'linen_cloth').map((b) => b.n);
  assert.deepStrictEqual(n(G.S.player.bags), [20, 20, 5]); assert.deepStrictEqual(n(G.S.player.bank), [20, 20, 20]);
});

test('crafting with full bags starts when its materials empty a slot (#486)', () => {
  const r = Object.values(D.RECIPES).find((x) => Object.keys(x.mats).length === 1 && !x.rare && G.stackable(D.ITEMS[x.makes]) === false);
  const { P } = W.character(30); P.prof = { [r.prof]: { skill: r.sk[0], known: [] } };
  const [m] = Object.keys(r.mats); P.bags = [{ item: G.copyItem(m), n: r.mats[m] }]; fillBags(P);
  assert.strictEqual(G.craft(r.id, 1), true);
});

const chatReq = (act) => ({ ch: 'whisper', act: Object.assign({ state: 'open', posted: W.now(), until: W.now() + 5 * 60000 }, act) });

test('a swap from someone who left the realm is greyed (#482)', () => {
  W.character(20); G.addItem(G.copyItem('linen_cloth'), 6);
  const m = chatReq({ kind: 'swap', bot: 'nobody', item: 'linen_cloth', n: 5, itemData: G.genGear('chest', 20, 2, { atype: 'mail' }) });
  const [first] = SOC.actions(m); assert.strictEqual(first.label, "They're gone"); assert.ok(first.disabled);
});

test('Join and Run it are greyed with the reason while queued or a Deserter (#483)', () => {
  const { S } = W.character(20); S.player.place = D.ACTIVITIES.deadmines.where;
  const lfg = chatReq({ kind: 'lfg', bot: S.bots[0].id, leader: S.bots[0].id, act: 'deadmines', role: 'dps' });
  const carry = chatReq({ kind: 'carry', bot: S.bots[0].id, act: 'deadmines', tip: 500 });
  G.queueFor('deadmines');
  for (const m of [lfg, carry]) { const [x] = SOC.actions(m); assert.ok(x.disabled, x.label); assert.strictEqual(x.label, 'Not while in the group finder'); }
  G.leaveQueue ? G.leaveQueue() : (S.queue = null); S.flags.deserterUntil = W.now() + 120000;
  const [x] = SOC.actions(lfg); assert.ok(x.disabled && /^Deserter/.test(x.label), x.label);
});

test('a clock set back moves who just posted LFG and which chat lines were heard (#484)', () => {
  const t0 = W.now(); const { S } = W.character(20); const id = S.id;
  S.lfAt = { [S.bots[0].id]: t0 }; S.chatHeard = { someLine: t0 };
  G.save(); G.logout(); W.setNow(t0 - 86400000); G.load(id);
  assert.ok(G.S.lfAt[S.bots[0].id] <= W.now(), 'LFG post not in the future'); assert.ok(G.S.chatHeard.someLine <= W.now(), 'chat line not in the future');
});

test('an imported save code counts the time since it was made (#480)', async () => {
  const t0 = W.now(); const { S } = W.character(20); S.player.place = D.ACTIVITIES.deadmines.where;
  G.queueFor('deadmines'); S.queue.popAt = W.now() - 1; G.update(0.5); G.acceptPop(); assert.ok(G.S.run);
  const code = await G.encodeSave(G.S); for (const c of G.characters()) if (c.id !== G.S.id) G.deleteCharacter(c.id); // room for one more
  W.setNow(t0 + 7 * 86400000); const id = await G.importSave(code); const rep = G.load(id);
  assert.ok(rep.away > 6 * 86400000, `away ${rep.away}`); assert.ok(!G.S.run, 'the stale run ended');
});

test('a Longnight item kept after the festival says it works next Longnight, and does (#475)', () => {
  const toasts = []; const off = (t) => toasts.push(t); G.on('toast', off);
  W.setNow(new Date(2027, 0, 6, 19).getTime()); const { P } = W.character(30);
  P.bags.push({ item: G.copyItem('ln_snowball'), n: 3 });
  G.lnUse(P.bags.length - 1); assert.ok(toasts.some((t) => /next Longnight/.test(t)), toasts.join(' | '));
  assert.ok(G.canDiscard(P.bags[P.bags.length - 1].item), 'can be thrown away');
  W.setNow(new Date(2027, 11, 20, 19).getTime()); G.ln();
  const n0 = P.bags.find((b) => b.item.id === 'ln_snowball').n; G.lnUse(P.bags.findIndex((b) => b.item.id === 'ln_snowball'));
  assert.ok((P.bags.find((b) => b.item.id === 'ln_snowball') || { n: 0 }).n < n0, 'thrown next year');
});

test('Help Wanted never posts or joins a dungeon the storm hides (#477)', () => {
  const { S } = W.character(60, 'warrior', 'human');
  const storm = Object.keys(D.ACTIVITIES).filter((k) => { const A = D.ACTIVITIES[k]; return A.dungeon && A.where && G.stormBlocks(A.where); });
  assert.ok(storm.length, 'some dungeon is behind the storm');
  for (let i = 0; i < 300; i++) { S.flags.nextHelpWanted = 0; S.helpWanted = []; W.advance(1); assert.ok(!S.helpWanted.some((r) => storm.includes(r.act)), 'posted a storm dungeon'); }
  S.helpWanted = [{ id: 'hws', act: storm[0], role: 'dps', posterName: 'Someone', expires: W.now() + 60000 }];
  G.joinHelpWanted('hws'); assert.ok(!S.run, 'no run behind the storm');
});

test('a level-1 friend is never seated in a level-33 dungeon run (#478)', () => {
  const { S } = W.character(38);
  const act = Object.keys(D.ACTIVITIES).find((k) => { const A = D.ACTIVITIES[k]; return A.dungeon && (A.size || 5) === 5 && A.minLvl >= 30 && A.minLvl <= 38 && !A.needQuest; });
  const low = S.bots[0]; low.level = 1; S.player.place = D.ACTIVITIES[act].where;
  assert.ok(G.joinChatGroup(act, 'dps', { leader: low.id, soc: { kind: 'lfg', leader: low.id } }));
  assert.ok(!S.group.members.some((m) => m.bot && m.bot.id === low.id), 'the low friend is not in the run');
});
