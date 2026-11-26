import { test, expect } from "@playwright/test";

test("WS7 camera demo and pause in a visible window",async ({page}) => {
  await page.goto("/");
  await page.waitForFunction(() => window.__ws0?.metrics.frames>20);
  await page.getByRole("button",{name:"Reset view",exact:true}).click();
  await page.getByRole("button",{name:"Play camera demo",exact:true}).click();
  await page.waitForTimeout(500);
  await page.getByRole("button",{name:"Pause camera demo",exact:true}).click();
  const paused=await page.evaluate(() => window.__ws0.camera.position.toArray());
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => window.__ws0.camera.position.toArray())).toEqual(paused);
  await page.screenshot({path:"docs/capturas/ws0-camera.png"});

});
