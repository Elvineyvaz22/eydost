"""
Regenerate all site icons from public/logo.png (full Ey Dost mark).

Every favicon / PWA icon is a scaled copy of the same asset as the header.
Run after updating logo.png or logo-source.png:

  Copy-Item public/logo-source.png public/logo.png -Force
  python scripts/generate-favicons.py
"""
from __future__ import annotations

from pathlib import Path
import shutil

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "logo-source.png"
LOGO = ROOT / "public" / "logo.png"
OUT = ROOT / "public"

WHITE_THRESHOLD = 235
PAD_RATIO = 0.06

OUTPUTS: list[tuple[int, str]] = [
    (16, "favicon-16.png"),
    (32, "favicon-32.png"),
    (48, "favicon-48.png"),
    (48, "favicon.png"),
    (180, "apple-touch-icon.png"),
    (192, "icon-192.png"),
    (512, "icon-512.png"),
]


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


def fit_logo(im: Image.Image, size: int) -> Image.Image:
    """Scale full logo to fit in size×size with padding; transparent background."""
    pad = max(2, int(size * PAD_RATIO))
    inner = size - pad * 2
    w, h = im.size
    scale = min(inner / w, inner / h)
    nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
    resized = im.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ox = (size - nw) // 2
    oy = (size - nh) // 2
    canvas.paste(resized, (ox, oy), resized)
    return canvas


def main() -> None:
    if SRC.exists():
        shutil.copy2(SRC, LOGO)
    if not LOGO.exists():
        raise SystemExit(f"Missing {LOGO}")

    base = white_to_transparent(Image.open(LOGO))
    for size, name in OUTPUTS:
        out = fit_logo(base, size)
        out.save(OUT / name, "PNG", optimize=True)
        print(f"wrote {name} ({size}px)")

    print("Done — all icons match logo.png")


if __name__ == "__main__":
    main()
