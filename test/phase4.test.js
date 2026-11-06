// Living server, phase 4 (#73): each bot's own voice, threads between bots who know each other, a bot's own story in
// chat, and gear and group posts that fit the speaker's own level.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const W = require('./world');
const { G, D, B } = W; const SOC = globalThis.SOC;

test('each bot has its own voice, stable across calls and different between bots (#73)', () => {
  const { S } = W.character(30);
  const b = S.bots[0];
  assert.deepStrictEqual(B.voice(b), B.voice(b), 'drawn from the id, no dice');
  const kinds = new Set(S.bots.slice(0, 60).map((x) => { const v = B.voice(x); return v.pre + '|' + v.suf + '|' + v.short; }));
  assert.ok(kinds.size >= 12, `60 bots, ${kinds.size} voices`);
  assert.strictEqual(B.voice({ id: 3, legend: 'x', name: 'L' }), null, 'a Legend speaks in their own words');
  const ad = 'Hello friend! Cheapest gold on the server, 1000g for $10, visit our site!';
  for (let i = 0; i < 50; i++) assert.strictEqual(B.voiced(S.bots[i], ad), ad, "a gold seller's ad is pasted");
  for (let i = 0; i < 200; i++) assert.ok(!/\blol (lol|haha|lmao|xD|tbh|fr|ngl|heh)$/i.test(B.voiced(S.bots[i % 60], 'that was fun lol')), 'never a second ending');
});

test('a guild line gets a reply from a guildmate that names the speaker, and now and then one back (#73)', () => {
  const { S, P } = W.character(30);
  const gi = SOC.myGuilds().find((x) => x.min <= 30).g; G.joinGuild(gi);
  const mates = S.bots.filter((b) => b.guild === P.guild);
  assert.ok(mates.length >= 3);
  const on = B.isOnline; B.isOnline = () => true;
  try {
    let replies = 0, backs = 0;
    for (let i = 0; i < 40; i++) {
      S.pending = []; S.chatHeard = {}; S.botSaid = {};
      const b = mates[i % mates.length];
      B.thread(S, b, 'guild', 'grats on the ding!', W.now(), new Date(W.now()));
      const r = S.pending.find((p) => p.bot !== b.id);
      if (r) { replies++; assert.ok(r.ch === 'guild' && mates.some((m) => m.id === r.bot), 'from a guildmate, in Guild'); assert.ok(r.text.toLowerCase().includes(b.name.toLowerCase()), 'names the speaker: ' + r.text); }
      if (r && S.pending.some((p) => p.bot === b.id && p.at > r.at)) backs++;
    }
    assert.ok(replies >= 12, `${replies} of 40 got a reply`);
    assert.ok(backs >= 1, `${backs} answered back`);
  } finally { B.isOnline = on; }
});

test("a bot's story line says only what happened to it lately, at its own level (#73)", () => {
  const { S } = W.character(60);
  const b = S.bots.find((x) => x.level >= 20); const L = b.level;
  const said = (hist) => { b.hist = hist; return B.HIST_LINES.map((f) => f({ me: b, rl: 60 })).filter(Boolean); };
  assert.ok(said([{ t: W.now() - 3600000, k: 'lvl', v: L }]).includes(`ding ${L}`), 'a level reached an hour ago');
  assert.deepStrictEqual(said([{ t: W.now() - 5 * 86400000, k: 'lvl', v: L }]), [], 'not five days on');
  assert.deepStrictEqual(said([{ t: W.now() - 3600000, k: 'lvl', v: L - 1 }]), [], 'not a level it has since passed');
  b.hist = [{ t: W.now() - 5 * 86400000, k: 'lvl', v: L }]; assert.strictEqual(B.hasStory(b), false, 'nothing recent to tell');
});

test('a bot offers, orders or asks about gear only at its own level (#73)', () => {
  const { S, P } = W.character(37);
  for (const b of S.bots) b.level = 5;
  const bad = [];
  for (let s = 0; s < 6 * 3600; s += 10) {
    W.setNow(W.now() + 10000); const n0 = S.chat.length; SOC.tick();
    for (const m of S.chat.slice(n0)) {
      const a = m.act; if (!a || !['wts', 'swap', 'craft_order', 'ask_gear'].includes(a.kind)) continue;
      const b = S.bots.find((x) => x.id === (a.bot != null ? a.bot : m.fromId));
      if (b && b.level + 3 < ((a.itemData && a.itemData.lvl) || P.level)) bad.push(`${a.kind} from level ${b.level}: ${m.text}`);
    }
  }
  assert.deepStrictEqual(bad, []);
});
