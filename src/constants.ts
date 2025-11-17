import type { Direction, AnimationPattern } from './types';

/**
 * Animation patterns for ignition/extinction sequences
 */
export const Pattern = {
  CASCADE: 'cascade' as AnimationPattern,
  INTERLACED: 'interlaced' as AnimationPattern,
  WAVE: 'wave' as AnimationPattern,
  RANDOM: 'random' as AnimationPattern,
} as const;

/**
 * Directions for scroll and transition animations
 */
export const Directions = {
  TO_RIGHT: 'to-right' as Direction,
  TO_LEFT: 'to-left' as Direction,
  TO_BOTTOM: 'to-bottom' as Direction,
  TO_TOP: 'to-top' as Direction,
  TO_TOP_LEFT: 'to-top-left' as Direction,
  TO_TOP_RIGHT: 'to-top-right' as Direction,
  TO_BOTTOM_LEFT: 'to-bottom-left' as Direction,
  TO_BOTTOM_RIGHT: 'to-bottom-right' as Direction,
} as const;
