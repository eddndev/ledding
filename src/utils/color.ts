import type { RGBArray } from '../types';

/**
 * Parse RGB string to Uint8ClampedArray
 */
export function parseRgbToIntArray(rgbString: string): RGBArray {
  const result = new Uint8ClampedArray(3);
  const match = rgbString.match(/\d+/g);

  if (match && match.length >= 3) {
    result[0] = parseInt(match[0], 10);
    result[1] = parseInt(match[1], 10);
    result[2] = parseInt(match[2], 10);
  }

  return result;
}

/**
 * Get interpolated color between base and active colors
 * Uses caching to avoid creating thousands of strings per second
 */
export function getInterpolatedColor(
  led: { currentSize: number; artValueForColor: number },
  baseColor: RGBArray,
  activeColor: RGBArray,
  minSize: number,
  maxSize: number,
  colorCache: Map<number, string>,
  maxCacheSize: number
): string {
  // Fast path: if sizes are equal, avoid division
  if (maxSize === minSize) {
    return `rgb(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]})`;
  }

  let factor = (led.currentSize - minSize) / (maxSize - minSize);

  // Efficient clamping
  if (factor < 0) factor = 0;
  else if (factor > 1) factor = 1;

  // Inline lerp with fast rounding
  const r = (baseColor[0] + (activeColor[0] - baseColor[0]) * factor + 0.5) | 0;
  const g = (baseColor[1] + (activeColor[1] - baseColor[1]) * factor + 0.5) | 0;
  const b = (baseColor[2] + (activeColor[2] - baseColor[2]) * factor + 0.5) | 0;

  // Compact numeric key for cache
  const cacheKey = (r << 16) | (g << 8) | b;

  let colorString = colorCache.get(cacheKey);
  if (colorString === undefined) {
    colorString = `rgb(${r}, ${g}, ${b})`;

    // Limit cache size to prevent memory bloat
    if (colorCache.size >= maxCacheSize) {
      const keysToDelete = Array.from(colorCache.keys()).slice(0, maxCacheSize / 2);
      for (const key of keysToDelete) {
        colorCache.delete(key);
      }
    }

    colorCache.set(cacheKey, colorString);
  }

  return colorString;
}
