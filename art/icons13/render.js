// Verifies src/art_icons13.js (Artisan tier: duskiron and moonsilver ore and bars, deepstone, four herbs, hardhide leather,
// duskweave cloth and bolt, four fish, a marbled haunch, nine dishes, three flasks, a whetstone, an armour kit, two bags and
// the nine skill-300 keepsakes, plus 6 gathering nodes for ART.node) and renders contact sheets into art/icons13/out/.
// Usage: node art/icons13/render.js
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
// every icon-defining pack that loads before this one: art.js, art_icons2..12 (if present), art_mounts.js
const PRE = ['art.js'];
for (let n = 2; n <= 12; n++) if (exists('art_icons' + n + '.js')) PRE.push('art_icons' + n + '.js');
if (exists('art_mounts.js')) PRE.push('art_mounts.js');
const SRC = read('art_icons13.js');

const NEW = ['duskiron_ore', 'duskiron_bar', 'moonsilver_ore', 'moonsilver_bar', 'deepstone',
  'cinderbloom', 'gloomcap', 'sunveil', 'frostpetal', 'hardhide_leather', 'duskweave_cloth', 'duskweave_bolt',
  'ashgill_bass', 'frostscale_herring', 'thunderhead_marlin', 'starlit_koi', 'marbled_haunch',
  'ashgill_fillet', 'roast_haunch', 'herring_pie', 'smokehouse_stew', 'spiced_haunch', 'trail_skewer', 'marlin_steak', 'koi_banquet', 'long_table_feast',
  'flask_iron_wall', 'flask_warpath', 'flask_stillmind', 'deepstone_whetstone', 'hardhide_armor_kit', 'bag_duskweave', 'bag_starweave', 'bag_gatherer', 'bag_forager',
  'deepdelvers_pick', 'herbwise_satchel', 'hide_hunters_pelt', 'master_smiths_hammer', 'tanners_rolled_hides', 'weavers_spindle',
  'alchemists_bandolier', 'chefs_stewpot', 'anglers_rod', 'battleground'];
// each new icon next to the 3 existing icons it is most likely to be confused with
const COMPARE = [
  ['bag_gatherer', 'bag_wool', 'bag_linen', 'copper_ore'], ['bag_forager', 'bag_wool', 'peacebloom', 'bag_linen'],
  ['battleground', 'sword', 'hearthstone', 'journal'],
  ['duskiron_ore', 'iron_ore', 'embersilver_ore', 'silver_ore'], ['duskiron_bar', 'iron_bar', 'steel_bar', 'silver_bar'],
  ['moonsilver_ore', 'silver_ore', 'tin_ore', 'embersilver_ore'], ['moonsilver_bar', 'silver_bar', 'steel_bar', 'embersilver_bar'],
  ['deepstone', 'heavy_stone', 'weightstone', 'coarse_stone'],
  ['cinderbloom', 'redmantle', 'briarthorn', 'peacebloom'], ['gloomcap', 'dimleaf', 'moss', 'bruiseweed'],
  ['sunveil', 'goldspur', 'peacebloom', 'hermits_beard'], ['frostpetal', 'rimeleaf', 'mageroyal', 'silverleaf'],
  ['hardhide_leather', 'thick_leather', 'heavy_leather', 'light_hide'], ['duskweave_cloth', 'wool_cloth', 'silk_cloth', 'chest_cloth'],
  ['duskweave_bolt', 'silk_bolt', 'wool_bolt', 'linen_bolt'],
  ['ashgill_bass', 'greyscale_cod', 'reedback_perch', 'ironjaw_catfish'], ['frostscale_herring', 'silverfin_minnow', 'greyscale_cod', 'glimmerscale'],
  ['thunderhead_marlin', 'stormback_tuna', 'whiskered_pike', 'lightning_bolt'], ['starlit_koi', 'glimmerscale', 'mudbelly_carp', 'duskglass_ray'],
  ['marbled_haunch', 'meat', 'thick_steak', 'rib'],
  ['ashgill_fillet', 'spiced_pike', 'smoked_cod', 'grilled_minnow'], ['roast_haunch', 'roast_lean_meat', 'meat', 'eat'],
  ['herring_pie', 'bread', 'carp_stew', 'eat'], ['smokehouse_stew', 'hunters_stew', 'catfish_gumbo', 'carp_stew'],
  ['spiced_haunch', 'peppered_steak', 'roast_lean_meat', 'meat'], ['trail_skewer', 'meat_skewer', 'saltfin_skewer', 'rib'],
  ['marlin_steak', 'stormback_tuna_steak', 'peppered_steak', 'thick_steak'], ['koi_banquet', 'duskglass_feast', 'glimmerscale_supper', 'grilled_minnow'],
  ['long_table_feast', 'duskglass_feast', 'eat', 'keg'],
  ['flask_iron_wall', 'elixir_gold', 'potion_red', 'sturdy_vial'], ['flask_warpath', 'potion_red', 'elixir_gold', 'prof_alchemy'],
  ['flask_stillmind', 'potion_blue', 'elixir_green', 'sturdy_vial'],
  ['deepstone_whetstone', 'sharpening_stone', 'weightstone', 'heavy_stone'], ['hardhide_armor_kit', 'armor_kit', 'chest_leather', 'thick_leather'],
  ['bag_duskweave', 'bag_wool', 'bag_linen', 'cooking_spices'], ['bag_starweave', 'bag_wool', 'bag_linen', 'silk_cloth'],
  ['deepdelvers_pick', 'prof_mining', 'axe', 'mace'], ['herbwise_satchel', 'prof_herbalism', 'bag_wool', 'journal'],
  ['hide_hunters_pelt', 'cloak', 'pelt', 'prof_skinning'], ['master_smiths_hammer', 'prof_blacksmithing', 'hammer_justice', 'mace'],
  ['tanners_rolled_hides', 'thick_leather', 'prof_leatherworking', 'heavy_leather'], ['weavers_spindle', 'prof_tailoring', 'fine_thread', 'coarse_thread'],
  ['alchemists_bandolier', 'prof_alchemy', 'belt', 'sturdy_vial'], ['chefs_stewpot', 'prof_cooking', 'keg', 'hunters_stew'],
  ['anglers_rod', 'prof_fishing', 'staff', 'bow']];
// gathering nodes (ART.node, 96x96): each new node next to the 3 existing nodes it is most likely to be confused with
const NEW_NODES = ['duskiron', 'moonsilver', 'cinderbloom', 'gloomcap', 'sunveil', 'frostpetal'];
const NODE_COMPARE = [
  ['duskiron', 'iron', 'silver', 'embersilver'], ['moonsilver', 'silver', 'tin', 'iron'],
  ['cinderbloom', 'redmantle', 'briarthorn', 'peacebloom'], ['gloomcap', 'dimleaf', 'bruiseweed', 'earthroot'],
  ['sunveil', 'goldspur', 'peacebloom', 'hermits_beard'], ['frostpetal', 'rimeleaf', 'mageroyal', 'silverleaf']];
// ids differ per call (counters), so compare icons with ids blanked
const norm = s => String(s).replace(/ id="[^"]+"/g, ' id=""').replace(/url\(#[^)]+\)/g, 'url(#)');
const problems = [];

// ---- 1. pack alone on a fake ART ----
{
  const window = { ART: { icon: k => 'BASE_ICON:' + k, keys: { icons: ['x_icon'] } } };
  const ctx = { window }; vm.createContext(ctx); vm.runInContext(SRC, ctx);
  const A = window.ART;
  if (A.icon('elsewhere') !== 'BASE_ICON:elsewhere') problems.push('fake: fall-through broken');
  for (const k of ['toString', 'hasOwnProperty', 'constructor', 'valueOf', '__proto__'])
    if (A.icon(k) !== 'BASE_ICON:' + k) problems.push('fake: prototype key not falling through ' + k);
  if (A.keys.icons[0] !== 'x_icon') problems.push('fake: existing keys lost');
  for (const k of NEW) if (!A.keys.icons.includes(k)) problems.push('fake: key missing ' + k);
  if (!Array.isArray(A.keys.nodes)) problems.push('fake: no node keys');
  else for (const k of NEW_NODES) if (!A.keys.nodes.includes(k)) problems.push('fake: node key missing ' + k);
}
// ---- 1b. pack on a fake ART that already has nodes ----
{
  const window = { ART: { icon: k => 'BASE_ICON:' + k, node: k => 'BASE_NODE:' + k, keys: { icons: [], nodes: ['x_node'] } } };
  const ctx = { window }; vm.createContext(ctx); vm.runInContext(SRC, ctx);
  const A = window.ART;
  if (A.node('elsewhere') !== 'BASE_NODE:elsewhere') problems.push('fake: node fall-through broken');
  for (const k of ['toString', 'hasOwnProperty', 'constructor', 'valueOf', '__proto__'])
    if (A.node(k) !== 'BASE_NODE:' + k) problems.push('fake: prototype node key not falling through ' + k);
  if (A.keys.nodes[0] !== 'x_node') problems.push('fake: existing node keys lost');
  for (const k of NEW_NODES) if (!/^<svg/.test(A.node(k))) problems.push('fake: node not drawn ' + k);
}
// ---- 2. pack with no ART at all ----
{
  const window = {}; const ctx = { window }; vm.createContext(ctx); vm.runInContext(SRC, ctx);
  if (!/^<svg/.test(window.ART.icon('anything'))) problems.push('bare: no placeholder');
  if (!/^<svg/.test(window.ART.icon('duskiron_ore'))) problems.push('bare: duskiron_ore missing');
  try { for (const bad of [undefined, null, 42, {}, '', 'toString']) if (!/^<svg/.test(window.ART.icon(bad))) problems.push('bare: bad key ' + String(bad)); }
  catch (e) { problems.push('bare: icon threw on odd key'); }
  if (!/^<svg/.test(window.ART.node('duskiron'))) problems.push('bare: duskiron node missing');
  try { for (const bad of [undefined, null, 42, {}, '', 'toString']) if (!/^<svg/.test(window.ART.node(bad))) problems.push('bare: bad node key ' + String(bad)); }
  catch (e) { problems.push('bare: node threw on odd key'); }
}
// ---- 2b. base icon that throws ----
{
  const window = { ART: { icon: () => { throw new Error('x'); } } }; const ctx = { window }; vm.createContext(ctx); vm.runInContext(SRC, ctx);
  try { if (!/^<svg/.test(window.ART.icon('elsewhere'))) problems.push('throwing base: no placeholder'); } catch (e) { problems.push('throwing base: threw'); }
}
{
  const window = { ART: { node: () => { throw new Error('x'); } } }; const ctx = { window }; vm.createContext(ctx); vm.runInContext(SRC, ctx);
  try { if (!/^<svg/.test(window.ART.node('elsewhere'))) problems.push('throwing base node: no placeholder'); } catch (e) { problems.push('throwing base node: threw'); }
}
// ---- 3. real art.js + every earlier pack, then this pack ----
const window = {}; vm.createContext(window); window.window = window;
const probes = ['nope', 'toString'];
for (const f of PRE) {
  const had = (window.ART && window.ART.keys && window.ART.keys.icons || []).slice();
  try { vm.runInContext(read(f), window); } catch (e) { problems.push('pre-pack failed to load: ' + f + ' (' + e.message + ')'); continue; }
  const added = window.ART.keys.icons.filter(k => !had.includes(k));
  // probe a spread of each pack's icons: first, middle, last
  for (const k of [added[0], added[added.length >> 1], added[added.length - 1]]) if (k && !probes.includes(k)) probes.push(k);
}
const existing = window.ART.keys.icons.slice();
for (const k of NEW) if (existing.includes(k)) problems.push('key already exists before pack: ' + k);
const before = {}; for (const k of probes) before[k] = norm(window.ART.icon(k));
const existingNodes = (window.ART.keys.nodes || []).slice();
if (typeof window.ART.node !== 'function' || !existingNodes.length) problems.push('no ART.node / node keys before the pack');
for (const k of NEW_NODES) if (existingNodes.includes(k)) problems.push('node key already exists before pack: ' + k);
const beforeN = {}; for (const k of existingNodes.concat(['nope'])) beforeN[k] = norm(window.ART.node(k));
vm.runInContext(SRC, window);
const ART = window.ART;
for (const k of Object.keys(before)) if (norm(ART.icon(k)) !== before[k]) problems.push('existing icon changed: ' + k);
for (const k of existing) if (!ART.keys.icons.includes(k)) problems.push('existing key lost: ' + k);
if (ART.keys.icons.length !== existing.length + NEW.length) problems.push('keys length ' + ART.keys.icons.length + ' != ' + (existing.length + NEW.length));
const allIds = new Set();
const out = {};
for (const k of NEW) {
  const s = ART.icon(k);
  if (!/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="0 0 64 64"/.test(s)) problems.push(k + ': bad root');
  if (/NaN|undefined|Infinity|null/.test(s)) problems.push(k + ': NaN/undefined');
  if (/<text|<filter|<image|href=/.test(s)) problems.push(k + ': text/filter/image');
  if (s.indexOf('#5a5a62') >= 0 && s.length < 1500) problems.push(k + ': placeholder (threw?)');
  const ids = [...s.matchAll(/ id="([^"]+)"/g)].map(m => m[1]);
  for (const id of ids) { if (!/^iW[0-9a-z]+_/.test(id)) problems.push(k + ': bad id ' + id); if (allIds.has(id)) problems.push(k + ': id reused ' + id); allIds.add(id); }
  const refs = [...s.matchAll(/url\(#([^)]+)\)/g)].map(m => m[1]);
  for (const r of refs) if (!ids.includes(r)) problems.push(k + ': dangling ref ' + r);
  if (!ART.keys.icons.includes(k)) problems.push('keys missing ' + k);
  out[k] = s; fs.writeFileSync(path.join(OUT, 'icon_' + k + '.svg'), s);
}
// ---- nodes ----
for (const k of Object.keys(beforeN)) if (norm(ART.node(k)) !== beforeN[k]) problems.push('existing node changed: ' + k);
for (const k of existingNodes) if (!ART.keys.nodes.includes(k)) problems.push('existing node key lost: ' + k);
if (ART.keys.nodes.length !== existingNodes.length + NEW_NODES.length) problems.push('node keys length ' + ART.keys.nodes.length + ' != ' + (existingNodes.length + NEW_NODES.length));
const placeholder = norm(ART.node('nope'));
const outN = {};
for (const k of NEW_NODES) {
  let s;
  try { s = ART.node(k); } catch (e) { problems.push('node ' + k + ': threw ' + e.message); continue; }
  if (!/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="0 0 96 96"/.test(s)) problems.push('node ' + k + ': bad root');
  if (norm(s) === placeholder) problems.push('node ' + k + ': placeholder (threw or missing)');
  if (/NaN|undefined|Infinity|null/.test(s)) problems.push('node ' + k + ': NaN/undefined');
  if (/<text|<filter|<image|href=/.test(s)) problems.push('node ' + k + ': text/filter/image');
  const ids = [...s.matchAll(/ id="([^"]+)"/g)].map(m => m[1]);
  for (const id of ids) { if (!/^iW[0-9a-z]+_/.test(id)) problems.push('node ' + k + ': bad id ' + id); if (allIds.has(id)) problems.push('node ' + k + ': id reused ' + id); allIds.add(id); }
  for (const r of [...s.matchAll(/url\(#([^)]+)\)/g)].map(m => m[1])) if (!ids.includes(r)) problems.push('node ' + k + ': dangling ref ' + r);
  if (!ART.keys.nodes.includes(k)) problems.push('node keys missing ' + k);
  outN[k] = s; fs.writeFileSync(path.join(OUT, 'node_' + k + '.svg'), s);
}
// packs numbered above 13 load after this one: warn if any of them also claims one of these keys
for (const f of fs.readdirSync(path.join(ROOT, 'src'))) {
  const m = /^art_icons(\d+)\.js$/.exec(f); if (!m || +m[1] <= 13) continue;
  const t = read(f);
  for (const k of NEW) if (new RegExp('\\b' + k + '\\s*:\\s*function').test(t)) problems.push('key also defined in later pack ' + f + ': ' + k);
}
// ---- sheets ----
function sheet(name, items, cw, cols) {
  const pad = Math.max(6, cw / 8), rows = Math.ceil(items.length / cols); let body = '';
  items.forEach(([k, s], i) => {
    const x = pad + (i % cols) * (cw + pad), y = pad + Math.floor(i / cols) * (cw + pad);
    body += s.replace(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="([^"]+)" width="[^"]+" height="[^"]+">/, `<svg x="${x}" y="${y}" width="${cw}" height="${cw}" viewBox="$1">`);
  });
  const Wd = pad + cols * (cw + pad), H = pad + rows * (cw + pad);
  const p = path.join(OUT, 'sheet_' + name + '.svg');
  fs.writeFileSync(p, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Wd} ${H}" width="${Wd}" height="${H}"><rect width="${Wd}" height="${H}" fill="#1c1a20"/>${body}</svg>`);
  execFileSync(RSVG, ['-w', String(Wd), p, '-o', p.replace(/\.svg$/, '.png')]);
}
const newItems = NEW.map(k => [k, out[k]]);
sheet('new_128', newItems, 128, 6);
sheet('new_64', newItems, 64, 6);
sheet('new_40', newItems, 40, 6);
// look-alike comparison: one row per new icon, new first, then its 3 closest existing icons
const cmp = [];
for (const row of COMPARE) {
  if (!NEW.includes(row[0])) problems.push('compare: row not led by a new key ' + row[0]);
  for (const k of row.slice(1)) if (!existing.includes(k)) problems.push('compare: unknown existing key ' + k);
  for (const k of row) cmp.push([k, out[k] || ART.icon(k)]);
}
for (const k of NEW) if (!COMPARE.some(r => r[0] === k)) problems.push('compare: no row for ' + k);
sheet('compare_40', cmp, 40, 8);
sheet('compare_64', cmp, 64, 8);
// node sheet: one row per new node (new first, then its 3 look-alikes), once on a mid-grey and once on a grass green ground
function nodeSheet(name, cw) {
  const pad = 8, cols = 8, BG = ['#7a7a74', '#5a7a3a'];
  let body = '';
  NODE_COMPARE.forEach((row, r) => {
    if (!NEW_NODES.includes(row[0])) problems.push('node compare: row not led by a new key ' + row[0]);
    for (const k of row.slice(1)) if (!existingNodes.includes(k)) problems.push('node compare: unknown existing node ' + k);
    BG.forEach((bg, b) => row.forEach((k, i) => {
      const x = pad + (b * 4 + i) * (cw + pad) + b * pad * 2, y = pad + r * (cw + pad);
      const s = outN[k] || ART.node(k);
      body += `<rect x="${x}" y="${y}" width="${cw}" height="${cw}" fill="${bg}"/>` + (i === 0 ? `<rect x="${x}" y="${y}" width="${cw}" height="${cw}" fill="none" stroke="#e8d070" stroke-width="2"/>` : '') +
        s.replace(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="([^"]+)" width="[^"]+" height="[^"]+">/, `<svg x="${x}" y="${y}" width="${cw}" height="${cw}" viewBox="$1">`);
    }));
  });
  for (const k of NEW_NODES) if (!NODE_COMPARE.some(r => r[0] === k)) problems.push('node compare: no row for ' + k);
  const Wd = pad + cols * (cw + pad) + pad * 2, H = pad + NODE_COMPARE.length * (cw + pad);
  const p = path.join(OUT, 'sheet_' + name + '.svg');
  fs.writeFileSync(p, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Wd} ${H}" width="${Wd}" height="${H}"><rect width="${Wd}" height="${H}" fill="#1c1a20"/>${body}</svg>`);
  execFileSync(RSVG, ['-w', String(Wd), p, '-o', p.replace(/\.svg$/, '.png')]);
}
nodeSheet('nodes', 96);
nodeSheet('nodes_46', 46);   // about the size a node is shown on a zone scene
console.log('loaded before: ' + PRE.join(', '));
console.log(problems.length ? 'PROBLEMS (' + problems.length + '):\n' + problems.join('\n') : 'OK: ' + NEW.length + ' icons, 0 problems (' + NEW_NODES.length + ' nodes checked)');
