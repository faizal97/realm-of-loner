// Sim player names are built from syllables; some joins are names from someone else's world (Mordor, Moria). Every
// name the syllables can make is either free of the forbidden-names map (tools/rename_v10.json) and the block list, or
// blocked, and B.makeName never hands out a blocked one (#275).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
require('./world');
const B = globalThis.B;
const MAP = require('../tools/rename_v10.json');

const cap = (n) => (n.charAt(0).toUpperCase() + n.slice(1).toLowerCase()).slice(0, 12);
const every = () => { const out = new Set(); const { a, b, end } = B.NAME_PARTS; for (const x of a) for (const y of b) for (const z of [''].concat(end)) out.add(cap(x + y + z)); return out; };

test('no syllable name is a forbidden name unless it is blocked', () => {
  const forbidden = new Set(Object.keys(MAP).map((k) => k.toLowerCase()));
  const leak = [...every()].filter((n) => forbidden.has(n.toLowerCase()) && !B.NAME_BLOCK.has(n));
  assert.deepStrictEqual(leak, []);
});

// the longer names handed out once every short one is taken (#302)
const long = () => { const out = new Set(); const { a, b } = B.NAME_PARTS; for (const x of a) for (const y of b) for (const z of b) for (const w of [''].concat(b)) out.add(cap(x + y + z.replace(/^[aeiou](?=..)/, '') + w)); return out; };

test('no long name is a forbidden name unless it is blocked', () => {
  const forbidden = new Set(Object.keys(MAP).map((k) => k.toLowerCase()));
  assert.deepStrictEqual([...long()].filter((n) => forbidden.has(n.toLowerCase()) && !B.NAME_BLOCK.has(n)), []);
});

test('names stay unique when every short name is taken', () => {
  const used = new Set(every()); for (const m of ['Arrowxx', 'Gankalot']) used.add(m);
  const got = []; for (let i = 0; i < 3000; i++) got.push(B.makeName(used));
  assert.strictEqual(new Set(got).size, got.length);
  assert.ok(!got.some((n) => /^Alt\d/.test(n) || B.NAME_BLOCK.has(n)));
});

test('the name maker never hands out a blocked name', () => {
  const used = new Set();
  for (let i = 0; i < 20000; i++) { const n = B.makeName(used); assert.ok(!B.NAME_BLOCK.has(n), n); used.clear(); }
  assert.ok(every().has('Mordor') && B.NAME_BLOCK.has('Mordor'), 'the case that was found stays covered');
});
