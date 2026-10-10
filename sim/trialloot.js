// What item levels a Trial drops (player feedback, #184). Real Trial clears through the game's run loop for every dungeon
// that has a Trial find (D.TRIAL_FIND), a level-60 player of each class, each run at Trial 1 (the Trial level changes the
// enemies, not the loot). Every item the group rolls on (a rollResult event) and every reward paid to the player
// (G.giveReward: the speed chest, the flawless chest, the Trial find) is recorded with its item level and quality.
//   ROOT=~/azeroth-solo-measure N=6 CLASSES=mage,warrior,priest SEED=0 node sim/trialloot.js     (JSON=1: raw rows)
require('./_seed.js');
const ROOT = process.env.ROOT || require('path').join(__dirname, '..');
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
for (const f of ['data', 'engine', 'bots', 'game']) require(ROOT + '/src/' + f + '.js');
require(ROOT + '/src/trials.js');
const { G, D } = globalThis;
const RealDate = Date; let t = new RealDate(2026, 9, 14, 19).getTime();
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(t); } static now() { return t; } };
const N = +(process.env.N || 6), CLS = (process.env.CLASSES || 'mage,warrior,priest').split(',');
const ACTS = Object.keys(D.TRIAL_FIND).filter((a) => D.ACTIVITIES[a] && D.ACTIVITIES[a].dungeon);
const QN = ['grey', 'white', 'green', 'blue', 'purple'];
const drops = [], rewards = [];
// where each rolled item came from (for the Trial loot rule, #184): recorded when the roll opens, read when it resolves
const meta = new Map();
let pullNow = null; // the pull being fought when the update that ends it runs (the run's index has moved on by the time a roll opens)
G.on('roll', (r) => { const R = G.S.run, it = r.item; if (!R || !it) return; const pull = pullNow || {}, last = R.pulls.map((p, i) => (p.boss ? i : -1)).filter((i) => i >= 0).pop();
  meta.set(it, { boss: !!pull.boss, final: !!pull.boss && R.pulls.indexOf(pull) === last, tbl: !!(it.id && D.ITEMS[it.id]), slot: it.slot, usable: G.canUseItem(it, cur.cls) && (!it.atype || it.atype === D.CLASSES[cur.cls].armorType || it.slot === 'back') && (it.slot !== 'weapon' || D.CLASSES[cur.cls].weapons.includes(it.wtype)) }); });
G.on('rollResult', (d) => { if (d.item) drops.push(Object.assign({ lvl: d.item.lvl == null ? null : d.item.lvl, q: d.item.q, name: d.item.name, win: d.me ? 'you' : d.winner ? 'bot' : 'none', act: cur.act, cls: cur.cls, run: cur.run }, meta.get(d.item) || {})); });
const giveReward = G.giveReward; G.giveReward = function (it, label) { rewards.push({ lvl: it.lvl, q: it.q, name: it.name, label, act: cur.act, cls: cur.cls, run: cur.run, slot: it.slot }); return giveReward.apply(this, arguments); };
let cur = {};
let runNo = 0;
function run(act, cls) {
  cur = { act, cls, run: ++runNo };
  G.newGame({ name: 'Pace', cls, race: 'human' }); const S = G.S, P = S.player; P.level = 60; S.flags.warModeAsked = true;
  const at = D.CLASSES[cls].armorType;
  for (const slot of D.GEAR_SLOTS) P.equip[slot] = G.genGear(slot, 60, 3, slot === 'weapon' || slot === 'ranged' ? {} : { atype: at });
  P.talents = G.autoTalents(cls, D.CLASSES[cls].role === 'tank' ? 'tank' : D.CLASSES[cls].role === 'healer' ? 'healer' : 'dps', 60, 0); P.hp = null; P.res = null;
  P.trials = { season: 0, best: {}, open: { [act]: 1 }, week: null, history: [], bestEver: 0, bestRank: null };
  G.trialBlock = () => null; // any season: the loot does not depend on which dungeons the month picked
  if (!G.queueTrial(act, 1)) return null; G.acceptPop(); if (!S.run) return null;
  let g = 0;
  while (S.run && S.run.phase !== 'done' && g++ < 500000) {
    if (G.fight && G.pUnit && G.pUnit.kind === 'player') { G.pUnit.kind = 'bot'; G.pUnit.bot = { skill: 0.75, react: 0.5 }; G.pUnit.role = G.role(); }
    for (const r of (S.run.rolls || [])) if (!r.done && !r.player) { try { G.roll(S.run.rolls.indexOf(r), G.canUseItem(r.item, cls) ? 'need' : 'greed'); } catch (e) {} }
    if (S.run && S.run.phase === 'rest' && G.role() === 'tank' && Date.now() >= S.run.restUntil && (G.restState().topped || Date.now() >= S.run.restUntil + 60000) && !S.group.members.some((m) => m.gone)) G.runPull(); // a tank player pulls by the bot tank's rule
    if (S.run && S.run.wipes > 12) break;
    pullNow = S.run && S.run.pulls ? S.run.pulls[S.run.idx] : null;
    G.update(0.1); t += 100;
  }
  for (let k = 0; k < 600 && S.run && (S.run.rolls || []).some((r) => !r.done); k++) { // the last boss's rolls open as the run ends: let them finish (the first version stopped at 'done' and never counted them)
    for (const r of (S.run.rolls || [])) if (!r.done && !r.player) { try { G.roll(S.run.rolls.indexOf(r), G.canUseItem(r.item, cls) ? 'need' : 'greed'); } catch (e) {} }
    G.update(0.1); t += 100;
  }
  return { done: !!(S.run && S.run.phase === 'done'), wipes: S.run ? S.run.wipes : 99, timed: !!(S.run && S.run.bonus && S.run.bonus.speed), flawless: !!(S.run && S.run.bonus && S.run.bonus.flawless) };
}
const runs = [];
for (const act of ACTS) for (const cls of CLS) for (let i = 0; i < N; i++) { const r = run(act, cls); if (r) runs.push(Object.assign({ act, cls, run: runNo }, r)); }
const pad = (s, n) => String(s).padEnd(n), q = (a, f) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(f * (s.length - 1)))] : '-'; };
const rng = (a) => (a.length ? `${Math.min(...a)}-${Math.max(...a)}` : '-');
const ge = (a, n) => a.length ? Math.round(a.filter((x) => x >= n).length / a.length * 100) + '%' : '-';
if (process.env.JSON) { console.log(JSON.stringify({ runs, drops, rewards })); process.exit(0); }
console.log(`Trial clears: ${runs.length} (${ACTS.length} dungeons x ${CLS.join('/')} x ${N}), cleared ${runs.filter((r) => r.done).length}, timed ${runs.filter((r) => r.timed).length}, flawless ${runs.filter((r) => r.flawless).length}`);
const recipes = drops.filter((x) => x.lvl == null).length; drops.splice(0, drops.length, ...drops.filter((x) => x.lvl != null)); // recipes and patterns have no item level: counted apart
const all = (a) => a.map((x) => x.lvl);
console.log(`(${recipes} recipes and patterns left out: they have no item level)`);
console.log('\n## everything the group rolled on (items per run in brackets), item level of what dropped');
console.log(pad('Trial dungeon (its levels)', 34) + pad('items/run', 10) + pad('item levels', 12) + pad('median', 8) + pad('lvl 60+', 8) + pad('blue+', 7) + 'items you won: levels / lvl 60 share');
for (const act of ACTS) {
  const A = D.ACTIVITIES[act], d = drops.filter((x) => x.act === act), n = runs.filter((r) => r.act === act).length, w = d.filter((x) => x.win === 'you');
  console.log(pad(`${A.name} (${A.minLvl}-${A.maxLvl || 60})`, 34) + pad((d.length / n).toFixed(1), 10) + pad(rng(all(d)), 12) + pad(q(all(d), 0.5), 8) + pad(ge(all(d), 60), 8) + pad(ge(d.map((x) => x.q), 3), 7) + `${w.length ? rng(all(w)) : '-'} / ${ge(all(w), 60)} (${w.length})`);
}
console.log('\n## rewards paid to the player (speed chest, flawless chest, Trial find), by kind');
for (const kind of ['Speed bonus', 'Flawless clear', 'Trial find']) { const r = rewards.filter((x) => x.label === kind); console.log(pad(kind, 16), `n ${r.length}`, `item level ${rng(all(r))}`, `lvl 60 ${ge(all(r), 60)}`, `qualities ${[...new Set(r.map((x) => QN[x.q]))].join('/')}`); }
const mine = drops.filter((x) => x.win === 'you').concat(rewards);
console.log('\n## everything the player ended with, per run:', (mine.length / runs.length).toFixed(1), 'items; item level range', rng(all(mine)), '; level 60', ge(all(mine), 60), '; level 55+', ge(all(mine), 55), '; by quality (blue+)', ge(mine.map((x) => x.q), 3));
const byBand = {}; for (const x of mine) { const k = x.lvl >= 60 ? '60' : x.lvl >= 40 ? '40-59' : x.lvl >= 20 ? '20-39' : '1-19'; byBand[k] = (byBand[k] || 0) + 1; }
console.log('player items by item level band:', JSON.stringify(byBand));
