import { expect, test } from "@playwright/test";

test("opens the local-only import panel", async ({ page }) => {
  await page.goto("/editor");

  await expect(page.getByRole("heading", { name: "Import your video" })).toBeVisible();
  await expect(page.getByText("Your video stays on this device.")).toBeVisible();
});
