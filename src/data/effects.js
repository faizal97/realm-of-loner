// Item effects (v10.10, design docs/plans/2026-10-02-item-effects-design.md): a sidegrade on an item, a twist that reacts
// to what you do in a fight. The item has the normal budget for its source and pays for the effect with part of its stats
// (EFFECT_COST), so the power ceiling does not move. One shared library: an item points to an effect by key, its numbers
// scale with the item's level, and the same effect counts once. The engine reads them in E.itemEffects (src/engine.js),
// and every lookup is guarded: an unknown key is a plain item (a save from a newer build, the #17 lesson).
// Loads after the zones (it adds the items to boss loot) and before finalize.js (which derives the loot sources).
(function (root) {
  const D = root.D;
  const n = (x) => Math.round(x);
  D.EFFECT_RENAMED = { lifeline: 'lavish_mend', wellspring: 'tethered_mend' }; // an effect that was replaced: saves move to its successor on load (#40)
  D.EFFECT_COST = 0.3; // the share of an item's stats an effect costs by default; an effect may set its own `cost` (sim/effects.js tunes them)
  D.effectCd = (k) => (D.EFFECTS[k] && D.EFFECTS[k].icd) || 0; // an effect's own cooldown: 8 sec or more gets a callout when it fires (#23), shorter ones only coloured numbers
  D.FX_GROW = 0.25; // an upgrade grows an effect by its scale to this power (#37): x1.26 at the ceiling -> x1.06; linear growth (1) or 0.5 made upgraded effects outgrow their price (sim/effects.js checks both stages)
  D.fxGrow = (scale, k) => Math.pow(Math.min(1.5, scale || 1), (D.EFFECTS[k] && D.EFFECTS[k].grow) || D.FX_GROW); // an effect may set its own curve (grow) // the one way to turn an item's fxScale into its effect's strength: the engine and every tooltip use it
  D.EFFECT_COST_MAX = 0.6; // an effect item keeps at least 40% of its stat budget, so nothing on screen reads as a broken drop (#22; tools/validate.js holds it)
  D.effectCost = (k) => ((D.EFFECTS[k] && D.EFFECTS[k].cost) != null ? D.EFFECTS[k].cost : D.EFFECT_COST);
  const GROW_FUSE = 0.5; // Steady Fuse's interval shortens a little faster than the others grow, or it stopped winning once upgraded (#37); 0.5, not 0.6, so it still loses at full upgrade (#45)
  // fires: when it acts, a plain fact the Effects codex shows after "When:" (#55); never advice ("good for levelling")
  D.EFFECTS = {
    // damage
    opening_cut: {
      name: 'Opening Cut', role: 'damage', fires: 'on your first hit on each enemy', icon: 'ambush', k: 2.0, c: 4, cost: 0.6, // was 2.4 at a 75% cost (#22: the 40% stat floor; 2.4 at 60% put the trash mix at +11%)
      bonus: (L, f) => n((D.EFFECTS.opening_cut.k * L + D.EFFECTS.opening_cut.c) * (f || 1)),
      desc: (L, f) => `Your first hit on each enemy deals ${D.EFFECTS.opening_cut.bonus(L, f)} extra damage.`,
    },
    // healing
    echoing_mend: {
      name: 'Echoing Mend', role: 'healing', fires: 'on some of your direct heals (a chance on each)', icon: 'chain_heal', chance: 0.35, pct: 0.35, cost: 0.38, /* 0.3 -> 0.33 -> 0.38: the smallest raise that loses -2% on capacity's tank-only case (#40; 0.35 and 0.37 round to the same item) */
      desc: (L, f) => `Your direct heals have a ${n(D.EFFECTS.echoing_mend.chance * 100)}% chance to echo: ${n(D.EFFECTS.echoing_mend.pct * (f || 1) * 100)}% of the heal also lands on the most hurt other ally.`,
    },
    // tanking
    turning_guard: {
      name: 'Turning Guard', role: 'tank', fires: 'you dodge a melee attack', icon: 'shield_block', icd: 3, dur: 6, k: 0.7, c: 4, cost: 0.4,
      absorb: (L, f) => n((D.EFFECTS.turning_guard.k * L + D.EFFECTS.turning_guard.c) * (f || 1)),
      desc: (L, f) => `When you dodge a melee attack, a guard absorbs the next ${D.EFFECTS.turning_guard.absorb(L, f)} damage within ${D.EFFECTS.turning_guard.dur} sec. At most once every ${D.EFFECTS.turning_guard.icd} sec.`,
    },
    kindled_edge: {
      name: 'Kindled Edge', role: 'damage', fires: 'on your critical hits', icon: 'immolate', k: 0.5, c: 1, dur: 6, every: 2, cost: 0.6, // was 0.8/2 at a 90% cost (#22: the 40% stat floor)
      tick: (L, f) => n((D.EFFECTS.kindled_edge.k * L + D.EFFECTS.kindled_edge.c) * (f || 1)),
      desc: (L, f) => { const F = D.EFFECTS.kindled_edge; return `Your critical hits set the target smouldering: ${F.tick(L, f) * (F.dur / F.every)} Fire damage over ${F.dur} sec. A new crit refreshes it; it doesn't stack.`; },
    },
    chase_the_next: {
      name: 'Chase the Next', role: 'damage', fires: 'on each kill', icon: 'sprint', haste: 22, dur: 10, cost: 0.6,
      desc: (L, f) => `Each kill gives you ${n(D.EFFECTS.chase_the_next.haste * (f || 1))}% haste for ${D.EFFECTS.chase_the_next.dur} sec.`,
    },
    steady_fuse: {
      name: 'Steady Fuse', role: 'damage', fires: 'on a timer while you are in combat', icon: 'cold_blood', icd: 45, cost: 0.58, grow: GROW_FUSE, // was every 30 at a 90% cost (#22: the 40% stat floor); 0.58 since #191's talents
      desc: (L, f) => `Every ${n(D.EFFECTS.steady_fuse.icd / (f || 1))} sec in combat, your next hit is a sure critical hit.`, // an upgrade shortens the wait (#37)
    },
    glass_heart: {
      name: 'Glass Heart', role: 'damage', fires: 'always on', icon: 'blood_fury', dmg: 0.025, taken: 0.1, cost: 0, // no stat cost: the downside is the cost
      desc: (L, f) => `You deal ${Math.round(D.EFFECTS.glass_heart.dmg * (f || 1) * 1000) / 10}% more damage, and take ${n(D.EFFECTS.glass_heart.taken * 100)}% more.`, // an upgrade grows the bonus, never the downside (#37)
    },
    // healing
    lavish_mend: { // replaced Lifeline (#40): Wellspring's mirror, the extra mana is its price (no stat cost, as Glass Heart's damage taken)
      name: 'Lavish Mend', role: 'healing', fires: 'on every heal', icon: 'greater_heal', heal: 0.1, mana: 0.25, cost: 0,
      desc: (L, f) => `Your heals are ${Math.round(D.EFFECTS.lavish_mend.heal * (f || 1) * 1000) / 10}% stronger, and cost ${n(D.EFFECTS.lavish_mend.mana * 100)}% more mana.`, // an upgrade grows the heal, never the mana cost
    },
    tethered_mend: { // replaced Wellspring (#40): Echoing Mend's mirror, who you heal is the trade; no stat cost, the reset is the price
      name: 'Tethered Mend', role: 'healing', fires: 'on each direct heal', icon: 'renew', step: 0.05, max: 3, swap: 0.3, cost: 0, /* the game designer's pick from the capacity grid (#40): 0.06 / 0.1 never lost group-wide */
      desc: (L, f) => { const F = D.EFFECTS.tethered_mend, st = Math.round(F.step * (f || 1) * 1000) / 10; return `Each direct heal on the same ally in a row heals ${st}% more, up to ${Math.round(st * F.max * 10) / 10}%. A heal on a different ally heals ${n(F.swap * 100)}% less and starts over.`; }, // an upgrade grows the bonus, not the penalty
    },
    // tanking
    spiteful_hide: {
      name: 'Spiteful Hide', role: 'tank', fires: 'an enemy hits you in melee', icon: 'thorns', k: 0.12, c: 0, cost: 0.55, /* c 1 -> 0: at full upgrade a level-20 Paladin tank reached +10% (#37) */
      dmg: (L, f) => n((D.EFFECTS.spiteful_hide.k * L + D.EFFECTS.spiteful_hide.c) * (f || 1)),
      desc: (L, f) => `Enemies that hit you in melee take ${D.EFFECTS.spiteful_hide.dmg(L, f)} Nature damage.`,
    },
    // resource
    tithe_of_battle: {
      name: 'Tithe of Battle', role: 'resource', fires: 'on each tick of your damage over time', icon: 'life_tap', mana: 0.003, rage: 1, energy: 2, cost: 0.4,
      desc: (L, f) => { const F = D.EFFECTS.tithe_of_battle, g = f || 1; return `Each tick of your damage over time restores ${(F.mana * g * 100).toFixed(1)}% of your mana, ${n(F.rage * g)} rage or ${n(F.energy * g)} energy.`; },
    },
    // survival
    stubborn_blood: {
      name: 'Stubborn Blood', role: 'survival', fires: 'you fall below a share of your health', icon: 'frenzied_regeneration', icd: 60, below: 0.3, pct: 0.06, dur: 6, cost: 0.56, // 0.56 since #191's talents (smallest cost that passes the effects gate on CI's 5-seed mean; 0.52-0.55 give -1.99)
      desc: (L, f) => { const F = D.EFFECTS.stubborn_blood; return `Falling below ${n(F.below * 100)}% health heals you for ${n(F.pct * (f || 1) * 100)}% of your health over ${F.dur} sec. At most once every ${F.icd} sec.`; },
    },
  };

  // ---- the items: new ones (existing gear never changes under its owners), at the budget of items like them
  const QM = [0.8, 1, 1.1, 1.22, 1.35];
  const sum = (it) => Object.values(it.stats || {}).reduce((a, b) => a + b, 0);
  function effectItem(id, boss, o) {
    const M = D.MOBS[boss]; if (!M || !D.EFFECTS[o.effect]) return;
    const noLoot = o.noLoot; o = Object.assign({}, o); delete o.noLoot;
    const it = Object.assign({ lvl: M.lvl[0], effect: o.effect }, o), L = it.lvl;
    it.q = it.q || 3; if (!it.atype) delete it.atype; // the fx() rows pass every key, so an unset one must not wipe a default
    // the budget of an item like it: same slot, armour or weapon type and quality, within 3 levels (gear sizes its stats
    // by family, so a wrist is paid like a wrist, not like its boss's chest)
    const fam = (x) => x.slot === it.slot && (x.wtype || x.atype || '') === (it.wtype || it.atype || '') && !x.sp && x.q === it.q;
    const like = Object.values(D.ITEMS).filter((x) => x && !x.effect && !x.heirloom && !x.lookOnly && x.stats && sum(x) > 0 && fam(x) && Math.abs((x.lvl || 1) - L) <= 3);
    // no such item: the game's own budget for the level and quality (random gear's, held to the hand-made items by sim/upgrades.js)
    const full = like.length ? like.reduce((a, x) => a + sum(x), 0) / like.length : it.q >= 4 ? L * 0.64 + 2 : it.q === 3 ? L * 0.55 + 2 : L * 0.55 + 1;
    const budget = Math.max(1, n(full * (1 - D.effectCost(o.effect)))), ks = it.st; it.stats = {}; let left = budget; it.fxBudget = n(full); // what a plain item like it carries (tools/validate.js checks the 40% floor)
    ks.forEach((k, i) => { const v = i === ks.length - 1 ? Math.max(1, left) : Math.max(1, n(budget / ks.length)); it.stats[k] = v; left -= v; });
    delete it.st;
    if (it.slot === 'weapon') {
      const Wb = D.WEAPON_BASES[it.wtype], dps = (1.6 + L * 0.45) * QM[it.q] * (it.wtype === 'staff' ? 1.35 : 1);
      it.speed = it.speed || Wb.speed; it.dmg = [Math.max(1, n(dps * it.speed * 0.7)), Math.max(2, n(dps * it.speed * 1.3))]; it.icon = it.icon || Wb.icon;
    } else {
      it.armor = it.slot === 'finger' ? 0 : Math.max(1, n((D.SLOT_ARMOR[it.slot] || 3) * (it.atype ? D.GEAR_BASES[it.atype].arm : 0.3) * (L + 2) * 0.9 * QM[it.q]));
      it.icon = it.icon || (it.slot === 'chest' ? 'chest_' + (it.atype || 'cloth') : D.SLOT_ICON[it.slot]);
    }
    it.sell = Math.max(1, n((L * L * 0.9 + 4) * [0.5, 1, 3, 7, 12][it.q]));
    D.item(id, it);
    if (!noLoot) M.loot = (M.loot || []).concat([id]); // the same drop chance as its other blues
  }
  // beta 1 (§6 step 1): one effect per role, three levelling dungeon finals and two level-60 sources
  effectItem('cutpurse_gloves', 'vancleef', { name: "Cutpurse's Gloves", slot: 'hands', atype: 'leather', effect: 'opening_cut', st: ['agi', 'str'] });
  effectItem('ashen_mercy_robe', 'high_inquisitor_whitemane', { name: 'Robe of Ashen Mercy', slot: 'chest', atype: 'cloth', effect: 'echoing_mend', st: ['int', 'spi'] });
  effectItem('sandguard_girdle', 'chief_ukorz_sandscalp', { name: 'Sandguard Girdle', slot: 'waist', atype: 'mail', effect: 'turning_guard', st: ['sta', 'str'] });
  effectItem('turning_greaves', 'darkmaster_gandling', { name: 'Greaves of the Turning Hour', slot: 'legs', atype: 'mail', effect: 'turning_guard', st: ['sta', 'str'] });
  effectItem('fenheart_band', 'ashwing', { name: 'Fenheart Band', q: 4, slot: 'finger', effect: 'stubborn_blood', st: ['agi', 'str'] }); // it trades damage stats for staying alive
  // beta 2 (§6 step 2): every other source. Levelling finals spread the armour types and roles on the way to 60 (trash
  // effects early, boss effects late); raid bosses and world bosses drop epics (Hard: two upgrade steps up, the effect
  // grows with them); Lifeline (which replaced Brimming Cup) on a cloth and a mail healer's piece
  const fx = (id, boss, name, slot, atype, effect, st, q) => effectItem(id, boss, { name, slot, atype, effect, st, q });
  // levelling dungeon finals (blue)
  fx('cinderwrapped_cuffs', 'bazzalan', 'Cinderwrapped Cuffs', 'wrist', 'cloth', 'stubborn_blood', ['int', 'sta']);
  fx('waking_dream_boots', 'mutanus', 'Boots of the Waking Dream', 'feet', 'leather', 'echoing_mend', ['int', 'spi']);
  fx('rioters_grips', 'bazil_thredd', "Rioter's Grips", 'hands', 'mail', 'chase_the_next', ['agi', 'str']);
  fx('tidebreak_cloak', 'aku_mai', 'Tidebreak Cloak', 'back', undefined, 'turning_guard', ['sta', 'agi']);
  fx('wolfshade_handwraps', 'arugal', 'Wolfshade Handwraps', 'hands', 'cloth', 'steady_fuse', ['int', 'sta']);
  fx('cogspun_sash', 'mekgineer_thermaplugg', 'Cogspun Sash', 'waist', 'cloth', 'tithe_of_battle', ['int', 'sta']);
  fx('thornhide_belt', 'charlga_razorflank', 'Thornhide Belt', 'waist', 'leather', 'spiteful_hide', ['sta', 'agi']);
  fx('quiet_page_bracers', 'arcanist_doan', 'Bracers of the Quiet Page', 'wrist', 'cloth', 'tethered_mend', ['int', 'spi']);
  fx('gamblers_last_coin', 'mintmaster_coinwhistle', "Gambler's Last Coin", 'finger', undefined, 'glass_heart', ['agi', 'str']);
  fx('rootfire_treads', 'princess_theradras', 'Rootfire Treads', 'feet', 'leather', 'kindled_edge', ['agi', 'sta']);
  fx('forgeheart_gauntlets', 'emperor_dagran_thaurissan', 'Forgeheart Gauntlets', 'hands', 'mail', 'spiteful_hide', ['sta', 'str']);
  fx('gravecutter_bracers', 'baron_rivendare', 'Gravecutter Bracers', 'wrist', 'leather', 'opening_cut', ['agi', 'str']);
  // the level-60 dungeons (blue)
  fx('archivists_tidering', 'lady_vessaria', "Archivist's Tidering", 'finger', undefined, 'tethered_mend', ['int', 'spi']);
  fx('sunfire_legguards', 'avatar_of_shalzua', 'Sunfire Legguards', 'legs', 'mail', 'kindled_edge', ['agi', 'str']);
  // raid bosses (epic): the Magma Throne, the Tidecrown Citadel, the Broodmother's lair
  fx('houndrunner_boots', 'magmadar', 'Houndrunner Boots', 'feet', 'leather', 'chase_the_next', ['agi', 'str'], 4);
  fx('firebound_girdle', 'garr', 'Firebound Girdle', 'waist', 'mail', 'turning_guard', ['sta', 'str'], 4);
  fx('fusewoven_gloves', 'baron_geddon', 'Fusewoven Gloves', 'hands', 'cloth', 'steady_fuse', ['int', 'sta'], 4);
  fx('cinderhide_bracers', 'golemagg', 'Cinderhide Bracers', 'wrist', 'mail', 'spiteful_hide', ['sta', 'str'], 4);
  fx('harbingers_tithe', 'sulfuron_harbinger', "Harbinger's Tithe", 'finger', undefined, 'tithe_of_battle', ['int', 'sta'], 4);
  fx('stewards_grace', 'majordomo_executus', "Cloak of the Steward's Grace", 'back', undefined, 'echoing_mend', ['int', 'spi'], 4);
  fx('molten_heart_leggings', 'ragnaros', 'Leggings of the Molten Heart', 'legs', 'leather', 'kindled_edge', ['agi', 'str'], 4);
  fx('first_wave_belt', 'commander_serathis', 'Belt of the First Wave', 'waist', 'leather', 'opening_cut', ['agi', 'str'], 4);
  fx('twinned_tide_bracers', 'tide_twin_myrel', 'Twinned Tide Bracers', 'wrist', 'cloth', 'lavish_mend', ['int', 'spi'], 4);
  fx('coralguard_legplates', 'coralheart_colossus', 'Coralguard Legplates', 'legs', 'mail', 'turning_guard', ['sta', 'agi'], 4);
  fx('brittle_crown_signet', 'prince_aeldran', 'Brittle Crown Signet', 'finger', undefined, 'glass_heart', ['agi', 'str'], 4);
  fx('returning_tide_gloves', 'nalveshra', 'Gloves of the Returning Tide', 'hands', 'leather', 'echoing_mend', ['int', 'spi'], 4);
  fx('broodguard_bracers', 'onyxia', 'Broodguard Bracers', 'wrist', 'leather', 'stubborn_blood', ['agi', 'sta'], 4);
  // world bosses (epic)
  fx('hollow_choir_sabatons', 'hollow_colossus', 'Sabatons of the Hollow Choir', 'feet', 'mail', 'lavish_mend', ['int', 'spi'], 4);
  fx('rimebound_cuffs', 'rimefather', 'Rimebound Cuffs', 'wrist', 'cloth', 'steady_fuse', ['int', 'sta'], 4);
  // Trial finds (#22, game designer 10:55): a Trial beaten in time has a 1 in 5 chance of that dungeon's effect item at
  // level 60 as a blue, never one you already own. A levelling dungeon's item is rebuilt at 60 (same effect, the budget of
  // a level-60 blue like it); a level-60 dungeon's is its own. Content-proof: a dungeon that joins the Trials brings its item.
  D.TRIAL_FIND_CHANCE = 0.2; D.TRIAL_FIND = {};
  for (const act in D.ACTIVITIES) {
    const A = D.ACTIVITIES[act], Dg = A.dungeon && D.DUNGEONS[A.dungeon]; if (!Dg || A.worldBoss || (A.size || 5) > 5) continue;
    const bs = Dg.pulls.filter((p) => p.boss), boss = bs.length && bs[bs.length - 1].mobs[0], M = boss && D.MOBS[boss];
    const src = M && (M.loot || []).map((k) => D.ITEMS[k]).find((x) => x && x.effect && D.EFFECTS[x.effect]); if (!src) continue;
    if (src.lvl >= D.LEVEL_CAP) { D.TRIAL_FIND[act] = src.id; continue; }
    const id = src.id + '_trial', st = Object.keys(src.stats || {});
    effectItem(id, boss, { name: src.name, q: 3, lvl: D.LEVEL_CAP, slot: src.slot, atype: src.atype, wtype: src.wtype, effect: src.effect, st: st.length ? st : ['sta'], noLoot: true, source: `Trials: ${A.name}, beaten in time` });
    if (D.ITEMS[id]) D.TRIAL_FIND[act] = id;
  }
})(typeof window !== 'undefined' ? window : globalThis);
