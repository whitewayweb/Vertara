import { describe, expect, it } from "vitest";

import { validateVideoFile } from "./inspect-media";

describe("validateVideoFile", () => {
  it("accepts MP4 files", () => {
    expect(validateVideoFile({ name: "clip.mp4", type: "video/mp4" })).toBeUndefined();
  });

  it("accepts a supported extension when the browser does not provide a MIME type", () => {
    expect(validateVideoFile({ name: "clip.webm", type: "" })).toBeUndefined();
  });

  it("rejects unsupported file types", () => {
    expect(validateVideoFile({ name: "notes.pdf", type: "application/pdf" })).toMatchObject({
      ok: false,
      error: { code: "unsupported-file" },
    });
  });

  it("rejects a mismatched MIME type", () => {
    expect(validateVideoFile({ name: "clip.mp4", type: "video/webm" })).toMatchObject({
      ok: false,
      error: { code: "unsupported-file" },
    });
  });
});
