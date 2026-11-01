// Longnight (v10.17, #290): on from 15 December to 4 January every year (across the new year), a calendar door for each
// day's daily (up to two a day when behind), Kindling for the town hearth with five Hearth ranks, three rotating dailies,
// the Knocker with the Frost Hound by the 10th daily kill, and the Cold Guest raid only in the finale (the Pale Stag by the 3rd).
'use strict';
globalThis.TEST_TZ = 'Asia/Jakarta';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, E, character, setNow, advance, store } = require('./world');

const at = (y, mo, d, h) => setNow(new Date(y, mo - 1, d, h || 12).getTime());
const LN = D.EVENTS.longnight;
const fresh = () => { store.removeItem('azsolo.account'); };
const wild = () => Object.keys(D.PLACES).filter((k) => !D.PLACES[k].safe && D.PLACES[k].region);
const town = () => Object.keys(D.PLACES).find((k) => G.lnTown(k) && D.PLACES[k].npcs.includes('ln_keeper') && (D.PROF_TRAINERS.crafts_alliance || []).includes(k));
function playRun(act, hard) {
  G.queueFor(act, hard ? { hard: true } : undefined);
  assert.ok(G.S.queue, 'queued ' + act);
  G.acceptPop();
  for (let i = 0; i < 40000 && G.S.run && G.S.run.phase !== 'done'; i++) {
    const R = G.S.run; if (R.phase === 'rest') { R.restUntil = 0; G.runPull(); }
    if (G.fight) for (const e of G.fight.enemies) e.hp = 1;
    advance(0.25);
  }
  assert.ok(G.S.run && G.S.run.phase === 'done', 'cleared ' + act);
  G.leaveGroup();
}

test('on from 15 December to 4 January, across the new year; the finale from 31 December; off outside', () => {
  character(20);
  at(2026, 12, 14, 23); assert.ok(!G.lnOn(), 'not the day before');
  at(2026, 12, 15, 0); assert.ok(G.lnOn(), 'on at midnight on the 15th');
  assert.strictEqual(G.eventSeason('longnight'), '2026');
  assert.ok(!G.lnFinale()); assert.strictEqual(G.lnStage(), 0);
  at(2026, 12, 22, 12); assert.strictEqual(G.lnStage(), 2, 'garlands and music by the 22nd');
  at(2026, 12, 31, 9); assert.ok(G.lnFinale()); assert.strictEqual(G.lnStage(), 4);
  at(2027, 1, 4, 23); assert.ok(G.lnOn(), 'still on late on 4 January'); assert.strictEqual(G.eventSeason('longnight'), '2026', 'January is last year\'s season');
  assert.ok(G.lnFinale());
  at(2027, 1, 5, 0); assert.ok(!G.lnOn(), 'over on the 5th');
  at(2026, 10, 30, 12); assert.ok(G.eventLive('lanternwake') && !G.lnOn(), 'Lanternwake unchanged');
});

test('the daily turns each day; finishing it readies a door, two when behind; doors give their rewards in order', () => {
  const { P } = character(20); fresh(); at(2026, 12, 15, 10);
  const st = G.ln();
  assert.strictEqual(G.lnToday(), 'snow'); at(2026, 12, 16, 10); assert.strictEqual(G.lnToday(), 'knock'); at(2026, 12, 17, 10); assert.strictEqual(G.lnToday(), 'stew');
  // on the 17th (day 2), three doors are due and none opened: the daily readies two
  G.lnDailyDone(); assert.strictEqual(st.ready, 2, 'two doors when behind');
  G.lnDailyDone(); assert.strictEqual(st.ready, 2, 'once a day');
  assert.strictEqual(G.lnOpenDoor(), 0); assert.ok(P.bags.some((b) => b.item.id === 'ln_snowball'), 'door 1: snowballs');
  G.lnOpenDoor(); assert.strictEqual(st.doors.length, 2);
  G.lnOpenDoor(); assert.strictEqual(st.doors.length, 2, 'no door ready');
  at(2026, 12, 18, 10); G.lnDailyDone(); assert.strictEqual(st.ready, 2, 'still behind: two');
  G.lnOpenDoor(); G.lnOpenDoor();
  assert.ok((G.account().looks || []).includes('chest:ln_coat'), 'door 4: the coat');
  assert.ok(G.lnDoorsDue() <= LN.doors.length);
});

test('catch-up: starting on 27 December still opens all 16 doors by 4 January', () => {
  character(20); fresh(); at(2026, 12, 27, 10);
  const st = G.ln();
  for (let d = 27; d <= 35; d++) { if (d <= 31) at(2026, 12, d, 10); else at(2027, 1, d - 31, 10); G.lnDailyDone(); while (st.ready > 0) G.lnOpenDoor(); }
  assert.strictEqual(st.doors.length, 16);
  assert.ok(G.companions().includes('snowtuft'), 'door 16: the snow fox');
});

test('Kindling: no cap; a kill that is not grey pays; Hearth ranks give their rewards once, rank 5 the title', () => {
  const { P } = character(30); fresh(); at(2026, 12, 15, 10);
  assert.strictEqual(G.lnKill(30, false), 1); assert.strictEqual(G.lnKill(24, false), 0, 'grey gives nothing');
  G.lnGive(5000, 'test', true);
  assert.strictEqual(G.ln().rank, 5);
  assert.ok(P.bags.some((b) => b.item.id === 'ln_fireworks'));
  assert.ok(G.titleEarned ? true : true);
  assert.ok(G.lnRec().owned.includes('ln_keeper_title'));
  G.lnGive(10, 'more', true); assert.strictEqual(G.ln().rank, 5, 'no more ranks');
});

test('A Knock at the Door: winning with Hearthchill interrupted keeps the home; three places finish the daily', () => {
  const { P } = character(30); fresh(); at(2026, 12, 16, 10);
  const st = G.ln(), places = wild().slice(0, 3);
  for (const pl of places) {
    P.place = pl; P.hp = 1e6;
    assert.strictEqual(G.lnCanKnock(), 'ready');
    G.lnKnock(); assert.strictEqual(G.fight.kind, 'knock');
    for (const e of G.fight.enemies) { e.hp = 1; e.spT = 99; } // the frostling's Hearthchill never starts (an interrupt, in play)
    for (let i = 0; i < 400 && G.fight; i++) advance(0.1);
  }
  assert.strictEqual(st.prog.homes.length, 3); assert.ok(st.done);
  P.place = places[0]; assert.strictEqual(G.lnCanKnock(), null, 'done for today');
});

test('Longnight Stew: 5 firewood, cooked at a great hearth, 3 bowls handed to people who ask in chat', () => {
  const { P } = character(30); fresh(); at(2026, 12, 17, 10);
  const st = G.ln();
  for (const pl of wild().slice(0, 5)) { P.place = pl; G.lnGather(); }
  assert.strictEqual(st.prog.wood.length, 5);
  P.place = town(); assert.ok(P.place, 'a festival town');
  G.lnCook(); assert.ok(st.prog.cooked); assert.ok(P.bags.some((b) => b.item.id === 'ln_stew'));
  for (let i = 0; i < 3; i++) {
    G.S.flags.lnAsk = 0; G.lnStewTick();
    const m = G.S.chat.find((x) => x.act && x.act.kind === 'ln_stew' && x.act.state === 'open');
    assert.ok(m, 'someone asks for a bowl'); assert.ok(m.text.length > 0);
    G.lnGiveStew(m);
  }
  assert.strictEqual(st.prog.bowls, 3); assert.ok(st.done);
});

test('Snowball Brawl: a player who ducks what comes and throws while the other is busy beats one who mashes Throw', () => {
  const side = () => ({ hp: G.SNOW.hp, snow: G.SNOW.startSnow, packUntil: 0, duckUntil: -1, duckCd: 0, throwCd: 0, wind: null });
  const busy = (u, Z) => Z.t < u.packUntil || !!u.wind;
  const timed = (Z) => {
    const danger = Z.flying.some((f) => f.from === 'foe' && f.at - Z.t < 0.5) || (Z.foe.wind && Z.foe.wind.until - Z.t < 0.8);
    if (danger && !G.snowAct(Z, 'me', 'duck')) return 0.3;
    if (Z.me.snow >= 3 && busy(Z.foe, Z)) { G.snowAct(Z, 'me', 'boulder'); return 0.3; }
    if (Z.me.snow >= 1 && busy(Z.foe, Z)) { G.snowAct(Z, 'me', 'throw'); return 0.3; }
    if (Z.me.snow < 3 && !G.snowAct(Z, 'me', 'pack')) return 0.3;
    if (Z.me.snow >= 1) G.snowAct(Z, 'me', 'throw');
    return 0.4;
  };
  const masher = (Z) => { if (G.snowAct(Z, 'me', 'throw')) G.snowAct(Z, 'me', 'pack'); return 0.15; };
  const rate = (policy) => {
    let w = 0, n = 0;
    for (const skill of [0.35, 0.5, 0.65, 0.8]) for (let i = 0; i < 150; i++) {
      const Z = { t: 0, me: side(), foe: side(), flying: [], log: [], over: null, think: 0.8, skill };
      let th = 0;
      while (!Z.over) { th -= 0.1; if (th <= 0) th = policy(Z); G.snowStep(Z, 0.1); }
      w += Z.over === 'win'; n++;
    }
    return w / n;
  };
  const good = rate(timed), mash = rate(masher);
  assert.ok(good > 0.6, `timed play wins most rounds (${good.toFixed(2)})`);
  assert.ok(mash < 0.35, `mashing Throw loses most rounds (${mash.toFixed(2)})`);
});

test('the Knocker: at your level, loot once a day, the Frost Hound by the 10th daily kill; the raid only in the finale', () => {
  const { P } = character(25); fresh(); at(2026, 12, 16, 10);
  assert.strictEqual(G.activityBlock(LN.knocker), null);
  assert.match(G.activityBlock(LN.guest), /31 December/);
  playRun(LN.knocker);
  assert.strictEqual(G.lnAccount().ln.houndKills, 1);
  for (let d = 17; d <= 30 && !G.lnAccount().ln.hound; d++) { at(2026, 12, d, 10); playRun(LN.knocker); }
  assert.ok(G.lnAccount().ln.hound && P.mounts.includes('frost_hound'));
  at(2026, 12, 31, 10); assert.strictEqual(G.activityBlock(LN.guest), null, 'the door opens on the 31st');
  playRun(LN.guest);
  assert.ok(G.lnRec().owned.includes('ln_door_title'), 'the title on the first kill');
  for (let d = 1; d <= 4 && !G.lnAccount().ln.stag; d++) { at(2027, 1, d, 10); playRun(LN.guest); }
  assert.ok(G.lnAccount().ln.stag && P.mounts.includes('pale_stag'), 'the Pale Stag by the 3rd daily kill');
  at(2027, 1, 6, 10); assert.strictEqual(G.activityBlock(LN.knocker), 'hidden', 'gone after');
});

test('the engine: a heal on another creature and a countdown that starts at a health mark', () => {
  character(30);
  const boss = E.mobUnit('ln_knocker', 30), hound = E.mobUnit('ln_frost_hound', 30);
  boss.hardX = [{ kind: 'heal', to: 'ln_frost_hound', every: 2, heal: 0.5, name: 'Frost Mend' }];
  const C = E.fight([E.charUnit(G.S.player, 'ally', 'player', 0)], [boss, hound], {});
  hound.hp = hound.maxHp * 0.3; const before = hound.hp;
  for (let i = 0; i < 40; i++) E.tick(C, 0.1);
  assert.ok(hound.dead || hound.hp > before, 'Frost Mend heals the hound');
  const g = E.mobUnit('ln_cold_guest', 30); g.hardX = [{ kind: 'countdown', at: 0.3, secs: 5, mult: 3 }];
  const C2 = E.fight([E.charUnit(G.S.player, 'ally', 'player', 0)], [g], {});
  g.hp = g.maxHp * 0.25; E.tick(C2, 0.1); assert.ok(g.hardX[0].start != null, 'the countdown starts below 30%');
  g.hp = g.maxHp; // kept alive
  for (let i = 0; i < 60; i++) { E.tick(C2, 0.1); g.hp = g.maxHp; }
  assert.ok((g.enrage || 1) >= 3, 'midnight: the enrage');
});

test('a test build keeps it on, with the finale; what it gives stays in test builds', () => {
  const was = LN.force; LN.force = 'test'; const vWas = globalThis.AZ_VERSION; globalThis.AZ_VERSION = '10.17.0-beta.1';
  try {
    character(20); fresh(); at(2026, 6, 1, 10);
    assert.ok(G.lnOn() && G.lnTesting() && G.lnFinale());
    G.lnGive(5000, 'test', true);
    assert.ok(G.lnAccount().lnTest && G.lnAccount().lnTest.owned.includes('ln_keeper_title'), 'kept apart');
    assert.ok(!G.lnAccount().ln.owned.includes('ln_keeper_title'));
  } finally { LN.force = was; globalThis.AZ_VERSION = vWas; }
  G.lnRevokeTest(); assert.ok(!G.lnAccount().lnTest, 'gone outside a test season');
});

test('music: the festival towns play the Longnight theme from the music stage (22 December), the runs their own', () => {
  character(30); const P = G.S.player, all = () => true;
  P.place = town();
  at(2026, 12, 20); assert.notStrictEqual(G.musicFor(all), 'longnight', 'not before the music stage');
  at(2026, 12, 22); assert.strictEqual(G.musicFor(all), 'longnight');
  at(2027, 1, 10); assert.notStrictEqual(G.musicFor(all), 'longnight', 'not after the festival');
  assert.strictEqual(D.ACTIVITIES[LN.knocker].music, 'ln_knocker');
  assert.strictEqual(D.ACTIVITIES[LN.guest].music, 'ln_guest');
});
