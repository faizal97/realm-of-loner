// Friends (src/friends.js) against a fake Firebase shared by fake players and devices, each with its own storage.
// The fake applies the same checks as firebase/firestore.rules and database.rules.json (tested for real by
// `cd firebase && npm test`), so a flow that would break the rules fails here too. No Firebase code runs.
//   node sim/friends.js
require('./_seed.js'); // seeded (#125): the same commit always gives the same result; SEED=n picks other dice
const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m }; };
globalThis.localStorage = mem();
require('../src/data.js'); require('../src/engine.js'); require('../src/bots.js'); require('../src/game.js'); require('../src/social.js'); require('../src/friends.js');
const { G, D, FRIENDS } = globalThis;
let t = 1790000000000; Date.now = () => t;

// ---- the fake server: Firestore documents by path, Realtime Database as a nested object, and live listeners
const server = { docs: new Map(), rt: {}, writes: 0, listeners: new Set() };
const denied = (what) => Object.assign(new Error('permission-denied: ' + what), { code: 'permission-denied' });
const kids = (prefix) => [...server.docs.keys()].filter((k) => k.startsWith(prefix) && !k.slice(prefix.length).includes('/')).map((k) => k.slice(prefix.length));
const rtGet = (path) => path.split('/').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), server.rt);
// like the real database, a node left empty disappears
const rtSet = (path, v) => {
  const ks = path.split('/'), chain = [server.rt]; let o = server.rt;
  for (const k of ks.slice(0, -1)) { o = o[k] || (o[k] = {}); chain.push(o); }
  if (v === null) delete o[ks[ks.length - 1]]; else o[ks[ks.length - 1]] = v;
  for (let i = ks.length - 2; i >= 0; i--) if (!Object.keys(chain[i + 1]).length) delete chain[i][ks[i]];
};
const changed = () => { for (const l of server.listeners) l(); };
const friendOf = (owner, me) => server.docs.has(`friends/${owner}/list/${me}`);
const CODE_RE = /^[2-9A-HJKMNP-Z]{8}$/;

function backend(uid) {
  let signed = false, conn = 0;
  const need = () => { if (!signed) throw denied('signed out'); };
  const listen = (fn) => { let last; const l = () => { const v = JSON.stringify(fn.read()); if (v !== last) { last = v; fn.cb(JSON.parse(v === undefined ? 'null' : v)); } }; server.listeners.add(l); l(); return () => server.listeners.delete(l); };
  return {
    signIn: async () => { signed = true; },
    signOut: async () => { signed = false; },
    uid: () => uid,
    getCode: async (c) => { need(); const d = server.docs.get('codes/' + c); return d ? d.uid : null; },
    createCode: async (c) => { need(); if (!CODE_RE.test(c)) throw denied('code format'); if (server.docs.has('codes/' + c)) return false; server.docs.set('codes/' + c, { uid }); changed(); return true; },
    deleteCode: async (c) => { need(); const d = server.docs.get('codes/' + c); if (!d || d.uid !== uid) throw denied('not your code'); server.docs.delete('codes/' + c); changed(); },
    getProfile: async (u) => { need(); if (u !== uid && !friendOf(u, uid)) throw denied('profile'); return server.docs.get('profiles/' + u) || null; },
    updateProfile: async (fields) => {
      need(); const allowed = ['v', 'code', 'updatedAt', 'lastSeen', 'playing', 'chars'];
      for (const k in fields) if (!allowed.includes(k)) throw denied('profile field ' + k);
      const p = JSON.parse(JSON.stringify(server.docs.get('profiles/' + uid) || {}));
      for (const k in fields) if (k !== 'chars') p[k] = fields[k];
      p.chars = p.chars || {};
      for (const id in fields.chars || {}) { if (fields.chars[id] === null) delete p.chars[id]; else p.chars[id] = fields.chars[id]; }
      if (!Number.isInteger(p.v) || Object.keys(p.chars).length > 12) throw denied('profile shape');
      server.docs.set('profiles/' + uid, p); server.writes++; changed();
    },
    deleteProfile: async () => { need(); server.docs.delete('profiles/' + uid); changed(); },
    sendRequest: async (to, info) => {
      need(); if (to === uid) throw denied('self');
      for (const k in info) if (!['name', 'cls', 'level', 'at'].includes(k)) throw denied('request field');
      server.docs.set(`requests/${to}/in/${uid}`, Object.assign({}, info)); changed();
    },
    deleteRequest: async (to, from) => { need(); if (uid !== to && uid !== from) throw denied('request'); server.docs.delete(`requests/${to}/in/${from}`); changed(); },
    listRequests: async () => { need(); return kids(`requests/${uid}/in/`).map((from) => Object.assign({ from }, server.docs.get(`requests/${uid}/in/${from}`))); },
    accept: async (from) => {
      need(); if (!server.docs.has(`requests/${uid}/in/${from}`)) throw denied('no request to accept');
      server.docs.set(`friends/${uid}/list/${from}`, { since: t }); server.docs.set(`friends/${from}/list/${uid}`, { since: t });
      server.docs.delete(`requests/${uid}/in/${from}`); changed();
    },
    listFriends: async () => { need(); return kids(`friends/${uid}/list/`); },
    removeFriend: async (o) => { need(); server.docs.delete(`friends/${uid}/list/${o}`); server.docs.delete(`friends/${o}/list/${uid}`); changed(); },
    listSee: async () => { need(); return Object.keys(rtGet('see/' + uid) || {}); },
    setSee: async (o, v) => { need(); if (v !== true && v !== null) throw denied('see value'); rtSet(`see/${uid}/${o}`, v); changed(); },
    clearSee: async () => { need(); rtSet('see/' + uid, null); changed(); },
    presence: async (x) => {
      need();
      if (!conn) conn = ++server.n || (server.n = 1);
      const path = `status/${uid}/k${uid}${conn}`;
      if (x) { const e = { at: t }; if (x.char) e.char = x.char; rtSet(path, e); } else rtSet(path, null);
      changed();
    },
    newConnection: () => { conn = 0; }, // another open game (tab or device) for this player
    watchProfile: (u, cb) => listen({ cb, read: () => (u === uid || friendOf(u, uid) ? server.docs.get('profiles/' + u) || null : null) }),
    watchStatus: (u, cb) => listen({ cb, read: () => (u === uid || (rtGet(`see/${u}/${uid}`) === true) ? rtGet('status/' + u) || {} : {}) }),
    watchFriends: (cb) => listen({ cb, read: () => kids(`friends/${uid}/list/`) }),
    watchRequests: (cb) => listen({ cb, read: () => kids(`requests/${uid}/in/`).map((from) => Object.assign({ from }, server.docs.get(`requests/${uid}/in/${from}`))) }),
  };
}

// ---- players and their devices: each device has its own storage; a player's devices share one backend id
const devices = {};
const dev = (name, uid) => (devices[name] = { name, uid, ls: mem(), be: backend(uid) });
const use = (d) => { if (G.S) G.logout(); globalThis.localStorage = d.ls; FRIENDS.setBackend(d.be); FRIENDS.resetLocal(); };
const profileOf = (uid) => server.docs.get('profiles/' + uid) || null;

let pass = 0, fail = 0;
const ok = (cond, what) => { if (cond) pass++; else { fail++; console.log('FAIL', what); } };
const fails = async (p, code) => { try { await p; return false; } catch (e) { return !code || e.code === code; } };

(async () => {
  // 0. codes and cards
  const c = FRIENDS.newCode();
  ok(/^[2-9A-HJKMNP-Z]{8}$/.test(c) && FRIENDS.showCode('K7QMP2XD') === 'K7QM-P2XD', 'codes: 8 characters with no look-alikes, shown with a dash');
  ok(FRIENDS.cleanCode(' k7qm-p2xd ') === 'K7QMP2XD' && FRIENDS.cleanCode('https://x.io/realm-of-loner/#friend=K7QM-P2XD') === 'K7QMP2XD', 'a typed code or a whole share link both work');
  ok(FRIENDS.cleanCode('K7QM-P2X0') === null && FRIENDS.cleanCode('hello') === null, 'a look-alike or junk is not a code');

  const amyPhone = dev('amyPhone', 'amy'), amyWeb = dev('amyWeb', 'amy'), benPhone = dev('benPhone', 'ben'), catPhone = dev('catPhone', 'cat');

  use(amyPhone);
  G.newGame({ name: 'Aria', cls: 'paladin', race: 'human' }); const A1 = G.S.id; G.save(); G.logout();
  G.newGame({ name: 'Alder', cls: 'mage', race: 'gnome' }); const A2 = G.S.id; G.save();
  const card = FRIENDS.charCard(G.S);
  ok(card && card.name === 'Alder' && card.cls === 'mage' && card.level === 1 && card.role && card.gear.weapon && card.gear.weapon.id && !card.gear.weapon.name, 'a card: name, class, level, role; plain gear goes as its id');
  ok(!('money' in card) && !('bags' in card) && !('quests' in card), 'a card holds nothing friends were not promised (no gold, bags or quests)');
  const rolled = Object.assign({}, G.S.player.equip.weapon, { name: 'Fine Blade of the Bear', stats: { str: 3, sta: 3 } });
  G.S.player.equip.weapon = rolled;
  ok(FRIENDS.charCard(G.S).gear.weapon.name === 'Fine Blade of the Bear' && FRIENDS.item(FRIENDS.charCard(G.S).gear.weapon).stats.str === 3, 'a rolled item goes whole, so friends see its real stats');
  ok(FRIENDS.item({ id: 'hearthstone' }) === D.ITEMS.hearthstone && FRIENDS.item({ id: 'no_such_item_yet' }) === null, 'an id is shown as the game\'s own item; an unknown one asks to update');

  // 1. turning on
  const codeA = await FRIENDS.turnOn();
  let pa = profileOf('amy');
  ok(pa && pa.code === codeA && pa.chars[A1] && pa.chars[A2] && pa.playing && pa.playing.char === A2, 'amy turns on: her code, both characters and what she is playing');
  ok(server.docs.get('codes/' + codeA).uid === 'amy', 'her code points to her');
  const codeAgain = await FRIENDS.turnOn();
  ok(codeAgain === codeA, 'turning on again keeps the same code');

  use(benPhone);
  G.newGame({ name: 'Brannoc', cls: 'warrior', race: 'orc' }); const B1 = G.S.id; G.save();
  const codeB = await FRIENDS.turnOn();
  ok(codeB && codeB !== codeA, 'ben turns on with his own code');

  // 2. adding: mistakes first
  ok(await fails(FRIENDS.add('nope'), 'bad'), 'junk: "not a friend code"');
  ok(await fails(FRIENDS.add(codeB), 'self'), 'your own code: refused');
  ok(await fails(FRIENDS.add('ZZZZ-ZZZZ'), 'unknown'), 'nobody has that code: said so');
  let r = await FRIENDS.add(FRIENDS.showCode(codeA));
  ok(r.what === 'sent' && server.docs.has('requests/amy/in/ben') && FRIENDS.state().sent.amy, 'ben asks amy: a request, and his Sent list shows it');
  ok(await fails(benPhone.be.getProfile('amy'), 'permission-denied'), 'before amy accepts, ben cannot read her profile');

  // 3. amy's live view, then Accept
  use(amyPhone); G.load(A2);
  let view = null; const stop = FRIENDS.watch((v) => { view = v; });
  ok(view && view.requests.length === 1 && view.requests[0].from === 'ben' && view.requests[0].name === 'Brannoc', 'amy sees the request, with the name of ben\'s character');
  await FRIENDS.accept('ben');
  ok(view.requests.length === 0 && view.friends.length === 1 && view.friends[0].uid === 'ben' && view.friends[0].profile && view.friends[0].profile.chars[B1], 'after Accept: ben is in amy\'s list with his characters, live');
  ok(rtGet('see/amy/ben') === true, 'amy lets ben see her status');
  use(benPhone); G.load(B1);
  let bview = null; const bstop = FRIENDS.watch((v) => { bview = v; });
  await new Promise((res) => setTimeout(res, 0));
  ok(bview.friends.length === 1 && bview.friends[0].profile && bview.friends[0].profile.chars[A1], 'ben sees amy and her characters');
  ok(rtGet('see/ben/amy') === true && !FRIENDS.state().sent.amy, 'ben\'s own status list heals by itself, and the request left his Sent list');

  // 4. a stranger
  use(catPhone); G.newGame({ name: 'Cyra', cls: 'rogue', race: 'nightelf' }); G.save(); await FRIENDS.turnOn();
  ok(await fails(catPhone.be.getProfile('amy'), 'permission-denied'), 'a stranger cannot read amy\'s profile');

  // 5. online status: phone and browser both open, then one closes
  use(amyPhone); G.load(A2);
  await FRIENDS.online(true);
  ok(bview.friends[0].online && bview.friends[0].char === A2, 'amy comes online: ben sees it and which character');
  use(amyWeb); amyWeb.be.newConnection(); await amyWeb.be.signIn();
  localStorage.setItem('azsolo.friends', JSON.stringify({ on: true, code: codeA }));
  await amyWeb.be.presence({ char: null });
  await amyWeb.be.presence(null);
  ok(bview.friends[0].online, 'closing her browser does not mark her offline while her phone still plays');
  use(amyPhone); G.load(A2); await FRIENDS.online(false);
  ok(!bview.friends[0].online, 'closing the phone too: offline');

  // 6. the writer gathers changes, and writes only what friends would notice
  await FRIENDS.online(true);
  t += 61 * 1000; await FRIENDS.flush(); const w0 = server.writes;
  for (let i = 0; i < 10; i++) { G.S.player.xp += 5; G.S.player.level = 2; FRIENDS.touch(A2); t += 3000; await FRIENDS.flush(); }
  ok(server.writes === w0, 'nothing is written before the minute is up');
  t += 31 * 1000; await FRIENDS.flush();
  ok(server.writes - w0 === 1 && profileOf('amy').chars[A2].level === 2, 'ten changes in half a minute: one write');
  t += 61 * 1000; const w1 = server.writes; G.S.player.xp += 5; FRIENDS.touch(A2); await FRIENDS.flush();
  ok(server.writes === w1, 'XP alone friends do not see: no write');
  t += 11 * 60 * 1000; await FRIENDS.flush();
  ok(server.writes === w1 + 1 && profileOf('amy').lastSeen === t, 'but "last played" still moves every 10 minutes');

  // 7. hiding a character
  await FRIENDS.setShared(A2, false);
  pa = profileOf('amy');
  ok(!pa.chars[A2] && pa.chars[A1] && pa.playing === null, 'hidden: the character leaves her profile, and "playing" goes blank');
  ok(bview.friends[0].profile && !bview.friends[0].profile.chars[A2] && bview.friends[0].char === null, 'ben sees her online but not on which character');
  ok(G.S.player.friendsHidden === true, 'the switch is saved in the character (cloud save carries it)');
  await FRIENDS.setShared(A2, true);
  ok(profileOf('amy').chars[A2] && profileOf('amy').playing.char === A2, 'shared again: back');

  // 8. a device with fewer characters never removes the others
  use(amyWeb); localStorage.setItem('azsolo.friends', JSON.stringify({ on: true, code: codeA }));
  G.newGame({ name: 'Aspen', cls: 'druid', race: 'nightelf' }); const A3 = G.S.id; G.save();
  FRIENDS.touch(A3); await FRIENDS.flush(true);
  pa = profileOf('amy');
  ok(pa.chars[A1] && pa.chars[A2] && pa.chars[A3], 'the browser adds its character and leaves the phone\'s two');
  G.deleteCharacter(A3); FRIENDS.forgetChar(A3); await new Promise((res) => setTimeout(res, 0));
  ok(!profileOf('amy').chars[A3] && profileOf('amy').chars[A1], 'deleting it there removes only that one');

  // 9. adding each other at the same time becomes one friendship
  use(catPhone); G.load(G.characters()[0].id);
  await FRIENDS.add(codeB);
  use(benPhone); G.load(B1);
  r = await FRIENDS.add(server.docs.get('profiles/cat').code);
  ok(r.what === 'accepted' && server.docs.has('friends/ben/list/cat') && server.docs.has('friends/cat/list/ben'), 'ben adds cat, who had already asked: accepted instead of a second request');
  ok(await fails(FRIENDS.add(codeA), 'already'), 'adding an existing friend: "already friends"');

  // 10. turning off and on again
  use(amyPhone); G.load(A2);
  await FRIENDS.turnOff();
  ok(!profileOf('amy') && !rtGet('see/amy') && !rtGet('status/amy'), 'amy turns off: profile, status and status list are gone');
  ok(server.docs.has('friends/amy/list/ben') && server.docs.get('codes/' + codeA), 'the friendship and her code stay');
  const amyIn = (v) => v.friends.find((f) => f.uid === 'amy');
  ok(amyIn(bview) && amyIn(bview).profile === null && !amyIn(bview).online, 'ben sees her with Friends turned off');
  const codeBack = await FRIENDS.turnOn();
  ok(codeBack === codeA && amyIn(bview).profile && amyIn(bview).profile.chars[A1] && rtGet('see/amy/ben') === true, 'on again: same code, ben sees her again, her status list is back');

  // 11. a broken status list heals
  rtSet('see/amy/ben', null); rtSet('see/amy/cat', true);
  await FRIENDS.repairSee();
  ok(rtGet('see/amy/ben') === true && rtGet('see/amy/cat') === undefined, 'a missing entry comes back and a stranger\'s goes');

  // 12. removing
  await FRIENDS.remove('ben');
  ok(!server.docs.has('friends/amy/list/ben') && !server.docs.has('friends/ben/list/amy') && rtGet('see/amy/ben') === undefined, 'Remove friend ends it on both sides');
  ok(await fails(benPhone.be.getProfile('amy'), 'permission-denied') && bview.friends.length === 1 && bview.friends[0].uid === 'cat', 'ben can no longer read amy; his list keeps cat');

  // 13. cancel and decline
  await FRIENDS.add(codeB);
  ok(server.docs.has('requests/ben/in/amy'), 'amy asks ben again');
  await FRIENDS.cancel('ben');
  ok(!server.docs.has('requests/ben/in/amy') && !FRIENDS.state().sent.ben, 'Cancel takes it back');
  await FRIENDS.add(codeB);
  use(benPhone); G.load(B1);
  await FRIENDS.decline('amy');
  ok(!server.docs.has('requests/ben/in/amy') && !server.docs.has('friends/ben/list/amy'), 'Decline: gone, and no friendship');

  // 14. deleting everything
  use(catPhone); G.load(G.characters()[0].id);
  const codeC = FRIENDS.state().code;
  await FRIENDS.deleteAll();
  ok(!profileOf('cat') && !server.docs.has('codes/' + codeC) && !server.docs.has('friends/cat/list/ben') && !server.docs.has('friends/ben/list/cat') && !FRIENDS.on(), 'Delete my Friends data: profile, code and every friendship, on both sides');

  // 15. the switch follows the player: amy turned on on her phone; her browser hears it from cloud save
  use(amyPhone); G.load(A2); const swOn = FRIENDS.switchInfo();
  ok(swOn && swOn.on === true && swOn.at > 0, 'turning on records when, for cloud save to carry');
  const amyTab = dev('amyTab', 'amy'); use(amyTab); G.newGame({ name: 'Ash', cls: 'hunter', race: 'dwarf' }); const A4 = G.S.id; G.save();
  ok(!FRIENDS.on(), 'a new device starts with Friends off');
  await FRIENDS.remoteSwitch(swOn);
  ok(FRIENDS.on() && FRIENDS.state().code === codeA && profileOf('amy').chars[A4] && profileOf('amy').chars[A1], 'the switch arrives: this device connects by itself, same code, and adds its character');
  await FRIENDS.remoteSwitch({ on: false, at: swOn.at - 1 });
  ok(FRIENDS.on(), 'an older switch is ignored');
  t += 1000; await FRIENDS.remoteSwitch({ on: false, at: t });
  ok(!FRIENDS.on() && !profileOf('amy'), 'turned off elsewhere: this device stops, and removes the profile it would otherwise keep alive');
  const quiet = backend('amy'); quiet.signIn = async (interactive) => { if (!interactive) throw Object.assign(new Error('no quiet sign-in in a browser'), { code: 'auth' }); };
  const amyWeb2 = { name: 'amyWeb2', uid: 'amy', ls: mem(), be: quiet }; use(amyWeb2);
  t += 1000; await FRIENDS.remoteSwitch({ on: true, at: t });
  ok(!FRIENDS.on() && FRIENDS.state().pendingOn === t, 'a browser that cannot sign in quietly waits, and the tab offers one tap to connect');

  // #46: Friends turned on from the one Google window that also turned on cloud save signs in with that window's token
  const tokBe = backend('tia'), seen = []; const realSignIn = tokBe.signIn; tokBe.signIn = async (interactive, token) => { seen.push({ interactive, token }); return realSignIn(interactive, token); };
  use({ name: 'tiaWeb', uid: 'tia', ls: mem(), be: tokBe });
  await FRIENDS.turnOn({ token: 'T' });
  ok(FRIENDS.on() && seen.length === 1 && seen[0].token === 'T' && seen[0].interactive === true, 'turned on with the shared window\'s token: Friends signs in with it (no second window)');

  stop(); bstop();
  console.log(`friends: ${pass}/${pass + fail} checks pass`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
