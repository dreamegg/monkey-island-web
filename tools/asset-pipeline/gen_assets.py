"""
gen_assets.py — Pixel art asset generator for Korean SCUMM-style adventure game.
Generates 6 backgrounds (640x400) and 16 NPC sprite frames (128x192).
"""

from PIL import Image, ImageDraw
import os
import math
import random

# ── Output paths ──────────────────────────────────────────────────────────────
BASE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BG_DIR = os.path.join(BASE, "monkey-island-web", "public", "assets", "backgrounds")
SP_DIR = os.path.join(BASE, "monkey-island-web", "public", "assets", "sprites")
os.makedirs(BG_DIR, exist_ok=True)
os.makedirs(SP_DIR, exist_ok=True)

BG_W, BG_H = 640, 400
SP_W, SP_H = 128, 192

# ── Pixel helpers ─────────────────────────────────────────────────────────────

def px(draw, x, y, color, size=2):
    """Draw a chunky 'pixel' (size×size block)."""
    draw.rectangle([x, y, x+size-1, y+size-1], fill=color)


def rect(draw, x1, y1, x2, y2, color):
    if x1 > x2:
        x1, x2 = x2, x1
    if y1 > y2:
        y1, y2 = y2, y1
    if x1 == x2 or y1 == y2:
        return
    draw.rectangle([x1, y1, x2, y2], fill=color)


def hline(draw, x1, x2, y, color, size=2):
    for x in range(x1, x2, size):
        px(draw, x, y, color, size)


def vline(draw, x, y1, y2, color, size=2):
    for y in range(y1, y2, size):
        px(draw, x, y, color, size)


def dither(draw, x1, y1, x2, y2, c1, c2, axis='y', steps=None, psize=2):
    """Dithered gradient between two colors along an axis."""
    w = x2 - x1
    h = y2 - y1
    length = h if axis == 'y' else w
    if steps is None:
        steps = length // psize
    if steps == 0:
        return
    for i in range(steps):
        t = i / max(steps - 1, 1)
        # Blend color
        r = int(c1[0] + (c2[0]-c1[0])*t)
        g = int(c1[1] + (c2[1]-c1[1])*t)
        b = int(c1[2] + (c2[2]-c1[2])*t)
        blended = (r, g, b)
        alt_r = int(c1[0] + (c2[0]-c1[0])*min(t+1/steps, 1.0))
        alt_g = int(c1[1] + (c2[1]-c1[1])*min(t+1/steps, 1.0))
        alt_b = int(c1[2] + (c2[2]-c1[2])*min(t+1/steps, 1.0))
        alt = (alt_r, alt_g, alt_b)
        if axis == 'y':
            row_y = y1 + i * psize
            for xx in range(x1, x2, psize):
                use = blended if ((xx // psize + i) % 2 == 0) else alt
                draw.rectangle([xx, row_y, xx+psize-1, row_y+psize-1], fill=use)
        else:
            col_x = x1 + i * psize
            for yy in range(y1, y2, psize):
                use = blended if ((col_x // psize + yy // psize) % 2 == 0) else alt
                draw.rectangle([col_x, yy, col_x+psize-1, yy+psize-1], fill=use)


def draw_window_glow(draw, cx, cy, w, h, color_inner, color_outer, psize=2):
    """Draw a glowing window rectangle with dithered border."""
    rect(draw, cx - w//2, cy - h//2, cx + w//2, cy + h//2, color_inner)
    # dithered border halo
    bx1, by1 = cx - w//2 - psize*2, cy - h//2 - psize*2
    bx2, by2 = cx + w//2 + psize*2, cy + h//2 + psize*2
    for bx in range(bx1, bx2, psize):
        for by in range(by1, by2, psize):
            if bx < cx-w//2 or bx >= cx+w//2 or by < cy-h//2 or by >= cy+h//2:
                dist = max(abs(bx - cx) - w//2, abs(by - cy) - h//2, 0)
                if dist < psize*3 and (bx//psize + by//psize) % 2 == 0:
                    draw.rectangle([bx, by, bx+psize-1, by+psize-1], fill=color_outer)


# ══════════════════════════════════════════════════════════════════════════════
#  BACKGROUNDS
# ══════════════════════════════════════════════════════════════════════════════

def make_village_road():
    img = Image.new("RGB", (BG_W, BG_H))
    draw = ImageDraw.Draw(img)
    P = 2  # pixel size

    # Sky gradient (dark blue → purple-blue)
    SKY_TOP   = (18, 14, 48)
    SKY_MID   = (28, 22, 72)
    SKY_HOR   = (55, 35, 90)
    dither(draw, 0, 0, BG_W, 160, SKY_TOP, SKY_MID, 'y', psize=P)
    dither(draw, 0, 120, BG_W, 200, SKY_MID, SKY_HOR, 'y', psize=P)

    # Stars
    random.seed(42)
    for _ in range(60):
        sx = random.randrange(0, BG_W, P)
        sy = random.randrange(0, 100, P)
        c = random.choice([(240,240,200),(220,220,255),(255,255,240)])
        px(draw, sx, sy, c, P)

    # Moon
    cx, cy, mr = 560, 40, 18
    for my in range(cy-mr, cy+mr, P):
        for mx in range(cx-mr, cx+mr, P):
            if (mx-cx)**2 + (my-cy)**2 < mr**2:
                draw.rectangle([mx, my, mx+P-1, my+P-1], fill=(240, 240, 200))
    # moon craters (dither)
    for mx, my in [(550,36),(568,44),(556,50)]:
        if (mx-cx)**2 + (my-cy)**2 < (mr-2)**2:
            draw.rectangle([mx, my, mx+P-1, my+P-1], fill=(210,210,170))

    # Ground / road fill
    GROUND = (62, 52, 40)
    rect(draw, 0, 200, BG_W, BG_H, GROUND)

    # Cobblestone road (perspective trapezoid narrowing to horizon)
    ROAD_DARK  = (70, 65, 58)
    ROAD_MID   = (90, 82, 72)
    ROAD_LIGHT = (108, 98, 85)
    MORTAR     = (45, 42, 38)

    # Road shape: wide at bottom (x=120..520), narrow at horizon (x=280..360)
    horiz_y = 200
    for row in range(horiz_y, BG_H, P):
        t = (row - horiz_y) / (BG_H - horiz_y)
        left  = int(280 - t * 160)
        right = int(360 + t * 160)
        for col in range(left, right, P):
            # Alternate cobblestone pattern
            stone_x = (col - left) // (P*5)
            stone_y = (row - horiz_y) // (P*4)
            offset = (stone_y % 2) * (P*2)
            local_x = (col - left + offset) % (P*5)
            local_yy = (row - horiz_y) % (P*4)
            if local_x < P or local_yy < P:
                c = MORTAR
            elif local_x == P or local_yy == P:
                c = ROAD_DARK
            else:
                c = ROAD_MID if (stone_x + stone_y) % 2 == 0 else ROAD_LIGHT
            draw.rectangle([col, row, col+P-1, row+P-1], fill=c)

    # Sidewalks
    SIDE = (82, 75, 65)
    for row in range(horiz_y, BG_H, P):
        t = (row - horiz_y) / (BG_H - horiz_y)
        left  = int(280 - t * 160)
        right = int(360 + t * 160)
        # left sidewalk
        sl = int(120 - t * 110)
        rect(draw, sl, row, left-1, row+P-1, SIDE)
        # right sidewalk
        sr = int(520 + t * 110)
        rect(draw, right, row, min(sr, BG_W-1), row+P-1, SIDE)

    # === Left building ===
    BLDG_DARK  = (55, 40, 28)
    BLDG_MID   = (72, 55, 38)
    BLDG_LIGHT = (90, 70, 48)
    rect(draw, 0, 80, 150, 360, BLDG_DARK)
    rect(draw, 4, 84, 146, 356, BLDG_MID)
    # roof
    draw.polygon([(0,80),(150,80),(130,50),(20,50)], fill=BLDG_DARK)
    # windows (warm glow)
    for wx, wy in [(20,110),(70,110),(20,170),(70,170)]:
        draw_window_glow(draw, wx, wy, 28, 22, (255,200,80), (180,120,30), P)
    # door
    rect(draw, 55, 290, 95, 360, (38,28,18))
    rect(draw, 60, 295, 90, 358, (50,35,20))
    # wood planks
    for py2 in range(84, 356, P*6):
        hline(draw, 4, 146, py2, BLDG_DARK, P)

    # === Right building ===
    rect(draw, 490, 70, BG_W, 360, BLDG_DARK)
    rect(draw, 494, 74, BG_W-4, 356, BLDG_MID)
    draw.polygon([(490,70),(BG_W,70),(BG_W,45),(510,45)], fill=BLDG_DARK)
    for wx, wy in [(520,110),(570,110),(620,110),(520,170),(570,170)]:
        draw_window_glow(draw, wx, wy, 28, 22, (255,200,80), (180,120,30), P)
    rect(draw, 545, 290, 585, 360, (38,28,18))
    rect(draw, 549, 295, 581, 358, (50,35,20))
    for py2 in range(74, 356, P*6):
        hline(draw, 494, BG_W-4, py2, BLDG_DARK, P)

    # === Center background building (smaller) ===
    rect(draw, 240, 140, 400, 210, (48,36,26))
    rect(draw, 244, 144, 396, 210, (62,48,34))
    draw_window_glow(draw, 280, 165, 24, 18, (255,190,60), (160,100,20), P)
    draw_window_glow(draw, 360, 165, 24, 18, (255,190,60), (160,100,20), P)

    # === Well / notice board in middle distance ===
    # Stone well at center
    STONE = (95, 88, 78)
    STONE_D = (70, 65, 58)
    well_x, well_y = 310, 210
    # well base (ellipse-ish)
    for wy3 in range(-6, 6, P):
        ww = int(20 * math.cos(wy3/6 * math.pi/2))
        rect(draw, well_x - ww, well_y + wy3, well_x + ww, well_y + wy3+P-1, STONE)
    # well wall
    rect(draw, well_x-16, well_y-20, well_x+16, well_y+6, STONE_D)
    rect(draw, well_x-14, well_y-18, well_x+14, well_y+4, STONE)
    # well posts
    vline(draw, well_x-12, well_y-32, well_y-20, BLDG_DARK, P)
    vline(draw, well_x+12, well_y-32, well_y-20, BLDG_DARK, P)
    hline(draw, well_x-16, well_x+16, well_y-32, BLDG_DARK, P)
    # notice board to the right
    board_x = 390
    rect(draw, board_x-2, 220, board_x+2, 260, (60,45,30))
    rect(draw, board_x+2, 220, board_x+2, 260, (60,45,30))
    rect(draw, board_x-20, 220, board_x+20, 248, (130,100,60))
    rect(draw, board_x-18, 222, board_x+18, 246, (150,118,72))
    # text lines on board
    for tl in [228, 234, 240]:
        hline(draw, board_x-14, board_x+14, tl, (80,60,35), P)

    # === Torches ===
    TORCH_POLE = (60,45,28)
    FLAME1 = (255,160,20)
    FLAME2 = (255,220,60)
    FLAME3 = (255,80,10)

    def draw_torch(draw, tx, ty):
        vline(draw, tx, ty, ty+30, TORCH_POLE, P)
        # flame
        for fy in range(ty-10, ty, P):
            fw = max(2, 6 - (ty - fy))
            fc = FLAME2 if fy < ty-5 else FLAME1
            rect(draw, tx-fw, fy, tx+fw, fy+P-1, fc)
        px(draw, tx, ty-12, FLAME3, P)
        # glow halo (dithered)
        for gy in range(ty-20, ty+20, P):
            for gx in range(tx-20, tx+20, P):
                d = math.sqrt((gx-tx)**2 + (gy-ty)**2)
                if 8 < d < 20 and (gx//P + gy//P) % 2 == 0:
                    draw.rectangle([gx, gy, gx+P-1, gy+P-1], fill=(180,100,20))

    draw_torch(draw, 140, 250)
    draw_torch(draw, 175, 270)
    draw_torch(draw, 465, 270)
    draw_torch(draw, 500, 250)

    # foreground ground details
    for i in range(0, BG_W, P*3):
        if random.random() < 0.3:
            c = (50,42,33) if random.random() < 0.5 else (78,68,55)
            px(draw, i, BG_H - P*2, c, P)

    return img


def make_governor_mansion():
    img = Image.new("RGB", (BG_W, BG_H))
    draw = ImageDraw.Draw(img)
    P = 2

    # Sky
    SKY1 = (100, 160, 220)
    SKY2 = (160, 210, 240)
    SKY3 = (220, 235, 250)
    dither(draw, 0, 0, BG_W, 180, SKY1, SKY2, 'y', psize=P)
    dither(draw, 0, 120, BG_W, 220, SKY2, SKY3, 'y', psize=P)

    # Clouds
    def draw_cloud(cx, cy, s):
        for (ox, oy, r) in [(0,0,s),(s,4,s-2),(-s,4,s-3),(s*2,8,s-4),(-s*2,8,s-4)]:
            for dy in range(-r, r, P):
                ww = int(r * math.cos(dy/r * math.pi/2))
                rect(draw, cx+ox-ww, cy+oy+dy, cx+ox+ww, cy+oy+dy+P-1, (240,245,255))

    draw_cloud(120, 40, 28)
    draw_cloud(380, 25, 22)
    draw_cloud(540, 55, 18)

    # Ground / lawn
    GRASS1 = (58, 120, 48)
    GRASS2 = (72, 145, 58)
    GRASS3 = (90, 165, 70)
    dither(draw, 0, 220, BG_W, BG_H, GRASS2, GRASS1, 'y', psize=P)
    # lawn dither texture
    for gy in range(220, BG_H, P*2):
        for gx in range(0, BG_W, P*3):
            if (gx//P + gy//P) % 5 == 0:
                draw.rectangle([gx, gy, gx+P-1, gy+P-1], fill=GRASS3)

    # Path (gravel, center)
    GRAVEL1 = (175, 165, 148)
    GRAVEL2 = (195, 185, 168)
    for py3 in range(230, BG_H, P):
        t = (py3 - 230) / (BG_H - 230)
        pw = int(30 + t * 80)
        for pxx in range(320-pw, 320+pw, P):
            c = GRAVEL1 if (pxx//P + py3//P) % 2 == 0 else GRAVEL2
            draw.rectangle([pxx, py3, pxx+P-1, py3+P-1], fill=c)

    # Iron gate (foreground)
    IRON = (38, 42, 48)
    IRON_L = (55, 62, 70)
    # gate posts
    for gp_x in [255, 385]:
        rect(draw, gp_x-6, 185, gp_x+6, 320, IRON)
        rect(draw, gp_x-4, 186, gp_x+4, 190, IRON_L)
        # post cap
        draw.polygon([(gp_x-8, 185),(gp_x+8, 185),(gp_x, 175)], fill=IRON)
        # ball finial
        for fy in range(-4, 4, P):
            fw = max(0, int(4*math.cos(fy/4*math.pi/2)))
            rect(draw, gp_x-fw, 175+fy, gp_x+fw, 175+fy+P-1, IRON_L)
    # gate bars
    for bx in range(268, 384, 8):
        vline(draw, bx, 188, 315, IRON, P)
        # pointed top
        draw.polygon([(bx-2, 188),(bx+2, 188),(bx, 182)], fill=IRON)
    # horizontal rails
    hline(draw, 255, 391, 200, IRON, P)
    hline(draw, 255, 391, 280, IRON, P)
    hline(draw, 255, 391, 315, IRON, P)

    # Hedges
    HEDGE1 = (28, 88, 32)
    HEDGE2 = (42, 110, 45)
    HEDGE3 = (20, 65, 24)
    def draw_hedge(x1, y1, x2, y2):
        rect(draw, x1, y1, x2, y2, HEDGE1)
        # bumpy top
        for hx in range(x1, x2, P*3):
            bump = (hx // (P*3)) % 3
            for hy in range(y1-bump*P, y1, P):
                rect(draw, hx, hy, min(hx+P*3-1, x2), hy+P-1, HEDGE2)
        # dither texture
        for hy in range(y1, y2, P*2):
            for hx in range(x1, x2, P*2):
                if (hx//P + hy//P) % 3 == 0:
                    draw.rectangle([hx, hy, hx+P-1, hy+P-1], fill=HEDGE3)

    draw_hedge(50, 200, 240, 350)
    draw_hedge(400, 200, 590, 350)
    # small hedge balls on sides
    for hcx, hcy, hr in [(90, 195, 16),(150, 192, 14),(200, 194, 12),
                          (550, 195, 16),(490, 192, 14),(440, 194, 12)]:
        for hy in range(hcy-hr, hcy+hr, P):
            hw = int(hr * math.cos((hy-hcy)/hr * math.pi/2))
            rect(draw, hcx-hw, hy, hcx+hw, hy+P-1, HEDGE2 if (hcx+hy)%4<2 else HEDGE1)

    # === Mansion ===
    CREAM1 = (235, 228, 208)
    CREAM2 = (220, 212, 190)
    CREAM3 = (200, 192, 168)
    GOLD   = (210, 170, 60)
    GOLD_D = (160, 128, 40)
    COL    = (230, 222, 200)

    # main facade
    rect(draw, 120, 60, 520, 280, CREAM2)
    rect(draw, 124, 64, 516, 276, CREAM1)
    # facade texture
    for fy in range(64, 276, P*8):
        hline(draw, 124, 516, fy, CREAM3, P)

    # Roof with triangular pediment
    draw.polygon([(110,60),(530,60),(500,20),(140,20)], fill=CREAM3)
    draw.polygon([(180,60),(460,60),(380,28),(260,28)], fill=CREAM2)
    # pediment triangle fill
    draw.polygon([(260,28),(380,28),(320,10)], fill=CREAM1)
    # roof edge trim
    hline(draw, 110, 530, 60, GOLD, P)
    hline(draw, 180, 460, 28, GOLD_D, P)

    # Columns
    for cx2 in [180, 230, 380, 430]:
        rect(draw, cx2-8, 60, cx2+8, 230, COL)
        # column fluting
        for fc in [cx2-4, cx2, cx2+4]:
            vline(draw, fc, 62, 228, CREAM3, P)
        # column capital
        rect(draw, cx2-10, 58, cx2+10, 64, CREAM3)
        rect(draw, cx2-12, 62, cx2+12, 66, CREAM3)

    # Windows (upper row)
    for wx2 in [160, 270, 370, 480]:
        rect(draw, wx2-18, 80, wx2+18, 130, GOLD_D)
        rect(draw, wx2-16, 82, wx2+16, 128, (100, 140, 180))
        # window panes
        vline(draw, wx2, 83, 127, CREAM2, P)
        hline(draw, wx2-15, wx2+15, 105, CREAM2, P)
        # window trim
        rect(draw, wx2-20, 78, wx2+20, 80, GOLD)
        rect(draw, wx2-20, 130, wx2+20, 132, GOLD)

    # Ground floor windows
    for wx2 in [165, 475]:
        rect(draw, wx2-20, 155, wx2+20, 220, GOLD_D)
        rect(draw, wx2-18, 157, wx2+18, 218, (90, 130, 170))
        vline(draw, wx2, 158, 217, CREAM2, P)
        hline(draw, wx2-17, wx2+17, 188, CREAM2, P)

    # Grand entrance door
    rect(draw, 285, 165, 355, 280, GOLD_D)
    # door arch
    for ay in range(-20, 0, P):
        aw = int(35 * math.cos(ay/20 * math.pi/2))
        rect(draw, 320-aw, 165+ay, 320+aw, 165+ay+P-1, GOLD_D)
    rect(draw, 290, 168, 350, 278, (60, 45, 30))
    rect(draw, 295, 172, 345, 276, (75, 55, 36))
    # door panels
    for dp_x in [296, 322]:
        for dp_y in [175, 215, 252]:
            rect(draw, dp_x, dp_y, dp_x+22, dp_y+16, (85,65,42))
    # door knocker
    px(draw, 318, 240, GOLD, P)
    px(draw, 322, 240, GOLD, P)

    # Steps
    STEP = (195, 188, 172)
    for si in range(4):
        sy = 280 + si*6
        sx = 260 + si*8
        rect(draw, sx, sy, BG_W-sx, sy+6, STEP)

    return img


def make_mansion_interior():
    img = Image.new("RGB", (BG_W, BG_H))
    draw = ImageDraw.Draw(img)
    P = 2

    # === Dark wall / ceiling ===
    WALL1 = (38, 28, 18)
    WALL2 = (52, 38, 24)
    DARK  = (20, 14, 8)
    # ceiling
    rect(draw, 0, 0, BG_W, 80, DARK)
    # upper wall
    dither(draw, 0, 80, BG_W, 200, WALL2, WALL1, 'y', psize=P)
    # wainscoting
    PANEL = (72, 52, 32)
    PANEL_L = (90, 68, 44)
    rect(draw, 0, 200, BG_W, 230, PANEL)
    hline(draw, 0, BG_W, 200, PANEL_L, P)
    hline(draw, 0, BG_W, 228, PANEL_L, P)

    # === Wood floor (perspective planks) ===
    FLOOR1 = (88, 62, 36)
    FLOOR2 = (105, 75, 44)
    FLOOR3 = (70, 50, 28)
    FLOOR4 = (120, 88, 52)
    GROUT  = (55, 40, 22)
    for fy in range(230, BG_H, P):
        t = (fy - 230) / (BG_H - 230)
        plank_w = max(P*2, int((P * 6) * (0.3 + t * 0.7)))
        for fx in range(0, BG_W, plank_w):
            plank_idx = fx // plank_w
            colors = [FLOOR1, FLOOR2, FLOOR3, FLOOR4]
            c = colors[(plank_idx + fy // (P*10)) % 4]
            rect(draw, fx, fy, fx+plank_w-P, fy+P-1, c)
            if (fy // P) % 8 == 0:
                rect(draw, fx, fy, fx+plank_w-1, fy+P-1, GROUT)

    # === Fireplace (left wall) ===
    STONE2  = (95, 85, 72)
    STONE_D2 = (65, 58, 48)
    MARBLE  = (180, 168, 150)
    MARBLE_D = (145, 132, 112)
    FIRE1   = (255, 90, 15)
    FIRE2   = (255, 200, 40)
    FIRE3   = (220, 60, 8)
    EMBER   = (180, 50, 5)

    # mantle
    rect(draw, 30, 120, 220, 230, STONE_D2)
    rect(draw, 34, 124, 216, 226, STONE2)
    # mantle shelf
    rect(draw, 20, 118, 230, 130, MARBLE)
    hline(draw, 20, 230, 118, MARBLE_D, P)
    # firebox opening
    rect(draw, 60, 150, 190, 226, DARK)
    for ay in range(-24, 0, P):
        aw = int(65 * math.cos(ay/24 * math.pi/2))
        rect(draw, 125-aw, 150+ay, 125+aw, 150+ay+P-1, DARK)
    # fire
    for firy in range(190, 226, P):
        t2 = (firy - 190) / 36.0
        fw2 = int(40 + t2 * 50)
        rect(draw, 125-fw2, firy, 125+fw2, firy+P-1, EMBER)
    for firy in range(170, 210, P):
        t2 = (firy - 170) / 40.0
        fw2 = int(30 + t2 * 30)
        fc2 = FIRE1 if (firy // P) % 2 == 0 else FIRE3
        rect(draw, 125-fw2, firy, 125+fw2, firy+P-1, fc2)
    for firy in range(155, 185, P):
        fw2 = int(15 + (firy-155) * 0.8)
        rect(draw, 125-fw2, firy, 125+fw2, firy+P-1, FIRE2)
    # fire glow on floor
    for gy in range(226, 280, P):
        t2 = (gy - 226) / 54.0
        for gx in range(60, 190, P):
            if (gx//P + gy//P) % 3 < 2:
                alpha = int((1-t2) * 60)
                orig = img.getpixel((min(gx, BG_W-1), min(gy, BG_H-1)))
                glow_c = (min(orig[0]+alpha, 255), max(orig[1]-alpha//3, 0), max(orig[2]-alpha, 0))
                draw.rectangle([gx, gy, gx+P-1, gy+P-1], fill=glow_c)
    # mantle decorations
    # candelabra left
    vline(draw, 55, 100, 120, (80,70,55), P)
    for cy2 in range(-3, 4, 3):
        rect(draw, 50+cy2-2, 98, 50+cy2+2, 102, (80,70,55))
        # candle flame
        rect(draw, 50+cy2-1, 92, 50+cy2+1, 99, (230, 220, 180))
        px(draw, 50+cy2, 90, FIRE2, P)

    # === Trophy case (right side) ===
    WOOD1 = (95, 68, 42)
    WOOD2 = (115, 82, 50)
    GLASS = (140, 170, 200)

    rect(draw, 420, 80, 580, 240, WOOD1)
    rect(draw, 424, 84, 576, 236, WOOD2)
    # glass panes
    for gp_x2 in range(436, 566, 44):
        rect(draw, gp_x2, 90, gp_x2+38, 180, GLASS)
        # skull trophy
        skull_cx = gp_x2 + 19
        for sy2 in range(-8, 4, P):
            sw2 = max(0, int(10*math.cos(sy2/8*math.pi/2)))
            rect(draw, skull_cx-sw2, 130+sy2, skull_cx+sw2, 130+sy2+P-1, (220,215,200))
        rect(draw, skull_cx-4, 134, skull_cx-1, 138, DARK)
        rect(draw, skull_cx+1, 134, skull_cx+4, 138, DARK)
    # shelves
    hline(draw, 424, 576, 91, WOOD1, P)
    hline(draw, 424, 576, 182, WOOD1, P)
    hline(draw, 424, 576, 234, WOOD1, P)

    # === Large portrait painting (center wall) ===
    FRAME1 = (160, 130, 55)
    FRAME2 = (120, 95, 35)
    rect(draw, 245, 60, 395, 180, FRAME2)
    rect(draw, 250, 64, 390, 176, FRAME1)
    # painting canvas
    rect(draw, 255, 68, 385, 172, (80, 95, 120))
    # painted figure silhouette
    for phy in range(-30, 30, P):
        pw2 = max(0, int(20 * math.cos(phy/30 * math.pi/2)))
        rect(draw, 320-pw2, 120+phy, 320+pw2, 120+phy+P-1, (60,75,95))
    rect(draw, 310, 80, 330, 110, (180,150,120))  # head
    rect(draw, 315, 84, 325, 95, (160,130,100))

    # === Wall candelabras ===
    CANDLE_BASE = (100, 85, 60)
    SCONCE_COL  = (130, 110, 75)
    for sconce_x in [390, 450]:
        # bracket
        rect(draw, sconce_x-4, 100, sconce_x+8, 115, SCONCE_COL)
        rect(draw, sconce_x+4, 108, sconce_x+14, 112, SCONCE_COL)
        # candle
        rect(draw, sconce_x+12, 100, sconce_x+18, 110, (230, 220, 180))
        px(draw, sconce_x+15, 97, FIRE2, P)
        px(draw, sconce_x+15, 95, FIRE1, P)
        # wall glow
        for gy3 in range(85, 135, P):
            for gx3 in range(sconce_x-10, sconce_x+40, P):
                d = math.sqrt((gx3-(sconce_x+15))**2 + (gy3-97)**2)
                if 8 < d < 28 and (gx3//P + gy3//P) % 2 == 0:
                    draw.rectangle([gx3, gy3, gx3+P-1, gy3+P-1], fill=(100,70,20))

    # === Chains on right wall ===
    CHAIN = (90, 80, 65)
    for link_y in range(80, 200, P*4):
        for link_x in [600, 620]:
            rect(draw, link_x-2, link_y, link_x+2, link_y+P, CHAIN)
            rect(draw, link_x-P, link_y+P, link_x+P, link_y+P*3, (70,62,50))

    # Ambient firelight overlay on right side (dither)
    for ay in range(80, 300, P):
        for ax in range(0, 120, P):
            if (ax//P + ay//P) % 3 == 0:
                orig = img.getpixel((min(ax, BG_W-1), min(ay, BG_H-1)))
                glow_c = (min(orig[0]+25, 255), max(orig[1]-5, 0), max(orig[2]-15, 0))
                draw.rectangle([ax, ay, ax+P-1, ay+P-1], fill=glow_c)

    return img


def make_stan_shop():
    img = Image.new("RGB", (BG_W, BG_H))
    draw = ImageDraw.Draw(img)
    P = 2

    # Sky (dark night)
    SKY1 = (8, 10, 32)
    SKY2 = (18, 18, 52)
    SKY3 = (30, 28, 70)
    dither(draw, 0, 0, BG_W, 180, SKY1, SKY2, 'y', psize=P)
    dither(draw, 0, 140, BG_W, 220, SKY2, SKY3, 'y', psize=P)

    # Stars
    random.seed(77)
    for _ in range(80):
        sx = random.randrange(0, BG_W, P)
        sy = random.randrange(0, 130, P)
        c = random.choice([(240,240,210),(220,220,255),(255,255,220)])
        px(draw, sx, sy, c, P)

    # Moon (crescent)
    for my2 in range(-20, 20, P):
        mw = int(20 * math.cos(my2/20 * math.pi/2))
        rect(draw, 60-mw, 50+my2, 60+mw, 50+my2+P-1, (240,240,200))
    for my2 in range(-16, 20, P):
        mw = int(16 * math.cos(my2/16 * math.pi/2))
        rect(draw, 68-mw, 52+my2, 68+mw, 52+my2+P-1, SKY2)

    # Dock / ground
    DOCK1 = (55, 42, 28)
    DOCK2 = (72, 56, 36)
    DOCK3 = (42, 32, 20)
    WATER = (12, 28, 65)
    WATER2 = (18, 38, 80)
    # water
    dither(draw, 0, 200, BG_W, BG_H, WATER, WATER2, 'y', psize=P)
    # water reflection dither
    for wy in range(200, BG_H, P*4):
        for wx in range(0, BG_W, P*6):
            if (wx//P + wy//P) % 3 == 0:
                rect(draw, wx, wy, wx+P*3-1, wy+P-1, (30, 55, 100))
    # dock planks
    for dy in range(220, BG_H, P):
        for dx in range(0, BG_W, P):
            plank = dx // (P*10)
            if dy % (P*8) < P:
                c = DOCK3
            else:
                c = DOCK1 if plank % 2 == 0 else DOCK2
            draw.rectangle([dx, dy, dx+P-1, dy+P-1], fill=c)

    # === Ship 1 (large, center-left) ===
    HULL1 = (55, 40, 22)
    HULL2 = (75, 55, 30)
    HULL3 = (95, 70, 40)
    SAIL1 = (210, 195, 165)
    SAIL2 = (185, 170, 140)
    SAIL_FOLD = (160, 145, 115)
    MAST_C = (65, 48, 28)
    ROPE_C = (140, 120, 80)

    def draw_ship(dx, dy, scale=1.0):
        """Draw a side-view pirate ship."""
        w = int(160 * scale)
        h = int(60 * scale)
        p = max(P, int(P * scale))
        # hull
        for hy2 in range(0, h, p):
            t2 = hy2 / h
            hw2 = int((w//2) * (1 - t2*0.3))
            c = HULL2 if (hy2//p) % 3 != 0 else HULL1
            rect(draw, dx-hw2, dy+hy2, dx+hw2, dy+hy2+p-1, c)
        # hull detail lines
        for hy2 in range(0, h, p*4):
            hline(draw, dx-int(w//2*(1-(hy2/h)*0.3)), dx+int(w//2*(1-(hy2/h)*0.3)), dy+hy2, HULL1, p)
        # keel
        draw.polygon([(dx-w//2, dy+h),(dx+w//2, dy+h),(dx+w//2-10, dy+h+10),(dx-w//2+5, dy+h+8)], fill=HULL3)
        # waterline trim
        hline(draw, dx-w//2+2, dx+w//2-2, dy, HULL3, p)
        # cannons
        for cx3 in [dx-w//4, dx, dx+w//4]:
            rect(draw, cx3-p*2, dy+h//3, cx3+p*4, dy+h//3+p*3, HULL1)
        # mast
        mast_h = int(100*scale)
        vline(draw, dx, dy-mast_h, dy, MAST_C, p)
        vline(draw, dx+int(w//3), dy-int(mast_h*0.7), dy, MAST_C, p)
        # sails
        for sail_y in range(dy-mast_h+10, dy-20, p):
            t3 = (sail_y - (dy-mast_h+10)) / (mast_h - 30)
            sw = int((w//2 - 10) * math.sin(t3 * math.pi))
            c = SAIL1 if (sail_y//p) % 4 != 0 else SAIL_FOLD
            rect(draw, dx-sw//2, sail_y, dx+sw//2, sail_y+p-1, c)
        # rope lines
        for rx in range(dx-w//2+5, dx-5, int(p*8)):
            draw.line([(dx, dy-mast_h+5), (rx, dy+5)], fill=ROPE_C, width=1)

    draw_ship(160, 240, scale=0.9)
    draw_ship(380, 235, scale=1.1)
    draw_ship(560, 250, scale=0.7)

    # === String lights ===
    BULB_Y = (255, 220, 60)
    BULB_R = (255, 60, 40)
    BULB_G = (40, 220, 80)
    BULB_W = (255, 250, 230)
    bulb_colors = [BULB_Y, BULB_R, BULB_G, BULB_W]
    # string across top
    for i, lx in enumerate(range(20, BG_W, 24)):
        # drooping string
        sy3 = int(60 + 8*math.sin(i*0.8))
        px(draw, lx, sy3, bulb_colors[i % 4], P)
        px(draw, lx+P, sy3, bulb_colors[i % 4], P)
        # glow halo
        if (lx//P) % 3 == 0:
            for gy4 in range(sy3-4, sy3+6, P):
                for gx4 in range(lx-4, lx+6, P):
                    if (gx4//P + gy4//P) % 2 == 0:
                        draw.rectangle([gx4, gy4, gx4+P-1, gy4+P-1], fill=(180,140,20))

    # Second string at lower level
    for i, lx in enumerate(range(0, BG_W, 20)):
        sy3 = int(100 + 12*math.sin(i*0.6 + 1.0))
        px(draw, lx, sy3, bulb_colors[(i+2) % 4], P)

    # === Sale banners ===
    BANNER_R = (200, 40, 30)
    BANNER_Y = (220, 180, 20)
    BANNER_B = (30, 60, 180)
    banner_data = [(80, 140, BANNER_R),(230, 135, BANNER_Y),(450, 145, BANNER_R),(580, 138, BANNER_B)]
    for (bx4, by4, bc) in banner_data:
        rect(draw, bx4, by4, bx4+60, by4+26, bc)
        rect(draw, bx4+2, by4+2, bx4+58, by4+24, (bc[0]//2+50, bc[1]//2+50, bc[2]//2+50))
        # "SALE!" text suggestion (pixel bars)
        for tl in [by4+7, by4+13, by4+18]:
            hline(draw, bx4+8, bx4+52, tl, bc, P)
        # banner triangles at bottom
        for tx in range(bx4, bx4+60, 8):
            draw.polygon([(tx,by4+26),(tx+8,by4+26),(tx+4,by4+34)], fill=bc)

    # === Torches on posts ===
    POST_C = (55, 42, 28)
    FLAME_Y = (255, 180, 20)
    FLAME_O = (255, 100, 10)
    for tx2 in [30, 140, 280, 420, 550, 620]:
        vline(draw, tx2, 160, 280, POST_C, P)
        # torch head
        rect(draw, tx2-4, 152, tx2+4, 164, (80, 60, 35))
        # flame
        for fy2 in range(138, 154, P):
            fw3 = max(2, 8 - (154-fy2))
            rect(draw, tx2-fw3, fy2, tx2+fw3, fy2+P-1, FLAME_Y if fy2 < 148 else FLAME_O)
        px(draw, tx2, 136, (255,240,100), P)

    # Shop sign
    SIGN_BG = (120, 90, 45)
    SIGN_BRD = (80, 60, 28)
    rect(draw, 250, 60, 390, 110, SIGN_BRD)
    rect(draw, 254, 64, 386, 106, SIGN_BG)
    # sign text (pixel bar letters suggestion)
    for tl2 in [73, 80, 90, 97]:
        hline(draw, 265, 375, tl2, (200, 160, 70), P)
    # hanging chain
    vline(draw, 265, 50, 64, ROPE_C, P)
    vline(draw, 375, 50, 64, ROPE_C, P)

    return img


def make_sword_master_area():
    img = Image.new("RGB", (BG_W, BG_H))
    draw = ImageDraw.Draw(img)
    P = 2

    # Twilight sky
    SKY1 = (55, 22, 78)
    SKY2 = (90, 40, 110)
    SKY3 = (140, 80, 100)
    SKY4 = (180, 120, 80)
    dither(draw, 0, 0, BG_W, 80,  SKY1, SKY2, 'y', psize=P)
    dither(draw, 0, 60, BG_W, 140, SKY2, SKY3, 'y', psize=P)
    dither(draw, 0, 120, BG_W, 200, SKY3, SKY4, 'y', psize=P)

    # Stars (dim, twilight)
    random.seed(99)
    for _ in range(40):
        sx = random.randrange(0, BG_W, P)
        sy = random.randrange(0, 80, P)
        px(draw, sx, sy, (200,190,230), P)

    # Forest background (silhouette trees far)
    TREE_FAR  = (22, 14, 38)
    TREE_MID  = (32, 22, 52)
    TREE_NEAR = (18, 30, 22)
    TREE_N2   = (28, 45, 32)
    GROUND1   = (35, 55, 30)
    GROUND2   = (48, 72, 38)
    MOSS1     = (40, 85, 48)
    MOSS2     = (55, 105, 58)
    DIRT1     = (75, 62, 42)
    DIRT2     = (90, 75, 50)

    # Ground
    dither(draw, 0, 200, BG_W, BG_H, GROUND1, GROUND2, 'y', psize=P)
    # mossy patches
    for gy5 in range(200, BG_H, P*3):
        for gx5 in range(0, BG_W, P*4):
            if (gx5//P + gy5//P) % 7 < 3:
                draw.rectangle([gx5, gy5, gx5+P-1, gy5+P-1], fill=MOSS1)
    # dirt path center
    for py4 in range(210, BG_H, P):
        t4 = (py4 - 210) / (BG_H - 210)
        pw2 = int(40 + t4 * 100)
        for pxx4 in range(320-pw2, 320+pw2, P):
            c = DIRT1 if (pxx4//P + py4//P) % 3 < 2 else DIRT2
            draw.rectangle([pxx4, py4, pxx4+P-1, py4+P-1], fill=c)

    # Far tree silhouettes
    def draw_tree_silhouette(cx, base_y, h, spread, color):
        for ty5 in range(base_y-h, base_y, P):
            t5 = (ty5 - (base_y-h)) / h
            tw = int(spread * (1 - t5*0.4) * math.sin((t5)*math.pi + 0.2))
            tw = max(P, tw)
            rect(draw, cx-tw, ty5, cx+tw, ty5+P-1, color)
        # trunk
        vline(draw, cx, base_y, base_y+20, (40,28,16), P)

    for tx3, th, ts in [(30,140,30),(100,160,35),(580,150,32),(520,145,28),
                         (60,120,25),(150,110,22),(470,130,28),(600,155,30)]:
        draw_tree_silhouette(tx3, 200, th, ts, TREE_FAR)
    for tx3, th, ts in [(20,100,22),(80,90,18),(560,95,20),(590,105,24)]:
        draw_tree_silhouette(tx3, 200, th, ts, TREE_MID)

    # Near trees (sides)
    for tx3, th, ts in [(0,180,45),(160,190,50),(480,185,48),(650,175,42)]:
        draw_tree_silhouette(tx3, 240, th, ts, TREE_NEAR)
    for tx3, th, ts in [(30,200,60),(580,195,55)]:
        draw_tree_silhouette(tx3, 260, th, ts, TREE_N2)

    # === Stone arch / gate ===
    ARCH_STONE = (105, 95, 82)
    ARCH_DARK  = (72, 65, 55)
    ARCH_LIGHT = (130, 118, 100)
    MOSS_STONE = (60, 90, 52)

    # arch pillars
    for px5 in [200, 420]:
        rect(draw, px5-18, 80, px5+18, 260, ARCH_DARK)
        rect(draw, px5-14, 84, px5+14, 256, ARCH_STONE)
        # stone blocks
        for sy5 in range(84, 256, P*10):
            hline(draw, px5-14, px5+14, sy5, ARCH_DARK, P)
        # moss at base
        for sy5 in range(230, 260, P):
            for sxx in range(px5-14, px5+14, P):
                if (sxx//P + sy5//P) % 4 < 2:
                    draw.rectangle([sxx, sy5, sxx+P-1, sy5+P-1], fill=MOSS_STONE)
        # cap stones
        rect(draw, px5-22, 76, px5+22, 86, ARCH_LIGHT)

    # arch top
    for ay3 in range(-50, 0, P):
        aw2 = int(128 * math.cos(ay3/50 * math.pi/2))
        rect(draw, 310-aw2, 80+ay3, 310+aw2, 80+ay3+P-1, ARCH_DARK)
        if abs(aw2 - 128) < P*3:
            # fill arch body
            inner_w = int((128-20) * math.cos(ay3/50 * math.pi/2))
            rect(draw, 310-inner_w, 80+ay3, 310+inner_w, 80+ay3+P-1, ARCH_STONE)

    # === Training dummies ===
    DUMMY_WOOD = (100, 75, 48)
    DUMMY_DARK = (70, 52, 32)
    DUMMY_BURLAP = (175, 155, 110)

    def draw_dummy(dx, dy):
        # post
        vline(draw, dx, dy-60, dy+40, DUMMY_DARK, P)
        # cross arm
        hline(draw, dx-24, dx+24, dy-50, DUMMY_DARK, P)
        # body
        rect(draw, dx-16, dy-50, dx+16, dy, DUMMY_BURLAP)
        # stitch lines
        for sl in range(dy-46, dy, P*6):
            hline(draw, dx-14, dx+14, sl, (145,128,88), P)
        # head
        for hy6 in range(-8, 8, P):
            hw6 = max(0, int(8*math.cos(hy6/8*math.pi/2)))
            rect(draw, dx-hw6, dy-68+hy6, dx+hw6, dy-68+hy6+P-1, DUMMY_BURLAP)
        # X eyes
        for eye_x in [dx-3, dx+3]:
            px(draw, eye_x, dy-70, DUMMY_DARK, P)

    draw_dummy(120, 280)
    draw_dummy(520, 275)
    draw_dummy(85, 295)

    # === Weapon rack ===
    RACK_WOOD = (88, 65, 38)
    BLADE     = (190, 195, 205)
    BLADE_D   = (140, 145, 155)
    HILT      = (160, 120, 50)

    # rack posts
    rect(draw, 350, 200, 358, 300, RACK_WOOD)
    rect(draw, 390, 200, 398, 300, RACK_WOOD)
    hline(draw, 350, 398, 210, RACK_WOOD, P)
    hline(draw, 350, 398, 260, RACK_WOOD, P)
    hline(draw, 350, 398, 298, RACK_WOOD, P)

    # swords on rack
    sword_xs = [356, 365, 375, 383]
    for sx7 in sword_xs:
        # blade
        for sy7 in range(208, 262, P):
            t7 = (sy7 - 208) / 54.0
            sw7 = max(0, int(3*(1-t7)))
            rect(draw, sx7-sw7, sy7, sx7+sw7, sy7+P-1, BLADE)
        # hilt
        rect(draw, sx7-4, 208, sx7+4, 213, HILT)
        hline(draw, sx7-6, sx7+6, 211, HILT, P)

    # Axes
    for ax_x in [360, 388]:
        vline(draw, ax_x, 260, 298, RACK_WOOD, P)
        # axe head
        for ay7 in range(-10, 5, P):
            aw7 = max(0, int(10 + ay7*0.5))
            rect(draw, ax_x-aw7, 265+ay7, ax_x+4, 265+ay7+P-1, BLADE_D)

    return img


def make_prison():
    img = Image.new("RGB", (BG_W, BG_H))
    draw = ImageDraw.Draw(img)
    P = 2

    # === Stone wall (bg) ===
    STONE_BG  = (55, 52, 48)
    STONE_MID = (72, 68, 62)
    STONE_LT  = (88, 83, 76)
    STONE_DK  = (38, 35, 32)
    MORTAR2   = (40, 38, 35)

    # base wall fill
    rect(draw, 0, 0, BG_W, BG_H, STONE_BG)

    # stone block pattern
    block_h = P*8
    for row in range(0, BG_H, block_h):
        offset = (row // block_h % 2) * (P*10)
        block_w = P*20
        for col in range(-offset, BG_W, block_w):
            # block face
            c = STONE_MID if (col//block_w + row//block_h) % 3 != 0 else STONE_LT
            rect(draw, col+1, row+1, col+block_w-2, row+block_h-2, c)
            # random stone variation
            if (col//block_w + row//block_h) % 5 == 0:
                rect(draw, col+3, row+3, col+block_w-4, row+block_h-4, STONE_DK)
            # mortar lines
            rect(draw, col, row, col+block_w-1, row, MORTAR2)
            rect(draw, col, row, col, row+block_h-1, MORTAR2)

    # ceiling (darker)
    dither(draw, 0, 0, BG_W, 60, STONE_DK, STONE_BG, 'y', psize=P)

    # === Torch sconce (center-right wall) ===
    TORCH_MTL = (100, 85, 60)
    WALL_GLOW  = (90, 55, 10)

    def draw_wall_torch(tx, ty):
        # sconce bracket
        rect(draw, tx-4, ty, tx+4, ty+12, TORCH_MTL)
        rect(draw, tx+2, ty+4, tx+14, ty+6, TORCH_MTL)
        # torch body
        rect(draw, tx+10, ty-8, tx+16, ty+6, (120, 95, 55))
        # flame layers
        for fy8 in range(ty-20, ty-6, P):
            fw8 = max(2, 10-(ty-6-fy8))
            fc8 = (255,200,50) if fy8 < ty-14 else (255,120,20)
            rect(draw, tx+13-fw8//2, fy8, tx+13+fw8//2, fy8+P-1, fc8)
        px(draw, tx+13, ty-22, (255,240,100), P)
        # wall glow
        for gy8 in range(ty-40, ty+60, P):
            for gx8 in range(tx-50, tx+80, P):
                d8 = math.sqrt((gx8-tx-13)**2 + (gy8-(ty-14))**2)
                if 15 < d8 < 55 and (gx8//P + gy8//P) % 2 == 0:
                    draw.rectangle([gx8, gy8, gx8+P-1, gy8+P-1], fill=WALL_GLOW)

    draw_wall_torch(450, 80)
    draw_wall_torch(580, 100)

    # === Small high window (left, moonlight) ===
    WIN_FRAME = (50, 46, 40)
    WIN_GLOW  = (160, 180, 220)
    WIN_MOON  = (230, 235, 250)
    rect(draw, 40, 40, 120, 110, WIN_FRAME)
    rect(draw, 44, 44, 116, 106, WIN_GLOW)
    # window panes
    vline(draw, 80, 44, 106, WIN_FRAME, P)
    hline(draw, 44, 116, 75, WIN_FRAME, P)
    # moonlight beam
    BEAM = (200, 210, 240)
    for by9 in range(110, 260, P):
        t9 = (by9 - 110) / 150.0
        bw9 = int(38 + t9 * 60)
        for bx9 in range(80-bw9, 80+bw9, P):
            if (bx9//P + by9//P) % 2 == 0:
                orig = img.getpixel((min(bx9, BG_W-1), min(by9, BG_H-1)))
                beam_c = (min(orig[0]+18, 255), min(orig[1]+22, 255), min(orig[2]+30, 255))
                draw.rectangle([bx9, by9, bx9+P-1, by9+P-1], fill=beam_c)

    # === Iron bar cell (left side) ===
    IRON2   = (45, 50, 58)
    IRON_LT2 = (70, 78, 88)
    RUST    = (110, 65, 35)
    CELL_BG = (30, 28, 26)

    # cell back wall
    rect(draw, 0, 80, 280, 400, CELL_BG)
    # cell stone texture
    for row in range(80, 400, block_h):
        offset = (row // block_h % 2) * (P*10)
        for col in range(-offset, 280, P*20):
            rect(draw, col+1, row+1, col+P*20-2, row+block_h-2, (42,38,35))

    # iron bar frame
    rect(draw, 0, 80, 8, 400, IRON2)
    rect(draw, 272, 80, 280, 400, IRON2)
    hline(draw, 0, 280, 80, IRON2, P)

    # vertical bars
    for bx10 in range(0, 280, 22):
        vline(draw, bx10, 80, BG_H, IRON2, P*2)
        # rust spots
        for ry in range(bx10%4*20 + 100, BG_H, 80):
            if 80 <= ry < BG_H:
                draw.rectangle([bx10, ry, bx10+P*2-1, ry+P*2-1], fill=RUST)
        # bar sheen
        vline(draw, bx10+P, 82, BG_H-2, IRON_LT2, P)

    # horizontal bars (cross bars)
    for by10 in [140, 220, 300, 380]:
        hline(draw, 0, 280, by10, IRON2, P*2)
        hline(draw, 0, 280, by10+P, IRON_LT2, P)

    # cell floor (darker)
    rect(draw, 0, 340, 280, 400, (28, 26, 24))

    # === Chains on right wall ===
    CHAIN2 = (88, 80, 65)
    CHAIN_D = (58, 52, 42)
    for chain_x in [480, 520, 490]:
        for link_y in range(80, 220, P*5):
            # oval link
            for ldy in range(-2, 3, P):
                ldw = max(0, int(4*math.cos(ldy/2*math.pi/2)))
                rect(draw, chain_x-ldw, link_y+ldy, chain_x+ldw, link_y+ldy+P-1, CHAIN2)
            rect(draw, chain_x-1, link_y, chain_x+1, link_y+P*4, CHAIN_D)
        # manacle at bottom
        rect(draw, chain_x-10, 218, chain_x+10, 232, CHAIN2)
        rect(draw, chain_x-8, 220, chain_x+8, 230, CHAIN_D)

    # === Guard desk (right side) ===
    DESK_TOP  = (110, 82, 50)
    DESK_SIDE = (78, 58, 34)
    DESK_DARK = (52, 38, 22)

    rect(draw, 340, 240, 600, 260, DESK_TOP)
    rect(draw, 344, 244, 596, 256, (130, 98, 60))
    rect(draw, 340, 260, 600, 360, DESK_SIDE)
    # desk legs
    for lx in [360, 580]:
        rect(draw, lx-8, 360, lx+8, 400, DESK_DARK)
    # items on desk
    # papers
    rect(draw, 380, 228, 430, 242, (210, 200, 180))
    rect(draw, 384, 232, 426, 238, (230, 220, 200))
    # candle
    rect(draw, 460, 220, 470, 242, (230, 220, 180))
    px(draw, 465, 218, (255,220,50), P)
    px(draw, 465, 216, (255,160,20), P)
    # keys hanging
    KEY_C = (180, 160, 60)
    rect(draw, 550, 200, 556, 242, (70,55,35))  # hook peg
    for ki in range(3):
        kx9 = 540 + ki*8
        ky9 = 218 + ki*6
        # key ring
        for kr_a in range(0, 360, 30):
            kra = math.radians(kr_a)
            kpx, kpy = kx9 + int(4*math.cos(kra)), ky9 + int(4*math.sin(kra))
            draw.rectangle([kpx, kpy, kpx+P-1, kpy+P-1], fill=KEY_C)
        # key shaft
        rect(draw, kx9, ky9+4, kx9+12, ky9+6, KEY_C)
        rect(draw, kx9+10, ky9+2, kx9+12, ky9+8, KEY_C)

    # Ground floor
    FLOOR_P = (60, 55, 50)
    FLOOR_P2 = (75, 70, 62)
    for gy9 in range(360, BG_H, P):
        for gx9 in range(280, BG_W, P):
            c = FLOOR_P if (gx9//P + gy9//P) % 2 == 0 else FLOOR_P2
            draw.rectangle([gx9, gy9, gx9+P-1, gy9+P-1], fill=c)

    # Ambient torch light (warm right side overlay)
    for ay9 in range(60, 320, P):
        for ax9 in range(380, BG_W, P):
            t9 = 1 - (ax9 - 380) / (BG_W - 380)
            if (ax9//P + ay9//P) % 3 < int(t9*3):
                orig = img.getpixel((min(ax9, BG_W-1), min(ay9, BG_H-1)))
                warm = (min(orig[0]+40, 255), max(orig[1]-5, 0), max(orig[2]-20, 0))
                draw.rectangle([ax9, ay9, ax9+P-1, ay9+P-1], fill=warm)

    return img


# ══════════════════════════════════════════════════════════════════════════════
#  SPRITE HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def new_sprite():
    return Image.new("RGBA", (SP_W, SP_H), (0, 0, 0, 0))


def sp(draw, x, y, color, size=2):
    """Draw a pixel on a sprite (with alpha)."""
    if 0 <= x < SP_W and 0 <= y+1 < SP_H:
        draw.rectangle([x, y, x+size-1, y+size-1], fill=color)


def sp_rect(draw, x1, y1, x2, y2, color):
    if x1 < x2 and y1 < y2:
        draw.rectangle([max(0,x1), max(0,y1), min(SP_W-1,x2), min(SP_H-1,y2)], fill=color)


def sp_circle(draw, cx, cy, r, color, psize=2):
    for dy in range(-r, r+1, psize):
        dw = int(r * math.cos(dy/r * math.pi/2)) if r > 0 else 0
        if dw > 0:
            draw.rectangle([cx-dw, cy+dy, cx+dw-1, cy+dy+psize-1], fill=color)


def sp_oval(draw, cx, cy, rx, ry, color, psize=2):
    for dy in range(-ry, ry+1, psize):
        if ry > 0:
            dw = int(rx * math.sqrt(max(0, 1 - (dy/ry)**2)))
        else:
            dw = rx
        if dw > 0:
            draw.rectangle([cx-dw, cy+dy, cx+dw-1, cy+dy+psize-1], fill=color)


# ── Sprite drawing functions ──────────────────────────────────────────────────

# FEET_Y: feet at y=180 as per spec
# Character is roughly 64×96, centered at x=64

CX = 64   # center x
FY = 175  # feet y

def sp_hline(draw, x1, x2, y, color, size=2):
    draw.rectangle([x1, y, x2, y+size-1], fill=color)


def sp_vline(draw, x, y1, y2, color, size=2):
    draw.rectangle([x, y1, x+size-1, y2], fill=color)


# ══════════════════════════════════════════════════════════════════════════════
# CARLA — sword master, strong woman warrior
# Colors: red vest, dark pants, tan skin, brown hair
# ══════════════════════════════════════════════════════════════════════════════
CARLA = {
    'skin':    (210, 170, 130, 255),
    'skin_d':  (175, 135, 100, 255),
    'hair':    (60,  38,  20,  255),
    'hair_h':  (88,  58,  28,  255),
    'vest':    (185, 40,  32,  255),
    'vest_d':  (130, 25,  18,  255),
    'vest_l':  (220, 70,  55,  255),
    'shirt':   (220, 210, 180, 255),
    'pants':   (40,  35,  52,  255),
    'pants_d': (28,  24,  38,  255),
    'boots':   (55,  40,  25,  255),
    'boots_d': (35,  25,  15,  255),
    'belt':    (80,  60,  30,  255),
    'sword_b': (140, 120, 65,  255),
    'sword_l': (195, 200, 215, 255),
    'sword_d': (140, 145, 158, 255),
    'eye':     (35,  25,  18,  255),
    'mouth':   (175, 110, 95,  255),
}

def draw_carla_base(draw, P=2):
    """Draw Carla's body (idle standing). Returns nothing, modifies draw."""
    C = CARLA
    cx = CX
    fy = FY

    # Boots
    sp_rect(draw, cx-14, fy-18, cx-4,  fy,    C['boots'])
    sp_rect(draw, cx+4,  fy-18, cx+14, fy,    C['boots'])
    sp_rect(draw, cx-16, fy-8,  cx-2,  fy,    C['boots'])
    sp_rect(draw, cx+2,  fy-8,  cx+16, fy,    C['boots'])
    # boot shadow
    sp_rect(draw, cx-15, fy-16, cx-5,  fy-2,  C['boots_d'])
    sp_rect(draw, cx+5,  fy-16, cx+15, fy-2,  C['boots_d'])

    # Pants
    sp_rect(draw, cx-12, fy-50, cx-3,  fy-16, C['pants'])
    sp_rect(draw, cx+3,  fy-50, cx+12, fy-16, C['pants'])
    # inner pant shading
    sp_rect(draw, cx-10, fy-48, cx-5,  fy-18, C['pants_d'])
    sp_rect(draw, cx+5,  fy-48, cx+10, fy-18, C['pants_d'])

    # Belt
    sp_rect(draw, cx-14, fy-54, cx+14, fy-50, C['belt'])

    # Vest / torso
    sp_rect(draw, cx-14, fy-88, cx+14, fy-52, C['vest'])
    sp_rect(draw, cx-12, fy-86, cx+12, fy-54, C['vest'])
    # vest center line (shirt visible)
    sp_rect(draw, cx-2,  fy-86, cx+2,  fy-54, C['shirt'])
    # vest shading
    sp_rect(draw, cx-13, fy-87, cx-6,  fy-54, C['vest_d'])
    sp_rect(draw, cx+6,  fy-87, cx+13, fy-54, C['vest_d'])
    # vest highlight
    sp_rect(draw, cx-5,  fy-87, cx-3,  fy-54, C['vest_l'])

    # Arms (shirt sleeves)
    # Left arm (her right) — down
    sp_rect(draw, cx-22, fy-84, cx-14, fy-62, C['shirt'])
    sp_rect(draw, cx-22, fy-62, cx-14, fy-56, C['skin'])
    # Right arm — hand on sword hilt
    sp_rect(draw, cx+14, fy-84, cx+22, fy-58, C['shirt'])
    sp_rect(draw, cx+14, fy-58, cx+22, fy-50, C['skin'])

    # Sword hilt (right side)
    sp_rect(draw, cx+20, fy-88, cx+24, fy-52, C['sword_b'])  # grip
    sp_hline(draw, cx+16, cx+30, fy-90, C['sword_b'], P)     # crossguard
    # blade (going up)
    sp_vline(draw, cx+22, fy-140, fy-90, C['sword_l'], P)
    sp_vline(draw, cx+24, fy-138, fy-92, C['sword_d'], P)

    # Neck + head
    sp_rect(draw, cx-4,  fy-96, cx+4,  fy-88, C['skin'])
    # Head
    sp_oval(draw, cx, fy-108, 14, 12, C['skin'], P)
    sp_rect(draw, cx-13, fy-116, cx+13, fy-100, C['skin'])
    # Face details
    sp_rect(draw, cx-7,  fy-114, cx-3,  fy-112, C['eye'])  # left eye
    sp_rect(draw, cx+3,  fy-114, cx+7,  fy-112, C['eye'])  # right eye
    sp_rect(draw, cx-3,  fy-108, cx+3,  fy-106, C['mouth'])  # mouth
    # face shading
    sp_rect(draw, cx-12, fy-118, cx-8,  fy-100, C['skin_d'])

    # Hair (tied back)
    sp_rect(draw, cx-13, fy-126, cx+13, fy-116, C['hair'])
    sp_rect(draw, cx-12, fy-130, cx+12, fy-124, C['hair'])
    sp_rect(draw, cx-11, fy-133, cx+8,  fy-128, C['hair'])
    sp_rect(draw, cx+10, fy-128, cx+18, fy-118, C['hair'])  # ponytail
    # hair highlight
    sp_rect(draw, cx-6, fy-131, cx+2, fy-126, C['hair_h'])


def gen_carla_idle(shift=0):
    img = new_sprite()
    draw = ImageDraw.Draw(img)
    draw_carla_base(draw)
    if shift:
        # slight weight shift — move left leg slightly out
        C = CARLA
        sp_rect(draw, CX-16, FY-20, CX-4, FY, C['boots'])
        sp_rect(draw, CX-15, FY-6, CX-3, FY, C['boots_d'])
    return img


def gen_carla_idle2():
    return gen_carla_idle(shift=1)


def gen_carla_talk1():
    img = new_sprite()
    draw = ImageDraw.Draw(img)
    # lean forward: shift whole body slightly right and lower head angle
    draw_carla_base(draw)
    C = CARLA
    # override head position (leaning forward, tilt)
    # erase existing head area (redraw slightly forward)
    sp_oval(draw, CX+2, FY-106, 14, 12, C['skin'], 2)
    sp_rect(draw, CX-10, FY-114, CX+14, FY-100, C['skin'])
    # mouth open
    sp_rect(draw, CX-3, FY-108, CX+4, FY-104, C['mouth'])
    sp_rect(draw, CX-2, FY-107, CX+3, FY-105, (220,180,160,255))
    # eyes
    sp_rect(draw, CX-5,  FY-114, CX-1,  FY-112, C['eye'])
    sp_rect(draw, CX+5,  FY-114, CX+9,  FY-112, C['eye'])
    # hair
    sp_rect(draw, CX-10, FY-124, CX+14, FY-114, C['hair'])
    return img


def gen_carla_talk2():
    img = new_sprite()
    draw = ImageDraw.Draw(img)
    draw_carla_base(draw)
    C = CARLA
    # Gesture: left arm raised/out
    sp_rect(draw, CX-30, FY-80, CX-14, FY-74, C['shirt'])
    sp_rect(draw, CX-30, FY-76, CX-22, FY-66, C['skin'])
    sp_rect(draw, CX-2, FY-108, CX+4, FY-104, C['mouth'])  # mouth open
    return img


# ══════════════════════════════════════════════════════════════════════════════
# STAN — flamboyant used ship salesman
# Colors: yellow/white stripe jacket, blue pants, red bowtie, top hat
# ══════════════════════════════════════════════════════════════════════════════
STAN = {
    'skin':    (230, 185, 140, 255),
    'skin_d':  (195, 150, 110, 255),
    'hair':    (50,  35,  15,  255),
    'jacket_y': (240, 210, 40, 255),
    'jacket_w': (240, 238, 225, 255),
    'jacket_d': (190, 160, 28, 255),
    'stripe':  (30,  30,  28,  255),
    'pants':   (40,  70,  160, 255),
    'pants_d': (28,  50,  120, 255),
    'boots':   (30,  25,  20,  255),
    'tie':     (210, 30,  30,  255),
    'hat':     (30,  25,  20,  255),
    'hat_band':(200, 160, 30,  255),
    'eye':     (30,  22,  15,  255),
    'teeth':   (240, 240, 230, 255),
    'mouth':   (180, 100, 85,  255),
    'gums':    (195, 120, 110, 255),
    'glove':   (240, 235, 220, 255),
}

def draw_stan_base(draw, arm_pose='down', P=2):
    C = STAN
    cx = CX
    fy = FY

    # Boots
    sp_rect(draw, cx-13, fy-16, cx-3,  fy,    C['boots'])
    sp_rect(draw, cx+3,  fy-16, cx+13, fy,    C['boots'])
    sp_rect(draw, cx-15, fy-8,  cx-2,  fy,    C['boots'])
    sp_rect(draw, cx+2,  fy-8,  cx+14, fy,    C['boots'])

    # Pants
    sp_rect(draw, cx-13, fy-52, cx-2,  fy-14, C['pants'])
    sp_rect(draw, cx+2,  fy-52, cx+13, fy-14, C['pants'])
    sp_rect(draw, cx-11, fy-50, cx-4,  fy-16, C['pants_d'])
    sp_rect(draw, cx+4,  fy-50, cx+11, fy-16, C['pants_d'])

    # Jacket body — striped (alternating 2px yellow/white stripes)
    for sx8 in range(cx-16, cx+16, P*2):
        stripe_c = C['jacket_y'] if (sx8//2) % 2 == 0 else C['jacket_w']
        sp_rect(draw, sx8, fy-90, sx8+P*2-1, fy-52, stripe_c)
    # jacket outline/shadow
    sp_rect(draw, cx-16, fy-90, cx-14, fy-52, C['jacket_d'])
    sp_rect(draw, cx+14, fy-90, cx+16, fy-52, C['jacket_d'])
    # lapels
    sp_rect(draw, cx-8, fy-90, cx-2, fy-76, C['jacket_w'])
    sp_rect(draw, cx+2, fy-90, cx+8, fy-76, C['jacket_w'])

    # Bowtie
    sp_rect(draw, cx-5, fy-80, cx+5, fy-77, C['tie'])
    draw.polygon([(cx-7,fy-82),(cx-1,fy-78),(cx-7,fy-75)], fill=C['tie'])
    draw.polygon([(cx+7,fy-82),(cx+1,fy-78),(cx+7,fy-75)], fill=C['tie'])

    # Arms
    if arm_pose == 'down':
        sp_rect(draw, cx-24, fy-88, cx-16, fy-58, C['jacket_y'])
        sp_rect(draw, cx+16, fy-88, cx+24, fy-58, C['jacket_y'])
        # stripe arms
        for sx9 in range(cx-24, cx-16, P*2):
            if (sx9//2) % 2 == 0:
                sp_rect(draw, sx9, fy-86, sx9+P-1, fy-60, C['jacket_w'])
        sp_rect(draw, cx-24, fy-60, cx-16, fy-52, C['glove'])
        sp_rect(draw, cx+16, fy-60, cx+24, fy-52, C['glove'])
    elif arm_pose == 'wide':
        # Stan wide stance arms slightly out
        sp_rect(draw, cx-26, fy-86, cx-14, fy-62, C['jacket_y'])
        sp_rect(draw, cx+14, fy-86, cx+26, fy-62, C['jacket_y'])
        sp_rect(draw, cx-27, fy-62, cx-15, fy-54, C['glove'])
        sp_rect(draw, cx+15, fy-62, cx+27, fy-54, C['glove'])
    elif arm_pose == 'point':
        # right arm pointing at viewer
        sp_rect(draw, cx+16, fy-84, cx+24, fy-64, C['jacket_y'])
        sp_rect(draw, cx+24, fy-76, cx+38, fy-68, C['jacket_y'])
        sp_rect(draw, cx+36, fy-72, cx+44, fy-66, C['glove'])
        # other arm down
        sp_rect(draw, cx-24, fy-88, cx-16, fy-58, C['jacket_y'])
        sp_rect(draw, cx-24, fy-60, cx-16, fy-52, C['glove'])
    elif arm_pose == 'gesturing':
        # both arms out
        sp_rect(draw, cx-30, fy-82, cx-14, fy-64, C['jacket_y'])
        sp_rect(draw, cx+14, fy-82, cx+30, fy-64, C['jacket_y'])
        sp_rect(draw, cx-32, fy-68, cx-20, fy-60, C['glove'])
        sp_rect(draw, cx+20, fy-68, cx+32, fy-60, C['glove'])

    # Neck
    sp_rect(draw, cx-4, fy-96, cx+4, fy-90, C['skin'])

    # Head
    sp_oval(draw, cx, fy-108, 14, 12, C['skin'], P)
    sp_rect(draw, cx-13, fy-118, cx+13, fy-100, C['skin'])
    # chubby cheeks
    sp_rect(draw, cx-15, fy-114, cx-10, fy-106, C['skin_d'])
    sp_rect(draw, cx+10, fy-114, cx+15, fy-106, C['skin_d'])

    # Eyes (big grin implies squinted/happy)
    sp_rect(draw, cx-8,  fy-114, cx-3,  fy-112, C['eye'])
    sp_rect(draw, cx+3,  fy-114, cx+8,  fy-112, C['eye'])

    # Big grin
    # mouth
    sp_rect(draw, cx-8, fy-108, cx+8, fy-104, C['mouth'])
    sp_rect(draw, cx-7, fy-107, cx+7, fy-105, C['teeth'])

    # Top hat
    sp_rect(draw, cx-14, fy-134, cx+14, fy-127, C['hat'])  # brim
    sp_rect(draw, cx-10, fy-158, cx+10, fy-132, C['hat'])  # crown
    sp_hline(draw, cx-10, cx+10, fy-134, C['hat_band'], P) # band


def gen_stan_idle():
    img = new_sprite()
    draw = ImageDraw.Draw(img)
    draw_stan_base(draw, arm_pose='wide')
    return img


def gen_stan_idle2():
    img = new_sprite()
    draw = ImageDraw.Draw(img)
    draw_stan_base(draw, arm_pose='down')
    # waving arm override
    C = STAN
    sp_rect(draw, CX+16, FY-88, CX+24, FY-68, C['jacket_y'])
    sp_rect(draw, CX+24, FY-88, CX+32, FY-76, C['jacket_y'])
    sp_rect(draw, CX+30, FY-88, CX+38, FY-80, C['glove'])
    return img


def gen_stan_talk1():
    img = new_sprite()
    draw = ImageDraw.Draw(img)
    draw_stan_base(draw, arm_pose='point')
    C = STAN
    # mouth open more
    sp_rect(draw, CX-8, FY-109, CX+8, FY-103, C['mouth'])
    sp_rect(draw, CX-7, FY-108, CX+7, FY-105, C['teeth'])
    sp_rect(draw, CX-5, FY-107, CX+5, FY-106, (220,180,160,255))
    return img


def gen_stan_talk2():
    img = new_sprite()
    draw = ImageDraw.Draw(img)
    draw_stan_base(draw, arm_pose='gesturing')
    C = STAN
    sp_rect(draw, CX-8, FY-109, CX+8, FY-103, C['mouth'])
    sp_rect(draw, CX-7, FY-108, CX+7, FY-105, C['teeth'])
    return img


# ══════════════════════════════════════════════════════════════════════════════
# SHERIFF — stocky lawman
# Colors: blue uniform, gold badge, stern face, tan skin
# ══════════════════════════════════════════════════════════════════════════════
SHERIFF = {
    'skin':    (215, 175, 138, 255),
    'skin_d':  (180, 140, 105, 255),
    'hair':    (65,  50,  32,  255),
    'mustache':(55,  40,  24,  255),
    'uniform': (42,  68,  130, 255),
    'uniform_d':(28, 48,  95,  255),
    'uniform_l':(58, 90,  160, 255),
    'badge':   (215, 185, 40,  255),
    'badge_d': (160, 135, 22,  255),
    'belt':    (55,  42,  26,  255),
    'pants':   (35,  55,  105, 255),
    'pants_d': (22,  38,  78,  255),
    'boots':   (32,  26,  18,  255),
    'hat':     (38,  60,  115, 255),
    'hat_b':   (28,  46,  88,  255),
    'hat_brim':(55,  75,  130, 255),
    'eye':     (30,  22,  15,  255),
    'mouth':   (170, 105, 88,  255),
    'gun':     (60,  58,  55,  255),
    'gun_l':   (80,  78,  75,  255),
}

def draw_sheriff_base(draw, pose='idle', P=2):
    C = SHERIFF
    cx = CX
    fy = FY

    # Boots
    sp_rect(draw, cx-14, fy-18, cx-3,  fy,    C['boots'])
    sp_rect(draw, cx+3,  fy-18, cx+14, fy,    C['boots'])
    sp_rect(draw, cx-16, fy-8,  cx-2,  fy,    C['boots'])
    sp_rect(draw, cx+2,  fy-8,  cx+16, fy,    C['boots'])

    # Pants (stocky)
    sp_rect(draw, cx-15, fy-54, cx-2,  fy-16, C['pants'])
    sp_rect(draw, cx+2,  fy-54, cx+15, fy-16, C['pants'])
    sp_rect(draw, cx-13, fy-52, cx-5,  fy-18, C['pants_d'])
    sp_rect(draw, cx+5,  fy-52, cx+13, fy-18, C['pants_d'])

    # Belt
    sp_rect(draw, cx-17, fy-58, cx+17, fy-54, C['belt'])
    # gun holster (right hip)
    sp_rect(draw, cx+12, fy-56, cx+20, fy-42, C['belt'])
    sp_rect(draw, cx+13, fy-54, cx+19, fy-44, (40,30,18,255))

    # Uniform body (stocky torso)
    sp_rect(draw, cx-17, fy-96, cx+17, fy-56, C['uniform'])
    sp_rect(draw, cx-15, fy-94, cx+15, fy-58, C['uniform'])
    # shading
    sp_rect(draw, cx-16, fy-95, cx-8,  fy-58, C['uniform_d'])
    sp_rect(draw, cx+8,  fy-95, cx+16, fy-58, C['uniform_d'])
    # center crease
    sp_vline(draw, cx, fy-94, fy-58, C['uniform_d'], P)
    # shirt collar
    sp_rect(draw, cx-6, fy-96, cx+6, fy-92, (220, 215, 200, 255))

    # Badge
    # star shape (simplified)
    for a3 in range(0, 360, 72):
        angle = math.radians(a3)
        bx3 = cx - 8 + int(6 * math.cos(angle))
        by3 = fy - 82 + int(6 * math.sin(angle))
        draw.rectangle([bx3, by3, bx3+P-1, by3+P-1], fill=C['badge'])
    sp_circle(draw, cx-8, fy-82, 3, C['badge'], P)
    sp_rect(draw, cx-10, fy-84, cx-5, fy-80, C['badge'])

    # Arms
    if pose in ['idle', 'idle2', 'talk1', 'talk2']:
        if pose == 'idle':
            # arms crossed
            sp_rect(draw, cx-26, fy-92, cx-16, fy-72, C['uniform'])
            sp_rect(draw, cx+16, fy-92, cx+26, fy-72, C['uniform'])
            sp_rect(draw, cx-26, fy-76, cx+0,  fy-70, C['uniform'])  # cross
            sp_rect(draw, cx+0,  fy-76, cx+26, fy-70, C['uniform_d'])
            sp_rect(draw, cx-22, fy-74, cx-2,  fy-68, C['skin'])
            sp_rect(draw, cx+2,  fy-74, cx+22, fy-68, C['skin_d'])
        elif pose == 'idle2':
            # thumbs in belt
            sp_rect(draw, cx-26, fy-88, cx-16, fy-72, C['uniform'])
            sp_rect(draw, cx+16, fy-88, cx+26, fy-72, C['uniform'])
            sp_rect(draw, cx-24, fy-64, cx-14, fy-56, C['skin'])
            sp_rect(draw, cx+14, fy-64, cx+24, fy-56, C['skin'])
        elif pose == 'talk1':
            # pointing right arm
            sp_rect(draw, cx+16, fy-88, cx+26, fy-72, C['uniform'])
            sp_rect(draw, cx+26, fy-80, cx+42, fy-72, C['uniform'])
            sp_rect(draw, cx+40, fy-76, cx+50, fy-68, C['skin'])
            # left arm down
            sp_rect(draw, cx-26, fy-88, cx-16, fy-64, C['uniform'])
            sp_rect(draw, cx-24, fy-64, cx-14, fy-56, C['skin'])
        elif pose == 'talk2':
            # both arms out / exasperated
            sp_rect(draw, cx-30, fy-86, cx-14, fy-68, C['uniform'])
            sp_rect(draw, cx+14, fy-86, cx+30, fy-68, C['uniform'])
            sp_rect(draw, cx-30, fy-70, cx-20, fy-60, C['skin'])
            sp_rect(draw, cx+20, fy-70, cx+30, fy-60, C['skin'])

    # Neck + head
    sp_rect(draw, cx-5, fy-104, cx+5, fy-96, C['skin'])
    sp_oval(draw, cx, fy-116, 15, 13, C['skin'], P)
    sp_rect(draw, cx-14, fy-126, cx+14, fy-106, C['skin'])
    # face shading
    sp_rect(draw, cx-13, fy-124, cx-8, fy-106, C['skin_d'])

    # Mustache
    sp_rect(draw, cx-8, fy-114, cx+8, fy-111, C['mustache'])
    sp_rect(draw, cx-10, fy-113, cx-6, fy-111, C['mustache'])
    sp_rect(draw, cx+6,  fy-113, cx+10, fy-111, C['mustache'])

    # Stern eyes (furrowed brows)
    sp_rect(draw, cx-9,  fy-122, cx-3,  fy-120, C['hair'])  # left brow
    sp_rect(draw, cx+3,  fy-122, cx+9,  fy-120, C['hair'])  # right brow
    sp_rect(draw, cx-8,  fy-120, cx-3,  fy-118, C['eye'])   # left eye
    sp_rect(draw, cx+3,  fy-120, cx+8,  fy-118, C['eye'])   # right eye

    # Mouth (stern line)
    sp_rect(draw, cx-5, fy-112, cx+5, fy-110, C['mouth'])

    if pose == 'talk1':
        sp_rect(draw, cx-4, fy-113, cx+4, fy-108, C['mouth'])
    elif pose == 'talk2':
        sp_rect(draw, cx-6, fy-114, cx+6, fy-108, C['mouth'])
        sp_rect(draw, cx-5, fy-113, cx+5, fy-110, (215,175,155,255))

    # Hat (police/sheriff style)
    # brim
    sp_rect(draw, cx-18, fy-130, cx+18, fy-127, C['hat_brim'])
    # crown
    sp_rect(draw, cx-13, fy-152, cx+13, fy-128, C['hat'])
    sp_rect(draw, cx-12, fy-150, cx+12, fy-130, C['hat'])
    # hat brim front shadow
    sp_rect(draw, cx-16, fy-130, cx+16, fy-129, C['hat_b'])
    # hat band
    sp_rect(draw, cx-13, fy-134, cx+13, fy-132, (180, 160, 28, 255))


def gen_sheriff_idle():
    img = new_sprite()
    draw = ImageDraw.Draw(img)
    draw_sheriff_base(draw, pose='idle')
    return img


def gen_sheriff_idle2():
    img = new_sprite()
    draw = ImageDraw.Draw(img)
    draw_sheriff_base(draw, pose='idle2')
    return img


def gen_sheriff_talk1():
    img = new_sprite()
    draw = ImageDraw.Draw(img)
    draw_sheriff_base(draw, pose='talk1')
    return img


def gen_sheriff_talk2():
    img = new_sprite()
    draw = ImageDraw.Draw(img)
    draw_sheriff_base(draw, pose='talk2')
    return img


# ══════════════════════════════════════════════════════════════════════════════
# OTIS — scruffy pirate prisoner
# Colors: torn dirty clothes, sad face, unkempt hair
# ══════════════════════════════════════════════════════════════════════════════
OTIS = {
    'skin':    (200, 162, 122, 255),
    'skin_d':  (165, 128, 92,  255),
    'beard':   (75,  58,  35,  255),
    'beard_l': (98,  78,  48,  255),
    'hair':    (68,  50,  28,  255),
    'shirt':   (140, 118, 82,  255),
    'shirt_d': (105, 86,  56,  255),
    'shirt_l': (165, 140, 100, 255),
    'tear1':   (88,  68,  40,  255),
    'tear2':   (108, 88,  58,  255),
    'pants':   (80,  65,  48,  255),
    'pants_d': (58,  45,  32,  255),
    'boots':   (45,  35,  22,  255),
    'belt':    (60,  46,  28,  255),
    'eye':     (30,  22,  14,  255),
    'eye_bg':  (180, 155, 120, 255),
    'mouth':   (155, 95,  80,  255),
    'rope':    (120, 105, 72,  255),
    'bars':    (62,  68,  78,  255),
    'bars_l':  (85,  92,  105, 255),
}

def draw_otis_base(draw, pose='idle', P=2):
    C = OTIS
    cx = CX
    fy = FY

    # Boots (worn, slightly asymmetric)
    sp_rect(draw, cx-13, fy-16, cx-3,  fy,    C['boots'])
    sp_rect(draw, cx+3,  fy-16, cx+13, fy,    C['boots'])
    sp_rect(draw, cx-15, fy-8,  cx-2,  fy,    C['boots'])
    sp_rect(draw, cx+2,  fy-8,  cx+14, fy,    C['boots'])

    # Pants (torn, patchy)
    sp_rect(draw, cx-13, fy-50, cx-2,  fy-14, C['pants'])
    sp_rect(draw, cx+2,  fy-50, cx+13, fy-14, C['pants'])
    sp_rect(draw, cx-11, fy-48, cx-4,  fy-16, C['pants_d'])
    sp_rect(draw, cx+4,  fy-48, cx+11, fy-16, C['pants_d'])
    # torn patches
    sp_rect(draw, cx-12, fy-40, cx-6,  fy-34, C['tear2'])
    sp_rect(draw, cx+6,  fy-44, cx+12, fy-38, C['tear1'])

    # Belt (loose)
    sp_rect(draw, cx-14, fy-54, cx+14, fy-51, C['belt'])

    # Shirt (torn, dirty)
    sp_rect(draw, cx-14, fy-90, cx+14, fy-52, C['shirt_d'])
    sp_rect(draw, cx-12, fy-88, cx+12, fy-54, C['shirt'])
    # shirt highlights
    sp_rect(draw, cx-10, fy-86, cx-4,  fy-56, C['shirt_l'])
    # tears/holes
    sp_rect(draw, cx+4,  fy-80, cx+10, fy-74, C['tear1'])
    sp_rect(draw, cx-8,  fy-64, cx-2,  fy-60, C['tear2'])

    # Arms
    if pose == 'idle':
        # slumped, hands at sides
        sp_rect(draw, cx-22, fy-88, cx-14, fy-60, C['shirt'])
        sp_rect(draw, cx+14, fy-88, cx+22, fy-60, C['shirt'])
        sp_rect(draw, cx-22, fy-62, cx-14, fy-52, C['skin'])
        sp_rect(draw, cx+14, fy-62, cx+22, fy-52, C['skin'])
    elif pose == 'scratch':
        # scratching head
        sp_rect(draw, cx-22, fy-88, cx-14, fy-60, C['shirt'])
        sp_rect(draw, cx+14, fy-88, cx+22, fy-80, C['shirt'])
        sp_rect(draw, cx+22, fy-90, cx+30, fy-82, C['shirt'])
        sp_rect(draw, cx+28, fy-96, cx+36, fy-88, C['skin'])
        sp_rect(draw, cx-22, fy-62, cx-14, fy-52, C['skin'])
    elif pose == 'bars':
        # hands on bars
        sp_rect(draw, cx-22, fy-84, cx-14, fy-62, C['shirt'])
        sp_rect(draw, cx+14, fy-84, cx+22, fy-62, C['shirt'])
        sp_rect(draw, cx-22, fy-64, cx-14, fy-54, C['skin'])
        sp_rect(draw, cx+14, fy-64, cx+22, fy-54, C['skin'])
        # hands reaching forward (grabbing bars)
        sp_rect(draw, cx-24, fy-58, cx-10, fy-52, C['skin'])
        sp_rect(draw, cx+10, fy-58, cx+24, fy-52, C['skin'])
        # bars
        for bx6 in [cx-20, cx-14, cx+14, cx+20]:
            sp_vline(draw, bx6, fy-80, fy-40, C['bars'], P*2)
    elif pose == 'shrug':
        # shrugging
        sp_rect(draw, cx-26, fy-84, cx-12, fy-66, C['shirt'])
        sp_rect(draw, cx+12, fy-84, cx+26, fy-66, C['shirt'])
        sp_rect(draw, cx-26, fy-70, cx-14, fy-60, C['skin'])
        sp_rect(draw, cx+14, fy-70, cx+26, fy-60, C['skin'])
        # raised shoulders
        sp_rect(draw, cx-18, fy-96, cx-10, fy-88, C['shirt'])
        sp_rect(draw, cx+10, fy-96, cx+18, fy-88, C['shirt'])

    # Neck
    sp_rect(draw, cx-4, fy-98, cx+4, fy-90, C['skin'])

    # Head (somewhat droopy)
    sp_oval(draw, cx, fy-108, 14, 12, C['skin'], P)
    sp_rect(draw, cx-13, fy-118, cx+13, fy-100, C['skin'])
    sp_rect(draw, cx-12, fy-120, cx+12, fy-116, C['skin'])
    # face shading (sad)
    sp_rect(draw, cx-12, fy-118, cx-7, fy-100, C['skin_d'])
    sp_rect(draw, cx+7, fy-118, cx+12, fy-100, C['skin_d'])

    # Sad eyes (droopy)
    sp_rect(draw, cx-8,  fy-114, cx-3,  fy-111, C['eye'])
    sp_rect(draw, cx+3,  fy-114, cx+8,  fy-111, C['eye'])
    # under-eye bags
    sp_rect(draw, cx-8,  fy-111, cx-3,  fy-109, C['skin_d'])
    sp_rect(draw, cx+3,  fy-111, cx+8,  fy-109, C['skin_d'])

    # Sad mouth (frown)
    sp_rect(draw, cx-5, fy-106, cx+5, fy-104, C['mouth'])
    sp_rect(draw, cx-7, fy-105, cx-4, fy-104, C['mouth'])
    sp_rect(draw, cx+4, fy-105, cx+7, fy-104, C['mouth'])

    if pose == 'bars':
        # pleading mouth open
        sp_rect(draw, cx-5, fy-107, cx+5, fy-103, C['mouth'])
        sp_rect(draw, cx-4, fy-106, cx+4, fy-104, (195,140,120,255))

    # Beard (scraggly)
    sp_rect(draw, cx-10, fy-108, cx+10, fy-100, C['beard'])
    sp_rect(draw, cx-11, fy-106, cx-7,  fy-100, C['beard'])
    sp_rect(draw, cx+7,  fy-106, cx+11, fy-100, C['beard'])
    # beard highlight
    sp_rect(draw, cx-8, fy-107, cx-4, fy-102, C['beard_l'])
    # chin stubble
    sp_rect(draw, cx-6, fy-104, cx+6, fy-100, C['beard'])

    # Unkempt hair
    sp_rect(draw, cx-14, fy-130, cx+14, fy-118, C['hair'])
    sp_rect(draw, cx-13, fy-132, cx+8,  fy-128, C['hair'])
    sp_rect(draw, cx+6,  fy-132, cx+16, fy-126, C['hair'])
    sp_rect(draw, cx-15, fy-124, cx-10, fy-120, C['hair'])
    sp_rect(draw, cx+2,  fy-136, cx+12, fy-130, C['hair'])
    # cowlick
    sp_rect(draw, cx-2,  fy-138, cx+6,  fy-132, C['hair'])


def gen_otis_idle():
    img = new_sprite()
    draw = ImageDraw.Draw(img)
    draw_otis_base(draw, pose='idle')
    return img


def gen_otis_idle2():
    img = new_sprite()
    draw = ImageDraw.Draw(img)
    draw_otis_base(draw, pose='scratch')
    return img


def gen_otis_talk1():
    img = new_sprite()
    draw = ImageDraw.Draw(img)
    draw_otis_base(draw, pose='bars')
    return img


def gen_otis_talk2():
    img = new_sprite()
    draw = ImageDraw.Draw(img)
    draw_otis_base(draw, pose='shrug')
    return img


# ══════════════════════════════════════════════════════════════════════════════
#  MAIN
# ══════════════════════════════════════════════════════════════════════════════

def save_bg(img, name):
    assert img.size == (BG_W, BG_H), f"Wrong size: {img.size}"
    path = os.path.join(BG_DIR, f"{name}.png")
    img.save(path, "PNG", optimize=False)
    print(f"  [BG]  {path}")


def save_sp(img, name):
    assert img.size == (SP_W, SP_H), f"Wrong size: {img.size}"
    path = os.path.join(SP_DIR, f"{name}.png")
    img.save(path, "PNG", optimize=False)
    print(f"  [SP]  {path}")


def main():
    print("=== Generating backgrounds ===")

    save_bg(make_village_road(),       "village_road")
    save_bg(make_governor_mansion(),   "governor_mansion")
    save_bg(make_mansion_interior(),   "mansion_interior")
    save_bg(make_stan_shop(),          "stan_shop")
    save_bg(make_sword_master_area(),  "sword_master_area")
    save_bg(make_prison(),             "prison")

    print("\n=== Generating NPC sprite sheets ===")

    # Carla
    save_sp(gen_carla_idle(),   "carla_idle")
    save_sp(gen_carla_idle2(),  "carla_idle2")
    save_sp(gen_carla_talk1(),  "carla_talk1")
    save_sp(gen_carla_talk2(),  "carla_talk2")

    # Stan
    save_sp(gen_stan_idle(),    "stan_idle")
    save_sp(gen_stan_idle2(),   "stan_idle2")
    save_sp(gen_stan_talk1(),   "stan_talk1")
    save_sp(gen_stan_talk2(),   "stan_talk2")

    # Sheriff
    save_sp(gen_sheriff_idle(),  "sheriff_idle")
    save_sp(gen_sheriff_idle2(), "sheriff_idle2")
    save_sp(gen_sheriff_talk1(), "sheriff_talk1")
    save_sp(gen_sheriff_talk2(), "sheriff_talk2")

    # Otis
    save_sp(gen_otis_idle(),    "otis_idle")
    save_sp(gen_otis_idle2(),   "otis_idle2")
    save_sp(gen_otis_talk1(),   "otis_talk1")
    save_sp(gen_otis_talk2(),   "otis_talk2")

    print("\nDone! All files generated successfully.")


if __name__ == "__main__":
    main()
