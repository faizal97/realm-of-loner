// A devlog banner (itch.io cover image) from the game's own art and fonts, rendered by headless Chrome.
// itch.io crops a devlog's image to 16:9 from the centre in every list (200x112 on the game page, 350x196 in the feed),
// so the banner is 16:9 and keeps everything in the safe area (6% in from every edge); the title must read at 200 px wide.
// The page is the live game (or --src <url>, e.g. a dist/ served on :8777), so ART and the fonts are the real ones.
// Usage: node art/promo/devlog_banner.js <spec.json> <out.png> [--src <url>]
// spec: { "title": "v10.10", "line": "Rare hunts · Trophies · …", "scene": "<ART.scene key>", "hero": "<ART.mob key>",
//         (line may be an array of lines) "icons": ["<ART.icon key>", …], "flip": false }   (keep every name in it spoiler-free: G.nameable(text, 1))
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const args = process.argv.slice(2);
const specFile = args[0], OUT = args[1];
if (!specFile || !OUT) { console.error('usage: node art/promo/devlog_banner.js <spec.json> <out.png> [--src <url>]'); process.exit(1); }
const spec = JSON.parse(fs.readFileSync(specFile, 'utf8'));
const SRC = args.includes('--src') ? args[args.indexOf('--src') + 1] : 'https://faizal97.github.io/realm-of-loner/';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9347, W = 1920, H = 1080;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'azbanner-'));
  const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, '--hide-scrollbars', '--mute-audio', 'about:blank'], { stdio: 'ignore' });
  let targets; for (let i = 0; i < 40; i++) { try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); if (targets.length) break; } catch (e) {} await sleep(250); }
  const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const wait = {};
  ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && wait[d.id]) { wait[d.id](d); delete wait[d.id]; } });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; wait[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  const js = async (expr) => { const r = await send('Runtime.evaluate', { expression: `(async()=>{${expr}})()`, awaitPromise: true, returnByValue: true }); if (r.result && r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400)); return r.result.result.value; };
  try {
    await send('Page.enable'); await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: SRC }); await sleep(4000);
    const report = await js(`
      const S = ${JSON.stringify(spec)};
      const url = (s) => !s ? '' : /^data:|^https?:/.test(s) ? s : 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
      const lines = [].concat(S.line || []), words = [S.title].concat(lines).join(' '); // line: a string, or an array of lines (each kept on one line)
      const spoiler = window.G && G.nameable && !G.nameable(words, 1);
      await document.fonts.ready;
      document.body.innerHTML = '';
      document.body.style.cssText = 'margin:0;background:#120d09;overflow:hidden';
      const root = document.createElement('div');
      root.style.cssText = 'position:fixed;left:0;top:0;width:${W}px;height:${H}px;overflow:hidden;font-family:"Alegreya Sans",sans-serif;color:#f3e6c4';
      root.innerHTML = \`
        <img src="\${url(ART.scene(S.scene))}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:saturate(1.05)">
        <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(14,9,6,.94) 0%,rgba(14,9,6,.82) 38%,rgba(14,9,6,.25) 62%,rgba(14,9,6,0) 80%)"></div>
        <div style="position:absolute;inset:auto 0 0 0;height:22%;background:linear-gradient(0deg,rgba(14,9,6,.7),rgba(14,9,6,0))"></div>
        \${S.hero ? \`<img src="\${url(ART.mob(S.hero))}" style="position:absolute;right:7%;bottom:7%;height:78%;\${S.flip ? 'transform:scaleX(-1);' : ''}filter:drop-shadow(0 14px 22px rgba(0,0,0,.6))">\` : ''}
        <div style="position:absolute;left:7%;top:12%;width:52%">
          <div style="font-family:'Marcellus SC',serif;font-size:58px;letter-spacing:6px;color:#d9b45a;text-shadow:0 3px 8px #000">Realm of Loner</div>
          <div style="font-family:'Marcellus SC',serif;font-size:300px;line-height:.95;color:#ffd77a;text-shadow:0 6px 0 #5a3a12,0 10px 26px #000;margin-top:6px">\${S.title}</div>
          <div style="font-size:60px;font-weight:700;line-height:1.15;margin-top:26px;color:#f6ead0;text-shadow:0 3px 10px #000">\${lines.map((l) => \`<div style="white-space:nowrap">\${l}</div>\`).join('')}</div>
          <div style="display:flex;gap:26px;margin-top:44px">\${(S.icons || []).map((k) => \`<div style="width:120px;height:120px;border:4px solid #b8913e;border-radius:14px;background:#1d140c;box-shadow:0 6px 16px rgba(0,0,0,.6);overflow:hidden"><img src="\${url(ART.icon(k))}" style="width:100%;height:100%"></div>\`).join('')}</div>
        </div>\`;
      document.body.appendChild(root);
      await Promise.all([...root.querySelectorAll('img')].map((i) => i.decode().catch(() => null)));
      await new Promise((r) => setTimeout(r, 400));
      const box = root.children[root.children.length - 1].getBoundingClientRect(), safeX = ${W} * 0.06, safeY = ${H} * 0.06;
      return { spoiler, inSafe: box.left >= safeX && box.top >= safeY && box.right <= ${W} - safeX && box.bottom <= ${H} - safeY, box: [box.left, box.top, box.right, box.bottom].map(Math.round), fonts: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family) };`);
    console.log(JSON.stringify(report));
    if (report.spoiler) throw new Error('the banner text names something a level-1 reader may not see');
    if (!report.inSafe) throw new Error('the text block leaves the safe area: ' + report.box);
    const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: W, height: H, scale: 1 } });
    fs.writeFileSync(OUT, Buffer.from(shot.result.data, 'base64'));
    console.log('saved', OUT, `${W}x${H}`);
  } catch (e) { console.error('banner error:', e.message); process.exitCode = 1; }
  ws.close(); chrome.kill(); await sleep(600); try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {}
})();
