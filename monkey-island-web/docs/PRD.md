# PRD: Monkey Island Web Engine

> Version: 0.1.0 (Draft)
> Author: Moon
> Created: 2026-03-24
> Status: **In Progress**

---

## 1. Overview

### 1.1 프로젝트 요약

SCUMM 엔진의 핵심 메카닉을 웹 기술로 재현한 포인트 앤 클릭 어드벤처 게임 엔진.
*The Secret of Monkey Island* (1990)의 게임플레이 구조를 참고하되, 독자적인 스토리와 에셋으로 구성한다.

### 1.2 목표

| 목표 | 설명 |
|------|------|
| 기술 학습 | Canvas 렌더링, 게임 상태 머신, 스크립트 엔진 설계 |
| 에셋 파이프라인 | 로컬 GPU 서버에서 FLUX + PixelArt LoRA로 일관된 픽셀아트 에셋 생산 |
| 오픈소스 | 재사용 가능한 웹 어드벤처 엔진으로 공개 |
| 포트폴리오 | 풀스택 + AI 파이프라인 통합 역량 시연 |

### 1.3 Non-Goals

- 상업적 출시 (1차 목표 아님)
- 모바일 네이티브 앱
- 멀티플레이어
- 3D 렌더링

---

## 2. 시스템 아키텍처

### 2.1 전체 구조

```
┌─────────────────────────────────────────────────────┐
│                    Web Client                        │
│  ┌─────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Canvas   │  │ UI Layer │  │ Audio Manager     │  │
│  │ Renderer │  │ (React)  │  │ (Web Audio API)   │  │
│  └────┬─────┘  └────┬─────┘  └────────┬──────────┘  │
│       └──────────────┼────────────────┘              │
│              ┌───────┴───────┐                       │
│              │  Game Engine  │                       │
│              │  (State Core) │                       │
│              └───────┬───────┘                       │
│       ┌──────────────┼──────────────┐               │
│  ┌────┴────┐  ┌──────┴─────┐  ┌────┴──────┐        │
│  │ Scene   │  │ Script     │  │ Dialogue  │        │
│  │ Manager │  │ Runner     │  │ Engine    │        │
│  └─────────┘  └────────────┘  └───────────┘        │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│              Asset Pipeline (Local GPU)              │
│  ┌──────────┐  ┌───────────┐  ┌─────────────────┐  │
│  │ FLUX.1   │  │ PixelArt  │  │ Post-Processing │  │
│  │ -dev     │→ │ LoRA      │→ │ (palette, size) │  │
│  └──────────┘  └───────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 2.2 기술 스택

| 레이어 | 기술 | 비고 |
|--------|------|------|
| UI Framework | React 18 + TypeScript | |
| Build | Vite | HMR, fast build |
| Rendering | HTML5 Canvas 2D | `image-rendering: pixelated` |
| Audio | Web Audio API + Howler.js | BGM + SFX |
| State | Zustand | 가볍고 React 친화 |
| Data | JSON (rooms, dialogues, scripts) | 에디터 연동 용이 |
| Image Gen | FLUX.1-dev + PixelArt LoRA | ComfyUI 또는 diffusers |
| Post-process | Python (PIL/OpenCV) | 팔레트 제한, 리사이즈 |
| Deploy | GitHub Pages / Vercel | 정적 사이트 |

---

## 3. 핵심 모듈 설계

### 3.1 Game Engine Core

게임의 중앙 상태를 관리하는 싱글톤 모듈.

```typescript
interface GameState {
  currentRoom: string;
  playerPosition: { x: number; y: number };
  playerFacing: 'left' | 'right';
  inventory: Item[];
  flags: Record<string, boolean | number | string>;
  dialogueState: DialogueNode | null;
  selectedVerb: VerbType;
  cutsceneActive: boolean;
}
```

**상태 전이 규칙:**
- Idle → Moving (캔버스 클릭)
- Moving → Interacting (오브젝트 도달)
- Interacting → Dialogue / Cutscene / Idle
- Dialogue → Idle (대화 종료)

### 3.2 Scene Manager

Room 단위의 씬 관리.

```typescript
interface Room {
  id: string;
  name: string;
  background: string;           // 배경 이미지 경로
  walkArea: Polygon;             // 이동 가능 영역 (polygon)
  objects: SceneObject[];        // 인터랙션 가능 오브젝트
  exits: Exit[];                 // 다른 Room으로의 출구
  npcs: NPC[];                   // 비플레이어 캐릭터
  onEnter?: string;              // 진입 시 실행할 스크립트
  onExit?: string;               // 퇴장 시 실행할 스크립트
  ambientSound?: string;         // 배경 사운드
  lightingMask?: string;         // 조명 마스크 이미지 (야간 씬 등)
}
```

### 3.3 Verb System

SCUMM 동사 체계를 재현.

| 동사 | 키 | 설명 |
|------|----|------|
| 살펴보기 | look | 오브젝트 설명 표시 |
| 집기 | pick_up | 인벤토리에 추가 |
| 사용 | use | 오브젝트 사용 / 아이템 조합 |
| 열기 | open | 문, 상자 등 열기 |
| 닫기 | close | 열린 것 닫기 |
| 읽기 | read | 텍스트 읽기 |
| 말하기 | talk | NPC 대화 시작 |
| 밀기 | push | 밀기 |
| 당기기 | pull | 당기기 |
| 주기 | give | NPC에게 아이템 전달 |

**조합 로직:**
```
verb + object → action
verb + item + object → combined action
  예: use(열쇠, 문) → 문이 열린다
```

### 3.4 Dialogue Engine

트리 기반 대화 시스템.

```typescript
interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  choices?: DialogueChoice[];
  next?: string;                  // 자동 진행
  condition?: string;             // 표시 조건 (flag 기반)
  onEnter?: string;               // 진입 시 스크립트
}

interface DialogueChoice {
  text: string;                   // 선택지 텍스트
  next: string;                   // 다음 노드 ID
  condition?: string;             // 표시 조건
  once?: boolean;                 // 한 번만 선택 가능
}
```

### 3.5 Script Runner

게임 이벤트를 JSON 기반 스크립트로 제어.

```typescript
type ScriptCommand =
  | { cmd: 'say'; speaker: string; text: string }
  | { cmd: 'walk'; target: string; x: number; y: number }
  | { cmd: 'anim'; target: string; anim: string }
  | { cmd: 'set_flag'; key: string; value: any }
  | { cmd: 'if'; condition: string; then: ScriptCommand[]; else?: ScriptCommand[] }
  | { cmd: 'add_item'; item: string }
  | { cmd: 'remove_item'; item: string }
  | { cmd: 'change_room'; room: string; entry: string }
  | { cmd: 'play_sound'; sound: string }
  | { cmd: 'cutscene'; commands: ScriptCommand[] }
  | { cmd: 'wait'; ms: number }
  | { cmd: 'camera_pan'; x: number; y: number; duration: number };
```

### 3.6 Pathfinding

Walkbox 기반 캐릭터 이동.

**알고리즘:**
1. Walkbox를 polygon mesh로 정의
2. Navigation mesh를 삼각분할 (Delaunay 또는 수동)
3. A* 경로 탐색
4. 경로 스무딩 (funnel algorithm)

**간소화 버전 (Phase 1):**
- 직사각형 walkbox
- 직선 이동 + 클램핑

---

## 4. 에셋 파이프라인

### 4.1 이미지 생성 구성

```
Local GPU Server (ckmoon@ubuntu)
├── ComfyUI / diffusers
├── FLUX.1-dev (base model)
├── PixelArt LoRA (nerijs/pixel-art-xl 또는 유사)
└── Post-processing scripts
```

### 4.2 에셋 카테고리

| 카테고리 | 해상도 (원본) | 표시 해상도 | 팔레트 | 파일 형식 |
|----------|--------------|------------|--------|----------|
| 배경 | 320×200 | 640×400 (2x) | 32색 | PNG |
| 캐릭터 스프라이트 | 32×48/frame | 64×96 (2x) | 16색 | PNG spritesheet |
| 오브젝트 | 32×32 | 64×64 (2x) | 16색 | PNG |
| 인벤토리 아이콘 | 24×24 | 48×48 (2x) | 16색 | PNG |
| 대화 초상화 | 64×64 | 128×128 (2x) | 16색 | PNG |

### 4.3 프롬프트 체계

각 에셋 타입별 프롬프트 템플릿을 표준화:

```yaml
# asset-prompts.yaml
background:
  positive: "pixel art game background, {description}, point and click adventure,
             lucasarts style, 320x200, 16-bit era, detailed, atmospheric lighting,
             no characters, consistent palette"
  negative: "3d, realistic, photo, blurry, modern, UI elements, text overlay"

character:
  positive: "pixel art character sprite sheet, {description}, side view,
             4-direction walk cycle, transparent background, 32x48, clean edges"
  negative: "3d, realistic, blurry, background, multiple characters"
```

### 4.4 후처리 파이프라인

```python
# tools/asset-pipeline/process.py
def process_asset(input_path, asset_type, config):
    """
    1. Resize to target resolution (nearest neighbor)
    2. Quantize palette (median cut)
    3. Apply consistent palette mapping
    4. 2x upscale for web display (nearest neighbor)
    5. Export PNG with transparency (sprites)
    """
```

### 4.5 일관성 유지 전략

- **공유 팔레트 파일** (.pal): 전체 게임에서 동일 팔레트 사용
- **스타일 시드**: 특정 seed 범위를 캐릭터/배경별로 고정
- **레퍼런스 이미지**: img2img 모드로 기존 에셋과 스타일 일관성 유지
- **배치 스크립트**: 동일 Room의 에셋을 한 번에 생성

---

## 5. 데이터 스키마

### 5.1 Room 정의 (JSON)

```json
{
  "id": "harbor",
  "name": "멜레 항구",
  "background": "assets/bg/harbor.png",
  "walkArea": {
    "polygons": [[50,290], [750,290], [750,380], [50,380]]
  },
  "objects": [
    {
      "id": "sign",
      "name": "항구 간판",
      "sprite": "assets/obj/sign.png",
      "position": [160, 240],
      "hotspot": [0, 0, 50, 20],
      "zIndex": 5,
      "actions": {
        "look": { "type": "message", "text": "낡은 항구 간판이다." },
        "read": { "type": "script", "ref": "harbor/sign_read" },
        "pick_up": { "type": "message", "text": "너무 무겁다." }
      }
    }
  ],
  "exits": [
    {
      "id": "to_tavern",
      "target": "tavern",
      "region": [0, 280, 30, 100],
      "walkTo": [30, 340],
      "entryPoint": { "x": 720, "y": 340 }
    }
  ],
  "npcs": [],
  "scripts": {
    "onEnter": "harbor/enter",
    "onFirstEnter": "harbor/first_enter"
  },
  "audio": {
    "ambient": "assets/audio/harbor_waves.ogg",
    "music": "assets/audio/harbor_theme.ogg"
  }
}
```

### 5.2 Dialogue 정의 (JSON)

```json
{
  "id": "pirate_leader_intro",
  "nodes": {
    "start": {
      "speaker": "해적 우두머리",
      "text": "그래, 네가 해적이 되고 싶다는 꼬맹이로구나?",
      "choices": [
        { "text": "네, 저는 가이브러시 쓰리프우드입니다!", "next": "intro_yes" },
        { "text": "누가 꼬맹이래요?", "next": "intro_angry" },
        { "text": "(아무 말 없이 돌아선다)", "next": "intro_leave" }
      ]
    },
    "intro_yes": {
      "speaker": "해적 우두머리",
      "text": "좋아, 세 가지 시험을 통과하면 진정한 해적으로 인정하마.",
      "next": "explain_trials"
    }
  }
}
```

---

## 6. 개발 로드맵

### Phase 1: Core Engine (2주)

- [x] Canvas 배경 렌더링 (placeholder)
- [x] 캐릭터 이동 (직사각형 walkbox)
- [x] 동사 패널 UI
- [x] 오브젝트 인터랙션 (verb + object)
- [x] 인벤토리 기본 기능
- [x] Room 전환
- [ ] TypeScript 마이그레이션
- [ ] Vite 프로젝트 셋업
- [ ] Zustand 상태 관리 도입

### Phase 2: Content System (2주)

- [ ] JSON 기반 Room 로더
- [ ] 대화 트리 엔진
- [ ] 스크립트 러너 (커맨드 순차 실행)
- [ ] NPC 배치 및 idle 애니메이션
- [ ] 아이템 조합 시스템 (use item on object)
- [ ] 게임 상태 저장/로드 (localStorage)

### Phase 3: Asset Pipeline (2주)

- [ ] FLUX + LoRA 환경 셋업 (ComfyUI / diffusers)
- [ ] 프롬프트 템플릿 정의
- [ ] 배경 5장 생성 (항구, 선술집, 숲, 해변, 동굴)
- [ ] 캐릭터 스프라이트 시트 생성
- [ ] 후처리 스크립트 (팔레트 통일, 리사이즈)
- [ ] 에셋 교체 (placeholder → 실제 에셋)

### Phase 4: Audio & Polish (1주)

- [ ] BGM 시스템 (Room별 음악)
- [ ] SFX (발걸음, 문 열기, 아이템 획득)
- [ ] 컷씬 시스템
- [ ] 화면 전환 효과 (fade, wipe)
- [ ] 조명 효과 (야간 씬, 횃불)

### Phase 5: Content & Release (2주)

- [ ] 스토리 작성 (3 Act 구조)
- [ ] 퍼즐 설계 (5개 이상)
- [ ] 플레이테스트 및 밸런싱
- [ ] GitHub Pages 배포
- [ ] README + 데모 영상

---

## 7. 퍼즐 설계 가이드라인

SCUMM 스타일 퍼즐의 핵심 원칙:

1. **논리적 연결**: 플레이어가 "아하!" 하고 깨달을 수 있는 퍼즐
2. **다단계 체이닝**: A를 얻으려면 B가 필요하고, B를 얻으려면 C가 필요
3. **유머**: 해결 방법이 웃기거나 예상 밖이면 좋음
4. **Dead-end 없음**: 절대 진행 불가 상태가 되면 안 됨
5. **환경 단서**: 대화와 환경에서 힌트 제공

**퍼즐 예시 구조:**
```
[목표] 해적선에 탑승해야 한다
  └─ [필요] 해적 의상이 필요하다
       ├─ [모자] 선술집의 해적에게 그로그를 먹여 취하게 만든다
       ├─ [코트] 빨래줄에 걸린 코트를 가져온다 → 주인이 보고 있다 → 뭔가로 주의를 끌어야
       └─ [부츠] 상점에서 구입 → 돈이 없다 → 일을 해서 벌어야
```

---

## 8. 파일 구조 (목표)

```
monkey-island-web/
├── README.md
├── docs/
│   └── PRD.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── public/
│   └── favicon.ico
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── engine/
│   │   ├── GameEngine.ts          # 중앙 상태 + 게임 루프
│   │   ├── SceneManager.ts        # Room 로딩/전환
│   │   ├── CanvasRenderer.ts      # 배경 + 스프라이트 렌더링
│   │   ├── VerbSystem.ts          # 동사 + 오브젝트 조합 처리
│   │   ├── DialogueEngine.ts      # 대화 트리 실행
│   │   ├── ScriptRunner.ts        # JSON 스크립트 인터프리터
│   │   ├── Inventory.ts           # 인벤토리 관리
│   │   ├── Pathfinding.ts         # Walkbox + 경로 탐색
│   │   ├── AudioManager.ts        # BGM + SFX
│   │   ├── SaveManager.ts         # 저장/로드
│   │   └── types.ts               # 공유 타입 정의
│   ├── components/
│   │   ├── GameCanvas.tsx          # Canvas 컴포넌트
│   │   ├── VerbPanel.tsx           # 동사 선택 UI
│   │   ├── InventoryBar.tsx        # 인벤토리 표시
│   │   ├── DialogueBox.tsx         # 대화 UI
│   │   ├── MessageBar.tsx          # 하단 메시지
│   │   └── TitleScreen.tsx         # 타이틀 화면
│   ├── data/
│   │   ├── rooms/
│   │   │   ├── harbor.json
│   │   │   └── tavern.json
│   │   ├── dialogues/
│   │   │   └── pirate_leader.json
│   │   ├── scripts/
│   │   │   └── harbor/
│   │   │       └── sign_read.json
│   │   └── items.json
│   ├── assets/
│   │   ├── backgrounds/
│   │   ├── sprites/
│   │   ├── objects/
│   │   ├── portraits/
│   │   ├── ui/
│   │   └── audio/
│   └── utils/
│       ├── canvas.ts
│       └── helpers.ts
├── tools/
│   └── asset-pipeline/
│       ├── generate.py             # FLUX 이미지 생성
│       ├── process.py              # 후처리 (팔레트, 리사이즈)
│       ├── spritesheet.py          # 스프라이트 시트 패킹
│       ├── prompts.yaml            # 프롬프트 템플릿
│       └── palette.pal             # 공유 팔레트
└── .github/
    └── workflows/
        └── deploy.yml              # GitHub Pages 배포
```

---

## 9. 성공 기준

| 기준 | 측정 |
|------|------|
| 엔진 완성도 | 5개 Room, 3개 NPC, 5개 퍼즐 플레이 가능 |
| 에셋 품질 | FLUX 생성 픽셀아트가 일관된 스타일 유지 |
| 성능 | 60fps 유지 (Canvas 렌더링) |
| 접근성 | 키보드 조작 지원 |
| 코드 품질 | TypeScript strict, 모듈 분리 |
| 배포 | GitHub Pages에서 즉시 플레이 가능 |

---

## 10. 리스크 및 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| FLUX 에셋 스타일 불일치 | 게임 전체 비주얼 통일감 저하 | 공유 팔레트 + img2img 레퍼런스 활용 |
| 복잡한 퍼즐 로직 | 개발 지연 | Phase별 점진적 복잡도 증가 |
| Canvas 성능 | 저사양에서 프레임 드랍 | 오프스크린 캔버스 + dirty rect 렌더링 |
| 사운드 에셋 | 저작권 문제 | CC0/CC-BY 사운드 라이브러리 활용 |

---

## Appendix A: 참고 자료

- [ScummVM](https://www.scummvm.org/) — 원본 SCUMM 엔진 역공학 프로젝트
- [SCUMM Technical Reference](https://wiki.scummvm.org/index.php?title=SCUMM/Technical_Reference) — 엔진 내부 문서
- [Phaser.js](https://phaser.io/) — 대안 2D 게임 엔진
- [nerijs/pixel-art-xl](https://huggingface.co/nerijs/pixel-art-xl) — PixelArt LoRA
