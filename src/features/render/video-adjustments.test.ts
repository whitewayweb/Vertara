import { describe, expect, it } from "vitest";

import { createVideoAdjustments, getVideoAdjustmentsFilter } from "./video-adjustments";

describe("video adjustments", () => {
  it("uses neutral defaults and bounds every adjustment", () => {
    expect(createVideoAdjustments()).toEqual({ brightness: 100, contrast: 100, saturate: 100, warmth: 0 });
    expect(createVideoAdjustments({ brightness: 999, contrast: 1, saturate: 999, warmth: -99 })).toEqual({ brightness: 150, contrast: 50, saturate: 200, warmth: -40 });
  });

  it("creates a browser and canvas-compatible filter string", () => {
    expect(getVideoAdjustmentsFilter(createVideoAdjustments({ brightness: 110, contrast: 90, saturate: 120, warmth: 12 }))).toBe("brightness(110%) contrast(90%) saturate(120%) sepia(12%) hue-rotate(12deg)");
  });
});
