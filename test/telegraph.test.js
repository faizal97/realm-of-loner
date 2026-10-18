// Telegraphs (#179, docs/plans/2026-10-17-telegraphs-design.md): a boss's timed mechanic warns with a named cast, and
// each kind has one answer. Answered, the hit is avoided (an interrupt or a stun cancels the cast); missed, it hits
// TELE.miss times as hard, but only a unit that has the answer is punished for missing it.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, E } = require('./world');
const ON = [...E.TELE.on]; // the kinds the game switches on, before a test changes them

// a fight with one mob that carries a boss extra (m.hardX), its telegraph switched on or off
function fight(level, cls, x, on = true) {
  G.fight = null;
  const { P } = require('./world').character(level, cls, 'human');
  P.place = Object.keys(D.PLACES).find((k) => { const p = D.PLACES[k]; return p.lvl && p.lvl[0] <= level && p.lvl[1] >= level && !p.safe && (p.mobs || []).length; });
  const m0 = G.placeMobs().find((x2) => x2.state === 'alive'); G.engage(m0.id);
  const C = G.fight, u = G.pUnit, m = C.enemies[0];
  u.maxHp = u.hp = 1e6; u.res = u.maxRes = 1e6;
  m.maxHp = m.hp = 1e7; m.dmg = [100, 100]; m.special = null; m.auto = () => 0;
  m.hardX = [Object.assign({ every: 4, hard: false }, x)];
  E.TELE.on.clear(); if (on) E.TELE.on.add('x:' + m.key);
  return { C, u, m };
}
const tick = (C, sec) => { for (let i = 0; i < sec * 10; i++) E.tick(C, 0.1); };
const startOf = (C) => { for (let i = 0; i < 100 && !C.enemies[0].tele; i++) E.tick(C, 0.1); assert.ok(C.enemies[0].tele, 'the cast started'); return C.enemies[0].tele; };
const teleDmg = (C, u) => C.events.filter((e) => e.type === 'dmg' && e.tgt === u.uid && e.tele).reduce((s, e) => s + e.amount, 0);
const evs = (C, what) => C.events.filter((e) => e.type === 'tele' && e.what === what);
const BREATH = { kind: 'hit', who: 'all', mult: 1, name: 'Test Breath', school: 'fire' };

test('every class has an interrupt, free, 12 sec, from level 6', () => {
  for (const cls in D.CLASSES) {
    const id = D.INTERRUPTS[cls], a = D.ABILITIES[id];
    assert.ok(a && D.CLASSES[cls].abilities.includes(id), cls);
    assert.deepStrictEqual([a.cost, a.cd, a.lvl, a.interrupt, a.gcd], [0, 12, 6, true, false], cls);
  }
});

test('a telegraph switched off lands at once, as before', () => {
  const { C, u, m } = fight(20, 'mage', BREATH, false);
  tick(C, 3);
  assert.ok(!m.tele);
  assert.strictEqual(evs(C, 'start').length, 0);
  assert.ok(C.events.some((e) => e.type === 'dmg' && e.tgt === u.uid && e.src === m.uid), 'the hit landed');
});

test('Step Back during the cast avoids a group hit', () => {
  const { C, u } = fight(20, 'mage', BREATH);
  const t = startOf(C);
  assert.strictEqual(E.teleAnswer(t), 'step');
  assert.strictEqual(E.use(C, u, 'step_back'), null, 'Step Back used');
  tick(C, 3);
  assert.strictEqual(teleDmg(C, u), 0);
  assert.ok(evs(C, 'dodge').some((e) => e.tgt === u.uid));
});

test('a missed answer hits TELE.miss times as hard as the plain hit', () => {
  const plain = fight(20, 'mage', BREATH, false); tick(plain.C, 2.2);
  const hit = plain.C.events.find((e) => e.type === 'dmg' && e.tgt === plain.u.uid && /^hard_/.test(e.ab)).amount;
  const { C, u } = fight(20, 'mage', BREATH);
  startOf(C); tick(C, 3);
  assert.ok(Math.abs(teleDmg(C, u) / hit - E.TELE.miss) < 0.15, `${teleDmg(C, u)} vs ${hit}`);
});

test('a unit that does not know the answer takes the plain hit, never the big one', () => {
  // a level-20 Warrior has no defensive yet (Shield Wall is 32): a Crushing Blow on it lands as it did before
  const SLAM = { kind: 'hit', who: 'target', mult: 1, name: 'Test Slam' };
  assert.deepStrictEqual(E.answersOf(fight(20, 'warrior', SLAM).u, 'guard'), []);
  const plain = fight(20, 'warrior', SLAM, false); tick(plain.C, 2.2);
  const hit = plain.C.events.find((e) => e.type === 'dmg' && e.tgt === plain.u.uid && /^hard_/.test(e.ab)).amount;
  const { C, u } = fight(20, 'warrior', SLAM);
  startOf(C); tick(C, 3);
  assert.ok(Math.abs(teleDmg(C, u) / hit - 1) < 0.15, `${teleDmg(C, u)} vs ${hit}`);
});

test('a defensive up when it lands avoids a slam on the tank', () => {
  const { C, u } = fight(40, 'warrior', { kind: 'hit', who: 'target', mult: 1, name: 'Test Slam' });
  const t = startOf(C);
  assert.strictEqual(E.teleAnswer(t), 'guard');
  assert.ok(E.answersOf(u, 'guard').includes('shield_wall'));
  assert.strictEqual(E.use(C, u, 'shield_wall'), null);
  tick(C, 3);
  assert.strictEqual(teleDmg(C, u), 0);
});

test('an interrupt cancels a heal cast', () => {
  const { C, u, m } = fight(20, 'mage', { kind: 'heal', heal: 0.2, name: 'Test Mend' });
  m.hp = m.maxHp / 2;
  const t = startOf(C);
  assert.strictEqual(E.teleAnswer(t), 'cut');
  assert.strictEqual(E.use(C, u, 'spellbreak', m.uid), null, 'Spellbreak used');
  assert.strictEqual(m.tele, null);
  assert.strictEqual(evs(C, 'cut').length, 1);
  const hp = m.hp; tick(C, 3);
  assert.ok(m.hp <= hp, 'no heal landed');
});

test('a stun cancels a cast too', () => {
  const { C, u, m } = fight(20, 'rogue', { kind: 'heal', heal: 0.2, name: 'Test Mend' });
  startOf(C);
  u.res = 100; u.cp = 5; u.cpTarget = m.uid;
  assert.ok(E.answersOf(u, 'cut').includes('kidney_shot'));
  assert.strictEqual(E.use(C, u, 'kidney_shot', m.uid), null, 'Kidney Shot used');
  assert.strictEqual(m.tele, null);
});

test('a missed heal heals TELE.healMiss times as much', () => {
  const { C, m } = fight(20, 'mage', { kind: 'heal', heal: 0.1, name: 'Test Mend' });
  m.hp = m.maxHp / 2; startOf(C); const hp = m.hp; tick(C, 3);
  assert.ok(Math.abs((m.hp - hp) / m.maxHp - 0.1 * E.TELE.healMiss) < 0.01, String((m.hp - hp) / m.maxHp));
});

test('a skilled bot answers a group hit on its own', () => {
  const { C, u } = fight(20, 'mage', BREATH);
  const b = E.charUnit(G.botChar({ name: 'Ally', cls: 'priest', race: 'human', level: 20, skill: 1 }), 'ally', 'bot', Date.now());
  b.bot = { skill: 1, react: 0.3 }; b.maxHp = b.hp = 1e6; E.addAlly(C, b);
  startOf(C); tick(C, 3);
  assert.strictEqual(teleDmg(C, b), 0, 'the bot stepped back');
  assert.ok(teleDmg(C, u) > 0, 'the player who did nothing was hit');
});

test('Veshmira\'s Searing Breath is telegraphed in the data, on Normal and Hard', () => {
  const Dg = D.DUNGEONS.onyxias_lair;
  for (const x of [Dg.extra.onyxia[0], Dg.hard.extra.onyxia[0]]) assert.deepStrictEqual([x.name, x.tele, x.who], ['Searing Breath', true, 'all']);
  const { C, m } = fight(20, 'mage', Object.assign({}, Dg.extra.onyxia[0], { every: 4 }), false); // E.TELE.on empty: the data switches it on
  startOf(C);
  assert.strictEqual(m.tele.name, 'Searing Breath');
  assert.ok(Math.abs(m.tele.until - m.tele.start - E.TELE.cast) < 1e-9, 'Normal casts for 2.5 sec');
});

test('the boss card names the telegraph and its answer', () => {
  const u = E.mobUnit('onyxia', 63); u.hardX = D.DUNGEONS.onyxias_lair.extra.onyxia;
  const r = E.specialRows(u).find((x) => x.tele);
  assert.strictEqual(r.name, 'Searing Breath');
  assert.match(r.what, /Red bar first: Step Back avoids it; missed, it hits 2\.5x\./);
});

test('a bear tank can answer: Step Back, Thornlash and Barkskin work in Bear Form', () => {
  for (const id of ['step_back', 'thornlash', 'barkskin']) assert.ok(D.ABILITIES[id].anyForm, id);
});

test('the screen shows the red bars you should answer, and drops one once answered', () => {
  const { C, u } = fight(20, 'mage', BREATH);
  startOf(C);
  assert.deepStrictEqual(E.teleFor(C, u).map((x) => x.ans), ['step']);
  E.use(C, u, 'step_back');
  assert.deepStrictEqual(E.teleFor(C, u), []);
});

test('the death recap names the telegraph and the answer that was missed', () => {
  const { C, u, m } = fight(20, 'mage', Object.assign({}, BREATH, { mult: 400 }));
  u.maxHp = u.hp = 500; m.dmg = [1, 1]; // its melee can't kill: the missed breath does
  G.recapFeed(C, C.events.splice(0));
  for (let i = 0; i < 100 && !u.dead; i++) { E.tick(C, 0.1); G.recapFeed(C, C.events.splice(0)); }
  const d = C.recap.deaths.find((x) => x.uid === u.uid);
  assert.ok(d, 'died');
  assert.match(d.by, /Test Breath$/);
  assert.match(G.recapText(d).facts, /^no Step Back · /);
});

test('the kinds switched on in the game, each measured first (sim/difficulty.js TELE=)', () => {
  assert.deepStrictEqual(ON, ['whirl', 'molten', 'arugal', 'slam', 'hogger', 'cook']);
  E.TELE.on.clear(); for (const k of ON) E.TELE.on.add(k); // the earlier tests switched kinds on and off
  const u = E.mobUnit('taragaman', 20);
  assert.match(E.specialRows(u)[0].name + ': ' + E.specialRows(u)[0].what, /^Whirling Blades: .*Red bar first: Step Back avoids it/);
});

// a slam on the tank is the whole team's (#179): a bot tank holds the boss, the player helps
function slamFight(cls, level) {
  const SLAM = { kind: 'hit', who: 'target', mult: 1, name: 'Test Slam' };
  const f = fight(level, cls, SLAM);
  const tank = E.charUnit(G.botChar({ name: 'Tank', cls: 'warrior', race: 'human', level: 20, skill: 0.5 }), 'ally', 'bot', Date.now());
  tank.bot = { skill: 0, react: 0.9 }; tank.role = 'tank'; tank.maxHp = tank.hp = 1e6; E.addAlly(f.C, tank);
  f.m.threat[tank.uid] = 1e9; f.m.target = tank.uid;
  return Object.assign(f, { tank });
}

test('a slam\'s size: 2.5x, a mend takes 1x off, a kick 0.5x, two kicks at most, never below 0.5x', () => {
  const t = { kicks: new Set(), mended: false };
  assert.strictEqual(E.teleSize(t), 2.5);
  t.kicks.add(1); assert.strictEqual(E.teleSize(t), 2);
  t.kicks.add(2); t.kicks.add(3); assert.strictEqual(E.teleSize(t), 1.5, 'a third kick does nothing');
  t.mended = true; assert.strictEqual(E.teleSize(t), 0.5);
  E.TELE.mend = 5; assert.strictEqual(E.teleSize(t), 0.5, 'the floor'); E.TELE.mend = 1;
});

test('a healer\'s shield on the tank during the bar takes 1x off the slam, and the healer\'s button is asked for', () => {
  const { C, u, m, tank } = slamFight('priest', 20);
  const t = startOf(C);
  assert.strictEqual(t.victim, tank.uid);
  assert.deepStrictEqual(E.teleFor(C, u).map((x) => x.ans), ['mend', 'kick']);
  assert.ok(E.answersOf(u, 'mend').includes('pw_shield'));
  assert.strictEqual(E.use(C, u, 'pw_shield', tank.uid), null);
  assert.ok(t.mended);
  assert.strictEqual(E.teleSize(t), 1.5);
  assert.deepStrictEqual(E.teleFor(C, u).map((x) => x.ans), ['kick'], 'mended: only the kick is left');
  m.tele.until = C.t; // land it now, before the shield's absorb is counted in: the size is what matters here
});

test('a kick weakens the slam but does not cancel it, once per player', () => {
  const { C, u, m } = slamFight('mage', 20);
  const t = startOf(C);
  assert.strictEqual(E.use(C, u, 'spellbreak', m.uid), null);
  assert.ok(m.tele, 'still coming');
  assert.strictEqual(E.teleSize(t), 2);
  assert.deepStrictEqual(E.teleFor(C, u), [], 'your kick is spent on this one');
  assert.ok(evs(C, 'kick').length === 1);
});

test('the tank\'s defensive avoids the slam whatever the others did', () => {
  const { C, u } = fight(40, 'warrior', { kind: 'hit', who: 'target', mult: 1, name: 'Test Slam' });
  startOf(C);
  assert.deepStrictEqual(E.teleFor(C, u).map((x) => x.ans), ['guard']);
  E.use(C, u, 'shield_wall'); tick(C, 3);
  assert.strictEqual(teleDmg(C, u), 0);
});

test('the boss card explains the team\'s answers to a slam', () => {
  E.TELE.on.add('slam');
  const k = Object.keys(D.MOBS).find((x) => D.MOBS[x].special === 'slam' && !D.MOBS[x].buster); // a plain slam
  const r = E.specialRows(E.mobUnit(k, 30))[0];
  assert.strictEqual(r.name, 'Crushing Slam');
  assert.match(r.what, /the tank's defensive avoids it; a shield or quick heal on the tank takes 1x off, each interrupt or stun 0\.5x \(2 at most\); unanswered it hits 2x\./);
});

// slam styles (#179): each boss's slam has its own name and one of three styles' numbers, which the boss's data can override
test('slam styles: crush starts at 2x, heavy starts at 3x with 3 kicks, quick at 2x with 1 kick and a short bar', () => {
  const t = (n) => Object.assign({ kicks: new Set(), mended: false }, n);
  assert.strictEqual(E.teleSize(t(E.BUSTER.crush)), 2, 'crush starts at 2x');
  const h = t(E.BUSTER.heavy); assert.strictEqual(E.teleSize(h), 3);
  h.kicks.add(1); h.kicks.add(2); h.kicks.add(3); h.kicks.add(4); assert.strictEqual(E.teleSize(h), 1.5, 'three kicks count, the fourth does not');
  const q = t(E.BUSTER.quick); q.kicks.add(1); q.kicks.add(2); assert.strictEqual(E.teleSize(q), 1.5, 'one kick counts');
  q.mended = true; assert.strictEqual(E.teleSize(q), 0.5, 'never below the floor');
  assert.strictEqual(E.teleNum(E.BUSTER.quick, 'cast'), 1.5);
  assert.strictEqual(E.teleNum(E.BUSTER.crush, 'cast'), E.TELE.cast);
});

test('a boss\'s own slam: its name and emote, its style, and its own numbers over the style\'s', () => {
  const b = E.busterOf({ key: 'hamhock', name: 'Porkchop', special: { kind: 'slam' } });
  assert.strictEqual(b.style, 'heavy'); assert.strictEqual(b.name, 'Belly Flop'); assert.strictEqual(b.nums.size, 2, 'his own start over heavy\'s 3x'); assert.strictEqual(b.nums.kickCap, 3, 'heavy\'s kicks');
  const was = D.MOBS.hamhock.buster.size; D.MOBS.hamhock.buster.size = 3.5;
  assert.strictEqual(E.busterOf({ key: 'hamhock', name: 'Porkchop', special: { kind: 'slam' } }).nums.size, 3.5, 'the boss\'s number wins');
  D.MOBS.hamhock.buster.size = was;
  const plain = E.busterOf({ key: 'rattlegore', name: 'Bonecrunch', special: { kind: 'slam' } });
  assert.deepStrictEqual([plain.style, plain.name, plain.text], ['crush', 'Crushing Slam', 'Bonecrunch slams the ground!']);
  assert.strictEqual(E.busterOf({ key: 'king_mosh', name: 'King Stomp', special: { kind: 'hogger' } }).name, 'Lunge');
  const col = { key: 'coralheart_colossus', name: 'Coralheart Colossus', special: { kind: 'slam' } };
  assert.strictEqual(E.busterOf(col).nums.floor, 2, 'Normal numbers off Hard');
  assert.strictEqual(E.busterOf(Object.assign({ onHard: true }, col)).nums.floor, 1, 'its Hard numbers on Hard');
  assert.strictEqual(E.busterOf(Object.assign({ onHard: true }, col)).nums.size, 4, 'numbers it has no Hard value for stay');
});

test('the slam\'s bar and boss card use the boss\'s style', () => {
  E.TELE.on.add('slam'); E.TELE.on.add('hogger');
  const u = E.mobUnit('hamhock', 24);
  const row = E.specialRows(u).find((r) => r.tele === 'guard');
  assert.match(row.name + ': ' + row.what, /^Belly Flop: .*takes 1x off, each interrupt or stun 0.5x \(3 at most\); unanswered it hits 2x\.$/);
  const q = E.specialRows(E.mobUnit('vagash', 11)).find((r) => r.tele === 'guard');
  assert.match(q.name + ': ' + q.what, /^Savage Maul: .*one interrupt or stun 0.5x; unanswered it hits 2x\.$/);
  const { C, m } = slamFight('mage', 20); m.key = 'hamhock'; m.special = { kind: 'slam', t: 0 }; m.hardX = []; E.TELE.on.add('slam'); // slamFight switched the kinds off
  const t = startOf(C);
  assert.deepStrictEqual([t.name, t.size, t.kickCap, t.until - t.start], ['Belly Flop', 2, 3, 3]);
  E.TELE.on.clear(); for (const k of ON) E.TELE.on.add(k);
});

test('raid slams: each boss its own, a full raid can\'t shrink them under 1.5x, and Trident Thrust can\'t be kicked', () => {
  E.TELE.on.add('slam');
  for (const k of ['magmadar', 'golemagg', 'commander_serathis', 'coralheart_colossus']) {
    const b = E.busterOf(E.mobUnit(k, 60));
    assert.ok(b.own && b.name !== 'Crushing Slam', k + ' has its own slam');
    const t = Object.assign({ kicks: new Set([1, 2, 3, 4, 5]), mended: true }, b.nums);
    assert.ok(E.teleSize(t) >= 1.5, k + ' never under 1.5x');
  }
  const row = E.specialRows(E.mobUnit('commander_serathis', 60)).find((r) => r.tele === 'guard');
  assert.match(row.name + ': ' + row.what, /^Trident Thrust: .*takes 1\.5x off \(it can't be interrupted\); unanswered it hits 3x, never under 1\.5x\.$/);
  const { C, u, m } = slamFight('mage', 20); m.key = 'commander_serathis'; m.special = { kind: 'slam', t: 0 }; m.hardX = []; E.TELE.on.add('slam');
  const t = startOf(C);
  assert.strictEqual(t.name, 'Trident Thrust');
  assert.deepStrictEqual(E.teleFor(C, u).map((x) => x.ans), [], 'a mage has no shield or heal, and the thrust can\'t be kicked');
  E.TELE.on.clear(); for (const k of ON) E.TELE.on.add(k);
});

test('a raid slam is braced, not blocked: the tank\'s defensive takes 1.5x off and it still lands', () => {
  const { C, m, tank } = slamFight('mage', 20); m.key = 'golemagg'; m.special = { kind: 'slam', t: 0 }; m.hardX = []; E.TELE.on.add('slam');
  tank.auras.push({ id: 'shield_wall', until: 1e9 });
  const t = startOf(C); E.tick(C, 0.1);
  assert.ok(t.braced, 'braced'); assert.ok(!E.teleBlocked(C, t), 'never blocked');
  assert.strictEqual(E.teleSize(t), 2, '3.5x - 1.5x, its floor 2x');
  tick(C, 4);
  assert.strictEqual(evs(C, 'brace').length, 1); assert.strictEqual(evs(C, 'dodge').length, 0, 'not avoided');
  assert.ok(teleDmg(C, tank) > 0, 'it landed on the tank');
  const row = E.specialRows(E.mobUnit('golemagg', 60)).find((r) => r.tele === 'guard');
  assert.match(row.what, /Red bar first: the tank's defensive takes 1\.5x off; a shield or quick heal/);
  E.TELE.on.clear(); for (const k of ON) E.TELE.on.add(k);
});

test('a dungeon slam is still blocked by the tank\'s defensive', () => {
  const { C, m, tank } = slamFight('mage', 20); m.key = 'oggleflint'; m.special = { kind: 'slam', t: 0 }; m.hardX = []; E.TELE.on.add('slam');
  tank.auras.push({ id: 'shield_wall', until: 1e9 });
  const t = startOf(C);
  assert.ok(E.teleBlocked(C, t)); tick(C, 4);
  assert.strictEqual(evs(C, 'dodge').length, 1); assert.strictEqual(teleDmg(C, tank), 0);
  E.TELE.on.clear(); for (const k of ON) E.TELE.on.add(k);
});

test('each healing boss casts its own heal, warned in its own words, never another boss\'s', () => {
  E.TELE.on.add('cook');
  for (const [k, M] of Object.entries(D.MOBS).filter(([, M]) => M.special === 'cook')) {
    assert.ok(M.healName, k + ' names its heal');
    assert.ok(M.specialText && /Crumbs/.test(M.specialText) === (k === 'cookie'), k + ' warns in its own words');
    const row = E.specialRows(E.mobUnit(k, M.lvl[0])).find((r) => r.tele === 'cut');
    assert.strictEqual(row.name, M.healName, k);
    assert.match(row.what, /Red bar first: an interrupt or a stun stops it/);
  }
  assert.ok(!/Fairbanks|Theka/.test(Object.values(D.MOBS).map((M) => M.specialText || '').join(' ')), 'no old names');
  E.TELE.on.clear(); for (const k of ON) E.TELE.on.add(k);
});

test('Hard raid extras warn with a red bar and hit harder when missed (#179)', () => {
  const seen = [];
  for (const [act, boss] of [['molten_core', 'baron_geddon'], ['molten_core', 'golemagg'], ['molten_core', 'sulfuron_harbinger'], ['tidecrown_citadel', 'commander_serathis'], ['tidecrown_citadel', 'tide_twin_myrel'], ['tidecrown_citadel', 'nalveshra']]) {
    const x = G.hardExtra(act, boss).find((e) => e.kind === 'hit' || e.kind === 'heal');
    assert.ok(x.tele, `${boss}: ${x.name} has a red bar`);
    assert.strictEqual(x.miss, x.kind === 'heal' ? 2.5 : 4, `${boss}: ${x.name}'s size when missed`);
    const u = Object.assign(E.mobUnit(boss, 60), { hardX: G.hardExtra(act, boss) });
    const row = E.specialRows(u).find((r) => r.name === x.name);
    assert.match(row.what, new RegExp(`missed, it ${x.kind === 'heal' ? 'heals' : 'hits'} ${x.miss}x`), `${boss}: the boss card says so`);
    seen.push(x.name);
  }
  assert.deepStrictEqual(seen, ['Ring of Fire', 'Lava Bath', 'Brimstone Ball', 'Courtyard Wave', 'Rising Tide', 'Deep Tendril']);
});

test('open-world casters cast a named spell from level 10, outside dungeons and raids (#179)', () => {
  const was = new Set(E.TELE.on); E.TELE.on.add('spell');
  try {
    assert.deepStrictEqual(E.spellOf(E.mobUnit('thistlefur_shaman', 25)), { school: 'nature', name: 'Thorn Blast' });
    assert.strictEqual(E.spellOf(Object.assign(E.mobUnit('thistlefur_shaman', 25), { inRun: true })), null, 'not in a dungeon or raid');
    assert.strictEqual(E.spellOf(E.mobUnit('thistlefur_shaman', 9)), null, 'not below level 10');
    const archer = Object.entries(D.MOBS).find(([, m]) => m.ranged === 'physical' && !m.boss)[0];
    assert.strictEqual(E.spellOf(E.mobUnit(archer, 30)), null, 'an archer has no spell');
    assert.match(E.specialFacts(E.mobUnit('thistlefur_shaman', 25))[0], /Thorn Blast|interrupt or a stun stops it; missed, it hits 2x/);
  } finally { E.TELE.on.clear(); for (const k of was) E.TELE.on.add(k); }
  assert.strictEqual(E.spellOf(E.mobUnit('thistlefur_shaman', 25)), null, 'switched off, no spell');
});
