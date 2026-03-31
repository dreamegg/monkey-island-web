import { useState, useEffect, useCallback, useRef } from 'react';
import { S } from '../shared/styles';
import { ap } from '../../utils/paths';

// ── Types ────────────────────────────────────────────────────

interface PortraitVariant {
  key: string;
  expression: string;
  output: string;
  seed: number;
}

interface SpriteVariant {
  key: string;
  pose: string;
  output: string;
  seed: number;
}

interface CharacterDef {
  id: string;
  identity: string;
  baseSeed: number;
  facing: 'left' | 'right';
  portraits: PortraitVariant[];
  sprites: SpriteVariant[];
}

interface JobStatus {
  status: 'running' | 'done' | 'failed';
  output: string[];
  error?: string;
}

// ── Initial data from characters.yaml ────────────────────────

const INITIAL_CHARACTERS: CharacterDef[] = [
  {
    id: 'guybrush',
    identity: 'young lanky male pirate hero, medium-length untidy blonde hair, bright sky-blue eyes, long slightly pointed nose, narrow face, friendly jawline, wearing a red long-sleeved shirt with white collar, blue-gray baggy pants cinched with a small brown belt, brown leather ankle boots, slight build, expressive eyebrows',
    baseSeed: 5000, facing: 'right',
    portraits: [
      { key: 'neutral', expression: 'friendly open expression, relaxed gentle smile, eyes looking slightly right, calm', output: 'guybrush_neutral', seed: 5001 },
      { key: 'surprised', expression: 'wide shocked eyes, mouth hanging open in an O, eyebrows raised as high as possible, startled', output: 'guybrush_surprised', seed: 5002 },
      { key: 'determined', expression: 'focused narrowed eyes, jaw firmly set, lips pressed together, intense confident stare', output: 'guybrush_determined', seed: 5003 },
      { key: 'happy', expression: 'big wide grin showing teeth, crinkled eyes, eyebrows raised with joy, delighted', output: 'guybrush_happy', seed: 5004 },
      { key: 'worried', expression: 'furrowed brow, eyes darting, lips pressed nervously, anxious expression', output: 'guybrush_worried', seed: 5005 },
    ],
    sprites: [
      { key: 'idle', pose: 'standing relaxed upright, arms at sides, weight evenly on both feet, facing right', output: 'guybrush_idle', seed: 2100 },
      { key: 'idle2', pose: 'standing with slight knee bend, weight shifted to one hip, relaxed slouch, facing right', output: 'guybrush_idle2', seed: 2105 },
      { key: 'walk1', pose: 'right heel strike, right foot forward and planted, left arm swinging forward, body tall, facing right', output: 'guybrush_walk1', seed: 2101 },
      { key: 'walk2', pose: 'right recoil, body lowering, left foot mid-swing, arms crossing at center, facing right', output: 'guybrush_walk2', seed: 2102 },
      { key: 'walk3', pose: 'left heel strike, left foot forward and planted, right arm swinging forward, body tall, facing right', output: 'guybrush_walk3', seed: 2103 },
      { key: 'walk4', pose: 'left recoil, body lowering, right foot mid-swing, arms crossing at center, facing right', output: 'guybrush_walk4', seed: 2104 },
      { key: 'talk1', pose: 'standing, mouth wide open mid-speech, one hand raised gesturing, facing right', output: 'guybrush_talk1', seed: 2106 },
      { key: 'talk2', pose: 'standing, mouth half open, lips forming a word, hand slightly raised, facing right', output: 'guybrush_talk2', seed: 2107 },
      { key: 'pickup', pose: 'bending forward at the waist, arm reaching down toward the ground, knees slightly bent, facing right', output: 'guybrush_pickup', seed: 2108 },
    ],
  },
  {
    id: 'lechuck',
    identity: 'ghost pirate captain, undead supernatural figure, massive imposing frame, large black beard made of dark smoke and shadow tendrils, glowing red pupils in black eyes, hollowed sunken cheeks, tattered large captain\'s coat with gold buttons, rotting captain\'s hat with skull emblem, ethereal blue-green ghostly aura surrounding entire body, skeletal hands with long fingers',
    baseSeed: 5100, facing: 'left',
    portraits: [
      { key: 'angry', expression: 'furious glaring red eyes wide, mouth twisted in rage, brow deeply furrowed, veins of dark energy', output: 'lechuck_angry', seed: 5101 },
      { key: 'sinister', expression: 'evil slow smirk, half-lidded glowing eyes, one eyebrow arched menacingly, unsettling calm', output: 'lechuck_sinister', seed: 5102 },
      { key: 'scheming', expression: 'fingers steepled, eyes narrowed plotting, a slight knowing smile, dangerous look', output: 'lechuck_scheming', seed: 5103 },
    ],
    sprites: [
      { key: 'idle', pose: 'hovering slightly above ground, arms at sides, coat drifting, menacing still pose, facing right', output: 'lechuck_idle', seed: 2200 },
      { key: 'idle2', pose: 'hovering, slowly rotating head, smoky beard tendrils shifting, arms slightly raised, facing right', output: 'lechuck_idle2', seed: 2205 },
      { key: 'walk1', pose: 'floating forward, right arm reaching ahead, cape and coat trailing behind, facing right', output: 'lechuck_walk1', seed: 2201 },
      { key: 'walk2', pose: 'gliding forward, arms at sides, ethereal trail of smoke behind, facing right', output: 'lechuck_walk2', seed: 2202 },
      { key: 'talk1', pose: 'standing, mouth open wide in a booming shout, one arm raised pointing, coat billowing, facing right', output: 'lechuck_talk1', seed: 2206 },
      { key: 'talk2', pose: 'standing, mouth slightly open in a menacing grin, head tilted, facing right', output: 'lechuck_talk2', seed: 2207 },
    ],
  },
  {
    id: 'elaine',
    identity: 'confident young female governor, flowing auburn-brown hair to shoulders, sharp intelligent green eyes, strong cheekbones, determined elegant face, wearing a deep navy blue dress with gold embroidered trim at collar and cuffs, gold brooch, practical leather boots, a short cape, poised and authoritative bearing',
    baseSeed: 5200, facing: 'left',
    portraits: [
      { key: 'confident', expression: 'knowing slight smile, eyes direct and sharp, chin raised, self-assured calm authority', output: 'elaine_confident', seed: 5201 },
      { key: 'concerned', expression: 'brow slightly furrowed with worry, eyes showing concern but still strong, lips pressed', output: 'elaine_concerned', seed: 5202 },
      { key: 'amused', expression: 'one eyebrow raised, corner of mouth curling in wry amusement, eyes sparkling', output: 'elaine_amused', seed: 5203 },
    ],
    sprites: [
      { key: 'idle', pose: 'standing tall confident, hands on hips, weight on one leg, facing right', output: 'elaine_idle', seed: 2300 },
      { key: 'idle2', pose: 'standing with arms crossed, weight shifted, chin slightly raised, composed bearing, facing right', output: 'elaine_idle2', seed: 2305 },
      { key: 'walk1', pose: 'right heel strike, right foot forward planted, cape swaying forward, arm swinging, facing right', output: 'elaine_walk1', seed: 2301 },
      { key: 'walk2', pose: 'passing position, feet together, cape settling, arms at center, slight forward lean, facing right', output: 'elaine_walk2', seed: 2302 },
      { key: 'walk3', pose: 'left heel strike, left foot forward planted, cape swaying other direction, facing right', output: 'elaine_walk3', seed: 2303 },
      { key: 'talk1', pose: 'standing, mouth open mid-sentence, one hand raised with authority, facing right', output: 'elaine_talk1', seed: 2306 },
      { key: 'talk2', pose: 'standing, lips pursed as if finishing a sentence, hand gesturing forward, facing right', output: 'elaine_talk2', seed: 2307 },
    ],
  },
  {
    id: 'voodoo_lady',
    identity: 'ancient voodoo woman, dark deeply wrinkled skin, wild silver-white hair shot through with colorful glass beads and small bones woven in, piercing dark eyes with unsettling wisdom, a wide knowing smile showing aged teeth, multiple layered robes in purple, deep burgundy and black with voodoo symbols embroidered, heavy necklace of small bones, feathers, and charms, hunched slightly but radiating power',
    baseSeed: 5300, facing: 'right',
    portraits: [
      { key: 'mysterious', expression: 'one eye squinted wisely, the other wide and knowing, a slow mysterious smile, lit from below', output: 'voodoo_lady_mysterious', seed: 5301 },
      { key: 'serious', expression: 'both eyes wide and intense, lips set in a grave warning expression, furrowed ancient brow', output: 'voodoo_lady_serious', seed: 5302 },
    ],
    sprites: [
      { key: 'idle', pose: 'standing, arms slightly out holding a glowing voodoo doll, facing right', output: 'voodoo_lady', seed: 2400 },
    ],
  },
  {
    id: 'bartender',
    identity: 'stocky gruff pirate bartender, completely bald shaved head with a worn red bandana tied around forehead, small dark eyes set deep under heavy brow, thick black handlebar mustache, large jaw, short thick neck, wide shoulders, wearing a rough brown leather apron over a faded cream striped shirt with rolled sleeves, large meaty forearms',
    baseSeed: 5400, facing: 'right',
    portraits: [
      { key: 'suspicious', expression: 'eyes narrowed to slits, lip curled in distrust, arms crossed posture implied, skeptical squint', output: 'bartender_suspicious', seed: 5401 },
      { key: 'gruff', expression: 'flat unimpressed expression, eyebrow raised, mouth a straight line, bored but watchful', output: 'bartender_gruff', seed: 5402 },
    ],
    sprites: [
      { key: 'idle', pose: 'standing behind bar, arms crossed, weight back, staring forward, facing right', output: 'bartender', seed: 2500 },
    ],
  },
];

const API = 'http://localhost:7788';

// ── Main Panel ───────────────────────────────────────────────

export default function CharacterManagerPanel() {
  const [characters, setCharacters] = useState<CharacterDef[]>(INITIAL_CHARACTERS);
  const [activeCharIdx, setActiveCharIdx] = useState(0);
  const [subTab, setSubTab] = useState<'identity' | 'portraits' | 'sprites' | 'npcExport'>('identity');
  const [serverOnline, setServerOnline] = useState(false);
  const [genLog, setGenLog] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);

  const char = characters[activeCharIdx];

  // Server status check
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(`${API}/api/characters`, { signal: AbortSignal.timeout(2000) });
        if (!cancelled) setServerOnline(res.ok);
      } catch { if (!cancelled) setServerOnline(false); }
    };
    check();
    const interval = setInterval(check, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // ── Character CRUD ─────────────────────────────────────────

  function updateChar(patch: Partial<CharacterDef>) {
    setCharacters((cs) => cs.map((c, i) => i === activeCharIdx ? { ...c, ...patch } : c));
  }

  function addCharacter() {
    const id = `char_${Date.now()}`;
    const newChar: CharacterDef = {
      id, identity: '', baseSeed: Math.floor(Math.random() * 9000) + 1000,
      facing: 'right', portraits: [], sprites: [],
    };
    setCharacters((cs) => [...cs, newChar]);
    setActiveCharIdx(characters.length);
    setSubTab('identity');
  }

  function deleteCharacter() {
    if (characters.length <= 1) return;
    setCharacters((cs) => cs.filter((_, i) => i !== activeCharIdx));
    setActiveCharIdx((i) => Math.min(i, characters.length - 2));
  }

  // ── Portrait CRUD ──────────────────────────────────────────

  function addPortrait() {
    const key = `expr_${Date.now()}`;
    updateChar({
      portraits: [...char.portraits, { key, expression: '', output: `${char.id}_${key}`, seed: char.baseSeed + char.portraits.length + 1 }],
    });
  }

  function updatePortrait(idx: number, patch: Partial<PortraitVariant>) {
    const portraits = char.portraits.map((p, i) => i === idx ? { ...p, ...patch } : p);
    updateChar({ portraits });
  }

  function removePortrait(idx: number) {
    updateChar({ portraits: char.portraits.filter((_, i) => i !== idx) });
  }

  // ── Sprite CRUD ────────────────────────────────────────────

  function addSprite() {
    const key = `pose_${Date.now()}`;
    updateChar({
      sprites: [...char.sprites, { key, pose: '', output: `${char.id}_${key}`, seed: char.baseSeed + 1000 + char.sprites.length + 1 }],
    });
  }

  function updateSprite(idx: number, patch: Partial<SpriteVariant>) {
    const sprites = char.sprites.map((s, i) => i === idx ? { ...s, ...patch } : s);
    updateChar({ sprites });
  }

  function removeSprite(idx: number) {
    updateChar({ sprites: char.sprites.filter((_, i) => i !== idx) });
  }

  // ── Generation (single variant) ────────────────────────────

  function generateVariant(type: 'portrait' | 'sprite', variantKey: string) {
    if (!serverOnline || generating) return;
    setGenerating(true);
    setGenLog([`Generating ${type}: ${char.id}/${variantKey}...`]);
    fetch(`${API}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        character: char.id,
        mode: type === 'portrait' ? 'portraits' : 'sprites',
        variant: variantKey,
      }),
    }).then(async (res) => {
      if (!res.ok) {
        const errText = await res.text();
        setGenLog((l) => [...l, `ERROR: ${errText}`]);
        setGenerating(false);
        return;
      }
      const { job_id } = await res.json();
      pollJob(job_id);
    }).catch((e) => {
      setGenLog((l) => [...l, `ERROR: ${String(e)}`]);
      setGenerating(false);
    });
  }

  function pollJob(jobId: string) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API}/api/jobs/${jobId}`);
        if (!res.ok) return;
        const data: JobStatus = await res.json();
        setGenLog(data.output);
        if (data.status !== 'running') {
          clearInterval(interval);
          setGenerating(false);
          if (data.error) setGenLog((l) => [...l, `ERROR: ${data.error}`]);
        }
      } catch { /* ignore */ }
    }, 1000);
  }

  // ── Export ─────────────────────────────────────────────────

  function exportYaml() {
    let yaml = '# Character Identity Definitions\n# Generated by DevTools Character Manager\n\ncharacters:\n';
    characters.forEach((c) => {
      yaml += `  ${c.id}:\n`;
      yaml += `    identity: >-\n      ${c.identity.replace(/\n/g, '\n      ')}\n`;
      yaml += `    base_seed: ${c.baseSeed}\n`;
      yaml += `    facing: ${c.facing}\n\n`;
      if (c.portraits.length > 0) {
        yaml += `    portraits:\n`;
        c.portraits.forEach((p) => {
          yaml += `      ${p.key}:\n`;
          yaml += `        expression: "${p.expression}"\n`;
          yaml += `        output: ${p.output}\n`;
          yaml += `        seed: ${p.seed}\n`;
        });
        yaml += '\n';
      }
      if (c.sprites.length > 0) {
        yaml += `    sprites:\n`;
        c.sprites.forEach((s) => {
          yaml += `      ${s.key}:\n`;
          yaml += `        pose: "${s.pose}"\n`;
          yaml += `        output: ${s.output}\n`;
          yaml += `        seed: ${s.seed}\n`;
        });
        yaml += '\n';
      }
    });
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'characters.yaml'; a.click();
    URL.revokeObjectURL(url);
  }

  function exportNpcJson() {
    const npcData = characters.map((c) => ({
      id: c.id,
      name: c.id.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      sprite: c.id,
      dialogue: c.id,
      portraits: c.portraits.map((p) => p.key),
      spriteFrames: {
        idle: c.sprites.filter((s) => s.key.startsWith('idle')).map((s) => s.output),
        walk: c.sprites.filter((s) => s.key.startsWith('walk')).map((s) => s.output),
        talk: c.sprites.filter((s) => s.key.startsWith('talk')).map((s) => s.output),
        action: c.sprites.filter((s) => !s.key.startsWith('idle') && !s.key.startsWith('walk') && !s.key.startsWith('talk')).map((s) => s.output),
      },
    }));
    const blob = new Blob([JSON.stringify(npcData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'npc-characters.json'; a.click();
    URL.revokeObjectURL(url);
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0, fontFamily: 'monospace', fontSize: 12, color: '#ccc', background: '#0d0d1a' }}>
      {/* Sidebar */}
      <div style={{ width: 200, flexShrink: 0, background: '#1a1a2e', borderRight: '1px solid #2a2a4a', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        <div style={{ padding: '10px 12px', fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #2a2a4a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Characters
          <button onClick={addCharacter} style={addBtn}>+</button>
        </div>
        {characters.map((c, i) => (
          <div
            key={c.id}
            onClick={() => { setActiveCharIdx(i); setSubTab('identity'); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer',
              background: activeCharIdx === i ? '#2a2a4a' : 'transparent',
              borderLeft: activeCharIdx === i ? '3px solid #6060ff' : '3px solid transparent',
              borderBottom: '1px solid #2a2a4a',
            }}
          >
            <img
              src={ap(`/assets/portraits/${c.portraits[0]?.output ?? c.id + '_neutral'}.png`)}
              alt={c.id}
              style={{ width: 40, height: 40, imageRendering: 'pixelated', background: '#0d0d1a', border: '1px solid #2a2a4a', borderRadius: 2, objectFit: 'contain' }}
              onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
            />
            <div>
              <div style={{ color: '#ddd', textTransform: 'capitalize' }}>{c.id.replace(/_/g, ' ')}</div>
              <div style={{ color: '#666', fontSize: 10 }}>{c.portraits.length}p {c.sprites.length}s</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main area */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Sub-tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #2a2a4a', background: '#12121f', flexShrink: 0 }}>
          {(['identity', 'portraits', 'sprites', 'npcExport'] as const).map((t) => (
            <button key={t} onClick={() => setSubTab(t)} style={{
              padding: '8px 18px', cursor: 'pointer', fontSize: 12, fontFamily: 'monospace',
              color: subTab === t ? '#fff' : '#666',
              background: subTab === t ? '#1a1a2e' : 'transparent',
              borderBottom: subTab === t ? '2px solid #6060ff' : '2px solid transparent',
              border: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none',
            }}>
              {t === 'identity' ? 'Identity' : t === 'portraits' ? `Portraits (${char.portraits.length})` : t === 'sprites' ? `Sprites (${char.sprites.length})` : 'NPC Export'}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: serverOnline ? '#00ff88' : '#ff4444' }} />
            <span style={{ fontSize: 11, color: '#666' }}>{serverOnline ? 'Server Online' : 'Offline'}</span>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {subTab === 'identity' && (
            <IdentityTab char={char} onUpdate={updateChar} onDelete={deleteCharacter} canDelete={characters.length > 1} />
          )}
          {subTab === 'portraits' && (
            <PortraitsTab
              char={char}
              onAdd={addPortrait}
              onUpdate={updatePortrait}
              onRemove={removePortrait}
              onGenerate={(key) => generateVariant('portrait', key)}
              serverOnline={serverOnline}
              generating={generating}
            />
          )}
          {subTab === 'sprites' && (
            <SpritesTab
              char={char}
              onAdd={addSprite}
              onUpdate={updateSprite}
              onRemove={removeSprite}
              onGenerate={(key) => generateVariant('sprite', key)}
              serverOnline={serverOnline}
              generating={generating}
            />
          )}
          {subTab === 'npcExport' && (
            <NpcExportTab char={char} characters={characters} onExportYaml={exportYaml} onExportNpc={exportNpcJson} />
          )}
        </div>

        {/* Generation log */}
        {genLog.length > 0 && (
          <div style={{ borderTop: '1px solid #2a2a4a', padding: 8, maxHeight: 150, overflow: 'auto', background: '#000', fontSize: 10, fontFamily: 'monospace', color: '#00ff88' }}>
            {genLog.map((line, i) => <div key={i}>{line}</div>)}
            {generating && <div style={{ color: '#ff0' }}>generating...</div>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Identity Tab ─────────────────────────────────────────────

function IdentityTab({ char, onUpdate, onDelete, canDelete }: {
  char: CharacterDef;
  onUpdate: (patch: Partial<CharacterDef>) => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  return (
    <div style={{ maxWidth: 700 }}>
      <div style={S.panelTitle}>Character Identity — {char.id}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '10px 12px', alignItems: 'start' }}>
        <label style={lbl}>ID</label>
        <input style={inp} value={char.id} onChange={(e) => onUpdate({ id: e.target.value })} />

        <label style={lbl}>Base Seed</label>
        <input style={inp} type="number" value={char.baseSeed} onChange={(e) => onUpdate({ baseSeed: parseInt(e.target.value) || 0 })} />

        <label style={lbl}>Facing</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['left', 'right'] as const).map((f) => (
            <button key={f} onClick={() => onUpdate({ facing: f })} style={{
              padding: '4px 12px', fontSize: 12, fontFamily: 'monospace',
              background: char.facing === f ? '#6060ff' : '#2a2a4a',
              color: char.facing === f ? '#fff' : '#aaa',
              border: '1px solid #3a3a5a', borderRadius: 3, cursor: 'pointer',
            }}>{f}</button>
          ))}
        </div>

        <label style={{ ...lbl, alignSelf: 'start', paddingTop: 6 }}>Identity</label>
        <textarea
          style={{ ...inp, minHeight: 120, resize: 'vertical', lineHeight: 1.6 }}
          value={char.identity}
          onChange={(e) => onUpdate({ identity: e.target.value })}
          placeholder="Canonical physical description: clothes, hair, face, build..."
        />
      </div>

      {/* Preview */}
      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Preview</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <img
            src={ap(`/assets/portraits/${char.portraits[0]?.output ?? char.id + '_neutral'}.png`)}
            alt="portrait"
            style={{ width: 96, height: 96, imageRendering: 'pixelated', background: '#0d0d1a', border: '1px solid #2a2a4a', borderRadius: 4, objectFit: 'contain' }}
            onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
          />
          <img
            src={ap(`/assets/sprites/${char.sprites[0]?.output ?? char.id + '_idle'}.png`)}
            alt="sprite"
            style={{ width: 48, height: 72, imageRendering: 'pixelated', background: '#0d0d1a', border: '1px solid #2a2a4a', borderRadius: 4, objectFit: 'contain' }}
            onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
          />
          <div style={{ fontSize: 11, color: '#888', lineHeight: 1.6 }}>
            <div>Portraits: <b>{char.portraits.length}</b></div>
            <div>Sprites: <b>{char.sprites.length}</b></div>
            <div>Facing: <b>{char.facing}</b></div>
          </div>
        </div>
      </div>

      {canDelete && (
        <button onClick={onDelete} style={{ marginTop: 24, background: '#f44336', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 16px', fontSize: 12, cursor: 'pointer' }}>
          Delete Character
        </button>
      )}
    </div>
  );
}

// ── Portraits Tab ────────────────────────────────────────────

function PortraitsTab({ char, onAdd, onUpdate, onRemove, onGenerate, serverOnline, generating }: {
  char: CharacterDef;
  onAdd: () => void;
  onUpdate: (idx: number, patch: Partial<PortraitVariant>) => void;
  onRemove: (idx: number) => void;
  onGenerate: (key: string) => void;
  serverOnline: boolean;
  generating: boolean;
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <div style={S.panelTitle}>Portraits — {char.id}</div>
        <button onClick={onAdd} style={{ ...addBtn, marginLeft: 'auto' }}>+ Add Portrait</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {char.portraits.map((p, i) => (
          <div key={p.key + i} style={{ display: 'flex', gap: 12, padding: 12, background: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 6 }}>
            <img
              src={ap(`/assets/portraits/${p.output}.png`)}
              alt={p.key}
              style={{ width: 80, height: 80, imageRendering: 'pixelated', background: '#0d0d1a', border: '1px solid #2a2a4a', borderRadius: 4, objectFit: 'contain', flexShrink: 0 }}
              onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input style={{ ...inp, flex: 1 }} value={p.key} placeholder="key" onChange={(e) => onUpdate(i, { key: e.target.value, output: `${char.id}_${e.target.value}` })} />
                <input style={{ ...inp, width: 70 }} type="number" value={p.seed} onChange={(e) => onUpdate(i, { seed: parseInt(e.target.value) || 0 })} />
                {serverOnline && (
                  <button onClick={() => onGenerate(p.key)} disabled={generating} style={{ ...genBtn, opacity: generating ? 0.5 : 1 }}>Gen</button>
                )}
                <button onClick={() => onRemove(i)} style={rmBtn}>×</button>
              </div>
              <input style={inp} value={p.expression} placeholder="expression description..." onChange={(e) => onUpdate(i, { expression: e.target.value })} />
              <div style={{ fontSize: 10, color: '#555' }}>output: {p.output}.png</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sprites Tab ──────────────────────────────────────────────

function SpritesTab({ char, onAdd, onUpdate, onRemove, onGenerate, serverOnline, generating }: {
  char: CharacterDef;
  onAdd: () => void;
  onUpdate: (idx: number, patch: Partial<SpriteVariant>) => void;
  onRemove: (idx: number) => void;
  onGenerate: (key: string) => void;
  serverOnline: boolean;
  generating: boolean;
}) {
  const groups = [
    { label: 'Idle', filter: (s: SpriteVariant) => s.key.startsWith('idle') },
    { label: 'Walk', filter: (s: SpriteVariant) => s.key.startsWith('walk') },
    { label: 'Talk', filter: (s: SpriteVariant) => s.key.startsWith('talk') },
    { label: 'Action', filter: (s: SpriteVariant) => !s.key.startsWith('idle') && !s.key.startsWith('walk') && !s.key.startsWith('talk') },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <div style={S.panelTitle}>Sprites — {char.id}</div>
        <button onClick={onAdd} style={{ ...addBtn, marginLeft: 'auto' }}>+ Add Sprite</button>
      </div>

      {groups.map((group) => {
        const items = char.sprites.map((s, i) => ({ ...s, idx: i })).filter((s) => group.filter(s));
        if (items.length === 0) return null;
        return (
          <div key={group.label} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: '#6060ff', marginBottom: 8 }}>{group.label} ({items.length})</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {items.map((s) => (
                <div key={s.key + s.idx} style={{ padding: 10, background: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 6, width: 160 }}>
                  <img
                    src={ap(`/assets/sprites/${s.output}.png`)}
                    alt={s.key}
                    style={{ width: 48, height: 72, imageRendering: 'pixelated', background: '#0d0d1a', border: '1px solid #2a2a4a', borderRadius: 3, objectFit: 'contain', display: 'block', margin: '0 auto 8px' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                  />
                  <input style={{ ...inp, marginBottom: 4 }} value={s.key} onChange={(e) => onUpdate(s.idx, { key: e.target.value, output: `${char.id}_${e.target.value}` })} />
                  <input style={{ ...inp, marginBottom: 4, fontSize: 10 }} value={s.pose} placeholder="pose desc..." onChange={(e) => onUpdate(s.idx, { pose: e.target.value })} />
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <input style={{ ...inp, width: 50, fontSize: 10 }} type="number" value={s.seed} onChange={(e) => onUpdate(s.idx, { seed: parseInt(e.target.value) || 0 })} />
                    {serverOnline && (
                      <button onClick={() => onGenerate(s.key)} disabled={generating} style={{ ...genBtn, fontSize: 10, opacity: generating ? 0.5 : 1 }}>Gen</button>
                    )}
                    <button onClick={() => onRemove(s.idx)} style={rmBtn}>×</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── NPC Export Tab ────────────────────────────────────────────

function NpcExportTab({ char, characters, onExportYaml, onExportNpc }: {
  char: CharacterDef;
  characters: CharacterDef[];
  onExportYaml: () => void;
  onExportNpc: () => void;
}) {
  const npcSnippet = JSON.stringify({
    id: char.id,
    name: char.id.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    x: 0.5, y: 0.7,
    sprite: char.id,
    dialogue: char.id,
    actions: { talk: [{ cmd: 'start_dialogue', id: char.id }] },
  }, null, 2);

  const animatorSnippet = JSON.stringify({
    [char.id]: {
      idle: char.sprites.filter((s) => s.key.startsWith('idle')).map((s) => s.output),
      walk: char.sprites.filter((s) => s.key.startsWith('walk')).map((s) => s.output),
      talk: char.sprites.filter((s) => s.key.startsWith('talk')).map((s) => s.output),
    },
  }, null, 2);

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={S.panelTitle}>NPC & Export — {char.id}</div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button onClick={onExportYaml} style={exportBtn}>Export characters.yaml</button>
        <button onClick={onExportNpc} style={exportBtn}>Export NPC JSON</button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>NPC Room Data Snippet</div>
        <pre style={codeBlock}>{npcSnippet}</pre>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Sprite Animator Config</div>
        <pre style={codeBlock}>{animatorSnippet}</pre>
      </div>

      <div>
        <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>All Characters Summary</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #444', textAlign: 'left' }}>
              <th style={{ padding: 6, color: '#aaa' }}>Character</th>
              <th style={{ padding: 6, color: '#aaa' }}>Portraits</th>
              <th style={{ padding: 6, color: '#aaa' }}>Sprites</th>
              <th style={{ padding: 6, color: '#aaa' }}>Facing</th>
              <th style={{ padding: 6, color: '#aaa' }}>Seed</th>
            </tr>
          </thead>
          <tbody>
            {characters.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #2a2a3e' }}>
                <td style={{ padding: 6, textTransform: 'capitalize' }}><b>{c.id.replace(/_/g, ' ')}</b></td>
                <td style={{ padding: 6 }}>{c.portraits.length}</td>
                <td style={{ padding: 6 }}>{c.sprites.length}</td>
                <td style={{ padding: 6 }}>{c.facing}</td>
                <td style={{ padding: 6, color: '#888' }}>{c.baseSeed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Shared styles ────────────────────────────────────────────

const lbl: React.CSSProperties = { color: '#888', fontSize: 11, textAlign: 'right', paddingTop: 4 };
const inp: React.CSSProperties = {
  background: '#2a2a3e', color: '#fff', border: '1px solid #555', borderRadius: 3,
  padding: '4px 8px', fontSize: 12, width: '100%', boxSizing: 'border-box',
};
const addBtn: React.CSSProperties = {
  padding: '3px 10px', background: '#4caf50', color: '#fff', border: 'none',
  borderRadius: 3, cursor: 'pointer', fontSize: 12, fontWeight: 600,
};
const rmBtn: React.CSSProperties = {
  padding: '3px 8px', background: '#f44336', color: '#fff', border: 'none',
  borderRadius: 3, cursor: 'pointer', fontSize: 12, fontWeight: 600, flexShrink: 0,
};
const genBtn: React.CSSProperties = {
  padding: '3px 10px', background: '#4040cc', color: '#fff', border: '1px solid #6060ff',
  borderRadius: 3, cursor: 'pointer', fontSize: 11, fontFamily: 'monospace', flexShrink: 0,
};
const exportBtn: React.CSSProperties = {
  padding: '6px 16px', background: '#4caf50', color: '#fff', border: 'none',
  borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600,
};
const codeBlock: React.CSSProperties = {
  background: '#000', color: '#00ff88', padding: 12, borderRadius: 4,
  fontSize: 11, fontFamily: 'monospace', overflow: 'auto', maxHeight: 200,
  border: '1px solid #2a2a4a', whiteSpace: 'pre-wrap',
};
