// Play-test findings from beta.7 (#598): the game-side rules behind them.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

test('bots Need only on what suits their role: no Agility ring for a warlock, no Strength mail for a holy paladin', () => {
  character(40, 'warrior', 'human');
  const ring = { slot: 'finger', q: 2, lvl: 40, stats: { agi: 11, str: 10 } }, mail = { slot: 'chest', atype: 'mail', q: 2, lvl: 40, armor: 300, stats: { str: 7, sta: 7 } };
  assert.strictEqual(G.suitsRole(ring, 'warlock', 'dps'), false);
  assert.strictEqual(G.suitsRole(ring, 'rogue', 'dps'), true);
  assert.strictEqual(G.suitsRole(mail, 'paladin', 'healer'), false);
  assert.strictEqual(G.suitsRole(mail, 'paladin', 'tank'), true);
  assert.strictEqual(G.suitsRole({ slot: 'finger', q: 2, stats: { int: 8, sta: 4 } }, 'warlock', 'dps'), true);
});

test('a recipe above your skill says why, and Learn refuses with the same words', () => {
  const { P } = character(30, 'warrior', 'human');
  const id = Object.keys(D.ITEMS).find((k) => D.ITEMS[k].slot === 'recipe' && D.RECIPES[D.ITEMS[k].teaches].sk[0] > 1);
  const r = D.RECIPES[D.ITEMS[id].teaches], name = D.PROFESSIONS[r.prof].name;
  assert.strictEqual(G.learnBlock(D.ITEMS[id]), `Requires ${name}`);
  P.prof = { [r.prof]: { skill: 1, max: 75 } };
  assert.strictEqual(G.learnBlock(D.ITEMS[id]), `Requires ${name} ${r.sk[0]}`);
  P.prof[r.prof].skill = r.sk[0];
  assert.strictEqual(G.learnBlock(D.ITEMS[id]), null);
});

test('Create all counts bag space: crafts that would not fit are not offered', () => {
  const { P } = character(10, 'warrior', 'human');
  const rid = Object.keys(D.RECIPES).find((k) => D.RECIPES[k].prof !== 'cooking' && D.RECIPES[k].sk[0] === 1 && D.GEAR_SLOTS.includes(D.ITEMS[D.RECIPES[k].makes].slot));
  const r = D.RECIPES[rid]; P.prof = { [r.prof]: { skill: 1, max: 75 } }; P.bags = [];
  for (const m in r.mats) G.addItem(G.copyItem(m), r.mats[m] * 5);
  assert.strictEqual(G.craftable(rid), 5); assert.strictEqual(G.craftFit(rid), 5);
  const junk = Object.keys(D.ITEMS).find((k) => D.ITEMS[k].slot === 'junk');
  while (G.bagFree(D.ITEMS[r.makes]) > 2) G.addItem(G.copyItem(junk), 1);
  assert.strictEqual(G.craftFit(rid), G.bagFree(D.ITEMS[r.makes]));
  assert.ok(G.craftFit(rid) < 5);
});

test('a title unlocked by a quest says "New title" once; titles held before are not announced', () => {
  const { P, S } = character(60, 'paladin', 'human');
  delete P.titlesSeen; G.titleCheck(true);
  const c0 = S.chat.length; P.done.pp_a_crown = true; G.titleCheck(true); G.titleCheck(true);
  const lines = S.chat.slice(c0).filter((m) => /^New title: /.test(m.text));
  assert.strictEqual(lines.length, 1); assert.ok(/Reader of Notes/.test(lines[0].text), lines[0].text);
});

test('a talent for an ability still ahead says when it comes', () => {
  const t = G.talentInfo('paladin', 'imp_lay_on_hands').t;
  assert.strictEqual(G.talentAbilityNote({ cls: 'paladin', level: 10 }, t), 'Lay on Hands: learned at level 14');
  assert.strictEqual(G.talentAbilityNote({ cls: 'paladin', level: 14 }, t), null);
});

test('a quest\'s objective names only places in its own region: a dwarf\'s wolf meat is not sent to the human start (#598)', () => {
  const src = require('fs').readFileSync(require('path').join(__dirname, '../src/ui.js'), 'utf8');
  const fnSrc = (name) => { const at = src.indexOf('  function ' + name + '('); assert.ok(at >= 0, name); return src.slice(at, src.indexOf('\n  }\n', at) + 4); };
  const np = src.slice(src.indexOf('  const npcPlace = '), src.indexOf('\n', src.indexOf('  const npcPlace = ')));
  character(6, 'warrior', 'dwarf');
  const objPlaces = new Function('G', 'D', np + '\n' + fnSrc('objPlaces') + '\n' + fnSrc('objPlacesAll') + '; return objPlaces;')(G, D);
  for (const qid of ['dwarven_outfitters', 'wolves_border']) {
    const Q = D.QUESTS[qid], home = D.PLACES[Object.keys(D.PLACES).find((p) => D.PLACES[p].npcs.includes(Q.giver))].region;
    const all = objPlaces(Q.objs[0]), mine = objPlaces(Q.objs[0], qid);
    assert.ok(all.some((p) => D.PLACES[p].region !== home), `${qid}: the meat drops in another region too`);
    assert.ok(mine.length, qid);
    assert.deepStrictEqual(mine.filter((p) => D.PLACES[p].region !== home), [], qid);
  }
});
