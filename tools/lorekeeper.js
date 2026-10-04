// The lorekeeper: checks every piece of story text in the game against the lore bible (docs/lore/canon.md).
//   - spoilers: a secret named before the level it is revealed at (the bible's Reveals table)
//   - unknown names: a proper name that is neither in the game data nor in the bible's Names list (typos, invented people)
//   - near misses: an unknown name one or two letters away from a known one ("Van Cleef" for "VanCleef")
//   - faction slips: a quest sending you to the other faction's town
// Text it reads: quest names and text, cutscene captions (story, dungeon intros, Legends), Legend stories, Lore Journal
// pages, NPC names and
// titles, activity names and descriptions. Exits 1 on spoilers and faction slips; unknown names are warnings unless --strict.
// Run: node tools/lorekeeper.js [--strict] [--names]   (--names prints every unknown name once, for adding to the bible)
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
globalThis.window = globalThis;
require(path.join(ROOT, 'src/data.js'));
require(path.join(ROOT, 'src/cutscene.js'));
for (const f of ['engine.js', 'bots.js', 'game.js']) require(path.join(ROOT, 'src', f)); // the game's own screens' words (trophies, #54)
const D = globalThis.D, CS = globalThis.CS, G = globalThis.G;
const STRICT = process.argv.includes('--strict'), LIST = process.argv.includes('--names');

// ---------- the bible
const canon = fs.readFileSync(path.join(ROOT, 'docs/lore/canon.md'), 'utf8');
const section = (title) => { const m = canon.match(new RegExp(`^## ${title}\\s*$([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm')); return m ? m[1] : ''; };
// cells split on unescaped pipes; a \\| inside a cell is a literal | (regex alternation)
const tableRows = (txt) => txt.split('\n').filter((l) => /^\|/.test(l) && !/^\|\s*-/.test(l)).map((l) => l.split(/(?<!\\)\|/).slice(1, -1).map((c) => c.trim().replace(/\\\|/g, '|'))).slice(1);
// | Term | Level | What it gives away | Allowed in |
const REVEALS = tableRows(section('Reveals')).map(([term, lvl, what, allow]) => ({ re: new RegExp(term.replace(/^`|`$/g, ''), 'i'), term, lvl: +lvl, what, allow: (allow || '').split(',').map((s) => s.trim().replace(/`/g, '')).filter(Boolean) }));
// "- **Name** — note" or "- Name — note"; several names can share a line, separated by " / "
const NAMES = new Set();
for (const l of section('Names').split('\n')) { const m = l.match(/^\s*-\s+(.+?)\s+—/); if (m) for (const n of m[1].replace(/\*\*/g, '').split(' / ')) NAMES.add(n.trim()); }

// ---------- what the game already names
const known = new Set();
const addName = (s) => { if (!s) return; for (const w of String(s).split(/[\s,:()"!?.]+/)) if (w) known.add(stripPoss(w)); };
const stripPoss = (w) => w.replace(/^[^A-Za-z]+|[^A-Za-z']+$/g, '').replace(/'s$/, '').replace(/'$/, '');
for (const t of ['NPCS', 'MOBS', 'PLACES', 'ITEMS', 'QUESTS', 'DUNGEONS', 'ACTIVITIES', 'RACES', 'CLASSES', 'REGIONS', 'MOUNTS', 'TITLES', 'LEGENDS', 'PROFESSIONS', 'ABILITIES'])
  for (const v of Object.values(D[t] || {})) { addName(v.name); addName(v.title); addName(v.zone); addName(v.short); addName(v.horde); } // horde: a title's Krugar wording
for (const p of Object.values(D.PLACES)) addName(p.zone);
for (const n of NAMES) addName(n);
// v10: the new names in the rename map are real names too (until the bible is rewritten with them)
try { for (const v of Object.values(JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/rename_v10.json'), 'utf8')))) addName(v.new); } catch (e) { }
for (const n of ['Accord', 'Krugar', 'Caldreth', 'Kingsmere', 'Long', 'Regent', 'Mistress', 'Ledger', 'Rise', 'Hoods', 'Grand']) addName(n);
for (const n of ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']) addName(n); // the calendar (monthly Trialsworn cloaks)
// every-day English, so a capital at the start of a sentence is not a name: tools/words.gz (Webster's Second, 1934, public
// domain: the lowercase words of macOS's /usr/share/dict/words), so the check reads the same on every machine (#88: a CI
// runner has no word list, and plain words then read as names); the system list only if that file is missing
const dict = new Set();
try { for (const w of require('zlib').gunzipSync(fs.readFileSync(path.join(__dirname, 'words.gz'))).toString('utf8').split('\n')) if (w) dict.add(w); }
catch (e) { try { for (const w of fs.readFileSync('/usr/share/dict/words', 'utf8').split('\n')) if (w && w[0] === w[0].toLowerCase()) dict.add(w); } catch (e2) { } }
const COMMON = new Set('I A An The In On At Of To For And But Or Not No Yes Now Then When Where Who What Why How Our Your My His Her Their Its We You He She They It This That These Those There Here Every Each Some Any All One Two Three Four Five Six Seven Eight Nine Ten Twenty Hundred Thousand Kill Bring Find Take Go Head Report Return Speak Talk Deliver Collect Gather Slay Destroy Clear Help Look Let Tell Keep Get Show Come Meet Ask Save Stop Burn Free Heh Deeper Rumours'.split(' '));

// ---------- the text, with the level at which a player can first read it
const texts = [];
const add = (src, lvl, text, extra) => { if (text) texts.push(Object.assign({ src, lvl, text: String(text) }, extra)); };
const instanceLvl = {};
for (const A of Object.values(D.ACTIVITIES)) if (A.dungeon) instanceLvl[A.dungeon] = Math.min(instanceLvl[A.dungeon] || 99, A.minLvl);
for (const c of CS.CHAPTERS) {
  // legend lore is open in the Theater from the start; a quest scene (c.scene) only plays at its quest, at c.level
  const lvl = c.legend && !c.scene ? 1 : c.level != null ? c.level : c.instance ? (instanceLvl[c.instance] || 60) : 60;
  for (const s of c.shots) for (const l of s.lines || []) add(`cutscene ${c.id}`, lvl, l.text.replace(/\{(name|zone)\}/g, ''));
}
for (const [k, Q] of Object.entries(D.QUESTS)) { add(`quest ${k}`, Q.lvl, Q.name, { faction: Q.faction, title: true }); add(`quest ${k}`, Q.lvl, Q.text, { faction: Q.faction, quest: k }); }
for (const [k, L] of Object.entries(D.LEGENDS || {})) (L.story || []).forEach((p, i) => add(`legend ${k} story ${i + 1}`, 15, p));
// a journal page is read at its own lvl, or on first clear (a dungeon's lowest level) or first visit (a zone's lowest level)
const zoneLvl = {}; for (const p of Object.values(D.PLACES)) zoneLvl[p.zone] = Math.min(zoneLvl[p.zone] || 99, p.safe && !p.lvl ? 1 : (p.lvl || [1])[0]);
for (const [k, E] of Object.entries(D.LORE || {})) {
  const lvl = E.lvl != null ? E.lvl : E.dungeon ? (instanceLvl[E.dungeon] || 60) : E.zone ? (zoneLvl[E.zone] || 1) : 1;
  add(`lore ${k}`, lvl, E.title, { title: true });
  (E.text || []).forEach((p, i) => add(`lore ${k} p${i + 1}`, lvl, p));
  for (const [b, note] of Object.entries(E.bosses || {})) add(`lore ${k} boss ${b}`, lvl, note);
}
for (const [q, t] of Object.entries(D.QUEST_STORY || {})) { const Q = D.QUESTS[q]; if (Q) add(`quest ${q} story`, Q.lvl, t, { faction: Q.faction }); }
const placeLvl = {};
for (const [k, p] of Object.entries(D.PLACES)) for (const n of p.npcs || []) placeLvl[n] = Math.min(placeLvl[n] || 99, (p.lvl || [1])[0]);
for (const [k, N] of Object.entries(D.NPCS)) { add(`npc ${k}`, placeLvl[k] || 1, N.name, { title: true }); add(`npc ${k}`, placeLvl[k] || 1, N.title, { title: true }); }
for (const [k, A] of Object.entries(D.ACTIVITIES)) { add(`activity ${k}`, A.minLvl, A.name, { title: true }); add(`activity ${k}`, A.minLvl, A.desc); }
// the Trophies screen is open at any level (#54): every plaque not yet taken, as G.trophyLabel words it, at level 1 and
// just below each Reveals level (where a name may first be allowed)
const plaqueText = (x, lvl, taken) => { const l = G.trophyLabel(x, lvl, taken); return `${l.zone}: ${l.name}, ${l.place}`; };
const atLevels = [...new Set([1].concat(REVEALS.map((r) => r.lvl - 1)).filter((l) => l >= 1))];
for (const x of G.trophyList()) for (const L of atLevels) add(`trophy ${x.key}`, L, plaqueText(x, L, false), { title: true });
// the Effects codex is open at any level too (#55): every effect item's name and sources, as G.effectSources words them
for (const id of Object.keys(D.ITEMS).filter((i) => D.ITEMS[i].effect)) for (const L of atLevels) add(`effects codex ${id}`, L, G.effectSources(id, L).join('. '), { title: true });
// #58: every list screen that names things, as a character of each faction would read it at each of those levels,
// through the same code the screens use: Titles (G.titleLabel), the wardrobe's uncollected looks for every class
// (G.wardrobeAll), and the group finder with its briefings (each activity G.activityBlock lists: its name, description,
// pull labels, creatures and boss loot), assuming the worst case (every place reachable, any week's world boss out).
// (Trophies and the Effects codex are above.) A legend's story fight is listed only on its quest (checked at its level)
{
  const reach = G.canReach, wb = G.worldBoss; let out = null;
  G.canReach = () => true; G.worldBoss = () => out;
  for (const race of ['human', 'orc']) {
    G.newGame({ name: 'Sweep', cls: 'warrior', race }); const P = G.S.player;
    for (const L of atLevels) {
      P.level = L;
      for (const t of D.TITLES) { const lb = G.titleLabel(t, L, false, 'Sweep'); add(`screen titles ${t.id} (${race})`, L, `${lb.name}. ${lb.how || ''}`, { title: true }); }
      for (const cls of Object.keys(D.CLASSES)) { P.cls = cls;
        for (const pl of G.WARDROBE_PLACES) for (const o of G.wardrobeAll(pl)) if (!o.have) add(`screen wardrobe ${pl} ${o.key}`, L, `${o.name}. ${o.source || ''}`, { title: true }); }
      P.cls = 'warrior';
      for (const [k, A] of Object.entries(D.ACTIVITIES)) {
        if (A.needQuest) continue; out = A.worldBoss ? k : null;
        if (G.activityBlock(k) === 'hidden') continue;
        add(`screen group finder ${k}`, L, G.activityText(k), { title: true });
      }
    }
  }
  G.canReach = reach; G.worldBoss = wb;
}
// #69: generated chat, as each level's reader sees it: a character of each faction at level 1 and just below each
// Reveals level, on a server 20 days on, an hour of General, LFG, say, guild, whispers and the social requests (every
// line a bot sends goes through B.post's check). Bot names are random, so these lines are checked for spoilers only
{
  require(path.join(ROOT, 'src/social.js'));
  const RealNow = Date.now; let clock = RealNow();
  Date.now = () => clock;
  try {
    for (const race of ['human', 'orc']) for (const L of atLevels) {
      G.newGame({ name: 'Sweep', cls: 'mage', race }); const S = G.S; S.player.level = L; globalThis.B.advance(S, 20 * 864e5);
      S.chat = []; const t0 = clock;
      for (let sec = 0; sec < 3600; sec += 2) { clock = t0 + sec * 1000; globalThis.B.chatTick(S, clock); if (globalThis.SOC && SOC.tick) try { SOC.tick(); } catch (e) { } }
      for (const m of S.chat) if (m.from && m.ch !== 'system') add(`chat ${m.ch} (${race}, level ${L})`, L, m.text, { spoilerOnly: true });
    }
  } finally { Date.now = RealNow; }
}
// the game's copy of the Reveals table (src/data/reveals.js, which G.nameable reads) must be the bible's
const revealsDrift = (game) => JSON.stringify(game.map(([re, l]) => [re, +l])) !== JSON.stringify(REVEALS.map((r) => [r.re.source, r.lvl]));

// --selftest: plant one mistake of each kind and make sure each is caught
const SELF = process.argv.includes('--selftest');
if (SELF) {
  add('selftest spoiler', 20, 'The Ledger answers to Veshmira, I swear it.');
  add('selftest spoiler2', 30, 'They say Hale is alive in the mountain.');
  add('selftest faction', 20, 'Take this back to Kingsmere and report to the guards.', { faction: 'horde', quest: 'selftest' });
  add('selftest typo', 20, 'The Blackwel gang is back, and Carow knows it.');
  add('selftest unknown', 20, 'Ask old Zorbulax about it.');
  add('selftest hood', 17, 'The stranger, Lyveus, wants a word.');
  // a plaque worded without the level check (as if taken), and a game copy of Reveals that lost a row
  const wi = G.trophyList().find((x) => x.key === 'warden_ithrael'); if (wi) add('selftest trophy', 1, plaqueText(wi, 1, true), { title: true });
  add('selftest chat', 10, 'anyone for The Tidecrown Citadel? lf healer', { spoilerOnly: true }); // a bot line the chat check would have stopped
  add('selftest codex', 1, G.effectSources('brittle_crown_signet', 60).join('. '), { title: true }); // a source worded for level 60, read at 1
  { const t = D.TITLES.find((x) => x.id === 'tidecrown'); if (t) { const lb = G.titleLabel(t, 1, true, 'Sweep'); add('selftest titles', 1, `${lb.name}. ${lb.how}`, { title: true }); } } // as if earned
}
// ---------- checks
// words the game itself writes in lower case are plain English, so their capitalised form at a sentence start is not a name
const lowerWords = new Set(); for (const t of texts) for (const w of t.text.split(/[^A-Za-z']+/)) if (w && /^[a-z]/.test(w)) lowerWords.add(w);
const problems = [], warnings = [], unknown = new Map();
if (revealsDrift(SELF ? D.REVEALS.slice(1) : D.REVEALS)) problems.push(`REVEALS  src/data/reveals.js differs from the bible's Reveals table: copy the bible's rows (term, level) into it`);
const lev = (a, b) => { const m = a.length, n = b.length; const d = Array.from({ length: m + 1 }, (_, i) => [i]); for (let j = 1; j <= n; j++) d[0][j] = j; for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[m][n]; };
const knownList = [...known].filter((w) => w.length >= 5);
const allowed = (r, src) => r.allow.some((a) => src === a || src.startsWith(a + ' ') || src.startsWith(a));
for (const t of texts) {
  // spoilers
  for (const r of REVEALS) if (t.lvl < r.lvl && r.re.test(t.text) && !allowed(r, t.src)) problems.push(`SPOILER  ${t.src} (level ${t.lvl}) names "${t.text.match(r.re)[0]}" before level ${r.lvl}: ${r.what}`);
  if (t.spoilerOnly) continue; // generated chat: bot names are random, so only the spoiler check applies
  // faction slips: a quest that sends you into the other faction's town
  if (t.quest && t.faction) {
    const re = /\b(?:[Gg]o|[Hh]ead|[Rr]eturn|[Rr]eport|[Tt]ravel|[Tt]ake (?:it|this|them|these)|[Bb]ring (?:it|this|them|these)|[Dd]eliver (?:it|this|them|these))(?: back)? to ([A-Z][\w']*(?: [A-Z][\w']*)*)/g;
    let m; while ((m = re.exec(t.text))) {
      // a place by name, or a city by its zone ("Stormwind" is the zone of the Trade District)
      const pl = Object.entries(D.PLACES).find(([, p]) => p.name === m[1] || (p.name.startsWith(m[1]) && m[1].length > 5)) || Object.entries(D.PLACES).find(([, p]) => (p.safe || p.city) && p.zone && (p.zone === m[1] || p.zone.startsWith(m[1] + ' ')));
      if (!pl) continue;
      const P = pl[1]; const f = P.faction || ((P.safe || P.city) && (D.REGIONS[P.region] || {}).faction);
      if (f && f !== 'contested' && f !== t.faction) problems.push(`FACTION  ${t.src} (${t.faction}) sends you to ${P.name}, a ${f} town`);
    }
  }
  // unknown names
  const sentences = t.text.split(/(?<=[.!?:;"])\s+/);
  for (const sen of sentences) {
    const words = sen.split(/\s+/);
    words.forEach((raw, i) => {
      const w = stripPoss(raw);
      if (!w || !/^[A-Z]/.test(w) || /^[A-Z]+$/.test(w) && w.length <= 3) return;
      const first = i === 0 || /^["'(]/.test(raw);
      // plurals and possessives of known names ("Kobolds", "Stonemasons'"), contractions at a sentence start ("Don't")
      const base = w.replace(/'$/, '').replace(/(?:'ll|'ve|n't|'re|'d|'m)$/, '');
      const sing = [base, base.replace(/s$/, ''), base.replace(/es$/, ''), base.replace(/ies$/, 'y'), base.replace(/ves$/, 'f'),
        base.replace(/ing$/, ''), base.replace(/ing$/, 'e'), base.replace(/ed$/, ''), base.replace(/ed$/, 'e'), base.replace(/ly$/, '')]; // and word forms: Releasing, Slowed, Quietly
      if (sing.some((x) => known.has(x) || COMMON.has(x))) return;
      const english = (x) => dict.has(x.toLowerCase()) || lowerWords.has(x.toLowerCase()) || sing.some((y) => dict.has(y.toLowerCase()) || lowerWords.has(y.toLowerCase()));
      if ((first || t.title) && english(base)) return;
      // hyphenated words: fine if every part is a known name or plain English ("Black-furred", "Twenty-one")
      if (base.includes('-') && base.split('-').every((p) => known.has(p) || COMMON.has(p) || dict.has(p.toLowerCase()))) return;
      if (!unknown.has(w)) unknown.set(w, []);
      unknown.get(w).push(t.src);
    });
  }
}
for (const [w, srcs] of unknown) {
  const near = w.length >= 5 ? knownList.find((k) => k !== w && Math.abs(k.length - w.length) <= 2 && lev(k.toLowerCase(), w.toLowerCase()) <= (w.length >= 8 ? 2 : 1)) : null;
  const line = `NAME     "${w}" is not in the game data or the bible (${srcs.length}×, first in ${srcs[0]})${near ? ` — did you mean "${near}"?` : ''}`;
  if (near) problems.push(line); else warnings.push(line);
}

if (SELF) {
  const all = problems.concat(warnings).join('\n');
  const want = [['spoiler', /SPOILER  selftest spoiler /], ['trophy plaque', /SPOILER  selftest trophy /], ['codex source', /SPOILER  selftest codex /], ['chat line', /SPOILER  selftest chat /], ['titles screen', /SPOILER  selftest titles /], ['reveals copy', /REVEALS  src\/data\/reveals\.js differs/], ['hale', /SPOILER  selftest spoiler2/], ['faction', /FACTION  selftest/], ['typo Blackwell', /"Blackwel".*did you mean "Blackwell"/], ['typo Carrow', /"Carow".*did you mean "Carrow"/], ['unknown name', /"Zorbulax"/], ['hooded stranger', /SPOILER  selftest hood/]];
  let bad = 0; for (const [k, re] of want) { const ok = re.test(all); if (!ok) bad++; console.log(`${ok ? 'caught' : 'MISSED'}  ${k}`); }
  process.exit(bad ? 1 : 0);
}
if (LIST) { console.log([...unknown.keys()].sort().join('\n')); process.exit(0); }
console.log(`lorekeeper: ${texts.length} texts, ${REVEALS.length} reveals, ${NAMES.size} bible names`);
for (const p of problems) console.log(p);
for (const w of warnings.slice(0, STRICT ? 1e9 : 40)) console.log(w);
if (!STRICT && warnings.length > 40) console.log(`... and ${warnings.length - 40} more unknown names (run with --strict to see all)`);
const fail = problems.length || (STRICT && warnings.length);
console.log(fail ? `lorekeeper: ${problems.length} problem(s)${STRICT ? `, ${warnings.length} unknown name(s)` : ''}` : `lore OK${warnings.length ? ` (${warnings.length} unknown names to review)` : ''}`);
process.exit(fail ? 1 : 0);
