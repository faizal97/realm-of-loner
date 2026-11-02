// The realm while you are away (beta.3 sweep): newcomers join guilds only once they stay (#328), goodbyes reach another
// character in the same guild (#331), break whispers only from your own friends (#332), a name that said goodbye is
// never reused (#333), Welcome back counts the realm as it is now (#334), history at its own time (#335), and a realm
// clock ahead of the device's waits instead of running twice (#336).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, B, store, now, setNow } = require('./world');

const fresh = () => { if (G.S) G.logout(); store.clear(); G.R = null; };
const make = (name) => { if (G.S) G.logout(); G.newGame({ name, cls: 'warrior', race: 'human' }); G.save(); return G.S.id; };
const crowd = (S, n, guild) => { const out = []; for (let i = 0; i < n; i++) { const b = B.makeBot(S.nextBotId++, new Set(S.bots.map((x) => x.name)), { level: 3 }); b.born = now(); b.guild = guild; S.bots.push(b); out.push(b); } return out; };

test('newcomers have no guild in their first week, then some join one (#328)', () => {
  fresh(); make('Ana'); const S = G.S, first = S.nextBotId;
  B.advance(S, 3 * 86400000);
  const fresh3 = S.bots.filter((b) => b.id >= first);
  assert.ok(fresh3.length > 20, 'newcomers arrived');
  assert.ok(fresh3.every((b) => b.guild === -1), 'none in a guild yet');
  for (let i = 0; i < 6; i++) B.advance(S, 86400000);
  const week = S.bots.filter((b) => b.id >= first && S.lastSim - b.born >= 7 * 86400000);
  assert.ok(week.length && week.some((b) => b.guild >= 0), 'once they stayed a week, some joined a guild');
  assert.ok(S.bots.filter((b) => b.id >= first && S.lastSim - b.born < 7 * 86400000).every((b) => b.guild === -1));
});

test('a guildmate who quits says goodbye to your other character in the same guild too (#331)', () => {
  fresh();
  const a = make('Ana'); G.S.player.guild = 3; G.save();
  make('Bel'); const S = G.S; S.player.guild = 3; G.save();
  const mates = crowd(S, 60, 3);
  B.trimRoster(S, now());
  const gone = mates.filter((b) => !S.bots.includes(b));
  assert.ok(gone.length, 'some quit');
  assert.ok(gone.every((b) => S.chat.some((m) => m.ch === 'guild' && m.from === b.name)), "Bel's guild chat has their goodbyes");
  assert.ok(gone.every((b) => (S.server.byes || []).some((e) => e.c === a && e.n === b.name)), 'and Ana gets them next time');
});

test("another character's friend takes a break without whispering this one (#332)", () => {
  fresh(); make('Ana'); const S = G.S;
  const pals = crowd(S, 300, -1); S.server.keep = {}; for (const b of pals) S.server.keep[b.name] = 1; // kept by another character
  B.trimRoster(S, now());
  assert.ok(pals.some((b) => b.away > now()), 'they went on breaks');
  assert.ok(!S.chat.some((m) => m.ch === 'whisper' && pals.some((b) => b.id === m.fromId)), 'none of them whispered Ana');
});

test('a name that said goodbye in your guild is never given to a newcomer (#333)', () => {
  fresh(); make('Ana'); const S = G.S; S.player.guild = 3;
  const mates = crowd(S, 60, 3);
  B.trimRoster(S, now());
  const said = mates.filter((b) => !S.bots.includes(b) && S.chat.some((m) => m.ch === 'guild' && m.from === b.name));
  assert.ok(said.length, 'some said goodbye');
  assert.ok(said.every((b) => S.server.gone.includes(b.name)), 'their names are retired, though they stayed under a week');
});

test('Welcome back counts the realm as it is now (#334)', () => {
  fresh(); const a = make('Ana'); G.logout();
  const sv = G.readSave(a); sv.lastSeen = sv.lastSim = now() - 30 * 86400000; G.writeSave(sv);
  const R = JSON.parse(store.getItem('azsolo.roster')); R.lastSim = sv.lastSim; store.setItem('azsolo.roster', JSON.stringify(R));
  G.R = null; G.load(a);
  const rep = G.lastReport || G.catchUpReport;
  const S = G.S, joined = S.bots.filter((b) => b.id >= R.nextBotId).length;
  const line = S.news.find((n) => /new adventurer/.test(n.text));
  assert.ok(line, 'the news says who started out');
  assert.strictEqual(Number(line.text.match(/\d+/)[0]), joined, 'counting the newcomers still on the realm, not every start');
  if (rep) assert.ok(rep.dings > 100, `levelled up: ${rep.dings}`);
});

test('history inside one long step is stamped at its own time (#335)', () => {
  fresh(); make('Ana'); const S = G.S;
  B.advance(S, 180 * 86400000);
  let same = 0, ahead = 0;
  for (const b of S.bots) {
    const t = (b.hist || []).filter((e) => e.k === 'lvl').map((e) => e.t);
    if (new Set(t).size < t.length) same++;
    if (t.some((x) => x > S.lastSim)) ahead++;
  }
  assert.strictEqual(same, 0, 'no two levels reached at the same moment');
  assert.strictEqual(ahead, 0, 'none in the future');
});

test('a realm clock ahead of the device waits instead of running the days twice (#336)', () => {
  fresh(); const a = make('Ana');
  const ahead = now() + 3 * 86400000; G.logout();
  const R = JSON.parse(store.getItem('azsolo.roster')); R.lastSim = ahead; store.setItem('azsolo.roster', JSON.stringify(R));
  G.R = null; G.load(a);
  assert.strictEqual(G.S.lastSim, ahead, 'the realm clock stays ahead');
  const id = G.S.nextBotId;
  G.logout(); setNow(ahead + 3600000); G.load(a);
  assert.ok(G.S.nextBotId - id <= 4, `only the hour past it ran (${G.S.nextBotId - id} newcomers)`);
});
