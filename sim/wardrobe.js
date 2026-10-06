// The wardrobe (v10.3): looks are account-wide (account.looks, 'place:artKey'), each character picks what shows
// (P.wardrobe). Design: docs/plans/2026-09-30-wardrobe-design.md. node sim/wardrobe.js
require('./_seed.js'); // seeded (#125): the same commit always gives the same result; SEED=n picks other dice
const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
globalThis.localStorage = mem();
require('../src/data.js'); require('../src/engine.js'); require('../src/bots.js'); require('../src/game.js'); require('../src/cloud.js');
const { G, D, CLOUD } = globalThis;
let bad = 0, n = 0; const ok = (c, m) => { n++; if (!c) { bad++; console.log('FAIL ' + m); } };
const withLook = (place, pred) => Object.keys(D.ITEMS).find((id) => { const l = D.ITEMS[id].look; return l && l[0] === place && (!pred || pred(D.ITEMS[id])); });
const has = (k) => (G.account().looks || []).includes(k);

// the first open collects from characters already on this device (worn, bags, bank)
const cape = withLook('back'), sword = withLook('weapon', (it) => it.wtype === 'sword'), mail = withLook('chest', (it) => it.atype && it.atype !== 'cloth'); // a chest a mage cannot wear
G.newGame({ name: 'Old', cls: 'warrior', race: 'human' }); G.S.player.bank = [{ item: G.copyItem(cape), n: 1 }]; G.S.player.equip.weapon = G.copyItem(sword); G.save();
const oldId = G.S.id;
G.newGame({ name: 'Mage', cls: 'mage', race: 'human' }); G.save();
ok(!has('back:' + D.ITEMS[cape].look[1]), 'nothing collected before the first open');
G.seedWardrobe();
ok(has('back:' + D.ITEMS[cape].look[1]) && has('weapon:' + D.ITEMS[sword].look[1]), 'the first open collects the bank cape and the worn sword of another character');

// looting collects
ok(G.addItem(G.copyItem(mail), 1) && has('chest:' + D.ITEMS[mail].look[1]), 'looting a leather or mail chest collects its look');

// class rules: a mage sees the cape but not the sword or the mail
const keys = (pl) => G.wardrobeOptions(pl).map((o) => o.key);
ok(keys('back').includes(D.ITEMS[cape].look[1]), 'a mage can show the cape');
ok(!keys('weapon').includes(D.ITEMS[sword].look[1]) && !keys('chest').includes(D.ITEMS[mail].look[1]), 'a mage cannot show a sword or a leather or mail chest');
ok(!G.setWardrobe('weapon', D.ITEMS[sword].look[1]), 'setting a look the class cannot wear is refused');
ok(!G.setWardrobe('chest', 'hidden') && G.setWardrobe('back', 'hidden'), 'Hidden only for back and ranged');

// showing: a chosen look shows, Hidden removes, Your gear falls back to the worn item
const P = G.S.player;
ok(!(G.gearLooks(P) || {}).back, 'hidden back shows no cape');
ok(G.setWardrobe('back', D.ITEMS[cape].look[1]) && G.gearLooks(P).back === D.ITEMS[cape].look[1], 'the chosen cape shows without wearing it');
P.equip.back = G.copyItem(withLook('back', (it) => it.look[1] !== D.ITEMS[cape].look[1]) || cape);
ok(G.gearLooks(P).back === D.ITEMS[cape].look[1], 'the wardrobe choice wins over the worn cloak');
G.setWardrobe('back', null);
ok(G.gearLooks(P).back === G.gearLooks({ equip: { back: P.equip.back } }).back, 'Your gear shows the worn cloak again');

// the collection log: every look the class could show, collected or not; keepsakes only once earned
const G2 = G.S.player; const allBack = G.wardrobeAll('back');
ok(allBack.length >= G.wardrobeOptions('back').filter((o) => !o.keepsake).length && allBack.some((o) => !o.have), 'the log lists uncollected looks too');
ok(allBack.filter((o) => o.have).every((o) => G.wardrobeOptions('back').some((x) => x.key === o.key)), 'collected in the log means choosable');
ok(!G.wardrobeAll('weapon').some((o) => o.key === D.ITEMS[sword].look[1]), 'the log never offers a mage a sword');
ok(G.wardrobeAll('back').every((o) => !o.keepsake || G.legendUnlocked(o.keepsake)), 'a keepsake is listed only once earned');
// keepsakes: offered in the Back row once the Legend's questline is done; an old P.keepsake moves to the wardrobe
const lk = Object.keys(D.LEGENDS).find((k) => D.LEGENDS[k].keepsake), L = D.LEGENDS[lk];
ok(!keys('back').includes(L.keepsake.look), 'no keepsake before the questline');
P.done[L.unlock] = true;
ok(keys('back').includes(L.keepsake.look) && G.setWardrobe('back', L.keepsake.look), 'the keepsake is a Back choice after the questline');
G.setWardrobe('back', null); G.setKeepsake(lk);
ok(P.wardrobe.back === L.keepsake.look, 'the Legend page button sets the Back row');
delete P.wardrobe; P.keepsake = L.keepsake.look; G.save(); const id = G.S.id; G.load(id);
ok(G.S.player.wardrobe && G.S.player.wardrobe.back === L.keepsake.look && !G.S.player.keepsake, 'an old save wears its keepsake through the wardrobe');

// cloud save: two devices merge to the union of their looks, and a restore keeps them
const m = CLOUD.mergeAccount({ marks: 5, heirlooms: [], looks: ['back:a', 'weapon:b'] }, { marks: 9, heirlooms: [], looks: ['back:a', 'chest:c'] });
ok(m.looks.length === 3 && m.marks === 9, 'merging two devices keeps every look');
ok(G.load(oldId) && G.S.player.name === 'Old', 'other characters still load');

console.log(`wardrobe: ${n - bad}/${n} checks pass`);
process.exit(bad ? 1 : 0);
