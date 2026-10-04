# Main screen layout: options

**Decided: option A** (Faizal, 2026-10-04, via the Lead: "the layout also yes"), with the seven shared rules, as the
v10.10.1 patch. From QA's layout audit (#64, v10.10.0-beta.8, measured at 375×812 and 412×915), folding in #61
(rank badges unreadable on a phone) and #62 (names cut in the equipment grid and the top bar). Drafted by the game
designer, 2026-10-04.

## The problem in one picture (375×812, a level-60 healer in a dungeon fight, action bar open)

```
┌──────────────────────────────┐
│ Header: you + target   115px │ 14%   half empty out of combat
├──────────────────────────────┤
│                              │
│ Scene                  225px │ 28%
│                              │
├──────────────────────────────┤
│ Chat strip              78px │ 10%
├──────────────────────────────┤
│ Panel                  127px │ 16%   party frames start 184px down:
│  "Blackcloister"             │       0 of 5 visible; a loot roll covers it
├──────────────────────────────┤
│ Action bar, 4 rows     216px │ 27%   grows from 3 to 4 rows as the fight starts
├──────────────────────────────┤
│ Bottom tabs             51px │  6%
└──────────────────────────────┘
```

The ground rules (`docs/design-mindset.md`): the player always knows what they're looking at; the UI scales as
content grows; nothing a fight needs sits below the fold; **a healer sees the whole party.**

## Rules every option keeps (they fix problems on their own)

1. **The action bar never changes height in a fight.** Combat-only abilities (Step Back, the racial) take the slots
   Eat and Drink leave, and the bar reserves its combat row count from the start. Nothing under the finger moves.
2. **The decision comes first in every panel.** A battleground's three objectives, a run's Pull button and pace, and a
   loot roll's Need/Greed/Pass sit at the top of their panel; details and history go below them.
3. **A loot roll is a small card docked above the action bar**, never over the party frames.
4. **Sheets end above the bottom tabs.** The tabs stay visible, so switching from Bags to Hero is one tap.
5. **One word per thing.** The middle button "Quests" (quest givers here) becomes **"Here"**; the bottom tab stays
   "Quests" (your log).
6. **Touch sizes:** the fold handles become 44 px tall touch areas (the drawn handle can stay thin), and "Arrange" is
   in the action bar's long-press menu, not only under Hero.
7. **#61, rank badges:** a tap (not a hover) explains a badge, and badges are drawn at a size readable on a phone.
   **#62, names:** a long name wraps or shortens with "…" and shows in full on tap, in the equipment grid and the top
   bar (the #60 rule: the number keeps its place).

## Option A: trim the bands everywhere (recommended)

The same six bands in the same order, each made smaller. The screen looks the same in every state, so the player
always knows where things are.

- **Header 115 → 64 px:** one line each for you and your target; with no target, your frame spans the width.
- **Scene 225 → 170 px:** the art scales down; sprites stay above 32 px.
- **Chat strip 78 → 34 px:** one line (the newest message); tap to open the full chat.
- **Party frames compact:** five 30 px rows at the very top of the run panel (name, health bar, a mark for your
  target), tap to heal as now.

```
375×812, healer in a dungeon fight, bar open (4 rows)
┌──────────────────────────────┐
│ You ███████  | Target ██████  64px
├──────────────────────────────┤
│ Scene                  170px │
├──────────────────────────────┤
│ chat: newest line       34px │
├──────────────────────────────┤
│ Tank   ████████████  30px    │
│ Healer ██████████    30px    │  panel 277px: all 5 frames
│ Dps1   ███████       30px    │  (150px), then pull / pace,
│ Dps2   ██████████    30px    │  then the rest scrolls
│ Dps3   █████         30px    │
│ [Pull]  Careful Normal Fast  │
├──────────────────────────────┤
│ Action bar, 4 rows, fixed    │ 216px
├──────────────────────────────┤
│ Map Quests Bags Hero Social  │ 51px
└──────────────────────────────┘
```

- **Gain:** about 150 px for the panel in every state (town content 120 → 270 px; a fight 127 → 277 px).
- **What changes on every screen:** the header, scene and chat strip are smaller everywhere; nothing moves place.
- **Risk to habits:** low. The same bands in the same order; only a tap on chat to read more is new.
- **Size:** about 4–6 h of developer work, 1–2 betas. QA re-runs its audit as the proof.

## Option B: a fight layout

Out of combat the screen stays as today; when a fight, a run or a battleground starts, the screen re-arranges:
the scene shrinks to a strip, the header and chat fold into one line, and a **party strip** (5 frames in a row) sits
directly under the scene.

```
375×812, in a dungeon fight
┌──────────────────────────────┐
│ You ███ | Target ███ | chat… │ 40px
├──────────────────────────────┤
│ Scene strip            140px │
├──────────────────────────────┤
│ [T█][H█][D█][D█][D█]   56px  │ party strip, tap to heal
├──────────────────────────────┤
│ Decision: Pull / pace / roll │ panel 290px
├──────────────────────────────┤
│ Action bar, fixed      216px │
├──────────────────────────────┤
│ Tabs                    51px │
└──────────────────────────────┘
```

- **Gain:** the most room in a fight (party strip plus about 290 px of panel); town is unchanged.
- **What changes:** every fight, run and battleground screen; the town screen doesn't.
- **Risk to habits:** medium. The screen changes shape when a fight starts, which is the same kind of jump the audit
  flags for the action bar, only bigger. A player has to learn two layouts.
- **Size:** about 8–12 h, 2–3 betas.

## Option C: the party lives in the scene

Keep today's bands; draw each party member's health bar over their sprite in the scene, and make the sprite the tap
target for heals. The run panel keeps only decisions.

- **Gain:** a healer always sees the party, with no band changes.
- **What changes:** the scene in a run or battleground; the bands don't.
- **Risk to habits:** low for layout, but the scene gets crowded (5 allies, up to 5 enemies, the boss, health bars,
  names at 11–12 px), and tapping a small moving sprite in a fight is harder than tapping a row. It fixes the healer
  but not the 58% problem.
- **Size:** about 5–8 h, 1–2 betas.

## Recommendation: A, with the shared rules

A fixes every ranked problem in the audit at once (the healer, the bar growing, 58% taken before content, decisions
below the fold, sheets covering the tabs, the two "Quests", the small handles), keeps one layout the player learns
once, and is the smallest build. B gives a fight more room, but at the price of a screen that changes shape when a
fight starts, the very thing rule 1 removes from the action bar. C solves the healer only.

**The proof (QA re-runs #64's audit on the build):** at 375×812 with the full bar, a dungeon fight shows **5 of 5
party frames**, a battleground's **3 objectives** and a run's **pace** without scrolling, the action bar's height is
the same before and during a fight, a loot roll covers no party frame, and Bags → Hero is one tap. No Balance Analyst
job.
