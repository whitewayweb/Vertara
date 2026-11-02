import { describe, expect, it } from "vitest";

import { createSavedTextStyle, defaultBrandKit, getLogoBox, parseBrandKit } from "./brand-kit";
import { createTextOverlay } from "@/features/project/text-overlays";

describe("brand kit", () => {
  it("falls back to defaults for missing or malformed storage", () => {
    expect(parseBrandKit(null)).toEqual(defaultBrandKit);
    expect(parseBrandKit("{not json")).toEqual(defaultBrandKit);
    expect(parseBrandKit(JSON.stringify({ logoSizePercent: 500, savedStyles: "nope" }))).toMatchObject({ logoSizePercent: 30, savedStyles: [] });
  });

  it("saves a look without the words or timing", () => {
    const style = createSavedTextStyle("a", "Look 1", createTextOverlay("t", { color: "#ff0000", startSeconds: 4, text: "Hello" }));
    expect(style.change.color).toBe("#ff0000");
    expect(style.change).not.toHaveProperty("text");
    expect(style.change).not.toHaveProperty("startSeconds");
  });

  it("places the logo inside the chosen corner", () => {
    const box = getLogoBox("bottom-right", 10, 1000, 2000, 200, 100);
    expect(box.width).toBe(100);
    expect(box.height).toBe(50);
    expect(box.x + box.width).toBe(960);
    expect(box.y + box.height).toBe(1960);
  });
});
