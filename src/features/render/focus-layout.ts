import type { FocusKeyframe } from "@/features/render/focus-track";
import { clamp } from "@/lib/clamp";

export interface FocusLayout {
  panX: number;
  /** When present, the crop follows the detected face instead of holding `panX`. */
  track?: FocusKeyframe[];
  zoom: number;
}

export const defaultFocusLayout: FocusLayout = {
  panX: 50,
  zoom: 1,
};

export function createFocusLayout(panX: number, zoom: number): FocusLayout {
  return {
    panX: clamp(panX, 0, 100),
    zoom: clamp(zoom, 1, 2),
  };
}

export function getFocusObjectPosition({ panX }: FocusLayout): string {
  return `${panX}% center`;
}
