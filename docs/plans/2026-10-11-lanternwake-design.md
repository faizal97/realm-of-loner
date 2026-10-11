# Lanternwake: the autumn festival

Decided 2026-10-11. Realm of Loner's first limited-time event, Caldreth's answer to Halloween.

## Goals

1. Every level can take part, from a fresh level 1 to a geared 60.
2. Players have a reason to come back every day of the event.
3. No power: every reward is a look, a pet, a mount, a title or a keepsake.
4. A grind that is fun: a daily goal, a boss that rewards playing well, and a long chase after the vendor is done.

## The festival

- **Story.** On Lanternwake night Caldreth lights candles for its dead, so they can find the road home. The Wickless
  Knight is a folk-tale shade who lost his way centuries ago and snuffs every lantern he passes. He is a folk tale,
  not part of the main plot, so he spoils nothing. Both names go into `docs/lore/canon.md`, so the lorekeeper accepts them.
- **Dates.** Every year, **24 October to 7 November**, worked out from the date with no release needed. Everything
  returns each year, so a player who starts later can still collect it all.
- **Content-proof.** The event switches on and off from the calendar, and nothing in it depends on which zones or
  dungeons exist.

## Wake Candles (the currency)

- **Sources** (all count toward the daily cap):
  - any kill that still gives XP (grey mobs give nothing, so farming low zones does not pay)
  - quests and dungeon bosses (pay more than kills)
  - the daily hub quest **"Light the Way"**: light 5 lanterns in your current zone
- **Scaled by level.** A level 8 and a level 60 earn at the same rate.
- **Daily cap:** about **40 minutes** of normal play. After the cap, candles stop until the daily reset; the boss and
  the candle sink stay open.
- **Expiry.** Candles vanish when the festival ends, so there is no reason to hoard them.

Prices are set in **days at the cap**, not raw candles, so a later change to drop rates only rescales one number.

## The Snuffed Road (event boss)

- A short instance (about 8 to 10 minutes): one pack of lantern-wisps, then the Wickless Knight.
- **Group run:** 5 players with bots, through the group finder, plus a festival NPC in every hub who queues you.
  Weaker bot teammates are drawn as often as anywhere else.
- **Sync** to the player's own level band, floor about level 10, so every level gets a real fight.
- **Mechanics** (all existing engine features):
  1. **Snuff** puts out the party's lantern; the next hit lands harder unless **dodged**.
  2. **Wisp call** brings **adds** that each relight his lantern if they reach him.
  3. **Gallop** is a charging **aoe** down a lane: move or take a large hit.
  4. **Midnight** is an **enrage** timer: a long, button-mashed fight wipes.
- **Hard mode:** faster Snuff, more wisps, a shorter Midnight.
- **Loot:** the first kill each day rolls loot and pays a stack of candles. Every kill counts toward the mount guarantee.
- Ships with a first-entry lore intro, like every dungeon.

## Rewards

| Reward | How | Price |
|---|---|---|
| Lanternwake set: hood, mantle, robe, lantern on a pole (back) | Vendor | 1.5 days each, 6 days |
| Wisp pet "Flicker" | Vendor | 2 days |
| Title "the Lantern-Bearer" | Vendor | 2 days |
| Wickless Steed (mount) | Boss drop, small chance per daily kill, **guaranteed by the 10th kill** | |
| Hard recolour of the set | Hard-mode kill, one missing piece per kill | |
| Keepsake "Lanternwake <year>" | First kill of that year; a collection-log entry never sold again | |

The vendor costs about **10 of the 14 days** at the cap. A daily player finishes it with a few days to spare and
spends them on Hard mode, the mount and the candle sink; an every-other-day player still gets most of it.

The set is a look only (no stats); each class sees the version that fits its armour.

## Candle sink (after the vendor)

Cheap, endless and powerless:

- **Costumes** (1 hour): ghost, skeleton, or a mob from the current zone.
- **Treats** tossed to bots, who react in chat. Their lines must stay true (`node sim/chatcheck.js`).
- **Town lanterns** lit in the hub: the hub fills with more light as the event goes on.

## The Lanternwake page (one place for everything)

The player always knows what the event is, how long is left and what they still need (`docs/design-mindset.md` §1).

- **Where.** Hero → Journey → **Events**, one row per event, so it scales when more festivals come (Darkmoon Faire week
  is already on the roadmap). While an event is live, a small lantern chip on the main screen opens its page. Outside
  the dates the row reads "Returns 24 October" and the page still lists what it offers.
- **Contents, top to bottom:**
  1. What it is: two lines of story, and the dates with the time left ("Ends in 6 days").
  2. Today: "Candles today: 180 of 300 (resets at midnight)" and the candles held, with "Candles vanish when
     Lanternwake ends".
  3. Where candles come from: the three sources, with today's "Light the Way" done or not.
  4. The Snuffed Road: what the Knight does (the four mechanics, as facts), "Daily loot: taken today / not yet",
     "Wickless Steed: kill 4 of 10, guaranteed by the 10th", Hard recolour "2 of 4 pieces".
  5. Rewards: every vendor item, collected or not, with its price; the keepsake for this year, earned or not.
- **Rules it follows:** every number names what it compares with, no advice ("give every fact, never the answer"), and
  bounded counters only.

```
┌ Lanternwake ─────────────── Ends in 6 days ┐
│ Caldreth lights candles for its dead...     │
├ Today ──────────────────────────────────────┤
│ Candles today  180 of 300 · resets midnight │
│ Candles held   420 (vanish when it ends)    │
├ Where candles come from ────────────────────┤
│ Kills that give XP · Quests and bosses      │
│ Light the Way  ✓ done today                 │
├ The Snuffed Road ───────────────────────────┤
│ Snuff · Wisp call · Gallop · Midnight       │
│ Daily loot     not taken yet                │
│ Wickless Steed kill 4 of 10                 │
│ Hard recolour  2 of 4 pieces                │
├ Rewards ────────────────────────────────────┤
│ [hood ✓][mantle][robe][lantern][Flicker]... │
└─────────────────────────────────────────────┘
```

## Proof before it ships

- A pacing sim (`sim/lanternwake.js`, seeded): casual, every-other-day, daily and hardcore players through the 14 days.
  It counts what each finishes, confirms the cap is about 40 minutes at levels 10, 30 and 60, and that the vendor takes
  about 10 days for a daily player.
- A boss sim at levels 15, 35 and 60: Normal is beatable with a geared, played rotation; button-mashing hits Midnight;
  Hard needs good play.
- Save migration: old saves load; candles and festival progress live under the character and clear at the end.

## Timing

To be live on 31 October it rides the **Saturday 24 October** train (freeze Thursday 22 October), with betas before.
Art is the largest piece, which is why the set stays at 4 pieces.
