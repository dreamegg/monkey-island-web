#!/usr/bin/env python3
"""
Generate chiptune-style background music for each game room.
Uses Python's built-in wave module + numpy for synthesis.
No external audio libraries required.
"""
import wave, struct, math, os, random
import numpy as np

OUTDIR = os.path.join(os.path.dirname(__file__), '../../monkey-island-web/public/audio/music')
os.makedirs(OUTDIR, exist_ok=True)

SAMPLE_RATE = 22050
CHANNELS = 1
SAMPWIDTH = 2  # 16-bit

def note_freq(note: str) -> float:
    """Convert note name like 'A4' to frequency."""
    notes = {'C':0,'D':2,'E':4,'F':5,'G':7,'A':9,'B':11}
    base = notes[note[0]]
    sharp = 1 if '#' in note else (-1 if 'b' in note else 0)
    octave = int(note[-1])
    semitones = (octave - 4) * 12 + base + sharp
    return 440.0 * (2 ** (semitones / 12))

def generate_tone(freq: float, duration: float, sample_rate: int,
                  wave_type='square', attack=0.01, release=0.05, volume=0.3) -> np.ndarray:
    """Generate a single tone with envelope."""
    n = int(duration * sample_rate)
    t = np.linspace(0, duration, n, endpoint=False)

    if wave_type == 'square':
        raw = np.sign(np.sin(2 * np.pi * freq * t))
    elif wave_type == 'sine':
        raw = np.sin(2 * np.pi * freq * t)
    elif wave_type == 'triangle':
        raw = 2 * np.abs(2 * (t * freq - np.floor(t * freq + 0.5))) - 1
    elif wave_type == 'sawtooth':
        raw = 2 * (t * freq - np.floor(t * freq + 0.5))
    else:
        raw = np.sin(2 * np.pi * freq * t)

    # Envelope
    env = np.ones(n)
    atk = int(attack * sample_rate)
    rel = int(release * sample_rate)
    if atk > 0:
        env[:atk] = np.linspace(0, 1, atk)
    if rel > 0 and rel < n:
        env[-rel:] = np.linspace(1, 0, rel)

    return (raw * env * volume).astype(np.float32)

def generate_bass_tone(freq: float, duration: float, sample_rate: int, volume=0.25) -> np.ndarray:
    """Generate a bass tone (filtered square wave)."""
    n = int(duration * sample_rate)
    t = np.linspace(0, duration, n, endpoint=False)
    # Combine fundamental + 3rd harmonic for warmth
    raw = (np.sin(2 * np.pi * freq * t) * 0.7 +
           np.sin(2 * np.pi * freq * 2 * t) * 0.2 +
           np.sin(2 * np.pi * freq * 3 * t) * 0.1)
    # Envelope
    atk = int(0.01 * sample_rate)
    rel = int(0.08 * sample_rate)
    env = np.ones(n)
    if atk > 0: env[:atk] = np.linspace(0, 1, atk)
    if rel > 0: env[-rel:] = np.linspace(1, 0, rel)
    return (raw * env * volume).astype(np.float32)

def mix(*tracks) -> np.ndarray:
    """Mix multiple tracks together, extending to the longest."""
    max_len = max(len(t) for t in tracks)
    result = np.zeros(max_len, dtype=np.float32)
    for t in tracks:
        result[:len(t)] += t
    # Normalize to prevent clipping
    peak = np.max(np.abs(result))
    if peak > 0.9:
        result = result * (0.9 / peak)
    return result

def save_wav(samples: np.ndarray, path: str, sample_rate: int = SAMPLE_RATE):
    """Save float32 samples as 16-bit WAV."""
    int_samples = (np.clip(samples, -1.0, 1.0) * 32767).astype(np.int16)
    with wave.open(path, 'w') as f:
        f.setnchannels(CHANNELS)
        f.setsampwidth(SAMPWIDTH)
        f.setframerate(sample_rate)
        f.writeframes(int_samples.tobytes())
    print(f'  Saved: {path} ({len(samples)/sample_rate:.1f}s)')

def repeat(arr: np.ndarray, n: int) -> np.ndarray:
    return np.tile(arr, n)

def silence(duration: float, sr: int = SAMPLE_RATE) -> np.ndarray:
    return np.zeros(int(duration * sr), dtype=np.float32)

# ─── Harbor Theme ─────────────────────────────────────────────
# Jolly pirate sea shanty feel - major key, bouncy 6/8
def make_harbor():
    sr = SAMPLE_RATE
    bpm = 132
    beat = 60.0 / bpm
    # Melody: simple pirate shanty motif
    melody_notes = [
        ('G4', 1), ('E4', 1), ('C4', 2), ('D4', 1), ('E4', 1),
        ('F4', 2), ('D4', 1), ('B3', 1), ('C4', 2), (None, 2),
        ('E4', 1), ('G4', 1), ('A4', 2), ('G4', 1), ('F4', 1),
        ('E4', 2), ('C4', 1), ('D4', 1), ('C4', 4), (None, 2),
    ]
    bass_notes = [
        ('C3', 2), ('C3', 2), ('G2', 2), ('G2', 2),
        ('F2', 2), ('F2', 2), ('G2', 2), ('G2', 2),
        ('C3', 2), ('C3', 2), ('G2', 2), ('G2', 2),
        ('C3', 2), ('G2', 2), ('C3', 4), ('C3', 2),
    ]
    melody = []
    for note, beats in melody_notes:
        dur = beat * beats
        if note:
            melody.append(generate_tone(note_freq(note), dur, sr, 'square', volume=0.28))
        else:
            melody.append(silence(dur, sr))

    bass = []
    for note, beats in bass_notes:
        dur = beat * beats
        bass.append(generate_bass_tone(note_freq(note), dur, sr, volume=0.22))

    m = np.concatenate(melody)
    b = np.concatenate(bass)
    # Pad shorter
    maxlen = max(len(m), len(b))
    m = np.pad(m, (0, maxlen - len(m)))
    b = np.pad(b, (0, maxlen - len(b)))
    track = mix(m, b)
    return repeat(track, 3)

# ─── Tavern Theme ─────────────────────────────────────────────
# Lively pub music - fast triple time
def make_tavern():
    sr = SAMPLE_RATE
    bpm = 160
    beat = 60.0 / bpm
    melody = [
        ('C4',1),('E4',1),('G4',2),('E4',1),('G4',1),('A4',2),
        ('G4',1),('E4',1),('C4',2),('D4',1),('E4',1),('F4',2),
        ('E4',1),('C4',1),('D4',2),('B3',1),('C4',1),('D4',2),
        ('C4',1),('E4',1),('G4',1),('E4',1),('C4',4),(None,2),
    ]
    chord_prog = [
        [('C3',6),('E3',6),('G3',6)],
        [('A2',6),('C3',6),('E3',6)],
        [('F2',6),('A2',6),('C3',6)],
        [('G2',6),('B2',6),('D3',6)],
        [('C3',6),('E3',6),('G3',6)],
        [('A2',6),('C3',6),('E3',6)],
        [('F2',6),('A2',6),('C3',6)],
        [('G2',4),('B2',4),('D3',4),('G2',4),('B2',4),(None,4)],
    ]
    mel_frames = []
    for note, beats in melody:
        dur = beat * beats
        if note:
            mel_frames.append(generate_tone(note_freq(note), dur, sr, 'triangle', volume=0.3))
        else:
            mel_frames.append(silence(dur))

    chord_frames = []
    for chord in chord_prog:
        for note, beats in chord:
            dur = beat * beats
            if note:
                chord_frames.append(generate_bass_tone(note_freq(note), dur, sr, volume=0.15))
            else:
                chord_frames.append(silence(dur))

    m = np.concatenate(mel_frames)
    c = np.concatenate(chord_frames)
    maxlen = max(len(m), len(c))
    m = np.pad(m, (0, maxlen - len(m)))
    c = np.pad(c, (0, maxlen - len(c)))
    track = mix(m, c)
    return repeat(track, 3)

# ─── Forest Theme ─────────────────────────────────────────────
# Mysterious, minor key, slower
def make_forest():
    sr = SAMPLE_RATE
    bpm = 76
    beat = 60.0 / bpm
    melody = [
        ('A3',2),('C4',1),('E4',1),(None,2),('D4',2),('B3',2),
        ('G3',2),(None,2),('A3',2),('C4',1),('E4',1),('F4',2),
        ('E4',2),('C4',1),('A3',1),(None,2),('B3',4),
        (None,4),
    ]
    bass = [
        ('A2',4),('E2',4),('F2',4),('C2',4),
        ('A2',4),('E2',4),('D2',4),('E2',4),
    ]
    mel_frames = []
    for note, beats in melody:
        dur = beat * beats
        if note:
            mel_frames.append(generate_tone(note_freq(note), dur, sr, 'sine', attack=0.05, volume=0.25))
        else:
            mel_frames.append(silence(dur))

    bass_frames = []
    for note, beats in bass:
        dur = beat * beats
        bass_frames.append(generate_bass_tone(note_freq(note), dur, sr, volume=0.2))

    m = np.concatenate(mel_frames)
    b = np.concatenate(bass_frames)
    maxlen = max(len(m), len(b))
    m = np.pad(m, (0, maxlen - len(m)))
    b = np.pad(b, (0, maxlen - len(b)))
    track = mix(m, b)
    return repeat(track, 4)

# ─── Beach Theme ──────────────────────────────────────────────
# Relaxed, tropical, flowing arpeggios
def make_beach():
    sr = SAMPLE_RATE
    bpm = 96
    beat = 60.0 / bpm

    # Arpeggio pattern
    arpeggio_patterns = [
        ['C3','E3','G3','C4','G3','E3'],  # C major
        ['A2','C3','E3','A3','E3','C3'],  # A minor
        ['F2','A2','C3','F3','C3','A2'],  # F major
        ['G2','B2','D3','G3','D3','B2'],  # G major
    ]
    melody = [
        ('G4',2),('E4',2),('C4',2),(None,2),
        ('A4',2),('F4',2),('E4',2),(None,2),
        ('G4',1),('A4',1),('G4',2),('E4',2),(None,2),
        ('C4',2),('D4',2),('E4',4),
    ]
    arp_frames = []
    for pattern in arpeggio_patterns * 2:
        for note in pattern:
            arp_frames.append(generate_tone(note_freq(note), beat * 0.5, sr, 'sine', attack=0.02, release=0.08, volume=0.18))

    mel_frames = []
    for note, beats in melody:
        dur = beat * beats
        if note:
            mel_frames.append(generate_tone(note_freq(note), dur, sr, 'triangle', volume=0.22))
        else:
            mel_frames.append(silence(dur))

    a = np.concatenate(arp_frames)
    m = np.concatenate(mel_frames)
    maxlen = max(len(a), len(m))
    a = np.pad(a, (0, maxlen - len(a)))
    m = np.pad(m, (0, maxlen - len(m)))
    track = mix(a, m)
    return repeat(track, 3)

# ─── Cave Theme ───────────────────────────────────────────────
# Dark, echoing, sparse — low drone + occasional pings
def make_cave():
    sr = SAMPLE_RATE
    bpm = 52
    beat = 60.0 / bpm

    # Low drone
    drone_dur = 16 * beat
    drone = generate_tone(note_freq('A1'), drone_dur, sr, 'sine', attack=0.5, release=1.0, volume=0.2)
    drone2 = generate_tone(note_freq('E2'), drone_dur, sr, 'sine', attack=0.8, release=1.5, volume=0.12)

    # Sparse melody
    pings = [
        (note_freq('A3'), 4 * beat, beat * 0),
        (note_freq('C4'), 2 * beat, beat * 5),
        (note_freq('E4'), 2 * beat, beat * 8),
        (note_freq('D4'), 2 * beat, beat * 11),
        (note_freq('A3'), 4 * beat, beat * 14),
    ]

    total = np.zeros(int(drone_dur * sr), dtype=np.float32)
    for freq, dur, offset in pings:
        off = int(offset * sr)
        t = generate_tone(freq, dur, sr, 'sine', attack=0.1, release=0.5, volume=0.22)
        end = min(off + len(t), len(total))
        total[off:end] += t[:end-off]

    d = np.pad(drone, (0, len(total) - len(drone)))
    d2 = np.pad(drone2, (0, len(total) - len(drone2)))
    track = mix(total, d, d2)
    return repeat(track, 3)

# ─── Village Road Theme ────────────────────────────────────────
# Upbeat town theme, slightly mysterious
def make_village_road():
    sr = SAMPLE_RATE
    bpm = 120
    beat = 60.0 / bpm
    melody = [
        ('E4',1),('G4',1),('A4',2),(None,1),('G4',1),('E4',2),
        ('D4',1),('F4',1),('G4',2),(None,1),('F4',1),('D4',2),
        ('C4',1),('E4',1),('G4',1),('E4',1),('C4',2),(None,2),
        ('D4',1),('F4',1),('A4',2),('G4',2),('E4',2),
    ]
    bass = [
        ('A2',4),('D2',4),('C2',4),('G2',4),
        ('A2',4),('D2',4),('E2',4),('A2',4),
    ]
    mel = []
    for note, beats in melody:
        dur = beat * beats
        if note:
            mel.append(generate_tone(note_freq(note), dur, sr, 'square', volume=0.25))
        else:
            mel.append(silence(dur))
    bs = []
    for note, beats in bass:
        dur = beat * beats
        bs.append(generate_bass_tone(note_freq(note), dur, sr, volume=0.2))
    m = np.concatenate(mel)
    b = np.concatenate(bs)
    maxlen = max(len(m), len(b))
    m = np.pad(m, (0, maxlen - len(m)))
    b = np.pad(b, (0, maxlen - len(b)))
    return repeat(mix(m, b), 3)

# ─── Governor Mansion Theme ────────────────────────────────────
# Stately, baroque-ish, elegant
def make_governor_mansion():
    sr = SAMPLE_RATE
    bpm = 88
    beat = 60.0 / bpm
    melody = [
        ('E4',2),('F#4',1),('G#4',1),('A4',2),(None,2),
        ('B4',2),('A4',1),('G#4',1),('F#4',2),(None,2),
        ('E4',1),('F#4',1),('G#4',1),('A4',1),('B4',2),('E4',2),
        ('A4',4),(None,4),
    ]
    bass = [
        ('A2',4),('E2',4),('C#2',4),('D2',4),
        ('A2',4),('E2',4),('D2',4),('A2',4),
    ]
    mel = []
    for note, beats in melody:
        dur = beat * beats
        if note:
            mel.append(generate_tone(note_freq(note), dur, sr, 'triangle', attack=0.03, volume=0.24))
        else:
            mel.append(silence(dur))
    bs = []
    for note, beats in bass:
        dur = beat * beats
        bs.append(generate_bass_tone(note_freq(note), dur, sr, volume=0.2))
    m = np.concatenate(mel)
    b = np.concatenate(bs)
    maxlen = max(len(m), len(b))
    m = np.pad(m, (0, maxlen - len(m)))
    b = np.pad(b, (0, maxlen - len(b)))
    return repeat(mix(m, b), 3)

# ─── Mansion Interior Theme ────────────────────────────────────
# Tense, sneaking music
def make_mansion_interior():
    sr = SAMPLE_RATE
    bpm = 68
    beat = 60.0 / bpm
    # Sneaky staccato melody
    melody = [
        ('D4',0.5),(None,0.5),('E4',0.5),(None,0.5),('F4',1),(None,2),
        ('E4',0.5),(None,0.5),('D4',0.5),(None,0.5),('C4',1),(None,2),
        ('D4',0.5),(None,0.5),('F4',0.5),(None,0.5),('A4',1),('G4',1),(None,2),
        ('F4',1),('E4',1),('D4',2),(None,4),
    ]
    bass = [
        ('D2',2),(None,2),('A1',2),(None,2),
        ('D2',2),(None,2),('G1',2),(None,2),
        ('D2',2),(None,2),('C2',2),(None,2),
        ('G1',2),('A1',2),('D2',4),
    ]
    mel = []
    for note, beats in melody:
        dur = beat * beats
        if note:
            mel.append(generate_tone(note_freq(note), dur, sr, 'square', attack=0.005, release=0.05, volume=0.22))
        else:
            mel.append(silence(dur))
    bs = []
    for note, beats in bass:
        dur = beat * beats
        if note:
            bs.append(generate_bass_tone(note_freq(note), dur, sr, volume=0.18))
        else:
            bs.append(silence(dur))
    m = np.concatenate(mel)
    b = np.concatenate(bs)
    maxlen = max(len(m), len(b))
    m = np.pad(m, (0, maxlen - len(m)))
    b = np.pad(b, (0, maxlen - len(b)))
    return repeat(mix(m, b), 4)

# ─── Stan's Shop Theme ─────────────────────────────────────────
# Cheesy salesman music, upbeat, major key
def make_stan_shop():
    sr = SAMPLE_RATE
    bpm = 148
    beat = 60.0 / bpm
    melody = [
        ('C4',1),('C4',0.5),('C4',0.5),('E4',1),('G4',2),
        ('A4',1),('G4',1),('E4',1),('C4',1),(None,2),
        ('G4',1),('G4',0.5),('G4',0.5),('F4',1),('E4',2),
        ('D4',1),('E4',1),('F4',1),('G4',1),(None,2),
        ('E4',1),('G4',1),('C5',2),('B4',1),('A4',1),
        ('G4',4),(None,4),
    ]
    bass = [
        ('C2',4),('G1',4),('F1',4),('G1',4),
        ('C2',4),('G1',4),('C2',4),('G1',4),
    ]
    mel = []
    for note, beats in melody:
        dur = beat * beats
        if note:
            mel.append(generate_tone(note_freq(note), dur, sr, 'triangle', volume=0.28))
        else:
            mel.append(silence(dur))
    bs = []
    for note, beats in bass:
        dur = beat * beats
        bs.append(generate_bass_tone(note_freq(note), dur, sr, volume=0.2))
    m = np.concatenate(mel)
    b = np.concatenate(bs)
    maxlen = max(len(m), len(b))
    m = np.pad(m, (0, maxlen - len(m)))
    b = np.pad(b, (0, maxlen - len(b)))
    return repeat(mix(m, b), 3)

# ─── Sword Master Area Theme ───────────────────────────────────
# Tense combat preparation — driving rhythm
def make_sword_master_area():
    sr = SAMPLE_RATE
    bpm = 108
    beat = 60.0 / bpm
    melody = [
        ('A3',1),('C4',1),('E4',2),(None,1),('D4',1),('C4',2),
        ('B3',1),('D4',1),('F4',2),(None,1),('E4',1),('D4',2),
        ('A3',1),('E4',1),('A4',1),('G4',1),('F4',2),(None,2),
        ('E4',2),('C4',2),('A3',4),
    ]
    bass = [
        ('A1',2),('A1',2),('F1',2),('G1',2),
        ('A1',2),('A1',2),('G1',2),('E1',2),
        ('A1',2),('C2',2),('F1',2),('G1',2),
        ('A1',4),('A1',4),
    ]
    mel = []
    for note, beats in melody:
        dur = beat * beats
        if note:
            mel.append(generate_tone(note_freq(note), dur, sr, 'square', volume=0.25))
        else:
            mel.append(silence(dur))
    bs = []
    for note, beats in bass:
        dur = beat * beats
        bs.append(generate_bass_tone(note_freq(note), dur, sr, volume=0.22))
    m = np.concatenate(mel)
    b = np.concatenate(bs)
    maxlen = max(len(m), len(b))
    m = np.pad(m, (0, maxlen - len(m)))
    b = np.pad(b, (0, maxlen - len(b)))
    return repeat(mix(m, b), 3)

# ─── Prison Theme ─────────────────────────────────────────────
# Gloomy, hopeless — minor, slow
def make_prison():
    sr = SAMPLE_RATE
    bpm = 60
    beat = 60.0 / bpm
    melody = [
        ('D3',2),(None,1),('F3',1),('E3',2),(None,2),
        ('D3',1),('C3',1),('D3',1),(None,1),('A2',4),
        ('C3',2),(None,1),('E3',1),('D3',2),(None,2),
        ('C3',2),('D3',2),('A2',4),
    ]
    bass = [
        ('D2',4),('A1',4),('G1',4),('A1',4),
        ('D2',4),('A1',4),('G1',4),('D2',4),
    ]
    mel = []
    for note, beats in melody:
        dur = beat * beats
        if note:
            mel.append(generate_tone(note_freq(note), dur, sr, 'triangle', attack=0.1, volume=0.2))
        else:
            mel.append(silence(dur))
    bs = []
    for note, beats in bass:
        dur = beat * beats
        bs.append(generate_bass_tone(note_freq(note), dur, sr, volume=0.18))
    m = np.concatenate(mel)
    b = np.concatenate(bs)
    maxlen = max(len(m), len(b))
    m = np.pad(m, (0, maxlen - len(m)))
    b = np.pad(b, (0, maxlen - len(b)))
    return repeat(mix(m, b), 4)

# ─── Intro Theme ──────────────────────────────────────────────
# Grand opening fanfare
def make_intro():
    sr = SAMPLE_RATE
    bpm = 100
    beat = 60.0 / bpm
    fanfare = [
        ('C4',1),('E4',1),('G4',1),('C5',2),(None,1),
        ('B4',1),('G4',1),('E4',1),('C4',2),(None,1),
        ('G4',1),('A4',1),('B4',1),('C5',1),('D5',1),('E5',2),
        ('C5',4),(None,4),
        ('E4',1),('G4',1),('C5',2),('B4',1),('A4',1),
        ('G4',2),('E4',2),('C4',4),
    ]
    bass = [
        ('C2',4),('C2',4),('G1',4),('C2',4),
        ('F1',4),('G1',4),('C2',4),('G1',4),
    ]
    mel = []
    for note, beats in fanfare:
        dur = beat * beats
        if note:
            mel.append(generate_tone(note_freq(note), dur, sr, 'square', attack=0.01, volume=0.3))
        else:
            mel.append(silence(dur))
    bs = []
    for note, beats in bass:
        dur = beat * beats
        bs.append(generate_bass_tone(note_freq(note), dur, sr, volume=0.22))
    m = np.concatenate(mel)
    b = np.concatenate(bs)
    maxlen = max(len(m), len(b))
    m = np.pad(m, (0, maxlen - len(m)))
    b = np.pad(b, (0, maxlen - len(b)))
    return repeat(mix(m, b), 2)

# ─── Generate all ─────────────────────────────────────────────
tracks = {
    'harbor':            make_harbor,
    'tavern':            make_tavern,
    'forest':            make_forest,
    'beach':             make_beach,
    'cave':              make_cave,
    'village_road':      make_village_road,
    'governor_mansion':  make_governor_mansion,
    'mansion_interior':  make_mansion_interior,
    'stan_shop':         make_stan_shop,
    'sword_master_area': make_sword_master_area,
    'prison':            make_prison,
    'intro':             make_intro,
}

for name, gen_fn in tracks.items():
    outpath = os.path.join(OUTDIR, f'{name}.wav')
    print(f'Generating {name}...')
    try:
        samples = gen_fn()
        save_wav(samples, outpath)
    except Exception as e:
        print(f'  ERROR: {e}')

print('\nAll audio generated!')
