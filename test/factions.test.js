// War Mode's alert names the other side by its name in the game (#93): "KRUGAR IN BRACKENFORD!!", never "HORDE …" or
// "… alliance here" (the key the code uses, never shown). An enemy player is made to appear in a dangerous place with
// allies around, and every chat line it causes is read, in any case.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, B, character, now, setNow } = require('./world');

const OLD = /(?<![A-Za-z0-9_])(horde|alliance)(?![A-Za-z0-9_])/i;
function alertLines(race, cls) {
  const lines = [], start = now();
  character(30, cls, race); // dangerOf reads the player's side
  const places = Object.keys(D.PLACES).filter((k) => G.dangerOf(k) > 0).sort((a, b) => !!D.PLACES[b].safe - !!D.PLACES[a].safe); // towns first: their shout names the side
  // who is online, and where, follows the clock: try each hour of the day until a town has allies around
  for (let h = 0; h < 24 && !lines.some((x) => /!!$/.test(x)); h++) for (const k of places) {
    setNow(start + h * 3600000);
    const { S, P } = character(30, cls, race); const f = S.flags;
    for (const b of S.bots) b.level = 20 + (b.id % 21); // a fresh world's players are all in the starting zones: spread them over 20-40
    P.place = k; f.warMode = true; f.warModeAsked = true; f.nextAmbush = 0;
    const before = S.chat.length, R = Math.random;
    Math.random = () => 0; // the ambush roll, the alert roll, the first speaker and line: all happen this tick
    try { G.update(0.1); } finally { Math.random = R; }
    if (!S.intruder) continue;
    // the alert's own lines (src/game.js spawnIntruder): in a town "<SIDE> IN <PLACE>!!" and its two variants, elsewhere
    // "watch out, pvp", "<side> here" and "a <class> is ganking here"
    for (const m of S.chat.slice(before)) if (m.from && /!!$|, careful$|near the inn$|^watch out, pvp$| here$/i.test(m.text)) lines.push(m.text);
    if (lines.some((t) => /!!$/.test(t))) break; // a town's shout, which names the side
  }
  setNow(start);
  return lines;
}

for (const [race, cls, theirs] of [['human', 'warrior', 'horde'], ['orc', 'mage', 'alliance']]) {
  test(`a ${race}'s War Mode alerts name the ${D.FACTIONS[theirs].name}, never the old name`, () => {
    const lines = alertLines(race, cls);
    assert.ok(lines.length > 0, 'an alert was posted');
    for (const t of lines) assert.ok(!OLD.test(t), `"${t}" uses an old faction name`);
    assert.ok(lines.some((t) => t.includes(D.FACTIONS[theirs].name.toUpperCase())), `a town's shout names the ${D.FACTIONS[theirs].name}: ${lines.join(' | ')}`);
  });
}
