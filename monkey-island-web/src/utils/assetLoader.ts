const imageCache = new Map<string, HTMLImageElement>();
const loadingPromises = new Map<string, Promise<HTMLImageElement>>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src);
  if (cached) return Promise.resolve(cached);

  const existing = loadingPromises.get(src);
  if (existing) return existing;

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(src, img);
      loadingPromises.delete(src);
      resolve(img);
    };
    img.onerror = () => {
      loadingPromises.delete(src);
      reject(new Error(`Failed to load: ${src}`));
    };
    img.src = src;
  });

  loadingPromises.set(src, promise);
  return promise;
}

export function getImage(src: string): HTMLImageElement | null {
  return imageCache.get(src) ?? null;
}

export async function preloadRoomAssets(roomId: string): Promise<void> {
  const bg = `/assets/backgrounds/${roomId}.png`;
  try {
    await loadImage(bg);
  } catch {
    // Fall back to procedural rendering
  }
}

export async function preloadAllBackgrounds(): Promise<void> {
  const rooms = ['harbor', 'tavern', 'forest', 'beach', 'cave'];
  await Promise.allSettled(rooms.map((r) => loadImage(`/assets/backgrounds/${r}.png`)));
}
