// Save files (v9.7.1): the save code as a file you can keep or send, next to copy and paste.
// In the Android app the AzFile bridge (lib/main.dart -> MainActivity.kt) opens the share sheet and the system file
// picker; in a browser it is a plain download and a file input. The file holds the same text as the save code.
(function (root) {
  const SAVEFILE = root.SAVEFILE = {};
  SAVEFILE.inApp = () => !!(root.AzFile && root.AzFile.postMessage);
  let seq = 0; const waiting = {};
  root.AZFILE_REPLY = function (s) {
    let r; try { r = typeof s === 'string' ? JSON.parse(s) : s; } catch (e) { return; }
    const w = waiting[r.id]; if (!w) return;
    delete waiting[r.id];
    if (r.ok) w.res(r.value); else w.rej(r.value || { code: 'error' });
  };
  const call = (cmd, args) => new Promise((res, rej) => { const id = ++seq; waiting[id] = { res, rej }; root.AzFile.postMessage(JSON.stringify({ id, cmd, args: args || {} })); });

  // Share (app) or download (browser) a save. Resolves when the share sheet or download has started. opts: { title, mime }
  // for other files (the fight log, #295); an app older than v10.18 ignores them and shares under its save title
  SAVEFILE.save = function (name, text, opts) {
    const o = opts || {};
    if (SAVEFILE.inApp()) return call('share', Object.assign({ name, text }, o.title ? { title: o.title } : {}, o.mime ? { mime: o.mime } : {}));
    const url = URL.createObjectURL(new Blob([text], { type: o.mime || 'application/octet-stream' }));
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return Promise.resolve(true);
  };
  // Pick a save file. Resolves its text, or null if nothing was picked.
  SAVEFILE.pick = function () {
    if (SAVEFILE.inApp()) return call('pick');
    return new Promise((res) => {
      // attached to the page (some browsers ignore a click on a detached input), hidden, removed once used
      const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.azsave,.txt,text/plain,application/octet-stream';
      inp.style.display = 'none'; document.body.appendChild(inp);
      inp.onchange = () => { const f = inp.files && inp.files[0]; inp.remove(); if (!f) return res(null); f.text().then(res, () => res(null)); };
      inp.click();
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
