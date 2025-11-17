import type { LedState, TransitionAnimationOptions, Direction } from '../types';
import { Directions } from '../constants';

/**
 * Static utility class for animation calculations
 */
export class AnimationEngine {
  /**
   * Calculate delay for a LED based on animation configuration
   */
  static calculateDelay(
    led: LedState,
    gridWidth: number,
    gridHeight: number,
    animConfig: Partial<TransitionAnimationOptions>
  ): number {
    const config = animConfig || {};
    const { pattern = 'cascade', direction = 'to-bottom', delay = 0, step = 1 } = config;

    const safeStep = Math.max(1, Number(step) || 1);
    let cascadeIndex = this._getCascadeIndex(led, gridWidth, gridHeight, direction);
    cascadeIndex = Number(cascadeIndex) || 0;

    let finalIndex = 0;

    switch (pattern) {
      case 'interlaced':
        finalIndex = cascadeIndex % safeStep;
        break;
      case 'wave':
        finalIndex = (cascadeIndex % safeStep) + Math.floor(cascadeIndex / safeStep);
        break;
      case 'random': {
        const maxIndex = (Number(gridWidth) || 0) + (Number(gridHeight) || 0);
        finalIndex = Math.random() * maxIndex;
        break;
      }
      case 'cascade':
      default:
        finalIndex = cascadeIndex;
        break;
    }

    return (Number(finalIndex) || 0) * (Number(delay) || 0);
  }

  /**
   * Get cascade index based on LED position and direction
   */
  private static _getCascadeIndex(
    led: LedState,
    width: number,
    height: number,
    direction: Direction
  ): number {
    const { i, j } = led.gridPosition;

    switch (direction) {
      case Directions.TO_RIGHT:
        return i;
      case Directions.TO_LEFT:
        return width - 1 - i;
      case Directions.TO_BOTTOM:
        return j;
      case Directions.TO_TOP:
        return height - 1 - j;
      case Directions.TO_BOTTOM_RIGHT:
        return i + j;
      case Directions.TO_TOP_LEFT:
        return width - 1 - i + (height - 1 - j);
      case Directions.TO_TOP_RIGHT:
        return i + (height - 1 - j);
      case Directions.TO_BOTTOM_LEFT:
        return width - 1 - i + j;
      default:
        return 0;
    }
  }
}
