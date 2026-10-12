# Devlog style

How an itch.io devlog for Realm of Loner is written and posted. Decided 2026-10-12 after looking at how game teams
write update posts: Factorio's Friday Facts, Deep Rock Galactic's patch posts, Team Cherry's and ConcernedApe's update
announcements, Steam's Major Update guidance and indie devlog guides. The release notes (`docs/release-notes-style.md`)
are the complete list. The devlog tells the story of the update: what it is like to play now, and why. It links to the
notes and doesn't repeat them.

## When there is one

- A feature update (vX.Y.0) or an expansion: yes, as a **Major Update** post.
- A patch (vX.Y.Z): usually no. If it changes something players will want to read about, a short **General update**.
- Claude recommends one per release from its changes, and Faizal decides.

## Shape

```
Title: The update's name (vX.Y.Z)       e.g. "The Lanternwake Update (v10.13.0)"
Cover: the update's banner              (art/promo/devlog_banner.js, 1920x1080, every list crops it to 16:9)

Hook: 1–2 sentences, the biggest change in plain words. It is the preview in feeds.

## <Feature, by its in-game name>       2–4 of these, the update's headline features
1–3 short paragraphs: what it is, how you meet it in the game, one line of why.
One image right after the heading, with a caption saying what the player is looking at.

## Also in this update
4–8 bullets for the smaller things, each one line.

The full list of changes is in the patch notes: <link to the GitHub release or the in-game What's new>.

## What's next                           1–2 lines: a direction, never a date or a promise.

One ask, then sign off as Faizal.
```

- **Length:** a major update reads in about 3–4 minutes on a phone (roughly 400–900 words) with 3–6 images. A General
  update is 2–5 lines and a link.
- **Paragraphs** are 1–3 sentences. **Headings** name the feature ("The Snuffed Road"), never a category ("New
  Content").
- **Images:** phone screenshots of the live game (390x844 @3x, `art/promo/shots.js`), stills for art and screens.
  Every image says what you see in its caption. Run the spoiler guard (`G.nameable(line, 1)`) on every visible line.

## Voice

- **Faizal, first person, plain and specific**, with some personality: a solo developer telling players what changed in
  their world. "I", not "we".
- **Why** only for big or debated changes (a nerf, something taken away): one or two sentences, not a design essay.
- One honest line when something went wrong ("Rupture was doing full damage at one combo point; that's fixed and its
  numbers came down to match"). No long apologies.
- **Never:** hype words ("epic", "massive", "game-changing"), dates or features that aren't certain, pasted patch notes,
  issue numbers, sims or tools, the word "beta" for a live release, and never credit a change to a player or to
  feedback (describe the change itself).
- In-game names only (Accord and Krugar, Spirit of the Hawk; `tools/rename_v10.json`), lore names from
  `docs/lore/canon.md`.
- Dates that matter to players stated plainly, e.g. a festival that starts later.

## The ask

One per post, the same few: come to the Discord, tell me how a named feature feels, or try something specific. Never a
list of asks.

## Posting (itch.io)

1. Draft the text and the banner; Faizal reads both and says yes before anything is posted.
2. Claude in Chrome: itch.io → Dashboard → Posts → New devlog → Realm of Loner. Type: **Major Update** for a feature
   update or expansion, **General update** otherwise. Faizal logs in himself.
3. Banner as the **Cover image** (`post[cover_image_id]`), images in the body at `width="320"` so phone shots stay
   readable. Keep only the current version's zip and APK attached.
4. Save unpublished, read the draft, then tick Published and Save. Chrome's tab must be in front or Save hangs.
5. Post the devlog link to Discord with no ping: `node tools/announce_discord.js vX.Y.Z --devlog <url> --title "<name>"`
   (`--dry` first).

## Checks before it posts

1. The hook says the biggest change in 2 sentences or fewer.
2. Each feature section has an image with a caption, and no paragraph is over 3 sentences.
3. No hype words, no dates beyond what is certain, no player-feedback credit, in-game names only.
4. It links to the full notes and ends with one ask.
