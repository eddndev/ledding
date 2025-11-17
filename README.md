# Ledding

High-performance LED matrix animation library for Canvas 2D.

**15KB minified | 4.7KB gzipped | Zero dependencies**

## Features

- Smooth LED animations with customizable transitions
- Infinite scroll in 8 directions (cardinal + diagonal)
- Cascade, wave, interlaced, and random ignition/extinction patterns
- Multiple LED intensities with color interpolation
- Sparse grid optimization (only renders active LEDs)
- Color caching for minimal GC pressure
- Full TypeScript support with tree-shaking
- No memory leaks - proper cleanup on destroy

## Installation

```bash
npm install ledding
```

## Quick Start

```typescript
import { Ledding, CircleRenderer, CenterAligner, Directions, Pattern } from 'ledding';

const pattern = [
  [0, 1, 1, 0],
  [1, 2, 2, 1],
  [1, 2, 2, 1],
  [0, 1, 1, 0],
];

const ledding = new Ledding('#container', {
  ledSize: 20,
  ledGap: 4,
  artPattern: pattern,
  renderer: CircleRenderer,
  aligner: CenterAligner,

  animation: {
    scroll: {
      direction: Directions.TO_LEFT,
      speed: 80
    }
  }
});

// Pause/Resume
ledding.pause();
ledding.resume();

// Change pattern dynamically
ledding.setPattern(newPattern);

// Clean up
ledding.destroy();
```

## Browser (UMD)

```html
<script src="https://unpkg.com/ledding/dist/ledding.umd.min.js"></script>
<script>
  const { Ledding, CircleRenderer, CenterAligner } = window.Ledding;

  const instance = new Ledding.Ledding('#container', {
    // options
  });
</script>
```

## Configuration

```typescript
interface LeddingOptions {
  // Base dimensions
  ledSize: number;              // LED size in pixels (default: 20)
  ledGap: number;               // Gap between LEDs (default: 4)
  scaleToFit: boolean;          // Auto-scale to fit container (default: true)

  // Content
  artPattern: number[][];       // 2D array pattern (0 = off, 1-N = on states)

  // Strategies (tree-shakeable)
  renderer: Renderer;           // CircleRenderer | SquareRenderer
  aligner: Aligner;             // CenterAligner, TopLeftAligner, etc.

  // Colors
  colors: {
    background: string | null;  // null for transparent
    base: string;               // Base LED color (off state)
    states: Record<number, string>; // Colors for each state (1, 2, 3...)
  };

  // Opacities
  opacities: {
    base: { min: number; max: number }; // Random range for base LEDs
    active: number;                      // Opacity when active
  };

  // Performance
  fps: number;                  // Target frame rate (default: 20)

  // Animation
  animation: {
    scroll: {
      direction: Direction;     // 'to-left', 'to-right', etc.
      speed: number;            // Pixels per second
    };
    ignition: {
      pattern: AnimationPattern; // 'cascade', 'wave', 'interlaced', 'random'
      direction: Direction;
      delay: number;            // Frames between steps
      step: number;             // Group size for patterns
    };
    extinction: {
      // Same as ignition
    };
  };

  // Transition speeds (lerp factor)
  transitions: {
    ignition: { min: number; max: number; randomize: boolean };
    extinction: { min: number; max: number; randomize: boolean };
    morph: { min: number; max: number; randomize: boolean };
  };

  // Grid mode
  grid: {
    fill: boolean;              // true = classic (all LEDs), false = sparse (optimized)
    lifespan: number;           // Frames before removing inactive LED (sparse mode)
  };
}
```

## API

```typescript
class Ledding {
  // Properties
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  options: LeddingOptions;
  isRunning: boolean;

  // Methods
  setup(): void;                        // Recalculate dimensions
  pause(): void;                        // Pause animation
  resume(): void;                       // Resume animation
  setPattern(pattern: number[][]): void; // Change pattern
  getFrameRate(): number;               // Get configured FPS
  getLedCount(): number;                // Get current LED count
  destroy(): void;                      // Clean up resources

  // Events
  on(event: LeddingEventType, callback: Function): void;
  off(event: LeddingEventType, callback: Function): void;

  // Event types: 'beforeDraw', 'afterDraw', 'resize', 'destroy'
}
```

## Aligners

Control art positioning within the canvas:

```typescript
import {
  TopLeftAligner,
  TopAligner,
  TopRightAligner,
  LeftAligner,
  CenterAligner,      // Default
  RightAligner,
  BottomLeftAligner,
  BottomAligner,
  BottomRightAligner
} from 'ledding';
```

## Renderers

Control LED shape:

```typescript
import { CircleRenderer, SquareRenderer } from 'ledding';

// CircleRenderer: Optimized with Path2D caching
// SquareRenderer: Simple rectangle fill
```

## Directions

```typescript
import { Directions } from 'ledding';

Directions.TO_LEFT
Directions.TO_RIGHT
Directions.TO_TOP
Directions.TO_BOTTOM
Directions.TO_TOP_LEFT
Directions.TO_TOP_RIGHT
Directions.TO_BOTTOM_LEFT
Directions.TO_BOTTOM_RIGHT
```

## Patterns

```typescript
import { Pattern } from 'ledding';

Pattern.CASCADE    // Sequential activation
Pattern.INTERLACED // Stripe-based activation
Pattern.WAVE       // Multiple cascade waves
Pattern.RANDOM     // Random activation order
```

## Performance Optimizations

1. **Color caching**: RGB strings are cached to avoid creating 20K+ strings/second
2. **Sparse grid mode**: Only active LEDs are tracked and rendered
3. **Pre-bound functions**: No `.bind()` in animation loop
4. **Proper cleanup**: No memory leaks on destroy
5. **Frame limiting**: Configurable FPS cap
6. **Visibility API**: Pauses when tab is hidden
7. **Typed arrays**: Uint8ClampedArray for color operations

## Bundle Sizes

- ESM: 34KB (15KB minified, 4.7KB gzipped)
- UMD: 39KB (15KB minified)
- CommonJS: 35KB
- TypeScript Declarations: 9.7KB

## Tree Shaking

Import only what you need:

```typescript
// Full bundle
import { Ledding, CircleRenderer, CenterAligner } from 'ledding';

// Minimal - only core
import { Ledding } from 'ledding';
import { CircleRenderer } from 'ledding/renderers';
import { CenterAligner } from 'ledding/aligners';
```

## Browser Support

- Chrome 69+
- Firefox 62+
- Safari 12+
- Edge 79+

Requires:
- Canvas 2D API
- ES6 Modules
- Path2D
- requestAnimationFrame
- Map/Set

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Type check
npm run typecheck

# Watch mode
npm run dev
```

## License

MIT
