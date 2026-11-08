# Contact sheet for the Ruinfall emblem and the app icon (#524): python3 art/ruinfall/sheet.py -> art/ruinfall/sheet.png
import base64, os, subprocess, tempfile
H = os.path.dirname(os.path.abspath(__file__)); RS = '/opt/homebrew/bin/rsvg-convert'
def png(svg, px):
    f = tempfile.mktemp(suffix='.png'); subprocess.run([RS, '-w', str(px), '-h', str(px), '-o', f, svg], check=True)
    return 'data:image/png;base64,' + base64.b64encode(open(f, 'rb').read()).decode()
em, old, new = os.path.join(H, 'emblem.svg'), os.path.join(H, '..', 'logo', 'icon.svg'), os.path.join(H, 'icon_ruinfall.svg')
W, Hh = 1200, 760
parts = [f'<rect width="{W}" height="{Hh}" fill="#1f1810"/>']
t = lambda x, y, s, size=20, c='#d8b060': parts.append(f'<text x="{x}" y="{y}" font-family="Georgia" font-size="{size}" fill="{c}">{s}</text>')
t(40, 50, 'The Ruinfall Saga emblem', 30)
x = 40
for px in (300, 120, 64, 32):
    parts.append(f'<image x="{x}" y="80" width="{px}" height="{px}" href="{png(em, px * 2)}"/>'); t(x, 410, f'{px} px', 16, '#9a8660'); x += px + 40
t(40, 470, 'App icon: today and Ruinfall', 30)
x = 40
for label, src in (('today', old), ('Ruinfall', new)):
    for px in (192, 72, 48, 32):
        parts.append(f'<image x="{x}" y="500" width="{px}" height="{px}" href="{png(src, px * 2)}"/>'); x += px + 24
    t(x - 420, 730, label, 16, '#9a8660'); x += 40
svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{Hh}">' + ''.join(parts) + '</svg>'
s = os.path.join(H, 'sheet.svg'); open(s, 'w').write(svg)
subprocess.run([RS, '-o', os.path.join(H, 'sheet.png'), s], check=True); os.remove(s)
print('sheet.png')
