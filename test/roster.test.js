// #71: one realm per account. Every character meets the same people; the oldest character's realm becomes the
// account's; a friend from another character is never lost (same name, same person); the realm keeps one clock.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, B, store, now } = require('./world');

const fresh = () => { if (G.S) G.logout(); store.clear(); G.R = null; };
const make = (name, cls) => { if (G.S) G.logout(); G.newGame({ name, cls: cls || 'warrior', race: 'human' }); G.save(); return G.S.id; };
// a save as an older build wrote it: its own bots, no account realm
const oldStyle = (id, patch) => { const S = G.readSave(id); delete S.flags.roster; S.flags.v10names = true; Object.assign(S, patch); G.writeSave(S); }; // (older saves had the v10 renames)

test('two characters on one account meet the same people', () => {
  fresh();
  make('Ana'); const names = G.S.bots.map((b) => b.id + b.name).join();
  make('Bel'); assert.strictEqual(G.S.bots.map((b) => b.id + b.name).join(), names);
  assert.ok(G.readSave(G.S.id).bots.length, 'a save still carries the bots, for older builds and save codes');
});

test('older saves: the oldest realm becomes the account\'s, another character\'s friend joins it', () => {
  fresh();
  const a = make('Ana'), b = make('Bel');
  const own = B.makePopulation(40).map((x, i) => Object.assign(x, { name: 'Zzfriend' + i })); // Bel's realm: other people
  const pal = own[6], twin = Object.assign({}, own[9], { name: G.readSave(a).bots[3].name, id: 9 }); own[9] = twin;
  oldStyle(a, { created: 1 });
  oldStyle(b, { created: 2, bots: own, soc: { friends: { [pal.id]: { n: 3, where: 'x', last: 0 }, [twin.id]: { n: 1, where: 'y', last: 0 } } },
    chat: [{ id: 1, t: 0, ch: 'whisper', from: pal.name, fromId: pal.id, text: 'hi', act: { kind: 'help', state: 'open', bot: pal.id } }] });
  store.removeItem('azsolo.roster'); G.R = null;
  G.load(b); // the younger one first: the realm is still the oldest's
  const S = G.S, A = G.readSave(a);
  assert.strictEqual(S.bots[0].name, A.bots[0].name, "Ana's realm is the account's");
  const f = Object.keys(S.soc.friends).map((id) => S.bots.find((x) => String(x.id) === id));
  assert.ok(f.every(Boolean) && f.length === 2, 'both friends are on the roster');
  assert.ok(f.some((x) => x.name === pal.name && x.cls === pal.cls), 'a friend Ana never met joins the realm, as they were');
  assert.ok(f.some((x) => x.name === twin.name && x.id === A.bots[3].id), 'same name, same person: the one Ana knows');
  assert.strictEqual(S.chat[0].fromId, f.find((x) => x.name === pal.name).id, 'chat names the roster\'s person');
  assert.strictEqual(S.chat[0].act.state, 'expired', 'an open request by the old id closes');
  G.save(); G.load(a);
  assert.ok(G.S.bots.some((x) => x.name === pal.name), "and Ana meets Bel's friend too");
});

test('the realm keeps one clock: a character back after 10 days moves it only as far as it has not run', () => {
  fresh();
  const a = make('Ana'), b = make('Bel');
  const S = G.readSave(b); S.lastSeen = now() - 10 * 86400000; G.writeSave(S); // Bel was away 10 days
  G.load(a); G.S.lastSim = now() - 2 * 3600000; G.save(); // Ana played 2 hours ago
  const n = JSON.parse(store.getItem('azsolo.roster')).nextBotId; // one id per newcomer (the realm is full, so as many quit)
  G.load(b); if (G.S.lastSim !== now()) G.catchUp();
  assert.strictEqual(G.S.nextBotId - n, 6, 'two hours of new players (3 an hour), not ten days');
  G.save(); assert.strictEqual(JSON.parse(store.getItem('azsolo.roster')).lastSim, now(), 'saved, the realm is at now');
  G.S.bots[0].level = 37; G.save(); G.load(a);
  assert.strictEqual(G.S.bots[0].level, 37, 'a bot that levelled while Bel played is that level for Ana');
});

// over the cap, people quit (#71): the newest first, a friend takes a break and comes back, a guildmate says goodbye
const crowd = (S, n) => { for (let i = 0; i < n; i++) { const b = B.makeBot(S.nextBotId++, new Set(S.bots.map((x) => x.name)), { level: 3 }); b.born = now(); b.guild = -1; S.bots.push(b); } };
test('over the cap: the newest quit, the realm keeps its size and its level spread', () => {
  fresh(); make('Ana'); const S = G.S;
  const vets = S.bots.filter((b) => b.level >= 60).length, under = S.bots.length - vets;
  crowd(S, 60); B.trimRoster(S, now());
  assert.strictEqual(S.bots.filter((b) => b.level < 60).length, Math.min(under, B.ROSTER_CAP), 'back to its size');
  assert.ok(S.bots.filter((b) => b.born === now()).length < 60 * 0.7, 'mostly the ones who just arrived left');
  assert.ok(S.server.gone.length >= 1, 'their names are kept, so no one new is ever them');
});
test('a friend takes a break, says so and comes back; a guildmate who quits says goodbye first', () => {
  fresh(); make('Ana'); const S = G.S;
  crowd(S, 300); const pal = S.bots[S.bots.length - 1], mate = S.bots[S.bots.length - 2];
  S.soc = S.soc || {}; S.soc.friends = { [pal.id]: { n: 2, where: null, last: 0 } }; G.save(); // the realm knows Ana's friends
  S.player.guild = 3; mate.guild = 3;
  B.trimRoster(S, now());
  assert.ok(S.bots.includes(pal) && pal.away > now(), 'the friend is on a break, not gone');
  assert.ok(!B.isOnline(pal, new Date(now() + 3600000)), 'and is not online while away');
  assert.ok(S.chat.some((m) => m.fromId === pal.id && m.ch === 'whisper' && /break|away/.test(m.text)), 'and said so');
  if (!S.bots.includes(mate)) assert.ok(S.chat.some((m) => m.from === mate.name && m.ch === 'guild'), 'a guildmate who left said goodbye');
  crowd(S, 300); B.trimRoster(S, now() + 86400000);
  assert.ok(S.bots.includes(pal), 'a friend back from a break is never removed');
});

test('Remove friend: off this character; the account keeps them while another character is still their friend', () => {
  fresh();
  const a = make('Ana'), pal = G.S.bots[12];
  G.S.soc = G.S.soc || {}; G.S.soc.friends = { [pal.id]: { n: 2, where: null, last: 0 } }; G.save();
  make('Bel'); G.S.soc = G.S.soc || {}; G.S.soc.friends = { [pal.id]: { n: 1, where: null, last: 0 } }; G.save();
  assert.ok(G.unfriend(pal.id)); assert.ok(!G.S.soc.friends[pal.id]);
  assert.ok(G.S.server.keep[pal.name], 'Ana still has them as a friend, so they are still kept');
  G.logout(); G.load(a); assert.ok(G.unfriend(pal.id));
  assert.ok(!G.S.server.keep[pal.name], 'nobody has them now: they can quit like anyone');
});

test('another character\'s guild: nobody moves out of it, and its members\' goodbyes reach it later (#305)', () => {
  fresh();
  const a = make('Ana'); const g = G.S.bots.find((b) => b.guild >= 0 && B.factionOf(b) === G.myFaction()).guild; G.S.player.guild = g; G.save();
  const mates = new Set(G.S.bots.filter((b) => b.guild === g).map((b) => b.name));
  make('Bel'); const S = G.S;
  for (const b of S.bots) if (b.guild === g) b.born = now(); // the newest quit first: give the trim a reason to pick them
  B.guildMoves(S, 120 * 86400000, now());
  assert.ok(S.bots.filter((b) => b.guild === g).every((b) => mates.has(b.name)), 'no one moved in or out of Ana\'s guild');
  for (let i = 0; i < 6; i++) B.advance(S, 86400000);
  const gone = [...mates].filter((n) => !S.bots.some((b) => b.name === n));
  G.logout(); G.load(a);
  const byes = G.S.chat.filter((m) => m.ch === 'guild' && gone.includes(m.from));
  assert.ok(gone.length && byes.length === gone.length, `${gone.length} left, ${byes.length} said goodbye in Ana's guild chat`);
});

test('a deleted character\'s friends stop being kept, unless another character has them (#306)', () => {
  fresh();
  const a = make('Ana'), f1 = G.S.bots[5], f2 = G.S.bots[6];
  G.S.soc = G.S.soc || {}; G.S.soc.friends = { [f1.id]: { n: 1 }, [f2.id]: { n: 1 } }; G.save();
  make('Bel'); G.S.soc = G.S.soc || {}; G.S.soc.friends = { [f2.id]: { n: 1 } }; G.save();
  assert.ok(G.S.server.keep[f1.name] && G.S.server.keep[f2.name]);
  G.deleteCharacter(a);
  assert.ok(!G.S.server.keep[f1.name], 'only Ana had them');
  assert.ok(G.S.server.keep[f2.name], 'Bel still has them');
  assert.ok(!JSON.parse(store.getItem('azsolo.roster')).server.keep[f1.name], 'and the stored realm agrees');
});

test('migration: a friend missing from a younger save never becomes a stranger with the same id (#306)', () => {
  fresh();
  const a = make('Ana'), b = make('Bel');
  oldStyle(a, { created: 1 });
  oldStyle(b, { created: 2, bots: B.makePopulation(10), soc: { friends: { 5000: { n: 1 }, 7: { n: 1 } } } });
  const B7 = G.readSave(b).bots.find((x) => x.id === 7); const S0 = G.readSave(b); S0.bots = S0.bots.filter((x) => x.id !== 7); S0.soc.friends = { 7: { n: 1 } }; G.writeSave(S0);
  store.removeItem('azsolo.roster'); G.R = null;
  G.load(b);
  assert.deepStrictEqual(Object.keys(G.S.soc.friends), [], `Ana's id 7 is someone else, not Bel's lost friend (${B7 && B7.name})`);
});
