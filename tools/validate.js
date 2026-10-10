// Checks the game data before every build. Exits 1 on any broken reference, so a typo fails the
// build instead of the game. Run: node tools/validate.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
globalThis.localStorage = { getItem() { return null; }, setItem() {} };
require(path.join(ROOT, 'src/data.js'));
const D = globalThis.D;
const errors = [], warn = [];
const err = (m) => errors.push(m);

// art: every scene, mob and ability icon the data asks for must exist
const w = {}; vm.createContext(w); w.window = w;
for (const f of fs.readdirSync(path.join(ROOT, 'src')).filter((f) => /^art.*\.js$/.test(f) && f !== 'art_story.js').sort((a, b) => (a === 'art.js' ? -1 : b === 'art.js' ? 1 : 0)))
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'src', f), 'utf8'), w);
const K = (w.ART && w.ART.keys) || {};
const scenes = new Set(K.scenes || []), mobArt = new Set(K.mobs || []), icons = new Set(K.icons || []);

const has = (tbl, k) => Object.prototype.hasOwnProperty.call(D[tbl], k);
for (const [k, p] of Object.entries(D.PLACES)) {
  if (!D.REGIONS[p.region]) err(`place ${k}: unknown region '${p.region}'`);
  if (p.gather && !has('ITEMS', p.gather.item)) err(`place ${k}: gathers unknown item '${p.gather.item}'`);
  if (scenes.size && !scenes.has(p.scene)) err(`place ${k}: no art for scene '${p.scene}'`);
  for (const [to, secs] of Object.entries(p.links || {})) {
    if (!has('PLACES', to)) err(`place ${k}: link to unknown place '${to}'`);
    else if (!(D.PLACES[to].links || {})[k]) warn.push(`place ${k} -> ${to} is one-way`);
    if (!(secs > 0)) err(`place ${k}: link to ${to} has no travel time`);
  }
  for (const [m] of p.mobs || []) if (!has('MOBS', m)) err(`place ${k}: unknown mob '${m}'`);
  for (const m in p.named || {}) if (!has('MOBS', m)) err(`place ${k}: unknown named mob '${m}'`);
  // a starting place has no rare: a new player taps the first card (v10.9, issue #10)
  if (Object.keys(p.named || {}).length && Object.values(D.RACES).some((R) => R.start === k)) err(`place ${k}: a starting place has a named mob (${Object.keys(p.named).join(', ')})`);
  for (const n of p.npcs || []) if (!has('NPCS', n)) err(`place ${k}: unknown npc '${n}'`);
  for (const r of ['vendor', 'gearVendor']) if (p[r] && !(p.npcs || []).includes(p[r])) err(`place ${k}: ${r} '${p[r]}' is not in its npcs`);
}
for (const [k, m] of Object.entries(D.MOBS)) {
  for (const [id] of (m.drops || []).concat(m.qdrops || [])) if (!has('ITEMS', id)) err(`mob ${k}: drops unknown item '${id}'`);
  for (const id of m.loot || []) if (!has('ITEMS', id)) err(`mob ${k}: loot unknown item '${id}'`);
  if (mobArt.size && !mobArt.has(m.sprite || k)) err(`mob ${k}: no art for '${m.sprite || k}'`);
  if (!Array.isArray(m.lvl) || m.lvl[0] > m.lvl[1]) err(`mob ${k}: bad level range`);
}
const giverAt = {}; for (const [pk, p] of Object.entries(D.PLACES)) for (const n of p.npcs || []) giverAt[n] = pk;
for (const [k, q] of Object.entries(D.QUESTS)) {
  for (const who of ['giver', 'turnin']) { if (!has('NPCS', q[who])) err(`quest ${k}: unknown ${who} '${q[who]}'`); else if (!giverAt[q[who]]) err(`quest ${k}: ${who} '${q[who]}' stands nowhere`); }
  for (const p of q.pre || []) if (!has('QUESTS', p)) err(`quest ${k}: needs unknown quest '${p}'`);
  if (!q.objs || !q.objs.length) err(`quest ${k}: no objectives`);
  for (const o of q.objs || []) {
    if (o.type === 'kill' && !has('MOBS', o.mob)) err(`quest ${k}: kill unknown mob '${o.mob}'`);
    if (o.type === 'visit' && !has('PLACES', o.place)) err(`quest ${k}: visit unknown place '${o.place}'`);
    if (o.type === 'collect') {
      if (!has('ITEMS', o.item)) err(`quest ${k}: collect unknown item '${o.item}'`);
      else if (!Object.values(D.MOBS).some((m) => (m.qdrops || []).concat(m.drops || []).some((d) => d[0] === o.item)) && !Object.values(D.PLACES).some((p) => p.gather && p.gather.item === o.item)) err(`quest ${k}: nothing drops or grows '${o.item}'`);
    }
  }
  for (const f of (q.reward && q.reward.choice) || []) if (!has('REWARD_FAMILIES', f)) err(`quest ${k}: unknown reward family '${f}'`);
  if (q.lvl > D.LEVEL_CAP + 2) warn.push(`quest ${k}: level ${q.lvl} is above the cap`);
}
for (const [c, C] of Object.entries(D.CLASSES)) for (const a of C.abilities) {
  if (!has('ABILITIES', a)) { err(`class ${c}: unknown ability '${a}'`); continue; }
  // abilities above the level cap are data for the next update; nobody can learn them yet
  const ic = D.ABILITIES[a].icon || a; if (icons.size && !icons.has(ic) && (D.ABILITIES[a].lvl || 1) <= D.LEVEL_CAP) err(`ability ${a}: no icon '${ic}'`);
}
for (const [k, A] of Object.entries(D.ACTIVITIES)) {
  if (A.where && !has('PLACES', A.where)) err(`activity ${k}: unknown place '${A.where}'`);
  if (!A.where && !A.bg) err(`activity ${k}: needs where (the place you queue from)`); // battlegrounds queue from anywhere
  if (A.bg && !(D.BG && D.BG[A.bg] && D.BG[A.bg].banners && D.PLACES && Object.values(D.PLACES).some((p) => p.scene === D.BG[A.bg].scene))) err(`activity ${k}: battleground '${A.bg}' needs banners and a scene`);
  if (!(A.maxLvl >= A.minLvl)) err(`activity ${k}: needs maxLvl >= minLvl (the level everyone is synced to)`);
  if (A.dungeon && !has('DUNGEONS', A.dungeon)) err(`activity ${k}: unknown dungeon '${A.dungeon}'`);
  for (const pl of A.pulls || []) for (const m of pl.mobs) if (!has('MOBS', m)) err(`activity ${k}: unknown mob '${m}'`);
}
for (const [k, Dg] of Object.entries(D.DUNGEONS)) if (!(Dg.par > 0)) err(`dungeon ${k}: needs a par time in seconds`);
// Trials (v10.4): a dungeon added after Trials began needs the date it joins the game, so seasons pick it up next month
// (src/trials.js). These 20 were there at launch and count from 2026-10-01.
const LAUNCH_DUNGEONS = new Set(['ragefire', 'deadmines', 'wailing_caverns', 'stockade', 'shadowfang', 'blackfathom', 'gnomeregan', 'razorfen_kraul', 'sm_library', 'sm_cathedral', 'zul_farrak', 'maraudon', 'blackrock_depths', 'scholomance', 'stratholme', 'onyxias_lair', 'molten_core', 'sunken_archive', 'shalzua_temple', 'tidecrown_citadel']);
for (const [k, Dg] of Object.entries(D.DUNGEONS)) { if (Dg.since == null ? !LAUNCH_DUNGEONS.has(k) : !/^\d{4}-\d\d-\d\d$/.test(Dg.since)) err(`dungeon ${k}: needs since: 'YYYY-MM-DD', the day it joins the game (Trials seasons use it)`); }
for (const [k, Dg] of Object.entries(D.DUNGEONS)) for (const pl of Dg.pulls) for (const m of pl.mobs) if (!has('MOBS', m)) err(`dungeon ${k}: unknown mob '${m}'`);
for (const [cls, trees] of Object.entries(D.TALENTS || {})) {
  if (!D.CLASSES[cls]) err(`talents: unknown class ${cls}`);
  if (trees.length !== 3) err(`talents ${cls}: needs 3 trees`);
  const seen = new Set();
  for (const tree of trees) {
    let t1 = 0;
    if (icons.size && !icons.has(tree.icon)) err(`talent tree ${cls}/${tree.id}: no icon '${tree.icon}'`);
    for (const t of tree.talents) {
      if (seen.has(t.id)) err(`talent ${cls}/${t.id}: duplicate id`); seen.add(t.id);
      if (![1, 2, 3].includes(t.tier) || !(t.ranks >= 1)) err(`talent ${cls}/${t.id}: bad tier or ranks`);
      if (t.tier === 1) t1 += t.ranks;
      if (icons.size && !icons.has(t.icon)) err(`talent ${cls}/${t.id}: no icon '${t.icon}'`);
      for (const fx of t.fx) for (const a of fx.ab || []) if (a !== '*' && !has('ABILITIES', a)) err(`talent ${cls}/${t.id}: unknown ability '${a}'`);
    }
    if (t1 < D.TALENT_TIER_POINTS[2]) err(`talent tree ${cls}/${tree.id}: tier 1 has only ${t1} ranks, tier 2 needs ${D.TALENT_TIER_POINTS[2]}`);
  }
  // every point a character earns can be spent (#191): the ranks across all trees cover the points at the level cap
  const ranks = trees.reduce((a, tr) => a + tr.talents.reduce((b, t) => b + t.ranks, 0), 0), pts = D.LEVEL_CAP - D.TALENT_START + 1;
  if (ranks < pts) err(`talents ${cls}: ${ranks} ranks across the trees, but a level-${D.LEVEL_CAP} character has ${pts} points (${pts - ranks} could never be spent)`);
}
for (const [role, m] of Object.entries(D.TALENT_BOT || {})) for (const [cls, ids] of Object.entries(m)) for (const id of ids) if (!(D.TALENTS[cls] || []).some((t) => t.id === id)) err(`bot talents ${role}/${cls}: unknown tree '${id}'`);
if (D.XP_TO_LEVEL.length <= D.LEVEL_CAP) err(`XP_TO_LEVEL stops before the level cap (${D.LEVEL_CAP})`);

// no data file may redefine a key an earlier file added (a quest, item or mob with the same id silently replaces the first one)
{
  const ctx = { localStorage: globalThis.localStorage }; ctx.globalThis = ctx; ctx.window = undefined; vm.createContext(ctx);
  const TABLES = ['MOBS', 'PLACES', 'NPCS', 'QUESTS', 'ITEMS', 'ACTIVITIES', 'DUNGEONS', 'RECIPES', 'LORE'];
  for (const f of require(path.join(ROOT, 'src/data/files.json'))) {
    const before = {}; for (const t of TABLES) before[t] = Object.assign({}, (ctx.D || {})[t] || {});
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'src/data', f), 'utf8'), ctx);
    for (const t of TABLES) for (const k in ((ctx.D || {})[t] || {})) if (before[t][k] && before[t][k] !== ctx.D[t][k]) err(`${f}: redefines ${t}.${k}, which an earlier file defines`);
  }
}

// Lore Journal pages: each needs text and exactly one unlock that points at something real
const zonesSeen = new Set(Object.values(D.PLACES).map((p) => p.zone));
for (const [k, E] of Object.entries(D.LORE || {})) {
  if (!E.title || !Array.isArray(E.text) || !E.text.length) err(`lore ${k}: needs a title and text`);
  if (!['story', 'legend', 'dungeon', 'zone', 'book'].includes(E.section)) err(`lore ${k}: unknown section '${E.section}'`);
  if (E.dungeon && !D.DUNGEONS[E.dungeon]) err(`lore ${k}: unknown dungeon '${E.dungeon}'`);
  if (E.zone && !zonesSeen.has(E.zone)) err(`lore ${k}: no place is in zone '${E.zone}'`);
  if (E.quest && !D.QUESTS[E.quest]) err(`lore ${k}: unknown quest '${E.quest}'`);
  for (const b in E.bosses || {}) {
    const inDg = E.dungeon && D.DUNGEONS[E.dungeon] && D.DUNGEONS[E.dungeon].pulls.some((pl) => pl.boss && pl.mobs.includes(b));
    if (!inDg) err(`lore ${k}: boss '${b}' is not a boss of ${E.dungeon}`);
  }
  for (const [m, c] of Object.entries(E.from || {})) { if (!D.MOBS[m]) err(`lore ${k}: drops from unknown mob '${m}'`); if (!(c > 0 && c <= 1)) err(`lore ${k}: drop chance for ${m} must be between 0 and 1`); }
  if (E.book && !Object.keys(E.from || {}).length) err(`lore ${k}: a book needs at least one source in 'from'`);
  if (E.dungeon) { const miss = D.DUNGEONS[E.dungeon] ? D.DUNGEONS[E.dungeon].pulls.filter((pl) => pl.boss).map((pl) => pl.mobs[0]).filter((b) => !(E.bosses || {})[b]) : []; if (miss.length) warn.push(`lore ${k}: no note for boss ${miss.join(', ')}`); }
}

for (const q in D.QUEST_STORY || {}) if (!D.QUESTS[q]) err(`quest story for unknown quest '${q}'`);
// the monthly Trialsworn cloaks are planned ahead (D.TRIALSWORN_MONTHS, from October 2026): warn with fewer than 3
// months left, stop the build when next month has none (a month without one pays Marks instead, but plan it)
if (D.TRIALSWORN_MONTHS) {
  const d = new Date(), season = (d.getFullYear() - 2026) * 12 + d.getMonth() - 9, left = D.TRIALSWORN_MONTHS.length - 1 - season;
  if (left < 1) err(`Trialsworn: no monthly cloak planned for next month: add a palette in art.js and a name in D.TRIALSWORN_MONTHS`);
  else if (left < 3) { warn.push(`Trialsworn: monthly cloaks planned for only ${left} more month(s)`); console.log(`  NOTE: Trialsworn monthly cloaks are planned for only ${left} more month(s); add the next ones (art.js palette + D.TRIALSWORN_MONTHS)`); }
}
// main-story marks (v10.8): every quest that plays a main-story scene (not a Legend's) carries main: true
{
  let CSX = null; try { globalThis.window = globalThis.window || globalThis; require('../src/cutscene.js'); CSX = globalThis.CS; } catch (e) { warn.push('cutscenes not loaded for the main-story check: ' + e.message); }
  if (CSX) for (const c of CSX.CHAPTERS) {
    if (!c.quest || c.legend) continue;
    for (const q of [].concat(c.quest)) if (D.QUESTS[q] && !D.QUESTS[q].main) err(`main-story scene '${c.id}' plays after '${q}', which is not marked main: true (src/data/main_story.js)`);
  }
}
// music (v10.8): every track a zone, place or activity names must be composed (audio/out/music.json)
{
  const mj = require('path').join(__dirname, '..', 'audio', 'out', 'music.json'), tracks = require('fs').existsSync(mj) ? JSON.parse(require('fs').readFileSync(mj, 'utf8')) : null;
  if (tracks) for (const [kind, tab] of [['zone', D.REGIONS], ['place', D.PLACES], ['activity', D.ACTIVITIES], ['dungeon', D.DUNGEONS]]) for (const k in tab) {
    for (const f of ['music', 'town']) { const m = tab[k] && tab[k][f]; if (m && !tracks[m]) err(`${kind} '${k}' plays ${f} '${m}', which is not composed (audio/compose_zones.py, compose_themes.py)`); }
  }
}
// item effects (#22): every effect item points at a known effect and keeps at least 40% of its stat budget, so no drop
// reads as broken (an epic with +2 stats); an effect whose numbers need more is made weaker instead
if (D.EFFECTS) {
  const cap = D.EFFECT_COST_MAX || 0.6;
  for (const k in D.EFFECTS) if (!D.EFFECTS[k].fires || !D.EFFECTS[k].role) err(`effect '${k}' needs 'role' and 'fires' (when it acts, a plain fact for the Effects codex, #55)`);
  for (const k in D.EFFECTS) if (D.effectCost(k) > cap + 1e-9) err(`effect '${k}' costs ${Math.round(D.effectCost(k) * 100)}% of an item's stats; at most ${Math.round(cap * 100)}% (make its numbers weaker instead)`);
  for (const id in D.ITEMS) { const it = D.ITEMS[id]; if (!it.effect) continue;
    if (!D.EFFECTS[it.effect]) { err(`item '${id}' has an unknown effect '${it.effect}'`); continue; }
    const pts = Object.values(it.stats || {}).reduce((a, b) => a + b, 0);
    if (it.fxBudget && pts < Math.floor(it.fxBudget * (1 - cap))) err(`item '${id}' keeps ${pts} of ${it.fxBudget} stat points; an effect item keeps at least ${Math.round((1 - cap) * 100)}%`); }
}
// a solo quest sits in its zone's levels (#188): at most 2 over the zone's top (a quest 10+ levels over its zone levels
// whoever does it there far ahead); its zone is where it is handed in, else where it is given. Dungeon and group quests
// follow their instance, and a Legend's questline (lg_) follows its Legend across zones, offered only at its level
{
  const at = {}; for (const k in D.PLACES) for (const nk of (D.PLACES[k].npcs || [])) if (!at[nk]) at[nk] = k;
  const regionOf = (nk) => (D.PLACES[at[nk]] || {}).region, zl = D.zoneLevels();
  for (const q in D.QUESTS) { const Q = D.QUESTS[q]; if (Q.dungeon || Q.group || q.startsWith('lg_')) continue;
    const r = regionOf(Q.turnin) || regionOf(Q.giver), z = r && zl[r];
    if (z && Q.lvl > z[1] + 2) err(`quest '${q}' is level ${Q.lvl}, but its zone (${r}) is ${z[0]}-${z[1]}: at most ${z[1] + 2} (move it, or set its level)`); }
}
const n = (t) => Object.keys(D[t]).length;
console.log(`data: ${n('REGIONS')} zones, ${n('PLACES')} places, ${n('MOBS')} mobs, ${n('QUESTS')} quests, ${n('ITEMS')} items` + (warn.length ? ` · ${warn.length} warnings` : ''));
if (process.argv.includes('-v')) warn.forEach((w) => console.log('  warn:', w));
// a fixed blue below 57 is never weaker than a random blue of its level (#141: src/data/finalize.js lifts them; this
// stops the build if one slips under, e.g. a new item added after the lift)
for (const [id, it] of Object.entries(D.ITEMS)) {
  if (it.q !== 3 || !(it.lvl < D.BLUE_FLOOR_BELOW) || !it.stats) continue;
  const have = Object.values(it.stats).reduce((a, v) => a + v, 0), need = Math.round(D.gearBudget(it.lvl, 3));
  if (have > 0 && have < need) err(`${id}: a level-${it.lvl} blue with ${have} stat points, under the generated blue budget (${need})`);
}
// generated gear never gets worse as you level (#141: the 59 -> 60 cliff): for each quality, the budget at L+1 is at
// least the budget at L, for every level to the cap
for (const q of [2, 3, 4]) for (let L = 1; L < D.LEVEL_CAP; L++)
  if (D.gearBudget(L + 1, q) < D.gearBudget(L, q) - 1e-9) err(`gear budget falls from level ${L} to ${L + 1} for quality ${q}: ${D.gearBudget(L, q).toFixed(2)} -> ${D.gearBudget(L + 1, q).toFixed(2)}`);
if (errors.length) { errors.forEach((e) => console.error('  ERROR:', e)); console.error(`${errors.length} data error(s); build stopped.`); process.exit(1); }
console.log('data OK');
