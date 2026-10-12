// The database site (#231): tools/build_guide.js builds from the game data without errors, every page has a name,
// every link on a page points at a page that exists, and no old (renamed) name is anywhere in it.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');

test('the database builds and every link resolves', () => {
  const root = path.join(__dirname, '..');
  execFileSync('node', [path.join(root, 'tools/build_guide.js')], { cwd: root, stdio: 'pipe' });
  const html = fs.readFileSync(path.join(root, 'dist/guide/index.html'), 'utf8');
  const DB = JSON.parse(html.match(/const DB = (\{.*\});\n/)[1]);
  const pages = DB.pages, keys = Object.keys(pages);
  assert.ok(keys.length > 2000, `${keys.length} pages`);
  const bad = [];
  const walk = (c, from) => { if (Array.isArray(c)) c.forEach((x) => walk(x, from)); else if (c && typeof c === 'object' && c.l && !pages[c.l]) bad.push(`${from} → ${c.l}`); };
  for (const k of keys) {
    assert.ok(pages[k].n, `${k} has a name`);
    for (const s of pages[k].sec || []) walk(s.rows, k);
    walk(pages[k].facts || [], k);
    if (pages[k].g) for (const b of [...pages[k].g.intro, ...pages[k].g.tabs.flatMap((t) => t.b)]) walk(b.c, k);
  }
  assert.deepStrictEqual(bad, []);
  for (const kind in DB.lists) for (const id of DB.lists[kind]) assert.ok(pages[kind + '/' + id], `${kind}/${id} listed`);
  // the game's own names only (Accord and Krugar, never the old ones), as build.py checks the game page
  const ip = execFileSync('node', [path.join(root, 'tools/ipcheck.js'), '--dist', path.join(root, 'dist/guide/index.html')], { cwd: root, encoding: 'utf8' });
  assert.match(ip, /old names in the built page: 0/, ip);
});

// a hand-written guide: a link to nothing stops the build, and a guide checked for an older minor version than the
// latest release fails --check (the publish gate)
test('guides: a broken link stops the build, an old guide fails --check', () => {
  const root = path.join(__dirname, '..'), os = require('os');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guides-'));
  const run = (args) => { try { execFileSync('node', [path.join(root, 'tools/build_guide.js'), ...args], { cwd: root, stdio: 'pipe', env: Object.assign({}, process.env, { GUIDES_DIR: dir }) }); return ''; } catch (e) { return String(e.stderr); } };
  fs.writeFileSync(path.join(dir, 'druid.md'), '---\nclass: druid\nwritten: 1.0.0\nchecked: 1.0.0\n---\nUse [[No Such Spell]].\n');
  assert.match(run(['--check']), /\[\[No Such Spell\]\] is not in the database/);
  fs.writeFileSync(path.join(dir, 'druid.md'), '---\nclass: druid\nwritten: 1.0.0\nchecked: 1.0.0\n---\nUse [[Wrath]].\n');
  assert.match(run(['--check']), /druid\.md: checked for 1\.0/);
  fs.rmSync(dir, { recursive: true, force: true });
});
