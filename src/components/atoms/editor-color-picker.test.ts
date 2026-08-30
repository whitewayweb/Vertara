import { describe, expect, it } from "vitest";

import { toStoredColorValue } from "./editor-color-picker";

describe("toStoredColorValue", () => {
  it("keeps opaque black as a fill colour", () => {
    expect(toStoredColorValue("#000000")).toBe("#000000");
  });

  it("uses transparent only for a fully transparent alpha colour", () => {
    expect(toStoredColorValue("#00000000")).toBe("transparent");
    expect(toStoredColorValue("#11223380")).toBe("#11223380");
  });
});
