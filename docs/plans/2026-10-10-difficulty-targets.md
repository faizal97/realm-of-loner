# Difficulty targets (design-mindset §7)

Decided by the game designer, 2026-10-10, from the Balance Analyst's measurements on #200 (main 8ad020a). They are the written targets that §7 asks for. Every change to combat or content is measured against them, with the four profiles in `sim/difficulty.js`.

## What the numbers say today

- **The content forgives everything.** In 5-player dungeons below 60, 12% of runs have a wipe; at level 60 and in Normal raids, 0%.
  - The worst profiles still finish most runs clean: 85% for a masher, 89% for an undergeared player.
  - Played 3 levels over the minimum, nothing wipes.
- **The player isn't carrying.** Swapping the player for an average bot leaves the wipe rate unchanged (about 0.19 wipes a run either way).
  - As tank or healer the player puts out about 2× an average bot (gear plus skill); as a Mage, about 0.9×.
- **Bots already make mistakes, and the mistakes fall with skill:** late heals go 0.59 → 0.26 a fight, lost taunts 0.62 → 0.30. The content just doesn't punish them.
- **Bad luck is already common.** Normal-content bot skill has a mean of 0.48 and an sd of 0.18, so about half of all groups have at least one bot under 0.3.

**So the problem is content that forgives too much, not bots that play too well.**

## Targets

Each row is the share of runs with at least one wipe. Under each table, the profiles are measured with `sim/difficulty.js` at the content's minimum level.

| Content | Fitted, well played | Masher | Undergeared (a tier under) | Bad draw |
|---|---|---|---|---|
| 5-player dungeons below 60 | 5–15% | 40–60% | 40–60% | 20–35% |
| 5-player dungeons at 60 | 10–20% | ≥ 60% | ≥ 50% | 25–40% |
| Normal raids | 20–35% | ≥ 80%, or no clear in 3 wipes | ≥ 70% | 40–60% |
| Hard raids and Trials (at your best level) | 35–60% | no clear | no clear | ≥ 70% |

| Content | Fitted, well played | Masher | Undergeared | Bad draw |
|---|---|---|---|---|
| "Wanted" elites with the 2 bots (fights lost) | 3–10% | 20–35% | 20–35% | 10–20% |
| Solo questing (deaths an hour, #153 and #214) | Mage ≤ 3, others ≤ 2 | 2× the fitted rate or more | 2× or more | n/a |

- **The profiles:**
  - **Fitted:** blue gear fitted at level, skill 0.85, and, once #179 ships, answering telegraphs about 80% of the time.
  - **Masher:** one damaging ability, or one heal for a healer, and no answers.
  - **Undergeared:** one quality tier under the content: whites below 60, greens at 60, dungeon blues for raids.
  - **Bad draw:** every bot teammate at skill 0.2.
- **Ordering rule:** fitted < bad draw < undergeared ≈ masher. Good play and good gear shrink bad luck but never remove it.
- **No run should feel hopeless when fitted:** a fitted player clears every Normal in at most 3 wipes in 95% of runs.

## Recommendation: content first, in this order

1. **Ship the death recap (#192) first.** It's in beta.6. Losing must be readable before it gets more common.
2. **Tune incoming damage, by content type, to the table** (a beta.7 candidate, data only):
   - creature and boss damage and health per content type;
   - level-57+ dungeons and Normal raids first, since they're at 0% today;
   - the Analyst searches the multipliers in rounded steps, the way the effect-cost searches work.
3. **Boss telegraphs (#179)** are the skill lever. They are what makes a masher wipe and a fitted player not. Retune step 2 once they ship.
4. **Wipe cost (#185) comes after,** and only once the fitted rates sit inside the table. A fitted player must lose a run's chest in fewer than 5% of runs.
5. **Bot skill spread: no change.** It's already wide enough for bad draws to happen often. The content will now make them cost something.
6. **Player power: no change for now.** Tanks and healers at 2× are gear plus skill, as intended. The Mage's 0.9× goes with the class work in #195 and #214.

## Guardrails
- **The living server (v10.11) doesn't change how bots play content.** These targets change the content, not the bots.
- **Every step is measured on the four profiles before it ships,** and the sims gate it with the #45 two-stage rule.
