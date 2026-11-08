# The Ruinfall Saga edition of the app icon (#524): art/logo/icon.svg with its ring cracked, fire in the break and two
# pieces falling. Writes icon_ruinfall.svg; art/logo/render.js turns the chosen icon into every launcher size.
import math, os
H = os.path.dirname(os.path.abspath(__file__))
s = open(os.path.join(H, '..', 'logo', 'icon.svg')).read()
cx, cy = 96, 94
def P(r, deg):
    a = math.radians(deg); return (cx + r * math.cos(a), cy - r * math.sin(a))
zig = [(40, 44), (46, 42.5), (50, 45.5), (55, 43), (60, 45.5), (68, 43.5)]  # (radius, degrees): mostly radial
w = 9
left = [P(r, d) for r, d in zig]; right = [P(r, d + w) for r, d in zig][::-1]
poly = " ".join(f"{x:.1f},{y:.1f}" for x, y in left + right)
mid = " ".join(f"{x:.1f},{y:.1f}" for x, y in [P(r, d + w / 2) for r, d in zig])
ring_old = s[s.index('  <!-- the ring -->'):s.index('  <!-- the lantern -->')]
ring_new = f'''  <!-- the ring, cracked (Ruinfall, #524): fire shows through the break, two pieces fall -->
  <defs>
    <mask id="rfcut"><rect x="0" y="0" width="192" height="192" fill="#fff"/><polygon points="{poly}" fill="#000"/></mask>
    <filter id="rfblur" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="4.5"/></filter>
  </defs>
  <polyline points="{mid}" fill="none" stroke="#ff7a1a" stroke-width="18" stroke-linejoin="round" filter="url(#rfblur)"/>
  <g mask="url(#rfcut)">
{ring_old.replace('  <!-- the ring -->', '').rstrip()}
  </g>
  <polyline points="{mid}" fill="none" stroke="#ff8a2a" stroke-width="5" stroke-linejoin="round"/>
  <polyline points="{mid}" fill="none" stroke="#ffe3a0" stroke-width="2" stroke-linejoin="round"/>
  <path d="M150,66 L158,64 L154,74 Z" fill="#e6b450" stroke="#140f09" stroke-width="2" stroke-linejoin="round"/>
  <path d="M159,80 L165,82 L159,88 Z" fill="#a0722a" stroke="#140f09" stroke-width="1.8" stroke-linejoin="round"/>
'''
s = s.replace(ring_old, ring_new).replace('Realm of Loner app icon:', 'Realm of Loner app icon, Ruinfall Saga edition (#524):')
open(os.path.join(H, 'icon_ruinfall.svg'), 'w').write(s)
