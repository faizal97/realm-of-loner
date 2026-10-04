#!/usr/bin/env node
// Post a GitHub release to the game's Discord through a channel webhook: the release name, its notes, and a link to
// itch.io (browser and Android). Players are sent to itch.io, never to GitHub. No bot runs anywhere; Discord only
// receives one post per release: one message, or (notes longer than one embed) several in a row, split at a section
// heading, with the role pinged only in the first (Faizal: "send the patch notes twice ... but only tag the roles once").
// Normal releases go to #patch-notes, betas to #beta-builds (only Beta Testers see it). The webhook URLs live outside the
// repo, in ~/.config/realm-of-loner/discord-webhook and discord-webhook-beta (or the DISCORD_WEBHOOK env var),
// so they can never be committed. Each tag is posted once; the posted tags are kept in ~/.config/realm-of-loner/announced.
// A normal release pings the "Patch Notes" role, a beta the "Beta Testers" role (players opt in to both in Onboarding).
// Usage: node tools/announce_discord.js [tag]          the latest normal release, or that tag
//        node tools/announce_discord.js <tag> --beta   allow a pre-release (posts to #beta-builds)
//        node tools/announce_discord.js [tag] --quiet  post without the role ping
//        node tools/announce_discord.js [tag] --dry    print every part instead of posting (before the GitHub release
//                                                       exists, it reads notes/<tag>.md)
//        node tools/announce_discord.js <tag> --dry --notes FILE   a dry run of FILE's notes (tools/announce_discord.test.js)
//        node tools/announce_discord.js [tag] --again  post a tag that was already posted
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const NOTES_FILE = opt('--notes');
const tag = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--notes');
const DIR = path.join(os.homedir(), '.config', 'realm-of-loner');
const LOG_FILE = path.join(DIR, 'announced');
const ITCH = 'https://starlighthvn.itch.io/realm-of-loner';
const MAX_DESC = 4096; // Discord's limit for an embed description (and 6,000 for a whole message: one embed stays under it)
const PATCH_ROLE = '1555434281520865341'; // the server's "Patch Notes" role (role IDs are not secrets)
const BETA_ROLE = '1555436280542789672'; // the server's "Beta Testers" role

const die = (msg) => { console.error(msg); process.exit(1); };

let rel;
if (NOTES_FILE && !flag('--dry')) die('--notes is for dry runs only');
try { if (NOTES_FILE) throw new Error('notes file'); rel = JSON.parse(execFileSync('gh', ['release', 'view', ...(tag ? [tag] : []), '--json', 'tagName,name,body,url,isPrerelease,assets'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })); }
catch (e) { // a dry run before the release exists: the notes file the release will use
  const nf = NOTES_FILE || (tag && path.join(__dirname, '..', 'notes', tag + '.md'));
  if (!flag('--dry') || !nf || !fs.existsSync(nf)) die(`no GitHub release ${tag || '(latest)'}${flag('--dry') ? ` and no ${nf}` : ''}`);
  rel = { tagName: tag, name: tag, body: fs.readFileSync(nf, 'utf8'), url: '', isPrerelease: /-beta\./.test(tag), assets: [{ name: '(the release will attach the APK)' + '.apk' }] };
  console.log(`(dry run from ${path.relative(process.cwd(), nf)}: GitHub has no release ${tag} yet)`);
}
if (rel.isPrerelease && !flag('--beta')) die(`${rel.tagName} is a pre-release; add --beta to post it`);

const posted = fs.existsSync(LOG_FILE) ? fs.readFileSync(LOG_FILE, 'utf8').split('\n').filter(Boolean) : [];
if (posted.includes(rel.tagName) && !flag('--again') && !flag('--dry')) die(`${rel.tagName} was already posted; add --again to post it again`);

const apk = rel.assets.find((a) => a.name.endsWith('.apk'));
// betas are not on itch.io. A beta post gives both ways in (issue #27): the Android switch, and the browser /beta/ page on
// GitHub Pages, the one GitHub link a post may carry (never the repo, its releases or its issues)
const BETA_PAGE = 'https://faizal97.github.io/realm-of-loner/beta/';
const links = rel.isPrerelease
  ? `**Android:** turn on Settings → Beta updates.\n**Browser:** [play the beta](${BETA_PAGE}). Characters from the itch.io browser version don't carry over to this page.`
  : `[Play on itch.io](${ITCH}): in your browser or on Android`;
if (!apk) console.warn(`warning: ${rel.tagName} has no APK attached (the in-app updater will not see it either)`);

// the notes in parts that each fit one embed: split before a section heading (a line that is only **Heading** or a #
// heading), never inside a line; as many parts as the notes need, the links under the last. A section too long for one
// embed alone continues in the next part, split between lines (a bullet, never mid-line); only a single line longer than
// a whole embed (none ever) would be split between words.
const foot = '\n\n' + links;
const notes = (rel.body || '').trim();
const isHead = (l) => /^\*\*[^*].*\*\*$/.test(l.trim()) || /^#{1,4}\s/.test(l);
const sections = []; for (const l of notes.split('\n')) { if (!sections.length || (isHead(l) && sections[sections.length - 1].trim())) sections.push(l); else sections[sections.length - 1] += '\n' + l; }
const parts = []; let cur = '';
const room = MAX_DESC - foot.length - 40; // the links (any part may turn out to be the last) and a little air
const add = (chunk) => { const next = cur ? cur + '\n' + chunk : chunk; if (next.length <= room) { cur = next; return; } if (cur.trim()) parts.push(cur.trim()); cur = chunk; };
for (const sec of sections) {
  if (sec.length <= room) { add(sec); continue; }
  // too long for one embed: its lines one at a time, so it carries on into the next part between two lines
  for (let line of sec.split('\n')) { while (line.length > room) { const cut = line.lastIndexOf(' ', room) > 0 ? line.lastIndexOf(' ', room) : room; add(line.slice(0, cut)); line = line.slice(cut).trimStart(); } add(line); }
}
if (cur.trim() || !parts.length) parts.push(cur.trim());
const N = parts.length;
const role = flag('--quiet') ? null : rel.isPrerelease ? BETA_ROLE : PATCH_ROLE;
const title = (rel.isPrerelease ? 'Beta: ' : '') + (rel.name || rel.tagName);
const payloads = parts.map((text, i) => ({
  username: 'Realm of Loner',
  // the role is pinged once, in the first part; the others carry no mention at all
  content: i === 0 && role ? `<@&${role}> ${rel.tagName} is out` : '',
  allowed_mentions: { parse: [], roles: i === 0 && role ? [role] : [] }, // only that one role, never a mention from the notes
  embeds: [{
    title: (title + (N > 1 ? ` (${i + 1}/${N})` : '')).slice(0, 256),
    url: rel.isPrerelease ? BETA_PAGE : ITCH,
    description: (i > 0 ? '*(continued)*\n' : '') + text + (i === N - 1 ? foot : '\n\n*(continued below)*'),
    color: rel.isPrerelease ? 0x6c8ebf : 0xc9a44c,
    footer: { text: rel.isPrerelease ? 'Beta builds: Settings → Beta updates on Android, or the /beta/ page in a browser' : 'Update in game from Settings, or get it on itch.io' },
  }],
}));
const msgLen = (p) => p.content.length + p.embeds.reduce((a, e) => a + e.title.length + e.description.length + e.footer.text.length, 0);
for (const p of payloads) if (p.embeds[0].description.length > MAX_DESC || msgLen(p) > 6000) die(`a part is over Discord's limits (${p.embeds[0].description.length} / ${MAX_DESC} description, ${msgLen(p)} / 6000 message)`);

if (flag('--dry')) {
  payloads.forEach((p, i) => { const d = p.embeds[0].description; console.log(`--- part ${i + 1}/${N}: description ${d.length} / ${MAX_DESC} chars, message ${msgLen(p)} / 6000, role ping: ${p.content ? 'yes' : 'no'}, links: ${d.endsWith(foot) ? 'yes' : 'no'}; starts "${d.split('\n').find((l) => l.trim() && !/continued/.test(l)).slice(0, 60)}", ends "${d.split('\n').filter((l) => l.trim()).slice(-1)[0].slice(0, 60)}"`); console.log(JSON.stringify(p, null, 2)); });
  process.exit(0);
}

const HOOK_FILE = path.join(DIR, rel.isPrerelease ? 'discord-webhook-beta' : 'discord-webhook');
const hook = (process.env.DISCORD_WEBHOOK || (fs.existsSync(HOOK_FILE) ? fs.readFileSync(HOOK_FILE, 'utf8') : '')).trim();
if (!/^https:\/\/(ptb\.|canary\.)?discord(app)?\.com\/api\/webhooks\//.test(hook)) die(`no Discord webhook: put its URL in ${HOOK_FILE}`);

// each part that posts is logged as "<tag> part i/N", and the tag itself once all are in: a re-run after a failure posts
// only the parts still missing (so the role, in part 1, is never pinged twice)
(async () => {
  fs.mkdirSync(DIR, { recursive: true });
  for (let i = 0; i < N; i++) {
    const mark = `${rel.tagName} part ${i + 1}/${N}`;
    if (N > 1 && posted.includes(mark) && !flag('--again')) { console.log(`part ${i + 1}/${N} was already posted; skipping it`); continue; }
    const res = await fetch(hook + '?wait=true', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloads[i]) });
    if (!res.ok) die(`Discord said ${res.status} on part ${i + 1}/${N}: ${await res.text()}`);
    if (N > 1) fs.appendFileSync(LOG_FILE, mark + '\n');
    if (i < N - 1) await new Promise((r) => setTimeout(r, 1500)); // a short pause between parts: Discord rate-limits webhooks
  }
  if (!posted.includes(rel.tagName)) fs.appendFileSync(LOG_FILE, rel.tagName + '\n');
  console.log(`posted ${rel.tagName} to Discord${N > 1 ? ` in ${N} parts` : ''}`);
})();
