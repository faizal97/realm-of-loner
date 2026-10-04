// Checks tools/announce_discord.js's split (Faizal: "do it scalable"): notes of any length post as consecutive parts,
// each under Discord's limits, split at a section heading (or, inside a section too long for one embed, between lines),
// with the role pinged only in part 1, "(i/N)" on every part and the links only on the last. Nothing is posted: each case
// is a --dry run on a made-up notes file.   node tools/announce_discord.test.js
'use strict';
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const TOOL = path.join(__dirname, 'announce_discord.js');
const real = fs.readFileSync(path.join(__dirname, '..', 'notes', 'v10.10.0.md'), 'utf8').trim();
let bad = 0, n = 0; const ok = (c, m) => { n++; if (!c) { bad++; console.log('FAIL ' + m); } };
const dry = (text) => {
  const f = path.join(os.tmpdir(), `announce-test-${process.pid}-${n}.md`); fs.writeFileSync(f, text);
  const out = execFileSync('node', [TOOL, 'v10.10.0', '--dry', '--notes', f], { encoding: 'utf8' }); fs.unlinkSync(f);
  return out.split(/^--- part /m).slice(1).map((blk) => JSON.parse(blk.slice(blk.indexOf('\n') + 1)));
};
const body = (d) => d.replace(/^\*\(continued\)\*\n/, '').replace(/\n\n\*\(continued below\)\*$/, '').replace(/\n\n\[Play on itch\.io\][^\n]*$/, '');
const contentLines = (t) => t.split('\n').map((l) => l.trim()).filter(Boolean);
function check(name, text, want) {
  const parts = dry(text), N = parts.length;
  console.log(`${name}: ${text.length} chars -> ${N} parts (${parts.map((p) => p.embeds[0].description.length).join(', ')} chars)`);
  ok(want(N), `${name}: ${N} parts`);
  parts.forEach((p, i) => {
    const e = p.embeds[0], d = e.description, msg = p.content.length + e.title.length + d.length + e.footer.text.length;
    ok(d.length <= 4096 && msg <= 6000, `${name} part ${i + 1}: ${d.length} / 4096, ${msg} / 6000`);
    ok(N === 1 || e.title.endsWith(`(${i + 1}/${N})`), `${name} part ${i + 1}: titled (${i + 1}/${N})`);
    ok(i === 0 ? /<@&\d+>/.test(p.content) && p.allowed_mentions.roles.length === 1 : !p.content && !p.allowed_mentions.roles.length, `${name} part ${i + 1}: the role pinged ${i === 0 ? 'here' : 'only in part 1'}`);
    ok((i === N - 1) === /\[Play on itch\.io\]/.test(d), `${name} part ${i + 1}: the links ${i === N - 1 ? 'here' : 'only on the last part'}`);
  });
  // every line of the notes arrives whole, in order, exactly once
  ok(JSON.stringify(contentLines(parts.map((p) => body(p.embeds[0].description)).join('\n'))) === JSON.stringify(contentLines(text)), `${name}: every line arrives whole and in order`);
  return parts;
}
// 1. today's notes: two parts, the second starting at a section heading
const p1 = check('v10.10.0 as written', real, (N) => N === 2);
ok(/^\*\*[^*]+\*\*$/.test(body(p1[1].embeds[0].description).split('\n')[0]), 'v10.10.0: part 2 starts at a section heading');
// 2. 3.5 times today's notes (its sections repeated, headings numbered): as many parts as it needs, each at a heading
const big = [real, ...[2, 3, 4].map((k) => real.split('\n').map((l) => (/^\*\*[^*]+\*\*$/.test(l) ? l.replace(/\*\*$/, ` ${k}**`) : l)).join('\n'))].join('\n\n').slice(0, Math.round(real.length * 3.5));
const big2 = big.slice(0, big.lastIndexOf('\n'));
const p2 = check('3.5x today', big2, (N) => N >= Math.ceil(big2.length / 4096) && N <= Math.ceil(big2.length / 2500));
p2.slice(1).forEach((p, i) => { const first = body(p.embeds[0].description).split('\n')[0]; ok(/^\*\*[^*]+\*\*$/.test(first), `3.5x part ${i + 2} starts at a heading ("${first.slice(0, 40)}")`); });
// 3. one section longer than a whole embed: it carries on into the next part between two lines, never mid-line
const huge = '**One huge section**\n' + Array.from({ length: 180 }, (_, i) => `- Line ${i + 1}: ${'a fact about the update, '.repeat(3)}and its end.`).join('\n');
check('one section of ' + huge.length + ' chars', huge, (N) => N >= 3);
// 4. who is pinged (Faizal, 2026-10-04): a patch release never pings; a feature update or an expansion pings Patch Notes
// once; a beta pings Beta Testers only if no beta ping is logged in the last 24 hours. A stand-in log, never the real one.
const pings = (tag, logLines) => {
  const f = path.join(os.tmpdir(), `announce-ping-${process.pid}-${n}.md`), log = f + '.log'; fs.writeFileSync(f, '**Fixes**\n- One fix.'); fs.writeFileSync(log, logLines.join('\n') + '\n');
  const out = execFileSync('node', [TOOL, tag, '--dry', '--notes', f, ...(/-beta\./.test(tag) ? ['--beta'] : [])], { encoding: 'utf8', env: Object.assign({}, process.env, { ANNOUNCE_LOG: log }) }); fs.unlinkSync(f); fs.unlinkSync(log);
  const ps = out.split(/^--- part /m).slice(1).map((blk) => JSON.parse(blk.slice(blk.indexOf('\n') + 1)));
  return { roles: ps.reduce((a, p) => a + p.allowed_mentions.roles.length + (/<@&/.test(p.content) ? 1 : 0), 0), why: (out.match(/^\((no ping: [^\n]*|pings the [^)]*)\)$/m) || [])[1] || '' };
};
const ago = (h) => new Date(Date.now() - h * 3600000).toISOString();
for (const [name, tag, log, want, why] of [
  ['a patch release', 'v10.10.1', [], 0, /no ping: patch release/],
  ['a feature update', 'v10.11.0', [], 2, /pings the Patch Notes role/],
  ['an expansion', 'v11.0.0', [], 2, /pings the Patch Notes role/],
  ['a beta 2 h after a beta ping', 'v10.10.1-beta.1', [`ping beta ${ago(2)} v10.10.0-beta.8`], 0, /no ping: testers were pinged in the last day/],
  ['a beta 25 h after a beta ping', 'v10.10.1-beta.1', [`ping beta ${ago(25)} v10.10.0-beta.8`], 2, /pings the Beta Testers role/],
  ['a beta, a release ping 2 h ago', 'v10.10.1-beta.1', [`ping patch ${ago(2)} v10.10.0`], 2, /pings the Beta Testers role/],
  ['a beta, an old log of tags only', 'v10.10.1-beta.1', ['v10.10.0-beta.8', 'v10.10.0'], 2, /pings the Beta Testers role/],
  ['a feature update after a beta ping', 'v10.11.0', [`ping beta ${ago(1)} v10.11.0-beta.3`], 2, /pings the Patch Notes role/],
]) { const r = pings(tag, log); console.log(`${name} (${tag}): ${r.why}`); ok(r.roles === want && why.test(r.why), `${name}: ${r.roles / 2} ping(s), "${r.why}"`); }
console.log(bad ? `${bad} of ${n} checks FAIL` : `announce split: ${n}/${n} checks pass`);
process.exit(bad ? 1 : 0);
