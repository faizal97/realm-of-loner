// The playtest driver: the real game in headless Chrome at phone size, on paused virtual time, read as text.
// One instance per process. Its own static server (PT_PORT, default 8781; never 8765) and a throwaway Chrome profile,
// so it never touches a player's saves or another session's preview.
//   start({ fresh })        load the game (fresh: empty storage)
//   look()                  the screen as text: controls with ids, text blocks, the player's line
//   tap(q)                  tap a control by id (e12) or label (regex) like a finger; says if nothing changed
//   advance(sec, stop)      run the game clock; stops early when a dialog, cutscene or level-up appears
//   check()                 bugs and rough edges on the screen now (errors, NaN, overflow, tap size, spoilers…)
//   shot(scale)             a PNG, only when the look itself is under test
//   evaluate(js)            read or stage game state (G, D, E) for setup and debugging
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os');
const PAGE = require('./page.js');

const ROOT = path.resolve(__dirname, '../..');
const DIST = process.env.PT_DIST || path.join(ROOT, 'dist');
const PORT = +process.env.PT_PORT || 8781;
const CDP_PORT = +process.env.PT_CDP || 9335;
const CHROME = process.env.PT_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.json': 'application/json', '.woff2': 'font/woff2' };

let server = null, chrome = null, ws = null, profile = null, msgId = 0;
const waiting = {}, events = [];
let budgetDone = null, vtime = 0;
const journal = [];
const log = (s) => { journal.push(`${new Date().toISOString().slice(11, 19)} ${s}`); if (journal.length > 2000) journal.shift(); };

function serve() {
  if (server) return;
  server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
    const f = path.join(DIST, p); if (!f.startsWith(DIST)) { res.writeHead(403); return res.end(); }
    fs.readFile(f, (err, data) => { if (err) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); res.end(data); });
  }).listen(PORT, '127.0.0.1');
}
const send = (method, params = {}) => new Promise((r) => { const i = ++msgId; waiting[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
async function js(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
  if (r.result && r.result.exceptionDetails) { const d = r.result.exceptionDetails; throw new Error((d.exception && d.exception.description) || d.text); }
  return r.result && r.result.result && r.result.result.value;
}
// run the page's clock forward ms of virtual time
const step = (ms) => new Promise((r) => { budgetDone = r; vtime += ms; send('Emulation.setVirtualTimePolicy', { policy: 'advance', budget: ms }); });

async function launch() {
  serve();
  fs.mkdirSync(profile, { recursive: true });
  chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${profile}`, '--hide-scrollbars', '--mute-audio', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
  let targets; for (let i = 0; i < 60; i++) { try { targets = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json`)).json(); if (targets.length) break; } catch (e) {} await sleep(250); }
  const page = targets.find((t) => t.type === 'page');
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.id && waiting[d.id]) { waiting[d.id](d); delete waiting[d.id]; return; }
    if (d.method === 'Emulation.virtualTimeBudgetExpired' && budgetDone) { const f = budgetDone; budgetDone = null; f(); }
    if (d.method === 'Runtime.exceptionThrown') events.push('exception: ' + ((d.params.exceptionDetails.exception || {}).description || d.params.exceptionDetails.text).slice(0, 300));
  });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: PAGE.hook });
}

// the profile (and so the characters) survives between starts; fresh empties it first
async function start(o = {}) {
  if (ws) { stop(); await sleep(1500); }
  profile = process.env.PT_PROFILE || path.join(os.tmpdir(), 'azplaytest-profile');
  if (o.fresh) fs.rmSync(profile, { recursive: true, force: true });
  await launch();
  // load on real time (fonts, audio decode), then freeze the clock: from here the game only moves when we say
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` }); await sleep(4000);
  await ensureLib();
  await send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
  await step(500);
  log(`start${o.fresh ? ' (fresh)' : ''}`);
  return look();
}

// the in-page helpers are read fresh each time, so an edit to page.js applies without restarting
async function ensureLib() { delete require.cache[require.resolve('./page.js')]; await js(require('./page.js').lib); }


function fmtState(s) {
  if (!s) return '';
  return `Lv ${s.lvl} (${s.xp}/${s.xpNeed} xp) · hp ${s.hp} · res ${s.res} · ${s.money}c · ${s.place}${s.fight ? ' · IN FIGHT' : ''}${s.run ? ' · in a run' : ''}${s.travel ? ' · travelling' : ''}${s.dead ? ' · DEAD' : ''} · ${s.quests} quests`;
}

async function look(o = {}) {
  await ensureLib();
  const L = await js(`window.__pt.look(${JSON.stringify(o)})`);
  const s = await js('window.__pt.state()');
  const head = s ? fmtState(s) : '(no character in the world)';
  const errs = events.splice(0);
  return [head, ...(errs.length ? ['!! ' + errs.join('\n!! ')] : []), '---', ...L.lines, ...(L.extra ? ['(' + L.extra + ')'] : [])].join('\n');
}

async function tap(q, o = {}) {
  await ensureLib();
  const before = await js('window.__pt.sig()');
  const info = await js(`(() => { const el = window.__pt.target(${JSON.stringify(q)}); if (!el) return null;
    el.scrollIntoView({ block: 'nearest' }); const r = el.getBoundingClientRect(); const rc = window.__pt.reach(el);
    return { label: window.__pt.label(el).slice(0, 60), x: rc.x, y: rc.y, top: rc.top, on: rc.on }; })()`);
  if (!info) return `no control matches "${q}" (look again: ids change with the screen)`;
  if (!info.on || !info.top) return `"${info.label}" can't be reached by a finger: ${!info.on ? 'off screen' : 'covered by another element'}`;
  // a real tap: touch at the centre, then the click the browser makes of it
  const pt = { x: info.x, y: info.y };
  // input waits for a rendered frame, and frames only come when the clock runs: send, then run the clock, then collect
  const sent = [send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...pt }),
    send('Input.dispatchMouseEvent', { type: 'mousePressed', ...pt, button: 'left', clickCount: 1 }),
    send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...pt, button: 'left', clickCount: 1 })];
  await step(o.wait != null ? o.wait * 1000 : 1200); // sheets slide in: let them land
  await Promise.race([Promise.all(sent), sleep(3000)]);
  const after = await js('window.__pt.sig()');
  log(`tap ${q} "${info.label}"${before === after ? ' (no change)' : ''}`);
  const note = before === after ? `!! tapped "${info.label}" and nothing on screen changed\n` : `tapped "${info.label}"\n`;
  return note + await look();
}

// stop conditions checked between chunks: a new dialog, sheet or cutscene, a level-up, the fight ending, death
async function advance(sec, o = {}) {
  await ensureLib();
  const until = o.until || 'any';
  const snap = () => js(`(() => { const G = window.G, P = G && G.S && G.S.player; return { lvl: P && P.level, fight: !!(G && G.fight), dead: !!(P && P.ghostUntil),
    layer: document.querySelectorAll('.dialog, .cs, .sheet, .toast-big, .levelup').length, travel: !!(P && P.travel) }; })()`);
  const a = await snap(); let ran = 0, why = 'time';
  const chunk = Math.min(5000, sec * 1000);
  while (ran < sec * 1000) {
    await step(Math.min(chunk, sec * 1000 - ran)); ran += chunk;
    const b = await snap();
    if (until === 'none') continue;
    if (b.lvl !== a.lvl) { why = `level ${b.lvl}`; break; }
    if (b.dead && !a.dead) { why = 'died'; break; }
    if (a.fight && !b.fight) { why = 'fight over'; break; }
    if (!a.fight && b.fight && until !== 'time') { why = 'fight started'; break; }
    if (a.travel && !b.travel) { why = 'arrived'; break; }
    if (b.layer > a.layer && until !== 'time') { why = 'something opened'; break; }
  }
  log(`advance ${sec}s → ${Math.round(ran / 1000)}s (${why})`);
  return `advanced ${Math.round(ran / 1000)} s (${why})\n` + await look();
}

async function check() {
  await ensureLib();
  const r = await js('window.__pt.check()');
  const errs = events.splice(0).map((m) => ({ k: 'error', m }));
  const all = [...errs, ...r];
  log(`check: ${all.length ? all.map((x) => x.k).join(',') : 'clean'}`);
  return all.length ? all.map((x) => `- [${x.k}] ${x.m}${x.ex ? ' (e.g. ' + x.ex + ')' : ''}`).join('\n') : 'clean: no errors, bad text, overflow, small targets or spoilers on this screen';
}

async function shot(scale = 0.5, file) {
  const r = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 375, height: 812, scale } });
  const out = file || path.join(os.tmpdir(), `playtest-${Date.now()}.png`);
  fs.writeFileSync(out, Buffer.from(r.result.data, 'base64'));
  log(`shot ${out}`);
  return { file: out, data: r.result.data };
}

async function evaluate(expr) {
  await ensureLib();
  const v = await js(`(() => { ${/\breturn\b/.test(expr) ? expr : 'return (' + expr + ')'} })()`);
  log(`eval ${expr.slice(0, 80)}`);
  return typeof v === 'string' ? v : JSON.stringify(v, null, 1);
}

async function scroll(dir = 'down', q) {
  await ensureLib();
  await js(`(() => { const t = ${q ? `window.__pt.target(${JSON.stringify(q)})` : 'null'};
    let el = t || document.elementFromPoint(innerWidth / 2, innerHeight / 2);
    for (; el && el !== document.body; el = el.parentElement) { const s = getComputedStyle(el); if (/(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight) break; }
    const box = el && el !== document.body ? el : document.scrollingElement; box.scrollBy(0, ${dir === 'up' ? -1 : 1} * box.clientHeight * 0.8); })()`);
  await step(200);
  return look();
}

// autoplay until a level, an amount of game time, or something that needs a human: one decision, then the clock runs.
// The checks run every game minute and every new finding is kept; the result is a summary, not a transcript.
async function autoplay(o = {}) {
  await ensureLib();
  const toLvl = o.level || 0, maxSec = (o.minutes || 60) * 60, t0 = vtime;
  const acts = [], found = new Map();
  let reason = 'time', lastCheck = vtime, last = '', rep = 0;
  const lv0 = await js('G.S && G.S.player ? G.S.player.level : 0');
  await js('window.__ptFrameMs = 200'); // 5 frames a game second is plenty for the game's 0.1 s fight steps (each frame catches up)
  while ((vtime - t0) / 1000 < maxSec) {
    let r;
    try { r = await js(`window.__pt.autoStep(${JSON.stringify(o)})`); } catch (e) { reason = 'page error in autoplay: ' + e.message.slice(0, 200); break; }
    if (!r) { reason = 'no answer'; break; }
    if (r.stop) { reason = r.stop; break; }
    if (r.act !== last) { if (rep > 1) acts.push(`   (×${rep})`); acts.push(r.act); last = r.act; rep = 1; } else rep++;
    if (acts.length > 400) acts.splice(0, 100);
    await step((r.wait || 1) * 1000);
    if (vtime - lastCheck >= 60000) {
      lastCheck = vtime;
      // one entry per finding, whatever its numbers (a name's width changes as it scrolls)
      for (const x of await js('window.__pt.check()')) { const key = x.k + x.m.replace(/\d+/g, '#'); if (!found.has(key)) found.set(key, { ...x, at: await js('G.S.player.level') }); }
      for (const m of events.splice(0)) if (!found.has('error' + m)) found.set('error' + m, { k: 'error', m, at: '?' });
    }
    if (toLvl && (await js('G.S && G.S.player ? G.S.player.level : 0')) >= toLvl) { reason = `reached level ${toLvl}`; break; }
  }
  for (const m of events.splice(0)) found.set('error' + m, { k: 'error', m, at: '?' });
  await js('window.__ptFrameMs = 50');
  const st = await js('JSON.stringify(window.__ptStats || {})').then(JSON.parse);
  const lv = await js('G.S && G.S.player ? G.S.player.level : 0');
  const mins = (vtime - t0) / 60000;
  log(`autoplay ${mins.toFixed(1)} game min, level ${lv0} → ${lv} (${reason})`);
  const out = [
    `autoplay: ${mins.toFixed(1)} game minutes, level ${lv0} → ${lv}, stopped: ${reason}`,
    `fights ${st.fights || 0} (won ${st.won || 0}, died ${st.deaths || 0}), ${st.fights ? (st.secs / Math.max(1, st.won + st.deaths)).toFixed(1) : 0} s a fight · quests turned in ${st.quests || 0} · resting ${Math.round((st.restSecs || 0) / 60)} min · upgrades worn ${st.equipped || 0} · bags nearly full ${st.bagsFull || 0}×`,
    st.beats || st.early || st.finales ? `songs: ${st.beats} beats landed, ${st.early} early taps, ${st.finales} Finales` : '',
    found.size ? 'findings:\n' + [...found.values()].map((x) => `- [${x.k}] (lv ${x.at}) ${x.m}${x.ex ? ' (e.g. ' + x.ex + ')' : ''}`).join('\n') : 'findings: none',
    st.tips && st.tips.length ? 'tips seen: ' + st.tips.length : '',
    st.scenes && st.scenes.length ? 'cutscenes skipped: ' + st.scenes.join(' | ') : '',
    st.notes && st.notes.length ? 'notes:\n- ' + [...new Set(st.notes)].slice(-8).join('\n- ') : '',
    'last actions:\n' + acts.slice(-14).join('\n'),
  ].filter(Boolean);
  return out.join('\n') + '\n---\n' + await look();
}

function stop() { try { ws && ws.close(); } catch (e) {} try { chrome && chrome.kill(); } catch (e) {} try { server && server.close(); } catch (e) {} ws = chrome = server = null; return 'stopped'; }

module.exports = { start, look, tap, advance, check, shot, evaluate, scroll, autoplay, stop, journal: () => journal.join('\n') };
