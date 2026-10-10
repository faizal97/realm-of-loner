// Every talent point can be spent (#191). Rogue (7), Warrior (3) and Mage (3) had points at level 60 that no tree had
// room for; one new talent in each short tree gives every class at least the 51 points a level-60 character earns.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

// learn every talent the character can, tier by tier in each tree, until nothing more can be learned
function learnAll(P) {
  P.talents = {};
  for (let progress = true; progress;) {
    progress = false;
    for (const tree of D.TALENTS[P.cls]) for (const t of tree.talents) while (!G.canLearnTalent(P, t.id)) { G.learnTalent(t.id); progress = true; }
  }
  return G.talentPoints(P);
}

test('a level-60 Rogue, Warrior and Mage spend all 51 points', () => {
  for (const cls of ['rogue', 'warrior', 'mage']) {
    const { P } = character(D.LEVEL_CAP, cls, 'human');
    const pts = learnAll(P);
    assert.strictEqual(pts.total, D.LEVEL_CAP - D.TALENT_START + 1);
    assert.strictEqual(pts.free, 0, `${cls}: ${pts.spent} spent, ${pts.free} free`);
  }
});

test('no class is left with points it can never spend', () => {
  for (const cls of Object.keys(D.TALENTS)) {
    const ranks = D.TALENTS[cls].reduce((a, tr) => a + tr.talents.reduce((b, t) => b + t.ranks, 0), 0);
    assert.ok(ranks >= D.LEVEL_CAP - D.TALENT_START + 1, `${cls}: ${ranks} ranks`);
  }
});

test('the new talents use effects the engine reads', () => {
  const { P } = character(D.LEVEL_CAP, 'rogue', 'human');
  P.talents = { precise_strikes: 2, shadowed_step: 2 };
  const m = E_talent(P);
  assert.ok(m.crit >= 2 && m.taken >= 4, JSON.stringify({ crit: m.crit, taken: m.taken }));
});
function E_talent(P) { return require('./world').E.talentMods(P); }
