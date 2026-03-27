import { PALETTE } from '../engine/types';

export function drawStars(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const stars = [
    [45,20],[120,35],[200,15],[310,40],[400,25],[520,18],[600,42],
    [680,30],[95,55],[250,50],[460,48],[580,60],[350,12],[150,8],
    [700,15],[50,45],[500,38],[630,22],[180,42],[420,8],
  ];
  stars.forEach(([x, y]) => {
    const bright = Math.random() > 0.5;
    ctx.fillStyle = bright ? PALETTE.star : '#b0bec5';
    ctx.fillRect(x * (w / 800), y * (h / 400) * 0.4, 4, 4);
  });
}

export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  facing: 'left' | 'right',
  frame: number,
  scale: number = 1.0,
) {
  const s = 4 * scale;
  const bobY = Math.sin(frame * 0.3) * 1.5;
  const dir = facing === 'left' ? -1 : 1;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(x, y + 20 * s, 8 * s, 3 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Boots
  ctx.fillStyle = '#4e342e';
  ctx.fillRect(x - 5 * s * dir, y + 14 * s + bobY, 4 * s, 6 * s);
  ctx.fillRect(x + 1 * s * dir, y + 14 * s + bobY, 4 * s, 6 * s);

  // Pants
  ctx.fillStyle = PALETTE.pants;
  ctx.fillRect(x - 5 * s, y + 6 * s + bobY, 10 * s, 9 * s);

  // Shirt
  ctx.fillStyle = PALETTE.shirt;
  ctx.fillRect(x - 5 * s, y - 2 * s + bobY, 10 * s, 9 * s);

  // Arms
  const armSwing = Math.sin(frame * 0.5) * 2;
  ctx.fillStyle = PALETTE.shirt;
  ctx.fillRect(x - 7 * s, y + bobY + armSwing, 3 * s, 8 * s);
  ctx.fillRect(x + 4 * s, y + bobY - armSwing, 3 * s, 8 * s);

  // Hands
  ctx.fillStyle = PALETTE.skin;
  ctx.fillRect(x - 7 * s, y + 7 * s + bobY + armSwing, 3 * s, 2 * s);
  ctx.fillRect(x + 4 * s, y + 7 * s + bobY - armSwing, 3 * s, 2 * s);

  // Head
  ctx.fillStyle = PALETTE.skin;
  ctx.fillRect(x - 4 * s, y - 10 * s + bobY, 8 * s, 8 * s);

  // Hair (Guybrush-style blonde)
  ctx.fillStyle = PALETTE.hair;
  ctx.fillRect(x - 4 * s, y - 12 * s + bobY, 9 * s, 4 * s);
  // Ponytail
  ctx.fillRect(x + (dir > 0 ? 4 : -6) * s, y - 10 * s + bobY, 3 * s, 8 * s);

  // Eyes
  ctx.fillStyle = PALETTE.black;
  ctx.fillRect(x - 2 * s + dir * s, y - 8 * s + bobY, 1.5 * s, 2 * s);
  ctx.fillRect(x + 1 * s + dir * s, y - 8 * s + bobY, 1.5 * s, 2 * s);

  // Nose
  ctx.fillStyle = '#ffab91';
  ctx.fillRect(x + dir * 2 * s, y - 6 * s + bobY, 1.5 * s, 1.5 * s);
}
