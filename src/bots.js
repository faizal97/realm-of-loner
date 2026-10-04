// Realm of Loner — the simulated server: population, schedules, levelling, chat.
(function (root) {
  const D = root.D;
  const B = {};
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const chance = (p) => Math.random() < p;

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
  B.makeName = function (used) {
    for (let i = 0; i < 50; i++) {
      let n;
      if (chance(0.3)) n = pick(MEME) + (chance(0.4) ? pick(['', 'x', 'z', 'y', 'o']) : '');
      else n = pick(SYL_A) + pick(SYL_B) + (chance(0.15) ? pick(['a', 'e', 'i']) : '');
      n = n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
      if (n.length > 12) n = n.slice(0, 12);
      if (!used.has(n)) { used.add(n); return n; }
    }
    return 'Alt' + Math.floor(Math.random() * 9999);
  };

  const GUILDS = ['Brackenford Legends', 'Crimson Vanguard', 'Knights of Ambermoor', 'Pumpkin Patrol', 'Grey Hood Dropouts', 'Lions Pride', 'Mireling Mafia', 'Starlight Vanguard',
    'Blood and Thunder', 'Sons of the Storm', 'Dust Eaters', 'Bonewall Raiders', 'Kessari Hexers'];
  const GUILD_FACTION = GUILDS.map((g, i) => (i < 8 ? 'alliance' : 'horde'));
  B.GUILDS = GUILDS; B.GUILD_FACTION = GUILD_FACTION;
  B.factionOf = (bot) => ((D.RACES[bot.race] || {}).faction || 'alliance');

  // ------------------------------------------------------------- population
  B.makeBot = function (id, used, opts) {
    opts = opts || {};
    const cls = pick(['warrior', 'warrior', 'mage', 'mage', 'priest', 'rogue', 'rogue', 'priest', 'paladin', 'paladin', 'warlock', 'warlock', 'hunter', 'hunter', 'druid', 'druid', 'shaman', 'shaman']);
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
    const opts = GUILDS.map((g, i) => i).filter((i) => GUILD_FACTION[i] === f);
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

  B.isOnline = function (bot, date) {
    const h = date.getHours();
    const d = Math.floor(date.getTime() / 3600000);
    let dist = Math.abs(h - ((bot.peak + 24) % 24));
    dist = Math.min(dist, 24 - dist);
    const base = dist <= bot.hours / 2 ? 0.8 : dist <= bot.hours ? 0.35 : 0.06;
    return hash(bot.id, d) < base;
  };

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
  B.advance = function (S, ms) {
    const news = [], clears = {}; let beyond = 0; // beyond: clears the news can't name at your level (issue #18)
    const steps = Math.min(48, Math.max(1, Math.ceil(ms / 1800000)));
    const stepMs = ms / steps;
    for (let s = 0; s < steps; s++) {
      const when = new Date(S.lastSim + stepMs * (s + 1));
      for (const b of S.bots) {
        if (b.level >= D.LEVEL_CAP) continue;
        if (!B.isOnline(b, when)) continue;
        b.xpf += rate(b) * (stepMs / 3600000);
        while (b.xpf >= 1 && b.level < D.LEVEL_CAP) {
          b.xpf -= 1; b.level++;
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
      if (capped >= 5 && Math.random() < Math.min(0.9, capped / 40) * (stepMs / 3600000)) {
        const fits = Object.keys(D.ACTIVITIES).filter((k) => { const A = D.ACTIVITIES[k]; if (!A.dungeon || A.worldBoss || A.needQuest || !D.DUNGEONS[A.dungeon]) return false;
          return S.bots.filter((b) => b.level >= A.minLvl && b.level <= (A.maxLvl || D.LEVEL_CAP) + 5).length >= (A.size || 5); });
        if (fits.length) {
          const act = pick(fits), g = pick(GUILDS), F = S.server.firsts = S.server.firsts || {};
          if (S.server.firstVC && !F.deadmines) F.deadmines = S.server.firstVC; // the one first older saves recorded
          const first = !F[act]; if (first) F[act] = g; // recorded even when it can't be told yet, so it's right when you get there
          const last = lastBoss(act);
          if (!B.newsNames(S, act)) beyond++;
          else if (first && last) news.push({ t: when.getTime(), text: `<${g}> is the first guild on ${D.REALM} to defeat ${last.name}!`, big: true });
          else clears[g + '|' + act] = (clears[g + '|' + act] || 0) + 1;
        }
      }
    }
    // repeated clears read as one line each ("cleared The Smugglers' Deep ×3"), so a long absence isn't one sentence 40 times
    for (const [k, n] of Object.entries(clears)) { const [g, act] = k.split('|'); news.push({ t: S.lastSim + ms, text: `<${g}> cleared ${D.ACTIVITIES[act].name}${n > 1 ? ` ×${n}` : ''}.` }); }
    if (beyond) news.push({ t: S.lastSim + ms, text: `Veteran groups cleared ${beyond} more ${beyond === 1 ? 'place' : 'places'} beyond your level.` });
    // new players keep rolling alts, so the starting zone never empties
    const newbies = Math.floor((ms / 3600000) * 3);
    const used = new Set(S.bots.map((b) => b.name));
    for (let i = 0; i < Math.min(newbies, 40); i++) {
      const nb = B.assignGuild(B.makeBot(S.nextBotId++, used, { level: 1 }));
      S.bots.push(nb);
    }
    if (newbies > 0) news.push({ t: S.lastSim + ms, text: `${Math.min(newbies, 40)} new adventurer${Math.min(newbies, 40) === 1 ? '' : 's'} started out across Caldreth.` }); // every start, not only the Human one (issue #18)
    // keep the population bounded
    if (S.bots.length > 420) S.bots.splice(0, S.bots.length - 420);
    S.lastSim += ms;
    const G1 = root.G; // and nothing the reader's level may not read (#69, the #54 rule)
    return G1 && G1.nameable && S.player ? news.filter((n) => G1.nameable(n.text, S.player.level)) : news;
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
    if (bot.skill < 0.4 && chance(0.6)) s = lower(s).replace(/[.!]$/, '');
    if (bot.toxic > 0.6 && chance(0.3)) s = s.toUpperCase();
    return s;
  }
  B.sloppy = (bot, s) => sloppy(bot, s);


  // ---------- ambient chat: flavour only. Anything that asks the player for something lives in social.js as a
  // real request (m.act); nothing here may read like one (sim/chatcheck.js enforces that).
  // c: ctx() plus c.me, the bot talking.
  const GENERAL_ANY = [
    (c) => `where is ${c.namedMob}?`,
    (c) => `anyone know where ${c.questNpc} is`,
    () => 'is there a way to reset talents',
    () => 'what level can i ride a mount',
    () => 'server feels packed tonight',
    (c) => `${c.mobName} drop rate is a joke`,
    (c) => `who is camping ${c.namedMob}, i've been waiting 20 min`,
    (c) => `died to ${c.namedMob} again. third time today`,
    (c) => `gz to whoever just took down ${c.namedMob}`,
    (c) => `the music in ${c.zone} tho`,
    (c) => `${c.zone} at night is so pretty`,
    (c) => `${c.town} inn is the comfiest inn, fight me`,
    (c) => `ding ${c.me.level}!`,
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
    (c) => `every ${c.mobName} in this zone hates me personally`,
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
    [() => 'cinderpeak depths is a maze', () => 'the blackcloister gives me the creeps', () => 'graymouth in the rain, perfect', () => 'icewold yetis again', () => 'is it just me or is the sea acting weird lately'],
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
    (c) => `does ${c.boss} drop anything good for ${c.me.cls}s?`,
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
    () => 'hey', () => 'o/', () => 'ty for the buff', () => 'argh, respawn is so slow', () => 'u can have this one', () => 'lol', () => 'got it', () => 'brb', () => 'ok back',
    () => 'my bags are full already', (c) => `watch out, ${c.mobName} packs here`, (c) => `${c.mobName} again...`, () => 'nice pull', () => 'oops sorry, thought that was mine',
    () => 'these spawns are so fast lol', () => 'gl with the quest', () => 'phew, almost died there', () => 'just one more and im done', () => 'where did all the mobs go',
    (c) => `this ${c.zone} music tho`, () => 'ow', () => 'rip', () => 'nice one', () => 'close call lol', () => 'ty!', () => 'np', () => 'ding!', () => 'gz',
    (c) => `${c.mobName}s everywhere`, () => 'finally, the last one', () => 'omg that crit', () => 'who pulled that lol', () => 'sorry, tagged it by accident',
    (c) => `anyone else doing ${c.zone} quests? so many`, () => 'oom, sitting', () => 'love this spot', () => 'run!!', (c) => `heading back to ${c.town} after this`,
  ];
  const GUILD = [
    () => 'evening all', () => 'morning guild', () => 'grats on the ding!', () => 'guild bank when', () => 'lol', () => 'gn guys', (c) => `finally ${c.me.level}!`,
    () => 'that last run was fun', (c) => `who's in ${c.zone}? just got here`, () => 'brb food', () => 'love this guild', () => 'gz on the drop earlier',
    () => 'our tank is a legend', () => 'rip my repair bill', (c) => `just saw ${c.namedMob} lol, ran away`, () => 'the AH is crazy today',
    () => 'ty for the help earlier', () => 'long day at work, finally home', () => 'what did everyone get from the roulette today?', () => 'weekly goal is getting close',
  ];
  const WHISPER = [
    () => 'nice gear lol',
    () => 'r u a bot?',
    () => 'Hello friend! Cheapest gold on the server, 1000g for $10, visit our site!',
    () => 'CHEAP GOLD FAST DELIVERY 100% SAFE, visit our site',
    () => 'ty for the buff earlier!',
    (c) => `was that u in ${c.zone}? saw u fighting ${c.mobName}s`,
    () => 'wrong window sorry',
    () => 'lol sorry, meant that for someone else',
    () => 'gl out there!',
    () => 'ur name is so good',
  ];

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

  function ctx(S) {
    const P = D.PLACES[S.player.place] || D.PLACES.northshire_abbey;
    const mobs = (P.mobs || []).map((m) => m[0]);
    // named mobs players ask about come from the zone you are in, never another faction's
    const region = P.region || 'elwynn';
    const namedAll = [...new Set(Object.values(D.PLACES).filter((p) => (p.region || 'elwynn') === region).flatMap((p) => Object.keys(p.named || {})).concat(Object.values(D.QUESTS).flatMap((q) => q.objs.filter((o) => o.type === 'kill' && D.MOBS[o.mob] && D.MOBS[o.mob].named).map((o) => o.mob))).filter((k) => { const pl = Object.values(D.PLACES).find((p) => (p.named || {})[k] || (p.mobs || []).some((m) => m[0] === k)); return !pl || (pl.region || 'elwynn') === region; }))];
    if (!namedAll.length) namedAll.push(region === 'elwynn' ? 'hogger' : Object.keys(D.MOBS).find((k) => D.MOBS[k].named) || 'hogger');
    const q = Object.keys(S.player.quests || {});
    const zoneNpcs = Object.values(D.PLACES).filter((p) => (p.region || 'elwynn') === (P.region || 'elwynn')).flatMap((p) => p.npcs || []);
    const npc = q.length ? D.NPCS[D.QUESTS[q[0]].turnin].name : D.NPCS[pick(zoneNpcs.length ? zoneNpcs : Object.keys(D.NPCS))].name;
    const L = S.player.level;
    const inns = Object.values(D.PLACES).filter((p) => (p.region || 'elwynn') === region && p.inn);
    const G0 = root.G;
    // dungeons near your level; raids only once you are their level (Veshmira's name is a level-60 reveal)
    const acts = Object.keys(D.ACTIVITIES).filter((k) => { const A = D.ACTIVITIES[k]; return !A.needQuest && A.minLvl <= L + 3 && A.maxLvl >= L - 3 && !(A.size >= 10 && L < A.minLvl) && !(G0 && G0.activityBlock && G0.activityBlock(k) === 'hidden'); });
    const A = D.ACTIVITIES[acts.length ? pick(acts) : 'hogger'];
    const Dg = A.dungeon && D.DUNGEONS[A.dungeon]; const lastBoss = Dg && Dg.pulls.filter((p) => p.boss).pop();
    const bossKey = A.boss || (lastBoss && lastBoss.mobs[0]);
    const clsNames = Object.values(D.CLASSES).map((x) => x.name.toLowerCase());
    return {
      zone: P.zone || 'the wilds', town: inns.length ? pick(inns).name : 'the', band: L < 15 ? 0 : L < 30 ? 1 : L < 45 ? 2 : 3,
      act: A.name, boss: bossKey && D.MOBS[bossKey] ? D.MOBS[bossKey].name : 'the last boss', classA: pick(clsNames), classB: pick(clsNames),
      mobName: mobs.length ? D.MOBS[pick(mobs)].name : 'Kobold', namedMob: D.MOBS[pick(namedAll)].name, questNpc: npc,
      hogger: S.player.level >= 8,
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
  B.lineFits = function (S, text, from) {
    const G1 = root.G;
    if (G1 && G1.nameable && S.player && !G1.nameable(String(text), S.player.level)) return false;
    const b = from && (from.level != null ? from : S.bots && S.bots.find((x) => x.id === from.id));
    return !(b && b.level != null && B.contentAbove(text, b.level));
  };

  // the content a speaker names (#69): a dungeon or raid near ITS level (raids only at their level), its last boss, and
  // its level band; what the player's level may read is checked again on the finished line (B.lineFits)
  function botContent(S, b) {
    const L = (b && b.level) || S.player.level, G0 = root.G;
    const acts = Object.keys(D.ACTIVITIES).filter((k) => { const A = D.ACTIVITIES[k]; return !A.needQuest && !A.worldBoss && A.minLvl <= L + 3 && A.maxLvl >= L - 3 && !(A.size >= 10 && L < A.minLvl) && !(G0 && G0.activityBlock && G0.activityBlock(k) === 'hidden'); });
    if (!acts.length) return { band: L < 15 ? 0 : L < 30 ? 1 : L < 45 ? 2 : 3 };
    const A = D.ACTIVITIES[pick(acts)], Dg = A.dungeon && D.DUNGEONS[A.dungeon], lb = Dg && Dg.pulls.filter((p) => p.boss).pop(), bk = A.boss || (lb && lb.mobs[0]);
    return { act: A.name, boss: bk && D.MOBS[bk] ? D.MOBS[bk].name : 'the last boss', band: L < 15 ? 0 : L < 30 ? 1 : L < 45 ? 2 : 3 };
  }

  // Emit one chat message into S.chat. from: bot | null (system). A bot's line that doesn't fit (#69) is not sent: null
  B.post = function (S, ch, from, text) {
    if (from && !from.legend && !(S.player && from.name === S.player.name) && !B.lineFits(S, text, from)) return null;
    const m = { id: (S.chatSeq = (S.chatSeq || 0) + 1), t: Date.now(), ch, from: from ? from.name : null, cls: from ? from.cls : null, fromId: from ? from.id : null, text };
    if (from && from.legend) m.legend = true; // a Legend speaks in their own colour
    S.chat.push(m);
    if (ch === 'whisper' && from && from.name) S.lastWhisper = from.name;
    if (S.chat.length > 160) S.chat.splice(0, S.chat.length - 160);
    return m;
  };

  // Called every second. Schedules chatter.
  B.chatTick = function (S, now) {
    const T = S.chatTimers || (S.chatTimers = {});
    const date = new Date(now);
    const online = B.onlineCount(S, date);
    const busy = Math.min(1.6, 0.5 + online / 90);
    const c = ctx(S);
    const myF = (D.RACES[S.player.race] || {}).faction || 'alliance';
    const mineBots = S.bots.filter((b) => B.factionOf(b) === myF);
    const onl = () => { for (let i = 0; i < 12; i++) { const b = pick(mineBots); if (B.isOnline(b, date)) return b; } return pick(mineBots.length ? mineBots : S.bots); };
    c.horde = myF === 'horde';
    const due = (k, a, b) => { if (!T[k]) T[k] = now + (a + Math.random() * (b - a)) * 1000 / busy; if (now >= T[k]) { T[k] = 0; return true; } return false; };
    // #69: a line names content at the speaker's level (its dungeon or raid, its boss, its level band), and one that
    // still doesn't fit (B.lineFits) is picked again; after six tries nothing is said
    const speak = (b) => { c.me = b; Object.assign(c, botContent(S, b)); return c; };
    const gen = (b, make) => { for (let i = 0; i < 6; i++) { const t = make(); if (B.lineFits(S, t, b)) return t; } return null; };

    if (S.pending && S.pending.length) {
      const ready = S.pending.filter((p) => p.at <= now);
      S.pending = S.pending.filter((p) => p.at > now);
      for (const p of ready) {
        let bot;
        if (p.fromName) { const gm = S.group && S.group.members.find((m) => m.name === p.fromName); bot = { name: p.fromName, cls: gm ? gm.cls : null, id: p.bot, legend: !!(gm && gm.legend) }; }
        else bot = S.bots.find((b) => b.id === p.bot) || onl();
        B.post(S, p.ch, bot, p.text);
        if (p.onPost) p.onPost(bot);
      }
    }
    if (due('general', 9, 22)) {
      const b = onl(); speak(b);
      const pool = GENERAL_ANY.concat(c.horde ? GENERAL_HORDE : GENERAL_ALLI, GENERAL_BAND[c.band], GENERAL_BAND[c.band]);
      const text = gen(b, () => sloppy(b, pick(pool)(c))) || '';
      if (text) B.post(S, 'general', b, text);
      // sometimes someone answers
      for (const A of ANSWERS) {
        const mm = lower(text).match(A.q);
        if (mm && chance(0.75)) {
          const r = onl();
          S.pending = S.pending || [];
          S.pending.push({ at: now + 2500 + Math.random() * 5000, bot: r.id, ch: 'general', text: sloppy(r, pick(A.a(mm))) });
          break;
        }
      }
    }
    if (S.player.level >= 8 && due('lfg', 40, 90)) {
      const b = onl(); speak(b);
      const text = b.level >= 6 ? gen(b, () => sloppy(b, pick(LFG_CHATTER)(c))) : null;
      if (text) {
        B.post(S, 'lfg', b, text);
        for (const A of ANSWERS) { const mm = lower(text).match(A.q); if (mm && chance(0.6)) { const r = onl(); S.pending = S.pending || []; S.pending.push({ at: now + 3000 + Math.random() * 5000, bot: r.id, ch: 'lfg', text: sloppy(r, pick(A.a(mm))) }); break; } }
      }
    }
    if (due('say', 16, 38)) {
      const near = B.onlineIn(S, S.player.place, date).filter((b) => B.factionOf(b) === B.factionOf(S.player));
      if (near.length && !D.PLACES[S.player.place].safe || near.length > 2) { const b = pick(near.length ? near : [onl()]); speak(b); const t = gen(b, () => sloppy(b, pick(SAY_NEAR)(c))); if (t) B.post(S, 'say', b, t); }
    }
    if (S.player.guild != null && S.player.guild >= 0 && due('guild', 30, 70)) {
      const mates = S.bots.filter((b) => b.guild === S.player.guild && B.isOnline(b, date));
      if (mates.length) { const b = pick(mates); speak(b); const t = gen(b, () => sloppy(b, pick(GUILD)(c))); if (t) B.post(S, 'guild', b, t); }
    }
    if (due('whisper', 200, 480)) {
      const b = onl(); speak(b);
      const t = gen(b, () => pick(WHISPER)(c)); if (t) B.post(S, 'whisper', b, t);
    }
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
    const say = (txt, delay, who) => { const b = who || pick(near); S.pending.push({ at: now + (delay || 1500 + Math.random() * 4000), bot: b.id, ch: ch === 'whisper' ? 'whisper' : ch, text: sloppy(b, txt) }); };
    if (/\b(hi|hello|hey|halo|sup|yo)\b/.test(t)) { say(pick(['hi', 'hey', 'sup', 'o/', 'hello', 'halo bang'])); if (chance(0.4)) say(pick(['hey there', 'hiya', 'yo']), 5000); return; }
    if (/\b(gz|grats|congrats)\b/.test(t)) { say(pick(['ty', 'thx', 'ty ty', ':)'])); return; }
    if (/\b(ty|thx|thanks|makasih)\b/.test(t)) { say(pick(['np', 'yw', 'anytime'])); return; }
    if (/\b(lol|lmao|wkwk)\b/.test(t)) { if (chance(0.5)) say(pick(['lol', 'haha', 'wkwkwk', 'xD'])); return; }
    if (/\?/.test(t)) {
      const m = t.match(/where (?:is|are) (?:the )?(.+?)\?/);
      if (m) { say(B.whereIs(m[1])); return; }
      say(pick(['no idea sorry', 'idk', 'check the lore journal lol', 'ask in general', 'not sure', 'same question']));
      return;
    }
    if (/\b(inv|group|lfg|lfsd|snaggle|sd|smugglers)\b/.test(t)) {
      if (S.player.level >= 8) say(pick(['queue up in group finder, i will join', 'yeah sure, use the finder', 'i am in queue already']));
      else say(pick(['you are too low lol', 'come back at 8+', 'old snaggle will eat you']));
      return;
    }
    if (chance(0.45)) say(pick(['k', 'lol', 'ok', '?', 'true', 'fr', 'nice', 'same']));
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
    if (bot && bot.legend && root.D && D.LEGENDS && D.LEGENDS[bot.legend]) { const c = D.LEGENDS[bot.legend].cameo || {}; const L = c[kind] || LEGEND_VOICE[kind] || LEGEND_VOICE.hello; return L[Math.floor(Math.random() * L.length)]; }
    const T = {
      hello: ['hi', 'hey all', 'yo', 'sup', 'hello', 'o/', 'halo'],
      pull: ['pulling', 'ready?', 'go go', 'inc', 'lets go'],
      wipe: bot.toxic > 0.6 ? ['healer??', 'wow', 'omg this group', 'who pulled that', 'gg noobs'] : ['lol wipe', 'oops', 'rip', 'my bad', 'run back?'],
      win: ['nice', 'ez', 'gj', 'yay', 'good'],
      loot: bot.ninja ? ['sorry misclick', 'i need it for offspec', 'lol'] : ['grats', 'gz', 'nice drop'],
      oom: ['oom', 'need mana', 'drinking'],
      bye: ['ty for group', 'gg', 'thanks all', 'gg wp', 'nice run'],
      leave: ['gtg sorry', 'i have to go', 'dinner, bye'],
      rage: ['this is a waste of time', 'im out', 'gg bad group'],
      afk: ['brb 1 min', 'phone sry', 'afk sec'],
    };
    return pick(T[kind] || ['...']);
  };

  root.B = B;
})(typeof window !== 'undefined' ? window : globalThis);
