import { describe, expect, it } from "vitest";

import { chunksToWords } from "./transcribe";

describe("chunksToWords", () => {
  it("trims words, fills open-ended timestamps, and drops empty chunks", () => {
    const words = chunksToWords([{ text: " Hello", timestamp: [0, 0.5] }, { text: "  ", timestamp: [0.5, 0.6] }, { text: " there", timestamp: [1, null] }]);
    expect(words.map((word) => word.text)).toEqual(["Hello", "there"]);
    expect(words[1].endSeconds).toBe(1.3);
  });

  it("stops a word from claiming the long pause after it", () => {
    expect(chunksToWords([{ text: "channel.", timestamp: [2, 6] }])[0].endSeconds).toBe(3.5);
  });
});
