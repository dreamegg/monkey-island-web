import { useState, useEffect, useRef, useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────

interface RoomInfo {
  id: string;
  name: string;
  description: string;
  imagePrompt: string;
  npcs?: string[];
  items?: string[];
  connections?: string[];
}

interface NpcInfo {
  id: string;
  name: string;
  location: string;
  personality: string;
  knowledge?: string[];
  gives?: string[];
}

interface ItemInfo {
  id: string;
  name: string;
  icon: string;
  location: string;
  purpose: string;
}

interface FlagInfo {
  id: string;
  description: string;
}

interface StoryStructure {
  title: string;
  rooms: RoomInfo[];
  npcs: NpcInfo[];
  items: ItemInfo[];
  flags: FlagInfo[];
  player_goals?: string[];
}

interface JobStatus {
  status: 'running' | 'done' | 'failed';
  output: string[];
  error?: string;
}

// ── Constants ─────────────────────────────────────────────────

const API = 'http://localhost:7788';

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
    overflow: 'hidden',
  } as React.CSSProperties,

  sidebar: {
    width: 300,
    flexShrink: 0,
    background: '#1a1a2e',
    borderRight: '1px solid #2a2a4a',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },

  sidebarHeader: {
    padding: '10px 14px',
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    borderBottom: '1px solid #2a2a4a',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },

  sidebarBody: {
    flex: 1,
    overflow: 'auto',
    padding: 12,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
  },

  statusDot: (online: boolean) => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: online ? '#00ff88' : '#ff4444',
    flexShrink: 0,
  } as React.CSSProperties),

  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },

  formLabel: {
    fontSize: 11,
    color: '#888',
  },

  input: {
    background: '#0d0d1a',
    color: '#ddd',
    border: '1px solid #3a3a5a',
    borderRadius: 3,
    padding: '5px 8px',
    fontSize: 11,
    fontFamily: 'monospace',
    outline: 'none',
  } as React.CSSProperties,

  textarea: {
    background: '#0d0d1a',
    color: '#ddd',
    border: '1px solid #3a3a5a',
    borderRadius: 3,
    padding: '6px 8px',
    fontSize: 11,
    fontFamily: 'monospace',
    resize: 'vertical' as const,
    outline: 'none',
    lineHeight: 1.5,
  } as React.CSSProperties,

  btn: (variant: 'primary' | 'secondary' | 'disabled') => ({
    padding: '7px 12px',
    background: variant === 'primary' ? '#4040cc' : variant === 'secondary' ? '#2a2a4a' : '#1a1a2e',
    color: variant === 'disabled' ? '#555' : '#fff',
    border: `1px solid ${variant === 'primary' ? '#6060ff' : '#3a3a5a'}`,
    borderRadius: 4,
    fontSize: 11,
    fontFamily: 'monospace',
    cursor: variant === 'disabled' ? 'not-allowed' : 'pointer',
    fontWeight: variant === 'primary' ? 600 : 400,
    letterSpacing: variant === 'primary' ? 0.5 : 0,
  } as React.CSSProperties),

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

  center: {
    flex: 1,
    minWidth: 0,
    overflow: 'auto',
    padding: 16,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  },

  sectionLabel: {
    fontSize: 11,
    color: '#6060ff',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 8,
  },

  structureTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 600,
    marginBottom: 4,
  },

  card: {
    background: '#1a1a2e',
    border: '1px solid #2a2a4a',
    borderRadius: 6,
    padding: 12,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },

  cardId: {
    fontSize: 10,
    color: '#6060ff',
    fontFamily: 'monospace',
  },

  cardName: {
    fontSize: 13,
    color: '#ddd',
    fontWeight: 600,
  },

  cardDesc: {
    fontSize: 11,
    color: '#888',
    lineHeight: 1.5,
  },

  roomGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 12,
  },

  promptTextarea: {
    background: '#0d0d1a',
    color: '#aaa',
    border: '1px solid #2a2a4a',
    borderRadius: 3,
    padding: '5px 7px',
    fontSize: 10,
    fontFamily: 'monospace',
    resize: 'vertical' as const,
    outline: 'none',
    lineHeight: 1.4,
    width: '100%',
    boxSizing: 'border-box' as const,
  } as React.CSSProperties,

  npcList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },

  npcRow: {
    background: '#1a1a2e',
    border: '1px solid #2a2a4a',
    borderRadius: 4,
    padding: '8px 12px',
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },

  npcName: {
    fontSize: 12,
    color: '#ddd',
    fontWeight: 600,
    width: 120,
    flexShrink: 0,
  },

  npcMeta: {
    fontSize: 11,
    color: '#888',
    lineHeight: 1.5,
  },

  itemGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8,
  },

  itemChip: {
    background: '#1a1a2e',
    border: '1px solid #2a2a4a',
    borderRadius: 4,
    padding: '4px 10px',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    color: '#ddd',
  },

  flagList: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 6,
  },

  flagChip: {
    background: '#0d0d1a',
    border: '1px solid #3a3a5a',
    borderRadius: 3,
    padding: '3px 8px',
    fontSize: 10,
    color: '#888',
    fontFamily: 'monospace',
  },

  logPanel: {
    width: 300,
    flexShrink: 0,
    background: '#1a1a2e',
    borderLeft: '1px solid #2a2a4a',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },

  logHeader: {
    padding: '10px 14px',
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    borderBottom: '1px solid #2a2a4a',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },

  statusBadge: (status: string) => ({
    display: 'inline-block',
    padding: '2px 7px',
    borderRadius: 3,
    fontSize: 10,
    fontWeight: 600,
    background: status === 'done' ? '#1a3a1a' : status === 'failed' ? '#3a1a1a' : '#1a1a3a',
    color: status === 'done' ? '#00ff88' : status === 'failed' ? '#ff6666' : '#6080ff',
    border: `1px solid ${status === 'done' ? '#00aa44' : status === 'failed' ? '#aa2222' : '#4040aa'}`,
  } as React.CSSProperties),

  logBody: {
    flex: 1,
    overflow: 'auto',
    padding: 10,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },

  logArea: {
    flex: 1,
    background: '#000',
    border: '1px solid #1a1a2e',
    borderRadius: 3,
    padding: 8,
    overflow: 'auto',
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#00ff88',
    lineHeight: 1.5,
  },

  logLine: {
    margin: 0,
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-all' as const,
  },

  openLink: {
    display: 'inline-block',
    marginTop: 10,
    padding: '5px 10px',
    background: '#1a3a1a',
    border: '1px solid #00aa44',
    borderRadius: 3,
    color: '#00ff88',
    fontSize: 11,
    textDecoration: 'none',
    cursor: 'pointer',
  } as React.CSSProperties,

  placeholder: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#444',
    fontSize: 12,
    textAlign: 'center' as const,
    padding: 24,
  },
};

// ── Main Panel ────────────────────────────────────────────────

export default function StoryMakerPanel() {
  const [serverOnline, setServerOnline] = useState(false);
  const [gameId, setGameId] = useState('');
  const [storyText, setStoryText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [structure, setStructure] = useState<StoryStructure | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // Server health polling
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(`${API}/api/health`, { signal: AbortSignal.timeout(2000) });
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
        if (logRef.current) {
          logRef.current.scrollTop = logRef.current.scrollHeight;
        }
      } catch {
        // ignore poll errors
      }
    }, 1500);
  }, [stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const handleAnalyze = async () => {
    if (!serverOnline || analyzing || !storyText.trim()) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    setStructure(null);
    setJobStatus(null);
    setJobId(null);
    try {
      const res = await fetch(`${API}/api/story/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: storyText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAnalyzeError(data.error || '분석 실패');
      } else {
        setStructure(data);
      }
    } catch (e) {
      setAnalyzeError(String(e));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (!serverOnline || generating || !structure) return;
    setGenerating(true);
    setJobStatus({ status: 'running', output: ['파일 생성 시작...'] });
    try {
      const res = await fetch(`${API}/api/story/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structure,
          game_id: gameId.trim() || undefined,
          output_dir: undefined, // server uses default PUBLIC_DIR
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setJobStatus({ status: 'failed', output: [], error: err.error || '생성 실패' });
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

  const updateRoomPrompt = (roomId: string, value: string) => {
    if (!structure) return;
    setStructure({
      ...structure,
      rooms: structure.rooms.map((r) =>
        r.id === roomId ? { ...r, imagePrompt: value } : r
      ),
    });
  };

  const canGenerate = !!structure && serverOnline && !generating && !analyzing;

  return (
    <div style={S.container}>
      {/* Left Sidebar */}
      <div style={S.sidebar}>
        <div style={S.sidebarHeader}>
          <div style={S.statusDot(serverOnline)} />
          <span>스토리 메이커</span>
        </div>
        <div style={S.sidebarBody}>
          {!serverOnline && (
            <div style={S.offlineNotice}>
              서버가 오프라인입니다. 다음 명령어로 시작하세요:
              <div style={S.offlineCmd}>
                cd tools/asset-pipeline{'\n'}&& .venv/bin/python server.py
              </div>
            </div>
          )}

          <div style={S.formGroup}>
            <div style={S.formLabel}>게임 ID (파일명)</div>
            <input
              style={S.input}
              type="text"
              placeholder="예: my_adventure"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              disabled={!serverOnline}
            />
          </div>

          <div style={S.formGroup}>
            <div style={S.formLabel}>스토리 텍스트</div>
            <textarea
              style={{ ...S.textarea, minHeight: 260 }}
              rows={15}
              placeholder="소설, 시나리오, 또는 스토리 텍스트를 입력하세요..."
              value={storyText}
              onChange={(e) => setStoryText(e.target.value)}
              disabled={!serverOnline}
            />
          </div>

          {analyzeError && (
            <div style={{ ...S.offlineNotice, marginTop: 0 }}>
              {analyzeError}
            </div>
          )}

          <button
            style={S.btn(!serverOnline || analyzing || !storyText.trim() ? 'disabled' : 'primary')}
            onClick={handleAnalyze}
            disabled={!serverOnline || analyzing || !storyText.trim()}
          >
            {analyzing ? '분석 중...' : '분석'}
          </button>

          <button
            style={S.btn(!canGenerate ? 'disabled' : 'secondary')}
            onClick={handleGenerate}
            disabled={!canGenerate}
          >
            {generating ? '생성 중...' : '파일 생성'}
          </button>
        </div>
      </div>

      {/* Center: Structure Preview */}
      <div style={S.center}>
        {!structure ? (
          <div style={S.placeholder}>
            {analyzing
              ? 'Claude API로 스토리 분석 중...'
              : '스토리를 입력하고 "분석" 버튼을 누르세요'}
          </div>
        ) : (
          <>
            <div style={S.structureTitle}>{structure.title}</div>

            {/* Rooms */}
            <div>
              <div style={S.sectionLabel}>방 ({structure.rooms.length})</div>
              <div style={S.roomGrid}>
                {structure.rooms.map((room) => (
                  <div key={room.id} style={S.card}>
                    <div style={S.cardId}>{room.id}</div>
                    <div style={S.cardName}>{room.name}</div>
                    {room.description && (
                      <div style={S.cardDesc}>{room.description}</div>
                    )}
                    {room.connections && room.connections.length > 0 && (
                      <div style={{ ...S.cardDesc, fontSize: 10 }}>
                        연결: {room.connections.join(', ')}
                      </div>
                    )}
                    <div style={{ ...S.formLabel, marginTop: 4 }}>이미지 프롬프트</div>
                    <textarea
                      style={{ ...S.promptTextarea, minHeight: 60 }}
                      value={room.imagePrompt}
                      onChange={(e) => updateRoomPrompt(room.id, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* NPCs */}
            {structure.npcs.length > 0 && (
              <div>
                <div style={S.sectionLabel}>NPC ({structure.npcs.length})</div>
                <div style={S.npcList}>
                  {structure.npcs.map((npc) => (
                    <div key={npc.id} style={S.npcRow}>
                      <div>
                        <div style={S.cardId}>{npc.id}</div>
                        <div style={S.npcName}>{npc.name}</div>
                      </div>
                      <div style={S.npcMeta}>
                        <div>위치: {npc.location}</div>
                        <div>{npc.personality}</div>
                        {npc.gives && npc.gives.length > 0 && (
                          <div>아이템 제공: {npc.gives.join(', ')}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Items */}
            {structure.items.length > 0 && (
              <div>
                <div style={S.sectionLabel}>아이템 ({structure.items.length})</div>
                <div style={S.itemGrid}>
                  {structure.items.map((item) => (
                    <div key={item.id} style={S.itemChip} title={item.purpose}>
                      <span style={{ fontSize: 16 }}>{item.icon}</span>
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Flags */}
            {structure.flags.length > 0 && (
              <div>
                <div style={S.sectionLabel}>플래그 ({structure.flags.length})</div>
                <div style={S.flagList}>
                  {structure.flags.map((flag) => (
                    <div key={flag.id} style={S.flagChip} title={flag.description}>
                      {flag.id}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Player goals */}
            {structure.player_goals && structure.player_goals.length > 0 && (
              <div>
                <div style={S.sectionLabel}>목표</div>
                <ul style={{ margin: 0, paddingLeft: 20, color: '#aaa', fontSize: 12, lineHeight: 1.8 }}>
                  {structure.player_goals.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      {/* Right Log Panel */}
      <div style={S.logPanel}>
        <div style={S.logHeader}>
          <span>빌드 로그</span>
          {jobStatus && (
            <span style={S.statusBadge(jobStatus.status)}>
              {jobStatus.status === 'running' ? '실행 중' : jobStatus.status === 'done' ? '완료' : '실패'}
            </span>
          )}
        </div>
        <div style={S.logBody}>
          {!jobStatus ? (
            <div style={{ color: '#444', fontSize: 11, padding: 4 }}>
              "파일 생성" 버튼을 누르면 여기에 로그가 표시됩니다
            </div>
          ) : (
            <div style={S.logArea} ref={logRef}>
              {jobStatus.output.map((line, i) => (
                <p key={i} style={S.logLine}>{line}</p>
              ))}
              {jobStatus.error && (
                <p style={{ ...S.logLine, color: '#ff6666' }}>{jobStatus.error}</p>
              )}
            </div>
          )}

          {jobStatus?.status === 'done' && gameId && (
            <a
              style={S.openLink}
              href={`/?game=${gameId}`}
              target="_blank"
              rel="noreferrer"
            >
              게임 열기 (?game={gameId})
            </a>
          )}

          {jobId && (
            <div style={{ fontSize: 10, color: '#444', marginTop: 4 }}>
              Job: {jobId.slice(0, 8)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
