import type { UIRegistry } from "../registry";
import { asRecord, pickBoolean, pickEnum, pickNumber, pickString } from "../types";

/**
 * HUD atoms (UI v3). Language from the Polar Sci-Fi Facility HUD (thin double lines, corner
 * anchoring, one accent) and the Sci-Fi UI Kit (chamfers, crosshairs, ruler ticks).
 * Every atom is presentational: no game state, all data through params.
 */

const svg = (body: string, viewBox = "0 0 24 24") =>
  `<svg viewBox="${viewBox}" aria-hidden="true" focusable="false">${body}</svg>`;

export const HUD_GLYPHS = {
  canteen: svg('<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M16 3c-2 1.5-2.5 4-2.5 7h2.5v11"/>'),
  objective: svg('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.2"/><path d="M12 1.5v4M12 18.5v4M1.5 12h4M18.5 12h4"/>'),
  battery: svg('<rect x="3" y="7" width="16" height="10" rx="1"/><path d="M21 10.5v3M7 10v4M10.5 10v4M14 10v4"/>'),
  air: svg('<circle cx="9" cy="14" r="5"/><circle cx="16.5" cy="7.5" r="3"/><circle cx="18.5" cy="16" r="1.6"/>'),
  shield: svg('<path d="M12 2.5 20 6v6c0 4.6-3.3 8.2-8 9.5C7.3 20.2 4 16.6 4 12V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>'),
  iris: svg('<rect x="4" y="4" width="16" height="11" rx="2"/><path d="M8.5 9.5h1M14.5 9.5h1M9.5 12c1.5 1 3.5 1 5 0M7 15v3M17 15v3M4.5 20.5h15"/>'),
  tap: svg('<circle cx="12" cy="9" r="3.4"/><path d="M12 12.4V21M8 17l4 4 4-4"/>'),
  map: svg('<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>'),
  play: svg('<path d="M7 4.5v15l12-7.5z"/>'),
  pause: svg('<path d="M8 5v14M16 5v14"/>'),
  gear: svg('<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>'),
  next: svg('<path d="M5 12h13M13 6l6 6-6 6"/>'),
  wrench: svg('<path d="M14.5 6.5a4.5 4.5 0 0 0 5.6 5.6l-2.4-2.4.5-2.6 2.6-.5-2.4-2.4a4.5 4.5 0 0 0-5.6 5.6L4.6 17.9a1.9 1.9 0 0 0 2.7 2.7l8.1-8.1"/>'),
  soup: svg('<path d="M3 12h18a9 9 0 0 1-18 0zM8 20.5h8"/><path d="M8 3.5c1 1-1 2 0 3M12 3.5c1 1-1 2 0 3M16 3.5c1 1-1 2 0 3"/>'),
  robot: svg('<rect x="5" y="7.5" width="14" height="11" rx="2.5"/><path d="M12 7.5V4.5M3 12v3M21 12v3"/><circle cx="12" cy="3.5" r="1"/><circle cx="9.5" cy="12" r="1"/><circle cx="14.5" cy="12" r="1"/><path d="M9.8 15.2c1.3.9 3.1.9 4.4 0"/>'),
  home: svg('<path d="M3.5 11 12 4l8.5 7M6 9.5V20h12V9.5M10 20v-5h4v5"/>'),
  music: svg('<path d="M9 17V5l11-2v12M9 8l11-2"/><ellipse cx="6" cy="17" rx="3" ry="2.5"/><ellipse cx="17" cy="15" rx="3" ry="2.5"/>'),
  voice: svg('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11v1a6 6 0 0 0 12 0v-1M12 18v3M9 21h6"/>'),
  sound: svg('<path d="M4 9h4l5-4v14l-5-4H4zM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/>'),
  text: svg('<path d="m3 19 6-14 6 14M5 15h8M16 12h5M18.5 12v7"/>'),
  minus: svg('<path d="M5 12h14"/>'),
  plus: svg('<path d="M5 12h14M12 5v14"/>'),
  back: svg('<path d="M19 12H5m6-6-6 6 6 6"/>'),
} as const;
export type UIHudGlyph = keyof typeof HUD_GLYPHS;
const GLYPHS = Object.keys(HUD_GLYPHS) as UIHudGlyph[];

function node<K extends keyof HTMLElementTagNameMap>(tag: K, className: string): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  element.className = className;
  return element;
}

/** Text with a narration hook (R1). The voice line defaults to the visible text. */
export function voiceText<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text: string, voiceLine = text) {
  const element = node(tag, className);
  element.textContent = text;
  element.dataset.voiceLine = voiceLine;
  return element;
}

export function createHudGlyph(name: UIHudGlyph, className = "ui-hud-glyph") {
  const element = node("span", className);
  element.innerHTML = HUD_GLYPHS[name];
  return element;
}

// --- Frame ----------------------------------------------------------------------------------
export const FRAME_CORNERS = ["top-left", "top-right", "bottom-right", "octagon", "none"] as const;
export interface UIHudFrameParams {
  corner: (typeof FRAME_CORNERS)[number]; double: boolean; accentEdge: boolean;
  /** Restrained detailing from the HUD frame reference: side tabs, offset bracket and a ruler strip. */
  detail: boolean;
}
export function parseHudFrameParams(input: unknown): UIHudFrameParams {
  const rec = asRecord(input);
  return {
    corner: pickEnum(rec.corner, FRAME_CORNERS, "top-left", "corner"),
    double: pickBoolean(rec.double, true, "double"),
    accentEdge: pickBoolean(rec.accentEdge, false, "accentEdge"),
    detail: pickBoolean(rec.detail, true, "detail"),
  };
}
/**
 * Panel with a continuous outline that follows the chamfer: the stroke is a clipped layer behind a
 * clipped fill (a CSS border would be cut off by clip-path on the diagonal). Optional hairline inset.
 */
export function createHudFrame(params: Partial<UIHudFrameParams> = {}): HTMLElement {
  const parsed = parseHudFrameParams(params);
  const frame = node("div", `ui-hud-frame ui-hud-frame--${parsed.corner}`);
  if (parsed.accentEdge) frame.classList.add("ui-hud-frame--accent");
  frame.append(node("span", "ui-hud-frame__stroke"), node("span", "ui-hud-frame__fill"));
  if (parsed.double) frame.append(node("span", "ui-hud-frame__inset"));
  if (parsed.detail) {
    frame.classList.add("ui-hud-frame--detail");
    frame.append(node("span", "ui-hud-frame__bracket"), node("span", "ui-hud-frame__tabs"), node("span", "ui-hud-frame__ruler"));
  }
  const content = node("div", "ui-hud-frame__content");
  frame.append(content);
  return frame;
}
export const hudFrameContent = (frame: HTMLElement) => frame.querySelector<HTMLElement>(".ui-hud-frame__content")!;

// --- Tab ------------------------------------------------------------------------------------
export interface UIHudTabParams { label: string; glyph: UIHudGlyph | "none" }
export function parseHudTabParams(input: unknown): UIHudTabParams {
  const rec = asRecord(input);
  return {
    label: pickString(rec.label, "Objective", "label"),
    glyph: pickEnum(rec.glyph, [...GLYPHS, "none"] as const, "none", "glyph"),
  };
}
export function createHudTab(params: Partial<UIHudTabParams> = {}): HTMLElement {
  const parsed = parseHudTabParams(params);
  const tab = node("header", "ui-hud-tab");
  if (parsed.glyph !== "none") tab.append(createHudGlyph(parsed.glyph, "ui-hud-tab__glyph"));
  tab.append(voiceText("span", "ui-hud-tab__label", parsed.label));
  tab.append(node("span", "ui-hud-tab__rule"));
  return tab;
}

// --- Hex badge ------------------------------------------------------------------------------
export interface UIHudHexParams { glyph: UIHudGlyph; size: "Medium" | "Large" }
export function parseHudHexParams(input: unknown): UIHudHexParams {
  const rec = asRecord(input);
  return {
    glyph: pickEnum(rec.glyph, GLYPHS, "canteen", "glyph"),
    size: pickEnum(rec.size, ["Medium", "Large"] as const, "Large", "size"),
  };
}
export function createHudHex(params: Partial<UIHudHexParams> = {}): HTMLElement {
  const parsed = parseHudHexParams(params);
  const hex = node("span", `ui-hud-hex ui-hud-hex--${parsed.size.toLowerCase()}`);
  hex.innerHTML = svg('<path class="ui-hud-hex__shape" d="M27 3 49 15.5v25L27 53 5 40.5v-25z"/>', "0 0 54 56");
  hex.append(createHudGlyph(parsed.glyph, "ui-hud-hex__glyph"));
  return hex;
}

// --- Segmented meter ------------------------------------------------------------------------
export interface UIHudMeterParams { level: number; cells: number; tone: "Accent" | "Ink" | "Warning" }
export function parseHudMeterParams(input: unknown): UIHudMeterParams {
  const rec = asRecord(input);
  return {
    level: pickNumber(rec.level, 0.6, "level", 0, 1),
    cells: pickNumber(rec.cells, 8, "cells", 3, 16),
    tone: pickEnum(rec.tone, ["Accent", "Ink", "Warning"] as const, "Accent", "tone"),
  };
}
/** Resource as an object (R2): slanted cells, no number. */
export function createHudMeter(params: Partial<UIHudMeterParams> = {}): HTMLElement {
  const parsed = parseHudMeterParams(params);
  const meter = node("span", `ui-hud-meter ui-hud-meter--${parsed.tone.toLowerCase()}`);
  meter.style.setProperty("--cells", String(parsed.cells));
  const lit = Math.round(parsed.level * parsed.cells);
  for (let i = 0; i < parsed.cells; i++) meter.append(node("i", i < lit ? "is-on" : ""));
  return meter;
}

// --- Ring -----------------------------------------------------------------------------------
export interface UIHudRingParams { level: number; glyph: UIHudGlyph }
export function parseHudRingParams(input: unknown): UIHudRingParams {
  const rec = asRecord(input);
  return { level: pickNumber(rec.level, 0.72, "level", 0, 1), glyph: pickEnum(rec.glyph, GLYPHS, "iris", "glyph") };
}
export function createHudRing(params: Partial<UIHudRingParams> = {}): HTMLElement {
  const parsed = parseHudRingParams(params);
  const ring = node("span", "ui-hud-ring");
  const arc = (r: number, from: number, to: number) => {
    const p = (deg: number) => { const a = (deg - 90) * Math.PI / 180; return `${(60 + r * Math.cos(a)).toFixed(2)} ${(60 + r * Math.sin(a)).toFixed(2)}`; };
    return `M${p(from)}A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${p(to)}`;
  };
  // Broken outer arcs + fine tick band + level arc + core, as in the reference gauge.
  const outer = [[-60, 20], [32, 112], [124, 204], [216, 290]].map(([a, b]) => `<path class="ui-hud-ring__outer" d="${arc(56, a, b)}"/>`).join("");
  const ticks = Array.from({ length: 48 }, (_, i) => {
    const t = (i / 48) * Math.PI * 2, r1 = 49, r2 = i % 4 === 0 ? 45 : 47;
    return `<line x1="${(60 + Math.sin(t) * r1).toFixed(2)}" y1="${(60 - Math.cos(t) * r1).toFixed(2)}" x2="${(60 + Math.sin(t) * r2).toFixed(2)}" y2="${(60 - Math.cos(t) * r2).toFixed(2)}"/>`;
  }).join("");
  ring.innerHTML = svg(`${outer}<g class="ui-hud-ring__ticks">${ticks}</g>
    <circle class="ui-hud-ring__track" cx="60" cy="60" r="40"/>
    <path class="ui-hud-ring__arc" d="${arc(40, 0, Math.max(1, parsed.level * 359.9))}"/>
    <circle class="ui-hud-ring__core" cx="60" cy="60" r="32"/>`, "0 0 120 120");
  ring.append(createHudGlyph(parsed.glyph, "ui-hud-ring__glyph"));
  return ring;
}

// --- Reticle --------------------------------------------------------------------------------
export function createHudReticle(): HTMLElement {
  const reticle = node("span", "ui-hud-reticle");
  reticle.innerHTML = svg(`<circle class="outer" cx="32" cy="32" r="27"/><circle class="inner" cx="32" cy="32" r="19"/>
    <path class="ticks" d="M32 1v8M32 55v8M1 32h8M55 32h8"/><circle class="dot" cx="32" cy="32" r="4"/>`, "0 0 64 64");
  return reticle;
}

// --- Action button (tap target >= 64px) -----------------------------------------------------
export interface UIHudActionParams { label: string; glyph: UIHudGlyph; voiceLine: string }
export function parseHudActionParams(input: unknown): UIHudActionParams {
  const rec = asRecord(input);
  const label = pickString(rec.label, "Tap to use", "label");
  return { label, glyph: pickEnum(rec.glyph, GLYPHS, "tap", "glyph"), voiceLine: pickString(rec.voiceLine, label, "voiceLine") };
}
export function createHudAction(params: Partial<UIHudActionParams> = {}): HTMLButtonElement {
  const parsed = parseHudActionParams(params);
  const button = node("button", "ui-hud-action");
  button.type = "button";
  button.dataset.voiceLine = parsed.voiceLine;
  button.append(createHudGlyph(parsed.glyph, "ui-hud-action__glyph"), voiceText("span", "ui-hud-action__label", parsed.label, parsed.voiceLine));
  return button;
}

export function registerHudAtoms(registry: UIRegistry): void {
  const meta = (name: string, description: string) => ({ layer: "atom" as const, name, figmaNodeId: "1:12", description });
  registry.register<UIHudFrameParams>("UI-ATOM-HUD-FRAME", {
    metadata: meta("HUD frame", "Chamfered dark panel with continuous outline and hairline inset."),
    variants: { "Top-left chamfer": { corner: "top-left", double: true, accentEdge: false, detail: true },
      "Top-right accent": { corner: "top-right", double: true, accentEdge: true, detail: false } },
    parse: parseHudFrameParams,
    render: params => { const f = createHudFrame(params); f.style.cssText = "position:relative;width:260px;height:110px"; return f; },
  });
  registry.register("UI-ATOM-HUD-TAB", {
    metadata: meta("HUD tab", "Title tab with glyph and trailing rule."),
    variants: { Objective: { label: "Objective", glyph: "objective" }, Plain: { label: "Habitat deck 1", glyph: "none" } } as const,
    parse: parseHudTabParams, render: createHudTab,
  });
  registry.register("UI-ATOM-HUD-HEX", {
    metadata: meta("HUD hex badge", "Hexagonal zone badge with glyph."),
    variants: { Canteen: { glyph: "canteen", size: "Large" }, Map: { glyph: "map", size: "Medium" } } as const,
    parse: parseHudHexParams, render: createHudHex,
  });
  registry.register("UI-ATOM-HUD-METER", {
    metadata: meta("HUD meter", "Segmented slanted meter without numbers (R2)."),
    variants: { Power: { level: 0.75, cells: 8, tone: "Accent" }, Shield: { level: 0.5, cells: 8, tone: "Ink" },
      Low: { level: 0.25, cells: 8, tone: "Warning" } } as const,
    parse: parseHudMeterParams, render: createHudMeter,
  });
  registry.register("UI-ATOM-HUD-RING", {
    metadata: meta("HUD ring", "Companion ring with ticks and level arc."),
    variants: { Iris: { level: 0.72, glyph: "iris" } } as const,
    parse: parseHudRingParams, render: createHudRing,
  });
  registry.register("UI-ATOM-HUD-RETICLE", {
    metadata: meta("HUD reticle", "Diegetic target reticle."),
    variants: { Default: {} } as const, parse: () => ({}), render: () => createHudReticle(),
  });
  registry.register("UI-ATOM-HUD-ACTION", {
    metadata: meta("HUD action", "Large chamfered action button, 64px target."),
    variants: { Use: { label: "Tap to use", glyph: "tap", voiceLine: "Tap to use" } } as const,
    parse: parseHudActionParams, render: createHudAction,
  });
}
