// Gear upgrades, item power, item effects and their tooltips (#587): the rules found broken before v10.19.0's beta,
// then sweeps over every item and effect that guard the edge cases.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const W = require('./world');
const { G, D } = W;
W.character(60);

const U = D.UPGRADE;
const dps = (x) => (x && x.dmg && x.speed ? (x.dmg[0] + x.dmg[1]) / 2 / x.speed : 0);
const lootOf = (dk) => { const s = new Set(); for (const p of D.DUNGEONS[dk].pulls) for (const m of p.mobs) for (const id of (D.MOBS[m].loot || [])) if (D.ITEMS[id]) s.add(id); return [...s].map((id) => D.ITEMS[id]); };
const upgradable = () => Object.values(D.ITEMS).filter((it) => D.GEAR_SLOTS.includes(it.slot) && G.upgradeInfo(G.copyItem(it.id)).ok);
const raids = () => Object.keys(D.DUNGEONS).filter((dk) => D.DUNGEONS[dk].raid);
const visible = (x) => JSON.stringify([x.stats, x.sp || 0, x.armor || 0, x.dmg || null]); // what the item card shows, effect apart
const marks = (n) => { const a = G.account(); a.marks = n; G.saveAccount(a); };

// ---------------------------------------------------------------- rules (#587)

test('every upgrade step that costs Mentor Marks changes what the item gives', () => {
  const empty = [];
  for (const it of upgradable()) {
    let cur = G.copyItem(it.id), i = 0;
    while (G.upgradeInfo(cur).room && i++ < 40) {
      const inf = G.upgradeInfo(cur), nx = G.upgradedCopy(cur, inf.next);
      if (visible(nx) === visible(cur) && nx.fxScale === cur.fxScale) empty.push(`${it.name} ${inf.pct}% -> ${inf.nextPct}% for ${inf.cost} Marks`);
      cur = nx;
    }
  }
  // Foulmane Ring (24 points, ceiling 24.57): its only step costs 11 Marks and leaves +13 Stamina +11 Strength as they were
  assert.deepStrictEqual(empty, [], `${empty.length} steps change nothing:\n${empty.join('\n')}`);
});

test('an upgraded Hard raid copy keeps the steps it bought when it comes back out of the account bank', () => {
  const { P } = W.character(60); const a = G.account(); delete a.bank; a.marks = 2000; G.saveAccount(a);
  const h = G.hardCopy('onyx_robe'), inf = G.upgradeInfo(h);
  assert.ok(h.hard && inf.room, 'a Hard copy from an older raid sits under the ceiling and can be upgraded');
  P.bags = [{ item: h, n: 1 }];
  assert.ok(G.upgradeItem({ bag: 0 }), 'one step bought');
  const bought = P.bags[0].item, spent = 2000 - G.account().marks;
  assert.ok(spent > 0 && bought.pw > h.pw, `paid ${spent} Marks: power ${h.pw} -> ${bought.pw}`);
  assert.ok(G.abankDeposit(0), 'into the account bank');
  const row = require('../src/acctbank.js').view(G.abank()).find((g) => g.item.id === 'onyx_robe');
  assert.ok(G.abankWithdraw(row.key), 'and back out');
  const back = P.bags.find((b) => b.item.id === 'onyx_robe').item;
  assert.strictEqual(back.pw, bought.pw, `the ${spent} Marks bought ${bought.pw} power; it came back at ${back.pw}`);
  assert.ok(G.itemPoints(back) >= G.itemPoints(bought), `stats ${G.itemPoints(bought)} -> ${G.itemPoints(back)}`);
});

test('the one-time load rebuild keeps an upgraded Hard copy\'s steps and still gives a never-upgraded one its 2', () => {
  const { S, P } = W.character(60);
  const h = G.hardCopy('onyx_robe'), up = Object.assign(G.upgradedCopy(h, G.upgradeInfo(h).next), { hard: true });
  const clamped = Object.assign(G.copyItem('onyx_robe'), { hard: true }); // an old Hard copy: no growth at all
  P.bags = [{ item: up, n: 1 }, { item: clamped, n: 1 }]; S.flags = S.flags || {}; delete S.flags.gear581;
  G.save(); G.load(S.id);
  const [a, b] = G.S.player.bags.map((x) => x.item);
  assert.strictEqual(a.pw, up.pw, 'the bought steps stay');
  assert.strictEqual(b.pw, h.pw, 'the old Hard copy gets its 2 steps');
});

test('an upgraded Hard copy is not cut back to 2 steps by G.regearItem (the one-time load rebuild and every bank withdrawal)', () => {
  const lost = [];
  for (const dk of raids()) for (const x of lootOf(dk)) {
    const h = G.hardCopy(x.id); if (!h.hard || !G.upgradeInfo(h).room) continue;
    const up = G.upgradedCopy(h, G.upgradeInfo(h).next); // what G.upgradeItem stores: the hard flag is kept
    const r = G.regearItem(up);
    if (!(r.pw >= up.pw - 1e-9)) lost.push(`${x.name}: ${up.pw} -> ${r.pw}`);
  }
  assert.deepStrictEqual(lost, [], `${lost.length} upgraded Hard copies lose the power they bought:\n${lost.join('\n')}`);
});

test('a Hard raid copy differs from the Normal drop in stats, armour or damage, not only in effect strength', () => {
  const same = [];
  for (const dk of raids()) for (const x of lootOf(dk)) {
    if (!D.GEAR_SLOTS.includes(x.slot) || !G.upgradeInfo(G.copyItem(x.id)).ok) continue;
    const n = G.copyItem(x.id), h = G.hardCopy(x.id);
    if (visible(h) === visible(n)) same.push(`${x.name} (${dk}): Hard ${visible(h)} = Normal`);
  }
  // Houndrunner Boots and Belt of the First Wave: stats round back to the drop's and the armour is held at the raid family's
  assert.deepStrictEqual(same, [], same.join('\n'));
});

test('an upgraded blue never ends with more armour than the newest raid\'s best piece of its slot and armour type', () => {
  const raid = lootOf(U.raid), over = [];
  for (const it of upgradable()) {
    if (it.q !== 3 || !it.armor) continue;
    const best = Math.max(0, ...raid.filter((x) => x.slot === it.slot && (x.atype || '') === (it.atype || '') && x.armor).map((x) => x.armor));
    if (!best || it.armor > best) continue; // a drop already above it keeps its own
    const top = G.upgradedCopy(G.copyItem(it.id), U.cap[it.q] * G.upgradeRef(G.copyItem(it.id)));
    if (top.armor > best) over.push(`${it.name}: ${it.armor} -> ${top.armor}, newest raid's ${it.slot} ${it.atype || ''} ${best}`);
  }
  // the families with no armour reference (effect items carry no spell power, so a cloth int piece is not in the caster
  // family the raid fills) still multiply armour by the stat ratio, as before #581: Robe of Ashen Mercy (Trial) 136 -> 150 vs Deepmother Robe 140
  assert.deepStrictEqual(over, [], over.join('\n'));
});

// ---------------------------------------------------------------- sweeps

test('every upgrade step of every item: nothing goes down, nothing is NaN, the percent shown is the percent reached', () => {
  let steps = 0;
  for (const it of upgradable()) {
    let cur = G.copyItem(it.id), i = 0; const ref = G.upgradeRef(cur);
    assert.ok(Number.isFinite(ref) && ref > 0, `${it.name}: ceiling ${ref}`);
    while (G.upgradeInfo(cur).room) {
      assert.ok(i++ < 40, it.name + ' never reaches its ceiling');
      const inf = G.upgradeInfo(cur), nx = G.upgradedCopy(cur, inf.next); steps++;
      assert.ok(Number.isFinite(inf.cost) && inf.cost > 0, `${it.name}: cost ${inf.cost}`);
      for (const k in cur.stats || {}) assert.ok(nx.stats[k] >= cur.stats[k], `${it.name} ${k} ${cur.stats[k]} -> ${nx.stats[k]}`);
      assert.ok((nx.sp || 0) >= (cur.sp || 0), it.name + ' spell power');
      assert.ok((nx.armor || 0) >= (cur.armor || 0), `${it.name} armour ${cur.armor} -> ${nx.armor}`);
      assert.ok(dps(nx) >= dps(cur) - 1e-9, `${it.name} dps ${dps(cur)} -> ${dps(nx)}`);
      if (nx.dmg) assert.ok(nx.dmg.every(Number.isFinite) && nx.dmg[0] <= nx.dmg[1], `${it.name} dmg ${nx.dmg}`);
      if (nx.armor != null) assert.ok(Number.isFinite(nx.armor), `${it.name} armour ${nx.armor}`);
      assert.strictEqual(G.upgradeInfo(nx).pct, inf.nextPct, `${it.name}: dialog said ${inf.nextPct}%`);
      cur = nx;
    }
    if (cur.pw) assert.ok(cur.pw <= U.cap[it.q] * ref + 0.01, `${it.name}: ${cur.pw} past its ceiling ${U.cap[it.q] * ref}`);
    if (cur.fxScale) assert.ok(cur.fxScale <= G.FX_SCALE_CAP, it.name + ' fxScale');
  }
  assert.ok(steps > 400, 'steps checked: ' + steps);
});

test('the upgrade the dialog previews is the one G.upgradeItem stores, for its shown cost; at the ceiling nothing is spent', () => {
  const { P } = W.character(60);
  for (const id of ['saltbones_cutlass', 'onyx_ring', 'graymouth_bow', 'archive_gloves', 'thornhide_belt_trial']) {
    if (!D.ITEMS[id]) continue;
    marks(5000); P.bags = [{ item: G.copyItem(id), n: 1 }];
    while (G.upgradeInfo(P.bags[0].item).room) {
      const it = P.bags[0].item, inf = G.upgradeInfo(it), preview = G.upgradedCopy(it, inf.next), before = G.account().marks;
      assert.ok(G.upgradeItem({ bag: 0 }));
      assert.strictEqual(before - G.account().marks, inf.cost, id + ' cost');
      assert.strictEqual(JSON.stringify(P.bags[0].item), JSON.stringify(preview), id + ' preview = result');
    }
    const at = G.account().marks;
    assert.strictEqual(G.upgradeItem({ bag: 0 }), false, id + ' at its ceiling');
    assert.strictEqual(G.account().marks, at, id + ': nothing spent at the ceiling');
  }
});

test('an upgraded (non-Hard) item rebuilt by G.regearItem is the same item', () => {
  for (const it of upgradable()) {
    let cur = G.copyItem(it.id); if (!G.upgradeInfo(cur).room) continue;
    cur = G.upgradedCopy(cur, U.cap[it.q] * G.upgradeRef(cur)); cur.kit = 0;
    assert.strictEqual(JSON.stringify(G.regearItem(cur)), JSON.stringify(cur), it.name);
  }
});

test('every Hard copy from every raid: finite numbers, never weaker than Normal, effect scale under the cap', () => {
  let n = 0;
  for (const dk of raids()) for (const x of lootOf(dk)) {
    if (!D.GEAR_SLOTS.includes(x.slot)) continue;
    const nm = G.copyItem(x.id), h = G.hardCopy(x.id); n++;
    assert.ok(G.itemPoints(h) >= G.itemPoints(nm), x.name + ' stats');
    assert.ok((h.armor || 0) >= (nm.armor || 0), x.name + ' armour');
    assert.ok(dps(h) >= dps(nm), x.name + ' dps');
    if (h.dmg) assert.ok(h.dmg.every(Number.isFinite), x.name);
    if (h.fxScale) assert.ok(h.fxScale > 1 && h.fxScale <= G.FX_SCALE_CAP, `${x.name} fxScale ${h.fxScale}`);
    if (h.hard) assert.strictEqual(JSON.stringify(G.regearItem(h)), JSON.stringify(h), x.name + ' rebuilt the same');
  }
  assert.ok(n > 50, 'checked ' + n);
});

test('every effect tooltip at levels 1-60 and every upgrade scale: no NaN or undefined, and its numbers are the engine\'s', () => {
  const nums = (s) => (s.match(/\d+(?:\.\d+)?/g) || []).map(Number);
  for (const k in D.EFFECTS) {
    const F = D.EFFECTS[k];
    for (let L = 1; L <= 60; L++) for (const sc of [undefined, 1, 1.03, 1.07, 1.12, 1.26, 1.5, 2]) {
      const f = D.fxGrow(sc, k), s = F.desc(L, f);
      assert.ok(!/NaN|undefined|Infinity/.test(s), `${k} L${L} ${sc}: ${s}`);
      assert.ok(f >= 1 && f <= Math.pow(1.5, F.grow || D.FX_GROW) + 1e-9, `${k} grow ${f}`);
      const has = (v, what) => assert.ok(nums(s).includes(v), `${k} L${L} f${f}: tooltip lacks ${what} ${v}: ${s}`);
      if (k === 'opening_cut') has(F.bonus(L, f), 'bonus');
      if (k === 'turning_guard') has(F.absorb(L, f), 'absorb');
      if (k === 'spiteful_hide') has(F.dmg(L, f), 'damage');
      if (k === 'kindled_edge') has(F.tick(L, f) * Math.floor(F.dur / F.every), 'total over its ticks');
      if (k === 'glass_heart') has(Math.round(F.dmg * f * 1000) / 10, 'damage %');
      if (k === 'steady_fuse') has(Math.round(F.icd / f), 'interval');
    }
  }
});

test('the engine reads an upgraded effect item at the strength its tooltip uses', () => {
  for (const it of upgradable().filter((x) => G.effectOf(x))) {
    const top = G.upgradedCopy(G.copyItem(it.id), U.cap[it.q] * G.upgradeRef(G.copyItem(it.id)));
    const fx = W.E.itemEffects({ equip: { [top.slot]: top } })[top.effect];
    assert.ok(fx, it.name + ' read by the engine');
    assert.strictEqual(fx.f, D.fxGrow(top.fxScale, top.effect), it.name);
    assert.strictEqual(fx.lvl, top.lvl || 1, it.name);
  }
});

test('effect items: no effect costs more than 60% of the stats, and every effect item keeps at least 40% of its budget', () => {
  for (const k in D.EFFECTS) assert.ok(D.effectCost(k) <= D.EFFECT_COST_MAX + 1e-9, k);
  for (const it of Object.values(D.ITEMS)) {
    if (!it.effect || !it.fxBudget) continue;
    const pts = G.itemPoints(it);
    assert.ok(pts >= Math.floor(it.fxBudget * (1 - D.EFFECT_COST_MAX)), `${it.name}: ${pts} of ${it.fxBudget}`);
    assert.ok(D.EFFECTS[it.effect], it.name + ' effect exists');
  }
});

test('the 30 hand-made gear-gap items (#535): wearable by a class of their role, with stats, armour or damage', () => {
  const ids = ['tidehollow_sash', 'cinder_sash', 'cinder_ring', 'cinder_legs', 'coinworks_cuffs', 'coinworks_band', 'greyhowl_cuffs', 'gemfall_leggings', 'gemfall_mace', 'magma_bow', 'veshmira_mace', 'gaol_sandals', 'library_gloves', 'library_grips', 'library_band', 'cathedral_leggings', 'cathedral_cord', 'cathedral_slippers', 'cathedral_bindings', 'cathedral_belt', 'cathedral_mace', 'cloister_leggings', 'cloister_belt', 'graymouth_bow', 'graymouth_mace', 'archive_gloves', 'tidecrown_girdle', 'tidecrown_boots', 'dune_sash', 'dune_bracers'];
  const { P } = W.character(60);
  for (const id of ids) {
    const it = D.ITEMS[id]; assert.ok(it, id);
    assert.ok(G.itemPoints(it) > 0, id + ' has stats');
    if (it.slot === 'weapon' || it.slot === 'ranged') assert.ok(dps(it) > 0, id + ' damage');
    else if (it.slot !== 'finger') assert.ok(it.armor > 0, id + ' armour');
    assert.ok(Object.values(D.MOBS).some((m) => (m.loot || []).includes(id)), id + ' drops somewhere');
    const users = Object.keys(D.CLASSES).filter((c) => { P.cls = c; return G.canUseItem(it); });
    assert.ok(users.length, id + ' some class can use it');
    // the item's main stats are ones a class that can wear it scores (it is someone's upgrade)
    assert.ok(users.some((c) => G.itemScore(it, c) > 0), id);
  }
  P.cls = 'warrior';
});

test('a druid tank scores tank leather over a caster cloth piece of the same level; a druid healer the reverse', () => {
  const tank = D.ITEMS.cloister_belt, cloth = D.ITEMS.cloister_leggings && Object.values(D.ITEMS).find((x) => x.slot === 'waist' && x.atype === 'cloth' && x.sp && Math.abs((x.lvl || 0) - 58) <= 5 && x.q === 3);
  assert.ok(tank && cloth, 'items');
  assert.ok(G.itemScore(tank, 'druid', 'tank') > G.itemScore(cloth, 'druid', 'tank'), 'tank');
  assert.ok(G.itemScore(cloth, 'druid', 'healer') > G.itemScore(tank, 'druid', 'healer'), 'healer');
});
