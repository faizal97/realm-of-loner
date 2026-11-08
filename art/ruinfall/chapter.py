# A chapter's logo (#524, saga decision 13): the same plate, emblem and crack as the saga wordmark, with the chapter's
# own name and finish. Example: python3 art/ruinfall/chapter.py 1  ->  art/ruinfall/chapter1.svg (not in the game yet)
import base64, json, os, re, sys
H = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(H, '..', '..')
sys.path.insert(0, os.path.join(H, '..', 'brand')); from lockup import word, centred  # the game's face as outlines (art/brand/lockup.py)

CH = {  # each chapter's finish: (light, mid, dark band, low, deep) and its lines
    1: dict(lines=[('ASHEN', 104, 0.05), ('CORONATION', 60, 0.08)], sub='THE RUINFALL SAGA  ·  CHAPTER ONE',
            metal=('#f4f1ea', '#c9c2b6', '#4b433c', '#a39a8e', '#3b332c'), ash=True),
}
n = int(sys.argv[1]) if len(sys.argv) > 1 else 1; C = CH[n]
W, Hh = 640, 330
mt = C['metal']
r1, r1w = word('REALM', 40, 0, 0, 0.08); of_, ofw = word('OF', 22, 0, 0, 0.06); r2, r2w = word('LONER', 40, 0, 0, 0.08)
gap = 10; tot = r1w + gap + ofw + gap + r2w; nx = (W - tot) / 2; px0, px1 = nx - 34, nx + tot + 34
r1, _ = word('REALM', 40, nx, 56, 0.08); of_, _ = word('OF', 22, nx + r1w + gap, 56, 0.06); r2, _ = word('LONER', 40, nx + r1w + gap + ofw + gap, 56, 0.08)
(t1, s1, k1), (t2, s2, k2) = C['lines']
_, w1 = word(t1, s1, 0, 0, k1); l1, _ = word(t1, s1, (W - w1) / 2, 218, k1); l2, _ = centred(t2, s2, 272, k2, W)
the, _ = word('THE', 22, (W - w1) / 2 - 44, 150, 0.3)
sub, sw = centred(C['sub'], 15, 306, 0.22, W)
crack = [(301, 143), (291, 166), (306, 180), (281, 202), (294, 215), (275, 240), (286, 256), (270, 276)]
cs = ' '.join(f'{x},{y}' for x, y in crack)
L = f'M{cs} L270,{Hh} L0,{Hh} L0,0 L301,0 Z'; R = f'M{cs} L270,{Hh} L{W},{Hh} L{W},0 L301,0 Z'
def letters(d, sw_, fill='url(#chMetal)'):
    return (f'<path d="{d}" fill="#140f09" stroke="#140f09" stroke-width="{sw_}" stroke-linejoin="round" transform="translate(0,4)"/>'
            f'<path d="{d}" fill="none" stroke="#140f09" stroke-width="{sw_}" stroke-linejoin="round"/><path d="{d}" fill="{fill}"/>'
            f'<path d="{d}" fill="none" stroke="#ffffff" stroke-width="1" opacity=".45" transform="translate(0,-1)"/>')
gold = '<linearGradient id="chGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1b8"/><stop offset=".42" stop-color="#f0c45a"/><stop offset=".5" stop-color="#9a6420"/><stop offset=".62" stop-color="#d9a744"/><stop offset="1" stop-color="#7a4c16"/></linearGradient>'
metal = f'<linearGradient id="chMetal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{mt[0]}"/><stop offset=".42" stop-color="{mt[1]}"/><stop offset=".5" stop-color="{mt[2]}"/><stop offset=".62" stop-color="{mt[3]}"/><stop offset="1" stop-color="{mt[4]}"/></linearGradient>'
em = json.loads(re.search(r'ART\.emblem = (".*?");', open(os.path.join(ROOT, 'src', 'art_ruinfall.js')).read()).group(1))
em_inner = re.sub(r'^<svg[^>]*>|</svg>$', '', em)
ash = ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}" opacity="{o}"/>' for x, y, r, c, o in [
    (120, 120, 1.6, '#cfc8bc', .7), (520, 110, 1.2, '#cfc8bc', .6), (90, 230, 1.4, '#ff9a4a', .8), (560, 240, 1.8, '#cfc8bc', .5),
    (180, 300, 1.2, '#ff9a4a', .7), (470, 296, 1.3, '#cfc8bc', .6), (600, 170, 1.1, '#ff9a4a', .7), (40, 170, 1.2, '#cfc8bc', .6)]) if C.get('ash') else ''
plate = (f'<path d="M{px0},16 L{px1},16 L{px1 + 16},44 L{px1},72 L{px0},72 L{px0 - 16},44 Z" fill="#241a10" stroke="#140f09" stroke-width="6" stroke-linejoin="round"/>'
         f'<path d="M{px0},16 L{px1},16 L{px1 + 16},44 L{px1},72 L{px0},72 L{px0 - 16},44 Z" fill="none" stroke="#d9a744" stroke-width="2.4" stroke-linejoin="round"/>')
body = letters(l1, 9) + letters(l2, 7)
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{Hh}" viewBox="0 0 {W} {Hh}">
  <defs>{gold}{metal}
    <filter id="chBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
    <filter id="chSoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.4"/></filter>
    <clipPath id="chL"><path d="{L}"/></clipPath><clipPath id="chR"><path d="{R}"/></clipPath></defs>
  {ash}{plate}{letters(r1, 5, 'url(#chGold)')}{letters(of_, 4, 'url(#chGold)')}{letters(r2, 5, 'url(#chGold)')}
  <g transform="translate({W / 2 - 128 * .4},{108 - 118 * .4}) scale(.4)">{em_inner}</g>
  <polyline points="{cs}" fill="none" stroke="#ff7a1a" stroke-width="20" stroke-linejoin="round" filter="url(#chBlur)"/>
  <g transform="translate(-4,-1.2)"><g clip-path="url(#chL)">{body}</g></g>
  <g transform="translate(4,1.2)"><g clip-path="url(#chR)">{body}</g></g>
  <polyline points="{cs}" fill="none" stroke="#ff7a1a" stroke-width="6" stroke-linejoin="round" filter="url(#chSoft)"/>
  <polyline points="{cs}" fill="none" stroke="#ffe3a0" stroke-width="2.2" stroke-linejoin="round" filter="url(#chSoft)"/>
  {letters(sub, 4, 'url(#chGold)')}{letters(the, 5)}
</svg>
'''
open(os.path.join(H, f'chapter{n}.svg'), 'w').write(svg); print(f'chapter{n}.svg')
