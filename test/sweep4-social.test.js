// Chat requests (beta.3 sweep 2): one weekly guild reward a week (#348), a task ends with its person (#351, #356),
// team-ups for finished quests (#352), Help Wanted posters (#357, #364), No thanks to a guild (#358), gifts wait
// quietly (#359), what counts as open (#360), Apply by level (#361), Trial and battleground leaders (#362), "saw u" (#365).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const W = require('./world');
const { G, D, B, character, advance } = W;
const SOC = globalThis.SOC;
const mine = (S, f) => S.bots.find((x) => B.factionOf(x) === G.myFaction() && (!f || f(x)));
const huntPlace = (L) => Object.keys(D.PLACES).find((k) => (D.PLACES[k].mobs || []).length && D.PLACES[k].lvl && D.PLACES[k].lvl[0] <= L && D.PLACES[k].lvl[1] >= L - 2 && !D.PLACES[k].safe);

test('the weekly guild goal pays once a week, leaving and rejoining or not (#348)', () => {
  const { P } = character(30); const g = SOC.myGuilds().find((x) => x.min <= 30).g; G.joinGuild(g);
  const dact = Object.keys(D.ACTIVITIES).find((k) => D.ACTIVITIES[k].dungeon);
  let paid = 0;
  for (let i = 0; i < 3; i++) {
    const w = SOC.week(), before = P.money;
    if (!w.done) { w.got = w.goal - 1; if (w.kind === 'kill') SOC.onKill('x'); else if (w.kind === 'boss') SOC.onRunComplete({ act: dact }); else { w.got = w.goal; w.done = true; } }
    if (P.money > before) paid++;
    SOC.leaveGuild(); G.joinGuild(g);
  }
  assert.ok(paid <= 1, `paid ${paid} times`);
});

test('a help task ends when its person leaves your party (#351)', () => {
  const { S, P } = character(30); const pl = huntPlace(30); P.place = pl;
  const b = mine(S, (x) => Math.abs(x.level - 30) <= 3), mob = D.PLACES[pl].mobs[0][0];
  const m = { id: 9500, ch: 'whisper', from: b.name, text: 'help', act: { kind: 'help_kill', whisper: true, bot: b.id, place: pl, mob, n: 4, got: 0, pay: 777, state: 'open', posted: Date.now(), until: Date.now() + 900000 } };
  S.chat.push(m); SOC.actions(m)[0].fn();
  assert.ok(S.wparty, 'in a party');
  S.wparty = null; SOC.tick();
  assert.strictEqual(SOC.activeTasks().length, 0);
  const m0 = P.money; for (let i = 0; i < 4; i++) SOC.onKill(mob);
  assert.strictEqual(P.money, m0, 'solo kills pay nothing');
});

test('leaving your guild sends a guildmate you were helping home (#356)', () => {
  const { S, P } = character(30); const g = SOC.myGuilds().find((x) => x.min <= 30).g; G.joinGuild(g);
  const b = S.bots.find((x) => x.guild === g), pl = huntPlace(30); P.place = pl;
  const m = { id: 9300, ch: 'guild', from: b.name, text: 'help', act: { kind: 'help_kill', guild: true, bot: b.id, place: pl, mob: D.PLACES[pl].mobs[0][0], n: 5, got: 0, pay: 500, state: 'open', until: Date.now() + 900000 } };
  S.chat.push(m); SOC.actions(m)[0].fn();
  SOC.leaveGuild();
  assert.ok(!(S.wparty && S.wparty.members.some((x) => x.bot.id === b.id)));
});

test('a team-up for a quest already done closes instead of paying (#352)', () => {
  const { S, P } = character(12);
  const qid = Object.keys(D.QUESTS).find((q) => { const Q = D.QUESTS[q]; return !Q.group && !Q.dungeon && (Q.objs || []).some((o) => o.type === 'kill'); });
  P.quests[qid] = P.quests[qid] || {};
  const qc = G.questComplete; G.questComplete = (q) => (q === qid ? true : qc(q));
  try {
    const b = mine(S, (x) => !SOC.isFriend(x.id)), marks0 = G.account().marks;
    const m = { id: 9400, ch: 'whisper', from: b.name, text: 'team?', act: { kind: 'quest_team', whisper: true, bot: b.id, qid, mob: D.QUESTS[qid].objs.find((o) => o.type === 'kill').mob, place: P.place, state: 'open', posted: Date.now(), until: Date.now() + 1200000 } };
    S.chat.push(m); SOC.tick();
    assert.strictEqual(m.act.state, 'expired');
    assert.strictEqual(G.account().marks, marks0);
  } finally { G.questComplete = qc; }
});

test("No thanks to a whispered guild invite: that guild doesn't ask again (#358)", () => {
  const { S, P } = character(20); P.guild = -1;
  const g = SOC.myGuilds()[0].g, b = mine(S);
  const m = { id: 9001, ch: 'whisper', from: b.name, text: 'x', act: { kind: 'guild_invite', whisper: true, bot: b.id, g, state: 'open', until: Date.now() + 300000 } };
  S.chat.push(m); SOC.actions(m).find((x) => x.label === 'No thanks').fn();
  assert.ok((S.flags.declinedGuilds || []).includes(g));
});

test('a thank-you gift gets no nudge and no goodbye (#359)', () => {
  const { S } = character(20); const b = mine(S);
  const m = { id: 9200, ch: 'whisper', from: b.name, text: 'sent u gold', act: { kind: 'gift', whisper: true, bot: b.id, gold: 500, state: 'open', posted: Date.now(), until: Date.now() + 600000 } };
  S.chat.push(m); const n0 = S.chat.length;
  for (let i = 0; i < 12; i++) { W.setNow(W.now() + 60000); SOC.tick(); }
  assert.strictEqual(S.chat.slice(n0).filter((x) => x.ref === m.id).length, 0);
});

test('a signed-up guild event and a taken craft order are not open requests (#360)', () => {
  const { S } = character(30); const g = SOC.myGuilds().find((x) => x.min <= 30).g; G.joinGuild(g);
  const b = S.bots.find((x) => x.guild === g), act = Object.keys(D.ACTIVITIES).find((k) => D.ACTIVITIES[k].dungeon);
  const m = { id: 9100, ch: 'guild', from: b.name, text: 'event', act: { kind: 'g_event', guild: true, bot: b.id, act, startAt: Date.now() + 180000, until: Date.now() + 360000, signed: false, state: 'open' } };
  S.chat.push(m); SOC.actions(m)[0].fn();
  assert.ok(!SOC.isOpenRequest(m));
  assert.ok(!SOC.isOpenRequest({ act: { kind: 'craft_order', state: 'open', sent: true } }));
});

test("Apply is greyed with the level for a guild you're too low for (#361)", () => {
  const { S, P } = character(10); P.guild = -1;
  const gi = SOC.myGuilds().find((x) => x.min > 10), b = mine(S);
  const m = { id: 9600, ch: 'general', from: b.name, text: 'recruiting', act: { kind: 'guild_apply', bot: b.id, g: gi.g, state: 'open', until: Date.now() + 480000 } };
  const a = SOC.actions(m)[0];
  assert.ok(a.disabled); assert.strictEqual(a.label, `Level ${gi.min}+`);
});

test('a Trial from chat carries its leader, so finishing it makes a friend (#362)', () => {
  const { S } = character(D.LEVEL_CAP); const act = Object.keys(D.ACTIVITIES).find((k) => D.ACTIVITIES[k].dungeon && !G.trialBlock(k));
  const lead = mine(S, (x) => x.level === D.LEVEL_CAP) || mine(S);
  assert.ok(G.joinChatTrial(act, 1, 'dps', { leader: lead.id }));
  assert.strictEqual(S.run.soc.leader, lead.id);
});

test('the person who posted a Help Wanted is online, of its level, and in the group (#357, #364)', () => {
  const { S } = character(30);
  for (let i = 0; i < 40 && !(S.helpWanted || []).length; i++) { S.flags.nextHelpWanted = 0; advance(5); }
  const req = (S.helpWanted || [])[0]; assert.ok(req, 'a Help Wanted came');
  const A = D.ACTIVITIES[req.act], p = S.bots.find((b) => b.id === req.poster);
  assert.ok(p.level <= A.maxLvl + 5, `level ${p.level} for ${A.minLvl}-${A.maxLvl}`);
  G.joinHelpWanted(req.id);
  assert.ok(S.group.members.some((m) => m.bot && m.bot.id === req.poster), 'the poster is in the group');
});

test('"saw u fighting" names only a creature you fought there (#365)', () => {
  const { S, P } = character(1); P.lastKill = null;
  assert.strictEqual(B.lineContext(S).fought, null);
  P.lastKill = { mob: Object.keys(D.MOBS)[0], place: P.place };
  assert.strictEqual(B.lineContext(S).fought, D.MOBS[P.lastKill.mob].name);
});
