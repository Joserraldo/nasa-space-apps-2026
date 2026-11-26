import { expect, test } from "@playwright/test";

test("catalog filters by ID family and keeps only the current page in the list", async ({ page }) => {
  await page.goto("/catalog");
  await page.waitForFunction(() => window.__ws0?.metrics.frames > 2);
  const total = await page.evaluate(() => window.__ws0.catalog.length);
  await expect(page.locator("#asset-index li")).toHaveCount(Math.min(12, total));
  await page.getByLabel("Family", { exact: true }).selectOption("CH");
  await expect(page.locator("#asset-index li")).toHaveCount(5);
  expect((await page.locator("#asset-index li").allTextContents()).every(label => label.startsWith("CH-"))).toBe(true);
  await expect(page.getByRole("button", { name: "Previous page" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Next page" })).toBeDisabled();
  await page.getByLabel("Family", { exact: true }).selectOption("All");
  for (let i = 1; i < Math.ceil(total / 12); i++) {
    await page.getByRole("button", { name: "Next page" }).click();
    await expect(page.locator("#asset-index li")).toHaveCount(Math.min(12, total - i * 12));
  }
  await expect(page.getByRole("button", { name: "Next page" })).toBeDisabled();
});
