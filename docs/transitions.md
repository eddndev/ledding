---
title: "Transitions"
description: "Master the transition system with 28 easing functions, duration-based animations, and pattern transition strategies"
sidebar:
  order: 5
---

# Transitions

Ledding features a powerful transition system with 28 built-in easing functions, support for both legacy lerp-based and modern duration-based transitions, and multiple pattern transition strategies.

## Easing Functions

Ledding includes 28 easing functions for smooth, natural-looking animations:

### Linear

```typescript
'linear'
```

Constant speed from start to finish. No acceleration or deceleration.

### Quadratic

```typescript
'ease-in-quad'      // Accelerates from zero
'ease-out-quad'     // Decelerates to zero
'ease-in-out-quad'  // Accelerates then decelerates
```

### Cubic

```typescript
'ease-in-cubic'
'ease-out-cubic'
'ease-in-out-cubic'
```

More pronounced acceleration/deceleration than quadratic.

### Quartic

```typescript
'ease-in-quart'
'ease-out-quart'
'ease-in-out-quart'
```

Even more pronounced than cubic.

### Quintic

```typescript
'ease-in-quint'
'ease-out-quint'
'ease-in-out-quint'
```

Very strong acceleration/deceleration.

### Exponential

```typescript
'ease-in-expo'
'ease-out-expo'
'ease-in-out-expo'
```

Extreme acceleration/deceleration. Great for dramatic effects.

### Circular

```typescript
'ease-in-circ'
'ease-out-circ'
'ease-in-out-circ'
```

Circular motion curve, smooth and natural.

### Back

```typescript
'ease-in-back'      // Overshoots slightly at start
'ease-out-back'     // Overshoots slightly at end
'ease-in-out-back'  // Overshoots both ends
```

Creates a slight overshoot effect, like pulling back before releasing.

### Elastic

```typescript
'ease-in-elastic'
'ease-out-elastic'
'ease-in-out-elastic'
```

Spring-like bounce effect.

### Bounce

```typescript
'ease-in-bounce'
'ease-out-bounce'
'ease-in-out-bounce'
```

Ball bouncing effect.

## Using Easing Functions

### With Duration-Based Transitions

```typescript
const led = new Ledding('#container', {
  transitions: {
    ignition: {
      duration: 500,        // 500ms
      easing: 'ease-out-bounce'
    },
    extinction: {
      duration: 300,
      easing: 'ease-in-quad'
    },
    morph: {
      duration: 800,
      easing: 'ease-in-out-cubic'
    }
  }
});
```

### With Pattern Transitions

```typescript
led.setPattern(newPattern, {
  strategy: 'morph',
  duration: 1000,
  easing: 'ease-out-elastic'
});
```

### Accessing Easing Functions Directly

```typescript
import { getEasingFunction, easingFunctions } from 'ledding';

// Get a specific function
const easeOutCubic = getEasingFunction('ease-out-cubic');
const value = easeOutCubic(0.5); // Returns eased value

// Access all functions
console.log(Object.keys(easingFunctions));
// ['linear', 'ease-in-quad', 'ease-out-quad', ...]
```

### Individual Function Imports

For tree-shaking, import specific functions:

```typescript
import {
  linear,
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  easeInCubic,
  easeOutCubic,
  easeInOutCubic,
  easeInQuart,
  easeOutQuart,
  easeInOutQuart,
  easeInQuint,
  easeOutQuint,
  easeInOutQuint,
  easeInExpo,
  easeOutExpo,
  easeInOutExpo,
  easeInCirc,
  easeOutCirc,
  easeInOutCirc,
  easeInBack,
  easeOutBack,
  easeInOutBack,
  easeInElastic,
  easeOutElastic,
  easeInOutElastic,
  easeInBounce,
  easeOutBounce,
  easeInOutBounce
} from 'ledding';

const value = easeOutCubic(0.75);
```

## Transition Modes

Ledding supports two transition modes for backwards compatibility:

### Duration-Based (Modern)

The recommended approach using explicit durations and easing functions:

```typescript
interface TransitionDurationOptions {
  duration: number;     // milliseconds
  easing: EasingName;   // easing function name
  delay?: number;       // optional delay in ms
}

const led = new Ledding('#container', {
  transitions: {
    ignition: {
      duration: 400,
      easing: 'ease-out-cubic'
    }
  }
});
```

**Advantages:**
- Predictable timing
- Smooth easing curves
- Easier to synchronize animations
- Better for choreographed effects

### Lerp-Based (Legacy)

The original approach using linear interpolation speeds:

```typescript
interface TransitionSpeedOptions {
  min: number;          // minimum speed (0-1)
  max: number;          // maximum speed (0-1)
  randomize: boolean;   // randomize per LED
}

const led = new Ledding('#container', {
  transitions: {
    ignition: {
      min: 0.5,
      max: 1.5,
      randomize: true
    }
  }
});
```

**Advantages:**
- Organic, varied transitions
- Each LED can have different speeds
- Legacy project compatibility

### Type Guard

Check which mode is being used:

```typescript
import { isDurationBased } from 'ledding';

const config = led.options.transitions.ignition;

if (isDurationBased(config)) {
  console.log(`Duration: ${config.duration}ms`);
  console.log(`Easing: ${config.easing}`);
} else {
  console.log(`Speed: ${config.min} - ${config.max}`);
  console.log(`Randomized: ${config.randomize}`);
}
```

## LED Transition Types

### Ignition

When an LED changes from inactive (0) to active (1, 2, 3, etc.):

```typescript
transitions: {
  ignition: {
    duration: 500,
    easing: 'ease-out-bounce'
  }
}
```

The LED will:
- Increase in size from minimum to target
- Increase in opacity from base to active
- Transition color from base to state color

### Extinction

When an LED changes from active to inactive:

```typescript
transitions: {
  extinction: {
    duration: 300,
    easing: 'ease-in-quad'
  }
}
```

The LED will:
- Decrease in size from current to minimum
- Decrease in opacity from active to base
- Transition color from state to base color

### Morph

When an LED changes from one active state to another:

```typescript
transitions: {
  morph: {
    duration: 600,
    easing: 'ease-in-out-cubic'
  }
}
```

The LED will:
- Smoothly change size between states
- Smoothly transition colors between states
- Maintain active opacity

## Pattern Transition Strategies

When using `setPattern()`, you can specify how patterns transition:

### Instant

Default behavior - immediate pattern change:

```typescript
led.setPattern(newPattern);
// or
led.setPattern(newPattern, { strategy: 'instant' });
```

### Morph

Smooth transition where each LED independently transitions to its new state:

```typescript
led.setPattern(newPattern, {
  strategy: 'morph',
  duration: 1000,
  easing: 'ease-in-out-cubic'
});
```

**Use case:** Patterns of similar size, smooth shape evolution

### Fade

Two-phase transition: fade out old pattern, then fade in new pattern:

```typescript
led.setPattern(newPattern, {
  strategy: 'fade',
  duration: 1500,
  easing: 'ease-out-quad'
});
```

**Use case:** Complete scene changes, dramatic transitions

### Crossfade

Similar to morph but optimized for overlapping patterns:

```typescript
led.setPattern(newPattern, {
  strategy: 'crossfade',
  duration: 800,
  easing: 'ease-in-out-quad'
});
```

**Use case:** Patterns that partially overlap

## Animation Patterns

Configure how LEDs are selected for transition:

```typescript
import { Pattern, Directions } from 'ledding';

const led = new Ledding('#container', {
  animation: {
    ignition: {
      pattern: Pattern.CASCADE,
      direction: Directions.TO_BOTTOM,
      delay: 0,
      step: 4
    }
  }
});
```

### CASCADE

LEDs transition in sequence based on direction:

```typescript
animation: {
  ignition: {
    pattern: Pattern.CASCADE,
    direction: Directions.TO_BOTTOM,
    delay: 10,  // 10ms between each step
    step: 2     // 2 LEDs per step
  }
}
```

### INTERLACED

Alternating LEDs transition:

```typescript
animation: {
  ignition: {
    pattern: Pattern.INTERLACED,
    direction: Directions.TO_RIGHT,
    delay: 5,
    step: 3
  }
}
```

### WAVE

LEDs transition in a wave pattern:

```typescript
animation: {
  ignition: {
    pattern: Pattern.WAVE,
    direction: Directions.TO_BOTTOM_RIGHT,
    delay: 15,
    step: 1
  }
}
```

### RANDOM

LEDs transition in random order:

```typescript
animation: {
  ignition: {
    pattern: Pattern.RANDOM,
    direction: Directions.TO_LEFT, // ignored for random
    delay: 0,
    step: 5
  }
}
```

## Transition Directions

All available directions:

```typescript
import { Directions } from 'ledding';

// Cardinal directions
Directions.TO_LEFT
Directions.TO_RIGHT
Directions.TO_TOP
Directions.TO_BOTTOM

// Diagonal directions
Directions.TO_TOP_LEFT
Directions.TO_TOP_RIGHT
Directions.TO_BOTTOM_LEFT
Directions.TO_BOTTOM_RIGHT
```

## Combining Transitions

Create complex effects by combining configurations:

```typescript
const led = new Ledding('#container', {
  animation: {
    scroll: {
      direction: Directions.TO_LEFT,
      speed: 60
    },
    ignition: {
      pattern: Pattern.WAVE,
      direction: Directions.TO_BOTTOM,
      delay: 20,
      step: 1
    },
    extinction: {
      pattern: Pattern.CASCADE,
      direction: Directions.TO_TOP,
      delay: 10,
      step: 2
    }
  },
  transitions: {
    ignition: {
      duration: 600,
      easing: 'ease-out-elastic'
    },
    extinction: {
      duration: 400,
      easing: 'ease-in-back'
    },
    morph: {
      duration: 800,
      easing: 'ease-in-out-cubic'
    }
  }
});
```

## Advanced Examples

### Staggered Reveal

```typescript
function staggeredReveal(led, pattern, staggerDelay = 50) {
  const rows = pattern.length;
  const cols = pattern[0].length;

  // Start with empty pattern
  const currentPattern = Array(rows).fill(null).map(() =>
    Array(cols).fill(0)
  );

  led.setPattern(currentPattern);

  // Reveal row by row
  for (let y = 0; y < rows; y++) {
    setTimeout(() => {
      for (let x = 0; x < cols; x++) {
        currentPattern[y][x] = pattern[y][x];
      }
      led.setPattern([...currentPattern.map(row => [...row])], {
        strategy: 'morph',
        duration: 200,
        easing: 'ease-out-quad'
      });
    }, y * staggerDelay);
  }
}
```

### Breathing Effect

```typescript
import { easeInOutSine } from 'ledding';

function breathingEffect(led) {
  let time = 0;

  function update() {
    const scale = easeInOutSine(Math.sin(time) * 0.5 + 0.5);
    const opacity = 0.5 + scale * 0.5;

    led.options.opacities.active = opacity;

    time += 0.02;
    requestAnimationFrame(update);
  }

  update();
}
```

### Chain Reaction

```typescript
async function chainReaction(led, patterns) {
  for (let i = 0; i < patterns.length; i++) {
    led.setPattern(patterns[i], {
      strategy: 'morph',
      duration: 500,
      easing: 'ease-out-bounce'
    });

    // Wait for transition to complete
    await new Promise(resolve => setTimeout(resolve, 600));
  }
}
```

## Performance Tips

1. **Use appropriate durations** - Too short may look jerky, too long may feel sluggish
2. **Match easing to effect** - Bounce for playful, cubic for professional
3. **Limit simultaneous transitions** - Too many can impact performance
4. **Use instant for rapid changes** - When smoothness isn't needed
5. **Consider mobile devices** - Use shorter durations on slower devices

## Next Steps

- [Playlist](/docs/playlist) - Chain transitions with the playlist system
- [Performance](/docs/performance) - Optimize transition performance
- [Events](/docs/events) - Hook into transition lifecycle
