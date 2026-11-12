// Season's Finest (#593): fills a season's lists so every class role has a Best and a Next best piece in every slot its
// class uses (ranged only for a hunter's bow or a bard's instrument), for each faction. The picks already in
// src/data/finest.js stay (a season adds, never moves); each empty slot takes the season's own piece for that tier: an
// item with `finest: <season id>` and `tier: 'best' | 'until'`, dropped by a boss's `finest` list (the season roll,
// G.finestRoll) in a place the faction can enter (G.placeFaction). The piece is the top one for the role by G.itemScore at
// its Mentor Mark ceiling; a close tie goes to the boss that supplies fewer slots so far, so no one place carries a list.
// Two lists were the same piece for piece (a warrior's tank and damage lists, a priest's healer and damage lists): in
// REFIT a new piece also replaces a kept one that is clearly worse for that role, and a priest's damage list scores as a
// mage does, since the priest's weights are its healer's. In Best, a season piece (made at the newest raid's budget,
// mostly dropped in older content) replaces a kept pick it beats for the role, so Best spreads over old content too.
// Prints the `best` and `until` objects to paste into src/data/finest.js; a report (counts, places, power) on stderr.
// Run: node tools/finest_pick.js [seasonId]   (default: the last season)
'use strict';
const path = require('path');
globalThis.localStorage = (() => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; })();
for (const f of ['data', 'engine', 'bots', 'game']) require(path.join(__dirname, '..', 'src', f + '.js'));
const { G, D } = globalThis;

const S = process.argv[2] ? D.FINEST_SEASONS.find((s) => String(s.id) === process.argv[2]) : D.FINEST_SEASONS[D.FINEST_SEASONS.length - 1];
const FACTIONS = ['alliance', 'horde'], TIERS = ['best', 'until'];
const SCORE_AS = { 'priest:dps': ['mage', 'dps'] }; // a priest's weights are its healer's: its damage list scores as a caster's
const REFIT = { 'warrior:tank': 1.03, 'priest:dps': 1.03 }; // a new piece replaces a kept one it beats by this much (lists that were identical)
const REPLACE_BEST = 1.02; // a season's Best piece from older content replaces a kept Best pick it beats by 2% for the role, so Best is not all the newest raid
const CLOSE = 0.98; // within 2% of the top piece counts as a tie when spreading

// where each item drops: [dungeon key, boss key], from boss tables and `finest` lists
const from = {};
for (const dk in D.DUNGEONS) for (const p of D.DUNGEONS[dk].pulls) if (p.boss) { const M = D.MOBS[p.mobs[0]]; for (const id of (M.loot || []).concat(M.finest || [])) (from[id] = from[id] || []).push([dk, p.mobs[0]]); }
const facOf = (dk) => { const A = Object.values(D.ACTIVITIES).find((a) => a.dungeon === dk && a.where); return A ? G.placeFaction(A.where) || null : null; };
const reach = (id, fac) => (from[id] || []).filter(([dk]) => !facOf(dk) || facOf(dk) === fac);
// a piece the class wears as its own: G.canUseItem, armour of its own type (a healer may wear lighter armour), or none
const wears = (it, cls, role) => G.canUseItem(it, cls) && (!it.atype || it.atype === D.CLASSES[cls].armorType || role === 'healer');
// a piece's power for the role: G.itemScore at its Mentor Mark ceiling, with an effect's stats counted back (an effect item
// gives up D.effectCost of its stats for the effect, so the effect is worth what it cost)
const score = (it, cls, role) => { const [c, r] = SCORE_AS[cls + ':' + role] || [cls, role], v = G.itemScore(G.upgradedCopy(it, Infinity), c, r); return it.effect && D.EFFECTS[it.effect] ? v / (1 - D.effectCost(it.effect)) : v; };
const slotsOf = (cls) => { const C = D.CLASSES[cls]; return D.GEAR_SLOTS.filter((s) => s !== 'ranged' || C.ranged || C.instrument); };
const fresh = Object.keys(D.ITEMS).filter((id) => D.ITEMS[id].finest === S.id && D.ITEMS[id].tier && from[id]);
const listOf = (tier, fac) => { const t = S[tier] || {}; return Object.keys(t).some((k) => k.indexOf(':') < 0) ? t[fac] || {} : t; };

const out = { best: {}, until: {} }, uses = {}, problems = [];
for (const fac of FACTIONS) {
  for (const t of TIERS) out[t][fac] = {};
  for (const cls of Object.keys(D.CLASSES)) for (const role of D.CLASSES[cls].roles || [D.CLASSES[cls].role]) {
    const key = cls + ':' + role;
    for (const tier of TIERS) {
      const L = Object.assign({}, listOf(tier, fac)[key] || {}), other = tier === 'until' ? out.best[fac][key] : null;
      const cands = (slot) => fresh.filter((id) => { const it = D.ITEMS[id]; return it.tier === tier && it.slot === slot && reach(id, fac).length && wears(it, cls, role) && (!other || other[slot] !== id); })
        .map((id) => ({ id, s: score(D.ITEMS[id], cls, role) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s || (a.id < b.id ? -1 : 1));
      for (const slot of slotsOf(cls)) {
        const c = cands(slot); if (!c.length) { if (!L[slot]) problems.push(`${fac} ${tier} ${key} ${slot}: no piece`); continue; }
        const boss = (id) => reach(id, fac)[0][1], close = c.filter((x) => x.s >= c[0].s * CLOSE).sort((a, b) => (uses[boss(a.id)] || 0) - (uses[boss(b.id)] || 0) || b.s - a.s);
        const pick = close[0];
        const by = tier === 'best' ? REPLACE_BEST : REFIT[key];
        if (!L[slot] || (by && pick.s > score(D.ITEMS[L[slot]], cls, role) * by && D.ITEMS[L[slot]].finest !== S.id)) { L[slot] = pick.id; uses[boss(pick.id)] = (uses[boss(pick.id)] || 0) + 1; }
      }
      out[tier][fac][key] = Object.fromEntries(slotsOf(cls).filter((s) => L[s]).map((s) => [s, L[s]]));
    }
  }
}

// report: list sizes, pieces per place for each tier, and Best's lead over Next best at the Mentor Mark ceiling
const rep = [], name = (dk) => D.DUNGEONS[dk].name;
for (const tier of TIERS) {
  const n = {}, nNew = {};
  for (const fac of FACTIONS) for (const key in out[tier][fac]) for (const s in out[tier][fac][key]) { const id = out[tier][fac][key][s], dk = reach(id, fac)[0][0]; n[dk] = (n[dk] || 0) + 1; if (D.ITEMS[id].finest === S.id) nNew[dk] = (nNew[dk] || 0) + 1; }
  rep.push(`${tier} slots by place (both factions; season pieces in brackets): ` + Object.keys(n).sort((a, b) => n[b] - n[a]).map((dk) => `${name(dk)} ${n[dk]} (${nNew[dk] || 0})`).join(', '));
}
const gaps = [], plain = [];
for (const fac of FACTIONS) for (const key in out.best[fac]) {
  const [cls, role] = key.split(':'), b = out.best[fac][key], u = out.until[fac][key];
  let sb = 0, su = 0, pb = 0, pu = 0; for (const s in b) if (u[s]) { const x = score(D.ITEMS[b[s]], cls, role), y = score(D.ITEMS[u[s]], cls, role); sb += x; su += y; if (!D.ITEMS[b[s]].effect && !D.ITEMS[u[s]].effect) { pb += x; pu += y; } }
  const g = sb / su - 1, gp = pb / pu - 1; gaps.push(g); plain.push(gp);
  rep.push(`${fac.padEnd(9)}${key.padEnd(15)} best ${Object.keys(b).length} until ${Object.keys(u).length} of ${slotsOf(cls).length}; Best over Next best after Marks ${(g * 100).toFixed(1)}% (slots without effects ${(gp * 100).toFixed(1)}%)`);
}
const sum = (a) => `mean ${(a.reduce((x, y) => x + y, 0) / a.length * 100).toFixed(1)}%, median ${(a.slice().sort((x, y) => x - y)[a.length >> 1] * 100).toFixed(1)}%, range ${(Math.min(...a) * 100).toFixed(1)}% to ${(Math.max(...a) * 100).toFixed(1)}%`;
rep.push(`Best over Next best after Marks, all slots: ${sum(gaps)}; slots without effects: ${sum(plain)}`);
const unused = fresh.filter((id) => !FACTIONS.some((f) => TIERS.some((t) => Object.values(out[t][f]).some((L) => Object.values(L).includes(id)))));
if (unused.length) rep.push('season pieces no list uses: ' + unused.join(', '));
for (const p of problems) rep.push('PROBLEM ' + p);

const lit = (o) => '{\n' + Object.keys(o).map((k) => `        '${k}': { ${Object.entries(o[k]).map(([s, id]) => `${s}: '${id}'`).join(', ')} },`).join('\n') + '\n      }';
const byFac = (o) => '{\n' + FACTIONS.map((f) => `      ${f}: ${lit(o[f])},`).join('\n') + '\n    }';
console.log(`    best: ${byFac(out.best)},\n    until: ${byFac(out.until)},`);
console.error(rep.join('\n'));
