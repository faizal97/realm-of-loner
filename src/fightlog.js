// Fight log (#295, docs/plans/2026-11-01-fight-log-design.md): one text file of the last fight you lost, for a bug
// report: the group and the enemies as the fight began, what killed whom (the Deaths recap's own data), every red bar
// with who had an answer and what became of it, totals per member, and the full timeline. Only the lost fight is kept,
// in memory only, never in the save; the next lost fight replaces it. No DOM code (ui.js shares it), so tests run it.
(function (root) {
  const FLOG = root.FLOG = {};
  const CAP = 20000; // timeline lines kept a fight: a long fight never eats memory
  let cur = null, lost = null;
  const n0 = (n) => Math.round(n || 0).toLocaleString('en-US');
  const clock = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;
  const pad = (s, w) => String(s).padEnd(w);
  const D_ = () => root.D, E_ = () => root.E, G_ = () => root.G;
  const isMember = (u) => u && u.side === 'ally' && (u.kind === 'player' || u.kind === 'bot');
  const r2 = (x) => Math.round(x * 100) / 100;
  const nameOf = (C, uid) => { const u = C.units[uid]; return u ? u.name : `#${uid}`; };
  const skillOf = (u) => (u.bot && u.bot.skill != null ? u.bot.skill : u.char && u.char.bot && u.char.bot.skill != null ? u.char.bot.skill : null);
  const roleOf = (u) => u.role || (u.kind === 'player' && G_().role ? G_().role() : null) || (D_().CLASSES[u.cls] || {}).role || '';

  function member(u) {
    const D = D_(), C = D.CLASSES[u.cls] || {}, st = u.st || {}, items = Object.values((u.char && u.char.equip) || {}).filter(Boolean);
    const q = {}; for (const it of items) { const k = (D.QUALITY[it.q || 0] || {}).name || '?'; q[k] = (q[k] || 0) + 1; }
    const avg = items.length ? Math.round(items.reduce((a, it) => a + (it.lvl || 0), 0) / items.length) : 0, s = skillOf(u);
    return { uid: u.uid, who: u.kind === 'player' || u.isPlayer ? 'you' : 'bot', name: u.name, cls: C.name || u.cls, role: roleOf(u), level: u.level, hp: u.hp, maxHp: u.maxHp, res: u.res, maxRes: u.maxRes, resType: u.resType,
      gear: `${items.length} items, avg item level ${avg}${items.length ? ' (' + Object.entries(q).map(([k, v]) => `${v} ${k.toLowerCase()}`).join(', ') + ')' : ''}`,
      stats: `armour ${n0(st.armor)}, attack power ${n0(st.apTotal)}, spell power ${n0(st.sp)}, crit ${(st.crit || 0).toFixed(1)}%`, skill: s };
  }
  function enemy(u) { return { uid: u.uid, name: u.name, level: u.level, boss: !!u.boss, elite: !!u.elite, hp: u.maxHp, dmg: u.dmg ? `${n0(u.dmg[0])}-${n0(u.dmg[1])}` : '?' }; }

  function begin(C) {
    const G = G_(), S = G && G.S, R = S && S.run;
    cur = { C, at: Date.now(), kind: C.kind || 'world', run: R ? { name: R.name, pull: R.idx + 1, pulls: R.pulls.length, label: R.pulls[R.idx] && R.pulls[R.idx].label, wipes: R.wipes || 0, hard: !!R.hard, mult: R.mult, bossMult: R.bossMult } : null,
      place: S && S.player && D_().PLACES[S.player.place] ? D_().PLACES[S.player.place].name : null,
      members: C.allies.filter(isMember).map(member), enemies: C.enemies.map(enemy), lines: [], cut: 0, bars: [], open: {}, tot: {} };
  }
  const tot = (uid) => (cur.tot[uid] = cur.tot[uid] || { done: 0, taken: 0, healed: 0, kicks: 0, kickTries: 0, missed: 0 });
  const line = (t, s) => { if (cur.lines.length < CAP) cur.lines.push(`${clock(t)} ${s}`); else cur.cut++; };

  // who should answer a red bar, and with what: the tank braces a slam on itself, a healer mends it, the others kick;
  // a cast is everyone's to cut; a hit on everyone is everyone's to step back from
  function askedOf(C, bar, u) {
    const E = E_();
    if (bar.who === 'target') return u.uid === bar.victim ? 'guard' : roleOf(u) === 'healer' && E.answersOf(u, 'mend').length ? 'mend' : 'cut';
    return bar.who === 'cast' ? 'cut' : bar.who === 'all' ? 'step' : u.uid === bar.victim ? E.teleAnswer({ who: bar.who }) : null;
  }
  // what became of each member's answer when the bar landed: used, or why not (facts, read from the unit as it landed)
  function fateOf(C, bar, u, ans) {
    const E = E_(), D = D_(), ids = E.answersOf(u, ans === 'step' ? 'step' : ans);
    if (bar.used[u.uid]) return { ok: true, text: bar.used[u.uid] };
    if (!ids.length) return null; // nothing to answer with: not theirs to answer
    const names = ids.map((id) => (D.ABILITIES[id] || {}).name || id).join('/');
    if (u.dead) return { text: `${names}: dead` };
    if (ans === 'cut' && bar.who === 'target' && bar.kicks >= bar.kickCap) return { text: `${names}: kicks already full` };
    if (ans === 'mend' && bar.mended) return { text: `${names}: already mended by another` };
    const ready = ids.filter((id) => !((u.cds[id] || 0) > C.t)); // cooldowns are fight-clock times (engine E.use)
    if (!ready.length) return { text: `${names}: on cooldown (${Math.min(...ids.map((id) => u.cds[id] - C.t)).toFixed(0)} s left)`, miss: true };
    const busy = u.cast ? `casting ${(D.ABILITIES[u.cast.ab] || {}).name || u.cast.ab || 'a spell'}` : (u.stunUntil || 0) > C.t ? 'stunned' : null;
    const d = u.teleMind, s = skillOf(u);
    if (u.kind === 'bot' && d && d.id === bar.id) {
      if (!d.go) return { text: `${names}: ready, bot chose not to (skill ${s != null ? s.toFixed(2) : '?'})`, miss: true };
      if (d.at >= bar.until) return { text: `${names}: ready, bot reacted too late (would answer at ${(d.at - bar.start).toFixed(1)} s of ${(bar.until - bar.start).toFixed(1)} s)`, miss: true };
      const low = u.resType === 'mana' && u.maxRes > 0 && u.res / u.maxRes < 0.1 ? `out of mana (${Math.round((u.res / u.maxRes) * 100)}%)` : null;
      return { text: `${names}: ready, bot tried but ${busy ? 'was ' + busy : low || 'could not use it (out of range or other)'}`, miss: true };
    }
    return { text: `${names}: ready, not used${busy ? ' (' + busy + ')' : ''}${u.kind === 'bot' ? ` (bot skill ${s != null ? s.toFixed(2) : '?'})` : ''}`, miss: true };
  }
  function closeBar(C, bar) {
    for (const u of C.allies.filter(isMember)) {
      const ans = askedOf(C, bar, u); if (!ans) continue;
      const f = fateOf(C, bar, u, ans); if (!f) continue;
      bar.fates.push(`${u.name}: ${f.text}`); if (f.miss) tot(u.uid).missed++;
    }
    bar.answered = bar.cut || bar.braced || bar.mended || bar.kicks > 0 || Object.keys(bar.dodged).length > 0;
  }

  FLOG.feed = function (C, evs) {
    if (!cur || cur.C !== C) begin(C);
    const E = E_(), D = D_();
    const landed = [];
    if (C.enemies.length > cur.enemies.length) for (const u of C.enemies) if (!cur.enemies.some((x) => x.uid === u.uid)) { cur.enemies.push(Object.assign(enemy(u), { joined: C.t })); line(C.t, `${u.name} joins the fight`); } // adds a boss calls, a pack that joins
    for (const e of evs) {
      const t = e.t != null ? e.t : C.t;
      switch (e.type) {
        case 'dmg': {
          const s = C.units[e.src], g = C.units[e.tgt];
          if (isMember(s)) tot(e.src).done += e.amount || 0; if (isMember(g)) tot(e.tgt).taken += e.amount || 0;
          const what = e.tele ? e.tele : e.ab ? ((D.ABILITIES[e.ab] || {}).name || e.ab.replace(/_/g, ' ')) : 'melee';
          line(t, `${nameOf(C, e.src)} ${what} -> ${nameOf(C, e.tgt)} ${n0(e.amount)}${e.crit ? ' crit' : ''}${e.absorbed ? ` (${n0(e.absorbed)} absorbed)` : ''}${e.teleMiss ? ' (red bar missed)' : ''}${g && g.maxHp ? ` [${n0(Math.max(0, g.hp))}/${n0(g.maxHp)} after this tick]` : ''}`);
          break;
        }
        case 'heal': if (isMember(C.units[e.src])) tot(e.src).healed += e.amount || 0;
          line(t, `${nameOf(C, e.src)} heals ${nameOf(C, e.tgt)} ${n0(e.amount)}${e.ab && D.ABILITIES[e.ab] ? ' (' + D.ABILITIES[e.ab].name + ')' : ''}`); break;
        case 'die': line(t, `${nameOf(C, e.uid)} dies`); break;
        case 'castStart': line(t, `${nameOf(C, e.src)} begins casting ${(D.ABILITIES[e.ab] || {}).name || e.ab || ''}${e.tgt != null ? ' on ' + nameOf(C, e.tgt) : ''} (${(e.dur || 0).toFixed(1)} s)`); break;
        case 'castStop': if (!e.done) line(t, `${nameOf(C, e.src)}'s cast stopped${e.range ? ' (out of range)' : ''}`); break;
        case 'ability': if (e.ab && D.ABILITIES[e.ab]) line(t, `${nameOf(C, e.src != null ? e.src : e.uid)} uses ${D.ABILITIES[e.ab].name}${e.tgt != null && C.units[e.tgt] ? ' on ' + nameOf(C, e.tgt) : ''}`); break;
        case 'avoid': line(t, `${nameOf(C, e.src)} ${e.ab ? (D.ABILITIES[e.ab] || {}).name || e.ab.replace(/_/g, ' ') : 'melee'} -> ${nameOf(C, e.tgt)} ${e.what}`); break;
        case 'stun': line(t, `${nameOf(C, e.tgt != null ? e.tgt : e.uid)} stunned`); break;
        case 'taunt': line(t, `${nameOf(C, e.src)} taunts ${nameOf(C, e.tgt)}`); break;
        case 'aggro': if (e.uid != null && e.tgt != null) line(t, `${nameOf(C, e.uid)} turns to ${nameOf(C, e.tgt)}`); break;
        case 'tele': {
          if (e.what === 'start') {
            const v = e.victim != null ? e.victim : (C.units[e.src] || {}).target;
            const bar = cur.open[e.src] = { id: e.id, src: e.src, name: e.name, who: e.who, victim: v, start: t, until: e.until, used: {}, dodged: {}, kicks: 0, kickCap: E.teleNum(C.units[e.src] && C.units[e.src].tele, 'kickCap'), mended: false, braced: false, cut: false, fates: [] };
            cur.bars.push(bar); line(t, `RED BAR ${nameOf(C, e.src)} begins ${e.name}${v != null && e.who === 'target' ? ' on ' + nameOf(C, v) : ''} (${(e.until - t).toFixed(1)} s)`); break;
          }
          const bar = cur.open[e.src]; if (!bar) break;
          if (e.what === 'kick') { bar.kicks++; bar.used[e.by] = 'kicked'; tot(e.by).kicks++; line(t, `RED BAR ${nameOf(C, e.by)} kicks ${e.name} (now x${(e.size || 0).toFixed(2)})`); }
          else if (e.what === 'kickfull') line(t, `RED BAR ${nameOf(C, e.by)} kicks ${e.name}, kicks already full`);
          else if (e.what === 'cut') { bar.cut = true; bar.used[e.by] = 'cut it'; tot(e.by).kicks++; line(t, `RED BAR ${nameOf(C, e.by)} cuts ${e.name}`); closeBar(C, bar); delete cur.open[e.src]; }
          else if (e.what === 'mend') { bar.mended = true; if (e.by != null) bar.used[e.by] = 'mended'; line(t, `RED BAR ${e.by != null ? nameOf(C, e.by) : 'a healer'} mends ${nameOf(C, e.tgt)} (now x${(e.size || 0).toFixed(2)})`); }
          else if (e.what === 'brace') { bar.braced = true; bar.used[e.tgt] = 'braced'; line(t, `RED BAR ${nameOf(C, e.tgt)} braces (now x${(e.size || 0).toFixed(2)})`); }
          else if (e.what === 'dodge' || e.what === 'block') { bar.dodged[e.tgt] = 1; bar.used[e.tgt] = e.what === 'dodge' ? 'avoided it' : 'blocked'; line(t, `RED BAR ${nameOf(C, e.tgt)} ${e.what === 'dodge' ? 'avoids' : 'blocks'} ${e.name}`); }
          else if (e.what === 'land') { line(t, `RED BAR ${e.name} lands`); landed.push(bar); delete cur.open[e.src]; }
          break;
        }
        default: break;
      }
    }
    for (const bar of landed) closeBar(C, bar); // after the batch: dodges and braces as a bar lands come after its 'land'
  };

  // the fight ended: a loss is kept (with the recap's deaths), anything else forgets it
  FLOG.end = function (C) {
    if (!cur || cur.C !== C) return;
    if (C.over === 'lose') { for (const k of Object.keys(cur.open)) closeBar(C, cur.open[k]); cur.open = {}; cur.t = C.t; cur.deaths = ((C.recap && C.recap.deaths) || []).slice(); cur.C = null; lost = cur; }
    cur = null;
  };
  FLOG.lost = () => lost;
  FLOG.clear = () => { lost = null; cur = null; };

  FLOG.fileName = function (L) {
    L = L || lost; if (!L) return null;
    const what = (L.run ? L.run.name : L.place || L.kind || 'fight').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `fightlog-${what}${L.run ? '-pull' + L.run.pull : ''}.txt`;
  };
  FLOG.text = function (L) {
    L = L || lost; if (!L) return null;
    const G = G_(), out = [], d = new Date(L.at);
    out.push('Realm of Loner fight log', `${String(root.AZ_VERSION || '?')} (${root.AzUpd ? 'Android app' : 'browser'}) · ${d.toISOString().replace('T', ' ').slice(0, 16)} UTC`);
    if (L.run) {
      const R = L.run, m = (x) => (x ? `hp x${r2(x.hp)}, dmg x${r2(x.dmg)}` : 'x1');
      out.push(`${R.name}${R.hard && !/Hard/.test(R.name) ? ', Hard' : ''} · pull ${R.pull}/${R.pulls}${R.label ? ' (' + R.label + ')' : ''} · wipes before this one: ${R.wipes}`, `Multipliers: enemies ${m(R.mult)}; bosses ${m(R.bossMult)}`);
    } else out.push(`${L.kind === 'solo' ? 'Out in the world' : L.kind}${L.place ? ' · ' + L.place : ''}`);
    out.push(`Lost after ${clock(L.t || 0)} · ${L.deaths.length} of ${L.members.length} died`);
    const W = Math.max(8, ...L.members.map((m) => m.name.length)) + 2;
    out.push('', 'GROUP (as the fight began)');
    for (const m of L.members) {
      out.push(`${pad(m.who, 4)}${pad(m.name, W)}${pad(m.cls, 9)}${pad(m.role, 7)}L${m.level}${m.skill != null ? '  skill ' + m.skill.toFixed(2) : ''}`);
      out.push(`    hp ${n0(m.hp)}/${n0(m.maxHp)}, ${m.resType || 'resource'} ${n0(m.res)}/${n0(m.maxRes)}; ${m.gear}`, `    ${m.stats}`);
    }
    out.push('', 'ENEMIES');
    for (const e of L.enemies) out.push(`${pad(e.name, 22)}L${e.level}${e.boss ? ' boss' : e.elite ? ' elite' : ''}  hp ${n0(e.hp)}  hits ${e.dmg}${e.joined != null ? '  joined at ' + clock(e.joined) : ''}`);
    out.push('', 'WHAT KILLED US');
    if (!L.deaths.length) out.push('(no deaths recorded)');
    for (const x of L.deaths) { const r = G.recapText(x); out.push(`${clock(x.t)} ${x.name} ${r.head}`, `     ${r.facts}`); }
    out.push('', 'RED BARS');
    const byName = {};
    for (const b of L.bars) { const k = b.name, r = byName[k] = byName[k] || { n: 0, cut: 0, braced: 0, mended: 0, kicked: 0, none: 0 }; r.n++; if (b.cut) r.cut++; if (b.braced || Object.keys(b.dodged).length) r.braced++; if (b.mended) r.mended++; if (b.kicks) r.kicked++; if (!b.answered) r.none++; }
    if (!L.bars.length) out.push('(none)');
    for (const [k, r] of Object.entries(byName)) out.push(`${k} x${r.n}: cut ${r.cut}, braced or avoided ${r.braced}, mended ${r.mended}, kicked ${r.kicked}, no answer ${r.none}`);
    for (const b of L.bars) if (!b.cut) {
      const got = [b.braced ? 'braced' : null, Object.keys(b.dodged).length ? 'avoided' : null, b.mended ? 'mended' : null, b.kicks ? `kicked x${b.kicks}` : null].filter(Boolean);
      out.push(`  ${clock(b.start)} ${b.name}${b.who === 'target' && b.victim != null ? ' on ' + (L.members.find((m) => m.uid === b.victim) || { name: '?' }).name : ''}: ${got.length ? got.join(', ') : 'NO ANSWER'}`);
      for (const f of b.fates) out.push(`      ${f}`);
    }
    out.push('', 'TOTALS', `${pad('', W)}${pad('done', 10)}${pad('taken', 10)}${pad('healed', 10)}${pad('kicks', 7)}red bars missed`);
    for (const m of L.members) { const x = L.tot[m.uid] || {}; out.push(`${pad(m.name, W)}${pad(n0(x.done), 10)}${pad(n0(x.taken), 10)}${pad(n0(x.healed), 10)}${pad(x.kicks || 0, 7)}${x.missed || 0}`); }
    out.push('', 'TIMELINE (every event)', ...L.lines);
    if (L.cut) out.push(`(${n0(L.cut)} more lines cut)`);
    return out.join('\n') + '\n';
  };
})(typeof window !== 'undefined' ? window : globalThis);
