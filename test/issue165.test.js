// A buff shorter than a minute cast out of a fight (#165) used to take the mana and start the cooldown while applying
// nothing (only buffs of 60 s or more are kept between fights). It is now refused before any cost.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

test('Bloodlust out of a fight: refused, no mana spent, no cooldown, no aura', () => {
  const { P } = character(60, 'shaman', 'orc');
  const v = G.vitals(); P.res = v.maxRes; P.cds = {}; P.auras = [];
  const said = G.castOutOfCombat('bloodlust');
  assert.strictEqual(said, 'Use it in a fight.');
  assert.strictEqual(P.res, v.maxRes, 'mana kept');
  assert.ok(!(P.cds || {}).bloodlust, 'no cooldown');
  assert.strictEqual((P.auras || []).length, 0);
});

test('every short buff that does not heal is refused out of a fight; a long buff still works', () => {
  const shorts = Object.keys(D.ABILITIES).filter((k) => { const a = D.ABILITIES[k]; return a.buff && a.buff.dur < 60 && !a.heal && !a.hot && !a.combatOnly; });
  assert.ok(shorts.length >= 3, `${shorts.length} short buffs`);
  for (const k of shorts) assert.ok(G.fightBuff(k), D.ABILITIES[k].name);
  const { P } = character(20, 'priest', 'human'); P.res = G.vitals().maxRes; P.auras = [];
  const long = D.CLASSES.priest.abilities.find((k) => { const a = D.ABILITIES[k]; return a.buff && a.buff.dur >= 60 && a.lvl <= 20 && !a.combatOnly; });
  assert.ok(long, 'a long priest buff');
  assert.strictEqual(G.castOutOfCombat(long), null);
  assert.ok(P.auras.some((a) => a.id === D.ABILITIES[long].buff.id), 'applied');
});
