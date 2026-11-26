import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://127.0.0.1:5192";
const out = process.argv[3] ?? "docs/capturas";
const browser = await chromium.launch({ headless: false, args: ["--use-angle=d3d11", "--ignore-gpu-blocklist"] });
const menuSelector = "dialog.ui-main-menu[open]";
const cardSelector = "dialog.ui-chapter-stage[open] > .ui-chapter-card";
const dem = "**/*jezero-elevation*.bin*";
const savedKey = "colonia.progress.chapter";
await mkdir(out, { recursive: true });

function check(label, pass, detail = "") {
  console.log(`${pass ? "PASS" : "FAIL"} ${label}${detail ? `: ${detail}` : ""}`);
  if (!pass) process.exitCode = 1;
}

async function settle(page) {
  await page.mouse.move(5, 5);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => document.getAnimations().filter(animation => animation instanceof CSSTransition)
    .every(animation => animation.playState === "finished"));
}

async function inspect(page, selector, name, target, options, maxButtons) {
  await settle(page);
  const result = await page.locator(selector).evaluate((root, size) => {
    const fits = r => r.left >= -0.5 && r.top >= -0.5 && r.right <= innerWidth + 0.5 && r.bottom <= innerHeight + 0.5;
    const visible = el => el.getClientRects().length > 0 && getComputedStyle(el).visibility === "visible";
    const buttons = [...root.querySelectorAll("button")].filter(visible);
    const text = [...root.querySelectorAll("*")].filter(el => visible(el) &&
      [...el.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim()));
    const issues = [];
    for (const button of buttons) {
      const rect = button.getBoundingClientRect();
      if (rect.width < size || rect.height < size || !fits(rect)) issues.push(`${button.textContent}: ${rect.width}x${rect.height}`);
    }
    for (const el of text) {
      const txt = el.textContent.trim();
      const range = document.createRange();
      range.selectNodeContents(el);
      if (!el.dataset.voiceLine || txt.split(/\s+/).length > 12) issues.push(`Narration: ${txt}`);
      if ([...range.getClientRects()].some(rect => !fits(rect)) ||
          (el.clientWidth > 0 && el.scrollWidth > el.clientWidth) ||
          (el.clientHeight > 0 && el.scrollHeight > el.clientHeight)) issues.push(`Clipped: ${txt}`);
    }
    const slab = root.querySelector(".ui-main-menu__slab");
    if (slab) {
      const s = slab.getBoundingClientRect();
      const testRect = (rect, el) => {
        if (rect.right > s.right - s.width * 0.22 * (rect.bottom - s.top) / s.height + 0.5) {
          issues.push(`Clipped by slab: ${el.textContent.trim()}`);
        }
      };
      for (const el of [...text, ...buttons].filter(el => slab.contains(el))) testRect(el.getBoundingClientRect(), el);
    }
    return { issues, buttons: buttons.length, text: text.length, inViewport: fits(root.getBoundingClientRect()) };
  }, target);
  check(`${name}: ${options} actions, ${target}px targets, text and layout`, result.buttons === options &&
    result.buttons <= maxButtons && result.inViewport && result.text > 0 && result.issues.length === 0,
    result.issues.join("; ") || `${result.buttons} controls, ${result.text} narrated elements`);
  await page.screenshot({ path: join(out, `ui-v3-${name}.png`) });
}

try {
  for (const [size, width, height, target] of [["desktop", 1280, 720, 64], ["mobile", 812, 375, 48]]) {
    for (const bigText of [false, true]) {
      const suffix = `${size}${bigText ? "-big" : ""}`;
      const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2, reducedMotion: bigText ? "reduce" : "no-preference" });
      await page.bringToFront();
      // Exclude one-time native window/compositor startup, not the target page's navigation or paint.
      await page.goto("data:text/html,<p>Capture ready</p>");
      await page.waitForFunction(() => !document.hidden && performance.getEntriesByName("first-contentful-paint", "paint").length > 0);
      const errors = [];
      page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
      page.on("pageerror", error => errors.push(error.message));
      await page.addInitScript(({ big }) => {
        if (location.protocol !== "http:" && location.protocol !== "https:") return;
        if (!sessionStorage.getItem("phase1-fixture")) {
          localStorage.setItem("colonia.settings.v1", JSON.stringify({ bigText: big }));
          sessionStorage.setItem("phase1-fixture", "1");
        }
        document.addEventListener("readystatechange", () => {
          if (document.readyState !== "interactive") return;
          const body = document.body.getBoundingClientRect();
          const app = document.querySelector("#app").getBoundingClientRect();
          window.phase1InitialLayout = {
            bigText: document.documentElement.classList.contains("ui-big-text"),
            beforeModule: !performance.getEntriesByName("menu-load-start", "mark").length,
            body: [body.x, body.y, body.width, body.height],
            app: [app.x, app.y, app.width, app.height],
          };
        });
        window.phase1Shifts = [];
        new PerformanceObserver(list => {
          window.phase1Shifts.push(...list.getEntries().filter(entry => !entry.hadRecentInput).map(entry => entry.value));
        }).observe({ type: "layout-shift", buffered: true });
      }, { big: bigText });
      let release;
      const gate = new Promise(resolve => { release = resolve; });
      try {
        await page.route(dem, async route => { await gate; await route.continue(); });
        await page.goto(`${base}/menu?clean=1`, { waitUntil: "commit" });
        const loading = page.locator(".ui-loading");
        await loading.waitFor({ timeout: 30000 });
        await page.waitForFunction(() => performance.getEntriesByName("first-contentful-paint", "paint").length > 0 &&
          performance.getEntriesByName("menu-content-request", "mark").length > 0);
        const stats = await page.evaluate(() => {
          const fact = document.querySelector(".ui-loading__fact");
          const factStyle = getComputedStyle(fact);
          return {
            firstPaint: performance.getEntriesByName("first-contentful-paint", "paint")[0].startTime,
            started: performance.getEntriesByName("menu-load-start", "mark")[0].startTime,
            mounted: performance.getEntriesByName("menu-loader-mounted", "mark")[0].startTime,
            contentRequest: performance.getEntriesByName("menu-content-request", "mark")[0].startTime,
            facts: document.querySelectorAll(".ui-loading__fact").length,
            progress: document.querySelector(".ui-loading progress")?.hasAttribute("value"),
            irisAnimation: getComputedStyle(document.querySelector(".ui-loading__iris")).animationName !== "none",
            scale: document.documentElement.classList.contains("ui-big-text"),
            initial: window.phase1InitialLayout,
            reserve: fact.getBoundingClientRect().height / parseFloat(factStyle.lineHeight),
            factFontSizeAdjust: factStyle.fontSizeAdjust,
          };
        });
        const viewport = [0, 0, width, height];
        // Viewport CSS units may resolve to fractional pixels at device scale.
        const matchesViewport = rect => rect.every((value, i) => Math.abs(value - viewport[i]) <= 0.5);
        check(`${suffix}: saved text scale and viewport geometry precede the module`,
          stats.initial?.beforeModule && stats.initial.bigText === bigText &&
          matchesViewport(stats.initial.body) && matchesViewport(stats.initial.app),
          JSON.stringify(stats.initial));
        check(`${suffix}: Mars fact reserves two scaled lines with stable font metrics`,
          stats.reserve >= 1.99 && Number(stats.factFontSizeAdjust) > 0,
          `${stats.reserve.toFixed(2)} lines; font-size-adjust ${stats.factFontSizeAdjust}`);
        const delay = stats.firstPaint - stats.started;
        check(`${suffix}: loading paints in <100ms after route starts and before menu imports`,
          delay >= 0 && delay < 100 && stats.mounted <= stats.firstPaint && stats.firstPaint <= stats.contentRequest,
          `${delay.toFixed(1)}ms (mounted at ${(stats.mounted - stats.started).toFixed(1)}ms; imports at ${(stats.contentRequest - stats.started).toFixed(1)}ms)`);
        check(`${suffix}: one fact, indeterminate progress, motion preference, text scale`,
          stats.facts === 1 && !stats.progress && stats.irisAnimation === !bigText && stats.scale === bigText);
        await inspect(page, ".ui-loading", `loading-${suffix}`, target, 0, 0);
        release();
        const menu = page.locator(menuSelector);
        await menu.waitFor({ timeout: 90000 });
        await page.unroute(dem);
        await inspect(page, menuSelector, `menu-new-${suffix}`, target, 2, 3);
        const backdrop = await page.evaluate(() => ({
          frames: window.__exterior?.metrics?.frames ?? 0,
          triangles: window.__exterior?.metrics?.triangles ?? 0,
          overlayRemoved: !document.querySelector(".ui-loading"),
          cls: window.phase1Shifts.reduce((sum, value) => sum + value, 0),
        }));
        check(`${suffix}: real rendered Jezero behind menu, CLS <= 0.01 during load`,
          backdrop.frames > 0 && backdrop.triangles > 0 && backdrop.overlayRemoved && backdrop.cls <= 0.01,
          `${backdrop.frames} frames, ${backdrop.triangles} triangles, CLS ${backdrop.cls}`);

        const settings = menu.getByRole("button", { name: "Settings", exact: true });
        await settings.click();
        const preferences = page.locator("dialog.ui-settings[open]");
        check(`${suffix}: menu opens the native Settings organism`, await preferences.evaluate(el => el.matches(":modal")));
        await page.keyboard.press("Escape");
        check(`${suffix}: Escape restores Settings trigger focus`, await settings.evaluate(el => document.activeElement === el));

        await menu.getByRole("button", { name: "New game" }).click();
        const card = page.locator(cardSelector);
        await inspect(page, cardSelector, `chapter-start-${suffix}`, target, 1, 2);
        check(`${suffix}: New game shows chapter 1`, await card.getByRole("heading", { name: "The journey" }).isVisible());
        await page.keyboard.press("Escape");
        await menu.waitFor();
        await page.evaluate(key => localStorage.setItem(key, "C2"), savedKey);
        await page.reload({ waitUntil: "commit" });
        await menu.waitFor({ timeout: 90000 });
        await inspect(page, menuSelector, `menu-saved-${suffix}`, target, 3, 3);
        const resume = menu.getByRole("button", { name: /^Continue/ });
        const narration = await resume.getAttribute("data-voice-line");
        await resume.click();
        check(`${suffix}: Continue announces and opens the saved chapter`,
          narration === "Continue. Chapter 2. Arrival at Jezero." && await card.getByRole("heading", { name: "Arrival at Jezero" }).isVisible());
        if (!bigText && size === "desktop") {
          await card.getByRole("button", { name: "Start" }).click();
          await page.waitForURL(url => url.pathname === "/hud-preview" && url.searchParams.get("chapter") === "C2");
          await page.locator(".ui-game-hud").waitFor({ timeout: 90000 });
          check(`${suffix}: Start opens the existing HUD preview`, true);
        }

        await page.goto(`${base}/menu?clean=1&chapter-card=complete&chapter=C2`, { waitUntil: "commit" });
        await card.waitFor({ timeout: 90000 });
        await inspect(page, cardSelector, `chapter-complete-${suffix}`, target, 2, 2);
        const objectives = await card.locator(".ui-chapter-card__objective").evaluateAll(nodes => nodes.map(node => {
          const svg = node.querySelector("svg");
          const label = node.querySelector("[data-voice-line]");
          return { id: node.dataset.objective, earned: node.dataset.earned, drawing: svg.innerHTML,
            color: getComputedStyle(svg).stroke, decorative: svg.getAttribute("aria-hidden"),
            text: label.textContent, voice: label.dataset.voiceLine };
        }));
        check(`${suffix}: Easy completion has distinct voiced objectives and no numbers`,
          objectives.length === 2 &&
          objectives[0].id === "power" && objectives[0].earned === "true" &&
          objectives[0].text === "Power" && objectives[0].voice === "Power: achieved." &&
          objectives[1].id === "air" && objectives[1].earned === "false" &&
          objectives[1].text === "Air pending" && objectives[1].voice === "Air: not achieved." &&
          objectives[0].drawing !== objectives[1].drawing && objectives[0].color !== objectives[1].color &&
          objectives.every(objective => objective.decorative === "true") &&
          !/\d/.test(await card.innerText()) &&
          await card.getByText("Your game is saved").getAttribute("data-voice-line") === "Your game is saved");
        await page.evaluate(() => document.addEventListener("colony-map-request", event => {
          document.body.dataset.mapRequest = event.detail.chapter;
        }));
        await card.getByRole("button", { name: "Colony map" }).click();
        check(`${suffix}: Colony map emits a request without implementing Phase 2`, await page.locator("body").getAttribute("data-map-request") === "C2");
        await card.getByRole("button", { name: "Next chapter" }).click();
        check(`${suffix}: Next chapter shows C3`, await card.getByRole("heading", { name: "Food for everyone" }).isVisible());
        check(`${suffix}: no console or page errors`, !errors.length, errors.join("; "));
      } finally {
        release();
        await page.close();
      }
    }
  }
} catch (error) {
  assert.fail(error.stack ?? String(error));
} finally {
  await browser.close();
}
