// Screens, input and UI state (#591): keybinds (#561, #571), the bar's slots and the run panel's tabs (#564).
// ui.js does not load in Node, so the pieces under test are cut out of its source and run against small stand-ins,
// as test/instrument-button.test.js and test/issue571.test.js do.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui.js'), 'utf8');
const cut = (from, to) => { const i = src.indexOf(from); assert.ok(i >= 0, 'found ' + from); const j = src.indexOf(to, i); assert.ok(j > i, 'found ' + to); return src.slice(i, j); };

// ---------- keybinds: the whole key block (binds, labels, onKey) run with stand-ins for the game and the page
function keyWorld(o = {}) {
  const store = new Map(), toasts = [], pressed = [];
  const ls = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
  const ui = Object.assign({ sheet: null, dialog: null, sheetFn: () => {} }, o.ui);
  const G = Object.assign({ S: { player: {} }, paused: false }, o.G);
  const els = { bar: { isConnected: true }, abs: {} };
  const win = Object.assign({}, o.window);
  const slots = o.slots || ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
  const block = cut('  const KEYS_KEY = ', "  document.addEventListener('keydown', onKey);");
  const api = new Function('ui', 'G', 'els', 'barSlots', 'pressAbility', 'toast', 'renderBar', 'window', 'CS', 'localStorage', 'setTimeout',
    block + '; return { onKey, keyBinds, keyLabel, slotKey, capture: (v) => { keyCapture = v; }, waiting: () => keyCapture };')(
    ui, G, els, () => slots, (id) => pressed.push(id), (t) => toasts.push(t), () => {}, win, win.CS, ls, () => 0);
  const ev = (code, x = {}) => { const e = Object.assign({ code, key: x.key != null ? x.key : code.replace(/^(Digit|Key)/, ''), target: x.target || null, prevented: false, preventDefault() { this.prevented = true; } }, x); api.onKey(e); return e; };
  return { api, ui, G, els, ev, pressed, toasts, store, slots };
}

test('keys 1-9 fire the first nine slots out of the box, and a key on an empty slot does nothing', () => {
  const w = keyWorld({ slots: ['a', null, 'c'] });
  w.ev('Digit1'); w.ev('Digit3');
  assert.deepStrictEqual(w.pressed, ['a', 'c']);
  const e = w.ev('Digit2'); // slot 2 is empty: nothing pressed, and the key is not swallowed
  assert.deepStrictEqual(w.pressed, ['a', 'c']); assert.strictEqual(e.prevented, false);
  w.ev('Digit9'); assert.deepStrictEqual(w.pressed, ['a', 'c'], 'slot 9 past the end of the bar');
});

test('keys never fire while typing, with a modifier held, on a held-down repeat, or over a dialog, sheet, cutscene or pause', () => {
  for (const tag of ['INPUT', 'TEXTAREA', 'SELECT']) { const w = keyWorld(); w.ev('Digit1', { target: { tagName: tag } }); assert.deepStrictEqual(w.pressed, [], tag); }
  { const w = keyWorld(); w.ev('Digit1', { target: { tagName: 'DIV', isContentEditable: true } }); assert.deepStrictEqual(w.pressed, [], 'contenteditable'); }
  for (const mod of ['ctrlKey', 'altKey', 'metaKey']) { const w = keyWorld(); w.ev('Digit1', { [mod]: true }); assert.deepStrictEqual(w.pressed, [], mod); }
  { const w = keyWorld(); w.ev('Digit1', { repeat: true }); assert.deepStrictEqual(w.pressed, [], 'repeat'); }
  { const w = keyWorld({ ui: { dialog: {} } }); w.ev('Digit1'); assert.deepStrictEqual(w.pressed, [], 'a dialog (the death recap is one)'); }
  { const w = keyWorld({ ui: { sheet: 'social' } }); w.ev('Digit1'); assert.deepStrictEqual(w.pressed, [], 'a sheet (chat is one)'); }
  { const w = keyWorld({ window: { CS: { playing: {} } } }); w.ev('Digit1'); assert.deepStrictEqual(w.pressed, [], 'a cutscene or the opening movie'); }
  { const w = keyWorld({ G: { paused: true } }); w.ev('Digit1'); assert.deepStrictEqual(w.pressed, [], 'paused (a movie waiting on its song)'); }
  { const w = keyWorld({ G: { S: null } }); w.ev('Digit1'); assert.deepStrictEqual(w.pressed, [], 'no character'); }
  { const w = keyWorld(); w.els.bar.isConnected = false; w.ev('Digit1'); assert.deepStrictEqual(w.pressed, [], 'no bar on screen'); }
});

test('Set key: a key already on another slot moves, Backspace clears, Escape cancels, a lone Shift or Enter is not taken', () => {
  const w = keyWorld({ ui: { sheet: 'bareditor' } });
  w.api.capture({ slot: 4, name: 'Echo' });
  w.ev('ShiftLeft', { shiftKey: true }); w.ev('Enter'); w.ev('Tab');
  assert.ok(w.api.waiting(), 'still waiting after Shift, Enter and Tab');
  w.ev('Digit1');
  assert.strictEqual(w.api.waiting(), null);
  assert.strictEqual(w.api.keyBinds()[4].c, 'Digit1'); assert.strictEqual(w.api.keyBinds()[0], undefined, 'slot 0 lost its 1');
  assert.match(w.toasts.pop(), /Key 1 moved to Echo/);
  w.api.capture({ slot: 4, name: 'Echo' }); w.ev('Backspace');
  assert.strictEqual(w.api.keyBinds()[4], undefined); assert.match(w.toasts.pop(), /Echo: no key/);
  w.api.capture({ slot: 2, name: 'C' }); w.ev('Escape');
  assert.strictEqual(w.api.waiting(), null); assert.strictEqual(w.api.keyBinds()[2].c, 'Digit3', 'Escape changed nothing');
  // shifted keys are their own binds
  w.api.capture({ slot: 5, name: 'F' }); w.ev('Digit2', { shiftKey: true, key: '@' });
  assert.deepStrictEqual(w.api.keyBinds()[5], { c: 'Shift+Digit2', l: 'S2' });
  w.ui.sheet = null; w.pressed.length = 0;
  w.ev('Digit2'); w.ev('Digit2', { shiftKey: true, key: '@' });
  assert.deepStrictEqual(w.pressed, ['b', 'f']);
});

test('a key wait left when Arrange closes is dropped: the next key fires the bar, it is not bound', () => {
  const w = keyWorld({ ui: { sheet: 'bareditor' } });
  w.api.capture({ slot: 0, name: 'A' });
  w.ui.sheet = null; // the sheet closed while it waited
  w.ev('KeyQ');
  assert.strictEqual(w.api.waiting(), null);
  assert.strictEqual(w.api.keyBinds()[0].c, 'Digit1', 'Q was not bound');
});

// a key the browser can't name (code '' and key 'Unidentified': some Bluetooth keyboards, remotes, IME keys) was bound
// with a blank label, and from then on every such key fired that slot (#591)
test('Set key refuses a key with no code, says so, and keeps waiting', () => {
  const w = keyWorld({ ui: { sheet: 'bareditor' } });
  w.api.capture({ slot: 0, name: 'Heroic Strike' });
  w.ev('', { key: 'Unidentified' });
  assert.deepStrictEqual(w.api.keyBinds()[0], { c: 'Digit1', l: '1' });
  assert.match(w.toasts.pop(), /Can't use that key/);
  assert.ok(w.api.waiting(), 'still waiting for a key');
  w.ev('KeyQ');
  assert.deepStrictEqual(w.api.keyBinds()[0], { c: 'KeyQ', l: 'Q' });
});

test('a key with no code never fires a slot, even one bound to it before', () => {
  const w = keyWorld();
  w.store.set('azsolo.keybinds', JSON.stringify({ 0: { c: '', l: '' } }));
  w.ev('', { key: 'Unidentified' });
  assert.deepStrictEqual(w.pressed, []);
});

test('a key label is never blank', () => {
  const { keyLabel } = keyWorld().api;
  for (const e of [{ code: '', key: 'Unidentified' }, { code: '', key: 'Unidentified', shiftKey: true }, { code: 'Lang1', key: 'HangulMode' }, { code: 'Space', key: ' ' }, { code: 'Quote', key: 'Dead' }])
    assert.ok(keyLabel(e).replace(/^S/, '').trim().length > 0, `${JSON.stringify(e)} -> '${keyLabel(e)}'`);
});

// ---------- the bar's slots: a bind belongs to a slot index, so what sits under an index must not move on its own
function barSlotsWith(base, { fight = false, potion = true } = {}) {
  const fn = cut('  function barSlots(', '  // the player\'s own bar layout');
  const AB = { a: {}, b: {}, c: {}, s1: { combatOnly: true }, potion: {} };
  return new Function('G', 'D', 'barArrange', 'barPool', fn + '; return barSlots();')(
    { S: { player: { bags: potion ? [{ item: { slot: 'potion' }, n: 1 }] : [] } }, racial: () => null, fight, pUnit: null }, { ABILITIES: AB }, () => base, () => base);
}

// the Potion button keeps its slot at 0 potions (#591): it used to leave the bar, so every button after it moved one
// slot left and its key fired the ability next door
test('drinking the last potion does not move the other buttons under different keys', () => {
  const base = ['a', 'potion', 'b', 'c'];
  const withPot = barSlotsWith(base, { potion: true }), noPot = barSlotsWith(base, { potion: false });
  assert.deepStrictEqual(noPot, withPot);
  assert.deepStrictEqual(barSlotsWith(base, { potion: false, fight: true }), barSlotsWith(base, { potion: true, fight: true }));
});

test('a Potion last on the bar still hides at 0 potions, since that moves no key', () => {
  assert.deepStrictEqual(barSlotsWith(['a', 'b', 'potion'], { potion: false }), ['a', 'b']);
  assert.deepStrictEqual(barSlotsWith(['a', 'b', 'potion'], { potion: true }), ['a', 'b', 'potion']);
});

test('a fight and its end keep every ability under the same key (Eat and Drink only borrow fight-only slots)', () => {
  const base = ['a', 's1', 'b', 'eat', 'c'];
  const f = barSlotsWith(base, { fight: true }), p = barSlotsWith(base, { fight: false });
  for (const id of ['a', 'b', 'c']) assert.strictEqual(f.indexOf(id), p.indexOf(id), id);
  assert.strictEqual(p[f.indexOf('s1')], 'eat');
});

// ---------- run panel tabs (#564, #591)
function runTabs() {
  const fn = cut('  function runTabNow(', '  function runPanel(');
  const ui = {}, G = { role: () => 'dps' }, now = new Function('ui', 'G', fn + '; return runTabNow;')(ui, G);
  return { ui, tab: (R, C, healer) => { G.role = () => (healer ? 'healer' : 'dps'); return now(R, C); } }; // healer: the player's role (#597)
}

test('a run opens on Next pull, a fight on Enemies (Party for a healer), a finished run on Party', () => {
  const { tab, ui } = runTabs(), R = { phase: 'rest' };
  assert.strictEqual(tab(R, null), 'next');
  assert.strictEqual(tab(R, {}), 'next');
  assert.strictEqual(runTabs().tab(R, {}, true), 'party');
  ui.runTab = 'plan'; assert.strictEqual(tab({ phase: 'done' }, null), 'party');
});

// a pick between pulls (or the "Boss plan ›" row, which picks Plan by itself) used to hold through the next fight,
// which then showed only the pace chips: no party frames for a healer, no enemy list (#591)
test('a fight always opens on its default tab, whatever was picked between pulls', () => {
  for (const healer of [false, true]) {
    const { tab, ui } = runTabs(), R = { phase: 'rest' };
    tab(R, null); ui.runTab = 'plan';
    assert.strictEqual(tab(R, null), 'plan', 'the pick holds between pulls');
    const C = {};
    assert.strictEqual(tab(R, C, healer), healer ? 'party' : 'next', 'the fight opens on its default');
    ui.runTab = 'plan'; assert.strictEqual(tab(R, C, healer), 'plan', 'a pick in the fight holds for that fight');
    assert.strictEqual(tab(R, null), 'next', 'after the fight: Next pull again');
  }
});

test('a pick never carries to the next run or another character', () => {
  const { tab, ui } = runTabs(), R1 = { phase: 'rest' }, R2 = { phase: 'rest' };
  tab(R1, null); ui.runTab = 'party';
  assert.strictEqual(tab(R1, null), 'party');
  assert.strictEqual(tab(R2, null), 'next');
});

// the first group-run tip named "Tactics", gone since the run panel's tabs: the pace is on the Plan tab (#591)
test('the group-run tip names the Plan tab where the pace is set', () => {
  const tip = src.match(/\n\s*run: '([^']*)'/);
  assert.ok(tip, 'the run tip');
  assert.doesNotMatch(tip[1], /Tactics/);
  assert.match(tip[1], /Plan tab/);
});

// ---------- the HUD's zone line (#433, #591): a zone inside a bigger region says both, as the Map names the region.
// The region holding West and East Rotmoor was itself named West Rotmoor, so the HUD read "East Rotmoor · West Rotmoor".
test('no HUD zone line pairs two names that differ only by a compass word, and the Map names the same region', () => {
  const { D } = require('./world');
  const line = src.match(/\n\s*const zoneLine = \(pl\) => [^\n]*/);
  assert.ok(line, 'the zone line');
  const zoneLine = new Function('D', line[0] + '; return zoneLine;')(D);
  const bare = (x) => x.replace(/^(The )?(East|West|North|South)(ern)? /, '');
  const bad = [];
  for (const pl of Object.values(D.PLACES)) {
    if (!pl.zone) continue;
    const [z, r] = zoneLine(pl).split(' · ');
    if (r && bare(z) !== z && bare(r) !== r && bare(z) === bare(r)) bad.push(zoneLine(pl)); /* East X · West X */
    if (r) assert.strictEqual(r, D.REGIONS[pl.region].name, 'the HUD names the region the Map is titled with');
  }
  assert.deepStrictEqual([...new Set(bad)], []);
  assert.strictEqual(zoneLine(D.PLACES.chillwind_camp), 'West Rotmoor · Rotmoor');
  assert.match(src, />Rotmoor · contested</, 'the region map says Rotmoor too');
});
