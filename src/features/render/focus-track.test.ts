import { describe, expect, it } from "vitest";

import { createFocusTrack, getFocusPanAt, getPanForCenter } from "./focus-track";

describe("focus track", () => {
  it("pans a landscape source to keep a point centred in a vertical crop", () => {
    expect(getPanForCenter(0.5, 1920, 1080, 1080, 1920, 1)).toBeCloseTo(50);
    expect(getPanForCenter(0.1, 1920, 1080, 1080, 1920, 1)).toBe(0);
    expect(getPanForCenter(0.9, 1920, 1080, 1080, 1920, 1)).toBe(100);
  });

  it("holds the last position through detection gaps", () => {
    const track = createFocusTrack([{ centerX: 0.5, timeSeconds: 0 }, { centerX: undefined, timeSeconds: 1 }], (center) => center * 100);
    expect(track.map((keyframe) => keyframe.panX)).toEqual([50, 50]);
  });

  it("returns no track when no face is ever found", () => {
    expect(createFocusTrack([{ centerX: undefined, timeSeconds: 0 }], () => 0)).toEqual([]);
  });

  it("interpolates between keyframes", () => {
    const track = [{ panX: 0, timeSeconds: 0 }, { panX: 100, timeSeconds: 2 }];
    expect(getFocusPanAt(track, 1, 50)).toBe(50);
    expect(getFocusPanAt([], 1, 42)).toBe(42);
  });
});
