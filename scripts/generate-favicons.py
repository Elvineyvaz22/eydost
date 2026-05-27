"""
Regenerate favicons from public/logo-source.png.

Does NOT touch public/logo.png — that file is the full header mark (icon + EYDOST
text). Copy logo-source.png → logo.png manually when the master asset changes.

Outputs (all transparent, icon-only bubble):
  favicon-16/32/48.png, favicon.png, apple-touch-icon.png, icon-192.png, icon-512.png
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "logo-source.png"
OUT = ROOT / "public"

WHITE_THRESHOLD = 235
ICON_TOP_RATIO = 0.54  # exclude wordmark below bubble
PAD_RATIO = 0.14


def white_to_transparent(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r >= WHITE_THRESHOLD and g >= WHITE_THRESHOLD and b >= WHITE_THRESHOLD:
                px[x, y] = (r, g, b, 0)
    return im


def extract_icon_mark(im: Image.Image) -> Image.Image:
    w, h = im.size
    zone = im.crop((0, 0, w, int(h * ICON_TOP_RATIO)))
    bbox = zone.getbbox()
    if not bbox:
        return zone
    icon = zone.crop(bbox)
    side = max(icon.size)
    pad = max(4, int(side * PAD_RATIO))
    canvas_side = side + pad * 2
    canvas = Image.new("RGBA", (canvas_side, canvas_side), (0, 0, 0, 0))
    ox = (canvas_side - icon.width) // 2
    oy = (canvas_side - icon.height) // 2
    canvas.paste(icon, (ox, oy), icon)
    return canvas


def save_png(img: Image.Image, path: Path, size: int) -> None:
    out = img.resize((size, size), Image.Resampling.LANCZOS)
    out.save(path, "PNG", optimize=True)


def main() -> None:
    src = white_to_transparent(Image.open(SRC))
    icon = extract_icon_mark(src)

    for size, name in [(16, "favicon-16.png"), (32, "favicon-32.png"), (48, "favicon-48.png")]:
        save_png(icon, OUT / name, size)
    save_png(icon, OUT / "favicon.png", 48)

    for size, name in [(180, "apple-touch-icon.png"), (192, "icon-192.png"), (512, "icon-512.png")]:
        save_png(icon, OUT / name, size)

    print("Favicons written to", OUT)


if __name__ == "__main__":
    main()
