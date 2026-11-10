// #498: the game's own guild offer didn't check whether you'd already joined a guild another way, so an invitation from a
// different guild opened anyway and Accept moved you. A pending offer is dropped once you're in a guild.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const W = require('./world');
const { G } = W;

test('no guild invitation once you are in a guild', () => {
  W.setNow(new Date(2026, 10, 3, 20).getTime());
  const got = []; G.on('invite', (d) => { if (d.guild != null) got.push(d); });
  for (let i = 0; i < 30; i++) {
    const { S } = W.character(30); S.player.guild = 0;
    Object.assign(S.flags, { guildOffer: false, guildOfferAt: W.now() - 1 }); W.advance(2);
    assert.strictEqual(S.player.guild, 0);
  }
  assert.strictEqual(got.length, 0, `${got.length} invitations while in a guild`);
});
