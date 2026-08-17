import { describe, expect, it } from "vitest";

import { createPlaybackSettings } from "./playback-settings";

describe("createPlaybackSettings", () => {
  it("defaults to the full source duration with audio enabled", () => {
    expect(createPlaybackSettings(12)).toEqual({ muted: false, trimEndSeconds: 12, trimStartSeconds: 0 });
  });

  it("keeps the trim inside the source bounds", () => {
    expect(createPlaybackSettings(12, { trimStartSeconds: 11.95, trimEndSeconds: 2 })).toEqual({
      muted: false,
      trimEndSeconds: 12,
      trimStartSeconds: 11.95,
    });
  });
});
