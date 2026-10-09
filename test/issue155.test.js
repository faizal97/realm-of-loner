// Whom heals go to (#155, #156). A player with an ability aimed at an ally picks a party member by tapping their row;
// the top frame shows the pick (#155: a hand-written class list left out Shaman), the pick is kept by who the member
// is so it holds between pulls, tapping it again clears it, and when the member dies or leaves heals go back to you
// with one log line and one toast.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, B, character, advance } = require('./world');

const toasts = []; G.on('toast', (t) => toasts.push(t));
const zoneFor = (L) => Object.keys(D.PLACES).find((k) => { const p = D.PLACES[k]; return p.lvl && p.lvl[0] <= L && p.lvl[1] >= L && !p.safe && (p.mobs || []).length; });
// a character in a world party with two members, standing where creatures are
function inParty(cls) {
  const { P, S } = character(20, cls, 'human');
  P.place = zoneFor(20);
  const bots = S.bots.slice(0, 2).map((b) => Object.assign({}, b, { level: 20 }));
  for (const b of bots) G.addToParty(b);
  assert.strictEqual(S.wparty.members.length, 2, 'two party members');
  return { P, S, members: S.wparty.members };
}
const pull = () => { const m = G.placeMobs().find((x) => x.state === 'alive'); G.engage(m.id); return G.fight; };
const unitOf = (C, m) => C.allies.find((x) => x.memberRef === m);
const endFight = () => { G.fight = null; G.pUnit = null; };

test('who sees where heals go comes from the abilities: any known ability aimed at an ally', () => {
  for (const [k, c] of Object.entries(D.CLASSES)) {
    character(20, k, 'human');
    const heals = c.abilities.some((a) => D.ABILITIES[a] && D.ABILITIES[a].lvl <= 20 && D.ABILITIES[a].target === 'ally');
    assert.strictEqual(G.healsAllies(), heals, `${c.name}: ${heals ? 'has' : 'has no'} ally heal`);
  }
  character(20, 'shaman', 'human'); assert.ok(G.healsAllies(), 'Shaman');
  character(20, 'warrior', 'human'); assert.ok(!G.healsAllies(), 'Warrior');
});

test('the top frame shows a Shaman\'s and a Priest\'s pick; a Warrior keeps the enemy (#155)', () => {
  for (const cls of ['shaman', 'priest', 'warrior']) {
    const { members } = inParty(cls); const C = pull(), foe = G.pUnit.target;
    assert.strictEqual(G.frameTarget(), foe, `${cls}: the enemy before picking anyone`);
    G.pickHeal(members[0]);
    assert.strictEqual(C.allyTarget, unitOf(C, members[0]).uid);
    assert.strictEqual(G.frameTarget(), cls === 'warrior' ? foe : C.allyTarget, `${cls}: after picking`);
    endFight(); G.leaveParty(true);
  }
});

test('the pick holds into the next pull, and tapping the picked row clears it', () => {
  const { members } = inParty('priest');
  G.pickHeal(members[1]); // before any fight
  assert.ok(G.isHealPick(members[1]) && G.healPick() === members[1]);
  let C = pull(); assert.strictEqual(C.allyTarget, unitOf(C, members[1]).uid, 'selected at the start of the first pull');
  endFight(); C = pull(); assert.strictEqual(C.allyTarget, unitOf(C, members[1]).uid, 'and of the next');
  G.pickHeal(members[1]);
  assert.strictEqual(G.healPick(), null); assert.strictEqual(C.allyTarget, null, 'heals go to you');
  endFight(); G.leaveParty(true);
});

test('the picked member dies: one log line and one toast, then heals go to you', () => {
  const { S, members } = inParty('shaman');
  const C = pull(); G.pickHeal(members[0]);
  toasts.length = 0; const chat0 = S.chat.length;
  const u = unitOf(C, members[0]); u.hp = 0; u.dead = true;
  advance(0.5);
  const want = `${members[0].name} died. Heals go to you.`;
  assert.deepStrictEqual(toasts, [want]);
  assert.strictEqual(S.chat.slice(chat0).filter((m) => m.text === want).length, 1, 'one log line');
  assert.strictEqual(G.healPick(), null); assert.ok(G.fight ? G.fight.allyTarget == null : true);
  endFight(); G.leaveParty(true);
});

test('the picked member leaves the party: one message; the party ending clears it quietly', () => {
  const { S, members } = inParty('priest');
  G.pickHeal(members[0]); toasts.length = 0;
  const name = members[0].name; S.wparty.members.splice(0, 1);
  advance(0.2);
  assert.deepStrictEqual(toasts, [`${name} left the party. Heals go to you.`]);
  G.pickHeal(S.wparty.members[0]); toasts.length = 0;
  G.leaveParty(true); advance(0.2);
  assert.deepStrictEqual(toasts, [], 'no message when the whole party ends');
  assert.strictEqual(S.healPick, null);
});

test('an old save loads with nobody picked', () => {
  const { S } = inParty('priest'); delete S.healPick;
  assert.strictEqual(G.healPick(), null);
  const C = pull(); assert.strictEqual(C.allyTarget, null);
  endFight(); G.leaveParty(true);
});
