# Tavern games: design

**v10.12** (moved from v10.11 on 2026-10-04, when the living server went first). Non-combat games at the inn, for any
level, as a break from questing. From Faizal's idea (2026-10-03). Drafted by the
game designer; the games to start with are Faizal's pick (§2).

## Why

Everything a player does today is a fight, a quest or a craft. A low-level player who is tired of questing has nothing
else to do, and the server's inns are only for resting. Real MMO taverns are where players idle, gamble and show off.
Tavern games also lay the base for roadmap item 2 (a Darkmoon Faire week): the Faire can reuse these games with its own
prizes.

## 1. The tavern

- **Where:** every place with an Innkeeper (read from the data, so a new hub's inn has a tavern with no rule). That
  includes the starting areas' first towns, so a level-1 character can play.
- **How:** talk to the Innkeeper → **Tavern**. One sheet with a row per game (design mindset §2: rows, then the game),
  your Tavern Tokens, and the Tavern collection.
- **Bots:** each game's table has simulated players of your faction who are at that inn (any level), with a style each
  (cautious, bold, bluffer). Bots post in General when they win big ("Gorrak won five hands in a row at the Bracken
  Arms"), and some invite you to a table: a real chat request you can accept (`sim/chatcheck.js`). Bots remember a
  player who beat them, like friends do now.

## 2. The games (Faizal picks 2 to start)

Each is short (1–3 minutes), played on a phone with taps, and has a **real choice** that a sim proves (design mindset
§4). None uses your character's level or stats, so a level-1 and a level-60 play the same.

- **A. Hazard (dice, push your luck).** Roll and add up the pips; keep rolling to build your pot, or bank it. A 1 loses
  the pot. First to the target wins, against one bot. The choice: when to bank. Reuses no new art beyond dice.
- **B. Arm wrestling (timing).** A tug bar like the fishing reel: tap in rhythm to push the marker your way, and the bot
  pushes back in its own rhythm. The choice: steady taps or bursts against a bot that tires. Reuses the reel's UI.
- **C. Liar's dice (bluffing, 2–4 players).** Hidden dice under cups; each bid claims how many of a face are on the
  table, or you call the last bid a lie. Bots bluff by style. The richest game, and the biggest to build (the bots'
  bidding is the work).

**Recommendation: A and B first** (the smallest builds, both reusing patterns the game has), **C next** if the tavern
is played.

## 3. What you win (power-neutral)

- **Tavern Tokens**, earned by winning (a little for a loss, so playing is never a waste). They buy only Tavern
  collection items: a few looks (a tankard on your back, a dice pouch, a barkeep's apron), and they count toward two
  titles: "the Lucky" (Hazard wins) and "Iron Wrist" (arm wrestling wins), at fixed numbers, never "all".
- **Never gold, items with stats, or XP.** Gold would make the games a gold farm (the auction house lesson, #20); XP
  would skip levelling. Tokens are farmable on purpose: the only thing farming them buys is looks.
- No stakes and no losses beyond time: it's not gambling.
- Looks join the shared wardrobe (account-wide), like keepsakes.

## 4. The proof

- **A real choice (sim per game):** the best strategy (a bank threshold in Hazard, a tap rhythm in arm wrestling) wins
  clearly more than the naive ones (always roll, always bank; tap as fast as possible) against the bot styles, and no
  single style of bot is unbeatable.
- **A fair table:** a player using the best strategy wins about **55–60%** against an average bot. Better than a coin
  flip, never a sure thing.
- **Token pace:** from an hour of play, the number of tokens; set prices so the whole Tavern collection takes about two
  weeks of an hour a day (a goal, not a chore).
- **Bot chat:** every tavern line that reads like a request is a real one (`sim/chatcheck.js`).

## 5. Build order

1. The tavern, tokens, the collection and two titles, with bots at the tables.
2. Game A (Hazard).
3. Game B (arm wrestling).
4. Later: game C (Liar's dice), and the Darkmoon Faire week reusing the tavern's games.
