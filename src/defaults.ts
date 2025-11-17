import type { LeddingOptions } from './types';
import { CircleRenderer } from './renderers/CircleRenderer';
import { CenterAligner } from './aligners';
import { Directions, Pattern } from './constants';

/**
 * Default art pattern - simple square
 */
export const defaultArtPattern: number[][] = [
  [1, 1, 1],
  [1, 0, 1],
  [1, 1, 1],
];

/**
 * Default configuration for Ledding instances
 */
export const defaultOptions: LeddingOptions = {
  ledSize: 20,
  ledGap: 4,
  scaleToFit: true,
  artPattern: defaultArtPattern,
  aligner: CenterAligner,
  renderer: CircleRenderer,

  colors: {
    background: null,
    base: 'rgb(45, 55, 72)',
    states: {
      1: 'rgb(209, 162, 255)', // BRIGHT
      2: 'rgb(167, 86, 255)', // MEDIUM
      3: 'rgb(113, 63, 222)', // DIM
    },
  },

  opacities: {
    base: { min: 0.5, max: 0.75 },
    active: 1,
  },

  fps: 20,

  animation: {
    scroll: {
      direction: Directions.TO_LEFT,
      speed: 80,
    },
    ignition: {
      pattern: Pattern.CASCADE,
      direction: Directions.TO_BOTTOM,
      delay: 0,
      step: 4,
    },
    extinction: {
      pattern: Pattern.CASCADE,
      direction: Directions.TO_TOP,
      delay: 0,
      step: 4,
    },
  },

  transitions: {
    ignition: {
      min: 1,
      max: 1,
      randomize: false,
    },
    extinction: {
      min: 1,
      max: 1,
      randomize: false,
    },
    morph: {
      min: 1,
      max: 1,
      randomize: false,
    },
  },

  grid: {
    fill: false,
    lifespan: 60,
  },
};
