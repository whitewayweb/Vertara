import { describe, expect, it } from "vitest";

import { getSocialSafeAreaInsets } from "./social-safe-area-guides";

describe("social safe-area guides", () => {
  it("keeps vertical text close to the boundary while reserving extra bottom space", () => {
    expect(getSocialSafeAreaInsets({ height: 1920, width: 1080 })).toEqual({ bottom: 12, horizontal: 4, top: 5 });
  });

  it("adapts to square and landscape output rather than the selected frame layout", () => {
    expect(getSocialSafeAreaInsets({ height: 1080, width: 1080 })).toEqual({ bottom: 5, horizontal: 3, top: 5 });
    expect(getSocialSafeAreaInsets({ height: 1080, width: 1920 })).toEqual({ bottom: 5, horizontal: 3, top: 5 });
  });
});
