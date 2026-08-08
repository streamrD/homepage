# moore archives — 2004 Flash site, rebuilt for the web

> **Picking this up cold?** Start with [`../CLAUDE.md`](../CLAUDE.md) — it
> covers how the project evolved, the traps in the type and the image
> pipeline, and how to do the editing and image-replacement jobs that keep
> coming up. This file is the narrower question of what the 2004 original
> contained versus what was added, and why.

A faithful recreation of the Flash site in this directory's parent
(`shell.swf` and `kodachromes/kodachromes.swf`, authored November 2004,
Flash Player 7 / ActionScript 2) as a static HTML/CSS/JS site.

Nothing here depends on Flash, and nothing was redesigned. Layout, type,
colour, image crops and animation timings were all read back out of the SWF
binaries and reproduced.

```
web/
  index.html            the splash / home screen  (from shell.swf)
  kodachromes.html      the Kodachromes gallery   (from kodachromes.swf)
  about.html            \  named in 2004, still unwritten — empty canvases
  bios.html             /  behind a password gate
  early.html            \
  beforethewar.html      |
  wwii.html              |  the seven collections the 2004 site named
  afterthewar.html       |  but never built — see "What was added"
  landscapes.html        |
  negatives.html         |
  1965-2004.html        |
  1965-2004-2.html      /  (this one runs to two contact sheets)
  moore-template/       the same design with the family removed
  assets/
    css/site.css
    js/stage.js         stage scaling + the original preloader
    js/gallery.js       thumbnail dimming, enlargement, turning prints over
    js/gate.js          the password gate on about / bios
    favicon.svg         the wordmark's M, straight from the rebuilt font
    og.jpg              share image
    fonts/*.woff2       eight subsetted faces, rebuilt from the SWFs
    img/                paper texture, cover, and 206 photographs
  tools/                the SWF decompiler and the build scripts
  Makefile              `make deps` then `make all` rebuilds everything
```

The deployable site is about 12 MB, of which the template edition is 3 MB.
`tools/` is build-time only, and must be left out of the deployed folder —
it would otherwise be publicly fetchable.

Open `index.html` directly — the scripts are deliberately classic rather than
ES modules so the archive works from a `file://` URL, off a USB stick or a
burned disc, as well as over HTTP. To serve it instead:

```
python3 -m http.server -d web 8000
```

(Over `file://` the deep links still open slides, but the address bar doesn't
update: `pushState` is not permitted from an opaque origin.)

There is no build step for deployment — copy the HTML, `assets/` and
`moore-template/` to any static host. `tools/` is only needed if you want to
re-derive things from the SWFs.

A curation that shortens a sheet strands the derivatives past its new end, and
they are indistinguishable from live ones by name, so `sections.build()` prunes
them. Deploy with a delete pass (`rsync --delete` or the equivalent) rather
than a plain copy, or the stranded files stay on the host.

## What was in the original

`shell.swf` — 800 × 570 stage, 20 fps, background `#cccccc`:

* a preloader: *loading photographs* over five squares fading up in sequence
* the splash: kraft-paper texture, **moore archives** at 65 pt (the word
  "moore" in Caslon 224 Black Italic, "archives" in Caslon 224 Book Italic),
  the subtitle *Prints, Slides and Negatives, 1900–2004* in HelveticaNeue LT
  45 Light, a 208 × 166 Kodachrome, the two name blocks, and a nine-item
  navigation in Akzidenz Grotesk BE with 1 px `#333` divider ticks
* the main timeline stops on frame 16, so the splash is the whole of what the
  file ever showed

`kodachromes.swf` — the same stage, and the only gallery that was ever
finished:

* *kodachromes* set 65 pt across the bottom at 10.2 % opacity, as a watermark
* a 5 × 4 contact sheet of 20 slides, each 90.9 × 72.7, fading up over 14
  frames
* rolling over one thumbnail sends every *other* one to 20 % opacity over
  7 frames; rolling off brings them back over 7
* clicking one runs `thumbs.gotoAndPlay('allout')` and
  `enlargements.fullAnimation<N>.gotoAndPlay('fadein')` — the sheet fades out
  over 13 frames while a 450 × 360 enlargement fades in over 9, and the
  annotation appears the frame the fade completes
* clicking the enlargement reverses both
* the annotations set the headline in Caslon 224 Black Italic and the body in
  Caslon 224 Book, 12 pt on 13.7 pt, in a ~220 px column at x ≈ 521

All of the above is reproduced, including the frame counts (converted to
milliseconds at the original 20 fps and kept in CSS custom properties at the
top of `site.css`).

## What was added

The original was unfinished, so a few things had to be decided rather than
copied:

* **Seven more collections.** Only KODACHROMES was ever built — in
  `shell.swf` the nav labels are plain text with no button or handler on them
  at all. But the folders beside the SWFs hold finished, web-sized
  derivatives for seven of the nine sections, so those are now real pages:

  | page | source folder | frames published |
  | --- | --- | --- |
  | `early.html` | `early/` | 16 |
  | `beforethewar.html` | `beforethewar/` | 14 |
  | `wwii.html` | `wwII/` | 22 |
  | `afterthewar.html` | `afterthewar/` | 61 |
  | `landscapes.html` | `landscapes/` | 12 |
  | `negatives.html` | `6x9cmNegs/` | 15 |
  | `1965-2004.html` | `../momSent10-2002/` + selects | 34 |
  | `1965-2004-2.html` | `1965-2004/` | 12 |

  The counts are what each sheet publishes, not what the folder holds — the
  curation in `sections.SECTIONS` drops frames, and a dropped frame leaves a
  placeholder rather than reflowing the page.

  They use the same chrome, the same hover-dim, and the same enlargement
  behaviour as the Kodachromes gallery. **They have no annotations** — none
  were ever written for these sections, so the enlargement shows the frame
  alone and the caption column is dropped.
* **Prints you can turn over.** Seventeen prints were scanned on both sides,
  because somebody had written on the back — `244.psd` and `244verso.psd`.
  Those are one object, not two, so the contact sheet shows the recto and the
  viewer turns it over: 3 in Early photos, 4 in Before the war, 7 in WWII, 3
  in After the war. The control sits beside "Back to the contact sheet"; `f`
  or the up/down arrows do the same thing. The enlargement carries a small
  turned-up corner to say there is something on the back; it was on the
  contact sheet at first, where it read as damage to the photograph rather
  than as a note about the object. Clicking the print itself still closes the
  viewer, as the SWF did. Some of the best material in the archive is on those
  backs — a V-Mail note, a censor stamp.

  Pairing is by filename (`<n>verso`), which is the only evidence there is:
  every one of the 17 is named that way, no folder uses any other convention,
  and no unpaired frame looks like a blank back. If a two-sided print was
  scanned without the suffix there is no way to find it — the pixel statistics
  can't tell a blank verso from a faded print.
* **1965-2004 runs to two sheets.** The section's own folder holds 15
  photographs; a second grouping of 41 sits in `../momSent10-2002/`, a
  scanning workspace holding raw, `corr` and further-worked variants of each.
  `tools/sections.py` groups by the name before the working suffix and keeps
  the plain corrected version. `SHEET 1 | SHEET 2` under the grid moves
  between them; each is its own page and its own URL.

  The 2002 group leads, and has taken in all 24 of the newer
  high-resolution scans in `../replacements-additions/selects/` plus three
  frames from the other sheet — 34 in a 7 × 5, with the wedding series
  following on 12. Two of those selects are the same photograph as a frame
  already on the sheet, scanned better, so they replaced it rather than
  joining it. The selects are ~4000px originals but publish at 450, so their
  resolution is not yet doing anything: see the higher-resolution note in
  `../CLAUDE.md`.
* **About and Bios.** Named in 2004 and never written, so these are empty
  canvases: a header, placeholder text, and for Bios a grid of 15 square
  placeholders waiting on portrait crops. Their colours are sampled from the
  Kodachromes themselves and muted to sit on the paper.

  They are behind a **soft** password gate (`tools/gen_site.py` holds the
  SHA-256, never the password). It keeps drafts out of the way of a passer-by
  and out of search results — nothing more. The markup is still in the page
  source. Before anything sensitive goes on these pages, move the check to the
  host (HTTP basic auth) or encrypt the content at build time.
* **A favicon and a share image.** The favicon is the lower-case m from
  Caslon 224 Black Italic, exactly as the wordmark sets "moore", lifted out of
  the rebuilt font as an SVG path — so it needs no font at runtime and stays
  sharp at any size. It is fitted on its own ink rather than a nominal point
  size, since an x-height letter is wide and short, and each `.ico` size is
  rendered separately: downsampling one large icon smears an m's three stems
  together by 16px. The share image sets the wordmark on the paper beside Paul Moore and
  the Buick Century. Both are built by `tools/brand.py`.

  `og:image` is emitted relative. Set `SITE_URL` at the top of
  `tools/gen_site.py` to the deployed origin and rebuild if you need it
  absolute — some scrapers still insist.

  ABOUT THE PROJECT and BIOS remain inert: they are text sections and no text
  exists for them.
* **A contact sheet that sizes itself.** The Kodachromes grid is hand-placed
  at the SWF's coordinates. The new sections hold 13 to 64 frames in both
  orientations, so `tools/sections.py` solves for the largest square cell that
  fits the same area and each frame sits inside its cell at its own aspect
  ratio — which is what a real contact sheet looks like. After the War lands
  at 11 x 6 cells of 45 px; Landscapes at 5 x 3 of 103 px.
* **A way home.** `kodachromes.swf` contains a "moore archives home" label
  but it was authored rotated and scaled to zero, so it never rendered and
  its matrix is not a usable position. It is placed by hand at the top left.
* **Centred dividers.** The SWF sets every nav rule 3.5px after the label on
  its left and 7.7px before the one on its right (1.8/5.9 in the gallery) —
  the same offset on every item, so it is genuinely how the original looked,
  but it reads as a mistake. Each hairline now sits at the midpoint of the gap
  it divides, measured against where the text actually sets rather than
  against the SWF's BOUNDS, which carry a few pixels of Flash's own text-field
  padding on the right.
* **A sticky roll-over.** The SWF restored the dimmed thumbnails the moment
  the pointer left one. Its own sheet was hand-placed and tight; the new
  sections set a gutter around a third of the cell, so crossing between frames
  spends most of the journey over no frame at all, and the whole sheet flared
  back and dimmed again at every crossing. The lit frame now stays lit until
  another takes over or the pointer leaves the sheet — one cross-fade per
  landing.
* **No underlines.** The site's entire interaction language is the SWF's:
  things fade, nothing is decorated. So the nav carries no rules or
  underlines — the section you are in is simply the one at full strength, the
  rest sit back at 55%, unbuilt sections at 28%, and hovering brings one
  forward on the same 350ms linear ramp the thumbnails use.
* **Annotation timing.** The SWF snapped the caption on at the frame the
  photograph finished fading in. Held for 450ms and then snapped, that reads
  as a stall, so the caption now comes up with the photograph. Enlargements
  are primed on hover and prefetched during idle time, so the fade never runs
  over an empty frame. All the durations are CSS custom properties at the top
  of `site.css` if you want to retime any of it.
* **Deep links.** `kodachromes.html#1` … `#20` open a slide directly; the
  back button, Escape, and ← / → all work.
* **Narrow screens.** The composition is a fixed 800 × 550 and is scaled to
  fit above 860 px. Below that the same markup reflows: the contact sheet
  becomes a fluid grid and an enlargement becomes a full-screen sheet.
* **Without JavaScript.** The 20 annotations are in the markup as an ordinary
  `<section class="entries">` of `<article>`s. The gallery script lifts them
  into the enlargement view, so with scripting off the page is still the
  complete, readable archive (and it is indexable either way).
* **The bottom 20 px.** The SWF stage is 800 × 570 but the artwork is
  800 × 550, leaving an unused grey strip. The recreation uses 800 × 550.

Two typos in the 2004 captions ("cancer inthe late 1960's", "lived from
19__to 19__") are reproduced as written.

## Fonts

The typefaces are commercial (ITC Caslon 224, Akzidenz-Grotesk BE,
Helvetica Neue). All but twenty-one characters came out of the SWFs, which
embed `DefineFont2` glyph outlines for exactly the characters they use; those
outlines are converted straight to WOFF2:

SWF glyph shapes are quadratic Béziers on a 1024-unit em with y pointing
down, which is TrueType's own curve format with the y axis flipped, so
`tools/fonts.py` negates y, feeds the contours to a fontTools `TTGlyphPen`,
and takes the advance widths from the `DefineText` glyph records (the tags
have no layout block). The result is the same subset the SWF already carried
— ten characters for Caslon 224 Medium Italic, sixty-four for Caslon 224
Book — totalling 32 KB for all eight faces.

Twenty-one characters are grafted from installed copies of the real fonts,
because the site was painting them in a face that had no glyph for them — and
a missing glyph is not visibly missing, it is quietly served from Georgia, so
one letter in a word changes weight and slope. `f` was the worst of them:
Caslon 224 Black Italic had none, and every generated caption headline reads
"N of M". `tools/audit_faces.py` checks for this and should be run after any
change to copy. Without the real fonts installed the build skips the grafts
and says which characters keep falling back.

Those subsets are the reason the section titles are set the way they are:
`tools/typemetrics.py` measures each title against the faces that actually
have its glyphs. Caslon 224 Book covers six of the seven; the "1965-2004"
watermark needs a numeral 2, which only Akzidenz Grotesk BE Cn carried, so
that one title is still set in the condensed sans.

Because a family can appear in the SWFs in both roman and italic (Caslon 224
Book is italic in the splash title and roman in the captions), faces are
keyed on name *and* the italic flag.

Positioning uses those metrics directly: every face is emitted with
`unitsPerEm` 1024, ascent 760, descent 240 and no line gap, so with
`line-height: 1` the baseline sits exactly `0.753906em` below the top of the
line box. That is the `--baseline-offset` in `site.css`, and it is why text
can be placed by the same baseline coordinates the SWF used.

### Kerning and tracking

Three things are tangled together in the SWF's numbers, and pulling them apart
took a couple of passes.

The `DefineFont2` tags carry no layout block, so the advance widths have to
come from the `DefineText` records — and Flash writes one advance per glyph
*occurrence*, with kerning already folded in. The same letter therefore
carries different advances in different words: `W` runs 1004–1065 units, `T`
492–553, `L` 384–532. Collapsing that to one value per glyph, which is the
obvious thing to do, silently destroys every kerned pair; `WWII` closes up,
`AFTER` tightens at `TE`, `THE` at `TH`.

On top of that, Flash applies per-field *tracking*, so what a record actually
stores is

    advance[i] = base[glyph i] + kern(glyph i, glyph i+1) + tracking(field)

with the kern term dropping out on the last glyph but the tracking term
applying throughout. One field in the whole archive uses tracking — the word
"moore" in the splash title, set 63/1024 em looser than "archives" beside it —
and that one field is enough to wreck a whole face if it is taken at face
value: it inflates the base for m, o, r and e, so the observed pairs in the
12pt captions pick up a bogus compensating kern (every `o` was being pulled
in 66 units before *any* letter) and every unobserved pair renders that much
too loose. That is what made the caption setting look erratic.

So the build anchors the base advances on the point size that supplies the
most samples — precision differs by size, since Flash quantises to a twip at
whatever size a field is set — reads a uniform whole-run offset as that
field's tracking, and takes what is left on a single pair as its kern. Kerns
compile into a real GPOS `kern` feature (29 pairs for Akzidenz Grotesk BE, 13
for Caslon 224 Book); tracking travels through as a CSS `letter-spacing` on
the one run that needs it.

The result is checked rather than assumed: `tools/typemetrics.py` measures
strings against the same table the fonts were built from, and every run in
`shell.swf` lands exactly on the SWF's own per-glyph pen positions. Five
caption lines in `kodachromes.swf` drift by up to 3.9px over a 220px measure,
which does not matter — the captions are reflowed HTML, so their line breaks
are the browser's anyway.

## Images

The Kodachromes are byte-identical to the originals: thumbnails and
enlargements are copied from `../kodachromes/150/` and `../kodachromes/500/`,
which match the JPEGs embedded in the SWF. The paper texture and the splash
photograph come out of the SWF itself (`DefineBitsJPEG2` characters 5 and 35).

The seven new sections are resampled from the PSDs and JPEGs in the archive
to the same sizes the Kodachromes use — long edge 150 for the sheet, 450 for
the enlargement. Every source was already at least 450 px on its long edge,
so nothing is upscaled.

Reading those PSDs takes three different paths. Pillow handles the JPEGs and
the 8-bit PSDs; macOS `sips` handles the 16-bit ones Pillow rejects; and
`afterthewar/237.psd` was saved without Maximize Compatibility, so its merged
composite is blank white and the photograph only exists in the layer data —
that one needs `psd-tools`. `load()` in `tools/sections.py` tries each in turn
and rejects a result whose standard deviation says it came back blank.

## tools/

A small SWF reader written for this job, since no decompiler was available:

| file | what it does |
| --- | --- |
| `swfparse.py` | tag stream, bit reader, RECT/MATRIX |
| `avm1.py` | AVM1 bytecode disassembler |
| `decomp.py` | stack machine → pseudo-ActionScript |
| `shapes.py` | `DefineShape` edge records → paths |
| `textruns.py` | `DefineText` → positioned runs with fonts and advances |
| `fonts.py` | `DefineFont2` → TrueType |
| `extract.py` | `DefineBits*` → JPEG, shape → bitmap mapping |
| `layout.py` | composes the display list into absolute stage coordinates |
| `dump.py`, `strings.py` | readable dumps of a whole SWF |
| `typemetrics.py` | measures strings against the built WOFF2 subsets |
| `build.py` | Kodachromes images, fonts, captions |
| `sections.py` | the seven unpublished collections: PSD/JPEG → web assets |
| `brand.py` | favicon and share image |
| `chrome.py` | stage geometry for both screens → `data/chrome.json` |
| `gen_site.py` | the two HTML files |
| `template_images.py` | blanks the template's photographs to palette swatches |
| `template_text.py` | rewords the template and swaps its typography |
| `audit_faces.py` | what the site paints vs what each face can set |

`make all` runs the build scripts in order. The two JSON files under `tools/data/` are
build inputs, not runtime data — the pages are fully static.

## Credit

Photographs by James E. Moore (1918–1997). Annotations by the family. The
2004 Flash site is the source for everything reproduced here.
