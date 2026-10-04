# Realm of Loner

A single-player fake MMO set in its own world, Caldreth: every other "player" is a simulated bot. It's a personal game for Faizal, played on his **Android** phone. It is not channel content and has nothing to do with the Gaming News vault.

## Layout

- `src/` is the game, plain browser JS with no framework:
  - `data/`: the game data, loaded in the order in `data/files.json`
    - `core.js`: classes, races, abilities, gear rules, reward families, shared items (food, junk, starting gear)
    - `zones/<zone>.js`: one file per zone with everything that lives there (`D.zone(...)`, items, mobs, places, NPCs, quests, dungeons, group-finder activities). Links to other zones sit on the places.
    - `zones/legends.js`: Legends (`D.LEGENDS`), hand-made characters with a questline who then join your groups; art in `art_legends.js` (`ART.legend(key)`)
    - `finalize.js`: derived fields that need the whole world (boss-loot sources)
    - `data.js` is only the Node entry point that loads these for sims and tools
  - A new zone = a new `zones/<zone>.js`, added to `files.json`, plus its art pack
  - `engine.js`: combat, DOM-free so it also runs in Node sims
  - `bots.js`: simulated server, chat, catch-up after time away
  - `game.js`: controller for world, quests, loot, group finder, runs and character saves
  - `social.js`: the working chat and guilds (`SOC`): messages with an action (`m.act`: LFG joins, whisper requests, trade, recruiting, guild requests), guild standing and ranks
  - `update.js`: the in-app updater (GitHub releases; the Android side is in MainActivity.kt)
  - `sound.js`, `cutscene.js`, `ui.js`
  - `art.js` (`window.ART`) and `art_story.js` + `art_story2.js` (`ART.story`): all art as SVG strings
  - zone art packs `art_<zone>.js` (one per zone or dungeon, e.g. `art_durotar.js` … `art_dustwallow.js` (Dustwallow Marsh and Onyxia's Lair), `art_moltencore.js`, `art_tidecrown.js`) plus icon packs `art_icons2.js`…`art_icons10.js` (`art_icons3.js` also adds `ART.node` for gathering nodes) and `art_mounts.js`. Each wraps `ART.scene`/`ART.mob`/`ART.icon` and falls through for other keys; each has a render script in `art/<name>/render.js`. A new pack must also be added to the list in `build.py`
  - `data/professions.js` loads after the zones (it adds trainers to hubs and reads place levels)
- `audio/compose_game.py` composes the music and sound effects; `check.py` runs the loudness, spike and seam checks. Music ships only if listed in `audio/approved.txt`.
- `art/render.js` and `art/story/render.js` render contact sheets with `rsvg-convert`. Look at the sheets before shipping art.
- `sim/*.js` are Node balance and playthrough sims (`node sim/group.js`, `node sim/v17.js` …).
- `docs/plans/2026-09-27-roadmap-design.md` is **the roadmap**. Read it before planning anything.
- `docs/design-mindset.md` is **the design mindset**: the player always knows what they are looking at, UI scales, automatic systems are content-proof, choices are real and proven by sim. Read it before designing any screen, label, number or system.
- `docs/lore/canon.md` is **the lore bible**: timeline, characters, what is revealed at which level, and the names the story may use. Read it before writing any quest text, cutscene, Legend or lore page. `node tools/lorekeeper.js` checks all story text against it (spoilers, unknown names, typos, faction slips); `build.py` runs it, and `--selftest` proves each check still fires.
- `app/` is the Flutter WebView wrapper that bundles `assets/game/index.html`.

## Build and ship

```bash
node tools/validate.js   # data check (build.py runs it first and stops on errors)
python3 build.py      # inlines fonts, CSS, JS, audio → dist/index.html and app/assets/game/index.html
cd app && JAVA_HOME=/opt/homebrew/opt/openjdk@17 flutter build apk --release
```

**Version numbers (since 2026-10-04, Faizal):** the major number goes up only with an expansion: v11 is The Ruinfall Saga, Chapter 1, v12 is Chapter 2, v13 is Chapter 3. Everything between expansions is a minor (vX.Y, a feature update) or a patch (vX.Y.Z, fixes). Never reset or go backwards: the in-app updater and Android's build number need versions to keep rising. Players see the update's name first ("The Ruinfall Saga, Chapter 1: The Ashen Coronation"), the number second.

1. Bump `version:` in `app/pubspec.yaml` for every release, and write its notes **first** in `notes/vX.Y.Z.md` (a beta: `notes/vX.Y.Z-beta.N.md`). `build.py` inlines that file as the in-game "What's new" and stops if it is missing; the GitHub release uses the same file: `gh release create vX.Y.Z --notes-file notes/vX.Y.Z.md`, so the updater and the Discord post read the same text.
2. Copy the APK to `~/Library/Mobile Documents/com~apple~CloudDocs/Azeroth Solo/RealmOfLoner-vX.apk`, remove the previous APK there, and confirm `ubiquitousItemIsUploaded` is true.
3. Faizal installs it from icloud.com → Recents on his phone.
4. Publish the browser version: `tools/publish_web.sh` (puts `dist/index.html` on the `gh-pages` branch, served at https://faizal97.github.io/realm-of-loner/). Every GitHub release also needs the APK attached, or the in-app updater won't see it.
5. Push to itch.io with butler (`~/.local/butler/butler`, already logged in), full releases only: zip `dist/index.html` + `dist/music/` and `butler push <zip> starlighthvn/realm-of-loner:html5 --userversion X.Y.Z`, then `butler push <apk> starlighthvn/realm-of-loner:android --userversion X.Y.Z`. Check with `butler status starlighthvn/realm-of-loner:html5` (and `:android`). Page: https://starlighthvn.itch.io/realm-of-loner
6. Announce on Discord, last (after the GitHub release, web and itch.io are live): `node tools/announce_discord.js vX.Y.Z` posts the notes to #patch-notes and pings the Patch Notes role. A beta: `node tools/announce_discord.js vX.Y.Z-beta.N --beta` posts to #beta-builds (only Beta Testers see it). A normal release links players to itch.io, never GitHub. A beta post gives both ways in: Android (Settings → Beta updates) and the browser `/beta/` page on GitHub Pages, the only GitHub link a post may carry (never the repo, its releases or its issues). `--dry` previews; each tag posts once. The webhook URLs are in `~/.config/realm-of-loner/`, never in the repo.
7. Devlog, every full release (Faizal, 2026-10-04: "yes in every release please with no mention"): the Player Team posts the itch.io devlog, then posts its link to Discord #patch-notes with **no role mention** (`node tools/announce_discord.js vX.Y.Z --devlog <url>` once that mode exists; until then a webhook post with `allowed_mentions: {"parse": []}`). Long notes post as several messages with the role pinged only in the first.
8. Pings (Faizal, 2026-10-04): a beta post pings Beta Testers at most once a day (the tool skips the ping if one is logged in the last 24 h); a patch release (vX.Y.Z, Z > 0) posts with no Patch Notes ping; a feature update (vX.Y.0) or expansion (vX.0.0) pings once. `--dry` says which and why. Cadence: one feature update a week (ping + devlog), patches only for real bugs, betas as often as needed.
9. **Patches are web-only by default** (Faizal, 2026-10-04: "Yes"): a patch (vX.Y.Z, Z > 0) is tagged and pushed, goes to the web (`tools/publish_web.sh`) and itch.io html5, with a Discord post (`node tools/announce_discord.js vX.Y.Z --web-only`), and gets **no GitHub release and no APK**, so the Android updater doesn't prompt a 95 MB download. A serious bug (a crash on login, lost saves, permanent loss) gets a full release including Android. The next feature update's GitHub release carries the APK, and its notes roll up the patches Android skipped.

**Release cadence (since v9.9):** people play this now, so batch public releases (about one a week, not several a day); only a real bug fix goes out on its own.
- **Beta:** a test build is a GitHub **pre-release** tagged `vX.Y.Z-beta.N` (`gh release create ... --prerelease --notes-file notes/vX.Y.Z-beta.N.md`), with its APK attached, and pubspec `version: X.Y.Z-beta.N+code`. Publish it to the web with `tools/publish_web.sh --beta` (only the `/beta/` page). Only players with Settings → Beta updates on get it: the app then reads all releases, and in a browser beta is the `/beta/` page (same site, so it shares characters). Not pushed to itch.io; announced with `--beta`.
- **Normal release:** a regular release; `tools/publish_web.sh` updates the main page and also `/beta/` (unless `/beta/` holds a newer test build), so beta is never behind. Then itch.io (step 5) and the Discord post (step 6).

**Cutscene video (MP4):** `art/promo/export_cutscene.sh <chapterId> <out.mp4> [endcard.png]` records any cutscene from `dist/` (run `build.py` first) at 1080 px, 30 fps, with its music. It uses `art/promo/record_cutscene.js` (headless Chrome on virtual time, so frames are exact). Port 8777 only; never touch 8765.

Smoke-test on the emulator (AVD `Medium_Phone_API_36.0`). Its software renderer draws ghost and duplicate layers, which are not real bugs.

## Open threads and bugs (GitHub issues, shared by every session)

- Parked work, open questions and balance threads are GitHub issues labelled `thread`: `gh issue list --label thread`. Check them before planning, file anything you park there (with the numbers you have, facts apart from guesses), and close an issue with a comment saying what was decided.
- Bugs (from a QA session, a player report or a sim) are issues labelled `bug`, with steps or the sim that shows it.
- **Labels:** every issue gets one type and one status.
  - Type: `bug` (broken), `improvement` (make something that exists work or read better), `feature` (new for players), `balance` (numbers and tuning).
  - Status: `status: discussion` (still being decided by Faizal or the game designer) → `status: ready` (decided, the developer can take it) → `status: in progress` → `status: in beta` (built, QA checks it on the beta) → closed (released, or decided against with a comment).
  - Move the status label as the issue moves; `thread` stays on parked dev work as well.
  - **Whose turn:** exactly one `needs:` label. `needs: game designer` (a design decision is waiting), `needs: developer` (build, fix or check), `needs: qa` (test it). Whoever finishes their part moves it to the next one: the game designer decides → `needs: developer`; developer ships a beta → `needs: qa`; QA finds it broken → `needs: developer`, or it works → close it. Each session starts with `gh issue list --label "needs: <its role>"`.
- **Which beta:** the game designer puts each decided issue in a milestone named after its beta (`v10.9.0-beta.6`, `v10.9.0-beta.7` …); an issue with no milestone is not planned for a beta yet. The developer works on the lowest open beta milestone first and ships that beta when every issue in it is fixed on main (`gh api repos/faizal97/realm-of-loner/milestones --jq '.[] | "\(.title): \(.open_issues) open"'`), then closes the milestone. Shipping still waits for Faizal's go, through the Lead.
- The repo is public: nothing private in an issue.

**Roles (since 2026-10-02):** Faizal runs separate sessions, and they talk through these issues, not through each other's chat.
- **Game designer** decides what gets built and how it should play, and in what order: `feature`, `improvement`, `balance` or `thread` issues that say why, the agreed design in `docs/plans/`.
- **QA** plays the builds (beta page, emulator, phone) and files `bug` issues with steps, the build and what was expected; it checks fixes on the next beta and reopens what is still broken.
- **Developer** builds and fixes: takes issues, writes `Fixes #N` in the commit that fixes one (the push to main closes it), runs the sims and the build, and ships betas and releases when the Lead relays Faizal's go. When a beta ships, the developer comments on each issue it fixes with the build tag.
- **Balance Analyst** measures: runs and extends `sim/*.js` and posts the numbers on the issue as tables (comments start "**Balance Analyst:**"; seeded runs, how many, the spread, facts apart from guesses), so the game designer decides from them. It works in `sim/` only (and `tools/` for a sim helper), never `src/`: an engine hook it needs goes to the developer. It commits only its own paths and never pushes; its commits go out with the developer's next beta push. It measures from `~/azeroth-solo-measure`, a worktree detached at main (`git -C ~/azeroth-solo-measure checkout --detach main` before a run; never edited), so unfinished work in the shared checkout can't change its numbers, and each table names the commit it measured. No design calls and no `needs:` label of its own: the Lead hands it the measuring jobs.
- **Player Team** (was Community Team, rescoped 2026-10-02) is the game's voice both ways. Out: it drafts each beta's and release's notes (`notes/vX.Y.Z[-beta.N].md`, written for players, in the game's own names) and commits only that file; the developer checks and ships them. In: it files player feedback (itch.io comments, anything Faizal forwards) as `bug` or `improvement`/`feature` issues after checking for duplicates, with no player names (the repo is public); QA reproduces the bugs and the game designer decides the requests. It also keeps the itch.io page current and writes devlogs, but only for full releases and only when Faizal wants one. Never `src/`; anything public needs Faizal's go, through the Lead. No `needs:` label of its own; the Lead hands it work.
- **Lead** keeps the roles moving: it reads the board (`needs:`, status, the lowest open beta milestone), sets the order of work, messages whichever session's turn it is and reports to Faizal. It builds nothing and makes no design calls. It is the one that confirms with Faizal: before anything players get (a push, a beta, a full release, itch.io, a Discord post or a devlog) it asks him, and it relays his yes quoted word for word. Every role sends the Lead one line when it finishes a step.
- - **Talking to real people (Faizal, 2026-10-04):** in anything a player or community member reads or is replying to (their issues and PRs, replies to them, Discord, itch.io devlogs and comments), write as Faizal: first person, his voice, no role labels ("Developer:", "Lead", "QA", "→ Lead"), no mention of sessions or agents. Team-internal notes stay on team-filed issues.
**Faizal's go goes through the Lead (since 2026-10-02).** Nothing players get (a push, a beta, a full release, itch.io, Discord, a devlog) happens without his yes, and he gives it to the Lead. A role acts on the Lead's relay when it quotes him word for word, without asking him again. A role that wants to ship or post asks the Lead, not Faizal; it never treats a yes for one thing as a yes for the next.

## Rules that matter

- Saves: one per character under `azsolo.char.<id>` plus the index `azsolo.chars`. Keep old saves loading; migrate, never break them.
- Any race can play any class (house rule). Bots are simulated players driven by the game's rules (bots.js, social.js). Since v9.5 they have real social systems (actionable chat, guilds, friends who remember you), but never an online service. Chat that reads like a request must be a real one (`node sim/chatcheck.js`). The on-device AI chat pack was removed in v9.6.1.
- After 60, progression is horizontal (synced power, collections). Every dungeon and raid ships with a first-entry lore intro.
- Sprites use z-index 60–96 inside `.scene`, which is isolated. Layers: `.create` 50 < sheets 55 < dialogs 57 < toasts 59 < cutscenes 60.
