// Verifies src/art_honor.js (Honor rank insignia, #57: 8 per faction, plus the tabard and war banner look icons) and
// renders contact sheets into art/honor/out/: every key at 64 px, and again at 24 px (the size a party frame shows).
// Usage: node art/honor/render.js
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
vm.runInNewContext(read('art_honor.js'), win);
const KEYS = [];
for (const f of ['alliance', 'horde']) { for (let n = 1; n <= 8; n++) KEYS.push(`honor_${f}_${n}`); KEYS.push(`honor_tabard_${f}`, `honor_banner_${f}`); }
let problems = 0;
for (const k of KEYS) { const s = win.ART.icon(k); if (!/^<svg[\s\S]*<\/svg>$/.test(s) || /NaN|undefined/.test(s)) { problems++; console.log('PROBLEM', k); } }
for (const px of [64, 24]) {
  const cols = 10, gap = px >= 48 ? 8 : 4, rows = Math.ceil(KEYS.length / cols), W = cols * (px + gap) + gap, H = rows * (px + gap) + gap;
  const cells = KEYS.map((k, i) => { const x = gap + (i % cols) * (px + gap), y = gap + Math.floor(i / cols) * (px + gap);
    return `<image x="${x}" y="${y}" width="${px}" height="${px}" href="data:image/svg+xml;base64,${Buffer.from(win.ART.icon(k)).toString('base64')}"/>`; }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="#1a1410"/>${cells}</svg>`;
  const f = path.join(OUT, `sheet_${px}.svg`); fs.writeFileSync(f, svg);
  execFileSync(RSVG, ['-o', f.replace(/\.svg$/, '.png'), f]);
}
console.log(problems ? `${problems} problem(s)` : `OK: ${KEYS.length} icons, 0 problems (art/honor/out/sheet_64.png, sheet_24.png)`);
process.exit(problems ? 1 : 0);
