// The cast bar fills smoothly (#116): the fight runs in fixed 0.1 s steps, so a bar drawn from the fight's clock moved
// ten times a second however fast the screen draws. The bar now reads G.fightNow(), the fight's clock plus the time
// already gathered toward the next step: it moves every frame, never runs ahead of the next step, and the cast itself
// still takes exactly as long (the steps are unchanged).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { G, D, character } = require('./world');

function castingMage() {
  const { P } = character(20, 'mage', 'human');
  P.place = Object.keys(D.PLACES).find((k) => { const p = D.PLACES[k]; return p.lvl && p.lvl[0] <= 20 && p.lvl[1] >= 20 && !p.safe && (p.mobs || []).length; });
  const m = G.placeMobs().find((x) => x.state === 'alive'); G.engage(m.id); G.pUnit.res = G.pUnit.maxRes;
  G.useAbility('fireball'); assert.ok(G.pUnit.cast, 'casting Fireball');
  return { C: G.fight, cast: G.pUnit.cast };
}

test('at 60 frames a second the cast bar moves every frame; the fight still steps every 0.1 s', () => {
  const { C, cast } = castingMage();
  const frames = []; let steps = 0, lastT = C.t;
  for (let i = 0; i < 60 && G.pUnit && G.pUnit.cast === cast; i++) {
    G.update(1 / 60);
    if (C.t !== lastT) { steps++; lastT = C.t; }
    const now = G.fightNow();
    assert.ok(now >= C.t - 1e-9 && now < C.t + 0.1 + 1e-9, `the bar's clock stays within one step of the fight (${now} vs ${C.t})`);
    frames.push((now - cast.start) / (cast.end - cast.start));
  }
  const still = frames.slice(1).filter((p, i) => p <= frames[i]).length;
  assert.strictEqual(still, 0, `the fill grew on every frame (${still} of ${frames.length - 1} frames stood still)`);
  assert.ok(steps >= 9 && steps <= 11, `the fight itself stepped every 0.1 s (${steps} steps in ${frames.length} frames)`);
});

test('the cast still finishes on the same step as before', () => {
  const { C, cast } = castingMage();
  const end = cast.end; let doneAt = null;
  for (let i = 0; i < 600 && doneAt == null; i++) { G.update(1 / 60); if (!G.pUnit || G.pUnit.cast !== cast) doneAt = C.t; }
  assert.ok(doneAt != null && doneAt >= end - 1e-9 && doneAt < end + 0.1 + 1e-9, `finished at ${doneAt}, due at ${end}`);
});
