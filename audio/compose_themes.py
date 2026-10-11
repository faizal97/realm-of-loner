"""Realm of Loner: regional and iconic music (v10.8), composed in code with the same raw-synth voices as
compose_game.py (saw plucks, square/sine leads, sine+square bass, detuned-saw pads, noise; no samples).

Three regional moods (desert, snow, swamp) and a theme for each iconic place: the six capitals, the three raids,
world bosses, the battleground and the main menu. A zone or place names its track in the data (`music:`); the game
plays a track only once it is listed in approved.txt, and falls back to today's music until then.

Each track is written as chords (one per bar) and a melody in a small note language: "A4:1 Bb4:.5 r:2" is a note
and its length in beats, "|" ends a bar (bar lengths are checked). Drums are step strings: D low drum, T high drum,
k kick, s snare, h shaker, c anvil, . rest.

Usage: ~/.venvs/audio/bin/python compose_themes.py [name ...]  ->  wav/, out/, preview/<name>-loop-twice.m4a
"""
import sys, os, json, re
import numpy as np
from scipy.signal import lfilter
import compose_game as cg
from compose_game import SR, t_, midi, env, saw, pluck, harp, bassnote, flute, fiddle, kick, tamb, noise, drip, clank, Track

HERE = cg.HERE; WAV = cg.WAV; OUT = cg.OUT; PREVIEW = os.path.join(HERE, 'preview')
os.makedirs(PREVIEW, exist_ok=True)
rng = np.random.default_rng(23)


# the one-pole low-pass, vectorised when the cutoff is a constant (same filter as compose_game.lp, much faster)
_lp_loop = cg.lp
def lp(x, cutoff):
    if np.ndim(cutoff) == 0:
        a = 1 - np.exp(-2 * np.pi * float(cutoff) / SR)
        return lfilter([a], [1, a - 1], x)
    return _lp_loop(x, cutoff)
cg.lp = lp   # the shared voices use it too


def pad(notes, dur, cut=1300, gain=0.2, a=0.5, r=0.6):
    return cg.pad(notes, dur, cut, gain, a, r)


# ----------------------------------------------------------------- new voices (built from the same parts)
def horn(note, dur, gain=0.14):
    """brass: two detuned saws, the filter opens with the attack, a slow vibrato"""
    t = t_(dur); f = midi(note)
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5 * t) * np.clip(t / 0.4, 0, 1)
    ph = np.cumsum(f * vib) / SR
    x = 0.5 * (2 * (ph % 1) - 1) + 0.5 * (2 * ((ph * 1.003) % 1) - 1)
    x = _lp_loop(x, 300 + 1500 * (1 - np.exp(-t * 9)) * np.exp(-t * 0.6))
    return x * env(len(t), 0.06, 0.2, 0.75, 0.12) * gain


def bell(note, dur=1.6, gain=0.1):
    """a struck bell / music box: inharmonic sine partials that ring out"""
    t = t_(dur); f = midi(note)
    x = sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t * d) for m, a, d in ((1, 1, 2.2), (2.76, 0.45, 4), (5.4, 0.25, 7), (8.93, 0.12, 11)))
    return x * env(len(t), 0.002, 0.0, 1.0, 0.05) * gain


def choir(notes, dur, cut=900, gain=0.18, a=0.9, r=1.0):
    """voices: detuned saws with a slow vibrato, darker than the pad"""
    t = t_(dur); x = np.zeros(len(t))
    for n in notes:
        for det, ph in ((0.995, 0.0), (1.0, 1.3), (1.005, 2.1)):
            vib = 1 + 0.006 * np.sin(2 * np.pi * 4.6 * t + ph)
            x += 2 * ((np.cumsum(midi(n) * det * vib) / SR) % 1) - 1
    x = lp(lp(x / (3 * len(notes)), cut), cut * 1.6)
    return x * env(len(t), a, 0.1, 1.0, r) * gain


def drum(f0=95, gain=0.6, decay=11):
    """a hand or war drum: a pitch-dropping sine with a little skin noise"""
    t = t_(0.5); f = f0 * (1 + 0.9 * np.exp(-t * 35))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * decay)
    n = noise(0.03); x[: len(n)] += lp(n, 2500) * np.exp(-np.arange(len(n)) / SR * 90) * 0.4
    return x * gain


def snare(gain=0.3):
    t = t_(0.18); n = noise(0.18)
    return ((n - lp(n, 1800)) * np.exp(-t * 26) + 0.5 * np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30)) * gain


def windy(dur, period, lo=250, hi=1100, gain=0.05):
    """wind or waves: noise through a slowly moving filter, swelling every `period` seconds (a divisor of the loop)"""
    t = t_(dur); s = 0.5 - 0.5 * np.cos(2 * np.pi * t / period)
    x = _lp_loop(noise(dur), lo + (hi - lo) * s)
    return x * (0.25 + 0.75 * s) * gain


# ----------------------------------------------------------------- the note language
PC = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
def note(s):
    m = re.fullmatch(r'([A-G])([#b]?)(-?\d)', s)
    return 12 * (int(m.group(3)) + 1) + PC[m.group(1)] + (1 if m.group(2) == '#' else -1 if m.group(2) == 'b' else 0)


QUAL = {'': [0, 4, 7], 'm': [0, 3, 7], '5': [0, 7, 12], 'dim': [0, 3, 6], 'sus': [0, 5, 7], '7': [0, 4, 7, 10], 'm7': [0, 3, 7, 10]}
def chord(sym):
    """'Dm' -> [50, 53, 57]: the root between A2 and G#3, like the chords in compose_game"""
    m = re.fullmatch(r'([A-G][#b]?)(.*)', sym)
    r = note(m.group(1) + '3')
    if r > 56: r -= 12
    if r < 45: r += 12
    return [r + i for i in QUAL[m.group(2)]]


def melody(text, bar_beats, bars):
    """'A4:1 r:1 | ...' -> [(start_beat, midi, beats)]; every bar must add up to bar_beats"""
    out, t = [], 0.0
    parts = [p.strip() for p in text.split('|')]
    assert len(parts) == bars, f'{len(parts)} bars of melody for {bars} bars'
    for b, part in enumerate(parts):
        n = 0.0
        for tok in part.split():
            name, beats = tok.split(':'); beats = float(beats)
            if name != 'r': out.append((t + n, note(name), beats))
            n += beats
        assert abs(n - bar_beats) < 1e-6, f'bar {b + 1} has {n} beats: {part}'
        t += bar_beats
    return out


# ----------------------------------------------------------------- one track from a spec
def song(spec):
    BEAT = 60 / spec['bpm']; BB = spec['beats']; BAR = BB * BEAT
    prog = [chord(c) for c in spec['prog'].split()]; BARS = len(prog)
    T = Track(BARS * BAR, tail_s=spec.get('tail', 3.5))
    on = lambda L, b: L.get('from', 1) <= b + 1 <= L.get('to', BARS)
    for L in spec['layers']:
        k = L['type']
        if k == 'lead':
            voice = {'flute': flute, 'fiddle': fiddle, 'horn': horn, 'bell': lambda n, d, gain: bell(n, max(d, 1.2), gain), 'pluck': lambda n, d, gain: pluck(n, d, bright=L.get('bright', 2600), gain=gain), 'harp': lambda n, d, gain: harp(n, max(d, 0.9), gain)}[L['voice']]
            for st, n, beats in melody(L['mel'], BB, BARS):
                b = int(st // BB)
                if on(L, b): T.put(voice(n + L.get('oct', 0), beats * BEAT * 0.97, gain=L.get('gain', 0.14)), st * BEAT, pan=L.get('pan', 0.05))
            continue
        for b, ch in enumerate(prog):
            if not on(L, b): continue
            t0 = b * BAR
            if k == 'pad':
                notes = [ch[0] + L.get('oct', 12), ch[0] + L.get('oct', 12) + 7] if L.get('drone') else [n + L.get('oct', 12) for n in ch]
                T.put(pad(notes, BAR + 0.5, cut=L.get('cut', 1100), gain=L.get('gain', 0.13), a=L.get('a', 0.6), r=L.get('r', 0.8)), t0)
            elif k == 'choir':
                T.put(choir([n + L.get('oct', 12) for n in ch[:3]], BAR + 0.6, cut=L.get('cut', 900), gain=L.get('gain', 0.16)), t0)
            elif k == 'bass':
                root = ch[0] - 12 if L.get('wrap') and ch[0] > 50 else ch[0]   # wrap: keep the bass in one low octave
                for beat, iv, d in L['pat']:
                    T.put(bassnote(root + iv, d * BEAT * 0.95, gain=L.get('gain', 0.28), square=L.get('square', 0.2)), t0 + beat * BEAT)
            elif k == 'arp':
                tones = ch + [n + 12 for n in ch] + [n + 24 for n in ch]
                step = L.get('step', 0.5)
                for i, idx in enumerate(L['pat']):
                    if idx is None: continue
                    n = tones[idx] + L.get('oct', 12); st = t0 + i * step * BEAT
                    v = L.get('voice', 'harp'); g = L.get('gain', 0.14) * (1 if i % 2 == 0 else 0.8)
                    sig = harp(n, L.get('len', 1.1), gain=g) if v == 'harp' else bell(n, L.get('len', 1.6), gain=g) if v == 'bell' else pluck(n, L.get('len', 0.22), bright=L.get('bright', 2400), gain=g)
                    T.put(sig, st, pan=(L.get('spread', 0.35) * (1 if i % 2 else -1)))
            elif k == 'brass':  # the chord played by a brass section, on the given (beat, length) hits
                for beat, d in L['pat']:
                    for j, n in enumerate(ch):
                        T.put(horn(n + L.get('oct', 12), d * BEAT * 0.95, gain=L.get('gain', 0.07)), t0 + beat * BEAT, pan=(-0.35, 0.0, 0.35, 0.15)[j % 4])
            elif k == 'toll':   # a great bell on the root, on the given bars
                if b + 1 in L['bars']: T.put(bell(ch[0] + L.get('oct', -12), 5.0, gain=L.get('gain', 0.3)), t0)
            elif k == 'stab':   # the chord struck on given beats (a tavern's off-beat strum)
                for beat in L['at']:
                    for n in ch: T.put(pluck(n + L.get('oct', 12), L.get('len', 0.2), bright=L.get('bright', 2400), gain=L.get('gain', 0.1)), t0 + beat * BEAT, pan=L.get('pan', 0.25))
            elif k == 'drums':
                pats = L['pat'] if isinstance(L['pat'], list) else [L['pat']]
                pat = pats[b % len(pats)]; step = L.get('step', 0.25) * BEAT; g = L.get('gain', 1.0)
                for i, c in enumerate(pat):
                    st = t0 + i * step
                    if c == 'D': T.put(drum(L.get('low', 90), 0.55 * g), st)
                    elif c == 'T': T.put(drum(L.get('high', 190), 0.32 * g, 16), st, pan=0.2)
                    elif c == 'k': T.put(kick(0.5 * g), st)
                    elif c == 's': T.put(snare(0.22 * g), st, pan=-0.1)
                    elif c == 'h': T.put(tamb(0.12 * g), st, pan=-0.3)
                    elif c == 'c': T.put(clank(0.08 * g), st, pan=0.4)
    for fx in spec.get('fx', []):
        fx(T, BAR, BARS)
    info = {'bpm': spec['bpm'], 'bars': BARS, 'key': spec['key']}
    if BB != 4: info['meter'] = spec.get('meter', f'{BB}/4')
    return T.finish(spec.get('room', 0.32)), info


def cymbal(dur, gain):
    n = noise(dur); return (n - lp(n, 4500)) * gain


def fx_crash(bars, gain=0.06):
    def f(T, BAR, BARS):
        for b in bars:
            x = cymbal(3.0, gain) * np.exp(-t_(3.0) * 1.4); T.put(x, (b - 1) * BAR)
    return f


def fx_swell(bars, gain=0.08):
    """a cymbal rising over the bar before each given bar"""
    def f(T, BAR, BARS):
        for b in bars:
            x = cymbal(BAR, gain) * np.linspace(0, 1, int(BAR * SR)) ** 2.5; T.put(x, (b - 2) * BAR)
    return f


def fx_wind(swells=2, lo=250, hi=1100, gain=0.05):
    def f(T, BAR, BARS):
        dur = BARS * BAR; T.put(windy(dur + 3, dur / swells, lo, hi, gain), 0)
    return f


def fx_hits(maker, times, gain=1.0):
    def f(T, BAR, BARS):
        for s in times: T.put(maker() * gain, s * BARS * BAR, pan=rng.uniform(-0.6, 0.6))
    return f


# ----------------------------------------------------------------- the tracks
B8 = [(0, 0, 1.5), (1.5, 0, 0.5), (2, 0, 1), (3, 7, 1)]
TRACKS = {
    # Dunescar, the Scrublands, Sirocco, the Cinderfields: D Phrygian dominant, hand drums and an oud-like pluck
    'desert': {'bpm': 96, 'beats': 4, 'key': 'D Phrygian dominant', 'prog': 'D D Eb D D Cm Eb D Gm Gm Eb D Cm Eb D D', 'layers': [
        {'type': 'pad', 'drone': True, 'oct': 0, 'cut': 700, 'gain': 0.16},
        {'type': 'bass', 'pat': B8, 'gain': 0.26, 'square': 0.15},
        {'type': 'arp', 'voice': 'pluck', 'oct': 0, 'pat': [0, 2, 1, 2, 0, 2, 1, 2], 'gain': 0.09, 'bright': 1800, 'spread': 0.2},
        {'type': 'drums', 'pat': ['D..TD.T.D..TT.h.', 'D..TD.T.D.TTD.TT'], 'gain': 0.9, 'low': 85, 'high': 210},
        {'type': 'lead', 'voice': 'pluck', 'bright': 3400, 'gain': 0.24, 'to': 8, 'mel':
            'A4:1 Bb4:.5 A4:.5 G4:.5 F#4:.5 Eb4:.5 F#4:.5 | D4:2 r:1 A4:.5 Bb4:.5 | C5:1 Bb4:.5 C5:.5 Bb4:.5 A4:.5 G4:1 | A4:3 r:1 |'
            'D5:1 C5:.5 Bb4:.5 A4:1 Bb4:.5 C5:.5 | Eb5:1.5 D5:.5 C5:1 G4:1 | Bb4:.5 C5:.5 Bb4:.5 A4:.5 G4:1 F#4:.5 G4:.5 | A4:4 |'
            'r:4 | r:4 | r:4 | r:4 | r:4 | r:4 | r:4 | r:4'},
        {'type': 'lead', 'voice': 'fiddle', 'gain': 0.12, 'from': 9, 'mel':
            'r:4 | r:4 | r:4 | r:4 | r:4 | r:4 | r:4 | r:4 |'
            'G5:1 F#5:.5 G5:.5 A5:1 G5:1 | D5:1 Eb5:.5 D5:.5 C5:1 Bb4:1 | Bb4:1 C5:1 Eb5:1 D5:.5 C5:.5 | D5:3 r:1 |'
            'C5:1 Eb5:1 G5:1 F#5:.5 Eb5:.5 | Eb5:1 D5:.5 C5:.5 Bb4:1 G4:1 | A4:1 Bb4:.5 A4:.5 G4:.5 F#4:.5 Eb4:1 | D4:2 r:2'}],
        'fx': [fx_wind(2, 300, 900, 0.025)], 'room': 0.3},

    # Kaldvik, Icewold: E Dorian in 3/4, bells, wind, a slow flute
    'snow': {'bpm': 76, 'beats': 3, 'key': 'E Dorian', 'prog': 'Em A Em D Em A C D C G D Em C G A D', 'layers': [
        {'type': 'pad', 'cut': 900, 'gain': 0.12, 'a': 1.0, 'r': 1.0},
        {'type': 'bass', 'pat': [(0, 0, 3)], 'gain': 0.2, 'square': 0.0},
        {'type': 'arp', 'voice': 'bell', 'oct': 24, 'pat': [0, 1, 2, 3, 2, 1], 'gain': 0.06, 'len': 1.8, 'spread': 0.5},
        {'type': 'lead', 'voice': 'flute', 'gain': 0.14, 'mel':
            'B4:1.5 A4:.5 G4:1 | E5:2 C#5:1 | B4:1 G4:1 E4:1 | F#4:3 | B4:1.5 C#5:.5 D5:1 | E5:1.5 F#5:.5 E5:1 | G5:2 E5:1 | F#5:3 |'
            'E5:1 G5:1 E5:1 | D5:2 B4:1 | A4:1 F#4:1 A4:1 | B4:3 | G4:1 A4:1 B4:1 | D5:1.5 B4:.5 G4:1 | A4:1 C#5:1 E5:1 | F#5:1.5 E5:.5 D5:1'}],
        'fx': [fx_wind(2, 200, 1400, 0.07)], 'room': 0.45},

    # Wraithwood, Pallmoor, Greenfen, Saltmarsh, West Rotmoor: a music-box lullaby in A minor (6/8) over a low drone
    'swamp': {'bpm': 150, 'beats': 6, 'meter': '6/8', 'key': 'A minor', 'prog': 'Am Am Dm E Am F Dm E F C Dm Am Dm F E E', 'layers': [
        {'type': 'pad', 'drone': True, 'oct': -12, 'cut': 480, 'gain': 0.22, 'a': 1.2, 'r': 1.2},
        {'type': 'bass', 'pat': [(0, 0, 6)], 'gain': 0.16, 'square': 0.05},
        {'type': 'lead', 'voice': 'bell', 'oct': 12, 'gain': 0.07, 'mel':
            'E5:2 A4:1 C5:2 B4:1 | A4:3 r:3 | F5:2 E5:1 D5:2 A4:1 | G#4:3 B4:2 D#5:1 | E5:2 A4:1 C5:2 E5:1 | F5:3 E5:2 C5:1 | D5:2 F5:1 A5:2 G#5:1 | B4:6 |'
            'A5:2 G5:1 F5:2 E5:1 | E5:3 G5:3 | F5:2 E5:1 D5:2 C5:1 | C5:2 B4:1 A4:3 | D5:2 C5:1 B4:2 A4:1 | C5:3 A4:3 | B4:2 C5:1 D#5:2 E5:1 | G#4:3 r:3'},
        {'type': 'lead', 'voice': 'fiddle', 'gain': 0.05, 'from': 9, 'mel':
            'r:6 | r:6 | r:6 | r:6 | r:6 | r:6 | r:6 | r:6 | A3:6 | G3:6 | F3:6 | E3:6 | D3:6 | F3:6 | E3:6 | E3:6'}],
        'fx': [fx_hits(lambda: drip(0.1), [0.07, 0.21, 0.33, 0.52, 0.64, 0.81, 0.93]), fx_wind(1, 150, 500, 0.03)], 'room': 0.5},

    # Kingsmere: the Accord capital, a regal C major with horns and a march
    'kingsmere': {'bpm': 96, 'beats': 4, 'key': 'C major', 'prog': 'C G Am F C F G G Am Em F C F C G G', 'layers': [
        {'type': 'pad', 'cut': 1400, 'gain': 0.11},
        {'type': 'bass', 'pat': [(0, 0, 1), (1, 7, 1), (2, 0, 1), (3, 7, 1)], 'gain': 0.24, 'square': 0.2},
        {'type': 'arp', 'voice': 'pluck', 'pat': [0, 1, 2, 1, 0, 1, 2, 1], 'gain': 0.07, 'spread': 0.3},
        {'type': 'drums', 'pat': ['k...s...k...s...', 'k...s...k...s...', 'k...s...k...s...', 'k...s...k.s.ssss'], 'gain': 0.8},
        {'type': 'lead', 'voice': 'horn', 'gain': 0.15, 'mel':
            'G4:1.5 C5:.5 E5:1 C5:1 | D5:2 B4:1 G4:1 | C5:1.5 B4:.5 A4:1 E5:1 | F5:3 r:1 | E5:1.5 D5:.5 C5:1 G4:1 | A4:1 C5:1 F5:1 E5:.5 D5:.5 | D5:2 G5:2 | G5:3 r:1 |'
            'E5:1.5 F5:.5 E5:1 C5:1 | B4:2 G4:2 | A4:1 C5:1 F5:1.5 E5:.5 | E5:2 C5:2 | F5:1.5 E5:.5 D5:1 C5:1 | E5:1.5 D5:.5 C5:1 G4:1 | B4:1 D5:1 G5:2 | F5:1 E5:1 D5:1 B4:1'}],
        'room': 0.3},

    # Keldrun: the dwarven city in the mountain, D Dorian, war drums and the anvil on 2 and 4
    'keldrun': {'bpm': 92, 'beats': 4, 'key': 'D Dorian', 'prog': 'Dm Dm C Dm Dm F C Dm Bb F C Dm Bb C A A', 'layers': [
        {'type': 'choir', 'cut': 850, 'gain': 0.13},
        {'type': 'bass', 'pat': [(0, 0, 2), (2, 0, 1.5), (3.5, 7, 0.5)], 'gain': 0.3, 'square': 0.4},
        {'type': 'drums', 'pat': ['D...c...D...c.D.', 'D...c...D.D.c.D.'], 'gain': 0.9, 'low': 75},
        {'type': 'lead', 'voice': 'horn', 'gain': 0.15, 'mel':
            'D4:1.5 F4:.5 A4:1 G4:1 | F4:1 E4:1 D4:2 | E4:1.5 G4:.5 C5:1 B4:.5 A4:.5 | A4:3 r:1 | A4:1.5 C5:.5 D5:1 C5:1 | A4:1 F4:1 C5:2 | G4:1 E4:1 G4:1 C5:1 | D5:3 r:1 |'
            'D5:1.5 C5:.5 Bb4:1 F4:1 | A4:1.5 G4:.5 F4:1 C4:1 | E4:1 G4:1 C5:1 E5:1 | D5:2 A4:2 | Bb4:1 D5:1 F5:1.5 E5:.5 | E5:1 D5:.5 C5:.5 G4:2 | A4:1 C#5:1 E5:1 C#5:1 | A4:2 E4:2'}],
        'room': 0.42},

    # Nyrwen: the elven city under the moon, E Lydian in 3/4, harp and a high flute
    'nyrwen': {'bpm': 63, 'beats': 3, 'key': 'E Lydian', 'prog': 'E F# E C#m A B E E C#m F# A E C#m A B B', 'layers': [
        {'type': 'pad', 'cut': 1500, 'gain': 0.1, 'a': 1.0, 'r': 1.0},
        {'type': 'bass', 'pat': [(0, 0, 3)], 'gain': 0.18, 'square': 0.0},
        {'type': 'arp', 'voice': 'harp', 'pat': [0, 1, 2, 3, 2, 1], 'gain': 0.15, 'len': 1.3},
        {'type': 'arp', 'voice': 'bell', 'oct': 36, 'pat': [0, None, None, None, None, None], 'gain': 0.04, 'len': 2.4},
        {'type': 'lead', 'voice': 'flute', 'gain': 0.14, 'mel':
            'B4:1.5 G#4:.5 E4:1 | A#4:2 C#5:1 | B4:1 G#5:1 F#5:1 | E5:3 | C#5:1.5 E5:.5 A5:1 | F#5:2 D#5:1 | E5:1 G#5:1 B5:1 | G#5:3 |'
            'G#5:1.5 F#5:.5 E5:1 | A#5:2 F#5:1 | E5:1 C#5:1 A4:1 | B4:3 | C#5:1 E5:1 G#5:1 | A5:1.5 G#5:.5 E5:1 | F#5:1 D#5:1 B4:1 | D#5:1.5 E5:.5 F#5:1'}],
        'room': 0.5},

    # Vazhrak: the Horde capital, E minor, war drums and a driving square bass
    'vazhrak': {'bpm': 108, 'beats': 4, 'key': 'E minor', 'prog': 'Em Em C D Em Em C B Am Em C D Am C B B', 'layers': [
        {'type': 'pad', 'cut': 900, 'gain': 0.1},
        {'type': 'bass', 'pat': [(i * 0.5, 0, 0.45) for i in range(8)], 'gain': 0.2, 'square': 0.55},
        {'type': 'drums', 'pat': ['D..D..D.D...T.T.', 'D..D..D.D...T.T.', 'D..D..D.D...T.T.', 'D.D.D.D.T.T.TTTT'], 'gain': 1.0, 'low': 70, 'high': 160},
        {'type': 'lead', 'voice': 'horn', 'gain': 0.15, 'mel':
            'E4:1 E4:.5 G4:.5 B4:1 A4:1 | G4:1 F#4:1 E4:2 | C5:1 B4:.5 A4:.5 G4:1 E4:1 | F#4:1 A4:1 D5:2 | E5:1 D5:.5 B4:.5 E5:1 D5:1 | B4:1 G4:1 E4:2 | G4:1 A4:1 C5:1 E5:1 | D#5:3 r:1 |'
            'C5:1.5 B4:.5 A4:1 E5:1 | B4:2 G4:2 | E5:1 D5:1 C5:1 B4:1 | A4:1 D5:1 F#4:2 | A4:1 C5:1 E5:2 | G5:1 E5:1 C5:2 | B4:1 D#5:1 F#5:2 | F#5:1 D#5:1 B4:2'}],
        'room': 0.3},

    # Hornwind Mesa: the high plateau, G Mixolydian, open fifths, wind and a heartbeat drum
    'hornwind': {'bpm': 76, 'beats': 4, 'key': 'G Mixolydian', 'prog': 'G F G G C G F G C F Dm G', 'layers': [
        {'type': 'pad', 'cut': 950, 'gain': 0.12},
        {'type': 'bass', 'pat': [(0, 0, 4)], 'gain': 0.24, 'square': 0.1},
        {'type': 'drums', 'pat': 'D.....D.D.......', 'gain': 0.9, 'low': 65},
        {'type': 'lead', 'voice': 'flute', 'gain': 0.15, 'mel':
            'D5:1.5 E5:.5 D5:1 B4:1 | A4:1.5 C5:.5 A4:1 F4:1 | G4:2 D4:1 G4:1 | B4:3 r:1 | E5:1.5 G5:.5 E5:1 D5:1 | B4:1 D5:1 G5:2 |'
            'F5:1.5 E5:.5 D5:1 C5:1 | D5:3 r:1 | G5:1 E5:1 D5:1 C5:1 | A4:1.5 C5:.5 F5:2 | D5:1 C5:1 A4:1 F4:1 | G4:4'}],
        'fx': [fx_wind(2, 250, 1000, 0.05)], 'room': 0.45},

    # Gravenhold: the city of the Risen below the ruins, C harmonic minor, voices and a music box
    'gravenhold': {'bpm': 72, 'beats': 4, 'key': 'C minor', 'prog': 'Cm Cm Ab G Cm Fm Ab G Fm Cm Db G', 'layers': [
        {'type': 'choir', 'cut': 700, 'gain': 0.17},
        {'type': 'bass', 'pat': [(0, 0, 1), (1, 7, 1), (2, 12, 1), (3, 7, 1)], 'gain': 0.18, 'square': 0.0},
        {'type': 'arp', 'voice': 'bell', 'oct': 24, 'step': 1, 'pat': [0, 2, 1, 2], 'gain': 0.05, 'len': 2.0},
        {'type': 'lead', 'voice': 'fiddle', 'gain': 0.09, 'mel':
            'G4:2 C5:1 Eb5:1 | D5:1.5 C5:.5 B4:2 | C5:2 Eb5:1 Ab5:1 | G5:3 r:1 | G5:1 F5:.5 Eb5:.5 D5:1 C5:1 | Ab4:2 C5:1 F5:1 |'
            'Eb5:1.5 D5:.5 C5:2 | B4:3 r:1 | F5:1.5 Eb5:.5 C5:1 Ab4:1 | G4:1 C5:1 Eb5:2 | Db5:1.5 C5:.5 Ab4:1 F4:1 | G4:1 B4:1 D5:1 F5:1'}],
        'fx': [fx_hits(lambda: clank(0.06), [0.13, 0.47, 0.79]), fx_hits(lambda: drip(0.07), [0.3, 0.62, 0.9])], 'room': 0.55},




    # ---- the raids (v10.8): grander than any dungeon, hand-written in three parts. Bars 1-8 a brass chorale over voices
    # and a timpani heartbeat; bars 9-16 the battle; bars 17-24 the climax, the theme up high over brass stabs. Cymbal
    # swells and crashes mark the parts, a great bell tolls at each.
    # Veshmira's Lair: the brood mother's den, D minor, a broad horn theme with dragon-sized brass
    'veshmira': {'bpm': 104, 'beats': 4, 'key': 'D minor', 'prog': 'Dm Bb Gm A Dm Bb C A Dm Dm Bb C Dm Dm Gm A Bb C Dm Bb Gm A Dm A', 'layers': [
        {'type': 'choir', 'cut': 1000, 'gain': 0.15},
        {'type': 'brass', 'pat': [(0, 4)], 'gain': 0.06, 'to': 8},
        {'type': 'brass', 'pat': [(0, 1.5), (1.5, 0.5), (2, 2)], 'gain': 0.06, 'from': 17},
        {'type': 'toll', 'bars': [1, 9], 'gain': 0.14},
        {'type': 'bass', 'pat': [(0, 0, 4)], 'gain': 0.26, 'square': 0.2, 'to': 8},
        {'type': 'bass', 'pat': [(i * 0.5, 0, 0.45) for i in range(8)], 'gain': 0.22, 'square': 0.5, 'from': 9},
        {'type': 'arp', 'voice': 'pluck', 'oct': 0, 'step': 0.25, 'pat': [0, 0, 1, 0, 2, 0, 1, 0, 0, 0, 1, 0, 2, 0, 1, 2], 'gain': 0.07, 'len': 0.12, 'bright': 1800, 'spread': 0.2, 'from': 9},
        {'type': 'drums', 'pat': ['D.......D.......'] * 7 + ['D.......D.D.DDDD'], 'gain': 0.8, 'low': 55, 'to': 8},
        {'type': 'drums', 'pat': ['D..D..D.D...D.D.'] * 7 + ['D..D..D.D.D.DDDD'], 'gain': 0.75, 'low': 55, 'from': 9},
        {'type': 'drums', 'pat': ['k...s...k.k.s...', 'k...s...k.k.s.ss'], 'gain': 0.7, 'from': 9},
        {'type': 'lead', 'voice': 'horn', 'gain': 0.17, 'mel':
            'D4:2 A4:2 | Bb4:1.5 A4:.5 F4:2 | G4:2 D5:2 | C#5:3 r:1 | D5:2 F5:2 | E5:1.5 D5:.5 Bb4:2 | C5:1.5 D5:.5 E5:2 | A4:4 |'
            'D4:1 E4:.5 F4:.5 A4:2 | G4:1 F4:1 E4:1 D4:1 | D4:1 F4:1 Bb4:2 | A4:1.5 G4:.5 E4:2 | F4:1 A4:1 D5:2 | C5:1 A4:1 F4:1 D4:1 | Bb4:1.5 A4:.5 G4:2 | E4:1 G4:1 C#5:2 |'
            'F5:2 D5:1 F5:1 | G5:2 E5:1 G5:1 | A5:3 F5:1 | D5:4 | G5:1.5 F5:.5 D5:1 Bb4:1 | C#5:1 E5:1 A5:2 | F5:1.5 E5:.5 D5:2 | E5:2 C#5:2'},
        {'type': 'lead', 'voice': 'fiddle', 'gain': 0.08, 'oct': 12, 'from': 17, 'mel':
            'r:4 | r:4 | r:4 | r:4 | r:4 | r:4 | r:4 | r:4 | r:4 | r:4 | r:4 | r:4 | r:4 | r:4 | r:4 | r:4 |'
            'F5:2 D5:1 F5:1 | G5:2 E5:1 G5:1 | A5:3 F5:1 | D5:4 | G5:1.5 F5:.5 D5:1 Bb4:1 | C#5:1 E5:1 A5:2 | F5:1.5 E5:.5 D5:2 | E5:2 C#5:2'}],
        'fx': [fx_swell([9, 17]), fx_crash([9, 17])], 'room': 0.45, 'tail': 5},

    # The Magma Throne: the fire lord's hall, C Phrygian, a ritual chant over the anvil, then a heavy gallop
    'magma': {'bpm': 100, 'beats': 4, 'key': 'C Phrygian', 'prog': 'C5 Db C5 C5 C5 Db Bbm C5 Cm Db Cm Bbm Ab Bbm Db C5 Fm Db Ab Eb Db Bbm C5 C5', 'layers': [
        {'type': 'choir', 'cut': 700, 'gain': 0.18, 'oct': 0},
        {'type': 'brass', 'pat': [(0, 4)], 'gain': 0.05, 'oct': 0, 'to': 8},
        {'type': 'brass', 'pat': [(0, 0.5), (1.5, 0.5), (2, 0.5), (3.5, 0.5)], 'gain': 0.06, 'from': 9},
        {'type': 'toll', 'bars': [1, 9, 17], 'gain': 0.16, 'oct': -24},
        {'type': 'bass', 'pat': [(0, 0, 4)], 'gain': 0.3, 'square': 0.4, 'to': 8},
        {'type': 'bass', 'pat': [(i * 0.5, 0, 0.45) for i in range(8)], 'gain': 0.23, 'square': 0.7, 'from': 9},
        {'type': 'arp', 'voice': 'pluck', 'oct': 0, 'step': 0.25, 'pat': [0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 1, 0, 2, 0, 1, 0], 'gain': 0.08, 'len': 0.12, 'bright': 1500, 'spread': 0.15, 'from': 9},
        {'type': 'drums', 'pat': ['D...c...D...c...'] * 7 + ['D...c...D.D.DDDD'], 'gain': 0.9, 'low': 55, 'to': 8},
        {'type': 'drums', 'pat': ['k.k.s.kkk.k.s...', 'k.k.s.kkk.k.s.ss'], 'gain': 0.8, 'from': 9},
        {'type': 'drums', 'pat': ['D.......D...D...'] * 7 + ['D.......D.D.DDDD'], 'gain': 0.7, 'low': 52, 'from': 9},
        {'type': 'lead', 'voice': 'horn', 'gain': 0.17, 'mel':
            'C4:2 Db4:2 | F4:2 Eb4:1 Db4:1 | C4:3 r:1 | G3:2 C4:2 | C4:1 Db4:1 Eb4:1 F4:1 | Ab4:2 F4:2 | Db5:1.5 C5:.5 Bb4:2 | C5:4 |'
            'G4:1 Ab4:1 G4:1 Eb4:1 | F4:1.5 Ab4:.5 Db5:2 | C5:1 Bb4:1 G4:2 | F4:1 Db5:1 Bb4:2 | C5:1.5 Eb5:.5 Ab5:2 | F5:1 Db5:1 Bb4:2 | Ab4:1 Db5:1 F5:2 | G5:2 C5:2 |'
            'C5:1.5 Ab4:.5 F4:2 | F5:1.5 Eb5:.5 Db5:2 | Eb5:1 C5:1 Ab4:2 | G4:1 Bb4:1 Eb5:2 | F5:2 Ab5:2 | Db5:1.5 C5:.5 Bb4:2 | C5:1 Db5:1 C5:1 G4:1 | C5:4'}],
        'fx': [fx_swell([9, 17]), fx_crash([9, 17], 0.1), fx_hits(lambda: windy(3, 3, 100, 500, 0.06), [0.1, 0.45, 0.8])], 'room': 0.42, 'tail': 5},

    # The Tidecrown Citadel: the drowned court, a majestic G minor in 3/4, harp waves, the court bell, brass
    'tidecrown': {'bpm': 92, 'beats': 3, 'key': 'G minor', 'prog': 'Gm Eb Cm D Gm Eb F D Gm Gm Eb F Cm D Gm D Eb F D Gm Cm Eb D D', 'layers': [
        {'type': 'choir', 'cut': 1000, 'gain': 0.14},
        {'type': 'arp', 'voice': 'harp', 'pat': [0, 1, 2, 3, 4, 3], 'gain': 0.12},
        {'type': 'brass', 'pat': [(0, 3)], 'gain': 0.055, 'to': 8},
        {'type': 'brass', 'pat': [(0, 1), (2, 1)], 'gain': 0.06, 'from': 17},
        {'type': 'toll', 'bars': [1, 9], 'gain': 0.14},
        {'type': 'bass', 'pat': [(0, 0, 3)], 'gain': 0.26, 'square': 0.15, 'to': 8},
        {'type': 'bass', 'pat': [(0, 0, 1), (1, 7, 1), (2, 0, 1)], 'gain': 0.23, 'square': 0.3, 'from': 9},
        {'type': 'drums', 'pat': ['D.......D...'] * 7 + ['D.......DDDD'], 'gain': 0.8, 'low': 58, 'to': 8},
        {'type': 'drums', 'pat': ['k.h.s.h.s.h.', 'k.h.s.h.s.ss'], 'gain': 0.7, 'from': 9},
        {'type': 'drums', 'pat': ['D.......D...'] * 7 + ['D.......DDDD'], 'gain': 0.65, 'low': 55, 'from': 9},
        {'type': 'lead', 'voice': 'horn', 'gain': 0.17, 'mel':
            'D4:1.5 G4:.5 Bb4:1 | Bb4:2 G4:1 | Eb5:1.5 D5:.5 C5:1 | A4:3 | Bb4:1.5 C5:.5 D5:1 | G5:2 Eb5:1 | F5:1.5 Eb5:.5 C5:1 | D5:3 |'
            'G4:1 Bb4:1 D5:1 | G5:2 F5:1 | Eb5:1.5 D5:.5 Bb4:1 | C5:2 A4:1 | C5:1 Eb5:1 G5:1 | F#5:2 D5:1 | D5:1.5 C5:.5 Bb4:1 | A4:3 |'
            'Bb4:1 Eb5:1 G5:1 | A5:2 F5:1 | F#5:1.5 E5:.5 D5:1 | G5:3 | Eb5:1.5 D5:.5 C5:1 | Bb4:2 G4:1 | A4:1 D5:1 F#5:1 | D5:3'},
        {'type': 'lead', 'voice': 'flute', 'gain': 0.08, 'oct': 12, 'from': 17, 'mel':
            'r:3 | r:3 | r:3 | r:3 | r:3 | r:3 | r:3 | r:3 | r:3 | r:3 | r:3 | r:3 | r:3 | r:3 | r:3 | r:3 |'
            'Bb4:1 Eb5:1 G5:1 | A5:2 F5:1 | F#5:1.5 E5:.5 D5:1 | G5:3 | Eb5:1.5 D5:.5 C5:1 | Bb4:2 G4:1 | A4:1 D5:1 F#5:1 | D5:3'}],
        'fx': [fx_swell([9, 17]), fx_crash([9, 17]), fx_wind(4, 200, 800, 0.04)], 'room': 0.5, 'tail': 5},

    # Rumhook Bay (v10.9): the goblin port's town theme, a harbour shanty in 6/8 with a squeeze-box strum and the fiddle
    'rumhook': {'bpm': 168, 'beats': 6, 'meter': '6/8', 'key': 'G major', 'prog': 'G C G D G C D G Em C G D C G D G', 'layers': [
        {'type': 'pad', 'cut': 1000, 'gain': 0.07},
        {'type': 'bass', 'pat': [(0, 0, 3), (3, 7, 3)], 'gain': 0.18, 'square': 0.15, 'wrap': True},
        {'type': 'stab', 'at': [1, 2, 4, 5], 'gain': 0.055, 'len': 0.16, 'bright': 1400},
        {'type': 'drums', 'pat': ['k.hs.hk.hs.h', 'k.hs.hk.ss.s'], 'step': 0.5, 'gain': 0.55, 'from': 5},
        {'type': 'lead', 'voice': 'fiddle', 'gain': 0.12, 'mel':
            'D5:2 B4:1 G4:2 B4:1 | C5:2 E5:1 G5:2 E5:1 | D5:3 B4:3 | A4:2 B4:1 C5:2 A4:1 | B4:2 D5:1 G5:2 F#5:1 | E5:2 C5:1 E5:2 G5:1 | F#5:2 E5:1 D5:2 C5:1 | B4:3 G4:3 |'
            'E5:2 F#5:1 G5:2 E5:1 | C5:2 E5:1 G5:3 | D5:2 B4:1 D5:2 G5:1 | F#5:3 D5:3 | E5:2 G5:1 E5:2 C5:1 | D5:2 B4:1 G4:2 B4:1 | A4:2 D5:1 F#5:2 E5:1 | G5:3 r:3'}],
        'fx': [fx_wind(4, 200, 700, 0.03)], 'room': 0.35},

    # World bosses: B minor, driving drums and bass, a horn call
    'worldboss': {'bpm': 126, 'beats': 4, 'key': 'B minor', 'prog': 'Bm Bm G A Bm Bm Em F# G A Bm Bm Em G F# F#', 'layers': [
        {'type': 'pad', 'cut': 1000, 'gain': 0.11},
        {'type': 'bass', 'pat': [(i * 0.5, 0, 0.45) for i in range(8)], 'gain': 0.22, 'square': 0.45},
        {'type': 'arp', 'voice': 'pluck', 'step': 0.25, 'pat': [0, 1, 2, 1] * 4, 'gain': 0.05, 'len': 0.14, 'spread': 0.3},
        {'type': 'drums', 'pat': ['k.h.s.hkk.h.s.h.', 'k.h.s.hkk.h.s.ss'], 'gain': 0.9},
        {'type': 'lead', 'voice': 'horn', 'gain': 0.15, 'mel':
            'F#4:1 B4:1 D5:1.5 C#5:.5 | B4:2 F#4:2 | G4:1 B4:1 D5:1 G5:1 | E5:1.5 D5:.5 C#5:2 | D5:1 F#5:1 E5:1 D5:1 | C#5:1 B4:1 F#4:2 | G4:1 B4:1 E5:2 | A#4:1 C#5:1 F#5:2 |'
            'G5:1.5 F#5:.5 E5:1 D5:1 | E5:1.5 F#5:.5 A5:2 | F#5:2 D5:2 | B4:4 | E5:1 G5:1 F#5:1 E5:1 | D5:1 B4:1 G4:2 | A#4:1 C#5:1 E5:1 F#5:1 | F#5:2 C#5:2'}],
        'room': 0.33},

    # The Battle for Highmoor: the highlands, a D Mixolydian march with a fiddle tune and horns at the end
    'highmoor': {'bpm': 120, 'beats': 4, 'key': 'D Mixolydian', 'prog': 'D C D A D C G A G D C D G D A A', 'layers': [
        {'type': 'pad', 'cut': 1200, 'gain': 0.1},
        {'type': 'bass', 'pat': [(0, 0, 1), (1, 7, 1), (2, 0, 1), (3, 7, 1)], 'gain': 0.24, 'square': 0.25},
        {'type': 'drums', 'pat': ['k...s.ssk...s...', 'k...s.ssk...s...', 'k...s.ssk...s...', 'k...s.ssk.s.ssss'], 'gain': 0.85},
        {'type': 'lead', 'voice': 'fiddle', 'gain': 0.13, 'mel':
            'A4:.5 D5:.5 F#5:.5 E5:.5 D5:1 A4:1 | G4:.5 C5:.5 E5:.5 D5:.5 C5:1 G4:1 | F#4:.5 A4:.5 D5:.5 E5:.5 F#5:1 D5:1 | E5:1.5 C#5:.5 A4:2 |'
            'A5:.5 F#5:.5 D5:.5 F#5:.5 A5:1 F#5:1 | G5:.5 E5:.5 C5:.5 E5:.5 G5:1 E5:1 | D5:.5 G5:.5 B5:.5 A5:.5 G5:1 D5:1 | E5:1 C#5:1 A4:2 |'
            'B4:1 D5:1 G5:1.5 F#5:.5 | F#5:1 E5:.5 D5:.5 A4:2 | C5:1 E5:1 G5:1.5 E5:.5 | D5:3 r:1 | G5:1.5 A5:.5 B5:1 G5:1 | A5:1.5 F#5:.5 D5:2 | E5:1 F#5:.5 G5:.5 A5:1 E5:1 | C#5:1 E5:1 A5:2'},
        {'type': 'lead', 'voice': 'horn', 'gain': 0.11, 'oct': -12, 'from': 13, 'mel':
            'r:4 | r:4 | r:4 | r:4 | r:4 | r:4 | r:4 | r:4 | r:4 | r:4 | r:4 | r:4 | G5:1.5 A5:.5 B5:1 G5:1 | A5:1.5 F#5:.5 D5:2 | E5:1 F#5:.5 G5:.5 A5:1 E5:1 | C#5:1 E5:1 A5:2'}],
        'room': 0.32},

    # The main menu: the game's theme, D major; harp and flute, then the horn and a light beat join
    'menu': {'bpm': 80, 'beats': 4, 'key': 'D major', 'prog': 'D A Bm G D A G A Bm G D A Em G A A', 'layers': [
        {'type': 'pad', 'cut': 1200, 'gain': 0.12, 'a': 0.8, 'r': 0.9},
        {'type': 'bass', 'pat': [(0, 0, 2), (2, 7, 2)], 'gain': 0.24, 'square': 0.1},
        {'type': 'arp', 'voice': 'harp', 'pat': [0, 1, 2, 3, 2, 1, 2, 4], 'gain': 0.15},
        {'type': 'drums', 'from': 9, 'pat': ['k.......k...h...', 'k.......k.h.h.h.'], 'gain': 0.55},
        {'type': 'lead', 'voice': 'flute', 'gain': 0.15, 'to': 8, 'mel':
            'F#4:1 A4:1 D5:1.5 C#5:.5 | E5:2 C#5:2 | D5:1 B4:1 F#4:1.5 A4:.5 | B4:3 r:1 | A4:1 D5:1 F#5:1.5 E5:.5 | E5:2 A4:2 | B4:1 D5:1 G5:1 F#5:.5 E5:.5 | E5:3 r:1 |'
            'r:4 | r:4 | r:4 | r:4 | r:4 | r:4 | r:4 | r:4'},
        {'type': 'lead', 'voice': 'horn', 'gain': 0.14, 'from': 9, 'mel':
            'r:4 | r:4 | r:4 | r:4 | r:4 | r:4 | r:4 | r:4 |'
            'F#5:1.5 E5:.5 D5:1 B4:1 | D5:1.5 E5:.5 G5:2 | F#5:1 A5:1 F#5:1 D5:1 | E5:3 C#5:1 | B4:1 E5:1 G5:1.5 F#5:.5 | E5:1 D5:1 B4:2 | C#5:1 E5:1 A5:2 | G5:1 E5:1 C#5:1 A4:1'}],
        'room': 0.4},
    # Lanternwake (v10.13): the autumn festival, a D minor waltz like a music box left on a windowsill for the dead;
    # flute over harp and bells, a soft choir joining on the second half. Plays in the Snuffed Road and on the festival menu
    'lanternwake': {'bpm': 84, 'beats': 3, 'key': 'D minor', 'meter': '3/4', 'prog': 'Dm Bb F A Dm Gm A A Dm Bb F C Gm Dm A Dm', 'layers': [
        {'type': 'pad', 'cut': 1000, 'gain': 0.1, 'a': 0.8, 'r': 0.9},
        {'type': 'bass', 'pat': [(0, 0, 1)], 'gain': 0.22, 'square': 0.1},
        {'type': 'stab', 'at': [1, 2], 'gain': 0.045, 'len': 0.25, 'bright': 1800},
        {'type': 'arp', 'voice': 'bell', 'pat': [0, 2, 4, 2, 3, 2], 'gain': 0.07, 'len': 1.4},
        {'type': 'choir', 'from': 9, 'gain': 0.08, 'cut': 760},
        {'type': 'lead', 'voice': 'flute', 'gain': 0.14, 'mel':
            'A4:1 D5:1 F5:1 | F5:1.5 E5:.5 D5:1 | C5:1 F5:1 A5:1 | G5:1.5 F5:.5 E5:1 | D5:1 F5:1 A5:1 | Bb5:1.5 A5:.5 G5:1 | A5:1 E5:1 C#5:1 | A4:3 |A4:1 D5:1 F5:1 | F5:1.5 G5:.5 F5:1 | E5:1 C5:1 A4:1 | G4:1.5 C5:.5 E5:1 | D5:1 Bb4:1 G4:1 | F5:1.5 E5:.5 D5:1 | r:.5 C#5:1 B4:.5 A4:1 | D5:3'}],
        'room': 0.42},
}


def render(name):
    x, info = song(TRACKS[name])
    x, _ = cg.loudnorm(x, -18.0)              # same level as the other game music
    p = os.path.join(WAV, f'music_{name}.wav'); cg.write_wav(p, x)
    cg.enc(p, os.path.join(OUT, f'music_{name}.m4a'), 128)
    # a preview that plays the loop twice, so the seam can be heard
    pp = os.path.join(WAV, f'preview_{name}.wav'); cg.write_wav(pp, np.concatenate([x, x]))
    cg.enc(pp, os.path.join(PREVIEW, f'{name}-loop-twice.m4a'), 160); os.remove(pp)
    info['loop_s'] = round(len(x) / SR, 4)
    return info


if __name__ == '__main__':
    names = sys.argv[1:] or list(TRACKS)
    mp = os.path.join(OUT, 'music.json'); meta = json.load(open(mp)) if os.path.exists(mp) else {}
    for n in names:
        meta[n] = render(n); print(n, meta[n], flush=True)
    json.dump(meta, open(mp, 'w'), indent=1)
