# Season's Finest (best in slot, by season)

Decided 2026-11-12. Ships first in v10.19.0 (the pre-patch) as Season 1.

## Why

After 60 progression is horizontal: Mentor Marks bring any level-60 blue or purple to the ceiling, so "best" is the best
stat mix and effect for a class and role, not more power. Spreading those pieces over new and old content gives every
role a reason to run old raids and dungeons. Each season is planned by hand.

## Rules

- **Two tiers per slot, per class and role, and every list full.** Each class role, for each faction, has a **Best** and a
  **Next best** piece in every slot its class uses (ranged only for a hunter's bow or a bard's instrument), so both tiers
  always hold the same number of pieces (`tools/validate.js` fails otherwise). **Best**: some of the newest raid for every
  class role, the rest spread over older raids and dungeons, at the newest raid's power. **Next best**: old raids (need
  Mentor Marks for full power) and old dungeons, a wide pool.
- **Add, never move.** A season never changes where an existing item drops. A new season adds new Best pieces; last
  season's Best becomes this season's Next best.
- **Season 1 adds pieces to fill every list** (52, stats only, no effects; first planned for later seasons, brought
  forward because existing items left each role 5-9 of its 9-10 slots, and left a warrior's tank and damage lists, and a
  priest's healer and damage lists, the same). The picks Season 1 had stay unless a role-fit Best piece beats one for
  that role; the new pieces fill the rest (`tools/finest_pick.js` keeps the kept picks and fills from items with
  `finest: <season>` and `tier`). Power: a Best piece is made at its family's ceiling (its family's newest-raid piece,
  `G.upgradeRef`); a Next best piece at the share its place's own drops start at (old raids 90% as purples, old dungeons
  80% as blues). Season pieces never set or move a ceiling, so no older item's Mentor Mark ceiling changes (a family
  only season pieces have, the level-60 instrument, takes its Best piece). Best over Next best after Marks, by the
  role's own item score with an effect's stats counted back: about 2.5% mean (3.9% over slots with no effect on either
  piece). Both factions' new pieces come from places either side can enter, so the lists stay equal in power.
- **The season roll.** Season pieces are never added to a boss's loot table, so no existing drop chance falls. Each boss
  kill rolls its table exactly as before, plus one season roll (`D.FINEST_ROLL`: a chance per kind, dungeon or raid)
  that draws one piece from that boss's pool: the pieces the live season's lists name that drop there (its table or its
  `finest` list). A past season's piece no live list names stays in the roll at a small fixed share (`retired`, 10%;
  at a boss with only past pieces the roll keeps just that share), so it never fades out and never dilutes a table. The roll's piece goes to the group's loot roll like any drop, and
  Reveal shows a piece's real chance per kill (its table and the roll together). Season 1 sets both kinds to 1: one roll
  can give at most 1 in its pool per kill, which is already under a table piece's chance today (raid bosses: a roll
  piece 20% median against 40%; dungeon bosses 50% against 100%, `node sim/finestroll.js`), so any lower chance only
  moves further from it. No random number is drawn when a boss has no pool, so content below 60 rolls as before.
- **The page** (Hero → Season's Finest), per role: every slot listed with its state, **Found** (owned), **Seen** (looted,
  in someone's gear, on the auction house: shown in a tooltip) or **Unknown**. An Unknown slot has **Hint** (names the
  place) and then **Reveal** (names the item, boss and drop chance). Nothing is behind a setting or a cost.
- **Found blind.** A piece found before Hint or Reveal on its slot gets a Found blind mark. Every **Best** piece of a
  class role found blind gives that role kind's title for the season, three per season (Season 1: the Tideward, the
  Tidemender, the Tidebreaker), so another role is worth playing. **Pathfinder** counts every class role finished
  blind on the account, a crest per class role in its class colour, so another class is too. Kept in the account file
  and merged by cloud save. Cosmetic only. Missed seasons stay as empty rows, never earned late.
- **A crest** on any Season's Finest piece wherever it is shown, so it is recognised on sight.
- **Visible:** a This week banner in the launch week ("Season's Finest begins", Go opens the page) and a progress step
  while the season runs.
- **Seasons are data** (`D.FINEST_SEASONS`), each with its dates, title and picks; nothing hard-codes a season, so a
  season with no new raid, or many, still works. Season 1 runs until Chapter 1.
