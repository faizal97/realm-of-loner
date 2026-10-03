// Verifies src/art_honor.js (Honor rank insignia, #57: 8 per faction, plus the tabard and war banner look icons) and
// renders contact sheets into art/honor/out/: every key at 64 px, and again at 24 px (the size a party frame shows), and
// the six rank looks on the back (art.js) on four bodies, beside no look (sheet_looks.png).
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
// the rank looks on the back (art.js GBACK honor_<faction>_<tabard|cloak|banner>): no look, then the six, on four bodies
const LOOKS = ['', 'honor_alliance_tabard', 'honor_alliance_cloak', 'honor_alliance_banner', 'honor_horde_tabard', 'honor_horde_cloak', 'honor_horde_banner'];
const BODIES = [['human', 'warrior', 'm'], ['orc', 'shaman', 'm'], ['nightelf', 'priest', 'f'], ['dwarf', 'rogue', 'm']];
{ const px = 128, cells = [];
  BODIES.forEach(([race, cls, gender], i) => LOOKS.forEach((k, j) => { const s = win.ART.hero({ cls, race, skin: 0, hair: 0, gender, gear: k ? { back: k } : {} });
    if (/NaN|undefined/.test(s)) { problems++; console.log('PROBLEM look', k, race, cls); }
    cells.push(`<image x="${j * (px + 4)}" y="${i * (px + 4)}" width="${px}" height="${px}" href="data:image/svg+xml;base64,${Buffer.from(s).toString('base64')}"/>`); }));
  const W = LOOKS.length * (px + 4), H = BODIES.length * (px + 4), f = path.join(OUT, 'sheet_looks.svg');
  fs.writeFileSync(f, `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="#2a2218"/>${cells.join('')}</svg>`);
  execFileSync(RSVG, ['-o', f.replace(/\.svg$/, '.png'), f]); }
console.log(problems ? `${problems} problem(s)` : `OK: ${KEYS.length} icons and ${LOOKS.length - 1} looks on ${BODIES.length} bodies, 0 problems (art/honor/out/sheet_64.png, sheet_24.png, sheet_looks.png)`);
process.exit(problems ? 1 : 0);
