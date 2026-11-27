import { createHudFrame, createHudGlyph, createHudTab, hudFrameContent, voiceText } from "../atoms/hud-atoms";
import { chapterCopy, CHAPTER_OBJECTIVES, nextChapter, type ChapterId, type ChapterObjectiveId } from "../content/chapters";
import { uiText, type UIStrings } from "../i18n";
import type { UIRegistry } from "../registry";
import { asRecord, pickEnum } from "../types";
import { createHudReply } from "./crew-dialogue";

type DifficultyLabel = "Easy" | "Medium" | "Hard" | "Hardcore";
export type ChapterCardState = { chapter: ChapterId } & (
  { mode: "start" } | { mode: "complete"; earned: readonly ChapterObjectiveId[]; difficulty: DifficultyLabel }
);

interface ChapterActions {
  onStart?: (chapter: ChapterId) => void;
  onNext?: (chapter: ChapterId) => void;
  onMap?: (chapter: ChapterId) => void;
}

export function createChapterCard(state: ChapterCardState, actions: ChapterActions = {}, strings?: UIStrings): HTMLElement {
  const text = uiText(strings);
  const chapter = chapterCopy(state.chapter, strings);
  const frame = createHudFrame({ corner: "octagon", double: false, detail: false });
  frame.classList.add("ui-chapter-card");
  const content = hudFrameContent(frame);
  const tab = createHudTab({
    glyph: "objective",
    label: state.mode === "complete" && state.difficulty === "Easy" ? text("componente.capitulo.completo") : chapter.number,
  });
  const title = voiceText("h2", "ui-chapter-card__title", chapter.title);
  const buttons = document.createElement("div");
  buttons.className = "ui-chapter-card__actions";
  content.append(tab, title);
  if (state.mode === "start") {
    const lesson = voiceText("p", "ui-chapter-card__lesson", chapter.lesson);
    lesson.prepend(createHudGlyph(chapter.glyph, "ui-chapter-card__glyph"));
    const start = createHudReply({ glyph: "play", label: text("componente.capitulo.empezar") });
    start.addEventListener("click", () => actions.onStart?.(state.chapter));
    content.append(lesson);
    buttons.append(start);
  } else {
    const awards = document.createElement("ul");
    awards.className = "ui-chapter-card__awards";
    let earnedCount = 0;
    for (const id of chapter.objectives) {
      const achieved = state.earned.includes(id);
      if (achieved) earnedCount++;
      const definition = CHAPTER_OBJECTIVES[id];
      const label = strings?.[`componente.capitulo.objetivo.${id}`] ?? definition.label;
      const objective = document.createElement("li");
      objective.className = "ui-chapter-card__objective";
      objective.dataset.objective = id;
      objective.dataset.earned = String(achieved);
      objective.append(
        createHudGlyph(definition.glyph, "ui-chapter-card__glyph"),
        voiceText("span", "ui-chapter-card__objective-label", achieved ? label : text("componente.capitulo.pendiente", { label }),
          text(achieved ? "componente.capitulo.logrado.voz" : "componente.capitulo.pendiente.voz", { label })),
      );
      awards.append(objective);
    }
    content.append(awards);
    if (state.difficulty !== "Easy") content.append(voiceText("p", "ui-chapter-card__count", String(earnedCount), text("componente.capitulo.total.voz", { value: earnedCount })));
    content.append(voiceText("p", "ui-chapter-card__saved", text("componente.carga.guardado")));
    const next = createHudReply({ glyph: "next", label: text("componente.capitulo.siguiente") });
    const map = createHudReply({ glyph: "map", label: text("componente.capitulo.mapa") });
    const following = nextChapter(state.chapter);
    next.disabled = !following;
    next.addEventListener("click", () => { if (following) actions.onNext?.(following); });
    map.addEventListener("click", () => actions.onMap?.(state.chapter));
    buttons.append(next, map);
  }
  content.append(buttons);
  return frame;
}

export function registerChapterCard(registry: UIRegistry): void {
  registry.register<{ mode: "start" | "complete" }>("UI-ORGANISM-CHAPTER-CARD", {
    metadata: { layer: "organism", name: "Chapter card", figmaNodeId: "1:12", description: "A chapter's objective or completion summary." },
    variants: { Start: { mode: "start" }, Complete: { mode: "complete" } },
    parse: input => ({ mode: pickEnum(asRecord(input).mode, ["start", "complete"] as const, "start", "mode") }),
    render: ({ mode }) => createChapterCard(mode === "start"
      ? { chapter: "C2", mode }
      : { chapter: "C2", mode, earned: ["power"], difficulty: "Easy" }),
  });
}
