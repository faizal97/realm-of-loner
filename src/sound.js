// Realm of Loner — music and sound effects (Web Audio). Sound effects and the first music are inlined by build.py as
// window.AUDIO_DATA; the other music tracks are files (window.AUDIO_FILES, v10.8), loaded when they are first played:
// fetched next to the page on the web, read from the app's assets through the AzAsset bridge in the Android app.
(function (root) {
  const SND = { ctx: null, bufs: {}, loading: {}, cur: null, curName: null, want: null, last: {} };
  const KEY = 'azsolo.sound';
  // Volume (#120): a slider per channel, 0-100 in steps of 5, plus the On/Off mute that keeps the slider's value.
  // 100% is the level the game always had (FULL), 0% is silent; in between the gain follows the square of the slider,
  // so each step sounds like an even step down (a straight line would leave most of the slider sounding nearly full).
  const FULL = { music: 0.55, sfx: 0.9 };
  const snapVol = (v) => (typeof v === 'number' && isFinite(v) ? Math.max(0, Math.min(100, Math.round(v / 5) * 5)) : 100);
  const volGain = (k, pct) => { const x = snapVol(pct) / 100; return FULL[k] * x * x; };
  // saved prefs in any format -> the current one. Before #120 only { music, sfx } (true/false) was saved: those keep their
  // on/off and load at 100%, never silent. A missing or broken value falls back to on and 100%.
  const prefsFrom = (raw) => {
    const r = raw && typeof raw === 'object' ? raw : {};
    return { music: r.music !== false, sfx: r.sfx !== false, musicVol: snapVol(r.musicVol), sfxVol: snapVol(r.sfxVol) };
  };
  // what a channel plays at now: its slider, or 0 while it is off
  const gainOf = (p, k) => (p[k] ? volGain(k, p[k + 'Vol']) : 0);
  let prefs;
  try { prefs = prefsFrom(JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { prefs = prefsFrom(null); }
  SND.prefs = prefs;
  Object.assign(SND, { FULL, snapVol, volGain, prefsFrom, gainOf });
  const savePrefs = () => { try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (e) { } };

  // Browsers only allow audio after a tap, so start on the first one.
  function init() {
    if (SND.ctx) { if (SND.ctx.state === 'suspended') SND.ctx.resume(); return; }
    const AC = root.AudioContext || root.webkitAudioContext;
    if (!AC || !root.AUDIO_DATA) return;
    const ctx = SND.ctx = new AC();
    SND.musicGain = ctx.createGain(); SND.musicGain.gain.value = gainOf(prefs, 'music'); SND.musicGain.connect(ctx.destination);
    SND.zoneGain = ctx.createGain(); SND.zoneGain.connect(SND.musicGain); // the place's music, turned down while a Bard sings (#257)
    SND.sfxGain = ctx.createGain(); SND.sfxGain.gain.value = gainOf(prefs, 'sfx'); SND.sfxGain.connect(ctx.destination);
    if (SND.want) SND.music(SND.want, true, SND.wantFallback);
  }
  if (root.addEventListener) root.addEventListener('pointerdown', init, { capture: true });
  // v10.8: start at once too. The app lets audio play without a tap, so the menu theme plays from the start; a browser
  // keeps the new context suspended until the first tap, which then resumes it (init above).
  if (root.document) { if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', init); else setTimeout(init, 0); }

  const b64bytes = (b64) => { const bin = atob(b64); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; };
  // a music file's bytes: from the app's assets (the Flutter bridge answers with base64) or fetched next to the page
  const assetWait = {}; let assetSeq = 0;
  root.AZASSET_REPLY = (payload) => { let r; try { r = JSON.parse(payload); } catch (e) { return; } const w = assetWait[r.id]; if (!w) return; delete assetWait[r.id]; if (r.ok) w.res(b64bytes(r.b64)); else w.rej(new Error(r.err || 'asset')); };
  function fileBytes(file) {
    if (root.AzAsset && root.AzAsset.postMessage) return new Promise((res, rej) => { const id = ++assetSeq; assetWait[id] = { res, rej }; root.AzAsset.postMessage(JSON.stringify({ id, path: 'music/' + file })); });
    return fetch('music/' + file + '?v=' + encodeURIComponent(root.AZ_VERSION || '')).then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); });
  }
  const fileOf = (name) => (name.startsWith('music_') && (root.AUDIO_FILES || []).includes(name.slice(6)) ? name.slice(6) + '.m4a' : null);
  // decoded music is big (about 14 MB for 40 seconds), so only the last few tracks stay decoded
  const MUSIC_KEEP = 4, musicLru = [], failed = new Set(); // failed: files that would not load (not asked for again)
  function keep(name, b) {
    SND.bufs[name] = b;
    if (!name.startsWith('music_') || name.startsWith('music_bard_')) return;
    const i = musicLru.indexOf(name); if (i >= 0) musicLru.splice(i, 1); musicLru.push(name);
    while (musicLru.length > MUSIC_KEEP) { // drop the oldest, never the one playing
      const old = musicLru.find((n) => n !== 'music_' + SND.curName && n !== name); if (!old) break;
      musicLru.splice(musicLru.indexOf(old), 1); delete SND.bufs[old];
    }
  }
  function load(name) {
    if (SND.bufs[name]) { if (name.startsWith('music_')) keep(name, SND.bufs[name]); return Promise.resolve(SND.bufs[name]); }
    if (SND.loading[name]) return SND.loading[name];
    const src = root.AUDIO_DATA && root.AUDIO_DATA[name], file = !src && fileOf(name);
    if ((!src && !file) || !SND.ctx || failed.has(name)) return Promise.resolve(null);
    const bytes = src ? Promise.resolve(b64bytes(src.slice(src.indexOf(',') + 1))) : fileBytes(file);
    SND.loading[name] = bytes.then((buf) => new Promise((res) => SND.ctx.decodeAudioData(buf, (b) => { keep(name, b); res(b); }, () => res(null))))
      .catch(() => null).then((b) => { delete SND.loading[name]; if (!b && file) failed.add(name); return b; });
    return SND.loading[name];
  }

  // One-shot effect. Throttled per name so a flurry of hits doesn't pile up.
  SND.play = function (name, o) {
    o = o || {};
    if (!gainOf(prefs, 'sfx') || !SND.ctx) return;
    const now = SND.ctx.currentTime;
    if (SND.last[name] && now - SND.last[name] < (o.gap || 0.06)) return;
    SND.last[name] = now;
    // an effect still waiting for approval (audio/pending_sfx.txt) is not in the build: play the one it replaced, or nothing
    if (!(root.AUDIO_DATA && root.AUDIO_DATA['sfx_' + name])) { name = { open: 'click', reaction: 'click' }[name]; if (!name) return; }
    load('sfx_' + name).then((b) => {
      if (!b) return;
      const s = SND.ctx.createBufferSource(); s.buffer = b;
      if (o.rate) s.playbackRate.value = o.rate;
      const g = SND.ctx.createGain(); g.gain.value = o.vol == null ? 1 : o.vol;
      s.connect(g); g.connect(SND.sfxGain); s.start();
    });
  };

  // is this track in the game? (music ships only once approved: audio/approved.txt)
  SND.has = (name) => !!((root.AUDIO_DATA && root.AUDIO_DATA['music_' + name]) || (root.AUDIO_FILES || []).includes(name));
  SND.inlined = (name) => !!(root.AUDIO_DATA && root.AUDIO_DATA['music_' + name]);
  // Background loop with a 1.5s crossfade. Loop points come from music.json so the seam is exact.
  // fallback: the track to play if this one cannot be loaded (a file that is missing or fails)
  // SND.asked is the track the game wants, SND.curName the one playing (they differ while a fallback plays)
  SND.music = function (name, force, fallback) {
    SND.want = name; SND.wantFallback = fallback;
    if (!SND.ctx || (!force && name === SND.asked)) return;
    SND.asked = name;
    play(name, fallback);
  };
  function play(name, fallback) {
    if (name === SND.curName && SND.cur) return;
    SND.curName = name;
    const old = SND.cur;
    const t = SND.ctx.currentTime;
    if (old) { old.g.gain.setTargetAtTime(0, t, 0.5); old.s.stop(t + 3); }
    SND.cur = null;
    if (!name) return;
    load('music_' + name).then((b) => {
      if (SND.curName !== name) return;
      if (!b) { if (fallback && fallback !== name) play(fallback); return; }
      const s = SND.ctx.createBufferSource(); s.buffer = b; s.loop = true;
      const meta = (root.AUDIO_META || {})[name];
      s.loopStart = 0; s.loopEnd = meta ? Math.min(meta.loop_s, b.duration) : b.duration;
      const g = SND.ctx.createGain(); g.gain.value = 0.0001;
      s.connect(g); g.connect(SND.zoneGain);
      s.start(); g.gain.setTargetAtTime(1, SND.ctx.currentTime, 0.5);
      SND.cur = { s, g };
    });
  }

  // glide a channel to its current level (setTargetAtTime, so a mute or a slider drag never clicks)
  function apply(k) {
    if (!SND.ctx) return;
    const g = k === 'music' ? SND.musicGain : SND.sfxGain;
    g.gain.setTargetAtTime(gainOf(prefs, k), SND.ctx.currentTime, k === 'music' ? 0.2 : 0.05);
  }
  // On/Off ('music' or 'sfx'); the slider value stays as it was
  SND.setPref = function (k, on) { prefs[k] = !!on; savePrefs(); apply(k); };
  // the slider ('music' or 'sfx', 0-100): applies at once, while dragging, and is saved on this device
  SND.setVol = function (k, pct) {
    const v = snapVol(+pct);
    if (prefs[k + 'Vol'] === v) return;
    prefs[k + 'Vol'] = v; savePrefs(); apply(k);
  };
  // ---------- the Bard's song music (#257): while you sing, the song is the music. One phrase per instrument, as long as a
  // song round, on the songs' shared beat (audio/compose_bard.py): layers music_bard_<instrument>_<n>, one more per verse,
  // and parts music_bard_<instrument>_<part>, one per song that is up. A beat landed schedules the next round to start on
  // the beat itself, so the run into it always finishes; a missed beat lets the last chord ring out. The game calls
  // SND.songTo with where the round is; this keeps what plays in step with it. Only one instrument's files stay decoded.
  const LAYERS = { lute: 4, drum: 4, horn: 3 }, DUCK = 0.25, SLACK = 0.3;
  SND.song = { cur: null, next: null }; // a round: { inst, rate, start (audio time of its 0), src: { name: { s, g } } }
  SND.hasSong = (inst) => !!LAYERS[inst] && (root.AUDIO_FILES || []).includes(`bard_${inst}_1`);
  const duck = (on) => { if (SND.zoneGain) SND.zoneGain.gain.setTargetAtTime(on ? DUCK : 1, SND.ctx.currentTime, on ? 0.15 : 0.8); };
  function stopRound(r, at, secs) {
    if (!r) return;
    for (const n in r.src) { const x = r.src[n]; x.g.gain.cancelScheduledValues(at); x.g.gain.setTargetAtTime(0, at, secs / 3); try { x.s.stop(at + secs + 0.1); } catch (e) { } }
  }
  // the files a round wants now: its layers and its songs' parts, each on (1) or off (0)
  const wanted = (w) => { const o = {}; for (let i = 1; i <= LAYERS[w.inst]; i++) o[`bard_${w.inst}_${i}`] = i <= w.layers ? 1 : 0; for (const p of w.parts || []) o[`bard_${w.inst}_${p}`] = 1; return o; };
  // start any wanted file the round is missing (it joins at the right place), and set every file's level
  function fill(r, w) {
    const t = SND.ctx.currentTime, want = wanted(w);
    for (const n in want) {
      const x = r.src[n];
      if (x) { if (x.on !== want[n]) { x.on = want[n]; x.g.gain.setTargetAtTime(want[n], Math.max(t, r.start), 0.06); } continue; }
      if (!want[n]) continue;
      const b = SND.bufs['music_' + n]; if (!b) { load('music_' + n); continue; } // decoded on a later call
      const when = Math.max(t, r.start), off = (when - r.start) * r.rate; if (off >= b.duration - 0.05) continue;
      const s = SND.ctx.createBufferSource(); s.buffer = b; s.playbackRate.value = r.rate;
      const g = SND.ctx.createGain(); g.gain.value = off > 0 ? 0.0001 : 1; s.connect(g); g.connect(SND.musicGain);
      s.start(when, off); if (off > 0) g.gain.setTargetAtTime(1, when, 0.05); // joining part-way: a short fade in
      r.src[n] = { s, g, on: 1 };
    }
    for (const n in r.src) if (!(n in want) && r.src[n].on) { r.src[n].on = 0; r.src[n].g.gain.setTargetAtTime(0, Math.max(t, r.start), 0.06); }
  }
  // w: { inst, layers, parts, pos, rate }. pos is how far into the round the songs are (seconds of song time); below 0,
  // the beat was landed and the next round starts in -pos seconds.
  SND.songTo = function (w) {
    if (!SND.ctx || !SND.hasSong(w.inst)) return;
    for (const n in SND.bufs) if (n.startsWith('music_bard_') && !n.startsWith(`music_bard_${w.inst}_`)) delete SND.bufs[n];
    const t = SND.ctx.currentTime, S = SND.song;
    if (!SND.bufs[`music_bard_${w.inst}_1`]) { load(`music_bard_${w.inst}_1`); return; } // the lead first, then the rest joins
    if (S.next && t >= S.next.start) { S.cur = S.next; S.next = null; }
    const same = (r, start) => r && r.inst === w.inst && r.rate === w.rate && Math.abs(r.start - start) < SLACK;
    if (w.pos >= 0) {
      const start = t - w.pos / w.rate;
      if (S.next) { stopRound(S.next, t, 0.05); S.next = null; }
      if (!same(S.cur, start)) { stopRound(S.cur, t, 0.06); S.cur = { inst: w.inst, rate: w.rate, start, src: {} }; }
      fill(S.cur, w);
    } else {
      const start = t - w.pos / w.rate;
      if (!same(S.next, start)) {
        if (S.next) stopRound(S.next, t, 0.05);
        S.next = { inst: w.inst, rate: w.rate, start, src: {} };
        if (S.cur) stopRound(S.cur, start, 0.12); // the old round's ringing tail gives way to the new one on the beat
      }
      fill(S.next, w);
    }
    duck(true);
  };
  // no song left: the round rings out on its last chord (or fades, when the fight ends), a round already lined up never starts, the place's music returns
  SND.songOut = function () {
    const S = SND.song; if (!SND.ctx || (!S.cur && !S.next)) return;
    if (S.next) stopRound(S.next, SND.ctx.currentTime, 0.05);
    stopRound(S.cur, SND.ctx.currentTime, 2.2); // after a missed beat only the tail is left; when a fight ends, a fade
    S.cur = S.next = null; setTimeout(() => { if (!SND.song.cur) duck(false); }, 1600);
  };
  SND.pause = function () { if (SND.ctx && SND.ctx.state === 'running') SND.ctx.suspend(); };
  SND.resume = function () { if (SND.ctx && SND.ctx.state === 'suspended') SND.ctx.resume(); };

  root.SND = SND;
})(typeof window !== 'undefined' ? window : globalThis);
