// Realm of Loner — combat engine. No DOM: runs in the page and in Node sims.
// A fight is a set of units on two sides. Solo play is a party of one.
(function (root) {
  const D = root.D;
  const E = {};
  const rnd = (a, b) => a + Math.random() * (b - a);
  const rint = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  E.rnd = rnd; E.rint = rint; E.clamp = clamp;
  let UID = 1;

  // ------------------------------------------------------------- character stats
  // char: {name, cls, level, equip:{slot:item}}; extra: additive stats from auras
  // ---------- talents: every talent is data (src/data/talents.js); merge a character's into one mods object
  const TM_CACHE = new Map();
  const EMPTY_TM = { stat: {}, pct: {}, crit: 0, spellCrit: 0, dodge: 0, haste: 0, school: {}, heal: 0, abilDmg: {}, abilHeal: {}, dot: {}, hot: {}, abilCost: {}, abilCd: {}, abilCast: {}, buff: {}, shield: {}, taken: 0, threat: 0, pet: 0 };
  E.talentMods = function (char) {
    const tl = char && char.talents;
    if (!tl || !D.TALENTS || !D.TALENTS[char.cls]) return EMPTY_TM;
    const sig = char.cls + JSON.stringify(tl);
    let m = TM_CACHE.get(sig);
    if (m) return m;
    m = JSON.parse(JSON.stringify(EMPTY_TM));
    for (const tree of D.TALENTS[char.cls]) for (const t of tree.talents) {
      const r = tl[t.id] || 0; if (!r) continue;
      for (const fx of t.fx) {
        const v = fx.v * r;
        if (fx.k === 'stat') m.stat[fx.stat] = (m.stat[fx.stat] || 0) + v;
        else if (fx.k === 'pct') m.pct[fx.stat] = (m.pct[fx.stat] || 0) + v;
        else if (fx.k === 'school') m.school[fx.school] = (m.school[fx.school] || 0) + v;
        else if (fx.ab) for (const a of fx.ab) m[fx.k][a] = (m[fx.k][a] || 0) + v;
        else m[fx.k] += v;
      }
    }
    if (TM_CACHE.size > 500) TM_CACHE.clear();
    TM_CACHE.set(sig, m);
    return m;
  };
  const tmOf = (u) => E.talentMods(u && (u.char || u));
  const abPct = (tbl, id) => (tbl[id] || 0) + (tbl['*'] || 0);
  E.abPct = abPct;
  // A synced character (group finder) fights at syncLevel; its gear stays, which is the overgear bonus.
  E.levelOf = (char) => (char.syncLevel ? Math.min(char.level, char.syncLevel) : char.level);
  E.statsFor = function (char, extra) {
    const C = D.CLASSES[char.cls];
    const L = E.levelOf(char);
    const s = { armor: C.baseArmor + L * 2, sp: 0, ap: 0, dodge: 0, haste: 0 };
    for (const k of ['str', 'agi', 'sta', 'int', 'spi']) s[k] = Math.round(C.base[k] + C.gain[k] * (L - 1));
    const add = (st) => { if (st) for (const k in st) s[k] = (s[k] || 0) + st[k]; };
    let weapon = null;
    for (const slot in (char.equip || {})) {
      const it = char.equip[slot];
      if (!it) continue;
      add(it.stats);
      if (it.armor) s.armor += it.armor;
      if (it.sp) s.sp += it.sp;
      if (slot === 'weapon') weapon = it;
    }
    const ranged = (char.equip || {}).ranged;
    add(extra);
    const TM = E.talentMods(char);
    add(TM.stat);
    for (const k of ['str', 'agi', 'sta', 'int', 'spi']) if (TM.pct[k]) s[k] = Math.round(s[k] * (1 + TM.pct[k] / 100));
    if (TM.pct.armor) s.armor = Math.round(s.armor * (1 + TM.pct.armor / 100));
    s.dodge += TM.dodge; s.haste += TM.haste;
    const RP = (D.RACIALS[char.race || (char.bot && char.bot.race) || 'human'] || {}).passives || {};
    if (RP.spiPct) s.spi = Math.round(s.spi * (1 + RP.spiPct / 100));
    if (RP.intPct) s.int = Math.round(s.int * (1 + RP.intPct / 100));
    if (RP.dodge) s.dodge += RP.dodge;
    if (s.bear) { s.sta = Math.round(s.sta * 1.25); s.armor = Math.round(s.armor * 2.8); }
    if (s.bonusArmor) { s.armor += s.bonusArmor; delete s.bonusArmor; }
    s.maxHp = Math.max(20, C.baseHp + s.sta * 10 + (L - 1) * C.hpPerLvl);
    if (RP.hpPct) s.maxHp = Math.round(s.maxHp * (1 + RP.hpPct / 100));
    if (TM.pct.hp) s.maxHp = Math.round(s.maxHp * (1 + TM.pct.hp / 100));
    s.maxMana = C.resource === 'mana' ? Math.max(50, C.baseMana + s.int * 15 + (L - 1) * C.manaPerLvl) : 0;
    if (TM.pct.mana) s.maxMana = Math.round(s.maxMana * (1 + TM.pct.mana / 100));
    let ap;
    if (char.cls === 'warrior') ap = 3 * L + 2 * s.str - 20;
    else if (char.cls === 'rogue' || char.cls === 'hunter') ap = 2 * L + s.str + s.agi - 20;
    else if (char.cls === 'paladin') ap = 3 * L + 2 * s.str - 20;
    else if (char.cls === 'shaman') ap = 2 * L + 2 * s.str - 20;
    else if (char.cls === 'druid' && s.bear) ap = 3 * L + 2 * s.str - 20;
    else ap = s.str - 10;
    s.apTotal = Math.max(0, ap + s.ap);
    s.crit = 5 + s.agi / 20 + TM.crit + (s.critPct || 0); // critPct: a flat crit chance from a buff (v10.10)
    s.spellCrit = 5 + s.int / 60 + TM.spellCrit + (s.critPct || 0);
    s.dodgeTotal = 5 + s.agi / 20 + s.dodge;
    let w = weapon || { dmg: [1, 2], speed: 2.0 };
    if (s.bear) { const dps = 2 + L * 0.8; w = { dmg: [dps * 2.5 * 0.8, dps * 2.5 * 1.2], speed: 2.5 }; }
    s.wMin = w.dmg[0] + (s.wdmg || 0); s.wMax = w.dmg[1] + (s.wdmg || 0); s.wSpeed = w.speed;
    s.swing = w.speed / (1 + s.haste / 100);
    if (ranged && char.cls === 'hunter') {
      s.rMin = ranged.dmg[0]; s.rMax = ranged.dmg[1]; s.rSpeed = ranged.speed;
      s.rswing = ranged.speed / (1 + s.haste / 100);
      s.rap = Math.max(0, 2 * L + 2 * s.agi - 10 + s.ap);
    }
    return s;
  };

  // ------------------------------------------------------------- mob numbers
  E.mobHp = (L) => Math.round(0.85 * (28 + 14 * L + 0.6 * L * L));
  E.mobDmg = (L) => [1 + L * 1.3, 2 + L * 1.9];

  // ------------------------------------------------------------- units
  const flat = (u) => u.kind === 'mob' || u.kind === 'pet';
  E.flat = flat;
  function baseUnit(o) {
    return Object.assign({
      uid: UID++, dead: false, swingT: rnd(0.3, 1.2), castT: 0, cast: null, gcdUntil: 0, cds: {}, auras: [],
      threat: {}, target: null, cp: 0, cpTarget: null, lastCastT: -99, stunUntil: 0, auto: true, hitCount: 0,
    }, o);
  }

  // ------------------------------------------------------------- distance (v10.9, docs/plans/2026-10-01-distance-design.md)
  // Every fighter has a position in metres: x along the line between the sides (allies left, enemies right), y depth
  // across the ground, z height (flyers). Distance is true 3D. Everyone runs at the same speed; snares slow movement as
  // well as attacks, roots stop it. Every ability has a range (data `range`, else a default from its kind). Stage 1:
  // fights start in contact (everyone within reach, as before), so outcomes do not change until something moves.
  const DIST = { speed: 7, melee: 5, spell: 30, shot: 35, ally: 40, radius: 8, flyLow: 4, back: 18, backLine: 20, boltMult: 0.8 };
  // flyers (stage 4): low for `low` seconds (they attack and melee reaches them), then up for `up` seconds (out of melee
  // reach, and they cannot attack either); a stunned or rooted flyer cannot stay up. Heights in metres, climb in m/s.
  const FLY = E.FLY = { low: 8, up: 2, dive: 1.5, climb: 8 }; // backLine: where a group's casters, hunters and healers start // back: how far behind its line a ranged fighter starts (stage 4)
  E.DIST = DIST;
  const CASTERS = { mage: 1, warlock: 1, priest: 1, druid: 1, shaman: 1, bard: 1 };
  E.dist = (a, b) => { const p = a.pos || {}, q = b.pos || {}; return Math.hypot((p.x || 0) - (q.x || 0), (p.y || 0) - (q.y || 0), (p.z || 0) - (q.z || 0)); };
  // the range of an ability: its own, else from its kind (null: no target, nothing to reach)
  function rangeOf(ab) {
    if (ab.range != null) return ab.range;
    if (ab.target === 'self' || ab.target === 'party') return null;
    if (ab.target === 'ally') return DIST.ally;
    if (ab.taunt) return DIST.spell; // a taunt reaches a monster that ran past the tank to the back line (stage 4)
    if (ab.target === 'aoe') return aoeAtTarget(ab) ? (ab.cls === 'hunter' ? DIST.shot : DIST.spell) : null;
    if (ab.dmg && ab.dmg.weapon) return DIST.melee;
    if (ab.cls === 'hunter') return DIST.shot;
    if (ab.dmg && (ab.dmg.school || 'physical') === 'physical') return DIST.melee;
    if (!ab.dmg && (ab.cls === 'rogue' || ab.cls === 'warrior')) return DIST.melee;
    return DIST.spell;
  }
  E.rangeOf = rangeOf;
  // an area attack lands around its caster when instant (Frost Nova, Whirlwind), around the target when cast, channelled
  // or shot (Frost Storm, Flamestrike, Multi-Shot); `aoeAt` in data overrides
  const aoeAtTarget = (ab) => (ab.aoeAt ? ab.aoeAt === 'target' : !!(ab.cast || ab.channel || ab.cls === 'hunter'));
  // how close a fighter wants to be to its target to fight: melee in reach, casters and hunters at range
  function reachOf(u) {
    if (u.kind === 'mob') return (D.MOBS[u.key] || {}).ranged ? DIST.spell - 2 : DIST.melee - 1;
    if (u.kind === 'pet') return DIST.melee - 1;
    if (u.form === 'bear') return DIST.melee - 1;
    if (u.cls === 'hunter') return DIST.shot - 5;
    return CASTERS[u.cls] ? DIST.spell - 2 : DIST.melee - 1;
  }
  E.reachOf = reachOf;
  // where a fighter stands when a fight begins: in contact (stage 1), or `apart` metres from the other side
  // stage 4: in a group with a tank, its casters, hunters and healers start behind the line (the tank holds the front);
  // alone, in a duel (which starts apart) or with no tank, everyone starts in contact as before
  function backLine(C, u) {
    if (u.kind === 'mob' || u.kind === 'pet' || u.role === 'tank' || (C.opts && C.opts.apart)) return false;
    const side = u.side === 'ally' ? C.allies : C.enemies;
    return side.some((a) => a !== u && a.role === 'tank' && a.kind !== 'pet') && (u.role === 'healer' || reachOf(u) > DIST.melee);
  }
  function place(C, u, i) {
    const s = u.side === 'ally' ? -1 : 1, gap = (C.opts && C.opts.apart) || 0;
    const M = u.kind === 'mob' ? D.MOBS[u.key] || {} : {}, fly = M.fly; u.backLine = !M.ranged && backLine(C, u);
    const back = M.ranged ? DIST.back : u.backLine ? DIST.backLine : 0; // stage 4: archers, casters and healers start behind their line
    const contact = s * (0.5 + Math.random() * 1.2);
    u.pos = { x: contact + s * (gap / 2 + back), y: (Math.random() * 2 - 1), z: fly || 0 };
    // the scene draws a fighter moved by how far it is from here: where it would stand in contact, or for a group's back
    // line its own start (the scene gives it a back slot, so the slot already shows the distance)
    u.pos0 = { x: u.backLine ? u.pos.x - s * gap / 2 : contact, y: u.pos.y, z: u.pos.z };
  }
  // a flyer's height for a tick: it starts up and comes down, then goes up again for a moment every so often
  function flyTick(C, u, dt) {
    const hi = (D.MOBS[u.key] || {}).fly; if (!hi || !u.pos || u.dead) return;
    if (u.flyT == null) { u.flyT = 0; u.flyUp = true; u.flyNext = C.t + FLY.up; } // it arrives on the wing
    if (C.t >= u.flyNext) { u.flyUp = !u.flyUp; u.flyNext = C.t + (u.flyUp ? FLY.up : FLY.low); }
    const grounded = stunned(C, u) || u.auras.some((a) => a.root);
    const want = u.flyUp && !grounded ? hi : FLY.dive, z = u.pos.z || 0, step = FLY.climb * dt;
    u.pos.z = Math.abs(want - z) <= step ? want : z + Math.sign(want - z) * step;
  }
  // movement for a tick: a fleeing fighter runs from the one who scared it; anyone else closes on its target when out
  // of its reach. A fighter casting stands still for it. Roots stop it; snares slow it like they slow attacks.
  function moveTick(C, u, dt) {
    if (!u.pos) return;
    if (u.closedAt == null) { const t0 = C.units[u.target]; if (t0 && t0.pos && E.dist(u, t0) <= DIST.melee + 0.5) u.closedAt = C.t; } // first time in melee reach (openers)
    const rooted = u.auras.some((a) => a.root);
    const speed = moveSpeed(u) * dt;
    if (u.fleeUntil > C.t) {
      if (rooted) return;
      const from = C.units[u.fleeFrom]; if (!from || !from.pos) return;
      stepAway(u, from, speed); return;
    }
    if (rooted || stunned(C, u)) return;
    if (u.cast) return; // a fighter who chose to cast stands still for it (the run to close in or to kite waits)
    if (u.kiteUntil > C.t) { const f = C.units[u.target]; if (f && f.pos && !f.dead) { stepAway(u, f, speed); return; } }
    const t = C.units[u.target]; if (!t || t.dead || t.side === u.side || !t.pos) return;
    const d = E.dist(u, t), want = reachOf(u);
    if (d <= want + 0.5) return;
    const hd = Math.hypot(t.pos.x - u.pos.x, t.pos.y - u.pos.y);
    if (hd <= want + 0.5) return; // right under (or over) it: running cannot close a height
    stepToward(u, t, Math.min(speed, hd - want));
  }
  // each move notes when and which way (the scene shows a run, and turns a fighter that runs away)
  function stepToward(u, t, m) { const dx = t.pos.x - u.pos.x, dy = t.pos.y - u.pos.y, h = Math.hypot(dx, dy) || 1; u.pos.x += dx / h * m; u.pos.y += dy / h * m; u.moveX = dx / h * m; u.movedAt = u.clock; }
  function stepAway(u, t, m) { const dx = u.pos.x - t.pos.x, dy = u.pos.y - t.pos.y, h = Math.hypot(dx, dy) || 1, ux = dx / h || (u.side === 'ally' ? -1 : 1); u.pos.x += ux * m; u.pos.y += dy / h * m; u.moveX = ux * m; u.movedAt = u.clock; }
  E.stepAway = stepAway;

  // Player or bot. char carries hp/res between fights; persistent auras use epoch ms (until).
  E.charUnit = function (char, side, kind, nowMs) {
    const C = D.CLASSES[char.cls];
    const u = baseUnit({ side, kind, char, name: char.name, cls: char.cls, level: E.levelOf(char), resType: C.resource, role: char.role || C.role, race: char.race || (char.bot && char.bot.race) || 'human' });
    for (const a of (char.auras || [])) {
      const left = (a.until - nowMs) / 1000;
      if (left > 0) u.auras.push({ id: a.id, until: left, stats: a.stats, src: null, persistent: true, seal: a.seal, sealSchool: a.sealSchool, thorns: a.thorns, name: a.name, icon: a.icon, keep: a.keep });
    }
    // cooldowns run on in real time between fights (epoch ms in char.cds; a fight's clock starts at 0)
    for (const id in (char.cds || {})) { const left = (char.cds[id] - nowMs) / 1000; if (left > 0) u.cds[id] = left; }
    u.legend = char.legend || null;
    u.effects = E.itemEffects(char); // item effects (v10.10)
    E.recalc(u, true);
    u.hp = char.hp == null ? u.maxHp : clamp(char.hp, 1, u.maxHp);
    u.maxRes = C.resource === 'mana' ? u.st.maxMana : 100;
    if (C.resource === 'rage') u.res = clamp(char.res || 0, 0, 100);
    else if (C.resource === 'energy') u.res = 100;
    else u.res = char.res == null ? u.maxRes : clamp(char.res, 0, u.maxRes);
    return u;
  };

  E.recalc = function (u, first) {
    if (flat(u)) return;
    const extra = {};
    // an elixir's armour is bonus armour: bear form does not multiply it (v10.9, the modest edge)
    for (const a of u.auras) { if (a.stats) for (const k in a.stats) { const kk = k === 'armor' && a.id === 'elixir' ? 'bonusArmor' : k; extra[kk] = (extra[kk] || 0) + a.stats[k]; } if (a.bear) extra.bear = 1; }
    const oldMax = u.maxHp;
    u.st = E.statsFor(u.char, extra);
    u.maxHp = u.st.maxHp;
    if (!first && oldMax && u.maxHp > oldMax) u.hp += u.maxHp - oldMax;
    if (u.hp > u.maxHp) u.hp = u.maxHp;
    if (u.resType === 'mana') { u.maxRes = u.st.maxMana; if (u.res > u.maxRes) u.res = u.maxRes; }
  };

  // mult: {hp, dmg} from dungeon; opts.level override
  // early creatures take longer to bring down (#119): from level 4 a fight lasted 4-7 s, too short to use much of a kit.
  // Read from the creature's level, so every starting region gets it; 1-3 (the first steps) and 8 and up are unchanged.
  E.EARLY_HP = { 4: 1.4, 5: 1.4, 6: 1.3, 7: 1.2 };
  E.mobUnit = function (key, level, mult) {
    const M = D.MOBS[key];
    const L = level || rint(M.lvl[0], M.lvl[1]);
    mult = mult || { hp: 1, dmg: 1 };
    const hp = Math.round(E.mobHp(L) * (E.EARLY_HP[L] || 1) * (M.hpMult || 1) * mult.hp);
    const [a, b] = E.mobDmg(L);
    const dm = (M.dmgMult || 1) * mult.dmg;
    return baseUnit({
      side: 'enemy', kind: 'mob', key, name: M.name, level: L, elite: !!(M.elite || M.boss), boss: !!M.boss,
      maxHp: hp, hp, res: 0, maxRes: 0, resType: null, dmg: [a * dm, b * dm], swingSpeed: 2.0,
      armor: L * 20, dodge: 5, crit: 5, special: M.special ? { kind: M.special, t: SPECIAL_FIRST, phase: 0, text: M.specialText || null, summon: M.summon || null } : null,
      swingT: rnd(1.4, 2.2),
    });
  };

  // Warlock demons fight on the player's side with a flat stat block, like mobs.
  E.petUnit = function (type, level, owner) {
    const Pd = D.PETS[type];
    const L = level;
    const hp = Math.round(E.mobHp(L) * Pd.hpMult);
    const [a, b] = E.mobDmg(L);
    const dm = Pd.dmgMult || 0.4;
    return baseUnit({
      side: 'ally', kind: 'pet', key: type, mob: owner && owner.mob, name: (owner && owner.petName) || Pd.name, level: L, owner: owner ? owner.uid : null,
      maxHp: hp, hp, res: 0, maxRes: 0, resType: null, dmg: [a * dm, b * dm], swingSpeed: 2.0,
      armor: Math.round(L * 20 * (Pd.armorMult || 1)), dodge: 5, crit: 5, noMelee: !!Pd.noMelee, threatMult: Pd.threatMult || 1,
      role: type === 'voidwalker' ? 'pettank' : 'petdps', swingT: rnd(0.6, 1.2), petT: 0.8,
    });
  };

  function petThink(C, u) {
    const Pd = D.PETS[u.key];
    const owner = C.units[u.owner];
    const tank = alive(C.allies).find((a) => a.role === 'tank');
    // attack what the owner (or the group's tank) is attacking
    const want = (owner && C.units[owner.target] && !C.units[owner.target].dead && C.units[owner.target]) || (tank && C.units[tank.target]) || alive(C.enemies)[0];
    if (!want) return;
    u.target = want.uid;
    u.petT -= 0.1;
    if (u.petT > 0) return;
    if (Pd.spell) {
      u.petT = Pd.spell.every;
      const r = Math.random() * 100;
      if (r < 5) { ev(C, { type: 'avoid', src: u.uid, tgt: want.uid, what: 'resist', ab: 'firebolt' }); return; }
      const d = rnd(Pd.spell.dmg[0], Pd.spell.dmg[1]) + Pd.spell.perLvl * u.level;
      dealDamage(C, u, want, r < 10 ? d * 1.5 : d, { school: Pd.spell.school, crit: r < 10, ab: 'firebolt' });
    } else if (Pd.torment) {
      u.petT = Pd.torment.every;
      // Torment: pull a mob that is hitting the warlock
      const onOwner = alive(C.enemies).find((e) => owner && e.target === owner.uid);
      if (onOwner) {
        const top = Math.max(0, ...Object.values(onOwner.threat));
        onOwner.threat[u.uid] = top + 5; onOwner.target = u.uid;
        ev(C, { type: 'taunt', src: u.uid, tgt: onOwner.uid, ab: 'torment' });
      }
    }
  }

  // ------------------------------------------------------------- fight
  E.fight = function (allies, enemies, opts) {
    const C = { t: 0, allies: allies.slice(), enemies: enemies.slice(), units: {}, events: [], over: null, opts: opts || {}, allyTarget: null };
    for (const u of allies.concat(enemies)) C.units[u.uid] = u;
    allies.concat(enemies).forEach((u, i) => place(C, u, i));
    for (const e of enemies) for (const a of allies) e.threat[a.uid] = 0;
    // mobs open on whoever pulled (first ally) unless told otherwise
    const puller = (opts && opts.puller) || allies[0];
    for (const e of enemies) { e.threat[puller.uid] = 1; e.target = puller.uid; }
    for (const a of allies) if (!a.target && enemies[0]) a.target = enemies[0].uid;
    for (const e of enemies) if (D.MOBS[e.key] && D.MOBS[e.key].aggro && Math.random() < 0.8) say(C, e, D.MOBS[e.key].aggro, 'monster');
    return C;
  };

  function ev(C, o) { o.t = C.t; C.events.push(o); }
  function say(C, u, text, ch) { ev(C, { type: 'say', uid: u.uid, name: u.name, text, ch: ch || 'party' }); }
  E.say = say;
  const alive = (arr) => arr.filter((u) => !u.dead);
  E.alive = alive;
  const foes = (C, u) => (u.side === 'ally' ? C.enemies : C.allies);
  const friends = (C, u) => (u.side === 'ally' ? C.allies : C.enemies);

  E.addEnemy = function (C, e) {
    C.enemies.push(e); C.units[e.uid] = e; place(C, e);
    for (const a of C.allies) e.threat[a.uid] = 0;
    const aa = alive(C.allies);
    const pick = aa[rint(0, aa.length - 1)];
    if (pick) { e.threat[pick.uid] = 1; e.target = pick.uid; }
  };

  E.addAlly = function (C, a) {
    C.allies.push(a); C.units[a.uid] = a; place(C, a);
    for (const e of C.enemies) if (e.threat[a.uid] == null) e.threat[a.uid] = 0;
  };

  function auraOf(u, id) { return u.auras.find((a) => a.id === id); }
  E.auraOf = auraOf;
  function addAura(C, u, a) {
    const old = auraOf(u, a.id);
    if (old) Object.assign(old, a); else u.auras.push(a);
    if (a.stats) E.recalc(u);
  }
  // Reactions (v10.4, D.PROCS): an event lights an ability for a few seconds. A lit ability may be free, instant, or have
  // its cooldown reset; using it spends the light. The UI shows the glow, a callout and a one-time card.
  function knows(u, id) { const A = D.ABILITIES[id]; return !!A && A.cls === u.cls && A.lvl <= (u.level || 1); }
  function proc(C, u, on, abId) {
    const list = u && u.cls && !u.dead && D.PROCS && D.PROCS[u.cls]; if (!list) return;
    for (const p of list) {
      if (!p.on.includes(on) || (p.from && !p.from.includes(abId)) || (p.minLvl && (u.level || 1) < p.minLvl) || (p.talent && !((u.char && u.char.talents) || {})[p.talent]) || (p.chance != null && Math.random() >= p.chance)) continue;
      if (!p.lights.some((l) => knows(u, l))) continue;
      u.procAt = u.procAt || {}; const pk = p.aura || p.on[0];
      if (p.icd && C.t - (u.procAt[pk] != null ? u.procAt[pk] : -99) < p.icd) continue; // icd: at most one light per so many seconds
      u.procAt[pk] = C.t;
      const had = p.aura && auraOf(u, p.aura);
      if (p.aura) addAura(C, u, { id: p.aura, until: C.t + p.dur, proc: p });
      if (p.reset) for (const l of p.lights) u.cds[l] = 0;
      if (!had) ev(C, { type: 'proc', src: u.uid, key: p.aura || p.on[0], ab: p.lights.find((l) => knows(u, l)) });
    }
  }
  E.proc = proc;
  const litAura = (u, abId) => (u.auras || []).find((a) => a.proc && a.proc.lights.includes(abId));
  E.lit = (u, abId) => !!litAura(u, abId);
  function stunned(C, u) { return u.stunUntil > C.t; }
  function slowPct(u) {
    let p = 0;
    for (const a of u.auras) if (a.slow) p = Math.max(p, a.slow);
    return p;
  }
  // how fast a fighter runs: 7 m/s, cut by its strongest snare, raised by its strongest speed buff (Sprint)
  function moveSpeed(u) {
    let up = 0; for (const a of u.auras) if (a.speed) up = Math.max(up, a.speed);
    return DIST.speed * (1 - slowPct(u) / 100) * (1 + up / 100);
  }

  // ------------------------------------------------------------- damage / heal
  function levelDiff(att, tgt) { return (tgt.level || 1) - (att.level || 1); }

  function dealDamage(C, src, tgt, amount, o) {
    if (tgt.dead) return 0;
    o = o || {};
    if (tgt.auras.some((a) => a.immune)) { ev(C, { type: 'avoid', src: src.uid, tgt: tgt.uid, what: 'immune', ab: o.ab || null }); return 0; }
    const om = C.opts.omens; // Trials Omens (v10.4)
    if (om && tgt.boss && om.includes('guarded') && root.TRIALS && C.enemies.some((x) => !x.dead && x !== tgt)) amount *= root.TRIALS.OMENS.guarded.taken;
    if (om && tgt.side === 'enemy' && !tgt.focus && om.includes('warded') && root.TRIALS && C.enemies.some((x) => !x.dead && x.focus)) amount *= root.TRIALS.OMENS.warded.taken;
    if (om && tgt.focus && om.includes('sheltered') && C.enemies.some((x) => !x.dead && x !== tgt)) { ev(C, { type: 'avoid', src: src.uid, tgt: tgt.uid, what: 'immune', ab: o.ab || null }); return 0; } // Sheltered
    if (om && src.side === 'enemy') {
      const OM = (root.TRIALS && root.TRIALS.OMENS) || {};
      if (om.includes('frenzied') && OM.frenzied && src.hp < src.maxHp * OM.frenzied.below) amount *= OM.frenzied.dmg;
      if (src.rally && OM.rallying) amount *= 1 + OM.rallying.dmg * src.rally;
      if (src.vengeance && OM.vengeful) amount *= OM.vengeful.dmg;
      if (om.includes('enraging') && OM.enraging && src.boss) amount *= 1 + OM.enraging.dmg * Math.floor(C.t / OM.enraging.every);
    }
    if (auraOf(tgt, 'hunters_mark') && (src.cls === 'hunter' || (src.kind === 'pet' && C.units[src.owner] && C.units[src.owner].cls === 'hunter'))) amount *= 1.1;
    const tRP = tgt.race && D.RACIALS[tgt.race] && D.RACIALS[tgt.race].passives;
    if (tRP && tRP.resist && o.school && tRP.resist[o.school]) amount *= 1 - tRP.resist[o.school] / 100;
    const sRP = src.race && D.RACIALS[src.race] && D.RACIALS[src.race].passives;
    if (sRP && sRP.beastPct && tgt.kind === 'mob' && D.MOBS[tgt.key] && D.MOBS[tgt.key].family === 'beast') amount *= 1 + sRP.beastPct / 100;
    if (src.kind === 'pet' && C.units[src.owner] && C.units[src.owner].race === 'orc') amount *= 1.05;
    // talents: school and ability damage for the attacker, damage taken for the target
    if (src.char) { const sm = tmOf(src); amount *= 1 + ((sm.school[o.school || 'physical'] || 0) + (o.ab ? sm.abilDmg[o.ab] || 0 : 0)) / 100; }
    let ghExtra = 0; const ghS = !o.effect && fxOf(src, 'glass_heart'), ghT = fxOf(tgt, 'glass_heart'); // Glass Heart (v10.10)
    if (ghS) { ghExtra = D.EFFECTS.glass_heart.dmg * ghS.f; amount *= 1 + ghExtra; } /* the bonus grows with upgrades, the extra damage taken doesn't (#37) */ if (ghT) amount *= 1 + D.EFFECTS.glass_heart.taken;
    if (tgt.char) { const tt = tmOf(tgt); if (tt.taken) amount *= 1 - tt.taken / 100; }
    let dmg = Math.max(1, Math.round(amount));
    if (o.school === 'physical' || !o.school) {
      const armor = flat(tgt) ? tgt.armor : tgt.st.armor;
      const dr = clamp(armor / (armor + 400 + 85 * (src.level || 1)), 0, 0.75);
      dmg = Math.max(1, Math.round(dmg * (1 - dr)));
    }
    let absorbed = 0;
    for (const sh of tgt.auras.filter((a) => a.absorb > 0)) { // a priest's shield, or an effect's guard (v10.10)
      if (dmg <= 0) break; const take = Math.min(sh.absorb, dmg); sh.absorb -= take; dmg -= take; absorbed += take;
      if (sh.effect) fxDone(C, (sh.src != null && C.units[sh.src]) || tgt, sh.effect, take, 'shield'); // credited to whoever's effect raised it
    }
    if (absorbed) tgt.auras = tgt.auras.filter((a) => !(a.absorb != null && a.absorb <= 0));
    tgt.hp -= dmg; tally(C, src, 'dmg', dmg); tally(C, tgt, 'taken', dmg + absorbed); if (o.effect) fxDone(C, src, o.effect, dmg, 'damage'); else if (ghExtra) fxDone(C, src, 'glass_heart', dmg * ghExtra / (1 + ghExtra), 'damage');
    if (C.opts.omens && tgt.side === 'enemy' && !tgt.frenzy && tgt.hp > 0 && tgt.hp < tgt.maxHp * ((root.TRIALS && root.TRIALS.OMENS.frenzied) || { below: 0.3 }).below && C.opts.omens.includes('frenzied')) { tgt.frenzy = true; ev(C, { type: 'emote', uid: tgt.uid, text: `${tgt.name} goes into a frenzy!` }); }
    // threat
    if (tgt.side === 'enemy') {
      let mult = o.threat || 1;
      if (src.role === 'tank') mult *= 1.9;
      if (src.threatMult) mult *= src.threatMult;
      if (src.char) { const st = tmOf(src).threat; if (st) mult *= 1 + st / 100; }
      tgt.threat[src.uid] = (tgt.threat[src.uid] || 0) + (dmg + absorbed) * mult;
    }
    // rage
    const c = 0.0091107836 * src.level * src.level + 3.225598133 * src.level + 4.2652911;
    if (src.resType === 'rage' && o.melee) src.res = Math.min(100, src.res + (dmg * 7.5) / c);
    if (tgt.resType === 'rage') {
      const ct = 0.0091107836 * tgt.level * tgt.level + 3.225598133 * tgt.level + 4.2652911;
      tgt.res = Math.min(100, tgt.res + (dmg * 2.5) / ct);
    }
    // cast pushback
    if (tgt.cast && !tgt.cast.channel && dmg > 0 && tgt.cast.pushed < 2) { tgt.cast.end += 0.35; tgt.cast.pushed++; }
    ev(C, { type: 'dmg', src: src.uid, tgt: tgt.uid, amount: dmg, absorbed, crit: !!o.crit, school: o.school || 'physical', ab: o.ab || null, melee: !!o.melee, tick: !!o.tick, fx: o.fx || null, effect: o.effect || null }); // melee/tick/fx: hints for the combat effects (ui.js)
    if (tgt.hp <= 0) kill(C, tgt, src);
    // item effects on this hit (v10.10)
    if (!o.effect) {
      const oc = !o.tick && tgt.side !== src.side && fxOf(src, 'opening_cut'); // the first hit on each enemy
      if (oc && !tgt.dead) { tgt.fxFirst = tgt.fxFirst || {}; if (!tgt.fxFirst[src.uid]) { tgt.fxFirst[src.uid] = 1; dealDamage(C, src, tgt, D.EFFECTS.opening_cut.bonus(oc.lvl, oc.f), { school: o.school || 'physical', effect: 'opening_cut', fx: 'effect' }); } }
      const ke = o.crit && !o.tick && tgt.side !== src.side && !tgt.dead && fxOf(src, 'kindled_edge'), KE = ke && D.EFFECTS.kindled_edge; // a crit sets the target smouldering
      if (ke) addAura(C, tgt, { id: 'kindled_edge', name: KE.name, icon: KE.icon, effect: 'kindled_edge', item: ke.item, desc: KE.desc(ke.lvl, ke.f), until: C.t + KE.dur, every: KE.every, next: C.t + KE.every, dot: KE.tick(ke.lvl, ke.f), school: 'fire', src: src.uid, ab: null });
      const sb = fxOf(tgt, 'stubborn_blood'), SB = sb && D.EFFECTS.stubborn_blood; // falling low heals you over time
      if (sb && tgt.hp < tgt.maxHp * SB.below && fxReady(C, tgt, 'stubborn_blood', SB.icd)) {
        const per = (tgt.maxHp * SB.pct * sb.f) / SB.dur;
        addAura(C, tgt, { id: 'stubborn_blood', name: SB.name, icon: SB.icon, effect: 'stubborn_blood', item: sb.item, desc: SB.desc(sb.lvl, sb.f), until: C.t + SB.dur, hot: per, every: 1, next: C.t + 1, src: tgt.uid, ab: null });
      }
    }
    return dmg;
  }

  function heal(C, src, tgt, amount, o) {
    if (src && o && o.ab && !o.effect) { const lm = fxOf(src, 'lavish_mend'); if (lm) amount *= 1 + D.EFFECTS.lavish_mend.heal * lm.f; } // Lavish Mend: a healing ability heals more (#40)
    let tmExtra = 0; // Tethered Mend (#40): a direct heal on the same ally in a row heals more; one on a different ally less, and starts over
    if (src && o && o.ab && !o.effect && !o.tick) { const tm = fxOf(src, 'tethered_mend'), TM = D.EFFECTS.tethered_mend;
      if (tm) { if (src.tetherTgt === tgt.uid) { src.tetherN = Math.min(TM.max, (src.tetherN || 0) + 1); tmExtra = TM.step * tm.f * src.tetherN; amount *= 1 + tmExtra; } else { if (src.tetherTgt != null) amount *= 1 - TM.swap; src.tetherTgt = tgt.uid; src.tetherN = 0; } } }
    if (tgt.dead) return 0;
    if (src && o && o.ab && amount > 0) proc(C, src, 'heal', o.ab); // talent reactions (v10.4)
    if (src && src.char) { const hm = tmOf(src); amount *= 1 + (hm.heal + (o && o.ab ? hm.abilHeal[o.ab] || 0 : 0)) / 100; }
    const before = tgt.hp;
    tgt.hp = Math.min(tgt.maxHp, tgt.hp + Math.round(amount));
    const done = tgt.hp - before;
    // heal threat, split across enemies fighting
    const en = alive(foes(C, src));
    if (en.length && src.side === 'ally') {
      const per = (done * 0.5) / en.length;
      for (const e of en) e.threat[src.uid] = (e.threat[src.uid] || 0) + per;
    }
    ev(C, { type: 'heal', src: src.uid, tgt: tgt.uid, amount: done, over: Math.round(amount) - done, crit: !!(o && o.crit), ab: o && o.ab, fx: o && o.effect ? 'effect' : null });
    tally(C, src, 'heal', done);
    if (tmExtra > 0) fxDone(C, src, 'tethered_mend', done * tmExtra / (1 + tmExtra), 'heal'); // its share of this heal, for the last-run line
    if (o && o.effect) fxDone(C, src, o.effect, done, 'heal');
    if (o && o.effect) { /* an effect's own heal does not echo */ }
    else if (src && o && o.ab && !o.tick) { // Echoing Mend: a direct heal can also land on the most hurt other ally (v10.10)
      const em = fxOf(src, 'echoing_mend'), EM = em && D.EFFECTS.echoing_mend;
      if (em && Math.random() < EM.chance) {
        const other = alive(src.side === 'ally' ? C.allies : C.enemies).filter((a) => a !== tgt && a.hp < a.maxHp).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
        if (other) heal(C, src, other, amount * EM.pct * em.f, { effect: 'echoing_mend' });
      }
    }
    return done;
  }

  // ---- item effects (v10.10, docs/plans/2026-10-02-item-effects-design.md): their own path, not D.PROCS (which is per
  // class). The same effect counts once (the strongest copy); an unknown key is a plain item (the #17 lesson).
  E.itemEffects = function (char) {
    const out = {};
    for (const s in (char && char.equip) || {}) {
      const it = char.equip[s], F = it && it.effect && D.EFFECTS && D.EFFECTS[it.effect]; if (!F) continue;
      const L = it.lvl || 1, f = D.fxGrow ? D.fxGrow(it.fxScale, it.effect) : Math.min(1.5, it.fxScale || 1); /* the effect's strength from its upgrade (#37) */ if (!out[it.effect] || out[it.effect].lvl * out[it.effect].f < L * f) out[it.effect] = { key: it.effect, lvl: L, f, item: it.name };
    }
    return out;
  };
  const fxOf = (u, k) => (u && !u.dead && u.effects && u.effects[k]) || null;
  const fxReady = (C, u, k, icd) => { u.fxAt = u.fxAt || {}; if (icd && C.t - (u.fxAt[k] != null ? u.fxAt[k] : -1e9) < icd) return false; u.fxAt[k] = C.t; fired(C, u, k); return true; };
  // an effect with a cooldown fired: the UI calls it out over the character when its cooldown is 8 sec or more (#23)
  const fired = (C, u, k) => ev(C, { type: 'proc', src: u.uid, key: k, effect: true });
  // what each effect did in this fight, and each fighter's own totals, for the item card's "Last run" line
  function fxDone(C, u, k, amount, kind) { if (!(amount > 0)) return; const r = (C.fx = C.fx || {})[u.uid] = C.fx[u.uid] || {}; const e = r[k] = r[k] || { amount: 0, kind }; e.amount += amount; }
  function tally(C, u, kind, amount) { if (!u || !(amount > 0)) return; const r = (C.tot = C.tot || {})[u.uid] = C.tot[u.uid] || { dmg: 0, heal: 0, taken: 0 }; r[kind] += amount; }
  E.fxDone = fxDone;
  E.kill = (C, u, by) => kill(C, u, by);
  function kill(C, u, by) {
    u.dead = true; u.hp = 0; u.cast = null; u.auras = u.auras.filter((a) => a.keep); // a flask stays through death (v10.9)
    ev(C, { type: 'die', uid: u.uid, by: by && by.uid });
    const ch = by && by.side !== u.side && fxOf(by, 'chase_the_next'), CH = ch && D.EFFECTS.chase_the_next; // a kill gives haste (v10.10)
    if (ch) { addAura(C, by, { id: 'chase_the_next', name: CH.name, icon: CH.icon, effect: 'chase_the_next', item: ch.item, desc: CH.desc(ch.lvl, ch.f), until: C.t + CH.dur, stats: { haste: CH.haste * ch.f } }); fxDone(C, by, 'chase_the_next', 1, 'kills'); }
    if (u.side === 'enemy' && u.focus && C.opts.omens && C.opts.omens.includes('vengeful')) { const rest = C.enemies.filter((x) => !x.dead && x !== u); for (const x of rest) x.vengeance = true; if (rest.length) ev(C, { type: 'emote', uid: rest[0].uid, text: 'The pull swears vengeance!' }); }
    if (u.side === 'enemy' && C.opts.omens && C.opts.omens.includes('volatile') && root.TRIALS) { const VO = root.TRIALS.OMENS.volatile; (C.blasts = C.blasts || []).push({ t: C.t + VO.delay, name: u.name }); ev(C, { type: 'emote', uid: u.uid, text: `${u.name} starts to glow...` }); }
    if (u.side === 'enemy' && C.opts.omens && C.opts.omens.includes('rallying')) { // Rallying: the rest of the pull heal and hit harder
      const rest = C.enemies.filter((x) => !x.dead && x !== u);
      const RO = root.TRIALS.OMENS.rallying; for (const x of rest) { if (RO.heal) x.hp = Math.min(x.maxHp, x.hp + x.maxHp * RO.heal); x.rally = (x.rally || 0) + 1; }
      if (rest.length) ev(C, { type: 'emote', uid: rest[0].uid, text: `${rest.length > 1 ? 'The pull rallies' : rest[0].name + ' rallies'}!` });
    }
    if (u.side === 'enemy') {
      for (const e of C.enemies) delete e.threat[u.uid];
    } else {
      for (const e of C.enemies) { delete e.threat[u.uid]; if (e.target === u.uid) e.target = null; }
    }
  }

  // Melee swing (auto-attack or weapon ability)
  // Steady Fuse (v10.10): every so many seconds in combat, the next hit is a sure crit
  function fuse(C, u) { const F = C && fxOf(u, 'steady_fuse'); if (!F) return false; if (u.fuseAt == null) u.fuseAt = C.t; if (C.t - u.fuseAt < D.EFFECTS.steady_fuse.icd / F.f) return false; /* an upgrade shortens the wait (#37) */ u.fuseAt = C.t; fired(C, u, 'steady_fuse'); fxDone(C, u, 'steady_fuse', 1, 'crits'); return true; }
  function meleeRoll(C, src, tgt) {
    const r = Math.random() * 100;
    const miss = 5 + Math.max(0, levelDiff(src, tgt)) * 1;
    const dodge = flat(tgt) ? tgt.dodge : tgt.st.dodgeTotal;
    const crit = flat(src) ? src.crit : src.st.crit;
    if (r < miss) return 'miss';
    if (r < miss + dodge) return 'dodge';
    if (r < miss + dodge + crit) return 'crit';
    return fuse(C, src) ? 'crit' : 'hit';
  }

  function weaponDamage(u) {
    if (flat(u)) return rnd(u.dmg[0], u.dmg[1]);
    return rnd(u.st.wMin, u.st.wMax) + (u.st.apTotal / 14) * u.st.wSpeed;
  }
  // a ranged monster's attack (stage 4): an archer's shot is a physical swing from range (it can be dodged, armour cuts
  // it); a caster's bolt is its school's (it can be resisted, armour does not cut it). Same damage as its melee swing.
  function mobBolt(C, u, tgt, school) {
    if (school === 'physical') return swing(C, u, tgt, { ranged: true, ab: 'mob_shot' });
    const r = Math.random() * 100, miss = 4 + Math.max(0, levelDiff(u, tgt)) * 1.5;
    if (r < miss) { ev(C, { type: 'avoid', src: u.uid, tgt: tgt.uid, what: 'resist', ab: null }); return 0; }
    let dmg = weaponDamage(u) * DIST.boltMult; if (u.enrage) dmg *= u.enrage; const crit = r < miss + 5; if (crit) dmg *= 1.5; // armour does not cut a bolt, so it hits a little lighter than the swing
    return dealDamage(C, u, tgt, dmg, { school, crit });
  }

  function swing(C, src, tgt, o) {
    o = o || {};
    const res = meleeRoll(C, src, tgt);
    if (res === 'miss' || res === 'dodge') {
      ev(C, { type: 'avoid', src: src.uid, tgt: tgt.uid, what: res, ab: o.ab || null });
      if (!o.ranged) { proc(C, src, 'avoided', o.ab); if (res === 'dodge') proc(C, tgt, 'dodged', o.ab); }
      const tg = res === 'dodge' && !o.ranged && fxOf(tgt, 'turning_guard'), TG = tg && D.EFFECTS.turning_guard; // a dodge raises a guard (v10.10)
      if (tg && fxReady(C, tgt, 'turning_guard', TG.icd)) {
        tgt.auras = tgt.auras.filter((a) => a.id !== 'turning_guard');
        addAura(C, tgt, { id: 'turning_guard', name: TG.name, icon: TG.icon, effect: 'turning_guard', item: tg.item, desc: TG.desc(tg.lvl, tg.f), until: C.t + TG.dur, absorb: TG.absorb(tg.lvl, tg.f) });
      }
      if (tgt.side === 'enemy') tgt.threat[src.uid] = (tgt.threat[src.uid] || 0) + 1;
      return 0;
    }
    let dmg = o.ranged && !flat(src) && !o.wand ? rnd(src.st.rMin, src.st.rMax) + (src.st.rap / 14) * src.st.rSpeed : weaponDamage(src) + (o.bonus || 0);
    if (src.kind === 'mob' && src.enrage) dmg *= src.enrage;
    if (res === 'crit') dmg *= 2;
    const done = dealDamage(C, src, tgt, dmg, { school: 'physical', crit: res === 'crit', ab: o.ab || (o.ranged ? 'auto_shot' : null), threat: o.threat, melee: !o.ranged });
    const sh = !o.ranged && done > 0 && !src.dead && src.side !== tgt.side && fxOf(tgt, 'spiteful_hide'); // Spiteful Hide (v10.10)
    if (sh) dealDamage(C, tgt, src, D.EFFECTS.spiteful_hide.dmg(sh.lvl, sh.f), { school: 'nature', effect: 'spiteful_hide', fx: 'effect' });
    proc(C, src, o.ranged ? (o.ab ? 'shot' : 'autoshot') : 'melee', o.ab);
    if (res === 'crit') proc(C, src, 'crit', o.ab);
    const seal = !flat(src) && !o.ranged && src.auras.find((a) => a.seal);
    if (seal && !tgt.dead) dealDamage(C, src, tgt, seal.seal * rnd(0.9, 1.1) + src.st.sp * 0.1, { school: seal.sealSchool || 'holy', ab: seal.id === 'seal' ? 'seal_righteousness' : 'rockbiter_weapon' });
    const th = !o.ranged && tgt.auras.find((a) => a.thorns && a.thorns.charges > 0);
    if (th && !src.dead) {
      dealDamage(C, tgt, src, th.thorns.dmg, { school: 'nature', ab: 'lightning_shield' });
      th.thorns.charges--; if (th.thorns.charges <= 0) tgt.auras = tgt.auras.filter((a) => a !== th);
    }
    // frost armor chills attackers
    if (tgt.kind !== 'mob' && auraOf(tgt, 'frost_armor') && src.kind === 'mob' && !src.boss) addAura(C, src, { id: 'chilled', until: C.t + 5, slow: 25 });
    return done;
  }

  // ------------------------------------------------------------- abilities
  function abCost(ab, u) { if (ab.shapeshift && u.form) return 0; if (ab.id) { const la = litAura(u, ab.id); if (la && la.proc.free) return 0; } const base = (ab.cost || 0) + (ab.costPerLvl || 0) * ((u.level || E.levelOf(u)) - 1); const off = ab.id ? Math.min(90, abPct(tmOf(u).abilCost, ab.id)) : 0; const lm = (ab.heal || ab.hot) && fxOf(u, 'lavish_mend') ? 1 + D.EFFECTS.lavish_mend.mana : 1; return Math.round(base * (1 - off / 100) * lm); } /* Lavish Mend: a healing spell costs more mana (#40) */
  E.abCost = abCost;

  function spellRoll(src, tgt, C) {
    const r = Math.random() * 100;
    const miss = 4 + Math.max(0, levelDiff(src, tgt)) * 1.5;
    if (r < miss) return 'miss';
    if (r < miss + src.st.spellCrit) return 'crit';
    return fuse(C, src) ? 'crit' : 'hit';
  }

  // Returns null if usable, else a short reason string.
  // the range an ability needs when its target is further than that, else 0 (the action bar greys it and shows the range)
  E.outOfRange = function (C, u, abId, tgt) {
    const ab = D.ABILITIES[abId]; if (!ab) return 0;
    const rg = rangeOf(ab), at = ab.target === 'aoe' ? C.units[u.target] : tgt;
    return rg != null && at && at !== u && at.pos && u.pos && E.dist(u, at) > rg + 0.01 ? rg : 0;
  };
  E.canUse = function (C, u, abId, tgt) {
    const ab = D.ABILITIES[abId];
    if (!ab) return 'Unknown';
    if (u.dead) return 'You are dead';
    if (stunned(C, u) && !ab.freeOf) return 'Stunned';
    if (u.cast) return 'Busy';
    if (ab.gcd !== false && u.gcdUntil > C.t) return 'Not ready';
    if ((u.cds[abId] || 0) > C.t) return 'Not ready yet';
    if (ab.needAura && !auraOf(u, ab.needAura)) return 'Not lit yet';
    if (abCost(ab, u) > u.res + 0.001) return u.resType === 'rage' ? 'Not enough rage' : u.resType === 'energy' ? 'Not enough energy' : 'Not enough mana';
    if (ab.finisher && (u.cp <= 0 || (ab.target === 'enemy' && u.cpTarget !== (tgt && tgt.uid)))) return 'No combo points';
    if (ab.form && u.form !== ab.form) return 'Requires Bear Form';
    if (u.form && !ab.form && !ab.shapeshift) return 'Not while in Bear Form';
    if (ab.needSeal && !auraOf(u, 'seal')) return 'No seal active';
    if (ab.lifetap && u.hp <= ab.lifetap.base + ab.lifetap.perLvl * u.level + 1) return 'Not enough health';
    if (ab.opener && (C.t - (u.closedAt != null ? u.closedAt : C.t) > 3 || C.t > 3 && u.closedAt == null && !C.opts.apart || (tgt && tgt.hitBy && tgt.hitBy[u.uid]))) return 'Already in combat'; // an opener: within 3 sec of first reaching melee (a fight that starts apart gives you the run in)
    if (ab.target === 'enemy' && (!tgt || tgt.dead || tgt.side === u.side)) return 'No target';
    if (ab.target === 'ally' && (!tgt || tgt.dead || tgt.side !== u.side)) return 'Invalid target';
    if (abId === 'pw_shield' && tgt && auraOf(tgt, 'weakened_soul')) return 'Weakened Soul';
    // distance (v10.9): the target must be within the ability's range (a targeted area attack: its centre)
    if (E.outOfRange(C, u, abId, tgt)) return 'Out of range';
    if (ab.stepBack && u.auras.some((a) => a.root)) return 'Rooted';
    return null;
  };

  E.use = function (C, u, abId, tgtUid) {
    const ab = D.ABILITIES[abId];
    let tgt = tgtUid != null ? C.units[tgtUid] : null;
    if (ab.target === 'self' || ab.target === 'party' || ab.target === 'aoe') tgt = u;
    if (ab.target === 'ally' && !tgt) tgt = u;
    const why = E.canUse(C, u, abId, ab.target === 'self' || ab.target === 'party' || ab.target === 'aoe' ? u : tgt);
    if (why) return why;
    if (ab.gcd !== false) u.gcdUntil = C.t + (ab.gcdLen || 1.5);
    if (ab.cast && !((litAura(u, abId) || {}).proc || {}).instant) {
      const castT = Math.max(0.5, ab.cast - (tmOf(u).abilCast[abId] || 0)) / (1 + ((u.st && u.st.haste) || 0) / 100);
      u.cast = { ab: abId, tgt: tgt.uid, start: C.t, end: C.t + castT, channel: ab.channel || 0, ticks: 0, pushed: 0 };
      ev(C, { type: 'castStart', src: u.uid, ab: abId, tgt: tgt.uid, dur: castT });
      return null;
    }
    resolve(C, u, abId, tgt);
    return null;
  };

  function scaled(base, perLvl, L) {
    return rnd(base[0], base[1]) + (perLvl || 0) * L;
  }

  function resolve(C, u, abId, tgt) {
    const ab = D.ABILITIES[abId];
    const L = u.level;
    u.res -= abCost(ab, u);
    { const la = litAura(u, abId); if (la) u.auras = u.auras.filter((a) => a !== la); } // a reaction's light is spent
    if (ab.cd) u.cds[abId] = C.t + Math.max(1, ab.cd - (tmOf(u).abilCd[abId] || 0));
    if (u.resType === 'mana' && abCost(ab, u) > 0) u.lastCastT = C.t;
    ev(C, { type: 'ability', src: u.uid, ab: abId, tgt: tgt && tgt.uid });
    if (tgt && tgt.side !== u.side) { tgt.hitBy = tgt.hitBy || {}; tgt.hitBy[u.uid] = true; if (u.side === 'ally') u.target = tgt.uid; }

    if (ab.taunt) {
      const top = Math.max(0, ...Object.values(tgt.threat));
      tgt.threat[u.uid] = top + 1; tgt.target = u.uid; tgt.tauntUntil = C.t + 3;
      ev(C, { type: 'taunt', src: u.uid, tgt: tgt.uid });
    }
    if (ab.rage) u.res = Math.min(100, u.res + ab.rage);
    if (ab.stun && tgt && !tgt.boss) { tgt.stunUntil = C.t + ab.stun; ev(C, { type: 'stun', tgt: tgt.uid, dur: ab.stun }); }

    const centre = ab.target === 'aoe' && aoeAtTarget(ab) ? (C.units[u.target] && !C.units[u.target].dead ? C.units[u.target] : u) : u;
    const targets = ab.target === 'aoe' ? alive(foes(C, u)).filter((e) => !e.pos || !centre.pos || E.dist(centre, e) <= (ab.radius || DIST.radius)) : tgt ? [tgt] : []; // distance: an area attack has a radius
    if (ab.dmg) {
      for (const t of targets) {
        if (ab.dmg.weapon) {
          swing(C, u, t, { bonus: rnd(ab.dmg.bonus[0], ab.dmg.bonus[1]) + (ab.dmg.perLvl || 0) * L, ab: abId, threat: ab.threat });
        } else if (ab.dmg.perCp) {
          const cps = u.cp;
          const d = cps * rnd(ab.dmg.perCp[0], ab.dmg.perCp[1]) + ab.dmg.perLvl * L + u.st.apTotal * ab.dmg.apCoef * cps;
          const r = meleeRoll(C, u, t);
          if (r === 'miss' || r === 'dodge') ev(C, { type: 'avoid', src: u.uid, tgt: t.uid, what: r, ab: abId });
          else { dealDamage(C, u, t, r === 'crit' ? d * 2 : d, { school: 'physical', crit: r === 'crit', ab: abId, melee: true }); proc(C, u, 'hit', abId); }
        } else {
          const phys = ab.dmg.school === 'physical';
          const r = phys ? meleeRoll(C, u, t) : spellRoll(u, t, C);
          const base = scaled(ab.dmg.base, ab.dmg.perLvl, L) + (ab.dmg.coef || 0) * u.st.sp + (ab.dmg.rapCoef || 0) * (u.st.rap || 0);
          if (r === 'miss' || r === 'dodge') { ev(C, { type: 'avoid', src: u.uid, tgt: t.uid, what: r === 'miss' && !phys ? 'resist' : r, ab: abId }); continue; }
          const crit = r === 'crit';
          dealDamage(C, u, t, crit ? base * (phys ? 2 : 1.5) : base, { school: ab.dmg.school, crit, ab: abId, threat: ab.threat, melee: phys });
          proc(C, u, 'hit', abId); if (crit) proc(C, u, 'crit', abId);
          if (ab.slow && !t.dead) addAura(C, t, { id: abId + '_slow', until: C.t + ab.slow.dur, slow: ab.slow.pct });
          if (ab.root && !t.dead && !t.boss) addAura(C, t, { id: abId + '_root', until: C.t + ab.root, root: true }); // distance: held in place
        }
      }
    }
    if (ab.slow && !ab.dmg && tgt && !tgt.dead) addAura(C, tgt, { id: abId + '_slow', until: C.t + ab.slow.dur, slow: ab.slow.pct });
    if (ab.root && !ab.dmg && tgt && !tgt.dead && !tgt.boss) addAura(C, tgt, { id: abId + '_root', until: C.t + ab.root, root: true });
    if (ab.debuff && tgt && !tgt.dead) addAura(C, tgt, { id: ab.debuff.id, until: C.t + ab.debuff.dur });
    if (ab.shapeshift) { if (u.form) E.shiftOut(C, u); else E.shiftIn(C, u, ab.shapeshift); }
    if (ab.cp && tgt) {
      if (u.cpTarget !== tgt.uid) u.cp = 0;
      const cp0 = u.cp; u.cpTarget = tgt.uid; u.cp = Math.min(5, u.cp + ab.cp);
      if (cp0 < 5 && u.cp >= 5) proc(C, u, 'cp5', abId);
    }
    if (ab.dot && tgt && !tgt.dead) {
      const per = (ab.dot.dmg + ab.dot.perLvl * L + (ab.dot.coef || 0) * u.st.sp) * (1 + (tmOf(u).dot[abId] || 0) / 100);
      addAura(C, tgt, { id: ab.dot.id, until: C.t + ab.dot.ticks * ab.dot.every, every: ab.dot.every, next: C.t + ab.dot.every, dot: per, school: ab.dot.school, src: u.uid, ab: abId });
    }
    // a "party" heal or heal over time (the bard's songs, v10.2) reaches every living party member
    const healWho = ab.target === 'party' ? alive(friends(C, u)).filter((a) => !a.pos || !u.pos || E.dist(u, a) <= DIST.ally) : tgt ? [tgt] : []; // a group heal reaches 40 m, as a group buff
    if (ab.hot) {
      const per = (ab.hot.heal + ab.hot.perLvl * L + (ab.hot.coef || 0) * u.st.sp) * (1 + (tmOf(u).hot[abId] || 0) / 100);
      for (const w of healWho) addAura(C, w, { id: ab.hot.id, until: C.t + ab.hot.ticks * ab.hot.every, every: ab.hot.every, next: C.t + ab.hot.every, hot: per, src: u.uid, ab: abId });
    }
    if (ab.heal) {
      for (const w of healWho) {
        const crit = Math.random() * 100 < u.st.spellCrit;
        const amt = scaled(ab.heal.base, ab.heal.perLvl, L) + (ab.heal.coef || 0) * u.st.sp;
        heal(C, u, w, crit ? amt * 1.5 : amt, { crit, ab: abId });
      }
    }
    if (ab.shield && tgt) {
      const amt = Math.round((ab.shield.base + ab.shield.perLvl * L + ab.shield.coef * u.st.sp) * (1 + (tmOf(u).shield[abId] || 0) / 100));
      // every absorb lives in one 'pw_shield' aura (the damage code reads that id); it shows the name and icon of what cast it
      const own = abId !== 'pw_shield' ? { name: ab.name, icon: abId } : { name: null, icon: null };
      addAura(C, tgt, Object.assign({ id: 'pw_shield', until: C.t + ab.shield.dur, absorb: amt }, own));
      if (ab.weakened) addAura(C, tgt, { id: 'weakened_soul', until: C.t + ab.weakened });
      // shield threat counts like a heal
      for (const e of alive(foes(C, u))) e.threat[u.uid] = (e.threat[u.uid] || 0) + (amt * 0.5) / Math.max(1, alive(foes(C, u)).length);
    }
    if (ab.buff) {
      const b = ab.buff;
      const stats = {};
      const bp = 1 + (tmOf(u).buff[abId] || 0) / 100;
      for (const k in (b.stats || {})) stats[k] = Math.round((b.stats[k] + ((b.perLvl && b.perLvl[k]) || 0) * L) * bp * 10) / 10;
      let dur = b.dur;
      if (ab.finisher) dur += (b.perCpDur || 0) * u.cp;
      const who = ab.target === 'party' ? alive(friends(C, u)).filter((a) => !a.pos || !u.pos || E.dist(u, a) <= DIST.ally) : [u];
      const extra = {};
      if (b.seal) { extra.seal = (b.seal.base + b.seal.perLvl * L) * (u.st.wSpeed / 2.5) * bp; extra.sealSchool = b.seal.school || 'holy'; }
      if (b.thorns) extra.thorns = { dmg: Math.round((b.thorns.base + b.thorns.perLvl * L) * bp), charges: b.thorns.charges };
      if (b.immune) extra.immune = true;
      if (b.speed) extra.speed = b.speed; // distance: run faster (Sprint)
      for (const w of who) addAura(C, w, Object.assign({ id: b.id, until: C.t + dur, stats: Object.keys(stats).length ? stats : null, persistent: dur >= 60 }, extra));
      if (ab.threat) for (const e of alive(foes(C, u))) e.threat[u.uid] = (e.threat[u.uid] || 0) + ab.threat;
    }
    // distance: a charge closes the gap at once; Step Back hops away from the nearest foe
    if (ab.dash && tgt && tgt.pos && u.pos) { const d = E.dist(u, tgt); if (d > DIST.melee - 2) { stepToward(u, tgt, d - (DIST.melee - 2)); ev(C, { type: 'move', src: u.uid, how: 'dash' }); } }
    if (ab.stepBack && u.pos) { const near = alive(foes(C, u)).filter((e) => e.pos).sort((a, b) => E.dist(u, a) - E.dist(u, b))[0]; if (near) { stepAway(u, near, ab.stepBack); ev(C, { type: 'move', src: u.uid, how: 'hop' }); } }
    if (ab.finisher) { u.cp = 0; u.cpTarget = null; }
    if (ab.needSeal) u.auras = u.auras.filter((a) => a.id !== 'seal');
    if (ab.freeOf) { u.stunUntil = 0; u.auras = u.auras.filter((a) => !a.slow); }
    if (ab.stunImmune) u.stunImmuneUntil = C.t + ab.stunImmune;
    // a stomp or a scream reaches the foes within 8 m (stage 4)
    if (ab.stompAll) { for (const e of alive(foes(C, u))) if (!e.boss && (!e.pos || !u.pos || E.dist(u, e) <= (ab.radius || DIST.radius))) { e.stunUntil = C.t + ab.stompAll; if (ab.fear) { e.fleeUntil = C.t + ab.stompAll; e.fleeFrom = u.uid; } ev(C, { type: 'stun', tgt: e.uid, dur: ab.stompAll, fear: !!ab.fear }); } ev(C, { type: 'emote', uid: u.uid, text: `${u.name} stomps the ground!` }); }
    if (ab.cleanse) u.auras = u.auras.filter((a) => !(a.dot != null && a.src !== u.uid));
    if (ab.dropThreat) {
      const others = alive(friends(C, u)).filter((a) => a !== u);
      for (const e of alive(foes(C, u))) {
        e.threat[u.uid] = 0;
        if (e.target === u.uid) { e.target = null; if (!others.length) e.stunUntil = C.t + 2.5; }
      }
    }
    if (ab.bloodFury) addAura(C, u, { id: 'blood_fury', until: C.t + 15, stats: { ap: Math.round(u.st.apTotal * 0.25) } });
    if (ab.berserk) addAura(C, u, { id: 'berserking', until: C.t + 10, stats: { haste: Math.round(10 + 20 * (1 - u.hp / u.maxHp)) } });
    if (ab.lifetap) {
      const amt = Math.round(ab.lifetap.base + ab.lifetap.perLvl * L);
      u.hp = Math.max(1, u.hp - amt); u.res = Math.min(u.maxRes, u.res + amt);
      ev(C, { type: 'lifetap', src: u.uid, amount: amt });
    }
  }

  // ------------------------------------------------------------- druid forms
  E.shiftIn = function (C, u, form) {
    u.savedMana = u.res; u.form = form; u.resType = 'rage'; u.res = 0; u.maxRes = 100;
    const hpPct = u.hp / u.maxHp;
    addAura(C, u, { id: 'bear_form', until: C.t + 1e6, bear: true, stats: {} });
    u.hp = Math.max(u.hp, Math.round(u.maxHp * hpPct));
    ev(C, { type: 'shift', src: u.uid, form });
  };
  // back to caster form: the same health share, the mana kept from before the shift
  const toCaster = (u) => {
    const hpPct = u.hp / u.maxHp;
    u.form = null; u.auras = u.auras.filter((a) => a.id !== 'bear_form');
    u.resType = 'mana'; E.recalc(u);
    u.maxRes = u.st.maxMana; u.res = Math.min(u.savedMana || 0, u.maxRes);
    u.hp = Math.max(1, Math.round(u.maxHp * hpPct));
  };
  E.shiftOut = function (C, u) {
    toCaster(u);
    ev(C, { type: 'shift', src: u.uid, form: null });
  };

  // ------------------------------------------------------------- mob specials
  // Every number a special uses lives here, so the fight and the briefing text (E.specialFacts) can never disagree.
  // every: seconds between uses (the first comes FIRST sec into the fight); mult: × a normal hit; heal: share of max
  // health; adds: [health share, mob (null = the boss's own summon), how many, level (+/- the boss's, or a fixed number)]
  const SPECIAL_FIRST = 6;
  const SPECIALS = {
    slam: { every: 8, mult: 2.1, who: 'target' }, hogger: { every: 9, mult: 2.1, who: 'target' },
    whirl: { every: 12, mult: 0.7, who: 'all' }, molten: { every: 10, mult: 1.4, who: 'random', school: 'fire' },
    cook: { every: 15, heal: 0.08 },
    arugal: { every: 12, mult: 0.9, who: 'random', school: 'shadow', adds: [[0.5, 'shadowfang_moonwalker', 1, -2]] },
    kelris: { adds: [[0.5, null, 1, -2]] }, thredd: { adds: [[0.5, 'defias_insurgent', 2, -1]] }, vancleef: { adds: [[0.5, 'blackguard', 1, -2]] },
    thermaplugg: { adds: [[0.66, 'gnomeregan_leper', 1, -2], [0.33, 'gnomeregan_leper', 1, -2]] },
    smite: { stunAt: [0.66, 0.33], stun: 2, stunOrc: 1.5, enrageAt: 0.5, enrage: 1.35 },
  };
  E.SPECIALS = SPECIALS;
  const addLvl = (m, lv) => (lv > 0 ? lv : m.level + lv);
  // the plain facts of a boss's special, with the numbers of this unit (made by E.mobUnit at the level you will meet it)
  // A boss's mechanics as rows for the boss card (v10.7): { name, when, what, hard }, with this unit's numbers.
  // name says the kind in plain words, when is the timer or health mark, what is the effect. specialFacts joins them.
  E.specialRows = function (u) {
    const sp = u && u.special, S = (sp && SPECIALS[sp.kind]) || {}, out = []; if (!sp && !(u && u.hardX)) return out;
    const hit = (x) => `${Math.round(u.dmg[0] * x)}–${Math.round(u.dmg[1] * x)}`;
    const hitRow = (every, first, x, who, school, hard) => out.push({ name: who === 'all' ? 'Group hit' : who === 'random' ? 'Random hit' : 'Heavy hit', when: `Every ${every} sec (first at ${first} sec)`, what: `${who === 'all' ? 'hits everyone in your group' : who === 'random' ? 'hits one group member at random' : 'hits its target'} for ${hit(x)}${school ? ' ' + school : ''} damage.`, hard });
    const healRow = (every, first, x, hard) => out.push({ name: 'Heals itself', when: `Every ${every} sec (first at ${first} sec)`, what: `heals for ${Math.round(x * 100)}% of its health (${Math.round(u.maxHp * x)}).`, hard });
    if (S.mult) hitRow(S.every, SPECIAL_FIRST, S.mult, S.who, S.school, false);
    if (S.heal) healRow(S.every, SPECIAL_FIRST, S.heal, false);
    if (S.adds) {
      const byMob = {};
      for (const [at, key, n, lv] of S.adds) { const k = key || sp.summon || 'twilight_acolyte', id = k + ':' + n; (byMob[id] = byMob[id] || { k, n, lv, at: [] }).at.push(Math.round(at * 100) + '%'); }
      for (const a of Object.values(byMob)) out.push({ name: 'Calls help', when: `At ${a.at.join(' and ')} health`, what: joinText(a.n, a.k, addLvl(u, a.lv)), hard: false });
    }
    if (S.stunAt) out.push({ name: 'Stuns the group', when: `At ${S.stunAt.map((x) => Math.round(x * 100) + '%').join(' and ')} health`, what: `stuns your whole group for ${S.stun} sec (orcs ${S.stunOrc} sec).`, hard: false });
    if (S.enrageAt) out.push({ name: 'Frenzy', when: `Below ${Math.round(S.enrageAt * 100)}% health`, what: `hits ${Math.round((S.enrage - 1) * 100)}% harder.`, hard: false });
    for (const x of u.hardX || []) {
      const kind = x.kind || 'adds';
      const hd = x.hard !== false; // world bosses use the same mechanics without the Hard tag
      if (kind === 'adds') out.push({ name: 'Calls help', when: `At ${Math.round(x.at * 100)}% health`, what: joinText(x.n, x.mob, addLvl(u, x.lvl)), hard: hd });
      else if (kind === 'enrage') out.push({ name: 'Frenzy', when: `Below ${Math.round(x.at * 100)}% health`, what: `hits ${Math.round((x.mult - 1) * 100)}% harder.`, hard: hd });
      else if (kind === 'heal') healRow(x.every, x.every / 2, x.heal, hd);
      else hitRow(x.every, x.every / 2, x.mult, x.who, x.school, hd);
    }
    return out;
  };
  const lc = (t) => t.charAt(0).toLowerCase() + t.slice(1), uc = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  E.specialFacts = (u) => E.specialRows(u).map((r) => (r.hard ? 'Hard: ' + lc(r.when) : r.when) + ': ' + r.what);
  E.ucFirst = uc;
  // Hard raids (v10.7): one extra mechanic per boss, set by the raid's data on the unit (u.hardX), on top of the boss's
  // own special. Kinds: adds { at, mob, n, lvl } once at a health mark; hit { every, mult, who: all|random|target,
  // school } on a timer; enrage { at, mult } below a health mark; heal { every, heal } on a timer. `text` is the emote.
  function hardExtra(C, m, dt) {
    const pct = m.hp / m.maxHp, emote = (x) => { if (x.text) ev(C, { type: 'emote', uid: m.uid, text: x.text }); };
    for (const x of m.hardX) {
      const kind = x.kind || 'adds';
      if (kind === 'adds' || kind === 'enrage') {
        if (x.done || pct >= x.at) continue;
        x.done = true; emote(x);
        if (kind === 'enrage') { m.enrage = (m.enrage || 1) * x.mult; ev(C, { type: 'fx', uid: m.uid, kind: 'enrage' }); }
        else for (let i = 0; i < x.n; i++) E.addEnemy(C, E.mobUnit(x.mob, addLvl(m, x.lvl), (C.opts.dungeonMult || { hp: 1, dmg: 1 })));
        continue;
      }
      if (stunned(C, m)) continue;
      x.t = (x.t == null ? x.every / 2 : x.t) - dt; // the first comes halfway through its timer
      if (x.t > 0) continue;
      x.t = x.every;
      if (kind === 'heal') { emote(x); heal(C, m, m, m.maxHp * x.heal, {}); continue; }
      const allies = alive(C.allies), tgt = C.units[m.target];
      const who = x.who === 'all' ? allies : x.who === 'random' ? [allies[rint(0, allies.length - 1)]] : [tgt && !tgt.dead ? tgt : null];
      if (!who.filter(Boolean).length) continue;
      emote(x);
      for (const a of who) if (a) dealDamage(C, m, a, rnd(m.dmg[0], m.dmg[1]) * x.mult, { school: x.school || 'physical', ab: 'hard_' + (x.school || 'hit') });
    }
  }
  // a mob's name for more than one (v10.8): `plural` on the mob if set, else the head noun of "X of Y" takes the ending
  // (Son of Flame → Sons of Flame), with the usual English endings (Wolf → Wolves, Spy → Spies, Watchman → Watchmen)
  E.plural = function (key) {
    const M = D.MOBS[key]; if (M.plural) return M.plural;
    const m = M.name.match(/^(.*?)( of .*)?$/), head = m[1], tail = m[2] || '';
    const one = (w) => /man$/i.test(w) ? w.replace(/man$/i, 'men') : /(lf|rf)$/i.test(w) ? w.replace(/f$/i, 'ves') : /(s|x|z|ch|sh)$/i.test(w) ? w + 'es' : /[^aeiou]y$/i.test(w) ? w.replace(/y$/i, 'ies') : w + 's';
    return one(head) + tail;
  };
  const joinText = (n, key, lvl) => `${n > 1 ? `${n} ${E.plural(key)} join` : `${/^[AEIOU]/.test(D.MOBS[key].name) ? 'an' : 'a'} ${D.MOBS[key].name} joins`} the fight (level ${lvl}).`;
  function specials(C, m, dt) {
    if (m.hardX && !m.dead) hardExtra(C, m, dt);
    const sp = m.special;
    if (!sp || m.dead || stunned(C, m)) return;
    sp.t -= dt;
    const tgt = C.units[m.target];
    const pct = m.hp / m.maxHp;
    const allies = alive(C.allies);
    if (sp.kind === 'smite') {
      const Sm = SPECIALS.smite;
      if (sp.phase === 0 && pct < Sm.stunAt[0]) { sp.phase = 1; stomp(C, m, 'Mr. Clobber stomps the deck!'); say(C, m, 'You landlubbers are tougher than I thought! I\'ll have to improvise!', 'monster'); }
      if (sp.phase === 1 && pct < Sm.enrageAt) { sp.phase = 2; m.enrage = Sm.enrage; ev(C, { type: 'fx', uid: m.uid, kind: 'enrage' }); ev(C, { type: 'emote', uid: m.uid, text: 'Mr. Clobber draws his hammer.' }); }
      if (sp.phase === 2 && pct < Sm.stunAt[1]) { sp.phase = 3; stomp(C, m, 'Mr. Clobber stomps the deck!'); say(C, m, 'D\'ah! Now you\'re making me angry!', 'monster'); }
      return;
    }
    if (sp.kind === 'arugal') {
      // calls a worgen at half health; a shadow bolt at someone every 12 sec
      const Sa = SPECIALS.arugal, [aAt, aKey, , aLv] = Sa.adds[0];
      if (sp.phase < 1 && pct < aAt) {
        sp.phase++; say(C, m, 'You, too, shall serve!', 'monster');
        E.addEnemy(C, E.mobUnit(aKey, addLvl(m, aLv), (C.opts.dungeonMult || { hp: 1, dmg: 1 })));
      }
      if (sp.t <= 0) {
        sp.t = Sa.every; const a = allies[rint(0, allies.length - 1)];
        if (a) { ev(C, { type: 'emote', uid: m.uid, text: 'Cairn hurls a bolt of shadow!' }); dealDamage(C, m, a, rnd(m.dmg[0], m.dmg[1]) * Sa.mult, { school: 'shadow', ab: 'shadow_bolt' }); }
      }
      return;
    }
    if (sp.kind === 'kelris') {
      // one add at half health (the boss's `summon` mob)
      const [kAt, , , kLv] = SPECIALS.kelris.adds[0];
      if (sp.phase === 0 && pct < kAt) {
        sp.phase = 1; if (sp.text) ev(C, { type: 'emote', uid: m.uid, text: sp.text }); else say(C, m, 'Sleep... and dream of the old gods!', 'monster');
        E.addEnemy(C, E.mobUnit(sp.summon || 'twilight_acolyte', addLvl(m, kLv), (C.opts.dungeonMult || { hp: 1, dmg: 1 })));
      }
      return;
    }
    if (sp.kind === 'thermaplugg') {
      // a leper gnome joins at 66% and at 33%
      const St = SPECIALS.thermaplugg.adds;
      if (sp.phase < St.length && pct < St[sp.phase][0]) {
        const [, tKey, , tLv] = St[sp.phase];
        sp.phase++; say(C, m, sp.phase === 1 ? 'Usurpers! Gearhollow is mine!' : 'My machines are the future!', 'monster');
        E.addEnemy(C, E.mobUnit(tKey, addLvl(m, tLv), (C.opts.dungeonMult || { hp: 1, dmg: 1 })));
      }
      return;
    }
    if (sp.kind === 'thredd') {
      const [dAt, dKey, dN, dLv] = SPECIALS.thredd.adds[0];
      if (sp.phase === 0 && pct < dAt) {
        sp.phase = 1; say(C, m, 'To me, brothers! Show them what Kingsmere Gaol taught us!', 'monster');
        for (let i = 0; i < dN; i++) E.addEnemy(C, E.mobUnit(dKey, addLvl(m, dLv), (C.opts.dungeonMult || { hp: 1, dmg: 1 })));
      }
      return;
    }
    if (sp.kind === 'vancleef') {
      const [vAt, vKey, vN, vLv] = SPECIALS.vancleef.adds[0];
      if (sp.phase === 0 && pct < vAt) {
        sp.phase = 1; say(C, m, 'Lapdogs, all of you!', 'monster');
        for (let i = 0; i < vN; i++) E.addEnemy(C, E.mobUnit(vKey, addLvl(m, vLv), (C.opts.dungeonMult || { hp: 1, dmg: 1 })));
      }
      if (sp.t <= 0 && tgt) { sp.t = 12; say(C, m, 'The Brotherhood shall prevail!', 'monster'); }
      return;
    }
    if (sp.t > 0) return;
    if (sp.kind === 'slam' || sp.kind === 'hogger') {
      const Ss = SPECIALS[sp.kind]; sp.t = Ss.every;
      if (tgt && !tgt.dead) {
        ev(C, { type: 'emote', uid: m.uid, text: sp.text || (sp.kind === 'hogger' ? `${m.name} lunges!` : `${m.name} slams the ground!`) });
        dealDamage(C, m, tgt, rnd(m.dmg[0], m.dmg[1]) * Ss.mult, { school: 'physical', ab: 'slam' });
      }
    } else if (sp.kind === 'whirl') {
      sp.t = SPECIALS.whirl.every;
      ev(C, { type: 'emote', uid: m.uid, text: sp.text || `${m.name === 'Big Chopper' ? 'Big Chopper' : 'The Shredder'} whirls its saw blades!` });
      for (const a of allies) dealDamage(C, m, a, rnd(m.dmg[0], m.dmg[1]) * SPECIALS.whirl.mult, { school: 'physical', ab: 'whirl' });
    } else if (sp.kind === 'molten') {
      sp.t = SPECIALS.molten.every;
      const a = allies[rint(0, allies.length - 1)];
      if (a) { ev(C, { type: 'emote', uid: m.uid, text: sp.text || `${m.name} splashes molten metal!` }); dealDamage(C, m, a, rnd(m.dmg[0], m.dmg[1]) * SPECIALS.molten.mult, { school: 'fire', ab: 'molten' }); }
    } else if (sp.kind === 'cook') {
      sp.t = SPECIALS.cook.every;
      ev(C, { type: 'emote', uid: m.uid, text: sp.text || 'Crumbs eats some of his cooking.' });
      heal(C, m, m, m.maxHp * SPECIALS.cook.heal, {});
    }
  }
  function stomp(C, m, text) {
    ev(C, { type: 'emote', uid: m.uid, text });
    for (const a of alive(C.allies)) { if ((a.stunImmuneUntil || 0) > C.t) continue; a.stunUntil = C.t + (a.race === 'orc' ? SPECIALS.smite.stunOrc : SPECIALS.smite.stun); a.cast = null; }
  }

  // ------------------------------------------------------------- AI
  function pickMobTarget(C, m) {
    if (m.tauntUntil && m.tauntUntil > C.t && C.units[m.target] && !C.units[m.target].dead) return;
    let best = null, bestV = -1;
    for (const uid in m.threat) {
      const u = C.units[uid];
      if (!u || u.dead) continue;
      if (m.threat[uid] > bestV) { bestV = m.threat[uid]; best = u; }
    }
    const cur = C.units[m.target];
    if (!best) { m.target = null; return; }
    if (!cur || cur.dead) { m.target = best.uid; return; }
    if (best !== cur && bestV > (m.threat[cur.uid] || 0) * 1.1) {
      m.target = best.uid;
      ev(C, { type: 'aggro', uid: m.uid, tgt: best.uid });
    }
  }

  function focusTarget(C, u) {
    // works for either side: 'u' is the unit asking (an ally by default)
    const mine = u ? friends(C, u) : C.allies, theirs = u ? foes(C, u) : C.enemies;
    // Kill order: spread puts each damage dealer on a different enemy (the tank keeps its own)
    if (C.opts.killOrder === 'spread' && u && u.side === 'ally' && u.role !== 'tank') { const al = alive(theirs).sort((x, y) => x.uid - y.uid); if (al.length) return al[u.uid % al.length]; }
    // Omen Sheltered: a target that cannot be hurt is dropped after a few seconds of trying (a real player would notice)
    const om = C.opts.omens, shelt = (x) => om && x.focus && om.includes('sheltered') && alive(theirs).some((y) => y !== x);
    if (u && u.side === 'ally' && om && om.includes('sheltered')) { const cur = C.units[u.target]; if (cur && shelt(cur)) { u.stuckOn = u.stuckOn || C.t; } else u.stuckOn = 0; }
    const giveUp = (x) => shelt(x) && u && u.stuckOn && C.t - u.stuckOn > 4;
    // kill order marks come first: skull, then cross
    const marked = alive(theirs).filter((x) => x.mark && !giveUp(x)).sort((x, y) => (x.mark === 'skull' ? 0 : 1) - (y.mark === 'skull' ? 0 : 1));
    if (marked.length) return marked[0];
    const tank = alive(mine).find((x) => x.role === 'tank');
    const t = tank && C.units[tank.target];
    if (t && !t.dead && !giveUp(t)) return t;
    const en = alive(theirs).filter((x) => !giveUp(x));
    return en.sort((a, b) => a.hp - b.hp)[0] || alive(theirs)[0] || null;
  }
  E.focusTarget = focusTarget;

  // a class's kit sorted for the bot AI (v10.4): defensive cooldowns, big offensive cooldowns, area attacks, short-cooldown hits
  const KIT = {};
  function kitOf(cls) {
    if (KIT[cls]) return KIT[cls];
    const k = { defensive: [], burst: [], aoe: [], hits: [], openers: [] };
    for (const id of (D.CLASSES[cls] || { abilities: [] }).abilities) {
      const A0 = D.ABILITIES[id]; if (A0 && A0.opener && A0.target === 'enemy') k.openers.push(id); // PvE openers too (issue #2)
      const A = D.ABILITIES[id]; if (!A || A.form || A.shapeshift || A.opener || A.finisher || A.taunt || A.needAura) continue;
      const st = (A.buff && A.buff.stats) || {}, offensive = st.sp || st.ap || st.haste || st.crit || st.str || st.agi || st.int;
      const def = A.target === 'self' && A.cd && ((A.buff && A.buff.immune) || A.heal || A.shield || (!offensive && (st.armor || st.dodge || st.taken)));
      if (def) k.defensive.push(id);
      else if (A.target === 'self' && (A.cd || 0) >= 60 && A.buff) k.burst.push(id);
      else if (A.target === 'aoe' && A.dmg) k.aoe.push(id);
      else if (A.target === 'enemy' && A.dmg && A.cd && A.cd <= 30 && !A.stun) k.hits.push(id); // a stun breaks on damage: not a filler hit
    }
    k.openers.sort((a, b) => (D.ABILITIES[b].stun ? 1 : 0) - (D.ABILITIES[a].stun ? 1 : 0) || D.ABILITIES[b].lvl - D.ABILITIES[a].lvl); // a stun first, then the newest
    return (KIT[cls] = k);
  }
  E.kitOf = kitOf;
  // one on one (v10.9): a lone character against a lone character (a duel, the Bloodsand Brawl, a world ambush) plays
  // like a player would: heal yourself when hurt if your class can, stop a cast or buy time with a stun or a fear, slow
  // a melee attacker down. Read from each class's own kit (heals, stuns, fears, snares), so a new ability or class needs
  // nothing here. Group fights never reach this, so dungeon and raid play is unchanged. sim/brawl.js checks no class is
  // far behind; classes stay different (plate, pets, burst), none hopeless.
  const SOLO = {};
  function soloKit(cls) {
    if (SOLO[cls]) return SOLO[cls];
    const k = { heals: [], stuns: [], fears: [], snares: [], buffs: [], roots: [], dashes: [], sprints: [], openers: [] };
    for (const id of (D.CLASSES[cls] || { abilities: [] }).abilities) {
      const A = D.ABILITIES[id]; if (A && A.dash && !A.form) k.dashes.push(id); // Charge (an opener) and Intercept leap in
      if (A && A.opener && !A.dash && A.target === 'enemy') k.openers.push(id); // Cheap Shot, Ambush, Garrote
      if (!A || A.form || A.opener || A.taunt || A.needAura) continue;
      if (A.root && (A.target === 'enemy' || A.target === 'aoe')) k.roots.push(id);
      if (A.buff && A.buff.speed) k.sprints.push(id);
      const st = (A.buff && A.buff.stats) || {};
      if ((A.target === 'self' || A.target === 'party') && A.buff && !A.cd && !A.shapeshift && !A.combatOnly && !A.seal && !(A.buff && A.buff.seal) && (st.armor || st.sta || st.sp || st.int)) k.buffs.push(id); // armour, stamina or spell power (not a seal or weapon imbue: the rotation keeps those)
      if ((A.heal || A.hot || A.shield) && (A.target === 'ally' || A.target === 'self')) k.heals.push(id);
      else if (A.target === 'enemy' && A.stun) k.stuns.push(id);
      else if (A.target === 'self' && A.stompAll) k.fears.push(id);
      else if (A.target === 'enemy' && A.slow) k.snares.push(id);
    }
    // a shield first, then a heal over time, then the quickest cast
    const rank = (id) => { const A = D.ABILITIES[id]; return A.shield ? 0 : A.hot ? 1 : 2 + (A.cast || 0); };
    k.heals.sort((a, b) => rank(a) - rank(b));
    k.openers.sort((a, b) => (D.ABILITIES[b].stun ? 1 : 0) - (D.ABILITIES[a].stun ? 1 : 0) || D.ABILITIES[b].lvl - D.ABILITIES[a].lvl); // a stun first (Cheap Shot), then the newest
    return (SOLO[cls] = k);
  }
  E.soloKit = soloKit;
  // how long a fighter still cannot move toward you: rooted, stunned or running in fear
  const holdLeft = (C, f) => Math.max(0, f.stunUntil - C.t || 0, f.fleeUntil - C.t || 0, ...f.auras.filter((a) => a.root).map((a) => a.until - C.t));
  // kiting: open the gap while a melee foe is held, up to `gap` metres, running at most `run` seconds (sim/brawl.js tunes them)
  const G_KITE = E.KITE = { gap: 16, run: 1.5, edge: 2, safeHeal: 0.7 }; // edge: how much faster (m/s) you must be for running to pay
  const runSpeed = (C, x) => (x.auras.some((a) => a.root) || x.stunUntil > C.t ? 0 : moveSpeed(x));
  const SOLO_UP = { bard: ['marching_song', 'hearthsong', 'anthem_of_stone'], shaman: ['rockbiter_weapon', 'lightning_shield'] };
  const soloFoe = (en) => { const ch = en.filter((x) => x.kind !== 'pet'); return ch.length === 1 && ch[0].cls && !ch[0].boss ? ch[0] : null; }; // pets do not count
  E.SOLO_HEAL_AT = 0.6; // a skilled bot alone against monsters heals itself below about 60% health, shield first (#4; 0.45 before)
  const soloFight = (C, u, en) => !!soloFoe(en) && alive(friends(C, u)).filter((x) => x.kind !== 'pet').length === 1;
  function soloThink(C, u, f, b, has, try_) {
    const sk = b.skill || 0.5, hp = u.hp / u.maxHp, roll = () => Math.random() < 0.4 + 0.6 * sk, k = soloKit(u.cls);
    // long upkeep a class keeps on everywhere is already up when a one-on-one starts (a player's carries in from outside
    // the fight the same way): a bard's 30-minute songs, a shaman's weapon imbue and Lightning Shield. No opening
    // seconds spent on them, and none mid-fight.
    if (!u.soloUp && SOLO_UP[u.cls]) { u.soloUp = 1; for (const id of SOLO_UP[u.cls]) if (has(id) && !auraOf(u, D.ABILITIES[id].buff.id) && !(D.ABILITIES[id].buff.seal && u.auras.some((a) => a.seal))) { E.use(C, u, id); u.gcdUntil = 0; } }
    // distance: a heal is safe while the foe cannot reach you (held, or a melee foe still out of reach), so heal earlier then
    const safe = !!(u.pos && f.pos) && (holdLeft(C, f) > 1.5 || (reachOf(f) <= DIST.melee && E.dist(u, f) > DIST.melee + 6));
    if ((hp < 0.2 + 0.3 * sk || (safe && hp < G_KITE.safeHeal)) && roll()) for (const id of k.heals) {
      const A = D.ABILITIES[id]; if (!has(id)) continue;
      if ((A.cd || 0) >= 60 && hp > 0.25) continue; // a big cooldown waits until you are nearly down
      if (A.shield && (auraOf(u, 'weakened_soul') || auraOf(u, id))) continue; if (A.hot && auraOf(u, id)) continue;
      if (try_(id, u)) return true;
    }
    // distance (v10.9): a melee fighter leaps in; a ranged one against melee holds it, opens the gap, casts while it cannot reach
    if (u.pos && f.pos) {
      const d = E.dist(u, f), mine = reachOf(u), theirs = reachOf(f), hold = holdLeft(C, f);
      if (mine <= DIST.melee && d > DIST.melee + 1) for (const id of k.dashes) if (has(id) && try_(id, f)) return true;
      if (d <= DIST.melee + 0.5) for (const id of k.openers) if (has(id) && try_(id, f)) return true; // in reach at last: the opener
      if (mine <= DIST.melee && d > DIST.melee + 6 && roll()) for (const id of k.sprints) if (has(id) && !auraOf(u, D.ABILITIES[id].buff.id) && try_(id)) return true; // then run it down
      if (mine > DIST.melee && theirs <= DIST.melee) {
        const sb = () => !u.auras.some((a) => a.root) && E.use(C, u, 'step_back') === null;
        if (d <= DIST.melee + 1.5 && hold < 0.5 && roll()) { // it is on you: freeze, stun or fear it, slow it, else hop away
          for (const id of k.roots) if (has(id) && try_(id, D.ABILITIES[id].target === 'enemy' ? f : null)) return true;
          for (const id of k.stuns) if (has(id) && try_(id, f)) return true;
          for (const id of k.fears) if (has(id) && try_(id)) return true;
          if (slowPct(f) < 40) for (const id of k.snares) if (has(id) && try_(id, f)) return true;
          if (slowPct(f) >= 40 && sb()) return true; // a slowed foe cannot keep up after a hop
        }
        // faster than it (it is held, or slowed and you are not): open the gap, then cast. Run-and-cast keeps a slowed
        // warrior off a mage, and the warrior's answers are its own (Hamstring slows you back, Intercept, a stun).
        const fast = runSpeed(C, u) - (hold > 0.5 ? 0 : runSpeed(C, f));
        if (d < G_KITE.gap && fast > G_KITE.edge && roll()) {
          if (d < DIST.melee + 4 && sb()) return true;
          u.kiteUntil = C.t + G_KITE.run; return true;
        }
      }
    }
    const free = !(f.stunUntil > C.t), near = !u.pos || !f.pos || E.dist(u, f) <= DIST.radius; // a stomp or a scream reaches 8 m
    if (free && (f.cast || hp < 0.5 || Math.random() < 0.12 * sk) && roll()) {
      for (const id of k.stuns) if (has(id) && try_(id, f)) return true;
      if (near) for (const id of k.fears) if (has(id) && try_(id)) return true;
    }
    const thrifty = (id) => D.CLASSES[u.cls].resource === 'mana' && u.res / u.maxRes < 0.4 && f.hp / f.maxHp > 0.25 && abCost(D.ABILITIES[id], u) > u.maxRes * 0.04; // save mana for the main attack
    if (free && Math.random() < 0.5 * sk) for (const id of k.snares) if (has(id) && !auraOf(f, id) && !thrifty(id) && try_(id, f)) return true;
    u.soloBuffed = u.soloBuffed || {}; // each buff once a fight: some replace each other (songs, aspects), and a loop would never fight
    if (hp > 0.5 && roll()) for (const id of k.buffs) if (has(id) && !u.soloBuffed[id] && !auraOf(u, id)) { u.soloBuffed[id] = 1; if (try_(id)) return true; }
    return false;
  }
  function botThink(C, u) {
    if (u.dead || u.cast) return;
    if (stunned(C, u)) { const rac = u.race && D.RACIALS[u.race] && D.RACIALS[u.race].active; if (rac && D.ABILITIES[rac].freeOf && Math.random() < 0.3) E.use(C, u, rac); return; }
    const b = u.bot || {};
    if (u.nextThink > C.t) return;
    u.nextThink = C.t + (b.react || 0.6);
    if (b.afkUntil && b.afkUntil > C.t) return;
    const en = alive(foes(C, u));
    if (!en.length) return;
    const try_ = (id, tgt) => E.use(C, u, id, tgt && tgt.uid) === null;
    const rac = u.race && D.RACIALS[u.race] && D.RACIALS[u.race].active;
    if (rac && Math.random() < 0.08 * (b.skill || 0.5)) {
      const rA = D.ABILITIES[rac];
      const hurt = u.hp / u.maxHp < 0.4; // a tank never fades out of a fight: the enemies would turn on the healer
      if ((rA.bloodFury || rA.berserk) || (rA.stompAll && en.length >= 2) || (hurt && (rA.cleanse || (rA.dropThreat && u.role !== 'tank'))) || (u.stunUntil > C.t && rA.freeOf)) { if (try_(rac)) return; }
    }
    const has = (id) => D.CLASSES[u.cls].abilities.includes(id) && D.ABILITIES[id].lvl <= u.level;
    // a lit ability (a reaction, v10.4) first: it is free, instant or ready only for a few seconds; better players see it more
    if (Math.random() < 0.45 + 0.55 * (b.skill || 0.5)) for (const a of u.auras) if (a.proc) for (const l of a.proc.lights) {
      if (!knows(u, l)) continue;
      const A = D.ABILITIES[l];
      if (A.target === 'ally') { const al = alive(friends(C, u)).sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0]; if (al && al.hp / al.maxHp < 0.8 && try_(l, al)) return; continue; }
      if (u.role === 'healer') continue; // a healer does not trade a heal for an instant Smite
      if (try_(l, focusTarget(C, u))) return;
    }

    if (!u.legend && soloFight(C, u, en) && soloThink(C, u, soloFoe(en), b, has, try_)) return;
    // alone against monsters only (no other player standing on your side, pets don't count; never a duel or brawl, which
    // soloThink plays), a player heals themself when low,
    // as soloThink does one on one: before this a soloing Priest, Druid or Paladin never did (#4, sim/lvpace.js)
    if (!u.legend && u.role !== 'healer' && en.every((x) => !x.cls) && alive(friends(C, u)).filter((x) => x.kind !== 'pet').length === 1 && u.hp / u.maxHp < E.SOLO_HEAL_AT * (0.75 + 0.3125 * (b.skill || 0.5)) && Math.random() < 0.4 + 0.6 * (b.skill || 0.5)) {
      for (const id of soloKit(u.cls).heals) { const A = D.ABILITIES[id]; if (!has(id) || (A.hot && auraOf(u, A.hot.id)) || (A.shield && (auraOf(u, id) || auraOf(u, 'weakened_soul'))) || ((A.cd || 0) >= 60 && u.hp / u.maxHp > 0.25)) continue; if (try_(id, u)) return; } // a big cooldown waits until you are nearly down
    }
    if (u.kiteUntil > C.t) return; // running to open the gap: a cast would only stop it
    if (u.role === 'healer') { // b.healOnly (a sim setting, #37): a healer that only heals, no damage with spare mana
      const allies = alive(friends(C, u));
      const low = allies.slice().sort((a, b2) => a.hp / a.maxHp - b2.hp / b2.maxHp)[0];
      const thr = 0.5 + 0.3 * (b.skill || 0.5);
      const tank = allies.find((a) => a.role === 'tank') || allies[0];
      if (u.cls === 'bard') {
        const hurt = allies.filter((a) => a.hp / a.maxHp < 0.8).length, low2 = allies.filter((a) => a.hp / a.maxHp < 0.55).length;
        // Widya's own songs first (a Legend's abilities): the ballad when the party is hurting, the lullaby on a crowd
        if (u.legend === 'widya') {
          if (low2 >= 2 && try_('songkeepers_ballad')) return;
          if (en.filter((e) => !e.boss).length >= 3 && try_('lakeside_lullaby')) return;
        }
        if (low2 >= 3 && has('grand_finale') && try_('grand_finale')) return;
        if (low2 >= 2 && has('chorus_grove') && try_('chorus_grove')) return;
        if (hurt >= 3 && has('encore') && try_('encore')) return;
        if (hurt >= 2 && has('song_of_rest') && !auraOf(tank, 'song_of_rest') && try_('song_of_rest')) return;
        if (low && low.hp / low.maxHp < 0.4 && has('crescendo') && low.hp / low.maxHp > 0.2 && try_('crescendo', low)) return;
        if (low && low.hp / low.maxHp < thr && try_('soothing_chord', low)) return;
        if (tank && tank.hp / tank.maxHp < 0.9 && has('counterpoint') && !auraOf(tank, 'pw_shield') && try_('counterpoint', tank)) return;
        if (tank && tank.hp / tank.maxHp < 0.85 && has('verse_of_mending') && !auraOf(tank, 'verse_of_mending') && try_('verse_of_mending', tank)) return;
        for (const s of ['marching_song', 'hearthsong', 'anthem_of_stone']) if (has(s) && !auraOf(u, s) && try_(s)) return;
        if (en.length >= 3 && has('lullaby') && Math.random() < 0.3 * (b.skill || 0.5) && try_('lullaby')) return;
        if (!b.healOnly && u.res / u.maxRes > 0.7 && Math.random() < 0.4) { const f = focusTarget(C, u); if (f && has('dirge') && !auraOf(f, 'dirge') && try_('dirge', f)) return; if (f) try_('dissonant_note', f); }
        return;
      }
      if (low && low.hp / low.maxHp < thr && has('lesser_heal') && try_('lesser_heal', low)) return;
      if (low && low.hp / low.maxHp < thr && has('holy_light') && try_('holy_light', low)) return;
      if (low && low.hp / low.maxHp < thr && has('healing_touch') && try_('healing_touch', low)) return;
      if (low && low.hp / low.maxHp < thr && has('healing_wave') && try_('healing_wave', low)) return;
      if (u.cls === 'shaman') {
        if (tank && has('stoneskin_totem') && !auraOf(tank, 'stoneskin') && try_('stoneskin_totem')) return;
        if (!b.healOnly && u.res / u.maxRes > 0.7 && Math.random() < 0.4) { const f = focusTarget(C, u); if (f) try_('lightning_bolt', f); }
        return;
      }
      if (tank && tank.hp / tank.maxHp < 0.85 && has('rejuvenation') && !auraOf(tank, 'rejuvenation') && try_('rejuvenation', tank)) return;
      if (u.cls === 'druid') {
        if (has('mark_wild') && !auraOf(u, 'mark_wild') && try_('mark_wild')) return;
        if (!b.healOnly && u.res / u.maxRes > 0.7 && Math.random() < 0.4) { const f = focusTarget(C, u); if (f && has('moonfire') && !auraOf(f, 'moonfire') && try_('moonfire', f)) return; if (f) try_('wrath', f); }
        return;
      }
      if (u.cls === 'paladin') {
        if (has('devotion_aura') && !auraOf(u, 'devotion_aura') && try_('devotion_aura')) return;
        if (!auraOf(u, 'seal') && u.res / u.maxRes > 0.6 && try_('seal_righteousness')) return;
        return;
      }
      if (tank && tank.hp / tank.maxHp < 0.9 && has('pw_shield') && !auraOf(tank, 'weakened_soul') && try_('pw_shield', tank)) return;
      if (tank && tank.hp / tank.maxHp < 0.8 && has('renew') && !auraOf(tank, 'renew') && try_('renew', tank)) return;
      if (!b.healOnly && u.res / u.maxRes > 0.7 && Math.random() < 0.5) {
        const f = focusTarget(C, u);
        if (f && has('sw_pain') && !auraOf(f, 'sw_pain') && try_('sw_pain', f)) return;
        if (f && try_('smite', f)) return;
      }
      return;
    }
    let tgt;
    // Legends use their own abilities first (Lyveus: shield when hurt, then his strike)
    if (u.legend === 'lyveus') {
      const t0 = C.units[u.target] && !C.units[u.target].dead ? C.units[u.target] : (u.role === 'tank' ? en[0] : focusTarget(C, u));
      if (u.hp / u.maxHp < 0.55 && try_('ancients_bulwark')) return;
      if (t0 && try_('oathbound_strike', t0)) return;
    }
    // Bromli: the brawl spin when two or more are close, otherwise he charges whatever the group is hitting
    if (u.legend === 'bromli') {
      const t0 = C.units[u.target] && !C.units[u.target].dead && C.units[u.target].side !== u.side ? C.units[u.target] : focusTarget(C, u);
      if (en.length >= 2 && t0 && try_('tavern_brawl', t0)) return;
      if (t0 && try_('beerhammer_charge', t0)) return;
    }
    // The whole kit (v10.4): defensives when low, big cooldowns on bosses, elites and crowds, area attacks on 3 or
    // more enemies, short-cooldown hits when ready. Better players use more of it; a poor one sticks to a few buttons.
    if (!u.legend) {
      const sk = b.skill || 0.5, kit = kitOf(u.cls), tk = C.units[u.target] && !C.units[u.target].dead && C.units[u.target].side !== u.side ? C.units[u.target] : focusTarget(C, u);
      const use = sk * sk; // a casual player (0.35) reaches for the rest of the kit 1 time in 8, a strong one (0.8) 2 in 3
      if (u.hp / u.maxHp < 0.35) for (const id of kit.defensive) if (has(id) && Math.random() < sk && try_(id)) return;
      // an opener (issue #2), under a player's rule (E.use: within 3 sec of first reaching melee, a target it has not hit);
      // a damage-dealer waits until the tank has hit the target, and a stun opener is not wasted on a boss
      if (u.role !== 'healer' && tk && kit.openers.length) {
        const tank = alive(u.side === 'ally' ? C.allies : C.enemies).find((a) => a.role === 'tank' && a !== u);
        if (u.role === 'tank' || !tank || (tk.hitBy && tk.hitBy[tank.uid])) for (const id of kit.openers) if (has(id) && !(D.ABILITIES[id].stun && tk.boss) && Math.random() < sk && try_(id, tk)) return;
      }
      if (u.role !== 'healer' && en.some((e) => e.boss)) for (const id of kit.burst) if (has(id) && Math.random() < use * 0.5 && try_(id)) return; // big cooldowns on bosses
      const spread = C.opts.killOrder === 'spread'; // spread: area attacks from 2 enemies, and more often
      if ((en.length >= 3 || (spread && en.length >= 2)) && tk) for (const id of kit.aoe) if (has(id) && Math.random() < (spread ? Math.min(1, use * 1.6) : use) && try_(id, tk)) return;
      const lowMana = soloFight(C, u, en) && D.CLASSES[u.cls].resource === 'mana' && u.res / u.maxRes < 0.4 && tk && tk.hp / tk.maxHp > 0.25; // one on one, mana runs out: keep it for the main attack
      if (u.role !== 'healer' && tk) for (const id of kit.hits) if (has(id) && !(lowMana && abCost(D.ABILITIES[id], u) > u.maxRes * 0.04) && Math.random() < use && try_(id, tk)) return;
    }
    if (u.role === 'tank') {
      // grab loose mobs
      const loose = en.find((e) => e.target && e.target !== u.uid && C.units[e.target] && C.units[e.target].role !== 'tank');
      if (loose && has('taunt') && Math.random() < 0.4 + 0.6 * (b.skill || 0.5) && try_('taunt', loose)) return;
      if (loose && Math.random() < 0.5 && (!u.pos || !loose.pos || E.dist(u, loose) <= DIST.melee + 1)) u.target = loose.uid; // distance: hold the front; a taunted monster comes to you
      // with a kill order, the tank holds the skull so the group's damage lands where it has threat
      const skull = en.find((e) => e.mark === 'skull');
      if (skull && !loose) u.target = skull.uid;
      tgt = C.units[u.target];
      if (!tgt || tgt.dead) { tgt = skull || en[0]; u.target = tgt.uid; }
      if (u.cls === 'druid') {
        if (!u.form && has('bear_form') && try_('bear_form')) return;
        if (u.form === 'bear') {
          if (loose && try_('growl', loose)) return;
          if (u.res >= 20) try_('maul', tgt);
        } else try_('wrath', tgt);
        return;
      }
      if (u.cls === 'paladin') {
        if (has('devotion_aura') && !auraOf(u, 'devotion_aura') && try_('devotion_aura')) return;
        if (!auraOf(u, 'seal') && try_('seal_righteousness')) return;
        if (has('judgement') && try_('judgement', tgt)) return;
        if (u.hp / u.maxHp < 0.25 && has('divine_protection') && try_('divine_protection')) return;
        if (loose && has('hammer_justice') && try_('hammer_justice', loose)) return;
        return;
      }
      if (en.length >= 2 && has('thunder_clap') && try_('thunder_clap')) return;
      if (has('rend') && !auraOf(tgt, 'rend') && tgt.hp > tgt.maxHp * 0.3 && try_('rend', tgt)) return;
      if (u.res >= 20 && try_('heroic_strike', tgt)) return;
      if (has('battle_shout') && !auraOf(u, 'battle_shout') && try_('battle_shout')) return;
      return;
    }
    // dps
    tgt = focusTarget(C, u);
    if ((b.skill || 0.5) < 0.35 && Math.random() < 0.25) tgt = en[rint(0, en.length - 1)];
    if (!tgt) return;
    u.target = tgt.uid;
    // careful players ease off when they're about to pull aggro
    const tankU = alive(friends(C, u)).find((a) => a.role === 'tank');
    if (tankU && tgt.target === tankU.uid) {
      const mine = tgt.threat[u.uid] || 0, tk = tgt.threat[tankU.uid] || 0;
      if (mine > tk * 0.9 && Math.random() < (b.skill || 0.5)) { u.auto = false; return; }
    }
    u.auto = true;
    if (u.cls === 'mage') {
      if (has('fire_blast') && try_('fire_blast', tgt)) return;
      if (has('arcane_missiles') && u.res / u.maxRes > 0.6 && Math.random() < 0.3 && try_('arcane_missiles', tgt)) return;
      if (has('frostbolt') && Math.random() < 0.4 && try_('frostbolt', tgt)) return;
      try_('fireball', tgt);
    } else if (u.cls === 'rogue') {
      // 5 combo points go to Eviscerate first (it glows); Slice and Dice when it is down and the target will last
      if (u.cp >= 5 && u.cpTarget === tgt.uid) { if (try_('eviscerate', tgt)) return; if (abCost(D.ABILITIES.eviscerate, u) > u.res) return; } // at 5, wait for the energy
      if (has('slice_and_dice') && u.cp >= 2 && !auraOf(u, 'slice_and_dice') && tgt.hp > tgt.maxHp * 0.5 && u.cpTarget === tgt.uid && try_('slice_and_dice')) return;
      if (u.cp >= (tgt.hp < tgt.maxHp * 0.25 ? 1 : (b.skill || 0.5) >= 0.6 ? 5 : 4) && u.cpTarget === tgt.uid && try_('eviscerate', tgt)) return; // good players wait for 5 combo points
      try_('sinister_strike', tgt);
    } else if (u.cls === 'shaman') {
      if (!u.auras.some((a) => a.seal) && try_('rockbiter_weapon')) return;
      if (has('lightning_shield') && !auraOf(u, 'lightning_shield') && try_('lightning_shield')) return;
      if (has('earth_shock') && (u.res / u.maxRes > 0.4 || tgt.hp < tgt.maxHp * 0.25) && try_('earth_shock', tgt)) return;
      if (has('searing_totem') && !auraOf(tgt, 'searing_totem') && tgt.hp > tgt.maxHp * 0.4 && try_('searing_totem', tgt)) return;
      try_('lightning_bolt', tgt);
    } else if (u.cls === 'hunter') {
      if (has('hunters_mark') && !auraOf(tgt, 'hunters_mark') && tgt.hp > tgt.maxHp * 0.4 && try_('hunters_mark', tgt)) return;
      if (has('serpent_sting') && !auraOf(tgt, 'serpent_sting') && tgt.hp > tgt.maxHp * 0.35 && try_('serpent_sting', tgt)) return;
      if (has('arcane_shot') && try_('arcane_shot', tgt)) return;
    } else if (u.cls === 'druid') {
      if (has('moonfire') && !auraOf(tgt, 'moonfire') && try_('moonfire', tgt)) return;
      if (has('insect_swarm') && !auraOf(tgt, 'insect_swarm') && tgt.hp > tgt.maxHp * 0.3 && try_('insect_swarm', tgt)) return;
      // Star Bolt, the big slow cast, on a target that will live through it; Wrath otherwise (v10.4)
      if (has('starfire') && tgt.hp > tgt.maxHp * 0.4 && Math.random() < 0.3 + 0.5 * (b.skill || 0.5) && try_('starfire', tgt)) return;
      try_('wrath', tgt);
    } else if (u.cls === 'warlock') {
      if (has('life_tap') && u.res / u.maxRes < 0.25 && u.hp / u.maxHp > 0.6 && try_('life_tap')) return;
      if (tgt.hp > tgt.maxHp * 0.35) {
        if (has('corruption') && !auraOf(tgt, 'corruption') && try_('corruption', tgt)) return;
        if (has('curse_of_agony') && !auraOf(tgt, 'curse_of_agony') && try_('curse_of_agony', tgt)) return;
        if (!auraOf(tgt, 'immolate') && try_('immolate', tgt)) return;
      }
      try_('shadow_bolt', tgt);
    } else if (u.cls === 'paladin') {
      if (!auraOf(u, 'seal') && try_('seal_righteousness')) return;
      if (has('judgement')) try_('judgement', tgt);
    } else if (u.cls === 'warrior') {
      if (has('rend') && !auraOf(tgt, 'rend') && try_('rend', tgt)) return;
      if (u.res >= 30) try_('heroic_strike', tgt);
    } else if (u.cls === 'priest') {
      if (has('sw_pain') && !auraOf(tgt, 'sw_pain') && try_('sw_pain', tgt)) return;
      try_('smite', tgt);
    } else if (u.cls === 'bard') { // a bard dealing damage (v10.9): the dirge on the target, the marching song, the sour note
      if (has('marching_song') && !auraOf(u, 'marching_song') && try_('marching_song')) return;
      if (has('dirge') && !auraOf(tgt, 'dirge') && tgt.hp > tgt.maxHp * 0.3 && try_('dirge', tgt)) return;
      try_('dissonant_note', tgt);
    }
  }

  // ------------------------------------------------------------- tick
  E.tick = function (C, dt) {
    if (C.over) return;
    C.t += dt;
    if (C.blasts && C.blasts.length) { // Omen Volatile: the dead explode (v10.4)
      const VO = root.TRIALS.OMENS.volatile;
      for (const bl of C.blasts.filter((x) => x.t <= C.t)) { for (const a of alive(C.allies)) dealDamage(C, { uid: -1, side: 'enemy', name: bl.name, auras: [], kind: 'mob' }, a, a.maxHp * VO.blast, { fx: 'blast', school: 'fire', ab: 'volatile' }); ev(C, { type: 'emote', uid: -1, text: `${bl.name} explodes!` }); }
      C.blasts = C.blasts.filter((x) => x.t > C.t);
    }
    const all = C.allies.concat(C.enemies);
    for (const u of all) {
      u.clock = C.t;
      if (u.dead) continue;
      if (u.kind === 'mob') flyTick(C, u, dt); // stage 4: a flyer's height
      // Omen Mending: a wounded enemy heals a little every second (v10.4)
      if (u.side === 'enemy' && C.opts.omens && C.opts.omens.includes('mending') && root.TRIALS) { const MO = root.TRIALS.OMENS.mending; if (u.hp < u.maxHp * MO.below) u.hp = Math.min(u.maxHp, u.hp + u.maxHp * MO.rate * dt); }
      // auras
      let changed = false;
      for (const a of u.auras.slice()) {
        if (a.dot != null && a.next <= C.t + 1e-6) {
          a.next += a.every;
          const src = C.units[a.src] || u;
          dealDamage(C, src, u, a.dot, { school: a.school, ab: a.ab, tick: true, effect: a.effect });
          const tb = !a.effect && fxOf(src, 'tithe_of_battle'), TB = tb && D.EFFECTS.tithe_of_battle; // Tithe of Battle (v10.10)
          if (tb && src.maxRes) { const g = src.resType === 'mana' ? src.maxRes * TB.mana * tb.f : (src.resType === 'rage' ? TB.rage : TB.energy) * tb.f, before = src.res; src.res = Math.min(src.maxRes, src.res + g); fxDone(C, src, 'tithe_of_battle', src.res - before, src.resType === 'mana' ? 'mana' : 'power'); }
          proc(C, src, 'tick', a.ab);
          if (u.dead) break;
        }
        if (a.hot != null && a.next <= C.t + 1e-6) { a.next += a.every; heal(C, C.units[a.src] || u, u, a.hot, { ab: a.ab, tick: true, effect: a.effect }); }
        if (a.until <= C.t) { u.auras.splice(u.auras.indexOf(a), 1); if (a.stats) changed = true; }
      }
      if (u.dead) continue;
      if (changed) E.recalc(u);
      if (u.race === 'troll' && u.side === 'ally' && u.hp < u.maxHp) u.hp = Math.min(u.maxHp, u.hp + u.maxHp * 0.002 * dt);
      // resources
      if (u.resType === 'energy') u.res = Math.min(100, u.res + 10 * dt);
      if (u.resType === 'mana' && C.t - u.lastCastT >= 5) u.res = Math.min(u.maxRes, u.res + ((13 + u.st.spi / 4) / 2) * dt);
      // casting
      if (u.cast) {
        if (stunned(C, u)) { u.cast = null; continue; }
        const cast = u.cast; const ab = D.ABILITIES[cast.ab]; const tgt = C.units[cast.tgt];
        if (!tgt || tgt.dead) { u.cast = null; ev(C, { type: 'castStop', src: u.uid }); continue; }
        if (cast.channel) {
          const due = Math.floor((C.t - cast.start) / (cast.channel / 3));
          if (due > cast.ticks) {
            if (cast.ticks === 0) { u.res -= abCost(ab, u); u.lastCastT = C.t; }
            cast.ticks++;
            const r = spellRoll(u, tgt, C);
            const base = scaled(ab.dmg.base, ab.dmg.perLvl, u.level) + ab.dmg.coef * u.st.sp;
            if (r === 'miss') ev(C, { type: 'avoid', src: u.uid, tgt: tgt.uid, what: 'resist', ab: cast.ab });
            else dealDamage(C, u, tgt, r === 'crit' ? base * 1.5 : base, { school: ab.dmg.school, crit: r === 'crit', ab: cast.ab });
          }
          if (C.t >= cast.end || cast.ticks >= 3) { u.cast = null; ev(C, { type: 'castStop', src: u.uid, done: true }); }
          continue;
        }
        if (C.t >= cast.end) {
          u.cast = null;
          if (abCost(ab, u) > u.res + 0.001) { ev(C, { type: 'castStop', src: u.uid }); continue; }
          const crg = rangeOf(ab); // distance: a target that got out of range during the cast is missed
          if (crg != null && tgt !== u && tgt.pos && u.pos && E.dist(u, tgt) > crg + 0.01) { ev(C, { type: 'castStop', src: u.uid, range: true }); continue; }
          ev(C, { type: 'castStop', src: u.uid, done: true });
          resolve(C, u, cast.ab, tgt);
        }
        continue;
      }
      if (stunned(C, u)) { if (u.fleeUntil > C.t) moveTick(C, u, dt); if (u.kind === 'bot') botThink(C, u); continue; }
      // AI
      if (u.kind === 'mob') { pickMobTarget(C, u); specials(C, u, dt); }
      else if (u.kind === 'bot') botThink(C, u);
      else if (u.kind === 'pet') petThink(C, u);
      moveTick(C, u, dt); // distance: close on the target when out of reach
      // auto attack
      const tgt = C.units[u.target];
      if (tgt && !tgt.dead && tgt.side !== u.side && (u.kind === 'mob' || u.auto)) {
        const shoot = u.cls === 'hunter' && u.st.rMin != null && !u.form;
        const bolt = u.kind === 'mob' && (D.MOBS[u.key] || {}).ranged; // stage 4: an archer's shot or a caster's bolt, from range
        const wand = !flat(u) && !shoot && CASTERS[u.cls] && !u.form; // stage 4: a caster's auto attack is a wand shot, the same damage from range
        const reach = shoot ? DIST.shot : bolt || wand ? DIST.spell : DIST.melee;
        const sp = flat(u) ? u.swingSpeed : shoot ? u.st.rswing : u.st.swing;
        u.swingT -= dt * (1 - slowPct(u) / 100);
        if (u.swingT <= 0 && u.pos && tgt.pos && E.dist(u, tgt) > reach + 0.01) u.swingT = 0; // out of reach: the swing waits
        else if (u.swingT <= 0) {
          u.swingT += sp;
          if (u.noMelee) { /* casts instead */ } else if (bolt) mobBolt(C, u, tgt, bolt); else if (shoot) swing(C, u, tgt, { ranged: true }); else if (wand) { if (C.t - u.lastCastT > 1.6) swing(C, u, tgt, { ranged: true, wand: true, ab: 'wand' }); } else if (flat(u) || u.cls === 'warrior' || u.cls === 'rogue' || u.cls === 'paladin' || C.t - u.lastCastT > 1.6) swing(C, u, tgt);
          if (u.side === 'ally') { tgt.hitBy = tgt.hitBy || {}; tgt.hitBy[u.uid] = true; }
        }
      } else if (u.side === 'ally' && (!tgt || tgt.dead)) {
        // retarget to something alive
        const f = alive(C.enemies)[0];
        if (f && u.kind !== 'player') u.target = f.uid;
        if (f && u.kind === 'player' && C.opts.autoRetarget !== false) u.target = f.uid;
      }
    }
    if (!alive(C.enemies).length && !(C.blasts && C.blasts.length)) C.over = 'win'; // Volatile: the last blast goes off before the fight ends
    else if (!alive(C.allies).length) C.over = 'lose';
    else if (C.opts.soloUid && C.units[C.opts.soloUid].dead) C.over = 'lose';
  };

  // Copy a unit's state back onto its character after a fight (hp, res, long buffs).
  // live: a save while the fight goes on (#217) writes the caster values from a copy, so the unit keeps its form and rage
  E.writeBack = function (C, u, nowMs, live) {
    if (u.form && !u.dead) { if (live) { u = Object.assign({}, u); toCaster(u); } else E.shiftOut(C, u); }
    const ch = u.char;
    ch.hp = u.dead ? 0 : Math.round(u.hp);
    ch.res = u.resType === 'energy' ? 100 : Math.round(u.res);
    const cds = {};
    for (const id in u.cds) if (u.cds[id] > C.t) cds[id] = Math.round(nowMs + (u.cds[id] - C.t) * 1000);
    if (Object.keys(cds).length) ch.cds = cds; else delete ch.cds;
    ch.auras = u.auras.filter((a) => a.persistent && a.until > C.t).map((a) => ({ id: a.id, stats: a.stats, until: nowMs + (a.until - C.t) * 1000, seal: a.seal, sealSchool: a.sealSchool, thorns: a.thorns, name: a.name, icon: a.icon, keep: a.keep }));
  };

  root.E = E;
})(typeof window !== 'undefined' ? window : globalThis);
