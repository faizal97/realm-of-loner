// Bug hunt before v10.19.0-beta.8: chat, social, guild chat, the Daily and Weekly Boards and other clocks.
// Each bug's test failed on the code before its fix (#592) and states the behaviour the game should have; the
// others are regression guards for edge cases nothing else covered.
'use strict';
globalThis.TEST_TZ = 'Asia/Jakarta'; // UTC+7, no daylight saving: the player's own clock (test/world.js reads it)
const test = require('node:test');
const assert = require('node:assert');
const W = require('./world');
const { G, D, B, character, setNow, now, advance } = W;
const SOC = globalThis.SOC;

const capitalOf = () => D.RACES[G.S.player.race].start;
const hubs = () => Object.keys(D.PLACES).filter((k) => G.isHub(k));

// ---------------------------------------------------------------------------------------------- Bounty Boards

// a board offers monsters that live only in a place the player's faction can't walk to (the only road runs through
// an enemy town). At 30 Ilvaris (Ashenvale) sends the Alliance to Felfire Hill, reached only through the Horde's
// Splintertree Post; at 60 (#553 opened every zone) Holdfast Point (Arathi) sends them to Drywhisker Gorge too. The
// bounty can never be finished and holds one of the 6 places for the day (or the week).
test('every bounty on a board you can reach names monsters you can reach from that town', () => {
  const bad = [];
  for (const race of ['human', 'orc']) for (const lvl of [30, 36, 60]) {
    character(lvl, 'mage', race);
    for (const hub of hubs()) {
      if (!G.canReach(capitalOf(), hub)) continue; // a board you can't stand at is never seen
      for (const b of G.bounties(hub)) {
        const lives = Object.keys(D.PLACES).filter((k) => (D.PLACES[k].mobs || []).some((m) => m[0] === b.mob));
        if (!lives.some((k) => G.canReach(hub, k))) bad.push(`${race} ${lvl} ${D.PLACES[hub].name}: ${D.MOBS[b.mob].name} (only at ${lives.map((k) => D.PLACES[k].name).join(', ')})`);
      }
    }
  }
  assert.deepStrictEqual([...new Set(bad)], [], 'bounties for monsters you cannot reach');
});

test('regression: bounty pay is a finite number at every level, and a level-60 board pays level-60 money', () => {
  for (const lvl of [1, 10, 30, 59, 60]) {
    character(lvl, 'warrior', 'human');
    for (const hub of hubs()) for (const b of G.bounties(hub)) {
      assert.ok(Number.isFinite(b.money) && b.money > 0 && Number.isFinite(b.xp) && b.xp > 0, `${hub} ${lvl}: ${JSON.stringify(b)}`);
      if (lvl === 60) assert.ok(b.money >= Math.round(G.questMoney(60) * 1.2) - 1, `${hub}: ${b.money}`);
    }
  }
});

test('regression: daily bounties turn at local midnight, the weekly on local Monday 00:00, in UTC+7', () => {
  character(30);
  const hub = hubs().find((k) => G.bounties(k).length);
  const ids = () => G.bounties(hub).map((b) => b.id);
  setNow(new Date(2026, 10, 15, 23, 59).getTime()); const sun = ids(); // Sunday 23:59 local (16:59 UTC)
  setNow(new Date(2026, 10, 16, 0, 1).getTime()); const mon = ids(); // Monday 00:01 local, still Sunday in UTC
  assert.notStrictEqual(sun[0], mon[0], 'a new daily set at local midnight');
  assert.notStrictEqual(sun[3], mon[3], 'a new weekly at local Monday 00:00');
  setNow(new Date(2026, 10, 22, 23, 59).getTime()); // the next Sunday: the same weekly all week
  assert.strictEqual(ids()[3], mon[3]);
  assert.match(mon[3], /:w2026-11-16:/, "the weekly's key is the local Monday");
});

test('regression: a player back after skipping days: old bounties lapse, a turned-in one stays turned in, the 6 free up', () => {
  const { P } = character(30);
  const hub = hubs().find((k) => G.bounties(k).length);
  setNow(new Date(2026, 10, 10, 12).getTime());
  const [a, b2, c, wk] = G.bounties(hub);
  for (const x of [a, b2, c, wk]) G.acceptBounty(x);
  P.bounty[a.id].prog = a.n; G.turnInBounty(a);
  assert.strictEqual(G.bountiesHeld(), 3);
  setNow(new Date(2026, 10, 13, 9).getTime()); // three days away, the same week
  assert.strictEqual(G.bountiesHeld(), 1, 'only the weekly is still live');
  assert.deepStrictEqual(G.myBounties().map((x) => x.weekly), [true]);
  setNow(new Date(2026, 10, 10, 18).getTime()); // the clock set back to that day: the turned-in one shows as turned in
  assert.strictEqual(G.bountyState(G.bounties(hub)[0]), 'done');
  assert.strictEqual(G.bountyMarker(hub) === '?', false);
  setNow(new Date(2026, 10, 20, 9).getTime()); // the next week: the weekly lapsed too
  assert.strictEqual(G.bountiesHeld(), 0);
  assert.strictEqual(G.WEEK_CHECKS.bounty_week(), false);
});

// ---------------------------------------------------------------------------------------------- guild chat

// with nobody from your guild online, a guild rank-up's "congrats" (and the weekly goal's "WEEKLY GOAL DONE!") is
// posted in Guild by a random bot from the whole realm (social.js guildOfficer: `|| pick(G.S.bots)`): someone outside
// your guild, often offline, sometimes from the other faction.
test('a guild-chat line comes only from a member of your guild', () => {
  const { S, P } = character(60, 'warrior', 'human');
  const g = SOC.myGuilds()[0].g; P.guild = g; P.guildRep = 95;
  const io = B.isOnline; B.isOnline = () => false; // a quiet hour: no guildmate online
  const from = [];
  try {
    for (let i = 0; i < 20; i++) {
      P.guildRankBest = 0; const n0 = S.chat.length;
      SOC.addStanding(10, 'test'); // 95 -> 105: Member rank
      for (const m of S.chat.slice(n0)) if (m.ch === 'guild' && m.fromId != null) from.push(S.bots.find((b) => b.id === m.fromId));
      P.guildRep = 95;
    }
  } finally { B.isOnline = io; }
  const outsiders = from.filter((b) => !b || b.guild !== g);
  assert.deepStrictEqual(outsiders.map((b) => b && `${b.name} <${B.GUILDS[b.guild] || 'no guild'}> ${B.factionOf(b)}`), [], 'guild lines from people outside the guild');
});

// a guild invitation whispered in chat stays open after you join a guild another way (the Guild tab, an
// application, the game's own offer): its button greys to "In a guild", but the bot still nudges ("u there?",
// "still up for it?") 100 seconds later and says "nvm, found someone" when it lapses. Leaving a guild closes guild
// requests (SOC.leaveGuild); joining one should close the invitations and recruiting posts that no longer apply.
test('joining a guild closes the guild invitations still open in chat, and nobody nudges about them', () => {
  const { S, P } = character(30, 'warrior', 'human');
  P.guild = -1;
  const gs = SOC.myGuilds().filter((x) => P.level >= x.min), inviter = S.bots.find((b) => B.factionOf(b) === G.myFaction());
  const m = B.post(S, 'whisper', inviter, 'hey, want to join? test invite');
  m.act = { kind: 'guild_invite', whisper: true, bot: inviter.id, g: gs[0].g, state: 'open', until: now() + 5 * 60000, posted: now() };
  G.joinGuild(gs[1].g);
  setNow(now() + 110000); SOC.tick();
  const nudges = S.chat.filter((x) => x.ref === m.id);
  assert.deepStrictEqual(nudges.map((x) => x.text), [], 'nudged about a guild invitation after joining a guild');
  assert.notStrictEqual(m.act.state, 'open', 'the invitation is still an open request');
  assert.ok(!SOC.isOpenRequest(m));
});

test('regression: no guild invitation or recruiting post reaches a player who is in a guild', () => {
  const { S, P } = character(30, 'warrior', 'orc');
  P.guild = SOC.myGuilds().find((x) => P.level >= x.min).g; SOC.tick(); // S.soc exists from the first tick
  for (let i = 0; i < 400; i++) { S.soc.next.whisper = 1; S.soc.next.recruit = 1; for (const m of S.chat) if (m.act && m.act.whisper) m.act.state = 'done'; SOC.tick(); setNow(now() + 1000); }
  const bad = S.chat.filter((m) => m.act && (m.act.kind === 'guild_invite' || m.act.kind === 'guild_apply'));
  assert.deepStrictEqual(bad.map((m) => m.text), []);
});

test('regression: the weekly guild goal turns on local Monday 00:00 (UTC+7) and stays put if the clock goes back', () => {
  const { P } = character(30); P.guild = 0;
  setNow(new Date(2026, 10, 15, 23, 50).getTime());
  const w1 = SOC.week().id;
  setNow(new Date(2026, 10, 16, 0, 5).getTime());
  const w2 = SOC.week().id;
  assert.strictEqual(w2, w1 + 1);
  setNow(new Date(2026, 10, 15, 22).getTime());
  assert.strictEqual(SOC.week().id, w2, 'a clock set back keeps the week it has');
});

// the guild's message of the day "changes daily" on the UTC day (social.js SOC.motd: Math.floor(now() / 86400000)),
// so in UTC+7 it changes at 07:00, not at midnight like every other daily thing (#546 moved the boards to local midnight)
test('the guild message of the day changes at local midnight, not at 07:00 in UTC+7', () => {
  const { P } = character(30); P.guild = 0;
  const at = (d, h, m) => { setNow(new Date(2026, 10, d, h, m || 0).getTime()); return SOC.motd(0); };
  assert.notStrictEqual(at(11, 23, 30), at(12, 0, 30), 'a new day at local midnight');
  assert.strictEqual(at(12, 6, 30), at(12, 7, 30), 'the same all day');
});

// (minor) #580's social-guild line "happy weekend everyone" is said on any day; B.lineTrue checks time-of-day words
// (#70: a line says only true things) but not the weekend
test('"happy weekend everyone" is not said on a Wednesday', () => {
  const { S } = character(30);
  setNow(new Date(2026, 10, 11, 20).getTime()); // Wednesday 20:00
  const b = S.bots.find((x) => B.factionOf(x) === G.myFaction());
  assert.strictEqual(B.lineTrue(S, 'happy weekend everyone', b, 'guild'), false);
  assert.strictEqual(B.lineTrue(S, 'happy friday all', b, 'guild'), false, 'a day named is today');
  assert.strictEqual(B.lineTrue(S, 'guild run on friday, all welcome!', b, 'guild'), true, 'a plan for another day is fine');
  setNow(new Date(2026, 10, 14, 20).getTime()); // Saturday
  assert.strictEqual(B.lineTrue(S, 'happy weekend everyone', b, 'guild'), true);
  assert.strictEqual(B.lineTrue(S, 'happy saturday all', b, 'guild'), true);
});

// a whispered guild invitation ("we're recruiting for <X>") comes from someone who isn't in <X> when none of X's
// members is online: social.js makeWhisper `const inv = g.officer || b` falls back to the random whisperer. In a young
// realm the level-60 guilds have 1 to 4 members (test world: Crimson Vanguard 1, nobody online 115 h of 168 a week).
test('a guild invitation comes from a member of that guild', () => {
  const { S, P } = character(60, 'warrior', 'human'); P.guild = -1; SOC.tick();
  const io = B.isOnline; B.isOnline = (b) => !(b.guild >= 0); // only guildless players are online
  const bad = [];
  try {
    for (let i = 0; i < 400; i++) {
      S.soc.invites = 0; for (const m of S.chat) if (m.act && m.act.whisper) m.act.state = 'done';
      const n0 = S.chat.length; SOC.makeWhisper();
      for (const m of S.chat.slice(n0)) if (m.act && m.act.kind === 'guild_invite') { const b = S.bots.find((x) => x.id === m.fromId); if (!b || b.guild !== m.act.g) bad.push(`${m.from} (guild ${b && b.guild}) invites to <${B.GUILDS[m.act.g]}>`); }
    }
  } finally { B.isOnline = io; }
  assert.deepStrictEqual(bad.slice(0, 5), [], `${bad.length} invitations from outside the guild`);
});

// the Bloodsand Brawl's "opens in 5" line in General comes from any level-high-enough bot of the whole realm
// (game.js G.brawlTick: cpick(S.bots.filter(level))): about half the time the other faction, online or not
test('the Brawl reminder in General comes from your own side, from someone online', () => {
  const bad = [];
  for (let i = 0; i < 40; i++) {
    const { S } = character(30, 'warrior', i % 2 ? 'orc' : 'human');
    const w = G.brawlWindow(); setNow(w.opensAt.getTime() - 2 * 60000); S.brawlTold = null;
    const n0 = S.chat.length; G.brawlTick();
    for (const m of S.chat.slice(n0)) { const b = S.bots.find((x) => x.id === m.fromId); if (b && (B.factionOf(b) !== G.myFaction() || !B.isOnline(b, new Date(m.t)))) bad.push(`${G.myFaction()} hears ${B.factionOf(b)} ${b.name}${B.isOnline(b, new Date(m.t)) ? '' : ' (offline)'}: ${m.text}`); }
    setNow(now() + 3 * 3600000);
  }
  assert.deepStrictEqual(bad.slice(0, 5), [], `${bad.length} of 40`);
});

// at a quiet hour about 1 General line in 6 comes from someone who is offline. B.chatTick's onl() (bots.js) tries
// 12 random bots of your side for one online, then falls back to ANY bot of your side, online or not; at 04:00 about
// 30 of 226 are online, so the 12 tries miss often. The same speaker shows as offline on their card.
test('General, LFG and whisper chatter comes only from someone online, even at 04:00', () => {
  const { S } = character(30, 'warrior', 'human');
  setNow(new Date(2026, 10, 11, 4).getTime());
  const off = [];
  for (let i = 0; i < 3000; i++) {
    setNow(now() + 1000); B.chatTick(S, now());
    for (const m of S.chat) {
      if (m.hunt) continue; m.hunt = 1;
      const b = m.fromId != null && S.bots.find((x) => x.id === m.fromId);
      if (b && ['general', 'lfg', 'whisper'].includes(m.ch) && !B.isOnline(b, new Date(m.t))) off.push(`${m.ch} ${b.name}: ${m.text}`);
    }
  }
  assert.deepStrictEqual(off.slice(0, 5), [], `${off.length} lines from offline players`);
});
