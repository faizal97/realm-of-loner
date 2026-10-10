// Quest rewards with a choice (#141 part 4): a quest that gives a green or better generated piece offers two versions,
// the class's own stat mix and a second mix that fits it; weapons come in every weapon type the class can use, and a
// Hunter's can be a ranged weapon; the version you pick is the one you get; a save from before keeps its reward.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

const genQuests = (maxLvl) => Object.keys(D.QUESTS).filter((q) => { const c = D.QUESTS[q].reward.choice; const f = c && D.REWARD_FAMILIES[c[0]]; return f && !f.fixed && f.q >= 2 && D.QUESTS[q].lvl <= maxLvl; });
const statKeys = (it) => Object.keys(it.stats || {}).filter((k) => it.stats[k] > 0).sort().join('+');

test('a generated green or blue reward offers two versions with different stat mixes', () => {
  for (const cls of Object.keys(D.CLASSES)) {
    character(30, cls, 'human');
    for (const q of genQuests(60).slice(0, 25)) {
      const opts = G.rewardItems(q);
      assert.strictEqual(opts.length, 2, `${cls} ${q}: two versions`);
      assert.notStrictEqual(statKeys(opts[0]), statKeys(opts[1]), `${cls} ${q}: the stat mixes differ (${statKeys(opts[0])})`);
      assert.strictEqual(opts[0].slot === 'ranged' || opts[0].slot === 'weapon', opts[1].slot === 'ranged' || opts[1].slot === 'weapon', 'both are the same kind of piece');
      assert.ok(opts.every((it) => G.canUseItem(it, cls)), `${cls} ${q}: both can be used`);
      assert.deepStrictEqual(G.rewardItems(q), opts, 'the same on a second look (the preview is what you get)');
    }
  }
});

test('quest weapons use every weapon type the class can use, and a Hunter can get a ranged one', () => {
  const weaponQuests = Object.keys(D.QUESTS).filter((q) => { const c = D.QUESTS[q].reward.choice; const f = c && D.REWARD_FAMILIES[c[0]]; return f && f.slot === 'weapon' && f.q >= 2; });
  for (const cls of ['warrior', 'rogue', 'hunter', 'shaman']) {
    character(30, cls, 'human');
    const types = new Set(); let ranged = 0;
    for (const q of weaponQuests) for (const it of G.rewardItems(q)) { if (it.slot === 'ranged') ranged++; else types.add(it.wtype); }
    assert.deepStrictEqual([...types].sort(), D.CLASSES[cls].weapons.slice().sort(), `${cls}: every weapon type`);
    if (cls === 'hunter') assert.ok(ranged > 0, 'a Hunter gets ranged weapons too');
    else assert.strictEqual(ranged, 0);
  }
});

test('the version you pick is the one you get', () => {
  const { P } = character(60, 'mage', 'human');
  const q = genQuests(60).find((x) => D.QUESTS[x].objs.every((o) => o.type === 'kill') && !D.QUESTS[x].pre && !D.QUESTS[x].faction);
  P.quests[q] = { prog: D.QUESTS[q].objs.map((o) => o.n) };
  const second = G.rewardItems(q)[1];
  G.turnIn(q, 1);
  assert.ok(P.done[q], 'turned in');
  assert.ok(P.bags.some((b) => b.item.name === second.name && statKeys(b.item) === statKeys(second)), 'the second version is in the bags');
  assert.ok(!P.bags.some((b) => b.item.name === G.rewardItems(q)[0].name && statKeys(b.item) === statKeys(G.rewardItems(q)[0])), 'and not the first');
});

test('a save from before keeps its one previewed reward and gains a second version', () => {
  const { S } = character(30, 'warrior', 'human');
  const q = genQuests(60)[0], f = D.REWARD_FAMILIES[D.QUESTS[q].reward.choice[0]];
  const old = G.genGear(f.slot, f.lvl, f.q, f.slot === 'weapon' ? { wtype: 'sword', affix: G.classAffix('warrior') } : { atype: 'mail', affix: G.classAffix('warrior') });
  S.flags['rw_' + q] = old; // the old shape: one item
  const opts = G.rewardItems(q);
  assert.strictEqual(opts.length, 2);
  assert.deepStrictEqual(opts[0], old, 'the first is the one the player already saw');
  assert.deepStrictEqual(G.rewardItem(q), old, 'rewardItem still gives the first');
});

test('white and fixed rewards stay a single item', () => {
  character(5, 'warrior', 'human');
  const white = Object.keys(D.QUESTS).find((q) => { const c = D.QUESTS[q].reward.choice; const f = c && D.REWARD_FAMILIES[c[0]]; return f && !f.fixed && f.q < 2; });
  const fixed = Object.keys(D.QUESTS).find((q) => { const c = D.QUESTS[q].reward.choice; return c && D.REWARD_FAMILIES[c[0]].fixed; });
  assert.strictEqual(G.rewardItems(white).length, 1);
  assert.strictEqual(G.rewardItems(fixed).length, 1);
});

test('gear never gets worse as you level: full blue and purple bonus to 50, a straight line to L60 by 59', () => {
  for (const q of [2, 3, 4]) for (let L = 1; L < 60; L++) assert.ok(D.gearBudget(L + 1, q) >= D.gearBudget(L, q), `quality ${q}, ${L} -> ${L + 1}`);
  for (const q of [3, 4]) assert.ok(Math.abs(D.gearBudget(59, q) - D.gearBudget(60, q)) < 1e-9, `quality ${q}: 59 reaches 60`);
  assert.ok(Math.abs(D.gearBudget(50, 3) - D.gearBudget(50, 2) * 1.2) < 1e-9, 'the full blue bonus at 50');
  assert.strictEqual(D.gearBudget(55, 2), 55 * 0.55 + 1, 'greens unchanged');
});

test('the level 57-59 fixed blues (the Mentor Mark upgrade base) keep their own stats', () => {
  const low = Object.values(D.ITEMS).filter((it) => it.q === 3 && it.lvl >= 57 && it.lvl < 60 && it.stats);
  assert.ok(low.length > 0);
  assert.ok(low.some((it) => Object.values(it.stats).reduce((a, v) => a + v, 0) < Math.round(D.gearBudget(it.lvl, 3))), 'at least one stays under the generated budget, so none was lifted');
});
