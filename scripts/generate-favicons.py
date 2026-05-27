"""
Site icons are designed exports (RealFaviconGenerator-style), not auto-cropped.

Header uses public/logo.png (full mark with EYDOST text).
Favicons use the transparent bubble set in public/ (favicon-*.png, icon-*.png).

To replace icons: drop new PNGs into public/ with the same filenames, or
copy from assets/ after exporting from your favicon tool, then commit.

Optional: resize 16/32 from favicon-96.png:
  python -c "from PIL import Image; ..."
"""

from __future__ import annotations

print(
    "Icons are maintained as static files in public/. "
    "Update favicon-48.png, favicon-96.png, apple-touch-icon.png, "
    "icon-192.png, icon-512.png manually."
)
