import { describe, expect, it } from "vitest";

import { supportsMultiThreadedWasm } from "./transcode-mov";

describe("supportsMultiThreadedWasm", () => {
  it("requires cross-origin isolation", () => {
    expect(supportsMultiThreadedWasm()).toBe(false);
  });
});
