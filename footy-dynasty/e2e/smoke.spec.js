import { test, expect } from "@playwright/test";

test("app shell loads (title + root)", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Footy Dynasty/i);
  await expect(page.locator("#root")).toBeVisible();
});
