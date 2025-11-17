---
title: "Aligners"
description: "Control LED matrix positioning with 9 built-in aligners and learn to create custom aligners"
sidebar:
  order: 8
---

# Aligners

Aligners control where your pattern is positioned within the canvas. Ledding includes 9 built-in aligners covering all common alignment scenarios, plus support for custom aligners.

## Built-in Aligners

### CenterAligner (Default)

Centers the pattern both horizontally and vertically.

```typescript
import { Ledding, CenterAligner } from 'ledding';

const led = new Ledding('#container', {
  aligner: CenterAligner
});
```

**Visual:**
```
+-------------------+
|                   |
|     [Pattern]     |
|                   |
+-------------------+
```

### TopLeftAligner

Positions the pattern at the top-left corner.

```typescript
import { TopLeftAligner } from 'ledding';

const led = new Ledding('#container', {
  aligner: TopLeftAligner
});
```

**Visual:**
```
+-------------------+
| [Pattern]         |
|                   |
|                   |
+-------------------+
```

### TopAligner

Centers horizontally at the top.

```typescript
import { TopAligner } from 'ledding';

const led = new Ledding('#container', {
  aligner: TopAligner
});
```

**Visual:**
```
+-------------------+
|     [Pattern]     |
|                   |
|                   |
+-------------------+
```

### TopRightAligner

Positions at the top-right corner.

```typescript
import { TopRightAligner } from 'ledding';

const led = new Ledding('#container', {
  aligner: TopRightAligner
});
```

**Visual:**
```
+-------------------+
|         [Pattern] |
|                   |
|                   |
+-------------------+
```

### LeftAligner

Centers vertically on the left side.

```typescript
import { LeftAligner } from 'ledding';

const led = new Ledding('#container', {
  aligner: LeftAligner
});
```

**Visual:**
```
+-------------------+
|                   |
| [Pattern]         |
|                   |
+-------------------+
```

### RightAligner

Centers vertically on the right side.

```typescript
import { RightAligner } from 'ledding';

const led = new Ledding('#container', {
  aligner: RightAligner
});
```

**Visual:**
```
+-------------------+
|                   |
|         [Pattern] |
|                   |
+-------------------+
```

### BottomLeftAligner

Positions at the bottom-left corner.

```typescript
import { BottomLeftAligner } from 'ledding';

const led = new Ledding('#container', {
  aligner: BottomLeftAligner
});
```

**Visual:**
```
+-------------------+
|                   |
|                   |
| [Pattern]         |
+-------------------+
```

### BottomAligner

Centers horizontally at the bottom.

```typescript
import { BottomAligner } from 'ledding';

const led = new Ledding('#container', {
  aligner: BottomAligner
});
```

**Visual:**
```
+-------------------+
|                   |
|                   |
|     [Pattern]     |
+-------------------+
```

### BottomRightAligner

Positions at the bottom-right corner.

```typescript
import { BottomRightAligner } from 'ledding';

const led = new Ledding('#container', {
  aligner: BottomRightAligner
});
```

**Visual:**
```
+-------------------+
|                   |
|                   |
|         [Pattern] |
+-------------------+
```

## Aligner Interface

All aligners implement the `Aligner` interface:

```typescript
interface Aligner {
  getCoordinates(instance: LeddingInstance): {
    artStartPx: number;   // X offset in pixels
    artStartPxY: number;  // Y offset in pixels
  };
}
```

The aligner receives the full Ledding instance, giving access to:
- Canvas dimensions
- Pattern dimensions
- Current configuration
- All cached calculations

## Creating Custom Aligners

### Fixed Offset Aligner

Position pattern at a specific pixel location:

```typescript
const FixedOffsetAligner: Aligner = {
  getCoordinates(instance) {
    return {
      artStartPx: 50,   // 50px from left
      artStartPxY: 100  // 100px from top
    };
  }
};

const led = new Ledding('#container', {
  aligner: FixedOffsetAligner
});
```

### Percentage-Based Aligner

Position based on percentage of canvas:

```typescript
const PercentageAligner: Aligner = {
  getCoordinates(instance) {
    const canvasWidth = instance.canvas.width;
    const canvasHeight = instance.canvas.height;

    // Position at 25% from left, 75% from top
    const percentX = 0.25;
    const percentY = 0.75;

    const artCols = instance.options.artPattern[0]?.length || 0;
    const artRows = instance.options.artPattern.length;
    const ledFullSize = instance.dimensions.ledFullSize;

    const artWidthPx = artCols * ledFullSize;
    const artHeightPx = artRows * ledFullSize;

    return {
      artStartPx: canvasWidth * percentX - artWidthPx / 2,
      artStartPxY: canvasHeight * percentY - artHeightPx / 2
    };
  }
};
```

### Golden Ratio Aligner

Position using the golden ratio:

```typescript
const GoldenRatioAligner: Aligner = {
  getCoordinates(instance) {
    const PHI = 1.618033988749895;
    const canvasWidth = instance.canvas.width;
    const canvasHeight = instance.canvas.height;

    const artCols = instance.options.artPattern[0]?.length || 0;
    const artRows = instance.options.artPattern.length;
    const ledFullSize = instance.dimensions.ledFullSize;

    const artWidthPx = artCols * ledFullSize;
    const artHeightPx = artRows * ledFullSize;

    // Golden ratio position
    const artStartPx = (canvasWidth - artWidthPx) / PHI;
    const artStartPxY = (canvasHeight - artHeightPx) / PHI;

    return { artStartPx, artStartPxY };
  }
};
```

### Dynamic Aligner

Change alignment based on conditions:

```typescript
let alignmentMode = 'center';

const DynamicAligner: Aligner = {
  getCoordinates(instance) {
    const artCols = instance.options.artPattern[0]?.length || 0;
    const artRows = instance.options.artPattern.length;
    const ledFullSize = instance.dimensions.ledFullSize;

    const artWidthPx = artCols * ledFullSize;
    const artHeightPx = artRows * ledFullSize;
    const canvasWidth = instance.canvas.width;
    const canvasHeight = instance.canvas.height;

    switch (alignmentMode) {
      case 'top-left':
        return { artStartPx: 0, artStartPxY: 0 };

      case 'center':
        return {
          artStartPx: (canvasWidth - artWidthPx) / 2,
          artStartPxY: (canvasHeight - artHeightPx) / 2
        };

      case 'bottom-right':
        return {
          artStartPx: canvasWidth - artWidthPx,
          artStartPxY: canvasHeight - artHeightPx
        };

      default:
        return { artStartPx: 0, artStartPxY: 0 };
    }
  }
};

// Change alignment at runtime
function setAlignment(mode) {
  alignmentMode = mode;
  // Ledding will use new alignment on next frame
}
```

### Animated Aligner

Create movement effects:

```typescript
let time = 0;

const FloatingAligner: Aligner = {
  getCoordinates(instance) {
    const artCols = instance.options.artPattern[0]?.length || 0;
    const artRows = instance.options.artPattern.length;
    const ledFullSize = instance.dimensions.ledFullSize;

    const artWidthPx = artCols * ledFullSize;
    const artHeightPx = artRows * ledFullSize;
    const canvasWidth = instance.canvas.width;
    const canvasHeight = instance.canvas.height;

    // Base center position
    const centerX = (canvasWidth - artWidthPx) / 2;
    const centerY = (canvasHeight - artHeightPx) / 2;

    // Add floating motion
    const offsetX = Math.sin(time * 0.002) * 20;
    const offsetY = Math.cos(time * 0.003) * 15;

    return {
      artStartPx: centerX + offsetX,
      artStartPxY: centerY + offsetY
    };
  }
};

const led = new Ledding('#container', {
  aligner: FloatingAligner
});

// Update time
led.on('beforeDraw', () => {
  time = performance.now();
});
```

### Responsive Aligner

Adjust based on screen size:

```typescript
const ResponsiveAligner: Aligner = {
  getCoordinates(instance) {
    const canvasWidth = instance.canvas.width;
    const canvasHeight = instance.canvas.height;

    const artCols = instance.options.artPattern[0]?.length || 0;
    const artRows = instance.options.artPattern.length;
    const ledFullSize = instance.dimensions.ledFullSize;

    const artWidthPx = artCols * ledFullSize;
    const artHeightPx = artRows * ledFullSize;

    // Mobile: top-center
    if (canvasWidth < 768) {
      return {
        artStartPx: (canvasWidth - artWidthPx) / 2,
        artStartPxY: 20
      };
    }

    // Tablet: center
    if (canvasWidth < 1024) {
      return {
        artStartPx: (canvasWidth - artWidthPx) / 2,
        artStartPxY: (canvasHeight - artHeightPx) / 2
      };
    }

    // Desktop: offset right
    return {
      artStartPx: canvasWidth * 0.6,
      artStartPxY: (canvasHeight - artHeightPx) / 2
    };
  }
};
```

### Aspect Ratio Safe Aligner

Maintain safe zones:

```typescript
const SafeZoneAligner: Aligner = {
  getCoordinates(instance) {
    const canvasWidth = instance.canvas.width;
    const canvasHeight = instance.canvas.height;

    const artCols = instance.options.artPattern[0]?.length || 0;
    const artRows = instance.options.artPattern.length;
    const ledFullSize = instance.dimensions.ledFullSize;

    const artWidthPx = artCols * ledFullSize;
    const artHeightPx = artRows * ledFullSize;

    // Define safe zone (10% margins)
    const safeMargin = 0.1;
    const safeLeft = canvasWidth * safeMargin;
    const safeTop = canvasHeight * safeMargin;
    const safeRight = canvasWidth * (1 - safeMargin);
    const safeBottom = canvasHeight * (1 - safeMargin);

    // Center within safe zone
    const safeWidth = safeRight - safeLeft;
    const safeHeight = safeBottom - safeTop;

    const artStartPx = safeLeft + (safeWidth - artWidthPx) / 2;
    const artStartPxY = safeTop + (safeHeight - artHeightPx) / 2;

    return { artStartPx, artStartPxY };
  }
};
```

## Using Aligners with Scroll

Aligners work in conjunction with the scroll animation:

```typescript
import { CenterAligner, Directions } from 'ledding';

const led = new Ledding('#container', {
  aligner: CenterAligner,  // Pattern starts centered
  animation: {
    scroll: {
      direction: Directions.TO_LEFT,  // Then scrolls left
      speed: 50
    }
  }
});
```

The aligner determines the initial position, and the scroll moves the pattern from there.

## Accessing Alignment Data

After setup, you can access the calculated position:

```typescript
const led = new Ledding('#container');

console.log(led.artPosition);
// {
//   startPx: 150,      // X offset
//   startPxY: 75,      // Y offset
//   widthPx: 200,      // Pattern width
//   heightPx: 150      // Pattern height
// }
```

## Combining with Events

Update alignment on resize:

```typescript
led.on('resize', (instance) => {
  console.log('New art position:', instance.artPosition);
});
```

## Tree-Shaking Imports

Import only what you need:

```typescript
// Import specific aligners
import { CenterAligner, TopLeftAligner } from 'ledding/aligners';

// Or from main export
import { CenterAligner } from 'ledding';
```

## Common Use Cases

### Logo in Header

```typescript
const led = new Ledding('#header-logo', {
  aligner: LeftAligner,
  artPattern: companyLogoPattern
});
```

### Centered Hero Animation

```typescript
const led = new Ledding('#hero', {
  aligner: CenterAligner,
  artPattern: heroPattern,
  animation: {
    scroll: {
      direction: Directions.TO_LEFT,
      speed: 30
    }
  }
});
```

### Footer Badge

```typescript
const led = new Ledding('#footer', {
  aligner: BottomRightAligner,
  artPattern: badgePattern
});
```

### Floating Menu Icon

```typescript
let clickCount = 0;

const MenuIconAligner: Aligner = {
  getCoordinates(instance) {
    const canvasWidth = instance.canvas.width;

    // Bounce effect on click
    const bounce = Math.max(0, Math.sin(clickCount * Math.PI) * 10);

    return {
      artStartPx: canvasWidth - 50,  // Right side
      artStartPxY: 20 - bounce       // Top with bounce
    };
  }
};

const led = new Ledding('#menu-icon', {
  aligner: MenuIconAligner
});

document.getElementById('menu-icon').addEventListener('click', () => {
  clickCount++;
  setTimeout(() => clickCount = 0, 300);
});
```

## Next Steps

- [Events](/docs/events) - React to alignment changes
- [Configuration](/docs/configuration) - Complete options reference
- [Performance](/docs/performance) - Optimize aligner calculations
