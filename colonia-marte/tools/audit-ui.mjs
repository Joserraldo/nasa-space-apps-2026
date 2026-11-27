import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { AxeBuilder } from "@axe-core/playwright";
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://127.0.0.1:5192";
const output = process.argv[3] ?? "docs/capturas";
const dem = "**/*jezero-elevation*.bin*";
const sizes = [["desktop", 1280, 720, 64], ["mobile", 812, 375, 48]];
const dialogues = ["short", "medium", "long", "labels", "sentence"];
let passed = 0, failed = 0;

function report(label, kind, issues, details = "") {
  if (issues.length) {
    failed++;
    console.error(`FAIL ${label} ${kind}: ${issues.join("; ")}`);
  } else {
    passed++;
    console.log(`PASS ${label} ${kind}${details ? `: ${details}` : ""}`);
  }
}

function measure({ selector, target }) {
  const root = document.querySelector(selector);
  const visible = element => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.visibility === "visible" && !element.closest("[hidden]");
  };
  const box = rect => ({ x: rect.x, y: rect.y, w: rect.width, h: rect.height, right: rect.right, bottom: rect.bottom });
  const midpoint = rect => [rect.x + rect.width / 2, rect.y + rect.height / 2];
  const textParts = element => [...element.childNodes].filter(node =>
    node.nodeType === Node.TEXT_NODE && node.textContent.trim()).flatMap(node => {
    const range = document.createRange();
    range.selectNodeContents(node);
    return [...range.getClientRects()].filter(r => r.width > 0 && r.height > 0);
  });
  const text = [...root.querySelectorAll("*")].filter(visible).flatMap(element => {
    const style = getComputedStyle(element);
    if (element.classList.contains("ui-visually-hidden") ||
        (element.clientWidth <= 1 && element.clientHeight <= 1 && style.clipPath === "inset(50%)")) return [];
    const fragments = textParts(element);
    if (!fragments.length) return [];
    const scrollport = element.closest(".ui-settings__credits");
    if (scrollport) {
      const bounds = scrollport.getBoundingClientRect();
      if (fragments.every(r => r.bottom > bounds.bottom || r.top < bounds.top)) return [];
    }
    const svg = element instanceof SVGElement;
    const label = element.textContent.trim();
    const clipped = !scrollport && !svg && element.clientWidth > 1 && element.clientHeight > 1 &&
      (element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight);
    return [{
      label, clipped, rects: fragments.map(box), color: svg ? style.fill : style.color,
      min: parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && Number(style.fontWeight) >= 700) ? 3 : 4.5,
    }];
  });
  const actions = [...root.querySelectorAll("button, a[href], [role=button]")].filter(visible)
    .filter(el => !el.closest(".ui-settings__credits") || el.getBoundingClientRect().bottom <=
      el.closest(".ui-settings__credits").getBoundingClientRect().bottom + .5);
  const errors = { centering: [], clipping: [], placement: [], targets: [] };
  const labelOf = el => el.getAttribute("aria-label") || el.textContent.trim() || el.className;
  for (const button of actions) {
    const r = button.getBoundingClientRect();
    const name = labelOf(button);
    if (r.width < target - .5 || r.height < target - .5) errors.targets.push(`${name} ${r.width.toFixed(1)}×${r.height.toFixed(1)}`);
    const nodes = [button, ...button.querySelectorAll("*")].filter(visible).flatMap(textParts);
    if (!nodes.length) continue;
    const l = Math.min(...nodes.map(p => p.left)), t = Math.min(...nodes.map(p => p.top));
    const b = Math.max(...nodes.map(p => p.bottom)), right = Math.max(...nodes.map(p => p.right));
    const [x, y] = midpoint(r);
    if (Math.abs((t + b) / 2 - y) > 2) errors.centering.push(`${name} dy ${((t + b) / 2 - y).toFixed(1)}`);
    if (l - r.left < 9.5 || r.right - right < 9.5) errors.centering.push(`${name} padding ${(l - r.left).toFixed(1)}/${(r.right - right).toFixed(1)}`);
    const glyphs = [...button.querySelectorAll(".ui-hud-reply__glyph, .ui-hud-action__glyph, .ui-pause__glyph")].filter(visible)
      .map(el => el.getBoundingClientRect());
    const style = getComputedStyle(button);
    const centred = /flex|grid/.test(style.display) ? style.justifyContent === "center" : style.textAlign === "center";
    if (centred) {
      const leftEdge = Math.min(l, ...glyphs.map(rect => rect.left));
      const rightEdge = Math.max(right, ...glyphs.map(rect => rect.right));
      if (Math.abs((leftEdge + rightEdge) / 2 - x) > 2) errors.centering.push(`${name} dx ${((leftEdge + rightEdge) / 2 - x).toFixed(1)}`);
    }
  }
  errors.clipping.push(...text.filter(item => item.clipped).map(item => item.label));
  const components = [...root.querySelectorAll(".ui-game-hud__slot, .ui-pause__status, .ui-pause__mission, .ui-chapter-card, .ui-loading > .ui-hud-frame")]
    .filter(visible);
  if (root.matches(".ui-crew-dialogue")) components.push(root);
  const gutter = document.createElement("i");
  gutter.style.cssText = "position:absolute;visibility:hidden;inline-size:var(--ui-hud-margin);";
  root.append(gutter);
  const margin = gutter.getBoundingClientRect().width;
  gutter.remove();
  for (const element of [...new Set([...components, ...actions])]) {
    if (element.closest(".ui-settings__credits")) continue;
    const r = element.getBoundingClientRect();
    if (r.left < margin - .5 || r.top < margin - .5 || r.right > innerWidth - margin + .5 || r.bottom > innerHeight - margin + .5) {
      errors.placement.push(`${labelOf(element)} outside ${margin.toFixed(1)}px gutter`);
    }
    if (element.matches(".ui-chapter-card, .ui-loading > .ui-hud-frame")) {
      const [x, y] = midpoint(r);
      if (Math.abs(x - innerWidth / 2) > 4 || Math.abs(y - innerHeight / 2) > 4) errors.placement.push(`${labelOf(element)} not centered`);
    }
  }
  const overlap = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > .5 &&
    Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > .5;
  for (const list of [components, actions]) {
    for (let i = 0; i < list.length; ++i) {
      for (const sibling of list.slice(i + 1)) {
        const element = list[i];
        if (element.contains(sibling) || sibling.contains(element)) continue;
        if (overlap(element.getBoundingClientRect(), sibling.getBoundingClientRect())) {
          errors.placement.push(`${labelOf(element)} overlaps ${labelOf(sibling)}`);
        }
      }
    }
  }
  if (root.matches(".ui-main-menu")) {
    const slab = root.querySelector(".ui-pause__slab").getBoundingClientRect();
    const card = root.querySelector(".ui-pause__mission").getBoundingClientRect();
    const gap = card.x - (slab.right - slab.width * .22 * (card.top - slab.top) / slab.height);
    if (gap < margin - .5) errors.placement.push(`chapter card ${gap.toFixed(1)}px from diagonal`);
  }
  const progress = root.querySelector(".ui-loading__progress");
  if (progress?.matches(":indeterminate")) {
    const segment = progress.nextElementSibling;
    const bar = progress.getBoundingClientRect();
    const marker = segment?.getBoundingClientRect();
    if (!marker || marker.width < 8 || marker.height < 3 || marker.width >= bar.width ||
        getComputedStyle(segment).backgroundColor === getComputedStyle(progress).backgroundColor) errors.placement.push("indeterminate marker not rendered");
  }
  for (const item of text) {
    if (item.rects.some(r => r.x < -.5 || r.y < -.5 || r.right > innerWidth + .5 || r.bottom > innerHeight + .5)) {
      errors.clipping.push(`${item.label} outside viewport`);
    }
  }
  return { errors, text };
}

async function contrast(page, text) {
  const css = await page.addStyleTag({ content: "* { -webkit-text-fill-color: transparent !important; } svg text { fill: transparent !important; }" });
  let png;
  try { png = (await page.screenshot()).toString("base64"); }
  finally { await css.evaluate(style => style.remove()); }
  return await page.evaluate(async ({ png, text }) => {
    const image = new Image();
    image.src = `data:image/png;base64,${png}`;
    await image.decode();
    const canvas = new OffscreenCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, image.width, image.height).data;
    const sx = image.width / innerWidth, sy = image.height / innerHeight;
    const linear = value => {
      const x = value / 255;
      return x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4;
    };
    const light = rgb => linear(rgb[0]) * .2126 + linear(rgb[1]) * .7152 + linear(rgb[2]) * .0722;
    const errors = [];
    let worst = Infinity;
    for (const item of text) {
      const parsed = item.color.match(/[\d.]+/g)?.map(Number);
      if (!item.color.startsWith("rgb") || !parsed || parsed.length < 3) {
        errors.push(`${item.label}: unsupported computed color ${item.color}`);
        continue;
      }
      const samples = [];
      for (const r of item.rects) {
        for (let y = Math.max(0, Math.ceil(r.y * sy)); y < Math.min(image.height, r.bottom * sy); y += 2) {
          for (let x = Math.max(0, Math.ceil(r.x * sx)); x < Math.min(image.width, r.right * sx); x += 2) {
            const offset = (y * image.width + x) * 4;
            const bg = pixels.subarray(offset, offset + 3);
            const opacity = parsed[3] ?? 1;
            const fg = parsed.slice(0, 3).map((v, c) => v * opacity + bg[c] * (1 - opacity));
            const [a, b] = [light(fg), light(bg)].sort((x, y) => x - y);
            samples.push({ luminance: light(bg), ratio: (b + .05) / (a + .05) });
          }
        }
      }
      samples.sort((a, b) => a.luminance - b.luminance);
      const ratio = samples[Math.floor(samples.length / 2)]?.ratio;
      if (ratio === undefined || ratio < item.min) errors.push(`${item.label}: ${ratio?.toFixed(2) ?? "no sample"} < ${item.min}`);
      if (ratio !== undefined) worst = Math.min(worst, ratio);
    }
    return { errors, worst };
  }, { png, text });
}

async function buildFocusCheck(page, selector) {
  const setup = await page.evaluate(selector => {
    const root = document.querySelector(selector);
    const modal = root.closest(":modal");
    const scope = modal ?? document;
    document.activeElement?.blur();
    const all = [...scope.querySelectorAll("button, a[href], [tabindex]")].filter(el => {
      const rect = el.getBoundingClientRect();
      return el.tabIndex >= 0 && !el.matches(":disabled") && rect.width > 0 && rect.height > 0 &&
        getComputedStyle(el).visibility === "visible" && !el.closest("[inert], [hidden]");
    });
    all.forEach((el, i) => { el.dataset.auditFocus = String(i); });
    const during = all.map(el => {
      const computed = getComputedStyle(el);
      return { shadow: computed.boxShadow, outline: computed.outlineStyle, border: computed.borderColor, color: computed.backgroundColor };
    });
    return { during, modal: Boolean(modal), positive: all.some(el => el.tabIndex > 0) };
  }, selector);
  const expected = setup.during.length;
  if (!expected) return [];
  const errors = setup.positive ? ["positive tabindex bypasses visual order"] : [];
  const visited = [];
  let left = false;
  for (let i = 0; i < expected + 3; i++) {
    await page.keyboard.press("Tab");
    const stop = await page.evaluate(() => {
      const el = document.activeElement;
      const s = getComputedStyle(el);
      return { id: el.dataset.auditFocus, label: el.getAttribute("aria-label") || el.textContent.trim().slice(0, 50),
        visible: el.matches(":focus-visible"), outline: s.outlineStyle, width: parseFloat(s.outlineWidth),
        shadow: s.boxShadow, border: s.borderColor, color: s.backgroundColor, browser: el === document.body };
    });
    if (stop.id === undefined) {
      if (stop.browser) left = true;
      else errors.push(`unexpected focus: ${stop.label}`);
      continue;
    }
    const id = Number(stop.id);
    if (visited.includes(id)) break;
    visited.push(id);
    const before = setup.during[id];
    if (!stop.visible || !((stop.outline !== "none" && stop.width > 0) || stop.shadow !== before.shadow ||
      stop.border !== before.border || stop.color !== before.color)) errors.push(`no focus ring on ${stop.label}`);
  }
  if (visited.length !== expected) errors.push(`visited ${visited.length}/${expected} tab stops`);
  for (let i = 1; i < visited.length; i++) {
    if (visited[i] !== (visited[i - 1] + 1) % expected) errors.push(`focus order ${visited.join(",")}`);
  }
  if (!setup.modal && !left) errors.push("focus does not exit the page");
  if (setup.modal) {
    const inside = await page.evaluate(selector => {
      const el = document.activeElement;
      return el === document.body || document.querySelector(selector).closest(":modal").contains(el);
    }, selector);
    if (!inside) errors.push("focus escaped modal");
  }
  return errors;
}

async function audit(page, selector, label, target, shots) {
  await page.locator(selector).waitFor({ timeout: 60_000 });
  await page.mouse.move(2, 2);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => document.getAnimations().filter(a => a instanceof CSSTransition).every(a => a.playState === "finished"));
  const { errors, text } = await page.evaluate(measure, { selector, target });
  for (const [kind, issues] of Object.entries(errors)) report(label, kind, issues);
  const pixels = await contrast(page, text);
  report(label, "real contrast", pixels.errors, `${text.length} labels; lowest ${pixels.worst.toFixed(2)}:1`);
  const { violations, incomplete } = await new AxeBuilder({ page }).analyze();
  report(label, "axe", violations.filter(v => ["critical", "serious"].includes(v.impact))
    .map(v => `${v.impact} ${v.id} (${v.nodes.map(n => n.target.join(" > ")).join(", ")})`),
  `${violations.filter(v => v.impact === "moderate").length} moderate; ${incomplete.length} needs review`);
  for (const v of violations.filter(v => !["critical", "serious"].includes(v.impact))) {
    console.log(`REVIEW ${label} ${v.impact} ${v.id}: ${v.nodes.map(n => n.target.join(" > ")).join(", ")}`);
  }
  shots.push({ label, png: (await page.screenshot()).toString("base64") });
  report(label, "keyboard focus", await buildFocusCheck(page, selector));
}

async function contactSheet(browser, size, shots) {
  const sheet = await browser.newPage();
  try {
    const jpg = await sheet.evaluate(async shots => {
      const columns = 4, width = 320, height = 208;
      const canvas = document.createElement("canvas");
      canvas.width = columns * width;
      canvas.height = Math.ceil(shots.length / columns) * height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#101820";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = "13px sans-serif";
      for (const [i, shot] of shots.entries()) {
        const image = new Image();
        image.src = `data:image/png;base64,${shot.png}`;
        await image.decode();
        const x = i % columns * width, y = Math.floor(i / columns) * height;
        ctx.drawImage(image, x + 4, y + 4, width - 8, (width - 8) * image.height / image.width);
        ctx.fillStyle = "#eef7f9";
        ctx.fillText(shot.label, x + 4, y + height - 8);
      }
      return canvas.toDataURL("image/jpeg", .88).split(",")[1];
    }, shots);
    await writeFile(join(output, `ui-auditoria-${size}.jpg`), Buffer.from(jpg, "base64"));
  } finally { await sheet.close(); }
}

await mkdir(output, { recursive: true });
const language = process.argv[4] ?? "en";
if (!["en", "es"].includes(language)) throw new Error("Expected audit language en or es.");
const labels = language === "es" ?
  { play: "Jugar", adults: "Adultos", hold: "Mantén 3 segundos", reset: "Borrar avance", keep: "Conservar mi juego", credits: "Créditos", newGame: "Nueva partida" } :
  { play: "Play", adults: "Grown-ups", hold: "Hold for 3 seconds", reset: "Reset progress", keep: "Keep my game", credits: "Credits", newGame: "New game" };
console.log(`UI language: ${language}`);
const browser = await chromium.launch({ headless: false, args: ["--use-angle=d3d11", "--ignore-gpu-blocklist"] });
try {
  for (const [size, width, height, target] of sizes) {
    const shots = [];
    for (const bigText of language === "es" ? [true] : [false, true]) {
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
      const page = await context.newPage();
      const prefix = `${size}/${bigText ? "big" : "normal"}`;
      try {
        await page.addInitScript(({ bigText, language }) => {
          if (!sessionStorage.getItem("ui-audit-initialized")) {
            localStorage.setItem("colonia.settings.v1", JSON.stringify({ bigText, language }));
            sessionStorage.setItem("ui-audit-initialized", "1");
          }
        }, { bigText, language });
        await page.bringToFront();
        const go = route => page.goto(base + route, { waitUntil: "commit" });
        const run = (selector, label) => audit(page, selector, `${prefix}/${label}`, target, shots);
        await go("/hud-preview");
        await run(".ui-game-hud", "hud");
        await page.locator(".ui-hud-pause").click();
        await run("dialog.ui-pause[open]", "pause");
        for (const sample of dialogues) {
          await go(`/hud-preview?dialogue=${sample}`);
          for (let index = 1; ; index++) {
            await run(".ui-crew-dialogue", `dialogue-${sample}-${index}`);
            const next = page.locator(".ui-crew-dialogue__next:not([hidden])");
            if (!await next.isVisible()) break;
            await next.click();
          }
        }
        await go("/hud-preview?settings=sound");
        await run("dialog.ui-settings[open]", "settings-sound");
        await page.getByRole("tab", { name: labels.play, exact: true }).click();
        await run("dialog.ui-settings[open]", "settings-play");
        await page.getByRole("tab", { name: labels.adults, exact: true }).click();
        await run("dialog.ui-settings[open]", "settings-gate");
        await page.getByRole("button", { name: labels.hold }).focus();
        await page.keyboard.down("Space");
        await page.getByRole("button", { name: labels.reset, exact: true }).waitFor();
        await page.keyboard.up("Space");
        await run("dialog.ui-settings[open]", "settings-grownups");
        await page.getByRole("button", { name: labels.reset, exact: true }).click();
        await run("dialog.ui-settings[open]", "settings-confirm");
        await page.getByRole("button", { name: labels.keep }).click();
        await page.getByRole("button", { name: labels.credits, exact: true }).click();
        await run("dialog.ui-settings[open]", "settings-credits");
        let release;
        const gate = new Promise(resolve => { release = resolve; });
        await page.route(dem, async route => { await gate; await route.continue(); });
        try {
          await go("/menu?clean=1");
          await run(".ui-loading", "loading");
        } finally { release(); }
        await run("dialog.ui-main-menu[open]", "menu-new");
        await page.unrouteAll({ behavior: "wait" });
        await page.getByRole("button", { name: labels.newGame }).click();
        await run(".ui-chapter-stage[open] > .ui-chapter-card", "chapter-start");
        const startWidth = await page.locator(".ui-chapter-card").evaluate(el => el.getBoundingClientRect().width);
        await page.evaluate(() => localStorage.setItem("colonia.progress.chapter", "C2"));
        await go("/menu?clean=1");
        await run("dialog.ui-main-menu[open]", "menu-saved");
        await go("/menu?clean=1&chapter-card=complete&chapter=C2");
        await run(".ui-chapter-stage[open] > .ui-chapter-card", "chapter-complete");
        const completeWidth = await page.locator(".ui-chapter-card").evaluate(el => el.getBoundingClientRect().width);
        report(prefix, "same chapter width", Math.abs(startWidth - completeWidth) <= .5 ? [] : [`${startWidth}/${completeWidth}px`]);
      } catch (error) {
        report(prefix, "browser flow", [error.message]);
      } finally {
        await context.close();
      }
    }
    if (shots.length) await contactSheet(browser, size, shots);
  }
} finally { await browser.close(); }

console.log(`${passed} PASS / ${failed} FAIL`);
process.exitCode = failed ? 1 : 0;
