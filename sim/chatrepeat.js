// Bot chat: how repetitive and how cohesive is it? (Faizal, via the Lead.) A level-60 player with a guild plays two hours a
// day for a week (the rest of each day away, then the game's own catch-up): 40 min in a capital, a group-finder dungeon,
// a battleground, then out in the world. Everything bots say that the player would see is collected (General, LFG, say,
// guild, whispers, party, the battleground, catch-up), in minutes of play.
// Repetition: an EXACT repeat is a line the player has seen before (case and end punctuation ignored, as sloppy() only
// changes those); a TEMPLATE repeat is the same line with names, places, items, dungeons, numbers and money swapped.
// Cohesion (heuristics, each named in the report): identity fit (a ding number against the bot's level, content above
// its level, "my <class>" against its class, asking for its own role), threading (a scheduled reply right after a line
// in the same channel, or naming a recent speaker), contradictions (the same bot in 10 min), world fit (time-of-day words
// against the clock, a hunt rare said to be up, a world boss named against this week's), memory (a bot naming the player).
//   ROOT=~/azeroth-solo-measure node sim/chatrepeat.js [players, default 4]      JSON=1: also print the raw tallies
const ROOT = process.env.ROOT || require('path').join(__dirname, '..');
let seedS = (0x5eed1e55 ^ Math.imul(+(process.env.SEED || 0) + 1, 0x9E3779B1)) >>> 0; Math.random = () => { seedS = (seedS + 0x6D2B79F5) >>> 0; let x = seedS; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
const RealDate = Date; let t = new RealDate(2026, 9, 12, 18, 0).getTime(); // a Monday, 18:00 local
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(t); } static now() { return t; } };
for (const f of ['data', 'engine', 'bots', 'game', 'social', 'trials']) require(ROOT + '/src/' + f + '.js');
const { G, D, B, SOC } = globalThis;
const NP = +process.argv[2] || 4, DAYS = +process.env.DAYS || 7, PLAY_MIN = 120, LV = +process.env.LV || 60; // LV: the reading player's level (#69)
// the bible's Reveals table (docs/lore/canon.md), read as tools/lorekeeper.js reads it, so this check doesn't lean on the game's copy
const canon = require('fs').readFileSync(ROOT + '/docs/lore/canon.md', 'utf8'), sect = (ti) => { const m = canon.match(new RegExp(`^## ${ti}\\s*$([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm')); return m ? m[1] : ''; };
const REVEALS = sect('Reveals').split('\n').filter((l) => /^\|/.test(l) && !/^\|\s*-/.test(l)).map((l) => l.split(/(?<!\\)\|/).slice(1, -1).map((c) => c.trim().replace(/\\\|/g, '|'))).slice(1).map(([term, lvl]) => ({ re: new RegExp(term.replace(/^`|`$/g, ''), 'i'), term, lvl: +lvl }));
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const exactKey = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim().replace(/[.!?]+$/, '');
let NAMES = null;
function names(S) { // every proper name the game can put in a line, longest first
  const set = new Set();
  for (const T of ['PLACES', 'MOBS', 'ITEMS', 'NPCS', 'QUESTS', 'DUNGEONS', 'ACTIVITIES', 'REGIONS', 'CLASSES', 'RACES', 'MOUNTS', 'PROFESSIONS', 'NODES', 'ABILITIES']) for (const k in D[T] || {}) { const n = D[T][k] && D[T][k].name; if (n && n.length >= 4) set.add(n.toLowerCase().replace(/^the /, '')); }
  for (const b of S.bots) if (b.name) set.add(b.name.toLowerCase());
  for (let g = 0; g < 40; g++) { try { const i = SOC.guildInfo(g); if (i && i.name) set.add(i.name.toLowerCase()); } catch (e) { break; } }
  set.add(S.player.name.toLowerCase());
  return new RegExp('\\b(' + [...set].sort((a, b) => b.length - a.length).map(esc).join('|') + ')\\b', 'g');
}
const tmplKey = (s) => exactKey(s).replace(NAMES, '<n>').replace(/\b\d+(?:[.,]\d+)?\s*[gsc]\b/g, '<$>').replace(/\d[\d,.]*/g, '#').replace(/(<\$>\s*)+/g, '<$> ');
const CLASSN = Object.keys(D.CLASSES), ROLE_WORD = { tank: 'tank', healer: 'heal(?:er|s)?', dps: 'dps' };
function player(i) {
  const race = i % 2 ? 'orc' : 'human', cls = ['warrior', 'priest', 'mage', 'rogue'][i % 4];
  G.newGame({ name: ['Aldren', 'Brakka', 'Corwyn', 'Dusk'][i % 4], cls, race }); const S = G.S, P = S.player; P.level = LV; P.money = 1e7;
  Object.assign(S.flags, { warModeAsked: true, warMode: false, stormBroken: true });
  P.equip = G.botChar({ name: 'x', cls, race, level: LV, skill: 0.7 }).equip; P.talents = G.autoTalents(cls, 'dps', LV, 0);
  B.advance(S, 30 * 864e5); // a server 30 days on, as a level-60 player finds it (median bot about 37, a quarter at 60)
  const gs = SOC.myGuilds(); const g = gs.find((x) => LV >= x.min); if (g) P.guild = g.g;
  return S;
}
const RUNS = [], BGS = []; // how each day's dungeon and battleground ended
const cap = (S) => (S.player.race === 'orc' ? 'orgrimmar' : 'stormwind');
function runAll() {
  const lines = [], met = new Set(); // met: bots the player has grouped with
  for (let i = 0; i < NP; i++) {
    const S = player(i); NAMES = names(S); let play = 0, lastId = 0; const pendingSeen = new Map();
    const collect = () => {
      for (const p of S.pending || []) pendingSeen.set(p.text, p.ch);
      if (S.group) for (const m of S.group.members) if (m.bot) met.add(m.bot.id != null ? m.bot.id : m.name);
      for (const m of S.chat) { if (m.id <= lastId) continue; lastId = Math.max(lastId, m.id);
        if (!m.from || m.me || ['system', 'combat', 'loot'].includes(m.ch)) continue;
        const bot = S.bots.find((b) => b.id === m.fromId) || (S.group && (S.group.members.find((x) => x.name === m.from) || {}).bot) || null;
        lines.push({ p: i, min: play, t, ch: m.ch, from: m.from, fromId: m.fromId, bot: bot && { level: bot.level, cls: bot.cls, role: bot.role, guild: bot.guild }, text: m.text, scheduled: pendingSeen.get(m.text) === m.ch, met: met.has(m.fromId) || met.has(m.from), online: B.onlineCount(S, new RealDate(t)), myName: S.player.name.toLowerCase(), wb: G.worldBoss(new RealDate(t)) }); }
    };
    const tick = (secs) => { for (let s = 0; s < secs; s++) { if (G.fight && G.pUnit && G.pUnit.kind === 'player') { G.pUnit.kind = 'bot'; G.pUnit.bot = { skill: 0.7, react: 0.45 }; G.pUnit.role = G.role(); } if (S.run && S.run.phase === 'rest' && t >= (S.run.restUntil || 0) && G.runReady) G.runReady(); // the player taps ready (a tank pulls)
      for (const r of (S.run && S.run.rolls) || []) if (!r.done && r.player && r.choice == null) { try { G.roll(S.run.rolls.indexOf(r), 'greed'); } catch (e) {} } G.update(1); t += 1000; collect(); } };
    for (let day = 0; day < DAYS; day++) {
      const start = t;
      S.player.place = cap(S); tick(40 * 60); play += 0; // capital
      const minNow = () => Math.round((t - start) / 60000);
      // a group-finder dungeon (bot-driven), then a battleground, then the world
      const dun = Object.keys(D.ACTIVITIES).filter((k) => { const A = D.ACTIVITIES[k]; return A.dungeon && !A.worldBoss && !A.needQuest && (A.size || 5) <= 5 && A.minLvl <= LV && (A.maxLvl || 60) >= LV && !A.trial && !/hard|bg_/.test(k); }); if (dun.length) G.queueFor(dun[day % dun.length]); for (let g = 0; g < 600 && S.queue && !S.queue.popped; g++) tick(1); if (S.queue) G.acceptPop(); if (S.run) S.run.pace = 'normal'; // the pull pace, as sim/tactics.js sets it
      for (let g = 0; g < 3600 && S.run && S.run.phase !== 'done'; g++) tick(1); RUNS.push(S.run ? S.run.phase : 'none'); if (S.group || S.run) try { G.leaveGroup(); } catch (e) {}
      if (LV >= 10) G.queueFor('bg_highmoor'); for (let g = 0; g < 600 && S.queue && !S.queue.popped; g++) tick(1); if (S.queue) G.acceptPop();
      for (let g = 0; g < 1800 && S.bg && S.bg.phase !== 'done'; g++) { if (S.bg.phase === 'choose' && !G.fight) { const n = D.BG.highmoor.banners.map((x) => x[0]); G.bgGo(n[0], n[1]); } tick(1); }
      BGS.push(S.bg ? S.bg.phase : 'none'); if (S.bg && G.leaveBg) try { G.leaveBg(); } catch (e) {}
      S.player.place = LV >= 58 ? 'scorched_fen' : (Object.keys(D.PLACES).find((k) => { const p = D.PLACES[k]; return p.lvl && p.lvl[0] <= LV && p.lvl[1] >= LV && !p.safe && !p.city && G.dangerOf(k) === 0; }) || cap(S)); while (minNow() < PLAY_MIN) tick(60);
      // away until the next day's session, then the game's catch-up
      S.lastSeen = t; t += (24 * 60 - PLAY_MIN) * 60000; G.catchUp(); collect();
      for (const l of lines) if (l.p === i && l.min === 0 && l.day == null) l.day = day; // (filled below)
    }
  }
  return lines;
}
// the play-minute of each line: rebuilt from wall time per player (sessions are PLAY_MIN long, catch-up at each start)
function playMinutes(lines) { const first = {}; for (const l of lines) { if (first[l.p] == null) first[l.p] = l.t; const d = l.t - first[l.p], day = Math.floor(d / 864e5); l.day = Math.min(DAYS - 1, day); l.pm = day * PLAY_MIN + Math.min(PLAY_MIN, (d - day * 864e5) / 60000); } }
const lines = runAll(); playMinutes(lines);
for (const l of lines) { l.ek = exactKey(l.text); l.tk = tmplKey(l.text); }
// ---- repetition, per player, over its own stream
const pct = (a, b) => (b ? (a / b) * 100 : 0).toFixed(1) + '%';
const windows = [['first hour', 60], ['first day (2 h)', PLAY_MIN], ['week (14 h)', DAYS * PLAY_MIN]];
const rep = {}; const firstRep = { exact: [], tmpl: [] };
for (let p = 0; p < NP; p++) { const L = lines.filter((l) => l.p === p).sort((a, b) => a.pm - b.pm); const se = new Set(), st = new Set(); let fe = null, ft = null;
  for (const l of L) { l.rE = se.has(l.ek); l.rT = st.has(l.tk); se.add(l.ek); st.add(l.tk); if (l.rE && fe == null) fe = l.pm; if (l.rT && ft == null) ft = l.pm; }
  firstRep.exact.push(fe); firstRep.tmpl.push(ft); }
console.log(`dungeon runs ended: ${RUNS.join(',')} · battlegrounds ended: ${BGS.join(',')}`);
console.log(`players ${NP} · ${DAYS} days × ${PLAY_MIN} min of play · ${lines.length} bot lines seen (${(lines.length / NP / (DAYS * PLAY_MIN / 60)).toFixed(0)} an hour per player)`);
console.log('\n== repetition (share of lines the player has seen before)');
for (const [n, w] of windows) { const L = lines.filter((l) => l.pm < w); console.log(`${n.padEnd(16)} ${String(L.length).padStart(6)} lines · exact repeats ${pct(L.filter((l) => l.rE).length, L.length)} · template repeats ${pct(L.filter((l) => l.rT).length, L.length)}`); }
const chs = [...new Set(lines.map((l) => l.ch))];
console.log('by channel, over the week: ' + chs.map((c) => { const L = lines.filter((l) => l.ch === c); return `${c} ${L.length} lines, exact ${pct(L.filter((l) => l.rE).length, L.length)}, template ${pct(L.filter((l) => l.rT).length, L.length)}`; }).join(' · '));
const fmt = (a) => a.map((x) => (x == null ? 'none' : x.toFixed(1))).join(' / ');
console.log(`time to first repeat (minutes of play, per player): exact ${fmt(firstRep.exact)} · template ${fmt(firstRep.tmpl)}`);
// ---- per bot
const byBot = {}; for (const l of lines) { const k = l.p + ':' + l.from; (byBot[k] = byBot[k] || []).push(l); }
const bots = Object.values(byBot), many = bots.filter((b) => b.length >= 5);
const selfRep = many.map((b) => { const s = new Set(); let r = 0; for (const l of b) { if (s.has(l.tk)) r++; s.add(l.tk); } return { n: b.length, distinct: s.size, rep: r / b.length }; });
const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[s.length >> 1] : 0; };
console.log(`\n== per bot (bots the player heard 5+ times in a week: ${many.length} of ${bots.length}) · lines per bot median ${med(many.map((b) => b.length))}, max ${Math.max(...many.map((b) => b.length))} · distinct templates per bot median ${med(selfRep.map((x) => x.distinct))} · the same bot repeating its own template: median ${(med(selfRep.map((x) => x.rep)) * 100).toFixed(0)}% of its lines, worst ${(Math.max(...selfRep.map((x) => x.rep)) * 100).toFixed(0)}%`);
// ---- top repeated templates and pool sizes
const tcount = {}; for (const l of lines) { const k = l.ch + ' | ' + l.tk; tcount[k] = (tcount[k] || 0) + 1; }
console.log('\n== top 20 templates over the week (all players; count, channel | template)');
Object.entries(tcount).sort((a, b) => b[1] - a[1]).slice(0, 20).forEach(([k, n], i) => console.log(`${String(i + 1).padStart(2)}. ${String(n).padStart(5)}  ${k}`));
console.log('\n== pool seen per channel over the week (distinct templates · lines · lines per template)');
for (const c of chs) { const L = lines.filter((l) => l.ch === c), d = new Set(L.map((l) => l.tk)).size; console.log(`  ${c.padEnd(8)} ${String(d).padStart(5)} templates · ${String(L.length).padStart(6)} lines · ${(L.length / d).toFixed(1)} each`); }
// ---- cohesion
const ex = {}, addEx = (k, l) => { (ex[k] = ex[k] || []).push(`${l.ch} ${l.from}${l.bot ? ` (L${l.bot.level} ${l.bot.cls}${l.bot.role ? ' ' + l.bot.role : ''})` : ''}: ${l.text}`); };
const ID = { ding: 0, above: 0, cls: 0, role: 0, checked: 0 }, ACT = Object.values(D.ACTIVITIES).filter((a) => a.minLvl).map((a) => ({ re: new RegExp('\\b' + esc(a.name.toLowerCase().replace(/^the /, '')) + '\\b'), lvl: a.minLvl, name: a.name }));
for (const l of lines) { if (!l.bot || l.bot.level == null) continue; ID.checked++; const s = l.text.toLowerCase();
  const d = s.match(/\bding(?:ed)?\b[^\d]{0,12}(\d+)|\b(\d+) ding\b/); if (d) { const n = +(d[1] || d[2]); if (Math.abs(n - l.bot.level) > 1) { ID.ding++; addEx('ding', l); } }
  const a = ACT.find((x) => x.re.test(s)); if (a && a.lvl > l.bot.level + 3) { ID.above++; addEx('above', l); }
  const c = s.match(new RegExp('\\b(?:my|leveling (?:my )?|levelling (?:my )?|as an? )(' + CLASSN.join('|') + ')\\b')); if (c && c[1] !== l.bot.cls) { ID.cls++; addEx('cls', l); }
  if (l.bot.role && ROLE_WORD[l.bot.role] && new RegExp('\\b(?:lf\\d?m?|need|missing|looking for)\\b[^.]{0,20}\\b' + ROLE_WORD[l.bot.role] + '\\b').test(s)) { ID.role++; addEx('role', l); } }
const thread = { reply: 0, names: 0 }; const byP = {}; for (const l of lines) (byP[l.p] = byP[l.p] || []).push(l);
for (const L of Object.values(byP)) { L.sort((a, b) => a.t - b.t); for (let k = 0; k < L.length; k++) { const l = L[k]; const prev = L.slice(Math.max(0, k - 8), k).filter((x) => x.t > l.t - 120000);
  if (l.scheduled && prev.some((x) => x.ch === l.ch && x.from !== l.from && l.t - x.t <= 12000)) { thread.reply++; continue; }
  if (prev.some((x) => x.from !== l.from && new RegExp('\\b' + esc(x.from.toLowerCase()) + '\\b').test(l.text.toLowerCase()))) thread.names++; } }
const contra = { n: 0 }; for (const L of Object.values(byP)) { const last = {}; for (const l of L) { const s = l.text.toLowerCase(), isLf = l.ch === 'lfg' && /\b(lf\d?m|lfg|wanted|missing|need)\b/.test(s), a = ACT.find((x) => x.re.test(s));
  const pr = last[l.from]; if (pr && l.t - pr.t < 600000) { if (isLf && pr.isLf && a && pr.a && a.name !== pr.a.name) { contra.n++; addEx('contra', l); } if (pr.isLf && /\b(already (?:in|got)|full group|grouped|in a run|found a group)\b/.test(s)) { contra.n++; addEx('contra', l); } }
  last[l.from] = { t: l.t, isLf, a }; } }
const hour = (l) => new RealDate(l.t).getHours(), tod = (h) => (h >= 5 && h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night');
const W = { tod: 0, todN: 0, rare: 0, rareN: 0, wb: 0, wbN: 0, busy: 0, busyN: 0 }; const onl = lines.map((l) => l.online).sort((a, b) => a - b), onMed = onl[onl.length >> 1];
const RARES = G.huntRares().map((r) => ({ key: r.key, re: new RegExp('\\b' + esc(D.MOBS[r.key].name.toLowerCase()) + '\\b') })), WBS = G.worldBossActs().map((k) => ({ act: k, re: new RegExp('\\b' + esc(D.MOBS[D.ACTIVITIES[k].boss].name.toLowerCase().split(',')[0]) + '\\b') }));
for (const l of lines) { const s = l.text.toLowerCase(), h = hour(l), now = tod(h);
  const m = s.match(/\b(tonight|night|morning|afternoon|evening)\b/); if (m) { W.todN++; const say = m[1] === 'tonight' ? 'evening|night' : m[1]; if (!new RegExp(say).test(now) && !(m[1] === 'tonight' && now === 'evening')) { W.tod++; addEx('tod', Object.assign({}, l, { text: l.text + `  [at ${h}:00]` })); } }
  const r = RARES.find((x) => x.re.test(s)); if (r && /\b(up|spotted|sighting|seen|spawn)/.test(s)) { W.rareN++; if (!G.huntUp(r.key, l.t)) { W.rare++; addEx('rare', l); } }
  const w = WBS.find((x) => x.re.test(s)); if (w) { W.wbN++; if (w.act !== l.wb) { W.wb++; addEx('wb', l); } }
  if (/\b(packed|busy|full|dead|empty|quiet)\b/.test(s) && /\b(server|realm|tonight|today|here)\b/.test(s)) { W.busyN++; const busy = /\b(packed|busy|full)\b/.test(s); if ((busy && l.online < onMed) || (!busy && l.online >= onMed)) { W.busy++; addEx('busy', Object.assign({}, l, { text: l.text + `  [${l.online} online, median ${onMed}]` })); } } }
const MEM = { n: 0, met: 0 }; for (const l of lines) { if (new RegExp('\\b' + esc(l.myName) + '\\b').test(l.text.toLowerCase()) || (/\b(again|last time|remember|earlier)\b/.test(l.text.toLowerCase()) && ['whisper', 'party', 'guild'].includes(l.ch))) { MEM.n++; if (l.met) MEM.met++; else addEx('mem', l); } }
console.log('\n== cohesion (heuristics; rates over the lines each check can read)');
console.log(`identity fit, of ${ID.checked} lines from a known bot: ding number ≠ its level ${ID.ding} · names content ≥4 levels above it ${ID.above} · "my <class>" not its class ${ID.cls} · asks for its own role ${ID.role} · misfit total ${pct(ID.ding + ID.above + ID.cls + ID.role, ID.checked)}`);
console.log(`threading: replies to a line in the last 12 s ${pct(thread.reply, lines.length)} · name a recent speaker ${pct(thread.names, lines.length)} · standalone ${pct(lines.length - thread.reply - thread.names, lines.length)}`);
console.log(`contradictions (same bot, 10 min): ${contra.n} (${pct(contra.n, lines.length)} of lines)`);
console.log(`world fit: time-of-day words wrong ${W.tod} of ${W.todN} · hunt rare said to be up when it isn't ${W.rare} of ${W.rareN} · world boss named not this week's ${W.wb} of ${W.wbN} · busy/quiet claims against who's online ${W.busy} of ${W.busyN}`);
console.log(`memory: lines naming the player or an earlier time ${MEM.n} · from a bot the player had grouped with ${MEM.met} · from one it hadn't ${MEM.n - MEM.met}`);
// #69: content named above the speaker's level + 3 (dungeons and raids, places, named creatures), and Reveals terms above the reader's level
const CONTENT = []; const addC = (name, lvl, kind) => { if (!name || !(lvl > 0)) return; const n = name.toLowerCase().replace(/^the /, ''); if (n.length < 5) return; CONTENT.push({ re: new RegExp('\\b' + esc(n) + '\\b'), lvl, kind, name }); };
for (const k in D.ACTIVITIES) addC(D.ACTIVITIES[k].name, D.ACTIVITIES[k].minLvl, 'activity');
for (const k in D.PLACES) addC(D.PLACES[k].name, D.PLACES[k].lvl && D.PLACES[k].lvl[0], 'place');
for (const k in D.MOBS) if (D.MOBS[k].named || D.MOBS[k].boss) addC(D.MOBS[k].name, D.MOBS[k].lvl && D.MOBS[k].lvl[0], 'creature');
const C69 = { above: 0, checked: 0, reveal: 0 };
for (const l of lines) { const s = l.text.toLowerCase();
  if (l.bot && l.bot.level != null) { C69.checked++; const hit = CONTENT.find((c) => c.lvl > l.bot.level + 3 && c.re.test(s)); if (hit) { C69.above++; addEx('above69', Object.assign({}, l, { text: l.text + `  [${hit.kind} ${hit.name} level ${hit.lvl}]` })); } }
  const r = REVEALS.find((x) => LV < x.lvl && x.re.test(l.text)); if (r) { C69.reveal++; addEx('reveal', Object.assign({}, l, { text: l.text + `  [Reveal ${r.term} at ${r.lvl}, reader ${LV}]` })); } }
console.log(`\n== #69 at reader level ${LV}: lines naming content above the speaker's level + 3: ${C69.above} of ${C69.checked} · lines with a Reveals term above the reader's level: ${C69.reveal} of ${lines.length} (bible's Reveals table, ${REVEALS.length} terms)`);
console.log('\n== examples (up to 4 each)'); for (const k of Object.keys(ex)) console.log(`${k}: ` + ex[k].slice(0, 4).join(' ‖ '));
if (process.env.JSON) console.log('JSON ' + JSON.stringify({ ID, thread, contra, W, MEM }));
