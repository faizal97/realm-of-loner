// Guild play-test findings (#596): a Trials guild's tab, and who answers or recruits for a guild.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const W = require('./world');
const { G, B, character } = W;

test('every guild has a message of the day, Trials guilds included (#596)', () => {
  character(60); const SOC = globalThis.SOC;
  const trials = B.GUILDS.map((_, g) => g).filter((g) => SOC.guildStyle(g) === 'trials');
  assert.ok(trials.length >= 2, 'the Trials guilds exist');
  for (let g = 0; g < B.GUILDS.length; g++) { const m = SOC.motd(g); assert.ok(typeof m === 'string' && m.length, B.GUILDS[g]); }
});

test('with no member online, an application waits; a member answers it later (#596)', () => {
  const { S, P } = character(60); P.guild = -1; const SOC = globalThis.SOC;
  const g = B.GUILDS.map((_, i) => i).find((i) => B.GUILD_FACTION[i] === G.myFaction() && SOC.guildInfo(i).members > 0);
  const io = B.isOnline;
  B.isOnline = (b, d) => (b.guild === g ? false : io(b, d));
  try {
    S.pending = []; SOC.apply(g);
    assert.strictEqual(S.pending.length, 0, 'nobody answers while no member is online');
    assert.ok(S.soc.applied && S.soc.applied.waiting, 'the application waits');
    W.setNow(W.now() + 10 * 60000); SOC.tick();
    assert.ok(S.soc.applied, 'still waiting after the usual 5 minutes');
    B.isOnline = (b, d) => b.guild === g || io(b, d);
    SOC.tick();
    const ans = S.pending.filter((p) => p.ch === 'whisper');
    assert.strictEqual(ans.length, 1);
    assert.strictEqual(S.bots.find((b) => b.id === ans[0].bot).guild, g, 'a member answers');
  } finally { B.isOnline = io; }
});

test('only an online member posts a guild\'s recruiting ad (#596)', () => {
  const { S, P } = character(30); P.guild = -1; const SOC = globalThis.SOC;
  const io = B.isOnline; let ads = 0;
  for (let i = 0; i < 60; i++) {
    const off = new Set(B.GUILDS.map((_, g) => g).filter((g) => (i + g) % 2)); /* half the guilds have nobody online */
    B.isOnline = (b, d) => (off.has(b.guild) ? false : io(b, d));
    try {
      const n0 = S.chat.length; SOC.makeRecruit();
      for (const m of S.chat.slice(n0)) if (m.act && m.act.kind === 'guild_apply') { ads++; const b = S.bots.find((x) => x.id === m.act.bot); assert.strictEqual(b.guild, m.act.g, `${m.from} posted for <${B.GUILDS[m.act.g]}>`); }
    } finally { B.isOnline = io; }
    W.setNow(W.now() + 3600000 * 0.37);
  }
  assert.ok(ads >= 10, `${ads} ads`);
});
