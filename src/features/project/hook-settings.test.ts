import { describe, expect, it } from "vitest";

import { createHookSettings } from "./hook-settings";

describe("createHookSettings", () => {
  it("creates a disabled two-second hook by default", () => {
    expect(createHookSettings()).toEqual({ durationSeconds: 2, enabled: false, position: "top", text: "" });
  });

  it("keeps the hook duration within the supported range", () => {
    expect(createHookSettings({ durationSeconds: 10 })).toMatchObject({ durationSeconds: 5 });
    expect(createHookSettings({ durationSeconds: 0.1 })).toMatchObject({ durationSeconds: 0.5 });
  });
});
