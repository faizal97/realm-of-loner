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
      if (r && r.then) { r.then(); if (S.pending.some((p) => p.bot === b.id && p.at > r.at)) backs++; } // the answer back is chosen once the reply posts
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

test('a thread reads the line without the voice, and grats to someone else is not a ding (#73)', () => {
  assert.strictEqual(B.threadKind('grats on the ding!'), 'up');
  assert.strictEqual(B.threadKind('ok finally 30!'), 'ding');
  assert.strictEqual(B.threadKind('where is Hogger? heh'), 'q');
});

test('a guild reply is dropped once you leave the guild, and a reply never comes from a stand-in (#73)', () => {
  const { S, P } = W.character(30);
  G.joinGuild(SOC.myGuilds().find((x) => x.min <= 30).g);
  const mates = S.bots.filter((b) => b.guild === P.guild);
  const on = B.isOnline; B.isOnline = () => true;
  try {
    const said = () => S.chat.filter((m) => m.ch === 'guild' && m.fromId != null).length;
    let queued = 0;
    for (let i = 0; i < 30 && !queued; i++) { S.pending = []; S.chatHeard = {}; S.botSaid = {}; B.thread(S, mates[i % mates.length], 'guild', 'that last run was fun', W.now(), new Date(W.now())); queued = S.pending.length; }
    assert.ok(queued, 'a reply was queued');
    const keep = S.pending.slice();
    SOC.leaveGuild(); const n0 = said(); W.setNow(W.now() + 20000); B.chatTick(S, W.now());
    assert.strictEqual(said(), n0, 'not posted after leaving');
    S.pending = keep.map((p) => Object.assign({}, p, { unless: undefined })); const gone = S.pending[0].bot;
    S.bots = S.bots.filter((b) => b.id !== gone); const n1 = S.chat.length; B.chatTick(S, W.now());
    assert.ok(!S.chat.slice(n1).some((m) => m.text === keep[0].text), 'nobody else says it');
  } finally { B.isOnline = on; }
});

test('a voice never ends a line twice or says its word twice, and a pasted ad keeps its words (#73)', () => {
  const { S } = W.character(30);
  for (const b of S.bots.slice(0, 120)) for (const line of ['brania hehe', 'oh beliel <3', 'yes!!', 'the group finder is so good honestly', 'gl everyone']) {
    const t = B.voiced(b, line), v = B.voice(b);
    if (line !== 'gl everyone') for (const e of [v.suf, v.suf2]) assert.ok(!e || !t.endsWith(e), `no ending after "${line}": ${t}`);
    const w = t.toLowerCase().match(/[a-z]+/g) || []; for (const x of ['ngl', 'tbh', 'honestly']) assert.ok(w.filter((y) => y === x).length <= 1, t);
  }
  const ad = 'Hello friend! Cheapest gold on the server, 1000g for $10, visit our site!';
  for (const b of S.bots.slice(0, 60)) { b.toxic = 0.9; b.skill = 0.1; S.chatHeard = {}; S.botSaid = {}; const r = B.freshLine(S, b, 'whisper', [['x0', () => ad]], {}); if (r) assert.strictEqual(r.text, ad); }
});

test("a story line says 'the' mid-sentence and 'with the guild' only for the guild they're in (#73)", () => {
  const { S } = W.character(60);
  const k = Object.keys(D.ACTIVITIES).find((x) => /^The /.test(D.ACTIVITIES[x].name) && D.ACTIVITIES[x].minLvl <= 30);
  const b = S.bots[0]; b.level = D.ACTIVITIES[k].minLvl + 2; b.guild = 2;
  b.hist = [{ t: W.now() - 3600000, k: 'clear', v: k, w: 1 }];
  const out = B.HIST_LINES.map((f) => f({ me: b, rl: 60 })).filter(Boolean);
  assert.ok(out.some((l) => /cleared the /.test(l)), out.join(' | '));
  assert.ok(!out.some((l) => /with the guild/.test(l)), 'cleared with another guild');
});

test('materials and unlevelled crafts have a level for who may ask for them (#73)', () => {
  W.character(30);
  const r = Object.values(D.RECIPES).find((x) => !D.ITEMS[x.makes].lvl && x.sk[0] >= 100);
  assert.strictEqual(SOC.itemLvl(r.makes), Math.round(r.sk[0] / 5));
  const m = Object.keys(r.mats)[0]; assert.ok(SOC.itemLvl(m) >= 1 && SOC.itemLvl(m) <= SOC.itemLvl(r.makes));
});

test('a bot whose friends list came out empty gets friends once there are people (#73)', () => {
  const { S } = W.character(30);
  const b = S.bots[0]; b.pals = []; b.rival = null;
  assert.ok(B.circle(S, b).pals.length >= 1);
});

test('no two reply templates read the same, even with a voice ending (#73)', () => {
  W.character(30);
  const key = (t) => t.toLowerCase().replace(/[.!?]+$/, '').trim(), seen = new Map();
  const ends = ['', ' lol', ' haha', ' :)', ' xD', ' tbh', ' fr', ' ngl', ' :D', ' lmao', ' heh', ' ^^', ' o/'];
  for (const [set, arr] of Object.entries(B.THREAD)) arr.forEach((f, i) => {
    const base = f('Zed'); for (const e of ends) { const k = key(base + e); if (e && k === key(base)) continue;
      if (seen.has(k) && seen.get(k) !== set + i) assert.fail(`${set}${i} "${base + e}" reads as ${seen.get(k)}`); if (!e) seen.set(k, set + i); }
  });
  for (const [set, arr] of Object.entries(B.THREAD)) arr.forEach((f, i) => { for (const e of ends.slice(1)) { const k = key(f('Zed') + e); if (seen.has(k) && seen.get(k) !== set + i) assert.fail(`${set}${i} + "${e}" reads as ${seen.get(k)}`); } });
});

test('an answer in General or LFG never comes from the bot that asked (#73)', () => {
  const { S } = W.character(30);
  const my = B.factionOf(S.bots.find((b) => B.factionOf(b) === ((D.RACES[S.player.race] || {}).faction || 'alliance')));
  S.bots = S.bots.filter((b) => B.factionOf(b) === my).slice(0, 2);
  const on = B.isOnline; B.isOnline = () => true;
  try {
    const self = []; let answers = 0;
    for (let s = 0; s < 12 * 3600; s += 1) {
      const t = W.now() + s * 1000, n0 = S.chat.length, p0 = new Set(S.pending || []);
      B.chatTick(S, t);
      const said = S.chat.slice(n0).filter((m) => m.ch === 'general' || m.ch === 'lfg');
      for (const p of S.pending || []) if (!p0.has(p) && !p.strict && !p.then && (p.ch === 'general' || p.ch === 'lfg')) {
        const q = said.find((m) => m.ch === p.ch); if (!q) continue; answers++;
        if (q.fromId === p.bot) self.push(q.text + ' -> ' + p.text);
      }
    }
    assert.ok(answers >= 3, `${answers} answers`);
    assert.deepStrictEqual(self, []);
  } finally { B.isOnline = on; }
});

test('a voice is a habit, not every line: no bot starts or ends most lines with the same word (#73)', () => {
  const { S } = W.character(30);
  const worst = [];
  for (const b of S.bots.slice(0, 150)) {
    const v = B.voice(b), n = 400, cnt = {};
    for (let i = 0; i < n; i++) { const t = B.voiced(b, 'that run was fun');
      for (const w of [v.pre, v.pre2]) if (w && t.startsWith(w)) { cnt['p' + w] = (cnt['p' + w] || 0) + 1; break; }
      for (const w of [v.suf, v.suf2]) if (w && t.endsWith(w)) { cnt['s' + w] = (cnt['s' + w] || 0) + 1; break; } }
    const top = Math.max(0, ...Object.values(cnt)); if (top / n > 0.45) worst.push(`${b.name} ${Math.round(top / n * 100)}%`);
  }
  assert.deepStrictEqual(worst, []);
});

test('an answer never echoes the line it answers word for word (#73)', () => {
  const { S } = W.character(30);
  const cry = ['ok ok', 'blood and dust!', 'FOR THE KRUGAR', 'as you say'];
  for (const said of ['blood and dust!', 'ok ok lol', 'for the krugar']) for (let i = 0; i < 40; i++) {
    S.chatHeard = {};
    const a = B.pickHeard(S, 'an9.', cry, said);
    assert.notStrictEqual(a.toLowerCase().replace(/!$/, ''), said.toLowerCase().replace(/ lol$/, '').replace(/!$/, ''), `${said} -> ${a}`);
  }
});

test('an answer with every reply heard this hour stays silent instead of repeating one (#73)', () => {
  const { S } = W.character(30);
  const cry = ['ok ok', 'blood and dust!', 'FOR THE KRUGAR', 'as you say'];
  S.chatHeard = {}; const got = [];
  for (let i = 0; i < 6; i++) got.push(B.pickHeard(S, 'an9.', cry, 'tbh for the krugar'));
  assert.deepStrictEqual(got.filter(Boolean).length, new Set(got.filter(Boolean)).size, got.join(' | '));
  assert.ok(got.includes(null), got.join(' | '));
});
