import re
import base64
from PIL import Image

svg_path = r"C:\chowza v2\src\public\favicon.svg"
webp_path = r"C:\chowza v2\src\public\favicon-temp.webp"
png_path = r"C:\chowza v2\src\public\favicon.png"

with open(svg_path, "r", encoding="utf-8") as f:
    svg = f.read()

match = re.search(r'data:image/webp;base64,([^"]+)', svg)

if not match:
    raise RuntimeError("Embedded WebP image was not found.")

data = base64.b64decode(match.group(1))

with open(webp_path, "wb") as f:
    f.write(data)

image = Image.open(webp_path).convert("RGBA")
image = image.resize((64, 64), Image.Resampling.LANCZOS)
image.save(png_path)

print("favicon.png created successfully")