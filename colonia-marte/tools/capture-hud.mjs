// Captures the UI v3 HUD preview at desktop and landscape-phone sizes (window visible, real GPU path).
import { chromium } from "playwright";
const base = process.argv[2] ?? "http://127.0.0.1:5192";
const out = process.argv[3] ?? "docs/capturas";
const browser = await chromium.launch({ headless: false, args: ["--use-angle=d3d11", "--ignore-gpu-blocklist"] });
for (const [name, width, height] of [["ui-v3-hud-canteen", 1280, 720], ["ui-v3-hud-mobile", 812, 375]]) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
  const errors = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(`${base}/hud-preview`);
  await page.waitForSelector(".ui-game-hud", { state: "attached", timeout: 180000 });
  await page.waitForFunction(() => document.fonts.status === "loaded");
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `${out}/${name}.png` });
  // Layout checks measured in the real browser.
  const layout = await page.evaluate(() => {
    const box = el => { const r = document.querySelector(el).getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
    const W = innerWidth, H = innerHeight;
    const centre = { l: W * 0.3, t: H * 0.3, r: W * 0.7, b: H * 0.7 };
    const hit = (a, c) => a.l < c.r && a.r > c.l && a.t < c.b && a.b > c.t;
    const slots = [...document.querySelectorAll(".ui-game-hud__slot")].map(s => { const r = s.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom }; });
    const overlaps = slots.flatMap((a, i) => slots.slice(i + 1).filter(b => hit(a, b))).length;
    return { action: box(".ui-hud-action"), slotsInCentre: slots.filter(s => hit(s, centre)).length, overlaps };
  });
  const minTarget = height <= 460 ? 48 : 64;
  const ok = layout.action.h >= minTarget && layout.action.w >= minTarget && layout.slotsInCentre === 0 && layout.overlaps === 0;
  console.log(name, width, height, "errors:", errors.length, "action", Math.round(layout.action.w) + "x" + Math.round(layout.action.h),
    "slots in centre 40%:", layout.slotsInCentre, "overlaps:", layout.overlaps, ok ? "PASS" : "FAIL");
  if (!ok || errors.length) process.exitCode = 1;
  // Pause menu: open with the HUD button, measure option targets, capture.
  await page.click(".ui-hud-pause");
  await page.waitForTimeout(700);
  const pause = await page.evaluate(() => ({
    open: document.querySelector("dialog.ui-pause")?.open ?? false,
    items: [...document.querySelectorAll(".ui-pause__item")].map(b => Math.round(b.getBoundingClientRect().height)),
    focused: document.activeElement?.className ?? "",
  }));
  await page.screenshot({ path: `${out}/${name.replace("hud", "pause")}.png` });
  const pauseOk = pause.open && pause.items.length === 3 && pause.items.every(h => h >= 64) && pause.focused.includes("ui-pause__item");
  console.log(name.replace("hud", "pause"), "open", pause.open, "items", pause.items.join("/"), "focus", pause.focused, pauseOk ? "PASS" : "FAIL");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  const closed = await page.evaluate(() => !document.querySelector("dialog.ui-pause")?.open);
  console.log("escape closes", closed ? "PASS" : "FAIL");
  if (!pauseOk || !closed) process.exitCode = 1;
  // Crew dialogue: tap the diegetic action, measure replies, check the bottom corners stepped aside.
  await page.click(".ui-hud-interaction .ui-hud-action");
  // Wait for CSS transitions (not the looping speaking wave) to settle before measuring.
  await page.waitForFunction(() => document.getAnimations().filter(a => a.constructor.name === "CSSTransition")
    .every(a => a.playState === "finished"), null, { timeout: 15000 });
  await page.mouse.move(5, 5);
  await page.waitForTimeout(300);
  const talk = await page.evaluate(() => {
    const hidden = sel => getComputedStyle(document.querySelector(sel)).visibility === "hidden";
    return {
      replies: [...document.querySelectorAll(".ui-crew-dialogue__replies .ui-hud-reply")].map(b => Math.round(b.getBoundingClientRect().height)),
      cornersHidden: hidden(".ui-game-hud__slot--bottom-left") && hidden(".ui-game-hud__slot--bottom-right"),
      portrait: document.querySelector(".ui-crew-dialogue__image")?.naturalWidth ?? 0,
      focused: document.activeElement?.className ?? "",
    };
  });
  await page.screenshot({ path: `${out}/${name.replace("hud", "dialogue")}.png` });
  const talkOk = talk.replies.length === 3 && talk.replies.every(h => h >= (height <= 460 ? 48 : 64)) && talk.cornersHidden && talk.portrait > 0 && talk.focused.includes("ui-hud-reply");
  console.log(name.replace("hud", "dialogue"), "replies", talk.replies.join("/"), "corners hidden", talk.cornersHidden, "portrait", talk.portrait, talkOk ? "PASS" : "FAIL");
  await page.click(".ui-crew-dialogue__replies .ui-hud-reply");
  await page.waitForTimeout(400);
  const back = await page.evaluate(() => !document.querySelector(".ui-crew-dialogue") && !document.querySelector(".ui-game-hud").classList.contains("is-dialogue"));
  console.log("reply returns to explore", back ? "PASS" : "FAIL");
  if (!talkOk || !back) process.exitCode = 1;
  await page.close();
}
await browser.close();
