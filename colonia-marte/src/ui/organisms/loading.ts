import { createHudFrame, createHudGlyph, hudFrameContent, voiceText } from "../atoms/hud-atoms";
import { MARS_FACTS } from "../content/mars-facts";
import type { UIRegistry } from "../registry";
import { uiText, type UIStrings } from "../i18n";

export function createLoading(fact: string, progress?: number, strings?: UIStrings) {
  const text = uiText(strings);
  const root = document.createElement("section");
  root.className = "ui-loading";
  const frame = createHudFrame({ corner: "octagon", double: false, detail: false });
  const content = hudFrameContent(frame);
  const message = voiceText("p", "ui-loading__message", text("componente.carga.cargando"));
  message.setAttribute("role", "status");
  const bar = document.createElement("progress");
  bar.className = "ui-loading__progress";
  bar.setAttribute("aria-label", text("componente.carga.progreso"));
  bar.setAttribute("max", "1");
  const track = document.createElement("div");
  track.className = "ui-loading__track";
  const segment = document.createElement("span");
  segment.className = "ui-loading__segment";
  segment.setAttribute("aria-hidden", "true");
  track.append(bar, segment);
  function setProgress(value?: number): void {
    if (value === undefined || !Number.isFinite(value) || value < 0 || value > 1) bar.removeAttribute("value");
    else bar.setAttribute("value", String(value));
  }
  setProgress(progress);
  content.append(createHudGlyph("iris", "ui-loading__iris"), message, track, voiceText("p", "ui-loading__fact", fact));
  root.append(frame);
  return { root, setProgress };
}

export function registerLoading(registry: UIRegistry): void {
  registry.register("UI-ORGANISM-LOADING", {
    metadata: { layer: "organism", name: "Loading", figmaNodeId: "1:12", description: "Real or indeterminate progress with one Mars fact." },
    variants: { Indeterminate: {}, Measured: { progress: 0.5 } },
    parse: input => (input as { progress?: number }) ?? {},
    render: ({ progress }) => createLoading(MARS_FACTS[0], progress).root,
  });
}
