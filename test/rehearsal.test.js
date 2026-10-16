// The Bard's Rehearsal (#256): a letter at level 4, a practice fight in four guided steps, a reward once, nothing lost by stopping
const test = require('node:test'), assert = require('node:assert');
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
require('../src/data.js'); require('../src/engine.js'); require('../src/bots.js'); require('../src/game.js');
const { D, E, G } = globalThis;
function bard(level) {
  G.newGame({ name: 'Rhyme', cls: 'bard', race: 'human' });
  const P = G.S.player; P.level = level; P.hp = null; P.res = null;
  return P;
}
// tap a song the way the bar does, with mana to spare; ticks until fn says stop
const tap = (id) => { G.pUnit.res = G.pUnit.maxRes; return G.useAbility(id); };
const run = (secs) => { for (let i = 0; i < secs * 10 && G.fight; i++) G.update(0.1); };
const song = () => D.CLASSES.bard.abilities.find((a) => D.ABILITIES[a].song && D.ABILITIES[a].lvl <= G.S.player.level && D.ABILITIES[a].song.pulse === 'heal');
test('the letter arrives at level 4, once', () => {
  bard(3); assert.strictEqual(G.mail().length, 0);
  G.S.player.level = 4; G.rehearsalLetter(); G.rehearsalLetter();
  assert.strictEqual(G.mail().filter((m) => m.kind === 'letter').length, 1);
});
test('a non-Bard or a Bard under 4 has nothing to rehearse', () => {
  bard(3); assert.ok(G.rehearseWhy());
  G.newGame({ name: 'W', cls: 'warrior', race: 'human' }); G.S.player.level = 10; assert.ok(G.rehearseWhy());
});
test('the four steps, in order, end in the reward; the target never hurts', () => {
  const P = bard(4), money = P.money, xp = P.xp;
  assert.strictEqual(G.rehearse(), null);
  const id = song(), R = () => G.rehearsalNow();
  assert.ok(id, 'a level 4 Bard knows a song');
  tap(id); run(0.2); assert.strictEqual(R().step, 1, 'started');
  const st = () => E.songState(G.fight, G.pUnit, id);
  while (G.fight && !st().inWindow) run(0.1);
  tap(id); run(0.2); assert.strictEqual(R().step, 2, 'a verse on the beat');
  run(1); tap(id); run(0.2); assert.strictEqual(R().step, 3, 'too early: a verse lost');
  for (let n = 0; n < 40 && G.fight && !st().finale; n++) { while (G.fight && !st().inWindow) run(0.1); tap(id); run(0.3); }
  assert.ok(st().finale, 'every verse filled');
  run(1); tap(id); run(0.5);
  assert.strictEqual(G.fight, null, 'the fight ends with the Finale');
  assert.ok(P.rehearsed); assert.ok(P.money > money); assert.ok(P.xp > xp || P.level > 4);
  assert.ok(G.rehearseWhy(), 'only once');
});
test('stopping loses nothing and can be tried again', () => {
  const P = bard(4); G.rehearse(); const hp = G.pUnit.hp;
  run(20); assert.strictEqual(G.pUnit.hp, hp, 'the target never swings');
  G.flee(); run(0.2);
  assert.strictEqual(G.fight, null); assert.ok(!P.rehearsed); assert.strictEqual(G.rehearseWhy(), null);
});
