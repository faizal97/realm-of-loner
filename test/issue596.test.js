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

// ---- the chat fixes of #596 that had no test (0c6d1f8, dcb52fb, a4343ea, f04007b)
const fs = require('fs'), path = require('path');
const srcOf = (f) => fs.readFileSync(path.join(__dirname, '../src', f), 'utf8');
const chatLines = (S, secs, step) => { const out = []; for (let i = 0; i < secs / step; i++) { W.setNow(W.now() + step * 1000); B.chatTick(S, W.now()); for (const m of S.chat) { if (m.t596) continue; m.t596 = 1; out.push(m); } } return out; };

test('a town with no monsters hears no monster lines: no stand-in "Kobold", no "null" (#596)', () => {
  const { S, P } = character(8, 'warrior', 'human');
  const kob = (r) => Object.values(D.PLACES).some((p) => (p.region || 'elwynn') === r && (p.mobs || []).some((m) => /kobold/i.test(D.MOBS[m[0]].name)));
  const town = Object.keys(D.PLACES).find((k) => { const p = D.PLACES[k]; return p.inn && p.lvl && p.lvl[0] <= 10 && !(p.mobs || []).length && !kob(p.region || 'elwynn') && B.factionOf(S.player) === ((D.RACES.human || {}).faction || 'alliance') && !G.enemyTown(k); });
  assert.ok(town, 'a mob-free town in a region with no kobolds');
  P.place = town;
  const lines = chatLines(S, 6 * 3600, 5).filter((m) => ['general', 'say', 'guild'].includes(m.ch));
  assert.ok(lines.length > 50, `${lines.length} lines heard`);
  const bad = lines.filter((m) => /\bKobolds?\b|\bnull\b|\bundefined\b/.test(m.text)).map((m) => m.text);
  assert.deepStrictEqual(bad.slice(0, 5), [], `${bad.length} lines`);
});

test('chat never asks the two questions nobody could answer or tap (#596)', () => {
  const { S } = character(30, 'warrior', 'human');
  const lines = chatLines(S, 12 * 3600, 5);
  const bad = lines.filter((m) => /anyone know where .+ is$|drop anything good for/i.test(m.text)).map((m) => m.text);
  assert.deepStrictEqual(bad, []);
});

test('the only guildmate online never talks to a crowd or reacts to news nobody had (#596)', () => {
  const { S, P } = character(40, 'warrior', 'human'); const SOC = globalThis.SOC;
  P.guild = SOC.myGuilds().find((x) => P.level >= x.min).g; P.guildRep = 95;
  const mate = S.bots.find((b) => b.guild === P.guild); assert.ok(mate);
  const io = B.isOnline; B.isOnline = (b, d) => (b.guild === P.guild ? b === mate : io(b, d));
  let guild;
  try { guild = chatLines(S, 48 * 3600, 10).filter((m) => m.ch === 'guild' && m.fromId === mate.id); } finally { B.isOnline = io; }
  assert.ok(guild.length >= 5, `${guild.length} guild lines`);
  const crowd = /\b(everyone|everybody|you lot|you all|whoever|grats|gz|what did i miss|who else|evening all)\b/i;
  const bad = guild.filter((m) => crowd.test(m.text)).map((m) => m.text);
  assert.deepStrictEqual(bad, []);
});

test('"where is" questions never name a place that is its own zone, like a capital (#596)', () => {
  const src = srcOf('social.js'), at = src.indexOf('  function whereQuestion(');
  const fn = src.slice(at, src.indexOf('\n  }\n', at) + 4);
  character(30, 'warrior', 'human');
  let seen = null; const pick = (a) => { seen = a; return a[0]; };
  const whereQuestion = new Function('G', 'D', 'pick', 'crand', fn + '; return whereQuestion;')(G, D, pick, Math.random);
  for (const lvl of [10, 30, 60]) {
    G.S.player.level = lvl; seen = null; whereQuestion(null);
    assert.ok(seen && seen.length, `places at ${lvl}`);
    const self = seen.filter((k) => D.PLACES[k].zone.toLowerCase() === D.PLACES[k].name.toLowerCase());
    assert.deepStrictEqual(self, [], `level ${lvl}`);
  }
});

test('a chat sale costs 1.0–1.2x the auction price, so buying and relisting is never a sure profit (#596)', () => {
  const src = srcOf('social.js'), at = src.indexOf('  const chatPrice = ');
  assert.ok(at >= 0, 'chat sales have their own price rule');
  const line = src.slice(at, src.indexOf('\n', at));
  character(40, 'warrior', 'human');
  for (const q of [2, 3]) for (const [lo, hi] of [[1, 1], [1.2, 1.2]]) {
    const it = G.genGear('chest', 40, q);
    const chatPrice = new Function('G', 'rnd', line + '; return chatPrice;')(G, () => lo);
    const p = chatPrice(it), ah = G.ahValue(it);
    assert.ok(p >= Math.round(ah * lo) - 1 && p <= Math.round(ah * hi) + 1, `q${q}: ${p} for ${ah}`);
    assert.ok(p * 0.8 > ah * 0.76, 'even after a good haggle (0.8x) it costs more than a sure relist pays (0.76x)');
  }
});

test('auction sellers and buyers are bots of the item\'s level, never a level 1 with level 60 gear (#596)', () => {
  const { S } = character(60, 'warrior', 'human');
  const L = G.ahListings(); assert.ok(L.length > 10);
  const bad = [];
  for (const l of L) {
    const need = l.item.lvl || 1, b = S.bots.find((x) => x.name === l.seller);
    if (b && b.level < need) bad.push(`${l.seller} (${b.level}) sells ${l.item.name} (${need})`);
  }
  assert.deepStrictEqual(bad.slice(0, 5), [], `${bad.length} of ${L.length}`);
});
