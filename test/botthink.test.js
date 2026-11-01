// #149 guardrails: the bots' thinking stays cheap however big the fight. A 40-person group of bots (8 healers, 2 tanks,
// 30 damage dealers) fights a raid boss and its adds for 60 simulated seconds; the whole fight (the engine's every
// step, the bots' thinking included) must stay under BUDGET_MS of real time. A healer weighs at most 8 allies.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { E, D, G, character } = require('./world');
const BUDGET_MS = 1500; // 60 simulated seconds: about 170 ms on the dev Mac (2026-11-01; 130 ms before bots thought ahead), so a slower machine has room

function bigFight() {
  const { S } = character(60, 'priest');
  const cls = ['priest', 'druid', 'shaman', 'paladin', 'priest', 'druid', 'shaman', 'paladin', 'warrior', 'paladin'].concat(Array.from({ length: 30 }, (_, i) => ['mage', 'rogue', 'hunter', 'warlock', 'warrior', 'shaman', 'druid'][i % 7]));
  const allies = cls.map((c, i) => { const ch = G.botChar({ name: 'B' + i, cls: c, race: 'human', level: 60, skill: 0.6 }); const u = E.charUnit(ch, 'ally', 'bot', Date.now()); u.bot = { skill: 0.6, react: 0.54 }; u.role = i < 8 ? 'healer' : i < 10 ? 'tank' : 'dps'; return u; });
  const boss = Object.keys(D.MOBS).find((k) => D.MOBS[k].boss && D.MOBS[k].lvl[1] >= 60);
  const enemies = [E.mobUnit(boss, 62, { hp: 600, dmg: 6 })].concat(Array.from({ length: 6 }, () => E.mobUnit(boss, 60, { hp: 40, dmg: 1 })));
  return { C: E.fight(allies, enemies, {}), S };
}

test('a 40-person fight of bots runs 60 s of combat within its time budget', () => {
  const { C } = bigFight();
  const t0 = process.hrtime.bigint();
  for (let i = 0; i < 600 && !C.over; i++) { E.tick(C, 0.1); C.events.length = 0; } // the game empties the events each step
  assert.ok(C.t >= 59.9, `the fight ran ${C.t.toFixed(1)} s`);
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  assert.ok(ms < BUDGET_MS, `${ms.toFixed(0)} ms for ${C.t.toFixed(0)} s of combat`);
});

test('a healer weighs at most 8 allies, plus the tank', () => {
  const { C } = bigFight();
  for (const a of C.allies) a.hp = a.maxHp * 0.5;
  const h = C.allies[0], opts = E.healOptions(C, h, 0.8);
  const who = new Set(opts.filter((o) => o.tgt).map((o) => o.tgt.uid));
  assert.ok(who.size <= 9, `${who.size} allies weighed`);
  assert.ok(opts.length > 0);
});
