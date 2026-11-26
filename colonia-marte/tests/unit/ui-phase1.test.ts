import { beforeEach, describe, expect, it, vi } from "vitest";
import { installDomShim } from "./helpers/dom-shim";
import { createChapterCard, createLoading, createMainMenu, createUIRegistry } from "../../src/ui";
import { CHAPTERS, readSavedChapter } from "../../src/ui/content/chapters";
import { MARS_FACTS } from "../../src/ui/content/mars-facts";

beforeEach(() => { installDomShim(); });

describe("Phase 1 screens", () => {
  it("accepts only a known saved chapter and exposes Continue only for valid progress", () => {
    const storage = { getItem: vi.fn() };
    storage.getItem.mockReturnValue("C9");
    expect(readSavedChapter(storage)).toBeUndefined();
    expect(createMainMenu(undefined).dialog.querySelectorAll("button")).toHaveLength(2);
    storage.getItem.mockReturnValue("C2");
    expect(readSavedChapter(storage)).toBe("C2");
    const onContinue = vi.fn();
    const onSettings = vi.fn();
    const { dialog } = createMainMenu("C2", { onContinue, onSettings });
    const [resume, , settings] = Array.from(dialog.querySelectorAll("button"));
    expect(dialog.querySelectorAll("button")).toHaveLength(3);
    expect(resume.dataset.voiceLine).toBe("Continue. Chapter 2. Arrival at Jezero.");
    resume.click();
    settings.click();
    expect(onContinue).toHaveBeenCalledWith("C2");
    expect(onSettings).toHaveBeenCalledTimes(1);
  });

  it("shows one narrated fact and uses indeterminate progress until given a measurement", () => {
    const loading = createLoading(MARS_FACTS[0]);
    expect(loading.root.querySelectorAll(".ui-loading__fact")).toHaveLength(1);
    expect(loading.root.querySelector<HTMLElement>(".ui-loading__fact")?.dataset.voiceLine).toBe(MARS_FACTS[0]);
    const bar = loading.root.querySelector("progress")!;
    expect(bar.hasAttribute("value")).toBe(false);
    loading.setProgress(0.5);
    expect(bar.getAttribute("value")).toBe("0.5");
    loading.setProgress(Number.NaN);
    expect(bar.hasAttribute("value")).toBe(false);
    expect(MARS_FACTS.every(line => line.split(/\s+/).length <= 12)).toBe(true);
  });

  it("shows the six approved chapter titles and calls Start with the chapter", () => {
    expect(Object.values(CHAPTERS).map(chapter => chapter.title)).toEqual([
      "The journey", "Arrival at Jezero", "Food for everyone",
      "The great dust storm", "Silence from Earth", "Families arrive",
    ]);
    const onStart = vi.fn();
    const card = createChapterCard({ chapter: "C3", mode: "start" }, { onStart });
    expect(card.querySelector<HTMLElement>(".ui-chapter-card__lesson")?.dataset.voiceLine).toBe(CHAPTERS.C3.lesson);
    card.querySelector("button")?.click();
    expect(onStart).toHaveBeenCalledWith("C3");
  });

  it("hides achievement counts on Easy and keeps the completion actions separate", () => {
    const onNext = vi.fn(), onMap = vi.fn();
    const state = { chapter: "C2", mode: "complete", earned: ["power"] } as const;
    const easy = createChapterCard({ ...state, difficulty: "Easy" }, { onNext, onMap });
    const hard = createChapterCard({ ...state, difficulty: "Hard" });
    expect(easy.querySelector(".ui-chapter-card__count")).toBeNull();
    expect(hard.querySelector(".ui-chapter-card__count")?.textContent).toBe("1");
    const objectives = Array.from(easy.querySelectorAll<HTMLElement>(".ui-chapter-card__objective"));
    expect(objectives.map(node => [node.dataset.objective, node.dataset.earned])).toEqual([["power", "true"], ["air", "false"]]);
    expect(objectives[1].querySelector<HTMLElement>(".ui-chapter-card__objective-label")?.dataset.voiceLine).toBe("Air: not achieved.");
    expect(easy.querySelector(".ui-hud-tab__label")?.textContent).toBe("Chapter complete");
    expect(easy.querySelector<HTMLElement>(".ui-chapter-card__saved")?.dataset.voiceLine).toBe("Your game is saved");
    const [next, map] = Array.from(easy.querySelectorAll("button"));
    next.click();
    map.click();
    expect(onNext).toHaveBeenCalledWith("C3");
    expect(onMap).toHaveBeenCalledWith("C2");
  });

  it("registers all three Phase 1 organisms", () => {
    const ids = createUIRegistry().ids();
    for (const name of ["MAIN-MENU", "LOADING", "CHAPTER-CARD"]) {
      expect(ids).toContain(`UI-ORGANISM-${name}`);
    }
  });
});
