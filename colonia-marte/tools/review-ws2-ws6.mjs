import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import assert from "node:assert/strict";

// CDP avoids the blocked Playwright worker spawn. Connect only to the dedicated local review browser.
const browser = await chromium.connectOverCDP("http://127.0.0.1:9224");
const context = browser.contexts()[0];
const page = await context.newPage();
await page.setViewportSize({ width: 1440, height: 1000 });
const errors = [];
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
const base = "http://127.0.0.1:5190";
const capture = name => page.screenshot({ path: `docs/capturas/${name}.png` });
const frames = async () => {
  const start = await page.evaluate(() => window.__environment.metrics.frames);
  await page.waitForFunction(value => window.__environment.metrics.frames >= value + 2, start);
};
try {
  await page.goto(`${base}/environment`);
  await page.waitForFunction(() => window.__environment?.metrics.frames >= 2);
  const position = await page.evaluate(() => window.__environment.camera.position.toArray());
  const metrics = [];
  for (let i = 0; i < 8; i++) {
    await page.getByLabel("Environment preset").selectOption({ index: i });
    await frames();
    const measurement = await page.evaluate(() => ({ ...window.__environment.metrics }));
    assert(measurement.calls > 0 && measurement.calls <= 300);
    assert(measurement.terrainTriangles <= 150000 && measurement.triangles <= 1500000);
    assert.deepEqual(await page.evaluate(() => window.__environment.camera.position.toArray()), position);
    metrics.push({ biome: "jezero", ...measurement });
    await capture(`ws2-AMB-0${i + 1}`);
  }
  await page.getByLabel("Biome", { exact: true }).selectOption("polar");
  await page.getByLabel("Environment preset").selectOption({ index: 6 });
  await frames();
  metrics.push(await page.evaluate(() => ({ biome: "polar", ...window.__environment.metrics })));
  await capture("ws2-polar-AMB-07");
  for (const lod of ["1", "2"]) {
    await page.getByLabel("Terrain detail").selectOption(lod); await frames();
    metrics.push(await page.evaluate(() => ({ biome: "polar", ...window.__environment.metrics })));
  }
  await writeFile("docs/capturas/ws2-render-metrics.json", JSON.stringify(metrics, null, 2), "utf8");
  await page.goto(`${base}/ao`);
  await page.getByText(/^Bake:/).waitFor();
  await page.evaluate(() => localStorage.removeItem("ao-three-module-room"));
  await page.reload(); await page.getByText(/^Bake:/).waitFor();
  const cold = await page.getByText(/^Bake:/).textContent();
  assert(cold.includes("cache: false"));
  await page.waitForFunction(() => document.querySelector("#metrics").textContent.includes("draw calls"));
  await capture("t4-2-ao-comparison");
  await page.reload(); await page.getByText(/^Bake:/).waitFor();
  const warm = await page.getByText(/^Bake:/).textContent();
  assert(warm.includes("cache: true"));
  await writeFile("docs/capturas/t4-2-ao-metrics.json", JSON.stringify({ cold, warm }, null, 2), "utf8");
  await page.goto(`${base}/crew`);
  await page.getByRole("status").filter({ hasText: "Base character loaded" }).waitFor();
  await page.waitForFunction(() => document.querySelector("#metrics").textContent.includes("draw calls"));
  await capture("ws6-iris-expressions");
  await page.getByLabel("Review asset").selectOption("Base A-pose");
  await page.waitForTimeout(300);
  await capture("ws6-base-a-pose");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ metrics, ao: { cold, warm }, errors, fps: "not measured" }, null, 2));
} finally {
  await page.close();
  await browser.close();
}
