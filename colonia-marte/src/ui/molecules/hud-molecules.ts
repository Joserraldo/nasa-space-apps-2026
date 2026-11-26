import {
  createHudAction, createHudFrame, createHudGlyph, createHudHex, createHudMeter, createHudReticle, createHudRing,
  createHudTab, hudFrameContent, voiceText, type UIHudGlyph,
} from "../atoms/hud-atoms";
import type { UIRegistry } from "../registry";
import { asRecord, pickEnum, pickNumber, pickString } from "../types";

/** HUD molecules (UI v3): compositions of HUD atoms only. Presentational; data through params. */

// --- Objective card (R3) --------------------------------------------------------------------
export interface UIHudObjectiveParams { title: string; step: string; voiceLine: string }
export function parseHudObjectiveParams(input: unknown): UIHudObjectiveParams {
  const rec = asRecord(input);
  const title = pickString(rec.title, "Get lunch for the crew", "title");
  return { title, step: pickString(rec.step, "Step 1 of 3", "step"), voiceLine: pickString(rec.voiceLine, title, "voiceLine") };
}
export function createHudObjective(params: Partial<UIHudObjectiveParams> = {}): HTMLElement {
  const parsed = parseHudObjectiveParams(params);
  const frame = createHudFrame({ corner: "top-left", double: true, accentEdge: true });
  frame.classList.add("ui-hud-objective");
  frame.setAttribute("aria-label", "Objective");
  const body = document.createElement("div");
  body.className = "ui-hud-objective__body";
  body.append(voiceText("p", "ui-hud-objective__title", parsed.title, parsed.voiceLine), voiceText("p", "ui-hud-objective__step", parsed.step));
  hudFrameContent(frame).append(createHudTab({ label: "Objective", glyph: "objective" }), body);
  return frame;
}

// --- Resource row ---------------------------------------------------------------------------
const RESOURCE_GLYPHS = ["battery", "air", "shield"] as const;
export interface UIHudResourceParams { glyph: (typeof RESOURCE_GLYPHS)[number]; label: string; level: number; tone: "Accent" | "Ink" | "Warning" }
export function parseHudResourceParams(input: unknown): UIHudResourceParams {
  const rec = asRecord(input);
  return {
    glyph: pickEnum(rec.glyph, RESOURCE_GLYPHS, "battery", "glyph"),
    label: pickString(rec.label, "Power", "label"),
    level: pickNumber(rec.level, 0.75, "level", 0, 1),
    tone: pickEnum(rec.tone, ["Accent", "Ink", "Warning"] as const, "Accent", "tone"),
  };
}
export function createHudResource(params: Partial<UIHudResourceParams> = {}): HTMLElement {
  const parsed = parseHudResourceParams(params);
  const row = document.createElement("div");
  row.className = "ui-hud-resource";
  row.setAttribute("role", "meter");
  row.setAttribute("aria-label", parsed.label);
  row.setAttribute("aria-valuemin", "0");
  row.setAttribute("aria-valuemax", "100");
  row.setAttribute("aria-valuenow", String(Math.round(parsed.level * 100)));
  const tone = parsed.level <= 0.25 ? "Warning" : parsed.tone;
  row.append(createHudGlyph(parsed.glyph, "ui-hud-resource__glyph"), voiceText("span", "ui-hud-resource__label", parsed.label),
    createHudMeter({ level: parsed.level, cells: 8, tone }));
  return row;
}

// --- Companion status (ring + resources) ----------------------------------------------------
export interface UIHudStatusParams { name: string; role: string; ringLevel: number; resources: UIHudResourceParams[] }
export function parseHudStatusParams(input: unknown): UIHudStatusParams {
  const rec = asRecord(input);
  const resources = Array.isArray(rec.resources) ? rec.resources.map(parseHudResourceParams) : [
    parseHudResourceParams({ glyph: "battery", label: "Power", level: 0.75 }),
    parseHudResourceParams({ glyph: "air", label: "Air", level: 0.9 }),
    parseHudResourceParams({ glyph: "shield", label: "Shield", level: 0.5, tone: "Ink" }),
  ];
  return { name: pickString(rec.name, "Iris", "name"), role: pickString(rec.role, "Your companion", "role"),
    ringLevel: pickNumber(rec.ringLevel, 0.72, "ringLevel", 0, 1), resources };
}
export function createHudStatus(params: Partial<UIHudStatusParams> = {}): HTMLElement {
  const parsed = parseHudStatusParams(params);
  // Companion gauge lives inside the card (left column), never overlapping the frame.
  const frame = createHudFrame({ corner: "top-right", double: true });
  frame.classList.add("ui-hud-status");
  frame.setAttribute("aria-label", `${parsed.name} status`);
  const gauge = document.createElement("div");
  gauge.className = "ui-hud-status__gauge";
  gauge.append(createHudRing({ level: parsed.ringLevel, glyph: "iris" }), voiceText("strong", "ui-hud-status__name", parsed.name),
    voiceText("span", "ui-hud-status__role", parsed.role));
  const meters = document.createElement("div");
  meters.className = "ui-hud-status__meters";
  meters.append(...parsed.resources.map(createHudResource));
  hudFrameContent(frame).append(gauge, meters);
  return frame;
}

// --- Zone label (T7.5) ----------------------------------------------------------------------
export interface UIHudZoneParams { name: string; deck: string; glyph: UIHudGlyph; voiceLine: string }
export function parseHudZoneParams(input: unknown): UIHudZoneParams {
  const rec = asRecord(input);
  const name = pickString(rec.name, "Canteen", "name");
  return { name, deck: pickString(rec.deck, "Habitat deck 1", "deck"),
    glyph: pickEnum(rec.glyph, ["canteen", "map", "objective", "iris"] as const, "canteen", "glyph"),
    voiceLine: pickString(rec.voiceLine, `You are in the ${name.toLowerCase()}.`, "voiceLine") };
}
export function createHudZone(params: Partial<UIHudZoneParams> = {}): HTMLElement {
  const parsed = parseHudZoneParams(params);
  const frame = createHudFrame({ corner: "top-right", double: false });
  frame.classList.add("ui-hud-zone");
  frame.setAttribute("aria-label", "Current zone");
  const text = document.createElement("div");
  text.className = "ui-hud-zone__text";
  text.append(voiceText("strong", "ui-hud-zone__name", parsed.name, parsed.voiceLine), voiceText("span", "ui-hud-zone__deck", parsed.deck));
  const bar = document.createElement("span");
  bar.className = "ui-hud-zone__bar";
  hudFrameContent(frame).append(createHudHex({ glyph: parsed.glyph, size: "Large" }), text, bar);
  return frame;
}

// --- Minimap card ---------------------------------------------------------------------------
export interface UIHudMinimapParams { label: string; heading: number }
export function parseHudMinimapParams(input: unknown): UIHudMinimapParams {
  const rec = asRecord(input);
  return { label: pickString(rec.label, "Habitat deck 1", "label"), heading: pickNumber(rec.heading, 0, "heading", -360, 360) };
}
export function createHudMinimap(params: Partial<UIHudMinimapParams> = {}): HTMLElement {
  const parsed = parseHudMinimapParams(params);
  const frame = createHudFrame({ corner: "top-left", double: true });
  frame.classList.add("ui-hud-minimap");
  frame.setAttribute("aria-label", "Map");
  const view = document.createElement("div");
  view.className = "ui-hud-minimap__view";
  // Radar read (reference: HUD frame kit radar): rings and crosshair centred on the player, soft sweep,
  // rooms drawn on top. No dot grid.
  view.innerHTML = `<svg viewBox="0 0 120 100" aria-hidden="true" focusable="false">
    <g class="radar">
      <circle cx="52" cy="50" r="16"/><circle cx="52" cy="50" r="32"/><circle cx="52" cy="50" r="48"/>
      <path d="M52 0v100M0 50h120"/>
      <path class="radar__ticks" d="M52 2v4M52 94v4M4 50h4M100 50h4"/>
    </g>
    <path class="sweep" d="M52 50 L52 2 A48 48 0 0 1 86 16 Z"/>
    <rect class="room room--current" x="16" y="18" width="70" height="42"/>
    <rect class="room" x="86" y="26" width="22" height="26"/>
    <rect class="room" x="40" y="60" width="22" height="26"/>
    <path class="door" d="M86 34v10M46 60h10"/>
    <circle class="target" cx="48" cy="24" r="3.4"/><circle class="target-ring" cx="48" cy="24" r="6.5"/>
    <g transform="rotate(${parsed.heading} 52 50)"><path class="cone" d="M52 50 40 30h24z"/><path class="player" d="M52 44l-5 10 5-2.6 5 2.6z"/></g>
    <text class="north" x="112" y="12">N</text></svg>`;
  hudFrameContent(frame).append(createHudTab({ label: parsed.label, glyph: "map" }), view);
  for (const corner of ["tl", "br"]) {
    const cross = document.createElement("span");
    cross.className = `ui-hud-cross ui-hud-cross--${corner}`;
    frame.append(cross);
  }
  return frame;
}

// --- Diegetic interaction prompt ------------------------------------------------------------
export interface UIHudInteractionParams { target: string; action: string; voiceLine: string }
export function parseHudInteractionParams(input: unknown): UIHudInteractionParams {
  const rec = asRecord(input);
  const action = pickString(rec.action, "Tap to use", "action");
  return { target: pickString(rec.target, "Salad dispenser", "target"), action,
    voiceLine: pickString(rec.voiceLine, action, "voiceLine") };
}
export type HudPromptSide = "right" | "left" | "below";
export function createHudInteraction(params: Partial<UIHudInteractionParams> = {}) {
  const parsed = parseHudInteractionParams(params);
  const root = document.createElement("div");
  root.className = "ui-hud-interaction";
  root.dataset.side = "right";
  const leader = document.createElement("span");
  leader.className = "ui-hud-interaction__leader";
  const card = document.createElement("div");
  card.className = "ui-hud-interaction__card";
  const button = createHudAction({ label: parsed.action, glyph: "tap", voiceLine: parsed.voiceLine });
  card.append(voiceText("span", "ui-hud-interaction__target", parsed.target), button);
  root.append(createHudReticle(), leader, card);
  return {
    root, button,
    /** Anchor in CSS px inside the HUD layer, or null when the object is off screen. */
    place(point: { x: number; y: number } | null, side: HudPromptSide) {
      root.hidden = point === null;
      if (!point) return;
      root.style.translate = `${point.x}px ${point.y}px`;
      root.dataset.side = side;
    },
  };
}

export function registerHudMolecules(registry: UIRegistry): void {
  const meta = (name: string, description: string) => ({ layer: "molecule" as const, name, figmaNodeId: "1:12", description });
  const showcase = (element: HTMLElement, width: number) => { element.style.cssText = `position:relative;width:${width}px`; return element; };
  registry.register("UI-MOLECULE-HUD-OBJECTIVE", {
    metadata: meta("HUD objective", "Objective card: tab, sentence and step (R3)."),
    variants: { Lunch: { title: "Get lunch for the crew", step: "Step 1 of 3", voiceLine: "Your goal: get lunch for the crew." } } as const,
    parse: parseHudObjectiveParams, render: p => showcase(createHudObjective(p), 400),
  });
  registry.register("UI-MOLECULE-HUD-RESOURCE", {
    metadata: meta("HUD resource", "Glyph, label and segmented meter (R2)."),
    variants: { Power: { glyph: "battery", label: "Power", level: 0.75, tone: "Accent" },
      "Air low": { glyph: "air", label: "Air", level: 0.2, tone: "Accent" } } as const,
    parse: parseHudResourceParams, render: createHudResource,
  });
  registry.register("UI-MOLECULE-HUD-STATUS", {
    metadata: meta("HUD status", "Companion ring with resource meters."),
    variants: { Iris: parseHudStatusParams({}) }, parse: parseHudStatusParams, render: p => showcase(createHudStatus(p), 420),
  });
  registry.register("UI-MOLECULE-HUD-ZONE", {
    metadata: meta("HUD zone label", "Zone plate with hex badge (T7.5)."),
    variants: { Canteen: { name: "Canteen", deck: "Habitat deck 1", glyph: "canteen", voiceLine: "You are in the canteen." } } as const,
    parse: parseHudZoneParams, render: p => showcase(createHudZone(p), 340),
  });
  registry.register("UI-MOLECULE-HUD-MINIMAP", {
    metadata: meta("HUD minimap", "Double-frame map with crosshair corners."),
    variants: { Deck: { label: "Habitat deck 1", heading: 0 } } as const,
    parse: parseHudMinimapParams, render: p => showcase(createHudMinimap(p), 230),
  });
  registry.register("UI-MOLECULE-HUD-INTERACTION", {
    metadata: meta("HUD interaction", "Diegetic reticle, leader line and action."),
    variants: { Dispenser: { target: "Salad dispenser", action: "Tap to use", voiceLine: "Tap the dispenser." } } as const,
    parse: parseHudInteractionParams,
    render: p => { const i = createHudInteraction(p); const box = document.createElement("div");
      box.style.cssText = "position:relative;width:360px;height:200px"; i.place({ x: 40, y: 150 }, "right"); box.append(i.root); return box; },
  });
}
