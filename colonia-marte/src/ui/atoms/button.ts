import { createIcon, type UIIconInput } from "../foundation/icons";
import type { UIRegistry } from "../registry";
import { asRecord, pickBoolean, pickEnum, pickString } from "../types";

export const BUTTON_STYLES = ["Primary", "Secondary", "Single Stroke", "Transparent"] as const;
export const BUTTON_SIZES = ["Medium", "Large"] as const;

export type UIButtonStyle = (typeof BUTTON_STYLES)[number];
export type UIButtonSize = (typeof BUTTON_SIZES)[number];

export interface UIButtonParams {
  label: string;
  style: UIButtonStyle;
  size: UIButtonSize;
  onDark: boolean;
  onlyIcon: boolean;
  disabled: boolean;
  prefixIcon?: UIIconInput;
  suffixIcon?: UIIconInput;
  id?: string;
  hidden?: boolean;
  ariaPressed?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: (event: MouseEvent) => void;
}

const STYLE_CLASS: Record<UIButtonStyle, string> = {
  "Primary": "ui-btn--primary",
  "Secondary": "ui-btn--secondary",
  "Single Stroke": "ui-btn--single-stroke",
  "Transparent": "ui-btn--transparent",
};

export function parseButtonParams(input: unknown): UIButtonParams {
  const rec = asRecord(input);
  return {
    label: pickString(rec.label, "Engage", "label"),
    style: pickEnum(rec.style, BUTTON_STYLES, "Primary", "style"),
    size: pickEnum(rec.size, BUTTON_SIZES, "Medium", "size"),
    onDark: pickBoolean(rec.onDark, true, "onDark"),
    onlyIcon: pickBoolean(rec.onlyIcon, false, "onlyIcon"),
    disabled: pickBoolean(rec.disabled, false, "disabled"),
    prefixIcon: typeof rec.prefixIcon === "string" ? (rec.prefixIcon as UIIconInput) : undefined,
    suffixIcon: typeof rec.suffixIcon === "string" ? (rec.suffixIcon as UIIconInput) : undefined,
    id: typeof rec.id === "string" ? rec.id : undefined,
    hidden: typeof rec.hidden === "boolean" ? rec.hidden : undefined,
    ariaPressed: typeof rec.ariaPressed === "boolean" ? rec.ariaPressed : undefined,
    type: pickEnum(rec.type, ["button", "submit", "reset"] as const, "button", "type"),
    onClick: typeof rec.onClick === "function" ? (rec.onClick as (event: MouseEvent) => void) : undefined,
  };
}

export function createButton(params: Partial<UIButtonParams> = {}): HTMLButtonElement {
  const parsed = parseButtonParams(params);
  const button = document.createElement("button");
  button.type = parsed.type ?? "button";
  if (parsed.id) button.id = parsed.id;
  if (parsed.hidden) button.hidden = true;
  if (parsed.disabled) button.disabled = true;
  if (parsed.ariaPressed !== undefined) {
    button.setAttribute("aria-pressed", String(parsed.ariaPressed));
  }

  const classes = ["ui-btn", STYLE_CLASS[parsed.style]];
  if (parsed.size === "Large") classes.push("ui-btn--lg");
  if (!parsed.onDark) classes.push("ui-btn--light");
  if (parsed.onlyIcon) classes.push("ui-btn--icon-only");
  button.className = classes.join(" ");

  const iconSize = parsed.size === "Large" ? 18 : 16;
  if (parsed.onlyIcon) {
    button.setAttribute("aria-label", parsed.label);
    button.append(createIcon(parsed.prefixIcon ?? "settings", { size: iconSize }));
  } else {
    if (parsed.prefixIcon) button.append(createIcon(parsed.prefixIcon, { size: iconSize }));
    const text = document.createElement("span");
    text.className = "ui-btn__label";
    text.textContent = parsed.label;
    button.append(text);
    if (parsed.suffixIcon) button.append(createIcon(parsed.suffixIcon, { size: iconSize }));
  }

  if (parsed.onClick) button.addEventListener("click", parsed.onClick);
  return button;
}

export function registerButtonAtom(registry: UIRegistry): void {
  registry.register<UIButtonParams>("UI-ATOM-BUTTON", {
    metadata: {
      layer: "atom",
      name: "Sci-fi Button",
      figmaNodeId: "51:5424",
      description: "Chamfered HUD action button with Primary, Secondary, Single Stroke, and Transparent styles.",
    },
    variants: {
      primaryLarge: parseButtonParams({
        label: "Launch Sequence", style: "Primary", size: "Large", suffixIcon: "arrow-right-02",
      }),
      secondaryMedium: parseButtonParams({
        label: "Calibrate", style: "Secondary", size: "Medium", prefixIcon: "settings",
      }),
      singleStroke: parseButtonParams({
        label: "Diagnostics", style: "Single Stroke", size: "Medium", suffixIcon: "arrow-right-01",
      }),
      transparent: parseButtonParams({
        label: "Dismiss", style: "Transparent", size: "Medium",
      }),
      iconOnly: parseButtonParams({
        label: "Scan sector", style: "Secondary", size: "Medium", onlyIcon: true, prefixIcon: "scan-frame-02",
      }),
    },
    parse: parseButtonParams,
    render: createButton,
  });
}
