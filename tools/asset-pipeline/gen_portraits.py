#!/usr/bin/env python3
"""Generate 128×128 portrait PNG files for all NPCs used in dialogue."""
from PIL import Image, ImageDraw, ImageFilter
import os

SPRITES = 'monkey-island-web/public/assets/sprites'
PORTRAITS_OUT = 'monkey-island-web/public/assets/portraits'
os.makedirs(PORTRAITS_OUT, exist_ok=True)

def crop_sprite_portrait(sprite_path: str, out_path: str,
                          face_rect=None, size=(128, 128)):
    """Crop a face region from a sprite and save as portrait."""
    img = Image.open(sprite_path).convert('RGBA')
    w, h = img.size

    if face_rect is None:
        # Default: center-top quarter (face area)
        x0 = w // 4
        y0 = h // 8
        x1 = 3 * w // 4
        y1 = h // 2
        face_rect = (x0, y0, x1, y1)

    cropped = img.crop(face_rect).resize(size, Image.NEAREST)

    # Add dark background for transparent areas
    bg = Image.new('RGBA', size, (26, 10, 0, 255))
    bg.paste(cropped, mask=cropped if cropped.mode == 'RGBA' else None)
    bg.convert('RGB').save(out_path)
    print(f'  {os.path.basename(out_path)} ← {os.path.basename(sprite_path)} (crop {face_rect})')


def make_portrait_from_small_sprite(sprite_path: str, out_path: str, size=(128, 128)):
    """Scale up small (128×192) sprites to 128×128 portrait, focusing on upper body."""
    img = Image.open(sprite_path).convert('RGBA')
    w, h = img.size  # 128×192

    # Take upper 2/3 (head + upper body)
    crop_h = int(h * 0.65)
    cropped = img.crop((0, 0, w, crop_h))

    # Scale to output size
    scaled = cropped.resize(size, Image.NEAREST)

    bg = Image.new('RGBA', size, (26, 10, 0, 255))
    bg.paste(scaled, mask=scaled)
    bg.convert('RGB').save(out_path)
    print(f'  {os.path.basename(out_path)} ← {os.path.basename(sprite_path)} (upper body)')


def make_procedural_portrait(out_path: str, colors: dict, expression: str = 'neutral'):
    """Generate a simple procedural pixel-art face portrait."""
    size = 128
    img = Image.new('RGB', (size, size), colors['bg'])
    draw = ImageDraw.Draw(img)

    # Head
    hx, hy = size // 2, size // 2 - 10
    hr = 28
    draw.ellipse([hx-hr, hy-hr, hx+hr, hy+hr], fill=colors['skin'])

    # Hair
    hair_r = hr + 4
    draw.ellipse([hx-hair_r, hy-hair_r, hx+hair_r, hy-hr+8], fill=colors['hair'])

    # Eyes
    eye_y = hy - 8
    ew = 5
    draw.rectangle([hx-16, eye_y-ew//2, hx-16+ew, eye_y+ew//2], fill=colors['eyes'])
    draw.rectangle([hx+11, eye_y-ew//2, hx+11+ew, eye_y+ew//2], fill=colors['eyes'])

    # Eyebrows
    brow_y = eye_y - 8
    if colors.get('stern'):
        # Angled brows for stern look
        draw.line([hx-18, brow_y+2, hx-11, brow_y-2], fill=colors['hair'], width=2)
        draw.line([hx+13, brow_y-2, hx+20, brow_y+2], fill=colors['hair'], width=2)
    else:
        draw.rectangle([hx-18, brow_y, hx-10, brow_y+2], fill=colors['hair'])
        draw.rectangle([hx+11, brow_y, hx+19, brow_y+2], fill=colors['hair'])

    # Nose
    draw.rectangle([hx-1, hy-2, hx+1, hy+4], fill=colors.get('nose', colors['skin']))
    draw.ellipse([hx-5, hy+2, hx, hy+7], fill=colors.get('nose', colors['skin']))
    draw.ellipse([hx, hy+2, hx+5, hy+7], fill=colors.get('nose', colors['skin']))

    # Mouth
    m_y = hy + 14
    if expression == 'happy':
        draw.arc([hx-10, m_y-4, hx+10, m_y+6], 0, 180, fill=colors.get('mouth', '#cc6644'), width=2)
    elif expression == 'stern':
        draw.line([hx-8, m_y, hx+8, m_y], fill=colors.get('mouth', '#cc4422'), width=2)
    elif expression == 'sad':
        draw.arc([hx-10, m_y, hx+10, m_y+10], 180, 360, fill=colors.get('mouth', '#cc6644'), width=2)
    else:
        draw.line([hx-6, m_y, hx+6, m_y], fill=colors.get('mouth', '#cc6644'), width=2)

    # Shoulders/body
    body_top = hy + hr + 2
    draw.rectangle([hx-30, body_top, hx+30, size], fill=colors['shirt'])

    # Neck
    draw.rectangle([hx-8, hy+hr-4, hx+8, body_top+4], fill=colors['skin'])

    img.save(out_path)
    print(f'  {os.path.basename(out_path)} (procedural)')


# ── Generate missing portraits ────────────────────────────────

# guybrush.png — from guybrush_idle.png (1024×1024, AI art, face in upper-center)
crop_sprite_portrait(
    f'{SPRITES}/guybrush_idle.png',
    f'{PORTRAITS_OUT}/guybrush.png',
    face_rect=(340, 50, 680, 500),
)

# voodoo_lady.png
crop_sprite_portrait(
    f'{SPRITES}/voodoo_lady.png',
    f'{PORTRAITS_OUT}/voodoo_lady.png',
    face_rect=(340, 50, 680, 480),
)

# bartender.png
crop_sprite_portrait(
    f'{SPRITES}/bartender.png',
    f'{PORTRAITS_OUT}/bartender.png',
    face_rect=(340, 50, 680, 480),
)

# three_pirates.png — use lechuck sprite as placeholder
crop_sprite_portrait(
    f'{SPRITES}/lechuck_idle.png',
    f'{PORTRAITS_OUT}/three_pirates.png',
    face_rect=(300, 50, 720, 500),
)

# carla.png — from carla_idle.png (128×192 small pixel art sprite)
make_portrait_from_small_sprite(
    f'{SPRITES}/carla_idle.png',
    f'{PORTRAITS_OUT}/carla.png',
)

# stan.png
make_portrait_from_small_sprite(
    f'{SPRITES}/stan_idle.png',
    f'{PORTRAITS_OUT}/stan.png',
)

# otis.png
make_portrait_from_small_sprite(
    f'{SPRITES}/otis_idle.png',
    f'{PORTRAITS_OUT}/otis.png',
)

# sheriff.png
make_portrait_from_small_sprite(
    f'{SPRITES}/sheriff_idle.png',
    f'{PORTRAITS_OUT}/sheriff.png',
)

# mansion_guard.png — procedural (no sprite yet)
make_procedural_portrait(
    f'{PORTRAITS_OUT}/mansion_guard.png',
    {
        'bg': '#1a0a00',
        'skin': '#c8a888',
        'hair': '#443322',
        'eyes': '#223355',
        'shirt': '#2c2c6e',
        'mouth': '#995544',
        'stern': True,
    },
    expression='stern',
)

print('\nAll portraits generated.')
