# Inbox (#258)

A player asked whether anything tells you when an auction sells, or shows what sold. Today a sale is one chat line, easy
to miss, and My auctions forgets it. The inbox is the MMO mailbox: one place for what happened to your auctions.

## Decisions

- **Gold arrives at once**, as now. A sale letter is a receipt (item, buyer, gold after the cut, deposit back, when), so
  no gold can wait unclaimed in a letter nobody opens.
- **First version: auctions only.** A receipt for each sale; each expired auction comes as a letter with the item
  attached. More senders (full-bag rewards, craft orders, gifts) can join later, each in its own issue.
- **Read anywhere, take items at a mailbox.** Every town has one: any safe place with an inn, and every capital place.
  A receipt is news and needs no travel; a returned item is collected at the mailbox, so it never lands in the bags
  mid-dungeon.
- **Opened from an envelope in the top bar**, beside the gold: always there, a dot while anything is unread. A sale
  also shows a short notice: "Sold: Iron Helm, 2g 40s".
- **Kept:** the newest 50 letters. Past 50 the oldest read letters without an item go first. A letter with an item is
  never removed until the item is taken. Every letter can be deleted by hand, except one still holding its item.

## Data

`S.mail = [{ id, at, kind: 'sold' | 'expired', item, n, buyer?, got?, dep?, read, taken? }]`, newest last. Saved with
the character. Old saves have no `S.mail` and start empty; items already sent to the bank stay there.

`G.mailUnread()`, `G.mailTake(id)` (refused away from a mailbox, or with full bags), `G.mailDelete(id)`,
`G.mailboxHere()`.

## Screen

The inbox sheet: newest first. Each row: the item icon, a title ("Sold: Iron Helm" / "Expired: Iron Helm"), one value
line (gold received / "Take it at a mailbox"), when. A tap opens the letter: who bought it, the gold after the 5% cut and
the deposit back, or the item with a Take button (greyed with the reason away from a mailbox or with full bags), and
Delete. Opening the inbox marks the letters read.
