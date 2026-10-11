# Realm of Loner lore bible

This is the single source of truth for the game's story: the world of Caldreth and its story, **The Black Ledger**,
plus the Legends and the Drowned Crown expansion. Read it before writing any quest text, cutscene, Legend or lore
page. Since v10 the world is our own: no Warcraft names, people, places or history. `tools/ipcheck.js` (run by
`build.py`) fails the build if a Blizzard name comes back, and `tools/rename_v10.json` holds every old → new name.

> All text is original. The game grew out of a fan project; the fan notice stays in the game and the README.

`node tools/lorekeeper.js` checks the game's text against this file, and `build.py` runs it on every build. It reads
two sections by their headings, **Reveals** (a table) and **Names** (a list), so keep those headings and formats as
they are. The Lore Journal's pages live in `src/data/lore.js` (story and Legends), `lore_places.js` (dungeons and
zones), `lore_books.js` (books) and `lore_quests.js` (quest stories).

## Voice and style

- Plain, short sentences. Say what happened, then stop. No purple prose.
- Narration (cutscenes, lore pages) is serious and a little weary. Characters may be dry, bitter or funny; the narrator is not.
- Quest text is spoken by the quest giver, in their voice, and ends with what to do: "Kill 8 of them and bring me a seal."
- Simulated players in chat are exempt: they talk like players. Chat must still never name a secret before its level (see Reveals).
- Numbers in lore are written out below ten ("five years ago"), digits in quest goals ("Kill 12").
- British spelling in lore text (armour, travellers), matching what is already written. Proper names keep the game's spelling (Gullhaven).

## Premise

Twelve years ago the **Long War** between the **Accord** (humans, dwarves, gnomes, wood elves) and the **Krugar** (orcs,
trolls, hornfolk, the Reclaimed) ended in exhaustion. Both sides rebuilt on borrowed gold. The lender was the **Black
Ledger**, a guild of brokers and collectors with an office in every city and a debt in every house. It lent to
farmers, towns, dwarf lords and to the crown of Kingsmere itself. Nobody has met its master.

The master is **Veshmira**, a black dragon of the Black Brood, who lends her hoard instead of sleeping on it. She does
not want to rule the Accord. She wants to own it. Her voice at court is **Lady Meriel Thorne**, the crown's Mistress of
Coin: a human, and a true believer, who thinks debt is the only honest bond. The crown's whole debt falls due on the
day Prince Tamlin is crowned.

The Krugar's story runs alongside. They have their own enemies (the Hollow Eye, the Hollow Host, the Order of the
Pyre), but they borrowed too, and "whatever banner you fly, the Ledger holds your debts".

## Timeline

Years are counted back from the start of the game.

| When | What happened |
|---|---|
| ~10,000 years ago | The Heartfire bursts (the Drowning). The Starborn city of Sael'anor sinks. Prince Aeldran bargains with Nal'veshra, the Deepmother, to keep his court alive under the sea. The Wavebreaker trolls and their sea spirit Shal'zua sink with the isle. The wood elves' moon temple on the Elderglen coast is swallowed (the Tidehollow Deeps). |
| Long ago | The Briarmother, a spirit of the thorns, lies down to sleep under the southern Scrublands; the Thorn Warrens grow from her roots. A centaur khan breaks the oldest law of Mournwaste (take nothing from under the ground) and digs into the Gemfall Caves; Ghesra, the Stone Duchess, buries his tribe and her anger has poisoned the land ever since. |
| Long before the Long War | The black dragon Ossarak tears the world open. The Kinloch elves call him the Black Ruin. He is driven off, never destroyed. |
| ~12–20 years ago | The Long War between the Accord and the Krugar. |
| ~12 years ago | The war ends. Everyone rebuilds on Ledger credit: Kingsmere's walls, Longfield's farms, the Slagborn empire, Blackwell's shipyard. Grask leads the orcs to Dunescar. The plague takes Wexmoor, the Hollow Host rises, the Order of the Pyre forms, Cairn makes werewolves of Needlewood, and Graymouth's lord bars its gates with the living inside. |
| 7 years ago | Lyveus Cloveus defends a Kingsmere caravan near Silverleaf Lodge and the Light wakes in him. He joins the Kingsmere guard and meets Vyn. |
| 5 years ago | Lyveus overhears a circle of nobles plot to sell the kingdom's soldiers to pay a master they have never met. He is condemned; Vyn fakes his death. |
| ~10 years ago | Reedsong, a Sylari hamlet on Lake Aurel in Elderglen, borrows from the Black Ledger to rebuild its jetties after the war. |
| Last autumn | Reedsong's harvest fails. The Ledger's collectors take the Songkeepers' lute "on account", and its appraiser, Harrowby, splits it to sell in pieces. |
| 2 years ago | The cabal learns Lyveus is alive. Silverleaf Lodge burns with his kin; the world is told bandits did it. It was Lord Cassius Marrow. |
| Last winter | King Rhodric Aldane dies. Lord Regent Edmund Carrow rules until Prince Tamlin comes of age. |
| During the game | The Grey Hoods take Longfield's farms (10–20); Marshal Hale follows the warm coins to Cinderpeak and disappears (30); he is alive in the Slagborn cells (40–50); he walks free with Lyveus, exposes the debt, and Veshmira comes to collect and is beaten back (60); she flees to her lair in Saltmarsh and her storm hides the Stormveil Isle (60); her death breaks the storm (expansion). |

## The main story, by chapter

What the player knows at each point. Nothing later may be stated earlier (see Reveals). Warm coins, claw marks and
whelps guarding the Ledger's strongboxes are hints; that the Ledger's master is a dragon is revealed at 60.

- **Prologue (1), "The Borrowed Peace".** The truce and the borrowed gold; King Rhodric's funeral; the Regent and his Mistress of Coin ("Every stone of this city was bought on credit"); Blackwell collecting in Longfield; the Slagborn digging toward something vast that sleeps in the fire; a voice in the dark: "A kingdom in debt is a kingdom for sale."
- **Chapter 1 (10), "Debts Come Due".** The Grey Hoods take Longfield's farms and keep them. Thorne: "The law is the law, and a debt is a debt." Blackwell loads the seized grain into ships. The Farmers' Watch gathers at Warrick's Rise.
- **Chapter 2 (20), "The Collector's Fleet".** Blackwell's ruin (a shipwright who lost his yard to one note). The fleet in the Smugglers' Deep; the Ledger pays in warm coins stamped with a claw. Nobody asks where the grain goes.
- **Chapter 3 (30), "The Audit".** Black whelps guard Ledger strongboxes in Stoneharrow. Marshal Hale, once the crown's auditor, follows the coins through Dunmore Valley and Greenfen (the Wyrmchain paid to breed drakes) to the Ledger's vault in Cinderpeak Spire, goes in to audit it and does not come out. Thorne's accounts say he fled with crown funds.
- **Chapter 4 (40), "Cinderpeak Rising".** The Slagborn borrowed to rebuild and pay by digging toward Vulcarn. Lord Kethran Vale keeps the Ledger's vault in the Spire, guarded by the Cinderpeak orcs. Hale is alive, in chains.
- **Chapter 5 (50), "Balancing the Books".** Hale has counted every warm coin to one purse; the Emperor keeps his notes. The coronation is set, and the Regent signs what Thorne writes.
- **Chapter 6 (60), "The Creditor".** Hale walks free with Lyveus and reads his notes to the court. Thorne denies nothing and hands over the deed: the kingdom is already sold. Veshmira comes for her collateral, is beaten back, and flies south to her lair in Saltmarsh with Thorne. A storm closes over the sea behind her; land appears where none has been for ten thousand years, but no ship can reach it while she lives.
- **The endgame raids (60).** *Veshmira's Lair*: the Accord from Harborwatch and the Krugar from Mudwall Village hunt the creditor in the Dragonmire. Her death breaks the storm and opens the expansion. Behind her nests the players find Thorne, still writing; she gives herself up without a fight, is taken to Kingsmere Gaol among the debtors she put there, and names Lord Kethran Vale as Kethriax, Veshmira's eldest, who keeps the Spire and waits to inherit ("The Mistress of Coin", played before "The Drowned Crown"). The Spire stays shut: Kethriax is set up for later content. *The Magma Throne*: with Emperor Grimmark dead in Cinderpeak Depths, nothing keeps Vulcarn asleep; players go down beneath the mountain to face the King Below and his Steward.
- **Expansion (60), "The Drowned Crown".** Opens when Veshmira dies and her storm breaks. The Stormveil Isle: Sael'anor and its prince, the drowned Wavebreakers, and beneath them Nal'veshra. The Accord lands at the Tidewatch Coast (from Gullhaven, on Brineholt ships with Admiral Vane); the Krugar at the Skullreef Isles (from Camp Skarn with Mazu).

### Dungeon intros (first entry)

Each one sets up the dungeon only, and ties in the Ledger only where it touches the place: the Smugglers' Deep
(Blackwell's fleet), Kingsmere Gaol (debtors as well as thieves), Cinderpeak Depths (Grimmark's debt), the Blackcloister
(the Varga family's mortgage). Graymouth says the Grand Crusader "is not what he seems" and no more. Veshmira's Lair
may name her as the creditor, since it opens at 60.

## Characters

### The Black Ledger

- **Lady Meriel Thorne.** Mistress of Coin at the Kingsmere court. Human. Patient, precise, never cruel for its own sake. Believes a debt is the most honest promise there is. Never says who the Ledger answers to before 60. Her end: she surrenders in Veshmira's lair, keeps her word to the last ("It is the one thing I never sold.") and sits in Kingsmere Gaol.
- **Veshmira of the Black Brood.** The Ledger's creditor, a black dragon who lends her hoard. Speaks of owning, not ruling ("I do not want your little kingdom. I own it."). Unnamed before 60.
- **Corvin Blackwell.** Captain of the Grey Hoods. A ruined shipwright working off his debt by collecting everyone else's. Tired, not evil; stopped asking questions long ago.
- **Lord Kethran Vale.** Keeps the Ledger's vault in Cinderpeak Spire. Cold and practical ("A burning mountain is a cheap mine."). There is more to him than he shows (see Reveals): he is **Kethriax**, Veshmira's eldest son, in human form. Thorne gives him away at 60. He has not been fought yet.
- **Lord Cassius Marrow.** A Kingsmere noble deep in the Ledger's debt; his seal is on the cabal's orders, his gold goes through Sirocco to the Slagborn, and he burned Silverleaf Lodge. Killed at level 60 at the grove where Lyveus took his oath.

### The crown and its people

- **Lord Regent Edmund Carrow.** Honest, overworked, too trusting of his Mistress of Coin. Believes Hale in the end.
- **Prince Tamlin Aldane.** The boy king-in-waiting. Seen, rarely heard. His coronation is the day the debt falls due.
- **King Rhodric Aldane.** Died last winter. Buried in Kingsmere; not a mystery.
- **Marshal Gideon Hale.** The crown's auditor before he was a soldier. Stubborn, brave, counts everything. Wrongly called a thief.
- **Emperor Haldor Grimmark.** Rules the Slagborn from the Anvil Throne. Borrowed to rebuild his empire and pays by digging; holds Hale's notes.
- **Vulcarn, the King Below.** Asleep in the sea of fire under Cinderpeak Depths until the digging wakes him.

### Legends and the expansion

- **Lyveus Cloveus, the Exiled Knight** ("Lyv" to friends). A wood elf paladin from Silverleaf Lodge in the Kinloch Highlands, once of the Kingsmere guard. Quiet, dry, patient; "They made me a ghost. Ghosts keep watch." Created by a friend of the developer and adapted for Caldreth.
- **Vyn.** Lyveus's friend from the guard, a human farm boy who rose with him. Faked Lyveus's death. Now writes from Coppergulch.
- **Widya, the Songkeeper's Daughter.** The second Legend (levels 22-40), a wood elf bard of Reedsong on Lake Aurel. Warm, stubborn, funny, a little vain about her voice; sings when she is scared. Created by a friend of the developer and adapted for Caldreth. Her story is small on purpose: she wants her people's songs to live. Reedsong keeps every family's story in a song, and all of them are played on one lute, its neck carved with the name of every Songkeeper who played it. The Ledger took it for the hamlet's debt; she wins it back piece by piece (the silver strings from the Briarpelt bearkin, the heartwood pegs from Harrowby's strongbox, the carved neck at a trophy auction in Wexley's Expedition in the Vinewild, won in a singing contest, the body from Harrowby at Highhold Keep in the Kinloch Highlands). At 40 Harrowby gives the body back when she plays Reedsong's song. The debt is not paid: that is the main story's to settle. She carves her own name on the neck. Her later chapters (the Songbook) follow her want, not the fate of the world. "Every song is somebody's. I'm only keeping them warm."
- **Harrowby.** The Black Ledger's appraiser: a tired clerk who prices what people lose. Split Widya's lute because it sold better in pieces. Once lost a village of his own to a debt; that is why, at the end, he lets the lute go. Not a villain; a man who stopped arguing with the ledger.
- **Bromli Beerhammer, the Unsung.** The third Legend (levels 44-55), a mountain dwarf warrior of Keldrun. Loud, brave, generous, vain about exactly one thing: he has fought in every war and every tavern brawl in the land, and nobody has ever written a song about him. Wears gold-rimmed sunglasses he will not explain. He goes after the most famous beasts and bullies of the south for a ballad: Old Duneback, the sand giant of Sirocco; King Stomp of Greenmaw Crater; Thudd the Unbeaten of the Smokebelly fire pit. He falls off all of them. Widya writes The Ballad of Bromli Beerhammer (a Songbook chapter), which is mostly about him falling off things, and he has never been happier. Created by a friend of the developer and adapted for Caldreth. Not part of the Ledger story; he never learns what it is, and does not ask. "Write that down. No, the part where I won."
- **Prince Aeldran Tidecrown.** Starborn prince of Sael'anor. Kept his court alive for ten thousand years through a bargain he does not fully understand. Proud, grieving, dangerous. "Ten thousand years I waited."
- **Nal'veshra, the Deepmother.** A sea spirit older than the Starborn. The true power under the citadel. Swallowed the sea spirit Shal'zua. "Little lights."
- **Lady Vessaria, the Tidescribe.** Aeldran's scribe; mistress of the Sunken Archive. Her writing raises the drowned.
- **Shal'zua.** A sea spirit once served by the Wavebreaker trolls, now swallowed; her avatar wears her face.
- **Hexmother Oyala** and **High Priest Zan'jin.** Raised the drowned Wavebreakers and feed the altar in the Temple of Shal'zua.
- **Admiral Vane** (Accord) and **Mazu** (Krugar). Lead each faction's landing on the isle.
- **Lorekeeper Nerathil.** Keeps the Codex of Tides in the Sunken Archive.

## Places (original)

Every place in Caldreth is ours since v10; `docs/plans/v10-names-inventory.md` lists them by region. These are the
ones the story leans on:

- **Kingsmere.** The Accord's capital in Ostmarch, rebuilt on credit. **Vazhrak** is the Krugar capital in Redmarch.
- **Cinderpeak.** The burning mountain: Cinderpeak Depths (the Slagborn city of Ashforge), the Spire (the Ledger's vault), and the Magma Throne beneath.
- **The Smugglers' Deep.** The old Fenwick mine and hidden cove where Blackwell builds the Ledger's fleet.
- **Reedsong.** A Sylari hamlet of reed houses and jetties on Lake Aurel, near Ilvaris in Elderglen; Widya's home. Its Songkeepers keep the hamlet's stories as songs.
- **Silverleaf Lodge.** A wood elf village in the Kinloch pines, the one lodge of the Sylari on Ostmarch, founded by elves who crossed the sea to watch over the Black Ruin's old scar; Lyveus's home, burned two years ago. Now a camp of the Ledger's enforcers until you clear it.
- **Stormveil Isle.** The risen island. Holds the Tidewatch Coast (Accord landing), the Skullreef Isles (Krugar landing), the drowned city of Sael'anor, Spirit's Rest, the causeway and the Tidecrown Citadel.
- **The Sunken Archive.** Sael'anor's great library (Accord dungeon).
- **The Temple of Shal'zua.** The Wavebreakers' temple (Krugar dungeon).
- **The Tidecrown Citadel.** Aeldran's seat; the 10-player raid, shared by both factions.
- **The Gemfall Caves.** Under Mournwaste. Ghesra, the Stone Duchess, is a spirit of the deep stone who grows gems; she is nobody's mother and nobody's widow. The centaur's law forbids digging, a khan broke it, and every tribe says he was from another one.

## Reveals

A term here may not appear in any text a player can read below its level. "Allowed in" lists sources that may use it anyway (the lorekeeper matches the start of the source name). Terms are regular expressions, matched without case.

| Term | Level | What it gives away | Allowed in |
|---|---|---|---|
| `Veshmira` | 60 | the Ledger's master is the dragon Veshmira | |
| `(master\|creditor).{0,40}\bdragon\|\bdragon.{0,40}(master\|creditor)` | 60 | the Ledger's master is a dragon (whelps guarding its coin, warm coins and claw marks are fine as hints) | |
| `Vale.{0,60}Kethriax\|Kethriax.{0,60}Vale` | 60 | Lord Kethran Vale is Kethriax | |
| `Hale.{0,40}(alive\|in chains\|prisoner\|cell)` | 40 | Hale survived the mountain | |
| `Hale.{0,40}(free\|escaped\|walks out)` | 60 | Hale is freed | |
| `Sael'anor\|Aeldran\|Nal'veshra\|Deepmother\|Stormveil\|Tidecrown\|Wavebreaker\|Shal'zua\|Vessaria` | 60 | the Drowned Crown expansion | |
| `Marrow` | 45 | Cassius Marrow is behind the cabal | |
| `Lyveus\|\bLyv\b\|Cloveus` | 37 | the Hooded Stranger is Lyveus | `cutscene legend_lyveus`, `legend lyveus`, `npc lyveus`, `lore lyveus_1` |

## Names

Proper names used in the story that are not already the name of an NPC, creature, place, item, quest or zone in the
game data. The lorekeeper treats anything else with a capital letter as a possible typo. One name per line, or
several sharing a line separated by " / ".

- **Accord / Krugar** — the two factions
- **Caldreth** — the world
- **Ostmarch / Redmarch** — the two continents
- **Long War** — the war between the Accord and the Krugar, ended twelve years ago
- **Black Ledger / Ledger** — the guild of lenders and collectors
- **Grey Hoods / Hoods** — the Ledger's collectors in Longfield
- **Black Brood / Brood** — Veshmira's dragonflight
- **Mistress of Coin / Mistress** — Lady Thorne's office
- **Sylari** — the wood elves' own name; they bless by the moon ("May the moon guide your blade"), with no named goddess
- **Unmaking** — the demon army of old
- **Heartfire** — its bursting sank Sael'anor ten thousand years ago
- **Drowning** — the night the Heartfire burst
- **Briarmother** — the thorn spirit asleep under the southern Scrublands; the Thorn Warrens are her roots, and the spinehide call them holy
- **Bone Mask** — the masked death cult in the Thorn Warrens, serving the Hollow Host; Mother Grisla has chosen it
- **Ossarak / Black Ruin** — the black dragon who tore the world open long ago
- **Haskar** — the old chief of Ossa, Tarro's father (#59)
- **Veshmira** — the Ledger's creditor (named at 60)
- **Meriel Thorne / Thorne** — the Mistress of Coin
- **Kethriax** — Veshmira's eldest; who Lord Kethran Vale really is (revealed at 60)
- **Lord Kethran Vale / Vale** — keeper of the Ledger's vault in Cinderpeak Spire
- **Vulcarn / King Below** — the fire under Cinderpeak
- **King Rhodric Aldane / Rhodric / Aldane** — the late king of Kingsmere
- **Tamlin** — Rhodric's son, to be crowned
- **Edmund Carrow / Edmund / Carrow / Lord Regent / Regent** — the regent of Kingsmere
- **Gideon Hale / Hale** — the marshal and auditor
- **Harborwatch** — the Accord port on the Saltmarsh coast
- **Wexmoor** — the fallen northern kingdom
- **Hollow Host** — the risen dead of the plague
- **Elarion** — the dreaming druid of the Dreaming Caves
- **Lyv** — Lyveus's name among friends
- **Widya** — the second Legend, a wood elf bard of Reedsong
- **Harrowby** — the Black Ledger's appraiser, who split Widya's lute
- **Bromli / Beerhammer** — the third Legend, a mountain dwarf warrior who wants a song about himself
- **Ballad of Bromli Beerhammer / Ballad** — Widya's song about him (a Songbook chapter)
- **Reedsong** — Widya's hamlet on Lake Aurel
- **Songkeeper / Songkeepers** — Reedsong's singers, who keep its stories as songs
- **Songbook** — Widya's later chapters, one song each
- **Hiveborn** — insect swarms of the south
- **Mistshore** — wood elf coast north of Elderglen
- **Drakestone Hold / Drakestone** — the Wyrmchain fortress in Greenfen
- **Rumhook Bay** — the neutral goblin port in the south of the Vinewild (35-40, v10.9); the Saltpenny trading house buys Longfield's seized grain there for the Ledger and pays in warm coin
- **Saltpenny** — the goblin trading house of Rumhook Bay (Gorvo Saltpenny), deep in the Ledger's debt
- **Merry Debtor** — a cargo ship sunk off Blackgull Cove
- **Blackgull** — the pirates of the southern coasts (Rotten Plank Cove in Sirocco, Blackgull Cove in the Vinewild); they raid shipping and rob the Ledger's captains
- **Windgorge** — canyon lands south of the Scrublands
- **Harrow Span / Span** — the bridge between Greenfen and Kinloch
- **Underrail** — the tunnel train between Kingsmere and Keldrun
- **Anvil Throne / Throne** — Grimmark's throne room in Cinderpeak Depths; also the thorn throne of the Thorn Warrens
- **Isle** — as in Stormveil Isle
- **Forgehall** — the Slagborn's hall of learning in Cinderpeak Depths
- **Lanternwake** — the autumn festival (24 October to 7 November): Caldreth lights candles for its dead so they can find the road home. Its folk tale is the Wickless Knight, a shade who lost his way centuries ago and puts out every lantern he passes; he is a tale, not part of the main story, and spoils nothing
- **Wake Candles** — the festival's candles, spent at the Wakekeeper's stall
- **Pyre Bastion** — the Order's stronghold in Graymouth
- **King's Square** — the old market square of Graymouth
- **Bracken Arms** — the inn at Brackenford
- **White Hart** — the inn in Kingsmere
- **Saltmarsh** — the marsh south of the Scrublands; Harborwatch on its coast, Veshmira's lair in the Dragonmire
- **Mudwall Village / Mudwall** — the Krugar camp in Saltmarsh
- **Scorchmaw** — a rare drake of Veshmira's brood in the Scorched Fen
- **Brant Ashby** — Commander of Harborwatch's watch
- **Durnak** — Warlord of Mudwall Village
- **High Chief** — Grask's title, as leader of the Krugar (never "Warchief")
- **Emberfall** — the King Below's hammer, a Magma Throne drop
- **Grand** — as in the Grand Crusader
