// Verifies src/art_longnight.js (Longnight, v10.17) and the festival set in art.js, and renders contact sheets into
// art/longnight/out/: the two scenes with their creatures standing in them, the mobs (and Snowtuft), the icons at 64 and
// 24 px, the town overlay's five stages over two capitals, the Frost Hound and Pale Stag (art_mounts.js), and the set's
// looks (Normal, Hard and Pale) on four bodies beside no look.
// Usage: node art/longnight/render.js
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
// every art pack, art.js first (as tools/validate.js loads them), so the town scenes are the real ones
for (const f of fs.readdirSync(path.join(ROOT, 'src')).filter((f) => /^art.*\.js$/.test(f) && f !== 'art_story.js').sort((a, b) => (a === 'art.js' ? -1 : b === 'art.js' ? 1 : a < b ? -1 : 1))) vm.runInNewContext(read(f), win);
const A = win.ART;
let problems = 0;
const ok = (k, s) => { if (!/^<svg[\s\S]*<\/svg>$/.test(s) || /NaN|undefined/.test(s)) { problems++; console.log('PROBLEM', k); } return s; };
const img = (s, x, y, w, h) => `<image x="${x}" y="${y}" width="${w}" height="${h}" href="data:image/svg+xml;base64,${Buffer.from(s).toString('base64')}"/>`;
const sheet = (name, W, H, cells, bg) => { const f = path.join(OUT, name + '.svg'); fs.writeFileSync(f, `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="${bg || '#1a1410'}"/>${cells.join('')}</svg>`); execFileSync(RSVG, ['-o', f.replace(/\.svg$/, '.png'), f]); };
// every key must be registered
for (const [kind, keys] of Object.entries({
  scenes: ['shuttered_lane', 'open_door'],
  mobs: ['ln_frost_hound', 'ln_frostling', 'ln_snowman', 'ln_knocker', 'ln_uninvited', 'ln_cold_guest', 'snowtuft'],
  mounts: ['frost_hound', 'pale_stag'],
})) for (const k of keys) if (!(A.keys[kind] || []).includes(k)) { problems++; console.log('PROBLEM not in ART.keys.' + kind, k); }
// the scenes, with their creatures standing in them as a fight shows them
{ const sc = ok('shuttered_lane', A.scene('shuttered_lane'));
  sheet('sheet_scene_lane', 800, 480, [img(sc, 0, 0, 800, 480), img(A.mob('ln_frost_hound'), 380, 270, 150, 150), img(A.mob('ln_frost_hound'), 470, 300, 130, 130), img(A.mob('ln_knocker'), 560, 200, 230, 230)]); }
{ const sc = ok('open_door', A.scene('open_door'));
  sheet('sheet_scene_door', 800, 480, [img(sc, 0, 0, 800, 480), img(A.mob('ln_uninvited'), 330, 260, 150, 150), img(A.mob('ln_uninvited'), 430, 290, 130, 130), img(A.mob('ln_cold_guest'), 540, 180, 250, 250)]); }
const MOBS = ['ln_frost_hound', 'ln_frostling', 'ln_snowman', 'ln_knocker', 'ln_uninvited', 'ln_cold_guest', 'snowtuft'];
sheet('sheet_mobs', MOBS.length * 136 + 8, 144, MOBS.map((k, i) => img(ok(k, A.mob(k)), 8 + i * 136, 8, 128, 128)), '#3a4a6a');
// Snowtuft small, as the UI shows a companion
sheet('sheet_snowtuft_small', 4 * 56 + 8, 64, [48, 40, 32, 24].map((px, i) => img(A.mob('snowtuft'), 8 + i * 56, 8, px, px)), '#2a2218');
const ICONS = ['ln_kindling', 'ln_snowball', 'ln_cocoa', 'ln_garland', 'ln_fireworks', 'ln_costume', 'ln_stew', 'ln_coat', 'ln_trousers', 'ln_cloak',
  'companion_snowtuft', 'event_longnight', 'ln_door', 'ln_door_open', 'ln_hearth', 'ln_snow_throw', 'ln_snow_pack', 'ln_snow_duck', 'ln_snow_boulder',
  'mount_frost_hound', 'mount_pale_stag'];
for (const k of ICONS) if (!(A.keys.icons || []).includes(k)) { problems++; console.log('PROBLEM not in ART.keys.icons', k); }
for (const px of [64, 24]) { const gap = px >= 48 ? 8 : 4, per = 11, rows = Math.ceil(ICONS.length / per);
  sheet(`sheet_icons_${px}`, per * (px + gap) + gap, rows * (px + gap) + gap, ICONS.map((k, i) => img(ok(k, A.icon(k)), gap + (i % per) * (px + gap), gap + Math.floor(i / per) * (px + gap), px, px))); }
// the town overlay's five stages, over Stormwind and Orgrimmar
{ const cells = [];
  ['stormwind', 'orgrimmar'].forEach((town, row) => { const sc = A.scene(town); for (let st = 0; st <= 4; st++) cells.push(img(sc, st * 404, row * 244, 400, 240), img(ok('lnTown ' + st, A.lnTown(st)), st * 404, row * 244, 400, 240)); });
  sheet('sheet_town', 5 * 404, 2 * 244, cells); }
if (!/^<svg[\s\S]*<\/svg>$/.test(A.lnTown('x')) || !/^<svg[\s\S]*<\/svg>$/.test(A.lnTown(99))) { problems++; console.log('PROBLEM lnTown bad stage'); }
sheet('sheet_mounts', 3 * 164 + 8, 136, [img(ok('frost_hound', A.mount('frost_hound')), 8, 4, 160, 128), img(ok('pale_stag', A.mount('pale_stag')), 172, 4, 160, 128), img(A.mount('wolf'), 336, 4, 160, 128)], '#3a4a6a');
// the mounts with a rider, as the game draws them (hero first, the mount on top)
{ const hero = A.hero({ cls: 'warrior', race: 'human', skin: 0, hair: 0, gender: 'm', gear: {} });
  const ride = (m, x) => [img(hero, x + 33.6 * 1.5, 12.8 * 1.5, 128 * 0.6 * 1.5, 128 * 0.6 * 1.5), img(A.mount(m), x, 0, 240, 192)];
  sheet('sheet_mounts_ridden', 2 * 248 + 8, 196, [...ride('frost_hound', 4), ...ride('pale_stag', 252)], '#3a4a6a'); }
// the set on four bodies: none, Normal, Hard (the Knocker's colours), Pale (the Cold Guest's)
const SETS = [{}, { chest: 'ln_coat', legs: 'ln_trousers', back: 'ln_cloak' }, { chest: 'ln_coat_hard', legs: 'ln_trousers_hard', back: 'ln_cloak_hard' }, { chest: 'ln_coat_pale', legs: 'ln_trousers_pale', back: 'ln_cloak_pale' }];
const BODIES = [['human', 'mage', 'm'], ['orc', 'warrior', 'm'], ['nightelf', 'priest', 'f'], ['dwarf', 'paladin', 'm'], ['undead', 'rogue', 'f']];
{ const px = 128, cells = [];
  BODIES.forEach(([race, cls, gender], i) => SETS.forEach((gear, j) => cells.push(img(ok('look ' + race, A.hero({ cls, race, skin: 0, hair: 0, gender, gear })), j * (px + 4), i * (px + 4), px, px))));
  sheet('sheet_looks', SETS.length * (px + 4), BODIES.length * (px + 4), cells, '#2a2218'); }
console.log(problems ? `${problems} problem(s)` : 'OK: 0 problems (art/longnight/out/sheet_scene_lane.png, sheet_scene_door.png, sheet_mobs.png, sheet_snowtuft_small.png, sheet_icons_64.png, sheet_icons_24.png, sheet_town.png, sheet_mounts.png, sheet_mounts_ridden.png, sheet_looks.png)');
