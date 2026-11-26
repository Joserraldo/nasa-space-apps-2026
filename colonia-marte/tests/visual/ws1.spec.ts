import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 1280, height: 720 } });

test("WS0 corrections: isolated catalog and viewport-owned navigation", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/catalog");
  await page.waitForFunction(() => window.__ws0?.metrics.frames > 10);
  await expect(page.locator(".asset-label")).toHaveCount(10);
  const labels = await page.locator(".asset-label").evaluateAll(elements => elements.map(element => {
    const { x, y, width, height } = element.getBoundingClientRect();
    return { x, y, width, height, text: element.textContent };
  }));
  for (const [index, a] of labels.entries()) {
    expect(a.x).toBeGreaterThanOrEqual(280);
    expect(a.y).toBeGreaterThanOrEqual(0);
    expect(a.x + a.width).toBeLessThanOrEqual(1280);
    expect(a.y + a.height).toBeLessThanOrEqual(672);
    for (const b of labels.slice(index + 1)) {
      expect(a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y)
        .toBe(false);
    }
  }
  await page.screenshot({ path: "docs/capturas/ws1-catalog.png" });
  await page.goto("/");
  await page.waitForFunction(() => window.__ws0?.metrics.frames > 10);
  await page.getByRole("button", { name: "Walk", exact: true }).click();
  const before = await page.evaluate(() => window.__ws0.camera.position.toArray());
  await page.keyboard.down("ArrowUp");
  await page.waitForTimeout(400);
  await page.keyboard.up("ArrowUp");
  const after = await page.evaluate(() => window.__ws0.camera.position.toArray());
  expect(Math.hypot(after[0] - before[0], after[2] - before[2])).toBeGreaterThan(0.1);
  for (const key of ["Space", "PageDown", "End", "ArrowDown"]) await page.keyboard.press(key);
  const scroll = () => page.evaluate(() => ({
    y: scrollY, top: document.querySelector("header")!.getBoundingClientRect().top,
    height: document.documentElement.scrollHeight, viewport: innerHeight,
  }));
  expect(await scroll()).toEqual({ y: 0, top: 0, height: 720, viewport: 720 });
  await page.screenshot({ path: "docs/capturas/ws1-walk.png" });
  await page.getByRole("button", { name: "Play camera demo" }).click();
  await page.locator("#viewport > canvas").focus();
  for (const key of ["Space", "PageDown", "End", "ArrowDown"]) await page.keyboard.press(key);
  await page.waitForTimeout(400);
  expect(await scroll()).toEqual({ y: 0, top: 0, height: 720, viewport: 720 });
  await page.screenshot({ path: "docs/capturas/ws1-camera.png" });
  expect(errors).toEqual([]);
});

test("WS1 material review renders six pairs, eight UIs and three reduced references", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/materials");
  await expect(page.locator(".asset-label")).toHaveCount(6);
  await expect(page.locator("#screens canvas")).toHaveCount(8);
  await expect(page.locator("#swatches li")).toHaveCount(24);
  const cyan = page.locator('#swatches li[data-color="cyan"]');
  await expect(cyan.locator(".observed-swatch")).toContainText("#D3FDFC");
  await expect(cyan.locator(".base-swatch")).toContainText("#3FD8FF");
  await expect(cyan).toContainText("Bloom");
  const halves = await cyan.locator(".swatch-pair > span").evaluateAll(elements =>
    elements.map(element => element.getBoundingClientRect().toJSON()));
  expect(halves[0].right).toBeLessThanOrEqual(halves[1].left);
  expect(halves[0].top).toBe(halves[1].top);
  const icon = await page.locator('link[rel="icon"]').getAttribute("href");
  const iconResponse = await page.request.get(icon!);
  expect(iconResponse.ok()).toBe(true);
  expect(iconResponse.headers()["content-type"]).toContain("image/svg+xml");
  await expect(page.locator(".reference-strip img")).toHaveCount(3);
  await page.waitForFunction(() => Array.from(document.images).every(image => image.complete && image.naturalWidth));
  const atlas = await page.locator("#atlas-image canvas").evaluate((canvas: HTMLCanvasElement) => ({
    width: canvas.width, height: canvas.height,
    opaque: Array.from(canvas.getContext("2d")!.getImageData(16, 16, 1, 1).data),
    emissive: Array.from(canvas.getContext("2d")!.getImageData(16, 240, 1, 1).data),
  }));
  expect(atlas).toEqual({ width: 256, height: 256, opaque: [212, 210, 194, 255], emissive: [63, 216, 255, 255] });
  await page.waitForTimeout(800);
  await page.screenshot({ path: "docs/capturas/ws1-materials.png" });
  expect(errors).toEqual([]);
});
