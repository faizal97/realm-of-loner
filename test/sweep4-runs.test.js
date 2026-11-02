// Runs and the group finder (beta.3 sweep 2): leaving settles loot (#346), a story chapter stops the roll clock (#347),
// a reload mid-pull is a wipe (#349), the day's Roulette dungeon is kept (#350), an unanswered invite stops waiting
// (#353), one group at a time (#354).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character, advance, now } = require('./world');

const act5 = () => Object.keys(D.ACTIVITIES).find((k) => { const A = D.ACTIVITIES[k]; return A.dungeon && (A.size || 5) === 5 && !A.needQuest && !A.worldBoss && A.minLvl <= 20; });
function inRun() {
  const { S } = character(20, 'warrior', 'human'), act = act5();
  S.player.place = D.ACTIVITIES[act].where; G.queueFor(act); S.queue.popAt = Date.now() - 1; G.update(0.5); G.acceptPop();
  return S;
}
const openRoll = (S) => { const it = G.genGear('chest', 20, 3); S.run.rolls.push({ item: it, until: now() + 25000, left: 25000, choices: {}, player: null, done: false }); return it; };

test('leaving a cleared run with loot still out settles it, and Loot says so (#346)', () => {
  const S = inRun(); S.run.idx = S.run.pulls.length; S.run.phase = 'done';
  const it = openRoll(S);
  G.leaveGroup();
  assert.ok(S.chat.some((m) => (m.text || '').includes(it.name) && /passed|won/i.test(m.text)), 'the roll ended and was said');
});

test('the roll clock stops while a story chapter plays (#347)', () => {
  const S = inRun(); S.run.phase = 'rest'; S.run.restUntil = now() + 1e9;
  const it = openRoll(S);
  G.paused = true; advance(30); G.paused = false;
  assert.ok(!S.chat.some((m) => (m.text || '').includes('Time ran out') && m.text.includes(it.name)));
});

test('a reload mid-pull counts as a wipe (#349)', () => {
  const S = inRun(); S.run.restUntil = 0; G.runPull(); advance(3);
  assert.strictEqual(S.run.phase, 'fight');
  G.save(); G.load(S.id);
  assert.strictEqual(G.S.run.wipes, 1); assert.strictEqual(G.S.run.phase, 'wipe');
});

test("the day's Roulette dungeon stays the same after leaving and starting again (#350)", () => {
  const { S } = character(40, 'warrior', 'human'), seen = new Set();
  for (let i = 0; i < 8; i++) { S.flags.deserterUntil = 0; G.startRoulette(); assert.ok(S.run); seen.add(S.run.act); S.run.wipes = 1; G.leaveGroup(); }
  assert.strictEqual(seen.size, 1);
});

test('an invite never answered stops blocking new ones (#353)', () => {
  const { S } = character(12, 'warrior', 'human');
  S.player.place = Object.keys(D.PLACES).find((k) => { const p = D.PLACES[k]; return !p.safe && p.lvl && p.lvl[0] <= 12 && p.lvl[1] >= 12; });
  let n = 0; const off = G.on('partyInvite', () => n++);
  S.flags.pendingInvite = 12345; S.flags.pendingAt = now(); G.save(); G.load(S.id);
  advance(3 * 3600);
  if (typeof off === 'function') off();
  assert.ok(n > 0, 'a later invite came');
});

test('no dungeon run starts during a battleground (#354)', () => {
  const { S } = character(30, 'warrior', 'human'), bg = Object.keys(D.ACTIVITIES).find((k) => D.ACTIVITIES[k].bg);
  G.queueFor(bg); S.queue.popAt = Date.now() - 1; G.update(0.5); G.acceptPop();
  assert.ok(S.bg && S.bg.phase !== 'done', 'in a battleground');
  S.flags.rouletteDay = 'x'; G.startRoulette();
  assert.ok(!S.run, 'Roulette refused');
  assert.ok(G.groupBusy());
});
