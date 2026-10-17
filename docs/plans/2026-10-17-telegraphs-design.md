# Telegraphs (#179)

Boss mechanics, and some open-world casters and elites, warn before they land and have one answer each. Answered,
the hit is avoided; missed, it hits hard. This is what makes skill matter: the difficulty targets
(`docs/plans/2026-10-10-difficulty-targets.md`) want a button-masher to fail far more often than a player who plays well,
and #215 showed no damage number can do that on its own.

## Rules

- **A telegraph is a named cast**, about 2.5 s on a boss (2 s on Hard and in the open world), drawn as a bar over the
  caster and in the target frame.
- **Each kind of mechanic has one answer.** The kind comes from the mechanic's own data, so every boss (and any new
  one) gets its telegraph with no hand work:

  | kind (today's mechanic) | who answers | answer |
  |---|---|---|
  | whirl (a hit around the boss) | every member, alone | Step Back out of reach |
  | breath, group-wide hit | every member, alone | Step Back |
  | hit on a random member | that member | Step Back |
  | slam on the target | the tank | a defensive |
  | self-heal, a spell cast | anyone | an interrupt or a stun |
  | adds, frenzy, time limit | — | not telegraphed (they stay as they are) |

- **Missed: about 2.5× the hit** (the size is set by the sims, one number per kind). Answered: avoided (an interrupt
  or stun cancels the cast).
- **You are only punished for an answer you have.** If the one who has to answer doesn't know an answer yet (a Warrior
  tank before Shield Wall at 32), the hit lands as it does today. An answer you have that's on cooldown doesn't count:
  saving it is part of the skill.
- **Bots answer by their skill**, with a reaction delay, as they play everything else. A weak draw misses more.
- **Trials keep their numbers**; their telegraphs follow the same rules.

## Interrupts (every class, same rules)

Free, instant, 12 s cooldown, learned at level 6. Each class has its own name and icon, but the rules are the same, so
no class is better at it. Stuns a class already has also answer a cast.

| class | interrupt |
|---|---|
| Warrior | Hilt Bash |
| Rogue | Throat Jab |
| Mage | Spellbreak |
| Priest | Hush |
| Shaman | Storm Snap |
| Warlock | Choke Hex |
| Hunter | Pinning Shot |
| Paladin | Stern Word |
| Druid | Thornlash |
| Bard | Sour Note |

Names are checked by `tools/ipcheck.js` and the lorekeeper before they ship.

## On screen

- **An ember-red bar over the caster** with the cast's name and, on its left, the answer's icon (boots for Step Back,
  your interrupt's icon, a shield). Red keeps it apart from your own gold cast bar.
- **The answer's button glows** on the action bar while the bar runs, so you learn which button saves you. Pressing it
  in time is still the skill.
- The target frame shows the same bar, smaller.
- A short sound cue as the cast starts (off with sound effects).
- The first telegraph you see opens a one-time tip: "A red bar is an attack you can answer. Press the glowing button
  before it fills."
- The boss's info rows name each telegraph and its answer ("Cinder Whirl: step back").
- The death recap says what was missed: "Cinder Whirl hit you: you didn't step back."

## Open world

Casters (mobs with a spell school) and elites get the spell kind from about level 10: a 2 s cast answered by an
interrupt or a stun. Missed, it hits about 2× a normal hit. That makes careless questing cost a death now and then
(#269).

## Build, one step at a time

1. Interrupts for every class, and the telegraph in the engine (cast, answer, the hit), with the bots answering by skill.
2. Veshmira's breath becomes the first telegraph; the cast bar and the glowing button on screen.
3. The other kinds are switched on in turn, each measured before the next.
4. The open-world casters and elites.

## Proof

- `sim/difficulty.js`: fitted, masher, undergeared and bad draw against the targets table, for every content type, on
  3 seeds. The masher answers nothing; fitted answers at skill 0.85.
- A fitted player stays inside the #215 numbers (the telegraphs mustn't make good play harder).
- `sim/lvpace.js` with `SKILL=0.3` and `UNDERGEAR=10`: at least 2× the skilled deaths an hour, with skilled play still
  at 2 or fewer.
- A test for each answer, and one that an answer the unit doesn't have never gives the big hit.
