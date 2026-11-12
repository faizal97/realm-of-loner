// Season's Finest (#593): proposes a season's picks. For every class and each role it plays, the top level-60 blue or
// purple per slot by G.itemScore for that role, scored at its Mentor Mark ceiling (after Marks every piece reaches its
// ceiling, so the stat mix decides). Best comes from the NEW pool, Until then from the OLD pool, spread so no one place
// supplies most of a role's list when a close piece drops elsewhere. Prints the `best` and `until` objects to paste
// into src/data/finest.js. Picks are made per faction ('alliance' / 'horde', G.myFaction): a dungeon whose entrance is
// in the other faction's land (Temple of Shal'zua, The Sunken Archive) never supplies a list it can't reach.
// Run: node tools/finest_pick.js
'use strict';
const path = require('path');
globalThis.localStorage = (() => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; })();
for (const f of ['data', 'engine', 'bots', 'game']) require(path.join(__dirname, '..', 'src', f + '.js'));
const { G, D } = globalThis;

// Season 1's pools, by dungeon key: the newest raid and level-60 dungeons, and the older ones (#593)
const NEW = ['tidecrown_citadel', 'sunken_archive', 'shalzua_temple'];
const OLD = ['molten_core', 'onyxias_lair', 'scholomance', 'stratholme'];
const CLOSE = 0.95; // a piece within 5% of the top counts as a close alternative when spreading (#593)
const DUNGEON_CLOSE = 0.85; // an old dungeon's blue against a raid purple: the blue's ceiling is 92% of a purple's, so its margin is wider (#593)
const FIT = 0.6; // a slot's pick must reach 60% of the best piece for that slot in either pool, or the slot is left out (#593)

// where each item drops: dungeon keys (boss loot and dungeon drops)
const from = {};
for (const dk of NEW.concat(OLD)) for (const p of D.DUNGEONS[dk].pulls) for (const m of p.mobs) {
  const M = D.MOBS[m]; for (const id of (M.loot || []).concat((M.drops || []).map((d) => d[0]))) (from[id] = from[id] || new Set()).add(dk);
}
// a piece the class wears as its own: the weapon and ranged rules of G.canUseItem, armour of its own type (what the
// group's Need rolls treat as usable), or none
const wears = (it, cls, role) => G.canUseItem(it, cls) && (!it.atype || it.atype === D.CLASSES[cls].armorType || it.slot === 'back' || (role === 'healer' && G.canUseItem(it, cls))); /* a healer may wear lighter armour: level-60 mail and leather have almost no Intellect pieces (#593) */
const score = (it, cls, role) => G.itemScore(G.upgradedCopy(it, Infinity), cls, role);
// the faction a dungeon belongs to: its activity's entrance (G.placeFaction), or none when any faction can go (#593)
const facOf = (dk) => { const A = Object.values(D.ACTIVITIES).find((a) => a.dungeon === dk && a.where); return A ? G.placeFaction(A.where) || null : null; };
const FACTIONS = ['alliance', 'horde'];
const pool = (keys, cls, role) => Object.keys(from).filter((id) => { const it = D.ITEMS[id]; return it && (it.lvl || 0) >= D.LEVEL_CAP && it.q >= 3 && D.GEAR_SLOTS.includes(it.slot) && wears(it, cls, role) && keys.some((k) => from[id].has(k)); });
const placeOf = (id, keys) => keys.find((k) => from[id].has(k));

const out = { best: {}, until: {} }, report = [];
for (const fac of FACTIONS) {
const NEWF = NEW.filter((k) => !facOf(k) || facOf(k) === fac), OLDF = OLD.filter((k) => !facOf(k) || facOf(k) === fac);
out.best[fac] = {}; out.until[fac] = {};
for (const cls of Object.keys(D.CLASSES)) for (const role of D.CLASSES[cls].roles || [D.CLASSES[cls].role]) {
  const key = cls + ':' + role, nw = pool(NEWF, cls, role), old = pool(OLDF, cls, role);
  const ranked = (ids, slot) => ids.filter((id) => D.ITEMS[id].slot === slot).map((id) => ({ id, s: score(D.ITEMS[id], cls, role) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s || (a.id < b.id ? -1 : 1));
  const best = {}, until = {}, alts = {}, fits = {};
  for (const slot of D.GEAR_SLOTS) {
    const rn = ranked(nw, slot), ro = ranked(old, slot), top = Math.max(rn[0] ? rn[0].s : 0, ro[0] ? ro[0].s : 0);
    if (rn[0] && rn[0].s >= top * FIT) best[slot] = rn[0].id;
    const ok = ro.filter((x) => x.s >= top * FIT && x.id !== best[slot]);
    if (ok.length) { until[slot] = ok[0].id; alts[slot] = ok.filter((x) => x.s >= ok[0].s * CLOSE); fits[slot] = ok; }
  }
  // spread: while one place supplies more than half of Until then, move its weakest-margin slot to a close piece elsewhere
  const where = (id) => placeOf(id, OLDF);
  for (let guard = 0; guard < 10; guard++) {
    const n = {}; for (const s in until) n[where(until[s])] = (n[where(until[s])] || 0) + 1;
    const total = Object.keys(until).length, [big, cnt] = Object.entries(n).sort((a, b) => b[1] - a[1])[0] || [];
    if (!big || cnt * 2 <= total) break;
    const swap = Object.keys(until).filter((s) => where(until[s]) === big).map((s) => ({ s, alt: alts[s].find((x) => where(x.id) !== big) })).filter((x) => x.alt)
      .sort((a, b) => b.alt.s / alts[a.s][0].s - a.alt.s / alts[b.s][0].s)[0];
    if (!swap) break;
    until[swap.s] = swap.alt.id;
  }
  // at least one old dungeon (not a raid) in Until then when a close piece allows it
  const dungeon = (id) => !D.DUNGEONS[where(id)].raid;
  if (!Object.values(until).some(dungeon)) {
    const c = Object.keys(until).map((s) => ({ s, alt: fits[s].find((x) => dungeon(x.id) && x.s >= fits[s][0].s * DUNGEON_CLOSE) })).filter((x) => x.alt).sort((a, b) => b.alt.s / fits[b.s][0].s - a.alt.s / fits[a.s][0].s)[0];
    if (c) until[c.s] = c.alt.id;
  }
  out.best[fac][key] = best; out.until[fac][key] = until;
  const by = (o, keys) => { const n = {}; for (const s in o) { const k = placeOf(o[s], keys); n[k] = (n[k] || 0) + 1; } return Object.entries(n).map(([k, v]) => `${D.DUNGEONS[k].name} ${v}`).join(', '); };
  report.push(`${fac.padEnd(9)}${key.padEnd(15)} best ${String(Object.keys(best).length).padStart(2)} (${by(best, NEWF)}) | until ${String(Object.keys(until).length).padStart(2)} (${by(until, OLDF)})`);
}
}
const lit = (o) => '{\n' + Object.keys(o).map((k) => `        '${k}': { ${Object.entries(o[k]).map(([s, id]) => `${s}: '${id}'`).join(', ')} },`).join('\n') + '\n      }';
const byFac = (o) => '{\n' + FACTIONS.map((f) => `      ${f}: ${lit(o[f])},`).join('\n') + '\n    }';
console.log(`    best: ${byFac(out.best)},\n    until: ${byFac(out.until)},`);
console.error(report.join('\n'));
