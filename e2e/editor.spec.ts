import { expect, test } from "@playwright/test";

test("explains what the product does before any video is added", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Auto captions" })).toBeVisible();
  await expect(page.getByText("Sign in")).toHaveCount(0);
});

test("opens the import panel with a plain list of what is possible", async ({ page }) => {
  await page.goto("/editor");

  await expect(page.getByRole("heading", { name: /Frame your story/ })).toBeVisible();
  await expect(page.getByText("Once your video is in, you can:")).toBeVisible();
  await expect(page.getByText("Auto captions")).toBeVisible();
});
