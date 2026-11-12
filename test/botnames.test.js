// Two people whose names differ by one letter are never in one group (play-test, build 69aa5d9).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const W = require('./world');
const { G, D, B, character } = W;

const SOC = () => globalThis.SOC;

test('the group finder never puts two people whose names differ by one letter in one group', () => {
  const { S } = character(30, 'warrior', 'human');
  const abc = 'abcdefghijklmnopqrstuvwxyz';
  S.bots.forEach((b, i) => { b.name = 'Zan' + abc[i % 26] + abc[Math.floor(i / 26) % 26]; });
  const act = Object.keys(D.ACTIVITIES).find((k) => { const A = D.ACTIVITIES[k]; return A.dungeon && (A.size || 5) === 5 && !A.needQuest && A.minLvl <= 30 && (A.maxLvl || 60) >= 30; });
  let groups = 0;
  for (let i = 0; i < 25; i++) {
    S.player.place = D.ACTIVITIES[act].where; G.queueFor(act); if (!S.queue) continue;
    S.queue.popAt = Date.now() - 1; W.advance(2); if (!S.queue || !S.queue.group) continue;
    const names = [S.player.name].concat(S.queue.group.members.map((m) => (m.bot && m.bot.name) || m.name));
    for (let x = 0; x < names.length; x++) for (let y = x + 1; y < names.length; y++) assert.ok(!B.namesClose(names[x], names[y]), `${names[x]} and ${names[y]}`);
    groups++; G.declinePop();
  }
  assert.ok(groups >= 10, `${groups} groups`);
});

test('names that differ by one letter are close; others are not', () => {
  assert.ok(B.namesClose('Zanrim', 'Zanric'));
  assert.ok(B.namesClose('Zanric', 'Zanrica'));
  assert.ok(B.namesClose('Tor', 'tor'));
  assert.ok(!B.namesClose('Zanrim', 'Korric'));
  assert.ok(!B.namesClose('Zanrim', 'Zandor'));
});
