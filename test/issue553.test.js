// #553: at 60 every town with an inn has a Bounty Board offering its own zone's normal monsters (any level), at level-60
// pay. Below 60 the board keeps its level window (your level -4 to +2), so a levelling character isn't sent after boars.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

const hubs = () => Object.keys(D.PLACES).filter((k) => G.isHub(k));

test('at 60 every town has a board, and the kills count', () => {
  const { P } = character(60, 'mage', 'human');
  const empty = hubs().filter((k) => !G.bounties(k).length);
  assert.deepStrictEqual(empty.map((k) => D.PLACES[k].name), [], 'towns with no board at 60');
  P.place = hubs().find((k) => D.PLACES[k].name === "Drummond's Vigil");
  const b = G.bounties(P.place)[0];
  assert.ok(D.MOBS[b.mob].lvl[1] < 56, 'the player report: a zone below 56 now has a board');
  assert.ok(b.money >= G.questMoney(60), 'level-60 pay');
  G.acceptBounty(b); assert.ok(P.bounty[b.id], "taken");
});

test('below 60 the level window stays', () => {
  character(30, 'mage', 'human');
  for (const k of hubs()) for (const b of G.bounties(k)) {
    const M = D.MOBS[b.mob];
    assert.ok(M.lvl[1] >= 26 && M.lvl[0] <= 32, `${D.PLACES[k].name}: ${M.name} ${M.lvl}`);
  }
  assert.ok(hubs().some((k) => !G.bounties(k).length), 'some towns have no board at 30');
});
