# A living population: design options

**Decided: option A, the living server in four phases, with the 16 gated targets** (Faizal, 2026-10-04, via the
Lead: "yes option A"). Phase 1's spoiler fix is already filed as #69 in v10.10.1. **It goes first, as v10.11** (Faizal: "full living server but make sure our system didnt change i mean like our rules
of the bots in the contents"); the tavern moves to v10.12. From QA's believability audit (#68) and the Balance Analyst's chat measurements on it
(`sim/chatrepeat.js`, main d76854d). Faizal's aim: the simulated players should feel like **persistent people**, not
disguised NPCs; what's needed is **persistent identity, not more AI**; and chat's "repetitiveness and cohesiveness...
we need to crush that down". Drafted by the game designer, 2026-10-04.

## What's broken, in numbers

- **No one reaches the endgame.** At 420 bots the roster deletes the *oldest* first: in a 60-day run, **0 bots ever
  reached 60**, and all 260 starting bots (friends included) were gone by day 14. So at 60 every group-mate is a
  stranger made on the spot.
- **Each alt has its own world:** 163 of 164 names shared by two characters are different people.
- **Gear is re-rolled** every time you meet a bot (a level-60 bot in Linen).
- **Chat repeats:** 93.5% of a week's lines are templates already seen, 67% in the first hour; the first repeat comes
  within **0.5–3 minutes**; about **717 lines an hour**. The top five lines (each about 12 an hour) are General's
  level-60 band, which is 5 lines **added to the pool twice**. Guild has 20 lines for about 2,170 heard a week.
- **Chat doesn't read who's speaking or the world.** 7.3% of lines name content at least 4 levels above the speaker
  (the chat context takes **the player's** level, not the bot's); time-of-day and "server busy" lines are right about
  half the time; **83%** of "earlier / again / last time" lines have no shared history behind them; 88% of lines answer
  nothing. A level-8 bot names a level-60 raid boss, which is also a **spoiler**.
- **What already works:** a stored roster with stable identities within one character (371 of 371 kept across
  reopening), bots that level while you're away, real requests that are always true (rare sightings, the world boss),
  and good reply pairs ("is war mode worth it?" / "turn it off while questing lol").

## The pieces (every option is built from these)

1. **One population per account.** The realm's bots are stored once for the account, so every character on it sees
   the same people (each sees its own faction's half). **Saves:** the oldest character's roster becomes the account's;
   a friend from another character who isn't in it joins it. Nothing a player has is lost.
2. **A roster that grows up.** About **500 bots**. Bots leave by **quitting, not by age**: new low-level bots quit
   often (as in real games), veterans rarely, so the server fills up at the top over time. **Your friends and
   guildmates never vanish silently:** one who goes quiet says so ("taking a break for a bit") and can come back. A new
   realm starts with a spread of levels (some veterans already at 60), then lives on in real time.
3. **Gear that progresses.** Each bot's gear is stored compactly (a quality tier per slot, drawn once from its id and
   that tier), so the same bot looks the same every time, and it improves as the bot levels and clears content.
   Level-appropriate names (no Linen at 60).
4. **Groups write back, and bots remember.** Group-finder and battleground groups come from the roster (it now has
   60s), so you meet the same people again. A run writes back: who you ran with, where, how it went, a ninja roll, a
   good heal. Bots have a few friends and rivals of their own, guilds that change now and then, and a short history
   ("dinged 47", "got [item]", "cleared the Coinworks with <guild>").
5. **Chat from who's speaking and what's true.**
   - The speaker's own level, zone, class, guild and personality choose the line (fixes the 7%).
   - **Only true lines:** time of day from the clock, "busy / quiet" from the online count, memories only with a
     record behind them, news only of events that happened (a guild that "cleared X" really has members who did).
   - **Fewer, better lines:** about **half the volume** (roughly 6 a minute, not 12), so each line matters more.
   - **Bigger pools and per-template cooldowns:** no template again for a player within a set time; each bot has its
     own phrasing habits (its "voice").
   - **Threads:** short exchanges between bots who know each other, naming each other.
   - **Catch-up chat spread over the time you were away**, not dumped in one second.
6. **No chat spoilers.** Every generated line goes through the #54 shared check (`G.nameable`) at the reading
   character's level, and `tools/lorekeeper.js` sweeps generated chat at every Reveals level in the build.

## The guardrail: who bots are changes, how they play content does not

Faizal's rule (2026-10-04). The living server changes **who the bots are** (persistent identity, the roster, stored
progressing gear, memory, friends and rivals) and **what they say** (chat). It must **not** change the rules of how bots
play content:
- combat behaviour and AI;
- group-finder fill and composition (roles, how many, the **skill mix**: groups drawn from the roster must have the
  same distribution of bot skill as today's generated groups);
- battleground and Bloodsand Brawl rules (including how teams are levelled to you);
- world-party rules, and **anything that scales with how many bots are online** (world-party joins, ambushes,
  requests): the bigger roster must give the same rate per hour as today;
- balance, and **the bot gear power level**: stored, progressing gear lands in the same power band as today's
  generated gear at each level and quality, and bots' effect items (#56) are unchanged.

**Proof, every phase:** the Balance Analyst runs every existing gate sim before and after (group, raid, Hard raid,
Trials, world bosses, brawl, duel, pars, `questpace`, `capacity`, `effects`), and each must stay within noise (the #45
two-stage rule). It's a build gate for the whole update. A gear-band check compares stored gear with generated gear
per level and quality.

## Targets the Balance Analyst gates in the build

`sim/chatrepeat.js` and a population sim, seeded, at least two seeds; the build stops if a gate fails (with the #45
two-stage rule for gates near their line).

| measure | today | target |
|---|---|---|
| Time to first template repeat (General and Guild) | 0.5–3 min | **≥ 30 min** of play |
| Template repeats, first hour / first day / week | 67% / 79% / 93.5% | **≤ 20% / ≤ 40% / ≤ 70%** |
| Exact line repeats, week | 86.5% | **≤ 30%** |
| Any one template, per player | about 12 an hour | **≤ 2 an hour** |
| A bot repeating its own template (median) | 15% | **≤ 5%** |
| Lines naming content above the speaker's level + 3 | 7.3% | **0** |
| Time-of-day and busy/quiet lines that are wrong | about 49% | **0** |
| Memory lines with no record behind them | 83% | **0** |
| Contradictions (the same bot, 10 minutes) | 0.5% | **0** |
| Lines in a thread (reply or naming another speaker) | 12% | **≥ 25%** |
| Chat lines with a Reveals term above the reader's level | found | **0**, at every level |
| Bots at 60 after 30 days | 0 | **≥ 15%**, and steady after |
| Starting bots still on the roster after 60 days | 0% | **≥ 40%** |
| A friend removed without a goodbye | yes | **never** |
| Same name, same person, across your characters | 1 of 164 | **all** |
| The same bot met twice in a day, same gear | no | **always** |

## Options

### A. The living server, in four phases (recommended)

1. **Quick chat fixes** (about 3–4 h, 1 beta): the speaker's own level for chat, the level band added once, true
   time-of-day and busy lines, no memory lines without a record, chat through `G.nameable` plus the lorekeeper sweep,
   per-template cooldowns, half the volume, catch-up spread out. **Most of the repetition and all of the spoilers and
   false lines go in hours.**
2. **One population per account that grows up** (about 6–8 h, 1–2 betas): the account roster and its save migration,
   quitting instead of deleting the oldest, protected friends with goodbyes, a seeded spread of levels.
3. **Gear and memory** (about 6–8 h, 1–2 betas): stored progressing gear, groups from the roster, write-back, bot
   friends and rivals, short histories.
4. **Identity chat** (about 8–10 h, 1–2 betas): lines chosen by personality and history, bigger pools, threads between
   bots who know each other, every gate in the table.

**Total about 25–30 h of developer work in 5–6 betas,** plus about 4–6 h of sim work for the Analyst (the population
sim and the gates). Each phase ships on its own and moves the numbers.

### B. Chat only

Phases 1 and 4. About 11–14 h, 2–3 betas. The chat reads well, but the world still never reaches 60, alts differ, and
gear re-rolls, so the people behind the chat still aren't persistent.

### C. Population only

Phases 2 and 3 with phase 1's quick fixes. About 15–20 h, 3–4 betas. Persistent people and an endgame population, but
their chat stays generic until a later update.

## Recommendation

**A, in its four phases, as its own update ("The Living Server")**: decided as **v10.11**, before the tavern (now
v10.12). And **phase 1's spoiler fix sooner:** a level-8 bot naming a level-60 raid boss is a real bug, so chat through
`G.nameable` (and the lorekeeper sweep) can go into **v10.10.1** with the layout patch, at about an hour.

Why A: Faizal's aim is persistent people, and only A delivers them (B fixes their words, C their existence; neither
alone feels alive). The phases put the cheapest, biggest wins first (phase 1 cuts most of the repetition in hours),
and every phase is measured against the table, so "alive" stops being a feeling and becomes numbers.

## Still open (for Faizal)

1. **Where it goes:** its own update after the tavern (recommended), or before it.
