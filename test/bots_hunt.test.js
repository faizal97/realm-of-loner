// Group-finder bots, runs and the level-60 guilds (#590): the gear floor for a seated leader, gear that matches the
// skill a bot plays with, no party chat from a group you left; then sweeping checks of bot gear, floors, par and guilds.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const W = require('./world');
const { G, D, E, B } = W;

const raidAct = 'molten_core';
const low = (c) => Object.entries(c.equip).filter(([, it]) => it && it.q < 3 && !it.effect).map(([s, it]) => `${s}:q${it.q}`);
// the affixes on a bot's generated pieces (named looks and effect items keep their own names)
const affixes = (c) => new Set(Object.values(c.equip).filter((it) => it && !it.effect && /^g\d+$/.test(it.id)).map((it) => (/(of the \w+)$/.exec(it.name) || [])[1]).filter(Boolean));
// a careless (skill 0.3) bot of the player's side at level 58, the lowest a chat group may be led from for a level-60
// raid (minLvl - 2, #478; makeLfg's own rule). Below the finder's 59-63 band, so only seatLead seats it, never recruit.
// Left alone it wears Uncommon gear and Common legs, hands and waist
function carelessLead(S) {
  const b = S.bots.find((x) => B.factionOf(x) === 'alliance' && x.id > 0);
  b.level = 58; b.skill = 0.3; b.cls = 'hunter';
  return b;
}
function popRaid(hard) {
  const { S, P } = W.character(60, 'warrior'); P.role = 'dps';
  if (hard) P.codex = { [raidAct]: { clears: 1, flawless: 0, speed: 0, best: null } };
  G.queueFor(raidAct, hard ? { hard: true } : undefined);
  assert.ok(S.queue, 'queued');
  S.queue.popAt = 0; W.advance(1); if (S.queue) G.acceptPop();
  assert.ok(S.run, 'in the run');
  return { S, P };
}

// ============================================================ the #590 fixes

test('a chat group\'s leader seated in a raid wears the raid\'s gear floor (Rare)', () => {
  const { S, P } = W.character(60, 'warrior'); P.role = 'dps';
  const lead = carelessLead(S);
  assert.ok(G.joinChatGroup(raidAct, 'dps', { leader: lead.id }), 'joined');
  const m = S.group.members.find((x) => x.bot && x.bot.id === lead.id);
  assert.ok(m, 'the leader is in the group');
  assert.deepStrictEqual(low(m), [], 'every piece Rare or better, as the rest of the raid');
  G.leaveGroup();
});

test('a Help Wanted raid\'s poster wears the raid\'s gear floor (Rare)', () => {
  const { S, P } = W.character(60, 'warrior'); P.role = 'dps';
  const lead = carelessLead(S);
  S.helpWanted = [{ id: 'hw_hunt', act: raidAct, role: 'dps', startIdx: 0, firstTimers: false, poster: lead.id, posterName: lead.name, expires: W.now() + 3600000 }];
  G.joinHelpWanted('hw_hunt');
  assert.ok(S.run, 'in the run');
  const m = S.group.members.find((x) => x.bot && x.bot.id === lead.id);
  assert.ok(m, 'the poster is in the group');
  assert.deepStrictEqual(low(m), [], 'every piece Rare or better, as the rest of the raid');
  G.leaveGroup();
});

// ============================================================ sweeps and edge cases

test('every bot (all classes x their roles x levels 10-60 x skill x gear floor) fills every slot it can use, with gear it can wear, at the floor, with finite stats, the same every time', () => {
  W.character(60);
  const errs = []; let id = 7000;
  for (const cls of Object.keys(D.CLASSES)) {
    const C = D.CLASSES[cls];
    for (const role of C.roles || [C.role]) for (let level = 10; level <= 60; level++) for (const skill of [0.2, 0.6, 0.9]) for (const gearFloor of [0, 3, 4]) {
      const b = { id: id++, name: 'Sweep', cls, role, level, skill, gearFloor }, c = G.botChar(b), tag = `${cls}/${role}/L${level}/s${skill}/f${gearFloor}`;
      for (const s of D.GEAR_SLOTS) {
        const need = !!(s !== 'ranged' || C.ranged || C.instrument), it = c.equip[s];
        if (need !== !!it) { errs.push(`${tag}: ${s} ${it ? 'extra' : 'missing'}`); continue; }
        if (!it) continue;
        if (it.slot !== s) errs.push(`${tag}: ${s} holds a ${it.slot}`);
        if (!G.canUseItem(it, cls)) errs.push(`${tag}: can't use ${s} ${it.name}`);
        if (it.atype && it.atype !== C.armorType) errs.push(`${tag}: ${s} is ${it.atype}`);
        if (it.q < gearFloor && !it.effect) errs.push(`${tag}: ${s} q${it.q} under the floor`);
        if (it.lvl > level) errs.push(`${tag}: ${s} level ${it.lvl}`);
      }
      for (const s of Object.keys(c.equip)) if (!D.GEAR_SLOTS.includes(s)) errs.push(`${tag}: unknown slot ${s}`);
      const st = E.statsFor(c); for (const k in st) if (typeof st[k] === 'number' && !Number.isFinite(st[k])) errs.push(`${tag}: ${k} ${st[k]}`);
      const again = G.botChar(Object.assign({}, b));
      if (JSON.stringify(again.equip) !== JSON.stringify(c.equip)) errs.push(`${tag}: different gear on a second call`);
      if (errs.length > 20) break;
    }
  }
  assert.deepStrictEqual(errs, []);
});

test('the gear floor: every group raid takes Rare (Hard: Epic); dungeons, festival runs, world bosses and battlegrounds take none', () => {
  for (const act of Object.keys(D.ACTIVITIES)) {
    const A = D.ACTIVITIES[act], Dg = A.dungeon && D.DUNGEONS[A.dungeon], raid = !!(Dg && Dg.raid);
    assert.strictEqual(G.gearFloor(act, false), raid ? 3 : 0, act);
    assert.strictEqual(G.gearFloor(act, true), raid ? 4 : 0, act + ' hard');
  }
});

test('a raid from the queue: every bot in Rare or better (Normal) and Epic or better (Hard)', () => {
  for (const hard of [false, true]) {
    const { S } = popRaid(hard);
    for (const m of S.group.members) if (m.bot && !m.legend) assert.ok(Object.values(m.equip).every((it) => !it || it.q >= (hard ? 4 : 3) || it.effect), `${hard ? 'Hard' : 'Normal'} ${m.name}`);
    G.leaveGroup();
  }
});

test('a Hard raid refills a leaver with a player in Epic gear', () => {
  const { S } = popRaid(true);
  const m = S.group.members.find((x) => x.bot && !x.legend && x.role === 'dps');
  m.gone = true; m.replacing = W.now();
  S.run.phase = 'rest'; S.run.restUntil = W.now() + 60000;
  W.advance(1);
  const nb = S.group.members.find((x) => x.bot && !x.gone && !x.legend && x.bot.id !== m.bot.id && x.role === 'dps' && !S.group.members.includes(m));
  assert.ok(!S.group.members.includes(m), 'replaced');
  assert.ok(nb, 'a new damage dealer');
  const fresh = S.group.members[S.group.members.findIndex((x) => x === nb)];
  assert.ok(Object.values(fresh.equip).every((it) => !it || it.q >= 4 || it.effect), 'Epic or better');
  G.leaveGroup();
});

test('leaving mid-run clears the run, the group and the sync level; the group finder works again at once', () => {
  const { S, P } = popRaid(false);
  G.leaveGroup();
  assert.strictEqual(S.run, null); assert.strictEqual(S.group, null); assert.strictEqual(P.syncLevel, undefined);
  S.flags.deserterUntil = 0;
  G.queueFor('scholomance');
  assert.ok(S.queue && S.queue.act === 'scholomance');
});

test('every dungeon and raid has a par time (and a Trial par), finite and above zero', () => {
  W.character(60);
  for (const act of Object.keys(D.ACTIVITIES)) {
    const A = D.ACTIVITIES[act]; if (!A.dungeon) continue;
    const Dg = D.DUNGEONS[A.dungeon];
    assert.ok(Number.isFinite(G.par(Dg)) && G.par(Dg) > 0, act);
    assert.ok(Number.isFinite(globalThis.TR ? globalThis.TR.par(Dg) : (Dg.trialPar || Dg.par)) && (Dg.trialPar || Dg.par) > 0, act + ' trial');
  }
});

test('a month of the server: no bot below 60 in a level-60 guild, and your own guild is not touched by the level-60 fill', () => {
  const SOC = globalThis.SOC; const { S, P } = W.character(30);
  const mine = B.GUILDS.map((_, g) => g).find((g) => SOC.guildMin(g) < 60 && B.GUILD_FACTION[g] === 'alliance');
  P.guild = mine;
  for (let d = 0; d < 30; d++) {
    B.advance(S, 86400000); S.lastSim = (S.lastSim || W.now()) + 86400000;
    const homes = new Set([P.guild]);
    const bad = S.bots.filter((b) => b.guild >= 0 && !homes.has(b.guild) && SOC.guildMin(b.guild) >= 60 && b.level < 60).map((b) => `${b.name} ${b.level} in ${B.GUILDS[b.guild]}`);
    assert.deepStrictEqual(bad, [], 'day ' + d);
    assert.ok(S.bots.every((b) => b.guild == null || b.guild === -1 || (b.guild >= 0 && b.guild < B.GUILDS.length)), 'every guild index is a real guild (day ' + d + ')');
  }
});
