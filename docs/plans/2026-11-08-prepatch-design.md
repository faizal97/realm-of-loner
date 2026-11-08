# The Ruinfall Saga pre-patch: design

The last v10 release, bridging into Chapter 1, The Ashen Coronation (saga decision 20, `2026-10-03-ossarak-saga.md`;
Chapter 1 in `2026-10-03-ch1-ashen-coronation-design.md`). Decided 2026-11-08.

## Release

- **Target: v10.19.0**, together with the currency sinks (milestone v10.19.0-beta.1, already in beta).
- **Fallback:** if the pre-patch has not passed on `/dev/` by Thursday's freeze, v10.19.0 ships on Saturday with the
  currency sinks only, and the pre-patch becomes **v10.20.0** on the next train. The sinks never wait for it.
- v10.20.0 (or whichever minor carries it) is the last v10. Patches after it are v10.x.y.

## Chapter 1's final names (decided)

- **The Ashen Court**: the Accord's dungeon (Kingsmere Keep on Coronation Day).
- **The Saltpenny Vault**: the Krugar's dungeon (under the Saltpenny house, Rumhook Bay).
- **Cinderpeak Spire**: the raid.

These belong to v11. The pre-patch may name the coronation and the Saltpenny house, but not the dungeons or the raid.

## 1. The campaign: "The notes come due" (endgame only)

- **Who:** characters that have finished The Drowned Crown's last quest **or** cleared any level-60 raid. Everyone else
  sees the event (§3), not the campaign.
- **Story:** with Veshmira dead, Ledger debt notes turn up across the world, signed by no one.
  - **Accord:** the Accord has to ask Thorne to read them.
  - **Krugar:** the Krugar meet Grask.
  - About 5–7 quests per faction, ending with Tamlin's coronation announced and a Ledger note waiting for the King.
- **Saved for v11:** who Kethran Vale really is, the blood debt (the oldest debt), Ossarak, and the Unmoored Reach. The
  campaign may use any level-60 Reveal already in canon, but not these.
- **Rewards:** horizontal only (Marks, a title or a look); no gear above today's ceiling.
- Its text goes through `tools/lorekeeper.js`. New names go into `docs/lore/canon.md`, revealed at 60.

## 2. One new ability per class (#142)

- One per class (10), learned at 60 through a short class quest.
- Each is a sidegrade or a new decision, never more power. It is built for this game's systems (item effects, Omens,
  the party's bots).
- Shipped a train before v11, so it is balanced before v11's content lands.
- **Each ability is decided with Faizal one class at a time**, then proven by sim (`sim/` per class, the difficulty
  targets in `2026-10-10-difficulty-targets.md` unchanged). Bots learn to use it.

## 3. The event: debt collectors (every level)

- Groups of debt collectors appear in the levelling zones, matched to each zone's level.
- Beating them drops **torn debt notes**, traded in for a cosmetic (a title or a look) and a few Marks.
- **Below level 30** they are just "debt collectors": no Ledger name, so the Reveals hold at every level.
- Runs from the pre-patch until v11.0 ships. Its rewards stay earnable the whole time, with no first-week rush.
- Content-proof: spawns come from each zone's level range, not a hand-made list, so new zones need nothing.

## 4. Art and announcements

- **The Ruinfall Saga emblem** debuts here, in What's new, the release banner and the devlog. It needs one contact
  sheet for Faizal's review.
- **"The Ashen Coronation" logo** waits for v11.0.
- Music only if Faizal approves it; the release does not wait for it.

## Not in the pre-patch

The Ashen Court, The Saltpenny Vault, Cinderpeak Spire, the new Cinderpeak area and every Chapter 1 reveal (v11.0 and
v11.1).

## Proof

- `node tools/lorekeeper.js`: every campaign and event text holds its level's Reveals.
- The ability sims: each class's damage, healing or survival within the existing targets, with the ability used well
  and badly.
- The event: a level-10, a level-35 and a level-60 run through a zone with collectors, checking kill time and deaths.
