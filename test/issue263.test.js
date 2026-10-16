// Area stuns and fears (#263): every ability that stuns or frightens all nearby enemies printed "<name> stomps the
// ground!", so a Bard's Lullaby or a Priest's Psychic Scream read as a War Stomp. Only War Stomp says it now.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, E, character } = require('./world');

function cast(cls, race, abId) {
  const { P } = character(60, cls, race);
  P.place = Object.keys(D.PLACES).find((k) => { const p = D.PLACES[k]; return p.lvl && p.lvl[0] <= 60 && p.lvl[1] >= 60 && !p.safe && (p.mobs || []).length; }) || P.place;
  const m = G.placeMobs().find((x) => x.state === 'alive'); G.engage(m.id);
  for (const e of G.fight.enemies) { e.hp = e.maxHp = 1e6; e.dmg = [0, 0]; e.special = null; e.pos = null; }
  const u = G.pUnit; u.gcdUntil = 0; u.res = u.maxRes;
  G.fight.events.length = 0;
  G.useAbility(abId);
  for (let i = 0; i < 30 && !G.fight.events.some((x) => x.type === 'stun'); i++) G.update(0.1);
  assert.ok(G.fight.events.some((x) => x.type === 'stun'), `${abId} stunned`);
  return G.fight.events.filter((x) => x.type === 'emote').map((x) => x.text);
}

test('Lullaby and Psychic Scream do not stomp the ground; War Stomp does', () => {
  assert.deepStrictEqual(cast('bard', 'human', 'lullaby').filter((t) => /stomps/.test(t)), []);
  assert.deepStrictEqual(cast('priest', 'human', 'psychic_scream').filter((t) => /stomps/.test(t)), []);
  assert.ok(cast('warrior', 'tauren', 'war_stomp').some((t) => /stomps the ground/.test(t)));
});
