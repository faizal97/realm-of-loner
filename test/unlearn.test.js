// Unlearning a profession (#145): the trainer said "Unlearn one first" with no way to do it. Unlearning is free and
// works anywhere. It frees the slot and takes that profession's skill and recipes, and nothing else: the other
// profession, items, crafted gear and money stay, and a title or keepsake earned at 300 stays (collections are never
// taken back). Cooking and Fishing take no slot and can't be unlearned.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

let toasts = []; G.on('toast', (t) => toasts.push(t));
// a character with two professions at the given skills, and something crafted in the bags
function twoProfs(a, b, skillA) {
  const { P } = character(40, 'warrior', 'human');
  P.prof = { [a]: { skill: skillA || 120, max: 150, known: [] }, [b]: { skill: 80, max: 150, known: [] }, cooking: { skill: 60, max: 75, known: [] } };
  const made = Object.values(D.RECIPES).find((r) => r.prof === a && D.ITEMS[r.makes]);
  if (made) G.addItem(G.copyItem(made.makes), 1);
  return { P, made };
}

test('unlearning frees the slot and takes only that skill: the other profession, items, crafted gear and money stay', () => {
  const { P, made } = twoProfs('blacksmithing', 'mining');
  const keep = JSON.stringify({ mining: P.prof.mining, cooking: P.prof.cooking, bags: P.bags, money: P.money, equip: P.equip });
  assert.strictEqual(G.primaryCount(), 2); toasts = [];
  G.trainProf('tailoring'); assert.ok(!P.prof.tailoring && toasts.some((t) => /Unlearn one first/.test(t)), 'full: the trainer says to unlearn one');
  G.unlearnProf('blacksmithing');
  assert.ok(!P.prof.blacksmithing, 'its skill and recipes are gone'); assert.strictEqual(G.recipesFor('blacksmithing').length, 0);
  assert.strictEqual(JSON.stringify({ mining: P.prof.mining, cooking: P.prof.cooking, bags: P.bags, money: P.money, equip: P.equip }), keep, 'nothing else changed');
  assert.ok(!made || P.bags.some((b) => b.item.id === made.makes), 'what it crafted is still in the bags');
  G.trainProf('tailoring'); assert.ok(P.prof.tailoring && P.prof.tailoring.skill === 1, 'the free slot takes a new one, from skill 1');
});

test('a title earned at 300 stays after unlearning (collections are never taken back)', () => {
  const { P } = twoProfs('blacksmithing', 'mining', 300); P.prof.blacksmithing.max = 300;
  const t = D.TITLES.find((x) => x.id === 'prof_blacksmithing');
  assert.ok(G.titleUnlocked(t)); G.setTitle(t.id);
  G.unlearnProf('blacksmithing');
  assert.ok(G.titleUnlocked(t), 'still earned'); assert.strictEqual(P.title, t.id, 'still worn');
});

test("Cooking and Fishing can't be unlearned: they take no slot", () => {
  const { P } = twoProfs('blacksmithing', 'mining'); toasts = [];
  G.unlearnProf('cooking');
  assert.ok(P.prof.cooking, 'Cooking stays'); assert.ok(toasts.length === 1, toasts.join());
});

test('the confirmation is told what is lost: the skill, its cap and how many recipes', () => {
  const { P } = twoProfs('blacksmithing', 'mining', 187); P.prof.blacksmithing.max = 225;
  const i = G.unlearnInfo('blacksmithing');
  assert.deepStrictEqual([i.name, i.skill, i.max], ['Blacksmithing', 187, 225]);
  assert.strictEqual(i.recipes, G.recipesFor('blacksmithing').filter((r) => r.sk[0] <= 187).length);
  assert.ok(i.recipes > 0); assert.strictEqual(G.unlearnInfo('mining').recipes, G.recipesFor('mining').filter((r) => r.sk[0] <= 80).length);
});
