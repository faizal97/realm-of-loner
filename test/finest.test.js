// Season's Finest (#593): the engine behind Hero → Season's Finest. Rows per class and role with their state, Hint and
// Reveal, found by any path (loot, the load scan), seen from a tooltip, found blind and the season's title.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character, setNow } = require('./world');

const IN_SEASON = new Date(2026, 10, 15, 12).getTime(), BEFORE = new Date(2026, 10, 11, 12).getTime();
const S1 = () => D.FINEST_SEASONS.find((s) => s.id === 1);
// the season's lists for the character's faction (a human is 'alliance'), or a named one
const BEST = (k, f) => S1().best[f || G.myFaction()][k], UNTIL = (k, f) => S1().until[f || G.myFaction()][k];
const ROW_KEYS = ['slot', 'tier', 'id', 'state', 'hinted', 'revealed', 'blind', 'where', 'boss', 'chance'].sort();
const fresh = (cls) => { setNow(IN_SEASON); return character(60, cls || 'mage'); };
// the account's record carries across characters; a test that needs a clean one starts here
const clean = (cls) => { const r = fresh(cls); const a = G.account(); delete a.finest; G.saveAccount(a); return r; };
const row = (cls, role, slot, tier) => G.finest(cls, role).rows.find((r) => r.slot === slot && r.tier === tier);

test('the API shape: the live season, roles in order, rows in gear-slot order', () => {
  fresh('druid');
  assert.strictEqual(G.finestSeason().id, 1);
  assert.deepStrictEqual(G.finestRoles('druid'), ['healer', 'tank', 'dps']);
  const f = G.finest('druid', 'tank');
  assert.deepStrictEqual(Object.keys(f).sort(), ['blind', 'done', 'found', 'lost', 'rows', 'season', 'tally', 'title', 'titleEarned', 'total']);
  assert.strictEqual(f.total.best, Object.keys(BEST('druid:tank')).length);
  assert.strictEqual(f.total.until, Object.keys(UNTIL('druid:tank')).length);
  assert.strictEqual(f.rows.length, f.total.best + f.total.until);
  const order = f.rows.map((r) => D.GEAR_SLOTS.indexOf(r.slot) * 2 + (r.tier === 'best' ? 0 : 1));
  assert.deepStrictEqual(order, order.slice().sort((a, b) => a - b));
  for (const r of f.rows) assert.deepStrictEqual(Object.keys(r).sort(), ROW_KEYS);
});

test('unknown, then hint, then reveal exposes only what each step names', () => {
  fresh('mage');
  const slot = 'weapon', id = BEST('mage:dps')[slot];
  let r = row('mage', 'dps', slot, 'best');
  assert.deepStrictEqual([r.state, r.id, r.hinted, r.revealed, r.where, r.boss, r.chance], ['unknown', null, false, false, null, null, null]);
  assert.strictEqual(G.finestHint('mage', 'dps', slot, 'best'), true);
  assert.strictEqual(G.finestHint('mage', 'dps', slot, 'best'), false, 'a second hint changes nothing');
  r = row('mage', 'dps', slot, 'best');
  assert.strictEqual(r.hinted, true); assert.strictEqual(r.id, null); assert.strictEqual(r.boss, null); assert.strictEqual(r.chance, null);
  assert.ok(typeof r.where === 'string' && r.where.length);
  assert.strictEqual(G.finestReveal('mage', 'dps', slot, 'best'), true);
  r = row('mage', 'dps', slot, 'best');
  assert.strictEqual(r.revealed, true); assert.strictEqual(r.id, id); assert.ok(r.boss);
  assert.ok(r.chance > 0 && r.chance <= 1);
  // the chance is the real one: a boss drops 2 of its table each kill, and the season roll one piece of its pool
  const mk = Object.keys(D.MOBS).find((k) => D.MOBS[k].name === r.boss && (D.MOBS[k].loot || []).concat(D.MOBS[k].finest || []).includes(id)), M = D.MOBS[mk];
  const raid = Object.values(D.DUNGEONS).some((Dg) => Dg.raid && Dg.pulls.some((p) => p.mobs[0] === mk)), a = (M.loot || []).includes(id) ? Math.min(1, 2 / M.loot.length) : 0;
  assert.ok(Math.abs(r.chance - (1 - (1 - a) * (1 - G.finestRollOdds(mk, raid, id)))) < 1e-9);
});

test('reveal alone implies hint', () => {
  fresh('mage');
  assert.strictEqual(G.finestReveal('mage', 'dps', 'chest', 'until'), true);
  const r = row('mage', 'dps', 'chest', 'until');
  assert.strictEqual(r.hinted, true); assert.strictEqual(r.revealed, true);
  assert.strictEqual(G.finestHint('mage', 'dps', 'nope', 'best'), false, 'a row that is not listed');
});

test('a loot pickup marks found, blind only when not hinted', () => {
  fresh('mage');
  const L = BEST('mage:dps');
  G.finestHint('mage', 'dps', 'chest', 'best');
  G.giveLoot({ money: 0, items: [G.copyItem(L.weapon), G.copyItem(L.chest)] });
  const w = row('mage', 'dps', 'weapon', 'best'), c = row('mage', 'dps', 'chest', 'best');
  assert.strictEqual(w.state, 'found'); assert.strictEqual(w.blind, true); assert.strictEqual(w.id, L.weapon); assert.ok(w.boss && w.chance > 0);
  assert.strictEqual(c.state, 'found'); assert.strictEqual(c.blind, false);
  const f = G.finest('mage', 'dps');
  assert.strictEqual(f.found.best, 2); assert.strictEqual(f.blind.best, 1);
  assert.strictEqual(G.finestHint('mage', 'dps', 'weapon', 'best'), false, 'a found row takes no hint');
  assert.strictEqual(G.weekStepDone({ check: ['finest', 1] }), true);
});

test('finestSee marks seen for the class, and only items in its lists', () => {
  fresh('mage');
  const id = UNTIL('mage:dps').chest;
  assert.strictEqual(G.finestSee(id), true);
  assert.strictEqual(G.finestSee(id), false);
  const r = row('mage', 'dps', 'chest', 'until');
  assert.strictEqual(r.state, 'seen'); assert.strictEqual(r.id, id); assert.ok(r.where); assert.strictEqual(r.boss, null);
  assert.strictEqual(G.finestSee('linen_cloth'), false);
  assert.strictEqual(G.finestSee(BEST('warrior:tank').chest), false, 'another class\'s piece');
  // seen, then found unhinted: blind
  G.addItem(G.copyItem(id), 1);
  assert.strictEqual(row('mage', 'dps', 'chest', 'until').blind, true);
});

test('every Best piece of one class role found blind gives that role\'s title once, and counts in the tally', () => {
  const { P } = clean('mage');
  const t = D.TITLES.find((x) => x.id === S1().titles.dps), tank = D.TITLES.find((x) => x.id === S1().titles.tank);
  assert.strictEqual(G.titleUnlocked(t), false);
  const before = G.finestTally().done.length;
  for (const id of Object.values(BEST('mage:dps'))) G.addItem(G.copyItem(id), 1);
  const F = G.finest('mage', 'dps');
  assert.strictEqual(F.titleEarned, true); assert.strictEqual(F.done, true);
  assert.strictEqual(G.titleUnlocked(t), true); assert.strictEqual(G.titleUnlocked(tank), false, 'only the damage title');
  assert.ok(G.finestTally().done.includes('mage:dps')); assert.strictEqual(G.finestTally().done.length, before + 1);
  G.setTitle(t.id); assert.strictEqual(P.title, t.id);
  assert.strictEqual(G.S.chat.filter((m) => /Tidebreaker/.test(m.text || '')).length, 1);
});

test('the record is the account\'s: another character of another class wears the title, and the account file grows it', () => {
  clean('mage');
  for (const id of Object.values(BEST('mage:dps'))) G.addItem(G.copyItem(id), 1);
  fresh('rogue');
  const t = D.TITLES.find((x) => x.id === S1().titles.dps);
  assert.strictEqual(G.titleUnlocked(t), true, 'earned on the mage, worn by the rogue');
  assert.strictEqual(G.finest('rogue', 'dps').done, false, 'the rogue\'s own class role is still open');
  require('../src/cloud.js'); const m = globalThis.CLOUD.mergeAccount({ finest: { 1: { 'mage:dps': 1 } } }, { finest: { 1: { 'rogue:dps': 1 } } });
  assert.deepStrictEqual(Object.keys(m.finest[1]).sort(), ['mage:dps', 'rogue:dps']);
});

test('no title when one Best row was hinted', () => {
  clean('mage');
  const t = D.TITLES.find((x) => x.id === S1().titles.dps);
  G.finestHint('mage', 'dps', 'feet', 'best');
  for (const id of Object.values(BEST('mage:dps'))) G.addItem(G.copyItem(id), 1);
  assert.strictEqual(G.finest('mage', 'dps').found.best, G.finest('mage', 'dps').total.best);
  assert.strictEqual(G.titleUnlocked(t), false);
  G.setTitle(t.id); assert.notStrictEqual(G.S.player.title, t.id);
});

test('an old save without the field loads, and load marks owned items found', () => {
  const { S, P } = fresh('mage');
  const L = BEST('mage:dps');
  delete P.finest;
  P.equip.weapon = G.copyItem(L.weapon);
  P.bank = (P.bank || []).concat([{ item: G.copyItem(L.chest), n: 1 }]);
  G.save(); const id = S.id; G.logout();
  G.load(id);
  assert.ok(G.S && G.S.player);
  assert.strictEqual(row('mage', 'dps', 'weapon', 'best').state, 'found');
  assert.strictEqual(row('mage', 'dps', 'chest', 'best').state, 'found');
  assert.strictEqual(row('mage', 'dps', 'hands', 'best').state, 'unknown');
  // a damaged field is repaired, never thrown on
  G.S.player.finest = { 1: { seen: null } };
  assert.doesNotThrow(() => G.finest('mage', 'dps'));
});

test('finestMark: best before until, across every role of the class', () => {
  fresh('druid');
  const s = S1();
  assert.strictEqual(G.finestMark(s.best[G.myFaction()]['druid:tank'].weapon), 'best');
  const onlyUntil = Object.values(s.until[G.myFaction()]['druid:healer']).find((id) => !['healer', 'tank', 'dps'].some((r) => Object.values(s.best[G.myFaction()]['druid:' + r]).includes(id)));
  assert.strictEqual(G.finestMark(onlyUntil), 'until');
  assert.strictEqual(G.finestMark('linen_cloth'), null);
  assert.strictEqual(G.finestMark(s.best[G.myFaction()]['warrior:tank'].chest), null, 'mail is not a druid\'s');
});

test('before the season starts: empty results, nothing thrown', () => {
  character(60, 'mage'); setNow(BEFORE);
  assert.strictEqual(G.finestSeason(), null);
  assert.deepStrictEqual(G.finestRoles('mage'), []);
  const f = G.finest('mage', 'dps');
  assert.strictEqual(f.season, null); assert.deepStrictEqual(f.rows, []); assert.strictEqual(f.titleEarned, false);
  assert.strictEqual(G.finestHint('mage', 'dps', 'weapon', 'best'), false);
  assert.strictEqual(G.finestReveal('mage', 'dps', 'weapon', 'best'), false);
  assert.strictEqual(G.finestMark(BEST('mage:dps').weapon), null);
  assert.strictEqual(G.finestSee(BEST('mage:dps').weapon), false);
  assert.strictEqual(G.addItem(G.copyItem(BEST('mage:dps').weapon), 1), true);
  assert.strictEqual(G.weekStepDone({ check: ['finest', 1] }), false);
});

// where an item drops: the factions whose characters can enter one of its dungeons (null: any faction) (#593)
const dropFactions = (id) => { const out = new Set();
  for (const act in D.ACTIVITIES) { const A = D.ACTIVITIES[act], Dg = A.dungeon && D.DUNGEONS[A.dungeon]; if (!Dg || A.worldBoss || A.event) continue;
    for (const p of Dg.pulls) for (const m of p.mobs) { const M = D.MOBS[m] || {}; if ((M.loot || []).concat(M.finest || []).includes(id) || (M.drops || []).some((d) => d[0] === id)) out.add(A.where ? G.placeFaction(A.where) || null : null); } }
  return out; };

test('picks are per faction: every piece drops where that faction can go, and a Hint names only such a place', () => {
  const s = S1();
  for (const f of ['alliance', 'horde']) for (const tier of ['best', 'until']) {
    assert.ok(Object.keys(s[tier][f]).length > 0, `${f} ${tier} has lists`);
    for (const key in s[tier][f]) for (const slot in s[tier][f][key]) {
      const id = s[tier][f][key][slot], fs = dropFactions(id);
      assert.ok(fs.has(null) || fs.has(f), `${f} ${tier} ${key} ${slot}: ${id} drops only where ${f} can't go`);
    }
  }
  const other = { alliance: "Temple of Shal'zua", horde: 'The Sunken Archive' };
  for (const race of ['human', 'orc']) {
    setNow(IN_SEASON); const { P } = character(60, 'priest', race); delete P.finest;
    const f = G.myFaction();
    for (const role of G.finestRoles('priest')) for (const r of G.finest('priest', role).rows) {
      G.finestHint('priest', role, r.slot, r.tier);
      const w = row('priest', role, r.slot, r.tier).where;
      assert.ok(w && w !== other[f], `${race} ${role} ${r.slot} ${r.tier}: Hint names ${w}`);
    }
  }
});

test('the Account bank never counts: not found on load, and a piece taken out is Found but not Found blind', () => {
  const { S, P } = clean('mage');
  const id = BEST('mage:dps').weapon;
  delete P.finest; delete P.equip.weapon;
  P.bank = []; P.bags = [{ item: G.copyItem(id), n: 1 }];
  if (!G.abankDeposit(0)) { const b = G.abank(); globalThis.ABANK.deposit(b, G.copyItem(id), 1, false); const a = G.account(); a.bank = b; G.saveAccount(a); P.bags = []; }
  G.save(); const cid = S.id; G.logout(); G.load(cid);
  assert.strictEqual(row('mage', 'dps', 'weapon', 'best').state, 'unknown', 'in the Account bank: not this character\'s');
  const key = globalThis.ABANK.view(G.abank()).find((x) => x.item && x.item.id === id).key;
  assert.strictEqual(G.abankWithdraw(key), true);
  const r = row('mage', 'dps', 'weapon', 'best');
  assert.strictEqual(r.state, 'found'); assert.strictEqual(r.blind, false, 'from another character: found, never blind');
});

test('a Hint or Reveal is on the piece: it ends Found blind on every role of the class that lists it', () => {
  // a druid piece that is Best for two roles
  clean('druid');
  const roles = G.finestRoles('druid');
  let pick = null;
  for (const a of roles) for (const b of roles) if (!pick && a !== b) for (const sa in BEST('druid:' + a)) { const sb = Object.keys(BEST('druid:' + b)).find((x) => BEST('druid:' + b)[x] === BEST('druid:' + a)[sa]); if (sb) { pick = { a, b, sa, sb, id: BEST('druid:' + a)[sa] }; break; } }
  assert.ok(pick, 'a shared Best piece exists');
  const cost = G.finestHintCost('druid', pick.a, pick.sa, 'best').map((x) => x.role);
  assert.ok(cost.includes(pick.a) && cost.includes(pick.b), 'the warning names both roles');
  assert.ok(G.finestHintCost('druid', pick.a, pick.sa, 'best').every((x) => D.TITLES.some((t) => t.id === x.title)));
  assert.strictEqual(G.finestHint('druid', pick.a, pick.sa, 'best'), true);
  assert.strictEqual(row('druid', pick.b, pick.sb, 'best').hinted, true, 'the other role shows the Hint too');
  assert.deepStrictEqual(G.finestHintCost('druid', pick.b, pick.sb, 'best'), [], 'nothing left to end');
  G.addItem(G.copyItem(pick.id), 1);
  assert.strictEqual(row('druid', pick.a, pick.sa, 'best').blind, false);
  assert.strictEqual(row('druid', pick.b, pick.sb, 'best').blind, false, 'not blind on the other role either');
  assert.strictEqual(G.finest('druid', pick.a).lost, true); assert.strictEqual(G.finest('druid', pick.b).lost, true);
  // a save from before the fix hinted one row only: the piece still is not blind on the other
  clean('druid'); G.S.player.finest = { 1: { seen: {}, found: {}, hint: { [`${pick.a}|${pick.sa}|best`]: 1 }, reveal: {}, blind: {} } };
  G.addItem(G.copyItem(pick.id), 1);
  assert.strictEqual(row('druid', pick.b, pick.sb, 'best').blind, false);
});

test('a veteran: pieces held before the season count as Found on load, never Found blind, and give no title', () => {
  const { S, P } = clean('mage');
  const t = D.TITLES.find((x) => x.id === S1().titles.dps);
  delete P.finest; P.bank = [];
  for (const id of Object.values(BEST('mage:dps'))) P.bank.push({ item: G.copyItem(id), n: 1 });
  G.save(); const cid = S.id; G.logout(); G.load(cid);
  const F = G.finest('mage', 'dps');
  assert.strictEqual(F.found.best, F.total.best); assert.strictEqual(F.blind.best, 0);
  assert.strictEqual(F.done, false); assert.strictEqual(F.lost, true);
  assert.strictEqual(G.titleUnlocked(t), false, 'no title on first login');
  // a piece looted in the season is found blind
  const { P: P2 } = clean('mage'); delete P2.finest;
  G.giveLoot({ money: 0, items: [G.copyItem(BEST('mage:dps').chest)] });
  assert.strictEqual(row('mage', 'dps', 'chest', 'best').blind, true);
  assert.strictEqual(G.finest('mage', 'dps').lost, false);
});

// ---- full lists and the season roll (#593)
const slotsOf = (cls) => D.GEAR_SLOTS.filter((s) => s !== 'ranged' || D.CLASSES[cls].ranged || D.CLASSES[cls].instrument);
const bossOf = (dk) => D.DUNGEONS[dk].pulls.filter((p) => p.boss).map((p) => p.mobs[0]);

test('every list is full: each class role, each faction, a Best and a Next best piece in every slot the class uses', () => {
  const s = S1();
  for (const f of ['alliance', 'horde']) for (const cls in D.CLASSES) for (const role of D.CLASSES[cls].roles || [D.CLASSES[cls].role]) {
    const key = cls + ':' + role, b = s.best[f][key] || {}, u = s.until[f][key] || {};
    assert.deepStrictEqual(Object.keys(b).sort(), slotsOf(cls).sort(), `${f} best ${key}`);
    assert.deepStrictEqual(Object.keys(u).sort(), slotsOf(cls).sort(), `${f} until ${key}`);
    for (const sl in b) assert.notStrictEqual(b[sl], u[sl], `${f} ${key} ${sl}: one piece in both tiers`);
  }
});

test('Best keeps some of the newest raid for every class role, and spreads the rest over older content', () => {
  const s = S1(), tc = new Set(bossOf('tidecrown_citadel').flatMap((m) => (D.MOBS[m].loot || []).concat(D.MOBS[m].finest || [])));
  let all = 0, inTc = 0;
  for (const f of ['alliance', 'horde']) for (const key in s.best[f]) {
    const ids = Object.values(s.best[f][key]), n = ids.filter((id) => tc.has(id)).length;
    assert.ok(n >= 1, `${f} ${key}: no Best piece from The Tidecrown Citadel`);
    all += ids.length; inTc += n;
  }
  assert.ok(inTc / all < 0.6, `the newest raid is ${Math.round((inTc / all) * 100)}% of Best`);
});

test('season pieces never sit in a boss table, and never move an older item\'s Mentor Mark ceiling', () => {
  for (const k in D.MOBS) for (const id of D.MOBS[k].loot || []) assert.ok(!(D.ITEMS[id] || {}).finest, `${k} table holds season piece ${id}`);
  const old = Object.keys(D.ITEMS).filter((id) => { const it = D.ITEMS[id]; return !it.finest && D.GEAR_SLOTS.includes(it.slot) && it.lvl >= 57 && it.q >= 3; });
  G.upgradeRef.reset(); const withS = old.map((id) => G.upgradeRef(D.ITEMS[id]));
  const kept = {}; for (const k in D.MOBS) if (D.MOBS[k].finest) { kept[k] = D.MOBS[k].finest; delete D.MOBS[k].finest; }
  G.upgradeRef.reset(); const without = old.map((id) => G.upgradeRef(D.ITEMS[id]));
  for (const k in kept) D.MOBS[k].finest = kept[k];
  G.upgradeRef.reset();
  assert.deepStrictEqual(withS, without);
});

test('a Best season piece sits at its newest-raid ceiling; a Next best one at its place\'s share, below it', () => {
  for (const id in D.ITEMS) { const it = D.ITEMS[id]; if (!it.finest) continue;
    const pts = G.itemPoints(it), ref = G.upgradeRef(it);
    if (it.tier === 'best') { assert.strictEqual(it.q, 4, id); assert.ok(Math.abs(pts - ref) <= 0.5, `${id}: ${pts} vs ceiling ${ref}`); assert.strictEqual(G.upgradeInfo(it).pct, 100, `${id}: shown power`); }
    else assert.ok(pts < ref * 0.95, `${id}: a Next best piece starts below its ceiling`);
  }
});

test('the season roll draws only the live season\'s pieces, plus past-season pieces at the retired share', () => {
  setNow(IN_SEASON);
  const s = S1(), named = new Set(); for (const t of ['best', 'until']) for (const f in s[t]) for (const k in s[t][f]) Object.values(s[t][f][k]).forEach((id) => named.add(id));
  for (const dk in D.DUNGEONS) for (const mk of bossOf(dk)) {
    const P = G.finestPool(mk), raid = !!D.DUNGEONS[dk].raid;
    for (const id of P.now) assert.ok(named.has(id) && (D.MOBS[mk].loot || []).concat(D.MOBS[mk].finest || []).includes(id), `${mk}: ${id}`);
    assert.deepStrictEqual(P.old, [], `${mk}: nothing is retired in Season 1`);
    const sum = P.now.reduce((a, id) => a + G.finestRollOdds(mk, raid, id), 0);
    assert.ok(Math.abs(sum - (P.now.length ? D.FINEST_ROLL[raid ? 'raid' : 'dungeon'] : 0)) < 1e-9, `${mk}: the pool shares the roll`);
  }
  // before the season starts there is no pool, and no random number is drawn
  assert.deepStrictEqual(G.finestPool('golemagg', new Date(BEFORE)), { now: [], old: [] });
  let drawn = 0; setNow(BEFORE);
  assert.strictEqual(G.finestRoll('golemagg', true, () => { drawn++; return 0; }), null); assert.strictEqual(drawn, 0);
  setNow(IN_SEASON);
  assert.ok(G.finestPool('golemagg').now.includes(G.finestRoll('golemagg', true, () => 0)));
  // a past season's piece no list names: in the roll at the retired share only
  D.ITEMS.test_retired = { id: 'test_retired', name: 'Test Retired', slot: 'feet', q: 4, atype: 'mail', lvl: 60, stats: { sta: 10 }, finest: 1, tier: 'best' };
  D.MOBS.golemagg.finest.push('test_retired');
  const P = G.finestPool('golemagg'); assert.deepStrictEqual(P.old, ['test_retired']);
  let x = 7; const rnd = () => { x = (x * 16807) % 2147483647; return x / 2147483647; };
  const got = {}; for (let i = 0; i < 20000; i++) { const id = G.finestRoll('golemagg', true, rnd); if (id) got[id] = (got[id] || 0) + 1; }
  const share = (got.test_retired || 0) / 20000;
  assert.ok(Math.abs(share - D.FINEST_ROLL.retired * D.FINEST_ROLL.raid) < 0.01, `retired share ${share}`);
  for (const id in got) assert.ok(id === 'test_retired' || P.now.includes(id));
  assert.ok(Math.abs(G.finestRollOdds('golemagg', true, 'test_retired') - D.FINEST_ROLL.retired * D.FINEST_ROLL.raid) < 1e-9);
  D.MOBS.golemagg.finest.pop();
  // a boss with only past pieces keeps only the retired share: they never become common there
  D.MOBS.the_inkbound_horror.finest = ['test_retired'];
  assert.deepStrictEqual(G.finestPool('the_inkbound_horror'), { now: [], old: ['test_retired'] });
  assert.ok(Math.abs(G.finestRollOdds('the_inkbound_horror', false, 'test_retired') - D.FINEST_ROLL.retired * D.FINEST_ROLL.dungeon) < 1e-9);
  let n = 0; for (let i = 0; i < 20000; i++) if (G.finestRoll('the_inkbound_horror', false, rnd)) n++;
  assert.ok(Math.abs(n / 20000 - D.FINEST_ROLL.retired * D.FINEST_ROLL.dungeon) < 0.01, `alone: ${n / 20000}`);
  delete D.MOBS.the_inkbound_horror.finest; delete D.ITEMS.test_retired;
});
