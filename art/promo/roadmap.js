// The public roadmap infographic, from the game's own art and fonts, rendered by headless Chrome (like devlog_banner.js).
// Two layouts: --portrait (1080x1350, the one that reads on a phone: Discord shows it about 400 px wide) and landscape
// (1920x1080, for desktop). Every line is spoiler-checked (G.nameable at level 1) and dumped to <out>.txt for ipcheck.
// Usage: node art/promo/roadmap.js <spec.json> <out.png> [--portrait] [--src <url>]
// spec: { "title", "sub", "here": 0 (the stage the "You are here" marker sits before),
//         "stages": [{ "name", "lines": [..], "scene": "<ART.scene key>" or "story:<ART.story scene key>" }] }
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const args = process.argv.slice(2);
const specFile = args[0], OUT = args[1], PORTRAIT = args.includes('--portrait');
if (!specFile || !OUT) { console.error('usage: node art/promo/roadmap.js <spec.json> <out.png> [--portrait] [--src <url>]'); process.exit(1); }
const spec = JSON.parse(fs.readFileSync(specFile, 'utf8'));
const SRC = args.includes('--src') ? args[args.indexOf('--src') + 1] : 'https://faizal97.github.io/realm-of-loner/';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9353, W = PORTRAIT ? 1080 : 1920, H = PORTRAIT ? 1350 : 1080;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'azroadmap-'));
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
      const S = ${JSON.stringify(spec)}, P = ${PORTRAIT}, W = ${W}, H = ${H};
      const url = (s) => !s ? '' : /^data:|^https?:/.test(s) ? s : 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
      const art = (k) => url(k.startsWith('story:') ? ART.story.scene(k.slice(6)) : ART.scene(k));
      await document.fonts.ready;
      document.body.innerHTML = ''; document.body.style.cssText = 'margin:0;background:#120d09;overflow:hidden';
      const root = document.createElement('div');
      root.style.cssText = 'position:fixed;left:0;top:0;width:' + W + 'px;height:' + H + 'px;overflow:hidden;font-family:"Alegreya Sans",sans-serif;color:#f3e6c4;background:radial-gradient(ellipse at 50% 0%,#3a2a17 0%,#1a120b 55%,#0e0906 100%)';
      const gold = '#ffd77a', rim = '#b8913e';
      const here = (S.here || 0);
      const marker = (vertical) => '<div style="display:flex;align-items:center;gap:12px;color:#1a120b;background:' + gold + ';border-radius:999px;padding:' + (P ? '8px 22px' : '8px 20px') + ';font-weight:800;font-size:' + (P ? 34 : 30) + 'px;box-shadow:0 4px 12px rgba(0,0,0,.6);white-space:nowrap">You are here <span style="display:inline-block;width:0;height:0;border-left:12px solid transparent;border-right:12px solid transparent;border-top:16px solid #1a120b;' + (vertical ? '' : 'transform:rotate(-90deg)') + '"></span></div>';
      const head = '<div style="text-align:center;padding-top:' + (P ? 34 : 40) + 'px"><div style="font-family:\\'Marcellus SC\\',serif;font-size:' + (P ? 40 : 44) + 'px;letter-spacing:6px;color:#d9b45a">Realm of Loner</div>'
        + '<div style="font-family:\\'Marcellus SC\\',serif;font-size:' + (P ? 92 : 96) + 'px;line-height:1;color:' + gold + ';text-shadow:0 5px 0 #5a3a12,0 8px 20px #000">' + S.title + '</div>'
        + (S.sub ? '<div style="font-size:' + (P ? 34 : 34) + 'px;margin-top:8px;color:#e8d9b4">' + S.sub + '</div>' : '') + '</div>';
      let body = '';
      if (P) {
        // a vertical timeline: art on the left, the words on the right, a gold rail joining the stages
        body = '<div style="position:relative;margin:' + 26 + 'px 48px 0 48px">';
        S.stages.forEach((st, i) => {
          if (i === here) body += '<div style="display:flex;justify-content:flex-start;margin:0 0 10px 0">' + marker(true) + '</div>';
          body += '<div style="display:flex;gap:28px;align-items:center;margin-bottom:' + (i < S.stages.length - 1 ? 22 : 0) + 'px">'
            + '<div style="flex:0 0 300px;height:176px;border:4px solid ' + rim + ';border-radius:16px;overflow:hidden;box-shadow:0 6px 16px rgba(0,0,0,.6);position:relative"><img src="' + art(st.scene) + '" style="width:100%;height:100%;object-fit:cover"><div style="position:absolute;left:10px;top:8px;width:44px;height:44px;border-radius:50%;background:' + gold + ';color:#1a120b;font-weight:800;font-size:28px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px #000">' + (i + 1) + '</div></div>'
            + '<div style="flex:1;min-width:0"><div style="font-family:\\'Marcellus SC\\',serif;font-size:50px;line-height:1.05;color:' + gold + ';text-shadow:0 3px 8px #000">' + st.name + '</div>'
            + st.lines.map((l) => '<div style="font-size:35px;font-weight:700;line-height:1.2;margin-top:4px;color:#f6ead0">' + l + '</div>').join('') + '</div></div>';
        });
        body += '</div>';
      } else {
        // five columns left to right
        body = '<div style="display:flex;align-items:flex-start;gap:22px;margin:40px 50px 0 50px">';
        S.stages.forEach((st, i) => {
          body += '<div style="flex:1;min-width:0">' + (i === here ? '<div style="display:flex;justify-content:center;margin-bottom:12px">' + marker(true) + '</div>' : '<div style="height:66px"></div>')
            + '<div style="height:250px;border:4px solid ' + rim + ';border-radius:16px;overflow:hidden;box-shadow:0 6px 16px rgba(0,0,0,.6);position:relative"><img src="' + art(st.scene) + '" style="width:100%;height:100%;object-fit:cover"><div style="position:absolute;left:10px;top:8px;width:42px;height:42px;border-radius:50%;background:' + gold + ';color:#1a120b;font-weight:800;font-size:26px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px #000">' + (i + 1) + '</div></div>'
            + '<div style="font-family:\\'Marcellus SC\\',serif;font-size:46px;line-height:1.05;margin-top:18px;color:' + gold + ';text-shadow:0 3px 8px #000">' + st.name + '</div>'
            + st.lines.map((l) => '<div style="font-size:31px;font-weight:700;line-height:1.2;margin-top:8px;color:#f6ead0">' + l + '</div>').join('') + '</div>';
        });
        body += '</div>';
      }
      root.innerHTML = '<div style="display:flex;flex-direction:column;justify-content:' + (P ? 'flex-start' : 'center') + ';height:100%;padding-bottom:' + (P ? 0 : 30) + 'px;box-sizing:border-box">' + head + body + '</div>';
      document.body.appendChild(root);
      await Promise.all([...root.querySelectorAll('img')].map((i) => i.decode().catch(() => null)));
      await new Promise((r) => setTimeout(r, 400));
      const text = root.innerText.split('\\n').map((s) => s.trim()).filter(Boolean);
      const bad = window.G && G.nameable ? text.filter((l) => !G.nameable(l, 1)) : ['G.nameable missing'];
      const last = root.lastElementChild.lastElementChild.getBoundingClientRect();
      const over = [...root.querySelectorAll('div')].filter((d) => d.scrollWidth > d.clientWidth + 1 && d.style.whiteSpace !== 'nowrap' && !d.querySelector('img')).length;
      return { text, bad, fits: last.bottom <= H - 20, bottom: Math.round(last.bottom), overflow: over };`);
    fs.writeFileSync(OUT.replace(/\.png$/, '') + '.txt', report.text.join('\n') + '\n');
    console.log(JSON.stringify({ bad: report.bad, fits: report.fits, bottom: report.bottom, overflow: report.overflow }));
    if (report.bad.length) throw new Error('a line names something a level-1 reader may not see: ' + report.bad.join(' | '));
    if (!report.fits) throw new Error('the content runs past the bottom edge (' + report.bottom + ' of ' + H + ')');
    const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: W, height: H, scale: 1 } });
    fs.writeFileSync(OUT, Buffer.from(shot.result.data, 'base64'));
    console.log('saved', OUT, `${W}x${H}`);
  } catch (e) { console.error('roadmap error:', e.message); process.exitCode = 1; }
  ws.close(); chrome.kill(); await sleep(600); try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {}
})();
