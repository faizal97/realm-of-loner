# In-game text style

How words appear inside the game: labels, values, buttons, toasts, the log, tooltips, help. Decided 2026-10-12: our
screens read like documentation (238 sentences in `ui.js` over 60 characters, some over 250). Games say the same
things in a few words and put the long explanation one tap away. This guide sits under `docs/design-mindset.md` §1
("the player always knows what they are looking at"): that rule still holds, only the words get shorter. A label names
what a number compares with, so the number explains itself without a sentence.

## The four layers

| Layer | What it is | Length | Shape |
|---|---|---|---|
| Label + value | rows, chips, counters, fact lists | label 1–3 words, value 1–5 | `Steed: 3/10` |
| Button | an action | 1–3 words, a verb | `Queue`, `Light it`, `Buy` |
| Message | toast, log line, error | one line, ≤ 60 characters | `Not enough Wake Candles (120/320).` |
| Help | tooltip, ⓘ sheet, first-time intro | 1–3 short sentences | only where the rule isn't obvious |

The main screen only uses the first three. Anything that needs a sentence goes to Help: a tap on the row, an ⓘ, or the
first-time intro, never as a paragraph on the screen.

## Rules

1. **Label: value, not a sentence.** `Daily loot: Ready` / `Taken`, not "Not taken today". `Candles today: 40/160`, not
   "40 of 160 (resets at midnight)". Put the reset in the section header once: `Today · resets 00:00`.
2. **Counts as `n/max`.** `3/10`, `Hard looks: 1/3`. Use "of" only in a sentence.
3. **Standard status words**, the same everywhere: `Ready`, `Done`, `Taken`, `Locked`, `Owned`, `Collected`,
   `Requires level 10`, `Resets in 4h`, `Ends in 6d`.
4. **Errors say what's wrong in the game's own short form**, the way MMOs do: `Not enough mana.` `You are in combat.`
   `Bags are full.` `Requires level 10.` Add the number when it helps: `Need 320 Wake Candles (you have 120).`
   No "please", no apology, no second sentence.
5. **Log lines lead with the thing**, past tense, one line: `You receive Wickless Steed.` `+30 Wake Candles (Light the
   Way).` `Lantern lit: 3/5.` Details the player needs again later belong on a screen, not in the log.
6. **Buttons are verbs** and keep their name through the flow: `Buy` → toast `Bought Flicker.`
7. **Tooltips follow the item/ability shape**: name, type line, stats or effect lines (`Use:`, `Equip:`, `Every 8 sec:`),
   then at most one line of flavour in quotes. Mechanics read like numbers, not prose: `Heavy hit: 106–159 every 8 sec.`
8. **Explain once, not every time.** A rule the player needs once (how brawls score, how professions pair) goes in a
   first-time intro or an ⓘ sheet. The screen keeps the label.
9. **Cut**: "you can", "in order to", "please", "this is", parentheses that restate the label, a second sentence that
   describes what the screen already shows.
10. **Same word for the same thing** across screens, notes and the log (`Wake Candles`, never "candles" in one place
    and "tokens" in another). In-game names from `tools/rename_v10.json` and `docs/lore/canon.md`.

## Before → after (from the game)

| Before | After |
|---|---|
| Candles today: 0 of 160 (resets at midnight) | Today · resets 00:00 → `Candles: 0/160` |
| Candles held: 0 (they vanish when Lanternwake ends) | `Held: 0` · ⓘ "Wake Candles vanish when Lanternwake ends." |
| Wickless Knight loot: Not taken today | `Daily loot: Ready` |
| Wickless Steed: Daily kill 0 of 10 (1 in 10 each; the 10th always drops it) | `Steed: 0/10` · ⓘ "10% each daily kill; the 10th always drops it." |
| Every 8 sec (first at 6 sec): hits its target for 106–159 damage. | `Heavy hit: 106–159 · every 8 sec` |
| Get test versions before everyone else. They can have bugs, so please report what you find. If you turn this off, you keep your version until the next normal update. | `Beta updates` · `Get test builds early. They may have bugs.` |
| For the run, the tabs at the bottom are tucked away: the menu button in the strip along the top of the scene opens Bags, Hero, Quests and Social. | `Bags, Hero, Quests and Social are in the ☰ menu during runs.` |

## Checks

1. No paragraph on a main screen: anything over ~80 characters is Help (ⓘ, a tap, or an intro).
2. Every row is `Label: value`; every counter is `n/max`; every button is a verb.
3. Messages fit one line on a phone (≤ 60 characters as a target).
4. Names match the game's (`tools/rename_v10.json`); story text passes `node tools/lorekeeper.js`.
