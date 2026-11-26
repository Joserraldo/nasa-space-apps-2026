import { expect, test } from "@playwright/test";

test("R1: M_palette renders white vertex colors, and zero AO renders black", async ({ page }) => {
  await page.goto("/");
  const pixels = await page.evaluate(async () => {
    const modulePath = "/src/scenes/palette-probe.ts";
    return (await import(/* @vite-ignore */ modulePath)).probePalettePixel();
  });
  expect(Math.min(...pixels.white.slice(0, 3))).toBeGreaterThan(40);
  expect(Math.max(...pixels.black.slice(0, 3))).toBeLessThan(5);
  expect(pixels.white[3]).toBe(255);
  await test.info().attach("R1-pixel-readback", { body: JSON.stringify(pixels), contentType: "application/json" });
});
