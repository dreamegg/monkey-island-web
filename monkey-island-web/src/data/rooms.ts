import type { Room } from '../engine/types';
import { PALETTE } from '../engine/types';
import { drawStars } from '../utils/canvas';

// ── Room Background Renderers ──────────────────────────────

function renderHarbor(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const skyH = h * 0.45;
  for (let y = 0; y < skyH; y++) {
    const t = y / skyH;
    const r = Math.floor(26 + t * (15 - 26));
    const g = Math.floor(26 + t * (33 - 26));
    const b = Math.floor(46 + t * (62 - 46));
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, y, w, 1);
  }
  drawStars(ctx, w, h);
  ctx.fillStyle = PALETTE.moon;
  ctx.beginPath();
  ctx.arc(w * 0.8, h * 0.12, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.sky;
  ctx.beginPath();
  ctx.arc(w * 0.8 + 6, h * 0.12 - 4, 16, 0, Math.PI * 2);
  ctx.fill();
  for (let y = Math.floor(skyH); y < h * 0.7; y++) {
    const t = (y - skyH) / (h * 0.25);
    ctx.fillStyle = t < 0.5 ? PALETTE.sea : PALETTE.seaLight;
    for (let x = 0; x < w; x += 4) {
      const wave = Math.sin((x + y * 3) * 0.05) * 2;
      ctx.fillRect(x, y + wave, 4, 1);
    }
  }
  const dockY = h * 0.62;
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(w * 0.1, dockY, w * 0.7, h * 0.08);
  ctx.fillStyle = PALETTE.wood;
  for (let x = w * 0.1; x < w * 0.8; x += 20) {
    ctx.fillRect(x, dockY, 18, h * 0.06);
  }
  ctx.fillStyle = PALETTE.woodDark;
  [0.15, 0.35, 0.55, 0.75].forEach((px) => {
    ctx.fillRect(w * px, dockY + h * 0.06, 8, h * 0.12);
  });
  ctx.fillStyle = PALETTE.sandDark;
  ctx.fillRect(0, h * 0.7, w, h * 0.3);
  ctx.fillStyle = PALETTE.sand;
  ctx.fillRect(0, h * 0.72, w, h * 0.28);
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(w * 0.55, h * 0.32, 80, 30);
  ctx.fillStyle = PALETTE.wood;
  ctx.fillRect(w * 0.58, h * 0.34, 74, 20);
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(w * 0.62, h * 0.1, 4, h * 0.24);
  ctx.fillStyle = '#ddd';
  ctx.fillRect(w * 0.58, h * 0.12, 30, 18);
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(w * 0.2, h * 0.55, 6, h * 0.17);
  ctx.fillStyle = PALETTE.sign;
  ctx.fillRect(w * 0.14, h * 0.52, 60, 20);
  ctx.fillStyle = PALETTE.black;
  ctx.font = 'bold 10px monospace';
  ctx.fillText('HARBOR', w * 0.15, h * 0.55 + 12);
  ctx.fillStyle = PALETTE.woodLight;
  ctx.fillRect(w * 0.82, h * 0.65, 24, 28);
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(w * 0.82, h * 0.68, 24, 3);
  ctx.fillRect(w * 0.82, h * 0.74, 24, 3);
  ctx.fillStyle = PALETTE.stoneDark;
  ctx.fillRect(w * 0.72, h * 0.73, 6, 20);
  ctx.fillRect(w * 0.69, h * 0.89, 12, 4);
  ctx.beginPath();
  ctx.arc(w * 0.725, h * 0.73, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.rope;
  ctx.beginPath();
  ctx.arc(w * 0.78, h * 0.76, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8d6e63';
  ctx.beginPath();
  ctx.arc(w * 0.78, h * 0.76, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(w * 0.42, h * 0.5, 4, h * 0.12);
  ctx.fillStyle = PALETTE.torch;
  ctx.fillRect(w * 0.4, h * 0.47, 8, 8);
  ctx.fillStyle = PALETTE.torchGlow;
  ctx.fillRect(w * 0.41, h * 0.48, 6, 5);
}

function renderTavern(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#3e1f00';
  ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h * 0.6; y += 16) {
    ctx.fillStyle = y % 32 === 0 ? '#4a2800' : '#3e2200';
    ctx.fillRect(0, y, w, 14);
    ctx.fillStyle = '#2e1a00';
    ctx.fillRect(0, y + 14, w, 2);
  }
  for (let x = 0; x < w; x += 40) {
    ctx.fillStyle = x % 80 === 0 ? '#5d4037' : '#4e342e';
    ctx.fillRect(x, h * 0.7, 40, h * 0.3);
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(x + 38, h * 0.7, 2, h * 0.3);
  }
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(w * 0.05, h * 0.55, w * 0.5, h * 0.15);
  ctx.fillStyle = PALETTE.woodLight;
  ctx.fillRect(w * 0.05, h * 0.55, w * 0.5, h * 0.04);
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(w * 0.05, h * 0.3, w * 0.35, 6);
  ['#4caf50', '#f44336', '#2196f3', '#ff9800', '#9c27b0', '#4caf50'].forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(w * 0.07 + i * 28, h * 0.2, 10, h * 0.1);
    ctx.fillStyle = '#333';
    ctx.fillRect(w * 0.07 + i * 28 + 3, h * 0.19, 4, 4);
  });
  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(w * 0.45, 0, 3, h * 0.08);
  ctx.fillRect(w * 0.38, h * 0.08, 60, 4);
  [0, 20, 40, 56].forEach((dx) => {
    ctx.fillStyle = PALETTE.torch;
    ctx.fillRect(w * 0.38 + dx, h * 0.06, 6, 6);
    ctx.fillStyle = PALETTE.torchGlow;
    ctx.fillRect(w * 0.385 + dx, h * 0.055, 4, 4);
  });
  ctx.fillStyle = PALETTE.wood;
  ctx.fillRect(w * 0.6, h * 0.6, 80, 8);
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(w * 0.63, h * 0.68, 6, h * 0.12);
  ctx.fillRect(w * 0.72, h * 0.68, 6, h * 0.12);
  ctx.fillStyle = '#795548';
  ctx.fillRect(w * 0.25, h * 0.5, 12, 14);
  ctx.fillStyle = '#a1887f';
  ctx.fillRect(w * 0.237, h * 0.52, 5, 8);
  ctx.fillStyle = '#d4c89a';
  ctx.fillRect(w * 0.65, h * 0.15, 60, 45);
  ctx.strokeStyle = '#8d6e63';
  ctx.lineWidth = 2;
  ctx.strokeRect(w * 0.65, h * 0.15, 60, 45);
  ctx.fillStyle = '#5d4037';
  ctx.font = '8px monospace';
  ctx.fillText('TREASURE', w * 0.66, h * 0.2);
  ctx.fillStyle = '#c62828';
  ctx.fillText('X', w * 0.7, h * 0.32);
  ctx.fillStyle = '#d4c89a';
  ctx.fillRect(w * 0.5, h * 0.2, 40, 50);
  ctx.fillStyle = '#5d4037';
  ctx.font = '6px monospace';
  ctx.fillText('WANTED', w * 0.505, h * 0.24);
  ctx.fillStyle = '#333';
  ctx.fillRect(w * 0.51, h * 0.26, 28, 28);
  // Right door → village road
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(w * 0.85, h * 0.35, 40, h * 0.35);
  ctx.fillStyle = PALETTE.wood;
  ctx.fillRect(w * 0.86, h * 0.36, 38, h * 0.33);
  ctx.fillStyle = PALETTE.torchGlow;
  ctx.fillRect(w * 0.9, h * 0.52, 6, 6);
  // Village road sign above door
  ctx.fillStyle = PALETTE.sign;
  ctx.fillRect(w * 0.84, h * 0.3, 50, 14);
  ctx.fillStyle = PALETTE.black;
  ctx.font = 'bold 7px monospace';
  ctx.fillText('TOWN >', w * 0.845, h * 0.31 + 9);
}

function renderForest(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const skyH = h * 0.3;
  for (let y = 0; y < skyH; y++) {
    const t = y / skyH;
    ctx.fillStyle = `rgb(${Math.floor(10 + t * 15)},${Math.floor(15 + t * 20)},${Math.floor(30 + t * 20)})`;
    ctx.fillRect(0, y, w, 1);
  }
  ctx.fillStyle = PALETTE.leafDark;
  ctx.fillRect(0, skyH, w, h - skyH);
  ctx.fillStyle = '#2e1a00';
  ctx.fillRect(0, h * 0.7, w, h * 0.3);
  ctx.fillStyle = '#3e2200';
  ctx.fillRect(0, h * 0.72, w, h * 0.28);
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(w * 0.3, h * 0.75, w * 0.4, h * 0.2);
  ctx.fillStyle = '#4e342e';
  ctx.fillRect(w * 0.32, h * 0.76, w * 0.36, h * 0.18);
  const treePositions = [0.05, 0.15, 0.35, 0.55, 0.75, 0.88];
  treePositions.forEach((tx) => {
    ctx.fillStyle = PALETTE.woodDark;
    ctx.fillRect(w * tx, h * 0.3, 16, h * 0.42);
    ctx.fillStyle = PALETTE.leafDark;
    ctx.beginPath();
    ctx.arc(w * tx + 8, h * 0.28, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.leaf;
    ctx.beginPath();
    ctx.arc(w * tx + 8, h * 0.24, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.leafLight;
    ctx.beginPath();
    ctx.arc(w * tx + 8, h * 0.21, 20, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = '#7c4dff';
  ctx.beginPath();
  ctx.arc(w * 0.25, h * 0.78, 6, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#b388ff';
  ctx.fillRect(w * 0.248, h * 0.78, 4, 8);
  ctx.fillStyle = '#7c4dff';
  ctx.beginPath();
  ctx.arc(w * 0.65, h * 0.82, 5, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#b388ff';
  ctx.fillRect(w * 0.648, h * 0.82, 3, 6);
  ctx.fillStyle = PALETTE.stone;
  ctx.fillRect(w * 0.45, h * 0.58, 30, 40);
  ctx.fillStyle = PALETTE.stoneDark;
  ctx.fillRect(w * 0.45, h * 0.58, 30, 4);
  ctx.fillStyle = '#f44336';
  ctx.fillRect(w * 0.455, h * 0.62, 6, 6);
  ctx.fillRect(w * 0.47, h * 0.62, 6, 6);
  ctx.fillStyle = PALETTE.wood;
  ctx.fillRect(w * 0.7, h * 0.68, 80, 10);
  ctx.fillStyle = PALETTE.rope;
  ctx.fillRect(w * 0.7, h * 0.66, 80, 2);
  ctx.fillRect(w * 0.7, h * 0.78, 80, 2);
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(w * 0.7, h * 0.6, 4, 20);
  ctx.fillRect(w * 0.75, h * 0.6, 4, 20);
  // Deep forest path sign (to sword master)
  ctx.fillStyle = PALETTE.sign;
  ctx.fillRect(w * 0.85, h * 0.55, 55, 14);
  ctx.fillStyle = PALETTE.black;
  ctx.font = 'bold 7px monospace';
  ctx.fillText('DOJO >', w * 0.855, h * 0.56 + 9);
}

function renderBeach(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const skyH = h * 0.5;
  for (let y = 0; y < skyH; y++) {
    const t = y / skyH;
    const r = Math.floor(26 + t * (15 - 26));
    const g = Math.floor(26 + t * (33 - 26));
    const b = Math.floor(46 + t * (62 - 46));
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, y, w, 1);
  }
  drawStars(ctx, w, h);
  ctx.fillStyle = PALETTE.moon;
  ctx.beginPath();
  ctx.arc(w * 0.3, h * 0.1, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.sky;
  ctx.beginPath();
  ctx.arc(w * 0.3 + 7, h * 0.1 - 4, 20, 0, Math.PI * 2);
  ctx.fill();
  for (let y = Math.floor(skyH); y < h * 0.65; y++) {
    ctx.fillStyle = PALETTE.sea;
    for (let x = 0; x < w; x += 4) {
      const wave = Math.sin((x + y * 2) * 0.04) * 3;
      ctx.fillRect(x, y + wave, 4, 1);
    }
  }
  ctx.fillStyle = PALETTE.sand;
  ctx.fillRect(0, h * 0.6, w, h * 0.4);
  ctx.fillStyle = PALETTE.sandDark;
  ctx.fillRect(0, h * 0.6, w, h * 0.04);
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(w * 0.15, h * 0.2, 10, h * 0.45);
  ctx.fillStyle = '#5d4037';
  ctx.beginPath();
  ctx.arc(w * 0.155, h * 0.22, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.leaf;
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
    ctx.save();
    ctx.translate(w * 0.155, h * 0.18);
    ctx.rotate(angle);
    ctx.fillRect(-4, 0, 8, 50);
    ctx.restore();
  }
  ctx.fillStyle = PALETTE.stone;
  ctx.beginPath();
  ctx.arc(w * 0.7, h * 0.55, 35, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.black;
  ctx.beginPath();
  ctx.arc(w * 0.685, h * 0.53, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(w * 0.715, h * 0.53, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(w * 0.697, h * 0.56, 6, 4);
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(w * 0.45, h * 0.72, 20, 6);
  ctx.fillRect(w * 0.43, h * 0.73, 24, 4);
  ctx.fillStyle = PALETTE.torch;
  ctx.beginPath();
  ctx.arc(w * 0.455, h * 0.7, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.torchGlow;
  ctx.beginPath();
  ctx.arc(w * 0.455, h * 0.68, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(w * 0.82, h * 0.7, 36, 24);
  ctx.fillStyle = PALETTE.wood;
  ctx.fillRect(w * 0.82, h * 0.7, 36, 10);
  ctx.fillStyle = PALETTE.torchGlow;
  ctx.fillRect(w * 0.838, h * 0.72, 8, 6);
  ctx.fillStyle = PALETTE.stoneDark;
  ctx.fillRect(w * 0.9, h * 0.4, 60, h * 0.3);
  ctx.fillStyle = PALETTE.black;
  ctx.fillRect(w * 0.92, h * 0.45, 40, h * 0.22);
  // X marks the spot
  ctx.fillStyle = PALETTE.sandDark;
  ctx.font = 'bold 20px monospace';
  ctx.fillText('✕', w * 0.56, h * 0.82);
}

function renderCave(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = PALETTE.stoneDark;
  for (let x = 0; x < w; x += 30) {
    const stalH = 20 + Math.sin(x * 0.1) * 30;
    ctx.fillRect(x, 0, 28, stalH);
  }
  for (let x = 10; x < w; x += 40) {
    const stagH = 15 + Math.cos(x * 0.08) * 20;
    ctx.fillRect(x, h - stagH, 24, stagH);
  }
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, h * 0.72, w, h * 0.28);
  ctx.fillStyle = PALETTE.stoneDark;
  ctx.fillRect(0, h * 0.72, w, h * 0.04);
  const crystalPositions = [
    { x: 0.2, y: 0.4, color: '#2196f3', size: 12 },
    { x: 0.35, y: 0.55, color: '#00bcd4', size: 8 },
    { x: 0.6, y: 0.35, color: '#7c4dff', size: 14 },
    { x: 0.8, y: 0.5, color: '#2196f3', size: 10 },
    { x: 0.15, y: 0.6, color: '#00e5ff', size: 6 },
  ];
  crystalPositions.forEach((c) => {
    ctx.fillStyle = c.color + '33';
    ctx.beginPath();
    ctx.arc(w * c.x, h * c.y, c.size * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c.color;
    ctx.beginPath();
    ctx.moveTo(w * c.x, h * c.y - c.size);
    ctx.lineTo(w * c.x + c.size * 0.6, h * c.y + c.size * 0.5);
    ctx.lineTo(w * c.x - c.size * 0.6, h * c.y + c.size * 0.5);
    ctx.closePath();
    ctx.fill();
  });
  ctx.fillStyle = PALETTE.water + '88';
  ctx.fillRect(w * 0.4, h * 0.75, w * 0.25, h * 0.08);
  ctx.fillStyle = PALETTE.water + '44';
  ctx.fillRect(w * 0.42, h * 0.76, w * 0.21, h * 0.06);
  ctx.fillStyle = PALETTE.stoneDark;
  ctx.fillRect(0, 0, w * 0.05, h);
  ctx.fillRect(w * 0.95, 0, w * 0.05, h);
}

function renderVillageRoad(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Night sky
  const skyH = h * 0.38;
  for (let y = 0; y < skyH; y++) {
    const t = y / skyH;
    ctx.fillStyle = `rgb(${Math.floor(10 + t * 8)},${Math.floor(10 + t * 15)},${Math.floor(25 + t * 25)})`;
    ctx.fillRect(0, y, w, 1);
  }
  drawStars(ctx, w, h * 0.4);

  // Stone road
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(0, h * 0.65, w, h * 0.35);
  for (let x = 0; x < w; x += 50) {
    ctx.fillStyle = x % 100 === 0 ? '#424242' : '#383838';
    ctx.fillRect(x, h * 0.65, 48, h * 0.35);
    ctx.fillStyle = '#2e2e2e';
    ctx.fillRect(x + 47, h * 0.65, 3, h * 0.35);
  }
  // Road lines
  ctx.fillStyle = '#555';
  ctx.fillRect(0, h * 0.65, w, 3);

  // Buildings left side
  ctx.fillStyle = '#2a1800';
  ctx.fillRect(0, h * 0.1, w * 0.22, h * 0.58);
  ctx.fillStyle = '#3e2200';
  ctx.fillRect(w * 0.02, h * 0.12, w * 0.18, h * 0.53);
  // Windows left building
  [[0.04, 0.18], [0.12, 0.18], [0.04, 0.35], [0.12, 0.35]].forEach(([wx, wy]) => {
    ctx.fillStyle = PALETTE.torchGlow + '88';
    ctx.fillRect(w * wx, h * wy, 24, 20);
    ctx.fillStyle = '#ffd54f44';
    ctx.fillRect(w * wx + 2, h * wy + 2, 20, 16);
  });
  // Tavern sign (exit back)
  ctx.fillStyle = PALETTE.sign;
  ctx.fillRect(w * 0.02, h * 0.55, 80, 18);
  ctx.fillStyle = PALETTE.uiBg;
  ctx.font = 'bold 8px monospace';
  ctx.fillText('< SCUMM BAR', w * 0.024, h * 0.56 + 11);

  // Buildings right side
  ctx.fillStyle = '#1a1200';
  ctx.fillRect(w * 0.78, h * 0.08, w * 0.22, h * 0.6);
  ctx.fillStyle = '#2e1e00';
  ctx.fillRect(w * 0.8, h * 0.1, w * 0.18, h * 0.55);
  [[0.82, 0.16], [0.9, 0.16], [0.82, 0.33]].forEach(([wx, wy]) => {
    ctx.fillStyle = PALETTE.torchGlow + '88';
    ctx.fillRect(w * wx, h * wy, 24, 20);
  });
  // Stan's sign
  ctx.fillStyle = '#e53935';
  ctx.fillRect(w * 0.79, h * 0.55, 110, 20);
  ctx.fillStyle = PALETTE.white;
  ctx.font = 'bold 9px monospace';
  ctx.fillText("STAN'S SHIPS >", w * 0.795, h * 0.565 + 12);

  // Torches on poles
  [0.25, 0.5, 0.75].forEach((tx) => {
    ctx.fillStyle = PALETTE.woodDark;
    ctx.fillRect(w * tx, h * 0.45, 4, h * 0.22);
    ctx.fillStyle = PALETTE.torch;
    ctx.fillRect(w * tx - 4, h * 0.42, 12, 8);
    ctx.fillStyle = PALETTE.torchGlow;
    ctx.beginPath();
    ctx.arc(w * tx + 2, h * 0.4, 8, 0, Math.PI * 2);
    ctx.fill();
  });

  // Notice board center
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(w * 0.46, h * 0.38, 6, h * 0.28);
  ctx.fillStyle = PALETTE.sign;
  ctx.fillRect(w * 0.4, h * 0.35, 80, 55);
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = 2;
  ctx.strokeRect(w * 0.4, h * 0.35, 80, 55);
  ctx.fillStyle = '#5d4037';
  ctx.font = 'bold 8px monospace';
  ctx.fillText('NOTICE', w * 0.41, h * 0.38 + 10);
  ctx.fillStyle = '#3e2723';
  ctx.font = '6px monospace';
  ctx.fillText('3 TRIALS', w * 0.41, h * 0.38 + 22);
  ctx.fillText('REQUIRED', w * 0.41, h * 0.38 + 32);
  ctx.fillText('TO JOIN', w * 0.41, h * 0.38 + 42);

  // Governor's mansion visible at end of road
  ctx.fillStyle = '#e8e0d0';
  ctx.fillRect(w * 0.35, h * 0.04, w * 0.3, h * 0.34);
  ctx.fillStyle = '#d4c8a8';
  ctx.fillRect(w * 0.38, h * 0.08, w * 0.24, h * 0.28);
  // Mansion windows
  [[0.4, 0.1], [0.55, 0.1], [0.4, 0.24], [0.55, 0.24]].forEach(([mx, my]) => {
    ctx.fillStyle = '#fffde7';
    ctx.fillRect(w * mx, h * my, 22, 18);
  });
  // Mansion sign
  ctx.fillStyle = '#5d4037';
  ctx.font = 'bold 9px monospace';
  ctx.fillText("GOVERNOR'S", w * 0.38, h * 0.07);
  ctx.fillText('MANSION >', w * 0.39, h * 0.085);

  // Prison door (left of road center)
  ctx.fillStyle = PALETTE.stoneDark;
  ctx.fillRect(w * 0.25, h * 0.42, 50, h * 0.23);
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(w * 0.27, h * 0.44, 30, h * 0.19);
  ctx.fillStyle = '#555';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(w * 0.27 + i * 8, h * 0.44, 2, h * 0.19);
  }
  ctx.fillStyle = '#8d6e63';
  ctx.font = 'bold 7px monospace';
  ctx.fillText('JAIL', w * 0.267, h * 0.42 - 4);
}

function renderGovernorMansion(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Night sky
  const skyH = h * 0.45;
  for (let y = 0; y < skyH; y++) {
    const t = y / skyH;
    ctx.fillStyle = `rgb(${Math.floor(5 + t * 10)},${Math.floor(5 + t * 12)},${Math.floor(20 + t * 20)})`;
    ctx.fillRect(0, y, w, 1);
  }
  drawStars(ctx, w, h * 0.5);
  ctx.fillStyle = PALETTE.moon;
  ctx.beginPath();
  ctx.arc(w * 0.15, h * 0.12, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.sky;
  ctx.beginPath();
  ctx.arc(w * 0.15 + 8, h * 0.12 - 5, 22, 0, Math.PI * 2);
  ctx.fill();

  // Garden ground
  ctx.fillStyle = '#1a3a1a';
  ctx.fillRect(0, h * 0.6, w, h * 0.4);
  ctx.fillStyle = '#2e5a2e';
  ctx.fillRect(0, h * 0.62, w, h * 0.38);
  // Stone path
  ctx.fillStyle = '#5a5a5a';
  ctx.fillRect(w * 0.4, h * 0.62, w * 0.2, h * 0.38);
  for (let y = h * 0.62; y < h; y += 20) {
    ctx.fillStyle = '#484848';
    ctx.fillRect(w * 0.4, y, w * 0.2, 18);
  }

  // Mansion facade
  ctx.fillStyle = '#f0e8d0';
  ctx.fillRect(w * 0.2, h * 0.05, w * 0.6, h * 0.6);
  // Mansion columns
  [0.25, 0.35, 0.55, 0.65].forEach((cx) => {
    ctx.fillStyle = '#e0d8c0';
    ctx.fillRect(w * cx, h * 0.08, 18, h * 0.55);
    ctx.fillStyle = '#fff';
    ctx.fillRect(w * cx + 2, h * 0.08, 14, h * 0.55);
  });
  // Roof / pediment
  ctx.fillStyle = '#d4c8a0';
  ctx.beginPath();
  ctx.moveTo(w * 0.18, h * 0.08);
  ctx.lineTo(w * 0.5, h * 0.0);
  ctx.lineTo(w * 0.82, h * 0.08);
  ctx.closePath();
  ctx.fill();
  // Mansion windows
  [[0.28, 0.15], [0.44, 0.15], [0.58, 0.15], [0.74, 0.15],
   [0.28, 0.32], [0.44, 0.32], [0.58, 0.32], [0.74, 0.32]].forEach(([mx, my]) => {
    ctx.fillStyle = '#fffde7';
    ctx.fillRect(w * mx, h * my, 30, 28);
    ctx.strokeStyle = '#a89060';
    ctx.lineWidth = 2;
    ctx.strokeRect(w * mx, h * my, 30, 28);
    ctx.fillStyle = '#8899bb44';
    ctx.fillRect(w * mx, h * my, 30, 28);
  });
  // Main door
  ctx.fillStyle = '#4a2800';
  ctx.fillRect(w * 0.44, h * 0.46, 60, h * 0.18);
  ctx.fillStyle = '#6d3f00';
  ctx.fillRect(w * 0.445, h * 0.465, 55, h * 0.16);
  ctx.fillStyle = PALETTE.torchGlow;
  ctx.fillRect(w * 0.47, h * 0.55, 8, 8);

  // Garden hedges
  ctx.fillStyle = '#1b5e20';
  ctx.fillRect(w * 0.05, h * 0.62, w * 0.14, h * 0.25);
  ctx.fillRect(w * 0.81, h * 0.62, w * 0.14, h * 0.25);
  ctx.fillStyle = '#2e7d32';
  ctx.fillRect(w * 0.06, h * 0.64, w * 0.12, h * 0.21);
  ctx.fillRect(w * 0.82, h * 0.64, w * 0.12, h * 0.21);
  // Topiary shapes
  ctx.fillStyle = '#388e3c';
  ctx.beginPath();
  ctx.arc(w * 0.12, h * 0.65, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(w * 0.88, h * 0.65, 20, 0, Math.PI * 2);
  ctx.fill();

  // Guards
  [0.38, 0.62].forEach((gx) => {
    ctx.fillStyle = '#c62828';
    ctx.fillRect(w * gx - 8, h * 0.48, 16, 24);
    ctx.fillStyle = PALETTE.skin;
    ctx.fillRect(w * gx - 5, h * 0.4, 10, 10);
    ctx.fillStyle = '#1a237e';
    ctx.fillRect(w * gx - 3, h * 0.37, 6, 4);
    ctx.fillStyle = '#888';
    ctx.fillRect(w * gx - 1, h * 0.5, 2, 30);
  });

  // Window for climbing (upper left)
  ctx.fillStyle = '#ffd54f';
  ctx.fillRect(w * 0.28, h * 0.15, 30, 28);
  ctx.strokeStyle = '#ff8f00';
  ctx.lineWidth = 3;
  ctx.strokeRect(w * 0.28, h * 0.15, 30, 28);
}

function renderMansionInterior(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Fancy interior walls
  ctx.fillStyle = '#2a1a0a';
  ctx.fillRect(0, 0, w, h);
  // Wallpaper
  for (let y = 0; y < h * 0.65; y += 30) {
    ctx.fillStyle = y % 60 === 0 ? '#3e2200' : '#331c00';
    ctx.fillRect(0, y, w, 28);
    ctx.fillStyle = '#8d6e6344';
    ctx.fillRect(0, y + 28, w, 2);
  }
  // Fancy carpet floor
  ctx.fillStyle = '#b71c1c';
  ctx.fillRect(0, h * 0.72, w, h * 0.28);
  for (let x = 0; x < w; x += 60) {
    ctx.fillStyle = x % 120 === 0 ? '#c62828' : '#b71c1c';
    ctx.fillRect(x, h * 0.72, 58, h * 0.28);
    ctx.fillStyle = '#8b0000';
    ctx.fillRect(x + 57, h * 0.72, 3, h * 0.28);
  }
  // Gold carpet edge
  ctx.fillStyle = '#ffd54f';
  ctx.fillRect(0, h * 0.72, w, 4);

  // Chandelier
  ctx.fillStyle = '#ffd54f';
  ctx.fillRect(w * 0.48, 0, 4, h * 0.1);
  ctx.fillRect(w * 0.42, h * 0.1, 80, 6);
  [0, 20, 40, 60].forEach((dx) => {
    ctx.fillStyle = PALETTE.torch;
    ctx.fillRect(w * 0.42 + dx, h * 0.08, 8, 8);
    ctx.fillStyle = PALETTE.torchGlow;
    ctx.beginPath();
    ctx.arc(w * 0.424 + dx, h * 0.07, 6, 0, Math.PI * 2);
    ctx.fill();
  });

  // Trophy cases on left wall
  ctx.fillStyle = '#1a0a00';
  ctx.fillRect(w * 0.02, h * 0.1, 80, h * 0.55);
  ctx.fillStyle = '#2e1400';
  ctx.fillRect(w * 0.03, h * 0.12, 70, h * 0.51);
  ctx.strokeStyle = '#8d6e63';
  ctx.lineWidth = 2;
  ctx.strokeRect(w * 0.03, h * 0.12, 70, h * 0.51);
  // Trophy items
  ['🏆', '⚓', '🗡'].forEach((icon, i) => {
    ctx.fillStyle = PALETTE.uiText;
    ctx.font = '20px monospace';
    ctx.fillText(icon, w * 0.038, h * (0.22 + i * 0.14));
  });

  // Large portrait on right wall
  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(w * 0.78, h * 0.05, 140, 180);
  ctx.fillStyle = '#c4a35a';
  ctx.fillRect(w * 0.79, h * 0.06, 130, 170);
  ctx.fillStyle = '#ffd54f22';
  ctx.fillRect(w * 0.79, h * 0.06, 130, 170);
  ctx.fillStyle = PALETTE.skin;
  ctx.fillRect(w * 0.83, h * 0.1, 60, 70);
  ctx.fillStyle = PALETTE.hair;
  ctx.fillRect(w * 0.83, h * 0.08, 60, 20);
  ctx.fillStyle = '#555';
  ctx.font = '8px monospace';
  ctx.fillText('GOVERNOR', w * 0.791, h * 0.32);
  ctx.fillText('MARLEY', w * 0.795, h * 0.34);

  // Idol on pedestal CENTER
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(w * 0.45, h * 0.55, 60, 40);
  ctx.fillStyle = PALETTE.stone;
  ctx.fillRect(w * 0.47, h * 0.42, 40, 55);
  ctx.fillStyle = PALETTE.stoneDark;
  ctx.fillRect(w * 0.47, h * 0.42, 40, 5);
  // Idol face
  ctx.fillStyle = '#f44336';
  ctx.fillRect(w * 0.48, h * 0.47, 8, 8);
  ctx.fillRect(w * 0.52, h * 0.47, 8, 8);
  // Gold glow around idol
  ctx.fillStyle = PALETTE.torchGlow + '44';
  ctx.beginPath();
  ctx.arc(w * 0.499, h * 0.5, 40, 0, Math.PI * 2);
  ctx.fill();

  // Exit window (right side)
  ctx.fillStyle = '#0a1a2a';
  ctx.fillRect(w * 0.88, h * 0.12, 60, 80);
  ctx.fillStyle = '#1a3a5a';
  ctx.fillRect(w * 0.89, h * 0.13, 55, 75);
  ctx.strokeStyle = '#ffd54f';
  ctx.lineWidth = 3;
  ctx.strokeRect(w * 0.88, h * 0.12, 60, 80);
  ctx.fillStyle = PALETTE.uiText;
  ctx.font = 'bold 8px monospace';
  ctx.fillText('EXIT >', w * 0.885, h * 0.25);

  // Left wall door (from window climb entry)
  ctx.fillStyle = '#1a0a00';
  ctx.fillRect(w * 0.04, h * 0.4, 50, h * 0.32);
  ctx.fillStyle = '#2e1400';
  ctx.fillRect(w * 0.045, h * 0.42, 44, h * 0.28);
}

function renderStanShop(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Daytime harbor / marina
  const skyH = h * 0.5;
  for (let y = 0; y < skyH; y++) {
    const t = y / skyH;
    ctx.fillStyle = `rgb(${Math.floor(20 + t * 60)},${Math.floor(40 + t * 80)},${Math.floor(100 + t * 80)})`;
    ctx.fillRect(0, y, w, 1);
  }
  // Sea
  ctx.fillStyle = '#0d47a1';
  ctx.fillRect(0, h * 0.5, w, h * 0.18);
  ctx.fillStyle = '#1565c0';
  ctx.fillRect(0, h * 0.52, w, h * 0.14);
  // Dock ground
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(0, h * 0.65, w, h * 0.35);
  ctx.fillStyle = PALETTE.wood;
  for (let x = 0; x < w; x += 24) {
    ctx.fillRect(x, h * 0.65, 22, h * 0.35);
    ctx.fillStyle = PALETTE.woodDark;
    ctx.fillRect(x + 21, h * 0.65, 3, h * 0.35);
    ctx.fillStyle = PALETTE.wood;
  }

  // Ships for sale (3 boats)
  [0.1, 0.4, 0.68].forEach((sx, i) => {
    const sw = [80, 120, 160][i];
    ctx.fillStyle = ['#ffffff', '#ffe082', '#ffccbc'][i];
    ctx.fillRect(w * sx, h * 0.38, sw, 30);
    ctx.fillStyle = PALETTE.woodDark;
    ctx.fillRect(w * sx + sw / 2 - 2, h * 0.18, 4, h * 0.2 + 10);
    ctx.fillStyle = ['#e53935', '#1565c0', '#2e7d32'][i];
    ctx.fillRect(w * sx + sw / 2, h * 0.19, 30, 20);
    // Price tag
    ctx.fillStyle = '#fffde7';
    ctx.fillRect(w * sx, h * 0.45, 70, 16);
    ctx.fillStyle = '#5d4037';
    ctx.font = '7px monospace';
    ctx.fillText([' 5,000 POE', '10,000 POE', '15,000 POE'][i], w * sx + 2, h * 0.46 + 11);
  });

  // Big banner
  ctx.fillStyle = '#e53935';
  ctx.fillRect(w * 0.2, h * 0.03, w * 0.6, 35);
  ctx.fillStyle = '#ffeb3b';
  ctx.font = 'bold 20px monospace';
  ctx.fillText("STAN'S PREVIOUSLY-OWNED VESSELS", w * 0.215, h * 0.03 + 24);

  // Stan's desk/booth
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(w * 0.8, h * 0.54, w * 0.18, h * 0.14);
  ctx.fillStyle = PALETTE.woodLight;
  ctx.fillRect(w * 0.81, h * 0.55, w * 0.16, h * 0.04);

  // Shovel leaning against wall
  ctx.fillStyle = PALETTE.woodLight;
  ctx.fillRect(w * 0.05, h * 0.5, 5, 60);
  ctx.fillStyle = '#607d8b';
  ctx.fillRect(w * 0.04, h * 0.5, 14, 10);

  // Discount sign
  ctx.fillStyle = '#ffeb3b';
  ctx.fillRect(w * 0.6, h * 0.55, 90, 30);
  ctx.fillStyle = '#b71c1c';
  ctx.font = 'bold 8px monospace';
  ctx.fillText('PIRATE CERT.', w * 0.605, h * 0.562 + 10);
  ctx.fillText('= 50% OFF!', w * 0.612, h * 0.562 + 22);
}

function renderSwordMasterArea(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Forest clearing — open sky
  const skyH = h * 0.45;
  for (let y = 0; y < skyH; y++) {
    const t = y / skyH;
    ctx.fillStyle = `rgb(${Math.floor(15 + t * 10)},${Math.floor(20 + t * 20)},${Math.floor(40 + t * 30)})`;
    ctx.fillRect(0, y, w, 1);
  }
  drawStars(ctx, w, h * 0.5);
  ctx.fillStyle = PALETTE.moon;
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.1, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.sky;
  ctx.beginPath();
  ctx.arc(w * 0.5 + 7, h * 0.1 - 3, 18, 0, Math.PI * 2);
  ctx.fill();

  // Tree border on sides
  [0.0, 0.85].forEach((tx) => {
    ctx.fillStyle = PALETTE.woodDark;
    ctx.fillRect(w * tx, h * 0.2, 20, h * 0.5);
    ctx.fillStyle = PALETTE.leafDark;
    ctx.beginPath();
    ctx.arc(w * tx + 10, h * 0.18, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.leaf;
    ctx.beginPath();
    ctx.arc(w * tx + 10, h * 0.14, 40, 0, Math.PI * 2);
    ctx.fill();
  });

  // Clearing ground (dirt)
  ctx.fillStyle = '#3e2200';
  ctx.fillRect(0, h * 0.7, w, h * 0.3);
  ctx.fillStyle = '#5d3100';
  ctx.fillRect(0, h * 0.72, w, h * 0.28);
  // Circular training area
  ctx.fillStyle = '#4e2800';
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.82, w * 0.35, h * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Carla's training hut (background)
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(w * 0.7, h * 0.25, 120, h * 0.45);
  ctx.fillStyle = PALETTE.wood;
  ctx.fillRect(w * 0.72, h * 0.27, 110, h * 0.4);
  // Hut roof
  ctx.fillStyle = '#1b5e20';
  ctx.beginPath();
  ctx.moveTo(w * 0.68, h * 0.25);
  ctx.lineTo(w * 0.76, h * 0.1);
  ctx.lineTo(w * 0.86, h * 0.25);
  ctx.closePath();
  ctx.fill();
  // Hut window
  ctx.fillStyle = PALETTE.torchGlow + '88';
  ctx.fillRect(w * 0.74, h * 0.3, 30, 25);

  // Crossed swords emblem
  ctx.strokeStyle = '#9e9e9e';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(w * 0.4, h * 0.55);
  ctx.lineTo(w * 0.55, h * 0.42);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w * 0.55, h * 0.55);
  ctx.lineTo(w * 0.4, h * 0.42);
  ctx.stroke();
  ctx.lineWidth = 1;

  // Training dummy
  ctx.fillStyle = PALETTE.rope;
  ctx.fillRect(w * 0.18, h * 0.45, 8, h * 0.28);
  ctx.fillStyle = PALETTE.sandDark;
  ctx.beginPath();
  ctx.arc(w * 0.184, h * 0.42, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.rope;
  ctx.fillRect(w * 0.16, h * 0.48, 50, 6);

  // Sword rack
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(w * 0.3, h * 0.38, 4, h * 0.35);
  ctx.fillRect(w * 0.28, h * 0.42, 50, 4);
  // Swords on rack
  ctx.strokeStyle = '#9e9e9e';
  ctx.lineWidth = 3;
  [0.29, 0.32, 0.35].forEach((sx) => {
    ctx.beginPath();
    ctx.moveTo(w * sx, h * 0.38);
    ctx.lineTo(w * sx, h * 0.62);
    ctx.stroke();
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(w * sx - 6, h * 0.43, 16, 4);
  });
  ctx.lineWidth = 1;
}

function renderPrison(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Dark dungeon interior
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, w, h);
  // Stone walls
  for (let y = 0; y < h * 0.7; y += 25) {
    for (let x = 0; x < w; x += 60) {
      const ox = y % 50 === 0 ? 0 : 30;
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(x + ox, y, 55, 23);
      ctx.fillStyle = '#111';
      ctx.fillRect(x + ox + 54, y, 6, 23);
      ctx.fillRect(x + ox, y + 22, 55, 3);
    }
  }
  // Floor
  ctx.fillStyle = '#1c1c1c';
  ctx.fillRect(0, h * 0.72, w, h * 0.28);
  ctx.fillStyle = '#222';
  for (let x = 0; x < w; x += 50) {
    ctx.fillRect(x, h * 0.72, 48, h * 0.28);
    ctx.fillStyle = '#141414';
    ctx.fillRect(x + 47, h * 0.72, 3, h * 0.28);
    ctx.fillStyle = '#222';
  }

  // Sheriff's desk (right side)
  ctx.fillStyle = '#2e1a00';
  ctx.fillRect(w * 0.7, h * 0.5, w * 0.25, h * 0.22);
  ctx.fillStyle = '#3e2200';
  ctx.fillRect(w * 0.71, h * 0.51, w * 0.23, h * 0.06);
  // Keys hanging on wall
  ctx.fillStyle = '#ffd54f';
  ctx.fillRect(w * 0.85, h * 0.35, 4, 25);
  ctx.beginPath();
  ctx.arc(w * 0.852, h * 0.34, 6, 0, Math.PI * 2);
  ctx.stroke();

  // Torch on wall
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(w * 0.6, h * 0.28, 4, 25);
  ctx.fillStyle = PALETTE.torch;
  ctx.fillRect(w * 0.596, h * 0.25, 12, 8);
  ctx.fillStyle = PALETTE.torchGlow;
  ctx.beginPath();
  ctx.arc(w * 0.602, h * 0.22, 10, 0, Math.PI * 2);
  ctx.fill();
  // Glow effect
  ctx.fillStyle = '#ff980022';
  ctx.beginPath();
  ctx.arc(w * 0.602, h * 0.25, 40, 0, Math.PI * 2);
  ctx.fill();

  // Cell bars (left side) — Otis's cell
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, w * 0.45, h * 0.72);
  // Bars
  ctx.fillStyle = '#333';
  ctx.fillRect(w * 0.42, 0, 8, h * 0.72);
  ctx.fillStyle = '#444';
  for (let i = 0; i < 8; i++) {
    ctx.fillRect(w * 0.05 + i * (w * 0.37 / 8), 0, 5, h * 0.72);
  }
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(0, h * 0.35, w * 0.43, 6);

  // Otis visible through bars
  ctx.fillStyle = '#444';
  ctx.fillRect(w * 0.08, h * 0.45, 16, 28);
  ctx.fillStyle = PALETTE.skin;
  ctx.fillRect(w * 0.085, h * 0.38, 12, 12);
  // Otis sad face
  ctx.fillStyle = PALETTE.black;
  ctx.fillRect(w * 0.089, h * 0.41, 3, 3);
  ctx.fillRect(w * 0.096, h * 0.41, 3, 3);
  ctx.fillStyle = '#666';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('OTIS', w * 0.06, h * 0.37);

  // "Straw on floor" in cell
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(w * 0.06, h * 0.68, w * 0.34, 6);

  // Sheriff's sign
  ctx.fillStyle = PALETTE.sign;
  ctx.fillRect(w * 0.52, h * 0.1, 100, 22);
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = 2;
  ctx.strokeRect(w * 0.52, h * 0.1, 100, 22);
  ctx.fillStyle = PALETTE.uiBg;
  ctx.font = 'bold 9px monospace';
  ctx.fillText("SHERIFF'S OFFICE", w * 0.524, h * 0.115 + 13);
}

// ── Room Data ──────────────────────────────────────────────

export const ROOMS: Record<string, Room> = {
  harbor: {
    id: 'harbor',
    name: '항구',
    render: renderHarbor,
    walkArea: { x1: 0.03, y1: 0.58, x2: 0.78, y2: 0.82 },
    objects: [
      {
        id: 'sign',
        name: '낡은 간판',
        x: 0.28, y: 0.52, w: 50, h: 20,
        actions: {
          look: "바래진 글씨가 적힌 항구 간판이다. '멜레 항구에 오신 것을 환영합니다'",
          read: "'멜레 항구 - 해적 지망생 환영!' 이라고 쓰여있다.",
          pick_up: '간판이 땅에 단단히 박혀있다. 뽑을 수 없다.',
        },
      },
      {
        id: 'barrel',
        name: '나무 통',
        x: 0.42, y: 0.6, w: 24, h: 28,
        actions: {
          look: '오래된 럼주 통이다. 아직 냄새가 진하게 난다.',
          open: '뚜껑을 열어보니... 거미 한 마리가 튀어나왔다!',
          pick_up: '너무 무거워서 들 수 없다.',
        },
        item: { id: 'grog', name: '그로그 맥주', icon: '🍺' },
      },
      {
        id: 'ship',
        name: '해적선',
        x: 0.68, y: 0.18, w: 80, h: 50,
        actions: {
          look: '멀리서 해적선이 정박해 있다. 돛에 해골 마크가 보인다.',
          use: '배까지 갈 수 없다. 보트가 필요하다.',
        },
      },
      {
        id: 'anchor',
        name: '닻',
        x: 0.55, y: 0.62, w: 12, h: 24,
        actions: {
          look: '무거운 철제 닻이다. 녹이 잔뜩 슬어있다. 밧줄을 묶으면 뭔가 할 수 있을 것 같다.',
          pick_up: '너무 무겁다! 들 수 없다.',
          use: '밧줄을 이용해 뭔가 할 수 있을 것 같은데...',
        },
        useWith: {
          rope: [
            { cmd: 'say', text: '밧줄을 닻에 단단히 묶었다. 이제 배에 오를 수 있을 것 같다!' },
            { cmd: 'set_flag', flag: 'anchor_tied', value: true },
          ],
        },
      },
      {
        id: 'rope_coil',
        name: '밧줄 뭉치',
        x: 0.5, y: 0.63, w: 16, h: 16,
        actions: {
          look: '튼튼해 보이는 밧줄 뭉치다. 여러 용도로 쓸 수 있을 것 같다.',
          pick_up: '밧줄을 집어들었다!',
          use: '뭔가에 묶어야 할 것 같다.',
        },
        item: { id: 'rope', name: '밧줄', icon: '🪢' },
      },
    ],
    exits: [
      {
        id: 'tavern_door',
        name: '선술집',
        to: 'tavern',
        x: 0.0, y: 0.45, w: 30, h: 140,
        walkTo: { x: 0.05, y: 0.65 },
      },
      {
        id: 'forest_path',
        name: '숲으로 가는 길',
        to: 'forest',
        x: 0.75, y: 0.58, w: 40, h: 100,
        walkTo: { x: 0.73, y: 0.68 },
      },
    ],
    npcs: [
      {
        id: 'three_pirates',
        name: '세 해적',
        x: 0.35, y: 0.65,
        sprite: 'lechuck',
        dialogue: 'three_pirates',
        actions: {
          look: '부두에 앉아 술을 마시고 있는 세 명의 해적이다.',
          talk: '',
        },
      },
    ],
  },

  tavern: {
    id: 'tavern',
    name: '선술집 (스컵 바)',
    render: renderTavern,
    walkArea: { x1: 0.03, y1: 0.68, x2: 0.82, y2: 0.95 },
    objects: [
      {
        id: 'mug',
        name: '맥주잔',
        x: 0.7, y: 0.52, w: 14, h: 16,
        actions: {
          look: '거품이 넘치는 그로그 맥주잔이다.',
          pick_up: '맥주잔을 집어들었다!',
          use: '벌컥벌컥... 독한 맛이다! 하지만 기분이 좋아졌다.',
        },
        item: { id: 'mug', name: '맥주잔', icon: '🍺' },
      },
      {
        id: 'map',
        name: '보물 지도',
        x: 0.42, y: 0.18, w: 50, h: 40,
        actions: {
          look: "벽에 걸린 보물 지도다. 'X' 표시가 선명하다.",
          read: "'원숭이 섬'이라고 적혀 있다. 보물이 묻힌 곳인가...",
          pick_up: '벽에 못으로 고정되어 있다. 떼어낼 수 없다.',
        },
      },
      {
        id: 'bottles',
        name: '술병들',
        x: 0.78, y: 0.2, w: 120, h: 50,
        actions: {
          look: '온갖 종류의 럼주와 그로그가 진열되어 있다.',
          pick_up: '바텐더가 노려본다. 함부로 가져갈 수 없다.',
          use: '손님한테 직접 따라드리진 않습니다, 해적 양반.',
        },
      },
      {
        id: 'wanted_poster',
        name: '수배 전단',
        x: 0.15, y: 0.22, w: 40, h: 50,
        actions: {
          look: '르척의 수배 전단이다. "유령 해적 르척 - 현상금: 측정 불가"라고 적혀있다.',
          read: '"경고: 이 유령 해적은 극도로 위험합니다. 발견 즉시 도망치십시오."',
          pick_up: '벽에 단단히 붙어있다.',
        },
      },
    ],
    exits: [
      {
        id: 'harbor_door',
        name: '항구',
        to: 'harbor',
        x: 0.0, y: 0.4, w: 30, h: 130,
        walkTo: { x: 0.05, y: 0.8 },
      },
      {
        id: 'village_road_door',
        name: '마을 거리',
        to: 'village_road',
        x: 0.83, y: 0.35, w: 45, h: 130,
        walkTo: { x: 0.78, y: 0.8 },
      },
    ],
    npcs: [
      {
        id: 'bartender',
        name: '바텐더',
        x: 0.72, y: 0.58,
        sprite: 'elaine',
        dialogue: 'bartender',
        actions: {
          look: '강인해 보이는 바텐더가 잔을 닦고 있다.',
          talk: '',
        },
      },
    ],
  },

  forest: {
    id: 'forest',
    name: '깊은 숲',
    render: renderForest,
    walkArea: { x1: 0.1, y1: 0.73, x2: 0.9, y2: 0.95 },
    objects: [
      {
        id: 'mushroom_glow',
        name: '빛나는 버섯',
        x: 0.18, y: 0.76, w: 14, h: 16,
        actions: {
          look: '보라색으로 빛나는 신비한 버섯이다. 만지면 위험할 것 같다.',
          pick_up: '조심스럽게 버섯을 뽑았다. 이상한 가루가 손에 묻었다.',
          use: '이걸 어디에 쓸 수 있을까...',
        },
        item: { id: 'glowing_mushroom', name: '빛나는 버섯', icon: '🍄' },
      },
      {
        id: 'stone_idol',
        name: '돌 우상',
        x: 0.5, y: 0.62, w: 30, h: 40,
        actions: {
          look: '고대 원주민이 만든 것 같은 돌 우상이다. 빨간 눈이 번뜩인다. 받침대 밑에 뭔가 새겨져 있다...',
          read: '"동굴의 물 아래 열쇠가 잠든다" 라고 쓰여있다.',
          push: '우상이 조금 움직였다! 뒤에서 먼지가 일어났다.',
          pull: '너무 무겁다. 꿈쩍도 안 한다.',
        },
      },
      {
        id: 'wooden_bridge',
        name: '나무 다리',
        x: 0.65, y: 0.7, w: 80, h: 14,
        actions: {
          look: '낡은 나무 다리다. 밧줄로 겨우 지탱하고 있다.',
          use: '조심스럽게 건넌다... 삐걱삐걱!',
          push: '다리가 흔들린다! 위험해!',
        },
      },
    ],
    exits: [
      {
        id: 'harbor_back',
        name: '항구로 돌아가기',
        to: 'harbor',
        x: 0.0, y: 0.6, w: 30, h: 130,
        walkTo: { x: 0.12, y: 0.8 },
      },
      {
        id: 'beach_path',
        name: '해변으로 가는 길',
        to: 'beach',
        x: 0.92, y: 0.6, w: 40, h: 130,
        walkTo: { x: 0.88, y: 0.8 },
      },
      {
        id: 'sword_master_path',
        name: '검술 훈련장',
        to: 'sword_master_area',
        x: 0.82, y: 0.58, w: 40, h: 100,
        walkTo: { x: 0.85, y: 0.78 },
      },
    ],
    npcs: [
      {
        id: 'voodoo_lady',
        name: '부두교 여사제',
        x: 0.45, y: 0.78,
        sprite: 'elaine',
        dialogue: 'voodoo_lady',
        actions: {
          look: '신비로운 분위기를 풍기는 부두교 여사제가 서 있다.',
          talk: '',
        },
      },
    ],
  },

  beach: {
    id: 'beach',
    name: '달빛 해변',
    render: renderBeach,
    walkArea: { x1: 0.1, y1: 0.65, x2: 0.82, y2: 0.95 },
    objects: [
      {
        id: 'palm_tree',
        name: '야자나무',
        x: 0.32, y: 0.1, w: 20, h: 220,
        actions: {
          look: '높은 야자나무다. 위에 코코넛이 매달려 있다.',
          push: '나무를 흔들었더니... 코코넛이 떨어졌다!',
          pick_up: '나무는 집을 수 없다.',
        },
      },
      {
        id: 'skull_rock',
        name: '해골 바위',
        x: 0.7, y: 0.4, w: 70, h: 60,
        actions: {
          look: '해골 모양의 거대한 바위다. 눈구멍이 으스스하다.',
          use: '바위에 손을 대자 차가운 기운이 느껴진다...',
          push: '꿈쩍도 안 한다.',
        },
      },
      {
        id: 'campfire',
        name: '모닥불',
        x: 0.48, y: 0.75, w: 26, h: 16,
        actions: {
          look: '최근에 누군가 피운 것 같은 모닥불이다. 아직 따뜻하다.',
          use: '불에 손을 대면 안 된다!',
          open: '재를 뒤적여보니... 탄 쪽지 조각이 나왔다.',
        },
      },
      {
        id: 'old_chest',
        name: '오래된 상자',
        x: 0.22, y: 0.7, w: 36, h: 24,
        actions: {
          look: '자물쇠가 채워진 오래된 보물 상자다. 열쇠가 필요하다.',
          open: '자물쇠가 잠겨있다. 열쇠가 필요해!',
          use: '열쇠가 없으면 열 수 없다.',
          pick_up: '상자가 땅에 반쯤 묻혀있다.',
        },
        useWith: {
          cave_key: [
            { cmd: 'say', text: '녹슨 열쇠가 딱 맞았다! 삐걱... 상자가 열렸다!' },
            { cmd: 'give_item', id: 'treasure_map', name: '보물 지도', icon: '🗺' },
            { cmd: 'set_flag', flag: 'has_treasure_map', value: true },
            { cmd: 'remove_item', id: 'cave_key' },
            { cmd: 'hide_object', id: 'old_chest' },
          ],
        },
      },
      {
        id: 'x_marks_spot',
        name: 'X 표시가 된 모래',
        x: 0.54, y: 0.79, w: 30, h: 20,
        actions: {
          look: [
            { cmd: 'if', flag: 'has_treasure_map',
              then: [{ cmd: 'say', text: '지도에 표시된 위치다! 여기를 파야 한다. 삽이 필요해.' }],
              else: [{ cmd: 'say', text: '모래사장의 한 부분처럼 보인다.' }],
            },
          ],
          use: '삽이 있다면 파볼 수 있을 것 같다.',
        },
        useWith: {
          shovel: [
            { cmd: 'if', flag: 'has_treasure_map',
              then: [
                { cmd: 'say', text: '열심히 파자... 쿵! 무언가에 삽이 닿았다! 보물이다!' },
                { cmd: 'give_item', id: 'buried_treasure', name: '매장된 보물', icon: '💰' },
                { cmd: 'set_flag', flag: 'trial3_complete', value: true },
                { cmd: 'hide_object', id: 'x_marks_spot' },
              ],
              else: [
                { cmd: 'say', text: '지도 없이는 어디를 파야 할지 모르겠다.' },
              ],
            },
          ],
        },
      },
    ],
    exits: [
      {
        id: 'forest_back',
        name: '숲으로 돌아가기',
        to: 'forest',
        x: 0.92, y: 0.6, w: 40, h: 130,
        walkTo: { x: 0.8, y: 0.78 },
      },
      {
        id: 'cave_entrance',
        name: '동굴 입구',
        to: 'cave',
        x: 0.05, y: 0.35, w: 60, h: 100,
        walkTo: { x: 0.15, y: 0.68 },
      },
    ],
  },

  cave: {
    id: 'cave',
    name: '수정 동굴',
    render: renderCave,
    walkArea: { x1: 0.08, y1: 0.68, x2: 0.92, y2: 0.95 },
    objects: [
      {
        id: 'crystal_shard',
        name: '수정 파편',
        x: 0.72, y: 0.4, w: 20, h: 24,
        actions: {
          look: '아름답게 빛나는 수정이다. 보라색 빛이 맥동한다.',
          pick_up: '조심스럽게 수정 파편을 꺼냈다!',
          use: '수정에서 이상한 에너지가 느껴진다...',
        },
        item: { id: 'crystal_shard', name: '수정 파편', icon: '💎' },
      },
      {
        id: 'cave_key',
        name: '녹슨 열쇠',
        x: 0.48, y: 0.76, w: 12, h: 10,
        actions: {
          look: '물 아래 뭔가 반짝이는 것이 보인다... 열쇠다!',
          pick_up: '물에 손을 넣어 녹슨 열쇠를 건졌다!',
          use: '이 열쇠로 뭘 열 수 있을까... 자물쇠가 채워진 상자?',
        },
        item: { id: 'cave_key', name: '녹슨 열쇠', icon: '🗝' },
      },
      {
        id: 'underground_pool',
        name: '지하 웅덩이',
        x: 0.35, y: 0.72, w: 180, h: 50,
        actions: {
          look: '맑고 차가운 지하수가 고여 있다. 바닥에 뭔가 반짝이는 게 보인다.',
          use: '물이 너무 차갑다! 손이 얼 것 같다.',
        },
      },
    ],
    exits: [
      {
        id: 'beach_back',
        name: '해변으로 돌아가기',
        to: 'beach',
        x: 0.3, y: 0.15, w: 260, h: 120,
        walkTo: { x: 0.5, y: 0.72 },
      },
    ],
  },

  // ── Phase 2 Rooms ──────────────────────────────────────────

  village_road: {
    id: 'village_road',
    name: '마을 거리',
    render: renderVillageRoad,
    walkArea: { x1: 0.03, y1: 0.7, x2: 0.95, y2: 0.92 },
    objects: [
      {
        id: 'notice_board',
        name: '공고판',
        x: 0.4, y: 0.35, w: 80, h: 55,
        actions: {
          look: '마을 공고판이다. 해적 시련에 관한 공지가 붙어있다.',
          read: '"멜레 섬 해적단 가입 조건: 1) 검술 마스터와 결투 승리, 2) 총독 관저의 우상 반환, 3) 고대 보물 발굴. 세 가지 시련을 모두 완수한 자만 진정한 해적으로 인정받는다."',
        },
      },
    ],
    exits: [
      {
        id: 'to_tavern',
        name: '선술집으로',
        to: 'tavern',
        x: 0.0, y: 0.5, w: 30, h: 150,
        walkTo: { x: 0.05, y: 0.8 },
      },
      {
        id: 'to_mansion',
        name: '총독 관저',
        to: 'governor_mansion',
        x: 0.35, y: 0.0, w: 480, h: 110,
        walkTo: { x: 0.5, y: 0.75 },
      },
      {
        id: 'to_stan',
        name: "스탠의 배 가게",
        to: 'stan_shop',
        x: 0.88, y: 0.5, w: 50, h: 150,
        walkTo: { x: 0.85, y: 0.8 },
      },
      {
        id: 'to_prison',
        name: '감옥',
        to: 'prison',
        x: 0.25, y: 0.42, w: 50, h: 90,
        walkTo: { x: 0.35, y: 0.8 },
      },
    ],
    npcs: [
      {
        id: 'sheriff',
        name: '보안관',
        x: 0.6, y: 0.72,
        sprite: 'elaine',
        dialogue: 'sheriff',
        actions: {
          look: '팔짱을 끼고 거리를 순찰하는 보안관이다.',
          talk: '',
        },
      },
    ],
  },

  governor_mansion: {
    id: 'governor_mansion',
    name: '총독 관저',
    render: renderGovernorMansion,
    walkArea: { x1: 0.05, y1: 0.62, x2: 0.92, y2: 0.92 },
    objects: [
      {
        id: 'mansion_door',
        name: '관저 정문',
        x: 0.44, y: 0.44, w: 60, h: 120,
        actions: {
          look: '화려하게 장식된 관저의 정문이다. 경비가 지키고 있다.',
          open: '경비가 막아선다. "총독님은 방문객을 받지 않습니다!"',
          use: '경비가 막아선다. "비켜라!"',
          knock: '경비가 문을 두드리지 말라고 경고한다.',
        },
      },
      {
        id: 'mansion_window',
        name: '2층 창문',
        x: 0.28, y: 0.15, w: 30, h: 28,
        actions: {
          look: '2층 창문이 살짝 열려 있는 것 같다. 밧줄이 있으면 올라갈 수 있을 것 같다.',
          use: '밧줄 없이는 올라갈 수 없다.',
        },
        useWith: {
          rope: [
            { cmd: 'say', text: '밧줄을 창문에 걸었다! 조심스럽게 기어 올라간다...' },
            { cmd: 'change_room', room: 'mansion_interior', entryX: 0.1 },
          ],
        },
      },
      {
        id: 'garden_hedge',
        name: '정원 울타리',
        x: 0.05, y: 0.62, w: 110, h: 100,
        actions: {
          look: '잘 다듬어진 정원 울타리다. 총독이 꽤 부유한 것 같다.',
          push: '빽빽해서 통과할 수 없다.',
          use: '울타리를 뛰어넘는 건 힘들 것 같다.',
        },
      },
      {
        id: 'fountain',
        name: '분수대',
        x: 0.42, y: 0.62, w: 70, h: 60,
        actions: {
          look: '아름다운 분수대다. 물소리가 잔잔하게 들린다.',
          use: '시원한 물에 얼굴을 씻었다.',
          pick_up: '분수대를 가져갈 수 없다.',
        },
      },
    ],
    exits: [
      {
        id: 'back_to_village',
        name: '마을로 돌아가기',
        to: 'village_road',
        x: 0.0, y: 0.55, w: 30, h: 150,
        walkTo: { x: 0.05, y: 0.75 },
      },
    ],
    npcs: [
      {
        id: 'mansion_guard',
        name: '관저 경비',
        x: 0.38, y: 0.65,
        sprite: 'elaine',
        dialogue: 'mansion_guard',
        actions: {
          look: '창을 들고 관저 앞을 지키는 경비다. 표정이 엄격하다.',
          talk: '',
        },
      },
    ],
  },

  mansion_interior: {
    id: 'mansion_interior',
    name: '총독 관저 내부',
    render: renderMansionInterior,
    walkArea: { x1: 0.05, y1: 0.7, x2: 0.92, y2: 0.95 },
    objects: [
      {
        id: 'governors_idol',
        name: '총독의 우상',
        x: 0.46, y: 0.42, w: 50, h: 70,
        actions: {
          look: '황금빛으로 빛나는 귀중한 우상이다! 해적 시련의 목표물이다.',
          pick_up: [
            { cmd: 'give_item', id: 'idol', name: '총독의 우상', icon: '🗿' },
            { cmd: 'set_flag', flag: 'has_idol', value: true },
            { cmd: 'set_flag', flag: 'trial2_complete', value: true },
            { cmd: 'hide_object', id: 'governors_idol' },
            { cmd: 'say', text: '우상을 손에 넣었다! 경보가 울린다! 빨리 도망쳐야 한다!' },
          ],
          use: '이걸 가져가야 한다!',
        },
      },
      {
        id: 'trophy_case',
        name: '트로피 케이스',
        x: 0.02, y: 0.1, w: 80, h: 200,
        actions: {
          look: '여러 가지 트로피와 항해 기념품이 가득하다.',
          open: '잠겨있다.',
          use: '잠겨있어서 열 수 없다.',
        },
      },
      {
        id: 'governor_portrait',
        name: '총독의 초상화',
        x: 0.78, y: 0.05, w: 140, h: 180,
        actions: {
          look: '총독 마리 초상화다. 영리하고 강인한 눈빛이다.',
          use: '그림을 건드리면 안 된다.',
        },
      },
      {
        id: 'exit_window',
        name: '탈출 창문',
        x: 0.88, y: 0.12, w: 60, h: 80,
        actions: {
          look: '탈출할 수 있는 창문이다.',
          use: '창문을 통해 밖으로 나간다!',
          open: [
            { cmd: 'say', text: '창문으로 탈출한다!' },
            { cmd: 'change_room', room: 'governor_mansion', entryX: 0.35 },
          ],
        },
      },
    ],
    exits: [
      {
        id: 'window_escape',
        name: '창문으로 탈출',
        to: 'governor_mansion',
        x: 0.88, y: 0.1, w: 60, h: 90,
        walkTo: { x: 0.88, y: 0.75 },
      },
    ],
  },

  stan_shop: {
    id: 'stan_shop',
    name: "스탠의 배 가게",
    render: renderStanShop,
    walkArea: { x1: 0.03, y1: 0.65, x2: 0.95, y2: 0.92 },
    objects: [
      {
        id: 'small_ship',
        name: '소형 범선',
        x: 0.08, y: 0.3, w: 90, h: 60,
        actions: {
          look: '작은 범선이다. 5,000 피스 오브 에이트 가격표가 붙어있다.',
          use: '이 배를 사려면 스탠과 이야기해야 한다.',
        },
      },
      {
        id: 'medium_ship',
        name: '중형 갈레온',
        x: 0.38, y: 0.25, w: 130, h: 70,
        actions: {
          look: '중형 갈레온 전함이다. 10,000 피스 오브 에이트. 원숭이 섬까지 충분히 갈 수 있을 것 같다.',
          use: '이 배를 사려면 스탠과 이야기해야 한다.',
        },
      },
      {
        id: 'large_ship',
        name: '대형 범선',
        x: 0.65, y: 0.2, w: 160, h: 80,
        actions: {
          look: '거대한 대형 범선이다. 15,000 피스 오브 에이트. 해적선이라 해도 믿을 것 같다.',
          use: '이 배를 사려면 스탠과 이야기해야 한다.',
        },
      },
      {
        id: 'shovel',
        name: '삽',
        x: 0.04, y: 0.5, w: 18, h: 60,
        actions: {
          look: '오래된 삽이다. 뭔가를 파는 데 쓸 수 있을 것 같다.',
          pick_up: [
            { cmd: 'give_item', id: 'shovel', name: '삽', icon: '⛏' },
            { cmd: 'hide_object', id: 'shovel' },
            { cmd: 'say', text: '⛏ 삽을 가져왔다. 스탠이 신경 쓰지 않는 것 같다.' },
          ],
        },
      },
      {
        id: 'discount_sign',
        name: '할인 간판',
        x: 0.6, y: 0.55, w: 90, h: 30,
        actions: {
          look: '"해적 수료증 소지자 50% 할인!" 세 가지 시련을 완수하면 배를 싸게 살 수 있다.',
          read: '"세 가지 시련을 완수한 자에게 특별 혜택을 드립니다!" 라고 적혀있다.',
        },
      },
    ],
    exits: [
      {
        id: 'back_to_village_from_stan',
        name: '마을로 돌아가기',
        to: 'village_road',
        x: 0.0, y: 0.5, w: 30, h: 150,
        walkTo: { x: 0.05, y: 0.8 },
      },
    ],
    npcs: [
      {
        id: 'stan',
        name: '스탠',
        x: 0.85, y: 0.6,
        sprite: 'elaine',
        dialogue: 'stan',
        actions: {
          look: '줄무늬 재킷을 입고 활짝 웃고 있는 스탠이다. 어딘가 믿기 힘든 느낌이다.',
          talk: '',
        },
      },
    ],
  },

  sword_master_area: {
    id: 'sword_master_area',
    name: '검술 훈련장',
    render: renderSwordMasterArea,
    walkArea: { x1: 0.08, y1: 0.72, x2: 0.88, y2: 0.94 },
    objects: [
      {
        id: 'training_dummy',
        name: '훈련용 허수아비',
        x: 0.14, y: 0.42, w: 60, h: 80,
        actions: {
          look: '볏짚으로 만든 훈련용 허수아비다. 검술 연습용이다.',
          use: '허수아비를 향해 찌르고 베는 동작을 연습했다!',
          push: '허수아비가 흔들렸다!',
          pick_up: '이건 가져갈 수 없다.',
        },
      },
      {
        id: 'sword_rack',
        name: '검 걸이',
        x: 0.28, y: 0.38, w: 60, h: 80,
        actions: {
          look: '여러 자루의 훈련용 검이 걸려있다.',
          use: '훈련용 검을 잠깐 휘둘러 봤다. 손에 익어가는 느낌이다.',
          pick_up: '칼라의 허락 없이 가져갈 수 없다.',
        },
      },
      {
        id: 'crossed_swords',
        name: '교차 검 문양',
        x: 0.38, y: 0.42, w: 60, h: 55,
        actions: {
          look: '"진정한 검객은 검이 아닌 말로 싸운다" 라고 새겨져 있다.',
          use: '검술 훈련장의 상징이다.',
        },
      },
    ],
    exits: [
      {
        id: 'back_to_forest',
        name: '숲으로 돌아가기',
        to: 'forest',
        x: 0.0, y: 0.55, w: 30, h: 150,
        walkTo: { x: 0.1, y: 0.82 },
      },
    ],
    npcs: [
      {
        id: 'carla',
        name: '칼라 (검술 마스터)',
        x: 0.65, y: 0.75,
        sprite: 'elaine',
        dialogue: 'carla',
        actions: {
          look: '강인한 눈빛의 칼라다. 멜레 섬 최강의 검술사로 알려져 있다.',
          talk: '',
        },
      },
    ],
  },

  prison: {
    id: 'prison',
    name: '감옥',
    render: renderPrison,
    walkArea: { x1: 0.42, y1: 0.7, x2: 0.95, y2: 0.92 },
    objects: [
      {
        id: 'cell_bars',
        name: '감옥 창살',
        x: 0.04, y: 0.0, w: 380, h: 460,
        actions: {
          look: '두꺼운 쇠창살이다. 사람이 갇혀있다.',
          use: '창살을 잡아당겨봤지만 꿈쩍도 안 한다.',
          push: '창살이 꿈쩍도 안 한다.',
        },
      },
      {
        id: 'hanging_keys',
        name: '열쇠꾸러미',
        x: 0.84, y: 0.34, w: 20, h: 30,
        actions: {
          look: '보안관 책상 위에 열쇠꾸러미가 걸려 있다. 감옥 열쇠인 것 같다.',
          pick_up: [
            { cmd: 'if', flag: 'sheriff_distracted',
              then: [
                { cmd: 'give_item', id: 'jail_key', name: '감옥 열쇠', icon: '🔑' },
                { cmd: 'hide_object', id: 'hanging_keys' },
                { cmd: 'say', text: '🔑 감옥 열쇠를 가져왔다!' },
              ],
              else: [{ cmd: 'say', text: '보안관이 보고 있다. 가져갈 수 없다.' }],
            },
          ],
        },
      },
      {
        id: 'sheriff_desk',
        name: '보안관 책상',
        x: 0.7, y: 0.5, w: 200, h: 130,
        actions: {
          look: '보안관의 책상이다. 서류들이 어지럽게 쌓여있다.',
          use: '함부로 건드리면 안 될 것 같다.',
          open: '보안관이 노려본다.',
        },
      },
    ],
    exits: [
      {
        id: 'back_to_village_from_prison',
        name: '마을로 돌아가기',
        to: 'village_road',
        x: 0.88, y: 0.55, w: 50, h: 150,
        walkTo: { x: 0.88, y: 0.8 },
      },
    ],
    npcs: [
      {
        id: 'otis',
        name: '오티스',
        x: 0.22, y: 0.55,
        sprite: 'lechuck',
        dialogue: 'otis',
        actions: {
          look: '창살 뒤에 갇혀있는 해적이다. 풀이 죽어있다.',
          talk: '',
        },
      },
    ],
  },
};

