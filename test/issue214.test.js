// Caster deaths while questing, part 2 (#214): below creature level 20 the friend a social pull brings hits for 75%.
// The creature you pulled hits as usual, and from creature level 20 the friend does too.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, E, character, advance } = require('./world');

const social = (M) => M && !M.named && !M.elite && (M.family === 'humanoid' || M.family === 'murloc');
function placeFor(lo, hi) {
  return Object.keys(D.PLACES).find((k) => { const p = D.PLACES[k]; return !p.safe && (p.mobs || []).some(([key]) => { const M = D.MOBS[key]; return social(M) && M.lvl[0] >= lo && M.lvl[1] < hi; }); });
}
// pull (a creature whose friend is also in the level range: it can be a level off) until a friend comes along, let it join at once, and return the pulled creature's and the friend's units
function socialFight(lo, hi) {
  const { P } = character(hi > 20 ? 30 : 15, 'warrior', 'human');
  P.place = placeFor(lo, hi); assert.ok(P.place, `a place with level ${lo}-${hi} humanoids`);
  for (let i = 0; i < 2000; i++) {
    const mobs = G.placeMobs(); for (const x of mobs) x.state = 'alive';
    const inRange = (x) => x && x.level >= lo && x.level < hi;
    const friendOf = (x) => mobs.find((y) => y !== x && y.key === x.key); // the friend the game picks
    const m = mobs.find((x) => social(D.MOBS[x.key]) && inRange(x) && inRange(friendOf(x)));
    if (!m) continue;
    G.engage(m.id);
    if (G.fight && G.fight.addAt) {
      const C = G.fight, friend = C.addAt.inst;
      C.addAt.t = 0; advance(0.25);
      const pulled = C.enemies.find((u) => u.inst === m), add = C.enemies.find((u) => u.inst === friend);
      G.fight = null; G.pUnit = null;
      return { pulled, add };
    }
    G.fight = null; G.pUnit = null;
  }
  assert.fail('no social pull in 2000 tries');
}
const full = (u) => E.mobUnit(u.key, u.level).dmg;

test('below creature level 20 the friend hits for 75%; the pulled creature hits as usual', () => {
  const { pulled, add } = socialFight(1, 20);
  assert.ok(add, 'the friend joined');
  assert.ok(add.level < 20, `friend level ${add.level}`);
  const f = full(add);
  assert.deepStrictEqual(add.dmg.map((x) => +x.toFixed(6)), f.map((x) => +(x * 0.75).toFixed(6)));
  assert.deepStrictEqual(pulled.dmg, full(pulled));
});

test('from creature level 20 the friend hits as usual', () => {
  const { add } = socialFight(20, 60);
  assert.ok(add && add.level >= 20, 'a level 20+ friend joined');
  assert.deepStrictEqual(add.dmg, full(add));
});
