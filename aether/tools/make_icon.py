from pathlib import Path
from PIL import Image

source = Path('/home/ubuntu/phoenix-aether-stage/assets/phoenix-aether-logo-transparent.png')
out = Path('/home/ubuntu/phoenix-aether-stage/assets/phoenix-aether.ico')
image = Image.open(source).convert('RGBA')
assert image.width == image.height and image.width >= 1024
# The renderer preview shows a light checkerboard baked into the generated PNG.
# Phoenix uses orange and black, so remove only near-neutral light checkerboard pixels.
pixels = image.load()
for y in range(image.height):
    for x in range(image.width):
        r, g, b, _ = pixels[x, y]
        if min(r, g, b) >= 210 and max(r, g, b) - min(r, g, b) <= 24:
            pixels[x, y] = (r, g, b, 0)
alpha = image.getchannel('A')
assert alpha.getextrema()[0] == 0, f'Expected transparent background, got {alpha.getextrema()}'
assert alpha.getextrema()[1] > 0, 'Expected visible logo'
# Preserve the square canvas and use high-quality downsampling for Windows icon sizes.
image.save(out, format='ICO', sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
print(f'created {out} from {image.size[0]}x{image.size[1]} RGBA source')
print(f'alpha range: {alpha.getextrema()}')
