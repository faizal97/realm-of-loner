// The account bank's record and merge (#286): every deposit and withdrawal is kept, two devices merge by combining them,
// so an item is never lost (a withdrawal made on two devices before a sync can give one extra copy).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
require('../src/acctbank.js');
const { ABANK } = globalThis;

let seq = 0;
const id = () => 't' + String(++seq).padStart(6, '0'); // ordered ids, like the real time-prefixed ones
const potion = { id: 'potion_heal', name: 'Healing Potion', slot: 'potion' };
const sword = (n) => ({ id: 'gen_sword', name: 'Sword ' + n, slot: 'weapon', lvl: 40, roll: n });
const clone = (x) => JSON.parse(JSON.stringify(x));

test('an empty or broken bank reads as empty', () => {
  for (const b of [null, undefined, {}, { items: 5, took: 'x', gone: {} }]) {
    const m = ABANK.merge(b, null);
    assert.deepStrictEqual(ABANK.view(m), []);
    assert.strictEqual(m.tabs, 0);
  }
});

test('a deposit shows its count, and a withdrawal lowers it', () => {
  const b = ABANK.empty();
  const e = ABANK.deposit(b, potion, 12, true, id);
  assert.strictEqual(ABANK.count(b, e), 12);
  const got = ABANK.takeKey(b, 'potion_heal', 5, id);
  assert.strictEqual(got.n, 5);
  assert.strictEqual(got.item.id, 'potion_heal');
  assert.strictEqual(ABANK.count(b, e), 7);
});

test('stackable items group by item and fill slots in stacks of 20; gear takes a slot each', () => {
  const b = ABANK.empty();
  ABANK.deposit(b, potion, 15, true, id);
  ABANK.deposit(b, potion, 10, true, id);
  ABANK.deposit(b, sword(1), 1, false, id);
  ABANK.deposit(b, sword(2), 1, false, id);
  const v = ABANK.view(b);
  assert.strictEqual(v.length, 3);
  assert.strictEqual(v.find((g) => g.key === 'potion_heal').n, 25);
  assert.strictEqual(ABANK.slots(b), 2 + 1 + 1);
});

test('taking more than one deposit holds draws from the oldest first, across deposits', () => {
  const b = ABANK.empty();
  const e1 = ABANK.deposit(b, potion, 4, true, id);
  const e2 = ABANK.deposit(b, potion, 10, true, id);
  const got = ABANK.takeKey(b, 'potion_heal', 6, id);
  assert.strictEqual(got.n, 6);
  assert.strictEqual(ABANK.count(b, e1), 0);
  assert.strictEqual(ABANK.count(b, e2), 8);
  assert.ok(b.gone.includes(e1), 'an emptied deposit is dropped and remembered as gone');
  assert.ok(!(e1 in b.items));
});

test('taking more than the bank holds gives only what is there', () => {
  const b = ABANK.empty();
  ABANK.deposit(b, potion, 3, true, id);
  assert.strictEqual(ABANK.takeKey(b, 'potion_heal', 9, id).n, 3);
  assert.strictEqual(ABANK.takeKey(b, 'potion_heal', 1, id).n, 0);
});

test('a piece of gear comes back as the same item, rolled stats and all', () => {
  const b = ABANK.empty();
  const e = ABANK.deposit(b, sword(7), 1, false, id);
  const got = ABANK.takeKey(b, e, 1, id);
  assert.deepStrictEqual(got.item, sword(7));
  assert.deepStrictEqual(ABANK.view(b), []);
});

test('the merge is order-free, repeatable and groupable', () => {
  const a = ABANK.empty(), b = ABANK.empty(), c = ABANK.empty();
  ABANK.deposit(a, potion, 9, true, id); ABANK.deposit(b, sword(1), 1, false, id);
  const shared = ABANK.deposit(c, potion, 20, true, id); const b2 = ABANK.merge(b, c); const c2 = clone(c);
  ABANK.take(b2, shared, 5, id); ABANK.take(c2, shared, 3, id); b2.tabs = 2;
  const same = (x, y) => assert.deepStrictEqual(x, y);
  same(ABANK.merge(a, b2), ABANK.merge(b2, a));
  same(ABANK.merge(ABANK.merge(a, b2), b2), ABANK.merge(a, b2));
  same(ABANK.merge(ABANK.merge(a, b2), c2), ABANK.merge(a, ABANK.merge(b2, c2)));
  const m = ABANK.merge(ABANK.merge(a, b2), c2);
  assert.strictEqual(ABANK.count(m, shared), 12, 'both devices\' withdrawals count');
  assert.strictEqual(m.tabs, 2, 'the higher tab count wins');
});

test('a device that is behind cannot bring an emptied deposit back', () => {
  const a = ABANK.empty();
  const e = ABANK.deposit(a, potion, 5, true, id);
  const stale = clone(a);
  ABANK.takeKey(a, 'potion_heal', 5, id);
  const m = ABANK.merge(stale, a);
  assert.strictEqual(ABANK.count(m, e), 0);
  assert.deepStrictEqual(ABANK.view(m), []);
  assert.deepStrictEqual(ABANK.view(ABANK.merge(a, stale)), []);
});

test('the same withdrawal on two devices before a sync gives an extra copy, never a negative count', () => {
  const a = ABANK.empty();
  ABANK.deposit(a, potion, 5, true, id);
  const b = clone(a);
  assert.strictEqual(ABANK.takeKey(a, 'potion_heal', 5, id).n, 5);
  assert.strictEqual(ABANK.takeKey(b, 'potion_heal', 4, id).n, 4);
  const m = ABANK.merge(a, b);
  assert.deepStrictEqual(ABANK.view(m), []);
  assert.strictEqual(ABANK.slots(m), 0);
});

// Two devices start from the same bank, then deposit, withdraw and sync at random. Whatever happens, items in the
// merged bank plus items that reached bags is never less than what was put in: nothing is lost.
test('random play on two devices never loses an item', () => {
  let r = 12345; const rnd = (n) => { r = (r * 1103515245 + 12345) % 2147483648; return r % n; };
  for (let round = 0; round < 300; round++) {
    const dev = [ABANK.empty(), ABANK.empty()];
    let put = 0, out = 0;
    for (let step = 0; step < 40; step++) {
      const d = rnd(2), act = rnd(10);
      if (act < 4) { const n = 1 + rnd(20); ABANK.deposit(dev[d], potion, n, true, id); put += n; }
      else if (act < 8) out += ABANK.takeKey(dev[d], 'potion_heal', 1 + rnd(15), id).n;
      else if (act < 9) dev[1 - d] = ABANK.merge(dev[d], dev[1 - d]);
      else dev[d] = ABANK.merge(dev[d], dev[1 - d]);
    }
    const m = ABANK.merge(dev[0], dev[1]);
    const left = ABANK.view(m).reduce((s, g) => s + g.n, 0);
    assert.ok(left + out >= put, `round ${round}: ${put} put in, ${out} taken out, ${left} left`);
    assert.deepStrictEqual(ABANK.merge(dev[1], dev[0]), m, `round ${round}: the merge is order-free`);
  }
});

test('an overdrawn entry counts as 0, even before it is tidied away', () => {
  const b = { tabs: 0, items: { e1: { item: potion, n: 3, s: true } }, took: { o1: { id: 'e1', k: 2 }, o2: { id: 'e1', k: 4 } }, gone: [] };
  assert.strictEqual(ABANK.count(b, 'e1'), 0);
});

test('the record is plain JSON and survives a save and load', () => {
  const b = ABANK.empty();
  ABANK.deposit(b, potion, 7, true, id); ABANK.deposit(b, sword(3), 1, false, id); ABANK.takeKey(b, 'potion_heal', 2, id);
  const back = ABANK.merge(JSON.parse(JSON.stringify(b)), null);
  assert.deepStrictEqual(ABANK.view(back), ABANK.view(b));
});
