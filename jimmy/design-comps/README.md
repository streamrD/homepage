# `design-comps/` — what was considered

Comps kept for the reasoning, not for the file that won. Each one is a
self-contained page: open it in a browser, no server and no network.

## `favicon-croppings.html` — August 2026

Six square crops of photograph 01, each shown at 112, 32 and 16 px, in a
dark and a light browser tab, and on a home screen, with one slider driving
the corner radius on all of them at once. The negative sits at the top with
every candidate's box drawn on it.

**A shipped** — the full frame, vignette and all, at a 14% radius. Two
things decided it beyond the look: 14% is what `make-favicon.py` gives the
site-wide "TS" monogram, so the two icons sit together in a bookmark list
without one reading rounder than the other; and the full frame loses least
to the corner mask, which matters on a photograph that is soft to begin
with.

The rejected five are worth keeping because they are the argument for A.
B through F all crop *into* the bokeh, and each one reads better than A at
16 px in isolation — E in particular, one gold lamp, is the clearest mark
of the six. What they lose is the photograph. The icon that came before
this study was one of those tighter crops, and it had drifted far enough
from the frame on the page that the two no longer looked related.

### Rebuilding it

The page inlines every crop as a data URI, so it works from a checkout
alone. Rebuilding needs the git-ignored original scan in `jimmy/` and
Pillow:

```sh
python3 design-comps/build-croppings.py     # edit CROPS to change candidates
python3 design-comps/bake-icons.py          # cut the icons the site serves
```

`favicon-croppings.template.html` holds the layout and copy;
`build-croppings.py` injects the images into its one `__ASSETS__` slot.
`favicon-2026-08-before.png` is the icon this study replaced, kept so the
comparison card in the page still has something to compare against.

Both scripts are run by hand and their output is committed — like
`make-favicon.py` at the site root, they are not part of the build.

## A note on serving

This folder ships with the site, so the comp is reachable at
`/jimmy/design-comps/favicon-croppings.html`. That is harmless — the same
way `og-card.html` is — but it is why nothing here holds anything that
isn't meant to be public.
