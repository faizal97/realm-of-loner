// The hunt schedule is content-proof (#43 job 3, design mindset §3): with none, one or many level-60 rares, the existing
// rares' windows are unchanged; a rare's time never moves inside its window and fits in it; two runs of the same date
// agree; "last seen" is never in the future; the trophy list follows the data.
//   ROOT=~/azeroth-solo-measure node sim/huntproof.js       (runs each variant in its own process: the hunt list is
//   read once per process, as in the game)
require('./_seed.js'); // seeded (#125): the same commit always gives the same result; SEED=n picks other dice
const ROOT = process.env.ROOT || require('path').join(__dirname, '..');
const { execFileSync } = require('child_process');
const DAYS = 60, FROM = Date.UTC(2026, 9, 5);
if (process.env.VARIANT) {
  globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
  for (const f of ['data', 'engine', 'bots', 'game']) require(ROOT + '/src/' + f + '.js');
  const { G, D } = globalThis; G.newGame({ name: 'P', cls: 'warrior', race: 'human' });
  const real = Object.keys(D.PLACES).flatMap((pk) => Object.keys(D.PLACES[pk].named || {}).filter((k) => D.MOBS[k] && D.MOBS[k].lvl[1] >= G.HUNT_LVL).map((k) => [pk, k]));
  const V = process.env.VARIANT;
  if (V === 'none') for (const [pk, k] of real) delete D.PLACES[pk].named[k];
  if (V === 'one') for (const [pk, k] of real.slice(1)) delete D.PLACES[pk].named[k];
  if (V === 'many') for (let i = 0; i < 40; i++) { const k = 'test_rare_' + i; D.MOBS[k] = Object.assign({}, D.MOBS[real[0][1]], { name: 'Test ' + i }); D.PLACES[real[i % real.length][0]].named[k] = D.PLACES[real[0][0]].named[real[0][1]] || 1; }
  const W = G.HUNT_WINDOW, out = { rares: G.huntRares().map((r) => r.key), trophies: G.trophyList().length, starts: {}, bad: [] };
  for (const { key } of G.huntRares()) {
    out.starts[key] = [];
    for (let w = Math.floor(FROM / W); w < Math.floor((FROM + DAYS * 86400e3) / W); w++) {
      const s = G.huntStart(key, w); out.starts[key].push(s);
      if (s < w * W || s + G.HUNT_UP > (w + 1) * W) out.bad.push(`${key} window ${w}: ${s} doesn't fit`);
      for (let m = 0; m < W / 60e3; m += 7) { const tt = w * W + m * 60e3, h = G.huntNow(key, tt); if (h.start !== s) out.bad.push(`${key} window ${w} minute ${m}: start moved`); if (G.huntLastSeen(key, tt) > tt) out.bad.push(`${key} at ${tt}: last seen in the future`); }
    }
  }
  process.stdout.write(JSON.stringify(out));
  return;
}
const run = (v) => JSON.parse(execFileSync(process.execPath, [__filename], { env: Object.assign({}, process.env, { VARIANT: v }), maxBuffer: 1 << 28 }).toString());
let bad = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) bad++; };
const base = run('base'), again = run('base'), none = run('none'), one = run('one'), many = run('many');
ok(JSON.stringify(base) === JSON.stringify(again), `two runs of the same dates agree (${base.rares.length} rares, ${DAYS} days)`);
for (const [n, v] of [['as shipped', base], ['none', none], ['one', one], ['many (+40)', many]]) ok(!v.bad.length, `${n}: every appearance fits its window, never moves inside it, last seen never ahead${v.bad.length ? ': ' + v.bad.slice(0, 3).join('; ') : ''}`);
ok(none.rares.length === 0 && none.trophies === base.trophies - base.rares.length, `no rares: the hunt is empty and the trophies are the world bosses only (${none.trophies})`);
ok(one.rares.length === 1 && JSON.stringify(one.starts[one.rares[0]]) === JSON.stringify(base.starts[one.rares[0]]), `one rare: it keeps its windows (${one.rares[0]})`);
ok(many.rares.length === base.rares.length + 40 && base.rares.every((k) => JSON.stringify(many.starts[k]) === JSON.stringify(base.starts[k])), `many rares (+40): every existing rare keeps all its windows; trophies ${base.trophies} -> ${many.trophies}`);
console.log(bad ? `${bad} failures` : 'the hunt schedule is content-proof');
process.exit(bad ? 1 : 0);
