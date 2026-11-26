import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import assert from "node:assert/strict";

const browser = await chromium.connectOverCDP("http://127.0.0.1:9224");
const page = await browser.contexts()[0].newPage();
await page.setViewportSize({ width: 1440, height: 1000 });
const errors = [];
const measurements = {};
const capture = name => page.screenshot({ path: `docs/capturas/correcciones-2-${name}.png` });
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
try {
  await page.goto("http://127.0.0.1:5190/");
  const pixels = await page.evaluate(async () => {
    const module = await import("/src/scenes/palette-probe.ts");
    return module.probePalettePixel();
  });
  assert(Math.min(...pixels.white.slice(0, 3)) > 40);
  assert(Math.max(...pixels.black.slice(0, 3)) < 5);
  assert.equal(pixels.white[3], 255);
  assert.deepEqual(errors, []);
  await writeFile("docs/capturas/correcciones-2-pixels.json", JSON.stringify(pixels, null, 2));
  console.log("PALETTE_PIXEL", JSON.stringify(pixels));
  if (!process.argv.includes("--pixel-only")) {
    await page.goto("http://127.0.0.1:5190/catalog");
    await page.waitForFunction(() => window.__ws0?.metrics.frames > 2);
    const total = await page.evaluate(() => window.__ws0.catalog.length);
    assert.equal(await page.locator("#asset-index li").count(), Math.min(12, total));
    await capture("catalog-all");
    await page.getByLabel("Family", { exact: true }).selectOption("CH");
    assert.equal(await page.locator("#asset-index li").count(), 5);
    assert((await page.locator("#asset-index li").allTextContents()).every(label => label.startsWith("CH-")));
    await capture("catalog-CH");
    measurements.catalog = { total, pageSize: 12, filtered: 5 };
    await page.goto("http://127.0.0.1:5190/environment");
    await page.waitForFunction(() => window.__environment?.metrics.frames > 2);
    const frames = async () => {
      const start = await page.evaluate(() => window.__environment.metrics.frames);
      await page.waitForFunction(n => window.__environment.metrics.frames > n + 2, start);
    };
    measurements.environments = [];
    for (const [name, preset, biome, camera] of [
      ["jezero-eye", 3, "jezero", 0], ["jezero-elevated", 3, "jezero", 1],
      ["night", 7, "jezero", 0], ["polar-eye", 6, "polar", 0], ["polar-elevated", 6, "polar", 1],
    ]) {
      await page.getByLabel("Biome", { exact: true }).selectOption(biome);
      await page.getByLabel("Environment preset").selectOption({ index: preset });
      await page.getByLabel("Review camera").selectOption({ index: camera });
      await frames();
      const metrics = await page.evaluate(() => ({ ...window.__environment.metrics }));
      assert(metrics.calls > 0 && metrics.calls <= 300); assert(metrics.terrainTriangles <= 150000);
      measurements.environments.push({ name, ...metrics }); await capture(name);
    }
    await page.goto("http://127.0.0.1:5190/crew");
    await page.getByRole("status").filter({ hasText: "Base character loaded" }).waitFor();
    await page.waitForFunction(() => document.querySelector("#metrics").textContent.includes("draw calls"));
    measurements.iris = await page.locator("#metrics").textContent(); await capture("iris");
    await page.getByLabel("Review asset").selectOption("Base A-pose");
    await page.waitForTimeout(250); await capture("base-web");
  }
  assert.deepEqual(errors, []);
  await writeFile("docs/capturas/correcciones-2-web-metrics.json", JSON.stringify({ measurements, errors }, null, 2));
} finally {
  await page.close();
  await browser.close();
}
