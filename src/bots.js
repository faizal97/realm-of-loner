// Realm of Loner — the simulated server: population, schedules, levelling, chat.
(function (root) {
  const D = root.D;
  const B = {};
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const chance = (p) => Math.random() < p;
  // #74: chat, its timing and speakers, and the news's flavour draw from the cosmetic stream (E.crand); who the bots
  // are (names, classes, levels, new players) stays on Math.random
  const crand = () => root.E.crand(), cpick = (a) => root.E.cpick(a), cchance = (p) => root.E.cchance(p);

  // Stable pseudo-random from ints (so "is X online at hour H" doesn't flicker).
  function hash(a, b) {
    let h = (a * 374761393 + b * 668265263) | 0;
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  B.hash = hash;

  // ------------------------------------------------------------- names
  const SYL_A = ['Ael', 'Bran', 'Cor', 'Dar', 'El', 'Fen', 'Gal', 'Hal', 'Ith', 'Jor', 'Kel', 'Lor', 'Mar', 'Nor', 'Or', 'Per', 'Quel', 'Ro', 'Syl', 'Tor', 'Ul', 'Val', 'Wyn', 'Yor', 'Zan', 'Bel', 'Thal', 'Mor', 'Ser', 'Kal'];
  const SYL_B = ['a', 'ia', 'or', 'in', 'wen', 'dor', 'ric', 'eth', 'ius', 'ara', 'on', 'ys', 'iel', 'ok', 'rim', 'as', 'en', 'ith', 'anor', 'wyn'];
  const MEME = ['Arrowxx', 'Healzplz', 'Stabbyjoe', 'Pwnzor', 'Xxshadowxx', 'Tankyboi', 'Frostyfingers', 'Dotsndots', 'Lootgoblin', 'Critmonster',
    'Bubblehearth', 'Gankalot', 'Noobslayer', 'Manadrinker', 'Pumpkinpie', 'Kobolddad', 'Coinpurse', 'Muffinz', 'Sneakysneak', 'Holyguacamole',
    'Lanternlol', 'Ledgerbff', 'Chargeyy', 'Fireballz', 'Shieldbro', 'Stabwound', 'Renewbie', 'Smitehappens', 'Backstabber', 'Polymorphine',
    'Budidps', 'Asepheals', 'Ucoktank', 'Kakashiii', 'Mamangmage', 'Jokowarrior', 'Tehpucuk', 'Nasgorheal', 'Satebandit', 'Kopisusu'];
  // names the syllables can build that belong to someone else's world (#275); test/bot-names.test.js lists every
  // name the syllables can make and checks it against this and tools/rename_v10.json
  const NAME_BLOCK = new Set(['Mordor', 'Moria', 'Gondor', 'Rohan', 'Arwen', 'Elrond', 'Isildur', 'Elendil', 'Sauron', 'Morgoth', 'Gandalf', 'Gimli', 'Thorin', 'Erebor', 'Arnor', 'Lorien']);
  B.NAME_PARTS = { a: SYL_A, b: SYL_B, end: ['a', 'e', 'i'] }; B.NAME_BLOCK = NAME_BLOCK;
  B.makeName = function (used) {
    for (let i = 0; i < 50; i++) {
      let n;
      if (chance(0.3)) n = pick(MEME) + (chance(0.4) ? pick(['', 'x', 'z', 'y', 'o']) : '');
      else n = pick(SYL_A) + pick(SYL_B) + (chance(0.15) ? pick(['a', 'e', 'i']) : '');
      n = n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
      if (n.length > 12) n = n.slice(0, 12);
      if (!used.has(n) && !NAME_BLOCK.has(n)) { used.add(n); return n; }
    }
    // every short name taken: a longer one, still unique (#302: 'Alt' + a number repeated and read as a placeholder)
    const take = (n) => { const c = n.slice(0, 12).charAt(0).toUpperCase() + n.slice(1, 12).toLowerCase(); if (used.has(c) || NAME_BLOCK.has(c)) return null; used.add(c); return c; };
    for (let i = 0; i < 50; i++) { const c = take(pick(SYL_A) + pick(SYL_B) + pick(SYL_B).replace(/^[aeiou](?=..)/, '')); if (c) return c; }
    // the dice can't find one (or are fixed): the first free one in order, which always ends. The walk goes on from where
    // the last name stopped, so thousands of names after a long time away stay quick (#379); a name it passed is taken for good
    const at = walks.get(used) || walks.set(used, walk()).get(used);
    for (let r = at.next(); !r.done; r = at.next()) { const c = take(r.value); if (c) return c; }
    return 'Alt' + used.size;
  };
  const walks = new WeakMap();
  function* walk() { for (const x of SYL_A) for (const y of SYL_B) for (const z of SYL_B) for (const w of [''].concat(SYL_B)) yield x + y + z.replace(/^[aeiou](?=..)/, '') + w; }

  const GUILDS = ['Brackenford Legends', 'Crimson Vanguard', 'Knights of Ambermoor', 'Pumpkin Patrol', 'Grey Hood Dropouts', 'Lions Pride', 'Mireling Mafia', 'Starlight Vanguard',
    'Blood and Thunder', 'Sons of the Storm', 'Dust Eaters', 'Bonewall Raiders', 'Kessari Hexers',
    'Hourglass Wardens', 'Red Clock Runners']; // new guilds go on the end: a save keeps its guild by index
  const GUILD_FACTION = GUILDS.map((g, i) => (i < 8 || i === 13 ? 'alliance' : 'horde'));
  // the Trials guilds (#566) take level-60 players only, filled by B.fillGuilds; the random joins and moves keep to
  // the first 13, so every sim's random stream stays as it was
  const DRAWN = 13;
  // a guild that asks for level 60 (raiding, Trials) only takes level-60 players (#568); the min comes from SOC once it has loaded
  const fits = (i, lvl) => !(root.SOC && SOC.guildMin) || SOC.guildMin(i) < 60 || (lvl || 1) >= 60;
  B.GUILDS = GUILDS; B.GUILD_FACTION = GUILD_FACTION;
  B.factionOf = (bot) => ((D.RACES[bot.race] || {}).faction || 'alliance');

  // ------------------------------------------------------------- population
  B.makeBot = function (id, used, opts) {
    opts = opts || {};
    const cls = pick(['warrior', 'warrior', 'mage', 'mage', 'priest', 'rogue', 'rogue', 'priest', 'paladin', 'paladin', 'warlock', 'warlock', 'hunter', 'hunter', 'druid', 'druid', 'shaman', 'shaman', 'bard', 'bard']); // the Bard since #255
    const styleR = Math.random();
    const style = styleR < 0.5 ? 'casual' : styleR < 0.85 ? 'regular' : 'tryhard';
    return {
      id, name: B.makeName(used), cls, race: pick(['human', 'human', 'dwarf', 'gnome', 'nightelf', 'nightelf', 'orc', 'orc', 'troll', 'troll', 'tauren', 'tauren', 'undead', 'undead']), gender: chance(0.55) ? 'm' : 'f', skin: Math.floor(Math.random() * 4), hair: Math.floor(Math.random() * 5),
      level: opts.level || 1, xpf: Math.random() * 0.5, style,
      skill: Math.min(1, Math.max(0.05, (style === 'tryhard' ? 0.75 : style === 'regular' ? 0.55 : 0.35) + (Math.random() - 0.5) * 0.4)),
      social: Math.random(), toxic: Math.random() < 0.15 ? 0.6 + Math.random() * 0.4 : Math.random() * 0.3, ninja: Math.random() < 0.08,
      guild: -1,
      peak: 17 + Math.floor(Math.random() * 7) - (chance(0.2) ? 10 : 0), hours: style === 'tryhard' ? 8 : style === 'regular' ? 5 : 3,
      born: Date.now(),
    };
  };

  // Guilds only take members of their own faction.
  B.assignGuild = function (bot) {
    if (Math.random() >= 0.45) { bot.guild = -1; return bot; }
    const f = B.factionOf(bot);
    const opts = GUILDS.map((g, i) => i).filter((i) => i < DRAWN && GUILD_FACTION[i] === f && fits(i, bot.level));
    bot.guild = opts[Math.floor(Math.random() * opts.length)];
    return bot;
  };
  // A fresh-launch server: most bots start at 1-3.
  B.makePopulation = function (n) {
    const used = new Set();
    const bots = [];
    for (let i = 0; i < n; i++) bots.push(B.assignGuild(B.makeBot(i + 1, used, { level: 1 + Math.floor(Math.random() * Math.random() * 4) })));
    return bots;
  };

  // #71: the realm keeps today's people under the level cap (B.ROSTER_CAP, in today's level spread: B.BANDS, measured on
  // the old roster), so the zones you level in and every rate that scales with bots online there are unchanged; on top,
  // up to B.VETERANS at the cap, who stay. Over a band's share, people quit as in real games: the newest first (a first
  // day, then a first week), so those who stay level up and the top fills over time. Nobody someone knows vanishes
  // silently: a friend of any character on the account (S.server.keep, by name) takes a break instead (at most once a
  // month), says so, and comes back after a few days; a guildmate of yours who quits says goodbye in guild chat first.
  B.ROSTER_CAP = 420; B.VETERANS = 80; B.NEW_PER_HOUR = 3; B.NEW_FOR_MS = 90 * 86400000; B.GUILD_SHARE = 0.42; // the share in a guild on a new realm (#328)
  // levels 1-20, 21-39 and 40-59: today's roster from day 15 on (sim/population.js TODAY); 21-59 as one band emptied
  // 40-59 (the newest there are the ones who just reached 21, so few lasted to 40, #312)
  B.BANDS = [{ max: 20, n: 325 }, { max: 39, n: 45 }, { max: 59, n: 50 }];
  B.quitWeight = (b, t) => { const days = (t - (b.born || 0)) / 86400000; return days < 2 ? 1 : days < 7 ? 0.2 : days < 21 ? 0.02 : 0.002; }; // three weeks in, few quit (#312)
  B.BREAK_DAYS = [3, 14]; B.BREAK_EVERY = 30;
  B.trimRoster = function (S, t) {
    const SV = S.server || (S.server = {}), keep = SV.keep || {}, mine = S.player ? S.player.guild : -1;
    // the guilds of the account's other characters (S.server.homes, #305): their members say goodbye too, in that
    // character's guild chat the next time it is played
    const theirs = {}; for (const [c, g] of Object.entries(SV.homes || {})) if (g >= 0 && c !== S.id) (theirs[g] = theirs[g] || []).push(c); // your own guild too, when another character shares it (#331)
    // a weighted draw with no dice (the outcome stream stays as it was): each person's key is hash^(1/weight), highest go
    const hr = Math.floor(t / 3600000), key = (b) => Math.pow(hash(b.id, hr) || 1e-9, 1 / B.quitWeight(b, t));
    const queue = (f) => S.bots.filter((b) => f(b) && !(keep[b.name] && b.away > t)).sort((x, y) => key(y) - key(x));
    const vets = queue((b) => b.level >= D.LEVEL_CAP), bands = B.BANDS.map((B1, i) => ({ n: B1.n, q: queue((b) => b.level <= B1.max && (i === 0 || b.level > B.BANDS[i - 1].max)) }));
    const gone = new Set();
    // one leaves (or, someone you know, takes a break): true if they left
    const leave = (b) => {
      if (keep[b.name]) {
        if (b.broke > t - B.BREAK_EVERY * 86400000) return false; // back from one not long ago: they stay
        const days = B.BREAK_DAYS[0] + crand() * (B.BREAK_DAYS[1] - B.BREAK_DAYS[0]);
        b.broke = t; b.away = t + days * 86400000;
        // the line says how long (#321: "a few days" for two weeks read as a lie)
        // only to a character they are a friend of (#332): another character's friend is a stranger here
        if (S.player && S.soc && S.soc.friends && S.soc.friends[b.id]) B.post(S, 'whisper', b, cpick(days < 5 ? ['hey, taking a break for a few days. see you when i am back', 'short break for me, back in a few days', 'off for a few days, talk soon']
          : days < 10 ? ['gonna be away about a week, talk soon', 'taking a week off, see you after', 'away for a week or so. dont have too much fun without me']
            : ['taking a couple weeks off. see you when i am back', 'gone for two weeks or so, real life stuff. cya', 'long break for me, a couple of weeks. take care']));
        return false;
      }
      const bye = (mine >= 0 && b.guild === mine) || theirs[b.guild] ? cpick(['ok i am done with this game. gl everyone o/', 'quitting, thanks for the runs all', 'logging off for good i think. was fun, cya']) : null;
      if (bye && S.player && b.guild === mine) B.post(S, 'guild', b, bye);
      if (bye && theirs[b.guild]) { const L = SV.byes || (SV.byes = []); for (const c of theirs[b.guild]) L.push({ c, t, n: b.name, cls: b.cls, text: bye }); if (L.length > 200) L.splice(0, L.length - 200); }
      if (bye) b.bye = true; // said goodbye: their name is never someone else's (#333)
      gone.add(b); return true;
    };
    // under the cap: while over B.ROSTER_CAP, the band furthest over its share loses its newest
    let under = bands.reduce((a, x) => a + x.q.length, 0);
    while (under > B.ROSTER_CAP) {
      const x = bands.filter((y) => y.q.length).sort((y, z) => (z.q.length - z.n) - (y.q.length - y.n))[0]; if (!x) break;
      const b = x.q.shift(); if (leave(b)) under--; else x.n--; // someone who stays still counts, so the band shares its room
    }
    for (let over = vets.length - B.VETERANS; over > 0 && vets.length;) if (leave(vets.shift())) over--;
    if (!gone.size) return;
    for (let i = S.bots.length - 1; i >= 0; i--) if (gone.has(S.bots[i])) S.bots.splice(i, 1);
    // a name that quit isn't someone else's for a long while: kept for anyone around a week or more (someone may know them); a first-week
    // quitter's name goes back to the pool, or the names run out (#302)
    SV.gone = (SV.gone || []).concat([...gone].filter((b) => b.bye || t - (b.born || 0) >= 7 * 86400000).map((b) => b.name)).slice(-1500); // newest 1500, well under the ~2600 short names, so newcomers keep getting them (#376)
  };

  // #71: a new realm starts as a lived-in one: today's spread under the cap (B.BANDS) and B.START_VETERANS at it, each
  // with a start date as far back as their level (so the newest arrivals, not they, are the ones who quit first)
  B.START_VETERANS = 75;
  B.makeRealm = function () {
    const used = new Set(), bots = [], t = Date.now(), lo = B.BANDS[0];
    const add = (level) => { const b = B.assignGuild(B.makeBot(bots.length + 1, used, { level })); b.born = t - (2 + level * 0.6 + Math.random() * 4) * 86400000; bots.push(b); };
    for (let i = 0; i < lo.n; i++) add(1 + Math.floor(Math.random() * Math.random() * lo.max));
    B.BANDS.forEach((mid, k) => { if (k) for (let i = 0; i < mid.n; i++) add(B.BANDS[k - 1].max + 1 + Math.floor(Math.random() * (mid.max - B.BANDS[k - 1].max))); });
    for (let i = 0; i < B.START_VETERANS; i++) add(D.LEVEL_CAP);
    return bots;
  };

  B.isOnline = function (bot, date) {
    if (bot.away && date.getTime() < bot.away) return false; // #71: on a break
    const h = date.getHours();
    const d = Math.floor(date.getTime() / 3600000);
    let dist = Math.abs(h - ((bot.peak + 24) % 24));
    dist = Math.min(dist, 24 - dist);
    const base = dist <= bot.hours / 2 ? 0.8 : dist <= bot.hours ? 0.35 : 0.06;
    return hash(bot.id, d) < base;
  };

  // the share of a day someone is online, as B.isOnline draws it (0.8 within half their hours of their peak, 0.35 within
  // their hours, else 0.06)
  B.onlineShare = (bot) => { const h = Math.min(12, bot.hours); return (h * 0.8 + h * 0.35 + (24 - 2 * h) * 0.06) / 24; };

  // Bots level in their own race's starting region; from 10 some roam the other one.
  B.regionFor = function (bot, slot) {
    const home = (bot.race === 'dwarf' || bot.race === 'gnome') ? 'dunmorogh' : bot.race === 'nightelf' ? 'teldrassil' : (bot.race === 'orc' || bot.race === 'troll') ? 'durotar' : bot.race === 'tauren' ? 'mulgore' : bot.race === 'undead' ? 'tirisfal' : 'elwynn';
    const mine = Object.keys(D.REGIONS).filter((r) => D.REGIONS[r].faction === B.factionOf(bot));
    // v2.0: from 10 most players move on to Longfield or the Scrublands
    // v3: from 18 most players move on again, to Stoneharrow or Highcrag
    const next = bot.level >= 24 && D.REGIONS.duskwood ? (B.factionOf(bot) === 'horde' ? 'hillsbrad' : D.REGIONS.wetlands && hash(bot.id * 29, Math.floor(slot / 6)) < 0.45 ? 'wetlands' : 'duskwood') : bot.level >= 18 && D.REGIONS.redridge ? (B.factionOf(bot) === 'horde' ? 'stonetalon' : 'redridge') : B.factionOf(bot) === 'horde' ? 'barrens' : 'westfall';
    // v8: from 55 the Rotmoor, from 57 Icewold; v7: from 50 Greenmaw, from 52 the Cinderfields
    // expansion: at 60 most players are on the Stormveil Isle, each on their own faction's side
    if (bot.level >= 60 && D.REGIONS.tidewatch && hash(bot.id * 61, Math.floor(slot / 6)) < 0.55) return hash(bot.id * 67, Math.floor(slot / 6)) < 0.2 ? 'stormveil' : B.factionOf(bot) === 'horde' ? 'skullreef' : 'tidewatch';
    if (bot.level >= 57 && D.REGIONS.winterspring && hash(bot.id * 59, Math.floor(slot / 6)) < 0.4) return 'winterspring';
    if (bot.level >= 55 && D.REGIONS.plaguelands && hash(bot.id * 53, Math.floor(slot / 6)) < 0.7) return 'plaguelands';
    if (bot.level >= 52 && D.REGIONS.steppes && hash(bot.id * 51, Math.floor(slot / 6)) < 0.6) return 'steppes';
    if (bot.level >= 50 && D.REGIONS.ungoro && hash(bot.id * 47, Math.floor(slot / 6)) < 0.7) return 'ungoro';
    // v6: from 40 Sirocco, from 45 Ferndeep
    if (bot.level >= 45 && D.REGIONS.feralas && hash(bot.id * 41, Math.floor(slot / 6)) < 0.7) return 'feralas';
    if (bot.level >= 40 && D.REGIONS.tanaris && hash(bot.id * 43, Math.floor(slot / 6)) < 0.7) return 'tanaris';
    // v5.1: from 35 half of them are in Kinloch
    if (bot.level >= 35 && D.REGIONS.arathi && hash(bot.id * 37, Math.floor(slot / 6)) < 0.5) return 'arathi';
    // v5: from 30 most players go to contested Vinewild
    if (bot.level >= 30 && D.REGIONS.stranglethorn && hash(bot.id * 31, Math.floor(slot / 6)) < 0.7) return 'stranglethorn';
    // v4.1: from 22 some players quest in contested Elderglen instead
    if (bot.level >= 22 && D.REGIONS.ashenvale && hash(bot.id * 23, Math.floor(slot / 6)) < 0.25) return 'ashenvale';
    if (bot.level >= 10 && D.REGIONS[next] && hash(bot.id * 19, Math.floor(slot / 6)) < 0.75) return next;
    if (bot.level >= 10 && mine.length > 1 && hash(bot.id * 13, Math.floor(slot / 6)) < 0.35) {
      const others = mine.filter((r) => r !== home);
      return others[Math.floor(hash(bot.id * 17, Math.floor(slot / 6)) * others.length)];
    }
    return home;
  };
  const TOWNS = { elwynn: ['goldshire', 'stormwind'], dunmorogh: ['kharanos', 'ironforge'], teldrassil: ['dolanaar', 'darnassus'], durotar: ['razor_hill', 'orgrimmar'], mulgore: ['bloodhoof_village', 'thunder_bluff'], tirisfal: ['brill', 'undercity'], westfall: ['sentinel_hill'], barrens: ['crossroads'], redridge: ['lakeshire'], stonetalon: ['sun_rock_retreat'], duskwood: ['darkshire'], hillsbrad: ['tarren_mill'], wetlands: ['menethil_harbor'], tidewatch: ['brightwater_landing'], skullreef: ['bloodtide_landing'] };
  B.placeFor = function (bot, date) {
    const slot = Math.floor(date.getTime() / 600000); // 10-minute windows
    const region = B.regionFor(bot, slot);
    const options = Object.keys(D.PLACES).filter((p) => {
      const P = D.PLACES[p];
      return P.region === region && !P.city && bot.level >= P.lvl[0] - 1 && bot.level <= P.lvl[1] + 1 && (!P.faction || P.faction === B.factionOf(bot));
    });
    const CT = { ashenvale: { alliance: 'astranaar', horde: 'splintertree_post' }, stranglethorn: { alliance: 'rebel_camp', horde: 'grom_gol' }, arathi: { alliance: 'refuge_pointe', horde: 'hammerfall' }, tanaris: { alliance: 'gadgetzan', horde: 'gadgetzan' }, feralas: { alliance: 'feathermoon_stronghold', horde: 'camp_mojache' }, ungoro: { alliance: 'marshals_refuge', horde: 'marshals_refuge' }, steppes: { alliance: 'morgans_vigil', horde: 'flame_crest' }, plaguelands: { alliance: 'chillwind_camp', horde: 'the_bulwark' }, winterspring: { alliance: 'everlook', horde: 'everlook' }, stormveil: { alliance: 'brightwater_landing', horde: 'bloodtide_landing' } };
    const towns = CT[region] ? [CT[region][B.factionOf(bot)], ...(region === 'stranglethorn' ? ['nesingwary_camp'] : [])] : TOWNS[region];
    if (!options.length) return towns[0];
    // town visits now and then
    if (bot.level >= 5 && hash(bot.id * 7, slot) < 0.18) return towns[Math.floor(hash(bot.id * 3, slot) * towns.length)];
    return options[Math.floor(hash(bot.id, slot) * options.length)];
  };

  // Levelling speed in levels per online hour.
  function rate(bot) {
    const base = bot.style === 'tryhard' ? 1.7 : bot.style === 'regular' ? 1.0 : 0.55;
    return base / (1 + bot.level * 0.12);
  }

  // Advance the server by ms. Returns news items.
  // level-60 guilds keep to level-60 players: anyone below moves to the smallest open guild of their side (#568); then
  // they recruit level-60 players without a guild, lowest id first, up to 10 each. No random draws (#566)
  // The guilds of the account's characters are never touched, the same rule as B.guildMoves (#71, #305): your
  // guildmates stay yours, and nobody is moved into your guild behind your back (#569). Every move is in their history.
  B.fillGuilds = function (S, t) {
    if (!(root.SOC && SOC.guildMin)) return;
    const at = t || S.lastSim || Date.now();
    const homes = new Set(Object.values((S.server && S.server.homes) || {}).filter((g) => g >= 0));
    if (S.player && S.player.guild != null && S.player.guild >= 0) homes.add(S.player.guild);
    const high = GUILDS.map((g, i) => i).filter((i) => SOC.guildMin(i) >= 60 && !homes.has(i));
    const size = {}; for (const b of S.bots) if (b.guild >= 0) size[b.guild] = (size[b.guild] || 0) + 1;
    for (const b of S.bots) if (high.includes(b.guild) && b.level < 60) {
      const f = B.factionOf(b), to = GUILDS.map((g, i) => i).filter((i) => i < DRAWN && GUILD_FACTION[i] === f && fits(i, b.level) && !homes.has(i)).sort((x, y) => (size[x] || 0) - (size[y] || 0) || x - y)[0];
      B.note(b, at, 'left', b.guild); size[b.guild]--; b.guild = to == null ? -1 : to;
      if (to != null) { size[to] = (size[to] || 0) + 1; B.note(b, at, 'joined', to); }
    }
    // they take turns, the smallest first, so a young realm's few level-60 players spread over all of them
    const free = S.bots.filter((x) => !(x.guild >= 0) && x.level >= 60).sort((x, y) => x.id - y.id);
    for (;;) {
      const g = high.filter((i) => (size[i] || 0) < 10 && free.some((x) => B.factionOf(x) === GUILD_FACTION[i])).sort((x, y) => (size[x] || 0) - (size[y] || 0) || x - y)[0];
      if (g == null) break;
      const b = free.splice(free.findIndex((x) => B.factionOf(x) === GUILD_FACTION[g]), 1)[0];
      b.guild = g; size[g] = (size[g] || 0) + 1; B.note(b, at, 'joined', g);
    }
  };
  B.advance = function (S, ms) {
    B.fillGuilds(S);
    const news = [], clears = {}; let beyond = 0; // beyond: clears the news can't name at your level (issue #18)
    const steps = Math.min(48, Math.max(1, Math.ceil(ms / 1800000)));
    const stepMs = ms / steps;
    const SV = S.server || (S.server = {}), used = new Set(S.bots.map((b) => b.name).concat(SV.gone || [], S.player ? [S.player.name] : [], B.accountNames ? B.accountNames() : [])); // #71: a name that quit is never someone else's; #314: nor yours, nor your other characters' (#345)
    const firstNew = S.nextBotId;
    for (let s = 0; s < steps; s++) {
      const when = new Date(S.lastSim + stepMs * (s + 1));
      // new players keep rolling alts, so the starting zones never empty: B.NEW_PER_HOUR, arriving through the absence
      // (not all at its end, #302) and the fraction carried over, so a minute of live play adds its share too
      const owed = (SV.newAcc || 0) + (Math.min(stepMs, B.NEW_FOR_MS / steps) / 3600000) * B.NEW_PER_HOUR, n = Math.floor(owed); // at most 90 days of them (#379): the realm has turned over long before, and the rest would only be made to quit
      SV.newAcc = owed - n;
      // a newcomer joins a guild only once they have stayed a week (#328; the guild draw still happens, so the random
      // stream every sim measures stays as it was): most who quit do so in their first days, and
      // a guild of yours filled with people who said goodbye before you ever met them
      for (let i = 0; i < n; i++) { const nb = B.assignGuild(B.makeBot(S.nextBotId++, used, { level: 1 })); nb.guild = -1; nb.born = when.getTime() - stepMs * (i / n); nb.gj = 1; S.bots.push(nb); }
      // they fill the guilds people left (the smallest of their side first) while fewer than the realm's share are in one
      for (const b of S.bots) if (b.gj && when.getTime() - b.born >= 7 * 86400000) {
        delete b.gj;
        if (S.bots.filter((x) => x.guild >= 0).length >= S.bots.length * B.GUILD_SHARE) continue;
        const size = {}; for (const x of S.bots) if (x.guild >= 0) size[x.guild] = (size[x.guild] || 0) + 1;
        const f = B.factionOf(b), opts = GUILDS.map((g, i) => i).filter((i) => i < DRAWN && GUILD_FACTION[i] === f && fits(i, b.level)).sort((x, y) => (size[x] || 0) - (size[y] || 0) || x - y);
        b.guild = opts[0];
      }
      for (const b of S.bots) {
        if (b.level >= D.LEVEL_CAP) continue;
        // a step of a few hours or more (a long absence): their usual share of it online, not all or nothing (one look at
        // 'online now' over a 4-day step jumped people 30 levels or none, and emptied 21-39, #302)
        const share = stepMs > 3 * 3600000 ? (b.away > when.getTime() ? 0 : B.onlineShare(b)) : B.isOnline(b, when) ? 1 : 0;
        if (!share) continue;
        const gain = rate(b) * (stepMs / 3600000) * share; let need = 1 - b.xpf;
        b.xpf += gain;
        while (b.xpf >= 1 && b.level < D.LEVEL_CAP) {
          b.xpf -= 1; b.level++; b.dingAt = Math.round(when.getTime()); // a 'ding' line needs a real level-up lately (#499)
          // their own history (#72), at the time in the step they got there (#335: all at its end read "just now")
          if (b.level % 10 === 0 || b.level === D.LEVEL_CAP) B.note(b, Math.round(when.getTime() - stepMs + stepMs * Math.min(1, need / gain)), 'lvl', b.level);
          need += 1;
          if (b.level === D.LEVEL_CAP) {
            const firstCap = !S.server.firstCap;
            if (firstCap) S.server.firstCap = b.name;
            news.push({ t: when.getTime(), text: firstCap ? `Server first! ${b.name} is the first player on ${D.REALM} to reach level ${D.LEVEL_CAP}.` : `${b.name} reached level ${D.LEVEL_CAP}.`, who: b.id, big: firstCap });
          }
        }
      }
      // dungeon and raid clears (issue #18): any dungeon or raid in the data that enough bots are the level for, so a new
      // one shows up with no change here; a server first per dungeon or raid, named after its last boss
      const capped = S.bots.filter((b) => b.level >= 10).length;
      if (capped >= 5 && crand() < Math.min(0.9, capped / 40) * (stepMs / 3600000)) {
        const fits = Object.keys(D.ACTIVITIES).filter((k) => { const A = D.ACTIVITIES[k]; if (!A.dungeon || A.worldBoss || A.needQuest || !D.DUNGEONS[A.dungeon]) return false;
          return S.bots.filter((b) => b.level >= A.minLvl && b.level <= (A.maxLvl || D.LEVEL_CAP) + 5).length >= (A.size || 5); });
        if (fits.length) {
          const act = cpick(fits), g = cpick(GUILDS), F = S.server.firsts = S.server.firsts || {};
          if (S.server.firstVC && !F.deadmines) F.deadmines = S.server.firstVC; // the one first older saves recorded
          const first = !F[act]; if (first) F[act] = g; // recorded even when it can't be told yet, so it's right when you get there
          const last = lastBoss(act);
          B.noteClear(S, act, GUILDS.indexOf(g), when.getTime(), last);
          if (!B.newsNames(S, act)) beyond++;
          else if (first && last) news.push({ t: when.getTime(), text: `<${g}> is the first guild on ${D.REALM} to defeat ${last.name}!`, big: true });
          else clears[g + '|' + act] = (clears[g + '|' + act] || 0) + 1;
        }
      }
      // back from a break (#321): a friend of this character says so, once
      for (const b of S.bots) if (b.away && b.away <= when.getTime()) {
        delete b.away;
        if (S.player && S.soc && S.soc.friends && S.soc.friends[b.id]) B.post(S, 'whisper', b, cpick(['back! did i miss anything?', 'hey, im back o/', 'back from my break. what did i miss']));
      }
      B.guildMoves(S, stepMs, when.getTime()); // #72: now and then someone changes guild
      B.trimRoster(S, when.getTime()); // #71: people quit, the realm stays at its size (each step, so a long absence keeps its spread, #302)
    }
    // repeated clears read as one line each ("cleared The Smugglers' Deep ×3"), so a long absence isn't one sentence 40 times
    for (const [k, n] of Object.entries(clears)) { const [g, act] = k.split('|'); news.push({ t: S.lastSim + ms, text: `<${g}> cleared ${D.ACTIVITIES[act].name}${n > 1 ? ` ×${n}` : ''}.` }); }
    if (beyond) news.push({ t: S.lastSim + ms, text: `Veteran groups cleared ${beyond} more ${beyond === 1 ? 'place' : 'places'} beyond your level.` });
    const stayed = S.bots.filter((b) => b.id >= firstNew).length; // the ones still here, not every start (#334)
    if (stayed > 0 && ms >= 3600000) news.push({ t: S.lastSim + ms, joined: true, text: `${stayed} new adventurer${stayed === 1 ? '' : 's'} started out across Caldreth.` }); // every start, not only the Human one (issue #18); not each minute of live play
    S.lastSim += ms;
    const G1 = root.G; // and nothing the reader's level may not read (#69, the #54 rule)
    return G1 && G1.nameable && S.player ? news.filter((n) => G1.nameable(n.text, S.player.level)) : news;
  };

  // ---- a person's own story (#72): a short history per bot ("Reached level 40", "Cleared <place> with <guild>", "Got
  // <item>", "Joined <guild>"), friends and a rival of their own. For the player card (#84) and the chat (#73). Cosmetic
  // only: no outcome dice (hash or the cosmetic stream), and nothing here touches how anyone plays.
  B.HIST_MAX = 6;
  B.note = function (b, t, k, v, w) { const h = b.hist = b.hist || []; h.push(w == null ? { t, k, v } : { t, k, v, w }); if (h.length > B.HIST_MAX) h.splice(0, h.length - B.HIST_MAX); };
  B.noteClear = function (S, act, gi, t, last) {
    if (gi < 0) return;
    const A = D.ACTIVITIES[act], size = Math.min(5, (A && A.size) || 5);
    const there = S.bots.filter((b) => b.guild === gi && b.level >= A.minLvl && b.level <= (A.maxLvl || D.LEVEL_CAP) + 5)
      .sort((x, y) => hash(x.id, t % 100003) - hash(y.id, t % 100003)).slice(0, size);
    for (const b of there) B.note(b, t, 'clear', act, gi);
    const loot = last && (last.loot || []).filter((id) => D.ITEMS[id]);
    if (there.length && loot && loot.length) B.note(there[0], t, 'item', loot[Math.floor(hash(there[0].id, t % 99991) * loot.length)]);
  };
  // about once in 60 days a person changes guild (or leaves one); never into or out of the player's own guild, whose
  // members are the player's people (#71) and whose runs draw from it
  B.GUILD_MOVE_DAYS = 60;
  B.guildMoves = function (S, ms, t) {
    // every guild a character on the account is in (S.server.homes, #305), not only the one being played
    const homes = new Set(Object.values((S.server && S.server.homes) || {}).filter((g) => g >= 0));
    if (S.player && S.player.guild != null && S.player.guild >= 0) homes.add(S.player.guild);
    const p = Math.min(1, ms / (B.GUILD_MOVE_DAYS * 86400000));
    for (const b of S.bots) {
      if (homes.has(b.guild) || !(crand() < p) || b.gj) continue; // a newcomer has no guild yet (#328)
      const opts = GUILDS.map((g, i) => i).filter((i) => i < DRAWN && GUILD_FACTION[i] === B.factionOf(b) && i !== b.guild && !homes.has(i) && fits(i, b.level));
      const to = b.guild >= 0 && crand() < 0.25 ? -1 : opts.length ? opts[Math.floor(crand() * opts.length)] : -1;
      if (to === b.guild) continue;
      B.note(b, t, to < 0 ? 'left' : 'joined', to < 0 ? b.guild : to); b.guild = to;
    }
  };
  // two friends and a rival of their own, kept until one of them quits: their guildmates first (else people near their
  // level), picked by hash; the rival is the same class within 5 levels
  B.circle = function (S, b) {
    const f = B.factionOf(b), here = (id) => id != null && S.bots.some((x) => x.id === id && B.factionOf(x) === f); // their own side only (#309): an older pick from the other side is made again
    if (!(b.pals && b.pals.length && b.pals.every(here) && (b.rival == null || here(b.rival)))) { // an empty list is picked again (#73)
      const near = (x) => x !== b && B.factionOf(x) === f && Math.abs(x.level - b.level) <= 5, by = (a, c) => hash(b.id, a.id) - hash(b.id, c.id);
      const mates = b.guild >= 0 ? S.bots.filter((x) => x !== b && x.guild === b.guild) : [];
      b.pals = (mates.length >= 2 ? mates : S.bots.filter(near)).sort(by).slice(0, 2).map((x) => x.id);
      const rv = S.bots.filter((x) => near(x) && x.cls === b.cls && !b.pals.includes(x.id)).sort(by)[0];
      b.rival = rv ? rv.id : null;
    }
    const find = (id) => S.bots.find((x) => x.id === id);
    return { pals: b.pals.map(find), rival: b.rival == null ? null : find(b.rival) };
  };
  // one history entry as a line, or null when it names a place or item the reader's level may not read (#54)
  // lvl: the reader's level. A clear follows the news's rule (B.newsNames: raids and level-60 places at 60, a dungeon
  // from 10 levels below it), an item that and its own level (#303)
  B.histText = function (e, lvl) {
    const A = D.ACTIVITIES[e.v], it = D.ITEMS[e.v], R = lvl == null ? null : { player: { level: lvl } };
    if (e.k === 'lvl') return `Reached level ${e.v}`;
    if (e.k === 'clear') return A && (!R || B.newsNames(R, e.v)) ? `Cleared ${A.name} with <${GUILDS[e.w]}>` : null;
    if (e.k === 'item') return it && (lvl == null || B.itemTellable(e.v, lvl)) ? `Got ${it.name}` : null;
    if (e.k === 'joined') return `Joined <${GUILDS[e.v]}>`;
    if (e.k === 'left') return `Left <${GUILDS[e.v]}>`;
    return null;
  };

  // an item someone else has can be named at this level: not more than 10 levels above it, and from a place the news
  // may name (#303)
  let ITEM_ACT = null;
  B.itemTellable = function (id, lvl) {
    const it = D.ITEMS[id]; if (!it) return true; // a made-up piece of gear
    if ((it.lvl || 1) > lvl + 10) return false;
    if (!ITEM_ACT) { ITEM_ACT = {}; for (const k in D.ACTIVITIES) { const dg = D.DUNGEONS[D.ACTIVITIES[k].dungeon]; if (dg) for (const pl of dg.pulls) for (const mk of pl.mobs) for (const x of (D.MOBS[mk].loot || [])) if (!ITEM_ACT[x]) ITEM_ACT[x] = k; } }
    const act = ITEM_ACT[id], R = { player: { level: lvl } };
    return (!act || B.newsNames(R, act)) && (!it.source || !root.G || !root.G.nameable || root.G.nameable(it.source, lvl));
  };

  // the news follows the player's level, not the server's (issue #18, the lore bible's Reveals): a dungeon or raid is named
  // only if it starts at or below your level + 10, and raids and level-60 places only once you are 60. Content-proof:
  // a new dungeon or raid needs nothing here, its level decides.
  const lastBoss = (act) => { const A = D.ACTIVITIES[act], Dg = A && D.DUNGEONS[A.dungeon]; const bs = Dg ? Dg.pulls.filter((p) => p.boss) : []; return bs.length ? D.MOBS[bs[bs.length - 1].mobs[0]] : null; };
  B.newsNames = function (S, act) {
    const A = D.ACTIVITIES[act]; if (!A) return false;
    const L = (S.player && S.player.level) || D.LEVEL_CAP;
    if ((A.minLvl || 1) >= D.LEVEL_CAP || (A.size || 5) > 5) return L >= D.LEVEL_CAP;
    return (A.minLvl || 1) <= L + 10;
  };
  // news an older build already stored (beta.8 named endgame places at any level): drop the lines this level can't be told
  B.cleanNews = function (S) {
    if (!S.news || !S.news.length) return;
    const bad = []; for (const k in D.ACTIVITIES) { const A = D.ACTIVITIES[k]; if (!A.dungeon || A.worldBoss || !D.DUNGEONS[A.dungeon] || B.newsNames(S, k)) continue; bad.push(A.name); const b = lastBoss(k); if (b) bad.push(b.name); }
    if (bad.length) S.news = S.news.filter((n) => !bad.some((w) => String(n.text || '').includes(w)));
  };

  B.onlineIn = function (S, place, date) {
    return S.bots.filter((b) => B.isOnline(b, date) && B.placeFor(b, date) === place);
  };
  B.onlineCount = function (S, date) {
    let n = 0; for (const b of S.bots) if (B.isOnline(b, date)) n++;
    return n;
  };

  // ------------------------------------------------------------- chat text
  const link = (name, q) => `[[${q == null ? 1 : q}|${name}]]`;
  B.link = link;
  const lower = (s) => s.toLowerCase();
  function sloppy(bot, s) {
    if (bot.skill < 0.4 && cchance(0.6)) s = lower(s).replace(/[.!]$/, '');
    if (bot.toxic > 0.6 && cchance(0.3)) s = s.toUpperCase();
    return s;
  }
  B.sloppy = (bot, s) => sloppy(bot, s);


  // ---------- ambient chat: flavour only. Anything that asks the player for something lives in social.js as a
  // real request (m.act); nothing here may read like one (sim/chatcheck.js enforces that).
  // c: ctx() plus c.me, the bot talking.
  const GENERAL_ANY = [
    (c) => `where is ${c.namedMob}?`,
    () => 'is there a way to reset talents',
    () => 'what level can i ride a mount',
    () => 'server feels packed tonight',
    () => 'server is so quiet today, love it',
    (c) => c.mobName && `${c.mobName} drop rate is a joke`,
    (c) => `who is camping ${c.namedMob}, i've been waiting 20 min`,
    (c) => `died to ${c.namedMob} again. third time today`,
    (c) => `gz to whoever just took down ${c.namedMob}`,
    (c) => `the music in ${c.zone} tho`,
    (c) => `${c.zone} at night is so pretty`,
    (c) => `${c.town} inn is the comfiest inn, fight me`,
    (c) => (B.dingedLately(c.me) ? `ding ${c.me.level}!` : null),
    () => 'why is my mana always empty',
    () => 'gl everyone',
    () => 'lost my corpse again lol',
    () => 'my bags are always full, how',
    () => 'rested xp is a gift from the gods',
    () => 'logged in to finish one quest, did six',
    () => 'auction house prices are wild today',
    () => 'why are all the good names taken',
    () => 'is war mode worth it? keep getting ganked',
    () => 'mentor marks are so good for alts',
    () => 'roulette gave me the same dungeon three days in a row',
    () => 'honestly the sunsets in this game',
    () => 'brb dinner',
    () => 'fresh server hype',
    () => 'anyone from indo here?',
    () => 'lag?',
    (c) => `${c.classA} or ${c.classB} for my next alt?`,
    (c) => c.mobName && `every ${c.mobName} in this zone hates me personally`,
    () => 'just repaired, 3 gold. pain',
    () => 'the theater replay of the story is so good',
    () => 'finally beat a par time, feels great',
  ];
  const GENERAL_ALLI = [
    () => 'how do i get to kingsmere',
    () => 'kingsmere music hits different',
    () => 'keldrun is too dark for me',
    () => 'nyrwen is so far from everything',
    () => 'brackenford at night is a vibe',
    () => 'longfield broke my heart, those poor farmers',
    () => 'the grey hood are literally everywhere',
    () => 'hunters should be banned from pulling in brackenford',
    () => 'for the accord!',
    () => 'underrail is the best thing gnomes ever built',
  ];
  const GENERAL_HORDE = [
    () => 'how do i get to vazhrak', () => 'ok ok', () => "blood and dust!", () => 'for the krugar',
    () => 'the blooding grounds is so crowded lol', () => 'who keeps killing all the boars', () => 'bonewall inn is the best inn',
    () => 'grask is the best high chief', () => 'hornwind mesa elevators scare me', () => 'gravenhold has a smell and i love it',
    () => 'dustfort is always under attack lol', () => 'scrublands chat is a way of life', () => "camp skarn boat is taking forever",
  ];
  // what people talk about at your stage of the game
  const GENERAL_BAND = [
    [() => 'finally got my first green lol', () => 'my first bag!! 6 slots of luxury', () => 'the kobolds in that mine bite harder than they look', () => 'just found out what rested xp is', () => 'where do i learn cooking'],
    [() => 'talents are so confusing', () => 'first pug dungeon went... ok', () => 'the greenfen raptors are no joke', () => 'saving up for my mount already', (c) => `${c.zone} quests are kinda long`],
    [() => 'vinewild with war mode on is chaos', () => 'finally got riding, roads feel so short now', () => 'sirocco sand gets everywhere', () => "the dune temple stairs event is wild", () => 'how much does a mount cost'],
    [() => 'cinderpeak depths is a maze', () => 'the blackcloister gives me the creeps', () => 'the rain up north, perfect',() => 'icewold yetis again', () => 'is it just me or is the sea acting weird lately'],
  ];
  const ANSWERS = [
    { q: /where is (.+)\?/, a: (m) => [`${m[1]}? ${B.whereIs(m[1])}`, 'no idea sorry', 'same question lol'] },
    { q: /how do i get to kingsmere/, a: () => ['follow the road north out of brackenford', 'take the road north, you cant miss it', 'hearth lol', 'open your world map, it shows the route'] },
    { q: /how do i get to vazhrak/, a: () => ['go north from bonewall', 'the big gate north of bonewall', 'follow the road north'] },
    { q: /ok ok|blood and dust|for the krugar/, a: () => ['ok ok', "blood and dust!", 'FOR THE KRUGAR', 'as you say'] },
    { q: /for the accord/, a: () => ['for the accord!', 'FOR THE KING', 'o7'] },
    { q: /reset talents/, a: () => ['not that i know of, pick carefully', 'no talents till 10 anyway', 'plan them before you spend lol'] },
    { q: /(level|lvl).*mount|mount cost/, a: () => ['40', 'lvl 40, about 50g all in', '40, start saving now', 'riding at 40, 40g plus the mount'] },
    { q: /cooking/, a: () => ['innkeeper area in town', 'there is a cook in the inn'] },
    { q: /indo/, a: () => ['hadir', 'ada bang', 'wkwkwk ada', 'me'] },
    { q: /lag/, a: () => ['no', 'fine here', 'yes'] },
    { q: /mana/, a: () => ['drink between pulls', 'spirit gear', 'sit and drink my friend'] },
    { q: /war mode/, a: () => ['the 10% bonus is nice', 'only if you like pain', 'turn it off while questing lol', 'honor titles are worth it'] },
    { q: /next alt/, a: () => ['whatever looks cool', 'the one you will actually play', 'hunter, always hunter', 'go the one you keep dying to lol'] },
    { q: /worth it at/, a: () => ['yes, the quests alone are worth it', 'for the loot, yes', 'go with a guild group', 'if you have the quests, yes'] },
    { q: /drop anything good/, a: () => ['check the codex after a clear', 'mostly cloth iirc', 'one nice trinket', 'not really, go for the quest'] },
    { q: /sea acting weird/, a: () => ['i heard the same', 'storms off the coast, yeah', 'sailors in gullhaven wont shut up about it'] },
  ];
  // LFG channel between the real posts: groups that filled, runs that went well or badly, questions about a dungeon
  const LFG_CHATTER = [
    (c) => `${c.act} group full, ty all`,
    (c) => `gg ${c.act}, that was fast`,
    (c) => `${c.act} done, 0 wipes, love this group`,
    (c) => `is ${c.act} worth it at ${c.me.level}?`,
    (c) => `our tank pulled half of ${c.act} lol`,
    () => 'found a group, ty',
    () => 'nvm group full',
    (c) => `${c.act} took us an hour, never again`,
    (c) => `beat the par time in ${c.act}!`,
    (c) => `${c.boss} is a wall for new players`,
    () => 'first time tanking, went better than expected',
    (c) => `grats to whoever got the ${c.boss} drop`,
    (c) => `flawless ${c.act}, finally`,
    () => 'the group finder is so good honestly',
    (c) => `wiped on ${c.boss} 3 times, still got it`,
  ];
  const SAY_NEAR = [
    () => 'hey', () => 'o/', () => 'argh, respawn is so slow', () => 'u can have this one', () => 'lol', () => 'got it', () => 'brb', () => 'ok back',
    () => 'my bags are full already', (c) => c.mobName && `watch out, ${c.mobName} packs here`, (c) => c.mobName && `${c.mobName} again...`, () => 'nice pull', () => 'oops sorry, thought that was mine',
    () => 'these spawns are so fast lol', () => 'gl with the quest', () => 'phew, almost died there', () => 'just one more and im done', () => 'where did all the mobs go',
    (c) => `this ${c.zone} music tho`, () => 'ow', () => 'rip', () => 'nice one', () => 'close call lol', () => 'ty!', () => 'np', () => 'ding!', () => 'gz',
    (c) => c.mobName && `${c.mobName}s everywhere`, () => 'finally, the last one', () => 'omg that crit', () => 'who pulled that lol', () => 'sorry, tagged it by accident',
    (c) => `anyone else doing ${c.zone} quests? so many`, () => 'oom, sitting', () => 'love this spot', () => 'run!!', (c) => `heading back to ${c.town} after this`,
  ];
  // #580: a raiding, Trials or PvP guild talks about what it does too (the guild channel was the most repeated after #565)
  const GUILD_STYLE_LINES = {
    raiding: ['raid night is the best night', 'our healers carried last night', 'that wipe on the last boss was on me, sorry', 'great kills last night everyone', 'loot went to the right people for once', 'reading the boss plan again before tonight', 'repair bill after raid is brutal', 'one more Hard kill and we hit our goal', 'the tanks were on point yesterday', 'so close on that last pull', 'never standing in fire again', 'gz on the raid drops',
      'my wrists finally dropped', 'that boss is on farm now', 'the breath timing makes sense now', 'we moved up on the realm ranking', 'first clean kill of the night felt amazing', 'still dreaming about that loot', 'the slam answers were perfect yesterday', 'healers, you were heroes last night', 'my mana was empty at 10%, close one', 'learned more in that wipe than in ten kills', 'new personal best on damage', 'the Hard version is no joke'],
    trials: ['beat par by 4 seconds lol', 'the omens this week are rough', 'new best Trial last night!', 'clean pulls today', 'that skip saved us 20 seconds', 'the clock is the real boss', 'we climbed on the realm board', 'my interrupts were on fire', 'missed par by one second, pain', 'gg on that run', 'pushing feels so good when it works', 'every second counts'],
    dungeons: ['that dungeon run was smooth', 'the last boss in there is mean', 'our healer never let anyone drop', 'finally got the drop i wanted', 'fastest run we ever had', 'that trash pack nearly got us', 'pulled two packs by accident, oops', 'dungeon blues are looking good', 'speed bonus again!', 'love a good group'],
    leveling: ['two more levels tonight', 'quests in this zone are long', 'finally out of the starter zones', 'rested xp is the best', 'the new zone looks great', 'leveling an alt again', 'that elite quest took forever', 'almost at my mount level', 'new spell feels so good', 'the road between towns is dangerous'],
    casual: ['just chilling tonight', 'fishing by the lake again', 'anyone else love the music in this zone', 'took a break and came back to full bags', 'nice weather in the game today', 'my cat walked on the keyboard', 'playing slow today', 'tea and questing', 'the sunset here is pretty', 'this guild is so relaxed'],
    social: ['hi everyone', 'how was your day', 'good to see you all', 'chat is lively today', 'i missed this guild', 'you lot make my day', 'best people on the realm', 'happy weekend everyone', 'thanks for the welcome', 'love the vibes in here'],
    pvp: ['honor grind continues', 'we got farmed in the last one', 'nice cap earlier!', 'their rogue camped me for 5 min', 'rank up incoming', 'gg, that was close', 'their healer would not die', 'stamina gear is worth it', 'that comeback was insane', 'my bags are full of honor stuff', 'the other side is stacked tonight', 'won three in a row'],
  };
  const GUILD = [
    () => 'evening all', () => 'morning guild', () => 'grats on the ding!', () => 'guild bank when', (c) => (B.dingedLately(c.me) ? `finally ${c.me.level}!` : null), /* no goodbye from someone who stays online (#499) */
    () => 'that last run was fun', (c) => `who's in ${c.zone}? just got here`, () => 'love this guild', () => 'gz on the drop earlier',
    () => 'our tank is a legend', () => 'rip my repair bill', (c) => `just saw ${c.namedMob} lol, ran away`, () => 'the AH is crazy today',
    () => 'ty for the help earlier', () => 'long day at work, finally home', () => 'what did everyone get from the roulette today?', () => 'weekly goal is getting close',
    // #73: a bigger pool (Guild had 18 lines for about 330 heard a week)
    () => 'back, what did i miss', () => 'finally sorted my bags', () => 'who else is saving for a mount', () => 'my alt is stealing all my playtime',
    () => 'just spent an hour on the auction house, worth it', () => 'brb, food', () => 'this guild chat is the best part of my day',
    () => 'trying a new talent build, wish me luck', () => 'ok who keeps winning all the rolls', () => 'fishing is weirdly relaxing', () => 'quick break, back in 10',
    () => 'how is everyone doing', () => 'my repair bill says no more dungeons', () => 'tried cooking, burnt everything', (c) => `questing in ${c.zone}, so peaceful`,
    (c) => c.mobName && `the ${c.mobName}s in ${c.zone} are out of control`, () => 'leveled my profession a bit, slow going', () => 'had the best pug ever just now',
    () => 'had the worst pug ever just now lol', () => 'sold all my junk, feels good', () => 'whoever is on, hi', () => 'so many alts so little time',
    (c) => (c.act ? `${c.act} with you lot is always fun` : 'runs with you lot are always fun'), () => 'chilling in town for a bit', () => 'gz to everyone who dinged today',
  ];
  // a guild line that speaks to a crowd or answers someone else's news: not said by the only guildmate online (#596)
  const GUILD_CROWD = /\b(all|everyone|everybody|you lot|you all|guild|whoever|grats|gz|ty for|thanks for|what did i miss|who'?s|who else|who keeps|morning guild|evening all)\b/i;
  const WHISPER = [
    () => 'nice gear lol',
    () => 'r u a bot?',
    () => 'Hello friend! Cheapest gold on the server, 1000g for $10, visit our site!',
    () => 'CHEAP GOLD FAST DELIVERY 100% SAFE, visit our site',
    (c) => (c.fought ? `was that u in ${c.zone}? saw u fighting ${c.fought}s` : 'gl out there!'), // only a creature you did fight here (#365)
    () => 'wrong window sorry',
    () => 'lol sorry, meant that for someone else',
    () => 'gl out there!',
    () => 'ur name is so good',
    // #580: a bigger pool (9 lines for about 1,270 whispers a week); nothing that claims a shared past or asks for anything
    () => 'that armor looks great on u', () => 'love the look', () => 'hi! just saying hello', () => 'have a good one',
    () => 'stay safe out there', () => 'oops typed in the wrong chat', () => 'happy hunting', () => 'ur style is great lol',
    () => 'cool colours on that set', () => 'love the name honestly',
  ];

  // ---- #73: a person's voice. Each bot has its own habits, drawn once from its id (no dice): a word it starts lines
  // with, one it ends them with, how often it uses them, and whether it writes shorthand (u, r, pls, thx). Ambient lines,
  // replies and party chat only; a request keeps its words (social.js). Cosmetic stream only.
  const V_PRE = ['', '', '', 'ok ', 'honestly ', 'man ', 'ngl ', 'tbh ', 'yo ', 'welp ', 'oh '];
  const V_SUF = ['', '', ' lol', ' haha', ' :)', ' xD', ' tbh', ' fr', ' ngl', ' :D', ' lmao', ' heh', ' ^^', ' o/'];
  const V_SHORT = [[/\byou\b(?!')/g, 'u'], [/\byour\b/g, 'ur'], [/\bare\b/g, 'r'], [/\bplease\b/g, 'pls'], [/\bthanks\b/g, 'thx'], [/\breally\b/g, 'rly'], [/\bprobably\b/g, 'prob'], [/\bbecause\b/g, 'cuz']];
  const V_PRE_RE = /^(ok|honestly|man|ngl|tbh|yo|welp|oh|lol|haha)\b/i;
  const V_END_RE = /(\b(lol|haha|hah|hehe|heh|lmao|xd|tbh|fr|ngl|honestly)|[:^o;][)(dDpP^/3]|<3|[!?]{2})$/i; // a line that already ends in a habit, an emote or !!/??
  B.voice = function (b) {
    if (!b || b.id == null || b.legend || typeof b.id !== 'number') return null;
    const id = b.id | 0;
    const other = (L, h1, h2) => { const first = L[Math.floor(h1 * L.length)], ws = L.filter((w) => w && w !== first); return ws[Math.floor(h2 * ws.length)]; }; // the second habit is a word, never the first
    return { pre: V_PRE[Math.floor(hash(id, 7301) * V_PRE.length)], suf: V_SUF[Math.floor(hash(id, 7302) * V_SUF.length)], pre2: other(V_PRE, hash(id, 7301), hash(id, 7305)), suf2: other(V_SUF, hash(id, 7302), hash(id, 7306)), rate: 0.25 + hash(id, 7303) * 0.45, short: hash(id, 7304) < 0.35 };
  };
  B.voiced = function (b, s) {
    const v = B.voice(b); if (!v || s == null || /\bour site\b/i.test(s)) return s; // a gold seller's ad is pasted, not typed
    let t = String(s);
    if (v.short) for (const [re, w] of V_SHORT) t = t.replace(re, w);
    if (t === t.toUpperCase() && /[A-Z]{3}/.test(t)) return t; // a shout stays a shout
    // two habits for each end, so a voice is felt without the same word on every line
    const P = crand() < 0.5 ? v.pre2 : v.pre, X = crand() < 0.5 ? v.suf2 : v.suf;
    const has = (w) => new RegExp('\\b' + w.trim() + '\\b', 'i').test(t), pre = P.trim(), suf = X.trim();
    let added = '';
    if (pre && crand() < v.rate && !V_PRE_RE.test(t) && !/^[A-Z]{2}/.test(t) && !has(pre)) { t = P + t.charAt(0).toLowerCase() + t.slice(1); added = pre; }
    // no friendly ending on an angry line, none twice, never the word it started with
    if (suf && crand() < v.rate && !(b.toxic > 0.6) && !V_END_RE.test(t.replace(/[.]+$/, '')) && suf !== added && !(/^\w+$/.test(suf) && has(suf))) t += X;
    return t;
  };

  // ---- #73: threads. A line in General or Guild may get an answer from someone who knows the speaker: a guildmate in
  // Guild (the speaker's own friends first), the speaker's friends (or rival, on good news) in General, when online. The
  // answer names the speaker, and now and then the speaker answers back. Each reply template is held back an hour like
  // any other (B.freshLine), so no reply wears out.
  const RE_DING = /\bding\b|^finally \d+|\b\d+ finally\b/, RE_Q = /\?\s*$/;
  const RE_SAD = /\b(rip|pain|died|wiped?|hates me|joke|never again|lost|lag|why|broke|scare|creeps|confusing|slow|forever|ganked|repair|worst|burnt)\b/;
  const RE_UP = /\b(gz|grats|love|fun|great|good|nice|flawless|legend|hype|pretty|vibe|comfiest|best|perfect|clean|smooth|happy|relaxing|peaceful)\b/;
  const THREAD = {
    ding: [(n) => `gz ${n}!`, (n) => `grats ${n}`, (n) => `${n} gz, about time`, (n) => `gz ${n}, well earned`, (n) => `nice one ${n}`, (n) => `${n} grats!! o/`,
      (n) => `woo ${n}`, (n) => `gz gz ${n}`, (n) => `look at you ${n}`, (n) => `${n} big ding`, (n) => `well done ${n}`, (n) => `${n} gratz`, (n) => `${n} congrats!`, (n) => `ayy ${n}`, (n) => `${n} on a roll`, (n) => `proud of you ${n}`, (n) => `${n} the grind pays off`, (n) => `${n} nicely done`],
    q: [(n) => `${n} no clue tbh`, (n) => `good question ${n}`, (n) => `${n} i was wondering the same`, (n) => `${n} check the guide site maybe`, (n) => `idk ${n}, someone will know`,
      (n) => `${n} not sure, sorry`, (n) => `same q here ${n}`, (n) => `${n} hmm, no idea`, (n) => `${n} i think so? not sure`, (n) => `${n} beats me`, (n) => `oh ${n}, wish i knew`, (n) => `${n} good one, dunno`, (n) => `${n} someone in general will know`, (n) => `${n} no idea, sorry!`, (n) => `hmm good point ${n}`, (n) => `${n} asking the real questions`, (n) => `${n} following, i want to know too`],
    sad: [(n) => `rip ${n}`, (n) => `${n} felt that`, (n) => `feel that ${n}`, (n) => `${n} oof`, (n) => `pain, ${n}`, (n) => `${n} it gets better i promise`,
      (n) => `${n} lol i feel you`, (n) => `hang in there ${n}`, (n) => `${n} big oof`, (n) => `${n} that's rough`, (n) => `sending hugs ${n}`, (n) => `${n} been there`, (n) => `${n} ugh, same`, (n) => `poor ${n}`, (n) => `${n} you'll get it`, (n) => `${n} happens to the best of us`, (n) => `${n} lol rough day`],
    up: [(n) => `${n} true`, (n) => `agreed ${n}`, (n) => `${n} 100%`, (n) => `facts ${n}`, (n) => `${n} right?`, (n) => `${n} for real`,
      (n) => `this, ${n}`, (n) => `${n} couldn't agree more`, (n) => `${n} yes!!`, (n) => `${n} so true`, (n) => `exactly ${n}`, (n) => `${n} love that`, (n) => `${n} same here`, (n) => `${n} big agree`, (n) => `${n} yesss`, (n) => `well said ${n}`, (n) => `${n} best feeling`],
    any: [(n) => `${n} lol`, (n) => `haha ${n}`, (n) => `${n} same`, (n) => `lol ${n}`, (n) => `${n} xD`, (n) => `oh hey ${n}`,
      (n) => `${n} o/`, (n) => `classic ${n}`, (n) => `${n} mood`, (n) => `${n} relatable`, (n) => `hi ${n}`, (n) => `${n} hehe`, (n) => `${n} lmao`, (n) => `${n} hah`, (n) => `${n} fair`, (n) => `${n} honestly`, (n) => `yo ${n}`, (n) => `${n} :D`, (n) => `${n} ok that's funny`],
    rival: [(n) => `${n} took you long enough`, (n) => `sure ${n}, sure`, (n) => `${n} lucky`, (n) => `${n} finally lol`, (n) => `${n} show off`,
      (n) => `${n} not bad. not great either`, (n) => `cute ${n}`, (n) => `${n} watch your back`, (n) => `${n} beginner's luck`, (n) => `${n} don't let it go to your head`, (n) => `oh look, ${n} bragging`],
    back: [(n) => `ty ${n}`, (n) => `${n} hahaha`, (n) => `${n} shh`, (n) => `${n} you know it`, (n) => `thx ${n} :)`, (n) => `${n} ikr`,
      (n) => `${n} <3`, (n) => `${n} hehe ty`, (n) => `${n} cheers`, (n) => `${n} haha`, (n) => `${n} :)`, (n) => `${n} thank u`, (n) => `${n} hehe thx`],
    backRival: [(n) => `${n} keep dreaming`, (n) => `whatever ${n}`, (n) => `${n} we'll see`, (n) => `${n} lol ok`, (n) => `${n} jealous much`],
  };
  B.THREAD = THREAD;
  // read without the speaker's voice (a habit word at either end), and congratulating someone else isn't one's own ding
  const bareLine = (s) => lower(s).replace(/^(ok|honestly|man|ngl|tbh|yo|welp|oh) /, '').replace(/\s+(lol|haha|lmao|xd|tbh|fr|ngl|heh|:\)|:d|\^\^|o\/)$/, '').trim();
  B.threadKind = (text) => { const s = bareLine(text); return /\b(gz|grats|congrats|gratz)\b/.test(s) ? 'up' : RE_DING.test(s) ? 'ding' : RE_Q.test(s) ? 'q' : RE_SAD.test(s) ? 'sad' : RE_UP.test(s) ? 'up' : 'any'; };
  const nameOf = (b) => (crand() < 0.5 ? lower(b.name) : b.name);
  // b said text on ch at now: maybe a reply (and a reply back), queued in S.pending
  B.thread = function (S, b, ch, text, now, date) {
    if (!b || typeof b.id !== 'number' || !b.name || !['guild', 'general', 'lfg'].includes(ch)) return;
    const kind = B.threadKind(text), on = (x) => x && x !== b && x.id !== b.id && B.isOnline(x, date);
    const roll = crand(), pg = ch === 'guild' ? S.player.guild : null; // one draw, then only the scans that roll can use
    let who = null, rel = 'pal';
    if (ch === 'guild') {
      if (roll < 0.6) { const { pals } = B.circle(S, b), mine = pals.filter((x) => on(x) && x.guild === b.guild); const mates = mine.length ? mine : S.bots.filter((x) => on(x) && x.guild === b.guild); if (mates.length) who = cpick(mates); }
    } else {
      const pPal = ch === 'lfg' ? 0.4 : 0.75, pMate = ch === 'lfg' ? 0.3 : 0.45; /* 0.25/0.4 -> 0.3/0.45: with only online speakers (#592) threads fell just under 25% of lines */
      if (roll < Math.max(pPal, 0.35)) {
        const { pals, rival } = B.circle(S, b);
        if (kind === 'ding' && rival && on(rival) && roll < 0.35) { who = rival; rel = 'rival'; } // a rival answers a ding, nothing else
        else { const pf = pals.filter(on); if (pf.length && roll < pPal) who = cpick(pf); }
      }
      if (!who && b.guild >= 0 && crand() < pMate) { const mates = S.bots.filter((x) => on(x) && x.guild === b.guild && B.factionOf(x) === B.factionOf(b)); if (mates.length) who = cpick(mates); } // a guildmate who saw it
    }
    if (!who) return;
    // a reply goes out only from its own bot (strict: not from a stand-in if they left), in Guild only while the player is
    // still in that guild, and the answer back is chosen only once the reply has posted (then)
    const queue = (from, to, set, at, then) => {
      const n = nameOf(to), r = B.freshLine(S, from, ch, keyed('th' + set + '.', THREAD[set]).map(([k, f]) => [k, () => f(n)]), {});
      if (!r) return false;
      B.heard(S, from, r.k, r.text);
      (S.pending = S.pending || []).push({ at, bot: from.id, ch, text: r.text, strict: true, unless: ch === 'guild' ? () => S.player.guild !== pg : undefined, then });
      return true;
    };
    const back = rel === 'rival' ? 'backRival' : kind === 'ding' || kind === 'up' || kind === 'any' ? 'back' : null;
    const at = now + 2500 + crand() * 6000;
    queue(who, b, rel === 'rival' ? 'rival' : kind, at, back && cchance(0.5) /* 0.35 -> 0.5 (#592): with only online speakers threads sat on the 25% line */ ? () => queue(b, who, back, Date.now() + 3000 + crand() * 5000) : undefined);
  };


  // ---- #73: a person talks about their own story (B.note, #72): only what happened to them in the last 3 days, a level
  // only while it's still theirs, and only what the reader's level may read (B.histText). c.me: the speaker, c.rl: the
  // reader's level.
  const HIST_MS = 3 * 86400000;
  const histNow = (c, k) => { const h = (c.me && c.me.hist) || [], t = Date.now(); for (let i = h.length - 1; i >= 0; i--) if (h[i].k === k && h[i].t > t - HIST_MS && h[i].t <= t) return B.histText(h[i], c.rl) ? h[i] : null; return null; };
  const histLvl = (c) => { const e = histNow(c, 'lvl'); return e && e.v === c.me.level ? e.v : null; };
  const histAct = (c, mid) => { const e = histNow(c, 'clear'); if (!e || !D.ACTIVITIES[e.v]) return null; const n = D.ACTIVITIES[e.v].name; return mid ? n.replace(/^The /, 'the ') : n; };
  const histOurs = (c) => { const e = histNow(c, 'clear'); return e && e.w === c.me.guild && c.me.guild >= 0 ? histAct(c) : null; }; // cleared with the guild they're in now
  const histItem = (c) => { const e = histNow(c, 'item'); return e && D.ITEMS[e.v] ? D.ITEMS[e.v].name : null; };
  const histGuild = (c) => { const e = histNow(c, 'joined'); return e && GUILDS[e.v] && c.me.guild === e.v ? GUILDS[e.v] : null; };
  const HIST = [
    (c) => { const v = histLvl(c); return v && `ding ${v}`; },
    (c) => { const v = histLvl(c); return v && `${v} finally`; },
    (c) => { const v = histLvl(c); return v && (v >= D.LEVEL_CAP ? `${v}!! made it` : `${v} now, slowly getting there`); },
    (c) => { const a = histAct(c, true); return a && `finally cleared ${a}`; },
    (c) => { const a = histAct(c, true); return a && `that ${a} clear was so clean`; },
    (c) => { const a = histOurs(c); return a && `${a} went smooth with the guild`; },
    (c) => { const i = histItem(c); return i && `got ${i}, so happy`; },
    (c) => { const i = histItem(c); return i && `${i} dropped for me!!`; },
    (c) => { const i = histItem(c); return i && `finally got ${i}`; },
    (c) => { const g = histGuild(c); return g && `joined <${g}>, nice people`; },
  ];
  B.HIST_LINES = HIST;
  B.hasStory = (b) => { const h = (b && b.hist) || [], t = Date.now(); return h.some((e) => e.t > t - HIST_MS && e.t <= t); };

  B.whereIs = function (name) {
    const n = lower(name);
    for (const key in D.MOBS) {
      if (lower(D.MOBS[key].name) === n) {
        for (const p in D.PLACES) {
          const P = D.PLACES[p];
          if ((P.mobs || []).some((m) => m[0] === key) || (P.named && P.named[key])) return `${P.name}${P.zone === 'Ambermoor' && p !== 'brackenford' ? ' in ambermoor' : ''}`;
        }
      }
    }
    for (const k in D.NPCS) if (lower(D.NPCS[k].name).includes(n)) return 'check the nearest town, they hang around the inn';
    return 'no idea';
  };

  B.lineContext = (S) => ctx(S);
  function ctx(S) {
    const P = D.PLACES[S.player.place] || D.PLACES.northshire_abbey;
    const mobs = (P.mobs || []).map((m) => m[0]);
    // named mobs players ask about come from the zone you are in, never another faction's
    const region = P.region || 'elwynn';
    const namedAll = [...new Set(Object.values(D.PLACES).filter((p) => (p.region || 'elwynn') === region).flatMap((p) => Object.keys(p.named || {})).concat(Object.values(D.QUESTS).flatMap((q) => q.objs.filter((o) => o.type === 'kill' && D.MOBS[o.mob] && D.MOBS[o.mob].named).map((o) => o.mob))).filter((k) => { const pl = Object.values(D.PLACES).find((p) => (p.named || {})[k] || (p.mobs || []).some((m) => m[0] === k)); return !pl || (pl.region || 'elwynn') === region; }))];
    if (!namedAll.length) namedAll.push(region === 'elwynn' ? 'hogger' : Object.keys(D.MOBS).find((k) => D.MOBS[k].named) || 'hogger');
    const q = Object.keys(S.player.quests || {});
    const zoneNpcs = Object.values(D.PLACES).filter((p) => (p.region || 'elwynn') === (P.region || 'elwynn')).flatMap((p) => p.npcs || []);
    const npc = q.length ? D.NPCS[D.QUESTS[q[0]].turnin].name : D.NPCS[cpick(zoneNpcs.length ? zoneNpcs : Object.keys(D.NPCS))].name;
    const L = S.player.level;
    const inns = Object.values(D.PLACES).filter((p) => (p.region || 'elwynn') === region && p.inn);
    const G0 = root.G;
    // dungeons near your level; raids only once you are their level (Veshmira's name is a level-60 reveal)
    const acts = Object.keys(D.ACTIVITIES).filter((k) => { const A = D.ACTIVITIES[k]; return !A.needQuest && A.minLvl <= L + 3 && A.maxLvl >= L - 3 && !(A.size >= 10 && L < A.minLvl) && !(G0 && G0.activityBlock && G0.activityBlock(k) === 'hidden'); });
    const A = D.ACTIVITIES[acts.length ? cpick(acts) : 'hogger'];
    const Dg = A.dungeon && D.DUNGEONS[A.dungeon]; const lastBoss = Dg && Dg.pulls.filter((p) => p.boss).pop();
    const bossKey = A.boss || (lastBoss && lastBoss.mobs[0]);
    const clsNames = Object.values(D.CLASSES).map((x) => x.name.toLowerCase());
    return {
      zone: P.zone || 'the wilds', town: inns.length ? cpick(inns).name : 'the', band: L < 15 ? 0 : L < 30 ? 1 : L < 45 ? 2 : 3,
      act: A.name, boss: bossKey && D.MOBS[bossKey] ? D.MOBS[bossKey].name : 'the last boss', classA: cpick(clsNames), classB: cpick(clsNames),
      mobName: mobs.length ? D.MOBS[cpick(mobs)].name : null, /* a town with no mobs has no mob lines (#596) */ namedMob: D.MOBS[cpick(namedAll)].name, questNpc: npc,
      hogger: S.player.level >= 8,
      fought: S.player.lastKill && S.player.lastKill.place === S.player.place && D.MOBS[S.player.lastKill.mob] ? D.MOBS[S.player.lastKill.mob].name : null,
    };
  }

  // #69: what a bot's line may name. A bot names content at its own level (never a dungeon, raid, zone or named creature
  // whose level is above its own + 3), and nothing the reading character's level may not read (G.nameable, the #54 rule).
  // The index: every dungeon and raid (its group-finder level), named creature and boss (its level) and zone (its lowest
  // place), built once, matched as whole words in any case (bots write sloppily).
  let contentIdx = null;
  function contentLevels() {
    if (contentIdx) return contentIdx;
    // a name is also found without its leading article ("scrublands" for The Scrublands); case, a plural s and a
    // possessive 's are handled by the pattern below
    const lv = new Map(), put = (n, l) => { if (!n || n.length < 4 || !(l > 0)) return; const k = n.toLowerCase(); if (!lv.has(k) || lv.get(k) > l) lv.set(k, l); const bare = n.replace(/^(the|an?) /i, ''); if (bare !== n) put(bare, l); };
    for (const A of Object.values(D.ACTIVITIES)) { put(String(A.name).replace(/^(Wanted|World boss): /, ''), A.minLvl); const Dg = A.dungeon && D.DUNGEONS[A.dungeon]; if (Dg) put(Dg.name, A.minLvl); }
    for (const M of Object.values(D.MOBS)) if ((M.named || M.boss) && M.lvl) put(M.name, M.lvl[0]);
    const zoneMin = {}, regMin = {};
    for (const P of Object.values(D.PLACES)) { const l = P.lvl ? P.lvl[0] : 1; if (P.zone) zoneMin[P.zone] = Math.min(zoneMin[P.zone] || 99, l); if (P.region) regMin[P.region] = Math.min(regMin[P.region] || 99, l); }
    for (const z in zoneMin) put(z, zoneMin[z]);
    // #70: a place inside a zone at its own level; capitals and neutral towns (Coppergulch, Rumhook Bay) anyone may name
    for (const P of Object.values(D.PLACES)) if (P.lvl && !P.city && !P.neutral) put(P.name, P.lvl[0]);
    for (const r in D.REGIONS || {}) if (regMin[r]) put(D.REGIONS[r].name, regMin[r]);
    const alts = [...lv.keys()].sort((a, b) => b.length - a.length).map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return (contentIdx = { lv, re: alts.length ? new RegExp('(^|[^a-z0-9])(' + alts.join('|') + ')s?(?![a-z0-9])', 'gi') : null });
  }
  B.contentAbove = function (text, lvl) { // the first content named in the text whose level is above lvl + 3, or null
    const C = contentLevels(); if (!C.re || lvl == null) return null;
    C.re.lastIndex = 0; let m;
    while ((m = C.re.exec(String(text)))) { if (C.lv.get(m[2].toLowerCase()) > lvl + 3) return m[2]; if (m[0].length === 0) C.re.lastIndex++; }
    return null;
  };
  B.lineFits = function (S, text, from, ch) {
    const G1 = root.G;
    if (G1 && G1.nameable && S.player && !G1.nameable(String(text), S.player.level)) return false;
    const b = from && (from.level != null ? from : S.bots && S.bots.find((x) => x.id === from.id));
    if (b && b.level != null && B.contentAbove(text, b.level)) return false;
    return B.lineTrue(S, text, from, ch);
  };

  // #70: a line says only true things. Time-of-day words match the player's clock ('tonight' is evening or night);
  // a busy or quiet server matches the online count (B.serverMood); and a line that remembers the player (names them,
  // or 'again', 'earlier', 'last time', 'remember' to them in a whisper, the party or the guild) comes only from someone
  // with a record of them: in the group now, or a friend (a run, trade or help, SOC.isFriend).
  const TOD = { morning: ['morning'], afternoon: ['afternoon'], evening: ['evening'], night: ['night'], tonight: ['evening', 'night'], gn: ['night'], dinner: ['evening'], breakfast: ['morning'] };
  const TOD_RE = /\b(tonight|night|morning|afternoon|evening|gn|dinner|breakfast)\b/g;
  const WDAY_N = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 }, WDAY_RE = /\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/g; // a day named in a line is today's (#592)
  B.timeOfDay = (h) => (h >= 5 && h < 12 ? 'morning' : h >= 12 && h < 17 ? 'afternoon' : h >= 17 && h < 21 ? 'evening' : 'night');
  B.lineTrue = function (S, text, from, ch) {
    const s = String(text).toLowerCase(), t = Date.now();
    const now = B.timeOfDay(new Date(t).getHours());
    for (const m of s.matchAll(TOD_RE)) if (!TOD[m[1]].includes(now)) return false;
    const wd = new Date(t).getDay(); if (/\bweekend\b/.test(s) && wd !== 0 && wd !== 6) return false; // the weekend is Saturday and Sunday (#592)
    for (const m of s.matchAll(WDAY_RE)) if (WDAY_N[m[1]] !== wd && !/\b(on|next|this|by|till|until|since|last)\s+$/.test(s.slice(0, m.index))) return false; // 'happy friday' only on a Friday; 'on friday' is a plan (#592)
    if (/\b(server|realm|tonight|today|here)\b/.test(s)) {
      const busy = /\b(packed|busy|full)\b/.test(s), quiet = /\b(dead|empty|quiet)\b/.test(s);
      if (busy || quiet) { const mood = B.serverMood(S, t); if (mood !== (busy ? 'busy' : 'quiet')) return false; }
    }
    const P = S.player, named = P && P.name && new RegExp('\\b' + P.name.toLowerCase() + '\\b').test(s);
    if (from && (named || (/\b(again|earlier|last time|remember)\b/.test(s) && ['whisper', 'party', 'guild'].includes(ch)))) {
      const inGroup = S.group && S.group.members.some((m) => (m.bot && m.bot.id === from.id) || m.name === from.name);
      const SOC1 = root.SOC;
      if (!inGroup && !(SOC1 && SOC1.isFriend && SOC1.isFriend(from.id))) return false;
    }
    // a bot that posted a group in LFG in the last 10 minutes doesn't post another, or say it found a group (B.lfRecent)
    if (ch === 'lfg' && from && from.id != null && B.lfBusy(S, from, t) && (LF_RE.test(s) || /\b(already (?:in|got)|full group|grouped|in a run|found a group)\b/.test(s))) return false;
    return true;
  };
  const LF_RE = /\b(lf\d?m|lfg|wanted|missing|need)\b/;
  B.lfRecent = (S, b, t) => ((S.lfAt || {})[b.id] || 0) > (t || Date.now()) - 600000;
  // #596: a bot already in a group doesn't advertise for a new one: in your party, leading or posting a group still open
  // in chat (an LFG, Trial or guild run post), or a Help Wanted still up; or one that posted a group in the last 10 minutes
  const GROUP_ACTS = ['lfg', 'trial_lfg', 'help_wanted'];
  B.lfBusy = (S, b, t) => { const at = t || Date.now(); return B.lfRecent(S, b, at) || inParty(S, b.id) || (S.chat || []).some((m) => m.act && m.act.state === 'open' && GROUP_ACTS.includes(m.act.kind) && (m.act.leader === b.id || m.act.bot === b.id)) || (S.helpWanted || []).some((r) => r.poster === b.id && r.expires > at); };
  // how full the server is: 'busy' with half of it or more online (an evening peak), 'quiet' with 25% or less (night or
  // morning), else null. From the schedules alone, so a server that grows or shrinks over the week stays honest.
  B.serverMood = function (S, t) {
    const all = S.bots.length; if (!all) return null;
    const f = B.onlineCount(S, new Date(t)) / all;
    return f >= 0.5 ? 'busy' : f <= 0.25 ? 'quiet' : null;
  };

  // #70: each template has a stable key ('ga3': GENERAL_ANY's fourth). A template the player heard in the last hour,
  // or one this bot said among its last 12, isn't picked again; with nothing fresh left, nothing is said.
  const HEARD_MS = 60 * 60000, BOT_SAID = 12;
  const keyed = (k, arr) => arr.map((f, i) => [k + i, f]);
  const wordsKey = (s) => 'w:' + String(s).toLowerCase().replace(/[.!?]+$/, '').trim(); // the same words, from any pool
  const bandOf = (b) => { const L = b.level || 1; return L < 15 ? 0 : L < 30 ? 1 : L < 45 ? 2 : 3; };
  B.dingedLately = (b) => !!(b && b.dingAt && Date.now() - b.dingAt < 2 * 3600000); // levelled in the last 2 hours (#499)
  B.freshLine = function (S, b, ch, list, c, raw) {
    const cd = S.chatHeard || {}, t = Date.now(), mine = ((S.botSaid || {})[b.id] || '').split(',');
    const ok = list.filter(([k]) => !(cd[k] > t - HEARD_MS) && !mine.includes(k));
    for (let i = 0; i < 6 && ok.length; i++) {
      const [k, f] = ok.splice(Math.floor(crand() * ok.length), 1)[0];
      const said = f(c); if (said == null || said === false) { i--; continue; } // a line with nothing true to say (#73's story lines) costs no try
      const text = raw || /\bour site\b/i.test(said) ? said : B.voiced(b, sloppy(b, said)); // #73: in the speaker's own voice, added after sloppy() so its emotes keep their case; a gold seller's ad is pasted as is
      if (!(cd[wordsKey(text)] > t - HEARD_MS) && B.lineFits(S, text, b, ch)) return { k, text };
    }
    return null;
  };
  // a reply's or request's words (no bot memory): one not heard in the last hour if any is left, else the one heard longest ago
  // said: the line being answered, so an answer never echoes it word for word ('blood and dust!' → 'blood and dust!'),
  // and with every answer heard this hour there is none (null)
  B.pickHeard = function (S, k, arr, said) {
    const H = S.chatHeard || (S.chatHeard = {}), t = Date.now(); if (said) for (const w of [said, bareLine(said), bareLine('_ ' + said).replace(/^_ /, '')]) H[wordsKey(w)] = t;
    const idx = arr.map((_, i) => i), when = (i) => Math.max(H[k + i] || 0, H[wordsKey(arr[i])] || 0);
    const fresh = idx.filter((i) => !(when(i) > t - HEARD_MS)); if (said && !fresh.length) return null; // an answer with nothing fresh to say says nothing
    const i = fresh.length ? cpick(fresh) : idx.reduce((a, b) => (when(b) < when(a) ? b : a));
    H[k + i] = H[wordsKey(arr[i])] = t; return arr[i];
  };
  B.heard = function (S, b, k, text) {
    const cd = S.chatHeard || (S.chatHeard = {}), t = Date.now();
    cd[k] = t; if (text) cd[wordsKey(text)] = t; for (const x in cd) if (cd[x] <= t - HEARD_MS) delete cd[x];
    const said = S.botSaid || (S.botSaid = {});
    said[b.id] = ((said[b.id] ? said[b.id] + ',' : '') + k).split(',').slice(-BOT_SAID).join(',');
  };

  // the content a speaker names (#69): a dungeon or raid near ITS level (raids only at their level), its last boss, and
  // its level band; what the player's level may read is checked again on the finished line (B.lineFits)
  function botContent(S, b) {
    const L = (b && b.level) || S.player.level, G0 = root.G;
    const acts = Object.keys(D.ACTIVITIES).filter((k) => { const A = D.ACTIVITIES[k]; return !A.needQuest && !A.worldBoss && A.minLvl <= L + 3 && A.maxLvl >= L - 3 && !(A.size >= 10 && L < A.minLvl) && !(G0 && G0.activityBlock && G0.activityBlock(k) === 'hidden'); });
    if (!acts.length) return { band: L < 15 ? 0 : L < 30 ? 1 : L < 45 ? 2 : 3 };
    const A = D.ACTIVITIES[cpick(acts)], Dg = A.dungeon && D.DUNGEONS[A.dungeon], lb = Dg && Dg.pulls.filter((p) => p.boss).pop(), bk = A.boss || (lb && lb.mobs[0]);
    return { act: A.name, boss: bk && D.MOBS[bk] ? D.MOBS[bk].name : 'the last boss', band: L < 15 ? 0 : L < 30 ? 1 : L < 45 ? 2 : 3 };
  }

  // Emit one chat message into S.chat. from: bot | null (system). A bot's line that doesn't fit (#69) is not sent: null
  B.post = function (S, ch, from, text) {
    if (from && !from.legend && !(S.player && from.name === S.player.name) && !B.lineFits(S, text, from, ch)) return null;
    const m = { id: (S.chatSeq = (S.chatSeq || 0) + 1), t: Date.now(), ch, from: from ? from.name : null, cls: from ? from.cls : null, fromId: from ? from.id : null, text };
    if (from && from.legend) m.legend = true; // a Legend speaks in their own colour
    S.chat.push(m);
    if (ch === 'lfg' && from && from.id != null && LF_RE.test(String(text).toLowerCase())) { const L = S.lfAt || (S.lfAt = {}); L[from.id] = m.t; for (const k in L) if (L[k] <= m.t - 600000) delete L[k]; } // #70
    if (ch === 'whisper' && from && from.name) S.lastWhisper = from.name;
    if (S.chat.length > 160) S.chat.splice(0, S.chat.length - 160);
    return m;
  };

  // #70: back from time away. Chat timers (these and social.js's) that came due while you were gone fire over your first
  // two minutes back instead of all in the first second; what bots said is forgotten for bots that left the server.
  B.catchUpChat = function (S, t) {
    for (const T of [S.chatTimers, S.soc && S.soc.next]) if (T) for (const k in T) if (T[k] && T[k] <= t) T[k] = t + crand() * 120000;
    if (S.botSaid) { const ids = new Set(S.bots.map((b) => String(b.id))); for (const k in S.botSaid) if (!ids.has(k)) delete S.botSaid[k]; }
  };

  // a bot in your group-finder group or your world party: the only ones who speak in party chat (#590)
  const inParty = (S, id) => [S.group, S.wparty].some((g) => g && g.members.some((m) => m.bot && m.bot.id === id));
  // Called every second. Schedules chatter.
  B.chatTick = function (S, now) {
    const T = S.chatTimers || (S.chatTimers = {});
    const date = new Date(now);
    const online = B.onlineCount(S, date);
    const busy = Math.min(1.6, 0.5 + online / 90);
    const c = ctx(S); c.rl = S.player.level;
    const myF =(D.RACES[S.player.race] || {}).faction || 'alliance';
    const mineBots = S.bots.filter((b) => B.factionOf(b) === myF);
    const onl = (not) => { for (let i = 0; i < 12; i++) { const b = cpick(mineBots); if (b !== not && B.isOnline(b, date)) return b; } const rest = mineBots.filter((x) => x !== not && B.isOnline(x, date)); return rest.length ? cpick(rest) : null; }; // not: an answer never comes from the bot that asked; nobody online, nobody (#592)
    c.horde = myF === 'horde';
    // pool: how many lines the channel has; a line heard is held back an hour (HEARD_MS), so the channel never talks
    // faster than its pool lasts an hour (#337: a burst for 15 minutes, then near silence for 45)
    const due = (k, a, b, pool) => { if (!T[k]) T[k] = now + Math.max((a + crand() * (b - a)) / busy, pool ? (HEARD_MS / 1000 / pool) * (0.6 + crand() * 0.8) : 0) * 1000; if (now >= T[k]) { T[k] = 0; return true; } return false; };
    // #69: a line names content at the speaker's level (its dungeon or raid, its boss, its level band), and one that
    // still doesn't fit (B.lineFits) is picked again; after six tries nothing is said
    const speak = (b) => { c.me = b; Object.assign(c, botContent(S, b)); return c; };
    // one line from b on ch: a fresh template (B.freshLine) filled for b, posted; its text, or null when nothing fits
    const line = (b, ch, lists, raw) => { speak(b); const r = B.freshLine(S, b, ch, [].concat(...lists), c, raw); if (!r || !B.post(S, ch, b, r.text)) return null; B.heard(S, b, r.k, r.text); return r.text; };

    if (S.pending && S.pending.length) {
      const ready = S.pending.filter((p) => p.at <= now);
      S.pending = S.pending.filter((p) => p.at > now);
      for (const p of ready) {
        if (p.unless && p.unless()) continue; // a line whose reason went away (a guild application withdrawn, #416)
        if (p.ch === 'party' && !inParty(S, p.bot)) continue; // only from a group you are in (#590)
        let bot;
        if (p.fromName) { const gm = S.group && S.group.members.find((m) => m.name === p.fromName); bot = { name: p.fromName, cls: gm ? gm.cls : null, id: p.bot, legend: !!(gm && gm.legend) }; }
        else bot = S.bots.find((b) => b.id === p.bot) || (p.strict ? null : onl());
        if (!bot) continue; // #73: a thread's line only from its own bot
        const posted = B.post(S, p.ch, bot, p.text);
        if (p.onPost) p.onPost(bot);
        if (posted && p.then) p.then(); // #73: an answer back only to a reply that was said
      }
    }
    // #70: about half the old volume (General every 18–44 s at a quiet hour, not 9–22), and each line a fresh template
    if (due('general', 18, 44, GENERAL_ANY.length + (c.horde ? GENERAL_HORDE : GENERAL_ALLI).length + GENERAL_BAND[1].length)) {
      const b = onl();
      const text = b && line(b, 'general', [keyed('ga', GENERAL_ANY), c.horde ? keyed('gh', GENERAL_HORDE) : keyed('gl', GENERAL_ALLI), keyed('gb' + bandOf(b) + '.', GENERAL_BAND[bandOf(b)]), B.hasStory(b) ? keyed('hs', HIST) : []]) || '';
      if (text) B.thread(S, b, 'general', text, now, date); // #73
      // sometimes someone answers
      for (const A of ANSWERS) {
        const mm = lower(text).match(A.q);
        if (mm && cchance(0.75)) {
          const r = onl(b), a = r && B.pickHeard(S, 'an' + ANSWERS.indexOf(A) + '.', A.a(mm), text); if (!a) break;
          S.pending = S.pending || [];
          S.pending.push({ at: now + 2500 + crand() * 5000, bot: r.id, ch: 'general', text: sloppy(r, a) });
          break;
        }
      }
    }
    if (S.player.level >= 8 && due('lfg', 80, 180, LFG_CHATTER.length)) {
      const b = onl();
      const text = b && b.level >= 6 ? line(b, 'lfg', [keyed('lf', LFG_CHATTER)]) : null;
      if (text) B.thread(S, b, 'lfg', text, now, date); // #73
      if (text) for (const A of ANSWERS) { const mm = lower(text).match(A.q); if (mm && cchance(0.6)) { const r = onl(b), a = r && B.pickHeard(S, 'an' + ANSWERS.indexOf(A) + '.', A.a(mm), text); if (!a) break; S.pending = S.pending || []; S.pending.push({ at: now + 3000 + crand() * 5000, bot: r.id, ch: 'lfg', text: sloppy(r, a) }); break; } }
    }
    if (due('say', 32, 76, SAY_NEAR.length)) {
      const near = B.onlineIn(S, S.player.place, date).filter((b) => B.factionOf(b) === B.factionOf(S.player));
      if (near.length && !D.PLACES[S.player.place].safe || near.length > 2) line(cpick(near.length ? near : [onl()]), 'say', [keyed('sn', SAY_NEAR)]);
    }
    if (S.player.guild != null && S.player.guild >= 0 && due('guild', 60, 140, GUILD.length)) {
      const mates = S.bots.filter((b) => b.guild === S.player.guild && B.isOnline(b, date));
      // #596: one guildmate online talks much less, and never to a crowd or about a ding or drop nobody had
      const alone = mates.length === 1, solo = (L) => (alone ? L.map(([k, f]) => [k, (cc) => { const x = f(cc); return x && GUILD_CROWD.test(x) ? null : x; }]) : L);
      if (mates.length && (!alone || cchance(0.3))) { const b = cpick(mates), st = root.SOC && SOC.guildStyle ? SOC.guildStyle(S.player.guild) : null, text = line(b, 'guild', [solo(keyed('gu', GUILD)), B.hasStory(b) ? keyed('hs', HIST) : [], solo(keyed('gs' + st, (GUILD_STYLE_LINES[st] || []).map((t) => () => t)))]); if (text) B.thread(S, b, 'guild', text, now, date); } // #73
    }
    if (due('whisper', 400, 960)) { const w = onl(); if (w) line(w, 'whisper', [keyed('wh', WHISPER)]); } // #73: in their own voice too (a gold seller's ad keeps its words, B.voiced)
  };

  // The player typed something. Bots may react.
  B.respond = function (S, ch, text) {
    const now = Date.now();
    const t = lower(text);
    const date = new Date(now);
    S.pending = S.pending || [];
    let near = ch === 'say' ? B.onlineIn(S, S.player.place, date).filter((b) => B.factionOf(b) === B.factionOf(S.player)) : ch === 'guild' ? S.bots.filter((b) => b.guild === S.player.guild && B.isOnline(b, date)) : ch === 'party' && S.group ? S.group.members.map((id) => S.bots.find((b) => b.id === id)).filter(Boolean) : S.bots.filter((b) => B.isOnline(b, date));
    if (ch === 'whisper') { const w = S.bots.find((b) => b.name === S.lastWhisper); near = w ? [w] : []; }
    if (!near.length) return;
    const say = (txt, delay, who) => { const b = who || cpick(near); S.pending.push({ at: now + (delay || 1500 + crand() * 4000), bot: b.id, ch: ch === 'whisper' ? 'whisper' : ch, text: sloppy(b, txt) }); };
    if (/\b(hi|hello|hey|halo|sup|yo)\b/.test(t)) { say(cpick(['hi', 'hey', 'sup', 'o/', 'hello', 'halo bang'])); if (cchance(0.4)) say(cpick(['hey there', 'hiya', 'yo']), 5000); return; }
    if (/\b(gz|grats|congrats)\b/.test(t)) { say(cpick(['ty', 'thx', 'ty ty', ':)'])); return; }
    if (/\b(ty|thx|thanks|makasih)\b/.test(t)) { say(cpick(['np', 'yw', 'anytime'])); return; }
    if (/\b(lol|lmao|wkwk)\b/.test(t)) { if (cchance(0.5)) say(cpick(['lol', 'haha', 'wkwkwk', 'xD'])); return; }
    if (/\?/.test(t)) {
      const m = t.match(/where (?:is|are) (?:the )?(.+?)\?/);
      if (m) { say(B.whereIs(m[1])); return; }
      say(cpick(['no idea sorry', 'idk', 'check the lore journal lol', 'ask in general', 'not sure', 'same question']));
      return;
    }
    if (/\b(inv|group|lfg|lfsd|snaggle|sd|smugglers)\b/.test(t)) {
      if (S.player.level >= 8) say(cpick(['queue up in group finder, i will join', 'yeah sure, use the finder', 'i am in queue already']));
      else say(cpick(['you are too low lol', 'come back at 8+', 'old snaggle will eat you']));
      return;
    }
    if (cchance(0.45)) say(cpick(['k', 'lol', 'ok', '?', 'true', 'fr', 'nice', 'same']));
  };

  // A short profile when you tap someone.
  B.bio = function (b) {
    const how = b.style === 'tryhard' ? 'Plays every day and pushes hard' : b.style === 'regular' ? 'Plays most evenings' : 'Logs in now and then, mostly to quest';
    const vibe = b.toxic > 0.6 ? 'Known to lose patience in groups.' : b.ninja ? 'Rolls need on a little too much.' : b.social > 0.7 ? 'Always up for a chat.' : b.social < 0.3 ? 'Keeps to themselves.' : 'Polite in groups.';
    return `${how}. ${vibe}`;
  };

  // Party banter hooks
  // A Legend speaks in their own voice (D.LEGENDS[key].cameo[kind]), never in bot shorthand
  const LEGEND_VOICE = { hello: ['Well met.'], pull: ['On me.', 'Ready when you are.', 'Steady. Now.'], wipe: ['Up. We go again, slower.', 'Breathe. Again.'], win: ['Well fought.', 'Good.', 'That will do.'], loot: ['Take it. It suits you.', 'Keep it. I travel light.'], bye: ['Go well.'] };
  B.partyLine = function (bot, kind) {
    if (bot && bot.legend && root.D && D.LEGENDS && D.LEGENDS[bot.legend]) { const c = D.LEGENDS[bot.legend].cameo || {}; const L = c[kind] || LEGEND_VOICE[kind] || LEGEND_VOICE.hello; return L[Math.floor(crand() * L.length)]; }
    // #73: bigger pools (party had about 45 lines in all), each said in the speaker's own voice (B.voiced)
    const T = {
      hello: ['hi', 'hey all', 'yo', 'sup', 'hello', 'o/', 'halo', 'hey hey', 'hiya', 'hi all, first time here', 'heya', 'greetings', 'hi o/'],
      pull: ['pulling', 'go go', 'inc', 'lets go', 'here we go', 'moving on', 'next pack', 'on it', 'charging in', 'go'], // no "ready?": nothing on screen answers it (#159)
      wipe: bot.toxic > 0.6 ? ['healer??', 'wow', 'omg this group', 'who pulled that', 'gg noobs', 'unreal', 'are we serious', 'cmon'] : ['lol wipe', 'oops', 'rip', 'my bad', 'run back?', 'that went well', 'well that happened', 'we got this next time', 'ouch', 'ok that hurt'],
      win: ['nice', 'ez', 'gj', 'yay', 'good', 'clean', 'nice one all', 'smooth', 'well played', 'that was fun', 'woo', 'gg'],
      loot: bot.ninja ? ['sorry misclick', 'i need it for offspec', 'lol', 'it was an upgrade ok', 'oops'] : ['grats', 'gz', 'nice drop', 'gz on the loot', 'ooh shiny', 'enjoy it'],
      oom: ['oom', 'need mana', 'drinking', 'mana break pls', 'drinking, sec'],
      bye: ['ty for group', 'gg', 'thanks all', 'gg wp', 'nice run', 'great group', 'ty all, that was fun', 'cya', 'gg all o/', 'thx for the run', 'fun one, ty'],
      leave: ['gtg sorry', 'i have to go', 'dinner, bye'],
      rage: ['this is a waste of time', 'im out', 'gg bad group'],
      afk: ['brb 1 min', 'phone sry', 'afk sec'],
    };
    return B.voiced(bot, cpick(T[kind] || ['...']));
  };

  root.B = B;
})(typeof window !== 'undefined' ? window : globalThis);
