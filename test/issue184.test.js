// #184: level-60 rewards from old content and bounties fit level 60. At 60 the Roulette's bonus is a level-60 blue fitted
// to your class (not a low dungeon's own boss blue); a bounty's XP becomes +1 Mentor Mark (the paid line never says
// "0 XP"); the weekly bounty's bonus is a fitted blue at 60 and a fitted green below, never lost to full bags. In a Trial,
// the final boss drops its blue-or-better items at level 60, scaled to a level-60 dungeon blue and never above it.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

let lines = []; G.on('questDone', (d) => lines.push(d && d.text));
function bountyDone(level, weekly) {
  const { P } = character(level, 'mage', 'human');
  P.place = Object.keys(D.PLACES).find((k) => G.isHub(k) && G.bounties(k).length);
  const b = G.bounties(P.place).find((x) => !!x.weekly === weekly);
  G.acceptBounty(b); P.bounty[b.id].prog = b.n; lines = [];
  return { P, b };
}

test('a bounty at 60: +1 Mentor Mark instead of XP, and the paid line never says XP', () => {
  for (const weekly of [false, true]) {
    const { b } = bountyDone(60, weekly), marks = G.account().marks;
    G.turnInBounty(b);
    assert.strictEqual(G.account().marks - marks, (b.marks || 0) + 1, 'its Marks plus one');
    assert.ok(!/XP/.test(lines[0]), lines[0]);
  }
});

test('a bounty at 59 still pays its XP', () => {
  const { P, b } = bountyDone(59, false), marks = G.account().marks, xp = P.xp;
  G.turnInBounty(b);
  assert.ok(P.xp > xp, 'XP paid'); assert.strictEqual(G.account().marks - marks, b.marks || 0);
  assert.match(lines[0], /XP/);
});

test('the weekly bonus fits your class: a level-60 blue at 60, a green at your level below', () => {
  for (const [lvl, q] of [[60, 3], [40, 2]]) {
    const { P, b } = bountyDone(lvl, true); const n = P.bags.length;
    G.turnInBounty(b);
    const it = P.bags[n].item;
    assert.strictEqual(it.q, q); assert.strictEqual(it.lvl, lvl); assert.ok(G.canUseItem(it, 'mage'), it.name);
  }
});

test('Trial loot: a low dungeon blue comes back at level 60, as strong as a level-60 dungeon blue and no stronger', () => {
  character(60, 'warrior', 'human');
  const ids = Object.keys(D.ITEMS).filter((k) => { const it = D.ITEMS[k]; return it.q === 3 && D.GEAR_SLOTS.includes(it.slot) && (it.lvl || 0) < 40 && !it.effect && it.stats; }).slice(0, 25);
  assert.ok(ids.length > 5);
  const cap = D.gearBudget(60, 3);
  for (const id of ids) {
    const it = G.trialCopy(id), base = D.ITEMS[id];
    assert.strictEqual(it.lvl, 60); assert.ok(it.trial60); assert.strictEqual(it.name, base.name);
    const pts = G.itemPoints(it);
    assert.ok(pts > G.itemPoints(base), id + ': stronger than the drop');
    assert.ok(pts <= cap * 1.05 + 2, `${id}: ${pts} over the level-60 blue budget ${cap}`);
  }
  const sixty = Object.keys(D.ITEMS).find((k) => D.ITEMS[k].q === 3 && D.ITEMS[k].lvl >= 60 && D.GEAR_SLOTS.includes(D.ITEMS[k].slot));
  assert.deepStrictEqual(G.trialCopy(sixty), G.copyItem(sixty), 'a level-60 item is left as it is');
});

test('the Roulette at 60: its bonus is a level-60 blue that fits your class, whatever dungeon it rolled', () => {
  const { advance } = require('./world');
  const { P } = character(60, 'priest', 'human');
  const got = []; const give = G.giveReward; G.giveReward = (it, label) => { if (label === 'Roulette bonus') got.push(it); return give(it, label); };
  try {
    for (let n = 0; n < 4; n++) {
      G.S.flags.rouletteDay = null; G.startRoulette();
      for (let i = 0; i < 20000 && G.S.run && G.S.run.phase !== 'done'; i++) {
        const R = G.S.run; if (R.phase === 'rest') { R.restUntil = 0; G.runPull(); }
        if (G.fight) for (const e of G.fight.enemies) e.hp = 1;
        advance(0.25);
      }
      G.leaveGroup(); P.place = P.place || 'stormwind';
    }
  } finally { G.giveReward = give; }
  assert.ok(got.length >= 3, 'Roulettes paid their bonus');
  for (const it of got) { assert.strictEqual(it.lvl, 60, it.name); assert.strictEqual(it.q, 3); assert.ok(G.canUseItem(it, 'priest'), it.name); }
});
