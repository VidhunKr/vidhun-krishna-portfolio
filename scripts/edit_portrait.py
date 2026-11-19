"""
Pixel-preserving portrait edit for the portfolio.
Keeps the original subject (face, hair, clothing) intact.
Only changes background, grading, framing, and output format.
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageOps
from rembg import remove

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "images" / "portrait-original.jpg"
OUT_JPG = ROOT / "assets" / "images" / "portrait-hero.jpg"
OUT_WEBP = ROOT / "assets" / "images" / "portrait-hero.webp"
OUT_ABOUT = ROOT / "assets" / "images" / "portrait-about.webp"


def make_studio_background(size: tuple[int, int]) -> Image.Image:
    w, h = size
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    # Soft radial studio light — charcoal base #101010 with cool accent
    cx, cy = w * 0.42, h * 0.28
    dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    dist /= dist.max()

    base = np.array([16, 16, 16], dtype=np.float32)  # #101010
    lift = np.array([29, 29, 32], dtype=np.float32)  # #1d1d1d lift
    accent = np.array([24, 32, 48], dtype=np.float32)  # subtle muted blue

    radial = np.clip(1.0 - dist * 1.2, 0, 1)[..., None]
    accent_mask = np.clip(
        1.0 - np.sqrt(((xx - w * 0.82) / w) ** 2 + ((yy - h * 0.18) / h) ** 2) * 1.75, 0, 1
    )[..., None]

    rgb = base + lift * radial * 0.7 + accent * accent_mask * 0.35
    rgb = np.clip(rgb, 0, 255).astype(np.uint8)
    bg = Image.fromarray(rgb, "RGB")
    return bg.filter(ImageFilter.GaussianBlur(radius=22))


def grade_subject(rgba: Image.Image) -> Image.Image:
    """Gentle cinematic grade without reshaping identity."""
    rgb = rgba.convert("RGB")
    alpha = rgba.getchannel("A")

    rgb = ImageEnhance.Contrast(rgb).enhance(1.08)
    rgb = ImageEnhance.Color(rgb).enhance(0.92)  # slightly desaturate warm beige cast
    rgb = ImageEnhance.Brightness(rgb).enhance(0.97)
    rgb = ImageEnhance.Sharpness(rgb).enhance(1.12)

    # Cool midtone shift toward portfolio palette (subtle)
    arr = np.asarray(rgb).astype(np.float32)
    arr[..., 0] = arr[..., 0] * 0.97 + 2  # ease warm reds
    arr[..., 2] = np.clip(arr[..., 2] * 1.04 + 4, 0, 255)  # soft blue lift in shadows
    rgb = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB")

    out = rgb.convert("RGBA")
    out.putalpha(alpha)
    return out


def soft_edge(alpha: Image.Image, blur: float = 0.8) -> Image.Image:
    # Slight erode via min filter to reduce bright fringe, then soft feather
    a = alpha.filter(ImageFilter.MinFilter(size=3))
    return a.filter(ImageFilter.GaussianBlur(radius=blur))


def add_vignette(img: Image.Image, strength: float = 0.35) -> Image.Image:
    w, h = img.size
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    cx, cy = w / 2, h / 2
    dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    dist /= dist.max()
    vignette = 1.0 - (dist**1.6) * strength
    arr = np.asarray(img).astype(np.float32)
    arr *= vignette[..., None]
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB")


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Missing source: {SRC}")

    original = Image.open(SRC).convert("RGB")
    # Upscale gently for sharper portfolio display
    target_w = 1200
    scale = target_w / original.width
    target_h = int(original.height * scale)
    upscaled = original.resize((target_w, target_h), Image.Resampling.LANCZOS)

    cutout = remove(upscaled)  # RGBA, subject pixels preserved from source
    cutout = grade_subject(cutout)
    alpha = soft_edge(cutout.getchannel("A"), blur=1.4)
    cutout.putalpha(alpha)

    # Editorial crop padding around subject
    pad = int(target_w * 0.04)
    canvas_size = (target_w + pad * 2, target_h + pad * 2)
    background = make_studio_background(canvas_size)

    composed = background.copy()
    composed.paste(cutout, (pad, pad), cutout)

    # Soft contact shadow under subject for depth
    shadow = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
    shadow_layer = Image.new("L", canvas_size, 0)
    # Approximate oval shadow near lower third
    from PIL import ImageDraw

    draw = ImageDraw.Draw(shadow_layer)
    cx, cy = canvas_size[0] // 2, int(canvas_size[1] * 0.88)
    draw.ellipse((cx - 220, cy - 36, cx + 220, cy + 36), fill=110)
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(28))
    shadow.putalpha(shadow_layer)
    composed = Image.alpha_composite(composed.convert("RGBA"), shadow).convert("RGB")
    # Re-paste subject above shadow
    composed.paste(cutout.convert("RGB"), (pad, pad), cutout)

    composed = add_vignette(composed, strength=0.28)
    composed = ImageEnhance.Contrast(composed).enhance(1.04)

    # Final framed output — slight asymmetric crop for editorial feel
    w, h = composed.size
    left = int(w * 0.02)
    right = int(w * 0.98)
    top = int(h * 0.01)
    bottom = int(h * 0.99)
    framed = composed.crop((left, top, right, bottom))

    framed.save(OUT_JPG, "JPEG", quality=92, optimize=True)
    framed.save(OUT_WEBP, "WEBP", quality=90, method=6)
    framed.save(OUT_ABOUT, "WEBP", quality=90, method=6)

    print(f"Saved {OUT_JPG}")
    print(f"Saved {OUT_WEBP}")
    print(f"Saved {OUT_ABOUT}")
    print(f"Size: {framed.size}")


if __name__ == "__main__":
    main()
