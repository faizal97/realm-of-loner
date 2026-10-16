// Verifies src/art_legends.js (the Legend characters: Lyveus Cloveus, his comrade Vyn, Lord Cassius Marrow,
// Silverleaf Lodge, the four Lyveus icons; then the hooded wanderer, Deathwing and the two lore story scenes; then Widya
// the bard, Harrowby, Sal Brightbell and Widya's icons) and renders contact sheets into art/legends/out/. Also sheets
// art.js's bard outfit and the Reedsong Lute back look on several races.
// Usage: node art/legends/render.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const zlib = require('zlib');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(__dirname, 'out');
const RSVG = '/opt/homebrew/bin/rsvg-convert';
fs.mkdirSync(OUT, { recursive: true });
const read = (f) => fs.readFileSync(path.join(ROOT, 'src', f), 'utf8');
const SELF = 'art_legends.js';
const SRC = read(SELF);

const WIDYA_ICONS = ['legend_widya', 'soothing_chord', 'dissonant_note', 'song_of_rest', 'marching_song', 'lullaby', 'verse_of_mending', 'chorus_grove', 'counterpoint',
  'hearthsong', 'crescendo', 'dirge', 'anthem_of_stone', 'encore', 'requiem', 'grand_finale', 'lake_reed', 'silver_lute_strings', 'heartwood_pegs', 'carved_lute_neck', 'lute_body', 'reedsong_lute', 'bard_drum', 'bard_horn', 'sharp_refrain', 'mocking_verse', 'ballad_of_blades', 'shatterchord', 'cleansing_verse', 'intermission', 'stage_fright', 'echo'];
const NEW = { legends: ['lyveus', 'lyveus_hooded', 'widya', 'harrowby'], mobs: ['lord_cassius_marrow', 'sal_brightbell'], scenes: ['silverleaf_lodge'],
  icons: ['legend_lyveus', 'oathbound_strike', 'ancients_bulwark', 'silverleaf_aegis'].concat(WIDYA_ICONS),
  actors: ['lyveus', 'vyn', 'lyveus_hooded', 'deathwing', 'widya', 'harrowby'], storyScenes: ['silverleaf_burning', 'caravan_road'] };
// the first batch of keys must stay byte-identical: sha1 (first 12 hex) of each, drawn in a fresh world in this order
const BASELINE = { legend_lyveus: '45e75da0f5b3', mob: '6d2bc85dee20', scene: '6dbbe3f65946', actor_lyveus: 'da9c4fab333e', actor_vyn: 'daa2bfec4958',
  icon_legend_lyveus: 'f528ef62b578', icon_oathbound_strike: '5d860cc9e318', icon_ancients_bulwark: '74aeffa4f137', icon_silverleaf_aegis: '19f94953de70' };
const WEIRD = ['nope', '', 'toString', '__proto__', 'constructor', 'hasOwnProperty', 'valueOf', 'lyveus ', undefined, null, 42, {}, []];
const problems = [];
const notes = [];
const bad = (m) => problems.push(m);
const norm = (t) => String(t).replace(/ id="[^"]+"/g, ' id=""').replace(/url\(#[^)]+\)/g, 'url(#)');
const HERO_FB = { cls: 'paladin', race: 'human' };

// ---- 1. fake ART: every call that is not ours reaches the base unchanged ----
function runIn(window) { const ctx = { window }; vm.createContext(ctx); vm.runInContext(SRC, ctx); return window; }
function fake() {
  const baseStoryScene = (k) => 'BASE_SSCENE:' + k;
  return {
    ART: {
      scene: (k) => 'BASE_SCENE:' + k, mob: (k) => 'BASE_MOB:' + k, icon: (k) => 'BASE_ICON:' + k, hero: (o) => 'BASE_HERO:' + JSON.stringify(o),
      story: { scene: baseStoryScene, actor: (k) => 'BASE_ACTOR:' + k, keys: { scenes: ['x_sscene'], actors: ['x_actor'] } },
      keys: { scenes: ['x_scene'], mobs: ['x_mob'], icons: ['x_icon'] }
    }
  };
}
{
  const w = fake(), sScene = w.ART.story.scene, story = w.ART.story;
  runIn(w);
  const A = w.ART;
  for (const k of ['elsewhere', 'toString', '__proto__', 'constructor', 'hasOwnProperty', 'valueOf', 'goldshire', 'lyveus']) {
    if (A.scene(k) !== 'BASE_SCENE:' + k) bad('fake: scene did not fall through for ' + k);
    if (A.icon(k) !== 'BASE_ICON:' + k) bad('fake: icon did not fall through for ' + k);
    if (k !== 'lyveus' && A.story.actor(k) !== 'BASE_ACTOR:' + k) bad('fake: actor did not fall through for ' + k);
    if (A.story.scene(k) !== 'BASE_SSCENE:' + k) bad('fake: story scene did not fall through for ' + k);
  }
  // a story scene key asked for as an actor (and vice versa) is not ours
  if (A.story.actor('caravan_road') !== 'BASE_ACTOR:caravan_road' || A.story.scene('deathwing') !== 'BASE_SSCENE:deathwing') bad('fake: story scene / actor keys crossed');
  for (const k of ['elsewhere', 'toString', '__proto__', 'constructor', 'lyveus', 'vyn']) if (A.mob(k) !== 'BASE_MOB:' + k) bad('fake: mob did not fall through for ' + k);
  if (A.story !== story) bad('fake: ART.story replaced instead of extended');
  if (A.scene('silverleaf_lodge').indexOf('<svg') !== 0 || A.mob('lord_cassius_marrow').indexOf('<svg') !== 0) bad('fake: own scene / mob broken');
  for (const k of NEW.icons) if (A.icon(k).indexOf('<svg') !== 0) bad('fake: own icon broken ' + k);
  for (const k of NEW.actors) if (A.story.actor(k).indexOf('<svg') !== 0) bad('fake: own actor broken ' + k);
  for (const k of NEW.storyScenes) if (A.story.scene(k).indexOf('<svg') !== 0) bad('fake: own story scene broken ' + k);
  if (typeof A.legend !== 'function') bad('fake: no ART.legend');
  else {
    if (A.legend('lyveus').indexOf('<svg') !== 0) bad('fake: legend lyveus broken');
    for (const k of WEIRD) { let s; try { s = A.legend(k); } catch (e) { s = 'THREW'; } if (s !== 'BASE_HERO:' + JSON.stringify(HERO_FB)) bad('fake: legend(' + String(k) + ') did not return the paladin hero'); }
    if (JSON.stringify(A.legend.keys) !== JSON.stringify(NEW.legends)) bad('fake: ART.legend.keys = ' + JSON.stringify(A.legend.keys));
  }
  const K = A.keys;
  if (K.scenes.join() !== ['x_scene'].concat(NEW.scenes).join()) bad('fake: keys.scenes ' + K.scenes);
  if (K.mobs.join() !== ['x_mob'].concat(NEW.mobs).join()) bad('fake: keys.mobs ' + K.mobs);
  if (K.icons.join() !== ['x_icon'].concat(NEW.icons).join()) bad('fake: keys.icons ' + K.icons);
  if (A.story.keys.actors.join() !== ['x_actor'].concat(NEW.actors).join() || A.story.keys.scenes.join() !== ['x_sscene'].concat(NEW.storyScenes).join()) bad('fake: story keys ' + JSON.stringify(A.story.keys));
  for (const bad2 of WEIRD) { try { A.mob(bad2); A.scene(bad2); A.icon(bad2); A.story.actor(bad2); A.story.scene(bad2); } catch (e) { bad('fake: threw on ' + String(bad2)); } }
  // loading twice does not duplicate keys
  runIn(w);
  if (w.ART.keys.icons.length !== 1 + NEW.icons.length || w.ART.story.keys.actors.length !== 1 + NEW.actors.length || w.ART.story.keys.scenes.length !== 1 + NEW.storyScenes.length) bad('fake: double load duplicated keys');
  // bases that throw are caught
  const wt = runIn({ ART: { scene() { throw new Error('x'); }, mob() { throw new Error('x'); }, icon() { throw new Error('x'); }, hero() { throw new Error('x'); }, story: { scene() { throw new Error('x'); }, actor() { throw new Error('x'); }, keys: { scenes: [], actors: [] } } } });
  try { for (const f of ['scene', 'mob', 'icon', 'legend']) if (!/^<svg /.test(wt.ART[f]('elsewhere'))) bad('throwing base: no placeholder from ' + f); if (!/^<svg /.test(wt.ART.story.actor('elsewhere')) || !/^<svg /.test(wt.ART.story.scene('elsewhere'))) bad('throwing base: no story placeholder'); } catch (e) { bad('throwing base: threw ' + e.message); }
  // a frozen story object: a fresh one is published, the old scene function kept
  const fz = fake(); Object.freeze(fz.ART.story); Object.freeze(fz.ART.story.keys);
  try { runIn(fz); if (!/^<svg /.test(fz.ART.story.actor('vyn')) || fz.ART.story.actor('q') !== 'BASE_ACTOR:q' || fz.ART.story.scene('q') !== 'BASE_SSCENE:q' || !fz.ART.story.keys.actors.includes('lyveus') || !/^<svg /.test(fz.ART.story.scene('caravan_road'))) bad('frozen story: pack not installed'); } catch (e) { bad('frozen story: threw ' + e.message); }
  // empty and garbage worlds
  const worlds = [{}, { ART: {} }, { ART: null }, { ART: 5 }, { ART: { keys: null, scene: 'no', mob: 7, story: 3 } }, { ART: { keys: { scenes: 'x', mobs: {}, icons: 4 }, story: { keys: null, actor: 'x' } } }];
  worlds.forEach((wd, i) => {
    try {
      runIn(wd);
      const T = wd.ART;
      for (const f of ['scene', 'mob', 'icon', 'legend']) {
        if (typeof T[f] !== 'function') { bad('world ' + i + ': no ' + f); continue; }
        for (const k of WEIRD) if (!/^<svg /.test(T[f](k))) bad('world ' + i + ': ' + f + ' placeholder for ' + String(k));
      }
      for (const k of WEIRD) { if (!/^<svg /.test(T.story.actor(k))) bad('world ' + i + ': actor placeholder for ' + String(k)); if (!/^<svg /.test(T.story.scene(k))) bad('world ' + i + ': story scene placeholder for ' + String(k)); }
      if (T.scene('silverleaf_lodge').length < 8000 || T.mob('lord_cassius_marrow').length < 4000 || T.legend('lyveus').length < 4000 || T.story.actor('vyn').length < 4000 || T.story.scene('caravan_road').length < 8000 || T.legend('lyveus_hooded').length < 4000) bad('world ' + i + ': own keys broken');
      if (T.keys.scenes.join() !== NEW.scenes.join() || T.keys.mobs.join() !== NEW.mobs.join() || T.keys.icons.join() !== NEW.icons.join() || T.story.keys.actors.join() !== NEW.actors.join() || T.story.keys.scenes.join() !== NEW.storyScenes.join()) bad('world ' + i + ': keys ' + JSON.stringify(T.keys));
    } catch (e) { bad('world ' + i + ': threw ' + e.message); }
  });
  console.log('fake/empty ART checks: ' + (worlds.length + 3) + ' worlds');
}

// ---- 2. real load: art.js + every art pack build.py lists (build order, story packs included), with and without this pack ----
const BUILD = fs.readFileSync(path.join(ROOT, 'build.py'), 'utf8');
const LISTED = [...BUILD.matchAll(/'src\/(art[a-z0-9_]*\.js)'/g)].map((m) => m[1]).filter((f, i, a) => a.indexOf(f) === i);
// the packs listed before this one (later packs such as art_bromli.js wrap ART.legend on top of it and have their own check)
const PACKS = (LISTED.includes(SELF) ? LISTED.slice(0, LISTED.indexOf(SELF)) : LISTED).filter((f) => f !== SELF && fs.existsSync(path.join(ROOT, 'src', f)));
if (PACKS.length < 20 || PACKS[0] !== 'art.js') bad('could not read the art pack list from build.py');
if (!LISTED.includes(SELF)) notes.push(SELF + ' is not in build.py yet: loaded here after every listed pack');
else if (LISTED.indexOf(SELF) < LISTED.length - 1) notes.push('listed after ' + SELF + ' in build.py (not loaded here): ' + LISTED.slice(LISTED.indexOf(SELF) + 1).join(', '));
for (const f of fs.readdirSync(path.join(ROOT, 'src')).filter((f) => /^art_.*\.js$/.test(f) && f !== SELF && !LISTED.includes(f))) notes.push('on disk but not in build.py (not loaded): ' + f);
function world(withPack) {
  const w = {}; w.window = w; vm.createContext(w);
  const added = { scenes: [], mobs: [], icons: [], actors: [] };
  for (const f of PACKS) {
    const K = (w.ART && w.ART.keys) || {}, S = (w.ART && w.ART.story && w.ART.story.keys) || {};
    const before = { scenes: (K.scenes || []).length, mobs: (K.mobs || []).length, icons: (K.icons || []).length, actors: (S.actors || []).length };
    vm.runInContext(read(f), w);
    const K2 = w.ART.keys || {}, S2 = (w.ART.story && w.ART.story.keys) || {};
    // probe the first, middle and last key each pack adds
    for (const [name, list] of [['scenes', K2.scenes], ['mobs', K2.mobs], ['icons', K2.icons], ['actors', S2.actors]]) {
      const a = (list || []).slice(before[name]);
      for (const k of [a[0], a[a.length >> 1], a[a.length - 1]]) if (k && !added[name].includes(k)) added[name].push(k);
    }
  }
  const refs = {};
  for (const k of Object.keys(w.ART)) refs[k] = w.ART[k];
  refs.storyScene = w.ART.story.scene;
  if (withPack) vm.runInContext(SRC, w);
  return { w, added, refs };
}
const A0 = world(false), B0 = world(true);
const A = A0.w.ART, B = B0.w.ART, PROBE = A0.added;
for (const k of NEW.scenes) if (A.keys.scenes.includes(k)) bad('scene key already exists before this pack: ' + k);
for (const k of NEW.mobs) if (A.keys.mobs.includes(k)) bad('mob key already exists before this pack: ' + k);
for (const k of NEW.icons) if (A.keys.icons.includes(k)) bad('icon key already exists before this pack: ' + k);
for (const k of NEW.actors) if (A.story.keys.actors.includes(k)) bad('actor key already exists before this pack: ' + k);
for (const k of NEW.storyScenes) if (A.story.keys.scenes.includes(k)) bad('story scene key already exists before this pack: ' + k);
if (B.keys.scenes.slice(0, A.keys.scenes.length).join() !== A.keys.scenes.join() || B.keys.scenes.slice(A.keys.scenes.length).join() !== NEW.scenes.join()) bad('real: keys.scenes not old + new');
if (B.keys.mobs.slice(0, A.keys.mobs.length).join() !== A.keys.mobs.join() || B.keys.mobs.slice(A.keys.mobs.length).join() !== NEW.mobs.join()) bad('real: keys.mobs not old + new');
if (B.keys.icons.slice(0, A.keys.icons.length).join() !== A.keys.icons.join() || B.keys.icons.slice(A.keys.icons.length).join() !== NEW.icons.join()) bad('real: keys.icons not old + new');
if (B.story.keys.actors.join() !== A.story.keys.actors.concat(NEW.actors).join() || B.story.keys.scenes.join() !== A.story.keys.scenes.concat(NEW.storyScenes).join()) bad('real: story keys not old + new');
// only scene, mob and icon are wrapped; everything else art.js and the earlier packs publish is left as it was
for (const k of Object.keys(B0.refs)) if (k !== 'storyScene' && !['scene', 'mob', 'icon'].includes(k) && B0.refs[k] !== B[k]) bad('real: ART.' + k + ' was replaced');
if (B.story !== B0.refs.story) bad('real: ART.story replaced instead of extended');
if (typeof B.legend !== 'function') bad('real: no ART.legend');
// the same calls in the same order in both worlds must give byte-identical strings
const calls = [];
PROBE.scenes.forEach((k) => calls.push(['scene', k]));
PROBE.mobs.forEach((k) => calls.push(['mob', k]));
PROBE.icons.forEach((k) => calls.push(['icon', k]));
A.story.keys.scenes.forEach((k) => calls.push(['sscene', k]));
A.story.keys.actors.forEach((k) => calls.push(['actor', k]));
['goldshire', 'razor_hill', 'highland_plains', 'refuge_pointe', 'stromgarde_keep', 'shadowfang_hall'].forEach((k) => calls.push(['scene', k]));
['hogger', 'syndicate_highwayman', 'syndicate_magus', 'boulderfist_brute', 'arugal'].forEach((k) => calls.push(['mob', k]));
['sword', 'holy_shield', 'shield_wall', 'crusader_strike', 'divine_protection'].forEach((k) => calls.push(['icon', k]));
WEIRD.forEach((k) => { calls.push(['scene', k], ['mob', k], ['icon', k], ['sscene', k], ['actor', k]); });
[{ cls: 'mage' }, { cls: 'paladin', race: 'human' }, { cls: 'warrior', race: 'nightelf', gender: 'f' }, { cls: 'rogue', race: 'undead' }, { cls: 'druid', race: 'tauren' }].forEach((o) => calls.push(['hero', o], ['portrait', o]));
['imp', 'voidwalker'].forEach((k) => calls.push(['pet', k]));
const run = (ART, [f, k]) => { try { return f === 'sscene' ? ART.story.scene(k) : f === 'actor' ? ART.story.actor(k) : ART[f](k); } catch (e) { return 'THREW ' + e.message; } };
let same = 0;
for (const cl of calls) {
  const a = run(A, cl), b = run(B, cl);
  if (a !== b) bad('real: ' + cl[0] + '(' + JSON.stringify(cl[1]) + ') differs after this pack loads'); else same++;
  if (/^(scene|mob|sscene|actor)$/.test(cl[0]) && !WEIRD.includes(cl[1]) && a.length < 2000) notes.push('probe ' + cl[0] + ' ' + cl[1] + ' is small (' + a.length + ' bytes): placeholder?');
}
// ART.legend on an unknown key is the paladin hero (ids differ per call, so compare with ids blanked)
for (const k of WEIRD) if (norm(B.legend(k)) !== norm(B.hero(HERO_FB))) bad('real: legend(' + String(k) + ') is not ART.hero(paladin, human)');
if (JSON.stringify(B.legend.keys) !== JSON.stringify(NEW.legends)) bad('real: ART.legend.keys ' + JSON.stringify(B.legend.keys));
console.log('identity check: ' + same + ' of ' + calls.length + ' calls byte-identical with and without the pack');

// ---- 3. per-SVG checks on the new art ----
const allIds = new Set();
function check(name, s, vb) {
  if (typeof s !== 'string') { bad(name + ': not a string'); return; }
  if (!s.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '"')) bad(name + ': bad root / viewBox');
  if (/NaN|undefined|Infinity|null/.test(s)) bad(name + ': NaN/undefined in output');
  if (/<text|<tspan|<filter|<image|<foreignObject|<script|<use\b|href|filter=|\son[a-z]+=/i.test(s)) bad(name + ': forbidden element or attribute');
  const ids = [...s.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
  if (new Set(ids).size !== ids.length) bad(name + ': duplicate ids');
  for (const id of ids) { if (!/^lg[0-9a-z]+_[0-9a-z]+$/.test(id)) bad(name + ': id without lg prefix ' + id); if (allIds.has(id)) bad(name + ': id reused across calls ' + id); allIds.add(id); }
  for (const m of s.matchAll(/url\(#([^)]+)\)/g)) if (!ids.includes(m[1])) bad(name + ': dangling ref ' + m[1]);
  if ((s.match(/<svg/g) || []).length !== 1 || !s.endsWith('</svg>')) bad(name + ': malformed svg');
}
const ART = B;
const art = {
  legend: NEW.legends.map((k) => ['legend_' + k, ART.legend(k), '0 0 128 128', 6000]),
  mob: NEW.mobs.map((k) => ['mob_' + k, ART.mob(k), '0 0 128 128', 6000]),
  scene: NEW.scenes.map((k) => ['scene_' + k, ART.scene(k), '0 0 400 240', 20000]),
  actor: NEW.actors.map((k) => ['actor_' + k, ART.story.actor(k), '0 0 160 160', 6000]),
  sscene: NEW.storyScenes.map((k) => ['sscene_' + k, ART.story.scene(k), '0 0 480 270', 20000]),
  icon: NEW.icons.map((k) => ['icon_' + k, ART.icon(k), '0 0 64 64', 3000])
};
for (const list of Object.values(art)) for (const [name, s, vb, min] of list) {
  check(name, s, vb);
  if (s.length < min) bad(name + ': ' + s.length + ' bytes, looks like the placeholder');
  if (s.length > 120 * 1024) bad(name + ': over 120 KB');
}
// a second round of calls must not reuse ids
NEW.legends.forEach((k) => check('again legend ' + k, ART.legend(k), '0 0 128 128'));
NEW.mobs.forEach((k) => check('again mob ' + k, ART.mob(k), '0 0 128 128'));
NEW.scenes.forEach((k) => check('again scene ' + k, ART.scene(k), '0 0 400 240'));
NEW.actors.forEach((k) => check('again actor ' + k, ART.story.actor(k), '0 0 160 160'));
NEW.storyScenes.forEach((k) => check('again story scene ' + k, ART.story.scene(k), '0 0 480 270'));
NEW.icons.forEach((k) => check('again icon ' + k, ART.icon(k), '0 0 64 64'));
// no exception reached a try/catch placeholder: run the pack with make() instrumented
{
  const dbg = SRC.replace("} catch (e) {\n      SWM = keep;\n", "} catch (e) {\n      SWM = keep; if (W.__DBG) W.__DBG(e);\n");
  if (dbg === SRC) bad('debug hook: make() catch block not found');
  const w4 = { __DBG: (e) => bad('exception while drawing: ' + (e && e.stack ? e.stack.split('\n').slice(0, 2).join(' | ') : e)) };
  runIn(w4);
  NEW.legends.forEach((k) => w4.ART.legend(k)); NEW.mobs.forEach((k) => w4.ART.mob(k)); NEW.scenes.forEach((k) => w4.ART.scene(k));
  NEW.actors.forEach((k) => w4.ART.story.actor(k)); NEW.icons.forEach((k) => w4.ART.icon(k)); NEW.storyScenes.forEach((k) => w4.ART.story.scene(k));
}
// the first batch is unchanged, byte for byte
{
  const crypto = require('crypto'), h = (t) => crypto.createHash('sha1').update(t).digest('hex').slice(0, 12);
  const w5 = runIn({}), T = w5.ART;
  const got = { legend_lyveus: h(T.legend('lyveus')), mob: h(T.mob('lord_cassius_marrow')), scene: h(T.scene('silverleaf_lodge')), actor_lyveus: h(T.story.actor('lyveus')), actor_vyn: h(T.story.actor('vyn')) };
  for (const k of ['legend_lyveus', 'oathbound_strike', 'ancients_bulwark', 'silverleaf_aegis']) got['icon_' + k] = h(T.icon(k));
  for (const k of Object.keys(BASELINE)) if (got[k] !== BASELINE[k]) bad('baseline: ' + k + ' changed (' + got[k] + ' != ' + BASELINE[k] + ')');
  console.log('baseline: ' + Object.keys(BASELINE).length + ' first-batch keys checked byte for byte');
}

// ---- 4. files, PNGs, edge and ground checks ----
function write(name, s) { const p = path.join(OUT, name + '.svg'); fs.writeFileSync(p, s); return p; }
function png(p, w) { const o = p.replace(/\.svg$/, '.png'); execFileSync(RSVG, ['-w', String(w), p, '-o', o]); return o; }
function alphaOf(file) {
  const b = fs.readFileSync(file);
  let o = 8, w = 0, h = 0; const idat = [];
  while (o < b.length) {
    const len = b.readUInt32BE(o), type = b.toString('ascii', o + 4, o + 8), data = b.subarray(o + 8, o + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); if (data[8] !== 8 || data[9] !== 6 || data[12] !== 0) return null; }
    if (type === 'IDAT') idat.push(data);
    o += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat)), bpp = 4, stride = w * bpp, px = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)), row = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[row + x - bpp] : 0, up = y ? px[row - stride + x] : 0, ul = y && x >= bpp ? px[row - stride + x - bpp] : 0;
      let v = src[x];
      if (f === 1) v += a; else if (f === 2) v += up; else if (f === 3) v += (a + up) >> 1;
      else if (f === 4) { const p0 = a + up - ul, pa = Math.abs(p0 - a), pb = Math.abs(p0 - up), pc = Math.abs(p0 - ul); v += pa <= pb && pa <= pc ? a : pb <= pc ? up : ul; }
      px[row + x] = v & 255;
    }
  }
  return { w, h, a: (x, y) => px[y * stride + x * 4 + 3] };
}
// transparent sprites: nothing may touch the left, right or top edge (a hard cut in game); returns the lowest solid row
function edges(name, file, scale, ref) {
  const im = alphaOf(file);
  if (!im) { bad('edge check: unexpected PNG format for ' + name); return null; }
  let L0 = 0, R0 = 0, T0 = 0, low = -1;
  for (let y = 0; y < im.h; y++) { L0 = Math.max(L0, im.a(0, y), im.a(1, y)); R0 = Math.max(R0, im.a(im.w - 1, y), im.a(im.w - 2, y)); }
  for (let x = 0; x < im.w; x++) T0 = Math.max(T0, im.a(x, 0), im.a(x, 1));
  for (let y = im.h - 1; y >= 0 && low < 0; y--) for (let x = 0; x < im.w; x++) if (im.a(x, y) > 200) { low = y; break; }
  if (!ref && (L0 > 12 || R0 > 12 || T0 > 12)) bad(`edge check: ${name} touches the frame (alpha left ${L0}, right ${R0}, top ${T0})`);
  return low / scale;
}
const pngs = {};
for (const [name, s] of art.legend.concat(art.mob)) pngs[name] = png(write(name, s), 512);
for (const [name, s] of art.actor) pngs[name] = png(write(name, s), 480);
for (const [name, s] of art.scene.concat(art.sscene)) pngs[name] = png(write(name, s), 800);
for (const [name, s] of art.icon) pngs[name] = png(write(name, s), 128);
const ground = {};
for (const [name] of art.legend.concat(art.mob)) ground[name] = edges(name, pngs[name], 4);
for (const [name] of art.actor) ground[name] = edges(name, pngs[name], 3);
// the heroes' feet: the legend sprite must stand on the same line
const HEROES = [{ cls: 'paladin', race: 'human' }, { cls: 'warrior', race: 'nightelf' }, { cls: 'priest', race: 'human', gender: 'f' }, { cls: 'hunter', race: 'dwarf' }];
const heroLow = HEROES.map((o, i) => edges('hero_' + i, png(write('ref_hero_' + i, ART.hero(o)), 512), 4, true));
// the human paladin is the reference (the other races' boots are scaled and sit a little lower). The heroes' lowest
// solid row is the round cap of the leg outline under the heel, about a pixel below the boot sole, hence the tolerance.
for (const k of NEW.legends) if (Math.abs(ground['legend_' + k] - heroLow[0]) > 1.4) bad('ground: ' + k + ' feet at y=' + ground['legend_' + k].toFixed(1) + ', human paladin at y=' + heroLow[0].toFixed(1));
const refMob = edges('ref_syndicate_highwayman', png(write('ref_mob_syndicate_highwayman', ART.mob('syndicate_highwayman')), 512), 4, true);
for (const k of NEW.mobs) if (Math.abs(ground['mob_' + k] - refMob) > 0.8) bad('ground: ' + k + ' feet at y=' + ground['mob_' + k].toFixed(1) + ', syndicate_highwayman at y=' + refMob.toFixed(1));
for (const k of NEW.actors) if (ground['actor_' + k] < 150 || ground['actor_' + k] > 159) bad('ground: actor ' + k + ' feet at y=' + ground['actor_' + k].toFixed(1) + ' (want the bottom edge)');
console.log('feet (solid bottom row): ' + NEW.legends.map((k) => k + ' ' + ground['legend_' + k].toFixed(1)).join(', ') + ', sal ' + ground.mob_sal_brightbell.toFixed(1) + ', heroes ' + heroLow.map((v) => v.toFixed(1)).join(' ') + ', cassius ' + ground.mob_lord_cassius_marrow.toFixed(1) + ' (highwayman ' + refMob.toFixed(1) + '), actors ' + NEW.actors.map((k) => ground['actor_' + k].toFixed(1)).join(' '));

// ---- 5. sheets ----
const HEAD = /^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="([^"]+)"(?: width="[^"]+" height="[^"]+")?>/;
const strip = (s) => s.replace(HEAD, '').replace(/<\/svg>$/, '');
const nest = (s, x, y, w, h, flip) => {
  const inner = s.replace(HEAD, `<svg x="0" y="0" width="${w}" height="${h}" viewBox="$1">`);
  return flip ? `<g transform="translate(${x + w},${y}) scale(-1,1)">${inner}</g>` : `<g transform="translate(${x},${y})">${inner}</g>`;
};
const sheets = [];
function sheet(name, items, cw, ch, cols, bg, extra) {
  const pad = 8, rows = Math.ceil(items.length / cols);
  let body = '';
  items.forEach(([, s, cellBg], i) => {
    const x = pad + (i % cols) * (cw + pad), y = pad + Math.floor(i / cols) * (ch + pad);
    body += `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" fill="${cellBg || bg}"/>` + nest(s, x, y, cw, ch) + (extra ? extra(x, y, cw, ch) : '');
  });
  const Wd = pad + cols * (cw + pad), H = pad + rows * (ch + pad);
  const p = path.join(OUT, 'sheet_' + name + '.svg');
  fs.writeFileSync(p, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Wd} ${H}" width="${Wd}" height="${H}"><rect width="${Wd}" height="${H}" fill="#222"/>${body}</svg>`);
  const o = png(p, Wd); sheets.push(o); return o;
}
// the legend next to heroes, with the ground line, at full size and at the in-game party sizes (POS_ALLY widths on a 360px phone)
const line = (x, y, w, h) => `<rect x="${x}" y="${y + h * 122 / 128}" width="${w}" height="1" fill="#ff3a3a" opacity="0.8"/>`;
const heroRow = [['lyveus', ART.legend('lyveus')]].concat(HEROES.map((o, i) => ['hero' + i, ART.hero(o)]));
sheet('legend_heroes', heroRow, 256, 256, 5, '#8a9a8a', line);
sheet('legend_heroes_ingame', heroRow.concat(heroRow.map(([k, s]) => [k, s, '#2a3440'])), 90, 90, 5, '#8a9a8a');
sheet('legend_heroes_small', heroRow.concat(heroRow.map(([k, s]) => [k, s, '#2a3440'])), 48, 48, 5, '#8a9a8a');
// the hooded wanderer next to the plain sprite and two heroes, full size and in-game
const hoodRow = [['hooded', ART.legend('lyveus_hooded')], ['lyveus', ART.legend('lyveus')], ['paladin', ART.hero(HEROES[0])], ['rogue', ART.hero({ cls: 'rogue', race: 'human' })]];
sheet('hooded_heroes', hoodRow, 256, 256, 4, '#8a9a8a', line);
sheet('hooded_heroes_ingame', hoodRow.concat(hoodRow.map(([k, s]) => [k, s, '#2a3440'])), 90, 90, 4, '#8a9a8a');
sheet('hooded_heroes_small', hoodRow.concat(hoodRow.map(([k, s]) => [k, s, '#2a3440'])), 48, 48, 4, '#8a9a8a');
// the combat mob next to the Arathi and cabal humanoids it fights beside
const mobRow = [['cassius', ART.mob('lord_cassius_marrow')]].concat(['syndicate_highwayman', 'syndicate_magus', 'arugal', 'dark_iron_agent'].filter((k) => ART.keys.mobs.includes(k)).map((k) => [k, ART.mob(k)]));
sheet('mob_compare', mobRow, 200, 200, mobRow.length, '#c8b07a', line);
sheet('mob_compare_small', mobRow.concat(mobRow.map(([k, s]) => [k, s, '#1e1a22'])), 70, 70, mobRow.length, '#c8b07a');

// scenes with sprites, placed as ui.js places them
const POS_ALLY = [{ l: 3, b: 4, w: 25 }, { l: 20, b: 16, w: 19 }, { l: 1, b: 29, w: 17 }, { l: 22, b: 33, w: 15 }, { l: 10, b: 43, w: 13 }];
const POS_EN = [{ r: 3, b: 4, w: 30 }, { r: 26, b: 15, w: 23 }, { r: 6, b: 28, w: 20 }, { r: 28, b: 34, w: 17 }, { r: 15, b: 44, w: 14 }];
{
  const ui = read('ui.js');
  const al = ui.match(/const POS_ALLY = (\[[^\n]+\]);/), en = ui.match(/const POS_EN = (\[[^\n]+\]);/);
  if (!al || JSON.stringify(eval(al[1])) !== JSON.stringify(POS_ALLY)) bad('onscene: POS_ALLY in ui.js changed, update the copy here');
  if (!en || JSON.stringify(eval(en[1])) !== JSON.stringify(POS_EN)) bad('onscene: POS_EN in ui.js changed, update the copy here');
  if (!/if \(u\.boss && i === 0\) pos\.w = [^;\n]*: 36;/.test(ui)) bad('onscene: boss width rule in ui.js changed'); // a world boss is wider (46); an ordinary boss, drawn here, is 36
  if (!/spriteEl\(art\('hero', looks\(P\)\), \{ l: 4, b: 5, w: 26 \}/.test(ui)) notes.push('onscene: the town hero slot in ui.js changed');
}
function spr(pos, svg, flip) {
  const w = 400 * pos.w / 100, x = pos.l != null ? 400 * pos.l / 100 : 400 - 400 * pos.r / 100 - w, y = 240 - 240 * pos.b / 100 - w;
  return nest(svg, x, y, w, w, flip);
}
function onScene(label, sceneKey, allies, enemies, bossFirst) {
  let body = strip(ART.scene(sceneKey));
  const al = allies.map((s, i) => spr(POS_ALLY[i], s));
  const en = enemies.map((s, i) => { const pos = Object.assign({}, POS_EN[i]); if (bossFirst && i === 0) pos.w = 36; return spr(pos, s); });
  body += al.reverse().join('') + en.reverse().join('');
  return [label, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">${body}</svg>`];
}
const H = (o) => ART.hero(o);
const LYV = () => ART.legend('lyveus');
// party slot 1 in a dungeon
const dungeonKey = ['shadowfang_hall', 'the_stockade', 'blackfathom_deeps'].find((k) => ART.keys.scenes.includes(k));
const dMob = ['nightbane_worgen', 'defias_convict', 'murloc_flesheater'].filter((k) => ART.keys.mobs.includes(k));
const party = [H({ cls: 'warrior', race: 'orc' }), LYV(), H({ cls: 'priest', race: 'human', gender: 'f' }), H({ cls: 'mage', race: 'gnome' }), H({ cls: 'rogue', race: 'nightelf' })];
const dungeon = [
  onScene('dungeon party', dungeonKey, party, [ART.mob(dMob[0]), ART.mob(dMob[0]), ART.mob(dMob[1] || dMob[0])]),
  onScene('dungeon hooded slot 1', dungeonKey, [H({ cls: 'warrior', race: 'orc' }), ART.legend('lyveus_hooded'), H({ cls: 'priest', race: 'human', gender: 'f' })], [ART.mob(dMob[0]), ART.mob(dMob[1] || dMob[0])]),
  onScene('dungeon lyveus front', dungeonKey, [LYV(), H({ cls: 'paladin', race: 'dwarf' }), H({ cls: 'priest', race: 'undead' })], [ART.mob(dMob[0])])
];
sheet('party_dungeon', dungeon, 400, 240, 2, '#000');
// the lodge: alone, as the town view, and the fights set there (the Oath of the Ancients pulls, the Syndicate squatters)
const lodge = ART.scene('silverleaf_lodge');
const hw = ART.mob('syndicate_highwayman'), mg = ART.mob('syndicate_magus'), cas = ART.mob('lord_cassius_marrow');
const lodgeSheets = [
  ['lodge', lodge],
  ['town hooded', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">${strip(lodge)}${spr({ l: 4, b: 5, w: 26 }, ART.legend('lyveus_hooded'))}</svg>`],
  ['town', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">${strip(lodge)}${spr({ l: 4, b: 5, w: 26 }, LYV())}</svg>`],
  // floor test: back-row enemies in slots 3 and 4 behind the boss
  onScene('boss', 'silverleaf_lodge', [LYV(), H({ cls: 'priest', race: 'human', gender: 'f' }), H({ cls: 'hunter', race: 'dwarf' })], [cas, ART.mob('syndicate_highwayman'), ART.mob('syndicate_highwayman'), hw, mg], true),
  onScene('syndicate', 'silverleaf_lodge', [LYV()], [hw, mg, ART.mob('syndicate_highwayman'), ART.mob('syndicate_magus'), ART.mob('syndicate_highwayman')]),
  onScene('arathi ogre', 'silverleaf_lodge', [LYV(), H({ cls: 'mage', race: 'human' })], [ART.mob('boulderfist_brute')])
];
sheet('lodge', [['lodge', lodge]], 800, 480, 1, '#000');
sheet('lodge_onscene', lodgeSheets, 400, 240, 2, '#000');
// story actors next to Windsor and Bolvar, on light and dark, and over a story backdrop as cutscene.js places them
const actors = [['lyveus', ART.story.actor('lyveus')], ['vyn', ART.story.actor('vyn')], ['windsor', ART.story.actor('windsor')], ['bolvar', ART.story.actor('bolvar')], ['lyveus_hooded', ART.story.actor('lyveus_hooded')]];
sheet('actors', actors.concat(actors.map(([k, s]) => [k, s, '#10161c'])), 150, 150, 5, '#6a7a8a');
sheet('actors_big', actors, 300, 300, 5, '#6a7a8a');
// Deathwing next to the black dragons of art_story.js, on light and dark, and big
const dragons = [['deathwing', ART.story.actor('deathwing')], ['onyxia', ART.story.actor('onyxia')], ['nefarian', ART.story.actor('nefarian')]];
sheet('dragons', dragons.concat(dragons.map(([k, s]) => [k, s, '#10161c'])), 200, 200, 3, '#6a7a8a');
sheet('dragons_big', dragons, 400, 400, 3, '#6a7a8a');
// the two new story scenes alone
sheet('story_scenes', NEW.storyScenes.map((k) => [k, ART.story.scene(k)]), 480, 270, 1, '#000', null);
const stage = (bgKey, placements) => {
  let body = nest(ART.story.scene(bgKey), 0, 0, 480, 270);
  for (const [s, x, y, w] of placements) { const sz = w * 4.8; body += nest(s, x * 4.8, 270 - y * 2.7 - sz, sz, sz); }
  return [bgKey, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 270" width="480" height="270">${body}</svg>`];
};
sheet('actors_stage', [
  stage('stormwind_keep', [[ART.story.actor('vyn'), 22, 2, 30], [ART.story.actor('lyveus'), 56, 2, 32]]),
  stage('stormwind_keep', [[ART.story.actor('vyn'), 16, 2, 30], [ART.story.actor('windsor'), 42, 2, 30], [ART.story.actor('bolvar'), 66, 2, 30]]),
  // the lore cutscene: the ambushed caravan with young Lyveus in the light, the burning lodge, Deathwing looming over it
  stage('caravan_road', [[ART.story.actor('lyveus'), 34, 3, 32]]),
  stage('caravan_road', [[ART.story.actor('vyn'), 14, 2, 28], [ART.story.actor('lyveus'), 36, 3, 30]]),
  stage('silverleaf_burning', [[ART.story.actor('lyveus_hooded'), 36, 2, 30]]),
  stage('silverleaf_burning', [[ART.story.actor('deathwing'), 18, 0, 64]]),
  stage('silverleaf_burning', [[ART.story.actor('deathwing'), 30, 6, 44], [ART.story.actor('lyveus_hooded'), 4, 0, 24]]),
  stage('azeroth_dawn', [[ART.story.actor('deathwing'), 22, 4, 56]])
], 480, 270, 2, '#000');
// icons at 128, 64 and 40, next to the icons they sit beside or could be confused with
// Widya next to Lyveus and heroes; Harrowby next to the town humans he stands among as an NPC
const widRow = [['widya', ART.legend('widya')], ['harrowby', ART.legend('harrowby')], ['lyveus', ART.legend('lyveus')], ['priest_f', ART.hero(HEROES[2])], ['bard_elf', ART.hero({ cls: 'bard', race: 'nightelf', gender: 'f' })]];
sheet('widya_heroes', widRow, 256, 256, 5, '#8a9a8a', line);
sheet('widya_heroes_ingame', widRow.concat(widRow.map(([k, s]) => [k, s, '#2a3440'])), 90, 90, 5, '#8a9a8a');
sheet('widya_heroes_small', widRow.concat(widRow.map(([k, s]) => [k, s, '#2a3440'])), 48, 48, 5, '#8a9a8a');
// Sal Brightbell next to the camp humanoids
const salRow = [['sal', ART.mob('sal_brightbell')]].concat(['syndicate_highwayman', 'kurzen_commando'].filter((k) => ART.keys.mobs.includes(k)).map((k) => [k, ART.mob(k)]));
sheet('sal_compare', salRow, 200, 200, salRow.length, '#c8b07a', line);
sheet('sal_compare_small', salRow.concat(salRow.map(([k, s]) => [k, s, '#1e1a22'])), 70, 70, salRow.length, '#c8b07a');
// the new story actors next to Lyveus, big and on a backdrop
const wAct = [['widya', ART.story.actor('widya')], ['harrowby', ART.story.actor('harrowby')], ['lyveus', ART.story.actor('lyveus')]];
sheet('widya_actors', wAct.concat(wAct.map(([k, s]) => [k, s, '#10161c'])), 300, 300, 3, '#6a7a8a');
const wBg = ['mystral_lake', 'stromgarde_keep', 'nesingwary_camp'].filter((k) => ART.keys.scenes.includes(k));
const sceneStage = (bgKey, placements) => {
  let body = nest(ART.scene(bgKey), 0, 0, 480, 270);
  for (const [s, x, y, w] of placements) { const sz = w * 4.8; body += nest(s, x * 4.8, 270 - y * 2.7 - sz, sz, sz); }
  return [bgKey, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 270" width="480" height="270">${body}</svg>`];
};
if (wBg.length) sheet('widya_stage', [sceneStage(wBg[0], [[ART.story.actor('widya'), 42, 2, 32]]), sceneStage(wBg[1] || wBg[0], [[ART.story.actor('harrowby'), 44, 2, 30]]),
  sceneStage(wBg[2] || wBg[0], [[ART.mob('sal_brightbell'), 44, 0, 34]])], 480, 270, 3, '#000');
// art.js: the bard outfit on every race, and the Reedsong Lute worn on the back next to the Silverleaf Aegis
const RACES8 = [['human', 'm'], ['nightelf', 'f'], ['dwarf', 'm'], ['gnome', 'f'], ['orc', 'm'], ['troll', 'f'], ['tauren', 'm'], ['undead', 'f']];
const CLS8 = ['warrior', 'mage', 'hunter', 'rogue', 'shaman', 'priest', 'bard', 'paladin'];
sheet('bard_races', RACES8.map(([r, g]) => [r, ART.hero({ cls: 'bard', race: r, gender: g })]), 160, 160, 8, '#8a9a8a', line);
const backRow = RACES8.map(([r, g], i) => [r, ART.hero({ cls: CLS8[i], race: r, gender: g, gear: { back: 'reedsong_lute' } })]);
sheet('lute_back', backRow.concat(RACES8.map(([r, g], i) => [r, ART.hero({ cls: CLS8[i], race: r, gender: g, gear: { back: 'silverleaf_aegis' } })])), 160, 160, 8, '#8a9a8a', line);
sheet('lute_back_small', backRow.concat(backRow.map(([k, s]) => [k, s, '#2a3440'])), 64, 64, 8, '#8a9a8a');
if (!ART.keys.looks || !ART.keys.looks.back.includes('reedsong_lute')) bad('art.js: reedsong_lute is not a back look');
for (const [r, g] of RACES8) { const s = ART.hero({ cls: 'bard', race: r, gender: g }); if (s.length < 4000) bad('art.js: bard ' + r + ' looks like the placeholder'); }
// Widya's icons next to the bard-adjacent class icons
const wIconRow = WIDYA_ICONS.map((k) => [k, ART.icon(k)]);
for (const sz of [128, 64, 40]) sheet('widya_icons_' + sz, wIconRow, sz, sz, 11, '#1c1a20');
const nearIcons = ['holy_shield', 'shield_wall', 'shield_block', 'crusader_strike', 'divine_protection', 'sword'].filter((k) => ART.keys.icons.includes(k));
const iconRow = NEW.icons.slice(0, 4).map((k) => [k, ART.icon(k)]).concat(nearIcons.map((k) => [k, ART.icon(k)]));
for (const sz of [128, 64, 40]) sheet('icons_' + sz, iconRow, sz, sz, iconRow.length, '#1c1a20');

console.log('packs loaded before: ' + PACKS.join(' '));
console.log('probes: ' + PROBE.scenes.length + ' scenes, ' + PROBE.mobs.length + ' mobs, ' + PROBE.icons.length + ' icons, ' + A.story.keys.actors.length + ' actors, ' + A.story.keys.scenes.length + ' story scenes');
console.log('sizes: ' + Object.values(art).flat().map(([k, s]) => k + '=' + (s.length / 1024).toFixed(1) + 'KB').join(' ') + '; ' + SELF + ' ' + Buffer.byteLength(SRC) + ' bytes');
console.log('sheets:\n  ' + sheets.join('\n  '));
if (notes.length) console.log('notes:\n  ' + notes.join('\n  '));
console.log(problems.length ? 'PROBLEMS (' + problems.length + '):\n  ' + problems.join('\n  ') : 'OK: all checks pass');
process.exitCode = problems.length ? 1 : 0;
