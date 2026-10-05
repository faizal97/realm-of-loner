// Cloud save (v10.1): an optional copy of every character in the player's own Google Drive, in the hidden app-data
// folder only this game can see. No server of ours; nothing is sent anywhere else. Design and sync rules:
// docs/plans/2026-09-29-cloud-save-design.md. DOM-free like update.js: sign-in (the browser popup or the Android
// bridge) plugs in with CLOUD.setAuth, and Drive is reached through a small driver, so sim/cloudsync.js can swap in a
// fake Drive. One file per character, char-<id>.azs, holding its save code; small labels (appProperties) carry the
// revision number and what the Restore list shows, so checks never download a save.
(function (root) {
  const CLOUD = root.CLOUD = {};
  const KEY = 'azsolo.cloud'; // { on, lastAuto, lastBackup, lastError, chars: { <id>: { fileId, rev, played, mark, at } } }
  const SLACK = 60; // seconds of play that never count as "played since the last sync" (just opening a character)
  // "Played since the last sync" means progress, not time: a character left standing in town is unchanged. The mark
  // is a short fingerprint of what playing changes (level, XP, gold, gear, bags, quests, kills, where you are).
  CLOUD.mark = function (S) {
    const P = S.player;
    const str = JSON.stringify([P.level, P.xp, P.money, P.kills, P.deaths, P.place, P.quests, Object.keys(P.done || {}).length, P.equip, P.bags, P.bank || null]);
    let h = 5381; for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0;
    return h.toString(36) + '.' + str.length.toString(36);
  };
  const EVERY = 10 * 60 * 1000; // automatic backups at most this often while playing
  const FILE = (id) => `char-${id}.azs`;
  const FILE_RE = /^char-(.+)\.azs$/;

  const read = () => { try { const st = JSON.parse(localStorage.getItem(KEY) || '{}'); st.chars = st.chars || {}; return st; } catch (e) { return { chars: {} }; } };
  const write = (st) => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { } };
  const patch = (o) => { const st = read(); Object.assign(st, o); write(st); return st; };
  const record = (id, r) => { const st = read(); if (r) st.chars[id] = r; else delete st.chars[id]; write(st); };
  CLOUD.state = read;
  CLOUD.on = () => !root.AZ_DEV && !!read().on; // never in a dev build (#92): it would reach the player's real Drive
  CLOUD.device = () => (root.UPD && UPD.inApp && UPD.inApp() ? 'phone' : 'browser');
  const err = (code, message) => Object.assign(new Error(message), { code });

  // ---- sign-in and Drive plug in here
  let auth = null, driver = null;
  CLOUD.setAuth = (a) => { auth = a; driver = a ? CLOUD.driveREST(() => a.token(false), a.expired) : null; };
  CLOUD.setDriver = (d) => { driver = d; }; // the sim's fake Drive
  const drv = () => { if (!driver) throw err('auth', 'Not signed in to Google.'); return driver; };
  CLOUD.signIn = async function () { if (!auth) throw err('unavailable', 'Cloud save is not available here.'); await auth.token(true); patch({ on: true, lastError: null }); };
  // Friends and cloud save in one Google window (#46): 'openid' for Friends and drive.appdata for cloud save, on the same
  // client. Called synchronously from the tap. Throws if the window was cancelled (then neither switches on); otherwise
  // cloud save is on if Drive was allowed ({ cloud: true }, or the usual error), and friendsToken (null in the app,
  // where Friends asks Android quietly once allowed) is for Friends' own sign-in.
  CLOUD.signInBoth = async function () {
    if (!auth || !auth.both) throw err('unavailable', 'Cloud save is not available here.');
    const r = await auth.both();
    let cloud = true;
    try {
      if (r.drive === false) throw err('denied', 'Cloud save needs the Google Drive permission. Try again and allow it.');
      await auth.token(false); patch({ on: true, lastError: null });
    } catch (e) { cloud = e; }
    return { cloud, friendsToken: r.openid === false ? null : r.token };
  };
  CLOUD.signOut = async function () { patch({ on: false }); if (auth && auth.signOut) try { await auth.signOut(); } catch (e) { } }; // sync records stay, so signing in again carries on

  // ---- what the cloud holds
  const labels = (S, rev) => { const P = S.player; return { rev: String(rev), name: String(P.name).slice(0, 24), lvl: String(P.level), xp: String(Math.floor(P.xp || 0)), cls: P.cls, race: P.race || 'human', look: `${P.gender || 'm'}.${P.skin || 0}.${P.hair || 0}`, at: String(Date.now()), dev: CLOUD.device(), played: String(Math.floor(P.played || 0)) }; };
  const entry = (f) => { const a = f.appProperties || {}; return { fileId: f.id, id: f.name.replace(FILE_RE, '$1'), rev: +a.rev || 0, name: a.name || '?', level: +a.lvl || 0, xp: +a.xp || 0, cls: a.cls, race: a.race, look: (a.look || 'm.0.0').split('.'), at: +a.at || 0, dev: a.dev, played: +a.played || 0 }; };
  // every character in the cloud; if two devices once created the same character's file, the highest revision wins
  CLOUD.list = async function () {
    const best = {};
    for (const f of await drv().list()) {
      if (!FILE_RE.test(f.name)) continue;
      const c = entry(f), b = best[c.id];
      if (!b || c.rev > b.rev || (c.rev === b.rev && c.at > b.at)) best[c.id] = c;
    }
    return Object.values(best).sort((a, b) => b.at - a.at);
  };

  // ---- the rules (design section 2). S: this device's save or null; c: the cloud entry or null; r: this device's record
  CLOUD.decide = function (S, c, r) {
    if (!S) return c ? 'cloudOnly' : 'none';
    if (!c) return 'push';
    if (!r) return 'conflict'; // a cloud copy this device never synced with
    const clean = (r.mark && CLOUD.mark(S) === r.mark) || (S.player.played || 0) <= r.played + SLACK;
    if (c.rev === r.rev) return clean ? 'same' : 'push';
    if (c.rev > r.rev) return clean ? 'pull' : 'conflict';
    return 'conflict'; // the cloud went back (replaced from somewhere else): ask
  };

  async function push(S, c) {
    const rev = Math.max(c ? c.rev : 0, (read().chars[S.id] || {}).rev || 0) + 1;
    const code = await G.encodeSave(S), props = labels(S, rev);
    const f = c ? await drv().update(c.fileId, props, code) : await drv().create(FILE(S.id), props, code);
    record(S.id, { fileId: (f && f.id) || c.fileId, rev, played: Math.floor(S.player.played || 0), mark: CLOUD.mark(S), at: Date.now() });
    patch({ lastBackup: Date.now(), lastError: null });
  }
  // bring a cloud copy in; asCopy gives it a new id (Keep both), so it becomes its own character
  async function pull(c, asCopy) {
    const S = await G.decodeSave(await drv().download(c.fileId));
    S.id = asCopy ? 'c' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36) : c.id;
    G.writeSave(S);
    if (!asCopy) record(c.id, { fileId: c.fileId, rev: c.rev, played: Math.floor(S.player.played || 0), mark: CLOUD.mark(S), at: Date.now() });
    return S;
  }
  const local = (id) => { if (G.S && G.S.id === id) G.save(); return G.readSave(id); };
  const brief = (S) => S && { id: S.id, name: S.player.name, level: S.player.level, xp: Math.floor(S.player.xp || 0), cls: S.player.cls, played: S.player.played || 0, at: S.lastSeen || 0 };

  // One character: does whatever is safe and reports it. A 'conflict' changes nothing; the caller asks the player and
  // calls CLOUD.resolve. what: 'same' | 'pushed' | 'pulled' | 'newer' | 'conflict' | 'none'. With noPull (backups
  // during play) a newer cloud copy is only reported ('newer'), never loaded over the character being played.
  CLOUD.sync = async function (id, list, noPull) {
    const cl = list || await CLOUD.list(), c = cl.find((x) => x.id === id) || null, S = local(id);
    const d = CLOUD.decide(S, c, read().chars[id] || null);
    if (d === 'push') { await push(S, c); return { what: 'pushed', local: brief(S), cloud: c }; }
    if (d === 'pull') { if (noPull) return { what: 'newer', local: brief(S), cloud: c }; const N = await pull(c); return { what: 'pulled', local: brief(N), cloud: c }; }
    return { what: d === 'cloudOnly' ? 'none' : d, local: brief(S), cloud: c };
  };
  // Back up now: every character on this device. Returns the conflicts (for the caller to ask about).
  CLOUD.backupAll = async function () {
    const cl = await CLOUD.list(), out = [];
    for (const ch of G.characters()) { const r = await CLOUD.sync(ch.id, cl); if (r.what === 'conflict') out.push(r); }
    await CLOUD.syncAccount();
    // it went through, so the sign-in works again: clear an old 'ran out' even when nothing needed uploading, and
    // with no conflicts left the Drive holds every character as of now
    patch(out.length ? { lastError: null } : { lastError: null, lastBackup: Date.now() });
    return out;
  };
  // The player's answer to a conflict: 'local' (this device's wins), 'cloud' (the cloud's wins), 'both' (keep the
  // cloud's as a new character, then this device's goes up as the next revision)
  CLOUD.resolve = async function (id, choice) {
    const c = (await CLOUD.list()).find((x) => x.id === id) || null, S = local(id);
    if (choice === 'cloud' && c) return { what: 'pulled', local: brief(await pull(c)) };
    if (choice === 'both' && c) {
      if (G.characters().length >= G.MAX_CHARS) throw err('full', `You already have ${G.MAX_CHARS} characters, so there is no room for a copy. Delete one first.`);
      const copy = await pull(c, true);
      await push(S, c);
      return { what: 'both', local: brief(S), copy: brief(copy) };
    }
    await push(S, c);
    return { what: 'pushed', local: brief(S) };
  };
  // Restore: bring in the chosen cloud characters. New ones must all fit, or nothing is restored. Ones this device
  // already has follow the rules (a newer, safe copy loads; a conflict is returned for the caller to ask about).
  CLOUD.restore = async function (ids) {
    const cl = await CLOUD.list(), pick = cl.filter((c) => ids.includes(c.id));
    const fresh = pick.filter((c) => !G.readSave(c.id)), free = G.MAX_CHARS - G.characters().length;
    if (fresh.length > free) throw err('full', `That would make ${G.characters().length + fresh.length} characters, and the most is ${G.MAX_CHARS}. Delete ${fresh.length - free} first, or restore fewer.`);
    const out = [];
    for (const c of pick) out.push(fresh.includes(c) ? { what: 'restored', local: brief(await pull(c)), cloud: c } : await CLOUD.sync(c.id, cl));
    await CLOUD.syncAccount();
    return out;
  };
  // ---- the account (v10.1.1): Mentor Marks and heirlooms are shared by every character on a device
  // (G.account, azsolo.account) and belong to no save, so they get one file of their own, account.azs. Two devices
  // merge rather than choose: heirlooms combine, and the higher Mark balance wins, so a sync never loses either.
  // (Marks spent on one device can come back from another's higher balance; in a one-player game that is fine.)
  // The same file carries what else only ever grows and belongs to no save: the story scenes seen (azsolo.story, which
  // also stops seen chapters replaying), the Lore Journal pages read (azsolo.loreread) and the tips already shown
  // (azsolo.tips .seen). Those merge by combining; whether tips are on stays a setting of each device.
  // And the Friends switch (v10.2, friends.js): { on, at }, where the newest change wins, so turning Friends on or off
  // on one device does the same on the others.
  const ACCOUNT_FILE = 'account.azs';
  const LISTS = ['heirlooms', 'story', 'lore', 'tips', 'looks'];
  const union = (x, y) => { const out = []; for (const id of (x || []).concat(y || [])) if (!out.includes(id)) out.push(id); return out; };
  CLOUD.mergeAccount = function (a, b) {
    a = a || {}; b = b || {};
    const m = Object.assign({}, b, a, { marks: Math.max(+a.marks || 0, +b.marks || 0) });
    for (const k of LISTS) m[k] = union(a[k], b[k]);
    const fa = a.friends && a.friends.at ? a.friends : null, fb = b.friends && b.friends.at ? b.friends : null;
    if (fa || fb) m.friends = !fb || (fa && fa.at >= fb.at) ? fa : fb; else delete m.friends;
    // trophies (#44): { mob: { by, at } }; each keeps its first taking, whichever device it was on
    const ta = a.trophies || {}, tb = b.trophies || {}, tr = {};
    for (const k of union(Object.keys(ta), Object.keys(tb))) tr[k] = !tb[k] || (ta[k] && (+ta[k].at || 0) <= (+tb[k].at || 0)) ? ta[k] : tb[k];
    if (Object.keys(tr).length) m.trophies = tr; else delete m.trophies;
    return m;
  };
  const markOf = (x) => JSON.stringify([+x.marks || 0, x.friends || null].concat(LISTS.map((k) => (x[k] || []).slice().sort()), [Object.keys(x.trophies || {}).sort().map((k) => k + '@' + (+x.trophies[k].at || 0))]));
  const same = (x, y) => markOf(x) === markOf(y);
  const readList = (key, field) => { try { const v = JSON.parse(localStorage.getItem(key) || 'null'); return (field ? v && v[field] : v) || []; } catch (e) { return []; } };
  // everything the account file holds, as this device has it
  const localAccount = () => { const a = Object.assign({}, G.account(), { story: readList('azsolo.story'), lore: readList('azsolo.loreread'), tips: readList('azsolo.tips', 'seen') }); const f = root.FRIENDS && FRIENDS.switchInfo(); if (f) a.friends = f; return a; };
  function writeLocal(m) {
    G.saveAccount(Object.assign(G.account(), { marks: m.marks, heirlooms: m.heirlooms, looks: m.looks }, m.trophies ? { trophies: m.trophies } : {})); // keeps the wardrobe's own flags
    try {
      localStorage.setItem('azsolo.story', JSON.stringify(m.story));
      localStorage.setItem('azsolo.loreread', JSON.stringify(m.lore));
      let t = null; try { t = JSON.parse(localStorage.getItem('azsolo.tips') || 'null'); } catch (e) { t = null; }
      // a device that never had tip settings starts them the way the game would: off for anyone past level 5
      if (!t) t = { off: (G.characters() || []).some((c) => c.level >= 5) };
      t.seen = m.tips; localStorage.setItem('azsolo.tips', JSON.stringify(t));
    } catch (e) { }
    if (m.friends && root.FRIENDS) FRIENDS.remoteSwitch(m.friends); // Friends was switched on another device
  }
  const accountMark = () => markOf(localAccount());
  CLOUD.syncAccount = async function (files) {
    if (!root.G || !G.account) return null;
    const f = (files || await drv().list()).find((x) => x.name === ACCOUNT_FILE) || null;
    let there = null;
    if (f) { try { there = JSON.parse(await drv().download(f.id)); } catch (e) { there = null; } }
    const here = localAccount(), merged = CLOUD.mergeAccount(here, there);
    if (!same(merged, here)) writeLocal(merged);
    if (!there || !same(merged, there)) {
      const props = { kind: 'account', marks: String(merged.marks), heirlooms: String(merged.heirlooms.length), at: String(Date.now()), dev: CLOUD.device() };
      if (f) await drv().update(f.id, props, JSON.stringify(merged)); else await drv().create(ACCOUNT_FILE, props, JSON.stringify(merged));
    }
    patch({ accountMark: accountMark() }); // the account as the Drive now has it
    return merged;
  };

  // A character deleted on this device: forget its record; the cloud copy goes only if asked
  CLOUD.forget = (id) => record(id, null);
  CLOUD.deleteCloud = async function (id) {
    for (const f of await drv().list()) if (f.name === FILE(id)) await drv().remove(f.id);
    record(id, null);
  };

  // Automatic backup of the character being played: when the game goes to the background (force) and at most every
  // 10 minutes. Never throws: a failure is kept in lastError for the Settings section ('auth' shows Reconnect).
  CLOUD.maybeBackup = async function (force) {
    if (!CLOUD.on() || !root.G || !G.S) return null;
    const st = read();
    if (!force && Date.now() - (st.lastAuto || 0) < EVERY) return null;
    // Nothing new since the last backup: Drive already has it all, so no Google token is needed. (In a browser the
    // token lives in memory only, so without this every reload ended in "Reconnect" with nothing waiting to go up.)
    const rec = st.chars[G.S.id];
    if (!CLOUD.fresh() && rec && rec.mark === CLOUD.mark(G.S) && st.accountMark && st.accountMark === accountMark()) {
      if (st.lastError && st.lastError.code === 'auth') patch({ lastError: null });
      return null;
    }
    patch({ lastAuto: Date.now() });
    try { const r = await CLOUD.sync(G.S.id, null, true); await CLOUD.syncAccount(); patch({ lastError: null }); return r; }
    catch (e) { patch({ lastError: { code: e.code || 'drive', message: e.message, at: Date.now() } }); return { what: 'error', error: e }; }
  };

  // ---- browser sign-in: Google Identity Services, loaded only when a player opens Cloud save or is signed in. The
  // token (about an hour) lives in memory only. The popup must open straight from a tap, so prepare() loads Google's
  // script ahead of time and token(true) is called from the tap itself.
  CLOUD.WEB_CLIENT = '862031054528-shfi3s50vefl7nd0g6clotqaehqampvt.apps.googleusercontent.com';
  CLOUD.SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
  // the sites registered with Google for this client (anything else would only get Google's error page)
  const WEB_ORIGINS = ['https://faizal97.github.io', 'http://127.0.0.1:8778', 'http://localhost:8778'];
  CLOUD.webOk = () => !!(root.location && WEB_ORIGINS.includes(root.location.origin)) && !(root.UPD && UPD.inApp && UPD.inApp());
  CLOUD.webAuth = function () {
    let tok = null, exp = 0, client = null, loading = null, pending = null;
    const ready = () => !!(root.google && google.accounts && google.accounts.oauth2);
    const load = () => loading || (loading = new Promise((res, rej) => {
      if (ready()) return res();
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
      s.onload = () => res(); s.onerror = () => { loading = null; rej(err('offline', 'Could not reach Google. Check the connection and try again.')); };
      document.head.appendChild(s);
    }));
    const init = () => {
      if (client || !ready()) return;
      client = google.accounts.oauth2.initTokenClient({
        client_id: CLOUD.WEB_CLIENT, scope: CLOUD.SCOPE,
        callback: (r) => { const p = pending; pending = null; if (!p) return;
          if (r.error || !r.access_token) return p.rej(err('auth', 'Google did not sign you in. Try again.'));
          if (google.accounts.oauth2.hasGrantedAllScopes && !google.accounts.oauth2.hasGrantedAllScopes(r, CLOUD.SCOPE)) return p.rej(err('denied', 'Cloud save needs the Google Drive permission. Try again and allow it.'));
          tok = r.access_token; exp = Date.now() + (+r.expires_in || 3600) * 1000; p.res(tok); },
        error_callback: (e) => { const p = pending; pending = null; if (p) p.rej(err(e && e.type === 'popup_closed' ? 'cancelled' : 'auth', e && e.type === 'popup_failed_to_open' ? 'The browser blocked Google\'s sign-in window. Allow pop-ups for this page and try again.' : 'Sign-in was cancelled.')); },
      });
    };
    return {
      prepare: () => load().then(init).catch(() => {}),
      fresh: () => !!tok && Date.now() < exp - 60000,
      async token(interactive) {
        if (tok && Date.now() < exp - 60000) return tok;
        if (!interactive) throw err('auth', 'The Google sign-in has run out. Reconnect to carry on.');
        if (!client) { await load(); init(); } // only when prepare() was not called in time: the browser may block this popup
        return new Promise((res, rej) => { pending = { res, rej }; client.requestAccessToken(CLOUD.on() ? { prompt: '' } : {}); });
      },
      // both permissions in one window (#46): which ones the player allowed, and the token (kept for Drive if allowed)
      both() {
        if (!ready()) return Promise.reject(err('offline', 'Google sign-in is still loading. Try again in a moment.'));
        return new Promise((res, rej) => {
          const two = google.accounts.oauth2.initTokenClient({ client_id: CLOUD.WEB_CLIENT, scope: 'openid ' + CLOUD.SCOPE,
            callback: (r) => {
              if (r.error || !r.access_token) return rej(err('auth', 'Google did not sign you in. Try again.'));
              const has = (s) => (google.accounts.oauth2.hasGrantedAllScopes ? google.accounts.oauth2.hasGrantedAllScopes(r, s) : true);
              const drive = has(CLOUD.SCOPE);
              if (drive) { tok = r.access_token; exp = Date.now() + (+r.expires_in || 3600) * 1000; }
              res({ token: r.access_token, drive, openid: has('openid') });
            },
            error_callback: (e) => rej(err(e && e.type === 'popup_closed' ? 'cancelled' : 'auth', e && e.type === 'popup_failed_to_open' ? 'The browser blocked Google\'s sign-in window. Allow pop-ups for this page and try again.' : 'Google did not sign you in. Try again.')) });
          two.requestAccessToken();
        });
      },
      expired() { tok = null; exp = 0; },
      signOut() { tok = null; exp = 0; }, // this device only: Google keeps the permission, so other devices stay signed in
    };
  };
  // ---- the app's sign-in: Google Play services through the AzCloud bridge (MainActivity.kt). Android keeps the grant
  // and renews tokens by itself, so backups also work in the background; only choosing an account needs a tap.
  CLOUD.appOk = () => !!(root.UPD && UPD.inApp && UPD.inApp() && root.AzCloud && root.AzCloud.postMessage);
  CLOUD.appAuth = function () {
    let seq = 0, tok = null, exp = 0;
    const waiting = {};
    root.AZCLOUD_REPLY = function (s) {
      let r; try { r = typeof s === 'string' ? JSON.parse(s) : s; } catch (e) { return; }
      const w = waiting[r.id]; if (!w) return;
      delete waiting[r.id];
      if (r.ok) w.res(r.value); else { const v = r.value || {}; w.rej(err(v.code || 'auth', v.message || 'Google did not sign you in.')); }
    };
    const call = (cmd, args) => new Promise((res, rej) => { const id = ++seq; waiting[id] = { res, rej }; root.AzCloud.postMessage(JSON.stringify({ id, cmd, args: args || {} })); });
    return {
      call,
      prepare: () => Promise.resolve(),
      fresh: () => !!tok && Date.now() < exp,
      async token(interactive) {
        if (tok && Date.now() < exp) return tok;
        tok = await call('token', { interactive: !!interactive });
        exp = Date.now() + 40 * 60 * 1000; // Android's tokens last about an hour; ask again well before
        return tok;
      },
      // both permissions in one window (#46); which were allowed shows when each side then asks Android quietly
      async both() { await call('token', { interactive: true, scopes: ['openid', CLOUD.SCOPE] }); return { token: null, drive: null, openid: null }; },
      async expired(t) { tok = null; exp = 0; await call('clear', { token: t }).catch(() => {}); },
      signOut() { const t = tok; tok = null; exp = 0; if (t) call('clear', { token: t }).catch(() => {}); },
    };
  };
  CLOUD.available = () => !root.AZ_DEV && !!auth;
  CLOUD.TESTING = false; // true while Google's consent screen is in Testing mode (only invited accounts can sign in); published 2026-09-29
  // a token for Drive; from a tap, interactive may open Google's window (called synchronously so the popup is allowed)
  CLOUD.token = (interactive) => (auth ? auth.token(interactive) : Promise.reject(err('unavailable', 'Cloud save is not available here.')));
  CLOUD.prepare = () => (auth && auth.prepare ? auth.prepare() : Promise.resolve());
  CLOUD.fresh = () => !!(auth && auth.fresh && auth.fresh());

  // ---- the real Drive: plain REST calls, only ever in the app-data folder
  const API = 'https://www.googleapis.com/drive/v3', UP = 'https://www.googleapis.com/upload/drive/v3';
  CLOUD.driveREST = function (getToken, expired) {
    const call = async (url, opt, again) => {
      const tok = await getToken();
      let r;
      try { r = await fetch(url, Object.assign({}, opt, { headers: Object.assign({ Authorization: 'Bearer ' + tok }, (opt && opt.headers) || {}) })); }
      catch (e) { throw err('offline', 'No connection to Google Drive.'); }
      if (r.status === 401 && expired && !again) { await expired(tok); return call(url, opt, true); } // one retry, fresh token
      if (r.status === 401) throw err('auth', 'The Google sign-in has run out. Reconnect to carry on.');
      if (!r.ok) throw err('drive', `Google Drive answered ${r.status}. Try again in a moment.`);
      return r;
    };
    const multipart = (meta, text) => {
      const b = 'azsolo' + Math.random().toString(36).slice(2);
      return { headers: { 'Content-Type': `multipart/related; boundary=${b}` },
        body: `--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${b}\r\nContent-Type: text/plain\r\n\r\n${text}\r\n--${b}--` };
    };
    return {
      async list() {
        let out = [], page = '';
        do {
          const r = await call(`${API}/files?spaces=appDataFolder&pageSize=100&fields=nextPageToken,files(id,name,appProperties)${page ? '&pageToken=' + encodeURIComponent(page) : ''}`);
          const j = await r.json(); out = out.concat(j.files || []); page = j.nextPageToken;
        } while (page);
        return out;
      },
      async create(name, props, text) { const m = multipart({ name, parents: ['appDataFolder'], mimeType: 'text/plain', appProperties: props }, text); return (await call(`${UP}/files?uploadType=multipart&fields=id`, { method: 'POST', headers: m.headers, body: m.body })).json(); },
      async update(id, props, text) { const m = multipart({ appProperties: props }, text); return (await call(`${UP}/files/${encodeURIComponent(id)}?uploadType=multipart&fields=id`, { method: 'PATCH', headers: m.headers, body: m.body })).json(); },
      async download(id) { return (await call(`${API}/files/${encodeURIComponent(id)}?alt=media`)).text(); },
      async remove(id) { await call(`${API}/files/${encodeURIComponent(id)}`, { method: 'DELETE' }); },
    };
  };
  // the browser's sign-in, ready to use on the registered sites (the app gets its own later). Last, so everything
  // it uses above is defined.
  CLOUD.why = null; // why cloud save is unavailable here, for the Settings section
  if (CLOUD.appOk()) {
    const a = CLOUD.appAuth(); CLOUD.setAuth(a);
    a.call('available').then((ok) => { if (!ok) { CLOUD.setAuth(null); CLOUD.why = 'play'; } }).catch(() => {});
  } else if (CLOUD.webOk()) CLOUD.setAuth(CLOUD.webAuth());
})(typeof window !== 'undefined' ? window : globalThis);
