#!/usr/bin/env python3
"""Inline fonts, CSS and JS into one offline HTML file, and copy it into the Android app."""
import os, shutil
R = os.path.dirname(os.path.abspath(__file__))
rd = lambda p: open(os.path.join(R, p), encoding='utf-8').read()
import base64, json, glob, sys, subprocess
# --dev (#92): a dev build for /dev/ (CI publishes one after every green main). Every gate runs as usual; it needs no
# release notes, shows "Dev build <sha>" for the version, keeps its own save keys (src/devkeys.js), has no updater,
# What's new, cloud saves or Friends, and writes only dist-dev/ (never dist/ or the app's assets)
DEV = '--dev' in sys.argv[1:]
# the data must check out before anything is built
if subprocess.run(['node', os.path.join(R, 'tools', 'validate.js')]).returncode != 0:
    sys.exit('build stopped: fix the data errors above')
# and the story must agree with the lore bible (docs/lore/canon.md): no spoilers, no stray names
if subprocess.run(['node', os.path.join(R, 'tools', 'lorekeeper.js')]).returncode != 0:
    sys.exit('build stopped: fix the lore problems above (see docs/lore/canon.md)')
# v10: no name from the old world (tools/rename_v10.json) may appear in anything a player reads (the fan notice excepted)
if subprocess.run(['node', os.path.join(R, 'tools', 'ipcheck.js'), '--brief', '--enforce']).returncode != 0:
    sys.exit('build stopped: an old-world name is back in player text (node tools/ipcheck.js lists where)')
# v10.8: every symbol must be drawn (src/sym.js) or in the fonts, or the phone fills it in from its own font
if subprocess.run(['node', os.path.join(R, 'tools', 'symcheck.js')]).returncode != 0:
    sys.exit('build stopped: a symbol the fonts cannot draw (node tools/symcheck.js lists where)')
if subprocess.run(['node', os.path.join(R, 'sim', 'cloudsync.js')]).returncode != 0:
    sys.exit('build stopped: a cloud save rule is broken (node sim/cloudsync.js lists which)')
if subprocess.run(['node', os.path.join(R, 'sim', 'friends.js')]).returncode != 0:
    sys.exit('build stopped: a Friends rule is broken (node sim/friends.js lists which)')
if subprocess.run(['node', os.path.join(R, 'sim', 'legends.js')], stdout=subprocess.DEVNULL).returncode != 0:
    sys.exit('build stopped: a Legend rule is broken (node sim/legends.js lists which)')
if subprocess.run(['node', os.path.join(R, 'sim', 'upgrades.js')]).returncode != 0:
    sys.exit('build stopped: a gear upgrade rule is broken (node sim/upgrades.js lists which)')
if subprocess.run(['node', os.path.join(R, 'sim', 'wardrobe.js')]).returncode != 0:
    sys.exit('build stopped: a wardrobe rule is broken (node sim/wardrobe.js lists which)')
if subprocess.run(['node', os.path.join(R, 'sim', 'sellspeed.js')]).returncode != 0:
    sys.exit('build stopped: selling several or battle speed is broken (node sim/sellspeed.js lists which)')
if subprocess.run(['node', os.path.join(R, 'sim', 'news.js')]).returncode != 0:
    sys.exit('build stopped: the news names a place or secret beyond the player\'s level (node sim/news.js lists which)')
if subprocess.run(['node', os.path.join(R, 'sim', 'trials.js')]).returncode != 0:
    sys.exit('build stopped: a Trials rule is broken (node sim/trials.js lists which)')
if subprocess.run(['node', os.path.join(R, 'sim', 'reactions.js')], stdout=subprocess.DEVNULL).returncode != 0:
    sys.exit('build stopped: a class reaction rule is broken (node sim/reactions.js lists which)')
if subprocess.run(['node', os.path.join(R, 'sim', 'hard.js')]).returncode != 0:
    sys.exit('build stopped: a Hard raid rule is broken (node sim/hard.js lists which)')
if subprocess.run(['node', os.path.join(R, 'sim', 'worldboss.js')]).returncode != 0:
    sys.exit('build stopped: a world boss rule is broken (node sim/worldboss.js lists which)')
if subprocess.run(['node', os.path.join(R, 'sim', 'distance.js')]).returncode != 0:
    sys.exit('build stopped: a distance rule is broken (node sim/distance.js lists which)')
if subprocess.run(['node', os.path.join(R, 'sim', 'brawl.js'), '48']).returncode != 0:
    sys.exit('build stopped: a Bloodsand Brawl rule is broken (node sim/brawl.js lists which)')
if subprocess.run(['node', os.path.join(R, 'sim', 'prof.js')], stdout=subprocess.DEVNULL).returncode != 0:
    sys.exit('build stopped: a profession rule or the Expert or Artisan pace is broken (node sim/prof.js lists which)')
if subprocess.run(['node', os.path.join(R, 'sim', 'social.js')], stdout=subprocess.DEVNULL).returncode != 0:
    sys.exit('build stopped: a chat or guild rule is broken (node sim/social.js lists which)')
if subprocess.run(['node', os.path.join(R, 'sim', 'auction.js')], stdout=subprocess.DEVNULL).returncode != 0:
    sys.exit('build stopped: the auction house pays risk-free or a price button wins nowhere (node sim/auction.js lists which)')
if subprocess.run(['node', os.path.join(R, 'sim', 'effects.js')], stdout=subprocess.DEVNULL).returncode != 0:
    sys.exit('build stopped: an item effect wins nowhere, loses nowhere or is too strong (node sim/effects.js lists which)')
if subprocess.run(['node', os.path.join(R, 'sim', 'rares.js')], stdout=subprocess.DEVNULL).returncode != 0:
    sys.exit('build stopped: a rare is in a starting place or first in a Fight list it outlevels (node sim/rares.js lists which)')
if subprocess.run(['node', os.path.join(R, 'sim', 'consumables.js')], stdout=subprocess.DEVNULL).returncode != 0:
    sys.exit('build stopped: level-60 consumables give more than the modest edge (node sim/consumables.js lists which)')
if subprocess.run(['node', os.path.join(R, 'sim', 'music.js')]).returncode != 0:
    sys.exit('build stopped: a place plays the wrong music (node sim/music.js lists which)')
DATA = ['src/data/' + f for f in json.load(open(os.path.join(R, 'src', 'data', 'files.json')))]
# music ships only once he has listened and approved the track
APPROVED = set(open(os.path.join(R, 'audio', 'approved.txt')).read().split()) if os.path.exists(os.path.join(R, 'audio', 'approved.txt')) else set()
PENDING_SFX = set(open(os.path.join(R, 'audio', 'pending_sfx.txt')).read().split()) if os.path.exists(os.path.join(R, 'audio', 'pending_sfx.txt')) else set()
# v10.8: the first music (the three oldest tracks) stays inlined; every other approved track ships as a file next to the
# page (dist/music/ and the app's assets/game/music/), loaded when it is first played (src/sound.js)
INLINE_MUSIC = {'ambermoor', 'town', 'dungeon'}
MUSIC_DIRS = [os.path.join(R, 'dist-dev', 'music')] if DEV else [os.path.join(R, 'dist', 'music'), os.path.join(R, 'app', 'assets', 'game', 'music')]
for d in MUSIC_DIRS:
    os.makedirs(d, exist_ok=True)
    for old in glob.glob(os.path.join(d, '*.m4a')): os.remove(old)
files = []
aud = {}
for f in sorted(glob.glob(os.path.join(R, 'audio', 'out', '*.m4a'))):
    n = os.path.basename(f)[:-4]
    if n == 'sfx_reel': continue
    if n.startswith('music_') and n[6:] not in APPROVED: continue
    if n.startswith('sfx_') and n[4:] in PENDING_SFX: continue   # new effects wait for his ears too (v10.8)
    if n.startswith('music_') and n[6:] not in INLINE_MUSIC:
        for d in MUSIC_DIRS: shutil.copy(f, os.path.join(d, n[6:] + '.m4a'))
        files.append(n[6:]); continue
    aud[n] = 'data:audio/mp4;base64,' + base64.b64encode(open(f, 'rb').read()).decode()
meta = rd('audio/out/music.json') if os.path.exists(os.path.join(R, 'audio/out/music.json')) else '{}'
# the app version, for the in-app updater (src/update.js compares it with the latest GitHub release)
import re
VERSION = re.search(r'^version:\s*([0-9.]+(?:-[0-9A-Za-z.]+)?)', rd('app/pubspec.yaml'), re.M).group(1)  # 9.9.0, or 9.10.0-beta.1
# the release notes for this version (issue #29): one file per release in notes/, the same text the GitHub release, the
# in-app updater and the Discord post use; shown once as "What's new" on the first open of a new version
NOTES_FILE = os.path.join(R, 'notes', f'v{VERSION}.md')
if DEV:
    NOTES = ''
    SHA = (os.environ.get('GITHUB_SHA') or subprocess.run(['git', '-C', R, 'rev-parse', 'HEAD'], capture_output=True, text=True).stdout.strip() or 'unknown')[:7]
elif not os.path.exists(NOTES_FILE):
    sys.exit(f'build stopped: no release notes for v{VERSION} (write notes/v{VERSION}.md first)')
else:
    NOTES = open(NOTES_FILE).read()
audio_js = (f'window.AZ_DEV={json.dumps({"sha": SHA})};' if DEV else '') + f'window.AZ_VERSION={json.dumps(VERSION)};window.AZ_NOTES={json.dumps(NOTES)};' + 'window.AUDIO_DATA=' + json.dumps(aud) + ';window.AUDIO_FILES=' + json.dumps(files) + ';window.AUDIO_META=' + meta + ';'
js = [f for f in ['src/report.js', 'src/art.js', 'src/art_durotar.js', 'src/art_mulgore.js', 'src/art_tirisfal.js', 'src/art_westfall.js', 'src/art_barrens.js', 'src/art_icons2.js', 'src/art_icons3.js', 'src/art_icons4.js', 'src/art_icons5.js', 'src/art_icons6.js', 'src/art_icons7.js', 'src/art_redridge.js', 'src/art_stonetalon.js', 'src/art_duskwood.js', 'src/art_hillsbrad.js', 'src/art_ashenvale.js', 'src/art_wetlands.js', 'src/art_stranglethorn.js', 'src/art_gnomeregan.js', 'src/art_razorfen.js', 'src/art_arathi.js', 'src/art_scarlet.js', 'src/art_mounts.js', 'src/art_icons8.js', 'src/art_tanaris.js', 'src/art_zulfarrak.js', 'src/art_coinworks.js', 'src/art_rumhook.js', 'src/art_feralas.js', 'src/art_maraudon.js', 'src/art_icons9.js', 'src/art_icons10.js', 'src/art_icons11.js', 'src/art_icons12.js', 'src/art_icons13.js', 'src/art_honor.js', 'src/art_ungoro.js', 'src/art_steppes.js', 'src/art_brd.js', 'src/art_plaguelands.js', 'src/art_winterspring.js', 'src/art_scholomance.js', 'src/art_stratholme.js', 'src/art_dustwallow.js', 'src/art_moltencore.js', 'src/art_tidewatch.js', 'src/art_skullreef.js', 'src/art_archive.js', 'src/art_shalzua.js', 'src/art_tidecrown.js', 'src/art_worldbosses.js', 'src/art_story.js', 'src/art_story2.js', 'src/art_legends.js', 'src/art_bromli.js'] + DATA + ['src/engine.js', 'src/bots.js', 'src/game.js', 'src/trials.js', 'src/social.js', 'src/sound.js', 'src/cutscene.js', 'src/update.js', 'src/cloud.js', 'src/friends.js', 'src/savefile.js', 'src/sym.js', 'src/ui.js'] if os.path.exists(os.path.join(R, f))]
if DEV: js = ['src/devkeys.js'] + js  # first, before any script reads or writes storage
html = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="theme-color" content="#0e0b08">
<title>Realm of Loner</title>
<link rel="icon" type="image/png" href="data:image/png;base64,{base64.b64encode(open(os.path.join(R, 'src', 'favicon.png'), 'rb').read()).decode()}">
<link rel="apple-touch-icon" href="data:image/png;base64,{base64.b64encode(open(os.path.join(R, 'src', 'favicon.png'), 'rb').read()).decode()}">
<style>{rd('fonts/fonts.local.css')}</style>
<style>{rd('src/style.css')}</style>
</head><body><div id="app"></div>
<script>{audio_js}</script>
{''.join('<script>' + rd(f) + '</script>' for f in js)}
</body></html>'''
OUT_DIR = os.path.join(R, 'dist-dev' if DEV else 'dist')
os.makedirs(OUT_DIR, exist_ok=True)
out = os.path.join(OUT_DIR, 'index.html')
open(out, 'w', encoding='utf-8').write(html)
dst = os.path.join(R, 'app', 'assets', 'game', 'index.html')
if subprocess.run(['node', os.path.join(R, 'tools', 'ipcheck.js'), '--dist', out]).returncode != 0:
    sys.exit('build stopped: an old-world name is in the built page, maybe in a comment (listed above)')
if not DEV: shutil.copy(out, dst)
print('built', out, ('dev build ' + SHA) if DEV else 'v' + VERSION, round(len(html) / 1024), 'KB;', 'art.js' if 'src/art.js' in js else 'NO ART (placeholders)', '; audio inlined:', len(aud), '; music files:', len(files))
