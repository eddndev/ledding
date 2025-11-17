import type { Aligner, LeddingInstance } from '../types';

interface AlignmentContext {
  artWidthPx: number;
  artHeightPx: number;
  canvasWidth: number;
  canvasHeight: number;
}

const getAlignmentContext = (instance: LeddingInstance): AlignmentContext | null => {
  const artCols = instance.options.artPattern[0]?.length || 0;
  const artRows = instance.options.artPattern.length;
  const ledFullSize = instance.dimensions.ledFullSize;

  if (!ledFullSize || !instance.canvas) {
    return null;
  }

  const artWidthPx = artCols * ledFullSize;
  const artHeightPx = artRows * ledFullSize;
  const canvasWidth = instance.canvas.width;
  const canvasHeight = instance.canvas.height;

  return { artWidthPx, artHeightPx, canvasWidth, canvasHeight };
};

const defaultPosition = { artStartPx: 0, artStartPxY: 0 };

export const TopLeftAligner: Aligner = {
  getCoordinates(instance: LeddingInstance) {
    if (!instance.canvas) return defaultPosition;
    return defaultPosition;
  },
};

export const TopAligner: Aligner = {
  getCoordinates(instance: LeddingInstance) {
    const ctx = getAlignmentContext(instance);
    if (!ctx) return defaultPosition;
    const artStartPx = (ctx.canvasWidth - ctx.artWidthPx) / 2;
    return { artStartPx, artStartPxY: 0 };
  },
};

export const TopRightAligner: Aligner = {
  getCoordinates(instance: LeddingInstance) {
    const ctx = getAlignmentContext(instance);
    if (!ctx) return defaultPosition;
    const artStartPx = ctx.canvasWidth - ctx.artWidthPx;
    return { artStartPx, artStartPxY: 0 };
  },
};

export const LeftAligner: Aligner = {
  getCoordinates(instance: LeddingInstance) {
    const ctx = getAlignmentContext(instance);
    if (!ctx) return defaultPosition;
    const artStartPxY = (ctx.canvasHeight - ctx.artHeightPx) / 2;
    return { artStartPx: 0, artStartPxY };
  },
};

export const CenterAligner: Aligner = {
  getCoordinates(instance: LeddingInstance) {
    const ctx = getAlignmentContext(instance);
    if (!ctx) return defaultPosition;
    const artStartPx = (ctx.canvasWidth - ctx.artWidthPx) / 2;
    const artStartPxY = (ctx.canvasHeight - ctx.artHeightPx) / 2;
    return { artStartPx, artStartPxY };
  },
};

export const RightAligner: Aligner = {
  getCoordinates(instance: LeddingInstance) {
    const ctx = getAlignmentContext(instance);
    if (!ctx) return defaultPosition;
    const artStartPx = ctx.canvasWidth - ctx.artWidthPx;
    const artStartPxY = (ctx.canvasHeight - ctx.artHeightPx) / 2;
    return { artStartPx, artStartPxY };
  },
};

export const BottomLeftAligner: Aligner = {
  getCoordinates(instance: LeddingInstance) {
    const ctx = getAlignmentContext(instance);
    if (!ctx) return defaultPosition;
    const artStartPxY = ctx.canvasHeight - ctx.artHeightPx;
    return { artStartPx: 0, artStartPxY };
  },
};

export const BottomAligner: Aligner = {
  getCoordinates(instance: LeddingInstance) {
    const ctx = getAlignmentContext(instance);
    if (!ctx) return defaultPosition;
    const artStartPx = (ctx.canvasWidth - ctx.artWidthPx) / 2;
    const artStartPxY = ctx.canvasHeight - ctx.artHeightPx;
    return { artStartPx, artStartPxY };
  },
};

export const BottomRightAligner: Aligner = {
  getCoordinates(instance: LeddingInstance) {
    const ctx = getAlignmentContext(instance);
    if (!ctx) return defaultPosition;
    const artStartPx = ctx.canvasWidth - ctx.artWidthPx;
    const artStartPxY = ctx.canvasHeight - ctx.artHeightPx;
    return { artStartPx, artStartPxY };
  },
};
