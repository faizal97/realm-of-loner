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
  | slam on the target | the whole team | the tank's defensive avoids it; otherwise see *Slams are the team's* |
  | self-heal, a spell cast | anyone | an interrupt or a stun |
  | adds, frenzy, time limit | — | not telegraphed (they stay as they are) |

- **Missed: about 2.5× the hit** (the size is set by the sims, one number per kind). Answered: avoided (an interrupt
  or stun cancels the cast).
- **You are only punished for an answer you have.** If the one who has to answer doesn't know an answer yet (a Warrior
  tank before Shield Wall at 32), the hit lands as it does today. An answer you have that's on cooldown doesn't count:
  saving it is part of the skill.
- **Bots answer by their skill**, with a reaction delay, as they play everything else. A weak draw misses more.
- **Trials keep their numbers**; their telegraphs follow the same rules.

## Slams are the team's

A hit on the tank comes every 8 sec, and most tank defensives have long cooldowns (Shield Wall 180 sec, Divine
Protection 300 sec). The tank alone can answer only a few slams, so the first rule made good groups wipe more
(fitted, below 60: 14% -> 23% of runs with a wipe). The whole team answers a slam instead:

| who | does, during the red bar | the slam |
|---|---|---|
| the tank | a defensive up when it lands | avoided |
| anyone | a shield or a quick heal (instant, or a cast of 1.5 sec at most) on the tank | 1x off |
| anyone | an interrupt or a stun on the boss, one each, 2 at most | 0.5x off each |
| nobody | | 2.5x |

It never goes below 0.5x unless the tank's defensive avoids it. The bar shows its size as it shrinks ("Crushing Slam
1.5x"), each player's own answer glows (a healer's shield or quick heal, everyone's interrupt), and a group with no answer
at all takes the plain hit. The numbers are starting points, set by the sims.

### Each boss's own slam

Every slam keeps the same answers, but each boss names its own (`D.MOBS[key].buster: { style, name, text }`) and picks
one of three styles. Its data can also set any number for that boss alone.

| style | unanswered | kicks that count | bar | feels like |
|---|---|---|---|---|
| crush (the plain slam) | 2.5x | 2 | 2.5 sec | the whole team chips in |
| heavy | 3x | 3 | 3 sec | needs everyone |
| quick | 2x | 1 | 1.5 sec | a reaction check, mostly the healer's |

All three: a shield or quick heal takes 1x off, each kick 0.5x, never below 0.5x.

**Raid slams are braced, not blocked.** With `brace` set, the tank's defensive takes that much off (1.5x) and the slam
still lands. A raid's tank bots cycle their defensives, which avoided 13 of 32 slams. **A warned slam is easier than an
unwarned one:** healers shield and heal the tank before it lands. So each raid slam has a raised floor, set over whole
raids:

| boss | slam | style | unanswered | floor | bar |
|---|---|---|---|---|---|
| Cinderhound | Molten Jaws | quick | 2.5x | 2x | 1.5 sec |
| Magmahulk the Incinerator | Magma Fists | heavy | 3.5x | 2x | 3 sec |
| Commander Serathis | Trident Thrust | crush, can't be interrupted, a shield or heal 1.5x off | 3x | 1.5x | 2.5 sec |
| Coralheart Colossus | Tidal Crush | heavy | 4x | 2x | 4 sec |

**Below 60 so far:** Snowfang's Savage Maul (quick), Skagg Smash (crush), Porkchop's Belly Flop (heavy, 2.5x). The other
slam bosses use the plain crush slam.

On screen, under the bar: a shield pip (a raid tank's brace), a plus (the shield or heal), one diamond per kick that
counts, ringed when full. A steel bar reads "blocked" when a dungeon tank's defensive is up. Floating text says what each
answer did: "Braced −1.5x", "Guarded −1x", "Kicked −0.5x", "Blocked", "Kicks full".

Words said in a fight (a boss's lines, emotes, the group's callouts) also show as speech bubbles over the speaker. A
friend's goes above them, a foe's under its nameplate, and none ever covers a red bar.

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
