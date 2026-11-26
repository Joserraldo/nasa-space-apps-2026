import { createHudGlyph, createHudTab, type UIHudGlyph } from "../atoms/hud-atoms";
import { createHudReply } from "../organisms/crew-dialogue";
import type { UIRegistry } from "../registry";

export interface HudChoiceOption<T> { value: T; label: string; voiceLine?: string }
interface HudChoiceParams<T> {
  label: string;
  glyph: UIHudGlyph;
  value: T;
  options: readonly [HudChoiceOption<T>, HudChoiceOption<T>, HudChoiceOption<T>?];
  onChange: (value: T) => void;
}

export function createHudChoice<T>({ label, glyph, value, options, onChange }: HudChoiceParams<T>) {
  const root = document.createElement("div");
  root.className = "ui-settings__row ui-hud-choice";
  const choices = document.createElement("div");
  choices.className = "ui-hud-choice__options";
  choices.setAttribute("role", "group");
  choices.setAttribute("aria-label", label);
  const buttons = options.flatMap(option => {
    if (!option) return [];
    const button = createHudReply({ glyph: "none", label: option.label, voiceLine: option.voiceLine ?? option.label });
    const check = createHudGlyph("check", "ui-hud-reply__glyph ui-settings__check");
    button.prepend(check);
    button.addEventListener("click", () => { if (value !== option.value) onChange(option.value); });
    choices.append(button);
    return [{ button, check, value: option.value }];
  });
  root.append(createHudTab({ label, glyph }), choices);

  function setValue(next: T): void {
    value = next;
    for (const option of buttons) {
      const selected = option.value === next;
      option.button.setAttribute("aria-pressed", String(selected));
      if (selected) option.check.removeAttribute("hidden");
      else option.check.setAttribute("hidden", "");
    }
  }
  setValue(value);
  return { root, setValue };
}

export function registerHudChoice(registry: UIRegistry): void {
  registry.register("UI-MOLECULE-HUD-CHOICE", {
    metadata: { layer: "molecule", name: "HUD choice", figmaNodeId: "1:12", description: "A two- or three-option group of reply buttons." },
    variants: { Default: {} },
    parse: () => ({}),
    render: () => {
      const choice = createHudChoice<boolean>({
        label: "Big text", glyph: "text", value: false,
        options: [{ value: false, label: "Off" }, { value: true, label: "On" }],
        onChange: value => choice.setValue(value),
      });
      return choice.root;
    },
  });
}
