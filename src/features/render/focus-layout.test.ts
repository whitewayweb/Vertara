import { describe, expect, it } from "vitest";

import { createFocusLayout, getFocusObjectPosition } from "./focus-layout";

describe("Focus layout", () => {
  it("keeps pan and zoom within export-safe limits", () => {
    expect(createFocusLayout(-10, 4)).toEqual({ panX: 0, zoom: 2 });
    expect(createFocusLayout(120, 0.5)).toEqual({ panX: 100, zoom: 1 });
  });

  it("maps the horizontal pan to CSS object positioning", () => {
    expect(getFocusObjectPosition({ panX: 25, zoom: 1.2 })).toBe("25% center");
  });
});
