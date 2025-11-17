---
title: "API Reference"
description: "Complete API reference for all public methods and properties of the Ledding class"
sidebar:
  order: 3
---

# API Reference

This is the complete API reference for the Ledding library. It covers all public methods, properties, and interfaces.

## Constructor

### `new Ledding(selector, options?)`

Creates a new Ledding instance.

```typescript
constructor(targetSelector: string, userOptions?: LeddingUserOptions)
```

**Parameters:**

- `targetSelector` (string) - CSS selector for the container element
- `userOptions` (LeddingUserOptions, optional) - Configuration options

**Returns:** `Ledding` instance

**Throws:**

- `Error` if element not found
- `Error` if canvas 2D context cannot be created

**Example:**

```typescript
import { Ledding } from 'ledding';

const led = new Ledding('#container', {
  ledSize: 20,
  ledGap: 4,
  artPattern: [[1, 1], [1, 1]]
});
```

## Instance Properties

### `container`

The DOM element containing the canvas.

- **Type:** `HTMLElement`
- **Access:** Read-only

```typescript
console.log(led.container.id);
```

### `canvas`

The canvas element used for rendering.

- **Type:** `HTMLCanvasElement`
- **Access:** Read-only

```typescript
const width = led.canvas.width;
const height = led.canvas.height;
```

### `ctx`

The 2D rendering context.

- **Type:** `CanvasRenderingContext2D`
- **Access:** Read-only

```typescript
// Direct canvas manipulation (advanced)
led.ctx.fillStyle = 'red';
```

### `options`

The merged configuration options.

- **Type:** `LeddingOptions`
- **Access:** Read-only

```typescript
console.log(led.options.ledSize);
console.log(led.options.fps);
```

### `dimensions`

Cached dimension calculations.

- **Type:** `DimensionsCache`
- **Access:** Read-only

```typescript
interface DimensionsCache {
  scaledLedSize: number;
  scaledLedGap: number;
  ledFullSize: number;
  gridWidthPx: number;
  gridHeightPx: number;
  minSize: number;
  maxSize: number;
}

console.log(led.dimensions.scaledLedSize);
```

### `artPosition`

Position information for the art pattern.

- **Type:** `ArtPosition`
- **Access:** Read-only

```typescript
interface ArtPosition {
  startPx: number;
  startPxY: number;
  widthPx: number;
  heightPx: number;
}

console.log(led.artPosition.startPx);
```

### `grid`

Current grid state.

- **Type:** `GridState`
- **Access:** Read-only

```typescript
interface GridState {
  leds: LedState[] | Map<string, LedState> | null;
  numCols: number;
  numRows: number;
  isSparse: boolean;
}

console.log(led.grid.numCols, led.grid.numRows);
```

### `scrollX`

Current horizontal scroll position.

- **Type:** `number`
- **Access:** Read-only

```typescript
console.log(led.scrollX);
```

### `scrollY`

Current vertical scroll position.

- **Type:** `number`
- **Access:** Read-only

```typescript
console.log(led.scrollY);
```

### `isRunning`

Whether the animation is currently running.

- **Type:** `boolean` (getter)
- **Access:** Read-only

```typescript
if (led.isRunning) {
  console.log('Animation is active');
}
```

## Animation Control Methods

### `pause()`

Pauses the animation loop.

```typescript
pause(): void
```

**Example:**

```typescript
led.pause();
console.log(led.isRunning); // false
```

### `resume()`

Resumes a paused animation.

```typescript
resume(): void
```

**Example:**

```typescript
led.resume();
console.log(led.isRunning); // true
```

### `destroy()`

Destroys the instance and cleans up all resources.

```typescript
destroy(): void
```

**Description:**

- Stops the animation loop
- Removes event listeners
- Removes the canvas from DOM
- Clears all caches and references
- Emits the `'destroy'` event

**Example:**

```typescript
led.on('destroy', () => {
  console.log('Ledding instance destroyed');
});

led.destroy();
```

## Pattern Methods

### `setPattern(pattern, options?)`

Sets a new art pattern with optional transition effects.

```typescript
setPattern(pattern: number[][], options?: PatternTransitionOptions): void
```

**Parameters:**

- `pattern` (number[][]) - New pattern to display
- `options` (PatternTransitionOptions, optional) - Transition configuration

```typescript
interface PatternTransitionOptions {
  duration?: number;              // Transition duration in ms
  easing?: EasingName;            // Easing function name
  strategy?: PatternTransitionStrategy;  // 'instant' | 'morph' | 'fade' | 'crossfade'
}
```

**Example:**

```typescript
// Instant change
led.setPattern([[1, 0], [0, 1]]);

// Morphing transition
led.setPattern([[1, 1], [1, 1]], {
  strategy: 'morph',
  duration: 800,
  easing: 'ease-in-out-cubic'
});

// Fade transition
led.setPattern([[0, 1], [1, 0]], {
  strategy: 'fade',
  duration: 1200,
  easing: 'ease-out-quad'
});
```

## Statistics Methods

### `getLedCount()`

Returns the current number of LEDs in the grid.

```typescript
getLedCount(): number
```

**Returns:** Number of LEDs

**Example:**

```typescript
const count = led.getLedCount();
console.log(`Rendering ${count} LEDs`);
```

### `getFrameRate()`

Returns the configured frames per second.

```typescript
getFrameRate(): number
```

**Returns:** FPS value

**Example:**

```typescript
const fps = led.getFrameRate();
console.log(`Running at ${fps} FPS`);
```

## Event System

### `on(event, callback)`

Registers an event listener.

```typescript
on(event: LeddingEventType, callback: LeddingEventCallback): void
```

**Parameters:**

- `event` - Event type: `'beforeDraw'` | `'afterDraw'` | `'resize'` | `'destroy'`
- `callback` - Function to call when event fires

```typescript
type LeddingEventCallback = (instance: LeddingInstance) => void;
```

**Example:**

```typescript
led.on('beforeDraw', (instance) => {
  console.log('About to draw frame');
});

led.on('afterDraw', (instance) => {
  console.log('Frame drawn');
});

led.on('resize', (instance) => {
  console.log('Canvas resized');
});

led.on('destroy', (instance) => {
  console.log('Instance destroyed');
});
```

### `off(event, callback)`

Removes an event listener.

```typescript
off(event: LeddingEventType, callback: LeddingEventCallback): void
```

**Parameters:**

- `event` - Event type
- `callback` - The exact function reference to remove

**Example:**

```typescript
const handler = (instance) => {
  console.log('Frame drawn');
};

led.on('afterDraw', handler);
// Later...
led.off('afterDraw', handler);
```

## Playlist Methods

### `setPlaylist(items, options?)`

Sets up a playlist of patterns with automatic transitions.

```typescript
setPlaylist(items: PlaylistItem[], options?: PlaylistOptions): void
```

**Parameters:**

- `items` (PlaylistItem[]) - Array of playlist items
- `options` (PlaylistOptions, optional) - Playlist configuration

```typescript
interface PlaylistItem {
  pattern: number[][];
  hold: number;                              // ms to hold this pattern
  transition?: PatternTransitionOptions;     // transition TO this pattern
  onEnter?: () => void;                      // called when pattern becomes active
  onExit?: () => void;                       // called when leaving pattern
}

interface PlaylistOptions {
  loop?: boolean | number;       // true = infinite, number = N times
  autoStart?: boolean;           // default: true
  shuffle?: boolean;
  reverse?: boolean;
  speed?: number;                // playback speed multiplier
  startIndex?: number;
  onComplete?: () => void;
  onPatternChange?: (index: number, pattern: number[][]) => void;
}
```

**Example:**

```typescript
led.setPlaylist([
  {
    pattern: [[1, 1], [1, 1]],
    hold: 3000,
    transition: { strategy: 'morph', duration: 500 },
    onEnter: () => console.log('Pattern 1 active')
  },
  {
    pattern: [[0, 1], [1, 0]],
    hold: 2000,
    transition: { strategy: 'fade', duration: 800 }
  }
], {
  loop: true,
  speed: 1.5,
  onPatternChange: (index) => console.log(`Now showing pattern ${index}`)
});
```

### `playPlaylist()`

Starts or resumes playlist playback.

```typescript
playPlaylist(): void
```

**Example:**

```typescript
led.playPlaylist();
```

### `pausePlaylist()`

Pauses playlist playback (maintains position).

```typescript
pausePlaylist(): void
```

**Example:**

```typescript
led.pausePlaylist();
```

### `stopPlaylist()`

Stops playlist and resets to beginning.

```typescript
stopPlaylist(): void
```

**Example:**

```typescript
led.stopPlaylist();
```

### `nextPattern()`

Advances to the next pattern in the playlist.

```typescript
nextPattern(): void
```

**Example:**

```typescript
led.nextPattern();
```

### `prevPattern()`

Goes back to the previous pattern in the playlist.

```typescript
prevPattern(): void
```

**Example:**

```typescript
led.prevPattern();
```

### `goToPattern(index)`

Jumps to a specific pattern by index.

```typescript
goToPattern(index: number): void
```

**Parameters:**

- `index` - Zero-based index of the pattern

**Example:**

```typescript
led.goToPattern(2); // Jump to third pattern
```

### `getPlaylistState()`

Returns the current playlist state.

```typescript
getPlaylistState(): PlaylistState | null
```

**Returns:** Current state or `null` if no playlist is set

```typescript
interface PlaylistState {
  isPlaying: boolean;
  isPaused: boolean;
  currentIndex: number;
  totalPatterns: number;
  timeRemaining: number;           // ms until next pattern
  loopsCompleted: number;
  loopsTotal: number | 'infinite';
}
```

**Example:**

```typescript
const state = led.getPlaylistState();
if (state) {
  console.log(`Pattern ${state.currentIndex + 1} of ${state.totalPatterns}`);
  console.log(`Time remaining: ${state.timeRemaining}ms`);
  console.log(`Loops: ${state.loopsCompleted}/${state.loopsTotal}`);
}
```

### `clearPlaylist()`

Removes the current playlist.

```typescript
clearPlaylist(): void
```

**Example:**

```typescript
led.clearPlaylist();
```

## Type Guards

### `isDurationBased(config)`

Checks if a transition config uses duration-based mode.

```typescript
import { isDurationBased } from 'ledding';

function isDurationBased(config: TransitionConfig): config is TransitionDurationOptions
```

**Example:**

```typescript
import { isDurationBased } from 'ledding';

const config = led.options.transitions.ignition;

if (isDurationBased(config)) {
  console.log(`Duration: ${config.duration}ms`);
  console.log(`Easing: ${config.easing}`);
} else {
  console.log(`Speed range: ${config.min} - ${config.max}`);
}
```

## Utility Functions

These are exported from the main module and can be used independently:

### `lerp(start, end, t)`

Linear interpolation between two values.

```typescript
import { lerp } from 'ledding';

const value = lerp(0, 100, 0.5); // 50
```

### `clamp(value, min, max)`

Clamps a value to a range.

```typescript
import { clamp } from 'ledding';

const clamped = clamp(150, 0, 100); // 100
```

### `randomBetween(min, max)`

Generates a random number in a range.

```typescript
import { randomBetween } from 'ledding';

const random = randomBetween(10, 20);
```

### `debounce(fn, delay)`

Creates a debounced function.

```typescript
import { debounce } from 'ledding';

const debouncedResize = debounce(() => {
  console.log('Resized');
}, 250);
```

### `parseRgbToIntArray(rgbString)`

Parses an RGB string to a Uint8ClampedArray.

```typescript
import { parseRgbToIntArray } from 'ledding';

const rgb = parseRgbToIntArray('rgb(255, 100, 50)');
// Uint8ClampedArray [255, 100, 50]
```

### `getEasingFunction(name)`

Gets an easing function by name.

```typescript
import { getEasingFunction } from 'ledding';

const ease = getEasingFunction('ease-out-cubic');
const value = ease(0.5); // Returns eased value
```

## Constants

### `Directions`

Direction constants for animations.

```typescript
import { Directions } from 'ledding';

Directions.TO_LEFT;        // 'to-left'
Directions.TO_RIGHT;       // 'to-right'
Directions.TO_TOP;         // 'to-top'
Directions.TO_BOTTOM;      // 'to-bottom'
Directions.TO_TOP_LEFT;    // 'to-top-left'
Directions.TO_TOP_RIGHT;   // 'to-top-right'
Directions.TO_BOTTOM_LEFT; // 'to-bottom-left'
Directions.TO_BOTTOM_RIGHT;// 'to-bottom-right'
```

### `Pattern`

Animation pattern constants.

```typescript
import { Pattern } from 'ledding';

Pattern.CASCADE;    // 'cascade'
Pattern.INTERLACED; // 'interlaced'
Pattern.WAVE;       // 'wave'
Pattern.RANDOM;     // 'random'
```

### `defaultOptions`

The default configuration object.

```typescript
import { defaultOptions } from 'ledding';

console.log(defaultOptions.ledSize); // 20
console.log(defaultOptions.fps);     // 20
```

### `defaultArtPattern`

The default pattern.

```typescript
import { defaultArtPattern } from 'ledding';

// [[1, 1, 1], [1, 0, 1], [1, 1, 1]]
```
