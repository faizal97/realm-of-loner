# The Bard as a playable class: design

2026-10-15. Issue #247. Builds on the hidden Bard made for Widya (docs/plans/2026-09-30-widya-bard-design.md,
src/data/bard.js). Decisions were made one at a time; each has its reason so later changes know what they undo.

## In one paragraph

The Bard is a leather caster who heals or deals damage with **songs played on the beat**. Up to two songs play at
once; renewing a song in the last moments of its timer (the beat window) adds a **verse**, and at full verses the song
can be spent as a **Finale**, a burst of damage or healing. The **instrument** the Bard plays sets the rhythm (fast
Drum, standard Lute, slow Horn), and the **talents** change the rules of both, in two branches per tree. It is the
first class whose talents change how it plays rather than add numbers.

## Decisions

### 1. Roles: Healer + Damage
Like the priest, druid and shaman. The damage role gives solo levelling a real option (a healer with two
single-target attacks levels slowly), and the new damage abilities close the ability gap (15 → 23; every other class
has 23 to 25).

### 2. The damage Bard is a caster
Builds on Dissonant Note, Dirge and Requiem, matches how Widya fights, and needs no new melee attacks, step-in rules
or bot AI. The class's identity comes from songs, not from where it stands.

### 3. Weapons: daggers and staves (swords dropped)
Of the hand-made weapons, 30 of 40 staves carry spell power or Intellect, 1 of 27 daggers and 0 of 37 swords. A
caster on swords finds no upgrades and fills its rolls with gear it cannot use well.

### 4. Songs on the beat
- A **combat song** plays for a set time (its length comes from the instrument). Renewing it inside the **beat
  window** (its last seconds) adds a **verse**, up to the instrument's maximum. Each verse makes the song stronger.
- At full verses the song's button becomes its **Finale**: tap it to spend every verse at once in a burst; the song
  keeps playing from verse 1.
- **Up to two combat songs at once** (three with the Medley talent).
- Why: it rewards timing, not tapping speed (docs/design-mindset.md §7), one tap every 8 to 16 seconds per song is
  kind to a phone, and the hold-or-spend choice is a real decision every fight. No other class plays like it.

### 5. A missed beat
- **Renewed too early** (before the window): the song goes on and loses **one verse**.
- **Left to run out**: the song stops and **every verse** is lost.
- Why: bad play costs something without one slip ruining a fight; a stun that makes you miss costs a verse, in line
  with stuns cutting casts short; and the Horn's wide window has something to save you from.

### 6. Which abilities are songs

| Kind | Abilities | Finale |
|---|---|---|
| **Combat songs** (on the beat) | Song of Rest (heal, 4), **Dirge (damage, moved 34 → 4)**, Marching Song (party haste, 6), **Ballad of Blades** (area damage, 16, new) | Rest: a big group heal. Dirge: a damage burst. Marching: a short party haste surge. Ballad: an area burst. |
| **Party buffs** (10 minutes, cast between pulls) | Hearthsong (Spirit, Intellect), Anthem of Stone (armour, Stamina) | none |
| **Ordinary spells** | everything else | none |

- Grand Finale (60) is renamed, since "Finale" now means a song's burst (draft: **Standing Ovation**).
- Why: picking two songs from Rest, Dirge, Marching and Ballad is the choice; a buff on the beat would hold a slot
  for ever. Dirge at 4 gives the damage Bard its song from the start.

### 7. Eight new abilities (15 → 23)

| Lvl | Ability | What it does | Built from |
|---|---|---|---|
| 8 | Sharp Refrain | instant arcane damage, 6 s cooldown | existing `dmg` |
| 12 | Cleansing Verse | removes a poison or curse from an ally | existing `cleanse` |
| 16 | Ballad of Blades | combat song: damage to every enemy near the target | the song system |
| 20 | Intermission | regain 30% mana over 8 s while not casting, 3 min cooldown | existing effects |
| 28 | Shatterchord | 2.5 s cast, a big arcane hit (the damage role's nuke) | existing `dmg` |
| 36 | Stage Fright | one non-boss enemy flees for 6 s, 30 s cooldown | existing `fear` |
| 44 | Mocking Verse | the target takes +8% damage from your party for 15 s | existing `debuff` |
| 52 | Echo | instant: replays your last Finale at half strength, 2 min cooldown | **new rule** |

Names are drafts until `node tools/lorekeeper.js` passes them. Numbers are starting points for the sims.

### 8. The instrument sets the rhythm; you choose its kind
- The Bard has a **ranged slot**, like the hunter's bow, and auto-attacks with its instrument (as casters do with a
  wand shot).
- **The kind is the player's choice**, learned like a stance: **Lute at 1, Drum at 10, Horn at 20**, switched outside
  a fight. The item gives stats only; its picture shows the kind in use.

| Instrument | Song length | Beat window | Verses | Feel |
|---|---|---|---|---|
| Drum | 8 s | 1.5 s | 3 | fast, more Finales |
| Lute | 12 s | 2 s | 3 | standard (Widya's) |
| Horn | 16 s | 3 s | 2, with a bigger Finale | slow, forgiving |

- Instrument drops are **generated** like bows (`G.genGear`, every level, caster stats); a few hand-made ones (Widya's
  questline reward, a raid drop) are special for their stats and art.
- Why: rhythm is a playstyle, not loot luck. All three are tuned by sim to come out even when played well, so the
  choice is feel, not power, and a player who finds the Drum too fast loses nothing by switching.

### 9. Talents: three trees, two branches each
Each tree has a **songs branch** and an **instrument branch**. Tier 1 is small numbers; tiers 2 and 3 change rules;
tier 3 is a one-rank keystone per branch. Each tree holds about **26 points**, so the 51 points at 60 fill about two
trees, never all three: the pairing is the build.

**Battle Hymn (damage)**

| Tier | Songs branch | Instrument branch |
|---|---|---|
| 1 | Rousing Verses (5): damage songs +4% per rank | Taut Strings (5): instrument shot +10% per rank |
| 2 | Lingering Dirge (3): your damage Finale leaves Dirge on every enemy it hits (33/66/100%) | Drumbeat (3): each beat landed on a damage song also strikes the target |
| 3 | Showstopper: after a damage Finale, your next Shatterchord is instant and cannot be pushed back | Syncopation: a beat landed on one song also adds a verse to your other song (once per 10 s) |

**Harmony (healing)**

| Tier | Songs branch | Instrument branch |
|---|---|---|
| 1 | Soothing Voice (5): healing songs and their Finales +4% per rank | Resonance (5): each beat landed gives back 1% mana per rank |
| 2 | Rising Finale (3): your healing Finale heals more the more hurt the party is (up to +15/30/45%) | Heartstrings (3): each beat landed heals your most hurt party member a little |
| 3 | Rescue Note: when an ally drops under 25%, your healing Finale is ready at any verse count (once per 30 s) | Sustain: a song that would run out holds 3 s longer, once per song |

**Tempo (buffs and rhythm)**

| Tier | Songs branch | Instrument branch |
|---|---|---|
| 1 | Rallying Cadence (5): Marching Song's haste and your party buffs +4% per rank | Practised Hands (5): beat window +0.1 s per rank |
| 2 | Second Wind (3): Marching Song's Finale gives the party 10/20/30% of their mana, rage or energy | Fourth Verse (1): songs hold a 4th verse; Finales grow with it |
| 3 | Medley: keep three songs at once | Perfect Pitch: a beat landed in the last 0.5 s of the window adds two verses |

- "Discord" was rejected as a tree name: it reads as the chat app. No tree shares a name with an ability.
- Why: every other class's ~140 talents are passive numbers (src/data/talents.js); the Bard tests talents that change
  how a class plays. The new rule types are written to be reused when the other classes get the same treatment
  (a separate issue once this works).

### 10. Every race can be a Bard
The house rule (any race, any class) has no exception today, and the Bard should not be the first. Real cultures all
have bards; a race can flavour its Bards (trainer lines, a starting tune) without limiting them.

### 11. Lore: war-singers, and the songs the Ledger cannot own
- **Bards of the Long War.** The Accord's **heralds** carried news and orders between armies; the Krugar's
  **drum-speakers** sent word across the steppe by drum. Twelve years into the peace they have no war to sing. Bard
  trainers stand in Kingsmere and Vazhrak.
- **The songs the Ledger cannot own.** In a peace built on debt, the Ledger writes what everyone owes; a bard
  remembers who they were. "The Ledger writes what you owe. We sing what you are." It shares Widya's theme ("Every
  song is somebody's") without sharing her plot.
- Reedsong's Songkeepers are one old village school among many, and **Reedsong is not named to a Bard before 22**,
  so Widya's hamlet stays her story's discovery. The Ledger has no reveal level and may be named from level 1.
- To do: add the heralds, drum-speakers and the trainers to docs/lore/canon.md; lorekeeper checks every line.

### 12. Teaching the class, in layers
The game's first-hour tips start **off** for anyone with a character at level 5+, and those players will roll the
first Bards. So the Bard's teaching is **per character and always shown**, like the reaction cards (`reactionCard`).

1. **The Rehearsal** (level 4, when songs unlock): a short trainer quest against a practice target, in guided steps
   with a callout on the song button: start the song; wait for the gold, tap (a verse); too early (a verse lost);
   three verses, play the Finale. It cannot be failed and goes at the player's pace; the reward is the first
   instrument.
2. **Teaching cards** at first moments, once per character, each with a small picture: first Finale ready, first song
   running out, the second song slot, the Drum (10), the Horn (20), the first Bard talent point.
3. **"How Bards play"**, a visual sheet one tap away (from every card and from a long-press on any song): the song
   timer, the gold beat window, the verse marks, the Finale, and a short animation of one good cycle.
4. **The official guide** `guides/bard.md`: the full reference with diagrams, the three instruments compared and a
   build per tree; every claim checked against the data, as for every official guide.

Why: one long tutorial at level 1 teaches Finales, Drums and talents before the player has any of them. Each lesson
lands when it is useful, and the Rehearsal makes the loop physical before a real fight.

## Still to design

- **The beat on screen** (with the frontend-design skill): the song timer on the button, the gold beat window (the
  same gold that means "use this now"), the verse marks, a ready Finale, the second song. It must read at a glance on
  a phone in a busy fight.
- **Bot rules**: land the beat (a skill-scaled chance, so weaker bots miss as weaker players do, §7); spend a damage
  Finale on a boss under 20% or a pack, a healing Finale when two or more are under half; pick songs by role.
- **Numbers**: song strength per verse, Finale size per instrument, ability costs. Set by sim, not by hand.

## Proof (sims), before the class is pickable

| Check | Target | Sim |
|---|---|---|
| Group clears with a Bard healer | about the same as with a priest healer | sim/group.js |
| Damage Bard in a group | within the spread of the other caster damage roles | sim/classdps.js |
| Solo levelling pace | about the shaman's, for both roles | the solo levelling sim (#4) |
| Instruments | Drum, Lute and Horn within a few % of each other when played well | new: sim/bard.js |
| Skill matters | a Bard who misses beats does clearly worse than one who lands them | new: sim/bard.js |

Seeded runs, the spread with the mean, the commit measured; run from ~/azeroth-solo-measure.

## Build order (one issue each, smallest first)

1. **Engine: songs on the beat.** Song timer, beat window, verses, early-renew and run-out rules, Finale; two song
   slots. Tests first. Uses Song of Rest and Dirge only.
2. **The Bard's kit.** Weapons (daggers, staves), Dirge to 4, buffs off the beat, the 8 new abilities, Grand Finale
   renamed, ranged slot and instrument kinds (Lute, Drum, Horn, as stances) with generated instrument drops.
3. **The beat on screen.** Song button timer, gold window, verse marks, Finale (frontend-design first).
4. **Talents.** The new rule types in the engine, then the three trees; the talent screen shows two branches.
5. **Bots and sims.** Bot song rules, sim/bard.js, the five checks above; tune the numbers.
6. **Playable.** Every race's class list, crest and portraits, bots who are Bards in the world and the group finder,
   starting kit, lore lines and trainers.
7. **Teaching.** The Rehearsal, the teaching cards, the "How Bards play" sheet, guides/bard.md.

Steps 1 to 5 can merge to main with the class still hidden (`hidden: true`), so nothing reaches players until step 6;
step 7 ships with step 6. Widya keeps fighting throughout, and her fights are checked after step 2 changes her kit.
