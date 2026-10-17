// Interrupts (#179, docs/plans/2026-10-17-telegraphs-design.md): every class has one, on the same rules (free, instant,
// 12 sec cooldown, from level 6), so no class answers a telegraphed cast better than another. A stun answers a cast
// too. Defensives (`defensive`) answer a telegraphed hit on the tank.
(function (root) {
  const D = root.D;
  const INT = {
    warrior: ['hilt_bash', 'Hilt Bash'], rogue: ['throat_jab', 'Throat Jab'],
    mage: ['spellbreak', 'Spellbreak'], priest: ['hush', 'Hush'],
    shaman: ['storm_snap', 'Storm Snap'], warlock: ['choke_hex', 'Choke Hex'],
    hunter: ['pinning_shot', 'Pinning Shot'], paladin: ['stern_word', 'Stern Word'],
    druid: ['thornlash', 'Thornlash'], bard: ['sour_note', 'Sour Note'],
  };
  D.INTERRUPTS = {};
  for (const cls in INT) {
    const [id, name] = INT[cls];
    D.ABILITIES[id] = { id, name, cls, lvl: 6, cost: 0, cd: 12, gcd: false, target: 'enemy', combatOnly: true, interrupt: true, icon: id,
      desc: 'Cut off the target\'s cast. A boss\'s red-barred heal or spell is cancelled. 12 sec cooldown.' };
    D.CLASSES[cls].abilities.push(id); D.INTERRUPTS[cls] = id;
  }
  for (const id of ['shield_wall', 'divine_protection', 'holy_shield', 'barkskin']) D.ABILITIES[id].defensive = true;
  // a bear tank answers too: Step Back, Thornlash and Barkskin work in Bear Form (one is never punished for an answer it can't press)
  for (const id of ['step_back', 'thornlash', 'barkskin']) D.ABILITIES[id].anyForm = true;
})(typeof window !== 'undefined' ? window : globalThis);
