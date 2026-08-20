import { describe, expect, it } from "vitest";

import { createTextOverlay, duplicateTextOverlay, getTextOverlayEntranceAnimation, getTextOverlayEntranceProgress, getTextOverlayFontStack, isTextOverlayVisible, textOverlayTemplates } from "./text-overlays";

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

  it("accepts local emoji sticker text without a separate overlay type", () => {
    expect(createTextOverlay("sticker", { backgroundColor: "transparent", text: "✨" })).toMatchObject({ backgroundColor: "transparent", text: "✨" });
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

  it("uses bounded entrance timing shared by preview and export", () => {
    const overlay = createTextOverlay("intro", { entranceAnimation: "slide-up", startSeconds: 3 });
    expect(getTextOverlayEntranceAnimation(overlay.entranceAnimation)).toContain("vertara-text-slide-up");
    expect(getTextOverlayEntranceProgress(overlay, 3.13)).toBeCloseTo(0.5);
    expect(getTextOverlayEntranceProgress(overlay, 4)).toBe(1);
  });

  it("provides reusable social templates and duplicates a layer with an offset", () => {
    expect(textOverlayTemplates.map((template) => template.label)).toEqual(["Hook", "Quote", "CTA"]);
    expect(duplicateTextOverlay(createTextOverlay("first", { horizontalPositionPercent: 50, verticalPositionPercent: 50 }), "copy")).toMatchObject({ horizontalPositionPercent: 54, id: "copy", verticalPositionPercent: 54 });
  });

  it("uses only supported text alignments", () => {
    expect(createTextOverlay("left", { textAlign: "left" }).textAlign).toBe("left");
    expect(createTextOverlay("invalid", { textAlign: "justify" as never }).textAlign).toBe("center");
  });
});
