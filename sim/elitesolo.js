// Can a solo player kill the open-world elites? (player feedback). The open-world elites are the "Wanted" group-finder
// elites (an activity of size 3 with a named elite boss; the world bosses are 10-player and left out). For each one,
// each class fights it ALONE, at full health and resource, in a full set of green gear made for the player's level
// (what a questing character wears: sim/gearvariety.js #141), skill 0.8, the pet a player of that level has; and, for
// comparison, with the 2 bots a group of 3 would bring (B.makeBot, the party role rule). Win = the elite dies.
// The elite only (not the pulls before it). LVOFF=3 plays that many levels above the elite.
//   ROOT=~/azeroth-solo-measure N=60 SEED=0 node sim/elitesolo.js        (CLASSES=, ONLY=hogger,stitches, LVOFF=)
const ROOT = process.env.ROOT || require('path').join(__dirname, '..');
let seedS = 0; const seed = (n) => { seedS = (0x5eed1e55 ^ Math.imul(n + 1 + (+process.env.SEED || 0) * 100003, 0x9E3779B1)) >>> 0; };
Math.random = () => { seedS = (seedS + 0x6D2B79F5) >>> 0; let x = seedS; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
seed(0);
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
const RealDate = Date; let t = new RealDate(2026, 9, 7, 19).getTime();
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(t); } static now() { return t; } };
for (const f of ['data', 'engine', 'bots', 'game']) require(ROOT + '/src/' + f + '.js');
const { G, D, E, B } = globalThis;
const N = +(process.env.N || 60), LVOFF = +(process.env.LVOFF || 0), CAP = 600;
const CLASSES = (process.env.CLASSES ? process.env.CLASSES.split(',') : Object.keys(D.CLASSES).filter((c) => !D.CLASSES[c].hidden));
const ELITES = Object.keys(D.ACTIVITIES).filter((k) => { const A = D.ACTIVITIES[k]; return !A.worldBoss && A.size === 3 && A.boss && D.MOBS[A.boss] && D.MOBS[A.boss].elite; }).filter((k) => !process.env.ONLY || process.env.ONLY.split(',').includes(k));
const partyRole = (cls) => (cls === 'warrior' ? 'tank' : cls === 'priest' ? 'healer' : ['paladin', 'druid', 'shaman'].includes(cls) ? (Math.random() < 0.5 ? 'healer' : 'dps') : 'dps');
function player(cls, LV) {
  G.newGame({ name: 'R', cls, race: 'human' }); const P = G.S.player; P.level = LV; G.S.flags.warModeAsked = true;
  const C = D.CLASSES[cls], wt = cls === 'paladin' ? 'mace' : cls === 'mage' || cls === 'warlock' ? 'staff' : C.weapons[0];
  P.equip = { weapon: G.genGear('weapon', LV, 2, { wtype: wt }) }; if (C.ranged) P.equip.ranged = G.genGear('ranged', LV, 2);
  for (const sl of D.GEAR_SLOTS) if (!P.equip[sl] && !['weapon', 'ranged', 'offhand'].includes(sl)) P.equip[sl] = G.genGear(sl, LV, 2, { atype: C.armorType });
  P.talents = G.autoTalents(cls, 'dps', LV, 0); P.role = 'dps';
  if (cls === 'warlock' && LV >= (D.PETS.voidwalker ? D.PETS.voidwalker.lvl || 1 : 1)) P.pet = { type: 'voidwalker', name: 'Pet', hp: null };
  if (cls === 'hunter') { const b = Object.keys(D.MOBS).filter((k) => D.MOBS[k].family === 'beast' && !D.MOBS[k].named && !D.MOBS[k].elite && !D.MOBS[k].boss && D.MOBS[k].lvl[0] <= LV).sort((a, c) => D.MOBS[c].lvl[0] - D.MOBS[a].lvl[0])[0]; if (b) P.pet = { type: 'beast', mob: b, name: D.MOBS[b].name, hp: null }; }
  P.hp = null; P.res = null; return P;
}
function fight(cls, key, i, party) {
  seed(i); const ML = D.MOBS[key].lvl[1], LV = Math.min(60, ML + LVOFF), P = player(cls, LV);
  const pu = E.charUnit(P, 'ally', 'player', t); pu.kind = 'bot'; pu.bot = { skill: 0.8, react: 0.4 }; pu.role = 'dps';
  const allies = [pu], pet = G.petUnitFor ? G.petUnitFor(pu) : null; if (pet) allies.push(pet);
  if (party) for (let j = 0; j < 2; j++) { const b = B.makeBot(1 + Math.floor(Math.random() * 1e6), new Set(), { level: LV }); b.role = partyRole(b.cls); const ch = G.botChar(b); const u = E.charUnit(ch, 'ally', 'bot', t); u.bot = { skill: b.skill, react: 0.9 - 0.6 * b.skill }; u.role = b.role; allies.push(u); }
  const mu = E.mobUnit(key, ML), C = E.fight(allies, [mu], { soloUid: pu.uid, puller: pu });
  let low = 1; while (!C.over && C.t < CAP) { E.tick(C, 0.1); C.events.length = 0; low = Math.min(low, Math.max(0, pu.hp) / pu.maxHp); }
  return { win: mu.hp <= 0, secs: C.t, died: pu.hp <= 0, low };
}
const pad = (s, n) => String(s).padEnd(n), pc = (x) => String(Math.round(x * 100)).padStart(3) + '%';
const res = {};
for (const act of ELITES) { const key = D.ACTIVITIES[act].boss; res[act] = {}; for (const cls of CLASSES) for (const party of [false, true]) { let w = 0, s = 0, lo = 0; for (let i = 0; i < N; i++) { const r = fight(cls, key, 1000 * CLASSES.indexOf(cls) + i, party); w += r.win; s += r.secs; lo += r.low; } res[act][cls + (party ? '+2' : '')] = { rate: w / N, secs: s / N, low: lo / N }; } }
if (process.env.JSON) { console.log(JSON.stringify(res)); process.exit(0); }
console.log(`open-world elites: ${ELITES.length}; ${CLASSES.length} classes, ${N} fights each, player ${LVOFF ? LVOFF + ' levels above' : 'at'} the elite's level, green gear of its level`);
console.log(pad('elite (level)', 38) + CLASSES.map((c) => pad(c.slice(0, 5), 6)).join('') + '| median alone | median with 2 bots');
const med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
for (const act of ELITES) { const M = D.MOBS[D.ACTIVITIES[act].boss]; console.log(pad(`${M.name} (${M.lvl[1]})`, 38) + CLASSES.map((c) => pad(pc(res[act][c].rate), 6)).join('') + `| ${pc(med(CLASSES.map((c) => res[act][c].rate)))}        ${pc(med(CLASSES.map((c) => res[act][c + '+2'].rate)))}`); }
for (const [lab, th] of [['under 10%', 0.1], ['under 50%', 0.5], ['under 80%', 0.8]]) {
  console.log(`\nelites a class wins ${lab} of fights alone (of ${ELITES.length}):`);
  console.log(pad('', 8) + CLASSES.map((c) => `${c} ${ELITES.filter((a) => res[a][c].rate < th).length}`).join(' · '));
  console.log(pad('with 2 bots', 8) + CLASSES.map((c) => `${c} ${ELITES.filter((a) => res[a][c + '+2'].rate < th).length}`).join(' · '));
}
