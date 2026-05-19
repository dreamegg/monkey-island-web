import { useState, useEffect, useRef, useCallback } from 'react';

const API = 'http://localhost:7788';

// ── Types ──────────────────────────────────────────────────────

interface RoomEntry { id: string; name: string; }
interface JobStatus { status: 'running' | 'done' | 'failed'; output: string[]; error?: string; }

// ── Styles ─────────────────────────────────────────────────────

const S = {
  wrap: { display: 'flex', height: '100%', minHeight: 0, fontFamily: 'monospace', fontSize: 12, color: '#ccc', background: '#0d0d1a' } as React.CSSProperties,
  settings: { width: 260, flexShrink: 0, background: '#1a1a2e', borderRight: '1px solid #2a2a4a', display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' },
  settingsHdr: { padding: '10px 12px', fontSize: 11, color: '#888', textTransform: 'uppercase' as const, letterSpacing: 1, borderBottom: '1px solid #2a2a4a', display: 'flex', alignItems: 'center', gap: 8 },
  settingsBody: { flex: 1, overflow: 'auto', padding: 12, display: 'flex', flexDirection: 'column' as const, gap: 10 },
  center: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' },
  preview: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080810', overflow: 'hidden', position: 'relative' as const },
  actions: { padding: '10px 16px', borderTop: '1px solid #2a2a4a', display: 'flex', gap: 8, alignItems: 'center', background: '#12121f' },
  log: { width: 260, flexShrink: 0, borderLeft: '1px solid #2a2a4a', display: 'flex', flexDirection: 'column' as const, background: '#0d0d1a' },
  logHdr: { padding: '10px 12px', fontSize: 11, color: '#888', textTransform: 'uppercase' as const, letterSpacing: 1, borderBottom: '1px solid #2a2a4a', display: 'flex', gap: 8, alignItems: 'center' },
  logBody: { flex: 1, overflow: 'auto', padding: 8, fontSize: 10, color: '#00ff88', lineHeight: 1.5, fontFamily: 'monospace' } as React.CSSProperties,
  logLine: { margin: 0, whiteSpace: 'pre-wrap' as const, wordBreak: 'break-all' as const },
  label: { fontSize: 11, color: '#888', marginBottom: 3 },
  input: { width: '100%', background: '#0d0d1a', color: '#ddd', border: '1px solid #3a3a5a', borderRadius: 3, padding: '5px 8px', fontSize: 11, fontFamily: 'monospace', boxSizing: 'border-box' as const } as React.CSSProperties,
  textarea: { width: '100%', background: '#0d0d1a', color: '#ddd', border: '1px solid #3a3a5a', borderRadius: 3, padding: '6px 8px', fontSize: 11, fontFamily: 'monospace', resize: 'vertical' as const, boxSizing: 'border-box' as const } as React.CSSProperties,
  select: { width: '100%', background: '#0d0d1a', color: '#ddd', border: '1px solid #3a3a5a', borderRadius: 3, padding: '5px 8px', fontSize: 11, fontFamily: 'monospace', boxSizing: 'border-box' as const } as React.CSSProperties,
  btn: (disabled: boolean, primary = false) => ({ padding: '7px 14px', background: disabled ? '#2a2a4a' : primary ? '#4040cc' : '#2a2a4a', color: disabled ? '#555' : '#fff', border: `1px solid ${disabled ? '#333' : primary ? '#6060ff' : '#555'}`, borderRadius: 3, fontSize: 11, fontFamily: 'monospace', cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: primary ? 600 : 400 } as React.CSSProperties),
  dot: (ok: boolean) => ({ width: 7, height: 7, borderRadius: '50%', background: ok ? '#00ff88' : '#ff4444', flexShrink: 0 } as React.CSSProperties),
  badge: (s: string) => ({ padding: '1px 7px', borderRadius: 3, fontSize: 10, background: s === 'done' ? '#1a4a1a' : s === 'failed' ? '#4a1a1a' : '#1a1a4a', color: s === 'done' ? '#00ff88' : s === 'failed' ? '#ff6666' : '#8888ff' } as React.CSSProperties),
  sliderRow: { display: 'flex', alignItems: 'center', gap: 6 },
  sliderVal: { fontSize: 11, color: '#aaa', width: 28, textAlign: 'right' as const, flexShrink: 0 },
  checkRow: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#aaa', cursor: 'pointer' },
  divider: { height: 1, background: '#2a2a4a', margin: '4px 0' },
  noImage: { color: '#333', fontSize: 13, textAlign: 'center' as const },
};

// ── Main Panel ─────────────────────────────────────────────────

export default function ImageGeneratorPanel() {
  const [online, setOnline] = useState(false);
  const [comfyOk, setComfyOk] = useState(false);
  const [rooms, setRooms] = useState<RoomEntry[]>([]);
  const [roomId, setRoomId] = useState('');
  const [roomName, setRoomName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('flux1-dev-fp8.safetensors');
  const [steps, setSteps] = useState(20);
  const [seed, setSeed] = useState('');
  const [lora, setLora] = useState('');
  const [skipSeg, setSkipSeg] = useState(false);
  const [skipClaude, setSkipClaude] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'generate' | 'analyze' | null>(null);
  const [job, setJob] = useState<JobStatus | null>(null);
  const [imgTs, setImgTs] = useState(Date.now());
  const [hasImage, setHasImage] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Server health check
  useEffect(() => {
    let cancel = false;
    const check = async () => {
      try {
        const r = await fetch(`${API}/api/health`, { signal: AbortSignal.timeout(2000) });
        if (r.ok) {
          const d = await r.json();
          if (!cancel) { setOnline(true); setComfyOk(d.comfyui ?? false); }
        } else if (!cancel) { setOnline(false); }
      } catch { if (!cancel) setOnline(false); }
    };
    check();
    const iv = setInterval(check, 5000);
    return () => { cancel = true; clearInterval(iv); };
  }, []);

  // Load rooms list
  useEffect(() => {
    if (!online) return;
    fetch(`${API}/api/rooms`).then(r => r.json()).then(d => {
      const list: RoomEntry[] = d.rooms ?? [];
      setRooms(list);
      if (!roomId && list.length > 0) {
        setRoomId(list[0].id);
        setRoomName(list[0].name);
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  // Check if background image exists for selected room
  useEffect(() => {
    if (!roomId) return;
    const img = new Image();
    img.onload = () => setHasImage(true);
    img.onerror = () => setHasImage(false);
    img.src = `/assets/backgrounds/${roomId}.png?t=${imgTs}`;
  }, [roomId, imgTs]);

  const stopPoll = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const startPoll = useCallback((id: string) => {
    stopPoll();
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(`${API}/api/jobs/${id}`);
        if (!r.ok) return;
        const data: JobStatus = await r.json();
        setJob(data);
        if (data.status !== 'running') {
          stopPoll();
          setBusy(false);
          setMode(null);
          if (data.status === 'done') setImgTs(Date.now());
        }
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
      } catch { /* ignore */ }
    }, 1500);
  }, [stopPoll]);

  useEffect(() => () => stopPoll(), [stopPoll]);

  const handleRoomChange = (id: string) => {
    setRoomId(id);
    const found = rooms.find(r => r.id === id);
    if (found) setRoomName(found.name);
  };

  const generate = async () => {
    if (!online || !roomId || busy) return;
    setBusy(true); setMode('generate');
    setJob({ status: 'running', output: ['이미지 생성 시작...'] });
    try {
      const body: Record<string, unknown> = { room_id: roomId, room_name: roomName, prompt, model, steps, width: 1600, height: 800 };
      if (seed.trim()) body.seed = parseInt(seed);
      if (lora.trim()) body.lora = lora;
      const r = await fetch(`${API}/api/image/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json();
      if (r.ok && d.job_id) startPoll(d.job_id);
      else { setJob({ status: 'failed', output: [], error: d.error ?? '실패' }); setBusy(false); setMode(null); }
    } catch (e) { setJob({ status: 'failed', output: [], error: String(e) }); setBusy(false); setMode(null); }
  };

  const analyze = async () => {
    if (!online || !roomId || busy) return;
    setBusy(true); setMode('analyze');
    setJob({ status: 'running', output: ['분석 시작...'] });
    try {
      const body = { room_id: roomId, room_name: roomName, context: prompt, skip_segmentation: skipSeg, skip_claude: skipClaude };
      const r = await fetch(`${API}/api/image/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json();
      if (r.ok && d.job_id) startPoll(d.job_id);
      else { setJob({ status: 'failed', output: [], error: d.error ?? '실패' }); setBusy(false); setMode(null); }
    } catch (e) { setJob({ status: 'failed', output: [], error: String(e) }); setBusy(false); setMode(null); }
  };

  const imgSrc = `/assets/backgrounds/${roomId}.png?t=${imgTs}`;

  return (
    <div style={S.wrap}>
      {/* Left settings */}
      <div style={S.settings}>
        <div style={S.settingsHdr}>
          <div style={S.dot(online)} />
          <span>이미지 생성기</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={S.dot(comfyOk)} />
            <span style={{ fontSize: 10, color: '#666' }}>ComfyUI</span>
          </div>
        </div>
        <div style={S.settingsBody}>
          {!online && (
            <div style={{ background: '#1a1010', border: '1px solid #442222', borderRadius: 4, padding: 10, fontSize: 11, color: '#ff8888', lineHeight: 1.6 }}>
              서버 오프라인
              <div style={{ marginTop: 6, background: '#000', color: '#00ff88', padding: '5px 7px', borderRadius: 3, fontSize: 10 }}>
                python tools/asset-pipeline/server.py
              </div>
            </div>
          )}

          <div>
            <div style={S.label}>방 선택</div>
            <select style={S.select} value={roomId} onChange={e => handleRoomChange(e.target.value)}>
              {rooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.id})</option>)}
            </select>
            <input style={{ ...S.input, marginTop: 4 }} value={roomId} onChange={e => setRoomId(e.target.value)} placeholder="또는 직접 입력 (harbor)" />
          </div>

          <div>
            <div style={S.label}>방 이름 (한국어)</div>
            <input style={S.input} value={roomName} onChange={e => setRoomName(e.target.value)} placeholder="항구" />
          </div>

          <div style={S.divider} />

          <div>
            <div style={S.label}>FLUX 모델</div>
            <input style={S.input} value={model} onChange={e => setModel(e.target.value)} placeholder="flux1-dev-fp8.safetensors" />
          </div>

          <div>
            <div style={S.label}>Steps: {steps}</div>
            <div style={S.sliderRow}>
              <input type="range" min={1} max={50} value={steps} onChange={e => setSteps(Number(e.target.value))} style={{ flex: 1, accentColor: '#6060ff' }} />
              <span style={S.sliderVal}>{steps}</span>
            </div>
          </div>

          <div>
            <div style={S.label}>Seed (비워두면 랜덤)</div>
            <input style={S.input} value={seed} onChange={e => setSeed(e.target.value)} placeholder="42" />
          </div>

          <div>
            <div style={S.label}>LoRA (선택)</div>
            <input style={S.input} value={lora} onChange={e => setLora(e.target.value)} placeholder="pixelart.safetensors" />
          </div>

          <div style={S.divider} />
          <div style={{ fontSize: 10, color: '#666', marginBottom: 2 }}>분석 옵션:</div>
          <label style={S.checkRow}>
            <input type="checkbox" checked={skipSeg} onChange={e => setSkipSeg(e.target.checked)} />
            세그멘테이션 건너뛰기 (빠름)
          </label>
          <label style={S.checkRow}>
            <input type="checkbox" checked={skipClaude} onChange={e => setSkipClaude(e.target.checked)} />
            Claude Vision 건너뛰기
          </label>
        </div>
      </div>

      {/* Center: image preview + actions */}
      <div style={S.center}>
        <div style={S.preview}>
          {hasImage ? (
            <img
              src={imgSrc}
              alt={roomId}
              style={{ maxWidth: '100%', maxHeight: '100%', imageRendering: 'pixelated', display: 'block' }}
              onError={() => setHasImage(false)}
            />
          ) : (
            <div style={S.noImage}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🖼</div>
              <div>{roomId ? `${roomId}.png 없음` : '방을 선택하세요'}</div>
              <div style={{ fontSize: 11, color: '#222', marginTop: 8 }}>생성 버튼을 눌러 이미지를 만드세요</div>
            </div>
          )}
          {busy && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00ff88', fontSize: 13 }}>
              {mode === 'generate' ? '⏳ ComfyUI 생성 중...' : '⏳ 분석 중...'}
            </div>
          )}
        </div>

        <div style={S.actions}>
          <button style={S.btn(!online || !roomId || busy || !comfyOk, true)} onClick={generate} disabled={!online || !roomId || busy || !comfyOk}>
            {mode === 'generate' ? '생성 중...' : '🎨 이미지 생성'}
          </button>
          <button style={S.btn(!online || !roomId || busy || !hasImage)} onClick={analyze} disabled={!online || !roomId || busy || !hasImage}>
            {mode === 'analyze' ? '분석 중...' : '🔍 분석 (depth+오브젝트)'}
          </button>
          {!comfyOk && <span style={{ fontSize: 10, color: '#ff6666', marginLeft: 8 }}>ComfyUI 연결 필요</span>}
          {job?.status === 'done' && hasImage && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#00ff88' }}>✓ 완료</span>}
        </div>

        {/* Prompt */}
        <div style={{ padding: '10px 16px', borderTop: '1px solid #2a2a4a', background: '#12121f' }}>
          <div style={S.label}>프롬프트 (이미지 설명 / 분석 컨텍스트)</div>
          <textarea
            style={{ ...S.textarea, minHeight: 60 }}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="wooden Caribbean dock at sunset, moored pirate ships, barrels and crates..."
          />
        </div>
      </div>

      {/* Log */}
      <div style={S.log}>
        <div style={S.logHdr}>
          <span>로그</span>
          {job && <span style={S.badge(job.status)}>{job.status}</span>}
        </div>
        <div style={S.logBody} ref={logRef}>
          {(job?.output ?? []).map((l, i) => <p key={i} style={S.logLine}>{l}</p>)}
          {job?.error && <p style={{ ...S.logLine, color: '#ff6666' }}>{job.error}</p>}
          {!job && <p style={{ ...S.logLine, color: '#444' }}>생성 또는 분석을 시작하면 로그가 여기에 표시됩니다.</p>}
        </div>
      </div>
    </div>
  );
}
