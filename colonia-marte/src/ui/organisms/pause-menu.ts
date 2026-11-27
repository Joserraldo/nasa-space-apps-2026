import { createHudFrame, createHudGlyph, createHudTab, hudFrameContent, voiceText, type UIHudGlyph } from "../atoms/hud-atoms";
import type { UIRegistry } from "../registry";
import { uiText, type UIStrings } from "../i18n";

/**
 * Pause menu organism (UI v3). Layout language from the Polar Sci-Fi Facility pause menu (light diagonal
 * slab, items stepped along the diagonal, dark slanted bar on the active item, large status word) in the
 * project's two tones plus cyan. Native <dialog>: focus containment, Esc to resume, top-layer rendering.
 * Two or three options only (R6).
 */
export interface PauseMenuItem { id: string; label: string; glyph: UIHudGlyph; voiceLine: string }
export interface PauseMenuState {
  items: PauseMenuItem[];
  chapter: string;
  objective: string;
  voiceLine: string;
}

export function createPauseMenu(state: PauseMenuState, onChoose: (id: string) => void = () => {}, strings?: UIStrings) {
  const text = uiText(strings);
  const dialog = document.createElement("dialog");
  dialog.className = "ui-pause";
  dialog.setAttribute("aria-label", text("componente.pausa.dialogo"));
  dialog.dataset.voiceLine = state.voiceLine;

  const slab = document.createElement("div");
  slab.className = "ui-pause__slab";
  const title = document.createElement("h2");
  title.className = "ui-pause__title";
  title.append(voiceText("span", "ui-pause__title-text", text("componente.pausa.opciones")));
  const titleRule = document.createElement("span");
  titleRule.className = "ui-pause__title-rule";
  title.append(titleRule);

  const list = document.createElement("ul");
  list.className = "ui-pause__list";
  state.items.slice(0, 3).forEach((item, index) => {
    const li = document.createElement("li");
    li.style.setProperty("--step", String(index));
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ui-pause__item";
    button.dataset.pauseAction = item.id;
    button.dataset.voiceLine = item.voiceLine;
    button.append(createHudGlyph(item.glyph, "ui-pause__glyph"), voiceText("span", "ui-pause__label", item.label, item.voiceLine));
    button.addEventListener("click", () => { onChoose(item.id); if (item.id === "resume") dialog.close(); });
    li.append(button);
    list.append(li);
  });
  slab.append(title, list);

  const side = document.createElement("div");
  side.className = "ui-pause__side";
  const status = document.createElement("div");
  status.className = "ui-pause__status";
  status.append(voiceText("span", "ui-pause__status-label", text("componente.pausa.situacion")),
    voiceText("strong", "ui-pause__status-word", text("componente.pausa.pausado"), state.voiceLine));
  const card = createHudFrame({ corner: "top-left", double: true, accentEdge: true });
  card.classList.add("ui-pause__mission");
  const body = document.createElement("div");
  body.className = "ui-pause__mission-body";
  body.append(voiceText("p", "ui-pause__chapter", state.chapter), voiceText("p", "ui-pause__objective", state.objective));
  hudFrameContent(card).append(createHudTab({ label: text("componente.pausa.mision"), glyph: "objective" }), body);
  side.append(status, card);

  const pattern = document.createElement("span");
  pattern.className = "ui-pause__hex";
  dialog.append(pattern, slab, side);
  return {
    dialog,
    open() { if (!dialog.open) { dialog.showModal(); (list.querySelector("button") as HTMLButtonElement | null)?.focus(); } },
    close() { if (dialog.open) dialog.close(); },
  };
}

export const DEFAULT_PAUSE_STATE: PauseMenuState = {
  items: [
    { id: "resume", label: "Keep playing", glyph: "play", voiceLine: "Keep playing." },
    { id: "settings", label: "Settings", glyph: "gear", voiceLine: "Open settings." },
    { id: "map", label: "Colony map", glyph: "home", voiceLine: "Go back to the colony map." },
  ],
  chapter: "Chapter 1 · Arrival",
  objective: "Get lunch for the crew",
  voiceLine: "The game is paused.",
};

export function registerPauseMenuOrganism(registry: UIRegistry): void {
  registry.register("UI-ORGANISM-PAUSE-MENU", {
    metadata: { layer: "organism", name: "Pause menu", figmaNodeId: "1:12",
      description: "Diagonal slab with three large options, status word and mission card (native dialog)." },
    variants: { Default: {} },
    parse: () => ({}),
    render: () => {
      const menu = createPauseMenu(DEFAULT_PAUSE_STATE);
      const box = document.createElement("div");
      box.className = "ui-pause-showcase";
      menu.dialog.setAttribute("open", "");
      box.append(menu.dialog);
      return box;
    },
  });
}
