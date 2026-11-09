// The account bank's record (#286, docs/plans/2026-11-09-account-bank-design.md): a bank every character on the account
// shares. Pure data, no game or page code, so the game, the cloud sync and the tests all use the same rules.
//
//   bank = { tabs, items: { <id>: { item, n, s } },   one entry per deposit (s: stacks with others of its item id)
//                  took:  { <opId>: { id, k } },        one per withdrawal: k taken from entry id
//                  gone:  [<id>, ...] }                 entries that reached 0 and were dropped
//
// An entry's count is n minus everything taken from it, never below 0. Two devices merge by combining all three, so the
// merge is order-free and repeatable, and an item is never lost; the same withdrawal made on two devices before a sync
// can give one extra copy. `gone` stops a device that is behind from bringing an emptied entry back.
(function (root) {
  const ABANK = root.ABANK = {};
  ABANK.STACK = 20;
  const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
  // ids sort by time, so "oldest first" is a plain sort
  ABANK.newId = () => Date.now().toString(36).padStart(9, '0') + Math.random().toString(36).slice(2, 8);
  ABANK.empty = () => ({ tabs: 0, items: {}, took: {}, gone: [] });
  // a clean copy of whatever was saved: wrong shapes read as empty
  function norm(b) {
    b = obj(b);
    const items = {}, took = {}, gone = Array.isArray(b.gone) ? b.gone.filter((x) => typeof x === 'string') : [];
    for (const [k, e] of Object.entries(obj(b.items))) if (e && e.item && e.item.id && +e.n > 0) items[k] = { item: e.item, n: Math.floor(+e.n), s: !!e.s };
    for (const [k, t] of Object.entries(obj(b.took))) if (t && typeof t.id === 'string' && +t.k > 0) took[k] = { id: t.id, k: Math.floor(+t.k) };
    return { tabs: Math.max(0, Math.floor(+b.tabs || 0)), items, took, gone };
  }
  const takenFrom = (b, id) => { let s = 0; for (const t of Object.values(b.took)) if (t.id === id) s += t.k; return s; };
  ABANK.count = (b, id) => (b.items[id] ? Math.max(0, b.items[id].n - takenFrom(b, id)) : 0);
  // drop emptied entries and their withdrawals; keys sorted so equal banks are equal objects
  function tidy(b) {
    const gone = new Set(b.gone);
    for (const id of Object.keys(b.items)) if (ABANK.count(b, id) <= 0) gone.add(id);
    const items = {}, took = {};
    for (const id of Object.keys(b.items).sort()) if (!gone.has(id)) items[id] = b.items[id];
    for (const op of Object.keys(b.took).sort()) if (!gone.has(b.took[op].id)) took[op] = b.took[op];
    b.items = items; b.took = took; b.gone = [...gone].sort();
    return b;
  }
  ABANK.merge = function (a, b) {
    a = norm(a); b = norm(b);
    const m = { tabs: Math.max(a.tabs, b.tabs), items: Object.assign({}, b.items, a.items), took: Object.assign({}, b.took, a.took), gone: a.gone.concat(b.gone) };
    return tidy(m);
  };
  // put n of an item in; returns the new entry's id
  ABANK.deposit = function (b, item, n, stack, mkId) {
    const id = (mkId || ABANK.newId)();
    b.items[id] = { item, n: Math.max(1, Math.floor(n)), s: !!stack };
    return id;
  };
  // take up to k from one entry; returns how many were taken
  ABANK.take = function (b, id, k, mkId) {
    const have = ABANK.count(b, id), n = Math.min(have, Math.max(0, Math.floor(k)));
    if (n > 0) b.took[(mkId || ABANK.newId)()] = { id, k: n };
    tidy(b);
    return n;
  };
  // what the bank screen shows: stackable items grouped by item id (key = item id), anything else one per entry (key =
  // entry id); oldest first
  ABANK.view = function (b) {
    const out = [], by = {};
    for (const id of Object.keys(b.items).sort()) {
      const e = b.items[id], n = ABANK.count(b, id); if (!n) continue;
      if (e.s) { if (!by[e.item.id]) out.push(by[e.item.id] = { key: e.item.id, item: e.item, n: 0, stack: true }); by[e.item.id].n += n; }
      else out.push({ key: id, item: e.item, n, stack: false });
    }
    return out;
  };
  ABANK.slots = (b) => ABANK.view(b).reduce((s, g) => s + (g.stack ? Math.ceil(g.n / ABANK.STACK) : 1), 0);
  // take up to k of a view row (its key), oldest deposits first; returns { item, n } with n = how many came out
  ABANK.takeKey = function (b, key, k, mkId) {
    let item = null, got = 0;
    const ids = b.items[key] ? [key] : Object.keys(b.items).sort().filter((id) => b.items[id].s && b.items[id].item.id === key);
    for (const id of ids) {
      if (got >= k) break;
      const e = b.items[id]; if (!e) continue;
      const n = ABANK.take(b, id, k - got, mkId);
      if (n) { item = item || e.item; got += n; }
    }
    return { item, n: got };
  };
  if (typeof module !== 'undefined') module.exports = ABANK;
})(typeof window !== 'undefined' ? window : globalThis);
