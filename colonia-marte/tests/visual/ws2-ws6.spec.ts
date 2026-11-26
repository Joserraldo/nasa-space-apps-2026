import { test, expect } from "@playwright/test";

test("WS2 presets keep the comparison camera and report renderer counters", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/environment");
  await page.waitForFunction(() => window.__environment?.metrics.frames > 2);
  const camera = await page.evaluate(() => window.__environment.camera.position.toArray());
  const measurements: object[] = [];
  const preset = page.getByLabel("Environment preset");
  for (let index = 0; index < 8; index++) {
    await preset.selectOption({ index });
    await page.waitForFunction(id => window.__environment.metrics.preset === id, `AMB-0${index + 1}`);
    await page.waitForTimeout(180);
    const metrics = await page.evaluate(() => ({ ...window.__environment.metrics }));
    expect(metrics.calls).toBeGreaterThan(0); expect(metrics.calls).toBeLessThanOrEqual(300);
    expect(metrics.terrainTriangles).toBeLessThanOrEqual(150000);
    expect(metrics.triangles).toBeLessThanOrEqual(1500000);
    expect(await page.evaluate(() => window.__environment.camera.position.toArray())).toEqual(camera);
    measurements.push({ biome: "jezero", ...metrics });
    await page.screenshot({ path: `docs/capturas/ws2-AMB-0${index + 1}.png` });
  }
  await page.getByLabel("Biome", { exact: true }).selectOption("polar");
  await preset.selectOption({ index: 6 });
  await page.waitForTimeout(180);
  measurements.push(await page.evaluate(() => ({ biome: "polar", ...window.__environment.metrics })));
  await page.screenshot({ path: "docs/capturas/ws2-polar-AMB-07.png" });
  await page.getByLabel("Terrain detail").selectOption("2");
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => window.__environment.metrics.terrainTriangles)).toBeLessThan(10000);
  expect(errors).toEqual([]);
  await test.info().attach("renderer-metrics", { body: JSON.stringify(measurements), contentType: "application/json" });
});

test("T4.2 room comparison and WS6 crew load without shader errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/ao");
  await expect(page.getByText(/^Bake:/)).toBeVisible();
  await page.evaluate(() => localStorage.removeItem("ao-three-module-room"));
  await page.reload();
  await expect(page.getByText(/^Bake:/)).toContainText("cache: false");
  const cold = await page.getByText(/^Bake:/).textContent();
  await page.screenshot({ path: "docs/capturas/t4-2-ao-comparison.png" });
  await page.reload();
  await expect(page.getByText(/^Bake:/)).toContainText("cache: true");
  const warm = await page.getByText(/^Bake:/).textContent();
  await test.info().attach("ao-metrics", { body: JSON.stringify({ cold, warm }), contentType: "application/json" });
  await page.goto("/crew");
  await expect(page.getByRole("status")).toContainText("Base character loaded");
  await expect(page.locator("#metrics")).toContainText("draw calls");
  await page.screenshot({ path: "docs/capturas/ws6-iris-expressions.png" });
  await page.getByLabel("Review asset").selectOption("Base A-pose");
  await page.waitForTimeout(150);
  await page.screenshot({ path: "docs/capturas/ws6-base-a-pose.png" });
  expect(errors).toEqual([]);
});
