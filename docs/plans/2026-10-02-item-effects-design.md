# Item effects: design

v10.10, "Drops that change how you play": items with an Effect, a twist that reacts to what you do in a fight. Roadmap
item 6 ("drops with unique effects"). Agreed 2026-10-02.

## Why

After 60, power stops climbing (the ceiling, the roadmap's horizontal progression). Gear today is only stats: the one
set bonus (the Smugglers' Deep's Blackened Grey Hood) is a look, and the raid sets of v10.7 are looks too. So the gear
you chase at 60 differs only by a few points. Effects give gear a choice that isn't a bigger number: which item you
wear depends on the fight and your build. They also reach players who are still levelling, who are most of the players.

Decided with Faizal:

- **Sidegrades,** never power on top.
- **Generic effects** any class can trigger, not class-specific ones (raid loot is by armour type, so a class effect on a
  mail item would be dead for half its wearers).
- **Sources:** level-60 content, plus one item from each levelling dungeon's final boss.
- **Single items only.** Set bonuses come in a later update, once effects have been played.

## 1. The rules

1. **Same budget, never on top.** An effect item has the normal budget for its level and quality; the effect is paid for
   with part of its stats (the sim tunes how much per effect; a starting guess is 25–35%). The power ceiling doesn't move.
2. **One shared library,** `D.EFFECTS` (12 to start). Each effect has a trigger any class can cause, a result and an
   internal cooldown. Items point to an effect by key (`effect: 'kindled_edge'`); its numbers scale with the item's level.
   A new dungeon adds an item, not a mechanic, and a new class (the Bard) needs nothing (design mindset §3).
3. **Choices are real.** Every effect has a fight where it beats the plain item for the same slot, and one where it
   loses, and the sim proves both (§4). An effect that wins everywhere is too strong; one that wins nowhere is dead.
4. **The same effect counts once.** Two items with the same effect give it once.
5. **New items, not changed ones.** Existing purples and blues stay as they are, so gear people own never changes
   under them. Effect items join the loot tables.

## 2. The effect library

Numbers are left to the sim (scaled by item level). "Wins" and "loses" are what §4 must prove.

**Damage (any class)**

| Effect | What it does | Wins | Loses |
|---|---|---|---|
| Kindled Edge | Your crits set the target smouldering: fire damage over 6 sec (refreshes, doesn't stack) | High-crit builds, long fights | Short trash, where the burn never finishes |
| Opening Cut | Your first hit on each enemy deals bonus damage | Levelling, many short fights, trash pulls | A long boss fight (it fires once) |
| Chase the Next | Each kill gives you haste for 10 sec | Packs, chained pulls, levelling | A single boss |
| Steady Fuse | Every 8 sec in combat, your next hit is a sure crit | Low-crit builds, steady single target | High-crit builds |
| Glass Heart | More damage, and you take more damage. No stat cost: the downside is the cost | A group with a solid tank and healer | Solo, or when you're the target |

**Healing**

| Effect | What it does | Wins | Loses |
|---|---|---|---|
| Echoing Mend | A direct heal can echo: part of it also lands on the most hurt other ally | Group-wide damage, raids | Damage on the tank only |
| Lavish Mend | Your heals are stronger and cost more mana. No stat cost: the extra mana is the price | No mana pressure (every heal is bigger) | A long, mana-limited fight (you run dry sooner) |
| Tethered Mend | Each heal on the same ally in a row heals more (up to a cap); a heal on a different ally resets it and heals less. No stat cost | Damage on the tank only | Group-wide damage (switching targets keeps resetting it) |

**Tanking and survival**

| Effect | What it does | Wins | Loses |
|---|---|---|---|
| Turning Guard | A dodge, parry or block gives you a shield | Avoidance tanks against melee bosses | Casters and magic damage |
| Spiteful Hide | Enemies that hit you in melee take damage | Tanking packs | One boss; ranged and caster enemies |
| Stubborn Blood | Falling below 30% health heals you over 6 sec (long cooldown) | Solo, levelling, spiky Trials | A well-healed group |

**Resource**

| Effect | What it does | Wins | Loses |
|---|---|---|---|
| Tithe of Battle | Your damage-over-time ticks restore a little of your power (mana, rage or energy) | Damage-over-time kits, long fights | Burst kits |

- Every class and role has at least three effects that make sense for it.
- Engine: the reaction hooks (`proc()` in `src/engine.js`: crit, hit, heal, tick, dodged) cover half the triggers. New:
  a kill, taking a melee hit, low health (yours), a first hit on a target. Item effects are their own path, not
  entries in `D.PROCS` (which is per class).
- All names are our own; `tools/ipcheck.js` checks them.

## 3. What the player sees

Design mindset §1: the player knows what they are looking at, and gets every fact, never the answer.

- **Item card:** a coloured **Effect** line in plain words with real numbers at the item's level ("Your critical hits
  burn the target for 84 Fire damage over 6 sec. At most once every 2 sec."). If you already wear the same effect:
  "You already have Kindled Edge. It counts once."
- **The last-run fact line:** "Last run: 1,240 damage, 6% of yours" (or healed, or shielded). There is no damage meter,
  so this is how a player judges an effect: one line per item, so it scales.
- **◆ Effect instead of ▲/▼.** `G.isUpgrade` and `G.itemScore` compare stats, so an effect item would always look like
  a downgrade. Whether it's better depends on the fight, so the game doesn't judge it. Nothing automatic swaps out or
  skips an effect item because of its score.
- **The Bags dot** (#11) lights for a new effect item, like an upgrade.
- **In a fight:** effects with a long cooldown (Stubborn Blood, Steady Fuse) get a callout over the character, like a
  reaction. Frequent ones (Spiteful Hide, Kindled Edge) don't (the screen would fill up); they show as floating numbers
  in an effect colour. Every shield, burn or haste an effect puts on someone is a tappable aura: name, what it does,
  the item it came from, time left.
- **A one-time card** the first time you get an effect item: "Some items have an Effect instead of part of their stats.
  Whether it beats a plain item depends on the fight: the item shows what it did in your last run. The same effect on
  two items counts once."
- **Hero sheet:** a short Effects list of what you wear. **Briefings and loot rolls** show the Effect line.

## 4. The proof

`sim/effects.js`, seeded, at least 200 fights per case. Each effect item against a plain item for the same slot, level
and quality, at levels 20, 40 and 60, for every class and role the effect suits.

**Fight cases:** a single boss (3 min); a dungeon run of trash pulls; an hour of solo levelling (XP per hour);
group-wide damage with a healer; damage on the tank only; a magic-damage boss; a long, mana-limited Hard-raid fight.
Measured by role: damage, XP per hour, healing per mana, damage taken and deaths.

**Pass bars** (starting guesses; the sim tunes them, the bars are written first, design mindset §5):

1. **Wins somewhere:** at least +2% in one of its "wins" cases.
2. **Loses somewhere:** at least −2% in one of its "loses" cases.
3. **Not too strong:** at most +8% in its best case.
4. **The ceiling holds:** the best mix of different effects in one case is at most +10% over the best plain gear (each
   effect is paid for, but several wins stacked in one fight could add up).
5. **Nothing else breaks:** the group, raid, Hard raid, Trials, world boss, brawl and duel gates still pass; no class
   drops below 0.8 brawl rounds.

An effect that wins in every case or in none is a wrong effect, not wrong numbers (design mindset §4).

**Standing rule for small misses (2026-10-03, #40/#45):** bars are judged on the 5-seed mean (a bar within ±1.0 of its line on seed 0 reruns on 5 seeds). A miss of **0.5 points or less** on that mean is fixed without asking: the Balance Analyst searches the smallest cost change within the 40% floor that passes every bar at both stages, and the developer sets it. A bigger miss, or no passing cost, comes back to the game designer.

## 5. Where items go

- **Levelling dungeon finals (16):** one blue each, at the boss's level, with the same drop chance as its other blues.
  Slots and armour types spread so every armour type and role finds several on the way to 60.
- **Level 60:** one effect item per raid boss (Hard drops it two upgrade steps up, as today); one per world boss; one
  per final boss of the Sunken Archive and the Temple of Shal'zua; a chance at one in Trial chests, from that season's
  dungeons.
- **Mentor Mark upgrades** work on effect items; the effect grows with each step, more slowly than the stats (#37: by the upgrade scale to the power `D.FX_GROW`, 0.25, so ×1.26 stats is ×1.06 effect). With linear growth an upgraded effect outgrew its price and stopped losing anywhere. `sim/effects.js` checks every bar both as dropped and at full upgrade.
- **Bots** roll Need on effect items under the same "can use" rule (`src/game.js`, the roll choices). Bots don't wear
  effects in v10.10.
- **Saves:** effect items are new, nothing to migrate. Every `D.EFFECTS` lookup is guarded: a build that doesn't know
  an effect treats the item as plain and hides the line, so a beta → live round trip never crashes (the #17 lesson).

## 6. Build order

v10.10 starts after v10.9.0 ships. Each beta is playable on its own.

1. **v10.10.0-beta.1: the system, proven on 4 effects.** The engine hooks and new triggers; `D.EFFECTS` with Opening
   Cut, Echoing Mend, Turning Guard and Stubborn Blood (one per role); `sim/effects.js` with all five bars; the Effect
   line, the ◆ mark, the last-run line, tappable auras and the one-time card; about 3 levelling dungeon finals and 2
   level-60 sources. Lookups guarded from the first commit.
2. **v10.10.0-beta.2: the full library and every source.** The other 8 effects, each passing the sim; all 16 dungeon
   finals, raid bosses, world bosses, the two level-60 dungeons and Trial chests; Mentor Mark upgrades on effect items.
3. **v10.10.0-beta.3: the finish.** The Hero Effects list, Effect lines in briefings and loot rolls, the Bags dot; the
   ceiling check on mixed effects and every existing gate rerun.
4. **v10.10.0.** The roadmap moves "drops with effects" to shipped, and its "Where it stands" and "What's shipped"
   sections catch up (they stop at 10.4).

## Later (not in v10.10)

- Wellspring (heal crits refund mana) was cut in beta.4 (#40): even at the 60% cost cap it lost only −1.8% with no mana pressure, and its refund can't change that case. A healer effect paid in stats can't lose enough; Tethered Mend, Echoing Mend's mirror, carries its price in what it does.
- Lifeline (a heal below 35% is a sure crit) was cut in beta.4 (#40): measured by capacity it won only for a level-20 Priest as dropped, nowhere once upgraded, and steady damage was a gain for the Priest instead of its loss. Lavish Mend, Wellspring's mirror, replaced it.
- Brimming Cup (overhealing becomes a shield) was cut in beta.2: overhealing happens in every fight, so it won everywhere at any cost that let it win at all (#22). It may return as a set bonus, where "always a little value" is fine.

- Set bonuses (generic, by armour type, or per class).
- Bots wearing effect items, and linking them in chat.

**Per-effect bar (2026-10-10, #191):** Steady Fuse's loses bar is −1.75 instead of −2.0, at cost 0.51 (interval 45 s). After #141 and #191 moved the baseline, no cost or interval passed both of its bars. The wins bar was kept, because an effect is picked for its win. It's re-checked at the next effects baseline (#215), and goes back to −2.0 if a cost then passes it.
