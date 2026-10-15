"""Realm of Loner: the Bard's song music (#257). While a Bard sings, the song is the music: one phrase in the
instrument's voice, as long as the song (Lute 12 s, Drum 8 s, Horn 16 s), played from the start on every tap.

Four bars, A major: A, F#m, D, then E. The E bar is the beat: it starts about a second before the beat window opens and
ends on a rising run that only resolves (back to A, bar 1) when the player taps. A missed beat leaves the music hanging
on E as it rings out. Each layer is its own file (music_bard_<instrument>_<n>); the game adds one per verse:
  1 the melody  2 the chords  3 bass and percussion  4 a bell counter-line (Lute and Drum, which have 3 verses)
Each layer is set to its own loudness (the melody leads), then all by one gain so the full mix sits at -20 LUFS.

Usage: ~/.venvs/audio/bin/python compose_bard.py   (writes out/ and a listening reel to preview/)
"""
import os
import numpy as np
import compose_game as cg
from compose_game import SR, t_, midi, env, lp, harp, pluck, bassnote, pad, flute, fiddle, tamb, kick, noise, write_wav, enc
from compose_themes import horn, bell

TAIL = 2.0  # the last chord rings out this long after the phrase, when no tap comes
CHORDS = [(57, 61, 64), (54, 57, 61), (50, 54, 57), (52, 56, 59)]  # A, F#m, D, E
ROOTS = [45, 42, 38, 40]
# the melody: (bar, beat, midi, beats). Bar 4 holds B, then runs C# D E G# up to the tap.
MEL = [(0, 0, 76, 1), (0, 1, 73, .5), (0, 1.5, 74, .5), (0, 2, 76, 1), (0, 3, 81, 1),
       (1, 0, 78, 1.5), (1, 1.5, 76, .5), (1, 2, 73, 1), (1, 3, 69, 1),
       (2, 0, 74, 1), (2, 1, 78, 1), (2, 2, 81, 1), (2, 3, 78, .5), (2, 3.5, 76, .5),
       (3, 0, 71, 2), (3, 2, 73, .5), (3, 2.5, 74, .5), (3, 3, 76, .5), (3, 3.5, 80, .5)]
COUNTER = [(0, 0, 88), (0, 2, 85), (1, 0, 85), (1, 2, 81), (2, 0, 86), (2, 2, 90), (3, 0, 83)]
RHYTHM = {'lute': 12, 'drum': 8, 'horn': 16}  # src/engine.js E.RHYTHM: song length in seconds = 4 bars


def hand_drum(note, gain=1.0):
    t = t_(0.4); f = midi(note) * (1 + 0.35 * np.exp(-t * 40))
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 10)
    return (body + lp(noise(0.4), 2400) * np.exp(-t * 60) * 0.45) * gain


def layers(inst):
    bar = RHYTHM[inst] / 4; beat = bar / 4; n = int((RHYTHM[inst] + TAIL) * SR)
    L = [np.zeros(n) for _ in range(4 if inst != 'horn' else 3)]

    def put(i, sig, at):
        s = int(at * SR); e = min(n, s + len(sig)); L[i][s:e] += sig[: e - s]

    for b, bt, note, beats in MEL:  # 1: the melody
        at = b * bar + bt * beat; d = beats * beat + (TAIL if b == 3 and bt == 0 else 0)
        if inst == 'lute': put(0, harp(note, max(0.9, d * 1.2), gain=0.5), at)
        elif inst == 'drum': put(0, fiddle(note, d * 0.95, gain=0.32), at)
        else: put(0, horn(note - 12, d * 0.97, gain=0.5), at)
    for b, ch in enumerate(CHORDS):  # 2: the chords (the E chord holds into the tail)
        d = bar + (TAIL if b == 3 else 0.05)
        if inst == 'lute':
            put(1, pad(list(ch), d, cut=1100, gain=0.35, a=0.3, r=0.6), b * bar)
            for k in range(4): put(1, pluck(ch[k % 3] + 12, beat * 0.9, bright=1800, gain=0.12), b * bar + k * beat)
        elif inst == 'drum': put(1, pad(list(ch), d, cut=900, gain=0.4, a=0.2, r=0.5), b * bar)
        else:
            for nn in ch: put(1, horn(nn, d, gain=0.22), b * bar)
    for b, r in enumerate(ROOTS):  # 3: bass and percussion
        for k in ((0, 2) if b < 3 else (0,)):
            put(2, bassnote(r + 12, beat * (2 if b < 3 else 4 + TAIL / beat) * 0.9, gain=0.5), b * bar + k * beat)
        for k in range(4):
            if inst == 'horn': put(2, kick(0.7 if k == 0 else 0.35), b * bar + k * beat)
            else:
                if k in (1, 3): put(2, tamb(0.35), b * bar + k * beat)
        if b == 3:  # the beat bar: a roll that climbs to the tap
            for k in range(8 if inst != 'horn' else 6):
                at = b * bar + 2 * beat + k * (2 * beat / (8 if inst != 'horn' else 6))
                put(2, tamb(0.15 + 0.04 * k) if inst != 'horn' else kick(0.2 + 0.06 * k), at)
    if inst == 'drum':  # the Drum's own voice leads under the melody: a hand-drum groove in layer 1
        for b in range(4):
            for k, (nn, g) in enumerate(((45, 1), (57, .5), (45, .7), (57, .6))):
                put(0, hand_drum(nn, g * 0.9), b * bar + k * beat)
            put(0, hand_drum(57, 0.4), b * bar + 3.5 * beat)
    if len(L) > 3:  # 4: a bell counter-line
        for b, bt, note in COUNTER:
            put(3, bell(note - 12, 2.0 if b < 3 else 2.0 + TAIL, gain=0.35), b * bar + bt * beat)
    for x in L:  # a short fade at the very end only
        f = int(0.3 * SR); x[-f:] *= np.linspace(1, 0, f)
    return L


def level(L, target=-20.0):
    """each layer to its own loudness first (the melody leads, the rest sit under it), then the full mix to target"""
    import pyloudnorm as pyln
    m = pyln.Meter(SR); st = lambda x: np.stack([x, x], 1)
    own = [-23.0, -27.0, -27.5, -30.0][: len(L)]
    L = [x * 10 ** ((o - m.integrated_loudness(st(x))) / 20) for x, o in zip(L, own)]
    mix = sum(L); g = 10 ** ((target - m.integrated_loudness(st(mix))) / 20)
    peak = np.abs(mix).max() * g
    if peak > 0.89: g *= 0.89 / peak
    return [x * g for x in L]

if __name__ == '__main__':
    reel = []
    for inst in RHYTHM:
        L = level(layers(inst))
        for i, x in enumerate(L, 1):
            name = f'bard_{inst}_{i}'
            p = os.path.join(cg.WAV, f'music_{name}.wav'); write_wav(p, x); enc(p, os.path.join(cg.OUT, f'music_{name}.m4a'), 128)
        # the reel plays the song as a player hears it: one more layer each time round, then the last one left hanging
        song = RHYTHM[inst]
        for k in range(1, len(L) + 1):
            mix = sum(L[:k]); reel.append(mix[: int(song * SR)])
        reel += [sum(L), np.zeros(int(1.2 * SR))]
        print(inst, song, 's,', len(L), 'layers')
    y = np.concatenate(reel); rp = os.path.join(cg.WAV, 'bard_reel.wav'); write_wav(rp, np.stack([y, y], 1))
    os.makedirs(os.path.join(cg.HERE, 'preview'), exist_ok=True)
    enc(rp, os.path.join(cg.HERE, 'preview', 'bard-song-music-reel.m4a'), 160)
    print('reel:', round(len(y) / SR), 's')
