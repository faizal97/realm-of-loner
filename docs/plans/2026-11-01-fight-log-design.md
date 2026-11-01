# Fight log (#295)

A player who loses a fight can send us everything about it as one text file, so a report says what happened, why,
how, and who caused it.

## Where

- **Deaths** dialog (after a wipe in a run, or your own death in the world): **Share fight log**.
- **Settings → Report a bug**: **Share fight log**, shown only while a lost fight is kept.
- File only, no copy: a Discord message holds 2,000 characters and a summary alone can't show the how. The share
  sheet in the app (the existing save-file channel), a download in a browser. Name like `fightlog-snuffed-road-pull4.txt`.
- Only the fight that was lost, never the whole run (earlier wipes are a count in the header). Kept in memory only,
  never in the save; the next lost fight replaces it.

## The file

Plain text, readable on a phone, overview first:

1. Header: version, app or browser, date, activity, difficulty, pull n/m, wipe count this run, length, how many died.
2. **Group**: you or bot, name, class, role, level, gear score, health and resource, a bot's skill.
3. **Enemies**: level, boss or not, health, the damage multiplier in force (difficulty, level).
4. **What killed us**: each death from the Deaths recap's own data (`G.recapFeed`), so the two never disagree.
5. **Red bars**: per telegraph, started / cut / braced or dodged / mended / no answer (the sim's TELESTAT count); for
   each one that landed unanswered, every member who had an answer and its state when it landed: used, on cooldown,
   dead, out of range, busy casting.
6. **Totals** per member: damage done, taken, healing done, kicks used / available, red bars missed.
7. **Timeline**: every event with its time (hits, heals, casts, interrupts, red bars, auras, target changes).

The in-game Deaths recap stays facts-only and blame-free (#192); the file is a report for us and names bot skill and
who missed which red bar.

## Build

- `src/fightlog.js`, DOM-free (`FLOG`): takes the roster and enemies at fight start, appends the fight's events (capped
  at about 20,000 lines), keeps the lost fight, `FLOG.text()` writes the file.
- Buttons in ui.js through `SAVEFILE.save`; text through the ui-text check (button "Share fight log", toast
  "Fight log saved").
- The Android share sheet's title still reads "Share your save" until the next feature update's APK; the current app
  shares the file as it is.
- `test/issue295.test.js`: a fight lost in Node has every section, an unkicked slam names the right members, deaths
  match the recap, a 3-minute fight's file stays under 200 KB.
