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
