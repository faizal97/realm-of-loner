// v10.3 quick features: selling several items at once, and battle speed (fights at 2x or 3x keep the same par clock).
// node sim/sellspeed.js
require('./_seed.js'); // seeded (#125): the same commit always gives the same result; SEED=n picks other dice
globalThis.localStorage = (() => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; })();
require('../src/data.js'); require('../src/engine.js'); require('../src/bots.js'); require('../src/game.js');
const { G, D } = globalThis;
let bad = 0, n = 0; const ok = (c, m) => { n++; if (!c) { bad++; console.log('FAIL ' + m); } };
let t = 1790000000000; Date.now = () => t;

// selling several: money adds up, quest items stay, indices are safe in any order
G.newGame({ name: 'S', cls: 'warrior', race: 'human' }); const P = G.S.player;
const quest = Object.keys(D.ITEMS).find((k) => D.ITEMS[k].slot === 'quest');
P.bags = [{ item: G.copyItem('hearthstone'), n: 1 }, { item: G.genGear('chest', 10, 2), n: 1 }, { item: G.copyItem(quest), n: 1 }, { item: G.genGear('legs', 10, 0), n: 1 }, { item: G.copyItem('tough_bread'), n: 4 }];
const worth = (i) => (P.bags[i].item.sell || 1) * P.bags[i].n, m0 = P.money, want = worth(1) + worth(3) + worth(4);
const r = G.sellMany([4, 1, 2, 3, 1]);
ok(r.n === 3 && P.money - m0 === want, `sold 3 for the right money (${r.money} vs ${want})`);
ok(P.bags.length === 2 && P.bags.some((b) => b.item.id === quest) && P.bags.some((b) => b.item.id === 'hearthstone'), 'the quest item and the unsellable Waystone stay');
ok(G.sellMany([]).n === 0, 'selling nothing is fine');

// battle speed: 2x runs fights twice as fast in real time, and the run clock counts the fight time gained
ok(G.setSpeed(2) === 2 && G.setSpeed(7) === 1, 'only 1x, 2x and 3x');
function fightFor(speed) {
  G.newGame({ name: 'F', cls: 'warrior', race: 'human' }); G.S.player.level = 20; G.S.flags.warModeAsked = true;
  G.setSpeed(speed); G.S.run = { started: Date.now(), pulls: [], rolls: [], phase: 'fight', idx: 0, wipes: 0 };
  let fightSecs = 0, real = 0;
  // measure the clock alone: a fight that lasts `real` seconds of wall time at this speed
  G.fight = { t: 0, kind: 'solo', events: [], enemies: [], allies: [], units: {}, over: false, fake: true };
  const origTick = globalThis.E.tick; globalThis.E.tick = (F, d) => { F.t += d; fightSecs += d; };
  for (let i = 0; i < 100; i++) { t += 100; G.update(0.1); real += 0.1; }
  globalThis.E.tick = origTick; G.fight = null;
  return { fightSecs, real, clock: G.runClock() };
}
const one = fightFor(1), two = fightFor(2), three = fightFor(3);
ok(Math.abs(one.fightSecs - 10) < 0.2 && Math.abs(two.fightSecs - 20) < 0.3 && Math.abs(three.fightSecs - 30) < 0.4, `fight time runs 1x/2x/3x (${one.fightSecs.toFixed(1)}, ${two.fightSecs.toFixed(1)}, ${three.fightSecs.toFixed(1)})`);
ok(Math.abs(two.clock - two.fightSecs) < 0.3 && Math.abs(three.clock - three.fightSecs) < 0.4, `the run clock counts fight time, so par is the same at any speed (${two.clock.toFixed(1)} / ${three.clock.toFixed(1)})`);

// loot rolls (v10.4): the clock waits during fights and while you inspect; it runs out in rests; the group does not wait
{
  G.newGame({ name: 'L', cls: 'warrior', race: 'human' }); G.S.flags.warModeAsked = true;
  const roll = { item: G.genGear('chest', 10, 2), until: Date.now() + 25000, left: 25000, choices: {}, player: null, done: false };
  G.S.group = { act: 'deadmines', members: [] };
  G.S.run = { act: 'deadmines', phase: 'fight', rolls: [roll], pulls: [{ mobs: [] }], idx: 0, wipes: 0, started: Date.now(), restUntil: Date.now() };
  const pass = (secs) => { for (let i = 0; i < secs; i++) { t += 1000; G.update(1); } };
  pass(40); ok(!roll.player && roll.left > 20000, `the roll waits through a fight (${Math.round(roll.left / 1000)}s left)`);
  G.S.run.phase = 'done'; G.pauseRolls(true); pass(30); ok(!roll.player && roll.left > 20000, 'and while you inspect the item');
  G.pauseRolls(false); pass(10); ok(!roll.player && roll.left < 17000, 'then it counts down again');
  pass(20); ok(roll.player && roll.player.c === 'pass', 'and runs out as a pass');
  G.S.run = null; G.S.group = null;
}
G.setSpeed(1);
console.log(`sellspeed: ${n - bad}/${n} checks pass`);
process.exit(bad ? 1 : 0);
