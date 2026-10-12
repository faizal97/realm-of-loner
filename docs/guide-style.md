# Guide style

How a class guide (`guides/*.md`, shown on the guide site, #231) is written: the official ones and the bar a player's
guide is reviewed against. Decided 2026-10-12 after looking at how Icy Veins and Wowhead class guides are built: a
header with author, patch and date; an overview with strengths and weaknesses; then talents, rotation, stats,
cooldowns and leveling, each answering one question. Ours keep that order but are shorter, because they are read on a
phone, and every number in them is proven from the game's own code.

## Shape

```
---
class: druid                  (a class id players can pick)
by: official                  (or the writer's name)
written: 10.11.0              (the release it was written for)
checked: 10.11.0              (the release it was last verified against)
---
Intro: 2–3 sentences. What the class plays like and which roles it fills. Armor, weapons, resource.

### At a glance
- Good at: 2–3 short lines.
- Watch out for: 2–3 short lines.

### Leveling                  (how to get from 1 to 60 alone: the abilities that matter and when they arrive)
### Before every fight        (buffs and set-up, if the class has any)
### Talents                   (how points work for this class: tree sizes, what can't all be taken)

## Healer / ## Tank / ## Damage   (one tab per role the class can fill, in that order; only roles it really has)
### Quick start               (3 bullets: what to press and what to watch; most readers stop here)
### Stats                     (what each stat does for this role)
### How to play it            (the priority, then reactions, then cooldowns)
### When it goes wrong        (defensives and emergencies)
### Talents                   (which tree first and the few talents that change how you play)
```

- Use only the sections the class needs, in this order. Drop a section rather than fill it.
- One tab per role, named exactly **Healer**, **Tank** or **Damage**. A one-role class still has its tab, so every
  guide reads the same.
- A tab is readable in about two minutes on a phone: roughly 150–300 words.

## Writing it

- **Second person, present tense, plain verbs.** "Keep Rejuvenation on the tank." Not "Druids should consider…".
- **One idea per bullet, at most two lines on a phone.** The reason comes after a colon or in a short second
  sentence: "Cast Barkskin first, then shift: its armor is multiplied while it lasts."
- **A numbered list only for a real order** (a priority: do 1 before 2). Everything else is `- `.
- **Name the level** when an ability arrives after level 10: "[[Quick Mend]] (level 36)".
- **Bold** for the few words a skimming reader needs (a stat name, a talent, a reaction). Not for emphasis.
- No hype and no vague praise: not "amazing", "OP", "must-have". A superlative only when it is measured: "heals the
  most for its mana" is fine because it was computed.
- In-game names only: abilities, items, places and factions exactly as the game shows them (Accord and Krugar, never
  the old names; `tools/rename_v10.json`).
- The words follow `docs/ui-text-style.md` where they overlap: sentence case, numbers as digits, "sec" and "min".

## Links

- Every ability, item, creature, place or dungeon the guide names is a link: `[[Name]]`, or `[[kind/id|Name]]` when
  the name is shared. Link it every time it appears in a list item, once per paragraph in prose.
- Talents and reactions (procs) are not database pages: write them in **bold**. When a talent shares its name with an
  ability, say which: "the **Blade Flurry** talent".
- A link that finds nothing, or more than one page, stops the build; the Write page marks it as you type.

## Numbers: proven, or left out

- Every number and every rule ("can't be used in Bear Form", "stacks", "doesn't crit") comes from the game's code:
  `src/data/` for abilities, talents and reactions, `src/engine.js` for formulas and what is allowed when. Compute
  it with node; don't copy a tooltip.
- Numbers are at level 60 with no gear unless the sentence says otherwise ("at level 30").
- **Stats:** say what each stat does for the role, from the formula ("Agility: 1% dodge and 1% crit per 20"). A strict
  stat order ("Spell power > Intellect > Spirit") only when a sim (`sim/*.js`) shows it; otherwise none.
- **Talents:** say which tree first and why. A full point-by-point build only when a sim shows it beats the others.
- Something that looks like a bug (an ability blocked when it shouldn't be, a talent that does nothing, a tooltip
  that disagrees with the code) is filed as an issue, not written around. The guide describes how the game works
  today and is updated when the fix ships.

## Versions

- `written` is set once. `checked` is raised each time the whole guide is verified again against a release.
- Re-check every official guide on every minor or major release, and a class's guide after any balance change to that
  class. `tools/publish_web.sh` stops a release while an official guide is checked for an older minor version.
- A player's guide follows the same rules and is reviewed against this page before it is approved; once published it
  only shows a warning when it is out of date.

## Checks

- `node tools/build_guide.js --check`: links resolve, and no official guide is out of date.
- `node --test test/guide.test.js`: the site builds and every link on every page resolves.
- Read the guide on the site at phone width (375 px): the tabs, the hover and tap cards, nothing too long.
