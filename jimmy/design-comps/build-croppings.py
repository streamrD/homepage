"""Rebuild favicon-croppings.html from the template and the original scan.

The scan is git-ignored, so the built page ships with every crop already
inlined as a data URI. Run this only to change the candidates or the layout:

    python3 design-comps/build-croppings.py     # needs Pillow
"""
import base64
import io
import json
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
SRC = ROOT / "lights0113x13b.jpg"

# (key, label, x0, y0, x1, y1) — the box as a share of the full frame
CROPS = [
    ("a", "Full frame", 0.00, 0.01, 1.00, 0.99),
    ("b", "Green + gold", 0.04, 0.30, 0.56, 0.83),
    ("c", "Yellow + rose", 0.54, 0.14, 1.00, 0.61),
    ("d", "Blue core", 0.22, 0.22, 0.70, 0.71),
    ("e", "Gold pop", 0.17, 0.54, 0.54, 0.92),
    ("f", "Red heart", 0.30, 0.33, 0.72, 0.76),
]


def square(im):
    """Centre-cut to a square without distorting."""
    s = min(im.size)
    left, top = (im.width - s) // 2, (im.height - s) // 2
    return im.crop((left, top, left + s, top + s))


def uri(im, fmt):
    buf = io.BytesIO()
    if fmt == "jpeg":
        im.save(buf, "JPEG", quality=88, subsampling=0)
    else:
        im.save(buf, "PNG")
    return f"data:image/{fmt};base64," + base64.b64encode(buf.getvalue()).decode()


src = Image.open(SRC).convert("RGB")
W, H = src.size
assets = {}

for key, label, x0, y0, x1, y1 in CROPS:
    tile = square(src.crop((int(x0 * W), int(y0 * H), int(x1 * W), int(y1 * H))))
    assets[key] = {
        "label": label,
        "rect": [x0, y0, x1, y1],
        "big": uri(tile.resize((256, 256), Image.LANCZOS), "jpeg"),
        "s32": uri(tile.resize((32, 32), Image.LANCZOS), "png"),
        "s16": uri(tile.resize((16, 16), Image.LANCZOS), "png"),
    }

# the icon the site shipped before this study, for comparison
cur = Image.open(HERE / "favicon-2026-08-before.png").convert("RGB")
assets["z"] = {
    "label": "Previous icon",
    "rect": None,
    "big": uri(cur.resize((256, 256), Image.LANCZOS), "jpeg"),
    "s32": uri(cur.resize((32, 32), Image.LANCZOS), "png"),
    "s16": uri(cur.resize((16, 16), Image.LANCZOS), "png"),
}

assets["_source"] = uri(src.resize((520, 527), Image.LANCZOS), "jpeg")

page = (HERE / "favicon-croppings.template.html").read_text()
out = HERE / "favicon-croppings.html"
out.write_text(page.replace("__ASSETS__", json.dumps(assets)))
print(f"{out.name} — {out.stat().st_size / 1024:.0f} KB")
