---
title: "Getting Started"
description: "Quick start guide for Ledding - installation, basic usage, and your first LED matrix animation"
sidebar:
  order: 1
---

# Getting Started

Ledding is a high-performance LED matrix animation library for Canvas 2D. It provides a simple yet powerful API for creating animated LED matrix displays with smooth transitions, customizable patterns, and extensive configuration options.

## Installation

### npm

```bash
npm install ledding
```

### yarn

```bash
yarn add ledding
```

### pnpm

```bash
pnpm add ledding
```

### CDN

For quick prototyping, you can use a CDN:

```html
<script src="https://unpkg.com/ledding@2.0.0/dist/ledding.umd.js"></script>
```

## Basic Usage

### ES Modules (Recommended)

```typescript
import { Ledding } from 'ledding';

// Create a container element
const container = document.querySelector('#led-display');

// Initialize Ledding
const led = new Ledding('#led-display', {
  ledSize: 20,
  ledGap: 4,
  artPattern: [
    [1, 1, 1],
    [1, 0, 1],
    [1, 1, 1]
  ]
});
```

### CommonJS

```javascript
const { Ledding } = require('ledding');

const led = new Ledding('#led-display');
```

### UMD (Browser Global)

```html
<script src="https://unpkg.com/ledding@2.0.0/dist/ledding.umd.js"></script>
<script>
  const led = new Ledding.Ledding('#led-display');
</script>
```

## Your First Animation

Here's a complete example to get you started:

```html
<!DOCTYPE html>
<html>
<head>
  <title>My First LED Animation</title>
  <style>
    #led-container {
      width: 800px;
      height: 400px;
      background: #1a1a2e;
    }
  </style>
</head>
<body>
  <div id="led-container"></div>

  <script type="module">
    import { Ledding, Directions, Pattern } from 'ledding';

    // Define a heart pattern
    const heartPattern = [
      [0, 1, 1, 0, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 0, 0, 0]
    ];

    // Initialize Ledding
    const led = new Ledding('#led-container', {
      ledSize: 30,
      ledGap: 6,
      scaleToFit: true,
      artPattern: heartPattern,
      colors: {
        background: '#1a1a2e',
        base: 'rgb(45, 55, 72)',
        states: {
          1: 'rgb(255, 100, 150)'
        }
      },
      animation: {
        scroll: {
          direction: Directions.TO_LEFT,
          speed: 50
        },
        ignition: {
          pattern: Pattern.CASCADE,
          direction: Directions.TO_BOTTOM,
          delay: 0,
          step: 4
        }
      },
      fps: 30
    });

    console.log('LED count:', led.getLedCount());
    console.log('Frame rate:', led.getFrameRate());
  </script>
</body>
</html>
```

## Understanding Patterns

Patterns are 2D arrays where each number represents a state:

- `0` - Inactive LED (uses base color)
- `1`, `2`, `3`, etc. - Active states (uses colors from `colors.states`)

```typescript
const pattern = [
  [0, 1, 0],  // Top row: off, on, off
  [1, 2, 1],  // Middle row: state 1, state 2, state 1
  [0, 1, 0]   // Bottom row: off, on, off
];
```

Each state can have its own color defined in the configuration:

```typescript
colors: {
  base: 'rgb(45, 55, 72)',  // Color for state 0
  states: {
    1: 'rgb(209, 162, 255)',  // BRIGHT
    2: 'rgb(167, 86, 255)',   // MEDIUM
    3: 'rgb(113, 63, 222)'    // DIM
  }
}
```

## Animation Control

```typescript
// Pause the animation
led.pause();

// Resume the animation
led.resume();

// Check if running
console.log(led.isRunning); // true or false

// Clean up when done
led.destroy();
```

## Changing Patterns

You can dynamically change patterns with smooth transitions:

```typescript
const newPattern = [
  [1, 0, 1],
  [0, 1, 0],
  [1, 0, 1]
];

// Instant change
led.setPattern(newPattern);

// With transition
led.setPattern(newPattern, {
  strategy: 'morph',
  duration: 1000,
  easing: 'ease-in-out-cubic'
});
```

## Next Steps

- [Configuration](/docs/configuration) - Learn all configuration options
- [API Reference](/docs/api-reference) - Complete API documentation
- [Patterns](/docs/patterns) - Deep dive into pattern creation
- [Transitions](/docs/transitions) - Master the transition system
- [Renderers](/docs/renderers) - Customize LED appearance
