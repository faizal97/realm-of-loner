// Verifies src/art_classes.js (class crests, #231) and renders contact sheets into art/classes/out/: every crest at 64 px
// and again at 24 px (the size a list row shows).
// Usage: node art/classes/render.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(__dirname, 'out');
const RSVG = '/opt/homebrew/bin/rsvg-convert';
fs.mkdirSync(OUT, { recursive: true });
const read = (f) => fs.readFileSync(path.join(ROOT, 'src', f), 'utf8');
const win = {}; win.window = win;
vm.runInNewContext(read('art.js'), win);
vm.runInNewContext(read('art_classes.js'), win);
const KEYS = ['warrior', 'mage', 'priest', 'rogue', 'paladin', 'warlock', 'hunter', 'druid', 'shaman', 'bard'].map((c) => 'class_' + c);
let problems = 0;
for (const k of KEYS) { const s = win.ART.icon(k); if (!/^<svg[\s\S]*<\/svg>$/.test(s) || /NaN|undefined/.test(s)) { problems++; console.log('PROBLEM', k); } }
for (const px of [64, 24]) {
  const cols = 10, gap = px >= 48 ? 8 : 4, W = cols * (px + gap) + gap, H = px + 2 * gap;
  const cells = KEYS.map((k, i) => `<image x="${gap + i * (px + gap)}" y="${gap}" width="${px}" height="${px}" href="data:image/svg+xml;base64,${Buffer.from(win.ART.icon(k)).toString('base64')}"/>`).join('');
  const f = path.join(OUT, `sheet_${px}.svg`);
  fs.writeFileSync(f, `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="#1a1410"/>${cells}</svg>`);
  execFileSync(RSVG, ['-o', f.replace(/\.svg$/, '.png'), f]);
}
console.log(problems ? `${problems} problem(s)` : `OK: ${KEYS.length} crests, 0 problems (art/classes/out/sheet_64.png, sheet_24.png)`);
