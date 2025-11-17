import type { LedState, LeddingOptions } from '../types';
import { isDurationBased } from '../types';

/**
 * Factory for creating LED objects
 */
export function createLedObject(
  i: number,
  j: number,
  initialSize: number,
  baseOpacity: number,
  options: LeddingOptions
): LedState {
  const ignitionConfig = options.transitions.ignition;
  const defaultSpeed = isDurationBased(ignitionConfig) ? 0 : ignitionConfig.min;

  return {
    gridPosition: { i, j },
    baseOpacity,
    currentSize: initialSize,
    targetSize: initialSize,
    currentOpacity: baseOpacity,
    targetOpacity: baseOpacity,
    currentArtValue: 0,
    targetArtValue: 0,
    artValueForColor: 0,
    transitionSpeed: defaultSpeed,
    delayTimer: 0,
    isTransitioning: false,
    isDelayed: false,
    lifespan: 0,
    // Duration-based transition fields
    transitionStartTime: 0,
    transitionDuration: 0,
    transitionEasing: 'linear',
    startSize: initialSize,
    startOpacity: baseOpacity,
    useDurationBased: false,
  };
}
