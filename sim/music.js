// Music (v10.8): every place plays the track meant for it, and a track that is not approved yet falls back to the
// music it had before (so nothing changes until it ships). node sim/music.js
require('./_seed.js'); // seeded (#125): the same commit always gives the same result; SEED=n picks other dice
globalThis.localStorage = (() => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; })();
require('../src/data.js'); require('../src/engine.js'); require('../src/bots.js'); require('../src/game.js');
const { G, D } = globalThis;
const fs = require('fs'), path = require('path');
const tracks = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'audio', 'out', 'music.json'), 'utf8'));
const OLD = new Set(['ambermoor', 'town', 'dungeon']), all = () => true, old = (n) => OLD.has(n);
let ok = 0, bad = 0;
const check = (c, m) => { if (c) ok++; else { bad++; console.log('FAIL', m); } };
G.newGame({ name: 'Tune', cls: 'warrior', race: 'human' }); const S = G.S, P = S.player;
const at = (place) => { P.place = place; P.travel = null; S.run = null; S.bg = null; };
// every zone and place: approved -> its own track (composed), not yet -> one of the three old ones, as before
for (const k in D.PLACES) {
  at(k); const pl = D.PLACES[k], a = G.musicFor(all), o = G.musicFor(old);
  check(tracks[a], `${k} plays '${a}', which is not composed`);
  check(OLD.has(o), `${k} plays '${o}' before its track is approved`);
  check(o === (pl.safe ? 'town' : 'ambermoor'), `${k}: before approval it should keep ${pl.safe ? 'town' : 'ambermoor'}, got ${o}`);
}
const expect = { orgrimmar: 'vazhrak', stormwind: 'kingsmere', stormwind_gate: 'kingsmere', stormwind_bank: 'kingsmere', ironforge: 'keldrun', darnassus: 'nyrwen', thunder_bluff: 'hornwind', undercity: 'gravenhold', goldshire: 'town', razor_hill: 'dunescar_town', kharanos: 'kaldvik_town', everlook: 'icewold_town', gadgetzan: 'sirocco_town', darkshire: 'wraithwood_town', rumhook_bay: 'rumhook' };
for (const [k, m] of Object.entries(expect)) { at(k); check(G.musicFor(all) === m, `${k} should play ${m}, plays ${G.musicFor(all)}`); }
const outdoorOf = (zone) => Object.keys(D.PLACES).find((k) => D.PLACES[k].region === zone && !D.PLACES[k].safe);
// every zone has its own outdoor track (Ambermoor keeps the first one) and every zone with a town its own town track
for (const z in D.REGIONS) {
  const R = D.REGIONS[z], hasTown = Object.values(D.PLACES).some((p) => p.region === z && p.safe && !p.music);
  check(z === 'elwynn' || R.music, `zone ${z} has no outdoor track`);
  check(z === 'elwynn' || !hasTown || R.town, `zone ${z} has towns but no town track`);
}
for (const [z, m] of [['tanaris', 'desert'], ['durotar', 'dunescar'], ['winterspring', 'snow'], ['dunmorogh', 'kaldvik'], ['duskwood', 'swamp'], ['plaguelands', 'rotmoor'], ['elwynn', 'ambermoor'], ['ashenvale', 'elderglen']]) {
  at(outdoorOf(z)); check(G.musicFor(all) === m, `outdoors in ${z} should play ${m}, plays ${G.musicFor(all)}`);
}
// on the road: the zone's mood, even leaving a capital
at('orgrimmar'); P.travel = { to: 'razor_hill', start: 0, end: 1 }; check(G.musicFor(all) === 'dunescar', `travelling from Vazhrak plays Dunescar's track, plays ${G.musicFor(all)}`);
// runs: raids and world bosses have themes, dungeons keep the dungeon loop
for (const [act, m] of [['onyxias_lair', 'veshmira'], ['molten_core', 'magma'], ['tidecrown_citadel', 'tidecrown'], ['wb_ashwing', 'worldboss'], ['deadmines', 'smugglers_deep'], ['stratholme', 'graymouth']]) {
  if (!D.ACTIVITIES[act]) { check(false, `no activity ${act}`); continue; }
  at('stormwind'); S.run = { act }; check(G.musicFor(all) === m, `${act} should play ${m}, plays ${G.musicFor(all)}`); check(G.musicFor(old) === 'dungeon', `${act} before approval keeps the dungeon loop`);
}
// the battleground: its own theme, before approval the place's music as before
at('stormwind'); S.bg = { act: 'bg_highmoor' }; check(G.musicFor(all) === 'highmoor', `the battleground plays highmoor, plays ${G.musicFor(all)}`); check(G.musicFor(old) === 'ambermoor', `the battleground before approval plays ${G.musicFor(old)}`);
check(tracks.menu, 'the main menu theme is composed');
// every dungeon and raid has its own battle track, and a run in it plays that track
for (const [dg, Dg] of Object.entries(D.DUNGEONS)) {
  check(Dg.music && tracks[Dg.music], `${Dg.name} has no composed track`);
  const act = Object.keys(D.ACTIVITIES).find((a) => D.ACTIVITIES[a].dungeon === dg);
  if (act) { at('stormwind'); S.run = { act }; check(G.musicFor(all) === Dg.music, `a run in ${Dg.name} plays ${G.musicFor(all)}`); check(G.musicFor(old) === 'dungeon', `${Dg.name} before approval keeps the dungeon loop`); }
}
console.log(`music: ${ok}/${ok + bad} checks pass`);
process.exitCode = bad ? 1 : 0;
