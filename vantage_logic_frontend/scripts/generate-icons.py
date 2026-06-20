"""Generate PNG icons for favicon/manifest from brand colors."""
from pathlib import Path

try:
    from PIL import Image, ImageDraw
except ImportError:
    raise SystemExit("Install Pillow: pip install Pillow")

ROOT = Path(__file__).resolve().parents[1] / "public"
PRIMARY = (26, 61, 43)
GOLD = (200, 151, 58)
WHITE = (255, 255, 255)


def draw_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    pad = max(1, size // 16)
    radius = max(4, size // 4)
    draw.rounded_rectangle((pad, pad, size - pad, size - pad), radius=radius, fill=PRIMARY)

    cx = size / 2
    base_y = size * 0.78
    peak_y = size * 0.22
    left_x = size * 0.18
    right_x = size * 0.82

    draw.line([(left_x, base_y), (cx, peak_y), (right_x, base_y)], fill=GOLD, width=max(2, size // 14))
    inner_left = size * 0.32
    inner_right = size * 0.68
    inner_peak = size * 0.48
    draw.line([(inner_left, base_y), (cx, inner_peak), (inner_right, base_y)], fill=(*WHITE, 120), width=max(1, size // 22))

    dot = max(3, size // 8)
    draw.rounded_rectangle(
        (cx - dot / 2, peak_y - dot * 0.2, cx + dot / 2, peak_y - dot * 0.2 + dot),
        radius=max(1, dot // 4),
        fill=GOLD,
    )
    draw.line([(left_x, base_y), (right_x, base_y)], fill=GOLD, width=max(1, size // 20))
    return img


def main():
    ROOT.mkdir(parents=True, exist_ok=True)
    for name, size in [("logo192.png", 192), ("logo512.png", 512), ("apple-touch-icon.png", 180)]:
        draw_icon(size).save(ROOT / name, format="PNG")

    ico_sizes = [(16, 16), (32, 32), (48, 48)]
    imgs = [draw_icon(s).convert("RGBA") for s, _ in [(16, 16), (32, 32), (48, 48)]]
    imgs[0].save(
        ROOT / "favicon.ico",
        format="ICO",
        sizes=[(im.width, im.height) for im in imgs],
        append_images=imgs[1:],
    )
    print("Generated icons in", ROOT)


if __name__ == "__main__":
    main()
