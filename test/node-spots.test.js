// A place holds up to 2 ore and 2 herb nodes; since #76 the scene draws all of them (known profession or not), but it had
// only 2 spots, so a third node broke the scene ("Something went wrong") about 1.5 minutes after arriving.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const { G, D, character, now, setNow } = require('./world');

test('every node a place can hold has a spot in the scene', () => {
  const src = fs.readFileSync(require.resolve('../src/ui.js'), 'utf8');
  const spots = (src.match(/const POS_NODE = \[(.*?)\];/) || [])[1].match(/\{[^}]*\}/g).length;
  assert.ok(spots >= G.NODES_PER_KIND * 2, `${spots} spots for ${G.NODES_PER_KIND * 2} nodes`);
  const { P } = character(10);
  P.place = Object.keys(D.PLACES).find((k) => { G.S.player.place = k; return G.placeNodes(true).length; });
  let most = 0; for (let i = 0; i < 20; i++) { setNow(now() + 120000); most = Math.max(most, G.placeNodes(true).length); }
  assert.strictEqual(most, G.NODES_PER_KIND * 2, 'the place fills up to 2 ore and 2 herb');
});
