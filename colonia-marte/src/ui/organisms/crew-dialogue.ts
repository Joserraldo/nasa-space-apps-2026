import { createHudFrame, createHudGlyph, hudFrameContent, voiceText, type UIHudGlyph } from "../atoms/hud-atoms";
import type { UIRegistry } from "../registry";
import { asRecord, pickEnum, pickString } from "../types";

/**
 * Crew dialogue (UI v3, second version). Follows María Paula's reference: one horizontal bar with cut
 * corners, the portrait on the panel (no card of its own), a divider, the name in the speaker's accent,
 * one short line, and two or three outlined replies led by a large icon (kids read icons first: R1, R6, R9).
 */

const REPLY_GLYPHS = ["next", "wrench", "soup", "robot", "play", "gear", "home", "map", "objective", "battery", "air", "shield", "tap", "iris",
  "sound", "minus", "plus", "back", "none"] as const;

// --- Reply molecule -------------------------------------------------------------------------
export interface UIHudReplyParams { glyph: (typeof REPLY_GLYPHS)[number]; label: string; voiceLine: string }
export function parseHudReplyParams(input: unknown): UIHudReplyParams {
  const rec = asRecord(input);
  const label = pickString(rec.label, "Help Tess", "label");
  return { glyph: pickEnum(rec.glyph, REPLY_GLYPHS, "wrench", "glyph"), label, voiceLine: pickString(rec.voiceLine, label, "voiceLine") };
}
export function createHudReply(params: Partial<UIHudReplyParams> = {}): HTMLButtonElement {
  const parsed = parseHudReplyParams(params);
  const button = document.createElement("button");
  button.type = "button";
  button.className = "ui-hud-reply";
  button.dataset.voiceLine = parsed.voiceLine;
  if (parsed.glyph !== "none") button.append(createHudGlyph(parsed.glyph, "ui-hud-reply__glyph"));
  button.append(voiceText("span", "ui-hud-reply__label", parsed.label, parsed.voiceLine));
  return button;
}

// --- Dialogue organism ----------------------------------------------------------------------
export interface CrewSpeaker { id: string; name: string; role: string; portrait: string; accent: string }
export interface CrewDialogueState {
  speaker: CrewSpeaker;
  line: string;
  voiceLine: string;
  replies: { id: string; label: string; glyph: UIHudReplyParams["glyph"]; voiceLine: string }[];
}

/**
 * Split a line into pages a 7-10 year old can read at a glance (R1): whole sentences only, at most two
 * per page and about `maxChars` characters. A single very long sentence keeps its own page.
 */
export function paginateLine(text: string, maxChars = 96): string[] {
  const sentences = (text.match(/[^.!?]+[.!?]+["')]*|[^.!?]+$/g) ?? [text]).map(t => t.trim()).filter(Boolean);
  const pages: string[] = [];
  let page: string[] = [];
  for (const sentence of sentences) {
    const candidate = [...page, sentence].join(" ");
    if (page.length && (page.length >= 2 || candidate.length > maxChars)) { pages.push(page.join(" ")); page = []; }
    page.push(sentence);
  }
  if (page.length) pages.push(page.join(" "));
  return pages.length ? pages : [text];
}

import { uiText, type UIStrings } from "../i18n";

export function createCrewDialogue(state: CrewDialogueState, onReply: (id: string) => void = () => {}, strings?: UIStrings) {
  const text = uiText(strings);
  const root = document.createElement("section");
  root.className = "ui-crew-dialogue";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-label", text("componente.dialogo.habla", { name: state.speaker.name }));
  root.style.setProperty("--speaker-accent", state.speaker.accent);

  const panel = createHudFrame({ corner: "octagon", double: false, detail: false });
  panel.classList.add("ui-crew-dialogue__panel");
  for (const corner of ["tl", "tr", "bl", "br"]) {
    const tick = document.createElement("span");
    tick.className = `ui-crew-dialogue__tick ui-crew-dialogue__tick--${corner}`;
    panel.append(tick);
  }
  const progress = document.createElement("span");
  progress.className = "ui-crew-dialogue__progress";
  panel.append(progress);

  const portrait = document.createElement("div");
  portrait.className = "ui-crew-dialogue__portrait";
  const image = document.createElement("img");
  image.className = "ui-crew-dialogue__image";
  image.src = state.speaker.portrait;
  image.alt = `${state.speaker.name}, ${state.speaker.role}`;
  image.width = 512; image.height = 512;
  image.decoding = "async";
  portrait.append(image);

  const body = document.createElement("div");
  body.className = "ui-crew-dialogue__body";
  const head = document.createElement("header");
  head.className = "ui-crew-dialogue__head";
  head.append(voiceText("strong", "ui-crew-dialogue__name", state.speaker.name), voiceText("span", "ui-crew-dialogue__role", state.speaker.role));
  // Long lines are paged (whole sentences, at most two per page); each sentence sits on its own line.
  const pages = paginateLine(state.line);
  const line = voiceText("p", "ui-crew-dialogue__line", "", pages[0]);
  line.setAttribute("aria-live", "polite");
  const renderPage = (index: number) => {
    line.replaceChildren();
    line.dataset.voiceLine = pages[index];
    for (const sentence of pages[index].match(/[^.!?]+[.!?]+["')]*|[^.!?]+$/g) ?? [pages[index]]) {
      const span = document.createElement("span");
      span.className = "ui-crew-dialogue__sentence";
      span.textContent = sentence.trim();
      line.append(span);
    }
  };
  renderPage(0);

  const replies = document.createElement("div");
  replies.className = "ui-crew-dialogue__replies";
  const options = state.replies.slice(0, 3);
  replies.style.setProperty("--count", String(Math.max(1, options.length)));
  options.forEach(reply => {
    const button = createHudReply({ glyph: reply.glyph, label: reply.label, voiceLine: reply.voiceLine });
    button.addEventListener("click", () => onReply(reply.id));
    replies.append(button);
  });

  const pager = document.createElement("div");
  pager.className = "ui-crew-dialogue__pager";
  const dots = document.createElement("span");
  dots.className = "ui-crew-dialogue__dots";
  dots.setAttribute("aria-hidden", "true");
  pages.forEach(() => dots.append(document.createElement("i")));
  const next = createHudReply({ glyph: "next", label: text("componente.dialogo.siguiente"), voiceLine: text("componente.dialogo.siguiente.voz") });
  next.classList.add("ui-crew-dialogue__next");
  pager.append(dots, next);

  let current = 0;
  const showPage = (index: number) => {
    current = index;
    renderPage(index);
    const last = index === pages.length - 1;
    replies.hidden = !last;
    pager.hidden = pages.length === 1 || last;
    [...dots.children].forEach((dot, i) => { if (i <= index) dot.classList.add("is-on"); else dot.classList.remove("is-on"); });
    root.dataset.page = `${index + 1}/${pages.length}`;
  };
  next.addEventListener("click", () => { showPage(Math.min(current + 1, pages.length - 1)); focusFirst(); });
  showPage(0);

  body.append(head, line, pager, replies);
  hudFrameContent(panel).append(portrait, body);
  root.append(panel);
  const focusFirst = () => ((replies.hidden ? next : replies.querySelector("button")) as HTMLButtonElement | null)?.focus();
  return {
    root,
    focusFirstReply: focusFirst,
    pageCount: pages.length,
  };
}

export const TESS_DISPENSER_DIALOGUE: CrewDialogueState = {
  speaker: { id: "tess", name: "Tess", role: "Engineer", portrait: "/ui/portraits/tess.png", accent: "#D9A04E" },
  line: "The salad machine needs power. What should we do?",
  voiceLine: "The salad machine needs power. What should we do?",
  replies: [
    { id: "fix", label: "Help Tess", glyph: "wrench", voiceLine: "Help Tess fix it." },
    { id: "soup", label: "Make soup", glyph: "soup", voiceLine: "Make soup instead." },
    { id: "iris", label: "Ask Iris", glyph: "robot", voiceLine: "Ask Iris for help." },
  ],
};

export function registerCrewDialogue(registry: UIRegistry): void {
  registry.register("UI-MOLECULE-HUD-REPLY", {
    metadata: { layer: "molecule", name: "HUD reply", figmaNodeId: "1:12", description: "Outlined reply led by a large icon (R1, R6, R9)." },
    variants: { Help: { glyph: "wrench", label: "Help Tess", voiceLine: "Help Tess fix it." },
      Soup: { glyph: "soup", label: "Make soup", voiceLine: "Make soup instead." } } as const,
    parse: parseHudReplyParams, render: createHudReply,
  });
  registry.register("UI-ORGANISM-CREW-DIALOGUE", {
    metadata: { layer: "organism", name: "Crew dialogue", figmaNodeId: "1:12",
      description: "Single cut-corner bar: portrait, divider, voiced line and up to three icon replies." },
    variants: { Tess: {} },
    parse: () => ({}),
    render: () => {
      const box = document.createElement("div");
      box.className = "ui-crew-dialogue-showcase ui-game-hud";
      box.append(createCrewDialogue(TESS_DISPENSER_DIALOGUE).root);
      return box;
    },
  });
}
