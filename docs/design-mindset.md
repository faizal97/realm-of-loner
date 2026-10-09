# Design mindset

How we design anything the player sees in Realm of Loner. Faizal's rules, collected from what went wrong and what he
corrected. Read this before designing a screen, a label, a system or a number.

## 1. The player always knows what they are looking at

Every number, label, icon and glow has to explain itself, on the screen, without a guide.

- **A number says what it compares with.** "83% strength" was unclear (compared with what?); "−17% health and damage
  (a normal level-60 run is 0%)" is not. "Power 91% of the ceiling" names its ceiling.
- **Every chip, badge and icon has a label or a tap that explains it.** An Omen chip opens its rule and its counter; a
  Trial row says "Best: Trial 7, in time".
- **Every buff and debuff explains itself.** Tapping one (on you, a party member or an enemy) shows its name, what it
  does in plain words ("Attack speed +20%", "Takes 12 Shadow damage every 3 sec"), who put it there and the time left.
  This goes for Omen effects, reactions and Momentum too.
- **Mechanics are told, not left to the description.** Players do not read tooltips. A class reaction gets a glow on
  the button, a callout over the character and a one-time card the first time; the tooltip is the backup, not the
  explanation.
- **Nothing on screen is empty or broken.** No stray "null", no "#1 of 1", no "Upgrade 0/0". If a value can be missing,
  design the empty state ("Not tried yet", "Your first month").
- **Plain words.** Name the thing ("Mentor Marks", "par time"), not the system behind it.
- **Give every fact, never the answer.** Show players all the information they need to plan (enemy health, what a
  boss does, what an Omen changes, what drops) and let them work out what to do. Never recommend or suggest: no
  "this Omen needs X", no "counter:", no "finish it fast". Explaining how a mechanic works ("tap it while it glows")
  is fine; telling them the best choice is not.
- **A disabled button says why.** Never a bare grey: its label or the line under it gives the reason ("Bags full",
  "Need 2g 40s", "In queue for The Smoke Pit", "Learn Riding first"). A tap that can't act says why in a toast, and a
  state known in advance (travelling, dead, unsellable) is shown before the tap.
- **Every action shows its result, and only a real one.** A tap that changes something redraws, toasts or logs it;
  a refused action never shows a success message; an automatic fallback (heals going back to you, a batch stopping,
  an item going to the bank) is announced once; a wait names what it's waiting for; anything with a timer shows it.

## 2. UI must scale

Design every screen for the size it will reach, not the size it is today: after 20 more updates, 5 entries become 50.

- Bounded numbers ("12 of 40", a percentage), never counters that grow without end ("Upgrade 167/170").
- Drill down (a row per group, then a grid), never one button per entry in a row.
- Show the top and the part that matters to you (a leaderboard shows the top 10 and the players around you, not 600).

## 3. Automatic systems are content-proof

Any rotation or pick (seasons, Omens, the featured raid, bounties) must make sense with no, one or many new content
items, and must never change under the player when an update adds something.

- Work it out from the date and the data, so every device agrees and nothing stored can drift.
- Give content a join date (`since`); what a period holds is fixed when it starts.
- Test the three cases (none, one, many new) in a sim.

## 4. Choices are real

A choice the player makes (a counter, a pace, a talent) must clearly beat the wrong one, and a sim must prove it.
If the sim says the "right" answer loses, the design is wrong, not the player.

## 5. Balance is measured, not guessed

Pacing and difficulty targets are written down first, then tuned by sim with enough runs to beat the noise (one bad
run must not swing the answer). Say the numbers and the gaps honestly.

## 6. Our own world

No Warcraft names in anything a player reads (abilities, reactions, talents, places). The lore bible
(`docs/lore/canon.md`) and `tools/ipcheck.js` are the checks.
