# Realm of Loner roadmap

Realm of Loner is a single-player "fake MMO" set in Caldreth, a world of its own in the style of the classic online RPGs. You level from 1 to 60 as Accord or Krugar through its zones and dungeons, and every other player on the "server" is simulated. They quest around you, fill your dungeon groups, post in chat, ask you for help and run their own guilds. After 60 the story continues in an original expansion.

> Unofficial, non-commercial fan project. Not affiliated with, endorsed by or sponsored by Blizzard Entertainment. All art, music and code are original.

This document says where the game stands, how it is designed, and what comes next.

## Where it stands (v10.10.0)

- **Levels 1–60, both factions, eight races and nine classes** (any race any class), in the original world of Caldreth (since v10). About 25 zones, from the starting valleys to Icewold and the West Rotmoor.
- **Every classic dungeon along the way,** from The Smoke Pit and the Smugglers' Deep to Cinderpeak Depths, The Blackcloister and Graymouth, each with a lore intro.
- **The main story, The Black Ledger:** six chapters at levels 10–60, and short story scenes on key quests and levels in between (a story moment every 3–5 levels, for both factions).
- **The classic endgame raids at 60:** Magma Throne, beneath Cinderpeak, and Veshmira's Lair in the new Saltmarsh. Veshmira's death opens the expansion.
- **After 60, horizontal progression:** gear upgrades with Mentor Marks, the account-wide wardrobe, monthly Trials with Omens and a realm leaderboard, Hard raids, the featured raid, raid sets and three weekly world bosses.
- **Rare hunts and trophies (v10.10):** level-60 rares appear once in each 6-hour window, with a sighting in chat; an account-wide trophy for each rare and world boss, and a title at 10.
- **Battlegrounds:** the Battle for Highmoor, 5 against 5, from level 10, with eight Honor ranks per faction (titles, insignia and looks, v10.10).
- **Professions up to 300,** with Fishing and Cooking, and distance in every fight.
- **Drops with effects (v10.10):** 12 item effects on drops from every dungeon final, raid boss and world boss, and as Trial finds; an Effects codex shows them all, and bots wear them too.
- **An original expansion at 60, "The Drowned Crown":** two new zones, two dungeons and a 10-player raid.
- **Legends:** hand-made story heroes (most created by the developer's friends) with their own questline, who later turn up in your runs now and then.
- **A server that feels alive:** working chat, guilds, requests, trades, duels and rare sightings.
- **Music for every place (v10.8):** every zone, town, capital, dungeon and raid has its own track.
- **Real friends (v10.1.1):** add real players by friend code and see their characters, gear and online status live (Firebase). The base for co-op later.
- **Cloud save:** an optional copy of your characters in your own Google Drive.
- **The app updates itself.** New versions come from GitHub releases, with release notes, through the in-app updater. Public releases come in batches; test builds go to players who turn on Beta updates first (GitHub pre-releases, and the /beta/ web page).

## Design principles

- **World first.** Each update adds zones and the classic systems that unlock in their level range: talents at 10, a mount at 40, raids at 60.
- **The main levelling path.** About 12 zones per faction, the way most classic players levelled, each covering a few levels. From 30 most zones are contested and shared by both factions.
- **A simulated server.** Other players are bots with names, classes, levels, play times and personalities. They take mobs before you do, group with you, trade, chat and remember you when you help them. They are driven by the game's rules, never by an online service. Chat that reads like a request is always a real one you can act on.
- **Any race can play any class** (a house rule).
- **Nothing punishes a day off.** No login streaks. Coming back should feel like the world moved on, not like a chore was missed.
- **Saves stay compatible.** Every update migrates old characters forward.
- **Balance is tested before it ships.** Each update is checked with simulations of levelling flow (quests should give most of the XP), dungeon difficulty (wipes per run and par times) and the new systems.

## What's shipped

| Version | Highlights |
|---|---|
| 1.x | Ambermoor and the Smugglers' Deep; all nine classes; Kaldvik, Greatbough, Dunescar, Greensward and Pallmoor starting zones; the Krugar; The Smoke Pit; story cutscenes; an optional on-device AI chat pack (removed in 9.6.1) |
| 2.x | Longfield and the Scrublands (10–20); the Smugglers' Deep and The Dreaming Caves at their real levels; world PvP ambushes with War Mode; talents; Kingsmere; banks and auction houses; Help Wanted, Mentor Marks, heirlooms, titles and the daily Roulette; hub bounty boards; professions |
| 3.0 | Stoneharrow and Highcrag (18–25); the Gaol |
| 4.x | Wraithwood, the Greenfen, Greymead and contested Elderglen (20–30); Greyhowl Keep; The Tidehollow Deeps |
| 5.x | The Vinewild and the Kinloch Highlands (30–40); Gearhollow, The Thorn Warrens and the The Pyre Abbey; mounts at 40 |
| 6.0 | Sirocco and Ferndeep (40–50); The Dune Temple and The Gemfall Caves |
| 7.0 | Greenmaw Crater and the The Cinderfields (48–55); Cinderpeak Depths |
| 8.0 | The West Rotmoor and Icewold (55–60); The Blackcloister and Graymouth; level 60 |
| 9.0 | The expansion "The Drowned Crown", with a 10-player raid |
| 9.1–9.2 | Legends: Lyveus Cloveus, the Exiled Knight |
| 9.3 | In-app updates |
| 9.4 | World map with routes, NPCs in town scenes, easier selling |
| 9.5–9.6 | Working chat and guilds; custom chat tabs, a tabbed Hero sheet |
| 9.7 | The Lore Journal (story, dungeons, zones, books, quest stories), a browser version, save files, Discord |
| 9.8 | Magma Throne and Veshmira's Lair; Saltmarsh |
| 10.0 | The world becomes Caldreth: every name, story and piece of art is our own; the story becomes The Black Ledger |
| 10.1 | Cloud save to your own Google Drive; the Bounty Board; Throw away; account sync; real Friends (10.1.1) |
| 10.2 | Legends as story heroes (cameos, keepsakes); 25 story scenes; Widya, the second Legend, and the hidden Bard class |
| 10.3 | Gear upgrades: Mentor Marks raise level-60 blue and purple gear a step at a time to the ceiling (purples 100%, blues 92%); level-60 dungeon and raid clears pay Marks; the account-wide wardrobe (Hero → Wardrobe), with Legend keepsakes in its Back row |
| 10.4 | Trials (monthly seasons from October 2026, a one-day Preseason, rating, a realm leaderboard); class reactions (one per class: an ability lights up, with a callout and a one-time card) and three useful buttons for every class by level 4 |
| 10.5 | Omens (weekly Trial rules); briefings for every dungeon, raid, Wanted target and Trial; every buff and debuff explains itself |
| 10.6 | Bromli Beerhammer, the third Legend; The Coinworks (40–44); two new Wanted targets; a tidier Journey tab |
| 10.7 | The endgame update: Hard raids, the featured raid, raid sets, three world bosses, the Battle for Highmoor, the Trialsworn set |
| 10.8 | Music for every zone, town, capital, dungeon and raid, and new sounds |
| 10.9 | Professions to 300 (Expert and Artisan), Fishing and Cooking; distance in every fight; Rumhook Bay and the Bloodsand Brawl; a riskier auction house; What's new in the game |
| 10.10 | Drops with effects: 12 effects, an effect item on every dungeon final, raid boss and world boss, Trial finds that fit your class, Mentor Mark upgrades that grow the effect, the Effects codex, bots wearing effects; rare hunts and trophies; Honor ranks; levelling pace evened out by class; new par times and a fast pace that's a real trade; Friends offers cloud save |

## How the world works

### Zones and factions

- Each faction has its own zones up to about 30. From there the zones are **contested**: both factions quest there, each from its own town, and enemy players are more common.
- **Enemy towns are closed.** You can't enter the other faction's hubs or capitals, so routes and the group finder go around them. Some dungeons are therefore one faction's own (the Gaol for the Accord, Greyhowl Keep for the Krugar). Dungeons in contested land are open to both.
- **Neutral towns** (Coppergulch, Marshal's Refuge, Coldcoin) welcome everyone.
- **The world map** shows every zone and how they connect by road, ship or flight. Tap any place for the fastest route there, and travel it in one go.
- **Mounts at 40:** learn riding and buy your race's mount. Roads are 40% faster; boats and flights keep their times.

### Dungeons and the group finder

- **Be there to queue:** you queue from the dungeon's zone, and the group is formed from players of your faction who are online.
- **Synced level:** everyone fights at the dungeon's level, so old content stays a real fight. Your better gear gives a small edge.
- **Tactics:** pull pace (careful, normal, fast), kill-order marks, and a boss plan (burn the boss or kill the adds first).
- **Rewards for playing well:** each dungeon has a par time (beat it for a bonus chest), and a run with no wipes is Flawless. Chaining pulls quickly builds Momentum. A codex tracks clears, best times and flawless runs.
- **Help Wanted and Roulette:** groups of players stuck on a boss ask for help and pay in Mentor Marks. A daily Roulette gives a random dungeon with bonus rewards.
- **Raids** hold 10 players (2 tanks, 3 healers, 5 damage dealers).

### World PvP

- With War Mode on (+10% XP and gold), enemy players sometimes turn up where you are. Most attack after a short while, some just pass through, and you can strike first.
- Danger depends on the place: none in capitals and starting valleys, low in your own zones, higher in contested zones, highest in enemy territory. Guards help in towns, and a nearby player of your faction sometimes joins in.
- Kills earn Honor, which buys only looks and titles, never power.

### Professions

- Mining, Herbalism, Skinning, Blacksmithing, Alchemy, Leatherworking and Tailoring. Two per character, skill up to 150.
- Gathering nodes are in every wild place. Crafted goods include gear, potions, elixirs, sharpening stones, armour kits and bags. Rare recipes drop from bosses and rares, and trade goods sell on the auction house.

### Story and cutscenes

- **The main story** is The Black Ledger (docs/lore/canon.md): after the Long War everyone rebuilt on the Ledger's credit; its collectors take the farms, a marshal who audits its vault vanishes, and at 60 its master is revealed, the black dragon Veshmira, with Lady Thorne, the crown's Mistress of Coin, as her voice at court. An intro plays at character creation, then a chapter at 10, 20, 30, 40, 50 and 60.
- **Story scenes** (15–25 seconds, skippable) play on key quests and on reaching some levels, so the story is followed even by players who skip quest text: about every 3–5 levels on both sides.
- **Every dungeon and raid has a lore intro** that plays the first time you enter.
- **The Theater** replays everything you've unlocked, in sections for the story, Legends, and dungeons and raids.

### The endgame raids (level 60)

- **Veshmira's Lair.** After Chapter 6 the Brood Mother flies to her lair in the Dragonmire, in Saltmarsh. The Accord gathers at Harborwatch (a ship from Gullhaven) and the Krugar at Mudwall Village (the road south from Dustfort). Her storm hides the new isle; it breaks when she dies, and that opens the expansion.
- **Magma Throne.** With Emperor Grimmark dead in Cinderpeak Depths, Vulcarn stirs beneath the mountain. Seven bosses, from Cinderhound to the King Below. Not a gate, but the recommended gear step before the isle.
- Both are 10-player raids, open to both factions, just below the Tidecrown Citadel in power.

### The expansion: "The Drowned Crown" (level 60)

- When Veshmira is unmasked and flees, the storm she raises tears the sea open. The **Stormveil Isle** rises: Sael'anor, a Starborn city that sank ten thousand years ago. Its prince, Aeldran Tidecrown, bargained with a sea spirit, Nal'veshra the Deepmother, to keep his court alive beneath the waves. The drowned Wavebreaker trolls rose with it, and their sea loa has been swallowed by the Deepmother.
- **Accord:** the Tidewatch Coast, reached from Gullhaven. Its dungeon is the Sunken Archive.
- **Krugar:** the Skullreef Isles, reached from Camp Skarn. Its dungeon is the Temple of Shal'zua.
- **Raid (both factions):** the Tidecrown Citadel, 10 players, five bosses, ending with Nal'veshra.

### Legends

- **Story heroes.** Hand-made characters, most created by the developer's friends, whom the story turns around. Each has a personal want (not a mission), a questline with its own scenes, and later chapters in new expansions. Design: docs/plans/2026-09-30-legends-story-heroes-design.md.
- They fight beside you in their own story fights, and before you know them they may step into a hard fight once in a while. After their questline, a **rare cameo**: about 1 Group Finder run in 5, at most every 3 days each, one per run, with a banner, a sting, their own lines and a goodbye. A **keepsake** (a look, no stats) and a title reward the story.
- **Lyveus Cloveus, the Exiled Knight** (levels 17–60): a wood elf paladin of the Kingsmere guard who overheard the cabal and was hunted for it. Tank. Keepsake: the Silverleaf Aegis.
- **Widya, the Songkeeper's Daughter** (levels 22–40): a wood elf bard whose hamlet's lute the Ledger took for its debt; she wins it back piece by piece. Healer (the Bard class, hidden until it becomes playable). Keepsake: the Reedsong Lute.
- **Bromli Beerhammer, the Unsung** (levels 44–55): a mountain dwarf warrior (damage) who wants a ballad about himself, goes after the south's famous beasts for one, and falls off all of them; Widya writes it. Keepsake: the Beerhammer Cloak. Design: `docs/plans/2026-09-30-bromli-design.md`.

### Chat and guilds

- **Chat that does things.** Messages that ask for something can be tapped and acted on:
  - LFG posts are real groups; tap to join.
  - Players whisper you for help with kills, to team up on your quest, for a carry through a dungeon you've outlevelled, for craft orders, trades and duels, or with a question you can answer.
  - General announces rare sightings and guild recruiting.
  - A Requests tab lists everything open, and any [item] can be tapped to see it.
- **Players remember you.** Help someone and they may come back later with a thank-you gift or an invite to a run.
- **Guilds.**
  - Browse your faction's guilds and apply. Each has a style (casual, levelling, dungeons, raiding, PvP, social) and a minimum level. Or accept a recruiter's invite.
  - Guildmates post requests: dungeon runs together, materials, help with kills, donations, and scheduled guild nights. Helping earns guild standing.
  - Ranks bring small perks: more XP, more quest gold, Mentor Marks on guild runs, and a title at the top.
  - There is a weekly guild goal and a daily message of the day.

## After 60: horizontal progression

At the level cap, power stops climbing; what you collect and what you can do keeps growing.

- **A power ceiling.** The raids are the last real step up in power: Magma Throne and Veshmira's Lair, then the Tidecrown Citadel at the top. Everything after that adds options and looks, not bigger numbers.
- **Full gear counts.** Each dungeon and raid scales your level to its own, but your gear keeps its full stats, so old normal dungeons become quick farming runs for looks, trophies and Marks.
- **A slowly rising ceiling with upgrades.** Each new raid raises the ceiling about 5%, and Mentor Marks upgrade any level-60 blue or purple item up to it, so old gear stays a real choice.
- **Challenge is the loop: Trials and Hard raids.** Trials are level-60 dungeons at rising levels, with weekly Omens (each with a counter you choose) and seasons of 8 dungeons; your Trial rating draws better bots. Raids come in Normal and Hard. Design: docs/plans/2026-09-30-horizontal-progression-design.md.
- **Collections are the reward:** looks, titles, mounts, rare-boss trophies and a codex of every boss beaten, in a wardrobe shared by all your characters.
- **Drops that change how you play:** procs and set bonuses that open new builds, rather than flat upgrades.
- **New content never makes old content obsolete.** New dungeons join the Trials season beside old ones, one raid is featured each week, and old dungeons keep their own rewards.
- **Alts are breadth.** The shared wardrobe and Mentor Mark heirlooms make levelling another class worthwhile.

## What's next

Roughly in priority order:

Shipped from the earlier list: horizontal progression (10.3–10.7), world bosses (10.7), battlegrounds (10.7), Rumhook Bay and the Bloodsand Brawl (10.9), Expert and Artisan professions (10.9), and in 10.10 drops with effects, levelling pace by class, level-60 rares with trophies, and Honor ranks.

1. **The main screen's layout (v10.10.1):** a patch from QA's layout audit, so a healer sees the whole party in a fight and nothing a fight needs sits below the fold (`2026-10-04-main-screen-layout-options.md`).
2. **Tavern games (v10.11):** games at every inn for any level, Hazard and arm wrestling first, looks and titles only (`2026-10-03-tavern-games-design.md`). Liar's dice next.
3. **The Ruinfall Saga (v11–v13):** three expansions, one story. Chapter 1's design is approved and waits for Faizal's go (`2026-10-03-ossarak-saga.md`).
4. **Server events:** a Darkmoon Faire week (it can reuse the tavern's games), guild server-first races, and town defences in War Mode.
5. **Effect set bonuses** (a set of items that adds an effect; Brimming Cup may come back there).
6. **More Legends:** after Bromli Beerhammer (built in v10.6), the next one when a creator brings one.
7. **Co-op with real friends,** built on Friends (sign-in, friend list, online status); the connection for live fights is decided when co-op is designed.

## Open questions

- Whether battlegrounds should use simulated players only, or also real friends.
- Whether the Bard becomes a playable class, and when.
