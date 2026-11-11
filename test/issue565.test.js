// Guilds for level 60 (#565): raiding and PvP guilds on both sides, raid progress, the realm ranking, Crestbearer.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const W = require('./world');
const { G, D, B, character } = W;

test('each faction has a raiding and a PvP guild, raiding asks for 60', () => {
  const SOC = globalThis.SOC; character(60);
  for (const f of ['alliance', 'horde']) {
    const gs = B.GUILDS.map((_, g) => SOC.guildInfo(g)).filter((x) => x.faction === f);
    assert.ok(gs.some((x) => x.style === 'raiding'), f + ' raiding');
    assert.ok(gs.some((x) => x.style === 'pvp'), f + ' pvp');
    for (const x of gs.filter((y) => y.style === 'raiding')) assert.strictEqual(x.min, 60);
  }
});

test('at 60 the list starts with raiding or PvP guilds', () => {
  const SOC = globalThis.SOC; character(60);
  assert.ok(['raiding', 'pvp'].includes(SOC.myGuilds()[0].style), SOC.myGuilds()[0].style);
});

test('bot raid progress only grows week to week and stays in bounds', () => {
  const SOC = globalThis.SOC; character(60);
  const t0 = new Date('2026-09-29T12:00').getTime();
  for (let g = 0; g < B.GUILDS.length; g++) {
    let prev = null;
    for (let w = 0; w < 30; w++) {
      const pr = SOC.guildProgress(g, t0 + w * 7 * 86400000);
      for (const r of pr) { assert.ok(r.normal >= 0 && r.normal <= r.raid.bosses && r.hard >= 0 && r.hard <= r.normal, JSON.stringify(r)); }
      if (prev) pr.forEach((r, i) => assert.ok(r.normal >= prev[i].normal && r.hard >= prev[i].hard, B.GUILDS[g] + ' week ' + w));
      prev = pr;
    }
  }
});

test('the ranking is ordered and numbered from 1', () => {
  const SOC = globalThis.SOC; character(60);
  W.setNow(new Date('2026-11-11T12:00').getTime());
  const rk = SOC.ranking();
  assert.ok(rk.length > 0);
  rk.forEach((r, i) => assert.strictEqual(r.rank, i + 1));
});

test('a Hard clear of the newest raid gives Crestbearer and the title, once', () => {
  const SOC = globalThis.SOC; const { P } = character(60);
  const n = SOC.newestRaid(), t = D.TITLES.find((x) => x.id === 'crestbearer');
  assert.ok(n && t);
  assert.strictEqual(G.titleUnlocked(t), false);
  P.codex = P.codex || {}; P.codex[n.act] = Object.assign({}, P.codex[n.act], { hard: 1 });
  assert.strictEqual(G.crests(true).length, 1);
  assert.strictEqual(G.crests(true).length, 1);
  assert.strictEqual(G.titleUnlocked(t), true);
});

test('each faction has a Trials guild for level 60, filled only with level-60 players (#566)', () => {
  const SOC = globalThis.SOC; const { S } = character(60);
  for (const f of ['alliance', 'horde']) {
    const t = B.GUILDS.map((_, g) => SOC.guildInfo(g)).filter((x) => x.faction === f && x.style === 'trials');
    assert.strictEqual(t.length, 1, f); assert.strictEqual(t[0].min, 60);
  }
  for (const b of S.bots.slice(0, 40)) { b.level = 60; b.guild = -1; }
  B.fillGuilds(S);
  for (const g of [13, 14]) {
    const m = S.bots.filter((b) => b.guild === g);
    assert.ok(m.length > 0 && m.length <= 10, B.GUILDS[g] + ' ' + m.length);
    assert.ok(m.every((b) => b.level >= 60 && B.factionOf(b) === B.GUILD_FACTION[g]));
  }
  assert.ok(SOC.guildTrials(13, new Date('2026-11-20T12:00').getTime()) > 0);
});

test('level-60 guilds hold only level-60 players; the rest move to an open guild of their side (#568)', () => {
  const SOC = globalThis.SOC; const { S } = character(60);
  const high = B.GUILDS.map((_, g) => g).filter((g) => SOC.guildMin(g) >= 60);
  const low = S.bots.filter((b) => b.level < 60).slice(0, 20);
  low.forEach((b, i) => { b.guild = high.filter((g) => B.GUILD_FACTION[g] === B.factionOf(b))[i % 2]; });
  B.fillGuilds(S);
  for (const b of S.bots) if (high.includes(b.guild)) assert.ok(b.level >= 60, b.name + ' ' + b.level + ' in ' + B.GUILDS[b.guild]);
  for (const b of low) assert.ok(b.guild >= 0 && B.GUILD_FACTION[b.guild] === B.factionOf(b) && SOC.guildMin(b.guild) < 60);
  const rr = Math.random;
  try { for (let i = 0; i < 50; i++) { Math.random = (() => { let k = 0; return () => (k++ ? (i + 0.5) / 50 : 0.1); })(); const nb = B.assignGuild({ id: 5000 + i, level: 10, race: 'human' }); if (nb.guild >= 0) assert.ok(SOC.guildMin(nb.guild) < 60, B.GUILDS[nb.guild]); } }
  finally { Math.random = rr; }
});

test('your own guild keeps its members and gets no strangers from the level-60 fill (#569)', () => {
  const SOC = globalThis.SOC; const { S, P } = character(55);
  const g = B.GUILDS.indexOf('Crimson Vanguard'); P.guild = g;
  const low = S.bots.filter((b) => b.level < 60 && B.factionOf(b) === B.GUILD_FACTION[g]).slice(0, 8);
  low.forEach((b) => { b.guild = g; });
  const before = S.bots.filter((b) => b.guild === g).map((b) => b.id).sort().join();
  for (const b of S.bots.slice(0, 30)) if (!(b.guild >= 0)) b.level = 60;
  B.fillGuilds(S);
  assert.strictEqual(S.bots.filter((b) => b.guild === g).map((b) => b.id).sort().join(), before);
});

test('every move the level-60 fill makes is in the bot\'s history (#569)', () => {
  const SOC = globalThis.SOC; const { S, P } = character(60); P.guild = -1;
  const g = B.GUILDS.indexOf('Dust Eaters'), b = S.bots.find((x) => x.level < 60 && B.factionOf(x) === 'horde');
  b.guild = g; b.hist = [];
  B.fillGuilds(S);
  assert.deepStrictEqual(b.hist.map((e) => e.k), ['left', 'joined']);
  assert.strictEqual(b.hist[1].v, b.guild);
});

test('a Hard clear from before Crestbearer existed is kept once a newer raid opens (#570)', () => {
  const SOC = globalThis.SOC; const { P } = character(60);
  const n = SOC.newestRaid(), t = D.TITLES.find((x) => x.id === 'crestbearer');
  P.crest = undefined; P.codex = P.codex || {}; P.codex[n.act] = Object.assign({}, P.codex[n.act], { hard: 1 });
  assert.strictEqual(G.titleUnlocked(t), true);
  assert.ok(P.crest && P.crest[n.act], 'recorded when read');
  const nr = SOC.newestRaid; SOC.newestRaid = () => ({ act: 'zz_new', name: 'New Raid' });
  try { assert.strictEqual(G.titleUnlocked(t), true); } finally { SOC.newestRaid = nr; }
});
