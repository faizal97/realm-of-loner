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
  const lines = S.bots.flatMap((b) => (b.hist || []).map((e) => B.histText(e))).filter(Boolean);
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

test('a low-level reader is never told of a raid, a level-60 place or a high-level item (#303)', () => {
  const S = G.S, D = globalThis.D;
  const raid = Object.keys(D.ACTIVITIES).find((k) => (D.ACTIVITIES[k].size || 5) > 5 && D.DUNGEONS[D.ACTIVITIES[k].dungeon]);
  const low = Object.keys(D.ACTIVITIES).find((k) => D.ACTIVITIES[k].dungeon && D.ACTIVITIES[k].minLvl <= 15 && (D.ACTIVITIES[k].size || 5) <= 5);
  const top = Object.keys(D.ITEMS).find((id) => D.ITEMS[id].lvl >= 58 && D.ITEMS[id].source);
  assert.strictEqual(B.histText({ k: 'clear', v: raid, w: 0 }, 10), null, 'a raid at 10');
  assert.strictEqual(B.histText({ k: 'item', v: top }, 10), null, 'a level-58+ item at 10');
  assert.ok(B.histText({ k: 'clear', v: raid, w: 0 }, 60), 'the raid at 60');
  assert.ok(B.histText({ k: 'clear', v: low, w: 0 }, 10), 'a dungeon near your level');
  assert.ok(!B.itemTellable(top, 10) && B.itemTellable(top, 60));
  // a month of the realm: every line a level-10 reader gets passes the news's rule
  for (const b of S.bots) for (const e of b.hist || []) if (e.k === 'clear' && B.histText(e, 10)) assert.ok(B.newsNames({ player: { level: 10 } }, e.v), e.v);
});

test('friends and a rival are from their own side (#309)', () => {
  const S = G.S;
  for (const b of S.bots) { const c = B.circle(S, b); for (const x of c.pals.concat(c.rival ? [c.rival] : [])) assert.strictEqual(B.factionOf(x), B.factionOf(b), `${b.name}: ${x.name}`); }
  const b = S.bots.find((x) => B.factionOf(x) === 'alliance'), enemy = S.bots.find((x) => B.factionOf(x) === 'horde');
  b.pals = [enemy.id, enemy.id]; b.rival = enemy.id;
  assert.ok(B.circle(S, b).pals.every((x) => B.factionOf(x) === 'alliance'), 'an older pick from the other side is made again');
});
