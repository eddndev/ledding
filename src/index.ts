// Main export
export { Ledding } from './Ledding';

// Types
export type {
  Direction,
  AnimationPattern,
  RGBArray,
  LedState,
  Renderer,
  Aligner,
  ColorOptions,
  OpacityOptions,
  ScrollOptions,
  TransitionAnimationOptions,
  AnimationOptions,
  TransitionSpeedOptions,
  TransitionsOptions,
  GridOptions,
  LeddingOptions,
  LeddingUserOptions,
  DimensionsCache,
  ArtPosition,
  GridState,
  ParsedColors,
  LeddingEventType,
  LeddingEventCallback,
  LeddingInstance,
} from './types';

// Constants
export { Pattern, Directions } from './constants';

// Renderers (tree-shakeable)
export { CircleRenderer, SquareRenderer } from './renderers';

// Aligners (tree-shakeable)
export {
  TopLeftAligner,
  TopAligner,
  TopRightAligner,
  LeftAligner,
  CenterAligner,
  RightAligner,
  BottomLeftAligner,
  BottomAligner,
  BottomRightAligner,
} from './aligners';

// Utilities (tree-shakeable)
export { lerp, clamp, randomBetween, debounce, parseRgbToIntArray, AnimationEngine } from './utils';

// Default configuration
export { defaultOptions, defaultArtPattern } from './defaults';
