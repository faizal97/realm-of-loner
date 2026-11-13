// The scene's camera keeps every fighter on screen, a full raid that used Step Back included: the front-to-back step
// between allies (#567) shrinks with the camera instead of pushing the back of a raid off the left edge.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const src = fs.readFileSync(require('path').join(__dirname, '../src/ui.js'), 'utf8');
const at = src.indexOf('  const M_MAX = ');
const fnAt = src.indexOf('  function sceneScale(');
const consts = src.slice(at, src.indexOf('\n', at)) + '\n' + src.slice(src.indexOf('  const CONTACT = '), src.indexOf('\n', src.indexOf('  const CONTACT = ')));
const body = src.slice(fnAt, src.indexOf('\n  }\n', fnAt) + 4);

function scene(allies, enemies, W = 360, w = 30) {
  const els = { scene: { clientWidth: W, querySelector: () => null } }, ui = { spriteEls: {} };
  const sceneScale = new Function('els', 'ui', consts + '\n' + body + '; return sceneScale;')(els, ui);
  for (const u of allies.concat(enemies)) ui.spriteEls[u.uid] = { offsetLeft: u.o, offsetWidth: w };
  const C = { t: 10, allies, enemies };
  const { dx } = sceneScale(C);
  return { W, xs: allies.concat(enemies).filter((u) => !u.dead).map((u) => ({ uid: u.uid, l: u.o + dx[u.uid], r: u.o + dx[u.uid] + w })) };
}
const unit = (uid, side, o, x, x0) => ({ uid, side, o, pos: { x, y: 0 }, pos0: { x: x0, y: 0 } });

test('a 10-player raid where half the group stepped back stays on screen (a PC-wide scene, a boss and adds)', () => {
  // the raid's formation: two rows of five on the left; every other raider hopped 8 m back from where the fight began
  const allies = []; for (let i = 0; i < 10; i++) { const x0 = -0.05 - (i % 5) * 0.01; allies.push(unit('a' + i, 'ally', 10 + (i % 5) * 40, i % 2 ? x0 - 0.008 * 8 : x0, x0)); }
  const enemies = [unit('e0', 'enemy', 330, 0.05, 0.05), unit('e1', 'enemy', 400, 0.06, 0.06), unit('e2', 'enemy', 470, 0.07, 0.07)];
  const { W, xs } = scene(allies, enemies, 560, 56);
  for (const s of xs) assert.ok(s.l >= -0.15 * W && s.r <= 1.15 * W, `${s.uid} at ${Math.round(s.l)}..${Math.round(s.r)} of ${W}`);
});

test('a 5-player group in contact keeps the full step between allies', () => {
  const allies = []; for (let i = 0; i < 5; i++) allies.push(unit('a' + i, 'ally', 20 + i * 30, -0.02 - i * 0.005, -0.02 - i * 0.005));
  const { W, xs } = scene(allies, [unit('e0', 'enemy', 300, 0.02, 0.02)]);
  const a = xs.filter((s) => s.uid[0] === 'a').map((s) => s.l + 15).sort((p, q) => q - p);
  for (let i = 1; i < a.length; i++) assert.ok(a[i - 1] - a[i] >= 0.06 * W - 0.5, `step ${i}: ${(a[i - 1] - a[i]).toFixed(1)}px`);
});
