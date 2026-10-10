// The death recap (#192): one line per ally death, in order, made of facts from the last 5 seconds: the killing blow
// and its size, the damage taken, the last heal, and the healer's state when it applies. A scripted fight feeds the
// events, so each fact is checked exactly.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, E } = require('./world');

// a hand-built fight: a tank, a healer, a mage and a boss, standing where the test puts them
function fight() {
  const unit = (uid, o) => Object.assign({ uid, side: 'ally', kind: 'bot', hp: 1000, maxHp: 1000, res: 1000, maxRes: 1000, resType: 'mana', auras: [], dead: false, pos: { x: 0, y: 0, z: 0 } }, o);
  const C = { t: 0, kind: 'run', units: {}, allies: [], enemies: [], events: [] };
  const add = (u) => { C.units[u.uid] = u; (u.side === 'ally' ? C.allies : C.enemies).push(u); return u; };
  return {
    C,
    tank: add(unit(1, { name: 'Doran', cls: 'warrior', role: 'tank', resType: 'rage' })),
    heal: add(unit(2, { name: 'Mirel', cls: 'priest', role: 'healer' })),
    mage: add(unit(3, { name: 'Tess', cls: 'mage', role: 'dps' })),
    boss: add(unit(9, { side: 'enemy', kind: 'mob', name: 'Ragefang', cls: null })),
  };
}
const at = (C, t, e) => { C.t = t; G.recapFeed(C, [Object.assign({ t }, e)]); };

test('a death: the killing blow, the damage in 5 s and the last heal', () => {
  const { C, tank, heal, boss } = fight();
  at(C, 1, { type: 'heal', src: heal.uid, tgt: tank.uid, amount: 300 });   // older than 5 s at the death: not counted
  at(C, 3.8, { type: 'heal', src: heal.uid, tgt: tank.uid, amount: 200 });
  at(C, 4, { type: 'dmg', src: boss.uid, tgt: tank.uid, amount: 700, melee: true });
  at(C, 6, { type: 'dmg', src: boss.uid, tgt: tank.uid, amount: 960, melee: true });
  at(C, 8, { type: 'dmg', src: boss.uid, tgt: tank.uid, amount: 1240, ab: 'slam' });
  tank.dead = true; at(C, 8, { type: 'die', uid: tank.uid, by: boss.uid });
  const [d] = C.recap.deaths;
  assert.strictEqual(d.name, 'Doran'); assert.strictEqual(d.cls, 'warrior');
  const txt = G.recapText(d);
  assert.strictEqual(txt.head, "died to Ragefang's slam (1,240)");
  assert.strictEqual(txt.facts, 'took 2,900 in 5 s · last heal 4.2 s before');
});

test('no heal in 5 s, and the healer\'s state: low mana, casting on someone else, dead, out of range', () => {
  const cases = [
    [(f) => { f.heal.res = 40; }, 'healer at 4% mana'],
    [(f) => { f.heal.cast = { ab: 'heal', tgt: f.mage.uid }; }, 'healer casting on Tess'],
    [(f) => { f.heal.dead = true; }, 'healer dead'],
    [(f) => { f.heal.pos = { x: 200, y: 0, z: 0 }; }, 'healer out of range'],
    [() => {}, null],
  ];
  for (const [set, fact] of cases) {
    const f = fight(); set(f);
    at(f.C, 2, { type: 'dmg', src: f.boss.uid, tgt: f.tank.uid, amount: 1500, ab: 'frostbolt' });
    f.tank.dead = true; at(f.C, 2, { type: 'die', uid: f.tank.uid, by: f.boss.uid });
    const txt = G.recapText(f.C.recap.deaths[0]);
    assert.strictEqual(txt.head, `died to ${D.ABILITIES.frostbolt.name} (1,500)`);
    assert.strictEqual(txt.facts, 'took 1,500 in 5 s · no heal in 5 s' + (fact ? ' · ' + fact : ''), fact || 'nothing about a healer who was fine');
  }
});

test('deaths keep their order; the healer\'s own death says nothing about a healer', () => {
  const { C, tank, heal, boss } = fight();
  at(C, 1, { type: 'dmg', src: boss.uid, tgt: heal.uid, amount: 1000, melee: true });
  heal.dead = true; at(C, 1, { type: 'die', uid: heal.uid, by: boss.uid });
  at(C, 3, { type: 'dmg', src: boss.uid, tgt: tank.uid, amount: 1000, melee: true });
  tank.dead = true; at(C, 3, { type: 'die', uid: tank.uid, by: boss.uid });
  assert.deepStrictEqual(C.recap.deaths.map((d) => d.name), ['Mirel', 'Doran']);
  assert.strictEqual(G.recapText(C.recap.deaths[0]).facts, 'took 1,000 in 5 s · no heal in 5 s');
  assert.strictEqual(G.recapText(C.recap.deaths[0]).head, "died to Ragefang's melee hit (1,000)");
  assert.match(G.recapText(C.recap.deaths[1]).facts, / · healer dead$/);
});

test('enemies and pets dying are not in the recap', () => {
  const { C, boss } = fight();
  const pet = Object.assign({}, C.units[3], { uid: 4, kind: 'pet', name: 'Imp' }); C.units[4] = pet;
  boss.dead = true; at(C, 1, { type: 'die', uid: boss.uid });
  pet.dead = true; at(C, 1, { type: 'die', uid: pet.uid });
  assert.strictEqual(C.recap.deaths.length, 0);
});

test('your own death out in the world leaves the recap, until the next pull', () => {
  const { character, advance } = require('./world');
  const { P } = character(5, 'mage', 'human');
  const place = Object.keys(D.PLACES).find((k) => { const p = D.PLACES[k]; return p.lvl && p.lvl[0] >= 40 && p.mobs && p.mobs.length && !p.safe; }); P.place = place;
  let told = null; G.on('recap', (r) => { told = r; });
  const m = G.placeMobs().find((x) => x.state === 'alive'); G.engage(m.id);
  for (let i = 0; i < 120 && G.fight; i++) advance(1);
  assert.ok(!G.fight && P.ghostUntil, 'the level-5 mage died');
  assert.ok(G.recap && G.recap.self, 'a recap of your own death');
  assert.strictEqual(told, G.recap, 'and the UI was told');
  assert.strictEqual(G.recap.deaths[0].name, P.name);
  assert.match(G.recapText(G.recap.deaths[0]).head, /^died to .+ \(\d[\d,]*\)$/);
  P.ghostUntil = 0; P.hp = null; const m2 = G.placeMobs().find((x) => x.state === 'alive'); G.engage(m2.id);
  assert.ok(G.fight, 'the next pull'); assert.strictEqual(G.recap, null, 'clears the recap');
});
