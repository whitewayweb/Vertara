import { describe, expect, it } from "vitest";

import { assessExportCapability } from "./export-capabilities";

describe("assessExportCapability", () => {
  it("rejects browsers without the export APIs", () => {
    expect(
      assessExportCapability({
        supportsVideoEncoder: false,
        supportsVideoFrame: true,
      }),
    ).toMatchObject({ level: "unsupported" });
  });

  it("warns about lower-powered devices", () => {
    expect(
      assessExportCapability({
        hardwareConcurrency: 4,
        supportsVideoEncoder: true,
        supportsVideoFrame: true,
      }),
    ).toMatchObject({ level: "limited" });
  });

  it("accepts browsers with export support and normal device capacity", () => {
    expect(
      assessExportCapability({
        hardwareConcurrency: 8,
        supportsVideoEncoder: true,
        supportsVideoFrame: true,
      }),
    ).toMatchObject({ level: "ready" });
  });
});
