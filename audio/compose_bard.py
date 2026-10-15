"""Realm of Loner: the Bard's song music (#257). While a Bard sings, the song is the music: one phrase in the instrument's
voice, as long as the song (Lute 12 s, Drum 8 s, Horn 16 s), on the songs' shared beat.

Build-up (decided 2026-10-15): calm when a song starts, big at full verses, so playing well makes the fight sound bigger.
A mixolydian, folk-heroic: A G D A | F#m G E E. The E slots start about a second before the beat window and end on a run
that only resolves (back to A) when the beat lands; a missed beat leaves it ringing on E.
  Lute: a jig, 160 bpm, 8 bars (the Accord heralds)
  Drum: war drums, 120 bpm, 4 bars (the Krugar drum-speakers), the most driving
  Horn: an anthem, 120 bpm, 8 bars, slow and grand
Layers (music_bard_<instrument>_<n>), one more per verse: 1 the lead, 2 the chords, 3 bass and drums, 4 a top line (Lute
and Drum, which have 3 verses). Parts (music_bard_<instrument>_<part>), one per song that is up, each in its own range so
any of them fit together: high (Song of Rest), low (Dirge), march (Marching Song), riff (Ballad of Blades). The parts are
src/data/bard.js D.SONG_PARTS; a new one needs its function here.
Each file is mono, set to its own loudness (the lead first), then all by one gain so the full mix sits at -20 LUFS.

Usage: ~/.venvs/audio/bin/python compose_bard.py   (writes out/ and a listening reel to preview/)
"""
import os
import wave
import numpy as np
import compose_game as cg
from compose_game import SR, t_, midi, env, lp, harp, pluck, bassnote, pad, flute, fiddle, tamb, kick, noise, enc
from compose_themes import horn, bell

TAIL = 2.0  # the last chord rings this long after the phrase, when no beat lands
INST = {'lute': dict(len=12, slots=16), 'drum': dict(len=8, slots=8), 'horn': dict(len=16, slots=16)}  # a slot = 2 beats
TRIADS = {'A': (57, 61, 64), 'G': (55, 59, 62), 'D': (50, 54, 57), 'F#m': (54, 57, 61), 'E': (52, 56, 59)}
PROG16 = ['A', 'A', 'G', 'G', 'D', 'D', 'A', 'A', 'F#m', 'F#m', 'G', 'G', 'E', 'E', 'E', 'E']
# the tune, per 2-beat slot of PROG16: (beat in the slot, midi, beats). The last slots climb D E F# G# to the beat.
MEL16 = [[(0, 76, 1), (1, 74, .5), (1.5, 73, .5)], [(0, 69, 1), (1, 73, .5), (1.5, 76, .5)],
         [(0, 74, 1.5), (1.5, 71, .5)], [(0, 67, 1), (1, 71, .5), (1.5, 74, .5)],
         [(0, 78, 1), (1, 76, .5), (1.5, 74, .5)], [(0, 74, 1), (1, 78, .5), (1.5, 81, .5)],
         [(0, 81, 1.5), (1.5, 79, .5)], [(0, 76, 2)],
         [(0, 78, 1), (1, 76, .5), (1.5, 73, .5)], [(0, 69, 1), (1, 73, .5), (1.5, 78, .5)],
         [(0, 79, 1), (1, 78, .5), (1.5, 76, .5)], [(0, 74, 1), (1, 71, 1)],
         [(0, 71, 2)], [(0, 68, 1), (1, 71, 1)],
         [(0, 74, .5), (.5, 76, .5), (1, 78, .5), (1.5, 80, .5)], [(0, 76, .5), (.5, 78, .5), (1, 80, 1)]]


def plan(inst):
    """the chord and tune of each slot; the Drum's 4 bars take every other slot of the 8-bar tune"""
    if INST[inst]['slots'] == 16: return PROG16, MEL16
    return PROG16[::2], [MEL16[i] for i in range(0, 16, 2)]


def hand_drum(note, gain=1.0, dur=0.4):
    t = t_(dur); f = midi(note) * (1 + 0.35 * np.exp(-t * 40))
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
    return (body + lp(noise(dur), 2400) * np.exp(-t * 60) * 0.45) * gain


def snare(gain=0.4):
    t = t_(0.18); n = noise(0.18)
    return ((n - lp(n, 1800)) * np.exp(-t * 28) + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 35) * 0.5) * gain


class Track:
    def __init__(self, inst):
        self.inst = inst; c = INST[inst]
        self.len = c['len']; self.slot = c['len'] / c['slots']; self.beat = self.slot / 2
        self.n = int((self.len + TAIL) * SR)
        self.prog, self.mel = plan(inst)

    def new(self): return np.zeros(self.n)

    def put(self, x, sig, at):
        s = int(at * SR); e = min(self.n, s + len(sig))
        if e > s: x[s:e] += sig[: e - s]

    def last(self, i): return i == len(self.prog) - 1  # the slot that rings into the tail


def lead(T):
    x = T.new()
    if T.inst == 'drum':  # the Drum leads with its own voice: a war-drum groove, low on 1, answers between
        for i in range(len(T.prog)):
            at = i * T.slot
            T.put(x, hand_drum(45, 1.0), at); T.put(x, hand_drum(52, 0.45), at + 0.5 * T.beat)
            T.put(x, hand_drum(57, 0.6), at + T.beat); T.put(x, hand_drum(52, 0.35), at + 1.5 * T.beat)
        return x
    for i, notes in enumerate(T.mel):
        for b, nn, beats in notes:
            d = beats * T.beat + (TAIL if T.last(i) and b == notes[-1][0] else 0)
            if T.inst == 'lute': T.put(x, harp(nn, max(0.5, d * 1.3), gain=0.5), i * T.slot + b * T.beat)
            else: T.put(x, horn(nn - 12, d * 0.97, gain=0.5), i * T.slot + b * T.beat)
    return x


def chords(T):
    x = T.new()
    for i, c in enumerate(T.prog):
        ch = TRIADS[c]; at = i * T.slot; d = T.slot + (TAIL if T.last(i) else 0.03)
        if T.inst == 'lute':  # a strum on every eighth: the rhythm doubles when this joins
            T.put(x, pad(list(ch), d, cut=1000, gain=0.25, a=0.05, r=0.4), at)
            for k in range(4): T.put(x, pluck(ch[k % 3] + 12, T.beat * 0.45, bright=2200, gain=0.14 if k % 2 else 0.2), at + k * T.beat / 2)
        elif T.inst == 'drum':  # a drone on the fifths under the chord
            T.put(x, pad([45, 52] + list(ch), d, cut=800, gain=0.4, a=0.1, r=0.5), at)
        else:
            for nn in ch: T.put(x, horn(nn, d, gain=0.22), at)
    return x


def drive(T):
    x = T.new()
    for i, c in enumerate(T.prog):
        r = TRIADS[c][0] - 12 if TRIADS[c][0] > 52 else TRIADS[c][0]; at = i * T.slot
        if T.last(i):
            T.put(x, bassnote(r + 12, T.slot + TAIL, gain=0.5), at)
        else:
            for k in range(4): T.put(x, bassnote(r + 12 + (12 if k == 3 else 0), T.beat * 0.45, gain=0.5), at + k * T.beat / 2)
        T.put(x, kick(0.8), at)
        if T.inst == 'drum':  # driving toms on every eighth
            for k in range(1, 4): T.put(x, hand_drum(40, 0.5 if k % 2 else 0.7), at + k * T.beat / 2)
        else:
            T.put(x, snare(0.45) if T.inst == 'horn' else tamb(0.4), at + T.beat)
        if i >= len(T.prog) - 2:  # the build into the beat: a roll that climbs
            for k in range(8): T.put(x, snare(0.08 + 0.03 * k) if T.inst != 'drum' else hand_drum(57, 0.25 + 0.08 * k, 0.2), at + k * T.slot / 8)
    return x


def top(T):
    x = T.new()
    if T.inst == 'drum':  # the Drum's tune arrives last, a shout on the fiddle
        for i, notes in enumerate(T.mel):
            for b, nn, beats in notes:
                d = beats * T.beat + (TAIL if T.last(i) and b == notes[-1][0] else 0)
                T.put(x, fiddle(nn, d * 0.95, gain=0.35), i * T.slot + b * T.beat)
        return x
    for i, c in enumerate(T.prog):  # the Lute's descant: a bell on each chord, an octave up
        ch = TRIADS[c]
        T.put(x, bell(ch[2] + 12, 1.6 + (TAIL if T.last(i) else 0), gain=0.3), i * T.slot)
        if i % 2: T.put(x, bell(ch[1] + 24, 0.8, gain=0.18), i * T.slot + T.beat)
    return x


# ---- the songs' parts: each in its own range, so any two or three fit together
def part_high(T):  # Song of Rest: a soft line a third above, held
    x = T.new()
    for i, c in enumerate(T.prog):
        if i % 2 and not T.last(i): continue
        nn = TRIADS[c][1] + 24; d = T.slot * 2 + (TAIL if T.last(i) else 0)
        T.put(x, flute(nn, d * 0.95, gain=0.4), i * T.slot)
    return x


def part_low(T):  # Dirge: a dark low line, root then fifth, bowed
    x = T.new()
    for i, c in enumerate(T.prog):
        ch = TRIADS[c]; nn = (ch[0] if i % 2 == 0 else ch[2] - 12) - 12
        T.put(x, fiddle(nn, (T.slot + (TAIL if T.last(i) else 0)) * 0.97, gain=0.4), i * T.slot)
    return x


def part_march(T):  # Marching Song: a snare march, no pitch
    x = T.new()
    for i in range(len(T.prog)):
        at = i * T.slot
        for k, g in ((0, .5), (1, .25), (1.5, .3), (2, .45), (3, .25), (3.25, .2), (3.5, .3)):
            T.put(x, snare(g), at + k * T.beat / 2)
    return x


def part_riff(T):  # Ballad of Blades: a sharp plucked riff in the middle
    x = T.new()
    for i, c in enumerate(T.prog):
        ch = TRIADS[c]
        for k, nn in enumerate((ch[0], ch[2], ch[0] + 12, ch[2])):
            T.put(x, pluck(nn, T.beat * 0.4, bright=3400, gain=0.3), i * T.slot + k * T.beat / 2)
    return x


PARTS = {'high': part_high, 'low': part_low, 'march': part_march, 'riff': part_riff}
OWN = {1: -23.0, 2: -27.0, 3: -26.0, 4: -29.0, 'part': -28.5}


def render(inst):
    T = Track(inst)
    L = {1: lead(T), 2: chords(T), 3: drive(T)}
    if inst != 'horn': L[4] = top(T)
    for k, fn in PARTS.items(): L[k] = fn(T)
    import pyloudnorm as pyln
    m = pyln.Meter(SR); st = lambda x: np.stack([x, x], 1)
    for k in L: L[k] = L[k] * 10 ** ((OWN[k if isinstance(k, int) else 'part'] - m.integrated_loudness(st(L[k]))) / 20)
    full = sum(L[k] for k in L if isinstance(k, int)) + L['high'] + L['march']  # the loudest it gets: every layer, two parts
    g = 10 ** ((-20.0 - m.integrated_loudness(st(full))) / 20)
    g = min(g, 0.89 / (np.abs(full).max() + 1e-9))
    for k in L:
        x = L[k] * g; f = int(0.3 * SR); x[-f:] *= np.linspace(1, 0, f); L[k] = x
    return T, L


def write_mono(path, x):
    pcm = (np.clip(x, -1, 1) * 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())


if __name__ == '__main__':
    reel = []
    for inst in INST:
        T, L = render(inst)
        for k, x in L.items():
            name = f'bard_{inst}_{k}'
            p = os.path.join(cg.WAV, f'music_{name}.wav'); write_mono(p, x); enc(p, os.path.join(cg.OUT, f'music_{name}.m4a'), 96)
        # the reel: the song as a player hears it, one more layer each round, then two songs' parts, then a missed beat
        lay = [k for k in L if isinstance(k, int)]
        for j in range(1, len(lay) + 1): reel.append(sum(L[k] for k in lay[:j])[: int(T.len * SR)])
        for pr in (('low',), ('low', 'high'), ('march', 'riff')): reel.append((sum(L[k] for k in lay) + sum(L[p] for p in pr))[: int(T.len * SR)])
        reel += [sum(L[k] for k in lay) + L['low'], np.zeros(int(1.2 * SR))]
        print(inst, T.len, 's,', len(lay), 'layers,', len(PARTS), 'parts')
    y = np.concatenate(reel); rp = os.path.join(cg.WAV, 'bard_reel.wav'); write_mono(rp, y)
    os.makedirs(os.path.join(cg.HERE, 'preview'), exist_ok=True)
    enc(rp, os.path.join(cg.HERE, 'preview', 'bard-song-music-reel.m4a'), 160)
    print('reel:', round(len(y) / SR), 's')
