// Realm of Loner — game controller: world, quests, items, group finder, dungeon runs, saves.
(function (root) {
  const D = root.D, E = root.E, B = root.B;
  const G = {};
  const rnd = E.rnd, rint = E.rint, clamp = E.clamp;
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  // #74: what bots say, when and who says it draws from the cosmetic stream (E.crand); everything that decides an outcome
  // (fights, drops, rolls, who joins or leaves a group) stays on Math.random
  const crand = () => E.crand(), cpick = (a) => E.cpick(a);
  const now = () => Date.now();
  const lower = (t) => String(t).toLowerCase();
  // Characters: one save per character under azsolo.char.<id>, plus an index for the select screen.
  const OLD_KEY = 'azsolo.save.v1', INDEX_KEY = 'azsolo.chars', CHAR_KEY = (id) => 'azsolo.char.' + id;
  G.MAX_CHARS = 10;
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { } },
  };
  let listeners = {};
  G.on = (t, fn) => { (listeners[t] = listeners[t] || []).push(fn); };
  const emit = (t, d) => { for (const fn of (listeners[t] || [])) try { fn(d); } catch (e) { console.error(e); } };
  G.emit = emit;
  G.fight = null; // live combat (not saved)
  G.pUnit = null;

  // ============================================================ new game / save
  G.newGame = function (o) {
    const C = D.CLASSES[o.cls];
    const race = D.RACES[o.race] ? o.race : 'human';
    const start = D.RACES[race].start;
    const t = now();
    const S = {
      v: 1, id: 'c' + t.toString(36) + Math.floor(Math.random() * 1e4).toString(36), created: t, lastSeen: t, lastSim: t, nextBotId: 1000, server: {},
      player: {
        name: o.name, cls: o.cls, gender: o.gender || 'm', skin: o.skin || 0, hair: o.hair || 0,
        level: 1, xp: 0, rested: 0, money: 0, hp: null, res: null, place: start, bind: start,
        equip: Object.assign({ weapon: G.copyItem(C.startWeapon), chest: G.copyItem(C.startChest) }, C.startRanged ? { ranged: G.copyItem(C.startRanged) } : {}),
        bags: [{ item: G.copyItem('hearthstone'), n: 1 }, { item: G.copyItem('tough_bread'), n: 4 }].concat(C.resource === 'mana' ? [{ item: G.copyItem('spring_water'), n: 4 }] : []),
        race, pet: (C.pets || []).includes('imp') ? { type: 'imp', name: pick(D.PETS.imp.names), hp: null } : null, // only a class whose pets include the imp (#34: Hunters started with one); a Hunter tames at 10
        quests: {}, done: {}, auras: [], hearthAt: 0, guild: -1, kills: 0, deaths: 0, visited: { [start]: true }, played: 0,
      },
      world: {}, bots: null, chat: [], news: [], pending: [], group: null, queue: null, run: null, flags: { v10names: true }, // a new save has the v10 names already: the migration (which keeps only open requests in chat) is for older ones
    };
    joinRoster(S); // #71: the account's realm (made here, as before, the first time)
    G.S = S;
    const u = E.charUnit(G.charOf(), 'ally', 'player', t);
    S.player.hp = u.maxHp; S.player.res = u.resType === 'rage' ? 0 : u.maxRes;
    sys(`Welcome to Realm of Loner. Realm: ${D.REALM}.`);
    sys('Tap a creature to attack it. Talk to people with a yellow ! to get quests.');
    G.save();
    return S;
  };

  // Move a pre-1.5.1 single save into the character list once.
  function migrate() {
    const old = ls.get(OLD_KEY);
    if (!old) return;
    try {
      const S = JSON.parse(old);
      if (!S.id) S.id = 'c' + (S.created || now()).toString(36);
      ls.set(CHAR_KEY(S.id), JSON.stringify(S));
      const idx = readIndex(); if (!idx.some((c) => c.id === S.id)) idx.push(summary(S)); writeIndex(idx);
      ls.del(OLD_KEY);
    } catch (e) { /* leave the old save alone if it can't be read */ }
  }
  function readIndex() { try { return JSON.parse(ls.get(INDEX_KEY) || '[]'); } catch (e) { return []; } }
  function writeIndex(idx) { ls.set(INDEX_KEY, JSON.stringify(idx)); }
  function summary(S) {
    const P = S.player;
    return { id: S.id, name: P.name, cls: P.cls, race: P.race || 'human', gear: G.gearLooks(P), level: P.level, place: P.place, skin: P.skin, hair: P.hair, gender: P.gender, lastSeen: S.lastSeen || now(), created: S.created };
  }
  // #71: one realm per account. The bots (the roster), the server's records and its clock live once under azsolo.roster,
  // so every character meets the same people (each sees its own faction's half, as before). A character's save still
  // carries a copy of the bots (older builds and save codes read it); on load it only brings that character's friends
  // into the roster by name, so a friend from another character, another device or an older save is never lost.
  // The first time, the realm furthest on (a tie: the oldest character's) becomes the account's. Same name, same person: ids are remapped by name.
  const ROSTER_KEY = 'azsolo.roster';
  B.accountNames = () => readIndex().map((c) => c.name); // newcomers never take a character's name (#345)
  const readRoster = () => { try { return JSON.parse(ls.get(ROSTER_KEY) || 'null'); } catch (e) { return null; } };
  function joinRoster(S) {
    const own = Array.isArray(S.bots) ? S.bots : [];
    let R = readRoster();
    if (!R || !Array.isArray(R.bots)) {
      const saves = readIndex().filter((c) => c.id !== S.id).map((c) => G.readSave(c.id)).concat([S]).filter((x) => x && Array.isArray(x.bots) && x.bots.length);
      const src = saves.sort((a, b) => (b.lastSim || 0) - (a.lastSim || 0) || (a.created || 0) - (b.created || 0))[0]; // the realm furthest on (#344: a cloud restore has no roster, and the oldest character's copy can be months behind); a tie, the oldest
      R = src ? { v: 1, from: src.id, bots: src.bots, nextBotId: src.nextBotId || 1000, lastSim: src.lastSim || now(), server: src.server || {} }
        : { v: 1, from: S.id, bots: B.makeRealm(), nextBotId: 1000, lastSim: S.lastSim || now(), server: {} };
    }
    const names = new Map(R.bots.map((b) => [b.name, b])), byId = new Map(own.map((b) => [String(b.id), b]));
    // a name the realm changed (#314) still finds its person: a save may know them by the old one (#326)
    const ren = (R.server && R.server.renamed) || {};
    const byName = { get: (n) => { for (let i = 0; i < 5 && n != null; i++) { if (names.has(n)) return names.get(n); n = ren[n]; } return undefined; }, set: (n, b) => names.set(n, b) };
    const soc = S.soc, f = soc && soc.friends;
    if (f) {
      const nf = {};
      for (const id of Object.keys(f)) {
        // a friend this save's copy doesn't hold: by id only in the realm this save made, where ids are its own (#306)
        const o = byId.get(id); let b = o ? byName.get(o.name) : R.from === S.id ? R.bots.find((x) => String(x.id) === id) : null;
        if (!b && o) { b = Object.assign({}, o, { id: R.nextBotId++ }); R.bots.push(b); byName.set(b.name, b); } // a friend never vanishes: they join the realm
        if (b) nf[b.id] = f[id];
      }
      soc.friends = nf;
    }
    // anything this save remembers by a bot's id now names the roster's person of that name (or no one)
    // a request stays open while its sender is still the same person here (#307: one quit anywhere expired them all)
    if (own.some((o) => { const b = byName.get(o.name); return !b || b.id !== o.id; })) {
      const same = new Set(own.filter((o) => { const b = byName.get(o.name); return b && b.id === o.id; }).map((o) => String(o.id)));
      for (const k of ['botSaid', 'lfAt']) if (S[k]) for (const id of Object.keys(S[k])) if (!same.has(id)) delete S[k][id];
      for (const m of S.chat || []) {
        if (m.fromId == null) continue;
        const b = byName.get(m.from), kept = b && b.id === m.fromId;
        m.fromId = b ? b.id : null;
        if (!kept && m.act && m.act.state === 'open') m.act.state = 'expired';
      }
      // runs together (#72) are by id too: they follow the person, by name (#308)
      const met = S.player && S.player.met;
      if (met) {
        const nm = {};
        for (const id of Object.keys(met)) { const o = byId.get(id), b = o ? byName.get(o.name) : null; if (b) nm[b.id] = met[id]; }
        S.player.met = nm;
      }
      // the people in a group, a queue's group and a world party follow by name too (#413); one not on this realm
      // leaves a world party (a run or a queue's group keeps its copy, which plays on)
      for (const ms of [S.group && S.group.members, S.queue && S.queue.group && S.queue.group.members, S.wparty && S.wparty.members]) for (const m of ms || []) { const b = m && m.bot && byName.get(m.bot.name); if (b) m.bot.id = b.id; }
      if (S.wparty) { S.wparty.members = S.wparty.members.filter((m) => m.bot && byName.get(m.bot.name)); if (!S.wparty.members.length) S.wparty = null; }
    }
    S.bots = R.bots; S.server = R.server || (R.server = {}); S.lastSim = R.lastSim; S.nextBotId = Math.max(R.nextBotId, 1000);
    // nobody on the realm has a character's name (#314): such a person gets another, and stays kept if they were
    const mine = new Set(readIndex().map((c) => c.name).concat(S.player ? [S.player.name] : []));
    const clash = R.bots.filter((b) => mine.has(b.name));
    if (clash.length) {
      const used = new Set(R.bots.map((b) => b.name).concat(S.server.gone || [], [...mine])), k = S.server.keep;
      const ren = S.server.renamed = S.server.renamed || {};
      for (const b of clash) { const n = B.makeName(used); if (k && k[b.name]) { delete k[b.name]; k[n] = 1; } if (!ren[b.name]) ren[b.name] = n; b.name = n; } // the first person of that name keeps the link (#345)
    }
    S.flags = S.flags || {}; S.flags.roster = true;
    G.R = R; saveRoster(S);
  }
  // guildmates who quit while another character was played said goodbye: their lines reach this guild chat (#305)
  function deliverByes(S) {
    const byes = ((S.server && S.server.byes) || []).filter((e) => e.c === S.id); if (!byes.length) return;
    S.chat = S.chat || [];
    for (const e of byes) S.chat.push({ id: (S.chatSeq = (S.chatSeq || 0) + 1), t: e.t, ch: 'guild', from: e.n, cls: e.cls, fromId: null, text: e.text });
    if (S.chat.length > 160) S.chat.splice(0, S.chat.length - 160);
    S.server.byes = S.server.byes.filter((e) => e.c !== S.id);
  }
  // every character's friends, by name, so the realm never lets one quit without a goodbye (B.trimRoster)
  // and every character's guild (S.server.homes, #305), so its members never move guild and say goodbye if they quit
  function keepFriends(S) {
    const H = S.server.homes || (S.server.homes = {}); H[S.id] = S.player && S.player.guild != null ? S.player.guild : -1;
    const f = S.soc && S.soc.friends; if (!f) return;
    const k = S.server.keep || (S.server.keep = {});
    for (const id of Object.keys(f)) { const b = S.bots.find((x) => String(x.id) === id); if (b) k[b.name] = 1; }
  }
  // a character deleted (#306): its guild and its friends stop counting, unless another character has them too
  function forget(id) {
    const R = G.S && G.R && G.S.bots === G.R.bots ? G.R : readRoster(); if (!R || !R.server) return;
    // the live realm is written whole (#343): its people with its own clock and next id, or a later load runs the same days again
    if (R === G.R) { R.lastSim = G.S.lastSim; R.nextBotId = G.S.nextBotId; R.server = G.S.server; }
    const SV = R.server; if (SV.homes) delete SV.homes[id];
    if (SV.byes) SV.byes = SV.byes.filter((e) => e.c !== id);
    const k = {}, names = new Map(R.bots.map((b) => [String(b.id), b.name]));
    for (const c of readIndex()) { if (c.id === id) continue; const s = G.S && G.S.id === c.id ? G.S : G.readSave(c.id); for (const fid of Object.keys(((s || {}).soc || {}).friends || {})) if (names.has(fid)) k[names.get(fid)] = 1; }
    SV.keep = k;
    ls.set(ROSTER_KEY, JSON.stringify(R));
  }
  // Remove friend (#84): off this character's list; the account stops keeping them (#71: friends never quit) only when
  // no other character has them as a friend either
  // another character on the account has them as a friend too (Remove friend's confirm says what it costs, #322)
  G.friendElsewhere = (botId) => readIndex().some((c) => c.id !== G.S.id && (((G.readSave(c.id) || {}).soc || {}).friends || {})[botId]);
  G.unfriend = function (botId) {
    const S = G.S, f = S.soc && S.soc.friends; if (!f || !f[botId]) return false;
    delete f[botId];
    const b = S.bots.find((x) => x.id === botId), k = S.server && S.server.keep;
    const elsewhere = readIndex().some((c) => c.id !== S.id && (((G.readSave(c.id) || {}).soc || {}).friends || {})[botId]);
    if (b && k && !elsewhere) delete k[b.name];
    G.save(); emit('change');
    return true;
  };
  // a person's own story (#72) lives in the account's roster only: each character's copy of the bots (for older builds
  // and save codes) leaves it out, so ten characters don't carry ten copies of it
  // the realm's records of who quit and their waiting goodbyes (S.server.gone, .byes) live there too: up to 1500 names,
  // ~50k a copy (#311); an older build reads a save without them as a realm nobody has left yet
  const ROSTER_ONLY = function (k, v) { return k === 'hist' || k === 'pals' || k === 'rival' || ((k === 'gone' || k === 'byes') && Array.isArray(v) && this === (G.S && G.S.server)) ? undefined : v; };
  function saveRoster(S) {
    const R = G.R; if (!R || R.bots !== S.bots) return;
    keepFriends(S); R.lastSim = S.lastSim; R.nextBotId = S.nextBotId; R.server = S.server;
    if (!ls.set(ROSTER_KEY, JSON.stringify(R))) cantSave();
  }
  // a write the browser refused (its storage is full): said, not swallowed, at most every 10 minutes (#311)
  let cantSaidAt = 0;
  function cantSave() { if (now() - cantSaidAt < 600000) return; cantSaidAt = now(); toast("Couldn't save: this device's storage is full."); }
  G.characters = function () { migrate(); return readIndex().sort((a, b) => b.lastSeen - a.lastSeen); };
  G.save = function () {
    if (!G.S) return;
    G.S.lastSeen = now();
    if (G.fight && G.pUnit) E.writeBack(G.fight, G.pUnit, now(), true); // the fight goes on: don't shift it out (#217)
    const ok = ls.set(CHAR_KEY(G.S.id), JSON.stringify(G.S, ROSTER_ONLY)); if (!ok) cantSave();
    saveRoster(G.S);
    // the list says only what the save holds (#329): a refused write leaves its last entry, and a character never written isn't listed
    if (ok) { const idx = readIndex().filter((c) => c.id !== G.S.id); idx.push(summary(G.S)); writeIndex(idx); }
    return ok; // a refused write (storage full) is false: a two-sided move stops before its second side
  };
  G.hasSave = function () { return G.characters().length > 0; };
  G.logout = function () { G.save(); G.S = null; G.fight = null; G.pUnit = null; };
  G.deleteCharacter = function (id) {
    forget(id);
    ls.del(CHAR_KEY(id));
    writeIndex(readIndex().filter((c) => c.id !== id));
    if (G.S && G.S.id === id) { G.S = null; G.fight = null; G.pUnit = null; }
  };
  // A character's stored save without loading it (no catch-up, no fixes), and storing one that is not being played.
  // Cloud save uses these to back up every character and to bring one in under its own id.
  G.readSave = function (id) { try { return JSON.parse(ls.get(CHAR_KEY(id)) || 'null'); } catch (e) { return null; } };
  // a save with the realm-only history put back from the shared roster (#383), for cloud files: a realm rebuilt from
  // the cloud on a new device keeps everyone's story and who has quit
  G.fullSave = function (id) {
    if (G.S && G.S.id === id) { G.save(); return JSON.parse(JSON.stringify(G.S)); }
    const S = G.readSave(id), R = S && readRoster(); if (!R || !Array.isArray(R.bots)) return S;
    const by = new Map(R.bots.map((b) => [b.id, b]));
    for (const b of S.bots || []) { const r = by.get(b.id); if (r && r.name === b.name) for (const k of ['hist', 'pals', 'rival']) if (r[k] !== undefined) b[k] = r[k]; }
    if (R.server) { S.server = S.server || {}; for (const k of ['gone', 'byes']) if (Array.isArray(R.server[k])) S.server[k] = R.server[k]; }
    return S;
  };
  G.writeSave = function (S) {
    if (!S || !S.id) return false;
    if (G.S && G.S.id === S.id) { G.S = null; G.fight = null; G.pUnit = null; } // the caller loads it again with G.load
    if (!Array.isArray(S.chat)) S.chat = [];
    const ok = ls.set(CHAR_KEY(S.id), JSON.stringify(S));
    const idx = readIndex().filter((c) => c.id !== S.id); idx.push(summary(S)); writeIndex(idx);
    return ok;
  };
  G.load = function (id) {
    migrate();
    if (!id) { const list = G.characters(); if (!list.length) return null; id = list[0].id; }
    const raw = ls.get(CHAR_KEY(id));
    if (!raw) return null;
    try { G.S = JSON.parse(raw); } catch (e) { return null; }
    const S = G.S;
    if (!S.id) S.id = id;
    G.fight = null; G.pUnit = null;
    S.pending = []; S.chatTimers = {};
    joinRoster(S); // #71
    if (S.lastSeen > now()) shiftClock(S, now() - S.lastSeen); // before anything below sets a fresh time
    lastTick = now();
    if (root.SOC && S.soc && S.soc.applied) SOC.resumeApply(); // #417
    if (S.flags.guildOfferOpen != null) { delete S.flags.guildOfferOpen; G.reofferGuild(); } // the level-5 invitation the app closed on (#411)
    // a reload mid-pull is a wipe (#349): the pull isn't undone for free, so a lost boss fight counts as lost
    if (S.run && S.run.phase === 'fight') { S.run.wipes = (S.run.wipes || 0) + 1; S.run.reloadWipes = (S.run.reloadWipes || 0) + 1; S.run.momentum = 0; S.run.phase = 'wipe'; S.run.restUntil = now() + 12000; S.player.hp = null; S.player.res = null; if (S.group) for (const m of S.group.members) { m.hp = null; m.res = null; } sys('You left mid-fight: it counts as a wipe. Running back...'); }
    // a clock that went back never leaves a timer longer than its full length (#393): a day as a ghost, or on hearth
    { const t = now(), P = S.player; if (P.ghostUntil > t + 15000) P.ghostUntil = t + 15000; if (P.hearthAt > t + 15 * 60000) P.hearthAt = t + 15 * 60000; if ((S.flags.deserterUntil || 0) > t + DESERTER) S.flags.deserterUntil = t + DESERTER; }
    // a duel or brawl round left by closing the app is lost, never undone (#380, #381)
    if (S.duelOn) { const d = S.duelOn; delete S.duelOn; S.player.hp = Math.max(1, Math.round(G.vitals().maxHp * 0.05)); if (d.wager) S.player.money = Math.max(0, S.player.money - d.wager); sys(`You left the duel with ${d.name}: it counts as lost.${d.wager ? ' You paid ' + G.moneyText(d.wager) + '.' : ''}`); }
    for (const k in S.world || {}) { const w = S.world[k]; for (const m of (w.mobs || []).concat(w.event || [], Object.values(w.named || {}))) if (m.state === 'fight') m.state = 'alive'; } // a fight the app closed on ended with it (#409)
    if (S.bg && S.bg.phase === 'fight') { const go = S.bg.go; if (go) { sys('You left the battleground fight: it counts as lost.'); endBgFight({ over: 'loss', enemies: [], bg: { banner: go.group, name: bgName(S.bg, go.group) } }); } else S.bg.phase = 'choose'; } // a battleground, the same (#408)
    if (S.brawl && S.brawl.phase === 'fight') { S.brawl.phase = 'choose'; const foe = G.brawlOpponent(); if (foe) endBrawlFight({ over: 'loss', brawl: { foe: foe.name } }); else S.brawl.phase = 'done'; }
    try { G.refreshHeirlooms(); } catch (e) { /* older save */ }
    try { G.refreshAccountMounts(); } catch (e) { /* older save */ }
    restack(S.player); // #485
    pruneBounties(); // #154
    G.lwRevokeTest(); // rewards from a test build's season stay in test builds
    if (G.lwRec().steed) G.giveTrialswornMount('wickless_steed'); // the Wickless Steed rides with every character
    G.lwExpire(); // candles from a festival that has ended
    G.lnRevokeTest(); { const r = G.lnRec(); if (r.hound) G.giveTrialswornMount('frost_hound'); if (r.stag) G.giveTrialswornMount('pale_stag'); } G.lnExpire(); // Longnight, the same
    { const tw = G.account().trialsworn || {}; for (const k in tw) if (tw[k] && D.TRIALSWORN[k] && D.TRIALSWORN[k].mount) G.giveTrialswornMount(D.TRIALSWORN[k].mount); } // Trialsworn Chargers ride with every character
    if (S.player.keepsake) { S.player.wardrobe = Object.assign({ back: S.player.keepsake }, S.player.wardrobe); delete S.player.keepsake; } // v10.3: keepsakes moved into the wardrobe
    // v10: the world has new names. A save keeps copies of items, so their names come fresh from the data by id;
    // simulated players from other realms move to the new realm names; old chat goes (it quotes the old names),
    // except requests still open. Keyed by id throughout, so nothing else changes.
    S.flags = S.flags || {};
    if (!S.flags.v10names) {
      const seen = new Set();
      const walk = (o, depth) => {
        if (!o || typeof o !== 'object' || depth > 8 || seen.has(o)) return; seen.add(o);
        if (typeof o.id === 'string' && o.slot && D.ITEMS[o.id]) { const d = D.ITEMS[o.id]; o.name = d.name; if (d.desc) o.desc = d.desc; if (d.source) o.source = d.source; }
        // simulated players whose joke name borrowed another world's heroes get a new one
        if (typeof o.name === 'string' && o.cls && /^(arthas|sylvanas|leeroy|legolas|candlethief)/i.test(o.name) && root.B && B.makeName) o.name = B.makeName(new Set());
        if (typeof o.realm === 'string' && o.realm !== D.REALM && !OTHER_REALMS.includes(o.realm)) { let h = 0; for (const c of o.realm) h = (h * 31 + c.charCodeAt(0)) >>> 0; o.realm = OTHER_REALMS[h % OTHER_REALMS.length]; }
        for (const k in o) walk(o[k], depth + 1);
      };
      walk(S, 0);
      if (Array.isArray(S.chat)) S.chat = S.chat.filter((m) => m.act && m.act.state === 'open');
      S.flags.v10names = true;
    }
    // a replaced item effect (#40: Lifeline became Lavish Mend): the owner keeps the item, which now carries the new
    // effect and the stats the data gives it now; an upgraded item keeps the growth it bought. Any copy, anywhere in the save
    if (D.EFFECT_RENAMED) {
      const seen = new Set();
      const walk = (o, depth) => {
        if (!o || typeof o !== 'object' || depth > 8 || seen.has(o)) return; seen.add(o);
        for (const k in o) { const x = o[k]; if (x && typeof x === 'object' && typeof x.id === 'string' && x.slot && D.EFFECT_RENAMED[x.effect] && D.ITEMS[x.id]) {
          const grown = x.pw && x.base ? x.pw / Math.max(1, G.itemPoints(x.base)) : 1, fresh = G.copyItem(x.id);
          o[k] = grown > 1.0001 ? G.upgradedCopy(fresh, G.itemPoints(fresh) * grown) : fresh; } else walk(x, depth + 1); }
      };
      walk(S, 0);
    }
    // gear power (#581), once per save and once for the account bank: every upgraded item is rebuilt from the item as it
    // dropped at the power it bought (damage and armour now stop under the raid's piece), and every Hard raid copy gets
    // the 2 steps past the ceiling it was clamped out of
    { const regear = (root, flagOf) => {
        if (!root || flagOf.gear581) return false;
        const seen = new Set();
        const walk = (o, depth) => {
          if (!o || typeof o !== 'object' || depth > 8 || seen.has(o)) return; seen.add(o);
          for (const k in o) { const x = o[k];
            if (x && typeof x === 'object' && typeof x.id === 'string' && D.GEAR_SLOTS.includes(x.slot) && (x.hard || (x.base && x.pw))) o[k] = G.regearItem(x);
            else walk(x, depth + 1); }
        };
        walk(root, 0); flagOf.gear581 = 1; return true;
      };
      S.flags = S.flags || {}; regear(S.player, S.flags); } // the account bank's copies are rebuilt as they come out (G.abankWithdraw)
    // a talent no longer in its class's trees (the Bard's first trees, #253) gives its points back; so does a second
    // keystone where a tree allows one (pickOne)
    if (S.player.talents && D.TALENTS[S.player.cls]) {
      const T = S.player.talents;
      for (const k of Object.keys(T)) if (!G.talentInfo(S.player.cls, k)) delete T[k];
      for (const tree of D.TALENTS[S.player.cls]) if (tree.pickOne) tree.talents.filter((x) => x.tier === tree.pickOne && T[x.id]).slice(1).forEach((x) => delete T[x.id]);
    }
    // v9.8: the isle is closed until Veshmira dies; anyone who already reached it keeps access
    if (!S.flags.stormBroken) {
      const onIsle = Object.keys(S.player.visited || {}).concat(Object.keys(S.player.done), Object.keys(S.player.quests)).some((k) => (D.PLACES[k] && STORM_REGIONS.has(D.PLACES[k].region)) || /^(x_to_|tw_|sr_|ar_|tp_|tc_)/.test(k));
      if (onIsle) S.flags.stormBroken = true;
    }
    // v5: v3.0–v4.2 reused three ids from earlier zones (Stoneharrow's quests 'poachers' and 'gnoll_paws', and its murloc
    // fins). They have their own ids now. A Stoneharrow-level Accord character's copies move to the new ids. Not
    // 'gnoll_paws' any more (#260): it is Longfield's own Accord quest, so copying it marked Paws for Proof done for every
    // Accord character who had done Longfield's, and stranded it in the log of anyone holding it; every save from before
    // v5 has long since been moved.
    { const Pp = S.player, alliance = (D.RACES[Pp.race] || {}).faction !== 'horde';
      if (alliance && Pp.level >= 18) {
        for (const [o, nw] of [['poachers', 'rr_poachers']]) {
          if (Pp.quests && Pp.quests[o] && !Pp.quests[nw]) { Pp.quests[nw] = Pp.quests[o]; delete Pp.quests[o]; }
          if (Pp.done && Pp.done[o] && Pp.level >= 20) Pp.done[nw] = true;
        }
        if (Pp.quests && Pp.quests.murloc_fins) for (const b of (Pp.bags || [])) if (b.item.id === 'murloc_fin' && b.item.name === 'Flesheater Fin') b.item = G.copyItem('rr_murloc_fin');
      }
      if (Pp.done && Pp.done.poachers && alliance) delete Pp.done.poachers; // the Accord never had Greensward's quest
    }
    // a quest in the log and marked done at once is in the log (#260): it can be turned in or abandoned again
    for (const q in S.player.quests || {}) if (S.player.done && S.player.done[q]) delete S.player.done[q];
    // and Paws for Proof marked done by that migration for someone who has never been to Longbridge, where it is given
    // and handed in, was never done: it can be picked up again
    if (S.player.done && S.player.done.rr_gnoll_paws && S.player.visited && !S.player.visited.lakeshire) delete S.player.done.rr_gnoll_paws;
    // v3: stacks saved before a material changed slot (linen was junk) take the item's current slot and icon
    for (const b of (S.player.bags || []).concat(S.player.bank || [])) { const base = D.ITEMS[b.item.id]; if (base && base.slot === 'mat' && b.item.slot !== 'mat') { b.item.slot = 'mat'; b.item.icon = base.icon; } }
    G.rehearsalLetter(); // a Bard already past level 4 gets the Rehearsal's letter once (#256)
    G.honorLooks(true); // rank looks a character already earned (Honor ranks, #57), without a message
    deliverByes(S); // after the save's own fixes (an older one keeps only open requests)
    return G.catchUp();
  };
  // Save codes (v9.7.1): "AZS2.<length>.<base64 of the deflated save>", about a fifth of the old size, so a code fits in a
  // chat message (WhatsApp cuts messages at about 65,000 characters; the old plain codes were over 100,000). The length
  // lets import tell a cut-off code from a broken one. Old plain base64 codes still load. Chat history is left out.
  const SAVE_TAG = 'AZS2';
  const toB64 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
  const fromB64 = (b) => { const s = atob(b); const u8 = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i); return u8; };
  const pipe = async (u8, Stream) => { const cs = new Stream('deflate-raw'); const w = cs.writable.getWriter(); w.write(u8); w.close(); return new Uint8Array(await new Response(cs.readable).arrayBuffer()); };
  // encodeSave/decodeSave turn any character into a code and back; cloud save (cloud.js) uses them for its files
  // lite (a save code to send, #376): without the realm-only history (ROSTER_ONLY), so it stays short enough for a chat
  // app; cloud files keep it all, since a restore may rebuild the realm from them (#344)
  G.encodeSave = async function (S, lite) {
    const json = lite ? JSON.stringify(Object.assign({}, S, { chat: [], pending: [] }), function (k, v) { return k === 'hist' || k === 'pals' || k === 'rival' || ((k === 'gone' || k === 'byes') && Array.isArray(v) && this === S.server) ? undefined : v; })
      : JSON.stringify(Object.assign({}, S, { chat: [], pending: [] }));
    if (typeof CompressionStream === 'undefined') return btoa(unescape(encodeURIComponent(json)));
    const b = toB64(await pipe(new TextEncoder().encode(json), CompressionStream));
    return `${SAVE_TAG}.${b.length}.${b}`;
  };
  G.exportSave = async function () { G.save(); return G.encodeSave(G.S, true); };
  G.decodeSave = async function (str) {
    let code = String(str || '').replace(/\s+/g, ''); // messaging apps add line breaks and spaces
    if (!code) throw new Error('Paste a save code.'); // #414
    let json;
    const at = code.indexOf(SAVE_TAG + '.');
    if (at >= 0) {
      const [, len, ...rest] = code.slice(at).split('.');
      const b = rest.join('.'), n = +len;
      if (b.length < n) throw new Error(`This code is incomplete: only ${b.length.toLocaleString()} of its ${n.toLocaleString()} characters arrived. The app you sent it with probably cut it short. Try sending it as a note or a file.`);
      if (typeof DecompressionStream === 'undefined') throw new Error('This browser is too old to read save codes.');
      try { json = new TextDecoder().decode(await pipe(fromB64(b.slice(0, n)), DecompressionStream)); } catch (e) { throw new Error('That code is damaged. Copy it again and paste the whole thing.'); }
    } else {
      try { json = decodeURIComponent(escape(atob(code))); } catch (e) { throw new Error('That is not a save code. Copy it again and paste the whole thing.'); }
    }
    let S; try { S = JSON.parse(json); } catch (e) { throw new Error('That code is incomplete or damaged. Copy it again and paste the whole thing.'); }
    if (!S.player || !S.bots) throw new Error('That is not a Realm of Loner save.');
    return S;
  };
  G.importSave = async function (str) {
    const S = await G.decodeSave(str);
    if (G.characters().length >= G.MAX_CHARS) throw new Error(`You already have ${G.MAX_CHARS} characters. Delete one first.`);
    if (G.S) G.save(); // keep the character you are playing
    // an imported save becomes its own character; the caller opens it with G.load so it goes through the same fixes as any old save
    S.id = 'c' + now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
    if (!Array.isArray(S.chat)) S.chat = [];
    G.writeSave(S); return S.id; // stored with its own lastSeen, so loading it counts the time since the code was made (#480)
  };
  G.wipeSave = function () { if (G.S) G.deleteCharacter(G.S.id); G.S = null; };

  // a clock moved back between sessions (#410): the queue, trip, cooldowns, buffs, respawns and run timers keep the time
  // they had left when the app closed, so none of them waits a day. Only times inside this character's own short-lived
  // state move; the realm's history and the weekly and daily keys never do (#336, #402)
  function shiftClock(S, d) {
    const P = S.player;
    const move = (o, depth) => {
      if (!o || typeof o !== 'object' || depth > 6) return;
      for (const k in o) {
        const v = o[k];
        if (typeof v === 'number' && v > 1e12 && v < S.lastSeen + 30 * 86400000) o[k] = v + d;
        else if (v && typeof v === 'object') move(v, depth + 1);
      }
    };
    for (const o of [S.queue, S.run, S.group, S.wparty, S.world, S.bg, S.brawl, P.travel, P.cds, P.auras, P.costume]) move(o, 0);
    // chat, guild, auctions, invites, Help Wanted, casts, meals and fishing (#436-#439)
    for (const o of [S.soc, S.flags, S.ah, S.helpWanted, P.casting, P.eating, P.drinking, P.fishing]) move(o, 0);
    for (const m of S.chat || []) if (m.act) move(m.act, 0);
    move(S.lfAt, 0); move(S.chatHeard, 0); // maps of bot or line to a time (#484)
    for (const [o, k] of [[P, 'potionAt'], [P, 'ghostUntil'], [P, 'hearthAt']]) { const v = o[k]; if (typeof v === 'number' && v > 1e12 && v < S.lastSeen + 30 * 86400000) o[k] = v + d; }
  }

  // Time away: rested XP, the server moving on, a news digest.
  G.catchUp = function () {
    const S = G.S;
    const t = now();
    const away = Math.max(0, t - S.lastSeen);
    const report = { away, rested: 0, news: [], dings: 0, online: 0 };
    B.cleanNews(S); // news a newer server stored that this level can't be told yet (issue #18), on every load
    // a battleground (issue #30): a finished one closes on a reload or after time away; one still going ends after
    // 10 minutes away, with no Deserter and no Honor for the unfinished round (the same rule as a dungeon run)
    if (S.bg && !(G.fight && G.fight.kind === 'bg') && (S.bg.phase === 'done' || away > 600000)) {
      const A = D.ACTIVITIES[S.bg.act] || {}; S.bg = null; emit('instanceLeave', {});
      sys(`You left ${(A.name || 'the battleground').replace(/^The /, 'the ')}.`);
    }
    if (away > 120000) {
      const P = S.player;
      const need = D.XP_TO_LEVEL[P.level] || 1;
      const hrs = away / 3600000;
      const inInn = D.PLACES[P.place] && D.PLACES[P.place].inn;
      const before = P.rested;
      if (P.level < D.LEVEL_CAP) P.rested = Math.min(need * 1.5, P.rested + need * (inInn ? 0.05 : 0.0125) * hrs);
      report.rested = Math.round(P.rested - before);
      const startLv = {};
      for (const b of S.bots) startLv[b.id] = b.level;
      report.news = B.advance(S, Math.max(0, t - S.lastSim)); // #71: the realm's own clock: another character may have moved it on
      B.catchUpChat(S, t); // #70
      // the realm as it is now (#334): everyone here who gained a level, newcomers included; newcomers who stayed
      report.dings = S.bots.filter((b) => b.level > (startLv[b.id] != null ? startLv[b.id] : 1)).length;
      report.joined = S.bots.filter((b) => startLv[b.id] == null).length;
      // regen fully
      P.hp = null; P.res = null; P.auras = (P.auras || []).filter((a) => a.until > t);
      S.world = {};
      if (S.queue) { S.queue = null; sys('Your queue ended while you were away.'); } // said, not silent (#412)
      if (S.run && away > 600000) {
        settleRolls();
        P.place = S.run.returnTo || 'goldshire'; S.run = null; S.group = null; delete P.syncLevel;
        sys('Your group disbanded while you were away.');
      }
      if (P.guild >= 0) {
        const mates = S.bots.filter((b) => b.guild === P.guild);
        if (mates.length) B.post(S, 'guild', cpick(mates), cpick(['wb!', 'welcome back', 'oh hey you are back', 'yo']));
      }
      S.news = report.news.slice().sort((a, b) => b.t - a.t).concat(S.news).slice(0, 40); // newest first, as Social → News reads: a long absence drops its oldest lines, not the summary at its end (#18)
    } else if (t - S.lastSim > 60000) {
      // this character was here a moment ago but the realm's stored clock is behind (#344: a rebuilt realm, an older
      // copy): those days still happen, never skipped
      const news = B.advance(S, t - S.lastSim);
      S.news = news.slice().sort((a, b) => b.t - a.t).concat(S.news).slice(0, 40);
    }
    S.lastSim = Math.max(S.lastSim, t); // a realm clock ahead of the device's (a clock moved back) waits, never runs twice (#336)
    S.lastSeen = t;
    report.online = B.onlineCount(S, new Date(t));
    return report;
  };

  // ============================================================ items
  G.copyItem = (id) => JSON.parse(JSON.stringify(D.ITEMS[id]));
  G.stackable = (it) => ['junk', 'quest', 'food', 'drink', 'mat', 'potion', 'elixir', 'stone', 'kit', 'event'].includes(it.slot); // festival toys stack too (#405)
  G.canUseItem = function (it, cls) {
    cls = cls || G.S.player.cls;
    const C = D.CLASSES[cls];
    if (it.slot === 'weapon') return C.weapons.includes(it.wtype);
    if (it.slot === 'ranged') return it.wtype === 'instrument' ? !!C.instrument : !!C.ranged && it.wtype !== 'instrument'; // a bard's instrument, a hunter's bow (#251)
    // armour up to the class's own type: cloth < leather < mail (v10.9: the old class list left out the bard's leather)
    if (it.atype) { const R = { cloth: 0, leather: 1, mail: 2 }; return (R[it.atype] || 0) <= (R[C.armorType] || 0); }
    return D.GEAR_SLOTS.includes(it.slot);
  };
  const W = {
    warrior: { str: 2.2, agi: 1, sta: 1.5, int: 0, spi: 0.2, armor: 0.08, sp: 0, dps: 4 },
    rogue: { str: 1, agi: 2.2, sta: 1.2, int: 0, spi: 0.2, armor: 0.06, sp: 0, dps: 4 },
    mage: { str: 0, agi: 0.1, sta: 1, int: 2, spi: 1, armor: 0.02, sp: 1.6, dps: 0.2 },
    priest: { str: 0, agi: 0.1, sta: 1, int: 1.6, spi: 1.8, armor: 0.02, sp: 1.5, dps: 0.2 },
    paladin: { str: 1.8, agi: 0.6, sta: 1.5, int: 1, spi: 0.6, armor: 0.07, sp: 0.8, dps: 3 },
    warlock: { str: 0, agi: 0.1, sta: 1.2, int: 2, spi: 1, armor: 0.02, sp: 1.7, dps: 0.2 },
    hunter: { str: 0.4, agi: 2.2, sta: 1.2, int: 0.6, spi: 0.3, armor: 0.05, sp: 0, dps: 1.5, rdps: 4 },
    druid: { str: 0.6, agi: 0.6, sta: 1.3, int: 1.6, spi: 1.6, armor: 0.06, sp: 1.4, dps: 0.6 },
    shaman: { str: 1.4, agi: 0.8, sta: 1.3, int: 1.2, spi: 0.8, armor: 0.05, sp: 1, dps: 2.5 },
    bard: { str: 0, agi: 0.2, sta: 1.2, int: 1.7, spi: 1.5, armor: 0.03, sp: 1.5, dps: 0.2 },
  };
  // A role that plays differently from its class's weights (#533): a druid tank lives in Bear Form, where Strength is attack
  // power (2 each, engine.js), Stamina counts 1.25x and armor 2.8x, and the form replaces the weapon's damage.
  const ROLE_W = { druid: { tank: { str: 2, agi: 1, sta: 1.9, int: 0.1, spi: 0.1, armor: 0.15, sp: 0, dps: 0 } } };
  G.itemScore = function (it, cls, role) {
    if (!it) return 0;
    const w = (ROLE_W[cls] && ROLE_W[cls][role]) || W[cls];
    let s = 0;
    for (const k in (it.stats || {})) s += (w[k] || 0) * it.stats[k];
    s += (it.armor || 0) * w.armor + (it.sp || 0) * w.sp;
    if (it.dmg) s += ((it.dmg[0] + it.dmg[1]) / 2 / it.speed) * (it.slot === 'ranged' ? (w.rdps || 0) : w.dps) + (it.slot === 'weapon' ? 1 : 0);
    return s;
  };
  // Which named-gear looks a character shows. Saved item copies may predate looks, so fall back to the base item.
  const BOT_WEAPON_LOOKS = { warrior: ['cruel_barb', 'smites_hammer'], paladin: ['smites_hammer', 'cruel_barb'], rogue: ['thiefs_blade', 'buzzer_blade'],
    hunter: ['cruel_barb'], mage: ['emberstone_staff', 'cookies_rod'], warlock: ['emberstone_staff'], priest: ['cookies_rod', 'cookies_tenderizer'], druid: ['emberstone_staff', 'cookies_rod'], shaman: ['smites_hammer', 'cookies_tenderizer'] };
  G.gearLooks = function (c) {
    if (!c) return null;
    const g = {};
    if (c.equip) {
      const sets = {};
      for (const slot in c.equip) {
        const it = c.equip[slot]; if (!it) continue;
        const base = D.ITEMS[it.id];
        const lk = it.look || (base && base.look);
        if (lk) g[lk[0]] = lk[1];
        const st = it.set || (base && base.set);
        if (st) sets[st] = (sets[st] || 0) + 1;
      }
      if ((sets.defias || 0) >= D.SETS.defias.mask) g.mask = 'defias';
      if (c.keepsake) g.back = c.keepsake; // a Legend character's own keepsake (v10.2)
      for (const pl in c.wardrobe || {}) { if (c.wardrobe[pl] === 'hidden') delete g[pl]; else g[pl] = c.wardrobe[pl]; } // the wardrobe (v10.3)
      for (const pl in c.dyes || {}) if (G.dyeable(g[pl]) && c.dyes[pl]) g[pl] = g[pl].replace(/_(hard|q[ab])$/, '') + '_dy' + c.dyes[pl]; // a Renown dye (#504)
      if (root.ART_DYE) for (const pl in g) if (/_(dy\d+|q[ab])$/.test(g[pl])) root.ART_DYE(g[pl]); // dyes and the Quartermaster's colours are drawn on first use (#506)
    } else if (c.level >= 10 && c.id != null) {
      // players you pass in the world: some capped ones have farmed The Smugglers' Deep
      if (B.hash(c.id, 71) < 0.15) g.back = 'cape_brotherhood';
      const wl = BOT_WEAPON_LOOKS[c.cls];
      if (wl && B.hash(c.id, 72) < 0.12) g.weapon = wl[Math.floor(B.hash(c.id, 73) * wl.length)];
      if (c.cls === 'rogue' && B.hash(c.id, 74) < 0.1) { g.chest = 'defias_armor'; g.legs = 'defias_leggings'; g.mask = 'defias'; }
    }
    return Object.keys(g).length ? g : null;
  };

  // ---- item effects (v10.10): what each worn effect did in your last run (a dungeon run, or the fight when out of one), for
  // the item card's fact line. There is no damage meter, so this is how a player judges an effect.
  function recordFx(C, pu) {
    const S = G.S, P = S.player; if (!pu || !C) return;
    const fx = (C.fx || {})[pu.uid] || {}, tot = (C.tot || {})[pu.uid] || { dmg: 0, heal: 0, taken: 0 };
    const acc = S.run ? (S.run.fxAcc = S.run.fxAcc || { fx: {}, tot: { dmg: 0, heal: 0, taken: 0 } }) : { fx: {}, tot: { dmg: 0, heal: 0, taken: 0 } };
    for (const k in tot) acc.tot[k] = (acc.tot[k] || 0) + (tot[k] || 0);
    for (const k in fx) { const a = acc.fx[k] = acc.fx[k] || { amount: 0, kind: fx[k].kind }; a.amount += fx[k].amount; }
    P.fxLast = P.fxLast || {};
    for (const k in E.itemEffects(P)) { const a = acc.fx[k]; P.fxLast[k] = { amount: Math.round((a && a.amount) || 0), kind: (a && a.kind) || null, dmg: Math.round(acc.tot.dmg), heal: Math.round(acc.tot.heal), taken: Math.round(acc.tot.taken), run: !!S.run }; }
  }
  // an item with an effect is judged by the fight, not by its stats: nothing automatic calls it better or worse
  G.effectOf = (it) => (it && it.effect && D.EFFECTS && D.EFFECTS[it.effect]) || null;
  // the Bags dot (issue #11): an upgrade landed since you last opened Bags, and one is still there (selling or wearing it clears it)
  G.bagDot = () => { const P = G.S.player; return !!P.bagUpgrade && P.bags.some((b) => G.isUpgrade(b.item) || b.item.fxNew); };
  G.seenBags = () => { const P = G.S.player; P.bagUpgrade = false; for (const b of P.bags) delete b.item.fxNew; }; // opening Bags: every new item is seen (#11, #23)
  // what the loot card marks "▲ Upgrade" (gearTag): gear you can use at your level, without an effect, better than yours
  G.markedUpgrade = (it) => { const P = G.S.player; return D.GEAR_SLOTS.includes(it.slot) && G.canUseItem(it) && (it.lvl || 1) <= P.level && !G.effectOf(it) && G.isUpgrade(it); };
  G.isUpgrade = function (it) {
    const P = G.S.player;
    if (G.effectOf(it)) return false; // an effect item shows ◆ Effect instead (v10.10)
    if (!D.GEAR_SLOTS.includes(it.slot) || !G.canUseItem(it)) return false;
    const r = G.role(); return G.itemScore(it, P.cls, r) > G.itemScore(P.equip[it.slot], P.cls, r) + 0.01;
  };

  G.genGear = function (slot, lvl, q, opts) {
    opts = opts || {};
    lvl = Math.max(1, lvl);
    const it = { id: 'g' + Math.floor(Math.random() * 1e9), slot, q, lvl: q <= 1 ? Math.max(1, lvl - 2) : lvl };
    const qm = [0.8, 1, 1.1, 1.22, 1.35][q];
    if (slot === 'weapon' || slot === 'ranged') {
      const wtype = slot === 'ranged' ? (opts.wtype === 'instrument' ? 'instrument' : 'bow') : opts.wtype || pick(Object.keys(D.WEAPON_BASES).filter((k) => k !== 'bow' && k !== 'instrument'));
      const Wb = D.WEAPON_BASES[wtype];
      const dps = (1.6 + lvl * 0.45) * qm * (wtype === 'staff' ? 1.35 : 1);
      const sp = Wb.speed + rnd(-0.2, 0.2);
      it.wtype = wtype; it.speed = Math.round(sp * 10) / 10;
      if (wtype !== 'instrument') it.dmg = [Math.max(1, Math.round(dps * it.speed * 0.7)), Math.max(2, Math.round(dps * it.speed * 1.3))]; // an instrument gives stats only (#251)
      it.icon = Wb.icon;
      const pre = q === 0 ? pick(['Rusty', 'Cracked', 'Chipped']) : q === 1 ? pick(['Sturdy', 'Heavy', 'Plain']) : pick(['Keen', 'Polished', 'Guard\'s', 'Soldier\'s', 'Scout\'s']);
      it.name = `${pre} ${pick(Wb.names)}`;
    } else {
      const atype = slot === 'back' || slot === 'finger' ? null : (opts.atype || pick(['cloth', 'leather', 'mail']));
      if (atype) it.atype = atype;
      const Ab = atype ? D.GEAR_BASES[atype] : { mats: [['Simple', 'Fine']], grey: ['Frayed'], arm: 0.3 };
      const baseName = pick(D.SLOT_NAMES[slot]);
      const mat = q === 0 ? pick(Ab.grey) : pick(Ab.mats[Math.min(Ab.mats.length - 1, Math.floor((lvl || 1) / 20))]); // one draw either way, so the random numbers don't move
      it.name = slot === 'finger' ? `${pick(['Copper', 'Silver', 'Simple'])} ${baseName}` : `${mat} ${baseName}`;
      it.armor = slot === 'finger' ? 0 : Math.max(1, Math.round((D.SLOT_ARMOR[slot] || 3) * (atype ? Ab.arm : 0.3) * (lvl + 2) * 0.9 * qm));
      it.icon = slot === 'chest' ? 'chest_' + (atype || 'cloth') : D.SLOT_ICON[slot];
    }
    if (q >= 2) {
      // stat budget per level, matched to the hand-made items (v10.4: random blues had 70% more than named ones, and
      // outranked raid purples): green 0.55, blue 0.55 + 1, purple 0.64 per level
      // #141: from D.gearBudget; a green or blue below 60 rolls it +-10%, so a good find and a poor one exist in a band
      const roll = lvl < 60 && (q === 2 || q === 3) ? 1 + rnd(-0.1, 0.1) : 1;
      const budget = Math.max(1, Math.round(D.gearBudget(lvl, q) * roll));
      const af = opts.affix || pick(D.AFFIXES);
      const keys = Object.keys(af.stats);
      it.stats = {};
      let left = budget;
      keys.forEach((k, i) => { const v = i === keys.length - 1 ? left : Math.max(1, Math.round(budget / keys.length)); it.stats[k] = v; left -= v; });
      if (it.stats[keys[keys.length - 1]] <= 0) it.stats[keys[keys.length - 1]] = 1;
      it.name += ' ' + af.name;
      if (opts.sp) it.sp = Math.max(1, Math.round(budget * opts.sp)); // spell power on top, as hand-made caster gear has (#582: bot casters and healers had none)
    }
    it.sell = Math.max(1, Math.round((lvl * lvl * 0.9 + 4) * [0.5, 1, 3, 7, 12][q]));
    return it;
  };

  // the new slots n of a stackable item needs in a list of stacks of 20, and putting them there
  const STACK = 20;
  function stackSlots(list, it, n) { const room = list.reduce((a, b) => a + (b.item.id === it.id && b.n < STACK ? STACK - b.n : 0), 0); return Math.ceil(Math.max(0, n - room) / STACK); }
  function putStack(list, it, n) {
    for (const b of list) { if (n <= 0) break; if (b.item.id === it.id && b.n < STACK) { const k = Math.min(n, STACK - b.n); b.n += k; n -= k; } }
    let first = true;
    while (n > 0) { const k = Math.min(n, STACK); list.push({ item: first ? it : Object.assign({}, it), n: k }); n -= k; first = false; }
  }
  // how many of a stackable item still fit in the bags, and whether taking n out empties a slot (the last stacks go first)
  G.bagRoom = (it) => { const P = G.S.player; return P.bags.reduce((a, b) => a + (b.item.id === it.id && b.n < STACK ? STACK - b.n : 0), 0) + G.bagFree(it) * STACK; };
  G.freesSlot = (id, n) => { const P = G.S.player; for (let i = P.bags.length - 1; i >= 0 && n > 0; i--) { const b = P.bags[i]; if (b.item.id !== id) continue; if (b.n <= n) return true; n -= b.n; } return false; };
  // stacks over 20 from a save before #440 split into 20s where the room allows; nothing is ever dropped (#485)
  function restack(P) {
    for (const [list, cap] of [[P.bags || [], null], [P.bank || [], G.bankSlots()]]) for (let i = 0; i < list.length; i++) {
      const b = list[i]; if (b.n <= STACK || !G.stackable(b.item)) continue;
      // as far as the room goes (#549): with too little room, the last piece keeps what's over
      const extra = Math.min(Math.ceil(b.n / STACK) - 1, cap == null ? (P.bags === list ? G.bagFree(b.item) : 0) : cap - list.length); if (extra <= 0) continue;
      for (let k = 0; k < extra; k++) { const n = k < extra - 1 ? STACK : b.n - STACK * (extra); list.splice(++i, 0, { item: Object.assign({}, b.item), n }); }
      b.n = STACK;
    }
  }
  G.addItem = function (it, n) {
    const P = G.S.player;
    n = n || 1;
    if (G.isQuestItem(it.id)) { P.qitems = P.qitems || {}; P.qitems[it.id] = (P.qitems[it.id] || 0) + n; return true; } // kept with the quests, no slot (#144)
    if (G.stackable(it)) {
      // stacks hold 20 (#440): fill the open ones, then new slots; nothing goes in unless it all fits
      if (stackSlots(P.bags, it, n) > G.bagFree(it)) { toast('Bags are full.'); return false; }
      const fresh = !P.bags.some((b) => b.item.id === it.id);
      putStack(P.bags, it, n);
      if (!fresh) return true;
    } else if (G.bagsFull(it)) { toast('Bags are full.'); return false; }
    else P.bags.push({ item: it, n });
    if (G.collectLook) G.collectLook(it); // the wardrobe (v10.3)
    if (G.isUpgrade(it)) P.bagUpgrade = true; // the Bags button's dot until Bags is opened (v10.9, issue #11)
    if (G.effectOf(it)) { emit('effectItem', { item: it }); if (G.canUseItem(it)) { it.fxNew = 1; P.bagUpgrade = true; } } // the one-time card; a new effect item you can use lights the dot like an upgrade (#23)
    return true;
  };
  // ---- the Effects codex (#55)
  // where an item comes from, worded for a character of this level: a boss drop ("Drops from Gimble, The Smugglers' Deep")
  // and any Trial that finds it; a source this level may not read says "A place beyond your level" (G.nameable, #54).
  // tools/lorekeeper.js reads every effect item's sources through this at every Reveals level
  G.effectSources = function (id, lvl) {
    const it = D.ITEMS[id], out = [], say = (t) => out.push(G.nameable(t, lvl) ? t : 'A place beyond your level');
    const trial = Object.keys(D.TRIAL_FIND || {}).filter((act) => D.TRIAL_FIND[act] === id && D.ACTIVITIES[act]);
    if (it && it.source && /^Trials?:/.test(it.source)) { if (!trial.length) say(it.source); } // a Trial copy: its Trial find line says where
    else if (it && it.source) say(`Drops from ${it.source}`);
    // world bosses and named creatures out in the world (no dungeon stamped a source on their loot)
    if (it && !it.source) for (const k in D.MOBS) { const M = D.MOBS[k]; if (!((M.loot || []).includes(id) || (M.drops || []).some((d) => d[0] === id))) continue;
      const wb = Object.values(D.ACTIVITIES).find((A) => A.worldBoss && A.boss === k), home = wb ? wb.where : Object.keys(D.PLACES).find((pk) => (D.PLACES[pk].named || {})[k]);
      say(`Drops from ${M.name}${wb ? ', a world boss' : ''}${home && D.PLACES[home] ? ` in ${D.PLACES[home].name}` : ''}`); }
    for (const act of trial) say(`Trial find: ${D.ACTIVITIES[act].name}`);
    return out.length ? [...new Set(out)] : ['Not found anywhere yet'];
  };
  // every effect item any of your characters holds (worn, in bags or in the bank), by item id: the codex is account-wide
  G.ownedEffectItems = function () {
    const out = {}, add = (P, who) => { if (!P) return; for (const x of [].concat(Object.values(P.equip || {}), (P.bags || []).map((b) => b && b.item), (P.bank || []).map((b) => b && b.item))) if (x && x.effect && D.EFFECTS[x.effect]) (out[x.id] = out[x.id] || []).push({ item: x, who }); };
    if (G.S) add(G.S.player, G.S.player.name);
    for (const c of G.characters()) if (!G.S || c.id !== G.S.id) { const sv = G.readSave(c.id); if (sv) add(sv.player, sv.player && sv.player.name); }
    for (const r of abankItems()) if (r.item && r.item.effect && D.EFFECTS[r.item.effect]) (out[r.item.id] = out[r.item.id] || []).push({ item: r.item, who: 'Account bank' }); // the shared bank counts too (#545)
    return out;
  };
  const abankItems = () => { try { return G.abank ? AB.view(G.abank()) : []; } catch (e) { return []; } };
  G.ownsItem = function (id) { const P = G.S.player; return Object.values(P.equip || {}).some((x) => x && x.id === id) || (P.bags || []).some((b) => b.item.id === id) || (P.bank || []).some((b) => b.item && b.item.id === id) || abankItems().some((r) => r.item && r.item.id === id); }; // worn, in bags, in the bank or in the Account bank (#545)
  // the items quests collect (#144) are kept with the quests (P.qitems), never in the bags, so a full bag can't lose one;
  // ones an old save holds in its bags still count
  let QITEMS = null;
  G.isQuestItem = (id) => { if (!QITEMS) { QITEMS = new Set(); for (const q in D.QUESTS) for (const o of D.QUESTS[q].objs) if (o.type === 'collect') QITEMS.add(o.item); } return QITEMS.has(id); };
  G.countItem = function (id) { let n = (G.S.player.qitems || {})[id] || 0; for (const b of G.S.player.bags) if (b.item.id === id) n += b.n; return n; };
  G.removeItem = function (id, n) {
    const P = G.S.player;
    const held = (P.qitems || {})[id] || 0; // a quest's items first, then any an old save holds in its bags (#144)
    if (held) { const take = Math.min(held, n); n -= take; if (held - take > 0) P.qitems[id] = held - take; else delete P.qitems[id]; }
    for (let i = P.bags.length - 1; i >= 0 && n > 0; i--) {
      const b = P.bags[i];
      if (b.item.id !== id) continue;
      const take = Math.min(b.n, n); b.n -= take; n -= take;
      if (b.n <= 0) P.bags.splice(i, 1);
    }
  };
  G.money = function (c) {
    c = Math.max(0, Math.round(c));
    const g = Math.floor(c / 10000), s = Math.floor((c % 10000) / 100), cp = c % 100;
    return { g, s, c: cp };
  };
  G.moneyText = function (c) {
    const m = G.money(c);
    return [m.g ? m.g + 'g' : '', m.s ? m.s + 's' : '', (m.c || (!m.g && !m.s)) ? m.c + 'c' : ''].filter(Boolean).join(' ');
  };

  G.equip = function (idx) {
    const P = G.S.player;
    const b = P.bags[idx];
    if (!b) return;
    const it = b.item;
    if (!D.GEAR_SLOTS.includes(it.slot)) return;
    if (!G.canUseItem(it)) return toast(`You can't use ${it.name}.`);
    if ((it.lvl || 1) > P.level) return toast(`Requires level ${it.lvl}.`);
    if (G.fight) return toast('You are in combat.');
    const old = P.equip[it.slot];
    P.equip[it.slot] = it;
    P.bags.splice(idx, 1);
    if (old) P.bags.push({ item: old, n: 1 });
    clampVitals();
    emit('equipped', { item: it }); // a sound (v10.8)
    emit('change');
  };
  G.unequip = function (slot) {
    const P = G.S.player;
    if (G.fight) return toast('You are in combat.');
    if (!P.equip[slot]) return;
    if (G.bagsFull()) return toast('Bags are full.');
    P.bags.push({ item: P.equip[slot], n: 1 }); delete P.equip[slot];
    clampVitals(); emit('change');
  };
  // a sale that asks first (#168): green or better, or an upgrade; greys, whites and trade goods sell on one tap
  G.sellNeedsConfirm = (it) => !!it && ((it.q || 0) >= 2 || !!it.pw || (D.GEAR_SLOTS.includes(it.slot) && G.isUpgrade(it))); // upgraded (#444)
  G.sellable = (it) => !!it && !it.noSell && it.slot !== 'quest' && !it.lock; // a locked piece is kept (#557)
  // a locked piece (#557): never sold, thrown away or auctioned until unlocked; gear only. The flag rides on the item,
  // so saves, upgrades, reforges and both banks keep it. The item is copied first: bag entries can share one object
  G.canLock = (it) => !!it && D.GEAR_SLOTS.includes(it.slot);
  const withLock = (it, on) => { const c = Object.assign({}, it); if (on) c.lock = true; else delete c.lock; return c; };
  G.setLock = function (where, key, on) {
    const P = G.S.player;
    if (where === 'equip') { if (!G.canLock(P.equip[key])) return false; P.equip[key] = withLock(P.equip[key], on); }
    else { const b = P.bags[key]; if (!b || !G.canLock(b.item)) return false; b.item = withLock(b.item, on); }
    emit('change'); G.save(); return true;
  };
  G.lockWorn = function () {
    const P = G.S.player; let n = 0;
    for (const s of D.GEAR_SLOTS) if (P.equip[s] && !P.equip[s].lock) { P.equip[s] = withLock(P.equip[s], true); n++; }
    if (n) { emit('change'); G.save(); }
    return n;
  };
  // buyback (beta.3): the last 12 sales can be bought back at any vendor for what they sold for
  G.BUYBACK = 12;
  const soldKeep = (b) => { const P = G.S.player; P.buyback = [{ item: b.item, n: b.n, price: (b.item.sell || 1) * b.n }].concat(P.buyback || []).slice(0, G.BUYBACK); };
  G.buyBack = function (i) {
    const P = G.S.player, x = (P.buyback || [])[i]; if (!x) return false;
    if (P.money < x.price) { toast('Not enough money.'); return false; }
    if (G.stackable(x.item) ? G.bagRoom(x.item) < x.n : G.bagsFull(x.item)) { toast('Bags are full.'); return false; }
    if (!G.addItem(x.item, x.n)) return false;
    P.money -= x.price; P.buyback.splice(i, 1);
    sys(`Bought back ${x.item.name}${x.n > 1 ? ' x' + x.n : ''} for ${G.moneyText(x.price)}.`); emit('change'); return true;
  };
  G.sell = function (idx) {
    const P = G.S.player;
    const b = P.bags[idx];
    if (!b) return;
    if (b.item.lock) return toast('Locked. Unlock it to sell.');
    if (!G.sellable(b.item)) return toast(`The vendor won't buy ${b.item.name}.`); // (#167) the Waystone, keepsakes, quest items
    const v = (b.item.sell || 1) * b.n;
    P.money += v; P.bags.splice(idx, 1); soldKeep(b);
    sys(`Sold ${b.item.name}${b.n > 1 ? ' x' + b.n : ''} for ${G.moneyText(v)}.`);
    emit('sold', { money: v, item: b.item, n: b.n }); emit('change');
  };
  // Throw away (v10.1.1): the whole stack, anywhere. The Waystone stays (it is how you get home).
  G.canDiscard = (it) => !!it && it.id !== 'hearthstone' && !it.lock;
  G.discard = function (idx) {
    const P = G.S.player, b = P.bags[idx];
    if (!b || !G.canDiscard(b.item)) return false;
    P.bags.splice(idx, 1);
    sys(`You threw away ${b.item.name}${b.n > 1 ? ' x' + b.n : ''}.`);
    emit('change');
    return true;
  };
  G.sellJunk = function () {
    const P = G.S.player;
    let v = 0, k = 0;
    P.bags = P.bags.filter((b) => { if (b.item.q === 0 && !b.item.noSell && !b.item.lock) { v += (b.item.sell || 1) * b.n; k++; soldKeep(b); return false; } return true; });
    if (v) { P.money += v; sys(`Sold junk for ${G.moneyText(v)}.`); emit('sold', { money: v, many: k, grey: true }); }
    emit('change');
    return v;
  };
  // selling several at once (v10.3): idxs are bag indices; quest items and unsellable ones are skipped
  G.sellMany = function (idxs) {
    const P = G.S.player, pick = [...new Set(idxs)].filter((i) => { const b = P.bags[i]; return b && G.sellable(b.item); }).sort((a, b) => b - a);
    let v = 0; for (const i of pick) { const b = P.bags[i]; v += (b.item.sell || 1) * b.n; P.bags.splice(i, 1); soldKeep(b); }
    if (v) { P.money += v; sys(`Sold ${pick.length} item${pick.length > 1 ? 's' : ''} for ${G.moneyText(v)}.`); emit('sold', { money: v, many: pick.length }); }
    emit('change');
    return { n: pick.length, money: v };
  };
  // Sort (#133): equipment, consumables, trade goods, quest items, then junk (any grey) last; inside each, highest quality,
  // then highest level, then name; stacks of one item merge up to 20. Returns whether the order changed.
  const SORT_KIND = { potion: 1, elixir: 1, food: 1, drink: 1, stone: 1, kit: 1, mat: 2, recipe: 2, quest: 3, event: 3, junk: 4 };
  // upgrades lead the gear (beta.3), so what to put on is first in the grid
  function sortList(list) {
    const kind = (it) => (it.q === 0 ? 4 : SORT_KIND[it.slot] || 0), ups = new Map();
    const up = (it) => { if (!ups.has(it)) ups.set(it, D.GEAR_SLOTS.includes(it.slot) && G.isUpgrade(it) ? 0 : 1); return ups.get(it); };
    const merged = [];
    for (const b of list) {
      const st = G.stackable(b.item) && merged.find((x) => x.item.id === b.item.id && x.n < 20);
      if (!st) { merged.push(b); continue; }
      const take = Math.min(20 - st.n, b.n); st.n += take; if (b.n > take) merged.push({ item: b.item, n: b.n - take });
    }
    return merged.sort((a, b) => kind(a.item) - kind(b.item) || up(a.item) - up(b.item) || (b.item.q || 0) - (a.item.q || 0) || (b.item.lvl || 0) - (a.item.lvl || 0) || a.item.name.localeCompare(b.item.name) || b.n - a.n);
  }
  const listKey = (l) => l.map((b) => b.item.id + ':' + b.n).join();
  G.sortBags = function () {
    const P = G.S.player, was = listKey(P.bags);
    restack(P); P.bags = sortList(P.bags); restack(P); // an old stack over 20 is split while there is room, before the merge so no part stacks are left (#549)
    emit('change');
    return listKey(P.bags) !== was;
  };
  G.sortBank = function () { // the bank sorts and merges like the bags (beta.3)
    const P = G.S.player, was = listKey(P.bank || []);
    restack(P); P.bank = sortList(P.bank || []); restack(P);
    emit('change');
    return listKey(P.bank) !== was;
  };
  G.vendorStock = function (npc) {
    const base = vendorBase(npc);
    const pl = D.PLACES[G.S.player.place];
    if (pl && pl.vendor === npc) return base.concat(['empty_vial', 'coarse_thread', 'small_pouch', 'smithing_coal', 'fine_thread', 'sturdy_vial', 'cooking_spices', 'crystal_vial', 'fine_spice'].map(G.copyItem)); // Expert supplies (v10.9); level-60 reagents (#505)
    return base;
  };
  function vendorBase(npc) {
    if (npc === 'danil') return ['tough_bread', 'spring_water'].map(G.copyItem);
    if (npc === 'farley') return ['tough_bread', 'fresh_bread', 'spring_water', 'ice_milk'].map(G.copyItem);
    if (npc === 'adlin') return ['tough_bread', 'spring_water'].map(G.copyItem);
    if (npc === 'belm' || npc === 'firebrew') return ['tough_bread', 'fresh_bread', 'spring_water', 'thunder_ale'].map(G.copyItem);
    if (npc === 'nyoma' || npc === 'duokna') return ['tough_bread', 'spring_water'].map(G.copyItem);
    if (npc === 'grosk' || npc === 'gryshka') return ['tough_bread', 'horde_bread', 'spring_water', 'ice_milk'].map(G.copyItem);
    if (npc === 'moodan' || npc === 'kien') return ['tough_bread', 'spring_water'].map(G.copyItem);
    if (npc === 'kauth' || npc === 'pala') return ['tough_bread', 'mulgore_bread', 'spring_water', 'ice_milk'].map(G.copyItem);
    if (npc === 'allison' || npc === 'edda_marlow') return ['tough_bread', 'fresh_bread', 'moist_cornbread', 'mutton_chop', 'spring_water', 'ice_milk', 'melon_juice', 'sweet_nectar'].map(G.copyItem);
    if (npc === 'heather' || npc === 'boorand') return ['fresh_bread', 'moist_cornbread', 'mutton_chop', 'ice_milk', 'melon_juice', 'sweet_nectar'].map(G.copyItem);
    if (npc === 'brianna' || npc === 'jayka') return ['moist_cornbread', 'mutton_chop', 'wild_hog_shank', 'melon_juice', 'sweet_nectar', 'morning_glory_dew'].map(G.copyItem);
    if (npc === 'quartermaster_hudson' || npc === 'quartermaster_lauren' || npc === 'innkeeper_everlook' || npc === 'quartermaster_brenn' || npc === 'trader_gikkix') return ['cured_ham_steak', 'sweet_roll_60', 'morning_glory_60', 'spring_water_60'].map(G.copyItem);
    if (npc === 'quixxil' || npc === 'innkeeper_ashmorn' || npc === 'innkeeper_bruk') return ['smoked_desert_dumplings', 'cured_ham_steak', 'sweet_nectar_45', 'morning_glory_60'].map(G.copyItem);
    if (npc === 'innkeeper_fizzgrimble' || npc === 'innkeeper_shyria' || npc === 'innkeeper_greul') return ['hardened_mushroom', 'smoked_desert_dumplings', 'moonberry_cordial', 'sweet_nectar_45'].map(G.copyItem);
    if (npc === 'innkeeper_taruga' || npc === 'innkeeper_adegwa') return ['spiced_jungle_meat', 'hardened_mushroom', 'bubbling_water', 'moonberry_cordial'].map(G.copyItem);
    if (npc === 'corporal_bluth' || npc === 'innkeeper_thulbek') return ['roasted_boar', 'spiced_jungle_meat', 'morning_glory_dew', 'sparkling_water', 'bubbling_water'].map(G.copyItem);
    if (npc === 'helbrek') return ['wild_hog_shank', 'roasted_boar', 'melon_juice', 'morning_glory_dew', 'sparkling_water', 'thunder_ale'].map(G.copyItem);
    if (npc === 'kimlya' || npc === 'kaylisk') return ['wild_hog_shank', 'roasted_boar', 'moonberry_juice', 'morning_glory_dew', 'sparkling_water'].map(G.copyItem);
    if (npc === 'trelayne' || npc === 'marla') return ['mutton_chop', 'wild_hog_shank', 'roasted_boar', 'sweet_nectar', 'morning_glory_dew', 'sparkling_water'].map(G.copyItem);
    if (npc === 'renee' || npc === 'norman') return ['tough_bread', 'tirisfal_pumpkin', 'spring_water', 'ice_milk'].map(G.copyItem);
    if (npc === 'keldamyr' || npc === 'saelienne') return ['tough_bread', 'fresh_bread', 'spring_water', 'moonberry_juice'].map(G.copyItem);
    if (npc === 'corina' || npc === 'grawn' || npc === 'bruuk' || npc === 'ilyenia' || npc === 'mydrannul' || npc === 'kaplak' || npc === 'rahauro' || npc === 'mahnott' || npc === 'etu' || npc === 'gerard' || npc === 'abigail' || npc === 'lewis' || npc === 'nargal' || npc === 'thurman' || npc === 'verner' || npc === 'krond' || npc === 'gavin' || npc === 'dogran' || npc === 'aeolynn' || npc === 'burkrum' || npc === 'murndan' || npc === 'uthok' || npc === 'urda' || npc === 'blizrik' || npc === 'vivianna' || npc === 'krueg' || npc === 'shul_kar' || npc === 'xizzer_fizzbolt' || npc === 'armorer_hale' || npc === 'armorer_krosh') {
      if (!G.S.flags.corina || G.S.flags.corinaLvl !== G.S.player.level) {
        const L = G.S.player.level;
        G.S.flags.corina = Object.keys(D.WEAPON_BASES).map((w) => { const it = G.genGear(w === 'instrument' ? 'ranged' : 'weapon', Math.max(2, L), 1, { wtype: w }); it.cost = it.sell * 5; return it; }); // an instrument for a bard's ranged slot (#251)
        G.S.flags.corinaLvl = L;
      }
      return G.S.flags.corina;
    }
    return [];
  };
  G.buy = function (it, n) {
    const P = G.S.player;
    n = n || 1;
    const cost = (it.cost || it.sell * 4) * n;
    if (P.money < cost) return toast('You don\'t have enough money.');
    const copy = JSON.parse(JSON.stringify(it));
    if (!G.addItem(copy, n)) return;
    P.money -= cost;
    sys(`Bought ${it.name}${n > 1 ? ' x' + n : ''} for ${G.moneyText(cost)}.`);
    emit('bought', { money: cost }); emit('change');
  };

  // ============================================================ character
  G.charOf = function () {
    const P = G.S.player;
    return P; // the player object doubles as the engine's char
  };
  G.stats = function () { return E.statsFor(G.S.player, auraStats(G.S.player)); };
  function auraStats(P) {
    const x = {}; const t = now();
    for (const a of (P.auras || [])) if (a.until > t && a.stats) for (const k in a.stats) x[k] = (x[k] || 0) + a.stats[k];
    return x;
  }
  G.vitals = function () {
    const P = G.S.player;
    if (G.fight && G.pUnit) return { hp: G.pUnit.hp, maxHp: G.pUnit.maxHp, res: G.pUnit.res, maxRes: G.pUnit.maxRes, resType: G.pUnit.resType };
    const st = G.stats();
    const C = D.CLASSES[P.cls];
    const maxRes = C.resource === 'mana' ? st.maxMana : 100;
    if (P.hp == null) P.hp = st.maxHp;
    if (P.res == null) P.res = C.resource === 'rage' ? 0 : maxRes;
    return { hp: P.hp, maxHp: st.maxHp, res: P.res, maxRes, resType: C.resource };
  };
  function clampVitals() {
    const v = G.vitals(); const P = G.S.player;
    P.hp = clamp(P.hp, 0, v.maxHp); P.res = clamp(P.res, 0, v.maxRes);
  }
  G.racial = function () { const R = D.RACIALS[G.S.player.race || 'human']; return R ? R.active : null; };
  const racialPassive = (k) => ((D.RACIALS[G.S.player.race || 'human'] || {}).passives || {})[k] || 0;
  // ============================================================ talents
  const RESPEC_COST = [0, 10000, 50000, 100000]; // first reset free, then 1g, 5g, 10g
  G.talentTree = (cls, id) => (D.TALENTS[cls] || []).find((t) => t.id === id);
  G.talentInfo = function (cls, id) { for (const tree of (D.TALENTS[cls] || [])) { const t = tree.talents.find((x) => x.id === id); if (t) return { t, tree }; } return null; };
  G.talentTotal = (lvl) => Math.max(0, lvl - D.TALENT_START + 1);
  G.treeSpent = function (char, treeId) { const tree = G.talentTree(char.cls, treeId); let n = 0; if (tree) for (const t of tree.talents) n += (char.talents || {})[t.id] || 0; return n; };
  G.talentPoints = function (char) {
    char = char || G.S.player;
    let spent = 0; for (const k in (char.talents || {})) spent += char.talents[k];
    const total = G.talentTotal(char.level);
    return { total, spent, free: Math.max(0, total - spent) };
  };
  G.canLearnTalent = function (char, id) {
    const info = G.talentInfo(char.cls, id); if (!info) return 'Unknown talent';
    const r = (char.talents || {})[id] || 0;
    if (r >= info.t.ranks) return 'Fully learned';
    if (G.talentPoints(char).free <= 0) return char.level < D.TALENT_START ? `Talents start at level ${D.TALENT_START}` : 'No talent points left';
    const need = D.TALENT_TIER_POINTS[info.t.tier];
    if (G.treeSpent(char, info.tree.id) < need) return `Needs ${need} points in ${info.tree.name}`;
    const other = G.talentRival(char, info.t, info.tree); if (other) return `You chose ${other.name}: one per tree`;
    return null;
  };
  G.learnTalent = function (id) {
    const P = G.S.player, why = G.canLearnTalent(P, id);
    if (why) return toast(why);
    P.talents = P.talents || {}; P.talents[id] = (P.talents[id] || 0) + 1;
    const { t } = G.talentInfo(P.cls, id);
    sys(`You learned ${t.name} (rank ${P.talents[id]}/${t.ranks}).`);
    G.save(); emit('change');
  };
  G.respecCost = () => RESPEC_COST[Math.min(RESPEC_COST.length - 1, G.S.flags.respecs || 0)];
  G.resetTalents = function () {
    const P = G.S.player, cost = G.respecCost();
    if (!Object.keys(P.talents || {}).length) return toast('No talents to reset.');
    if (P.money < cost) return toast(`You need ${G.moneyText(cost)}.`);
    P.money -= cost; P.talents = {}; G.S.flags.respecs = (G.S.flags.respecs || 0) + 1;
    sys(cost ? `Talents reset for ${G.moneyText(cost)}.` : 'Talents reset (the first one is free).');
    G.save(); emit('change');
  };
  // Bots spec for their role: fill the main tree tier by tier, spill into the next.
  G.autoTalents = function (cls, role, level, seed) {
    const opts = ((D.TALENT_BOT[role] || {})[cls]) || ((D.TALENT_BOT.dps || {})[cls]) || [];
    if (!opts.length) return {};
    const main = opts[(seed || 0) % opts.length];
    const order = [main].concat(opts.filter((x) => x !== main), (D.TALENTS[cls] || []).map((t) => t.id).filter((x) => !opts.includes(x)));
    const char = { cls, level, talents: {} };
    let free = G.talentTotal(level);
    for (const treeId of order) {
      const tree = G.talentTree(cls, treeId); if (!tree) continue;
      let progress = true;
      while (free > 0 && progress) {
        progress = false;
        for (const t of tree.talents.slice().sort((a, b) => a.tier - b.tier)) {
          if (free <= 0) break;
          if (!G.canLearnTalentFree(char, t, tree)) continue;
          char.talents[t.id] = (char.talents[t.id] || 0) + 1; free--; progress = true;
        }
      }
    }
    return char.talents;
  };
  G.canLearnTalentFree = (char, t, tree) => ((char.talents[t.id] || 0) < t.ranks) && G.treeSpent(char, tree.id) >= D.TALENT_TIER_POINTS[t.tier] && !G.talentRival(char, t, tree);
  // a tree whose keystones are either/or (pickOne: their tier, the Bard's, #253): the other one already learned, or null
  G.talentRival = (char, t, tree) => (tree.pickOne && t.tier === tree.pickOne ? tree.talents.find((x) => x !== t && x.tier === t.tier && ((char.talents || {})[x.id] || 0) > 0) || null : null);
  G.knownAbilities = function () {
    const P = G.S.player;
    const C = D.CLASSES[P.cls];
    // in a form: that form's abilities, the shift itself and the few that work in any form (#233)
    const f = G.fight && G.pUnit && G.pUnit.form;
    if (f) {
      const all = [...new Set(C.abilities.concat(Object.keys(D.ABILITIES).filter((a) => D.ABILITIES[a].cls === P.cls)))]; // Maul, Growl, Swipe live only in the form
      return all.filter((a) => { const A = D.ABILITIES[a]; return A.lvl <= P.level && G.learned(a) && (A.form === f || A.shapeshift || A.anyForm); });
    }
    return C.abilities.filter((a) => D.ABILITIES[a].lvl <= P.level && G.learned(a));
  };
  // an ability a class quest teaches (the pre-patch's, #512–#521): known once that quest is done
  G.learned = (a) => { const A = D.ABILITIES[a]; return !A || !A.learn || !!(G.S && G.S.player.done && G.S.player.done[A.learn]); };

  G.xpForKill = function (mobLvl, elite) {
    const P = G.S.player;
    if (P.level >= D.LEVEL_CAP) return 0;
    const base = mobLvl * 5 + 45;
    const diff = mobLvl - P.level;
    let xp;
    if (diff >= 0) xp = base * (1 + 0.05 * Math.min(diff, 4));
    else { const zd = 5; xp = diff <= -zd ? 0 : base * (1 + diff / zd); }
    return Math.round(xp * (elite ? 2 : 1));
  };
  G.gainXp = function (amount, fromKill) {
    const P = G.S.player;
    if (P.level >= D.LEVEL_CAP || amount <= 0) return 0;
    let bonus = 0;
    if (fromKill && P.rested > 0) { bonus = Math.min(amount, Math.round(P.rested)); P.rested -= bonus; }
    amount = Math.round(amount * G.warBonus() * (1 + G.heirloomXpBonus() / 100) * (1 + ((root.SOC && SOC.perk('xp')) || 0) / 100));
    const total = amount + bonus;
    P.xp += total;
    B.post(G.S, 'combat', null, bonus ? `You gain ${total} experience. (+${bonus} exp Rested bonus)` : `You gain ${total} experience.`);
    while (P.level < D.LEVEL_CAP && P.xp >= D.XP_TO_LEVEL[P.level]) {
      P.xp -= D.XP_TO_LEVEL[P.level];
      P.level++;
      levelUp();
    }
    if (P.level >= D.LEVEL_CAP) { P.xp = 0; P.rested = 0; }
    emit('xp', { amount: total, bonus });
    return total;
  };
  function levelUp() {
    const P = G.S.player;
    P.hp = null; P.res = D.CLASSES[P.cls].resource === 'rage' ? 0 : null;
    if (G.fight && G.pUnit) { G.pUnit.level = P.level; E.recalc(G.pUnit); G.pUnit.hp = G.pUnit.maxHp; if (G.pUnit.resType === 'mana') G.pUnit.res = G.pUnit.maxRes; }
    G.refreshHeirlooms();
    sys(`Congratulations, you have reached level ${P.level}!`);
    const learned = D.CLASSES[P.cls].abilities.filter((a) => D.ABILITIES[a].lvl === P.level && G.learned(a)); // a quest-taught one is announced when its quest is done
    for (const a of learned) sys(`You have learned a new ability: ${D.ABILITIES[a].name}.`);
    if (P.level >= D.TALENT_START) { const m = B.post(G.S, 'system', null, `You have a new talent point. Open Hero → Talents to spend it.`); if (m) m.go = 'talents'; emit('chat'); } // a tap on the line opens Talents (#273)
    if (P.level === G.REHEARSAL_LVL) G.rehearsalLetter(); // the Bard's Rehearsal (#256)
    emit('levelup', { level: P.level, learned });
    // the server notices
    const S = G.S;
    const date = new Date();
    const near = B.onlineIn(S, P.place, date);
    S.pending = S.pending || [];
    const gz = () => cpick(['gz', 'grats', 'gratz', 'gz!', 'nice', 'congrats']);
    if (P.guild >= 0) {
      const mates = S.bots.filter((b) => b.guild === P.guild && B.isOnline(b, date)).slice(0, 3);
      mates.forEach((b, i) => S.pending.push({ at: now() + 1500 + i * 1800 + crand() * 2000, bot: b.id, ch: 'guild', text: gz() }));
    }
    if (near.length && crand() < 0.5) S.pending.push({ at: now() + 2500, bot: cpick(near).id, ch: 'say', text: gz() });
    if (P.level === 5 && P.guild < 0 && !S.flags.guildOffer) S.flags.guildOfferAt = now() + 90000;
  }

  // ============================================================ world
  function placeState(id) {
    const S = G.S;
    let W = S.world[id];
    const P = D.PLACES[id];
    if (!W) {
      W = S.world[id] = { mobs: [], named: {}, nodes: { n: 4, next: 0 } };
      // spread spawn points by weight so every creature type has at least one
      const tot = P.mobs.reduce((x, m) => x + m[1], 0);
      const plan = [];
      for (const [key, wgt] of P.mobs) for (let i = 0; i < Math.max(1, Math.round(P.pool * wgt / tot)); i++) plan.push(key);
      while (plan.length > Math.max(P.pool, P.mobs.length)) { const counts = {}; plan.forEach((k) => counts[k] = (counts[k] || 0) + 1); const big = Object.keys(counts).sort((x, y) => counts[y] - counts[x])[0]; plan.splice(plan.lastIndexOf(big), 1); }
      for (const key of plan) W.mobs.push(spawnMob(P, key));
      for (const k in (P.named || {})) W.named[k] = { state: 'alive', until: 0, id: 'n_' + k, key: k, level: D.MOBS[k].lvl[0] };
    }
    // the place's rares follow the data: one that moved away is gone, a new one appears (v10.9, issue #10: old saves
    // kept Edric Fane at Last Bell)
    W.named = W.named || {};
    for (const k in W.named) if (!(P.named || {})[k] && W.named[k].state !== 'fight') delete W.named[k];
    for (const k in (P.named || {})) if (!W.named[k] && D.MOBS[k]) W.named[k] = { state: 'alive', until: 0, id: 'n_' + k, key: k, level: D.MOBS[k].lvl[0] };
    syncCollectors(W, P);
    return W;
  }
  // ---- the pre-patch's debt collectors (#522): a few per levelling place at its own level, only while D.PREPATCH.live
  G.collectorsHere = (P) => !!(D.PREPATCH && (D.PREPATCH.live || G.S && G.S.player && G.questMobs().has('ledger_collector') && P && P.lvl && P.lvl[0] >= 30) && P && P.pool && P.lvl && !P.safe && !P.gate && (P.mobs || []).length);
  const collectorKey = (P) => P.lvl[0] >= 30 ? 'ledger_collector' : 'debt_collector'; // no Ledger name below 30
  function spawnCollector(P) { return { id: 'c' + (MOBID++) + '_' + Math.floor(Math.random() * 1e6), key: collectorKey(P), level: rint(P.lvl[0], P.lvl[1]), state: 'alive', until: 0, by: null }; }
  function syncCollectors(W, P) {
    if (!G.collectorsHere(P)) { if (W.event) W.event = W.event.filter((m) => m.state === 'fight'); return; }
    W.event = (W.event || []).filter((m) => D.MOBS[m.key]);
    while (W.event.length < D.PREPATCH.collectors) W.event.push(spawnCollector(P));
  }
  // the trade-in (#523): the title once (account-wide), Marks as often as you like
  G.noteTrade = function (id) {
    const P = G.S.player, t = (D.PREPATCH.trade || []).find((x) => x.id === id);
    if (!t || !D.PREPATCH.live) return false;
    if (t.kind === 'title' && G.account().debtBreaker) { toast('Already yours.'); return false; }
    if (t.minLevel && P.level < t.minLevel) { toast(`Marks trade: level ${t.minLevel} only.`); return false; }
    if ((P.debtNotes || 0) < t.cost) { toast(`Need ${t.cost} torn debt notes (you have ${P.debtNotes || 0}).`); return false; }
    P.debtNotes -= t.cost;
    if (t.kind === 'title') { const a = G.account(); a.debtBreaker = 1; G.saveAccount(a); loot('Title: the Debt-Breaker. Wear it: Hero → Journey → Titles.'); }
    if (t.kind === 'marks') G.addMarks(t.marks, 'torn debt notes');
    emit('change'); G.save(); return true;
  };
  // the count with its goal (#552): n/40 toward the Debt-Breaker title until it's yours (account-wide), then just n
  G.debtNotesText = function () {
    const n = G.S.player.debtNotes || 0, t = (D.PREPATCH.trade || []).find((x) => x.kind === 'title');
    return t && !G.account().debtBreaker ? `${n}/${t.cost}` : String(n);
  };
  // once the title is yours, the note line says what notes buy now (#552): the Marks trade, or the level it opens at
  G.debtNotesNext = function () {
    const m = (D.PREPATCH.trade || []).find((x) => x.kind === 'marks');
    if (!m || !G.account().debtBreaker) return '';
    return G.S.player.level >= (m.minLevel || 0) ? ` · ${m.cost} buy ${m.marks} Mentor Marks at the clerk` : ` · the Marks trade opens at level ${m.minLevel}`;
  };
  // a torn debt note for a collector that isn't grey to you
  G.collectorKill = function (key, level) {
    const P = G.S.player; if (!D.PREPATCH || !D.PREPATCH.live || !(D.MOBS[key] || {}).collector || P.level - level >= (P.level < 6 ? 5 : 6)) return 0; /* grey exactly as the level colour shows it (ui.js conColor) */ // no notes once the event is over
    P.debtNotes = (P.debtNotes || 0) + 1; sys('Torn debt notes: ' + G.debtNotesText() + G.debtNotesNext()); return 1;
  };
  // ---- rare hunts (v10.10.0-beta.5, #43; design docs/plans/2026-10-03-rare-hunts-design.md): a level-60 rare appears once
  // in each 6-hour window (UTC) for 30 minutes or until killed. Its time is a pure function of its own key and the window
  // (no stored state, so every device agrees, nothing drifts, and adding a rare moves no other); "last seen" is computed
  // the same way. Only the window you killed it in is stored, per character.
  G.HUNT_WINDOW = 6 * 3600e3; G.HUNT_UP = 30 * 60e3; G.HUNT_LVL = 58;
  let huntList = null;
  G.huntRares = () => huntList || (huntList = Object.keys(D.PLACES).flatMap((pk) => Object.keys(D.PLACES[pk].named || {}).filter((k) => D.MOBS[k] && D.MOBS[k].lvl[1] >= G.HUNT_LVL).map((k) => ({ key: k, place: pk }))));
  G.isHunt = (key) => G.huntRares().some((r) => r.key === key);
  const fnv = (str) => { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; };
  // when a rare appears in window w (ms since 1970, UTC): somewhere in the window, to the minute, leaving room for its 30 min
  G.huntStart = (key, w) => w * G.HUNT_WINDOW + (fnv(key + ':' + w) % ((G.HUNT_WINDOW - G.HUNT_UP) / 60000)) * 60000;
  G.huntNow = (key, t) => { const w = Math.floor(t / G.HUNT_WINDOW), start = G.huntStart(key, w); return { w, start, end: start + G.HUNT_UP }; };
  G.huntUp = (key, t) => { const h = G.huntNow(key, t), P = G.S && G.S.player; return t >= h.start && t < h.end && !(P && P.huntKilled && P.huntKilled[key] === h.w); };
  G.huntLastSeen = (key, t) => { const w = Math.floor(t / G.HUNT_WINDOW); const s = G.huntStart(key, w); return s <= t ? s : G.huntStart(key, w - 1); }; // the latest appearance at or before t (never the next one)
  // Trophies (#44): one for each hunt rare and each world boss, read from the data (a new one joins with no list), taken on
  // the first kill by any of your characters. Account-wide: G.account().trophies = { mob: { by, at } }. A look and a
  // collection only, no power; the title comes at a fixed number (G.TROPHY_TITLE), never "all", so new ones never move it
  G.TROPHY_TITLE = 10;
  // a name this level may read (#54, the rule the news follows, #18): none of the bible's Reveals terms above the level
  // (D.REVEALS, checked against docs/lore/canon.md by tools/lorekeeper.js). For every screen that names a place or a creature
  let revealRe = null; // compiled once: screens and the group finder ask often
  G.nameable = (text, lvl) => { if (!text) return true; revealRe = revealRe || (D.REVEALS || []).map(([re, at]) => [new RegExp(re, 'i'), at]); return revealRe.every(([re, at]) => lvl >= at || !re.test(text)); };
  // what a trophy's plaque says at this level: one you have taken keeps its names (your account already knows them);
  // one you haven't hides a name its level may not read (tools/lorekeeper.js reads every plaque at every level)
  // a title as a list shows it at this level (#58): an unearned one whose name or requirement holds a term this level
  // may not read is "A title from beyond your level", with no requirement; earned ones show as they are
  G.titleLabel = function (t, lvl, earned, name) {
    const nm = G.titleName(t, name || ''), ok = earned || (G.nameable(nm, lvl) && G.nameable(t.how, lvl));
    return ok ? { name: G.titleName(t, name || ''), how: t.how } : { name: 'A title from beyond your level', how: null, hidden: true };
  };
  // a look the wardrobe lists, not yet collected, at this level (#58): its name and where it comes from, unless either
  // names a secret this level may not read
  G.lookLabel = function (name, source, lvl, have) {
    return have || (G.nameable(name, lvl) && G.nameable(source || '', lvl)) ? { name, source } : { name: 'A look from beyond your level', source: null, hidden: true };
  };
  G.trophyLabel = function (x, lvl, taken) {
    const M = D.MOBS[x.key], P = D.PLACES[x.place], ok = (t) => taken || G.nameable(t, lvl), where = ok(P.zone) && ok(P.name);
    // a hidden place takes its zone with it: the plaque goes in a "Beyond your level" row, not under its zone (game designer)
    return { name: ok(M.name) ? M.name : 'Unknown', place: where ? P.name : 'A place beyond your level', zone: where ? P.zone : 'Beyond your level' };
  };
  G.trophyList = () => G.huntRares().map((r) => ({ key: r.key, place: r.place, boss: false })).concat(G.worldBossActs().map((k) => ({ key: D.ACTIVITIES[k].boss, place: D.ACTIVITIES[k].where, boss: true })));
  G.trophies = () => G.account().trophies || {};
  G.trophyCount = () => { const t = G.trophies(); return G.trophyList().filter((x) => t[x.key]).length; };
  G.takeTrophy = function (key) {
    const list = G.trophyList(); if (!key || !list.some((x) => x.key === key)) return false;
    const a = G.account(), t = a.trophies = a.trophies || {}; if (t[key]) return false;
    t[key] = { by: G.S.player.name, at: now() }; G.saveAccount(a);
    const n = G.trophyCount(), T = D.TITLES.find((x) => x.id === 'biggame');
    loot(`Trophy: ${D.MOBS[key].name}, ${n} of ${list.length} (Hero → Journey → Trophies).`);
    if (n === G.TROPHY_TITLE && T) loot(`${n} trophies: new title "${G.titleName(T, G.S.player.name)}".`);
    return true;
  };
  // chat "rare spotted" posts (v9.6): the named creature really is up
  G.spawnRare = function (place, key) { const W = placeState(place); const m = W.named[key]; if (m && m.state !== 'fight') { m.state = 'alive'; m.until = 0; m.level = D.MOBS[key].lvl[0]; } return !!m; };
  let MOBID = 1;
  // A spawn point always brings back the same creature, like Classic.
  function spawnMob(P, keep) {
    const tot = P.mobs.reduce((a, m) => a + m[1], 0);
    let r = Math.random() * tot, key = keep || P.mobs[0][0];
    if (!keep) for (const m of P.mobs) { r -= m[1]; if (r <= 0) { key = m[0]; break; } }
    const M = D.MOBS[key];
    if (M.placeLvl) return spawnCollector(P);
    return { id: 'm' + (MOBID++) + '_' + Math.floor(Math.random() * 1e6), key, level: rint(M.lvl[0], M.lvl[1]), state: 'alive', until: 0, by: null };
  }
  G.placeMobs = function () {
    const P = D.PLACES[G.S.player.place];
    if (!P || !P.pool && !P.named) return [];
    const W = placeState(G.S.player.place);
    const list = W.mobs.concat(W.event || []);
    // a rare goes first only if it is at most 2 levels above you; a stronger one waits after the normal creatures, its
    // level still red on the card (v10.9, issue #10: a level-4 rare was the first thing a level-1 player tapped)
    const L = G.S.player.level;
    for (const k in W.named) { const n = W.named[k]; if (G.isHunt(k) && n.state !== 'fight') { if (!G.huntUp(k, now())) continue; n.state = 'alive'; } if ((n.level || 1) <= L + 2) list.unshift(n); else list.push(n); } // a hunt rare only while it's up (#43)
    return list;
  };

  function worldTick() {
    const S = G.S, t = now();
    const id = S.player.place;
    const P = D.PLACES[id];
    if (!P) return;
    const W = placeState(id);
    const inParty = new Set(S.wparty ? S.wparty.members.map((m) => m.bot && m.bot.id) : []);
    const near = B.onlineIn(S, id, new Date(t)).filter((b) => !inParty.has(b.id)); // your own party never takes a mob from you (#313)
    const n = Math.min(5, near.length);
    const all = W.mobs.concat(W.event || [], Object.values(W.named));
    for (const m of all) {
      if (m.state === 'fight') continue;
      if (m.id.startsWith('n_') && G.isHunt(m.key)) { m.state = G.huntUp(m.key, t) ? 'alive' : 'away'; continue; } // the hunt's schedule, not a respawn timer; no bot takes it (#43)
      if (m.state === 'tapped' && t >= m.until) { m.state = 'dead'; m.until = t + (m.id.startsWith('n_') ? D.PLACES[id].named[m.key] * 1000 : rnd(15, 28) * 1000); }
      else if (m.state === 'dead' && t >= m.until) {
        if (m.id.startsWith('n_')) { m.state = 'alive'; m.level = D.MOBS[m.key].lvl[0]; }
        else Object.assign(m, spawnMob(P, m.key));
      } else if (m.state === 'alive' && n > 0) {
        const pTap = m.id.startsWith('n_') ? n / 400 : n / (110 * Math.max(4, P.pool));
        if (Math.random() < pTap) {
          const b = pick(near);
          m.state = 'tapped'; m.by = b.name; m.byCls = b.cls; m.until = t + rnd(6, 14) * 1000;
          if (m.id.startsWith('n_') && crand() < 0.6) B.post(S, 'say', b, cpick([`got ${D.MOBS[m.key].name}!`, `${D.MOBS[m.key].name} is mine sry`, 'finally']));
        }
      }
    }
    // if a quest needs a creature and none are up, hurry the next one along
    for (const key of questKeys()) {
      const mine = W.mobs.concat(W.event || []).filter((m) => m.key === key);
      if (!mine.length || mine.some((m) => m.state === 'alive')) continue;
      const next = mine.filter((m) => m.state === 'dead').sort((a, b) => a.until - b.until)[0];
      if (next && next.until - t > 6000) next.until = t + 6000;
    }
    // gather nodes
    if (P.gather && W.nodes.n < 4 && t >= W.nodes.next) { W.nodes.n++; W.nodes.next = t + 20000; }
    nodesTick(id, W, t);
    // guild offer
    if (S.flags.guildOfferAt && S.player.guild >= 0) delete S.flags.guildOfferAt; // joined another way first: no offer from a different guild (#498)
    // it waits for a calm moment, like a party invite (issue #12: it opened mid-fight and a run went on without you)
    if (S.flags.guildOfferAt && t >= S.flags.guildOfferAt && !S.flags.guildOffer && !G.fight && !S.run && !S.queue && !G.bgBusy() && !S.player.travel && !S.player.ghostUntil) {
      // a guild that takes your level and that you haven't turned down, asked by its officer online; none online asks later (#481)
      const no = S.flags.declinedGuilds || [], opts = root.SOC ? SOC.myGuilds().filter((x) => S.player.level >= x.min && !no.includes(x.g) && x.officer) : [];
      if (!opts.length) { S.flags.guildOfferAt = t + 300000; return; }
      S.flags.guildOffer = true;
      const info = opts[rint(0, opts.length - 1)], g = info.g, inviter = info.officer;
      S.flags.guildOfferOpen = g; // unanswered until Accept or Decline: a reload asks again (#411)
      // the pitch is part of the invitation (issue #8: a whisper posted with it read as a pitch after you declined)
      emit('invite', { guild: g, guildName: B.GUILDS[g], from: inviter.name, line: cpick(['hey, want to join our guild? chill ppl, we run dungeons', 'we are recruiting, want an invite?']) });
    }
  }
  const questKeys = () => G.questMobs();
  // a guild you said no to does not ask again (social.js skips it for recruiting whispers)
  G.reofferGuild = function () { const f = G.S.flags; if (G.S.player.guild < 0) { f.guildOffer = false; f.guildOfferAt = now() + 300000; } };
  G.declineGuild = function (g) { const f = G.S.flags; if (f.guildOfferOpen === g) delete f.guildOfferOpen; f.declinedGuilds = (f.declinedGuilds || []).filter((x) => x !== g).concat([g]); G.save(); };
  G.joinGuild = function (g) {
    const S = G.S;
    S.player.guild = g; if (S.soc) S.soc.applied = null; // joining withdraws an application elsewhere (#416)
    sys(`You have joined ${B.GUILDS[g]}.`);
    const mates = S.bots.filter((b) => b.guild === g && B.isOnline(b, new Date()));
    mates.slice(0, 3).forEach((b, i) => S.pending.push({ at: now() + 1200 + i * 2200, bot: b.id, ch: 'guild', text: cpick(['welcome!', 'welcome :)', 'hi!', 'o/', 'welcome to the guild']) }));
  };

  // ============================================================ travel / hearth / gather / rest
  // v4.1 contested zones: a town belongs to a faction (its own `faction`, or its region's when the region is not contested).
  // Enemy towns are closed: the guards would kill you on sight, so you can't travel into them.
  G.myFaction = () => (D.RACES[G.S.player.race] || {}).faction || 'alliance';
  // ---- Veshmira's storm (v9.8): after Chapter 6 the storm she raised hangs over the risen Stormveil Isle. No ship can
  // land and the expansion's first quests stay closed until she dies in Veshmira's Lair (quest dw_onyxia_a / _h).
  // Saves that were already on the isle before v9.8 keep their way in (flags.stormBroken, set in G.load).
  const STORM_REGIONS = new Set(['tidewatch', 'skullreef', 'stormveil']);
  G.stormBroken = () => { const S = G.S; return !!(S && (S.flags.stormBroken || S.player.done.dw_onyxia_a || S.player.done.dw_onyxia_h || (((S.player.codex || {}).onyxias_lair || {}).clears))); }; // a Lair clear counts too (#288)
  // the quests that lift the storm (#288), first to last: { q, npc, place, state: done|current|next|ahead }; 'next' is the
  // first one not done when none is in your log
  G.stormChain = function () {
    const P = G.S.player, out = []; let q = G.myFaction() === 'horde' ? 'dw_onyxia_h' : 'dw_onyxia_a';
    while (q && D.QUESTS[q]) { const Q = D.QUESTS[q]; out.unshift({ q, npc: Q.giver, place: Object.keys(D.PLACES).find((p) => D.PLACES[p].npcs.includes(Q.giver)) }); q = (Q.pre || [])[0]; }
    let open = false;
    for (const s of out) { s.state = P.done[s.q] ? 'done' : P.quests[s.q] ? 'current' : open ? 'ahead' : 'next'; if (s.state !== 'done') open = true; }
    return out;
  };
  G.stormIsle = (id) => { const p = D.PLACES[id]; return !!(p && STORM_REGIONS.has(p.region)); };
  G.stormBlocks = (id) => { const p = D.PLACES[id]; return !!(p && STORM_REGIONS.has(p.region) && !G.stormBroken() && !STORM_REGIONS.has((D.PLACES[G.S.player.place] || {}).region)); };
  G.STORM_TEXT = "Veshmira's storm still rages around the isle. No ship can land while she lives.";
  G.placeFaction = function (id) {
    const p = D.PLACES[id]; if (!p) return null;
    if (p.faction) return p.faction;
    const f = (D.REGIONS[p.region] || {}).faction;
    return (p.safe || p.city) && f && f !== 'contested' ? f : null;
  };
  G.enemyTown = (id) => { const f = G.placeFaction(id); return !!f && f !== G.myFaction(); };
  // the level your side's first dungeon opens at (#317: the "Dungeons are open" tip came at 8, the other side's)
  G.firstDungeonLvl = () => Math.min(...Object.values(D.ACTIVITIES).filter((A) => A.dungeon && !A.worldBoss && !A.needQuest && (A.size || 5) <= 5 && !(A.where && G.enemyTown(A.where))).map((A) => A.minLvl || 1));
  // ---- riding (v5.1)
  G.mounted = () => { const P = G.S.player; return !!(P.riding && P.mount && D.MOUNTS[P.mount]); };
  G.travelSecs = function (from, dest) {
    const p = D.PLACES[from], q = D.PLACES[dest], secs = p.links[dest];
    if (!secs) return 0;
    const via = !!(p.via && p.via[dest]), near = !via && q && p.zone && p.zone === q.zone; // same zone, on foot or mounted (#107)
    return Math.max(1, Math.round(secs * (near ? D.IN_ZONE_HOP : 1) * (G.mounted() && !via ? G.rideSpeed() : 1)));
  };
  // Expert Riding (#506): at 60, for gold; with a swift mount the roads are 70% faster instead of 40%
  G.rideSpeed = () => { const P = G.S.player, M = D.MOUNTS[P.mount]; return P.expertRiding && M && M.swift ? D.EXPERT_RIDING.speed : D.RIDING.speed; };
  G.learnExpertRiding = function () {
    const P = G.S.player, X = D.EXPERT_RIDING;
    if (P.expertRiding) return toast('You already know Expert Riding.');
    if (!P.riding) return toast('Learn Riding first.');
    if (P.level < X.lvl) return toast(`Requires level ${X.lvl}.`);
    if (P.money < X.cost) return toast(`You need ${G.moneyText(X.cost)}.`);
    P.money -= X.cost; P.expertRiding = true;
    loot('You have learned Expert Riding. On a swift mount every road is 70% faster.'); emit('change'); G.save();
  };
  G.learnRiding = function () {
    const P = G.S.player;
    if (P.riding) return toast('You already know how to ride.');
    if (P.level < D.RIDING.lvl) return toast(`Requires level ${D.RIDING.lvl}.`);
    if (P.money < D.RIDING.cost) return toast(`You need ${G.moneyText(D.RIDING.cost)}.`);
    P.money -= D.RIDING.cost; P.riding = true;
    loot('You have learned Riding. Buy a mount from the stablemaster.'); emit('change'); G.save();
  };
  G.buyMount = function (key) {
    const P = G.S.player, M = D.MOUNTS[key];
    if (!M || (M.faction !== G.myFaction() && !M.marks)) return; // a Marks mount suits any faction (#506)
    P.mounts = P.mounts || [];
    if (P.mounts.includes(key)) { P.mount = key; emit('change'); return; }
    if (!P.riding) return toast('Learn Riding first.');
    if (M.marks) { // a Mentor Quartermaster mount (#506): Mentor Marks, every character on the account
      const a = G.account(), c = G.qmPrice(M.marks, 'mount:' + key); if (a.marks < c) return toast(`You need ${c} Mentor Marks.`);
      a.marks -= c; a.mounts = (a.mounts || []).concat([key]); G.saveAccount(a); P.mounts.push(key); P.mount = key;
      loot(`You bought a ${M.name} for every character.`); emit('change'); G.save(); return;
    }
    if (M.swift && !P.expertRiding) return toast('Learn Expert Riding first.');
    if (P.money < M.cost) return toast(`You need ${G.moneyText(M.cost)}.`);
    P.money -= M.cost; P.mounts.push(key); P.mount = key;
    loot(`You bought a ${M.name}. Every road is ${Math.round((1 - G.rideSpeed()) * 100)}% faster now.`); emit('change'); G.save();
  };
  G.refreshAccountMounts = function () { const P = G.S.player, a = G.account(); P.mounts = P.mounts || []; for (const k of a.mounts || []) if (D.MOUNTS[k] && !P.mounts.includes(k)) P.mounts.push(k); };
  G.setMount = function (key) { const P = G.S.player; if (key && !(P.mounts || []).includes(key)) return; P.mount = key || null; emit('change'); G.save(); };
  // Routes (v9.4): the quickest way to any place you can reach, skipping enemy towns. { path: [from, ..., to], secs }
  G.route = function (from, to) {
    if (from === to || !D.PLACES[to] || G.enemyTown(to) || G.stormBlocks(to)) return null;
    const { dist, prev } = routeSearch(from, to);
    if (dist[to] == null) return null;
    const path = [to]; while (path[0] !== from) path.unshift(prev[path[0]]);
    return { path, secs: Math.round(dist[to]) };
  };
  // why there is no route (#138): the enemy town on the road you'd need, and the Group Finder activity that goes there
  G.routeBlock = function (from, to) {
    if (!D.PLACES[to] || G.enemyTown(to) || G.stormBlocks(to)) return null;
    const { dist, prev } = routeSearch(from, to, true); if (dist[to] == null) return null;
    let town = null; for (let p = prev[to]; p && p !== from && !town; p = prev[p]) if (G.enemyTown(p)) town = p; // the one nearest: the road's last gate (earlier ones may have a way round)
    const act = Object.keys(D.ACTIVITIES).find((k) => D.ACTIVITIES[k].where === to && !D.ACTIVITIES[k].event); // the finder can send you there
    return town ? { town, act } : null;
  };
  // seconds from a place to every place you can reach from it (one search, for lists that rank many places)
  G.travelTimes = (from) => routeSearch(from, null).dist;
  // the nearest profession trainer of your faction you can reach (#76): { place, npc, secs }, secs 0 when it is here
  G.nearestTrainer = function (from) {
    from = from || G.S.player.place;
    const npc = 'crafts_' + G.myFaction(), places = (D.PROF_TRAINERS || {})[npc] || [];
    if (places.includes(from)) return { place: from, npc, secs: 0 };
    const dist = G.travelTimes(from); let best = null;
    for (const p of places) if (dist[p] != null && !G.enemyTown(p) && (!best || dist[p] < best.secs)) best = { place: p, npc, secs: Math.round(dist[p]) };
    return best;
  };
  function routeSearch(from, to, throughFoes) {
    const dist = { [from]: 0 }, prev = {}, done = new Set();
    const open = [from];
    while (open.length) {
      open.sort((a, b) => dist[a] - dist[b]);
      const a = open.shift(); if (done.has(a)) continue; done.add(a);
      if (a === to) break;
      for (const b in D.PLACES[a].links) {
        if (done.has(b) || (G.enemyTown(b) && b !== to && !throughFoes) || G.stormBlocks(b)) continue;
        const d = dist[a] + (G.travelSecs(a, b) || D.PLACES[a].links[b]);
        if (dist[b] == null || d < dist[b]) { dist[b] = d; prev[b] = a; open.push(b); }
      }
    }
    return { dist, prev };
  }
  // Travel a whole route: one leg now, the rest as each leg ends (a fight or a manual trip cancels it).
  G.travelRoute = function (dest) {
    const P = G.S.player;
    const r = G.route(P.place, dest);
    if (!r) return toast(`There's no way from here to ${D.PLACES[dest].name}.`);
    G.travelTo(r.path[1]);
    if (P.travel) { P.route = r.path.slice(2); if (P.route.length) sys(`Route to ${D.PLACES[dest].name}: ${r.path.slice(1).map((p) => D.PLACES[p].name).join(' → ')}.`); }
  };
  G.travelTo = function (dest, keepRoute) {
    const S = G.S, P = S.player;
    if (!keepRoute) P.route = null;
    if (G.fight || S.run || S.bg) return toast('You can\'t travel right now.');
    if (P.ghostUntil) return;
    const from = D.PLACES[P.place];
    const secs = G.travelSecs(P.place, dest);
    if (!secs) return;
    if (G.enemyTown(dest)) return toast(`${D.PLACES[dest].name} is an enemy town. The guards would kill you on sight.`);
    if (G.stormBlocks(dest)) return toast(G.STORM_TEXT);
    P.travel = { to: dest, from: P.place, start: now(), end: now() + secs * 1000 };
    stopActions();
    emit('change');
  };
  // Cancel a trip: you never left the place this leg started from (as when a fight on the road stops you), and the
  // rest of a route is dropped
  G.cancelTravel = function () {
    const P = G.S.player;
    if (!P.travel) return;
    P.travel = null; P.route = null;
    sys(`You stay in ${D.PLACES[P.place].name}.`);
    emit('change');
  };
  G.hearth = function () {
    const P = G.S.player;
    if (G.fight || G.S.run) return toast('You can\'t do that now.');
    const left = (P.hearthAt || 0) - now();
    if (left > 0) return toast(`Waystone is on cooldown (${Math.ceil(left / 60000)} min).`);
    stopActions();
    P.casting = { what: 'hearth', label: 'Waystone', start: now(), end: now() + 10000 };
    emit('change');
  };
  G.gather = function () {
    const S = G.S, P = S.player;
    const pl = D.PLACES[P.place];
    if (!pl.gather) return;
    if (G.fight) return toast('Finish the fight first.'); // a tap that can't act says why (#167)
    const W = placeState(P.place);
    if (W.nodes.n <= 0) return toast('Nothing left to pick up. Wait for more to appear.');
    stopActions();
    P.casting = { what: 'gather', label: `Collecting ${pl.gather.label}`, start: now(), end: now() + 3000 };
    emit('castBegin', { what: 'gather' }); emit('change');
  };
  function stopActions() { const P = G.S.player; P.eating = null; P.drinking = null; P.casting = null; P.fishing = null; }
  G.EAT_SECS = 18; G.DRINK_SECS = 12; // a drink is quicker than a meal: casters' downtime while levelling (#4), the same mana back
  // why the action bar can't act out of a fight (#167), known before the tap so the bar can dim: dead, nothing works;
  // on the road, abilities wait, but food, drink and potions still do
  G.barBlock = function (id) {
    const P = G.S.player;
    if (G.fight) return null;
    if (P.ghostUntil) return `You're dead. You revive in ${Math.max(1, Math.ceil((P.ghostUntil - now()) / 1000))} sec.`;
    if (P.travel && !['eat', 'drink', 'potion'].includes(id)) return "You're travelling.";
    return null;
  };
  G.consume = function (kind) {
    const S = G.S, P = S.player;
    if (G.fight) return toast('You can\'t do that while in combat.');
    const b = P.bags.filter((x) => x.item.slot === kind && (x.item.lvl || 1) <= P.level).sort((a, c) => c.item.restore - a.item.restore)[0];
    if (!b) return toast(kind === 'food' ? 'You have no food. Buy some from a vendor.' : 'You have nothing to drink. Buy some from a vendor.');
    const it = b.item;
    G.removeItem(it.id, 1);
    P.casting = null;
    const secs = kind === 'food' ? G.EAT_SECS : G.DRINK_SECS;
    P[kind === 'food' ? 'eating' : 'drinking'] = { until: now() + secs * 1000, per: it.restore / secs, name: it.name };
    if (it.wellFed) { // a cooked meal (v10.9): Well Fed for 30 min, one at a time, beside an elixir
      P.auras = (P.auras || []).filter((a) => a.id !== 'wellfed');
      P.auras.push({ id: 'wellfed', name: 'Well Fed', icon: it.icon, stats: Object.assign({}, it.wellFed), until: now() + 1800000 });
      sys(`You are Well Fed: ${Object.entries(it.wellFed).map(([k, v]) => `+${v} ${{ str: 'Strength', agi: 'Agility', sta: 'Stamina', int: 'Intellect', spi: 'Spirit' }[k] || k}`).join(', ')} for 30 min.`);
    }
    emit('change');
  };
  G.bindHere = function () {
    const P = G.S.player;
    P.bind = P.place;
    sys(`${D.PLACES[P.place].name} is now your home.`);
  };

  function restTick(dt) {
    const S = G.S, P = S.player, t = now();
    const v = G.vitals();
    const st = G.stats();
    // travel
    if (P.travel && t >= P.travel.end) {
      P.place = P.travel.to; P.travel = null;
      arrive();
      // the next leg of a route
      if (P.route && P.route.length) {
        if (G.fight || S.run || P.ghostUntil) { P.route = null; sys('Route interrupted.'); }
        else G.travelTo(P.route.shift(), true);
      }
    }
    if (P.casting && t >= P.casting.end) {
      const c = P.casting; P.casting = null;
      if (c.what === 'hearth') { P.place = P.bind; P.hearthAt = t + 15 * 60000; arrive(); }
      if (c.what === 'summon' && c.pet === 'beast') { P.pet.hp = null; sys(`${P.pet.name} is back on its feet.`); }
      else if (c.what === 'summon') { P.pet = { type: c.pet, name: pick(D.PETS[c.pet].names), hp: null }; sys(`${P.pet.name} the ${D.PETS[c.pet].name} answers your call.`); }
      if (c.what === 'tame') {
        const W = placeState(P.place); const m = W.mobs.find((x) => x.id === c.mobId);
        if (m) { m.state = 'dead'; m.until = t + rnd(15, 28) * 1000; }
        P.pet = { type: 'beast', mob: c.mob, name: D.MOBS[c.mob].name, hp: null };
        sys(`You have tamed a ${D.MOBS[c.mob].name}. It fights at your side now.`);
      }
      if (c.what === 'pgather') finishGather(c);
      if (c.what === 'craft') finishCraft(c);
      if (c.what === 'gather') {
        const W = placeState(P.place); const pl = D.PLACES[P.place];
        if (W.nodes.n > 0) {
          W.nodes.n--; W.nodes.next = Math.max(W.nodes.next, t + 20000);
          if (P.quests[pl.gather.quest]) { G.addItem(G.copyItem(pl.gather.item), 1); loot(`You receive item: ${B.link(D.ITEMS[pl.gather.item].name)}.`); questCheck(); }
          else sys('You don\'t need this right now.');
        }
      }
      emit('change');
    }
    if (P.ghostUntil) {
      if (t >= P.ghostUntil) { P.ghostUntil = 0; P.hp = Math.round(v.maxHp * 0.5); P.res = v.resType === 'mana' ? Math.round(v.maxRes * 0.5) : 0; sys('You return to life.'); emit('change'); }
      return;
    }
    // regen out of combat
    const hpRegen = (P.eating ? P.eating.per : 0) + (st.spi * 0.12 + P.level * 0.25) * (racialPassive('regen') ? 1.1 : 1);
    P.hp = Math.min(v.maxHp, P.hp + hpRegen * dt);
    if (v.resType === 'mana') P.res = Math.min(v.maxRes, P.res + ((P.drinking ? P.drinking.per : 0) + (13 + st.spi / 4) / 2) * dt);
    else if (v.resType === 'rage') P.res = Math.max(0, P.res - 2 * dt);
    else P.res = 100;
    if (P.pet && P.pet.hp) { const pmax = Math.round(E.mobHp(P.level) * D.PETS[P.pet.type].hpMult); P.pet.hp = Math.min(pmax, P.pet.hp + pmax * 0.04 * dt); }
    if (P.eating && (t >= P.eating.until || P.hp >= v.maxHp)) P.eating = null;
    if (P.drinking && (t >= P.drinking.until || P.res >= v.maxRes)) P.drinking = null;
    // rested accrues online in an inn
    if (D.PLACES[P.place] && D.PLACES[P.place].inn && P.level < D.LEVEL_CAP) {
      const need = D.XP_TO_LEVEL[P.level];
      P.rested = Math.min(need * 1.5, P.rested + need * 0.05 * (dt / 3600));
    }
    P.auras = (P.auras || []).filter((a) => a.until > t);
  }

  function arrive() {
    const P = G.S.player;
    const first = !P.visited[P.place];
    P.visited[P.place] = true;
    const pl = D.PLACES[P.place];
    if (first) sys(`Discovered: ${pl.name}`);
    emit('arrive', { place: P.place, first });
    questCheck();
  }

  // ============================================================ quests
  G.questState = function (qid) {
    const P = G.S.player;
    if (P.done[qid]) return 'done';
    if (P.quests[qid]) return G.questComplete(qid) ? 'complete' : 'active';
    const Q = D.QUESTS[qid];
    if ((Q.pre || []).some((p) => !P.done[p])) return 'locked';
    if (Q.storm && !G.stormBroken()) return 'locked';
    if (Q.prepatch && !G.prepatchOpen()) return 'locked'; // the pre-patch campaign and class quests (#508)
    if (Q.cls && Q.cls !== P.cls) return 'locked';
    if (Q.faction && Q.faction !== G.myFaction()) return 'locked'; // the other faction's quest (v7: contested hubs)
    if (P.level < Q.lvl - 2) return 'low';
    return 'available';
  };
  G.questProgress = function (qid) {
    const P = G.S.player, Q = D.QUESTS[qid], q = P.quests[qid];
    return Q.objs.map((o, i) => {
      if (o.type === 'collect') return { o, have: Math.min(o.n, G.countItem(o.item)), n: o.n, label: D.ITEMS[o.item].name };
      if (o.type === 'kill') return { o, have: Math.min(o.n, q ? q.prog[i] || 0 : 0), n: o.n, label: D.MOBS[o.mob].name + ' slain' };
      return { o, have: q && q.prog[i] ? 1 : 0, n: 1, label: 'Go to ' + D.PLACES[o.place].name };
    });
  };
  // the group activities your unfinished quests need (#285): a kill objective's creature or a collect objective's dropper
  // is in its pulls. { act: quest name }, at any level, so an outlevelled Wanted still shows for the quest that needs it
  G.questActs = function () {
    const P = G.S.player, out = {};
    for (const qid in P.quests) {
      const left = G.questProgress(qid).filter((p) => p.have < p.n).map((p) => p.o);
      const mobs = new Set();
      for (const o of left) { if (o.type === 'kill') mobs.add(o.mob); else if (o.type === 'collect') { const s = G.objSource(o.item); for (const m of (s && s.mobs) || []) mobs.add(m); } }
      if (!mobs.size) continue;
      for (const k in D.ACTIVITIES) { const A = D.ACTIVITIES[k]; if (!out[k] && ((A.dungeon ? D.DUNGEONS[A.dungeon].pulls : A.pulls) || []).some((pl) => pl.mobs.some((m) => mobs.has(m)))) out[k] = D.QUESTS[qid].name; }
    }
    return out;
  };
  // where a collect objective's item comes from (#173), worked out from the data so a new quest gets it with no extra
  // work: the places whose gather gives it (a pick-up), else the creatures that drop it
  G.objSource = function (item) {
    const gather = Object.keys(D.PLACES).filter((k) => D.PLACES[k].gather && D.PLACES[k].gather.item === item);
    if (gather.length) return { gather };
    const mobs = Object.keys(D.MOBS).filter((k) => (D.MOBS[k].qdrops || []).concat(D.MOBS[k].drops || []).some((d) => d[0] === item)); // the sources validate.js checks
    return mobs.length ? { mobs } : null;
  };
  // the objective's second line: "Collect them here" (you can act on it now), "Collect them in Halden Vineyards" or
  // "Dropped by Grey Hood Thugs"
  G.objHint = function (o) {
    if (o.type !== 'collect') return null;
    const s = G.objSource(o.item); if (!s) return null;
    if (s.gather) return s.gather.includes(G.S.player.place) ? 'Collect them here' : `Collect them in ${s.gather.map((k) => D.PLACES[k].name).join(' or ')}`;
    const names = s.mobs.slice(0, 2).map((k) => E.plural(k));
    return `Dropped by ${names.join(' and ')}${s.mobs.length > 2 ? ' and others' : ''}`;
  };
  G.questComplete = function (qid) { return G.questProgress(qid).every((p) => p.have >= p.n); };
  // the objectives still to do in your quests: a kill or collect you have finished is no longer one (v10.9)
  G.openObjectives = function () { const P = G.S.player, out = []; for (const qid in P.quests) for (const p of G.questProgress(qid)) if (p.have < p.n) out.push({ qid, o: p.o }); return out; };
  // the monsters those objectives need: what you still have to kill, or kill for a drop
  G.questMobs = function () { const out = new Set(); for (const { o } of G.openObjectives()) { if (o.type === 'kill') out.add(o.mob); if (o.type === 'collect') for (const k in D.MOBS) if ((D.MOBS[k].qdrops || []).some((d) => d[0] === o.item)) out.add(k); } return out; };
  G.npcQuests = function (npc) {
    const out = [];
    for (const qid in D.QUESTS) {
      const Q = D.QUESTS[qid], st = G.questState(qid);
      if (Q.giver === npc && st === 'available') out.push({ qid, st });
      if (Q.turnin === npc && st === 'complete') out.push({ qid, st });
      else if (Q.giver === npc && st === 'active') out.push({ qid, st });
    }
    return out;
  };
  G.npcMarker = function (npc) {
    const qs = G.npcQuests(npc);
    if (qs.some((q) => q.st === 'complete')) return '?';
    if (qs.some((q) => q.st === 'available')) return '!';
    if (qs.some((q) => q.st === 'active')) return '…';
    return '';
  };
  // is the quest behind this person's mark main story (v10.8)? decided in the mark's own order: a hand-in, a new quest,
  // then one in progress
  G.npcMarkMain = function (npc) {
    const qs = G.npcQuests(npc);
    for (const st of ['complete', 'available', 'active']) { const m = qs.filter((q) => q.st === st); if (m.length) return m.some((q) => D.QUESTS[q.qid] && D.QUESTS[q.qid].main); }
    return false;
  };
  G.accept = function (qid) {
    const P = G.S.player;
    if (Object.keys(P.quests).length >= 20) return toast('Your quest log is full.');
    P.quests[qid] = { prog: D.QUESTS[qid].objs.map(() => 0), at: now() };
    sys(`Quest accepted: ${D.QUESTS[qid].name}`);
    emit('questAccept', { qid });
    questCheck();
    emit('change');
  };
  G.abandon = function (qid) {
    const P = G.S.player; delete P.quests[qid];
    // the items it was collecting go with it, unless another quest you hold still collects them (#144)
    for (const o of D.QUESTS[qid].objs) if (o.type === 'collect' && P.qitems && P.qitems[o.item] && !Object.keys(P.quests).some((q) => D.QUESTS[q].objs.some((x) => x.type === 'collect' && x.item === o.item))) delete P.qitems[o.item];
    sys(`${D.QUESTS[qid].name} abandoned.`); emit('change');
  };
  G.questXp = (L) => Math.round(L <= 5 ? 60 * L + 20 : (90 * L - 100) * 1.25); // v1.9.1: +25% from 6 so quests carry levelling, not grinding
  // quest XP falls once you outlevel the quest (#188): full up to 2 levels over it, then 20% less for each level beyond,
  // never under 20%, so the main path keeps its XP and a second zone of the same band levels you less
  G.questXpShare = (qlvl, plvl) => { const over = plvl - qlvl; return over <= 2 ? 1 : Math.max(0.2, 1 - 0.2 * (over - 2)); };
  G.questXpFor = (Q) => Math.round(G.questXp(Q.lvl) * G.questXpShare(Q.lvl, G.S.player.level));
  G.questMoney = (L) => Math.round(L * 30 + (L > 5 ? L * 25 : 0));
  // what fits a class (issue #13): quest rewards and dungeon bonuses read the same table, class only (not role or talents)
  G.CLASS_AFFIX = { warrior: 'of the Bear', rogue: 'of the Monkey', mage: 'of the Owl', priest: 'of the Whale', paladin: 'of the Bear', warlock: 'of the Eagle', hunter: 'of the Monkey', druid: 'of the Owl', shaman: 'of the Tiger', bard: 'of the Whale' };
  G.classAffix = (cls) => D.AFFIXES.find((a) => a.name === G.CLASS_AFFIX[cls]) || null;
  // a fitted piece: a slot the class can use, its armour type, one of its weapon types and its stat affix
  G.fittedGear = function (L, q, cls) {
    const C = D.CLASSES[cls], slots = D.GEAR_SLOTS.filter((sl) => sl !== 'offhand' && (sl !== 'ranged' || C.ranged || C.instrument));
    const slot = pick(slots), aff = G.classAffix(cls);
    const opts = Object.assign(slot === 'weapon' ? { wtype: pick(C.weapons) } : slot === 'ranged' ? (C.instrument ? { wtype: 'instrument' } : {}) : { atype: C.armorType }, aff ? { affix: aff } : {});
    return G.genGear(slot, L, q, opts);
  };
  // a dungeon's boss blues this class can use; none, then a fitted blue
  G.fittedBossBlue = function (Dg, L, cls) {
    const blues = []; for (const pl of Dg.pulls) for (const k of pl.mobs) for (const id of (D.MOBS[k].loot || [])) if (!blues.includes(id) && D.ITEMS[id] && G.canUseItem(D.ITEMS[id], cls)) blues.push(id);
    return blues.length ? G.copyItem(pick(blues)) : G.fittedGear(L, 3, cls);
  };
  // purples before 60 (#141): from level 30, a dungeon's final boss has a 2% chance and a levelling rare 5% of a purple
  // that fits your class (about 15% over a blue), so one is an event: about 1-3 over a whole levelling journey. It's
  // yours, not rolled for, and never lost (bags, or the bank when they're full).
  G.EPIC = { from: 30, boss: 0.02, rare: 0.05 };
  G.epicDrop = function (kind, L) {
    if (!(L >= G.EPIC.from && L < 60) || !(Math.random() < G.EPIC[kind])) return null;
    const it = G.fittedGear(L, 4, G.S.player.cls);
    loot(`Epic! You receive ${B.link(it.name, 4)}.`); G.giveReward(it, 'Epic drop'); emit('epic', { item: it });
    return it;
  };
  // a reward is never lost: with full bags it goes to the bank, and chat says so (as an expired auction does)
  G.giveReward = function (it, label) {
    const P = G.S.player;
    if (!G.slotsShort([[it, 1]]) && G.addItem(it, 1)) return 'bags'; // only when it fits, so no "full" toast before the bank (#443)
    P.bank = P.bank || []; if (G.stackable(it)) putStack(P.bank, it, 1); else P.bank.push({ item: it, n: 1 }); // onto a stack there (#476)
    sys(`${label}: your bags were full, so the ${it.name} went to your bank.`); return 'bank';
  };
  // a quest reward offers two versions (#141): the class's own stat mix and a second mix it plays with, and a weapon in
  // any weapon type the class uses (a Hunter's can be a ranged one); white and fixed rewards stay one item
  G.CLASS_AFFIX2 = { warrior: 'of the Tiger', rogue: 'of Agility', mage: 'of the Eagle', priest: 'of the Owl', paladin: 'of Strength', warlock: 'of the Owl', hunter: 'of the Falcon', druid: 'of the Eagle', shaman: 'of the Falcon', bard: 'of the Monkey' };
  G.rewardItems = function (qid) {
    const Q = D.QUESTS[qid];
    if (!Q.reward.choice) return [];
    const fam = D.REWARD_FAMILIES[Q.reward.choice[0]];
    const P = G.S.player, C = D.CLASSES[P.cls];
    if (fam.fixed) return [G.copyItem(fam.fixed[P.cls])];
    // deterministic per quest so the preview matches what you get
    const key = 'rw_' + qid, two = fam.q >= 2 && G.classAffix(P.cls);
    let had = G.S.flags[key];
    if (had && !Array.isArray(had)) had = [had]; // a save from before #141 keeps the one it showed
    if (had && had.length >= (two ? 2 : 1)) return had;
    const kinds = fam.slot === 'weapon' ? C.weapons.concat(C.ranged || C.instrument ? ['ranged'] : []) : [null];
    const make = (kind, affName) => {
      const slot = kind === 'ranged' ? 'ranged' : fam.slot;
      const opts = slot === 'ranged' ? (C.instrument ? { wtype: 'instrument' } : {}) : fam.slot === 'weapon' ? { wtype: kind } : { atype: C.armorType };
      const aff = affName ? D.AFFIXES.find((a) => a.name === affName) : null;
      return G.genGear(slot, fam.lvl, fam.q, Object.assign(opts, aff ? { affix: aff } : {}));
    };
    const first = had ? had[0] : make(pick(kinds), two ? G.CLASS_AFFIX[P.cls] : null);
    const out = [first];
    if (two) {
      const k1 = first.slot === 'ranged' ? 'ranged' : first.wtype || null, rest = kinds.filter((k) => k !== k1);
      out.push(make(rest.length ? pick(rest) : k1, G.CLASS_AFFIX2[P.cls]));
    }
    G.S.flags[key] = out;
    return out;
  };
  G.rewardItem = (qid) => G.rewardItems(qid)[0] || null;
  G.turnIn = function (qid, choice) {
    const P = G.S.player, Q = D.QUESTS[qid];
    if (!G.questComplete(qid)) return;
    const opts = G.rewardItems(qid), it = opts[Math.min(choice | 0, opts.length - 1)] || null; // the version picked (#141)
    if (it && G.bagsFull(it)) return toast('Make room in your bags first: this quest gives an item.'); // nothing paid, it stays complete (#144, as #128)
    for (const o of Q.objs) if (o.type === 'collect') G.removeItem(o.item, o.n);
    delete P.quests[qid]; P.done[qid] = true;
    sys(`${Q.name} completed.`);
    const m = Math.round(((Q.reward.money || 0) + G.questMoney(Q.lvl)) * (1 + (racialPassive('questMoneyPct') + ((root.SOC && SOC.perk('gold')) || 0)) / 100) * G.warBonus());
    P.money += m;
    sys(`Received ${G.moneyText(m)}.`);
    { const ta = Object.keys(D.ABILITIES).find((k) => D.ABILITIES[k].learn === qid && D.ABILITIES[k].cls === P.cls); if (ta) { loot(`You have learned a new ability: ${D.ABILITIES[ta].name}.`); } } // a class quest teaches its ability
    if (it) { G.addItem(JSON.parse(JSON.stringify(it)), 1); loot(`You receive item: ${B.link(it.name, it.q)}.`); }
    G.gainXp(G.questXpFor(Q), false);
    G.lwEarn(D.EVENTS.lanternwake.earn.quest, 'a quest');
    G.lnGive(D.EVENTS.longnight.earn.quest, 'a quest', true);
    emit('questDone', { qid, text: 'Quest complete' });
    emit('change');
  };
  function questCheck() {
    const P = G.S.player;
    for (const qid in P.quests) {
      const Q = D.QUESTS[qid];
      Q.objs.forEach((o, i) => { if (o.type === 'visit' && P.place === o.place && !P.quests[qid].prog[i]) { P.quests[qid].prog[i] = 1; sys(`${D.PLACES[o.place].name} explored.`); } });
      const done = G.questComplete(qid);
      if (done && !P.quests[qid].told) { P.quests[qid].told = true; sys(`${Q.name} (Complete)`); emit('questReady', { qid }); }
    }
  }
  G.questCheck = questCheck;
  function neededQuestItem(itemId) {
    const P = G.S.player;
    for (const qid in P.quests) for (const o of D.QUESTS[qid].objs) if (o.type === 'collect' && o.item === itemId && G.countItem(itemId) < o.n) return true;
    return false;
  }
  // Lore Journal books (src/data/lore_books.js): some creatures carry one; it goes straight into the Library
  function bookDrop(mobKey) {
    const P = G.S.player;
    for (const k in D.LORE || {}) {
      const E = D.LORE[k]; if (!E.book || !E.from || !(mobKey in E.from)) continue;
      if ((P.books = P.books || {})[k]) continue;
      if (E.faction && E.faction !== 'both' && E.faction !== G.myFaction()) continue;
      if (Math.random() >= E.from[mobKey]) continue;
      P.books[k] = now();
      loot(`You found a book: ${B.link(E.title, 4)}. Read it in your Lore Journal.`);
      emit('change');
    }
  }
  G.bookDrop = bookDrop;
  function onKill(mobKey) {
    const P = G.S.player;
    P.kills++; P.lastKill = { mob: mobKey, place: P.place }; // what a passer-by may have seen you fight (#365)
    emit('kill', { mob: mobKey });
    bookDrop(mobKey);
    for (const qid in P.quests) D.QUESTS[qid].objs.forEach((o, i) => {
      if (o.type === 'kill' && o.mob === mobKey && (P.quests[qid].prog[i] || 0) < o.n) {
        P.quests[qid].prog[i] = (P.quests[qid].prog[i] || 0) + 1;
        sys(`${D.MOBS[mobKey].name} slain: ${P.quests[qid].prog[i]}/${o.n}`);
      }
    });
    bountyKill(mobKey);
    questCheck();
  }

  // ============================================================ bounty boards (hubs): 3 daily bounties + 1 weekly
  // Picked from the hub's zone with a seed from the real date, so they change at midnight (weekly on Monday).
  // v10.1.1: the day is the player's own (local midnight, and the weekly on local Monday); it used to be UTC's
  const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const dayKey = () => ymd(new Date(now()));
  const weekKey = () => { const d = new Date(now()); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return 'w' + ymd(d); };
  // when each clock next changes (#183): every timed thing says it, from this one helper, so the screens agree and a new
  // timed activity can't ship without a time. 'day' (local midnight: bounties, daily loot, the Roulette, festival dailies),
  // 'week' (local Monday: the weekly bounty), 'omens' (the Trials' Omens on the 1st, 8th, 15th and 22nd), 'hunt' (the
  // rare-hunt windows, 6 hours in UTC). Returns ms.
  G.nextChange = function (kind, t) {
    t = t == null ? now() : t; const d = new Date(t), y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
    if (kind === 'day') return new Date(y, m, day + 1).getTime();
    if (kind === 'week') return new Date(y, m, day + 7 - (d.getDay() + 6) % 7).getTime();
    if (kind === 'omens') { const next = [8, 15, 22].find((x) => x > day); return (next ? new Date(y, m, next) : new Date(y, m + 1, 1)).getTime(); }
    if (kind === 'hunt') return (Math.floor(t / G.HUNT_WINDOW) + 1) * G.HUNT_WINDOW;
    throw new Error('no clock: ' + kind);
  };
  // that time as a player reads it: 'midnight' for the next one, a clock time later today, else a day ('Mon 2 Nov')
  const WDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MON3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  G.whenText = function (ms, t) {
    t = t == null ? now() : t; const d = new Date(ms);
    if (ms === G.nextChange('day', t)) return 'midnight';
    if (new Date(t).toDateString() === d.toDateString()) return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return `${WDAYS[d.getDay()]} ${d.getDate()} ${MON3[d.getMonth()]}`;
  };
  // a bounty taken before the switch carries a UTC key; it stays good for that one day so nothing vanishes
  const oldDayKey = () => new Date(now()).toISOString().slice(0, 10);
  // only today's (this week's) local key: the UTC key from before v10.1.1 kept yesterday's bounty live until the UTC day
  // turned, 7 hours into the day in UTC+7 (#546); every bounty from back then has long lapsed
  const bountyLive = (st) => st.day === (st.weekly ? weekKey() : dayKey());
  const seeded = (str) => { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; }; };
  G.isHub = (placeId) => { const p = D.PLACES[placeId]; return !!(p && p.inn && p.safe && !p.city); };
  G.bounties = function (hub) {
    const S = G.S, P = S.player, region = D.PLACES[hub].region;
    const mobs = [], cap = P.level >= D.LEVEL_CAP; // at 60 every town's board offers its zone, at level-60 pay (#553)
    for (const [k, p] of Object.entries(D.PLACES)) if (p.region === region) for (const [m] of (p.mobs || [])) { const M = D.MOBS[m]; if (M && !M.named && !M.elite && (cap || (M.lvl[1] >= P.level - 4 && M.lvl[0] <= P.level + 2)) && !mobs.includes(m)) mobs.push(m); }
    if (!mobs.length) return [];
    const make = (key, weekly) => {
      const r = seeded(hub + key + P.level);
      const mob = mobs[Math.floor(r() * mobs.length)], n = weekly ? 30 : 8 + Math.floor(r() * 5);
      const L = Math.max(P.level, D.MOBS[mob].lvl[0]);
      return { id: `${hub}:${key}:${mob}`, hub, mob, n, weekly, xp: Math.round(G.questXp(L) * (weekly ? 2.5 : 0.7)), money: Math.round(G.questMoney(L) * (weekly ? 4 : 1.2)), marks: weekly ? 10 : 2 };
    };
    return [make(dayKey() + 'a'), make(dayKey() + 'b'), make(dayKey() + 'c'), make(weekKey(), true)];
  };
  G.bountyState = function (b) { const st = (G.S.player.bounty || {})[b.id]; return st ? (st.done ? 'done' : st.prog >= b.n ? 'complete' : 'active') : 'available'; };
  G.acceptBounty = function (b) {
    const P = G.S.player; P.bounty = P.bounty || {};
    pruneBounties(); // an earlier day's bounty has lapsed and no longer takes a place (#154)
    if (G.bountiesHeld() >= 6) return toast('You can hold 6 bounties at a time.');
    P.bounty[b.id] = { mob: b.mob, n: b.n, prog: 0, done: false, weekly: b.weekly, day: b.weekly ? weekKey() : dayKey(), reward: { xp: b.xp, money: b.money, marks: b.marks } };
    sys(`Bounty accepted: ${b.n} ${D.MOBS[b.mob].name}.`); toast('Bounty accepted: added to your Quest Log.'); emit('change'); // #135: a sign where you tapped
  };
  // what a bounty pays besides money (#184): XP below 60; at 60 the XP becomes +1 Mentor Mark, so nothing says "0 XP"
  G.bountyPay = (rw, weekly) => (G.S.player.level >= D.LEVEL_CAP ? { xp: 0, marks: (rw.marks || 0) + 1 } : { xp: rw.xp || 0, marks: rw.marks || 0 });
  G.turnInBounty = function (b) {
    const P = G.S.player, st = (P.bounty || {})[b.id]; if (!st || st.prog < st.n || st.done) return;
    st.done = true;
    P.money += st.reward.money; sys(`Bounty complete: ${D.MOBS[st.mob].name}. You receive ${G.moneyText(st.reward.money)}.`);
    const pay = G.bountyPay(st.reward, st.weekly), xp = pay.xp ? G.gainXp(pay.xp, false) || 0 : 0;
    if (pay.marks) G.addMarks(pay.marks, st.weekly ? 'weekly bounty' : 'bounty');
    let gear = false; // the weekly's bonus fits your class (#184): a level-60 blue at 60, else a green; full bags send it to the bank
    if (st.weekly) { const it = P.level >= D.LEVEL_CAP ? G.fittedGear(D.LEVEL_CAP, 3, P.cls) : G.fittedGear(P.level, 2, P.cls); G.giveReward(it, 'Weekly bounty bonus'); gear = true; loot(`Weekly bounty bonus: ${B.link(it.name, it.q)}.`); }
    // the line the screen shows (#115): a bounty says so, with what it paid; it used to show "Quest complete"
    const paid = [xp ? `${xp} XP` : null, G.moneyText(st.reward.money), pay.marks ? `${pay.marks} Mentor Mark${pay.marks === 1 ? '' : 's'}` : null, gear ? 'bonus gear' : null].filter(Boolean);
    emit('questDone', { bounty: true, text: `Bounty complete: ${D.MOBS[st.mob].name} · ${paid.join(' · ')}` }); emit('change'); G.save();
  };
  // v10.1.1: the board shows like a quest giver (! something to take, ? something to hand in), and the bounties you
  // hold are listed with your quests, each knowing its hub (the id starts with it)
  // only live bounties count toward the 6, the same ones the Quest Log shows (#154: lapsed ones used to count)
  G.bountiesHeld = () => Object.values((G.S.player.bounty || {})).filter((st) => !st.done && bountyLive(st)).length;
  G.bountyMarker = function (hub) {
    if (!G.isHub(hub)) return null;
    const bs = G.bounties(hub);
    if (bs.some((b) => G.bountyState(b) === 'complete')) return '?';
    if (G.bountiesHeld() < 6 && bs.some((b) => G.bountyState(b) === 'available')) return '!';
    return null;
  };
  G.myBounties = function () {
    const P = G.S.player, out = [];
    for (const [id, st] of Object.entries(P.bounty || {})) {
      if (st.done || !bountyLive(st)) continue; // an old day's bounty has lapsed
      const hub = id.split(':')[0];
      out.push({ id, hub, hubName: D.PLACES[hub] ? D.PLACES[hub].name : hub, mob: st.mob, n: st.n, prog: st.prog, weekly: st.weekly, complete: st.prog >= st.n });
    }
    return out.sort((a, b) => (b.complete - a.complete) || (a.weekly - b.weekly));
  };
  // old days' bounties lapse: they leave the save on load, on accepting and on a kill. A turned-in one is kept for
  // 21 days, and one from a later day than the clock stays (#435), so moving the clock forward and back can't hand a
  // turned-in bounty out again
  function pruneBounties() {
    const P = G.S && G.S.player; if (!P || !P.bounty) return;
    const keep = ymd(new Date(now() - 21 * 864e5));
    for (const [id, st] of Object.entries(P.bounty)) {
      if (bountyLive(st) || st.day > (st.weekly ? weekKey() : dayKey())) continue;
      if (st.done && String(st.day).replace(/^w/, '') >= keep) continue;
      delete P.bounty[id];
    }
  }
  function bountyKill(mobKey) {
    const P = G.S.player; if (!P.bounty) return;
    pruneBounties(); // kills only count toward today's (and this week's)
    for (const st of Object.values(P.bounty)) {
      if (!st.done && st.mob === mobKey && st.prog < st.n) { st.prog++; if (st.prog === st.n || st.prog % 5 === 0) sys(`Bounty: ${D.MOBS[mobKey].name} ${st.prog}/${st.n}`); }
    }
  }

  // Loot for one kill. Returns list of {item,n} and copper.
  G.rollLoot = (mobKey, level, share) => rollLoot(mobKey, level, share); // for sims (sim/prof.js)
  function rollLoot(mobKey, level, share) {
    const M = D.MOBS[mobKey];
    const out = { items: [], money: 0 };
    if (M.family !== 'beast' && Math.random() < 0.75) out.money = Math.round(level * rnd(2.5, 7) * (M.named ? 4 : 1) * (share || 1));
    for (const [id, p] of (M.drops || [])) if (Math.random() < p) out.items.push(G.copyItem(id));
    for (const [id, p] of (M.qdrops || [])) if (neededQuestItem(id) && Math.random() < p) out.items.push(G.copyItem(id));
    profLoot(mobKey, level, out);
    if (!M.boss) {
      const r = Math.random();
      const q = r < 0.012 ? 3 : r < 0.05 ? 2 : r < 0.1 ? 1 : r < 0.2 ? 0 : -1;
      if (q >= 0) out.items.push(G.genGear(pick(D.GEAR_SLOTS), level, q));
    }
    return out;
  }
  function giveLoot(l) {
    const P = G.S.player;
    if (l.money) { l.money = Math.round(l.money * (1 + racialPassive('lootMoneyPct') / 100) * G.warBonus()); P.money += l.money; loot(`You loot ${G.moneyText(l.money)}.`); }
    let got = 0; const gotItems = [];
    // full bags (#164): green or better goes to the bank and says so; grey and white that don't fit are named, once a kill
    const left = [];
    for (const it of l.items) {
      if ((it.q || 0) >= 2) { const to = G.giveReward(it, 'Loot'); if (to === 'bank') { toast(`Bags full: ${it.name} sent to your bank`); continue; } }
      else if (!G.addItem(it, 1)) { left.push(it); continue; }
      got++; gotItems.push(it); loot(`You receive loot: ${B.link(it.name, it.q)}.`);
    }
    if (left.length) sys(`Bags full: left behind ${left.map((it) => B.link(it.name, it.q)).join(', ')}`);
    if (l.money || got) emit('lootGain', { money: l.money, items: got, got: gotItems });
    questCheck();
  }
  G.giveLoot = (l) => giveLoot(l); // for tests (#164)

  // ============================================================ warlock demons
  G.petUnitFor = function (pu) {
    const P = G.S.player;
    if (!P.pet || P.pet.hp === 0) return null;
    const u = E.petUnit(P.pet.type, P.level, { uid: pu.uid, petName: P.pet.name, mob: P.pet.mob });
    const pb = E.talentMods(P).pet;
    if (pb) { u.maxHp = Math.round(u.maxHp * (1 + pb / 100)); u.hp = u.maxHp; u.dmg = u.dmg.map((d) => d * (1 + pb / 100)); }
    if (P.pet.hp != null) u.hp = clamp(P.pet.hp, 1, u.maxHp);
    return u;
  };
  function petWriteBack(C) {
    const P = G.S.player;
    const u = C && C.allies.find((a) => a.kind === 'pet');
    if (!u || !P.pet) return;
    if (u.dead) { P.pet.hp = 0; sys(`Your ${D.PETS[P.pet.type].name} has died.`); }
    else P.pet.hp = Math.round(u.hp);
  }
  G.canSummon = function (type) {
    const P = G.S.player, C = D.CLASSES[P.cls];
    if (type === 'beast') return P.cls === 'hunter' && !!P.pet && P.pet.type === 'beast';   // revive; taming is G.tame
    return !!(C.pets && C.pets.includes(type) && P.level >= D.PETS[type].lvl);
  };
  G.tamable = function (m) {
    const P = G.S.player, M = D.MOBS[m.key];
    return P.cls === 'hunter' && P.level >= D.PETS.beast.lvl && M.family === 'beast' && !M.named && !M.elite && m.level <= P.level && m.state === 'alive';
  };
  G.tame = function (mobId) {
    const P = G.S.player;
    const m = G.placeMobs().find((x) => x.id === mobId);
    if (!m || !G.tamable(m)) return toast('You can\'t tame that.');
    if (G.fight || P.travel || P.ghostUntil) return toast('You can\'t do that now.');
    stopActions();
    m.state = 'fight';
    P.casting = { what: 'tame', mob: m.key, mobId: m.id, label: 'Taming ' + D.MOBS[m.key].name, start: now(), end: now() + 6000 };
    emit('change');
  };
  G.summon = function (type) {
    const P = G.S.player;
    if (!G.canSummon(type)) return toast('You can\'t summon that yet.');
    if (G.fight || P.travel || P.ghostUntil) return toast('You can\'t do that now.');
    const v = G.vitals();
    const cost = Math.round(v.maxRes * D.PETS[type].cost);
    if (v.res < cost) return toast('Not enough mana');
    P.res -= cost;
    stopActions();
    P.casting = { what: 'summon', pet: type, label: 'Summon ' + D.PETS[type].name, start: now(), end: now() + 6000 };
    emit('change');
  };

  // ============================================================ solo combat
  // the social pull (#153): a humanoid or murloc brings a friend of its kind, 7% of the time below creature level 20
  // (kits are small; Mages and Priests died in 39% and 16-19% of those fights at 15-25) and 12% from 20; the friend
  // shows in the fight list at once (#122) and arrives after 4-7 s (it was 2-5), time to shield, slow it or step back.
  // #214: below creature level 20 the friend hits for 75% (Mage L15 3.8 -> 2.7 deaths an hour), and from 20 the pull is 12% (it was 14%;
  // Priest L25 2.7 -> 1.5, L30 2.4 -> 1.6). The creature you pulled is unchanged
  G.SOCIAL = { until: 20, low: 0.07, high: 0.12, after: [4, 7], lowDmg: 0.75 };
  // Pack pulls (#211, a choice on the Fight card): creatures of a kind standing together come as one pull, each at half
  // a lone one's health, damage and XP, so a pack pays off through area attacks and costs more when you have none.
  // 2 below creature level 20, then 3; normal creatures only. sim/lvpace.js PACK=1 PACKS=2,3,3 PACKMULT=0.5,0.5 PACKXP=0.5.
  G.PACK = { mult: 0.5, xp: 0.5, size: (lvl) => (lvl < 20 ? 2 : 3) };
  G.packFor = function (mobId) {
    const list = G.placeMobs(), m = list.find((x) => x.id === mobId);
    if (!m || m.state !== 'alive' || m.id.startsWith('n_')) return null;
    const M = D.MOBS[m.key]; if (M.elite || M.boss || M.named) return null;
    const pack = [m].concat(list.filter((x) => x !== m && x.state === 'alive' && x.key === m.key && !x.id.startsWith('n_'))).slice(0, G.PACK.size(m.level));
    return pack.length > 1 ? pack : null;
  };
  G.engage = function (mobId, useAbility, asPack) {
    const S = G.S, P = S.player;
    if (G.fight || P.travel || P.ghostUntil || S.run || S.bg) return;
    const list = G.placeMobs();
    const m = list.find((x) => x.id === mobId);
    if (!m) return;
    if (m.state === 'tapped') return toast(`Tapped by ${m.by}. You won't get anything from it.`);
    if (m.state !== 'alive') return;
    const pack = asPack ? G.packFor(mobId) : null;
    stopActions();
    m.state = 'fight';
    const pu = E.charUnit(P, 'ally', 'player', now());
    const pm = pack ? { hp: G.PACK.mult, dmg: G.PACK.mult } : undefined;
    const mu = E.mobUnit(m.key, m.level, pm);
    if (pack) mu.packXp = G.PACK.xp;
    mu.inst = m;
    G.pUnit = pu;
    const pet = G.petUnitFor(pu);
    const allies = pet ? [pu, pet] : [pu];
    for (const m of ((S.wparty && S.wparty.members) || [])) { const u = E.charUnit(m, 'ally', 'bot', now()); u.bot = { skill: m.bot.skill, react: 0.9 - 0.6 * m.bot.skill }; u.memberRef = m; allies.push(u); }
    G.fight = E.fight(allies, [mu], { soloUid: pu.uid });
    G.fight.kind = 'solo';
    healPickStart(G.fight); // #156
    G.fight.addAt = null;
    if (pack) {
      for (const o of pack.slice(1)) { o.state = 'fight'; const ou = E.mobUnit(o.key, o.level, pm); ou.inst = o; ou.packXp = G.PACK.xp; E.addEnemy(G.fight, ou); }
      G.fight.opts.killOrder = 'spread'; // the group's bots spread their attacks, as a player who pulled a pack for area attacks
      G.fight.packed = pack.length;
      if (!G.S.flags.packSeen) { G.S.flags.packSeen = true; info(`Pack of ${pack.length}: each weaker, half XP.`); }
    }
    // a party pulls more: each extra member usually brings another nearby creature into it
    const extra = [];
    if (!pack) for (let i = 1; i < G.partySize(); i++) if (Math.random() < EXTRA_PULL) { const o = G.placeMobs().find((x) => x.state === 'alive' && x !== m && !extra.includes(x) && !x.id.startsWith('n_')); if (o) extra.push(o); }
    for (const o of extra) { o.state = 'fight'; const ou = E.mobUnit(o.key, o.level); ou.inst = o; E.addEnemy(G.fight, ou); }
    // social pull: humanoids and murlocs sometimes bring a friend
    const M = D.MOBS[m.key];
    if (!pack && !M.named && (M.family === 'humanoid' || M.family === 'murloc') && Math.random() < (m.level < G.SOCIAL.until ? G.SOCIAL.low : G.SOCIAL.high)) {
      const friend = G.placeMobs().find((x) => x.state === 'alive' && x.key === m.key && x !== m);
      if (friend) { friend.state = 'fight'; G.fight.addAt = { t: rnd(G.SOCIAL.after[0], G.SOCIAL.after[1]), inst: friend }; }
    }
    emit('fightStart', { fight: G.fight });
    if (useAbility) G.useAbility(useAbility);
    return G.fight;
  };

  // someone in your party thanks you for a buff you really cast (#316: the line came at random, buff or not), now and then
  function thankBuff() {
    const S = G.S, ms = partyNow().filter((m) => m.bot && !m.legend); if (!ms.length || (S.flags.thankedAt || 0) > now() - 600000 || crand() >= 0.4) return;
    S.flags.thankedAt = now();
    const m = cpick(ms); S.pending.push({ at: now() + 1500 + crand() * 2500, bot: m.bot.id, ch: 'party', text: cpick(['ty for the buff', 'ty!', 'ty for buffs']), fromName: m.name });
  }
  G.useAbility = function (abId) {
    const C = G.fight;
    if (!C || !G.pUnit) return 'Not in combat';
    const ab = D.ABILITIES[abId];
    let tgt = G.pUnit.target;
    if (ab.target === 'ally' || (ab.either && G.role() === 'healer')) tgt = C.allyTarget != null && C.units[C.allyTarget] && !C.units[C.allyTarget].dead ? C.allyTarget : G.pUnit.uid;
    const why = E.use(C, G.pUnit, abId, tgt);
    if (!why && ab.target === 'party' && ab.buff && ab.buff.dur >= 60) thankBuff();
    if (why && E.queue(C, G.pUnit, abId, tgt, why)) return null; // the last 0.4 s of a cast or the global cooldown: it waits and fires then (#249)
    if (why && why !== E.GCD_WHY) emit('error', why); // the global cooldown says nothing (#173)
    return why;
  };
  // Heal target (#155, #156). A player whose abilities include one aimed at an ally (target: 'ally') picks whom heals go
  // to by tapping a party row; the pick is kept by who the member is (S.healPick, their bot id), so it holds between
  // pulls, and it goes back to you with one message when they die or leave. The top frame shows the pick (#155: it used
  // a hand-written class list that left out Shaman). Forms are ignored, so a Druid in bear form keeps the header.
  G.healsAllies = () => { const P = G.S.player; return D.CLASSES[P.cls].abilities.some((a) => D.ABILITIES[a] && D.ABILITIES[a].lvl <= P.level && D.ABILITIES[a].target === 'ally' && G.learned(a)); }; // an ability aimed at an ally, once learned (Intervene and Duet only after their class quest)
  const pickKey = (m) => (m && m.bot && m.bot.id) || (m && m.name) || null;
  const partyNow = () => { const S = G.S; return S.run && S.group ? S.group.members.filter((m) => !m.gone) : S.wparty ? S.wparty.members : []; };
  G.healPick = () => { const k = G.S.healPick; return k ? partyNow().find((m) => pickKey(m) === k) || null : null; };
  G.isHealPick = (m) => !!m && !!G.S.healPick && pickKey(m) === G.S.healPick;
  // tapping a member picks them; tapping the picked one again (or your own row, m = null) sends heals back to you
  G.pickHeal = function (m) {
    const S = G.S, C = G.fight;
    S.healPick = m && !G.isHealPick(m) ? pickKey(m) : null; S.healPickName = S.healPick ? m.name : null;
    if (C) { const u = S.healPick && C.allies.find((x) => x.memberRef && pickKey(x.memberRef) === S.healPick); C.allyTarget = u && !u.dead ? u.uid : null; }
    emit('target'); emit('change');
  };
  function healPickLost(name, why) { const S = G.S; S.healPick = null; S.healPickName = null; if (G.fight) G.fight.allyTarget = null; const t = `${name} ${why}. Heals go to you.`; sys(t); info(t); emit('target'); emit('change'); }
  // at the start of a pull: the kept pick is selected again, or lost with a note when the member is dead
  function healPickStart(C) {
    const S = G.S; if (!S.healPick) return;
    const u = C.allies.find((x) => x.memberRef && pickKey(x.memberRef) === S.healPick);
    if (!u) return; // not in this fight: healPickCheck says so if they left
    if (u.dead) return healPickLost(u.memberRef.name, 'died');
    C.allyTarget = u.uid;
  }
  // every step: the picked member died in this fight, or left the party; when the whole party or run ends it just clears
  function healPickCheck() {
    const S = G.S; if (!S.healPick) return;
    if (!(S.run && S.group) && !S.wparty) { S.healPick = null; S.healPickName = null; return; }
    const m = G.healPick();
    if (!m) return healPickLost(S.healPickName || 'Your heal target', 'left the party');
    const C = G.fight, u = C && C.allies.find((x) => x.memberRef === m);
    if (u && u.dead) healPickLost(m.name, 'died');
  }
  G.healPickCheck = healPickCheck;
  G.frameTarget = function () {
    const C = G.fight; if (!C || !G.pUnit) return null;
    return C.allyTarget != null && C.units[C.allyTarget] && G.healsAllies() ? C.allyTarget : G.pUnit.target;
  };
  G.setTarget = function (uid) { if (G.fight && G.pUnit) { const u = G.fight.units[uid]; if (u && !u.dead) { if (u.side === 'enemy') G.pUnit.target = uid; else { G.fight.allyTarget = uid; G.S.healPick = u.memberRef ? pickKey(u.memberRef) : null; G.S.healPickName = u.memberRef ? u.memberRef.name : null; } emit('target'); } } };
  G.toggleAuto = function () { if (G.pUnit) G.pUnit.auto = !G.pUnit.auto; };
  // ---------- the Bard's Rehearsal (#256): at level 4 a letter from the trainers; from the Quest Log, a practice fight
  // against a target that never fights back, in guided steps. It cannot be failed; stopping loses nothing.
  G.REHEARSAL_LVL = 4;
  G.REHEARSAL_STEPS = [
    { key: 'start', text: 'Tap a song to start it.' },
    { key: 'beat', text: 'Wait for the gold, then tap the song: a verse.' },
    { key: 'early', text: 'Now tap the song before the gold: a verse is lost.' },
    { key: 'finale', text: 'Fill every verse on the beat, then tap off the beat: the Finale.' },
  ];
  G.rehearsalOpen = () => { const P = G.S && G.S.player; return !!P && P.cls === 'bard' && P.level >= G.REHEARSAL_LVL && !P.rehearsed; };
  G.rehearsalLetter = function () { // once per character, at level 4 (or on load for a Bard already past it)
    const P = G.S.player; if (!G.rehearsalOpen() || P.rehearsalMail) return;
    P.rehearsalMail = true;
    const from = G.myFaction() === 'horde' ? 'The drum-speakers of Vazhrak' : 'The heralds of Kingsmere';
    G.mailSend({ kind: 'letter', from, title: 'The Rehearsal', text: 'Every Bard learns the beat before a crowd hears it. When you have a quiet moment, rehearse: a practice target waits for you, and it never strikes back. Quest Log → The Rehearsal.' });
  };
  G.rehearseWhy = function () {
    const S = G.S, P = S.player;
    if (!G.rehearsalOpen()) return 'Nothing to rehearse.';
    if (G.fight) return 'You are in combat.';
    if (S.run || S.bg || P.travel || P.ghostUntil) return 'Not now.';
    if (!D.CLASSES.bard.abilities.some((a) => D.ABILITIES[a].song && D.ABILITIES[a].lvl <= P.level)) return 'You know no songs yet.';
    return null;
  };
  G.rehearse = function () {
    const why = G.rehearseWhy(); if (why) return why;
    const P = G.S.player;
    stopActions();
    const pu = E.charUnit(P, 'ally', 'player', now());
    const mu = E.mobUnit('practice_target', P.level, { hp: 1, dmg: 0 });
    mu.maxHp = mu.hp = 1e9; mu.dmg = [0, 0]; mu.swingT = 1e9; mu.dodge = 0; // a target: it never swings, never falls
    G.pUnit = pu;
    G.fight = E.fight([pu], [mu], { soloUid: pu.uid });
    G.fight.kind = 'rehearsal'; G.fight.rehearsal = { step: 0 };
    emit('fightStart', { fight: G.fight });
    emit('rehearsal', { step: 0 });
    return null;
  };
  G.rehearsalNow = () => (G.fight && G.fight.kind === 'rehearsal' ? G.fight.rehearsal : null);
  function rehearsalStep(C, evs) {
    const R = C.rehearsal, me = G.pUnit && G.pUnit.uid;
    for (const e of evs) {
      if (e.type !== 'song' || e.src !== me || R.done) continue;
      const want = G.REHEARSAL_STEPS[R.step].key;
      if (e.what === 'end' && !e.replaced) { R.note = 'The song ran out, and its verses with it. Start it again.'; if (R.step > 0 && !G.pUnit.auras.some((a) => a.song)) { R.step = 0; emit('rehearsal', R); } continue; }
      const hit = (want === 'start' && e.what === 'start') || (want === 'beat' && e.what === 'beat' && !e.sync) || (want === 'early' && e.what === 'early') || (want === 'finale' && e.what === 'finale');
      if (!hit) continue;
      R.note = null;
      if (R.step + 1 >= G.REHEARSAL_STEPS.length) { R.done = true; C.over = 'win'; } else R.step++;
      emit('rehearsal', R);
    }
  }
  function endRehearsal(C) {
    const P = G.S.player, R = C.rehearsal;
    E.writeBack(C, G.pUnit, now());
    G.fight = null; G.pUnit = null;
    if (R && R.done) {
      P.rehearsed = true;
      sys('The Rehearsal completed.');
      const m = G.questMoney(G.REHEARSAL_LVL); P.money += m; sys(`Received ${G.moneyText(m)}.`);
      G.gainXp(G.questXpFor({ lvl: G.REHEARSAL_LVL }), false);
      emit('questDone', { qid: 'rehearsal', text: 'The Rehearsal complete' });
    } else sys('Rehearsal stopped. Try again from the Quest Log.');
    emit('fightEnd', { result: R && R.done ? 'win' : 'flee' });
    emit('rehearsal', null);
    emit('change'); G.save();
  }

  G.flee = function () {
    const C = G.fight;
    if (C && (C.kind === 'duel' || C.kind === 'brawl')) { C.over = 'lose'; sys('You yield.'); return; } // yielding a duel (or a brawl round) counts as a loss
    if (C && C.kind === 'rehearsal') { C.over = 'lose'; return; } // stopping a Rehearsal: nothing lost, try again later
    if (!C || (C.kind !== 'solo' && C.kind !== 'pvp')) return;
    if (Math.random() < (C.kind === 'pvp' ? 0.45 : 0.6)) {
      if (C.kind === 'pvp') { const f = G.S.flags; G.S.player.pvp = G.pvpStats(); G.S.player.pvp.escapes++; f.nextAmbush = now() + AMBUSH_GAP; }
      for (const e of C.enemies) { if (e.inst) { e.inst.state = 'alive'; } }
      addNeverCame(C);
      recordFx(C, G.pUnit); E.writeBack(C, G.pUnit, now());
      petWriteBack(C);
      G.fight = null; G.pUnit = null;
      sys('You escaped.');
      emit('fightEnd', { result: 'flee' });
    } else {
      sys('You failed to escape!');
      for (const e of E.alive(C.enemies)) e.swingT = 0;
    }
  };
  // Buffs out of combat (Battle Shout, Fortitude, Frost Armor) just apply.
  // a buff shorter than a minute does nothing out of a fight (only buffs of 60 s or more are kept between fights), unless
  // the ability also heals: it is refused there and dimmed on the bar (#165)
  G.fightBuff = (abId) => { const ab = D.ABILITIES[abId]; return !!(ab && ((ab.buff && ab.buff.dur < 60) || ab.shield) && !ab.heal && !ab.hot); }; // a shield only lasts inside a fight too
  // a bard's instrument button (#261): it shows the instrument played now; a tap moves to the next one learned
  G.INSTRUMENTS = ['play_lute', 'play_drum', 'play_horn'];
  G.instrumentAb = () => 'play_' + (G.S.player.instrument || 'lute');
  G.nextInstrument = function () {
    const P = G.S.player, known = G.INSTRUMENTS.filter((id) => P.level >= D.ABILITIES[id].lvl);
    if (known.length < 2) return 'Lute: your only instrument. The Drum comes at level ' + D.ABILITIES.play_drum.lvl + '.';
    return G.castOutOfCombat(known[(known.indexOf(G.instrumentAb()) + 1) % known.length]);
  };
  G.castOutOfCombat = function (abId) {
    const P = G.S.player, ab = D.ABILITIES[abId];
    if (G.fight) return G.useAbility(abId);
    if (ab.combatOnly) return 'Use it in combat';
    if (ab.instrument) { if (P.level < ab.lvl) return 'Not learned yet'; P.instrument = ab.instrument; G.save(); emit('change'); emit('info', `Now playing: ${ab.name.replace(/^Play (the )?/, '')}`); return null; } // a bard's rhythm (#251)
    if (G.fightBuff(abId)) return 'Use it in a fight.'; // before any cost (#165: it took the mana and the cooldown and applied nothing)
    if (ab.cd && ((P.cds || {})[abId] || 0) > now()) return E.cooldownText(abId, (P.cds[abId] - now()) / 1000); // (#173)
    if (ab.lifetap) {
      const amt = Math.round(ab.lifetap.base + ab.lifetap.perLvl * P.level);
      const v0 = G.vitals();
      if (P.hp <= amt + 1) return 'Not enough health';
      P.hp -= amt; P.res = Math.min(v0.maxRes, P.res + amt);
      emit('change');
      return null;
    }
    if (!ab.buff && !ab.heal && !ab.hot && !ab.shield) return 'Needs a target';
    const v = G.vitals();
    const cost = E.abCost(ab, P);
    if (cost > v.res) return v.resType === 'rage' ? 'Not enough rage' : 'Not enough mana';
    P.res -= cost;
    if (E.isHeal(ab)) P.auras = E.dropOnHeal(P.auras || []); // a heal ends Shadowform (#245)
    if (ab.buff) {
      const stats = {};
      const bp = 1 + (E.talentMods(P).buff[abId] || 0) / 100;
      for (const k in (ab.buff.stats || {})) stats[k] = Math.round((ab.buff.stats[k] + ((ab.buff.perLvl && ab.buff.perLvl[k]) || 0) * P.level) * bp * 10) / 10;
      P.auras = (P.auras || []).filter((a) => a.id !== ab.buff.id && !(ab.buff.group && ((D.ABILITIES[a.id] || {}).buff || {}).group === ab.buff.group)); // one of a group at a time
      const extra = {};
      if (ab.buff.seal) { const w = (P.equip.weapon && P.equip.weapon.speed) || 2; extra.seal = (ab.buff.seal.base + ab.buff.seal.perLvl * P.level) * (w / 2.5); extra.sealSchool = ab.buff.seal.school || 'holy'; }
      if (ab.buff.thorns) extra.thorns = { dmg: Math.round((ab.buff.thorns.base + ab.buff.thorns.perLvl * P.level) * bp), charges: ab.buff.thorns.charges }; // with its talent, as in a fight
      if (ab.buff.dur >= 60) P.auras.push(Object.assign({ id: ab.buff.id, stats, until: now() + ab.buff.dur * 1000 }, extra));
      if (stats.sta) P.hp += stats.sta * 10;
      // a party buff reaches the party between pulls too, as it does in a fight (#315): each member's next fight reads it
      if (ab.target === 'party' && ab.buff.dur >= 60) thankBuff();
      if (ab.target === 'party' && ab.buff.dur >= 60) for (const m of partyNow()) {
        m.auras = (m.auras || []).filter((a) => a.id !== ab.buff.id && !(ab.buff.group && ((D.ABILITIES[a.id] || {}).buff || {}).group === ab.buff.group));
        m.auras.push({ id: ab.buff.id, stats: Object.assign({}, stats), until: now() + ab.buff.dur * 1000 });
      }
    }
    if (ab.heal || ab.hot) {
      const st = G.stats();
      const tmh = E.talentMods(P);
      const amt = (ab.heal ? rnd(ab.heal.base[0], ab.heal.base[1]) + ab.heal.perLvl * P.level + ab.heal.coef * st.sp : (ab.hot.heal + ab.hot.perLvl * P.level) * ab.hot.ticks * (1 + (tmh.hot[abId] || 0) / 100)) * (1 + (tmh.heal + (tmh.abilHeal[abId] || 0)) / 100);
      P.hp = Math.min(v.maxHp, P.hp + amt);
      emit('selfheal', Math.round(amt));
    }
    if (ab.cd) { P.cds = P.cds || {}; P.cds[abId] = now() + Math.max(1, ab.cd - (E.talentMods(P).abilCd[abId] || 0)) * 1000; }
    emit('change');
    return null;
  };

  // a creature on its way to join (C.addAt) when the fight ends never came: it goes back to the world (#318: it stayed
  // marked as fighting, so it never respawned and was gone from the place)
  function addNeverCame(C) { const a = C.addAt; if (a && a.inst && a.inst.state === 'fight') a.inst.state = 'alive'; C.addAt = null; }
  function endSolo(C) {
    const S = G.S, P = S.player;
    addNeverCame(C);
    if (C.wanderer) { const Hd = D.LEGENDS[C.wanderer.key].hooded; B.post(S, 'say', { name: Hd.name, cls: 'paladin' }, cpick(Hd.leave)); sys('The hooded knight walks off without giving a name.'); }
    const pu = G.pUnit;
    recordFx(C, pu); E.writeBack(C, pu, now());
    if (C.over === 'win' && pu.dead) P.hp = 1; // the kill and your death in the same moment: the kill counts, and you live (#121)
    petWriteBack(C);
    for (const u of C.allies) if (u.memberRef) { E.writeBack(C, u, now()); if (u.dead) u.memberRef.hp = Math.round(u.maxHp * 0.5); }
    const size = S.wparty ? 1 + S.wparty.members.length : 1;
    const share = size > 1 ? PARTY_XP_BONUS / size : 1;
    const result = C.over;
    if (result === 'win') {
      for (const e of C.enemies) {
        if (e.inst) {
          const named = e.inst.id.startsWith('n_');
          e.inst.state = 'dead';
          e.inst.until = now() + (named ? D.PLACES[P.place].named[e.key] * 1000 : rnd(15, 28) * 1000);
          if (named && G.isHunt(e.key)) { P.huntKilled = P.huntKilled || {}; P.huntKilled[e.key] = G.huntNow(e.key, now()).w; e.inst.state = 'away'; G.takeTrophy(e.key); } // gone until its next window (#43)
        }
        onKill(e.key); G.collectorKill(e.key, e.level); G.lwKill(e.level, e.elite); G.lnKill(e.level, e.elite); // festival candles and Kindling
        if (e.inst && e.inst.id.startsWith('n_') && !D.MOBS[e.key].boss) G.epicDrop('rare', e.level); // a rare's purple chance (#141)
        G.gainXp(Math.round(G.xpForKill(e.level, e.elite) * share * (e.packXp || 1)), true); // a pack creature: half (#211)
        const l = rollLoot(e.key, e.level, 1 / size);
        if (size > 1) {
          // gear goes to whoever wins the roll; everything else is yours
          const gear = l.items.filter((it) => D.GEAR_SLOTS.includes(it.slot));
          l.items = l.items.filter((it) => !D.GEAR_SLOTS.includes(it.slot));
          for (const it of gear) {
            if (Math.random() < 1 / size) l.items.push(it);
            else { const w = pick(S.wparty.members); loot(`${w.name} won: ${B.link(it.name, it.q)}`); }
          }
        }
        giveLoot(l);
        // Undead: Cannibalize after beating a humanoid or undead
        if (racialPassive('cannibalize') && ['humanoid', 'undead'].includes(D.MOBS[e.key].family)) { const v = G.vitals(); P.hp = Math.min(v.maxHp, P.hp + v.maxHp * 0.15); }
      }
    } else {
      for (const e of C.enemies) if (e.inst) { e.inst.state = 'alive'; }
      P.deaths++; P.hp = 0; G.wear();
      P.ghostUntil = now() + 15000;
      sys('You have died. Your spirit runs back to your body...');
      if (crand() < 0.3) { const near = B.onlineIn(S, P.place, new Date()); if (near.length) B.post(S, 'say', cpick(near), cpick(['rip', 'oof', 'lol rip', 'u ok?'])); }
    }
    G.fight = null; G.pUnit = null;
    emit('fightEnd', { result });
    G.save();
  }




  // ============================================================ bank and auction house (capitals)
  const AH_CUT = 0.05, AH_LIFE = 24 * 3600000;
  // the bank: 24 slots, and up to 3 tabs of 12 more bought with gold (#506), per character
  G.BANK_BASE = 24; G.BANK_TAB = 12; G.BANK_TAB_COST = [500000, 1000000, 2000000];
  G.bankSlots = () => G.BANK_BASE + G.BANK_TAB * Math.min(G.BANK_TAB_COST.length, (G.S && G.S.player.bankTabs) || 0);
  G.buyBankTab = function () {
    const P = G.S.player, n = P.bankTabs || 0, c = G.BANK_TAB_COST[n];
    if (c == null) return toast('Your bank has every tab.');
    if (P.money < c) return toast(`You need ${G.moneyText(c)}.`);
    P.money -= c; P.bankTabs = n + 1; sys(`Bank tab ${n + 1} bought: ${G.bankSlots()} slots.`); emit('change'); G.save();
  };
  G.bankDeposit = function (idx) {
    const P = G.S.player, b = P.bags[idx]; if (!b) return;
    P.bank = P.bank || [];
    const full = () => toast(P.bank.length > G.bankSlots() ? `Your bank holds ${P.bank.length - G.bankSlots()} over from rewards. Take something out first.` : 'Your bank is full.');
    if (G.stackable(b.item)) { // stacks of 20 (#440); an old save's stack over 20 goes in as 20s, or not at all
      if (stackSlots(P.bank, b.item, b.n) > Math.max(0, G.bankSlots() - P.bank.length)) return full();
      P.bags.splice(idx, 1); putStack(P.bank, b.item, b.n); emit('change'); return true;
    }
    if (P.bank.length >= G.bankSlots()) return toast(P.bank.length > G.bankSlots() ? `Your bank holds ${P.bank.length - G.bankSlots()} over from rewards. Take something out first.` : 'Your bank is full.');
    P.bank.push(b); P.bags.splice(idx, 1); emit('change'); return true;
  };
  // Store materials (beta.3): every trade good in the bags goes onto its bank stacks; what doesn't fit stays in the bags
  const storeable = (b) => b.item.slot === 'mat' && G.stackable(b.item) && !G.isQuestItem(b.item.id);
  G.bankStoreMats = function () {
    const P = G.S.player; P.bank = P.bank || []; let moved = 0, left = 0;
    for (let i = P.bags.length - 1; i >= 0; i--) {
      const b = P.bags[i]; if (!storeable(b)) continue;
      if (stackSlots(P.bank, b.item, b.n) > Math.max(0, G.bankSlots() - P.bank.length)) { left++; continue; }
      P.bags.splice(i, 1); putStack(P.bank, b.item, b.n); moved++;
    }
    emit('change'); return { moved, left };
  };
  G.bankWithdraw = function (idx) {
    const P = G.S.player, b = (P.bank || [])[idx]; if (!b) return;
    if (G.isQuestItem(b.item.id)) { G.addItem(b.item, b.n); P.bank.splice(idx, 1); return emit('change'); } // kept with the quests, no slot needed (an old save's)
    // a full stack (20) is no room, and the bank lets go only of what reached the bags (#163: a stack was deleted)
    if (G.stackable(b.item)) { // as many as fit, in stacks of 20 (#440); the rest stays in the bank
      const fit = P.bags.reduce((a, x) => a + (x.item.id === b.item.id && x.n < STACK ? STACK - x.n : 0), 0) + G.bagFree(b.item) * STACK;
      const k = Math.min(b.n, fit); if (!k) return toast('Bags are full.');
      G.addItem(k === b.n ? b.item : Object.assign({}, b.item), k); b.n -= k; if (!b.n) P.bank.splice(idx, 1);
      return emit('change');
    }
    if (G.bagsFull(b.item)) return toast('Bags are full.');
    if (G.addItem(b.item, b.n)) P.bank.splice(idx, 1);
    emit('change');
  };
  // The account bank (#286, docs/plans/2026-11-09-account-bank-design.md): every character on the account shares it. The
  // record and its merge are ABANK (src/acctbank.js); it lives in the account record, so it syncs with Marks and heirlooms.
  // 12 slots free, then 3 tabs of 12 for Mentor Marks at doubling prices: ~233 Marks a day at 1 h/day (#181), so the
  // three tabs are ~6 days of play. Only what the auction house takes goes in.
  const AB = root.ABANK || require('./acctbank.js');
  G.ABANK_BASE = 12; G.ABANK_TAB = 12; G.ABANK_TAB_COST = [200, 400, 800];
  G.abank = () => AB.merge(G.account().bank, null);
  const abankSave = (b) => { const a = G.account(); a.bank = b; return G.saveAccount(a) !== false; }; // false: the write was refused
  G.abankSlots = (b) => G.ABANK_BASE + G.ABANK_TAB * Math.min(G.ABANK_TAB_COST.length, (b || G.abank()).tabs);
  G.abankTakes = (it) => !!it && G.ahTrade(it) && !G.isQuestItem(it.id) && !(D.ITEMS[it.id] || {}).event;
  // Each move writes the receiving side first, so a crash between the two writes leaves a copy, never a loss.
  G.abankDeposit = function (idx) {
    const P = G.S.player, x = P.bags[idx]; if (!x) return false;
    if (!G.abankTakes(x.item)) { toast('Only items you could sell can go in the account bank.'); return false; }
    const b = G.abank(); AB.deposit(b, JSON.parse(JSON.stringify(x.item)), x.n, G.stackable(x.item));
    if (AB.slots(b) > G.abankSlots(b)) { toast('The account bank is full.'); return false; }
    if (!abankSave(b)) { toast("Couldn't save. Nothing moved."); return false; } // storage full: the bags keep it
    P.bags.splice(idx, 1); G.save(); emit('change'); return true; // the account bank, then the bags
  };
  G.abankWithdraw = function (key, most) { // most: take at most this many (one shown stack of 20)
    const b = G.abank(), row = AB.view(b).find((g) => g.key === key); if (!row) return false;
    const k = row.stack ? Math.min(row.n, most || row.n, G.bagRoom(row.item)) : (G.bagsFull(row.item) ? 0 : 1);
    if (!k) { toast('Bags are full.'); return false; }
    const got = AB.takeKey(b, key, k), P = G.S.player, before = JSON.stringify(P.bags);
    if (!got.n || !G.addItem(G.regearItem(JSON.parse(JSON.stringify(got.item))), got.n)) return false; // #581
    if (!G.save()) { P.bags = JSON.parse(before); toast("Couldn't save. Nothing moved."); return false; } // storage full: it stays in the account bank
    abankSave(b); emit('change'); return true; // the bags, then the account bank
  };
  G.abankStoreMats = function () { // the same for the account bank: one write for all of it, the account bank first
    const P = G.S.player, cap = G.abankSlots(), idx = []; let b = G.abank(), left = 0;
    for (let i = P.bags.length - 1; i >= 0; i--) {
      const x = P.bags[i]; if (!storeable(x) || !G.abankTakes(x.item)) continue;
      const t = JSON.parse(JSON.stringify(b)); AB.deposit(t, JSON.parse(JSON.stringify(x.item)), x.n, true);
      if (AB.slots(t) > cap) { left++; continue; }
      b = t; idx.push(i);
    }
    if (idx.length && !abankSave(b)) { toast("Couldn't save. Nothing moved."); return { moved: 0, left: left + idx.length }; }
    for (const i of idx) P.bags.splice(i, 1); // descending, so the indices hold
    if (idx.length) G.save();
    emit('change'); return { moved: idx.length, left };
  };
  G.abankBuyTab = function () {
    const a = G.account(), b = AB.merge(a.bank, null), c = G.ABANK_TAB_COST[b.tabs];
    if (c == null) { toast('The account bank has every tab.'); return false; }
    if (a.marks < c) { toast(`You need ${c} Mentor Marks.`); return false; }
    a.marks -= c; b.tabs += 1; a.bank = b; G.saveAccount(a); // one write: the Marks and the tab together
    sys(`Account bank tab ${b.tabs} bought: ${G.abankSlots(b)} slots.`); emit('change'); return true;
  };
  // What other players pay: the vendor price times a factor by quality.
  G.ahValue = (it) => it.slot === 'bag' && D.BAG_TIER && D.BAG_TIER[it.id] ? Math.round(0.75 * it.bag * (it.matBag ? 0.6 : 1) * G.questMoney(D.BAG_TIER[it.id]) / 100) * 100 /* a materials-only slot is worth less */ : (G.ahTrade(it) && !D.GEAR_SLOTS.includes(it.slot) ? Math.max(4, Math.round((it.sell || 2) * (it.slot === 'recipe' ? 8 : 5))) : Math.max(10, Math.round((it.sell || 5) * [2, 3, 6, 9, 14, 0][it.q || 1])));
  // what can go on the auction house: gear, trade goods and anything a profession makes
  G.ahTrade = (it) => !it.heirloom && !it.noSell && !it.lock && (D.GEAR_SLOTS.includes(it.slot) ? it.q >= 1 : ['mat', 'potion', 'elixir', 'stone', 'kit', 'bag', 'recipe'].includes(it.slot));
  // Listings from other players, refreshed now and then, around your level.
  function ahRefresh(force) {
    const S = G.S, P = S.player, t = now();
    S.ah = S.ah || { listings: [], mine: [], next: 0 };
    if (!force && t < S.ah.next) return;
    S.ah.next = t + 30 * 60000;
    S.ah.listings = S.ah.listings.filter((l) => l.expires > t).slice(-10);
    const myF = (D.RACES[P.race] || {}).faction || 'alliance';
    const sellers = S.bots.filter((b) => B.factionOf(b) === myF);
    // trade goods from gatherers around your level
    const L0 = P.level, goods = ['copper_ore', 'copper_bar', 'rough_stone', 'peacebloom', 'silverleaf', 'light_leather', 'linen_cloth', 'linen_bolt'].concat(L0 >= 8 ? ['earthroot', 'mageroyal', 'minor_healing_potion'] : [], L0 >= 12 ? ['tin_ore', 'bronze_bar', 'briarthorn', 'wool_cloth', 'coarse_stone', 'lesser_healing_potion'] : [], L0 >= 16 ? ['silver_ore', 'bruiseweed', 'medium_leather', 'wool_bolt', 'healing_potion', 'linen_bag'] : [], L0 >= 26 ? ['iron_ore', 'iron_bar', 'ironthistle', 'redmantle', 'heavy_leather', 'silk_cloth', 'greater_healing_potion'] : [], L0 >= 36 ? ['embersilver_ore', 'stoutroot', 'dimleaf', 'goldspur', 'thick_leather', 'silk_bolt', 'mana_potion'] : [], L0 >= 46 ? ['duskiron_ore', 'duskiron_bar', 'cinderbloom', 'gloomcap', 'hardhide_leather', 'duskweave_cloth', 'grand_healing_potion'] : [], L0 >= 55 ? ['sunveil', 'frostpetal', 'duskweave_bolt', 'moonsilver_bar', 'grand_mana_potion', 'elixir_might'] : []); // Expert goods from 26, Artisan from 46 (v10.9)
    // a bag for your level is always on sale (#534): the best one you've reached, or now and then the one before it
    const bagsOk = (D.BAG_AH || []).filter((k) => D.ITEMS[k] && D.BAG_TIER[k] <= L0);
    if (bagsOk.length && !S.ah.listings.some((l) => bagsOk.includes(l.item.id))) {
      const k = bagsOk.length > 1 && Math.random() < 0.3 ? bagsOk[bagsOk.length - 2] : bagsOk[bagsOk.length - 1], it = G.copyItem(k);
      S.ah.listings.push({ id: 'ah' + t + '_b' + S.ah.listings.length + '_' + rint(0, 9999), item: it, n: 1, price: Math.round(G.ahValue(it) * (1.05 + Math.random() * 0.25)) /* never under its value, so it can't be flipped (sim/auction.js) */, seller: pick(sellers).name, expires: t + rnd(6, 24) * 3600000 });
    }
    { // now and then a materials bag for your level (beta.3), priced like the other bags
      const mk = (D.BAG_MATS_AH || []).filter((k) => D.ITEMS[k] && D.BAG_TIER[k] <= L0).pop();
      if (mk && Math.random() < 0.35 && !S.ah.listings.some((l) => l.item.id === mk)) { const it = G.copyItem(mk); S.ah.listings.push({ id: 'ah' + t + '_m' + S.ah.listings.length + '_' + rint(0, 9999), item: it, n: 1, price: Math.round(G.ahValue(it) * (1.05 + Math.random() * 0.25)), seller: pick(sellers).name, expires: t + rnd(6, 24) * 3600000 }); }
    }
    // the basic materials your crafts use at your skill are always on sale (#560): a crafter whose gathering doesn't feed
    // the craft can still level it. Priced like the bags, never under value, so a listing can't be bought and resold
    for (const id of G.craftMatsNeeded()) if (!S.ah.listings.some((l) => l.item.id === id)) {
      const it = G.copyItem(id), n = rint(2, 4) * 5;
      S.ah.listings.push({ id: 'ah' + t + '_c' + S.ah.listings.length + '_' + rint(0, 9999), item: it, n, price: Math.round(G.ahValue(it) * n * (1.05 + Math.random() * 0.25)), seller: pick(sellers).name, expires: t + rnd(6, 24) * 3600000 });
    }
    while (S.ah.listings.filter((l) => !D.GEAR_SLOTS.includes(l.item.slot)).length < 8) {
      const it = G.copyItem(pick(goods)), n = G.stackable(it) ? rint(1, 4) * 5 : 1;
      const price = Math.round(G.ahValue(it) * n * (0.8 + Math.random() * 0.6));
      S.ah.listings.push({ id: 'ah' + t + '_g' + S.ah.listings.length + '_' + rint(0, 9999), item: it, n, price, seller: pick(sellers).name, expires: t + rnd(6, 24) * 3600000 });
    }
    while (S.ah.listings.length < 26) {
      const L = clamp(P.level + rint(-3, 2), 2, D.LEVEL_CAP), q = Math.random() < 0.12 ? 3 : 2;
      const it = G.genGear(pick(D.GEAR_SLOTS.filter((x) => x !== 'ranged' || Math.random() < 0.4)), L, q);
      const price = Math.round(G.ahValue(it) * (0.85 + Math.random() * 0.6));
      S.ah.listings.push({ id: 'ah' + t + '_' + S.ah.listings.length + '_' + rint(0, 9999), item: it, price, seller: pick(sellers).name, expires: t + rnd(6, 24) * 3600000 });
    }
  }
  G.ahListings = function () { ahRefresh(false); return G.S.ah.listings.slice().sort((a, b) => (b.item.lvl || 0) - (a.item.lvl || 0)); };
  G.ahBuy = function (id) {
    const S = G.S, P = S.player, l = (S.ah.listings || []).find((x) => x.id === id);
    if (!l) return toast('Someone else bought it.');
    if (P.money < l.price) return toast(`You need ${G.moneyText(l.price)}.`);
    if (G.slotsShort([[l.item, l.n || 1]])) return toast('Bags are full.'); // a stack it joins is room (#407)
    P.money -= l.price; S.ah.listings = S.ah.listings.filter((x) => x !== l);
    G.addItem(l.item, l.n || 1); loot(`You bought ${B.link(l.item.name, l.item.q)}${(l.n || 1) > 1 ? ' x' + l.n : ''} from ${l.seller} for ${G.moneyText(l.price)}.`);
    emit('change');
  };
  // Your auctions sell over real time; the higher the price over market value, the longer it takes.
  // Selling (issue #20): certain at the usual price or below, then less likely the higher you go, about none at twice it;
  // a deposit of 5% of the usual price, back only if it sells. The posting dialog shows both.
  G.AH_CURVE = { sure: 0.8, none: 1.9 }; // certain at or below `sure` times the usual price, then a straight line to none at `none`. Tuned by sim/auction.js: 'certain at 1.0x' made reposting at 1.0x risk-free (33g a day at 60); this keeps flipping under 10g a day at 60 and every price button the best at something
  G.ahSellChance = (ratio) => { const c = G.AH_CURVE; return ratio <= c.sure ? 1 : Math.max(0, (c.none - ratio) / (c.none - c.sure)); };
  G.ahDeposit = (it, n) => Math.max(1, Math.round(G.ahValue(it) * (n || 1) * 0.05));
  G.ahPost = function (idx, price) {
    const S = G.S, P = S.player, b = P.bags[idx]; if (!b) return;
    if (!G.ahTrade(b.item)) return toast('You can\'t auction that.');
    S.ah = S.ah || { listings: [], mine: [], next: 0 };
    if (S.ah.mine.length >= 8) return toast('You can have 8 auctions at a time.');
    const v = G.ahValue(b.item) * b.n, ratio = price / v, t = now(), dep = G.ahDeposit(b.item, b.n);
    if (P.money < dep) return toast(`The deposit is ${G.moneyText(dep)}.`);
    // a higher price is a real risk (issue #20): it may not sell within the day; when it does, it takes longer
    const sells = Math.random() < G.ahSellChance(ratio);
    const hours = sells ? Math.min(23.5, 0.3 * Math.pow(Math.max(0.3, ratio), 3) * rnd(0.6, 1.6)) : null;
    P.money -= dep; P.bags.splice(idx, 1);
    S.ah.mine.push({ item: b.item, n: b.n, price, deposit: dep, postedAt: t, sellAt: hours != null ? t + hours * 3600000 : null, expires: t + AH_LIFE });
    sys(`Auction posted: ${b.item.name}, ${G.moneyText(price)} (deposit ${G.moneyText(dep)}, refunded on sale).`);
    emit('change');
  };
  G.ahCancel = function (i) {
    const S = G.S, a = S.ah.mine[i]; if (!a) return;
    if (G.slotsShort([[a.item, a.n || 1]])) return toast('Bags are full.');
    S.ah.mine.splice(i, 1); G.addItem(a.item, a.n || 1); sys(`You cancelled your auction of ${a.item.name}.${a.deposit ? ` The deposit of ${G.moneyText(a.deposit)} is kept by the house.` : ''}`); emit('change');
  };
  const ahTick = G.ahTick = function () {
    const S = G.S; if (!S.ah || !S.ah.mine.length) return;
    const t = now(), P = S.player, sold = [];
    for (const a of S.ah.mine.slice()) {
      if (a.sellAt && t >= a.sellAt) {
        const got = Math.round(a.price * (1 - AH_CUT)), dep = a.deposit || 0;
        P.money += got + dep; S.ah.mine = S.ah.mine.filter((x) => x !== a);
        const buyer = pick(S.bots); loot(`Auction sold: ${B.link(a.item.name, a.item.q)} to ${buyer.name}, ${G.moneyText(got)} after the 5% cut${dep ? ` (+${G.moneyText(dep)} deposit)` : ''}.`);
        G.mailSend({ kind: 'sold', at: Math.min(t, a.sellAt), item: a.item, n: a.n || 1, buyer: buyer.name, got, dep }); // a receipt (#258): the gold is already here
        sold.push({ name: a.item.name, got: got + dep });
        emit('lootGain', { money: got });
      } else if (t >= a.expires) {
        S.ah.mine = S.ah.mine.filter((x) => x !== a);
        const lost = a.deposit ? ` The deposit of ${G.moneyText(a.deposit)} is lost.` : '';
        G.mailSend({ kind: 'expired', at: Math.min(t, a.expires), item: a.item, n: a.n || 1, dep: a.deposit || 0 }); // the item waits in the mail (#258)
        sys(`Your auction of ${a.item.name} expired. It is in your mail: take it at any town's mailbox.${lost}`);
      }
    }
    if (sold.length === 1) emit('info', `Sold: ${sold[0].name}, ${G.moneyText(sold[0].got)}`);
    else if (sold.length) emit('info', `${sold.length} auctions sold: ${G.moneyText(sold.reduce((a, x) => a + x.got, 0))}`);
  };
  // ---------- the inbox (#258, docs/plans/2026-10-16-inbox-design.md): letters about your auctions. A sale is a receipt
  // (its gold arrived with the sale); an expired auction's item waits in its letter until taken at a mailbox, in any town.
  // The newest MAIL_KEEP letters are kept; past that the oldest read letters with no item waiting go first.
  G.MAIL_KEEP = 50;
  G.mail = () => G.S.mail || (G.S.mail = []);
  G.mailWaiting = (m) => !!m.item && (m.kind === 'expired' || m.kind === 'reward') && !m.taken; // an item still to take: an expired auction, or a festival reward that didn't fit (#382)
  G.mailSend = function (m) {
    const L = G.mail(); G.S.mailNext = (G.S.mailNext || 0) + 1;
    L.push(Object.assign({ id: G.S.mailNext, at: now(), read: false }, m));
    L.sort((a, b) => a.at - b.at);
    while (L.length > G.MAIL_KEEP) {
      const k = L.findIndex((x) => x.read && !G.mailWaiting(x)), k2 = k >= 0 ? k : L.findIndex((x) => !G.mailWaiting(x));
      if (k2 < 0) break; // every letter holds an item: none is ever thrown away
      L.splice(k2, 1);
    }
    emit('mail');
  };
  G.mailUnread = () => G.mail().filter((m) => !m.read).length;
  G.mailRead = function (id) { const m = G.mail().find((x) => x.id === id); if (m && !m.read) { m.read = true; emit('mail'); } };
  G.mailReadAll = function () { let n = 0; for (const m of G.mail()) if (!m.read) { m.read = true; n++; } if (n) emit('mail'); };
  // a mailbox stands in every town: any safe place with an inn, and every place in a capital
  G.mailboxAt = (placeId) => { const p = D.PLACES[placeId]; return !!(p && p.safe && (p.inn || p.city)); };
  G.mailboxHere = () => G.mailboxAt(G.S.player.place) && !G.S.player.travel && !G.fight && !G.S.run;
  // why an item can't be taken now, or null
  G.mailTakeWhy = function (m) {
    if (!m || !G.mailWaiting(m)) return 'Nothing to take.';
    if (!G.mailboxHere()) return 'Take it at a mailbox, in any town.';
    if (G.slotsShort([[m.item, m.n || 1]])) return 'Your bags are full.';
    return null;
  };
  G.mailTake = function (id) {
    const m = G.mail().find((x) => x.id === id), why = G.mailTakeWhy(m); if (why) return toast(why);
    G.addItem(m.item, m.n || 1); m.taken = true; m.read = true;
    emit('info', `Taken: ${m.item.name}`); emit('change'); emit('mail');
    return null;
  };
  G.mailDelete = function (id) {
    const L = G.mail(), i = L.findIndex((x) => x.id === id); if (i < 0) return null;
    if (G.mailWaiting(L[i])) return toast('Take the item first.');
    L.splice(i, 1); emit('mail'); return null;
  };
  // ============================================================ professions (v3): gathering, crafting, bags, consumables
  // P.prof = { mining: { skill, max, known: [rare recipe ids] } }. Two primary professions. Data in data/professions.js.
  G.bagCap = function () { const P = G.S.player; return 16 + (P.bagsEq || []).reduce((a, b) => a + (b.bag || 0), 0); };
  // A materials bag (beta.3) holds only trade goods: one list, two limits. Trade goods may sit in any slot; everything else
  // only in the backpack and normal bags (gearCap). Trade goods fill the materials slots first, so the rest of the
  // normal slots are gearCap minus other items minus the trade goods that overflow. G.bagFree(it) is the room for that
  // item; with no item, the room for anything (the stricter number).
  G.isMatItem = (it) => !!it && it.slot === 'mat' && !G.isQuestItem(it.id);
  G.gearCap = function () { const P = G.S.player; return 16 + (P.bagsEq || []).reduce((a, b) => a + (b.matBag ? 0 : b.bag || 0), 0); };
  function bagFreeOf(bags, cap, gcap, it) {
    const all = Math.max(0, cap - bags.length); if (G.isMatItem(it)) return all;
    const mats = bags.filter((b) => G.isMatItem(b.item)).length;
    return Math.max(0, Math.min(all, gcap - (bags.length - mats) - Math.max(0, mats - (cap - gcap))));
  }
  // whether these items have a legal place with these bags equipped (unequipping or swapping a bag)
  function bagsHold(bags, eq) {
    const cap = 16 + eq.reduce((a, b) => a + (b.bag || 0), 0), gcap = 16 + eq.reduce((a, b) => a + (b.matBag ? 0 : b.bag || 0), 0);
    const mats = bags.filter((b) => G.isMatItem(b.item)).length;
    return bags.length <= cap && bags.length - mats + Math.max(0, mats - (cap - gcap)) <= gcap;
  }
  G.bagFree = (it) => bagFreeOf(G.S.player.bags, G.bagCap(), G.gearCap(), it);
  G.bagsFull = (it) => G.bagFree(it) <= 0;
  // would n of it fit once takeN of takeId has left the bags? tried on a copy, so it counts exactly as addItem places it
  G.wouldFit = function (it, n, takeId, takeN) {
    const P = G.S.player, bags = P.bags, q = P.qitems;
    P.bags = bags.map((b) => ({ item: b.item, n: b.n })); P.qitems = Object.assign({}, q);
    try { if (takeId) G.removeItem(takeId, takeN); return G.isQuestItem(it.id) || (G.stackable(it) ? stackSlots(P.bags, it, n || 1) <= G.bagFree(it) : G.bagFree(it) > 0); }
    finally { P.bags = bags; if (q) P.qitems = q; else delete P.qitems; }
  };
  // how many more bag slots a set of items ([item, n] pairs) needs than are free, counted the way G.addItem places them:
  // a stackable item joins a stack with room, a quest item takes no slot, anything else takes a slot. 0: they all fit (#162)
  G.slotsShort = function (list) {
    const P = G.S.player, room = {}; let need = 0, other = 0;
    for (const [it, n] of list) {
      if (G.isQuestItem(it.id)) continue;
      if (!G.stackable(it)) { need++; other++; continue; }
      if (!(it.id in room)) room[it.id] = P.bags.reduce((a, b) => a + (b.item.id === it.id && b.n < STACK ? STACK - b.n : 0), 0);
      const rest = Math.max(0, (n || 1) - room[it.id]), s = Math.ceil(rest / STACK); // stacks of 20 (#440)
      need += s; if (!G.isMatItem(it)) other += s; room[it.id] = room[it.id] + s * STACK - (n || 1);
    }
    return Math.max(0, need - G.bagFree({ slot: 'mat', id: '' }), other - G.bagFree());
  };
  // the Bags tab warns before your bags are full (#90): free slots from the real capacity, so bigger bags need nothing here.
  // A badge only at BAG_WARN free or fewer (amber, the count), and "Full" at none; with more room, nothing
  G.BAG_WARN = 3;
  G.bagBadge = () => { const n = G.bagFree(); return n > G.BAG_WARN ? null : n === 0 ? { full: true, text: 'Full', n } : { full: false, text: String(n), n }; };
  G.profs = () => G.S.player.prof || (G.S.player.prof = {});
  G.hasProf = (id) => !!G.profs()[id];
  // the skills this build knows: a save from a newer build can hold one it does not (issue #17); it stays in the save,
  // and every list skips it
  G.knownProfIds = () => Object.keys(G.profs()).filter((k) => D.PROFESSIONS[k]);
  G.primaryCount = () => G.knownProfIds().filter((k) => !D.isSecondary(k)).length;
  G.profRank = function (id) { const p = G.profs()[id]; return p ? D.PROF_RANKS.findIndex((r) => r.max === p.max) : -1; };
  G.nextRank = function (id) {
    const P = G.S.player, p = G.profs()[id], i = p ? G.profRank(id) + 1 : 0, R = D.PROF_RANKS[i];
    if (!R) return null;
    return Object.assign({ idx: i, ok: P.level >= R.lvl && (!p || p.skill >= R.skill) }, R);
  };
  G.trainProf = function (id) {
    const P = G.S.player, profs = G.profs(), R = G.nextRank(id);
    if (!R) return toast(`${D.PROFESSIONS[id].name}: already at the highest rank.`);
    if (!profs[id] && !D.isSecondary(id) && G.primaryCount() >= D.PROF_MAX) return toast(`You can learn ${D.PROF_MAX} professions. Unlearn one first.`); // Cooking and Fishing use no slot
    if (P.level < R.lvl) return toast(`Requires level ${R.lvl}.`);
    if (profs[id] && profs[id].skill < R.skill) return toast(`Requires ${R.skill} skill in ${D.PROFESSIONS[id].name}.`);
    if (P.money < R.cost) return toast(`You need ${G.moneyText(R.cost)}.`);
    P.money -= R.cost;
    if (!profs[id]) profs[id] = { skill: 1, max: R.max, known: [] }; else profs[id].max = R.max;
    loot(`You are now a${R.name[0] === 'A' ? 'n' : ''} ${R.name} in ${D.PROFESSIONS[id].name} (skill up to ${R.max}).`);
    emit('change'); G.save();
  };
  // what unlearning a profession takes (#145): its skill, its cap and the recipes known at that skill; for the confirmation
  G.unlearnInfo = function (id) {
    const p = G.profs()[id]; if (!p) return null;
    return { name: D.PROFESSIONS[id].name, skill: p.skill, max: p.max, recipes: G.recipesFor(id).filter((r) => r.sk[0] <= p.skill).length, artisan: p.skill >= 300 };
  };
  // free and anywhere (#145). Cooking and Fishing take no slot, so they stay. A title earned at 300 stays: it is recorded
  // here, since the title reads the skill (the keepsake already lives in the wardrobe)
  G.unlearnProf = function (id) {
    const P = G.S.player, p = G.profs()[id]; if (!p) return;
    if (D.isSecondary(id)) return toast(`${D.PROFESSIONS[id].name} takes no profession slot, so it stays.`);
    if (p.skill >= 300) { P.artisan = P.artisan || {}; P.artisan[id] = true; }
    delete G.profs()[id]; sys(`You unlearned ${D.PROFESSIONS[id].name}.`); emit('change'); G.save();
  };
  // colour of a recipe or node for your skill: 0 orange, 1 yellow, 2 green, 3 grey, -1 too hard
  G.skillColor = function (skill, sk) { if (skill < sk[0]) return -1; if (skill < sk[1]) return 0; if (skill < sk[2]) return 1; if (skill < sk[3]) return 2; return 3; };
  const SKILL_CHANCE = [1, 0.75, 0.25, 0];
  function skillUp(id, color) {
    const p = G.profs()[id]; if (!p || color < 0 || p.skill >= p.max) return;
    if (Math.random() >= SKILL_CHANCE[color]) return;
    p.skill++;
    sys(`Your skill in ${D.PROFESSIONS[id].name} has increased to ${p.skill}.`);
    if (p.skill === p.max && G.nextRank(id)) sys(`${D.PROFESSIONS[id].name} ${p.max}/${p.max}. Train at a profession trainer to go further.`);
    if (p.skill >= 300) G.profReward(id);
  }
  // 300 in a skill (v10.9): its keepsake joins the wardrobe's Back row for every character, and its title opens
  G.profReward = function (id) {
    const R = (D.PROF_REWARDS || {})[id]; if (!R || !G.collectLook(D.ITEMS[R.keepsake])) return false;
    loot(`Artisan ${D.PROFESSIONS[id].name}: new look ${B.link(R.name, 4)} and title "${G.titleName(D.TITLES.find((t) => t.id === 'prof_' + id), G.S.player.name)}".`);
    emit('change'); return true;
  };
  G.nodeSk = (N) => [N.skill, N.skill + D.GATHER_BANDS[0], N.skill + D.GATHER_BANDS[1], N.skill + D.GATHER_BANDS[2]];
  // --- gathering nodes: up to 2 per wild place, one respawns every 75–120 s
  const nodePlace = (pl) => pl && !pl.safe && !pl.city && (pl.mobs || []).length > 0;
  const nodeKind = (k) => (D.NODES[k].prof === 'mining' ? 'ore' : 'herb');
  function rollNode(pl, kind) {
    const L = Math.round(((pl.lvl || [1, 1])[0] + (pl.lvl || [1, 1])[1]) / 2);
    let list = D.nodeTable(L)[kind].filter((x) => x[1] > 0);
    // single-player kindness: what spawns is what your skill can gather, when you have that profession
    const p = G.profs()[kind === 'ore' ? 'mining' : 'herbalism'];
    if (p) { const can = list.filter((x) => D.NODES[x[0]].skill <= p.skill); if (can.length) list = can; }
    const tot = list.reduce((a, x) => a + x[1], 0);
    let r = Math.random() * tot; for (const [k, w] of list) { r -= w; if (r <= 0) return k; }
    return list[0][0];
  }
  // up to 2 ore veins and 2 herbs per wild place; each kind respawns on its own timer
  G.NODES_PER_KIND = 2; // ore and herb each: up to 4 nodes in a place, and the scene has a spot for each (POS_NODE in ui.js)
  function nodesTick(id, W, t) {
    const pl = D.PLACES[id]; if (!nodePlace(pl)) return;
    if (!W.pnodes || !W.pnodes.at) W.pnodes = { list: [rollNode(pl, 'ore'), rollNode(pl, 'herb')], at: { ore: t + rnd(60, 100) * 1000, herb: t + rnd(60, 100) * 1000 } };
    for (const kind of ['ore', 'herb']) {
      if (W.pnodes.list.filter((k) => nodeKind(k) === kind).length < G.NODES_PER_KIND && t >= W.pnodes.at[kind]) { W.pnodes.list.push(rollNode(pl, kind)); W.pnodes.at[kind] = t + rnd(60, 100) * 1000; }
      else if (t >= W.pnodes.at[kind]) W.pnodes.at[kind] = t + rnd(60, 100) * 1000;
    }
  }
  // the nodes you can see here (you only notice what your professions look for)
  G.placeNodes = function (all) { // all (#76): nodes of professions you don't have too, so the world points at the skill
    const P = G.S.player, pl = D.PLACES[P.place]; if (!nodePlace(pl) || G.S.run) return [];
    const W = placeState(P.place); nodesTick(P.place, W, now());
    return W.pnodes.list.map((k, i) => ({ i, key: k, N: D.NODES[k] })).filter((x) => all || G.hasProf(x.N.prof));
  };
  G.gatherNode = function (i) {
    const S = G.S, P = S.player;
    if (G.fight) return toast('Finish the fight first.'); // (#167) on the road the nodes aren't in the scene, so no tap reaches here
    if (S.run || P.travel) return;
    const W = placeState(P.place), key = W.pnodes && W.pnodes.list[i]; if (!key) return;
    const N = D.NODES[key], p = G.profs()[N.prof];
    if (!p) return toast(`Requires ${D.PROFESSIONS[N.prof].name}: learn it from a profession trainer.`);
    if (p.skill < N.skill) return toast(`Requires ${D.PROFESSIONS[N.prof].name} ${N.skill}.`);
    if (G.bagsFull(D.ITEMS[N.item]) && !P.bags.some((b) => b.item.id === N.item && b.n < 20)) return toast('Bags are full.');
    stopActions();
    P.casting = { what: 'pgather', key, label: `${D.PROFESSIONS[N.prof].verb === 'Mine' ? 'Mining' : 'Picking'} ${N.name}`, start: now(), end: now() + 2500 };
    emit('castBegin', { what: 'pgather' }); emit('change');
  };
  function finishGather(c) {
    const P = G.S.player, W = placeState(P.place), list = (W.pnodes || {}).list || [];
    const i = list.indexOf(c.key); if (i < 0) return sys('Someone else got there first.');
    list.splice(i, 1); const kd = nodeKind(c.key); if (W.pnodes.at[kd] < now() + 50000) W.pnodes.at[kd] = now() + rnd(60, 100) * 1000;
    const N = D.NODES[c.key], p = G.profs()[N.prof];
    const n = rint(N.n[0], N.n[1]);
    const got = Math.min(n, G.bagRoom(D.ITEMS[N.item])); // what fits goes in, and the rest is named (#474)
    if (got > 0 && G.addItem(G.copyItem(N.item), got)) loot(`You receive item: ${B.link(D.ITEMS[N.item].name, D.ITEMS[N.item].q)}${got > 1 ? ' x' + got : ''}.`);
    if (got < n) info(`Bags full: ${n - got} ${D.ITEMS[N.item].name} left behind.`);
    if (N.extra && Math.random() < N.extra[1] && G.addItem(G.copyItem(N.extra[0]), 1)) loot(`You receive item: ${B.link(D.ITEMS[N.extra[0]].name)}.`);
    skillUp(N.prof, G.skillColor(p.skill, G.nodeSk(N)));
    emit('lootGain', { items: 1, got: [D.ITEMS[N.item]] });
  }
  // --- skinning happens as you loot a beast; linen and wool come from humanoids
  function profLoot(mobKey, level, out) {
    const M = D.MOBS[mobKey], p = G.profs().skinning;
    if (M.family === 'beast' && p) {
      const need = D.skinSkill(level);
      if (p.skill >= need) {
        out.items.push(G.copyItem(D.skinLeather(level)));
        if (Math.random() < 0.35) out.items.push(G.copyItem(D.skinLeather(level)));
        skillUp('skinning', G.skillColor(p.skill, [need, need + 25, need + 50, need + 100]));
      } else if (!G.S.flags.skinWarn || now() - G.S.flags.skinWarn > 60000) { G.S.flags.skinWarn = now(); sys(`Requires Skinning ${need} to skin this.`); }
    }
    if (M.family === 'beast' && G.profs().cooking && level >= 3 && Math.random() < 0.35) out.items.push(G.copyItem(D.beastMeat(level))); // meat for a cook (v10.9)
    if (M.family === 'humanoid' && level >= 14 && Math.random() < (level >= 28 ? 0.4 : level >= 18 ? 0.3 : 0.2)) { const cl = level > 50 || (level > 45 && Math.random() < 0.5) ? 'duskweave_cloth' : level >= 28 ? 'silk_cloth' : 'wool_cloth'; out.items.push(G.copyItem(cl)); if (level >= 36 && cl !== 'wool_cloth') out.items.push(G.copyItem(cl)); } // silk from 28 (Expert), duskweave above 45 (Artisan), in twos from 36; 46-50 drop silk or duskweave, a bridge between the tiers (issue #6)
    if (M.named && Math.random() < 0.2) out.items.push(G.copyItem(pickRare(level)));
  }
  // a rare recipe for the level it drops at (v10.9): one whose item is within 8 levels, else the nearest ones
  function pickRare(level) {
    const lv = (id) => { const r = D.RECIPES[D.ITEMS[id].teaches], it = D.ITEMS[r.makes]; return it.slot === 'bag' ? Math.round(r.sk[0] / 5) : it.lvl || 1; }; // a bag is level 1 to wear: it drops at its recipe's skill / 5
    let near = D.RARE_RECIPES.filter((id) => Math.abs(lv(id) - level) <= 8);
    if (!near.length) { const best = Math.min(...D.RARE_RECIPES.map((id) => Math.abs(lv(id) - level))); near = D.RARE_RECIPES.filter((id) => Math.abs(lv(id) - level) === best); }
    return pick(near);
  }
  G.pickRare = pickRare;
  G.rareRecipeDrop = (level) => (Math.random() < 0.1 ? G.copyItem(pickRare(level || G.S.player.level)) : null);
  // --- crafting: 1.5 s per item, repeats for a batch
  // what your crafts need now (#560): the materials of each craft's recipes that still raise your skill (sk[2] is where a
  // recipe turns green), skipping what a vendor sells; at most 4, the ones the most of those recipes use
  G.craftMatsNeeded = function () {
    const count = {};
    for (const id of G.knownProfIds()) {
      if (D.PROFESSIONS[id].kind !== 'craft') continue;
      const skill = G.profs()[id].skill;
      for (const r of G.recipesFor(id)) if (r.sk[0] <= skill && skill < r.sk[2]) for (const m in r.mats) { const it = D.ITEMS[m]; if (it && !it.cost && G.ahTrade(it)) count[m] = (count[m] || 0) + 1; }
    }
    return Object.keys(count).sort((a, b) => count[b] - count[a]).slice(0, 4);
  };
  G.recipesFor = function (prof) {
    const p = G.profs()[prof]; if (!p) return [];
    return Object.values(D.RECIPES).filter((r) => r.prof === prof && (!r.rare || (p.known || []).includes(r.id))).sort((a, b) => a.sk[0] - b.sk[0]);
  };
  // crafting reaches into the bank (beta.3): materials stored there count, and the bags' go first
  const bankHas = (id) => (G.S.player.bank || []).reduce((a, b) => a + (b.item.id === id ? b.n : 0), 0);
  G.matCount = (id) => G.countItem(id) + bankHas(id);
  function takeMat(id, n) { // returns how many came from the bank, so a refund puts them back there
    const bags = Math.min(n, G.countItem(id)); G.removeItem(id, bags); let rest = n - bags; const fromBank = rest;
    const bank = G.S.player.bank || [];
    for (let i = bank.length - 1; i >= 0 && rest > 0; i--) { const b = bank[i]; if (b.item.id !== id) continue; const k = Math.min(b.n, rest); b.n -= k; rest -= k; if (!b.n) bank.splice(i, 1); }
    return fromBank;
  }
  G.removeMat = (id, n) => takeMat(id, n); // bags first, then the bank: what chat requests take (#550)
  G.craftable = function (rid) { const r = D.RECIPES[rid]; let n = 99; for (const m in r.mats) n = Math.min(n, Math.floor(G.matCount(m) / r.mats[m])); return n; };
  G.craft = function (rid, count) {
    const S = G.S, P = S.player, r = D.RECIPES[rid], p = G.profs()[r.prof];
    if (!p) return;
    if (G.fight) return toast('You are in combat.');
    if (p.skill < r.sk[0]) return toast(`Requires ${D.PROFESSIONS[r.prof].name} ${r.sk[0]}.`);
    if (G.craftable(rid) < 1) return toast('You are missing materials.');
    if (!Object.keys(r.mats).some((m) => G.wouldFit(D.ITEMS[r.makes], r.n, m, Math.min(r.mats[m], G.countItem(m))))) return toast('Bags are full.'); // materials that empty a slot make room (#486)
    stopActions();
    const left = Math.max(1, Math.min(count || 1, G.craftable(rid)));
    P.casting = { what: 'craft', rid, left, total: left, label: `${D.ITEMS[r.makes].name}`, start: now(), end: now() + 1500 };
    emit('castBegin', { what: 'craft' }); emit('change');
    return true;
  };
  // a batch that ends early because the bags filled says so, with how far it got (#170): information, not a refusal
  function craftStopped(c) { if ((c.total || 1) > 1) { const t = `Bags full. Made ${c.made || 0} of ${c.total}.`; sys(t); info(t); } }
  function finishCraft(c) {
    const P = G.S.player, r = D.RECIPES[c.rid], p = G.profs()[r.prof];
    if (!p || G.craftable(c.rid) < 1) return;
    const fromBank = {}; for (const m in r.mats) fromBank[m] = takeMat(m, r.mats[m]);
    // cooking (v10.9): Burnt loses the first set of the batch; Perfect adds one serving per five (at least one)
    c.made = (c.made || 0) + 1;
    if (c.quality === 'burnt' && c.made === 1) {
      sys(`You burn the ${D.ITEMS[r.makes].name}.`);
      if (c.left > 1 && G.craftable(c.rid) > 0) P.casting = Object.assign({}, c, { left: c.left - 1, start: now(), end: now() + 1500 });
      return;
    }
    const extra = c.quality === 'perfect' && ((c.batch || 1) < 5 ? c.made === 1 : c.made % 5 === 0) ? 1 : 0;
    const it = G.copyItem(r.makes);
    if (D.GEAR_SLOTS.includes(it.slot)) { it.id = r.makes; it.crafter = P.name; }
    if (!G.addItem(it, r.n + extra)) { for (const m in r.mats) { if (fromBank[m]) putStack(G.S.player.bank, G.copyItem(m), fromBank[m]); if (r.mats[m] > fromBank[m] && !G.addItem(G.copyItem(m), r.mats[m] - fromBank[m])) { G.S.player.bank = G.S.player.bank || []; putStack(G.S.player.bank, G.copyItem(m), r.mats[m] - fromBank[m]); sys(`${D.ITEMS[m].name} x${r.mats[m] - fromBank[m]} went to your bank: no room in your bags.`); } } /* a refund that no longer fits the bags (an old stack over 20) goes to the bank, never lost (#548) */ c.made--; craftStopped(c); return; }
    loot(`You create: ${B.link(it.name, it.q)}${r.n + extra > 1 ? ' x' + (r.n + extra) : ''}${extra ? ' (Perfect)' : ''}.`);
    skillUp(r.prof, G.skillColor(p.skill, r.sk));
    G.S.stats = G.S.stats || {}; G.S.stats.crafted = (G.S.stats.crafted || 0) + 1;
    if (c.left > 1 && G.craftable(c.rid) > 0) { if (G.bagsFull(D.ITEMS[r.makes]) && !P.bags.some((b) => b.item.id === r.makes && b.n < STACK)) craftStopped(c); else P.casting = Object.assign({}, c, { left: c.left - 1, start: now(), end: now() + 1500 }); }
  }
  // --- cooking (v10.9): the heat bar. A needle sweeps from cold (0) to burnt (1); where you stop it decides the batch:
  // the gold zone is Perfect, the rest Normal, the burnt end (and never stopping) Burnt. The gold zone is wider the
  // further your skill is above the recipe's. Auto cooks Normal.
  G.COOK_BAR = { sweep: 1.6, gold: 0.62, burnt: 0.86, width: [0.06, 0.15] };
  G.COOK_HARD = { wellFed: 0.85, rare: 0.6 };
  G.cookZone = function (rid) {
    const r = D.RECIPES[rid], p = G.profs().cooking, B_ = G.COOK_BAR, over = Math.max(0, (p ? p.skill : 0) - r.sk[0]);
    // a Well Fed meal is a little harder to get Perfect, a dish of a rare fish clearly harder (G.COOK_HARD)
    const it = D.ITEMS[r.makes], rare = Object.keys(r.mats).some((m) => (D.ITEMS[m].q || 1) >= 2);
    const w = Math.min(B_.width[1], B_.width[0] + over / 600) * (rare ? G.COOK_HARD.rare : it.wellFed ? G.COOK_HARD.wellFed : 1);
    return { gold: [B_.gold - w / 2, B_.gold + w / 2], burnt: B_.burnt };
  };
  G.cookResult = (rid, pos) => { const z = G.cookZone(rid); return pos == null || pos >= z.burnt ? 'burnt' : pos >= z.gold[0] && pos <= z.gold[1] ? 'perfect' : 'normal'; };
  // true when a batch started; a refusal (in a fight, bags full, no materials) has already said why (#170)
  G.cook = function (rid, count, quality) {
    if (G.craft(rid, count) !== true) return false; const P = G.S.player; // a refusal returns its message
    if (P.casting && P.casting.what === 'craft' && P.casting.rid === rid) Object.assign(P.casting, { quality: quality || 'normal', batch: P.casting.left });
    return true;
  };
  // --- fishing (v10.9): cast, wait for the bite, tap; big and rare fish fight on the reel. DOM-free: the screen drives it
  // with G.fishStart / G.fishTap / G.fishReel, the sims do the same. Auto lands a common fish and never a big or rare one.
  G.FISH_TIME = { wait: [2, 8], window: { common: 0.9, big: 0.7, rare: 0.55 }, autoLand: 0.85 };
  // the reel, in bar units (0..1) a second: your zone rises while you hold and falls when you let go; the line fills
  // while the fish is in your zone and drains while it is out
  G.FISH_REEL = { zone: { big: 0.24, rare: 0.2 }, rise: 1.5, fall: 1.3, fill: 0.42, drain: 0.32, speed: { big: 0.6, rare: 0.75 } };
  // deeper water fights harder: each tier above the first narrows the zone, speeds the fish, drains the line faster and
  // shortens the bite (rare stays the hardest of its tier)
  G.FISH_TIER = { zone: 0.02, speed: 0.15, drain: 0.12, window: 0.08 };
  G.fishFeel = function (kind, tier) {
    const R = G.FISH_REEL, T = G.FISH_TIER, up = Math.max(0, (tier || 1) - 1);
    return { window: G.FISH_TIME.window[kind] * (1 - T.window * up), zone: kind === 'common' ? 0 : R.zone[kind] - T.zone * up, speed: kind === 'common' ? 0 : R.speed[kind] * (1 + T.speed * up), drain: R.drain * (1 + T.drain * up) };
  };
  G.fishWhy = function () {
    const S = G.S, P = S.player, p = G.profs().fishing;
    if (!p) return 'Learn Fishing from a profession trainer first.';
    if (G.fight || S.run || S.bg || P.travel || P.ghostUntil) return "You can't fish right now.";
    const tier = D.waterTier(P.place); if (!tier) return 'There is no water to fish here.';
    const need = D.FISH[tier].common[0][1]; if (p.skill < need) return `You need Fishing ${need} to fish here.`;
    return null;
  };
  function rollFish(tier, skill) {
    const T = D.FISH[tier];
    if (skill >= T.rare[1] && Math.random() < D.FISH_CHANCE.rare) return { id: T.rare[0], kind: 'rare', need: T.rare[1] };
    if (skill >= T.big[1] && Math.random() < D.FISH_CHANCE.big) return { id: T.big[0], kind: 'big', need: T.big[1] };
    const can = T.common.filter((c) => c[1] <= skill), c = pick(can);
    return { id: c[0], kind: 'common', need: c[1] };
  }
  G.fishStart = function (auto) {
    const why = G.fishWhy(); if (why) { toast(why); return false; }
    { // a stack of this water's fish with room still takes one (#486); fish are trade goods, so a materials bag takes them
      const T = D.FISH[D.waterTier(G.S.player.place)], ids = T.common.map((c) => c[0]).concat(T.big[0], T.rare[0]);
      if (ids.some((id) => G.bagsFull(D.ITEMS[id])))
      if (!G.S.player.bags.some((b) => ids.includes(b.item.id) && b.n < 20)) { toast('Bags are full.'); return false; }
    }
    stopActions();
    const P = G.S.player, f = rollFish(D.waterTier(P.place), G.profs().fishing.skill), t = now();
    P.fishing = { phase: 'wait', start: t, biteAt: t + rnd(G.FISH_TIME.wait[0], G.FISH_TIME.wait[1]) * 1000, fish: f, auto: !!auto, tier: D.waterTier(P.place) };
    emit('fish', { phase: 'wait' }); return true;
  };
  function fishDone(result, id) {
    const P = G.S.player, F = P.fishing; if (!F) return;
    P.fishing = Object.assign({}, F, { phase: 'done', result, caught: id || null, at: now() });
    if (id) {
      if (G.addItem(G.copyItem(id), 1)) loot(`You catch ${B.link(D.ITEMS[id].name, D.ITEMS[id].q)}.`); else info(`Bags full: the ${D.ITEMS[id].name} got away.`);
      const need = F.fish.need, p = G.profs().fishing; skillUp('fishing', G.skillColor(p.skill, [need, need + 25, need + 50, need + 100]));
      emit('lootGain', { items: 1, got: [D.ITEMS[id]] });
    } else sys(result === 'early' ? 'You pulled too soon. The fish swims off.' : 'It got away.');
    emit('fish', { phase: 'done', result, id }); emit('change');
  }
  function fishTick() {
    const P = G.S.player, F = P.fishing, t = now(); if (!F || F.phase === 'done') return;
    if (F.phase === 'wait' && t >= F.biteAt) {
      if (F.auto) { // auto: a common fish lands at the usual rate; a big or rare one is never hooked
        const T = D.FISH[D.waterTier(P.place)], c = F.fish.kind === 'common' ? F.fish : (() => { const cc = pick(T.common.filter((x) => x[1] <= G.profs().fishing.skill)); return { id: cc[0], kind: 'common', need: cc[1] }; })();
        P.fishing.fish = c; const land = Math.random() < G.FISH_TIME.autoLand; return fishDone(land ? 'caught' : 'lost', land ? c.id : null);
      }
      F.phase = 'bite'; F.biteEnd = t + G.fishFeel(F.fish.kind, F.tier).window * 1000; emit('fish', { phase: 'bite' });
    } else if (F.phase === 'bite' && t > F.biteEnd) fishDone('lost');
  }
  G.fishTick = fishTick;
  G.fishTap = function () {
    const P = G.S.player, F = P.fishing; if (!F || F.auto) return;
    if (F.phase === 'wait') return fishDone('early');
    if (F.phase !== 'bite') return;
    if (F.fish.kind === 'common') return fishDone('caught', F.fish.id);
    const fe = G.fishFeel(F.fish.kind, F.tier); F.phase = 'reel'; F.reel = { zone: 0.5, w: fe.zone, speed: fe.speed, drain: fe.drain, fish: 0.5, target: Math.random(), line: 0.3 };
    emit('fish', { phase: 'reel' });
  };
  G.fishReel = function (hold, dt) {
    const F = G.S.player.fishing; if (!F || F.phase !== 'reel') return null;
    const R = G.FISH_REEL, r = F.reel, sp = r.speed;
    r.zone = Math.max(r.w / 2, Math.min(1 - r.w / 2, r.zone + (hold ? R.rise : -R.fall) * dt));
    if (Math.abs(r.fish - r.target) < 0.03) r.target = Math.random(); // the fish darts somewhere new
    r.fish += Math.sign(r.target - r.fish) * Math.min(Math.abs(r.target - r.fish), sp * dt);
    const inside = Math.abs(r.fish - r.zone) <= r.w / 2;
    r.line = Math.max(0, Math.min(1, r.line + (inside ? R.fill : -r.drain) * dt));
    if (r.line >= 1) fishDone('caught', F.fish.id); else if (r.line <= 0) fishDone('lost');
    return inside;
  };
  G.fishStop = function () { const P = G.S.player; if (P.fishing && P.fishing.phase !== 'done') sys('You reel in your line.'); P.fishing = null; emit('fish', { phase: 'stop' }); };

  // --- using items: potions (combat too), elixirs, sharpening stones, armour kits, bags, recipes
  const POTION_CD = 120000;
  G.potionReady = () => (G.S.player.potionAt || 0) <= now();
  G.bestPotion = function (kind) {
    const P = G.S.player;
    return P.bags.filter((b) => b.item.slot === 'potion' && b.item[kind] && (b.item.lvl || 1) <= P.level).sort((a, c) => c.item[kind][1] - a.item[kind][1])[0];
  };
  // what a tap on the bar's Potion drinks (#279): in a fight, mana unless you're under 60% health or have none; else health first
  G.potionKind = () => (G.pUnit ? (G.pUnit.hp / G.pUnit.maxHp < 0.6 || !G.bestPotion('mana') ? null : 'mana') : null);
  // or the one potion the player picked for it (#296: long-press the button), saved per character; Auto when unset
  G.potionUsable = (it) => it.slot === 'potion' && (it.lvl || 1) <= G.S.player.level && (!!it.heal || D.CLASSES[G.S.player.cls].resource === 'mana');
  G.potionOptions = () => { const out = {}; for (const b of G.S.player.bags) if (G.potionUsable(b.item)) (out[b.item.id] ||= { item: b.item, n: 0 }).n += b.n; return Object.values(out); };
  G.potionChoice = () => { const P = G.S.player; if (!P.potionPick) return null; const b = P.bags.find((x) => x.item.id === P.potionPick && G.potionUsable(x.item)); if (!b) P.potionPick = null; return b || null; };
  G.setPotionPick = (id) => { G.S.player.potionPick = id || null; emit('change'); };
  G.potionNext = () => { const c = G.potionChoice(); if (c) return c; const k = G.potionKind(); return k ? G.bestPotion(k) : G.bestPotion('heal') || G.bestPotion('mana'); };
  G.pressPotion = () => { const c = G.potionChoice(); return c ? G.usePotion(null, c.item.id) : G.usePotion(G.potionKind()); };
  G.usePotion = function (kind, id) {
    const P = G.S.player;
    if (!G.potionReady()) return toast(`Potions are on cooldown (${Math.ceil(((P.potionAt || 0) - now()) / 1000)} sec).`);
    const b = id ? P.bags.find((x) => x.item.id === id && x.item.slot === 'potion') : kind ? G.bestPotion(kind) : (G.bestPotion('heal') || G.bestPotion('mana')); if (!b) return toast('You have no potions.');
    const it = b.item, isHeal = !!it.heal, amt = rint((it.heal || it.mana)[0], (it.heal || it.mana)[1]);
    if (!isHeal && D.CLASSES[P.cls].resource !== 'mana') return toast('You have no mana to restore.');
    G.removeItem(it.id, 1); P.potionAt = now() + POTION_CD;
    if (G.fight && G.pUnit) { const u = G.pUnit; if (isHeal) u.hp = Math.min(u.maxHp, u.hp + amt); else u.res = Math.min(u.maxRes, u.res + amt); }
    else { const v = G.vitals(); if (isHeal) P.hp = Math.min(v.maxHp, P.hp + amt); else P.res = Math.min(v.maxRes, P.res + amt); }
    emit(isHeal ? 'selfheal' : 'change', amt); sys(`${it.name}: +${amt} ${isHeal ? 'health' : 'mana'}.`);
    if (P.potionPick === it.id && !P.bags.some((x) => x.item.id === it.id)) { P.potionPick = null; toast(`Out of ${it.name}. Potion button: Auto.`); } // the picked one ran out (#296)
    emit('change');
  };
  G.usable = (it) => ['potion', 'elixir', 'stone', 'kit', 'bag', 'recipe', 'event'].includes(it.slot);
  G.useItem = function (idx) {
    const S = G.S, P = S.player, b = P.bags[idx]; if (!b) return;
    const it = b.item, t = now();
    if (it.slot === 'event') { if (G.fight) return toast('You are in combat.'); return D.ITEMS[it.id] && D.ITEMS[it.id].event === 'longnight' ? G.lnUse(idx) : G.lwUse(idx); } // a festival's toys
    if ((it.lvl || 1) > P.level) return toast(`Requires level ${it.lvl}.`);
    if (it.slot === 'potion') return G.usePotion(it.heal ? 'heal' : 'mana');
    if (G.fight) return toast('You are in combat.');
    if (it.slot === 'elixir') {
      P.auras = (P.auras || []).filter((a) => a.id !== 'elixir');
      // a flask (v10.9) is a stronger elixir: 2 hours, and it stays when you die
      P.auras.push(Object.assign({ id: 'elixir', name: it.name, icon: it.icon, stats: Object.assign({}, it.buff), until: t + (it.flask ? 7200000 : 3600000) }, it.flask ? { keep: true } : {}));
      G.removeItem(it.id, 1); sys(it.flask ? `You drink the ${it.name}. It lasts 2 hours and stays when you die.` : `You drink the ${it.name}. It lasts an hour.`);
    } else if (it.slot === 'stone') {
      if (!P.equip.weapon) return toast('You need a weapon.');
      P.auras = (P.auras || []).filter((a) => a.id !== 'sharpened');
      P.auras.push({ id: 'sharpened', name: it.name, icon: it.icon, stats: { wdmg: it.wdmg }, until: t + 1800000 });
      G.removeItem(it.id, 1); sys(`Your weapon is sharpened: +${it.wdmg} damage for 30 min.`);
    } else if (it.slot === 'kit') {
      const slot = ['chest', 'legs', 'feet', 'hands'].find((s) => P.equip[s] && !(P.equip[s].kit >= it.kit));
      if (!slot) return toast('All your chest, legs, feet and hands gear already has a kit this good.');
      const g = P.equip[slot]; g.armor = (g.armor || 0) - (g.kit || 0) + it.kit; g.kit = it.kit;
      G.removeItem(it.id, 1); sys(`${it.name} applied to ${g.name}: +${it.kit} armor.`);
    } else if (it.slot === 'bag') {
      P.bagsEq = P.bagsEq || [];
      if (P.bagsEq.length < D.BAG_SLOTS) { P.bagsEq.push(it); P.bags.splice(idx, 1); sys(`You equip the ${it.name} (+${it.bag} slots).`); }
      else {
        const same = P.bagsEq.filter((b) => !b.matBag === !it.matBag), small = (same.length ? same : P.bagsEq).slice().sort((a, c) => a.bag - c.bag)[0]; // a materials bag swaps for a materials bag first
        if (!!small.matBag === !!it.matBag && small.bag >= it.bag) return toast('Your bag slots are full of bags this big or bigger.');
        const eq2 = P.bagsEq.map((b) => (b === small ? it : b)), bags2 = P.bags.map((b, j) => (j === idx ? { item: small, n: 1 } : b));
        if (!bagsHold(bags2, eq2)) return toast('Empty some space first: your items would not fit.');
        P.bagsEq[P.bagsEq.indexOf(small)] = it; P.bags[idx] = { item: small, n: 1 }; sys(`You swap your ${small.name} for the ${it.name}.`);
      }
    } else if (it.slot === 'recipe') {
      const r = D.RECIPES[it.teaches], p = G.profs()[r.prof];
      if (!p) return toast(`Requires ${D.PROFESSIONS[r.prof].name}.`);
      if (p.skill < r.sk[0]) return toast(`Requires ${D.PROFESSIONS[r.prof].name} ${r.sk[0]}.`);
      p.known = p.known || []; if (p.known.includes(r.id)) return toast('You already know that.');
      p.known.push(r.id); G.removeItem(it.id, 1); loot(`You learn how to make ${B.link(D.ITEMS[r.makes].name, D.ITEMS[r.makes].q)}.`);
    }
    emit('change'); G.save();
  };
  G.unequipBag = function (i) {
    const P = G.S.player, bag = (P.bagsEq || [])[i]; if (!bag) return;
    if (!bagsHold(P.bags.concat([{ item: bag, n: 1 }]), P.bagsEq.filter((b, j) => j !== i))) return toast('Empty some space first: your items would not fit.');
    P.bagsEq.splice(i, 1); P.bags.push({ item: bag, n: 1 }); emit('change');
  };
  // ============================================================ Help Wanted, Mentor Marks, heirlooms, titles, Roulette (v2.3)
  // Account-wide: Mentor Marks and unlocked heirlooms are shared by every character on this phone.
  const ACCOUNT_KEY = 'azsolo.account';
  // Mentor Marks as counters (a player report: Marks spent came back at the next cloud sync, which took the higher of two
  // balances): mk = { base, earn: { device: n }, spend: { device: n } }, the balance base + earned - spent. base is the
  // balance the account had before counters; a device's counters only grow, so a merge takes each one's highest
  const DEVICE_KEY = 'azsolo.device';
  G.deviceId = () => { let d = ls.get(DEVICE_KEY); if (!d) { d = 'd' + Date.now().toString(36) + (typeof performance !== 'undefined' ? Math.floor(performance.now() * 1000).toString(36) : ''); /* no Math.random: seeded runs keep their dice */ ls.set(DEVICE_KEY, d); } return d; };
  const sumOf = (o) => Object.values(o || {}).reduce((s, n) => s + (+n || 0), 0);
  G.mkBalance = (mk) => Math.max(0, Math.round((+mk.base || 0) + sumOf(mk.earn) - sumOf(mk.spend)));
  G.mkOf = (a) => (a && a.mk && typeof a.mk === 'object' ? { base: +a.mk.base || 0, earn: Object.assign({}, a.mk.earn), spend: Object.assign({}, a.mk.spend) } : { base: Math.max(0, +(a && a.marks) || 0), earn: {}, spend: {} });
  G.account = function () { let a = null; try { a = JSON.parse(ls.get(ACCOUNT_KEY) || 'null'); } catch (e) { a = null; } a = Object.assign({ marks: 0, heirlooms: [] }, a || {}); a.mk = G.mkOf(a); a.marks = G.mkBalance(a.mk); return a; };
  // a change to a.marks since the account was read is this device's earning or spending
  G.saveAccount = (a) => {
    const mk = G.mkOf(a), d = Math.round((+a.marks || 0) - G.mkBalance(mk)), dev = G.deviceId();
    if (d > 0) mk.earn[dev] = (+mk.earn[dev] || 0) + d; else if (d < 0) mk.spend[dev] = (+mk.spend[dev] || 0) - d;
    a.mk = mk; a.marks = G.mkBalance(mk);
    return ls.set(ACCOUNT_KEY, JSON.stringify(a));
  };
  // cloud sync: the merged counters, written as they are (no earning or spending of this device's own)
  G.writeAccountMarks = (mk) => { const a = G.account(); a.mk = G.mkOf({ mk }); a.marks = G.mkBalance(a.mk); return ls.set(ACCOUNT_KEY, JSON.stringify(a)); };
  G.addMarks = function (n, why) { const a = G.account(); a.marks += n; G.saveAccount(a); loot(`+${n} Mentor Marks${why ? ' (' + why + ')' : ''}. You have ${a.marks}.`); };
  // Heirlooms: stats follow the wearer's level, so an alt can wear the same piece from 1 to the cap.
  G.HEIR_SHARE = 0.9; // #194: an heirloom's power as a share of a fitted green at your level
  G.makeHeirloom = function (id, level) {
    const H = D.HEIRLOOMS[id], L = Math.max(1, level);
    const it = { id, name: H.name, slot: H.slot, q: 5, lvl: 1, icon: H.icon, heirloom: true, sell: 0, stats: {} };
    // #194: a little under quest gear at every level: HEIR_SHARE of a fitted green's stat points (D.gearBudget), damage
    // and cloak armour, so a quest green is an upgrade and a blue a clear one; the +XP is the heirloom's value
    const SH = G.HEIR_SHARE, pts = Math.max(2, Math.round(SH * D.gearBudget(L, 2)));
    const sp = H.sp ? Math.min(Math.round(pts * 0.4), pts - 2) : 0, a = Math.max(1, Math.round((pts - sp) * 0.58));
    it.stats[H.stat[0]] = a; it.stats[H.stat[1]] = Math.max(1, pts - sp - a);
    if (sp) it.sp = sp;
    // the green damage curve (random gear at q2) at that share
    if (H.wtype) { it.wtype = H.wtype; it.speed = H.speed; const dps = (1.6 + L * 0.45) * 1.1 * SH * (H.wtype === 'staff' ? 1.35 : 1); it.dmg = [Math.max(1, Math.round(dps * H.speed * 0.7)), Math.max(2, Math.round(dps * H.speed * 1.3))]; }
    else if (H.slot === 'back') it.armor = Math.max(1, Math.round((D.SLOT_ARMOR.back || 3) * 0.3 * (L + 2) * 0.9 * 1.1 * SH));
    else if (H.atype) { it.atype = H.atype; it.armor = Math.max(1, Math.round((D.SLOT_ARMOR[H.slot] || 3) * D.GEAR_BASES[H.atype].arm * (L + 2) * 0.9 * 1.1 * SH)); } // armour heirlooms (#506)
    it.source = 'Grows with you. A little weaker than quest gear. +5% experience.';
    return it;
  };
  G.refreshHeirlooms = function () {
    const P = G.S.player;
    for (const s of Object.keys(P.equip || {})) { const it = P.equip[s]; if (it && it.heirloom) P.equip[s] = G.makeHeirloom(it.id, P.level); }
    for (const b of P.bags.concat(P.bank || [])) if (b.item && b.item.heirloom) b.item = G.makeHeirloom(b.item.id, P.level); // the bank too (#442)
  };
  G.heirloomXpBonus = function () { let n = 0; for (const s in (G.S.player.equip || {})) if (G.S.player.equip[s] && G.S.player.equip[s].heirloom) n++; return Math.min(3, n) * 5; };
  // ---- The Mentor Quartermaster's catalogue (#506): each raid set look (armour and weapons) in two colours, the Marks
  // mounts, and a weekly stock of QM_STOCK of them at QM_STOCK_OFF off, picked from the week and the catalogue so
  // every device agrees and nothing changes mid-week.
  G.qmLooks = function () {
    const seen = new Set(), out = [];
    for (const id of Object.keys(D.ITEMS).sort()) {
      const it = D.ITEMS[id], l = it.look; if (!l || seen.has(l[1]) || /_hard$/.test(l[1])) continue;
      const pre = l[1].split('_')[0], C = D.QM_COLOURS[pre]; if (!C) continue; seen.add(l[1]);
      C.forEach((c, i) => out.push({ id, place: l[0], key: l[1] + (i ? '_qb' : '_qa'), name: `${it.name} (${c[0]})`, icon: it.icon, q: it.q, cost: D.QM_LOOK_COST[l[0] === 'weapon' || l[0] === 'ranged' ? 'weapon' : 'armour'] }));
    }
    return out;
  };
  G.qmStock = function () {
    const pool = G.qmLooks().map((x) => 'look:' + x.place + ':' + x.key).concat(Object.keys(D.MOUNTS).filter((k) => D.MOUNTS[k].marks).map((k) => 'mount:' + k)).sort();
    const wk = weekKey(), seed = [...wk].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7), out = []; let i = 0; // B.hash takes a number: the week as one
    while (out.length < Math.min(D.QM_STOCK, pool.length) && i < 50) { const k = pool[Math.floor(B.hash(seed, 9100 + i) * pool.length)]; if (!out.includes(k)) out.push(k); i++; }
    return out;
  };
  G.qmPrice = (cost, ref) => (G.qmStock().includes(ref) ? Math.round(cost * (1 - D.QM_STOCK_OFF)) : cost);
  G.buyQmLook = function (place, key) {
    const L = G.qmLooks().find((x) => x.place === place && x.key === key); if (!L) return false;
    const a = G.account(), lk = place + ':' + key; a.looks = a.looks || [];
    if (a.looks.includes(lk)) { toast('You have this look.'); return false; }
    const c = G.qmPrice(L.cost, 'look:' + lk); if (a.marks < c) { toast(`You need ${c} Mentor Marks.`); return false; }
    a.marks -= c; a.looks.push(lk); G.saveAccount(a); loot(`New look: ${L.name}. It is in your wardrobe.`); emit('change'); G.save(); return true;
  };
  // ---- Renown (#504, docs/plans/2026-11-07-currency-sinks-design.md §4): an endless account rank bought with Marks and gold
  // together. Rank r costs RENOWN_MARKS and RENOWN_GOLD times (1 + r/10): a straight line, so the next rank always stays
  // in reach and keeps taking what is left over. Rewards are looks and status only: dye r, a title tier every 5, a mount
  // tint every 10, and the number on the player card.
  G.RENOWN_MARKS = 100; G.RENOWN_GOLD = 100000;
  G.renown = () => G.account().renown || 0;
  G.renownCost = (r) => { const f = 1 + r / 10; return { marks: Math.round(G.RENOWN_MARKS * f), gold: Math.round(G.RENOWN_GOLD * f) }; }; // r: the rank being bought
  G.mountTints = () => Math.floor(G.renown() / 10);
  G.buyRenown = function () {
    const a = G.account(), r = (a.renown || 0) + 1, c = G.renownCost(r), P = G.S.player;
    if (a.marks < c.marks) { toast(`You need ${c.marks} Mentor Marks.`); return false; }
    if (P.money < c.gold) { toast(`You need ${G.moneyText(c.gold)}.`); return false; }
    a.marks -= c.marks; P.money -= c.gold; a.renown = r; G.saveAccount(a);
    const got = [`dye: ${D.dye(r).name}`]; if (r % 5 === 0) got.push(`title tier: ${G.titleName(D.TITLES.find((t) => t.id === 'renowned'), P.name)}`); if (r % 10 === 0) got.push(`mount tint ${r / 10}`);
    loot(`Renown ${r}. New ${got.join(', ')}.`); emit('change'); G.save(); return true;
  };
  // a dye on one place of the wardrobe (0 or null: none); only palette-drawn looks take a dye
  G.dyeable = (key) => typeof key === 'string' && /^(vesh|mc|tc|lw|ln)_/.test(key) && !/_dy\d+$/.test(key);
  G.setDye = function (place, n) {
    const P = G.S.player; if (n && (n < 1 || n > G.renown())) return false;
    P.dyes = Object.assign({}, P.dyes); if (n) P.dyes[place] = n; else delete P.dyes[place]; G.save(); emit('change'); return true;
  };
  G.setMountTint = function (n) {
    const P = G.S.player;
    if (n === 'founder') { if (!G.isFounder()) return false; } else if (n && (n < 1 || n > G.mountTints())) return false;
    P.mountTint = n || 0; G.save(); emit('change'); return true;
  };
  // the CSS filter for the mount you ride: a Renown tint shifts the hue (#504), Founder gold has its own (#507)
  G.mountFilter = function (P) { const t = P && P.mountTint; if (!t) return ''; if (t === 'founder') return G.isFounder() ? D.FOUNDER.tint : ''; return `hue-rotate(${t * 36}deg)`; };
  // #507 Founders: a code typed in Settings. Only its SHA-256 is in the data, so the public repo never shows the code.
  const sha256 = (str) => {
    const K = [], H = [], isP = (n) => { for (let f = 2; f * f <= n; f++) if (n % f === 0) return false; return true; }, frac = (x) => ((x - Math.floor(x)) * 4294967296) >>> 0;
    for (let n = 2, i = 0; i < 64; n++) if (isP(n)) { if (i < 8) H[i] = frac(Math.pow(n, 1 / 2)); K[i++] = frac(Math.pow(n, 1 / 3)); }
    const b = unescape(encodeURIComponent(str)), w = [], L = b.length * 8;
    for (let i = 0; i < b.length; i++) w[i >> 2] |= b.charCodeAt(i) << ((3 - i % 4) * 8);
    w[L >> 5] |= 0x80 << (24 - L % 32); w[(((L + 64) >> 9) << 4) + 15] = L;
    const r = (x, n) => (x >>> n) | (x << (32 - n));
    for (let j = 0; j < w.length; j += 16) {
      const W = [], h = H.slice();
      for (let i = 0; i < 64; i++) {
        W[i] = i < 16 ? (w[j + i] | 0) : (((r(W[i - 2], 17) ^ r(W[i - 2], 19) ^ (W[i - 2] >>> 10)) + W[i - 7] + (r(W[i - 15], 7) ^ r(W[i - 15], 18) ^ (W[i - 15] >>> 3)) + W[i - 16]) | 0);
        const t1 = (h[7] + (r(h[4], 6) ^ r(h[4], 11) ^ r(h[4], 25)) + ((h[4] & h[5]) ^ (~h[4] & h[6])) + K[i] + W[i]) | 0;
        const t2 = ((r(h[0], 2) ^ r(h[0], 13) ^ r(h[0], 22)) + ((h[0] & h[1]) ^ (h[0] & h[2]) ^ (h[1] & h[2]))) | 0;
        h.unshift((t1 + t2) | 0); h[4] = (h[4] + t1) | 0; h.pop();
      }
      for (let i = 0; i < 8; i++) H[i] = (H[i] + h[i]) | 0;
    }
    return H.map((x) => (x >>> 0).toString(16).padStart(8, '0')).join('');
  };
  G.sha256 = sha256;
  G.isFounder = () => !!G.account().founder;
  G.claimCode = function (code) {
    const k = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!k) return false;
    if (sha256('ROL:' + k) !== D.FOUNDER.hash) { toast('That code doesn\'t work.'); return false; }
    if (G.isFounder()) { toast('Founder is already on this account.'); return true; }
    const a = G.account(); a.founder = 1; G.saveAccount(a);
    loot('Founder unlocked: the title "the Founder" and the Founder gold mount tint, on every character.'); emit('change'); G.save(); return true;
  };
  G.buyHeirloom = function (id) {
    const a = G.account(), H = D.HEIRLOOMS[id]; if (!H) return;
    const owned = a.heirlooms.includes(id);
    if (G.bagsFull()) return toast('Bags are full.'); // before any Marks are taken, so a full bag costs nothing (#87)
    if (!owned) { if (a.marks < H.cost) return toast(`You need ${H.cost} Mentor Marks.`); a.marks -= H.cost; a.heirlooms.push(id); G.saveAccount(a); }
    G.addItem(G.makeHeirloom(id, G.S.player.level), 1);
    loot(owned ? `You take a copy of ${B.link(H.name, 5)}.` : `You bought ${B.link(H.name, 5)} for ${H.cost} Mentor Marks. Every character can take a copy.`);
    emit('change');
  };
  // ---- the wardrobe (v10.3): looks are account-wide (account.looks, 'place:artKey'); each character picks what shows
  // in P.wardrobe ({ place: artKey | 'hidden' }; no entry = the worn item's look). Design: docs/plans/2026-09-30-wardrobe-design.md
  G.WARDROBE_PLACES = ['weapon', 'ranged', 'chest', 'legs', 'back'];
  const lookOf = (it) => it && (it.look || ((D.ITEMS[it.id] || {}).look));
  let lookItems = null;
  G.lookItem = function (place, key) { // an item that has this look, for its name, icon and the class rules
    if (!lookItems) { lookItems = {}; for (const id in D.ITEMS) { const l = D.ITEMS[id].look; if (l && !lookItems[l[0] + ':' + l[1]]) lookItems[l[0] + ':' + l[1]] = D.ITEMS[id]; } }
    const hk = /_hard$/.test(key) && lookItems[place + ':' + key.slice(0, -5)];
    if (!lookItems[place + ':' + key] && !hk && /_q[ab]$/.test(key)) { const Q = G.qmLooks().find((x) => x.place === place && x.key === key); if (Q) return Object.assign({}, D.ITEMS[Q.id], { name: Q.name, look: [place, key] }); } // the Quartermaster's colours (#506)
    return lookItems[place + ':' + key] || (hk ? Object.assign({}, hk, { name: hk.name + ' (Hard)', look: [place, key] }) : null);
  };
  // raid pieces with a look also have a Hard recolour (dropped on Hard); the collection log lists both
  let hardLookIds = null;
  G.hardLookIds = function () {
    if (!hardLookIds) { hardLookIds = new Set(); for (const k in D.DUNGEONS) { const Dg = D.DUNGEONS[k]; if (!Dg.hard) continue; for (const p of Dg.pulls) for (const m of p.mobs) for (const id of (D.MOBS[m].loot || [])) if (D.ITEMS[id].look) hardLookIds.add(id); } }
    return hardLookIds;
  };
  G.collectLook = function (it) {
    const l = lookOf(it); if (!l) return false;
    const a = G.account(), k = l[0] + ':' + l[1]; a.looks = a.looks || [];
    if (a.looks.includes(k)) return false;
    a.looks.push(k); G.saveAccount(a); emit('collected', { item: it }); return true;
  };
  // the first open collects every look already on this device's characters: worn, in bags, in the bank
  G.seedWardrobe = function () {
    const a = G.account(); if (a.lookSeed) return;
    a.looks = a.looks || [];
    for (const c of G.characters()) {
      const S = G.S && c.id === G.S.id ? G.S : G.readSave(c.id), P = S && S.player; if (!P) continue;
      for (const it of Object.values(P.equip || {}).concat((P.bags || []).map((b) => b.item), (P.bank || []).map((b) => b.item))) {
        const l = lookOf(it); if (l && !a.looks.includes(l[0] + ':' + l[1])) a.looks.push(l[0] + ':' + l[1]);
      }
    }
    a.lookSeed = 1; G.saveAccount(a);
  };
  // what this character can show in one place: owned looks its class could wear, plus finished Legends' keepsakes
  G.wardrobeOptions = function (place) {
    const P = G.S.player, out = [];
    for (const k of G.account().looks || []) {
      const i = k.indexOf(':'), pl = k.slice(0, i), key = k.slice(i + 1); if (pl !== place) continue;
      const it = G.lookItem(pl, key); if (it && G.canUseItem(it, P.cls) && (!it.faction || it.faction === G.myFaction())) out.push({ key, name: it.name, icon: it.icon, q: it.q });
    }
    if (place === 'back') for (const lk in D.LEGENDS || {}) { const L = D.LEGENDS[lk]; if (L.keepsake && G.legendUnlocked(lk)) out.push({ key: L.keepsake.look, name: L.keepsake.name, icon: L.keepsake.icon, q: 5, keepsake: lk }); }
    return out;
  };
  // every look this class could show in one place, collected or not (the wardrobe's collection log), sorted by level.
  // Keepsakes appear only once earned, so a Legend's name never shows before their story does.
  G.wardrobeAll = function (place) {
    const P = G.S.player, have = new Set((G.account().looks || []).filter((k) => k.startsWith(place + ':')).map((k) => k.slice(place.length + 1))), seen = new Set(), out = [];
    for (const id in D.ITEMS) {
      const it = D.ITEMS[id], l = it.look; if (!l || l[0] !== place || seen.has(l[1]) || !G.canUseItem(it, P.cls) || (it.faction && it.faction !== G.myFaction())) continue; // a faction's rank looks only for its own characters (#57)
      const tw = G.account().trialsworn || {}, mo = it.month != null ? root.TRIALS && root.TRIALS.name(it.month) : null;
      const src = mo && have.has(l[1]) ? ((tw.earned || []).includes(it.month) ? `Earned in ${mo}` : 'Bought with Mentor Marks') : mo && root.TRIALS && it.month < root.TRIALS.season(new Date()) ? `${it.source}, or ${G.MONTH_CLOAK_COST} Mentor Marks at the Mentor Quartermaster now` : it.source || null;
      seen.add(l[1]); { const lb = G.lookLabel(it.name, src, P.level, have.has(l[1])); out.push({ key: l[1], name: lb.name, icon: it.icon, q: it.q, lvl: it.lvl || 1, source: lb.source, have: have.has(l[1]), hidden: lb.hidden }); }
      if (G.hardLookIds().has(id)) { const hv = have.has(l[1] + '_hard'), lb = G.lookLabel(it.name + ' (Hard)', 'Drops on Hard', P.level, hv); out.push({ key: l[1] + '_hard', name: lb.name, icon: it.icon, q: it.q, lvl: (it.lvl || 1) + 0.5, source: lb.source, have: hv, hidden: lb.hidden }); }
    }
    for (const Q of G.qmLooks()) { // the Quartermaster's colours (#506), once the class could show the set's look
      const it = D.ITEMS[Q.id]; if (Q.place !== place || !G.canUseItem(it, P.cls) || (it.faction && it.faction !== G.myFaction())) continue;
      const lb = G.lookLabel(Q.name, `Mentor Quartermaster: ${Q.cost} Mentor Marks`, P.level, have.has(Q.key)); // a name beyond your level stays hidden (lorekeeper)
      out.push({ key: Q.key, name: lb.name, icon: Q.icon, q: Q.q, lvl: (it.lvl || 60) + 0.5, source: lb.source, have: have.has(Q.key), hidden: lb.hidden });
    }
    out.sort((a, b) => a.lvl - b.lvl || a.name.localeCompare(b.name));
    for (const o of G.wardrobeOptions(place)) if (o.keepsake) out.push(Object.assign({ lvl: 60, have: true, source: 'A Legend\'s keepsake' }, o));
    return out;
  };
  G.setWardrobe = function (place, key) { // key: an artKey, 'hidden', or null for the worn item's look
    const P = G.S.player; if (!G.WARDROBE_PLACES.includes(place)) return false;
    if (key === 'hidden' && place !== 'back' && place !== 'ranged') return false;
    if (key && key !== 'hidden' && !G.wardrobeOptions(place).some((o) => o.key === key)) return false;
    P.wardrobe = Object.assign({}, P.wardrobe); if (key) P.wardrobe[place] = key; else delete P.wardrobe[place];
    G.save(); emit('change'); return true;
  };
  // ---- gear upgrades (v10.3): it.up is the step, it.base the item as it dropped; stats are rewritten from it.base
  G.itemPoints = (it) => { let n = (it && it.sp) || 0; for (const k in ((it && it.stats) || {})) n += it.stats[k]; return n; };
  // The ceiling for an item is its own family's piece in the ceiling raid (same slot, weapon or armour type, and caster
  // or not), since a staff and a dagger, or a spell-power robe and a leather tunic, carry very different totals. A family
  // the ceiling raid lacks takes its best level-57+ piece from any dungeon or raid, raised by the ceiling raid's lead.
  const upKey = (it) => `${it.slot}|${it.wtype || it.atype || ''}|${it.sp ? 'c' : ''}`;
  let upRef = null;
  G.upgradeRef = function (it) {
    if (!upRef) {
      const U = D.UPGRADE, avg = (a) => a.reduce((x, y) => x + y, 0) / a.length, lootOf = (dk) => { const s = new Set(); for (const p of D.DUNGEONS[dk].pulls) for (const m of p.mobs) for (const id of (D.MOBS[m].loot || [])) if (D.ITEMS[id]) s.add(id); return [...s].map((id) => D.ITEMS[id]); };
      const top = {}, best = {};
      for (const x of lootOf(U.raid)) if (!x.effect) (top[upKey(x)] = top[upKey(x)] || []).push(G.itemPoints(x)); // effect items pay stats for their effect: never a family's ceiling
      for (const dk in D.DUNGEONS) if (dk !== U.raid) for (const x of lootOf(dk)) if (!x.effect && (x.lvl || 0) >= U.minLvl && U.cap[x.q]) { const k = upKey(x); best[k] = Math.max(best[k] || 0, G.itemPoints(x)); }
      const lead = avg(Object.keys(best).filter((k) => top[k] && best[k] > 0).map((k) => avg(top[k]) / best[k]));
      upRef = {}; for (const k in best) upRef[k] = top[k] ? avg(top[k]) : best[k] * lead; for (const k in top) upRef[k] = avg(top[k]);
      upRef['*lead'] = lead;
      // a family's weapon damage per second and armour (#581): the ceiling raid's average, or with no raid piece the best
      // level-57+ piece elsewhere raised by the raid's lead in that value (as the power ceiling does). Item power counts stats only, so these are carried on their own
      const dps = (x) => (x.dmg && x.speed ? (x.dmg[0] + x.dmg[1]) / 2 / x.speed : 0), vals = { dps, armor: (x) => x.armor || 0 };
      for (const [v, fn] of Object.entries(vals)) {
        const t = {}, b = {}; upRef['*' + v] = {};
        for (const x of lootOf(U.raid)) if (!x.effect && fn(x) > 0) (t[upKey(x)] = t[upKey(x)] || []).push(fn(x));
        for (const dk in D.DUNGEONS) if (dk !== U.raid) for (const x of lootOf(dk)) if (!x.effect && (x.lvl || 0) >= U.minLvl && U.cap[x.q] && fn(x) > 0) b[upKey(x)] = Math.max(b[upKey(x)] || 0, fn(x));
        const ks = Object.keys(b).filter((k) => t[k] && b[k] > 0), ld = ks.length ? avg(ks.map((k) => avg(t[k]) / b[k])) : lead; // the raid's lead in this value
        for (const k in b) upRef['*' + v][k] = b[k] * ld; for (const k in t) upRef['*' + v][k] = avg(t[k]);
      }
      // where a plain level-57+ drop of each quality starts, as a share of its ceiling (the median), for effect items below
      const share = {}; for (const dk in D.DUNGEONS) for (const x of lootOf(dk)) if (!x.effect && (x.lvl || 0) >= U.minLvl && U.cap[x.q] && upRef[upKey(x)]) (share[x.q] = share[x.q] || []).push(G.itemPoints(x) / upRef[upKey(x)]);
      upRef['*start'] = {}; for (const q in share) { const a = share[q].sort((x, y) => x - y); upRef['*start'][q] = Math.min(U.cap[q] * 0.97, a[a.length >> 1]); }
    }
    const base = upRef[upKey(it)] || G.itemPoints(it.base || it) * upRef['*lead']; // a family seen nowhere: its own power, raised by the lead
    if (!(it.effect && D.EFFECTS && D.EFFECTS[it.effect])) return base;
    // an effect item's ceiling pays the same share as its drop did, and it is never below where its drop sits for a plain
    // drop of its quality: a family with no plain item near it (Cinderhide Bracers started at 130%) still has room (#22)
    const st = upRef['*start'][it.q] || 0.9;
    return Math.max(base * (1 - D.effectCost(it.effect)), G.itemPoints(upBase(it)) / st);
  };
  G.upgradeRef.reset = () => { upRef = null; }; // when D.UPGRADE.raid moves (sims)
  const upBase = (it) => it.base || { stats: Object.assign({}, it.stats), armor: it.armor && it.armor - (it.kit || 0), sp: it.sp, dmg: it.dmg && it.dmg.slice() }; // a kit's armour is not part of the base (#406)
  // An upgraded item stores the power it reached (it.pw, in stat points), not a step count, so a new ceiling raid never
  // changes an item on its own, and the label is a percentage of the ceiling that never grows past 100.
  // ---- Repairs (#502, docs/plans/2026-11-07-currency-sinks-design.md §1): each death takes DUR_LOSS% durability from every
  // worn piece that has it (not rings or cloaks); a party wipe is your death. At 0% a piece is broken and gives nothing
  // until it is repaired for gold. A full repair costs REPAIR_K x item level x the quality's factor, so raid gear costs the
  // most; REPAIR_K is tuned by sim/economy.js to about 20% of an average level-60 player's gold income.
  G.REPAIR_K = 80; G.DUR_LOSS = 10; G.KIT_MULT = 1.25;
  const REPAIR_Q = [0.5, 0.75, 1, 1.5, 2.5, 1.5]; // poor .. epic, heirloom as blue
  G.hasDur = (it, slot) => !!it && !it.lookOnly && D.GEAR_SLOTS.includes(slot || it.slot) && !['finger', 'back'].includes(slot || it.slot);
  G.durOf = (it) => (it && it.dur != null ? it.dur : 100);
  G.repairCost = (it) => (G.hasDur(it) ? Math.round(((100 - G.durOf(it)) / 100) * G.REPAIR_K * Math.max(1, it.lvl || 1) * (REPAIR_Q[it.q || 0] || 1)) : 0);
  G.repairAllCost = (kit) => { let c = 0; const E2 = G.S.player.equip || {}; for (const s in E2) c += G.repairCost(E2[s]); return Math.round(c * (kit ? G.KIT_MULT : 1)); };
  // what's worn, at a glance (#551): the lowest durability among worn pieces that wear, and how many are broken
  G.gearCondition = function () {
    const E2 = G.S.player.equip || {}; let low = 100, broken = 0;
    for (const s in E2) { const it = E2[s]; if (!G.hasDur(it, s)) continue; const d = G.durOf(it); low = Math.min(low, d); if (d <= 0) broken++; }
    return { low, broken, cost: G.repairAllCost(false) };
  };
  G.wear = function () {
    const P = G.S.player, broke = [], low = []; if (!P || P.level < 10 || !(root.document || root.WEAR_ON)) return; // nothing wears before level 10; Node sims measure repaired gear unless they set WEAR_ON (the tests and sim/economy.js do)
    for (const s in (P.equip || {})) {
      const it = P.equip[s]; if (!G.hasDur(it, s) || G.durOf(it) <= 0) continue;
      const was = G.durOf(it); it.dur = Math.max(0, was - G.DUR_LOSS);
      if (!it.dur) broke.push(it.name); else if (was > 20 && it.dur <= 20) low.push(it.name);
    }
    if (broke.length) { toast(`Broken: ${broke.join(', ')}. Repair at a vendor.`); sys(`Broken: ${broke.join(', ')}. A broken item gives no stats until it is repaired.`); }
    else if (low.length) sys(`Damaged: ${low.join(', ')} (20% durability or less). Repair at a vendor.`);
  };
  G.repairAll = function (kit) {
    const P = G.S.player, cost = G.repairAllCost(kit);
    if (!cost) { toast('Nothing to repair.'); return false; }
    if (kit && !G.S.run) { toast('A repair kit is for inside a dungeon. Repair at a vendor.'); return false; }
    if (P.money < cost) { toast(`You need ${G.moneyText(cost)}.`); return false; }
    P.money -= cost; for (const s in (P.equip || {})) if (G.hasDur(P.equip[s], s)) P.equip[s].dur = 100;
    sys(`Repaired${kit ? ' with a kit' : ''} for ${G.moneyText(cost)}.`); emit('change'); G.save(); return true;
  };
  // ---- Reforge (#503, docs/plans/2026-11-07-currency-sinks-design.md §3): Mentor Marks reroll a level-57+ blue or purple's
  // effect (another effect for your role, its stats re-priced by the effects' own costs) or its stats (new stat pair, the
  // same total). You see the result and Keep or Revert it; the Marks are spent either way. Each reforge of an item costs
  // REFORGE_GROW times the last, so chasing the perfect roll never runs out. No power is added: totals stay the same.
  G.REFORGE_BASE = 20; G.REFORGE_GROW = 1.5;
  const RF_STATS = ['str', 'agi', 'sta', 'int', 'spi'];
  G.reforgeStats = (cls) => { const C = D.CLASSES[cls || G.S.player.cls]; return RF_STATS.filter((k) => C.gain[k] >= 0.8); }; // the stats a class grows in (0.8+ a level) are the ones it uses
  const RF_ROLES = { tank: ['tank', 'survival', 'resource'], healer: ['healing', 'survival', 'resource'], dps: ['damage', 'survival', 'resource'] };
  G.reforgeCost = (it) => Math.round(G.REFORGE_BASE * Math.pow(G.REFORGE_GROW, (it && it.reforges) || 0));
  G.canReforge = (it, kind) => !!it && !it.heirloom && !it.lookOnly && D.GEAR_SLOTS.includes(it.slot) && (it.q || 0) >= 3 && (it.lvl || 0) >= D.UPGRADE.minLvl
    && (kind === 'effect' ? !!G.effectOf(it) : Object.keys(it.stats || {}).length > 0);
  const rfSum = (st) => Object.values(st || {}).reduce((a, b) => a + b, 0);
  const rfSpread = (total, keys) => { const o = {}; let left = total; keys.forEach((k, i) => { const v = i === keys.length - 1 ? Math.max(1, left) : Math.max(1, Math.round(total / keys.length)); o[k] = v; left -= v; }); return o; };
  const rfScale = (st, f) => { const o = {}; for (const k in st || {}) o[k] = Math.max(1, Math.round(st[k] * f)); return o; };
  G.reforgeEffects = (it) => { const roles = RF_ROLES[G.role()] || RF_ROLES.dps, ks = Object.keys(D.EFFECTS).filter((k) => k !== it.effect); const fit = ks.filter((k) => roles.includes(D.EFFECTS[k].role)); return fit.length ? fit : ks; };
  G.reforged = function (it, kind, pickFn) {
    const nx = JSON.parse(JSON.stringify(it)), pk = pickFn || ((a) => a[Math.floor(Math.random() * a.length)]);
    if (kind === 'effect') {
      const k = pk(G.reforgeEffects(it)), f = (1 - D.effectCost(k)) / Math.max(0.05, 1 - D.effectCost(it.effect));
      nx.effect = k; nx.stats = rfScale(it.stats, f); if (nx.base) nx.base.stats = rfScale(it.base.stats, f); if (nx.pw) nx.pw = Math.round(it.pw * f * 100) / 100;
    } else {
      const cur = Object.keys(it.stats || {}), n = Math.max(1, Math.min(2, cur.length)); let keys;
      for (let i = 0; i < 20; i++) { const pool = G.reforgeStats(); keys = []; while (keys.length < n) { const k = pk(pool); keys.push(k); pool.splice(pool.indexOf(k), 1); } if (keys.slice().sort().join() !== cur.slice().sort().join()) break; }
      nx.stats = rfSpread(rfSum(it.stats), keys); if (nx.base) nx.base.stats = rfSpread(rfSum(it.base.stats), keys);
    }
    nx.reforges = (it.reforges || 0) + 1; return nx;
  };
  const rfAt = (where) => { const P = G.S.player; return where.slot ? P.equip[where.slot] : (P.bags[where.bag] || {}).item; };
  const rfPut = (where, it) => { const P = G.S.player; if (where.slot) P.equip[where.slot] = it; else P.bags[where.bag].item = it; };
  G.reforge = function (where, kind) {
    const it = rfAt(where); if (!G.canReforge(it, kind)) return null;
    if (G.fight) { toast('You are in combat.'); return null; }
    const cost = G.reforgeCost(it), a = G.account();
    if (a.marks < cost) { toast(`You need ${cost} Mentor Marks.`); return null; }
    a.marks -= cost; G.saveAccount(a);
    const nx = G.reforged(it, kind), old = JSON.parse(JSON.stringify(it)); old.reforges = nx.reforges; // a revert keeps the count: the Marks are spent
    rfPut(where, nx); G.S.reforge = { where, old, kind };
    sys(`Reforged ${it.name} for ${cost} Mentor Marks.`); emit('change'); G.save(); return { old, next: nx, cost };
  };
  G.reforgeKeep = function () { if (!G.S.reforge) return; delete G.S.reforge; G.save(); emit('change'); };
  G.reforgeRevert = function () {
    const r = G.S.reforge; if (!r) return false; delete G.S.reforge;
    const cur = rfAt(r.where); if (!cur || cur.id !== r.old.id) { G.save(); return false; } // the item moved: keep what it has
    rfPut(r.where, r.old); sys(`${r.old.name}: back to how it was.`); emit('change'); G.save(); return true;
  };
  G.upgradeInfo = function (it) {
    const U = D.UPGRADE, none = { ok: false, room: false, cost: 0 };
    if (!it || it.heirloom || !D.GEAR_SLOTS.includes(it.slot) || !U.cap[it.q] || (it.lvl || 0) < U.minLvl) return none;
    const ref = G.upgradeRef(it), p0 = G.itemPoints(upBase(it)); if (p0 <= 0) return none;
    const capPts = U.cap[it.q] * ref, pts = it.pw || p0, st = U.step * ref, room = capPts - pts > 0.01;
    const next = capPts - (pts + st) < st / 2 ? capPts : pts + st; // less than half a step left: go straight to the ceiling
    const pc = (x) => Math.round((x / ref) * 100);
    return { ok: true, room, pts, next, pct: pc(pts), nextPct: pc(next), capPct: Math.round(U.cap[it.q] * 100), cost: room ? Math.max(1, Math.round(((next - pts) / ref) * 100 * U.perPct)) : 0 };
  };
  // the item at a given power (stat points); its own power or less gives back the item as it dropped
  G.FX_SCALE_CAP = 1.5;
  // an item as it should be today (#581): an upgraded one rebuilt from its drop at the power it bought, a Hard copy at its
  // 2 steps past the ceiling. The same item again gives the same result
  G.regearItem = function (x) {
    if (!x || !D.GEAR_SLOTS.includes(x.slot)) return x;
    if (x.hard && G.upgradeInfo(x).ok) { /* never under the power its steps bought (#587) */
      const pw = Math.max(G.itemPoints(upBase(x)) + G.HARD_STEPS * D.UPGRADE.step * G.upgradeRef(x), x.pw || 0);
      return Object.assign(G.upgradedCopy(x, pw, true), { hard: true });
    }
    if (x.base && x.pw) return G.upgradedCopy(x, x.pw);
    return x;
  };
  // over: a Hard copy, which goes past the quality's ceiling (#581)
  G.upgradedCopy = function (it, pw, over) {
    const b = upBase(it), p0 = G.itemPoints(b), inf = G.upgradeInfo(it), out = JSON.parse(JSON.stringify(it));
    const ref = inf.ok ? G.upgradeRef(it) : p0, capPts = inf.ok ? D.UPGRADE.cap[it.q] * ref : p0;
    if (!over) pw = Math.min(pw, Math.max(capPts, it.pw || 0));
    const kit = it.kit || 0; // an armour kit sits on top of the upgraded armour (#406)
    if (!inf.ok || pw <= p0 + 1e-9) { if (it.base) { Object.assign(out, JSON.parse(JSON.stringify(b))); delete out.base; delete out.pw; delete out.fxScale; if (b.armor) out.armor = b.armor + kit; if (kit) out.kit = kit; } return out; }
    const f = pw / p0;
    if (G.effectOf(it)) out.fxScale = Math.round(Math.min(G.FX_SCALE_CAP, f) * 100) / 100; // an item effect grows with each step, as the stats do (v10.10), up to the cap the engine uses
    out.base = JSON.parse(JSON.stringify(b)); out.pw = Math.round(pw * 100) / 100;
    out.stats = {}; for (const k in b.stats || {}) out.stats[k] = Math.round(b.stats[k] * f);
    if (b.sp) out.sp = Math.round(b.sp * f);
    // damage per second and armour (#581): an item below its family's raid piece moves toward that piece's value by the
    // same share of the way its stats moved, so at its ceiling it sits just under the raid piece and never passes it;
    // a raid piece (already at the ceiling) grows with its stats, so a Hard copy is stronger by its 2 steps
    const t = ref - p0 > 1 ? (pw - p0) / (ref - p0) : null, key = upKey(it);
    const grow = (v0, v) => { const rv = upRef && upRef['*' + v] && upRef['*' + v][key]; return t != null && rv ? v0 + Math.max(0, rv - v0) * Math.min(1, t) : v0 * f; };
    if (b.armor) out.armor = Math.round(grow(b.armor, 'armor')) + kit;
    if (b.dmg && it.speed) { const d0 = (b.dmg[0] + b.dmg[1]) / 2 / it.speed, g = grow(d0, 'dps') / d0; out.dmg = [Math.round(b.dmg[0] * g), Math.round(b.dmg[1] * g)]; }
    else if (b.dmg) out.dmg = [Math.round(b.dmg[0] * f), Math.round(b.dmg[1] * f)];
    return out;
  };
  // where = { slot } for an equipped item or { bag } for a bag index. Returns true when a step was bought.
  G.upgradeItem = function (where) {
    const P = G.S.player, it = where.slot ? P.equip[where.slot] : (P.bags[where.bag] || {}).item;
    if (!it) return false;
    if (G.fight) { toast('You are in combat.'); return false; }
    const inf = G.upgradeInfo(it);
    if (!inf.room) { toast('Already at max power.'); return false; }
    const a = G.account();
    if (a.marks < inf.cost) { toast(`You need ${inf.cost} Mentor Marks.`); return false; }
    a.marks -= inf.cost; G.saveAccount(a);
    const next = G.upgradedCopy(it, inf.next);
    if (where.slot) P.equip[where.slot] = next; else P.bags[where.bag].item = next;
    loot(`${B.link(next.name, next.q)} is now at ${inf.nextPct}% of newest raid gear (${inf.cost} Mentor Marks).`);
    G.save(); emit('change');
    return true;
  };
  // Titles
  // The pre-patch campaign (#508): open once the character has finished The Drowned Crown (its quest, either faction's)
  // or cleared any level-60 raid. Below that, the pre-patch is its event and activities only.
  G.PREPATCH_STORY = ['tc_crown_a', 'tc_crown_h'];
  G.prepatchOpen = function () {
    const P = G.S && G.S.player; if (!P || P.level < 60) return false;
    if (G.PREPATCH_STORY.some((q) => P.done && P.done[q])) return true;
    const r = G.records();
    return Object.keys(D.DUNGEONS).some((k) => D.DUNGEONS[k].raid && r.clears[k] && r.clears[k].clears);
  };
  // Crestbearer (#565): the newest raid cleared on Hard while it is the newest. Kept once earned (P.crest, by activity);
  // a Hard clear from before this existed counts while that raid is still the newest. record: write a new one down
  G.crests = function (record) {
    const P = G.S.player, n = root.SOC && SOC.newestRaid(), have = Object.keys(P.crest || {});
    if (n && n.act && ((P.codex || {})[n.act] || {}).hard && !have.includes(n.act)) { (P.crest = P.crest || {})[n.act] = Date.now(); return Object.keys(P.crest); } // earned is kept, even when only read (#570): a Hard clear from before the title existed stays once a newer raid opens
    return have;
  };
  G.records = function () {
    const P = G.S.player, cx = P.codex || {}; const pv = G.pvpStats();
    let flawless = 0, speed = 0; for (const k in cx) { flawless += cx[k].flawless || 0; speed += cx[k].speed || 0; }
    const craft = Math.max(0, ...Object.entries(P.prof || {}).filter(([k]) => D.PROFESSIONS[k] && D.PROFESSIONS[k].kind === 'craft').map(([, p]) => p.skill));
    return { mentor: P.mentorRuns || 0, flawless, speed, honor: pv.honor, kills: pv.kills, clears: cx, craft, riding: P.riding ? 1 : 0, brawl: (P.brawl || {}).champs || 0, trophies: G.trophyCount() };
  };
  G.titleUnlocked = function (t) {
    const r = G.records(), n = t.need;
    if (n.clear) return !!(r.clears[n.clear] && r.clears[n.clear].clears);
    if (n.hard) return !!(r.clears[n.hard] && r.clears[n.hard].hard); // a whole raid cleared on Hard (v10.7)
    if (n.quest) return !!G.S.player.done[n.quest];
    if (n.event) return G.lwRec().owned.includes(n.event) || G.lnRec().owned.includes(n.event); // from a festival (v10.13)
    if (n.prof) return ((G.S.player.prof || {})[n.prof] || {}).skill >= 300 || !!(G.S.player.artisan || {})[n.prof]; // Artisan (v10.9): 300 in that skill, now or before it was unlearned (#145)
    if (n.guildRank != null) return Math.max(G.S.player.guildRankBest || 0, root.SOC ? SOC.rank() : -1) >= n.guildRank; // earned once, kept after leaving (#448)
    if (n.trial) return ((G.S.player.trials || {}).bestEver || 0) >= n.trial; // Trials (v10.4): best level beaten in time
    if (n.trialRank) { const r = (G.S.player.trials || {}).bestRank; return !!r && r <= n.trialRank; } // a month's final realm rank
    if (n.renown) return G.renown() >= n.renown; // #504
    if (n.founder) return G.isFounder(); // #507
    if (n.debtBreaker) return !!G.account().debtBreaker; // #523
    if (n.crest) return G.crests().length >= n.crest; // #565
    return Object.keys(n).every((k) => (r[k] || 0) >= n[k]);
  };
  const ROMAN = (n) => { let o = '', x = n; for (const [v, r] of [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]) while (x >= v) { o += r; x -= v; } return o; };
  G.titleName = function (t, name) { const horde = (D.RACES[G.S.player.race] || {}).faction === 'horde'; return (horde && t.horde ? t.horde : t.name).replace('%s', name) + (t.id === 'renowned' && G.renown() >= 10 ? ' ' + ROMAN(Math.floor(G.renown() / 5)) : ''); }; // Renown's tier: one more every 5 ranks (#504)
  G.setTitle = function (id) { const t = D.TITLES.find((x) => x.id === id); if (id && (!t || !G.titleUnlocked(t))) return; G.S.player.title = id || null; emit('change'); G.save(); };
  G.displayName = function () { const P = G.S.player, t = P.title && D.TITLES.find((x) => x.id === P.title); return t ? G.titleName(t, P.name) : P.name; };
  // Help Wanted: bot groups ask for a helper in the group finder. The group summons you, so you can
  // answer from anywhere. You are synced to the dungeon and may join mid-run.
  const HW_GAP = [8 * 60000, 18 * 60000], HW_LIFE = 12 * 60000;
  G.helpWantedFor = function (act) {
    const P = G.S.player, A = D.ACTIVITIES[act], cx = (P.codex || {})[act];
    return !!(A.dungeon && P.level >= A.minLvl && (P.level >= A.maxLvl || (cx && cx.clears)));
  };
  function helpWantedTick() {
    const S = G.S, P = S.player, f = S.flags, t = now();
    S.helpWanted = (S.helpWanted || []).filter((r) => r.expires > t);
    if ((f.nextHelpWanted || 0) > t) return;
    f.nextHelpWanted = t + rnd(HW_GAP[0], HW_GAP[1]);
    const storm = (k) => D.ACTIVITIES[k].where && G.stormBlocks(D.ACTIVITIES[k].where); // the storm hides it, as from the Roulette (#477)
    const acts = Object.keys(D.ACTIVITIES).filter((k) => G.helpWantedFor(k) && G.activityBlock(k) !== 'hidden' && !storm(k));
    if (!acts.length || S.helpWanted.length >= 2) return;
    const act = pick(acts), A = D.ACTIVITIES[act], Dg = D.DUNGEONS[A.dungeon];
    const bossIdx = Dg.pulls.map((p, i) => (p.boss ? i : -1)).filter((i) => i > 0);
    const stuck = Math.random() < 0.55 && bossIdx.length ? pick(bossIdx) : 0;
    const role = pick(G.roles());
    const firstTimers = Math.random() < 0.6;
    const myF = (D.RACES[P.race] || {}).faction || 'alliance';
    const mine = S.bots.filter((b) => B.factionOf(b) === myF), on = new Date(t), fit = mine.filter((b) => b.level >= A.minLvl - 3 && b.level <= (A.maxLvl || D.LEVEL_CAP) + 5 && B.isOnline(b, on) && !B.lfRecent(S, b)); // a poster of the run's level (#69: a bot names content at its own level), online, never a level 60 in a level 20 dungeon (#357, #364)
    const poster = pick(fit); if (!poster) return; // nobody fitting is online: no post
    const req = { id: 'hw' + t, act, role, startIdx: stuck, firstTimers, poster: poster.id, posterName: poster.name, expires: t + HW_LIFE };
    S.helpWanted.push(req);
    const what = stuck ? `stuck on ${Dg.pulls[stuck].label}` : 'from the start'; // (not 'full run': chat says full only of a busy server, #70)
    // a real request in chat too: tapping it joins, same as the Group Finder's Help Wanted
    const who = role === 'dps' ? 'a dps' : 'a ' + role, ft = firstTimers ? ', first timers pls be patient' : ''; // #70: its words rotate (B.pickHeard)
    const hm = B.post(S, 'lfg', poster, B.pickHeard(S, 'hw', [`LF1M ${role} ${A.name}, ${what}${ft}`, `${A.name} needs ${who}, ${what}${ft}`, `need ${who} for ${A.name}, ${what}${ft}`, `${A.name}: one ${role} spot left, ${what}${ft}`, `lf ${role}, ${A.name} ${what}${ft}`, `any ${role}? ${A.name}, ${what}${ft}`]));
    if (hm) hm.act = { kind: 'help_wanted', hw: req.id, bot: poster.id, state: 'open', posted: t, until: req.expires };
    emit('chat'); emit('helpWanted', req);
  }
  G.joinHelpWanted = function (id) {
    const S = G.S, req = (S.helpWanted || []).find((r) => r.id === id);
    if (!req) return toast('That group already found someone.');
    if (D.ACTIVITIES[req.act].where && G.stormBlocks(D.ACTIVITIES[req.act].where)) return toast(G.STORM_TEXT); // #477
    if (G.groupBusy()) return toast('Leave your current group first.');
    if ((S.flags.deserterUntil || 0) > now()) return toast('You are a Deserter for a few more minutes.');
    S.helpWanted = S.helpWanted.filter((r) => r !== req);
    if (S.wparty) disbandParty('You left your party to help another group.');
    if (G.roles().includes(req.role)) S.player.role = req.role;
    stopActions();
    const grp = formGroup(req.act, { firstTimers: req.firstTimers });
    // the one who asked is in the group (#357), as with a group from chat
    const poster = S.bots.find((b) => b.id === req.poster);
    if (poster && !grp.members.some((m) => m.bot && m.bot.id === poster.id)) seatLead(grp, poster);
    sys(`${req.posterName}'s group summons you to ${D.ACTIVITIES[req.act].name}.`);
    grp.members.forEach((m, i) => S.pending.push({ at: now() + 900 + i * 1400, bot: m.bot.id, ch: 'party', text: cpick((poster ? m.bot.id === poster.id : i === 0) ? ['ty for coming!!', 'thank you so much', 'yay a helper', 'omg ty'] : ['hi', 'ty', 'hello', 'o/']), fromName: m.name }));
    startRun(req.act);
    const R = S.run; R.help = { firstTimers: req.firstTimers, stuck: !!req.startIdx }; R.idx = req.startIdx || 0; R.noSpeed = !!req.startIdx;
    if (req.poster != null) R.soc = Object.assign({}, R.soc, { leader: req.poster }); // the poster leads: finishing it makes them a friend (#451)
    if (req.startIdx) sys(`They wiped here twice. Next: ${R.pulls[R.idx].label}.`);
    emit('change');
  };
  // Daily Roulette: once a day, a random dungeon you can do, with bonus rewards. The group summons you.
  // the day is the player's own (#96): it resets at local midnight, as the bounties have since v10.1.1 (it was UTC's). A
  // save from before keeps its UTC day until its next Roulette, so nobody gains or loses a run at the switch
  G.rouletteReady = () => { const f = G.S.flags; return f.rouletteLocal ? !(f.rouletteDay >= dayKey()) : f.rouletteDay !== oldDayKey(); }; // a later day only (#402)
  G.rouletteOptions = () => Object.keys(D.ACTIVITIES).filter((k) => { const A = D.ACTIVITIES[k]; return A.dungeon && (A.size || 5) === 5 && G.S.player.level >= A.minLvl && G.activityBlock(k) !== 'hidden' && !(A.where && G.stormBlocks(A.where) && G.S.player.level >= 60); }); // a 5-player dungeon: no raid, nothing the storm hides (#385)
  G.startRoulette = function () {
    const S = G.S;
    if (!G.rouletteReady()) return toast('You did the Roulette today. It resets at midnight.');
    if (G.groupBusy()) return toast('Leave your current group first.');
    if ((S.flags.deserterUntil || 0) > now()) return toast('You are a Deserter for a few more minutes.');
    const opts = G.rouletteOptions(); if (!opts.length) return toast(`Dungeons open at level ${Math.min(...Object.values(D.ACTIVITIES).filter((a) => a.dungeon).map((a) => a.minLvl))}.`);
    // the day's dungeon is drawn once (#350): leaving after a wipe and starting again brings the same one
    const drawn = pick(opts), kept = S.flags.roulettePick, act = kept && kept.day === dayKey() && opts.includes(kept.act) ? kept.act : drawn;
    S.flags.roulettePick = { day: dayKey(), act };
    if (S.wparty) disbandParty('You left your party for the Roulette.');
    stopActions();
    formGroup(act);
    sys(`Dungeon Roulette: ${D.ACTIVITIES[act].name}! Your group summons you.`);
    startRun(act);
    S.run.roulette = true;
    emit('change');
  };
  // extra rewards when a helped or Roulette run ends
  function helpRewards(R) {
    const S = G.S, P = S.player, L = G.syncLevel(R.act);
    if (R.help) {
      const n = 10 + (R.help.firstTimers ? 5 : 0) + (R.wipes ? 0 : 5) + (R.help.stuck ? 3 : 0);
      P.mentorRuns = (P.mentorRuns || 0) + 1;
      G.addMarks(n, R.help.firstTimers ? 'you helped first-timers' : 'you helped a group');
      P.money += L * 100; loot(`The group thanks you with ${G.moneyText(L * 100)}.`);
    }
    if (R.roulette) {
      S.flags.rouletteDay = dayKey(); S.flags.rouletteLocal = true;
      G.addMarks(15, 'daily Roulette');
      const A = D.ACTIVITIES[R.act], Dg = D.DUNGEONS[A.dungeon];
      { const it = P.level >= D.LEVEL_CAP ? G.fittedGear(D.LEVEL_CAP, 3, P.cls) : G.fittedBossBlue(Dg, L, P.cls); G.giveReward(it, 'Roulette bonus'); loot(`Roulette bonus: ${B.link(it.name, it.q)}.`); } // fits your class, never lost (issue #13)
      P.money += L * 150; loot(`Roulette bonus: ${G.moneyText(L * 150)}.`);
    }
  }
  // ============================================================ world PvP: ambushes (War Mode)
  // Enemy players sometimes attack you. Danger per place: 0 in capitals and starting valleys, very rare in
  // hub towns (guards fight for you), low in questing zones. Contested zones (later) set place.danger higher.
  // Ambushers pick fair fights: their level is set by your class so you win ~65-80% of the time (sim/pvp.js).
  const AMBUSH_MIN_LEVEL = 6, AMBUSH_GAP = 12 * 60000, AMBUSH_AFTER_DEATH = 20 * 60000, AMBUSH_PER_MIN = 1 / 30;
  G.AMBUSH_OFFSET = { warrior: 0, paladin: 0, hunter: 3, priest: -1, druid: 0, shaman: -1, mage: -2, warlock: 2, rogue: -1, bard: -1 };
  const WAR_MODE_BONUS = 1.1;
  G.warBonus = () => (G.S && G.S.flags.warMode ? WAR_MODE_BONUS : 1);
  G.dangerOf = function (placeId) {
    const p = D.PLACES[placeId];
    if (!p) return 0;
    if (p.danger != null) return p.danger;
    if (p.city || p.lvl[0] <= 3) return 0;
    if (p.safe) return 0.08;
    // contested zones see more enemy players, and the other faction's own zones more still
    const f = (D.REGIONS[p.region] || {}).faction;
    return f === 'contested' ? 1.5 : f && f !== G.myFaction() ? 1.8 : 1;
  };
  G.setWarMode = function (on) {
    const f = G.S.flags; f.warMode = !!on; f.warModeAsked = true;
    if (on) f.nextAmbush = Math.max(f.nextAmbush || 0, now() + 3 * 60000);
    sys(on ? 'War Mode is on. Enemy players may attack you. +10% experience and gold, and Honor for every enemy player you defeat.' : 'War Mode is off.');
    emit('change');
  };
  // ---- Honor ranks (#57): eight ranks from lifetime Honor (D.HONOR_RANKS), per faction; no decay and no spending
  // rank: 0 (none yet) .. 8; next: the next rank's index or null at the top
  G.honorRank = function (honor) {
    const R = D.HONOR_RANKS; let rank = 0; while (rank < R.length && honor >= R[rank].at) rank++;
    return { rank, of: R.length, next: rank < R.length ? rank + 1 : null, nextAt: rank < R.length ? R[rank].at : null };
  };
  G.rankName = (rank, faction) => { const r = D.HONOR_RANKS[rank - 1]; return r ? r[faction === 'horde' ? 'horde' : 'alliance'].replace(/%s,? ?/, '').replace(/^, /, '').trim() : ''; };
  G.myRank = () => G.honorRank(G.pvpStats().honor).rank;
  // the looks at ranks 3, 5 and 8 join the wardrobe (account-wide) once this character's faction reaches them; quiet:
  // on load, for ranks earned before the looks existed
  G.honorLooks = function (quiet) {
    if (!G.S) return; const f = G.myFaction(), r = G.myRank();
    D.HONOR_RANKS.forEach((x, i) => { if (!x.look || r < i + 1) return; const it = D.ITEMS[`honor_${f}_${x.look}`];
      if (it && G.collectLook(it) && !quiet) loot(`Honor rank ${i + 1}, ${G.rankName(i + 1, f)}: new look ${B.link(it.name, it.q)}.`); });
  };
  // a bot's lifetime Honor, from its id and level (#57, the game designer's bar): at level 60 about half the bots have no
  // rank, and ranks 5-8 each hold about half the bots of the rank below (rank 5 against rank 4 too), about 1 in 100 at
  // rank 8. G.BOT_HONOR.spread
  // is the share (%) of level-60 bots at rank 0..8; a bot's rank comes from a hash of its id, its Honor from a second hash
  // within that rank's band, and a lower-level bot has that Honor scaled by its level squared (fewer ranks lower down)
  G.BOT_HONOR = { spread: [50, 6, 6, 8, 15, 8, 4, 2, 1] }; // rank 4 holds the most ranked bots: its band (4,000-8,000) is the widest below rank 5
  G.botHonor = function (b) {
    if (!b) return 0; if (b.honor != null) return b.honor;
    const id = b.id != null ? b.id : b.name, u = (fnv('honor:' + id) % 100003) / 100003, v = (fnv('band:' + id) % 10007) / 10007, R = D.HONOR_RANKS, sp = G.BOT_HONOR.spread;
    const tot = sp.reduce((a, x) => a + x, 0); let r = 0, acc = sp[0] / tot; while (r < R.length && u >= acc) { r++; acc += (sp[r] || 0) / tot; }
    const lo = r ? R[r - 1].at : 0, hi = r < R.length ? R[r].at : R[R.length - 1].at * 1.5, L = Math.max(0, Math.min(1, (b.level || 1) / D.LEVEL_CAP));
    return Math.round((lo + (hi - lo) * v) * L * L);
  };
  G.pvpStats = () => Object.assign({ kills: 0, deaths: 0, escapes: 0, honor: 0 }, G.S.player.pvp || {});
  // An enemy player first shows up nearby (in the scene and under People), like any other player.
  // Most of them attack after a while if you are still around; some are only passing through.
  // You can also attack them first, or walk away.
  function quietNow() {
    const S = G.S, P = S.player;
    return !(G.fight || S.run || S.bg || S.brawl || S.queue || P.travel || P.ghostUntil || G.paused || (S.rolls && S.rolls.length)); // no ambush between brawl rounds either
  }
  function ambushTick() {
    const S = G.S, P = S.player, f = S.flags;
    if (P.level >= AMBUSH_MIN_LEVEL && !f.warModeAsked && quietNow() && G.dangerOf(P.place) > 0) { f.warModeAsked = true; emit('warModeIntro'); return; }
    const it = S.intruder;
    if (it) {
      if (!f.warMode || now() >= it.leaveAt) { S.intruder = null; emit('change'); return; }
      if (it.attackAt && now() >= it.attackAt && P.place === it.place) {
        const v = G.vitals();
        if (quietNow() && (P.hp == null || P.hp >= v.maxHp * 0.5)) startAmbush(false);
        else it.attackAt = now() + 8000; // they wait for a better moment
      }
      return;
    }
    if (!f.warMode || P.level < AMBUSH_MIN_LEVEL || !quietNow()) return;
    if (now() < (f.nextAmbush || 0)) return;
    const danger = G.dangerOf(P.place);
    if (!danger || Math.random() >= danger * AMBUSH_PER_MIN / 60) return;
    spawnIntruder();
  }
  function spawnIntruder() {
    const S = G.S, P = S.player, f = S.flags, place = D.PLACES[P.place];
    const myF = (D.RACES[P.race] || {}).faction || 'alliance';
    const theirF = myF === 'alliance' ? 'horde' : 'alliance';
    f.gankers = f.gankers || {}; for (const k of Object.keys(f.gankers)) if (f.gankers[k] <= now()) delete f.gankers[k]; // only the ones still waiting (#376)
    const pool = S.bots.filter((b) => B.factionOf(b) === theirF && !(f.gankers[b.id] > now()));
    if (!pool.length) return;
    const b = pick(pool);
    const level = clamp(P.level + (G.AMBUSH_OFFSET[P.cls] || 0) + rint(0, 1), 1, D.LEVEL_CAP);
    const hostile = Math.random() < (place.safe ? 0.55 : 0.7);
    S.intruder = { bot: b.id, name: b.name, race: b.race, cls: b.cls, gender: b.gender, skin: b.skin, hair: b.hair, level, place: P.place,
      attackAt: hostile ? now() + rnd(25, 60) * 1000 : null, leaveAt: now() + rnd(90, 180) * 1000 };
    f.gankers[b.id] = now() + 60 * 60000;
    f.nextAmbush = now() + AMBUSH_GAP * rnd(0.8, 1.5);
    const R = D.RACES[b.race] || {};
    sys(`An enemy player is nearby: ${b.name}, level ${level} ${R.name || ''} ${D.CLASSES[b.cls].name}.`);
    // the zone notices
    const mates = B.onlineIn(S, P.place, new Date()).filter((x) => B.factionOf(x) === myF);
    if (mates.length && (place.safe || crand() < 0.4)) {
      const who = D.FACTIONS[theirF].name.toUpperCase(); // the faction's name in the game (Krugar, Accord), never its key (#93)
      B.post(S, place.safe ? 'general' : 'say', cpick(mates), cpick(place.safe ? [`${who} IN ${place.name.toUpperCase()}!!`, `${lower(who)} in ${place.name.toLowerCase()}, careful`, `inc ${lower(who)} near the inn`] : ['watch out, pvp', `${lower(who)} here`, `a ${lower(D.CLASSES[b.cls].name)} is ganking here`]));
      emit('chat');
    }
    emit('intruder', S.intruder);
    emit('change');
  }
  G.intruderHere = () => { const S = G.S; return S && S.intruder && S.intruder.place === S.player.place ? S.intruder : null; };
  G.attackIntruder = function () {
    if (!G.intruderHere()) return toast('They are gone.');
    if (!quietNow()) return toast("You can't do that right now.");
    startAmbush(true);
  };
  // A friendly duel from chat (v9.6): nobody dies. The loser ends at 1 health; the wager changes hands.
  G.DUEL_APART = 25; // a duel (and each brawl round) starts this many metres apart (distance, v10.9)
  // why a duel can't start now, or null: busy, or in the group finder or PvP (#445)
  G.duelWhy = function () { const S = G.S, P = S.player; return G.partyBlock() || (G.fight || S.run || P.travel || P.ghostUntil ? "You can't duel right now." : null); };
  G.startDuel = function (botId, wager) {
    const S = G.S, P = S.player;
    const why = G.duelWhy(); if (why) { toast(why); return false; }
    const bot = S.bots.find((b) => b.id === botId); if (!bot) return false;
    const skill = clamp(bot.skill || 0.5, 0.3, 0.8);
    const ec = G.botChar(Object.assign({}, bot, { level: clamp(bot.level, P.level - 1, P.level + 1), skill, role: 'dps' })); ec.role = 'dps';
    const eu = E.charUnit(ec, 'enemy', 'bot', now()); eu.bot = { skill, react: 0.9 - 0.6 * skill }; eu.role = 'dps'; eu.threat = eu.threat || {};
    stopActions();
    const pu = E.charUnit(P, 'ally', 'player', now()); G.pUnit = pu;
    const allies = [pu]; const pet = G.petUnitFor(pu); if (pet) allies.push(pet);
    G.fight = E.fight(allies, [eu], { soloUid: pu.uid, puller: pu, apart: G.DUEL_APART });
    G.fight.kind = 'duel'; G.fight.duel = { bot: bot.id, name: bot.name, wager: wager || 0, hp0: P.hp };
    S.duelOn = { bot: bot.id, name: bot.name, wager: wager || 0 }; // saved: a duel left by closing the app counts as lost (#380)
    sys(`Duel with ${bot.name} begins! ${wager ? 'Wager: ' + G.moneyText(wager) + '.' : ''}`);
    emit('fightStart'); emit('change');
    return true;
  };
  function endDuel(C) {
    const S = G.S, P = S.player, d = C.duel;
    recordFx(C, G.pUnit); E.writeBack(C, G.pUnit, now()); petWriteBack(C);
    const won = C.over === 'win'; delete S.duelOn;
    if (!won) P.hp = Math.max(1, Math.round(G.vitals().maxHp * 0.05));
    if (d.wager) { if (won) P.money += d.wager; else P.money = Math.max(0, P.money - d.wager); }
    sys(won ? `You won the duel against ${d.name}!${d.wager ? ' +' + G.moneyText(d.wager) + '.' : ''}` : `${d.name} won the duel.${d.wager ? ' You paid ' + G.moneyText(d.wager) + '.' : ''}`);
    S.pending.push({ at: now() + 1500, bot: d.bot, ch: 'whisper', text: won ? cpick(['gg, u got me', 'gg wp', 'nice one, rematch sometime?', 'ok ur good lol']) : cpick(['gg!', 'gg wp', 'close one', 'ez... jk gg']) });
    G.fight = null; G.pUnit = null;
    emit('duelEnd', { bot: d.bot, won }); emit('fightEnd', { result: C.over, duel: true }); emit('change');
  }
  function startAmbush(youStarted) {
    const S = G.S, P = S.player, place = D.PLACES[P.place], it = S.intruder;
    if (!it) return;
    S.intruder = null;
    const myF = (D.RACES[P.race] || {}).faction || 'alliance';
    const bot = S.bots.find((b) => b.id === it.bot) || { id: it.bot, name: it.name, race: it.race, cls: it.cls, gender: it.gender, skin: it.skin, hair: it.hair, skill: 0.5 };
    const skill = clamp(0.35 + Math.random() * 0.3, 0.2, 0.7);
    const ec = G.botChar(Object.assign({}, bot, { level: it.level, skill, role: 'dps' }));
    ec.role = 'dps';
    const eu = E.charUnit(ec, 'enemy', 'bot', now());
    eu.bot = { skill, react: 0.9 - 0.6 * skill }; eu.role = 'dps'; eu.threat = eu.threat || {}; eu.pvpBot = bot.id;
    stopActions();
    const pu = E.charUnit(P, 'ally', 'player', now());
    G.pUnit = pu;
    const allies = [pu];
    const pet = G.petUnitFor(pu); if (pet) allies.push(pet);
    for (const m of ((S.wparty && S.wparty.members) || [])) { const u = E.charUnit(m, 'ally', 'bot', now()); u.bot = { skill: m.bot.skill, react: 0.9 - 0.6 * m.bot.skill }; u.memberRef = m; allies.push(u); }
    const helpers = [];
    // town guards join on your side
    if (place.safe) {
      for (let i = 0; i < rint(1, 2); i++) {
        const gc = G.botChar({ id: -1 - i, name: `${place.name} ${myF === 'alliance' ? 'Guard' : 'Grunt'}`, cls: 'warrior', race: myF === 'alliance' ? 'human' : 'orc', gender: 'm', skin: rint(0, 3), hair: rint(0, 4), level: P.level + 4, skill: 0.6, role: 'tank' });
        const gu = E.charUnit(gc, 'ally', 'bot', now()); gu.bot = { skill: 0.6, react: 0.5 }; gu.role = 'tank'; gu.guard = true; allies.push(gu); helpers.push(gu.name);
      }
    }
    // sometimes a player of your faction nearby jumps in
    const near = B.onlineIn(S, P.place, new Date()).filter((b) => B.factionOf(b) === myF && b.level >= P.level - 3 && !(S.wparty && S.wparty.members.some((m) => m.bot.id === b.id)));
    if (near.length && Math.random() < (place.safe ? 0.6 : 0.3)) {
      const hb = pick(near); const hc = G.botChar(Object.assign({}, hb, { level: Math.min(hb.level, P.level + 2) }));
      const hu = E.charUnit(hc, 'ally', 'bot', now()); hu.bot = { skill: hb.skill, react: 0.9 - 0.6 * hb.skill }; hu.role = 'dps'; allies.push(hu); helpers.push(hb.name);
    }
    G.fight = E.fight(allies, [eu], { soloUid: pu.uid, puller: pu, apart: G.DUEL_APART });
    G.fight.kind = 'pvp';
    G.fight.pvp = { bot: bot.id, name: bot.name, level: it.level, town: !!place.safe, helpers, youStarted };
    if (youStarted) eu.swingT = 1.2; // you swing first
    const R = D.RACES[bot.race] || {};
    sys(youStarted ? `You attack ${bot.name}!` : `${bot.name} (${R.name || ''} ${D.CLASSES[bot.cls].name}, level ${it.level}) attacks you!`);
    if (helpers.length) B.post(S, 'combat', null, `${helpers.join(' and ')} ${helpers.length > 1 ? 'join' : 'joins'} the fight!`);
    emit('fightStart', { fight: G.fight });
    emit('ambush', G.fight.pvp);
  }
  function endPvp(C) {
    const S = G.S, P = S.player, f = S.flags, info = C.pvp;
    recordFx(C, G.pUnit); E.writeBack(C, G.pUnit, now());
    if (C.over === 'win' && G.pUnit.dead) P.hp = 1; // as in a solo fight (#121): the kill counts, and you live
    petWriteBack(C);
    for (const u of C.allies) if (u.memberRef) { E.writeBack(C, u, now()); if (u.dead) u.memberRef.hp = Math.round(u.maxHp * 0.5); }
    P.pvp = G.pvpStats();
    const mates = B.onlineIn(S, P.place, new Date()).filter((b) => B.factionOf(b) === B.factionOf({ race: P.race }));
    if (C.over === 'win') {
      const honor = Math.round((10 + 2 * info.level) * (info.town ? 1.5 : 1));
      P.pvp.kills++; P.pvp.honor += honor; G.honorLooks();
      sys(`You defeated ${info.name}. +${honor} Honor.`);
      if (mates.length && crand() < 0.5) B.post(S, 'say', cpick(mates), cpick(['gj', 'nice', 'ez', 'get rekt lol', 'thx for the help', 'ty']));
      f.nextAmbush = now() + AMBUSH_GAP * rnd(0.8, 1.5);
    } else {
      P.pvp.deaths++; P.deaths++; P.hp = 0; G.wear();
      P.ghostUntil = now() + 15000;
      sys(`${info.name} killed you. Your spirit runs back to your body...`);
      if (mates.length && crand() < 0.4) B.post(S, 'say', cpick(mates), cpick(['rip', 'gankers smh', 'we will get him', 'u ok?']));
      f.nextAmbush = now() + AMBUSH_AFTER_DEATH;
    }
    G.fight = null; G.pUnit = null;
    emit('fightEnd', { result: C.over, pvp: true });
    G.save();
  }

  // ============================================================ the Bloodsand Brawl (v10.9, Rumhook Bay)
  // A knockout of eight at your level in the Bloodsand Arena: you and 7 simulated players of both factions, three rounds
  // of one-on-one duels, one fighter each (pets wait outside). Your duel is on screen; the others are settled at once. Everyone is back to
  // full health each round and losing costs nothing. It opens every 3 hours on the hour (local time) for 20 minutes,
  // from the clock alone (no stored timer). Each round won pays; the champion opens the Bloodsand chest (once a day: a
  // choice of three blue items for your level) and earns a title the first time. sim/brawl.js tunes BRAWL_SKILL.
  const BRAWL = { place: 'bloodsand_arena', every: 3, openMin: 20, minLvl: 35, rounds: 3, size: 8 };
  G.BRAWL = BRAWL;
  G.BRAWL_SKILL = [0.2, 0.55]; // the simulated fighters' skill range (sim/brawl.js)
  const pad2 = (x) => String(x).padStart(2, '0');
  const brawlDay = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; // local date
  // the window for a moment: open now or not, when it opens next, when it closes; id names this window
  G.brawlWindow = function (d) {
    d = d ? new Date(d) : new Date(now());
    const start = new Date(d); start.setMinutes(0, 0, 0); start.setHours(start.getHours() - (start.getHours() % BRAWL.every));
    const closes = new Date(start.getTime() + BRAWL.openMin * 60000), open = d >= start && d < closes;
    const next = new Date(start); next.setHours(next.getHours() + BRAWL.every);
    return { open, opensAt: open ? start : next, closesAt: open ? closes : new Date(next.getTime() + BRAWL.openMin * 60000), id: brawlDay(start) + 'T' + pad2(start.getHours()) };
  };
  // why you cannot join right now, or null
  G.brawlBlock = function () {
    const S = G.S, P = S.player, w = G.brawlWindow();
    if (P.level < BRAWL.minLvl) return `The Bloodsand Brawl takes fighters from level ${BRAWL.minLvl}.`;
    if (P.place !== BRAWL.place) return 'Go to the Bloodsand Arena in Rumhook Bay.';
    if (!w.open) return 'The arena is closed.';
    if ((P.brawl || {}).last === w.id) return 'You have fought in this brawl. The next one opens later.';
    if (G.fight || S.run || S.bg || S.queue || P.travel || P.ghostUntil) return "You can't fight right now.";
    return null;
  };
  // one fighter each: pets wait outside the pit (a plain arena rule, said on the panel; they fight everywhere else)
  const brawlUnits = (m, side) => { m.hp = null; m.res = null; const u = E.charUnit(m, side, 'bot', now()); u.bot = { skill: m.bot.skill, react: 0.9 - 0.6 * m.bot.skill }; u.role = 'dps'; if (side === 'enemy') u.threat = u.threat || {}; return [u]; };
  function brawlAuto(a, b) { // two simulated fighters, settled at once
    const ua = brawlUnits(a, 'ally'), ub = brawlUnits(b, 'enemy'), C = E.fight(ua, ub, { apart: G.DUEL_APART });
    for (let i = 0; i < 1500 && !C.over; i++) E.tick(C, 0.2);
    return C.over === 'win' ? a : b;
  }
  G.brawlJoin = function () {
    const S = G.S, P = S.player, why = G.brawlBlock(); if (why) { toast(why); return false; }
    const used = new Set(), L = P.level, pool = S.bots.filter((b) => Math.abs((b.level || 1) - L) <= 8);
    const fighters = [];
    while (fighters.length < BRAWL.size - 1) {
      const src = pool.filter((b) => !used.has(b.id)); let b = src.length ? JSON.parse(JSON.stringify(pick(src))) : B.makeBot(S.nextBotId++, new Set(S.bots.map((x) => x.name)), { level: L });
      used.add(b.id); b.level = clamp(L + rint(-1, 1), 1, D.LEVEL_CAP); b.skill = rnd(G.BRAWL_SKILL[0], G.BRAWL_SKILL[1]); b.role = 'dps';
      const c = G.botChar(b); c.role = 'dps'; fighters.push(c);
    }
    const slots = [{ you: true }].concat(fighters).sort(() => Math.random() - 0.5);
    P.brawl = Object.assign(P.brawl || {}, { last: G.brawlWindow().id });
    S.brawl = { id: P.brawl.last, round: 1, slots, phase: 'choose', results: [], wins: 0, reward: { money: 0, xp: 0, marks: 0 }, chest: null };
    sys('The Bloodsand Brawl begins: 8 fighters, 3 rounds. Win all 3 for the chest.');
    emit('change'); G.save();
    return true;
  };
  // the pairs of a round: neighbours in the bracket
  const brawlPairs = (br) => { const out = []; for (let i = 0; i < br.slots.length; i += 2) out.push([br.slots[i], br.slots[i + 1]]); return out; };
  G.brawlOpponent = function () { const br = G.S.brawl; if (!br || br.phase !== 'choose') return null; const p = brawlPairs(br).find((x) => x[0].you || x[1].you); return p ? (p[0].you ? p[1] : p[0]) : null; };
  // what winning round r pays at level L (the arena card shows the same numbers): more each round, Marks instead of XP at 60
  G.brawlRoundPay = function (r, L) {
    L = L || G.S.player.level;
    return { money: L * 50 * r, xp: L < D.LEVEL_CAP ? Math.round((D.XP_TO_LEVEL[L] || 0) * [0.02, 0.03, 0.05][r - 1]) : 0, marks: L >= D.LEVEL_CAP ? [2, 3, 5][r - 1] : 0 };
  };
  G.brawlChestOpen = function () { return !(((G.S.player.brawl || {}).chestDay) >= brawlDay(new Date(now()))); }; // the chest pays once a day; only a later day opens it again (#402)
  G.brawlFight = function () {
    const S = G.S, P = S.player, br = S.brawl; if (!br || br.phase !== 'choose' || G.fight) return;
    const foe = G.brawlOpponent(); if (!foe) return;
    // the other duels of the round first, so their results stand when yours ends
    br.pending = brawlPairs(br).map(([a, b]) => (a.you || b.you ? null : { a: a.name, b: b.name, winner: brawlAuto(a, b) })); // one per pair, yours null
    stopActions(); P.hp = null; P.res = null; P.cds = null; P.songs = null; // a fresh round: full health, cooldowns ready, no song carried in (like the foe)
    const pu = E.charUnit(P, 'ally', 'player', now()); G.pUnit = pu;
    G.fight = E.fight([pu], brawlUnits(foe, 'enemy'), { soloUid: pu.uid, puller: pu, apart: G.DUEL_APART }); // no pet: one fighter each
    G.fight.kind = 'brawl'; G.fight.brawl = { foe: foe.name, round: br.round };
    br.phase = 'fight';
    sys(`Round ${br.round}: you against ${foe.name}, ${foe.level} ${D.CLASSES[foe.cls].name}.`);
    emit('fightStart', { fight: G.fight }); emit('change');
  };
  function endBrawlFight(C) {
    const S = G.S, P = S.player, br = S.brawl, L = P.level;
    G.fight = null; G.pUnit = null; P.hp = null; P.res = null; P.ghostUntil = 0; // nobody stays hurt in the arena
    emit('fightEnd', { result: C.over, brawl: true });
    if (!br) return;
    const won = C.over === 'win', r = br.round, foe = C.brawl.foe;
    const pend = br.pending || [], results = pend.filter(Boolean).map((x) => ({ a: x.a, b: x.b, w: x.winner.name }));
    results.unshift({ a: P.name, b: foe, w: won ? P.name : foe, you: true });
    br.results.push(results);
    if (won) {
      br.wins++;
      const { money, xp, marks } = G.brawlRoundPay(r, L);
      P.money += money; br.reward.money += money;
      if (xp) { G.gainXp(xp); br.reward.xp += xp; }
      if (marks) { G.addMarks(marks, 'the Bloodsand Brawl'); br.reward.marks += marks; }
      sys(`You win round ${r}! +${G.moneyText(money)}${xp ? `, +${xp} XP` : ''}${marks ? `, +${marks} Marks` : ''}.`);
    } else sys(`${foe} wins round ${r}. You are out (${br.wins} round${br.wins === 1 ? '' : 's'} won).`);
    // the winners go on: the bracket keeps its order
    const winners = brawlPairs(br).map(([a, b], i) => (a.you || b.you ? (won ? (a.you ? a : b) : (a.you ? b : a)) : pend[i].winner));
    if (!won || r >= BRAWL.rounds) { br.pending = null; return brawlFinish(won && r >= BRAWL.rounds); }
    br.slots = winners; br.pending = null; br.round++; br.phase = 'choose';
    emit('bgRound', { took: 1 }); emit('change'); G.save();
  }
  function brawlFinish(champion) {
    const S = G.S, P = S.player, br = S.brawl;
    br.phase = 'done'; br.champion = champion;
    P.brawl = Object.assign(P.brawl || {}, { fought: ((P.brawl || {}).fought || 0) + 1 });
    if (champion) {
      P.brawl.champs = (P.brawl.champs || 0) + 1;
      const today = brawlDay(new Date(now()));
      if (!(P.brawl.chestDay >= today)) { // the chest: once a day, a choice of three blues for your level
        const C = D.CLASSES[P.cls], L = P.level, slots = ['weapon', pick(['chest', 'legs', 'hands', 'feet', 'waist', 'wrist']), pick(['back', 'finger'])];
        br.chest = slots.map((sl) => G.genGear(sl, L, 3, sl === 'weapon' ? { wtype: C.weapons[0] } : { atype: C.armorType }));
      }
      sys(`You are the Bloodsand Champion!${br.chest ? ' Open the chest.' : ' Chest already looted today.'}`);
    }
    emit('bgEnd', { result: champion ? 'win' : 'loss' }); emit('change'); G.save();
  }
  G.brawlTakeChest = function (i) {
    const S = G.S, P = S.player, br = S.brawl; if (!br || !br.chest || !br.chest[i]) return;
    if (G.bagsFull()) return toast('Bags are full.');
    const it = br.chest[i]; G.addItem(it); P.brawl.chestDay = brawlDay(new Date(now())); br.chest = null;
    sys(`From the Bloodsand chest: [${it.name}].`); emit('lootGain', { items: 1, got: [it] }); emit('change'); G.save();
  };
  G.leaveBrawl = function () { const S = G.S; if (!S.brawl) return; if (G.fight && G.fight.kind === 'brawl') return toast('Finish the fight first.'); if (S.brawl.chest) return toast('Take something from the chest first.'); S.brawl = null; emit('change'); G.save(); };
  // the simulated players talk about it before it opens (once per window)
  G.brawlTick = function () {
    const S = G.S; if (!S || !S.bots) return; const w = G.brawlWindow(), t = now(), soon = !w.open && w.opensAt.getTime() - t < 5 * 60000;
    if (!soon || S.brawlTold === w.id) return; S.brawlTold = w.id;
    const b = S.bots.filter((x) => (x.level || 1) >= BRAWL.minLvl); if (!b.length) return;
    B.post(S, 'general', cpick(b), cpick(['bloodsand brawl opens in 5, who is fighting', 'arena in rumhook opens at the top of the hour', 'brawl soon, last time i got knocked out round 1 lol', 'bloodsand pit opens in a few min, chest is mine']));
    emit('chat');
  };

  // ============================================================ music (v10.8)
  // Which track plays: a run's (each raid has a theme, world bosses share one), the battleground's, an iconic place's
  // (the capitals), else the zone's own: `music` outdoors and on the road, `town` in its towns and camps. `has(name)` says
  // whether a track ships (music ships once approved: audio/approved.txt); until then the older choice plays.
  G.musicFor = function (has) {
    const S = G.S, P = S.player, pick = (...names) => names.find((n) => n && has(n)) || names[names.length - 1];
    if (S.run) { const A = D.ACTIVITIES[S.run.act] || {}; return pick(A.music || (D.DUNGEONS[A.dungeon] || {}).music, 'dungeon'); } // a raid's theme sits on its dungeon
    const pl = D.PLACES[P.place], outdoor = pick((D.REGIONS[pl.region] || {}).music, 'ambermoor');
    if (S.bg) return pick((D.ACTIVITIES[S.bg.act] || {}).music, outdoor);
    if (P.travel || !pl.safe) return outdoor;
    const fest = G.lnOn && G.lnOn() && G.lnTown(P.place) && G.lnStage() >= 2 ? D.EVENTS.longnight.music : null; // Longnight's music stage (22 December) plays its theme in the festival towns
    return pick(fest, pl.music, (D.REGIONS[pl.region] || {}).town, 'town'); // a capital's theme, else the zone's town track
  };

  // ============================================================ battlegrounds (v10.7, D.BG; design in zones/highmoor.js)
  // S.bg = { act, key, round, score, owner, plan, phase: choose|fight|done, team, foes, log }. Everyone is back to full
  // health each round; dying in a battleground costs nothing.
  const BG_ROLES = ['tank', 'healer', 'dps', 'dps', 'dps'];
  G.BG_REACT = 0.8; // how often they send fighters after your pair (sim/battleground.js tunes it)
  G.BG_REACT_GROUP = 0.5; // how often they send one more fighter to your group's banner (v10.8)
  G.BG_SCOUT_SPREAD = 2; // scouts report a range this wide; the true count is always inside it (v10.8)
  function bgSide(faction, lvl, roles, used) {
    const S = G.S, out = [];
    for (const role of roles) {
      const pool = S.bots.filter((b) => B.factionOf(b) === faction && !used.has(b.id) && (role === 'tank' ? ['warrior', 'paladin', 'druid'].includes(b.cls) : role === 'healer' ? ['priest', 'paladin', 'druid', 'shaman', 'bard'].includes(b.cls) : true));
      let b = pool.length ? JSON.parse(JSON.stringify(pick(pool))) : null;
      if (!b) { b = B.makeBot(S.nextBotId++, new Set(S.bots.map((x) => x.name)), { level: lvl }); b.cls = role === 'tank' ? 'warrior' : role === 'healer' ? 'priest' : pick(['mage', 'rogue', 'hunter', 'warlock']); b.race = faction === 'horde' ? pick(['orc', 'troll', 'tauren', 'undead']) : pick(['human', 'dwarf', 'gnome', 'nightelf']); }
      used.add(b.id); b.role = role; b.level = clamp(lvl + rint(-1, 1), 1, D.LEVEL_CAP); b.skill = clamp((b.skill || 0.5), 0.35, 0.85);
      out.push(G.botChar(b));
    }
    return out;
  }
  // the other team's plan for a round: one of the splits, its biggest group sent where it hurts you most (a banner you
  // hold first), with some randomness so it can be read but not counted on
  function bgPlan(bg) {
    const C = D.BG[bg.key], names = C.banners.map((x) => x[0]), split = pick(C.splits).slice().sort((a, b) => b - a);
    const order = names.slice().sort((a, b) => (bg.owner[a] === 'us' ? 0 : bg.owner[a] ? 2 : 1) - (bg.owner[b] === 'us' ? 0 : bg.owner[b] ? 2 : 1));
    if (Math.random() < 0.3) order.sort(() => Math.random() - 0.5);
    const plan = {}; names.forEach((n) => { plan[n] = 0; }); order.forEach((n, i) => { plan[n] = split[i] || 0; });
    return plan;
  }
  // what the scouts report (v10.8): a range per banner, honest (the true count is always inside it) but not exact
  function bgScout(bg) {
    const w = G.BG_SCOUT_SPREAD, max = D.BG[bg.key].team, out = {};
    for (const [b, n] of Object.entries(bg.plan)) { let lo = n - rint(0, w); lo = clamp(lo, 0, Math.max(0, max - w)); out[b] = [lo, lo + w]; }
    return out;
  }
  // the range for a banner (a save from v10.7 has no scout report: then the exact count)
  G.bgScoutRange = function (bg, b) { return (bg.scout && bg.scout[b]) || [bg.plan[b] || 0, bg.plan[b] || 0]; };
  // a finished battleground or brawl result closes when something new starts, however it was joined (#479); a brawl
  // chest still waiting keeps its brawl
  function closeFinished() {
    const S = G.S;
    if (S.bg && S.bg.phase === 'done') { S.bg = null; emit('instanceLeave', {}); }
    if (S.brawl && S.brawl.phase === 'done' && !S.brawl.chest) S.brawl = null;
  }
  function startBg(act) {
    closeFinished();
    const S = G.S, P = S.player, A = D.ACTIVITIES[act], key = A.bg, C = D.BG[key];
    const myF = G.myFaction(), theirF = myF === 'alliance' ? 'horde' : 'alliance', used = new Set(), L = P.level;
    const mine = BG_ROLES.slice(); const i = mine.indexOf(G.role()); mine.splice(i >= 0 ? i : 2, 1);
    S.bg = { act, key, round: 1, score: { us: 0, them: 0 }, owner: {}, phase: 'choose', team: bgSide(myF, L, mine, used), foes: bgSide(theirF, L, BG_ROLES, used), log: [], started: now() };
    S.bg.plan = bgPlan(S.bg); S.bg.scout = bgScout(S.bg);
    P.hp = null; P.res = null; P.travel = null; P.route = null; // everyone starts full, and a trip ends, however you came in (#456, #457)
    sys(`${C.name} begins: 5v5. First to ${C.win} points, or most after ${C.rounds} rounds.`);
    emit('instanceEnter', { act, bg: key }); emit('change'); G.save();
  }
  // your team splits like theirs (v10.7): your group (you and two) and the pair (two more) each go to a banner. Where both
  // teams meet they fight: yours is played on screen, the pair's is settled at once. Empty banners are taken.
  const bgName = (bg, b) => (D.BG[bg.key].banners.find((x) => x[0] === b) || [])[1];
  function bgUnits(chars, side) { return chars.map((m) => { m.hp = null; m.res = null; const u = E.charUnit(m, side, 'bot', now()); u.bot = { skill: m.bot.skill, react: 0.9 - 0.6 * m.bot.skill }; u.role = side === 'enemy' && m.role === 'tank' ? 'dps' : m.role; if (side === 'enemy') u.threat = u.threat || {}; return u; }); }
  function bgAutoFight(ours, theirs) { // settled at once, by the same engine
    const C = E.fight(bgUnits(ours, 'ally'), bgUnits(theirs, 'enemy'), {});
    for (let i = 0; i < 1500 && !C.over; i++) E.tick(C, 0.2);
    return C.over === 'win';
  }
  G.bgSplit = function () { const bg = G.S.bg; if (!bg) return null; const t = bg.team, h = t.filter((m) => m.role === 'tank' || m.role === 'healer'), d = t.filter((m) => !h.includes(m)); const grp = h.concat(d).slice(0, 2); return { group: grp, pair: t.filter((m) => !grp.includes(m)) }; };
  G.bgGo = function (groupAt, pairAt) {
    const S = G.S, bg = S.bg; if (!bg || bg.phase !== 'choose' || G.fight) return;
    if (!bgName(bg, groupAt) || !bgName(bg, pairAt)) return;
    // they can still react: sometimes they spot the pair on the move and send fighters after it (said in the log)
    if (Math.random() < G.BG_REACT && pairAt !== groupAt) {
      const from = Object.keys(bg.plan).filter((x) => x !== pairAt && bg.plan[x] > 0).sort((x, y) => bg.plan[y] - bg.plan[x])[0];
      if (from) { bg.plan[from] -= 1; bg.plan[pairAt] = (bg.plan[pairAt] || 0) + 1; sys(`They spot the pair: 1 of them runs from ${bgName(bg, from)} to ${bgName(bg, pairAt)}!`); } // one chaser, not 1–2: the pair met 3+ enemies in 24% of rounds (#532)
    }
    // and sometimes one more runs to meet your group (v10.8), from a banner neither of yours is heading to
    if (Math.random() < G.BG_REACT_GROUP) {
      const from = Object.keys(bg.plan).filter((x) => x !== groupAt && x !== pairAt && bg.plan[x] > 0).sort((x, y) => bg.plan[y] - bg.plan[x])[0];
      if (from) { bg.plan[from] -= 1; bg.plan[groupAt] = (bg.plan[groupAt] || 0) + 1; sys(`They spot your group: 1 of them runs from ${bgName(bg, from)} to ${bgName(bg, groupAt)}!`); }
    }
    const sp = G.bgSplit(), foes = bg.foes.slice().sort(() => Math.random() - 0.5); let fi = 0;
    const foesAt = {}; for (const [b] of D.BG[bg.key].banners) { foesAt[b] = foes.slice(fi, fi + (bg.plan[b] || 0)); fi += bg.plan[b] || 0; }
    bg.go = { group: groupAt, pair: pairAt, foesAt, outcome: {} };
    // the pair's banner first (unless it is with you): settled at once
    if (pairAt !== groupAt) {
      const e = foesAt[pairAt];
      bg.go.outcome[pairAt] = e.length ? bgAutoFight(sp.pair, e) : true;
      sys(e.length ? `The pair ${bg.go.outcome[pairAt] ? 'takes' : 'is beaten at'} ${bgName(bg, pairAt)} (2 against ${e.length}).` : `The pair takes ${bgName(bg, pairAt)} unopposed.`);
    }
    const e = foesAt[groupAt], withPair = pairAt === groupAt;
    if (!e.length) { bg.go.outcome[groupAt] = true; sys(`Your group takes ${bgName(bg, groupAt)} unopposed.`); return bgResolve(); }
    stopActions();
    const P = S.player, pu = E.charUnit(P, 'ally', 'player', now()); G.pUnit = pu;
    const allies = [pu].concat(bgUnits(withPair ? sp.group.concat(sp.pair) : sp.group, 'ally'));
    const pet = G.petUnitFor(pu); if (pet) allies.push(pet);
    G.fight = E.fight(allies, bgUnits(e, 'enemy'), { puller: pu }); G.fight.kind = 'bg'; G.fight.bg = { banner: groupAt, name: bgName(bg, groupAt) };
    bg.phase = 'fight';
    sys(`Your group charges ${bgName(bg, groupAt)}: ${e.length} of them hold it.`);
    emit('fightStart', { fight: G.fight }); emit('change');
  };
  function endBgFight(C) {
    const S = G.S, P = S.player, bg = S.bg, info = C.bg;
    G.fight = null; G.pUnit = null; P.hp = null; P.res = null; P.ghostUntil = 0; // nobody stays dead in a battleground
    emit('fightEnd', { result: C.over, bg: true });
    if (!bg || !bg.go) return;
    const won = C.over === 'win';
    sys(won ? `You take ${info.name}!` : `They hold ${info.name}.`);
    if (won) { P.pvp = G.pvpStats(); P.pvp.kills += C.enemies.filter((u) => u.dead).length; }
    bg.go.outcome[info.banner] = won;
    bgResolve();
  }
  function bgResolve() {
    const S = G.S, bg = S.bg, C = D.BG[bg.key], go = bg.go, before = Object.assign({}, bg.owner);
    for (const [b] of C.banners) {
      if (go.outcome[b] != null) bg.owner[b] = go.outcome[b] ? 'us' : 'them';
      else if (go.foesAt[b].length) bg.owner[b] = 'them'; // they take what they reach unopposed
    }
    const us = C.banners.filter(([b]) => bg.owner[b] === 'us').length, them = C.banners.filter(([b]) => bg.owner[b] === 'them').length;
    bg.score.us += us; bg.score.them += them; bg.go = null;
    emit('bgRound', { took: C.banners.filter(([b]) => bg.owner[b] === 'us' && before[b] !== 'us').length, lost: C.banners.filter(([b]) => bg.owner[b] === 'them' && before[b] === 'us').length }); // sounds (v10.8)
    bg.log.unshift(`Round ${bg.round}: you hold ${us}, they hold ${them} (${bg.score.us} to ${bg.score.them})`);
    if (bg.score.us >= C.win || bg.score.them >= C.win || bg.round >= C.rounds) return bgFinish();
    bg.round++; bg.plan = bgPlan(bg); bg.scout = bgScout(bg); bg.phase = 'choose';
    emit('change'); G.save();
  }
  function bgFinish() {
    const S = G.S, P = S.player, bg = S.bg, C = D.BG[bg.key], L = P.level;
    const won = bg.score.us > bg.score.them, draw = bg.score.us === bg.score.them;
    const honor = Math.round((C.honor.base + C.honor.perLvl * L) * (won ? C.honor.win : 1));
    P.pvp = G.pvpStats(); P.pvp.honor += honor; P.pvp.bgPlayed = (P.pvp.bgPlayed || 0) + 1; if (won) P.pvp.bgWins = (P.pvp.bgWins || 0) + 1; G.honorLooks();
    const money = L * (won ? 120 : 50); P.money += money;
    if (L < D.LEVEL_CAP) G.gainXp(Math.round((D.XP_TO_LEVEL[L] || 0) * (won ? 0.07 : 0.03)));
    else G.addMarks(won ? C.marksAtCap.win : C.marksAtCap.loss, C.name);
    bg.phase = 'done'; bg.result = won ? 'win' : draw ? 'draw' : 'loss'; bg.reward = { honor, money };
    sys(`${C.name}: ${won ? 'victory' : draw ? 'a draw' : 'defeat'}, ${bg.score.us} to ${bg.score.them}. +${honor} Honor.`);
    emit('bgEnd', { result: bg.result, leader: bg.leader, help: !!(bg.soc && bg.soc.help) }); emit('change'); G.save();
  }
  // in a group, a queue, a fight, a battleground or a brawl still going: no other group can start (#354)
  G.groupBusy = () => { const S = G.S; return !!(S.run || S.queue || G.fight || G.bgBusy() || (S.brawl && S.brawl.phase !== 'done')); };
  // why a world party can't grow now (#415): the group finder, or PvP (a battleground, a brawl, a duel); null when it can
  // why a group from chat can't be joined now, for its greyed button (#483): the same refusals the join itself makes
  G.joinWhy = function () { const S = G.S, dl = (S.flags.deserterUntil || 0) - now(); return G.partyBlock() || (G.fight ? 'Finish the fight first.' : null) || (dl > 0 ? `Deserter: ${Math.ceil(dl / 60000)} min left` : null); };
  G.partyBlock = () => { const S = G.S; if (S.run || S.queue) return 'Not while in the group finder.'; if (G.bgBusy() || (S.brawl && S.brawl.phase !== 'done') || S.duelOn) return 'Not during PvP.'; return null; };
  G.bgBusy = () => !!(G.S.bg && G.S.bg.phase !== 'done'); // a finished battleground (the result screen) never blocks invites or groups (#30)
  G.leaveBg = function () {
    const S = G.S; if (!S.bg) return; if (G.fight && G.fight.kind === 'bg') return toast('Finish the fight first.');
    if (S.bg.phase !== 'done') { // left mid-match: played and lost, with the same Deserter as a run (#458)
      const P = S.player; P.pvp = G.pvpStats(); P.pvp.bgPlayed = (P.pvp.bgPlayed || 0) + 1;
      S.flags.deserterUntil = now() + DESERTER; sys(`You left before the end: Deserter for ${DESERTER / 60000} minutes.`);
    }
    S.bg = null; emit('instanceLeave', {}); emit('change'); G.save(); };
  G.bgStart = startBg; // sims

  // ============================================================ world party (grouping with nearby players)
  // Balance (sim/party.js): XP is split with a 1.3x group bonus and pulls get bigger, so a party averages ~1.1x solo XP/hour.
  const PARTY_MAX = 3, PARTY_XP_BONUS = 1.3, EXTRA_PULL = 0.7;
  const INVITE_GAP = 10 * 60000, DECLINE_GAP = 20 * 60000;
  const partyRole = (cls) => cls === 'warrior' ? 'tank' : cls === 'priest' ? 'healer' : (cls === 'paladin' || cls === 'druid' || cls === 'shaman') ? pick(['healer', 'dps']) : 'dps';
  G.partySize = () => 1 + ((G.S.wparty && G.S.wparty.members.length) || 0);
  // opts.meet: the party forms for a request somewhere else, so it travels with you until you get there.
  // opts.until: keep the party at least this long (a request's own time window).
  function addToParty(bot, opts) {
    const S = G.S; opts = opts || {};
    if (!S.wparty) S.wparty = { members: [], place: S.player.place, until: now() + rnd(4, 8) * 60000 };
    if (opts.meet && opts.meet !== S.player.place) { S.wparty.place = opts.meet; S.wparty.meet = true; }
    if (opts.until) S.wparty.until = Math.max(S.wparty.until, opts.until);
    if (S.wparty.members.length >= PARTY_MAX - 1 || S.wparty.members.some((m) => m.bot.id === bot.id)) return;
    const b = JSON.parse(JSON.stringify(bot)); b.role = partyRole(b.cls);
    const ch = G.botChar(b);
    S.wparty.members.push(ch);
    sys(`${ch.name} joins the party.`);
    S.pending.push({ at: now() + 1500, bot: b.id, ch: 'party', text: B.partyLine(b, 'hello'), fromName: ch.name });
    emit('change');
    return true; // joined: the caller may say so (#386)
  }
  G.addToParty = (bot, opts) => addToParty(bot, opts);
  // A group from chat (LFG post or guild request) summons you, like Help Wanted. opts: { leader, guild, soc }
  G.joinChatGroup = function (act, role, opts) {
    const S = G.S; opts = opts || {};
    if (G.groupBusy()) { toast('Leave your current group first.'); return false; }
    if (S.bg) G.leaveBg(); // the result screen of a finished battleground closes as you go
    if ((S.flags.deserterUntil || 0) > now()) { toast('You are a Deserter for a few more minutes.'); return false; }
    if (S.wparty) disbandParty('You left your party to join another group.');
    if (role && G.roles().includes(role)) S.player.role = role;
    stopActions();
    // a battleground forms its own two teams, as from the queue (issue #15: it started as a dungeon run with no pulls)
    if (D.ACTIVITIES[act].bg) { const bl = opts.leader && S.bots.find((b) => b.id === opts.leader); sys(`${bl ? bl.name + "'s" : 'The'} team summons you to ${D.ACTIVITIES[act].name}.`); startBg(act); if (S.bg && bl) S.bg.leader = bl.id; emit('change'); return true; } // the leader a friend at its end (#362)
    const grp = formGroup(act, { guild: opts.guild });
    const lead = opts.leader && S.bots.find((b) => b.id === opts.leader);
    if (lead && lead.level >= D.ACTIVITIES[act].minLvl - 2) seatLead(grp, lead); // never a leader far below the run (#478)
    sys(`${lead ? lead.name + "'s" : 'The'} group summons you to ${D.ACTIVITIES[act].name}.`);
    grp.members.forEach((m, i) => S.pending.push({ at: now() + 900 + i * 1400, bot: m.bot.id, ch: 'party', text: m.cameo ? G.legendLine(m.legend, 'hello') : cpick(m.bot.id === (lead && lead.id) ? ['ty for joining!', 'yay ty', 'nice, lets go'] : ['hi', 'hello', 'o/', 'hey']), fromName: m.name }));
    startRun(act);
    S.run.soc = opts.soc || null;
    const guest = grp.members.find((m) => m.cameo); if (guest) emit('legendJoin', { key: guest.legend });
    emit('change');
    return true;
  };
  // a Trial group from chat (v10.7, Trials stage 4): a level-60 bot's real post, joinable at a level you have open
  G.joinChatTrial = function (act, lvl, role, opts) {
    const S = G.S; opts = opts || {};
    if (G.groupBusy()) { toast('Leave your current group first.'); return false; }
    const why = G.trialBlock(act); if (why) { toast(why + '.'); return false; }
    if (lvl > G.trialMax(act)) { toast(`You have Trial ${G.trialMax(act)} open on ${D.ACTIVITIES[act].name}.`); return false; }
    if (S.wparty) disbandParty('You left your party to join another group.');
    if (role && G.roles().includes(role)) S.player.role = role;
    stopActions();
    const grp = formGroup(act, { trial: lvl });
    const lead = opts.leader && S.bots.find((b) => b.id === opts.leader);
    if (lead && lead.level >= D.ACTIVITIES[act].minLvl - 2) seatLead(grp, lead); // never a leader far below the run (#478)
    sys(`${lead ? lead.name + "'s" : 'The'} group summons you to ${D.ACTIVITIES[act].name}, Trial ${lvl}.`);
    startRun(act, lvl);
    if (lead) S.run.soc = { kind: 'trial', leader: lead.id }; // finishing it makes them a friend (#362)
    emit('change');
    return true;
  };
  G.leaveParty = function (quiet) {
    const S = G.S;
    if (!S.wparty) return;
    if (G.fight) return toast('Finish the fight first.');
    if (!quiet) sys('You leave the party.');
    S.wparty = null; emit('change');
  };
  function disbandParty(reason) {
    const S = G.S; if (!S.wparty) return;
    const m = S.wparty.members[0];
    if (m) partySay(m, B.partyLine(m.bot, 'bye'));
    sys(reason || 'Your party has disbanded.');
    S.wparty = null; emit('change');
  }
  // You invite someone from "Players here".
  G.invite = function (botId) {
    const S = G.S, P = S.player;
    { const why = G.partyBlock(); if (why) return toast(why); }
    if (G.partySize() >= PARTY_MAX) return toast('Your party is full.');
    const b = S.bots.find((x) => x.id === botId); if (!b) return;
    if (S.wparty && S.wparty.members.some((m) => m.bot.id === botId)) return toast(`${b.name} is already in your party.`);
    if (!B.onlineIn(S, P.place, new Date(now())).some((x) => x.id === botId)) return toast(`${b.name} isn't here.`); // only someone where you are (#304)
    if ((S.flags.invitedAt || {})[botId] > now() - 20000) return toast(`You already invited ${b.name}.`);
    const ia = {}; for (const [k, v] of Object.entries(S.flags.invitedAt || {})) if (v > now() - 20000) ia[k] = v; // only the ones still waiting (#376)
    ia[botId] = now(); S.flags.invitedAt = ia;
    const diff = Math.abs(b.level - P.level);
    const yes = Math.random() < (diff <= 3 ? 0.75 : diff <= 5 ? 0.35 : 0.05);
    sys(`You invite ${b.name} to your party.`); // the world party is a party; a group is the group finder (#400)
    S.pending.push({ at: now() + rnd(1500, 3500), bot: b.id, ch: 'whisper', text: yes ? cpick(['sure', 'ok!', 'yeah why not', 'sure, same quest']) : cpick(['no ty', 'soloing sry', 'nah', 'too low lol']),
      onPost: () => { if (!G.S) return; if (!yes) return toast(`${b.name} said no.`); if (G.partyBlock()) return toast(`${b.name} can't join: you're ${G.S.run || G.S.queue ? 'in the group finder' : 'in PvP'}.`); toast(addToParty(b) ? `${b.name} joined your party.` : 'Your party is full.'); } }); // the answer on screen, not only in a whisper (#369); a join only when it happened (#386)
  };
  G.acceptPartyInvite = function (botId) {
    const S = G.S; const b = S.bots.find((x) => x.id === botId); if (!b) return;
    S.flags.pendingInvite = null;
    const why = G.partyBlock(); if (why) return toast(why); // #446
    addToParty(b);
    if (Math.random() < 0.35) { const friend = B.onlineIn(S, S.player.place, new Date()).find((x) => x.id !== b.id && Math.abs(x.level - S.player.level) <= 3 && B.factionOf(x) === B.factionOf(b)); if (friend) setTimeout(() => G.S && G.S.wparty && !G.partyBlock() && addToParty(friend), 2500); }
  };
  G.declinePartyInvite = function (botId) {
    const S = G.S; S.flags.pendingInvite = null;
    S.flags.declined = (S.flags.declined || []).concat([botId]).slice(-60);
    S.flags.nextInvite = now() + DECLINE_GAP;
  };
  G.setInvites = function (on) { G.S.flags.noInvites = !on; emit('change'); };
  function partyTick() {
    const S = G.S, P = S.player, t = now();
    if (S.wparty) {
      if (S.wparty.meet) { if (P.place === S.wparty.place) S.wparty.meet = false; }
      else if (P.place !== S.wparty.place) return disbandParty('You left the area, so your party went their own way.');
      if (t >= S.wparty.until && !G.fight) return disbandParty('Your party has disbanded.');
      // members recover between fights
      for (const m of S.wparty.members) if (m.hp != null) { const st = E.statsFor(m); m.hp = Math.min(st.maxHp, m.hp + st.maxHp * 0.06); if (m.hp >= st.maxHp) m.hp = null; if (m.res != null) m.res = null; }
      return;
    }
    // an invite never answered (a reload, a dialog that replaced it) stops waiting after 2 minutes (#353)
    if (S.flags.pendingInvite && t - (S.flags.pendingAt || 0) > 120000) S.flags.pendingInvite = null;
    // invites: rare, never while busy, never twice from someone you declined
    if (S.flags.noInvites || G.fight || S.run || S.queue || P.travel || P.ghostUntil || S.flags.pendingInvite) return;
    const pl = D.PLACES[P.place]; if (!pl || pl.safe) return;
    if (!S.flags.nextInvite) S.flags.nextInvite = t + rnd(3, 6) * 60000;
    if (t < S.flags.nextInvite) return;
    S.flags.nextInvite = t + INVITE_GAP;
    const declined = new Set(S.flags.declined || []);
    const myF = (D.RACES[P.race] || {}).faction || 'alliance';
    const cand = B.onlineIn(S, P.place, new Date(t)).filter((b) => Math.abs(b.level - P.level) <= 3 && !declined.has(b.id) && B.factionOf(b) === myF);
    if (!cand.length || Math.random() > 0.85) return;
    const b = pick(cand);
    if (G.partyBlock()) return; // not in PvP (#446); checked after the draws, so the random stream stays the same
    S.flags.pendingInvite = b.id; S.flags.pendingAt = t;
    emit('partyInvite', { bot: b, why: `also hunting in ${pl.name}` });
  }
  G.partyTick = partyTick;

  // ============================================================ group finder
  G.role = function () { const P = G.S.player; return P.role || D.CLASSES[P.cls].role; };
  G.roles = function () { const C = D.CLASSES[G.S.player.cls]; return C.roles || [C.role]; };
  G.setRole = function (r) { if (G.roles().includes(r) && !G.S.queue && !G.S.run) { G.S.player.role = r; emit('change'); } };
  // Group finder rules (2026-09-27): any faction may run any dungeon or elite, but only from its zone:
  // you have to be there. Places you have no road to yet stay hidden (the factions' roads meet in later zones).
  // Leaving a run early = deserter: 5 min, none once the group has wiped (#283: a wipe is a fair reason to go)
  const DESERTER = 5 * 60000;
  G.deserterFor = (R) => (!R || R.phase === 'done' || R.wipes - (R.reloadWipes || 0) > 0 ? 0 : DESERTER); // a wipe from reopening the app is no reason to leave free (#425)
  const reach = {};
  G.reachableRegions = function (from) {
    const key = from + ':' + G.myFaction() + ':' + (G.stormBroken() ? 1 : 0);
    if (reach[key]) return reach[key];
    const seen = new Set([from]), q = [from], regions = new Set();
    // roads through enemy towns are closed
    while (q.length) { const k = q.shift(); regions.add(D.PLACES[k].region); for (const to in (D.PLACES[k].links || {})) if (D.PLACES[to] && !seen.has(to) && !G.enemyTown(to) && !G.stormBlocks(to)) { seen.add(to); q.push(to); } }
    regions.places = seen;
    return (reach[key] = regions);
  };
  // the entrance itself must be reachable, not just its zone (the Vaskar foothills are Greymead, but Ashwick is not reachable from there)
  G.canReach = (from, place) => G.reachableRegions(from).places.has(place);
  // ============================================================ Trials (v10.4): level-60 challenge runs in monthly
  // seasons. The calendar, picks, rating and leaderboard are in src/trials.js; this is the character's side.
  const TR = () => root.TRIALS;
  // this character's record for the current month; when a new month starts, the old one goes into its history
  G.trials = function () {
    const P = G.S.player, T = TR(), k = T.season(new Date());
    const Rec = P.trials = P.trials || { season: k, best: {}, open: {}, week: null, history: [], bestEver: 0, bestRank: null };
    // the clock set back into the month just closed: that month comes back as it was, and its history entry goes (#472)
    if (k < Rec.season && Rec.prev && Rec.prev.season === k) {
      if (Rec.history[0] && Rec.history[0].season === k) Rec.history.shift();
      Object.assign(Rec, Rec.prev); Rec.prev = null;
    }
    if (k > Rec.season) { // only a later month closes one; an earlier one keeps this record (#472)
      Rec.prev = Object.keys(Rec.best).length ? { season: Rec.season, best: Rec.best, open: Rec.open, week: Rec.week, bestRank: Rec.bestRank } : null;
      if (Rec.season >= -1 && Object.keys(Rec.best).length) {
        const picks = T.picks(Rec.season, G.myFaction()), rating = T.rating(Rec.best, picks);
        const board = T.board(G.S.bots, rating, P.name, new Date(T.end(Rec.season) - 1000));
        Rec.history.unshift({ season: Rec.season, name: T.name(Rec.season), rating, rank: board.rank, of: board.of, best: Math.max(0, ...Object.values(Rec.best).map((b) => b.lvl)), picks });
        if (Rec.season >= 0 && (Rec.bestRank == null || board.rank < Rec.bestRank)) Rec.bestRank = board.rank; // the Preseason gives no rank title
      }
      Object.assign(Rec, { season: k, best: {}, open: {}, week: null });
    }
    return Rec;
  };
  G.trialPicks = () => TR().picks(TR().season(new Date()), G.myFaction());
  G.trialRating = () => TR().rating(G.trials().best, G.trialPicks());
  G.trialBoard = () => TR().board(G.S.bots, G.trialRating(), G.S.player.name, new Date());
  G.trialBlock = function (act) {
    const S = G.S, P = S.player, T = TR(), A = D.ACTIVITIES[act];
    if (!T.open(T.season(new Date()))) return `Trials begin on 1 ${T.name(0)}`;
    if (P.level < D.LEVEL_CAP) return `Trials open at level ${D.LEVEL_CAP}`;
    if (!G.trialPicks().includes(act)) return 'Not in this month\'s Trials';
    if (A.where && G.stormBlocks(A.where)) return 'Requires Veshmira\'s defeat: her storm hides the isle';
    if ((S.flags.deserterUntil || 0) > now()) return `Deserter: ${Math.ceil((S.flags.deserterUntil - now()) / 60000)} min`;
    return null;
  };
  // the highest level you may start: one past your best in time here, and never more than 2 below your best elsewhere
  G.trialMax = function (act) { const Rec = G.trials(), any = Math.max(1, ...Object.values(Rec.open)); return Math.max(Rec.open[act] || 1, any - 2, 1); };
  G.queueTrial = function (act, lvl) {
    const S = G.S, why = G.trialBlock(act);
    if (why) { toast(why + '.'); return false; }
    if (S.group || G.groupBusy()) { toast('Leave your current group first.'); return false; }
    lvl = clamp(Math.round(lvl || 1), 1, G.trialMax(act));
    if (S.wparty) disbandParty('You left your party for a Trial.');
    const role = G.role(), wait = role === 'tank' ? rnd(4, 10) : role === 'healer' ? rnd(6, 15) : rnd(15, 45);
    S.queue = { act, since: now(), popAt: now() + wait * 1000, trial: lvl };
    sys(`You are queued for ${D.ACTIVITIES[act].name}, Trial ${lvl}.`);
    emit('change');
    return true;
  };
  // a Trial cleared: best level, the next levels open, Mentor Marks, the weekly goal
  // the Trialsworn set: each piece earned once for the whole account (account.trialsworn), the first time any character
  // beats its Trial level in time; the Charger then rides with every character (added when one loads)
  G.trialswornCheck = function (lvl) {
    const a = G.account(), got = a.trialsworn = a.trialsworn || {}, won = [];
    for (const [k, R] of Object.entries(D.TRIALSWORN)) {
      if (got[k] || R.lvl == null || lvl < R.lvl) continue; // (the yearly mount has no level: G.yearMountCheck)
      got[k] = true; won.push(k);
    }
    if (!won.length) return;
    G.saveAccount(a);
    for (const k of won) {
      const R = D.TRIALSWORN[k];
      for (const id of R.looks || []) G.collectLook(D.ITEMS[id]);
      if (R.mount) G.giveTrialswornMount(R.mount);
      loot(k === 'cloak' ? `Trialsworn: the ${B.link('Trialsworn Cloak', 4)} joins your wardrobe.` : k === 'weapons' ? `Trialsworn: a Trialsworn weapon look for every weapon type joins your wardrobe.` : k === 'mount' ? `Trialsworn: the ${D.MOUNTS[R.mount].name} is yours, on every character.`
        : `Trialsworn: the whole set ${k === 't15' ? 'glows' : 'shines'} now. ${k === 't15' ? 'Glowing' : 'Radiant'} looks for the cloak and every weapon, and the ${D.MOUNTS[R.mount].name}, for every character.`);
    }
  };
  // this month's cloak: beat Trial 10 in time during the month (earned once per month, per account)
  G.monthCloak = function (season) { const id = Object.keys(D.ITEMS).find((i) => D.ITEMS[i].month === season && D.ITEMS[i].lookOnly); return id ? D.ITEMS[id] : null; };
  G.MONTH_FALLBACK_MARKS = 40;
  G.monthCloakCheck = function (lvl, season) {
    if (lvl < 10 || season < 0) return; // not in the Preseason
    const it = G.monthCloak(season);
    if (it) { if (G.collectLook(it)) { const a = G.account(), tw = a.trialsworn = a.trialsworn || {}; (tw.earned = tw.earned || []).push(season); G.saveAccount(a); loot(`Trialsworn: this month's cloak, the ${B.link(it.name, 4)}, joins your wardrobe.`); G.yearMountCheck(); } return; }
    // a month without a planned cloak (validate warns months ahead): Marks instead, once per month per account
    const a = G.account(), tw = a.trialsworn = a.trialsworn || {}, paid = tw.monthPaid = tw.monthPaid || [];
    if (paid.includes(season)) return;
    paid.push(season); G.saveAccount(a); G.addMarks(G.MONTH_FALLBACK_MARKS, "this month's Trial 10 (no cloak this month)");
  };
  // catch-up (his call, 2026-10-01): once a month is over, its cloak is sold for Mentor Marks at the Mentor
  // Quartermaster; the month itself is still earned. The wardrobe says which were earned and which were bought.
  G.MONTH_CLOAK_COST = 150;
  G.pastMonthCloaks = function () { const now0 = TR().season(new Date()); return Object.keys(D.ITEMS).filter((i) => D.ITEMS[i].lookOnly && D.ITEMS[i].month != null && D.ITEMS[i].month < now0).sort((a, b) => D.ITEMS[a].month - D.ITEMS[b].month); };
  G.buyMonthCloak = function (id) {
    const it = D.ITEMS[id], a = G.account();
    if (!it || !G.pastMonthCloaks().includes(id)) return toast('That cloak is earned in its own month.');
    if ((a.looks || []).includes(it.look.join(':'))) return toast('You have that cloak already.');
    if (a.marks < G.MONTH_CLOAK_COST) return toast(`You need ${G.MONTH_CLOAK_COST} Mentor Marks.`);
    a.marks -= G.MONTH_CLOAK_COST; const tw = a.trialsworn = a.trialsworn || {}; (tw.bought = tw.bought || []).push(it.month); G.saveAccount(a);
    G.collectLook(it); loot(`Bought ${B.link(it.name, 4)} (${G.MONTH_CLOAK_COST} Mentor Marks). Added to your wardrobe.`); G.yearMountCheck(); emit('change');
  };
  // the yearly mount: every cloak of that year's 12 months in the wardrobe (earned or bought) gives it to every character
  G.yearCloaks = (yr) => { const [a, b] = D.TRIALSWORN[yr].year; return Object.keys(D.ITEMS).filter((i) => D.ITEMS[i].lookOnly && D.ITEMS[i].month != null && D.ITEMS[i].month >= a && D.ITEMS[i].month <= b); };
  G.yearMountCheck = function () {
    const a = G.account(), got = a.trialsworn = a.trialsworn || {}, have = new Set(a.looks || []);
    for (const [k, R] of Object.entries(D.TRIALSWORN)) {
      if (!R.year || got[k]) continue;
      const ids = G.yearCloaks(k); if (!ids.length || !ids.every((i) => have.has(D.ITEMS[i].look.join(':')))) continue;
      got[k] = true; G.saveAccount(a); G.giveTrialswornMount(R.mount);
      loot(`Trialsworn: all 12 cloaks! New mount: ${D.MOUNTS[R.mount].name} (all characters).`);
    }
  };
  G.giveTrialswornMount = function (k) {
    const P = G.S && G.S.player; if (!P) return;
    P.mounts = P.mounts || []; if (!P.mounts.includes(k)) P.mounts.push(k);
  };
  // the Trial find for this dungeon (#31): its own effect item if your class can use it and you don't own it, else the
  // first such item from this season's other Trial dungeons (in the season's order, so the briefing and the roll agree),
  // else null (every find you can use this season is yours). Content-proof: the season's list decides.
  G.trialFindFor = function (act) {
    const ok = (id) => id && D.ITEMS[id] && G.canUseItem(D.ITEMS[id]) && !G.ownsItem(id);
    const own = D.TRIAL_FIND && D.TRIAL_FIND[act]; if (!own) return null;
    if (ok(own)) return own;
    // another of the season's finds, the one that suits you best: an effect for your role (healing, tank, damage) first,
    // then your class's stats (its affix, as #13's fitted gear); ties in the season's order
    const aff = G.classAffix(G.S.player.cls), role = { healer: 'healing', tank: 'tank', dps: 'damage' }[G.role()];
    const score = (id) => { const it = D.ITEMS[id], F = D.EFFECTS[it.effect] || {}; return (F.role === role ? 2 : 0) + (aff && Object.keys(it.stats || {}).some((k) => aff.stats[k]) ? 1 : 0); };
    const rest = G.trialPicks().filter((a) => a !== act && ok(D.TRIAL_FIND[a])).map((a) => D.TRIAL_FIND[a]);
    return rest.map((id, i) => ({ id, i, s: score(id) })).sort((x, y) => y.s - x.s || x.i - y.i).map((x) => x.id)[0] || null;
  };
  G.trialDone = function (R, secs, par) {
    const T = TR(), Rec = G.trials(), lvl = R.trial.lvl, act = R.act;
    if (R.trial.season !== Rec.season) { sys('The month turned during your run: it counts for the old Trials.'); return null; }
    const timed = secs <= par, great = secs <= par * 0.8, b = Rec.best[act];
    if (!b || lvl > b.lvl || (lvl === b.lvl && timed && !b.timed)) Rec.best[act] = { lvl, timed, secs: Math.round(secs) };
    if (timed) { Rec.open[act] = Math.max(Rec.open[act] || 1, lvl + (great ? 2 : 1)); Rec.bestEver = Math.max(Rec.bestEver || 0, lvl); }
    G.addMarks(5 + lvl, `Trial ${lvl}`);
    const per = T.period(new Date()).id;
    if (!Rec.week || per > Rec.week.id) Rec.week = { id: per, n: 0, paid: false }; // a clock set back keeps the week and what it paid (#471)
    if (lvl >= R.trial.bestHere) Rec.week.n++;
    if (Rec.week.n >= 4 && !Rec.week.paid) { Rec.week.paid = true; G.addMarks(25, 'this week\'s Trials goal'); }
    if (timed) { G.trialswornCheck(lvl); G.monthCloakCheck(lvl, R.trial.season); }
    // a Trial find (#22, #31): 1 in 5 on a timed clear, the find G.trialFindFor names (one you can use and don't own);
    // with nothing left to find this season, the roll pays the Trial's Marks again
    if (timed && D.TRIAL_FIND && D.TRIAL_FIND[act] && Math.random() < D.TRIAL_FIND_CHANCE) {
      const fid = G.trialFindFor(act);
      if (fid) { const it = G.copyItem(fid); G.giveReward(it, 'Trial find'); loot(`Trial find: ${B.link(it.name, it.q)}, beaten in time.`); R.trialFind = fid; }
      else { G.addMarks(5 + lvl, 'a Trial find, with every find you can use this season already yours'); R.trialFindMarks = 5 + lvl; }
    }
    const res = { lvl, timed, great, open: Rec.open[act] || 1, rating: G.trialRating() };
    sys(timed ? `Trial ${lvl} beaten in time${great ? ' by a wide margin' : ''}! Trial ${res.open} is open here. Rating ${res.rating}.` : `Trial ${lvl} cleared, but over par: your level here stays. Rating ${res.rating}.`);
    return (R.trialResult = res);
  };
  // everything the group finder's row and briefing name for an activity: its name and description, where it is, pull
  // labels, creatures and boss loot (#58: one text, so the list, the briefing and tools/lorekeeper.js judge the same words)
  const actText = {}; // the data never changes while the game runs
  G.activityText = function (act) {
    if (actText[act] != null) return actText[act];
    const A = D.ACTIVITIES[act], Dg = A.dungeon && D.DUNGEONS[A.dungeon], pulls = (Dg && Dg.pulls) || A.pulls || [];
    const loot = pulls.filter((p) => p.boss).flatMap((p) => p.mobs.flatMap((m) => (D.MOBS[m] || {}).loot || [])).map((id) => (D.ITEMS[id] || {}).name);
    return (actText[act] = [A.name, A.desc, A.where && D.PLACES[A.where] ? D.PLACES[A.where].name : null, ...pulls.map((p) => p.label), ...pulls.flatMap((p) => p.mobs.map((m) => (D.MOBS[m] || {}).name)), ...loot].filter(Boolean).join('. '));
  };
  G.activityBlock = function (act) {
    const S = G.S, P = S.player, A = D.ACTIVITIES[act];
    if (A.event) { // a festival's run (v10.13): only while it is on, at your own level, queued from anywhere
      if (!G.eventLive(A.event)) return 'hidden';
      if (A.finale && !G.lnFinale()) return 'Opens on 31 December, the New Year finale';
      if (P.level < A.minLvl) return `Requires level ${A.minLvl}`;
      if ((S.flags.deserterUntil || 0) > now()) return `Deserter: ${Math.ceil((S.flags.deserterUntil - now()) / 60000)} min`;
      return null;
    }
    const region = A.where && D.PLACES[A.where].region;
    if (A.where && G.stormBlocks(A.where) && P.level >= 60) return 'Requires Veshmira\'s defeat: her storm hides the isle'; // listed, but no group or summon can take you there
    if (A.where && !G.canReach(P.place, A.where)) return 'hidden';
    if (A.needQuest && !P.quests[A.needQuest]) return 'hidden'; // a legend's story fight shows only while you're on it
    if (A.worldBoss && G.worldBoss() !== act) return 'hidden'; // only this week's world boss is out
    if (!G.nameable(G.activityText(act), P.level)) return 'hidden'; // its row or briefing would name a secret at this level (#58: "Veshmira's Lair", the Sunken Archive's boss)
    if (P.level < A.minLvl) return `Requires level ${A.minLvl}`;
    // at the level cap, dungeons and raids queue from anywhere and the group summons you (v10.7: travel is for the world,
    // not for the endgame); levelling characters and open-world Wanted targets still go there
    if (region && region !== (D.PLACES[P.place] || {}).region && !(A.dungeon && P.level >= D.LEVEL_CAP)) return `Go to ${D.REGIONS[region].name} to join`;
    if ((S.flags.deserterUntil || 0) > now()) return `Deserter: ${Math.ceil((S.flags.deserterUntil - now()) / 60000)} min`;
    return null;
  };
  G.syncLevel = (act) => (G.S.run && G.S.run.trial && G.S.run.act === act ? D.LEVEL_CAP : Math.min(G.S.player.level, D.ACTIVITIES[act].maxLvl || D.LEVEL_CAP)); // a Trial is fought at the cap
  // Hard raids (v10.7): a raid with a `hard` block opens it on this character after one Normal clear, at the level cap
  G.hardOpen = function (act) {
    const A = D.ACTIVITIES[act], Dg = A && A.dungeon && D.DUNGEONS[A.dungeon], cx = ((G.S.player.codex || {})[act]) || {};
    return !!(Dg && Dg.hard && G.S.player.level >= D.LEVEL_CAP && cx.clears);
  };
  // this week's Hard bonus: each boss drops its loot two upgrade steps up once per week (P.raidWeek, reset on Monday)
  G.raidWeek = function () { const P = G.S.player; if (!P.raidWeek || !(P.raidWeek.week >= weekKey())) P.raidWeek = { week: weekKey(), got: {} }; return P.raidWeek; }; // only a later week resets it: a clock moved back and forth never does (#402)
  G.hardBonusLeft = (act, boss) => !G.raidWeek().got[act + ':' + boss];
  G.HARD_STEPS = 2;
  // The featured raid (v10.7): one raid a week, worked out from the date and the data so every device agrees and it
  // never changes mid-week. A raid joins on its `since` date (the raids that shipped before this are from RAID_START);
  // one that joined during last week is featured the first full week after, newest first; otherwise they take turns.
  // Its first clear that week (Normal or Hard) pays FEATURED_MARKS and a look from its set you do not have yet, if it
  // has looks (docs/plans/2026-09-30-horizontal-progression-design.md, section 3).
  G.RAID_START = '2026-09-28'; G.FEATURED_MARKS = 30;
  const mondayOf = (d) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - (x.getDay() + 6) % 7); return x; };
  const dayNum = (x) => Math.round(new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime() / 86400000);
  const sinceDay = (str) => { const [y, m, d] = str.split('-').map(Number); return dayNum(new Date(y, m - 1, d)); };
  G.raidActs = () => Object.keys(D.ACTIVITIES).filter((k) => { const A = D.ACTIVITIES[k], Dg = A.dungeon && D.DUNGEONS[A.dungeon]; return Dg && Dg.raid && !A.needQuest; });
  G.featuredRaid = function (date) {
    const ws = dayNum(mondayOf(date || new Date(now()))), since = (k) => sinceDay(D.DUNGEONS[D.ACTIVITIES[k].dungeon].since || G.RAID_START);
    const open = G.raidActs().filter((k) => since(k) <= ws).sort((a, b) => since(a) - since(b) || (a < b ? -1 : 1));
    if (!open.length) return null;
    const fresh = open.filter((k) => since(k) > ws - 7 && since(k) > sinceDay(G.RAID_START));
    if (fresh.length) return fresh[fresh.length - 1];
    return open[Math.floor((ws - sinceDay(G.RAID_START)) / 7) % open.length];
  };
  G.featuredClaimed = () => !!G.raidWeek().featured;
  // ---- weekly bonuses (#541): a This week banner may carry `bonus`; the bonus is on while that banner is. Its week runs
  // Saturday to Friday (the release day), apart from the Monday resets above.
  G.weekBonus = (name, date) => G.weekBanners(date).some((b) => b.bonus === name);
  const saturdayOf = (d) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - (x.getDay() + 1) % 7); return x; };
  G.bonusWeekId = (date) => 'b' + dayNum(saturdayOf(date || new Date(now())));
  // Featured dungeons: one old dungeon per level band, picked from the date like the featured raid (every device agrees, nothing
  // moves mid-week, a dungeon added later joins its band from the week after its `since`). Its speed and flawless
  // rewards pay FD_MULT, and the first clear of one in the bonus week pays FD_MARKS (at 60) or gold and a green.
  G.FD_BANDS = [22, 33, 51]; G.FD_MULT = 1.5; G.FD_MARKS = 15; G.FD_START = '2026-11-07';
  G.dungeonActs = () => Object.keys(D.ACTIVITIES).filter((k) => { const A = D.ACTIVITIES[k], Dg = A.dungeon && D.DUNGEONS[A.dungeon]; return Dg && !Dg.raid && !A.event && !A.worldBoss && !A.needQuest; });
  const fdBand = (lvl) => G.FD_BANDS.filter((b) => lvl >= b).length;
  G.featuredDungeons = function (date) {
    const d = date || new Date(now()), ws = dayNum(saturdayOf(d)), n = Math.floor((ws - sinceDay(G.FD_START)) / 7);
    const since = (k) => sinceDay(D.DUNGEONS[D.ACTIVITIES[k].dungeon].since || G.FD_START);
    // only what your faction can walk to from its capital, never the storm isle (locked until Veshmira falls): each
    // faction has its own set, the same for every character of it all week
    const home = D.RACES[Object.keys(D.RACES).find((r) => D.RACES[r].faction === G.myFaction())].start;
    const open = (k) => { const w = D.ACTIVITIES[k].where; return !!w && !G.stormIsle(w) && G.canReach(home, w); };
    const out = [];
    for (let b = 0; b <= G.FD_BANDS.length; b++) {
      const pool = G.dungeonActs().filter((k) => fdBand(D.ACTIVITIES[k].minLvl) === b && since(k) <= ws && open(k)).sort((x, y) => D.ACTIVITIES[x].minLvl - D.ACTIVITIES[y].minLvl || (x < y ? -1 : 1));
      if (pool.length) out.push(pool[((n % pool.length) + pool.length) % pool.length]);
    }
    return out;
  };
  G.featuredDungeonsOn = (date) => G.weekBonus('featured_dungeons', date);
  G.isFeaturedDungeon = (act, date) => G.featuredDungeonsOn(date) && G.featuredDungeons(date).includes(act);
  G.featuredDungeonFor = (lvl, date) => (G.featuredDungeonsOn(date) ? G.featuredDungeons(date)[Math.min(fdBand(lvl), G.featuredDungeons(date).length - 1)] : null); // the one for your level
  G.featuredDungeonClaimed = () => (G.S.player.featuredDg || null) === G.bonusWeekId();
  // world bosses (v10.7): one a week, the same rule as the featured raid (from the date and each one's `since`)
  G.WB_START = '2026-10-05'; G.WB_MARKS = 20;
  G.worldBossActs = () => Object.keys(D.ACTIVITIES).filter((k) => D.ACTIVITIES[k].worldBoss);
  G.worldBoss = function (date) {
    const ws = dayNum(mondayOf(date || new Date(now()))), since = (k) => sinceDay(D.ACTIVITIES[k].since || G.WB_START);
    const open = G.worldBossActs().filter((k) => since(k) <= ws).sort((a, b) => since(a) - since(b) || (a < b ? -1 : 1));
    if (!open.length) return null;
    const fresh = open.filter((k) => since(k) > ws - 7 && since(k) > sinceDay(G.WB_START));
    if (fresh.length) return fresh[fresh.length - 1];
    return open[Math.floor((ws - sinceDay(G.WB_START)) / 7) % open.length];
  };
  G.worldBossLooted = (act) => !!(G.raidWeek().wb || {})[act];
  // the looks in a raid's set that this account does not have yet, those this class can wear first
  G.raidLooksLeft = function (act) {
    const Dg = D.DUNGEONS[D.ACTIVITIES[act].dungeon], have = new Set(G.account().looks || []), ids = new Set();
    for (const p of Dg.pulls) for (const m of p.mobs) for (const id of (D.MOBS[m].loot || [])) ids.add(id);
    const left = [...ids].filter((id) => D.ITEMS[id].look && !have.has(D.ITEMS[id].look.join(':')));
    return left.sort((a, b) => (G.canUseItem(D.ITEMS[b], G.S.player.cls) ? 1 : 0) - (G.canUseItem(D.ITEMS[a], G.S.player.cls) ? 1 : 0));
  };
  function featuredClear(act) {
    const P = G.S.player; if (P.level < D.LEVEL_CAP || act !== G.featuredRaid() || G.featuredClaimed()) return;
    G.raidWeek().featured = true;
    G.addMarks(G.FEATURED_MARKS, 'the featured raid');
    const left = G.raidLooksLeft(act);
    if (left.length && G.collectLook(D.ITEMS[left[0]])) loot(`Featured raid: new look ${B.link(D.ITEMS[left[0]].name, D.ITEMS[left[0]].q)}.`);
  }
  // a Normal raid boss's own extra mechanic (#215: Veshmira's breath), shown and fought like Hard's; a Trial has none
  G.normalExtra = function (act, boss) { const Dg = D.DUNGEONS[D.ACTIVITIES[act].dungeon], x = Dg && Dg.extra && Dg.extra[boss]; return x ? x.map((e) => Object.assign({}, e)) : null; };
  G.hardExtra = function (act, boss) { const Dg = D.DUNGEONS[D.ACTIVITIES[act].dungeon], x = Dg && Dg.hard && Dg.hard.extra && Dg.hard.extra[boss]; return x ? x.map((e) => Object.assign({}, e)) : null; };
  G.hardCopy = function (id) {
    const it = G.copyItem(id), inf = G.upgradeInfo(it);
    if (!inf.ok) return it;
    const out = G.upgradedCopy(it, inf.pts + G.HARD_STEPS * D.UPGRADE.step * G.upgradeRef(it), true); out.hard = true; // past the ceiling (#581)
    if (it.look) out.look = [it.look[0], it.look[1] + '_hard']; // the Hard recolour of the raid's set
    return out;
  };
  // Trial loot (#184): a Trial's final boss drops its blue-or-better items as level-60 items, the dungeon's own (name, look,
  // stat mix) scaled to the power of a level-60 dungeon blue of that slot and kind, never above it (raids stay the top, #180)
  G.trialCopy = function (id) {
    const it = G.copyItem(id), L = D.LEVEL_CAP;
    if (!(it.q >= 3) || (it.lvl || 0) >= L || !D.GEAR_SLOTS.includes(it.slot)) return it;
    const ref = G.genGear(it.slot, L, 3, it.wtype ? { wtype: it.wtype } : it.atype ? { atype: it.atype } : {}), p0 = G.itemPoints(it), f = p0 > 0 ? G.itemPoints(ref) / p0 : 1;
    if (f > 1) {
      for (const k in it.stats || {}) it.stats[k] = Math.max(1, Math.round(it.stats[k] * f));
      if (it.sp) it.sp = Math.round(it.sp * f);
    }
    if (it.armor && ref.armor > it.armor) it.armor = ref.armor; // armour and weapon damage: a level-60 blue's, at the item's own speed
    if (it.dmg && ref.dmg) { const dps = (ref.dmg[0] + ref.dmg[1]) / 2 / ref.speed, sp = it.speed || ref.speed, d = [Math.max(1, Math.round(dps * sp * 0.7)), Math.max(2, Math.round(dps * sp * 1.3))]; if (d[0] + d[1] > it.dmg[0] + it.dmg[1]) it.dmg = d; }
    it.lvl = L; it.sell = Math.max(it.sell || 0, ref.sell); it.trial60 = true;
    return it;
  };
  G.queueFor = function (act, opts) {
    const S = G.S, A = D.ACTIVITIES[act], hard = !!(opts && opts.hard);
    const why = G.activityBlock(act);
    if (why) return toast(why === 'hidden' ? 'Only for the other faction.' : why + '.');
    if (hard && A.event && !(A.event === 'longnight' ? G.lnHardOpen(act) : G.lwHardOpen())) return toast('Hard opens after one Normal clear of ' + A.name + '.');
    if (hard && !A.event && !G.hardOpen(act)) return toast('Hard opens after a Normal clear at level ' + D.LEVEL_CAP + '.');
    if (G.fight) return toast('Finish the fight first.'); // refused before the party breaks up (#423)
    if (S.run || S.group || G.bgBusy() || (S.brawl && S.brawl.phase !== 'done')) return toast('Leave your current group first.');
    if (S.wparty) disbandParty('You left your party to use the group finder.');
    if (S.bg) G.leaveBg(); // a finished battleground's result closes as you queue
    const role = G.role();
    const wait = role === 'tank' ? rnd(4, 12) : role === 'healer' ? rnd(8, 20) : rnd(25, 70);
    S.queue = { act, since: now(), popAt: now() + wait * 1000, hard: hard || undefined };
    sys(`You are queued for ${A.name}${hard ? ' (Hard)' : ''} as ${role === 'tank' ? 'Tank' : role === 'healer' ? 'Healer' : 'Damage'}.`);
    emit('change');
  };
  G.leaveQueue = function () { G.S.queue = null; sys('You left the queue.'); emit('change'); };
  // Who you ran with (#72): each roster person keeps what they did with this character, for the player card (#84) and the
  // chat (#73): runs finished together, the last one, where, and whether they ninja'd your loot. Bounded at 300 people.
  G.MET_MAX = 300;
  G.remember = function (bot, what) {
    const S = G.S, P = S.player; if (!bot || !(bot.id >= 0)) return;
    // someone from another realm (the group finder) is kept by name and realm, never by an id that means no one here (#363)
    const away = !S.bots.some((b) => b.id === bot.id); if (away && !(bot.realm && bot.name)) return;
    const M = away ? (P.metAway = P.metAway || {}) : (P.met = P.met || {}), key = away ? `${bot.name}-${bot.realm}` : bot.id, m = M[key] = M[key] || { n: 0 };
    if (what.run) { m.n++; m.last = now(); m.where = what.run; if (what.wipes) m.wipes = (m.wipes || 0) + what.wipes; }
    if (what.ninja) { m.ninja = (m.ninja || 0) + 1; m.last = m.last || now(); } // dated, or the trim drops it first (#310)
    const max = away ? G.MET_MAX / 3 : G.MET_MAX, ids = Object.keys(M); if (ids.length > max) { ids.sort((a, b) => (M[a].last || 0) - (M[b].last || 0)); for (const id of ids.slice(0, ids.length - max)) delete M[id]; }
  };
  G.metWith = (botId, bot) => ((G.S.player.met || {})[botId]) || (bot && bot.realm && bot.name && !G.S.bots.some((b) => b.id === botId) ? (G.S.player.metAway || {})[`${bot.name}-${bot.realm}`] : null) || null;
  const OTHER_REALMS = ['Mistral', 'Hearthwick', 'Thornbury', 'Copperbell', 'Saltwind', 'Longwinter']; // our own realm names (v10)
  // #582: the group finder's gear floor, like a real finder's item level: a Normal raid takes players in Rare gear, a Hard
  // raid (which needs a Normal clear) players in Epic. The floor comes from what you queue for, never from your own gear
  G.gearFloor = (act, hard) => { const A = D.ACTIVITIES[act]; return A && A.size === 10 && !A.bg && !A.worldBoss && !A.scale ? (hard ? 4 : 3) : 0; };
  function recruit(role, lvl, used, usedCls, guild, exact) { // exact: only players at this level (Trials: the cap)
    const S = G.S, date = new Date();
    const want = role === 'tank' ? ['warrior', 'warrior', 'paladin'].concat(lvl >= 10 ? ['druid'] : []) : role === 'healer' ? ['priest', 'priest', 'paladin', 'druid', 'shaman', 'bard'] : ['mage', 'rogue', 'rogue', 'mage', 'warrior', 'warlock', 'warlock', 'hunter', 'hunter', 'druid', 'shaman', 'priest', 'bard'];
    const myF = (D.RACES[S.player.race] || {}).faction || 'alliance';
    let pool = S.bots.filter((b) => B.isOnline(b, date) && B.factionOf(b) === myF && want.includes(b.cls) && (exact ? b.level === lvl : b.level >= lvl - 1 && b.level <= lvl + 3) && !used.has(b.id));
    // prefer classes the group does not have yet
    if (guild != null && guild >= 0) { const mates = pool.filter((b) => b.guild === guild); if (mates.length) pool = mates; }
    { const mains = pool.filter((b) => G.mainRole(b) === role); if (mains.length) pool = mains; } // asked for the role they play (#388)
    if (usedCls) { const fresh = pool.filter((b) => !usedCls.has(b.cls)); if (fresh.length) pool = fresh; }
    let b;
    if (pool.length) b = JSON.parse(JSON.stringify(pick(pool)));
    else {
      const nb = B.makeBot(S.nextBotId++, new Set(S.bots.map((x) => x.name)), { level: exact ? lvl : clamp(lvl + rint(-1, 1), 8, D.LEVEL_CAP) });
      const freshCls = usedCls ? want.filter((c) => !usedCls.has(c)) : want;
      nb.cls = pick(freshCls.length ? freshCls : want); nb.realm = pick(OTHER_REALMS);
      nb.race = myF === 'horde' ? pick(['orc', 'troll', 'tauren', 'undead']) : pick(['human', 'dwarf', 'gnome', 'nightelf']);
      b = nb;
    }
    used.add(b.id); if (usedCls) usedCls.add(b.cls);
    b.role = role;
    b.level = clamp(Math.max(b.level, lvl - 1), 1, D.LEVEL_CAP);
    return b;
  }
  // Bots wear effect items too (#56): from level 50 a bot sometimes wears one, about 1 in 4 at 60 with skill 0.8 (the game
  // designer's guess for the sim), fewer lower down or with less skill; at most one, fitting its role. It is the item a
  // player gets (its stats already pay for the effect), within 10 levels below the bot, in a slot the bot already fills
  // (chest, legs, feet, hands), so it is a trade like yours, never an extra piece of gear
  G.BOT_FX = { from: 50, at60: 0.25 };
  const BOT_FX_ROLES = { healer: ['healing'], tank: ['tank', 'survival'], dps: ['damage', 'resource', 'survival'] };
  G.botEffectItem = function (b) {
    if (!(b.level >= G.BOT_FX.from)) return null;
    const span = Math.max(1, D.LEVEL_CAP - G.BOT_FX.from), p = G.BOT_FX.at60 * (0.4 + 0.6 * Math.min(1, (b.level - G.BOT_FX.from) / span)) * Math.min(1.25, (b.skill == null ? 0.5 : b.skill) / 0.8);
    if (!(p > 0) || Math.random() >= p) return null; // a chance of 0 rolls nothing, so a sim that turns it off keeps its random numbers
    const C = D.CLASSES[b.cls], roles = BOT_FX_ROLES[b.role || C.role] || BOT_FX_ROLES.dps;
    const ids = Object.keys(D.ITEMS).filter((id) => { const it = D.ITEMS[id], F = it.effect && D.EFFECTS[it.effect], L = it.lvl || 1;
      return F && roles.includes(F.role) && ['chest', 'legs', 'feet', 'hands'].includes(it.slot) && (!it.atype || it.atype === C.armorType) && G.canUseItem(it, b.cls) && L <= b.level && L >= b.level - 10; });
    return ids.length ? G.copyItem(pick(ids)) : null;
  };
  // #582: a bot wears gear that fits its level: every slot, stats for its role, spell power for a healer or caster, and
  // the quality its skill earns (Rare above 0.72 skill 60% of the time, else Uncommon). Before, a bot had 5 pieces, often
  // Common with no stats, and never spell power, so a level-60 bot tank had about half a geared player's health
  const BOT_CASTER = { mage: 1, warlock: 1, priest: 1, druid: 1, shaman: 1, bard: 1 }; // their damage is spells (shaman and bard too)
  const BOT_EAGLE = { mage: 1, shaman: 1 }; // a damage caster whose class stats miss stamina (Owl) or intellect (Tiger)
  function botAffix(cls, role) {
    if (role === 'tank') return D.AFFIXES.find((a) => a.name === (cls === 'druid' ? 'of the Monkey' : 'of the Bear'));
    if (role === 'healer') return D.AFFIXES.find((a) => a.name === 'of the Eagle'); // stamina and intellect: a healer stands in the splash too
    return BOT_EAGLE[cls] ? D.AFFIXES.find((a) => a.name === 'of the Eagle') : G.classAffix(cls) || undefined;
  }
  function rollBotChar(b) {
    const C = D.CLASSES[b.cls], role = b.role || C.role || 'dps';
    const q = Math.max(b.skill > 0.72 ? (Math.random() < 0.6 ? 3 : 2) : 2, b.gearFloor || 0); // a raid only takes players in its gear (G.gearFloor)
    const wt = b.cls === 'paladin' ? 'mace' : role === 'healer' || b.cls === 'mage' || b.cls === 'warlock' ? 'staff' : C.weapons[0];
    // a careless player (skill 0.4 or less) wears whatever dropped: random stats on every piece and Common legs, hands and
    // waist (unless the content sets a gear floor), so a bad draw still costs the group something now that everyone wears gear of their level (a caster's gear still has its spell power)
    const careful = !(b.skill <= 0.4);
    const af = careful ? botAffix(b.cls, role) : undefined, sp = role === 'healer' || (role === 'dps' && BOT_CASTER[b.cls]) ? 0.5 : 0;
    const o = (x) => Object.assign({ affix: af }, sp ? { sp } : {}, x);
    const equip = { weapon: G.genGear('weapon', b.level, q, o({ wtype: wt })) };
    if (C.ranged || C.instrument) equip.ranged = G.genGear('ranged', b.level, q, o(C.instrument ? { wtype: 'instrument' } : {}));
    if (b.level >= 10 && q >= 3) {
      const wl = BOT_WEAPON_LOOKS[b.cls];
      const named = wl && wl.map((k) => Object.keys(D.ITEMS).find((id) => D.ITEMS[id].look && D.ITEMS[id].look[1] === k)).filter((id) => id && G.canUseItem(D.ITEMS[id], b.cls));
      // a bot wears a named item's look, with the stats of gear at its own level and quality (#45: a level-60 bot carried
      // a level-20 weapon's stats)
      const asLevel = (id, slot, x) => { const it = G.copyItem(id), g = G.genGear(slot, b.level, q, o(x)); for (const k of ['lvl', 'stats', 'armor', 'dmg', 'speed', 'sp', 'q']) { if (g[k] != null) it[k] = g[k]; else delete it[k]; } return it; };
      if (named && named.length && Math.random() < 0.6) { const id = pick(named); equip.weapon = asLevel(id, 'weapon', { wtype: D.ITEMS[id].wtype }); }
      if (Math.random() < 0.35) equip.back = asLevel('cape_brotherhood', 'back', {});
    }
    ['chest', 'legs', 'feet', 'hands', 'wrist', 'waist', 'back', 'finger'].forEach((s, i) => { if (!equip[s]) equip[s] = G.genGear(s, b.level, careful || !(i % 2) || i > 5 ? q : Math.max(1, b.gearFloor || 0), o({ atype: C.armorType })); }); // a careless player: Common legs, hands and waist, unless the content sets a floor
    { const fx = G.botEffectItem(b); if (fx) equip[fx.slot] = fx; } // sometimes an effect item, in place of one of those (#56)
    const talents = G.autoTalents(b.cls, b.role || (D.CLASSES[b.cls] || {}).role || 'dps', b.level, Math.abs(b.id || 0));
    return { name: b.name + (b.realm ? '-' + b.realm.replace(' ', '') : ''), cls: b.cls, race: b.race || 'human', level: b.level, equip, role: b.role, hp: null, res: null, auras: [], bot: b, talents };
  }
  // A person wears the same gear every time you meet them (#72): everything rolled for a bot's gear (quality, the named
  // look, the cape, an effect item, the item's own rolls) comes from a stream seeded by who they are, their level and
  // role, so a new level is a new set and the next run with them is the same one. Same chances as before, so the same
  // power band; a bot with no id (a guard) still rolls freely.
  const ROLE_N = { tank: 1, healer: 2, dps: 3 };
  // one main role a person always plays (#388): the group finder asks them for it, and their gear (seeded by role) is the
  // same on every card, in the world and in your group. From their id, so it never changes and draws no dice
  G.mainRole = (b) => { const C = D.CLASSES[b.cls] || {}, rs = C.roles || [C.role || 'dps']; return rs[Math.floor(B.hash(b.id, 7) * rs.length) % rs.length]; };
  // the person who posted or leads a group takes a seat in it as themselves: their own level, their main role's seat if
  // there is one (else a damage seat), so the card in the pop matches the one in the world (#388)
  function seatLead(grp, bot) {
    const r = G.mainRole(bot); let i = grp.members.findIndex((m) => m.role === r && !m.legend);
    if (i < 0) i = grp.members.findIndex((m) => m.role === 'dps' && !m.legend); if (i < 0) return;
    const c = G.botChar(Object.assign({}, bot, { role: grp.members[i].role })); c.syncLevel = grp.members[i].syncLevel; grp.members[i] = c;
  }
  G.botChar = function (b) {
    if (!(b && b.id >= 0)) return rollBotChar(b);
    // their gear is their main role's, whatever seat they take (#388): the same set on every card; talents follow the seat
    const main = b.id > 0 ? G.mainRole(b) : b.role;
    let s = (B.hash(b.id, b.level * 4 + (ROLE_N[main] || 0)) * 4294967296) >>> 0;
    const real = Math.random;
    Math.random = () => { s = (s + 0x6D2B79F5) >>> 0; let x = s; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
    let ch; try { ch = rollBotChar(main === b.role ? b : Object.assign({}, b, { role: main })); } finally { Math.random = real; }
    if (main !== b.role) Object.assign(ch, { role: b.role, bot: b, talents: G.autoTalents(b.cls, b.role || (D.CLASSES[b.cls] || {}).role || 'dps', b.level, Math.abs(b.id || 0)) });
    return ch;
  };
  // ------------------------------------------------------------ Legends
  // Before you know him, a legend may step into a hard solo fight in disguise: at most once an hour, 3 times per zone.
  G.WANDERER_GAP = 60 * 60000;
  G.wandererCheck = function (C) {
    C.wandererTried = true;
    const S = G.S, P = S.player;
    for (const key in (D.LEGENDS || {})) {
      const Hd = D.LEGENDS[key].hooded; if (!Hd || P.done[Hd.until] || P.quests[Hd.until] || P.level < Hd.minLvl) continue;
      const W = P.wanderer = P.wanderer || { n: 0, last: 0, zones: {} };
      const region = (D.PLACES[P.place] || {}).region || 'x';
      if (now() - W.last < G.WANDERER_GAP || (W.zones[region] || 0) >= 3) continue;
      const pu = C.units[G.pUnit && G.pUnit.uid];
      const hard = (pu && pu.hp / pu.maxHp < 0.6) || C.enemies.filter((e) => !e.dead).length >= 2 || C.enemies.some((e) => e.level > P.level + 1);
      if (!hard || Math.random() > 0.35) continue;
      const lc = G.legendChar(key, P.level); lc.name = Hd.name; lc.legendArt = Hd.art; lc.role = 'tank';
      const u = E.charUnit(lc, 'ally', 'bot', now()); u.bot = { skill: 0.85, react: 0.45 }; u.role = 'tank'; u.name = Hd.name;
      E.addAlly(C, u);
      C.wanderer = { key, name: Hd.name };
      W.n++; W.last = now(); W.zones[region] = (W.zones[region] || 0) + 1;
      B.post(S, 'combat', null, `A hooded knight joins the fight!`);
      B.post(S, 'say', { name: Hd.name, cls: 'paladin' }, cpick(Hd.join));
      emit('change');
      return;
    }
  };
  // The cameo (v10.2): once their story is done, each Group Finder run has a 1 in 5 chance of one legend joining,
  // at most once every 3 days per legend, and only one legend per run. P.legendMem[key] = { n, last, where }.
  G.CAMEO_CHANCE = 0.2; G.CAMEO_GAP = 3 * 24 * 3600 * 1000;
  G.legendMemory = (key) => ((G.S.player.legendMem || {})[key]) || { n: 0, last: 0, where: null };
  G.rollCameo = function (A) {
    const ready = Object.keys(D.LEGENDS || {}).filter((k) => G.legendUnlocked(k) && G.legendOn(k) && now() - G.legendMemory(k).last >= G.CAMEO_GAP);
    if (!ready.length || Math.random() >= G.CAMEO_CHANCE) return null;
    return pick(ready); // marked as seen when the run starts, so a declined pop doesn't use them up (#455)
  };
  G.cameoSeen = (key) => { const P = G.S.player; P.legendMem = P.legendMem || {}; P.legendMem[key] = Object.assign(G.legendMemory(key), { last: now() }); };
  // what a legend says in the party when they arrive and leave (their own lines, in D.LEGENDS[key].cameo)
  G.legendLine = (key, kind) => { const c = (D.LEGENDS[key] || {}).cameo || {}; return cpick(c[kind] || ['o/']); };
  // wearing a Legend's keepsake: its look on your back, only once their story is done
  G.setKeepsake = function (key) {
    const P = G.S.player, L = key && D.LEGENDS[key];
    if (key && !(L && L.keepsake && G.legendUnlocked(key))) return;
    G.setWardrobe('back', key ? L.keepsake.look : null); // keepsakes live in the wardrobe's Back row (v10.3)
  };
  G.legendUnlocked = (key) => { const L = (D.LEGENDS || {})[key]; return !!(L && G.S && G.S.player.done[L.unlock]); };
  G.legendOn = (key) => !((G.S.player.legendOff || {})[key]);
  G.setLegendOn = function (key, on) { const P = G.S.player; P.legendOff = P.legendOff || {}; if (on) delete P.legendOff[key]; else P.legendOff[key] = true; G.save(); emit('change'); };
  G.legendChar = function (key, lvl) {
    const L = D.LEGENDS[key], C = D.CLASSES[L.cls];
    const b = { id: -1000 - Object.keys(D.LEGENDS).indexOf(key), name: L.short, cls: L.cls, race: L.race, level: lvl, role: L.role, skill: 0.85, react: 0.45, toxic: 0, legend: key };
    // green gear (v10.2): a Legend in blue carried most runs on its own (docs/plans/2026-09-30-legends-story-heroes-design.md)
    const equip = { weapon: G.genGear('weapon', lvl, 2, { wtype: L.wtype || 'sword' }) };
    for (const s of ['chest', 'legs', 'feet', 'hands', 'wrist', 'waist', 'back']) equip[s] = G.genGear(s, lvl, 2, s === 'back' ? {} : { atype: C.armorType });
    return { name: L.short, cls: L.cls, race: L.race, level: lvl, equip, role: L.role, hp: null, res: null, auras: [], bot: b, legend: key, talents: G.autoTalents(L.cls, L.role, lvl, 7) };
  };
  // picks the group without joining it (the queue pop shows it first, #189); formGroup joins it, or a picked one
  function pickGroup(act, opts) {
    const S = G.S, A = D.ACTIVITIES[act];
    const roles = A.size === 3 ? ['tank', 'healer', 'dps'] : A.size === 10 ? ['tank', 'tank', 'healer', 'healer', 'healer', 'dps', 'dps', 'dps', 'dps', 'dps'] : ['tank', 'healer', 'dps', 'dps', 'dps'];
    const mine = G.role();
    roles.splice(roles.indexOf(mine), 1);
    const used = new Set(), usedCls = new Set([S.player.cls]);
    const trial = opts && opts.trial, lvl = trial ? D.LEVEL_CAP : G.syncLevel(act);
    const floor = G.gearFloor(act, opts && opts.hard);
    const members = roles.map((r) => G.botChar(Object.assign(recruit(r, lvl, used, usedCls, opts && opts.guild, !!trial), { gearFloor: floor })));
    // everyone fights at the activity's level (a Trial: at the level cap)
    const cap = trial ? D.LEVEL_CAP : A.scale ? lvl : A.maxLvl || D.LEVEL_CAP; // a festival run is fought at your own level
    for (const m of members) m.syncLevel = cap;
    if (trial) { const sk = TR().botSkill(G.trialRating()); for (const m of members) m.bot.skill = clamp(sk + rnd(-0.08, 0.05), 0.3, 0.95); } // your rating draws better players
    if (opts && opts.hard) { const sk = TR().botSkill(G.trialRating()) + 0.05; for (const m of members) m.bot.skill = clamp(sk + rnd(-0.06, 0.05), 0.3, 0.95); } // Hard: skilled players, a little above your Trial rating
    if (opts && opts.firstTimers) for (const m of members) { m.bot.skill = Math.min(m.bot.skill, 0.25 + Math.random() * 0.2); m.level = Math.max(A.minLvl, Math.min(m.level, A.minLvl + 1)); }
    // Legends (v10.2, story heroes): a legend always joins the run that is part of their own story; after their story,
    // only as a rare cameo (G.rollCameo). They take their role's slot, or a damage slot if you play that role.
    const joins = Object.keys(D.LEGENDS || {}).filter((key) => A.needQuest && D.QUESTS[A.needQuest] && D.QUESTS[A.needQuest].legend === key);
    const guest = joins.length || (opts && opts.firstTimers) ? null : G.rollCameo(A); // not in first-timer groups you mentor
    if (guest) joins.push(guest);
    for (const key of joins) {
      const L = D.LEGENDS[key];
      const slot = members.findIndex((m) => m.role === L.role);
      const i = slot >= 0 ? slot : members.findIndex((m) => m.role === 'dps');
      // a Legend's own story fight always has them: if your role takes their only slot (a damage Legend in a 3-player
      // group with you as the damage), they come along as a fourth
      if (i < 0 && key === guest) continue;
      const lc = G.legendChar(key, lvl);
      lc.role = i >= 0 ? members[i].role : L.role; lc.syncLevel = cap; lc.cameo = key === guest;
      if (i >= 0) members[i] = lc; else members.push(lc);
    }
    return { act, members, cap };
  }
  function formGroup(act, opts, picked) {
    const g = picked || pickGroup(act, opts);
    G.S.player.syncLevel = g.cap;
    G.S.group = { act, members: g.members };
    return G.S.group;
  }
  G.acceptPop = function () {
    const S = G.S;
    if (!S.queue) return;
    if (G.fight) return toast('Finish the fight first.'), false; // the pop stays open (#189)
    const act = S.queue.act, trial = S.queue.trial || 0, hard = !!S.queue.hard, picked = S.queue.group; S.queue = null;
    stopActions();
    if (D.ACTIVITIES[act].bg) { S.player.travel = null; S.player.route = null; return startBg(act); } // a battleground forms its own two teams
    const grp = formGroup(act, trial ? { trial } : hard ? { hard } : undefined, picked); // the group the pop showed
    sys(`You have joined a group for ${D.ACTIVITIES[act].name}.`);
    grp.members.forEach((m, i) => { if (m.cameo || crand() < 0.7) S.pending.push({ at: now() + 800 + i * 1400 + crand() * 1500, bot: m.bot.id, ch: 'party', text: m.cameo ? G.legendLine(m.legend, 'hello') : B.partyLine(m.bot, 'hello'), fromName: m.name }); });
    startRun(act, trial, hard);
    const guest = grp.members.find((m) => m.cameo); if (guest) emit('legendJoin', { key: guest.legend });
    emit('change');
  };
  G.POP_WAIT = 90000; // how long a group pop waits for Enter (#412)
  G.declinePop = function () { G.S.queue = null; sys('You declined the group.'); emit('change'); };

  // ============================================================ runs (dungeon / hogger)
  // the numbers a run's enemies start from: a Trial's own (a raid keeps the numbers its Trials were tuned on, #215), else
  // Hard's, else Normal's
  G.runBase = (Dg, hard, trial) => (trial && Dg.trial) || (hard && Dg.hard) || Dg;
  function startRun(act, trial, hard) {
    const S = G.S, A = D.ACTIVITIES[act];
    S.player.travel = null; S.player.route = null; // a trip ends when the group summons you (#424)
    closeFinished(); // #479
    for (const m of (S.group && S.group.members) || []) if (m.cameo) G.cameoSeen(m.legend); // #455
    let pulls, mult = null, bossMult = null, name = A.name;
    if (A.dungeon) {
      const Dg = D.DUNGEONS[A.dungeon];
      const Bs = G.runBase(Dg, hard, trial); pulls = Dg.pulls; mult = Bs.trashMult; bossMult = Bs.bossMult;
      if (hard && Dg.hard) name += ' · Hard'; else hard = false;
    } else if (A.event) { // a festival run (v10.13): its own pulls, fought at your level, with its own Hard
      pulls = A.pulls; mult = A.trashMult; bossMult = A.bossMult;
      if (hard && A.hard) { mult = A.hard.trashMult; bossMult = A.hard.bossMult; name += ' · Hard'; } else hard = false;
      const top = A.atCap && (hard ? A.atCap.hard : A.atCap), L = G.syncLevel(act); // stronger toward the level cap, where groups are better geared
      if (top && L > A.atCap.from) {
        const f = Math.min(1, (L - A.atCap.from) / (D.LEVEL_CAP - A.atCap.from)), mix = (lo, hi) => ({ hp: lo.hp + (hi.hp - lo.hp) * f, dmg: lo.dmg + (hi.dmg - lo.dmg) * f });
        mult = mix(mult, top.trashMult); bossMult = mix(bossMult, top.bossMult);
      }
    } else {
      pulls = A.pulls; hard = false;
    }
    S.run = { act, name, pulls, mult, bossMult, idx: 0, phase: 'rest', restUntil: now() + 6000, wipes: 0, rolls: [], returnTo: S.player.place, started: now(), hard: hard || undefined };
    if (A.scale) S.run.mobLevel = G.syncLevel(act);
    { // a bot shows off the effect item it wears (#56): a link to the real item, tappable like any other
      const m = S.group.members.find((x) => !x.gone && x.bot && Object.values(x.equip || {}).some((it) => G.effectOf(it)));
      if (m && crand() < 0.35) { const it = Object.values(m.equip).find((x) => G.effectOf(x)), L = B.link(it.name, it.q);
        partySay(m, cpick([`finally got ${L}!`, `${L} is carrying me lol`, `took me forever to get ${L}`, `${L} finally dropped for me last week`])); }
    }
    if (trial) { // Trials (v10.4): enemies at the level cap, stronger with each Trial level
      const f = TR().factor(trial), sc = (m) => ({ hp: ((m && m.hp) || 1) * f, dmg: ((m && m.dmg) || 1) * f }), Rec = G.trials();
      const omens = TR().active(trial, new Date()), OMS = TR().OMENS, bm = sc(bossMult), tm = sc(mult); // Omens are fixed when the run starts
      if (omens.includes('hardened')) bm.hp *= OMS.hardened.hp;
      if (omens.includes('hasty')) { bm.hp *= OMS.hasty.hp; tm.hp *= OMS.hasty.hp; }
      Object.assign(S.run, { mult: tm, bossMult: bm, mobLevel: D.LEVEL_CAP, omens, name: `${name} · Trial ${trial}`, trial: { lvl: trial, season: Rec.season, bestHere: (Rec.best[act] || {}).lvl || 0 } });
    }
    emit('instanceEnter', { act, dungeon: A.dungeon || null });
    S.player.hp = S.player.hp == null ? null : S.player.hp;
    emit('runUpdate');
  }
  G.runPull = function () {
    const S = G.S, R = S.run;
    if (!R || R.phase !== 'rest') return;
    if (S.group.members.some((m) => m.gone)) { toast('Wait for the group to fill up.'); return; }
    const pull = R.pulls[R.idx];
    const pu = E.charUnit(S.player, 'ally', 'player', now());
    const allies = [pu];
    const petU = G.petUnitFor(pu);
    if (petU) allies.push(petU);
    for (const m of S.group.members) {
      if (m.gone) continue;
      const u = E.charUnit(m, 'ally', 'bot', now());
      u.bot = { skill: m.bot.skill, react: 0.9 - 0.6 * m.bot.skill };
      if (!m.bot.skill || m.bot.skill < 0.3) u.bot.react = 1.1;
      if (Math.random() < 0.06) u.bot.afkUntil = rnd(3, 8);
      u.memberRef = m;
      allies.push(u);
    }
    const mult = pull.boss ? (R.bossMult || { hp: 1, dmg: 1 }) : (R.mult || { hp: 1, dmg: 1 });
    const marks = (R.marks && R.marks[R.idx]) || {};
    const enemies = pull.mobs.map((k, i) => {
      const M = D.MOBS[k];
      const u = E.mobUnit(k, R.mobLevel || null, M.boss ? mult : (R.mult || { hp: 1, dmg: 1 }));
      if (marks[i]) u.mark = marks[i];
      u.inRun = true; // a dungeon or raid's mob: open-world caster spells stay outside (#179)
      if (R.hard) u.onHard = true; // a Hard run: a boss's slam can have Hard numbers (#179)
      const hx = R.hard ? G.hardExtra(R.act, k) : !R.trial && G.normalExtra(R.act, k); if (hx) u.hardX = hx; // the boss's extra mechanic: Hard's, or a Normal raid's own
      const XA = D.ACTIVITIES[R.act], xs = R.hard && XA.hardExtra ? XA.hardExtra : XA.extra; // a festival boss has its own Hard set
      const wx = xs && xs[k]; if (wx) u.hardX = wx.map((e) => Object.assign({}, e)); // a world boss's mechanics
      return u;
    });
    if ((R.omens || []).some((k) => k === 'warded' || k === 'vengeful' || k === 'sheltered') && enemies.length >= 2) enemies[pull.mobs.length - 1].focus = true; // Tier 3: the last enemy listed
    if ((R.omens || []).includes('restless') && R.lastFightEnd && now() - R.lastFightEnd > TR().OMENS.restless.rest * 1000) { // Restless: a long rest draws a patrol
      const trash = (R.pulls.find((p) => !p.boss) || { mobs: [] }).mobs[0];
      if (trash) { for (let i = 0; i < TR().OMENS.restless.extra; i++) enemies.push(E.mobUnit(trash, R.mobLevel || null, R.mult || { hp: 1, dmg: 1 })); sys('A patrol heard you resting and joins the fight!'); }
    }
    if ((R.omens || []).includes('swarming')) { // Swarming: one more enemy in every pull
      const trash = pull.mobs.find((k) => !D.MOBS[k].boss) || (R.pulls.find((p) => !p.boss) || { mobs: [] }).mobs[0];
      const SW = TR().OMENS.swarming, m0 = R.mult || { hp: 1, dmg: 1 };
      if (trash) for (let i = 0; i < SW.extra; i++) enemies.push(E.mobUnit(trash, R.mobLevel || null, { hp: m0.hp * SW.hp, dmg: m0.dmg }));
    }
    const tank = allies.find((a) => a.role === 'tank') || pu;
    G.pUnit = pu;
    G.fight = E.fight(allies, enemies, { puller: tank, dungeonMult: R.mult, omens: R.omens || null, killOrder: R.killOrder || 'focus' });
    G.fight.kind = 'run';
    pu.target = (enemies.find((e) => e.mark === 'skull') || enemies[0]).uid;
    healPickStart(G.fight); // #156
    // Momentum: pulling again within 5 sec of the last fight stacks a group buff; resting resets it
    R.momentum = R.lastFightEnd && now() - R.lastFightEnd <= MOMENTUM_WINDOW ? Math.min(MOMENTUM_MAX, (R.momentum || 0) + 1) : 0;
    if (R.momentum) {
      const L = G.syncLevel(R.act), m = R.momentum;
      for (const a of allies) { a.auras.push({ id: 'momentum', until: 600, stats: { haste: 5 * m, ap: Math.round(0.5 * L * m), sp: Math.round(0.4 * L * m) } }); E.recalc(a); }
      if (m >= 2) sys(`Momentum x${m}: the group hits faster and harder.`);
    }
    // a careless tank sometimes pulls the next pack too
    const tb = S.group.members.find((m) => m.role === 'tank' && !m.gone);
    if (tb && !pull.boss && R.idx + 1 < R.pulls.length && !R.pulls[R.idx + 1].boss && Math.random() < (PACE[R.pace || 'normal'].chain != null ? PACE[R.pace || 'normal'].chain : 0.28 * (1 - tb.bot.skill) * PACE[R.pace || 'normal'].extra)) {
      G.fight.extraAt = { t: rnd(4, 8), mobs: R.pulls[R.idx + 1].mobs.slice(0, 1) };
    }
    R.phase = 'fight';
    if (tb && crand() < 0.5) partySay(tb, B.partyLine(tb.bot, 'pull'));
    emit('fightStart', { fight: G.fight });
    emit('runUpdate');
  };
  function partySay(m, text) {
    B.post(G.S, 'party', { name: m.name, cls: m.cls, id: m.bot.id }, text);
    if (G.fight) emit('partySay', { m, text }); // the screen also shows it over the speaker (#179)
  }
  function memberOf(u) { return u.memberRef; }

  function endRunFight(C) {
    const S = G.S, R = S.run;
    const pull = R.pulls[R.idx];
    recordFx(C, G.pUnit); E.writeBack(C, G.pUnit, now());
    petWriteBack(C);
    for (const u of C.allies) if (u.memberRef) E.writeBack(C, u, now());
    const result = C.over;
    G.fight = null;
    const pu = G.pUnit; G.pUnit = null;
    if (result === 'win') {
      const size = 1 + S.group.members.filter((m) => !m.gone).length, evA = D.ACTIVITIES[R.act].event;
      for (const e of C.enemies) {
        onKill(e.key); G.lwKill(e.level, false); G.lnKill(e.level, false);
        if (e.boss && !evA) { G.lwEarn(D.EVENTS.lanternwake.earn.boss, 'a dungeon boss'); G.lnGive(D.EVENTS.longnight.earn.boss, 'a dungeon boss', true); }
        G.gainXp(Math.round(G.xpForKill(e.level, true) / size * 1.4), true);
        const l = rollLoot(e.key, e.level, 1 / size);
        giveLoot({ money: l.money, items: l.items.filter((it) => !D.GEAR_SLOTS.includes(it.slot)) });
        const gear = evA ? [] : l.items.filter((it) => D.GEAR_SLOTS.includes(it.slot) && it.q >= 2); // a festival run drops no gear
        for (const it of gear) addRoll(it);
      }
      if (pull.boss && evA) { if (evA === 'longnight') lnBossLoot(R); else lwBossLoot(R); const talker = cpick(S.group.members.filter((m) => !m.gone)); if (talker) partySay(talker, B.partyLine(talker.bot, 'win')); }
      else if (pull.boss) {
        const M = D.MOBS[pull.mobs[0]];
        const table = (M.loot || []).slice().sort(() => Math.random() - 0.5);
        // Hard: the first kill of each boss in a week drops its loot two upgrade steps up; after that, the Normal items
        const bonus = R.hard && G.hardBonusLeft(R.act, pull.mobs[0]);
        // a world boss drops its loot once a week (and pays Mentor Marks that time); after that, nothing until Monday
        const wbA = D.ACTIVITIES[R.act].worldBoss, wbFirst = wbA && !G.worldBossLooted(R.act);
        if (wbA) { if (wbFirst) { const w = G.raidWeek(); (w.wb = w.wb || {})[R.act] = true; G.addMarks(G.WB_MARKS, 'this week\'s world boss'); } else sys(`${M.name}'s loot is taken this week: it drops again on Monday.`); }
        if (wbA) G.takeTrophy(D.ACTIVITIES[R.act].boss); // first kill by any character (#44)
        const lastBoss = R.pulls.map((p) => !!p.boss).lastIndexOf(true) === R.idx;
        const drops = wbA && !wbFirst ? [] : table.slice(0, 2).map(bonus ? G.hardCopy : R.trial && lastBoss ? G.trialCopy : G.copyItem); // a Trial's final boss: level 60 (#184)
        if (R.hard) { if (bonus) { G.raidWeek().got[R.act + ':' + pull.mobs[0]] = true; sys(`Hard bonus: ${M.name}'s loot is ${G.HARD_STEPS} upgrade steps higher (weekly).`); } else sys(`${M.name}: Hard bonus already taken this week. Resets Monday.`); }
        for (const it of drops) addRoll(it);
        const rr = G.rareRecipeDrop(G.syncLevel(R.act)); if (rr) addRoll(rr);
        if (!(wbA && !wbFirst) && (!D.ACTIVITIES[R.act].dungeon || Math.random() < 0.25)) addRoll(G.genGear(pick(D.GEAR_SLOTS), G.syncLevel(R.act), !D.ACTIVITIES[R.act].dungeon ? 2 : 3));
        if (D.ACTIVITIES[R.act].dungeon && !wbA && R.pulls.map((p) => !!p.boss).lastIndexOf(true) === R.idx) G.epicDrop('boss', G.syncLevel(R.act)); // #141
        if (pull.mobs[0] === 'vancleef' && G.S.player.quests.defias_brotherhood) { G.addItem(G.copyItem('vancleef_head'), 1); loot(`You receive loot: ${B.link("Head of Blackwell")}.`); questCheck(); }
        const talker = pick(S.group.members.filter((m) => !m.gone));
        if (talker) partySay(talker, B.partyLine(talker.bot, 'win'));
      }
      R.deaths = (R.deaths || 0) + C.allies.filter((u) => u.dead && u.kind !== 'pet').length;
      if (pu && pu.dead) G.wear(); // you died, the group won (#502)
      R.lastFightEnd = now();
      // rez the fallen
      const healerAlive = C.allies.find((u) => u.role === 'healer' && !u.dead);
      for (const u of C.allies) if (u.dead && u.kind !== 'pet') {
        const ch = u.memberRef || S.player;
        ch.hp = Math.round(u.maxHp * (healerAlive ? 0.4 : 0.5)); ch.res = null; if (u === pu) { S.player.hp = ch.hp; }
      }
      if (healerAlive && C.allies.some((u) => u.dead && u.kind !== 'pet')) sys(`${healerAlive.name} casts Resurrection.`);
      R.idx++;
      if (R.idx >= R.pulls.length) {
        R.phase = 'done';
        sys(`${R.name} complete!`);
        runBonuses(R);
        emit('runComplete', { act: R.act, soc: R.soc || null, wipes: R.wipes });
        for (const m of S.group.members) if (!m.gone && !m.cameo) G.remember(m.bot, { run: R.act, wipes: R.wipes });
        S.group.members.filter((m) => !m.gone).forEach((m, i) => S.pending.push({ at: now() + 2000 + i * 1600, bot: m.bot.id, ch: 'party', text: m.cameo ? G.legendLine(m.legend, 'bye') : B.partyLine(m.bot, 'bye'), fromName: m.name }));
        for (const m of S.group.members) if (m.cameo && !m.gone) { const P = S.player; P.legendMem = P.legendMem || {}; const mem = G.legendMemory(m.legend); P.legendMem[m.legend] = Object.assign(mem, { n: (mem.n || 0) + 1, where: R.name }); } // the memory on the Hero screen
      } else { R.phase = 'rest'; R.restUntil = now() + 6500 * (PACE[R.pace || 'normal'].rest); }
    } else {
      R.wipes++; R.momentum = 0; G.wear(); // a wipe is your death (#502)
      R.phase = 'wipe'; R.restUntil = now() + 12000;
      sys('Your party has been defeated. Running back...');
      const alive = S.group.members.filter((m) => !m.gone);
      const toxicOne = alive.slice().sort((a, b) => b.bot.toxic - a.bot.toxic)[0];
      if (toxicOne) partySay(toxicOne, B.partyLine(toxicOne.bot, 'wipe'));
      for (const m of alive) {
        if (m.legend) continue; // a Legend never walks out on you
        const pLeave = 0.08 + m.bot.toxic * 0.25 + (R.wipes - 1) * 0.12;
        if (Math.random() < pLeave) {
          m.gone = true;
          S.pending.push({ at: now() + 2500 + crand() * 2000, bot: m.bot.id, ch: 'party', text: B.partyLine(m.bot, m.bot.toxic > 0.5 ? 'rage' : 'leave'), fromName: m.name,
            onPost: () => sys(`${m.name} has left the group.`) });
        }
      }
      S.player.hp = null; S.player.res = null;
      for (const m of S.group.members) { m.hp = null; m.res = null; }
    }
    emit('fightEnd', { result });
    emit('runUpdate');
    G.save();
  }

  function addRoll(it) {
    const S = G.S, R = S.run;
    const r = { item: it, until: now() + 25000, left: 25000, choices: {}, player: null, done: false }; // left: your time to decide, which stops during fights and while you inspect the item
    for (const m of S.group.members) {
      if (m.gone) continue;
      const usable = G.canUseItem(it, m.cls) && (!it.atype || it.atype === D.CLASSES[m.cls].armorType || it.slot === 'back') && (it.slot !== 'weapon' || D.CLASSES[m.cls].weapons.includes(it.wtype))
        && !(it.effect && Object.values(m.equip || {}).some((x) => x && x.effect === it.effect)); // an effect counts once (#56): no Need on one it already wears
      let c;
      if (m.bot.ninja) c = 'need';
      else if (usable && Math.random() < 0.85) c = 'need';
      else c = Math.random() < 0.75 ? 'greed' : 'pass';
      r.choices[m.name] = { c, v: c === 'pass' ? 0 : rint(1, 100), at: now() + rnd(1500, 7000), m };
    }
    R.rolls.push(r);
    loot(`Loot: ${B.link(it.name, it.q)}. Choose Need, Greed or Pass.`);
    emit('roll', r);
  }
  // the roll card is on screen: rolls you still have to decide wait for it instead of running out
  G.holdRolls = function (ms) { const R = G.S && G.S.run; if (!R) return; for (const r of R.rolls) if (!r.done && !r.player) { r.left = (r.left != null ? r.left : r.until - now()) + ms; r.until = now() + r.left; } };
  // inspecting a drop stops its clock (v10.4): read the item and compare it without losing the roll
  G.pauseRolls = function (on) { const R = G.S && G.S.run; if (R) { R.rollPause = !!on; R.rollPauseAt = now(); } };
  G.roll = function (idx, c) {
    const R = G.S.run;
    if (!R || !R.rolls[idx] || R.rolls[idx].done) return;
    R.rolls[idx].player = { c, v: c === 'pass' ? 0 : rint(1, 100) };
    emit('runUpdate');
  };
  // why the loot-roll clock is stopped, if it is (#170): 'fight' (the group does not wait for you) or 'look' (you are
  // inspecting the item; that pause lasts at most a minute)
  G.rollPaused = function () {
    const R = G.S.run; if (!R) return null;
    if (R.phase === 'fight') return 'fight';
    if (G.paused) return 'scene'; // a story chapter is playing (#347): nobody passes for you while you watch
    return R.rollPause && now() - (R.rollPauseAt || 0) < 60000 ? 'look' : null;
  };
  function rollsTick() {
    const S = G.S, R = S.run;
    if (!R) return;
    const t = now(), dt = Math.max(0, t - (R.rollT || t)); R.rollT = t;
    const still = !!G.rollPaused();
    for (const r of R.rolls) {
      if (r.done) continue;
      if (!r.player) { if (r.left == null) r.left = r.until - t; if (!still) r.left -= dt; r.until = t + r.left; }
      const botsIn = Object.values(r.choices).every((c) => c.at <= t);
      if (r.left <= 0 && !r.player) { // time ran out: a pass, as the rule is, said in Loot (and a toast for an upgrade) (#173)
        r.player = { c: 'pass', v: 0 };
        const t = `Time ran out: you passed on ${B.link(r.item.name, r.item.q)}.`; loot(t);
        if (G.markedUpgrade(r.item)) info(`Time ran out: you passed on ${r.item.name}.`);
      }
      if (!(botsIn && r.player)) continue;
      r.done = true;
      const entries = Object.entries(r.choices).map(([name, c]) => ({ name, c: c.c, v: c.v, m: c.m })).concat([{ name: S.player.name, c: r.player.c, v: r.player.v, me: true }]);
      for (const e of entries) if (e.c !== 'pass') loot(`${e.c === 'need' ? 'Need' : 'Greed'} Roll - ${e.v} for ${B.link(r.item.name, r.item.q)} by ${e.name}`);
      const needs = entries.filter((e) => e.c === 'need'); const greeds = entries.filter((e) => e.c === 'greed');
      const pool = needs.length ? needs : greeds;
      if (!pool.length) { loot(`Everyone passed on ${B.link(r.item.name, r.item.q)}.`); emit('rollResult', { item: r.item, entries, winner: null }); continue; }
      const win = pool.sort((a, b) => b.v - a.v)[0];
      r.winner = win.name;
      // the result for the roll card, and a winner line in General (the per-player rolls stay in the Loot channel)
      emit('rollResult', { item: r.item, entries, winner: win.name, me: !!win.me, how: win.c, v: win.v });
      sys(`${win.me ? 'You' : win.name} won ${B.link(r.item.name, r.item.q)} (${win.c === 'need' ? 'Need' : 'Greed'} ${win.v}).`);
      if (win.me) { // full bags: the bank keeps it, and says so (#161: it used to be deleted)
        if (G.giveReward(r.item, 'Loot roll') === 'bank') toast(`Bags full: ${r.item.name} sent to your bank`);
        loot(`You won: ${B.link(r.item.name, r.item.q)}`);
      }
      else {
        loot(`${win.name} won: ${B.link(r.item.name, r.item.q)}`);
        const usable = G.canUseItem(r.item, win.m.cls);
        if (win.m.bot.ninja && !usable) {
          G.remember(win.m.bot, { ninja: 1 });
          const other = S.group.members.find((m) => !m.gone && m !== win.m);
          if (other) S.pending.push({ at: t + 2000, bot: other.bot.id, ch: 'party', text: cpick(['ninja...', 'wtf that is not even your armor', 'reported lol', 'bruh']), fromName: other.name });
          S.pending.push({ at: t + 4500, bot: win.m.bot.id, ch: 'party', text: B.partyLine(win.m.bot, 'loot'), fromName: win.m.name });
        } else if (crand() < 0.5) {
          const other = S.group.members.find((m) => !m.gone && m !== win.m);
          if (other) S.pending.push({ at: t + 1800, bot: other.bot.id, ch: 'party', text: B.partyLine(other.bot, 'loot'), fromName: other.name });
        }
      }
      emit('runUpdate');
    }
    R.rolls = R.rolls.filter((r) => !r.done || t - r.until < 4000);
  }
  G.paused = false;   // set by the UI while a cutscene plays
  // What the pull waits for between pulls (#159), the one rule both the pull and the screen read: each row (you first,
  // then the group in order) with its health, mana and whether it has met the pace's thresholds; your own row is ready
  // only once your minimum rest is over too (Ready skips it). topped: everyone has met them (what the pull waits on).
  const REST_CAP = 25000; // at most this long past the minimum rest, the group pulls anyway
  G.restState = function () {
    const S = G.S, R = S.run; if (!R || R.phase !== 'rest' || !S.group) return null;
    const t = now(), P = S.player, v = G.vitals(), pace = PACE[R.pace || 'normal'];
    const boss = R.pulls[R.idx] && R.pulls[R.idx].boss, need = boss ? { hp: Math.max(pace.hp, pace.bossHp), mana: Math.max(pace.mana, pace.bossHp) } : pace; // a group rests before a boss
    const hp0 = P.hp == null ? v.maxHp : P.hp;
    const rows = [{ me: true, name: P.name, hp: hp0, maxHp: v.maxHp, mana: v.resType === 'mana' ? P.res : null, maxMana: v.resType === 'mana' ? v.maxRes : 0,
      met: !need.hp || (hp0 >= v.maxHp * need.hp && (v.resType !== 'mana' || P.res >= v.maxRes * need.mana)) }];
    for (const m of S.group.members) {
      const st = E.statsFor(m), isMana = D.CLASSES[m.cls].resource === 'mana';
      const hp = m.hp == null ? st.maxHp : m.hp, mana = isMana ? (m.res == null ? st.maxMana : m.res) : null;
      rows.push({ char: m, name: m.name, gone: !!m.gone, hp, maxHp: st.maxHp, mana, maxMana: isMana ? st.maxMana : 0,
        met: !need.hp || m.gone || m.hp == null || (m.hp >= st.maxHp * need.hp && (!isMana || m.res == null || m.res >= st.maxMana * need.mana)) });
    }
    const rested = t >= R.restUntil;
    for (const r of rows) r.ready = r.met && !r.gone && (!r.me || rested);
    return { need, rows, topped: rows.every((r) => r.met), rested, restLeft: Math.max(0, R.restUntil - t), capped: t >= R.restUntil + REST_CAP, tank: G.role() === 'tank' };
  };
  // the status line between pulls (#159): who the group waits for, then your own rest, then everyone ready
  // the line in parts for the screen (#178): who: the member it waits for (their name goes in their class colour),
  // ok: everyone is ready (the line turns green)
  G.restLineInfo = function () {
    const text = G.restLine(); if (text == null) return null;
    const st = G.restState(), w = G.restWaitsFor && G.restWaitsFor(st);
    return { text, who: w && !w.me && text.includes(w.name) ? { name: w.name, cls: w.char.cls } : null, ok: /^Everyone ready/.test(text) };
  };
  const restShort = (st) => st.rows.filter((r) => !r.met).map((r) => {
    const h = r.hp / r.maxHp / st.need.hp, m = r.mana != null && r.maxMana ? r.mana / r.maxMana / st.need.mana : Infinity;
    return { r, by: Math.min(h, m), mana: m < h };
  }).sort((a, b) => a.by - b.by);
  G.restWaitsFor = (st) => { const s = st && restShort(st)[0]; return s ? s.r : null; };
  G.restLine = function () {
    const st = G.restState(); if (!st) return null;
    if (st.rows.some((r) => r.gone)) return 'Looking for replacements...';
    const short = restShort(st);
    if (short.length) {
      if (st.capped && !st.tank && st.rested) return 'Pulling anyway.';
      const { r, mana } = short[0], who = r.me ? 'your' : `${r.name}'s`;
      const what = mana ? `${who} mana: ${Math.floor(r.mana / r.maxMana * 100)}%, needs ${Math.round(st.need.mana * 100)}%` : `${who} health`;
      return `Waiting for ${what}` + (short.length > 1 ? ` · ${short.length - 1} more waiting` : ''); // says what the rest wait for (#495)
    }
    if (!st.rested) return `Resting · ${Math.ceil(st.restLeft / 1000)} s`;
    return st.tank ? 'Everyone ready. Pull when you are.' : 'Everyone ready. Pulling.';
  };
  function runTick() {
    const S = G.S, R = S.run;
    if (!R || R.phase === 'fight') return;
    const t = now();
    if (G.paused) { R.restUntil = Math.max(R.restUntil, t + 4000); return; }
    if (G.looking) R.restUntil = Math.max(R.restUntil, t + 2000); // a player card is open: the pull waits (#323), the rest goes on
    // regen during rest
    const v = G.vitals();
    const P = S.player;
    if (P.hp == null) P.hp = v.maxHp;
    if (R.phase === 'rest') {
      // resting between pulls: slow enough that the pull pace matters (careful waits, fast goes in low)
      const RR = G.REST_REGEN;
      P.hp = Math.min(v.maxHp, P.hp + v.maxHp * RR);
      if (v.resType === 'mana') P.res = Math.min(v.maxRes, P.res + v.maxRes * RR);
      for (const m of S.group.members) { if (m.hp != null) { const st = E.statsFor(m); m.hp = Math.min(st.maxHp, m.hp + st.maxHp * RR); if (m.res != null && D.CLASSES[m.cls].resource === 'mana') m.res = Math.min(st.maxMana, m.res + st.maxMana * RR); } }
      // replace leavers
      const missing = S.group.members.filter((m) => m.gone && !m.replacing);
      for (const m of missing) {
        m.replacing = t + rnd(8000, 20000);
        sys(`Looking for a new ${m.role === 'tank' ? 'tank' : m.role === 'healer' ? 'healer' : 'damage dealer'}...`);
      }
      for (const m of S.group.members.filter((x) => x.gone && x.replacing && t >= x.replacing)) {
        const used = new Set(S.group.members.map((x) => x.bot.id));
        const nb = G.botChar(Object.assign(recruit(m.role, G.syncLevel(R.act), used, new Set(S.group.members.filter((x) => !x.gone).map((x) => x.cls).concat([P.cls])), null, !!R.trial), { gearFloor: G.gearFloor(R.act, R.hard) }));
        nb.syncLevel = P.syncLevel || D.ACTIVITIES[R.act].maxLvl || D.LEVEL_CAP; // the group's own level: a Trial's cap, a festival run's yours (#384)
        if (R.trial && !R.hard) nb.bot.skill = clamp(TR().botSkill(G.trialRating()) + rnd(-0.08, 0.05), 0.3, 0.95); // drawn from your Trial rating, like the first group
        if (R.hard) nb.bot.skill = clamp(TR().botSkill(G.trialRating()) + 0.05 + rnd(-0.06, 0.05), 0.3, 0.95); // a Hard group refills with skilled players too
        const i = S.group.members.indexOf(m);
        S.group.members[i] = nb;
        sys(`${nb.name} has joined the group.`); emit('runUpdate'); // the party frames show the new member at once, not after a tap (#281)
        S.pending.push({ at: t + 1500, bot: nb.bot.id, ch: 'party', text: B.partyLine(nb.bot, 'hello'), fromName: nb.name });
      }
      const waiting = S.group.members.some((m) => m.gone);
      // bot tank pulls on its own when rested; player tank pulls manually. The rule is G.restState's, which the screen shows (#159)
      const topped = G.restState().topped;
      if (G.role() !== 'tank' && t >= R.restUntil && (topped || t >= R.restUntil + REST_CAP) && !waiting) G.runPull(); // rolls no longer hold the group: their clock waits for you instead (v10.4)
      emit('runTick');
    } else if (R.phase === 'wipe' && t >= R.restUntil) {
      R.phase = 'rest'; R.restUntil = t + 6000;
      P.hp = Math.round(v.maxHp * 0.5); P.res = v.resType === 'mana' ? Math.round(v.maxRes * 0.5) : 0;
      emit('runUpdate');
    }
  }
  // ---------- tactics: pull pace, kill-order marks, boss plan
  // careful: rest to full, the tank never grabs an extra pack; fast: short rests, more extra packs.
  G.REST_REGEN = 0.05; // share of health/mana regained per second while resting in a dungeon (tuned in sim/tactics.js)
  // hp / mana: what the bot tank waits for before the next pull (v10.4: normal and fast wait for the healer too, now that
  // loot rolls no longer hold the group)
  const PACE = { careful: { rest: 1.6, hp: 0.95, mana: 0.9, bossHp: 0.95, extra: 0 }, normal: { rest: 1, hp: 0.5, mana: 0.45, bossHp: 0.8, extra: 1 }, fast: { rest: 0.35, hp: 0.3, mana: 0.25, bossHp: 0.55, extra: 2.2, chain: 0.15 } }; // #33: chain 0.3 -> 0.15, bossHp 0.6 -> 0.55 (fast is faster and riskier where the content can punish, simply faster where it can't, never slower)
  G.PACE = PACE; // sims tune it (sim/tactics.js, #33)
  G.setPace = function (p) { const R = G.S.run; if (R && PACE[p]) { R.pace = p; sys(`Pull pace: ${p}.`); emit('runUpdate'); } };
  // Kill order (v10.4): one at a time (everyone on the marked target) or spread (each on a different enemy, more area attacks)
  G.setKillOrder = function (k) { const R = G.S.run; if (R && (k === 'focus' || k === 'spread')) { R.killOrder = k; if (G.fight && G.fight.kind === 'run') G.fight.opts.killOrder = k; sys(k === 'spread' ? 'Kill order: spread the damage.' : 'Kill order: one at a time.'); emit('runUpdate'); } };
  G.setBossPlan = function (p) { const R = G.S.run; if (R) { R.bossPlan = p; sys(p === 'adds' ? 'Boss plan: kill the adds first.' : 'Boss plan: burn the boss.'); emit('runUpdate'); } };
  const NEXT_MARK = { undefined: 'skull', skull: 'cross', cross: undefined };
  // mark an enemy of the next pull (before it starts), or a live enemy in the fight
  G.cycleMark = function (i) {
    const R = G.S.run; if (!R) return;
    R.marks = R.marks || {}; const m = R.marks[R.idx] || (R.marks[R.idx] = {});
    const nx = NEXT_MARK[m[i]]; if (nx === 'skull') for (const k in m) if (m[k] === 'skull') delete m[k];
    if (nx) m[i] = nx; else delete m[i];
    emit('runUpdate');
  };
  G.cycleUnitMark = function (uid) {
    const C = G.fight; if (!C) return; const u = C.units[uid]; if (!u || u.side !== 'enemy') return;
    const nx = NEXT_MARK[u.mark]; if (nx === 'skull') for (const e of C.enemies) if (e.mark === 'skull') e.mark = undefined;
    u.mark = nx; emit('target');
  };
  function applyBossPlan(C) {
    const R = G.S.run; if (!R || !R.bossPlan) return;
    const boss = C.enemies.find((e) => !e.dead && D.MOBS[e.key] && D.MOBS[e.key].boss);
    if (!boss) return;
    const adds = C.enemies.filter((e) => !e.dead && e !== boss);
    if (R.bossPlan === 'adds' && adds.length) { for (const a of adds) if (!a.mark) a.mark = 'skull'; if (!boss.mark || boss.mark === 'skull') boss.mark = adds.some((a) => a.mark === 'skull') ? 'cross' : 'skull'; }
    else if (R.bossPlan === 'boss') { boss.mark = 'skull'; }
  }
  // ---------- dungeon bonuses: beat par time (fast pays), clear flawless (careful pays); a good group can get both
  const MOMENTUM_WINDOW = 5000, MOMENTUM_MAX = 5;
  G.runClock = function () { const R = G.S.run; return R ? Math.max(0, ((R.finishedAt || now()) - R.started) / 1000 - (R.pausedSecs || 0)) + (R.fastSecs || 0) : 0; }; // fastSecs: fight time gained at 2x or 3x
  // v10.3: level-60 clears pay Mentor Marks, the currency for gear upgrades (Trials will pay more)
  // Level-60 clears pay Marks (#501): a dungeon 5; a raid RAID_MARKS on its first clear of the week, then the dungeon rate,
  // so repeating one short raid is no longer the best way to earn Marks. raidWeek is per character, like the Hard bonus.
  G.RAID_MARKS = 15; G.CLEAR_MARKS = 5;
  G.clearMarks = (act) => { const A = D.ACTIVITIES[act], Dg = A && A.dungeon && D.DUNGEONS[A.dungeon]; return !Dg || (A.maxLvl || D.LEVEL_CAP) < D.LEVEL_CAP ? 0 : Dg.raid && !G.raidWeek().got['marks:' + act] ? G.RAID_MARKS : G.CLEAR_MARKS; };
  G.payClearMarks = (act) => {
    const m = G.clearMarks(act), Dg = m && D.DUNGEONS[D.ACTIVITIES[act].dungeon]; if (!m) return 0;
    const first = Dg.raid && m === G.RAID_MARKS; if (Dg.raid) G.raidWeek().got['marks:' + act] = true;
    G.addMarks(m, first ? "this raid's first clear this week" : 'a level-60 clear'); return m;
  };
  // Par times (v10.4): the data's par was set when every run also waited for loot rolls; rolls no longer hold the group,
  // so runs are about 18% faster and par is 15% shorter everywhere (the speed bonus and Trials both use it)
  G.PAR_SCALE = 0.85;
  G.par = (Dg) => (Dg && Dg.par ? Math.round(Dg.par * G.PAR_SCALE) : 0);
  function runBonuses(R) {
    const S = G.S, P = S.player, A = D.ACTIVITIES[R.act], Dg = A.dungeon && D.DUNGEONS[A.dungeon];
    if (A.event) { const cx = (P.codex = P.codex || {})[R.act] = Object.assign({ clears: 0, hard: 0 }, (P.codex || {})[R.act]); cx.clears++; if (R.hard) cx.hard++; return; } // a festival run: counted (Hard opens after one)
    if (!Dg) return;
    R.finishedAt = now();
    if (R.help && R.help.stuck) { helpRewards(R); emit('lootGain', { items: 1 }); return; } // joined part-way: only the Help Wanted rewards, never a clear
    const secs = G.runClock(), L = G.syncLevel(R.act);
    const speed = !R.noSpeed && G.par(Dg) && secs <= G.par(Dg), flawless = !R.wipes; // flawless = the group never wiped
    const cx = (P.codex = P.codex || {})[R.act] = Object.assign({ clears: 0, flawless: 0, speed: 0, best: null }, (P.codex || {})[R.act]);
    cx.clears++; if (flawless) cx.flawless++; if (speed) cx.speed++; if (cx.best == null || secs < cx.best) cx.best = Math.round(secs);
    if (R.hard) cx.hard = (cx.hard || 0) + 1; // Hard clears (v10.7), shown in the codex
    if (R.hard && !R.trial && Dg.raid) { const had = Object.keys(P.crest || {}).length; if (G.crests(true).length > had) { sys(`Crestbearer: ${SOC.newestRaid().name}. Title earned: the Crestbearer.`); toast(`Crestbearer: ${SOC.newestRaid().name}`); } } // the newest raid on Hard (#565)
    if (Dg.raid && !R.trial) featuredClear(R.act);
    if (R.trial) G.trialDone(R, secs, TR().par(Dg, R.omens)); // Trials pay their own Marks, against their own par
    else if (P.level >= D.LEVEL_CAP) G.payClearMarks(R.act);
    R.bonus = { secs: Math.round(secs), par: G.par(Dg), speed, flawless };
    const pd = !R.trial && G.isFeaturedDungeon(R.act), xm = pd ? G.FD_MULT : 1, tag = pd ? ` (×${G.FD_MULT} featured dungeon)` : ''; // the featured dungeon bonus (#541)
    if (speed) {
      // the speed chest: half the time a blue from this dungeon's bosses, otherwise a green
      const it = Math.random() < 0.5 ? G.fittedBossBlue(Dg, L, P.cls) : G.fittedGear(L, 2, P.cls); // fits your class (issue #13)
      const g = Math.round(L * 150 * xm); G.giveReward(it, 'Speed bonus'); P.money += g;
      loot(`Speed bonus (under ${fmtClock(G.par(Dg))}): ${B.link(it.name, it.q)} and ${G.moneyText(g)}${tag}.`);
    }
    if (flawless) {
      const it = G.fittedGear(L, 2, P.cls);
      const g = Math.round(L * 200 * xm); G.giveReward(it, 'Flawless clear'); P.money += g;
      loot(`Flawless clear (no wipes): ${B.link(it.name, it.q)} and ${G.moneyText(g)}${tag}.`);
    }
    if (pd && !G.featuredDungeonClaimed()) { // once per bonus week, on any featured dungeon's first clear
      P.featuredDg = G.bonusWeekId();
      if (P.level >= D.LEVEL_CAP) { G.addMarks(G.FD_MARKS, 'featured dungeon, first clear this week'); }
      else { const it = G.fittedGear(L, 2, P.cls), g = L * 250; G.giveReward(it, 'Featured dungeon'); P.money += g; loot(`Featured dungeon, first clear this week: ${B.link(it.name, it.q)} and ${G.moneyText(g)}.`); }
    }
    if (!speed && !flawless) sys(`Cleared in ${fmtClock(secs)} (par ${fmtClock(G.par(Dg))}). No bonus this time.`);
    helpRewards(R);
    emit('lootGain', { items: 1 });
  }
  G._runBonuses = runBonuses; // for tests: a run's end-of-run rewards on their own
  const fmtClock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  G.fmtClock = fmtClock;
  G.runReady = function () { const R = G.S.run; if (R && R.phase === 'rest') { if (G.role() === 'tank') G.runPull(); else R.restUntil = Math.min(R.restUntil, now()); } };
  // leaving with loot still out (#346): your open rolls are a pass, the group rolls now, and Loot says who won
  function settleRolls() {
    const R = G.S.run; if (!R || !R.rolls) return;
    const t = now(), open = R.rolls.filter((r) => !r.done); if (!open.length) return;
    for (const r of open) { if (!r.player) r.player = { c: 'pass', v: 0 }; for (const c of Object.values(r.choices)) c.at = Math.min(c.at, t); }
    R.rollPause = false; rollsTick();
  }
  G.leaveGroup = function () {
    const S = G.S;
    if (G.fight && G.fight.kind === 'run') return toast('Finish the fight first.');
    settleRolls();
    if (S.run) {
      if (S.run.phase !== 'done' && S.group) {
        const m = S.group.members.find((x) => !x.gone);
        if (m) partySay(m, cpick(['wait what', 'bye then', 'k', 'rip']));
        const ms = G.deserterFor(S.run);
        if (ms) { S.flags.deserterUntil = now() + ms; sys(`You left before the end: Deserter for ${ms / 60000} minutes.`); }
        else sys('You left after a wipe: no Deserter.');
      }
      S.player.place = S.run.returnTo || 'goldshire';
    }
    S.run = null; S.group = null; delete S.player.syncLevel;
    sys('You left the group.');
    S.player.hp = S.player.hp == null ? null : S.player.hp;
    emit('change'); emit('runUpdate');
  };

  // ============================================================ chat
  G.say = function (ch, text, to) {
    const S = G.S;
    text = String(text).slice(0, 180);
    if (!text.trim()) return;
    if (ch === 'guild' && S.player.guild < 0) return toast('You are not in a guild.');
    if (ch === 'party' && !S.group && !S.wparty) return toast('You are not in a party.');
    if (ch === 'whisper' && to) S.lastWhisper = to;
    S.chat.push({ id: (S.chatSeq = (S.chatSeq || 0) + 1), t: now(), ch, from: S.player.name, cls: S.player.cls, me: true, to: ch === 'whisper' ? (to || S.lastWhisper) : undefined, text });
    B.respond(S, ch, text);
    emit('chat');
  };
  function sys(text) { if (G.S) { B.post(G.S, 'system', null, text); emit('chat'); } }
  function loot(text) { B.post(G.S, 'loot', null, text); emit('chat'); }
  function toast(text) { emit('toast', text); return text; }
  function info(text) { emit('info', text); return text; } // a yellow toast: something happened you should know, not a refusal (#178)
  G.sys = sys; G.toast = toast;
  G.emitChange = () => emit('change'); G.emitChat = () => emit('chat');

  // ============================================================ main loop
  let acc = 0, worldAcc = 0, saveAcc = 0;
  // the fight's clock for drawing (#116): the fight runs in fixed 0.1 s steps, so a bar drawn from C.t moved ten times a
  // second; this adds the time already gathered toward the next step, so it moves every frame and never runs ahead
  G.fightNow = () => (G.fight ? G.fight.t + Math.min(acc, 0.1) : 0);
  let socAcc = 0;
  // Battle speed (v10.3): fights run at 1x, 2x or 3x. Only fight time speeds up, and a group run's clock adds the fight
  // time gained, so par times and speed bonuses mean the same at every speed.
  G.SPEEDS = [1, 2, 3]; G.speed = 1;
  // PvP fights always run at 1× (#193): at 3× a human reads and reacts three times slower in game time while a bot
  // doesn't, so duels, war-mode ambushes, the Brawl and battlegrounds ignore the setting, which comes back in the next
  // PvE fight. The first one of a session with the setting above 1× says so once.
  G.PVP_KINDS = ['duel', 'pvp', 'brawl', 'bg'];
  G.isPvp = (C) => !!C && G.PVP_KINDS.includes(C.kind);
  let pvpSpeedTold = false;
  G.setSpeed = (x) => { G.speed = G.SPEEDS.includes(x) ? x : 1; return G.speed; };
  // the death recap (#192): who died, to what, and the facts of their last 5 seconds, read from the fight's own events.
  // Facts only: never blame, advice or a bot's skill. A ring of each ally's last 5 s of hits and heals, so nothing in
  // combat changes; G.recap holds the lines after a wipe in a run or your own death in the world, until the next pull.
  const RECAP_S = 5, RECAP_LOW_MANA = 0.15;
  const RECAP_LABEL = { slam: 'slam', hogger: 'lunge', whirl: 'whirling blades', molten: 'molten metal' };
  const fmtN = (n) => Math.round(n).toLocaleString('en-US');
  const RECAP_MISSED = { step: 'no Step Back', guard: 'slam not guarded', cut: 'not interrupted' }; // a telegraph in the last 5 s whose answer you had (#179)
  const roleOf = (u) => u.role || (u.kind === 'player' ? G.role() : null);
  function blowName(C, e) {
    const by = C.units[e.src], who = by ? `${by.name}'s ` : '', special = by && by.kind === 'mob' && (RECAP_LABEL[e.ab] || /^hard_/.test(e.ab || ''));
    if (e.tele) return who + e.tele; // a telegraphed mechanic by its cast's name (#179)
    const A = !special && e.ab && D.ABILITIES[e.ab]; // a creature's special shares ids with abilities ('slam')
    if (A) return A.name;
    if (!e.ab) return `${who}melee hit`;
    if (RECAP_LABEL[e.ab]) return who + RECAP_LABEL[e.ab];
    const hard = /^hard_(.+)$/.exec(e.ab);
    if (hard) return who + (hard[1] === 'hit' ? 'heavy hit' : `${hard[1]} attack`);
    return who + e.ab.replace(/_/g, ' ');
  }
  // the healer's state when an ally died, only when it says something: dead, out of range, low on mana, busy elsewhere
  function healerFact(C, u) {
    const hs = C.allies.filter((h) => h !== u && (h.kind === 'player' || h.kind === 'bot') && roleOf(h) === 'healer');
    if (!hs.length) return null;
    const live = hs.filter((h) => !h.dead);
    if (!live.length) return hs.length > 1 ? 'healers dead' : 'healer dead';
    if (live.every((h) => h.pos && u.pos && E.dist(h, u) > E.DIST.ally)) return `healer${live.length > 1 ? 's' : ''} out of range`;
    const mana = live.filter((h) => h.resType === 'mana' && h.maxRes > 0);
    if (mana.length === live.length && mana.every((h) => h.res / h.maxRes <= RECAP_LOW_MANA)) return `healer at ${Math.round(Math.min(...mana.map((h) => h.res / h.maxRes)) * 100)}% mana`;
    const busy = live.filter((h) => h.cast && h.cast.tgt != null && h.cast.tgt !== u.uid && C.units[h.cast.tgt]);
    if (live.length === 1 && busy.length === 1) return `healer casting on ${C.units[busy[0].cast.tgt].name}`;
    return null;
  }
  G.recapFeed = function (C, evs) {
    const R = C.recap = C.recap || { ring: {}, deaths: [] };
    const ally = (u) => u && u.side === 'ally' && (u.kind === 'player' || u.kind === 'bot');
    for (const e of evs) {
      if ((e.type === 'dmg' || e.type === 'heal') && ally(C.units[e.tgt])) (R.ring[e.tgt] = R.ring[e.tgt] || []).push({ t: e.t != null ? e.t : C.t, type: e.type, amount: e.amount || 0, src: e.src, ab: e.ab, melee: e.melee, tele: e.tele, teleMiss: e.teleMiss });
      else if (e.type === 'die' && ally(C.units[e.uid])) {
        const u = C.units[e.uid], t = e.t != null ? e.t : C.t, ring = (R.ring[u.uid] || []).filter((x) => x.t >= t - RECAP_S);
        const hits = ring.filter((x) => x.type === 'dmg'), heals = ring.filter((x) => x.type === 'heal'), kb = hits[hits.length - 1];
        R.deaths.push({ uid: u.uid, name: u.name, cls: u.cls, t, by: kb ? blowName(C, kb) : null, blow: kb ? kb.amount : 0, missed: (hits.find((x) => x.teleMiss) || {}).teleMiss || null,
          took: hits.reduce((a, x) => a + x.amount, 0), heal: heals.length ? t - heals[heals.length - 1].t : null, healer: healerFact(C, u) });
      }
    }
    for (const k in R.ring) { const r = R.ring[k]; while (r.length && r[0].t < C.t - RECAP_S) r.shift(); }
  };
  G.recapText = (d) => ({
    head: d.by ? `died to ${d.by} (${fmtN(d.blow)})` : 'died',
    facts: [d.missed ? RECAP_MISSED[d.missed] : null, `took ${fmtN(d.took)} in 5 s`, d.heal != null ? `last heal ${d.heal.toFixed(1)} s before` : 'no heal in 5 s', d.healer].filter(Boolean).join(' · '),
  });
  G.recap = null;
  G.on('fightStart', () => { G.recap = null; }); // until the next pull
  let lastTick = 0;
  G.update = function (dt) {
    const S = G.S;
    if (!S) return;
    { const t = now(); if (lastTick && t < lastTick - 5000) shiftClock(S, t - lastTick); lastTick = t; } // the clock moved back while playing (#410, #422)
    const fast = G.fight && G.speed > 1 && !G.isPvp(G.fight) ? G.speed : 1;
    if (G.speed > 1 && G.isPvp(G.fight) && !pvpSpeedTold) { pvpSpeedTold = true; emit('infoToast', 'PvP fights run at normal speed.'); }
    if (fast > 1 && S.run && !S.run.finishedAt) S.run.fastSecs = (S.run.fastSecs || 0) + dt * (fast - 1);
    if (G.paused && !G.fight && S.run && !S.run.finishedAt) S.run.pausedSecs = (S.run.pausedSecs || 0) + dt; // a story scene's time isn't the run's (#454), unless a fight goes on under it (#470)
    acc += dt * fast;
    if (S.player.fishing) try { fishTick(); } catch (e) { console.error(e); } // fishing (v10.9)
    socAcc += dt; if (socAcc >= 1) { socAcc = 0; if (root.SOC) try { SOC.tick(); } catch (e) { console.error(e); } try { G.brawlTick(); } catch (e) { console.error(e); } G.lnTick(); }
    if (S.snow) try { G.lnSnowTick(dt); } catch (e) { console.error(e); } // Longnight's Snowball Brawl
    S.player.played = (S.player.played || 0) + dt;
    if (S.healPick && !G.fight) healPickCheck(); // #156: the picked member left the party
    // combat at fixed 0.1s steps
    while (acc >= 0.1) {
      acc -= 0.1;
      const C = G.fight;
      if (C) {
        E.tick(C, 0.1);
        if (S.healPick) healPickCheck(); // #156: the picked member died
        if (C.kind === 'run') applyBossPlan(C);
        if (C.addAt && C.t >= C.addAt.t) {
          const L = C.addAt.inst.level; const mu = E.mobUnit(C.addAt.inst.key, L, L < G.SOCIAL.until ? { hp: 1, dmg: G.SOCIAL.lowDmg } : null); mu.inst = C.addAt.inst;
          E.addEnemy(C, mu); C.addAt = null; C.events.push({ type: 'join', uid: mu.uid }); // the fight list swaps its "joins in" row for the creature (#122)
          B.post(S, 'combat', null, `${mu.name} joins the fight!`);
        }
        if (C.kind === 'solo' && !C.wandererTried && C.t >= 3) G.wandererCheck(C);
        if (C.extraAt && C.t >= C.extraAt.t) {
          for (const k of C.extraAt.mobs) E.addEnemy(C, E.mobUnit(k, S.run.mobLevel || null, S.run.mult));
          C.extraAt = null;
          const tb = S.group.members.find((m) => m.role === 'tank');
          sys('Another pack joins the fight!');
          if (tb) partySay(tb, cpick(['oops', 'my bad', 'extra pack sry', 'uh oh']));
          else B.post(S, 'party', null, 'extra pack!');
        }
        if (C.kind === 'rehearsal' && C.events.length) rehearsalStep(C, C.events);
        if (C.kind === 'knock' && C.events.some((e) => e.type === 'tele' && e.what === 'land' && e.name === 'Hearthchill')) C.chilled = true; // A Knock at the Door: the home went cold
        if (C.events.length) { G.recapFeed(C, C.events); if (root.FLOG) FLOG.feed(C, C.events); emit('combat', C.events); C.events.length = 0; } // the fight log (#295) reads the same events
        if (C.over) {
          // a wipe in a run, or your own death out in the world: the recap of who died and why (#192)
          if (C.over === 'lose' && C.recap && C.recap.deaths.length && (C.kind === 'run' || (C.kind === 'solo' && G.pUnit && G.pUnit.dead))) {
            G.recap = { deaths: C.recap.deaths, self: C.kind === 'solo' }; emit('recap', G.recap);
          }
          if (root.FLOG) try { FLOG.end(C); } catch (e) { console.error(e); } // a lost fight is kept for Share fight log (#295)
          // a fight always ends (#121): if a step of its ending throws, the fight is still closed, so the error shows once
          // instead of the ending being retried every frame (paying the kill again each time) with the game stuck in it
          try { if (C.kind === 'knock') endKnock(C); else if (C.kind === 'rehearsal') endRehearsal(C); else if (C.kind === 'solo') endSolo(C); else if (C.kind === 'pvp') endPvp(C); else if (C.kind === 'duel') endDuel(C); else if (C.kind === 'bg') endBgFight(C); else if (C.kind === 'brawl') endBrawlFight(C); else endRunFight(C); }
          finally { if (G.fight === C) { G.fight = null; G.pUnit = null; emit('fightEnd', { result: C.over }); } }
        }
      }
    }
    worldAcc += dt;
    if (worldAcc >= 1) {
      const step = worldAcc; worldAcc = 0;
      if (!G.fight) restTick(step);
      else if (S.player.travel) S.player.travel = null;
      worldTick();
      partyTick();
      ambushTick();
      helpWantedTick();
      ahTick();
      runTick();
      rollsTick();
      const before = S.chat.length;
      B.chatTick(S, now());
      if (S.chat.length !== before) emit('chat');
      if (S.queue && now() >= S.queue.popAt && !S.queue.popped) {
        const A = D.ACTIVITIES[S.queue.act]; S.queue.popped = true; S.queue.poppedAt = now();
        if (!A.bg) S.queue.group = pickGroup(S.queue.act, S.queue.trial ? { trial: S.queue.trial } : S.queue.hard ? { hard: true } : undefined); // who you'll play with (#189)
        emit('pop', S.queue);
      } else if (S.queue && S.queue.popped && now() >= (S.queue.poppedAt || now()) + G.POP_WAIT) {
        // a pop nobody answers times out, as in an MMO (#412): the group goes on, and nobody is held
        S.queue = null; sys("You didn't answer in time: the group went on without you."); emit('popExpired'); emit('change');
      }
      // bots keep levelling while you play
      if (now() - S.lastSim > 60000) { const news = B.advance(S, now() - S.lastSim); for (const n of news) if (n.big) sys(n.text); }
    }
    saveAcc += dt;
    if (saveAcc >= 10) { saveAcc = 0; G.save(); }
  };

  // ============================================================ festivals (v10.13): Lanternwake
  // A festival (D.EVENTS[key]) is on from its `from` to its `to` day every year, in the player's own time, so it comes
  // back by itself with no release. `force: 'test'` keeps it on in test builds (beta and dev) until it is set back by
  // hand. Candles are per character, earned up to a daily cap and gone when the festival ends; what they buy is kept by
  // the account (account.lw). Nothing here gives power. Design: docs/plans/2026-10-11-lanternwake-design.md
  G.testBuild = () => !!(root.AZ_DEV || /-beta\./.test(String(root.AZ_VERSION || '')));
  // [start, end) of the festival that starts in year y; one that ends before it starts (Longnight: 15 December to 4 January) ends the next year
  const evDays = (Ev, y) => { const wrap = Ev.to[0] < Ev.from[0]; return [new Date(y, Ev.from[0] - 1, Ev.from[1]), new Date(y + (wrap ? 1 : 0), Ev.to[0] - 1, Ev.to[1] + 1)]; };
  // the year its current window started, or null outside it (a January date can be in last year's window)
  const winYear = (Ev, d) => { for (const y of [d.getFullYear(), d.getFullYear() - 1]) { const [a, b] = evDays(Ev, y); if (d >= a && d < b) return y; } return null; };
  const inWindow = (Ev, d) => winYear(Ev, d) != null;
  G.eventLive = function (key, date) {
    const Ev = (D.EVENTS || {})[key]; if (!Ev) return false;
    const d = date || new Date(now());
    return inWindow(Ev, d) || (Ev.force === 'test' && G.testBuild());
  };
  G.liveEvents = (date) => Object.keys(D.EVENTS || {}).filter((k) => G.eventLive(k, date));
  // when it ends (null while a test build keeps it on outside its dates), and when it next starts
  G.eventEnds = function (key) { const Ev = D.EVENTS[key], d = new Date(now()), y = winYear(Ev, d); return y != null ? evDays(Ev, y)[1] : null; };
  G.eventNext = function (key) { const Ev = D.EVENTS[key], d = new Date(now()), [a] = evDays(Ev, d.getFullYear()); return d < a ? a : evDays(Ev, d.getFullYear() + 1)[0]; };
  // the season's id: the year, or 'test-<year>' for a test build outside the dates, so test candles never carry over
  G.eventSeason = function (key) { const d = new Date(now()), y = winYear(D.EVENTS[key], d); return y != null ? String(y) : 'test-' + d.getFullYear(); };
  G.eventStart = function (key) { const Ev = D.EVENTS[key], d = new Date(now()), y = winYear(Ev, d); return y != null ? evDays(Ev, y)[0] : null; };

  // ---- This week (#541): the banners from D.WEEK that are on today, picked by date, plus a live festival (first) and,
  // with nothing else on, the next festival. A step's check is one of these by name, so the data has no code in it.
  G.WEEK_CHECKS = {
    level: (n) => G.S.player.level >= n,
    friends: (n) => Object.keys((G.S.soc && G.S.soc.friends) || {}).length >= n,
    guild: () => G.S.player.guild >= 0,
    quest: (id) => !!G.S.player.done[id],
    featured_dungeon: () => G.featuredDungeonClaimed(),
    featured_raid: () => G.featuredClaimed(),
    // the boards (#541): each reads what the game already keeps
    bounty_week: () => Object.values(G.S.player.bounty || {}).some((b) => b.weekly && b.done && bountyLive(b)),
    bounty_day: () => Object.values(G.S.player.bounty || {}).some((b) => !b.weekly && b.done && bountyLive(b)),
    guild_goal: () => { const w = root.SOC && SOC.week(); return !!(w && w.done); },
    world_boss: () => { const wb = G.worldBoss(); return !!wb && G.worldBossLooted(wb); },
    trials_week: () => { const R = G.trials(), T = root.TRIALS; return !!(R.week && R.week.paid && T && R.week.id === T.period(new Date(now())).id); },
    roulette: () => !G.rouletteReady(),
    brawl_chest: () => !G.brawlChestOpen(),
    // the pre-patch (#543): what it asks of you, each read from what the game keeps
    debt_notes: (n) => (G.S.player.debtNotes || 0) >= n || !!G.account().debtBreaker,
    debt_breaker: () => !!G.account().debtBreaker,
    prepatch_open: () => G.prepatchOpen(),
    prepatch_ability: () => { const id = D.PREPATCH_ABILITIES && D.PREPATCH_ABILITIES[G.S.player.cls], a = id && D.ABILITIES[id]; return !!(a && G.S.player.done[a.learn]); },
    prepatch_campaign: () => !!(G.S.player.done.pp_a_crown || G.S.player.done.pp_h_crown),
    // the Account bank (#543)
    abank: (n) => AB.view(G.abank()).length >= n,
    abank_tab: () => G.abank().tabs >= 1,
    mat_bag: () => (G.S.player.bagsEq || []).some((b) => b.matBag),
  };
  // The Weekly Board and the Daily Board: banners of their own every week and every day, listing only the steps this
  // character can do (a step's `need`: 'cap' level 60, 'guild' in a guild, 'brawl' the Brawl's level)
  const canDo = (need) => { const P = G.S.player; return !need || (need === 'cap' ? P.level >= D.LEVEL_CAP : need === 'guild' ? P.guild >= 0 : need === 'brawl' ? P.level >= G.BRAWL.minLvl : true); };
  function boards(d) {
    const P = G.S.player, day = new Date(d.getFullYear(), d.getMonth(), d.getDate()), sun = new Date(day); sun.setDate(sun.getDate() + (7 - sun.getDay()) % 7);
    const wb = G.worldBoss(d), wbName = wb && D.MOBS[D.ACTIVITIES[wb].boss] ? D.MOBS[D.ACTIVITIES[wb].boss].name : null;
    const week = [
      { text: 'Finish a weekly bounty at a town\u2019s Bounty Board', check: ['bounty_week', 1], go: 'bounty' },
      { text: 'Help your guild reach its weekly goal', check: ['guild_goal', 1], go: 'social:guild', need: 'guild' },
      wbName ? { text: `Defeat this week\u2019s world boss, ${wbName}`, check: ['world_boss', 1], go: 'worldboss', need: 'cap' } : null,
      { text: 'Finish 4 Trials at your best this week', check: ['trials_week', 1], go: 'lfg:trials', need: 'cap' },
    ].filter((x) => x && canDo(x.need));
    const today = [
      { text: 'Finish a daily bounty', check: ['bounty_day', 1], go: 'bounty' },
      P.level >= 15 ? { text: 'Run today\u2019s Dungeon Roulette', check: ['roulette', 1], go: 'lfg:you' } : null,
      { text: 'Win the Bloodsand Brawl\u2019s chest', check: ['brawl_chest', 1], go: 'brawl', need: 'brawl' },
    ].filter((x) => x && canDo(x.need));
    return [
      { id: 'board_w' + dayNum(sun), kind: 'now', board: 'week', title: 'The Weekly Board', art: ['banner', 'weekly_board'], artHorde: ['banner', 'weekly_board_h'], to: sun,
        text: ['What the realm asks of you this week. Each one pays once a week. They start again on Monday, except Trials, which start again on the 1st, 8th, 15th and 22nd.'], steps: week },
      { id: 'board_d' + dayNum(day), kind: 'now', board: 'day', quiet: true, title: 'The Daily Board', art: ['banner', 'daily_board'], artHorde: ['banner', 'daily_board_h'], to: day,
        text: ['Today\u2019s jobs. They start again at midnight.'], steps: today },
    ];
  }
  const wkDay = (t, end) => { const [y, m, d] = t.split('-').map(Number); return end ? new Date(y, m - 1, d, 23, 59, 59, 999) : new Date(y, m - 1, d); };
  G.weekDay = wkDay;
  G.weekBanners = function (date) {
    const d = date || new Date(now()), out = [];
    for (const k of G.liveEvents(d)) out.push({ id: 'ev_' + k + '_' + G.eventSeason(k), kind: 'now', event: k, title: D.EVENTS[k].name, text: [D.EVENTS[k].story[0]], steps: [], to: G.eventEnds(k) });
    const order = { now: 0, new: 1, soon: 2 };
    const own = (D.WEEK || []).filter((b) => wkDay(b.from) <= d && d <= wkDay(b.to, true)).sort((a, b) => order[a.kind] - order[b.kind]);
    out.push(...own); // what we wrote for this week first: it's what the sheet is for (new content on the first screen)
    { const fr = G.S && G.S.player.level >= D.LEVEL_CAP && G.featuredRaid(d); // the featured raid (#541): its own banner, every week, by itself
      if (fr) { const A = D.ACTIVITIES[fr], end = new Date(d.getFullYear(), d.getMonth(), d.getDate()); end.setDate(end.getDate() + (7 - end.getDay()) % 7); // its Sunday
        out.push({ id: 'raid_' + fr + '_' + dayNum(end), kind: 'now', title: `Featured raid: ${A.name}`, art: ['banner', 'raid_' + fr], artHorde: ['banner', 'raid_' + fr + '_h'], to: end,
          text: [`Its first clear this week, on Normal or Hard, gives ${G.FEATURED_MARKS} Mentor Marks${G.raidLooksLeft(fr).length ? ' and a look from its set you don\u2019t have yet' : ''}. A new raid is featured each Monday.`],
          steps: [{ text: `Clear ${A.name} this week`, check: ['featured_raid', 1], go: 'lfg:raid' }] }); } }
    if (G.S && G.S.player.level >= 10) out.push(...boards(d)); // the boards last: they're every week's
    if (!G.liveEvents(d).length && !own.length && D.EVENTS) { const k = Object.keys(D.EVENTS).sort((a, b) => G.eventNext(a) - G.eventNext(b))[0]; if (k) out.push({ id: 'ev_next_' + k, kind: 'soon', event: k, title: D.EVENTS[k].name, text: [D.EVENTS[k].story[0]], steps: [], atDate: G.eventNext(k) }); }
    return out;
  };
  G.weekStepDone = (st) => { const f = st.check && G.WEEK_CHECKS[st.check[0]]; return f ? !!f(st.check[1]) : null; }; // null: a tip, nothing to tick
  // done / of over every checked step this week ('soon' banners' steps count too: they're how to get ready)
  G.weekProgress = function (list) {
    let n = 0, of = 0;
    for (const b of list || G.weekBanners()) for (const st of b.steps || []) { const v = G.weekStepDone(st); if (v === null) continue; of++; if (v) n++; }
    return { n, of };
  };
  const LW = () => D.EVENTS.lanternwake;
  G.lwAccount = function () { const a = G.account(); a.lw = Object.assign({ owned: [], steed: false, steedKills: 0, keepsakes: [], town: {} }, a.lw); return a; };
  // a test build's season (a beta or dev build outside the dates) keeps what it gives apart, in account.lwTest, so a beta
  // tester's characters (shared with the live game) never carry it: G.lwRevokeTest takes it back outside test seasons
  G.lwTesting = () => G.eventLive('lanternwake') && /^test/.test(G.eventSeason('lanternwake'));
  const lwRec = (a) => { if (!G.lwTesting()) return a.lw; a.lwTest = Object.assign({ owned: [], steed: false, steedKills: 0, keepsakes: [], town: {}, looks: [] }, a.lwTest); return a.lwTest; };
  G.lwRec = () => lwRec(G.lwAccount());
  // a look given in a test season is noted, so it can be taken back
  const lwCollect = (it) => { if (!G.collectLook(it) || !G.lwTesting()) return false; const a = G.lwAccount(), l = it.look || D.ITEMS[it.id].look; lwRec(a).looks.push(l[0] + ':' + l[1]); G.saveAccount(a); return true; };
  // outside a test season: the test record's looks leave the wardrobe and the record goes (once for the account); then this
  // character keeps only what the real record backs: the Steed, Flicker, the title, worn looks, and no festival use items
  G.lwRevokeTest = function () {
    if (G.lwTesting()) return;
    const a = G.lwAccount();
    if (a.lwTest) { const gone = new Set(a.lwTest.looks || []); a.looks = (a.looks || []).filter((k) => !gone.has(k)); delete a.lwTest; G.saveAccount(a); }
    const P = G.S && G.S.player; if (!P) return;
    const owned = a.lw.owned, looks = G.account().looks || [];
    if (P.mounts && !a.lw.steed && P.mounts.includes('wickless_steed')) { P.mounts = P.mounts.filter((m) => m !== 'wickless_steed'); if (P.mount === 'wickless_steed') P.mount = null; }
    if (P.companion && D.COMPANIONS[P.companion] && D.COMPANIONS[P.companion].event && !owned.includes(P.companion)) P.companion = null;
    const t = D.TITLES.find((x) => x.id === P.title); if (t && t.need.event && !owned.includes(t.need.event)) P.title = null;
    for (const pl in P.wardrobe || {}) { const k = P.wardrobe[pl]; if (/^lw_/.test(k) && !looks.includes(pl + ':' + k)) delete P.wardrobe[pl]; }
    // festival wares go when the festival ends (once, while its record is still here), so a reward mailed after it stays (#382); only Lanternwake's own (#403)
    if (P.lw && (!G.eventLive('lanternwake') || /^test/.test(P.lw.season))) { const keep = (b) => (D.ITEMS[b.item.id] || {}).event !== 'lanternwake'; P.bags = (P.bags || []).filter(keep); if (P.bank) P.bank = P.bank.filter(keep); } // the bank too (#441)
  };
  // this character's festival state; null when Lanternwake is not on. A new season (or a new day) starts it fresh
  G.lw = function () {
    const P = G.S && G.S.player; if (!P || !G.eventLive('lanternwake')) return null;
    const season = G.eventSeason('lanternwake');
    if (P.lw && P.lw.season !== season && /^test/.test(P.lw.season)) G.lwRevokeTest(); // the real season starts while playing
    if (!P.lw || P.lw.season !== season) P.lw = { season, candles: 0, day: null, today: 0, lit: [], lootDay: null, hardDay: null };
    if (!P.lw.day || P.lw.day < dayKey()) Object.assign(P.lw, { day: dayKey(), today: 0, lit: [] });
    return P.lw;
  };
  // candles left out of a festival that has ended go (they are worth nothing after it)
  G.lwExpire = function () { const P = G.S && G.S.player; if (P && P.lw && !G.eventLive('lanternwake')) delete P.lw; };
  // earn candles from play, up to the daily cap; returns how many were given
  G.lwEarn = function (n, why, quiet) {
    const st = G.lw(); if (!st || !n) return 0;
    const cap = LW().cap, got = Math.max(0, Math.min(n, cap - st.today));
    if (!got) return 0;
    st.today += got; st.candles += got;
    if (!quiet) loot(`+${got} Wake Candle${got === 1 ? '' : 's'} (${why}) · today ${st.today}/${cap}`);
    if (st.today >= cap) sys(`Daily Wake Candle cap reached (${cap}/${cap}). Resets at midnight.`);
    emit('candles', { got, why });
    return got;
  };
  // a creature you can still learn from (not grey: 5 or more levels under you) pays a candle, even at the level cap
  G.lwKill = function (mobLvl, elite) { if (G.S.player.level - mobLvl >= 5) return 0; return G.lwEarn(elite ? LW().earn.elite : LW().earn.kill, 'a kill', true); };
  // Light the Way: once a day, light a lantern at 5 different places out in the world (not in towns)
  G.lwCanLight = function (place) {
    const st = G.lw(), Pl = D.PLACES[place || G.S.player.place];
    if (!st || !Pl || Pl.safe || G.S.run || G.S.bg) return null;
    if (st.lit.length >= LW().light) return 'done';
    return st.lit.includes(place || G.S.player.place) ? 'lit' : 'ready';
  };
  G.lwLight = function () {
    const P = G.S.player, st = G.lw(), can = G.lwCanLight(P.place);
    if (can !== 'ready') return toast(can === 'lit' ? 'Already lit today.' : can === 'done' ? 'All lanterns lit today.' : 'No lantern here.');
    if (G.fight) return toast('You are in combat.');
    st.lit.push(P.place);
    sys(`Lantern lit: ${D.PLACES[P.place].name} (${st.lit.length}/${LW().light}).`);
    if (st.lit.length >= LW().light) G.lwEarn(LW().earn.light, 'Light the Way');
    emit('change'); G.save();
  };
  // the keeper's wares: looks, Flicker and the title once each for the account; the candle sink as often as you like
  G.lwOwned = (id) => G.lwRec().owned.includes(id) || (D.ITEMS[id] && D.ITEMS[id].look && (G.account().looks || []).includes(D.ITEMS[id].look.join(':')));
  G.lwShopName = (s) => s.kind === 'companion' ? D.COMPANIONS[s.id].name : s.kind === 'title' ? G.titleName(D.TITLES.find((t) => t.id === s.id), G.S.player.name) : D.ITEMS[s.id].name;
  G.lwBuy = function (id) {
    const s = LW().shop.find((x) => x.id === id), st = G.lw();
    if (!s) return;
    if (!st) return toast('Lanternwake is over.');
    if (s.kind !== 'use' && G.lwOwned(id)) return toast('Already owned.');
    if (st.candles < s.cost) return toast(`Need ${s.cost} Wake Candles (you have ${st.candles}).`);
    if (s.kind === 'use' && !G.addItem(G.copyItem(id), 1)) return toast('Bags are full.');
    st.candles -= s.cost;
    if (s.kind !== 'use') { const a = G.lwAccount(); lwRec(a).owned.push(id); G.saveAccount(a); }
    if (s.kind === 'look') lwCollect(D.ITEMS[id]); // after the save above, which would otherwise write over it
    if (s.kind === 'companion') emit('collected', { companion: id });
    loot(`Bought ${s.kind === 'look' || s.kind === 'use' ? B.link(D.ITEMS[id].name, D.ITEMS[id].q) : G.lwShopName(s)} (${s.cost} Wake Candles).` + (s.kind === 'look' ? ' Added to your wardrobe.' : s.kind === 'title' ? ' Wear it: Hero → Journey → Titles.' : s.kind === 'companion' ? ' Summon it: Hero → Journey → Companions.' : ''));
    emit('bought'); emit('change'); G.save();
  };
  // companions (v10.13): a small friend that follows you, only a look. Owned by the account, chosen per character
  G.companions = () => Object.keys(D.COMPANIONS || {}).filter((k) => G.lwRec().owned.includes(k) || (D.COMPANIONS[k].event === 'longnight' && G.lnRec().owned.includes(k)));
  G.setCompanion = function (key) { const P = G.S.player; if (key && !G.companions().includes(key)) return; P.companion = key || null; emit('change'); G.save(); };
  // the candle sink, used from your bags
  G.lwUse = function (idx) {
    const S = G.S, P = S.player, b = P.bags[idx], it = b && D.ITEMS[b.item.id]; if (!it) return;
    if (!G.eventLive('lanternwake')) return toast('Lanternwake is over. It works again next Lanternwake.'); // #441, kept for next year (#475)
    if (it.costume) {
      let mob = it.costume;
      if (mob === 'local') { const Pl = D.PLACES[P.place], pool = Object.values(D.PLACES).filter((x) => x.region === Pl.region).flatMap((x) => (x.mobs || []).map((m) => m[0])).filter((k) => D.MOBS[k] && !D.MOBS[k].boss); if (!pool.length) return toast('No creatures live in this zone to dress up as.'); mob = pick(pool); }
      P.costume = { mob, until: now() + 3600000 };
      G.removeItem(it.id, 1); sys(`You look like ${/^[AEIOU]/.test(D.MOBS[mob].name) ? 'an' : 'a'} ${D.MOBS[mob].name} for 1 hour.`);
    } else if (it.treat) {
      const near = (B.onlineIn(S, P.place, new Date(now())) || []).filter((x) => B.factionOf(x) === B.factionOf(P));
      if (!D.PLACES[P.place].safe || !near.length) return toast('Toss treats in a town.');
      const bot = pick(near); G.removeItem(it.id, 1);
      sys(`You toss a Lanternwake Treat to ${bot.name}.`);
      S.pending.push({ at: now() + 1200 + crand() * 1500, bot: bot.id, ch: 'say', text: cpick([`thanks for the treat ${P.name}!`, `ty for the treat!`, `oh a Lanternwake treat, thank you ${P.name}`, `ty ${P.name}, happy Lanternwake`]), fromName: bot.name });
    } else if (it.townLantern) {
      if (!D.PLACES[P.place].safe) return toast('Only in a town.');
      const a = G.lwAccount(), t = lwRec(a).town; G.removeItem(it.id, 1);
      const key = G.eventSeason('lanternwake') + ':' + P.place; t[key] = (t[key] || 0) + 1; G.saveAccount(a);
      sys(`Lantern hung: ${D.PLACES[P.place].name} (${t[key]} this festival).`);
    } else return;
    emit('change'); G.save();
  };
  G.lwTownLanterns = (place) => (G.lwRec().town[G.eventSeason('lanternwake') + ':' + place] || 0);
  G.costumeOf = (P) => (P && P.costume && P.costume.until > now() && D.MOBS[P.costume.mob] ? P.costume.mob : null);
  // the Snuffed Road's loot, once a day each on Normal and on Hard; every daily Normal kill counts toward the Steed
  G.lwDaily = () => { const st = G.lw(), d = dayKey(); return { normal: !!st && !(st.lootDay >= d), hard: !!st && !(st.hardDay >= d) }; }; // a later day only (#402)
  G.lwHardOpen = () => !!(((G.S.player.codex || {})[LW().act] || {}).clears);
  G.lwHardLeft = () => LW().set.filter((id) => !(G.account().looks || []).includes(D.ITEMS[id].look[0] + ':' + D.ITEMS[id].look[1] + '_hard'));
  function lwBossLoot(R) {
    const Ev = LW(), st = G.lw(), a = G.lwAccount(), r = lwRec(a), d = dayKey();
    if (!st) return;
    const season = G.eventSeason('lanternwake');
    if (!r.keepsakes.includes(season) && !/^test/.test(season)) { r.keepsakes.push(season); G.saveAccount(a); loot(`Keepsake earned: Lanternwake ${season}.`); }
    if (R.hard) {
      if (st.hardDay === d) return sys('Hard loot already taken today.');
      st.hardDay = d;
      const left = G.lwHardLeft();
      if (left.length) { const it = D.ITEMS[pick(left)]; lwCollect({ look: [it.look[0], it.look[1] + '_hard'] }); loot(`New look: ${B.link(it.name + ' (Hard)', it.q)}.`); }
      else sys('All Hard looks collected.');
      G.lwEarn(Ev.earn.daily, 'the Wickless Knight on Hard');
      return;
    }
    if (st.lootDay === d) return sys('Daily loot already taken today.');
    st.lootDay = d;
    G.lwEarn(Ev.earn.daily, 'the Wickless Knight');
    if (r.steed) return;
    r.steedKills++;
    if (r.steedKills >= Ev.steedAt || Math.random() < Ev.steedChance) {
      r.steed = true; G.giveTrialswornMount('wickless_steed');
      loot(`New mount: ${B.link('Wickless Steed', 4)}!`);
    } else sys(`No Wickless Steed (${r.steedKills}/${Ev.steedAt}).`);
    G.saveAccount(a);
  }
  G.lwBossLoot = lwBossLoot;

  // ---- Longnight (v10.17): the winter festival, 15 December to 4 January (docs/plans/2026-11-01-longnight-design.md).
  // No candles and no vendor: a calendar door for each day's daily, and Kindling for the town hearth (Hearth ranks).
  // Rewards are the account's (G.lnRec, apart in a test season as Lanternwake's are); progress is the character's (P.ln)
  const LN = () => D.EVENTS.longnight;
  const DAY = 86400000;
  G.lnOn = () => G.eventLive('longnight');
  G.lnAccount = function () { const a = G.account(); a.ln = Object.assign({ owned: [], hound: false, houndKills: 0, stag: false, stagKills: 0, keepsakes: [], town: {} }, a.ln); return a; };
  G.lnTesting = () => G.lnOn() && /^test/.test(G.eventSeason('longnight'));
  const lnRec = (a) => { if (!G.lnTesting()) return a.ln; a.lnTest = Object.assign({ owned: [], hound: false, houndKills: 0, stag: false, stagKills: 0, keepsakes: [], town: {}, looks: [] }, a.lnTest); return a.lnTest; };
  G.lnRec = () => lnRec(G.lnAccount());
  const lnCollect = (look) => { if (!G.collectLook({ look }) || !G.lnTesting()) return false; const a = G.lnAccount(); lnRec(a).looks.push(look[0] + ':' + look[1]); G.saveAccount(a); return true; };
  // outside a test season: the test record's looks and rewards go (as G.lwRevokeTest)
  G.lnRevokeTest = function () {
    if (G.lnTesting()) return;
    const a = G.lnAccount();
    if (a.lnTest) { const gone = new Set(a.lnTest.looks || []); a.looks = (a.looks || []).filter((k) => !gone.has(k)); delete a.lnTest; G.saveAccount(a); }
    const P = G.S && G.S.player; if (!P) return;
    const owned = a.ln.owned, looks = G.account().looks || [];
    for (const [m, ok] of [['frost_hound', a.ln.hound], ['pale_stag', a.ln.stag]]) if (P.mounts && !ok && P.mounts.includes(m)) { P.mounts = P.mounts.filter((x) => x !== m); if (P.mount === m) P.mount = null; }
    if (P.companion && D.COMPANIONS[P.companion] && D.COMPANIONS[P.companion].event === 'longnight' && !owned.includes(P.companion)) P.companion = null;
    const t = D.TITLES.find((x) => x.id === P.title); if (t && t.need.event && /^ln_/.test(t.need.event) && !owned.includes(t.need.event)) P.title = null;
    for (const pl in P.wardrobe || {}) { const k = P.wardrobe[pl]; if (/^ln_/.test(k) && !looks.includes(pl + ':' + k)) delete P.wardrobe[pl]; }
    if (P.ln && (!G.lnOn() || /^test/.test(P.ln.season))) { const keep = (b) => (D.ITEMS[b.item.id] || {}).event !== 'longnight'; P.bags = (P.bags || []).filter(keep); if (P.bank) P.bank = P.bank.filter(keep); } // as Lanternwake's (#382, #441)
  };
  G.lnOwned = (id) => G.lnRec().owned.includes(id);
  const lnOwn = (id) => { const a = G.lnAccount(), r = lnRec(a); if (!r.owned.includes(id)) r.owned.push(id); G.saveAccount(a); };
  // the festival's day: 0 on 15 December; a test season counts from the first day it was seen
  const lnMid = (t) => { const d = new Date(t); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); };
  G.lnDay = function () {
    const st = G.ln(); if (!st) return 0;
    const start = G.eventStart('longnight'), from = start ? start.getTime() : st.first;
    return Math.max(0, Math.round((lnMid(now()) - lnMid(from)) / DAY));
  };
  // the New Year finale (31 December on); a test season has it on, so the raid can be tried
  G.lnFinale = function () {
    if (!G.lnOn()) return false; if (G.lnTesting()) return true;
    const d = new Date(now()), f = LN().finale; return d.getMonth() === 0 || (d.getMonth() + 1 === f[0] && d.getDate() >= f[1]);
  };
  // the town's stage (0 to 4) from fixed dates; a test season moves a stage a day
  G.lnStage = function () {
    if (!G.lnOn()) return 0; if (G.lnTesting()) return Math.min(LN().stages.length, 1 + G.lnDay());
    const d = new Date(now()); if (d.getMonth() === 0) return LN().stages.length;
    return LN().stages.filter((s) => d.getMonth() + 1 === s.on[0] && d.getDate() >= s.on[1]).length;
  };
  // the great hearth's fill (0 to 1): the whole server's, so it moves with the clock from the first day to the finale
  G.lnHearthFill = function () {
    if (!G.lnOn()) return 0; if (G.lnFinale() && !G.lnTesting()) return 1;
    const start = G.eventStart('longnight'), fin = start ? new Date(start.getFullYear(), LN().finale[0] - 1, LN().finale[1]).getTime() : 0;
    if (!start) return Math.min(1, (G.lnStage() + 0.5) / (LN().stages.length + 0.5));
    return Math.max(0, Math.min(1, (now() - start.getTime()) / (fin - start.getTime())));
  };
  // this character's festival state; null when Longnight is not on. A new season starts it fresh, a new day the daily
  G.ln = function () {
    const P = G.S && G.S.player; if (!P || !G.lnOn()) return null;
    const season = G.eventSeason('longnight');
    if (P.ln && P.ln.season !== season && /^test/.test(P.ln.season)) G.lnRevokeTest();
    if (P.ln && P.ln.season !== season) lnMailOwed(P.ln);
    if (!P.ln || P.ln.season !== season) P.ln = { season, first: lnMid(now()), kindling: 0, rank: 0, doors: [], ready: 0, day: null, done: false, prog: {}, lootDay: null, hardDay: null, guestDay: null, guestHardDay: null };
    if (!P.ln.day || P.ln.day < dayKey()) Object.assign(P.ln, { day: dayKey(), done: false, prog: { wins: 0, homes: [], wood: [], cooked: false, bowls: 0 } });
    return P.ln;
  };
  // rewards still waiting at the Hearthwarden go to the mail when the festival ends, never lost with it (#382); a test
  // build's season keeps nothing
  function lnMailOwed(st) { if (st && st.owed && !/^test/.test(st.season || '')) for (const r of st.owed) if (D.ITEMS[r.item]) G.mailSend({ kind: 'reward', from: D.EVENTS.longnight.name, item: G.copyItem(r.item), n: r.n || 1 }); }
  G.lnExpire = function () { const P = G.S && G.S.player; if (P && P.ln && !G.lnOn()) { lnMailOwed(P.ln); delete P.ln; } };
  // today's daily: snow (Snowball Brawl), knock (A Knock at the Door) or stew (Longnight Stew), in turn
  G.lnToday = () => LN().dailies[G.lnDay() % LN().dailies.length];
  G.LN_DAILY = { snow: 'Snowball Brawl', knock: 'A Knock at the Door', stew: 'Longnight Stew' };
  // how far today's daily is: { n, of, text }
  G.lnProgress = function () {
    const st = G.ln(); if (!st) return null;
    const k = G.lnToday(), p = st.prog, E0 = LN();
    if (k === 'snow') return { n: Math.min(p.wins, E0.snow.wins), of: E0.snow.wins, text: `Rounds won: ${Math.min(p.wins, E0.snow.wins)}/${E0.snow.wins}`, short: `Wins ${Math.min(p.wins, E0.snow.wins)}/${E0.snow.wins}` };
    if (k === 'knock') return { n: p.homes.length, of: E0.knock, text: `Homes kept warm: ${p.homes.length}/${E0.knock}`, short: `Homes ${p.homes.length}/${E0.knock}` };
    const w = E0.stew;
    if (p.wood.length < w.wood) return { n: p.wood.length, of: w.wood, text: `Firewood: ${p.wood.length}/${w.wood}`, short: `Firewood ${p.wood.length}/${w.wood}` };
    if (!p.cooked) return { n: 0, of: 1, text: 'Cook the stew at a great hearth', short: 'Cook it' };
    return { n: p.bowls, of: w.bowls, text: `Bowls handed out: ${p.bowls}/${w.bowls}`, short: `Bowls ${p.bowls}/${w.bowls}` };
  };
  // the calendar: doors whose day has come, opened, and ready to open
  G.lnDoorsDue = () => Math.min(LN().doors.length, G.lnDay() + 1);
  function lnDailyDone() {
    const st = G.ln(); if (!st || st.done) return;
    st.done = true;
    const behind = G.lnDoorsDue() - st.doors.length - st.ready, k = Math.max(0, Math.min(LN().perDay, behind));
    st.ready += k;
    sys(`Daily done: ${G.LN_DAILY[G.lnToday()]}.` + (k ? ` Doors to open: ${k}.` : ''));
    G.lnGive(LN().earn.daily, 'the daily');
    emit('lnDaily'); emit('change'); G.save();
  }
  G.lnDailyDone = lnDailyDone;
  // open the next calendar door: its toy goes to your bags, its look to your wardrobe, door 16's fox to your companions
  G.lnOpenDoor = function () {
    const st = G.ln(); if (!st) return toast('Longnight is over.');
    if (st.ready <= 0) return toast(st.doors.length >= LN().doors.length ? 'Every door is open.' : 'Finish today\'s daily to open a door.');
    const i = st.doors.length, d = LN().doors[i]; if (!d) return;
    if (d.item && !G.addItem(G.copyItem(d.item), d.n || 1)) return toast('Bags are full.');
    st.ready--; st.doors.push(i);
    if (d.item) loot(`Door ${i + 1}: ${B.link(D.ITEMS[d.item].name, D.ITEMS[d.item].q)}${d.n > 1 ? ' x' + d.n : ''}.`);
    if (d.look) { lnCollect(D.ITEMS[d.look].look); loot(`Door ${i + 1}: ${B.link(D.ITEMS[d.look].name, 4)}. Added to your wardrobe.`); }
    if (d.companion) { lnOwn(d.companion); emit('collected', { companion: d.companion }); loot(`Door ${i + 1}: ${D.COMPANIONS[d.companion].name}, a companion. Summon it: Hero → Journey → Companions.`); }
    emit('lnDoor', { i }); emit('change'); G.save();
    return i;
  };
  // Kindling for the great hearth: no cap; each rank's reward once
  G.lnRankOf = (n) => LN().ranks.filter((r) => n >= r.at).length;
  G.lnGive = function (n, why, quiet) {
    const st = G.ln(); if (!st || !n) return 0;
    st.kindling += n;
    if (!quiet) loot(`+${n} Kindling (${why}).`);
    const rk = G.lnRankOf(st.kindling);
    while (st.rank < rk) {
      const R = LN().ranks[st.rank]; st.rank++;
      sys(`Hearth rank ${st.rank}: ${R.name}.`);
      if (R.reward.item) { if (G.addItem(G.copyItem(R.reward.item), R.reward.n || 1)) loot(`Received ${B.link(D.ITEMS[R.reward.item].name, 1)} x${R.reward.n || 1}.`); else sys('Bags are full: the reward waits at the Hearthwarden.'), st.owed = (st.owed || []).concat([R.reward]); }
      if (R.reward.title) { lnOwn(R.reward.title); loot(`New title: ${G.titleName(D.TITLES.find((t) => t.id === R.reward.title), G.S.player.name)}. Wear it: Hero → Journey → Titles.`); }
      emit('lnRank', { rank: st.rank });
    }
    emit('kindling', { n, why });
    return n;
  };
  // a reward a full bag could not take, handed over at the Hearthwarden
  G.lnClaimOwed = function () { const st = G.ln(); if (!st || !st.owed || !st.owed.length) return; const r = st.owed[0]; if (!G.addItem(G.copyItem(r.item), r.n || 1)) return toast('Bags are full.'); st.owed.shift(); loot(`Received ${B.link(D.ITEMS[r.item].name, 1)} x${r.n || 1}.`); emit('change'); G.save(); };
  G.lnKill = function (mobLvl, elite) { if (!G.lnOn() || G.S.player.level - mobLvl >= 5) return 0; return G.lnGive(elite ? LN().earn.elite : LN().earn.kill, 'a kill', true); };
  // a festival town: one with the Hearthwarden and a great hearth (every city and hub with a profession trainer)
  G.lnTown = (place) => { const Pl = D.PLACES[place || G.S.player.place]; return !!Pl && Pl.safe && (Pl.npcs || []).includes(LN().keeper); };
  // people in this town for the festival's chat (anyone online of your faction when the town is quiet)
  // skip: ids already served (fed), left out before falling back to the realm, so a town of only them still finds someone
  const lnNear = (skip) => { const S = G.S, P = S.player, d = new Date(now()), ok = (x) => B.factionOf(x) === B.factionOf(P) && !(skip || []).includes(x.id); const here = (B.onlineIn(S, P.place, d) || []).filter(ok); return here.length ? here : S.bots.filter((b) => ok(b) && B.isOnline(b, d)); };
  // a place out in the world for the dailies (homes, firewood): not a town, no run or battleground
  const lnWild = (place) => { const Pl = D.PLACES[place]; return !!Pl && !Pl.safe && !G.S.run && !G.S.bg; };

  // ---- A Knock at the Door: at a place out in the world, frost hounds and a frostling come to a home. Win without
  // letting the frostling's Hearthchill land (interrupt it) and the home stays warm. Three different places a day
  G.lnCanKnock = function (place) {
    const st = G.ln(); place = place || G.S.player.place;
    if (!st || G.lnToday() !== 'knock' || st.done || !lnWild(place)) return null;
    return st.prog.homes.includes(place) ? 'kept' : 'ready';
  };
  G.lnKnock = function () {
    const S = G.S, P = S.player;
    if (G.lnCanKnock(P.place) !== 'ready') return toast(G.lnCanKnock(P.place) === 'kept' ? 'This home is already warm. Try another place.' : 'No home to keep warm here.');
    if (G.fight || P.travel || P.ghostUntil) return toast('Not now.');
    stopActions();
    const L = P.level, pu = E.charUnit(P, 'ally', 'player', now());
    const foes = [E.mobUnit('ln_frost_hound', L), E.mobUnit('ln_frost_hound', L), E.mobUnit('ln_frostling', L)];
    G.pUnit = pu;
    const pet = G.petUnitFor(pu);
    G.fight = E.fight(pet ? [pu, pet] : [pu], foes, { soloUid: pu.uid });
    G.fight.kind = 'knock'; G.fight.knockAt = P.place;
    G.fight.opts.killOrder = 'spread';
    sys('Frost hounds at the door!');
    emit('fightStart', { fight: G.fight });
  };
  function endKnock(C) {
    const S = G.S, P = S.player, st = G.ln();
    E.writeBack(C, G.pUnit, now());
    if (P.hp != null && P.hp <= 0) P.hp = 1;
    G.fight = null; G.pUnit = null;
    if (C.over === 'win' && st && !C.chilled) {
      if (!st.prog.homes.includes(C.knockAt)) st.prog.homes.push(C.knockAt);
      sys(`Home kept warm: ${D.PLACES[C.knockAt].name} (${st.prog.homes.length}/${LN().knock}).`);
      G.lnGive(LN().earn.elite, 'a home kept warm');
      if (st.prog.homes.length >= LN().knock) lnDailyDone();
    } else if (C.over === 'win') sys('Home lost: Hearthchill landed.');
    else sys('Home lost: the hounds drove you off.');
    emit('fightEnd', { result: C.over }); emit('change'); G.save();
  }

  // ---- Longnight Stew: firewood from 5 different places out in the world, cook at a great hearth, then hand a bowl to
  // 3 people in town who ask for one in chat (real requests, with a Give button)
  G.lnCanGather = function (place) {
    const st = G.ln(); place = place || G.S.player.place;
    if (!st || G.lnToday() !== 'stew' || st.done || !lnWild(place)) return null;
    if (st.prog.wood.length >= LN().stew.wood) return 'done';
    return st.prog.wood.includes(place) ? 'taken' : 'ready';
  };
  G.lnGather = function () {
    const P = G.S.player, st = G.ln(), can = G.lnCanGather(P.place);
    if (can !== 'ready') return toast(can === 'taken' ? 'You took the firewood here today.' : can === 'done' ? 'You have all the firewood. Cook it at a great hearth.' : 'No firewood here.');
    if (G.fight) return toast('You are in combat.');
    st.prog.wood.push(P.place);
    sys(`Firewood gathered: ${D.PLACES[P.place].name} (${st.prog.wood.length}/${LN().stew.wood}).`);
    if (st.prog.wood.length >= LN().stew.wood) sys('Firewood done. Cook it at a great hearth.');
    emit('change'); G.save();
  };
  G.lnCook = function () {
    const st = G.ln(); if (!st) return;
    if (!G.lnTown()) return toast('Only at a great hearth (the Hearthwarden).');
    if (st.prog.wood.length < LN().stew.wood) return toast(`Bring ${LN().stew.wood} firewood first (${st.prog.wood.length}/${LN().stew.wood}).`);
    if (st.prog.cooked) return toast('The stew is cooked.');
    if (!G.addItem(G.copyItem('ln_stew'), LN().stew.bowls)) return toast('Bags are full.');
    st.prog.cooked = true; G.S.flags.lnAsk = 0;
    loot(`You cook ${B.link('Longnight Stew', 1)} x${LN().stew.bowls}.`);
    emit('change'); G.save();
  };
  // a bowl asked for in chat: posted near you in a festival town while you hold stew; G.lnGiveStew answers it
  const STEW_ASK = [() => `anyone have a bowl of Longnight stew? freezing out here`, () => `so cold today. would love some stew if anyone cooked`, () => `is anyone handing out Longnight stew? i'd take a bowl`, () => `brrr. stew, anyone? happy Longnight`];
  function lnStewTick() {
    const S = G.S, P = S.player, st = G.ln();
    if (!st || !st.prog.cooked || st.done || !G.lnTown() || G.fight || S.run) return;
    if (!(P.bags || []).some((b) => b.item.id === 'ln_stew')) return;
    if (S.chat.some((m) => m.act && m.act.kind === 'ln_stew' && m.act.state === 'open')) return;
    if (now() < (S.flags.lnAsk || 0)) return;
    const near = lnNear(st.prog.fed);
    if (!near.length) return;
    const b = cpick(near), m = B.post(S, 'say', b, cpick(STEW_ASK)());
    S.flags.lnAsk = now() + rnd(20, 45) * 1000;
    if (m) { m.act = { kind: 'ln_stew', bot: b.id, state: 'open', until: now() + 5 * 60000 }; emit('change'); }
  }
  G.lnStewTick = lnStewTick;
  G.lnGiveStew = function (m) {
    const S = G.S, P = S.player, st = G.ln(), a = m && m.act;
    if (!a || a.kind !== 'ln_stew' || a.state !== 'open') return;
    if (!st) return 'Longnight is over.';
    if (!(P.bags || []).some((x) => x.item.id === 'ln_stew')) return 'You have no stew left.';
    G.removeItem('ln_stew', 1);
    a.state = 'done'; st.prog.bowls++; st.prog.fed = (st.prog.fed || []).concat([a.bot]);
    const b = S.bots.find((x) => x.id === a.bot);
    sys(`You hand ${b ? b.name : 'them'} a bowl of Longnight Stew (${st.prog.bowls}/${LN().stew.bowls}).`);
    if (b) S.pending.push({ at: now() + 1200 + crand() * 1400, bot: b.id, ch: 'say', text: cpick([`oh thank you ${P.name}! so warm`, `ty!! happy Longnight ${P.name}`, `you're the best, thank you`, `mmm, perfect. ty ${P.name}`]), fromName: b.name });
    if (st.prog.bowls >= LN().stew.bowls) lnDailyDone();
    emit('change'); G.save();
  };

  // ---- Snowball Brawl: rounds against people in your town, the same kit for everyone. Throw (1 snow), Pack Snow
  // (+1 snow, 1 sec), Duck (dodge for 0.9 sec), Snowboulder (3 snow, a red bar, 3 hits). First to 0 loses the round
  G.SNOW = { hp: 6, maxSnow: 5, startSnow: 1, pack: 1, fly: 0.6, duck: 0.9, duckCd: 2.4, boulder: 3, wind: 2, boulderHit: 3, throwCd: 0.5 };
  const snowSide = () => ({ hp: G.SNOW.hp, snow: G.SNOW.startSnow, packUntil: 0, duckUntil: -1, duckCd: 0, throwCd: 0, wind: null });
  G.lnSnowWhy = function () {
    const st = G.ln(), S = G.S;
    if (!st) return 'Longnight is over.';
    if (G.lnToday() !== 'snow') return 'Snowball Brawl is not today\'s daily.';
    if (!G.lnTown()) return 'Only in a town with the Hearthwarden.';
    if (G.fight || S.run || S.bg || S.snow) return 'Not now.';
    return null;
  };
  // a round against someone online here; their skill (0 to 1) decides how well they duck and time a boulder
  G.lnSnowStart = function (rng) {
    const S = G.S, P = S.player, why = G.lnSnowWhy(); if (why) return toast(why);
    const near = lnNear();
    const foe = near.length ? pick(near) : null;
    S.snow = { t: 0, me: snowSide(), foe: snowSide(), name: foe ? foe.name : 'A local', bot: foe ? foe.id : null, skill: foe && foe.skill != null ? foe.skill : 0.35 + Math.random() * 0.45, flying: [], log: [], over: null, think: 0.8 };
    sys(`Snowball fight! ${S.snow.name} packs the first snowball.`);
    emit('snow', S.snow); emit('change');
  };
  // one side acts; returns why not, or null
  function snowAct(Z, who, act) {
    const N = G.SNOW, me = Z[who], them = Z[who === 'me' ? 'foe' : 'me'];
    if (Z.over || me.hp <= 0) return 'over';
    if (Z.t < me.packUntil || me.wind) return 'busy';
    if (act === 'throw') {
      if (me.snow < 1) return 'No snow. Pack Snow first.';
      if (Z.t < me.throwCd) return 'busy';
      me.snow--; me.throwCd = Z.t + N.throwCd; Z.flying.push({ from: who, at: Z.t + N.fly, dmg: 1 }); return null;
    }
    if (act === 'pack') { if (me.snow >= N.maxSnow) return 'Your hands are full of snow.'; me.packUntil = Z.t + N.pack; me.packing = true; return null; }
    if (act === 'duck') { if (Z.t < me.duckCd) return 'busy'; me.duckUntil = Z.t + N.duck; me.duckCd = Z.t + N.duckCd; return null; }
    if (act === 'boulder') { if (me.snow < N.boulder) return `Snowboulder needs ${N.boulder} snow.`; me.snow -= N.boulder; me.wind = { until: Z.t + N.wind }; return null; }
    void them; return 'busy';
  }
  G.snowAct = snowAct;
  // the opponent: ducks what it sees coming (each snowball decided once, by skill), throws while you are busy packing or
  // winding up, builds to a Snowboulder, packs when low
  function snowFoe(Z, dt) {
    const f = Z.foe, me = Z.me, sk = Z.skill;
    for (const x of Z.flying) if (x.from === 'me' && x.seen == null) x.seen = Math.random() < (x.boulder ? 0.35 + sk * 0.55 : 0.25 + sk * 0.6);
    const coming = Z.flying.some((x) => x.from === 'me' && x.seen && x.at - Z.t < 0.35) || (me.wind && me.wind.until - Z.t < 0.5 && Math.random() < 0.35 + sk * 0.55);
    if (coming && !snowAct(Z, 'foe', 'duck')) return;
    Z.think -= dt; if (Z.think > 0) return;
    Z.think = 0.3 + (1 - sk) * 0.45;
    const open = Z.t < me.packUntil || !!me.wind; // you are busy: a free hit
    if (f.snow >= 1 && open && !snowAct(Z, 'foe', 'throw')) return;
    if (f.snow >= G.SNOW.boulder && Math.random() < 0.45 + sk * 0.3 && !snowAct(Z, 'foe', 'boulder')) return;
    if (f.snow < G.SNOW.boulder && Math.random() < 0.55 && !snowAct(Z, 'foe', 'pack')) return;
    if (f.snow >= 1 && !snowAct(Z, 'foe', 'throw')) return;
    snowAct(Z, 'foe', 'pack');
  }
  // the round at fixed steps: snow lands, boulders fall, the opponent thinks
  G.snowStep = function (Z, dt, foeAI) {
    const N = G.SNOW; if (Z.over) return;
    Z.t += dt;
    for (const s of ['me', 'foe']) { const u = Z[s]; if (u.packing && Z.t >= u.packUntil) { u.packing = false; u.snow = Math.min(N.maxSnow, u.snow + 1); } }
    for (const s of ['me', 'foe']) { const u = Z[s]; if (u.wind && Z.t >= u.wind.until) { u.wind = null; Z.flying.push({ from: s, at: Z.t + 0.1, dmg: N.boulderHit, boulder: true }); } }
    for (const f of Z.flying.slice()) {
      if (Z.t < f.at) continue;
      Z.flying.splice(Z.flying.indexOf(f), 1);
      const tgt = Z[f.from === 'me' ? 'foe' : 'me'];
      if (Z.t <= tgt.duckUntil) { Z.log.push({ t: Z.t, who: f.from === 'me' ? 'foe' : 'me', what: 'duck', boulder: f.boulder }); continue; }
      const caught = !f.boulder && tgt.packing ? 1 : 0; // caught with your hands full of snow: one more
      tgt.hp = Math.max(0, tgt.hp - f.dmg - caught); Z.log.push({ t: Z.t, who: f.from === 'me' ? 'foe' : 'me', what: 'hit', dmg: f.dmg + caught, boulder: f.boulder, caught: !!caught });
    }
    if (foeAI !== false) snowFoe(Z, dt);
    if (Z.me.hp <= 0 || Z.foe.hp <= 0) Z.over = Z.foe.hp <= 0 && Z.me.hp > 0 ? 'win' : 'lose';
    if (Z.t > 120 && !Z.over) Z.over = Z.me.hp > Z.foe.hp ? 'win' : 'lose'; // a stalemate ends at two minutes
  };
  G.lnSnowTick = function (dt) {
    const S = G.S, Z = S.snow; if (!Z || Z.done) return;
    let a = (Z.acc || 0) + dt; while (a >= 0.1 && !Z.over) { a -= 0.1; G.snowStep(Z, 0.1); } Z.acc = a;
    if (Z.log.length) { emit('snowLog', Z.log.slice()); Z.log.length = 0; }
    emit('snow', Z);
    if (Z.over) lnSnowEnd(Z);
  };
  G.lnSnowDo = function (act) { const Z = G.S.snow; if (!Z) return; const why = snowAct(Z, 'me', act); if (why && why !== 'busy' && why !== 'over') toast(why); emit('snow', Z); return why; };
  G.lnSnowQuit = function () { const Z = G.S.snow; if (!Z) return; if (!Z.over) { Z.over = 'lose'; sys('You walk away from the snowball fight.'); } lnSnowEnd(Z); };
  function lnSnowEnd(Z) {
    const S = G.S, st = G.ln(); if (Z.done) return; Z.done = true;
    const P = S.player;
    if (Z.over === 'win' && st) {
      st.prog.wins++;
      sys(`You win the round against ${Z.name} (${Math.min(st.prog.wins, LN().snow.wins)}/${LN().snow.wins}).`);
      G.lnGive(LN().earn.elite, 'a snowball round');
      if (Z.bot) S.pending.push({ at: now() + 1000 + crand() * 1400, bot: Z.bot, ch: 'say', text: cpick([`gg ${P.name}, good arm`, `ok ok you win lol`, `rematch next Longnight!`, `gg, my hands are frozen`]), fromName: Z.name });
      if (st.prog.wins >= LN().snow.wins) lnDailyDone();
    } else if (Z.over === 'lose') {
      sys(`${Z.name} wins the round.`);
      if (Z.bot) S.pending.push({ at: now() + 1000 + crand() * 1400, bot: Z.bot, ch: 'say', text: cpick([`gotcha ${P.name}!`, `haha gg`, `snow in your boots now`, `gg! duck next time lol`]), fromName: Z.name });
    }
    S.snow = null; emit('snow', null); emit('change'); G.save();
  }

  // ---- the town: people at the great hearth say so (statements, not requests), now and then, in festival towns
  const HEARTH_SAY = [() => 'added my kindling to the hearth. happy Longnight all', () => 'the great hearth is so warm tonight', () => 'happy Longnight!', () => 'keep your doors shut tonight, the Cold Guest is out', () => 'fed the hearth, back to questing', () => 'anyone else think the hearth got bigger today?'];
  function lnTownTick() {
    const S = G.S, P = S.player;
    if (!G.lnOn() || !G.lnTown() || G.fight || S.run) return;
    if (now() < (S.flags.lnSay || 0)) return;
    S.flags.lnSay = now() + rnd(90, 200) * 1000;
    const near = lnNear();
    if (near.length) B.post(S, 'say', cpick(near), cpick(HEARTH_SAY)());
  }
  G.lnTick = function () { if (!G.lnOn() || !G.S || !G.S.player) return; try { lnStewTick(); lnTownTick(); } catch (e) { console.error(e); } };

  // ---- toys, used from your bags
  G.lnUse = function (idx) {
    const S = G.S, P = S.player, b = P.bags[idx], it = b && D.ITEMS[b.item.id]; if (!it) return;
    if (!G.lnOn()) return toast('Longnight is over. It works again next Longnight.'); // #441, kept for next year (#475)
    const town = D.PLACES[P.place] && D.PLACES[P.place].safe;
    if (it.stew) return toast('Hand it to someone in town who asks for a bowl in chat.');
    if (it.costume) { P.costume = { mob: it.costume, until: now() + 3600000 }; G.removeItem(it.id, 1); sys(`You look like a ${D.MOBS[it.costume].name} for 1 hour.`); }
    else if (it.snowball) {
      const near = lnNear();
      if (!town || !near.length) return toast('Throw snowballs in a town.');
      const bot = pick(near); G.removeItem(it.id, 1);
      sys(`You throw a snowball at ${bot.name}. Direct hit!`);
      S.pending.push({ at: now() + 1200 + crand() * 1500, bot: bot.id, ch: 'say', text: cpick([`hey!! ${P.name} lol`, `oh it's ON ${P.name}`, `snow down my collar, thanks ${P.name}`, `lol nice throw`, `${P.name}!!! happy Longnight to you too`]), fromName: bot.name });
    } else if (it.cocoa) { G.removeItem(it.id, 1); sys('You sit by the fire with a cup of Hearthside Cocoa. Warm at last.'); emit('emote', { kind: 'cocoa' }); }
    else if (it.garland) {
      if (!town) return toast('Only in a town.');
      const a = G.lnAccount(), t = lnRec(a).town, key = G.eventSeason('longnight') + ':' + P.place; G.removeItem(it.id, 1);
      t[key] = (t[key] || 0) + 1; G.saveAccount(a);
      sys(`Garland hung: ${D.PLACES[P.place].name} (${t[key]} this festival).`);
    } else if (it.fireworks) {
      if (!town) return toast('Set them off over a town.');
      G.removeItem(it.id, 1); sys('Fireworks burst over the town!'); emit('fireworks', {});
    } else return;
    emit('change'); G.save();
  };
  G.lnGarlands = (place) => (G.lnRec().town[G.eventSeason('longnight') + ':' + place] || 0);

  // ---- the Knocker's and the Cold Guest's loot: once a day each on Normal and on Hard; every daily Normal kill counts
  // toward the mount (the Frost Hound by the 10th, the Pale Stag by the 3rd: the raid is open five days)
  G.lnLoot = () => { const st = G.ln(), d = dayKey(); return { knocker: !!st && !(st.lootDay >= d), knockerHard: !!st && !(st.hardDay >= d), guest: !!st && !(st.guestDay >= d), guestHard: !!st && !(st.guestHardDay >= d) }; }; // a later day only (#402)
  G.lnHardOpen = (act) => !!(((G.S.player.codex || {})[act] || {}).clears);
  G.lnHardLeft = (sfx) => LN().set.filter((id) => !(G.account().looks || []).includes(D.ITEMS[id].look[0] + ':' + D.ITEMS[id].look[1] + sfx));
  function lnBossLoot(R) {
    const Ev = LN(), st = G.ln(), d = dayKey(); if (!st) return;
    const guest = R.act === Ev.guest, season = G.eventSeason('longnight');
    // each step reads the account fresh: a step before it may have saved it (a title, a rank)
    { const a = G.lnAccount(), r = lnRec(a); if (!r.keepsakes.includes(season) && !/^test/.test(season)) { r.keepsakes.push(season); G.saveAccount(a); loot(`Keepsake earned: Longnight ${season}.`); } }
    if (guest && !G.lnOwned('ln_door_title')) { lnOwn('ln_door_title'); loot(`New title: ${G.titleName(D.TITLES.find((t) => t.id === 'ln_door_title'), G.S.player.name)}. Wear it: Hero → Journey → Titles.`); emit('lnGuestFirst'); }
    const dayK = guest ? (R.hard ? 'guestHardDay' : 'guestDay') : (R.hard ? 'hardDay' : 'lootDay');
    if (st[dayK] === d) return sys(`${R.hard ? 'Hard loot' : 'Daily loot'} already taken today.`);
    st[dayK] = d;
    G.lnGive(guest ? Ev.earn.guest : Ev.earn.knocker, guest ? 'the Cold Guest' : 'the Knocker');
    if (R.hard) {
      const sfx = guest ? '_pale' : '_hard', left = G.lnHardLeft(sfx);
      if (left.length) { const it = D.ITEMS[pick(left)]; lnCollect([it.look[0], it.look[1] + sfx]); loot(`New look: ${B.link(it.name + (guest ? ' (Pale)' : ' (Dark)'), 4)}.`); }
      else sys(`All ${guest ? 'pale' : 'dark'} looks collected.`);
      return;
    }
    const a = G.lnAccount(), r = lnRec(a);
    const [flag, kills, at, ch, mount, name] = guest ? ['stag', 'stagKills', Ev.stagAt, Ev.stagChance, 'pale_stag', 'Pale Stag'] : ['hound', 'houndKills', Ev.houndAt, Ev.houndChance, 'frost_hound', 'Frost Hound'];
    if (r[flag]) return;
    r[kills]++;
    if (r[kills] >= at || Math.random() < ch) { r[flag] = true; G.giveTrialswornMount(mount); loot(`New mount: ${B.link(name, 4)}!`); }
    else sys(`No ${name} (${r[kills]}/${at}).`);
    G.saveAccount(a);
  }
  G.lnBossLoot = lnBossLoot;
  G.endKnock = endKnock;

  root.G = G;
})(typeof window !== 'undefined' ? window : globalThis);
