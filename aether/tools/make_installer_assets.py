from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

root = Path('/home/ubuntu/phoenix-aether-stage')
logo = Image.open(root / 'assets/phoenix-aether-logo-transparent.png').convert('RGBA')

def gradient(size):
    width, height = size
    canvas = Image.new('RGB', size)
    pixels = canvas.load()
    for y in range(height):
        for x in range(width):
            t = (x / max(1, width - 1)) * 0.65 + (y / max(1, height - 1)) * 0.35
            r = int(5 + 15 * t)
            g = int(11 + 14 * t)
            b = int(16 + 12 * t)
            pixels[x, y] = (r, g, b)
    return canvas

def make_sidebar(path):
    size = (164, 314)
    canvas = gradient(size).convert('RGBA')
    glow = Image.new('RGBA', size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(glow)
    for radius in range(80, 4, -4):
        alpha = int(2 + (80 - radius) * 0.45)
        draw.ellipse((82-radius, 112-radius, 82+radius, 112+radius), fill=(244, 103, 50, alpha))
    glow = glow.filter(ImageFilter.GaussianBlur(18))
    canvas.alpha_composite(glow)
    mark = logo.copy()
    mark.thumbnail((142, 142), Image.Resampling.LANCZOS)
    canvas.alpha_composite(mark, ((size[0] - mark.width) // 2, 84))
    canvas.convert('RGB').save(path, 'BMP')

def make_header(path):
    size = (150, 57)
    canvas = gradient(size).convert('RGBA')
    mark = logo.copy()
    mark.thumbnail((44, 44), Image.Resampling.LANCZOS)
    canvas.alpha_composite(mark, (96, 7))
    canvas.convert('RGB').save(path, 'BMP')

make_sidebar(root / 'assets' / 'installer-sidebar.bmp')
make_header(root / 'assets' / 'installer-header.bmp')
print('created installer-sidebar.bmp and installer-header.bmp')
