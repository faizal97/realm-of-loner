// The Ruinfall pre-patch's class abilities (#512–#521, docs/plans/2026-11-08-prepatch-design.md): each moves power around
// or asks for a decision. These tests check each mechanic on its own; the sims check that none adds power.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, E, character } = require('./world');

const unit = (cls, name) => { const u = E.charUnit(G.botChar({ name: name || cls, cls, race: 'human', level: 60, skill: 0.6 }), 'ally', 'bot', 1); u.res = u.maxRes; u.bot = { skill: 0.6, afkUntil: 1e9 }; return u; }; // standing still: no bot brain in these checks
const mob = (hp) => { const m = E.mobUnit(Object.keys(D.MOBS).find((k) => D.MOBS[k].lvl && !D.MOBS[k].boss) , 60, { hp: 1, dmg: 0 }); m.maxHp = m.hp = hp || 1e7; return m; };
const fight = (allies, enemies) => E.fight(allies, enemies || [mob()], { apart: 0 });
const use = (C, u, id, tgt) => { u.gcdUntil = 0; u.cast = null; return E.use(C, u, id, tgt && tgt.uid); };
const run = (C, s) => { for (let i = 0; i < s * 10; i++) E.tick(C, 0.1); };

test('every class has one, at 60, taught by a class quest; a player knows it only once that quest is done', () => {
  for (const cls of Object.keys(D.CLASSES)) {
    const id = D.PREPATCH_ABILITIES[cls], A = D.ABILITIES[id];
    assert.ok(A && A.lvl === 60 && A.learn && A.special && E.SPECIAL[A.special], cls);
    assert.ok(D.CLASSES[cls].abilities.includes(id));
  }
  const { P } = character(60, 'warrior', 'human');
  assert.ok(!G.knownAbilities().includes('intervene'));
  P.done = Object.assign({}, P.done, { [D.ABILITIES.intervene.learn]: true });
  assert.ok(G.knownAbilities().includes('intervene'));
});

test('Intervene: the next big hit on the guarded ally lands on the warrior; a small hit does not (#512)', () => {
  const w = unit('warrior'), a = unit('mage', 'Ally'), C = fight([w, a]), e = C.enemies[0];
  assert.strictEqual(use(C, w, 'intervene', a), null);
  const ah = a.hp, wh = w.hp;
  E.dealDamage(C, e, a, a.maxHp * 0.05, {});
  assert.ok(a.hp < ah && w.hp === wh, 'a small hit still lands on the ally');
  const ah2 = a.hp;
  E.dealDamage(C, e, a, a.maxHp * 0.3, {});
  assert.strictEqual(a.hp, ah2, 'the big hit is taken');
  assert.ok(w.hp < wh, 'by the warrior');
  E.dealDamage(C, e, a, a.maxHp * 0.3, {});
  assert.ok(a.hp < ah2, 'only once');
});

test('Chronomark: set, take damage, use again: health and mana snap back; the cooldown does not block the second use (#513)', () => {
  const m = unit('mage'), C = fight([m]), e = C.enemies[0];
  use(C, m, 'chronomark');
  const hp = m.hp, res = m.res;
  E.dealDamage(C, e, m, m.maxHp * 0.4, {}); m.res -= 500;
  run(C, 3);
  assert.strictEqual(use(C, m, 'chronomark'), null);
  assert.strictEqual(m.hp, hp); assert.strictEqual(m.res, res);
  assert.ok(E.canUse(C, m, 'chronomark', m), 'then it waits for its cooldown');
});

test('Vow of Atonement: damage dealt is halved and the half heals the most hurt ally (#514)', () => {
  const p = unit('priest'), a = unit('warrior', 'Hurt'), C = fight([p, a]), e = C.enemies[0];
  a.hp = a.maxHp * 0.3;
  const base = E.dealDamage(C, p, e, 1000, { school: 'holy' });
  use(C, p, 'vow_of_atonement');
  const before = a.hp, dealt = E.dealDamage(C, p, e, 1000, { school: 'holy' });
  assert.ok(Math.abs(dealt - base / 2) <= 2, `half the damage (${dealt} vs ${base})`);
  assert.ok(a.hp - before >= dealt * 0.9, 'and about as much healing on the hurt ally');
});

test('Set Up: a finisher with no damage; the next ally hit on the target adds it, the rogue\'s own hit does not (#515)', () => {
  const r = unit('rogue'), w = unit('warrior'), C = fight([r, w]), e = C.enemies[0];
  r.cp = 5; r.cpTarget = e.uid;
  const hp = e.hp;
  assert.strictEqual(use(C, r, 'set_up', e), null);
  assert.strictEqual(e.hp, hp, 'no damage now');
  assert.strictEqual(r.cp, 0, 'the combo points are spent');
  const bonus = e.auras.find((a) => a.setup).setup;
  assert.ok(bonus > 0);
  const own = E.dealDamage(C, r, e, 100, {});
  assert.ok(own < 100 + bonus / 2, 'the rogue cannot cash it in');
  const got = E.dealDamage(C, w, e, 100, {});
  assert.ok(got >= bonus, 'the warrior\'s hit carries it');
  assert.ok(!e.auras.some((a) => a.setup), 'once');
});

test('Lantern of Faith: a heal lands half on its target and half on the lantern; the total is the same (#516)', () => {
  const pal = unit('paladin'), t = unit('warrior', 'T'), l = unit('mage', 'L'), C = fight([pal, t, l]);
  t.hp = 100; l.hp = 100;
  const solo = (() => { const w = unit('warrior', 'S'), F = fight([pal, w]); w.hp = 100; E.heal(F, pal, w, 200, {}); return w.hp - 100; })();
  use(C, pal, 'lantern_of_faith', l);
  E.heal(C, pal, t, 200, {});
  assert.ok(Math.abs((t.hp - 100) - solo / 2) <= 1 && Math.abs((l.hp - 100) - solo / 2) <= 1, `${t.hp - 100} + ${l.hp - 100} = ${solo}`);
});

test('Blood Bargain: the warlock and its target both take 20% more (#517)', () => {
  const wl = unit('warlock'), C = fight([wl]), e = C.enemies[0];
  const a = E.dealDamage(C, wl, e, 1000, {});
  use(C, wl, 'blood_bargain', e);
  const b = E.dealDamage(C, wl, e, 1000, {});
  assert.ok(Math.abs(b / a - 1.2) < 0.02, `${b} vs ${a}`);
  assert.ok(wl.auras.some((x) => x.bargain), 'the warlock too');
});

test('Lure: the next enemy to join is held for 6 sec, only one (#518)', () => {
  const h = unit('hunter'), C = fight([h]);
  use(C, h, 'lure');
  const x = mob(), y = mob();
  E.addEnemy(C, x); E.addEnemy(C, y);
  assert.ok(x.stunUntil >= C.t + 5.9, 'held');
  assert.ok(!(y.stunUntil > C.t), 'the next one is not');
});

test('Seed of Renewal: grows to a bigger heal; blooming early heals less; a big hit crushes it (#519)', () => {
  const d = unit('druid'), a = unit('warrior', 'A'), C = fight([d, a]), e = C.enemies[0];
  a.hp = 1000; use(C, d, 'seed_of_renewal', a); run(C, 10.2);
  const full = a.hp - 1000;
  a.hp = 1000; d.cds = {}; use(C, d, 'seed_of_renewal', a); run(C, 1);
  assert.strictEqual(use(C, d, 'seed_of_renewal', a), null, 'bloom early');
  const early = a.hp - 1000;
  assert.ok(full > 0 && early > 0 && early < full * 0.6, `${early} < ${full}`);
  d.cds = {}; use(C, d, 'seed_of_renewal', a);
  E.dealDamage(C, e, a, a.maxHp * 0.3, {});
  assert.ok(!a.auras.some((x) => x.seed != null), 'crushed');
});

test('Kinship Totem: health evens out toward the shared share; the total never changes (#520)', () => {
  const s = unit('shaman'), a = unit('warrior', 'A'), b = unit('mage', 'B'), C = fight([s, a, b]);
  a.hp = a.maxHp * 0.2; b.hp = b.maxHp; s.hp = s.maxHp;
  const tot = () => [s, a, b].reduce((n, w) => n + w.hp, 0), t0 = tot();
  use(C, s, 'kinship_totem'); run(C, 2.1);
  assert.ok(a.hp > a.maxHp * 0.3, 'the hurt one gains');
  assert.ok(Math.abs(tot() - t0) < 3, 'the total is the same');
});

test('Duet: a party heal song reaches only the duet ally, twice as strong (#521)', () => {
  const bard = unit('bard'), a = unit('warrior', 'A'), b = unit('mage', 'B'), F = fight([bard, a, b]);
  a.hp = 1000; b.hp = 1000;
  use(F, bard, 'duet', a);
  const heals = Object.keys(D.ABILITIES).find((k) => D.ABILITIES[k].cls === 'bard' && D.ABILITIES[k].song && D.ABILITIES[k].song.pulse === 'heal');
  E.songHitsForTest(F, bard, { ab: heals, every: 3 }, 100, {});
  assert.strictEqual(a.hp, 1200); assert.strictEqual(b.hp, 1000);
});

test('the pre-patch campaign opens at 60 after The Drowned Crown or any raid clear, not before (#508)', () => {
  const { P } = character(60, 'warrior', 'human');
  assert.strictEqual(G.prepatchOpen(), false);
  P.done = Object.assign({}, P.done, { tc_crown_a: true });
  assert.strictEqual(G.prepatchOpen(), true, 'the story');
  const { P: Q } = character(60, 'mage', 'orc');
  Q.codex = Object.assign({}, Q.codex, { molten_core: { clears: 1 } });
  assert.strictEqual(G.prepatchOpen(), true, 'a raid clear');
  character(59, 'priest', 'human');
  assert.strictEqual(G.prepatchOpen(), false, 'never below 60');
});

test('debt collectors: every levelling place has them at its own level, no Ledger name below 30, none in towns (#522)', () => {
  const { P } = character(20, 'warrior', 'human');
  const places = Object.keys(D.PLACES).filter((k) => G.collectorsHere(D.PLACES[k]));
  assert.ok(places.length > 100, `${places.length} places`);
  for (const k of places) {
    P.place = k; const pl = D.PLACES[k], c = G.placeMobs().filter((m) => D.MOBS[m.key].collector);
    assert.strictEqual(c.length, D.PREPATCH.collectors, k);
    for (const m of c) {
      assert.ok(m.level >= pl.lvl[0] && m.level <= pl.lvl[1], `${k} ${m.level}`);
      assert.strictEqual(m.key, pl.lvl[0] >= 30 ? 'ledger_collector' : 'debt_collector', k);
    }
  }
  assert.ok(!Object.keys(D.PLACES).some((k) => D.PLACES[k].safe && G.collectorsHere(D.PLACES[k])), 'no towns');
  P.debtNotes = 0;
  assert.strictEqual(G.collectorKill('debt_collector', 20), 1);
  assert.strictEqual(G.collectorKill('debt_collector', 12), 0, 'grey gives none');
  assert.strictEqual(P.debtNotes, 1);
});

test('torn debt notes trade for the Debt-Breaker title once and for Mentor Marks; a clerk in every trainer town (#523)', () => {
  const { P } = character(30, 'rogue', 'orc');
  const a = G.account(); delete a.debtBreaker; G.saveAccount(a);
  P.debtNotes = 44;
  const marks = G.account().marks;
  assert.strictEqual(G.noteTrade('debt_breaker'), true);
  assert.ok(G.titleUnlocked(D.TITLES.find((t) => t.id === 'debt_breaker')));
  assert.strictEqual(G.noteTrade('debt_breaker'), false, 'once');
  assert.strictEqual(G.noteTrade('marks'), false, 'four notes left: not enough');
  P.debtNotes = 5;
  assert.strictEqual(G.noteTrade('marks'), true);
  assert.strictEqual(G.account().marks, marks + 10); assert.strictEqual(P.debtNotes, 0);
  const towns = new Set([].concat(...Object.values(D.PROF_TRAINERS)));
  for (const p of towns) if (D.PLACES[p]) assert.ok(D.PLACES[p].npcs.includes('note_clerk'), p);
});

test('the campaign and class quests: locked until the gate, each faction its own chain, each class only its own quest (#509, #510)', () => {
  const { P } = character(60, 'warrior', 'human');
  assert.strictEqual(G.questState('pp_a_notes'), 'locked', 'before the gate');
  P.done = Object.assign({}, P.done, { tc_crown_a: true });
  assert.strictEqual(G.questState('pp_a_notes'), 'available');
  assert.strictEqual(G.questState('pp_h_notes'), 'locked', 'the other faction');
  assert.strictEqual(G.questState(D.ABILITIES.intervene.learn), 'available');
  assert.strictEqual(G.questState(D.ABILITIES.chronomark.learn), 'locked', 'another class');
  for (const f of ['a', 'h']) {
    const chain = Object.keys(D.QUESTS).filter((k) => k.startsWith(`pp_${f}_`));
    assert.strictEqual(chain.length, 6, f);
    for (const k of chain) for (const n of [D.QUESTS[k].giver, D.QUESTS[k].turnin]) assert.ok(Object.values(D.PLACES).some((p) => p.npcs.includes(n)), `${k}: ${n} stands somewhere`);
  }
});

test('collectors stay where a quest still needs them after the event ends (#522)', () => {
  const { P } = character(60, 'warrior', 'human');
  const pl = Object.keys(D.PLACES).find((k) => D.PLACES[k].lvl && D.PLACES[k].lvl[0] >= 55 && G.collectorsHere(D.PLACES[k]));
  D.PREPATCH.live = false;
  try {
    assert.ok(!G.collectorsHere(D.PLACES[pl]), 'gone when nobody needs them');
    P.done = Object.assign({}, P.done, { tc_crown_a: true });
    P.quests[D.ABILITIES.intervene.learn] = { prog: [] };
    assert.ok(G.collectorsHere(D.PLACES[pl]), 'back for the class quest');
  } finally { D.PREPATCH.live = true; delete P.quests[D.ABILITIES.intervene.learn]; }
});
