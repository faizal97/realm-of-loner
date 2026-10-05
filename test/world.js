// The shared test world (#88): the game's own code in Node, with seeded dice, a fixed clock that only moves when a test
// moves it, and an in-memory localStorage, as the sims run it (sim/*.js). require('./world') once per test file;
// node --test runs each file in its own process, so files never share a world.
'use strict';
process.env.TZ = globalThis.TEST_TZ || 'UTC'; // one time zone everywhere (who is online and where follows the local hour); a test of local days sets TEST_TZ first
let s = 0x5eed1e55 >>> 0;
Math.random = () => { s = (s + 0x6D2B79F5) >>> 0; let x = s; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
globalThis.localStorage = (() => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), clear: () => m.clear(), keys: () => [...m.keys()] }; })();
const RealDate = Date; let t = new RealDate(2026, 9, 7, 19).getTime(); // a Wednesday evening
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(t); } static now() { return t; } };
// a test that sets globalThis.AZ_DEV before requiring this file runs as a dev build (#92): src/devkeys.js first, as build.py --dev does
for (const f of (globalThis.AZ_DEV ? ['devkeys'] : []).concat(['data', 'engine', 'bots', 'game', 'trials', 'social', 'report', 'update'])) require(`../src/${f}.js`);
const { G, D, E, B } = globalThis;

// a character at a level, in gear for it, with money, Marks and a few things in the bags; standing at a place of its level
function character(level, cls, race) {
  if (G.S) G.logout(); // as the game does before a new character: no fight or unit left over from the last test
  G.newGame({ name: 'Tester', cls: cls || 'warrior', race: race || 'human' });
  const S = G.S, P = S.player; S.flags.warModeAsked = true; P.level = level;
  P.equip = G.botChar({ name: 'x', cls: P.cls, race: P.race, level, skill: 0.8 }).equip; P.talents = G.autoTalents(P.cls, 'dps', level, 0);
  P.money = 1e7; const a = G.account(); a.marks = 500; G.saveAccount(a);
  const place = Object.keys(D.PLACES).find((k) => { const p = D.PLACES[k]; return p.lvl && p.lvl[0] <= level && p.lvl[1] >= level && p.inn; }) || P.place;
  P.place = place;
  return { S, P };
}
const advance = (sec) => { for (let i = 0; i < sec * 4; i++) { t += 250; G.update(0.25); } };

module.exports = { G, D, E, B, character, advance, now: () => t, setNow: (ms) => { t = ms; }, store: localStorage };
