// Kingsmere's Bank and Auction House has a merchant, as every other capital does (#262 player request)
const test = require('node:test'), assert = require('node:assert');
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
require('../src/data.js'); require('../src/engine.js'); require('../src/bots.js'); require('../src/game.js');
const { D, G } = globalThis;
test('every capital place with an auctioneer also has a merchant', () => {
  const ah = Object.entries(D.PLACES).filter(([, p]) => (p.npcs || []).some((n) => /^auctioneer_/.test(n)));
  assert.ok(ah.length >= 6);
  for (const [k, p] of ah) assert.ok(p.vendor, k + ' has an auctioneer but no merchant');
});
test("the Kingsmere bank merchant sells the Market Ward's goods", () => {
  G.newGame({ name: 'S', cls: 'warrior' });
  G.S.player.place = 'stormwind'; const ward = G.vendorStock('allison').map((i) => i.id);
  G.S.player.place = 'stormwind_bank'; const bank = G.vendorStock(D.PLACES.stormwind_bank.vendor).map((i) => i.id);
  assert.deepStrictEqual(bank, ward);
});
