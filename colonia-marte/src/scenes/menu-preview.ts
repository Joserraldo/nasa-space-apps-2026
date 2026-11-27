import {
  createChapterCard, createMainMenu, createSettingsMenu,
  effectiveDifficulty, resetProgress, saveSettings, type ChapterCardState,
} from "../ui";
import { CHAPTERS, isChapterId, readSavedChapter, type ChapterId } from "../ui/content/chapters";
import type { SettingsState } from "../ui/state/settings";
import { getUiStrings, reopenLocalizedSettings, uiText } from "../ui/i18n";

function nextFrame(): Promise<number> {
  return new Promise(resolve => requestAnimationFrame(resolve));
}

export async function mountMenuPreview({ loading, settings: initialSettings, storage }: {
  loading: HTMLElement; settings: SettingsState; storage?: Storage;
}): Promise<void> {
  document.body.classList.add("hud-preview", "menu-preview");
  const world = document.querySelector<HTMLElement>("#app")!;
  world.inert = true;
  let settings = initialSettings;

  const { mountExteriorPilot } = await import("./exterior-pilot");
  try {
    await mountExteriorPilot();
    await nextFrame();
  } catch (error) {
    console.error("Menu backdrop did not load:", error);
  }
  const strings = getUiStrings(initialSettings.language);
  const text = uiText(strings);
  document.title = text("componente.menu.titulo");

  let saved = readSavedChapter(storage);
  let progressReset = false;
  const preferences = createSettingsMenu(settings, {
    onChange: next => {
      settings = next;
      let persisted = false;
      try { if (storage) { saveSettings(storage, next); persisted = true; } } catch { /* Storage may be unavailable. */ }
      if (next.language !== initialSettings.language) {
        reopenLocalizedSettings(next.language, persisted);
        return;
      }
      document.documentElement.classList.toggle("ui-big-text", next.bigText);
    },
    onResetProgress: () => {
      try {
        if (storage) resetProgress(storage);
        progressReset = true;
      } catch { /* Keep the previous menu if reset was not possible. */ }
    },
    onBack: () => {
      if (!progressReset) return;
      saved = readSavedChapter(storage);
      progressReset = false;
      menu.dialog.close();
      menu.dialog.remove();
      menu = buildMenu();
      showMenu(true);
    },
  }, strings);

  const stage = document.createElement("dialog");
  stage.className = "ui-pause ui-chapter-stage";
  stage.setAttribute("aria-label", text("componente.capitulo.tarjeta"));
  stage.addEventListener("close", () => { if (!menu.dialog.open) showMenu(); });
  function showChapter(state: ChapterCardState): void {
    stage.replaceChildren(createChapterCard(state, {
      onStart: chapter => location.assign(`/hud-preview?chapter=${chapter}`),
      onNext: chapter => showChapter({ chapter, mode: "start" }),
      onMap: chapter => stage.dispatchEvent(new CustomEvent("colony-map-request", { detail: { chapter }, bubbles: true })),
    }, strings));
    if (menu.dialog.open) menu.dialog.close();
    if (!stage.open) stage.showModal();
    stage.querySelector<HTMLButtonElement>("button:not([disabled])")?.focus();
  }

  function buildMenu() {
    return createMainMenu(saved, {
      onContinue: chapter => showChapter({ chapter, mode: "start" }),
      onNewGame: () => showChapter({ chapter: "C1", mode: "start" }),
      onSettings: () => { menu.settingsButton.focus(); preferences.open(); },
    }, strings);
  }
  let menu = buildMenu();
  function showMenu(focusSettings = false): void {
    if (!menu.dialog.isConnected) preferences.dialog.before(menu.dialog);
    menu.dialog.showModal();
    if (focusSettings) menu.settingsButton.focus();
  }
  document.body.append(preferences.dialog, stage);
  loading.remove();
  const query = new URLSearchParams(location.search);
  const requested = query.get("chapter");
  const chapter: ChapterId = isChapterId(requested) ? requested : saved ?? "C1";
  if (query.get("chapter-card") === "complete") {
    const labels = { easy: "Easy", medium: "Medium", hard: "Hard", hardcore: "Hardcore" } as const;
    showChapter({ chapter, mode: "complete", earned: CHAPTERS[chapter].objectives.slice(0, 1), difficulty: labels[effectiveDifficulty(settings)] });
  } else {
    showMenu();
    if (query.get("settings") === "play") {
      menu.settingsButton.focus();
      preferences.open("play");
    }
  }
}
