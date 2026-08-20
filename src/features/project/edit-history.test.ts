import { describe, expect, it } from "vitest";

import { commitEdit, createEditHistory, redoEdit, undoEdit } from "./edit-history";

describe("edit history", () => {
  it("undoes, redoes, and clears a stale redo branch after an edit", () => {
    const first = commitEdit(createEditHistory("one"), "two");
    const undone = undoEdit(first);
    expect(undone).toMatchObject({ future: ["two"], present: "one" });
    expect(redoEdit(undone).present).toBe("two");
    expect(commitEdit(undone, "three")).toMatchObject({ future: [], present: "three" });
  });
});
