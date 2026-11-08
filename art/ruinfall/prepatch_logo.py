# The pre-patch logo, The Notes Come Due: the name written in warm ink on a torn debt note, a claw wax seal, and a red
# PRE-PATCH stamp across it, so nobody reads it as the saga's own title. Writes art/ruinfall/prepatch.svg (640x330).
import os, sys, random
H = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(H, '..', 'brand')); from lockup import word, centred  # the game's face as outlines

W, Hh = 640, 330
rnd = random.Random(7)
# the note: a parchment sheet with a torn top and bottom edge, tilted a little
x0, x1, y0, y1 = 70, 570, 22, 262
top = ' '.join(f'L{x},{y0 + rnd.uniform(-7, 5):.1f}' for x in range(x0 + 14, x1, 14))
bot = ' '.join(f'L{x},{y1 + rnd.uniform(-5, 7):.1f}' for x in range(x1 - 14, x0, -14))
note = f'M{x0},{y0} {top} L{x1},{y0} L{x1 + 4},{y1} {bot} L{x0 - 3},{y1} Z'
l1, _ = centred('THE NOTES', 38, 82, 0.18, W)
l2, _ = centred('COME DUE', 78, 162, 0.04, W)
sub, sw = centred('THE RUINFALL SAGA', 16, 312, 0.3, W)
st, stw = word('PRE-PATCH', 40, 0, 0, 0.12)
scribble = ''.join(f'<path d="M{x},{y} q12,-4 24,0 t24,0 t24,0" fill="none" stroke="#7a4a20" stroke-width="1.6" opacity=".35"/>'
                   for x, y in [(96, 238), (420, 236), (300, 244), (110, 250)])
def ink(d, sw_):  # warm ink: a dark letter with an ember edge, as if it were still warm
    return (f'<path d="{d}" fill="none" stroke="#ff8a2a" stroke-width="{sw_ + 5}" stroke-linejoin="round" opacity=".35" filter="url(#ppGlow)"/>'
            f'<path d="{d}" fill="none" stroke="#3a1a08" stroke-width="{sw_}" stroke-linejoin="round"/>'
            f'<path d="{d}" fill="url(#ppInk)"/>')
def gold(d, sw_):
    return (f'<path d="{d}" fill="#140f09" stroke="#140f09" stroke-width="{sw_}" stroke-linejoin="round" transform="translate(0,3)"/>'
            f'<path d="{d}" fill="url(#ppGold)" stroke="#140f09" stroke-width="{sw_ * .2}" stroke-linejoin="round"/>')
seal = '''<g transform="translate(528,226) scale(.8)">
    <path d="M-30,-4 Q-32,-28 -6,-31 Q22,-34 30,-10 Q36,14 12,28 Q-14,36 -28,16 Q-36,8 -30,-4 Z" fill="#a8141a" stroke="#3a0608" stroke-width="3"/>
    <circle r="19" fill="#c8242a" stroke="#6a0c10" stroke-width="2"/>
    <path d="M-9,-11 L-4,11 M0,-13 L4,11 M9,-11 L11,9" stroke="#6a0c10" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M-12,-14 Q-4,-20 6,-17" stroke="#ff8a8a" stroke-width="2" fill="none" opacity=".6"/></g>'''
pad = 14; bw, bh = stw + pad * 2, 58
stamp = f'''<g transform="translate(300,220) rotate(-6)" opacity=".95">
    <rect x="{-bw / 2}" y="{-bh / 2}" width="{bw}" height="{bh}" rx="4" fill="#fff4e0" fill-opacity=".25" stroke="#d01c1c" stroke-width="4"/>
    <rect x="{-bw / 2 + 5}" y="{-bh / 2 + 5}" width="{bw - 10}" height="{bh - 10}" rx="2" fill="none" stroke="#d01c1c" stroke-width="1.6"/>
    <path d="{st}" transform="translate({-stw / 2},14)" fill="#e0201c" stroke="#7a0a0a" stroke-width="1"/></g>'''
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{Hh}" viewBox="0 0 {W} {Hh}">
  <defs>
    <linearGradient id="ppPaper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6e6c0"/><stop offset=".55" stop-color="#e8d2a0"/><stop offset="1" stop-color="#c8a870"/></linearGradient>
    <linearGradient id="ppInk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1206"/><stop offset=".6" stop-color="#4a2008"/><stop offset="1" stop-color="#a8400c"/></linearGradient>
    <linearGradient id="ppGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1b8"/><stop offset=".45" stop-color="#f0c45a"/><stop offset=".55" stop-color="#9a6420"/><stop offset="1" stop-color="#d9a744"/></linearGradient>
    <radialGradient id="ppBurn" cx=".5" cy=".5" r=".6"><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#5a2a08" stop-opacity=".55"/></radialGradient>
    <filter id="ppGlow" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
    <filter id="ppHalo" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14"/></filter>
  </defs>
  <path d="{note}" fill="#ff7a1a" opacity=".22" filter="url(#ppHalo)"/>
  <g transform="rotate(-2.5 320 140)">
    <path d="{note}" fill="#140f09" transform="translate(0,6)"/>
    <path d="{note}" fill="url(#ppPaper)" stroke="#140f09" stroke-width="4" stroke-linejoin="round"/>
    <path d="{note}" fill="url(#ppBurn)"/>
    <path d="M{x0 + 30},126 L{x1 - 30},126" stroke="#7a4a20" stroke-width="1.4" opacity=".4"/>
    {scribble}
    {ink(l1, 3)}{ink(l2, 4)}
    {seal}
  </g>
  {stamp}
  {gold(sub, 3)}
</svg>
'''
open(os.path.join(H, 'prepatch.svg'), 'w').write(svg); print('prepatch.svg')
