// Dialogue layout matrix: every sample at desktop and landscape-phone sizes, with overflow checks.
import { chromium } from "playwright";
const base = process.argv[2] ?? "http://127.0.0.1:5192";
const out = process.argv[3] ?? "docs/capturas";
const samples = ["short", "medium", "long", "labels", "sentence"];
const browser = await chromium.launch({ headless: false, args: ["--use-angle=d3d11", "--ignore-gpu-blocklist"] });
let failures = 0;
for (const [size, width, height] of [["desktop", 1280, 720], ["phone", 812, 375]]) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1.5 });
  for (const key of samples) {
    await page.goto(`${base}/hud-preview?dialogue=${key}`);
    await page.waitForSelector(".ui-crew-dialogue", { timeout: 180000 });
    await page.waitForFunction(() => document.fonts.status === "loaded");
    const settle = () => page.waitForFunction(() => document.getAnimations().filter(a => a.constructor.name === "CSSTransition")
      .every(a => a.playState === "finished"), null, { timeout: 15000 });
    await settle();
    await page.mouse.move(2, 2);
    const measure = () => page.evaluate(min => {
      const panel = document.querySelector(".ui-crew-dialogue").getBoundingClientRect();
      const clipped = [...document.querySelectorAll(".ui-crew-dialogue__line, .ui-hud-reply__label, .ui-crew-dialogue__name")]
        .filter(el => el.offsetParent && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)).length;
      const buttons = [...document.querySelectorAll(".ui-crew-dialogue button")].filter(b => b.offsetParent)
        .map(b => b.getBoundingClientRect()).map(r => Math.round(Math.min(r.width, r.height)));
      return { page: document.querySelector(".ui-crew-dialogue").dataset.page,
        inView: panel.left >= 0 && panel.right <= innerWidth && panel.top >= 0 && panel.bottom <= innerHeight,
        heightPct: Math.round(panel.height / innerHeight * 100), width: Math.round(panel.width), clipped,
        minButton: Math.min(...buttons), buttonsOk: buttons.every(b => b >= min) };
    }, height <= 460 ? 48 : 64);
    let pageNo = 1;
    for (;;) {
      const m = await measure();
      const ok = m.inView && m.clipped === 0 && m.buttonsOk;
      if (!ok) failures++;
      console.log(`${size} ${key} page ${m.page} width ${m.width}px height ${m.heightPct}% clipped ${m.clipped} min button ${m.minButton} ${ok ? "PASS" : "FAIL"}`);
      await page.screenshot({ path: `${out}/dialogo-${size}-${key}-${pageNo}.png` });
      const next = await page.$(".ui-crew-dialogue__next:not([hidden])");
      const hasNext = next && await next.evaluate(b => !!b.offsetParent);
      if (!hasNext) break;
      await next.click(); await settle(); await page.waitForTimeout(200); pageNo++;
    }
  }
  await page.close();
}
await browser.close();
console.log(failures ? `FAILURES ${failures}` : "ALL PASS");
process.exitCode = failures ? 1 : 0;
