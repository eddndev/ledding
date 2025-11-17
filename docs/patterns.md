---
title: "Patterns"
description: "Learn how to create and use patterns in Ledding - from simple shapes to complex pixel art"
sidebar:
  order: 4
---

# Patterns

Patterns are the core visual element of Ledding. They define which LEDs are active and in what state. This guide covers everything you need to know about creating, managing, and animating patterns.

## Understanding Patterns

A pattern is a 2D array where each element represents the state of an LED:

```typescript
const pattern = [
  [0, 1, 0],  // Row 0: off, state 1, off
  [1, 0, 1],  // Row 1: state 1, off, state 1
  [0, 1, 0]   // Row 2: off, state 1, off
];
```

### State Values

- **`0`** - Inactive LED (uses base color with base opacity)
- **`1`, `2`, `3`, ...** - Active states (uses colors from `colors.states`)

Each state can have:
- Different colors
- Different sizes (optional)
- Same transition behavior

## Creating Patterns

### Simple Shapes

**Square:**
```typescript
const square = [
  [1, 1, 1],
  [1, 1, 1],
  [1, 1, 1]
];
```

**Hollow Square:**
```typescript
const hollowSquare = [
  [1, 1, 1],
  [1, 0, 1],
  [1, 1, 1]
];
```

**Cross:**
```typescript
const cross = [
  [0, 1, 0],
  [1, 1, 1],
  [0, 1, 0]
];
```

**Diamond:**
```typescript
const diamond = [
  [0, 0, 1, 0, 0],
  [0, 1, 1, 1, 0],
  [1, 1, 1, 1, 1],
  [0, 1, 1, 1, 0],
  [0, 0, 1, 0, 0]
];
```

### Complex Shapes

**Heart:**
```typescript
const heart = [
  [0, 1, 1, 0, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 0, 0],
  [0, 0, 0, 1, 0, 0, 0]
];
```

**Star:**
```typescript
const star = [
  [0, 0, 0, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 0, 0],
  [1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 0],
  [0, 1, 1, 0, 1, 1, 0],
  [0, 1, 0, 0, 0, 1, 0],
  [1, 0, 0, 0, 0, 0, 1]
];
```

**Arrow:**
```typescript
const arrowRight = [
  [0, 0, 1, 0, 0],
  [0, 0, 0, 1, 0],
  [1, 1, 1, 1, 1],
  [0, 0, 0, 1, 0],
  [0, 0, 1, 0, 0]
];
```

### Multi-State Patterns

Use multiple states for gradient effects or different intensities:

```typescript
const gradientCircle = [
  [0, 0, 3, 3, 0, 0],
  [0, 3, 2, 2, 3, 0],
  [3, 2, 1, 1, 2, 3],
  [3, 2, 1, 1, 2, 3],
  [0, 3, 2, 2, 3, 0],
  [0, 0, 3, 3, 0, 0]
];

// Configure colors for each state
const led = new Ledding('#container', {
  artPattern: gradientCircle,
  colors: {
    base: 'rgb(30, 30, 30)',
    states: {
      1: 'rgb(255, 255, 255)',  // Brightest
      2: 'rgb(180, 180, 180)',  // Medium
      3: 'rgb(100, 100, 100)'   // Dimmest
    }
  }
});
```

### Size Variations

Different states can have different sizes:

```typescript
const sizePattern = [
  [1, 2, 3],
  [2, 1, 2],
  [3, 2, 1]
];

const led = new Ledding('#container', {
  artPattern: sizePattern,
  colors: {
    states: {
      1: 'rgb(255, 100, 100)',
      2: 'rgb(255, 100, 100)',
      3: 'rgb(255, 100, 100)'
    }
  },
  sizes: {
    states: {
      1: 1.0,   // Full size
      2: 0.7,   // 70% size
      3: 0.4    // 40% size
    }
  }
});
```

## Pattern Tools and Utilities

### Converting Images to Patterns

You can create a utility to convert images to patterns:

```typescript
function imageToPattern(imageData, threshold = 128) {
  const pattern = [];
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const brightness = (data[index] + data[index + 1] + data[index + 2]) / 3;
      row.push(brightness > threshold ? 1 : 0);
    }
    pattern.push(row);
  }

  return pattern;
}

// Usage with canvas
const img = new Image();
img.onload = () => {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, img.width, img.height);
  const pattern = imageToPattern(imageData);
  led.setPattern(pattern);
};
img.src = 'your-image.png';
```

### Text to Pattern

Create patterns from text (requires a simple bitmap font):

```typescript
const charPatterns = {
  'A': [
    [0, 1, 0],
    [1, 0, 1],
    [1, 1, 1],
    [1, 0, 1],
    [1, 0, 1]
  ],
  'B': [
    [1, 1, 0],
    [1, 0, 1],
    [1, 1, 0],
    [1, 0, 1],
    [1, 1, 0]
  ],
  // ... more characters
};

function textToPattern(text, charPatterns) {
  const chars = text.split('');
  const height = charPatterns[chars[0]]?.length || 5;
  const pattern = Array(height).fill(null).map(() => []);

  chars.forEach((char, i) => {
    const charPattern = charPatterns[char.toUpperCase()];
    if (charPattern) {
      charPattern.forEach((row, y) => {
        pattern[y].push(...row);
        if (i < chars.length - 1) {
          pattern[y].push(0); // Space between characters
        }
      });
    }
  });

  return pattern;
}

const helloPattern = textToPattern('HELLO', charPatterns);
```

### Pattern Transformations

**Rotate 90 degrees:**
```typescript
function rotatePattern90(pattern) {
  const rows = pattern.length;
  const cols = pattern[0].length;
  const rotated = [];

  for (let x = 0; x < cols; x++) {
    rotated[x] = [];
    for (let y = rows - 1; y >= 0; y--) {
      rotated[x].push(pattern[y][x]);
    }
  }

  return rotated;
}
```

**Flip horizontally:**
```typescript
function flipHorizontal(pattern) {
  return pattern.map(row => [...row].reverse());
}
```

**Flip vertically:**
```typescript
function flipVertical(pattern) {
  return [...pattern].reverse();
}
```

**Scale pattern:**
```typescript
function scalePattern(pattern, factor) {
  const scaled = [];

  pattern.forEach(row => {
    const scaledRow = [];
    row.forEach(cell => {
      for (let i = 0; i < factor; i++) {
        scaledRow.push(cell);
      }
    });
    for (let i = 0; i < factor; i++) {
      scaled.push([...scaledRow]);
    }
  });

  return scaled;
}

// Double the size
const bigPattern = scalePattern(pattern, 2);
```

## Dynamic Pattern Changes

### Instant Change

```typescript
led.setPattern(newPattern);
```

### Morph Transition

Smoothly transition between patterns:

```typescript
led.setPattern(newPattern, {
  strategy: 'morph',
  duration: 1000,
  easing: 'ease-in-out-cubic'
});
```

The morph strategy:
- LEDs that stay active smoothly change size/opacity
- LEDs that become inactive fade out
- LEDs that become active fade in
- All transitions happen simultaneously

### Fade Transition

Fade out old pattern, then fade in new pattern:

```typescript
led.setPattern(newPattern, {
  strategy: 'fade',
  duration: 1500,
  easing: 'ease-out-quad'
});
```

The fade strategy:
- Phase 1 (50% of duration): All LEDs fade to inactive
- Phase 2 (50% of duration): New pattern fades in

### Crossfade Transition

Similar to morph but optimized for different pattern shapes:

```typescript
led.setPattern(newPattern, {
  strategy: 'crossfade',
  duration: 800,
  easing: 'ease-in-out-quad'
});
```

## Pattern Animation Ideas

### Pulsing Effect

```typescript
const patterns = [
  [[0, 1, 0], [1, 1, 1], [0, 1, 0]],  // Small
  [[1, 1, 1], [1, 1, 1], [1, 1, 1]]   // Large
];

let index = 0;
setInterval(() => {
  led.setPattern(patterns[index], {
    strategy: 'morph',
    duration: 500,
    easing: 'ease-in-out-sine'
  });
  index = (index + 1) % patterns.length;
}, 1000);
```

### Loading Animation

```typescript
const loadingFrames = [
  [[1, 0, 0, 0]],
  [[0, 1, 0, 0]],
  [[0, 0, 1, 0]],
  [[0, 0, 0, 1]]
];

let frame = 0;
setInterval(() => {
  led.setPattern(loadingFrames[frame]);
  frame = (frame + 1) % loadingFrames.length;
}, 200);
```

### Wave Effect

```typescript
function createWave(width, time) {
  const pattern = [];
  for (let y = 0; y < 5; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      const height = Math.sin((x + time) * 0.5) * 2 + 2;
      row.push(y >= (5 - height) ? 1 : 0);
    }
    pattern.push(row);
  }
  return pattern;
}

let time = 0;
setInterval(() => {
  led.setPattern(createWave(20, time));
  time += 0.5;
}, 100);
```

## Best Practices

### Pattern Size

- Keep patterns reasonably sized for performance
- Larger patterns = more LEDs to render
- Use `scaleToFit: true` to automatically fit patterns

### State Management

- Use state 0 for truly "off" LEDs
- Reserve low numbers (1-3) for common states
- Document what each state means in your code

### Memory Efficiency

- Patterns are stored as simple arrays (memory efficient)
- Reuse pattern references when possible
- Clear patterns when no longer needed

### Performance

```typescript
// Good: Simple array
const pattern = [[1, 1], [1, 1]];

// Avoid: Complex nested structures
const pattern = [[{state: 1}, {state: 1}], ...]; // Not supported
```

## Common Patterns Library

Here's a collection of ready-to-use patterns:

```typescript
export const patterns = {
  square: [[1, 1], [1, 1]],

  plus: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 1, 0]
  ],

  x: [
    [1, 0, 1],
    [0, 1, 0],
    [1, 0, 1]
  ],

  circle: [
    [0, 1, 1, 0],
    [1, 1, 1, 1],
    [1, 1, 1, 1],
    [0, 1, 1, 0]
  ],

  triangle: [
    [0, 0, 1, 0, 0],
    [0, 1, 1, 1, 0],
    [1, 1, 1, 1, 1]
  ],

  checkmark: [
    [0, 0, 0, 0, 1],
    [0, 0, 0, 1, 1],
    [1, 0, 1, 1, 0],
    [1, 1, 1, 0, 0],
    [0, 1, 0, 0, 0]
  ]
};
```

## Next Steps

- [Transitions](/docs/transitions) - Master transition effects
- [Playlist](/docs/playlist) - Automate pattern sequences
- [Performance](/docs/performance) - Optimize for large patterns
