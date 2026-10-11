// Verifies src/art_lanternwake.js (Lanternwake, v10.13) and the festival set in art.js, and renders contact sheets into
// art/lanternwake/out/: the Snuffed Road scene, the mobs (and Flicker), the icons at 64 and 24 px, the Wickless Steed
// (art_mounts.js), and the set's looks (Normal and Hard) on four bodies beside no look.
// Usage: node art/lanternwake/render.js
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
for (const f of ['art.js', 'art_mounts.js', 'art_lanternwake.js']) vm.runInNewContext(read(f), win);
const A = win.ART;
let problems = 0;
const ok = (k, s) => { if (!/^<svg[\s\S]*<\/svg>$/.test(s) || /NaN|undefined/.test(s)) { problems++; console.log('PROBLEM', k); } return s; };
const img = (s, x, y, w, h) => `<image x="${x}" y="${y}" width="${w}" height="${h}" href="data:image/svg+xml;base64,${Buffer.from(s).toString('base64')}"/>`;
const sheet = (name, W, H, cells, bg) => { const f = path.join(OUT, name + '.svg'); fs.writeFileSync(f, `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="${bg || '#1a1410'}"/>${cells.join('')}</svg>`); execFileSync(RSVG, ['-o', f.replace(/\.svg$/, '.png'), f]); };
// the scene with the Knight and two wisps standing in it, as a fight shows them
{ const sc = ok('snuffed_road', A.scene('snuffed_road'));
  sheet('sheet_scene', 800, 480, [img(sc, 0, 0, 800, 480), img(A.mob('lw_wisp'), 380, 250, 150, 150), img(A.mob('lw_wisp'), 470, 290, 130, 130), img(A.mob('wickless_knight'), 560, 200, 230, 230)]); }
const MOBS = ['lw_wisp', 'flicker', 'lw_ghost', 'wickless_knight'];
sheet('sheet_mobs', MOBS.length * 136 + 8, 144, MOBS.map((k, i) => img(ok(k, A.mob(k)), 8 + i * 136, 8, 128, 128)), '#3a4a6a');
const ICONS = ['lw_candle', 'lw_costume', 'lw_treat', 'lw_robe', 'lw_trousers', 'lw_lantern', 'companion_flicker', 'event_lanternwake', 'mount_wickless_steed'];
for (const px of [64, 24]) { const gap = px >= 48 ? 8 : 4; sheet(`sheet_icons_${px}`, ICONS.length * (px + gap) + gap, px + 2 * gap, ICONS.map((k, i) => img(ok(k, A.icon(k)), gap + i * (px + gap), gap, px, px))); }
sheet('sheet_steed', 336, 136, [img(ok('wickless_steed', A.mount('wickless_steed')), 8, 4, 160, 128), img(A.mount('skeletal_horse'), 172, 4, 160, 128)], '#3a4a6a');
// the set on four bodies: none, Normal, Hard
const SETS = [{}, { chest: 'lw_robe', legs: 'lw_trousers', back: 'lw_lantern' }, { chest: 'lw_robe_hard', legs: 'lw_trousers_hard', back: 'lw_lantern_hard' }];
const BODIES = [['human', 'mage', 'm'], ['orc', 'warrior', 'm'], ['nightelf', 'priest', 'f'], ['dwarf', 'paladin', 'm']];
{ const px = 128, cells = [];
  BODIES.forEach(([race, cls, gender], i) => SETS.forEach((gear, j) => cells.push(img(ok('look ' + race, A.hero({ cls, race, skin: 0, hair: 0, gender, gear })), j * (px + 4), i * (px + 4), px, px))));
  sheet('sheet_looks', SETS.length * (px + 4), BODIES.length * (px + 4), cells, '#2a2218'); }
console.log(problems ? `${problems} problem(s)` : 'OK: 0 problems (art/lanternwake/out/sheet_scene.png, sheet_mobs.png, sheet_icons_64.png, sheet_icons_24.png, sheet_steed.png, sheet_looks.png)');
