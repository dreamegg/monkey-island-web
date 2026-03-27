import type { Room } from '../engine/types';
import { PALETTE } from '../engine/types';
import { drawStars } from '../utils/canvas';

// ── Room Background Renderers ──────────────────────────────

function renderHarbor(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Sky gradient
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

  // Moon
  ctx.fillStyle = PALETTE.moon;
  ctx.beginPath();
  ctx.arc(w * 0.8, h * 0.12, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.sky;
  ctx.beginPath();
  ctx.arc(w * 0.8 + 6, h * 0.12 - 4, 16, 0, Math.PI * 2);
  ctx.fill();

  // Sea
  for (let y = Math.floor(skyH); y < h * 0.7; y++) {
    const t = (y - skyH) / (h * 0.25);
    ctx.fillStyle = t < 0.5 ? PALETTE.sea : PALETTE.seaLight;
    for (let x = 0; x < w; x += 4) {
      const wave = Math.sin((x + y * 3) * 0.05) * 2;
      ctx.fillRect(x, y + wave, 4, 1);
    }
  }

  // Dock / pier
  const dockY = h * 0.62;
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(w * 0.1, dockY, w * 0.7, h * 0.08);
  ctx.fillStyle = PALETTE.wood;
  for (let x = w * 0.1; x < w * 0.8; x += 20) {
    ctx.fillRect(x, dockY, 18, h * 0.06);
  }
  // Pier posts
  ctx.fillStyle = PALETTE.woodDark;
  [0.15, 0.35, 0.55, 0.75].forEach((px) => {
    ctx.fillRect(w * px, dockY + h * 0.06, 8, h * 0.12);
  });

  // Ground / sand
  ctx.fillStyle = PALETTE.sandDark;
  ctx.fillRect(0, h * 0.7, w, h * 0.3);
  ctx.fillStyle = PALETTE.sand;
  ctx.fillRect(0, h * 0.72, w, h * 0.28);

  // Ship silhouette
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(w * 0.55, h * 0.32, 80, 30);
  ctx.fillStyle = PALETTE.wood;
  ctx.fillRect(w * 0.58, h * 0.34, 74, 20);
  // Mast
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(w * 0.62, h * 0.1, 4, h * 0.24);
  ctx.fillStyle = '#ddd';
  ctx.fillRect(w * 0.58, h * 0.12, 30, 18);

  // Sign post
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(w * 0.2, h * 0.55, 6, h * 0.17);
  ctx.fillStyle = PALETTE.sign;
  ctx.fillRect(w * 0.14, h * 0.52, 60, 20);
  ctx.fillStyle = PALETTE.black;
  ctx.font = 'bold 10px monospace';
  ctx.fillText('HARBOR', w * 0.15, h * 0.55 + 12);

  // Barrel
  ctx.fillStyle = PALETTE.woodLight;
  ctx.fillRect(w * 0.82, h * 0.65, 24, 28);
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(w * 0.82, h * 0.68, 24, 3);
  ctx.fillRect(w * 0.82, h * 0.74, 24, 3);

  // Anchor
  ctx.fillStyle = PALETTE.stoneDark;
  ctx.fillRect(w * 0.72, h * 0.73, 6, 20);
  ctx.fillRect(w * 0.69, h * 0.89, 12, 4);
  ctx.beginPath();
  ctx.arc(w * 0.725, h * 0.73, 5, 0, Math.PI * 2);
  ctx.fill();

  // Rope coil
  ctx.fillStyle = PALETTE.rope;
  ctx.beginPath();
  ctx.arc(w * 0.78, h * 0.76, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8d6e63';
  ctx.beginPath();
  ctx.arc(w * 0.78, h * 0.76, 4, 0, Math.PI * 2);
  ctx.fill();

  // Torch on post
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(w * 0.42, h * 0.5, 4, h * 0.12);
  ctx.fillStyle = PALETTE.torch;
  ctx.fillRect(w * 0.4, h * 0.47, 8, 8);
  ctx.fillStyle = PALETTE.torchGlow;
  ctx.fillRect(w * 0.41, h * 0.48, 6, 5);
}

function renderTavern(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Interior walls
  ctx.fillStyle = '#3e1f00';
  ctx.fillRect(0, 0, w, h);

  // Back wall wood paneling
  for (let y = 0; y < h * 0.6; y += 16) {
    ctx.fillStyle = y % 32 === 0 ? '#4a2800' : '#3e2200';
    ctx.fillRect(0, y, w, 14);
    ctx.fillStyle = '#2e1a00';
    ctx.fillRect(0, y + 14, w, 2);
  }

  // Floor
  for (let x = 0; x < w; x += 40) {
    ctx.fillStyle = x % 80 === 0 ? '#5d4037' : '#4e342e';
    ctx.fillRect(x, h * 0.7, 40, h * 0.3);
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(x + 38, h * 0.7, 2, h * 0.3);
  }

  // Bar counter
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(w * 0.05, h * 0.55, w * 0.5, h * 0.15);
  ctx.fillStyle = PALETTE.woodLight;
  ctx.fillRect(w * 0.05, h * 0.55, w * 0.5, h * 0.04);

  // Bottles on shelf
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(w * 0.05, h * 0.3, w * 0.35, 6);
  ['#4caf50', '#f44336', '#2196f3', '#ff9800', '#9c27b0', '#4caf50'].forEach(
    (color, i) => {
      ctx.fillStyle = color;
      ctx.fillRect(w * 0.07 + i * 28, h * 0.2, 10, h * 0.1);
      ctx.fillStyle = '#333';
      ctx.fillRect(w * 0.07 + i * 28 + 3, h * 0.19, 4, 4);
    },
  );

  // Chandelier
  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(w * 0.45, 0, 3, h * 0.08);
  ctx.fillRect(w * 0.38, h * 0.08, 60, 4);
  [0, 20, 40, 56].forEach((dx) => {
    ctx.fillStyle = PALETTE.torch;
    ctx.fillRect(w * 0.38 + dx, h * 0.06, 6, 6);
    ctx.fillStyle = PALETTE.torchGlow;
    ctx.fillRect(w * 0.385 + dx, h * 0.055, 4, 4);
  });

  // Table
  ctx.fillStyle = PALETTE.wood;
  ctx.fillRect(w * 0.6, h * 0.6, 80, 8);
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(w * 0.63, h * 0.68, 6, h * 0.12);
  ctx.fillRect(w * 0.72, h * 0.68, 6, h * 0.12);

  // Mug on counter
  ctx.fillStyle = '#795548';
  ctx.fillRect(w * 0.25, h * 0.5, 12, 14);
  ctx.fillStyle = '#a1887f';
  ctx.fillRect(w * 0.237, h * 0.52, 5, 8);

  // Map on wall
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

  // Wanted poster
  ctx.fillStyle = '#d4c89a';
  ctx.fillRect(w * 0.5, h * 0.2, 40, 50);
  ctx.fillStyle = '#5d4037';
  ctx.font = '6px monospace';
  ctx.fillText('WANTED', w * 0.505, h * 0.24);
  ctx.fillStyle = '#333';
  ctx.fillRect(w * 0.51, h * 0.26, 28, 28);

  // Door (exit)
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(w * 0.85, h * 0.35, 40, h * 0.35);
  ctx.fillStyle = PALETTE.wood;
  ctx.fillRect(w * 0.86, h * 0.36, 38, h * 0.33);
  ctx.fillStyle = PALETTE.torchGlow;
  ctx.fillRect(w * 0.9, h * 0.52, 6, 6);
}

function renderForest(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Sky through canopy
  const skyH = h * 0.3;
  for (let y = 0; y < skyH; y++) {
    const t = y / skyH;
    ctx.fillStyle = `rgb(${Math.floor(10 + t * 15)},${Math.floor(15 + t * 20)},${Math.floor(30 + t * 20)})`;
    ctx.fillRect(0, y, w, 1);
  }

  // Dense forest background
  ctx.fillStyle = PALETTE.leafDark;
  ctx.fillRect(0, skyH, w, h - skyH);

  // Ground
  ctx.fillStyle = '#2e1a00';
  ctx.fillRect(0, h * 0.7, w, h * 0.3);
  ctx.fillStyle = '#3e2200';
  ctx.fillRect(0, h * 0.72, w, h * 0.28);

  // Path
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(w * 0.3, h * 0.75, w * 0.4, h * 0.2);
  ctx.fillStyle = '#4e342e';
  ctx.fillRect(w * 0.32, h * 0.76, w * 0.36, h * 0.18);

  // Trees
  const treePositions = [0.05, 0.15, 0.35, 0.55, 0.75, 0.88];
  treePositions.forEach((tx) => {
    // Trunk
    ctx.fillStyle = PALETTE.woodDark;
    ctx.fillRect(w * tx, h * 0.3, 16, h * 0.42);
    // Canopy layers
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

  // Glowing mushrooms
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

  // Stone idol
  ctx.fillStyle = PALETTE.stone;
  ctx.fillRect(w * 0.45, h * 0.58, 30, 40);
  ctx.fillStyle = PALETTE.stoneDark;
  ctx.fillRect(w * 0.45, h * 0.58, 30, 4);
  // Eyes on idol
  ctx.fillStyle = '#f44336';
  ctx.fillRect(w * 0.455, h * 0.62, 6, 6);
  ctx.fillRect(w * 0.47, h * 0.62, 6, 6);

  // Wooden bridge
  ctx.fillStyle = PALETTE.wood;
  ctx.fillRect(w * 0.7, h * 0.68, 80, 10);
  ctx.fillStyle = PALETTE.rope;
  ctx.fillRect(w * 0.7, h * 0.66, 80, 2);
  ctx.fillRect(w * 0.7, h * 0.78, 80, 2);
  // Bridge posts
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(w * 0.7, h * 0.6, 4, 20);
  ctx.fillRect(w * 0.75, h * 0.6, 4, 20);
}

function renderBeach(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Sky
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

  // Moon
  ctx.fillStyle = PALETTE.moon;
  ctx.beginPath();
  ctx.arc(w * 0.3, h * 0.1, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.sky;
  ctx.beginPath();
  ctx.arc(w * 0.3 + 7, h * 0.1 - 4, 20, 0, Math.PI * 2);
  ctx.fill();

  // Sea
  for (let y = Math.floor(skyH); y < h * 0.65; y++) {
    ctx.fillStyle = PALETTE.sea;
    for (let x = 0; x < w; x += 4) {
      const wave = Math.sin((x + y * 2) * 0.04) * 3;
      ctx.fillRect(x, y + wave, 4, 1);
    }
  }

  // Sand
  ctx.fillStyle = PALETTE.sand;
  ctx.fillRect(0, h * 0.6, w, h * 0.4);
  ctx.fillStyle = PALETTE.sandDark;
  ctx.fillRect(0, h * 0.6, w, h * 0.04);

  // Palm tree
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(w * 0.15, h * 0.2, 10, h * 0.45);
  // Coconuts
  ctx.fillStyle = '#5d4037';
  ctx.beginPath();
  ctx.arc(w * 0.155, h * 0.22, 5, 0, Math.PI * 2);
  ctx.fill();
  // Palm leaves
  ctx.fillStyle = PALETTE.leaf;
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
    ctx.save();
    ctx.translate(w * 0.155, h * 0.18);
    ctx.rotate(angle);
    ctx.fillRect(-4, 0, 8, 50);
    ctx.restore();
  }

  // Skull rock
  ctx.fillStyle = PALETTE.stone;
  ctx.beginPath();
  ctx.arc(w * 0.7, h * 0.55, 35, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.stoneDark;
  // Skull eyes
  ctx.fillStyle = PALETTE.black;
  ctx.beginPath();
  ctx.arc(w * 0.685, h * 0.53, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(w * 0.715, h * 0.53, 6, 0, Math.PI * 2);
  ctx.fill();
  // Skull nose
  ctx.fillRect(w * 0.697, h * 0.56, 6, 4);

  // Campfire
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

  // Old chest
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(w * 0.82, h * 0.7, 36, 24);
  ctx.fillStyle = PALETTE.wood;
  ctx.fillRect(w * 0.82, h * 0.7, 36, 10);
  ctx.fillStyle = PALETTE.torchGlow;
  ctx.fillRect(w * 0.838, h * 0.72, 8, 6);

  // Cave entrance hint (right side)
  ctx.fillStyle = PALETTE.stoneDark;
  ctx.fillRect(w * 0.9, h * 0.4, 60, h * 0.3);
  ctx.fillStyle = PALETTE.black;
  ctx.fillRect(w * 0.92, h * 0.45, 40, h * 0.22);
}

function renderCave(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Dark cave interior
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, w, h);

  // Cave walls
  ctx.fillStyle = PALETTE.stoneDark;
  // Ceiling stalactites
  for (let x = 0; x < w; x += 30) {
    const stalH = 20 + Math.sin(x * 0.1) * 30;
    ctx.fillRect(x, 0, 28, stalH);
  }
  // Floor stalagmites
  for (let x = 10; x < w; x += 40) {
    const stagH = 15 + Math.cos(x * 0.08) * 20;
    ctx.fillRect(x, h - stagH, 24, stagH);
  }

  // Cave floor
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, h * 0.72, w, h * 0.28);
  ctx.fillStyle = PALETTE.stoneDark;
  ctx.fillRect(0, h * 0.72, w, h * 0.04);

  // Glowing crystals
  const crystalPositions = [
    { x: 0.2, y: 0.4, color: '#2196f3', size: 12 },
    { x: 0.35, y: 0.55, color: '#00bcd4', size: 8 },
    { x: 0.6, y: 0.35, color: '#7c4dff', size: 14 },
    { x: 0.8, y: 0.5, color: '#2196f3', size: 10 },
    { x: 0.15, y: 0.6, color: '#00e5ff', size: 6 },
  ];
  crystalPositions.forEach((c) => {
    // Crystal glow
    ctx.fillStyle = c.color + '33';
    ctx.beginPath();
    ctx.arc(w * c.x, h * c.y, c.size * 3, 0, Math.PI * 2);
    ctx.fill();
    // Crystal shape
    ctx.fillStyle = c.color;
    ctx.beginPath();
    ctx.moveTo(w * c.x, h * c.y - c.size);
    ctx.lineTo(w * c.x + c.size * 0.6, h * c.y + c.size * 0.5);
    ctx.lineTo(w * c.x - c.size * 0.6, h * c.y + c.size * 0.5);
    ctx.closePath();
    ctx.fill();
  });

  // Underground pool
  ctx.fillStyle = PALETTE.water + '88';
  ctx.fillRect(w * 0.4, h * 0.75, w * 0.25, h * 0.08);
  ctx.fillStyle = PALETTE.water + '44';
  ctx.fillRect(w * 0.42, h * 0.76, w * 0.21, h * 0.06);

  // Cave walls (sides)
  ctx.fillStyle = PALETTE.stoneDark;
  ctx.fillRect(0, 0, w * 0.05, h);
  ctx.fillRect(w * 0.95, 0, w * 0.05, h);
}

// ── Room Data ──────────────────────────────────────────────

export const ROOMS: Record<string, Room> = {
  harbor: {
    id: 'harbor',
    name: '항구',
    render: renderHarbor,
    // Wooden pier extends from cliff (left) toward ship (right)
    walkArea: { x1: 0.03, y1: 0.58, x2: 0.78, y2: 0.82 },
    objects: [
      {
        id: 'sign',
        name: '낡은 간판',
        x: 0.28,
        y: 0.52,
        w: 50,
        h: 20,
        actions: {
          look: "바래진 글씨가 적힌 항구 간판이다. '멜레 항구에 오신 것을 환영합니다'",
          read: "'멜레 항구 - 해적 지망생 환영!' 이라고 쓰여있다.",
          pick_up: '간판이 땅에 단단히 박혀있다. 뽑을 수 없다.',
        },
      },
      {
        id: 'barrel',
        name: '나무 통',
        x: 0.42,
        y: 0.6,
        w: 24,
        h: 28,
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
        x: 0.68,
        y: 0.18,
        w: 80,
        h: 50,
        actions: {
          look: '멀리서 해적선이 정박해 있다. 돛에 해골 마크가 보인다.',
          use: '배까지 갈 수 없다. 보트가 필요하다.',
        },
      },
      {
        id: 'anchor',
        name: '닻',
        x: 0.55,
        y: 0.62,
        w: 12,
        h: 24,
        actions: {
          look: '무거운 철제 닻이다. 녹이 잔뜩 슬어있다.',
          pick_up: '너무 무겁다! 들 수 없다.',
          use: '밧줄이 있으면 뭔가 할 수 있을 것 같은데...',
        },
      },
      {
        id: 'rope_coil',
        name: '밧줄 뭉치',
        x: 0.5,
        y: 0.63,
        w: 16,
        h: 16,
        actions: {
          look: '튼튼해 보이는 밧줄 뭉치다.',
          pick_up: '밧줄을 집어들었다!',
          use: '뭔가에 묶어야 할 것 같다.',
        },
        item: { id: 'rope', name: '밧줄', icon: '🪢' },
      },
    ],
    exits: [
      {
        // Left side — path up the cliff toward the town/tavern
        id: 'tavern_door',
        name: '선술집',
        to: 'tavern',
        x: 0.0,
        y: 0.45,
        w: 30,
        h: 140,
        walkTo: { x: 0.05, y: 0.65 },
      },
      {
        // Right edge of pier — path along coast to forest
        id: 'forest_path',
        name: '숲으로 가는 길',
        to: 'forest',
        x: 0.75,
        y: 0.58,
        w: 40,
        h: 100,
        walkTo: { x: 0.73, y: 0.68 },
      },
    ],
    npcs: [
      {
        id: 'three_pirates',
        name: '세 해적',
        x: 0.35,
        y: 0.65,
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
    // Wooden floor — bar counter is on the right
    walkArea: { x1: 0.03, y1: 0.68, x2: 0.65, y2: 0.95 },
    objects: [
      {
        // Mug sitting on bar counter (right side)
        id: 'mug',
        name: '맥주잔',
        x: 0.7,
        y: 0.52,
        w: 14,
        h: 16,
        actions: {
          look: '거품이 넘치는 그로그 맥주잔이다.',
          pick_up: '맥주잔을 집어들었다!',
          use: '벌컥벌컥... 독한 맛이다! 하지만 기분이 좋아졌다.',
        },
        item: { id: 'mug', name: '맥주잔', icon: '🍺' },
      },
      {
        // Map on back wall
        id: 'map',
        name: '보물 지도',
        x: 0.42,
        y: 0.18,
        w: 50,
        h: 40,
        actions: {
          look: "벽에 걸린 보물 지도다. 'X' 표시가 선명하다.",
          read: "'원숭이 섬'이라고 적혀 있다. 보물이 묻힌 곳인가...",
          pick_up: '벽에 못으로 고정되어 있다. 떼어낼 수 없다.',
        },
      },
      {
        // Bottles on shelves behind bar (right wall)
        id: 'bottles',
        name: '술병들',
        x: 0.78,
        y: 0.2,
        w: 120,
        h: 50,
        actions: {
          look: '온갖 종류의 럼주와 그로그가 진열되어 있다.',
          pick_up: '바텐더가 노려본다. 함부로 가져갈 수 없다.',
          use: '손님한테 직접 따라드리진 않습니다, 해적 양반.',
        },
      },
      {
        // Wanted poster on left wall
        id: 'wanted_poster',
        name: '수배 전단',
        x: 0.15,
        y: 0.22,
        w: 40,
        h: 50,
        actions: {
          look: '르척의 수배 전단이다. "유령 해적 르척 - 현상금: 측정 불가"라고 적혀있다.',
          read: '"경고: 이 유령 해적은 극도로 위험합니다. 발견 즉시 도망치십시오."',
          pick_up: '벽에 단단히 붙어있다.',
        },
      },
    ],
    exits: [
      {
        // Door on far left wall — leads back to harbor
        id: 'harbor_door',
        name: '항구',
        to: 'harbor',
        x: 0.0,
        y: 0.4,
        w: 30,
        h: 130,
        walkTo: { x: 0.05, y: 0.8 },
      },
    ],
    npcs: [
      {
        // Bartender behind bar counter on the right
        id: 'bartender',
        name: '바텐더',
        x: 0.72,
        y: 0.58,
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
    // Dense jungle — walkable path along lower ground
    walkArea: { x1: 0.1, y1: 0.73, x2: 0.9, y2: 0.95 },
    objects: [
      {
        // Glowing mushroom on forest floor, left side
        id: 'mushroom_glow',
        name: '빛나는 버섯',
        x: 0.18,
        y: 0.76,
        w: 14,
        h: 16,
        actions: {
          look: '보라색으로 빛나는 신비한 버섯이다. 만지면 위험할 것 같다.',
          pick_up: '조심스럽게 버섯을 뽑았다. 이상한 가루가 손에 묻었다.',
          use: '이걸 어디에 쓸 수 있을까...',
        },
        item: { id: 'glowing_mushroom', name: '빛나는 버섯', icon: '🍄' },
      },
      {
        // Stone idol deeper in the path, center
        id: 'stone_idol',
        name: '돌 우상',
        x: 0.5,
        y: 0.62,
        w: 30,
        h: 40,
        actions: {
          look: '고대 원주민이 만든 것 같은 돌 우상이다. 빨간 눈이 번뜩인다. 받침대 밑에 뭔가 새겨져 있다...',
          read: '"동굴의 물 아래 열쇠가 잠든다" 라고 쓰여있다.',
          push: '우상이 조금 움직였다! 뒤에서 먼지가 일어났다.',
          pull: '너무 무겁다. 꿈쩍도 안 한다.',
        },
      },
      {
        // Wooden bridge crossing a gap, right-center area
        id: 'wooden_bridge',
        name: '나무 다리',
        x: 0.65,
        y: 0.7,
        w: 80,
        h: 14,
        actions: {
          look: '낡은 나무 다리다. 밧줄로 겨우 지탱하고 있다.',
          use: '조심스럽게 건넌다... 삐걱삐걱!',
          push: '다리가 흔들린다! 위험해!',
        },
      },
    ],
    exits: [
      {
        // Left edge — back to harbor
        id: 'harbor_back',
        name: '항구로 돌아가기',
        to: 'harbor',
        x: 0.0,
        y: 0.6,
        w: 30,
        h: 130,
        walkTo: { x: 0.12, y: 0.8 },
      },
      {
        // Right edge — path to beach
        id: 'beach_path',
        name: '해변으로 가는 길',
        to: 'beach',
        x: 0.92,
        y: 0.6,
        w: 40,
        h: 130,
        walkTo: { x: 0.88, y: 0.8 },
      },
    ],
    npcs: [
      {
        id: 'voodoo_lady',
        name: '부두교 여사제',
        x: 0.45,
        y: 0.78,
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
    // Sandy beach — cave on LEFT, water on RIGHT
    walkArea: { x1: 0.1, y1: 0.65, x2: 0.82, y2: 0.95 },
    objects: [
      {
        // Palm trees in center-left area
        id: 'palm_tree',
        name: '야자나무',
        x: 0.32,
        y: 0.1,
        w: 20,
        h: 220,
        actions: {
          look: '높은 야자나무다. 위에 코코넛이 매달려 있다.',
          push: '나무를 흔들었더니... 코코넛이 떨어졌다!',
          pick_up: '나무는 집을 수 없다. 코코넛이 위에 있다.',
        },
      },
      {
        // Skull rock on RIGHT in the water
        id: 'skull_rock',
        name: '해골 바위',
        x: 0.7,
        y: 0.4,
        w: 70,
        h: 60,
        actions: {
          look: '해골 모양의 거대한 바위다. 눈구멍이 으스스하다.',
          use: '바위에 손을 대자 차가운 기운이 느껴진다...',
          push: '꿈쩍도 안 한다. 수천 년은 여기 있었을 것 같다.',
        },
      },
      {
        // Campfire on the sand, center area
        id: 'campfire',
        name: '모닥불',
        x: 0.48,
        y: 0.75,
        w: 26,
        h: 16,
        actions: {
          look: '최근에 누군가 피운 것 같은 모닥불이다. 아직 따뜻하다.',
          use: '불에 손을 대면 안 된다!',
          open: '재를 뒤적여보니... 탄 쪽지 조각이 나왔다.',
        },
      },
      {
        // Old chest near the cave/rock area on left
        id: 'old_chest',
        name: '오래된 상자',
        x: 0.22,
        y: 0.7,
        w: 36,
        h: 24,
        actions: {
          look: '자물쇠가 채워진 오래된 보물 상자다. 열쇠가 필요하다.',
          open: '자물쇠가 잠겨있다. 열쇠가 필요해!',
          use: '열쇠가 없으면 열 수 없다.',
          pick_up: '상자가 땅에 반쯤 묻혀있다. 가져갈 수 없다.',
        },
      },
    ],
    exits: [
      {
        // RIGHT edge — back to forest
        id: 'forest_back',
        name: '숲으로 돌아가기',
        to: 'forest',
        x: 0.92,
        y: 0.6,
        w: 40,
        h: 130,
        walkTo: { x: 0.8, y: 0.78 },
      },
      {
        // LEFT side — cave entrance (dark opening in rock on LEFT of image)
        id: 'cave_entrance',
        name: '동굴 입구',
        to: 'cave',
        x: 0.05,
        y: 0.35,
        w: 60,
        h: 100,
        walkTo: { x: 0.15, y: 0.68 },
      },
    ],
  },
  cave: {
    id: 'cave',
    name: '수정 동굴',
    render: renderCave,
    // Rocky cave floor — large opening in back center
    walkArea: { x1: 0.08, y1: 0.68, x2: 0.92, y2: 0.95 },
    objects: [
      {
        // Crystal on right cave wall
        id: 'crystal_shard',
        name: '수정 파편',
        x: 0.72,
        y: 0.4,
        w: 20,
        h: 24,
        actions: {
          look: '아름답게 빛나는 수정이다. 보라색 빛이 맥동한다.',
          pick_up: '조심스럽게 수정 파편을 꺼냈다!',
          use: '수정에서 이상한 에너지가 느껴진다...',
        },
        item: { id: 'crystal_shard', name: '수정 파편', icon: '💎' },
      },
      {
        // Key submerged in the water stream, center-lower
        id: 'cave_key',
        name: '녹슨 열쇠',
        x: 0.48,
        y: 0.76,
        w: 12,
        h: 10,
        actions: {
          look: '물 아래 뭔가 반짝이는 것이 보인다... 열쇠다!',
          pick_up: '물에 손을 넣어 녹슨 열쇠를 건졌다!',
          use: '이 열쇠로 뭘 열 수 있을까...',
        },
        item: { id: 'cave_key', name: '녹슨 열쇠', icon: '🗝' },
      },
      {
        // Water stream/pool in center-lower area
        id: 'underground_pool',
        name: '지하 웅덩이',
        x: 0.35,
        y: 0.72,
        w: 180,
        h: 50,
        actions: {
          look: '맑고 차가운 지하수가 고여 있다. 바닥에 뭔가 반짝이는 게 보인다.',
          use: '물이 너무 차갑다! 손이 얼 것 같다.',
        },
      },
    ],
    exits: [
      {
        // Back out to the beach — large cave opening in back center
        id: 'beach_back',
        name: '해변으로 돌아가기',
        to: 'beach',
        x: 0.3,
        y: 0.15,
        w: 260,
        h: 120,
        walkTo: { x: 0.5, y: 0.72 },
      },
    ],
  },
};
