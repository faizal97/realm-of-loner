// Renders the app icon (art/logo/icon.svg) to every Android launcher size and the browser tab icon.
// Usage: node art/logo/render.js   (needs rsvg-convert; the PNGs it writes are committed, the build only reads them)
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..');
const RSVG = '/opt/homebrew/bin/rsvg-convert';
// since the Ruinfall pre-patch (#524) the launcher wears the saga edition, built from icon.svg by art/ruinfall/icon2.py
const SRC = path.join(__dirname, '..', 'ruinfall', 'icon_ruinfall.svg');
const RES = path.join(ROOT, 'app/android/app/src/main/res');
const out = [
  ['mipmap-mdpi/ic_launcher.png', 48], ['mipmap-hdpi/ic_launcher.png', 72], ['mipmap-xhdpi/ic_launcher.png', 96],
  ['mipmap-xxhdpi/ic_launcher.png', 144], ['mipmap-xxxhdpi/ic_launcher.png', 192],
];
for (const [f, px] of out) execFileSync(RSVG, ['-w', px, '-h', px, '-o', path.join(RES, f), SRC]);
execFileSync(RSVG, ['-w', 64, '-h', 64, '-o', path.join(ROOT, 'src/favicon.png'), SRC]); // inlined by build.py
execFileSync(RSVG, ['-w', 512, '-h', 512, '-o', path.join(__dirname, 'icon_512.png'), SRC]); // for README and sharing
console.log('icon rendered: 5 launcher sizes, src/favicon.png, art/logo/icon_512.png');
