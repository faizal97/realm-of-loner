// Trials (v10.4): the calendar, the automatic season picks (safe for new content), the realm leaderboard, and a
// character's Trials record, with one real Trial run. Design: docs/plans/2026-09-30-trials-design.md
//   node sim/trials.js            (seeded: the same run always gives the same result; SEED=n picks other dice, #104)
require('./_seed.js');
globalThis.localStorage = (() => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; })();
require('../src/data.js'); require('../src/engine.js'); require('../src/bots.js'); require('../src/game.js'); require('../src/trials.js');
const { G, D, TRIALS: T } = globalThis;
let bad = 0, n = 0; const ok = (c, m) => { n++; if (!c) { bad++; console.log('FAIL ' + m); } };
const RealDate = Date; let fake = new RealDate(2026, 9, 10, 12).getTime();
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(fake); } static now() { return fake; } };

// ---- the calendar
ok(T.season(new RealDate(2026, 8, 30)) === -1 && T.season(new RealDate(2026, 9, 1)) === 0 && T.season(new RealDate(2026, 10, 3)) === 1, 'seasons start on the 1st, from October 2026');
ok(T.name(0) === 'October 2026' && T.name(3) === 'January 2027', 'seasons are named by their month');
ok([1, 7, 8, 14, 15, 21, 22, 31].map((d) => T.period(new RealDate(2026, 9, d)).p).join('') === '00112233', 'Omen periods start on the 1st, 8th, 15th and 22nd');
ok(T.daysLeft(new RealDate(2026, 9, 30, 12)) === 2, 'days left in the month');

// ---- the season picks, for both factions
for (const f of ['alliance', 'horde']) {
  const el = T.eligible(f);
  ok(el.length >= 10, `${f}: at least 10 dungeons to rotate (${el.length})`);
  const last = {}; let worst = 0;
  for (let k = 0; k < 36; k++) {
    const p = T.picks(k, f);
    ok(p.length === Math.min(T.SIZE, el.length) && new Set(p).size === p.length, `${f} ${T.name(k)}: 8 different dungeons`);
    for (const a of el) { if (p.includes(a)) { if (last[a] != null) worst = Math.max(worst, k - last[a]); last[a] = k; } }
  }
  ok(worst <= 5, `${f}: no dungeon waits more than 5 months over three years (worst ${worst})`);
  ok(el.every((a) => last[a] != null), `${f}: every dungeon gets a season`);
  ok(JSON.stringify(T.picks(5, f)) === JSON.stringify(T.picks(5, f)), `${f}: the same month always holds the same dungeons`);
}
ok(!T.eligible('horde').includes('stockade') && !T.eligible('alliance').includes('ragefire'), 'each faction only gets dungeons it can reach');

// ---- new content: joins the next season, never changes a live one; a burst spreads over two seasons
const addDungeons = (count, since) => {
  const keys = [];
  for (let i = 0; i < count; i++) {
    const key = `test_dungeon_${since}_${i}`;
    D.DUNGEONS[key] = Object.assign({}, D.DUNGEONS.stratholme, { name: 'Test ' + i, since });
    D.ACTIVITIES[key] = Object.assign({}, D.ACTIVITIES.stratholme, { name: 'Test ' + i, dungeon: key });
    keys.push(key);
  }
  return keys;
};
const drop = (keys) => { for (const k of keys) { delete D.DUNGEONS[k]; delete D.ACTIVITIES[k]; } };
{
  const before = T.picks(2, 'alliance');
  const one = addDungeons(1, '2026-12-10'); // mid-December (season 2)
  ok(JSON.stringify(T.picks(2, 'alliance')) === JSON.stringify(before), 'a dungeon added mid-season does not change the live season');
  ok(T.picks(3, 'alliance').includes(one[0]), 'it is in the next season');
  drop(one);
  const six = addDungeons(6, '2026-12-10');
  const s3 = T.picks(3, 'alliance'), s4 = T.picks(4, 'alliance');
  ok(six.filter((k) => s3.includes(k)).length === T.NEW_PER, `a burst of 6: ${T.NEW_PER} go in the next season`);
  ok(six.every((k) => s3.includes(k) || s4.includes(k)), 'and the rest in the one after');
  drop(six);
  ok(JSON.stringify(T.picks(2, 'alliance')) === JSON.stringify(before), 'and nothing is left over once the test dungeons go');
}

// ---- the realm leaderboard: bots climb through the month; you see the top 10 and the players around you
{
  G.newGame({ name: 'Board', cls: 'warrior', race: 'human' });
  const bots = G.S.bots.map((b, i) => Object.assign({}, b, { level: 60 }));
  const early = T.board(bots, 300, 'Me', new RealDate(2026, 9, 3)), late = T.board(bots, 300, 'Me', new RealDate(2026, 9, 28));
  ok(late.rank > early.rank, `bots climb during the month: the same rating drops from #${early.rank} to #${late.rank}`);
  ok(late.rows.length <= 15 && late.rows.some((r) => r.me) && late.rows[0].rank === 1, 'the board shows the top 10 and you, not the whole realm');
  const top = T.board(bots, 99999, 'Me', new RealDate(2026, 9, 28)); ok(top.rank === 1, 'a huge rating is #1');
  const tops = bots.map((b) => T.botRating(b, 0, 1)).sort((a, b) => b - a);
  ok(tops[0] > 1100 && tops[Math.floor(tops.length / 2)] < 700, `a few bots push past 1100, most sit lower (best ${tops[0]}, median ${tops[Math.floor(tops.length / 2)]})`);
}


// ---- the Preseason: a one-day trial run on 30 September, its own picks, filed as "Preseason", no rank title
{
  const oct = JSON.stringify(T.picks(0, 'alliance'));
  fake = new RealDate(2026, 8, 30, 20).getTime();
  ok(T.season(new Date()) === -1 && T.open(-1) && T.name(-1) === 'Preseason', 'the Preseason is open on 30 September');
  ok(T.picks(-1, 'alliance').length === 8 && JSON.stringify(T.picks(0, 'alliance')) === oct, 'it has its own 8 and leaves October alone');
  G.newGame({ name: 'Pre', cls: 'warrior', race: 'human' }); G.S.player.level = 60;
  const pa = G.trialPicks().find((a) => G.trialBlock(a) === null);
  ok(!!pa, 'a Preseason Trial can be queued');
  G.trialDone({ act: pa, trial: { lvl: 2, season: -1, bestHere: 0 } }, 100, 200);
  fake = new RealDate(2026, 9, 1, 9).getTime();
  const R2 = G.trials();
  ok(R2.season === 0 && R2.history[0].name === 'Preseason' && R2.bestRank == null, 'October files the Preseason in history, with no rank title');
  fake = new RealDate(2026, 8, 20, 12).getTime(); ok(!T.open(T.season(new Date())), 'before the Preseason, Trials are shut');
  fake = new RealDate(2026, 9, 10, 12).getTime();
}

// ---- Omens (tier 1): the weekly rotation, levels, and what each one does
{
  const weeks = []; for (let id = -4; id < 60; id++) weeks.push(T.omensFor(id)); const ids = weeks.flat();
  ok(weeks.every((w, i) => !i || w.every((k, t) => k !== weeks[i - 1][t])), 'no tier repeats its Omen two weeks in a row');
  ok(weeks.every((w) => w.length === new Set(w.map((k) => T.OMENS[k].tier)).size), 'one Omen per tier each week');
  ok(Object.keys(T.OMENS).filter((k) => !T.OMENS[k].off).every((k) => ids.includes(k)) && !ids.some((k) => T.OMENS[k].off), 'every Omen in the rotation comes round, and retired ones never do');
  ok(T.active(1, new Date()).length === 0 && T.active(2, new Date()).length === 1, 'Omens start at Trial 2');
  G.newGame({ name: 'Om', cls: 'warrior', race: 'human' }); G.S.player.level = 60; G.S.flags.warModeAsked = true;
  const a = G.trialPicks().find((x) => G.trialBlock(x) === null);
  const withOmen = (key, lvl) => { const real = T.omensFor; T.omensFor = () => [key]; G.S.run = null; G.S.group = null; G.S.player.trials = { season: G.trials().season, best: {}, open: { [a]: 20 }, week: null, history: [], bestEver: 0, bestRank: null }; G.queueTrial(a, lvl); G.acceptPop(); T.omensFor = real; return G.S.run; };
  const plain = withOmen('frenzied', 1), hard = withOmen('hardened', 5);
  ok(plain.omens.length === 0 && hard.omens[0] === 'hardened', 'a run keeps the Omens it started with');
  ok(Math.abs(hard.bossMult.hp / (T.factor(5) * ((D.DUNGEONS[D.ACTIVITIES[a].dungeon].bossMult || { hp: 1 }).hp)) - 1.3) < 1e-6, 'Hardened: bosses +30% health');
  const sw = withOmen('swarming', 5); sw.restUntil = 0; const n0 = sw.pulls[0].mobs.length; G.runPull();
  ok(G.fight.enemies.length === n0 + 1, 'Swarming: one extra enemy in the pull');
  // Frenzied and Rallying in the engine
  const fz = E.fight([E.charUnit(G.S.player, 'ally', 'bot', Date.now())], [E.mobUnit('mangy_wolf', 60)], { omens: ['frenzied'] });
  const m = fz.enemies[0]; fz.allies[0].bot = { skill: 0.8, react: 0.4 }; m.hp = m.maxHp * 0.34; let said = false;
  for (let i = 0; i < 600 && !m.frenzy && !m.dead; i++) { E.tick(fz, 0.1); if (fz.events.some((e) => e.type === 'emote' && /frenzy/.test(e.text))) said = true; fz.events.length = 0; }
  ok(m.frenzy === true && said, 'Frenzied: an enemy under 30% goes into a frenzy, and it is called out');
  // a hit's full size counts what a shield soaked too: the bot's Power Word: Shield took most first hits whole, and
  // those read as 0 damage (#104)
  const hit = (om) => { const F = E.fight([E.charUnit(G.S.player, 'ally', 'bot', Date.now())], [E.mobUnit('mangy_wolf', 60)], { omens: om }); const w = F.enemies[0], p = F.allies[0]; w.hp = w.maxHp * 0.2; p.auto = false; for (let i = 0; i < 600; i++) { E.tick(F, 0.1); for (const e of F.events) if (e.type === 'dmg' && e.src === w.uid && !e.crit) { const d = e.amount + (e.absorbed || 0); if (d > 0) return d; } F.events.length = 0; } return 0; };
  const SAMPLES = 30;
  const avg = (om) => { const v = []; for (let i = 0; i < 300 && v.length < SAMPLES; i++) { const d = hit(om); if (d > 0) v.push(d); } return { n: v.length, mean: v.reduce((x, y) => x + y, 0) / Math.max(1, v.length) }; };
  const a1 = avg(['frenzied']), a2 = avg([]);
  ok(a1.n === SAMPLES && a2.n === SAMPLES, `Frenzied: ${SAMPLES} hits measured each way (no data: ${a1.n} frenzied, ${a2.n} normal)`);
  ok(a1.mean > a2.mean * 1.3, `Frenzied: a low enemy hits about 50% harder (${Math.round(a1.mean)} vs ${Math.round(a2.mean)})`);
  const rl = E.fight([E.charUnit(G.S.player, 'ally', 'bot', Date.now())], [E.mobUnit('mangy_wolf', 60), E.mobUnit('mangy_wolf', 60)], { omens: ['rallying'] });
  const [x, y] = rl.enemies; y.hp = y.maxHp * 0.5; x.hp = 1;
  for (let i = 0; i < 400 && !x.dead; i++) E.tick(rl, 0.1);
  ok(x.dead && y.rally === 1, 'Rallying: when one dies, the rest hit harder');
  G.fight = null; G.S.run = null; G.S.group = null;
}

// ---- Kill order: spread splits the damage dealers across enemies; one at a time keeps them together
{
  G.newGame({ name: 'Ko', cls: 'mage', race: 'human' }); G.S.player.level = 60;
  const targets = (ko) => { const allies = [0, 1, 2, 3].map(() => { const u = E.charUnit(G.S.player, 'ally', 'bot', Date.now()); u.bot = { skill: 0.8, react: 0.3 }; u.role = 'dps'; return u; });
    const F = E.fight(allies, [0, 1, 2].map(() => E.mobUnit('mangy_wolf', 60)), { killOrder: ko }); const seen = new Set();
    for (let i = 0; i < 40; i++) { E.tick(F, 0.1); for (const e of F.events) if (e.type === 'dmg' && allies.some((a) => a.uid === e.src)) seen.add(e.tgt); F.events.length = 0; } return seen.size; };
  ok(targets('spread') >= 2, `spread: the damage lands on several enemies (${targets('spread')})`);
  ok(targets('focus') <= 2, `one at a time: the damage stays on few enemies (${targets('focus')})`);
}

// ---- Guarded and Enraging
{
  // seeded: a Mage's spell mix varies run to run, and an unlucky mix once failed the build (beta.8); each case gets the same rolls
  const R0 = Math.random, seed = () => { let s = 0x6a4d >>> 0; Math.random = () => { s = (s + 0x6D2B79F5) >>> 0; let x = s; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; };
  G.newGame({ name: 'Gu', cls: 'mage', race: 'human' }); G.S.player.level = 60;
  const bossKey = 'onyxia'; // a boss; its special is switched off below so only the Omen changes the numbers
  const dmgOnBoss = (om, withAdd) => { seed(); let sum = 0, n = 0; for (let t2 = 0; t2 < 25; t2++) { const me = E.charUnit(G.S.player, 'ally', 'bot', Date.now()); me.bot = { skill: 0.8, react: 0.3 };
    const bu = E.mobUnit(bossKey, 60, { hp: 50, dmg: 0.01 }); bu.special = null; const en = withAdd ? [bu, E.mobUnit('mangy_wolf', 60, { hp: 50, dmg: 0.01 })] : [bu];
    const F = E.fight([me], en, { omens: om }); me.target = bu.uid; for (let i = 0; i < 60; i++) { E.tick(F, 0.1); for (const e of F.events) if (e.type === 'dmg' && e.tgt === bu.uid && !e.crit) { sum += e.amount; n++; } F.events.length = 0; } } return sum / Math.max(1, n); };
  const g1 = dmgOnBoss(['guarded'], true), g0 = dmgOnBoss([], true), g2 = dmgOnBoss(['guarded'], false);
  Math.random = R0;
  ok(g1 < g0 * 0.65 && g2 > g0 * 0.8, `Guarded: a boss takes about half damage while another enemy lives (${Math.round(g1)} vs ${Math.round(g0)}; alone ${Math.round(g2)})`);
  const bossHits = (om, from) => { let sum = 0, n = 0; for (let t2 = 0; t2 < 20; t2++) { const me = E.charUnit(G.S.player, 'ally', 'bot', Date.now()); me.maxHp = me.hp = 1e9; me.auto = false; me.bot = { skill: 0, react: 99, afkUntil: 999 };
    const bu = E.mobUnit(bossKey, 60); bu.special = null; const F = E.fight([me], [bu], { omens: om }); for (let i = 0; i < 400; i++) { E.tick(F, 0.1); for (const e of F.events) if (e.type === 'dmg' && e.src === bu.uid && !e.crit && F.t >= from && F.t < from + 10) { sum += e.amount; n++; } F.events.length = 0; } } return sum / Math.max(1, n); };
  const early = bossHits(['enraging'], 0), late = bossHits(['enraging'], 30);
  ok(late > early * 1.2, `Enraging: a boss hits harder as the fight goes on (${Math.round(early)} at the start, ${Math.round(late)} after 30 sec)`);
}

// ---- Mending: a wounded enemy heals
{
  const me = E.charUnit(G.S.player, 'ally', 'bot', Date.now()); me.maxHp = me.hp = 1e9; me.auto = false; me.bot = { skill: 0, react: 99, afkUntil: 999 }; // a punching bag that lives
  const w = E.mobUnit('mangy_wolf', 60), F = E.fight([me], [w], { omens: ['mending'] }); w.hp = w.maxHp * 0.3;
  for (let i = 0; i < 50; i++) E.tick(F, 0.1);
  ok(w.hp > w.maxHp * 0.37 && w.hp < w.maxHp * 0.45, `Mending: a wounded enemy heals about 2% a second (${Math.round(w.hp / w.maxHp * 100)}% after 5 sec)`);
}

// ---- Tier 2 and 3 Omens
{
  G.newGame({ name: 'T23', cls: 'mage', race: 'human' }); G.S.player.level = 60; G.S.player.hp = null;
  const bag = () => { const me = E.charUnit(G.S.player, 'ally', 'bot', Date.now()); me.maxHp = me.hp = 100000; me.auto = false; me.bot = { skill: 0, react: 99, afkUntil: 999 }; return me; };
  // Volatile: a dying enemy blasts the group 3 sec later
  { const me = bag(), w = E.mobUnit('mangy_wolf', 60, { hp: 1, dmg: 0 }); const F = E.fight([me], [w, E.mobUnit('mangy_wolf', 60, { hp: 50, dmg: 0 })], { omens: ['volatile'] }); w.hp = 1;
    me.auto = true; me.bot = { skill: 0.8, react: 0.3 }; me.target = w.uid; let died = null; for (let i = 0; i < 100; i++) { E.tick(F, 0.1); if (w.dead && died == null) { died = F.t; me.auto = false; me.bot = { skill: 0, react: 99, afkUntil: 999 }; } }
    ok(died != null && me.hp <= 100000 - 100000 * T.OMENS.volatile.blast + 1, `Volatile: the group takes the blast (${Math.round((100000 - me.hp) / 1000)}% of health)`); }
  // Hasty: the Trial's par is shorter
  ok(T.par(D.DUNGEONS.stratholme, ['hasty']) === Math.round((D.DUNGEONS.stratholme.trialPar || D.DUNGEONS.stratholme.par) * T.PAR * T.OMENS.hasty.par), 'Hasty: a shorter par');
  // Warded: while the focus lives, the others take half damage
  const hitOn = (om, killFocus) => { let s2 = 0, n2 = 0; for (let r = 0; r < 20; r++) { const me = bag(); me.auto = true; me.bot = { skill: 0.8, react: 0.3 };
    const a = E.mobUnit('mangy_wolf', 60, { hp: 50, dmg: 0 }), f = E.mobUnit('mangy_wolf', 60, { hp: 50, dmg: 0 }); f.focus = true; if (killFocus) f.dead = true;
    const F = E.fight([me], [a, f], { omens: om }); me.target = a.uid; for (let i = 0; i < 60; i++) { E.tick(F, 0.1); for (const e of F.events) if (e.type === 'dmg' && e.tgt === a.uid && !e.crit) { s2 += e.amount; n2++; } F.events.length = 0; } } return s2 / Math.max(1, n2); };
  const w1 = hitOn(['warded'], false), w0 = hitOn([], false), w2 = hitOn(['warded'], true);
  ok(w1 < w0 * 0.65 && w2 > w0 * 0.8, `Warded: the rest take about half damage while the warden lives (${Math.round(w1)} vs ${Math.round(w0)}; warden dead ${Math.round(w2)})`);
  // Sheltered: the focus cannot be hurt while another enemy lives
  { const me = bag(); me.auto = true; me.bot = { skill: 0.8, react: 0.3 }; const a = E.mobUnit('mangy_wolf', 60, { hp: 50, dmg: 0 }), f = E.mobUnit('mangy_wolf', 60, { hp: 50, dmg: 0 }); f.focus = true;
    const F = E.fight([me], [a, f], { omens: ['sheltered'] }); me.target = f.uid; const hp0 = f.hp; for (let i = 0; i < 60; i++) E.tick(F, 0.1);
    ok(f.hp === hp0, 'Sheltered: the focus takes no damage while another enemy lives'); }
  // Vengeful: when the focus dies, the rest heal to full
  { const me = bag(); me.auto = true; me.bot = { skill: 0.8, react: 0.3 }; const a = E.mobUnit('mangy_wolf', 60, { hp: 50, dmg: 0 }), f = E.mobUnit('mangy_wolf', 60, { hp: 1, dmg: 0 }); f.focus = true;
    const F = E.fight([me], [a, f], { omens: ['vengeful'] }); a.hp = a.maxHp * 0.3; f.hp = 1; me.target = f.uid; for (let i = 0; i < 100 && !f.dead; i++) E.tick(F, 0.1);
    ok(f.dead && a.vengeance === true, 'Vengeful: when its focus dies, the rest swear vengeance (double damage)'); }
}
// ---- a character's Trials: blocks, levels, rating, Marks, the weekly goal, history
G.newGame({ name: 'Trier', cls: 'warrior', race: 'human' });
const P = G.S.player; G.S.flags.warModeAsked = true;
const act = G.trialPicks()[0];
P.level = 20; ok(/level 60/.test(G.trialBlock(act) || ''), 'Trials open at level 60');
P.level = 60; ok(G.trialBlock(act) === null || /Veshmira/.test(G.trialBlock(act)), 'open at 60');
const other = T.eligible(G.myFaction()).find((a) => !G.trialPicks().includes(a)); if (other) ok(/Not in this month/.test(G.trialBlock(other) || ''), 'a dungeon outside this month is refused');
const easy = G.trialPicks().find((a) => G.trialBlock(a) === null);
ok(G.trialMax(easy) === 1, 'a fresh character starts at Trial 1');
const fakeRun = (lvl) => ({ act: easy, trial: { lvl, season: G.trials().season, bestHere: (G.trials().best[easy] || {}).lvl || 0 } });
const marks0 = G.account().marks;
G.trialDone(fakeRun(1), 100, 200);
ok(G.trials().best[easy].lvl === 1 && G.trialMax(easy) === 3, 'beating par by a wide margin opens two levels');
G.trialDone(fakeRun(3), 190, 200); ok(G.trialMax(easy) === 4, 'beating par opens one');
G.trialDone(fakeRun(4), 260, 200); ok(G.trialMax(easy) === 4 && G.trials().best[easy].lvl === 4 && !G.trials().best[easy].timed, 'over par counts as a clear but opens nothing');
ok(G.trialRating() === 20, `rating: best level x10, half when over par (${G.trialRating()})`);
ok(G.account().marks - marks0 === 6 + 8 + 9, 'Marks: 5 + the Trial level per clear');
const second = G.trialPicks().find((a) => a !== easy && G.trialBlock(a) === null);
if (second) ok(G.trialMax(second) === 2, 'another dungeon starts at most 2 below your best elsewhere');
for (let i = 0; i < 2; i++) G.trialDone(fakeRun(4), 300, 200);
ok(G.trials().week.n >= 4 && G.trials().week.paid, 'the weekly goal: 4 Trials at your best or higher pays a bonus');
ok(G.titleUnlocked(D.TITLES.find((t) => t.id === 'tried')) === false, 'no Trial title yet');
// a real run: enemies at 60, stronger per level
ok(G.queueTrial(easy, 3) && G.S.queue.trial === 3, 'queue a Trial 3');
G.acceptPop();
ok(G.S.run && G.S.run.trial && G.S.run.mobLevel === 60 && G.S.group.members.every((m) => m.syncLevel === 60), 'the run and the group are at level 60');
ok(G.S.group.members.filter((m) => !m.legend).every((m) => m.level === 60), `every player in a Trial group is level 60 (${G.S.group.members.map((m) => m.level).join(', ')})`);
ok(Math.abs(G.S.run.mult.hp / (D.DUNGEONS[D.ACTIVITIES[easy].dungeon].trashMult || { hp: 1 }).hp - T.factor(3)) < 1e-9, 'enemies gain the Trial factor');
G.S.run.restUntil = 0; G.runPull();
ok(G.fight && G.fight.enemies.every((e) => e.level === 60 || e.level === 58), 'the first pull fights at 60');
G.fight = null; G.S.run = null; G.S.group = null; delete P.syncLevel;
for (let i = 0; i < 20; i++) { G.S.run = null; G.S.group = null; G.queueTrial(easy, 1); G.acceptPop(); if (G.S.group.members.some((m) => !m.legend && m.level !== 60)) { ok(false, 'a level-59 slipped into a Trial group'); break; } }
G.fight = null; G.S.run = null; G.S.group = null; delete P.syncLevel;
// a new month files the old one
const oldRating = G.trialRating();
fake = new RealDate(2026, 10, 2, 12).getTime();
const Rec = G.trials();
ok(Rec.season === 1 && Rec.history.length === 1 && Rec.history[0].name === 'October 2026' && Rec.history[0].rating === oldRating && Object.keys(Rec.best).length === 0, 'November files October in the history and starts fresh');
ok(Rec.history[0].picks.length === 8 && Rec.history[0].rank >= 1, 'the history keeps that month\'s dungeons and final rank');

// the Trialsworn set (stage 4): earned once per account at Trial 5 (cloak) and 10 (weapon looks, Charger), in time only
{
  const a0 = G.account(); delete a0.trialsworn; a0.looks = []; G.saveAccount(a0);
  G.newGame({ name: 'Ts', cls: 'warrior', race: 'human' }); G.S.player.level = 60;
  G.trialswornCheck(4); ok(!(G.account().trialsworn || {}).cloak, 'no Trialsworn piece below Trial 5');
  G.trialswornCheck(5); const a1 = G.account();
  ok(a1.trialsworn.cloak && !a1.trialsworn.weapons && a1.looks.includes('back:trialsworn_cloak'), 'Trial 5 in time: the Trialsworn Cloak');
  G.trialswornCheck(12); const a2 = G.account();
  ok(a2.trialsworn.weapons && a2.trialsworn.mount && D.TRIALSWORN.weapons.looks.every((id) => a2.looks.includes(D.ITEMS[id].look.join(':'))), 'Trial 10 in time: every weapon look');
  ok(G.S.player.mounts.includes('trialsworn_charger'), 'Trial 10 in time: the Trialsworn Charger');
  const nLooks = a2.looks.length; G.trialswornCheck(12); ok(G.account().looks.length === nLooks, 'earned once: a second Trial 12 gives nothing new');
  G.newGame({ name: 'Alt', cls: 'mage', race: 'human' }); const altId = G.S.id; G.save(); G.load(altId);
  ok((G.S.player.mounts || []).includes('trialsworn_charger'), 'another character has the Charger when it loads');
  ok(G.wardrobeOptions('weapon').some((o) => o.key === 'trialsworn_staff') && !G.wardrobeOptions('weapon').some((o) => o.key === 'trialsworn_axe'), 'a mage can show the Trialsworn Staff, not the Axe');
  ok(!Object.keys(D.MOUNTS).filter((k) => D.MOUNTS[k].faction).includes('trialsworn_charger'), 'the Charger is never sold');
  // the upgrades and the monthly cloak (for players who already own the set)
  G.trialswornCheck(20); const a3 = G.account();
  ok(a3.trialsworn.t15 && a3.trialsworn.t20 && a3.looks.includes('back:trialsworn_cloak_t20') && (G.S.player.mounts || []).includes('trialsworn_charger_t20'), 'Trial 20 in time: the glowing and radiant set and Chargers');
  G.monthCloakCheck(9, 1); ok(!G.account().looks.includes('back:trialsworn_cloak_m202611'), 'no monthly cloak below Trial 10');
  G.monthCloakCheck(10, 1); ok(G.account().looks.includes('back:trialsworn_cloak_m202611'), 'Trial 10 in time in November: the November cloak');
  G.monthCloakCheck(10, 2); ok(G.account().looks.includes('back:trialsworn_cloak_m202612') && !G.account().looks.includes('back:trialsworn_cloak_m202701'), 'each month its own cloak');
  const m0 = G.account().marks; G.monthCloakCheck(10, 40); G.monthCloakCheck(12, 40);
  ok(G.account().marks - m0 === G.MONTH_FALLBACK_MARKS, 'a month without a planned cloak pays Marks instead, once');
  const m1 = G.account().marks; G.monthCloakCheck(10, -1); ok(G.account().marks === m1, 'the Preseason has no monthly reward');
  // catch-up: a past month's cloak can be bought with Marks, the current month's cannot; earned and bought are told apart
  { const a4 = G.account(); a4.looks = a4.looks.filter((x) => !/trialsworn_cloak_m/.test(x)); a4.trialsworn.earned = []; a4.trialsworn.bought = []; a4.marks = 1000; G.saveAccount(a4); }
  const RD = globalThis.Date, cur = T.season(new RD());
  const pastIds = G.pastMonthCloaks(); ok(pastIds.every((id) => D.ITEMS[id].month < cur), 'only finished months are sold');
  const curId = Object.keys(D.ITEMS).find((i) => D.ITEMS[i].month === cur && D.ITEMS[i].lookOnly);
  if (curId) { const mk = G.account().marks; G.buyMonthCloak(curId); ok(G.account().marks === mk, "this month's cloak cannot be bought"); }
  if (pastIds.length) {
    const mk = G.account().marks; G.buyMonthCloak(pastIds[0]); ok(G.account().marks === mk - G.MONTH_CLOAK_COST && G.account().looks.includes(D.ITEMS[pastIds[0]].look.join(':')), 'a past cloak costs ' + G.MONTH_CLOAK_COST + ' Marks');
    const mk2 = G.account().marks; G.buyMonthCloak(pastIds[0]); ok(G.account().marks === mk2, 'bought once only');
    ok(G.wardrobeAll('back').find((o) => o.key === D.ITEMS[pastIds[0]].look[1]).source === 'Bought with Mentor Marks', 'the wardrobe says Bought');
  }
}
// the yearly mount: all 12 cloaks of the first year, earned or bought (11 is not enough), for every character
{
  const a5 = G.account(); a5.looks = (a5.looks || []).filter((x) => !/trialsworn_cloak_m/.test(x)); delete a5.trialsworn.year1; G.saveAccount(a5);
  G.newGame({ name: 'Yr', cls: 'warrior', race: 'human' }); G.S.player.level = 60;
  const ids = G.yearCloaks('year1'); ok(ids.length === 12, 'the first year has 12 cloaks');
  for (const id of ids.slice(0, 11)) G.collectLook(D.ITEMS[id]); G.yearMountCheck();
  ok(!(G.account().trialsworn || {}).year1 && !(G.S.player.mounts || []).includes('trialsworn_year1'), '11 cloaks: no yearly mount yet');
  const a6 = G.account(); a6.marks = 500; G.saveAccount(a6);
  const last = ids[11]; if (G.pastMonthCloaks().includes(last)) G.buyMonthCloak(last); else { G.collectLook(D.ITEMS[last]); G.yearMountCheck(); }
  ok(G.account().trialsworn.year1 && G.S.player.mounts.includes('trialsworn_year1'), 'the 12th cloak gives the Twelvefold Charger');
  G.newGame({ name: 'Yr2', cls: 'mage', race: 'human' }); const id2 = G.S.id; G.save(); G.load(id2);
  ok((G.S.player.mounts || []).includes('trialsworn_year1'), 'another character has it when it loads');
}
// Trial finds (#22, #31): every dungeon in the Trials has its effect item at level 60 as a blue; 1 in 5 on a timed clear,
// never over par; the find fits you (one your class can use and you don't own: the dungeon's own, else another from
// this season's Trials), the briefing's G.trialFindFor is what drops, and with nothing left the roll pays Marks
{
  const elig = new Set([...T.eligible('alliance'), ...T.eligible('horde')]);
  for (const a of elig) { const id = D.TRIAL_FIND[a], it = id && D.ITEMS[id]; ok(it && it.lvl === D.LEVEL_CAP && it.q === 3 && D.EFFECTS[it.effect], `${a} has a Trial find at level 60 (${id})`); }
  const setup = (cls) => { G.newGame({ name: 'Tf', cls, race: 'human' }); G.S.player.level = 60; const P = G.S.player; P.bags = []; P.bank = []; return P; };
  const R0 = Math.random, roll = (act, v, secs) => { Math.random = () => v; const R = { act, trial: { lvl: 2, season: G.trials().season, bestHere: 0 } }; G.trialDone(R, secs, 200); Math.random = R0; return R; };
  let P = setup('rogue'); const picks = G.trialPicks(), mine = picks.find((a) => D.TRIAL_FIND[a] && G.canUseItem(D.ITEMS[D.TRIAL_FIND[a]]));
  ok(!!mine, `a rogue can use some find this season (${mine})`);
  const fid = D.TRIAL_FIND[mine];
  ok(G.trialFindFor(mine) === fid, 'a find your class can use is the dungeon\'s own');
  ok(!roll(mine, 0.5, 100).trialFind && !G.ownsItem(fid), 'no find on a roll above 1 in 5');
  ok(!roll(mine, 0.1, 300).trialFind && !G.ownsItem(fid), 'no find over par');
  ok(roll(mine, 0.1, 100).trialFind === fid && G.ownsItem(fid), 'a timed clear on a 1-in-5 roll gives the find');
  const next = G.trialFindFor(mine);
  ok(next !== fid && (!next || (G.canUseItem(D.ITEMS[next]) && !G.ownsItem(next))), `once you own it, the find is another you can use (${next})`);
  ok(!next || roll(mine, 0.1, 100).trialFind === next, 'the briefing\'s find is the one that drops');
  for (const k of ['bags', 'bank']) { P = setup('rogue'); if (k === 'bags') G.giveReward(G.copyItem(fid), 't'); else P.bank.push({ item: G.copyItem(fid), n: 1 }); ok(G.trialFindFor(mine) !== fid, `never a duplicate while it is in your ${k}`); }
  P = setup('rogue'); P.equip[D.ITEMS[fid].slot] = G.copyItem(fid); ok(G.trialFindFor(mine) !== fid, 'never a duplicate while you wear it');
  // a class that can't use the dungeon's item gets one it can use, from another of this season's Trial dungeons
  const theirs = picks.find((a) => D.TRIAL_FIND[a] && !G.canUseItem(D.ITEMS[D.TRIAL_FIND[a]], 'priest'));
  if (theirs) { P = setup('priest'); const f2 = G.trialFindFor(theirs); ok(f2 && f2 !== D.TRIAL_FIND[theirs] && G.canUseItem(D.ITEMS[f2]) && picks.some((a) => D.TRIAL_FIND[a] === f2), `a priest's find at ${theirs} is a usable one from this season (${f2})`);
    const heals = picks.map((a) => D.TRIAL_FIND[a]).filter((id) => id && G.canUseItem(D.ITEMS[id]) && D.EFFECTS[D.ITEMS[id].effect].role === 'healing');
    ok(!heals.length || D.EFFECTS[D.ITEMS[f2].effect].role === 'healing', `a healer's other find is a healing effect when the season has one (${f2})`); }
  else ok(true, 'every find this season suits a priest');
  // nothing left: every usable find of the season owned, the roll pays the Trial's Marks
  P = setup('rogue'); for (const a of picks) { const id = D.TRIAL_FIND[a]; if (id && G.canUseItem(D.ITEMS[id]) && !G.ownsItem(id)) P.bank.push({ item: G.copyItem(id), n: 1 }); }
  const m0 = G.account().marks, R = roll(mine, 0.1, 100);
  ok(G.trialFindFor(mine) === null && !R.trialFind && R.trialFindMarks === 7 && G.account().marks >= m0 + 7 + 7, `with nothing left, a winning roll pays the Trial's Marks again (${R.trialFindMarks})`);
  P = setup('rogue'); let got = 0; for (let i = 0; i < 2000; i++) { P.bags = []; P.bank = []; for (const s2 in P.equip) if (P.equip[s2] && P.equip[s2].id === fid) delete P.equip[s2]; const R2 = { act: mine, trial: { lvl: 2, season: G.trials().season, bestHere: 0 } }; G.trialDone(R2, 100, 200); if (R2.trialFind) got++; }
  ok(got > 330 && got < 470, `about 1 in 5 timed clears gives a find (${got} of 2000)`);
}
console.log(`trials: ${n - bad}/${n} checks pass`);
process.exit(bad ? 1 : 0);
