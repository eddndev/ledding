// Main export
export { Ledding } from './Ledding';

// Types
export type {
  Direction,
  AnimationPattern,
  EasingName,
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
  TransitionDurationOptions,
  TransitionConfig,
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

// Type guards
export { isDurationBased } from './types';

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

// Easing functions (tree-shakeable)
export {
  easingFunctions,
  getEasingFunction,
  isEasingName,
  linear,
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  easeInCubic,
  easeOutCubic,
  easeInOutCubic,
  easeInQuart,
  easeOutQuart,
  easeInOutQuart,
  easeInQuint,
  easeOutQuint,
  easeInOutQuint,
  easeInExpo,
  easeOutExpo,
  easeInOutExpo,
  easeInCirc,
  easeOutCirc,
  easeInOutCirc,
  easeInBack,
  easeOutBack,
  easeInOutBack,
  easeInElastic,
  easeOutElastic,
  easeInOutElastic,
  easeInBounce,
  easeOutBounce,
  easeInOutBounce,
} from './utils';
export type { EasingFunction } from './utils';

// Default configuration
export { defaultOptions, defaultArtPattern } from './defaults';
