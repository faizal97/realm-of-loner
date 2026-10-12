// The guide format (#231), one parser for both places that read it: tools/build_guide.js (guides/*.md) and the guide
// site's Write page (its live preview), so a preview always looks the way the published guide will.
// Text: an intro, then `## Role` per tab, `### ` headings, `- ` and `1. ` lists, **bold**, and [[Name]], [[kind/id]] or
// [[kind/id|text]] links. resolve(ref) gives a link cell ({ l, t, q?, i? }) or a string saying why it can't.
(function (root) {
  function inline(s, resolve, errors) {
    return s.split(/(\[\[[^\]]+\]\]|\*\*[^*]+\*\*)/).filter(Boolean).map((t) => {
      if (t.startsWith('**') && t.endsWith('**') && t.length > 4) return { b: t.slice(2, -2) };
      if (!t.startsWith('[[')) return t;
      const [ref, text] = t.slice(2, -2).split('|').map((x) => x.trim());
      const c = resolve(ref);
      if (typeof c === 'string') { errors.push(`[[${ref}]] ${c}`); return { bad: text || ref }; }
      return text ? Object.assign({}, c, { t: text }) : c;
    });
  }
  // the body (no frontmatter) → { intro, tabs: [{ h, b }], errors }
  function parse(body, resolve) {
    const intro = [], tabs = [], errors = [];
    let blocks = intro, para = [];
    const flush = () => { if (para.length) blocks.push({ t: 'p', c: inline(para.join(' '), resolve, errors) }); para = []; };
    for (const line of String(body).split('\n')) {
      const l = line.trim();
      if (!l) { flush(); continue; }
      let x;
      if ((x = l.match(/^## (.+)/))) { flush(); tabs.push({ h: x[1].trim(), b: (blocks = []) }); }
      else if ((x = l.match(/^### (.+)/))) { flush(); blocks.push({ t: 'h', c: x[1].trim() }); }
      else if ((x = l.match(/^(- |\d+\. )(.+)/))) {
        flush();
        const t = x[1] === '- ' ? 'ul' : 'ol', last = blocks[blocks.length - 1];
        if (!(last && last.t === t)) blocks.push({ t, c: [] });
        blocks[blocks.length - 1].c.push(inline(x[2], resolve, errors));
      } else para.push(l);
    }
    flush();
    return { intro, tabs, errors };
  }
  // a whole file: frontmatter (key: value lines between ---) and the body
  function parseFile(src) {
    const m = String(src).match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!m) return null;
    const meta = {};
    for (const l of m[1].split('\n')) { const i = l.indexOf(':'); if (i > 0) meta[l.slice(0, i).trim()] = l.slice(i + 1).trim(); }
    return { meta, body: m[2] };
  }
  // a name → its page, the same way in both places: an exact key, else the one page with that name
  function resolver(pages, link) {
    const byName = {};
    for (const k of Object.keys(pages)) (byName[pages[k].n.toLowerCase()] = byName[pages[k].n.toLowerCase()] || []).push(k);
    return (ref) => {
      if (pages[ref]) return link(ref);
      const hits = byName[ref.toLowerCase()] || [];
      if (hits.length === 1) return link(hits[0]);
      const nt = hits.filter((k) => pages[k].k !== 'talent'); // a talent named like an ability (Last Stand): the name means the ability
      if (nt.length === 1) return link(nt[0]);
      return hits.length ? 'could be ' + hits.join(', ') : 'is not in the database';
    };
  }
  const GF = { parse, parseFile, resolver };
  if (typeof module !== 'undefined' && module.exports) module.exports = GF; else root.GF = GF;
})(typeof window !== 'undefined' ? window : globalThis);
