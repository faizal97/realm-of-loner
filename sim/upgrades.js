// Gear upgrades (v10.3): Mentor Marks raise a level-57+ blue or purple item 3% of the ceiling at a time, up to the
// ceiling (purples 100%, blues 92%). An item stores the power it reached (it.pw), so a new ceiling never changes it.
// Design: docs/plans/2026-09-30-horizontal-progression-design.md. node sim/upgrades.js
require('./_seed.js'); // seeded (#125): the same commit always gives the same result; SEED=n picks other dice
globalThis.localStorage = (() => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; })();
require('../src/data.js'); require('../src/engine.js'); require('../src/bots.js'); require('../src/game.js');
const { G, D } = globalThis;
let bad = 0, n = 0; const ok = (c, m) => { n++; if (!c) { bad++; console.log('FAIL ' + m); } };
G.newGame({ name: 'U', cls: 'warrior', race: 'human' }); G.S.player.level = 60;
const U = D.UPGRADE, loot = (raid) => { const s = new Set(); for (const p of D.DUNGEONS[raid].pulls) for (const m of p.mobs) for (const i of (D.MOBS[m].loot || [])) s.add(i); return [...s].map(G.copyItem); };
const climb = (it) => { let x = it, k = 0; while (G.upgradeInfo(x).room && k < 200) { x = G.upgradedCopy(x, G.upgradeInfo(x).next); k++; } return { top: x, steps: k }; };
const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;

// who can upgrade
const mc = loot('molten_core'), strat = loot('stratholme');
const atCap = (it) => !G.upgradeInfo(it).room;
ok(mc.every((it) => G.upgradeInfo(it).room || atCap(it)), 'every Magma Throne item has room, unless it is already at the ceiling');
ok(!G.upgradeInfo(G.genGear('chest', 60, 2)).ok, 'greens never upgrade');
ok(!G.upgradeInfo(G.copyItem('worn_shortsword')).ok, 'low-level items never upgrade');
ok(!G.upgradeInfo(G.makeHeirloom('heirloom_blade', 60)).ok, 'heirlooms never upgrade');
const steps = {}; for (const it of mc) { const k = climb(it).steps; steps[k] = (steps[k] || 0) + 1; }
console.log('Magma Throne steps to the ceiling (steps: items):', JSON.stringify(steps));
ok(mc.every((it) => atCap(it) || (climb(it).steps >= 1 && climb(it).steps <= 6)), 'Magma Throne items take 1-6 steps (design: about 3-4)');

// the math: climbing lands on the cap, never above it; weapons gain damage too; the label stays a sane percentage
for (const it of mc.concat(strat).filter((x) => G.upgradeInfo(x).room)) {
  const { top } = climb(it), ref = G.upgradeRef(it), inf = G.upgradeInfo(top);
  ok(Math.abs(G.itemPoints(top) - U.cap[it.q] * ref) <= 1.5, `${it.name} tops out at the cap (${G.itemPoints(top)} vs ${(U.cap[it.q] * ref).toFixed(1)})`);
  ok(G.itemPoints(G.upgradedCopy(top, top.pw + 50)) === G.itemPoints(top), `${it.name} cannot pass the cap`);
  ok(inf.pct === inf.capPct && inf.pct <= 100, `${it.name} reads ${inf.pct}% at the top (cap ${inf.capPct}%)`);
  if (it.dmg) ok(top.dmg[1] > it.dmg[1], `${it.name} weapon damage rises too`);
}
const mcTop = avg(mc.filter((it) => !atCap(it)).map((it) => G.itemPoints(climb(it).top) / G.upgradeRef(it)));
ok(mcTop >= 0.97, `upgraded Magma Throne reaches ${(mcTop * 100).toFixed(0)}% of the ceiling`);
const blueTop = avg(strat.filter((it) => it.q === 3 && G.upgradeInfo(it).room).map((it) => G.itemPoints(climb(it).top) / G.upgradeRef(it)));
ok(blueTop <= 0.93, `upgraded blues stop lower (${(blueTop * 100).toFixed(0)}%)`);
ok(mc.every((it) => { const i = G.upgradeInfo(it); return !i.room || (i.cost >= 15 && i.cost <= 23); }), 'a step costs 15 Marks (a last step that finishes the climb up to half more)');

// old saves: an item without it.pw is itself
const sword = mc.find((it) => it.dmg && G.upgradeInfo(it).room);
ok(JSON.stringify(G.upgradedCopy(sword, G.itemPoints(sword)).stats) === JSON.stringify(sword.stats), 'its own power changes nothing');

// a new ceiling raid never changes an item on its own (it keeps its power; only the percentage and the room change)
const once = G.upgradedCopy(sword, G.upgradeInfo(sword).next), before = JSON.stringify(G.upgradedCopy(once, once.pw).stats), pctBefore = G.upgradeInfo(once).pct;
const realRaid = U.raid; U.raid = 'molten_core'; G.upgradeRef.reset(); const lowRef = G.upgradeRef(once);
U.raid = realRaid; G.upgradeRef.reset(); const hiRef = G.upgradeRef(once);
ok(JSON.stringify(G.upgradedCopy(once, once.pw).stats) === before, 'a ceiling move leaves an upgraded item as it was');
ok(hiRef > lowRef && G.upgradeInfo(once).pct === pctBefore, 'a higher ceiling means a lower percentage, never free power');

// spending: equipped and bag items, Marks taken, refused without enough Marks
const P = G.S.player, a0 = G.account(); a0.marks = 100; G.saveAccount(a0);
P.equip.weapon = G.copyItem(sword.id); const dmgBefore = P.equip.weapon.dmg[1];
ok(G.upgradeItem({ slot: 'weapon' }) === true && P.equip.weapon.pw > 0 && P.equip.weapon.dmg[1] > dmgBefore, 'equipped weapon goes up a step');
ok(G.account().marks === 85, 'the step cost 15 Marks');
G.addItem(G.copyItem(mc.find((it) => !it.dmg && G.upgradeInfo(it).room).id), 1); const bi = P.bags.length - 1;
ok(G.upgradeItem({ bag: bi }) === true && P.bags[bi].item.pw > 0, 'a bag item goes up a step');
const a1 = G.account(); a1.marks = 0; G.saveAccount(a1); const pw1 = P.equip.weapon.pw;
ok(G.upgradeItem({ slot: 'weapon' }) === false && P.equip.weapon.pw === pw1, 'no Marks, no step');
ok(!G.upgradeInfo(P.equip.chest).ok, 'starting gear cannot be upgraded');
const saved = JSON.parse(JSON.stringify(P.equip.weapon)); ok(saved.pw === pw1 && saved.base && G.upgradeInfo(saved).pts === pw1, 'the power survives a save');

// income: a level-60 dungeon clear pays 5, a raid 15; levelling dungeons nothing
ok(G.clearMarks('stratholme') === 5 && G.clearMarks('molten_core') === 15, 'level-60 clears pay Marks');
ok(G.clearMarks('deadmines') === 0, 'levelling dungeons pay none');
ok(Math.ceil(15 / G.clearMarks('stratholme')) <= 5, 'a step takes at most 5 dungeon runs');


// random gear matches the hand-made items of its quality (v10.4: random blues had 70% more stats and beat raid purples)
{
  const named = (q) => { const a = Object.values(D.ITEMS).filter((it) => D.GEAR_SLOTS.includes(it.slot) && it.q === q && it.lvl >= 55 && !it.sp && !it.heirloom && !it.lookOnly && !it.effect).map((it) => G.itemPoints(it)); return a.reduce((x, y) => x + y, 0) / a.length; };
  const rand = (q) => { let s = 0; for (let i = 0; i < 60; i++) s += G.itemPoints(G.genGear(['chest', 'legs', 'hands', 'back', 'finger', 'wrist'][i % 6], 60, q)); return s / 60; };
  const b = rand(3) / named(3), p = rand(4) / named(4);
  ok(b > 0.85 && b < 1.15, `a random level-60 blue is about as strong as a named one (${(b * 100).toFixed(0)}%)`);
  ok(p > 0.85 && p < 1.15, `a random level-60 purple is about as strong as a named one (${(p * 100).toFixed(0)}%)`);
  ok(rand(3) < named(4), 'a random blue stays below raid purples');
}
// the Bags dot (v10.9, issue #11): an upgrade landing in your bags lights it, opening Bags clears it, and so does
// wearing or selling the upgrade first; a plain item never lights it
{
  G.newGame({ name: 'B', cls: 'mage', race: 'undead' }); const P = G.S.player;
  const robe = Object.keys(D.ITEMS).find((id) => { const it = D.ITEMS[id]; return it.slot === 'chest' && G.isUpgrade(G.copyItem(id)); });
  G.addItem(G.copyItem('linen_cloth'), 3); ok(!G.bagDot(), 'a plain item does not light the Bags dot');
  G.addItem(G.copyItem(robe), 1); ok(G.bagDot(), `an upgrade (${robe}) lights the Bags dot`);
  P.bagUpgrade = false; ok(!G.bagDot(), 'opening Bags clears it');
  G.addItem(G.copyItem(robe), 1); G.equip(P.bags.findIndex((b) => b.item.id === robe)); P.bags = P.bags.filter((b) => b.item.id !== robe);
  ok(!G.bagDot(), 'wearing the upgrade before opening Bags clears it');
  // a new effect item lights it too, like an upgrade (#23); one your class can't use doesn't; opening Bags clears it
  const cloth = Object.keys(D.ITEMS).find((id) => D.ITEMS[id].effect && D.ITEMS[id].atype === 'cloth' && (D.ITEMS[id].lvl || 1) <= P.level + 60);
  const mail = Object.keys(D.ITEMS).find((id) => D.ITEMS[id].effect && D.ITEMS[id].atype === 'mail');
  G.seenBags(); G.addItem(G.copyItem(mail), 1); ok(!G.bagDot(), `an effect item a mage can't wear (${mail}) does not light it`);
  G.addItem(G.copyItem(cloth), 1); ok(G.bagDot(), `a new effect item (${cloth}) lights the Bags dot`);
  G.seenBags(); ok(!G.bagDot() && !P.bags.some((b) => b.item.fxNew), 'opening Bags clears it, and the item is no longer new');
}
// dungeon bonus gear fits the class (v10.9, issue #13): 2,000 rolls per class for each bonus are all wearable, the made
// pieces carry the class's affix; a reward with full bags goes to the bank with a chat line
{
  const dg = D.DUNGEONS[D.ACTIVITIES.deadmines.dungeon];
  for (const cls of Object.keys(D.CLASSES)) {
    G.newGame({ name: 'F', cls, race: 'human' }); G.S.player.level = 20;
    const aff = G.classAffix(cls), keys = Object.keys(aff.stats);
    let wear = 0, affix = 0, made = 0, blue = 0; const N = 2000;
    for (let i = 0; i < N; i++) {
      const g = G.fittedGear(20, 2, cls); if (G.canUseItem(g, cls)) wear++; if (g.stats) { made++; if (Object.keys(g.stats).every((k) => keys.includes(k))) affix++; }
      if (G.canUseItem(G.fittedBossBlue(dg, 20, cls), cls)) blue++;
    }
    ok(wear === N && blue === N, `${cls}: every Flawless/Speed piece and boss blue can be worn (${wear}/${N}, ${blue}/${N})`);
    ok(affix === made, `${cls}: every made piece carries ${aff.name} (${affix}/${made})`);
  }
  G.newGame({ name: 'Full', cls: 'mage', race: 'human' }); const P = G.S.player; P.level = 20;
  while (!G.bagsFull()) P.bags.push({ item: G.copyItem('worn_dagger'), n: 1 });
  const before = (P.bank || []).length, chat0 = G.S.chat.length, it = G.fittedGear(20, 2, 'mage');
  ok(G.giveReward(it, 'Flawless clear') === 'bank' && (P.bank || []).length === before + 1, 'a reward with full bags goes to the bank');
  ok(G.S.chat.slice(chat0).some((m) => /went to your bank/.test(m.text)), 'and chat says so');
}
console.log(`upgrades: ${n - bad}/${n} checks pass`);
process.exit(bad ? 1 : 0);
