import { createHudMeter, createHudTab, voiceText, type UIHudGlyph } from "../atoms/hud-atoms";
import { createHudReply } from "../organisms/crew-dialogue";
import type { UIRegistry } from "../registry";
import type { Level } from "../state/settings";

export interface HudStepperParams {
  label: string;
  glyph: UIHudGlyph;
  level: Level;
  onStep: (delta: -1 | 1) => void;
}

export function createHudStepper({ label, glyph, level, onStep }: HudStepperParams) {
  const root = document.createElement("div");
  root.className = "ui-settings__row ui-hud-stepper";
  const controls = document.createElement("div");
  controls.className = "ui-hud-stepper__controls";
  const stepButton = (delta: -1 | 1) => {
    const name = `${label} ${delta < 0 ? "quieter" : "louder"}`;
    const button = createHudReply({ glyph: delta < 0 ? "minus" : "plus", voiceLine: name });
    button.querySelector(".ui-hud-reply__label")?.remove();
    button.classList.add("ui-hud-stepper__button");
    button.setAttribute("aria-label", name);
    button.addEventListener("click", () => { if (!button.disabled) onStep(delta); });
    return button;
  };
  const minus = stepButton(-1);
  const plus = stepButton(1);
  const meter = document.createElement("div");
  meter.className = "ui-hud-stepper__level";
  meter.setAttribute("role", "meter");
  meter.setAttribute("aria-label", `${label} volume`);
  meter.setAttribute("aria-valuemin", "0");
  meter.setAttribute("aria-valuemax", "4");
  const off = voiceText("span", "ui-hud-stepper__off", "Off", `${label} is off.`);
  controls.append(minus, meter, plus);
  root.append(createHudTab({ label, glyph }), controls);

  function setLevel(value: Level): void {
    const previous = document.activeElement;
    minus.disabled = value === 0;
    plus.disabled = value === 4;
    if (previous === minus && minus.disabled) plus.focus();
    if (previous === plus && plus.disabled) minus.focus();
    meter.setAttribute("aria-valuenow", String(value));
    meter.setAttribute("aria-valuetext", value === 0 ? "Off" : `${value} of 4`);
    off.hidden = value !== 0;
    meter.replaceChildren(createHudMeter({ level: value / 4, cells: 5 }), off);
  }
  setLevel(level);
  return { root, setLevel };
}

export function registerHudStepper(registry: UIRegistry): void {
  registry.register("UI-MOLECULE-HUD-STEPPER", {
    metadata: { layer: "molecule", name: "HUD stepper", figmaNodeId: "1:12", description: "Two volume buttons and a segmented meter." },
    variants: { Default: {} },
    parse: () => ({}),
    render: () => createHudStepper({ label: "Music", glyph: "music", level: 3, onStep: () => {} }).root,
  });
}
