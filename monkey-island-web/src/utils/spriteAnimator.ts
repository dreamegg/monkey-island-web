// ═══════════════════════════════════════════════════════════
// Sprite Animator — time-based animation state machine
//
// Animation states:  idle | walk | talk | pickup | use
// Frame selection:   time-based (ms), not counter-based
// Gait cycle:        4-frame biomechanical walk
// ═══════════════════════════════════════════════════════════

import { getImage, loadImage } from './assetLoader';
import { ap } from './paths';

// ── Types ────────────────────────────────────────────────────

export type AnimationState = 'idle' | 'walk' | 'talk' | 'pickup' | 'use';

interface FrameSet {
  frames: string[];       // asset paths
  frameDuration: number;  // ms per frame
  loop: boolean;
}

type AnimConfig = {
  [K in AnimationState]?: FrameSet;
} & {
  idle: FrameSet;
  walk: FrameSet;
};

// ── Character animation definitions ─────────────────────────
//
// Walk cycle — 4 biomechanical side-view gait frames:
//   walk1 = R contact   (right heel strikes, arms opposite, body high)
//   walk2 = R recoil    (body descends, left foot in swing, arms crossing)
//   walk3 = L contact   (left heel strikes, arms opposite, body high)
//   walk4 = L recoil    (body descends, right foot in swing, arms crossing)
//
// Idle bob — 2 frames, 600ms each: upright / slight knee-bend weight shift
// Talk     — 4 frames, 120ms each: open / mid / closed / mid (lip-sync cycle)
// Pickup   — 4 frames, 200ms, no-loop: idle → bend → grab → idle

const ANIMS: Record<string, AnimConfig> = {
  guybrush: {
    idle: {
      frames: [
        '/assets/sprites/guybrush_idle.png',
        '/assets/sprites/guybrush_idle2.png',
      ],
      frameDuration: 600,
      loop: true,
    },
    walk: {
      frames: [
        '/assets/sprites/guybrush_walk1.png',
        '/assets/sprites/guybrush_walk2.png',
        '/assets/sprites/guybrush_walk3.png',
        '/assets/sprites/guybrush_walk4.png',
      ],
      frameDuration: 150,
      loop: true,
    },
    talk: {
      frames: [
        '/assets/sprites/guybrush_talk1.png',
        '/assets/sprites/guybrush_talk2.png',
        '/assets/sprites/guybrush_idle.png',
        '/assets/sprites/guybrush_talk2.png',
      ],
      frameDuration: 120,
      loop: true,
    },
    pickup: {
      frames: [
        '/assets/sprites/guybrush_idle.png',
        '/assets/sprites/guybrush_pickup.png',
        '/assets/sprites/guybrush_pickup.png',
        '/assets/sprites/guybrush_idle.png',
      ],
      frameDuration: 200,
      loop: false,
    },
  },

  lechuck: {
    idle: {
      frames: [
        '/assets/sprites/lechuck_idle.png',
        '/assets/sprites/lechuck_idle2.png',
      ],
      frameDuration: 500,
      loop: true,
    },
    walk: {
      frames: [
        '/assets/sprites/lechuck_walk1.png',
        '/assets/sprites/lechuck_walk2.png',
        '/assets/sprites/lechuck_walk1.png',
        '/assets/sprites/lechuck_walk2.png',
      ],
      frameDuration: 220,
      loop: true,
    },
    talk: {
      frames: [
        '/assets/sprites/lechuck_talk1.png',
        '/assets/sprites/lechuck_talk2.png',
        '/assets/sprites/lechuck_idle.png',
        '/assets/sprites/lechuck_talk2.png',
      ],
      frameDuration: 140,
      loop: true,
    },
  },

  elaine: {
    idle: {
      frames: [
        '/assets/sprites/elaine_idle.png',
        '/assets/sprites/elaine_idle2.png',
      ],
      frameDuration: 600,
      loop: true,
    },
    walk: {
      frames: [
        '/assets/sprites/elaine_walk1.png',
        '/assets/sprites/elaine_walk2.png',
        '/assets/sprites/elaine_walk3.png',
        '/assets/sprites/elaine_walk2.png',
      ],
      frameDuration: 160,
      loop: true,
    },
    talk: {
      frames: [
        '/assets/sprites/elaine_talk1.png',
        '/assets/sprites/elaine_talk2.png',
        '/assets/sprites/elaine_idle.png',
        '/assets/sprites/elaine_talk2.png',
      ],
      frameDuration: 130,
      loop: true,
    },
  },

  voodoo_lady: {
    idle: {
      frames: ['/assets/sprites/voodoo_lady.png'],
      frameDuration: 1000,
      loop: true,
    },
    walk: {
      frames: ['/assets/sprites/voodoo_lady.png'],
      frameDuration: 400,
      loop: true,
    },
    talk: {
      frames: ['/assets/sprites/voodoo_lady.png'],
      frameDuration: 150,
      loop: true,
    },
  },

  bartender: {
    idle: {
      frames: ['/assets/sprites/bartender.png'],
      frameDuration: 1000,
      loop: true,
    },
    walk: {
      frames: ['/assets/sprites/bartender.png'],
      frameDuration: 400,
      loop: true,
    },
    talk: {
      frames: ['/assets/sprites/bartender.png'],
      frameDuration: 150,
      loop: true,
    },
  },
};

// ── Time-based frame selection ────────────────────────────────

function getFrameIndex(frameSet: FrameSet, elapsedMs: number): number {
  const { frames, frameDuration, loop } = frameSet;
  if (frames.length === 1) return 0;
  const totalDuration = frameDuration * frames.length;
  const t = loop
    ? elapsedMs % totalDuration
    : Math.min(elapsedMs, totalDuration - 1);
  return Math.floor(t / frameDuration);
}

// ── Preloading ────────────────────────────────────────────────

export async function preloadCharacterSprites(): Promise<void> {
  const paths = new Set<string>();
  for (const config of Object.values(ANIMS)) {
    for (const frameSet of Object.values(config) as FrameSet[]) {
      for (const p of frameSet.frames) paths.add(p);
    }
  }
  await Promise.allSettled([...paths].map((p) => loadImage(ap(p)).catch(() => {})));
}

// ── Draw ─────────────────────────────────────────────────────

/**
 * Draw the character sprite at the correct animation frame.
 *
 * @param elapsedMs  Wall-clock ms since game start (or since state changed).
 *                   Pass `performance.now()` — it's only used modulo the
 *                   animation cycle, so absolute value doesn't matter.
 * @returns true if a sprite was drawn; false → caller can draw procedural fallback.
 */
export function drawCharacterSprite(
  ctx: CanvasRenderingContext2D,
  characterId: string,
  x: number,
  y: number,
  facing: 'left' | 'right',
  animState: AnimationState,
  elapsedMs: number,
  scale: number = 1.0,
): boolean {
  const config = ANIMS[characterId];
  if (!config) return false;

  // Resolve frame set — fall back gracefully
  const frameSet: FrameSet =
    config[animState] ??
    (animState === 'walk' ? config.walk : config.idle);

  const frameIndex = getFrameIndex(frameSet, elapsedMs);
  const framePath = frameSet.frames[frameIndex] ?? frameSet.frames[0];

  let img = getImage(ap(framePath));
  // Fall back to first idle frame if specific frame not loaded yet
  if (!img) img = getImage(ap(config.idle.frames[0]));
  if (!img) return false;

  const drawW = 64 * scale;
  const drawH = 96 * scale;

  ctx.save();
  if (facing === 'left') {
    ctx.translate(x, y - drawH + 16);
    ctx.scale(-1, 1);
    ctx.drawImage(img, -drawW / 2, 0, drawW, drawH);
  } else {
    ctx.drawImage(img, x - drawW / 2, y - drawH + 16, drawW, drawH);
  }
  ctx.restore();

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(x, y + 12 * scale, drawW / 2.5, 6 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  return true;
}

// ── Utilities ────────────────────────────────────────────────

export function hasAnimation(characterId: string, state: AnimationState): boolean {
  return !!(ANIMS[characterId]?.[state]);
}

/** Total duration in ms for a non-looping animation (0 if looping). */
export function getAnimDuration(characterId: string, state: AnimationState): number {
  const fs = ANIMS[characterId]?.[state];
  if (!fs || fs.loop) return 0;
  return fs.frameDuration * fs.frames.length;
}
