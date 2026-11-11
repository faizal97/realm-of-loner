// The beta.4 dev sweep: festival items, run and realm state left by a reload or a clock change (#403 onward).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const W = require('./world');
const { G, D, B } = W; const SOC = globalThis.SOC;
const count = (id) => G.S.player.bags.filter((b) => b.item.id === id).reduce((n, b) => n + (b.n || 1), 0);

test('Longnight items stay in the bags across a reload while Longnight is on (#403)', () => {
  W.setNow(new Date(2026, 11, 20, 19).getTime());
  W.character(30); const id = G.S.id;
  G.addItem(G.copyItem('ln_snowball'), 5); G.addItem(G.copyItem('ln_stew'), 2);
  G.save(); G.logout(); G.load(id);
  assert.strictEqual(count('ln_snowball'), 5); assert.strictEqual(count('ln_stew'), 2);
});

test('a Longnight reward taken from the mail after the festival stays in the bags (#382)', () => {
  W.setNow(new Date(2026, 11, 20, 19).getTime());
  W.character(30); const id = G.S.id;
  for (let i = 0; i < 500 && !G.bagsFull(); i++) G.addItem(G.genGear('chest', 30, 2, { atype: 'mail' }), 1);
  G.ln(); G.lnGive(100000, 'test', true);
  G.save(); G.logout();
  W.setNow(new Date(2027, 0, 6, 19).getTime()); G.load(id);
  G.S.player.bags = G.S.player.bags.filter((b) => b.item.slot !== 'chest');
  const m = G.mail().find(G.mailWaiting); assert.ok(m, 'a reward letter');
  assert.ok(G.mailTake(m.id) !== false); const n = count(m.item.id); assert.ok(n > 0, 'taken');
  G.save(); G.logout(); G.load(id);
  assert.strictEqual(count(m.item.id), n);
});

test('festival dailies never reset when the clock moves to another day and back (#404)', () => {
  const t0 = new Date(2026, 9, 30, 12).getTime(); W.setNow(t0); W.character(30);
  const cap = D.EVENTS.lanternwake.cap;
  G.lwEarn(cap * 2, 'test', true); assert.strictEqual(G.lw().today, cap);
  W.setNow(t0 - 86400000); G.lw(); W.setNow(t0);
  assert.strictEqual(G.lwEarn(cap, 'test', true), 0, 'no candles past the cap');
  const t1 = new Date(2026, 11, 20, 12).getTime(); W.setNow(t1); G.ln().done = true;
  W.setNow(t1 - 86400000); G.ln(); W.setNow(t1);
  assert.ok(G.ln().done, 'the Longnight daily stays done');
});

test('festival items stack in one bag slot (#405)', () => {
  W.setNow(new Date(2026, 11, 20, 19).getTime()); W.character(30);
  for (let i = 0; i < 5; i++) G.addItem(G.copyItem('ln_snowball'), 1);
  assert.deepStrictEqual(G.S.player.bags.filter((b) => b.item.id === 'ln_snowball').map((b) => b.n), [5]);
});

test('an armour kit stays on top of the armour through every upgrade step (#406)', () => {
  W.character(60); const P = G.S.player, kit = 'hardhide_armor_kit', k = D.ITEMS[kit].kit;
  P.money = 1e9;
  const fresh = () => G.genGear('chest', 60, 3, { atype: D.CLASSES[P.cls].armorType });
  const step = (n) => { for (let i = 0; i < n; i++) G.upgradeItem({ slot: 'chest' }); return P.equip.chest.armor; };
  const apply = () => { G.addItem(G.copyItem(kit), 1); G.useItem(P.bags.findIndex((b) => b.item.id === kit)); };
  P.equip.chest = fresh(); const plain = step(2);
  P.equip.chest = fresh(); step(1); apply(); assert.strictEqual(step(1), plain + k, 'kit after a step');
  P.equip.chest = fresh(); apply(); assert.strictEqual(step(2), plain + k, 'kit before any step');
});

test('the auction house sells into a stack the bags already have, even when they are full (#407)', () => {
  W.character(30); const P = G.S.player; P.bags = []; P.money = 1e8;
  const L = G.ahListings().find((l) => G.stackable(l.item) && (l.n || 1) < 20); /* any stack that still fits on the one in the bags */ G.addItem(G.copyItem(L.item.id), 1);
  while (!G.bagsFull()) G.addItem(G.genGear('chest', 30, 1, { atype: 'mail' }), 1);
  G.ahBuy(L.id);
  assert.strictEqual(G.countItem(L.item.id), 1 + (L.n || 1));
});

test('a battleground fight left by closing the app is a lost round, and the battleground goes on (#408)', () => {
  let done = false;
  for (let tries = 0; tries < 20 && !done; tries++) {
    W.character(20); const id = G.S.id;
    G.queueFor('bg_highmoor'); for (let i = 0; i < 600 && !G.S.queue.popped; i++) W.advance(1); G.acceptPop();
    const bg = G.S.bg; if (!bg) continue; const bn = D.BG[bg.key].banners.map((b) => b[0]);
    const target = bn.slice().sort((a, b) => (bg.plan[b] || 0) - (bg.plan[a] || 0))[0];
    G.bgGo(target, bn.find((x) => x !== target));
    if (!(G.fight && G.fight.kind === 'bg')) continue;
    done = true; W.advance(1); const round = G.S.bg.round;
    G.save(); G.S = null; G.fight = null; G.pUnit = null; W.setNow(W.now() + 30000); G.load(id);
    const b2 = G.S.bg;
    assert.ok(!b2 || b2.phase === 'choose' || b2.phase === 'done', 'phase ' + (b2 && b2.phase));
    assert.ok(!b2 || b2.phase === 'done' || b2.round === round + 1, 'the round was played out');
  }
  assert.ok(done, 'reached a battleground fight');
});

test('a creature you were fighting when the app closed is back on the next load (#409)', () => {
  W.character(5); const id = G.S.id; G.S.player.place = 'northshire_abbey';
  const m = G.placeMobs().find((x) => x.state === 'alive' && !x.id.startsWith('n_')); G.engage(m.id);
  W.advance(2); assert.ok(G.fight);
  G.save(); G.S = null; G.fight = null; G.pUnit = null; W.setNow(W.now() + 20000); G.load(id);
  assert.strictEqual(G.S.world.northshire_abbey.mobs.filter((y) => y.state === 'fight').length, 0);
});

test('a clock set back between sessions keeps every timer at the time it had left (#410)', () => {
  W.character(20); const id = G.S.id, P = G.S.player; P.place = 'sentinel_hill';
  G.queueFor('deadmines'); const waitLeft = G.S.queue.popAt - W.now();
  P.cds = { x: W.now() + 120000 }; P.auras = [{ id: 'test', until: W.now() + 600000 }];
  G.save(); G.logout(); W.setNow(W.now() - 86400000); G.load(id);
  const t = W.now(), Q = G.S.player;
  assert.ok(G.S.queue.popAt - t <= waitLeft, 'queue');
  assert.ok(Q.cds.x - t <= 120000, 'cooldown'); assert.ok(Q.auras[0].until - t <= 600000, 'buff');
});

test('a clock set back mid-run never gives a negative run time or a day-long wait (#422, #410)', () => {
  W.character(20); const S = G.S; S.player.place = D.ACTIVITIES.deadmines.where;
  G.queueFor('deadmines'); S.queue.popAt = W.now() - 1; G.update(0.5); G.acceptPop();
  W.advance(3); const c0 = G.runClock();
  W.setNow(W.now() - 2 * 3600000); W.advance(1);
  assert.ok(G.runClock() >= c0, `run clock ${G.runClock()}`);
  assert.ok(S.run.restUntil - W.now() < 60000, 'rest');
});

test('the level-5 guild invitation the app closed on is asked again (#411)', () => {
  W.character(5); const id = G.S.id; G.S.player.guild = -1; G.S.flags.guildOffer = false; G.S.flags.guildOfferAt = W.now() + 1000;
  let invites = 0; const off = G.on('invite', () => invites++);
  W.advance(3); assert.strictEqual(invites, 1);
  G.save(); G.S = null; G.fight = null; G.pUnit = null; W.setNow(W.now() + 30000); G.load(id);
  W.advance(600); assert.strictEqual(invites, 2, 'asked again');
  if (typeof off === 'function') off();
});

test('a group pop left unanswered times out and says so (#412)', () => {
  W.character(20); const S = G.S; S.player.place = D.ACTIVITIES.deadmines.where;
  G.queueFor('deadmines'); S.queue.popAt = 0; W.advance(1); assert.ok(S.queue && S.queue.popped, 'a late pop still shows');
  W.advance(G.POP_WAIT / 1000 + 2);
  assert.ok(!G.S.queue, 'the pop is gone');
  assert.ok(G.S.chat.some((m) => /didn't answer in time/.test(m.text || '')));
});

test('an imported save finds its party members on the realm by name (#413)', () => {
  W.character(20); const S = G.S, id = S.id, b = S.bots.find((x) => B.factionOf(x) === G.myFaction());
  S.wparty = { members: [G.botChar(b)], place: S.player.place, until: W.now() + 300000 };
  G.save(); G.logout();
  const R = JSON.parse(W.store.getItem('azsolo.roster')); R.bots.find((x) => x.id === b.id).id = 99999; W.store.setItem('azsolo.roster', JSON.stringify(R));
  G.load(id);
  assert.strictEqual(G.S.wparty.members[0].bot.id, 99999);
});

test('an empty save code asks for one (#414)', async () => {
  W.character(5);
  await assert.rejects(G.decodeSave('  '), /Paste a save code/);
});

test('no world party forms while queued or in PvP (#415)', () => {
  W.setNow(new Date(2026, 10, 3, 20).getTime()); const { S, P } = W.character(30);
  const cnt = (k) => B.onlineIn(S, k, new Date()).filter((x) => B.factionOf(x) === G.myFaction()).length;
  let best = null; for (const k of Object.keys(D.PLACES)) { P.place = k; const a = Object.keys(D.ACTIVITIES).find((x) => !G.activityBlock(x)); if (a && cnt(k) && (!best || cnt(k) > best.c)) best = { k, a, c: cnt(k) }; }
  P.place = best.k;
  const x = B.onlineIn(S, P.place, new Date()).find((y) => B.factionOf(y) === G.myFaction()); x.level = P.level;
  const rr = Math.random; Math.random = () => 0.01; G.invite(x.id); Math.random = rr;
  G.queueFor(best.a); assert.ok(S.queue, 'queued'); W.advance(5);
  assert.ok(!S.wparty || !S.wparty.members.length, 'the answer was refused while queued');
  G.leaveQueue(); S.duelOn = { bot: x.id, name: x.name, wager: 0 };
  assert.strictEqual(G.partyBlock(), 'Not during PvP.');
});

test('joining another guild withdraws an application, and its answer never comes (#416)', () => {
  const { S, P } = W.character(60); P.guild = -1;
  const SOC = globalThis.SOC, mine = B.GUILDS.map((x, i) => i).filter((i) => B.GUILD_FACTION[i] === G.myFaction());
  SOC.apply(mine[0]); const n0 = S.chat.length; G.joinGuild(mine[1]);
  W.advance(60);
  assert.strictEqual(P.guild, mine[1]);
  assert.ok(!S.chat.slice(n0).some((m) => /application/.test(m.text || '')), 'no answer');
});

test('a guild application is still answered after a reload (#417)', () => {
  const { S, P } = W.character(60); P.guild = -1; const id = S.id;
  const SOC = globalThis.SOC, mine = B.GUILDS.map((x, i) => i).filter((i) => B.GUILD_FACTION[i] === G.myFaction());
  SOC.apply(mine[0]); G.save(); G.logout(); G.load(id);
  W.advance(60);
  assert.strictEqual(G.S.player.guild, mine[0]);
});

const helpTask = (S, place, id, botId) => { const b = botId != null ? { id: botId, name: 'Nobody' } : S.bots.find((x) => B.factionOf(x) === G.myFaction() && B.isOnline(x, new Date()) && !S.chat.some((m) => m.act && m.act.bot === x.id));
  const m = { id, ch: 'whisper', from: b.name, text: 'x', act: { kind: 'help_kill', bot: b.id, state: 'open', whisper: true, posted: W.now(), until: W.now() + 300000, mob: D.PLACES[place].mobs[0][0], n: 5, got: 0, place, pay: 100 } };
  S.chat.push(m); return m; };
const huntPlaces = (P, lv) => Object.keys(D.PLACES).filter((k) => { const p = D.PLACES[k]; return !p.safe && p.lvl && (p.mobs || []).length && p.lvl[0] <= lv + 1 && p.lvl[1] >= lv - 2 && G.canReach(P.place, k) && k !== P.place; });

test('a second Help task in another place waits until the first is done (#418)', () => {
  W.setNow(new Date(2026, 10, 3, 20).getTime()); const { S, P } = W.character(20); const pls = huntPlaces(P, 20);
  const a = helpTask(S, pls[0], 9001), b = helpTask(S, pls[1], 9002);
  globalThis.SOC.actions(a)[0].fn();
  const x = globalThis.SOC.actions(b)[0]; x.fn();
  assert.match(x.label, /Finish the task at/); assert.ok(x.disabled, 'greyed with the reason (#450)');
  assert.ok(!b.act.accepted);
});

test('Help from someone no longer on the realm is greyed: They\'re gone (#421)', () => {
  const { S, P } = W.character(20); const m = helpTask(S, huntPlaces(P, 20)[0], 9005, 999999);
  const x = globalThis.SOC.actions(m)[0];
  assert.strictEqual(x.label, "They're gone"); assert.ok(x.disabled);
});

test('Buy, Thank them and Take the order are greyed with full bags (#419)', () => {
  const { S, P } = W.character(30); P.money = 1e7; const b = S.bots[0];
  while (!G.bagsFull()) P.bags.push({ item: G.genGear('legs', 30, 1), n: 1 });
  const itemData = G.genGear('chest', 30, 2, { atype: 'mail' });
  const r = Object.values(D.RECIPES).find((x) => Object.keys(x.mats).every((k) => !G.isQuestItem(k)));
  const acts = [{ kind: 'wts', price: 100, itemData }, { kind: 'gift', itemData }, { kind: 'craft_order', rid: r.id, tip: 100, sent: false }]
    .map((a) => globalThis.SOC.actions({ ch: 'whisper', act: Object.assign({ state: 'open', bot: b.id, until: W.now() + 60000 }, a) })[0]);
  for (const x of acts) assert.ok(x.disabled && x.why, x.label);
});

test('a chat group joined and left at once never counts toward the weekly requests goal (#420)', () => {
  const { S, P } = W.character(30); P.guild = 1; const SOC = globalThis.SOC;
  let w = SOC.week(); let tries = 0; while (w.kind !== 'help' && tries++ < 8) { P.guild = (P.guild + 1) % 5; S.soc.week = null; w = SOC.week(); }
  assert.strictEqual(w.kind, 'help'); const got = w.got;
  let joins = 0;
  for (let i = 0; i < 3; i++) {
    const b = S.bots.find((y) => B.factionOf(y) === G.myFaction());
    const m = { id: 9100 + i, ch: 'lfg', from: b.name, text: 'LFM', act: { kind: 'lfg', act: 'gnomeregan', role: 'dps', leader: b.id, state: 'open', until: W.now() + 240000 } }; S.chat.push(m);
    SOC.actions(m)[0].fn(); if (S.run) { joins++; assert.ok(S.run.soc.help, 'counted at the end'); } G.leaveGroup(); S.flags.deserterUntil = 0;
  }
  assert.strictEqual(joins, 3); assert.strictEqual(SOC.week().got, got);
});

test('queueing during a world fight is refused and the party stays (#423)', () => {
  const { S } = W.character(20); const act = 'deadmines'; S.player.place = D.ACTIVITIES[act].where;
  for (const b of S.bots.filter((x) => B.factionOf(x) === G.myFaction() && x.level >= 18 && x.level <= 22).slice(0, 2)) G.addToParty(b);
  assert.ok(G.partySize() > 1);
  G.placeMobs(); const m = (S.world[S.player.place] || {}).mobs.find((x) => x.state === 'alive'); G.engage(m.id); assert.ok(G.fight);
  G.queueFor(act);
  assert.ok(!S.queue); assert.ok(G.partySize() > 1, 'the party stays');
});

test('accepting a group pop mid-trip ends the trip (#424)', () => {
  const { S } = W.character(20); const P = S.player, act = 'deadmines'; P.place = D.ACTIVITIES[act].where; const start = P.place;
  G.queueFor(act); S.queue.popAt = W.now() + 3600e3;
  const dest = Object.keys(D.PLACES).find((k) => k !== start && G.travelSecs(start, k) >= 10);
  G.travelTo(dest); assert.ok(P.travel);
  W.advance(3); S.queue.popAt = W.now() - 1; W.advance(0.5); G.acceptPop();
  assert.ok(S.run); assert.ok(!P.travel, 'the trip ended');
});

test('a wipe from reopening the app is no free pass to leave: Deserter still applies (#425)', () => {
  const { S } = W.character(20); S.player.place = D.ACTIVITIES.deadmines.where;
  G.queueFor('deadmines'); S.queue.popAt = W.now() - 1; G.update(0.5); G.acceptPop();
  S.run.restUntil = 0; G.runPull(); W.advance(1); assert.strictEqual(S.run.phase, 'fight');
  const id = S.id; G.save(); G.S = null; G.fight = null; G.pUnit = null; G.load(id);
  assert.ok(G.deserterFor(G.S.run) > 0);
});

// win every pull left in the run by setting the enemies to 1 health
function clearRun() {
  const S = G.S; let g = 0;
  while (S.run && S.run.phase !== 'done' && g++ < 200) {
    if (S.run.phase === 'rest') { S.run.restUntil = 0; G.runPull(); for (let k = 0; k < 40 && G.fight; k++) { for (const e of G.fight.enemies) if (!e.dead) e.hp = 1; for (const a of G.fight.allies) if (!a.dead) a.hp = a.maxHp; W.advance(0.5); } }
    else W.advance(1);
  }
}

test('Help Wanted at a raid\'s last boss is not a raid clear (#434)', () => {
  const { S } = W.character(60, 'warrior'); const P = S.player, act = 'molten_core';
  const Dg = D.DUNGEONS[D.ACTIVITIES[act].dungeon], last = Dg.pulls.map((p) => !!p.boss).lastIndexOf(true);
  S.helpWanted = [{ id: 'hwx', act, role: 'tank', startIdx: last, firstTimers: false, poster: S.bots[0].id, posterName: S.bots[0].name, expires: W.now() + 6e5 }];
  G.joinHelpWanted('hwx'); const m0 = G.account().marks; clearRun();
  const cx = (P.codex || {})[act] || {};
  assert.ok(!cx.clears, 'no clear counted'); assert.ok(cx.best == null, 'no best time');
  assert.strictEqual(G.hardOpen(act), false);
  assert.strictEqual(G.account().marks - m0, 18, 'only the Help Wanted Marks (10 + 5 no wipes + 3 stuck)');
});

test('a turned-in bounty stays done after the clock goes a week forward and back (#435)', () => {
  const t0 = new Date(2026, 10, 4, 12).getTime(); W.setNow(t0);
  const { S } = W.character(20, 'warrior'); const P = S.player, id = S.id;
  P.place = Object.keys(D.PLACES).find((k) => G.isHub(k) && G.bounties(k).length);
  const bs = G.bounties(P.place);
  for (const b of [bs[0], bs.find((x) => x.weekly)]) { G.acceptBounty(b); P.bounty[b.id].prog = b.n; G.turnInBounty(b); }
  G.save(); G.logout();
  W.setNow(t0 + 8 * 864e5); G.load(id); G.myBounties(); G.save(); G.logout();
  W.setNow(t0); G.load(id);
  for (const b of [bs[0], bs.find((x) => x.weekly)]) assert.strictEqual(G.bountyState(b), 'done', b.id);
});

test('a clock set back a day while playing moves every timer with it (#436-#439)', () => {
  W.character(30); const S = G.S, P = S.player; W.advance(2); G.save();
  const t = W.now(), soon = t + 60000;
  S.soc = S.soc || { next: {} }; S.soc.next.lfg = soon; S.soc.applied = { g: 1, until: soon };
  S.chat.push({ id: 'x1', text: 'LFG', act: { kind: 'lfg', until: soon } });
  P.potionAt = soon; P.ghostUntil = t + 10000; P.hearthAt = soon;
  P.casting = { what: 'hearth', start: t, end: t + 10000 }; P.fishing = { phase: 'wait', start: t, biteAt: soon };
  S.flags.deserterUntil = soon; S.flags.pendingAt = soon; S.flags.invitedAt = t;
  S.helpWanted = [{ id: 'hw', act: 'deadmines', expires: soon }];
  S.ah = Object.assign(S.ah || {}, { mine: [{ sellAt: soon, expires: soon }] });
  const back = 864e5; W.setNow(t - back); G.update(0.1);
  const left = (v) => v - W.now();
  for (const [name, v] of [['soc.next', S.soc.next.lfg], ['applied', S.soc.applied.until], ['chat until', S.chat.find((m) => m.id === 'x1').act.until],
    ['potion', P.potionAt], ['ghost', P.ghostUntil], ['hearth', P.hearthAt], ['bite', P.fishing.biteAt], ['deserter', S.flags.deserterUntil],
    ['pending', S.flags.pendingAt], ['help wanted', S.helpWanted[0].expires], ['auction', S.ah.mine[0].sellAt]])
    assert.ok(left(v) <= 61000, `${name}: ${left(v)} ms left`);
});

test('stacks hold 20 in the bags and the bank (#440)', () => {
  W.character(20); const P = G.S.player; P.bags = []; P.bank = [];
  const stacks = (list, id) => list.filter((b) => b.item.id === id).map((b) => b.n);
  G.addItem(G.copyItem('linen_cloth'), 19); G.addItem(G.copyItem('linen_cloth'), 5);
  assert.deepStrictEqual(stacks(P.bags, 'linen_cloth'), [20, 4]);
  G.addItem(G.copyItem('linen_cloth'), 56);
  assert.deepStrictEqual(stacks(P.bags, 'linen_cloth'), [20, 20, 20, 20]);
  for (let i = 0; i < 4; i++) G.bankDeposit(P.bags.findIndex((b) => b.item.id === 'linen_cloth'));
  assert.deepStrictEqual(stacks(P.bank, 'linen_cloth'), [20, 20, 20, 20]);
  G.addItem(G.copyItem('linen_cloth'), 1); G.bankWithdraw(0);
  assert.deepStrictEqual(stacks(P.bags, 'linen_cloth'), [20, 1]);
  assert.strictEqual(G.slotsShort([[G.copyItem('linen_cloth'), 45]]), Math.max(0, 3 - G.bagFree()));
});

test('Longnight items in the bank go when the festival ends, and no Snowball works after it (#441)', () => {
  W.setNow(new Date(2026, 11, 20, 19).getTime());
  W.character(30); const id = G.S.id; G.ln();
  G.addItem(G.copyItem('ln_snowball'), 5); G.bankDeposit(G.S.player.bags.findIndex((b) => b.item.id === 'ln_snowball'));
  G.save(); G.logout(); W.setNow(new Date(2027, 0, 6, 19).getTime()); G.load(id);
  assert.ok(!(G.S.player.bank || []).some((b) => b.item.id === 'ln_snowball'), 'gone from the bank');
  G.S.player.bags.push({ item: G.copyItem('ln_snowball'), n: 1 });
  const n0 = count('ln_snowball'); G.lnUse(G.S.player.bags.length - 1);
  assert.strictEqual(count('ln_snowball'), n0, 'not thrown');
});

test('an heirloom kept in the bank grows with you (#442)', () => {
  W.character(10); const id = G.S.id, P = G.S.player;
  P.bank = [{ item: G.makeHeirloom('heirloom_cloak', 10), n: 1 }];
  P.level = 60; G.save(); G.logout(); G.load(id);
  assert.deepStrictEqual(G.S.player.bank[0].item, G.makeHeirloom('heirloom_cloak', 60));
});

test('a reward sent to the bank says where it went, without a bags-full toast (#443)', () => {
  W.character(20); const P = G.S.player; const toasts = []; let on = true; G.on('toast', (t) => { if (on) toasts.push(t); });
  while (!G.bagsFull()) P.bags.push({ item: G.genGear('chest', 20, 2, { atype: 'mail' }), n: 1 });
  assert.strictEqual(G.giveReward(G.copyItem('linen_cloth'), 'Test'), 'bank');
  on = false; assert.deepStrictEqual(toasts.filter((t) => /full/i.test(String(t && t.text || t))), []);
});

test('selling an upgraded item asks first (#444)', () => {
  W.character(20); const it = G.genGear('chest', 20, 1, { atype: 'mail' }); it.pw = 0.2;
  G.S.player.equip.chest = G.genGear('chest', 25, 4, { atype: 'mail' });
  assert.strictEqual(G.sellNeedsConfirm(it), true);
});

test('no duel, and no party invite, inside a battleground or the group finder (#445, #446)', () => {
  W.character(20); const S = G.S, bot = S.bots.find((b) => b.level >= 18 && b.level <= 22);
  S.bg = { act: 'x', phase: 'choose' };
  assert.strictEqual(G.startDuel(bot.id, 0), false); assert.ok(!S.duelOn);
  const m = { ch: 'whisper', act: { kind: 'duel', state: 'open', wager: 0, bot: bot.id, until: W.now() + 6e4 } };
  assert.ok(SOC.actions(m)[0].disabled, 'the duel is greyed');
  S.flags.pendingInvite = bot.id; G.acceptPartyInvite(bot.id);
  assert.strictEqual(G.partySize(), 1, 'no party in PvP');
});

test('a sale, a carry or a duel from someone who left the realm is greyed (#447)', () => {
  W.character(20);
  for (const kind of ['wts', 'carry', 'duel']) {
    const [a] = SOC.actions({ ch: 'whisper', act: { kind, state: 'open', bot: 'gone-bot', price: 10, tip: 10, wager: 0, act: 'deadmines', itemData: G.copyItem('linen_cloth'), until: W.now() + 6e4 } });
    assert.ok(a.disabled && /gone/.test(a.label), kind);
  }
});

test('the Champion title stays earned after leaving the guild (#448)', () => {
  W.character(30); const P = G.S.player, t = D.TITLES.find((x) => x.id === 'guild_champion');
  P.guild = B.GUILDS.findIndex((g, i) => B.GUILD_FACTION[i] === G.myFaction()); P.guildRep = 0;
  SOC.addStanding(100000, 'test'); assert.ok(G.titleUnlocked(t), 'earned');
  G.setTitle('guild_champion'); SOC.leaveGuild();
  assert.ok(G.titleUnlocked(t), 'still earned'); assert.ok(G.displayName().includes('Champion'));
});

test('a craft order you took does not nudge you (#449)', () => {
  W.character(20); const S = G.S, b = S.bots[0];
  S.chat.push({ id: 'co1', ch: 'whisper', from: b.name, text: 'craft?', act: { kind: 'craft_order', whisper: true, state: 'open', bot: b.id, sent: true, posted: W.now(), until: W.now() + 20 * 60000 } });
  W.advance(150);
  assert.ok(!S.chat.some((m) => m.ref === 'co1'), 'no nudge');
});

test('Help is greyed with the reason when the party is full or you are in the group finder (#450)', () => {
  const { S, P } = W.character(20); const m = helpTask(S, huntPlaces(P, 20)[0], 9010);
  for (const b of S.bots.filter((x) => x.level >= 18 && x.level <= 22).slice(0, 2)) G.addToParty(b);
  let x = SOC.actions(m)[0]; assert.strictEqual(x.label, 'Party full'); assert.ok(x.disabled);
  S.queue = { act: 'deadmines' };
  x = SOC.actions(m)[0]; assert.strictEqual(x.label, 'Not while in the group finder'); assert.ok(x.disabled);
});

test('the Help Wanted poster becomes a friend once the run is done (#451)', () => {
  const { S } = W.character(20); const poster = S.bots.find((b) => b.level >= 18 && b.level <= 22);
  S.helpWanted = [{ id: 'hwf', act: 'deadmines', role: 'tank', startIdx: 0, firstTimers: false, poster: poster.id, posterName: poster.name, expires: W.now() + 6e5 }];
  S.player.place = D.ACTIVITIES.deadmines.where; G.joinHelpWanted('hwf'); clearRun();
  assert.ok(SOC.isFriend(poster.id));
});

test('a guild night refused for Deserter closes instead of staying Signed up (#452)', () => {
  const { S } = W.character(30); const g = SOC.myGuilds().find((x) => x.min <= 30).g; G.joinGuild(g);
  const b = S.bots.find((x) => x.guild === g), act = 'deadmines';
  const m = { id: 9200, ch: 'guild', from: b.name, text: 'event', act: { kind: 'g_event', guild: true, bot: b.id, act, startAt: W.now() + 1000, until: W.now() + 360000, signed: true, state: 'open' } };
  S.chat.push(m); S.flags.deserterUntil = W.now() + 300000;
  W.advance(3);
  assert.notStrictEqual(m.act.state, 'open');
});

test('leaving and rejoining a guild in the same week keeps its weekly goal (#453)', () => {
  W.setNow(new Date(2026, 10, 4, 12).getTime());
  W.character(30); const g = SOC.myGuilds().find((x) => x.min <= 30).g; G.joinGuild(g);
  const w = SOC.week(); w.got = 8; const got = w.got;
  SOC.leaveGuild(); G.joinGuild(g);
  assert.strictEqual(SOC.week().got, got);
});

test('a story scene during a run does not use up par time (#454)', () => {
  W.character(20); const S = G.S; S.player.place = D.ACTIVITIES.deadmines.where;
  G.queueFor('deadmines'); S.queue.popAt = W.now() - 1; G.update(0.5); G.acceptPop();
  G.paused = true; try { W.advance(38); } finally { G.paused = false; }
  assert.ok(G.runClock() < 2, `run clock ${G.runClock()}`);
});

test('declining a pop does not use up a Legend\'s visit (#455)', () => {
  W.character(20); const S = G.S, P = S.player; P.place = D.ACTIVITIES.deadmines.where;
  for (const k of Object.keys(D.LEGENDS)) P.done[D.LEGENDS[k].unlock] = true;
  const chance = G.CAMEO_CHANCE; G.CAMEO_CHANCE = 1;
  try {
    G.queueFor('deadmines'); S.queue.popAt = W.now() - 1; W.advance(1.5);
    const guest = ((S.queue && S.queue.group && S.queue.group.members) || []).find((m) => m.cameo);
    assert.ok(guest, 'a Legend in the pop'); G.declinePop();
    assert.ok(!((P.legendMem || {})[guest.legend] || {}).last, 'not marked as seen');
  } finally { G.CAMEO_CHANCE = chance; }
});

test('a battleground joined from chat starts at full health and ends your trip (#456, #457)', () => {
  W.character(30); const S = G.S, P = S.player, bg = Object.keys(D.ACTIVITIES).find((k) => D.ACTIVITIES[k].bg && D.ACTIVITIES[k].minLvl <= 30);
  P.hp = 10; P.travel = { to: 'x', from: P.place, start: W.now(), end: W.now() + 60000 };
  G.joinChatGroup(bg, G.role(), { leader: S.bots[0].id });
  assert.ok(S.bg, 'in the battleground');
  assert.strictEqual(P.hp, null, 'full health'); assert.strictEqual(P.travel, null, 'trip over');
});

test('leaving a battleground mid-match gives Deserter and counts as played (#458)', () => {
  W.character(30); const S = G.S, bg = Object.keys(D.ACTIVITIES).find((k) => D.ACTIVITIES[k].bg && D.ACTIVITIES[k].minLvl <= 30);
  G.bgStart(bg); const n0 = G.pvpStats().bgPlayed || 0;
  G.leaveBg();
  assert.ok(!S.bg); assert.ok(S.flags.deserterUntil > W.now(), 'Deserter');
  assert.strictEqual(G.pvpStats().bgPlayed, n0 + 1);
});

test('a battleground joined from chat counts toward the weekly requests goal when it ends (#420)', () => {
  const { S, P } = W.character(30); P.guild = 1;
  let w = SOC.week(); let tries = 0; while (w.kind !== 'help' && tries++ < 8) { P.guild = (P.guild + 1) % 5; S.soc.week = null; w = SOC.week(); }
  assert.strictEqual(w.kind, 'help'); const got = w.got;
  const bg = Object.keys(D.ACTIVITIES).find((k) => D.ACTIVITIES[k].bg && D.ACTIVITIES[k].minLvl <= 30), b = S.bots.find((y) => B.factionOf(y) === G.myFaction());
  const m = { id: 9300, ch: 'lfg', from: b.name, text: 'LFM', act: { kind: 'lfg', act: bg, role: 'dps', leader: b.id, state: 'open', until: W.now() + 240000 } }; S.chat.push(m);
  SOC.actions(m)[0].fn(); assert.ok(S.bg, 'in the battleground');
  const C = D.BG[S.bg.key]; S.bg.round = C.rounds;
  G.bgGo(C.banners[0][0], C.banners[1][0]);
  for (let k = 0; k < 200 && S.bg.phase !== 'done'; k++) { if (G.fight) for (const e of G.fight.enemies) if (!e.dead) e.hp = 1; W.advance(0.5); }
  assert.strictEqual(S.bg.phase, 'done'); assert.strictEqual(SOC.week().got, got + 1);
});
