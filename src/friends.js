// Friends (v10.2): real players add each other by friend code and see each other's shared characters, gear and
// online status, live. Optional and off until the player turns it on; nothing leaves the device before that.
// Design: docs/plans/2026-09-30-friends-design.md. DOM-free like cloud.js: Firebase plugs in as a backend
// (FRIENDS.setBackend; the real one is FRIENDS.firebase() at the end), so sim/friends.js can swap in a fake one.
//   Firestore: codes/{code} → uid · profiles/{uid} · requests/{to}/in/{from} · friends/{uid}/list/{other}
//   Realtime Database: status/{uid}/{conn} (one entry per open game) · see/{uid}/{other} (who may read my status)
(function (root) {
  const FRIENDS = root.FRIENDS = {};
  const KEY = 'azsolo.friends'; // { on, switchedAt, pendingOn, code, sent: { <uid>: { code, at } }, wrote: { <charId>: hash }, playing: hash, seenAt }
  const V = 1; // profile format
  const EVERY = 60 * 1000; // profile writes at most this often while playing
  const SEEN_EVERY = 10 * 60 * 1000; // "last played" moves at least this often
  const ALPHA = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; // no 0/O, 1/I/L
  const CODE_RE = /^[2-9A-HJKMNP-Z]{8}$/;

  const read = () => { let st = null; try { st = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { st = null; } st = st || {}; st.sent = st.sent || {}; st.wrote = st.wrote || {}; return st; };
  const write = (st) => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { } };
  const patch = (o) => { const st = read(); Object.assign(st, o); write(st); return st; };
  const err = (code, message) => Object.assign(new Error(message), { code });
  FRIENDS.state = read;
  FRIENDS.on = () => !root.AZ_DEV && !!read().on; // never in a dev build (#92): it would reach the player's real Friends account

  let be = null;
  FRIENDS.setBackend = (b) => { be = b; };
  FRIENDS.available = () => !root.AZ_DEV && !!be;
  // load Firebase (and Google's script in a browser) ahead of a tap; resume() signs back in quietly on a later visit
  FRIENDS.prepare = () => (be && be.prepare ? be.prepare() : Promise.resolve());
  FRIENDS.signedIn = () => !!(be && be.signedIn && be.signedIn());
  FRIENDS.resume = async () => { await FRIENDS.prepare(); await back().signIn(false); };
  FRIENDS.signIn = () => back().signIn(true); // from a tap: may open Google's window
  const back = () => { if (!be) throw err('unavailable', 'Friends is not available here.'); return be; };

  // ---- friend codes: 8 characters, shown as K7QM-P2XD
  FRIENDS.newCode = function (rand) { rand = rand || Math.random; let s = ''; for (let i = 0; i < 8; i++) s += ALPHA[Math.floor(rand() * ALPHA.length)]; return s; };
  FRIENDS.showCode = (c) => (c ? c.slice(0, 4) + '-' + c.slice(4) : '');
  // what a player types or pastes: the code in any case, with or without the dash, or a whole share link
  FRIENDS.cleanCode = function (text) {
    const t = String(text || '').toUpperCase(), m = t.match(/FRIEND=([0-9A-Z-]+)/);
    const raw = (m ? m[1] : t).replace(/[^0-9A-Z]/g, '');
    return CODE_RE.test(raw) ? raw : null;
  };
  FRIENDS.link = (code) => `${(root.UPD && UPD.WEB) || 'https://faizal97.github.io/realm-of-loner/'}#friend=${FRIENDS.showCode(code)}`;

  // ---- what friends see of one character, straight from its save. null when the player hides it.
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  // an item that is exactly the game's own goes as its id; a rolled one (random stats) goes whole
  const gearOf = function (eq) {
    const out = {};
    for (const slot in eq || {}) { const it = eq[slot]; if (!it) continue; const base = root.D && D.ITEMS[it.id]; if (base && same(base, it)) out[slot] = { id: it.id }; else { const { base: _drop, ...shown } = it; out[slot] = shown; } } // an upgraded item (v10.3) goes without its as-dropped copy
    return out;
  };
  const rankName = function (rep) { const R = root.SOC && SOC.RANKS; if (!R) return null; let r = 0; R.forEach((k, i) => { if ((rep || 0) >= k.at) r = i; }); return R[r].name; };
  FRIENDS.charCard = function (S) {
    if (!S || !S.player || S.player.friendsHidden) return null;
    const P = S.player, C = (root.D && D.CLASSES[P.cls]) || {};
    const profs = {}; for (const k in (P.prof || {})) profs[k] = P.prof[k].skill || 0;
    const guild = P.guild >= 0 && root.B && B.GUILDS && B.GUILDS[P.guild] ? { name: B.GUILDS[P.guild], rank: rankName(P.guildRep) } : null;
    return { name: P.name, race: P.race || 'human', cls: P.cls, look: [P.gender || 'm', +P.skin || 0, +P.hair || 0], level: P.level,
      role: P.role || C.role || null, talents: Object.assign({}, P.talents || {}), profs, guild, title: P.title || null,
      mounts: (P.mounts || []).length, gear: gearOf(P.equip), at: S.lastSeen || Date.now() };
  };
  // where the character being played is; null when it is hidden (friends then only see "Online")
  FRIENDS.playing = function (S) {
    if (!S || !S.player || S.player.friendsHidden) return null;
    const pl = root.D && D.PLACES[S.player.place];
    return { char: S.id, zone: (pl && pl.zone) || null, place: (pl && pl.name) || null, run: (S.run && S.run.name) || null };
  };
  const hash = function (o) {
    if (o == null) return null;
    const s = JSON.stringify(o); let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
    return h.toString(36) + '.' + s.length.toString(36);
  };
  const cardHash = (c) => (c ? hash(Object.assign({}, c, { at: 0 })) : null); // the time alone is no reason to write

  // ---- the profile writer: gathers changes and writes only what friends would notice, at most once a minute.
  // A device only ever writes the characters it has (chars.<id>), so a browser with fewer characters never removes
  // the phone's. A hidden or deleted character becomes a delete of its field.
  const dirty = new Set();
  let lastFlush = 0, flushing = null;
  FRIENDS.touch = (id) => { if (id) dirty.add(id); };
  FRIENDS.resetLocal = () => { dirty.clear(); lastFlush = 0; }; // a different player on this page (the sim's devices)
  FRIENDS.forgetChar = (id) => { if (id) { dirty.add(id); if (FRIENDS.on()) FRIENDS.flush(true); } };
  const readChar = (id) => (root.G && G.S && G.S.id === id ? G.S : root.G && G.readSave(id));
  FRIENDS.flush = function (force) {
    if (!FRIENDS.on() || !be) return Promise.resolve(null);
    if (flushing) return flushing;
    const now = Date.now();
    if (!force && now - lastFlush < EVERY) return Promise.resolve(null);
    const cur = root.G && G.S, st = read(), chars = {}, hashes = {};
    if (cur) dirty.add(cur.id);
    const ids = [...dirty];
    for (const id of ids) {
      const card = FRIENDS.charCard(readChar(id)), h = cardHash(card);
      if (h === (st.wrote[id] || null)) continue;
      chars[id] = card; hashes[id] = h;
    }
    const playing = cur ? FRIENDS.playing(cur) : null, ph = hash(playing);
    const fields = {};
    if (Object.keys(chars).length) fields.chars = chars;
    if (ph !== (st.playing === undefined ? null : st.playing)) fields.playing = playing;
    const seen = !!cur && (force || now - (st.seenAt || 0) >= SEEN_EVERY);
    lastFlush = now;
    if (!Object.keys(fields).length && !seen) { dirty.clear(); return Promise.resolve({ wrote: 0 }); }
    Object.assign(fields, { v: V, code: st.code, updatedAt: now }, cur ? { lastSeen: now } : {});
    flushing = be.updateProfile(fields).then(() => {
      const s2 = read();
      for (const id in hashes) { if (hashes[id]) s2.wrote[id] = hashes[id]; else delete s2.wrote[id]; }
      s2.playing = ph; if (cur) s2.seenAt = now; write(s2);
      for (const id of ids) dirty.delete(id);
      return { wrote: Object.keys(chars).length, fields };
    }).catch((e) => ({ error: e })).finally(() => { flushing = null; });
    return flushing;
  };

  // ---- turning Friends on and off. The switch follows the player: cloud save's account file carries it
  // ({ on, at }, newest wins; cloud.js), and remoteSwitch below acts on a change made on another device.
  // opts.at: the time of that other device's change (then nothing here asks the player to sign in).
  FRIENDS.switchInfo = () => { const st = read(); return st.switchedAt ? { on: !!st.on, at: st.switchedAt } : null; };
  FRIENDS.onSwitch = null; // the UI's refresh, after a switch made elsewhere took effect here
  FRIENDS.turnOn = async function (opts) {
    opts = opts || {};
    const b = back();
    await b.signIn(!opts.at, opts.token); // opts.token: Google's token from the one window that also turned on cloud save (#46)
    const me = b.uid();
    let code = read().code || null;
    if (!code) { const mine = await b.getProfile(me).catch(() => null); if (mine && mine.code) code = mine.code; } // made on another device
    if (code && (await b.getCode(code)) !== me) code = null;
    for (let i = 0; !code && i < 6; i++) { const c = FRIENDS.newCode(); if (await b.createCode(c)) code = c; }
    if (!code) throw err('code', 'Could not make a friend code. Try again in a moment.');
    patch({ on: true, switchedAt: opts.at || Date.now(), pendingOn: null, code, wrote: {}, playing: undefined, seenAt: 0 });
    if (root.G) for (const ch of G.characters()) dirty.add(ch.id);
    const r = await FRIENDS.flush(true);
    if (r && r.error) throw r.error;
    await FRIENDS.repairSee();
    return code;
  };
  // everything about you goes; the friendships (two ids and a date) and your code stay, so on again restores them
  FRIENDS.turnOff = async function (opts) {
    opts = opts || {};
    const b = back();
    await b.signIn(!opts.at);
    const me = b.uid(), st = read();
    await b.presence(null).catch(() => {});
    await b.deleteProfile();
    await b.clearSee();
    for (const to in st.sent) await b.deleteRequest(to, me).catch(() => {});
    patch({ on: false, switchedAt: opts.at || Date.now(), pendingOn: null, sent: {}, wrote: {}, playing: undefined, seenAt: 0 });
    dirty.clear();
  };
  // Friends was switched on another device (newer than anything here). On: connect quietly if this device can (the
  // app can, once Google has allowed it); otherwise the tab offers one tap to connect. Off: clean up here too, so this
  // device does not put a profile back; when it cannot sign in, it just stops.
  FRIENDS.remoteSwitch = function (sw) {
    const st = read();
    if (!sw || !sw.at || (st.switchedAt || 0) >= sw.at || !be) return Promise.resolve(null);
    const done = () => { if (FRIENDS.onSwitch) FRIENDS.onSwitch(); };
    if (sw.on) {
      if (st.on) { patch({ switchedAt: sw.at }); return Promise.resolve(null); }
      patch({ pendingOn: sw.at });
      return FRIENDS.turnOn({ at: sw.at }).then(done, () => { done(); return null; });
    }
    if (!st.on) { patch({ switchedAt: sw.at, pendingOn: null }); done(); return Promise.resolve(null); }
    return FRIENDS.turnOff({ at: sw.at }).catch(() => { patch({ on: false, switchedAt: sw.at, pendingOn: null }); dirty.clear(); }).then(done);
  };
  // ... and this removes the rest: every friendship on both sides, the requests waiting for you, and the code
  FRIENDS.deleteAll = async function () {
    const b = back();
    await b.signIn(true);
    const me = b.uid(), code = read().code;
    await FRIENDS.turnOff();
    for (const other of await b.listFriends()) await b.removeFriend(other);
    for (const r of await b.listRequests()) await b.deleteRequest(me, r.from).catch(() => {});
    if (code) await b.deleteCode(code).catch(() => {});
    patch({ code: null });
    if (b.signOut) await b.signOut().catch(() => {});
  };

  // ---- adding and removing friends
  const whoAmI = function () {
    const S = (root.G && G.S) || (root.G && G.characters()[0] && G.readSave(G.characters()[0].id));
    const P = S && S.player;
    return { name: String((P && P.name) || 'Adventurer').slice(0, 24), cls: (P && P.cls) || 'warrior', level: (P && P.level) || 1, at: Date.now() };
  };
  FRIENDS.add = async function (text) {
    const code = FRIENDS.cleanCode(text);
    if (!code) throw err('bad', 'That is not a friend code. Codes look like K7QM-P2XD.');
    const b = back(), st = read();
    if (code === st.code) throw err('self', 'That is your own code. Send it to a friend instead.');
    const uid = await b.getCode(code);
    if (!uid) throw err('unknown', 'No player has that code. Check it and try again.');
    if ((await b.listFriends()).includes(uid)) throw err('already', 'You are already friends.');
    if ((await b.listRequests()).some((r) => r.from === uid)) { await FRIENDS.accept(uid); return { what: 'accepted', uid }; } // they asked first
    await b.sendRequest(uid, whoAmI());
    const s2 = read(); s2.sent[uid] = { code, at: Date.now() }; write(s2);
    return { what: 'sent', uid };
  };
  FRIENDS.accept = async function (from) { const b = back(); await b.accept(from); await b.setSee(from, true); };
  FRIENDS.decline = async function (from) { const b = back(); await b.deleteRequest(b.uid(), from); };
  FRIENDS.cancel = async function (to) { const b = back(); await b.deleteRequest(to, b.uid()); const st = read(); delete st.sent[to]; write(st); };
  FRIENDS.remove = async function (other) { const b = back(); await b.removeFriend(other); await b.setSee(other, null); };
  // Realtime Database rules cannot look into Firestore, so each player keeps their own "who may see my status" list.
  // Keep it equal to the friend list every start (and whenever the list changes), so an interrupted step heals.
  FRIENDS.repairSee = async function () {
    const b = back(), friends = await b.listFriends(), see = await b.listSee();
    for (const f of friends) if (!see.includes(f)) await b.setSee(f, true);
    for (const s of see) if (!friends.includes(s)) await b.setSee(s, null);
    const st = read(); let changed = false;
    for (const to in st.sent) if (friends.includes(to)) { delete st.sent[to]; changed = true; } // they accepted
    if (changed) write(st);
    return friends;
  };

  // ---- sharing one character or not (saved in the character, so cloud save carries it to other devices)
  FRIENDS.shared = (S) => !!(S && S.player && !S.player.friendsHidden);
  FRIENDS.setShared = function (id, on) {
    const cur = root.G && G.S && G.S.id === id, S = readChar(id);
    if (!S) return Promise.resolve(null);
    if (on) delete S.player.friendsHidden; else S.player.friendsHidden = true;
    if (cur) G.save(); else G.writeSave(S);
    dirty.add(id);
    if (cur && be) be.presence(FRIENDS.on() ? { char: on ? id : null } : null).catch(() => {});
    return FRIENDS.flush(true);
  };

  // ---- online status: one entry per open game while it is visible
  FRIENDS.online = function (on) {
    if (!FRIENDS.on() || !be) return Promise.resolve();
    const S = root.G && G.S;
    return be.presence(on ? { char: FRIENDS.shared(S) ? S.id : null } : null).catch(() => {});
  };

  // ---- the live view for the Friends tab and the Social dot: calls cb({ friends, requests, sent }) on every change.
  // friends: [{ uid, profile (null while it loads or when Friends is off for them), online, char, lastSeen }]
  FRIENDS.watch = function (cb) {
    const b = back();
    const subs = {}, view = { friends: {}, requests: [], ready: false };
    const emit = () => {
      const st = read();
      const friends = Object.values(view.friends).map((f) => Object.assign({}, f)).sort((a, b2) => (b2.online - a.online) || ((b2.profile && b2.profile.lastSeen) || 0) - ((a.profile && a.profile.lastSeen) || 0));
      cb({ friends, requests: view.requests.slice(), sent: Object.keys(st.sent).map((uid) => Object.assign({ uid }, st.sent[uid])), ready: view.ready });
    };
    const onList = (uids) => {
      for (const u of Object.keys(view.friends)) if (!uids.includes(u)) { (subs[u] || []).forEach((f) => f()); delete subs[u]; delete view.friends[u]; }
      for (const u of uids) if (!view.friends[u]) {
        view.friends[u] = { uid: u, profile: null, online: false, char: null, lastSeen: 0 };
        subs[u] = [
          b.watchProfile(u, (p) => { if (!view.friends[u]) return; view.friends[u].profile = p; view.friends[u].lastSeen = (p && p.lastSeen) || 0; emit(); }),
          b.watchStatus(u, (conns) => { if (!view.friends[u]) return; const list = Object.values(conns || {}).sort((x, y) => (y.at || 0) - (x.at || 0)); view.friends[u].online = list.length > 0; view.friends[u].char = list.length ? list[0].char || null : null; emit(); }),
        ];
      }
      view.ready = true; emit();
      FRIENDS.repairSee().catch(() => {});
    };
    const offList = b.watchFriends(onList);
    const offReq = b.watchRequests((reqs) => { view.requests = reqs; emit(); });
    return () => { offList(); offReq(); for (const u in subs) subs[u].forEach((f) => f()); };
  };

  // how a friend's item is shown: the game's own item for an id, the stored one for a rolled item, or null when
  // this version of the game does not know it (the tab then asks to update)
  FRIENDS.item = (g) => (!g ? null : g.id && !g.name ? (root.D && D.ITEMS[g.id]) || null : g);

  // ---- the real backend: Firebase, loaded from Google's CDN only once a player opens Friends. Sign-in is the Google
  // sign-in cloud save uses, asking only for 'openid' ("who is this", no email): the app through the AzCloud bridge,
  // the browser through a Google Identity Services token. Firebase then keeps its own sign-in in this page's storage.
  const CFG = { apiKey: 'AIzaSyAZ-0zSk2uUlM4HumQXzqiFKjkhcunXhI4', authDomain: 'compelling-cat-510114-p4.firebaseapp.com',
    projectId: 'compelling-cat-510114-p4', appId: '1:862031054528:web:9586a7431e9ef94e854f25',
    databaseURL: 'https://compelling-cat-510114-p4-default-rtdb.asia-southeast1.firebasedatabase.app' };
  const SDK = 'https://www.gstatic.com/firebasejs/12.19.0/';
  FRIENDS.firebase = function () {
    let fb = null, loading = null, gis = null, gisPending = null, gisLoading = null;
    // test only: localStorage 'azsolo.friends.emu' = a player id points everything at Firebase's local emulators
    // (cd firebase && npx firebase emulators:start), signed in as that made-up player. Never set in real play.
    const EMU = (() => { try { return root.location && /^(localhost|127\.0\.0\.1)$/.test(root.location.hostname) ? localStorage.getItem('azsolo.friends.emu') : null; } catch (e) { return null; } })();
    const inApp = () => !!(root.UPD && UPD.inApp && UPD.inApp() && root.AzCloud);
    // the app: our own calls on the AzCloud bridge (ids of our own; every other reply goes on to cloud.js)
    let seq = 800000, hooked = false; const mine = {};
    const bridge = (cmd, args) => new Promise((res, rej) => {
      if (!hooked) { hooked = true; const prev = root.AZCLOUD_REPLY;
        root.AZCLOUD_REPLY = (s) => { let r; try { r = typeof s === 'string' ? JSON.parse(s) : s; } catch (e) { return; }
          const w = mine[r.id]; if (!w) return prev && prev(s); delete mine[r.id];
          if (r.ok) w.res(r.value); else { const v = r.value || {}; w.rej(err(v.code || 'auth', v.message || 'Google did not sign you in.')); } }; }
      const id = ++seq; mine[id] = { res, rej }; root.AzCloud.postMessage(JSON.stringify({ id, cmd, args: args || {} }));
    });
    // the browser: Google's script, loaded ahead (prepare) so the window can open straight from the tap
    const loadGis = () => new Promise((res, rej) => {
      if (root.google && google.accounts && google.accounts.oauth2) return res();
      const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
      s.onload = () => res(); s.onerror = () => rej(err('offline', 'Could not reach Google. Check the connection and try again.'));
      document.head.appendChild(s);
    });
    const initGis = () => {
      if (gis || !(root.google && google.accounts && google.accounts.oauth2)) return;
      gis = google.accounts.oauth2.initTokenClient({ client_id: root.CLOUD && CLOUD.WEB_CLIENT, scope: 'openid',
        callback: (r) => { const p = gisPending; gisPending = null; if (p) (r.access_token ? p.res(r.access_token) : p.rej(err('auth', 'Google did not sign you in. Try again.'))); },
        error_callback: (e) => { const p = gisPending; gisPending = null; if (p) p.rej(err(e && e.type === 'popup_closed' ? 'cancelled' : 'auth', e && e.type === 'popup_failed_to_open' ? 'The browser blocked Google\'s sign-in window. Allow pop-ups for this page and try again.' : 'Sign-in was cancelled.')); } });
    };
    // called synchronously from the tap (a browser only allows Google's window then)
    const googleToken = () => {
      if (inApp()) return bridge('token', { interactive: true, scopes: ['openid'] });
      initGis();
      if (!gis) return Promise.reject(err('offline', 'Google sign-in is still loading. Try again in a moment.'));
      return new Promise((res, rej) => { gisPending = { res, rej }; gis.requestAccessToken({ prompt: '' }); });
    };
    const load = () => loading || (loading = (async () => {
      const [app, auth, fs, db] = await Promise.all(['app', 'auth', 'firestore', 'database'].map((m) => import(SDK + `firebase-${m}.js`)));
      const a = app.initializeApp(CFG, 'friends');
      const A = auth.initializeAuth(a, { persistence: [auth.browserLocalPersistence, auth.inMemoryPersistence] });
      const F = fs.getFirestore(a), R = db.getDatabase(a);
      if (EMU) { auth.connectAuthEmulator(A, 'http://127.0.0.1:8785', { disableWarnings: true }); fs.connectFirestoreEmulator(F, '127.0.0.1', 8781); db.connectDatabaseEmulator(R, '127.0.0.1', 8782); }
      await A.authStateReady(); // the sign-in saved in this page's storage, if any
      fb = { auth, fs, db, A, F, R };
      return fb;
    })().catch((e) => { loading = null; throw e.code ? e : err('offline', 'Could not reach Friends. Check the connection and try again.'); }));
    const f = () => { if (!fb) throw err('offline', 'Friends is still loading.'); return fb; };
    const me = () => { const u = fb && fb.A.currentUser; if (!u) throw err('auth', 'Sign in to use Friends.'); return u.uid; };
    const d = (...p) => f().fs.doc(f().F, ...p);
    const col = (...p) => f().fs.collection(f().F, ...p);
    const r = (p) => f().db.ref(f().R, p);
    let conn = null, want = null, infoOff = null, linked = false;
    const again = (start) => {
      let off = null, timer = null, stopped = false;
      const go = () => { off = start(() => { if (!stopped) { clearTimeout(timer); timer = setTimeout(go, 20000); } }); };
      go();
      return () => { stopped = true; clearTimeout(timer); if (off) off(); };
    };
    const applyPresence = async () => {
      const { db } = f();
      if (!want) { if (conn) { const c = conn; conn = null; await db.remove(c); } return; }
      if (!conn) { conn = db.push(r('status/' + me())); await db.onDisconnect(conn).remove(); }
      const e = { at: Date.now() }; if (want.char) e.char = String(want.char).slice(0, 40);
      await db.set(conn, e);
    };
    return {
      prepare() { const p = load(); if (!inApp() && !EMU && !gisLoading) gisLoading = loadGis().then(initGis).catch(() => { gisLoading = null; }); return p; },
      signedIn: () => !!(fb && fb.A.currentUser),
      async signIn(interactive, token) {
        if (fb && fb.A.currentUser) return;
        if (token) { await load(); if (!fb.A.currentUser) await fb.auth.signInWithCredential(fb.A, fb.auth.GoogleAuthProvider.credential(null, token)); return; }
        if (!interactive) {
          await load(); if (fb.A.currentUser) return;
          // the app can ask Google quietly once it has allowed the game before; a browser cannot without a tap
          if (inApp() && !EMU) { const tok = await bridge('token', { interactive: false, scopes: ['openid'] }); await fb.auth.signInWithCredential(fb.A, fb.auth.GoogleAuthProvider.credential(null, tok)); return; }
          throw err('auth', 'Sign in to use Friends.');
        }
        if (EMU) { await load(); await fb.auth.signInWithCredential(fb.A, fb.auth.GoogleAuthProvider.credential(JSON.stringify({ sub: EMU, email_verified: false }))); return; }
        const tokP = googleToken(); // first, while still inside the tap
        await load();
        if (fb.A.currentUser) { tokP.catch(() => {}); return; }
        const tok = await tokP;
        await fb.auth.signInWithCredential(fb.A, fb.auth.GoogleAuthProvider.credential(null, tok));
      },
      async signOut() { if (fb) { want = null; await applyPresence().catch(() => {}); await fb.auth.signOut(fb.A); } },
      uid: me,
      async getCode(c) { const s = await f().fs.getDoc(d('codes', c)); return s.exists() ? s.data().uid : null; },
      async createCode(c) { if (await this.getCode(c)) return false; await f().fs.setDoc(d('codes', c), { uid: me() }); return true; },
      async deleteCode(c) { await f().fs.deleteDoc(d('codes', c)); },
      async getProfile(u) { const s = await f().fs.getDoc(d('profiles', u)); return s.exists() ? s.data() : null; },
      // each character's card replaces its own field whole (mergeFields), so an unequipped slot really goes
      async updateProfile(fields) {
        const { fs } = f(), data = {}, paths = [];
        for (const k in fields) if (k !== 'chars') { data[k] = fields[k]; paths.push(k); }
        if (fields.chars) { data.chars = {}; for (const id in fields.chars) { data.chars[id] = fields.chars[id] === null ? fs.deleteField() : fields.chars[id]; paths.push('chars.' + id); } }
        await fs.setDoc(d('profiles', me()), data, { mergeFields: paths });
      },
      async deleteProfile() { await f().fs.deleteDoc(d('profiles', me())); },
      async sendRequest(to, info) { await f().fs.deleteDoc(d('requests', to, 'in', me())).catch(() => {}); await f().fs.setDoc(d('requests', to, 'in', me()), info); },
      async deleteRequest(to, from) { await f().fs.deleteDoc(d('requests', to, 'in', from)); },
      async listRequests() { const s = await f().fs.getDocs(col('requests', me(), 'in')); return s.docs.map((x) => Object.assign({ from: x.id }, x.data())); },
      async accept(from) {
        const { fs } = f(), u = me(), b = fs.writeBatch(f().F), since = Date.now();
        b.set(d('friends', u, 'list', from), { since }); b.set(d('friends', from, 'list', u), { since }); b.delete(d('requests', u, 'in', from));
        await b.commit();
      },
      async listFriends() { const s = await f().fs.getDocs(col('friends', me(), 'list')); return s.docs.map((x) => x.id); },
      async removeFriend(o) { const { fs } = f(), u = me(), b = fs.writeBatch(f().F); b.delete(d('friends', u, 'list', o)); b.delete(d('friends', o, 'list', u)); await b.commit(); },
      async listSee() { const s = await f().db.get(r('see/' + me())); return Object.keys(s.val() || {}); },
      async setSee(o, v) { if (v) await f().db.set(r(`see/${me()}/${o}`), true); else await f().db.remove(r(`see/${me()}/${o}`)); },
      async clearSee() { await f().db.remove(r('see/' + me())); },
      // one entry per open game; after a dropped connection the server has removed it, so it is made again
      async presence(x) {
        want = x;
        if (!infoOff) { infoOff = f().db.onValue(r('.info/connected'), (s) => { const on = s.val() === true; if (on && !linked) { conn = null; applyPresence().catch(() => {}); } linked = on; }); return; }
        if (linked) await applyPresence();
      },
      // A refused listen ends for good, and refusals are normal here: right after Accept the friendship is not on the
      // server yet, and a friend's status opens only once their game has let you see it. So a refused listen tries
      // again every 20 seconds until it is let in (or is stopped).
      watchProfile: (u, cb) => again((fail) => f().fs.onSnapshot(d('profiles', u), (s) => cb(s.exists() ? s.data() : null), () => { cb(null); fail(); })),
      watchStatus: (u, cb) => again((fail) => f().db.onValue(r('status/' + u), (s) => cb(s.val() || {}), () => { cb({}); fail(); })),
      // the list as the server has it (not our own write before it lands), so each new friend is listened to once it counts
      watchFriends: (cb) => again((fail) => f().fs.onSnapshot(col('friends', me(), 'list'), { includeMetadataChanges: true }, (s) => { if (!s.metadata.hasPendingWrites) cb(s.docs.map((x) => x.id)); }, () => fail())),
      watchRequests: (cb) => again((fail) => f().fs.onSnapshot(col('requests', me(), 'in'), (s) => cb(s.docs.map((x) => Object.assign({ from: x.id }, x.data()))), () => fail())),
    };
  };
  // the same places cloud save works: the app, and the game's own page (Google knows these sites)
  if (root.CLOUD && ((CLOUD.appOk && CLOUD.appOk()) || (CLOUD.webOk && CLOUD.webOk()))) FRIENDS.setBackend(FRIENDS.firebase());
})(typeof window !== 'undefined' ? window : globalThis);
