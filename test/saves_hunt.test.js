// Saves, cloud sync, and anything that can lose or duplicate items, Marks or progress (#588). Part 1: the bugs found
// before the v10.19.0 beta, each failing on the code before its fix; part 2: edge cases no other test covered.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const W = require('./world');
const { G, D, store } = W;
require('../src/cloud.js');
const CLOUD = globalThis.CLOUD;
const AB = require('../src/acctbank.js');
const clone = (x) => JSON.parse(JSON.stringify(x));
const setMarks = (n) => { const a = G.account(); a.marks = n; G.saveAccount(a); };
const asDevice = (id) => store.setItem('azsolo.device', id);
const dps = (x) => (x.dmg[0] + x.dmg[1]) / 2 / x.speed;
const raidLoot = () => { const s = new Set(); for (const p of D.DUNGEONS[D.UPGRADE.raid].pulls) for (const m of p.mobs) for (const id of (D.MOBS[m].loot || [])) if (D.ITEMS[id]) s.add(id); return [...s]; };
const ownBank = () => { const a = G.account(); delete a.bank; G.saveAccount(a); };

// a fake Google Drive and per-device storage, as sim/cloudsync.js does
const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), clear: () => m.clear(), keys: () => [...m.keys()] }; };
const fakeDrive = () => {
  const d = { files: new Map(), n: 0, updates: 0 };
  d.api = {
    async list() { return [...d.files.values()].map((f) => ({ id: f.id, name: f.name, appProperties: Object.assign({}, f.props) })); },
    async create(name, props, text) { const id = 'f' + ++d.n; d.files.set(id, { id, name, props: Object.assign({}, props), text }); d.updates++; return { id }; },
    async update(id, props, text) { const f = d.files.get(id); Object.assign(f.props, props); f.text = text; d.updates++; return { id }; },
    async download(id) { return d.files.get(id).text; },
    async remove(id) { d.files.delete(id); },
  };
  return d;
};
// run fn with another device's storage in place of the test world's, then put the world's back
const homeLS = globalThis.localStorage;
async function onDevice(ls, id, fn) { const S0 = G.S; G.S = null; globalThis.localStorage = ls; ls.setItem('azsolo.device', id); try { return await fn(); } finally { globalThis.localStorage = homeLS; G.S = S0; } }

// ======================================================================================================== part 1: the bugs

test('a Hard copy upgraded with Marks keeps what it bought when it comes out of the Account bank', () => {
  const { P } = W.character(60); ownBank(); setMarks(5000);
  const id = raidLoot().find((i) => D.GEAR_SLOTS.includes(D.ITEMS[i].slot) && G.upgradeInfo(G.hardCopy(i)).room);
  assert.ok(id, 'a raid piece whose Hard copy still has room to upgrade');
  P.bags = [{ item: G.hardCopy(id), n: 1 }];
  const pw0 = P.bags[0].item.pw;
  assert.ok(G.upgradeItem({ bag: 0 }), 'one upgrade step bought');
  const bought = P.bags[0].item.pw, spent = 5000 - G.account().marks;
  assert.ok(bought > pw0 && spent > 0);
  assert.ok(G.abankDeposit(0));
  const key = AB.view(G.abank())[0].key;
  assert.ok(G.abankWithdraw(key));
  const back = P.bags.find((b) => b.item.id === id).item;
  assert.strictEqual(G.account().marks, 5000 - spent, 'the Marks stay spent');
  assert.strictEqual(back.pw, bought, `the step bought for ${spent} Marks is kept (came out at ${back.pw.toFixed(2)}, bought ${bought.toFixed(2)}, Hard start ${pw0.toFixed(2)})`);
});

test('the gear migration (#581) also rebuilds a Hard copy waiting in the mail or listed on the auction house', () => {
  const { S, P } = W.character(60);
  const epic = Object.values(D.ITEMS).find((i) => i.name === 'Tidecrown, Blade of the Prince');
  const oldHard = () => Object.assign(G.copyItem(epic.id), { hard: true }); // as an old save holds it: clamped, no growth
  P.bags.push({ item: oldHard(), n: 1 }); // control: the bags are migrated
  G.mailSend({ kind: 'expired', item: oldHard(), n: 1, dep: 0 }); // an expired auction's item in the mail
  S.ah = S.ah || { listings: [], mine: [], next: 0 };
  S.ah.mine.push({ item: oldHard(), n: 1, price: 100, deposit: 0, postedAt: 0, sellAt: null, expires: W.now() + 864e5 }); // a live auction
  delete S.flags.gear581; G.save(); G.load(S.id);
  const bag = G.S.player.bags.find((b) => b.item.id === epic.id).item;
  assert.ok(dps(bag) > dps(epic), 'the bag copy grows (control)');
  const mail = G.S.mail.find((m) => m.item && m.item.id === epic.id).item, ah = G.S.ah.mine.find((a) => a.item.id === epic.id).item;
  assert.deepStrictEqual({ mail: dps(mail) > dps(epic), auction: dps(ah) > dps(epic) }, { mail: true, auction: true },
    `the mailed (${dps(mail).toFixed(1)}) and listed (${dps(ah).toFixed(1)}) copies grow past Normal (${dps(epic).toFixed(1)}) as the bag copy (${dps(bag).toFixed(1)}) did`);
});

test('a save rebuilt before #588 gets one pass over the mail, its auctions and a reforge undo copy, and only one', () => {
  const { S } = W.character(60);
  const epic = Object.values(D.ITEMS).find((i) => i.name === 'Tidecrown, Blade of the Prince');
  const oldHard = () => Object.assign(G.copyItem(epic.id), { hard: true });
  G.mailSend({ kind: 'expired', item: oldHard(), n: 1, dep: 0 });
  S.ah = S.ah || { listings: [], mine: [], next: 0 };
  S.ah.mine.push({ item: oldHard(), n: 1, price: 100, deposit: 0, postedAt: 0, sellAt: null, expires: W.now() + 864e5 });
  S.reforge = { where: { slot: 'weapon' }, old: oldHard(), kind: 'x' };
  S.flags.gear581 = 1; delete S.flags.gear588; G.save(); G.load(S.id); // as the first rebuild left it
  const grown = () => [G.S.mail.find((m) => m.item && m.item.id === epic.id).item, G.S.ah.mine.find((a) => a.item.id === epic.id).item, G.S.reforge.old].map((x) => dps(x) > dps(epic));
  assert.deepStrictEqual(grown(), [true, true, true]);
  assert.strictEqual(G.S.flags.gear588, 1);
  const once = JSON.stringify([G.S.mail, G.S.ah.mine, G.S.reforge]);
  G.save(); G.load(G.S.id);
  assert.strictEqual(JSON.stringify([G.S.mail, G.S.ah.mine, G.S.reforge]), once, 'a second load changes nothing');
});

test('Marks the live page (v10.18.3, same site as /beta/) earns or spends are not undone by the beta reading the account', () => {
  W.character(30); setMarks(300);
  // v10.18.3's G.account and G.saveAccount: Object.assign({ marks: 0, heirlooms: [] }, saved), change marks, write it all
  // back; the counters (mk) it does not know ride along unchanged
  const oldSpend = (n) => { const a = Object.assign({ marks: 0, heirlooms: [] }, JSON.parse(store.getItem('azsolo.account'))); a.marks -= n; store.setItem('azsolo.account', JSON.stringify(a)); };
  oldSpend(100); // a heirloom bought on the live page
  assert.strictEqual(G.account().marks, 200, 'the 100 spent on the live page stay spent');
  oldSpend(-50); // 50 earned on the live page
  assert.strictEqual(G.account().marks, 250, 'the 50 earned on the live page stay earned');
});

test('the same Account bank tab bought on two devices before a sync costs the Marks of the tabs the account ends with', () => {
  W.character(30); ownBank(); setMarks(1000);
  const synced = clone(G.account());
  asDevice('dA'); assert.ok(G.abankBuyTab()); const onA = clone(G.account());
  store.setItem('azsolo.account', JSON.stringify(synced));
  asDevice('dB'); assert.ok(G.abankBuyTab()); const onB = clone(G.account());
  const m = CLOUD.mergeAccount(onA, onB), tabs = m.bank.tabs;
  const paid = G.ABANK_TAB_COST.slice(0, tabs).reduce((s, c) => s + c, 0);
  assert.strictEqual(m.marks, 1000 - paid, `${tabs} tab(s) cost ${paid} Marks, but the merged account holds ${m.marks} of 1000`);
});

async function idleUploads(mA, mB) { // two devices each buy a mount, sync until both hold both, then count uploads while nothing changes
  const d = fakeDrive(); CLOUD.setDriver(d.api);
  const A = mem(), Bm = mem();
  const buy = (ls, id, mounts) => onDevice(ls, id, () => { const a = G.account(); a.mounts = mounts; G.saveAccount(a); });
  await buy(A, 'dA', mA); await buy(Bm, 'dB', mB);
  const sync = (ls, id) => onDevice(ls, id, () => CLOUD.syncAccount());
  await sync(A, 'dA'); await sync(Bm, 'dB'); await sync(A, 'dA'); await sync(Bm, 'dB');
  const before = d.updates;
  await sync(A, 'dA'); await sync(Bm, 'dB'); await sync(A, 'dA');
  CLOUD.setDriver(null);
  return d.updates - before;
}
test('an account file merge that changes nothing writes nothing to Drive (two devices, mounts bought in a different order)', async () => {
  assert.strictEqual(await idleUploads(['m_one', 'm_two'], ['m_one', 'm_two']), 0, 'control: the same order uploads nothing');
  assert.strictEqual(await idleUploads(['m_one'], ['m_two']), 0, 'nothing changed, so no upload (the lists only differ in order)');
});

// ============================================================================================ part 2: regression (pass)

test('regression: deposit on one device, withdraw on another, sync every way twice: one copy, an empty bank everywhere', async () => {
  const d = fakeDrive(); CLOUD.setDriver(d.api);
  const A = mem(), Bm = mem(), it = { id: 'x_mat', name: 'X', slot: 'trade' };
  await onDevice(A, 'dA', () => { const a = G.account(); a.bank = AB.empty(); AB.deposit(a.bank, it, 7, true); G.saveAccount(a); });
  const sync = (ls, id) => onDevice(ls, id, () => CLOUD.syncAccount());
  await sync(A, 'dA'); await sync(Bm, 'dB');
  let got = 0;
  await onDevice(Bm, 'dB', () => { const a = G.account(), b = AB.merge(a.bank, null); got = AB.takeKey(b, 'x_mat', 99).n; a.bank = b; G.saveAccount(a); });
  assert.strictEqual(got, 7);
  for (let i = 0; i < 2; i++) { await sync(A, 'dA'); await sync(Bm, 'dB'); }
  for (const [ls, id] of [[A, 'dA'], [Bm, 'dB']]) await onDevice(ls, id, () => assert.strictEqual(AB.view(AB.merge(G.account().bank, null)).length, 0, id + ' bank empty'));
  CLOUD.setDriver(null);
});

test('regression: Marks across three devices merge to the same total in any order, and again changes nothing', () => {
  const base = { marks: 100, heirlooms: [], mk: { base: 100, earn: {}, spend: {} } };
  const a = clone(base); a.mk.earn.dA = 40; const b = clone(base); b.mk.spend.dB = 70; const c = clone(base); c.mk.earn.dC = 5; c.mk.spend.dC = 10;
  const ab_c = CLOUD.mergeAccount(CLOUD.mergeAccount(a, b), c), c_ba = CLOUD.mergeAccount(c, CLOUD.mergeAccount(b, a));
  assert.strictEqual(ab_c.marks, 65); assert.strictEqual(c_ba.marks, 65);
  assert.strictEqual(CLOUD.mergeAccount(ab_c, c_ba).marks, 65);
  assert.strictEqual(CLOUD.mergeAccount(ab_c, a).marks, 65, 'an old copy of one device changes nothing');
});

test('regression: broken or missing account files merge without NaN or negative Marks', () => {
  for (const [x, y] of [[null, null], [{}, undefined], [{ marks: 'abc' }, { marks: -5 }], [{ marks: 10, mk: { base: 'x', earn: { d: 'y' }, spend: null } }, {}], [{ marks: 5, bank: 'junk' }, { bank: [1, 2] }]]) {
    const m = CLOUD.mergeAccount(x, y);
    assert.ok(Number.isFinite(m.marks) && m.marks >= 0, JSON.stringify([x, y]) + ' -> ' + m.marks);
  }
  store.setItem('azsolo.account', '{not json'); assert.strictEqual(G.account().marks, 0, 'a broken account reads as 0 Marks');
  store.setItem('azsolo.account', JSON.stringify({ marks: 50, mk: { base: 50, earn: { d: 10 }, spend: { d: 500 } } }));
  assert.strictEqual(G.account().marks, 0, 'an overspent account shows 0, never a negative number');
});

test('regression: a merged Account bank fuller than its slots still lets every item out, and takes no more in', () => {
  const { P } = W.character(30); ownBank(); setMarks(0);
  const other = AB.empty(), here = AB.empty();
  for (let i = 0; i < 12; i++) { AB.deposit(other, G.genGear('legs', 30, 2), 1, false); AB.deposit(here, G.genGear('legs', 30, 2), 1, false); }
  const a = G.account(); a.bank = AB.merge(here, other); G.saveAccount(a);
  assert.strictEqual(AB.slots(G.abank()), 24);
  P.bags = [{ item: G.genGear('legs', 30, 2), n: 1 }];
  assert.strictEqual(G.abankDeposit(0), false, 'full: nothing goes in');
  assert.strictEqual(P.bags.length, 1, 'and the bags keep it');
  let out = 0;
  for (const row of AB.view(G.abank())) { P.bags = []; if (G.abankWithdraw(row.key)) out++; }
  assert.strictEqual(out, 24); assert.strictEqual(AB.view(G.abank()).length, 0);
});

test('regression: the gear migration runs once: a second load and an item already at max change nothing', () => {
  const { S, P } = W.character(60);
  const id = raidLoot().find((i) => D.GEAR_SLOTS.includes(D.ITEMS[i].slot) && G.upgradeInfo(G.copyItem(i)).room);
  const it = G.copyItem(id), capped = G.upgradedCopy(it, D.UPGRADE.cap[it.q] * G.upgradeRef(it)), plain = G.copyItem(id);
  P.bags = [{ item: capped, n: 1 }, { item: plain, n: 1 }];
  delete S.flags.gear581; G.save(); G.load(S.id);
  const once = JSON.stringify(G.S.player.bags);
  assert.strictEqual(JSON.stringify(G.S.player.bags[0].item), JSON.stringify(capped), 'an item at its ceiling is unchanged');
  assert.strictEqual(JSON.stringify(G.S.player.bags[1].item), JSON.stringify(plain), 'an item never upgraded is unchanged');
  G.save(); G.load(G.S.id);
  assert.strictEqual(JSON.stringify(G.S.player.bags), once, 'a second load changes nothing');
  assert.strictEqual(G.S.flags.gear581, 1);
});

test('regression: a save with no flags, no bank, no mail and no auctions loads, and the migration marks it done', () => {
  const { S } = W.character(30); const id = S.id;
  const sv = G.readSave(id); delete sv.flags; delete sv.mail; delete sv.ah; delete sv.player.bank; delete sv.player.mounts;
  store.setItem('azsolo.char.' + id, JSON.stringify(sv));
  G.load(id);
  assert.strictEqual(G.S.id, id);
  assert.strictEqual(G.S.flags.gear581, 1);
});

test('regression: an Account bank withdrawal of a plain upgraded item (not Hard) keeps the power it bought', () => {
  const { P } = W.character(60); ownBank(); setMarks(5000);
  const id = raidLoot().find((i) => D.GEAR_SLOTS.includes(D.ITEMS[i].slot) && G.upgradeInfo(G.copyItem(i)).room);
  P.bags = [{ item: G.copyItem(id), n: 1 }];
  assert.ok(G.upgradeItem({ bag: 0 }));
  const plainOf = (x) => { const o = clone(x); delete o.fxNew; return JSON.stringify(o); }; // fxNew: the bags' "new effect item" dot
  const want = plainOf(P.bags[0].item);
  assert.ok(G.abankDeposit(0)); assert.ok(G.abankWithdraw(AB.view(G.abank())[0].key));
  assert.strictEqual(plainOf(P.bags.find((b) => b.item.id === id).item), want);
});
