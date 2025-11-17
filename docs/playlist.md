---
title: "Playlist"
description: "Automate pattern sequences with the timeline/playlist system - looping, shuffling, callbacks, and playback control"
sidebar:
  order: 6
---

# Playlist System

The playlist system allows you to create automated sequences of patterns with precise timing, transitions, and playback control. Perfect for creating presentations, loading animations, or complex visual sequences.

## Basic Usage

### Creating a Playlist

```typescript
import { Ledding } from 'ledding';

const led = new Ledding('#container');

led.setPlaylist([
  {
    pattern: [[1, 1], [1, 1]],
    hold: 2000  // Display for 2 seconds
  },
  {
    pattern: [[0, 1], [1, 0]],
    hold: 3000  // Display for 3 seconds
  },
  {
    pattern: [[1, 0], [0, 1]],
    hold: 2500  // Display for 2.5 seconds
  }
]);
```

The playlist will automatically start (by default) and cycle through patterns.

## Playlist Items

Each item in the playlist is a `PlaylistItem`:

```typescript
interface PlaylistItem {
  pattern: number[][];                       // The pattern to display
  hold: number;                              // Duration in milliseconds
  transition?: PatternTransitionOptions;     // How to transition TO this pattern
  onEnter?: () => void;                      // Called when pattern becomes active
  onExit?: () => void;                       // Called when leaving this pattern
}
```

### Pattern Transitions

Define how each pattern enters:

```typescript
led.setPlaylist([
  {
    pattern: [[1, 1], [1, 1]],
    hold: 3000,
    transition: {
      strategy: 'morph',
      duration: 800,
      easing: 'ease-out-cubic'
    }
  },
  {
    pattern: [[0, 1], [1, 0]],
    hold: 2000,
    transition: {
      strategy: 'fade',
      duration: 1200,
      easing: 'ease-in-out-quad'
    }
  }
]);
```

**Note:** The first pattern's transition is ignored on initial load (uses instant).

### Lifecycle Callbacks

Execute code when patterns change:

```typescript
led.setPlaylist([
  {
    pattern: heartPattern,
    hold: 4000,
    onEnter: () => {
      console.log('Heart pattern now active');
      document.body.classList.add('heart-theme');
    },
    onExit: () => {
      console.log('Leaving heart pattern');
      document.body.classList.remove('heart-theme');
    }
  },
  {
    pattern: starPattern,
    hold: 3000,
    onEnter: () => {
      console.log('Star pattern now active');
      playSound('twinkle.mp3');
    },
    onExit: () => {
      console.log('Leaving star pattern');
    }
  }
]);
```

## Playlist Options

Configure playlist behavior with `PlaylistOptions`:

```typescript
interface PlaylistOptions {
  loop?: boolean | number;       // Looping behavior
  autoStart?: boolean;           // Start automatically (default: true)
  shuffle?: boolean;             // Randomize order
  reverse?: boolean;             // Reverse order
  speed?: number;                // Playback speed multiplier
  startIndex?: number;           // Starting pattern index
  onComplete?: () => void;       // Called when playlist finishes
  onPatternChange?: (index: number, pattern: number[][]) => void;
}
```

### Looping

```typescript
// No looping (play once)
led.setPlaylist(items, { loop: false });

// Infinite looping
led.setPlaylist(items, { loop: true });

// Loop 3 times
led.setPlaylist(items, { loop: 3 });
```

### Auto Start

```typescript
// Manual start (don't auto-play)
led.setPlaylist(items, { autoStart: false });

// Later...
led.playPlaylist();
```

### Shuffle

```typescript
// Randomize pattern order
led.setPlaylist(items, {
  shuffle: true,
  loop: true  // Re-shuffles on each loop
});
```

### Reverse

```typescript
// Play patterns in reverse order
led.setPlaylist(items, { reverse: true });
```

### Playback Speed

```typescript
// 2x speed (half hold times)
led.setPlaylist(items, { speed: 2 });

// 0.5x speed (double hold times)
led.setPlaylist(items, { speed: 0.5 });
```

### Start Index

```typescript
// Start from the third pattern
led.setPlaylist(items, { startIndex: 2 });
```

### Global Callbacks

```typescript
led.setPlaylist(items, {
  loop: 2,
  onComplete: () => {
    console.log('Playlist finished!');
    showEndScreen();
  },
  onPatternChange: (index, pattern) => {
    console.log(`Now showing pattern ${index + 1} of ${items.length}`);
    updateProgressBar(index / items.length);
  }
});
```

## Playback Control

### Play / Pause / Stop

```typescript
// Start or resume playback
led.playPlaylist();

// Pause (maintains position)
led.pausePlaylist();

// Stop and reset to beginning
led.stopPlaylist();
```

### Navigation

```typescript
// Go to next pattern
led.nextPattern();

// Go to previous pattern
led.prevPattern();

// Jump to specific pattern (zero-based index)
led.goToPattern(2);  // Third pattern
```

### Querying State

```typescript
const state = led.getPlaylistState();

if (state) {
  console.log(`Playing: ${state.isPlaying}`);
  console.log(`Paused: ${state.isPaused}`);
  console.log(`Current: ${state.currentIndex + 1} of ${state.totalPatterns}`);
  console.log(`Time remaining: ${state.timeRemaining}ms`);
  console.log(`Loops: ${state.loopsCompleted}/${state.loopsTotal}`);
}
```

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

### Clearing the Playlist

```typescript
led.clearPlaylist();
```

## Complete Example

### Slideshow with Controls

```typescript
import { Ledding, Directions, Pattern } from 'ledding';

const patterns = {
  heart: [[0,1,1,0,1,1,0], [1,1,1,1,1,1,1], [1,1,1,1,1,1,1], [0,1,1,1,1,1,0], [0,0,1,1,1,0,0], [0,0,0,1,0,0,0]],
  star: [[0,0,1,0,0], [0,1,1,1,0], [1,1,1,1,1], [0,1,1,1,0], [0,1,0,1,0]],
  diamond: [[0,0,1,0,0], [0,1,1,1,0], [1,1,1,1,1], [0,1,1,1,0], [0,0,1,0,0]],
  square: [[1,1,1,1], [1,1,1,1], [1,1,1,1], [1,1,1,1]]
};

const led = new Ledding('#slideshow', {
  ledSize: 25,
  ledGap: 5,
  colors: {
    background: '#1a1a2e',
    base: 'rgb(40, 50, 60)',
    states: {
      1: 'rgb(255, 150, 200)'
    }
  }
});

// Create playlist
led.setPlaylist([
  {
    pattern: patterns.heart,
    hold: 4000,
    transition: { strategy: 'morph', duration: 600, easing: 'ease-out-bounce' },
    onEnter: () => updateLabel('Heart')
  },
  {
    pattern: patterns.star,
    hold: 3500,
    transition: { strategy: 'fade', duration: 800, easing: 'ease-in-out-quad' },
    onEnter: () => updateLabel('Star')
  },
  {
    pattern: patterns.diamond,
    hold: 3000,
    transition: { strategy: 'crossfade', duration: 700, easing: 'ease-out-cubic' },
    onEnter: () => updateLabel('Diamond')
  },
  {
    pattern: patterns.square,
    hold: 3000,
    transition: { strategy: 'morph', duration: 500, easing: 'ease-in-out-back' },
    onEnter: () => updateLabel('Square')
  }
], {
  loop: true,
  autoStart: false,
  onPatternChange: (index, pattern) => {
    updateProgress(index);
  }
});

// UI Controls
document.getElementById('playBtn').onclick = () => led.playPlaylist();
document.getElementById('pauseBtn').onclick = () => led.pausePlaylist();
document.getElementById('stopBtn').onclick = () => led.stopPlaylist();
document.getElementById('prevBtn').onclick = () => led.prevPattern();
document.getElementById('nextBtn').onclick = () => led.nextPattern();

// Progress display
function updateProgress(index) {
  const state = led.getPlaylistState();
  if (state) {
    document.getElementById('progress').textContent =
      `${index + 1} / ${state.totalPatterns}`;
  }
}

function updateLabel(name) {
  document.getElementById('patternName').textContent = name;
}
```

### Loading Animation

```typescript
const loadingFrames = [
  [[1, 0, 0, 0]],
  [[0, 1, 0, 0]],
  [[0, 0, 1, 0]],
  [[0, 0, 0, 1]],
  [[0, 0, 1, 0]],
  [[0, 1, 0, 0]]
];

const led = new Ledding('#loader', {
  ledSize: 15,
  ledGap: 3
});

led.setPlaylist(
  loadingFrames.map(pattern => ({
    pattern,
    hold: 150,
    transition: { strategy: 'instant' }
  })),
  {
    loop: true,
    speed: 1.5
  }
);

// Stop when loading completes
async function loadData() {
  led.playPlaylist();

  const data = await fetchData();

  led.stopPlaylist();
  led.setPattern([[1, 1, 1, 1]]); // Success pattern

  return data;
}
```

### Interactive Tutorial

```typescript
const tutorialSteps = [
  {
    pattern: step1Pattern,
    hold: 10000,  // Long hold, user advances manually
    onEnter: () => showInstruction('Welcome! Click the highlighted area.')
  },
  {
    pattern: step2Pattern,
    hold: 10000,
    transition: { strategy: 'morph', duration: 500 },
    onEnter: () => showInstruction('Great! Now try the next step.')
  },
  {
    pattern: step3Pattern,
    hold: 10000,
    transition: { strategy: 'fade', duration: 700 },
    onEnter: () => showInstruction('Almost done! One more thing...')
  }
];

led.setPlaylist(tutorialSteps, {
  autoStart: false,
  loop: false,
  onComplete: () => {
    showInstruction('Tutorial complete!');
    celebrationAnimation();
  }
});

// User advances through steps
document.getElementById('nextStep').onclick = () => {
  led.nextPattern();
};

// Start tutorial
led.playPlaylist();
```

### Ambient Background

```typescript
const ambientPatterns = generateAmbientPatterns(10);

led.setPlaylist(
  ambientPatterns.map(pattern => ({
    pattern,
    hold: 8000,
    transition: {
      strategy: 'morph',
      duration: 3000,
      easing: 'ease-in-out-sine'
    }
  })),
  {
    loop: true,
    shuffle: true,
    speed: 0.75  // Slow, relaxing transitions
  }
);

function generateAmbientPatterns(count) {
  const patterns = [];
  for (let i = 0; i < count; i++) {
    patterns.push(generateRandomPattern(10, 10));
  }
  return patterns;
}

function generateRandomPattern(width, height) {
  const pattern = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      row.push(Math.random() > 0.6 ? 1 : 0);
    }
    pattern.push(row);
  }
  return pattern;
}
```

## Best Practices

### 1. Balance Hold Times

```typescript
// Too short - transitions become hectic
{ hold: 100 }  // Avoid

// Too long - feels static
{ hold: 30000 }  // Might be too long

// Good balance
{ hold: 3000 }  // 3 seconds is usually good
```

### 2. Match Transition Duration to Hold Time

```typescript
// Good: Transition is much shorter than hold
{
  pattern: pattern,
  hold: 5000,
  transition: { duration: 800 }  // 16% of hold time
}

// Bad: Transition longer than hold
{
  pattern: pattern,
  hold: 500,
  transition: { duration: 2000 }  // Pattern changes before transition completes
}
```

### 3. Use Callbacks for Synchronization

```typescript
led.setPlaylist(items, {
  onPatternChange: (index, pattern) => {
    // Sync audio
    audioTracks[index].play();

    // Update UI
    updateUI(index);

    // Track analytics
    analytics.track('pattern_view', { index });
  }
});
```

### 4. Handle Edge Cases

```typescript
// Check if playlist exists
const state = led.getPlaylistState();
if (!state) {
  console.log('No playlist set');
  return;
}

// Validate index before jumping
const targetIndex = 5;
if (targetIndex >= 0 && targetIndex < state.totalPatterns) {
  led.goToPattern(targetIndex);
}
```

### 5. Clean Up Resources

```typescript
// When done with playlist
led.clearPlaylist();

// When destroying instance
led.destroy();  // Automatically clears playlist
```

## Performance Considerations

1. **Limit playlist size** - Very large playlists consume memory
2. **Reuse patterns** - Reference the same pattern object when repeated
3. **Optimize transitions** - Complex transitions can be CPU-intensive
4. **Consider mobile** - Use shorter durations on mobile devices
5. **Monitor state changes** - Frequent callbacks can impact performance

```typescript
// Efficient pattern reuse
const basePattern = [[1, 1], [1, 1]];

led.setPlaylist([
  { pattern: basePattern, hold: 2000 },
  { pattern: [[0, 1], [1, 0]], hold: 2000 },
  { pattern: basePattern, hold: 2000 }  // Reuses same reference
]);
```

## Next Steps

- [Transitions](/docs/transitions) - Deep dive into transition effects
- [Events](/docs/events) - Hook into lifecycle events
- [Performance](/docs/performance) - Optimize playlist performance
