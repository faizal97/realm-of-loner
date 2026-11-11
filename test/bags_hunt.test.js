// Bug hunt before the v10.19.0 beta: bags, banks, selling, crafting inventory, auction house.
// Part 1: the bugs found (#589), each with the behaviour expected; part 2: edge cases no other test covered.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character, advance } = require('./world');

const sum = (l, id) => (l || []).filter((b) => b.item.id === id).reduce((a, b) => a + b.n, 0);
const gear = () => G.genGear('legs', 30, 2);
const ore = Object.keys(D.ITEMS).find((k) => G.isMatItem(D.ITEMS[k]) && G.stackable(D.ITEMS[k]) && !D.ITEMS[k].noSell);

// ============================================================ part 1: bugs (#589)

test('a craft order never takes a locked piece: Hand over leaves it and pays nothing', () => {
  const { S, P } = character(30, 'warrior', 'human');
  P.prof = { blacksmithing: { skill: 100, max: 150 } };
  const r = D.RECIPES.bs_copper_bracers, it = G.copyItem(r.makes); it.id = r.makes; it.crafter = P.name;
  P.bags = [{ item: it, n: 1 }]; assert.ok(G.setLock('bag', 0, true));
  const acts = globalThis.SOC.actions({ ch: 'whisper', act: { state: 'open', kind: 'craft_order', bot: S.bots[0].id, rid: r.id, tip: 100, sent: true } });
  assert.ok(acts[0].disabled, 'greyed: ' + acts[0].label); assert.match(acts[0].label, /Unlock/);
  const money = P.money; assert.match(String(acts[0].fn()), /Locked/, 'refused with a short message');
  assert.strictEqual(P.bags.length, 1, 'the locked bracers stay in the bags');
  assert.ok(P.bags[0].item.lock);
  assert.strictEqual(P.money, money, 'no tip for an item that was not handed over');
});

test('a craft order with a locked and an unlocked copy hands over the unlocked one', () => {
  const { S, P } = character(30, 'warrior', 'human');
  P.prof = { blacksmithing: { skill: 100, max: 150 } };
  const r = D.RECIPES.bs_copper_bracers, mk = () => { const it = G.copyItem(r.makes); it.id = r.makes; return it; };
  P.bags = [{ item: mk(), n: 1 }, { item: mk(), n: 1 }]; G.setLock('bag', 1, true); // the locked one is last, where removeItem starts
  globalThis.SOC.actions({ ch: 'whisper', act: { state: 'open', kind: 'craft_order', bot: S.bots[0].id, rid: r.id, tip: 100, sent: true } })[0].fn();
  assert.strictEqual(P.bags.length, 1);
  assert.ok(P.bags[0].item.lock, 'the locked copy is the one kept');
});

test('a locked piece goes into the Account bank and comes out still locked', () => {
  // game.js says the lock rides on the item so "both banks keep it", but G.abankTakes -> G.ahTrade refuses any locked item
  const { P } = character(30, 'warrior', 'human');
  P.bags = [{ item: G.fittedGear(30, 3, 'warrior'), n: 1 }]; G.setLock('bag', 0, true);
  assert.ok(G.abankTakes(P.bags[0].item), 'the Account bank takes a locked piece');
  assert.strictEqual(G.abankDeposit(0), true); assert.strictEqual(P.bags.length, 0);
  const row = globalThis.ABANK.view(G.abank()).find((x) => x.item.lock);
  assert.ok(row, 'still locked in the Account bank');
  assert.strictEqual(G.abankWithdraw(row.key), true);
  assert.ok(P.bags[0].item.lock, 'still locked after the round trip');
});

test('a locked heirloom stays locked after a level-up (and so cannot be sold)', () => {
  const { P } = character(20, 'warrior', 'human');
  P.bags = [{ item: G.makeHeirloom('heirloom_blade', 20), n: 1 }]; G.setLock('bag', 0, true);
  P.equip.weapon = G.makeHeirloom('heirloom_blade', 20); G.lockWorn();
  G.gainXp(G.xpToLevel ? G.xpToLevel(P.level) : 1e5, false); // one level or more: levelUp() rebuilds every heirloom
  assert.ok(P.level > 20);
  assert.ok(P.bags[0].item.lock, 'the bag copy keeps its lock');
  assert.ok(P.equip.weapon.lock, 'the worn copy keeps its lock');
  const money = P.money; G.sell(0);
  assert.strictEqual(P.bags.length, 1, 'still unsellable'); assert.strictEqual(P.money, money);
});

test('a locked heirloom stays locked after a save and load', () => {
  const { P } = character(20, 'warrior', 'human');
  P.bags = [{ item: G.makeHeirloom('heirloom_blade', 20), n: 1 }]; G.setLock('bag', 0, true);
  const id = G.S.id; G.save(); G.logout(); G.load(id);
  assert.ok(G.S.player.bags[0].item.lock, 'refreshHeirlooms on load keeps the lock');
});

// ============================================================ part 2: regression tests (pass now)

const withSatchel = (lvl) => { const r = character(lvl || 30); r.P.bagsEq = [G.copyItem('gatherers_satchel')]; r.P.bags = []; return r; };

test('a gear craft with only materials-bag room is refused and nothing is taken', () => {
  const { P } = withSatchel();
  P.prof = { blacksmithing: { skill: 100, max: 150 } };
  for (let i = 0; i < 16; i++) P.bags.push({ item: gear(), n: 1 });
  P.bags.push({ item: G.copyItem('copper_bar'), n: 10 }); // sits in the Satchel: using it frees no gear slot
  assert.strictEqual(G.craft('bs_copper_bracers', 3), 'Bags are full.');
  advance(5);
  assert.strictEqual(sum(P.bags, 'copper_bar'), 10); assert.strictEqual(P.bags.length, 17);
});

test('a craft from bank materials only, with full bags, is refused before anything is taken', () => {
  const { P } = character(30); P.prof = { blacksmithing: { skill: 100, max: 150 } };
  P.bags = []; while (P.bags.length < G.bagCap()) P.bags.push({ item: gear(), n: 1 });
  P.bank = [{ item: G.copyItem('copper_bar'), n: 10 }];
  assert.strictEqual(G.matCount('copper_bar'), 10);
  assert.strictEqual(G.craft('bs_copper_bracers', 1), 'Bags are full.');
  assert.strictEqual(sum(P.bank, 'copper_bar'), 10);
});

test('buyback: a grey needs a normal slot (Satchel room is not enough), trade goods go into the Satchel', () => {
  const { P } = withSatchel(); P.buyback = [];
  const junk = Object.keys(D.ITEMS).find((k) => D.ITEMS[k].q === 0 && D.ITEMS[k].slot === 'junk');
  P.bags.push({ item: G.copyItem(ore), n: 20 }); G.sell(0);
  P.bags.push({ item: G.copyItem(junk), n: 3 }); G.sell(0);
  for (let i = 0; i < 16; i++) P.bags.push({ item: gear(), n: 1 });
  const money = P.money;
  assert.strictEqual(G.buyBack(0), false, 'the grey: no normal slot'); assert.strictEqual(P.money, money);
  assert.strictEqual(G.buyBack(1), true, 'the ore: into the Satchel'); assert.strictEqual(sum(P.bags, ore), 20);
});

test('buyback holds the newest 12 and survives a save and load', () => {
  const { P } = character(30); P.buyback = [];
  for (let i = 0; i < 15; i++) { P.bags = [{ item: Object.assign(gear(), { name: 'Piece ' + i }), n: 1 }]; G.sell(0); }
  assert.strictEqual(P.buyback.length, 12); assert.strictEqual(P.buyback[0].item.name, 'Piece 14');
  const id = G.S.id; G.save(); G.logout(); G.load(id);
  assert.strictEqual(G.S.player.buyback.length, 12); assert.strictEqual(G.S.player.buyback[0].item.name, 'Piece 14');
});

test('a sold old stack of 45 comes back from buyback as stacks of 20', () => {
  const { P } = character(30); P.buyback = [];
  P.bags = [{ item: G.copyItem(ore), n: 45 }]; const money = P.money; G.sell(0);
  const got = P.money - money; assert.strictEqual(P.buyback[0].price, got, 'bought back for what it sold for');
  assert.strictEqual(G.buyBack(0), true);
  assert.deepStrictEqual(P.bags.map((b) => b.n).sort((a, b) => b - a), [20, 20, 5]);
});

test('Sort with a Satchel splits an old stack of 65 and keeps every piece', () => {
  const { P } = withSatchel();
  for (let i = 0; i < 16; i++) P.bags.push({ item: gear(), n: 1 });
  P.bags.push({ item: G.copyItem(ore), n: 65 });
  G.sortBags();
  assert.strictEqual(sum(P.bags, ore), 65); assert.ok(P.bags.every((b) => b.n <= 20));
});

test('Sort bank on an overfilled bank merges and keeps every piece', () => {
  const { P } = character(30); P.bank = [];
  for (let i = 0; i < 30; i++) P.bank.push({ item: G.copyItem(ore), n: 3 }); // 30 > 24 slots (rewards may overfill it)
  G.sortBank();
  assert.strictEqual(sum(P.bank, ore), 90); assert.deepStrictEqual(P.bank.map((b) => b.n), [20, 20, 20, 20, 10]);
});

test('withdrawing gear with only Satchel room is refused and the bank keeps it', () => {
  const { P } = withSatchel();
  for (let i = 0; i < 16; i++) P.bags.push({ item: gear(), n: 1 });
  const g = gear(); P.bank = [{ item: g, n: 1 }];
  G.bankWithdraw(0);
  assert.strictEqual(P.bank.length, 1); assert.strictEqual(P.bags.length, 16);
});

test('swapping a full Satchel for a Haversack keeps every item', () => {
  const { P } = withSatchel(); P.bagsEq = ['linen_bag', 'linen_bag', 'linen_bag', 'gatherers_satchel'].map(G.copyItem);
  const cap = G.bagCap();
  for (let i = 0; i < 12; i++) P.bags.push({ item: G.copyItem(ore), n: 20 });
  while (P.bags.length < cap - 1) P.bags.push({ item: gear(), n: 1 });
  P.bags.push({ item: G.copyItem('foragers_haversack'), n: 1 }); // exactly full
  const before = P.bags.length;
  G.useItem(P.bags.length - 1);
  assert.ok(P.bagsEq.some((b) => b.id === 'foragers_haversack'));
  assert.strictEqual(P.bags.length, before, 'the Satchel took the Haversack\'s slot');
  assert.strictEqual(sum(P.bags, ore), 240); assert.ok(P.bags.some((b) => b.item.id === 'gatherers_satchel'));
  assert.ok(G.bagFree(D.ITEMS[ore]) === 8);
});

test('the auction house will not sell a materials bag into Satchel-only room', () => {
  const { S, P } = withSatchel();
  for (let i = 0; i < 16; i++) P.bags.push({ item: gear(), n: 1 });
  S.ah = { listings: [{ id: 'x1', item: G.copyItem('foragers_haversack'), n: 1, price: 100, seller: 'Bob', expires: Date.now() + 1e7 }], mine: [], next: Date.now() + 1e7 };
  const money = P.money; G.ahBuy('x1');
  assert.strictEqual(P.money, money); assert.strictEqual(S.ah.listings.length, 1);
});

test('Store materials fills partial bank stacks even when every bank slot is used', () => {
  const { P } = character(30); P.bank = [];
  P.bank.push({ item: G.copyItem(ore), n: 15 }); while (P.bank.length < G.bankSlots()) P.bank.push({ item: gear(), n: 1 });
  P.bags = [{ item: G.copyItem(ore), n: 5 }, { item: G.copyItem(ore), n: 6 }];
  const r = G.bankStoreMats();
  assert.strictEqual(sum(P.bank, ore) + sum(P.bags, ore), 26, 'nothing lost');
  assert.strictEqual(r.moved, 1); assert.strictEqual(r.left, 1);
  assert.ok(P.bank.length <= G.bankSlots());
});

test('a sale of several skips locked gear and a buyback restores exactly what was sold', () => {
  const { P } = character(30, 'warrior', 'human'); P.buyback = [];
  P.bags = [{ item: gear(), n: 1 }, { item: gear(), n: 1 }, { item: G.copyItem(ore), n: 7 }];
  G.setLock('bag', 1, true);
  const money = P.money, res = G.sellMany([0, 1, 2]);
  assert.strictEqual(res.n, 2); assert.strictEqual(P.bags.length, 1); assert.ok(P.bags[0].item.lock);
  for (let i = P.buyback.length - 1; i >= 0; i--) assert.strictEqual(G.buyBack(i), true);
  assert.strictEqual(P.money, money, 'the gold round-trips to the copper');
  assert.strictEqual(sum(P.bags, ore), 7); assert.strictEqual(P.bags.length, 3);
});
