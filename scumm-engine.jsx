import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════
// SCUMM-Style Point & Click Adventure Engine Prototype
// ═══════════════════════════════════════════════════════════

// ── Pixel Art Drawing Helpers ──────────────────────────────
const PALETTE = {
  sky: "#1a1a2e",
  skyMid: "#16213e",
  sea: "#0f3460",
  seaLight: "#1a5276",
  sand: "#c4a35a",
  sandDark: "#a68b3d",
  wood: "#5d4037",
  woodLight: "#795548",
  woodDark: "#3e2723",
  leaf: "#2e7d32",
  leafLight: "#4caf50",
  leafDark: "#1b5e20",
  stone: "#607d8b",
  stoneDark: "#455a64",
  torch: "#ff9800",
  torchGlow: "#ffeb3b",
  sign: "#8d6e63",
  rope: "#a1887f",
  water: "#0d47a1",
  moon: "#fdd835",
  star: "#fff9c4",
  skin: "#ffccbc",
  shirt: "#e53935",
  pants: "#1565c0",
  hair: "#ffeb3b",
  black: "#000000",
  white: "#ffffff",
  uiBg: "#1a0a00",
  uiBorder: "#8b6914",
  uiText: "#ffd54f",
  uiVerb: "#4a2800",
  uiVerbHover: "#6d3f00",
  uiVerbActive: "#ff8f00",
  dialogBg: "#0a0a0a",
  msgText: "#c8e6c9",
};

// ── Room Background Renderers (Pixel Art via Canvas) ──────
function drawStars(ctx, w, h) {
  const stars = [
    [45,20],[120,35],[200,15],[310,40],[400,25],[520,18],[600,42],
    [680,30],[95,55],[250,50],[460,48],[580,60],[350,12],[150,8],
    [700,15],[50,45],[500,38],[630,22],[180,42],[420,8],
  ];
  stars.forEach(([x, y]) => {
    const bright = Math.random() > 0.5;
    ctx.fillStyle = bright ? PALETTE.star : "#b0bec5";
    ctx.fillRect(x * (w/800), y * (h/400) * 0.4, 2, 2);
  });
}

function renderHarbor(ctx, w, h) {
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
  [0.15, 0.35, 0.55, 0.75].forEach(px => {
    ctx.fillRect(w * px, dockY + h * 0.06, 8, h * 0.12);
  });

  // Ground / sand
  ctx.fillStyle = PALETTE.sandDark;
  ctx.fillRect(0, h * 0.7, w, h * 0.3);
  ctx.fillStyle = PALETTE.sand;
  ctx.fillRect(0, h * 0.72, w, h * 0.28);

  // Ship silhouette in background
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(w * 0.55, h * 0.32, 80, 30);
  ctx.fillStyle = PALETTE.wood;
  ctx.fillRect(w * 0.58, h * 0.34, 74, 20);
  // Mast
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(w * 0.62, h * 0.1, 4, h * 0.24);
  ctx.fillStyle = "#ddd";
  ctx.fillRect(w * 0.58, h * 0.12, 30, 18);

  // Sign post
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(w * 0.2, h * 0.55, 6, h * 0.17);
  ctx.fillStyle = PALETTE.sign;
  ctx.fillRect(w * 0.14, h * 0.52, 60, 20);
  ctx.fillStyle = PALETTE.black;
  ctx.font = "bold 10px monospace";
  ctx.fillText("HARBOR", w * 0.15, h * 0.55 + 12);

  // Barrel
  ctx.fillStyle = PALETTE.woodLight;
  ctx.fillRect(w * 0.82, h * 0.65, 24, 28);
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(w * 0.82, h * 0.68, 24, 3);
  ctx.fillRect(w * 0.82, h * 0.74, 24, 3);

  // Torch on post
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(w * 0.42, h * 0.5, 4, h * 0.12);
  ctx.fillStyle = PALETTE.torch;
  ctx.fillRect(w * 0.40, h * 0.47, 8, 8);
  ctx.fillStyle = PALETTE.torchGlow;
  ctx.fillRect(w * 0.41, h * 0.48, 6, 5);
}

function renderTavern(ctx, w, h) {
  // Interior walls
  ctx.fillStyle = "#3e1f00";
  ctx.fillRect(0, 0, w, h);

  // Back wall wood paneling
  for (let y = 0; y < h * 0.6; y += 16) {
    ctx.fillStyle = y % 32 === 0 ? "#4a2800" : "#3e2200";
    ctx.fillRect(0, y, w, 14);
    ctx.fillStyle = "#2e1a00";
    ctx.fillRect(0, y + 14, w, 2);
  }

  // Floor
  for (let x = 0; x < w; x += 40) {
    ctx.fillStyle = x % 80 === 0 ? "#5d4037" : "#4e342e";
    ctx.fillRect(x, h * 0.7, 40, h * 0.3);
    ctx.fillStyle = "#3e2723";
    ctx.fillRect(x + 38, h * 0.7, 2, h * 0.3);
  }

  // Bar counter
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(w * 0.05, h * 0.55, w * 0.5, h * 0.15);
  ctx.fillStyle = PALETTE.woodLight;
  ctx.fillRect(w * 0.05, h * 0.55, w * 0.5, h * 0.04);

  // Bottles on shelf
  ctx.fillStyle = "#5d4037";
  ctx.fillRect(w * 0.05, h * 0.3, w * 0.35, 6);
  ["#4caf50", "#f44336", "#2196f3", "#ff9800", "#9c27b0", "#4caf50"].forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(w * 0.07 + i * 28, h * 0.2, 10, h * 0.1);
    ctx.fillStyle = "#333";
    ctx.fillRect(w * 0.07 + i * 28 + 3, h * 0.19, 4, 4);
  });

  // Chandelier
  ctx.fillStyle = "#8d6e63";
  ctx.fillRect(w * 0.45, 0, 3, h * 0.08);
  ctx.fillRect(w * 0.38, h * 0.08, 60, 4);
  [0, 20, 40, 56].forEach(dx => {
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
  ctx.fillStyle = "#795548";
  ctx.fillRect(w * 0.25, h * 0.5, 12, 14);
  ctx.fillStyle = "#a1887f";
  ctx.fillRect(w * 0.237, h * 0.52, 5, 8);

  // Map on wall
  ctx.fillStyle = "#d4c89a";
  ctx.fillRect(w * 0.65, h * 0.15, 60, 45);
  ctx.strokeStyle = "#8d6e63";
  ctx.lineWidth = 2;
  ctx.strokeRect(w * 0.65, h * 0.15, 60, 45);
  ctx.fillStyle = "#5d4037";
  ctx.font = "8px monospace";
  ctx.fillText("TREASURE", w * 0.66, h * 0.2);
  ctx.fillStyle = "#c62828";
  ctx.fillText("X", w * 0.7, h * 0.32);

  // Door (exit)
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(w * 0.85, h * 0.35, 40, h * 0.35);
  ctx.fillStyle = PALETTE.wood;
  ctx.fillRect(w * 0.86, h * 0.36, 38, h * 0.33);
  ctx.fillStyle = PALETTE.torchGlow;
  ctx.fillRect(w * 0.9, h * 0.52, 6, 6);
}

// ── Game Data ──────────────────────────────────────────────
const ROOMS = {
  harbor: {
    id: "harbor",
    name: "항구",
    render: renderHarbor,
    walkArea: { x1: 0.02, y1: 0.72, x2: 0.98, y2: 0.95 },
    objects: [
      {
        id: "sign",
        name: "낡은 간판",
        x: 0.17,
        y: 0.54,
        w: 50,
        h: 20,
        actions: {
          look: "바래진 글씨가 적힌 항구 간판이다. '멜레 항구에 오신 것을 환영합니다'",
          read: "'멜레 항구 - 해적 지망생 환영!' 이라고 쓰여있다.",
          pick_up: "간판이 땅에 단단히 박혀있다. 뽑을 수 없다.",
        },
      },
      {
        id: "barrel",
        name: "나무 통",
        x: 0.83,
        y: 0.67,
        w: 24,
        h: 28,
        actions: {
          look: "오래된 럼주 통이다. 아직 냄새가 진하게 난다.",
          open: "뚜껑을 열어보니... 거미 한 마리가 튀어나왔다!",
          pick_up: "너무 무거워서 들 수 없다.",
        },
        item: { id: "grog", name: "그로그 맥주", icon: "🍺" },
      },
      {
        id: "ship",
        name: "해적선",
        x: 0.6,
        y: 0.3,
        w: 70,
        h: 35,
        actions: {
          look: "멀리서 해적선이 정박해 있다. 돛에 해골 마크가 보인다.",
          use: "배까지 갈 수 없다. 보트가 필요하다.",
        },
      },
    ],
    exits: [
      {
        id: "tavern_door",
        name: "선술집",
        to: "tavern",
        x: 0.0,
        y: 0.72,
        w: 30,
        h: 100,
        walkTo: { x: 0.04, y: 0.82 },
      },
    ],
  },
  tavern: {
    id: "tavern",
    name: "선술집 (스컵 바)",
    render: renderTavern,
    walkArea: { x1: 0.02, y1: 0.7, x2: 0.95, y2: 0.95 },
    objects: [
      {
        id: "mug",
        name: "맥주잔",
        x: 0.25,
        y: 0.51,
        w: 14,
        h: 16,
        actions: {
          look: "거품이 넘치는 그로그 맥주잔이다.",
          pick_up: "맥주잔을 집어들었다!",
          use: "벌컥벌컥... 독한 맛이다! 하지만 기분이 좋아졌다.",
        },
        item: { id: "mug", name: "맥주잔", icon: "🍺" },
      },
      {
        id: "map",
        name: "보물 지도",
        x: 0.66,
        y: 0.16,
        w: 58,
        h: 44,
        actions: {
          look: "벽에 걸린 보물 지도다. 'X' 표시가 선명하다.",
          read: "'원숭이 섬'이라고 적혀 있다. 보물이 묻힌 곳인가...",
          pick_up: "벽에 못으로 고정되어 있다. 떼어낼 수 없다.",
        },
      },
      {
        id: "bottles",
        name: "술병들",
        x: 0.08,
        y: 0.2,
        w: 140,
        h: 50,
        actions: {
          look: "온갖 종류의 럼주와 그로그가 진열되어 있다.",
          pick_up: "바텐더가 노려본다. 함부로 가져갈 수 없다.",
          use: "손님한테 직접 따라드리진 않습니다, 해적 양반.",
        },
      },
    ],
    exits: [
      {
        id: "harbor_door",
        name: "항구",
        to: "harbor",
        x: 0.86,
        y: 0.38,
        w: 36,
        h: 130,
        walkTo: { x: 0.88, y: 0.82 },
      },
    ],
  },
};

const VERBS = [
  { id: "look", label: "살펴보기", icon: "👁" },
  { id: "pick_up", label: "집기", icon: "✋" },
  { id: "use", label: "사용", icon: "⚙" },
  { id: "open", label: "열기", icon: "📦" },
  { id: "read", label: "읽기", icon: "📜" },
  { id: "talk", label: "말하기", icon: "💬" },
  { id: "push", label: "밀기", icon: "👉" },
  { id: "pull", label: "당기기", icon: "👈" },
  { id: "give", label: "주기", icon: "🎁" },
];

// ── Character Sprite Renderer ──────────────────────────────
function drawCharacter(ctx, x, y, facing, frame) {
  const s = 2; // scale
  const bobY = Math.sin(frame * 0.3) * 1.5;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(x, y + 20 * s, 8 * s, 3 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  const dir = facing === "left" ? -1 : 1;

  // Boots
  ctx.fillStyle = "#4e342e";
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
  ctx.fillStyle = "#ffab91";
  ctx.fillRect(x + dir * 2 * s, y - 6 * s + bobY, 1.5 * s, 1.5 * s);
}

// ── Main Game Component ────────────────────────────────────
export default function ScummEngine() {
  const canvasRef = useRef(null);
  const [room, setRoom] = useState("harbor");
  const [playerPos, setPlayerPos] = useState({ x: 0.5, y: 0.85 });
  const [targetPos, setTargetPos] = useState(null);
  const [facing, setFacing] = useState("right");
  const [selectedVerb, setSelectedVerb] = useState("look");
  const [message, setMessage] = useState("원숭이 섬의 비밀에 오신 것을 환영합니다! 해적이 되기 위한 모험을 시작하세요.");
  const [inventory, setInventory] = useState([]);
  const [hoveredObject, setHoveredObject] = useState(null);
  const [frame, setFrame] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [messageQueue, setMessageQueue] = useState([]);
  const [cursorAction, setCursorAction] = useState("");

  const currentRoom = ROOMS[room];
  const CANVAS_W = 800;
  const CANVAS_H = 400;

  // Animation loop
  useEffect(() => {
    const interval = setInterval(() => setFrame(f => f + 1), 100);
    return () => clearInterval(interval);
  }, []);

  // Movement
  useEffect(() => {
    if (!targetPos) return;
    const speed = 0.012;
    const interval = setInterval(() => {
      setPlayerPos(prev => {
        const dx = targetPos.x - prev.x;
        const dy = targetPos.y - prev.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < speed) {
          setIsMoving(false);
          setTargetPos(null);
          // Execute pending action on arrival
          if (pendingAction) {
            const { type, data } = pendingAction;
            setPendingAction(null);
            if (type === "interact") executeAction(data.obj, data.verb);
            if (type === "exit") changeRoom(data.exit);
          }
          return targetPos;
        }
        setIsMoving(true);
        if (dx > 0.01) setFacing("right");
        else if (dx < -0.01) setFacing("left");
        return {
          x: prev.x + (dx / dist) * speed,
          y: prev.y + (dy / dist) * speed,
        };
      });
    }, 30);
    return () => clearInterval(interval);
  }, [targetPos, pendingAction]);

  // Render scene
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    // Draw room background
    currentRoom.render(ctx, CANVAS_W, CANVAS_H);

    // Highlight hovered object
    if (hoveredObject) {
      const obj =
        currentRoom.objects.find(o => o.id === hoveredObject) ||
        currentRoom.exits.find(e => e.id === hoveredObject);
      if (obj) {
        ctx.strokeStyle = PALETTE.uiVerbActive;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(
          obj.x * CANVAS_W - 2,
          obj.y * CANVAS_H - 2,
          (obj.w || 30) + 4,
          (obj.h || 30) + 4
        );
        ctx.setLineDash([]);
      }
    }

    // Draw character
    drawCharacter(
      ctx,
      playerPos.x * CANVAS_W,
      playerPos.y * CANVAS_H,
      facing,
      isMoving ? frame : 0
    );
  }, [frame, room, playerPos, facing, isMoving, hoveredObject, currentRoom]);

  const clampToWalkArea = (x, y) => {
    const wa = currentRoom.walkArea;
    return {
      x: Math.max(wa.x1, Math.min(wa.x2, x)),
      y: Math.max(wa.y1, Math.min(wa.y2, y)),
    };
  };

  const executeAction = (obj, verb) => {
    const action = obj.actions?.[verb];
    if (action) {
      setMessage(action);
      if (verb === "pick_up" && obj.item && !inventory.find(i => i.id === obj.item.id)) {
        setInventory(prev => [...prev, obj.item]);
        setMessage(`${obj.item.icon} ${obj.item.name}을(를) 획득했다!`);
      }
    } else {
      const fallbacks = [
        "그건 작동하지 않는다.",
        "그렇게 할 수 없다.",
        "아무 일도 일어나지 않았다.",
        "좋은 생각이지만... 안 된다.",
      ];
      setMessage(fallbacks[Math.floor(Math.random() * fallbacks.length)]);
    }
  };

  const changeRoom = (exit) => {
    setRoom(exit.to);
    const newRoom = ROOMS[exit.to];
    const entryX = exit.to === "harbor" ? 0.06 : 0.92;
    setPlayerPos({ x: entryX, y: 0.85 });
    setTargetPos(null);
    setIsMoving(false);
    setMessage(`${newRoom.name}에 도착했다.`);
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;
    const nx = cx / CANVAS_W;
    const ny = cy / CANVAS_H;

    // Check exits
    for (const exit of currentRoom.exits) {
      if (
        cx >= exit.x * CANVAS_W &&
        cx <= exit.x * CANVAS_W + exit.w &&
        cy >= exit.y * CANVAS_H &&
        cy <= exit.y * CANVAS_H + exit.h
      ) {
        const walkTarget = clampToWalkArea(exit.walkTo.x, exit.walkTo.y);
        setTargetPos(walkTarget);
        setPendingAction({ type: "exit", data: { exit } });
        setMessage(`${exit.name}(으)로 이동 중...`);
        return;
      }
    }

    // Check objects
    for (const obj of currentRoom.objects) {
      if (
        cx >= obj.x * CANVAS_W &&
        cx <= obj.x * CANVAS_W + obj.w &&
        cy >= obj.y * CANVAS_H &&
        cy <= obj.y * CANVAS_H + obj.h
      ) {
        const walkTarget = clampToWalkArea(obj.x + obj.w / CANVAS_W / 2, currentRoom.walkArea.y1 + 0.05);
        setTargetPos(walkTarget);
        setPendingAction({ type: "interact", data: { obj, verb: selectedVerb } });
        setCursorAction(`${VERBS.find(v => v.id === selectedVerb)?.label} ${obj.name}`);
        return;
      }
    }

    // Walk to point
    const clamped = clampToWalkArea(nx, ny);
    setTargetPos(clamped);
    setPendingAction(null);
    setCursorAction("");
  };

  const handleCanvasMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;

    let found = null;
    for (const obj of [...currentRoom.objects, ...currentRoom.exits]) {
      if (
        cx >= obj.x * CANVAS_W &&
        cx <= obj.x * CANVAS_W + (obj.w || 30) &&
        cy >= obj.y * CANVAS_H &&
        cy <= obj.y * CANVAS_H + (obj.h || 30)
      ) {
        found = obj.id;
        setCursorAction(`${VERBS.find(v => v.id === selectedVerb)?.label} ${obj.name}`);
        break;
      }
    }
    if (!found) setCursorAction("");
    setHoveredObject(found);
  };

  return (
    <div
      style={{
        background: "#000",
        width: "100%",
        maxWidth: 820,
        margin: "0 auto",
        fontFamily: "'Press Start 2P', 'Courier New', monospace",
        border: `3px solid ${PALETTE.uiBorder}`,
        borderRadius: 4,
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      {/* Title Bar */}
      <div
        style={{
          background: `linear-gradient(180deg, #2a1400, ${PALETTE.uiBg})`,
          padding: "6px 12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `2px solid ${PALETTE.uiBorder}`,
        }}
      >
        <span style={{ color: PALETTE.uiText, fontSize: 11 }}>
          ☠ 원숭이 섬의 비밀
        </span>
        <span style={{ color: "#8d6e63", fontSize: 9 }}>
          {currentRoom.name}
        </span>
      </div>

      {/* Action Text */}
      <div
        style={{
          background: PALETTE.uiBg,
          padding: "4px 12px",
          minHeight: 22,
          borderBottom: `1px solid ${PALETTE.uiBorder}`,
        }}
      >
        <span style={{ color: PALETTE.uiVerbActive, fontSize: 10 }}>
          {cursorAction || `${VERBS.find(v => v.id === selectedVerb)?.label}...`}
        </span>
      </div>

      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMove}
        style={{
          width: "100%",
          display: "block",
          cursor: hoveredObject ? "pointer" : "crosshair",
          imageRendering: "pixelated",
        }}
      />

      {/* Bottom Panel */}
      <div
        style={{
          background: PALETTE.uiBg,
          borderTop: `2px solid ${PALETTE.uiBorder}`,
          display: "flex",
          gap: 0,
        }}
      >
        {/* Verb Panel */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 2,
            padding: 6,
            flex: "0 0 55%",
          }}
        >
          {VERBS.map(verb => (
            <button
              key={verb.id}
              onClick={() => setSelectedVerb(verb.id)}
              style={{
                background:
                  selectedVerb === verb.id
                    ? PALETTE.uiVerbActive
                    : PALETTE.uiVerb,
                color:
                  selectedVerb === verb.id ? "#000" : PALETTE.uiText,
                border: `1px solid ${PALETTE.uiBorder}`,
                borderRadius: 2,
                padding: "5px 4px",
                fontSize: 9,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.1s",
                textAlign: "center",
              }}
              onMouseEnter={e =>
                selectedVerb !== verb.id &&
                (e.target.style.background = PALETTE.uiVerbHover)
              }
              onMouseLeave={e =>
                selectedVerb !== verb.id &&
                (e.target.style.background = PALETTE.uiVerb)
              }
            >
              {verb.icon} {verb.label}
            </button>
          ))}
        </div>

        {/* Inventory */}
        <div
          style={{
            flex: 1,
            borderLeft: `2px solid ${PALETTE.uiBorder}`,
            padding: 6,
          }}
        >
          <div
            style={{
              color: "#8d6e63",
              fontSize: 8,
              marginBottom: 4,
              textAlign: "center",
            }}
          >
            인벤토리
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 3,
              minHeight: 60,
            }}
          >
            {inventory.map(item => (
              <div
                key={item.id}
                style={{
                  background: PALETTE.uiVerb,
                  border: `1px solid ${PALETTE.uiBorder}`,
                  borderRadius: 2,
                  padding: 4,
                  textAlign: "center",
                  cursor: "pointer",
                  fontSize: 9,
                  color: PALETTE.uiText,
                }}
                title={item.name}
              >
                <div style={{ fontSize: 16 }}>{item.icon}</div>
                <div style={{ fontSize: 7, marginTop: 2 }}>{item.name}</div>
              </div>
            ))}
            {inventory.length === 0 && (
              <div style={{ color: "#4a2800", fontSize: 8, gridColumn: "1/-1", textAlign: "center", paddingTop: 16 }}>
                (비어있음)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message Box */}
      <div
        style={{
          background: PALETTE.dialogBg,
          borderTop: `2px solid ${PALETTE.uiBorder}`,
          padding: "8px 14px",
          minHeight: 36,
          display: "flex",
          alignItems: "center",
        }}
      >
        <span style={{ color: PALETTE.msgText, fontSize: 10, lineHeight: 1.6 }}>
          {message}
        </span>
      </div>
    </div>
  );
}
