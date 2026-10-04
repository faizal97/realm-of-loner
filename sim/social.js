// Working chat and guilds: requests appear over time, and each kind of action does what it says.
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
// seeded dice before anything loads (the data and the simulated players roll while they are built)
{ let s = 0x5eed1e55 >>> 0; Math.random = () => { s = (s + 0x6D2B79F5) >>> 0; let x = s; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
require('../src/data.js'); require('../src/engine.js'); require('../src/bots.js'); require('../src/game.js'); require('../src/social.js');
const { G, D, B, SOC } = globalThis;
// Reproducible (v10.1.1): a fixed evening (a Wednesday, when most simulated players are online) and seeded dice, so
// the result never depends on the day it is run or on luck; a failure is a real change, not a bad roll.
const RealDate = Date; let t = new RealDate(2026, 8, 30, 18, 0, 0, 0).getTime(); // the whole clock is the sim's: 'who is online' reads new Date() (issue #26)
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(t); } static now() { return t; } };
let bad = 0; const fail = (m) => { console.log('FAIL ' + m); bad++; };
G.newGame({ name: 'T', cls: 'priest', race: 'human' }); const S = G.S, P = S.player;
P.level = 22; S.flags.warModeAsked = true; S.flags.warMode = false; P.place = 'darkshire'; P.money = 50000;
for (const b of S.bots) { b.level = Math.max(b.level, 18 + Math.floor(Math.random() * 10)); }
G.addItem(G.copyItem('linen_cloth'), 30); G.addItem(G.copyItem('light_leather'), 12);
// 3 hours of chat
const kinds = {};
for (let i = 0; i < 3 * 3600; i++) { t += 1000; G.update(1); for (const m of S.chat) if (m.act && !m.counted) { m.counted = 1; kinds[m.act.kind] = (kinds[m.act.kind] || 0) + 1; } }
console.log('requests in 3 h (not in a guild):', JSON.stringify(kinds));
for (const k of ['lfg', 'wtb', 'wts', 'guild_apply']) if (!kinds[k]) fail('no ' + k + ' requests'); // where/guild_invite are rare by design
const run = (kind, pick) => { const m = S.chat.slice().reverse().find((x) => x.act && x.act.kind === kind && x.act.state === 'open'); if (!m) { fail('no open ' + kind); return null; } const acts = SOC.actions(m); const a = pick ? pick(acts, m) : acts[0]; const r = a.fn(); return { m, r, a }; };
// fresh ones of each kind, then act on them
const force = (kind) => { for (let i = 0; i < 4000; i++) { t += 1000; G.update(1); if (S.chat.some((x) => x.act && x.act.kind === kind && x.act.state === 'open')) return true; if (S.run) { while (S.run && S.run.phase !== 'done') { G.update(0.1); t += 100; } G.leaveRun && G.leaveRun(); S.run = null; S.group = null; } } return false; };
if (force('wtb')) { const m0 = P.money; const x = run('wtb'); if (x && P.money <= m0) fail('wtb did not pay'); else if (x) console.log('wtb ok:', x.m.text, '→ +', P.money - m0); }
if (force('wts')) { const m0 = P.money, n0 = P.bags.length; const x = run('wts'); if (x && !(P.money < m0 && P.bags.length > n0)) fail('wts did not buy'); else if (x) console.log('wts ok:', x.m.text); }
if (force('where')) { const x = run('where', (acts, m) => acts.find((a) => a.label === m.act.answer)); if (x) console.log('where ok:', x.m.text, '→', x.a.label, 'marks', G.account().marks); }
if (force('help_kill')) {
  const x = run('help_kill'); const a = x && x.m.act;
  if (a) { if (!S.wparty) fail('helper did not join the party'); if (P.place === a.place) P.place = 'goldshire'; const via = Object.keys(D.PLACES).find((k) => k !== a.place && k !== P.place); P.place = via; for (let i = 0; i < 5; i++) { t += 1000; G.update(1); } if (!S.wparty) fail('party disbanded on the way to the request'); P.place = a.place; t += 1000; G.update(1); if (!S.wparty || S.wparty.meet) fail('party did not settle at the meeting place'); const m0 = P.money; for (let i = 0; i < a.n; i++) G.S && (G.on && null, SOC.onKill(a.mob)); if (a.state !== 'done' || P.money <= m0) fail('help_kill did not pay'); else console.log('help_kill ok:', x.m.text); }
}
if (force('lfg')) { const x = run('lfg'); if (S.bg) { console.log('lfg ok:', x.m.text, '→ battleground', S.bg.act, '(its own two teams, issue #15)'); S.bg = null; } else if (!S.run) fail('lfg did not start a run'); else { console.log('lfg ok:', x.m.text, '→ run', S.run.act); let g = 0; while (S.run && S.run.phase !== 'done' && g++ < 200000) { if (G.fight && G.pUnit && G.pUnit.kind === 'player') { G.pUnit.kind = 'bot'; G.pUnit.bot = { skill: 0.7, react: 0.5 }; G.pUnit.role = G.role(); } for (const r of (S.run.rolls || [])) if (!r.done && r.player && r.choice == null) { try { G.roll(S.run.rolls.indexOf(r), 'greed'); } catch (e) {} } if (S.run.phase === 'rest' && S.run.restUntil <= t) { try { G.runPull(); } catch (e) {} } G.update(0.1); t += 100; } console.log('  run finished:', S.run && S.run.phase); S.run = null; S.group = null; } }
// a battleground from a chat request (issue #15): it starts the battleground with its two teams, not a dungeon run
{ const bg = Object.keys(D.ACTIVITIES).find((k) => D.ACTIVITIES[k].bg && P.level >= D.ACTIVITIES[k].minLvl && P.level <= D.ACTIVITIES[k].maxLvl);
  if (bg) { S.run = null; S.group = null; S.bg = null; const okj = G.joinChatGroup(bg, 'healer', {}); let threw = null; try { for (let i = 0; i < 20; i++) { t += 1000; G.update(1); } } catch (e) { threw = e; }
    if (!okj || !S.bg || S.run || threw) fail(`a chat battleground request starts the battleground (${bg}: joined ${okj}, bg ${!!S.bg}, run ${!!S.run}${threw ? ', threw ' + threw.message : ''})`); else console.log('battleground from chat ok:', bg);
    G.leaveBg && G.leaveBg(); S.bg = null; } }
// guilds: apply to one you qualify for
{ const d = new Date(t); if (d.getHours() < 18) d.setHours(18, 0, 0, 0); else { d.setDate(d.getDate() + 1); d.setHours(18, 0, 0, 0); } t = d.getTime(); } // the guild tests run in a guild's busy evening
const gs = SOC.myGuilds(); console.log('guilds:', gs.map((g) => `${g.name} (${g.style} ${g.min}+, ${g.members})`).join(' · '));
const busiest = (list) => list.slice().sort((a, b) => b.online - a.online || b.members - a.members)[0]; // a guild with members online at the sim's clock (issue #26)
const ok = busiest(gs.filter((g) => P.level >= g.min)); SOC.apply(ok.g); for (let i = 0; i < 90; i++) { t += 1000; G.update(1); }
if (P.guild !== ok.g) fail('application not accepted'); else console.log('applied and joined', ok.name);
const low = gs.find((g) => P.level < g.min);
// guild requests pay standing
const gk = {}; const rep0 = P.guildRep || 0;
for (let i = 0; i < 2 * 3600; i++) { t += 1000; G.update(1); for (const m of S.chat) if (m.act && m.act.guild && !m.gcount) { m.gcount = 1; gk[m.act.kind] = (gk[m.act.kind] || 0) + 1; if (m.act.kind === 'g_mats' && G.countItem(m.act.item) >= m.act.n) SOC.actions(m)[0].fn(); if (m.act.kind === 'where') SOC.actions(m).find((a) => a.label === m.act.answer).fn(); } if (S.run) { S.run = null; S.group = null; } }
console.log('guild requests in 2 h:', JSON.stringify(gk), '· standing', rep0, '→', P.guildRep, '· rank', SOC.RANKS[SOC.rank()].name, '· xp perk', SOC.perk('xp') + '%');
if (!Object.keys(gk).length) fail('no guild requests');
SOC.leaveGuild(); if (P.guild !== -1) fail('leave guild');
// ---- v9.6: the richer requests, on a level 30 tailor with quests in the log
{
  G.newGame({ name: 'U', cls: 'warrior', race: 'human' }); const S2 = G.S, P2 = S2.player;
  P2.level = 30; S2.flags.warModeAsked = true; S2.flags.warMode = false; P2.place = 'darkshire'; P2.money = 90000;
  for (const b of S2.bots) b.level = Math.max(b.level, 24 + Math.floor(Math.random() * 10));
  P2.prof = { tailoring: { skill: 120, max: 150, known: [] } };
  G.addItem(G.copyItem('linen_cloth'), 40); G.addItem(G.copyItem('wool_cloth'), 20);
  for (const q of Object.keys(D.QUESTS)) { const Q = D.QUESTS[q]; if (!Q.faction || Q.faction === 'alliance') if (Q.lvl >= 26 && Q.lvl <= 30 && !Q.group && !Q.dungeon && !(Q.pre || []).length && Q.objs.every((o) => o.type === 'kill')) { P2.quests[q] = { prog: Q.objs.map(() => 0) }; if (Object.keys(P2.quests).length >= 3) break; } }
  const seen2 = {};
  for (let i = 0; i < 4 * 3600; i++) { t += 1000; G.update(1); for (const m of S2.chat) if (m.act && !m.c2) { m.c2 = 1; seen2[m.act.kind] = (seen2[m.act.kind] || 0) + 1; } if (S2.run) { S2.run = null; S2.group = null; } if (G.fight) { G.fight = null; G.pUnit = null; } }
  console.log('v9.6 requests in 4 h (level 30 tailor):', JSON.stringify(seen2));
  for (const k of ['quest_team', 'craft_order', 'rare']) if (!seen2[k]) fail('no ' + k + ' requests'); // duel, chat and carry are uncommon by design
  const latest = (kind) => S2.chat.slice().reverse().find((x) => x.act && x.act.kind === kind);
  // craft order: take it, craft, hand over
  const force2 = (kind) => { for (let i = 0; i < 40000; i++) { const m = S2.chat.slice().reverse().find((x) => x.act && x.act.kind === kind && x.act.state === 'open'); if (m) return m; t += 1000; G.update(1); if (S2.run) { S2.run = null; S2.group = null; } if (G.fight) { G.fight = null; G.pUnit = null; } } return null; };
  const co = force2('craft_order'); if (!co) fail('no open craft order to test');
  if (co) { SOC.actions(co)[0].fn(); const r = D.RECIPES[co.act.rid]; G.craft(r.id, 1); for (let i = 0; i < 40; i++) { t += 100; G.update(0.1); } const m0 = P2.money; const r2 = SOC.actions(co)[0].fn(); if (co.act.state !== 'done' || P2.money <= m0) fail('craft order: ' + r2); else console.log('craft_order ok:', co.text); }
  const du = force2('duel');
  if (du) { SOC.actions(du)[0].fn(); if (!G.fight || G.fight.kind !== 'duel') fail('duel did not start'); else { let g = 0; while (G.fight && g++ < 5000) { if (G.pUnit && G.pUnit.kind === 'player') { G.pUnit.kind = 'bot'; G.pUnit.bot = { skill: 0.7, react: 0.5 }; G.pUnit.role = 'dps'; } G.update(0.1); t += 100; } console.log('duel ok:', du.text, '· hp after', P2.hp, P2.ghostUntil ? '(ghost!)' : ''); if (P2.ghostUntil) fail('duel killed the player'); } }
  const qt = force2('quest_team'); if (!qt) fail('no open quest team-up to test');
  if (qt) { S2.wparty = null; SOC.actions(qt)[0].fn(); if (!S2.wparty) fail('quest_team no party'); const qid = qt.act.qid; P2.quests[qid].prog = D.QUESTS[qid].objs.map((o) => o.n || 1); for (let i = 0; i < 3; i++) { t += 1000; G.update(1); } if (qt.act.state !== 'done') fail('quest_team did not finish'); else console.log('quest_team ok:', qt.text); }
  const ra = force2('rare');
  if (ra) { const m0 = P2.money; SOC.onKill(ra.act.mob); if (ra.act.state !== 'done' || P2.money <= m0) fail('rare bounty'); else console.log('rare ok:', ra.text); }
  const ca = force2('carry');
  if (ca) { SOC.actions(ca)[0].fn(); if (!S2.run || !S2.run.soc || S2.run.soc.kind !== 'carry') fail('carry did not start'); else { const m0 = P2.money; const d = { act: S2.run.act, soc: S2.run.soc }; S2.run = null; S2.group = null; SOC.onRunComplete(d); if (P2.money <= m0) fail('carry tip'); else console.log('carry ok:', ca.text); } }
  const fr = SOC.friends(); console.log('friends made:', fr.length, fr.slice(0, 3).map((f) => f.bot.name + ' x' + f.n).join(', '));
  if (!fr.length) fail('no friends remembered');
  // guild extras
  G.joinGuild(busiest(SOC.myGuilds()).g); const gseen = {}; const w0 = SOC.week().got;
  for (let i = 0; i < 3 * 3600; i++) { t += 1000; G.update(1); for (const m of S2.chat) if (m.act && m.act.guild && !m.g2) { m.g2 = 1; gseen[m.act.kind] = (gseen[m.act.kind] || 0) + 1; if (m.act.kind === 'g_donate') SOC.actions(m)[0].fn(); if (m.act.kind === 'g_event') SOC.actions(m)[0].fn(); } if (S2.run) { const d = { act: S2.run.act, soc: S2.run.soc }; S2.run = null; S2.group = null; SOC.onRunComplete(d); } if (G.fight) { G.fight = null; G.pUnit = null; } }
  for (let i = 0; i < 40; i++) SOC.onKill('skeletal_warrior');
  const wk = SOC.week(); console.log('guild requests in 3 h:', JSON.stringify(gseen), '· standing', P2.guildRep, '· week', wk.what, wk.got + '/' + wk.goal, '· motd:', SOC.motd(P2.guild));
  for (const k of ['g_donate', 'g_event']) if (!gseen[k]) fail('no ' + k);
  const talk = S2.chat.filter((m) => m.ch === 'guild' && !m.act && m.from).length; console.log('guild chatter lines:', talk);
}
// the early guild offer (issue #8): its pitch is in the invitation, not a whisper that reads as coming after a Decline;
// a declined guild does not ask again in a recruiting whisper
{
  G.newGame({ name: 'O', cls: 'priest', race: 'human' }); const S2 = G.S; S2.flags.warModeAsked = true; S2.player.level = 8;
  let inv = null; const off = G.on('invite', (d) => { inv = d; }); S2.flags.guildOfferAt = t - 1; S2.flags.guildOffer = false;
  const before = S2.chat.filter((m) => m.ch === 'whisper').length; for (let i = 0; i < 5 && !inv; i++) { t += 1000; G.update(1); }
  if (!inv || !inv.line) fail('the guild offer invitation carries its pitch');
  if (S2.chat.filter((m) => m.ch === 'whisper' && /join our guild|want an invite/.test(m.text)).length) fail('the guild offer also whispers its pitch');
  if (inv) { G.declineGuild(inv.guild); const gs = SOC.myGuilds().filter((x) => !(S2.flags.declinedGuilds || []).includes(x.g)); if (gs.some((x) => x.g === inv.guild)) fail('a declined guild is skipped by recruiting whispers'); }
  if (typeof off === 'function') off();
  // issue #12: not while busy (a fight, a run, a queue, a battleground, travel): it waits and comes once calm
  let inv2 = null; G.on('invite', (d) => { inv2 = d; }); S2.flags.guildOffer = false; S2.flags.guildOfferAt = t - 1; S2.run = { act: 'deadmines', pulls: [], idx: 0, phase: 'rest', restUntil: t + 1e9, rolls: [] };
  for (let i = 0; i < 5; i++) { t += 1000; try { G.update(1); } catch (e) {} }
  if (inv2) fail('the guild offer opened during a dungeon run');
  S2.run = null; for (let i = 0; i < 5 && !inv2; i++) { t += 1000; G.update(1); }
  if (!inv2) fail('the guild offer comes once the run is over');
}
// #69: a bot's line naming content above its level (+3) is found however the line words it: no leading article, any
// case, plural or possessive (the Analyst found "scrublands chat is a way of life" from level-1 bots, The Scrublands being 10)
for (const [line, lvl, want] of [['scrublands chat is a way of life', 1, 'scrublands'], ['SCRUBLANDS!', 6, 'scrublands'], ['the scrublands again', 1, 'the scrublands'],
  ["Scrublands' worst rares", 1, 'scrublands'], ['two ashwings lol', 40, 'ashwing'], ["Ashwing's loot", 40, 'ashwing'], ['scrublands chat is a way of life', 7, null], ['the herd is fine', 1, null]]) {
  const got = B.contentAbove(line, lvl); if ((got && got.toLowerCase()) !== want) fail(`#69: "${line}" from a level-${lvl} bot names ${got || 'nothing'} above its level (want ${want || 'nothing'})`);
}
console.log(bad ? `${bad} problem(s)` : 'social sim OK');
process.exitCode = bad ? 1 : 0;
