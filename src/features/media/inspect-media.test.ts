import { describe, expect, it } from "vitest";

import { inspectMediaFile, validateVideoFile } from "./inspect-media";

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

  it("identifies a browser-unreadable video", async () => {
    let notifyMetadata = () => undefined;
    const video = {
      duration: Number.NaN,
      videoHeight: 0,
      videoWidth: 0,
      muted: false,
      preload: "" as const,
      onerror: null,
      onloadedmetadata: null as (() => unknown) | null,
      removeAttribute: () => undefined,
      load: () => undefined,
      get src() {
        return "";
      },
      set src(_value: string) {
        queueMicrotask(() => notifyMetadata());
      },
    };
    notifyMetadata = () => {
      video.onloadedmetadata?.();
    };

    const result = await inspectMediaFile(
      { name: "clip.mov", type: "video/quicktime" } as File,
      {
        createObjectUrl: () => "blob:clip",
        createVideoElement: () => video as never,
        revokeObjectUrl: () => undefined,
      },
    );

    expect(result).toMatchObject({
      ok: false,
      error: { code: "metadata-load-failed", message: expect.stringContaining("Try Safari") },
    });
  });
});
