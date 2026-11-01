// #265: the Bard healer bot sang its 30 min party buffs (Hearthsong, Anthem of Stone) in the middle of fights, about 464
// mana a fight that should go to healing. It sings them only when nobody is hurt and it has mana to spare (over 70%),
// the rule Marching Song already follows.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, E, character } = require('./world');

function healerBard(hpShare, resShare) {
  G.fight = null;
  character(60, 'bard', 'human');
  G.S.player.place = Object.keys(D.PLACES).find((k) => { const p = D.PLACES[k]; return p.lvl && p.lvl[0] <= 20 && p.lvl[1] >= 20 && !p.safe && (p.mobs || []).length; });
  const m = G.placeMobs().find((x) => x.state === 'alive'); G.engage(m.id);
  const C = G.fight, u = G.pUnit;
  for (const e of C.enemies) { e.maxHp = e.hp = 1e8; e.dmg = 0; }
  u.role = 'healer'; u.bot = { skill: 1 };
  const casts = [];
  for (let i = 0; i < 300; i++) {
    u.hp = u.maxHp * hpShare; u.res = u.maxRes * resShare;
    u.nextThink = 0; if (u.gcdUntil > C.t) C.t = u.gcdUntil; u.cast = null;
    const n = C.events.length; E.botThink(C, u);
    for (const e of C.events.slice(n)) if (e.type === 'ability' && (e.ab === 'hearthsong' || e.ab === 'anthem_of_stone')) casts.push(e.ab);
  }
  return casts;
}

test('a hurt party: the healer bot does not sing its 30 min buffs mid-fight', () => {
  assert.deepStrictEqual(healerBard(0.6, 1), []);
});

test('low mana: it keeps the mana for healing', () => {
  assert.deepStrictEqual(healerBard(1, 0.5), []);
});

test('nobody hurt and mana to spare: it still sings them', () => {
  const c = healerBard(1, 1);
  assert.ok(c.includes('hearthsong') && c.includes('anthem_of_stone'), c.join(','));
});
