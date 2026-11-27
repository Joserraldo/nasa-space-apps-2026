import {
  createHudAction, createHudFrame, createHudGlyph, createHudHex, createHudMeter, createHudReticle, createHudRing,
  createHudTab, hudFrameContent, updateVoiceText, voiceText, type UIHudGlyph,
} from "../atoms/hud-atoms";
import type { UIRegistry } from "../registry";
import { uiText, type UIStrings } from "../i18n";
import { asRecord, pickEnum, pickNumber, pickString } from "../types";

export interface UIHudObjectiveParams { title: string; step: string; voiceLine: string }
export function parseHudObjectiveParams(input: unknown): UIHudObjectiveParams {
  const rec = asRecord(input);
  const title = pickString(rec.title, "Get lunch for the crew", "title");
  return { title, step: pickString(rec.step, "Step 1 of 3", "step"), voiceLine: pickString(rec.voiceLine, title, "voiceLine") };
}
export function createHudObjective(params: Partial<UIHudObjectiveParams> = {}, strings?: UIStrings) {
  let current = params;
  const parsed = parseHudObjectiveParams(current);
  const frame = createHudFrame({ corner: "top-left", double: true, accentEdge: true });
  frame.classList.add("ui-hud-objective");
  const label = uiText(strings)("componente.hud.objetivo");
  frame.setAttribute("aria-label", label);
  const body = document.createElement("div");
  body.className = "ui-hud-objective__body";
  const title = voiceText("p", "ui-hud-objective__title", parsed.title, parsed.voiceLine);
  const step = voiceText("p", "ui-hud-objective__step", parsed.step);
  title.setAttribute("aria-live", "polite");
  step.setAttribute("aria-live", "polite");
  body.append(title, step);
  hudFrameContent(frame).append(createHudTab({ label, glyph: "objective" }), body);
  return Object.assign(frame, {
    update(next: Partial<UIHudObjectiveParams>) {
      current = { ...current, ...next };
      if (next.title !== undefined && next.title !== title.textContent && next.voiceLine === undefined) {
        current.voiceLine = next.title;
      }
      const values = parseHudObjectiveParams(current);
      updateVoiceText(title, values.title, values.voiceLine);
      updateVoiceText(step, values.step);
    },
  });
}

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
export function createHudResource(params: Partial<UIHudResourceParams> = {}) {
  const parsed = parseHudResourceParams(params);
  const row = document.createElement("div");
  row.className = "ui-hud-resource";
  row.setAttribute("role", "meter");
  row.setAttribute("aria-label", parsed.label);
  row.setAttribute("aria-valuemin", "0");
  row.setAttribute("aria-valuemax", "100");
  row.setAttribute("aria-valuenow", String(Math.round(parsed.level * 100)));
  const tone = (resource: UIHudResourceParams) => resource.level <= 0.25 ? "Warning" : resource.tone;
  const glyph = createHudGlyph(parsed.glyph, "ui-hud-resource__glyph");
  const label = voiceText("span", "ui-hud-resource__label", parsed.label);
  const meter = createHudMeter({ level: parsed.level, cells: 8, tone: tone(parsed) });
  row.append(glyph, label, meter);
  return Object.assign(row, {
    update(next: UIHudResourceParams) {
      const percent = String(Math.round(next.level * 100));
      if (row.getAttribute("aria-valuenow") !== percent) row.setAttribute("aria-valuenow", percent);
      if (row.getAttribute("aria-label") !== next.label) row.setAttribute("aria-label", next.label);
      glyph.updateGlyph(next.glyph);
      updateVoiceText(label, next.label);
      meter.updateMeter(next.level, tone(next));
    },
  });
}

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
export function createHudStatus(params: Partial<UIHudStatusParams> = {}, strings?: UIStrings) {
  let current = params;
  const parsed = parseHudStatusParams(current);
  // Companion gauge lives inside the card (left column), never overlapping the frame.
  const frame = createHudFrame({ corner: "top-right", double: true });
  frame.classList.add("ui-hud-status");
  const text = uiText(strings);
  frame.setAttribute("aria-label", text("componente.hud.estado", { name: parsed.name }));
  const gauge = document.createElement("div");
  gauge.className = "ui-hud-status__gauge";
  const ring = createHudRing({ level: parsed.ringLevel, glyph: "iris" });
  const name = voiceText("strong", "ui-hud-status__name", parsed.name);
  const role = voiceText("span", "ui-hud-status__role", parsed.role);
  gauge.append(ring, name, role);
  const meters = document.createElement("div");
  meters.className = "ui-hud-status__meters";
  const rows = parsed.resources.map(createHudResource);
  meters.append(...rows);
  hudFrameContent(frame).append(gauge, meters);
  return Object.assign(frame, {
    update(next: Partial<UIHudStatusParams>) {
      current = { ...current, ...next };
      const values = parseHudStatusParams(current);
      if (name.textContent !== values.name) frame.setAttribute("aria-label", text("componente.hud.estado", { name: values.name }));
      updateVoiceText(name, values.name);
      updateVoiceText(role, values.role);
      ring.updateLevel(values.ringLevel);
      if (!next.resources) return;
      for (const [index, value] of values.resources.entries()) {
        if (rows[index]) rows[index].update(value);
        else {
          const row = createHudResource(value);
          rows.push(row);
          meters.append(row);
        }
      }
      for (const row of rows.splice(values.resources.length)) row.remove();
    },
  });
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
export function createHudZone(params: Partial<UIHudZoneParams> = {}, strings?: UIStrings) {
  let current = params;
  const parsed = parseHudZoneParams(current);
  const frame = createHudFrame({ corner: "top-right", double: false });
  frame.classList.add("ui-hud-zone");
  frame.setAttribute("aria-label", uiText(strings)("componente.hud.zona"));
  const text = document.createElement("div");
  text.className = "ui-hud-zone__text";
  const name = voiceText("strong", "ui-hud-zone__name", parsed.name, parsed.voiceLine);
  const deck = voiceText("span", "ui-hud-zone__deck", parsed.deck);
  text.append(name, deck);
  const bar = document.createElement("span");
  bar.className = "ui-hud-zone__bar";
  const glyph = createHudHex({ glyph: parsed.glyph, size: "Large" });
  hudFrameContent(frame).append(glyph, text, bar);
  return Object.assign(frame, {
    update(next: Partial<UIHudZoneParams>) {
      current = { ...current, ...next };
      if (next.name !== undefined && next.name !== name.textContent && next.voiceLine === undefined) {
        current.voiceLine = next.name;
      }
      const values = parseHudZoneParams(current);
      updateVoiceText(name, values.name, values.voiceLine);
      updateVoiceText(deck, values.deck);
      glyph.updateGlyph(values.glyph);
    },
  });
}

// --- Minimap card ---------------------------------------------------------------------------
export interface UIHudMinimapParams { label: string; heading: number }
export function parseHudMinimapParams(input: unknown): UIHudMinimapParams {
  const rec = asRecord(input);
  return { label: pickString(rec.label, "Habitat deck 1", "label"), heading: pickNumber(rec.heading, 0, "heading", -360, 360) };
}
export function createHudMinimap(params: Partial<UIHudMinimapParams> = {}, strings?: UIStrings) {
  const parsed = parseHudMinimapParams(params);
  const frame = createHudFrame({ corner: "top-left", double: true });
  frame.classList.add("ui-hud-minimap");
  frame.setAttribute("aria-label", uiText(strings)("componente.hud.mapa"));
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
    <g class="ui-hud-minimap__heading" transform="rotate(${parsed.heading} 52 50)"><path class="cone" d="M52 50 40 30h24z"/><path class="player" d="M52 44l-5 10 5-2.6 5 2.6z"/></g>
    <text class="north" x="112" y="12">N</text></svg>`;
  const tab = createHudTab({ label: parsed.label, glyph: "map" });
  const label = tab.querySelector<HTMLElement>(".ui-hud-tab__label")!;
  const heading = view.querySelector(".ui-hud-minimap__heading");
  hudFrameContent(frame).append(tab, view);
  for (const corner of ["tl", "br"]) {
    const cross = document.createElement("span");
    cross.className = `ui-hud-cross ui-hud-cross--${corner}`;
    frame.append(cross);
  }
  return Object.assign(frame, {
    update(next: Partial<UIHudMinimapParams>) {
      if (next.label !== undefined) updateVoiceText(label, next.label);
      if (next.heading !== undefined) {
        const value = `rotate(${parseHudMinimapParams(next).heading} 52 50)`;
        if (heading && heading.getAttribute("transform") !== value) heading.setAttribute("transform", value);
      }
    },
  });
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
  const target = voiceText("span", "ui-hud-interaction__target", parsed.target);
  const action = button.querySelector<HTMLElement>(".ui-hud-action__label")!;
  card.append(target, button);
  root.append(createHudReticle(), leader, card);
  return {
    root, button,
    update(next: Partial<UIHudInteractionParams>) {
      if (next.target !== undefined) updateVoiceText(target, next.target);
      if (next.action !== undefined || next.voiceLine !== undefined) {
        const label = next.action ?? action.textContent ?? "";
        const voice = next.voiceLine ?? (label === action.textContent ? action.dataset.voiceLine : label) ?? label;
        updateVoiceText(action, label, voice);
        if (button.dataset.voiceLine !== voice) button.dataset.voiceLine = voice;
      }
    },
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
