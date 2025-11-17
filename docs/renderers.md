---
title: "Renderers"
description: "Built-in LED renderers and how to create custom renderers for unique LED shapes and effects"
sidebar:
  order: 7
---

# Renderers

Renderers control how individual LEDs are drawn on the canvas. Ledding comes with built-in renderers and supports custom renderers for unique visual effects.

## Built-in Renderers

### CircleRenderer

The default renderer that draws circular LEDs.

```typescript
import { Ledding, CircleRenderer } from 'ledding';

const led = new Ledding('#container', {
  renderer: CircleRenderer
});
```

**Features:**
- Uses Path2D for optimized rendering
- Pre-caches a unit circle on setup
- Scales the unit circle for each LED
- Best for classic LED matrix appearance

**Implementation:**

```typescript
const CircleRenderer: Renderer = {
  setup(instance: LeddingInstance): void {
    // Create a unit circle path once
    const path = new Path2D();
    path.arc(0, 0, 1, 0, Math.PI * 2);
    instance.unitCirclePath = path;
  },

  draw(ctx, led, x, y, color, instance): void {
    const radius = led.currentSize / 2;
    if (radius < 0.1) return;

    ctx.fillStyle = color;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(radius, radius);
    ctx.fill(instance.unitCirclePath);
    ctx.restore();
  }
};
```

### SquareRenderer

Draws square/rectangular LEDs.

```typescript
import { Ledding, SquareRenderer } from 'ledding';

const led = new Ledding('#container', {
  renderer: SquareRenderer
});
```

**Features:**
- Simple and fast
- No setup required
- Uses `fillRect` for efficiency
- Good for pixel-art style

**Implementation:**

```typescript
const SquareRenderer: Renderer = {
  setup(_instance): void {
    // No setup needed
  },

  draw(ctx, led, x, y, color, _instance): void {
    const size = led.currentSize;
    if (size < 0.1) return;

    ctx.fillStyle = color;
    const cornerX = x - size / 2;
    const cornerY = y - size / 2;
    ctx.fillRect(cornerX, cornerY, size, size);
  }
};
```

## Renderer Interface

All renderers must implement the `Renderer` interface:

```typescript
interface Renderer {
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
```

### `setup(instance)` (Optional)

Called once when the Ledding instance is created.

**Parameters:**
- `instance` - The Ledding instance (provides access to canvas, context, options, etc.)

**Use for:**
- Creating cached paths
- Pre-calculating values
- Setting up WebGL contexts
- Loading textures

### `draw(ctx, led, x, y, color, instance)`

Called for each LED on every frame.

**Parameters:**
- `ctx` - Canvas 2D rendering context
- `led` - Current LED state (size, opacity, position, etc.)
- `x` - X coordinate (center of LED)
- `y` - Y coordinate (center of LED)
- `color` - Pre-calculated color string
- `instance` - The Ledding instance

## Creating Custom Renderers

### Diamond Renderer

```typescript
const DiamondRenderer: Renderer = {
  setup(instance) {
    // Create diamond path once
    const path = new Path2D();
    path.moveTo(0, -1);  // Top
    path.lineTo(1, 0);   // Right
    path.lineTo(0, 1);   // Bottom
    path.lineTo(-1, 0);  // Left
    path.closePath();
    instance.diamondPath = path;
  },

  draw(ctx, led, x, y, color, instance) {
    const size = led.currentSize / 2;
    if (size < 0.1) return;

    ctx.fillStyle = color;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size, size);
    ctx.fill(instance.diamondPath);
    ctx.restore();
  }
};

const led = new Ledding('#container', {
  renderer: DiamondRenderer
});
```

### Rounded Square Renderer

```typescript
const RoundedSquareRenderer: Renderer = {
  setup() {
    // No setup needed
  },

  draw(ctx, led, x, y, color) {
    const size = led.currentSize;
    if (size < 0.1) return;

    const radius = size * 0.2;  // 20% corner radius
    const halfSize = size / 2;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(
      x - halfSize,
      y - halfSize,
      size,
      size,
      radius
    );
    ctx.fill();
  }
};
```

### Glow Renderer

Add a glow effect to LEDs:

```typescript
const GlowRenderer: Renderer = {
  setup() {},

  draw(ctx, led, x, y, color, instance) {
    const size = led.currentSize;
    if (size < 0.1) return;

    const radius = size / 2;

    // Draw glow (only for active LEDs)
    if (led.targetArtValue !== 0) {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.5, color.replace('rgb', 'rgba').replace(')', ', 0.3)'));
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw core LED
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
};
```

### Hexagon Renderer

```typescript
const HexagonRenderer: Renderer = {
  setup(instance) {
    const path = new Path2D();
    const sides = 6;

    for (let i = 0; i < sides; i++) {
      const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
      const x = Math.cos(angle);
      const y = Math.sin(angle);

      if (i === 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    path.closePath();

    instance.hexPath = path;
  },

  draw(ctx, led, x, y, color, instance) {
    const size = led.currentSize / 2;
    if (size < 0.1) return;

    ctx.fillStyle = color;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size, size);
    ctx.fill(instance.hexPath);
    ctx.restore();
  }
};
```

### Star Renderer

```typescript
const StarRenderer: Renderer = {
  setup(instance) {
    const path = new Path2D();
    const points = 5;
    const outerRadius = 1;
    const innerRadius = 0.4;

    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (Math.PI * i) / points - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      if (i === 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    path.closePath();

    instance.starPath = path;
  },

  draw(ctx, led, x, y, color, instance) {
    const size = led.currentSize / 2;
    if (size < 0.1) return;

    ctx.fillStyle = color;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size, size);
    ctx.fill(instance.starPath);
    ctx.restore();
  }
};
```

### Gradient LED Renderer

```typescript
const GradientLedRenderer: Renderer = {
  setup() {},

  draw(ctx, led, x, y, color) {
    const radius = led.currentSize / 2;
    if (radius < 0.1) return;

    // Create radial gradient for 3D effect
    const gradient = ctx.createRadialGradient(
      x - radius * 0.3,  // Light source offset
      y - radius * 0.3,
      0,
      x,
      y,
      radius
    );

    // Parse the RGB color
    const match = color.match(/\d+/g);
    if (match) {
      const [r, g, b] = match.map(Number);
      // Lighter center
      gradient.addColorStop(0, `rgb(${Math.min(255, r + 60)}, ${Math.min(255, g + 60)}, ${Math.min(255, b + 60)})`);
      // Original color
      gradient.addColorStop(0.6, color);
      // Darker edge
      gradient.addColorStop(1, `rgb(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)})`);
    } else {
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, color);
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
};
```

### Image/Texture Renderer

```typescript
const TextureRenderer: Renderer = {
  setup(instance) {
    // Load texture image
    const img = new Image();
    img.src = 'led-texture.png';
    img.onload = () => {
      instance.ledTexture = img;
    };
    instance.ledTexture = null;
  },

  draw(ctx, led, x, y, color, instance) {
    const size = led.currentSize;
    if (size < 0.1) return;

    if (instance.ledTexture) {
      // Draw texture
      ctx.drawImage(
        instance.ledTexture,
        x - size / 2,
        y - size / 2,
        size,
        size
      );

      // Apply color tint
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = color;
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
      ctx.globalCompositeOperation = 'source-over';
    } else {
      // Fallback to circle
      const radius = size / 2;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
};
```

## Advanced Techniques

### Conditional Rendering

Render differently based on LED state:

```typescript
const ConditionalRenderer: Renderer = {
  setup(instance) {
    instance.circlePath = new Path2D();
    instance.circlePath.arc(0, 0, 1, 0, Math.PI * 2);
  },

  draw(ctx, led, x, y, color, instance) {
    const size = led.currentSize / 2;
    if (size < 0.1) return;

    ctx.fillStyle = color;
    ctx.save();
    ctx.translate(x, y);

    // Active LEDs are circles, inactive are squares
    if (led.targetArtValue !== 0) {
      ctx.scale(size, size);
      ctx.fill(instance.circlePath);
    } else {
      ctx.fillRect(-size, -size, size * 2, size * 2);
    }

    ctx.restore();
  }
};
```

### Animation in Renderer

Add animated effects:

```typescript
const PulsingRenderer: Renderer = {
  setup(instance) {
    instance.time = 0;
    instance.circlePath = new Path2D();
    instance.circlePath.arc(0, 0, 1, 0, Math.PI * 2);
  },

  draw(ctx, led, x, y, color, instance) {
    const baseRadius = led.currentSize / 2;
    if (baseRadius < 0.1) return;

    // Add pulsing effect for active LEDs
    let radius = baseRadius;
    if (led.targetArtValue !== 0) {
      const pulse = Math.sin(instance.time * 0.01 + x * 0.1) * 0.1 + 1;
      radius *= pulse;
    }

    ctx.fillStyle = color;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(radius, radius);
    ctx.fill(instance.circlePath);
    ctx.restore();
  }
};

// Update time in beforeDraw event
led.on('beforeDraw', (instance) => {
  instance.time = performance.now();
});
```

### Combining Multiple Shapes

```typescript
const CompositeRenderer: Renderer = {
  setup() {},

  draw(ctx, led, x, y, color) {
    const size = led.currentSize;
    if (size < 0.1) return;

    const radius = size / 2;

    // Outer circle
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner ring
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
};
```

## Performance Tips

### 1. Cache Paths

```typescript
// Good: Create path once
setup(instance) {
  const path = new Path2D();
  // ... build path
  instance.cachedPath = path;
}

// Bad: Create path every frame
draw(ctx, led, x, y, color) {
  const path = new Path2D();
  // ... build path on every call
}
```

### 2. Minimize State Changes

```typescript
// Good: Set fillStyle once per LED
ctx.fillStyle = color;
ctx.fill(path);

// Bad: Redundant calls
ctx.fillStyle = color;
ctx.fillStyle = color;
ctx.fill(path);
```

### 3. Use Transform Stack Efficiently

```typescript
// Good: Single save/restore
ctx.save();
ctx.translate(x, y);
ctx.scale(size, size);
ctx.fill(path);
ctx.restore();

// Bad: Multiple save/restore
ctx.save();
ctx.translate(x, y);
ctx.restore();
ctx.save();
ctx.scale(size, size);
ctx.restore();
```

### 4. Skip Invisible LEDs

```typescript
draw(ctx, led, x, y, color) {
  // Skip if too small to see
  if (led.currentSize < 0.1) return;

  // Skip if fully transparent
  if (led.currentOpacity < 0.01) return;

  // Render...
}
```

### 5. Avoid Expensive Operations

```typescript
// Expensive (avoid in draw)
const gradient = ctx.createRadialGradient(/* ... */);  // Heavy

// Better: Use simple fills when possible
ctx.fillStyle = color;  // Lightweight
```

## Tree-Shaking

Import only the renderers you need:

```typescript
// Only imports CircleRenderer code
import { CircleRenderer } from 'ledding/renderers';

// Imports both
import { CircleRenderer, SquareRenderer } from 'ledding';
```

## Next Steps

- [Aligners](/docs/aligners) - Position your LED matrix
- [Performance](/docs/performance) - Optimize rendering
- [Events](/docs/events) - Hook into render cycle
