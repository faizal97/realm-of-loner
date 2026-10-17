#!/usr/bin/env node
// The playtest tools from the command line, through a daemon that keeps the browser open between commands.
//   node tools/playtest/pt.js serve            (keep running, e.g. in the background)
//   node tools/playtest/pt.js start --fresh
//   node tools/playtest/pt.js look | tap e3 | tap "Enter World" | advance 30 [any|time|none] | check | scroll down
//   node tools/playtest/pt.js eval "G.S.player.level" | shot [scale] [file] | journal | stop
const http = require('http');
const PORT = +process.env.PT_CTL || 8791;
const [cmd, ...rest] = process.argv.slice(2);

if (cmd === 'serve') {
  const TOOLS = require('./tools.js');
  http.createServer((req, res) => {
    let body = ''; req.on('data', (d) => (body += d));
    req.on('end', async () => {
      const { name, args } = JSON.parse(body || '{}');
      const t = TOOLS.find((x) => x.name === 'pt_' + name);
      let text;
      try { const r = t ? await t.run(args || {}) : 'no command ' + name; text = t && t.image ? 'saved ' + r.file : String(r); }
      catch (e) { text = 'error: ' + (e && e.message || e); }
      res.end(text);
    });
  }).listen(PORT, '127.0.0.1', () => console.log('playtest daemon on ' + PORT));
} else {
  const a = {};
  if (cmd === 'start') a.fresh = rest.includes('--fresh');
  if (cmd === 'look') a.all = rest.includes('--all');
  if (cmd === 'tap') { a.target = rest[0]; if (rest[1]) a.wait = +rest[1]; }
  if (cmd === 'advance') { a.seconds = +rest[0]; if (rest[1]) a.until = rest[1]; }
  if (cmd === 'scroll') { a.dir = rest[0] || 'down'; if (rest[1]) a.target = rest[1]; }
  if (cmd === 'eval') a.js = rest.join(' ');
  if (cmd === 'shot') { if (rest[0]) a.scale = +rest[0]; if (rest[1]) a.file = rest[1]; }
  const req = http.request({ host: '127.0.0.1', port: PORT, method: 'POST', path: '/' }, (res) => { let s = ''; res.on('data', (d) => (s += d)); res.on('end', () => console.log(s)); });
  req.on('error', () => { console.log('no daemon: run  node tools/playtest/pt.js serve  first'); process.exit(1); });
  req.end(JSON.stringify({ name: cmd, args: a }));
}
