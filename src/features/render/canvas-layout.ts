export interface CanvasLayout {
  backdropBlurPixels: number;
  backdropOpacity: number;
  dimOpacity: number;
}

export const defaultCanvasLayout: CanvasLayout = {
  backdropBlurPixels: 25,
  backdropOpacity: 1,
  dimOpacity: 0.8,
};

export function createCanvasLayout(
  backdropBlurPixels: number,
  backdropOpacity: number,
  dimOpacity: number,
): CanvasLayout {
  return {
    backdropBlurPixels: clamp(backdropBlurPixels, 0, 48),
    backdropOpacity: clamp(backdropOpacity, 0, 1),
    dimOpacity: clamp(dimOpacity, 0, 0.8),
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
