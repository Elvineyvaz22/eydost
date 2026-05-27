"""Remove white/near-white background from all site icons (RGBA + transparent)."""
from __future__ import annotations

import base64
import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PUB = ROOT / "public"
WHITE_THRESHOLD = 235

FILES = [
    "favicon-16.png",
    "favicon-32.png",
    "favicon-48.png",
    "favicon-96.png",
    "favicon-96x96.png",
    "favicon.png",
    "apple-touch-icon.png",
    "icon-192.png",
    "icon-512.png",
    "logo.png",
    "logo-source.png",
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


def save_ico_from_96() -> None:
    src = PUB / "favicon-96x96.png"
    im = Image.open(src).convert("RGBA")
    sizes = [16, 32, 48]
    icons = [im.resize((s, s), Image.Resampling.LANCZOS) for s in sizes]
    icons[0].save(
        PUB / "favicon.ico",
        format="ICO",
        sizes=[(i.width, i.height) for i in icons],
        append_images=icons[1:],
    )


def save_svg_from_96() -> None:
    src = PUB / "favicon-96x96.png"
    b64 = base64.standard_b64encode(src.read_bytes()).decode("ascii")
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" '
        'xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 96 96">\n'
        f'<image width="96" height="96" xlink:href="data:image/png;base64,{b64}"/>\n'
        "</svg>\n"
    )
    (PUB / "favicon.svg").write_text(svg, encoding="utf-8")


def main() -> None:
    for name in FILES:
        path = PUB / name
        if not path.exists():
            print("skip (missing)", name)
            continue
        out = white_to_transparent(Image.open(path))
        out.save(path, "PNG", optimize=True)
        corner = out.getpixel((0, 0))
        print(name, "corner alpha =", corner[3])

    if (PUB / "favicon-96.png").exists():
        shutil.copy2(PUB / "favicon-96.png", PUB / "favicon-96x96.png")

    save_ico_from_96()
    save_svg_from_96()
    print("OK: transparent icons + favicon.ico + favicon.svg")


if __name__ == "__main__":
    main()
