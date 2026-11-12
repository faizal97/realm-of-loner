// Play-test findings on bots, chat and the economy (build 69aa5d9): every bot's gear gives it sensible health, chat
// fits where you are, and the economy pays fair prices.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, E } = require('./world');

// a careful bot (skill 0.8) whose main role is this one, as the group finder seats them; mean max health of 20
const meanHp = (cls, role, level) => {
  let hp = 0, n = 0;
  for (let id = 1; n < 20; id++) { const b = { id, name: 'X', cls, race: 'human', level, skill: 0.8, role }; if (G.mainRole(b) !== role) continue; n++; hp += E.charUnit(G.botChar(b), 'ally', 'bot', 0).maxHp; }
  return hp / n;
};

test('a druid damage bot has the health of the other casters (its gear has stamina)', () => {
  if (!G.S) G.newGame({ name: 'Ana', cls: 'warrior', race: 'human' });
  for (const L of [30, 60]) {
    const druid = meanHp('druid', 'dps', L);
    for (const cls of ['mage', 'shaman', 'priest']) assert.ok(druid >= 0.85 * meanHp(cls, 'dps', L), `level ${L}: druid ${Math.round(druid)} vs ${cls} ${Math.round(meanHp(cls, 'dps', L))}`);
  }
});

test('every class and role at 30 and 60: a careful bot has at least 70% of the health of the sturdiest of its role', () => {
  if (!G.S) G.newGame({ name: 'Ana', cls: 'warrior', race: 'human' });
  for (const L of [30, 60]) for (const role of ['tank', 'healer', 'dps']) {
    const rows = Object.keys(D.CLASSES).filter((c) => (D.CLASSES[c].roles || [D.CLASSES[c].role]).includes(role)).map((c) => [c, meanHp(c, role, L)]);
    const top = Math.max(...rows.map((r) => r[1]));
    for (const [c, hp] of rows) assert.ok(hp >= 0.7 * top, `level ${L} ${role}: ${c} ${Math.round(hp)} vs best ${Math.round(top)}`);
  }
});
