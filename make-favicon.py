#!/usr/bin/env python3
"""Generate the site favicon: a two-tone "TS" monogram.

The mark echoes the lettering in detroit750.jpg — "Todd Stabley" in cream
above "home" in salmon — so the T is cream and the S is salmon. Set in
Rockwell Bold Italic, the closest slab serif to that oblique lettering;
the photograph's own type is baked into a JPEG, so there are no outlines
to reuse. Colours are sampled from the image.

    python3 make-favicon.py

Writes favicon.ico (16/32/48 packed), favicon-32.png and
apple-touch-icon.png. Output is committed; this is not part of the build.

Requires macOS (sips) and Chrome, since it renders the type and Rockwell
is a local font.
"""

import pathlib
import shutil
import struct
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

CREAM = "#F2E1C4"    # "Todd Stabley" in the photograph
SALMON = "#C2643F"   # "home" in the photograph
INK = "#141414"

# Rendered at 4x and downscaled — sharper than asking Chrome to set 16px type.
SUPERSAMPLE = 4
ICO_SIZES = [16, 32, 48]
PNG_OUTPUTS = [(32, "favicon-32.png"), (180, "apple-touch-icon.png")]


def page(size):
    return (
        "<!doctype html><meta charset=utf-8><style>"
        "html,body{margin:0;background:transparent}"
        ".t{width:%(s)dpx;height:%(s)dpx;border-radius:%(r).2fpx;background:%(ink)s;"
        "display:flex;align-items:center;justify-content:center;"
        "font-family:Rockwell,'Rockwell Std',Georgia,serif;font-style:italic;font-weight:700;"
        "font-size:%(f).2fpx;line-height:1;letter-spacing:-.02em}"
        "</style><div class=t><span style='color:%(cream)s'>T</span>"
        "<span style='color:%(salmon)s'>S</span></div>"
        % {"s": size, "r": size * 0.14, "f": size * 0.66,
           "ink": INK, "cream": CREAM, "salmon": SALMON}
    )


def render(size, dst):
    """Render the tile at SUPERSAMPLE x, then downscale to `size`."""
    big = size * SUPERSAMPLE
    html = ROOT / "_icon.html"
    html.write_text(page(big))
    subprocess.run([
        CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
        "--window-size=%d,%d" % (big, big),
        "--default-background-color=00000000",
        "--screenshot=%s" % dst, "--virtual-time-budget=3000", html.as_uri(),
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    html.unlink()
    subprocess.run(["sips", "-z", str(size), str(size), str(dst)],
                   check=True, stdout=subprocess.DEVNULL)


def write_ico(pngs, dst):
    """Pack PNGs into an .ico.

    ICO can carry PNG payloads directly, which every browser in use reads,
    and it avoids hand-rolling BMP with its bottom-up rows and AND mask.
    """
    entries, blobs, offset = [], [], 6 + 16 * len(pngs)
    for size, path in pngs:
        data = path.read_bytes()
        entries.append(struct.pack(
            "<BBBBHHII",
            size if size < 256 else 0, size if size < 256 else 0,
            0, 0, 1, 32, len(data), offset))
        blobs.append(data)
        offset += len(data)
    dst.write_bytes(b"\x00\x00\x01\x00" + struct.pack("<H", len(pngs))
                    + b"".join(entries) + b"".join(blobs))


def main():
    if not pathlib.Path(CHROME).exists():
        sys.exit("Chrome not found at %s" % CHROME)
    if not shutil.which("sips"):
        sys.exit("sips not found (macOS only)")

    tmp = ROOT / "_ico"
    tmp.mkdir(exist_ok=True)
    try:
        packed = []
        for size in ICO_SIZES:
            p = tmp / ("%d.png" % size)
            render(size, p)
            packed.append((size, p))
        write_ico(packed, ROOT / "favicon.ico")
        print("wrote favicon.ico (%s px, %.1f KB)"
              % ("/".join(map(str, ICO_SIZES)), (ROOT / "favicon.ico").stat().st_size / 1e3))
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    for size, name in PNG_OUTPUTS:
        dst = ROOT / name
        render(size, dst)
        print("wrote %s (%d px, %.1f KB)" % (name, size, dst.stat().st_size / 1e3))


if __name__ == "__main__":
    main()
