// A party buff cast between pulls reaches the party (#315): Word of Fortitude out of combat buffed only the caster,
// while its tooltip says it infuses the party (in a fight it already did).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, B, E, character, now } = require('./world');

test('Word of Fortitude out of combat buffs every party member', () => {
  const { S, P } = character(10, 'priest', 'human'), d = new Date(now());
  const who = S.bots.filter((b) => B.factionOf(b) === G.myFaction() && B.isOnline(b, d)).slice(0, 2);
  const R = Math.random; Math.random = () => 0.99; try { for (const b of who) G.acceptPartyInvite(b.id); } finally { Math.random = R; }
  assert.strictEqual(S.wparty.members.length, 2);
  P.res = 9999;
  assert.strictEqual(G.castOutOfCombat('pw_fortitude'), null);
  for (const m of S.wparty.members) {
    const u = E.charUnit(m, 'ally', 'bot', now());
    assert.ok(u.auras.some((a) => a.id === 'pw_fortitude'), `${m.name} enters the next fight with it`);
  }
});

test('a thank-you for a buff comes only after a real one (#316)', () => {
  const { S, P } = character(10, 'priest', 'human'), d = new Date(now());
  const thanks = () => S.pending.filter((x) => /buff|^ty!$/.test(x.text)).length;
  assert.strictEqual(thanks(), 0, 'no buff, no thanks');
  const who = S.bots.filter((b) => B.factionOf(b) === G.myFaction() && B.isOnline(b, d)).slice(0, 2);
  const R = Math.random; Math.random = () => 0.99; try { for (const b of who) G.acceptPartyInvite(b.id); } finally { Math.random = R; }
  for (let i = 0; i < 40 && !thanks(); i++) { P.res = 9999; S.flags.thankedAt = 0; G.castOutOfCombat('pw_fortitude'); }
  assert.ok(thanks() >= 1, 'a buff now and then gets one');
  assert.ok(!/ty for the buff/.test(require('fs').readFileSync(require('path').join(__dirname, '../src/bots.js'), 'utf8')));
});
