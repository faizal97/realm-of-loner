// Record a cutscene from the real build as an exact 30 fps frame sequence, for an MP4. Headless Chrome runs on virtual
// time: the page clock is paused, and each frame advances it by 1/30 s before a screenshot of the stage + captions.
// Usage: serve dist/ on :8777, then  node art/promo/record_cutscene.js <chapterId> <outdir>
//        ffmpeg -framerate 30 -i <outdir>/f%05d.jpg ... (see the command printed at the end)
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const CH = process.argv[2] || 'legend_lyveus', OUT = process.argv[3] || path.join(__dirname, 'out', 'rec');
// A trailer (art/promo/trailers/*.js): INJECT=<file> runs in the page and defines window.TRAILER (a chapter that never
// ships in the game) and window.TRAILER_PLAY(); VW/VH set the viewport (a 16:9 video: VW=640 VH=360 SCALE=3), and
// CLIP=stage records the picture only (the trailer puts its captions on the picture).
// __FILE(path)__ in it becomes that file's text as a JS string (a logo SVG from art/), path from the repo root
const INJECT = process.env.INJECT ? fs.readFileSync(process.env.INJECT, 'utf8').replace(/__FILE\(([^)]+)\)__/g, (_, f) => JSON.stringify(fs.readFileSync(path.join(__dirname, '..', '..', f), 'utf8'))) : '';
const VW = +(process.env.VW || 390), VH = +(process.env.VH || 844), STAGE_ONLY = process.env.CLIP === 'stage';
const FPS = 30, SCALE = +(process.env.SCALE || 1080 / VW);
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (/^f\d+\.jpg$/.test(f)) fs.unlinkSync(path.join(OUT, f));
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PROFILE = fs.mkdtempSync('/tmp/azrec-');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=9378', '--user-data-dir=' + PROFILE, '--hide-scrollbars', '--mute-audio', 'about:blank'], { stdio: 'ignore' });
  let targets; for (let i = 0; i < 40; i++) { try { targets = await (await fetch('http://127.0.0.1:9378/json')).json(); if (targets.length) break; } catch (e) {} await sleep(250); }
  const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const wait = {}; let budgetDone = null;
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.id && wait[d.id]) { wait[d.id](d); delete wait[d.id]; }
    if (d.method === 'Emulation.virtualTimeBudgetExpired' && budgetDone) { const f = budgetDone; budgetDone = null; f(); }
  });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; wait[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  const js = async (expr) => { const r = await send('Runtime.evaluate', { expression: `(async()=>{${expr}})()`, awaitPromise: true, returnByValue: true }); return r.result && r.result.result && r.result.result.value; };
  const jsSync = async (expr) => { const r = await send('Runtime.evaluate', { expression: `(()=>{${expr}})()`, returnByValue: true }); return r.result && r.result.result && r.result.result.value; };
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: SCALE, mobile: true });
  await send('Page.navigate', { url: 'http://localhost:8777/' }); await sleep(2500);
  await js(`localStorage.clear(); G.newGame({name:'Aldric',cls:'paladin',race:'human'}); G.S.player.level=12; G.S.player.story={intro:true,ch1:true}; G.S.flags.warModeAsked=true; G.save(); try{localStorage.setItem('azsolo.story', JSON.stringify(['intro','ch1','${CH}']));}catch(e){} return true;`);
  await send('Page.navigate', { url: 'http://localhost:8777/' }); await sleep(2500);
  const H = `const click=(re,sel='button, .row, .chip, .mcard')=>{const e=[...document.querySelectorAll(sel)].find(b=>re.test(b.textContent.trim())); if(e) e.click(); return !!e;};`;
  await js(`${H} click(/Enter World/); await new Promise(r=>setTimeout(r,1800)); document.querySelectorAll('.dialog .btn').forEach(b=>/OK|Enter World/i.test(b.textContent)&&b.click()); return true;`);
  await sleep(800);
  // a clean video: no Skip button, no "Tap to continue"
  await js(`const st=document.createElement('style'); st.textContent='.cs-skip,.cs-tap{opacity:0!important}'; document.head.appendChild(st); return true;`);
  await js(`${H} click(/^Hero$/, '.tab, button, nav button'); await new Promise(r=>setTimeout(r,700)); click(/Theater/); await new Promise(r=>setTimeout(r,900)); return true;`);
  if (INJECT) { await js(INJECT + '\n;return true;'); }
  const title = INJECT ? await jsSync(`return TRAILER.title;`) : await jsSync(`return CS.byId('${CH}').title;`);
  // freeze the clock, then start the chapter
  await send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
  const ok = INJECT ? await jsSync(`TRAILER_PLAY(); return true;`) : await jsSync(`const t=CS.byId('${CH}').title; const row=[...document.querySelectorAll('.row')].find(b=>b.textContent.includes(t)); if(row) row.click(); return !!row;`);
  if (!ok) { console.log('could not find', title, 'in the Theater'); process.exit(1); }
  const step = (ms) => new Promise((r) => { budgetDone = r; send('Emulation.setVirtualTimePolicy', { policy: 'advance', budget: ms }); });
  let n = 0, started = false, clip = null, tail = 0;
  for (let guard = 0; guard < FPS * 240; guard++) {
    await step(1000 / FPS);
    const st = await jsSync(`const s=document.querySelector('.cs .cs-stage'), c=document.querySelector('.cs .cs-cap'); if(!s) return null; const a=s.getBoundingClientRect(), b=c?c.getBoundingClientRect():a; return {x:a.left, y:a.top, w:a.width, h:(${STAGE_ONLY}?a.bottom:Math.max(a.bottom,b.bottom))-a.top, playing: !!CS.playing};`);
    if (st && st.playing) started = true;
    if (!st) { if (started && ++tail > 3) break; continue; }
    if (!clip) clip = { x: Math.round(st.x), y: Math.round(st.y), width: Math.round(st.w), height: Math.round(st.h / 2) * 2, scale: 1 };
    const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 92, clip, captureBeyondViewport: false });
    fs.writeFileSync(path.join(OUT, `f${String(n++).padStart(5, '0')}.jpg`), Buffer.from(r.result.data, 'base64'));
    if (!st.playing && started && ++tail > FPS * 0.6) break;
  }
  console.log(`recorded "${title}": ${n} frames = ${(n / FPS).toFixed(1)} s at ${FPS} fps, clip ${clip && clip.width}x${clip && clip.height} css px (x${SCALE.toFixed(2)})`);
  ws.close(); chrome.kill(); await sleep(1000); try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch (e) {}
})();
