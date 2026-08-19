import { describe, expect, it } from "vitest";

import { createPlaybackSettings, getExportDurationSeconds, getOutputElapsedSeconds } from "./playback-settings";

describe("createPlaybackSettings", () => {
  it("defaults to the full source duration with audio enabled", () => {
    expect(createPlaybackSettings(12)).toEqual({ muted: false, speed: 1, trimEndSeconds: 12, trimStartSeconds: 0 });
  });

  it("keeps the trim inside the source bounds", () => {
    expect(createPlaybackSettings(12, { trimStartSeconds: 11.95, trimEndSeconds: 2 })).toEqual({
      muted: false,
      speed: 1,
      trimEndSeconds: 12,
      trimStartSeconds: 11.95,
    });
  });

  it("accepts the supported faster speeds and calculates the shortened output duration", () => {
    const playback = createPlaybackSettings(12, { speed: 3, trimStartSeconds: 1, trimEndSeconds: 10 });

    expect(playback.speed).toBe(3);
    expect(getExportDurationSeconds(playback)).toBe(3);
    expect(getOutputElapsedSeconds(6, playback)).toBe(2);
  });

  it("falls back to normal speed for unsupported speed values", () => {
    expect(createPlaybackSettings(12, { speed: 1.25 as 1 }).speed).toBe(1);
  });
});
