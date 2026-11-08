# Guild crests (#525): each of the realm's guilds has its own crest, drawn from its name (Pumpkin Patrol a pumpkin, Lions
# Pride a lion …). Accord guilds carry a heater shield, Krugar guilds a round hide shield. A guild missing here gets the
# lantern on its faction's shield (content-proof). Writes src/art_crests.js (ART.crests[name], ART.crest(name, faction)).
# python3 art/brand/crests.py [--sheet]   (the sheet: art/brand/crests_sheet.png)
import os, sys, json, re, subprocess, base64
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lockup import GOLD, ROOT
H = os.path.dirname(os.path.abspath(__file__)); INK = '#120c08'; J = ' stroke-linejoin="round" stroke-linecap="round"'
S = lambda w=3: f'stroke="{INK}" stroke-width="{w}"{J}'

HEATER = 'M10,10 L110,10 L110,62 Q110,112 60,132 Q10,112 10,62 Z'
ROUND = 'M60,8 Q74,16 88,12 Q96,26 110,32 Q106,48 114,62 Q104,76 108,92 Q92,98 86,114 Q72,110 60,124 Q48,110 34,114 Q28,98 12,92 Q16,76 6,62 Q14,48 10,32 Q24,26 32,12 Q46,16 60,8 Z'

# name: (faction, field colours (two), division, charge svg (centred near 60,66))
def lantern(c='#ffd070'):
    return (f'<path d="M48,44 L72,44 L76,52 L76,88 L44,88 L44,52 Z" fill="#2a1a10" {S()}/><path d="M50,54 L70,54 L70,84 L50,84 Z" fill="{c}"/>'
            f'<path d="M54,36 Q60,28 66,36" fill="none" {S(4)}/><path d="M60,62 Q66,70 60,78 Q54,70 60,62 Z" fill="#ff8a2a"/>')
CH = {
  'Brackenford Legends': ('alliance', ('#2a5a2a', '#1a3a5a'), 'fess',  # a bracken frond over the ford's water
      f'<path d="M60,94 Q58,64 62,30" fill="none" {S(4)}/><path d="M60,94 Q58,64 62,30" fill="none" stroke="#8ac04a" stroke-width="2"/>'
      + ''.join(f'<path d="M{60 + (1 if i % 2 else -1)},{88 - i * 8} Q{60 + (22 - i * 2) * (1 if i % 2 else -1)},{80 - i * 8} {60 + (26 - i * 2.4) * (1 if i % 2 else -1)},{86 - i * 8}" fill="none" stroke="#8ac04a" stroke-width="5" stroke-linecap="round"/>' for i in range(7))
      + '<path d="M20,104 q10,-5 20,0 t20,0 t20,0 t20,0" stroke="#bff4f8" stroke-width="3" fill="none"/>'),
  'Crimson Vanguard': ('alliance', ('#8a1414', '#5a0a0a'), 'plain',  # a spear with a crimson pennon, charging
      f'<path d="M28,104 L92,30" {S(7)}/><path d="M28,104 L92,30" stroke="#c8a050" stroke-width="3"/><path d="M86,24 L100,18 L96,34 Z" fill="#d8d8e0" {S(2.4)}/>'
      f'<path d="M80,40 Q60,30 46,40 Q58,46 54,56 Q66,48 76,50 Z" fill="#ff4a3a" {S(2.4)}/>'),
  'Knights of Ambermoor': ('alliance', ('#1a3a6a', '#c8902a'), 'chevron',  # a knight's helm before the amber sun
      '<circle cx="60" cy="54" r="26" fill="#ffb040" stroke="#7a4a0c" stroke-width="2"/>'
      f'<path d="M44,92 L44,62 Q44,44 60,42 Q76,44 76,62 L76,92 Z" fill="#c0c4cc" {S()}/><path d="M48,64 L72,64 M60,64 L60,82" stroke="{INK}" stroke-width="3.4"/>'
      f'<path d="M60,42 Q66,30 78,28 Q70,38 68,46" fill="#9a1a14" {S(2)}/>'),
  'Pumpkin Patrol': ('alliance', ('#2a1a3a', '#3a2a10'), 'plain',  # a carved pumpkin with a lantern grin
      f'<path d="M60,48 Q86,42 90,70 Q90,98 60,98 Q30,98 30,70 Q34,42 60,48 Z" fill="#e8762a" {S()}/><path d="M48,50 Q44,72 50,96 M72,50 Q76,72 70,96" fill="none" stroke="#a84a10" stroke-width="2"/>'
      f'<path d="M58,48 Q56,38 62,32" fill="none" {S(5)}/><path d="M58,48 Q56,38 62,32" fill="none" stroke="#4a7a1a" stroke-width="2.4"/>'
      '<path d="M44,66 L52,60 L54,70 Z M76,66 L68,60 L66,70 Z M42,80 Q60,92 78,80 L72,86 L66,82 L60,88 L54,82 L48,86 Z" fill="#ffe070"/>'),
  'Grey Hood Dropouts': ('alliance', ('#4a4e56', '#2a2e36'), 'pale',  # an empty grey hood, a scroll tossed aside
      f'<path d="M60,30 Q86,34 88,66 Q88,94 76,102 L44,102 Q32,94 32,66 Q34,34 60,30 Z" fill="#8a8e96" {S()}/><path d="M60,46 Q76,50 74,72 Q70,88 60,90 Q50,88 46,72 Q44,50 60,46 Z" fill="#14161a"/>'
      f'<path d="M80,96 L100,84 L104,92 L84,104 Z" fill="#e8dcc0" {S(2)}/>'),
  'Lions Pride': ('alliance', ('#1a3a6a', '#2a4a8a'), 'plain',  # a lion's head in a mane of gold
      ''.join(f'<path d="M60,66 L{60 + 34 * __import__("math").cos(a / 14 * 6.283):.1f},{66 + 34 * __import__("math").sin(a / 14 * 6.283):.1f}" stroke="#c8902a" stroke-width="11" stroke-linecap="round"/>' for a in range(14))
      + f'<circle cx="60" cy="66" r="24" fill="#f0c45a" {S()}/><circle cx="51" cy="60" r="3" fill="{INK}"/><circle cx="69" cy="60" r="3" fill="{INK}"/>'
      f'<path d="M54,72 L66,72 L60,79 Z" fill="{INK}"/><path d="M60,79 Q54,86 48,82 M60,79 Q66,86 72,82" fill="none" stroke="{INK}" stroke-width="2"/>'),
  'Mireling Mafia': ('alliance', ('#1e3a1a', '#3a4a1a'), 'bend',  # a mireling in a gangster's hat
      f'<ellipse cx="60" cy="78" rx="26" ry="20" fill="#6aa040" {S()}/><circle cx="48" cy="66" r="8" fill="#fffaf0" {S(2)}/><circle cx="72" cy="66" r="8" fill="#fffaf0" {S(2)}/>'
      f'<circle cx="49" cy="67" r="3" fill="{INK}"/><circle cx="71" cy="67" r="3" fill="{INK}"/><path d="M48,84 Q60,90 72,84" fill="none" {S(2.4)}/>'
      f'<path d="M36,56 L84,56 L80,50 L74,50 L72,32 L48,32 L46,50 L40,50 Z" fill="#1a1a1a" {S(2.4)}/><path d="M47,46 L73,46" stroke="#9a1a14" stroke-width="4"/>'),
  'Starlight Vanguard': ('alliance', ('#14183a', '#2a2a6a'), 'plain',  # a spear point under a falling star
      f'<path d="M60,104 L60,52" {S(7)}/><path d="M60,104 L60,52" stroke="#c8a050" stroke-width="3"/><path d="M60,30 L68,52 L52,52 Z" fill="#d8d8e0" {S(2.4)}/>'
      '<path d="M88,24 L91,33 L100,33 L93,38 L96,47 L88,41 L80,47 L83,38 L76,33 L85,33 Z" fill="#fff6c0" stroke="#c8a050" stroke-width="1.4"/>'
      '<path d="M84,40 L60,62" stroke="#fff6c0" stroke-width="2" opacity=".6"/>' + ''.join(f'<circle cx="{x}" cy="{y}" r="1.6" fill="#fff"/>' for x, y in [(30, 34), (38, 52), (82, 70), (30, 82)])),
  'Blood and Thunder': ('horde', ('#5a0a0a', '#2a2a30'), 'pale',  # a drop of blood split by a bolt
      f'<path d="M60,28 Q84,62 82,78 Q80,100 60,100 Q40,100 38,78 Q36,62 60,28 Z" fill="#b01a14" {S()}/>'
      f'<path d="M66,30 L50,66 L62,66 L52,100 L76,58 L64,58 L74,30 Z" fill="#ffe070" {S(2.4)}/>'),
  'Sons of the Storm': ('horde', ('#2a3040', '#141820'), 'plain',  # a storm cloud raining bolts
      f'<path d="M30,62 Q26,44 44,44 Q48,28 66,32 Q82,26 88,44 Q100,46 96,62 Z" fill="#6a7484" {S()}/>'
      + ''.join(f'<path d="M{x},64 L{x - 6},80 L{x + 2},80 L{x - 4},98" fill="none" stroke="#ffe070" stroke-width="3.4" stroke-linejoin="round"/>' for x in (46, 64, 80))),
  'Dust Eaters': ('horde', ('#8a6a3a', '#5a3a1a'), 'fess',  # a jawbone over the dunes, dust blowing
      '<path d="M14,90 Q40,74 60,86 Q82,72 106,88 L106,120 L14,120 Z" fill="#d8a85a" opacity=".85"/>'
      f'<path d="M34,50 Q34,80 60,84 Q86,80 86,50 L78,50 Q76,72 60,74 Q44,72 42,50 Z" fill="#f0e6cc" {S()}/>'
      + ''.join(f'<path d="M{x},{y} L{x + 3},{y - 8} L{x + 6},{y}" fill="#fffaf0" {S(1.6)}/>' for x, y in [(44, 70), (52, 74), (62, 74), (70, 70)])
      + '<path d="M24,40 Q40,34 54,40 M66,36 Q80,30 96,36" stroke="#e8d0a0" stroke-width="2.4" fill="none" opacity=".8"/>'),
  'Bonewall Raiders': ('horde', ('#3a2a20', '#1a1410'), 'plain',  # a wall of bones behind a raider's axe
      ''.join(f'<path d="M{x},{y} L{x + 22},{y}" stroke="#f0e6cc" stroke-width="7" stroke-linecap="round"/><circle cx="{x}" cy="{y - 3}" r="3.4" fill="#f0e6cc"/><circle cx="{x}" cy="{y + 3}" r="3.4" fill="#f0e6cc"/><circle cx="{x + 22}" cy="{y - 3}" r="3.4" fill="#f0e6cc"/><circle cx="{x + 22}" cy="{y + 3}" r="3.4" fill="#f0e6cc"/>'
              for x, y in [(26, 82), (54, 82), (82, 82), (40, 96), (68, 96), (40, 68), (68, 68)])
      + f'<path d="M40,104 L82,30" {S(7)}/><path d="M40,104 L82,30" stroke="#7a4a1e" stroke-width="3"/><path d="M72,28 Q96,22 98,46 Q88,40 80,44 Q80,34 72,28 Z" fill="#b0b0b8" {S(2.6)}/>'),
  'Kessari Hexers': ('horde', ('#3a1a4a', '#1a0c24'), 'plain',  # an eye in a hex circle
      f'<circle cx="60" cy="66" r="34" fill="none" stroke="#b07ae0" stroke-width="3"/><path d="M60,32 L89,83 L31,83 Z" fill="none" stroke="#b07ae0" stroke-width="2"/><path d="M60,32 L60,24 M89,83 L96,87 M31,83 L24,87" stroke="#b07ae0" stroke-width="2"/>'
      f'<path d="M36,66 Q60,44 84,66 Q60,88 36,66 Z" fill="#f0e6ff" {S(2.6)}/><circle cx="60" cy="66" r="9" fill="#7a2ab0"/><circle cx="60" cy="66" r="4" fill="{INK}"/>'),
}

def division(kind, a, b, clip):
    rest = {'plain': '', 'pale': '<rect x="60" y="0" width="60" height="140"/>', 'fess': '<rect x="0" y="70" width="120" height="70"/>',
            'bend': '<path d="M0,0 L40,0 L120,90 L120,140 Z"/>', 'chevron': '<path d="M0,140 L0,110 L60,52 L120,110 L120,140 Z"/>'}[kind]
    return f'<path d="{clip}" fill="{a}"/>' + (f'<g clip-path="url(#cc)" fill="{b}">{rest}</g>' if rest else '')

def crest(name, faction, field, div, charge):
    sh = HEATER if faction == 'alliance' else ROUND
    rim = '#f0c45a' if faction == 'alliance' else '#a8a8b0'
    studs = '' if faction == 'alliance' else ''.join(f'<circle cx="{x}" cy="{y}" r="3" fill="#c8c8d0" {S(1.4)}/>' for x, y in [(60, 14), (106, 62), (60, 118), (14, 62)])
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140"><defs><clipPath id="cc"><path d="{sh}"/></clipPath></defs>'
            f'<path d="{sh}" fill="{INK}" transform="translate(0,3)"/>' + division(div, field[0], field[1], sh)
            + f'<g clip-path="url(#cc)">{charge}</g><path d="{sh}" fill="none" stroke="{INK}" stroke-width="7"{J}/><path d="{sh}" fill="none" stroke="{rim}" stroke-width="3"{J}/>{studs}</svg>')

if __name__ == '__main__':
    out = {n: crest(n, *v) for n, v in CH.items()}
    fb = {f: crest('', f, ('#1a3a6a', '#14183a') if f == 'alliance' else ('#5a0a0a', '#2a2a30'), 'plain', lantern()) for f in ('alliance', 'horde')}
    # clip ids are shared ("cc") but identical per shape only within one crest: give each crest its own id
    def own(svg, i): return svg.replace('id="cc"', f'id="cc{i}"').replace('url(#cc)', f'url(#cc{i})')
    out = {n: own(s, i) for i, (n, s) in enumerate(out.items())}; fb = {f: own(s, 'f' + f[0]) for f, s in fb.items()}
    open(os.path.join(ROOT, 'src', 'art_crests.js'), 'w').write('// Generated by art/brand/crests.py; do not edit by hand.\n(function (root) { root.ART = root.ART || {}; root.ART.crests = '
        + json.dumps(out) + ';\n  root.ART.crestFallback = ' + json.dumps(fb) + ';\n  // a guild\'s own crest, or the lantern on its faction\'s shield\n'
        '  root.ART.crest = (name, faction) => root.ART.crests[name] || root.ART.crestFallback[faction === \'horde\' ? \'horde\' : \'alliance\'];\n'
        '})(typeof window !== \'undefined\' ? window : globalThis);\n')
    print(len(out), 'crests,', sum(map(len, out.values())) // 1024, 'KB')
    if '--sheet' in sys.argv:
        ks = list(out) + ['(fallback A)', '(fallback H)']; allc = dict(out); allc['(fallback A)'] = fb['alliance']; allc['(fallback H)'] = fb['horde']
        cells = ''.join(f'<image x="{i % 8 * 130 + 5}" y="{i // 8 * 150 + 5}" width="120" height="140" href="data:image/svg+xml;base64,' + base64.b64encode(allc[k].encode()).decode() + '"/>' for i, k in enumerate(ks))
        sp = os.path.join(H, '.csheet.svg'); open(sp, 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" width="1040" height="300"><rect width="100%" height="100%" fill="#1a120c"/>{cells}</svg>')
        subprocess.run(['rsvg-convert', '-w', '1560', '-o', os.path.join(H, 'crests_sheet.png'), sp], check=True); os.remove(sp); print('sheet')
