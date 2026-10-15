"""Realm of Loner: interface, boss and result sounds (v10.8), with the same synth voices as compose_game.py.
Written to out/sfx_<name>.m4a like the first effects; a listening reel of these goes to preview/.

Interface: tap (any button), open / close (a screen), equip, chime (a whisper or an invite), arrive (end of a
journey), roll (loot dice), begin (start gathering or crafting), collect (a new look in the collection),
reaction (a reaction lights an ability). Bosses: warn (a boss uses a special or calls help), enrage (a frenzy).
Results: victory (a run cleared, a battleground won), defeat (a battleground lost), capture (a banner taken).

Usage: ~/.venvs/audio/bin/python compose_sfx.py
"""
import os
import numpy as np
import compose_game as cg
from compose_game import SR, t_, midi, env, lp, saw, pluck, harp, bassnote, flute, noise, clank, write_wav, enc
from compose_themes import horn, bell

rng = np.random.default_rng(31)


def mix(parts, dur):
    x = np.zeros(int(dur * SR))
    for sig, at in parts:
        i = int(at * SR); j = min(len(x), i + len(sig)); x[i:j] += sig[: j - i]
    return x


def sweep(f0, f1, dur, gain=0.5):
    """filtered noise whose band slides from f0 to f1 (a swish)"""
    t = t_(dur); n = noise(dur); c = f0 + (f1 - f0) * (t / dur)
    x = lp(n, c) - lp(n, c * 0.35)
    return x * np.sin(np.pi * t / dur) ** 1.5 * gain


def sfx_tap():
    t = t_(0.05)
    return np.sin(2 * np.pi * 1650 * t) * np.exp(-t * 90) * 0.6 + lp(noise(0.05), 5000) * np.exp(-t * 160) * 0.25


def sfx_open():
    return mix([(sweep(500, 2600, 0.16, 0.6), 0), (harp(79, 0.35, gain=0.35), 0.06)], 0.45)


def sfx_close():
    return mix([(sweep(2400, 500, 0.15, 0.55), 0), (harp(72, 0.3, gain=0.3), 0.05)], 0.4)


def sfx_equip():
    t = t_(0.12); thump = np.sin(2 * np.pi * (90 + 60 * np.exp(-t * 40)) * t) * np.exp(-t * 30)
    c = clank(0.5)[: int(0.35 * SR)]; c *= np.exp(-t_(0.35) * 6)
    return mix([(thump, 0), (lp(noise(0.08), 2000) * np.exp(-t_(0.08) * 50) * 0.6, 0), (c * 0.7, 0.03)], 0.45)


def sfx_chime():
    return mix([(bell(88, 0.9, 0.5), 0), (bell(95, 1.0, 0.45), 0.13)], 1.15)


def sfx_arrive():
    return mix([(harp(72, 0.6, 0.5), 0), (harp(76, 0.6, 0.5), 0.1), (harp(79, 0.9, 0.55), 0.2), (bell(91, 0.9, 0.12), 0.2)], 1.15)


def sfx_roll():
    parts = []
    for k, at in enumerate((0, 0.05, 0.11, 0.16, 0.24, 0.31, 0.4)):
        t = t_(0.03); f = rng.uniform(2200, 3600)
        parts.append((np.sin(2 * np.pi * f * t) * np.exp(-t * 150) * (1 - k * 0.09) + (noise(0.03) - lp(noise(0.03), 3000)) * np.exp(-t * 120) * 0.4, at))
    return mix(parts, 0.5)


def sfx_begin():
    return sweep(900, 1600, 0.3, 0.45) + mix([(pluck(64, 0.2, bright=1500, gain=0.25), 0.02)], 0.3)


def sfx_collect():
    return mix([(bell(n, 0.8, 0.35), i * 0.07) for i, n in enumerate((84, 88, 91, 96))] + [(sweep(1500, 5000, 0.35, 0.15), 0)], 1.1)


def sfx_reaction():
    t = t_(0.35); f = 900 + 1500 * (t / 0.35)
    up = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6) * 0.25
    return mix([(up, 0), (bell(93, 0.6, 0.45), 0.04), (bell(100, 0.5, 0.2), 0.1)], 0.7)


def sfx_warn():
    """a low gong under a short horn call: the boss is about to do something"""
    t = t_(1.5); f = midi(38)
    gong = sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t * d) for m, a, d in ((1, 1, 1.6), (2.4, 0.5, 2.6), (3.9, 0.3, 3.5), (5.6, 0.18, 5)))
    hit = lp(noise(0.06), 900) * np.exp(-t_(0.06) * 40)
    return mix([(gong * 0.7, 0), (hit, 0), (horn(50, 0.55, 0.5), 0.05), (horn(57, 0.55, 0.4), 0.05)], 1.5)


def sfx_enrage():
    t = t_(0.8); f = 62 + 40 * (t / 0.8)
    trem = 0.6 + 0.4 * np.sin(2 * np.pi * 23 * t)
    x = (0.6 * (2 * ((np.cumsum(f) / SR) % 1) - 1) + 0.4 * np.sign(np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR))) * trem
    x = lp(x, 900) + lp(noise(0.8), 700) * 0.35
    return x * env(len(t), 0.06, 0.2, 0.8, 0.25)


def sfx_victory():
    notes = [(67, 0, 0.18), (72, 0.18, 0.18), (76, 0.36, 0.18), (79, 0.54, 0.9)]
    parts = [(horn(n, d, 0.55), at) for n, at, d in notes] + [(horn(n - 12, d, 0.3), at) for n, at, d in notes[-1:]]
    parts += [(cg.pad([60, 64, 67, 72], 1.3, cut=1600, gain=0.5, a=0.1, r=0.6), 0.5), (bell(91, 1.2, 0.15), 0.54)]
    return mix(parts, 1.9)


def sfx_defeat():
    notes = [(64, 0, 0.3), (62, 0.3, 0.3), (60, 0.6, 0.3), (57, 0.9, 0.9)]
    parts = [(horn(n, d, 0.5), at) for n, at, d in notes] + [(cg.pad([45, 52, 57], 1.4, cut=700, gain=0.5, a=0.2, r=0.7), 0.85)]
    return mix(parts, 2.0)


def sfx_capture():
    return mix([(horn(72, 0.16, 0.5), 0), (horn(79, 0.5, 0.55), 0.16), (bell(91, 0.9, 0.25), 0.16), (cg.kick(0.6), 0)], 0.95)


# Fishing and Cooking (v10.9): splash (cast), bite (the bobber dips), reel (the fight starts), catch (a fish landed),
# sizzle (into the pan), burnt (a fizzle)
def sfx_splash():
    t = t_(0.5); n = noise(0.5)
    body = (lp(n, 1800) - lp(n, 300)) * np.exp(-t * 9) * 1.1
    drops = sum(np.sin(2 * np.pi * f * t_(0.5)) * np.exp(-np.maximum(0, t - at) * 40) * (t >= at) * 0.12 for f, at in ((1400, 0.12), (1750, 0.2), (1250, 0.27)))
    return body + drops


def sfx_bite():
    t = t_(0.22)
    plop = np.sin(2 * np.pi * (520 * np.exp(-t * 14) + 180) * t) * np.exp(-t * 22) * 0.8
    return plop + lp(noise(0.22), 2400) * np.exp(-t * 30) * 0.2


def sfx_reel():
    x = np.zeros(int(0.42 * SR))
    for i in range(9):
        tt = t_(0.035); c = np.sin(2 * np.pi * (2600 + 140 * (i % 3)) * tt) * np.exp(-tt * 120) + lp(noise(0.035), 5000) * np.exp(-tt * 200) * 0.4  # one ratchet click
        a = int(i * 0.045 * SR); x[a:a + len(c)] += c[: len(x) - a] * 0.5
    return x


def sfx_catch():
    return mix([(harp(72, 0.4, gain=0.5), 0), (harp(76, 0.4, gain=0.45), 0.08), (harp(79, 0.6, gain=0.45), 0.16), (bell(91, 0.7, 0.18), 0.2)], 0.9)


def sfx_sizzle():
    t = t_(0.9); n = noise(0.9)
    hiss = (n - lp(n, 3200)) * (0.6 + 0.4 * np.sin(2 * np.pi * 7 * t)) * np.minimum(1, t * 12) * np.exp(-t * 2.2) * 0.9
    pops = sum(lp(noise(0.9), 6000) * np.exp(-np.maximum(0, t - at) * 90) * (t >= at) * 0.35 for at in (0.1, 0.23, 0.41, 0.58))
    return hiss + pops


def sfx_burnt():
    t = t_(0.7); n = noise(0.7)
    fizz = (n - lp(n, 1500)) * np.exp(-t * 4) * 0.7
    low = np.sin(2 * np.pi * (220 * np.exp(-t * 2) + 70) * t) * np.exp(-t * 5) * 0.45
    return fizz + low


# ---- the Bard's songs (#257): one note per instrument, played higher for each verse (src/ui.js sets the pitch), a
# chord of the same note for the Finale, and a muted note when a verse is lost. Same notes on every instrument, so the
# rhythm reads the same whichever is played.
def sfx_song_lute():
    return mix([(harp(69, 0.9, gain=0.5), 0), (pluck(81, 0.25, bright=3200, gain=0.12), 0)], 0.9)


def sfx_song_drum():
    t = t_(0.45); f = midi(45) * (1 + 0.35 * np.exp(-t * 40))
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
    slap = lp(noise(0.45), 2400) * np.exp(-t * 60) * 0.5
    return (body + slap) * env(len(t), 0.001, 0.0, 1.0, 0.04)


def sfx_song_horn():
    return horn(57, 0.8, gain=0.6)


def sfx_song_miss():
    t = t_(0.22)
    x = 0.6 * saw(midi(52), t) + 0.4 * saw(midi(52) * 0.97, t)
    return lp(x, 180 + 700 * np.exp(-t * 30)) * np.exp(-t * 16) + lp(noise(0.22), 900) * np.exp(-t * 50) * 0.3


SFX = {'tap': sfx_tap, 'open': sfx_open, 'close': sfx_close, 'equip': sfx_equip, 'chime': sfx_chime, 'arrive': sfx_arrive, 'roll': sfx_roll,
       'begin': sfx_begin, 'collect': sfx_collect, 'reaction': sfx_reaction, 'warn': sfx_warn, 'enrage': sfx_enrage, 'victory': sfx_victory,
       'defeat': sfx_defeat, 'capture': sfx_capture,
       'splash': sfx_splash, 'bite': sfx_bite, 'fishreel': sfx_reel, 'catch': sfx_catch, 'sizzle': sfx_sizzle, 'burnt': sfx_burnt,
       'song_lute': sfx_song_lute, 'song_drum': sfx_song_drum, 'song_horn': sfx_song_horn, 'song_miss': sfx_song_miss}

if __name__ == '__main__':
    import sys
    only = sys.argv[1:]  # name the effects to render (the rest stay exactly as approved); none = all
    reel = []
    for name, fn in SFX.items():
        if only and name not in only: continue
        x = fn(); x = x / (np.abs(x).max() + 1e-9) * 0.7
        fade = min(len(x) // 4, int(0.02 * SR)); x[-fade:] *= np.linspace(1, 0, fade)
        p = os.path.join(cg.WAV, f'sfx_{name}.wav'); write_wav(p, x); enc(p, os.path.join(cg.OUT, f'sfx_{name}.m4a'), 96)
        reel += [np.stack([x, x], 1), np.zeros((int(0.7 * SR), 2))]
        print(name, round(len(x) / SR, 2), 's')
    tag = '-'.join(only) if only else 'all'
    rp = os.path.join(cg.WAV, f'sfx_reel_{tag}.wav'); write_wav(rp, np.concatenate(reel))
    os.makedirs(os.path.join(cg.HERE, 'preview'), exist_ok=True)
    enc(rp, os.path.join(cg.HERE, 'preview', f'sound-effects-reel-{tag}.m4a'), 160)
    print('reel order:', ', '.join(only or SFX))
