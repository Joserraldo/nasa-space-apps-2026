import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import {
  CANTEEN_HUD_STATE, createGameHud, createHudFrame, createHudMeter, createHudResource, createHudZone, createUIRegistry,
} from "../../src/ui";
import { installDomShim } from "./helpers/dom-shim";

const tokens = readFileSync(new URL("../../src/ui/foundation/tokens.css", import.meta.url), "utf8");
function token(name: string): number[] {
  const match = tokens.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`missing token ${name}`);
  const value = match[1].trim();
  if (value.startsWith("#")) return [1, 3, 5].map(i => parseInt(value.slice(i, i + 2), 16));
  const rgb = value.match(/rgb\((\d+) (\d+) (\d+)/);
  if (!rgb) throw new Error(`unparsed ${name}: ${value}`);
  return rgb.slice(1, 4).map(Number);
}
const luminance = ([r, g, b]: number[]) => {
  const lin = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
const contrast = (a: number[], b: number[]) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** Tree walk (the DOM shim only supports simple selectors). */
function walk(root: Element): HTMLElement[] {
  const out: HTMLElement[] = [];
  const visit = (el: Element) => { out.push(el as HTMLElement); for (const child of Array.from(el.children)) visit(child); };
  visit(root);
  return out;
}

describe("UI v3 game HUD", () => {
  beforeEach(() => { installDomShim(); });

  it("keeps HUD text and accent above WCAG AA on the panel colour", () => {
    // The panel is 84 % opaque near-black; contrast is checked against the solid panel tone (worst realistic case
    // is checked in the browser capture script over the white canteen).
    const panel = token("ui-hud-panel-solid");
    expect(contrast(token("ui-hud-ink"), panel)).toBeGreaterThanOrEqual(7);
    expect(contrast(token("ui-hud-accent"), panel)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token("ui-hud-warning"), panel)).toBeGreaterThanOrEqual(4.5);
    // Action button: dark text on ink.
    expect(contrast(token("ui-hud-panel-solid"), token("ui-hud-ink"))).toBeGreaterThanOrEqual(7);
  });

  it("registers the HUD atoms, molecules and organism in the kit registry", () => {
    const ids = createUIRegistry().ids();
    for (const id of ["UI-ATOM-HUD-FRAME", "UI-ATOM-HUD-TAB", "UI-ATOM-HUD-HEX", "UI-ATOM-HUD-METER", "UI-ATOM-HUD-RING",
      "UI-ATOM-HUD-RETICLE", "UI-ATOM-HUD-ACTION", "UI-MOLECULE-HUD-OBJECTIVE", "UI-MOLECULE-HUD-RESOURCE",
      "UI-MOLECULE-HUD-STATUS", "UI-MOLECULE-HUD-ZONE", "UI-MOLECULE-HUD-MINIMAP", "UI-MOLECULE-HUD-INTERACTION",
      "UI-ORGANISM-GAME-HUD"]) expect(ids).toContain(id);
  });

  it("draws the frame outline as a clipped layer so the chamfer keeps its stroke", () => {
    const frame = createHudFrame({ corner: "top-right" });
    expect(frame.classList.contains("ui-hud-frame--top-right")).toBe(true);
    expect(frame.querySelector(".ui-hud-frame__stroke")).not.toBeNull();
    expect(frame.querySelector(".ui-hud-frame__fill")).not.toBeNull();
    expect(frame.querySelector(".ui-hud-frame__inset")).not.toBeNull();
  });

  it("shows resources as objects: meters without numbers, exposed to assistive tech, warning when low (R2)", () => {
    const meter = createHudMeter({ level: 0.5, cells: 8 });
    expect(Array.from(meter.children).filter(cell => cell.className === "is-on")).toHaveLength(4);
    expect(meter.textContent).toBe("");
    const low = createHudResource({ glyph: "air", label: "Air", level: 0.2 });
    expect(low.getAttribute("role")).toBe("meter");
    expect(low.getAttribute("aria-valuenow")).toBe("20");
    expect(walk(low).some(el => el.classList?.contains("ui-hud-meter--warning"))).toBe(true);
  });

  it("gives every visible text a narration hook (R1)", () => {
    const hud = createGameHud(CANTEEN_HUD_STATE);
    const wanted = ["ui-hud-tab__label", "ui-hud-objective__title", "ui-hud-zone__name", "ui-hud-interaction__target", "ui-hud-action"];
    const texts = walk(hud.layer).filter(el => wanted.some(name => el.classList?.contains(name)));
    expect(texts.length).toBeGreaterThanOrEqual(6);
    for (const text of texts) expect(text.dataset.voiceLine, text.className).toBeTruthy();
    expect(createHudZone({ name: "Canteen" }).querySelector<HTMLElement>(".ui-hud-zone__name")!.dataset.voiceLine)
      .toBe("You are in the canteen.");
  });

  it("places the four modules in the corners, pause on the top edge, and only the diegetic prompt elsewhere", () => {
    const hud = createGameHud(CANTEEN_HUD_STATE);
    const slots = [...hud.layer.querySelectorAll(".ui-game-hud__slot")].map(slot => slot.className);
    expect(slots).toEqual([
      "ui-game-hud__slot ui-game-hud__slot--top-centre",
      "ui-game-hud__slot ui-game-hud__slot--top-left", "ui-game-hud__slot ui-game-hud__slot--top-right",
      "ui-game-hud__slot ui-game-hud__slot--bottom-left", "ui-game-hud__slot ui-game-hud__slot--bottom-right",
    ]);
    hud.placeInteraction(null);
    expect(hud.layer.querySelector<HTMLElement>(".ui-hud-interaction")!.hidden).toBe(true);
  });
});

describe("UI v3 pause menu", () => {
  beforeEach(() => { installDomShim(); });

  it("uses a native dialog with at most three large options, each voiced (R1, R6)", async () => {
    const { createPauseMenu, DEFAULT_PAUSE_STATE } = await import("../../src/ui");
    const many = { ...DEFAULT_PAUSE_STATE, items: [...DEFAULT_PAUSE_STATE.items, { id: "extra", label: "Extra", glyph: "map" as const, voiceLine: "Extra" }] };
    const menu = createPauseMenu(many);
    expect(menu.dialog.tagName.toLowerCase()).toBe("dialog");
    const items = walk(menu.dialog).filter(el => el.classList?.contains("ui-pause__item"));
    expect(items).toHaveLength(3);
    for (const item of items) expect(item.dataset.voiceLine).toBeTruthy();
    expect(menu.dialog.dataset.voiceLine).toBe("The game is paused.");
  });

  it("reports the chosen option to the container", async () => {
    const { createPauseMenu, DEFAULT_PAUSE_STATE } = await import("../../src/ui");
    const chosen: string[] = [];
    const menu = createPauseMenu(DEFAULT_PAUSE_STATE, id => chosen.push(id));
    const settings = walk(menu.dialog).find(el => el.dataset?.voiceLine === "Open settings." && el.tagName.toLowerCase() === "button")!;
    settings.click();
    expect(chosen).toEqual(["settings"]);
  });
});

describe("UI v3 crew dialogue", () => {
  beforeEach(() => { installDomShim(); });

  it("shows the speaker, one voiced line and at most three icon-led replies (R1, R6, R9)", async () => {
    const { createCrewDialogue, TESS_DISPENSER_DIALOGUE } = await import("../../src/ui");
    const extra = { ...TESS_DISPENSER_DIALOGUE, replies: [...TESS_DISPENSER_DIALOGUE.replies, { id: "x", label: "X", glyph: "map" as const, voiceLine: "X" }] };
    const dialogue = createCrewDialogue(extra);
    const nodes = walk(dialogue.root);
    const replies = nodes.filter(el => el.classList?.contains("ui-hud-reply") && !el.classList.contains("ui-crew-dialogue__next"));
    expect(replies).toHaveLength(3);
    // Icon first: every reply leads with a glyph (kids read icons before words).
    for (const reply of replies) expect(walk(reply).some(el => el.classList?.contains("ui-hud-reply__glyph"))).toBe(true);
    for (const reply of replies) expect(reply.dataset.voiceLine).toBeTruthy();
    const line = nodes.find(el => el.classList?.contains("ui-crew-dialogue__line"))!;
    expect(line.dataset.voiceLine).toBe(TESS_DISPENSER_DIALOGUE.voiceLine);
    const portrait = nodes.find(el => el.tagName?.toLowerCase() === "img") as HTMLImageElement;
    expect(portrait.getAttribute("alt")).toBe("Tess, Engineer");
  });

  it("reports the chosen reply to the container", async () => {
    const { createCrewDialogue, TESS_DISPENSER_DIALOGUE } = await import("../../src/ui");
    const chosen: string[] = [];
    const dialogue = createCrewDialogue(TESS_DISPENSER_DIALOGUE, id => chosen.push(id));
    walk(dialogue.root).filter(el => el.classList?.contains("ui-hud-reply") && !el.classList.contains("ui-crew-dialogue__next"))[1].click();
    expect(chosen).toEqual(["soup"]);
  });
});

describe("UI v3 dialogue content fitting", () => {
  it("pages long lines into whole sentences, at most two per page", async () => {
    const { paginateLine } = await import("../../src/ui/organisms/crew-dialogue");
    expect(paginateLine("Five fuses left. Enough!")).toEqual(["Five fuses left. Enough!"]);
    const long = "A solar flare is coming in two sols. It is a big one, I call it Sparky! The radiation will be strong outside. We need a safe place before it arrives.";
    const pages = paginateLine(long);
    expect(pages).toHaveLength(2);
    for (const page of pages) {
      expect((page.match(/[.!?]/g) ?? []).length).toBeLessThanOrEqual(2);
      expect(page).toMatch(/[.!?]$/);
    }
    expect(pages.join(" ")).toBe(long);
    const single = "If the dome loses one percent of its air every hour and we have twenty hours of air left then we can wait.";
    expect(paginateLine(single)).toEqual([single]);
  });

  it("keeps every speaker accent readable as text on the dark panel (WCAG AA)", async () => {
    const { CREW_SPEAKERS } = await import("../../src/ui/organisms/crew-dialogue.samples");
    const hex = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const panel = token("ui-hud-panel-solid");
    for (const speaker of Object.values(CREW_SPEAKERS)) {
      expect(contrast(hex(speaker.accent), panel), speaker.name).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("covers every crew speaker and both reply counts in the layout samples", async () => {
    const { DIALOGUE_SAMPLES } = await import("../../src/ui/organisms/crew-dialogue.samples");
    const samples = Object.values(DIALOGUE_SAMPLES);
    expect(new Set(samples.map(s => s.speaker.id))).toEqual(new Set(["tess", "nia", "vera", "teo"]));
    expect(new Set(samples.map(s => s.replies.length))).toEqual(new Set([1, 2, 3]));
  });
});
