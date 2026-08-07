#!/usr/bin/env python3
"""Cut the /jimmy icons from photograph 01.

The crop is the full frame — the whole negative, vignette and all — chosen
from the six candidates in favicon-croppings.html. Corners are rounded to
14%, the same radius make-favicon.py gives the site-wide "TS" monogram, so
the two sit together in a bookmark list without one looking rounder.

    python3 design-comps/bake-icons.py     # needs Pillow

Writes favicon-16.png, favicon-32.png, favicon-48.png and
apple-touch-icon.png into jimmy/. Output is committed; this is not part of
the build. Needs the git-ignored original scan in jimmy/.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "lights0113x13b.jpg"

CROP = (0.00, 0.01, 1.00, 0.99)   # candidate A, as a share of the full frame
RADIUS = 0.14                     # share of the edge length
SUPERSAMPLE = 4                   # for the corner mask, so the arc stays clean


def square(im):
    """Centre-cut to a square without distorting."""
    s = min(im.size)
    left, top = (im.width - s) // 2, (im.height - s) // 2
    return im.crop((left, top, left + s, top + s))


def scale(tile, px, sharpen):
    """Downscale, and put back the edge the downscale takes off.

    The photograph is bokeh — soft to begin with — and at 16 px a plain
    Lanczos reduction leaves it muddy. A light unsharp mask is what keeps
    the lamps reading as separate lamps.
    """
    out = tile.resize((px, px), Image.LANCZOS)
    if sharpen:
        out = out.filter(ImageFilter.UnsharpMask(radius=1.0, percent=55, threshold=2))
    return out


def rounded(img):
    """Round the corners to RADIUS, with real transparency outside the arc."""
    size = img.size[0]
    big = size * SUPERSAMPLE
    mask = Image.new("L", (big, big), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, big - 1, big - 1], radius=int(big * RADIUS), fill=255)
    out = img.convert("RGBA")
    out.putalpha(mask.resize((size, size), Image.LANCZOS))
    return out


def main():
    src = Image.open(SRC).convert("RGB")
    w, h = src.size
    tile = square(src.crop((int(CROP[0] * w), int(CROP[1] * h),
                            int(CROP[2] * w), int(CROP[3] * h))))

    for px in (16, 32, 48):
        dst = ROOT / f"favicon-{px}.png"
        rounded(scale(tile, px, sharpen=True)).save(dst, optimize=True)
        print("wrote %s (%d px, %.1f KB)" % (dst.name, px, dst.stat().st_size / 1e3))

    # Square and opaque, unlike the others: iOS masks apple-touch-icon into
    # its own squircle and composites any alpha onto black, so rounding it
    # here would only punch black notches inside that mask.
    dst = ROOT / "apple-touch-icon.png"
    scale(tile, 180, sharpen=False).save(dst, optimize=True)
    print("wrote %s (180 px, %.1f KB)" % (dst.name, dst.stat().st_size / 1e3))


if __name__ == "__main__":
    main()
