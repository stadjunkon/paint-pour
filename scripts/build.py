"""Собирает index.html: подставляет фото (base64) вместо плейсхолдера __IMG__ в исходнике.

Использование:
    python3 scripts/build.py [исходник] [фото] [результат]
По умолчанию: src/paint-pour.src.html + assets/photo.jpg -> index.html
"""
import base64
import pathlib
import sys

root = pathlib.Path(__file__).resolve().parent.parent
src = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else root / "src" / "paint-pour.src.html"
img = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else root / "assets" / "photo.jpg"
out = pathlib.Path(sys.argv[3]) if len(sys.argv) > 3 else root / "index.html"

html = src.read_text(encoding="utf-8")
if "__IMG__" not in html:
    sys.exit(f"В {src} нет плейсхолдера __IMG__")
out.write_text(html.replace("__IMG__", base64.b64encode(img.read_bytes()).decode()), encoding="utf-8")
print(f"{out} ({out.stat().st_size // 1024} KB)")
