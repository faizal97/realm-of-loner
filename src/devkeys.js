// The dev build's own storage (#92): a dev build (python3 build.py --dev, published at /dev/ on the same site as the game)
// must never read or write a player's characters, settings or tips. Loaded before every other script, and only in a dev
// build (window.AZ_DEV), it maps every storage key the game uses ("azsolo…") to "azsolo-next…". Every key starts with
// "azsolo" and no code walks the stored keys, so this covers every key, a new one too, with no list to keep.
(function (root) {
  const LIVE = 'azsolo', DEV = 'azsolo-next';
  const key = (k) => (typeof k === 'string' && k.startsWith(LIVE) && !k.startsWith(DEV) ? DEV + k.slice(LIVE.length) : k);
  // patch the browser's Storage (localStorage and sessionStorage), or, in Node tests, the storage object itself
  const wrap = (target) => { for (const m of ['getItem', 'setItem', 'removeItem']) { const f = target[m]; if (typeof f !== 'function' || f._devkeys) continue; const g = function (k, ...a) { return f.call(this, key(k), ...a); }; g._devkeys = true; target[m] = g; } };
  root.AZ_DEVKEYS = { key, wrap, LIVE, DEV };
  if (!root.AZ_DEV) return;
  // the browser's Storage (localStorage and sessionStorage share its prototype); a storage object of another kind (a Node
  // test's) is patched itself. Reading localStorage can throw where storage is blocked: then there is nothing to map
  let ls = null; try { ls = root.localStorage; } catch (e) { }
  if (root.Storage && ls instanceof root.Storage) wrap(root.Storage.prototype);
  else if (ls) wrap(ls);
})(typeof window !== 'undefined' ? window : globalThis);
