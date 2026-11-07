// Currency sinks at level 60 (#181, #500; docs/plans/2026-11-07-currency-sinks-design.md): what level-60 play pays in
// Mentor Marks and gold, and what spends them.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character, now, setNow } = require('./world');

test('a raid pays full Marks on its first clear of the week, then the dungeon rate; a new week pays full again (#501)', () => {
  character(60, 'warrior', 'human');
  const a0 = G.account().marks;
  assert.strictEqual(G.payClearMarks('molten_core'), 15);
  assert.strictEqual(G.payClearMarks('molten_core'), 5);
  assert.strictEqual(G.payClearMarks('molten_core'), 5);
  assert.strictEqual(G.payClearMarks('onyxias_lair'), 15, 'each raid has its own first clear');
  assert.strictEqual(G.payClearMarks('stratholme'), 5, 'a dungeon always pays 5');
  assert.strictEqual(G.account().marks - a0, 45);
  const t0 = now(); setNow(t0 + 7 * 86400000);
  assert.strictEqual(G.payClearMarks('molten_core'), 15, 'a new week pays the first clear again');
  setNow(t0);
});

test('a death takes 10% durability from worn gear, not rings or cloaks; a broken piece gives no stats (#502)', () => {
  const { P } = character(60, 'warrior', 'human');
  const slot = Object.keys(P.equip).find((s) => G.hasDur(P.equip[s], s) && Object.keys(P.equip[s].stats || {}).length);
  const ring = Object.keys(P.equip).find((s) => s === 'finger' || s === 'back');
  G.wear();
  assert.strictEqual(G.durOf(P.equip[slot]), 90);
  if (ring) assert.strictEqual(G.durOf(P.equip[ring]), 100, 'rings and cloaks never wear');
  const before = G.stats();
  P.equip[slot].dur = 0;
  const after = G.stats(), it = P.equip[slot];
  for (const k in it.stats) assert.ok(after[k] < before[k], `broken ${it.name} loses its ${k}`);
});

test('nothing wears before level 10 (#502)', () => {
  const { P } = character(5, 'mage', 'human');
  G.wear();
  for (const s in P.equip) assert.strictEqual(G.durOf(P.equip[s]), 100);
});

test('repairs cost gold by item level and quality, restore every piece, and a kit costs 25% more and only in a run (#502)', () => {
  const { S, P } = character(60, 'warrior', 'human');
  const it = { slot: 'chest', lvl: 60, q: 4, dur: 0 }, blue = Object.assign({}, it, { q: 3 }), low = Object.assign({}, it, { lvl: 30 });
  assert.ok(G.repairCost(it) > G.repairCost(blue) && G.repairCost(blue) > G.repairCost(low), 'purple > blue > lower level');
  assert.strictEqual(G.repairCost(Object.assign({}, it, { dur: 100 })), 0);
  G.wear(); G.wear();
  const cost = G.repairAllCost(); assert.ok(cost > 0);
  assert.strictEqual(G.repairAll(true), false, 'no kit outside a run');
  const m0 = P.money; assert.strictEqual(G.repairAll(false), true);
  assert.strictEqual(m0 - P.money, cost);
  for (const s in P.equip) assert.strictEqual(G.durOf(P.equip[s]), 100);
  G.wear(); S.run = { phase: 'rest' };
  assert.strictEqual(G.repairAllCost(true), Math.round(G.repairAllCost() * 1.25));
  const m1 = P.money, kc = G.repairAllCost(true); assert.strictEqual(G.repairAll(true), true); assert.strictEqual(m1 - P.money, kc);
  S.run = null;
});

test('Reforge costs 20 x 1.5^n per item, rerolls the effect or stats at the same budget, and Revert brings it back (#503)', () => {
  const { P } = character(60, 'warrior', 'human');
  const id = Object.keys(D.ITEMS).find((k) => { const i = D.ITEMS[k]; return i.effect && i.lvl >= 57 && i.q >= 3 && D.effectCost(i.effect) > 0; });
  G.addItem(G.copyItem(id), 1); const bag = P.bags.length - 1, where = { bag };
  const a = G.account(); a.marks = 1000; G.saveAccount(a);
  const it0 = JSON.parse(JSON.stringify(P.bags[bag].item)), sum = (st) => Object.values(st).reduce((x, y) => x + y, 0);
  assert.strictEqual(G.reforgeCost(it0), 20);
  const r = G.reforge(where, 'stats');
  assert.ok(r && r.cost === 20 && G.account().marks === 980);
  assert.strictEqual(sum(r.next.stats), sum(it0.stats), 'stats: same total');
  assert.notDeepStrictEqual(Object.keys(r.next.stats).sort(), Object.keys(it0.stats).sort(), 'stats: a new pair');
  assert.strictEqual(G.reforgeCost(P.bags[bag].item), 30);
  assert.strictEqual(G.reforgeRevert(), true);
  assert.deepStrictEqual(P.bags[bag].item.stats, it0.stats, 'Revert: the old stats');
  assert.strictEqual(G.reforgeCost(P.bags[bag].item), 30, 'a revert keeps the count: the Marks were spent');
  const e = G.reforge(where, 'effect'); G.reforgeKeep();
  assert.notStrictEqual(e.next.effect, it0.effect);
  const want = Math.round(sum(it0.stats) * (1 - D.effectCost(e.next.effect)) / (1 - D.effectCost(it0.effect)));
  assert.ok(Math.abs(sum(e.next.stats) - want) <= Object.keys(it0.stats).length, `effect: stats re-priced by the effects' costs (${sum(e.next.stats)} vs ${want})`);
  assert.strictEqual(e.cost, 30); assert.strictEqual(G.reforgeCost(P.bags[bag].item), 45);
});

test('Reforge needs a level-57+ blue or purple, an effect to reroll one, and enough Marks (#503)', () => {
  const { P } = character(60, 'warrior', 'human');
  assert.strictEqual(G.canReforge({ slot: 'chest', q: 2, lvl: 60, stats: { str: 5 } }, 'stats'), false, 'not a green');
  assert.strictEqual(G.canReforge({ slot: 'chest', q: 3, lvl: 40, stats: { str: 5 } }, 'stats'), false, 'not below 57');
  assert.strictEqual(G.canReforge({ slot: 'chest', q: 3, lvl: 60, stats: { str: 5 } }, 'effect'), false, 'no effect to reroll');
  assert.strictEqual(G.canReforge({ slot: 'chest', q: 4, lvl: 60, stats: { str: 5 } }, 'stats'), true);
  G.addItem({ id: 'rf_test', name: 'Test Plate', slot: 'chest', q: 4, lvl: 60, stats: { str: 9, sta: 9 }, sell: 1 }, 1);
  const a = G.account(); a.marks = 5; G.saveAccount(a);
  assert.strictEqual(G.reforge({ bag: P.bags.length - 1 }, 'stats'), null);
  assert.strictEqual(G.account().marks, 5);
});

test('Renown costs Marks and gold on a straight line and pays a dye each rank, a title tier every 5, a tint every 10 (#504)', () => {
  const { P } = character(60, 'warrior', 'human');
  assert.deepStrictEqual(G.renownCost(1), { marks: 110, gold: 110000 });
  assert.deepStrictEqual(G.renownCost(10), { marks: 200, gold: 200000 });
  assert.deepStrictEqual(G.renownCost(50), { marks: 600, gold: 600000 });
  const a = G.account(); a.marks = 100000; a.renown = 0; G.saveAccount(a); P.money = 1e9;
  for (let i = 0; i < 10; i++) assert.strictEqual(G.buyRenown(), true);
  assert.strictEqual(G.renown(), 10);
  let spent = 0; for (let r = 1; r <= 10; r++) spent += G.renownCost(r).marks;
  assert.strictEqual(100000 - G.account().marks, spent);
  assert.strictEqual(G.mountTints(), 1);
  const title = D.TITLES.find((t) => t.id === 'renowned');
  assert.ok(G.titleUnlocked(title));
  assert.match(G.titleName(title, 'Tester'), /the Renowned II$/);
  assert.strictEqual(G.setDye('chest', 11), false, 'only dyes you have');
  assert.strictEqual(G.setDye('chest', 3), true);
  P.wardrobe = { chest: 'mc_robe' };
  assert.strictEqual(G.gearLooks(P).chest, 'mc_robe_dy3', 'a raid set look takes the dye');
  P.wardrobe = { chest: 'mc_robe_hard' };
  assert.strictEqual(G.gearLooks(P).chest, 'mc_robe_dy3', 'a Hard look dyes from the set\'s own design');
  const b = G.account(); b.marks = 0; G.saveAccount(b);
  assert.strictEqual(G.buyRenown(), false, 'no Marks, no rank');
});

test('dyes never run out and never repeat a name (#504)', () => {
  const names = new Set(); for (let n = 1; n <= 300; n++) { const d = D.dye(n); assert.ok(d && d.name); names.add(d.name); }
  assert.strictEqual(names.size, 300);
});

test('every level-57+ consumable recipe takes a vendor reagent priced by level; full use costs ~4g an hour (#505)', () => {
  const { P } = character(60, 'warrior', 'human');
  const makes = (r) => D.ITEMS[r.makes];
  for (const r of Object.values(D.RECIPES)) {
    const it = makes(r), rg = D.REAGENT_FOR(it);
    if (rg) assert.strictEqual(r.mats[rg], 1, `${r.id} takes a ${D.ITEMS[rg].name}`);
    else for (const k of ['crystal_vial', 'fine_spice']) assert.ok(!r.mats[k], `${r.id} (level ${it && it.lvl}) needs no level-60 reagent`);
  }
  const hour = 0.5 * D.ITEMS.crystal_vial.cost + 2 * D.ITEMS.fine_spice.cost; // a flask lasts 2 h, a meal 30 min
  assert.ok(hour >= 30000 && hour <= 50000, `the full set costs ${hour} copper an hour`);
  const npc = D.PLACES[Object.keys(D.PLACES).find((k) => D.PLACES[k].vendor && D.PLACES[k].city)].vendor;
  P.place = Object.keys(D.PLACES).find((k) => D.PLACES[k].vendor === npc);
  assert.ok(G.vendorStock(npc).some((it) => it.id === 'crystal_vial'), 'a city vendor sells the reagents');
});

test('the chase list: Expert Riding with a swift mount, bank tabs, Marks mounts for every character, Quartermaster colours, the weekly stock (#506)', () => {
  const { S, P } = character(60, 'warrior', 'human');
  P.riding = true; P.mounts = []; P.money = 1e8;
  G.buyMount('swift_horse'); assert.ok(!P.mounts.includes('swift_horse'), 'a swift mount needs Expert Riding');
  G.learnExpertRiding(); assert.ok(P.expertRiding);
  G.buyMount('swift_horse'); assert.ok(P.mounts.includes('swift_horse'));
  P.mount = 'swift_horse'; assert.strictEqual(G.rideSpeed(), D.EXPERT_RIDING.speed);
  G.buyMount('horse'); P.mount = 'horse'; assert.strictEqual(G.rideSpeed(), D.RIDING.speed, 'a plain mount keeps 40%');
  assert.strictEqual(G.bankSlots(), 24);
  const m0 = P.money; G.buyBankTab(); G.buyBankTab(); G.buyBankTab(); G.buyBankTab();
  assert.strictEqual(G.bankSlots(), 60); assert.strictEqual(m0 - P.money, 3500000);
  const a = G.account(); a.marks = 100000; a.looks = []; a.mounts = []; G.saveAccount(a);
  const k = 'mentor_warhorse', price = G.qmPrice(D.MOUNTS[k].marks, 'mount:' + k);
  G.buyMount(k); assert.ok(P.mounts.includes(k)); assert.strictEqual(100000 - G.account().marks, price);
  assert.ok(G.account().mounts.includes(k), 'every character gets it');
  P.mounts = []; G.refreshAccountMounts(); assert.ok(P.mounts.includes(k));
  const looks = G.qmLooks(); assert.strictEqual(looks.length, 52, '26 raid set looks in two colours');
  const L = looks.find((x) => x.place === 'chest' && G.canUseItem(D.ITEMS[x.id], P.cls));
  assert.strictEqual(G.buyQmLook(L.place, L.key), true);
  assert.ok(G.wardrobeOptions(L.place).some((o) => o.key === L.key), 'the bought colour is in the wardrobe');
  assert.strictEqual(G.setWardrobe(L.place, L.key), true);
  assert.strictEqual(G.gearLooks(P)[L.place], L.key);
  const st = G.qmStock(); assert.strictEqual(st.length, 3); assert.strictEqual(new Set(st).size, 3);
  assert.deepStrictEqual(G.qmStock(), st, 'the same all week');
  const ref = st[0], base = ref.startsWith('mount:') ? D.MOUNTS[ref.split(':')[1]].marks : looks.find((x) => 'look:' + x.place + ':' + x.key === ref).cost;
  assert.strictEqual(G.qmPrice(base, ref), Math.round(base * 0.8));
  void S;
});

test('the chase list holds about 10x the old sinks (#506)', () => {
  const marks = Object.values(D.HEIRLOOMS).reduce((x, H) => x + H.cost, 0) + G.qmLooks().reduce((x, L) => x + L.cost, 0) + Object.values(D.MOUNTS).reduce((x, M) => x + (M.marks || 0), 0);
  const gold = D.EXPERT_RIDING.cost + Object.values(D.MOUNTS).filter((M) => M.swift && M.cost && M.faction === 'alliance').reduce((x, M) => x + M.cost, 0) + G.BANK_TAB_COST.reduce((x, y) => x + y, 0);
  assert.ok(marks >= 8000, `the account's Mark catalogue: ${marks} (plus ~400 of upgrades per character)`);
  assert.ok(gold >= 9000000, `new gold sinks per character: ${gold / 10000}g`);
});
