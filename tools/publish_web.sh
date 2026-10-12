#!/usr/bin/env bash
# Publish the browser version: puts dist/index.html (run build.py first) on the gh-pages branch, which GitHub Pages
# serves at https://faizal97.github.io/realm-of-loner/. A normal commit and push on that branch, never a force-push.
# Usage: tools/publish_web.sh          a normal release: the main page, and beta/ too unless beta/ holds a newer test build
#        tools/publish_web.sh --beta   a test build: only the beta page (https://faizal97.github.io/realm-of-loner/beta/)
#        tools/publish_web.sh --pages  only the other pages in web/ (about, privacy); the game pages stay as they are
#        tools/publish_web.sh --guide  only the database (guide/, from tools/build_guide.js); the game pages stay as they are
# A normal release also rebuilds the database, so it always matches the live game. A beta never touches it.
# The database is always built from the latest release tag's game data (--guide too).
# (run from the repo root, after build.py)
set -euo pipefail
BETA=0; [ "${1:-}" = "--beta" ] && BETA=1
PAGES=0; [ "${1:-}" = "--pages" ] && PAGES=1
GUIDE=0; [ "${1:-}" = "--guide" ] && GUIDE=1
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/dist/index.html"
[ -f "$SRC" ] || [ "$GUIDE" = 1 ] || { echo "no dist/index.html: run python3 build.py first"; exit 1; }
VER="$([ -f "$SRC" ] && grep -o 'AZ_VERSION *= *"[^"]*"' "$SRC" | head -1 | sed 's/.*"\(.*\)"/\1/' || true)"
URL="$(git -C "$ROOT" remote get-url origin)"
GIT=(git -c credential.helper= -c 'credential.helper=!gh auth git-credential')
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
if "${GIT[@]}" ls-remote --exit-code --heads "$URL" gh-pages >/dev/null 2>&1; then
  "${GIT[@]}" clone --quiet --depth 1 --branch gh-pages "$URL" "$TMP/site"
else
  mkdir "$TMP/site" && git -C "$TMP/site" init --quiet -b gh-pages && git -C "$TMP/site" remote add origin "$URL"
fi
# the music files next to a page (v10.8): replaced together with that page, so a page and its tracks always match
put_music() { rm -rf "$1/music"; if [ -d "$ROOT/dist/music" ] && [ -n "$(ls -A "$ROOT/dist/music" 2>/dev/null)" ]; then cp -R "$ROOT/dist/music" "$1/music"; fi; }
ver_of() { [ -f "$1" ] && grep -o 'AZ_VERSION *= *"[^"]*"' "$1" | head -1 | sed 's/.*"\(.*\)"/\1/' || echo ""; }
mkdir -p "$TMP/site/beta"
# the database (#231): rebuilt from this checkout's game data and replaced as a whole
# A hand-written guide checked for an older minor version than the latest release stops the publish (guides/*.md).
# Its game data comes from the latest release tag (src/ at that tag), so --guide between releases never shows unreleased
# work; a normal release runs right after its tag, so that is this checkout's data anyway.
put_guide() {
  local TAG; TAG="$(git -C "$ROOT" describe --tags --abbrev=0 --match 'v*' --exclude '*-*')"
  mkdir -p "$TMP/rel" && git -C "$ROOT" archive "$TAG" src | tar -x -C "$TMP/rel"
  echo "database from $TAG's game data"
  DATA_ROOT="$TMP/rel" node "$ROOT/tools/build_guide.js" --check || { echo "Re-check those guides against the game, raise their checked: version, then publish again." >&2; exit 1; }
  DATA_ROOT="$TMP/rel" node "$ROOT/tools/build_guide.js" >/dev/null || exit 1
  rm -rf "$TMP/site/guide" && cp -R "$ROOT/dist/guide" "$TMP/site/guide"
}
if [ "$PAGES" = 1 ]; then
  WHERE="web pages"
elif [ "$GUIDE" = 1 ]; then
  put_guide; WHERE="database"
elif [ "$BETA" = 1 ]; then
  cp "$SRC" "$TMP/site/beta/index.html"; put_music "$TMP/site/beta"; WHERE="beta page"
else
  cp "$SRC" "$TMP/site/index.html"; put_music "$TMP/site"; put_guide; WHERE="main page"
  # the beta page follows a normal release, unless it already has a newer test build
  OLD="$(ver_of "$TMP/site/beta/index.html")"
  NEWER="$(node -e "global.window=global;global.localStorage={getItem(){return null},setItem(){}};require('$ROOT/src/update.js');console.log(process.argv[1]&&UPD.cmp(process.argv[1],process.argv[2])>0?1:0)" "$OLD" "$VER")"
  if [ "$NEWER" = 1 ]; then echo "beta page kept at v$OLD (newer than v$VER)"; else cp "$SRC" "$TMP/site/beta/index.html"; put_music "$TMP/site/beta"; WHERE="main and beta pages"; fi
fi
# the site's other pages (privacy.html, …) from web/, in either mode
for f in "$ROOT"/web/*.html; do [ -f "$f" ] && cp "$f" "$TMP/site/"; done
touch "$TMP/site/.nojekyll" # serve the file as it is
cd "$TMP/site"
git add -A
if git diff --cached --quiet; then echo "web version already up to date (v$VER)"; exit 0; fi
git commit --quiet -m "Web build v$VER ($WHERE)"
"${GIT[@]}" push --quiet origin gh-pages
echo "published v$VER to the $WHERE"
