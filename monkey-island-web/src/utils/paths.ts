/**
 * Convert an absolute public path (/assets/...) to a base-relative URL.
 * Required for GitHub Pages where the app is served from a subdirectory.
 *
 * Usage: ap('/assets/sprites/guybrush.png')
 *        → '/monkey-island-web/assets/sprites/guybrush.png' (prod)
 *        → '/assets/sprites/guybrush.png'                   (dev)
 */
export function ap(path: string): string {
  const base = import.meta.env.BASE_URL;
  if (path.startsWith('/') && !path.startsWith('//')) {
    return base + path.slice(1);
  }
  return path;
}
