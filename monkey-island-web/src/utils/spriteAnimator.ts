import { getImage, loadImage } from './assetLoader';

export interface SpriteAnimation {
  characterId: string;
  frames: string[]; // paths to frame images
  frameDuration: number; // ms per frame
}

const SPRITE_ANIMS: Record<string, SpriteAnimation> = {
  guybrush: {
    characterId: 'guybrush',
    frames: [
      '/assets/sprites/guybrush_walk1.png',
      '/assets/sprites/guybrush_walk2.png',
      '/assets/sprites/guybrush_walk3.png',
      '/assets/sprites/guybrush_walk4.png',
    ],
    frameDuration: 200,
  },
  lechuck: {
    characterId: 'lechuck',
    frames: [
      '/assets/sprites/lechuck_walk1.png',
      '/assets/sprites/lechuck_walk2.png',
    ],
    frameDuration: 300,
  },
  elaine: {
    characterId: 'elaine',
    frames: [
      '/assets/sprites/elaine_walk1.png',
      '/assets/sprites/elaine_walk2.png',
    ],
    frameDuration: 200,
  },
};

const IDLE_SPRITES: Record<string, string> = {
  guybrush: '/assets/sprites/guybrush_idle.png',
  lechuck: '/assets/sprites/lechuck_idle.png',
  elaine: '/assets/sprites/elaine_idle.png',
};

export async function preloadCharacterSprites(): Promise<void> {
  const allPaths: string[] = [];
  for (const anim of Object.values(SPRITE_ANIMS)) {
    allPaths.push(...anim.frames);
  }
  for (const path of Object.values(IDLE_SPRITES)) {
    allPaths.push(path);
  }
  await Promise.allSettled(allPaths.map((p) => loadImage(p)));
}

export function drawCharacterSprite(
  ctx: CanvasRenderingContext2D,
  characterId: string,
  x: number,
  y: number,
  facing: 'left' | 'right',
  isMoving: boolean,
  frame: number,
  scale: number = 1.0,
): boolean {
  const anim = SPRITE_ANIMS[characterId];
  if (!anim) return false;

  // Pick the right frame
  let imgPath: string;
  if (isMoving && anim.frames.length > 0) {
    const frameIndex = Math.floor(frame / (anim.frameDuration / 100)) % anim.frames.length;
    imgPath = anim.frames[frameIndex];
  } else {
    imgPath = IDLE_SPRITES[characterId] || anim.frames[0];
  }

  const img = getImage(imgPath);
  if (!img) return false;

  // Sprite draw size (2x base for 1600x800 canvas, scaled by depth)
  const drawW = 64 * scale;
  const drawH = 96 * scale;

  ctx.save();

  if (facing === 'left') {
    // Mirror horizontally
    ctx.translate(x, y - drawH + 16);
    ctx.scale(-1, 1);
    ctx.drawImage(img, -drawW / 2, 0, drawW, drawH);
  } else {
    ctx.drawImage(img, x - drawW / 2, y - drawH + 16, drawW, drawH);
  }

  ctx.restore();

  // Draw shadow (scaled)
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(x, y + 12 * scale, drawW / 2.5, 6 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  return true;
}
