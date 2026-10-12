// Builds the Realm of Loner database (#231): every item, creature, quest, NPC, place, zone and dungeon, cross-linked,
// generated from the game data so it is never out of date. Spoilers are fine here: it is a reference you look things up in.
// Run: node tools/build_guide.js  → dist/guide/index.html (the site), dist/guide/icon/*.svg and dist/guide/mob/*.svg (art)
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
const L = (kind, id) => { const p = P[kind + '/' + id]; return p ? { l: kind + '/' + id, t: p.n, q: p.q } : null; }; // a link cell
const range = (a) => (Array.isArray(a) ? (a[0] === a[1] ? String(a[0]) : `${a[0]}–${a[1]}`) : String(a));
const pct = (x) => { const v = x * 100; return (v >= 10 || v === Math.round(v) ? Math.round(v) : v.toFixed(1)) + '%'; };
const k = (n) => (n >= 10000 ? (n / 1000).toFixed(1) + 'k' : String(Math.round(n)));
const money = (c) => { const g = Math.floor(c / 10000), s = Math.floor(c / 100) % 100, cp = c % 100; return [g && g + 'g', s && s + 's', cp && cp + 'c'].filter(Boolean).join(' ') || '0c'; };
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const statName = { str: 'Strength', agi: 'Agility', sta: 'Stamina', int: 'Intellect', spi: 'Spirit' };
const WTYPE = { sword: 'Sword', axe: 'Axe', mace: 'Mace', dagger: 'Dagger', staff: 'Staff', bow: 'Bow', gun: 'Gun', crossbow: 'Crossbow', wand: 'Wand' };
const KIND = { item: 'Items', mob: 'Creatures', quest: 'Quests', npc: 'People', place: 'Places', zone: 'Zones', dungeon: 'Dungeons' };
const push = (m, key, v) => (m[key] = m[key] || []).push(v);

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
for (const [id, d] of Object.entries(D.DUNGEONS)) P['dungeon/' + id] = { k: 'dungeon', n: d.name };

const lvlOf = (kind, id) => kind === 'mob' ? D.MOBS[id].lvl[1] : kind === 'quest' ? D.QUESTS[id].lvl : kind === 'place' ? (D.PLACES[id].lvl || [0])[0] : 0;
const byLvl = (kind) => (a, b) => lvlOf(kind, a) - lvlOf(kind, b);
const sec = (p, h, rows, head) => { if (rows.length) (p.sec = p.sec || []).push(head ? { h, head, rows } : { h, rows }); };
const where = (placeId) => { const pl = D.PLACES[placeId]; return [L('place', placeId), pl.lvl ? range(pl.lvl) : '', L('zone', pl.region) || pl.zone || '']; };
const factionOf = (f) => (f ? cap(f) : '');

for (const [id, it] of Object.entries(D.ITEMS)) {
  const p = P['item/' + id];
  p.sub = [itemKind(it), it.lvl > 1 ? `Level ${it.lvl}` : ''].filter(Boolean).join(', ');
  p.tip = itemTip(it);
  sec(p, 'Drops from', (dropsOf[id] || []).concat(qdropOf[id] || []).sort((a, b) => b[1] - a[1]).map(([m, ch]) => [L('mob', m), range(D.MOBS[m].lvl), pct(ch)]), ['Creature', 'Level', 'Chance']);
  sec(p, 'Boss loot', (lootOf[id] || []).map((m) => [L('mob', m), (dungeonsOfMob[m] || []).map((d) => L('dungeon', d))[0] || range(D.MOBS[m].lvl)]), ['Boss', 'Where']);
  sec(p, 'Needed for', (collectedFor[id] || []).sort(byLvl('quest')).map((q) => [L('quest', q), String(D.QUESTS[q].lvl)]), ['Quest', 'Level']);
  sec(p, 'Made with', (madeBy[id] || []).map((r) => { const R = D.RECIPES[r]; return [D.PROFESSIONS[R.prof].name + ' ' + R.sk[0], Object.entries(R.mats || {}).map(([m, n]) => (n > 1 ? n + '× ' : '') + ((D.ITEMS[m] || {}).name || m)).join(', ')]; }), ['Skill', 'Materials']);
  sec(p, 'Used to make', (usedIn[id] || []).map((r) => { const R = D.RECIPES[r]; return [L('item', R.makes), D.PROFESSIONS[R.prof].name + ' ' + R.sk[0], String(R.mats[id])]; }), ['Item', 'Skill', 'Needed']);
  if (it.source && !(lootOf[id] || []).length && !(dropsOf[id] || []).length) sec(p, 'Source', [[it.source]]);
  if (it.cost) sec(p, 'Price', [[typeof it.cost === 'number' ? money(it.cost) : JSON.stringify(it.cost)]]);
}

for (const [id, m] of Object.entries(D.MOBS)) {
  const p = P['mob/' + id], dg = (dungeonsOfMob[id] || [])[0], DG = dg && D.DUNGEONS[dg];
  const mult = DG ? (m.boss ? DG.bossMult : DG.trashMult) : null, u = E.mobUnit(id, m.lvl[1], mult);
  p.sub = [`Level ${range(m.lvl)}`, m.boss ? 'Boss' : m.elite ? 'Elite' : '', cap(m.family || '')].filter(Boolean).join(', ');
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
for (const [id, d] of Object.entries(D.DUNGEONS)) P['dungeon/' + id].f = { lv: d.minLvl, r: d.size > 5 ? 'raid' : 'dungeon' };
const FILTERS = {
  slot: Object.fromEntries(D.GEAR_SLOTS.map((s) => [s, D.SLOT_LABEL[s]]).concat([['use', 'Food, drink and potions'], ['mat', 'Trade goods'], ['quest', 'Quest items'], ['other', 'Other']])),
  stat: { sp: 'Spell power', int: 'Intellect', spi: 'Spirit', sta: 'Stamina', str: 'Strength', agi: 'Agility', fx: 'Has an effect' },
  quality: Object.fromEntries(D.QUALITY.map((q, i) => [i, q.name])),
  zone: Object.fromEntries(Object.keys(D.REGIONS).sort((a, b) => P['zone/' + a].f.lv - P['zone/' + b].f.lv).map((z) => ['zone/' + z, D.REGIONS[z].name]).concat(Object.keys(D.DUNGEONS).sort((a, b) => D.DUNGEONS[a].minLvl - D.DUNGEONS[b].minLvl).map((d) => ['dungeon/' + d, D.DUNGEONS[d].name]))),
  rank: { boss: 'Boss', elite: 'Elite', named: 'Named', normal: 'Normal', dungeon: 'Dungeon', group: 'Group', solo: 'Solo', town: 'Town', wild: 'Wilds', raid: 'Raid' },
};

// ---------------------------------------------------------------- lists and search
const lists = {};
for (const kind of Object.keys(KIND)) {
  const ids = Object.keys(P).filter((x) => P[x].k === kind).map((x) => x.split('/')[1]);
  const lv = (id) => kind === 'item' ? D.ITEMS[id].lvl || 0 : kind === 'dungeon' ? D.DUNGEONS[id].minLvl : lvlOf(kind, id);
  lists[kind] = ids.sort((a, b) => lv(a) - lv(b) || P[kind + '/' + a].n.localeCompare(P[kind + '/' + b].n));
}

// art as files next to the page, so the page itself stays small
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'icon'), { recursive: true }); fs.mkdirSync(path.join(OUT, 'mob'), { recursive: true });
const svg = (s) => (s && !/xmlns=/.test(s) ? s.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"') : s);
let icons = 0, mobs = 0;
for (const ic of new Set(Object.values(D.ITEMS).map((i) => i.icon))) { const s = ART.icon(ic); if (s) { fs.writeFileSync(path.join(OUT, 'icon', ic + '.svg'), svg(s)); icons++; } }
for (const id of Object.keys(D.MOBS)) { let s = null; try { s = ART.mob(id); } catch (e) { s = null; } if (s) { fs.writeFileSync(path.join(OUT, 'mob', id + '.svg'), svg(s)); mobs++; } else delete P['mob/' + id].mob; }

const VERSION = (fs.readFileSync(path.join(ROOT, 'app/pubspec.yaml'), 'utf8').match(/^version:\s*([^+\s]+)/m) || [])[1] || '';
const data = JSON.stringify({ v: VERSION, kinds: KIND, lists, filters: FILTERS, pages: P }).replace(/</g, '\\u003c');
const tpl = fs.readFileSync(path.join(ROOT, 'web/guide/index.html'), 'utf8');
const html = tpl.replace('/*FONTS*/', fs.readFileSync(path.join(ROOT, 'fonts/fonts.local.css'), 'utf8')).replace('/*DATA*/null', data);
fs.writeFileSync(path.join(OUT, 'index.html'), html);
console.log(`guide: ${Object.keys(P).length} pages, ${icons} icons, ${mobs} creature pictures, ${(html.length / 1024).toFixed(0)} KB → dist/guide/`);
