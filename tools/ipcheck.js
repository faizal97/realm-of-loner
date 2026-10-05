// The v10 forbidden-names check: finds every Blizzard name left in what a player can read.
//   node tools/ipcheck.js --snapshot   once, before renaming: writes tools/rename_v10.json, every Blizzard name in
//                                      the game today (from the data and the lore bible), with its kind and region
//   node tools/ipcheck.js              report: where those names still appear (game code, data, app, README); --brief: two lines
//   node tools/ipcheck.js --inventory  writes docs/plans/v10-names-inventory.md, the per-region checklist to review
//   node tools/ipcheck.js --enforce    exits 1 if any name marked "rename" is still in player text (build.py at v10)
//   node tools/ipcheck.js --dist FILE  exits 1 if any rename or forbid name is anywhere in the built page, comments
//                                      included: build.py inlines CSS and JS as they are, so a comment ships too
// tools/rename_v10.json is also the rename map: each entry is { kind, region, status, new }. status "rename" needs a
// new name, "keep" means we decided it is generic enough to stay, "review" (abilities, titles and so on) is undecided,
// "forbid" (Warcraft, Blizzard) has no new name and may only appear in the fan notice.
// Names from our own content (the expansion, Legends) are left out; comments are counted apart from player text.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const MAP = path.join(__dirname, 'rename_v10.json');
const arg = (a) => process.argv.includes(a);

// ---------- our own content: never forbidden
const ORIGINAL_FILES = ['zones/tidewatch.js', 'zones/skullreef.js', 'zones/sunken_archive.js', 'zones/shalzua.js', 'zones/tidecrown.js', 'zones/legends.js'];
// the fan notice may name Blizzard; these lines are skipped
const NOTICE = /Not affiliated with|trademarks? (or registered trademarks )?of Blizzard/;

function snapshot() {
  globalThis.localStorage = { getItem() { return null; }, setItem() {} };
  globalThis.window = globalThis;
  require(path.join(ROOT, 'src/data.js'));
  require(path.join(ROOT, 'src/cutscene.js'));
  const D = globalThis.D;
  const canon = fs.readFileSync(path.join(ROOT, 'docs/lore/canon.md'), 'utf8');
  const section = (t) => { const m = canon.match(new RegExp(`^#{2,3} ${t}[^\\n]*$([\\s\\S]*?)(?=^#{2,3} |(?![\\s\\S]))`, 'm')); return m ? m[1] : ''; };
  const bold = (txt) => [...txt.matchAll(/\*\*([^*]+?)\*\*/g)].map((m) => m[1].replace(/[.,]$/, '').trim());

  // names our own content gives its things
  const original = new Set();
  for (const f of ORIGINAL_FILES) {
    const src = fs.readFileSync(path.join(ROOT, 'src/data', f), 'utf8');
    for (const m of src.matchAll(/\b(?:name|short|title):\s*'((?:[^'\\]|\\.)+)'/g)) original.add(m[1].replace(/\\'/g, "'"));
  }
  for (const s of ['Original characters', 'Places \\(original\\)']) for (const n of bold(section(s))) for (const p of n.split(/ and | \/ |, /)) original.add(p.replace(/^the /i, '').trim());
  const ORIG_REGIONS = new Set(['tidewatch', 'skullreef', 'stormveil']);

  // plain English: a name made only of dictionary words may be generic (Young Wolf); decided per kind below
  const dict = new Set();
  try { for (const w of fs.readFileSync('/usr/share/dict/words', 'utf8').split('\n')) dict.add(w.toLowerCase()); } catch (e) { }
  const generic = (n) => n.split(/[\s-]+/).every((w) => { const x = w.toLowerCase().replace(/[^a-z']/g, '').replace(/'s$/, ''); return !x || ['of', 'the', 'and', 'a', 'to', 'in', 'on'].includes(x) || dict.has(x) || dict.has(x.replace(/s$/, '')); });

  const out = {};
  const put = (name, kind, region, status) => {
    if (!name || original.has(name) || out[name]) return;
    out[name] = { kind, region: region || '', status: status || 'rename', new: null };
  };
  const regionName = (r) => (D.REGIONS[r] || {}).name || r || '';
  // where things live: place → region, npc → place, mob → places
  const npcPlace = {}, mobRegion = {};
  for (const [k, P] of Object.entries(D.PLACES)) {
    for (const n of P.npcs || []) npcPlace[n] = k;
    for (const m of [...(P.mobs || []).map((x) => x[0]), ...Object.keys(P.named || {}), ...Object.keys(P.pool || {})]) if (!mobRegion[m]) mobRegion[m] = P.region;
  }
  // the brand itself, and big lore terms that no single data entry carries
  for (const n of ['Azeroth', 'Warcraft', 'World of Warcraft', 'Blizzard', 'Alliance', 'Horde', 'Eastern Kingdoms', 'Kalimdor', 'Forsaken', 'Night Elf', 'Night Elves', 'Tauren', 'Highborne', 'Burning Legion', 'Well of Eternity', 'Deathwing', 'Black Dragonflight', 'Dark Iron', 'Blackrock', 'Defias', 'Scourge', 'Scarlet Crusade', 'Argent Dawn', 'Kul Tiras', 'Kul Tiran', 'Darkspear', 'Hearthstone'])
    put(n, 'lore', '', 'rename');
  for (const n of bold(section('From the world of Warcraft'))) for (const p of n.split(' / ')) put(p.trim(), 'character', '', 'rename');
  for (const [k, R] of Object.entries(D.REGIONS)) if (!ORIG_REGIONS.has(k)) put(R.name, 'region', R.name);
  for (const [k, P] of Object.entries(D.PLACES)) {
    if (ORIG_REGIONS.has(P.region)) continue;
    put(P.name, 'place', regionName(P.region));
    put(P.zone, 'place', regionName(P.region));
  }
  for (const [k, N] of Object.entries(D.NPCS)) {
    const P = D.PLACES[npcPlace[k]] || {};
    if (ORIG_REGIONS.has(P.region)) continue;
    put(N.name, 'npc', regionName(P.region)); // the whole cast is Blizzard's, even "William Pestle"
  }
  for (const [k, M] of Object.entries(D.MOBS)) {
    if (ORIG_REGIONS.has(mobRegion[k])) continue;
    const named = M.boss || M.named || M.rare || M.elite;
    put(M.name, named ? 'boss or named' : 'monster', regionName(mobRegion[k]), named || !generic(M.name) ? 'rename' : 'keep');
  }
  for (const [k, Q] of Object.entries(D.QUESTS)) {
    const P = D.PLACES[npcPlace[Q.giver]] || {};
    if (ORIG_REGIONS.has(P.region)) continue;
    put(Q.name, 'quest', regionName(P.region), 'rename'); // the titles are Blizzard's word for word
  }
  for (const A of Object.values(D.ACTIVITIES)) put(A.name.replace(/^Wanted: /, ''), 'dungeon or wanted', '', 'rename');
  // Blizzard's own words: the non-English words in the names above (Murloc, Defias, VanCleef, Frostmane)
  const tokens = new Set();
  // folklore and fantasy staples are nobody's: they never make a name Blizzard's by themselves
  const FOLK = new Set('Gnoll Gnolls Kobold Kobolds Goblin Goblins Ogre Ogres Harpy Harpies Centaur Centaurs Naga Satyr Satyrs Wyvern Wyverns Ghoul Ghouls Gargoyle Basilisk Wendigo Yeti Troll Trolls Gnome Gnomes Dwarf Dwarves Elf Elves Orc Orcs Undead Moonfire Starfall'.split(' '));
  for (const [n, v] of Object.entries(out)) if (v.status === 'rename') for (const w of n.split(/[\s-]+/)) { const x = w.replace(/[^A-Za-z']/g, '').replace(/'s$/, ''); if (x.length > 3 && !FOLK.has(x) && !dict.has(x.toLowerCase()) && !dict.has(x.toLowerCase().replace(/s$/, ''))) tokens.add(x); }
  const branded = (n) => n.split(/[\s-]+/).some((w) => tokens.has(w.replace(/[^A-Za-z']/g, '').replace(/'s$/, '')));
  // items and abilities: renamed if they carry a Blizzard word, kept if plain English, otherwise decided by hand
  for (const I of Object.values(D.ITEMS)) put(I.name, 'item', '', branded(I.name) ? 'rename' : generic(I.name) ? 'keep' : 'review');
  for (const A of Object.values(D.ABILITIES)) put(A.name, 'ability', '', branded(A.name) ? 'rename' : 'review');
  for (const T of Object.values(D.TALENTS || {}).flat()) put(T.name, 'talent', '', branded(T.name) ? 'rename' : 'review');
  for (const T of D.TITLES || []) put(T.name, 'title', '', 'review');
  for (const R of Object.values(D.RACES)) if (/Night Elf|Tauren/.test(R.name)) put(R.name, 'race', '', 'rename');
  // too short or too common to search for safely
  for (const n of Object.keys(out)) if (n.length < 4 || /^(The |A )?\w+$/.test(n) && dict.has(n.toLowerCase()) && out[n].status !== 'rename') delete out[n];
  return out;
}

// ---------- scanning
function files() {
  const list = [];
  const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (/\.(js|html|css|json)$/.test(f)) list.push(p); } };
  walk(path.join(ROOT, 'src'));
  for (const f of ['README.md', 'build.py', 'app/pubspec.yaml', 'app/android/app/src/main/AndroidManifest.xml', 'app/lib/main.dart']) if (fs.existsSync(path.join(ROOT, f))) list.push(path.join(ROOT, f));
  return list;
}
function scan(map, which) {
  const names = Object.keys(map).filter(which).sort((a, b) => b.length - a.length);
  if (!names.length) return { hits: [], text: 0, comments: 0 };
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?<![A-Za-z])(?:${names.map(esc).join('|')})(?![A-Za-z])`, 'g');
  const hits = [];
  for (const f of files()) {
    const rel = path.relative(ROOT, f);
    {
      const lines = fs.readFileSync(f, 'utf8').split('\n');
      let inBlock = false;
      lines.forEach((line, i) => {
        if (NOTICE.test(line)) return;
        // split the line into code and comment (a rough cut: // outside quotes, /* */ blocks)
        let code = line, comment = '';
        if (inBlock) { const e = line.indexOf('*/'); if (e < 0) { comment = line; code = ''; } else { comment = line.slice(0, e); code = line.slice(e + 2); inBlock = false; } }
        const b = code.indexOf('/*'); if (b >= 0 && !/['"`][^'"`]*\/\*/.test(code.slice(0, b + 2))) { const e = code.indexOf('*/', b + 2); if (e < 0) { comment += code.slice(b); code = code.slice(0, b); inBlock = true; } else { comment += code.slice(b, e + 2); code = code.slice(0, b) + code.slice(e + 2); } }
        const c = code.match(/(^|[^:'"`\\])\/\/(?![^'"`]*['"`][,)\]}]?\s*$)/); if (c && /\.(js)$/.test(f)) { comment += code.slice(c.index); code = code.slice(0, c.index); }
        for (const m of code.matchAll(re)) hits.push({ file: rel, line: i + 1, name: m[0], comment: false });
        for (const m of comment.matchAll(re)) hits.push({ file: rel, line: i + 1, name: m[0], comment: true });
      });
    }
  }
  return { hits };
}

// ---------- main
if (arg('--snapshot')) {
  if (fs.existsSync(MAP) && !arg('--force')) { console.log('tools/rename_v10.json exists; the snapshot is taken once (use --force to redo it, which loses decisions)'); process.exit(1); }
  const out = snapshot();
  fs.writeFileSync(MAP, JSON.stringify(out, null, 1) + '\n');
  const by = {}; for (const v of Object.values(out)) { const k = `${v.kind} (${v.status})`; by[k] = (by[k] || 0) + 1; }
  console.log(`wrote tools/rename_v10.json: ${Object.keys(out).length} names`); for (const [k, n] of Object.entries(by).sort()) console.log(`  ${k}: ${n}`);
  process.exit(0);
}
if (!fs.existsSync(MAP)) { console.log('no tools/rename_v10.json yet: run node tools/ipcheck.js --snapshot'); process.exit(0); }
const map = JSON.parse(fs.readFileSync(MAP, 'utf8'));

if (arg('--inventory')) {
  const rows = Object.entries(map);
  const regions = [...new Set(rows.map(([, v]) => v.region))].sort((a, b) => (a === '') - (b === '') || a.localeCompare(b));
  const out = ['# v10 names inventory', '', 'Generated by `node tools/ipcheck.js --inventory` from `tools/rename_v10.json`. Every Blizzard name in the game, grouped for review. Decide each region, then its new names go into the map.', ''];
  const tot = {}; for (const [, v] of rows) tot[v.status] = (tot[v.status] || 0) + 1;
  out.push(`**${rows.length} names:** ${Object.entries(tot).map(([k, n]) => `${n} ${k}`).join(', ')}.`, '');
  for (const r of regions) {
    const inR = rows.filter(([, v]) => v.region === r);
    out.push(`## ${r || 'World-wide (lore, dungeons, items, abilities)'} (${inR.length})`, '');
    const kinds = [...new Set(inR.map(([, v]) => v.kind))];
    for (const k of kinds) {
      const ks = inR.filter(([, v]) => v.kind === k);
      out.push(`**${k}** (${ks.length}): ` + ks.map(([n, v]) => v.new ? `${n} → ${v.new}` : v.status === 'rename' ? n : `${n} *(${v.status})*`).join(' · '), '');
    }
  }
  fs.writeFileSync(path.join(ROOT, 'docs/plans/v10-names-inventory.md'), out.join('\n'));
  console.log(`wrote docs/plans/v10-names-inventory.md (${rows.length} names, ${regions.length} groups)`);
  process.exit(0);
}

if (arg('--dist')) {
  const file = process.argv[process.argv.indexOf('--dist') + 1];
  // renamed or forbidden names, and names still under review that already have their new name
  const names = Object.keys(map).filter((n) => ['rename', 'forbid'].includes(map[n].status) || (map[n].status === 'review' && map[n].new)).sort((a, b) => b.length - a.length);
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?<![A-Za-z0-9_])(?:${names.map(esc).join('|')})(?![A-Za-z0-9_])`, 'g');
  const found = [];
  fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => { if (!NOTICE.test(line)) for (const m of line.matchAll(re)) found.push(`  line ${i + 1}: ${m[0]} … ${line.slice(Math.max(0, m.index - 40), m.index + 40).trim()}`); });
  console.log(`old names in the built page: ${found.length}`);
  for (const f of found.slice(0, 10)) console.log(f);
  process.exit(found.length ? 1 : 0);
}

const live = (v) => v.status === 'rename' || v.status === 'review' || v.status === 'forbid';
const { hits } = scan(map, (n) => live(map[n]));
const text = hits.filter((h) => !h.comment), com = hits.filter((h) => h.comment);
const byFile = {}; for (const h of text) byFile[h.file] = (byFile[h.file] || 0) + 1;
const byName = {}; for (const h of text) byName[h.name] = (byName[h.name] || 0) + 1;
const left = Object.keys(map).filter((n) => map[n].status !== 'forbid' && live(map[n]) && !map[n].new).length;
console.log(`Blizzard names still to rename: ${left} of ${Object.keys(map).length} in the map`);
console.log(`in player-facing code and data: ${text.length} places in ${Object.keys(byFile).length} files; in comments: ${com.length}`);
if (!arg('--brief')) for (const [f, n] of Object.entries(byFile).sort((a, b) => b[1] - a[1]).slice(0, 15)) console.log(`  ${String(n).padStart(5)}  ${f}`);
if (!arg('--brief')) console.log('most frequent: ' + Object.entries(byName).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([n, c]) => `${n} ${c}`).join(' · '));
// the old faction names in any capitalisation inside a string literal (#93: "HORDE IN BRACKENFORD!!" passed, because the
// names above match by their case). All lower case is plain English ("the old alliance of men and elves", "a horde of
// ghouls") and the game's own keys ('horde'), so it passes here; what a chat line prints at run time is checked in
// test/factions.test.js. The factions are read from the game (D.FACTIONS in core.js) and the old names from the map (the
// entries renamed to them), so a new faction needs nothing here. A template's ${…} parts are code, not text
function factionLiterals() {
  const core = fs.readFileSync(path.join(ROOT, 'src/data/core.js'), 'utf8'), line = (core.match(/D\.FACTIONS = \{.*\};/) || [''])[0];
  const keys = [...line.matchAll(/(\w+): \{ name: '([^']+)'/g)], names = new Set(keys.map((k) => k[2])), own = new Set(keys.map((k) => k[1]));
  const old = Object.keys(map).filter((n) => map[n].new && names.has(map[n].new));
  if (!old.length) return [];
  const word = new RegExp(`(?<![A-Za-z0-9_])(?:${old.join('|')})(?![A-Za-z0-9_])`, 'gi'), out = [];
  for (const f of files().filter((x) => /[\/]src[\/].*\.js$/.test(x))) {
    const src = fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')); // block comments out, lines kept
    src.split('\n').forEach((ln, i) => {
      if (NOTICE.test(ln)) return;
      const c = ln.match(/(^|[^:'"`\\])\/\/(?![^'"`]*['"`][,)\]}]?\s*$)/); const code = c ? ln.slice(0, c.index + c[1].length) : ln;
      for (const m of code.matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)) {
        const lit = m[3] != null ? m[3].replace(/\$\{[^}]*\}/g, ' ') : (m[1] ?? m[2]);
        if (own.has(lit)) continue;
        if ([...lit.matchAll(word)].some((w) => w[0] !== w[0].toLowerCase())) out.push({ file: path.relative(ROOT, f), line: i + 1, lit });
      }
    });
  }
  return out;
}
const fl = factionLiterals();
console.log(`old faction names in string literals (any capitalisation but all lower case): ${fl.length}`);
for (const h of fl.slice(0, 20)) console.log(`  ${h.file}:${h.line}  '${h.lit.slice(0, 60)}'`);
if (arg('--enforce') && fl.length) process.exit(1);
// --enforce (the build): any live name in player text fails, 'review' ones included (a name under review can already
// have its new name, and then the old one must not come back)
if (arg('--enforce') && text.length) { for (const h of text.slice(0, 20)) console.log(`  ${h.file}:${h.line}  ${h.name}${map[h.name] && map[h.name].new ? ' → ' + map[h.name].new : ''}`); process.exit(1); }
