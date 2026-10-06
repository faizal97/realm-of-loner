// Chat honesty: every bot message that reads like a request (LFG, trade, asking for help, invites) must be a real one
// the player can act on (m.act), or point at one (m.ref). Also reports how varied each channel is.
// Runs hours of chat at a few levels for both factions.  node sim/chatcheck.js
require('./_seed.js'); // seeded (#125): the same commit always gives the same result; SEED=n picks other dice
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
require('../src/data.js'); require('../src/engine.js'); require('../src/bots.js'); require('../src/game.js'); require('../src/social.js'); require('../src/trials.js');
const { G, D, B, SOC } = globalThis;
// a fixed start (#125): the real clock made every run different (who is online follows the local hour); a Wednesday
// evening, as test/world.js; the sim moves t itself
const RealDate = Date; let t = new RealDate(2026, 9, 7, 19).getTime();
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(t); } static now() { return t; } };
const REQ = /\b(LF\d?M|LFG|WTS|WTB|pst|inv pls|recruit(ing)?|group up|team up|party up|carry me|can (u|you) (help|carry|craft|make|run)|help me|need (a|an|\d+) |anyone (want|wanna|up for|free|selling|got|spare)|who has|spare \d|selling|buying|will pay|ill pay|ill tip)\b|\bduel\?/i;
let bad = 0;
const runs = [['human', 'warrior', 'stormwind', 60], ['orc', 'priest', 'orgrimmar', 60], ['human', 'paladin', 'goldshire', 10], ['human', 'mage', 'darkshire', 26], ['orc', 'warrior', 'crossroads', 18], ['undead', 'priest', 'tarren_mill', 32], ['dwarf', 'hunter', 'gadgetzan', 46], ['tauren', 'druid', 'everlook', 57]];
const seen = {}, total = {};
for (const [race, cls, place, lvl] of runs) {
  G.newGame({ name: 'T', cls, race }); const S = G.S, P = S.player;
  if (!D.PLACES[place]) { console.log('no place', place); continue; }
  P.level = lvl; P.place = place; S.flags.warModeAsked = true; S.flags.warMode = false; P.money = 1e6;
  for (const b of S.bots) b.level = Math.max(1, Math.min(60, lvl + Math.round((Math.random() - 0.5) * 8)));
  if (lvl >= 20) { const gs = SOC.myGuilds(); const g = gs.find((x) => lvl >= x.min); if (g) P.guild = g.g; }
  for (let i = 0; i < 4 * 3600; i++) {
    t += 1000; G.update(1);
    for (const m of S.chat) {
      if (m.checked) continue; m.checked = 1;
      if (!m.from || m.me || m.ch === 'party' || m.ch === 'system' || m.ch === 'combat' || m.ch === 'loot') continue;
      total[m.ch] = (total[m.ch] || 0) + 1;
      const key = m.ch + ': ' + m.text.replace(/\d+/g, '#').toLowerCase();
      seen[m.ch] = seen[m.ch] || new Set(); seen[m.ch].add(key);
      if (REQ.test(m.text) && !m.act && !m.ref) { bad++; if (bad <= 25) console.log(`FAKE REQUEST (${race} ${lvl}, ${m.ch}): ${m.text}`); }
    }
  }
}
for (const ch in total) console.log(`${ch}: ${total[ch]} messages, ${seen[ch].size} distinct`);
console.log(bad ? `FAIL: ${bad} request-like messages with nothing to act on` : 'OK: every request-like message is a real request');
process.exitCode = bad ? 1 : 0;
