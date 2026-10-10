// Ready and heal-target visuals (#178): losing the heal target is information (a yellow toast, not a refusal), and the
// status line between pulls names who it waits for with their class, and says when everyone is ready.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, E, character, advance, now } = require('./world');

const toasts = [], infos = [];
G.on('toast', (t) => toasts.push(t)); G.on('info', (t) => infos.push(t));

test('the heal target dying is an info toast, not a red one', () => {
  const { S } = character(35, 'priest', 'human');
  G.startRoulette();
  assert.ok(S.run && S.group, 'in a run');
  const m = S.group.members[0]; G.pickHeal(m);
  toasts.length = 0; infos.length = 0;
  G.runPull(); advance(0.2);
  const C = G.fight, u = C && C.allies.find((x) => x.memberRef === m);
  assert.ok(u, 'the member is in the fight'); u.hp = 0; u.dead = true;
  advance(0.5);
  assert.deepStrictEqual(infos, [`${m.name} died. Heals go to you.`]);
  assert.ok(!toasts.includes(infos[0]), 'and not a red toast');
});

test('the status line: who it waits for, with their class; ok once everyone is ready', () => {
  const { P, S } = character(35, 'mage', 'human');
  G.startRoulette(); const R = S.run; R.pace = 'normal';
  const v = G.vitals(); P.hp = v.maxHp; P.res = v.maxRes;
  for (const m of S.group.members) { const st = E.statsFor(m); m.hp = st.maxHp; m.res = st.maxMana; }
  const m = S.group.members.find((x) => D.CLASSES[x.cls].resource === 'mana');
  m.res = E.statsFor(m).maxMana * 0.2;
  let x = G.restLineInfo();
  assert.match(x.text, /^Waiting for /);
  assert.deepStrictEqual(x.who, { name: m.name, cls: m.cls });
  assert.strictEqual(x.ok, false);
  m.res = E.statsFor(m).maxMana; R.restUntil = now() - 1;
  x = G.restLineInfo();
  assert.match(x.text, /^Everyone ready/); assert.strictEqual(x.who, null); assert.strictEqual(x.ok, true);
  P.res = v.maxRes * 0.1; R.restUntil = now() + 5000; x = G.restLineInfo();
  assert.match(x.text, /^Waiting for your mana/); assert.strictEqual(x.who, null, 'your own name is not coloured');
});
