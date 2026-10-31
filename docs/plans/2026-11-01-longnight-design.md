# Longnight: the winter festival

Decided 2026-11-01 (#290). Realm of Loner's second big festival, after Lanternwake: Christmas and New Year as one event.
It covers two holidays, so it is bigger than Lanternwake, and it plays differently: no candle cap and no vendor.

## Goals

1. Every level takes part, from level 10 to a geared 60.
2. A reason to come back every day, without a daily timer.
3. No power: every reward is a look, pet, mount, title, toy or keepsake.
4. Bigger in variety, not in hours: a calendar, three dailies, a boss, a raid and a town that changes.
5. Not Lanternwake with a new name: a different way to progress (a calendar and a shared hearth, not currency and a vendor).

## The festival

- **Story.** On the longest night of the year, every house in Caldreth keeps its hearth burning and its door shut until
  the year turns. The folk tale says **the Cold Guest** walks on Longnight, knocking at doors; where someone lets her in,
  the hearth dies and the house never warms again. Her herald, **the Knocker**, goes ahead of her with his frost hounds.
  At midnight on New Year's Eve the towns set off fireworks to shout the old year out, and her with it. She is a tale, not
  part of the main story, and spoils nothing. The names go into `docs/lore/canon.md`.
- **Dates.** Every year, **15 December to 4 January**, from the calendar with no release needed. Everything returns
  each year. Test builds keep it on with `force: 'test'`, as Lanternwake does.
- **Two acts and a finale.**
  - **Act 1, Winter (15 to 30 December):** the advent calendar, the three dailies, the Knocker.
  - **Finale, New Year (31 December to 4 January):** the hubs change (fireworks, new music), and the Cold Guest raid
    opens. Five days, so a player busy on New Year's Eve still gets a fair chance.
- **Content-proof.** Nothing depends on which zones or dungeons exist. The dailies run in whatever zone the player is in;
  the hearths are in each faction's capital.

## The advent calendar (your own progress)

- **16 doors**, one for each day from 15 to 30 December.
- A door opens when you finish **that day's daily**.
- **Catch-up:** up to two doors a day, until 4 January. Starting on 27 December still opens all 16; starting on
  31 December opens 10.
- Big doors (4, 8, 12) hold the outfit, door 16 the pet; the other 12 hold toys (see Rewards).
- The calendar screen gets its own design pass (frontend-design) when it is built.

## The town hearths (shared with the server)

- Each faction's capital has a **great hearth** with a fill bar. Everything you do adds **Kindling** to it: kills that
  still give XP, quests, dungeon bosses, the dailies.
- **The simulated players feed it too.** Their gifts show in chat, as real messages, and the bar moves while you are away.
- **Stages on fixed dates:** 18, 22 and 26 December, then 31 December. Each changes the town: garlands, then music, then
  snow, then the New Year fireworks. Fixed, because the game runs offline: a player who misses days never sees a stuck town.
- **Hearth ranks:** five ranks for how much Kindling you have given, no daily cap. A small reward at each; rank 5 is the
  title **Keeper of the Hearth**. This is the open-ended goal for players who want more.
- Kindling only feeds the hearth. It is never spent.

## The three dailies

One is active each day, in turn. Each takes about 10 to 15 minutes, at every level. Finishing it opens the day's door.

1. **Snowball Brawl.** A festival round of the duel and brawl system in your hub, against simulated players. Everyone
   gets the same kit, so level and gear don't matter: Throw, Pack Snow (builds ammo), Duck, and a Snowboulder that shows
   a red bar (step aside). Goal: win 3 rounds. Mashing Throw runs you out of snow while the other side packs a boulder.
2. **A Knock at the Door.** The Cold Guest's frost hounds come to three homes in your current zone, at your level. Each
   home is a short defence: hounds in waves, and a frostling casting **Hearthchill** (a red bar). Interrupt it and the
   home stays warm; let it land and that home restarts. Every class has an interrupt from level 6.
3. **Longnight Stew.** Gather 5 bundles of firewood from nodes in your zone that everyone can see (no profession), cook
   the stew at your hub's great hearth, then take a bowl to 3 simulated players who ask for one in chat (real requests,
   `sim/chatcheck.js`). They thank you and remember you.

All three give Kindling.

## Act 1 boss: the Knocker (The Shuttered Lane)

- A street of houses with their doors barred against him. A short 5-player run (about 8 minutes) through the group
  finder, synced to the player's level band (10 to 60), Normal and Hard, with a first-entry lore intro.
- **The Knocker and his two frost hounds.** The Wickless Knight tested healing and adds; the Knocker tests
  **interrupts, moving and kill order**:
  1. **Frost Mend** (red bar, interrupt): he heals a hound.
  2. **The Knock** (red bar on the whole group, step back): a heavy hit on everyone.
  3. **Hearthchill** (red bar on a random player, step aside).
  4. **Kill order:** hounds first and he has nothing to heal.
  5. **The Door Opens:** an enrage after about 2.5 minutes.
- **Hard:** a faster Knock, tougher hounds, a faster Frost Mend. Wipe rates tuned by sim, as The Snuffed Road was (#282).
- **Loot:** the first kill each day rolls loot and pays Kindling; every kill counts toward the **Frost Hound** mount,
  guaranteed by the 10th daily kill. Hard drops the outfit's dark recolour.

## Finale raid: the Cold Guest (The Open Door)

- The one house in Caldreth that let her in, frozen through. A 10-player raid, about 12 minutes, open **31 December to
  4 January** only, synced (10 to 60), Normal and Hard, with a first-entry lore intro.
- One pack first: **the Uninvited**, the frozen ghosts of the household that opened the door.
- **Three parts by her health:**
  1. **Cold Welcome (100 to 60%):** **Frostbite** on the tank (red bar, guard) and **Whiteout** on the group (red bar,
     step back).
  2. **Let Me In (60 to 30%):** three of the Uninvited come in, each casting **Let Me In**, a heal on her (red bar). A
     team interrupt check: three casts at once, the raid splits who stops which.
  3. **The Year Turns (below 30%):** a visible countdown to midnight. Kill her before it ends and the fireworks drive
     her out; miss it and the cold takes the house (the enrage).
- **Hard:** a shorter countdown, more of the Uninvited, faster heals. Wipe rates tuned by sim against the other raids.
- **After the first kill:** a short cutscene of fireworks over the player's capital, and the hearth's last stage lights.
- **Loot:** the first kill each day rolls loot; the **Pale Stag** mount is guaranteed by the **3rd** daily kill (the raid
  is open five days). The title **%s, Who Kept the Door** on the first kill. Hard drops the outfit's pale recolour.

## Rewards

| Where | What |
|---|---|
| Calendar doors 4 / 8 / 12 | **Longnight Hood**, **Longnight Coat**, **Hearthwool Cloak** |
| Calendar door 16 | Pet: a snow fox kit |
| The other 12 doors | **Snowballs** (throw at someone in town), **Costume: Snowman** (1 hour), **Hearthside Cocoa** (sit by the fire), **Garland** (hang in town), **Fireworks** |
| Hearth ranks 1 to 5 | A small reward each; rank 5: **Keeper of the Hearth** |
| The Knocker | **Frost Hound** mount; Hard: the dark recolour |
| The Cold Guest | **Pale Stag** mount; **%s, Who Kept the Door**; Hard: the pale recolour |

## Art and sound

| Kind | List |
|---|---|
| Main menu | The character screen themed for Longnight (`festSky`, as Lanternwake's lanterns): falling snow and a hearth glow in Act 1, fireworks in the finale, the Longnight theme as menu music |
| Towns | The great hearth with its fill bar; four stages (garlands, music, snow, fireworks) |
| Scenes | The Shuttered Lane; The Open Door (a frozen house inside) |
| Creatures | The Knocker, frost hound, frostling, the Uninvited, the Cold Guest |
| Mounts, pet, costume | Frost Hound, Pale Stag, snow fox kit, Snowman |
| Outfit | Hood, coat, cloak; normal, dark and pale |
| Icons | Kindling, the calendar doors, every item above, the snowball kit |
| Screens | The advent calendar (16 doors) |
| Cutscene | Fireworks over the capital after the first raid kill |
| Music | Longnight town and menu theme, the Knocker fight, the raid; each approved by ear |

Every pack gets a contact sheet, looked at before it ships.

## Building it

- Data in `src/data/events/longnight.js`, beside `lanternwake.js`; shared festival code stays shared.
- Balance: sims for the Knocker (5-player) and the raid (10-player) at levels 10, 30 and 60, fitted and bad-draw groups;
  the dailies' time at three levels; numbers posted on #290.
- Ships over several betas; release timing is decided separately.

## Related

- #291 February event (friends and guilds), #292 spring festival, #293 an Events calendar in game.
- `docs/plans/2026-10-11-lanternwake-design.md`, the first festival.
