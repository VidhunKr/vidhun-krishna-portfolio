"""Generate PNG/ICO favicons from the VK monogram geometry."""

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "favicon"
OUT.mkdir(parents=True, exist_ok=True)


def draw_vk(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Background rounded square
    pad = max(1, size // 32)
    radius = max(4, size // 4.5)
    bg = (16, 16, 16, 255)
    stroke = (91, 140, 255, 255)
    draw.rounded_rectangle([pad, pad, size - pad - 1, size - pad - 1], radius=radius, fill=bg)
    draw.rounded_rectangle(
        [pad, pad, size - pad - 1, size - pad - 1],
        radius=radius,
        outline=stroke,
        width=max(1, size // 28),
    )

    # Coordinate helper in 64-space
    def s(x, y=None):
        if y is None:
            return x * size / 64
        return (x * size / 64, y * size / 64)

    # V polygon (bold)
    v = [
        s(10, 15),
        s(19, 15),
        s(28, 43),
        s(32, 31),
        s(40, 31),
        s(28, 49),
        s(20, 49),
    ]
    draw.polygon(v, fill=(232, 238, 248, 255))

    # K polygon as two shapes: stem + arms via polygon union-ish
    stem = [s(36, 15), s(44, 15), s(44, 49), s(36, 49)]
    draw.polygon(stem, fill=(245, 247, 251, 255))
    upper = [s(44, 15), s(53, 15), s(62, 15), s(49, 32), s(44, 29)]
    # simplify upper arm
    upper = [s(44, 15), s(62, 15), s(49, 32), s(44, 29)]
    draw.polygon(upper, fill=(143, 180, 255, 255))
    lower = [s(44, 35), s(49, 32), s(62, 49), s(53, 49), s(44, 39)]
    draw.polygon(lower, fill=(91, 140, 255, 255))

    return img


def main() -> None:
    sizes = {
        "favicon-16x16.png": 16,
        "favicon-32x32.png": 32,
        "apple-touch-icon.png": 180,
        "android-chrome-192x192.png": 192,
        "android-chrome-512x512.png": 512,
    }

    for name, size in sizes.items():
        draw_vk(size).save(OUT / name, optimize=True)
        print("saved", name)

    # ICO with multiple sizes
    ico_sizes = [16, 32, 48]
    images = [draw_vk(s) for s in ico_sizes]
    images[0].save(
        OUT / "favicon.ico",
        format="ICO",
        sizes=[(s, s) for s in ico_sizes],
        append_images=images[1:],
    )
    print("saved favicon.ico")


if __name__ == "__main__":
    main()
