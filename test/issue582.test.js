// Bot gear (#582): a group-finder bot wears gear that fits its level (every slot, stats for its role, spell power for a
// healer or caster), and a raid's gear floor takes players in Rare gear (Normal) or Epic (Hard).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const W = require('./world');
const { G, D, E } = W;
W.character(60);
const bot = (cls, role, skill, extra) => G.botChar(Object.assign({ id: 4242, name: 'Testbot', cls, role, level: 60, skill }, extra));
const pieces = (c) => Object.values(c.equip).filter(Boolean);

test('a level-60 bot fills every slot it can use, none of it Common', () => {
  for (const [cls, role] of [['warrior', 'tank'], ['priest', 'healer'], ['hunter', 'dps'], ['bard', 'healer']]) {
    const c = bot(cls, role, 0.2), C = D.CLASSES[cls];
    const want = D.GEAR_SLOTS.filter((s) => s !== 'offhand' && (s !== 'ranged' || C.ranged || C.instrument)).length;
    assert.strictEqual(pieces(c).length, want, `${cls} ${role}`);
    assert.ok(pieces(c).every((it) => it.q >= 2), `${cls} ${role}: Uncommon or better`);
  }
});

test('healer and caster bots have spell power; a tank has the health of a player in the same gear', () => {
  assert.ok(E.statsFor(bot('priest', 'healer', 0.6)).sp > 0, 'healer');
  assert.ok(E.statsFor(bot('mage', 'dps', 0.6)).sp > 0, 'mage');
  assert.strictEqual(E.statsFor(bot('rogue', 'dps', 0.6)).sp, 0, 'a rogue has none');
  assert.ok(E.statsFor(bot('warrior', 'tank', 0.6)).maxHp > 3000, 'tank health');
});

test('the gear floor: Rare for a Normal raid, Epic for Hard, none for a dungeon', () => {
  const raid = Object.keys(D.ACTIVITIES).find((a) => D.ACTIVITIES[a].size === 10 && !D.ACTIVITIES[a].scale && !D.ACTIVITIES[a].bg && !D.ACTIVITIES[a].worldBoss);
  const dungeon = Object.keys(D.ACTIVITIES).find((a) => D.ACTIVITIES[a].size === 5);
  assert.strictEqual(G.gearFloor(raid, false), 3);
  assert.strictEqual(G.gearFloor(raid, true), 4);
  assert.strictEqual(G.gearFloor(dungeon, false), 0);
  assert.ok(pieces(bot('priest', 'healer', 0.3, { gearFloor: 4 })).every((it) => it.q >= 4), 'Hard: Epic');
  assert.ok(pieces(bot('priest', 'healer', 0.3, { gearFloor: 3 })).every((it) => it.q >= 3), 'Normal raid: Rare');
});

test('a bot wears the same gear every time at the same floor', () => {
  const a = bot('warlock', 'dps', 0.8, { gearFloor: 3 }), b = bot('warlock', 'dps', 0.8, { gearFloor: 3 });
  assert.deepStrictEqual(pieces(a).map((x) => x.name), pieces(b).map((x) => x.name));
});
