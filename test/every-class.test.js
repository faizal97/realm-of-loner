// Every class, hidden ones included, is in every table keyed by class: a class added hidden (the Bard, #247) crashed on
// its first loot on the beta because item weights had no row for it. Picks up gear of every slot, takes the militia quest
// reward, rolls an ambush and has its creation blurb.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { G, D, character } = require('./world');

const classes = Object.keys(D.CLASSES);

test('every class can score, pick up and wear-check gear of every slot', () => {
  for (const cls of classes) {
    const { P } = character(20, cls, 'human');
    for (const slot of D.GEAR_SLOTS) {
      const it = G.genGear(slot, 20, 2);
      const s = G.itemScore(it, cls);
      assert.ok(Number.isFinite(s), `${cls} scores a ${slot}`);
      G.isUpgrade(it); P.bags.length = 0; G.addItem(it);
    }
  }
});

test('every class gets its militia weapon', () => {
  const qid = Object.keys(D.QUESTS).find((q) => ((D.QUESTS[q].reward || {}).choice || [])[0] === 'militia');
  for (const cls of classes) {
    character(10, cls, 'human');
    const [it] = G.rewardItems(qid);
    assert.ok(it && D.ITEMS[it.id], `${cls}: a militia weapon`);
    assert.ok(G.canUseItem(it, cls), `${cls} can use ${it.name}`);
  }
});

test('every class has an ambush level, item affixes and a creation blurb', () => {
  const ui = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui.js'), 'utf8');
  const blurb = ui.slice(ui.indexOf('const CLASS_BLURB = {'), ui.indexOf('};', ui.indexOf('const CLASS_BLURB = {')));
  for (const cls of classes) {
    assert.ok(Number.isFinite(G.AMBUSH_OFFSET[cls]), `${cls}: ambush offset`);
    assert.ok(G.CLASS_AFFIX[cls] && G.CLASS_AFFIX2[cls], `${cls}: affixes`);
    assert.ok(new RegExp(`\\n\\s*${cls}: '`).test(blurb), `${cls}: creation blurb`);
  }
});
