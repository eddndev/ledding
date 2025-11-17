import type { Renderer, LedState, LeddingInstance } from '../types';

export const CircleRenderer: Renderer = {
  setup(instance: LeddingInstance): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inst = instance as any;
    if (!inst.unitCirclePath) {
      const path = new Path2D();
      path.arc(0, 0, 1, 0, Math.PI * 2);
      inst.unitCirclePath = path;
    }
  },

  draw(
    ctx: CanvasRenderingContext2D,
    led: LedState,
    x: number,
    y: number,
    color: string,
    instance: LeddingInstance
  ): void {
    const radius = led.currentSize / 2;
    if (radius < 0.1) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inst = instance as any;
    if (!inst.unitCirclePath) return;

    ctx.fillStyle = color;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(radius, radius);
    ctx.fill(inst.unitCirclePath);
    ctx.restore();
  },
};
