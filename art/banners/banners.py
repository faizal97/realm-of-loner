# This week's banners (#541): each one a finished picture, never a bare scene. A game scene as the backdrop, figures and
# props in front, and the feature's own logo, each logo its own design. Run: python3 art/banners/banners.py
# It draws the game art it needs with art/banners/dump.js, composes each banner (960x400), writes the SVGs here, the
# game's copy in src/art_banners.js (ART.banner(key)) and a contact sheet, sheet.png, to look at before shipping.
# A banner whose week is over is deleted from BANNERS (tools/validate.js stops the build while one is unused).
import json, math, os, random, re, subprocess, sys, tempfile
H = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(H, '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'art', 'brand')); from lockup import word, letters, GOLD  # the game's face as outlines

W, HH = 960, 400

# ---------------------------------------------------------------- parts: the game's own art, drawn by the game's code
PARTS = {
    'shadow_court': ['story', 'shadow_court'], 'stormwind': ['scene', 'stormwind'], 'orgrimmar': ['scene', 'orgrimmar'],
    'goldshire': ['scene', 'goldshire'], 'collector': ['mob', 'defias_highwayman'],
    'a1': ['hero', {'race': 'human', 'cls': 'paladin', 'gender': 'm', 'skin': 1, 'hair': 2}],
    'a2': ['hero', {'race': 'nightelf', 'cls': 'druid', 'gender': 'f', 'skin': 2, 'hair': 1}],
    'a3': ['hero', {'race': 'dwarf', 'cls': 'hunter', 'gender': 'm', 'skin': 0, 'hair': 4}],
    'h1': ['hero', {'race': 'orc', 'cls': 'hunter', 'gender': 'm', 'skin': 1, 'hair': 0}],
    'h2': ['hero', {'race': 'troll', 'cls': 'mage', 'gender': 'f', 'skin': 2, 'hair': 3}],
    'h3': ['hero', {'race': 'tauren', 'cls': 'druid', 'gender': 'm', 'skin': 1, 'hair': 1}],
    'f1': ['hero', {'race': 'gnome', 'cls': 'rogue', 'gender': 'f', 'skin': 1, 'hair': 2}],
    'f2': ['hero', {'race': 'human', 'cls': 'mage', 'gender': 'm', 'skin': 2, 'hair': 4}],
}

def draw_parts():
    tmp = tempfile.mkdtemp(); spec = os.path.join(tmp, 'spec.json')
    json.dump([[k + '.svg', v[0], v[1]] for k, v in PARTS.items()], open(spec, 'w'))
    subprocess.run(['node', os.path.join(H, 'dump.js'), tmp, spec], check=True, stdout=subprocess.DEVNULL)
    out = {k: open(os.path.join(tmp, k + '.svg')).read() for k in PARTS}
    out['notes_logo'] = open(os.path.join(H, 'notes_logo.svg')).read()  # the pre-patch logo (art/ruinfall/prepatch_logo.py on main)
    return out

_n = [0]
def embed(svg, x, y, w, h, fit='xMidYMid slice', vb=None, extra=''):
    """another SVG placed in a box; its ids get a prefix so two drawings never share a gradient"""
    _n[0] += 1; p = f'b{_n[0]}_'
    inner = re.sub(r'^\s*<\?xml[^>]*>', '', svg).strip()
    m = re.match(r'<svg([^>]*)>(.*)</svg>\s*$', inner, re.S); attrs, body = m.group(1), m.group(2)
    vb = vb or re.search(r'viewBox="([^"]+)"', attrs).group(1)
    body = re.sub(r'id="([^"]+)"', lambda q: f'id="{p}{q.group(1)}"', body)
    body = re.sub(r'url\(#([^)]+)\)', lambda q: f'url(#{p}{q.group(1)})', body)
    body = re.sub(r'href="#([^"]+)"', lambda q: f'href="#{p}{q.group(1)}"', body)
    return f'<svg x="{x}" y="{y}" width="{w}" height="{h}" viewBox="{vb}" preserveAspectRatio="{fit}" overflow="visible"{extra}>{body}</svg>'

def figure(svg, cx, foot, h, flip=False):
    """a 128-box figure standing with its feet at (cx, foot), h tall"""
    g = embed(svg, -h / 2, -h * 0.97, h, h, 'xMidYMax meet')
    return f'<g transform="translate({cx},{foot}){" scale(-1,1)" if flip else ""}">{g}</g>'

def shade(id_, stops, x2=0, y2=1):
    s = ''.join(f'<stop offset="{o}" stop-color="{c}" stop-opacity="{a}"/>' for o, c, a in stops)
    return f'<linearGradient id="{id_}" x1="0" y1="0" x2="{x2}" y2="{y2}">{s}</linearGradient>'

def frame(defs, body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {HH}" width="{W}" height="{HH}"><defs>{defs}</defs>{body}</svg>'

# ---------------------------------------------------------------- The Notes Come Due: the pre-patch's teaser
def notes(P):
    rnd = random.Random(11)
    defs = (shade('nDark', [(0, '#1a0604', .15), (.55, '#1a0604', .35), (1, '#0a0302', .92)])
            + '<radialGradient id="nGlow" cx=".5" cy=".42" r=".6"><stop offset="0" stop-color="#ff9a3a" stop-opacity=".28"/><stop offset="1" stop-color="#ff9a3a" stop-opacity="0"/></radialGradient>'
            + shade('nSide', [(0, '#050101', .85), (.22, '#050101', 0), (.78, '#050101', 0), (1, '#050101', .85)], 1, 0)
            + shade('nPaper', [(0, '#f3e2b8', 1), (1, '#c9a66c', 1)]))
    body = embed(P['shadow_court'], 0, 0, W, HH, 'xMidYMid slice', vb='0 20 480 200')
    body += f'<rect width="{W}" height="{HH}" fill="#5a0a06" opacity=".28"/><rect width="{W}" height="{HH}" fill="url(#nGlow)"/>'
    body += f'<rect width="{W}" height="{HH}" fill="url(#nSide)"/><rect width="{W}" height="{HH}" fill="url(#nDark)"/>'
    # the notes: torn debt slips drifting down behind the logo, each with its lines of ink and a red seal
    for i in range(16):
        x, y, a, s = rnd.uniform(40, 920), rnd.uniform(-10, 300), rnd.uniform(-40, 40), rnd.uniform(.6, 1.15)
        if 330 < x < 630 and y < 260: continue
        lines = ''.join(f'<path d="M-15,{-8 + j * 6} H{rnd.uniform(4, 15):.0f}" stroke="#5a3418" stroke-width="1.6" opacity=".7"/>' for j in range(3))
        body += (f'<g transform="translate({x:.0f},{y:.0f}) rotate({a:.0f}) scale({s:.2f})" opacity="{rnd.uniform(.55, .95):.2f}">'
                 f'<path d="M-20,-14 L20,-14 L21,-4 L19,6 L20,14 L-20,14 L-21,4 L-19,-6 Z" fill="url(#nPaper)" stroke="#3a1c0a" stroke-width="1.5"/>{lines}'
                 f'<circle cx="12" cy="8" r="4" fill="#a8201a" stroke="#4a0806" stroke-width="1"/></g>')
    # two collectors closing in from the sides, ledger hands out
    body += figure(P['collector'], 132, 412, 330) + figure(P['collector'], 828, 412, 330, flip=True)
    body += embed(P['notes_logo'], 250, 0, 460, 237, 'xMidYMid meet')
    return frame(defs, body)

# ---------------------------------------------------------------- The Living Realm: a ribbon over the realm's skyline
def realm_logo(cx, top):
    """THE LIVING REALM carved on a forked ribbon; above it, the realm's rooftops with lit windows and three chat
    bubbles rising from them: a place where people talk"""
    rnd = random.Random(5); out = ''
    # rooftops: a strip of gables and a tower, windows lit
    roof, x = [], cx - 190
    while x < cx + 190:
        w = rnd.choice([26, 32, 38]); h = rnd.choice([22, 30, 38]) + (34 if abs(x + w / 2 - cx) < 22 else 0)
        roof.append((x, w, h)); x += w - 2
    sky = top + 92
    for (x, w, h) in roof:
        out += f'<path d="M{x},{sky} V{sky - h + 10} L{x + w / 2},{sky - h - 4} L{x + w},{sky - h + 10} V{sky} Z" fill="#1b1430" stroke="#0b0716" stroke-width="2"/>'
        for k in range(rnd.choice([1, 1, 2])):
            wx, wy = x + w / 2 - 3 + (k * 8 - 4 if k else 0), sky - h + 18 + k * 10
            if wy < sky - 6: out += f'<rect x="{wx:.0f}" y="{wy:.0f}" width="6" height="7" rx="1" fill="#ffcf6a"/>'
    # chat bubbles: three sizes, rising from left, middle and right
    for bx, by, r, dots in [(cx - 120, top + 22, 17, 3), (cx + 4, top - 6, 22, 3), (cx + 128, top + 18, 15, 2)]:
        out += (f'<g><path d="M{bx - r},{by} a{r},{r * .78} 0 1 1 {r * 2},0 a{r},{r * .78} 0 0 1 {-r * 1.2},{r * .7} l{-r * .55},{r * .5} l{r * .05},{-r * .62} '
                f'a{r},{r * .78} 0 0 1 {-r * .3},{-r * .58} Z" fill="#f6ecd2" stroke="#2a1c10" stroke-width="3"/>'
                + ''.join(f'<circle cx="{bx - (dots - 1) * 5 + i * 10}" cy="{by}" r="2.8" fill="#6a4a24"/>' for i in range(dots)) + '</g>')
    # the ribbon: a wide band with forked tails folding behind
    y0, y1 = sky - 4, sky + 70; a, b = cx - 250, cx + 250
    tail = lambda s: (f'<path d="M{cx + s * 230},{y0 + 18} L{cx + s * 300},{y0 + 22} L{cx + s * 278},{y0 + 47} L{cx + s * 300},{y1 + 10} L{cx + s * 230},{y1 + 6} Z" '
                      f'fill="#152a5c" stroke="#0a0f22" stroke-width="4" stroke-linejoin="round"/>'
                      f'<path d="M{cx + s * 230},{y1 + 6} L{cx + s * 250},{y1 - 4} L{cx + s * 250},{y1 + 6} Z" fill="#0a1430"/>')
    out += tail(-1) + tail(1)
    band = f'M{a},{y0 + 6} Q{cx},{y0 - 12} {b},{y0 + 6} L{b - 6},{y1 - 2} Q{cx},{y1 - 20} {a + 6},{y1 - 2} Z'
    out += f'<path d="{band}" fill="url(#rBlue)" stroke="#0a0f22" stroke-width="5" stroke-linejoin="round"/>'
    out += f'<path d="{band}" fill="none" stroke="#e0b450" stroke-width="2.2" stroke-linejoin="round" transform="translate(0,0)" opacity=".9"/>'
    # the words: THE small on the left of LIVING REALM, following the ribbon's curve a little
    th, thw = word('THE', 20, 0, 0, .1); mw = word('LIVING REALM', 46, 0, 0, .06)[1]
    tot = thw + 12 + mw; x0 = cx - tot / 2
    th, _ = word('THE', 20, x0, y0 + 46, .1); main, _ = word('LIVING REALM', 46, x0 + thw + 12, y0 + 54, .06)
    out += letters(th, 4, 'url(#rGold)', '#0a0f22') + letters(main, 6, 'url(#rGold)', '#0a0f22')
    return out

def realm(P, side):
    defs = (GOLD.format(id='rGold') + shade('rBlue', [(0, '#2a4c9a', 1), (.5, '#1b3577', 1), (1, '#10224f', 1)])
            + shade('rDusk', [(0, '#2a1650', .55), (.45, '#2a1650', .1), (1, '#0b0716', .9)])
            + '<radialGradient id="rWarm" cx=".5" cy=".9" r=".7"><stop offset="0" stop-color="#ffb04a" stop-opacity=".35"/><stop offset="1" stop-color="#ffb04a" stop-opacity="0"/></radialGradient>')
    body = embed(P['stormwind' if side == 'a' else 'orgrimmar'], 0, 0, W, HH, 'xMidYMid slice', vb='0 40 400 167')
    body += f'<rect width="{W}" height="{HH}" fill="url(#rDusk)"/><rect width="{W}" height="{HH}" fill="url(#rWarm)"/>'
    p = [P[side + '1'], P[side + '2'], P[side + '3']]
    # a group on each side of the square, talking: two left, one right turned to them
    body += figure(p[1], 118, 404, 230) + figure(p[0], 214, 412, 262) + figure(p[2], 812, 410, 252, flip=True)
    body += realm_logo(480, 50)
    return frame(defs, body)

# ---------------------------------------------------------------- The Faire: arched circus letters, dice and bunting
def die(x, y, s, rot, face):
    pips = {1: [(0, 0)], 2: [(-1, -1), (1, 1)], 3: [(-1, -1), (0, 0), (1, 1)], 4: [(-1, -1), (1, -1), (-1, 1), (1, 1)],
            5: [(-1, -1), (1, -1), (0, 0), (-1, 1), (1, 1)], 6: [(-1, -1), (1, -1), (-1, 0), (1, 0), (-1, 1), (1, 1)]}[face]
    d = s * .27
    return (f'<g transform="translate({x},{y}) rotate({rot})"><rect x="{-s / 2 + 4}" y="{-s / 2 + 6}" width="{s}" height="{s}" rx="{s * .2}" fill="#140a04" opacity=".55"/>'
            f'<rect x="{-s / 2}" y="{-s / 2}" width="{s}" height="{s}" rx="{s * .2}" fill="url(#fIvory)" stroke="#2a1608" stroke-width="3.5"/>'
            + ''.join(f'<circle cx="{px * d:.1f}" cy="{py * d:.1f}" r="{s * .085:.1f}" fill="#a8201a"/>' for px, py in pips) + '</g>')

def faire_logo(cx, base):
    out = ''
    # the tent peak behind the words: red and cream stripes fanning from a gold finial, a pennant on top
    for i in range(-5, 5):
        col = '#b8241c' if i % 2 else '#f2e2bc'
        out += f'<path d="M{cx},{base - 168} L{cx + i * 42},{base - 64} L{cx + (i + 1) * 42},{base - 64} Z" fill="{col}" stroke="#3a120a" stroke-width="2.5" stroke-linejoin="round"/>'
    out += ''.join(f'<path d="M{cx + i * 42},{base - 64} q21,22 42,0" fill="{"#b8241c" if i % 2 else "#f2e2bc"}" stroke="#3a120a" stroke-width="2.5"/>' for i in range(-5, 5))
    out += f'<path d="M{cx},{base - 168} V{base - 196}" stroke="#3a120a" stroke-width="4"/><path d="M{cx},{base - 196} l34,8 l-34,9 Z" fill="#e0b450" stroke="#3a120a" stroke-width="2.5" stroke-linejoin="round"/>'
    out += f'<circle cx="{cx}" cy="{base - 168}" r="7" fill="url(#fGold)" stroke="#3a120a" stroke-width="2.5"/>'
    # THE on a small gold plaque, then FAIRE in big letters along an arch, red and cream by turns, each one tipped to the curve
    pl, plw = word('THE', 22, 0, 0, .14); pl, _ = word('THE', 22, cx - plw / 2, base - 72, .14)
    out += f'<rect x="{cx - plw / 2 - 16}" y="{base - 96}" width="{plw + 32}" height="32" rx="6" fill="#2a1608" stroke="url(#fGold)" stroke-width="3"/>' + letters(pl, 3, 'url(#fGold)', '#140a04')
    txt, size, R = 'FAIRE', 88, 520
    ws = [word(ch, size, 0, 0)[1] for ch in txt]; gap = 8; tot = sum(ws) + gap * (len(ws) - 1); x = -tot / 2
    for i, (ch, w) in enumerate(zip(txt, ws)):
        mid = x + w / 2; ang = math.degrees(mid / R); yo = R - math.sqrt(R * R - mid * mid)
        d, _ = word(ch, size, -w / 2, 0)
        fill = 'url(#fRed)' if i % 2 == 0 else 'url(#fIvory)'
        out += f'<g transform="translate({cx + mid:.1f},{base + 20 + yo:.1f}) rotate({ang:.1f})">{letters(d, 8, fill, "#2a0c06")}</g>'
        x += w + gap
    out += die(cx - tot / 2 - 58, base - 10, 50, -18, 5) + die(cx + tot / 2 + 58, base - 22, 44, 22, 3)
    return out

def faire(P):
    rnd = random.Random(3)
    defs = (GOLD.format(id='fGold') + shade('fRed', [(0, '#ff6a4a', 1), (.5, '#c8281c', 1), (1, '#7a120c', 1)])
            + shade('fIvory', [(0, '#fffaf0', 1), (.55, '#f2e2bc', 1), (1, '#c8aa78', 1)])
            + shade('fEve', [(0, '#3a1a40', .5), (.5, '#3a1a40', .05), (1, '#120806', .9)]))
    body = embed(P['goldshire'], 0, 0, W, HH, 'xMidYMid slice', vb='0 50 400 167')
    body += f'<rect width="{W}" height="{HH}" fill="url(#fEve)"/>'
    # bunting: two strings of flags across the top, sagging
    for row, (y, sag) in enumerate([(18, 34), (4, 22)]):
        pts = [(x, y + sag * math.sin(math.pi * x / W)) for x in range(0, W + 1, 40)]
        body += '<path d="M' + ' L'.join(f'{x},{yy:.0f}' for x, yy in pts) + '" fill="none" stroke="#2a1608" stroke-width="2"/>'
        for i, (x, yy) in enumerate(pts[:-1]):
            c = ['#b8241c', '#f2e2bc', '#e0b450', '#2a5aa0'][(i + row) % 4]
            body += f'<path d="M{x + 6},{yy + 1} L{x + 34},{yy + 2} L{x + 20},{yy + 30} Z" fill="{c}" stroke="#2a1608" stroke-width="1.5" stroke-linejoin="round"/>'
    # lanterns hung from the strings
    for x in [150, 810]:
        yy = 18 + 34 * math.sin(math.pi * x / W)
        body += (f'<path d="M{x},{yy} V{yy + 18}" stroke="#2a1608" stroke-width="2"/><circle cx="{x}" cy="{yy + 34}" r="28" fill="#ffb04a" opacity=".25"/>'
                 f'<rect x="{x - 10}" y="{yy + 18}" width="20" height="30" rx="5" fill="#ffcf6a" stroke="#3a1a08" stroke-width="2.5"/>')
    # players come to play: one on each side
    body += figure(P['f1'], 128, 408, 250) + figure(P['f2'], 842, 410, 262, flip=True)
    # the table in front, dice cups on it
    body += '<ellipse cx="480" cy="398" rx="250" ry="40" fill="#5a3418" stroke="#2a1608" stroke-width="4"/><ellipse cx="480" cy="392" rx="236" ry="32" fill="#7a4a24"/>'
    for x, r in [(330, -8), (630, 10)]:
        body += f'<g transform="translate({x},378) rotate({r})"><path d="M-18,-30 L18,-30 L22,10 L-22,10 Z" fill="#4a2a14" stroke="#1a0c04" stroke-width="3"/><path d="M-18,-22 H18" stroke="#e0b450" stroke-width="3"/></g>'
    body += die(420, 384, 22, 12, 6) + die(548, 386, 22, -20, 2)
    body += faire_logo(480, 236)
    return frame(defs, body)

BANNERS = {'notes_come_due': notes, 'living_realm': lambda P: realm(P, 'a'), 'living_realm_h': lambda P: realm(P, 'h'), 'faire': faire}

if __name__ == '__main__':
    P = draw_parts(); out = {}
    for k, fn in BANNERS.items():
        svg = fn(P); open(os.path.join(H, k + '.svg'), 'w').write(svg); out[k] = re.sub(r'>\s+<', '><', svg)
    open(os.path.join(ROOT, 'src', 'art_banners.js'), 'w').write(
        '// Generated by art/banners/banners.py; do not edit by hand. This week\'s banners (#541): ART.banner(key).\n'
        '(function (root) { const A = root.ART = root.ART || {}; const B = ' + json.dumps(out) + ';\n'
        '  A.banner = (k) => B[k] || \'\'; A.bannerKeys = Object.keys(B); })(typeof window !== \'undefined\' ? window : globalThis);\n')
    # contact sheet at phone size (each banner as wide as a 375 px screen's sheet)
    tmp = tempfile.mkdtemp(); pngs = []
    for k in BANNERS:
        f = os.path.join(tmp, k + '.png'); subprocess.run(['rsvg-convert', '-w', '686', os.path.join(H, k + '.svg'), '-o', f], check=True); pngs.append(f)
    from PIL import Image
    ims = [Image.open(f) for f in pngs]; sheet = Image.new('RGB', (686 + 32, sum(i.height + 16 for i in ims) + 16), '#17120c'); y = 16
    for i in ims: sheet.paste(i, (16, y)); y += i.height + 16
    sheet.save(os.path.join(H, 'sheet.png'))
    print('banners:', ', '.join(f'{k} {round(len(v) / 1024)} KB' for k, v in out.items()))
