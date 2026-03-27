/**
 * Game audio manager - handles background music per room with crossfade.
 */

const audioCache = new Map<string, HTMLAudioElement>();
let currentTrack: string | null = null;
let currentAudio: HTMLAudioElement | null = null;
let musicVolume = 0.4;
let musicEnabled = true;

const ROOM_MUSIC: Record<string, string> = {
  harbor: '/audio/music/harbor.wav',
  tavern: '/audio/music/tavern.wav',
  forest: '/audio/music/forest.wav',
  beach: '/audio/music/beach.wav',
  cave: '/audio/music/cave.wav',
};

function getOrCreateAudio(src: string): HTMLAudioElement {
  let audio = audioCache.get(src);
  if (!audio) {
    const base = import.meta.env.BASE_URL;
    const resolvedSrc = src.startsWith('/') && !src.startsWith('//') ? base + src.slice(1) : src;
    audio = new Audio(resolvedSrc);
    audio.loop = true;
    audio.volume = 0;
    audioCache.set(src, audio);
  }
  return audio;
}

function fadeIn(audio: HTMLAudioElement, duration = 1500): void {
  audio.volume = 0;
  audio.play().catch(() => {});
  const steps = 30;
  const stepMs = duration / steps;
  const stepVol = musicVolume / steps;
  let step = 0;
  const id = setInterval(() => {
    step++;
    audio.volume = Math.min(stepVol * step, musicVolume);
    if (step >= steps) clearInterval(id);
  }, stepMs);
}

function fadeOut(audio: HTMLAudioElement, duration = 1000): void {
  const startVol = audio.volume;
  const steps = 20;
  const stepMs = duration / steps;
  const stepVol = startVol / steps;
  let step = 0;
  const id = setInterval(() => {
    step++;
    audio.volume = Math.max(startVol - stepVol * step, 0);
    if (step >= steps) {
      clearInterval(id);
      audio.pause();
      audio.currentTime = 0;
    }
  }, stepMs);
}

export function playRoomMusic(roomId: string): void {
  if (!musicEnabled) return;

  const src = ROOM_MUSIC[roomId];
  if (!src || currentTrack === roomId) return;

  // Fade out current
  if (currentAudio) {
    fadeOut(currentAudio);
  }

  // Fade in new
  currentTrack = roomId;
  currentAudio = getOrCreateAudio(src);
  fadeIn(currentAudio);
}

export function playIntroMusic(): void {
  if (!musicEnabled) return;
  if (currentTrack === 'intro') return;

  if (currentAudio) fadeOut(currentAudio);

  currentTrack = 'intro';
  currentAudio = getOrCreateAudio('/audio/music/intro.wav');
  fadeIn(currentAudio, 2000);
}

export function stopMusic(): void {
  if (currentAudio) {
    fadeOut(currentAudio);
    currentTrack = null;
    currentAudio = null;
  }
}

export function setMusicVolume(vol: number): void {
  musicVolume = Math.max(0, Math.min(1, vol));
  if (currentAudio) currentAudio.volume = musicVolume;
}

export function toggleMusic(): boolean {
  musicEnabled = !musicEnabled;
  if (!musicEnabled) stopMusic();
  return musicEnabled;
}

export function isMusicEnabled(): boolean {
  return musicEnabled;
}
