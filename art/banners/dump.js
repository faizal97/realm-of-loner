// Draws existing game art to SVG files for art/banners/banners.py: node art/banners/dump.js <out dir> <spec.json>
// spec: [[file, kind, arg], ...] with kind scene | story | mob | hero | icon (arg: a key, or hero options).
// Loads the art packs in build.py's order, so a banner is drawn from exactly what the game draws.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..', '..');
const py = fs.readFileSync(path.join(ROOT, 'build.py'), 'utf8');
const files = [...py.matchAll(/'src\/(art[_a-z0-9]*\.js)'/g)].map((m) => m[1]).filter((f, i, a) => a.indexOf(f) === i && f !== 'art_banners.js');
const w = { console }; w.window = w; w.globalThis = w; vm.createContext(w);
for (const f of files) vm.runInContext(fs.readFileSync(path.join(ROOT, 'src', f), 'utf8'), w, { filename: f });
const [out, spec] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
for (const [file, kind, arg] of JSON.parse(fs.readFileSync(spec, 'utf8'))) {
  const A = w.ART;
  const svg = kind === 'story' ? A.story.scene(arg) : kind === 'actor' ? A.story.actor(arg) : A[kind](arg);
  if (!svg) throw new Error(`no ${kind} art for ${JSON.stringify(arg)}`);
  fs.writeFileSync(path.join(out, file), svg);
}
console.log('drew', JSON.parse(fs.readFileSync(spec, 'utf8')).length, 'pieces from', files.length, 'art files');
