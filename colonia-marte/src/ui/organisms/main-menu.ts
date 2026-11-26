import { createHudFrame, createHudGlyph, createHudTab, hudFrameContent, voiceText, type UIHudGlyph } from "../atoms/hud-atoms";
import { CHAPTERS, isChapterId, type ChapterId } from "../content/chapters";
import type { UIRegistry } from "../registry";
import { asRecord } from "../types";

export const GAME_TITLE = "MARS COLONY";
interface MenuActions {
  onContinue?: (chapter: ChapterId) => void;
  onNewGame?: () => void;
  onSettings?: () => void;
}

export function createMainMenu(saved?: ChapterId, actions: MenuActions = {}) {
  const dialog = document.createElement("dialog");
  dialog.className = "ui-pause ui-main-menu";
  dialog.setAttribute("aria-label", GAME_TITLE);
  dialog.addEventListener("cancel", event => event.preventDefault());
  const hex = document.createElement("div");
  hex.className = "ui-pause__hex";
  const slab = document.createElement("div");
  slab.className = "ui-pause__slab ui-main-menu__slab";
  const title = voiceText("h1", "ui-pause__title ui-main-menu__title", GAME_TITLE);
  const list = document.createElement("ul");
  list.className = "ui-pause__list";

  function item(label: string, glyph: UIHudGlyph, click: () => void, subtitle?: string) {
    const li = document.createElement("li");
    li.style.setProperty("--step", String(list.children.length));
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ui-pause__item";
    button.dataset.voiceLine = subtitle ? `${label}. ${subtitle}.` : label;
    const lines = document.createElement("span");
    lines.className = "ui-main-menu__lines";
    lines.append(voiceText("span", "", label));
    if (subtitle) lines.append(voiceText("small", "ui-main-menu__subtitle", subtitle));
    button.append(createHudGlyph(glyph, "ui-pause__glyph"), lines);
    button.addEventListener("click", click);
    li.append(button);
    list.append(li);
    return button;
  }

  if (saved) {
    const { number, title } = CHAPTERS[saved];
    item("Continue", "play", () => actions.onContinue?.(saved), `${number}. ${title}`);
  }
  item("New game", "rocket", () => actions.onNewGame?.());
  const settingsButton = item("Settings", "gear", () => actions.onSettings?.());
  const side = document.createElement("div");
  side.className = "ui-pause__side";
  const frame = createHudFrame({ corner: "octagon", double: false, detail: false });
  frame.classList.add("ui-pause__mission");
  const chapter = CHAPTERS[saved ?? "C1"];
  hudFrameContent(frame).append(createHudTab({ glyph: chapter.glyph, label: chapter.number }),
    voiceText("p", "ui-main-menu__chapter", chapter.title));
  side.append(frame);
  slab.append(title, list);
  dialog.append(hex, slab, side);
  return { dialog, settingsButton };
}

export function registerMainMenu(registry: UIRegistry): void {
  registry.register<{ saved?: ChapterId }>("UI-ORGANISM-MAIN-MENU", {
    metadata: { layer: "organism", name: "Main menu", figmaNodeId: "1:12", description: "New game, saved chapter, and Settings on the pause slab." },
    variants: { New: {}, Saved: { saved: "C2" } },
    parse: input => {
      const value = asRecord(input).saved;
      return { saved: typeof value === "string" && isChapterId(value) ? value : undefined };
    },
    render: ({ saved }) => {
      const { dialog } = createMainMenu(saved);
      const root = document.createElement("div");
      root.className = "ui-pause-showcase";
      dialog.setAttribute("open", "");
      root.append(dialog);
      return root;
    },
  });
}
