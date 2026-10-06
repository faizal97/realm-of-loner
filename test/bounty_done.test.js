// Handing in a bounty says "Bounty complete", with what it paid; a quest still says "Quest complete" (#115). The game
// puts the line in its questDone event and the screen shows that line, so the words are checked here, without a screen.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

let said = []; G.on('questDone', (d) => said.push(d && d.text));
// a character standing at a bounty board, with a bounty taken and its kills done
function finishedBounty(level, weekly) {
  const { P } = character(level, 'warrior', 'human');
  P.place = Object.keys(D.PLACES).find((k) => G.isHub(k) && G.bounties(k).length);
  const b = G.bounties(P.place).find((x) => !!x.weekly === !!weekly);
  G.acceptBounty(b); P.bounty[b.id].prog = b.n;
  return { P, b };
}

test('a bounty hand-in says "Bounty complete" with the creature and what it paid, never "Quest"', () => {
  for (const weekly of [false, true]) {
    const { P, b } = finishedBounty(20, weekly); said = [];
    const money0 = P.money; G.turnInBounty(b);
    assert.strictEqual(said.length, 1, 'one line');
    const t = said[0] || '';
    assert.ok(t.startsWith(`Bounty complete: ${D.MOBS[b.mob].name}`), t);
    assert.ok(!/quest/i.test(t), `no "Quest" in "${t}"`);
    assert.ok(t.includes(G.moneyText(P.money - money0)), `the money it paid, in "${t}"`);
    assert.ok(/\d+ XP/.test(t), `the experience, in "${t}"`);
    assert.ok(t.includes(`${b.marks} Mentor Marks`), `the Mentor Marks, in "${t}"`);
    assert.strictEqual(t.includes('bonus gear'), weekly, `the weekly's bonus gear, in "${t}"`);
  }
});

test('at the level cap a bounty shows no experience (it pays none)', () => {
  const { b } = finishedBounty(D.LEVEL_CAP); said = [];
  G.turnInBounty(b);
  assert.ok(said[0].startsWith('Bounty complete') && !/XP/.test(said[0]), said[0]);
});

test('a quest hand-in still says "Quest complete"', () => {
  const { P } = character(5, 'warrior', 'human');
  const qid = Object.keys(D.QUESTS).find((q) => { const Q = D.QUESTS[q]; return Q.lvl <= 5 && !Q.faction && !Q.pre && Q.objs.every((o) => o.type === 'kill' || o.type === 'visit') && !G.rewardItem(q); });
  P.quests[qid] = { prog: D.QUESTS[qid].objs.map((o) => (o.type === 'kill' ? o.n : 1)) }; said = [];
  G.turnIn(qid);
  assert.deepStrictEqual(said, ['Quest complete'], D.QUESTS[qid].name);
});
