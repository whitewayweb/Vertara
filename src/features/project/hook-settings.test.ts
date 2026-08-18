import { describe, expect, it } from "vitest";

import { createHookSettings } from "./hook-settings";

describe("createHookSettings", () => {
  it("creates a disabled two-second hook by default", () => {
    expect(createHookSettings()).toEqual({ backgroundColor: "#000000", durationSeconds: 2, enabled: false, fontSizePercent: 7, position: "top", text: "" });
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
});
