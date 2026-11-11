# Season's Finest (best in slot, by season)

Decided 2026-11-12. Ships first in v10.19.0 (the pre-patch) as Season 1.

## Why

After 60 progression is horizontal: Mentor Marks bring any level-60 blue or purple to the ceiling, so "best" is the best
stat mix and effect for a class and role, not more power. Spreading those pieces over new and old content gives every
role a reason to run old raids and dungeons. Each season is planned by hand.

## Rules

- **Two tiers per slot, per class and role.** **Best**: mostly the newest raid, some newest dungeons. **Next best**: old
  raids (need Mentor Marks for full power) and old dungeons, a wide pool. A role's list only has slots with a real piece.
- **Add, never move.** A season never changes where an existing item drops. A new season adds new Best pieces; last
  season's Best becomes this season's Next best.
- **Season 1 uses existing items only**, so item power and the balance sims do not change. New items come in later
  seasons, proven by sim (Best about 2-4% over Next best after Marks).
- **The page** (Hero → Season's Finest), per role: every slot listed with its state, **Found** (owned), **Seen** (looted,
  in someone's gear, on the auction house: shown in a tooltip) or **Unknown**. An Unknown slot has **Hint** (names the
  place) and then **Reveal** (names the item, boss and drop chance). Nothing is behind a setting or a cost.
- **Found blind.** A piece found before Hint or Reveal on its slot gets a Found blind mark. Every **Best** piece of a
  role found blind gives the season's title (Season 1: "Pathfinder of the Tides"). Cosmetic only. Missed seasons stay
  as empty rows, never earned late.
- **A crest** on any Season's Finest piece wherever it is shown, so it is recognised on sight.
- **Visible:** a This week banner in the launch week ("Season's Finest begins", Go opens the page) and a progress step
  while the season runs.
- **Seasons are data** (`D.FINEST_SEASONS`), each with its dates, title and picks; nothing hard-codes a season, so a
  season with no new raid, or many, still works. Season 1 runs until Chapter 1.
