import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://127.0.0.1:5192";
const out = process.argv[3] ?? "docs/capturas";
const regressionOut = process.argv[4] ?? out;
const settingsKey = "colonia.settings.v1";
const pauseSelector = "dialog.ui-pause:not(.ui-settings)";
const settingsSelector = "dialog.ui-settings";
const tabs = [["sound", "Sound"], ["play", "Play"], ["grownups", "Grown-ups"]];
await mkdir(out, { recursive: true });
await mkdir(regressionOut, { recursive: true });
const browser = await chromium.launch({
  headless: false, args: ["--use-angle=d3d11", "--ignore-gpu-blocklist"],
});

function check(label, passed, details = "") {
  console.log(`${passed ? "PASS" : "FAIL"} ${label}${details ? `: ${details}` : ""}`);
  if (!passed) process.exitCode = 1;
}

async function settle(page) {
  await page.mouse.move(5, 5);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.waitForFunction(() => document.getAnimations().filter(a => a instanceof CSSTransition)
    .every(a => a.playState === "finished"), null, { timeout: 15000 });
}

async function measure(page, name, selector, target) {
  await settle(page);
  const result = await page.locator(selector).evaluate((root, minTarget) => {
    const visible = el => {
      const box = el.getBoundingClientRect();
      const css = getComputedStyle(el);
      return el.getClientRects().length && css.visibility === "visible" &&
        !(css.clipPath === "inset(50%)" && box.width <= 1 && box.height <= 1);
    };
    const fits = ({ left, right, top, bottom }) =>
      left >= -0.5 && top >= -0.5 && right <= innerWidth + 0.5 && bottom <= innerHeight + 0.5;
    const name = el => el.getAttribute("aria-label") || el.textContent.trim() || el.className;
    const buttons = [...root.querySelectorAll("button, a[href]")].filter(visible);
    const undersized = buttons.flatMap(button => {
      const { width, height } = button.getBoundingClientRect();
      return width < minTarget - 0.01 || height < minTarget - 0.01 ? [`${name(button)} ${width}x${height}`] : [];
    });
    const text = [...root.querySelectorAll("*")].filter(el => visible(el) &&
      !el.closest(".ui-settings__credits") &&
      [...el.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim()));
    const clipped = text.flatMap(el => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const outside = [...range.getClientRects()].some(rect => !fits(rect));
      const parent = el.parentElement;
      const overflow = el instanceof HTMLElement && (
        (el.clientWidth > 0 && el.scrollWidth > el.clientWidth) ||
        (el.clientHeight > 0 && el.scrollHeight > el.clientHeight) ||
        (parent.matches(".ui-hud-tab, .ui-hud-reply") && parent.scrollWidth > parent.clientWidth)
      );
      return overflow || outside ? [name(el)] : [];
    });
    const outside = buttons.filter(el => !el.closest(".ui-settings__credits") && !fits(el.getBoundingClientRect())).map(name);
    for (const button of buttons) {
      const slab = button.closest(".ui-settings__slab");
      if (!slab || button.closest(".ui-settings__credits")) continue;
      const r = button.getBoundingClientRect();
      const s = slab.getBoundingClientRect();
      for (const y of [r.top + 12, r.bottom - 12]) {
        for (const x of [r.left + 12, r.right - 12]) {
          if (x > s.right - s.width * 0.22 * (y - s.top) / s.height) outside.push(`${name(button)} crosses slab edge`);
        }
      }
    }
    return { buttons: buttons.length, undersized, clipped, outside, fits: fits(root.getBoundingClientRect()), text: text.length };
  }, target);
  check(`${name}: targets >=${target}px`, result.buttons > 0 && !result.undersized.length,
    result.undersized.join("; ") || `${result.buttons} measured`);
  check(`${name}: text does not clip`, result.text > 0 && !result.clipped.length,
    result.clipped.join("; ") || `${result.text} text elements measured`);
  check(`${name}: stays in bounds`, result.fits && !result.outside.length, result.outside.join("; "));
}

async function ready(page, query = "") {
  await page.goto(`${base}/hud-preview${query}`);
  await page.locator(".ui-game-hud").waitFor({ state: "attached", timeout: 180000 });
  await settle(page);
}

async function openSettings(page) {
  await page.locator(".ui-hud-pause").click();
  const pause = page.locator(`${pauseSelector}[open]`);
  await pause.getByRole("button", { name: "Settings", exact: true }).click();
  const settings = page.locator(`${settingsSelector}[open]`);
  await settings.waitFor();
  return settings;
}

async function unlock(page, settings, key) {
  const gate = settings.getByRole("button", { name: "Hold for 3 seconds" });
  const reset = settings.getByRole("button", { name: "Reset progress" });
  if (key) {
    await gate.focus();
    await page.keyboard.down(key);
    try { await reset.waitFor({ timeout: 7000 }); } finally { await page.keyboard.up(key); }
  } else {
    await gate.hover();
    await page.mouse.down();
    try { await reset.waitFor({ timeout: 7000 }); } finally { await page.mouse.up(); }
  }
}

async function shot(page, name, directory = out) {
  await settle(page);
  await page.screenshot({ path: join(directory, `${name}.png`) });
}

async function checkSelection(page, label, selector, attribute) {
  await settle(page);
  const states = await page.locator(selector).evaluateAll((nodes, attr) => {
    const luminance = color => {
      const channels = color.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [];
      return channels.reduce((sum, value, index) => {
        const s = value / 255;
        return sum + [0.2126, 0.7152, 0.0722][index] * (s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4);
      }, 0);
    };
    return nodes.map(el => ({
      selected: el.getAttribute(attr) === "true",
      fill: luminance(getComputedStyle(el, "::after").backgroundColor),
      check: Boolean(el.querySelector(".ui-settings__check:not([hidden])")),
    }));
  }, attribute);
  const chosen = states.filter(state => state.selected);
  const other = states.filter(state => !state.selected);
  check(`${label}: selected fill has lower luminance`, chosen.length === 1 && other.length > 0 &&
    other.every(state => chosen[0].fill < state.fill));
  check(`${label}: check glyph is only visible on selection`, states.every(state => state.check === state.selected));
}

async function captureGate(page, settings, name) {
  const gate = settings.getByRole("button", { name: "Hold for 3 seconds" });
  const meter = settings.getByRole("progressbar");
  await shot(page, `${name}-locked`);
  await gate.focus();
  const sample = () => meter.evaluate(el => Number(el.getAttribute("aria-valuenow")));
  const inWindow = progress => progress >= 40 && progress <= 60;
  const cdp = await page.context().newCDPSession(page);
  const readings = [];
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      await page.keyboard.down("Space");
      try {
        const reading = await page.waitForFunction(() => {
          const node = document.querySelector(".ui-settings[open] [role=progressbar]");
          const progress = Number(node?.getAttribute("aria-valuenow"));
          return progress >= 40 && progress <= 60 ? progress : false;
        }, null, { timeout: 3000 });
        const before = await reading.jsonValue();
        // Bypass the font and animation settling of page.screenshot during the hold.
        const { data } = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
        const after = await sample();
        readings.push(`${before}–${after}%`);
        if (inWindow(before) && inWindow(after) && await gate.isVisible()) {
          await writeFile(join(out, `${name}.png`), Buffer.from(data, "base64"));
          check(`${name}: mid-hold capture still locked`, true, readings.join("; "));
          return;
        }
      } finally {
        await page.keyboard.up("Space");
      }
    }
    check(`${name}: mid-hold capture still locked`, false, readings.join("; "));
  } finally {
    await cdp.detach();
  }
}

try {
  for (const [size, width, height, target] of [["desktop", 1280, 720, 64], ["mobile", 812, 375, 48]]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
    await page.bringToFront();
    const errors = [];
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", error => errors.push(error.message));
    try {
      await ready(page);
      const originalSizes = await page.evaluate(() => ({
        hud: parseFloat(getComputedStyle(document.querySelector(".ui-hud-zone__name")).fontSize),
        settings: parseFloat(getComputedStyle(document.querySelector(".ui-settings .ui-pause__status-word")).fontSize),
        pause: parseFloat(getComputedStyle(document.querySelector("dialog.ui-pause:not(.ui-settings) .ui-pause__status-word")).fontSize),
      }));

      let settings = await openSettings(page);
      check(`${size}: pause Settings opens native dialog`, await settings.evaluate(el => el.matches(":modal")));
      await measure(page, `${size} Sound`, `${settingsSelector}[open]`, target);
      await checkSelection(page, `${size} Sound tab`, ".ui-settings [role=tab]", "aria-selected");
      await shot(page, `ui-v3-settings-sound-${size}`);
      const volume = settings.getByRole("meter", { name: "Music volume" });
      await settings.getByRole("button", { name: "Music louder" }).click();
      check(`${size}: Music louder increases volume`, await volume.getAttribute("aria-valuenow") === "4");
      await ready(page);
      settings = await openSettings(page);
      check(`${size}: Music survives reload`, await volume.getAttribute("aria-valuenow") === "4");
      await settings.getByRole("tab", { name: "Sound" }).focus();
      await page.keyboard.press("ArrowRight");
      const play = settings.getByRole("tab", { name: "Play" });
      check(`${size}: Right Arrow selects and focuses Play`, await play.evaluate(el =>
        el === document.activeElement && el.getAttribute("aria-selected") === "true" && el.tabIndex === 0));
      await page.keyboard.press("ArrowLeft");
      check(`${size}: Left Arrow selects Sound`, await settings.getByRole("tab", { name: "Sound" }).getAttribute("aria-selected") === "true");
      await play.click();
      await measure(page, `${size} Play`, `${settingsSelector}[open]`, target);
      await checkSelection(page, `${size} Play tab`, ".ui-settings [role=tab]", "aria-selected");
      for (const [index, name] of ["Challenge", "Big text", "Language"].entries()) {
        await checkSelection(page, `${size} ${name}`, `.ui-settings [role=tabpanel]:not([hidden]) .ui-hud-choice__options >> nth=${index} >> button`, "aria-pressed");
      }
      await shot(page, `ui-v3-settings-play-${size}`);
      await settings.getByRole("tab", { name: "Grown-ups" }).click();
      const gate = settings.getByRole("button", { name: "Hold for 3 seconds" });
      const reset = settings.getByRole("button", { name: "Reset progress" });
      await measure(page, `${size} Grown-ups locked`, `${settingsSelector}[open]`, target);
      await checkSelection(page, `${size} Grown-ups tab`, ".ui-settings [role=tab]", "aria-selected");
      await captureGate(page, settings, `ui-v3-settings-gate-${size}`);
      await gate.click();
      check(`${size}: clicking the gate does not unlock`, await gate.isVisible() &&
        !await reset.isVisible() && await settings.getByRole("progressbar").getAttribute("aria-valuenow") === "0");
      await unlock(page, settings, size === "mobile" ? "Space" : undefined);
      check(`${size}: 3-second ${size === "mobile" ? "keyboard" : "pointer"} hold unlocks`, await reset.isVisible());
      await measure(page, `${size} Grown-ups unlocked`, `${settingsSelector}[open]`, target);
      await shot(page, `ui-v3-settings-grownups-${size}`);

      await reset.click();
      const keep = settings.getByRole("button", { name: "Keep my game" });
      check(`${size}: reset opens confirmation focused on Keep my game`, await keep.evaluate(el => el === document.activeElement));
      await measure(page, `${size} reset confirmation`, `${settingsSelector}[open]`, target);
      await page.keyboard.press("Escape");
      check(`${size}: Esc from reset returns to its trigger`, await reset.evaluate(el => el === document.activeElement));
      const credits = settings.getByRole("button", { name: "Credits", exact: true });
      await credits.click();
      const creditScroll = await settings.locator(".ui-settings__credits").evaluate(el =>
        getComputedStyle(el).overflowY === "auto" && el.scrollHeight > el.clientHeight);
      check(`${size}: credits scroll`, creditScroll);
      await measure(page, `${size} credits`, `${settingsSelector}[open]`, target);
      await page.keyboard.press("Escape");
      check(`${size}: Esc from credits returns to its trigger`, await credits.evaluate(el => el === document.activeElement));
      await settings.getByRole("button", { name: "Right", exact: true }).click();

      const playPanel = settings.getByRole("tabpanel", { name: "Play" });
      await play.click();
      await playPanel.getByRole("group", { name: "Big text" }).getByRole("button", { name: "On" }).click();
      await page.keyboard.press("Escape");
      const pause = page.locator(`${pauseSelector}[open]`);
      const settingsItem = pause.getByRole("button", { name: "Settings", exact: true });
      await settings.waitFor({ state: "hidden" });
      check(`${size}: Esc after changing Big text closes only Settings`, await settingsItem.evaluate(el =>
        el === document.activeElement && el.closest("dialog").matches(":modal")));
      await settingsItem.click();
      await settings.waitFor();
      for (const [id, name] of tabs) {
        await settings.getByRole("tab", { name }).click();
        await measure(page, `${size} Big text ${id}`, `${settingsSelector}[open]`, target);
        if (id === "grownups") {
          await captureGate(page, settings, `ui-v3-settings-gate-${size}-big`);
          await unlock(page, settings, "Space");
          await measure(page, `${size} Big text grownups unlocked`, `${settingsSelector}[open]`, target);
        }
        await shot(page, `ui-v3-settings-${id}-${size}-big`);
      }
      const scale = await settings.locator(".ui-pause__status-word").evaluate(el => parseFloat(getComputedStyle(el).fontSize));
      check(`${size}: Settings text scales by 1.25`, Math.abs(scale - originalSizes.settings * 1.25) < 0.02);
      await page.keyboard.press("Escape");
      check(`${size}: Esc restores Settings focus in pause`, await settingsItem.evaluate(el => el === document.activeElement));
      await measure(page, `${size} Big text pause`, `${pauseSelector}[open]`, target);
      const pauseFont = await pause.locator(".ui-pause__status-word").evaluate(el => parseFloat(getComputedStyle(el).fontSize));
      check(`${size}: pause text scales by 1.25`, Math.abs(pauseFont - originalSizes.pause * 1.25) < 0.02);
      await settingsItem.click();
      await settings.getByRole("button", { name: "Back", exact: true }).click();
      check(`${size}: Back restores Settings focus in pause`, await settingsItem.evaluate(el => el === document.activeElement));
      await page.keyboard.press("Escape");
      await pause.waitFor({ state: "hidden" });
      await measure(page, `${size} Big text HUD`, ".ui-game-hud", target);
      await shot(page, `ui-v3-bigtext-hud-${size}`, regressionOut);
      const hudFont = await page.locator(".ui-hud-zone__name").evaluate(el => parseFloat(getComputedStyle(el).fontSize));
      check(`${size}: HUD text scales by 1.25`, Math.abs(hudFont - originalSizes.hud * 1.25) < 0.02);

      await page.locator("#walk").evaluate(button => button.click());
      const right = await page.locator("#joystick:visible").evaluate(el => el.getBoundingClientRect().left > innerWidth / 2);
      await page.locator("#orbit").evaluate(button => button.click());
      settings = await openSettings(page);
      await settings.getByRole("tab", { name: "Grown-ups" }).click();
      await unlock(page, settings, "Space");
      await settings.getByRole("button", { name: "Left", exact: true }).click();
      await page.keyboard.press("Escape");
      await page.keyboard.press("Escape");
      await pause.waitFor({ state: "hidden" });
      await page.locator("#walk").evaluate(button => button.click());
      const left = await page.locator("#joystick:visible").evaluate(el => el.getBoundingClientRect().right < innerWidth / 2);
      check(`${size}: mounted joystick moves both ways`, left && right);

      await ready(page, "?dialogue=long");
      await page.locator(".ui-crew-dialogue").waitFor();
      assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).bigText, settingsKey), true);
      const dialogueFont = await page.locator(".ui-crew-dialogue__line").evaluate(el => {
        const root = document.documentElement;
        const large = parseFloat(getComputedStyle(el).fontSize);
        root.classList.remove("ui-big-text");
        const normal = parseFloat(getComputedStyle(el).fontSize);
        root.classList.add("ui-big-text");
        return { large, normal };
      });
      check(`${size}: dialogue text scales by 1.25`, Math.abs(dialogueFont.large - dialogueFont.normal * 1.25) < 0.02);
      await measure(page, `${size} Big text dialogue page 1`, ".ui-crew-dialogue", target);
      await shot(page, `ui-v3-bigtext-dialogue-${size}`, regressionOut);
      await page.getByRole("button", { name: "Next", exact: true }).click();
      await measure(page, `${size} Big text dialogue replies`, ".ui-crew-dialogue", target);

      await page.emulateMedia({ reducedMotion: "reduce" });
      await ready(page, "?settings=grownups");
      const direct = page.locator(`${settingsSelector}[open]`);
      check(`${size}: direct URL selects Grown-ups`, await direct.getByRole("tab", { name: "Grown-ups" }).getAttribute("aria-selected") === "true");
      const reducedGate = direct.getByRole("button", { name: "Hold for 3 seconds" });
      await reducedGate.focus();
      await page.keyboard.down("Enter");
      try {
        const progress = direct.getByRole("progressbar");
        await page.waitForFunction(() => Number(document.querySelector(".ui-settings [role=progressbar]").getAttribute("aria-valuenow")) >= 33);
        const value = Number(await progress.getAttribute("aria-valuenow"));
        check(`${size}: reduced motion uses discrete hold progress`, value >= 33 && value < 35);
      } finally { await page.keyboard.up("Enter"); }
      await page.keyboard.press("Escape");
      check(`${size}: direct URL also restores Settings focus`, await settingsItem.evaluate(el => el === document.activeElement));

      await ready(page, "?settings=play");
      for (const [label, language, tab] of [["Español", "es", "Jugar"], ["English", "en", "Play"]]) {
        await direct.getByRole("button", { name: label, exact: true }).click();
        await page.waitForFunction(lang => document.documentElement.lang === lang, language);
        const activeTab = direct.getByRole("tab", { name: tab, exact: true });
        await activeTab.waitFor();
        const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).language, settingsKey);
        check(`${size}: ${label} persists, updates document language and reopens Play`,
          saved === language && await activeTab.getAttribute("aria-selected") === "true");
      }
    } catch (error) {
      check(`${size} browser flow`, false, error.stack ?? String(error));
    } finally {
      check(`${size}: no console or page errors`, errors.length === 0, errors.join("\n"));
      await page.close();
    }
  }
} finally {
  await browser.close();
}
