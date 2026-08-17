import { describe, expect, it } from "vitest";

import { createCanvasLayout, defaultCanvasLayout } from "./canvas-layout";

describe("canvas layout", () => {
  it("provides balanced full-frame defaults", () => {
    expect(defaultCanvasLayout).toEqual({ backdropBlurPixels: 25, backdropOpacity: 1, dimOpacity: 0.8 });
  });

  it("keeps backdrop settings within safe preview bounds", () => {
    expect(createCanvasLayout(80, -1, 1)).toEqual({ backdropBlurPixels: 48, backdropOpacity: 0, dimOpacity: 0.8 });
  });
});
