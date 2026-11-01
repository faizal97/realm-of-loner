// #70, living server phase 1: bot chat says only true things, repeats far less, and about half as often.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, B, character, now, setNow } = require('./world');

const at = (h) => { const d = new Date(now()); d.setHours(h, 0, 0, 0); setNow(d.getTime()); };

test('time-of-day words match the clock', () => {
  const { S } = character(30);
  at(9); assert.equal(B.lineTrue(S, 'morning guild', null, 'guild'), true);
  assert.equal(B.lineTrue(S, 'evening all', null, 'guild'), false);
  assert.equal(B.lineTrue(S, 'brb dinner', null, 'general'), false);
  at(22); assert.equal(B.lineTrue(S, 'gn guys', null, 'guild'), true);
  assert.equal(B.lineTrue(S, "who's online tonight?", null, 'guild'), true);
  assert.equal(B.lineTrue(S, 'morning guild', null, 'guild'), false);
  at(19);
});

test('a busy or quiet server is said only when the online count shows it', () => {
  const { S } = character(30);
  const d = new Date(now()), share = (h) => { d.setHours(h, 0, 0, 0); return B.onlineCount(S, d) / S.bots.length; };
  for (let h = 0; h < 24; h++) {
    d.setHours(h, 0, 0, 0); setNow(d.getTime()); const f = share(h);
    assert.equal(B.lineTrue(S, 'server feels packed tonight', null, 'general'), f >= 0.5 && (h >= 17 || h < 5), `${h}:00, ${f.toFixed(2)} online`);
    assert.equal(B.lineTrue(S, 'server is so quiet today, love it', null, 'general'), f <= 0.25, `${h}:00, ${f.toFixed(2)} online`);
  }
  at(19);
});

test('a line that remembers you comes only from someone with a record of you', () => {
  const { S } = character(30);
  const b = S.bots[0];
  assert.equal(B.lineTrue(S, 'ty for the help earlier', b, 'guild'), false);
  assert.equal(B.lineTrue(S, `${S.player.name} carrying the guild again`, b, 'guild'), false);
  assert.equal(B.lineTrue(S, 'died to a raptor again. third time today', b, 'general'), true, 'about itself, in General');
  S.soc = S.soc || { next: {} }; S.soc.friends = { [b.id]: { n: 1, where: null, last: now() } };
  assert.equal(B.lineTrue(S, 'ty for the help earlier', b, 'guild'), true);
});

test('a bot names no place above its level + 3; capitals and neutral towns are free', () => {
  const high = Object.values(D.PLACES).find((p) => p.lvl && p.lvl[0] >= 50 && !p.city && !p.neutral && p.name.length > 6);
  assert.ok(B.contentAbove(`where is ${high.name}?`, 5));
  assert.equal(B.contentAbove(`where is ${high.name}?`, high.lvl[0] - 3), null);
  assert.equal(B.contentAbove('coppergulch is so hot', 1), null);
  assert.equal(B.contentAbove('rumhook bay at sunset', 1), null);
  assert.equal(B.contentAbove('vazhrak is huge', 1), null);
});

test('a template is not heard twice within the hour, and a bot does not repeat its own', () => {
  const { S } = character(30);
  const b = S.bots[0], list = [['x0', () => 'one'], ['x1', () => 'two']];
  const r = B.freshLine(S, b, 'general', list, {});
  B.heard(S, b, r.k);
  const r2 = B.freshLine(S, b, 'general', list, {});
  assert.notEqual(r2.k, r.k);
  B.heard(S, b, r2.k);
  assert.equal(B.freshLine(S, b, 'general', list, {}), null, 'nothing fresh: nothing said');
  setNow(now() + 61 * 60000);
  assert.equal(B.freshLine(S, b, 'general', list, {}), null, 'the hour is over, but this bot said both');
  assert.ok(B.freshLine(S, S.bots[1], 'general', list, {}), 'another bot may');
});

test('General adds its level band once, and chat runs at about half the old rate', () => {
  const { S } = character(60);
  S.player.place = Object.keys(D.PLACES).find((k) => D.PLACES[k].city);
  const before = S.chat.length, start = now();
  for (let s = 0; s < 3600; s++) { setNow(start + s * 1000); B.chatTick(S, now()); }
  const mine = S.chat.slice(before).filter((m) => m.from && ['general', 'say', 'guild', 'lfg', 'whisper'].includes(m.ch));
  assert.ok(mine.length < 400, `${mine.length} ambient lines in an hour`);
  const seen = {}; for (const m of mine.filter((x) => x.ch === 'general')) seen[m.text] = (seen[m.text] || 0) + 1;
  assert.ok(Math.max(0, ...Object.values(seen)) <= 2, 'no General line more than twice an hour');
});

test('back from time away: overdue chat timers spread over two minutes', () => {
  const { S } = character(30);
  S.chatTimers = { general: now() - 5000, lfg: now() - 9000, say: 0 };
  B.catchUpChat(S, now());
  for (const k of ['general', 'lfg']) assert.ok(S.chatTimers[k] >= now() && S.chatTimers[k] <= now() + 120000, k);
  assert.equal(S.chatTimers.say, 0);
  assert.ok(G.catchUp);
});
