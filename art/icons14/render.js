// Verifies src/art_icons14.js (the ten class interrupts, #179) and renders contact sheets into art/icons14/out/:
// the new icons at 128/64/40 px, and one row per class with its interrupt first and then that class's other ability
// icons at action-bar size, so a look-alike shows up.
// Usage: node art/icons14/render.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(__dirname, 'out');
const RSVG = '/opt/homebrew/bin/rsvg-convert';
fs.mkdirSync(OUT, { recursive: true });
const read = f => fs.readFileSync(path.join(ROOT, 'src', f), 'utf8');
const exists = f => fs.existsSync(path.join(ROOT, 'src', f));
// every pack that defines icons and loads before this one (build.py order: art.js, art_icons2..13, art_mounts.js, art_classes.js, art_legends.js are after but only add class/legend keys)
const PRE = ['art.js'];
for (let n = 2; n <= 13; n++) if (exists('art_icons' + n + '.js')) PRE.push('art_icons' + n + '.js');
for (const f of ['art_mounts.js', 'art_honor.js', 'art_classes.js', 'art_legends.js']) if (exists(f)) PRE.push(f);
const SRC = read('art_icons14.js');
const NEW = ['hilt_bash', 'throat_jab', 'spellbreak', 'hush', 'storm_snap', 'choke_hex', 'pinning_shot', 'stern_word', 'thornlash', 'sour_note'];
const norm = s => String(s).replace(/ id="[^"]+"/g, ' id=""').replace(/url\(#[^)]+\)/g, 'url(#)');
const problems = [];

{ // pack alone on a fake ART: falls through, keeps keys
  const window = { ART: { icon: k => 'BASE_ICON:' + k, keys: { icons: ['x_icon'] } } };
  const ctx = { window }; vm.createContext(ctx); vm.runInContext(SRC, ctx);
  const A = window.ART;
  if (A.icon('elsewhere') !== 'BASE_ICON:elsewhere') problems.push('fake: fall-through broken');
  for (const k of ['toString', 'hasOwnProperty', 'constructor', 'valueOf', '__proto__']) if (A.icon(k) !== 'BASE_ICON:' + k) problems.push('fake: prototype key ' + k);
  if (A.keys.icons[0] !== 'x_icon') problems.push('fake: existing keys lost');
  for (const k of NEW) if (!A.keys.icons.includes(k)) problems.push('fake: key missing ' + k);
}
{ // no ART at all, odd keys, a base that throws
  const window = {}; const ctx = { window }; vm.createContext(ctx); vm.runInContext(SRC, ctx);
  try { for (const bad of [undefined, null, 42, {}, '', 'toString', 'anything']) if (!/^<svg/.test(window.ART.icon(bad))) problems.push('bare: bad key ' + String(bad)); }
  catch (e) { problems.push('bare: threw'); }
  const w2 = { ART: { icon: () => { throw new Error('x'); } } }; const c2 = { window: w2 }; vm.createContext(c2); vm.runInContext(SRC, c2);
  try { if (!/^<svg/.test(w2.ART.icon('elsewhere'))) problems.push('throwing base: no placeholder'); } catch (e) { problems.push('throwing base: threw'); }
}
const window = {}; vm.createContext(window); window.window = window;
for (const f of PRE) { try { vm.runInContext(read(f), window); } catch (e) { problems.push('pre-pack failed: ' + f + ' (' + e.message + ')'); } }
const existing = window.ART.keys.icons.slice();
for (const k of NEW) if (existing.includes(k)) problems.push('key already exists: ' + k);
const probes = existing.filter((_, i) => i % 37 === 0).concat(['nope']);
const before = {}; for (const k of probes) before[k] = norm(window.ART.icon(k));
vm.runInContext(SRC, window);
const ART = window.ART;
for (const k of probes) if (norm(ART.icon(k)) !== before[k]) problems.push('existing icon changed: ' + k);
const out = {}, allIds = new Set();
for (const k of NEW) {
  const s = ART.icon(k);
  if (!/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="0 0 64 64"/.test(s)) problems.push(k + ': bad root');
  if (/NaN|undefined|Infinity|null/.test(s)) problems.push(k + ': NaN/undefined');
  if (/<text|<filter|<image|href=/.test(s)) problems.push(k + ': text/filter/image');
  if (s.indexOf('#5a5a62') >= 0 && s.length < 1500) problems.push(k + ': placeholder (threw?)');
  const ids = [...s.matchAll(/ id="([^"]+)"/g)].map(m => m[1]);
  for (const id of ids) { if (!/^iZ[0-9a-z]+_/.test(id)) problems.push(k + ': bad id ' + id); if (allIds.has(id)) problems.push(k + ': id reused ' + id); allIds.add(id); }
  for (const r of [...s.matchAll(/url\(#([^)]+)\)/g)].map(m => m[1])) if (!ids.includes(r)) problems.push(k + ': dangling ref ' + r);
  out[k] = s; fs.writeFileSync(path.join(OUT, 'icon_' + k + '.svg'), s);
}
function sheet(name, items, cw, cols) {
  const pad = Math.max(6, cw / 8), rows = Math.ceil(items.length / cols); let body = '';
  items.forEach(([k, s], i) => {
    if (!s) return;
    const x = pad + (i % cols) * (cw + pad), y = pad + Math.floor(i / cols) * (cw + pad);
    body += s.replace(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="([^"]+)" width="[^"]+" height="[^"]+">/, `<svg x="${x}" y="${y}" width="${cw}" height="${cw}" viewBox="$1">`);
  });
  const Wd = pad + cols * (cw + pad), H = pad + rows * (cw + pad);
  const p = path.join(OUT, 'sheet_' + name + '.svg');
  fs.writeFileSync(p, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Wd} ${H}" width="${Wd}" height="${H}"><rect width="${Wd}" height="${H}" fill="#1c1a20"/>${body}</svg>`);
  execFileSync(RSVG, ['-w', String(Wd), p, '-o', p.replace(/\.svg$/, '.png')]);
}
const items = NEW.map(k => [k, out[k]]);
sheet('new_128', items, 128, 5); sheet('new_40', items, 40, 10);
// one row per class: the interrupt, then that class's other ability icons (from the game data)
require(path.join(ROOT, 'src', 'data.js')); const D = globalThis.D;
const rows = [], COLS = 12;
for (const cls of Object.keys(D.INTERRUPTS)) {
  const row = [[D.INTERRUPTS[cls], out[D.INTERRUPTS[cls]]]];
  for (const id of D.CLASSES[cls].abilities) { const a = D.ABILITIES[id]; if (id !== D.INTERRUPTS[cls] && row.length < COLS) row.push([id, ART.icon(a.icon || id)]); }
  while (row.length < COLS) row.push(['', null]);
  rows.push(...row);
}
sheet('classes_40', rows, 40, COLS);
console.log(problems.length ? 'PROBLEMS:\n' + problems.join('\n') : 'ok: ' + NEW.length + ' icons, sheets in art/icons14/out/');
process.exitCode = problems.length ? 1 : 0;
