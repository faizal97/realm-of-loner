// The realm across characters (beta.3 sweep 2): a delete writes the realm whole (#343), a rebuilt realm is the one
// furthest on and a realm behind still catches up (#344), newcomers never take another character's name (#345).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, store, now, setNow } = require('./world');

const fresh = () => { if (G.S) G.logout(); store.clear(); G.R = null; };
const make = (name) => { if (G.S) G.logout(); G.newGame({ name, cls: 'warrior', race: 'human' }); G.save(); return G.S.id; };
const dupIds = (bots) => { const ids = bots.map((b) => b.id); return ids.filter((x, i) => ids.indexOf(x) !== i).length; };

test('deleting a character while another is loaded but unsaved never gives two people one id (#343)', () => {
  fresh(); const a = make('Ana'), b = make('Bel'); G.logout();
  setNow(now() + 3 * 86400000);
  G.load(a); // the title screen's Theater loads Ana without saving her
  G.deleteCharacter(b);
  const R = JSON.parse(store.getItem('azsolo.roster'));
  assert.ok(R.nextBotId > Math.max(...R.bots.map((x) => x.id)), 'the stored next id is past everyone stored');
  assert.ok(now() - R.lastSim < 60000, "the stored clock is the realm's own");
  G.load(a); // Enter World
  assert.strictEqual(dupIds(G.S.bots), 0);
});

test('a realm rebuilt after a cloud restore is the one furthest on (#344)', () => {
  fresh(); const a = make('Ana'); G.logout();
  setNow(now() + 3600000); const b = make('Bel'); G.logout();
  for (let d = 0; d < 10; d++) { setNow(now() + 86400000); G.load(b); G.logout(); }
  const next = JSON.parse(store.getItem('azsolo.roster')).nextBotId;
  const keep = {}; for (const id of [a, b]) keep[id] = store.getItem('azsolo.char.' + id);
  const idx = store.getItem('azsolo.chars');
  store.clear(); G.R = null; for (const id in keep) store.setItem('azsolo.char.' + id, keep[id]); store.setItem('azsolo.chars', idx);
  G.load(b);
  assert.ok(G.S.nextBotId >= next, `Bel's realm, not Ana's 10-day-old copy (${G.S.nextBotId} vs ${next})`);
});

test('a stored realm behind the character still lives those days (#344)', () => {
  fresh(); const a = make('Ana'); G.logout();
  const R = JSON.parse(store.getItem('azsolo.roster')); R.lastSim = now() - 5 * 86400000; store.setItem('azsolo.roster', JSON.stringify(R)); G.R = null;
  G.load(a);
  assert.ok(G.S.nextBotId - R.nextBotId > 20, 'newcomers arrived over those 5 days');
});

test("newcomers never take another character's name (#345)", () => {
  fresh(); make('Healzplz'); const a = make('Ana');
  for (let d = 0; d < 30; d++) {
    G.logout(); setNow(now() + 86400000); G.load(a);
    assert.ok(!G.S.bots.some((b) => b.name === 'Healzplz'), `day ${d + 1}`);
  }
});
