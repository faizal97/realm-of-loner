# The Ruinfall Saga app icon, concept "the lantern before the broken coin" (#524): the lit lantern (you) hangs in front
# of the Ledger's coin, split by a burning crack. Built from art/logo/icon.svg's sky, town and lantern.
import os
H = os.path.dirname(os.path.abspath(__file__))
s = open(os.path.join(H, '..', 'logo', 'icon.svg')).read()
head = s[:s.index('  <!-- the ring -->')]
lantern = s[s.index('  <!-- the lantern -->'):]
head = head.replace('<circle cx="96" cy="100" r="60" fill="url(#glow)"/>', '')  # the coin is the light now
cx, cy, r = 96, 92, 62
crack = [(37, 84), (54, 78), (58, 90), (80, 86), (108, 98), (124, 96), (130, 110), (153, 113)]
cs = ' '.join(f'{x},{y}' for x, y in crack)
L = f'M{cs} L192,113 L192,192 L0,192 L0,84 Z'; R = f'M{cs} L192,113 L192,0 L0,0 L0,84 Z'
coin = f'''<circle cx="{cx}" cy="{cy}" r="{r + 4}" fill="#140f09"/>
      <circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#rcRim)"/>
      <circle cx="{cx}" cy="{cy}" r="{r - 8}" fill="url(#rcFace)" stroke="#6a4416" stroke-width="2"/>
      <circle cx="{cx}" cy="{cy}" r="{r - 16}" fill="none" stroke="#c79438" stroke-width="2.4" stroke-dasharray="3 5" opacity=".7"/>'''
out = head + f'''  <defs>
    <linearGradient id="rcRim" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="#fce38e"/><stop offset=".45" stop-color="#e0b04a"/><stop offset="1" stop-color="#8a5a1c"/></linearGradient>
    <radialGradient id="rcFace" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#a8742a"/><stop offset=".6" stop-color="#6e4515"/><stop offset="1" stop-color="#3e260c"/></radialGradient>
    <filter id="rcBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
    <filter id="rcSoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.1"/></filter>
    <clipPath id="rcL"><path d="{L}"/></clipPath><clipPath id="rcR"><path d="{R}"/></clipPath>
  </defs>
  <!-- the Ledger's coin, broken (Ruinfall, #524) -->
  <polyline points="{cs}" fill="none" stroke="#ff7a1a" stroke-width="22" stroke-linejoin="round" filter="url(#rcBlur)"/>
  <g transform="translate(-2.6,4.4)"><g clip-path="url(#rcL)">{coin}</g></g>
  <g transform="translate(2.6,-4.4)"><g clip-path="url(#rcR)">{coin}</g></g>
  <polyline points="{cs}" fill="none" stroke="#ff7a1a" stroke-width="7" stroke-linejoin="round" filter="url(#rcSoft)"/>
  <polyline points="{cs}" fill="none" stroke="#ffe3a0" stroke-width="2.6" stroke-linejoin="round" filter="url(#rcSoft)"/>
  <g stroke="#140f09" stroke-width="2" stroke-linejoin="round"><path d="M152,124 L162,122 L157,133 Z" fill="#e0b04a"/><path d="M162,138 L169,141 L161,148 Z" fill="#a0722a"/></g>
''' + lantern
out = out.replace('Realm of Loner app icon:', 'Realm of Loner app icon, Ruinfall Saga edition (#524), the lantern before the broken coin:')
open(os.path.join(H, 'icon_ruinfall.svg'), 'w').write(out)
