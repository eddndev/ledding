---
title: "Configuration"
description: "Complete reference for all Ledding configuration options including LED appearance, colors, animations, and transitions"
sidebar:
  order: 2
---

# Configuration

Ledding provides extensive configuration options to customize every aspect of your LED matrix animation. All options are optional and have sensible defaults.

## Complete Configuration Structure

```typescript
interface LeddingOptions {
  ledSize: number;
  ledGap: number;
  scaleToFit: boolean;
  artPattern: number[][];
  renderer: Renderer;
  aligner: Aligner;
  colors: ColorOptions;
  sizes: SizeOptions;
  opacities: OpacityOptions;
  fps: number;
  animation: AnimationOptions;
  transitions: TransitionsOptions;
  grid: GridOptions;
}
```

## LED Appearance

### `ledSize`

Base size of each LED in pixels.

- **Type:** `number`
- **Default:** `20`
- **Description:** The diameter (for circles) or width/height (for squares) of each LED in pixels before scaling.

```typescript
const led = new Ledding('#container', {
  ledSize: 30 // Larger LEDs
});
```

### `ledGap`

Spacing between LEDs in pixels.

- **Type:** `number`
- **Default:** `4`
- **Description:** The gap between adjacent LEDs.

```typescript
const led = new Ledding('#container', {
  ledSize: 20,
  ledGap: 8 // More spacing
});
```

### `scaleToFit`

Automatically scale LEDs to fit the pattern within the container.

- **Type:** `boolean`
- **Default:** `true`
- **Description:** When enabled, LEDs and gaps are proportionally scaled down to ensure the entire pattern fits within the canvas.

```typescript
const led = new Ledding('#container', {
  scaleToFit: false // Use exact pixel sizes
});
```

## Pattern

### `artPattern`

The LED pattern to display.

- **Type:** `number[][]`
- **Default:** `[[1, 1, 1], [1, 0, 1], [1, 1, 1]]`
- **Description:** A 2D array where each value represents a LED state. State `0` means inactive (base color), any other number represents an active state.

```typescript
const led = new Ledding('#container', {
  artPattern: [
    [0, 1, 0],
    [1, 2, 1],
    [0, 1, 0]
  ]
});
```

## Renderer and Aligner

### `renderer`

The renderer used to draw individual LEDs.

- **Type:** `Renderer`
- **Default:** `CircleRenderer`
- **Description:** Determines the shape and drawing method for LEDs.

```typescript
import { SquareRenderer } from 'ledding';

const led = new Ledding('#container', {
  renderer: SquareRenderer
});
```

### `aligner`

Controls the positioning of the pattern within the canvas.

- **Type:** `Aligner`
- **Default:** `CenterAligner`
- **Description:** Determines where the art pattern is positioned relative to the canvas.

```typescript
import { TopLeftAligner } from 'ledding';

const led = new Ledding('#container', {
  aligner: TopLeftAligner
});
```

## Colors

### `colors`

Color configuration for LEDs.

- **Type:** `ColorOptions`

```typescript
interface ColorOptions {
  background: string | null;
  base: string;
  states: Record<number, string>;
}
```

#### `colors.background`

Canvas background color.

- **Type:** `string | null`
- **Default:** `null`
- **Description:** Set to `null` for transparent background, or any CSS color string.

```typescript
colors: {
  background: '#1a1a2e' // Dark blue background
}
```

#### `colors.base`

Color for inactive LEDs (state 0).

- **Type:** `string`
- **Default:** `'rgb(45, 55, 72)'`
- **Description:** Must be in RGB format for color interpolation.

```typescript
colors: {
  base: 'rgb(30, 30, 30)'
}
```

#### `colors.states`

Colors for active LED states.

- **Type:** `Record<number, string>`
- **Default:** `{ 1: 'rgb(209, 162, 255)', 2: 'rgb(167, 86, 255)', 3: 'rgb(113, 63, 222)' }`
- **Description:** Map of state numbers to RGB color strings.

```typescript
colors: {
  states: {
    1: 'rgb(255, 100, 100)', // Red
    2: 'rgb(100, 255, 100)', // Green
    3: 'rgb(100, 100, 255)'  // Blue
  }
}
```

## Sizes

### `sizes`

Size configuration for different LED states.

- **Type:** `SizeOptions`

```typescript
interface SizeOptions {
  states?: Record<number, number>;
}
```

#### `sizes.states`

Size multipliers for active states.

- **Type:** `Record<number, number>`
- **Default:** `{}` (all states use full size)
- **Description:** Values are multipliers of `scaledLedSize` (0.0 to 1.0). If not specified, all active states use 1.0 (full size).

```typescript
sizes: {
  states: {
    1: 1.0,   // Full size
    2: 0.75,  // 75% size
    3: 0.5    // 50% size
  }
}
```

## Opacities

### `opacities`

Opacity configuration for LEDs.

- **Type:** `OpacityOptions`

```typescript
interface OpacityOptions {
  base: { min: number; max: number };
  active: number;
}
```

#### `opacities.base`

Opacity range for inactive LEDs.

- **Type:** `{ min: number; max: number }`
- **Default:** `{ min: 0.5, max: 0.75 }`
- **Description:** Inactive LEDs randomly vary between these opacity values.

```typescript
opacities: {
  base: { min: 0.3, max: 0.6 }
}
```

#### `opacities.active`

Opacity for active LEDs.

- **Type:** `number`
- **Default:** `1`
- **Description:** Fully active LEDs use this opacity.

```typescript
opacities: {
  active: 0.9
}
```

## Frame Rate

### `fps`

Target frames per second.

- **Type:** `number`
- **Default:** `20`
- **Description:** Controls animation smoothness. Higher values are smoother but more CPU-intensive.

```typescript
const led = new Ledding('#container', {
  fps: 60 // Smooth 60fps animation
});
```

## Animation

### `animation`

Animation configuration container.

- **Type:** `AnimationOptions`

```typescript
interface AnimationOptions {
  scroll: ScrollOptions;
  ignition: TransitionAnimationOptions;
  extinction: TransitionAnimationOptions;
}
```

### `animation.scroll`

Scroll animation settings.

```typescript
interface ScrollOptions {
  direction: Direction;
  speed: number;
}
```

#### `animation.scroll.direction`

Direction of the scrolling animation.

- **Type:** `Direction`
- **Default:** `'to-left'`
- **Options:** `'to-left'`, `'to-right'`, `'to-top'`, `'to-bottom'`, `'to-top-left'`, `'to-top-right'`, `'to-bottom-left'`, `'to-bottom-right'`

```typescript
import { Directions } from 'ledding';

animation: {
  scroll: {
    direction: Directions.TO_RIGHT
  }
}
```

#### `animation.scroll.speed`

Scroll speed in pixels per second.

- **Type:** `number`
- **Default:** `80`
- **Description:** Higher values mean faster scrolling. Set to `0` to disable scrolling.

```typescript
animation: {
  scroll: {
    speed: 0 // Disable scrolling
  }
}
```

### `animation.ignition`

LED ignition (turn-on) animation pattern.

```typescript
interface TransitionAnimationOptions {
  pattern: AnimationPattern;
  direction: Direction;
  delay: number;
  step: number;
}
```

#### `animation.ignition.pattern`

Pattern for LED ignition sequence.

- **Type:** `AnimationPattern`
- **Default:** `'cascade'`
- **Options:** `'cascade'`, `'interlaced'`, `'wave'`, `'random'`

```typescript
import { Pattern } from 'ledding';

animation: {
  ignition: {
    pattern: Pattern.WAVE
  }
}
```

#### `animation.ignition.direction`

Direction for ignition pattern.

- **Type:** `Direction`
- **Default:** `'to-bottom'`

```typescript
animation: {
  ignition: {
    direction: Directions.TO_RIGHT
  }
}
```

#### `animation.ignition.delay`

Delay between LED ignitions in milliseconds.

- **Type:** `number`
- **Default:** `0`

```typescript
animation: {
  ignition: {
    delay: 50 // 50ms between each LED
  }
}
```

#### `animation.ignition.step`

Number of LEDs to ignite per step.

- **Type:** `number`
- **Default:** `4`

```typescript
animation: {
  ignition: {
    step: 8 // Ignite 8 LEDs at once
  }
}
```

### `animation.extinction`

LED extinction (turn-off) animation pattern. Same structure as `ignition`.

- **Default direction:** `'to-top'`

```typescript
animation: {
  extinction: {
    pattern: Pattern.CASCADE,
    direction: Directions.TO_TOP,
    delay: 0,
    step: 4
  }
}
```

## Transitions

### `transitions`

Transition speed/duration configurations.

- **Type:** `TransitionsOptions`

```typescript
interface TransitionsOptions {
  ignition: TransitionConfig;
  extinction: TransitionConfig;
  morph: TransitionConfig;
}
```

Ledding supports two transition modes:

#### Legacy Mode (Lerp-based)

```typescript
interface TransitionSpeedOptions {
  min: number;
  max: number;
  randomize: boolean;
}
```

```typescript
transitions: {
  ignition: {
    min: 0.5,
    max: 1.5,
    randomize: true
  }
}
```

#### Modern Mode (Duration-based)

```typescript
interface TransitionDurationOptions {
  duration: number;     // milliseconds
  easing: EasingName;
  delay?: number;       // optional delay in ms
}
```

```typescript
transitions: {
  ignition: {
    duration: 500,
    easing: 'ease-out-cubic'
  }
}
```

### Default Transition Values

```typescript
transitions: {
  ignition: { min: 1, max: 1, randomize: false },
  extinction: { min: 1, max: 1, randomize: false },
  morph: { min: 1, max: 1, randomize: false }
}
```

## Grid

### `grid`

Grid behavior configuration.

- **Type:** `GridOptions`

```typescript
interface GridOptions {
  fill: boolean;
  lifespan: number;
}
```

#### `grid.fill`

Fill the entire canvas with LEDs.

- **Type:** `boolean`
- **Default:** `false`
- **Description:** When `false`, uses sparse grid mode which only creates LEDs where needed (better performance). When `true`, creates LEDs for the entire canvas.

```typescript
grid: {
  fill: true // Dense grid
}
```

#### `grid.lifespan`

Lifespan of LEDs in sparse mode (frames).

- **Type:** `number`
- **Default:** `60`
- **Description:** Number of frames a LED stays alive in sparse mode before being recycled.

```typescript
grid: {
  lifespan: 120 // LEDs live for 120 frames
}
```

## Complete Example

```typescript
import {
  Ledding,
  CircleRenderer,
  CenterAligner,
  Directions,
  Pattern
} from 'ledding';

const led = new Ledding('#container', {
  ledSize: 25,
  ledGap: 5,
  scaleToFit: true,

  artPattern: [
    [0, 1, 1, 0],
    [1, 2, 2, 1],
    [1, 2, 2, 1],
    [0, 1, 1, 0]
  ],

  renderer: CircleRenderer,
  aligner: CenterAligner,

  colors: {
    background: '#0a0a1a',
    base: 'rgb(40, 50, 60)',
    states: {
      1: 'rgb(100, 200, 255)',
      2: 'rgb(50, 150, 255)'
    }
  },

  sizes: {
    states: {
      1: 1.0,
      2: 0.8
    }
  },

  opacities: {
    base: { min: 0.4, max: 0.7 },
    active: 1.0
  },

  fps: 30,

  animation: {
    scroll: {
      direction: Directions.TO_LEFT,
      speed: 60
    },
    ignition: {
      pattern: Pattern.WAVE,
      direction: Directions.TO_BOTTOM,
      delay: 10,
      step: 2
    },
    extinction: {
      pattern: Pattern.CASCADE,
      direction: Directions.TO_TOP,
      delay: 5,
      step: 3
    }
  },

  transitions: {
    ignition: {
      duration: 400,
      easing: 'ease-out-cubic'
    },
    extinction: {
      duration: 300,
      easing: 'ease-in-quad'
    },
    morph: {
      duration: 600,
      easing: 'ease-in-out-cubic'
    }
  },

  grid: {
    fill: false,
    lifespan: 60
  }
});
```
