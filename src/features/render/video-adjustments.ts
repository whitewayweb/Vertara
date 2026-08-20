export interface VideoAdjustments {
  brightness: number;
  contrast: number;
  saturate: number;
  warmth: number;
}

export const defaultVideoAdjustments: VideoAdjustments = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  warmth: 0,
};

export function createVideoAdjustments(partial: Partial<VideoAdjustments> = {}): VideoAdjustments {
  return {
    brightness: clamp(partial.brightness ?? defaultVideoAdjustments.brightness, 50, 150),
    contrast: clamp(partial.contrast ?? defaultVideoAdjustments.contrast, 50, 150),
    saturate: clamp(partial.saturate ?? defaultVideoAdjustments.saturate, 0, 200),
    warmth: clamp(partial.warmth ?? defaultVideoAdjustments.warmth, -40, 40),
  };
}

export function getVideoAdjustmentsFilter(adjustments: VideoAdjustments): string {
  return `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturate}%) sepia(${Math.abs(adjustments.warmth)}%) hue-rotate(${adjustments.warmth}deg)`;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
