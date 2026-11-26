import type { UIHudGlyph } from "../atoms/hud-atoms";

export const CHAPTER_OBJECTIVES = {
  shield: { label: "Shield", glyph: "shield" },
  power: { label: "Power", glyph: "battery" },
  air: { label: "Air", glyph: "air" },
  food: { label: "Food", glyph: "soup" },
  rescue: { label: "Rescue", glyph: "wrench" },
  signal: { label: "Signal", glyph: "voice" },
} as const satisfies Record<string, { label: string; glyph: UIHudGlyph }>;

export type ChapterObjectiveId = keyof typeof CHAPTER_OBJECTIVES;
interface ChapterCopy {
  number: string;
  title: string;
  lesson: string;
  glyph: UIHudGlyph;
  objectives: readonly ChapterObjectiveId[];
}

// Order and learning objectives: docs/DISENO-JUEGO.md, section 4.1.
export const CHAPTERS = {
  C1: { number: "Chapter 1", title: "The journey", lesson: "Learn how shielding protects the crew.", glyph: "shield", objectives: ["shield"] },
  C2: { number: "Chapter 2", title: "Arrival at Jezero", lesson: "Keep the colony's power and air running.", glyph: "battery", objectives: ["power", "air"] },
  C3: { number: "Chapter 3", title: "Food for everyone", lesson: "Grow food in the greenhouse.", glyph: "soup", objectives: ["food"] },
  C4: { number: "Chapter 4", title: "The great dust storm", lesson: "Save power and help the crew during a storm.", glyph: "air", objectives: ["power", "air", "rescue"] },
  C5: { number: "Chapter 5", title: "Silence from Earth", lesson: "Restore communications and learn why polar ice matters.", glyph: "voice", objectives: ["signal"] },
  Final: { number: "Final chapter", title: "Families arrive", lesson: "Use what you learned to welcome new families.", glyph: "home", objectives: ["shield", "power", "air", "food", "signal"] },
} as const satisfies Record<string, ChapterCopy>;

export type ChapterId = keyof typeof CHAPTERS;
export const SAVED_CHAPTER_KEY = "colonia.progress.chapter";
const order = Object.keys(CHAPTERS) as ChapterId[];

export function isChapterId(value: string | null): value is ChapterId {
  return order.some(id => id === value);
}

export function nextChapter(current: ChapterId): ChapterId | undefined {
  return order[order.indexOf(current) + 1];
}

export function readSavedChapter(storage?: Pick<Storage, "getItem">): ChapterId | undefined {
  try {
    const value = storage?.getItem(SAVED_CHAPTER_KEY) ?? null;
    return isChapterId(value) ? value : undefined;
  } catch {
    return undefined;
  }
}
