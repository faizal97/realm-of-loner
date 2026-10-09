// The top frame shows the party member a healer picked (#155). It used a hand-written list (Priest, Paladin, Druid), so
// a Shaman's picked ally never showed. G.frameTarget() now decides from the class data, and ui.js draws what it returns.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

function fighting(cls) {
  const { P } = character(20, cls, 'human');
  P.place = Object.keys(D.PLACES).find((k) => { const p = D.PLACES[k]; return p.lvl && p.lvl[0] <= 20 && p.lvl[1] >= 20 && !p.safe && (p.mobs || []).length; });
  const m = G.placeMobs().find((x) => x.state === 'alive'); G.engage(m.id);
  return G.fight;
}

test('every class that can cast a heal on an ally shows the picked ally in the top frame', () => {
  for (const [k, c] of Object.entries(D.CLASSES)) {
    const heals = c.abilities.some((a) => D.ABILITIES[a] && D.ABILITIES[a].target === 'ally');
    assert.strictEqual(G.healsAllies(k), heals, `${c.name}: ${heals ? 'has' : 'has no'} ally heal`);
  }
  assert.ok(G.healsAllies('shaman'), 'Shaman');
});

test('a Shaman who picks an ally sees that ally in the top frame; a Warrior still sees the enemy', () => {
  for (const cls of ['shaman', 'priest', 'warrior']) {
    const C = fighting(cls), me = G.pUnit.uid, foe = G.pUnit.target;
    assert.ok(foe != null && C.units[foe].side === 'enemy', `${cls}: fighting an enemy`);
    assert.strictEqual(G.frameTarget(), foe, `${cls}: the enemy before picking anyone`);
    G.setTarget(me);
    assert.strictEqual(C.allyTarget, me);
    assert.strictEqual(G.frameTarget(), cls === 'warrior' ? foe : me, `${cls}: after picking an ally`);
    G.fight = null; G.pUnit = null;
  }
});
