/**
 * Animation scroll and transition directions
 */
export type Direction =
  | 'to-right'
  | 'to-left'
  | 'to-bottom'
  | 'to-top'
  | 'to-top-left'
  | 'to-top-right'
  | 'to-bottom-left'
  | 'to-bottom-right';

/**
 * Animation patterns for ignition/extinction sequences
 */
export type AnimationPattern = 'cascade' | 'interlaced' | 'wave' | 'random';

/**
 * Easing function names
 */
export type EasingName =
  | 'linear'
  | 'ease-in-quad'
  | 'ease-out-quad'
  | 'ease-in-out-quad'
  | 'ease-in-cubic'
  | 'ease-out-cubic'
  | 'ease-in-out-cubic'
  | 'ease-in-quart'
  | 'ease-out-quart'
  | 'ease-in-out-quart'
  | 'ease-in-quint'
  | 'ease-out-quint'
  | 'ease-in-out-quint'
  | 'ease-in-expo'
  | 'ease-out-expo'
  | 'ease-in-out-expo'
  | 'ease-in-circ'
  | 'ease-out-circ'
  | 'ease-in-out-circ'
  | 'ease-in-back'
  | 'ease-out-back'
  | 'ease-in-out-back'
  | 'ease-in-elastic'
  | 'ease-out-elastic'
  | 'ease-in-out-elastic'
  | 'ease-in-bounce'
  | 'ease-out-bounce'
  | 'ease-in-out-bounce';

/**
 * RGB color as Uint8ClampedArray [r, g, b]
 */
export type RGBArray = Uint8ClampedArray;

/**
 * State of an individual LED
 */
export interface LedState {
  gridPosition: { i: number; j: number };
  baseOpacity: number;
  currentSize: number;
  targetSize: number;
  currentOpacity: number;
  targetOpacity: number;
  currentArtValue: number;
  targetArtValue: number;
  artValueForColor: number;
  transitionSpeed: number;
  delayTimer: number;
  isTransitioning: boolean;
  isDelayed: boolean;
  lifespan: number;
  // Duration-based transition fields
  transitionStartTime: number;
  transitionDuration: number;
  transitionEasing: EasingName;
  startSize: number;
  startOpacity: number;
  useDurationBased: boolean;
}

/**
 * Renderer interface for drawing LEDs
 */
export interface Renderer {
  setup?(instance: LeddingInstance): void;
  draw(
    ctx: CanvasRenderingContext2D,
    led: LedState,
    x: number,
    y: number,
    color: string,
    instance: LeddingInstance
  ): void;
}

/**
 * Aligner interface for positioning art within the grid
 */
export interface Aligner {
  getCoordinates(instance: LeddingInstance): {
    artStartPx: number;
    artStartPxY: number;
  };
}

/**
 * Color configuration
 */
export interface ColorOptions {
  background: string | null;
  base: string;
  states: Record<number, string>;
}

/**
 * Size configuration for LED states
 * Values are multipliers of scaledLedSize (0.0 to 1.0)
 * If not specified, all active states use maxSize (1.0)
 */
export interface SizeOptions {
  states?: Record<number, number>;
}

/**
 * Opacity configuration
 */
export interface OpacityOptions {
  base: { min: number; max: number };
  active: number;
}

/**
 * Scroll animation configuration
 */
export interface ScrollOptions {
  direction: Direction;
  speed: number;
}

/**
 * Ignition/Extinction animation configuration
 */
export interface TransitionAnimationOptions {
  pattern: AnimationPattern;
  direction: Direction;
  delay: number;
  step: number;
}

/**
 * Animation configuration container
 */
export interface AnimationOptions {
  scroll: ScrollOptions;
  ignition: TransitionAnimationOptions;
  extinction: TransitionAnimationOptions;
}

/**
 * Legacy transition speed configuration (lerp-based)
 */
export interface TransitionSpeedOptions {
  min: number;
  max: number;
  randomize: boolean;
}

/**
 * Duration-based transition configuration
 */
export interface TransitionDurationOptions {
  duration: number;
  easing: EasingName;
  delay?: number;
}

/**
 * Combined transition options (supports both old and new APIs)
 */
export type TransitionConfig = TransitionSpeedOptions | TransitionDurationOptions;

/**
 * Type guard to check if config is duration-based
 */
export function isDurationBased(config: TransitionConfig): config is TransitionDurationOptions {
  return 'duration' in config && 'easing' in config;
}

/**
 * Pattern transition strategies
 */
export type PatternTransitionStrategy = 'instant' | 'morph' | 'fade' | 'crossfade';

/**
 * Options for pattern transitions
 */
export interface PatternTransitionOptions {
  duration?: number;
  easing?: EasingName;
  strategy?: PatternTransitionStrategy;
}

/**
 * All transition speed configurations
 */
export interface TransitionsOptions {
  ignition: TransitionConfig;
  extinction: TransitionConfig;
  morph: TransitionConfig;
}

/**
 * Grid configuration
 */
export interface GridOptions {
  fill: boolean;
  lifespan: number;
}

/**
 * Complete Ledding options
 */
export interface LeddingOptions {
  ledSize: number;
  ledGap: number;
  scaleToFit: boolean;
  artPattern: number[][];
  aligner: Aligner;
  renderer: Renderer;
  colors: ColorOptions;
  sizes: SizeOptions;
  opacities: OpacityOptions;
  fps: number;
  animation: AnimationOptions;
  transitions: TransitionsOptions;
  grid: GridOptions;
}

/**
 * Partial options for user configuration (deep partial)
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type LeddingUserOptions = DeepPartial<LeddingOptions>;

/**
 * Internal dimensions cache
 */
export interface DimensionsCache {
  scaledLedSize: number;
  scaledLedGap: number;
  ledFullSize: number;
  gridWidthPx: number;
  gridHeightPx: number;
  minSize: number;
  maxSize: number;
}

/**
 * Art position cache
 */
export interface ArtPosition {
  startPx: number;
  startPxY: number;
  widthPx: number;
  heightPx: number;
}

/**
 * Grid state
 */
export interface GridState {
  leds: LedState[] | Map<string, LedState> | null;
  numCols: number;
  numRows: number;
  isSparse: boolean;
}

/**
 * Parsed colors cache
 */
export interface ParsedColors {
  base: RGBArray | null;
  states: Record<number, RGBArray>;
}

/**
 * Event types for Ledding
 */
export type LeddingEventType = 'beforeDraw' | 'afterDraw' | 'resize' | 'destroy';

/**
 * Event callback function
 */
export type LeddingEventCallback = (instance: LeddingInstance) => void;

/**
 * Main Ledding instance interface (for type safety in renderers/aligners)
 * This is a minimal interface for external use
 */
export interface LeddingInstance {
  container: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  options: LeddingOptions;
  dimensions: DimensionsCache;
  artPosition: ArtPosition;
  grid: GridState;
  parsedColors: ParsedColors;
  scrollX: number;
  scrollY: number;
}
