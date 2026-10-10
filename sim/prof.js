// Professions end to end: train, gather nodes in the wild, smelt, craft, skin beasts, drink potions, equip a bag,
// and post trade goods on the auction house. Prints skill gained per real hour of gathering so the pace can be judged.
// seeded (as sim/brawl.js): the pace checks pass or fail on the code, not on luck
{ let s = 0x5eed1e55 >>> 0; Math.random = () => { s = (s + 0x6D2B79F5) >>> 0; let x = s; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
require('../src/data.js'); require('../src/engine.js'); require('../src/bots.js'); require('../src/game.js');
const { G, D } = globalThis;
const RealDate = Date; let t = new RealDate(2026, 9, 1, 12).getTime(); // a fixed clock: bots online and other time-of-day rules would make the pace vary run to run
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(t); } static now() { return t; } };
const tick = (secs, step = 1) => { for (let i = 0; i < secs / step; i++) { G.update(step); t += step * 1000; } };
let fails = 0; const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL', msg); } };

function gatherHour(place, level, prof, startSkill) {
  G.newGame({ name: 'T', cls: 'warrior', race: 'human' });
  const S = G.S, P = S.player; P.level = level; P.money = 1e6; P.place = place; S.flags.warModeAsked = true;
  G.trainProf(prof); if (level >= 10) { G.profs()[prof].skill = Math.max(50, startSkill); G.trainProf(prof); }
  G.profs()[prof].skill = startSkill;
  let gathered = 0; const t0 = t;
  while (t - t0 < 3600e3) {
    const nodes = G.placeNodes().filter((n) => G.skillColor(G.profs()[prof].skill, G.nodeSk(n.N)) >= 0);
    if (nodes.length && !P.casting) { G.gatherNode(nodes[0].i); tick(3); gathered++; } else tick(5);
    P.bags = P.bags.filter((b) => b.item.slot !== 'mat' || b.n < 20); // keep room
  }
  return { gathered, skill: G.profs()[prof].skill };
}
for (const [place, lvl, prof, sk] of [['crystal_lake', 8, 'mining', 1], ['crystal_lake', 8, 'herbalism', 1], ['the_longshore', 14, 'mining', 70], ['moonbrook', 18, 'herbalism', 100]]) {
  const r = gatherHour(place, lvl, prof, sk);
  console.log(`${prof.padEnd(10)} at ${place.padEnd(14)} (lvl ${lvl}) from ${sk}: ${r.gathered} nodes/hour → skill ${r.skill}`);
  ok(r.gathered >= 20, prof + ' too few nodes at ' + place);
}

// crafting chain: smelt copper, make bracers, learn a rare plan, use items
G.newGame({ name: 'T', cls: 'warrior', race: 'human' });
{
  const S = G.S, P = S.player; P.level = 20; P.money = 1e6; S.flags.warModeAsked = true; P.place = 'stormwind';
  G.trainProf('mining'); G.trainProf('blacksmithing'); G.trainProf('alchemy');
  ok(Object.keys(G.profs()).length === 2, 'third profession must be refused');
  G.addItem(G.copyItem('copper_ore'), 20);
  G.craft('smelt_copper', 20); tick(40, 0.5);
  ok(G.countItem('copper_bar') === 20, 'smelted 20 copper bars, got ' + G.countItem('copper_bar'));
  ok(G.profs().mining.skill > 15, 'mining skill from smelting ' + G.profs().mining.skill);
  G.craft('bs_copper_bracers', 3); tick(10, 0.5);
  ok(G.countItem('copper_bracers') === 3, 'bracers made ' + G.countItem('copper_bracers'));
  const bsSkill = G.profs().blacksmithing.skill; ok(bsSkill >= 3, 'bs skill ' + bsSkill);
  G.profs().blacksmithing.skill = 75; G.trainProf('blacksmithing'); G.profs().blacksmithing.skill = 145;
  G.addItem(G.copyItem('rc_bs_silvered_breastplate'), 1);
  G.useItem(P.bags.findIndex((b) => b.item.id === 'rc_bs_silvered_breastplate'));
  ok(G.recipesFor('blacksmithing').some((r) => r.id === 'bs_silvered_breastplate'), 'rare plan learned');
  G.addItem(G.copyItem('bronze_bar'), 10); G.addItem(G.copyItem('silver_bar'), 2);
  G.craft('bs_silvered_breastplate', 1); tick(3, 0.5);
  const bp = P.bags.find((b) => b.item.id === 'silvered_bronze_breastplate');
  ok(bp && bp.item.q === 3 && bp.item.crafter === 'T', 'breastplate crafted');
  // sharpening stone raises weapon damage
  const w0 = G.stats().wMin; G.addItem(G.copyItem('rough_sharpening_stone'), 1); G.useItem(P.bags.findIndex((b) => b.item.id === 'rough_sharpening_stone'));
  ok(G.stats().wMin === w0 + D.ITEMS.rough_sharpening_stone.wdmg, 'a sharpening stone adds its weapon damage');
  // elixir
  const s0 = G.stats().str; G.addItem(G.copyItem('elixir_lions_strength'), 1); G.useItem(P.bags.findIndex((b) => b.item.id === 'elixir_lions_strength'));
  ok(G.stats().str === s0 + 4, 'elixir +4 str');
  // armour kit on the chest
  G.equip(P.bags.findIndex((b) => b.item.id === 'silvered_bronze_breastplate'));
  const a0 = P.equip.chest.armor; G.addItem(G.copyItem('medium_armor_kit'), 2); G.useItem(P.bags.findIndex((b) => b.item.id === 'medium_armor_kit'));
  ok(P.equip.chest.armor === a0 + 16, 'kit +16 armor on chest');
  // bags
  const cap0 = G.bagCap(); G.addItem(G.copyItem('woolen_bag'), 1); G.useItem(P.bags.findIndex((b) => b.item.id === 'woolen_bag'));
  ok(G.bagCap() === cap0 + 8, 'woolen bag +8');
  // potions in combat
  G.addItem(G.copyItem('healing_potion'), 3);
  P.place = 'moonbrook'; G.placeMobs(); tick(2);
  const m = G.placeMobs().find((x) => x.state === 'alive'); G.engage(m.id); tick(2, 0.1);
  if (G.fight) { G.pUnit.hp = 50; G.usePotion('heal'); ok(G.pUnit.hp > 300, 'potion healed in combat ' + G.pUnit.hp); G.usePotion('heal'); ok(G.countItem('healing_potion') === 2, 'cooldown blocks a second potion'); }
  else ok(false, 'no fight started');
  while (G.fight) tick(0.5, 0.1);
  // auction trade goods
  G.addItem(G.copyItem('copper_bar'), 1); P.place = 'stormwind_bank';
  // priced where a sale is certain (#20: the usual price sells 82% of the time), so the check doesn't ride on the seed
  const idx = P.bags.findIndex((b) => b.item.id === 'copper_bar'), n = P.bags[idx].n, v = Math.floor(G.ahValue(D.ITEMS.copper_bar) * n * G.AH_CURVE.sure);
  G.ahPost(idx, v); ok(S.ah.mine.length === 1 && S.ah.mine[0].n === n, 'posted a stack of bars');
  const before = P.money; tick(3 * 3600, 30); ok(P.money > before, 'bar stack sold');
  ok(G.ahListings().some((l) => !D.GEAR_SLOTS.includes(l.item.slot)), 'bots list trade goods');
}
// skinning on world kills
G.newGame({ name: 'T', cls: 'warrior', race: 'human' });
{
  const S = G.S, P = S.player; P.level = 12; P.money = 1e6; S.flags.warModeAsked = true; P.equip = G.botChar({ name: 'x', cls: 'warrior', race: 'human', level: 12, skill: 0.6 }).equip; P.hp = null;
  G.trainProf('skinning'); G.profs().skinning.skill = 50; G.trainProf('skinning');
  P.place = 'the_longshore';
  for (let k = 0; k < 30; k++) {
    const m = G.placeMobs().find((x) => x.state === 'alive' && D.MOBS[x.key].family === 'beast'); if (!m) { tick(10); continue; }
    G.engage(m.id); G.pUnit.kind = 'bot'; G.pUnit.bot = { skill: 0.7, react: 0.5 }; G.pUnit.role = 'dps';
    while (G.fight) tick(0.5, 0.1);
    P.hp = null; tick(2);
  }
  console.log(`skinning: 30 beast fights → ${G.countItem('light_leather')} light leather, skill ${G.profs().skinning.skill}`);
  ok(G.countItem('light_leather') > 5, 'skinning yields leather');
}
// ---- Expert (v10.9, docs/plans/2026-10-02-professions-expert.md)
// the rank: from level 30 with 125 skill, up to 225
{
  G.newGame({ name: 'E', cls: 'warrior', race: 'human' }); const P = G.S.player; P.money = 1e7; P.level = 30;
  G.trainProf('mining'); G.profs().mining.skill = 50; G.trainProf('mining'); G.profs().mining.skill = 150; G.trainProf('mining');
  ok(G.profs().mining.max === 225, 'a level-30 miner with 150 skill trains Expert (225)');
  G.newGame({ name: 'E2', cls: 'warrior', race: 'human' }); const Q = G.S.player; Q.level = 29; Q.money = 1e7;
  G.trainProf('mining'); G.profs().mining.skill = 150; G.profs().mining.max = 150; G.trainProf('mining');
  ok(G.profs().mining.max === 150, 'Expert waits for level 30');
}
// ore, herbs, leather and silk by level
{
  const has = (L, kind, k) => D.nodeTable(L)[kind].some((x) => x[0] === k && x[1] > 0);
  const w = (L, kind, k) => (D.nodeTable(L)[kind].find((x) => x[0] === k) || [0, 0])[1];
  ok(w(27, 'ore', 'iron') >= 6 && w(24, 'ore', 'iron') <= 1 && !has(18, 'ore', 'iron'), 'iron veins from level 26 (a few from 22)');
  ok(has(36, 'ore', 'embersilver') && has(31, 'ore', 'gold'), 'embersilver from 35, gold from 30');
  ok(has(41, 'herb', 'rimeleaf') && has(33, 'herb', 'dimleaf') && has(29, 'herb', 'redmantle'), 'the Expert herbs grow by level');
  ok(D.skinLeather(32) === 'heavy_leather' && D.skinLeather(42) === 'thick_leather' && D.skinLeather(24) === 'medium_leather', 'leather by the beast level');
  G.newGame({ name: 'L', cls: 'warrior', race: 'human' }); const hum = Object.keys(D.MOBS).find((k) => D.MOBS[k].family === 'humanoid' && !D.MOBS[k].boss);
  let silk = 0, wool = 0; for (let i = 0; i < 300; i++) for (const it of G.rollLoot(hum, 32).items) { if (it.id === 'silk_cloth') silk++; if (it.id === 'wool_cloth') wool++; }
  ok(silk > 40 && wool === 0, `level-32 humanoids drop silk, not wool (${silk} silk in 300)`);
}
// recipes: every Expert recipe's item and materials exist; a smith smelts steel and forges a Steel Longsword
{
  const R = Object.values(D.RECIPES).filter((r) => r.sk[0] >= 125);
  ok(R.length >= 40 && R.every((r) => D.ITEMS[r.makes] && Object.keys(r.mats).every((m) => D.ITEMS[m])), `${R.length} Expert recipes, every item and material exists`);
  ok(['blacksmithing', 'alchemy', 'leatherworking', 'tailoring'].every((p) => R.filter((r) => r.prof === p && r.rare && r.sk[0] >= 150 && r.sk[0] < 225).length === 1), 'one rare Expert recipe per craft');
  G.newGame({ name: 'S', cls: 'warrior', race: 'human' }); const P = G.S.player; P.level = 34; P.money = 1e7; G.S.flags.warModeAsked = true;
  for (const pr of ['mining', 'blacksmithing']) { G.trainProf(pr); G.profs()[pr].skill = 50; G.trainProf(pr); G.profs()[pr].skill = 150; G.trainProf(pr); G.profs()[pr].skill = 175; }
  G.addItem(G.copyItem('iron_ore'), 6); G.addItem(G.copyItem('smithing_coal'), 6); G.addItem(G.copyItem('heavy_stone'), 2);
  G.craft('smelt_iron', 6); tick(20); G.craft('smelt_steel', 6); tick(20);
  ok(G.countItem('steel_bar') === 6, `six iron ore and six coal make six steel bars (${G.countItem('steel_bar')})`);
  G.craft('bs_steel_longsword', 1); tick(3);
  ok(P.bags.some((b) => b.item.id === 'steel_longsword'), 'and a Steel Longsword');
}
// rare recipes drop for the level they come from
{
  const lvOf = (id) => D.ITEMS[D.RECIPES[D.ITEMS[id].teaches].makes].lvl;
  const at44 = new Set(), at22 = new Set(); for (let i = 0; i < 300; i++) { at44.add(G.pickRare(44)); at22.add(G.pickRare(22)); }
  ok([...at44].every((id) => lvOf(id) >= 36) && at44.size >= 3, `level 44 drops Expert rares (${[...at44].map(lvOf).join(',')})`);
  ok([...at22].every((id) => lvOf(id) <= 30), `level 22 drops Journeyman rares (${[...at22].map(lvOf).join(',')})`);
}
// the auction house trades Expert goods around level 38
{
  G.newGame({ name: 'A', cls: 'warrior', race: 'human' }); G.S.player.level = 38; G.S.flags.warModeAsked = true;
  const EX = new Set(['iron_ore', 'iron_bar', 'ironthistle', 'redmantle', 'heavy_leather', 'silk_cloth', 'greater_healing_potion', 'embersilver_ore', 'stoutroot', 'dimleaf', 'goldspur', 'thick_leather', 'silk_bolt', 'mana_potion']);
  let seen = 0; for (let i = 0; i < 5; i++) { seen += G.ahListings().filter((l) => EX.has(l.item.id)).length; tick(31 * 60, 60); }
  ok(seen > 0, `a level-38 player finds Expert goods at the auction house (${seen} listings over 5 refreshes)`);
}
// the Expert pace: a character levelling 25 -> 45 with a gathering and a crafting profession, an hour of play in each of
// four zone bands (gathering what is there, or skinning and looting what it kills), crafting from what it got and the
// vendor's supplies, best colour first. It should reach about 225 in both by level 45, with no grinding.
const EXPERT_BANDS = [[30, 'the_hushed_bank', 'dun_modr'], [31, 'lake_nazferiti', 'zuuldaia_ruins'], [34, 'balia_mah_ruins', 'venture_base_camp'], [36, 'highland_plains', 'drywhisker_gorge'], [38, 'thunderhowl_rise', 'stromgarde_keep'], [43, 'noxious_lair', 'lost_rigger_cove'], [45, 'frayfeather_highlands', 'zul_farrak_gate']];
// the Artisan pace (v10.9 beta 5): 45 -> 60, an hour in each band (beasts for leather and nodes in the wild place, humanoids for cloth)
const ARTISAN_BANDS = [[46, 'frayfeather_highlands', 'the_forgotten_coast'], [48, 'lower_wilds', 'the_forgotten_coast'], [51, 'terror_run', 'blackrock_stronghold'], [53, 'the_marshlands', 'blackrock_stronghold'], [55, 'the_marshlands', 'hearthglen'], [57, 'frostsaber_rock', 'hearthglen'], [59, 'frostwhisper_gorge', 'winterfall_village']];
function expertPace(gather, craft, o) {
  o = o || { from: 25, skill: 150, rank: [30, 225], bands: EXPERT_BANDS };
  G.newGame({ name: 'X', cls: 'warrior', race: 'human' }); const S = G.S, P = S.player; P.money = 1e8; S.flags.warModeAsked = true; P.level = o.from;
  for (const pr of [gather, craft]) { G.trainProf(pr); G.profs()[pr].skill = 50; G.trainProf(pr); G.profs()[pr].skill = 150; if (o.skill > 150) { P.level = Math.max(P.level, 30); G.trainProf(pr); G.profs()[pr].skill = o.skill; P.level = o.from; } }
  P.bagsEq = [0, 1, 2, 3].map(() => G.copyItem('woolen_bag')); // a levelling player carries bags, and sells what its professions do not use
  const BANDS = o.bands;
  const used = new Set(Object.values(D.RECIPES).filter((r) => r.prof === gather || r.prof === craft).flatMap((r) => Object.keys(r.mats).concat(r.makes)));
  const room = () => { P.bags = P.bags.filter((b) => b.item.slot === 'mat' ? used.has(b.item.id) : !D.GEAR_SLOTS.concat(['potion', 'elixir', 'stone', 'kit', 'bag']).includes(b.item.slot)); };
  // smelt ore into bars first, then the craft, then whatever else the gathering skill makes (steel from spare iron)
  const craftAll = () => {
    // (a player smelts ore and weaves bolts even when the recipe is grey: the bars and bolts are what the craft needs)
    // and keeps a small stock of what the craft needs from the gathering skill (steel for a smith), grey or not
    const needs = new Set(Object.values(D.RECIPES).filter((r) => r.prof === craft).flatMap((r) => Object.keys(r.mats)));
    const stock = (r) => needs.has(r.makes) && G.countItem(r.makes) < 12;
    // and weaves all its cloth into bolts first (a craft's own materials), as a player does before picking a pattern (issue #6)
    const stages = [[gather, (r) => Object.keys(r.mats).some((m) => /_ore$/.test(m)), true], [craft, (r) => D.ITEMS[r.makes].slot === 'mat', true]];
    for (let i = 0; i < 25; i++) stages.push([gather, stock, true], [craft, () => true, false]); // make, craft, again until nothing is left to make
    stages.push([gather, () => true, false]);
    for (const [pr, only, grey] of stages) for (let guard = 0; guard < 400; guard++) {
      const p = G.profs()[pr]; if (!p) break;
      for (const v of ['smithing_coal', 'fine_thread', 'sturdy_vial', 'coarse_thread', 'empty_vial']) if (G.countItem(v) < 10) G.addItem(G.copyItem(v), 20);
      const r = G.recipesFor(pr).filter((x) => only(x) && G.craftable(x.id) > 0 && G.skillColor(p.skill, x.sk) >= 0 && (G.skillColor(p.skill, x.sk) < 3 || grey || (pr === craft && D.ITEMS[x.makes].slot === 'mat'))).sort((a, b) => G.skillColor(p.skill, a.sk) - G.skillColor(p.skill, b.sk) || b.sk[0] - a.sk[0])[0];
      if (!r) break; G.craft(r.id, 1); tick(3); room();
    }
  };
  const stage = (BANDS, rank) => { for (const [L, wild, hum] of BANDS) {
    P.level = L; if (L >= rank[0]) for (const pr of [gather, craft]) if (G.profs()[pr].max < rank[1]) G.trainProf(pr);
    const t0 = t;
    if (gather === 'skinning' || craft === 'tailoring') { // an hour of fighting: beasts for leather, humanoids for cloth
      const want = (gather === 'skinning' ? [[wild, 'beast']] : []).concat(craft === 'tailoring' ? [[hum, 'humanoid']] : []);
      for (const [place, fam] of want) {
        const pl = D.PLACES[place], keys = pl.mobs.map((m) => m[0]).filter((k) => D.MOBS[k] && D.MOBS[k].family === fam);
        for (let k = 0; k < 90 / want.length && keys.length; k++) { const m = keys[k % keys.length]; for (const it of G.rollLoot(m, Math.round((pl.lvl[0] + pl.lvl[1]) / 2)).items) if (it.slot === 'mat') G.addItem(it, 1); }
      }
      t += 3600e3;
    }
    if (gather === 'mining' || gather === 'herbalism') {
      P.place = wild;
      while (t - t0 < 3600e3) {
        const nodes = G.placeNodes().filter((n) => n.N.prof === gather && G.skillColor(G.profs()[gather].skill, G.nodeSk(n.N)) >= 0);
        if (nodes.length && !P.casting) { G.gatherNode(nodes[0].i); tick(3); room(); } else tick(5);
      }
    }
    room(); craftAll();
    if (process.env.PDBG && craft === 'blacksmithing') { const p2 = G.profs()[craft]; console.log('   recipes', G.recipesFor(craft).filter((x) => x.sk[0] >= 150 || G.skillColor(p2.skill, x.sk) < 3).map((x) => `${x.id}:c${G.skillColor(p2.skill, x.sk)}:n${G.craftable(x.id)}`).join(' ')); }
    if (process.env.PDBG) console.log(`  L${L} ${gather} ${G.profs()[gather].skill} ${craft} ${G.profs()[craft].skill} · ${P.bags.filter((b) => b.item.slot === 'mat').map((b) => b.item.id + ' ' + b.n).join(', ')}`);
  } return [gather, craft].map((pr) => G.profs()[pr].skill); };
  // the path a player plays (issue #6): Expert 25 -> 45, then the same character on to Artisan 45 -> 60
  return [stage(EXPERT_BANDS, [30, 225]), stage(ARTISAN_BANDS, [45, 300])];
}
for (const [g, c] of [['mining', 'blacksmithing'], ['herbalism', 'alchemy'], ['skinning', 'leatherworking'], ['skinning', 'tailoring']]) {
  const [[gs, cs], [gs2, cs2]] = expertPace(g, c);
  console.log(`Pace, ${g} + ${c}: level 45 with ${g} ${gs}, ${c} ${cs} · level 60 with ${g} ${gs2}, ${c} ${cs2}`);
  ok(gs >= 200 && cs >= 200, `${g} + ${c} can train Artisan (200) on reaching level 45 (${gs}, ${cs})`);
  ok(gs2 >= 290 && cs2 >= 290, `${g} + ${c} reach about 300 by level 60 (${gs2}, ${cs2})`); // issue #6: no grind after 60 for any craft
}
// quest marks (v10.9 fix): once a kill objective is done, its monster is no longer one your quests need
{
  G.newGame({ name: 'Q', cls: 'warrior', race: 'human' }); const P = G.S.player;
  const [qid, Q] = Object.entries(D.QUESTS).find(([, X]) => X.objs.filter((o) => o.type === 'kill').length >= 2 && !X.group);
  const ks = Q.objs.map((o, i) => [o, i]).filter(([o]) => o.type === 'kill');
  P.quests[qid] = { prog: Q.objs.map(() => 0) }; P.quests[qid].prog[ks[0][1]] = ks[0][0].n;
  const m = G.questMobs();
  ok(!m.has(ks[0][0].mob) && m.has(ks[1][0].mob), `a finished kill objective no longer marks its monster (${qid}: ${ks[0][0].mob} done, ${ks[1][0].mob} still needed)`);
}
// ---- Fishing and Cooking (v10.9, docs/plans/2026-10-02-fishing-cooking.md)
// secondary skills: on top of two professions
{
  G.newGame({ name: 'F', cls: 'warrior', race: 'human' }); const P = G.S.player; P.level = 10; P.money = 1e6;
  G.trainProf('mining'); G.trainProf('herbalism'); G.trainProf('cooking'); G.trainProf('fishing');
  ok(G.hasProf('cooking') && G.hasProf('fishing') && G.primaryCount() === 2, 'a miner-herbalist still learns Cooking and Fishing');
  G.trainProf('skinning'); ok(!G.hasProf('skinning'), 'a third primary profession is still refused');
}
// waters and fish
{
  const bad = D.WATERS.filter((w) => !D.PLACES[w] || !D.waterTier(w)); ok(!bad.length, `every water is a place with a tier (${bad.join(',')})`);
  const fish = Object.values(D.FISH).flatMap((T) => T.common.map((c) => c[0]).concat(T.big[0], T.rare[0])); ok(fish.every((f) => D.ITEMS[f]), 'every fish is an item');
  ok([1, 2, 3, 4].every((t) => D.WATERS.some((w) => D.waterTier(w) === t)), 'there is water to fish in every tier');
}
// the fishing loop: wait, bite, tap; the reel for big and rare fish; auto
{
  G.newGame({ name: 'F', cls: 'warrior', race: 'human' }); const P = G.S.player; P.level = 12; P.money = 1e6; G.S.flags.warModeAsked = true; P.place = 'crystal_lake';
  P.bagsEq = [0, 1, 2, 3].map(() => G.copyItem('woolen_bag')); G.trainProf('fishing'); G.profs().fishing.skill = 60; G.profs().fishing.max = 75;
  const cast = (play) => { if (!G.fishStart(play === 'auto')) return null; let g = 0; while (P.fishing && P.fishing.phase !== 'done' && g++ < 400) {
    if (play === 'tap' && P.fishing.phase === 'bite') G.fishTap();
    if (play === 'early' && P.fishing.phase === 'wait') G.fishTap();
    if (P.fishing && P.fishing.phase === 'reel') { const r = P.fishing.reel; G.fishReel(r.fish > r.zone, 0.05); t += 50; continue; }
    tick(0.1, 0.1); }
    return P.fishing && P.fishing.phase === 'done' ? P.fishing : null; };
  const kinds = { auto: {}, tap: {} }; let early = 0;
  for (let i = 0; i < 200; i++) { const a = cast('auto'); if (a && a.caught) kinds.auto[a.fish.kind] = (kinds.auto[a.fish.kind] || 0) + 1; }
  for (let i = 0; i < 200; i++) { const a = cast('tap'); if (a && a.caught) kinds.tap[a.fish.kind] = (kinds.tap[a.fish.kind] || 0) + 1; }
  for (let i = 0; i < 20; i++) { const a = cast('early'); if (a && a.result === 'early') early++; }
  P.bags = P.bags.filter((b) => b.item.slot !== 'mat');
  console.log(`fishing at skill 60: auto ${JSON.stringify(kinds.auto)}, tapping and reeling ${JSON.stringify(kinds.tap)}`);
  ok(!kinds.auto.big && !kinds.auto.rare && (kinds.auto.common || 0) > 150, 'Auto lands common fish only');
  ok(kinds.tap.big > 10 && kinds.tap.rare > 2 && kinds.tap.common > 120, 'tapping on the bite lands commons, and a reel that follows the fish lands big and rare ones');
  ok(early === 20, 'pulling before the bite loses the fish');
  ok(G.profs().fishing.skill > 60, `catches raise the skill (${G.profs().fishing.skill})`);
  P.place = 'lake_nazferiti'; ok(/Fishing 150/.test(G.fishWhy() || ''), `low skill cannot fish a tier-3 water (${G.fishWhy()})`);
}
// meat, cooking with a quality, Well Fed
{
  G.newGame({ name: 'C', cls: 'warrior', race: 'human' }); const P = G.S.player; P.level = 20; P.money = 1e6; G.S.flags.warModeAsked = true; P.place = 'stormwind';
  P.bagsEq = [0, 1, 2, 3].map(() => G.copyItem('woolen_bag')); G.trainProf('cooking'); G.profs().cooking.skill = 50; G.trainProf('cooking'); G.profs().cooking.skill = 125;
  const beast = Object.keys(D.MOBS).find((k) => D.MOBS[k].family === 'beast' && !D.MOBS[k].boss); let meat = 0; for (let i = 0; i < 200; i++) meat += G.rollLoot(beast, 20).items.filter((it) => it.id === 'tough_meat').length;
  ok(meat > 40 && meat < 100, `a cook loots meat from beasts (${meat} tough meat from 200 level-20 beasts)`);
  const batch = (q) => { P.bags = P.bags.filter((b) => !['ironjaw_catfish', 'catfish_gumbo', 'cooking_spices'].includes(b.item.id)); G.addItem(G.copyItem('ironjaw_catfish'), 10); G.addItem(G.copyItem('cooking_spices'), 10); G.cook('ck_catfish_gumbo', 10, q); tick(25); return G.countItem('catfish_gumbo'); };
  const n = batch('normal'), pf = batch('perfect'), bt = batch('burnt');
  ok(n === 10 && pf === 12 && bt === 9, `ten fish cook into 10 normally, 12 Perfect, 9 when burnt (${n}, ${pf}, ${bt})`);
  ok(G.cookResult('ck_catfish_gumbo', 0.62) === 'perfect' && G.cookResult('ck_catfish_gumbo', 0.4) === 'normal' && G.cookResult('ck_catfish_gumbo', 0.9) === 'burnt' && G.cookResult('ck_catfish_gumbo', null) === 'burnt', 'the heat bar: gold is Perfect, the rest Normal, the burnt end Burnt');
  // an average cook stops the needle within about a tenth of the bar of the middle of the gold
  let perfect = 0; for (let i = 0; i < 1000; i++) { const g = () => (Math.random() + Math.random() + Math.random() - 1.5) * 0.17; if (G.cookResult('ck_catfish_gumbo', G.COOK_BAR.gold + g()) === 'perfect') perfect++; }
  console.log(`an average cook at 125 skill on a 125 recipe: ${Math.round(perfect / 10)}% Perfect`);
  ok(perfect > 200 && perfect < 450, 'about 1 in 3 Perfect for an average cook');
  P.level = 30; G.consume('food'); ok((P.auras || []).some((a) => a.id === 'wellfed' && a.stats.sta === 6), 'a gumbo makes you Well Fed (+6 Stamina)');
  G.addItem(G.copyItem('hunters_stew'), 1); P.eating = null; P.bags = P.bags.filter((b) => b.item.id !== 'catfish_gumbo'); G.consume('food');
  ok(P.auras.filter((a) => a.id === 'wellfed').length === 1 && P.auras.find((a) => a.id === 'wellfed').stats.str === 5, 'a second meal replaces the first Well Fed');
}
// the Fishing and Cooking pace: a player fishing about ten minutes every few levels (tapping on the bite, and an average
// hand on the reel), cooking what they catch and the meat of 30 beasts, with an average cook's heat bar. Both should reach
// about 225 by level 45, Apprentice to Expert, with no grinding.
{
  G.newGame({ name: 'K', cls: 'warrior', race: 'human' }); const P = G.S.player; P.money = 1e8; G.S.flags.warModeAsked = true;
  P.bagsEq = [0, 1, 2, 3].map(() => G.copyItem('woolen_bag'));
  const BANDS = [[8, 'crystal_lake', 'crystal_lake'], [13, 'forgotten_pools', 'the_longshore'], [17, 'moonbrook', 'moonbrook'], [21, 'lake_everstill', 'cragpool_lake'],
    [26, 'saltspray_glen', 'the_hushed_bank'], [31, 'lake_nazferiti', 'lake_nazferiti'], [36, 'saltpenny_wharf', 'highland_plains'], [41, 'waterspring_field', 'thunderhowl_rise'], [44, 'lost_rigger_cove', 'noxious_lair']];
  const train = () => { for (const pr of ['fishing', 'cooking']) for (let k = 0; k < 3; k++) { const R = G.nextRank(pr); if (R && R.ok) G.trainProf(pr); } };
  const keep = new Set(Object.values(D.RECIPES).filter((r) => r.prof === 'cooking').flatMap((r) => Object.keys(r.mats)));
  for (const [L, water, wild] of BANDS) {
    P.level = L; P.place = water; train();
    const t0 = t;
    while (t - t0 < 600e3) {
      if (!G.fishStart(false)) { tick(5); continue; }
      let g = 0, reelErr = 0; while (P.fishing && P.fishing.phase !== 'done' && g++ < 2000) {
        if (P.fishing.phase === 'bite' && Math.random() < 0.92) G.fishTap(); // an average player sees most bites
        if (P.fishing && P.fishing.phase === 'reel') { const r = P.fishing.reel; if (Math.random() < 0.08) reelErr = (Math.random() - 0.5) * 0.3; G.fishReel(r.fish + reelErr > r.zone, 0.05); t += 50; continue; }
        tick(0.1, 0.1);
      }
      P.bags = P.bags.filter((b) => b.item.slot !== 'mat' || keep.has(b.item.id));
    }
    const pl = D.PLACES[wild], beasts = pl.mobs.map((m) => m[0]).filter((k) => D.MOBS[k] && D.MOBS[k].family === 'beast');
    for (let k = 0; k < 30 && beasts.length; k++) for (const it of G.rollLoot(beasts[k % beasts.length], L).items) if (it.slot === 'mat') G.addItem(it, 1);
    // cook: best colour first, an average hand on the heat bar
    for (let guard = 0; guard < 300; guard++) {
      const p = G.profs().cooking; if (G.countItem('cooking_spices') < 10) G.addItem(G.copyItem('cooking_spices'), 20);
      const r = G.recipesFor('cooking').filter((x) => G.craftable(x.id) > 0 && G.skillColor(p.skill, x.sk) >= 0 && G.skillColor(p.skill, x.sk) < 3).sort((a, b) => G.skillColor(p.skill, a.sk) - G.skillColor(p.skill, b.sk) || b.sk[0] - a.sk[0])[0];
      if (!r) break; const q = G.cookResult(r.id, G.COOK_BAR.gold + (Math.random() + Math.random() + Math.random() - 1.5) * 0.17);
      G.cook(r.id, 1, q); tick(3); P.bags = P.bags.filter((b) => b.item.slot !== 'food');
    }
    if (process.env.PDBG) console.log(`  L${L} fishing ${G.profs().fishing.skill}/${G.profs().fishing.max} cooking ${G.profs().cooking.skill}/${G.profs().cooking.max}`);
  }
  const fs = G.profs().fishing.skill, cs = G.profs().cooking.skill;
  console.log(`Fishing and Cooking pace: level 45 with fishing ${fs}, cooking ${cs}`);
  ok(fs >= 200 && cs >= 195, `fishing and cooking reach Expert's top by level 45 (${fs}, ${cs})`);
}
// harder for rarer: deeper water fights harder, rare harder than big; a Well Fed meal and a rare-fish dish are harder to get Perfect
{
  const f1 = G.fishFeel('big', 1), f3 = G.fishFeel('big', 3), r3 = G.fishFeel('rare', 3);
  ok(f3.zone < f1.zone && f3.speed > f1.speed && f3.drain > f1.drain && f3.window < f1.window, 'a big fish in deep water fights harder than in shallow water');
  ok(r3.zone < f3.zone && r3.speed > f3.speed && r3.window < f3.window, 'a rare fish fights harder than a big one in the same water');
  G.newGame({ name: 'H', cls: 'warrior', race: 'human' }); G.S.player.prof = { cooking: { skill: 70, max: 75, known: [] } };
  const w = (rid) => { const z = G.cookZone(rid); return z.gold[1] - z.gold[0]; };
  ok(w('ck_glimmerscale_supper') < w('ck_spiced_pike') * 0.8, 'a dish of a rare fish has a narrower gold zone than a Well Fed meal');
}
// crafted gear on the drop curve (v10.9 beta 5): the same stat budget as a random drop of that level and quality
{
  const budget = (L, q) => Math.max(1, Math.round(D.gearBudget(L, q))); // the live drop curve, so a curve change (#141) can't leave a stale copy here
  const sum = (it) => Object.values(it.stats || {}).reduce((a, b) => a + b, 0);
  const off = Object.entries(D.ITEMS).filter(([, it]) => it.crafted && it.q >= 2 && it.stats && !it.fixedStats && Math.abs(sum(it) - budget(it.lvl, it.q)) > 3);
  ok(!off.length, 'crafted gear has the drop curve\'s stat budget: ' + off.slice(0, 4).map(([k, it]) => `${k} ${sum(it)} vs ${budget(it.lvl, it.q)}`).join(', '));
  ok(sum(D.ITEMS.embersilver_breastplate) <= budget(44, 3) + 2 && sum(D.ITEMS.embersilver_breastplate) < budget(60, 3), 'the level-44 Expert rare is a level-44 blue, not a level-60 one (' + sum(D.ITEMS.embersilver_breastplate) + ')');
}
// Artisan (v10.9 beta 5): from level 45 with 200 skill, up to 300
{
  G.newGame({ name: 'A', cls: 'warrior', race: 'human' }); const P = G.S.player; P.money = 1e7; P.level = 45;
  G.S.player.prof = { blacksmithing: { skill: 225, max: 225, known: [] } }; G.trainProf('blacksmithing');
  ok(G.profs().blacksmithing.max === 300, 'a level-45 smith with 225 skill trains Artisan (300)');
  G.newGame({ name: 'A2', cls: 'warrior', race: 'human' }); G.S.player.money = 1e7; G.S.player.level = 44;
  G.S.player.prof = { blacksmithing: { skill: 225, max: 225, known: [] } }; G.trainProf('blacksmithing');
  ok(G.profs().blacksmithing.max === 225, 'Artisan waits for level 45');
  ok(D.TITLES.find((t) => t.id === 'artisan').name === 'Journeyman %s', 'the 150 title is Journeyman, so Artisan means 300');
}
// Artisan materials by level (v10.9 beta 5)
{
  const t52 = D.nodeTable(52), has = (tb, k) => tb.some(([id, w]) => id === k && w > 0);
  ok(has(t52.ore, 'duskiron') && has(t52.ore, 'moonsilver') && has(t52.herb, 'gloomcap'), 'a level-52 place grows duskiron, moonsilver and gloomcap');
  ok(!has(D.nodeTable(45).ore, 'duskiron') && has(D.nodeTable(57).herb, 'frostpetal'), 'duskiron starts above 45, frostpetal grows at 57');
  ok(D.skinLeather(55) === 'hardhide_leather' && D.skinLeather(45) === 'thick_leather', 'a level-55 beast skins into hardhide');
  ok(Object.values(D.NODES).every((N) => D.ITEMS[N.item] && (!N.extra || D.ITEMS[N.extra[0]])), 'every node gives a real item');
}
// Artisan fishing and cooking (v10.9 beta 5): 45-60 water bites tier-4 fish, the deep-water reel can still be won, the dishes cook
{
  G.newGame({ name: 'F4', cls: 'warrior', race: 'human' }); const P = G.S.player; P.level = 58; P.money = 1e7; G.S.flags.warModeAsked = true; P.place = 'lake_keltheril';
  P.bagsEq = [0, 1, 2, 3].map(() => G.copyItem('woolen_bag')); P.prof = { fishing: { skill: 290, max: 300, known: [] }, cooking: { skill: 280, max: 300, known: [] } };
  ok(D.waterTier('lake_keltheril') === 4, 'a level-58 lake is tier 4');
  const t4 = new Set([].concat(D.FISH[4].common.map((c) => c[0]), D.FISH[4].big[0], D.FISH[4].rare[0])); const got = {}; let other = 0;
  for (let i = 0; i < 200; i++) {
    if (!G.fishStart(false)) { tick(5); continue; } let g = 0;
    while (P.fishing && P.fishing.phase !== 'done' && g++ < 600) { if (P.fishing.phase === 'bite') G.fishTap(); if (P.fishing && P.fishing.phase === 'reel') { const r = P.fishing.reel; G.fishReel(r.fish > r.zone, 0.05); t += 50; continue; } tick(0.1, 0.1); }
    const f = P.fishing; if (f && f.caught) { if (t4.has(f.fish.id)) got[f.fish.kind] = (got[f.fish.kind] || 0) + 1; else other++; }
    P.bags = P.bags.filter((b) => b.item.slot !== 'mat');
  }
  console.log(`tier-4 fishing at 290: ${JSON.stringify(got)}`);
  ok(!other && got.common > 100 && got.big > 5 && got.rare >= 1, 'tier-4 water bites only tier-4 fish, and a following reel still lands big and rare ones');
  G.addItem(G.copyItem('thunderhead_marlin'), 3); G.cook('ck_marlin_steak', 3, 'normal'); tick(15);
  ok(G.countItem('marlin_steak') === 3, 'a cook at 280 makes Thunderhead Marlin Steaks');
  const beast = Object.keys(D.MOBS).find((k) => D.MOBS[k].family === 'beast' && !D.MOBS[k].boss); let meat = 0; for (let i = 0; i < 200; i++) meat += G.rollLoot(beast, 55).items.filter((it) => it.id === 'marbled_haunch').length;
  ok(meat > 40, `level-55 beasts give marbled haunch (${meat}/200)`);
}
// Artisan recipes (v10.9 beta 5): everything they make and use exists, each craft has a recipe at 225, and ore becomes a Moonforged Breastplate
{
  const art = Object.values(D.RECIPES).filter((r) => r.sk[0] >= 225);
  ok(art.every((r) => D.ITEMS[r.makes] && Object.keys(r.mats).every((m) => D.ITEMS[m])), 'every Artisan recipe makes and uses real items');
  ok(['mining', 'blacksmithing', 'leatherworking', 'tailoring', 'alchemy', 'cooking'].every((p) => Object.values(D.RECIPES).some((r) => r.prof === p && r.sk[0] >= 200 && r.sk[0] <= 225 && D.ITEMS[r.makes] && (D.ITEMS[r.makes].lvl || 50) >= 45)), 'each craft has an Artisan recipe it can start by 225 (issue #6: from 200, the trainer\'s requirement)');
  ok(art.filter((r) => r.rare).length >= 6, 'at least six Artisan recipes are rare drops');
  G.newGame({ name: 'S', cls: 'warrior', race: 'human' }); const P = G.S.player; P.level = 60; P.money = 1e7; P.place = 'stormwind';
  P.bagsEq = [0, 1, 2, 3].map(() => G.copyItem('woolen_bag'));
  P.prof = { mining: { skill: 285, max: 300, known: [] }, blacksmithing: { skill: 280, max: 300, known: ['bs_moonforged_breastplate'] } };
  G.addItem(G.copyItem('duskiron_ore'), 16); G.addItem(G.copyItem('moonsilver_ore'), 2);
  G.craft('smelt_duskiron', 16); tick(80); G.craft('smelt_moonsilver', 2); tick(15);
  G.craft('bs_moonforged_breastplate', 1); tick(15);
  ok(G.countItem('moonforged_breastplate') === 1, 'a level-60 smith turns 16 duskiron and 2 moonsilver ore into a Moonforged Breastplate');
  const it = D.ITEMS.moonforged_breastplate, sum = Object.values(it.stats).reduce((a, b) => a + b, 0);
  ok(sum >= 33 && sum <= 37 && it.look && it.source, `the catch-up breastplate sits below level-60 dungeon blues (${sum} points) and carries its look and source`);
}
// flasks (v10.9 beta 5): take the elixir slot, last 2 hours, stay when you die
{
  G.newGame({ name: 'K', cls: 'warrior', race: 'human' }); const P = G.S.player; P.level = 60; G.S.flags.warModeAsked = true;
  const drink = (id) => { G.addItem(G.copyItem(id), 1); G.useItem(P.bags.findIndex((b) => b.item.id === id)); };
  const dieInAFight = () => { const pu = E.charUnit(P, 'ally', 'player', t), foe = Object.keys(D.MOBS).find((k) => !D.MOBS[k].boss); const C = E.fight([pu], [E.mobUnit(foe, 60)], {}); E.kill(C, pu); E.writeBack(C, pu, t); };
  drink('elixir_might'); drink('flask_warpath');
  const el = P.auras.filter((a) => a.id === 'elixir');
  ok(el.length === 1 && el[0].name === 'Flask of the Warpath' && el[0].until - t > 7000e3, 'a flask replaces an elixir and lasts 2 hours');
  dieInAFight(); ok(P.auras.some((a) => a.name === 'Flask of the Warpath'), 'the flask stays when you die');
  drink('elixir_swiftness'); dieInAFight(); ok(!P.auras.some((a) => a.id === 'elixir'), 'an elixir does not stay when you die');
}
// Artisan rare recipes drop at 60 (v10.9 beta 5); a bag recipe drops at its skill's level, not at level 1
{
  const sk = (id) => D.RECIPES[D.ITEMS[id].teaches].sk[0];
  const at60 = new Set(); for (let i = 0; i < 300; i++) at60.add(G.pickRare(60));
  ok([...at60].every((id) => sk(id) >= 225) && at60.size >= 5, `level-60 bosses drop only Artisan rare recipes (${[...at60].join(', ')})`);
  const low = new Set(); for (let i = 0; i < 300; i++) low.add(G.pickRare(5));
  ok(![...low].some((id) => sk(id) >= 225), 'a level-5 monster never drops an Artisan recipe (the Starweave Bag)');
}
// Artisan collections (v10.9 beta 5): 300 gives the skill's keepsake look and title; a crafted look piece joins the wardrobe
{
  const mem = new Map(); globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
  G.newGame({ name: 'M', cls: 'warrior', race: 'human' }); const P = G.S.player; P.level = 60; G.S.flags.warModeAsked = true; P.place = 'stormwind'; P.bagsEq = [0, 1, 2, 3].map(() => G.copyItem('woolen_bag'));
  ok(Object.keys(D.PROF_REWARDS).length === 9 && Object.values(D.PROF_REWARDS).every((R) => D.ITEMS[R.keepsake] && D.ITEMS[R.keepsake].look), 'every skill has a keepsake look');
  const title = D.TITLES.find((x) => x.id === 'prof_mining'), looks = () => G.account().looks || [];
  P.prof = { mining: { skill: 299, max: 300, known: [] } }; ok(!G.titleUnlocked(title) && !looks().includes('back:deepdelvers_pick'), 'no keepsake or title at 299');
  G.addItem(G.copyItem('duskiron_ore'), 20); for (let i = 0; i < 20 && G.profs().mining.skill < 300; i++) { G.craft('smelt_moonsilver', 0); G.profs().mining.skill = 300; G.profReward('mining'); }
  ok(G.titleUnlocked(title) && looks().includes('back:deepdelvers_pick'), 'reaching 300 in Mining gives the Deepdelver title and the pick for your back');
  ok(G.wardrobeOptions('back').some((o) => o.key === 'deepdelvers_pick'), 'the keepsake is in the wardrobe\'s Back row');
  P.prof.blacksmithing = { skill: 285, max: 300, known: [] }; G.addItem(G.copyItem('duskiron_bar'), 14); G.addItem(G.copyItem('moonsilver_bar'), 2);
  G.craft('bs_moonforged_legplates', 1); tick(10);
  ok(looks().includes('legs:moonforged_legs'), 'crafting the Moonforged Legplates adds their look to the wardrobe');
  globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
}
// profession trainers (v10.9 beta 6, issue #7): both factions can train in their own or a neutral town in every level band
// to 60, and a neutral town with a trainer has both
{
  const side = { crafts_alliance: 'alliance', crafts_horde: 'horde' }, towns = Object.keys(D.PLACES).filter((id) => (D.PLACES[id].npcs || []).some((n) => side[n]));
  const usable = (npc, id) => (D.PLACES[id].npcs || []).includes(npc) && [null, side[npc]].includes(G.placeFaction(id));
  for (const npc in side) for (let L = 20; L <= 60; L += 5) {
    const here = towns.filter((id) => usable(npc, id) && D.PLACES[id].lvl && D.PLACES[id].lvl[0] <= L && D.PLACES[id].lvl[1] >= L - 4);
    ok(here.length > 0, `${npc}: a trainer of your faction or a neutral one for levels ${L - 4}-${L}`);
  }
  const ownHigh = (npc) => towns.filter((id) => (D.PLACES[id].npcs || []).includes(npc) && G.placeFaction(id) === side[npc] && D.PLACES[id].lvl && D.PLACES[id].lvl[1] > 50);
  ok(ownHigh('crafts_alliance').length === ownHigh('crafts_horde').length, `both factions train in as many of their own camps above level 50 (alliance ${ownHigh('crafts_alliance').join(',') || 'none'}; horde ${ownHigh('crafts_horde').join(',')})`);
  const lonely = towns.filter((id) => G.placeFaction(id) === null && !Object.keys(side).every((n) => D.PLACES[id].npcs.includes(n)));
  ok(!lonely.length, 'a neutral town has both trainers: ' + lonely.join(', '));
}
// a save from a newer build (issue #17): a skill this build does not know stays in the save and is skipped everywhere
{
  G.newGame({ name: 'N', cls: 'warrior', race: 'human' }); const P = G.S.player; P.level = 20; P.money = 1e6;
  P.prof = { mining: { skill: 80, max: 150, known: [] }, gemcutting_from_the_future: { skill: 40, max: 75, known: [] } };
  ok(G.knownProfIds().join() === 'mining' && G.primaryCount() === 1, 'an unknown skill is skipped and does not take a profession slot');
  G.trainProf('herbalism'); ok(!!G.profs().herbalism, 'a second profession can still be learned');
  ok(!!P.prof.gemcutting_from_the_future, 'the unknown skill stays in the save');
}
console.log(fails ? `${fails} failures` : 'professions sim OK');
process.exit(fails ? 1 : 0);
