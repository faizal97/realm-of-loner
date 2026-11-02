// #72: each person has a short history of their own (levels, clears with their guild, an item, guild moves), two friends
// and a rival; the player's own guild is never touched by a guild move.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, B, now, setNow } = require('./world');

test('a month on the realm: people level, clear places with their guild, change guilds; stories read as lines', () => {
  if (G.S) G.logout(); G.newGame({ name: 'Ana', cls: 'warrior', race: 'human' });
  const S = G.S; S.player.guild = S.bots.find((b) => b.guild >= 0).guild; const mine = S.player.guild;
  const mates = new Set(S.bots.filter((b) => b.guild === mine).map((b) => b.id));
  for (let d = 0; d < 30; d++) { B.advance(S, 86400000); setNow(now() + 86400000); }
  const all = S.bots.flatMap((b) => (b.hist || []).map((e) => e.k));
  for (const k of ['lvl', 'clear', 'joined']) assert.ok(all.includes(k), `someone has a "${k}" entry`);
  assert.ok(S.bots.every((b) => !b.hist || b.hist.length <= B.HIST_MAX), 'a history stays short');
  const lines = S.bots.flatMap((b) => (b.hist || []).map(B.histText)).filter(Boolean);
  assert.ok(lines.some((l) => /^Cleared .+ with <.+>$/.test(l)) && lines.some((l) => /^Reached level \d+$/.test(l)), lines.slice(0, 5).join(' | '));
  for (const b of S.bots) if (mates.has(b.id)) assert.strictEqual(b.guild, mine, 'nobody leaves the player\'s guild by a guild move');
  assert.ok(!S.bots.some((b) => !mates.has(b.id) && b.guild === mine && (b.hist || []).some((e) => e.k === 'joined')), 'and nobody joins it by one');
});

test('friends and a rival of their own: the same each time, kept until one of them quits', () => {
  const S = G.S, b = S.bots.find((x) => x.level > 20);
  const c1 = B.circle(S, b), c2 = B.circle(S, b);
  assert.strictEqual(c1.pals.length, 2); assert.deepStrictEqual(c1.pals.map((x) => x.id), c2.pals.map((x) => x.id));
  if (c1.rival) assert.strictEqual(c1.rival.cls, b.cls);
  S.bots.splice(S.bots.indexOf(c1.pals[0]), 1);
  const c3 = B.circle(S, b); assert.ok(c3.pals.every(Boolean) && c3.pals.length === 2, 'a friend who quit is replaced');
});

test('the story is kept once, in the account roster, not in every character save', () => {
  const S = G.S, b = S.bots.find((x) => x.hist && x.hist.length); B.circle(S, b); G.save();
  const save = G.readSave(S.id), roster = JSON.parse(require('./world').store.getItem('azsolo.roster'));
  assert.ok(!save.bots.some((x) => x.hist || x.pals), 'not in the character save');
  assert.ok(roster.bots.find((x) => x.id === b.id).hist.length, 'in the roster');
  G.logout(); G.load(save.id); assert.ok(G.S.bots.find((x) => x.id === b.id).hist.length, 'and back after loading');
});
