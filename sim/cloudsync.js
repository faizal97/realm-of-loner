// Cloud save rules (src/cloud.js) against a fake Google Drive shared by fake devices, each with its own storage.
// Every case from docs/plans/2026-09-29-cloud-save-design.md section 4. No Google code runs.  node sim/cloudsync.js
require('./_seed.js'); // seeded (#125): the same commit always gives the same result; SEED=n picks other dice
const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m }; };
globalThis.localStorage = mem();
require('../src/data.js'); require('../src/engine.js'); require('../src/bots.js'); require('../src/game.js'); require('../src/cloud.js');
const { G, CLOUD } = globalThis;
let t = 1790000000000; Date.now = () => t;

// ---- a fake Drive: the same five calls as CLOUD.driveREST, in memory; `down` makes every call fail like an expired sign-in
const drive = { files: new Map(), n: 0, down: false, calls: 0 };
const fake = {
  guard() { drive.calls++; if (drive.down) throw Object.assign(new Error('expired'), { code: 'auth' }); },
  async list() { this.guard(); return [...drive.files.values()].map((f) => ({ id: f.id, name: f.name, appProperties: Object.assign({}, f.props) })); },
  async create(name, props, text) { this.guard(); const id = 'f' + ++drive.n; drive.files.set(id, { id, name, props: Object.assign({}, props), text }); return { id }; },
  async update(id, props, text) { this.guard(); const f = drive.files.get(id); Object.assign(f.props, props); f.text = text; return { id }; },
  async download(id) { this.guard(); return drive.files.get(id).text; },
  async remove(id) { this.guard(); drive.files.delete(id); },
};
CLOUD.setDriver(fake);

// ---- devices: each has its own localStorage and says what it is
const devices = {};
const dev = (name, kind) => (devices[name] = { name, kind, ls: mem() });
const use = (d) => { if (G.S) G.logout(); globalThis.localStorage = d.ls; CLOUD.device = () => d.kind; localStorage.setItem('azsolo.cloud', JSON.stringify(Object.assign(CLOUD.state(), { on: true }))); };
const play = (secs, xp) => { t += secs * 1000; G.S.player.played = (G.S.player.played || 0) + secs; G.S.player.xp += xp; G.save(); };
const char = (id) => G.readSave(id);
const cloudOf = (id) => [...drive.files.values()].filter((f) => f.name === `char-${id}.azs`);

let pass = 0, fail = 0;
const ok = (cond, what) => { if (cond) pass++; else { fail++; console.log('FAIL', what); } };

(async () => {
  const phone = dev('phone', 'phone'), web = dev('web', 'browser'), tab = dev('tab', 'phone');

  // 1. phone → browser → phone: every switch loads the other device's progress by itself
  use(phone);
  G.newGame({ name: 'Aria', cls: 'paladin', race: 'human' }); const A = G.S.id;
  play(600, 100);
  let r = await CLOUD.sync(A);
  ok(r.what === 'pushed' && cloudOf(A).length === 1 && cloudOf(A)[0].props.rev === '1', 'first backup makes revision 1');
  use(web);
  ok(G.characters().length === 0, 'the browser starts empty');
  let list = await CLOUD.list();
  ok(list.length === 1 && list[0].name === 'Aria' && list[0].dev === 'phone' && list[0].level === 1, 'the Restore list shows Aria from the phone');
  r = await CLOUD.restore([A]);
  ok(r[0].what === 'restored' && char(A) && char(A).player.xp === 100, 'restore brings Aria in with her progress');
  G.load(A); play(900, 250);
  r = await CLOUD.sync(A);
  ok(r.what === 'pushed' && cloudOf(A)[0].props.rev === '2' && cloudOf(A)[0].props.dev === 'browser', 'the browser backs up revision 2');
  use(phone);
  r = await CLOUD.sync(A);
  ok(r.what === 'pulled' && char(A).player.xp === 350, 'the phone loads the browser\'s progress by itself');
  G.load(A); play(300, 50); r = await CLOUD.sync(A);
  ok(r.what === 'pushed' && cloudOf(A)[0].props.rev === '3', 'the phone carries on as revision 3');
  use(web); r = await CLOUD.sync(A);
  ok(r.what === 'pulled' && char(A).player.xp === 400, 'and the browser picks that up in turn');

  // 2. just opening a character (under a minute of play) does not count as playing
  G.load(A); play(30, 0); r = await CLOUD.sync(A);
  ok(r.what === 'same' && cloudOf(A)[0].props.rev === '3', 'opening Aria for 30 s uploads nothing');

  // 2b. standing in town for 20 minutes (time passes, nothing changes) does not count either: a newer copy still loads
  use(phone); await CLOUD.sync(A); // the phone catches up to revision 3 first
  G.load(A); t += 1200 * 1000; G.S.player.played += 1200; G.save(); // idle on the phone
  use(web); G.load(A); play(300, 9); await CLOUD.sync(A); // the browser plays and uploads revision 4
  use(phone); r = await CLOUD.sync(A);
  ok(r.what === 'pulled' && char(A).player.xp === 409, 'idle time is not progress: the phone loads the browser\'s revision without asking');
  use(web); await CLOUD.sync(A);

  // 3. both devices played from the same revision: the game asks, and each answer does what it says
  use(phone); G.load(A); play(1200, 500); // offline on the phone: xp 909
  use(web); G.load(A); play(600, 70); await CLOUD.sync(A); // the browser uploads revision 5: xp 479
  use(phone); r = await CLOUD.sync(A);
  ok(r.what === 'conflict' && r.local.played > r.cloud.played - 99999 && char(A).player.xp === 909 && cloudOf(A)[0].props.rev === '5', 'a conflict changes nothing and shows both');
  r = await CLOUD.resolve(A, 'local');
  ok(r.what === 'pushed' && cloudOf(A)[0].props.rev === '6' && cloudOf(A)[0].props.dev === 'phone', 'Keep this device\'s: the phone\'s version becomes revision 6');
  use(web); r = await CLOUD.sync(A);
  ok(r.what === 'pulled' && char(A).player.xp === 909, 'the browser, which uploaded 5 and has not played since, loads 6 by itself');
  G.load(A); play(600, 11); // browser xp 920
  use(phone); G.load(A); play(600, 22); await CLOUD.sync(A); // phone uploads revision 7: xp 931
  use(web); r = await CLOUD.sync(A);
  ok(r.what === 'conflict', 'both played again: asked');
  r = await CLOUD.resolve(A, 'cloud');
  ok(r.what === 'pulled' && char(A).player.xp === 931, 'Keep the cloud\'s: the browser takes the phone\'s version');
  G.load(A); play(600, 11); // browser xp 942
  use(phone); G.load(A); play(600, 22); await CLOUD.sync(A); // phone uploads revision 8: xp 953
  use(web); r = await CLOUD.sync(A);
  ok(r.what === 'conflict', 'a third conflict');
  const before = G.characters().length;
  r = await CLOUD.resolve(A, 'both');
  const copy = G.characters().find((c) => c.id !== A && c.name === 'Aria');
  ok(r.what === 'both' && G.characters().length === before + 1 && copy && char(copy.id).player.xp === 953 && char(A).player.xp === 942, 'Keep both: the cloud\'s version becomes a second Aria');
  ok(cloudOf(A)[0].props.rev === '9' && cloudOf(copy.id).length === 0, 'this device\'s version goes up as revision 9; the copy is its own, unsynced character');
  await CLOUD.backupAll();
  ok(cloudOf(copy.id).length === 1 && cloudOf(copy.id)[0].props.rev === '1', 'Back up now gives the copy its own file');

  // 4. several characters, and a device that restores them all
  use(phone); G.newGame({ name: 'Borin', cls: 'warrior', race: 'dwarf' }); play(120, 5); G.newGame({ name: 'Cyl', cls: 'mage', race: 'gnome' }); play(120, 5);
  let conflicts = await CLOUD.backupAll();
  list = await CLOUD.list();
  ok(conflicts.length === 0 && list.length === 4, 'Back up now covers every character (four in the cloud)');
  use(tab); r = await CLOUD.restore(list.map((c) => c.id));
  ok(r.every((x) => x.what === 'restored') && G.characters().length === 4, 'a third device restores all four');
  ok(char(A).player.xp === 942, 'with Aria at her latest revision');

  // 5. a restore that would go over the character limit restores nothing
  const full = dev('full', 'browser'); use(full);
  for (let i = 0; i < G.MAX_CHARS - 2; i++) G.newGame({ name: 'Filler' + i, cls: 'rogue', race: 'human' });
  const had = G.characters().length;
  let threw = null; try { await CLOUD.restore(list.map((c) => c.id)); } catch (e) { threw = e; }
  ok(threw && threw.code === 'full' && G.characters().length === had, 'over the limit: a clear error and nothing restored');

  // 6. deleting a character: the cloud copy stays unless asked
  use(tab); const B = list.find((c) => c.name === 'Borin').id;
  G.deleteCharacter(B); CLOUD.forget(B);
  ok(cloudOf(B).length === 1, 'deleting Borin here keeps his cloud copy');
  await CLOUD.deleteCloud(B);
  ok(cloudOf(B).length === 0 && (await CLOUD.list()).length === 3, 'and Delete from cloud removes it');

  // 7. an expired sign-in: automatic backup fails quietly, keeps the error, and works after reconnecting
  use(phone); G.load(A); play(700, 40); drive.down = true;
  const xpNow = char(A).player.xp; t += 11 * 60 * 1000; r = await CLOUD.maybeBackup(false);
  ok(r.what === 'error' && CLOUD.state().lastError.code === 'auth' && char(A).player.xp === xpNow, 'expired: the backup waits, the save is untouched, the section can show Reconnect');
  drive.down = false; t += 11 * 60 * 1000; r = await CLOUD.maybeBackup(false);
  ok(r.what === 'pushed' && CLOUD.state().lastError === null, 'after reconnecting the backup goes through');
  const calls = drive.calls; r = await CLOUD.maybeBackup(false);
  ok(r === null && drive.calls === calls, 'and the next one waits its 10 minutes');
  // 7b. the sign-in ran out while nothing changed: Back up now uploads nothing, but it went through, so Reconnect goes
  G.logout(); await CLOUD.backupAll(); // settle: every character on the Drive as it is here
  localStorage.setItem('azsolo.cloud', JSON.stringify(Object.assign(CLOUD.state(), { lastError: { code: 'auth', message: 'ran out', at: t } })));
  let uploads = 0; const cr = drive.create, up = drive.update;
  drive.create = function () { uploads++; return cr.apply(this, arguments); }; drive.update = function () { uploads++; return up.apply(this, arguments); };
  t += 1000; await CLOUD.backupAll();
  drive.create = cr; drive.update = up;
  ok(uploads === 0 && CLOUD.state().lastError === null && CLOUD.state().lastBackup === t, 'Back up now with nothing to upload still clears Reconnect and counts as a backup');

  // 7c. a browser reload (the Google token is gone) with nothing new to back up: no Drive call, so no Reconnect
  use(web); G.load(A); await CLOUD.sync(A); await CLOUD.syncAccount(); G.load(A); // a sync may have brought in the phone's copy
  localStorage.setItem('azsolo.cloud', JSON.stringify(Object.assign(CLOUD.state(), { lastError: null })));
  let calls7c = drive.calls; drive.down = true; t += 11 * 60 * 1000; r = await CLOUD.maybeBackup(true);
  ok(r === null && drive.calls === calls7c && CLOUD.state().lastError === null, 'reloaded with nothing new: no Drive call and no Reconnect');
  localStorage.setItem('azsolo.cloud', JSON.stringify(Object.assign(CLOUD.state(), { lastError: { code: 'auth', message: 'ran out', at: t } })));
  r = await CLOUD.maybeBackup(true);
  ok(r === null && CLOUD.state().lastError === null, 'and an old "ran out" goes, since the Drive already has everything');
  play(60, 5); calls7c = drive.calls; r = await CLOUD.maybeBackup(true);
  ok(r.what === 'error' && CLOUD.state().lastError.code === 'auth', 'with new progress waiting, the sign-in is needed, so Reconnect shows');
  drive.down = false;

  // 8. automatic backup during play never loads a newer copy over the character being played (with a live token, so
  // the check runs even though nothing changed here)
  const realFresh = CLOUD.fresh; CLOUD.fresh = () => true;
  use(web); G.load(A); await CLOUD.sync(A);
  use(phone); G.load(A); play(600, 1); await CLOUD.sync(A);
  use(web); G.load(A); r = await CLOUD.maybeBackup(true);
  CLOUD.fresh = realFresh;
  ok(r.what === 'newer' && G.S && G.S.id === A, 'a newer copy is only reported while playing');

  // 9. an old save from before cloud save: no records at all, still loads, and is treated as never synced
  const old = dev('old', 'browser'); use(old); localStorage.removeItem('azsolo.cloud');
  G.newGame({ name: 'Dana', cls: 'priest', race: 'human' }); const Dn = G.S.id; play(100, 1); G.logout();
  ok(G.load(Dn) !== undefined && G.S.player.name === 'Dana', 'an old save loads as before');
  ok(CLOUD.decide(char(Dn), null, null) === 'push' && CLOUD.decide(char(Dn), { rev: 3 }, null) === 'conflict', 'never synced: first backup, or ask if the cloud has one');

  // 10. what goes up comes back identical
  use(tab); const ts = await CLOUD.list(); const one = ts.find((c) => c.name === 'Cyl');
  const code = await G.encodeSave(char(one.id)); const back = await G.decodeSave(code);
  ok(back.player.name === 'Cyl' && back.player.cls === 'mage' && JSON.stringify(back.player.bags) === JSON.stringify(char(one.id).player.bags), 'a save survives the round trip');

  // 10b. Mentor Marks and heirlooms (per device, in no save) travel as account.azs: heirlooms combine, higher marks win
  use(phone); G.saveAccount({ marks: 40, heirlooms: ['hl_a'] });
  use(web); G.saveAccount({ marks: 10, heirlooms: ['hl_b'] });
  use(phone); await CLOUD.syncAccount();
  use(web); let acc = await CLOUD.syncAccount();
  ok(acc.marks === 40 && acc.heirlooms.includes('hl_a') && acc.heirlooms.includes('hl_b') && G.account().marks === 40, 'the browser gets the phone\'s 40 marks and keeps its own heirloom');
  use(phone); acc = await CLOUD.syncAccount();
  ok(acc.marks === 40 && G.account().heirlooms.length === 2, 'and the phone gets the browser\'s heirloom back');
  const fresh = dev('fresh', 'browser'); use(fresh);
  ok(G.account().marks === 0, 'a new device starts with no marks');
  await CLOUD.restore([]); // any restore also brings the account in
  ok(G.account().marks === 40 && G.account().heirlooms.length === 2, 'until it restores: then marks and heirlooms arrive');
  // story scenes seen, lore pages read and tips shown travel too; the tips on/off setting stays on each device
  use(phone); localStorage.setItem('azsolo.story', JSON.stringify(['intro', 'ch2'])); localStorage.setItem('azsolo.loreread', JSON.stringify(['lp_a'])); localStorage.setItem('azsolo.tips', JSON.stringify({ seen: ['start'], off: false }));
  await CLOUD.syncAccount();
  use(web); localStorage.setItem('azsolo.story', JSON.stringify(['ch3'])); localStorage.setItem('azsolo.tips', JSON.stringify({ seen: ['bags'], off: true }));
  await CLOUD.syncAccount();
  const rd = (k) => JSON.parse(localStorage.getItem(k));
  ok(rd('azsolo.story').length === 3 && rd('azsolo.loreread')[0] === 'lp_a' && rd('azsolo.tips').seen.length === 2 && rd('azsolo.tips').off === true, 'scenes seen, pages read and tips shown combine; this device keeps its tips off');
  use(phone); await CLOUD.syncAccount();
  ok(rd('azsolo.story').includes('ch3') && rd('azsolo.tips').off === false, 'the phone gets the browser\'s scene and keeps its tips on');
  const accFiles = [...drive.files.values()].filter((f) => f.name === 'account.azs');
  ok(accFiles.length === 1 && (await CLOUD.list()).every((c) => c.name !== undefined && c.id !== 'account'), 'one account file, and it never shows up as a character');

  // 11. on the game's own sites cloud.js must load without errors and offer sign-in; elsewhere it stays off
  const vm = require('vm'), src = require('fs').readFileSync(require('path').join(__dirname, '../src/cloud.js'), 'utf8');
  for (const [origin, want] of [['https://faizal97.github.io', true], ['http://127.0.0.1:8778', true], ['https://example.com', false]]) {
    const win = { location: { origin }, localStorage: mem() }; win.window = win;
    let threw = null; try { vm.runInNewContext(src, win); } catch (e) { threw = e; }
    ok(!threw && win.CLOUD && win.CLOUD.available() === want, `cloud.js on ${origin}: loads, sign-in ${want ? 'offered' : 'off'}${threw ? ' (' + threw.message + ')' : ''}`);
  }

  // 12. in the app: sign-in goes through the AzCloud bridge; a phone without Google Play services gets none
  const appWin = (playOk, answer) => {
    const win = { location: { origin: 'https://appassets.androidplatform.net' }, localStorage: mem(), UPD: { inApp: () => true }, sent: [] };
    win.window = win;
    win.AzCloud = { postMessage: (m) => { const q = JSON.parse(m); win.sent.push(q.cmd); setTimeout(() => win.AZCLOUD_REPLY(JSON.stringify(q.cmd === 'available' ? { id: q.id, ok: true, value: playOk } : answer(q))), 0); } };
    vm.runInNewContext(src, win); return win;
  };
  let w = appWin(true, (q) => ({ id: q.id, ok: true, value: 'tok-' + (q.args.interactive ? 'tap' : 'quiet') }));
  await new Promise((r) => setTimeout(r, 5));
  ok(w.CLOUD.available() && w.CLOUD.device() === 'phone' && (await w.CLOUD.token(false)) === 'tok-quiet' && w.CLOUD.fresh(), 'in the app: available, a phone, and a quiet token for background backups');
  w = appWin(false, () => ({}));
  await new Promise((r) => setTimeout(r, 5));
  ok(!w.CLOUD.available() && w.CLOUD.why === 'play', 'no Google Play services: cloud save says so');
  w = appWin(true, (q) => ({ id: q.id, ok: false, value: { code: 'cancelled', message: 'Sign-in was cancelled.' } }));
  await new Promise((r) => setTimeout(r, 5));
  let why = null; try { await w.CLOUD.token(true); } catch (e) { why = e.code; }
  ok(why === 'cancelled', 'a cancelled Google screen comes back as cancelled (no error message shown)');

  // 13. Drive says the token ran out: one retry with a fresh token, then it goes through
  let n401 = 0, cleared = 0; const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, o) => { if (o.headers.Authorization === 'Bearer old') { n401++; return { status: 401, ok: false }; } return { status: 200, ok: true, json: async () => ({ files: [] }) }; };
  let tokNow = 'old';
  const d = CLOUD.driveREST(async () => tokNow, async () => { cleared++; tokNow = 'new'; });
  const files = await d.list();
  ok(Array.isArray(files) && n401 === 1 && cleared === 1, 'an expired token is cleared and the call retried once');
  globalThis.fetch = realFetch;

  // 14. the Friends switch rides in the account file: the newest change wins, either way
  const on1 = CLOUD.mergeAccount({ friends: { on: true, at: 5 } }, { friends: { on: false, at: 3 } });
  const off2 = CLOUD.mergeAccount({ friends: { on: true, at: 5 } }, { friends: { on: false, at: 9 } });
  const none = CLOUD.mergeAccount({ marks: 1 }, { marks: 2 });
  ok(on1.friends.on === true && off2.friends.on === false && off2.friends.at === 9 && !('friends' in none), 'the Friends switch: the newest change wins, and no switch stays no switch');
  ok(CLOUD.mergeAccount({}, { friends: { on: true, at: 7 } }).friends.on === true, 'a device that never switched takes the other device\'s switch');

  // 15. trophies (#44) ride in the account file: both devices' trophies combine, and each keeps its first taking
  const tm = CLOUD.mergeAccount({ trophies: { scorchmaw: { by: 'Ana', at: 50 }, ashwing: { by: 'Ana', at: 9 } } }, { trophies: { scorchmaw: { by: 'Bo', at: 20 }, rakshiri: { by: 'Bo', at: 30 } } });
  ok(tm.trophies.scorchmaw.by === 'Bo' && tm.trophies.ashwing.by === 'Ana' && tm.trophies.rakshiri.by === 'Bo' && Object.keys(tm.trophies).length === 3, 'trophies combine, and a trophy taken on both devices keeps the first taking');
  ok(!('trophies' in CLOUD.mergeAccount({ marks: 1 }, { marks: 2 })), 'no trophies stay no trophies (an old account file loads as it was)');
  use(phone); G.saveAccount(Object.assign(G.account(), { trophies: { old_brinescale: { by: 'Ana', at: 5 } } }));
  await CLOUD.syncAccount(); use(web); await CLOUD.syncAccount();
  ok(!!(G.account().trophies || {}).old_brinescale && G.account().marks === 40, 'a trophy taken on the phone reaches the browser, and the browser keeps its marks');

  // 16. Friends and cloud save in one Google window (#46). The browser: one token request for both scopes; Drive
  // allowed turns cloud save on, Drive refused leaves it off with the usual message, a cancelled window turns on nothing.
  // The token goes on to Friends either way (openid).
  const webBoth = (outcome) => {
    const win = { location: { origin: 'https://faizal97.github.io' }, localStorage: mem(), asked: [] }; win.window = win;
    const DRIVE = 'https://www.googleapis.com/auth/drive.appdata';
    win.google = { accounts: { oauth2: {
      initTokenClient: (o) => ({ requestAccessToken: () => { win.asked.push(o.scope); setTimeout(() => {
        if (outcome === 'cancel') return o.error_callback({ type: 'popup_closed' });
        o.callback({ access_token: 'T', expires_in: 3600, granted: outcome === 'both' ? ['openid', DRIVE] : ['openid'] }); }, 0); } }),
      hasGrantedAllScopes: (r, ...ss) => ss.every((x) => (r.granted || []).includes(x)) } } };
    vm.runInNewContext(src, win); return win;
  };
  for (const [outcome, want] of [['both', 'on'], ['nodrive', 'denied'], ['cancel', 'cancelled']]) {
    const W = webBoth(outcome); let r = null, threw = null;
    try { r = await W.CLOUD.signInBoth(); } catch (e) { threw = e.code; }
    const one = W.asked.length === 1 && W.asked[0] === 'openid https://www.googleapis.com/auth/drive.appdata';
    if (want === 'on') ok(one && r.cloud === true && W.CLOUD.on() && r.friendsToken === 'T' && W.CLOUD.fresh(), 'browser, both allowed: one Google window for both, cloud save on, the token goes to Friends');
    if (want === 'denied') ok(one && r.cloud.code === 'denied' && !W.CLOUD.on() && r.friendsToken === 'T', 'browser, Drive refused: Friends still gets its token, cloud save stays off with the usual message');
    if (want === 'cancelled') ok(one && threw === 'cancelled' && !W.CLOUD.on(), 'browser, the window cancelled: nothing turns on');
  }
  // the app: one interactive bridge call asking for both; then cloud save asks Android quietly for Drive alone
  for (const driveOk of [true, false]) {
    const W = appWin(true, (q) => {
      W.calls = (W.calls || []).concat([{ interactive: !!q.args.interactive, scopes: q.args.scopes || null }]);
      if (q.args.interactive) return { id: q.id, ok: true, value: 'tok-both' };
      return driveOk ? { id: q.id, ok: true, value: 'tok-drive' } : { id: q.id, ok: false, value: { code: 'auth', message: 'The Google sign-in has run out. Reconnect to carry on.' } };
    });
    await new Promise((r) => setTimeout(r, 5));
    const r = await W.CLOUD.signInBoth(), calls = (W.calls || []), tap = calls.filter((c) => c.interactive);
    const bothAsked = tap.length === 1 && JSON.stringify(tap[0].scopes) === JSON.stringify(['openid', 'https://www.googleapis.com/auth/drive.appdata']);
    if (driveOk) ok(bothAsked && r.cloud === true && W.CLOUD.on() && r.friendsToken === null, 'app: one Google window for both, then cloud save on with a quiet Drive token (Friends asks Android quietly itself)');
    else ok(bothAsked && r.cloud !== true && !W.CLOUD.on(), 'app, Drive not allowed: cloud save stays off');
  }

  console.log(`cloudsync: ${pass}/${pass + fail} checks pass`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
