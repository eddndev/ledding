---
title: "Events"
description: "Hook into the Ledding lifecycle with the event system - beforeDraw, afterDraw, resize, and destroy events"
sidebar:
  order: 9
---

# Event System

Ledding provides an event system that allows you to hook into various points of the animation lifecycle. This enables custom behaviors, performance monitoring, synchronization, and cleanup operations.

## Available Events

| Event | Description | When Fired |
|-------|-------------|------------|
| `beforeDraw` | Before each frame is drawn | Every frame, before rendering |
| `afterDraw` | After each frame is drawn | Every frame, after rendering |
| `resize` | When canvas is resized | After setup() completes |
| `destroy` | When instance is destroyed | During destroy() call |

## Basic Usage

### Adding Event Listeners

```typescript
import { Ledding } from 'ledding';

const led = new Ledding('#container');

led.on('beforeDraw', (instance) => {
  console.log('About to draw frame');
});

led.on('afterDraw', (instance) => {
  console.log('Frame drawn');
});

led.on('resize', (instance) => {
  console.log('Canvas resized to:', instance.canvas.width, instance.canvas.height);
});

led.on('destroy', (instance) => {
  console.log('Instance destroyed');
});
```

### Removing Event Listeners

```typescript
const myHandler = (instance) => {
  console.log('Frame drawn');
};

// Add listener
led.on('afterDraw', myHandler);

// Remove listener (use same function reference)
led.off('afterDraw', myHandler);
```

**Important:** You must pass the exact same function reference to `off()` as you passed to `on()`.

## Event Callback Type

All event callbacks receive the Ledding instance:

```typescript
type LeddingEventCallback = (instance: LeddingInstance) => void;
```

The instance provides access to:
- `container` - DOM container element
- `canvas` - Canvas element
- `ctx` - 2D rendering context
- `options` - Configuration
- `dimensions` - Cached dimensions
- `artPosition` - Pattern position
- `grid` - Grid state
- `parsedColors` - Color cache
- `scrollX` / `scrollY` - Scroll position

## Common Use Cases

### Frame Rate Monitor

```typescript
let frameCount = 0;
let lastSecond = performance.now();

led.on('afterDraw', () => {
  frameCount++;

  const now = performance.now();
  if (now - lastSecond >= 1000) {
    console.log(`FPS: ${frameCount}`);
    frameCount = 0;
    lastSecond = now;
  }
});
```

### Performance Profiling

```typescript
let drawStartTime = 0;

led.on('beforeDraw', () => {
  drawStartTime = performance.now();
});

led.on('afterDraw', () => {
  const drawTime = performance.now() - drawStartTime;
  if (drawTime > 16.67) { // More than 60fps frame budget
    console.warn(`Slow frame: ${drawTime.toFixed(2)}ms`);
  }
});
```

### Custom Overlay Rendering

```typescript
led.on('afterDraw', (instance) => {
  const ctx = instance.ctx;

  // Draw frame counter
  ctx.fillStyle = 'white';
  ctx.font = '12px monospace';
  ctx.fillText(`LEDs: ${instance.grid.leds?.size || 0}`, 10, 20);
  ctx.fillText(`Scroll: ${instance.scrollX.toFixed(1)}`, 10, 40);
});
```

### Synchronizing External Elements

```typescript
led.on('afterDraw', (instance) => {
  // Update progress bar based on scroll position
  const scrollPercent = (instance.scrollX % instance.dimensions.gridWidthPx) /
                        instance.dimensions.gridWidthPx;
  progressBar.style.width = `${scrollPercent * 100}%`;
});
```

### Responsive Adjustments

```typescript
led.on('resize', (instance) => {
  // Adjust based on new size
  if (instance.canvas.width < 600) {
    // Mobile adjustments
    document.body.classList.add('mobile-view');
  } else {
    document.body.classList.remove('mobile-view');
  }

  console.log('New dimensions:', {
    canvas: `${instance.canvas.width}x${instance.canvas.height}`,
    grid: `${instance.grid.numCols}x${instance.grid.numRows}`,
    ledSize: instance.dimensions.scaledLedSize
  });
});
```

### Cleanup on Destroy

```typescript
led.on('destroy', (instance) => {
  // Clean up external resources
  clearInterval(myInterval);
  removeExternalEventListeners();
  saveState();

  console.log('Ledding instance cleaned up');
});
```

### Animation Synchronization

```typescript
// Sync music with LED animation
let audioContext;
let analyser;

led.on('beforeDraw', (instance) => {
  if (!analyser) return;

  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);

  // Adjust opacity based on audio
  const avgFrequency = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
  instance.options.opacities.active = 0.5 + (avgFrequency / 255) * 0.5;
});
```

### Custom Effects

```typescript
// Add trail effect
let previousPositions = [];

led.on('beforeDraw', (instance) => {
  // Store current scroll position
  previousPositions.push({
    x: instance.scrollX,
    y: instance.scrollY
  });

  // Keep last 10 positions
  if (previousPositions.length > 10) {
    previousPositions.shift();
  }
});

led.on('afterDraw', (instance) => {
  const ctx = instance.ctx;

  // Draw trail
  previousPositions.forEach((pos, i) => {
    const alpha = i / previousPositions.length * 0.3;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillRect(pos.x % 100, pos.y % 100, 2, 2);
  });
});
```

### Debug Information

```typescript
led.on('afterDraw', (instance) => {
  const ctx = instance.ctx;

  // Show debug overlay
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(10, 10, 200, 120);

  ctx.fillStyle = '#0f0';
  ctx.font = '11px monospace';

  const info = [
    `Canvas: ${instance.canvas.width}x${instance.canvas.height}`,
    `Grid: ${instance.grid.numCols}x${instance.grid.numRows}`,
    `LEDs: ${instance.grid.leds?.size || 0}`,
    `Scroll: ${instance.scrollX.toFixed(1)}, ${instance.scrollY.toFixed(1)}`,
    `LED Size: ${instance.dimensions.scaledLedSize.toFixed(2)}`,
    `Sparse: ${instance.grid.isSparse}`
  ];

  info.forEach((line, i) => {
    ctx.fillText(line, 15, 25 + i * 15);
  });

  ctx.restore();
});
```

### State Persistence

```typescript
// Save state before destroying
led.on('destroy', (instance) => {
  const state = {
    scrollX: instance.scrollX,
    scrollY: instance.scrollY,
    pattern: instance.options.artPattern,
    timestamp: Date.now()
  };

  localStorage.setItem('ledding-state', JSON.stringify(state));
});

// Restore state on init
const savedState = JSON.parse(localStorage.getItem('ledding-state') || 'null');
if (savedState) {
  led.scrollX = savedState.scrollX;
  led.scrollY = savedState.scrollY;
}
```

### Analytics Tracking

```typescript
let totalFrames = 0;
let startTime = performance.now();

led.on('afterDraw', () => {
  totalFrames++;
});

led.on('destroy', () => {
  const totalTime = (performance.now() - startTime) / 1000;
  const avgFps = totalFrames / totalTime;

  analytics.track('ledding_performance', {
    totalFrames,
    totalTime: totalTime.toFixed(2),
    averageFps: avgFps.toFixed(2)
  });
});
```

## Multiple Listeners

You can add multiple listeners for the same event:

```typescript
led.on('afterDraw', logFps);
led.on('afterDraw', updateUI);
led.on('afterDraw', checkPerformance);

// All three will be called in the order they were added
```

## Event Flow

Here's the complete event flow during the animation lifecycle:

```
Instance Created
    ↓
setup() called
    ↓
"resize" event
    ↓
Animation Loop Starts
    ↓
┌─────────────────┐
│  "beforeDraw"   │
│       ↓         │
│   update()      │
│       ↓         │
│   draw()        │
│       ↓         │
│  "afterDraw"    │
└────────┬────────┘
         │
    [Loop continues]
         │
    [Window resize]
         ↓
    setup() called
         ↓
    "resize" event
         │
    [Loop continues]
         │
    destroy() called
         ↓
    "destroy" event
         ↓
    Instance Destroyed
```

## Best Practices

### 1. Keep Handlers Lightweight

```typescript
// Good: Simple operation
led.on('afterDraw', () => {
  frameCount++;
});

// Bad: Heavy computation
led.on('afterDraw', () => {
  // Expensive calculations that block rendering
  for (let i = 0; i < 1000000; i++) {
    // ...
  }
});
```

### 2. Clean Up Event Listeners

```typescript
class MyComponent {
  private led: Ledding;
  private handler = (instance) => {
    // Handle event
  };

  mount() {
    this.led = new Ledding('#container');
    this.led.on('afterDraw', this.handler);
  }

  unmount() {
    this.led.off('afterDraw', this.handler);
    this.led.destroy();
  }
}
```

### 3. Use Closure for State

```typescript
// Good: Closure for state
const createFpsMonitor = () => {
  let frameCount = 0;
  let lastTime = performance.now();

  return (instance) => {
    frameCount++;
    const now = performance.now();
    if (now - lastTime > 1000) {
      console.log(`FPS: ${frameCount}`);
      frameCount = 0;
      lastTime = now;
    }
  };
};

const fpsMonitor = createFpsMonitor();
led.on('afterDraw', fpsMonitor);
```

### 4. Avoid Modifying Instance State

```typescript
// Caution: Direct state modification
led.on('beforeDraw', (instance) => {
  // Be careful with direct modifications
  // This might interfere with internal state
  instance.scrollX = 100;  // Use with caution
});

// Better: Use public API
led.on('afterDraw', () => {
  if (shouldPause) {
    led.pause();  // Use public method
  }
});
```

### 5. Handle Errors Gracefully

```typescript
led.on('afterDraw', (instance) => {
  try {
    // Code that might throw
    updateExternalUI(instance);
  } catch (error) {
    console.error('Error in afterDraw handler:', error);
    // Don't let errors break the animation loop
  }
});
```

## TypeScript Support

Full type safety with TypeScript:

```typescript
import { Ledding, LeddingEventType, LeddingEventCallback } from 'ledding';

const led = new Ledding('#container');

// Type-safe event handler
const handler: LeddingEventCallback = (instance) => {
  const width: number = instance.canvas.width;
  const height: number = instance.canvas.height;
  console.log(`Canvas: ${width}x${height}`);
};

// Type-safe event type
const eventType: LeddingEventType = 'afterDraw';

led.on(eventType, handler);
```

## Next Steps

- [Performance](/docs/performance) - Optimize event handlers
- [API Reference](/docs/api-reference) - Complete API documentation
- [Renderers](/docs/renderers) - Custom rendering with events
