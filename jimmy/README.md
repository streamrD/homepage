# `jimmy/` — Light Studies

Five long exposures on 2¼-inch film by James Vincent Moore (Jimmy),
Detroit, early to mid 1960s. Served at
[/jimmy](https://todd.up.railway.app/jimmy).

The page opens with photograph 02 fading up full-bleed and settling at about
a quarter strength — the room, not the subject. The five light studies then
drop onto it, left to right, into a row across the middle of the screen at a
size worth looking at. He holds the bottom-right corner on his own; the
credit holds the bottom left.

Clicking a study darkens the background and shows it whole, uncropped,
centred. Clicking the enlargement returns.

**This replaced an earlier opening** — three photographs bursting from a
small square to full bleed in two-second beats, then five thumbnails flying
in along an arc to a small row in the bottom right. That choreography is not
lost: it is what `loupe/` still implements, driven by `--scatter-radius`,
`--scatter-spread` and `--thumb-tilt`, and `loupe/README.md` records both
entrances and when each one reads better. The short version is that a flight
suits thumbnails travelling to a corner, and a fall suits thumbnails landing
in the middle where the eye already is.

The opening plays once per tab. `sessionStorage` sends a returning visitor
straight to the settled page.

## The entrance

`?entrance=<name>` switches how the five arrive. All seven are kept on file in
`ENTRANCES` in `settleRail()`; the chosen name is appended to the credit line
so a screenshot says which one it is. The default is `converge`.

**The settle never changes** — 1250ms on `cubic-bezier(0.16, 0.9, 0.22, 1)`,
the long slow coming-to-rest from the live version. Only the approach differs.

| name | direction | travel per frame, 1300×800 |
| --- | --- | --- |
| `converge` | one point above the middle, fanning out | 445 · 329 · 280 · 329 · 445 |
| `wave` | above, symmetric sway; middle swings widest | 112 · 180 · 212 · 180 · 112 |
| `fall` | straight down | 208 × 5 |
| `sweep` | in from the left | 394 × 5 |
| `glide` | sweep over a much shorter run | ~160 × 5 |
| `drift` | a 44px fall, no turn | 44 × 5 |
| `trail` | progressive trail from the lower left | 286 · 325 · 364 · 403 · 442 |

**The rule the table encodes:** an offset that scales with the index makes the
last frame do far more travelling than the first, and it reads as the only
thing moving — see `trail`, which is kept precisely as the counter-example.
Every other option is flat or symmetric about the centre, so no frame leads.

The other lesson, learned by getting it wrong twice: the movement has to be
*travel*. A `rotateX` hinge reads as something being stood back upright, and a
spin in place reads as chaos. What makes it believable is a shared direction
released in sequence, so the group unfurls behind the leader rather than
arriving as five separate events.

## `v1/`

The first design, archived complete and still working at `/jimmy/v1`: three
photographs bursting from a small square to full bleed on two-second beats,
then five thumbnails flying along an arc into a small row in the bottom right,
with him above the credit. It carries `<base href="/jimmy/">` deliberately, so
it shares `img/` and `thumbs/` with the live page instead of duplicating
3.5 MB, and it is `noindex` so it does not compete with the current page.

## Layout

```
index.html            the page — styles and script inline, no dependencies
img/                  lights-01…05.jpg + jimmy.jpg, 2000 px — backgrounds and enlargements
thumbs/               lights-01…05.jpg 400 px square + jimmy.jpg 500×400
og.jpg                1200×630 share card
og-card.html          what og.jpg is rendered from — see below
favicon-32.png        \  both cropped from photograph 01
apple-touch-icon.png  /
```

`index.html` carries `<base href="/jimmy/">`, so the URL works with or without
a trailing slash. The icon and card live in this folder rather than at the
site root, so `/jimmy` carries its own identity and does not disturb the
home page's TS monogram.

## On a phone

There is one page, not two — the phone layout is the same file under a media
query, so it arrives automatically and there is nothing to keep in sync.

`(max-width: 720px) and (orientation: portrait)` turns the row on its side:
the five run **down the right edge**, vertically centred, which frees the
whole bottom for the credit and leaves the tall middle of the screen to the
photograph. The shading follows — the right edge darkens instead of the
bottom-right corner.

Held in landscape a phone is wide and short, so it keeps the desktop row;
that is the orientation test rather than the width doing the work. Both
arrangements were measured at 390×844 and 844×390 for collisions between the
credit and the thumbnails, which is where this layout breaks if it breaks.

The fly-in needs no change for either: `settleRail` measures each thumbnail's
real resting rectangle and works back to a scatter point near the middle of
the screen, so it follows the layout wherever the CSS puts it.

## Which photograph is which

| file | original |
| --- | --- |
| 01 | `lights0113x13b.jpg` |
| 02 | `lights02enhancedBlueMoreContrast.jpg` |
| 03 | `lights03-13x13.jpg` |
| 04 | `lights04proofCorr13x13.jpg` |
| 05 | `lights05-13x13.jpg` |
| jimmy | `jimmy1corr.jpg` — him, not one of the five |

The portrait hangs above the credit in the bottom left rather than joining the
row. It opens the same enlargement as the others, but carries its own label
instead of an `NN / 05` number, and the arrow keys step past it — they walk
the five. In the script it is `PORTRAIT`, kept out of `PHOTOS` for exactly
that reason. It is the one thumbnail that is not square: it keeps the slide's
own 5:4 landscape, uncropped, mount and all — 78×62, or 54×43 on mobile. The
`.thumb` rules do not apply to it, so the two sizes are maintained separately.

The opening sequence is `INTRO` near the top of the script — currently
`['01', '05', '02']`, so 02 is the one left standing behind the menu. Reorder
that array to swap them; the thumbnail row always runs 01 to 05. `BURST`
(beat to beat) and `GROW` (small to full bleed) sit beside it; `GROW` must
stay in step with the `transform` transition on `.plate img`.

## Regenerating the web copies

The originals are 4600–9200 px, 32 MB in total, and are **git-ignored** — this
repo is served verbatim, so only the derivatives ship. Keep the originals in
this folder locally and rerun:

```sh
i=0
for f in lights0113x13b.jpg lights02enhancedBlueMoreContrast.jpg \
         lights03-13x13.jpg lights04proofCorr13x13.jpg lights05-13x13.jpg; do
  i=$((i+1)); n=$(printf "%02d" $i)
  sips -Z 2000 -s format jpeg -s formatOptions 82 "$f" --out "img/lights-$n.jpg"
  sips -Z 400  -s format jpeg -s formatOptions 78 "$f" --out "thumbs/lights-$n.jpg"
  sips -c 400 400 "thumbs/lights-$n.jpg"
done

# the portrait — uncropped at both sizes, so no square crop step
sips -Z 2000 -s format jpeg -s formatOptions 82 jimmy1corr.jpg --out img/jimmy.jpg
sips -Z 500  -s format jpeg -s formatOptions 80 jimmy1corr.jpg --out thumbs/jimmy.jpg
```

## The share card and the icon

Both come from photograph 01. The icon is the whole frame, corners rounded
to 14% — the radius `make-favicon.py` gives the site-wide "TS" monogram, so
the two sit together in a bookmark list without one looking rounder:

```sh
python3 design-comps/bake-icons.py     # needs Pillow and the original scan
```

That writes `favicon-16.png`, `favicon-32.png`, `favicon-48.png` and
`apple-touch-icon.png`. The three favicons carry real transparency outside
the corner arc; the touch icon stays square and opaque, because iOS masks it
into its own squircle and composites alpha onto black, so rounding it here
would only punch black notches inside that mask. The 16 px file exists
because browsers downscale a 32 badly, and this photograph — bokeh, soft to
start with — is exactly the kind that goes muddy when they do. For the same
reason the small sizes get a light unsharp mask after the reduction.

**This replaced a tighter crop** — a square from the frame's left-centre,
where a green, a blue and a red fall against dark. It read well as a mark
but no longer looked like the photograph on the page.
`design-comps/favicon-croppings.html` is the comp that settled it: six
croppings at every size that matters, with a live radius control.

`og.jpg` is a screenshot of `og-card.html`, the same trick `make-favicon.py`
uses at the site root: type set in a real browser rather than drawn by hand.
The card is the photograph full-bleed under a caption band, and the band is
there because the type crossed a bright yellow passage and vanished without
it. Serve the folder, then:

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --hide-scrollbars --window-size=1200,630 \
  --virtual-time-budget=6000 --screenshot=/tmp/og.png \
  "http://localhost:8000/jimmy/og-card.html"
sips -s format jpeg -s formatOptions 88 /tmp/og.png --out og.jpg
```

`og-card.html` uses a relative `img/` path, so it renders correctly whether
it is served locally or from the live site. It is itself publicly reachable
at `/jimmy/og-card.html`; that is harmless, but it is why it holds nothing
but the card.

## Details worth knowing before editing

- `#NN` in the URL deep-links to one photograph and skips the opening —
  `/jimmy/#04`, or `/jimmy/#jimmy` for the portrait. Arrow keys move between
  enlargements, Escape closes.
- `full()` maps an id to its file, and the portrait is the one id that is not
  `lights-NN`. Adding anything else outside that naming needs the same care.
- Clicking anywhere during the opening skips to the menu.
- Under `prefers-reduced-motion` the bursts and the fly-in are dropped; the
  resting photograph and the row appear directly.
- The `¼` in the credit is wrapped in `<span class="frac">`. Share Tech Mono
  has no such glyph, so that span names monospace fallbacks that do — set it
  bare and it drops into a proportional face and breaks the line's even
  advance. `og-card.html` carries the same rule for the same reason.
- The credit sits beside the row above 900px and moves above it below that,
  where there is no longer room for both. Lengthening it means rechecking
  those two widths.
- `.plate img` is a `100vmax` square rather than a stretched `100%` box. At
  scale 1 that covers the viewport identically to `object-fit: cover`, but it
  also means one `transform` drives the whole opening — no layout work.
- Grain and the corner shading are background-only. Nothing is ever laid over
  an enlargement.
