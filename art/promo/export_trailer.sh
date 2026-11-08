#!/bin/bash
# Export a trailer (art/promo/trailers/<name>.js, a cutscene that never ships in the game) to a 1920x1080 MP4 at 30 fps.
# Usage: art/promo/export_trailer.sh <name> <out.mp4> [music]   (run python3 build.py first; music: a file path, or a game
#   track name for audio/out/music_<music>.m4a). DIST=<dir> serves another build (dist-dev).
set -euo pipefail
NAME="$1"; OUT="$2"; MUSIC="${3:-worldboss}"
R="$(cd "$(dirname "$0")/../.." && pwd)"
if [ -f "$MUSIC" ]; then MF="$MUSIC"; else MF="$R/audio/out/music_$MUSIC.m4a"; fi
TMP="$(mktemp -d /tmp/aztrailer-XXXX)"
python3 -m http.server 8777 --bind 127.0.0.1 --directory "${DIST:-$R/dist}" >/dev/null 2>&1 & SRV=$!; disown $SRV
trap 'kill $SRV 2>/dev/null; rm -rf "$TMP"' EXIT
sleep 1
INJECT="$R/art/promo/trailers/$NAME.js" VW=640 VH=360 SCALE=3 CLIP=stage node "$R/art/promo/record_cutscene.js" "trailer_$NAME" "$TMP/rec"
N=$(ls "$TMP/rec"/f*.jpg | wc -l | tr -d ' '); K=$((N-20))
CUT=$(python3 -c "print(round($K/30,3))"); FO=$(python3 -c "print(round($K/30-0.8,3))"); AO=$(python3 -c "print(round($K/30-3,3))")
ffmpeg -y -v error -framerate 30 -i "$TMP/rec/f%05d.jpg" -stream_loop 5 -i "$MF" \
  -filter_complex "[0:v]trim=end_frame=$K,setpts=PTS-STARTPTS,scale=1920:1080:flags=lanczos,fade=t=out:st=$FO:d=0.8,format=yuv420p[v];[1:a]atrim=0:$CUT,afade=t=in:st=0:d=1.5,afade=t=out:st=$AO:d=3,volume=0.9[au]" \
  -map "[v]" -map "[au]" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -movflags +faststart -shortest "$OUT"
echo "wrote $OUT ($(python3 -c "print(round($K/30,1))") s)"
