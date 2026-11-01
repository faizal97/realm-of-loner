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
  const n = JSON.parse(store.getItem('azsolo.roster')).bots.length;
  G.load(b); if (G.S.lastSim !== now()) G.catchUp();
  assert.strictEqual(G.S.bots.length - n, 6, 'two hours of new players (3 an hour), not ten days');
  G.save(); assert.strictEqual(JSON.parse(store.getItem('azsolo.roster')).lastSim, now(), 'saved, the realm is at now');
  G.S.bots[0].level = 37; G.save(); G.load(a);
  assert.strictEqual(G.S.bots[0].level, 37, 'a bot that levelled while Bel played is that level for Ana');
});
