// Hard Lanternwake's wisp waves are at 70% health and damage (#282): a wave's `mult` scales its adds on top of the run's
// own multiplier; Normal's waves and the trash pull's wisps are unchanged.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, E } = require('./world');

test("Hard's wisp waves carry 0.7, Normal's none", () => {
  const A = D.ACTIVITIES.ev_snuffed_road;
  const hard = A.hardExtra.wickless_knight.filter((x) => x.kind === 'adds'), normal = A.extra.wickless_knight.filter((x) => x.kind === 'adds');
  assert.strictEqual(hard.length, 3);
  assert.ok(hard.every((x) => x.mult === 0.7));
  assert.ok(normal.every((x) => x.mult == null));
});

test('a wave with mult spawns its adds at that share of the run multiplier', () => {
  const boss = E.mobUnit('wickless_knight', 48, { hp: 9, dmg: 4 });
  boss.hardX = [{ kind: 'adds', at: 0.99, mob: 'lw_wisp', n: 2, lvl: 0, mult: 0.7 }];
  const tank = E.mobUnit('lw_wisp', 48); tank.side = 'ally';
  const C = E.fight([tank], [boss], { dungeonMult: { hp: 2.4, dmg: 2.4 } });
  boss.hp = boss.maxHp * 0.5;
  for (let i = 0; i < 4; i++) E.tick(C, 0.1);
  const adds = C.enemies.filter((u) => u.key === 'lw_wisp');
  assert.strictEqual(adds.length, 2);
  const full = E.mobUnit('lw_wisp', adds[0].level, { hp: 2.4 * 0.7, dmg: 2.4 * 0.7 });
  assert.strictEqual(adds[0].maxHp, full.maxHp);
});
