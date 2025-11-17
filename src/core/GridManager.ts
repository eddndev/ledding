import type { LedState, GridState, DimensionsCache, LeddingOptions, ArtPosition } from '../types';
import { isDurationBased } from '../types';
import { createLedObject } from './LedFactory';
import { AnimationEngine } from '../utils/AnimationEngine';
import { getEasingFunction } from '../utils/easing';

/**
 * Creates the grid based on configuration
 */
export function createGrid(
  gridState: GridState,
  dimensions: DimensionsCache,
  options: LeddingOptions
): void {
  if (gridState.isSparse) {
    gridState.leds = new Map<string, LedState>();
  } else {
    const leds: LedState[] = [];
    const offSize = dimensions.minSize;
    const { min: minOpacity, max: maxOpacity } = options.opacities.base;

    for (let i = 0; i < gridState.numCols; i++) {
      for (let j = 0; j < gridState.numRows; j++) {
        const baseOpacity = minOpacity + (maxOpacity - minOpacity) * Math.random();
        const led = createLedObject(i, j, offSize, baseOpacity, options);
        leds.push(led);
      }
    }

    gridState.leds = leds;
  }
}

/**
 * Prepares transition parameters for a LED
 */
export function prepareTransition(
  led: LedState,
  targetArtValue: number,
  options: LeddingOptions,
  dimensions: DimensionsCache,
  gridState: GridState
): number {
  const previousArtValue = led.currentArtValue;
  const isIgnition = targetArtValue > 0 && previousArtValue === 0;
  const isExtinction = targetArtValue === 0 && previousArtValue > 0;

  let transitionConfig;
  let animConfig;

  if (isIgnition) {
    transitionConfig = options.transitions.ignition;
    animConfig = options.animation.ignition;
    led.artValueForColor = targetArtValue;
  } else if (isExtinction) {
    transitionConfig = options.transitions.extinction;
    animConfig = options.animation.extinction;
    led.artValueForColor = previousArtValue;
  } else {
    transitionConfig = options.transitions.morph;
    animConfig = { delay: 0 } as typeof options.animation.ignition;
    if (targetArtValue > 0) {
      led.artValueForColor = targetArtValue;
    }
  }

  // Store starting values for interpolation
  led.startSize = led.currentSize;
  led.startOpacity = led.currentOpacity;

  if (transitionConfig) {
    if (isDurationBased(transitionConfig)) {
      // Duration-based transition
      led.useDurationBased = true;
      led.transitionDuration = transitionConfig.duration;
      led.transitionEasing = transitionConfig.easing;
      led.transitionStartTime = performance.now();
      led.transitionSpeed = 0; // Not used in duration-based
    } else {
      // Legacy lerp-based transition
      led.useDurationBased = false;
      if (transitionConfig.randomize) {
        led.transitionSpeed = transitionConfig.min + (transitionConfig.max - transitionConfig.min) * Math.random();
      } else {
        led.transitionSpeed = transitionConfig.min;
      }
    }
  }

  const { maxSize, minSize, scaledLedSize } = dimensions;
  if (targetArtValue > 0) {
    if (targetArtValue === 1) led.targetSize = maxSize;
    else if (targetArtValue === 2) led.targetSize = scaledLedSize * 0.7;
    else led.targetSize = scaledLedSize * 0.4;
  } else {
    led.targetSize = minSize;
  }

  if (targetArtValue > 0) {
    led.targetOpacity = options.opacities.active;
  } else {
    led.targetOpacity = led.baseOpacity;
  }

  return AnimationEngine.calculateDelay(led, gridState.numCols, gridState.numRows, animConfig);
}

/**
 * Updates a single LED state
 */
export function updateSingleLedState(
  led: LedState,
  newArtValue: number,
  options: LeddingOptions,
  dimensions: DimensionsCache,
  gridState: GridState
): void {
  const targetChanged = led.targetArtValue !== newArtValue;
  led.targetArtValue = newArtValue;

  if (gridState.isSparse) {
    if (targetChanged && newArtValue > 0) {
      led.lifespan = options.grid.lifespan;
    }

    if (newArtValue === 0 && led.lifespan > 0) {
      led.lifespan -= 1;
    }
  }

  if (targetChanged) {
    led.delayTimer = prepareTransition(led, led.targetArtValue, options, dimensions, gridState);

    if (led.delayTimer > 0) {
      led.isDelayed = true;
      led.isTransitioning = false;
    } else {
      led.isDelayed = false;
      led.isTransitioning = true;
    }
  }

  if (led.isDelayed) {
    led.delayTimer -= 1;
    if (led.delayTimer <= 0) {
      led.isDelayed = false;
      led.isTransitioning = true;
      prepareTransition(led, led.targetArtValue, options, dimensions, gridState);
    }
    return;
  }

  if (led.isTransitioning) {
    const speed = led.transitionSpeed;

    led.currentSize += (led.targetSize - led.currentSize) * speed;
    led.currentOpacity += (led.targetOpacity - led.currentOpacity) * speed;

    const threshold = 0.01;
    const sizeFinished = Math.abs(led.currentSize - led.targetSize) < threshold;
    const opacityFinished = Math.abs(led.currentOpacity - led.targetOpacity) < threshold;

    if (sizeFinished && opacityFinished) {
      led.currentSize = led.targetSize;
      led.currentOpacity = led.targetOpacity;
      led.currentArtValue = led.targetArtValue;
      led.isTransitioning = false;

      if (led.currentArtValue === 0) {
        led.artValueForColor = 0;
      }
    }
  }
}

/**
 * Get art value at LED position
 */
export function getArtValueAt(
  led: LedState,
  dimensions: DimensionsCache,
  artPosition: ArtPosition,
  artPattern: number[][],
  scrollX: number,
  scrollY: number
): number {
  const { ledFullSize, gridWidthPx, gridHeightPx } = dimensions;
  const { startPx, startPxY, widthPx, heightPx } = artPosition;

  const baseX = led.gridPosition.i * ledFullSize;
  const baseY = led.gridPosition.j * ledFullSize;

  let wrappedLedCenterX = (baseX + scrollX) % gridWidthPx;
  if (wrappedLedCenterX < 0) wrappedLedCenterX += gridWidthPx;

  let wrappedLedCenterY = (baseY + scrollY) % gridHeightPx;
  if (wrappedLedCenterY < 0) wrappedLedCenterY += gridHeightPx;

  if (
    wrappedLedCenterX >= startPx &&
    wrappedLedCenterX < startPx + widthPx &&
    wrappedLedCenterY >= startPxY &&
    wrappedLedCenterY < startPxY + heightPx
  ) {
    const artColIndex = ((wrappedLedCenterX - startPx) / ledFullSize) | 0;
    const artRowIndex = ((wrappedLedCenterY - startPxY) / ledFullSize) | 0;

    return artPattern[artRowIndex]?.[artColIndex] ?? 0;
  }

  return 0;
}

/**
 * Update sparse grid (optimized mode)
 */
export function updateSparseGrid(
  gridState: GridState,
  dimensions: DimensionsCache,
  artPosition: ArtPosition,
  options: LeddingOptions,
  scrollX: number,
  scrollY: number
): void {
  const ledsMap = gridState.leds as Map<string, LedState>;
  if (!ledsMap) return;

  const { ledFullSize } = dimensions;
  const { numCols, numRows } = gridState;
  const artPattern = options.artPattern;
  const { startPx, startPxY } = artPosition;

  const activeLedsKeys = new Set<string>();

  const artRowsCount = artPattern.length;
  const artColsCount = artPattern[0]?.length || 0;

  for (let r = 0; r < artRowsCount; r++) {
    for (let c = 0; c < artColsCount; c++) {
      const artValue = artPattern[r][c];

      if (artValue > 0) {
        const cellX = startPx + c * ledFullSize;
        const cellY = startPxY + r * ledFullSize;

        let i = Math.round((cellX - scrollX) / ledFullSize);
        i = ((i % numCols) + numCols) % numCols;

        let j = Math.round((cellY - scrollY) / ledFullSize);
        j = ((j % numRows) + numRows) % numRows;

        const key = `${i},${j}`;
        let led = ledsMap.get(key);

        if (!led) {
          const offSize = dimensions.minSize;
          const { min: minOpacity, max: maxOpacity } = options.opacities.base;
          const baseOpacity = minOpacity + (maxOpacity - minOpacity) * Math.random();
          led = createLedObject(i, j, offSize, baseOpacity, options);
          ledsMap.set(key, led);
        }

        updateSingleLedState(led, artValue, options, dimensions, gridState);
        activeLedsKeys.add(key);
      }
    }
  }

  for (const key of ledsMap.keys()) {
    if (!activeLedsKeys.has(key)) {
      const led = ledsMap.get(key)!;
      updateSingleLedState(led, 0, options, dimensions, gridState);
      if (led.currentArtValue === 0 && led.lifespan <= 0) {
        ledsMap.delete(key);
      }
    }
  }
}

/**
 * Update classic grid (fill mode)
 */
export function updateClassicGrid(
  gridState: GridState,
  dimensions: DimensionsCache,
  artPosition: ArtPosition,
  options: LeddingOptions,
  scrollX: number,
  scrollY: number
): void {
  const leds = gridState.leds as LedState[];
  if (!leds || leds.length === 0) return;

  const len = leds.length;
  for (let i = 0; i < len; i++) {
    const led = leds[i];
    const artValue = getArtValueAt(led, dimensions, artPosition, options.artPattern, scrollX, scrollY);
    updateSingleLedState(led, artValue, options, dimensions, gridState);
  }
}
