# Currency sinks at level 60: design (#181, #500)

Mentor Marks and gold pile up at level 60 with nothing left to buy. This design gives both currencies a finite chase
list about 10× today's, and permanent sinks priced by formula that never run out.

## The problem (measured)

Measured at 82cd5df, numbers on #181: a raid-geared level 60, seeds 0–2, ~600 runs.

| Player | Marks/day | Gold/day (coin + vendor) | Today's Mark sinks bought out | Today's gold sinks bought out |
|---|---|---|---|---|
| 1 h/day | ~233 | ~43g | ~4 days | ~2.3 days |
| 3 h/day | ~710 | ~123g | ~1.3 days | < 1 day |

- Today's sinks, per character: about 920 Marks (heirlooms 370 per account, upgrades ~400, Trialsworn cloaks) and
  about 99g (riding, mounts, professions, bags, resets).
- All of them are one-time, apart from open-world food and drink.
- Veshmira's Lair pays 228 Marks/h because raids have no limit on Marks, more than any other activity.

## Targets

- **Chase list:** about 10× today's sinks: ~9,400 Marks and ~1,050g. That is ~40 days at 1 h/day for Marks and ~24 days
  for gold (vendor value).
- **Permanent sinks:** they never run out, and spending grows with play.
  - Gold: repairs follow deaths: ~1% of gold for clean play, up to ~30% for a group that wipes (see Measured below).
    Consumable reagents take ~5–10% from everyone who keeps them up.
  - Marks: Reforge takes ~25–35% for a player chasing effects on their best items.
  - Renown takes whatever is left.
- **Nothing adds power past the ceiling.** Progression stays horizontal.

## 1. Repairs (gold)

- Equipped gear has durability, 100% when new.
- Each death takes 10% from every equipped piece; a party wipe is your death. Nothing wears down over time.
- At 0% the piece is broken and gives no stats until it is repaired.
- Repair cost per piece: `lost% × repairBase`, where `repairBase = k × item level × quality factor`.
  - Quality factor: green 1, blue 1.5, purple 2.5. Heirlooms count as blue.
  - `k` is tuned by sim to the target.
- Where to repair: **Repair all** at any vendor, or a repair kit (vendor, +25%) inside a dungeon.
- Sim proof:
  - repair gold per hour at bot skill 0.5, 0.72 and 0.9, at level 30 and at level 60;
  - levelling is never squeezed.
- Also answers #185 (wipes cost almost nothing).

**Measured (`30c6cad`, `sim/economy.js`, raid-geared level 60, seeds 0–2, 30 runs per cell, k = 80): repairs as % of gold**

| Activity | Player skill 0.5 | 0.72 | 0.9 |
|---|---|---|---|
| Trial 8 | 1% | 1% | 1% |
| Veshmira's Lair, repeat clears | 16% (seeds: 27, 32, 2) | 16% | 9% |
| Dungeon Roulette | 6% | 7% | 3% |

- Your own skill barely moves the bill: a raid-geared player seldom dies, and wipes come mostly from weaker teammates.
- The first target (~20% for an average player) was dropped. Reaching it would take about double `k`, and a group that
  wipes would then lose 50–60% of its gold to repairs, mostly for teammates it didn't choose.
- `k` stays at 80. Repairs are a price on dying; a player who never dies is drained by reagents, the gold chase list and
  Renown instead.

## 2. Consumable reagents (gold)

- Every endgame consumable (level 57+: the flasks and the Well Fed meals) also needs one vendor-only reagent, sold by
  city vendors:
  - **Crystal Vial**: flasks.
  - **Fine Spice**: meals.
- Price: `reagentCost = 250 × item level` (15s at level 60). Keeping a flask and a meal up for an hour costs about 3.75g,
  ~9% of gold income.
- Level-50 stones and armour kits take no reagent: crafters make them to level the skill, and a reagent there would
  squeeze levelling (sim/prof.js caught it).
- The consumable's value rises by the reagent's price, so bots selling it on the auction house include the reagent.
- The consumables' 5% edge is unchanged, and content stays tuned without them.
- Content-proof: the reagent is one field per recipe, picked from the item's kind and level.

## 3. Reforge (Marks)

From the item (the Reforge button next to Upgrade, in the bags and on the character sheet):

- **Reforge effect:** a different effect from those the slot can carry, at the same strength.
- **Reforge stats:** moves the stats around at the same total power, only into stats your class uses (those it gains
  0.8+ of a level, from the class data), so every roll is a real option.
- After either one, you choose **Keep** or **Revert**. The Marks are spent either way.
- Cost: `20 × 1.5^n` Marks, where `n` is that item's own reforge count (20, 30, 45, 68, 101…). A new drop starts at 20.
- The item keeps its power and upgrade level. Total power never passes the ceiling.
- Answers #143 (an heirloom with a random effect) without putting an effect on every alt.

## 4. Renown (Marks + gold): the endless ladder

- An account-wide rank. Rank `r` costs `100 × (1 + r/10)` Marks plus `10g × (1 + r/10)`.
- The price is linear on purpose: every next rank stays reachable, so the ladder keeps draining surplus currency forever.
- Rewards are looks and status only, all derived from the rank number (content-proof):
  - every rank: a wardrobe dye (12 base colours, then shades);
  - every 5 ranks: a title tier, "the Renowned" I, II, III…;
  - every 10 ranks: a mount tint;
  - always: your Renown on your player card, mentioned now and then by bots.
- Pace target: about 1 rank a day at 1 h/day once the chase list is done.

## 5. The chase list

### Mentor Marks (as built)

| Item | Marks |
|---|---|
| Raid set colours: all 26 raid set looks (14 armour, 12 weapons) in 2 Quartermaster colours each, 60 an armour look, 70 a weapon look | 3,360 |
| Quartermaster mounts: 7, 500–900 each, Marks only, any faction, every character, swift | 4,700 |
| Armour heirlooms: chest, legs, hands, feet, 60 each (+XP still capped at 3 pieces) | 240 |
| Existing: heirlooms 370 per account, upgrades ~400 per character, Trialsworn cloaks | ~920 |
| **Total** | **~9,200 (≈10×)** |

Level-60 dungeon set recolours were dropped: those looks are not drawn from a palette, so a recolour would be new art
for every piece. The raid colours carry their share instead.

### Gold (as built, per character)

| Item | Gold |
|---|---|
| Expert Riding at 60: with a swift mount, roads 70% faster | 300g |
| A swift version of the faction's 4 mounts, 75g each | 300g |
| Bank tabs: 3 × 12 slots | 50g + 100g + 200g |
| Existing | ~99g |
| **Total** | **~1,050g (≈10.6×)** |

### Weekly stock

- 3 Quartermaster items a week at 20% off.
- The pick is worked out from the date, and each item has a join date (`since`). Every device agrees, and the pick never
  shifts when an update adds items.

### Art

- Raid colours and Renown dyes: the raid sets' own palette drawings in a new palette (`ART_DYE`).
- Mounts: existing mount drawings re-tinted (`ART_RECOLOR`), so no new drawings.
- Heirloom icons: the existing armour icons.

## 6. Income: raid Marks

- Each raid pays 15 Marks on its first clear of the week, then 5 per repeat (the level-60 dungeon rate).
- Repeating Veshmira's Lair falls from ~228 to ~77 Marks/h, below Trials (~175) and battlegrounds (97).
- Raid loot can still be farmed.
- The new pace for a 1 h/day player is measured in the sim (expected 15–25% fewer Marks a day).

## Build order

1. Raid Marks rule (§6). It is the smallest change, and it sets the income every later target is tuned against.
2. Repairs (§1), with the sim for `k`.
3. Reforge (§3).
4. Renown (§4), with dyes in the wardrobe.
5. Consumable reagents (§2).
6. The chase list (§5): gold items first (no new art), then the recolours, weapon looks, mounts and heirlooms.

Each step ships with a sim that proves its target, and with `node sim/economy.js` re-run on the result.
