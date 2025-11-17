import type {
  LeddingOptions,
  LeddingUserOptions,
  DimensionsCache,
  ArtPosition,
  GridState,
  ParsedColors,
  LedState,
  LeddingEventType,
  LeddingEventCallback,
  PatternTransitionOptions,
  PatternTransitionStrategy,
  EasingName,
  PlaylistItem,
  PlaylistOptions,
  PlaylistState,
} from './types';
import { defaultOptions } from './defaults';
import { debounce } from './utils/debounce';
import { parseRgbToIntArray } from './utils/color';
import { Directions } from './constants';
import { createGrid, updateSparseGrid, updateClassicGrid } from './core/GridManager';

/**
 * Deep merge utility for options
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepMergeAny(target: any, source: any): any {
  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = target[key];

      if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMergeAny(targetValue, sourceValue);
      } else if (sourceValue !== undefined) {
        result[key] = sourceValue;
      }
    }
  }

  return result;
}

function deepMerge(target: LeddingOptions, source: LeddingUserOptions): LeddingOptions {
  return deepMergeAny(target, source) as LeddingOptions;
}

/**
 * Main Ledding class for LED matrix animations
 */
export class Ledding {
  // DOM elements
  container: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  // Configuration
  options: LeddingOptions;

  // Animation state
  animationFrameId: number | null = null;
  lastFrameTime = 0;
  frameInterval: number;
  scrollX = 0;
  scrollY = 0;

  // Grid state
  grid: GridState;

  // Caches
  dimensions: DimensionsCache;
  artPosition: ArtPosition;
  parsedColors: ParsedColors;

  // Performance optimizations
  _colorCache: Map<number, string>;
  _colorCacheMaxSize = 1000;

  // Bound functions for proper cleanup
  _boundHandleVisibilityChange: (() => void) | null;
  _boundAnimate: ((timestamp: number) => void) | null;
  _debouncedSetup: (() => void) | null = null;

  // Event system
  private _eventListeners: Map<LeddingEventType, Set<LeddingEventCallback>> = new Map();

  // Running state
  private _isRunning = false;
  private _isPaused = false;

  // Circle path for optimized rendering
  unitCirclePath?: Path2D;

  // Pattern transition state
  private _patternTransition: {
    isActive: boolean;
    strategy: PatternTransitionStrategy;
    startTime: number;
    duration: number;
    easing: EasingName;
    oldPattern: number[][];
    newPattern: number[][];
    phase: 'fadeOut' | 'fadeIn' | 'morphing';
  } | null = null;

  // Grid size tracking for maximum dimensions
  private _maxPatternCols: number = 0;
  private _maxPatternRows: number = 0;

  // Playlist state
  private _playlist: {
    items: PlaylistItem[];
    options: PlaylistOptions;
    currentIndex: number;
    isPlaying: boolean;
    isPaused: boolean;
    timeoutId: ReturnType<typeof setTimeout> | null;
    startTime: number;
    pauseTime: number;
    elapsedBeforePause: number;
    loopsCompleted: number;
    shuffledIndices: number[];
    originalItems: PlaylistItem[];
  } | null = null;

  constructor(targetSelector: string, userOptions: LeddingUserOptions = {}) {
    const container = document.querySelector<HTMLElement>(targetSelector);
    if (!container) {
      throw new Error(`Ledding: Element "${targetSelector}" not found.`);
    }

    this.container = container;

    // Deep merge options
    this.options = deepMerge(defaultOptions, userOptions);

    // Create canvas
    this.canvas = document.createElement('canvas');
    const contextOptions: CanvasRenderingContext2DSettings = {
      alpha: this.options.colors.background === null,
    };
    const ctx = this.canvas.getContext('2d', contextOptions);

    if (!ctx) {
      throw new Error('Ledding: Could not get 2D context from canvas.');
    }

    this.ctx = ctx as CanvasRenderingContext2D;

    // Initialize frame interval
    this.frameInterval = 1000 / this.options.fps;

    // Initialize grid state
    this.grid = {
      leds: null,
      numCols: 0,
      numRows: 0,
      isSparse: !this.options.grid.fill,
    };

    // Initialize caches
    this.dimensions = {
      scaledLedSize: 0,
      scaledLedGap: 0,
      ledFullSize: 0,
      gridWidthPx: 0,
      gridHeightPx: 0,
      minSize: 0,
      maxSize: 0,
    };

    this.artPosition = {
      startPx: 0,
      startPxY: 0,
      widthPx: 0,
      heightPx: 0,
    };

    this.parsedColors = { base: null, states: {} };
    this._colorCache = new Map();

    // Bind functions once for proper cleanup
    this._boundHandleVisibilityChange = this._handleVisibilityChange.bind(this);
    this._boundAnimate = this._animate.bind(this);

    // Initialize
    this._init();
  }

  /**
   * Initialize the Ledding instance
   */
  private _init(): void {
    this.container.appendChild(this.canvas);

    if (this.options.renderer.setup) {
      this.options.renderer.setup(this);
    }

    // Track initial pattern dimensions
    this._maxPatternCols = this.options.artPattern[0]?.length || 0;
    this._maxPatternRows = this.options.artPattern.length;

    this.setup();
    this._bindEvents();

    this.lastFrameTime = performance.now();
    this._isRunning = true;
    this._boundAnimate!(this.lastFrameTime);
  }

  /**
   * Setup canvas dimensions and grid
   */
  setup(): void {
    this.canvas.width = this.container.offsetWidth;
    this.canvas.height = this.container.offsetHeight;

    let scaledLedSize = this.options.ledSize;
    let scaledLedGap = this.options.ledGap;

    const artPattern = this.options.artPattern;
    const artCols = artPattern[0]?.length || 0;
    const artRows = artPattern.length;

    // Use maximum tracked dimensions for grid sizing (prevents shrinking)
    const effectiveCols = Math.max(artCols, this._maxPatternCols);
    const effectiveRows = Math.max(artRows, this._maxPatternRows);

    // Scale to fit logic - use maximum dimensions
    if (this.options.scaleToFit) {
      const artRequiredWidth = effectiveCols * (this.options.ledSize + this.options.ledGap);
      const artRequiredHeight = effectiveRows * (this.options.ledSize + this.options.ledGap);

      if (artRequiredWidth > 0 && artRequiredHeight > 0) {
        const scaleFactor = Math.min(
          this.canvas.width / artRequiredWidth,
          this.canvas.height / artRequiredHeight
        );
        if (scaleFactor < 1) {
          scaledLedSize *= scaleFactor;
          scaledLedGap *= scaleFactor;
        }
      }
    }

    // Store pre-calculations
    this.dimensions.scaledLedSize = scaledLedSize;
    this.dimensions.scaledLedGap = scaledLedGap;
    this.dimensions.maxSize = scaledLedSize;
    this.dimensions.minSize = scaledLedSize * 0.2;

    const ledFullSize = scaledLedSize + scaledLedGap;
    this.dimensions.ledFullSize = ledFullSize;

    if (ledFullSize <= 0) return;

    // Calculate grid dimensions
    const buffer = 2;
    const requiredColsByCanvas = Math.ceil(this.canvas.width / ledFullSize) + buffer;
    const requiredRowsByCanvas = Math.ceil(this.canvas.height / ledFullSize) + buffer;

    if (this.grid.isSparse) {
      this.grid.numCols = Math.max(requiredColsByCanvas, effectiveCols);
      this.grid.numRows = Math.max(requiredRowsByCanvas, effectiveRows);
    } else {
      this.grid.numCols = requiredColsByCanvas;
      this.grid.numRows = requiredRowsByCanvas;
    }

    this.dimensions.gridWidthPx = this.grid.numCols * ledFullSize;
    this.dimensions.gridHeightPx = this.grid.numRows * ledFullSize;

    // Initialize grid and colors
    createGrid(this.grid, this.dimensions, this.options);
    this._initializeColors();

    // Emit resize event
    this._emit('resize');
  }

  /**
   * Bind event listeners
   */
  private _bindEvents(): void {
    this._debouncedSetup = debounce(() => this.setup(), 250);
    window.addEventListener('resize', this._debouncedSetup);
    document.addEventListener('visibilitychange', this._boundHandleVisibilityChange!);
  }

  /**
   * Handle visibility change
   */
  private _handleVisibilityChange(): void {
    if (document.hidden) {
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    } else if (this._isRunning && !this._isPaused) {
      this.lastFrameTime = performance.now();
      this._boundAnimate!(this.lastFrameTime);
    }
  }

  /**
   * Animation loop
   */
  private _animate(timestamp: number): void {
    if (!this._isRunning || this._isPaused) return;

    this.animationFrameId = requestAnimationFrame(this._boundAnimate!);

    const elapsed = timestamp - this.lastFrameTime;
    if (elapsed < this.frameInterval) return;

    const deltaTime = elapsed / 1000;
    this.lastFrameTime = timestamp - (elapsed % this.frameInterval);

    this._update(deltaTime);
    this.draw();
  }

  /**
   * Update animation state
   */
  private _update(deltaTime: number): void {
    if (!this.grid.leds) return;

    // Update pattern transition state
    this._updatePatternTransition();

    const animConfig = this.options.animation.scroll;
    const speed = animConfig.speed * deltaTime;
    const diagonalSpeed = speed * 0.70710678118;

    switch (animConfig.direction) {
      case Directions.TO_LEFT:
        this.scrollX -= speed;
        break;
      case Directions.TO_RIGHT:
        this.scrollX += speed;
        break;
      case Directions.TO_TOP:
        this.scrollY -= speed;
        break;
      case Directions.TO_BOTTOM:
        this.scrollY += speed;
        break;
      case Directions.TO_TOP_LEFT:
        this.scrollX -= diagonalSpeed;
        this.scrollY -= diagonalSpeed;
        break;
      case Directions.TO_TOP_RIGHT:
        this.scrollX += diagonalSpeed;
        this.scrollY -= diagonalSpeed;
        break;
      case Directions.TO_BOTTOM_LEFT:
        this.scrollX -= diagonalSpeed;
        this.scrollY += diagonalSpeed;
        break;
      case Directions.TO_BOTTOM_RIGHT:
        this.scrollX += diagonalSpeed;
        this.scrollY += diagonalSpeed;
        break;
    }

    const ledFullSize = this.dimensions.ledFullSize;
    const { artStartPx, artStartPxY } = this.options.aligner.getCoordinates(this);

    this.artPosition = {
      startPx: artStartPx,
      startPxY: artStartPxY,
      widthPx: (this.options.artPattern[0]?.length || 0) * ledFullSize,
      heightPx: this.options.artPattern.length * ledFullSize,
    };

    if (this.grid.isSparse) {
      updateSparseGrid(this.grid, this.dimensions, this.artPosition, this.options, this.scrollX, this.scrollY);
    } else {
      updateClassicGrid(this.grid, this.dimensions, this.artPosition, this.options, this.scrollX, this.scrollY);
    }
  }

  /**
   * Draw the current frame
   */
  draw(): void {
    if (!this.grid.leds) return;

    this._emit('beforeDraw');

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.options.colors.background) {
      this.ctx.fillStyle = this.options.colors.background;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    const { ledFullSize, gridWidthPx, gridHeightPx } = this.dimensions;
    const renderer = this.options.renderer;
    const ctx = this.ctx;
    const scrollX = this.scrollX;
    const scrollY = this.scrollY;

    const ledsIterable = this.grid.isSparse
      ? (this.grid.leds as Map<string, LedState>).values()
      : (this.grid.leds as LedState[]);

    for (const led of ledsIterable) {
      const baseX = led.gridPosition.i * ledFullSize;
      const baseY = led.gridPosition.j * ledFullSize;

      let ledCenterX = (baseX + scrollX) % gridWidthPx;
      if (ledCenterX < 0) ledCenterX += gridWidthPx;

      let ledCenterY = (baseY + scrollY) % gridHeightPx;
      if (ledCenterY < 0) ledCenterY += gridHeightPx;

      const color = this._getInterpolatedColor(led);
      ctx.globalAlpha = led.currentOpacity;

      renderer.draw(ctx, led, ledCenterX, ledCenterY, color, this);
    }

    ctx.globalAlpha = 1.0;

    this._emit('afterDraw');
  }

  /**
   * Initialize color caches
   */
  private _initializeColors(): void {
    this.parsedColors.base = parseRgbToIntArray(this.options.colors.base);
    this.parsedColors.states = {};

    for (const key in this.options.colors.states) {
      if (Object.prototype.hasOwnProperty.call(this.options.colors.states, key)) {
        this.parsedColors.states[key] = parseRgbToIntArray(this.options.colors.states[key]);
      }
    }
  }

  /**
   * Get interpolated color for a LED
   * Color interpolation is based on transition progress, NOT size
   */
  private _getInterpolatedColor(led: LedState): string {
    const baseColor = this.parsedColors.base!;
    const activeColor = this.parsedColors.states[led.artValueForColor] || baseColor;

    // If LED is fully transitioned (not transitioning), use full color
    if (!led.isTransitioning && !led.isDelayed) {
      if (led.artValueForColor === 0) {
        return this.options.colors.base;
      }
      return this.options.colors.states[led.artValueForColor] || this.options.colors.base;
    }

    // If colors are identical, return immediately
    if (baseColor === activeColor) {
      if (led.artValueForColor === 0) {
        return this.options.colors.base;
      }
      return this.options.colors.states[led.artValueForColor] || this.options.colors.base;
    }

    // Calculate interpolation factor based on OPACITY transition, not size
    // This ensures color matches the visual "activation" state
    const { min: minOpacity } = this.options.opacities.base;
    const activeOpacity = this.options.opacities.active;
    const opacityRange = activeOpacity - minOpacity;

    let factor: number;
    if (opacityRange === 0) {
      factor = 1;
    } else {
      factor = (led.currentOpacity - minOpacity) / opacityRange;
    }

    if (factor < 0) factor = 0;
    else if (factor > 1) factor = 1;

    const r = (baseColor[0] + (activeColor[0] - baseColor[0]) * factor + 0.5) | 0;
    const g = (baseColor[1] + (activeColor[1] - baseColor[1]) * factor + 0.5) | 0;
    const b = (baseColor[2] + (activeColor[2] - baseColor[2]) * factor + 0.5) | 0;

    const cacheKey = (r << 16) | (g << 8) | b;

    let colorString = this._colorCache.get(cacheKey);
    if (colorString === undefined) {
      colorString = `rgb(${r}, ${g}, ${b})`;

      if (this._colorCache.size >= this._colorCacheMaxSize) {
        const keysToDelete = Array.from(this._colorCache.keys()).slice(0, this._colorCacheMaxSize / 2);
        for (const key of keysToDelete) {
          this._colorCache.delete(key);
        }
      }

      this._colorCache.set(cacheKey, colorString);
    }

    return colorString;
  }

  /**
   * Pause the animation
   */
  pause(): void {
    if (!this._isPaused) {
      this._isPaused = true;
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    }
  }

  /**
   * Resume the animation
   */
  resume(): void {
    if (this._isPaused && this._isRunning) {
      this._isPaused = false;
      this.lastFrameTime = performance.now();
      this._boundAnimate!(this.lastFrameTime);
    }
  }

  /**
   * Check if animation is running
   */
  get isRunning(): boolean {
    return this._isRunning && !this._isPaused;
  }

  /**
   * Set a new art pattern with optional transition
   */
  setPattern(pattern: number[][], options?: PatternTransitionOptions): void {
    const newCols = pattern[0]?.length || 0;
    const newRows = pattern.length;

    // Track maximum dimensions (grid never shrinks)
    if (newCols > this._maxPatternCols || newRows > this._maxPatternRows) {
      this._maxPatternCols = Math.max(this._maxPatternCols, newCols);
      this._maxPatternRows = Math.max(this._maxPatternRows, newRows);
    }

    // Determine transition strategy
    const strategy: PatternTransitionStrategy = options?.strategy || 'instant';
    const duration = options?.duration || 0;
    const easing: EasingName = options?.easing || 'ease-in-out-cubic';

    // If no duration or instant strategy, do immediate change
    if (strategy === 'instant' || duration <= 0) {
      this.options.artPattern = pattern;
      this.setup();
      return;
    }

    // Store old pattern for transition
    const oldPattern = this.options.artPattern;

    // Start pattern transition
    this._patternTransition = {
      isActive: true,
      strategy,
      startTime: performance.now(),
      duration,
      easing,
      oldPattern,
      newPattern: pattern,
      phase: strategy === 'fade' ? 'fadeOut' : 'morphing',
    };

    if (strategy === 'morph' || strategy === 'crossfade') {
      // For morph and crossfade, immediately swap the pattern
      // The LED-level transitions will create smooth animation
      this.options.artPattern = pattern;

      // Only call setup if grid needs to grow for larger pattern
      const currentArtCols = oldPattern[0]?.length || 0;
      const currentArtRows = oldPattern.length;

      if (newCols > currentArtCols || newRows > currentArtRows) {
        // Grid may need to be larger, setup will handle it
        this.setup();
      }
      // For morph, the grid update will naturally trigger LED transitions
      // because the artPattern changed and LEDs will see new target values
    } else if (strategy === 'fade') {
      // For fade, we'll handle it in the update loop
      // Phase 1: fade out current pattern (set all to 0)
      // Phase 2: swap pattern and fade in
      this._startFadeOut();
    }
  }

  /**
   * Start fade out phase for fade transition
   */
  private _startFadeOut(): void {
    if (!this._patternTransition) return;

    // Create a temporary pattern of all zeros to fade out
    const oldPattern = this._patternTransition.oldPattern;
    const rows = oldPattern.length;
    const cols = oldPattern[0]?.length || 0;

    // Create all-zero pattern of same size
    const fadeOutPattern: number[][] = [];
    for (let r = 0; r < rows; r++) {
      fadeOutPattern[r] = new Array(cols).fill(0);
    }

    // Set the fade-out pattern (all LEDs will start extinction)
    this.options.artPattern = fadeOutPattern;
    this._patternTransition.phase = 'fadeOut';
  }

  /**
   * Check and update pattern transition state
   */
  private _updatePatternTransition(): void {
    if (!this._patternTransition || !this._patternTransition.isActive) return;

    const now = performance.now();
    const elapsed = now - this._patternTransition.startTime;
    const progress = Math.min(elapsed / this._patternTransition.duration, 1);

    if (this._patternTransition.strategy === 'morph' || this._patternTransition.strategy === 'crossfade') {
      // For morph/crossfade, transition is complete when duration passes
      // The actual visual transition is handled by individual LED transitions
      if (progress >= 1) {
        this._patternTransition.isActive = false;
        this._patternTransition = null;
      }
    } else if (this._patternTransition.strategy === 'fade') {
      if (this._patternTransition.phase === 'fadeOut') {
        // Check if all LEDs have completed extinction (or halfway through duration)
        if (progress >= 0.5) {
          // Switch to fade in phase
          this._patternTransition.phase = 'fadeIn';
          this.options.artPattern = this._patternTransition.newPattern;

          // May need to setup for new pattern size
          const newCols = this._patternTransition.newPattern[0]?.length || 0;
          const newRows = this._patternTransition.newPattern.length;
          const oldCols = this._patternTransition.oldPattern[0]?.length || 0;
          const oldRows = this._patternTransition.oldPattern.length;

          if (newCols > oldCols || newRows > oldRows) {
            this.setup();
          }
        }
      } else if (this._patternTransition.phase === 'fadeIn') {
        // Complete when full duration is done
        if (progress >= 1) {
          this._patternTransition.isActive = false;
          this._patternTransition = null;
        }
      }
    }
  }

  /**
   * Get current frame rate
   */
  getFrameRate(): number {
    return this.options.fps;
  }

  /**
   * Get current LED count
   */
  getLedCount(): number {
    if (!this.grid.leds) return 0;

    if (this.grid.isSparse) {
      return (this.grid.leds as Map<string, LedState>).size;
    }

    return (this.grid.leds as LedState[]).length;
  }

  /**
   * Add event listener
   */
  on(event: LeddingEventType, callback: LeddingEventCallback): void {
    if (!this._eventListeners.has(event)) {
      this._eventListeners.set(event, new Set());
    }
    this._eventListeners.get(event)!.add(callback);
  }

  /**
   * Remove event listener
   */
  off(event: LeddingEventType, callback: LeddingEventCallback): void {
    const listeners = this._eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Emit event
   */
  private _emit(event: LeddingEventType): void {
    const listeners = this._eventListeners.get(event);
    if (listeners) {
      for (const callback of listeners) {
        callback(this);
      }
    }
  }

  /**
   * Destroy the instance and clean up resources
   */
  destroy(): void {
    this._isRunning = false;
    this._isPaused = false;

    // Clear playlist
    this.clearPlaylist();

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this._debouncedSetup) {
      window.removeEventListener('resize', this._debouncedSetup);
    }

    if (this._boundHandleVisibilityChange) {
      document.removeEventListener('visibilitychange', this._boundHandleVisibilityChange);
    }

    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }

    // Clean up references
    this._boundHandleVisibilityChange = null;
    this._boundAnimate = null;
    this._debouncedSetup = null;
    this._colorCache.clear();
    this._eventListeners.clear();

    this._emit('destroy');
  }

  /**
   * Set up a playlist of patterns with automatic transitions
   */
  setPlaylist(items: PlaylistItem[], options: PlaylistOptions = {}): void {
    // Validate playlist
    if (!items || items.length === 0) {
      console.warn('Ledding: Cannot set empty playlist');
      return;
    }

    // Validate items have valid patterns
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.pattern || item.pattern.length === 0 || !item.pattern[0] || item.pattern[0].length === 0) {
        console.warn(`Ledding: Playlist item ${i} has invalid pattern`);
        return;
      }
      if (typeof item.hold !== 'number' || item.hold < 0) {
        console.warn(`Ledding: Playlist item ${i} has invalid hold time`);
        return;
      }
    }

    // Clear existing playlist
    this.clearPlaylist();

    // Process items based on options
    let processedItems = [...items];
    let shuffledIndices = items.map((_, i) => i);

    // Handle reverse
    if (options.reverse) {
      processedItems = processedItems.reverse();
      shuffledIndices = shuffledIndices.reverse();
    }

    // Handle shuffle
    if (options.shuffle) {
      const shuffleResult = this._shuffleArray(processedItems.map((item, i) => ({ item, originalIndex: shuffledIndices[i] })));
      processedItems = shuffleResult.map(r => r.item);
      shuffledIndices = shuffleResult.map(r => r.originalIndex);
    }

    // Determine start index
    let startIndex = options.startIndex || 0;
    if (startIndex < 0 || startIndex >= processedItems.length) {
      startIndex = 0;
    }

    // Initialize playlist state
    this._playlist = {
      items: processedItems,
      options: {
        loop: options.loop ?? false,
        autoStart: options.autoStart ?? true,
        shuffle: options.shuffle ?? false,
        reverse: options.reverse ?? false,
        speed: options.speed ?? 1,
        startIndex: startIndex,
        onComplete: options.onComplete,
        onPatternChange: options.onPatternChange,
      },
      currentIndex: startIndex,
      isPlaying: false,
      isPaused: false,
      timeoutId: null,
      startTime: 0,
      pauseTime: 0,
      elapsedBeforePause: 0,
      loopsCompleted: 0,
      shuffledIndices: shuffledIndices,
      originalItems: items,
    };

    // Start with the first pattern (or startIndex)
    this._transitionToPlaylistItem(startIndex, true);

    // Auto-start if configured
    if (options.autoStart !== false) {
      this.playPlaylist();
    }
  }

  /**
   * Start or resume playlist playback
   */
  playPlaylist(): void {
    if (!this._playlist) {
      console.warn('Ledding: No playlist set');
      return;
    }

    if (this._playlist.isPlaying && !this._playlist.isPaused) {
      return; // Already playing
    }

    if (this._playlist.isPaused) {
      // Resume from pause
      this._playlist.isPaused = false;
      this._playlist.isPlaying = true;

      // Calculate remaining time
      const remainingTime = this._getRemainingHoldTime();
      this._scheduleNextPattern(remainingTime);
    } else {
      // Start fresh
      this._playlist.isPlaying = true;
      this._playlist.isPaused = false;
      this._scheduleNextPattern();
    }
  }

  /**
   * Pause playlist playback
   */
  pausePlaylist(): void {
    if (!this._playlist || !this._playlist.isPlaying) return;

    this._playlist.isPaused = true;
    this._playlist.pauseTime = performance.now();

    // Calculate elapsed time in current hold
    const elapsed = this._playlist.pauseTime - this._playlist.startTime;
    this._playlist.elapsedBeforePause = elapsed;

    // Clear the scheduled timeout
    if (this._playlist.timeoutId !== null) {
      clearTimeout(this._playlist.timeoutId);
      this._playlist.timeoutId = null;
    }
  }

  /**
   * Stop playlist and reset to beginning
   */
  stopPlaylist(): void {
    if (!this._playlist) return;

    // Clear timeout
    if (this._playlist.timeoutId !== null) {
      clearTimeout(this._playlist.timeoutId);
      this._playlist.timeoutId = null;
    }

    this._playlist.isPlaying = false;
    this._playlist.isPaused = false;
    this._playlist.currentIndex = this._playlist.options.startIndex || 0;
    this._playlist.loopsCompleted = 0;
    this._playlist.elapsedBeforePause = 0;
    this._playlist.startTime = 0;
    this._playlist.pauseTime = 0;
  }

  /**
   * Go to next pattern in playlist
   */
  nextPattern(): void {
    if (!this._playlist) return;

    const wasPlaying = this._playlist.isPlaying && !this._playlist.isPaused;

    // Clear current timeout
    if (this._playlist.timeoutId !== null) {
      clearTimeout(this._playlist.timeoutId);
      this._playlist.timeoutId = null;
    }

    // Call onExit for current pattern
    const currentItem = this._playlist.items[this._playlist.currentIndex];
    if (currentItem.onExit) {
      currentItem.onExit();
    }

    const nextIndex = this._playlist.currentIndex + 1;

    if (nextIndex >= this._playlist.items.length) {
      // End of playlist
      this._handlePlaylistEnd();
    } else {
      this._playlist.currentIndex = nextIndex;
      this._transitionToPlaylistItem(nextIndex);

      if (wasPlaying) {
        this._playlist.elapsedBeforePause = 0;
        this._scheduleNextPattern();
      }
    }
  }

  /**
   * Go to previous pattern in playlist
   */
  prevPattern(): void {
    if (!this._playlist) return;

    const wasPlaying = this._playlist.isPlaying && !this._playlist.isPaused;

    // Clear current timeout
    if (this._playlist.timeoutId !== null) {
      clearTimeout(this._playlist.timeoutId);
      this._playlist.timeoutId = null;
    }

    // Call onExit for current pattern
    const currentItem = this._playlist.items[this._playlist.currentIndex];
    if (currentItem.onExit) {
      currentItem.onExit();
    }

    const prevIndex = this._playlist.currentIndex - 1;

    if (prevIndex < 0) {
      // At beginning, wrap to end if looping, otherwise stay
      if (this._playlist.options.loop) {
        this._playlist.currentIndex = this._playlist.items.length - 1;
        this._transitionToPlaylistItem(this._playlist.currentIndex);
      }
    } else {
      this._playlist.currentIndex = prevIndex;
      this._transitionToPlaylistItem(prevIndex);
    }

    if (wasPlaying) {
      this._playlist.elapsedBeforePause = 0;
      this._scheduleNextPattern();
    }
  }

  /**
   * Jump to specific pattern index
   */
  goToPattern(index: number): void {
    if (!this._playlist) return;

    if (index < 0 || index >= this._playlist.items.length) {
      console.warn(`Ledding: Invalid pattern index ${index}`);
      return;
    }

    const wasPlaying = this._playlist.isPlaying && !this._playlist.isPaused;

    // Clear current timeout
    if (this._playlist.timeoutId !== null) {
      clearTimeout(this._playlist.timeoutId);
      this._playlist.timeoutId = null;
    }

    // Call onExit for current pattern
    const currentItem = this._playlist.items[this._playlist.currentIndex];
    if (currentItem.onExit) {
      currentItem.onExit();
    }

    this._playlist.currentIndex = index;
    this._transitionToPlaylistItem(index);

    if (wasPlaying) {
      this._playlist.elapsedBeforePause = 0;
      this._scheduleNextPattern();
    }
  }

  /**
   * Get current playlist state
   */
  getPlaylistState(): PlaylistState | null {
    if (!this._playlist) return null;

    let timeRemaining = 0;
    if (this._playlist.isPlaying && !this._playlist.isPaused) {
      timeRemaining = this._getRemainingHoldTime();
    } else if (this._playlist.isPaused) {
      const currentItem = this._playlist.items[this._playlist.currentIndex];
      const adjustedHold = currentItem.hold / (this._playlist.options.speed || 1);
      timeRemaining = adjustedHold - this._playlist.elapsedBeforePause;
    }

    return {
      isPlaying: this._playlist.isPlaying,
      isPaused: this._playlist.isPaused,
      currentIndex: this._playlist.currentIndex,
      totalPatterns: this._playlist.items.length,
      timeRemaining: Math.max(0, timeRemaining),
      loopsCompleted: this._playlist.loopsCompleted,
      loopsTotal: this._playlist.options.loop === true
        ? 'infinite'
        : (typeof this._playlist.options.loop === 'number' ? this._playlist.options.loop : 1),
    };
  }

  /**
   * Clear the playlist entirely
   */
  clearPlaylist(): void {
    if (!this._playlist) return;

    // Clear timeout
    if (this._playlist.timeoutId !== null) {
      clearTimeout(this._playlist.timeoutId);
      this._playlist.timeoutId = null;
    }

    this._playlist = null;
  }

  /**
   * Schedule the next pattern change
   */
  private _scheduleNextPattern(customDelay?: number): void {
    if (!this._playlist || !this._playlist.isPlaying || this._playlist.isPaused) return;

    const currentItem = this._playlist.items[this._playlist.currentIndex];
    const adjustedHold = currentItem.hold / (this._playlist.options.speed || 1);

    let delay: number;
    if (customDelay !== undefined) {
      delay = customDelay;
    } else {
      delay = adjustedHold;
    }

    this._playlist.startTime = performance.now();
    if (customDelay === undefined) {
      this._playlist.elapsedBeforePause = 0;
    }

    this._playlist.timeoutId = setTimeout(() => {
      this._advancePlaylist();
    }, delay);
  }

  /**
   * Advance to the next pattern in the playlist
   */
  private _advancePlaylist(): void {
    if (!this._playlist) return;

    // Call onExit for current pattern
    const currentItem = this._playlist.items[this._playlist.currentIndex];
    if (currentItem.onExit) {
      currentItem.onExit();
    }

    const nextIndex = this._playlist.currentIndex + 1;

    if (nextIndex >= this._playlist.items.length) {
      // End of playlist
      this._handlePlaylistEnd();
    } else {
      this._playlist.currentIndex = nextIndex;
      this._transitionToPlaylistItem(nextIndex);
      this._scheduleNextPattern();
    }
  }

  /**
   * Handle reaching the end of the playlist
   */
  private _handlePlaylistEnd(): void {
    if (!this._playlist) return;

    this._playlist.loopsCompleted++;

    const loopConfig = this._playlist.options.loop;
    const shouldLoop = loopConfig === true ||
      (typeof loopConfig === 'number' && this._playlist.loopsCompleted < loopConfig);

    if (shouldLoop) {
      // Reshuffle if needed
      if (this._playlist.options.shuffle) {
        const shuffleResult = this._shuffleArray(
          this._playlist.originalItems.map((item, i) => ({ item, originalIndex: i }))
        );
        this._playlist.items = shuffleResult.map(r => r.item);
        this._playlist.shuffledIndices = shuffleResult.map(r => r.originalIndex);
      }

      // Reset to beginning
      this._playlist.currentIndex = 0;
      this._transitionToPlaylistItem(0);
      this._scheduleNextPattern();
    } else {
      // Playlist complete
      this._playlist.isPlaying = false;
      this._playlist.isPaused = false;

      if (this._playlist.options.onComplete) {
        this._playlist.options.onComplete();
      }
    }
  }

  /**
   * Transition to a specific playlist item
   */
  private _transitionToPlaylistItem(index: number, isInitial: boolean = false): void {
    if (!this._playlist) return;

    const item = this._playlist.items[index];

    // Apply the pattern with transition
    if (isInitial || !item.transition) {
      // Instant transition for initial or no transition specified
      this.setPattern(item.pattern);
    } else {
      this.setPattern(item.pattern, item.transition);
    }

    // Call onEnter callback
    if (item.onEnter) {
      item.onEnter();
    }

    // Call onPatternChange callback
    if (this._playlist.options.onPatternChange) {
      this._playlist.options.onPatternChange(index, item.pattern);
    }
  }

  /**
   * Get remaining hold time for current pattern
   */
  private _getRemainingHoldTime(): number {
    if (!this._playlist) return 0;

    const currentItem = this._playlist.items[this._playlist.currentIndex];
    const adjustedHold = currentItem.hold / (this._playlist.options.speed || 1);
    const elapsed = performance.now() - this._playlist.startTime;

    return Math.max(0, adjustedHold - elapsed);
  }

  /**
   * Shuffle an array using Fisher-Yates algorithm
   */
  private _shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
