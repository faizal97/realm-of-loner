// Finding crafting (#76): the nearest profession trainer your faction can reach, and how far it is.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

test('the nearest trainer is one of your faction\'s, reachable, with its travel time', () => {
  const { P } = character(5, 'warrior', 'human');
  const t = G.nearestTrainer();
  assert.ok(t, 'found one');
  assert.strictEqual(t.npc, 'crafts_alliance');
  assert.ok(D.PROF_TRAINERS.crafts_alliance.includes(t.place));
  assert.ok(t.secs > 0, 'not in a starting area');
  assert.ok(G.route(P.place, t.place), 'there is a road to it');
  const all = G.travelTimes(P.place);
  for (const p of D.PROF_TRAINERS.crafts_alliance) if (all[p] != null) assert.ok(all[p] >= t.secs, `${p} is not nearer`);
});

test('standing in a trainer town, the nearest is here', () => {
  const { P } = character(12, 'warrior', 'human');
  P.place = D.PROF_TRAINERS.crafts_alliance.find((p) => D.PLACES[p]);
  assert.deepStrictEqual(G.nearestTrainer(), { place: P.place, npc: 'crafts_alliance', secs: 0 });
});

test('a Krugar character gets its own trainer', () => {
  G.newGame({ name: 'Orc', cls: 'warrior', race: 'orc' });
  G.S.player.level = 5;
  const t = G.nearestTrainer();
  assert.strictEqual(t.npc, 'crafts_horde');
  assert.ok(D.PROF_TRAINERS.crafts_horde.includes(t.place));
});

test('gathering nodes show before you learn the skill, and a tap says what it needs', () => {
  const { P } = character(32, 'warrior', 'human');
  P.prof = {}; P.place = Object.keys(D.PLACES).find((k) => { P.place = k; return G.placeNodes(true).length; });
  assert.ok(P.place, 'a place with nodes');
  assert.strictEqual(G.placeNodes().length, 0, 'none you can gather');
  const nd = G.placeNodes(true)[0], toasts = [];
  G.on('toast', (t) => toasts.push(t));
  G.gatherNode(nd.i);
  assert.deepStrictEqual(toasts, [`Requires ${D.PROFESSIONS[nd.N.prof].name}: learn it from a profession trainer.`]);
});
