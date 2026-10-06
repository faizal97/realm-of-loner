// Rares in the world (v10.9, issue #10): a starting place has none, the Fight list puts a rare first only when it is at
// most 2 levels above you (a stronger one waits after the normal creatures), and an old save follows a rare that moved.
//   node sim/rares.js
require('./_seed.js'); // seeded (#125): the same commit always gives the same result; SEED=n picks other dice
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
require('../src/data.js'); require('../src/engine.js'); require('../src/bots.js'); require('../src/game.js');
const { G, D } = globalThis;
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('FAIL ' + m); } };

// every race's starting place: no rare in the Fight list at level 1
for (const [race, R] of Object.entries(D.RACES)) {
  G.newGame({ name: 'R', cls: 'warrior', race }); G.S.player.place = R.start;
  ok(!G.placeMobs().some((m) => D.MOBS[m.key].named), `${race}: no rare at ${R.start} for a new character`);
}
// a level-1 character where a rare is 3+ levels above: it comes after the normal creatures; at its level it comes first
{
  const [place, key] = Object.entries(D.PLACES).flatMap(([id, P]) => Object.keys(P.named || {}).map((k) => [id, k])).find(([, k]) => D.MOBS[k].lvl[0] >= 4);
  G.newGame({ name: 'L', cls: 'mage', race: 'human' }); const P = G.S.player; P.place = place; P.level = 1;
  const list = G.placeMobs(), at = list.findIndex((m) => m.key === key);
  ok(at > 0 && list.slice(0, at).every((m) => !D.MOBS[m.key].named), `a level-1 character at ${place} sees ${key} (level ${D.MOBS[key].lvl[0]}) after the normal creatures`);
  P.level = D.MOBS[key].lvl[0];
  ok(G.placeMobs()[0].key === key, `at level ${P.level} the rare ${key} is first again`);
}
// an old save that still holds a rare at a place it moved away from: it is gone there and appears where it lives now
{
  G.newGame({ name: 'O', cls: 'warrior', race: 'undead' }); const S = G.S; S.player.place = 'deathknell';
  G.placeMobs(); S.world.deathknell.named.samuel_fipps = { state: 'alive', until: 0, id: 'n_samuel_fipps', key: 'samuel_fipps', level: 4 };
  ok(!G.placeMobs().some((m) => m.key === 'samuel_fipps'), 'an old save drops Edric Fane from Last Bell');
  S.player.place = 'night_web_hollow'; ok(G.placeMobs().some((m) => m.key === 'samuel_fipps'), "Edric Fane is in Spinner's Hollow");
}
console.log(bad ? `${bad} failures` : 'rares sim OK');
process.exit(bad ? 1 : 0);
