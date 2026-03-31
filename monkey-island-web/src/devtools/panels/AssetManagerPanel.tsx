import { useState, useEffect, useRef, useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────

interface CharacterVariants {
  portraits: string[];
  sprites: string[];
}

interface AssetFile {
  name: string;
  size: number;
  mtime: number;
  path: string;
}

interface JobStatus {
  status: 'running' | 'done' | 'failed';
  output: string[];
  error?: string;
}

// ── Constants ─────────────────────────────────────────────────

const API = 'http://localhost:7788';

const CHARACTERS: Record<string, CharacterVariants> = {
  guybrush: {
    portraits: ['neutral', 'surprised', 'determined', 'happy', 'worried'],
    sprites: ['idle', 'idle2', 'walk1', 'walk2', 'walk3', 'walk4', 'talk1', 'talk2', 'pickup'],
  },
  lechuck: {
    portraits: ['angry', 'sinister', 'scheming'],
    sprites: ['idle', 'idle2', 'walk1', 'walk2', 'talk1', 'talk2'],
  },
  elaine: {
    portraits: ['confident', 'concerned', 'amused'],
    sprites: ['idle', 'idle2', 'walk1', 'walk2', 'walk3', 'talk1', 'talk2'],
  },
  voodoo_lady: {
    portraits: ['mysterious', 'serious'],
    sprites: ['idle'],
  },
  bartender: {
    portraits: ['suspicious', 'gruff'],
    sprites: ['idle'],
  },
};

const SPRITE_GROUPS: Record<string, string[]> = {
  Idle: ['idle', 'idle2'],
  Walk: ['walk1', 'walk2', 'walk3', 'walk4'],
  Talk: ['talk1', 'talk2'],
  Action: ['pickup'],
};

// Animation frame durations in ms
const ANIM_FRAMES: Record<string, string[]> = {
  idle: ['idle', 'idle2'],
  walk: ['walk1', 'walk2', 'walk3', 'walk4'],
  talk: ['talk1', 'talk2'],
  pickup: ['pickup'],
};
const FRAME_DURATION = 180;

// ── Styles ────────────────────────────────────────────────────

const S = {
  container: {
    display: 'flex',
    height: '100%',
    minHeight: 0,
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#ccc',
    background: '#0d0d1a',
    gap: 0,
  } as React.CSSProperties,

  sidebar: {
    width: 200,
    flexShrink: 0,
    background: '#1a1a2e',
    borderRight: '1px solid #2a2a4a',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'auto',
  },

  sidebarHeader: {
    padding: '10px 12px',
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    borderBottom: '1px solid #2a2a4a',
  },

  charCard: (active: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    cursor: 'pointer',
    background: active ? '#2a2a4a' : 'transparent',
    borderLeft: active ? '3px solid #6060ff' : '3px solid transparent',
    borderBottom: '1px solid #2a2a4a',
    transition: 'background 0.15s',
  } as React.CSSProperties),

  charThumb: {
    width: 40,
    height: 40,
    imageRendering: 'pixelated' as const,
    background: '#0d0d1a',
    border: '1px solid #2a2a4a',
    borderRadius: 2,
    objectFit: 'contain' as const,
  },

  charName: {
    fontSize: 12,
    color: '#ddd',
    textTransform: 'capitalize' as const,
  },

  viewer: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },

  subTabs: {
    display: 'flex',
    gap: 0,
    borderBottom: '1px solid #2a2a4a',
    background: '#12121f',
    flexShrink: 0,
  },

  subTab: (active: boolean) => ({
    padding: '8px 18px',
    cursor: 'pointer',
    fontSize: 12,
    color: active ? '#fff' : '#666',
    background: active ? '#1a1a2e' : 'transparent',
    borderBottom: active ? '2px solid #6060ff' : '2px solid transparent',
    fontFamily: 'monospace',
  } as React.CSSProperties),

  viewerBody: {
    flex: 1,
    overflow: 'auto',
    padding: 16,
  },

  sectionLabel: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 16,
  },

  baseSection: {
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start',
    marginBottom: 20,
  },

  baseImg: {
    width: 128,
    height: 128,
    imageRendering: 'pixelated' as const,
    background: '#0d0d1a',
    border: '1px solid #2a2a4a',
    borderRadius: 4,
    objectFit: 'contain' as const,
    flexShrink: 0,
  },

  baseMeta: {
    fontSize: 11,
    color: '#888',
    lineHeight: 1.6,
  },

  variantGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 10,
  },

  variantCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 4,
    padding: 8,
    background: '#1a1a2e',
    border: '1px solid #2a2a4a',
    borderRadius: 4,
    cursor: 'default',
    position: 'relative' as const,
  },

  variantImg: {
    width: 64,
    height: 64,
    imageRendering: 'pixelated' as const,
    background: '#0d0d1a',
    objectFit: 'contain' as const,
    display: 'block',
  },

  variantLabel: {
    fontSize: 10,
    color: '#aaa',
    textAlign: 'center' as const,
    maxWidth: 80,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },

  filmstrip: {
    display: 'flex',
    gap: 8,
    overflowX: 'auto' as const,
    padding: '4px 0',
    alignItems: 'flex-end',
  },

  spriteCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },

  spriteImg: {
    width: 32,
    height: 48,
    imageRendering: 'pixelated' as const,
    background: '#0d0d1a',
    border: '1px solid #2a2a4a',
    objectFit: 'contain' as const,
    display: 'block',
  },

  spriteLabel: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center' as const,
  },

  groupLabel: {
    fontSize: 11,
    color: '#6060ff',
    marginBottom: 6,
    marginTop: 8,
  },

  animCanvas: {
    display: 'block',
    imageRendering: 'pixelated' as const,
    border: '1px solid #2a2a4a',
    background: '#0d0d1a',
  },

  animControls: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
    padding: '12px 0',
  },

  controlRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },

  controlLabel: {
    fontSize: 11,
    color: '#888',
    width: 60,
  },

  btnGroup: {
    display: 'flex',
    gap: 4,
  },

  btn: (active: boolean) => ({
    padding: '4px 10px',
    fontSize: 11,
    fontFamily: 'monospace',
    background: active ? '#6060ff' : '#2a2a4a',
    color: active ? '#fff' : '#aaa',
    border: '1px solid #3a3a5a',
    borderRadius: 3,
    cursor: 'pointer',
  } as React.CSSProperties),

  genPanel: {
    width: 280,
    flexShrink: 0,
    background: '#1a1a2e',
    borderLeft: '1px solid #2a2a4a',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },

  genHeader: {
    padding: '10px 12px',
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    borderBottom: '1px solid #2a2a4a',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },

  statusDot: (online: boolean) => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: online ? '#00ff88' : '#ff4444',
    flexShrink: 0,
  } as React.CSSProperties),

  genBody: {
    flex: 1,
    overflow: 'auto',
    padding: 12,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  },

  offlineNotice: {
    background: '#1a1010',
    border: '1px solid #442222',
    borderRadius: 4,
    padding: 10,
    fontSize: 11,
    color: '#ff8888',
    lineHeight: 1.6,
  },

  offlineCmd: {
    marginTop: 8,
    background: '#000',
    color: '#00ff88',
    padding: '6px 8px',
    borderRadius: 3,
    fontSize: 10,
    fontFamily: 'monospace',
    wordBreak: 'break-all' as const,
  },

  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },

  formLabel: {
    fontSize: 11,
    color: '#888',
  },

  select: {
    background: '#0d0d1a',
    color: '#ddd',
    border: '1px solid #3a3a5a',
    borderRadius: 3,
    padding: '5px 8px',
    fontSize: 11,
    fontFamily: 'monospace',
  },

  sliderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },

  slider: {
    flex: 1,
    accentColor: '#6060ff',
  },

  sliderVal: {
    fontSize: 11,
    color: '#aaa',
    width: 30,
    textAlign: 'right' as const,
  },

  checkRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 11,
    color: '#aaa',
    cursor: 'pointer',
  },

  generateBtn: (disabled: boolean) => ({
    padding: '8px 12px',
    background: disabled ? '#2a2a4a' : '#4040cc',
    color: disabled ? '#666' : '#fff',
    border: '1px solid #6060ff',
    borderRadius: 4,
    fontSize: 12,
    fontFamily: 'monospace',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 600,
    letterSpacing: 1,
  } as React.CSSProperties),

  logArea: {
    flex: 1,
    background: '#000',
    border: '1px solid #2a2a4a',
    borderRadius: 3,
    padding: 8,
    overflow: 'auto',
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#00ff88',
    lineHeight: 1.5,
    minHeight: 120,
    maxHeight: 300,
  },

  logLine: {
    margin: 0,
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-all' as const,
  },
};

// ── Helpers ───────────────────────────────────────────────────

function portraitSrc(char: string, variant: string): string {
  return `/assets/portraits/${char}_${variant}.png`;
}

function spriteSrc(char: string, variant: string): string {
  return `/assets/sprites/${char}_${variant}.png`;
}

function baseSrc(char: string, type: 'portrait' | 'sprite'): string {
  return `${API}/bases/${type}/${char}_base.png`;
}

// ── Sub-panel: Portraits ──────────────────────────────────────

function PortraitsTab({ character }: { character: string }) {
  const variants = CHARACTERS[character]?.portraits ?? [];
  const firstVariant = variants[0] ?? 'neutral';

  return (
    <div>
      <div style={S.sectionLabel}>Base Image</div>
      <div style={S.baseSection}>
        <img
          src={baseSrc(character, 'portrait')}
          alt={`${character} base`}
          style={S.baseImg}
          onError={(e) => {
            const el = e.target as HTMLImageElement;
            el.src = portraitSrc(character, firstVariant);
          }}
        />
        <div style={S.baseMeta}>
          <div>Character: {character}</div>
          <div>Type: portrait base</div>
          <div>Target: 64×64px</div>
          <div>Variants: {variants.length}</div>
        </div>
      </div>

      <div style={S.sectionLabel}>Expression Variants</div>
      <div style={S.variantGrid}>
        {variants.map((v) => (
          <div key={v} style={S.variantCard} title={v}>
            <img
              src={portraitSrc(character, v)}
              alt={v}
              style={S.variantImg}
              onError={(e) => {
                const el = e.target as HTMLImageElement;
                el.style.opacity = '0.3';
              }}
            />
            <div style={S.variantLabel}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sub-panel: Sprites ────────────────────────────────────────

function SpritesTab({ character }: { character: string }) {
  const allSprites = CHARACTERS[character]?.sprites ?? [];

  return (
    <div>
      <div style={S.sectionLabel}>Base Image</div>
      <div style={S.baseSection}>
        <img
          src={baseSrc(character, 'sprite')}
          alt={`${character} sprite base`}
          style={{ ...S.baseImg, width: 64, height: 96 }}
          onError={(e) => {
            const el = e.target as HTMLImageElement;
            el.src = spriteSrc(character, 'idle');
          }}
        />
        <div style={S.baseMeta}>
          <div>Character: {character}</div>
          <div>Type: sprite base</div>
          <div>Target: 32×48px</div>
          <div>Frames: {allSprites.length}</div>
        </div>
      </div>

      {Object.entries(SPRITE_GROUPS).map(([groupName, groupFrames]) => {
        const frames = groupFrames.filter((f) => allSprites.includes(f));
        if (frames.length === 0) return null;
        return (
          <div key={groupName}>
            <div style={S.groupLabel}>{groupName} ({frames.length})</div>
            <div style={S.filmstrip}>
              {frames.map((frame) => (
                <div key={frame} style={S.spriteCard}>
                  <img
                    src={spriteSrc(character, frame)}
                    alt={frame}
                    style={S.spriteImg}
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      el.style.opacity = '0.3';
                    }}
                  />
                  <div style={S.spriteLabel}>{frame}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Sub-panel: Animation ──────────────────────────────────────

function AnimationTab({ character }: { character: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animState, setAnimState] = useState<'idle' | 'walk' | 'talk' | 'pickup'>('idle');
  const [speed, setSpeed] = useState(1);
  const [facingLeft, setFacingLeft] = useState(false);
  const rafRef = useRef<number>(0);
  const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map());

  const CANVAS_W = 200;
  const CANVAS_H = 300;
  const DISPLAY_W = 96;
  const DISPLAY_H = 144;

  const loadImages = useCallback((char: string, frames: string[]) => {
    frames.forEach((frame) => {
      const key = `${char}_${frame}`;
      if (imagesRef.current.has(key)) return;
      const img = new Image();
      img.src = spriteSrc(char, frame);
      imagesRef.current.set(key, img);
    });
  }, []);

  useEffect(() => {
    const allFrames = Object.values(ANIM_FRAMES).flat();
    loadImages(character, allFrames);
  }, [character, loadImages]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const draw = () => {
      if (!running) return;
      const frames = ANIM_FRAMES[animState] ?? ANIM_FRAMES.idle;
      const frameIndex = Math.floor((performance.now() * speed) / FRAME_DURATION) % frames.length;
      const frameKey = `${character}_${frames[frameIndex]}`;
      const img = imagesRef.current.get(frameKey);

      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = '#0d0d1a';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      if (img && img.complete && img.naturalWidth > 0) {
        const dx = (CANVAS_W - DISPLAY_W) / 2;
        const dy = (CANVAS_H - DISPLAY_H) / 2;

        if (facingLeft) {
          ctx.save();
          ctx.translate(CANVAS_W, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(img, CANVAS_W - dx - DISPLAY_W, dy, DISPLAY_W, DISPLAY_H);
          ctx.restore();
        } else {
          ctx.drawImage(img, dx, dy, DISPLAY_W, DISPLAY_H);
        }
      } else {
        // Placeholder while loading
        ctx.fillStyle = '#2a2a4a';
        ctx.fillRect(
          (CANVAS_W - DISPLAY_W) / 2,
          (CANVAS_H - DISPLAY_H) / 2,
          DISPLAY_W,
          DISPLAY_H,
        );
        ctx.fillStyle = '#666';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('loading...', CANVAS_W / 2, CANVAS_H / 2);
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [character, animState, speed, facingLeft]);

  const availableStates = Object.keys(ANIM_FRAMES).filter((s) => {
    const frames = ANIM_FRAMES[s];
    const charSprites = CHARACTERS[character]?.sprites ?? [];
    return frames.some((f) => charSprites.includes(f));
  });

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={S.animCanvas}
      />
      <div style={S.animControls}>
        <div style={S.controlRow}>
          <div style={S.controlLabel}>State</div>
          <div style={S.btnGroup}>
            {availableStates.map((s) => (
              <button
                key={s}
                style={S.btn(animState === s)}
                onClick={() => setAnimState(s as typeof animState)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div style={S.controlRow}>
          <div style={S.controlLabel}>Speed</div>
          <div style={S.btnGroup}>
            {[0.5, 1, 2].map((v) => (
              <button
                key={v}
                style={S.btn(speed === v)}
                onClick={() => setSpeed(v)}
              >
                {v}x
              </button>
            ))}
          </div>
        </div>
        <div style={S.controlRow}>
          <div style={S.controlLabel}>Facing</div>
          <div style={S.btnGroup}>
            <button style={S.btn(!facingLeft)} onClick={() => setFacingLeft(false)}>right</button>
            <button style={S.btn(facingLeft)} onClick={() => setFacingLeft(true)}>left</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Generation Panel ─────────────────────────────────────────

function GenerationPanel({
  serverOnline,
  activeChar,
}: {
  serverOnline: boolean;
  activeChar: string;
}) {
  const [character, setCharacter] = useState('all');
  const [mode, setMode] = useState('all');
  const [strengthPortrait, setStrengthPortrait] = useState(0.5);
  const [strengthSprite, setStrengthSprite] = useState(0.65);
  const [regenerateBase, setRegenerateBase] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [generating, setGenerating] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // Sync character selector with sidebar
  useEffect(() => {
    if (activeChar) setCharacter(activeChar);
  }, [activeChar]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback((id: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API}/api/jobs/${id}`);
        if (!res.ok) return;
        const data: JobStatus = await res.json();
        setJobStatus(data);
        if (data.status !== 'running') {
          stopPolling();
          setGenerating(false);
        }
        // Auto-scroll log
        if (logRef.current) {
          logRef.current.scrollTop = logRef.current.scrollHeight;
        }
      } catch {
        // ignore poll errors
      }
    }, 1000);
  }, [stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const handleGenerate = async () => {
    if (!serverOnline || generating) return;
    setGenerating(true);
    setJobStatus({ status: 'running', output: ['Starting generation...'] });
    try {
      const res = await fetch(`${API}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: character === 'all' ? undefined : character,
          mode,
          strength_portrait: strengthPortrait,
          strength_sprite: strengthSprite,
          regenerate_base: regenerateBase,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        setJobStatus({ status: 'failed', output: [], error: err });
        setGenerating(false);
        return;
      }
      const { job_id } = await res.json();
      setJobId(job_id);
      startPolling(job_id);
    } catch (e) {
      setJobStatus({ status: 'failed', output: [], error: String(e) });
      setGenerating(false);
    }
  };

  const logLines = jobStatus?.output ?? [];

  return (
    <>
      <div style={S.genHeader}>
        <div style={S.statusDot(serverOnline)} />
        <span>{serverOnline ? 'Server Online' : 'Server Offline'}</span>
      </div>
      <div style={S.genBody}>
        {!serverOnline && (
          <div style={S.offlineNotice}>
            Asset server not running. Start it with:
            <div style={S.offlineCmd}>
              cd tools/asset-pipeline && .venv/bin/python server.py
            </div>
          </div>
        )}

        <div style={S.formGroup}>
          <div style={S.formLabel}>Character</div>
          <select
            style={S.select}
            value={character}
            onChange={(e) => setCharacter(e.target.value)}
            disabled={!serverOnline}
          >
            <option value="all">All Characters</option>
            {Object.keys(CHARACTERS).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div style={S.formGroup}>
          <div style={S.formLabel}>Mode</div>
          <select
            style={S.select}
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            disabled={!serverOnline}
          >
            <option value="all">All (Portraits + Sprites)</option>
            <option value="portraits">Portraits Only</option>
            <option value="sprites">Sprites Only</option>
          </select>
        </div>

        <div style={S.formGroup}>
          <div style={S.formLabel}>Portrait Strength ({strengthPortrait.toFixed(2)})</div>
          <div style={S.sliderRow}>
            <input
              type="range"
              min={0.3}
              max={0.9}
              step={0.05}
              value={strengthPortrait}
              onChange={(e) => setStrengthPortrait(parseFloat(e.target.value))}
              style={S.slider}
              disabled={!serverOnline}
            />
            <span style={S.sliderVal}>{strengthPortrait.toFixed(2)}</span>
          </div>
        </div>

        <div style={S.formGroup}>
          <div style={S.formLabel}>Sprite Strength ({strengthSprite.toFixed(2)})</div>
          <div style={S.sliderRow}>
            <input
              type="range"
              min={0.3}
              max={0.9}
              step={0.05}
              value={strengthSprite}
              onChange={(e) => setStrengthSprite(parseFloat(e.target.value))}
              style={S.slider}
              disabled={!serverOnline}
            />
            <span style={S.sliderVal}>{strengthSprite.toFixed(2)}</span>
          </div>
        </div>

        <label style={S.checkRow}>
          <input
            type="checkbox"
            checked={regenerateBase}
            onChange={(e) => setRegenerateBase(e.target.checked)}
            disabled={!serverOnline}
          />
          Regenerate base images
        </label>

        <button
          style={S.generateBtn(!serverOnline || generating)}
          onClick={handleGenerate}
          disabled={!serverOnline || generating}
        >
          {generating ? 'GENERATING...' : 'GENERATE'}
        </button>

        {jobStatus && (
          <div>
            <div style={{ ...S.formLabel, marginBottom: 4 }}>
              Output {jobId ? `[${jobId.slice(0, 8)}]` : ''} — {jobStatus.status}
            </div>
            <div style={S.logArea} ref={logRef}>
              {logLines.map((line, i) => (
                <p key={i} style={S.logLine}>{line}</p>
              ))}
              {jobStatus.error && (
                <p style={{ ...S.logLine, color: '#ff6666' }}>{jobStatus.error}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Main Panel ────────────────────────────────────────────────

export default function AssetManagerPanel() {
  const [activeChar, setActiveChar] = useState('guybrush');
  const [subTab, setSubTab] = useState<'portraits' | 'sprites' | 'animation'>('portraits');
  const [serverOnline, setServerOnline] = useState(false);

  // Poll server status
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(`${API}/api/characters`, { signal: AbortSignal.timeout(2000) });
        if (!cancelled) setServerOnline(res.ok);
      } catch {
        if (!cancelled) setServerOnline(false);
      }
    };
    check();
    const interval = setInterval(check, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const SUB_TABS: { id: typeof subTab; label: string }[] = [
    { id: 'portraits', label: 'Portraits' },
    { id: 'sprites', label: 'Sprites' },
    { id: 'animation', label: 'Animation' },
  ];

  return (
    <div style={S.container}>
      {/* Character Sidebar */}
      <div style={S.sidebar}>
        <div style={S.sidebarHeader}>Characters</div>
        {Object.keys(CHARACTERS).map((char) => {
          const firstPortrait = CHARACTERS[char].portraits[0] ?? 'neutral';
          return (
            <div
              key={char}
              style={S.charCard(activeChar === char)}
              onClick={() => setActiveChar(char)}
            >
              <img
                src={portraitSrc(char, firstPortrait)}
                alt={char}
                style={S.charThumb}
                onError={(e) => {
                  const el = e.target as HTMLImageElement;
                  el.style.opacity = '0.3';
                }}
              />
              <span style={S.charName}>{char.replace('_', ' ')}</span>
            </div>
          );
        })}
      </div>

      {/* Main Viewer */}
      <div style={S.viewer}>
        <div style={S.subTabs}>
          {SUB_TABS.map((t) => (
            <button
              key={t.id}
              style={S.subTab(subTab === t.id)}
              onClick={() => setSubTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div style={S.viewerBody}>
          {subTab === 'portraits' && <PortraitsTab character={activeChar} />}
          {subTab === 'sprites' && <SpritesTab character={activeChar} />}
          {subTab === 'animation' && <AnimationTab character={activeChar} />}
        </div>
      </div>

      {/* Generation Panel */}
      <div style={S.genPanel}>
        <GenerationPanel serverOnline={serverOnline} activeChar={activeChar} />
      </div>
    </div>
  );
}
