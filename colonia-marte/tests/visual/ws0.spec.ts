import { test, expect } from "@playwright/test";

test("WS0 visible scene, navigation, catalog and evidence",async ({page}) => {
  const errors:string[]=[];
  page.on("pageerror",error => errors.push(error.message));
  await page.goto("/");
  await page.waitForFunction(() => window.__ws0?.metrics.frames>20);
  await expect(page.locator("#metrics")).toContainText("draw calls");
  const base=await page.evaluate(() => ({...window.__ws0.metrics,visibility:document.visibilityState}));
  expect(base.visibility).toBe("visible");
  expect(base.calls).toBeGreaterThan(0); expect(base.calls).toBeLessThan(300);
  expect(base.triangles).toBeLessThan(1500000); expect(base.materials).toBeLessThanOrEqual(6);
  await page.screenshot({path:"docs/capturas/ws0-base.png"});

  await page.getByRole("button",{name:"Walk",exact:true}).click();
  // Start within the slab; entering walk mode preserves orbit X/Z to avoid an automatic flight.
  await page.evaluate(() => {window.__ws0.camera.position.set(3,1.5,5);});
  await page.locator("#viewport > canvas").click({position:{x:350,y:250}});
  const start=await page.evaluate(() => window.__ws0.camera.position.toArray());
  await page.keyboard.down("w"); await page.waitForTimeout(350); await page.keyboard.up("w");
  const keyboard=await page.evaluate(() => window.__ws0.camera.position.toArray());
  expect(Math.hypot(keyboard[0]-start[0],keyboard[2]-start[2])).toBeGreaterThan(0.1);
  expect(keyboard[1]).toBe(1.5);

  const pad=await page.locator("#joystick").boundingBox(); expect(pad).not.toBeNull();
  const x=pad!.x+pad!.width/2,y=pad!.y+pad!.height/2;
  await page.mouse.move(x,y); await page.mouse.down(); await page.mouse.move(x+35,y-25);
  await page.waitForTimeout(350);
  const joystick=await page.evaluate(() => window.__ws0.camera.position.toArray());
  await page.mouse.up();
  expect(Math.hypot(joystick[0]-keyboard[0],joystick[2]-keyboard[2])).toBeGreaterThan(0.1);
  expect(await page.evaluate(() => window.__ws0.joystick.state.active)).toBe(false);
  await page.screenshot({path:"docs/capturas/ws0-walk.png"});
  await page.goto("/catalog");
  await page.waitForFunction(() => window.__ws0?.metrics.frames>20);
  const entries = await page.evaluate(() => window.__ws0.catalog.length);
  await expect(page.locator("#asset-index li")).toHaveCount(Math.min(12, entries));
  const catalog=await page.evaluate(() => ({metrics:window.__ws0.metrics,entries:window.__ws0.catalog,visibility:document.visibilityState}));
  expect(catalog.entries.every(entry => entry.triangles>0)).toBe(true);
  expect(catalog.visibility).toBe("visible");
  await page.screenshot({path:"docs/capturas/ws0-catalog.png"});
  expect(errors).toEqual([]);
  await test.info().attach("ws0-metrics",{
    body:JSON.stringify({base,navigation:{start,keyboard,joystick},catalog,errors},null,2), contentType:"application/json",
  });
});
