"""Build favicon.ico, favicon.svg, favicon-96x96.png from public/favicon-96.png."""
from __future__ import annotations

import base64
import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PUB = ROOT / "public"
SRC = PUB / "favicon-96.png"


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Missing {SRC}")

    shutil.copy2(SRC, PUB / "favicon-96x96.png")

    im = Image.open(SRC).convert("RGBA")
    sizes = [16, 32, 48]
    icons = [im.resize((s, s), Image.Resampling.LANCZOS) for s in sizes]
    icons[0].save(
        PUB / "favicon.ico",
        format="ICO",
        sizes=[(i.width, i.height) for i in icons],
        append_images=icons[1:],
    )

    b64 = base64.standard_b64encode(SRC.read_bytes()).decode("ascii")
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" '
        'xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 96 96">\n'
        f'<image width="96" height="96" xlink:href="data:image/png;base64,{b64}"/>\n'
        "</svg>\n"
    )
    (PUB / "favicon.svg").write_text(svg, encoding="utf-8")
    print("OK: favicon-96x96.png, favicon.ico, favicon.svg")


if __name__ == "__main__":
    main()
