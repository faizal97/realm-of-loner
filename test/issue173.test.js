// Feedback gaps (#173): ability refusals name the ability and the reason (and the global cooldown says nothing); a loot
// roll that times out says so; a collect objective says where its item comes from, worked out from the data.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, E, character, advance, now } = require('./world');

const toasts = [], infos = [], errors = [];
G.on('toast', (t) => toasts.push(t)); G.on('info', (t) => infos.push(t)); G.on('error', (t) => errors.push(t));

test('ability messages: the name and the reason; cooldown time in whole seconds', () => {
  assert.strictEqual(E.cooldownText('frost_nova', 11.2), `${D.ABILITIES.frost_nova.name} isn't ready (12s)`);
  assert.strictEqual(E.cooldownText('frost_nova', 0.3), `${D.ABILITIES.frost_nova.name} isn't ready (1s)`);
  assert.strictEqual(E.castingText('fireball'), `Still casting ${D.ABILITIES.fireball.name}`);
  const u = { dead: false, auras: [], cds: { frost_nova: 20 }, gcdUntil: 0, res: 1000, resType: 'mana', cast: null };
  const C = { t: 8, units: {} };
  assert.strictEqual(E.canUse(C, u, 'frost_nova'), `${D.ABILITIES.frost_nova.name} isn't ready (12s)`);
  u.cast = { ab: 'fireball' }; assert.strictEqual(E.canUse(C, u, 'frost_nova'), `Still casting ${D.ABILITIES.fireball.name}`);
  u.cast = null; u.gcdUntil = 9; assert.strictEqual(E.canUse(C, u, 'fireball'), E.GCD_WHY);
});

test('out of combat, a cooldown says the same thing', () => {
  const { P } = character(30, 'mage', 'human');
  const ab = Object.keys(D.ABILITIES).find((k) => D.CLASSES.mage.abilities.includes(k) && D.ABILITIES[k].cd && !D.ABILITIES[k].combatOnly && !G.fightBuff(k) && (D.ABILITIES[k].lvl || 1) <= 30);
  P.cds = { [ab]: now() + 7400 };
  assert.strictEqual(G.castOutOfCombat(ab), `${D.ABILITIES[ab].name} isn't ready (8s)`);
});

test('a roll that times out is a pass, said in Loot, and a toast when the card marked it an upgrade', () => {
  const { S, P } = character(35, 'warrior', 'human');
  G.startRoulette(); const R = S.run; delete P.equip.chest; // nothing worn there, so the new chest is an upgrade
  const it = G.genGear('chest', 35, 3, { atype: D.CLASSES.warrior.armorType, affix: G.classAffix('warrior') });
  assert.ok(G.markedUpgrade(it), 'a better chest is marked an upgrade');
  const r = { item: it, until: now() + 1000, left: 1000, choices: {}, player: null, done: false };
  R.rolls.push(r); R.phase = 'rest'; infos.length = 0; const chat0 = S.chat.length;
  advance(2);
  assert.deepStrictEqual(r.player, { c: 'pass', v: 0 });
  assert.ok(S.chat.slice(chat0).some((m) => /^Time ran out: you passed on /.test(m.text)), 'a Loot line');
  assert.deepStrictEqual(infos, [`Time ran out: you passed on ${it.name}.`]);
});

test('collect objectives say where the item comes from', () => {
  const { P } = character(5, 'warrior', 'human');
  const o = D.QUESTS.millys_harvest.objs.find((x) => x.type === 'collect');
  P.place = 'northshire_abbey';
  assert.strictEqual(G.objHint(o), `Collect them in ${D.PLACES.northshire_vineyards.name}`);
  P.place = 'northshire_vineyards';
  assert.strictEqual(G.objHint(o), 'Collect them here');
  const drop = Object.values(D.QUESTS).flatMap((q) => q.objs).find((x) => x.type === 'collect' && !G.objSource(x.item).gather);
  assert.match(G.objHint(drop), /^Dropped by \S/);
  assert.strictEqual(G.objHint({ type: 'kill', mob: 'defias_thug', n: 1 }), null);
  for (const q in D.QUESTS) for (const x of D.QUESTS[q].objs) if (x.type === 'collect') assert.ok(G.objSource(x.item), `${q}: ${x.item} has a source`);
});
