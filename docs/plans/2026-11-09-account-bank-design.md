# The account bank (#286)

A bank every character on the account shares, so alts are worth playing: level Alchemy on one character, send the
potions to another.

## What the player sees

- **Where:** a second tab on the bank screen in every capital: **Character | Account**. No new building or menu.
- **What goes in:** anything that can go on the auction house (`G.ahTrade`): gear, materials, potions, elixirs, stones,
  kits, bags and recipes. Heirlooms (already shared), festival items (`noSell`), quest items and anything unsellable stay
  out. Tapping one says "Only items you could sell can go in the account bank."
- **Size:** 12 slots free. Three tabs of 12 more, bought with Mentor Marks at X, 2X, 4X (doubling like the character
  bank's 50g/100g/200g); X is set from the sims' Mark earn rate and posted on #286. Fully bought: 48 slots.
- **Use:** tap to move between bags and the Account tab, stacks of 20, like the character bank. Gear keeps its level
  requirement: a level-15 alt can store a level-40 sword and wear it at 40.
- **Header:** `Account bank: 7/12 · Shared by every character`; an ⓘ says it syncs across your devices.
- **Not in it:** gold (value already moves at a loss by selling shared items; direct gold would undercut the
  per-character gold sinks of #506, so it waits for numbers), mail to alts, sending items to other players.

## Saving and sync

It lives in the account record (`azsolo.account`) beside Marks and heirlooms, so it travels in the cloud file
`account.azs`:

```
bank: { tabs: 0,
        items: { <id>: { item, n } },   // one entry per deposit, with its own id
        took:  { <opId>: { id, k } },   // one per withdrawal
        gone:  [<id>, ...] }            // entries that reached 0 and were dropped
```

- An entry's count is `n` minus everything in `took` for it, never below 0.
- At 0 the entry and its withdrawals are dropped and the id goes into `gone`, so a device that is behind cannot bring it
  back.
- **Merge** (next to `CLOUD.mergeAccount`): union of `items`, `took` and `gone`; the higher `tabs`. Merging is
  order-free and repeatable. An item is never lost; taking the same item out on two devices before they sync gives one
  extra copy, the same trade the Mark merge already makes.
- **Crash order: the receiving side is written first.** Deposit: write the account bank, then remove from bags and save
  the character. Withdraw: add to bags and save the character, then record the withdrawal. A kill between the two writes
  gives an extra copy, never a missing one.
- **Known quirk:** tab purchases spend Marks, and Marks merge by the higher balance, so an unsynced device can refund
  them (as with heirlooms and mounts today). The higher `tabs` keeps the tab.
- **Old saves:** no migration; an account without `bank` has an empty one.

## Testing

- Unit tests of the merge: random deposits and withdrawals on two devices, merged in any order; the count is never
  below the truth, and repeating a merge changes nothing.
- Crash tests: stop between the two writes of a deposit and of a withdrawal; check the item count.
- The rule: every item type against `G.ahTrade`; tab prices double.
- Sync: extend `sim/cloudsync.js` (a build gate).
- Mark prices: a sim of the Mark earn rate sets X.
- It touches items, so it is checked on `/dev/` before the issue closes.
