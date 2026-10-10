// Chat requests (#166): a request line shows its time left ("4m", "<1m") and, once it runs out, "expired"; a request
// closes only when its action worked, so a refused Help or Apply leaves it open; a Help Wanted whose group already
// found someone shows a disabled "Someone else took this spot".
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character, now } = require('./world');
const SOC = globalThis.SOC;

const req = (act) => ({ ch: 'whisper', act: Object.assign({ state: 'open', posted: now(), until: now() + 5 * 60000 }, act) });

test('time left: minutes, then <1m, then expired', () => {
  character(20, 'warrior', 'human');
  const m = req({ kind: 'chat' });
  m.act.until = now() + 4 * 60000 + 30000; assert.strictEqual(SOC.timeLeft(m.act), '4m');
  m.act.until = now() + 59000; assert.strictEqual(SOC.timeLeft(m.act), '<1m');
  m.act.until = now() - 1; assert.strictEqual(SOC.timeLeft(m.act), 'expired');
  m.act.state = 'expired'; assert.strictEqual(SOC.timeLeft(m.act), 'expired');
  m.act.state = 'done'; assert.strictEqual(SOC.timeLeft(m.act), null, 'a finished request shows nothing');
  assert.strictEqual(SOC.timeLeft(undefined), null);
});

test('a refused Help leaves the request open and says why', () => {
  const { S } = character(30, 'warrior', 'human');
  const act = Object.keys(D.ACTIVITIES).find((k) => G.helpWantedFor(k));
  S.helpWanted = [{ id: 'hw1', act, role: 'dps', posterName: 'Someone', expires: now() + 60000 }];
  S.flags.deserterUntil = now() + 60000;
  const m = req({ kind: 'help_wanted', hw: 'hw1', bot: S.bots[0].id });
  const said = SOC.actions(m)[0].fn();
  assert.match(said, /Deserter/);
  assert.strictEqual(m.act.state, 'open');
});

test('a Help Wanted that is gone shows a disabled "Someone else took this spot"', () => {
  const { S } = character(30, 'warrior', 'human'); S.helpWanted = [];
  const m = req({ kind: 'help_wanted', hw: 'gone', bot: S.bots[0].id });
  const acts = SOC.actions(m);
  assert.strictEqual(acts.length, 1);
  assert.strictEqual(acts[0].label, 'Someone else took this spot');
  assert.strictEqual(acts[0].disabled, true);
  assert.strictEqual(m.act.state, 'open', 'not closed silently');
});

test('a refused guild Apply leaves the request open; a good one closes it', () => {
  const { P, S } = character(30, 'warrior', 'human'); P.guild = -1;
  const g = SOC.myGuilds()[0].g;
  S.soc = Object.assign(S.soc || {}, { applied: { g, until: now() + 60000 } }); // already applied somewhere
  const m = req({ kind: 'guild_apply', g, bot: S.bots[0].id });
  const said = SOC.actions(m)[0].fn();
  assert.match(said, /already applied/);
  assert.strictEqual(m.act.state, 'open');
  S.soc.applied = null;
  const ok = SOC.actions(m)[0].fn();
  assert.ok(!ok, 'no refusal');
  assert.strictEqual(m.act.state, 'done');
});
