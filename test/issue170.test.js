// Results and timers say what really happened (#170): a Create all that the bags cut short says how far it got (a yellow
// info toast and the log); a refused cook reports no result; the loot-roll clock says why it is stopped.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character, advance } = require('./world');

const toasts = [], infos = [];
G.on('toast', (t) => toasts.push(t)); G.on('info', (t) => infos.push(t));
const gearRecipe = () => Object.keys(D.RECIPES).find((k) => { const r = D.RECIPES[k]; return r.prof !== 'cooking' && D.GEAR_SLOTS.includes(D.ITEMS[r.makes].slot) && r.n === 1; });

test('Create all cut short by full bags says how many were made, as information', () => {
  const { P, S } = character(30, 'warrior', 'human');
  const rid = gearRecipe(), r = D.RECIPES[rid];
  G.profs()[r.prof] = { skill: 300, max: 300, known: [rid] };
  P.bags = [];
  for (const m in r.mats) G.addItem(G.copyItem(m), r.mats[m] * 10);
  while (P.bags.length < G.bagCap() - 3) P.bags.push({ item: G.copyItem('linen_cloth'), n: 1, junkfill: true });
  toasts.length = 0; infos.length = 0; const chat0 = S.chat.length;
  assert.strictEqual(G.craft(rid, 10), true);
  for (let i = 0; i < 40 && P.casting; i++) advance(1.6);
  const made = P.bags.filter((b) => b.item.id === r.makes || b.item.name === D.ITEMS[r.makes].name).length;
  assert.ok(made > 0 && made < 10, `stopped early (${made})`);
  const want = `Bags full. Made ${made} of 10.`;
  assert.deepStrictEqual(infos, [want], 'one yellow toast');
  assert.ok(!toasts.includes(want), 'not a red one');
  assert.ok(S.chat.slice(chat0).some((m) => m.text === want), 'and in the log');
});

test('a refused craft does not start, and a refused cook returns false (so no result toast)', () => {
  const { P } = character(30, 'warrior', 'human');
  const rid = gearRecipe(), r = D.RECIPES[rid];
  G.profs()[r.prof] = { skill: 300, max: 300, known: [rid] };
  P.bags = []; infos.length = 0;
  assert.notStrictEqual(G.craft(rid, 1), true, 'no materials: refused');
  const cook = Object.keys(D.RECIPES).find((k) => D.RECIPES[k].prof === 'cooking');
  G.profs().cooking = { skill: 300, max: 300, known: [cook] };
  assert.strictEqual(G.cook(cook, 1, 'perfect'), false, 'no ingredients: no batch, so no result toast');
});

test('the loot-roll clock says why it is stopped: a fight, or you looking at the item', () => {
  const { S } = character(35, 'mage', 'human');
  G.startRoulette(); const R = S.run;
  assert.strictEqual(G.rollPaused(), null);
  R.phase = 'fight'; assert.strictEqual(G.rollPaused(), 'fight');
  R.phase = 'rest'; G.pauseRolls(true); assert.strictEqual(G.rollPaused(), 'look');
  G.pauseRolls(false); assert.strictEqual(G.rollPaused(), null);
});
