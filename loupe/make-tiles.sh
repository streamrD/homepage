#!/bin/bash
# Regenerate the loupe test images for one theme. Needs the repo served
# locally, e.g.
#   python3 -m http.server 8777      (run from the repo root)
# then
#   bash loupe/make-tiles.sh daylight [port]
#
# Themes are palettes only — same tiles, same labels, same geometry, so two
# themes can be compared without anything else moving.
set -e

THEME="${1:-boardwalk}"
PORT="${2:-8777}"
MODE="${3:-all}"        # all | sub — sub skips the plates and the rail
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
BASE="http://localhost:$PORT/loupe/tile.html"
HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="$HERE/tiles/$THEME"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Each entry is hue,saturation,lightness. Across every theme the three levels
# stay ordered dark → mid → light, so depth still reads without labels.
case "$THEME" in
  boardwalk)
    # Evenly spaced round the wheel at one saturation. Matte, printed,
    # summery — the full spectrum with nothing favoured. Seaside carnival,
    # felt pennants, candy store.
    PLATE=( "20,52,26" "160,52,26" "300,52,26" )
    RAIL=(  "0,52,38" "36,52,38" "72,52,38" "108,52,38" "144,52,38"
            "180,52,38" "216,52,38" "252,52,38" "288,52,38" "324,52,38" )
    SUB=(); for i in $(seq 0 19); do SUB+=( "$((i * 18)),52,50" ); done
    ;;
  autochrome)
    # Warm-weighted and desaturated, after the 1907 Lumière plates: dusty
    # rose, ochre, sage, mauve. Quiet enough to sit under old photographs.
    PLATE=( "24,30,24" "96,20,22" "310,22,24" )
    RAIL=(  "14,36,44" "28,38,50" "42,34,44" "58,28,48" "88,22,42"
            "148,20,46" "186,24,42" "212,26,48" "280,20,44" "336,30,50" )
    SUB=(); for i in $(seq 0 19); do SUB+=( "$((i * 18 + 8)),30,$((56 + (i % 2) * 5))" ); done
    ;;
  cyanotype)
    # A single iron-blue band from teal to violet. Hue alone cannot separate
    # ten tiles this close together, so lightness alternates to do the work.
    PLATE=( "200,50,16" "228,46,19" "262,40,17" )
    RAIL=(  "190,46,28" "200,46,38" "210,46,30" "220,46,40" "230,46,32"
            "240,46,42" "250,46,34" "260,46,44" "270,44,36" "280,42,46" )
    SUB=(); for i in $(seq 0 19); do SUB+=( "$((188 + i * 5)),38,$((52 + (i % 2) * 10))" ); done
    ;;
  safelight)
    # Everything under the lamp: reds through ambers only, nothing cool.
    # Ten frames inside 70° of hue need lightness to separate them.
    PLATE=( "8,54,16" "24,50,19" "40,46,17" )
    RAIL=(); for i in $(seq 0 9); do
      RAIL+=( "$((2 + i * 7)),52,$((26 + (i % 2) * 12))" ); done
    SUB=(); for i in $(seq 0 19); do
      SUB+=( "$((0 + i * 4)),48,$((46 + (i % 2) * 9))" ); done
    ;;
  daguerre)
    # Barely coloured at all — a cool grey ramp with the faintest blue in it,
    # which is what a plate looks like when it is not catching the light.
    PLATE=( "205,10,14" "210,8,17" "200,12,15" )
    RAIL=(); for i in $(seq 0 9); do
      RAIL+=( "$((196 + i * 3)),$((6 + i % 3)),$((30 + i * 4))" ); done
    SUB=(); for i in $(seq 0 19); do
      SUB+=( "$((198 + i * 2)),$((5 + i % 4)),$((44 + (i % 5) * 5))" ); done
    ;;
  riso)
    # Spot inks: few hues, pushed hard, no half measures.
    PLATE=( "340,72,30" "196,70,28" "48,74,32" )
    RAIL=(); for i in $(seq 0 9); do
      RAIL+=( "$(( (i * 47 + 340) % 360 )),74,52" ); done
    SUB=(); for i in $(seq 0 19); do
      SUB+=( "$(( (i * 61 + 340) % 360 )),72,56" ); done
    ;;
  mono)
    # One neutral set shared by all six monochrome themes. Holding the
    # content constant is the point: with no colour in the tiles, what you
    # are comparing between those themes is chrome and nothing else.
    PLATE=( "210,3,20" "210,3,26" "210,3,32" )
    RAIL=(); for i in $(seq 0 9); do
      RAIL+=( "210,3,$((30 + i * 4))" ); done
    SUB=(); for i in $(seq 0 19); do
      SUB+=( "210,3,$((38 + (i % 10) * 4))" ); done
    ;;
  *)
    echo "unknown theme: $THEME" >&2
    echo "  boardwalk | autochrome | cyanotype | safelight | daguerre | riso" >&2
    exit 1
    ;;
esac

mkdir -p "$OUT/img" "$OUT/thumbs" "$OUT/sub/img" "$OUT/sub/thumbs"

# shot <query> <render_px> <final_px> <out.jpg>
# Headless Chrome will not open a window narrower than 500px, so small tiles
# are rendered large and scaled down rather than requested at final size.
shot() {
  "$CH" --headless --disable-gpu --hide-scrollbars \
        --window-size="$2,$2" --virtual-time-budget=2500 \
        --screenshot="$TMP/t.png" "$BASE?$1&dim=$3%C3%97$3" >/dev/null 2>&1
  if [ "$2" != "$3" ]; then
    sips -Z "$3" "$TMP/t.png" --out "$TMP/t.png" >/dev/null
  fi
  sips -s format jpeg -s formatOptions 80 "$TMP/t.png" --out "$4" >/dev/null
}

# hsl <entry> -> h=..&s=..&l=..
hsl() { echo "h=${1%%,*}&s=$(echo "$1" | cut -d, -f2)&l=${1##*,}"; }

if [ "$MODE" = "all" ]; then
  for i in 1 2 3; do
    shot "$(hsl "${PLATE[$((i-1))]}")&big=$i&small=intro%20plate&label=$THEME" \
         1600 1600 "$OUT/img/plate-$i.jpg"
  done

  for i in $(seq 1 10); do
    n=$(printf "%02d" "$i"); c="${RAIL[$((i-1))]}"
    shot "$(hsl "$c")&big=$n&small=rail&label=$THEME"        800 400 "$OUT/thumbs/thumb-$n.jpg"
    shot "$(hsl "$c")&big=$n&small=enlargement&label=$THEME" 1600 1600 "$OUT/img/full-$n.jpg"
  done
fi

for i in $(seq 1 ${#SUB[@]}); do
  n=$(printf "%02d" "$i"); c="${SUB[$((i-1))]}"
  shot "$(hsl "$c")&big=$n&small=section&label=$THEME"     800 400 "$OUT/sub/thumbs/sub-$n.jpg"
  shot "$(hsl "$c")&big=$n&small=enlargement&label=$THEME" 1600 1600 "$OUT/sub/img/sub-$n.jpg"
done

echo "$THEME — $(ls "$OUT"/img "$OUT"/thumbs "$OUT"/sub/img "$OUT"/sub/thumbs | grep -c jpg) tiles"
