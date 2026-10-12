// Players' guides (#231, docs/plans/2026-10-12-player-guides-design.md): fetches the guides the reviewer approved on
// the site's review page and turns each into guides/<class>-<title>.md, stamped with the latest release. Approved
// guides are public, so this needs no sign-in. The build's link check runs on the result; the claims are checked by
// hand before the pull request.
// Usage: node tools/guide_inbox.js            list the approved guides
//        node tools/guide_inbox.js --write    write them into guides/ and run the link check
//        --emu                                the local emulator (cd firebase && npx firebase emulators:start)
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..'), PROJECT = 'compelling-cat-510114-p4';
const EMU = process.argv.includes('--emu'), WRITE = process.argv.includes('--write');
const BASE = (EMU ? 'http://127.0.0.1:8781' : 'https://firestore.googleapis.com') + `/v1/projects/${PROJECT}/databases/(default)/documents`;
const one = (s) => String(s || '').replace(/[\r\n]+/g, ' ').trim(); // a frontmatter value stays on its line
const slug = (s) => one(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

(async () => {
  const res = await fetch(BASE + ':runQuery', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ structuredQuery: {
    from: [{ collectionId: 'guides_in' }], where: { fieldFilter: { field: { fieldPath: 'status' }, op: 'EQUAL', value: { stringValue: 'approved' } } } } }) });
  if (!res.ok) throw new Error(`Firestore said ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const docs = (await res.json()).filter((r) => r.document).map((r) => { const f = r.document.fields, v = (k) => (f[k] || {}).stringValue || ''; return { cls: v('cls'), title: v('title'), by: v('by'), text: v('text') }; });
  if (!docs.length) return console.log('No approved guides waiting.');
  let release = '';
  try { release = execFileSync('git', ['describe', '--tags', '--abbrev=0', '--match', 'v*', '--exclude', '*-*'], { cwd: ROOT, encoding: 'utf8' }).trim().replace(/^v/, ''); } catch (e) { throw new Error('No release tag to stamp the guides with.'); }
  const written = [];
  for (const g of docs) {
    if (!/^[a-z]{3,16}$/.test(g.cls) || /^official$/i.test(one(g.by))) { console.log(`skipped: "${one(g.title)}" (class or name not allowed)`); continue; }
    let file = `${g.cls}-${slug(g.title) || 'guide'}.md`;
    // the same writer's guide of the same name is an update; anyone else's gets its own file
    for (let n = 2; fs.existsSync(path.join(ROOT, 'guides', file)) && !new RegExp(`^by: ${one(g.by).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm').test(fs.readFileSync(path.join(ROOT, 'guides', file), 'utf8')); n++) file = `${g.cls}-${slug(g.title)}-${n}.md`;
    console.log(`${WRITE ? 'writing' : 'approved'}: guides/${file}  "${one(g.title)}" by ${one(g.by)} (${g.text.length} characters)`);
    if (WRITE) { fs.writeFileSync(path.join(ROOT, 'guides', file), `---\nclass: ${g.cls}\nby: ${one(g.by)}\ntitle: ${one(g.title)}\nwritten: ${release}\nchecked: ${release}\n---\n${g.text.replace(/\r\n/g, '\n').trim()}\n`); written.push(file); }
  }
  if (WRITE && written.length) { execFileSync('node', [path.join(ROOT, 'tools/build_guide.js')], { cwd: ROOT, stdio: 'inherit' }); console.log(`link check passed. Next: check the claims in ${written.map((f) => 'guides/' + f).join(', ')}, then a pull request; after it ships, Mark on the site.`); }
})().catch((e) => { console.error(e.message); process.exit(1); });
