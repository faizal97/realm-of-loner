// Builds the Realm of Loner database (#231): every item, creature, quest, NPC, place, zone and dungeon, cross-linked,
// generated from the game data so it is never out of date. Spoilers are fine here: it is a reference you look things up in.
// Run: node tools/build_guide.js  → dist/guide/index.html (the site), dist/guide/icon/, mob/ and scene/*.svg (art)
// Published next to the game by tools/publish_web.sh, at …/realm-of-loner/guide/.
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
require(path.join(ROOT, 'src/data.js')); require(path.join(ROOT, 'src/engine.js')); require(path.join(ROOT, 'src/bots.js')); require(path.join(ROOT, 'src/game.js'));
const { D, E, G } = globalThis;
const OUT = path.join(ROOT, 'dist/guide');

// the art, as validate.js loads it
const w = {}; vm.createContext(w); w.window = w;
for (const f of fs.readdirSync(path.join(ROOT, 'src')).filter((f) => /^art.*\.js$/.test(f) && f !== 'art_story.js').sort((a, b) => (a === 'art.js' ? -1 : b === 'art.js' ? 1 : 0)))
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'src', f), 'utf8'), w);
const ART = w.ART;

// ---------------------------------------------------------------- helpers
const P = {}; // every page: 'kind/id' → { k, n, q, ic, mob, sub, tip, sec: [{ h, rows }] }
const L = (kind, id) => { const p = P[kind + '/' + id]; return p ? Object.assign({ l: kind + '/' + id, t: p.n }, p.q != null ? { q: p.q } : {}, p.ic ? { i: p.ic } : {}) : null; }; // a link cell, with its icon
const range = (a) => (Array.isArray(a) ? (a[0] === a[1] ? String(a[0]) : `${a[0]}–${a[1]}`) : String(a));
const pct = (x) => { const v = x * 100; return (v >= 10 || v === Math.round(v) ? Math.round(v) : v.toFixed(1)) + '%'; };
const k = (n) => (n >= 10000 ? (n / 1000).toFixed(1) + 'k' : String(Math.round(n)));
const money = (c) => { const g = Math.floor(c / 10000), s = Math.floor(c / 100) % 100, cp = c % 100; return [g && g + 'g', s && s + 's', cp && cp + 'c'].filter(Boolean).join(' ') || '0c'; };
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const statName = { str: 'Strength', agi: 'Agility', sta: 'Stamina', int: 'Intellect', spi: 'Spirit' };
const WTYPE = { sword: 'Sword', axe: 'Axe', mace: 'Mace', dagger: 'Dagger', staff: 'Staff', bow: 'Bow', gun: 'Gun', crossbow: 'Crossbow', wand: 'Wand' };
const KIND = { item: 'Items', mob: 'Creatures', quest: 'Quests', npc: 'People', place: 'Places', zone: 'Zones', dungeon: 'Dungeons', act: 'Group finder', class: 'Classes', race: 'Races', ability: 'Abilities', guide: 'Guides', prof: 'Professions', collect: 'Collections' };
const push = (m, key, v) => (m[key] = m[key] || []).push(v);
// a creature family as players read it: the renamed word where there is one (tools/rename_v10.json: Murloc → its new name)
const RENAME = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/rename_v10.json'), 'utf8'));
const family = (f) => { const n = cap(f || ''), r = RENAME[n]; return r && r.status === 'rename' && r.new ? r.new : n; };

// what an item is, in one line ("Leather Hands", "Quest Item", "Trade Goods")
function itemKind(it) {
  if (D.GEAR_SLOTS.includes(it.slot)) {
    const t = it.slot === 'weapon' || it.slot === 'ranged' ? WTYPE[it.wtype] || '' : it.atype ? cap(it.atype) : '';
    return [t, D.SLOT_LABEL[it.slot]].filter(Boolean).join(' ');
  }
  return { quest: 'Quest Item', mat: 'Trade Goods', food: 'Food', drink: 'Drink', potion: 'Potion', junk: 'Junk' }[it.slot] || cap(it.slot || 'item');
}

// the item's tooltip, as the game draws it (src/ui.js itemTip) without the player's own lines (compare, can you use it)
function itemTip(it) {
  const t = [['nm q' + it.q, it.name]];
  if (it.slot === 'quest') t.push(['st', 'Quest Item']);
  if (D.GEAR_SLOTS.includes(it.slot)) {
    const type = it.slot === 'weapon' || it.slot === 'ranged' ? WTYPE[it.wtype] || '' : it.atype ? cap(it.atype) : '';
    t.push(['two', D.SLOT_LABEL[it.slot], type]);
    if (it.dmg) { t.push(['two', `${it.dmg[0]} - ${it.dmg[1]} Damage`, `Speed ${it.speed.toFixed(2)}`]); t.push(['st', `(${((it.dmg[0] + it.dmg[1]) / 2 / it.speed).toFixed(1)} damage per second)`]); }
    if (it.armor) t.push(['st', `${it.armor} Armor`]);
    for (const s in it.stats || {}) t.push(['st', `+${it.stats[s]} ${statName[s] || s}`]);
    if (it.sp) t.push(['gr', `Equip: Increases damage and healing done by magical spells and effects by up to ${it.sp}.`]);
    const F = G.effectOf(it);
    if (F && F.desc) t.push(['eff', `Effect: ${F.name}. ${F.desc(it.lvl || 1, D.fxGrow(it.fxScale, it.effect))}`]);
    if (it.lvl > 1) t.push(['st', `Requires Level ${it.lvl}`]);
  }
  if (it.slot === 'mat') t.push(['st', 'Trade Goods']);
  if (it.heal || it.mana) t.push(['gr', `Use: Restores ${it.heal ? it.heal[0] + ' to ' + it.heal[1] + ' health' : it.mana[0] + ' to ' + it.mana[1] + ' mana'}. 2 min cooldown shared by all potions.`]);
  if (it.buff) t.push(['gr', `Use: ${Object.entries(it.buff).map(([s, v]) => `+${v} ${statName[s] || s}`).join(', ')} for ${it.flask ? '2 hours. Stays when you die.' : '1 hour.'}`]);
  if (it.wdmg) t.push(['gr', `Use: Your weapon deals +${it.wdmg} damage for 30 min.`]);
  if (it.slot === 'kit') t.push(['gr', `Use: Permanently adds ${it.kit} armor to a chest, legs, feet or hands item.`]);
  if (it.bag) t.push(['gr', `${it.bag} Slot Bag`]);
  if (it.teaches && D.RECIPES[it.teaches]) { const r = D.RECIPES[it.teaches], mk = D.ITEMS[r.makes]; t.push(['gr', `Use: Teaches you how to make ${mk.name}. Requires ${D.PROFESSIONS[r.prof].name} (${r.sk[0]}).`]); }
  if (it.restore) t.push(['gr', `Use: Restores ${it.restore} ${it.slot === 'food' ? 'health' : 'mana'} over ${it.slot === 'food' ? G.EAT_SECS : G.DRINK_SECS} sec.`]);
  if (it.desc) t.push(['gr', it.desc]);
  if (it.set && D.SETS[it.set]) t.push(['set', `${D.SETS[it.set].name} (${D.SETS[it.set].pieces} pieces)`]);
  if (it.look) t.push(['look', 'Appearance: shows on your character']);
  if (it.sell && !it.noSell && it.slot !== 'quest') t.push(['dim', 'Sell Price: ' + money(it.sell)]);
  return t;
}

// ---------------------------------------------------------------- relations
const placesOfMob = {}, dungeonsOfMob = {}, placesOfNpc = {}, questsGiven = {}, questsDone = {}, questsKill = {}, questsVisit = {};
const dropsOf = {}, lootOf = {}, qdropOf = {}, collectedFor = {}, madeBy = {}, usedIn = {}, nextQuests = {};
const zoneOfPlace = {};
for (const [id, p] of Object.entries(D.PLACES)) {
  zoneOfPlace[id] = p.region;
  for (const [m] of p.mobs || []) push(placesOfMob, m, id);
  for (const n of p.npcs || []) push(placesOfNpc, n, id);
}
for (const [id, d] of Object.entries(D.DUNGEONS)) for (const pull of d.pulls || []) for (const m of pull.mobs) if (!(dungeonsOfMob[m] || []).includes(id)) push(dungeonsOfMob, m, id);
for (const [id, m] of Object.entries(D.MOBS)) {
  for (const [it, ch] of m.drops || []) push(dropsOf, it, [id, ch]);
  for (const [it, ch] of m.qdrops || []) push(qdropOf, it, [id, ch]);
  for (const it of m.loot || []) push(lootOf, it, id);
}
for (const [id, q] of Object.entries(D.QUESTS)) {
  push(questsGiven, q.giver, id); if (q.turnin !== q.giver) push(questsDone, q.turnin, id);
  for (const o of q.objs) { if (o.type === 'collect') push(collectedFor, o.item, id); if (o.type === 'kill') push(questsKill, o.mob, id); if (o.type === 'visit') push(questsVisit, o.place, id); }
  for (const p of q.pre || []) push(nextQuests, p, id);
}
for (const [id, r] of Object.entries(D.RECIPES)) { push(madeBy, r.makes, id); for (const m in r.mats || {}) push(usedIn, m, id); }

// ---------------------------------------------------------------- pages (names first, so links resolve)
for (const [id, it] of Object.entries(D.ITEMS)) P['item/' + id] = { k: 'item', n: it.name, q: it.q, ic: it.icon };
for (const [id, m] of Object.entries(D.MOBS)) P['mob/' + id] = { k: 'mob', n: m.name, mob: id };
for (const [id, q] of Object.entries(D.QUESTS)) P['quest/' + id] = { k: 'quest', n: q.name };
for (const [id, n] of Object.entries(D.NPCS)) P['npc/' + id] = { k: 'npc', n: n.name };
for (const [id, p] of Object.entries(D.PLACES)) P['place/' + id] = { k: 'place', n: p.name };
for (const [id, r] of Object.entries(D.REGIONS)) P['zone/' + id] = { k: 'zone', n: r.name };
for (const [id, d] of Object.entries(D.DUNGEONS)) P['dungeon/' + id] = { k: 'dungeon', n: d.name, mob: (d.pulls.filter((x) => x.boss).pop() || { mobs: [] }).mobs[0] }; // its last boss's picture

const lvlOf = (kind, id) => kind === 'mob' ? D.MOBS[id].lvl[1] : kind === 'quest' ? D.QUESTS[id].lvl : kind === 'place' ? (D.PLACES[id].lvl || [0])[0] : 0;
const byLvl = (kind) => (a, b) => lvlOf(kind, a) - lvlOf(kind, b);
const sec = (p, h, rows, head) => { if (rows.length) (p.sec = p.sec || []).push(head ? { h, head, rows } : { h, rows }); };
const where = (placeId) => { const pl = D.PLACES[placeId]; return [L('place', placeId), pl.lvl ? range(pl.lvl) : '', L('zone', pl.region) || pl.zone || '']; };
const factionOf = (f) => (f ? (D.FACTIONS[f] || {}).name || cap(f) : ''); // the game's names: Accord and Krugar

for (const [id, it] of Object.entries(D.ITEMS)) {
  const p = P['item/' + id];
  p.sub = [itemKind(it), it.lvl > 1 ? `Level ${it.lvl}` : ''].filter(Boolean).join(', ');
  p.tip = itemTip(it);
  sec(p, 'Drops from', (dropsOf[id] || []).concat(qdropOf[id] || []).sort((a, b) => b[1] - a[1]).map(([m, ch]) => [L('mob', m), range(D.MOBS[m].lvl), pct(ch)]), ['Creature', 'Level', 'Chance']);
  sec(p, 'Boss loot', (lootOf[id] || []).map((m) => [L('mob', m), (dungeonsOfMob[m] || []).map((d) => L('dungeon', d))[0] || range(D.MOBS[m].lvl)]), ['Boss', 'Where']);
  sec(p, 'Needed for', (collectedFor[id] || []).sort(byLvl('quest')).map((q) => [L('quest', q), String(D.QUESTS[q].lvl)]), ['Quest', 'Level']);
  sec(p, 'Made with', (madeBy[id] || []).map((r) => { const R = D.RECIPES[r]; return [D.PROFESSIONS[R.prof].name + ' ' + R.sk[0], Object.entries(R.mats || {}).map(([m, n]) => (n > 1 ? n + '× ' : '') + ((D.ITEMS[m] || {}).name || m)).join(', ')]; }), ['Skill', 'Materials']);
  sec(p, 'Used to make', (usedIn[id] || []).map((r) => { const R = D.RECIPES[r]; return [L('item', R.makes), D.PROFESSIONS[R.prof].name + ' ' + R.sk[0], String(R.mats[id])]; }), ['Item', 'Skill', 'Needed']);
  if (it.source && !(lootOf[id] || []).length && !(dropsOf[id] || []).length && !/^(Honor rank|Trials:)/.test(it.source)) sec(p, 'Source', [[it.source]]);
}

for (const [id, m] of Object.entries(D.MOBS)) {
  const p = P['mob/' + id], dg = (dungeonsOfMob[id] || [])[0], DG = dg && D.DUNGEONS[dg];
  const mult = DG ? (m.boss ? DG.bossMult : DG.trashMult) : null, u = E.mobUnit(id, m.lvl[1], mult);
  p.sub = [`Level ${range(m.lvl)}`, m.boss ? 'Boss' : m.elite ? 'Elite' : '', family(m.family)].filter(Boolean).join(', ');
  const facts = [['Health', k(u.maxHp)], ['Hits for', `${k(u.dmg[0])}–${k(u.dmg[1])}`]];
  if (m.ranged) facts.push(['Attacks', 'From range']);
  if (m.specialText) facts.push(['Ability', m.specialText]);
  p.facts = facts;
  sec(p, 'Found in', (placesOfMob[id] || []).map(where), ['Place', 'Level', 'Zone']);
  sec(p, 'Fought in', (dungeonsOfMob[id] || []).map((d) => [L('dungeon', d), 'From level ' + D.DUNGEONS[d].minLvl]), ['Dungeon', 'Level']);
  sec(p, 'Loot', (m.loot || []).map((i) => [L('item', i), itemKind(D.ITEMS[i])]), ['Item', 'Type']);
  sec(p, 'Drops', (m.drops || []).concat(m.qdrops || []).filter(([i]) => D.ITEMS[i]).map(([i, ch]) => [L('item', i), pct(ch)]), ['Item', 'Chance']);
  sec(p, 'Quests', (questsKill[id] || []).sort(byLvl('quest')).map((q) => [L('quest', q), String(D.QUESTS[q].lvl)]), ['Quest', 'Level']);
}

for (const [id, q] of Object.entries(D.QUESTS)) {
  const p = P['quest/' + id];
  p.sub = [`Level ${q.lvl}`, q.dungeon ? 'Dungeon' : q.group ? 'Group' : '', factionOf(q.faction)].filter(Boolean).join(', ');
  p.text = q.text;
  const npcAt = (n) => (placesOfNpc[n] || []).map((pl) => L('place', pl))[0] || '';
  p.facts = [['Start', L('npc', q.giver) || q.giver, npcAt(q.giver)], ['End', L('npc', q.turnin) || q.turnin, npcAt(q.turnin)]];
  sec(p, 'Objectives', q.objs.map((o) => o.type === 'kill' ? ['Kill', L('mob', o.mob), String(o.n)] : o.type === 'collect' ? ['Collect', L('item', o.item), String(o.n)] : ['Go to', L('place', o.place), '']), ['', 'Target', 'Count']);
  const rw = [];
  for (const f of q.reward.choice || []) { const F = D.REWARD_FAMILIES[f]; if (F && F.slot) rw.push([`${D.QUALITY[F.q].name} ${D.SLOT_LABEL[F.slot] || F.slot}`, `Level ${F.lvl}, made for your class`]); else if (F && F.fixed) rw.push(['A weapon for your class', Object.values(F.fixed).map((i) => (D.ITEMS[i] || {}).name).filter((v, i, a) => v && a.indexOf(v) === i).join(', ')]); }
  if (q.reward.money) rw.push(['Money', money(q.reward.money)]);
  sec(p, 'Rewards', rw);
  sec(p, 'Chain', (q.pre || []).map((x) => ['Before', L('quest', x)]).concat((nextQuests[id] || []).map((x) => ['After', L('quest', x)])));
}

for (const [id, n] of Object.entries(D.NPCS)) {
  const p = P['npc/' + id];
  p.sub = n.title || '';
  const roles = [];
  for (const [pid, pl] of Object.entries(D.PLACES)) { if (pl.vendor === id) roles.push('Food and drink'); if (pl.gearVendor === id) roles.push('Gear'); }
  if (roles.length) p.facts = [['Sells', roles.filter((v, i, a) => a.indexOf(v) === i).join(', ')]];
  sec(p, 'Found in', (placesOfNpc[id] || []).map(where), ['Place', 'Level', 'Zone']);
  sec(p, 'Gives', (questsGiven[id] || []).sort(byLvl('quest')).map((q) => [L('quest', q), String(D.QUESTS[q].lvl)]), ['Quest', 'Level']);
  sec(p, 'Ends', (questsDone[id] || []).sort(byLvl('quest')).map((q) => [L('quest', q), String(D.QUESTS[q].lvl)]), ['Quest', 'Level']);
}

for (const [id, pl] of Object.entries(D.PLACES)) {
  const p = P['place/' + id];
  p.sub = [pl.lvl ? `Level ${range(pl.lvl)}` : '', pl.safe ? 'Town' : '', factionOf(pl.faction)].filter(Boolean).join(', ');
  p.facts = [['Zone', L('zone', pl.region) || pl.zone]];
  if (pl.inn) p.facts.push(['Inn', 'Yes']);
  sec(p, 'Creatures', (pl.mobs || []).map(([m]) => [L('mob', m), range(D.MOBS[m].lvl)]), ['Creature', 'Level']);
  sec(p, 'People', (pl.npcs || []).map((n) => [L('npc', n), D.NPCS[n].title || '']), ['Name', 'Title']);
  sec(p, 'Roads to', Object.keys(pl.links || {}).filter((t) => D.PLACES[t]).map((t) => [L('place', t), D.PLACES[t].lvl ? range(D.PLACES[t].lvl) : '']), ['Place', 'Level']);
  sec(p, 'Quests here', (questsVisit[id] || []).map((q) => [L('quest', q), String(D.QUESTS[q].lvl)]), ['Quest', 'Level']);
}

for (const [id, r] of Object.entries(D.REGIONS)) {
  const p = P['zone/' + id], places = Object.keys(D.PLACES).filter((pl) => D.PLACES[pl].region === id).sort(byLvl('place'));
  const lv = places.map((pl) => D.PLACES[pl].lvl).filter(Boolean), lo = Math.min(...lv.map((x) => x[0])), hi = Math.max(...lv.map((x) => x[1]));
  p.sub = [lv.length ? `Level ${lo}–${hi}` : '', factionOf(r.faction)].filter(Boolean).join(', ');
  sec(p, 'Places', places.map((pl) => [L('place', pl), D.PLACES[pl].lvl ? range(D.PLACES[pl].lvl) : '', D.PLACES[pl].safe ? 'Town' : '']), ['Place', 'Level', '']);
}

for (const [id, d] of Object.entries(D.DUNGEONS)) {
  const p = P['dungeon/' + id];
  p.sub = [`From level ${d.minLvl}`, `${d.size} players`].join(', ');
  sec(p, 'The way through', d.pulls.map((pull, i) => [String(i + 1), pull.boss ? L('mob', pull.mobs[0]) : pull.label, pull.boss ? 'Boss' : pull.mobs.filter((v, i, a) => a.indexOf(v) === i).map((m) => L('mob', m))]), ['', 'Pull', '']);
  const loot = [];
  for (const pull of d.pulls) if (pull.boss) for (const m of pull.mobs) for (const i of D.MOBS[m].loot || []) loot.push([L('item', i), itemKind(D.ITEMS[i]), L('mob', m)]);
  sec(p, 'Boss loot', loot, ['Item', 'Type', 'Boss']);
}

// ---------------------------------------------------------------- classes, races, abilities, talents
const RES = { mana: 'Mana', rage: 'Rage', energy: 'Energy' };
const ROLE = { healer: 'Healer', tank: 'Tank', dps: 'Damage' };
const num = (x) => (Math.round(x * 100) / 100).toString();
const cdText = (cd) => `${cd >= 60 && cd % 60 === 0 ? cd / 60 + ' min' : cd + ' sec'} cooldown`;
// an ability's text at a level with no gear (src/ui.js abilityText, spell power 0)
function abilityAt(ab, L) {
  const f = (x) => Math.round(x); let d = ab.desc || '';
  if (ab.dmg) { const lo = ab.dmg.base ? ab.dmg.base[0] + (ab.dmg.perLvl || 0) * L : ab.dmg.bonus ? ab.dmg.bonus[0] + (ab.dmg.perLvl || 0) * L : 0, hi = ab.dmg.base ? ab.dmg.base[1] + (ab.dmg.perLvl || 0) * L : ab.dmg.bonus ? ab.dmg.bonus[1] + (ab.dmg.perLvl || 0) * L : 0; d = d.replace('{b}', f(lo) === f(hi) ? f(lo) : `${f(lo)} to ${f(hi)}`); }
  if (ab.heal) { const hl = (i) => f(ab.heal.base[i] + (ab.heal.perLvl || 0) * L); d = d.replace('{h}', hl(0) === hl(1) ? hl(0) : `${hl(0)} to ${hl(1)}`); }
  if (ab.dot) d = d.replace('{d}', f((ab.dot.dmg + ab.dot.perLvl * L) * ab.dot.ticks));
  if (ab.hot) d = d.replace('{hh}', f((ab.hot.heal + ab.hot.perLvl * L) * ab.hot.ticks));
  if (ab.shield) d = d.replace('{s}', f(ab.shield.base + ab.shield.perLvl * L));
  if (ab.lifetap) d = d.split('{lt}').join(f(ab.lifetap.base + ab.lifetap.perLvl * L));
  if (ab.buff && ab.buff.stats) for (const s in ab.buff.stats) d = d.replace('{' + s + '}', f(ab.buff.stats[s] + ((ab.buff.perLvl && ab.buff.perLvl[s]) || 0) * L));
  return d;
}
const abCost = (ab, cls, L) => { const c = (ab.cost || 0) + (ab.costPerLvl || 0) * (L - 1); return c ? `${Math.round(c)} ${RES[D.CLASSES[cls] ? D.CLASSES[cls].resource : 'mana'] || ''}`.trim() : 'Free'; };
const talentText = (t, rank) => (t.desc || '').replace('{v}', num(((t.fx || [])[0] || { v: 0 }).v * rank));
const talentsOn = {}; // ability → talents that change it
for (const [cls, trees] of Object.entries(D.TALENTS)) for (const tr of trees) for (const t of tr.talents) for (const fx of t.fx || []) for (const a of fx.ab || []) if (!(talentsOn[a] || []).some((x) => x[0] === t)) push(talentsOn, a, [t, tr, cls]);

for (const [id, c] of Object.entries(D.CLASSES)) P['class/' + id] = { k: 'class', n: c.name, cls: id, ic: 'class_' + id }; // its crest (src/art_classes.js)
for (const [id, r] of Object.entries(D.RACES)) P['race/' + id] = { k: 'race', n: r.name, por: { cls: 'warrior', race: id, gender: 'm', skin: 0, hair: 0 } };
for (const [id, ab] of Object.entries(D.ABILITIES)) if (ab.cls || ab.racial) P['ability/' + id] = { k: 'ability', n: ab.name, ic: ab.icon || id };

for (const [id, ab] of Object.entries(D.ABILITIES)) {
  const p = P['ability/' + id]; if (!p) continue;
  const cls = ab.cls && D.CLASSES[ab.cls] ? ab.cls : null, lv = ab.lvl || 1;
  p.sub = [cls ? D.CLASSES[cls].name : 'Racial', ab.lvl ? `Level ${ab.lvl}` : ''].filter(Boolean).join(', ');
  p.tip = [['nm q1', ab.name], ['two', cls ? abCost(ab, cls, lv) : '', ab.cd ? cdText(ab.cd) : ''], ['dim', ab.cast ? (ab.channel ? 'Channeled' : `${ab.cast} sec cast`) : 'Instant'], ['set', abilityAt(ab, lv)]];
  if (ab.form) p.tip.push(['dim', `${cap(ab.form)} Form only`]);
  p.facts = [['Class', cls ? L('class', cls) : 'Racial'], ['Learned', ab.lvl ? `Level ${ab.lvl}` : 'From the start']];
  if (cls && lv < 60 && /\{(b|h|d|hh|s|lt)\}|\{\w+\}/.test(ab.desc || '')) p.facts.push(['At level 60', abilityAt(ab, 60) + (cls ? ` (${abCost(ab, cls, 60)})` : '')]);
  const rc = Object.entries(D.RACIALS || {}).filter(([, R]) => R.active === id).map(([r]) => L('race', r)).filter(Boolean);
  if (rc.length) p.facts.push(['Race', rc]);
  sec(p, 'Talents that change it', (talentsOn[id] || []).map(([t, tr]) => [t.name, tr.name, talentText(t, t.ranks)]), ['Talent', 'Tree', 'At full rank']);
  const pr = ((D.PROCS || {})[cls] || []).filter((x) => x.lights.includes(id) || (x.from || []).includes(id));
  sec(p, 'Reactions', pr.map((x) => [x.name, x.teach]));
}

for (const [id, c] of Object.entries(D.CLASSES)) {
  const p = P['class/' + id];
  p.sub = (c.roles || [c.role]).map((r) => ROLE[r] || cap(r)).join(', ');
  const at = (L) => Object.fromEntries(['str', 'agi', 'sta', 'int', 'spi'].map((s) => [s, Math.round(c.base[s] + c.gain[s] * (L - 1))]));
  const s60 = at(60);
  p.facts = [['Roles', (c.roles || [c.role]).map((r) => ROLE[r] || cap(r)).join(', ')], ['Resource', RES[c.resource] || cap(c.resource)], ['Armor', cap(c.armorType)], ['Weapons', (c.weapons || []).map((w) => WTYPE[w] || cap(w)).join(', ')]];
  sec(p, 'Stats with no gear', ['str', 'agi', 'sta', 'int', 'spi'].map((s) => [statName[s], String(at(1)[s]), String(s60[s])]), ['Stat', 'Level 1', 'Level 60']);
  const abil = Object.entries(D.ABILITIES).filter(([, a]) => a.cls === id).sort((a, b) => (a[1].lvl || 0) - (b[1].lvl || 0));
  sec(p, 'Abilities', abil.map(([a, A]) => [String(A.lvl || 1), L('ability', a), A.form ? cap(A.form) + ' Form' : A.cd ? cdText(A.cd) : '']), ['Level', 'Ability', '']);
  for (const tr of D.TALENTS[id] || []) sec(p, `${tr.name} talents`, tr.talents.map((t) => [String(D.TALENT_TIER_POINTS[t.tier] || 0), t.name, `${t.ranks}`, talentText(t, t.ranks)]), ['Points in tree', 'Talent', 'Ranks', 'At full rank']);
  sec(p, 'Races', Object.entries(D.RACES).filter(([, r]) => (r.classes || []).includes(id)).map(([r, R]) => [L('race', r), factionOf(R.faction)]), ['Race', 'Faction']);
}

for (const [id, r] of Object.entries(D.RACES)) {
  const p = P['race/' + id], R = (D.RACIALS || {})[id] || {};
  p.sub = factionOf(r.faction);
  p.facts = [['Faction', factionOf(r.faction)], ['Starts in', D.PLACES[r.start] ? L('place', r.start) : r.startZone]];
  if (R.active && P['ability/' + R.active]) p.facts.push(['Racial', L('ability', R.active)]);
  sec(p, 'Racial traits', (R.text || []).map((t) => [t]));
  sec(p, 'Classes', (r.classes || []).map((c) => [L('class', c)]));
}

// ---------------------------------------------------------------- professions, gathering, fishing, skinning
for (const [id, pr] of Object.entries(D.PROFESSIONS)) P['prof/' + id] = { k: 'prof', n: pr.name, ic: pr.icon };
const wild = Object.keys(D.PLACES).filter((pl) => { const x = D.PLACES[pl]; return !x.safe && !x.city && (x.mobs || []).length > 0; });
const midL = (pl) => Math.round(((D.PLACES[pl].lvl || [1, 1])[0] + (D.PLACES[pl].lvl || [1, 1])[1]) / 2);
const nodePlaces = {};
for (const pl of wild) { const T = D.nodeTable(midL(pl)); for (const [n, wgt] of T.ore.concat(T.herb)) if (wgt > 0) push(nodePlaces, n, pl); }
const gatheredFrom = {}, fishedIn = {};
for (const [n, N] of Object.entries(D.NODES)) { push(gatheredFrom, N.item, [n, 'main']); if (N.extra) push(gatheredFrom, N.extra[0], [n, N.extra[1]]); }
for (const [tier, T] of Object.entries(D.FISH)) { for (const [f, sk] of T.common) push(fishedIn, f, [tier, sk, 'Common']); if (T.big) push(fishedIn, T.big[0], [tier, T.big[1], 'Big catch']); if (T.rare) push(fishedIn, T.rare[0], [tier, T.rare[1], 'Rare']); }
const watersOf = (tier) => D.WATERS.filter((w) => D.waterTier(w) === Number(tier));
for (const [id, it] of Object.entries(D.ITEMS)) {
  const p = P['item/' + id];
  for (const [n, ch] of gatheredFrom[id] || []) { const N = D.NODES[n]; sec(p, `Gathered: ${N.name}`, [['Skill', `${D.PROFESSIONS[N.prof].name} ${N.skill}`], ['Amount', ch === 'main' ? range(N.n) : pct(ch) + ' chance, extra']].concat([['Grows in', (nodePlaces[n] || []).slice(0, 12).map((pl) => L('place', pl)).concat((nodePlaces[n] || []).length > 12 ? [`and ${(nodePlaces[n] || []).length - 12} more`] : [])]])); }
  for (const [tier, sk, kind] of fishedIn[id] || []) sec(p, 'Fished', [['Skill', `Fishing ${sk}`], ['Catch', kind], ['Waters', watersOf(tier).map((w) => L('place', w))]]);
}
// skinning: which leather each beast level gives
const leatherLv = {};
for (let lv = 1; lv <= 60; lv++) push(leatherLv, D.skinLeather(lv), lv);
for (const [lth, lvs] of Object.entries(leatherLv)) if (P['item/' + lth]) sec(P['item/' + lth], 'Skinned', [['From', `Beasts of level ${lvs[0]}–${lvs[lvs.length - 1]}`], ['Skill', `Skinning ${D.skinSkill(lvs[0])}`]]);

for (const [id, pr] of Object.entries(D.PROFESSIONS)) {
  const p = P['prof/' + id];
  p.sub = cap(pr.kind || '');
  p.text = pr.desc;
  const nodes = Object.entries(D.NODES).filter(([, N]) => N.prof === id).sort((a, b) => a[1].skill - b[1].skill);
  sec(p, 'Gathering', nodes.map(([n, N]) => [String(N.skill), N.name, L('item', N.item)]), ['Skill', 'Node', 'Gives']);
  const recs = Object.entries(D.RECIPES).filter(([, r]) => r.prof === id).sort((a, b) => a[1].sk[0] - b[1].sk[0]);
  sec(p, 'Recipes', recs.map(([r, R]) => [String(R.sk[0]), L('item', R.makes), Object.entries(R.mats || {}).map(([m, n]) => (n > 1 ? n + '× ' : '') + ((D.ITEMS[m] || {}).name || m)).join(', ') + ((D.RARE_RECIPES || []).includes(r) ? ' (rare recipe)' : '')]), ['Skill', 'Makes', 'Materials']);
  if (id === 'fishing') sec(p, 'Waters', Object.keys(D.FISH).map((t) => [`Fishing ${D.FISH[t].common[0][1]}`, watersOf(t).map((w) => L('place', w))]), ['From', 'Waters']);
}

// ---------------------------------------------------------------- collections and the group finder
for (const [id, m] of Object.entries(D.MOUNTS)) P['collect/mount_' + id] = { k: 'collect', n: m.name, ic: 'mount_' + id, sub: 'Mount', facts: [['How', m.reward || m.how || '']] };
for (const t of D.TITLES) P['collect/title_' + t.id] = { k: 'collect', n: t.name.replace('%s', '<name>').trim(), sub: 'Title', facts: [['How', t.how || '']] };
for (const [id, c] of Object.entries(D.COMPANIONS)) P['collect/pet_' + id] = { k: 'collect', n: c.name, ic: c.icon || (D.EVENTS[c.event] ? 'event_' + c.event : null), sub: 'Companion', text: c.desc, facts: [['How', c.how || '']] };
for (const [id, h] of Object.entries(D.HEIRLOOMS)) P['collect/heirloom_' + id] = { k: 'collect', n: h.name, ic: h.icon, sub: 'Heirloom', facts: [['Slot', D.SLOT_LABEL[h.slot] || h.slot], ['Stats', (h.stat || []).map((s) => statName[s] || s).join(', ')], ['Cost', String(h.cost)]] };
// a festival's wares: what they cost, on the item, title and companion pages
for (const [eid, ev] of Object.entries(D.EVENTS)) for (const w of ev.shop || []) {
  const target = P['item/' + w.id] || P['collect/pet_' + w.id] || P['collect/title_' + w.id];
  if (target) sec(target, 'Sold by', [[D.NPCS[ev.keeper] ? L('npc', ev.keeper) : ev.name, `${w.cost} ${ev.currency.name}`, `During ${ev.name}`]], ['Vendor', 'Price', 'When']);
}
for (const [id, a] of Object.entries(D.ACTIVITIES)) {
  if (a.dungeon && P['dungeon/' + a.dungeon]) continue; // a dungeon has its own page
  const lastBoss = a.boss || ((a.pulls || []).filter((x) => x.boss).pop() || { mobs: [] }).mobs[0];
  const p = P['act/' + id] = { k: 'act', n: a.name.replace(/^World boss: /, ''), mob: lastBoss || undefined }; // its boss's picture
  p.sub = [`Level ${a.minLvl === a.maxLvl ? a.minLvl : a.minLvl + '–' + a.maxLvl}`, `${a.size} players`, a.worldBoss ? 'World boss' : a.bg ? 'Battleground' : a.event ? 'Festival' : 'Group'].join(', ');
  p.text = a.desc;
  p.facts = [];
  if (a.where && D.PLACES[a.where]) p.facts.push(['Where', L('place', a.where)]);
  if (a.boss && P['mob/' + a.boss]) p.facts.push(['Boss', L('mob', a.boss)]);
  if (a.needQuest && P['quest/' + a.needQuest]) p.facts.push(['Needs', L('quest', a.needQuest)]);
  sec(p, 'The way through', (a.pulls || []).map((pull, i) => [String(i + 1), pull.boss ? L('mob', pull.mobs[0]) : pull.label, pull.boss ? 'Boss' : pull.mobs.filter((v, i, x) => x.indexOf(v) === i).map((m) => L('mob', m))]), ['', 'Pull', '']);
  const loot = []; for (const pull of a.pulls || []) if (pull.boss) for (const m of pull.mobs) for (const i of D.MOBS[m].loot || []) loot.push([L('item', i), itemKind(D.ITEMS[i]), L('mob', m)]);
  sec(p, 'Boss loot', loot, ['Item', 'Type', 'Boss']);
  if (a.boss && P['mob/' + a.boss]) sec(P['mob/' + a.boss], 'Group finder', [[L('act', id), `${a.size} players`]]);
}

// ---------------------------------------------------------------- vendors: what each one sells, at what price
G.newGame({ name: 'Guide', cls: 'warrior' });
const soldBy = {}, gearVendors = [];
for (const [pid, pl] of Object.entries(D.PLACES)) for (const npc of [pl.vendor, pl.gearVendor]) {
  if (!npc || !P['npc/' + npc]) continue;
  if (npc === pl.gearVendor) { if (!gearVendors.includes(npc)) gearVendors.push(npc); continue; }
  G.S.player.place = pid;
  for (const it of G.vendorStock(npc)) if (D.ITEMS[it.id] && !(soldBy[it.id] || []).some((x) => x[0] === npc)) push(soldBy, it.id, [npc, pid, it.cost || it.sell * 4]);
}
for (const [id, list] of Object.entries(soldBy)) sec(P['item/' + id], 'Sold by', list.map(([n, pl, c]) => [L('npc', n), L('place', pl), money(c)]), ['Vendor', 'Where', 'Price']);
for (const npc of Object.keys(D.NPCS)) {
  const items = Object.entries(soldBy).filter(([, l]) => l.some((x) => x[0] === npc)).map(([i, l]) => [L('item', i), money(l.find((x) => x[0] === npc)[2])]);
  sec(P['npc/' + npc], 'Sells', items, ['Item', 'Price']);
  if (gearVendors.includes(npc)) sec(P['npc/' + npc], 'Sells', [['Weapons', `One of each type (${Object.keys(D.WEAPON_BASES).map((w) => WTYPE[w] || cap(w)).join(', ')}), Common quality, made at your level. Price: 5× the sell price.`]]);
}

// ---------------------------------------------------------------- Honor ranks and Trialsworn rewards
const fmtTitle = (t) => (t || '').replace('%s', '<name>').trim();
P['collect/honor'] = { k: 'collect', n: 'Honor ranks', ic: 'honor_alliance_3', sub: 'Reward track', text: 'Honor comes from battlegrounds and War Mode. Each rank gives a title, and some give a look for your faction.' };
P['collect/trialsworn'] = { k: 'collect', n: 'Trialsworn rewards', ic: 'trialsworn_hourglass', sub: 'Reward track', text: 'Rewards for beating Trials in time. The higher the Trial, the brighter the look; each month adds its own colours.' };
const honorItems = (n) => Object.keys(D.ITEMS).filter((i) => D.ITEMS[i].source === 'Honor rank ' + n);
sec(P['collect/honor'], 'Ranks', D.HONOR_RANKS.map((r, i) => [String(i + 1), r.at.toLocaleString('en'), fmtTitle(r.alliance) + ' / ' + fmtTitle(r.horde), honorItems(i + 1).map((it) => L('item', it))]), ['Rank', 'Honor', 'Title (Accord / Krugar)', 'Looks']);
sec(P['collect/trialsworn'], 'By Trial', Object.entries(D.TRIALSWORN).filter(([, t]) => t.lvl).map(([, t]) => [`Trial ${t.lvl}`, (t.looks || []).filter((x) => P['item/' + x]).map((x) => L('item', x)).concat(t.mount && P['collect/mount_' + t.mount] ? [L('collect', 'mount_' + t.mount)] : [])]), ['Beat in time', 'Rewards']);
const monthly = Object.keys(D.ITEMS).filter((i) => D.ITEMS[i].month != null && /^Trials/.test(D.ITEMS[i].source || ''));
sec(P['collect/trialsworn'], 'Each month', monthly.map((i) => [L('item', i), D.ITEMS[i].source.replace(/^Trials: /, '')]), ['Look', 'How']);
for (const [id, it] of Object.entries(D.ITEMS)) {
  const hm = /^Honor rank (\d+)/.exec(it.source || ''), tm = /^Trials: (.+)/.exec(it.source || '');
  if (hm) { const r = D.HONOR_RANKS[hm[1] - 1]; sec(P['item/' + id], 'Reward', [['Track', L('collect', 'honor')], ['Rank', `${hm[1]} (${r.at.toLocaleString('en')} Honor)`], ['Faction', it.faction ? factionOf(it.faction) : 'Both']]); }
  if (tm) sec(P['item/' + id], 'Reward', [['Track', L('collect', 'trialsworn')], ['How', cap(tm[1])]]);
}

// ---------------------------------------------------------------- drops by rule (src/game.js loot): cloth, meat, rare recipes, starting gear
const bandsOf = (fn, from) => { const m = {}; for (let lv = from; lv <= 60; lv++) push(m, fn(lv), lv); return m; };
const cloth = { wool_cloth: ['14–27', '20% (level 14–17), 30% (18–27)'], silk_cloth: ['28–50', '40% (from 46, half the time Duskweave instead)'], duskweave_cloth: ['46–60', '40% (46–50 half the time, all of it from 51)'] };
for (const [it, [lv, ch]] of Object.entries(cloth)) if (P['item/' + it]) sec(P['item/' + it], 'Drops from humanoids', [['Level', lv], ['Chance', ch]]);
for (const [it, lvs] of Object.entries(bandsOf(D.beastMeat, 3))) if (P['item/' + it]) sec(P['item/' + it], 'Drops from beasts', [['Level', `${lvs[0]}–${lvs[lvs.length - 1]}`], ['Chance', '35%, while you know Cooking']]);
const rareLv = (id) => { const r = D.RECIPES[D.ITEMS[id].teaches], it = D.ITEMS[r.makes]; return it.slot === 'bag' ? Math.round(r.sk[0] / 5) : it.lvl || 1; };
for (const id of D.RARE_RECIPES || []) if (P['item/' + id]) { const lv = rareLv(id); sec(P['item/' + id], 'Rare drop', [['From', 'Named creatures (20%) and the end of a dungeon (10%)'], ['Level', `${Math.max(1, lv - 8)}–${Math.min(60, lv + 8)}`]]); }
for (const [cid, C] of Object.entries(D.CLASSES)) for (const it of [C.startWeapon, C.startChest, C.startRanged]) if (it && P['item/' + it]) { const p = P['item/' + it], s = (p.sec || []).find((x) => x.h === 'Starting gear'); if (s) s.rows.push([L('class', cid)]); else sec(p, 'Starting gear', [[L('class', cid)]]); }
if (P['item/hearthstone']) sec(P['item/hearthstone'], 'Starting gear', [['Every character starts with one.']]);
// a plain source line only where nothing above says it better
for (const [id, it] of Object.entries(D.ITEMS)) { const p = P['item/' + id]; if (p.sec && p.sec.some((x) => x.h === 'Source') && p.sec.some((x) => /^(Made with|Sold by|Rare drop)$/.test(x.h))) p.sec = p.sec.filter((x) => x.h !== 'Source'); }
for (const [aid, a] of Object.entries(D.ACTIVITIES)) for (const [id, it] of Object.entries(D.ITEMS)) if (it.source === 'Quest: ' + a.name) { const p = P['item/' + id]; p.sec = (p.sec || []).filter((x) => x.h !== 'Source'); sec(p, 'Reward', [['From', P['act/' + aid] ? L('act', aid) : a.name]]); }

// an item nothing gives yet (Forgotten Pool Water, #232): say so instead of an empty page
for (const id of Object.keys(D.ITEMS)) { const p = P['item/' + id]; if (!(p.sec || []).length) sec(p, 'Source', [['Not obtainable yet.']]); }

// ---------------------------------------------------------------- filters (#231): what each list can be narrowed by
// lv: level · z: zone and dungeon pages it belongs to · s: slot group · st: stats it gives · r: rank · q: quality
const uniq = (a) => a.filter((v, i) => v && a.indexOf(v) === i);
const zonesOfPlaces = (pls) => uniq((pls || []).map((pl) => 'zone/' + D.PLACES[pl].region));
const slotGroup = (it) => D.GEAR_SLOTS.includes(it.slot) ? it.slot : it.slot === 'quest' ? 'quest' : it.slot === 'mat' ? 'mat' : (it.heal || it.mana || it.buff || it.restore || it.wdmg || it.flask || it.slot === 'food' || it.slot === 'drink' || it.slot === 'potion') ? 'use' : 'other';
for (const [id, it] of Object.entries(D.ITEMS)) P['item/' + id].f = { lv: it.lvl || 0, s: slotGroup(it), st: uniq(Object.keys(it.stats || {}).concat(it.sp ? ['sp'] : [], it.effect ? ['fx'] : [])), q: it.q };
for (const [id, m] of Object.entries(D.MOBS)) P['mob/' + id].f = { lv: m.lvl[1], z: zonesOfPlaces(placesOfMob[id]).concat((dungeonsOfMob[id] || []).map((d) => 'dungeon/' + d)), r: m.boss ? 'boss' : m.elite ? 'elite' : m.named ? 'named' : 'normal' };
for (const [id, q] of Object.entries(D.QUESTS)) P['quest/' + id].f = { lv: q.lvl, z: zonesOfPlaces(placesOfNpc[q.giver]).concat(q.dungeon && D.DUNGEONS[q.dungeon] ? ['dungeon/' + q.dungeon] : []), r: q.dungeon ? 'dungeon' : q.group ? 'group' : 'solo' };
for (const [id, pl] of Object.entries(D.PLACES)) P['place/' + id].f = { lv: (pl.lvl || [0])[0], z: ['zone/' + pl.region], r: pl.safe ? 'town' : 'wild' };
for (const id of Object.keys(D.NPCS)) P['npc/' + id].f = { lv: Math.min(...(placesOfNpc[id] || []).map((pl) => (D.PLACES[pl].lvl || [0])[0]).concat(99)) % 99, z: zonesOfPlaces(placesOfNpc[id]) };
for (const [id, r] of Object.entries(D.REGIONS)) P['zone/' + id].f = { lv: Math.min(...Object.values(D.PLACES).filter((pl) => pl.region === id && pl.lvl).map((pl) => pl.lvl[0]).concat(99)) % 99 };
for (const [id, ab] of Object.entries(D.ABILITIES)) if (P['ability/' + id]) P['ability/' + id].f = { lv: ab.lvl || 0, c: ab.cls || 'racial' };
for (const k of Object.keys(P)) if (P[k].k === 'collect') P[k].f = { r: P[k].sub.toLowerCase() };
for (const [id, a] of Object.entries(D.ACTIVITIES)) if (P['act/' + id]) P['act/' + id].f = { lv: a.minLvl, r: a.worldBoss ? 'worldboss' : a.bg ? 'bg' : a.event ? 'festival' : 'group' };
for (const [id, d] of Object.entries(D.DUNGEONS)) P['dungeon/' + id].f = { lv: d.minLvl, r: d.size > 5 ? 'raid' : 'dungeon' };
const FILTERS = {
  slot: Object.fromEntries(D.GEAR_SLOTS.map((s) => [s, D.SLOT_LABEL[s]]).concat([['use', 'Food, drink and potions'], ['mat', 'Trade goods'], ['quest', 'Quest items'], ['other', 'Other']])),
  stat: { sp: 'Spell power', int: 'Intellect', spi: 'Spirit', sta: 'Stamina', str: 'Strength', agi: 'Agility', fx: 'Has an effect' },
  quality: Object.fromEntries(D.QUALITY.map((q, i) => [i, q.name])),
  zone: Object.fromEntries(Object.keys(D.REGIONS).sort((a, b) => P['zone/' + a].f.lv - P['zone/' + b].f.lv).map((z) => ['zone/' + z, D.REGIONS[z].name]).concat(Object.keys(D.DUNGEONS).sort((a, b) => D.DUNGEONS[a].minLvl - D.DUNGEONS[b].minLvl).map((d) => ['dungeon/' + d, D.DUNGEONS[d].name]))),
  class: Object.fromEntries(Object.entries(D.CLASSES).map(([c, C]) => [c, C.name]).concat([['racial', 'Racial']])),
  rank: { 'reward track': 'Reward tracks', mount: 'Mounts', title: 'Titles', companion: 'Companions', heirloom: 'Heirlooms', worldboss: 'World boss', bg: 'Battleground', festival: 'Festival', boss: 'Boss', elite: 'Elite', named: 'Named', normal: 'Normal', dungeon: 'Dungeon', group: 'Group', solo: 'Solo', town: 'Town', wild: 'Wilds', raid: 'Raid' },
};

// ---------------------------------------------------------------- guides (hand-written, guides/<class>.md)
// The database is generated; a guide is written by hand, so it says which version it was written for and last checked
// against. A guide checked for an older minor version than the game shows a warning, and `--check` fails on it (the
// publish gate in tools/publish_web.sh). Format: frontmatter (class, written, checked), an intro, then one `## Role` per
// tab with `### ` headings, paragraphs, `- ` and `1. ` lists and **bold**. [[Name]] or [[kind/id]] or [[kind/id|text]]
// links to the database; a link that finds nothing, or more than one page, stops the build.
// the version players have: the latest release tag (never a beta), so a guide is judged against the live game
let VERSION = '';
try { VERSION = require('child_process').execFileSync('git', ['describe', '--tags', '--abbrev=0', '--match', 'v*', '--exclude', '*-*'], { cwd: ROOT, encoding: 'utf8' }).trim().replace(/^v/, ''); } catch (e) { /* no tags: fall back to the app's own number */ }
if (!VERSION) VERSION = (fs.readFileSync(path.join(ROOT, 'app/pubspec.yaml'), 'utf8').match(/^version:\s*([^+\s-]+)/m) || [])[1] || '';
const minorOf = (v) => (String(v).match(/^(\d+)\.(\d+)/) || [, 0, 0]).slice(1, 3).map(Number);
const olderMinor = (a, b) => { const [a1, a2] = minorOf(a), [b1, b2] = minorOf(b); return a1 < b1 || (a1 === b1 && a2 < b2); };
const short = (v) => minorOf(v).join('.');
const GF = require('./guide_format.js'); // the one parser, shared with the site's Write page
const resolve = GF.resolver(P, (key) => { const [kind, ...id] = key.split('/'); return L(kind, id.join('/')); });
const guideErrors = [], stale = [];
const gdir = process.env.GUIDES_DIR || path.join(ROOT, 'guides'); // GUIDES_DIR: the test's own broken guides
for (const f of fs.existsSync(gdir) ? fs.readdirSync(gdir).filter((x) => x.endsWith('.md')).sort() : []) {
  const file = GF.parseFile(fs.readFileSync(path.join(gdir, f), 'utf8'));
  if (!file) { guideErrors.push(`${f}: no frontmatter`); continue; }
  const meta = file.meta;
  const cls = meta.class;
  if (!D.CLASSES[cls] || !meta.written || !meta.checked || !meta.by) { guideErrors.push(`${f}: needs class (a class id), by (official or a name), written and checked`); continue; }
  const official = meta.by === 'official', id = f.replace(/\.md$/, '');
  const { intro, tabs, errors } = GF.parse(file.body, resolve);
  for (const e of errors) guideErrors.push(`${f}: ${e}`);
  const old = olderMinor(meta.checked, VERSION);
  if (old && official) stale.push(`${f}: checked for ${short(meta.checked)}, the game is ${short(VERSION)}`);
  const name = D.CLASSES[cls].name;
  // one file, one guide: guides/druid.md is the official Druid guide; a player's guide sits next to it (by: their name)
  P['guide/' + id] = { k: 'guide', n: meta.title || name + ' guide', ic: 'class_' + cls, cls, sub: official ? 'Official' : 'By ' + meta.by, g: { by: official ? '' : meta.by, w: short(meta.written), c: short(meta.checked), old, intro, tabs } };
}
for (const cls of Object.keys(D.CLASSES)) {
  const gs = Object.keys(P).filter((x) => P[x].k === 'guide' && P[x].cls === cls).sort((a, b) => !!P[a].g.by - !!P[b].g.by || P[a].n.localeCompare(P[b].n));
  const cp = P['class/' + cls]; if (cp && gs.length) (cp.facts = cp.facts || []).unshift([gs.length > 1 ? 'Guides' : 'Guide', gs.map((x) => L('guide', x.split('/')[1]))]);
}
if (guideErrors.length) { console.error(guideErrors.join('\n')); process.exit(1); }
if (process.argv.includes('--check')) {
  if (stale.length) { console.error('Guides to re-check before this release:\n' + stale.join('\n')); process.exit(1); }
  console.log(`guides: ${Object.keys(P).filter((x) => x.startsWith('guide/')).length} checked for ${short(VERSION)}`); process.exit(0);
}

// ---------------------------------------------------------------- lists and search
const lists = {};
for (const kind of Object.keys(KIND)) {
  const ids = Object.keys(P).filter((x) => P[x].k === kind).map((x) => x.split('/')[1]);
  const lv = (id) => kind === 'item' ? D.ITEMS[id].lvl || 0 : kind === 'dungeon' ? D.DUNGEONS[id].minLvl : kind === 'ability' ? D.ABILITIES[id].lvl || 0 : kind === 'act' ? D.ACTIVITIES[id].minLvl : kind === 'guide' ? (P['guide/' + id].g.by ? 1 : 0) : lvlOf(kind, id);
  const nm = (id) => P[kind + '/' + id].n.replace(/<name>,?/, '').trim(), grp = (id) => (kind === 'collect' ? P['collect/' + id].sub : '');
  lists[kind] = ids.sort((a, b) => grp(a).localeCompare(grp(b)) || lv(a) - lv(b) || nm(a).localeCompare(nm(b)));
}

// art as files next to the page, so the page itself stays small
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'icon'), { recursive: true }); fs.mkdirSync(path.join(OUT, 'mob'), { recursive: true });
const svg = (s) => (s && !/xmlns=/.test(s) ? s.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"') : s);
let icons = 0, mobs = 0;
for (const ic of new Set(Object.values(P).map((p) => p.ic).filter(Boolean))) { let s = null; try { s = ART.icon(ic); } catch (e) { s = null; } if (s) { fs.writeFileSync(path.join(OUT, 'icon', ic + '.svg'), svg(s)); icons++; } else for (const p of Object.values(P)) if (p.ic === ic) delete p.ic; }
for (const id of Object.keys(D.MOBS)) { let s = null; try { s = ART.mob(id); } catch (e) { s = null; } if (s) { fs.writeFileSync(path.join(OUT, 'mob', id + '.svg'), svg(s)); mobs++; } else for (const p of Object.values(P)) if (p.mob === id) delete p.mob; }

for (const p of Object.values(P)) if (p.por) { let s = null; try { s = ART.portrait(p.por); } catch (e) { s = null; } const key = 'portrait_' + (p.k === 'class' ? p.por.cls : p.por.race); if (s) { fs.writeFileSync(path.join(OUT, 'icon', key + '.svg'), svg(s)); p.ic = key; } delete p.por; }
// every row has a picture, as the game draws it: quests the journal, people the mark the game gives them, titles
// their Honor rank or the journal, places and zones their scene (a town's for a zone)
for (const id of Object.keys(D.QUESTS)) P['quest/' + id].ic = 'journal';
for (const [id, n] of Object.entries(D.NPCS)) P['npc/' + id].ic = n.legend ? 'legend_' + n.legend : Object.values(D.PLACES).some((pl) => pl.vendor === id || pl.gearVendor === id) ? 'coin' : 'hearthstone';
for (const t of D.TITLES) { const r = t.need && t.need.honor ? D.HONOR_RANKS.findIndex((x) => x.at === t.need.honor) + 1 : 0; P['collect/title_' + t.id].ic = r > 0 ? 'honor_alliance_' + r : 'journal'; }
for (const [id, a] of Object.entries(D.ACTIVITIES)) if (P['act/' + id] && !P['act/' + id].mob) P['act/' + id].ic = a.bg ? 'honor_banner_alliance' : 'journal';
fs.mkdirSync(path.join(OUT, 'scene'), { recursive: true });
const scenes = new Set();
const sceneFor = (pl) => (D.PLACES[pl] || {}).scene || pl;
for (const [id] of Object.entries(D.PLACES)) P['place/' + id].scn = sceneFor(id);
for (const id of Object.keys(D.REGIONS)) { const pls = Object.keys(D.PLACES).filter((pl) => D.PLACES[pl].region === id); const town = pls.find((pl) => D.PLACES[pl].safe) || pls[0]; if (town) P['zone/' + id].scn = sceneFor(town); }
for (const p of Object.values(P)) if (p.scn) { if (!scenes.has(p.scn)) { let s = null; try { s = ART.scene(p.scn); } catch (e) { s = null; } if (s) { fs.writeFileSync(path.join(OUT, 'scene', p.scn + '.svg'), svg(s)); scenes.add(p.scn); } else { delete p.scn; continue; } } }
for (const p of Object.values(P)) if (p.ic && !fs.existsSync(path.join(OUT, 'icon', p.ic + '.svg'))) { let s = null; try { s = ART.icon(p.ic); } catch (e) { s = null; } if (s) { fs.writeFileSync(path.join(OUT, 'icon', p.ic + '.svg'), svg(s)); icons++; } else delete p.ic; }
const data = JSON.stringify({ v: VERSION, kinds: KIND, lists, filters: FILTERS, pages: P }).replace(/</g, '\\u003c');
const tpl = fs.readFileSync(path.join(ROOT, 'web/guide/index.html'), 'utf8');
const html = tpl.replace('/*FONTS*/', fs.readFileSync(path.join(ROOT, 'fonts/fonts.local.css'), 'utf8')).replace('/*DATA*/null', () => data).replace('/*FORMAT*/', () => fs.readFileSync(path.join(__dirname, 'guide_format.js'), 'utf8'));
fs.writeFileSync(path.join(OUT, 'index.html'), html);
console.log(`guide: ${Object.keys(P).length} pages, ${icons} icons, ${mobs} creature pictures, ${scenes.size} scenes, ${(html.length / 1024).toFixed(0)} KB → dist/guide/`);
