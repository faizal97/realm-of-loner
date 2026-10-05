// In-app updater (v9.3). Asks GitHub for the latest release of this game, compares it with the version this build was
// made from (window.AZ_VERSION, set by build.py from app/pubspec.yaml), and on Android downloads the release APK and
// opens the system installer through the AzUpd bridge (lib/main.dart -> MainActivity.kt). In a plain browser it just
// links to the release page. UI lives in ui.js (updateDialog); this file has no DOM code.
(function (root) {
  const UPD = root.UPD = {};
  const REPO = 'faizal97/realm-of-loner';
  const API = `https://api.github.com/repos/${REPO}/releases/latest`; // ignores pre-releases
  const API_ALL = `https://api.github.com/repos/${REPO}/releases?per_page=15`; // pre-releases too (the beta channel)
  // The beta channel (v9.9): test builds go out as GitHub pre-releases (tag vX.Y.Z-beta.N). In the app it is a switch
  // saved on this device; in a browser it is the /beta/ page, which publish_web.sh also refreshes on every normal
  // release so it is never behind. Same site, so both pages share the same characters.
  UPD.WEB = 'https://faizal97.github.io/realm-of-loner/';
  UPD.WEB_BETA = UPD.WEB + 'beta/';
  UPD.onBetaPage = () => /\/beta\/(index\.html)?$/.test((root.location && root.location.pathname) || '');
  UPD.onSite = () => /github\.io$/.test((root.location && root.location.hostname) || '');
  const KEY = 'azsolo.update';
  const EVERY = 30 * 60 * 1000; // automatic checks reuse the last answer for 30 min (GitHub allows 60 an hour)
  UPD.current = () => String(root.AZ_VERSION || '0.0.0');
  UPD.inApp = () => !!(root.AzUpd && root.AzUpd.postMessage);
  UPD.isBetaBuild = () => /-/.test(UPD.current());

  const store = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } };
  const save = (o) => { try { localStorage.setItem(KEY, JSON.stringify(Object.assign(store(), o))); } catch (e) { } };
  UPD.skip = (tag) => save({ skip: tag });
  UPD.beta = () => (UPD.inApp() ? store().beta === true : UPD.onBetaPage());
  UPD.setBeta = (on) => save({ beta: !!on, at: 0 }); // at: 0 so the next check asks the right channel

  // "v9.10.0" > "v9.2.0"; a pre-release comes before its release: v9.10.0-beta.1 < v9.10.0-beta.2 < v9.10.0
  UPD.cmp = function (a, b) {
    const p = (v) => { const m = String(v).match(/^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-[a-z]*\.?(\d*))?/i) || []; return [+m[1] || 0, +m[2] || 0, +m[3] || 0, m[4] === undefined ? Infinity : +m[4] || 0]; };
    const x = p(a), y = p(b);
    for (let i = 0; i < 4; i++) if (x[i] !== y[i]) return x[i] > y[i] ? 1 : -1;
    return 0;
  };
  UPD.newer = (a, b) => UPD.cmp(a, b) > 0;

  // Resolves { latest, name, notes, url, apk, size, newer, skipped } or null when offline / GitHub unreachable.
  UPD.check = async function (force) {
    if (root.AZ_DEV) return null; // a dev build (#92) is never offered a release
    const st = store(), chan = UPD.beta() ? 'beta' : 'stable';
    if (!force && st.at && st.chan === chan && Date.now() - st.at < EVERY) {
      if (!st.rel) return null;
      return Object.assign({}, st.rel, { newer: UPD.newer(st.rel.latest, UPD.current()), skipped: st.skip === st.rel.latest });
    }
    let r;
    try {
      const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const t = ctl ? setTimeout(() => ctl.abort(), 8000) : null;
      const res = await fetch(chan === 'beta' ? API_ALL : API, { headers: { Accept: 'application/vnd.github+json' }, signal: ctl ? ctl.signal : undefined });
      if (t) clearTimeout(t);
      if (!res.ok) return null;
      r = await res.json();
      // beta: the highest version among releases and pre-releases
      if (Array.isArray(r)) r = r.filter((x) => !x.draft).sort((a, b) => UPD.cmp(b.tag_name, a.tag_name))[0];
      if (!r) return null;
    } catch (e) { return null; }
    const apk = (r.assets || []).find((a) => /\.apk$/i.test(a.name));
    const rel = { latest: r.tag_name, beta: !!r.prerelease, name: r.name || r.tag_name, notes: r.body || '', url: r.html_url, apk: apk ? apk.browser_download_url : null, size: apk ? apk.size : 0 };
    save({ at: Date.now(), chan, rel });
    return Object.assign({}, rel, { newer: UPD.newer(rel.latest, UPD.current()), skipped: st.skip === rel.latest });
  };

  // ---------- bridge to Android (same shape as the AI pack's)
  let seq = 0; const waiting = {};
  root.AZUPD_REPLY = function (s) {
    let r; try { r = typeof s === 'string' ? JSON.parse(s) : s; } catch (e) { return; }
    const w = waiting[r.id]; if (!w) return;
    delete waiting[r.id];
    if (r.ok) w.res(r.value); else w.rej(r.value || { code: 'error' });
  };
  UPD.call = function (cmd, args) {
    if (!UPD.inApp()) return Promise.reject({ code: 'unsupported' });
    return new Promise((res, rej) => { const id = ++seq; waiting[id] = { res, rej }; root.AzUpd.postMessage(JSON.stringify({ id, cmd, args: args || {} })); });
  };

  // Download, reporting progress (0..1) as it goes, then hand the file to the installer.
  // Resolves 'installing', or 'need_permission' when Android first has to allow this app to install updates.
  UPD.download = async function (rel, onProgress) {
    await UPD.call('download', { url: rel.apk });
    for (;;) {
      await new Promise((r) => setTimeout(r, 400));
      const p = await UPD.call('progress');
      if (onProgress) onProgress(p.total > 0 ? p.done / p.total : 0, p);
      if (p.state === 'done') break;
      if (p.state === 'error') throw { code: 'download', message: p.error };
    }
    return UPD.install();
  };
  UPD.install = async function () {
    if (!(await UPD.call('canInstall'))) return 'need_permission';
    await UPD.call('install');
    return 'installing';
  };
  UPD.askPermission = () => UPD.call('askInstallPermission');
  // In a browser there is nothing to install: the new version is already on the site, so reload past the cached copy
  // (a ?v= tag makes it a new address). If the reload still brings the old build (Pages can lag a few minutes),
  // justReloadedFor stops the offer from looping.
  UPD.reloadWeb = function (tag) {
    save({ reloadedFor: tag, reloadAt: Date.now() });
    const u = new URL(root.location.href); u.searchParams.set('v', String(tag).replace(/^v/i, ''));
    root.location.replace(u.toString());
  };
  UPD.justReloadedFor = (tag) => { const st = store(); return st.reloadedFor === tag && Date.now() - (st.reloadAt || 0) < 30 * 60000; };
  UPD.DISCORD = 'https://discord.gg/6xaVaXukeT'; // the game's community server; the app only opens these links and the repo
  UPD.PRIVACY = UPD.WEB + 'privacy.html'; // what the game does with data (web/privacy.html, published next to the game)
  UPD.KOFI = 'https://ko-fi.com/starlighthvn'; // optional tips (v10.0.1)
  UPD.SOCIABUZZ = 'https://sociabuzz.com/starlighthvn/tribe'; // the same, for players in Indonesia
  UPD.open = (url) => (UPD.inApp() ? UPD.call('openUrl', { url }) : (root.open && root.open(url, '_blank')));

  // Release notes are GitHub markdown; show the simple parts (headings, bold, bullets) as safe HTML.
  UPD.notesHtml = function (md) {
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/`([^`]+)`/g, '$1');
    const out = []; let list = 0;
    const close = (to) => { while (list > to) { out.push('</ul>'); list--; } };
    for (const raw of String(md).replace(/\r/g, '').split('\n')) {
      const m = raw.match(/^(\s*)[-*] (.*)$/);
      if (m) { const lvl = Math.floor(m[1].length / 2) + 1; while (list < lvl) { out.push('<ul>'); list++; } close(lvl); out.push(`<li>${inline(m[2])}</li>`); continue; }
      close(0);
      const hd = raw.match(/^#{1,4}\s+(.*)$/);
      if (hd) out.push(`<p><b>${inline(hd[1])}</b></p>`);
      else if (raw.trim()) out.push(`<p>${inline(raw)}</p>`);
    }
    close(0);
    return out.join('');
  };
})(typeof window !== 'undefined' ? window : globalThis);
