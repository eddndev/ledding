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

    // Scale to fit logic
    if (this.options.scaleToFit) {
      const artRequiredWidth = artCols * (this.options.ledSize + this.options.ledGap);
      const artRequiredHeight = artRows * (this.options.ledSize + this.options.ledGap);

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
      this.grid.numCols = Math.max(requiredColsByCanvas, artCols);
      this.grid.numRows = Math.max(requiredRowsByCanvas, artRows);
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
   */
  private _getInterpolatedColor(led: LedState): string {
    const baseColor = this.parsedColors.base!;
    const activeColor = this.parsedColors.states[led.artValueForColor] || baseColor;

    if (baseColor === activeColor) {
      if (led.artValueForColor === 0) {
        return this.options.colors.base;
      }
      return this.options.colors.states[led.artValueForColor] || this.options.colors.base;
    }

    const { minSize, maxSize } = this.dimensions;

    if (maxSize === minSize) return this.options.colors.base;

    let factor = (led.currentSize - minSize) / (maxSize - minSize);

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
   * Set a new art pattern
   */
  setPattern(pattern: number[][]): void {
    this.options.artPattern = pattern;
    this.setup();
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
}
