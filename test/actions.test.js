// Every player action runs (#88): each G.* action a button can call, on a seeded character at levels 1, 16 and 60, must not
// throw. The list of actions is read from ui.js (every G.x( called from a click handler), so an action added later that is
// in neither ACTIONS nor NOT_ACTIONS below fails the first test instead of slipping by. #87 (a G.G.bagsFull typo since
// v2.6.0) is the kind of bug this catches: a button nobody pressed in a test.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs'), path = require('path');
const { G, D, character, advance } = require('./world');

// what a click handler can call (ui.js lines with onclick or a click listener)
const fromUi = (() => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui.js'), 'utf8'), names = new Set();
  for (const line of src.split('\n')) if (/onclick|addEventListener\('click'/.test(line)) for (const m of line.matchAll(/\bG\.([a-zA-Z_]\w*)\s*\(/g)) names.add(m[1]);
  return names;
})();

// reads that a handler calls to decide or show something; no state changes, and covered by the actions that use them
const NOT_ACTIONS = new Set(['canDiscard', 'canUseItem', 'characters', 'copyItem', 'displayName', 'effectOf', 'enemyTown', 'isUpgrade', 'knownProfIds',
  'legendOn', 'moneyText', 'profs', 'rankName', 'role', 'travelSecs', 'treeSpent', 'usable',
  // these end or replace the character (the test world runs one): load, logout and wipeSave have their own test below
  'load', 'logout', 'wipeSave']);

const first = (o) => (o ? Object.keys(o)[0] : undefined);
const bag = (P, pred) => P.bags.findIndex((b) => b.item && pred(b.item));
const give = (id, n) => G.addItem(G.copyItem(id), n || 1);
const anyItem = (pred) => Object.keys(D.ITEMS).find((k) => pred(D.ITEMS[k]));
const botId = () => G.S.bots.find((b) => b.level >= G.S.player.level - 5) ? G.S.bots.find((b) => b.level >= G.S.player.level - 5).id : G.S.bots[0].id;
const groupAct = () => Object.keys(D.ACTIVITIES).find((k) => { const A = D.ACTIVITIES[k]; return A.dungeon && (A.size || 5) === 5 && !A.needQuest && !A.worldBoss && A.minLvl <= G.S.player.level; });
const inRun = () => { const act = groupAct(); if (!act) return false; G.S.player.place = D.ACTIVITIES[act].where; G.queueFor(act); if (G.S.queue) G.S.queue.popAt = Date.now() - 1; G.update(0.5); G.acceptPop(); return !!G.S.run; };
const inFight = () => { const m = G.placeMobs().find((x) => x.state === 'alive'); if (m) G.engage(m.id); return !!G.fight; };

// each action, with arguments a player's tap would give it; a missing precondition is fine (the action should refuse
// politely), a throw is not
const ACTIONS = {
  accept: () => G.accept(Object.keys(D.QUESTS)[0]),
  abandon: () => { const q = Object.keys(D.QUESTS)[0]; G.accept(q); G.abandon(first(G.S.player.quests) || q); },
  turnIn: () => { const q = first(G.S.player.quests) || Object.keys(D.QUESTS)[0]; G.turnIn(q); },
  acceptBounty: () => { const b = (G.bounties(G.S.player.place) || [])[0]; if (b) G.acceptBounty(b); },
  turnInBounty: () => { const b = (G.bounties(G.S.player.place) || [])[0]; if (b) { G.acceptBounty(b); G.turnInBounty(b); } },
  invite: () => G.invite(botId()),
  acceptPartyInvite: () => G.acceptPartyInvite(botId()),
  declinePartyInvite: () => G.declinePartyInvite(botId()),
  leaveParty: () => { G.invite(botId()); G.leaveParty(); },
  queueFor: () => { const a = groupAct(); if (a) G.queueFor(a); },
  acceptPop: () => { inRun(); },
  declinePop: () => { const a = groupAct(); if (a) { G.queueFor(a); G.declinePop(); } },
  leaveQueue: () => { const a = groupAct(); if (a) { G.queueFor(a); G.leaveQueue(); } },
  runReady: () => { if (inRun()) G.runReady(); },
  roll: () => { if (inRun()) { advance(60); const R = G.S.run; if (R && R.rolls && R.rolls.length) G.roll(0, 'need'); else G.roll(0, 'pass'); } },
  pauseRolls: () => { if (inRun()) { G.pauseRolls(true); G.pauseRolls(false); } },
  cycleMark: () => { if (inRun()) G.cycleMark(0); },
  cycleUnitMark: () => { if (inFight()) G.cycleUnitMark(G.fight.enemies[0].uid); },
  queueTrial: () => { const a = Object.keys(D.ACTIVITIES).find((k) => !G.trialBlock || !G.trialBlock(k)); if (a) G.queueTrial(a, 1); },
  joinHelpWanted: () => { const h = (G.helpWanted ? G.helpWanted() : []) || []; G.joinHelpWanted(h[0] ? h[0].id : 'none'); },
  startRoulette: () => G.startRoulette(),
  bgGo: () => { if (G.S.bg) { const C = D.BG[G.S.bg.key]; G.bgGo(C.banners[0][0], C.banners[1][0]); } else G.bgGo('a', 'b'); },
  leaveBg: () => G.leaveBg(),
  brawlJoin: () => G.brawlJoin(),
  brawlFight: () => G.brawlFight(),
  brawlTakeChest: () => G.brawlTakeChest(0),
  leaveBrawl: () => G.leaveBrawl(),
  engage: () => inFight(),
  flee: () => { if (inFight()) G.flee(); },
  setTarget: () => { if (inFight()) G.setTarget(G.fight.enemies[0].uid); },
  attackIntruder: () => G.attackIntruder(),
  tame: () => { const m = G.placeMobs().find((x) => x.state === 'alive'); G.tame(m ? m.id : 'none'); },
  summon: () => G.summon('imp'),
  buy: () => G.buy(G.copyItem(anyItem((x) => x.cost && x.slot === 'food')), 2),
  sell: () => { give(anyItem((x) => x.slot === 'junk' || x.q === 0) || 'linen_cloth'); G.sell(G.S.player.bags.length - 1); },
  sellJunk: () => G.sellJunk(),
  equip: () => { const i = bag(G.S.player, (x) => x.slot && D.GEAR_SLOTS.includes(x.slot)); if (i >= 0) G.equip(i); else G.equip(0); },
  unequip: () => G.unequip(first(G.S.player.equip) || 'chest'),
  unequipBag: () => G.unequipBag(0),
  useItem: () => { give(anyItem((x) => x.slot === 'food') || 'linen_cloth'); G.useItem(G.S.player.bags.length - 1); },
  consume: () => { G.consume('eat'); G.consume('drink'); },
  upgradeItem: () => G.upgradeItem(first(G.S.player.equip) || 'chest'),
  buyHeirloom: () => G.buyHeirloom(Object.keys(D.HEIRLOOMS)[0]),
  buyMonthCloak: () => { const c = G.monthCloak ? G.monthCloak() : null; G.buyMonthCloak(c && c.id ? c.id : 'none'); },
  buyMount: () => G.buyMount(first(D.MOUNTS)),
  setMount: () => G.setMount(null),
  learnRiding: () => G.learnRiding(),
  setWardrobe: () => { G.setWardrobe('chest', 'hidden'); G.setWardrobe('chest', null); },
  setKeepsake: () => G.setKeepsake(first(D.LEGENDS)),
  setLegendOn: () => { const k = first(D.LEGENDS); G.setLegendOn(k, false); G.setLegendOn(k, true); },
  learnTalent: () => { const t = G.talentTree ? Object.keys(G.talentTree(G.S.player.cls) || {})[0] : null; G.learnTalent(t || 'none'); },
  resetTalents: () => G.resetTalents(),
  setRole: () => G.setRole((G.roles() || ['dps'])[0]),
  trainProf: () => G.trainProf(first(D.PROFESSIONS)),
  gather: () => G.gather(),
  gatherNode: () => G.gatherNode(0),
  craft: () => { const r = first(D.RECIPES); G.craft(r, 1); },
  fishStart: () => G.fishStart(true),
  ahPost: () => { give('linen_cloth', 5); G.ahPost(G.S.player.bags.length - 1, 100); },
  ahBuy: () => { const l = (G.ahListings ? G.ahListings() : []) || []; G.ahBuy(l[0] ? l[0].id : 'none'); },
  ahCancel: () => { give('linen_cloth', 5); G.ahPost(G.S.player.bags.length - 1, 100); G.ahCancel(0); }, // Cancel shows once you have a listing
  joinGuild: () => G.joinGuild(0),
  declineGuild: () => G.declineGuild(1),
  bindHere: () => G.bindHere(),
  hearth: () => G.hearth(),
  travelTo: () => { const d = Object.keys(D.PLACES).find((k) => k !== G.S.player.place); G.travelTo(d); },
  travelRoute: () => { const d = Object.keys(D.PLACES).find((k) => k !== G.S.player.place); G.travelRoute(d); },
  cancelTravel: () => { const d = Object.keys(D.PLACES).find((k) => k !== G.S.player.place); G.travelTo(d); G.cancelTravel(); },
  setWarMode: () => { G.setWarMode(true); G.setWarMode(false); },
  setInvites: () => { G.setInvites(false); G.setInvites(true); },
  setSpeed: () => G.setSpeed(2),
};

test('every action a button can call is covered here (or listed as not an action)', () => {
  const missing = [...fromUi].filter((n) => !(n in ACTIONS) && !NOT_ACTIONS.has(n));
  assert.deepStrictEqual(missing, [], `buttons call G.${missing.join(', G.')} but the test does not: add it to ACTIONS`);
  const gone = Object.keys(ACTIONS).filter((n) => typeof G[n] !== 'function');
  assert.deepStrictEqual(gone, [], `ACTIONS lists G.${gone.join(', G.')}, which no longer exists`);
});

for (const [level, cls, race] of [[1, 'warrior', 'human'], [16, 'mage', 'orc'], [60, 'priest', 'dwarf']]) {
  test(`level ${level} ${race} ${cls}: every player action runs without throwing`, async (t) => {
    for (const name of Object.keys(ACTIONS)) {
      await t.test(name, () => { character(level, cls, race); assert.doesNotThrow(() => { ACTIONS[name](); advance(1); }); });
    }
  });
}

test('logging out and back in, and deleting a character, run without throwing', () => {
  const { S } = character(16, 'mage', 'orc'); const id = S.id;
  assert.doesNotThrow(() => { G.save(); G.logout(); G.load(id); });
  assert.ok(G.S && G.S.id === id, 'the character loads back');
  assert.doesNotThrow(() => G.wipeSave());
});
