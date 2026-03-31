import { PALETTE } from '../../engine/types';

// ── Shared DevTools Styles ──────────────────────────────────

export const S = {
  app: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
  },
  header: {
    background: '#0d0d1a',
    borderBottom: '2px solid #333',
    padding: '10px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  title: {
    color: PALETTE.uiText,
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 14,
  },
  tabs: {
    display: 'flex',
    gap: 4,
  },
  tab: (active: boolean) => ({
    padding: '8px 16px',
    background: active ? '#2a2a4a' : 'transparent',
    color: active ? '#fff' : '#888',
    border: active ? '1px solid #555' : '1px solid transparent',
    borderBottom: active ? '1px solid #2a2a4a' : '1px solid #333',
    borderRadius: '6px 6px 0 0',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
  }),
  body: {
    flex: 1,
    overflow: 'auto',
    padding: 20,
    background: '#12121f',
  },
  panel: {
    background: '#1e1e30',
    border: '1px solid #333',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  panelTitle: {
    color: PALETTE.uiText,
    fontSize: 15,
    fontWeight: 600,
    marginBottom: 12,
    borderBottom: '1px solid #333',
    paddingBottom: 8,
  },
  select: {
    background: '#2a2a3e',
    color: '#fff',
    border: '1px solid #555',
    borderRadius: 4,
    padding: '6px 12px',
    fontSize: 13,
  },
  badge: (color: string) => ({
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    background: color,
    color: '#fff',
    marginRight: 6,
  }),
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
};

// ── Asset Viewer Styles ──────────────────────────────────────

export const SX = {
  section: { marginBottom: 32 },
  sectionTitle: {
    color: PALETTE.uiText,
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 13,
    marginBottom: 12,
    borderBottom: '1px solid #333',
    paddingBottom: 6,
  },
  grid: { display: 'flex', flexWrap: 'wrap' as const, gap: 12 },
  bgCard: {
    background: '#111',
    border: '1px solid #333',
    borderRadius: 4,
    overflow: 'hidden',
    cursor: 'default',
  },
  bgImg: {
    display: 'block',
    width: 240,
    height: 120,
    imageRendering: 'pixelated' as const,
  },
  label: { padding: '4px 8px', fontSize: 11, color: '#aaa', fontFamily: 'monospace' },
  spriteGroup: { marginBottom: 16 },
  spriteName: {
    color: PALETTE.uiVerbActive,
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 6,
  },
  spriteRow: { display: 'flex', gap: 8 },
  spriteCard: {
    background: '#111',
    border: '1px solid #333',
    borderRadius: 4,
    textAlign: 'center' as const,
    overflow: 'hidden',
  },
  spriteImg: {
    display: 'block',
    width: 64,
    height: 96,
    imageRendering: 'pixelated' as const,
  },
  frameLabel: { fontSize: 9, color: '#666', padding: '2px 4px', fontFamily: 'monospace' },
  portraitCard: {
    background: '#111',
    border: '1px solid #333',
    borderRadius: 4,
    overflow: 'hidden',
    textAlign: 'center' as const,
  },
  portraitImg: {
    display: 'block',
    width: 96,
    height: 96,
    imageRendering: 'pixelated' as const,
  },
};
