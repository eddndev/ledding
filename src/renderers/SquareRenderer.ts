import type { Renderer, LedState, LeddingInstance } from '../types';

export const SquareRenderer: Renderer = {
  setup(_instance: LeddingInstance): void {
    // No setup needed for square renderer
  },

  draw(
    ctx: CanvasRenderingContext2D,
    led: LedState,
    x: number,
    y: number,
    color: string,
    _instance: LeddingInstance
  ): void {
    const size = led.currentSize;
    if (size < 0.1) return;

    ctx.fillStyle = color;
    const cornerX = x - size / 2;
    const cornerY = y - size / 2;
    ctx.fillRect(cornerX, cornerY, size, size);
  },
};
