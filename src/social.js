// Working chat and guilds (v9.5, richer in v9.6). Bots post messages that carry an action (m.act): LFG posts you can join,
// whispers that ask for something, trade and recruiting posts, rare sightings, and guild requests that earn guild
// standing. Bots you help remember you and come back. DOM-free; ui.js turns m.act into buttons. Loads after game.js.
//   m.act = { kind, state: 'open'|'done'|'declined'|'expired', until, ...kind fields }
(function (root) {
  const SOC = root.SOC = {};
  const D = root.D, B = root.B, G = root.G;
  const now = () => Date.now();
  const rnd = (a, b) => a + Math.random() * (b - a), rint = (a, b) => Math.floor(rnd(a, b + 1)), pick = (a) => a[Math.floor(Math.random() * a.length)];
  const chance = (p) => Math.random() < p;
  const link = (it) => B.link(it.name, it.q || 1);
  const coin = (c) => G.moneyText(c);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  // ------------------------------------------------------------ a bot's voice
  // Sloppy players type in lowercase, grumpy ones shout, friendly ones add a smiley. Item links keep their case.
  function voice(bot, text) {
    if (!bot) return text;
    const parts = text.split(/(\[\[\d\|[^\]]+\]\])/);
    const map = (fn) => parts.map((p) => (p.startsWith('[[') ? p : fn(p))).join('');
    let s = text;
    if ((bot.skill || 0.5) < 0.4 && chance(0.7)) s = map((p) => p.toLowerCase()).replace(/[.!]$/, '');
    else if ((bot.toxic || 0) > 0.6 && chance(0.25)) s = map((p) => p.toUpperCase());
    if ((bot.social || 0) > 0.75 && chance(0.35) && !/[?]$/.test(s)) s += pick([' :)', ' :D', ' ^^']);
    return s;
  }
  const tone = (bot) => ((bot && bot.toxic > 0.6) ? 'rude' : (bot && bot.social > 0.65) ? 'nice' : 'plain');

  // ------------------------------------------------------------ guilds: who they are
  const STYLE = ['casual', 'leveling', 'dungeons', 'raiding', 'pvp', 'social'];
  SOC.guildInfo = function (g) {
    const S = G.S, name = B.GUILDS[g];
    const x = [...name].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    const style = STYLE[x % STYLE.length];
    const min = style === 'raiding' ? 40 : style === 'dungeons' ? 15 : style === 'pvp' ? 20 : style === 'leveling' ? 5 : 1;
    const members = S.bots.filter((b) => b.guild === g);
    const online = members.filter((b) => B.isOnline(b, new Date())).length;
    const officer = members.slice().sort((a, b) => b.level - a.level)[0] || null;
    const blurb = { casual: 'Chill people, no pressure. We help each other level.', leveling: 'New and levelling players welcome. We run low dungeons every night.', dungeons: 'Dungeon runs every evening. Bring your role, we bring the rest.', raiding: 'Endgame raids three nights a week. Level 40+.', pvp: 'War Mode on, always. For the glory.', social: 'A friendly bunch who mostly talk and sometimes quest.' }[style];
    return { g, name, style, min, members: members.length, online, officer, blurb, faction: B.GUILD_FACTION[g] };
  };
  SOC.myGuilds = () => B.GUILDS.map((_, g) => g).filter((g) => B.GUILD_FACTION[g] === G.myFaction()).map(SOC.guildInfo);
  // the message of the day changes daily
  SOC.motd = function (g) {
    const day = Math.floor(now() / 86400000), info = SOC.guildInfo(g);
    const lines = { casual: ['Be nice, help the new folks.', 'Remember to take breaks :)', 'Guild night on Friday, all welcome!', 'Ask in guild chat, someone always knows.'],
      leveling: ['Low dungeon runs every evening, ask in guild.', 'Share your quest drops, someone needs them.', 'Level 20? Smugglers\' Deep and The Dreaming Caves runs this week.', 'Help a guildie, earn standing.'],
      dungeons: ['Tank and healer spots always open.', 'This week: full clears only, no speedruns.', 'Sign up for guild nights in guild chat.', 'Bring potions to guild runs.'],
      raiding: ['Raid prep: bring resist gear.', 'Attendance matters. Sign up early.', 'New recruits: shadow a raid first.', 'Consumables are on the guild.'],
      pvp: ['For the glory. War Mode on.', 'Never roam alone out there.', 'Honor is earned, not given.', 'Watch the contested zones this week.'],
      social: ['Tell us about your day!', 'Screenshot contest this week.', 'Fishing party at the lake, everyone welcome.', 'Be kind, stay weird.'] }[info.style];
    return lines[(day + g) % lines.length];
  };

  // ------------------------------------------------------------ standing inside your guild
  const RANKS = [{ name: 'Initiate', at: 0 }, { name: 'Member', at: 100, perk: '+3% experience' }, { name: 'Veteran', at: 300, perk: '+5% gold from quests' },
    { name: 'Officer', at: 700, perk: 'guild runs give +5 Mentor Marks' }, { name: 'Champion', at: 1500, perk: 'the title "Champion of the Guild"' }];
  SOC.RANKS = RANKS;
  SOC.standing = () => { const P = G.S && G.S.player; return P && P.guild >= 0 ? (P.guildRep || 0) : 0; };
  SOC.rank = () => { const s = SOC.standing(); if (!G.S || G.S.player.guild < 0) return -1; let r = 0; RANKS.forEach((k, i) => { if (s >= k.at) r = i; }); return r; };
  SOC.perk = (kind) => { const r = SOC.rank(); if (kind === 'xp') return r >= 1 ? 3 : 0; if (kind === 'gold') return r >= 2 ? 5 : 0; if (kind === 'marks') return r >= 3 ? 5 : 0; return 0; };
  function addStanding(n, why) {
    const P = G.S.player; if (P.guild < 0) return;
    const r0 = SOC.rank();
    P.guildRep = (P.guildRep || 0) + n;
    G.sys(`+${n} guild standing${why ? ' (' + why + ')' : ''}.`);
    const r1 = SOC.rank();
    if (r1 > r0) { post('guild', guildOfficer(), pick([`congrats on ${RANKS[r1].name} rank!`, `promoted you to ${RANKS[r1].name}, well earned`, `${RANKS[r1].name} now, nice work`, `everyone say gz, new ${RANKS[r1].name}!`])); G.toast(`Guild rank: ${RANKS[r1].name}. ${RANKS[r1].perk ? 'New perk: ' + RANKS[r1].perk + '.' : ''}`, true); }
  }
  SOC.addStanding = addStanding;
  const guildOfficer = () => { const P = G.S.player; const info = SOC.guildInfo(P.guild); return info.officer || onlineMate() || pick(G.S.bots); };
  const onlineMate = (not) => { const S = G.S, d = new Date(); const m = S.bots.filter((b) => b.guild === S.player.guild && B.isOnline(b, d) && b.id !== not); return m.length ? pick(m) : null; };

  // the weekly guild goal: kills by everyone, you included
  const weekId = () => Math.floor((now() / 86400000 + 3) / 7);
  SOC.week = function () {
    const soc = state(), P = G.S.player; if (P.guild < 0) return null;
    if (!soc.week || soc.week.id !== weekId() || soc.week.g !== P.guild) {
      const goals = [{ what: 'creatures slain', kind: 'kill', goal: 150 }, { what: 'dungeon bosses defeated', kind: 'boss', goal: 12 }, { what: 'requests answered', kind: 'help', goal: 10 }];
      const gl = goals[(weekId() + P.guild) % goals.length];
      soc.week = Object.assign({ id: weekId(), g: P.guild, got: Math.floor(gl.goal * rnd(0.1, 0.3)), done: false }, gl);
    }
    return soc.week;
  };
  function weekProgress(kind, n) {
    const w = SOC.week(); if (!w || w.done || w.kind !== kind) return;
    w.got += n;
    if (w.got >= w.goal) {
      w.done = true;
      const P = G.S.player, gold = P.level * 150;
      P.money += gold;
      post('guild', guildOfficer(), pick([`WEEKLY GOAL DONE! ${w.goal} ${w.what}, thanks everyone!`, `we hit the weekly goal, ${w.goal} ${w.what}. gold to everyone who helped!`]));
      G.sys(`The guild reached its weekly goal. You receive ${coin(gold)}.`);
      addStanding(100, 'the weekly goal');
    }
  }

  SOC.leaveGuild = function () {
    const S = G.S, P = S.player; if (P.guild < 0) return;
    const name = B.GUILDS[P.guild];
    P.guild = -1; P.guildRep = 0;
    for (const m of S.chat) if (m.act && m.act.guild && m.act.state === 'open') m.act.state = 'expired';
    state().week = null;
    G.sys(`You have left ${name}.`);
    G.emitChange();
  };
  // a request's time left, as the chat line shows it (#166): "4m", "<1m", or "expired"; null for a line with no request
  SOC.timeLeft = function (a) {
    if (!a || (a.state !== 'open' && a.state !== 'expired')) return null;
    const left = a.until - now();
    return a.state === 'expired' || left <= 0 ? 'expired' : left < 60000 ? '<1m' : `${Math.floor(left / 60000)}m`;
  };
  SOC.apply = function (g) {
    const S = G.S, P = S.player;
    if (P.guild >= 0) return G.toast('Leave your guild first.');
    const info = SOC.guildInfo(g);
    const soc = state();
    if (soc.applied && soc.applied.until > now()) return G.toast(`You already applied to <${B.GUILDS[soc.applied.g]}>. Wait for an answer.`);
    soc.applied = { g, until: now() + 5 * 60000 };
    G.sys(`You applied to <${info.name}>.`);
    const off = info.officer || pick(S.bots);
    const yes = P.level >= info.min;
    S.pending.push({ at: now() + rnd(15000, 45000), bot: off.id, ch: 'whisper',
      text: voice(off, yes ? pick([`hey, saw your application to <${info.name}>. welcome aboard!`, `accepted! welcome to <${info.name}>`, 'welcome in, sending the invite now', `you're in! say hi in guild chat`]) : pick([`sorry, <${info.name}> is ${info.min}+ only. come back later!`, `thanks for applying but we need level ${info.min}+`, `not yet, ${info.min}+ for us. good luck out there`])),
      onPost: () => { soc.applied = null; if (yes && G.S.player.guild < 0) G.joinGuild(g); } });
    G.emitChange();
  };

  // ------------------------------------------------------------ friends: bots you helped remember you
  function befriend(bot, where) {
    if (!bot) return;
    const f = state().friends || (state().friends = {});
    const e = f[bot.id] || (f[bot.id] = { n: 0, where: null, last: 0 });
    e.n++; e.where = where || e.where; e.last = now();
  }
  // requests you said yes to and are still doing (help with kills, quest team-ups), newest first, for the task card
  SOC.activeTasks = () => G.S.chat.filter((m) => m.act && m.act.state === 'open' && m.act.accepted && (m.act.kind === 'help_kill' || m.act.kind === 'quest_team')).reverse();
  SOC.taskMobs = () => new Set(SOC.activeTasks().map((m) => m.act.mob).filter(Boolean));
  SOC.friends = () => { const f = state().friends || {}; return Object.keys(f).map((id) => ({ bot: G.S.bots.find((b) => String(b.id) === id), ...f[id] })).filter((x) => x.bot).sort((a, b) => b.n - a.n); };
  SOC.isFriend = (botId) => !!((state().friends || {})[botId]);

  // ------------------------------------------------------------ state and helpers
  function state() { const S = G.S; return S.soc || (S.soc = { next: {}, applied: null, invites: 0, recent: [] }); }
  function post(ch, bot, text, act) {
    const m = B.post(G.S, ch, bot, voice(bot, text));
    if (m && act) { m.act = Object.assign({ state: 'open', until: now() + 5 * 60000, posted: now() }, act); const r = state().recent || (state().recent = []); r.push(act.kind); if (r.length > 4) r.shift(); }
    G.emitChat();
    return m;
  }
  const myBots = () => { const S = G.S, f = G.myFaction(), d = new Date(); return S.bots.filter((b) => B.factionOf(b) === f && B.isOnline(b, d)); };
  const openActs = (pred) => G.S.chat.filter((m) => m.act && m.act.state === 'open' && (!pred || pred(m.act)));
  const due = (k, a, b) => { const n = state().next; const t = now(); if (!n[k]) n[k] = t + rnd(a, b) * 1000; if (t >= n[k]) { n[k] = 0; return true; } return false; };
  const roleWord = (r) => (r === 'tank' ? 'tank' : r === 'healer' ? 'healer' : 'dps');
  const roleName = (r) => (r === 'tank' ? 'Tank' : r === 'healer' ? 'Healer' : 'Damage');
  // pick a request kind, avoiding the last few so it doesn't repeat
  function pickKind(weighted) {
    const recent = state().recent || [];
    const pool = []; for (const [k, w] of weighted) if (w > 0) for (let i = 0; i < w; i++) pool.push(k);
    const fresh = pool.filter((k) => !recent.slice(-2).includes(k));
    return pick(fresh.length ? fresh : pool);
  }

  function joinableActs(opts) {
    const P = G.S.player;
    return Object.keys(D.ACTIVITIES).filter((k) => {
      const A = D.ACTIVITIES[k];
      if (A.needQuest) return false;
      if (opts && opts.dungeonOnly && !A.dungeon) return false;
      if (opts && opts.elite && A.dungeon) return false;
      if (P.level < A.minLvl || P.level > A.maxLvl + 3) return false;
      const why = G.activityBlock(k);
      return why !== 'hidden' && !/^Requires/.test(why || '');
    });
  }
  function huntTarget() {
    const P = G.S.player;
    let places = Object.keys(D.PLACES).filter((k) => { const p = D.PLACES[k]; return !p.safe && p.lvl && (p.mobs || []).length && p.lvl[0] <= P.level + 1 && p.lvl[1] >= P.level - 2 && G.canReach(P.place, k); });
    const region = (D.PLACES[P.place] || {}).region;
    const near = places.filter((k) => D.PLACES[k].region === region);
    const close = places.filter((k) => { const r = G.route(P.place, k); return r && r.secs <= 120; });
    places = near.length ? near : close.length ? close : places;
    if (!places.length) return null;
    const pl = pick(places); const mob = pick(D.PLACES[pl].mobs)[0];
    return { place: pl, mob, n: rint(4, 8) };
  }
  const sellable = () => G.S.player.bags.filter((b) => b.item && (b.item.slot === 'mat') && !b.item.noSell);
  // one of your quests that asks you to kill something you can reach
  function questTarget() {
    const P = G.S.player;
    const opts = [];
    for (const { qid, o } of G.openObjectives()) { // only what you still have to kill (v10.9)
      const Q = D.QUESTS[qid]; if (Q.group || Q.dungeon) continue;
      if (o.type === 'kill') { const pl = Object.keys(D.PLACES).find((k) => (D.PLACES[k].mobs || []).some((m) => m[0] === o.mob)); if (pl && G.canReach(P.place, pl)) opts.push({ qid, mob: o.mob, place: pl }); }
    }
    return opts.length ? pick(opts) : null;
  }
  // a dungeon you have clearly outlevelled
  const carryActs = () => Object.keys(D.ACTIVITIES).filter((k) => { const A = D.ACTIVITIES[k], P = G.S.player; return A.dungeon && !A.needQuest && P.level >= A.maxLvl + 4 && G.activityBlock(k) !== 'hidden'; });
  // a recipe you can make
  function craftTarget() {
    const profs = G.profs ? G.profs() : {};
    const out = [];
    for (const k in profs) { if (!D.PROFESSIONS[k] || D.PROFESSIONS[k].kind !== 'craft') continue; for (const r of G.recipesFor(k)) if (profs[k].skill >= r.sk[0] && D.ITEMS[r.makes]) out.push(r); }
    return out.length ? pick(out) : null;
  }
  // a rare near your level in a place you can reach
  function rareTarget() {
    const P = G.S.player;
    const opts = [];
    for (const k in D.PLACES) { const p = D.PLACES[k]; if (!p.named || !p.lvl || !G.canReach(P.place, k)) continue; for (const mob in p.named) { const M = D.MOBS[mob]; if (M.elite || (G.isHunt && G.isHunt(mob))) continue; if (M.lvl[0] <= P.level + 2 && M.lvl[0] >= P.level - 6) opts.push({ place: k, mob }); } }
    return opts.length ? pick(opts) : null;
  }

  // ------------------------------------------------------------ the generator
  SOC.tick = function () {
    const S = G.S; if (!S || !S.player) return;
    const P = S.player, t = now();
    for (const m of S.chat) {
      const a = m.act; if (!a || a.state !== 'open') continue;
      // one nudge if a whisper request is ignored, then a goodbye when it expires
      if (a.whisper && !a.accepted && !a.nudged && t - (a.posted || t) > 100000) { a.nudged = true; const b = botById(a.bot); if (b) { const n = post('whisper', b, pick(['u there?', '??', 'hello?', 'no rush, just lmk', 'still up for it?', 'hellooo', 'ping :)'])); if (n) n.ref = m.id; } }
      if (a.until < t) {
        a.state = 'expired';
        if (a.kind === 'help_kill' && a.accepted) finishHelp(m, false);
        else if (a.kind === 'quest_team' && a.accepted) finishTeam(m, false);
        else if (a.whisper && !a.accepted && chance(0.6)) { const b = botById(a.bot); if (b) { const n = post('whisper', b, pick(['nvm, found someone', 'nvm got it', 'all good, someone else helped', 'np, maybe next time', 'all sorted, ty anyway'])); if (n) n.ref = m.id; } }
      }
      if (a.kind === 'quest_team' && a.accepted && (G.questComplete(a.qid) || !P.quests[a.qid])) { a.state = 'done'; finishTeam(m, true); }
      if (a.kind === 'g_event' && a.signed && !a.started && t >= a.startAt) startGuildEvent(m);
    }
    if (G.fight || S.run) return;
    if (P.level >= 8 && due('lfg', 45, 100) && openActs((a) => a.kind === 'lfg').length < 2) makeLfg();
    if (P.level >= D.LEVEL_CAP && due('trial_lfg', 150, 320) && !openActs((a) => a.kind === 'trial_lfg').length) makeTrialLfg();
    if (P.level >= D.LEVEL_CAP && due('trial_talk', 500, 1100)) trialTalk();
    if (P.level >= 4 && due('whisper', 130, 300) && !openActs((a) => a.whisper).length) makeWhisper();
    if (P.level >= 5 && due('trade', 240, 480)) makeTrade();
    if (P.level >= 8 && due('rare', 900, 1800)) makeRare();
    huntSightings();
    if (P.guild < 0 && P.level >= 5 && due('recruit', 900, 1500)) makeRecruit();
    if (P.guild >= 0 && due('guildreq', 110, 240) && openActs((a) => a.guild).length < 2) makeGuildRequest();
    if (P.guild >= 0 && due('guildtalk', 90, 220)) guildTalk();
    if (due('friend', 900, 1800)) friendVisit();
  };

  const LFG_TEXT = [
    (c) => `LF1M ${c.role} ${c.name}, ${c.have}/${c.size}`, (c) => `LFM ${c.name}, need ${c.role} then go`, (c) => `${c.name} needs a ${c.role}! pst`,
    (c) => `LF ${c.role} for ${c.name}, quick run`, (c) => `${c.name} ${c.have}/${c.size}, missing a ${c.role}, whisper me`, (c) => `anyone ${c.role}? ${c.name}, we have summons`,
    (c) => `need 1 ${c.role} for ${c.name}, full clear`, (c) => `${c.name} group forming, ${c.role} wanted, all quests shared`,
    (c) => `LFM ${c.name} ${c.have}/${c.size}, ${c.role} pst`, (c) => `${c.role} for ${c.name}? we're at the entrance`, (c) => `need ${c.role}, ${c.name}, chill group`, (c) => `${c.name} run, missing ${c.role}, then go`];
  const GUILD_LFG_TEXT = [(c) => `anyone want to run ${c.name}? need a ${c.role}`, (c) => `${c.name} with guildies, need ${c.role}, who's in?`, (c) => `guild run: ${c.name}, ${c.have}/${c.size}, need ${c.role}`,
    (c) => `we're doing ${c.name}, spot for a ${c.role}`, (c) => `${c.name} tonight? need a ${c.role} from the guild`, (c) => `guildies! ${c.name} needs a ${c.role}`, (c) => `${c.have}/${c.size} for ${c.name}, one ${c.role} from the guild?`];
  function makeLfg(guild, opts) {
    const P = G.S.player;
    const acts = joinableActs(opts);
    if (!acts.length) return;
    const k = pick(acts), A = D.ACTIVITIES[k];
    const bots = guild ? G.S.bots.filter((b) => b.guild === P.guild && B.isOnline(b, new Date())) : myBots();
    const lead = pick(bots.filter((b) => b.level >= A.minLvl - 2)) || pick(bots);
    if (!lead) return;
    const role = pick(G.roles());
    const size = A.size || 5, have = rint(1, size - 1);
    const c = { role: roleWord(role), name: A.name, have, size };
    post(guild ? 'guild' : 'lfg', lead, pick(guild ? GUILD_LFG_TEXT : LFG_TEXT)(c), { kind: 'lfg', act: k, role, leader: lead.id, guild: !!guild, until: now() + 4 * 60000 });
  }

  // Trials in chat (v10.7, stage 4): level-60 bots post real Trial groups, always at a level you have open on that
  // dungeon, so every one can be joined; and they talk about the week's Omens as plain statements, never requests
  const TRIAL_LFG_TEXT = [
    (c) => `LFM trial ${c.lvl} ${c.name}, need ${c.role}`, (c) => `LF1M ${c.role} ${c.name} trial ${c.lvl}, going for par`,
    (c) => `trial ${c.lvl} ${c.name} ${c.have}/5, need ${c.role}`, (c) => `${c.name} trial ${c.lvl}, timed run, need a ${c.role}`,
    (c) => `need ${c.role} for trial ${c.lvl} ${c.name}, chill but fast`];
  function makeTrialLfg() {
    const T = root.TRIALS; if (!T || !T.open(T.season(new Date()))) return;
    const acts = G.trialPicks().filter((k) => !G.trialBlock(k)); if (!acts.length) return;
    const k = pick(acts), max = G.trialMax(k), lvl = rint(Math.max(1, max - 3), max);
    const lead = pick(myBots().filter((b) => b.level >= D.LEVEL_CAP)); if (!lead) return;
    const role = pick(G.roles()), c = { role: roleWord(role), name: D.ACTIVITIES[k].name, lvl, have: rint(2, 4) };
    post('lfg', lead, pick(TRIAL_LFG_TEXT)(c), { kind: 'trial_lfg', act: k, lvl, role, leader: lead.id, until: now() + 4 * 60000 });
  }
  function trialTalk() {
    const T = root.TRIALS; if (!T || !T.open(T.season(new Date()))) return;
    const om = T.active(20, new Date()), b = pick(myBots().filter((x) => x.level >= D.LEVEL_CAP)); if (!om.length || !b) return;
    const O = T.OMENS[pick(om)].name.toLowerCase(), month = T.name(T.season(new Date())).split(' ')[0];
    post('general', b, pick([`${O} week again, my trial times are awful`, `timed trial ${rint(6, 14)} on ${O} week, so happy`, `${O} this week, i hate it`,
      `${month} rating finally went up`, `${O} week is my favourite, dont care what anyone says`, `one more trial and i log, for real this time`, `just missed par by 4 seconds on ${O} week`]));
  }

  function makeWhisper() {
    const S = G.S, P = S.player;
    const qt = questTarget(), ct = craftTarget();
    const kind = pickKind([
      ['help_kill', huntTarget() ? 2 : 0], ['quest_team', qt ? 3 : 0], ['wtb', sellable().length ? 2 : 0], ['wts', P.level >= 6 ? 1 : 0],
      ['swap', sellable().some((b) => b.n >= 5) && P.level >= 8 ? 1 : 0], ['where', 1], ['guild_invite', P.guild < 0 && (state().invites || 0) < 6 ? 1 : 0],
      ['carry', carryActs().length ? 2 : 0], ['craft_order', ct ? 2 : 0], ['duel', P.level >= 10 ? 1 : 0], ['ask_gear', P.equip.weapon ? 1 : 0], ['ask_spec', P.level >= 12 ? 1 : 0]]);
    const b = pick(myBots()); if (!b) return;
    const W = (text, act) => post('whisper', b, text, Object.assign({ whisper: true, bot: b.id }, act));
    if (kind === 'help_kill') {
      const h = huntTarget(); const M = D.MOBS[h.mob]; const pay = Math.round(M.lvl[1] * 12 * h.n + 50); const at = D.PLACES[h.place].name;
      W(pick([`hey can u help me kill ${h.n} ${M.name} at ${at}? ill pay ${coin(pay)}`, `need help with ${h.n} ${M.name} (${at}), group up? ${coin(pay)} for ur time`,
        `${M.name} keep killing me at ${at}, can u help? need ${h.n}, ${coin(pay)}`, `yo, ${h.n} ${M.name} at ${at} and im done with this quest. help? ${coin(pay)} on me`,
        `would u help me clear ${h.n} ${M.name}? ${at}. ill tip ${coin(pay)}`,
        `${M.name} at ${at} are too much for me solo, ${h.n} to go. ${coin(pay)} if u help`, `u look strong lol. help me with ${h.n} ${M.name}? ${at}, ${coin(pay)}`,
        `been dying to ${M.name} at ${at} all night. ${h.n} left, ${coin(pay)} for a hand?`, `2 of us would make ${h.n} ${M.name} easy. ${at}? ${coin(pay)} for ur time`]), Object.assign({ kind: 'help_kill', until: now() + 15 * 60000, pay, got: 0 }, h));
    } else if (kind === 'quest_team') {
      const Q = D.QUESTS[qt.qid], M = D.MOBS[qt.mob];
      W(pick([`hey u on "${Q.name}" too? want to team up, same ${M.name}`, `saw u killing ${M.name}, im on "${Q.name}" too, group?`, `wanna duo "${Q.name}"? faster together`,
        `"${Q.name}" is so slow solo lol, team up?`, `im doing "${Q.name}" at ${D.PLACES[qt.place].name} too, party?`,
        `both on "${Q.name}"? lets share kills`, `hey, "${Q.name}" buddy? i'll invite`, `${M.name} spawns are slow, want to group for "${Q.name}"?`, `same quest! "${Q.name}", duo it?`]), Object.assign({ kind: 'quest_team', until: now() + 20 * 60000 }, qt));
    } else if (kind === 'wtb') {
      const bag = pick(sellable()); const it = bag.item; const n = Math.min(bag.n, rint(5, 20)); const price = Math.max(n * 3, Math.round((it.sell || 1) * n * rnd(2.5, 4)));
      W(pick([`hey u have ${link(it)}? ill buy ${n} for ${coin(price)}`, `wtb ${n} ${link(it)} for ${coin(price)}, u selling?`, `need ${n} ${link(it)} for my profession, ${coin(price)}?`,
        `buying ${link(it)} x${n}, ${coin(price)}, better than the vendor`, `can i buy ${n} of ur ${link(it)}? ${coin(price)}`,
        `do u have spare ${link(it)}? ${n} for ${coin(price)}`, `paying ${coin(price)} for ${n} ${link(it)}, vendor gives way less`, `levelling my profession, need ${n} ${link(it)}. ${coin(price)}?`]), { kind: 'wtb', item: it.id, n, price });
    } else if (kind === 'wts') {
      const it = offerItem(); if (!it) return; const price = Math.round((it.sell || 10) * rnd(4, 6));
      W(pick([`wts ${link(it)} ${coin(price)}, good for a ${D.CLASSES[P.cls].name.toLowerCase()} ur level`, `hey, want ${link(it)}? ${coin(price)} and its yours`, `got a ${link(it)} i cant use, ${coin(price)}?`,
        `${link(it)} dropped for me but its ur armor type. ${coin(price)}?`, `selling ${link(it)} cheap, ${coin(price)}, looks like an upgrade for u`,
        `hey, ${link(it)} is yours for ${coin(price)} if u want it`, `no one in my group can use ${link(it)}, ${coin(price)}?`, `${link(it)} for ${coin(price)}? figured id ask u first`]), { kind: 'wts', itemData: it, price });
    } else if (kind === 'swap') {
      const bag = pick(sellable().filter((x) => x.n >= 5)); const n = Math.min(bag.n, rint(5, 12)); const it = offerItem(); if (!it) return;
      W(pick([`trade u my ${link(it)} for ${n} ${link(bag.item)}?`, `swap? my ${link(it)} for ur ${n} ${link(bag.item)}`, `need ${n} ${link(bag.item)}, ill give u ${link(it)} for them`, `i have ${link(it)}, u have ${n} ${link(bag.item)}. trade?`, `fair trade? ${link(it)} for ${n} ${link(bag.item)}`]), { kind: 'swap', item: bag.item.id, n, itemData: it });
    } else if (kind === 'where') {
      const q = whereQuestion(); if (!q) return;
      W(pick([`sorry to bother, where is ${q.name}?`, `hey do u know where ${q.name} is?`, `quick q: where do i find ${q.name}?`, `lost lol. which zone is ${q.name} in?`, `been looking for ${q.name} for ages, where is it?`, `ok i give up, where is ${q.name}?`, `hey, which way to ${q.name}?`]), Object.assign({ kind: 'where' }, q));
    } else if (kind === 'guild_invite') {
      const no = G.S.flags.declinedGuilds || [], gs = SOC.myGuilds().filter((x) => P.level >= x.min && !no.includes(x.g)); if (!gs.length) return; // not a guild you declined
      const g = pick(gs); const inv = g.officer || b;
      state().invites = (state().invites || 0) + 1;
      post('whisper', inv, pick([`hey! want to join <${g.name}>? ${g.blurb.toLowerCase()}`, `we're recruiting for <${g.name}>, ${g.style} guild. want an invite?`, `saw you around, <${g.name}> could use someone like you. interested?`, `hey, <${g.name}> has a spot open. want in?`, `we're a ${g.style} guild, <${g.name}>. want an invite?`]), { kind: 'guild_invite', whisper: true, bot: inv.id, g: g.g });
    } else if (kind === 'carry') {
      const k = pick(carryActs()), A = D.ACTIVITIES[k]; const tip = Math.round(A.maxLvl * rnd(80, 140));
      W(pick([`hey ur level ${P.level}? could u run me through ${A.name}? ill tip ${coin(tip)}`, `can u carry me in ${A.name}? i keep wiping lol, ${coin(tip)}`, `need a strong ${roleWord(G.role())} for ${A.name}, ${coin(tip)} tip`,
        `would u help my group through ${A.name}? we're all first timers. ${coin(tip)}`,
        `could u take me through ${A.name}? ${coin(tip)} for the trouble`, `my alt needs ${A.name} done. carry? ${coin(tip)}`, `quick ${A.name} run? ur overgeared for it, ${coin(tip)} tip`]), { kind: 'carry', act: k, tip, until: now() + 8 * 60000 });
    } else if (kind === 'craft_order') {
      const r = ct, it = D.ITEMS[r.makes], tip = Math.round((it.sell || 20) * rnd(2, 4) + 80);
      W(pick([`hey u can make ${link(it)} right? ill send the mats + ${coin(tip)}`, `could u craft me a ${link(it)}? mats on me, ${coin(tip)} tip`, `need a ${link(it)}, ill mail the materials. ${coin(tip)} for the work?`, `ur a crafter right? ${link(it)} please, ill send mats and ${coin(tip)}`, `commission: one ${link(it)}. mats + ${coin(tip)} from me`]), { kind: 'craft_order', rid: r.id, tip, sent: false, until: now() + 20 * 60000 });
    } else if (kind === 'duel') {
      const wager = Math.max(100, Math.round(P.level * rnd(20, 60)));
      W(pick([`duel? ${coin(wager)} on it`, `bored lol, duel? ${coin(wager)}`, `think u can beat a ${D.CLASSES[b.cls].name.toLowerCase()}? ${coin(wager)} says no`, `friendly duel? loser pays ${coin(wager)}`, `u vs me outside town? ${coin(wager)}`, `duel for ${coin(wager)}? just for fun`, `i need practice, duel? ${coin(wager)} to the winner`]), { kind: 'duel', wager, until: now() + 3 * 60000 });
    } else if (kind === 'ask_gear') {
      const it = P.equip.weapon;
      W(pick([`nice ${link(it)}! where did u get it?`, `ooh is that ${link(it)}? how`, `that ${link(it)} looks sick, drop or crafted?`, `where did u find ${link(it)}? i want one`, `${link(it)}! been farming for that, where from?`]), { kind: 'chat', topic: 'gear', item: it.id, itemData: it, until: now() + 4 * 60000 });
    } else if (kind === 'ask_spec') {
      W(pick([`what spec are u? thinking of trying ${D.CLASSES[P.cls].name.toLowerCase()}`, `hey, what talents do u use?`, `${D.CLASSES[P.cls].name.toLowerCase()} fun at ur level? what spec?`, `how do u spec ur ${D.CLASSES[P.cls].name.toLowerCase()}? mine feels weak`, `quick q, which talents did u go?`]), { kind: 'chat', topic: 'spec', until: now() + 4 * 60000 });
    }
  }
  function makeTrade() {
    const b = pick(myBots()); if (!b) return;
    const it = offerItem(); if (!it) return;
    const price = Math.round((it.sell || 10) * rnd(4.5, 7));
    post('general', b, pick([`WTS ${link(it)} ${coin(price)} pst`, `selling ${link(it)}, ${coin(price)}`, `${link(it)} for ${coin(price)}, anyone?`, `cleaning my bags: ${link(it)} ${coin(price)}`, `${link(it)}, ${coin(price)} or best offer`, `${link(it)}, ${coin(price)}, whisper me`, `anyone need ${link(it)}? ${coin(price)}`, `${link(it)} for sale, ${coin(price)}, cheaper than the AH`]), { kind: 'wts', bot: b.id, itemData: it, price, until: now() + 6 * 60000 });
  }
  function makeRare() {
    const r = rareTarget(); if (!r) return;
    const b = pick(myBots()); if (!b) return;
    const M = D.MOBS[r.mob], at = D.PLACES[r.place].name;
    G.spawnRare(r.place, r.mob);
    post('general', b, pick([`${M.name} is up at ${at}!`, `rare spotted: ${M.name}, ${at}, go go`, `just saw ${M.name} at ${at}, cant solo it lol`, `${M.name} at ${at} right now if anyone needs it`, `${M.name} spawned at ${at}!!`, `heads up, ${M.name} at ${at}`, `${M.name} up at ${at}, too tough for me`]), { kind: 'rare', bot: b.id, until: now() + 10 * 60000, ...r });
  }
  // a rare hunt's sighting (#43): when a level-60 rare's 30 minutes begin, a bot posts it in General, a real request with
  // a way there (kind 'rare'), once per window; for level-60 characters (the rares and their places are level-60 content)
  function huntSightings() {
    const S = G.S, P = S.player, t = now(); if (!G.huntRares || P.level < D.LEVEL_CAP) return;
    S.flags.huntPosted = S.flags.huntPosted || {};
    for (const r of G.huntRares()) {
      const h = G.huntNow(r.key, t); if (t < h.start || t >= h.end || S.flags.huntPosted[r.key] === h.w || !G.huntUp(r.key, t)) continue;
      S.flags.huntPosted[r.key] = h.w; if (!G.canReach(P.place, r.place)) continue;
      const b = pick(myBots()); if (!b) continue;
      const M = D.MOBS[r.key], at = D.PLACES[r.place].name;
      post('general', b, pick([`Rare sighting: ${M.name} at ${at}!`, `${M.name} is up at ${at}, rare hunt!`, `rare hunt: ${M.name} just showed up at ${at}`, `${M.name} spotted at ${at}, it won't stay long`]), { kind: 'rare', bot: b.id, until: h.end, mob: r.key, place: r.place });
    }
  }
  function makeRecruit() {
    const gs = SOC.myGuilds().filter((x) => x.members > 0); if (!gs.length) return;
    const g = pick(gs); const who = g.officer || pick(myBots()); if (!who) return;
    post('general', who, pick([`<${g.name}> is recruiting! ${g.style} guild, level ${g.min}+, pst`, `<${g.name}> ${g.blurb.toLowerCase()} whisper me for an invite`, `looking for more people for <${g.name}>, ${g.min}+ welcome`,
      `<${g.name}>: ${g.style} guild, friendly officers, ${g.min}+. apply any time`, `<${g.name}> ${g.style} guild looking for members, ${g.min}+. whisper me`, `join <${g.name}>! ${g.blurb.toLowerCase()}`]), { kind: 'guild_apply', bot: who.id, g: g.g, until: now() + 8 * 60000 });
  }
  function makeGuildRequest() {
    const S = G.S, P = S.player;
    const mate = onlineMate(); if (!mate) return;
    const kind = pickKind([['g_run', joinableActs({ dungeonOnly: true }).length ? 2 : 0], ['g_elite', joinableActs({ elite: true }).length ? 1 : 0], ['g_mats', 2], ['g_help', huntTarget() ? 2 : 0], ['g_where', 1], ['g_donate', 1], ['g_event', openActs((a) => a.kind === 'g_event').length ? 0 : 1]]);
    if (kind === 'g_run') return makeLfg(true, { dungeonOnly: true });
    if (kind === 'g_elite') return makeLfg(true, { elite: true });
    if (kind === 'g_mats') {
      const mats = Object.keys(D.ITEMS).filter((k) => D.ITEMS[k].slot === 'mat' && (D.ITEMS[k].lvl || 1) <= P.level + 5);
      const have = sellable().filter((b) => b.n >= 5);
      const it = have.length && chance(0.7) ? pick(have).item : D.ITEMS[pick(mats.length ? mats : ['linen_cloth'])];
      if (!it) return;
      const n = rint(5, 15);
      post('guild', mate, pick([`can anyone spare ${n} ${link(it)}? need them for crafting`, `looking for ${n} ${link(it)}, will pay back`, `anyone got ${n} ${link(it)} lying around?`, `guild bank is out of ${link(it)}, anyone? ${n} would do`, `short on ${link(it)} for guild crafting, need ${n}`, `${n} ${link(it)} from anyone who can spare them? will pay`]), { kind: 'g_mats', guild: true, bot: mate.id, item: it.id, n, pay: Math.round((it.sell || 1) * n * 3), until: now() + 12 * 60000 });
      return;
    }
    if (kind === 'g_help') {
      const h = huntTarget(); if (!h) return; const M = D.MOBS[h.mob];
      post('guild', mate, pick([`anyone free to help me with ${h.n} ${M.name} at ${D.PLACES[h.place].name}?`, `need a hand: ${h.n} ${M.name}, ${D.PLACES[h.place].name}`, `stuck on ${M.name} at ${D.PLACES[h.place].name}, help a guildie?`, `who can help with ${h.n} ${M.name}? ${D.PLACES[h.place].name}`, `guildie in need: ${M.name} at ${D.PLACES[h.place].name}, ${h.n} to go`]), Object.assign({ kind: 'help_kill', guild: true, bot: mate.id, until: now() + 15 * 60000, pay: Math.round(M.lvl[1] * 8 * h.n), got: 0 }, h));
      return;
    }
    if (kind === 'g_donate') {
      const amt = Math.max(100, Math.round(P.level * rnd(15, 30) / 10) * 10);
      post('guild', guildOfficer(), pick([`guild bank fund for new tabards, anyone chip in ${coin(amt)}?`, `we're saving for a guild bank tab, ${coin(amt)} helps a lot`, `potions for guild night, donations welcome: ${coin(amt)}`, `guild repair fund is low, ${coin(amt)} anyone?`, `saving for guild tabards, ${coin(amt)} each if you can`]), { kind: 'g_donate', guild: true, bot: guildOfficer().id, amt, until: now() + 15 * 60000 });
      return;
    }
    if (kind === 'g_event') {
      const acts = joinableActs({ dungeonOnly: true }); if (!acts.length) return;
      const k = pick(acts), A = D.ACTIVITIES[k], off = guildOfficer(), mins = rint(2, 4);
      post('guild', off, pick([`GUILD NIGHT: ${A.name} in ${mins} min! sign up here`, `guild event in ${mins} min, ${A.name}. who's coming?`, `${A.name} guild run starting in ${mins} min, bonus standing for everyone who shows`, `${A.name} guild run in ${mins} min, sign up!`, `event: ${A.name} in ${mins} min. let's fill it with guildies`]), { kind: 'g_event', guild: true, bot: off.id, act: k, startAt: now() + mins * 60000, until: now() + (mins + 3) * 60000, signed: false });
      return;
    }
    const q = whereQuestion(); if (!q) return;
    post('guild', mate, pick([`where is ${q.name} again?`, `guild, where do i find ${q.name}?`, `anyone know which zone ${q.name} is in?`, `lost again lol. ${q.name}?`, `where do u find ${q.name}? asking for a friend (me)`]), Object.assign({ kind: 'where', guild: true, bot: mate.id }, q));
  }
  // guildmates chat among themselves, and about you
  function guildTalk() {
    const P = G.S.player, a = onlineMate(); if (!a) return;
    const lines = [`just dinged ${Math.min(D.LEVEL_CAP, a.level + 1)}!`, `this week's goal is going well`, `who's online tonight?`, `lol i fell off the lift again`, `brb food`, `gz everyone on the weekly progress`, SOC.motd(P.guild).toLowerCase(),
      'finally finished my set', 'repair bills are killing me', 'love seeing everyone online', 'who else is on their alt tonight?', 'rolled a new alt, starting zones are so peaceful', 'best guild on the server, no contest'];
    if (P.level >= 10) lines.push(`${P.name} carrying the guild again`, `thanks for the help earlier ${P.name}`);
    const m = post('guild', a, pick(lines));
    if (chance(0.5)) { const b = onlineMate(a.id); if (b) G.S.pending.push({ at: now() + rnd(3000, 9000), bot: b.id, ch: 'guild', text: voice(b, pick(['lol', 'same', 'nice', 'gz!', 'haha', 'yep', 'lmao', 'o/'])) }); }
    return m;
  }
  // a bot you helped comes back: a gift, or an invite to a run
  function friendVisit() {
    const fr = SOC.friends().filter((f) => B.isOnline(f.bot, new Date()) && now() - f.last > 20 * 60000);
    if (!fr.length) return;
    const f = pick(fr), b = f.bot, P = G.S.player;
    const acts = joinableActs();
    if (acts.length && chance(0.5) && !openActs((a) => a.whisper).length) {
      const k = pick(acts), A = D.ACTIVITIES[k];
      post('whisper', b, pick([`hey its ${b.name}${f.where ? ' from ' + D.PLACES[f.where].name : ''}! want to run ${A.name} with me?`, `${P.name}! doing ${A.name}, want in? would be fun`, `we still need someone for ${A.name}, u in? :)`, `${P.name}, got a spot in ${A.name} if u want it`, `remember me? we're doing ${A.name}, join?`]), { kind: 'lfg', whisper: true, bot: b.id, act: k, role: pick(G.roles()), leader: b.id, until: now() + 5 * 60000 });
    } else {
      const gift = chance(0.5) ? offerItem() : null;
      const gold = Math.round(P.level * rnd(20, 50));
      post('whisper', b, gift ? pick([`hey, found this and thought of u: ${link(gift)}`, `thanks again for the help, have this ${link(gift)}`, `ty for last time, this is for u: ${link(gift)}`]) : pick([`thanks again for earlier! sent u ${coin(gold)}`, `still grateful for the help, here's ${coin(gold)}`, `sent u ${coin(gold)}, for the help that day`]), { kind: 'gift', whisper: true, bot: b.id, itemData: gift, gold: gift ? 0 : gold, until: now() + 10 * 60000 });
    }
    f.last = now();
  }
  function offerItem() {
    const P = G.S.player;
    if (chance(0.2) && D.ITEMS.small_pouch) return G.copyItem(P.level >= 20 && D.ITEMS.linen_bag ? 'linen_bag' : 'small_pouch');
    const C = D.CLASSES[P.cls];
    const slot = pick(['chest', 'legs', 'feet', 'hands', 'wrist', 'waist', 'back', 'weapon']);
    return G.genGear(slot, Math.max(2, P.level + rint(-1, 1)), chance(0.08) ? 3 : 2, slot === 'weapon' ? { wtype: pick(C.weapons) } : slot === 'back' ? {} : { atype: C.armorType });
  }
  function whereQuestion() {
    const P = G.S.player;
    const places = Object.keys(D.PLACES).filter((k) => { const p = D.PLACES[k]; return p.lvl && p.lvl[0] <= P.level + 6 && p.lvl[1] >= P.level - 12 && p.zone && !G.enemyTown(k); });
    if (!places.length) return null;
    const k = pick(places), p = D.PLACES[k];
    const zones = [...new Set(Object.values(D.PLACES).map((x) => x.zone).filter((z) => z && z !== p.zone))];
    const wrong = []; while (wrong.length < 2 && zones.length) wrong.push(zones.splice(Math.floor(Math.random() * zones.length), 1)[0]);
    return { place: k, name: p.name, answer: p.zone, answers: [p.zone, ...wrong].sort(() => Math.random() - 0.5) };
  }

  // ------------------------------------------------------------ doing what a message asks
  const botById = (id) => G.S.bots.find((b) => b.id === id);
  SOC.actions = function (m) {
    const a = m && m.act; if (!a || a.state !== 'open') return [];
    const S = G.S, P = S.player;
    const b = botById(a.bot || a.leader);
    const reply = (text, ch) => { if (b) S.pending.push({ at: now() + rnd(1200, 2800), bot: b.id, ch: ch || (m.ch === 'lfg' || m.ch === 'general' ? 'whisper' : m.ch), text: voice(b, text) }); };
    const close = (st) => { a.state = st || 'done'; G.emitChange(); };
    const decline = { label: 'No thanks', fn: () => { close('declined'); if (b && (a.whisper || a.guild) && chance(0.6)) reply(tone(b) === 'rude' ? pick(['k whatever', 'ok', 'fine', 'whatever', 'ok then']) : pick(['np', 'ok no worries', 'all good', 'no problem!', 'all good!', 'no stress'])); } };
    const help = () => { weekProgress('help', 1); };
    if (a.kind === 'lfg') {
      return [{ label: `Join as ${roleName(a.role)}`, primary: true, fn: () => { if (G.joinChatGroup(a.act, a.role, { leader: a.leader, guild: a.guild ? P.guild : null, soc: a.guild ? { kind: 'g_run' } : null })) { close(); help(); } } }, decline];
    }
    if (a.kind === 'trial_lfg') {
      return [{ label: `Join Trial ${a.lvl} as ${roleName(a.role)}`, primary: true, fn: () => { if (G.joinChatTrial(a.act, a.lvl, a.role, { leader: a.leader })) { close(); help(); } } }, decline];
    }
    if (a.kind === 'help_wanted') {
      const r = (S.helpWanted || []).find((x) => x.id === a.hw);
      if (!r) return [{ label: 'Someone else took this spot', disabled: true, why: true, fn: () => null }]; // says what happened (#166)
      // the request closes only when the join worked; a refusal is told and the request stays (#166)
      return [{ label: `Help as ${roleName(r.role)}`, primary: true, fn: () => { if (S.run || S.queue || G.fight) return 'Leave your current group first.'; const why = G.joinHelpWanted(r.id); if (why) return why; close(); help(); } }, decline];
    }
    if (a.kind === 'carry') {
      return [{ label: `Run it (tip ${coin(a.tip)})`, primary: true, fn: () => { if (G.joinChatGroup(a.act, G.role(), { leader: a.bot, soc: { kind: 'carry', tip: a.tip, bot: a.bot } })) { close(); help(); } } }, decline];
    }
    if (a.kind === 'help_kill' || a.kind === 'quest_team') {
      if (a.accepted) return [{ label: 'Cancel', fn: () => { if (a.kind === 'help_kill') finishHelp(m, false); else finishTeam(m, false); close('declined'); } }];
      return [{ label: a.kind === 'quest_team' ? 'Team up' : 'Help', primary: true, fn: () => {
        if (S.run || S.queue) return 'Not while in the group finder.';
        if (G.partySize() >= 3) return 'Your party is full.';
        a.accepted = true; a.until = now() + 20 * 60000;
        if (b) G.addToParty(b, { meet: a.place, until: a.until });
        reply(pick(['omg ty! meet me there', 'thanks!! on my way', 'ty, lets go', 'yay, inviting', 'sweet, party up', 'omw!', 'u r the best, see u there']));
        G.sys(a.kind === 'quest_team' ? `${b ? b.name : 'They'} joined your party for "${D.QUESTS[a.qid].name}".` : `${b ? b.name : 'They'} joined your party. Kill ${a.n} ${D.MOBS[a.mob].name} at ${D.PLACES[a.place].name}.`);
        G.emitChange();
        if (P.place !== a.place) return 'route:' + a.place;
      } }, decline];
    }
    if (a.kind === 'wtb') {
      const have = G.countItem(a.item);
      return [{ label: have >= a.n ? `Sell ${a.n} for ${coin(a.price)}` : `You have ${have}/${a.n}`, primary: true, disabled: have < a.n, why: have < a.n, fn: () => {
        if (G.countItem(a.item) < a.n) return `You need ${a.n}.`;
        G.removeItem(a.item, a.n); P.money += a.price;
        G.sys(`You sold ${a.n} ${D.ITEMS[a.item].name} to ${b ? b.name : 'them'} for ${coin(a.price)}.`);
        reply(pick(['ty!', 'pleasure doing business', 'thx a lot', 'perfect, ty', 'awesome, ty', 'exactly what i needed'])); befriend(b, P.place); help(); close();
      } }, decline];
    }
    if (a.kind === 'wts') {
      // a disabled button says why (#169): the label is the shortfall
      const short = a.price - P.money;
      return [{ label: short > 0 ? `Need ${coin(short)}` : `Buy for ${coin(a.price)}`, primary: true, disabled: short > 0, why: short > 0, need: short > 0 ? short : 0, fn: () => {
        if (P.money < a.price) return 'Not enough money.';
        if (G.bagsFull()) return 'Your bags are full.';
        P.money -= a.price; G.addItem(JSON.parse(JSON.stringify(a.itemData)), 1);
        G.sys(`You bought ${a.itemData.name} from ${b ? b.name : 'them'} for ${coin(a.price)}.`);
        reply(pick(['ty!', 'enjoy', 'gl with it', 'nice doing business'])); close();
      } }, { label: 'Haggle', fn: () => {
        const ok = chance(tone(b) === 'nice' ? 0.7 : tone(b) === 'rude' ? 0.2 : 0.45);
        if (ok) { a.price = Math.round(a.price * 0.8); reply(pick([`ok ${coin(a.price)} then`, `fine, ${coin(a.price)}`, `deal at ${coin(a.price)}`])); return `They drop it to ${coin(a.price)}.`; }
        reply(pick(['nah thats the price', 'no, firm', 'lol no'])); return 'They won\'t go lower.';
      } }, decline];
    }
    if (a.kind === 'swap') {
      const have = G.countItem(a.item);
      const full = have >= a.n && G.bagsFull();
      return [{ label: have < a.n ? `You have ${have}/${a.n}` : full ? 'Bags full' : `Swap ${a.n} ${D.ITEMS[a.item].name}`, primary: true, disabled: have < a.n || full, why: have < a.n || full, fn: () => {
        if (G.countItem(a.item) < a.n) return `You need ${a.n}.`;
        G.removeItem(a.item, a.n); G.addItem(JSON.parse(JSON.stringify(a.itemData)), 1);
        G.sys(`You traded ${a.n} ${D.ITEMS[a.item].name} for ${a.itemData.name}.`);
        reply(pick(['ty, fair trade', 'perfect', 'deal!'])); befriend(b, P.place); close();
      } }, decline];
    }
    if (a.kind === 'craft_order') {
      const r = D.RECIPES[a.rid], it = D.ITEMS[r.makes];
      if (!a.sent) return [{ label: 'Take the order', primary: true, fn: () => {
        // every material must fit before any is added; otherwise the order stays open (#162: they used to be lost)
        const short = G.slotsShort(Object.keys(r.mats).map((k) => [D.ITEMS[k], r.mats[k]]));
        if (short) return `Make room for ${short} material${short === 1 ? '' : 's'} first.`;
        for (const k in r.mats) G.addItem(G.copyItem(k), r.mats[k]);
        a.sent = true; a.until = now() + 20 * 60000;
        G.sys(`${b ? b.name : 'They'} sent you the materials for ${it.name}. Craft it, then hand it over here.`);
        reply(pick(['sent the mats, ty!!', 'thanks, no rush'])); // no mail line: the game has no mail (#162)
        G.emitChange();
      } }, decline];
      const made = G.countItem(r.makes);
      return [{ label: made ? `Hand over ${it.name} (+${coin(a.tip)})` : `Craft ${it.name} first`, primary: true, disabled: !made, why: !made, fn: () => {
        if (!G.countItem(r.makes)) return `Craft ${it.name} first (Hero → Professions).`;
        G.removeItem(r.makes, 1); P.money += a.tip;
        G.sys(`You handed ${it.name} to ${b ? b.name : 'them'} and got ${coin(a.tip)}.`);
        reply(pick(['perfect, exactly what i needed', 'ur a legend, ty', 'looks great!'])); befriend(b, P.place); help(); close();
      } }, { label: 'Cancel', fn: () => { close('declined'); reply('ok no worries, keep the mats'); } }];
    }
    if (a.kind === 'duel') {
      const short = a.wager - P.money; // (#169)
      return [{ label: short > 0 ? `Need ${coin(short)}` : `Accept (${coin(a.wager)})`, primary: true, disabled: short > 0, why: short > 0, need: short > 0 ? short : 0, fn: () => {
        if (P.money < a.wager) return 'You can\'t cover the wager.';
        if (!G.startDuel(a.bot, a.wager)) return null;
        close();
      } }, { label: 'Duel for fun', fn: () => { if (G.startDuel(a.bot, 0)) close(); } }, decline];
    }
    if (a.kind === 'rare') {
      const M = D.MOBS[a.mob];
      return [{ label: P.place === a.place ? `${M.name} is here` : 'Go there', primary: true, disabled: P.place === a.place, why: P.place === a.place, fn: () => (P.place === a.place ? null : 'route:' + a.place) }, { label: 'Not interested', fn: () => close('declined') }];
    }
    if (a.kind === 'gift') {
      return [{ label: 'Thank them', primary: true, fn: () => {
        if (a.itemData) { if (G.bagsFull()) return 'Your bags are full.'; G.addItem(JSON.parse(JSON.stringify(a.itemData)), 1); G.sys(`${b ? b.name : 'They'} gave you ${a.itemData.name}.`); }
        if (a.gold) { P.money += a.gold; G.sys(`${b ? b.name : 'They'} sent you ${coin(a.gold)}.`); }
        G.say('whisper', pick(['aw thanks!', 'ty, u didnt have to!', 'thank u :)']), b && b.name); befriend(b); close();
      } }];
    }
    if (a.kind === 'chat') {
      const ans = a.topic === 'gear' ? [a.itemData && a.itemData.source ? `from ${a.itemData.source}` : 'a quest reward', 'dropped in a dungeon', 'crafted it', 'the auction house'] : (D.TALENTS[P.cls] || []).map((t) => t.name).concat(['still figuring it out']);
      return ans.map((x) => ({ label: x, fn: () => {
        G.say('whisper', a.topic === 'gear' ? x : `${x} mostly`, b && b.name);
        reply(pick(a.topic === 'gear' ? ['nice, ty!', 'oh cool, gonna try that', 'lucky!', 'ty for the tip'] : ['ooh ok, ty', 'nice, might try that', 'cool, thanks!', 'makes sense']));
        befriend(b); close();
      } }));
    }
    if (a.kind === 'where') {
      return a.answers.map((z) => ({ label: z, fn: () => {
        const right = z === a.answer;
        G.say(m.ch === 'guild' ? 'guild' : 'whisper', `it's in ${z}`, b && b.name);
        if (right) { reply(pick(['oh ty!!', 'thanks a lot', 'found it, ty', 'ur a lifesaver'])); if (a.guild) addStanding(5, 'helped a guildmate'); else if (G.addMarks) G.addMarks(1, 'helped someone find their way'); befriend(b); help(); }
        else reply(pick(['hm pretty sure thats not it lol', 'u sure? cant find it', 'nope not there', 'thats not right i think']));
        close(right ? 'done' : 'declined');
      } })).concat([decline]);
    }
    if (a.kind === 'guild_invite') return [{ label: `Join <${B.GUILDS[a.g]}>`, primary: true, disabled: P.guild >= 0, fn: () => { if (P.guild >= 0) return 'You are already in a guild.'; G.joinGuild(a.g); close(); } }, decline];
    if (a.kind === 'guild_apply') return [{ label: `Apply to <${B.GUILDS[a.g]}>`, primary: true, disabled: P.guild >= 0, fn: () => { const why = SOC.apply(a.g); if (why) return why; close(); } }, decline]; // closes only on success (#166)
    if (a.kind === 'g_mats') {
      const have = G.countItem(a.item);
      return [{ label: have >= a.n ? `Give ${a.n}` : `You have ${have}/${a.n}`, primary: true, disabled: have < a.n, why: have < a.n, fn: () => {
        if (G.countItem(a.item) < a.n) return `You need ${a.n}.`;
        G.removeItem(a.item, a.n); P.money += a.pay;
        G.sys(`You gave ${a.n} ${D.ITEMS[a.item].name} to ${b ? b.name : 'your guildmate'}; they paid you ${coin(a.pay)}.`);
        reply(pick(['ur the best, ty', 'thank u!!', 'lifesaver', 'guild mvp'])); addStanding(20, 'materials for the guild'); help(); close();
      } }, decline];
    }
    if (a.kind === 'g_donate') {
      return [{ label: `Donate ${coin(a.amt)}`, primary: true, disabled: P.money < a.amt, fn: () => {
        if (P.money < a.amt) return 'Not enough money.';
        P.money -= a.amt; G.sys(`You donated ${coin(a.amt)} to the guild bank.`);
        reply(pick(['thank you!', 'appreciated!', 'ty, the guild thanks u'])); addStanding(15, 'a donation'); help(); close();
      } }, decline];
    }
    if (a.kind === 'g_event') {
      if (a.signed) return [{ label: 'Signed up', disabled: true, why: true, fn: () => null }, { label: 'Drop out', fn: () => { a.signed = false; G.emitChange(); } }];
      return [{ label: 'Sign up', primary: true, fn: () => { a.signed = true; reply(pick(['see u there!', 'great, one more', 'nice'])); G.sys(`You signed up for the guild run. It starts in ${Math.max(0, Math.ceil((a.startAt - now()) / 60000))} min.`); G.emitChange(); } }, decline];
    }
    return [];
  };
  function finishHelp(m, ok) {
    const a = m.act, S = G.S, P = S.player, b = botById(a.bot);
    a.accepted = false;
    leaveParty(b);
    if (ok) {
      P.money += a.pay;
      G.sys(`${b ? b.name : 'They'} paid you ${coin(a.pay)} for the help.`);
      if (b) S.pending.push({ at: now() + 1500, bot: b.id, ch: a.guild ? 'guild' : 'whisper', text: voice(b, pick(['thanks so much!! sent u the gold', 'done! ty, here u go', 'couldnt have done it without u', 'gg, gold sent', 'that was quick, ty!', 'u saved me an hour'])) });
      if (a.guild) addStanding(25, 'helped a guildmate');
      else if (G.addMarks) G.addMarks(2, 'helped another player');
      befriend(b, a.place); weekProgress('help', 1);
    } else if (b) S.pending.push({ at: now() + 1500, bot: b.id, ch: a.guild ? 'guild' : 'whisper', text: voice(b, pick(['no worries, gotta go', 'ok ill find someone else', 'np, maybe later', 'np, ill manage'])) });
    G.emitChange();
  }
  function finishTeam(m, ok) {
    const a = m.act, S = G.S, b = botById(a.bot);
    a.accepted = false;
    leaveParty(b);
    if (ok && b) { S.pending.push({ at: now() + 1500, bot: b.id, ch: 'whisper', text: voice(b, pick(['done! ty for the group', 'that was way faster, thx', 'gg, good luck out there', 'ty! add me if u need help', 'quest done, ty for the group', 'gg, see u around'])) }); befriend(b, a.place); if (G.addMarks) G.addMarks(1, 'teamed up'); }
    G.emitChange();
  }
  function leaveParty(b) {
    const S = G.S;
    if (S.wparty && b) { const i = S.wparty.members.findIndex((x) => x.bot.id === b.id); if (i >= 0) { S.wparty.members.splice(i, 1); if (!S.wparty.members.length) S.wparty = null; } }
  }
  function startGuildEvent(m) {
    const a = m.act, S = G.S;
    a.started = true;
    if (S.run || S.queue || G.fight) { a.state = 'expired'; G.sys('The guild run started without you.'); return; }
    if (G.joinChatGroup(a.act, G.role(), { leader: a.bot, guild: S.player.guild, soc: { kind: 'g_event' } })) a.state = 'done';
  }
  SOC.onKill = function (mob) {
    const S = G.S;
    for (const m of openActs((a) => a.kind === 'help_kill' && a.accepted && a.mob === mob)) {
      m.act.got++;
      if (m.act.got >= m.act.n) { m.act.state = 'done'; finishHelp(m, true); }
      else if (m.act.got === Math.ceil(m.act.n / 2)) { const b = botById(m.act.bot); if (b) S.pending.push({ at: now() + 800, bot: b.id, ch: 'party', text: voice(b, pick(['halfway there', 'nice, keep going', `${m.act.got}/${m.act.n}`, 'we got this', 'almost there', 'couple more'])) }); }
    }
    for (const m of openActs((a) => a.kind === 'rare' && a.mob === mob)) {
      m.act.state = 'done';
      const P = S.player, gold = P.level * 60; P.money += gold;
      G.sys(`You got ${D.MOBS[mob].name}! +${coin(gold)} bounty from the realm.`);
      if (G.addMarks) G.addMarks(1, 'a rare kill');
      const b = botById(m.act.bot); if (b) S.pending.push({ at: now() + 1500, bot: b.id, ch: 'general', text: voice(b, pick([`gz ${P.name}, u got ${D.MOBS[mob].name}!`, `nice, ${P.name} got it`, 'gz on the rare!'])) });
    }
    if (S.player.guild >= 0) weekProgress('kill', 1);
  };
  SOC.onRunComplete = function (d) {
    const S = G.S;
    if (d && d.soc && d.soc.kind === 'carry') { S.player.money += d.soc.tip; G.sys(`Your carry is done: +${coin(d.soc.tip)} tip.`); const b = botById(d.soc.bot); if (b) { S.pending.push({ at: now() + 2500, bot: b.id, ch: 'whisper', text: voice(b, pick(['ty so much, tip sent!', 'that was amazing, thx', 'u carried hard, ty'])) }); befriend(b); } }
    if (d && d.soc && (d.soc.kind === 'g_run' || d.soc.kind === 'g_event')) { addStanding(d.soc.kind === 'g_event' ? 60 : 40, d.soc.kind === 'g_event' ? 'guild night' : 'a guild run'); const bonus = SOC.perk('marks'); if (bonus && G.addMarks) G.addMarks(bonus, 'guild run'); }
    const A = d && D.ACTIVITIES[d.act];
    if (A && A.dungeon && S.player.guild >= 0) {
      weekProgress('boss', D.DUNGEONS[A.dungeon].pulls.filter((p) => p.boss).length);
      if (chance(0.5)) { const mt = onlineMate(); if (mt) S.pending.push({ at: now() + rnd(4000, 9000), bot: mt.id, ch: 'guild', text: voice(mt, pick([`gz on ${A.name}!`, `nice clear ${S.player.name}`, `${A.name} done? gz!`, 'gz on the run'])) }); }
    }
  };
  G.on('kill', (d) => { try { SOC.onKill(d.mob); } catch (e) { console.error(e); } });
  G.on('runComplete', (d) => { try { SOC.onRunComplete(d); } catch (e) { console.error(e); } });

  // ------------------------------------------------------------ quick replies (for any message from someone)
  SOC.replies = function (m) {
    if (!m || !m.from || m.me) return [];
    const t = (m.text || '').toLowerCase();
    const ch = m.ch === 'whisper' ? 'whisper' : m.ch === 'party' ? 'party' : m.ch === 'guild' ? 'guild' : m.ch === 'say' ? 'say' : 'whisper';
    let opts;
    if (/\b(hi|hey|hello|yo|sup|o\/|wb)\b/.test(t)) opts = ['hey!', 'o/', 'hi :)', 'welcome back'];
    else if (/\?/.test(t)) opts = ['no idea sorry', 'yes', 'no', 'check the map'];
    else if (/\b(ty|thx|thanks)\b/.test(t)) opts = ['np', 'anytime', 'yw', 'glad to help'];
    else if (/\b(gz|grats|congrats)\b/.test(t)) opts = ['ty!', 'thanks :)', 'finally lol'];
    else if (/\b(lol|haha|lmao|wkwk)\b/.test(t)) opts = ['lol', 'haha', 'xD'];
    else if (/\b(gg|wp)\b/.test(t)) opts = ['gg', 'gg wp', 'rematch sometime'];
    else opts = ['lol', 'true', 'nice', 'same'];
    return opts.map((txt) => ({ label: txt, ch, fn: () => { if (ch === 'whisper') G.S.lastWhisper = m.from; G.say(ch, txt, ch === 'whisper' ? m.from : undefined); } }));
  };
})(typeof window !== 'undefined' ? window : globalThis);
