import { describe, expect, it } from "vitest";

import { createTextOverlay, getTextOverlayFontStack, isTextOverlayVisible } from "./text-overlays";

describe("text overlays", () => {
  it("creates independently identified, safe text layers", () => {
    expect(createTextOverlay("first", { color: "invalid", fontFamily: "headline", fontSizePercent: 99, widthPercent: 1 })).toMatchObject({ color: "#ffffff", fontSizePercent: 12, id: "first", widthPercent: 20 });
    expect(createTextOverlay("second").id).toBe("second");
  });

  it("uses social-friendly font stacks for preview and export", () => {
    expect(getTextOverlayFontStack("headline")).toContain("Impact");
    expect(getTextOverlayFontStack("rounded")).toContain("Arial Rounded");
  });

  it("preserves a transparent text background", () => {
    expect(createTextOverlay("no-fill", { backgroundColor: "transparent" }).backgroundColor).toBe("transparent");
  });

  it("preserves valid alpha-enabled hex colours", () => {
    expect(createTextOverlay("alpha", { backgroundColor: "#11223380" }).backgroundColor).toBe("#11223380");
  });

  it("shows a non-blank layer only inside its configured output time", () => {
    const overlay = createTextOverlay("intro", { durationSeconds: 2, startSeconds: 1, text: "Hello" });
    expect(isTextOverlayVisible(overlay, 0.5)).toBe(false);
    expect(isTextOverlayVisible(overlay, 1)).toBe(true);
    expect(isTextOverlayVisible(overlay, 3)).toBe(false);
  });
});
