// #499: Guild chat. A `//` comment in the middle of the guild-talk line list blanked six lines; "just dinged 60!" came from
// players with no level-up; "gn guys" from players who stayed online; one lone guildmate talked to an empty room.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const W = require('./world');

const DEAD = /who's online tonight|this week's goal is going well|fell off the lift again|gz everyone on the weekly progress/i;
function guildChat(hours) {
  W.setNow(new Date(2026, 10, 3, 18).getTime());
  const { S } = W.character(30); S.player.guild = 0;
  for (let i = 0; i < hours * 60; i++) W.advance(60);
  return { S, msgs: (S.chat || []).filter((m) => m.ch === 'guild') };
}

test('the six guild lines are said again, no goodbye from someone still online, a ding only after a level-up', () => {
  const { S, msgs } = guildChat(8);
  assert.ok(msgs.length > 20, `${msgs.length} guild lines`);
  assert.ok(msgs.some((m) => DEAD.test(m.text)), 'a line from the restored part of the list');
  assert.ok(!msgs.some((m) => /\bgn guys\b/i.test(m.text)), 'no "gn guys"');
  for (const m of msgs.filter((x) => /\b(just dinged|finally|ding) \d+/i.test(x.text))) {
    const b = S.bots.find((x) => x.id === m.fromId);
    assert.ok(b && b.dingAt && m.t - b.dingAt < 2 * 3600000 && m.t >= b.dingAt, `"${m.text}" from someone with no level-up lately`);
  }
});
