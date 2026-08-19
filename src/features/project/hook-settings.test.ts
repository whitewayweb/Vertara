import { describe, expect, it } from "vitest";

import { createHookSettings } from "./hook-settings";

describe("createHookSettings", () => {
  it("creates a disabled two-second hook by default", () => {
    expect(createHookSettings()).toEqual({ backgroundColor: "#000000", durationSeconds: 2, enabled: false, fontSizePercent: 7, horizontalPositionPercent: 50, text: "", verticalPositionPercent: 9, widthPercent: 60 });
  });

  it("keeps the hook duration within the supported range", () => {
    expect(createHookSettings({ durationSeconds: 10 })).toMatchObject({ durationSeconds: 5 });
    expect(createHookSettings({ durationSeconds: 0.1 })).toMatchObject({ durationSeconds: 0.5 });
  });

  it("keeps custom text styling within safe values", () => {
    expect(createHookSettings({ backgroundColor: "invalid", fontSizePercent: 20 })).toMatchObject({
      backgroundColor: "#000000",
      fontSizePercent: 12,
    });
  });

  it("keeps direct-manipulation positions inside the video frame", () => {
    expect(createHookSettings({ horizontalPositionPercent: 1, verticalPositionPercent: 110 })).toMatchObject({
      horizontalPositionPercent: 7,
      verticalPositionPercent: 95,
    });
  });

  it("keeps the resizable text block within its supported width", () => {
    expect(createHookSettings({ widthPercent: 1 })).toMatchObject({ widthPercent: 20 });
    expect(createHookSettings({ widthPercent: 100 })).toMatchObject({ widthPercent: 86 });
  });
});
