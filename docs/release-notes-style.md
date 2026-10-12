# Release notes style

How `notes/vX.Y.Z[-beta.N].md` is written. The same file is the in-game "What's new", the GitHub release, the Discord
post and the start of a devlog, so it is written once, for players, in the format games use. Decided 2026-10-12 after
comparing our notes with Hades, Stardew Valley, Deep Rock Galactic and WoW: ours read as prose; game notes are short
bullets under category headings, each starting with a set verb.

## Shape

```
<one line: what kind of build this is, only for a beta>

**Highlights**
- 2 or 3 lines: the biggest things. Most players read only this.

**New Content**
- Added ...

**Changes**
- X now ... / X no longer ...

**Balance**
- **Name**: cooldown 10 → 8 sec.

**Interface**
- Added ... / ... now shows ...

**Bug Fixes**
- Fixed ...

**Known Issues**
- ...
```

- Use only the sections the build needs, in this order. A patch is usually just **Bug Fixes**.
- Headings are nouns (categories), never sentences. A big update may split New Content by area (Zones, Dungeons,
  Classes, Professions, Festivals) as Hades does.
- A beta's first line stays: `Test build. On Android, turn on Settings → Beta updates; in a browser, play it on the beta page.`
- A feature update's Android notes roll up the patches Android skipped: a **From earlier patches** section at the end,
  Bug Fixes only, newest first.

## Bullets

- **One line each.** If it needs a second sentence, the second sentence is probably interface detail the player will see
  in the game: cut it.
- **Start with the verb**, past tense for what we did, present for how it works now:
  - `Added` new things · `Fixed` bugs · `Increased` / `Reduced` numbers · `Removed` things that are gone
  - `<Thing> now ...` / `<Thing> no longer ...` for behaviour changes
- **Bold the game's own names** the first time in a bullet: items, abilities, zones, dungeons, NPCs, titles. Use the
  names players see (`tools/rename_v10.json`), never internal keys.
- **Numbers as before → after**: `**Shadow Bolt**: damage 40 → 46.` `Daily cap: 100 → 160 Wake Candles.`
- **Fixes say what broke, where**, so the player who hit it knows: `Fixed taking a stack out of a full bank deleting it.`
  Never "various fixes" or "stability improvements".
- **Why** goes in an optional developer note under the bullet, in italics, one or two sentences, written as Faizal:
  `*Dev note: groups at 60 wear raid gear, so the Knight now keeps up with them.*` Use it for balance and anything that
  takes something away; skip it otherwise.
- No issue numbers, commit hashes, file names, sessions, sims or test names. No "we're excited".
- Second person sparingly ("you can now ..."); most bullets don't need a subject.

## Example (v10.13.0-beta.1, as it should have been)

```
Test build. On Android, turn on Settings → Beta updates; in a browser, play it on the beta page.

**Highlights**
- New festival: **Lanternwake**, 24 October – 7 November every year (on now in the beta).
- New 5-player run: **The Snuffed Road**.
- New rewards: a look set, a companion, a mount and a title. No power.

**New Content**
- Added **Wake Candles**, from kills, quests, dungeon bosses and **Light the Way** (up to 160 a day).
- Added **Wakekeeper Ondine** to every town with a profession trainer.
- Added the **Lanternwake Robe**, **Trousers** and **Wakelight Lantern** (looks only).
- Added **Flicker**, a companion that follows you.
- Added the title **the Lantern-Bearer**.
- Added **The Snuffed Road** (5 players, levels 10–60, fought at your level), with **Hard** after one clear.
- Added the **Wickless Steed**: the **Wickless Knight** can drop it each day; the 10th daily kill always does.

**Interface**
- Added **Hero → Journey → Events**.
- Added the event lantern: today's festival progress, on every screen. Drag it to either edge or hide it in Settings.

**Known Issues**
- Rewards earned in the beta are removed in the live game and when the real festival starts.
```

## Checks before it ships

1. Highlights fit in 3 lines; every bullet is one line.
2. Every bullet starts with a verb from the list, or `<Thing> now` / `no longer`.
3. Every name is the in-game one (`tools/rename_v10.json`), and lore names are in `docs/lore/canon.md`.
4. `node tools/announce_discord.js vX.Y.Z[--beta] --dry` fits (a part's description is at most 4096 characters).
